/* Independent checks: exhaustive planning, numerical integration, exact denominators and direct enumeration. */
const sum=a=>a.reduce((x,y)=>x+y,0),seq=n=>Array.from({length:n},(_,i)=>i),L=i=>String.fromCharCode(65+i);
function simpson(a,b,f,n=400){
 const h=(b-a)/n;let s=f(a)+f(b);
 for(let i=1;i<n;i++)s+=(i%2?4:2)*f(a+i*h);
 return s*h/3;
}
const forms={
 "validation-across-operating-ranges":(q,T)=>{
  const {rows,limit,rep,errors}=q.params;
  const repeats=z=>[z.low,z.high].every(k=>k>=rep);
  const passing=rows.map((z,i)=>[i,z]).filter(([,z])=>repeats(z)&&Math.max(z.errL,z.errH)<=limit);
  const partial=rows.filter(z=>repeats(z)&&(z.errL>limit)!==(z.errH>limit));
  T.require(passing.length===1&&partial.length===1&&errors.length===7&&errors.some(e=>e<0)&&errors.some(e=>e>0),"unique qualified candidate and positive/negative held-out residuals");
  T.require(q.parts.reduce((n,p)=>n+p.marks,0)===7,"L4 mark ceiling");
  return {a:Math.hypot(...errors)/Math.sqrt(errors.length),b:T.option(L(passing[0][0])),c:T.option("stable"),d:T.option("hold")};
 },
 "sample-size-before-merging":(q,T)=>{
  const {w,stat,observed}=q.params,forms=[];
  for(let low=0;low<=1;low++)for(let high=0;high<=1;high++){
   const groups=w.slice();
   if(high)groups.splice(groups.length-2,2,groups.at(-1)+groups.at(-2));
   if(low)groups.splice(0,2,groups[0]+groups[1]);
   const first=seq(260).map(j=>j+1).find(n=>groups.every(v=>BigInt(n)*BigInt(v)>500n));
   forms.push({mode:low&&high?"both":low?"left":high?"right":"none",groups,first});
  }
  const best=m=>{
   const ordered=forms.filter(f=>f.groups.length-1-m>=3).sort((a,b)=>a.first-b.first);
   T.require(ordered.length>1&&ordered[0].first<ordered[1].first&&ordered[0].groups.some(y=>BigInt(ordered[0].first-1)*BigInt(y)<=500n),"minimum is unique and preceding integer invalid");
   return ordered[0];
  };
  const f=best(0),e=best(1),prob=1-simpson(0,Math.sqrt(stat),x=>Math.sqrt(2/Math.PI)*x*x*Math.exp(-x*x/2));
  const actual=f.groups.reduce((acc,v,i)=>{
    const scaled=v*f.first;return acc+(observed[i]*100-scaled)**2/(100*scaled);
   },0);
  T.require(sum(w)===100&&w.every(x=>x>0)&&f.groups.length===4&&e.groups.length===5&&Math.abs(prob-.05)>.007,"viable plans at three degrees, robust p-value decision");
  T.require(Math.abs(stat-actual)<=.005000001&&sum(observed)===f.first&&observed.every(x=>Number.isInteger(x)&&x>=0),"printed statistic is attainable from actual Plan F sample");
  T.require(q.parts.reduce((n,p)=>n+p.marks,0)===7,"L4 mark ceiling");
  return {a:T.option(f.mode),b:f.first,c:T.option(e.mode),d:e.first,e:prob,f:T.option(prob<.05?"reject":"retain")};
 },
 "normal-paired-difference":(q,T)=>{
  const {a,b,k,m}=q.params,s=Math.hypot(k*3,k*4),avg=a-b,z=(m-avg)/s;
  const prob=simpson(z,10,t=>Math.exp(-t*t/2)/Math.sqrt(2*Math.PI),1000);
  T.require(a!==b&&z!==0&&m!==avg&&Math.abs(z)<=1.6,"nontrivial signed difference and stable numerical tail");
  return {a:avg,b:s,c:prob};
 },
 "confidence-label-recovery":(q,T)=>{
  const {rows,claim}=q.params,wide=rows.reduce((x,y)=>x[2]-x[1]>y[2]-y[1]?x:y),contains=rows.filter(([_,l,u])=>l<claim&&claim<u);
  T.require(contains.length===1&&wide[0]===contains[0][0]&&Math.abs(rows[0][1]+rows[0][2]-rows[1][1]-rows[1][2])<1e-10,"common centre and claim only in wider interval");
  return {a:T.option(wide[0]),b:T.option(contains[0][0]),c:(rows[0][1]+rows[0][2]+rows[1][1]+rows[1][2])/4};
 },
 "recover-prediction-from-mean-point":(q,T)=>{
  const {xbar,ybar,slope,y}=q.params,b=(10*xbar-Math.round(10*slope)*ybar)/10;
  const estimate=(10*xbar+Math.round(10*slope)*(y-ybar))/10;
  T.require(y!==ybar&&estimate!==xbar,"prediction target differs from the reported means");
  return {a:b,b:estimate};
 },
 "independence-through-complement":(q,T)=>{
  const {n,u,v}=q.params,t=[[n*u,n*(20-u)],[(10-n)*v,(10-n)*(20-v)]];
  const total=sum(t.flat()),pa=t[0][0]+t[1][0],pb=sum(t[0]);
  const independent=t[0][0]*total===pa*pb;
  T.require(total===200&&t.flat().every(k=>k>0),"valid, nondegenerate probability design");
  return {a:T.option(independent?"yes":"no"),b:t[1][0]/total,c:pa/total};
 },
 "match-standard-score-across-scales":(q,T)=>{
  const {m1,m2,s1,s2,x1,x2}=q.params;
  const key=(x1-m1)*s2>(x2-m2)*s1?"A":"B",v=seq(150).find(v=>(v-m2)*s1===(x1-m1)*s2);
  T.require(x1>x2&&key==="B"&&v!==undefined,"opposite raw and standard-score order and unique integer matching score");
  return {a:(x1-m1)/s1,b:T.option(key),c:v};
 },
 "cap-and-coalesce-distribution":(q,T)=>{
  const {x,w,c}=q.params,tickets=x.flatMap((k,i)=>Array(w[i]).fill(k<c?k:c));
  T.require(tickets.length===32&&new Set(tickets).size===3&&x.filter(k=>k>c).length===2,"five supplied demand values collapse to three distinct outcomes");
  return {a:tickets.filter(k=>k===c).length/tickets.length,b:sum(tickets)/tickets.length};
 },
 "binomial-complement-counter":(q,T)=>{
  const {n,s,a,b}=q.params,p=s/20;let state=[1];
  for(let i=0;i<n;i++){
   const next=Array(state.length+1).fill(0);
   state.forEach((v,j)=>{next[j]+=v*p;next[j+1]+=v*(1-p);});state=next;
  }
  const accepted=seq(n+1).filter(y=>a<=y&&y<b),xs=accepted.map(y=>n-y);
  T.require(accepted.length>=2&&accepted.every(y=>y>0&&y<n),"genuine interior failure-count interval");
  return {a:Math.min(...xs),b:Math.max(...xs),c:sum(accepted.map(y=>state[y]))};
 },
 "rank-swap-local-audit":(q,T)=>{
  const {a,b,i,j,old}=q.params,c=b.map((v,k)=>k===i?b[j]:k===j?b[i]:v),n=a.length,m=(n+1)/2;
  const dist=sum(a.map((x,k)=>(x-c[k])**2)),num=sum(a.map((x,k)=>(x-m)*(c[k]-m)));
  T.require(new Set(a).size===n&&new Set(c).size===n&&dist!==old,"untied ranks and a meaningful erroneous swap");
  return {a:dist,b:num/Math.sqrt(sum(a.map(x=>(x-m)**2))*sum(c.map(x=>(x-m)**2)))};
 },
 "chi-square-equal-residuals":(q,T)=>{
  const {row,second}=q.params,total=sum(row)+sum(second);
  const e=row.map((v,i)=>(v+second[i])*sum(row)/total),contribution=(o,e)=>(o-e)**2/e;
  const [a,b]=row.map((v,i)=>contribution(v,e[i]));
  T.require(e.every(x=>x>5)&&a!==b&&Math.abs(row[0]-e[0])===Math.abs(row[1]-e[1]),"valid 2×3 independence table with two degrees of freedom and unequal normalized deviations");
  return {a:e[0],b:T.option(a>b?"A":"B"),c:a+contribution(second[0],e[0])};
 },
 "poisson-zero-one-ratio":(q,T)=>{
  const {r4,scale,k,minutes}=q.params,x=r4/4,one=seq(k+1).reduce((v,i)=>i?v.concat([v.at(-1)*x/i]):[Math.exp(-x)],[]),distribution=Array(k+1).fill(0);
  distribution[0]=1;let d=distribution;
  for(let trial=0;trial<scale;trial++){
   const next=Array(k+1).fill(0);
   for(let i=0;i<=k;i++)for(let j=0;j<=k-i;j++)next[i+j]+=d[i]*one[j];
   d=next;
  }
  T.require(minutes>0&&d[k]>0&&d[k]<1&&scale>=2,"strictly greater exposure and interior probability");
  return {a:one[1]/one[0],b:d[k]};
 },
};
const tables=new Set(["validation-across-operating-ranges","sample-size-before-merging","confidence-label-recovery","independence-through-complement","match-standard-score-across-scales","cap-and-coalesce-distribution","rank-swap-local-audit","chi-square-equal-residuals"]);
export default Object.fromEntries(Object.entries(forms).map(([name,v])=>["w6-statistics-"+name+"/solve/"+(tables.has(name)?"table":"words"),v]));
