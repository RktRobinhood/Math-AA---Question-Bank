"use strict";
/* Guide audio boundaries verified separately; each animation event can be sought independently. */
window.CT10Tape=Object.freeze({
 duration:24.659592,
 starts:[0,5.406,11.744,17.828],
 captionStarts:[0,1.6,5.406,8.68,11.66,14.9,17.828,19.82],
 captions:[
  "Plot the function.",
  "A zero is an x value for which the function is zero.",
  "Open Analyze Graph and choose Zero.",
  "If prompted, select the curve to analyze.",
  "Place one bound on each side of the crossing.",
  "Keep other zeros outside those bounds.",
  "Read the x-coordinate.",
  "For a y-intercept, evaluate the function at x equal to zero instead."
 ],
 titles:["Plot the function","Open Zero","Bracket one crossing","Read the x-coordinate"],
 keys:Object.freeze([
  [0.65,"x",{raw:"x"}],[1.19,"square",{raw:"x^2"}],[1.75,"minus",{raw:"x^2-"}],[2.13,"5",{raw:"x^2-5"}],
  [2.52,"x",{raw:"x^2-5x"}],[2.96,"plus",{raw:"x^2-5x+"}],[3.35,"6",{raw:"x^2-5x+6"}],[4.27,"enter",{state:"plotted"}],
  [5.75,"menu",{state:"menu"}],[6.84,"6",{state:"submenu"}],[7.96,"1",{state:"lower",cursor:2.5}],
  [11.88,"left",{cursor:2.25}],[12.15,"left",{cursor:2}],[12.42,"left",{cursor:1.75}],[12.69,"left",{cursor:1.5}],
  [13.47,"enter",{state:"upper",low:1.5}],
  [14.63,"right",{cursor:1.75}],[14.9,"right",{cursor:2}],[15.17,"right",{cursor:2.25}],[15.44,"right",{cursor:2.5}],
  [17.32,"enter",{state:"result",high:2.5,mark:{x:2,y:0}}]
 ].map(([time,key,delta])=>Object.freeze({time,key,delta:Object.freeze(delta)})))
});
