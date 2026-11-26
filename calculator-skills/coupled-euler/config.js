"use strict";
globalThis.StatsLesson=(()=>{
const E=CoupledTrainer,fmt=n=>String(Number(n.toPrecision(10))).replace(/-/g,"−");
const signs={"+":"plus","-":"minus","*":"mul","/":"div","(":"lparen",")":"rparen",".":"dot"};
const type=(start,spacing,text)=>[...text].map((c,j)=>[Number((start+j*spacing).toFixed(3)),c==="-"&&(j===0||"(*+-/".includes(text[j-1]))?"neg":signs[c]||c]);
const close=(x,y)=>Math.abs(x-y)<=Math.max(Math.abs(y)*7e-7,1e-12);
function linear(a,b){
 const term=(v,k)=>Math.abs(v)===1?k:fmt(Math.abs(v))+k;
 return (a?(a<0?"−":"")+term(a,"x"):"")+(b?(a?(b<0?" − ":" + "):(b<0?"−":""))+term(b,"y"):"")||"0";
}
const demo={a:0,b:1,c:-2,d:-1,x0:1,y0:0,h:.25};
return {
 id:"CT59",app:"Calculator",name:"Coupled Euler steps and phase paths",duration:64,
 intro:"Use one old pair for both slopes. Advance both coordinates together, then plot the estimated (x, y) pairs in time order.",
 demo,assigned:{a:0,b:1,c:-3,d:-2,x0:2,y0:1,h:.25},
 input:[["a","a: x coefficient in x′"],["b","b: y coefficient in x′"],["c","c: x coefficient in y′"],["d","d: y coefficient in y′"],["x0","Initial x₀"],["y0","Initial y₀"],["h","Step size h"]],
 answers:[["x1","Step 1 · x₁"],["y1","Step 1 · y₁"],["x2","Step 2 · x₂"],["y2","Step 2 · y₂"],["old","Which input pair gives both slopes for a step?",[["old","The two coordinates from before the step"],["mixed","Updated x, but old y"],["init","The original starting pair at every step"]]],["axes","What are the phase-path axes?",[["xy","x horizontal, y vertical"],["tx","Time horizontal, x vertical"],["ty","Time horizontal, y vertical"]]]],
 validate:E.validate,
 task:d=>"x′ = "+linear(d.a,d.b)+"; y′ = "+linear(d.c,d.d)+". From ("+fmt(d.x0)+", "+fmt(d.y0)+"), take two steps with h = "+fmt(d.h)+".",
 grade(d,s,a,match){
  const timeline=E.rows(d),expected=timeline.slice(1).flatMap((r,i)=>[{old:timeline[i].x,result:r.x,slope:r.sx},{old:timeline[i].y,result:r.y,slope:r.sy}]);
  let j=0;
  for(const r of s.history)if(j<expected.length&&close(r.value,expected[j].result)&&E.certify(r.text,{y:expected[j].old},d.h,{slope:expected[j].slope}))j++;
  if(j!==expected.length)return "Enter each step as two calculations: old x + h × (old x-slope), then old y + h × (old y-slope). Use neither updated coordinate in these slopes.";
  if(!match(a.x1,timeline[1].x)||!match(a.y1,timeline[1].y)||!match(a.x2,timeline[2].x)||!match(a.y2,timeline[2].y))return "Check the two recorded pairs against the four calculator results. Treat row 1 as the old pair for both updates in row 2.";
  if(a.old!=="old")return "For a step, take both slopes from the same pair before advancing.";
  if(a.axes!=="xy")return "A phase path plots the ordered pair (x, y); time orders the points, but neither axis is time.";
  return "";
 },
 success:"Correct. Both updates use the old pair; the phase sketch shows the two numerical steps in order.",
 chapters:["Keep the old pair","First x update","First y update","Second x update","Second y update","Read the phase path"],
 captions:[
 [0,"Start with (1, 0). In each step, find both slopes from the same old point.","x′ = y; y′ = −2x − y; h = 0.25"],
 [4,"On the Calculator page, type 1 + .25 × 0, then Enter. This gives x₁ = 1.","Use the old y = 0 in x′."],
 [12,"Still using (1, 0), type 0 + .25 × (−2 × 1 − 0). Press Enter for y₁ = −0.5.","The first new pair is (1, −0.5)."],
 [24,"Now use the first new pair. Type 1 + .25 × (−.5) for x₂.","x₂ = 0.875. Don’t put it into the y-slope."],
 [35,"For y₂, keep using (1, −0.5). Enter −.5 + .25 × (−2 × 1 + .5).","y₂ = −0.875; using x₂ too soon gives −0.8125."],
 [52,"Read the phase samples in arrow order. Neither axis is time. Exit Focus if needed to see the sketch below.","(1, 0) → (1, −0.5) → (0.875, −0.875). Approximate, not exact."]],
 keys:[...type(4.7,.64,"1+.25*0"),[10.6,"enter"],...type(12.7,.64,"0+.25*(-2*1-0)"),[22.5,"enter"],...type(24.7,.64,"1+.25*(-.5)"),[33.3,"enter"],...type(35.7,.65,"-.5+.25*(-2*1+.5)"),[49.9,"enter"]]
};
})();
