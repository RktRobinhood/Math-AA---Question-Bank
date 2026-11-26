"use strict";
(function(root){
 // Cuts are inside long silence in the signed original clip. The
 // demonstration cursor has its own clock and never stretches the voice.
 const beats=[
  [0,2.67,16.0,0,2.50],
  [2.67,5.88,8.1,2.50,5.78],
  [5.88,7.73,8.6,5.78,6.86],
  [7.73,10.47,3.6,6.86,10.80],
  [10.47,14.60,17.5,10.80,14.42],
  [14.60,16.32,5.0,14.42,15.20],
  [16.32,20.17,8.4,15.20,16.60]
 ];
 const keys=root.CT11Tape.keys;
 const bands=beats.map(([,,,from,to])=>[
  {time:from,index:-1},...keys.map((e,index)=>({time:e.time,index})).filter(e=>e.time>from&&e.time<to),{time:to,index:-1}
 ]);
 function position(point){
  const marks=bands[point.span.i];
  if(point.speaking)return {time:marks[0].time,lit:-1};
  const bounded=Math.max(0,Math.min(1,(point.fraction-.045)/.87));
  const step=(marks.length-1)*bounded,i=Math.min(Math.floor(step),marks.length-2),f=step-i;
  return {time:marks[i].time+(marks[i+1].time-marks[i].time)*f,lit:f<.54?marks[i].index:-1};
 }
 root.CT11Plan=Object.freeze({make:scale=>root.TeachingHolds.make(beats,scale),position});
})(globalThis);
