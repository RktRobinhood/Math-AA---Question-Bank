(function(global){"use strict";
const LIMIT=20, clamp=(v,l,h)=>Math.max(l,Math.min(h,v));
const pretty=x=>String(Number(x.toPrecision(9))).replace(/-/g,"−");
const displayExpr=x=>x.replace(/\^2/g,"²").replace(/\^3/g,"³").replace(/\^4/g,"⁴").replace(/\*/g,"·").replace(/-/g,"−");
const trim=p=>{while(p.length>1&&p.at(-1)===0)p.pop();return p;};
const value=(p,x)=>p.reduceRight((sum,k)=>sum*x+k,0);
function polynomial(inp){
 const text=String(inp);
 if(text.length>80||/[\d.]\s+[\d.]/.test(text))throw Error("Enter one short expression without spaces inside numbers.");
 const raw=text.trim().toLowerCase().replace(/^(?:f[₁₂12]?\(x\)|y)\s*=\s*/,"").replace(/\s/g,"")
  .replace(/−/g,"-").replace(/²/g,"^2").replace(/³/g,"^3").replace(/⁴/g,"^4").replace(/[×·]/g,"*").replace(/÷/g,"/");
 const tok=raw.match(/\d+(?:\.\d*)?|\.\d+|[x()+\-*/^]/g)||[];
 if(!raw||tok.join("")!==raw||tok.some((t,i)=>i>0&&/^[\d.]/.test(tok[i-1])&&/^[\d.]/.test(t)))throw Error("Use a polynomial in x: numbers, parentheses, + − × ÷ and powers 0 to 4.");
 let i=0;
 const follows=t=>/^(?:x|\(|\d|\.)/.test(t||"");
 const cap=v=>{if(!v.every(Number.isFinite)||v.some(x=>Math.abs(x)>1e8))throw Error("Use smaller coefficients.");return v;};
 const add=(a,b,sg)=>trim(cap(Array.from({length:Math.max(a.length,b.length)},(_,j)=>(a[j]||0)+sg*(b[j]||0))));
 function mul(a,b){
  let c=new Array(a.length+b.length-1).fill(0);
  a.forEach((v,j)=>b.forEach((w,k)=>c[j+k]+=v*w));
  c=trim(cap(c));if(c.length>5)throw Error("Use degree four or lower.");return c;
 }
 function atom(){
  const t=tok[i++];
  if(t==="x")return [0,1];
  if(t==="("){const a=expr();if(tok[i++]!==")")throw Error("Check the parentheses.");return a;}
  if(t&&/^[\d.]/.test(t))return cap([Number(t)]);
  throw Error("Check the expression. Example: (x−1)(x+2).");
 }
 function power(){
  const a=atom();if(tok[i]!=="^")return a;
  i++;const n=tok[i++];
  if(!/^[0-4]$/.test(n||""))throw Error("Use whole-number powers from zero to four.");
  let b=[1];for(let j=0;j<Number(n);j++)b=mul(a,b);return b;
 }
 function unary(){
  if(tok[i]==="-"){i++;return unary().map(v=>-v);}
  if(tok[i]==="+"){i++;return unary();}
  return power();
 }
 function term(){
  let a=unary();
  while(i<tok.length){
   const t=tok[i];
   if(t==="*"){i++;a=mul(a,unary());}
   else if(t==="/"){i++;const d=unary();if(follows(tok[i])||d.length!==1||d[0]===0)throw Error("Divide by a nonzero constant; use explicit × after division.");a=cap(a.map(v=>v/d[0]));}
   else if(follows(t)){a=mul(a,unary());}else break;
  }return trim(a);
 }
 function expr(){let a=term();while(tok[i]==="-"||tok[i]==="+"){const sg=tok[i++]==="+"?1:-1;a=add(a,term(),sg);}return a;}
 const p=trim(expr());if(i!==tok.length)throw Error("Check the expression and parentheses.");
 if(p.some(x=>Math.abs(x)>1000))throw Error("Keep the final coefficients between −1000 and 1000.");
 return Object.freeze({raw,p:Object.freeze(p),f:x=>value(p,x)});
}
function number(text){
 const s=String(text).trim().replace(/−/g,"-");
 return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s)&&s.length<=24?Number(s):NaN;
}
function roots(p,l,h){
 const deg=p.length-1;
 if(!deg)return [];
 if(p[0]===0){
  let i=1;while(i<deg&&p[i]===0)i++;
  const remaining=roots(p.slice(i),l,h);
  return (l<=0&&h>=0?[0,...remaining]:remaining).sort((a,b)=>a-b);
 }
 if(deg===1){const z=-p[0]/p[1];return z>=l&&z<=h?[z||0]:[];}
 const critical=roots(p.slice(1).map((v,i)=>v*(i+1)),l,h).filter(x=>x>l&&x<h);
 const stops=[l,...critical,h],out=[];
 const near=(x,y)=>Math.abs(y)<=16*Number.EPSILON*p.reduceRight((sum,k)=>sum*Math.abs(x)+Math.abs(k),0);
 for(let i=0;i<stops.length;i++){
  const a=stops[i],fa=value(p,a);
  if(near(a,fa))out.push(a===0?0:a);
  if(i===stops.length-1)continue;
  const b=stops[i+1],fb=value(p,b);
  if(near(a,fa)||near(b,fb)||Math.sign(fa)===Math.sign(fb))continue;
  let x=a,y=b;
  for(let j=0;j<65;j++){const m=(x+y)/2,w=value(p,m);if(w===0){x=y=m;break;} if((w<0)===(fa<0))x=m;else y=m;}
  out.push((x+y)/2);
 }
 return out.sort((a,b)=>a-b);
}
const normalize=raw=>String(raw).trim().toLowerCase().replace(/^(?:f[₁₂12]?\(x\)|y)\s*=\s*/,"")
 .replace(/\s/g,"").replace(/−/g,"-").replace(/²/g,"^2").replace(/³/g,"^3").replace(/⁴/g,"^4").replace(/[×·]/g,"*").replace(/÷/g,"/");
const close=(a,b)=>Math.abs(a-b)<=2e-11*(1+Math.abs(a)+Math.abs(b));
function part(raw){
 if(/^[+-]?(?:x|(?:\d+\.?\d*|\.\d+))$/.test(raw))return raw;
 if(raw[0]!=="("||raw.at(-1)!==")")return null;
 let depth=0;
 for(let i=0;i<raw.length;i++){
  if(raw[i]==="(")depth++;
  if(raw[i]===")")depth--;
  if(depth===0&&i<raw.length-1||depth<0)return null;
 }
 return depth===0?raw.slice(1,-1):null;
}
function parse(raw,allowRational=true){
 const source=String(raw);
 try{const q=polynomial(raw);return Object.freeze({raw:q.raw,p:q.p,d:Object.freeze([1]),f:q.f});}catch(e){if(!allowRational)throw e;}
 if(source.length>80||/[\d.]\s+[\d.]/.test(source))throw Error("Enter one short expression without spaces inside numbers.");
 const text=normalize(source);
 let depth=0,slash=-1;
 for(let i=0;i<text.length;i++){
  const c=text[i];if(c==="(")depth++;if(c===")")depth--;
  if(c==="/"&&depth===0){if(slash!==-1)throw Error("Use one fraction with a bracketed numerator and denominator.");slash=i;}
 }
 const a=slash>=0?part(text.slice(0,slash)):null,b=slash>=0?part(text.slice(slash+1)):null;
 if(depth!==0||a==null||b==null)throw Error("Use a polynomial or a single fraction, for example (x^2−4)/(x−1).");
 const p=polynomial(a).p,d=polynomial(b).p;
 if(d.length>3||d.length===1&&d[0]===0)throw Error("Use a nonzero denominator of degree at most two.");
 return Object.freeze({raw:text,p,d,f:x=>{const v=value(d,x);return v===0?NaN:value(p,x)/v;}});
}
function subtract(a,b){
 const p=Array(Math.max(a.p.length,b.p.length+a.d.length-1)).fill(0);
 a.p.forEach((v,i)=>p[i]=v);b.p.forEach((v,i)=>a.d.forEach((w,j)=>p[i+j]-=v*w));
 return trim(p);
}
const included=(sg,op)=>op==="lt"?sg<0:op==="le"?sg<=0:op==="gt"?sg>0:sg>=0;
function limits(a,b){if(!(Number.isFinite(a)&&Number.isFinite(b)&&a>=-LIMIT&&b<=LIMIT&&b-a>=1e-7))throw Error("Choose increasing decimal bounds from −20 to 20.");}
function zeros(curves,a,b){
 const [left,right]=curves,cross=subtract(left,right),denom=roots(left.d,a,b);
 const equality=roots(cross,a,b).filter(x=>!denom.some(d=>close(d,x)));
 return {cross,denom,equality,identical:cross.length===1&&cross[0]===0};
}
function compare(curves,x){
 const [left,right]=curves,den=value(left.d,x);
 const mag=p=>p.reduceRight((s,a)=>s*Math.abs(x)+Math.abs(a),0);
 if(Math.abs(den)<=16*Number.EPSILON*mag(left.d))return {sign:null};
 const p=subtract(left,right),n=value(p,x),sign=Math.abs(n)<=16*Number.EPSILON*mag(p)?0:Math.sign(n)*Math.sign(den);
 return {sign,left:left.f(x),right:right.f(x)};
}
function solve(curves,l,u,op){
 limits(l,u);
 if(!["lt","le","gt","ge"].includes(op))throw Error("Choose a comparison.");
 const result=zeros(curves,l,u),{denom,equality}=result;
 const xs=[l,...denom.filter(x=>!close(x,l)&&!close(x,u)),...equality.filter(x=>!close(x,l)&&!close(x,u)),u].sort((a,b)=>a-b)
  .filter((x,i,a)=>!i||!close(x,a[i-1]));
 const points=xs.map(x=>denom.some(d=>close(d,x))?null:equality.some(e=>close(e,x))?0:compare(curves,x).sign);
 const valid=points.map(s=>s!==null&&included(s,op)),out=[];
 const push=(l,r,lc,rc)=>{
  const p=out.at(-1);if(p&&close(p.r,l)&&(p.rc||lc)){p.r=r;p.rc=rc;}
  else out.push({l,r,lc,rc});
 };
 for(let i=0;i<xs.length;i++){
  const a=xs[i],b=xs[i+1];
  if(valid[i])push(a,a,true,true);
  if(b!==undefined){
   const test=a+(b-a)/2,s=compare(curves,test).sign;
   if(s!==null&&included(s,op))push(a,b,valid[i],valid[i+1]);
  }
 }
 return {...result,points,breaks:xs,intervals:out};
}
function rootsIn(curves,a,b){
 limits(a,b);const z=zeros(curves,a,b);
 if(z.identical)throw Error("The curves coincide wherever they are defined, not at one isolated intersection.");
 if(!z.equality.length)throw Error("No intersection in this bracket. An undefined value is not a crossing.");
 if(z.equality.length!==1)throw Error("More than one intersection. Use a narrower bracket.");
 const x=z.equality[0];return {x,y:curves[1].f(x)};
}
const fmtInterval=items=>items.length?items.map(({l,r,lc,rc})=>l===r?"{"+pretty(l)+"}":(lc?"[":"(")+pretty(l)+", "+pretty(r)+(rc?"]":")")).join(" ∪ "):"∅";
function answerNumber(text){
 const s=String(text).trim();
 return s.length<=26&&/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d{1,3})?$/i.test(s)?Number(s):NaN;
}
function decodeIntervals(inp){
 const t=String(inp).trim().replace(/−/g,"-");
 if(/^(?:∅|empty|empty set|no solution)$/i.test(t))return [];
 if(t.length>200)throw Error("Use interval notation.");
 const result=t.split(/\s*(?:∪|[uU])\s*/).map(s=>{
  const one=/^\{([^{}]+)\}$/.exec(s);
  if(one){const n=answerNumber(one[1]);if(Number.isFinite(n))return {l:n,r:n,lc:true,rc:true};}
  const v=/^([\[(])\s*([^,]+)\s*,\s*([^,]+)\s*([\])])$/.exec(s);
  if(!v)throw Error("Use interval notation, for example (1, 3] U [5, 6].");
  const l=answerNumber(v[2]),r=answerNumber(v[3]),lc=v[1]==="[",rc=v[4]==="]";
  if(!Number.isFinite(l)||!Number.isFinite(r)||r<l||(r===l&&!(lc&&rc)))throw Error("Use finite, increasing endpoints and matching brackets.");
  return {l,r,lc,rc};
 }).sort((a,b)=>a.l-b.l||Number(b.lc)-Number(a.lc)||a.r-b.r);
 const out=[];
 for(const v of result){
  const p=out.at(-1);
  if(p&&(p.r>v.l||p.r===v.l&&(p.rc||v.lc))){
   if(v.r>p.r){p.r=v.r;p.rc=v.rc;}else if(v.r===p.r)p.rc=p.rc||v.rc;
  }else out.push(v);
 }
 return out;
}
function grade(text,expected){
 const given=decodeIntervals(text);
 const same=(a,b)=>a===b||Boolean(b)&&[b,...Array.from({length:7},(_,i)=>Number(b.toPrecision(i+6)))].some(v=>Math.abs(a-v)<1e-11*Math.abs(v));
 return given.length===expected.length&&given.every((p,i)=>{const q=expected[i];return p.lc===q.lc&&p.rc===q.rc&&same(p.l,q.l)&&same(p.r,q.r);});
}
function graphWindow(curves,preset,low,high){
 const [a,b]=preset,d=(b-a)*.1;
 const x0=Math.max(-LIMIT,Math.min(a-d,low??Infinity,high??Infinity)),x1=Math.min(LIMIT,Math.max(b+d,low??-Infinity,high??-Infinity));
 const ys=[0];for(const c of curves)for(let i=0;i<=180;i++){const v=c.f(x0+(x1-x0)*i/180);if(Number.isFinite(v))ys.push(v);}
 ys.sort((a,b)=>a-b);const quantile=q=>ys[Math.floor(q*(ys.length-1))];
 const lo=Math.min(0,quantile(.035)),hi=Math.max(0,quantile(.965)),h=Math.max(2,hi-lo);
 return {x0,x1,y0:lo-.12*h,y1:hi+.12*h};
}
function curveSegments(q,l,r){
 const ds=roots(q.d,l,r).filter(x=>x>l&&x<r);
 return [l,...ds,r].slice(1).map((b,i)=>{const a=i?ds[i-1]:l,span=b-a;
  return Array.from({length:131},(_,j)=>{const x=a+span*(.0000001+.9999998*j/130);return {x,y:q.f(x)};}).filter(p=>Number.isFinite(p.y));
 });
}
global.CT13Math=Object.freeze({LIMIT,parse,number,rootsIn,compare,solve,format:fmtInterval,grade,graphWindow,curveSegments,clamp,pretty,displayExpr,symbol:{lt:"<",le:"≤",gt:">",ge:"≥"}});
})(typeof module==="object"&&module.exports?module.exports:globalThis);
