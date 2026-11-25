/* Independent Wave 2 recomputation; no imports from the production generator. */
const sum=xs=>xs.reduce((a,b)=>a+b,0);
const range=(k)=>Array.from({length:k},(_,i)=>i);
const cross=(xs,ys)=>xs.flatMap(x=>ys.map(y=>[x,y]));
const h={
 "repair-disproportionate-sample":(q,T)=>{
  const {n1,n2,w1,w2,a,b}=q.params, pop=Array(w1*n1).fill(a/n1).concat(Array(w2*n2).fill(b/n2));
  const weighted=T.mean(pop),raw=(a+b)/(n1+n2);
  T.require(w2>w1 && b/n2>a/n1 && raw<weighted,"the higher-response depot has the weaker sampling fraction");
  return {a:Math.round(sum(pop)),b:weighted,c:T.option(raw<weighted?"under":raw>weighted?"over":"same")};
 },
 "histogram-split-bins":(q,T)=>{
  const {a,b,c,d,e,f,x,rank}=q.params,bins=[[0,a,d],[a,a+b,e],[a+b,a+b+c,f]];
  const areaAt=v=>sum(bins.map(([l,h,y])=>Math.max(0,Math.min(v,h)-l)*y));
  const n=areaAt(a+b+c),k=T.bisect(v=>areaAt(v)/n-rank/100,0,a+b+c);
  T.require(new Set([a,b,c]).size>1,"not all histogram widths are equal");
  T.require(k>x&&k<a+b,"the quantile is interior to the second bin, after the first cutoff");
  return {a:100*areaAt(x)/n,b:k};
 },
 "conditional-removal-reversal":(q,T)=>{
  const {a,b}=q.params,beads=range(a+b);
  let all=0,matched=0,hiddenBlue=0;
  for(const h of beads)for(const j of beads)for(const k of beads){
   if(h===j||j===k||k===h)continue;all++;
   if(j<a&&k<a){matched++;if(h>=a)hiddenBlue++;}
  }
  T.require(0<hiddenBlue&&hiddenBlue<matched&&matched<all,"both hidden colors can precede the observed path");
  return {a:matched/all,b:hiddenBlue/matched};
 },
 "capped-payout-expectation":(q,T)=>{
  const {d,a,b,c,m,j,u,cap,fee}=q.params,raw=[...Array(d-a-b-c).fill(0),...Array(a).fill(m),...Array(b).fill(m+j),...Array(c).fill(u)],waiver=raw.map(x=>fee+Math.min(x,cap));
  T.require(raw.length===d&&raw.filter(x=>x===0).length>0&&m<cap&&cap<m+j&&m+j<u,"positive masses and interior cap");
  return {a:T.mean(raw),b:T.mean(waiver),c:raw.filter((x,i)=>waiver[i]<x).length/d};
 },
 "spearman-transform-one-score":(q,T)=>{
  const {x,y,a,b,i,newY}=q.params,rf=col=>col.map(x=>col.filter(y=>y<x).length+(1+col.filter(y=>y===x).length)/2);
  const transformed=y.map(v=>a*v+b),updated=y.map((v,j)=>j===i?newY:v);
  // Score correlation from raw sums; distinct from mean-centred production calculation.
  function corr(v,w){const n=v.length,m=sum(v),z=sum(w);return (n*sum(v.map((x,i)=>x*w[i]))-m*z)/Math.sqrt((n*sum(v.map(x=>x*x))-m*m)*(n*sum(w.map(x=>x*x))-z*z));}
  const before=corr(rf(x),rf(transformed)),after=corr(rf(x),rf(updated));
  T.require(new Set(y).size===y.length-1&&new Set(updated).size===y.length,"exactly one tie, broken by the correction");
  T.require(Math.abs(before-after)>.01&&JSON.stringify(rf(y))===JSON.stringify(rf(transformed)),"the conversion preserves rank while the correction changes it");
  return {a:Number(before.toFixed(3)),b:rf(updated)[i]-rf(y)[i],c:rf(updated)[i===1?2:1]};
 },
 "test-observed-direction":(q,T)=>{
  const {a,high,two,l}=q.params;const lower=high>a?1-two/2:two/2,tail=1-lower;
  T.require(high!==a&&two>0&&two<1&&Math.abs(100*tail-l)>.01,"nonzero observed difference and unambiguous significance comparison");
  return {a:tail,b:T.option(tail*100<l?"reject":"retain")};
 },
 "test-retest-versus-calibration":(q,T)=>{
  const {ref,one,two}=q.params;const delta=one.map((v,i)=>v-ref[i]);
  const passes=one.every((v,i)=>Math.abs(v-ref[i])<=1)&&two.every((v,i)=>Math.abs(v-ref[i])<=1);
  const repeat=one.every((v,i)=>Math.abs(v-two[i])<=1);
  T.require(repeat&&!passes,"the criterion and repeated readings separate");
  return {a:T.mean(delta),b:T.option(repeat?(passes?"both":"reliable-only"):(passes?"valid-only":"neither"))};
 },
 "held-out-residual-check":(q,T)=>{
  const {observed,pa,pb,r1,r2}=q.params;
  const loss=col=>col.map((x,i)=>Math.abs(x-observed[i])).map(x=>x*x).reduce((a,b)=>a+b,0);
  const a=loss(pa),b=loss(pb);
  T.require(r1<r2&&a<b,"the training and held-out metrics do not rank the models alike");
  return {a,b,c:T.option(a<b?"A":a>b?"B":"tie")};
 },
 "paired-independent-contrasts":(q,T)=>{
  const {a,b,sdA,sdB,k,c}=q.params;
  // A four-outcome synthetic population gives precisely the stated moments.
  const x=[a-sdA,a+sdA],y=[b-sdB,b+sdB],d=cross(x,y).map(([u,v])=>u-k*v+c),mean=T.mean(d);
  return {a:mean,b:T.mean(d.map(x=>x*x))-mean*mean};
 },
 "two-normal-batches-disagree":(q,T)=>{
  const {m,delta,s,t,n,j,gap}=q.params;
  const sign=[...Array(n).fill(s/n),...Array(j).fill(-t/j)];
  const variance=T.sum(sign,x=>x*x),sd=Math.sqrt(variance);
  T.require(n>=4&&j>=9&&sign.some(x=>x<0)&&sd>0,"independent non-degenerate sample means");
  return {a:sd,b:T.integrate(T.normalPdf,(gap-(m+delta-m))/sd,9,4000)};
 },
 "confidence-precision-tradeoff":(q,T)=>{
  const {sigma,n,l,z1,h,z2,candidate}=q.params;
  // Geometry of the reported intervals: solve for the first standard deviation that doubles a fixed centre-to-endpoint span.
  const a=z1/100*sigma/Math.sqrt(n),span=sd=>2*(z2/100)*sd/Math.sqrt(n);
  const limit=T.bisect(sd=>span(sd)-2*a,0,2*sigma);
  T.require(h>l&&span(0)<2*a&&span(sigma)>2*a&&limit<sigma,"higher confidence widens the interval at equal measurement noise");
  return {a,b:limit,c:T.option(span(candidate)<=2*a+1e-12?"yes":"no")};
 },
 "poisson-separate-windows":(q,T)=>{
  const {a,b,c,k}=q.params;
  const times=range(a+b+c).map(i=>i+.5),A=x=>x<a+b,B=x=>x>=a;
  const overlap=times.filter(x=>A(x)&&B(x)).length*k/4,union=times.filter(x=>A(x)||B(x)).length*k/4;
  T.require(overlap>0&&union>overlap&&times.some(x=>A(x)!==B(x)),"observations include an overlap and unique time on either side");
  return {a:overlap,b:union,c:T.option(union)};
 },
 "markov-recover-transition":(q,T)=>{
  const {x,y,a,b}=q.params;
  const m=p=>[[x/10,p],[(10-x)/10,1-p]];
  const apply=(matrix,state)=>matrix.map(row=>T.sum(row,(v,i)=>v*state[i]));
  const twoSteps=p=>apply(m(p),apply(m(p),[1,0]))[0];
  // Reconstruct the shown 2-step value, then solve numerically over feasible transition values.
  const shown=Number(twoSteps(y/10).toFixed(2)),recovered=T.bisect(p=>twoSteps(p)-shown,0,1);
  T.require(0<recovered&&recovered<1&&Math.abs(recovered-x/10)>.01&&a&&b,"both initial states matter and the missing transition is identifiable");
  return {a:recovered,b:apply(m(recovered),[a/(a+b),b/(a+b)])[0]};
 },
};
const rep={ "repair-disproportionate-sample":"table","histogram-split-bins":"table","capped-payout-expectation":"table","spearman-transform-one-score":"table","test-retest-versus-calibration":"table","held-out-residual-check":"table"};
export default Object.fromEntries(Object.entries(h).map(([k,v])=>[`t4-wave2-${k}/solve/${rep[k]||"words"}`,v]));
