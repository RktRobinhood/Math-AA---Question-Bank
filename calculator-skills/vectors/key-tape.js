/* Original caption rehearsal. Every frame is reconstructed by replaying actual keys. */
(function(root){
'use strict';
const M=root.CT19, records=[];
const chapter=[
 [0,'Read both vectors','Find the dot product and angle for a = [2, −1, 2] and b = [1, 2, −2]. The example is in degrees.'],
 [2.6,'Store the first row','Type a, then Ctrl + templates for :=. Open Menu → 7 → 1 → 1. Use one row and three columns.'],
 [10.3,'Store the second row','Store b as another 1 × 3 row. Use the (−) key for negative entries.'],
 [17.3,'Get the scalar','Choose Menu → 7: Matrix & Vector → C: Vector → 3: Dot Product. Enter a,b.'],
 [23.5,'Start the angle','Use cos⁻¹, not 1/cos. Ctrl + ÷ opens a fraction. Put the dot product on top.'],
 [34,'Enter both lengths','Below, use norm(a) × norm(b). Menu → 7 → 7: Norms → 1: Norm inserts each norm.'],
 [44,'Read the angle','The dot product is −4. Both lengths are 3, so cos θ = −4/9. The negative cosine gives an obtuse angle.'],
 [48.4,'Check precision','The angle is about 116.388°. This is 116° to three significant figures. A zero-length vector has no direction.']
];
const duration=53;
function series(t,step,keys){keys.forEach((key,i)=>records.push({at:Number((t+i*step).toFixed(3)),key}));}
const dimensions=['menu','7','1','1','1','tab','3','tab','enter'];
series(3.06,.34,['a','ctrl','templates',...dimensions]);
series(7.50,.33,['2','tab','neg','1','tab','2','enter']);
series(10.55,.30,['b','ctrl','templates',...dimensions]);
series(14.50,.30,['1','tab','2','tab','neg','2','enter']);
series(17.80,.39,['menu','7','c','3','a','comma','b','rparen','enter']);
series(24.05,.44,['trig','right','down','enter','ctrl','div']);
series(27.55,.43,['menu','7','c','3','a','comma','b','rparen']);
series(34.28,.42,['down','menu','7','7','1','a','rparen','mul','menu','7','7','1','b','rparen','right']);
series(42.75,.41,['enter']);
records.sort((a,b)=>a.at-b.at);
let state=M.start(M.worked.unit),lastKey='';
const tape=records.map(event=>{
 const combo=lastKey==='ctrl'?['ctrl',event.key]:[event.key];lastKey=event.key;
 state=M.press(state,event.key);return {...event,state,keys:combo};
});
function at(t){
 const row=tape.findLast(event=>event.at<=t+1e-9);
 const index=chapter.findLastIndex(c=>c[0]<=t+1e-9);
 return {state:row?.state||M.start(M.worked.unit),keys:row&&t<row.at+.29?row.keys:[],chapter:Math.max(index,0)};
}
root.CT19Watch=Object.freeze({chapter,duration,tape,at});
})(typeof window==='undefined'?globalThis:window);
