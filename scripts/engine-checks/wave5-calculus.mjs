// Install as scripts/engine-checks/wave5-calculus.mjs for native verification.
// The recomputation uses numerical areas, sampled extrema and gradients,
// explicit enumerations, and displayed constraints rather than generator formulas.
const verifiers={
 "area-share-by-strip/proportion-from-unintegrated-strip/equation":({a,b,l,u,H},T)=>{
  const f=x=>b/(a+x),strip=T.integrate(f,l,u),left=T.integrate(f,0,l),right=T.integrate(f,u,H);
  T.require(0<l&&l<u&&u<H&&[left,strip,right].every(x=>x>0),"non-empty positive pieces");
  T.require(Math.abs(left+strip+right-T.integrate(f,0,H))<1e-7,"strip plus two outside pieces completes region");
  return {a:T.approx(strip,1e-7),b:T.approx(100*strip/(left+strip+right),1e-7)};
 },
 "two-nozzle-meter/reconstruct-independent-accumulation/table":({a,k,L,pre,post},T)=>{
  const r=t=>a+k*t, vol=T.integrate(r,0,L),total=post-pre, share=total/L;
  T.require(post>pre&&T.range(0,L,.25).every(t=>r(t)>0&&r(t)<share),"combined reading can be realised with both rates positive");
  return {a:T.approx(vol,1e-8),b:T.approx(T.integrate(t=>share-r(t),0,L),1e-8)};
 },
 "quadratic-area-budget/recover-partition-then-height/equation":({a,L,n,d},T)=>{
  const f=x=>a*x*x, area=x=>T.integrate(f,0,x,120),whole=area(L);
  const c=T.bisect(x=>d*area(x)-n*whole,0,L,60);
  T.require(0<c&&c<L&&0<n&&n<d,"cut strictly inside with positive regions on both sides");
  T.require(Math.abs(area(c)/whole-n/d)<1e-9,"computed cut supplies requested fraction");
  return {a:T.approx(whole,1e-8),b:T.approx(c,1e-8),c:T.approx(f(c),1e-8)};
 },
 "folded-shift-panel/compose-mirrored-area-with-offset/equation":({a,b,c,L,j},T)=>{
  const h=x=>a*x*x+b, pos=x=>L-(x-L)/j, h2=x=>h(pos(x))+c, end=L*(j+1);
  const A=T.integrate(h,0,L,180), B=T.integrate(h2,L,end,180);
  T.require(pos(L)===L&&pos(end)===0,"panel uses the first height at reverse endpoints");
  T.require(T.range(L,end,.2).every(x=>h2(x)>0)&&c>0&&j>1,"positive second panel and separate nontrivial offset and scale");
  return {a:T.approx(A,1e-8),b:T.approx(A+B,1e-8)};
 },
 "admissible-cost-table/choose-feasible-tabulated-minimizer/table":({xs,vals},T)=>{
  const all=xs.map((x,i)=>({x,y:vals[i]}));
  const allowed=all.filter(({x})=>x>=xs[1]&&x<=xs[3]).sort((a,b)=>a.y-b.y);
  T.require(allowed.length===3&&allowed[0].y<allowed[1].y,"three permitted, unique cheapest");
  T.require(all.some(x=>x.y<allowed[0].y),"skipping feasibility changes the answer");
  return {a:allowed[0].x};
 },
 "rising-cap-boundary/minimize-monotone-model-on-subinterval/words":({l,u,v,fall},T)=>{
  const f=x=>2+(fall?-1:1)*Math.log(x+1);
  const pts=T.range(v,u+3,.25),allowed=pts.filter(x=>x>=l&&x<=u),best=allowed.reduce((a,b)=>f(a)<f(b)?a:b);
  T.require(l>v&&u>l&&allowed.includes(l)&&allowed.includes(u),"constraints include both closed ends but not outer calibration ends");
  return {a:best};
 },
 "average-cost-reciprocal/differentiate-average-not-total-cost/words":({a,b,c,lo,hi},T)=>{
  const cost=x=>b*x*x+c*x+a, avg=x=>cost(x)/x, optimum=T.extremum(avg,lo,hi,"min",201);
  const choice=T.range(lo,hi).reduce((x,y)=>avg(x)<avg(y)?x:y);
  T.require(optimum.x>lo&&optimum.x<hi&&Math.abs(optimum.x-choice)<1e-5,"whole-number global optimum strictly interior");
  T.require([lo,hi].every(x=>avg(x)>avg(choice))&&cost(lo)<cost(choice),"minimising total differs from minimising mean");
  return {b:choice,d:avg(choice)};
 },
 "disjoint-operating-bands/compare-stationary-with-feasible-band-ends/equation":({a,m,M,l,b,c,d},T)=>{
  const f=x=>M-a*(x-m)**2,free=T.range(l,d).sort((x,y)=>f(y)-f(x));
  const allowed=free.filter(x=>x<=b||x>=c),better=allowed[0];
  const opt1=T.extremum(f,l,b,"max"), opt2=T.extremum(f,c,d,"max");
  T.require(b<m&&m<c&&free[0]===m&&f(allowed[0])>f(allowed[1]),"unrestricted optimum forbidden and permitted optimum unique");
  T.require(Math.abs(opt1.value-opt2.value)>1&&[opt1,opt2].some(p=>Math.abs(p.x-better)<1e-5)&&f(l)>0&&f(d)>0,"interior search on each band confirms endpoint comparison; output stays positive");
  return {a:free[0],c:better,d:f(better)};
 },
 "reverse-chain-calibrated-dose/fit-a-nonlinear-boundary-then-invert/words":({k,b,t0,t1,reading,gain},T)=>{
  const r=t=>b*3*k*t*t*Math.exp(k*t*t*t),
    fitted=t=>reading+T.integrate(r,t0,t,1400),target=reading+gain;
  T.require(fitted(t0)<target&&fitted(4)>target,"target bracket and unique increasing branch");
  const time=T.bisect(t=>fitted(t)-target,t0,4,70);
  T.require(T.close(T.deriv(fitted,time,1e-3),r(time),1e-6),"calibrated integral differentiates to displayed rate");
  return {b:T.approx(fitted(t1),1e-6),c:T.approx(time,1e-6)};
 },
 "calibrated-relative-decline/recover-decay-from-relative-gradient/words":({a,b,s,H,d},T)=>{
  const signal=(x,k)=>b*(x+a)*Math.exp(-k*x);
  const diff=k=>T.deriv(x=>signal(x,k),s,1e-3)/signal(s,k)+d;
  const k=T.bisect(diff,0,1,65);
  T.require(diff(0)>0&&diff(1)<0&&Math.abs(diff(k))<1e-9,"observed relative gradient has a unique calibrated root");
  const before=signal(s,k),after=signal(H,k);
  T.require(before>after&&after>0,"percentage decline is meaningful");
  return {b:T.approx(k,1e-7),c:T.approx(100*(before-after)/before,1e-7)};
 }
};
export default Object.fromEntries(Object.entries(verifiers).map(([id,fn])=>["w5-calculus-"+id,(q,T)=>fn(q.params,T)]));
