"use strict";
globalThis.EulerTrainer=(()=>{
const abs=x=>x<0n?-x:x;
function gcd(a,b){a=abs(a);b=abs(b);while(b)[a,b]=[b,a%b];return a||1n;}
function reduce(a,b){
 if(b===0n)throw Error("Cannot divide by zero.");
 if(b<0n){a=-a;b=-b;}const g=gcd(a,b);a/=g;b/=g;
 if(a.toString().length>300||b.toString().length>300)throw Error("That expression exceeds this trainer’s numerical range.");
 return [a,b];
}
const literal=/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i;
function decimal(str){
 const [m,e="0"]=String(str).split(/e/i),power=Number(e),parts=m.split("."),fraction=parts[1]||"";
 if(!Number.isInteger(power)||Math.abs(power)>100||m.length>100)throw Error("That number is too large or too small for this trainer.");
 const num=BigInt(parts[0]+fraction),n=power-fraction.length;
 return n>=0?reduce(num*10n**BigInt(n),1n):reduce(num,10n**BigInt(-n));
}
const q=x=>decimal(String(x)), plus=([a,b],[c,d])=>reduce(a*d+c*b,b*d), minus=([a,b],[c,d])=>reduce(a*d-c*b,b*d);
const mul=([a,b],[c,d])=>reduce(a*c,b*d), div=([a,b],[c,d])=>reduce(a*d,b*c);
const number=([a,b])=>Number(a)/Number(b);
function calculate(source){
 let i=0,depth=0;
 const read=String(source).replace(/[ \t\n]/g,"").replaceAll("−","-").replaceAll("×","*").replaceAll("÷","/");
 if(read.length>104)throw Error("Use a shorter calculation.");
 function atom(){
  depth++;if(depth>30)throw Error("Use fewer nested brackets.");
  const ch=read[i];let out;
  if(ch==="("){i++;out=expr();if(read[i]!==")")throw Error("Close the bracket before pressing Enter.");i++;}
  else if(ch==="+"||ch==="-"){i++;out=atom();if(ch==="-")out=[-out[0],out[1]];}
  else{const hit=literal.exec(read.slice(i));if(!hit)throw Error("Use numbers, brackets, +, −, × and ÷.");i+=hit[0].length;out=decimal(hit[0]);}
  depth--;return out;
 }
 function term(){
  let out=atom();while(read[i]==="*"||read[i]==="/"){const op=read[i++],b=atom();out=op==="*"?mul(out,b):div(out,b);}return out;
 }
 function expr(){
  let out=term();while(read[i]==="+"||read[i]==="-"){const op=read[i++],b=term();out=op==="+"?plus(out,b):minus(out,b);}return out;
 }
 if(!read)throw Error("Type the first update before pressing Enter.");
 const exact=expr(),value=number(exact);
 if(i!==read.length)throw Error("Check the expression and use × for multiplication.");
 if(!Number.isFinite(value)||Math.abs(value)>1e12)throw Error("That result is outside this trainer’s numerical range.");
 return {value,exact:exact.map(String)};
}
// Inspect the typed arithmetic, not merely the sequence of printed answers.
function unwrap(text){
 let s=String(text).replace(/\s/g,"").replaceAll("−","-").replaceAll("×","*").replaceAll("÷","/");
 while(s[0]==="("&&s.endsWith(")")){
  let level=0,whole=true;
  for(let i=0;i<s.length-1;i++){if(s[i]==="(")level++;else if(s[i]===")")level--;if(level===0){whole=false;break;}}
  if(!whole)break;
  s=s.slice(1,-1);
 }
 return s;
}
function splitTop(text,ops){
 const s=unwrap(text);let level=0,hit=-1;
 for(let i=0;i<s.length;i++){
  const ch=s[i];
  if(ch==="(")level++;else if(ch===")")level--;
  else if(level===0&&i>0&&ops.includes(ch)&&/[0-9.)]/.test(s[i-1]))hit=i;
 }
 return hit<0?null:[s.slice(0,hit),s[hit],s.slice(hit+1)];
}
function certify(source,point,h,target){
 const update=splitTop(source,"+-");if(!update)return false;
 const [left,op,right]=update, factor=splitTop(right,"*/");
 if(!factor||factor[1]!=="*"||splitTop(right,"+-"))return false;
 const close=(x,y)=>Math.abs(x-y)<=Math.max(1e-12,Math.abs(y)*5e-7);
 try {
  const [l,_,r]=factor, old=calculate(left).value,a=calculate(l).value,b=calculate(r).value, sign=op==="-"?-1:1;
  return close(old,point.y)&&((close(a,h)&&close(sign*b,target.slope))||(close(b,h)&&close(sign*a,target.slope)));
 }catch{return false;}
}
function rows(d){
 const a=q(d.a),b=q(d.b),c=q(d.c),h=q(d.h);
 let x=q(d.x0),y=q(d.y0);const out=[{x:number(x),y:number(y),slope:null}];
 for(let j=0;j<d.n;j++){
  const slope=plus(plus(mul(a,x),mul(b,y)),c);
  y=plus(y,mul(h,slope));x=plus(x,h);
  out.push({x:number(x),y:number(y),slope:number(slope)});
 }
 return out;
}
function validate(d){
 if(!["a","b","c","x0","y0"].every(k=>Number.isFinite(d[k])&&Math.abs(d[k])<=20))return "Use coefficients and initial coordinates from −20 to 20.";
 if(!Number.isFinite(d.h)||d.h<.05||d.h>2||!Number.isInteger(d.n)||d.n<2||d.n>6)return "Use 2–6 steps and a positive step size from 0.05 to 2.";
 try{if(rows(d).some(r=>!Number.isFinite(r.y)||Math.abs(r.y)>1e10))return "These steps exceed the practice scale. Use smaller inputs or steps.";}
 catch(e){return e.message;}
 return "";
}
return Object.freeze({calculate,certify,rows,validate});
})();
