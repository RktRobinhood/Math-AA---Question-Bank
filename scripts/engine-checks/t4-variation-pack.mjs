// Independent binomial calculation: build the distribution one trial at a time,
// rather than the generator's closed-form adjacent-mass recurrence.
const probabilities=(n,p)=>{
  let d=[1];
  for(let t=1;t<=n;t++){
    const next=new Array(t+1).fill(0);
    for(let k=0;k<d.length;k++){ next[k]+=d[k]*(1-p); next[k+1]+=d[k]*p; }
    d=next;
  }
  return d;
};
const sum=(d,lo,hi)=>d.slice(lo,hi+1).reduce((a,b)=>a+b,0);
const r4=x=>Math.round(x*10000)/10000;
export default {
  "t4-empirical-forecast/predict-combined-count/table":(q,T)=>{
    const {counts,future}=q.params;
    const n=counts.reduce((a,b)=>a+b,0);
    T.require(future%n===0,"the forecast has an exact whole-number scaling");
    const other=(counts[2]+counts[3])/n, forecastOther=future*other;
    return {a:T.approx(1-other,1e-10),b:Math.round(future-forecastOther)};
  },
  "t4-empirical-forecast/recover-sample-size/words":(q,T)=>{
    const {total,pass,target}=q.params;
    const fraction=(total-pass)/total;
    const candidates=Array.from({length:600},(_,i)=>i+1).filter(i=>Math.abs(i*fraction-target)<1e-9);
    T.require(candidates.length===1,"one future trial count meets the forecast");
    return {a:T.approx(fraction,1e-10),b:candidates[0]};
  },
  "t4-binomial-reading-cdf/complement-boundary/table":(q,T)=>{
    const {n,p,k}=q.params;
    const d=probabilities(n,p), tail=sum(d,k,n);
    T.require(k>0&&k<n,"event excludes an admissible boundary");
    return {a:T.approx(r4(tail),1e-10)};
  },
  "t4-binomial-reading-cdf/interval-and-point/table":(q,T)=>{
    const {n,p,k,lower,upper}=q.params;
    const d=probabilities(n,p);
    const read=(i)=>r4(sum(d,0,i));
    T.require(lower<k-1&&k<upper&&upper<n,"CDF rows are ordered and non-terminal");
    return {a:T.approx(read(upper)-read(lower),1e-10),b:T.approx(read(k)-read(k-1),1e-10),c:T.approx(r4(sum(d,upper+1,n)),1e-10)};
  },
  "t4-binomial-with-condition/restricted-count/words":(q,T)=>{
    const {n,p,k,lo}=q.params;
    const d=probabilities(n,p),tail=sum(d,lo,n), window=sum(d,lo,k);
    const conditioned=d.slice(lo).map(x=>x/tail);
    T.require(tail>0&&window>0&&window<tail,"condition and complement both remain possible");
    return {a:T.approx(tail,1e-10),b:T.approx(window,1e-10),c:T.approx(sum(conditioned,0,k-lo),1e-10)};
  },
  "t4-binomial-with-condition/latent-source/table":(q,T)=>{
    const {n,p0,p1,w,k}=q.params;
    const d0=probabilities(n,p0),d1=probabilities(n,p1);
    const a=sum(d0,k,n), b=sum(d1,k,n);
    const mixture=d0.map((v,i)=>w*v+(1-w)*d1[i]), total=sum(mixture,k,n);
    const weightedPosterior=mixture.reduce((acc,v,i)=>i<k?acc:acc+v/total*(w*d0[i]/v),0);
    T.require(p0<p1&&a<b,"two modes have distinct probabilities and conditional tails");
    return {a:T.approx(a,1e-10),b:T.approx(total,1e-10),c:T.approx(weightedPosterior,1e-10)};
  }
};
