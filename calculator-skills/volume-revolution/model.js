(function(g){"use strict";
const worked={outer:"2*x",inner:"1",lower:"1",upper:"2"},practice={outer:"x+1",inner:"x",lower:"0",upper:"3"};
const menus=[
 [[1,"Actions"],[2,"Number"],[3,"Algebra"],[4,"Calculus"],[5,"Probability"],[6,"Statistics"],[7,"Matrix & Vector"],[8,"Finance"],[9,"Functions & Programs"]],
 [[1,"Numerical Derivative at a Point"],[2,"Numerical Definite Integral"],[3,"Sum"],[4,"Product"],[5,"Numerical Function Minimum"],[6,"Numerical Function Maximum"]]
];
const numKeys="lower upper".split(" "), allKeys=["outer","inner",...numKeys];
const num=/^[+-]?(?:[0-9]{1,2}(?:\.[0-9]{1,3})?|\.[0-9]{1,3})$/;
const norm=s=>String(s).trim().replaceAll("−","-").replaceAll("×","*").replaceAll("·","*").replaceAll("²","^2");
function number(raw){
 const s=norm(raw),n=Number(s);
 if(!num.test(s)||!Number.isFinite(n)||Math.abs(n)>12)throw Error("Bounds must be numbers from −12 to 12, with up to three decimal places.");
 return n||0;
}
function add(a,b,s=1){return a.map((x,i)=>x+s*b[i]);}
function times(a,b){
 const out=[0,0,0,0,0];for(let i=0;i<3;i++)for(let j=0;j<3;j++)out[i+j]+=a[i]*b[j];
 if(out.slice(3).some(v=>v!==0))throw Error("Use an integrand of degree at most two in this lesson.");
 return out.slice(0,3);
}
function polynomial(raw){
 const s=norm(raw);
 if(!s||s.length>76||/[\d.]\s+[\d.]/.test(s))throw Error("Use a short expression with explicit multiplication.");
 const tokens=s.match(/\d+(?:\.\d+)?|\.\d+|x|[+\-*^()]/g)||[];
 if(tokens.join("")!==s.replace(/\s+/g,""))throw Error("Use x, numbers, parentheses and explicit multiplication.");
 let i=0;
 function atom(){
  const a=tokens[i++];
  if(a==="("){const q=expr();if(tokens[i++]!==")")throw Error("Close each pair of parentheses.");return q;}
  if(a==="x")return [0,1,0];
  if(a&&/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(a)&&Math.abs(+a)<=144)return [+a,0,0];
  throw Error("Enter a number, x, or a bracketed expression.");
 }
 function power(){
  const x=atom();if(tokens[i]!=="^")return x;
  i++;if(tokens[i++]!=="2")throw Error("Use the square key for this lesson.");
  return times(x,x);
 }
 function unary(){if(tokens[i]==="+"||tokens[i]==="-"){const sign=tokens[i++]==="-"?-1:1;return unary().map(x=>x*sign);}return power();}
 function term(){let q=unary();while(tokens[i]==="*"){i++;q=times(q,unary());}return q;}
 function expr(){let q=term();while(tokens[i]==="+"||tokens[i]==="-"){const sign=tokens[i++]==="-"?-1:1;q=add(q,term(),sign);}return q;}
 const result=expr();if(i!==tokens.length||result.some(x=>!Number.isFinite(x)||Math.abs(x)>1000000))throw Error("Use explicit multiplication and bounded whole or decimal coefficients.");
 return result;
}
const evalPoly=(v,x)=>v[0]+x*(v[1]+x*v[2]);
function setup(c){
 const a=number(c.lower),b=number(c.upper);
 if(b<=a)throw Error("The upper bound must be greater than the lower bound.");
 const outer=polynomial(c.outer),inner=polynomial(c.inner);
 if([outer,inner].some(x=>x[2]!==0||Math.max(...x.map(Math.abs))>12))throw Error("Use constant or linear radii with coefficients from −12 to 12.");
 const gap=add(outer,inner,-1);for(const x of [a,b]){
  const nonnegative=p=>evalPoly(p,x)>=-8*Number.EPSILON*(Math.abs(p[0])+Math.abs(p[1]*x));
  if(!nonnegative(inner)||!nonnegative(gap))throw Error("The outer radius must be at least the inner radius, and both must be nonnegative throughout.");
 }
 const poly=add(times(outer,outer),times(inner,inner),-1);
 return {a,b,outer,inner,poly};
}
function integrate(area,a,b){
 const m=(a+b)/2,w=b-a; // centered average value of a quadratic, exactly in real arithmetic
 return Math.PI*w*(evalPoly(area,m)+area[2]*w*w/12);
}
function matches(res,task){
 return res&&res.a===task.a&&res.b===task.b&&res.poly.every((v,i)=>v===task.poly[i]||Math.abs(v-task.poly[i])<=1e-10*Math.max(Math.abs(v),Math.abs(task.poly[i])));
}
function request(params){
 const typed=allKeys.some(k=>params.has(k));
 if(!typed)return {target:practice,linked:false,error:""};
 try{
  if(allKeys.some(k=>params.getAll(k).length!==1))throw Error();
  const target=Object.fromEntries(allKeys.map(k=>[k,norm(params.get(k))]));setup(target);
  return {target,linked:true,error:""};
 }catch{return {target:practice,linked:true,error:"Invalid radius or interval link. The unsolved practice example is shown instead."};}
}
function start(){return {page:"calc",field:0,menu:0,pi:false,mul:false,showPi:false,fields:["","","",""],error:"",result:null};}
function press(s,key){
 const select=key==="enter"||key==="select";
 if(key==="esc"){
  if(s.page==="submenu")return {...s,page:"menu",menu:3,error:""};
  if(s.page==="menu")return {...s,page:s.fields.some(Boolean)?"template":"calc",menu:0,error:""};
  if(s.showPi)return {...s,showPi:false,error:""};
  return start();
 }
 if(s.showPi){return select?{...s,pi:true,showPi:false,error:""}:s;}
 if(key==="menu")return {...s,page:"menu",menu:0,error:""};
 if(s.page==="menu"||s.page==="submenu"){
  const level=s.page==="menu"?0:1;
  if(["up","down"].includes(key))return {...s,menu:(s.menu+(key==="down"?1:menus[level].length-1))%menus[level].length};
  if(key==="left"&&level===1)return {...s,page:"menu",menu:3,error:""};
  const val=select||key==="right"?s.menu+1:Number(key);
  if(level===0&&val===4)return {...s,page:"submenu",menu:0,error:""};
  if(level===1&&val===2)return {...s,page:"template",menu:0,field:0,fields:["","","",""],result:null,error:""};
  return s;
 }
 if(s.page==="calc"){
  if(key==="pi")return {...s,showPi:true};
  if(key==="mul"&&s.pi)return {...s,mul:true};
  return s;
 }
 if(s.page!=="template")return s;
 const i=s.field,fields=s.fields.slice();
 if(key==="tab"||key==="down")return {...s,field:Math.min(3,i+1),error:""};
 if(key==="backtab"||key==="up")return {...s,field:Math.max(0,i-1),error:""};
 if(key==="del")return {...s,fields:fields.map((v,k)=>k===i?v.endsWith("^2")?v.slice(0,-2):v.slice(0,-1):v),error:"",result:null};
 if(select){
  try{
   if(!s.pi||!s.mul)throw Error("Enter π and the multiply sign before the integral. Press Esc to rebuild the expression.");
   if(fields[3]!=="x")throw Error("Enter x after the differential d.");
   const a=number(fields[0]),b=number(fields[1]);
   if(a>=b)throw Error("Enter increasing bounds.");
   const poly=polynomial(fields[2]),v=integrate(poly,a,b);
   if(!Number.isFinite(v))throw Error("Use a smaller bounded expression.");
   return {...s,page:"result",result:{a,b,poly,value:v},error:""};
  }catch(e){return {...s,error:e.message};}
 }
 const op={plus:"+",minus:"-",neg:"-",mul:"*",dot:".",lparen:"(",rparen:")",square:"^2",x:"x"}[key];
 if((op||/^\d$/.test(key))&&fields[i].length<64){fields[i]+=op||key;return {...s,fields,error:"",result:null};}
 return s;
}
const duration=38;
const cues=[
 [0,"Choose the two radii","Rotate the region from y = 1 to y = 2x, for 1 ≤ x ≤ 2, about the x-axis. Each slice has a hole."],
 [4,"Build a washer","The outer radius is 2x and the inner radius is 1. Enter π outside the integral. Use a difference of squares, not the square of the gap."],
 [10,"Open the numerical integral","On Calculator, choose Menu → 4: Calculus → 2: Numerical Definite Integral."],
 [14,"Fill the bounds","Tab moves from the lower bound 1 to the upper bound 2, then into the integrand."],
 [20,"Enter the area without π","Enter (2 × x)² − 1². The π outside multiplies every slice. Tab to the differential, type x, then Enter."],
 [33,"Report cubic units","The solid has volume about 26.180 cubic units. For a disk touching the axis, the inner radius is zero."]
];
const tape=[
 [6.1,"pi"],[7.4,"enter"],[8.05,"mul"],[10.5,"menu"],[11.2,"4"],[12.4,"2"],
 [14.4,"1"],[15.1,"tab"],[15.8,"2"],[16.6,"tab"],
 [20.3,"lparen"],[21,"2"],[21.72,"mul"],[22.38,"x"],[23.02,"rparen"],[23.72,"square"],[24.42,"minus"],[25.11,"1"],[25.81,"square"],[27.5,"tab"],[28.6,"x"],[31.4,"enter"]
];
function watchAt(time){
 const t=Math.max(0,Math.min(duration,Number(time)||0));let state=start(),keys=[];
 for(const [at,key] of tape){if(t<at)break;state=press(state,key);keys=t<at+.42?[key]:[];}
 return {state,keys,chapter:cues.findLastIndex(([at])=>at<=t)};
}
const api={menus,cues,tape,duration,worked,practice,start,press,watchAt,request,polynomial,number,setup,integrate,matches,evalPoly,allKeys};
if(typeof module==="object"&&module.exports)module.exports=api;else g.CT57=api;
})(globalThis);
