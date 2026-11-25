/* Wave 5 functions: independent cross-checks. */
const check={
 "sinusoid-return-same-phase/reasoning/words":({t,T,h,rise},V)=>{
  const wave=x=>h+(rise?1:-1)*Math.sin(2*Math.PI*(x-t)/T);
  const dt=1e-4,diff=x=>wave(x+dt)-wave(x-dt);
  const hits=V.roots(x=>wave(x)-h,t+0.5,t+T+.5).filter(x=>Math.sign(diff(x))===Math.sign(diff(t)));
  V.require(hits.length===1&&Math.abs(hits[0]-t)<2*T,"exactly one subsequent same-direction crossing in the test span");
  return {a:Math.round(hits[0])};
 },
 "inverse-square-distance-control/reasoning/words":({at,k,up},V)=>{
  const seen=d=>1/(d*d),target=seen(at)*(up?k*k:1/(k*k));
  const root=V.bisect(d=>seen(d)-target,.5,1000);
  V.require(Math.abs(seen(root)-target)<1e-10&&(up?root<at:root>at),"required direction and physical brightness both hold");
  return {a:Math.round(root)};
 },
 "floor-from-exponential-differences/reasoning/table":({obs},V)=>{
  const [p,q,r]=obs,B=(p*r-q*q)/(p+r-2*q),step=(r-B)/(q-B);
  V.require(B<r&&step>0&&step<1&&Math.abs(B+(p-B)*step-q)<1e-9,"same positive reduction factor reproduces all observations");
  return {a:step,b:B,c:B+step*(r-B)};
 },
 "two-decays-with-reversing-order/reasoning/equation":({B,d,b,h,C},V)=>{
  const p=t=>B+2*C/Math.pow(b,t/h),q=t=>B+d+C/Math.pow(b,t/h),difference=t=>q(t)-p(t);
  const t=V.bisect(difference,0,30);
  V.require(t>0&&difference(0)<0&&difference(t+.25)>0,"readings reverse strict order at one positive crossing");
  return {a:Math.round(difference(200)),b:Math.round(t),c:{optionValue:difference(t+2)>0?0:1}};
 },

 "cubic-limited-run-window/reasoning/words":({a,b,c,horizon,H,K},V)=>{
  const score=t=>H+K*(t-a)*(t-b)*(t-c),runs=[];let current=0;
  for(let t=.125;t<horizon;t+=.25){
   if(score(t)>H)current+=.25;
   else if(current){runs.push(current);current=0;}
  }
  if(current)runs.push(current);
  V.require(runs.length===2&&runs[0]!==runs[1]&&runs.every(x=>x>0),"sampled scores form two distinct above-threshold runs");
  return {a:runs.reduce((x,y)=>x+y,0),b:Math.max(...runs)};
 },
 "in-range-unphysical-model/reasoning/words":({cap,y,t},V)=>{
  V.require((y<0||y>cap)&&cap>0&&t>0,"prediction lies outside stated physical limits despite the allowed input");
  return {a:{optionValue:y<0||y>cap?0:1}};
 },
 "bias-shift-held-out-check/reasoning/table":({obs,pred},V)=>{
  const K=[0,1].reduce((t,i)=>t+pred[i]-obs[i],0)/2;
  V.require(K!==0&&[0,1].every(i=>pred[i]-K===obs[i]),"one nonzero signed shift fits both calibration rows");
  const y=pred[2]-K,N=Math.max(y,obs[2])-Math.min(y,obs[2]),O=Math.max(pred[2],obs[2])-Math.min(pred[2],obs[2]);
  return {a:K,b:y,c:N-O};
 },
 "difference-from-two-segment-tables/reasoning/table":({xs,f,g},V)=>{
  const interpolate=(x,items)=>{const i=x<=xs[1]?0:1;return items[i]+(items[i+1]-items[i])*(x-xs[i])/(xs[i+1]-xs[i]);};
  const residue=x=>interpolate(x,f)-interpolate(x,g),roots=V.roots(residue,xs[0],xs[2],1200);
  V.require(roots.length===2&&roots[0]<xs[1]&&roots[1]>xs[1],"there is exactly one interior crossing on each linear segment");
  return {a:residue(xs[1]),b:V.approx(roots[0],1e-8),c:V.approx(roots[1],1e-8)};
 },
 "flat-maximum-threshold-window/reasoning/table":({a,b,c,z0,z3,M,V},T)=>{
  const pts=[[0,z0],[a,M],[b,M],[c,z3]],f=x=>{
   const i=x<a?0:x<b?1:2,[p0,y0]=pts[i],[p1,y1]=pts[i+1];return (p1-x)*y0/(p1-p0)+(x-p0)*y1/(p1-p0);
  };
  const k=T.roots(x=>f(x)-V,0,c,900),plateau=pts.filter(x=>x[1]===M);
  T.require(k.length===2&&k[0]<a&&k[1]>b&&plateau.length===2,"threshold crossings enclose but extend beyond the plateau");
  return {a:plateau.at(-1)[0]-plateau[0][0],b:T.approx(k[0],1e-8),c:T.approx(k[1]-k[0],1e-8)};
 },
 "composite-domain-reject-branch/reasoning/words":({h,m0,c,z,reading},V)=>{
  const f=x=>(m0*x+c-h)**2+z,algebra=V.roots(u=>(u-h)**2+z-reading,-100,100,1600);
  const physical=V.roots(x=>f(x)-reading,0,12,900);
  V.require(algebra.length===2&&algebra[0]<c&&physical.length===1,"both intermediate solutions exist but only one original input is valid");
  const least=Array.from({length:81},(_,i)=>f(i/8)).reduce((u,w)=>Math.min(u,w),Infinity);
  return {a:Math.round(algebra[0]),b:Math.round(physical[0]),c:least};
 },
 "log-axis-next-grid-label/reasoning/table":({at,B,over},V)=>{
  const a=Math.log10(at),b=Math.log10(B),distance=b-a;
  V.require(Math.abs(distance-1)<1e-9&&(a<b),"two known labels are in increasing order exactly one log unit apart");
  const raw=10**(over?b+distance:a-distance);
  return {a:V.approx(raw,1e-8)};
 },
 "decrease-to-multiplier/reasoning/words":({percent},V)=>{
  const keep=Array.from({length:100},(_,i)=>i).filter(i=>i>=percent).length;
  V.require(keep>0&&keep<100,"fixed percentage retains a nonzero proper fraction");
  return {a:keep/100};
 },
};
export default Object.fromEntries(Object.entries(check).map(([k,fn])=>["w5-fn-"+k,(q,T)=>fn(q.params,T)]));
