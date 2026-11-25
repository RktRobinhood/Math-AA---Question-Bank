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
const equivalent=(a,b)=>Boolean(a&&b)&&a.coeff.every((v,i)=>v===b.coeff[i]);
function readX(s){
 if(typeof s!=="string"||!s.trim()||s.length>19||!/^[+−-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s.trim()))return null;
 const n=Number(s.replace("−","-").trim());return Number.isFinite(n)&&Math.abs(n)<=100?n:null;
}
const real=raw=>{
 if(typeof raw!=="string"||raw.length>17)return null;
 const text=raw.trim().replace(/−/g,"-");
 if(!/^[+-]?(?:\d+(?:\.\d{0,6})?|\.\d{1,6})$/.test(text))return null;
 const x=Number(text);return Number.isFinite(x)&&Math.abs(x)<=20?x:null;
};
const dec="[+\\-]?(?:\\d+(?:\\.\\d{0,6})?|\\.\\d{1,6})";
const op="(?:<=|>=|<|>)";
const chain=new RegExp("^("+dec+")("+op+")x("+op+")("+dec+")$");
const leftX=new RegExp("^x("+op+")("+dec+")$");
const rightX=new RegExp("^("+dec+")("+op+")x$");
function cond(raw){
 if(typeof raw!=="string"||raw.length>46||/[0-9.]\s+[0-9.]/.test(raw))throw Error("Use inequalities in x with decimal bounds in [−20,20].");
 const text=raw.toLowerCase().replace(/−/g,"-").replace(/≤/g,"<=").replace(/≥/g,">=").replace(/\s/g,"");
 let lo=-Infinity,hi=Infinity,lc=false,hc=false, m;
 const put=(rel,value)=>{
  const val=real(value);
  if(val===null)throw Error("Use bounds between −20 and 20, with up to six decimal places.");
  if(rel[0]===">"){
    if(lo!==-Infinity)throw Error("Use one lower and one upper bound.");
    lo=val;lc=rel.length===2;
  }else{
    if(hi!==Infinity)throw Error("Use one lower and one upper bound.");
    hi=val;hc=rel.length===2;
  }
 };
 const reverse=r=>(r[0]==="<"?">":"<")+r.slice(1);
 if((m=text.match(chain))){put(reverse(m[2]),m[1]);put(m[3],m[4]);}
 else if((m=text.match(leftX)))put(m[1],m[2]);
 else if((m=text.match(rightX)))put(reverse(m[2]),m[1]);
 else throw Error("Write a condition such as −2 ≤ x < 1 or x ≥ 1.");
 if(!(lo<hi))throw Error("A lower bound must be smaller than its upper bound.");
 return Object.freeze({raw:text,lo,hi,lc,hc});
}
const displayCond=raw=>String(raw).replace(/<=/g,"≤").replace(/>=/g,"≥").replace(/-/g,"−");
const inPart=(p,x)=>(x>p.lo||p.lc&&x===p.lo)&&(x<p.hi||p.hc&&x===p.hi);
function make(slots){
 const [a,c,b,d]=slots;
 const pair=[{expr:parse(a),...cond(c)},{expr:parse(b),...cond(d)}].map(Object.freeze);
 const [low,high]=pair.slice().sort((a,b)=>a.lo-b.lo||a.hi-b.hi);
 if(low.hi>high.lo||low.hi===high.lo&&low.hc&&high.lc)
   throw Error("The conditions overlap. Only one branch may own a shared endpoint.");
 return Object.freeze(pair);
}
function value(model,x){
 if(!Number.isFinite(x))return null;
 const i=model.findIndex(p=>inPart(p,x));
 if(i<0)return null;
 const n=model[i].expr.f(x);return Number.isFinite(n)?{x,y:n,branch:i+1}:null;
}
function windowFor(model){
 const base={x0:-4,x1:4,y0:-4,y1:6};
 if(!model?.length)return base;
 const ends=model.flatMap(p=>[p.lo,p.hi]).filter(Number.isFinite);
 const left=Math.min(-3,...ends),right=Math.max(3,...ends),span=right-left;
 const x0=left-span*.17,x1=right+span*.17,ys=[0];
 for(const p of model){
  const a=Math.max(p.lo,x0),b=Math.min(p.hi,x1);
  if(a>b)continue;for(let i=0;i<=60;i++)ys.push(p.expr.f(a+(b-a)*i/60));
 }
 const lo=Math.min(...ys),hi=Math.max(...ys),scale=Math.max(hi-lo,2);
 return {x0,x1,y0:lo-.12*scale,y1:hi+.13*scale};
}
function sameModel(a,b){
 if(!a||!b)return false;
 return a.every((r,i)=>r.lo===b[i].lo&&r.hi===b[i].hi&&r.lc===b[i].lc&&r.hc===b[i].hc&&equivalent(r.expr,b[i].expr));
}
function typed(params){
 const keys=["f","c1","g","c2"];
 if(![...keys,"x"].some(k=>params.has(k)))return null;
 if(keys.some(k=>params.getAll(k).length!==1)||params.getAll("x").length>1)throw Error("Provide two functions and two conditions.");
 const slots=keys.map(k=>params.get(k)),model=make(slots);
 const x=params.has("x")?real(params.get("x")):null;
 if(params.has("x")&&x===null)throw Error("Use a valid decimal check x.");
 return {slots,model,x};
}
global.CT15Math=Object.freeze({parse,cond,make,value,windowFor,sameModel,real,typed,displayExpr,displayCond,pretty,prettyX,clamp});
})(typeof module==='object'&&module.exports?module.exports:globalThis);
