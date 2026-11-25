/* Recompute Wave 4 stats with independent enumeration, raw sums, or numerical inversion. */
const sum=a=>a.reduce((u,v)=>u+v,0),list=(n)=>Array.from({length:n},(_,i)=>i);
const ci=Object.freeze({
 "uniform-numbered-window":(q,T)=>{
  const {size,a,b,d,m}=q.params,all=list(size).map(v=>v+1).filter(x=>x<a||x>b),regular=all.filter(x=>x%d!==0);
  T.require(all.length<size&&all.length>0&&regular.length&&regular.length<all.length,"withdrawal leaves both types of events");
  return {a:all.length,b:1-regular.length/all.length,c:m*regular.length};
 },
 "empirical-reroute-cap":(q,T)=>{
  const {s,t,lo,hi,base,cap,target}=q.params;
  const p=[s*lo/(s*20),t*hi/(t*20)],work=x=>T.sum(list(base),i=>p[Number(i<x)]);
  const counts=list(cap+1).map(work),first=list(cap+1).find(x=>((base-x)*lo+x*hi)*50>=Math.round(1000*target));
  T.require(first>0&&first<cap&&counts.at(-1)>target,"feasible nontrivial threshold has both passing and failing plans");
  return {a:counts[0],b:first,c:Math.max(...counts)};
 },
 "percent-improvement-before-forecast":(q,T)=>{
  const {weights,a,d,c,k}=q.params,original=weights*a/(weights*1000),newApp=original+original*d*.01;
  const raw=c*newApp;
  const rate=BigInt(a)*BigInt(100+d),extra=BigInt(k)*100000n;
  const meets=i=>BigInt(i-c)*rate>=extra;
  const min=list(1000).find(meets);
  T.require(newApp>original&&newApp<1&&min>c&&!meets(min-1)&&meets(min),"bounded genuine threshold found by enumeration");
  return {a:1-newApp,b:c*original+c*d*.01-raw,c:min};
 },
 "reference-plus-signed-steps":(q,T)=>{
  const {a,b,k}=q.params,frame=list(Math.abs(k)).reduce(v=>k<0?v-b:v+b,a);
  T.require(Math.abs(k)>1&&b>1,"requires a signed change and an addition");
  return {a:frame};
 },
 "inverse-z-specification":(q,T)=>{
  const {mean,sd,z,obs}=q.params,standardise=x=>(x-mean)/sd;
  const boundary=T.bisect(x=>standardise(x)-z,-200,200);
  T.require(sd>0&&(T.close(standardise(obs),z)||Math.abs(standardise(obs)-z)>.01),"positive scale, including exactly accepted boundary cases");
  return {a:boundary,b:T.option(standardise(obs)>=z?"yes":"no")};
 },
 "pair-of-z-stamps":(q,T)=>{
  const {mu,u,v,w,k}=q.params,x=mu+u*v,y=mu+u*w;
  const sigma=list(30).find(i=>i>0&&x-v*i===y-w*i);
  T.require(sigma>0&&w>v&&x<y,"unique standard deviation and consistent score order");
  const middle=x-v*sigma;
  return {a:sigma,b:middle,c:T.bisect(t=>(t-middle)/sigma-k,-500,500)};
 },
 "equal-percentile-window":(q,T)=>{
  const {a,b,s,t,z0,z1,probe}=q.params;
  const first=x=>T.normalCdf((x-a)/s),second=x=>T.normalCdf((x-b)/t),targets=[a+s*z0,a+s*z1].map(first);
  const [lo,hi]=targets.map(k=>T.bisect(x=>second(x)-k,b-5*t,b+5*t,44));
  T.require(lo<hi&&lo<b&&hi>b,"equal percentiles are ordered and central");
  const read=second(probe),eps=1e-10;
  return {a:lo,b:hi,c:T.option(read<targets[0]-eps?"low":read>targets[1]+eps?"high":"inside")};
 },
 "same-mean-binomial-risk":(q,T)=>{
  const {n,a,d,flip}=q.params,models=[[n,a/d],[2*n,a/(2*d)]],values=models.map(([k,p])=>{
   const dist=list(k+1).map(i=>T.binomPmf(k,p,i));
   return {mean:T.sum(dist,(v,i)=>v*i),empty:dist[0]};
  });
  const u=values[flip?0:1],v=values[flip?1:0];
  T.require(T.close(u.mean,v.mean)&&Math.abs(u.empty-v.empty)>1e-4,"common means and distinct zero-success probabilities");
  return {a:u.mean,b:u.empty,c:T.option(u.empty<v.empty?"A":"B")};
 },
 "reverse-fit-calibration-flag":(q,T)=>{
  const {rows,suspect,y,observed}=q.params;
  function fit(z){
   const n=z.length,X=sum(z.map(u=>u[0])),Y=sum(z.map(u=>u[1])),products=sum(z.map(u=>u[0]*u[1]));
   const variance=n*sum(z.map(u=>u[1]**2))-Y**2;
   return X/n+(n*products-X*Y)/variance*(y-Y/n);
  }
  const all=fit([...rows,suspect]),kept=fit(rows),errors=[all,kept].map(x=>Math.abs(x-observed));
  T.require(Math.abs(all-kept)>.7&&Math.abs(errors[0]-errors[1])>.3&&y>rows[0][1]&&y<rows.at(-1)[1],"material predictive differences inside the fitted range");
  return {a:all,b:kept,c:T.option(errors[0]<errors[1]?"all":"retained")};
 },
 "pooled-ogive-placement":(q,T)=>{
  const {a,b,c,d,e,f,g,h,j,p}=q.params;
  const bins=[[0,a,d+g],[a,b,e+h-d-g],[b,c,f+j-e-h]];
  const curve=x=>T.sum(bins,([l,r,v])=>v*Math.min(1,Math.max(0,(x-l)/(r-l))));
  const total=curve(c),q0=T.bisect(x=>curve(x)/total-p/100,0,c);
  T.require(bins.every(i=>i[2]>0)&&q0>a&&q0<c,"pooled CDF is strictly increasing and percentile not at outer edge");
  return {a:100*(1-curve(b)/total),b:q0};
 },
 "equal-cohort-quota-policy":(q,T)=>{
  const {ma,mb,sa,sb,na,nb,q:quota}=q.params;
  const tail=z=>T.integrate(T.normalPdf,z,9,1800);
  const draw=(m,s,nn)=>x=>nn*tail((x-m)/s);
  const fromA=draw(ma,sa,na),fromB=draw(mb,sb,nb);
  const find=(m,s,nn)=>T.bisect(x=>draw(m,s,nn)(x)-quota,m-4*s,m+4*s,48);
  const a=find(ma,sa,na),b=find(mb,sb,nb),commonB=fromB(a),sample=na+nb;
  T.require(0<commonB&&commonB<nb&&Math.abs(fromA(a)-quota)<.00001&&Math.abs(fromB(b)-quota)<.00001,"both positive tails meet assigned quotas");
  return {a,b,c:commonB,d:(commonB/sample)/((fromA(a)+commonB)/sample)};
 },
});
const tables=new Set(["empirical-reroute-cap","percent-improvement-before-forecast","pair-of-z-stamps","equal-percentile-window","reverse-fit-calibration-flag","pooled-ogive-placement","equal-cohort-quota-policy"]);
export default Object.fromEntries(Object.entries(ci).map(([k,v])=>[`w4-statistics-${k}/solve/${tables.has(k)?"table":"words"}`,v]));
