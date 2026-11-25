/* Independent checks for the calculus tranche. */
const cases={
 "stationary-curvature-from-coeff/curvature/equation":({t,k,n,j},T)=>{
  const f=x=>n*(x-t)**3+k*(x-t)**2+j;
  const g=(f(t+1)-f(t-1))/2,H=f(t+1)+f(t-1)-2*f(t);
  T.require(g===n&&Math.abs(H)>0,"local cubic cancels in second differences");
  return {a:H};
 },
 "reverse-chain-frequency/signed-coefficient/equation":({k,n},T)=>{
  const x=Math.PI/(2*k), step=1e-5, g=(Math.cos(k*(x+step))-Math.cos(k*(x-step)))/(2*step);
  const c=Math.round(n/g);T.require(Math.abs(c*g-n)<1e-6,"derivative amplitude matches the displayed sine");
  return {a:c};
 },
 "net-inflow-two-decays/change/words":({u,v,p,q,end,base},T)=>{
  T.require(u>v&&p<q,"positive net inflow over all queried times");
  const f=t=>u/Math.exp(p*t/10)-v/Math.exp(q*t/10);
  return {b:T.approx(base+T.integrate(f,0,end,1500),1e-7)};
 },
 "washer-slice-axis-reading/slice-area/words":({u,v},T)=>{
  const shell=r=>2*Math.PI*r;
  T.require(u>0&&v>u,"inner/outer radii ordered");
  return {a:Math.min(u,v),b:T.approx(T.integrate(shell,u,v,160)/Math.PI,1e-9)};
 },
 "area-vertically-translated-density/level-shift/equation":({n,c,d,total},T)=>{
  const A=T.integrate(x=>c*x*x,d,d+n,160);
  T.require(total>A,"positive shift required");
  return {a:Math.round(A),b:Math.round((total-A)/n)};
 },
 "trapezoid-unknown-sample-time/sample-time/table":({L,a0,c0,b0,total},T)=>{
  const fits=[];
  for(let t=1;t<L;t++){
   const f=x=>x<t?a0+(b0-a0)*x/t:b0+(c0-b0)*(x-t)/(L-t);
   if(Math.abs(T.integrate(f,0,t,30)+T.integrate(f,t,L,30)-total)<1e-8)fits.push(t);
  }
  T.require(fits.length===1,"one feasible interior time");
  const t=fits[0]+1;
  const g=x=>x<t?a0+(b0-a0)*x/t:b0+(c0-b0)*(x-t)/(L-t);
  return {a:fits[0],b:Math.round(total-T.integrate(g,0,t,30)-T.integrate(g,t,L,30))};
 },
 "coupled-euler-substep/refinement/equation":({x,y,c,d,den},T)=>{
  const run=k=>{let v=[x,y];for(let j=0;j<k;j++)v=[v[0]+c*v[1]/(k*den),v[1]+d*v[0]/(k*den)];return v[0];};
  const a=run(1),b=run(2);
  T.require(b>a,"positive coupling makes the second half-step use a steeper x slope");
  return {a,b,c:b-a};
 },
 "reciprocal-sum-area-threshold/upper-bound/equation":({a0,b0,u,v,K},T)=>{
  const A=t=>T.integrate(x=>u/(x+a0)+v/(x+b0),0,t,140);
  T.require(A(12)>K,"strictly increasing accumulated integral brackets K");
  const t=T.bisect(x=>A(x)-K,0,12);
  return {b:T.approx(t,3e-7)};
 },
 "isolated-zero-in-increasing-interval/monotonic-set/equation":({u,v,j},T)=>{
  const sign=x=>Math.sign(j*(x-u)*(x-v)**2);
  T.require(sign(u-.5)===-1&&sign((u+v)/2)===1&&sign(v+.5)===1,"only the first root reverses gradient");
  return {a:Math.min(u,v)};
 },
 "revolution-truncated-apex-scale/volume-ratio/words":({a0,k,d},T)=>{
  const volume=x=>T.integrate(y=>Math.PI*(a0*y)**2,0,x,140);
  T.require(k>0&&k<d,"strictly partial volume");
  return {a:T.approx(volume(k)/Math.PI,1e-8),b:T.approx(volume(k)/volume(d),1e-10)};
 },
 "integrating-power-prerequisite/exponent/equation":({p},T)=>{
  const x=Array.from({length:16},(_,i)=>i+1).filter(k=>k-1===p);
  T.require(x.length===1,"exactly one positive whole exponent");
  return {a:x[0]};
 },
 "revolve-positive-intersection-synoptic/meeting-and-volume/equation":({c,d},T)=>{
  const u=x=>c*x,v=x=>d*x*x, k=T.bisect(x=>u(x)-v(x),.1,8);
  T.require(u(k/2)>v(k/2)&&u(k+.2)<v(k+.2),"correct enclosed interval");
  return {a:Math.round(k),b:T.approx(T.integrate(x=>u(x)-v(x),0,k,180),1e-9),c:T.approx(T.integrate(x=>u(x)**2-v(x)**2,0,k,1800),2e-7)};
 }
};
export default Object.fromEntries(Object.entries(cases).map(([key,fn])=>['w2-t5-'+key,(q,T)=>fn(q.params,T)]));
