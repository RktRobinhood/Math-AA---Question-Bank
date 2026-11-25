"use strict";
// Original silent CT37 rehearsal. A cue may set a new LCD state, select a
// wizard field, or commit the characters typed so far into that field.
window.BinomialPdfTape=Object.freeze([
 {id:"menu",timeMs:3650,key:"menu",state:"probability-menu"},
 {id:"choose-probability",timeMs:4750,key:"5",state:"probability-submenu"},
 {id:"choose-distributions",timeMs:5900,key:"5",state:"distributions-submenu"},
 {id:"choose-binomial-pdf",timeMs:7350,key:"d",state:"wizard",field:0},
 {id:"type-n-8",timeMs:8950,key:"8",field:0,fieldAfter:"8"},
 {id:"tab-probability",timeMs:9900,key:"tab",field:1},
 {id:"type-p-0",timeMs:10900,key:"0",field:1,fieldAfter:"0"},
 {id:"decimal-p",timeMs:11200,key:"dot",field:1,fieldAfter:"0."},
 {id:"type-p-3",timeMs:11500,key:"3",field:1,fieldAfter:"0.3"},
 {id:"tab-x-value",timeMs:12800,key:"tab",field:2},
 {id:"type-k-3",timeMs:13900,key:"3",field:2,fieldAfter:"3"},
 {id:"insert-command",timeMs:15700,key:"enter",state:"entry"},
 {id:"evaluate-result",timeMs:17000,key:"enter",state:"result"}
].map(cue=>Object.freeze({durationMs:250,...cue})));
