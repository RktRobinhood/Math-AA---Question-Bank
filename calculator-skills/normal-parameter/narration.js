"use strict";
// Original caption rehearsal: no recording or measured timestamps are supplied.
(function(root){
 const groups=[
  [1,"mean-menu",[[5.45,"menu","open"],[6.56,"5","probability"],[7.62,"5","distributions"],[8.7,"3","inverse-normal"]]],
  [2,"mean-input",[[10.34,"0","area-0"],[10.64,"dot","area-decimal"],[10.95,"1","area-1"],[11.6,"tab","to-mu"],[12.2,"0","mu-0"],[13.0,"tab","to-sigma"],[13.65,"1","sigma-1"],[14.4,"tab","to-ok"]]],
  [3,"mean-z",[[15.2,"enter","insert"],[16.28,"enter","evaluate"]]],
  [4,"mean-calc",[[19,"2","cutoff-2"],[19.28,"0","cutoff-0"],[19.7,"minus","subtract"],[20.1,"5","sigma-5"],[20.58,"mul","multiply"],[22.3,"ctrl","control"],[22.78,"neg","recall-ans"],[24.54,"enter","evaluate"]]],
  [5,"sd-menu",[[31,"menu","open"],[31.7,"5","probability"],[32.4,"5","distributions"],[33.1,"3","inverse-normal"]]],
  [6,"sd-input",[[34,"0","area-0"],[34.3,"dot","area-decimal"],[34.6,"9","area-9"],[35.4,"tab","to-mu"],[36,"0","mu-0"],[36.7,"tab","to-sigma"],[37.3,"1","sigma-1"],[38,"tab","to-ok"]]],
  [6,"sd-z",[[39,"enter","insert"],[40.2,"enter","evaluate"]]],
  [7,"sd-calc",[[44,"lparen","open-bracket"],[44.3,"6","cutoff-6"],[44.6,"3","cutoff-3"],[45,"minus","subtract"],[45.4,"5","mu-5"],[45.7,"2","mu-2"],[46.2,"rparen","close-bracket"],[46.8,"div","divide"],[47.65,"ctrl","control"],[48.1,"neg","recall-ans"],[50.5,"enter","evaluate"]]]
 ];
 const tape=Object.freeze(groups.flatMap(([phase,group,events])=>events.map(([t,key,id])=>Object.freeze({t,key,id:group+"-"+id,phase}))));
 const captions=Object.freeze([
  {t:0,title:"Start from the percentile",text:"We know that ten percent is below twenty, and the standard deviation is five. We need the mean, not another cutoff."},
  {t:5.0,title:"Find the standard normal score",text:"On a Calculator page, open Inverse Normal. Enter zero point one for the area, zero for the mean and one for the standard deviation. This gives a z-score."},
  {t:18.0,title:"Use the unrounded result",text:"Rearrange: the mean is the cutoff minus five times z. Use Control then the negative key to insert the previous answer without rounding it."},
  {t:28.0,id:"41.06",title:"Now find a standard deviation",text:"This time, ninety percent is below sixty-three and the mean is fifty-two. Find the standard normal z-score for zero point nine."},
  {t:43.0,title:"Divide by the score",text:"The standard deviation is the cutoff minus the mean, all divided by z. Keep the brackets, reuse the previous answer, and check that the spread is positive."},
  {t:52.4,id:"41.09",title:"If given the right tail",text:"For a right-tail question, subtract the stated probability from one first. The Inverse Normal Area field takes area to the left."}
 ].map(c=>Object.freeze(c)));
 function anchors(captions,tape){
  const phrase=id=>captions.find(e=>e.id===id).t, key=id=>tape.find(e=>e.id===id).t;
  return Object.freeze({problemB:phrase("41.06"),meanZRevealed:key("mean-z-evaluate"),sdZRevealed:key("sd-z-evaluate"),rightTailExplanation:phrase("41.09")});
 }
 root.NormalNarration=Object.freeze({duration:62,captions,tape,anchors:anchors(captions,tape),deriveAnchors:anchors});
})(typeof window==="undefined"?globalThis:window);
