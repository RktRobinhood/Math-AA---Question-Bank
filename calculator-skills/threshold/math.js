(function(global){'use strict';
const clamp=(v,l,h)=>Math.max(l,Math.min(h,v));
const pretty=(n)=>n===0?'0':String(Number(n.toPrecision(6))).replaceAll('-','−');
function displayExpr(v){return v.replaceAll('*','·').replaceAll('-','−')}
const number=String.raw`(?:\d+(?:\.\d{1,6})?|\.\d{1,6})`;
const exponent=new RegExp(String.raw`^(${number})(?:\*\((${number})\)|\((${number})\)|\*(${number}))\^(?:x|\(x\))$`);
const bare=new RegExp(String.raw`^(${number})$`);
const normal=x=>String(x??'').toLowerCase().trim().replace(/\s/g,'').replace(/[×·]/g,'*').replaceAll('−','-');
function rational(t){
 const [whole,frac='']=t.split('.');return [BigInt((whole||'0')+frac),10n**BigInt(frac.length)];
}
function parse(raw,kind='model'){
 if(typeof raw!=='string'||raw.length>80||/[0-9.]\s+[0-9.]/.test(raw))throw Error("Check the number format.");
 const str=normal(raw);
 if(kind==='target'){
  const hit=str.match(bare);if(!hit)throw Error("Enter a positive number for the horizontal target line.");
  const T=Number(hit[1]);if(!(T>=.000001&&T<=1000000))throw Error("Use a target from 0.000001 to 1000000.");
  return Object.freeze({raw:str,T,r:rational(str),f:()=>T});
 }
 const hit=str.match(exponent);if(!hit)throw Error("Use exponential form A*B^x, for example 5*1.5^x.");
 const A=Number(hit[1]),text=hit[2]||hit[3]||hit[4],B=Number(text);
 if(!(A>=.000001&&A<=1000000&&B>=.1&&B<=4&&B!==1))throw Error("Use a positive starting value up to 1000000 and a base from 0.1 to 4, other than 1.");
 const log=Math.log1p(B-1);
 return Object.freeze({raw:str,A,B,log,ar:rational(hit[1]),br:rational(text),f:x=>A*Math.exp(log*x)});
}
function parseEnd(raw){
 if(!/^\d{1,2}$/.test(String(raw)))throw Error("Use a whole-number end time from 2 to 30.");
 const end=Number(raw);if(end<2||end>30)throw Error("Use a whole-number end time from 2 to 30.");return end;
}
function compareAt(p,g,x){
 const [a,b]=p.ar,[c,d]=p.br,[e,f]=g.r,n=BigInt(x);
 const diff=a*(c**n)*f-e*b*(d**n);
 return diff<0n?-1:diff>0n?1:0;
}
function modelInfo(q,end){
 if(!q||q.length!==2||q.some(p=>!p))return {ok:false,message:"Plot the model and horizontal threshold line first."};
 const [p,g]=q,increasing=p.B>1,passes=s=>increasing?s>=0:s<=0;
 if(!Number.isInteger(end)||end<2||end>30)return {ok:false,message:"The model time range must end on a whole day from 2 to 30."};
 const atStart=compareAt(p,g,0), atEnd=compareAt(p,g,end);
 if(passes(atStart))return {ok:false,message:"The threshold is already met at day 0. Choose a target reached later."};
 if(!passes(atEnd)||atEnd===0)return {ok:false,message:"Choose a target reached strictly inside the stated interval, so there is room to bracket it."};
 const dist=(g.T-p.A)/p.A;
 let x=(Math.abs(dist)<.2?Math.log1p(dist):Math.log(g.T/p.A))/p.log;
 let day=1;while(day<=end&&!passes(compareAt(p,g,day)))day++;
 if(compareAt(p,g,day)===0)x=day;
 if(!Number.isFinite(x)||!(x>0&&x<end))return {ok:false,message:"The threshold is too close to the end of the supported graph interval."};
 return {ok:true,x,y:g.T,day,increasing,before:p.f(day-1),at:p.f(day),exactWhole:compareAt(p,g,day)===0};
}
function windowFor(q,end=8){
 const [p,g]=q||[], info=modelInfo(q,end), x=info.ok?info.x:Math.min(4,end/2),
  x0=-Math.min(1,end/10), x1=Math.min(end+.4,Math.max(3.2,Math.ceil(x)+1.15)),
  yMax=Math.max(.000001,p?p.f(p.B>1?x1:x0):0,g?g.T:0);
 return {x0,x1,y0:-.07*yMax,y1:1.12*yMax};
}
function solve(q,l,h,end){
 const info=modelInfo(q,end);if(!info.ok)return info;
 if(!Number.isFinite(l)||!Number.isFinite(h)||l>=h)return {ok:false,message:"Set the upper bound to the right of the lower bound."};
 if(l<0||h>end)return {ok:false,message:"Choose both bounds within the stated time domain, 0 to "+end+" days."};
 const near=(v,w)=>Math.abs(v-w)<=Number.EPSILON*8*Math.max(1,Math.abs(v),Math.abs(w));
 if(near(info.x,l)||near(info.x,h))return {ok:false,message:"A bound is on the crossing. Put one bound strictly on each side."};
 if(!(l<info.x&&info.x<h))return {ok:false,message:"These bounds do not straddle the threshold crossing."};
 return info;
}
global.CT16Math=Object.freeze({parse,parseEnd,compareAt,modelInfo,windowFor,solve,pretty,displayExpr,clamp});
})(typeof module==='object'&&module.exports?module.exports:globalThis);
