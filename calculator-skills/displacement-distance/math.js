(function(global){"use strict";
const LIMIT=16, clamp=(v,l,h)=>Math.max(l,Math.min(h,v));
const pretty=x=>String(Number(x.toPrecision(9))).replace(/-/g,"−");
const displayExpr=x=>x.replace(/\^2/g,"²").replace(/\^3/g,"³").replace(/\^4/g,"⁴").replace(/\*/g,"·").replace(/-/g,"−");
const abs=n=>n<0n?-n:n,sg=n=>n<0n?-1:n>0n?1:0;
function gcd(a,b){a=abs(a);b=abs(b);while(b){const t=a%b;a=b;b=t;}return a;}
function Q(n,d=1n){
 if(!n)return [0n,1n];if(!d)throw Error("Divide by a nonzero constant.");
 if(d<0n){n=-n;d=-d;}
 const f=gcd(n,d);return [n/f,d/f];
}
const z=Q(0n),one=Q(1n),neg=a=>[-a[0],a[1]];
const add=(a,b)=>Q(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);
const mul=(a,b)=>Q(a[0]*b[0],a[1]*b[1]),div=(a,b)=>Q(a[0]*b[1],a[1]*b[0]);
const toNum=x=>Number(x[0])/Number(x[1]);
function decimal(s){
 const [raw,e="0"]=String(s).toLowerCase().split("e"),[whole,frac=""]=raw.replace(/^[-+]/,"").split("."),sign=raw.startsWith("-")?-1n:1n;
 const n=sign*BigInt((whole||"0")+frac),power=Number(e)-frac.length;
 return power>=0?Q(n*10n**BigInt(power)):Q(n,10n**BigInt(-power));
}
const number=text=>{
 const s=String(text).trim().replace(/−/g,"-");
 return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s)&&s.length<=24?Number(s):NaN;
};
const trim=p=>{while(p.length>1&&!p.at(-1)[0])p.pop();return p;};
const fval=(p,x)=>p.reduceRight((sum,c)=>add(mul(sum,x),c),z);
const ffloat=(p,x)=>p.reduceRight((sum,c)=>sum*x+c,0);
const dq=p=>p.length<2?[z]:p.slice(1).map((c,i)=>mul(c,Q(BigInt(i+1))));
const zp=p=>p.length===1&&!p[0][0];
function pdivision(p,q){
 if(zp(q))throw Error("Internal polynomial division by zero.");
 const a=p.slice(),out=Array(Math.max(1,p.length-q.length+1)).fill(z);
 for(let i=a.length-q.length;i>=0;i--){
  const u=div(a[i+q.length-1],q.at(-1));out[i]=u;
  q.forEach((c,j)=>{a[i+j]=add(a[i+j],neg(mul(u,c)));});
 }
 return [trim(out),trim(a)];
}
const monic=p=>zp(p)?p:p.map(c=>div(c,p.at(-1)));
function squareFree(p){
 let a=p,b=dq(a);
 while(!zp(b)){const r=pdivision(a,b)[1];a=b;b=r;}
 return monic(pdivision(p,a)[0]);
}
const privatePoly=new WeakMap();
function parse(inp){
 const text=String(inp);
 if(text.length>80||/[\d.]\s+[\d.]/.test(text))throw Error("Enter one short expression without spaces inside numbers.");
 const raw=text.trim().toLowerCase().replace(/^(?:v\([xt]\)|f[₁1]?\(x\)|y)\s*=\s*/,"").replace(/\s/g,"")
 .replace(/−/g,"-").replace(/²/g,"^2").replace(/³/g,"^3").replace(/⁴/g,"^4").replace(/[×·]/g,"*").replace(/÷/g,"/").replace(/t/g,"x");
 const tok=raw.match(/\d+(?:\.\d*)?|\.\d+|[x()+\-*/^]/g)||[];
 if(!raw||tok.join("")!==raw||tok.some((w,i)=>i>0&&/^[\d.]/.test(tok[i-1])&&/^[\d.]/.test(w)))throw Error("Use a polynomial: x or t, numbers, parentheses, + − × ÷ and powers 0 to 4.");
 let i=0;
 const follows=t=>/^(?:x|\(|\d|\.)/.test(t||"");
 const cap=(p,limit=100000000n)=>{if(p.some(c=>abs(c[0])>limit*c[1]))throw Error("Use smaller coefficients.");return p;};
 const plus=(a,b,s)=>trim(cap(Array.from({length:Math.max(a.length,b.length)},(_,i)=>add(a[i]??z,s===1?(b[i]??z):neg(b[i]??z)))));
 function times(a,b){
  if(a.length+b.length-2>4)throw Error("Use degree four or lower.");
  const c=Array(a.length+b.length-1).fill(z);
  a.forEach((x,i)=>b.forEach((y,j)=>{c[i+j]=add(c[i+j],mul(x,y));}));
  return trim(cap(c));
 }
 function atom(){
  const t=tok[i++];
  if(t==="x")return [z,one];
  if(t==="("){const a=expr();if(tok[i++]!==")")throw Error("Check the parentheses.");return a;}
  if(t&&/^[\d.]/.test(t))return cap([decimal(t)]);
  throw Error("Check the expression. Example: (x−1)(x+2).");
 }
 function power(){
  const a=atom();if(tok[i]!=="^")return a;
  i++;const n=tok[i++];if(!/^[0-4]$/.test(n||""))throw Error("Use whole-number powers from zero to four.");
  let b=[one];for(let j=0;j<Number(n);j++)b=times(a,b);return b;
 }
 function unary(){if(tok[i]==="-"){i++;return unary().map(neg);}if(tok[i]==="+"){i++;return unary();}return power();}
 function term(){
  let a=unary();
  while(i<tok.length){
   const x=tok[i];
   if(x==="*"){i++;a=times(a,unary());}
   else if(x==="/"){i++;const b=unary();if(follows(tok[i])||b.length!==1||!b[0][0])throw Error("Divide by a nonzero constant; use explicit × after division.");a=cap(a.map(v=>div(v,b[0])));}
   else if(follows(x))a=times(a,unary());else break;
  }
  return trim(a);
 }
 function expr(){let a=term();while(tok[i]==="-"||tok[i]==="+"){const sign=tok[i++]==="+"?1:-1;a=plus(a,term(),sign);}return a;}
 const exact=trim(expr());if(i!==tok.length)throw Error("Check the expression and parentheses.");cap(exact,1000n);
 const p=Object.freeze(exact.map(toNum)),model=Object.freeze({raw,p,f:x=>ffloat(p,x)});
 privatePoly.set(model,exact);return model;
}
function sturmVar(seq,x){
 let last=0,v=0;
 for(const p of seq){const n=sg(fval(p,x)[0]);if(!n)continue;if(last&&n!==last)v++;last=n;}
 return v;
}
function rootData(p,l,h){
 if(p.length===1)return [];
 const F=squareFree(p), seq=[F,dq(F)];
 while(true){
  const rem=pdivision(seq.at(-2),seq.at(-1))[1];
  if(zp(rem))break;
  seq.push(rem.map(neg));
 }
 const L=decimal(l),H=decimal(h), VL=sturmVar(seq,L), VH=sturmVar(seq,H);
 const interior=VL-VH-(fval(F,H)[0]===0n?1:0), out=[];
 for(let k=1;k<=interior;k++){
  let a=l,b=h;
  for(let j=0;j<65;j++){
   const m=a+(b-a)/2;
   if(m===a||m===b)break;
   const x=decimal(m),vm=sturmVar(seq,x),seen=VL-vm;
   if(seen===k&&!fval(F,x)[0]){a=b=m;break;}
   if(seen>=k)b=m;else a=m;
  }
  const x=a+(b-a)/2;
  if(!(x>l&&x<h)||out.length&&x<=out.at(-1))throw Error("These roots are too close to separate at this precision. Try a wider separation.");
  out.push(x);
 }
 return out;
}
function integrate(q,l,h){
 if(!(Number.isFinite(l)&&Number.isFinite(h)&&l>=-LIMIT&&h<=LIMIT&&h>l))throw Error("Choose increasing bounds within −16 to 16.");
 if(h-l<1e-8)throw Error("Use a wider interval in this practice viewer.");
 const p=privatePoly.get(q);if(!p)throw Error("Enter a supported polynomial first.");
 const roots=rootData(p,l,h),touch=[],cross=[],all=[l,...roots,h];
 for(let j=1;j<all.length-1;j++){
  const left=add(decimal(all[j-1]),decimal(all[j])),right=add(decimal(all[j]),decimal(all[j+1]));
  const ls=sg(fval(p,div(left,Q(2n)))[0]),rs=sg(fval(p,div(right,Q(2n)))[0]);
  if(!ls||!rs)throw Error("These roots are too close to classify with confidence.");
  if(ls!==rs)cross.push(all[j]);else touch.push(all[j]);
 }
 const anti=[z,...p.map((c,i)=>div(c,Q(BigInt(i+1))))];
 const exactArea=(a,b)=>toNum(add(fval(anti,decimal(b)),neg(fval(anti,decimal(a)))));
 const stops=[l,...cross,h],pieces=[];let pos=0,negArea=0;
 for(let i=1;i<stops.length;i++){
  const left=stops[i-1],right=stops[i],area=exactArea(left,right);
  if(area>=0)pos+=area;else negArea+=area;
  pieces.push({left,right,area,sign:Math.sign(area)});
 }
 return {total:exactArea(l,h),area:pos-negArea,pos,neg:negArea,roots,cross,touch,pieces,allZero:zp(p)};
}
function windowFor(q,preset,low,high){
 let left=Math.min(-.5,preset[0]-.5,low??Infinity,high??Infinity),right=Math.max(.5,preset[1]+.5,low??-Infinity,high??-Infinity);
 if(low!=null&&low===left)left-=.4;if(high!=null&&high===right)right+=.4;
 const x0=Math.max(-LIMIT,left),x1=Math.min(LIMIT,right),ys=[0];
 if(q)for(let i=0;i<=120;i++)ys.push(q.f(x0+(x1-x0)*i/120));
 const lo=Math.min(...ys),hi=Math.max(...ys),h=Math.max(3,hi-lo);
 return {x0,x1,y0:lo-.14*h,y1:hi+.18*h};
}
function model(v,lower,upper){
 const a=number(lower),b=number(upper);
 if(!(a>=0&&b<=15&&b-a>=.000001))throw Error("Use increasing time bounds from 0 to 15.");
 const q=parse(v);return {q,limits:[a,b],answer:integrate(q,a,b)};
}
function answerNumber(value){
 const s=String(value??"").trim().replace(/−/g,"-");
 return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d{1,3})?$/i.test(s)&&s.length<=30?Number(s):NaN;
}
function match(value,target){
 if(!Number.isFinite(value))return false;
 if(target===0)return value===0;
 return Math.abs(value-target)<=1e-9*Math.abs(target)||Array.from({length:9},(_,i)=>Number(target.toPrecision(i+3))).some(z=>Math.abs(value-z)<=Math.abs(z)*1e-10);
}
function matchTimes(raw,expected){
 if(expected.length===0)return /^(?:none|no|∅)$/i.test(raw.trim());
 const nums=raw.split(/[,;]/).map(answerNumber).sort((a,b)=>a-b);
 return nums.length===expected.length&&new Set(nums).size===nums.length&&nums.every((x,i)=>{
  const nearest=Math.min(i?expected[i]-expected[i-1]:Infinity,i+1<expected.length?expected[i+1]-expected[i]:Infinity);
  return Math.abs(x-expected[i])<nearest/2&&match(x,expected[i]);
 });
}
global.CT53Math=Object.freeze({LIMIT,parse,number,integrate,windowFor,clamp,pretty,displayExpr,model,answerNumber,match,matchTimes});
})(typeof module==="object"&&module.exports?module.exports:globalThis);
