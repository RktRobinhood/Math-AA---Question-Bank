"use strict";
window.CT11Tape=Object.freeze({
 duration:20.323265,
 starts:[0,5.8,10.78,15.04],
 captionStarts:[0,2.92,6.50,8.26,10.78,15.04,16.60],
 captions:[
  "Plot both functions on the same page.",
  "Look for the crossing that matches the requested point.",
  "Choose Intersection.",
  "Select the relevant graphs if prompted.",
  "Bracket one crossing at a time with the lower and upper bounds.",
  "Read the coordinates.",
  "At the intersection, both expressions give the same y-value."
 ],
 titles:["Plot both functions","Open Intersection","Bracket one crossing","Read the ordered pair"],
 keys:Object.freeze([
  [.16,"x",{first:"x"}],[.43,"square",{first:"x^2"}],[.72,"enter",{firstPlot:true,state:"plotted"}],
  [1.03,"tab",{active:1,state:"entry"}],[1.28,"2",{second:"2"}],[1.51,"x",{second:"2x"}],[1.73,"plus",{second:"2x+"}],[1.97,"3",{second:"2x+3"}],[2.32,"enter",{secondPlot:true,state:"plotted"}],
  [5.81,"menu",{state:"menu"}],[6.21,"6",{state:"submenu"}],[6.76,"4",{state:"lower",cursor:1.5}],
  [11.52,"right",{cursor:2}],[12.74,"enter",{state:"upper",low:2}],
  [12.99,"right",{cursor:2.5}],[13.23,"right",{cursor:3}],[13.47,"right",{cursor:3.5}],[13.71,"right",{cursor:4}],
  [14.07,"enter",{state:"result",high:4,mark:{x:3,y:9}}]
 ].map(([time,key,delta])=>Object.freeze({time,key,delta:Object.freeze(delta)})))
});
