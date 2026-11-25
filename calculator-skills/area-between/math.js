(function(global){"use strict";
const LIMIT=20, clamp=(v,l,h)=>Math.max(l,Math.min(h,v));
const pretty=x=>String(Number(x.toPrecision(9))).replace(/-/g,"−");
const displayExpr=x=>x.replace(/\^2/g,"²").replace(/\^3/g,"³").replace(/\^4/g,"⁴").replace(/\*/g,"·").replace(/-/g,"−");
const trim=p=>{while(p.length>1&&p.at(-1)===0)p.pop();return p;};
const value=(p,x)=>p.reduceRight((sum,k)=>sum*x+k,0);
const precisionMessage="The curves are too close to distinguish reliably here. Try simpler coefficients or a different interval.";
const precision=()=>Object.assign(new Error(precisionMessage),{code:"CT55_PRECISION"});
function safeSum(a,b){
 const s=a+b;
 if((s===a&&b!==0)||(s===b&&a!==0))throw precision();
 return s;
}
function decimalForm(d){
 const [base,exponent="0"]=d.toLowerCase().split("e"),[whole,frac=""]=base.split(".");
 const unpadded=(whole+frac).replace(/^0+/,""),digits=unpadded.replace(/0+$/,"");
 return digits?digits+"@"+(Number(exponent)-frac.length+unpadded.length-digits.length):"0";
}
function readCoefficient(t){
 const x=Number(t);
 if(Number.isFinite(x)&&decimalForm(t)!==decimalForm(String(x)))throw precision();
 return x;
}
const near=(p,x,y)=>Math.abs(y)<=16*Number.EPSILON*p.reduceRight((sum,k)=>sum*Math.abs(x)+Math.abs(k),0);
// Only use exact dyadic arithmetic to distinguish a genuine floating-point
// polynomial zero from cancellation; it does not replace the normal solver.
const bits=new DataView(new ArrayBuffer(8));
function dyadic(x){
 bits.setFloat64(0,x);
 const b=bits.getBigUint64(0),e=Number((b>>52n)&2047n),f=b&((1n<<52n)-1n),n=e?f+(1n<<52n):f;
 return [(b>>63n)?-n:n,(e||1)-1075];
}
function exactZero(p,x){
 const [nx,ex]=dyadic(x);
 let n=0n,e=0;
 for(let i=p.length-1;i>=0;i--){
  const [c,ce]=dyadic(p[i]),next=e+ex,smaller=Math.min(next,ce);
  n=((n*nx)<<BigInt(next-smaller))+(c<<BigInt(ce-smaller));e=n===0n?0:smaller;
 }
 return n===0n;
}
function verifiedStop(p,x,interior,l,h){
 if(exactZero(p,x))return x===0?0:x;
 if(interior){
  // A derivative root from bisection can lie a few ULPs from an exact
  // repeated root. Snap only to a nearby coordinate proven to be a zero.
  const margin=32*Number.EPSILON*Math.max(1,Math.abs(x));
  for(let k=0;k<=40;k++){
   const grid=2**k,y=Math.round(x*grid)/grid;
   if(y!==x&&y>l&&y<h&&Math.abs(y-x)<=margin&&exactZero(p,y))return y;
  }
 }
 throw precision();
}
function parse(inp){
 const text=String(inp);
 if(text.length>80||/[\d.]\s+[\d.]/.test(text))throw Error("Enter one short expression without spaces inside numbers.");
 const raw=text.trim().toLowerCase().replace(/^(?:f[₁₂12]?\(x\)|y)\s*=\s*/,"").replace(/\s/g,"")
  .replace(/−/g,"-").replace(/²/g,"^2").replace(/³/g,"^3").replace(/⁴/g,"^4").replace(/[×·]/g,"*").replace(/÷/g,"/");
 const tok=raw.match(/\d+(?:\.\d*)?|\.\d+|[x()+\-*/^]/g)||[];
 if(!raw||tok.join("")!==raw||tok.some((t,i)=>i>0&&/^[\d.]/.test(tok[i-1])&&/^[\d.]/.test(t)))throw Error("Use a polynomial in x: numbers, parentheses, + − × ÷ and powers 0 to 4.");
 let i=0;
 const follows=t=>/^(?:x|\(|\d|\.)/.test(t||"");
 const cap=v=>{if(!v.every(Number.isFinite)||v.some(x=>Math.abs(x)>1e8))throw Error("Use smaller coefficients.");return v;};
 const add=(a,b,sg)=>trim(cap(Array.from({length:Math.max(a.length,b.length)},(_,j)=>safeSum(a[j]||0,sg*(b[j]||0)))));
 function mul(a,b){
  let c=new Array(a.length+b.length-1).fill(0);
  a.forEach((v,j)=>b.forEach((w,k)=>{const term=v*w;if(term===0&&v!==0&&w!==0)throw precision();c[j+k]=safeSum(c[j+k],term);}));
  c=trim(cap(c));if(c.length>5)throw Error("Use degree four or lower.");return c;
 }
 function atom(){
  const t=tok[i++];
  if(t==="x")return [0,1];
  if(t==="("){const a=expr();if(tok[i++]!==")")throw Error("Check the parentheses.");return a;}
  if(t&&/^[\d.]/.test(t))return cap([readCoefficient(t)]);
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
   else if(t==="/"){i++;const d=unary();if(follows(tok[i])||d.length!==1||d[0]===0)throw Error("Divide by a nonzero constant; use explicit × after division.");a=cap(a.map(v=>{const q=v/d[0];if(q===0&&v!==0)throw precision();return q;}));}
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
 const stops=[l,...critical,h].map((x,i)=>{
  const y=value(p,x);
  return near(p,x,y)?[verifiedStop(p,x,i>0&&i<=critical.length,l,h),0]:[x,y];
 }),out=[];
 for(let i=0;i<stops.length;i++){
  const [a,fa]=stops[i];
  if(fa===0)out.push(a);
  if(i===stops.length-1)continue;
  const [b,fb]=stops[i+1];
  if(fa===0||fb===0||Math.sign(fa)===Math.sign(fb))continue;
  let x=a,y=b;
  for(let j=0;j<65;j++){const m=(x+y)/2,w=value(p,m);if(w===0){x=y=m;break;} if((w<0)===(fa<0))x=m;else y=m;}
  out.push((x+y)/2);
 }
 return out.sort((a,b)=>a-b);
}
function integrate(q,l,h){
 if(!(Number.isFinite(l)&&Number.isFinite(h)&&l>=-LIMIT&&h<=LIMIT&&h>l))throw Error("Choose increasing bounds within −20 to 20.");
 if(h-l<1e-8)throw Error("Use a wider interval in this practice viewer.");
 const z=roots(q.p,l,h).filter(x=>x>l&&x<h),stops=[l,...z,h],pieces=[];
 const x=Math.sqrt(3/5);
 let pos=0,neg=0;
 for(let i=1;i<stops.length;i++){
  const left=stops[i-1],right=stops[i],w=(right-left)/2,c=left+w;
  const samples=[c-w*x,c,c+w*x],ys=samples.map(q.f);
  // Cancellation throughout a piece can make the geometry below simulator precision.
  if(q.p.some(v=>v!==0)&&samples.every((t,j)=>near(q.p,t,ys[j])))throw precision();
  const a=w*(5/9*ys[0]+8/9*ys[1]+5/9*ys[2]);
  pieces.push({left,right,area:a,sign:Math.sign(a)});
  if(a>=0)pos+=a;else neg+=a;
 }
 const area=pos-neg;
 // Expand about the interval midpoint. Odd terms integrate to zero exactly.
 // This avoids discarding a genuinely nonzero narrow signed total by summing large opposite lobes.
 const mid=l+(h-l)/2,span=(h-l)/2,choose=[[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1]];
 const even=(power)=>q.p.reduce((sum,c,k)=>k<power?sum:sum+c*choose[k][power]*mid**(k-power),0);
 const signed=2*span*(even(0)+even(2)*span**2/3+even(4)*span**4/5),total=signed===0?0:signed;
 return {total,area,pos,neg,roots:z,pieces};
}
function windowFor(q,preset,low,high){
 const margin=(preset[1]-preset[0])*.2;
 const x0=Math.max(-LIMIT,Math.min(preset[0]-margin,low??Infinity,high??Infinity));
 const x1=Math.min(LIMIT,Math.max(preset[1]+margin,low??-Infinity,high??-Infinity));
 const ys=[];
 for(const curve of [q].flat().filter(Boolean))for(let i=0;i<=180;i++)ys.push(curve.f(x0+(x1-x0)*i/180));
 if(!ys.length)ys.push(-3,3);
 const lo=Math.min(...ys),hi=Math.max(...ys);
 const h=(hi-lo)||Math.max(.3,Math.abs(lo)*.16);
 const a=lo-.19*h,b=hi+.2*h;
 return {x0,x1,y0:a,y1:b};
}
function difference(f,g){
 const p=trim(Array.from({length:Math.max(f.p.length,g.p.length)},(_,i)=>safeSum(f.p[i]||0,-(g.p[i]||0))));
 return {p,f:x=>value(p,x)};
}
function between(f,g,l,h){
 const d=difference(f,g), r=integrate(d,l,h);
 const crossings=r.roots.filter((x,i)=>r.pieces[i].sign*r.pieces[i+1].sign<0);
 return {...r,crossings};
}
global.CT55Math=Object.freeze({LIMIT,parse,number,between,windowFor,clamp,pretty,displayExpr});
})(typeof module==="object"&&module.exports?module.exports:globalThis);
