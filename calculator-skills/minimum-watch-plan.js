// Original decoded Graph Minimum narration, cut only inside measured silence.
// Demo time is separate: move the LCD and physical keys in the teaching holds.
import './handheld/hold-timeline.js';
export const beats = [
 [0,4.85,10.6,0,4.85],
 [4.85,9.63,6.8,4.85,9.40],
 [9.63,13.20,4.4,9.40,14.00],
 [13.20,18.85,8.2,14.00,18.25],
 [18.85,23.62,8.2,18.25,23.67],
 [23.62,26.40,3.5,23.67,24.80],
 [26.40,30.00,2.8,24.80,29.80],
 [30.00,33.00,2.1,29.80,32.70],
 [33.00,35.65,4.9,32.70,35.60]
];
export const pin={timeMs:34000,key:'enter',durationMs:300,state:'pinned'};
export const tape=[...globalThis.HandheldKeyCues.CT12,pin];
export const makeLayout=(holdScale=1)=>globalThis.TeachingHolds.make(beats,holdScale);
const windows=beats.map(([,,,from,to])=>[from,...tape.filter(e=>e.timeMs/1000>from&&e.timeMs/1000<to).map(e=>e.timeMs/1000),to]);
export function demoTime(point){
 const marks=windows[point.span.i];
 if(point.speaking)return marks[0];
 const fraction=Math.max(0,Math.min(1,(point.fraction-.07)/.86));
 // The two bounds use continuous original cursor motion, including dwell after Enter.
 if(point.span.i===3||point.span.i===4)return marks[0]+(marks.at(-1)-marks[0])*fraction;
 const step=(marks.length-1)*fraction,i=Math.min(Math.floor(step),marks.length-2);
 return marks[i]+(marks[i+1]-marks[i])*(step-i);
}
