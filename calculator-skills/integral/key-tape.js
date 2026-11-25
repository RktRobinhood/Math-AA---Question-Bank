"use strict";
window.CT54Tape=Object.freeze({
 duration:27.8,
 starts:[0,4.7,10.4,16.5,21.5],
 titles:["Plot the function","Open Integral","Confirm both bounds","Read the signed integral","Split for geometric area"],
 captionStarts:[0,4.7,9.1,10.4,13.0,16.5,21.5,24.7],
 captions:[
  "Plot f(x) = x − 3 on a Graphs page.",
  "Open Menu → 6: Analyze Graph → 6: Integral.",
  "This page contains one curve. If prompted on your handheld, select the curve first.",
  "Type 0 for the lower bound and press Enter.",
  "Type 4 for the upper bound and press Enter.",
  "The integral is −4. The contribution below the x-axis is negative.",
  "For geometric area, split where the graph crosses the axis, at x = 3.",
  "Add the magnitudes: 4.5 below and 0.5 above. Total geometric area is 5."
 ],
 keys:Object.freeze([
  [0.55,"x",{raw:"x"}],[1.15,"minus",{raw:"x-"}],[1.77,"3",{raw:"x-3"}],[2.65,"enter",{state:"plotted"}],
  [4.98,"menu",{state:"menu",menuIndex:0}],[5.92,"6",{state:"submenu",subIndex:0}],
  [7.55,"6",{state:"lower",cursor:2.5}],
  [10.72,"0",{cursor:0,draft:"0"}],[11.88,"enter",{state:"upper",low:0,draft:""}],
  [13.42,"4",{cursor:4,draft:"4"}],[15.13,"enter",{state:"result",high:4,draft:""}],
  [21.50,"",{teaching:true}]
 ].map(([time,key,delta])=>Object.freeze({time,key,delta:Object.freeze(delta)})))
});
