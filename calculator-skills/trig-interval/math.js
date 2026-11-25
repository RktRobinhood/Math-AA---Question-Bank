"use strict";
(function(root){
 const TAU=2*Math.PI, period=unit=>unit==="deg"?360:TAU;
 const rad=(x,u)=>u==="deg"?x*Math.PI/180:x;
 const toUnit=(x,u)=>u==="deg"?x*180/Math.PI:x;
 const comp=(a,b)=>Math.abs(a-b)<=Number.EPSILON*12*Math.max(1,Math.abs(a),Math.abs(b));
 const val=(fn,x,unit)=>Math[fn](rad(x,unit));
 function num(raw,unit){
  const t=String(raw??"").trim().toLowerCase().replaceAll("−","-").replaceAll("π","pi").replaceAll(" ","");
  if(t.length>25||/[0-9.]\s+[0-9.]/.test(String(raw)))return NaN;
  if(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d{1,2})?$/.test(t))return Number(t);
  if(unit==="deg"&&t.endsWith("°"))return num(t.slice(0,-1),"bare");
  if(unit==="rad"){
   const m=t.match(/^([+-])?(\d{1,3})?\*?pi(?:\/([1-9]\d{0,2}))?$/);
   if(m)return (m[1]==="-"?-1:1)*Number(m[2]||1)*Math.PI/Number(m[3]||1);
  }
  return NaN;
 }
 const fmt=x=>String(Number((Object.is(x,-0)?0:x).toPrecision(7))).replaceAll("-","−");
 const fmtAngle=(x,u)=>u==="deg"?fmt(x)+"°":fmt(x);
 function exact(x,u){
  if(u==="rad"){
   for(const d of [1,2,3,4,6,12]){
    const p=Math.round(x*d/Math.PI);if(comp(x,p*Math.PI/d))return !p?"0":(p<0?"−":"")+(Math.abs(p)>1?Math.abs(p):"")+"π"+(d>1?"/"+d:"");
   }
  }
  return fmtAngle(x,u);
 }
 function make(fn,level,unit,left,right,lc,rc){
  if(!["sin","cos"].includes(fn)||!["deg","rad"].includes(unit))throw Error("Use sine or cosine and degrees or radians.");
  const c=num(level,"bare"),l=num(left,unit),r=num(right,unit),p=period(unit);
  if(!Number.isFinite(c)||c< -1||c>1)throw Error("Target must lie from −1 to 1.");
  if(!Number.isFinite(l)||!Number.isFinite(r)||l>=r||Math.max(Math.abs(l),Math.abs(r))>p*6||r-l>p*3||r-l<p/1000)throw Error("Use an increasing interval no longer than three cycles.");
  return{fn,c,unit,l,r,lc:Boolean(lc),rc:Boolean(rc)};
 }
 function allAround(fn,c,u,l,r){
  const p=period(u),a=fn==="sin"?Math.asin(c):Math.acos(c);
  const bases=c===1||c===-1?[a]:fn==="sin"?[a,Math.PI-a]:[a,-a];
  const values=[];
  for(const base of bases){
   const t=toUnit(base,u),n1=Math.floor((l-t)/p)-1,n2=Math.ceil((r-t)/p)+1;
   for(let n=n1;n<=n2;n++){const v=t+n*p;if((v>l||comp(v,l))&&(v<r||comp(v,r)))values.push(comp(v,l)?l:comp(v,r)?r:v);}
  }
  return values.sort((a,b)=>a-b);
 }
 function roots(o){
  return allAround(o.fn,o.c,o.unit,o.l,o.r).filter(x=>(o.lc||!comp(x,o.l))&&(o.rc||!comp(x,o.r)));
 }
 function tool(o,mode,which,l,r){
  const p=period(mode),span=mode===o.unit?(o.r-o.l):p;
  if(!Number.isFinite(l)||!Number.isFinite(r)||l>=r||r-l>Math.max(p*3,span*2)||Math.max(Math.abs(l),Math.abs(r))>p*8)return{error:"Choose increasing, finite search bounds in the displayed window."};
  if(which==="intersection"&&(o.c===1||o.c===-1))return{error:"The graphs touch at a turn. Use Maximum or Minimum, then check its height."};
  const level=which==="max"?1:which==="min"?-1:o.c,v=allAround(o.fn,level,mode,l,r).filter(x=>!comp(x,l)&&!comp(x,r));
  if(v.length!==1)return {error:v.length?"More than one point lies inside. Use a narrower bracket.":"No point lies strictly between those bounds."};
  return {x:v[0],y:level,solution:level===o.c&&mode===o.unit};
 }
 function assess(raw,o){
  const s=String(raw??"").trim(),target=roots(o);
  if(/^none$|^no solutions?$/i.test(s))return !target.length;
  if(s.length>160)return false;
  const given=s.split(/[,;\n]/).map(v=>num(v,o.unit));
  if(given.length!==target.length||given.some(x=>!Number.isFinite(x)))return false;
  return given.sort((a,b)=>a-b).every((x,i)=>{
   const g=target[i];return g===0?x===0:[g,...Array.from({length:11},(_,j)=>Number(g.toPrecision(j+3)))].some(n=>Math.abs(x-n)<=1e-11*Math.abs(n));
  });
 }
 function windowFor(o){
  const pad=(o.r-o.l)*.069;
  return{x0:o.l-pad,x1:o.r+pad,y0:-1.3,y1:1.35};
 }
 root.CT14Math=Object.freeze({num,make,roots,tool,assess,val,fmt,fmtAngle,exact,windowFor,period,comp});
})(typeof module==="object"&&module.exports?module.exports:globalThis);
