// Answers are independently recovered from the shown data, often by numerical integration or black-box differentiation.
const cases={
"paired-chord-calibration/separate-even-and-odd-contributions/table":({x,h,c,up,down},T)=>{
 const matches=[];
 for(let A=-18;A<=18;A++)for(let B=-9;B<=9;B++){
  const increase=k=>A*k+B*k*k+c*k*k*k;
  if(increase(h)===h*up&&increase(-h)===-h*down)matches.push([A,B]);
 }
 T.require(matches.length===1&&c*h*h>0,"unique coefficients and nonzero chord bias");
 const [A,B]=matches[0];
 return {a:B,b:Math.round(T.deriv(z=>A*(z-x)+B*(z-x)**2+c*(z-x)**3,x))};
},
"tangent-prediction-at-slowing-point/rate-threshold-then-prediction-error/words":({h,v,b,d,g},T)=>{
 const H=x=>b+v*Math.sqrt(x+h),slope=(x)=>T.deriv(H,x,1e-3);
 T.require(slope(0)>d&&slope(200)<d,"positive bracketing time");
 const x=T.bisect(t=>slope(t)-d,0,200);
 const predicted=H(x)+slope(x)*g;
 const gap=predicted-H(x+g);
 T.require(gap>0&&x>0,"positive time and concave-model overprediction");
 return {a:T.approx(x,1e-6),b:T.approx(predicted,1e-7),c:T.approx(gap,1e-7)};
},
"monotonicity-with-hole/decrease-separated-by-excluded-input/equation":({a,b,c},T)=>{
 const g=x=>(x-a)*(x-b)/(x-c)**2;
 const zeros=[...T.roots(g,a-1,c-.1),...T.roots(g,c+.1,b+1)];
 T.require(zeros.length===2&&g((a+c)/2)<0&&g((c+b)/2)<0,"two derivative roots and distinct decreasing pieces");
 return {a:zeros.length,c:g(c+1)};
},
"rising-window-in-cycles/combine-two-rising-intervals/equation":({a,k,lo,rgt},T)=>{
 const start=lo/k,stop=(2+rgt)/k,sign=t=>Math.cos(k*Math.PI*t)-a;
 const first=T.roots(sign,0,2/k);
 T.require(first.length===2&&start<first[0]&&stop>first[1],"two observed rising segments");
 const rr=[start,...T.roots(sign,start,stop),stop];
 let total=0;for(let j=0;j<rr.length-1;j++)if(sign((rr[j]+rr[j+1])/2)>0)total+=rr[j+1]-rr[j];
 return {a:first[0],b:first[1],c:total};
},
"piecewise-delivery-meter/continuous-rate-change-and-reset/words":({a,m,s,k,L,target},T)=>{
 const v=a+m*s;
 const early=T.integrate(t=>a+m*t,0,s,120);
 const total=t=>early+T.integrate(x=>v*Math.sqrt(1+k*(x-s)),s,t,140);
 T.require(early<target&&total(s+L)>target,"crossing strictly after the model change");
 return {a:early,b:T.approx(total(s+L),1e-6),c:T.approx(T.bisect(t=>total(t)-target,s,s+L),1e-6)};
},
"steady-reading-unknown-drain/calibrate-baseline-loss-from-integrals/words":({a,k,H,w,V},T)=>{
 const inRate=t=>a*Math.sqrt(1+k*t);
 const total=T.integrate(inRate,0,H,140);
 const difference=c=>T.integrate(t=>inRate(t)-c,0,H,140);
 const c=T.bisect(difference,0,150);
 const volume=t=>V+T.integrate(s=>inRate(s)-c,0,t,140);
 T.require(T.range(0,H,.2).every(t=>volume(t)>0),"model tank never empties on queried interval");
 T.require(volume(w)<V&&Math.abs(volume(H)-V)<1e-9,"returns to initial reading after a strictly lower intermediate value");
 return {a:T.approx(total,1e-6),b:T.approx(c,1e-6),c:T.approx(volume(w),1e-6)};
},
"inverse-power-slope-band/two-slope-thresholds/equation":({a,b,g,j},T)=>{
 const curve=x=>a*x**3+b/x,deriv=x=>T.deriv(curve,x,1e-4);
 const roots=[g,j].map(s=>T.bisect(x=>deriv(x)-s,.2,7));
 T.require(roots[1]>roots[0]&&roots[0]>.2,"increasing gradient has two ordered thresholds");
 return {b:T.approx(roots[0],1e-6),c:T.approx(roots[1]-roots[0],1e-6)};
},
"log-power-inflection/nonstationary-concavity-switch/equation":({a,b},T)=>{
 const curve=x=>a*x**5+b*Math.log(x),c=x=>T.deriv2(curve,x,2e-4),x=T.bisect(c,.4,2);
 const der=T.deriv(curve,x,5e-5);
 T.require(c(.4)<0&&c(2)>0&&der>0,"concavity reverses at nonzero gradient");
 return {b:T.approx(x,1e-6),c:T.approx(der,1e-5)};
},
"signed-rise-over-run-prerequisite/opposite-direction-deltas/table":({x,d,y,w},T)=>{
 const points=[[x+d,y+w],[x,y]].sort((a,b)=>a[0]-b[0]);
 T.require(points[1][0]>points[0][0]&&w!==0,"nonzero change and strictly increasing input");
 return {a:points[1][1]-points[0][1]};
},
"balanced-chord-quartic/zero-secant-calibrates-monotonicity/equation":({a,s,h,c,d,e},T)=>{
 const shape=(x,B)=>a*(x-h)**4-B*(x-h)**2+c;
 const B=T.bisect(B=>shape(h+e,B)-shape(h-d,B),0,4000);
 const f=x=>shape(x,B),g=x=>T.deriv(f,x,1e-4);
 const r=T.roots(g,h-20,h+20);
 T.require(r.length===3&&Math.abs(r[1]-h)<1e-6&&g((r[0]+r[1])/2)>0&&g(r[2]+.1)>0,"only two increasing pieces, three separated stationary points");
 return {a:Math.round(B),c:Math.round(f(h)-f(r[2]))};
},
};
export default Object.fromEntries(Object.entries(cases).map(([key,fn])=>["w4-t5-"+key,(q,T)=>fn(q.params,T)]));
