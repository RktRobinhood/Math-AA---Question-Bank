/* Wave 4: original Numbers and Algebra families, with bounded parameters. */
(function(root){
"use strict";
const {ans:A,fmt:F,register}=root.QBEngine;
const T=String.raw,M=x=>"$"+x+"$",N=F.num,R=F.frac,I=A.int,S=x=>A.sf(x,3),P=(prompt,marks,answer,...working)=>({prompt,marks,answer,working});
const Q=(params,stem,...parts)=>({params,stem,parts}), O=(text,value,why)=>({text,value,why}), C=(r,y,...n)=>A.choice(r,y,n);
const AA="aa-sl",AI="ai-sl";
const exp=(a,b)=>T`${a}\times10^{${b}}`;
function add(id,home,code,ids,level,rep,title,build,extra={}){
 const type="w4-t1-"+id;
 register({type,title,home,syllabus:[code],skills:ids.split(" "),levels:[level],calculator:level>=4,representation:rep,unknown:"reasoning",format:"value",build,...extra});
}
add("place-value-repair",AA,"1.1","SL1.1.convert",0,"equation","Repair a decimal move while keeping the same value",({rng:r})=>{
 const a=r.int(11,95),e=r.pick([-8,-7,-6,-5,-4,-3,-2,-1,2,3,4,5,6,7,8]),c=Number((a/10).toFixed(1));
 return Q({a,e},T`The expression $${exp(a,e)}$ is not in standard form because its first factor is too large.`,
  P(T`Write $${exp(a,e)}=${exp(c,"k")}$. Find $k$.`,1,I(e+1),T`Moving the decimal point one place left divides the first factor by ten. Increase the exponent by one to multiply the second factor by ten. This keeps the value unchanged.`));
});
add("load-minimum",AA,"1.1","SL1.1.context SL1.1.add-subtract SL1.1.multiply-divide",2,"words","Combine unequal scientific scales and round a load count up",({rng:r})=>{
 const e=r.int(3,5),a=r.int(15,49),b=r.int(2,8),m=r.int(4,9),sum=a+b, n=Math.ceil(sum/m);
 return Q({e,a,b,m},T`A seed bank has two containers holding $${exp(a/10,e+1)}$ and $${exp(b,e)}$ grains respectively. A sealed bag can hold at most $${exp(m,e)}$ grains. Both containers must be emptied, and a last bag can be partly full.`,
  P(T`The total is $K\times10^{${e}}$. Find $K$.`,2,I(sum),T`Rewrite the first amount as $${exp(a,e)}$. Add the coefficients now that the powers of ten agree.`),
  P("Find the least number of bags needed.",2,I(n),T`Each bag holds $${m}$ groups of $10^{${e}}$. Divide the total number of groups by $${m}$ and take the next whole number if a partial bag is needed.`));
});
add("remaining-value-rate",AA,"1.4","SL1.4.depreciation",1,"words","Read loss rather than retained value from a depreciation table",({rng:r})=>{
 const r0=r.int(11,47),a=r.int(6,38),v=100*a,w=(100-r0)*a;
 const q=Q({a,r0,v,w},"An old press loses the same percentage of its value each year. The first two valuations are listed below.",
  P("Find the percentage depreciation in the first year.",2,I(r0),T`The loss is $${v-w}$. Divide it by the initial value $${v}$ and multiply by one hundred to get $${r0}\%$.`));
 q.table={head:["At purchase (€)","One year later (€)"],rows:[[M(v),M(w)]]};
 return q;
});
add("divisibility-condition",AA,"1.6","SL1.6.conditional-proof SL1.6.integer-proof",1,"equation","Deduce parity from a divisibility condition",({rng:r})=>{
 const m=r.int(2,14),n=r.int(1,18),b=r.pick([1,3,5,7,9,11]);
 const q=Q({m,n,b},T`Let $x$ and $y$ be integers. It is known that $${4*m}x+${2*b}y+${4*n}$ is divisible by four.`,
  P("Which statement about $y$ must be true?",2,C(r,O("It is even.","even"),O("It is odd.","odd"),O("It is a multiple of four.","four")),T`The first and last terms are already multiples of four; so $${2*b}y$ is a multiple of four. Then $${b===1?"":b}y$ is even. The coefficient $${b}$ is odd, so $y$ must be even, not necessarily a multiple of four.`));
 return q;
});
add("pascal-mirror-position",AA,"1.9","SL1.9.ncr-pascal SL1.9.specific-term",1,"equation","Locate the other coefficient at the mirror position",({rng:r})=>{
 const n=r.int(7,21),k=r.int(1,Math.floor((n-1)/2)),j=n-k;
 return Q({n,k},T`In the expansion of $(1+x)^{${n}}$, the coefficient of $${k===1?"x":"x^{"+k+"}"}$ appears at exactly one other power of $x$.`,
  P("Give the exponent of that other power.",2,I(j),T`Choosing $${k}$ of the $${n}$ factors to contribute $x$ is equivalent to choosing which $${k}$ factors are left out at the complementary position. The symmetric coefficient occurs at exponent $${n}-${k}=${j}$.`));
});
add("repair-geometric-record",AA,"1.3","SL1.3.find-r-u1 SL1.3.nth-term",2,"table","Find a missing term of a geometric sequence",({rng:r})=>{
 const j=r.int(1,12),u=r.int(3,17),b=r.pick([-4,-3,-2,2,3,4]),x=u*b,y=x*b;
 const q=Q({j,u,b,x,y},"The table shows three consecutive terms of a geometric sequence.",
  P("Find the common ratio.",1,I(b),T`Divide the third term shown by the second: divide $${y}$ by $${T`\left(${x}\right)`}$ to obtain $${b}$.`),
  P(T`Find the value of $u_{${j}}$.`,2,I(u),T`Reverse one multiplication by the common ratio. This gives $${x}\div${T`\left(${b}\right)`}=${u}$.`));
 q.table={head:["Term",...([j,j+1,j+2].map(i=>M("u_{"+i+"}")))],rows:[["Value","Not given",M(x),M(y)]]};
 return q;
});
add("reroute-infinite-pool",AA,"1.8","SL1.8.sum-to-infinity SL1.8.find-unknown",2,"words","Move part of a fixed infinite sum to an up-front allocation",({rng:r})=>{
 const p=r.int(3,12)*4,q=r.int(1,3);
 const total=p*4/(4-q);
 // The launch allocation is intentionally part of the modified schedule, not a geometric term.
 const allocated=Math.floor(total*r.int(25,46)/100);
 return Q({p,q,allocated},T`A permanent programme would begin by assigning $${p}$ points, then repeat forever with each assignment $${R(q,4)}$ of the previous one. An alternative has the same total. It first makes one launch allocation of $${allocated}$ points, not part of the series. It then makes an infinite geometric series of assignments with common ratio $${R(1,2)}$.`,
  P("Find the original total exactly.",2,A.frac(4*p,4-q),T`Divide the first assignment by one minus the ratio. The total is $${R(4*p,4-q)}$.`),
  P("Find the first assignment of the new geometric series exactly.",2,A.frac(4*p-allocated*(4-q),2*(4-q)),T`Subtract the launch allocation from the original total. With ratio one half the new geometric total is twice the first term, so divide the remainder by two.`));
});
add("log-display-tolerance",AA,"1.5","SL1.5.log-context SL1.5.evaluate-tech SL1.5.exp-log-form",4,"words","Reverse a rounded logarithmic instrument reading into bounds",({rng:r})=>{
 const k=r.int(17,37)/10,h=r.int(9,31)/10,offset=r.int(1,4)/2;
 const a=(h-.05-offset)/k,b=(h+.05-offset)/k,lo=10**a,hi=10**b;
 return Q({k,h,offset},T`An instrument reports $L=${k}\log_{10} I+${offset}$ for intensity $I>0$. The screen shows $${h.toFixed(1)}$ to the nearest tenth. Ties round upward.`,
  P("Find the exact lower boundary of the unrounded reading $L$.",1,A.frac(Math.round((h-.05)*100),100),T`A reading exactly half a tenth below the displayed value rounds up to it. The lower boundary is $${Number((h-.05).toFixed(2))}$.`),
  P("Find the lower intensity boundary, to three significant figures.",2,S(lo),T`Isolate the logarithm at the lower reading boundary, then raise ten to that power. This gives $${F.sf(lo,3)}$.`),
  P("Find the upper intensity boundary, to three significant figures.",2,S(hi),T`Use the upper reading boundary $${Number((h+.05).toFixed(2))}$ and perform the same inverse calculation. The boundary itself is excluded because a tie rounds up.`));
});
add("possible-side-count",AI,"1.6","AI-SL1.6.write-bounds AI-SL1.6.bounds-of-calculation AI-SL1.6.whole-items-in-context",3,"words","Count the integer side lengths consistent with two rounded readings",({rng:r})=>{
 const L0=10*r.int(2,7),W0=10*r.int(1,5),shift=2*r.int(-10,8),p=2*(L0+W0)+shift;
 const a=Math.max(L0-5,p/2-W0-4),b=Math.min(L0+4,p/2-W0+5);
 return Q({L0,W0,p},T`A rectangle has whole-number side lengths in centimetres. Rounded to the nearest ten centimetres, the first length is $${L0}$ and the second is $${W0}$. Exact halfway values round upward. The exact perimeter is $${p}$ centimetres.`,
  P("Find the least possible first length.",2,I(a),T`The first length begins at $${L0-5}$. The second length is no greater than $${W0+4}$, so the first length must also be at least $${p/2-W0-4}$. Take the larger lower bound.`),
  P("Find the number of possible ordered pairs of side lengths.",3,I(b-a+1),T`The first length is no greater than $${L0+4}$, and the second is at least $${W0-5}$, so the first is also at most $${p/2-W0+5}$. The feasible whole lengths run from $${a}$ to $${b}$ inclusive, each fixing the second length.`));
});
add("alternating-retention",AA,"1.8","SL1.8.convergence SL1.8.sum-to-infinity SL1.8.sn-vs-sinf SL1.3.find-n SL1.3.model",5,"words","Decide when alternating retention has delivered a fixed fraction",({rng:r})=>{
 const a=r.int(8,42),m=r.int(53,84),n=r.int(51,79),p=m/100,q=n/100,r0=p*q;
 const total=a*(1+p)/(1-r0),target=r.int(84,98)/100,steps=Math.ceil(Math.log(1-target)/Math.log(r0));
 const single=steps===1?a:a*(1+p)*(1-r0**(steps-1))/(1-r0)+a*r0**(steps-1);
 const earliest=single>=target*total?2*steps-1:2*steps;
 return Q({a,m,n,target},T`A sensor sends $${a}$ units in its first pulse. After each odd-numbered pulse the next pulse is $${m}\%$ of that pulse. After each even-numbered pulse the next pulse is $${n}\%$ of that pulse. The rule continues indefinitely. Management wants at least $${Math.round(100*target)}\%$ of the eventual total delivered.`,
  P("Find the common ratio of the totals of consecutive pairs of pulses. Give an exact value.",2,A.exact(m*n/10000,String(m*n/10000)),T`Combine pulses in pairs: the first pair starts with $${a}$ and the second starts after both retention multipliers. Each pair scales by $${R(m,100)}\cdot${R(n,100)}=${m*n/10000}$.`),
  P("Find the eventual total, to three significant figures.",2,S(total),T`The first pair totals $${a}\left(1+${R(m,100)}\right)$. The pair series converges because the ratio is below one. Divide the first pair by one minus the pair ratio.`),
  P("Find the least number of complete pairs that guarantees the target has been met.",2,I(steps),T`After $k$ complete pairs the undelivered fraction is the pair ratio to the power $k$. Require this to be at most $${R(100-Math.round(100*target),100)}$, then find the least permitted whole $k$.`),
  P("Find the least number of individual pulses that meets the target.",2,I(earliest),T`With one fewer complete pair the target has not been met. Test the next odd pulse by adding its size to that partial sum. The running total at that step is approximately $${F.sf(single,3)}$ units, compared with a target of approximately $${F.sf(target*total,3)}$. Use the unrounded numbers to decide.`));
},{syllabus:["1.8","1.3"]});
})(typeof window==="undefined"?globalThis:window);
