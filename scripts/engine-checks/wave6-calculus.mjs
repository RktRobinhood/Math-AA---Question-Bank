/* Independent recomputation: use a reference-line search, numerical gradients,
   extremum search, signed probes, and a bounded coefficient search. */
const V={
"tangent-axis-intercept-from-local-reference/reasoning/words":({h,m,z,a},T)=>{
 const f=x=>a*(x-h)**2+m*(x-h)+m*z;
 const slope=(f(h+.25)-f(h-.25))/.5;
 const line=x=>f(h)+slope*(x-h);
 const intercept=T.bisect(line,h-8,h);
 T.require(T.close(line(intercept),0)&&f(intercept)>0,"linear intercept is not a root of the original curve");
 return {a:slope,b:intercept};
},
"stationary-spacing-from-slope/reasoning/equation":({h,d,a,x,v},T)=>{
 const ks=T.range(1,101).filter(j=>v===a*(x-h)**2-j);
 T.require(ks.length===1,"unique gradient calibration");
 const slope=x=>a*(x-h)**2-ks[0],rs=T.roots(slope,h-6,h+6);
 T.require(rs.length===2&&T.integrate(slope,...rs,200)<0,"two stationary points with strict loss between them");
 return {a:ks[0],b:T.approx(rs[1]-rs[0],1e-8)};
},
"contract-retarget-demand/reasoning/words":({m,b,v},T)=>{
 const R=(k,x)=>x*(k-b*x),candidates=T.range(1,181).filter(k=>T.close(T.deriv(x=>R(k,x),m,0.125),0,1e-10));
 T.require(candidates.length===1,"only one permitted demand scale yields the observed optimizer");
 const k=candidates[0],max=T.extremum(x=>R(k,x),0,v,"max",121);
 T.require(Math.abs(max.x-m)<1e-5&&0<m&&m<v&&k-b*v>0,"unique interior optimum and positive predicted demand throughout");
 return {b:k};
},
"product-slope-neutral-factor/reasoning/table":({u,v,w},T)=>{
 const H=(s,k)=>(u-w*s/v)*(v*u+k*s);
 const grad=k=>(H(.125,k)-H(-.125,k))/.25;
 const flat=T.range(-5,5).find(k=>Math.abs(grad(k))<1e-9);
 T.require(T.close(grad(flat),0,1e-10)&&!T.close(grad(flat+1),0),"local factor adjustment has two different outcomes");
 return {a:flat,b:T.approx(grad(flat+1),1e-9)};
},
"reverse-chain-offset-calibration/reasoning/equation":({h,a,b,c,k},T)=>{
 const r=x=>3*k*a*(a*(x-h)+b)**2, observed=k*b**3+c;
 const delta=T.integrate(r,h,h+1,24);
 const base=x=>(a*(x-h)+b)**3;
 const scale=delta/(base(h+1)-base(h));
 const offset=observed-scale*base(h);
 T.require(scale>0&&offset>0&&Math.abs(T.deriv(x=>scale*base(x)+offset,h+.25,1e-3)-r(h+.25))<1e-8,"recovered antiderivative differentiates to the displayed model");
 return {a:T.approx(scale,1e-9),b:T.approx(offset,1e-9)};
},
"stationarity-before-curvature/reasoning/equation":({p,a,b,m,c,x},T)=>{
 const f=(t,k)=>a*(t-p)**3+b*(t-p)**2+k*(t-p)+c,goal=3*a+2*b+m;
 const winner=T.range(-4,4).find(k=>T.close(T.deriv(t=>f(t,k),x,.125),goal,1e-10));
 const curvature=T.deriv2(t=>f(t,winner),p,.0625), dp=T.deriv(t=>f(t,winner),p,.125);
 T.require(Math.abs(curvature)>1&&Math.abs(dp)>.5,"curvature is nonzero but the point is not stationary");
 return {a:winner,b:T.approx(curvature,1e-9)};
},
"double-zero-is-not-inflexion/reasoning/equation":({a,b,C},T)=>{
 const sec=x=>C*(x-a)**2*(x-b);
 const flips=[a,b].filter(x=>Math.sign(sec(x-.25))!==Math.sign(sec(x+.25)));
 T.require(flips.length===1&&b-a>=2&&sec(a)===0,"a zero without a local sign reversal is available");
 return {a:flips[0]};
},
"rate-band-width/reasoning/words":({a,b,c,H,high},T)=>{
 const position=t=>a*Math.log(t+b)+c*t*t,rate=t=>T.deriv(position,t,1e-3);
 const min=T.extremum(rate,0,H,"min",301), gap=t=>rate(t)-high;
 T.require(min.x>.5&&min.x<H-.5&&gap(0)>0&&gap(H)>0&&gap(min.x)<0,"two rate crossings strictly inside the observation window");
 const l=T.bisect(gap,0,min.x,60),u=T.bisect(gap,min.x,H,60);
 T.require(l>0&&l<min.x&&u>min.x&&u<H,"minimum is within a nontrivial bounded duration");
 return {a:T.approx(min.x,2e-5),b:T.approx(min.value,1e-7),c:T.approx(u-l,1e-6)};
},
"order-after-reversed-input/reasoning/words":({a,l,u,d,T:H},T)=>{
 const source=t=>-Math.abs(t-a),g=x=>d-source(H-x);
 const xs=T.range(-20,25).filter(x=>H-x>=l&&H-x<=u);
 const turn=xs.reduce((x,y)=>g(x)<g(y)?x:y);
 T.require(turn>xs[0]&&turn<xs.at(-1)&&g(turn+1)>g(turn)&&g(turn-1)>g(turn),"reversed argument and subtracted output make a genuine interior minimum");
 return {a:xs[0],b:xs.at(-1),c:turn};
},
"pair-of-gradient-readings/reasoning/equation":({j0,m1,m2},T)=>{
 const F=(x,A,B)=>A/x+B*x+j0,asserts=[];
 for(let A=-24;A<=24;A++)for(let B=-9;B<=9;B++){
  const blend=T.deriv(x=>F(x,A,B),1,.001),next=T.deriv(x=>F(x,A,B),2,.001);
  if(T.close(blend,m1,1e-8)&&T.close(next,m2,1e-8))asserts.push([A,B]);
 }
 T.require(asserts.length===1&&asserts[0].every(x=>x!==0),"independent bounded search fits a unique nontrivial model");
 const [A,B]=asserts[0];
 return {a:A,b:B,c:F(2,A,B)};
}
};
export default Object.fromEntries(Object.entries(V).map(([id,f])=>["w6-calculus-"+id,(q,T)=>f(q.params,T)]));
