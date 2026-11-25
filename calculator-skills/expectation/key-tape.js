(function(root){
'use strict';
const M=root.CT36,core=[];
const chapters=[
 [0,'Check the table','The possible outcomes are −2, 1 and 4. Their respective probabilities are 0.25, 0.35 and 0.40.'],
 [5,'Check the probabilities','First add just the probabilities. A valid distribution gives a total of 1.'],
 [15,'Multiply each matched pair','Type the outcome, ×, and its own probability. A negative outcome gives a negative contribution.'],
 [25,'Add all contributions','Join the three products with +. Press Enter; do not simply average the outcomes.'],
 [34,'Interpret the result','The expectation is 1.45: a long-run average, not a value that must occur on any individual trial.']
];
const enc=s=>[...s].map(x=>({'.':'dot','+':'plus','-':'neg','*':'mul','(':'lparen',')':'rparen'})[x]||x);
function events(t,dt,list){list.forEach((key,j)=>core.push({at:Number((t+j*dt).toFixed(3)),key}));}
events(5.55,.44,[...enc('0.25+0.35+0.40'),'enter']);
events(15.52,.46,enc('-2*0.25+1*0.35'));
events(25.20,.48,[...enc('+4*0.40'),'enter']);
let s=M.start(M.worked);
const tape=core.map(ev=>{s=M.press(s,ev.key);return {...ev,s};});
function at(t){const k=tape.findLast(row=>row.at<=t+1e-9);return {state:k?.s||M.start(M.worked),keys:k&&t<k.at+.32?[k.key]:[],chapter:Math.max(0,chapters.findLastIndex(c=>c[0]<=t+1e-9))};}
root.CT36Watch=Object.freeze({chapter:chapters,duration:42,tape,at});
})(typeof window==='undefined'?globalThis:window);
