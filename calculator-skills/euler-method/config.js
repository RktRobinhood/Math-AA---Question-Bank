"use strict";
globalThis.StatsLesson=(()=>{
const E=EulerTrainer,fmt=n=>String(Number(n.toPrecision(10))).replace(/-/g,"−");
const signs={"+":"plus","-":"minus","*":"mul","/":"div","(":"lparen",")":"rparen",".":"dot"};
const type=(start,spacing,text)=>[...text].map((c,j)=>[Number((start+j*spacing).toFixed(3)),signs[c]||c]);
const close=(value,goal)=>value===goal||Math.abs(value-goal)<=Math.max(Math.abs(goal)*7e-7,1e-12);
function signed(parts){
 const raw=parts.filter(([v])=>v!==0).map(([v,suffix],i)=>{
  const sign=v<0?"−":i?" + ":"",a=Math.abs(v),body=suffix&&a===1?suffix:fmt(a)+suffix;
  return sign+body;
 });return raw.join("").replace(/([^\s])−/g,"$1 − ")||"0";
}
return {
 id:"CT58", app:"Calculator",name:"Euler method for a first-order ODE",duration:51,title:"Arithmetic",
 intro:"Advance x, then use the new pair to find the next slope. The calculator does the arithmetic, not the method.",
 demo:{a:1,b:-1,c:0,x0:0,y0:2,h:.5,n:2},
 assigned:{a:1,b:1,c:0,x0:0,y0:1,h:.2,n:3},
 input:[["a","Coefficient a of x"],["b","Coefficient b of y"],["c","Constant c"],["x0","Initial x₀"],["y0","Initial y₀"],["h","Step size h"],["n","Number of steps"]],
 answers:[["y1","First estimate y₁"],["yn","Final estimate y"],["slope","Where is the next slope evaluated?",[["new","Updated x and y"],["old","Initial x and y"],["mix","Old x, new y"]]]],
 validate:E.validate,
 task:d=>"For dy/dx = "+signed([[d.a,"x"],[d.b,"y"],[d.c,""]])+", start at ("+fmt(d.x0)+", "+fmt(d.y0)+"). Use "+d.n+" steps of h = "+fmt(d.h)+" to estimate y at x = "+fmt(E.rows(d)[d.n].x)+".",
 grade(d,s,a,match){
  const timeline=E.rows(d);
  let j=1;
  for(const r of s.history)if(j<timeline.length&&close(r.value,timeline[j].y)&&E.certify(r.text,timeline[j-1],d.h,timeline[j]))j++;
  if(j!==timeline.length)return "Enter each update as current y + h × (slope), in order. Typing the estimates alone does not show the steps.";
  const target=timeline.slice(1);
  if(!match(a.y1,target[0].y)||!match(a.yn,target.at(-1).y))return "Check the first and final Euler estimates. Keep guard digits until the final answer.";
  if(a.slope!=="new")return "For the next slope, which x and y belong to the current point?";
  return "";
 },
 success:"Correct. Each new slope comes from the updated point, not from the starting point.",
 notes:"This is the Calculator-page arithmetic workflow, not a firmware emulator or a built-in ODE solver. Use y(next) = y + h·f(x,y) and x(next) = x + h, evaluating f with the old pair before updating either coordinate. Enter a fresh numerical expression for each step. The trainer accepts affine slopes ax + by + c, positive forward steps, and ordinary arithmetic with brackets; Graphs and spreadsheet approaches are separate.",
 refs:[["TI CX guide: Calculator application","https://education.ti.com/html/eguides/nspire/EG_Nspire/EN/content/m_calculator/m_calculator.HTML"],["TI guidance: Euler’s local-linear steps","https://education.ti.com/en/activity/detail/eulers-method"],["IB AI guide (AHL 5.16)","https://ibo.org/globalassets/new-structure/university-admission/pdfs/dp-mathematics-applications-and-interpretation-guide-en.pdf#page=75"]],
 chapters:["Start at the known point","Find the old-point slope","Enter the first update","Move to the new point","Recalculate the slope","Enter the second update","Interpret the estimate"],
 captions:[
 [0,"Estimate y at x = 1 in two steps. Start at the known point (0, 2).","dy/dx = x − y · h = 0.5"],
 [6,"Use the starting pair for the slope: 0 − 2 = −2. Multiply the slope by the step size.","y(next) = y + h · slope at (x, y)"],
 [12,"On a Calculator page, type 2 + 0.5 × (0 − 2), then press Enter.","Update y with the slope at (0, 2)."],
 [21,"The new y is 1, and the new x is 0.5. Keep that pair together.","(0, 2) → (0.5, 1)"],
 [27,"Now find the slope from the new pair: 0.5 − 1 = −0.5. The previous slope is no longer used.","Use (0.5, 1), not (0, 2)."],
 [34,"Type 1 + 0.5 × (0.5 − 1), then press Enter. This is the second update.","Take one more step of width 0.5."],
 [44,"At x = 1 the Euler estimate is 0.75. Two tangent steps give an approximation, not an exact solution.","(0, 2) → (0.5, 1) → (1, 0.75)"]],
 keys:[...type(12.8,.63,"2+.5*(0-2)"),[20,"enter"],...type(34.3,.65,"1+.5*(.5-1)"),[43,"enter"]]
};
})();
