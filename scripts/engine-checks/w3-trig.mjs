const D=Math.PI/180, v={};
const set=(id,rep,f)=>v["w3-trig-"+id+"/result/"+rep]=(q,T)=>f(q.params,T);
set("ssa-perimeter-cap","words",({k,t,cap},T)=>{
 const cx=k*Math.sqrt(t===45?2:3);
 const foot=cx*Math.cos(30*D), d=Math.sqrt(k*k-(cx*Math.sin(30*D))**2);
 const candidates=[foot+d,foot-d].map(s=>{
  const x=s*Math.cos(30*D),y=s*Math.sin(30*D);
  const B=Math.acos((-x*(cx-x)+y*y)/(s*k))/D;
  return {B,perimeter:k+cx+s};
 }).sort((a,b)=>a.B-b.B);
 T.require(candidates[0].B>0&&candidates[1].B<150,"two nondegenerate SSA cases");
 T.require(candidates[0].perimeter>candidates[1].perimeter,"the obtuse angle belongs to the shorter option");
 const bits=candidates.map(c=>c.perimeter<=cap),ans=bits[0]?bits[1]?2:0:bits[1]?1:3;
 return {a:Math.round(candidates[1].B),b:T.option(ans)};
});
set("intercept-a-bearing","words",({u,a,b},T)=>{
 const pq=u*Math.sin((b-a)*D)/Math.sin((90-b)*D),oq=u*Math.sin((90-a)*D)/Math.sin((90-b)*D);
 T.require(pq>0&&oq>pq,"intercept lies east with positive distances");
 return {a:T.approx(pq,1e-10),b:T.approx(oq,1e-10)};
});
set("same-travel-different-sweep","words",({k,p,q,v},T)=>{
 const arc=k*v;
 const sectors=[p,q].map(z=>{const r=k*z; const proportion=arc/(2*Math.PI*r);return {angle:2*Math.PI*proportion,area:proportion*Math.PI*r*r};});
 T.require(sectors.every(s=>s.angle>0&&s.angle<2*Math.PI),"each swept area is one sector");
 return {a:T.approx(sectors[1].angle,1e-10),b:T.approx(sectors[0].area/sectors[1].area,1e-10),c:T.approx(sectors[1].area-sectors[0].area,1e-10)};
});
set("rising-baseline-crossing","equation",({h,a,p,d,b},T)=>{
 const hh=x=>h+a*Math.cos(2*Math.PI*x/p);
 let x=p/8;
 for(let i=0;i<16;i++)x-=(hh(x)-h-d-b*x)/(-a*2*Math.PI/p*Math.sin(2*Math.PI*x/p)-b);
 T.require(x>0&&x<p/4&&Math.abs(hh(x)-h-d-b*x)<1e-10,"intersection exists in the requested interval");
 return {a:T.option(1),b:T.approx(x,1e-8),c:T.approx(hh(x),1e-8)};
});
export default v;
