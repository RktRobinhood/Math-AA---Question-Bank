/* Independent answer verifiers loaded by the bank's existing QA. */
const sum=xs=>xs.reduce((s,x)=>s+x,0);
function walk(n,p){
  let d=[1];
  for(let t=0;t<n;t++){
    const a=new Array(d.length+1).fill(0);
    d.forEach((v,k)=>{a[k]+=v*(1-p);a[k+1]+=v*p;});
    d=a;
  }
  return d;
}
export default {
"t4-scale-partition-right-tail/partition-right-tail/equation":(q,T)=>{
let {d,k}=q.params;
return {a:T.approx(Array.from({length:d},(_,i)=>i).filter(i=>i>=k).length/d,1e-10)};
},
"t4-scale-stratum-reverse/stratum-reverse/table":(q,T)=>{
const {a,b,c,f}=q.params;
const ratio=a/(a*f);return {a:Math.round(b/ratio),b:Math.round((a+b+c)/ratio)};
},
"t4-scale-histogram-missing-width/histogram-missing-width/table":(q,T)=>{
const {a,b,r}=q.params;
const end=Array.from({length:30},(_,i)=>i).find(x=>x>a&&(x-a)*r===b*r);
return {a:end};
},
"t4-scale-remove-duplicate-mean/remove-duplicate-mean/words":(q,T)=>{
const {mean,n,old,correct}=q.params;
const records=Array(n-1).fill((n*mean-old)/(n-1)).concat([old]);const S=x=>x.reduce((a,b)=>a+b,0);
return {a:Math.round(S(records)),b:T.approx(S(records.slice(0,-1))/(n-1),1e-9),c:T.approx(S(records.slice(0,-1).concat(correct))/n,1e-9)};
},
"t4-scale-regression-residual-swap/regression-residual-swap/table":(q,T)=>{
const {a,b,x,y,x2,y2}=q.params;
const e1=y+(-b*x-a),e2=y2+(-b*x2-a); return {a:T.approx(y-e1,1e-9),b:T.approx(e1,1e-9),c:T.approx(e2,1e-9)};
},
"t4-scale-unequal-experiment-comparison/unequal-experiment-comparison/table":(q,T)=>{
const {x,y,n,m}=q.params;
T.require(x>=0&&x<=n&&y>=0&&y<=m,"counts are possible");
return {a:T.approx(x/n,1e-10),b:T.approx(y/m,1e-10)};
},
"t4-scale-venn-exactly-one-reverse/venn-exactly-one-reverse/words":(q,T)=>{
const {a,b,c,d}=q.params;
const possible=Array.from({length:a+b+c+d+1},(_,i)=>i).find(i=>a+c-i+b+c-i===a+b);
const amOnly=a+c-possible,pmOnly=b+c-possible,total=a+b+c+d;
return {a:possible,b:total-amOnly-pmOnly-possible,c:T.approx(pmOnly/total,1e-10)};
},
"t4-scale-discrete-fair-stake/discrete-fair-stake/table":(q,T)=>{
const {d,k,j,a,b}=q.params,payouts=Array(d-k-j).fill(0).concat(Array(k).fill(a),Array(j).fill(b));
const m=payouts.reduce((s,v)=>s+v,0)/d;
return {a:T.approx(m,1e-10),b:T.approx(m,1e-10),c:T.approx(payouts.filter(v=>v>m).length/d,1e-10)};
},
"t4-scale-binomial-majority-vs-tie/binomial-majority-vs-tie/words":(q,T)=>{
const {n,p,s}=q.params;
const d=walk(n,p);return {a:T.approx(d[s],1e-10),b:T.approx(sum(d.slice(s+1)),1e-10),c:T.approx(sum(d.slice(0,s)),1e-10)};
},
"t4-scale-normal-probability-complement-map/normal-probability-complement-map/equation":(q,T)=>{
const {inside}=q.params;const right=0.5-inside/2;return {a:T.approx(right,1e-10),b:T.approx(0.5+inside/2,1e-10),c:T.approx(0.5-right,1e-10)};
},
"t4-scale-inverse-regression-disagreement/inverse-regression-disagreement/equation":(q,T)=>{
const {x0,y0,s,t,d}=q.params;return {a:T.approx(t*(y0+d)+(x0-t*y0),1e-9),b:T.approx((y0+d-(y0-s*x0))/s,1e-9)};
},
"t4-scale-independence-cell-repair/independence-cell-repair/table":(q,T)=>{
const {A,B,n}=q.params;
const k=Array.from({length:Math.min(A,B)+1},(_,i)=>i).find(i=>i*n===A*B);
return {a:k,b:n-A-B+k};
},
"t4-scale-standardise-opposite-scales/standardise-opposite-scales/table":(q,T)=>{
const {a,b,s,t,x,y}=q.params;
return {a:T.approx((x-a)/s,1e-10),b:T.approx((y-b)/t,1e-10)};
},
"t4-scale-bayes-reverse-mixture/bayes-reverse-mixture/equation":(q,T)=>{
const {a,b,mixed}=q.params;
const p=Array.from({length:11},(_,i)=>i).find(i=>i*a+(10-i)*b===mixed);
return {a:T.approx(p/10,1e-10),b:T.approx(1-b*(10-p)/mixed,1e-10)};
},
"t4-scale-pdf-triangular-median/pdf-triangular-median/equation":(q,T)=>{
const {s,h}=q.params;
const n=1024,avg=Array.from({length:n},(_,i)=>(i+.5)*s/n).reduce((acc,x)=>acc+x/n,0),k=1/(s*avg);
let lo=0,hi=s;for(let i=0;i<50;i++){let m=(lo+hi)/2;if(k*m*m<1)lo=m;else hi=m;}
return {a:T.approx(k,1e-10),b:T.approx(k*s*s/8,1e-10),c:T.approx(lo,1e-8),d:T.approx(h+2*lo,1e-8)};
},
"t4-scale-rank-correct-swapped-orders/rank-correct-swapped-orders/table":(q,T)=>{
const {A,B,u,v}=q.params;
const corr=(A,B)=>{const c=(A.length+1)/2;return sum(A.map((x,i)=>(x-c)*(B[i]-c)))/sum(A.map(x=>(x-c)**2));};
const C=B.slice();[C[u],C[v]]=[C[v],C[u]]; return {a:T.approx(corr(A,B),1e-10),b:T.approx(corr(A,C),1e-10)};
},
"t4-scale-chi-decision-changed-level/chi-decision-changed-level/table":(q,T)=>{
const {a,b,c,u,v,w,n,p}=q.params;const A=[a,b,c],B=[u,v,w],pairs=A.map((x,i)=>x+B[i]);
T.require(p>.01&&p<.05,"significance decision changes");
return {a:T.approx(pairs[0]*sum(A)/n,1e-10),b:(A.length-1)};
},
"t4-scale-merge-tail-df-cost/merge-tail-df-cost/table":(q,T)=>{
const {n,p,d,e,largest}=q.params;const r=[...largest,d,e];const tail=r.pop()+r.pop();r.push(tail);
T.require(r.every(x=>x>=5),"all expected counts satisfy the stated threshold");
return {a:tail,b:r.length,c:r.length-1-p};
},
"t4-scale-residual-score-model-switch/residual-score-model-switch/table":(q,T)=>{
const {y,a,b}=q.params;const ss=x=>sum(x.map((v,i)=>v*v-2*v*y[i]+y[i]*y[i]));
T.require(ss(a)<ss(b),"distinct empirical model fit");return {a:T.approx(ss(a),1e-8),b:T.approx(ss(b),1e-8)};
},
"t4-scale-unbias-and-rescale/unbias-and-rescale/words":(q,T)=>{
const {n,v,k}=q.params;const z=Array(n).fill(v),s=sum(z);return {a:s,b:Math.round(s/(n-1)),c:Math.round(sum(z.map(x=>x*k*k))/(n-1))};
},
"t4-scale-sample-mean-backsolve-n/sample-mean-backsolve-n/equation":(q,T)=>{
const {mu,sigma,q:se}=q.params;const n=Array.from({length:200},(_,i)=>i+1).find(i=>i*se*se===sigma*sigma);
return {a:n,b:mu,c:T.approx(Math.sqrt(sigma**2/(4*n)),1e-10)};
},
"t4-scale-confidence-interval-deconstruct/confidence-interval-deconstruct/equation":(q,T)=>{
const {m,r}=q.params;const lo=m-r,hi=m+r;return {a:(lo+hi)/2,b:hi-(lo+hi)/2};
},
"t4-scale-poisson-change-rate-and-mix/poisson-change-rate-and-mix/words":(q,T)=>{
const {a,b,t,j}=q.params;const mass=(x,k)=>Math.exp(-x)*x**k/Array.from({length:k},(_,i)=>i+1).reduce((p,v)=>p*v,1);
const p=Array.from({length:j+1},(_,i)=>mass(a*t,i)*mass(b,j-i)).reduce((a,b)=>a+b,0);
return {a:T.approx(sum(Array(t).fill(a).concat(b)),1e-9),b:T.approx(p,1e-10),c:T.approx(1-mass(a*t,0)*mass(b,0),1e-10)};
},
"t4-scale-critical-region-from-tail-table/critical-region-from-tail-table/table":(q,T)=>{
const {n,p,k}=q.params;const d=walk(n,p);const read=k=>Number(sum(d.slice(k)).toFixed(4));
T.require(read(k-1)>.05&&read(k)<=.05,"printed tail separates the two counts");
return {a:Array.from({length:n+1},(_,i)=>i).find(i=>read(i)<=.05),b:T.approx(read(k),1e-10)};
},
"t4-scale-markov-two-step-bridge/markov-two-step-bridge/table":(q,T)=>{
const {a,b}=q.params;const M=[[a,1-a],[b,1-b]],product=[0,0];for(let i=0;i<2;i++)for(let j=0;j<2;j++)product[j]+=M[0][i]*M[i][j];
return {a:T.approx(product[0]-M[0][1]*M[1][0],1e-10),b:T.approx(product[0],1e-10),c:T.approx(1-a*a/product[0],1e-10)};
},
"t4-scale-median-append-extreme/median-append-extreme/terms":(q,T)=>{
const {data,f}=q.params;const skew=xs=>{const v=xs.slice().sort((a,b)=>a-b);return (v[Math.floor((v.length-1)/2)]+v[Math.floor(v.length/2)])/2;};
return {a:skew(data),b:T.approx(skew(data.concat(f)),1e-10)};
},
"t4-scale-normal-conditional-visual/normal-conditional-visual/graph":(q,T)=>{
const {b,c,k}=q.params;return {a:T.option([b,c]),b:T.approx(k-k/2,1e-10)};
},
};
