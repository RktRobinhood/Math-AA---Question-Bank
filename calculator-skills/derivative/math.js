(function(global){'use strict';

const clamp=(v,l,h)=>Math.max(l,Math.min(h,v));
const pretty=(n)=>n===0?'0':String(Number(n.toPrecision(6))).replace(/-/g,'−');
const prettyX=n=>(n===0?'0':String(n)).replace(/-/g,'−');
function displayExpr(v){return v.replace(/\^2/g,'²').replace(/\^3/g,'³').replace(/\*/g,'·').replace(/-/g,'−')}
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
  const c=(n)=>[n,0,0,0];
  function add(a,b,k=1){return a.map((v,i)=>v+k*b[i]);}
  function mul(a,b){
    let out=[0,0,0,0,0,0,0];
    a.forEach((v,i)=>b.forEach((w,j)=>out[i+j]+=v*w));
    if(out.slice(4).some(Boolean))throw Error('Use a polynomial of degree no higher than three.');
    return out.slice(0,4);
  }
  function atom(){
    let t=tokens[at++];
    if(t==='('){let v=expr();if(tokens[at++]!==')')throw Error('Check the parentheses.');return v;}
    if(t==='x')return [0,1,0,0];
    if(t&&/^(?:\d|\.)/.test(t))return c(Number(t));
    throw Error('Check the expression. Example: 2(x−1)^2+3.');
  }
  function power(){
    let v=atom();
    if(atTok()==='^'){at++;let n=tokens[at++];if(n==='3')return mul(mul(v,v),v);if(n==='2')return mul(v,v);if(n==='1')return v;if(n==='0')return c(1);throw Error('The practice tool supports powers 0, 1, 2 and 3.');}
    return v;
  }
  function unary(){if(atTok()==='-'){at++;return unary().map(v=>-v);}if(atTok()==='+'){at++;return unary()}return power()}
  function term(){
    let v=unary();
    while(at<tokens.length){
      const t=atTok();
      if(t==='*'){at++;v=mul(v,unary())}
      else if(t==='/'){at++;let q=unary();const next=atTok();if(next==="("||next==="x"||/^(?:\d|\.)/.test(next||""))throw Error("Use parentheses or explicit × after division.");if(!q[0]||q[1]||q[2]||q[3])throw Error('Only division by a nonzero constant is supported.');v=v.map(w=>w/q[0]);}
      else if(t==='('||t==='x'||/^(?:\d|\.)/.test(t)){v=mul(v,unary());}else break;
    }
    return v;
  }
  function expr(){
    let v=term();
    while(atTok()==='+'||atTok()==='-'){const t=tokens[at++];v=add(v,term(),t==='-'?-1:1);}
    return v;
  }

  const coeff=expr();
  if(at!==tokens.length)throw Error('Check the expression and parentheses.');
  if(!coeff.every(v=>Number.isFinite(v)&&Math.abs(v)<=10000))throw Error('Use finite coefficients up to ten thousand.');
  return Object.freeze({raw:str,coeff:Object.freeze(coeff),f:x=>((coeff[3]*x+coeff[2])*x+coeff[1])*x+coeff[0]});
}
function derivative(q,x){
 if(!q||!Number.isFinite(x)||Math.abs(x)>100)return null;
 const [d,c,b,a]=q.coeff;
 // Numeric polynomial slope; neither a symbolic derivative nor TI's firmware.
 const y=q.f(x),slope=(3*a*x+2*b)*x+c,intercept=(((-2*a)*x-b)*x)*x+d;
 return {x,y,slope,intercept};
}
function windowFor(q,aim=0){
 if(!q)return {x0:-4,x1:4,y0:-9,y1:14};
 const center=Math.abs(aim)<=3?0:aim;
 const x0=Math.max(-100,center-4),x1=Math.min(100,center+4);
 const values=Array.from({length:41},(_,i)=>q.f(x0+i*(x1-x0)/40));
 const lo=Math.min(...values),hi=Math.max(...values),scale=Math.max(hi-lo,2);
 return {x0,x1,y0:lo-.13*scale,y1:hi+.13*scale};
}
const equivalent=(a,b)=>Boolean(a&&b)&&a.coeff.every((v,i)=>v===b.coeff[i]);
function readX(s){
 if(typeof s!=="string"||!s.trim()||s.length>19||!/^[+−-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s.trim()))return null;
 const n=Number(s.replace("−","-").trim());return Number.isFinite(n)&&Math.abs(n)<=100?n:null;
}
global.CT51Math=Object.freeze({parse,derivative,windowFor,equivalent,readX,displayExpr,pretty,prettyX,clamp});
})(typeof module==='object'&&module.exports?module.exports:globalThis);
