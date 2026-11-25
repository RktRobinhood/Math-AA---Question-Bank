/* Recompute from the given readings, independent of how parameters were made. */
const verifier={
 "negative-distance-intercept/words":({a,b},V)=>{
  const points=[[a,0],[0,b]].sort((p,q)=>p[0]-q[0]), dx=points[1][0]-points[0][0];
  V.require(dx>0&&a!==0&&b!==0,"two distinct non-origin intercepts");
  return {a:(points[1][1]-points[0][1])/dx};
 },
 "rate-gap-reconstruct-plans/table":({s,a0,x0,x1,g0,g1},V)=>{
  const B0=a0+s*x0+g0,B1=a0+s*x1+g1; const rate=(B1-B0)/(x1-x0),start=(x1*B0-x0*B1)/(x1-x0);
  const equal=Array.from({length:2*x1+1},(_,i)=>i).filter(i=>i*rate+start===i*s+a0);
  V.require(start>0&&rate>0&&equal.length===1&&g0*g1<0,"positive tariffs and one integer price agreement between the known inputs");
  return {a:rate,b:start,c:equal[0]};
 },
 "blocked-input-range-gaps/table":({xs,f,miss},V)=>{
  const counts=new Map();xs.forEach((x,i)=>counts.set(f[i],(counts.get(f[i])||0)+1));
  for(const i of miss)counts.set(f[i],counts.get(f[i])-1);
  const retained=[...counts].filter(([,n])=>n>0).map(([y])=>y).sort((a,b)=>a-b);
  V.require(xs.length===6&&new Set(miss).size===2&&[2,3,4].includes(retained.length),"exactly two valid disabled inputs and no duplicate output counts");
  return {a:retained.length,b:retained[0]};
 },
 "key-features-different-baseline/table":({x,y},V)=>{
  const f=t=>{
   const j=x.findIndex((p,i)=>i>0&&p>=t);
   const u=(t-x[j-1])/(x[j]-x[j-1]);
   return (1-u)*y[j-1]+u*y[j];
  };
  const hits=V.roots(f,x[0],x[4],300),offset=y[3], samples=[...x];
  for(let t=x[0];t<x[4];t+=.125)samples.push(t);
  V.require(hits.length===2&&Math.abs(f(x[1])-offset)<1e-10&&Math.abs(f(x[3])-offset)<1e-10,"exactly two original zeros and common shifted shoulders");
  return {a:V.approx(hits[0],1e-8),b:offset,c:Math.max(...samples.map(t=>f(t)-offset))};
 },
 "two-branches-clearance/words":({a,s,y,cap,low},V)=>{
  const f=x=>s*(x-a)**2+y-low, hits=V.roots(f,0,cap,600);
  V.require(hits.length===2&&f(0)>0&&f(cap)>0&&f((hits[0]+hits[1])/2)<0,"two strict interior crossings with a non-empty central excluded section");
  const breakpoints=[0,...hits,cap];let length=0;
  for(let j=1;j<breakpoints.length;j++)if(f((breakpoints[j]+breakpoints[j-1])/2)>=0)length+=breakpoints[j]-breakpoints[j-1];
  return {a:Math.round(hits[0]),b:Math.round(length)};
 },
 "reciprocal-centre-meeting/equation":({c,a,u,v,b},V)=>{
  const f=x=>b+u/(x-c),g=x=>b-v/(x-a);
  const root=V.bisect(x=>f(x)-g(x),c+1e-4,a-1e-4),h=(f(1e8)+f(-1e8)+g(1e8)+g(-1e8))/4;
  V.require(c<root&&root<a&&f(root)>b&&Math.abs(f(root)-g(root))<1e-7,"one intersection within the shared middle domain, above the limiting height");
  return {a:Math.round(h),b:V.approx(root,1e-8)};
 },
 "reflection-translation-order/words":({x,y,h,v,acrossY},V)=>{
  // Homogeneous-coordinate composition.
  const mul=(A,B)=>A.map(row=>B[0].map((_,i)=>row.reduce((s,x,j)=>s+x*B[j][i],0)));
  const S=[[acrossY?-1:1,0,0],[0,acrossY?1:-1,0],[0,0,1]],T=[[1,0,h],[0,1,v],[0,0,1]],p=[[x],[y],[1]];
  const f=mul(mul(T,S),p).flat(),g=mul(mul(S,T),p).flat(),i=acrossY?0:1;
  V.require(f[i]!==g[i]&&f[1-i]===g[1-i],"composition changes exactly one coordinate when reversed");
  return {a:f[i],b:g[i],c:Math.hypot(f[0]-g[0],f[1]-g[1])};
 },
 "mean-error-can-hide-offsets/table":({x,z,one,two},V)=>{
  const residual=[one-x,two-z], signed=residual.reduce((a,b)=>a+b,0)/2, rms=Math.sqrt(residual.reduce((a,b)=>a+b*b,0)/2);
  V.require(signed===0&&rms>0&&residual[0]*residual[1]<0,"nonzero equal and opposite residuals");
  return {a:{optionValue:1}};
 },
 "logistic-gap-to-capacity/words":({K,gap,k},V)=>{
  const capacity=Math.round(K/(1+Math.exp(-1000/k)));
  const candidates=Array.from({length:K},(_,i)=>i+1).filter(a=>Math.abs(K-K/(1+a)-gap)<1e-9);
  V.require(candidates.length===1&&capacity===K&&gap>0&&gap<K,"positive integer coefficient is consistent with initial gap and carrying capacity");
  return {a:K/(1+candidates[0]),b:candidates[0]};
 },
 "log-difference-slope-two-axis/table":({x0,y0,x1,nom,den,power},V)=>{
  const gradient=(Math.log10(nom/den)-Math.log10(y0))/(Math.log10(x1)-Math.log10(x0));
  V.require(Math.abs(gradient-Math.round(gradient))<1e-10&&Math.abs(gradient)>0.9&&x0>0&&x1>x0,"both points have positive original units and a nonzero integer log–log gradient");
  const predict=x=>10**(Math.log10(y0)+gradient*(Math.log10(x)-Math.log10(x0)));
  return {a:{optionValue:0},b:Math.round(gradient),c:V.approx(predict(x0*power)/predict(x0),1e-8)};
 }
};
export default Object.fromEntries(Object.entries(verifier).map(([k,v])=>{
 const [n,rep]=k.split("/");
 return ["w6-fn-"+n+"/reasoning/"+rep,(q,T)=>v(q.params,T)];
}));
