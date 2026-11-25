/* Independent checks use published coefficients, points, tables and constraints, not generator helpers. */
const id=(n,r)=>"fn-wave2-"+n+"/reasoning/"+r;
const integers=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i);
export default {
 [id("range-with-overlap","table")]:({params:{pieces,q}},T)=>{
  const merged=[];
  for(const [a,b] of pieces.map(x=>x.slice(2)).sort((u,v)=>u[0]-v[0])){
   if(merged.length&&a<=merged.at(-1)[1])merged.at(-1)[1]=Math.max(b,merged.at(-1)[1]);else merged.push([a,b]);
  }
  const inputs=pieces.flatMap(([a,b,c,d])=>c<=q&&q<=d?[a+(b-a)*(q-c)/(d-c)]:[]);
  T.require(merged.length===2&&merged[0][1]<merged[1][0],"output is a true two-interval union");
  T.require(inputs.length===2&&inputs[0]<inputs[1]&&pieces.every(([a,b],i)=>!i||a>pieces[i-1][1]),"function with two distinct preimages");
  return {a:T.option("union"),b:Math.min(...inputs)};
 },
 [id("touch-beats-sign-scan","graph")]:({params:{xs,co},graph},T)=>{
  const f=x=>T.poly([...co].reverse(),x), candidates=integers(Math.ceil(graph.x[0]),Math.floor(graph.x[1])).filter(x=>Math.abs(f(x))<1e-8);
  const signRoot=candidates.find(x=>f(x-.01)*f(x+.01)<0),missing=candidates.find(x=>f(x-.01)*f(x+.01)>0);
  T.require(candidates.length===2&&signRoot<missing&&xs.every(x=>Math.abs(f(x))>1e-8),"one crossing and one noncrossing root, neither at sample");
  T.require(xs.slice(1).filter((x,i)=>f(xs[i])*f(x)<0).length===1,"scan detects exactly one bracket");
  return {a:signRoot,b:missing,c:T.option("touch")};
 },
 [id("ai-cubic-interval-rate","words")]:({params:{a,u,d,start}},T)=>{
  const f=x=>T.poly([a,0,0,start],x);
  const [first,second]=[u,u+d].map(l=>integers(l,l+d-1).reduce((acc,x)=>acc+f(x+1)-f(x),0));
  T.require(first>0&&second>first&&d>0,"positive increasing changes over equal interval size");
  return {a:first,b:second/d-first/d};
 },
 [id("ai-order-equivalence","words")]:({params:{d,k,div}},T)=>{
  const f=x=>x*x/div+k,g=x=>x+d;
  const D=x=>f(g(x))-g(f(x));
  const roots=integers(0,30).filter(x=>Math.abs(D(x))<1e-10);
  T.require(roots.length===1&&D(roots[0]-1)<0&&D(roots[0]+1)>0,"one agreeing nonnegative input, routes generally different");
  return {a:T.option("fog"),b:roots[0]};
 },
 [id("ai-log-ruler-interpolation","table")]:({params:{a,u,right,k,end}},T)=>{
  const join=(left,last)=>((right-k)*left+(k-u)*last)/(right-u);
  const logResult=10**join(Math.log10(a),Math.log10(end)),linear=join(a,end);
  T.require(a>0&&end>a&&u<k&&k<right&&linear-logResult>1,"strict interior with distinguishable scales");
  return {a:T.approx(logResult,1e-9),b:T.approx(linear,1e-9)};
 },
 [id("ahl-inverse-by-odd-symmetry","equation")]:({params:{a,b,v}},T)=>{
  const get=val=>{let x=val>0?2:-2;for(let i=0;i<40;i++)x-=(x**5+a*x-val)/(5*x**4+a);return x;};
  const first=get(v),second=get((b-v)-b);
  T.require(a>0&&b>0&&Math.abs(first**5+a*first-v)<1e-10&&Math.abs(second**5+a*second+b-(b-v))<1e-10,"unique converged positive and negative inverse images");
  return {a:T.approx(first,1e-11),b:T.approx(second,1e-11),c:T.option("no")};
 },
 [id("ahl-comparison-at-discrete-inputs","table")]:({params:{xs,f,g}},T)=>{
  const good=xs.filter((x,i)=>g[i]>=f[i]),ties=xs.filter((x,i)=>g[i]===f[i]);
  T.require(new Set(xs).size===5&&good.length===3&&ties.length===1,"include one equality alongside strict passes and fails");
  return {a:T.option("weak")};
 },
 [id("line-translation-crossing","equation")]:({params:{a,s,b,u,v,c}},T)=>{
  const rebuild=x=>[x+u,(a+s)*x+c+v],Y=x=>{const mid=rebuild(0);return mid[1]+(rebuild(1)[1]-mid[1])*(x-mid[0]);};
  const f=x=>a*x+b,root=T.bisect(x=>Y(x)-f(x),-40,40);
  T.require(Y(-40)<f(-40)&&Y(40)>f(40)&&v!==0,"one moved-line crossing and nontrivial movement");
  return {a:Y(0),b:T.approx(root,1e-9)};
 },
 [id("reciprocal-mid-output","equation")]:({params:{a,b,h,u,v}},T)=>{
  const f=x=>(b*x+a-b*h)/(x-h);
  const mean=(f(u)+f(v))/2,x=T.bisect(z=>f(z)-mean,u,v);
  T.require(h<u&&u<x&&x<v&&f(u)>mean&&f(v)<mean,"one crossing on the sampled branch away from the pole");
  return {a:T.approx(mean,1e-9),b:T.approx(x,1e-9)};
 },
 [id("reflect-coordinate-prerequisite","words")]:({params:{x,y,axis}},T)=>{
  const p=[x,y],base=axis==="x"?[1,0]:[0,1],dp=p[0]*base[0]+p[1]*base[1],ref=p.map((v,i)=>2*dp*base[i]-v);
  const changed=ref.filter((v,i)=>v!==p[i]);
  T.require(changed.length===1&&x&&y,"not on either axis and exactly one changed coordinate");
  return {a:changed[0]};
 },
 [id("ai-regime-crossing-gap","words")]:({params:{A,a,B,c,d,end,target}},T)=>{
  const L=t=>a*t+A,H=t=>B-(t-c)**2;
  const early=integers(0,d-1).filter(t=>L(t)===target),late=integers(d,end).filter(t=>H(t)===target),discard=integers(0,d-1).filter(t=>H(t)===target);
  T.require(early.length===1&&late.length===1&&discard.length===1&&discard[0]!==early[0]&&d>discard[0]&&late[0]>c,"positive rejected quadratic root belongs to wrong mode");
  return {a:early[0],b:late[0]};
 },
 [id("aa-rectangular-constraint-design","words")]:({params:{F,front},parts},T)=>{
  const surface=z=>z*(F-2*z);
  const opt=T.extremum(surface,0,F/2,"max",130),edge=T.bisect(z=>F-2*z-front,0,F/2);
  T.require(0<edge&&edge<opt.x&&front>0,"frontage caps width strictly before the unrestricted vertex");
  T.require(integers(1,Math.floor(edge)).every(x=>surface(x)<=surface(edge)+1e-9),"endpoint is maximal over all contained integer widths");
  const model=parts[0].answer.display.match(/^\$(-?\d+)x\^\{2\} \+ (\d+)x\$$/);
  T.require(Boolean(model)&&[1,2,5].every(x=>Number(model[1])*x*x+Number(model[2])*x===surface(x)),"shown symbolic area agrees with construction");
  return {b:T.approx(edge,1e-8),c:T.approx(opt.value,1e-8),d:T.approx(surface(edge),1e-8),e:T.option("frontage")};
 }
};
