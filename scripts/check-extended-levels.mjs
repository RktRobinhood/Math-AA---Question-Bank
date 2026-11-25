/* Native adaptive routes; run in an integrated bank checkout after build-practice.mjs. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {ROOT,loadEngine} from './lib/practice-build.mjs';

const ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(ROOT,'assets/js/question-types.js'),'utf8'),ctx);
const cat=ctx.window.QB_TYPES;
const E=loadEngine();
E.useCatalogue(cat);
const L=E.learner;
const fresh=(course)=>L.createLearner({course,catalogue:cat,backend:L.memoryBackend(),now:()=>1800000000000,config:{startLevel:1}});
const act=(lr,item,correct=true)=>{
  assert.notEqual(item.kind,'none');
  return lr.record(item,{correct,selfMarked:item.kind==='real',timeMs:450});
};

const cohort=Object.keys(cat.courses);
const courseDesc=E.generators({course:'aa-sl'}).filter(g=>g.type.includes('-ext-rung-'));
let seen=0, remapped=0;
assert.equal(courseDesc.length,10);
for (const course of cohort) {
  const offered=E.generators({course}).filter(g=>g.type.includes('-ext-rung-'));
  assert.equal(offered.length,10);
  for (const g of offered) {
    const name=g.id;
    const level=g.levels[0];
    const home=courseDesc.find(x=>x.id===name);
    const expected=home.statements.map(id=>cat.statements[course].find(s=>s.id===id).code);
    assert.deepEqual(Array.from(g.syllabus),expected);
    for(let seed=1;seed<=300;seed++){
      const q=E.make({course,generator:name,level,seed});
      const baseline=E.make({course:'aa-sl',generator:name,level,seed});
      assert.equal(q.stem,baseline.stem);
      assert.deepEqual(q.parts,baseline.parts);
      assert.deepEqual(Array.from(q.syllabus),expected);
      assert.ok(q.id.startsWith(course+':'));
      remapped++;
    }
    const lr=fresh(course);
    for (const code of g.syllabus) {
      assert.ok(lr.levelsOf(code).every(l=>l>=1&&l<=4));
      assert.ok(!lr.typesOf(code).some(t=>t.id===g.type));
    }
    const fixed=lr.next([expected[0]],{levels:[1,2,3,4]});
    assert.notEqual(fixed.kind,'none');
    if (fixed.kind==='generated') assert.ok(fixed.level>=1&&fixed.level<=4);
    const state=()=>lr.state.courses[course];
    if(level===0){
      const target=expected[0];
      assert.ok(lr.prerequisites(target).some(x=>x.kind==='type'&&x.id===g.type));
      let targetServed=0, returned=false, descended=false;
      for(let turn=0;turn<50;turn++){
        const it=lr.next([target]);
        if(it.reason==='refresh'&&it.type===g.type){
          assert.equal(it.level,0);
          assert.equal(it.refreshFor,target);
          targetServed++;
        }
        if(descended&&it.reason!=='refresh'){returned=true;break;}
        const result=act(lr,it,turn>=2);
        if(result.change?.kind==='refresh-start') descended=true;
      }
      assert.ok(descended&&returned&&targetServed>=2,course+' '+g.id+' did not go down, serve, then return');
    }else{
      // First master just the primary strand; neither a round of exam questions
      // nor a ready primary strand alone can release this link.
      const primary=expected[0];
      for(let turn=0;turn<20;turn++){
        const it=lr.next([primary]);
        assert.notEqual(it.question?.generator,name);
        if (it.kind==='generated') assert.ok(it.level>=1&&it.level<=5);
        act(lr,it);
      }
      assert.equal(state().units[primary].rung,'exam');
      assert.ok(expected.slice(1).every(code=>state().units[code]?.rung!=='exam'));
      let mixed=false;
      for(let turn=0;turn<100;turn++){
        const it=lr.next(expected);
        if(it.question?.generator===name){
          assert.equal(it.reason,'synoptic');
          assert.equal(it.level,5);
          assert.ok(expected.every(code=>state().units[code].rung==='exam'));
          const status=expected.map(code=>[state().units[code].rung,state().units[code].level]);
          act(lr,it,false); // a missed synoptic should not lower any rung.
          assert.deepEqual(expected.map(code=>[state().units[code].rung,state().units[code].level]),status);
          assert.equal(state().sinceSynoptic,0);
          mixed=true;break;
        }
        act(lr,it);
      }
      assert.ok(mixed,course+' '+g.id+' did not reach the native synoptic route');
      const bank=state();
      bank.sinceSynoptic=100;
      assert.ok(expected.every(code=>bank.units[code].rung==='exam'));
      const scoped=lr.next([primary]);
      assert.notEqual(scoped.reason,'synoptic','previously mastered but excluded strands must not unlock a mixed question');
      const choices=lr.typesOf(primary);
      if(choices.length>1){
        bank.sinceSynoptic=100;
        const narrowed=lr.next(expected,{types:{[primary]:[choices[0].id]}});
        if(narrowed.reason==='synoptic')assert.ok(!narrowed.question.syllabus.includes(primary),'a synoptic item ignored the specified question types');
      }

    }
    seen++;
  }
}
console.log('Extended levels: '+seen+' course/family routes passed across '+remapped+' course/seed checks; fixed levels unchanged; native prerequisite and synoptic eligibility verified.');
