// Materialize only standalone teaching availability, never exam or Practice placement.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const base=new URL('../',import.meta.url);
const read=path=>fs.readFileSync(new URL(path,base),'utf8');
const audit=JSON.parse(read('docs/calculator-skills/course-topic-audit.json'));
assert.equal(audit.firstAssessment,2021);
assert.equal(audit.placeOnActualExamQuestions,false);

const courses=['aa-sl','aa-hl','ai-sl','ai-hl'];
assert.deepEqual(Object.keys(audit.courses),courses);
// Only audited limited uses with a working, honestly named path appear.
const scoped={
 'CT03':{
  'ai-sl':{title:'Calculate a binomial coefficient with nCr',path:'counting-ai/index.html',topics:['4'],note:'Use the combinations key to find a binomial coefficient.'},
  'ai-hl':{title:'Calculate a binomial coefficient with nCr',path:'counting-ai/index.html',topics:['4'],note:'Use the combinations key to find a binomial coefficient.'}
 },
 'CT07':{'aa-sl':{note:'Solve or check a pair of linear equations in an applied problem.'}},
 'CT15':{'ai-sl':{title:'Graph a model on a restricted domain',note:'Follow the interval restrictions and check which expression applies at the boundary.'}},
 'CT46':{'ai-sl':{title:'Pooled two-sample t-test',note:'Compare two independent means using the pooled option in Try.',params:{mode:'try'}}},
 'CT54':{'ai-sl':{title:'Area under a positive curve',note:'Find the area between a positive curve and the x-axis.',params:{mode:'try',expr:'x+1',lower:'0',upper:'4'}}}
};
const omitted={
 'CT13':{'ai-sl':'The worked and default Try examples use rational graphs with denominator exclusions. CT16 covers a model threshold.'},
 'CT14':{'ai-sl':'The lesson only works through abstract exhaustive equations, not a contextual AI SL sinusoidal model.'},
 'CT41':{'ai-sl':'Unknown normal parameters are enrichment; CT40 is the direct method.','ai-hl':'Unknown normal parameters are enrichment; CT40 is the direct method.'},
 'CT55':{'ai-hl':'Area between two curves is enrichment for AI HL, not its direct integration workflow.'}
};
const skills={};
const markCounts=Object.fromEntries(courses.map(c=>[c,{D:0,L:0,'-':0}]));
const scopedCounts=Object.fromEntries(courses.map(c=>[c,0]));
const used=new Set(), sourceRows=new Set();
const copy=JSON.parse(read('docs/calculator-skills/catalogue-copy.json'));
const topicIds=new Set(['1','2','3','4','5','start']);
const crossTopic={
 'CT01':['start'],'CT02':['start'],'CT06':['1'],'CT07':['1'],'CT08':['start'],
 'CT09':['1'],'CT12':['2'],'CT16':['1'],'CT24':['1'],'CT31':['2'],
 'CT32':['4'],'CT33':['4'],'CT34':['4']
};
const validTopics=(ids,label)=>{
 assert(ids.length>0&&ids.every(v=>topicIds.has(v))&&new Set(ids).size===ids.length,label+' topic tags');
 return ids;
};

for(const {id,topic,coverage} of audit.entries){
 assert.match(id,/^CT\d{2}$/);assert(!sourceRows.has(id),id);sourceRows.add(id);
 assert.deepEqual(Object.keys(coverage),courses,id+' course columns');
 const direct=[];
 for(const c of courses){
  const v=coverage[c], special=scoped[id]?.[c], reason=omitted[id]?.[c];
  assert(['D','L','-'].includes(v),id+' mark '+c);markCounts[c][v]++;
  if(v==='D'){assert(!special&&!reason);direct.push(c);}
  if(v==='-')assert(!special&&!reason);
  if(v==='L'){
   assert(Boolean(special)!==Boolean(reason),id+' limited case must declare a decision: '+c);
   used.add(id+'/'+c);
   if(special){
    scopedCounts[c]++;
    if(special.topics)validTopics(special.topics,id+'/'+c);
    if(special.path){
     assert.match(special.path,/^[a-z][a-z0-9-]*\/index\.html$/);
     assert.match(read('calculator-skills/'+special.path),/watch-bootstrap\.js/,id+'/'+c+' uses the shared Watch template');
     const spec=JSON.parse(read('calculator-skills/'+special.path.replace('index.html','definition.json')));
     assert.equal(spec.id,id+'-ai',id+'/'+c+' dedicated AI lesson');
    }
   }
  }
 }
 assert(typeof copy[id]==='string'&&copy[id].length>=15&&copy[id].length<135,id+' concise student description');
 skills[id]={direct,topics:validTopics([String(topic),...(crossTopic[id]??[])],id),description:copy[id],...(scoped[id]?{scoped:scoped[id]}:{})};
}
assert.equal(sourceRows.size,audit.library.canonicalSkills);
assert.deepEqual(Object.keys(copy),[...sourceRows]);
for(const c of courses){
 assert.deepEqual(markCounts[c],{D:audit.courses[c].direct,L:audit.courses[c].limited,'-':audit.courses[c].notMapped});
}
for(const reviews of [scoped,omitted])for(const [id,exceptions] of Object.entries(reviews))for(const c of Object.keys(exceptions))assert(used.has(id+'/'+c),id+' not a limited exception: '+c);

// These are separate teaching routes, not permission inherited from the parent card.
const companions={
 'linear-system-three/index.html':{parent:'CT07',title:'Solve a 3×3 linear system',topics:['1','2'],description:'Use LinSolve with three equations in x, y and z.',direct:['aa-hl','ai-sl','ai-hl'],keywords:'linsolve simultaneous three equations three unknowns'},
 'maximum/index.html':{parent:'CT12',title:'Find a graph maximum',topics:['5','2'],description:'Check the highest point and compare it with the endpoints.',direct:[...courses]},
 'histogram/index.html':{parent:'CT30',title:'Frequency histograms',topics:['4'],description:'Use equal-width bars to display and compare frequencies.',direct:['ai-sl','ai-hl'],note:'Use equal-width bins and count frequencies below a cutoff. This is not a cumulative-frequency graph.'}
};
const foundations={
 'handset-keys/index.html':{id:'SUP-HANDSET-KEYS',title:'Find your way around the keypad',topics:['start'],direct:[...courses],note:'Find trig, equals, minus and fractions. Try exact and decimal answers.'},
 'handset-settings/index.html':{id:'SUP-HANDSET-SETTINGS',title:'Set up your TI-Nspire',topics:['start'],direct:[...courses],note:'Find Display Digits, Angle and Calculation Mode.'}
};
for(const [route,entry] of Object.entries(foundations)){
 validTopics(entry.topics,entry.id);
 const definition=JSON.parse(read('calculator-skills/'+route.replace('index.html','definition.json')));
 assert.equal(definition.id,entry.id,route+' shared Watch ID');
 assert.match(read('calculator-skills/'+route),/watch-bootstrap\.js/,route+' must use shared Watch bootstrap');
}
const context={window:{}};
vm.runInNewContext(read('calculator-skills/handheld-catalog-routes.js'),context);
const registry=context.window.HANDHELD_CATALOG_ROUTES;
assert.deepEqual(Object.keys(registry.skills),[...sourceRows]);
const paths=new Set();
for(const [id,rows] of Object.entries(registry.companions)){
 for(const row of rows){
  assert(!paths.has(row.path),row.path);paths.add(row.path);
  assert.equal(companions[row.path]?.parent,id,row.path+' course scope required');
  assert(fs.existsSync(new URL('calculator-skills/'+row.path,base)),row.path);
 }
}
assert.deepEqual([...paths],Object.keys(companions));
for(const [route,entry] of Object.entries(companions))validTopics(entry.topics,route);

const lines=record=>Object.entries(record).map(([k,v])=>'  '+JSON.stringify(k)+':'+JSON.stringify(v)).join(',\n');
const out='/* Generated by scripts/check-calculator-catalogue.mjs --write from the audited 2021 teaching matrix. */\n'+
 'window.CALCULATOR_COURSE_SCOPE={skills:{\n'+lines(skills)+'\n},companions:{\n'+lines(companions)+'\n},foundations:{\n'+lines(foundations)+'\n}};\n';
const runtime='calculator-skills/guide-course-scope.js';
if(process.argv.includes('--write'))fs.writeFileSync(new URL(runtime,base),out);
assert.equal(read(runtime),out,'course scope is stale; run node scripts/check-calculator-catalogue.mjs --write');
console.log(courses.map(c=>{
 const n=Object.values(companions).filter(v=>v.direct.includes(c)).length;
 const f=Object.values(foundations).filter(v=>v.direct.includes(c)).length;
 return `${c} ${markCounts[c].D+scopedCounts[c]} skills + ${n} companion${n===1?'':'s'} + ${f} getting-started guides`;
}).join('; '));
