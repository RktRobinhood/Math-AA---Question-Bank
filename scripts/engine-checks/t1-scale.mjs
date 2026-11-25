// Independent Topic 1 checks. Rebuild from public inputs, not the stored answer.
const v={};
const set=(t,u,r,fn)=>v['t1-scale-'+t+'/'+u+'/'+r]=fn;
const eq=(a,b)=>Math.abs(a-b)<=1e-8*Math.max(Math.abs(a),Math.abs(b),1e-5);
const toDp=(val,d)=>Number(val.toFixed(d));
const times=(start,ratio,n)=>{for(let j=0;j<n;j++)start*=ratio;return start;};
const vectorSum=(from,to,fn)=>{let sum=0;for(let i=from;i<=to;i++)sum+=fn(i);return sum;};
const crossing=(initial,ratio,threshold)=>{
  let val=initial,i=0;
  while(val>=(threshold-1e-11)&&i<1000){val*=ratio;i++;}
  return i;
};
const multiply=(a,b)=>{
  const result=new Array(a.length+b.length-1).fill(0);
  for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)result[i+j]+=a[i]*b[j];
  return result;
};
const expansion=(a,n)=>{
  let p=[1];for(let i=0;i<n;i++)p=multiply(p,[1,a]);return p;
};
const factorial=n=>Array.from({length:n},(_,i)=>i+1).reduce((x,y)=>x*y,1);
const choose=(n,k)=>factorial(n)/factorial(k)/factorial(n-k);

set('signal-difference','normalise-after-subtraction','equation',(q,T)=>{
  const {a,b,c,p,q:e}=q.params,W=Number(`${a}e${p}`)-Number(`${b}e${p-1}`);
  T.require(W>0&&c>0,'positive difference and nonzero denominator');
  return{a:W,b:W/Number(`${c}e${e}`)};
});
set('square-footprint','root-and-rescale','words',(q,T)=>{
  const {a,k,copies}=q.params, area=Number(`${a*a/10}e${2*k+1}`),side=Number(`${a}e${k}`);
  T.require(side>0&&side*side===area,'displayed area is a positive square');
  let total=0;for(let i=0;i<copies;i++)total+=side/100;
  return{a:side,b:total};
});
set('arithmetic-blocks','reconstruct-from-two-blocks','equation',(q,T)=>{
  const {len,h,A0,A1}=q.params, hits=[];
  for(let a=1;a<=30;a++)for(let d=-10;d<=10;d++){
    const term=i=>a+(i-1)*d;
    if(vectorSum(1,len,term)===A0&&vectorSum(h,h+len-1,term)===A1)hits.push([a,d]);
  }
  T.require(hits.length===1&&hits[0][1]!==0,'one feasible sequence; nonzero difference');
  return{a:hits[0][1],b:hits[0][0]};
});
set('arithmetic-mean','partial-backsolve','words',(q,T)=>{
  const {x,y,k,len}=q.params;
  const d=[1,2,3,4,5,6,7,8,9,10].find(n=>x+(len-1)*n===y);
  T.require(Number.isInteger(d)&&d>0,'compatible positive arithmetic difference');
  const earlier=Array.from({length:k-1},(_,i)=>x-(k-1-i)*d);
  return{a:earlier[0],b:earlier.reduce((a,b)=>a+b,0)};
});
set('alternating-geometric','negative-ratio-from-odd-gap','equation',(q,T)=>{
  const {j,k,u,v}=q.params;
  const r=T.bisect(s=>times(u,s,k-j)-v,-6,0);
  T.require(r<0&&eq(times(u,r,k-j),v),'negative real ratio from odd-separated terms');
  const term=idx=>idx>=j?times(u,r,idx-j):times(u,1/r,j-idx);
  return{a:r,b:term(1)+term(2)+term(3)};
});
set('geometric-sums-to-terms','recover-from-three-partial-totals','equation',(q,T)=>{
  const {s1,s2,s3}=q.params;
  const denominator=[2,3,4,5,6].find(x=>s1+s1/x+s1/(x*x)===s3&&s1+s1/x===s2);
  T.require(denominator>1,'strictly convergent positive ratio');
  return{a:1/denominator,b:vectorSum(0,3,i=>s1*denominator**(-i))};
});
set('indices-nested-powers','solve-and-verify-power','equation',(q,T)=>{
  const {b,h,k,offset,p}=q.params;
  const w=T.range(-10,10).filter(x=>b**(k*x-offset)/b**(-h)===1);
  const exponent=T.range(-10,0).find(a=>b**a===1/b**p);
  T.require(w.length===1&&b>1&&p>0,'unique real x and admissible logarithm base');
  return{a:w[0],b:exponent};
});
set('log-reject-root','product-log-domain','equation',(q,T)=>{
  const {a,y}=q.params, objective=x=>Math.log(x-a)/Math.log(y)+Math.log(x+a)/Math.log(y)-2;
  const x=T.bisect(objective,a+1e-4,150);
  T.require(x>a&&y>1&&eq(x,Math.round(x)),'unique exact root in log domain');
  return{a,b:Math.round(x)};
});
set('rational-exponent-ratio','two-powers-same-root','equation',(q,T)=>{
  const {q:den,p:pow,value}=q.params;
  const x=T.bisect(x=>Math.pow(x,pow/den)-value,0,400);
  T.require(eq(x,Math.round(x))&&x>0,'unique positive integer');
  return{a:Math.round(x),b:Math.pow(x,-1/den)};
});
set('repeating-tail','fraction-with-leading-nonrepeat','equation',(q,T)=>{
  const {lead,pair}=q.params;
  T.require(lead>0&&pair>=10&&pair<100,'lead digit and valid two-digit block');
  const terms=Array.from({length:20},(_,i)=>pair*10**(-3-2*i));
  const tail=terms.reduce((a,b)=>a+b,0);return{a:tail,b:lead/10+tail};
});
set('alternating-tail','convergent-tail-with-sign','equation',(q,T)=>{
  const {q:d,a,n}=q.params;
  T.require(d>=2&&n>=2,'negative ratio within the open unit interval');
  const terms=Array.from({length:150},(_,i)=>times(a,-1/d,i));
  const sum=terms.reduce((a,b)=>a+b,0),tail=terms.slice(n).reduce((a,b)=>a+b,0);
  T.require(tail*(n%2?-1:1)>0,'tail keeps its sign');
  return{a:sum,b:tail};
});
set('binomial-adjacent','recover-index-from-ratio','equation',(q,T)=>{
  const {k,a,rn,rd}=q.params;
  const hits=T.range(6,15).map(n=>[n,expansion(a,n)]).filter(([,p])=>p[k+1]*rd===p[k]*rn);
  T.require(hits.length===1,'exactly one exponent matches the coefficient ratio');
  return{a:hits[0][0],b:hits[0][1][k]};
});
set('binomial-product-cancellation','cancel-linear-read-quadratic','equation',(q,T)=>{
  const {n,a}=q.params,P=expansion(a,n),hits=T.range(-70,0).map(k=>[k,multiply(P,[1,k])]).filter(([,p])=>p[1]===0);
  T.require(hits.length===1&&hits[0][1][2]!==0,'unique linear cancellation and nonzero quadratic');
  return{a:hits[0][0],b:hits[0][1][2]};
});
set('proof-odd-square-gap','factor-and-divisibility','equation',(q,T)=>{
  const {j,m}=q.params, u=2*j+1,w=1-2*j,d=8*j, fn=n=>(2*n+u)**2-(2*n+w)**2;
  const x=multiply([u,2],[u,2]),y=multiply([w,2],[w,2]);
  T.require(x.every((c,i)=>(c-y[i])%d===0),'each coefficient of the difference polynomial divides by the claimed divisor');
  return{a:fn(m)};
});

set('mean-particle-count','sum-and-average-measurements','words',(q,T)=>{
  const {bits,ex,count}=q.params, vals=bits.map((b,i)=>Number(`${b}e${ex-i-1}`));
  T.require(vals.every(Number.isInteger)&&count>0,'positive integer readings and instrument count');
  const sum=vals.reduce((x,y)=>x+y,0);return{a:sum,b:sum/count};
});
set('bonus-bracket','step-pay-versus-cost','words',(q,T)=>{
  const {a,b,d,e,n}=q.params;let sumA=0,sumB=0,first=0,difference=0;
  for(let i=1;i<=100;i++){sumA+=a+(i-1)*e;sumB+=b+(i-1)*d;if(i===n)difference=sumB-sumA;if(!first&&sumA>sumB)first=i;}
  T.require(first>n&&first<=100&&difference>0,'unique change in ordering, after first comparison');
  return{a:difference,b:first};
});
set('sensor-calibration','ratio-from-separation-and-threshold','words',(q,T)=>{
  const {u,v,gap,target}=q.params, r=T.bisect(x=>times(u,x,gap)-v,0,1);
  const n=crossing(u,r,target);
  T.require(r>0&&r<1&&n>gap&&n<1000,'declining signal and finite target crossing');
  return{a:r,b:n};
});
set('accounts-alternate-frequencies','compare-one-annual-one-monthly','words',(q,T)=>{
  const {principal,n,apr,monthly}=q.params;
  let av=principal,bv=principal;
  for(let j=0;j<n;j++){av+=av*apr/100;for(let i=0;i<12;i++)bv+=bv*monthly/100/12;}
  T.require(Math.abs(av-bv)>.005,'different balances are distinguishable');
  return{a:toDp(bv,2),b:toDp(Math.abs(av-bv),2)};
});
set('nominal-backsolve','target-monthly-balance-to-apr','words',(q,T)=>{
  const {a,n,b}=q.params;
  const rate=T.bisect(x=>times(a,1+x/100/12,12*n)-b,0,40);
  T.require(rate>0&&rate<40,'nonnegative feasible monthly growth');
  return{a:toDp(1+rate/100/12,5),b:toDp(rate,2)};
});
set('real-purchasing','inflation-adjusted-balance','words',(q,T)=>{
  const {a,i,h,n}=q.params;let units=a;
  for(let j=0;j<n;j++)units=(units+units*i/100)/(1+h/100);
  T.require(units>0,'positive adjusted balance');
  return{a:toDp(units,2),b:toDp((units-a)/a*100,2)};
});
set('resale-fee','reverse-depreciation-and-percentage-fee','words',(q,T)=>{
  const {net,dep,fee,n}=q.params;
  const afterFee=x=>x-x*fee/100, sold=T.bisect(x=>afterFee(x)-net,net,2*net);
  const afterYears=x=>{for(let j=0;j<n;j++)x-=x*dep/100;return x;};
  const original=T.bisect(x=>afterFee(afterYears(x))-net,sold,20*sold);
  T.require(original>sold&&sold>net,'commission and depreciation both reduce price');
  return{a:toDp(sold,2),b:toDp(original,2)};
});
set('sound-log-combine','intensity-addition-then-log','words',(q,T)=>{
  const {a,b,k,j}=q.params,x=Number(`${a}e${k-1}`),y=Number(`${b}e${k-j-1}`);
  const dbFor=z=>T.bisect(l=>10**(l/10)-z,-30,100);
  const combined=dbFor(x+y),first=dbFor(x);
  T.require(combined>first&&x>0&&y>0,'positive intensity addition raises the level');
  return{a:toDp(combined,1),b:toDp(combined-first,2)};
});
set('mixed-exponential','quadratic-in-growth-factor','equation',(q,T)=>{
  const {a,b,c}=q.params;
  const x=T.bisect(x=>a**(2*x)+b*a**x-c,-25,25),y=a**x;
  T.require(y>0&&a>1,'monotonic exponential equation and positive substitution');
  return{a:toDp(y,4),b:x};
});
set('infinite-measurements','remaining-from-consecutive-partial-sums','equation',(q,T)=>{
  const {n,r,prev,cur}=q.params;
  let pos=cur-prev,sum=cur,next=0;
  for(let j=0;j<220;j++){pos*=r;if(j===0)next=pos;sum+=pos;}
  T.require(n>=4&&r>0&&r<1&&next>0,'positive next term and convergent tail');
  return{a:toDp(next,4),b:toDp(sum,2)};
});
export default v;
