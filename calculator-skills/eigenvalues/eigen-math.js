"use strict";
globalThis.EigenLessonMath=(()=>{
const ids=["a","b","c","d"];
function validate(data){
 if(!ids.every(k=>Number.isInteger(data[k])&&Math.abs(data[k])<=20))return "Use four whole matrix entries from −20 to 20.";
 const tr=data.a+data.d,det=data.a*data.d-data.b*data.c;
 if(tr*tr-4*det<=0)return "This lesson needs two distinct real eigenvalues. Choose a matrix with positive discriminant.";
 return "";
}
function facts(data){
 const message=validate(data);if(message)throw Error(message);
 const {a,b,c,d}=data,trace=(a+d)||0,det=(a*d-b*c)||0,disc=trace*trace-4*det;
 const root=Math.sqrt(disc),roots=[(trace-root)/2||0,(trace+root)/2||0];
 const vector=lambda=>{
  const v=[b,lambda-a],w=[lambda-d,c];
  const n=p=>Math.max(...p.map(Math.abs));
  const u=n(v)>=n(w)?v:w,scale=n(u);return u.map(x=>x/scale);
 };
 const vectors=roots.map(vector);
 return {trace,det,disc,roots,vectors,dom:trace===0?"tie":trace>0?"high":"low"};
}
// Strict, finite arithmetic subset. No eval, indirect code, matrices or symbolic solver.
function calc(source){
 const s=String(source).replace(/\s/g,"").replaceAll("−","-").replaceAll("×","*").replaceAll("÷","/").replaceAll("√","sqrt");
 if(!s||s.length>104)throw Error("Type a bounded arithmetic expression first.");
 let i=0,depth=0,operations=0,numbers=0;
 function withDepth(f){if(++depth>36)throw Error("Use fewer nested terms.");try{return f();}finally{depth--;}}
 function group(){let x=add();if(s[i]!==")")throw Error("Close the bracket first.");i++;return x;}
 function atom(){return withDepth(()=>{
  if(s.startsWith("sqrt(",i)){i+=5;const x=group();if(x<0)throw Error("The square root of a negative value is not real.");operations++;return Math.sqrt(x);}
  if(s[i]==="("){i++;return group();}
  const m=/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i.exec(s.slice(i));
  if(!m)throw Error("Use numbers, brackets and calculator arithmetic.");
  i+=m[0].length;numbers++;return Number(m[0]);
 });}
 function power(){let x=atom();if(s[i]==="^"){i++;operations++;const b=unary();if(!Number.isInteger(b)||Math.abs(b)>12)throw Error("Use a small whole-number exponent.");x=x**b;}return x;}
 function unary(){return withDepth(()=>{if(s[i]==="+"||s[i]==="-"){const negate=s[i++]==="-";const q=unary();return negate?-q:q;}return power();});}
 function mul(){let x=unary();while(s[i]==="*"||s[i]==="/"){const op=s[i++],y=unary();operations++;if(op==="/"&&y===0)throw Error("Cannot divide by zero.");x=op==="*"?x*y:x/y;}return x;}
 function add(){let x=mul();while(s[i]==="+"||s[i]==="-"){const op=s[i++],y=mul();operations++;x=op==="+"?x+y:x-y;}return x;}
 const value=add();
 if(i!==s.length)throw Error("Use an explicit multiplication sign and check the brackets.");
 if(!Number.isFinite(value)||Math.abs(value)>1e12)throw Error("This result is beyond the trainer’s numerical range.");
 return {value:value||0,operations,numbers};
}
const near=(a,b)=>Number.isFinite(a)&&Math.abs(a-b)<=Math.max(2e-9,Math.abs(b)*6e-6);
function inputNumber(raw){try{return calc(raw).value;}catch{return NaN;}}
function parseVector(raw){
 const v=String(raw).trim().replace(/^\(([^,]+,[^,]+)\)$/,"$1").split(",");
 if(v.length!==2||v.some(x=>!x.trim()))return null;
 const xy=v.map(inputNumber);return xy.every(Number.isFinite)?xy:null;
}
function isVector(data,lambda,v){
 if(!Number.isFinite(lambda)||!v||v.length!==2||!v.every(Number.isFinite))return false;
 const size=Math.max(...v.map(Math.abs));if(size===0)return false;
 const [x,y]=v.map(c=>c/size),{a,b,c,d}=data;
 const tol=6e-6*Math.max(1,Math.abs(a)+Math.abs(b),Math.abs(c)+Math.abs(d),Math.abs(lambda));
 return Math.abs(a*x+b*y-lambda*x)<=tol&&Math.abs(c*x+d*y-lambda*y)<=tol;
}
// Certify the visible arithmetic shape as well as its value.
function unwrap(source){
 let s=String(source).replace(/\s/g,"").replaceAll("−","-").replaceAll("×","*").replaceAll("÷","/").replaceAll("√","sqrt");
 while(s[0]==="("&&s.endsWith(")")){
  let level=0,whole=true;
  for(let i=0;i<s.length-1;i++){if(s[i]==="(")level++;else if(s[i]===")")level--;if(level===0){whole=false;break;}}
  if(!whole)break;s=s.slice(1,-1);
 }
 return s;
}
function splitTop(source,ops){
 const s=unwrap(source);let level=0,at=-1;
 for(let i=0;i<s.length;i++){
  const x=s[i];
  if(x==="(")level++;else if(x===")")level--;
  else if(level===0&&i>0&&ops.includes(x)&&/[0-9.)]/.test(s[i-1]))at=i;
 }
 return at<0?null:[s.slice(0,at),s[at],s.slice(at+1)];
}
function additivePair(source,x,y){
 const t=splitTop(source,"+-");
 if(!t)return false;
 const a=inputNumber(t[0]),b=(t[1]==="-"?-1:1)*inputNumber(t[2]);
 return near(a,x)&&near(b,y)||near(a,y)&&near(b,x);
}
function rootShape(source,trace,root,sign){
 if(splitTop(source,"+-"))return false;
 const h=splitTop(source,"*/");
 if(!h)return false;
 const [l,op,r]=h;
 const sample=w=>trace===0&&near(inputNumber(w),sign*root)||additivePair(w,trace,sign*root);
 return op==="/"?near(inputNumber(r),2)&&sample(l):
    near(inputNumber(l),.5)&&sample(r)||near(inputNumber(r),.5)&&sample(l);
}
function demonstrated(data,actual,history){
 const {a,b,c,d}=data,{trace,det,disc,roots}=actual;
 const required=[
  h=>near(h.value,trace)&&additivePair(h.text,a,d),
  h=>near(h.value,det)&&additivePair(h.text,a*d,-b*c),
  h=>near(h.value,roots[0])&&rootShape(h.text,trace,Math.sqrt(disc),-1),
  h=>near(h.value,roots[1])&&rootShape(h.text,trace,Math.sqrt(disc),1)
 ];
 function match(i,used){
  if(i===required.length)return true;
  return history.some((h,j)=>!used.includes(j)&&required[i](h)&&match(i+1,[...used,j]));
 }
 return match(0,[]);
}
return Object.freeze({ids,validate,facts,calc,near,inputNumber,parseVector,isVector,demonstrated});
})();
