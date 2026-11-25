/* Independent verifiers for the native question-bank check. */
const sum=xs=>xs.reduce((s,x)=>s+x,0);
const ap=(x,tol=1e-9)=>({value:x,tol});
export default {
"t1-w2-ratio-interval-endpoints/ratio-interval-endpoints/words":(q,T)=>{
const {A,B}=q.params;
const p=[-1,1].flatMap(i=>[-1,1].map(j=>(A+i)/(B+j)));
T.require(B>1,"all candidate denominators positive");
return {a:A-1,b:ap(Math.min(...p)),c:ap(Math.max(...p))};
},
"t1-w2-amortisation-statement-order/amortisation-statement-order/table":(q,T)=>{
const {B,pay,C,extra}=q.params;
const i=Array.from({length:100},(_,k)=>k).find(k=>B+k-pay===C);return {a:pay-i,b:i,c:B+i-(pay+extra)};
},
"t1-w2-validate-gdc-solutions-in-context/validate-gdc-solutions-in-context/table":(q,T)=>{
const {r,s,t,p}=q.params;
const candidates=Array.from({length:41},(_,i)=>i-20).filter(x=>x**2+(s-r)*x===r*s);
T.require(candidates.length===2,"two distinct exact candidate roots");const x=candidates.find(x=>x>=0),y=p*x+t;
return {a:candidates.find(x=>x<0),b:y,c:y-x};
},
"t1-w2-complex-quotient-axis-landing/complex-quotient-axis-landing/equation":(q,T)=>{
const {a,b,m,side,r}=q.params;
const p=m*Math.PI/6,qv=(m-3*side)*Math.PI/6,x=r*Math.cos(p),y=r*Math.sin(p),U=b*Math.cos(qv),V=b*Math.sin(qv);
const real=(x*U+y*V)/(b*b),imag=(y*U-x*V)/(b*b);
T.require(Math.abs(real)<1e-10,"quotient is purely imaginary");
return {a:Math.round(Math.hypot(real,imag)),b:Math.round(imag),c:Math.round(real)};
},
"t1-w2-partial-fractions-cancelled-pole/partial-fractions-cancelled-pole/equation":(q,T)=>{
const {a,b,p,d}=q.params;
const pairs=Array.from({length:p+1},(_,A)=>[A,p-A]).filter(([A,B])=>-(A*b+B*a)===d);
T.require(pairs.length===1&&p*b+d===0,"unique decomposition and a removable pole at b");
return {a:pairs[0][1],b:Array.from({length:23},(_,i)=>i).find(x=>(x-b)*(x-a)===0&&x!==a)};
},
"t1-w2-matrix-eigenline-check/matrix-eigenline-check/table":(q,T)=>{
const {a,b,vectors}=q.params;
const images=vectors.map(([x,y])=>[a*x+b*y,b*x+a*y]);
const k=images.findIndex(([x,y],i)=>x*vectors[i][1]===y*vectors[i][0]);
return {a:T.option("PQR"[k]),b:images[k][0]/vectors[k][0]};
},
"t1-w2-third-report-check/third-report-check/equation":(q,T)=>{
const {A,B,k,off}=q.params;
const implied=new Set(Array.from({length:35},(_,i)=>(A-i)*k+(k+1)*i+(B-i)));
T.require(implied.size===1&&implied.has(k*A+B+off)===(off===0),"third constant is consistent exactly when the report was not adjusted");
return {a:[...implied][0]};
},
"t1-w2-verify-broken-inverse/verify-broken-inverse/equation":(q,T)=>{
const {a,b,C,d}=q.params;
const det=a*d-b*C,scale=Math.abs(det),sign=Math.sign(det);
const x=Array.from({length:41},(_,i)=>i-20).find(k=>a*k+b*(-sign*C)===scale&&C*k+d*(-sign*C)===0);
T.require(det!==0,"matrix invertible");return {a:det,b:x};
},
"t1-w2-parity-condition-repair/parity-condition-repair/equation":(q,T)=>{
const {k,m}=q.params;
T.require(Array.from({length:121},(_,i)=>i-60).every(n=>(m*(n+k)%(2*m)===0)===((n-k)%2===0)),"parity repair holds across positive and negative test integers");
return {a:Array(k+1+k).fill(m).reduce((s,x)=>s+x,0)};
},
"t1-w2-exclude-periodic-subsequence/exclude-periodic-subsequence/equation":(q,T)=>{
const {a,c,pick}=q.params;const all=Array.from({length:120},(_,n)=>a/c**n),yes=all.filter((_,i)=>(i+1-pick)%3===0),no=all.filter((_,i)=>(i+1-pick)%3!==0);
return {a:ap(yes[0]),b:ap(yes[1]/yes[0]),c:ap(sum(yes)),d:ap(sum(no))};
},
"t1-w2-recurrence-invariant-induction/recurrence-invariant-induction/equation":(q,T)=>{
const {d,r,v}=q.params;const step=x=>r*x+v*(r-1), a=d-v,b=step(a),c=step(b);
const offset=Array.from({length:d},(_,i)=>i).find(i=>(a+i)%d===0);
let u=BigInt(a);for(let i=0;i<22;i++){T.require((u+BigInt(offset))%BigInt(d)===0n,"invariant holds in exact recurrence");u=BigInt(r)*u+BigInt(v*(r-1));}
return {a:b,b:c,c:offset};
},
"t1-w2-linear-factor-prerequisite/linear-factor-prerequisite/equation":(q,T)=>{
const {a,b}=q.params;return {a:Array.from({length:31},(_,i)=>i-15).find(x=>a*x+b===0)};
},
"t1-w2-log-ratio-compare/log-ratio-compare/equation":(q,T)=>{
const {b,k,s}=q.params;
return {a:Math.round(Math.log(s)/Math.log(b)-Math.log(k)/Math.log(b))};
},
};
