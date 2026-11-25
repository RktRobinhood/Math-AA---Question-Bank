"use strict";
/* Silent rehearsal cue timing; no voice media or simulated audio clock. */
window.CT51Tape=Object.freeze({
 duration:23,
 starts:[0,5.1,9,14.5,18.7],
 captions:[
  "On a Graphs page, plot f(x) = x³ + x.",
  "Open Menu → 6: Analyze Graph → 5: dy/dx.",
  "Move to the point on the curve at x = 2, then click. You select one point, not two bounds.",
  "The graph reports the slope. Evaluate f(2) separately to find the point on the curve.",
  "Put the slope and the point into point–slope form."
 ],
 titles:["Plot the function","Open dy/dx","Select one point","Read slope and height","Write the tangent equation"],
 keys:Object.freeze([
  [.52,"x",{raw:"x"}],[.93,"power",{raw:"x^"}],[1.34,"3",{raw:"x^3"}],
  [1.89,"right",{}],[2.25,"plus",{raw:"x^3+"}],[2.65,"x",{raw:"x^3+x"}],[3.24,"enter",{state:"plotted"}],
  [5.36,"menu",{state:"menu"}],[6.15,"6",{state:"submenu"}],[7.21,"5",{state:"point",cursor:1}],
  [9.48,"right",{cursor:1.25}],[10.08,"right",{cursor:1.5}],[10.65,"right",{cursor:1.75}],[11.17,"right",{cursor:2}],
  [13.55,"select",{state:"result",x:2}]
 ].map(([time,key,delta])=>Object.freeze({time,key,delta:Object.freeze(delta)})))
});
