"use strict";
window.CT09Tape=Object.freeze({
 duration:43,
 starts:[0,4.8,10.3,15.5,20.3,29.3,38],
 captions:[
  "On a Graphs page, plot f(x) = 2x² − 3.",
  "Open Menu → 5: Trace → 1: Graph Trace. Step along the curve with the arrows.",
  "To jump to a given input, type its x-value and press Enter. Read the second coordinate.",
  "Press Esc to leave Trace. Open a split-screen table with Ctrl + T, or use Menu → 7 → 1.",
  "Auto gives a regular list. Focus the table and use Menu → 2: Table → 5: Edit Table Settings. Change Independent to Ask.",
  "Type the x-values you want in the x column. Read each result from the same row in f₁(x).",
  "Trace locates a point on the graph. A table keeps the results for multiple inputs together."
 ],
 titles:["Plot the function","Open Graph Trace","Enter an x-value","Open the table","Switch Auto to Ask","Enter selected inputs","Choose the right tool"],
 keys:Object.freeze([
  [.42,"2",{raw:"2"}],[.86,"x",{raw:"2x"}],[1.29,"square",{raw:"2x^2"}],[1.75,"minus",{raw:"2x^2-"}],[2.2,"3",{raw:"2x^2-3"}],[3,"enter",{state:"graph"}],
  [5.08,"menu",{state:"main"}],[5.98,"5",{state:"traceMenu"}],[6.92,"1",{state:"trace",cursor:0}],
  [7.85,"right",{cursor:.5}],[8.66,"right",{cursor:1}],
  [10.63,"3",{buffer:"3"}],[11.59,"enter",{buffer:"",cursor:3,committed:true}],
  [15.82,"esc",{state:"graph",committed:false}],[16.7,"ctrl",{}],[17.14,"t",{state:"table",pane:"table",row:0,tableOpen:true}],
  [21.18,"menu",{state:"tableRoot"}],[22.07,"2",{state:"tableMenu"}],[23.1,"5",{state:"settings",setting:0,ask:false,askDraft:false}],
  [24.1,"tab",{setting:1}],[24.76,"tab",{setting:2}],[25.41,"right",{setting:2,dropdown:true}],
  [26.08,"down",{askDraft:true}],[26.78,"enter",{dropdown:false}],[27.4,"tab",{setting:3}],[28,"tab",{setting:4}],
  [28.67,"enter",{state:"table",row:0,ask:true}],
  [29.65,"neg",{buffer:"-"}],[30.12,"1",{buffer:"-1"}],[30.56,"dot",{buffer:"-1."}],[31,"5",{buffer:"-1.5"}],
  [31.9,"enter",{buffer:"",rows:[-1.5],row:1,tableValue:-1.5}],[34.02,"3",{buffer:"3"}],
  [34.96,"enter",{buffer:"",rows:[-1.5,3],row:2,tableValue:3}]
 ].map(([time,key,delta])=>Object.freeze({time,key,delta:Object.freeze(delta)})))
});
