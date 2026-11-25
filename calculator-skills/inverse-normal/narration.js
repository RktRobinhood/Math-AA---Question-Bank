"use strict";
// Rehearsal times only. A real take must supply every event with measured timing.
(function(root){
 const cues=[
  ["40.01","Ask for a cutoff",0,"This time we know the probability, not the cutoff. The seventy-fifth percentile has 0.75 of the area to its left."],
  ["40.02","Open Inverse Normal",5150,"On a Calculator page, press Menu. Choose Probability, then Distributions, then Inverse Normal."],
  ["40.03","Enter left area, mean and SD",12400,"In Area, enter 0.75. Enter 50 for the mean and 8 for the standard deviation."],
  ["40.04","Read the left-area cutoff",23100,"Confirm. Press Enter again to calculate. The cutoff is about 55.4, above the mean of 50."],
  ["40.05","Convert the right tail",30900,"For the top 10%, 0.10 is on the right. Subtract from one: 0.90 is on the left."],
  ["40.06","Run Inverse Normal again",33300,"Open Menu, Probability, Distributions, and Inverse Normal again. Enter 0.90 for Area. Keep 50 for the mean and 8 for the standard deviation."],
  ["40.07","Read the right-tail cutoff",41300,"Confirm, then press Enter again. The cutoff is about 60.3, in the original measurement units."]
 ].map(([id,title,startMs,text])=>Object.freeze({id,title,startMs,text}));
 const tape=[
  ["left-menu",1,5550,"menu"],["left-probability",1,7400,"5"],["left-distributions",1,9400,"5"],["left-inverse-normal",1,11450,"3"],
  ["left-area-0",2,13750,"0"],["left-area-dot",2,14753,"dot"],["left-area-7",2,15756,"7"],["left-area-5",2,16759,"5"],
  ["left-tab-mean",2,17762,"tab"],["left-mean-5",2,18765,"5"],["left-mean-0",2,19768,"0"],["left-tab-sd",2,20771,"tab"],
  ["left-sd-8",2,21774,"8"],["left-tab-ok",2,22777,"tab"],["left-insert",3,24200,"enter"],["left-evaluate",3,25600,"enter"],
  ["right-menu",5,33600,"menu"],["right-probability",5,34100,"5"],["right-distributions",5,34600,"5"],["right-inverse-normal",5,35100,"3"],
  ["right-area-0",5,35900,"0"],["right-area-dot",5,36180,"dot"],["right-area-9",5,36470,"9"],["right-tab-mean",5,37000,"tab"],
  ["right-mean-5",5,37700,"5"],["right-mean-0",5,38000,"0"],["right-tab-sd",5,38700,"tab"],["right-sd-8",5,39350,"8"],
  ["right-tab-ok",5,39960,"tab"],["right-insert",6,41800,"enter"],["right-evaluate",6,43100,"enter"]
 ].map(([id,phase,timeMs,key])=>Object.freeze({id,phase,timeMs,key}));
 root.InverseNormalRehearsal=Object.freeze({
  duration:48.5,cues:Object.freeze(cues),
  tape:Object.freeze(tape),markersMs:Object.freeze({tailContext:30900})
 });
})(typeof window==="undefined"?globalThis:window);
