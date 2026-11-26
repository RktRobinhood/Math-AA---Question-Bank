import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
require('../calculator-skills/handheld/hold-timeline.js');
require('../calculator-skills/handheld/key-cues.js');
const {makeLayout,demoTime,beats,keyName}=await import('../calculator-skills/solve/watch-plan.js');
const {solveInBounds}=await import('../calculator-skills/solve/solver.js');

const events=globalThis.HandheldKeyCues.CT06;
const normal=makeLayout();
assert.equal(Math.round(normal.duration*100),9712);
assert(Math.round(makeLayout(.7).duration)>75);
assert(Math.round(makeLayout(1.4).duration)>120);

function watchHits(layout){
 let lastDemo=-1,lastEvent=-1;const times=[];
 for(let t=0;t<=layout.duration+.005;t+=.005){
  const position=layout.at(t), demo=demoTime(position);
  assert(demo>=lastDemo-1e-8,'Demo clock never moves backward');
  lastDemo=demo;
  const current=events.findLastIndex(e=>e.timeMs/1000<=demo);
  if(current!==lastEvent){
   assert.equal(current,lastEvent+1,'No hidden/reordered press');
   assert.equal(position.speaking,false,'Actions advance only in teaching holds');
   times.push(t);lastEvent=current;
  }
 }
 assert.equal(times.length,33);
 return times;
}
const hits=watchHits(normal);
watchHits(makeLayout(.7));watchHits(makeLayout(1.4));
assert(Math.min(...hits.slice(1).map((at,i)=>at-hits[i]))>.53,'Allow time to follow every key');
const labels=events.map(e=>keyName(e.key));
assert.deepEqual(labels.slice(0,3),['Menu','3','1']);
assert.deepEqual(labels.slice(3,13),['2','^','x','→','=','x','+','4',',','x']);
assert.deepEqual(labels.slice(19),['↑','↑','Enter','←','Del','Del','Del','(−)','4',',','(−)','3','→','Enter']);
assert.equal(solveInBounds('2^x=x+4',2,3).rounded,'2.76');
assert.equal(solveInBounds('2^x=x+4',-4,-3).rounded,'-3.93');
assert(beats[3][1]<20.503&&beats[3][4]>20.503,'First Enter before audible result sentence');
const slow=makeLayout(1.4);
for(const t of [1,10,12,16,22,52,73,95]){
 const a=normal.at(t),b=slow.at(slow.remap(normal,t));
 assert(Math.abs(a.audioTime-b.audioTime)<1e-8);
 assert(Math.abs(demoTime(a)-demoTime(b))<1e-8);
}
console.log('Numerical Solve Watch: 33 uninterrupted key events, two verified roots and invariant cue remaps.');
