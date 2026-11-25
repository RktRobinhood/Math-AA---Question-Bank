/* Independent recalculation for Wave 3 calculus. */
const cases={
 "minimum-acceleration-from-jerk/acceleration-time-and-value/words":({a,b,c},T)=>{
  const monomials=[[a,7],[b,6],[-c,3]];
  const acc=t=>monomials.reduce((out,[coef,pow])=>out+coef*pow*(pow-1)*t**(pow-2),0);
  let lo=0,hi=2;
  for(let j=0;j<38;j++){const l=(2*lo+hi)/3,r=(lo+2*hi)/3;if(acc(l)<acc(r))hi=r;else lo=l;}
  const t=(lo+hi)/2;
  T.require(t>.2&&t<1.5&&acc(t)<acc(0)&&acc(t)<acc(2),"numerical acceleration is least in the interior");
  return {b:T.approx(t,1e-6),c:T.approx(acc(t),1e-7)};
 },

 "limit-referenced-calibration/positive-threshold/words":({k,P},T)=>{
  const mean=t=>T.integrate(u=>Math.exp(k*u*t),0,1,160),target=1+P/100;
  const t=T.bisect(x=>mean(x)-target,0,1);
  T.require(Math.abs(mean(0)-1)<1e-9&&mean(1)>target&&t>0&&t<1,"exponential average begins at one and crosses in the positive domain");
  return {b:T.approx(t,1e-7)};
 },
 "equal-slopes-cubic/inflection-and-coefficients/equation":({m,l,h,S},T)=>{
  const cubic=x=>m*x*x*x,D=x=>cubic(x+1)-cubic(x-1); // twice the derivative, with a constant cubic correction
  const Q=(D(l)-D(h))/(4*(h-l)),C=S-(D(l)-2*m)/2-2*Q*l;
  const f=x=>cubic(x)+Q*x*x+C*x,second=x=>f(x+1)-2*f(x)+f(x-1);
  const turning=T.bisect(second,l,h);
  T.require(second(l)<0&&second(h)>0&&Math.abs((f(h+1)-f(h-1))/2-m-S)<1e-8,"both slopes match and concavity reverses");
  return {a:Math.round(turning),b:Math.round(Q),c:Math.round(C)};
 },
 "substitution-reversed-middle/signed-composite-integral/equation":({a,c,g,h,d},T)=>{
  const f=x=>d*(x-a)*((x-a)**2+c)**2;
  const balance=T.integrate(f,a-h,a+h,180),tail=T.integrate(f,a-g,a-h,1400);
  T.require(g>h&&h>0&&tail<0&&Math.abs(balance)<1e-8,"symmetric contribution cancels and remaining left side is negative");
  return {b:T.approx(tail,1e-6)};
 },
 "axis-crossing-disk-switch/outer-radius-switch/equation":({k,c},T)=>{
  const y=T.bisect(t=>Math.exp(t/k)-c,0,2*k);
  const cross=t=>Math.PI*Math.max(c,Math.exp(t/k))**2;
  const volume=T.integrate(cross,0,y,160)+T.integrate(cross,y,2*k,480);
  T.require(c>1&&c<Math.exp(2)&&y>0&&y<2*k,"farther endpoint switches strictly inside the region");
  return {b:T.approx(y,1e-8),c:T.approx(volume,2e-7)};
 },
 "parallel-slope-field-calibration/recover-flat-location/table":({a,x,y,X,Y,j,w},T)=>{
  const fits=[];
  for(let b=1;b<=12;b++)for(let c=-80;c<=80;c++){
   if(a*x-b*y+c===j&&a*X-b*Y+c===j)fits.push([b,c]);
  }
  T.require(fits.length===1&&X>x&&Y>y,"two different grid locations uniquely fix both coefficients");
  const [b,c]=fits[0],g=z=>a*w-b*z+c;
  T.require(g(-50)>0&&g(50)<0,"horizontal segment bracketed");
  return {a:b,b:c,c:T.approx(T.bisect(g,-50,50),1e-8)};
 },
 "reverse-second-order-euler/initial-velocity/words":({d,k,x,a,M},T)=>{
  const step=([X,V])=>[X+V/d,V+(a-k*V)/d];
  const final=v=>step(step([x,v]))[0]-M/(d*d),v=T.bisect(final,-15,15);
  T.require(d>k&&k>1&&v>0&&Math.abs(final(v))<1e-9,"unique physical initial velocity reaches the printed target");
  return {b:Math.round(v),c:T.approx(step([x,v])[1],1e-8)};
 },
 "phase-portrait-angular-direction/axis-crossing-and-radius/equation":({a,b,d,sg},T)=>{
  // The analytic flow is uniform rotation composed with exponential shrinkage.
  const path=t=>[d*Math.exp(-a*t)*Math.cos(sg*b*t),d*Math.exp(-a*t)*Math.sin(sg*b*t)];
  const dt=1e-6,dy=(path(dt)[1]-path(-dt)[1])/(2*dt);
  const lambda=Math.log(Math.hypot(...path(.1))**2/d**2)/.1;
  T.require(Math.sign(dy)===sg&&lambda<0,"local rotational direction and shrinking radius checked separately");
  return {a:Math.round(dy),c:Math.round(lambda)};
 },
 "perpendicular-motion-closest/closest-time/words":({u,v,x,y},T)=>{
  const D=t=>Math.hypot(x+u*t,y-v*t);
  let left=0,right=y/v;for(let j=0;j<55;j++){
   const w=(2*left+right)/3,z=(left+2*right)/3;if(D(w)<D(z))right=z;else left=w;
  }
  const t=(left+right)/2;
  T.require(t>0&&t<y/v&&D(t)<D(0)&&D(t)<D(y/v),"unique interior approach-to-recede transition");
  return {b:T.approx(t,2e-7)};
 },
 "gradient-from-uneven-times/compare-secant-estimates/table":({t,k,b,c,d,e,z},T)=>{
  const H=x=>k*(x-t)**2+b*(x-t)+c;
  const A=(H(t+e)-H(t-d))/(d+e),B=(H(t+z)-H(t))/z;
  T.require(z>e&&e<d&&A<b&&b<B,"two ordered nonsymmetric secants with different slopes");
  return {a:A,b:B};
 },
 "two-reversals-flow-budget/net-versus-intake/words":({M,C,end},T)=>{
  const f=x=>M-(2*x-C)**2,lo=T.bisect(f,0,C/2),hi=T.bisect(f,C/2,end);
  const intake=T.integrate(f,lo,hi,100),net=T.integrate(f,0,end,250);
  T.require(lo>0&&hi<end&&f(0)<0&&f(end)<0&&f(C/2)>0&&intake>net,"exactly two reversals, with gross intake greater than signed net change");
  return {a:T.approx(lo,1e-8),b:T.approx(hi,1e-8),c:T.approx(intake,1e-8),d:T.approx(net,1e-8)};
 },
 "shifted-inverse-drain/time-to-clearance/words":({B,L,J,K,H,W},T)=>{
  const duration=c=>T.integrate(y=>y-B,B+c,B+L,100),elapsed=H/W;
  const k=duration(J)/elapsed,next=duration(K)/k;
  T.require(B>0&&L>J&&J>K&&K>0&&next>elapsed,"both recorded fluid heights above outlet and target after calibration");
  return {b:Math.round(k),c:T.approx(next,1e-8)};
 },
};
export default Object.fromEntries(Object.entries(cases).map(([key,fn])=>["w3-calculus-"+key,(q,T)=>fn(q.params,T)]));
