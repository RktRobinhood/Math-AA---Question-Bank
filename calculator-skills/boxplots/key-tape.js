"use strict";
window.CT30Tape={
 duration:41,starts:[0,4.5,10.2,15.5,22,30,36],
 titles:["Start with a named list","Choose Box Plot","Read the box","Calculate two fences","Compare fences and whiskers","Extend whiskers","Restore the modified plot"],
 captions:[
  [0,"Start in Data & Statistics with the numeric list reading on the horizontal axis."],
  [4.5,"Open Menu → 1: Plot Type → 2: Box Plot. It starts as a modified box plot."],
  [10.2,"Point at the box edges and the line inside: Q₁ = 2, median = 4, Q₃ = 6."],
  [15.5,"IQR = 6 − 2 = 4. Subtract 1.5 × IQR from Q₁; add it to Q₃."],
  [19.1,"The fences are −4 and 12. These are calculated cutoffs, not necessarily data points."],
  [22,"There is no observation at −4. The left whisker stops at 0, the smallest value inside."],
  [25.7,"By the mathematical rule, 12 is on the fence and stays in. 13 is strictly beyond it."],
  [30,"In Plot Properties, choose Extend Box Plot Whiskers. This makes a standard box plot."],
  [33.9,"The whiskers now run from 0 to 13. The quartiles stay the same; 13 is not marked separately."],
  [36,"Choose Show Box Plot Outliers to return to the modified plot."],
  [39,"Report the fence and the observed whisker separately."]
 ],
 keys:[
  [5.2,"menu",{menu:"main",selection:0}],[6.55,"1",{menu:"type",selection:0}],[8.25,"2",{menu:"",plot:"modified"}],
  [10.55,"",{mark:"q1"}],[12.05,"",{mark:"median"}],[13.6,"",{mark:"q3"}],[15.5,"",{mark:null}],
  [22.45,"",{mark:"left"}],[26.1,"",{mark:"right"}],[28.1,"",{mark:"out0"}],
  [30.28,"menu",{menu:"main",selection:0,mark:null}],[31.28,"2",{menu:"props",selection:0}],
  [32.6,"enter",{menu:"",plot:"standard"}],[34.2,"",{mark:"right"}],
  [36.33,"menu",{menu:"main",selection:0,mark:null}],[37.15,"2",{menu:"props",selection:0}],[38.45,"enter",{menu:"",plot:"modified"}]
 ]
};
