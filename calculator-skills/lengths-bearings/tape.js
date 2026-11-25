/* Caption-rehearsal time map, driven by the same reducer as Try. */
(function(host){
"use strict";
const chapters=[
 [0,"Read the displacements","Start at the base. The drone is 6 km west, 8 km south, and 5 km above it.","Plan view: west and south put the drone in the south-west quadrant."],
 [3.15,"Set Degree mode","From Calculator, press Home → 5: Settings → 2: Document Settings. Set Angle to Degree.","Move the touchpad pointer to OK, select it, then choose 4: Current."],
 [13,"Measure the horizontal run","Press Ctrl then x² for √. Square the east and north distances and add them inside the root.","Horizontal distance: √(6² + 8²). Leave height out."],
 [22,"Find the true bearing","Measure clockwise from north. In the south-west, add the acute angle west of south to 180°.","180 + tan⁻¹(6 ÷ 8). Select tan⁻¹ from trig."],
 [34,"Find the angle of elevation","Compare the rise with the horizontal distance, not the sloping line.","tan⁻¹(5 ÷ 10) gives the angle above the horizontal."],
 [45,"Measure the sloping line","For the straight-line distance, all three perpendicular displacements contribute.","√(6² + 8² + 5²). Use Ctrl then Enter for a decimal."],
 [56.3,"Report answers with units","The bearing is 217° to the nearest degree. The sloping distance is 11.2 km to three significant figures.","The LCD carries more digits; round only at the end."]
];
const chain=(at,step,...keys)=>keys.map((k,i)=>[Number((at+step*i).toFixed(3)),k]);
const settings=[[3.4,"home"],[4.25,"5"],[5.2,"2"],[6.1,"tab"],[6.85,"right"],[7.45,"down"],[8.1,"enter"],[10.15,"point-ok"],[11.32,"select"],[12.05,"4"]];
const sq=(n)=>[...String(n),"square"];
const h=[...chain(14.3,.59,"ctrl","square",...sq(6),"plus",...sq(8),"right"),[20.1,"enter"]];
const t=["trig","down","right","right","enter"];
const bearing=[...chain(23.05,.66,"1","8","0","plus",...t,"6","div","8","right"),[32.35,"enter"]];
const elevation=[...chain(35,.68,...t,"5","div","1","0","right"),[43,"enter"]];
const distance=[...chain(46.1,.63,"ctrl","square",...sq(6),"plus",...sq(8),"plus",...sq(5),"right"),[53.68,"ctrl"],[54.3,"enter"]];
const keys=[...settings,...h,...bearing,...elevation,...distance],duration=61.2;
function snapshot(time){
 let state=host.CT17.initial(),key="";
 for(const [at,k] of keys){if(at>time)break;state=host.CT17.press(state,k);key=time<at+.3?k:"";}
 return {state,key,chapter:chapters.findLastIndex(row=>row[0]<=time)};
}
host.CT17Tape=Object.freeze({chapters,keys,duration,snapshot});
})(typeof window==="undefined"?globalThis:window);
