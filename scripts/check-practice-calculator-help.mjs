import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import vm from 'node:vm';
import {loadEngine} from './lib/practice-build.mjs';
import {WATCH} from '../calculator-skills/solve/solver.js';
const require=createRequire(import.meta.url);
const {eligible,helpFor}=require('../assets/js/practice-calculator.js');
const E=loadEngine();
const browser={window:{}};
vm.runInNewContext(fs.readFileSync(new URL('../assets/js/question-types.js',import.meta.url),'utf8'),browser);
E.useCatalogue(browser.window.QB_TYPES);
const type='fn-scale-gdc-nonpolynomial-two-crossings';
const types=[type,'fn-gdc-solve-equation','fn-gdc-intersection','w4-fn-refine-bracket'];
const watch=WATCH.equation.match(/^(\d+)\^x=x\+(\d+)$/);
assert(watch, 'Review the same-example check before changing the Watch equation');
const seen={matched:0, same:0, other:0};
for(const course of ['aa-sl','aa-hl','ai-sl','ai-hl'])
for(const g of E.generators({course}).filter(g=>types.includes(g.type))){
 for(const level of g.levels){
  for(let seed=0;seed<300;seed++){
   const q=E.make({course,generator:g.id,level,seed});
   const context={item:{kind:'generated'},question:q,course:q.course};
   const duplicate=q.type===type&&q.params.b===+watch[1]&&q.params.a===+watch[2];
   const should=eligible(context)&&!duplicate&&(q.type===type||(q.type===types[1]&&q.unknown==='solve-mixed-equation'));
   assert.equal(Boolean(helpFor(q)),should,q.id);
   seen[should?'matched':duplicate?'same':'other']++;
   if(should)assert.deepEqual(helpFor(q),{title:'Numerical Solve',path:'calculator-skills/solve/index.html?embed=practice'});
   assert(!eligible({...context,item:{kind:'real'}}));
   assert(!eligible({...context,tab:'worksheet'}));
  }
 }
}
assert(seen.matched>500&&seen.same>10&&seen.other>400,JSON.stringify(seen));
assert(!helpFor({type:'constructor',calculator:true}));
assert(!helpFor({type,calculator:true,params:{b:'2',a:4}}));
console.log('Practice calculator help eligible forms, duplicate example and negative checks',seen);
