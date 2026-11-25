"use strict";
window.CT16Tape=Object.freeze({
 duration:37.5,
 starts:[0,9.4,13.5,20.6,26.8],
 captionStarts:[0,1.9,6.2,9.4,13.5,16.3,20.6,24,26.8,30.4,34.1],
 captions:[
  "A culture is ready at 12 units. How soon?", "Enter the growth model in f₁.", "In f₂, enter 12 for the horizontal target.",
  "Press Menu, 6: Analyze Graph, 4: Intersection.", "Put the lower bound at day 2. Press Enter.",
  "Put the upper bound at day 3. Press Enter.", "The x-coordinate is the continuous time: about 2.16 days.",
  "If you can check only once per whole day, don’t round to the nearest day.",
  "At day 2, the model is only 11.25 units.", "At day 3, it is 16.875 units. That meets the target.",
  "The model rises, so day 3 is the first eligible whole day."
 ],
 titles:["Plot the model and target","Open Intersection","Bracket in the time domain","Read the time","Check the whole days"],
 keys:Object.freeze([
  [2.03,"5",{first:"5"}],[2.39,"mul",{first:"5*"}],[2.74,"1",{first:"5*1"}],[3.06,"dot",{first:"5*1."}],[3.39,"5",{first:"5*1.5"}],[3.72,"power",{first:"5*1.5^"}],[4.12,"x",{first:"5*1.5^x"}],[4.62,"enter",{firstPlot:true,state:"plotted"}],
  [6.24,"tab",{active:1,state:"entry"}],[6.62,"1",{second:"1"}],[7.01,"2",{second:"12"}],[7.68,"enter",{secondPlot:true,state:"plotted"}],
  [9.45,"menu",{state:"menu"}],[10.67,"6",{state:"submenu"}],[12.09,"4",{state:"lower",cursor:1.5}],
  [13.72,"2",{typed:"2",cursor:2}],[15.09,"enter",{state:"upper",low:2,typed:""}],
  [16.82,"3",{typed:"3",cursor:3}],[18.95,"enter",{state:"result",high:3,typed:"",mark:{x:Math.log(12/5)/Math.log(1.5),y:12}}]
 ].map(([time,key,delta])=>Object.freeze({time,key,delta:Object.freeze(delta)})))
});
