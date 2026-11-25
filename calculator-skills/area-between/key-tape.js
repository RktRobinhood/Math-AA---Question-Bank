"use strict";
window.CT55Tape=Object.freeze({
 duration:38.5,
 starts:[0,5.7,10.0,15.5,25.0,34.4],
 titles:["Plot both curves","Find the crossing","Open Bounded Area","Measure the left region","Measure the right region","Add the two areas"],
 captionStarts:[0,2.6,5.7,10.0,13.85,15.5,18.8,21.5,25,28.2,31,34.4,36.3],
 captions:[
  "In Graphs, enter f₁(x) = x + 1 and press Enter.",
  "Press Tab. Enter f₂(x) = 3 and press Enter.",
  "From x = 0 to x = 5, the curves cross at x = 2. The upper curve changes there.",
  "Open Menu and choose Analyze Graph, then Bounded Area.",
  "With exactly two eligible curves, the tool selects them automatically.",
  "For the left region, type 0 and press Enter.",
  "Type 2 and press Enter. That stops the region at the crossing.",
  "The left region has area 2. Here the horizontal line is on top.",
  "Run Bounded Area again for the right region.",
  "Type 2 and press Enter. Then type 5 and press Enter.",
  "The right region has area 4.5. Now the sloping line is on top.",
  "Add the positive areas: 2 + 4.5 = 6.5 square units.",
  "When the upper curve changes, split there before calculating the area."
 ],
 keys:Object.freeze([
  [.35,"x",{raw:["x",""]}],[.88,"plus",{raw:["x+",""]}],[1.40,"1",{raw:["x+1",""]}],[2.0,"enter",{state:"plotted",shown:1}],
  [2.86,"tab",{state:"entry",slot:1}],[3.55,"3",{raw:["x+1","3"]}],[4.5,"enter",{state:"plotted",shown:2}],
  [5.7,"",{markCross:true}],[10.33,"menu",{state:"menu",menuIndex:0}],[11.22,"6",{state:"submenu",subIndex:0}],
  [11.64,"down",{subIndex:1}],[11.97,"down",{subIndex:2}],[12.30,"down",{subIndex:3}],[12.63,"down",{subIndex:4}],[12.96,"down",{subIndex:5}],[13.29,"down",{subIndex:6}],[13.78,"enter",{state:"lower",cursor:2.5,markCross:false}],[15.89,"0",{cursor:0,draft:"0"}],
  [17.28,"enter",{state:"upper",low:0,draft:""}],[19.02,"2",{cursor:2,draft:"2"}],
  [20.42,"enter",{state:"result",high:2,draft:"",count:1}],[25.19,"menu",{state:"menu",menuIndex:0,low:null,high:null}],
  [25.97,"6",{state:"submenu",subIndex:0}],[26.30,"down",{subIndex:1}],[26.61,"down",{subIndex:2}],[26.92,"down",{subIndex:3}],[27.23,"down",{subIndex:4}],[27.54,"down",{subIndex:5}],[27.85,"down",{subIndex:6}],[28.17,"enter",{state:"lower",cursor:2}],
  [28.47,"2",{cursor:2,draft:"2"}],[29.08,"enter",{state:"upper",low:2,draft:""}],
  [29.83,"5",{cursor:5,draft:"5"}],[30.63,"enter",{state:"result",high:5,draft:"",count:2}]
 ].map(([time,key,delta])=>Object.freeze({time,key,delta:Object.freeze(delta)})))
});
