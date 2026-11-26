import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {validate,stateAt}=require('../calculator-skills/handheld/watch-lesson.js');
require('../calculator-skills/handheld/hold-timeline.js');

const spec={
 id:'CT01',title:'Calculator Walkthrough',intro:'Follow two steps.',
 chapters:[{id:'entry',title:'Enter'},{id:'answer',title:'Read the result'}],
 beats:[
  {chapter:'entry',end:2,hold:4,coach:'Watch the entry.',spoken:'Enter the numbers.',keys:[
   {id:'two',label:'2',at:.2},{id:'add',label:'+',at:.45},{id:'three',label:'3',at:.7}]},
  {chapter:'answer',end:4,hold:2,coach:'Read the result.',spoken:'Then read the result.',keys:[{id:'evaluate',label:'Enter',at:.3}]}
 ]
};
const a=validate(spec), h=TeachingHolds.make([[0,2,4],[2,4,2]]);
assert.equal(h.duration,10);
assert.deepEqual(a.groups.map(g=>g.keys.length),[3,1]);
assert.equal(stateAt(h,a,2).key,null);
assert.equal(stateAt(h,a,3).key.id,'two');
assert.deepEqual(stateAt(h,a,7).crossed.map(k=>k.id),['two','add','three']);
assert.equal(stateAt(h,a,9).key.id,'evaluate');
assert.equal(stateAt(h,a,1).crossed.length,0);
const slowed=TeachingHolds.make([[0,2,4],[2,4,2]],1.4);
for(const t of [0,1,2,3,5,7,9,10]){
 const next=slowed.remap(h,t);
 assert.equal(stateAt(slowed,a,next).key?.id,stateAt(h,a,t).key?.id);
}
function bad(mut){const x=structuredClone(spec);mut(x);assert.throws(()=>validate(x),/Watch lesson/);}
assert.doesNotThrow(()=>validate({...spec,initialFraming:'full'}));
bad(x=>x.initialFraming='fullscreen');
bad(x=>delete x.chapters[0].id);
bad(x=>x.chapters[1].id='entry');
bad(x=>x.beats[1].keys[0].id=x.beats[0].keys[0].id);
bad(x=>x.beats[0].keys[1].at=0);
bad(x=>x.beats[0].hold=0);
bad(x=>x.beats[0].end=0);
bad(x=>delete x.beats[0].spoken);
bad(x=>x.recording={file:'wrong.mp3',audioSha256:'10',scriptSha256:'13'});
console.log('Watch template: ordered chapter/action validation, deterministic seek, pause remapping, and invalid data guards pass.');
