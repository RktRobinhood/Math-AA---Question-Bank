(function(global){
"use strict";
const LIMIT=40,degree=8,maxMagnitude=1e12;
function value(x){
 if(!Number.isFinite(x)||Math.abs(x)>maxMagnitude)throw Error("This calculation is outside the supported numerical range.");
 return Object.is(x,-0)?0:x;
}
function decimal(s,label){
 const a=String(s??"").trim().replace(/−/g,"-");
 if(a.length>24||!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(a)||Math.abs(Number(a))>LIMIT)throw Error(label+" must be a decimal between −40 and 40.");
 return Number(a);
}
const trim=a=>{while(a.length>1&&a.at(-1)===0)a.pop();return a;};
function add(a,b,sign=1){return trim(Array.from({length:Math.max(a.length,b.length)},(_,i)=>value((a[i]??0)+sign*(b[i]??0))));}
function mult(a,b){
 if(a.length+b.length-2>degree)throw Error("Use a polynomial of degree at most 8.");
 const xs=Array(a.length+b.length-1).fill(0);
 a.forEach((x,i)=>b.forEach((y,j)=>xs[i+j]=value(xs[i+j]+x*y)));
 return trim(xs);
}
const evaluate=(p,x)=>p.reduceRight((s,c)=>s*x+c,0);
function parse(raw,stored){
 if(typeof raw!=="string"||raw.length>(stored?1400:96))throw Error("Enter a shorter polynomial or weighted sum.");
 const src=raw.trim().toLowerCase().replace(/−/g,"-").replace(/[×·]/g,"*").replace(/÷/g,"/").replace(/²/g,"^2").replace(/³/g,"^3");
 const tokens=[],re=/\s*((?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d{1,3})?|[xf()+\-*/^])/y;
 let pos=0,m;
 while(pos<src.length){re.lastIndex=pos;m=re.exec(src);
  if(!m)throw Error("Use x, decimal numbers, parentheses and + − × ÷ ^. Write * for multiplication.");
  tokens.push(/^\d|^\./.test(m[1])?value(Number(m[1])):m[1]);pos=re.lastIndex;
 }
 let i=0;
 function take(t){if(tokens[i]!==t)return false;i++;return true;}
 function primary(){
  if(take("(")){const p=expr();if(!take(")"))throw Error("Close the parentheses.");return p;}
  if(!stored&&take("x"))return [0,1];
  if(stored&&take("f")){
   if(!take("("))throw Error("Write f followed by parentheses.");
   const t=expr();if(!take(")"))throw Error("Close the function argument.");
   return [value(stored(t[0]))];
  }
  if(typeof tokens[i]==="number")return [tokens[i++]];
  throw Error(stored?"Enter a calculation with the stored function f.":"Enter a polynomial in x.");
 }
 function pow(){
  let a=primary();if(!take("^"))return a;
  const e=unary();if(e.length!==1||!Number.isInteger(e[0])||e[0]<0||e[0]>degree)throw Error("Use whole-number powers from 0 to 8.");
  let from=[1];for(let j=0;j<e[0];j++)from=mult(from,a);return from;
 }
 function unary(){if(take("-"))return unary().map(x=>-x);if(take("+"))return unary();return pow();}
 function term(){
  let a=unary();
  while(tokens[i]==="*"||tokens[i]==="/"){
   const op=tokens[i++],b=unary();
   if(op==="/"){if(b.length!==1||b[0]===0)throw Error("Divide by a nonzero constant only.");a=a.map(c=>value(c/b[0]));}
   else a=mult(a,b);
  }
  return a;
 }
 function expr(){let a=term();while(tokens[i]==="+"||tokens[i]==="-"){const sign=tokens[i++]==="+"?1:-1;a=add(a,term(),sign);}return a;}
 const coefs=expr();if(i!==tokens.length)throw Error("Check the expression; write * for multiplication.");
 return {src,coefs,at:x=>value(evaluate(coefs,x))};
}
function trapezoid(f,lower,upper,count){
 const model=parse(f),a=decimal(lower,"Lower bound"),b=decimal(upper,"Upper bound");
 const s=String(count??"").trim(),n=Number(s);
 if(!/^\d{1,2}$/.test(s)||n<1||n>12)throw Error("Use a whole number of strips from 1 to 12.");
 if(b<=a)throw Error("The upper bound must be greater than the lower bound.");
 const h=(b-a)/n;
 if(h<1e-6)throw Error("Choose a wider interval.");
 const xs=Array.from({length:n+1},(_,k)=>k===n?b:a+k*h),ys=xs.map(model.at);
 const sum=.5*h*(ys[0]+ys[n]+2*ys.slice(1,-1).reduce((tot,k)=>tot+k,0));
 // Also check plotting sample points, so extreme values cannot escape the bound.
 for(let i=0;i<=64;i++)model.at(a+(b-a)*i/64);
 return {model,a,b,n,h,xs,ys,sum:value(sum)};
}
const format=n=>String(Number(n.toPrecision(11))).replace(/-/g,"−");
function decimalText(n){
 const s=String(n);
 if(!/e/i.test(s))return s;
 const [mant,exp]=s.split(/e/i),neg=mant.startsWith("-"),m=neg?mant.slice(1):mant;
 const digits=m.replace(".",""),spot=(m.indexOf(".")<0?m.length:m.indexOf("."))+Number(exp);
 return (neg?"-":"")+(spot<=0?"0."+"0".repeat(-spot)+digits:spot>=digits.length?digits+"0".repeat(spot-digits.length):digits.slice(0,spot)+"."+digits.slice(spot));
}
function termAt(result,k){
 if(k===0)return decimalText(result.a);if(k===result.n)return decimalText(result.b);
 const x=result.xs[k],s=decimalText(Number(x.toPrecision(12)));
 if(Math.abs(Number(s)-x)<2e-15*Math.max(1,Math.abs(x)))return s;
 return "("+decimalText(result.a)+"+("+decimalText(result.b)+"-("+decimalText(result.a)+"))*"+k+"/"+result.n+")";
}
function makeExpression(result){
 const {xs,n,a,b,h}=result;
 const hh=decimalText(Number((h/2).toPrecision(12)));
 const c=Math.abs(Number(hh)-h/2)<2e-15*Math.max(1,Math.abs(h/2))?hh:"(("+decimalText(b)+"-("+decimalText(a)+"))/"+(2*n)+")";
 const calls=xs.map((_,k)=>"f("+termAt(result,k)+")");
 return c+"*("+calls[0]+(n>1?"+2*("+calls.slice(1,-1).join("+")+")":"")+"+"+calls[n]+")";
}
function numerical(raw,model){
 if(!model&&/f/i.test(raw))throw Error("Define f(x) first.");
 return parse(raw,model?.at??(()=>0)).coefs[0];
}
function answer(raw,result){
 const src=String(raw??"").trim().replace(/−/g,"-");
 if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(src))return false;
 return Math.abs(Number(src)-result.sum)<=Math.max(1e-10,Math.abs(result.sum)*5e-6);
}
global.CT56Math=Object.freeze({parse,trapezoid,format,makeExpression,numerical,answer});
})(typeof window==="undefined"?globalThis:window);
