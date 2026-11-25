(function(root){
'use strict';
const M=root.CT20,records=[];
const chapter=[
 [0,'Set the document','Use z = −8 + 15i. Set Angle to Degree and Real or Complex to Rectangular.'],
 [10.2,'Use the imaginary unit','Type the real and imaginary coefficients. Press π and choose the imaginary unit, not the letter i.'],
 [17.3,'Find the modulus','Type abs(−8+15i). Ctrl + Enter gives a decimal where needed. Modulus is distance.'],
 [25,'Find the argument','Type angle(−8+15i). The point is in quadrant II; the principal angle is obtuse.'],
 [34,'Switch the display','Open Document Settings again. Change Real or Complex to Polar. The number itself does not change.'],
 [42,'Read both forms','Re-enter the same value. In Degree mode the polar display gives 17∠118.072°. In Radian mode it uses exponential form.'],
 [50,'Use the question’s range','The argument shown is principal. Only change the range if the question asks. Zero has no argument.']
];
const duration=55;
const z=['neg','8','plus','1','5','pi','right','right','enter'];
function add(t,gap,keys){keys.forEach((k,i)=>records.push({at:Number((t+i*gap).toFixed(3)),key:k}));}
add(.75,.48,['home','5','2','tab','right','down','enter','tab','tab','right','down','enter','tab','tab','tab','enter','4']);
add(10.75,.48,[...z,'ctrl','enter']);
add(17.65,.43,['a','b','s','lparen',...z,'rparen','ctrl','enter']);
add(25.28,.42,['a','n','g','l','e','lparen',...z,'rparen','ctrl','enter']);
add(34.25,.47,['home','5','2','tab','tab','tab','right','down','enter','tab','tab','tab','enter','4']);
add(42.22,.52,[...z,'ctrl','enter']);
let s=M.start();
const events=records.map(v=>{const prior=s.ctrl;s=M.press(s,v.key);return {...v,s,keys:prior?['ctrl',v.key]:[v.key]};});
function at(t){
 const row=events.findLast(v=>v.at<=t+1e-9);
 return {state:row?.s||M.start(),keys:row&&t<row.at+.34?row.keys:[],chapter:Math.max(0,chapter.findLastIndex(v=>v[0]<=t+1e-9))};
}
root.CT20Watch=Object.freeze({chapter,duration,at,events});
})(typeof window==='undefined'?globalThis:window);
