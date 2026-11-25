(function(global){'use strict';

const clamp=(v,l,h)=>Math.max(l,Math.min(h,v));
const pretty=(n)=>n===0?'0':String(Number(n.toPrecision(6))).replace(/-/g,'−');
const prettyX=n=>(n===0?'0':String(n)).replace(/-/g,'−');
function displayExpr(v){return v.replace(/\^2/g,'²').replace(/\^3/g,'³').replace(/\*/g,'·').replace(/-/g,'−')}
const abs=n=>n<0n?-n:n,cap=1n<<900n;
const gcd=(n,d)=>{n=abs(n);d=abs(d);while(d)[n,d]=[d,n%d];return n||1n;};
function Q(n,d=1n){
 if(!d)throw Error("Division by zero.");
 if(d<0n){n=-n;d=-d;}
 const k=gcd(n,d);n/=k;d/=k;
 if(abs(n)>cap||d>cap)throw Error("The entered coefficients are too large for this lesson.");
 return Object.freeze({n,d});
}
const z=Q(0n),one=Q(1n), ratAdd=(a,b)=>Q(a.n*b.d+b.n*a.d,a.d*b.d),
 ratNeg=a=>Q(-a.n,a.d),ratSub=(a,b)=>ratAdd(a,ratNeg(b)),ratMul=(a,b)=>Q(a.n*b.n,a.d*b.d),
 ratDiv=(a,b)=>Q(a.n*b.d,a.d*b.n),ratNum=a=>Number(a.n)/Number(a.d),
 ratSign=a=>a.n>0n?1:a.n<0n?-1:0;
function decimal(s){
 const parts=s.match(/^([+-]?)(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/i);
 if(!parts)throw Error("Invalid decimal.");
 const [,sign,a,b="",ex="0"]=parts;
 const scale=Number(ex)-b.length,v=BigInt((a+b)||"0")*(sign==="-"?-1n:1n);
 return scale<0?Q(v,10n**BigInt(-scale)):Q(v*10n**BigInt(scale));
}
function parse(raw){
  if(typeof raw!=='string'||raw.length>80)throw Error('Enter a function of up to 80 characters.');
  if(/[0-9.]\s+[0-9.]/.test(raw))throw Error('Check the number format: use no spaces within a number.');
  const str=raw.trim().toLowerCase().replace(/^[fy](?:[₁1]?\(x\))?\s*=\s*/,'').replace(/\s/g,'').replace(/−/g,'-').replace(/[²³]/g,n=>n==="²"?"^2":"^3").replace(/[×·]/g,'*').replace(/÷/g,'/');
  if(!str||str.length>80) throw Error('Enter a polynomial in x of degree up to three.');
  const tokens=str.match(/\d+(?:\.\d*)?|\.\d+|[x()+\-*/^]/g)||[];
  if(tokens.join('')!==str)throw Error('Use numbers, x, parentheses and + − × ÷. Use ^2 for a square or ^3 for a cube.');
  if(tokens.some((v,i)=>i>0&&/^[0-9.]/.test(v)&&/^[0-9.]/.test(tokens[i-1])))throw Error('Check the number format.');
  let at=0;
  const atTok=()=>tokens[at];
  const c=(n)=>[n,z,z,z];
  function add(a,b,k=1){return a.map((v,i)=>(k===1?ratAdd:ratSub)(v,b[i]));}
  function mul(a,b){
    let out=Array(7).fill(z);
    a.forEach((v,i)=>b.forEach((w,j)=>out[i+j]=ratAdd(out[i+j],ratMul(v,w))));
    if(out.slice(4).some(a=>a.n))throw Error('Use a polynomial of degree no higher than three.');
    return out.slice(0,4);
  }
  function atom(){
    let t=tokens[at++];
    if(t==='('){let v=expr();if(tokens[at++]!==')')throw Error('Check the parentheses.');return v;}
    if(t==='x')return [z,one,z,z];
    if(t&&/^(?:\d|\.)/.test(t))return c(decimal(t));
    throw Error('Check the expression. Example: 2(x−1)^2+3.');
  }
  function power(){
    let v=atom();
    if(atTok()==='^'){at++;let n=tokens[at++];if(n==='3')return mul(mul(v,v),v);if(n==='2')return mul(v,v);if(n==='1')return v;if(n==='0')return c(one);throw Error('The practice tool supports powers 0, 1, 2 and 3.');}
    return v;
  }
  function unary(){if(atTok()==='-'){at++;return unary().map(ratNeg);}if(atTok()==='+'){at++;return unary()}return power()}
  function term(){
    let v=unary();
    while(at<tokens.length){
      const t=atTok();
      if(t==='*'){at++;v=mul(v,unary())}
      else if(t==='/'){at++;let q=unary();const next=atTok();if(next==="("||next==="x"||/^(?:\d|\.)/.test(next||""))throw Error("Use parentheses or explicit × after division.");if(!q[0].n||q[1].n||q[2].n||q[3].n)throw Error('Only division by a nonzero constant is supported.');v=v.map(w=>ratDiv(w,q[0]));}
      else if(t==='('||t==='x'||/^(?:\d|\.)/.test(t)){v=mul(v,unary());}else break;
    }
    return v;
  }
  function expr(){
    let v=term();
    while(atTok()==='+'||atTok()==='-'){const t=tokens[at++];v=add(v,term(),t==='-'?-1:1);}
    return v;
  }

  const exact=Object.freeze(expr()),coeff=exact.map(ratNum);
  if(at!==tokens.length)throw Error('Check the expression and parentheses.');
  if(!coeff.every(v=>Number.isFinite(v)&&Math.abs(v)<=10000)||exact.some(v=>abs(v.n)>(1n<<96n)||v.d>(1n<<96n)))throw Error('Use finite coefficients up to ten thousand and avoid excessive fractional precision.');
  return Object.freeze({raw:str,exact,coeff:Object.freeze(coeff),f:x=>((coeff[3]*x+coeff[2])*x+coeff[1])*x+coeff[0]});
}
const equivalent=(a,b)=>Boolean(a&&b)&&a.exact.every((v,i)=>v.n===b.exact[i].n&&v.d===b.exact[i].d);
function readX(s){
 if(typeof s!=="string"||!s.trim()||s.length>19||!/^[+−-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d{1,2})?$/i.test(s.trim()))return null;
 const raw=s.replace("−","-").trim(),n=Number(raw);
 if(!Number.isFinite(n)||Math.abs(n)>100)return null;
 const a=decimal(raw),b=decimal(String(n));
 return a.d<=10n**24n&&a.n===b.n&&a.d===b.d?n:null;
}
const dx=(q,x)=>((3*q.coeff[3]*x+2*q.coeff[2])*x+q.coeff[1]);
const rs=(q,x)=>{
 const X=decimal(String(x)),[,c,b,a]=q.exact;
 return ratAdd(ratMul(ratAdd(ratMul(ratMul(a,Q(3n)),X),ratMul(b,Q(2n))),X),c);
};
function roots(q){
 const [,c,b,a]=q.exact,A=ratMul(a,Q(3n)),B=ratMul(b,Q(2n)),C=c;
 if(!A.n)return B.n?[{x:ratNum(ratDiv(ratNeg(C),B)),cross:true}]:[];
 const D=ratSub(ratMul(B,B),ratMul(Q(4n),ratMul(A,C)));
 if(D.n<0n)return [];
 if(!D.n)return [{x:ratNum(ratDiv(ratNeg(B),ratMul(Q(2n),A))),cross:false}];
 const [bn,cn,an,dn]=[B,C,A,D].map(ratNum),k=-.5*(bn+(bn<0?-1:1)*Math.sqrt(dn));
 const out=[k/an,cn/k].sort((a,b)=>a-b);
 if(!out.every(Number.isFinite)||out[0]===out[1])return [];
 return out.map(x=>({x,cross:true}));
}
const exactHeight=(q,x)=>{const t=decimal(String(x));return ratNum([...q.exact].reverse().reduce((z,a)=>ratAdd(ratMul(z,t),a),z));};
function nearestSignInfo(q,rt){
 const r=roots(q),dist=Math.min(...r.filter(y=>y.x!==rt.x).map(y=>Math.abs(y.x-rt.x)/4));
 const h=Math.min(.25,dist),left=rt.x-h,right=rt.x+h;
 const sl=ratNum(rs(q,left)),sr=ratNum(rs(q,right));
 const first=Math.sign(sl),second=Math.sign(sr);
 const kind=first>0&&second<0?"maximum":first<0&&second>0?"minimum":first&&second&&!rt.cross?"stationary inflection":"unresolved";
 return {x:rt.x,y:exactHeight(q,rt.x),slope:0,left,right,sl,sr,kind};
}
function inspect(q,x,bracketProof=false){
 const r=roots(q).find(r=>r.x===x);
 const exact=rs(q,x);
 if(r&&(bracketProof||!exact.n))return nearestSignInfo(q,r);
 return {x,y:exactHeight(q,x),slope:ratNum(exact),kind:q.exact.slice(1).every(a=>!a.n)?"constant":"not verified"};
}
function between(q,a,b){
 if(!(a<b))throw Error("Choose an upper bound greater than the lower bound.");
 const candidates=roots(q).filter(r=>r.cross&&r.x>a&&r.x<b);
 if(candidates.length>1)throw Error("Bracket just one crossing of the derivative.");
 if(candidates.length!==1||ratSign(rs(q,a))*ratSign(rs(q,b))>=0)
  throw Error("No single sign-changing derivative root in these bounds. A touching root needs a separate check.");
 return candidates[0].x;
}
function window(q,both){
 if(!q)return {x0:-4,x1:4,y0:-5,y1:7};
 const r=roots(q).map(o=>o.x).filter(x=>Math.abs(x)<=20);
 const x0=Math.max(-20,Math.min(-2.4,...r.map(x=>x-1))),x1=Math.min(20,Math.max(2.4,...r.map(x=>x+1)));
 const v=[0];
 for(let i=0;i<=100;i++){
  const x=x0+(x1-x0)*i/100;v.push(q.f(x));if(both)v.push(dx(q,x));
 }
 const low=Math.min(...v),high=Math.max(...v),pad=Math.max(high-low,3)*.11;
 return {x0,x1,y0:low-pad,y1:high+pad};
}
global.CT52Math=Object.freeze({parse,dx,roots,inspect,between,window,equivalent,readX,displayExpr,pretty,prettyX,clamp});
})(typeof module==='object'&&module.exports?module.exports:globalThis);
