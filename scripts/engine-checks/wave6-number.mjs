/* Independent methods for the 12 Wave 6 AI HL families. */
const list=(a,b)=>Array.from({length:b-a+1},(_,i)=>i+a);
const add=(a,b)=>[a[0]+b[0],a[1]+b[1]], raw=(x=>x);
const cosSin=(r,h)=>[r*Math.cos(h),r*Math.sin(h)];
const examples={
 "power-identity-backsolve":(q,T)=>{
  const {p,d,q:k}=q.params,x=64,
   rhs=Math.sqrt(x**k)/Math.pow(x,d/6),rhsAt8=Math.sqrt(8**k)/Math.pow(8,d/6);
  const fits=list(-25,35).filter(m=>Math.abs(x**(m/6)*Math.cbrt(x**p)/rhs-1)<1e-9&&Math.abs(8**(m/6)*Math.cbrt(8**p)/rhsAt8-1)<1e-9);
  T.require(fits.length===1,"one missing exponent satisfies two independent positive probes");
  return {a:Math.log2(rhs)/6,b:fits[0],c:Math.round(rhs)};
 },
 "power-fourth-root-filter":(q,T)=>{
  const {a,b}=q.params,c=b-a,k=a*b,poss=list(-16,16).filter(u=>u*u+c*u===k);
  const original=x=>Math.sqrt(x)+c*Math.sqrt(Math.sqrt(x)),valid=poss.map(x=>x**4).filter(x=>original(x)===k);
  T.require(poss.length===2&&poss[0]<0&&valid.length===1,"only one candidate survives substitution in the original equation");
  return {a:poss.at(-1),b:T.option("domain"),c:valid[0]};
 },
 "power-competing-crossover":(q,T)=>{
  const {a,b,x0}=q.params,A=x=>a*Math.cbrt(x*x),B=x=>b/Math.sqrt(x),difference=x=>A(x)-B(x);
  const threshold=T.bisect(difference,.05,200,58),minimum=list(1,201).find(x=>difference(x)>0);
  T.require(minimum>1&&difference(minimum-1)<=0&&difference(minimum)>0,"a strict whole-number switch exists");
  return {a:A(x0)/B(x0),b:threshold,c:minimum};
 },
 "power-geometric-cancellation":(q,T)=>{
  const {a,b,x,k,p,s}=q.params,den=q.params.q;
  const measure=t=>Math.exp(p*Math.log(t)/den);
  const A=t=>a*measure(t),B=t=>b/measure(t);
  const combine=t=>Math.exp((Math.log(A(t))+Math.log(B(t)))/2);
  T.require(Math.abs(combine(x)-combine(2*x))<1e-10,"merged signal is invariant independently of drift");
  return {a:A(x),b:combine(x),c:100*(A(x+x*k*.01)-A(x))/A(x)};
 },
 "log-identity-weight":(q,T)=>{
  const {d,m,p,a,b}=q.params;
  const L=(x,k)=>Math.log(a*x**p)-k*Math.log(x**d),R=x=>Math.log(a)+m*Math.log(x);
  const fits=list(-8,15).filter(k=>Math.abs(L(1.5,k)-R(1.5))<1e-8&&Math.abs(L(2.3,k)-R(2.3))<1e-8);
  T.require(fits.length===1,"a unique coefficient matches two nonunit probes");
  return {a:fits[0],b:Math.round(Math.exp(L(b*1.8,fits[0])-L(1.8,fits[0])))};
 },
 "log-average-missing-input":(q,T)=>{
  const {a,b,c}=q.params;
  const logAverage=x=>(Math.log(a)+Math.log(b)+Math.log(x))/3;
  const target=T.bisect(x=>logAverage(x)-Math.log(c),.001,2500,60),read=Math.round(target);
  T.require(Math.abs(logAverage(read)-Math.log(c))<1e-10,"positive integer reading reproduces the displayed log-mean");
  return {a:a*b*read,b:read};
 },
 "conjugate-reflection-components":(q,T)=>{
  const {x,y}=q.params,point=[x,y],mirror=point.map((k,i)=>k*(i===0?1:-1));
  T.require(Math.hypot(...point)===Math.hypot(...mirror)&&y!==0,"nontrivial reflection preserves distance");
  return {a:mirror[1],b:T.option("equal")};
 },
 "conjugate-mix-reverse":(q,T)=>{
  const {a,b,u,v}=q.params,xy=[];
  for(const x of list(-12,12))for(const y of list(-12,12)){
   const z=[x,y],conjugate=[x,-y],out=add(z.map(w=>a*w),conjugate.map(w=>b*w));
   if(out[0]===u&&out[1]===v)xy.push(z);
  }
  T.require(xy.length===1,"only one Cartesian pair produces the complex mix");
  return {a:xy[0][0],b:xy[0][1],c:Math.round(Math.hypot(...xy[0])**2)};
 },
 "complex-circle-row":(q,T)=>{
  const {a,b,v,R}=q.params;
  const gap=x=>Math.hypot(x-a,v-b)-R;
  let x=T.bisect(gap,a-R-1,a,64);
  if(Math.abs(x)<1e-12)x=0;
  const other=T.bisect(gap,a,a+R+1,64);
  T.require(x<a&&other>a&&Math.abs(gap(x))<1e-10&&v>0,"two points at the required distance; choose left one");
  return {a:a-x,b:x,c:Math.acos(x/Math.hypot(x,v))};
 },
 "polar-cancel-vertical":(q,T)=>{
  const {a,e}=q.params,z=cosSin(a,e*Math.PI/3),r1=cosSin(1,-e*Math.PI/6);
  const unknown=T.bisect(w=>add(z,r1.map(c=>c*w))[1],.0001,80,58);
  const sum=add(z,r1.map(c=>c*unknown));
  T.require(unknown>0&&Math.abs(sum[1])<1e-10,"only positive length making the sum horizontal");
  return {a:Math.round(unknown/Math.sqrt(3)),b:Math.round(sum[0])};
 },
 "polar-ordered-map-inverse":(q,T)=>{
  const {a,b,u,v,e}=q.params,round=(x=>Math.round(x));
  const R=([x,y])=>[round(x*Math.cos(e*Math.PI/2)-y*Math.sin(e*Math.PI/2)),round(x*Math.sin(e*Math.PI/2)+y*Math.cos(e*Math.PI/2))];
  let p;
  for(const x of list(-19,19))for(const y of list(-19,19)){
   const image=add(R([x,y]),[a,b]);
   if(image[0]===u&&image[1]===v)p=[x,y];
  }
  const reverse=R(add(p,[a,b]));
  T.require(reverse[0]!==u||reverse[1]!==v,"reordered transformations give a distinct point");
  return {a:p[0],b:p[1],c:(reverse[0]-u)**2+(reverse[1]-v)**2};
 },
 "polar-inverse-wave-compensation":(q,T)=>{
  const {A0,B,a,b,w}=q.params,gap=t=>A0*Math.sin(w*t+a)-B*Math.sin(w*t+b),
   y=gap(0),x=gap(Math.PI/(2*w)),amp=Math.sqrt(x*x+y*y),phase=Math.acos(x/amp);
  T.require(y>0&&amp>0&&Math.abs(amp*Math.sin(2.8+phase)-gap(2.8/w))<1e-10,"unique positive amplitude and upper-half-plane phase reproduce the signal");
  return {a:y,b:amp,c:phase};
 },
};
const words=new Set(["power-competing-crossover","power-geometric-cancellation","log-average-missing-input","polar-inverse-wave-compensation"]);
export default Object.fromEntries(Object.entries(examples).map(([s,fn])=>["w6-number-"+s+"/reason/"+(words.has(s)?"words":"equation"),fn]));
