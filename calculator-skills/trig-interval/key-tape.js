"use strict";
window.CT14Tape=Object.freeze({
 duration:41,
 starts:[0,10,14.4,23,30,36],
 captions:[
  [0,"Check the graph’s angle mode.","The equation is in degrees. Check Graphing Angle in the Graphs settings."],
  [10,"Plot both sides.","The blue graph is sin x; the red line is 0.5. The window already covers the whole interval."],
  [14.4,"Bracket an interior crossing.","Use Intersection. Put a lower and an upper bound around the crossing near 150°."],
  [23,"Check the endpoints.","30° counts. 390° also makes the equation true, but the interval excludes it."],
  [30,"Look for touches too.","Now the target is 1 on 0° < x < 180°. The curves touch: there is no sign change."],
  [36,"Check the height of the turn.","Choose the sine curve and find its maximum. Its height is 1, so 90° counts once."]
 ],
 keys:[
  [.95,"menu"],[2.2,"9"],[3.1,"tab"],[4.11,"right"],[5.05,"down"],[6.04,"enter"],
  [7.05,"tab"],[7.31,"tab"],[7.57,"tab"],[7.83,"tab"],[8.09,"tab"],[8.35,"tab"],[8.61,"tab"],[8.87,"tab"],[9.13,"tab"],[9.55,"enter"],
  [14.51,"menu"],[15.02,"6"],[15.61,"4"],[16.62,"1"],[16.94,"0"],[17.26,"0"],[17.68,"enter"],
  [18.68,"2"],[19,"0"],[19.32,"0"],[19.77,"enter"],
  [32.22,"menu"],[32.72,"6"],[33.22,"3"],[34.07,"select"],
  [34.55,"6"],[34.82,"0"],[35.12,"enter"],[36.2,"1"],[36.48,"2"],[36.76,"0"],[37.24,"enter"]
 ].map(([t,key])=>({t,key}))
});
