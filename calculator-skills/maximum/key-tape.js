"use strict";
window.CT12MaxTape=Object.freeze({
 duration:39,
 starts:[0,5,11,23,30],
 titles:["Read the allowed interval","Open Maximum","Set the search bounds","Read the local peak","Compare the endpoints"],
 captions:[
  [0,"The allowed interval is −2 to 3. The graph is already on the screen.","f(x) = x³ − 3x + 2 · [−2, 3]"],
  [5,"Open Menu, choose Analyze Graph, then Maximum.","Menu → 6: Analyze Graph → 3: Maximum"],
  [11,"Move to the left of the peak and press Enter. Then choose the upper bound just to its right.","Search bounds: −2 and 0"],
  [23,"The calculator marks (−1, 4). That is a local peak, not yet the answer.","Local peak: f(−1) = 4"],
  [30,"Both endpoints count because the interval is closed. Substitute minus two into the function.","Left endpoint: f(−2) = 0"],
  [33,"Substitute three to check the other endpoint.","Right endpoint: f(3) = 20"],
  [36,"Compare the three heights. The right endpoint is highest.","0 < 4 < 20 · Maximum: 20 at x = 3"]
 ],
 keys:[
  [5.8,"menu",{state:"menu"}],[7.1,"6",{state:"submenu"}],[8.5,"3",{state:"lower",cursor:-1.5}],
  [12.55,"left",{cursor:-2}],[15.25,"enter",{state:"upper",low:-2}],
  [17.1,"right",{cursor:-1.5}],[17.9,"right",{cursor:-1}],[18.7,"right",{cursor:-.5}],[19.5,"right",{cursor:0}],
  [22.4,"enter",{state:"result",high:0}]
 ]
});
