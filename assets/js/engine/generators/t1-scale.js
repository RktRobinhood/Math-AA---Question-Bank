/* Original Topic 1 extension. Level 3 is exact by hand; Level 4 uses numeric technology. */
(function(root){
"use strict";
const E=root.QBEngine,{fmt:f,ans:A}=E;
const {num,frac,sf,dp,paren,br,rat,lin}=f;
const M=s=>'$'+s+'$';
const P=(prompt,marks,answer,...working)=>({prompt,marks,answer,working});
const D=(n,d)=>rat.Q(n,d);
const tex=x=>rat.tex(x);
const ar=(x)=>A.frac(x.n,x.d);
const power=(x,n)=>br(x)+'^{'+n+'}';
const log=(b,s)=>'\\log_{'+b+'}\\left('+s+'\\right)';
const euro=x=>M(num(x)+'\\text{ euros}');
const sci=(a,e)=>num(a)+'\\times 10^{'+e+'}';
const scale=(v)=>{const e=Math.floor(Math.log10(v)+1e-10);return [Number((v/10**e).toPrecision(13)),e]};
const std=v=>{const[a,e]=scale(v);return sci(a,e)};
const stdsf=v=>{const[a,e]=scale(Number(v.toPrecision(3)));return sf(a)+'\\times 10^{'+e+'}';};
const closest=(v,d)=>Number(v.toFixed(d));
const reg=(name,unknown,syllabus,skills,level,rep,title,build,niceOk=false)=>E.register({
  type:'t1-scale-'+name,unknown,representation:rep,format:'value',syllabus:[syllabus],
  skills:skills.map(s=>'SL'+syllabus+'.'+s),levels:[level],calculator:level===4,
  title,niceOk,build
});

reg('signal-difference','normalise-after-subtraction','1.1',['add-subtract','multiply-divide','convert'],3,'equation','Subtract and divide signals in standard form',({rng})=>{
  const a=rng.int(2,9),b=rng.int(1,9),c=rng.pick([2,4,5,8]),p=rng.int(3,8),q=rng.int(-5,-1);
  const d=D(10*a-b,10), z=D(10*a-b,10*c), m=[rat.num(z),p-q],sc=m[0]<1?[10*m[0],m[1]-1]:m;
  return{params:{a,b,c,p,q},stem:`Let $D=${sci(a,p)}-${sci(b,p-1)}$ and $R=\\dfrac{D}{${sci(c,q)}}$.`,parts:[
    P('Find $D$, giving your answer in standard form.',3,A.exact((10*a-b)*10**(p-1),sci(rat.num(d),p)),
      M(`D=\\left(${a}-${num(b/10)}\\right)\\times 10^{${p}}`),M(`D=${sci(rat.num(d),p)}`)),
    P('Find $R$, giving your answer in standard form.',3,A.exact(sc[0]*10**sc[1],sci(...sc)),
      M(`R=${tex(z)}\\times 10^{${p-q}}`),M(`R=${sci(...sc)}`))]};
});
reg('square-footprint','root-and-rescale','1.1',['powers-roots','multiply-divide','context'],3,'words','Recover a length from a standard-form area',({rng})=>{
  const a=rng.int(4,9),k=rng.int(4,12),copies=rng.int(3,9);
  return{params:{a,k,copies},stem:`A square patch has area $${sci(a*a/10,2*k+1)}\\text{ cm}^{2}$.`,parts:[
    P('Find the side length in centimetres, in standard form.',3,A.exact(a*10**k,sci(a,k)),
      M(`A=${a*a}\\times 10^{${2*k}}`),M(`\\sqrt{A}=${sci(a,k)}`)),
    P(`Find the length in metres of $${copies}$ patches placed side by side in a straight line. Give your answer in standard form.`,3,
      A.exact(a*copies*10**(k-2),std(a*copies*10**(k-2))),M(`L=${copies}\\times ${sci(a,k)}\\times 10^{-2}\\text{ m}`),
      M(`L=${std(a*copies*10**(k-2))}\\text{ m}`))]};
});
reg('arithmetic-blocks','reconstruct-from-two-blocks','1.2',['find-u1-d','sum'],3,'equation','Recover arithmetic terms from two block sums',({rng})=>{
  const d=rng.pick([-8,-7,-6,-5,-4,-3,-2,-1,1,2,3,4,5,6,7,8]),first=rng.int(5,25),len=rng.int(3,8),gap=rng.int(2,5),h=gap*len+1;
  const A0=len*first+d*len*(len-1)/2,A1=A0+len*(h-1)*d;
  return{params:{len,h,A0,A1},stem:`In an arithmetic sequence, the sum from $u_{1}$ to $u_{${len}}$ is $${num(A0)}$. The sum from $u_{${h}}$ to $u_{${h+len-1}}$ is $${num(A1)}$.`,parts:[
    P('Find the common difference.',3,A.int(d),`Matching terms in the two blocks differ by $${h-1}d$.`,
      M(`(${num(A1)})-(${num(A0)})=${len}\\times ${h-1}d`),M(`d=${d}`)),
    P('Find the first term.',3,A.int(first),M(`${num(A0)}=${len}u_{1}+${len*(len-1)/2}\\times ${paren(d)}`),M(`u_{1}=${first}`))]};
});
reg('arithmetic-mean','partial-backsolve','1.2',['sum','find-u1-d','find-n'],3,'words','Find an omitted partial sum of an arithmetic sequence',({rng})=>{
  const d=rng.int(2,9),a=rng.int(5,18),k=rng.int(4,12),len=rng.int(3,8),tail=k+len-1;
  const x=a+(k-1)*d,y=a+(tail-1)*d,sum=(k-1)*(a+x-d)/2;
  return{params:{x,y,k,len},stem:`In an arithmetic sequence $u_{${k}}=${num(x)}$ and $u_{${tail}}=${num(y)}$.`,parts:[
    P('Find the first term.',3,A.int(a),M(`d=\\dfrac{${y-x}}{${len-1}}=${d}`),M(`u_{1}=${x}-${k-1}\\times ${d}=${a}`)),
    P(`Find the sum of the first $${k-1}$ terms.`,3,A.int(sum),M(`u_{${k-1}}=${x}-${d}=${x-d}`),M(`S_{${k-1}}=\\dfrac{${k-1}}{2}\\left(${a}+${x-d}\\right)=${sum}`))]};
});
reg('alternating-geometric','negative-ratio-from-odd-gap','1.3',['find-r-u1','sum'],3,'equation','Recover a negative geometric ratio across an odd gap',({rng})=>{
  const r=-rng.int(2,4),a=rng.int(3,14),j=rng.int(1,3),k=j+3,u=a*r**(j-1),v=a*r**(k-1),s=a*(1+r+r*r);
  return{params:{j,k,u,v},stem:`A geometric sequence has $u_{${j}}=${num(u)}$ and $u_{${k}}=${num(v)}$.`,parts:[
    P('Find the common ratio.',3,A.int(r),M(`r^{3}=\\dfrac{${num(v)}}{${num(u)}}=${r**3}`),M(`r=${r}`)),
    P('Find the sum of the first three terms.',3,A.int(s),M(`u_{1}=\\dfrac{${num(u)}}{${j===2?paren(r):power(r,j-1)}}=${a}`),
      M(`S_{3}=${a}+${paren(a*r)}+${a*r*r}=${s}`))]};
});
reg('geometric-sums-to-terms','recover-from-three-partial-totals','1.3',['find-r-u1','sum','nth-term'],3,'equation','Extract geometric terms from three partial totals',({rng})=>{
  const q=rng.pick([2,3,4]),a=q*q*q*rng.int(1,12),r=D(1,q),s1=a,s2=a+a/q,s3=s2+a/(q*q),u4=a/(q*q*q);
  return{params:{s1,s2,s3},stem:`For a geometric sequence, $S_{1}=${num(s1)}$, $S_{2}=${num(s2)}$, and $S_{3}=${num(s3)}$.`,parts:[
    P('Find the common ratio.',3,ar(r),M(`u_{2}=${s2}-${s1}=${a/q}`),M(`u_{3}=${s3}-${s2}=${a/(q*q)}`),M(`r=\\dfrac{${a/(q*q)}}{${a/q}}=${tex(r)}`)),
    P('Find $S_{4}$.',3,A.int(s3+u4),M(`u_{4}=u_{3}r=${u4}`),M(`S_{4}=${s3}+${u4}=${s3+u4}`))]};
});
reg('indices-nested-powers','solve-and-verify-power','1.5',['integer-exponent-laws','zero-negative','exp-log-form'],3,'equation','Solve an index equation with a reciprocal',({rng})=>{
  const b=rng.int(2,5),h=rng.int(2,5),w=rng.int(-4,4),k=rng.int(2,5),offset=k*w+h,p=rng.int(2,4);
  return{params:{b,h,k,offset,p},stem:`Consider $\\dfrac{b^{${lin(k,-offset)}}}{b^{-${h}}}=1$ with $b=${b}$.`,parts:[
    P('Find the value of $x$.',4,A.int(w),M(`b^{${lin(k,-offset)}+${h}}=1=b^{0}`),M(`${lin(k,-offset+h)}=0`),M(`x=${w}`)),
    P(`Evaluate $\\log_{b}\\left(\\dfrac{1}{b^{${p}}}\\right)$.`,2,A.int(-p),M(`\\dfrac{1}{b^{${p}}}=b^{-${p}}`),M(`\\log_{b}(b^{-${p}})=-${p}`))]};
});
reg('log-reject-root','product-log-domain','1.7',['log-laws','log-equations','common-base'],3,'equation','Solve a log equation and reject the inadmissible root',({rng})=>{
  const [t,b,h]=rng.pick([[3,4,5],[4,3,5],[5,12,13],[12,5,13],[8,15,17],[15,8,17],[7,24,25],[24,7,25]]);
  const s=rng.int(1,5),a=t*s,y=b*s,x=h*s;
  return{params:{a,y},stem:`Consider $${log(y,lin(1,-a))}+${log(y,lin(1,a))}=2$.`,parts:[
    P('The equation is defined for $x>k$. Find $k$.',2,A.int(a),
      M(`x-${a}>0\\quad\\text{and}\\quad x+${a}>0`),M(`x>${a}`)),
    P('Solve the equation.',4,A.int(x),M(`(x-${a})(x+${a})=${y}^{2}`),
      M(`x^{2}=${num(y*y)}+${num(a*a)}=${num(x*x)}`),M(`x=\\pm ${x}`),`Only $${x}$ satisfies $x>${a}$.`)]};
});
reg('rational-exponent-ratio','two-powers-same-root','1.7',['rational-exponents'],3,'equation','Reconcile a reciprocal power with a rational power',({rng})=>{
  const a=rng.int(2,7),q=rng.pick([2,3]),p=rng.pick(q===2?[3,5]:[2,4]),base=a**q,value=a**p;
  return{params:{q,p,value},stem:`Let $x>0$. Given $x^{${frac(p,q)}}=${num(value)}$:`,parts:[
    P(`Find $x^{${frac(1,q)}}$ and hence find $x$. Enter the value of $x$.`,4,A.int(base),
      M(`\\left(x^{${frac(1,q)}}\\right)^{${p}}=${num(value)}=${a}^{${p}}`),M(`x^{${frac(1,q)}}=${a}`),M(`x=${a}^{${q}}=${base}`)),
    P(`Find $x^{${frac(-1,q)}}$.`,2,A.frac(1,a),M(`x^{${frac(-1,q)}}=\\dfrac{1}{${a}}=${frac(1,a)}`))]};
});
reg('repeating-tail','fraction-with-leading-nonrepeat','1.8',['applications','sum-to-infinity'],3,'equation','Convert a two-digit repeating tail into an exact fraction',({rng})=>{
  const lead=rng.int(1,8),pair=rng.int(13,96),tail=D(pair,990),whole=D(99*lead+pair,990);
  return{params:{lead,pair},stem:`The decimal $x=0.${lead}\\overline{${pair}}$ has a single non-repeating digit followed by a repeating two-digit block.`,parts:[
    P('Find the exact sum of the repeating tail, excluding the non-repeating digit after the decimal point.',3,ar(tail),
      M(`u_{1}=${frac(pair,1000)},\\quad r=${frac(1,100)}`),M(`S_{\\infty}=\\dfrac{${num(pair/1000)}}{0.99}=${tex(tail)}`)),
    P('Express $x$ as a reduced fraction.',3,ar(whole),M(`x=${frac(lead,10)}+${tex(tail)}`),M(`x=${tex(whole)}`))]};
});
reg('alternating-tail','convergent-tail-with-sign','1.8',['convergence','sn-vs-sinf','sum-to-infinity'],3,'equation','Find a signed remainder in an alternating geometric series',({rng})=>{
  const q=rng.int(2,6),a=rng.int(2,11)*q,n=rng.int(2,5),z=D(a*q,q+1),left=D(a*(-1)**n,(q+1)*q**(n-1));
  return{params:{q,a,n},stem:`An infinite geometric series starts with $u_{1}=${a}$ and has ratio $r=${frac(-1,q)}$.`,parts:[
    P('Find the sum to infinity.',3,ar(z),`Since $|r|=${frac(1,q)}<1$, the series converges.`,M(`S_{\\infty}=${a}\\times ${frac(q,q+1)}=${tex(z)}`)),
    P(`Find the exact signed remainder $S_{\\infty}-S_{${n}}$.`,3,ar(left),
      M(`S_{\\infty}-S_{${n}}=S_{\\infty}r^{${n}}`),M(`S_{\\infty}-S_{${n}}=${tex(left)}`))]};
});
reg('binomial-adjacent','recover-index-from-ratio','1.9',['find-unknown','specific-term'],3,'equation','Recover a binomial index from adjacent coefficient ratios',({rng})=>{
  const n=rng.int(6,15),k=rng.int(1,4),a=rng.int(2,9);
  const rat0=D(a*(n-k),k+1);
  const coef=Array.from({length:k},(_,j)=>(n-j)/(j+1)).reduce((x,y)=>x*y,1);
  return{params:{k,a,rn:rat0.n,rd:rat0.d},stem:`In $(1+${a}x)^{n}$, the ratio of the coefficient of $x^{${k+1}}$ to that of $${k===1?'x':'x^{'+k+'}'}$ is $${tex(rat0)}$.`,parts:[
    P('Find $n$.',4,A.int(n),M(`\\dfrac{\\dbinom{n}{${k+1}}${a}^{${k+1}}}{\\dbinom{n}{${k}}${k===1?a:a+"^{"+k+"}"}}=\\dfrac{${a}(n-${k})}{${k+1}}`),
      M(`\\dfrac{${a}(n-${k})}{${k+1}}=${tex(rat0)}`),M(`n=${n}`)),
    P(`Find the coefficient of $${k===1?'x':'x^{'+k+'}'}$.`,2,A.int(Math.round(coef)*a**k),
      M(`\\dbinom{${n}}{${k}}\\times ${k===1?a:a+"^{"+k+"}"}=${num(Math.round(coef)*a**k)}`))]};
});
reg('binomial-product-cancellation','cancel-linear-read-quadratic','1.9',['product-expansion','specific-term','find-unknown'],3,'equation','Cancel a product’s linear term and find its quadratic coefficient',({rng})=>{
  const n=rng.int(3,9),a=rng.int(2,7),k=-n*a,q=-n*(n+1)*a*a/2;
  return{params:{n,a},stem:`Consider $(1+${a}x)^{${n}}(1+kx)$, where the coefficient of $x$ is zero.`,parts:[
    P('Find $k$.',3,A.int(k),M(`${n*a}+k=0`),M(`k=${k}`)),
    P('Find the coefficient of $x^{2}$.',3,A.int(q),M(`\\dbinom{${n}}{2}\\times ${a}^{2}+(${n*a})${paren(k)}`),M(`\\text{Coefficient}=${q}`))]};
});
reg('proof-odd-square-gap','factor-and-divisibility','1.6',['integer-proof','identity-lhs-rhs'],3,'equation','Use an identity to prove divisibility of a gap of squares',({rng})=>{
  const j=rng.int(1,8),m=rng.int(-8,12),a=2*j+1,b=2*j-1,c=16*j;
  return{params:{j,m},stem:`For an integer $n$, define $D(n)=(${lin(2,a)})^{2}-(${lin(2,-b)})^{2}$.`,parts:[
    P(`Find $D(${m})$.`,2,A.int(c*m+8*j),
      M(`D(${m})=(${2*m+a})^{2}-(${2*m-b})^{2}=${num(c*m+8*j)}`)),
    P(`Prove that $D(n)$ is divisible by $${8*j}$ for every integer $n$.`,4,A.self(`$D(n)=${8*j}(2n+1)$, an integer multiple of $${8*j}$.`),
      M(`D(n)=\\left((2n+${a})-(2n-${b})\\right)\\left((2n+${a})+(2n-${b})\\right)`),
      M(`D(n)=${4*j}(4n+2)=${8*j}(2n+1)`),`Because $2n+1$ is an integer, $D(n)$ is divisible by $${8*j}$.`)]};
});

reg('mean-particle-count','sum-and-average-measurements','1.1',['add-subtract','multiply-divide','context'],4,'words','Combine measurements with different powers of ten',({rng})=>{
  const bits=[rng.int(16,91),rng.int(11,49),rng.int(24,87)],ex=rng.int(5,10),count=rng.int(4,12);
  const readings=bits.map((v,i)=>v/10*10**(ex-i));
  const total=readings.reduce((a,b)=>a+b,0), per=total/count;
  return{params:{bits,ex,count},stem:`Three labs report $${std(readings[0])}$, $${std(readings[1])}$, and $${std(readings[2])}$ events with no overlap. Across all three labs, $${count}$ instruments were used.`,parts:[
    P('Find the pooled number of events, in standard form to three significant figures.',3,A.sf(total,3,{display:M(stdsf(total))}),
      M(`T=\\left(${num(bits[0]/10)}+${num(bits[1]/100)}+${num(bits[2]/1000)}\\right)\\times 10^{${ex}}`),
      `Round the total to obtain $${stdsf(total)}$.`),
    P('Find the mean number of events per instrument, in standard form to three significant figures.',3,A.sf(per,3,{display:M(stdsf(per))}),
      M(`\\text{Mean}=\\dfrac{T}{${count}}`),`Use the unrounded total. The mean is $${stdsf(per)}$.`)]};
});
reg('bonus-bracket','step-pay-versus-cost','1.2',['sum','model','find-n'],4,'words','Compare the crossover of two increasing pay schedules',({rng})=>{
  const a=rng.int(30,72),d=rng.int(5,17),step=rng.int(2,9),k=rng.int(18,35),n=rng.int(7,13);
  const b=a+Math.floor((k-1.5)*step/2),e=d+step;
  const p=(first,rise,m)=>m*(2*first+(m-1)*rise)/2;
  const SA=(m)=>p(a,e,m),SB=(m)=>p(b,d,m),difference=(m)=>SA(m)-SB(m);
  const at=Math.floor(1+2*(b-a)/step)+1;
  return{params:{a,b,d,e,n},stem:`Plan A pays ${euro(a)} in the first week and increases the weekly amount by ${euro(e)} each week. Plan B pays ${euro(b)} in the first week and increases the weekly amount by ${euro(d)} each week.`,parts:[
    P(`Find how much more Plan B pays in total over the first $${n}$ weeks.`,2,A.int(-difference(n)),
      M(`S_{\\mathrm{B}}-S_{\\mathrm{A}}=${num(SB(n))}-${num(SA(n))}=${num(-difference(n))}\\text{ euros}`)),
    P('Find the first whole week when Plan A has paid strictly more in total than Plan B.',4,A.int(at),
      M(`S_{\\mathrm{A}}=\\dfrac{n}{2}(${2*a}+(n-1)\\times ${e}),\\qquad S_{\\mathrm{B}}=\\dfrac{n}{2}(${2*b}+(n-1)\\times ${d})`),
      `Compare the totals in a numerical table, keeping the strict inequality.`,
      M(`S_{\\mathrm{A}}-S_{\\mathrm{B}}=${num(difference(at-1))}\\text{ in week }${at-1}`),
      M(`S_{\\mathrm{A}}-S_{\\mathrm{B}}=${num(difference(at))}\\text{ in week }${at}`))]};
},true);
reg('sensor-calibration','ratio-from-separation-and-threshold','1.3',['find-r-u1','find-n','model'],4,'words','Infer a decay factor from sensor measurements and find a threshold time',({rng})=>{
  const u=rng.int(230,580),v=rng.int(55,120),gap=rng.int(3,7),target=rng.int(11,33),r=(v/u)**(1/gap);
  let at=Math.max(gap,Math.floor(Math.log(target/u)/Math.log(r)));
  // Exact integer comparison after taking the gap-th power; equality does not pass.
  const below=t=>BigInt(v)**BigInt(t)<BigInt(target)**BigInt(gap)*BigInt(u)**BigInt(t-gap);
  while(at<100&&!below(at))at++;
  if(at===100)throw new RangeError("The selected signal does not cross within the bounded search.");
  return{params:{u,v,gap,target},stem:`A signal follows $S(t)=Ar^{t}$, where $t$ is time in minutes. The recorded values are $S(0)=${u}$ and $S(${gap})=${v}$.`,parts:[
    P('Find the decay factor $r$, to three significant figures.',3,A.sf(r),M(`r^{${gap}}=\\dfrac{${v}}{${u}}`),M(`r=\\left(\\dfrac{${v}}{${u}}\\right)^{\\frac{1}{${gap}}}\\approx ${sf(r)}`)),
    P(`Find the first whole minute when the signal is strictly below $${target}$.`,3,A.int(at),
      `Solve $${u}r^{t}=${target}$ numerically with the unrounded value of $r$.`,
      M(`S(${at-1})\\ge ${target},\\qquad S(${at})<${target}\\text{ (using unrounded values)}`),
      `The first qualifying time is $${at}\\text{ min}$.`)]};
});
reg('accounts-alternate-frequencies','compare-one-annual-one-monthly','1.4',['compare-options','future-value'],4,'words','Compare annual and monthly compounding over the same period',({rng})=>{
  const principal=rng.int(30,215)*100,n=rng.int(3,13),apr=rng.int(19,71)/10, monthly=apr-rng.pick([0,0.1,0.2,0.3,0.4]),arate=1+apr/100,mrate=1+monthly/1200;
  const a=principal*arate**n,b=principal*mrate**(12*n),difference=Math.abs(a-b);
  return{params:{principal,n,apr,monthly},stem:`A deposit of ${euro(principal)} stays invested for $${n}$ years. Account A pays a nominal annual rate of $${f.pct(apr)}$ compounded annually. Account B pays a nominal annual rate of $${f.pct(monthly)}$ compounded monthly.`,parts:[
    P('Find the balance in Account B, to the nearest cent.',3,A.dp(closest(b,2),2),
      M(`B=${num(principal)}\\left(1+\\dfrac{${num(monthly)}}{1200}\\right)^{${12*n}}`),
      M(`B\\approx ${dp(b,2)}\\text{ euros}`)),
    P('Find the absolute difference in the balances, to the nearest cent. State which account has the higher balance.',3,A.dp(closest(difference,2),2),
      M(`A=${num(principal)}\\left(1+\\dfrac{${num(apr)}}{100}\\right)^{${n}}\\approx ${dp(a,2)}\\text{ euros}`),
      `Using the unrounded balances, the difference is $${dp(difference,2)}\\text{ euros}$. Account ${a>b?'A':'B'} has the higher balance.`)]};
});
reg('nominal-backsolve','target-monthly-balance-to-apr','1.4',['find-rate-or-pv','future-value'],4,'words','Recover a nominal annual rate from a target balance',({rng})=>{
  const a=rng.int(30,170)*100,n=rng.int(4,12),b=a+rng.int(15,62)*100,m=(b/a)**(1/(12*n)),pct=1200*(m-1);
  return{params:{a,n,b},stem:`A deposit of ${euro(a)} grows to ${euro(b)} after $${n}$ years with monthly compounding and no transactions.`,parts:[
    P('Find the monthly growth multiplier to five decimal places.',3,A.dp(closest(m,5),5),
      M(`m^{${12*n}}=\\dfrac{${num(b)}}{${num(a)}}`),M(`m\\approx ${dp(m,5)}`)),
    P('Find the nominal annual percentage rate to two decimal places.',3,A.dp(closest(pct,2),2),
      M(`r=1200(m-1)`),`Use the unrounded multiplier: $r\\approx ${dp(pct,2)}\\%$.`)]};
});
reg('real-purchasing','inflation-adjusted-balance','1.4',['real-value','future-value','compare-options'],4,'words','Separate nominal interest from real purchasing power',({rng})=>{
  const a=rng.int(28,185)*100,i=rng.int(26,72)/10,h=rng.int(13,44)/10,n=rng.int(4,16);
  const z=a*(1+i/100)**n,real=z/(1+h/100)**n,change=(real/a-1)*100;
  return{params:{a,i,h,n},stem:`A saver invests ${euro(a)} at $${f.pct(i)}$ annual interest. Prices increase by $${f.pct(h)}$ each year. Both rates stay fixed for $${n}$ years.`,parts:[
    P('Find the final balance measured in today’s euros. Round to the nearest cent.',3,A.dp(closest(real,2),2),
      M(`R=\\dfrac{${num(a)}(1+${num(i/100)})^{${n}}}{(1+${num(h/100)})^{${n}}}`),
      M(`R\\approx ${dp(real,2)}\\text{ euros}`)),
    P('Find the signed percentage change in purchasing power, to two decimal places.',3,A.dp(closest(change,2),2),
      M(`100\\left(\\dfrac{R}{${num(a)}}-1\\right)\\approx ${dp(change,2)}`))]};
});
reg('resale-fee','reverse-depreciation-and-percentage-fee','1.4',['depreciation','find-rate-or-pv'],4,'words','Reverse depreciation and a resale commission',({rng})=>{
  const net=rng.int(19,89)*50,dep=rng.int(75,235)/10,fee=rng.int(45,145)/10,n=rng.int(3,8);
  const sale=net/(1-fee/100),buy=sale/(1-dep/100)**n;
  return{params:{net,dep,fee,n},stem:`A studio sells equipment after $${n}$ years. Its resale value falls by $${f.pct(dep)}$ each year compared with the previous year. The broker keeps $${f.pct(fee)}$ of the resale price, leaving the studio with ${euro(net)}.`,parts:[
    P('Find the resale price before commission, to the nearest cent.',3,A.dp(closest(sale,2),2),
      M(`S(1-${num(fee/100)})=${num(net)}`),M(`S\\approx ${dp(sale,2)}\\text{ euros}`)),
    P('Find the original price, to the nearest cent.',3,A.dp(closest(buy,2),2),
      M(`P\\times (1-${num(dep/100)})^{${n}}=S`),`Use the unrounded resale price to get $P\\approx ${dp(buy,2)}\\text{ euros}$.`)]};
});
reg('sound-log-combine','intensity-addition-then-log','1.5',['log-context','evaluate-tech','exp-log-form'],4,'words','Combine intensities before applying a logarithmic scale',({rng})=>{
  const a=rng.int(14,87),b=rng.int(22,96),k=rng.int(4,7),j=rng.int(1,2),x=a*10**(k-1),y=b*10**(k-j-1);
  const sound=10*Math.log10(x+y),change=10*Math.log10(1+y/x);
  return{params:{a,b,k,j},stem:`On a sound scale, the level corresponding to intensity ratio $R$ is $L=10\\log_{10}R$. Two independent sources have intensity ratios $${std(x)}$ and $${std(y)}$.`,parts:[
    P('Find the combined level, to one decimal place. The intensity ratios add.',3,A.dp(closest(sound,1),1),
      M(`L=10\\log_{10}\\left(${std(x)}+${std(y)}\\right)\\approx ${dp(sound,1)}`)),
    P('By how much does the level increase when the second source is added to the first? Give your answer to two decimal places.',3,A.dp(closest(change,2),2),
      M(`\\Delta L=10\\log_{10}\\left(\\dfrac{${num(x+y)}}{${num(x)}}\\right)\\approx ${dp(change,2)}`))]};
});
reg('mixed-exponential','quadratic-in-growth-factor','1.7',['hidden-quadratic','solve-with-logs'],4,'equation','Solve a shifted exponential quadratic and round at the end',({rng})=>{
  const a=rng.int(13,32)/10,b=rng.int(5,17),c=rng.int(19,51);
  let low=0,high=25;for(let k=0;k<90;k++){const mid=(low+high)/2;if(mid*mid+b*mid<c)low=mid;else high=mid;}
  const y=(low+high)/2,x=Math.log(y)/Math.log(a);
  return{params:{a,b,c},stem:`Consider $${num(a)}^{2x}+${b}\\times ${num(a)}^{x}=${c}$.`,parts:[
    P(`Let $y=${num(a)}^{x}$. Find the admissible value of $y$ to four decimal places.`,3,A.dp(closest(y,4),4),
      M(`y^{2}+${b}y-${c}=0,\\qquad y>0`),`Use a numerical solver or the quadratic formula. The positive root is $y\\approx ${dp(y,4)}$.`),
    P('Find $x$ to three significant figures.',3,A.sf(x),M(`x=\\dfrac{\\ln y}{\\ln(${num(a)})}\\approx ${sf(x)}`),`Use the unrounded value of $y$.`)]};
});
reg('infinite-measurements','remaining-from-consecutive-partial-sums','1.8',['sn-vs-sinf','find-unknown','sum-to-infinity'],4,'equation','Recover an infinite sum from two measured partial sums',({rng})=>{
  const n=rng.int(4,9),r=rng.int(38,83)/100,a=rng.int(60,150)/10;
  const raw=(m)=>a*(1-r**m)/(1-r),prev=closest(raw(n),4),cur=closest(raw(n+1),4);
  const next=(cur-prev)*r,limit=cur+next/(1-r);
  return{params:{n,r,prev,cur},stem:`A geometric series has ratio $r=${num(r)}$. Two measured partial sums are $S_{${n}}=${dp(prev,4)}$ and $S_{${n+1}}=${dp(cur,4)}$.`,parts:[
    P(`Use the measured values to estimate $u_{${n+2}}$ to four decimal places.`,3,A.dp(closest(next,4),4),
      M(`u_{${n+1}}=S_{${n+1}}-S_{${n}}`),M(`u_{${n+2}}=r(S_{${n+1}}-S_{${n}})\\approx ${dp(next,4)}`)),
    P('Estimate the sum to infinity to two decimal places.',3,A.dp(closest(limit,2),2),
      M(`S_{\\infty}=S_{${n+1}}+\\dfrac{u_{${n+2}}}{1-r}`),
      `Use the unrounded next term to obtain $S_{\\infty}\\approx ${dp(limit,2)}$.`)]};
});
})(typeof window==='undefined'?globalThis:window);
