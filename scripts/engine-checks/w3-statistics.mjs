/* Recompute using empirical enumeration, numerical integration and independent criteria. */
const r=(n)=>Array.from({length:n},(_,i)=>i),sum=v=>v.reduce((a,b)=>a+b,0);
const checks={
 "outlier-equality":(q,T)=>{
  const {a,g,v}=q.params,normalised=(v-a)/g;
  const correct=normalised< -1.5||normalised>2.5?"out":"inside";
  T.require(g>0&&(v<a||v>a+g),"test value is extreme enough that the fence matters");
  return {a:T.option(correct)};
 },
 "box-summary-tradeoff":(q,T)=>{
  const {a,c}=q.params;
  const spread=(x,I)=>Math.max(...I.map(i=>x[i]))-Math.min(...I.map(i=>x[i]));
  const u=spread(a,[1,2,3]),v=spread(c,[1,2,3]),w=spread(a,[0,4]),z=spread(c,[0,4]);
  T.require(a.every((x,i)=>!i||a[i-1]<x)&&c.every((x,i)=>!i||c[i-1]<x),"strictly ordered summaries");
  T.require((u>v)!==(w>z)&&u!==v&&w!==z,"the IQR and total range rankings oppose");
  return {a:Math.abs(u-v),b:T.option(w>z?"A":"B"),c:T.bisect(k=>T.median(c.map(x=>x+k))-T.median(a),-50,50)};
 },
 "pooled-spread-as-offsets":(q,T)=>{
  const {s,t,a,b,d,e}=q.params,A=Array(s).fill([a-d,a+d]).flat(),B=Array(t).fill([b-e,b+e]).flat(),x=[...A,...B];
  const m=T.mean(x),sd=Math.sqrt(T.mean(x.map(v=>(v-m)**2)));
  T.require(T.mean(A)!==T.mean(B)&&Math.abs(sd-(s*d+t*e)/(s+t))>.01,"different centres change the pooled spread");
  return {a:m,b:sd,c:T.option("offset")};
 },
 "regression-crossover-window":(q,T)=>{
  const {xbar,ybar,m,other,alt,lo,hi}=q.params;
  const A=x=>ybar+m*(x-xbar),B=x=>alt+other*x;
  T.require(m!==other&&lo<hi,"unique intersection and proper observed interval");
  const x=r(51).map(v=>v-10).find(x=>A(x)===B(x));
  T.require(Number.isInteger(x)||x===0,"a unique displayed input exists");
  return {a:A(0),b:x,c:T.option(x<lo?"left":x>hi?"right":"in")};
 },
 "blend-payout-threshold":(q,T)=>{
  const {base,step,d,u,v,wa}=q.params;
  const modes=[r(10).map(i=>base+(i<u?step:0)),r(10).map(i=>base+(i<v?2*step:0))];
  const pooled=(w)=>[...Array(w).fill(modes[0]).flat(),...Array(d-w).fill(modes[1]).flat()];
  const target=T.mean(pooled(wa)),solutions=r(d+1).filter(x=>T.mean(pooled(x))===target);
  T.require(solutions.length===1&&solutions[0]>0&&solutions[0]<d,"one nondegenerate mixing proportion");
  const out=pooled(solutions[0]);
  return {a:T.mean(modes[1]),b:(d-solutions[0])/d,c:out.filter(x=>x>base+step).length/out.length};
 },
 "normal-union-reflection":(q,T)=>{
  const {h,k,q:centre,p,sigma}=q.params;
  const integral=(lo,hi)=>T.integrate(T.normalPdf,lo/sigma,hi/sigma);
  T.require(Math.abs(integral(-h,h)-centre/1000)<.000501&&Math.abs(integral(-k,h)-(centre+p)/1000)<.000501,"stated values actually agree with a normal distribution before rounding");
  const right=(centre+p)/1000-centre/1000,later=centre/1000+2*right;
  return {a:right,b:1-later};
 },
 "spearman-reverse-scale":(q,T)=>{
  const {n,start,rs,ax,b,xr}=q.params;
  const raw=r(n).map((_,i)=>i===start?i-1:i),changed=raw.map(x=>ax-b*x),tied=changed[start];
  const rank=changed.filter(x=>x<tied).length+(1+changed.filter(x=>x===tied).length)/2;
  T.require(new Set(changed).size===n-1 && changed[0]>changed.at(-1),"strict reversal preserves the single tied pair");
  const R=col=>col.map(x=>col.filter(v=>v<x).length+(1+col.filter(v=>v===x).length)/2);
  const rr=R(changed),u=sum(xr),v=sum(rr),square=x=>x*x;
  const numerator=n*sum(xr.map((x,i)=>x*rr[i]))-u*v;
  const denominator=Math.sqrt((n*sum(xr.map(square))-u*u)*(n*sum(rr.map(square))-v*v));
  T.require(Math.abs(100*numerator/denominator+rs)<=.50000001,"a real compatible rank series yields the sign change");
  return {a:rank,b:-rs/100};
 },
 "goodness-of-fit-critical-contribution":(q,T)=>{
  const {raw}=q.params,mean=T.mean(raw),by=raw.map(x=>(x-mean)**2/mean),stat=sum(by);
  const key=by.indexOf(Math.max(...by));
  T.require(mean>5&&Math.abs(stat-7.815)>.001&&by.filter(x=>x===by[key]).length===1,"large expected frequencies and strict decisions");
  return {a:mean,b:stat,c:T.option("ABCD"[key]),d:T.option(stat>7.815?"reject":"retain")};
 },
 "compare-vertical-retunes":(q,T)=>{
  const {pred,obs,cand}=q.params,scores=cand.map(shift=>sum(obs.map((o,i)=>(o-(pred[i]+shift))**2)));
  const m=Math.min(...scores),pos=scores.indexOf(m);
  T.require(scores.filter(x=>x===m).length===1&&cand.length===new Set(cand).size,"distinct settings and one best retune");
  return {a:cand[pos],b:m};
 },
 "clt-average-or-total":(q,T)=>{
  const {n,m,sd,k,normal}=q.params;
  // n independent terms with coefficient 1/n for their average.
  const weights=Array(n).fill(1/n);
  T.require(n>=16&&sd>0&&m!==k,"nontrivial threshold and well-defined sampling moments");
  return {a:k/weights[0],b:Math.sqrt(T.sum(weights,x=>(sd*x)**2)),c:T.option(normal?"exact":"limit")};
 },
 "trade-false-alarm-and-miss":(q,T)=>{
  const {d,n0,n1,n2,nc,alt0,alt1,alt2,alt3,x,old,next}=q.params;
  const obs=(ns)=>ns.flatMap((n,i)=>Array(n).fill(i+x)),h=obs([nc,n0,n1,n2]),f=obs([alt0,alt1,alt2,alt3]);
  T.require(h.length===d&&f.length===d,"both empirical distributions have unit mass");
  const rates=t=>[h.filter(v=>v>=t).length/d,f.filter(v=>v<t).length/d],before=rates(old),curr=rates(next);
  T.require((before[0]-curr[0])*(before[1]-curr[1])<0,"the score entering or leaving the region has positive probability in both groups");
  return {a:before[0],b:curr[1],c:T.option(before[0]>curr[0]?"strict":"loose")};
 },
 "markov-invert-mixed-start":(q,T)=>{
  const {a,b,p}=q.params;
  const m=[[a/10,b/10],[(10-a)/10,(10-b)/10]],e=x=>m.map(row=>row[0]*x[0]+row[1]*x[1]);
  const shown=e([p/10,1-p/10])[0];
  const inv=T.bisect(x=>e([x,1-x])[0]-shown,0,1);
  T.require(inv>0&&inv<1&&a!==b,"valid unique mixed initial state");
  return {a:inv,b:e(e([inv,1-inv]))[0]};
 },
};
const words=new Set(["outlier-equality","normal-union-reflection","clt-average-or-total"]);
export default Object.fromEntries(Object.entries(checks).map(([k,v])=>[`w3-statistics-${k}/solve/${words.has(k)?"words":"table"}`,v]));
