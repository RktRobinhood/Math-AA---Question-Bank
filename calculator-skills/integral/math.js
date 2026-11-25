(function(global){"use strict";
const LIMIT=20, clamp=(v,l,h)=>Math.max(l,Math.min(h,v));
const pretty=x=>String(Number(x.toPrecision(9))).replace(/-/g,"−");
const displayExpr=x=>x.replace(/\^2/g,"²").replace(/\^3/g,"³").replace(/\^4/g,"⁴").replace(/\*/g,"·").replace(/-/g,"−");
const trim=p=>{while(p.length>1&&p.at(-1)===0)p.pop();return p;};
const value=(p,x)=>p.reduceRight((sum,k)=>sum*x+k,0);
function parse(inp){
 const text=String(inp);
 if(text.length>80||/[\d.]\s+[\d.]/.test(text))throw Error("Enter one short expression without spaces inside numbers.");
 const raw=text.trim().toLowerCase().replace(/^(?:f[₁1]?\(x\)|y)\s*=\s*/,"").replace(/\s/g,"")
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
function integrate(q,l,h){
 if(!(Number.isFinite(l)&&Number.isFinite(h)&&l>=-LIMIT&&h<=LIMIT&&h>l))throw Error("Choose increasing bounds within −20 to 20.");
 if(h-l<1e-8)throw Error("Use a wider interval in this practice viewer.");
 const z=roots(q.p,l,h).filter(x=>x>l&&x<h),stops=[l,...z,h],pieces=[];
 const x=Math.sqrt(3/5);
 let pos=0,neg=0;
 for(let i=1;i<stops.length;i++){
  const left=stops[i-1],right=stops[i],w=(right-left)/2,c=left+w;
  const a=w*(5/9*q.f(c-w*x)+8/9*q.f(c)+5/9*q.f(c+w*x));
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
 let left=Math.min(-2,preset[0]-1,low??Infinity,high??Infinity),right=Math.max(7,preset[1]+1,low??-Infinity,high??-Infinity);
 if(low!=null&&low===left)left-=.4;if(high!=null&&high===right)right+=.4;
 const x0=Math.max(-LIMIT,left),x1=Math.min(LIMIT,right),ys=[0];
 if(q)for(let i=0;i<=180;i++)ys.push(q.f(x0+(x1-x0)*i/180));
 const lo=Math.min(...ys),hi=Math.max(...ys),h=Math.max(3,hi-lo);
 return {x0,x1,y0:lo-.14*h,y1:hi+.18*h};
}
global.CT54Math=Object.freeze({LIMIT,parse,number,roots,integrate,windowFor,clamp,pretty,displayExpr});
})(typeof module==="object"&&module.exports?module.exports:globalThis);
