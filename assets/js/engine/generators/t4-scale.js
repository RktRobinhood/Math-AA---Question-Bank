/* Original statistics and probability variety pack. */
(function (root) {
  "use strict";
  const E=root.QBEngine, {ans,fmt}=E, {num,frac,lin,sf,point}=fmt;
  const P=(prompt,marks,answer,working)=>({prompt,marks,answer,working});
  const Q=(params,stem,parts,extras={})=>({params,stem,parts,...extras});
  const N=x=>`$${num(x)}$`, F=(a,b)=>`$${frac(a,b)}$`;
  const fix=(x,n=8)=>Number(x.toFixed(n));
  const tb=(head,rows)=>({head,rows});
  function bc(n,p,l,h) {
    let mass=(1-p)**n, total=l===0?mass:0;
    for(let k=1;k<=h;k++){mass*=((n-k+1)*p)/(k*(1-p));if(k>=l)total+=mass;}
    return total;
  }
  function pp(l,k) { let a=Math.exp(-l); for(let j=1;j<=k;j++) a*=l/j; return a; }
  E.registerAll({ }, [{"home": "aa-sl", "type": "t4-scale-partition-right-tail", "unknown": "partition-right-tail", "representation": "equation", "syllabus": ["4.5"], "levels": [0], "skills": ["SL4.5.complement"], "format": "value", "calculator": false, "title": "Complement inside a deliberately chosen sample space", "source": "aa-sl-2026-may-tz2-p2-q08.c", build({rng}) {
const d=rng.pick([5,8,10,12,15]),k=rng.int(1,d-1);
return Q({d,k},`A random draw has probability ${F(k,d)} of drawing a blue tile.`,[
 P("Find the probability of drawing a tile that is not blue.",1,ans.frac(d-k,d),[`Subtract the blue probability from one: $1-\\dfrac{${k}}{${d}}=${frac(d-k,d)}$.`])
]);
  }}]);
  E.registerAll({ }, [{"home": "aa-sl", "type": "t4-scale-stratum-reverse", "unknown": "stratum-reverse", "representation": "table", "syllabus": ["4.1"], "levels": [2], "skills": ["SL4.1.stratified-numbers"], "format": "value", "calculator": false, "title": "Recover a population count from a proportional allocation", "source": "aa-sl-2026-may-tz3-p1-q01.a", build({rng}) {
const a=rng.int(3,16),b=rng.int(3,16),c=rng.int(3,16),f=rng.int(3,15);
const table=tb(["Depot","Population","Sample"],[["North",N(a*f),N(a)],["South","Unknown",N(b)],["West","Unknown",N(c)]]);
return Q({a,b,c,f},"A proportional stratified survey uses the same sampling fraction in every depot.",[
 P("Find the population of the South depot.",2,ans.int(b*f),[`Each sampled person represents $${a*f}\\div${a}=${f}$ people. The answer is $${b}\\times${f}=${b*f}$.`]),
 P("Find the total population of the three depots.",2,ans.int((a+b+c)*f),[`Scale the total sample by the same factor: $${a+b+c}\\times${f}=${(a+b+c)*f}$.`])
],{table});
  }}]);
  E.registerAll({ }, [{"home": "aa-sl", "type": "t4-scale-histogram-missing-width", "unknown": "histogram-missing-width", "representation": "table", "syllabus": ["4.2"], "levels": [2], "skills": ["SL4.2.frequency-histogram"], "format": "value", "calculator": false, "title": "Recover a histogram interval from density and area", "source": "aa-sl-2023-nov-tz1-p1-q07.a", build({rng}) {
const a=rng.int(2,8),b=rng.int(3,9),p=rng.int(2,8),r=rng.int(3,12);
const table=tb(["Interval","Frequency","Frequency density"],[[`$0\\le x<${a}$`,N(a*p),N(p)],[`$${a}\\le x<c$`,N(b*r),N(r)]]);
return Q({a,b,p,r},"Two adjacent bars of a frequency-density histogram have the information shown.",[
 P("Find the missing interval endpoint $c$.",3,ans.int(a+b),[`Frequency equals bar width times density. The second width is $${b*r}\\div${r}=${b}$, so $c=${a+b}$.`])
],{table});
  }}]);
  E.registerAll({ }, [{"home": "aa-sl", "type": "t4-scale-remove-duplicate-mean", "unknown": "remove-duplicate-mean", "representation": "words", "syllabus": ["4.3"], "levels": [3], "skills": ["SL4.3.mean-totals"], "format": "value", "calculator": false, "title": "Correct a reported mean after a duplicate entry", "source": "aa-sl-2026-may-tz2-p2-q01.b", build({rng}) {
const mean=rng.int(18,36),n=rng.int(5,14),old=mean+rng.pick([-1,1])*n,
  newMean=mean+(mean-old)/(n-1), correct=old+rng.int(1,n-1),replaceMean=mean+(correct-old)/n;
return Q({mean,n,old,correct},`A worksheet reports a mean of ${N(mean)} for ${N(n)} readings. One entry is the recorded value ${N(old)}.`,[
 P("Find the sum of the recorded readings.",1,ans.int(mean*n),[`Multiply number of readings by mean: $${n}\\times${mean}=${n*mean}$.`]),
 P(`If the entry ${N(old)} was a duplicate and is deleted, find the new mean exactly.`,2,ans.frac(mean*n-old,n-1),[`Subtract the duplicated value and reduce the count: $${frac(mean*n-old,n-1)}$.`]),
 P(`Instead, suppose the entry is corrected to ${N(correct)} with nothing deleted. Find the corrected mean exactly.`,2,ans.frac(mean*n-old+correct,n),[`The total changes by $${correct-old}$, but the count stays the same: $${frac(mean*n-old+correct,n)}$.`])
]);
  }}]);
  E.registerAll({ }, [{"home": "aa-sl", "type": "t4-scale-regression-residual-swap", "unknown": "regression-residual-swap", "representation": "table", "syllabus": ["4.4"], "levels": [4], "skills": ["SL4.4.predict", "SL4.4.interpret-ab"], "format": "value", "calculator": true, "title": "Use residuals to audit a regression prediction", "source": "aa-sl-2026-may-tz3-p2-q01.c", build({rng}) {
const a=rng.int(52,139)/10,b=rng.int(14,41)/13,x=rng.int(3,20),y=rng.int(11,33),x2=x+rng.int(4,8),y2=y+rng.int(2,10);
const displayed=Number(b.toFixed(4)), pred=a+displayed*x,pred2=a+displayed*x2;
const table=tb(["Input","Observed response"],[[N(x),N(y)],[N(x2),N(y2)]]);
return Q({a,b:displayed,x,y,x2,y2},`A fitted model predicts $y=${lin(displayed,a)}$. Its data include the two observations shown. A residual is observed minus predicted.`,[
 P("Find the predicted response for the first observation.",2,ans.sf(pred),[`Substitute $x=${x}$ into the line to obtain $${sf(pred)}$.`]),
 P("Find the first observation's residual.",2,ans.sf(y-pred),[`Subtract the unrounded prediction from ${N(y)} to get $${sf(y-pred)}$.`]),
 P("Find the second observation's residual.",2,ans.sf(y2-pred2),[`Predict at $x=${x2}$ before subtracting from ${N(y2)}. The residual is $${sf(y2-pred2)}$.`])
],{table});
  }}]);
  E.registerAll({ }, [{"home": "aa-sl", "type": "t4-scale-unequal-experiment-comparison", "unknown": "unequal-experiment-comparison", "representation": "table", "syllabus": ["4.5"], "levels": [2], "skills": ["SL4.5.relative-frequency"], "format": "value", "calculator": false, "title": "Compare relative frequencies rather than raw counts", "source": "aa-sl-2024-nov-tz1-p2-q07.a", build({rng}) {
const p=rng.int(2,5),q=rng.int(p+2,p+5),u=rng.int(4,12),v=rng.int(4,12),
  x=p*u,y=(p+1)*v,n=q*u,m=(q+2)*v;
return Q({x,y,n,m},"Two batches show these numbers of alerts and logged runs.",[
 P("Find the relative frequency of alerts in batch A.",1,ans.frac(x,n),[`Divide the alert count by the run count, giving $${frac(x,n)}$.`]),
 P("Find the relative frequency of alerts in batch B.",1,ans.frac(y,m),[`Use the size of batch B, giving $${frac(y,m)}$.`])
 ,P("State which batch has the greater relative frequency, or if these are equal.",2,ans.self(x*m===y*n?"The two relative frequencies are equal.":x*m>y*n?"Batch A has the greater relative frequency.":"Batch B has the greater relative frequency."),["Compare the two fractions using a common denominator. Counts alone do not decide the answer."])
],{table:tb(["Batch","Alerts","Runs"],[["A",N(x),N(n)],["B",N(y),N(m)]])});
  }}]);
  E.registerAll({ }, [{"home": "aa-sl", "type": "t4-scale-venn-exactly-one-reverse", "unknown": "venn-exactly-one-reverse", "representation": "words", "syllabus": ["4.6"], "levels": [3], "skills": ["SL4.6.venn", "SL4.6.union"], "format": "value", "calculator": false, "title": "Reconstruct event counts from exactly-one information", "source": "aa-sl-2026-may-tz2-p2-q02.a", build({rng}) {
const a=rng.int(5,22),b=rng.int(5,22),c=rng.int(3,15),d=rng.int(3,21),n=a+b+c+d;
return Q({a,b,c,d},`Of ${N(n)} volunteers, ${N(a+c)} attend the morning session, ${N(b+c)} the afternoon session, and ${N(a+b)} attend exactly one of the sessions.`,[
 P("Find the number who attend both sessions.",2,ans.int(c),[`Adding the two attendance totals counts the overlap twice. After subtracting the exactly-one count, divide by two to get ${N(c)}.`]),
 P("Find the number attending neither session.",2,ans.int(d),[`Subtract ${N(a+b+c)}, the number attending at least one, from the total to get ${N(d)}.`]),
 P("Find the probability that a randomly selected volunteer attends only the afternoon. Give an exact fraction.",2,ans.frac(b,n),[`The afternoon-only count is $${b+c}-${c}=${b}$. Divide by ${N(n)} to get $${frac(b,n)}$.`])
]);
  }}]);
  E.registerAll({ }, [{"home": "aa-sl", "type": "t4-scale-discrete-fair-stake", "unknown": "discrete-fair-stake", "representation": "table", "syllabus": ["4.7"], "levels": [3], "skills": ["SL4.7.expected-value", "SL4.7.fair-game"], "format": "value", "calculator": false, "title": "Recover the fair price and break-even chance", "source": "aa-sl-2026-may-tz3-p2-q04.c", build({rng}) {
const d=rng.pick([8,10,12,15,16]),k=rng.int(1,3),j=rng.int(2,4),a=rng.int(2,7),b=a+rng.int(2,9);
const e=a*k+b*j,table=tb(["Prize","Probability"],[[N(0),F(d-k-j,d)],[N(a),F(k,d)],[N(b),F(j,d)]]);
return Q({d,k,j,a,b},"A ticket pays the prizes in this table, in points.",[
 P("Find the expected prize. Give an exact answer.",2,ans.frac(e,d),[`Weight the positive prizes by their probabilities. The expectation is $${frac(e,d)}$ points.`]),
 P("Find the fair ticket price, in points. Give an exact answer.",1,ans.frac(e,d),[`A fair price equals the expected prize: $${frac(e,d)}$ points.`]),
 P("With that ticket price, find the probability of making a strictly positive net gain.",2,ans.frac((a*d>e?k:0)+(b*d>e?j:0),d),[`Include only prizes strictly above the fair price. Add those event probabilities to get $${frac((a*d>e?k:0)+(b*d>e?j:0),d)}$.`])
],{table});
  }}]);
  E.registerAll({ }, [{"home": "aa-sl", "type": "t4-scale-binomial-majority-vs-tie", "unknown": "binomial-majority-vs-tie", "representation": "words", "syllabus": ["4.8"], "levels": [4], "skills": ["SL4.8.identify", "SL4.8.exact-probability", "SL4.8.cumulative-probability", "SL4.8.binomial-in-context"], "format": "value", "calculator": true, "title": "Translate a voting rule into win and tie probabilities", "source": "ai-sl-2026-may-tz3-p1-q04.b", build({rng}) {
const n=rng.pick([8,10,12,14,16,18]),p=rng.int(32,66)/100,s=n/2;
const win=bc(n,p,s+1,n),tie=bc(n,p,s,s),loss=bc(n,p,0,s-1);
return Q({n,p,s},`A panel of ${N(n)} people votes yes or no independently. Each person votes yes with probability ${N(p)}. The proposal passes only if yes votes outnumber no votes.`,[
 P("Find the probability of a tie.",2,ans.sf(tie),[`A tie means exactly ${N(s)} yes votes. Use the binomial point probability: $${sf(tie)}$.`]),
 P("Find the probability that the proposal passes.",2,ans.sf(win),[`Passing requires strictly more than ${N(s)} yes votes, so use bounds ${N(s+1)} to ${N(n)}. The probability is $${sf(win)}$.`]),
 P("Find the probability that no votes outnumber yes votes.",2,ans.sf(loss),[`Exclude ties as well as passes; using unrounded values, the answer is $${sf(loss)}$.`])
]);
  }}]);
  E.registerAll({ }, [{"home": "aa-sl", "type": "t4-scale-normal-probability-complement-map", "unknown": "normal-probability-complement-map", "representation": "equation", "syllabus": ["4.9"], "levels": [3], "skills": ["SL4.9.symmetry-probability", "SL4.9.central-interval"], "format": "value", "calculator": false, "title": "Rebuild equal tails from a central normal probability", "source": "aa-sl-2025-nov-tz1-p2-q02.c", build({rng}) {
const m=rng.int(26,93),d=rng.int(3,12),inside=rng.int(43,89)/100,l=m-d,r=m+d,tail=fix((1-inside)/2),below=fix(1-tail);
return Q({m,d,inside},`For a normal variable $X$ with mean ${N(m)}, $\\mathrm{P}(${l}<X<${r})=${num(inside)}$.`,[
 P(`Find $\\mathrm{P}(X>${r})$.`,2,ans.dec(tail),[`The central interval is centred on the mean. Split its complement equally to get $${num(tail)}$.`]),
 P(`Find $\\mathrm{P}(X<${r})$.`,2,ans.dec(below),[`Subtract the upper-tail probability from one to get $${num(below)}$.`]),
 P(`Find $\\mathrm{P}(${m}<X<${r})$.`,1,ans.dec(fix(inside/2)),[`The upper half of the central interval has probability $${num(fix(inside/2))}$.`])
]);
  }}]);
  E.registerAll({ }, [{"home": "aa-sl", "type": "t4-scale-inverse-regression-disagreement", "unknown": "inverse-regression-disagreement", "representation": "equation", "syllabus": ["4.10"], "levels": [3], "skills": ["SL4.10.choose-line", "SL4.10.predict-x"], "format": "value", "calculator": false, "title": "Compare x-on-y with algebraically reversing y-on-x", "source": "aa-sl-2025-may-tz1-p2-q05.a", build({rng}) {
const x0=rng.int(5,20),y0=rng.int(15,32),s=rng.pick([1,2,3]),t=rng.pick([.1,.2,.25]),d=rng.pick([2,4,8,10]),yy=y0+d;
return Q({x0,y0,s,t,d},`Two regression lines meet at the mean point $${point(x0,y0)}$. They are $y-${y0}=${s===1?"":" "+s}\\left(x-${x0}\\right)$ and $x-${x0}=${num(t)}\\left(y-${y0}\\right)$.`,[
 P(`Using the appropriate regression, estimate $x$ when $y=${yy}$.`,2,ans.dec(fix(x0+t*d)),[`Use the line that predicts $x$ directly, obtaining $${num(fix(x0+t*d))}$.`]),
 P(`A colleague instead solves the first line for $x$, using $y=${yy}$. Find their value exactly.`,2,ans.frac(x0*s+d,s),[`Solving the first line gives $x=${x0}+\\dfrac{${d}}{${s}}$, or $${frac(x0*s+d,s)}$.`]),
 P("Explain why the two methods need not give the same prediction.",2,ans.self("The first model minimises vertical residuals in $y$. The second minimises residuals in $x$ and is the correct model for predicting $x$ from $y$."),["The fitted model depends on which variable is the response. Reversing one regression is not the same as refitting in the opposite direction."])
]);
  }}]);
  E.registerAll({ }, [{"home": "aa-sl", "type": "t4-scale-independence-cell-repair", "unknown": "independence-cell-repair", "representation": "table", "syllabus": ["4.11"], "levels": [3], "skills": ["SL4.11.independence-unknown", "SL4.11.test-independence"], "format": "value", "calculator": false, "title": "Repair a contingency table to make events independent", "source": "aa-sl-2026-may-tz1-p1-q06.b", build({rng}) {
const a=rng.int(2,6),b=rng.int(2,6),c=rng.int(4,7),d=rng.int(4,7),n=(a+b)*(c+d),
  A=a*(c+d), B=(a+b)*c, both=a*c;
const table=tb(["Group","Chose B","Did not choose B","Total"],[["A","Unknown","Unknown",N(A)],["Not A","Unknown","Unknown",N(n-A)],["Total",N(B),N(n-B),N(n)]]);
return Q({A,B,n},"The margins of a contingency table are fixed. Events $A$ and $B$ must be independent.",[
 P("Find the count in the A and B cell.",3,ans.int(both),[`Independence means the joint proportion equals the product of the marginal proportions. Multiply this joint proportion by ${N(n)} to get ${N(both)}.`]),
 P("Find the count in the neither A nor B cell.",2,ans.int(b*d),[`For the neither cell, use the complement of both margins. The answer is ${N(b*d)}.`])
],{table});
  }}]);
  E.registerAll({ }, [{"home": "aa-sl", "type": "t4-scale-standardise-opposite-scales", "unknown": "standardise-opposite-scales", "representation": "table", "syllabus": ["4.12"], "levels": [3], "skills": ["SL4.12.z-score", "SL4.12.compare-z"], "format": "value", "calculator": false, "title": "Judge outcomes measured on opposite scales", "source": "aa-sl-2025-nov-tz3-p2-q06.b", build({rng}) {
const a=rng.int(28,65),b=rng.int(60,92),s=rng.pick([4,8,12]),t=rng.pick([8,12,16]),
  f=rng.pick([.25,.5,.75]),g=rng.pick([.25,.5,.75]),x=a-s*f,y=b+t*g;
const table=tb(["Event","Observed","Mean","Standard deviation"],[["Time",N(x),N(a),N(s)],["Score",N(y),N(b),N(t)]]);
return Q({a,b,s,t,x,y},"In one event a lower time is better; in the other a higher score is better.",[
 P("Find the signed $z$-score of the time.",2,ans.dec(-f),[`Subtract the mean then divide by the standard deviation to get ${N(-f)}.`]),
 P("Find the signed $z$-score of the score.",2,ans.dec(g),[`Subtract the mean then divide by the standard deviation to get ${N(g)}.`]),
 P("Which is the better result relative to its event mean? Justify using standard deviations.",2,ans.self(f===g?"They are equally strong relative to their respective event means.":f>g?"Time is better: its improvement from the mean is more standard deviations.":"Score is better: its improvement from the mean is more standard deviations."),["Use the favourable direction for each event. The negative time score is an improvement; compare its magnitude with the magnitude of the score improvement."])
],{table});
  }}]);
  E.registerAll({ }, [{"home": "aa-hl", "type": "t4-scale-bayes-reverse-mixture", "unknown": "bayes-reverse-mixture", "representation": "equation", "syllabus": ["4.13"], "levels": [3], "skills": ["AHL4.13.total-probability", "AHL4.13.bayes-formula"], "format": "value", "calculator": false, "title": "Recover a new prior from a known mixture rate", "source": "aa-hl-2023-may-tz1-p2-q07.b", build({rng}) {
const d=20,a=rng.int(3,7),b=rng.int(10,18),p=rng.int(2,8),mixed=a*p+b*(10-p);
return Q({d,a,b,p,mixed},`A dossier is routed by method A or B. The chances of a delay are ${F(a,d)} for method A and ${F(b,d)} for method B. The overall delay probability is ${F(mixed,d*10)}.`,[
 P("Find the probability that method A is used. Give an exact answer.",3,ans.frac(p,10),[`Let $w$ denote the probability of method A. Solve $\\dfrac{${a}}{${d}}w+\\dfrac{${b}}{${d}}(1-w)=${frac(mixed,d*10)}$ to get $${frac(p,10)}$.`]),
 P("Given that a delay occurs, find the probability it was routed by method A.",3,ans.frac(a*p,mixed),[`The joint probability of method A and a delay is $${frac(a*p,10*d)}$. Divide it by the overall delay probability, obtaining $${frac(a*p,mixed)}$.`])
]);
  }}]);
  E.registerAll({ }, [{"home": "aa-hl", "type": "t4-scale-pdf-triangular-median", "unknown": "pdf-triangular-median", "representation": "equation", "syllabus": ["4.14", "5.11"], "levels": [5], "skills": ["AHL4.14.pdf-normalise", "AHL4.14.pdf-probability", "AHL4.14.median-mode", "AHL4.14.linear-transformation", "SL5.11.evaluate-definite"], "format": "value", "calculator": true, "title": "Find the median and report a scaled continuous variable", "source": "aa-hl-2025-may-tz2-p2-q11.d", build({rng}) {
const s=rng.int(3,14),h=rng.int(3,22),k=2/(s*s),bound=s/2;
return Q({s,h},`A continuous variable $X$ has density $f(x)=kx$ for $0\\le x\\le ${s}$ and zero otherwise. Define $Y = ${h} + 2X$.`,[
 P("Use a definite integral to find $k$ exactly.",2,ans.frac(2,s*s),[`The total probability is $\\int_{0}^{${s}}kx\\,\\mathrm{d}x=\\dfrac{k${s*s}}{2}=1$, so $k=${frac(2,s*s)}$.`]),
 P(`Find $\\mathrm{P}(X\\le ${num(bound)})$ exactly.`,2,ans.frac(1,4),["The smaller triangle has half the base and half the height, giving probability $\\dfrac{1}{4}$."]),
 P("Find the median of $X$. Give your answer to three significant figures.",2,ans.sf(s/Math.sqrt(2)),[`A median $m$ divides the area in half, so $\\left(\\dfrac{m}{${s}}\\right)^{2}=\\dfrac{1}{2}$ and $m\\approx${sf(s/Math.sqrt(2))}$.`]),
 P("Find the median of $Y$. Give your answer to three significant figures.",2,ans.sf(h+Math.SQRT2*s),[`The transformation is strictly increasing, so apply it to the unrounded median of $X$. This gives $${sf(h+Math.SQRT2*s)}$.`])
]);
  }}]);
  E.registerAll({ }, [{"home": "ai-sl", "type": "t4-scale-rank-correct-swapped-orders", "unknown": "rank-correct-swapped-orders", "representation": "table", "syllabus": ["4.10"], "levels": [4], "skills": ["AI-SL4.10.rank-data", "AI-SL4.10.calculate-rs", "AI-SL4.10.interpret-rs"], "format": "value", "calculator": true, "title": "Repair paired ranks and compare their agreement", "source": "ai-sl-2025-may-tz2-p1-q10.b", build({rng}) {
const n=rng.pick([6,7,8]),A=Array.from({length:n},(_,i)=>i+1);
let B,u,v,before,after,D,D2;
do {
 B=rng.shuffle(A.slice());u=rng.int(0,n-2);v=rng.int(u+1,n-1);D=A.reduce((s,x,i)=>s+(x-B[i])**2,0);
 before=1-6*D/(n*(n*n-1));D2=D-(A[u]-B[u])**2-(A[v]-B[v])**2+(A[u]-B[v])**2+(A[v]-B[u])**2;
 after=1-6*D2/(n*(n*n-1));
}while(Math.abs(before)<.03||Math.abs(after)<.03||Math.abs(before)>.97||Math.abs(after)>.97||(Math.abs(before-Number(before.toPrecision(2)))<1e-9&&Math.abs(after-Number(after.toPrecision(2)))<1e-9));
const table=tb(["Entry","Judge A rank","Judge B rank"],A.map((x,i)=>[String.fromCharCode(65+i),N(x),N(B[i])]));
return Q({A,B,u,v},`Two judges rank the entries with no ties. Judge B later swaps the ranks of entries ${String.fromCharCode(65+u)} and ${String.fromCharCode(65+v)}.`,[
 P("Find Spearman's rank coefficient before the swap.",3,ans.sf(before),[`For the original ranks, $\\sum d^{2}=${D}$. Substitution in the no-ties formula gives $${sf(before)}$.`]),
 P("Find Spearman's rank coefficient after the swap.",3,ans.sf(after),[`Only the two swapped rank differences change. Recompute them to get $\\sum d^{2}=${D2}$ and $r_{s}\\approx${sf(after)}$.`])
],{table});
  }}]);
  E.registerAll({ }, [{"home": "ai-sl", "type": "t4-scale-chi-decision-changed-level", "unknown": "chi-decision-changed-level", "representation": "table", "syllabus": ["4.11"], "levels": [4], "skills": ["AI-SL4.11.expected-frequencies", "AI-SL4.11.degrees-of-freedom", "AI-SL4.11.conclusion"], "format": "value", "calculator": true, "title": "A fixed p-value and two significance decisions", "source": "ai-sl-2026-may-tz3-p1-q03.c", build({rng}) {
const a=rng.int(7,19),b=rng.int(5,18),c=rng.int(4,18),u=rng.int(6,19),v=rng.int(5,16),w=rng.int(6,18),
  n=a+b+c+u+v+w,e=(a+b+c)*(a+u)/n,p=rng.int(12,48)/1000;
const table=tb(["Route","Early","On time","Late"],[["North",N(a),N(b),N(c)],["South",N(u),N(v),N(w)]]);
return Q({a,b,c,u,v,w,n,p},`A first survey is summarised below. In a separate follow-up survey, a test for independence gives a p-value of ${N(p)}.`,[
 P("Under independence for the first survey, find the expected count for North and Early.",2,ans.sf(e),[`Multiply the North and Early totals and divide by the grand total ${N(n)}. The expected count is $${sf(e)}$.`]),
 P("Find the degrees of freedom for the first survey.",1,ans.int(2),["Multiply one less than the row count by one less than the column count to obtain $2$."]),
 P("For the follow-up survey, explain the decisions at $1\\%$ and $5\\%$ significance.",3,ans.self("Do not reject independence at $1\\%$; reject it at $5\\%$ because the p-value is between the two cutoffs."),["A larger significance level makes the rejection condition easier to meet. Do not use the first survey's expected count for the follow-up decision."])
],{table});
  }}]);
  E.registerAll({ }, [{"home": "ai-hl", "type": "t4-scale-merge-tail-df-cost", "unknown": "merge-tail-df-cost", "representation": "table", "syllabus": ["4.12"], "levels": [3], "skills": ["AI-AHL4.12.combine-categories", "AI-AHL4.12.reduce-df"], "format": "value", "calculator": false, "title": "Combine sparse categories and track the degrees of freedom", "source": "ai-hl-2024-nov-tz0-p3-q02.d(ii)", build({rng}) {
const n=rng.int(5,8),p=rng.int(0,2),d=rng.int(2,4),e=rng.int(3,4),largest=Array.from({length:n-2},()=>rng.int(9,28));
const tail=d+e, freq=[...largest,d,e], w=n-1;
const table=tb(["Category","Expected count"],freq.map((v,i)=>[N(i+1),N(v)]));
return Q({n,p,d,e,largest},`A goodness-of-fit model has ${N(p)} parameters estimated from the sample. For this test, merge adjacent tail categories until every expected count is at least ${N(5)}.`,[
 P("Find the expected count in the merged tail category.",2,ans.int(tail),[`Combine the last two categories, obtaining $${d}+${e}=${tail}$.`]),
 P("State the number of categories after merging.",1,ans.int(w),[`Merging two categories reduces the original number by one, giving ${N(w)}.`]),
 P("Find the degrees of freedom of the merged test.",2,ans.int(w-p-1),[`Subtract one for the total and another ${N(p)} for estimated parameters. This leaves ${N(w-p-1)} degrees of freedom.`])
],{table});
  }}]);
  E.registerAll({ }, [{"home": "ai-hl", "type": "t4-scale-residual-score-model-switch", "unknown": "residual-score-model-switch", "representation": "table", "syllabus": ["4.13"], "levels": [4], "skills": ["AI-AHL4.13.ssres", "AI-AHL4.13.compare-models"], "format": "value", "calculator": true, "title": "Choose the better model by squared residuals", "source": "ai-hl-2025-may-tz3-p3-q02.e", build({rng}) {
const shift=rng.int(3,15),w=rng.int(5,18)/10,z=rng.int(4,13)/10;
const y=[shift,shift+2,shift+6],a=[shift+w,shift+2-w,shift+6+z],b=[shift-2*w,shift+2+z,shift+6+2*z];
const E=(p)=>p.reduce((s,v,i)=>s+(y[i]-v)**2,0),ea=E(a),eb=E(b);
const table=tb(["Observed","Model A prediction","Model B prediction"],y.map((x,i)=>[N(x),N(a[i]),N(b[i])]));
return Q({y,a,b},"Two fitted models were evaluated on the same three observations.",[
 P("Calculate the sum of squared residuals for model A.",2,ans.sf(ea),[`Square each observed-minus-predicted value and sum. The result is $${sf(ea)}$.`]),
 P("Calculate the sum of squared residuals for model B.",2,ans.sf(eb),[`Repeat with the model B predictions. The result is $${sf(eb)}$.`]),
 P("Which model fits better on these observations? Justify your answer.",2,ans.self("Model A, because its sum of squared residuals is lower."),["Compare aggregate squared errors; fitting better in the sample does not prove better performance on unseen data."])
],{table});
  }}]);
  E.registerAll({ }, [{"home": "ai-hl", "type": "t4-scale-unbias-and-rescale", "unknown": "unbias-and-rescale", "representation": "words", "syllabus": ["4.14"], "levels": [3], "skills": ["AI-AHL4.14.unbiased-variance", "AI-AHL4.14.linear-transformation"], "format": "value", "calculator": false, "title": "Correct a variance divisor and then change units", "source": "ai-hl-2026-may-tz2-p3-q02.e", build({rng}) {
const n=rng.pick([5,7,9,11,13,15]),m=rng.int(2,13),v=(n-1)*m,k=rng.pick([2,3,4]);
return Q({n,v,k},`A random sample of size ${N(n)} has variance ${N(v)} when calculated by dividing the sum of squared deviations by ${N(n)}. Every measurement is then multiplied by ${N(k)}.`,[
 P("Find the sum of squared deviations for the original data.",1,ans.int(n*v),[`Reverse the original division: $${n}\\times${v}=${n*v}$.`]),
 P("Find an unbiased estimate of the original population variance.",2,ans.int(n*m),[`Divide the same sum by $n-1$, giving ${N(n*m)}.`]),
 P("Find an unbiased variance estimate in the rescaled measurements.",2,ans.int(k*k*n*m),[`Multiplying measurements by ${N(k)} multiplies variance by $${k}^{2}$. The estimate is ${N(k*k*n*m)}.`])
]);
  }}]);
  E.registerAll({ }, [{"home": "ai-hl", "type": "t4-scale-sample-mean-backsolve-n", "unknown": "sample-mean-backsolve-n", "representation": "equation", "syllabus": ["4.15"], "levels": [3], "skills": ["AI-AHL4.15.sample-mean", "AI-AHL4.15.central-limit-theorem"], "format": "value", "calculator": false, "title": "Recover sample size from the spread of a sample mean", "source": "ai-hl-2026-may-tz1-p2-q06.e", build({rng}) {
const mu=rng.int(28,79),s=rng.pick([3,4,5,6,7,8]),q=rng.pick([2,3,4]),sigma=s*q,n=s*s;
return Q({mu,s,sigma,q,n},`A normal population has mean ${N(mu)} and standard deviation ${N(sigma)}. An independent random sample of size $n$ is taken. Its sample mean has standard deviation ${N(q)}.`,[
 P("Find $n$.",2,ans.int(n),[`Set $\\dfrac{${sigma}}{\\sqrt{n}}=${q}$. Squaring the ratio gives $n=${n}$.`]),
 P("Find the mean of the sampling distribution.",1,ans.int(mu),[`A sample mean is centred at the population mean, ${N(mu)}.`]),
 P("A colleague quadruples the sample size. Find the new standard deviation of the sample mean exactly.",2,ans.frac(q,2),[`A factor of four in sample size halves the standard deviation. The answer is $${frac(q,2)}$.`])
]);
  }}]);
  E.registerAll({ }, [{"home": "ai-hl", "type": "t4-scale-confidence-interval-deconstruct", "unknown": "confidence-interval-deconstruct", "representation": "equation", "syllabus": ["4.16"], "levels": [3], "skills": ["AI-AHL4.16.find-interval", "AI-AHL4.16.interpret-interval"], "format": "value", "calculator": false, "title": "Recover a sample mean and margin from the interval", "source": "ai-hl-2025-may-tz2-p1-q06.c", build({rng}) {
const m=rng.int(22,70),r=rng.int(2,8),test=m+rng.int(-12,12);
return Q({m,r,test},`A confidence interval for the mean measured output is $[${m-r},\\,${m+r}]$. A report suggests the mean is ${N(test)}.`,[
 P("Find the point estimate of the population mean.",2,ans.int(m),[`The point estimate is the midpoint, ${N(m)}.`]),
 P("Find the margin of error.",2,ans.int(r),[`Half the interval width is ${N(r)}.`]),
 P("Comment on the suggested mean using the interval.",1,ans.self(Math.abs(test-m)>r?"The suggested mean lies outside the interval, so it is not consistent with this interval estimate.":"The suggested mean lies inside the interval, so it is consistent with this interval estimate."),["Compare the value with both interval endpoints. An interval does not prove a population mean exactly."])
]);
  }}]);
  E.registerAll({ }, [{"home": "ai-hl", "type": "t4-scale-poisson-change-rate-and-mix", "unknown": "poisson-change-rate-and-mix", "representation": "words", "syllabus": ["4.17"], "levels": [4], "skills": ["AI-AHL4.17.rescale-mean", "AI-AHL4.17.sum-of-poissons", "AI-AHL4.17.poisson-probability"], "format": "value", "calculator": true, "title": "Combine independent Poisson counts with unequal exposure", "source": "ai-hl-2026-may-tz2-p2-q05.c", build({rng}) {
const a=rng.int(14,37)/10,b=rng.int(10,27)/10,t=rng.pick([2,3]),j=rng.int(3,6),la=a*t,lb=b,lam=la+lb,
  exact=pp(lam,j),zero=Math.exp(-lam),atleast=1-zero;
return Q({a,b,t,j},`Two independent sensors record events according to Poisson models. Sensor A averages ${N(a)} per hour and is active for ${N(t)} hours. Sensor B averages ${N(b)} per hour and is active for one hour.`,[
 P("Find the mean of the combined count.",2,ans.sf(lam),[`Rescale the first mean to its active duration, then add the two means: $${sf(lam)}$.`]),
 P(`Find the probability that the combined count is exactly ${N(j)}.`,2,ans.sf(exact),[`Use a Poisson model with the combined unrounded mean. The point probability is $${sf(exact)}$.`]),
 P("Find the probability of at least one event in the combined count.",2,ans.sf(atleast),[`Subtract the probability of zero events from one to get $${sf(atleast)}$.`])
]);
  }}]);
  E.registerAll({ }, [{"home": "ai-hl", "type": "t4-scale-critical-region-from-tail-table", "unknown": "critical-region-from-tail-table", "representation": "table", "syllabus": ["4.18"], "levels": [3], "skills": ["AI-AHL4.18.critical-region", "AI-AHL4.18.error-probability"], "format": "value", "calculator": false, "title": "Read the minimum rejection count from a discrete tail table", "source": "ai-hl-2024-may-tz1-p3-q01.f", build({rng}) {
const n=rng.pick([8,10,12,14]),p=rng.pick([.2,.25,.3,.35,.4,.45]),level=.05;
let k=1;while(bc(n,p,k,n)>level)k++;
const old=fix(bc(n,p,k-1,n),4),good=fix(bc(n,p,k,n),4),next=fix(bc(n,p,k+1,n),4);
return Q({n,p,k},`A one-sided test rejects for sufficiently large values of a count $X$. Use the rounded reference tail probabilities in the table as given. The significance level is $5\\%$.`,[
 P("Find the smallest rejecting count.",2,ans.int(k),[`The smallest displayed count with tail probability at most the significance level is ${N(k)}.`]),
 P("Find the attained probability of rejecting a true baseline hypothesis. Use the table entry as given.",2,ans.dec(good),[`This is the tail probability at the minimum rejecting count: ${N(good)}.`]),
 P(`What is the decision if ${N(k-1)} is observed?`,1,ans.self("Do not reject the baseline hypothesis."),["This count falls below the critical region."])
],{table:tb(["Count","Null probability of at least this count"],[[N(k-1),N(old)],[N(k),N(good)],[N(k+1),N(next)]])});
  }}]);
  E.registerAll({ }, [{"home": "ai-hl", "type": "t4-scale-markov-two-step-bridge", "unknown": "markov-two-step-bridge", "representation": "table", "syllabus": ["4.19"], "levels": [4], "skills": ["AI-AHL4.19.n-step", "AI-AHL4.19.sequence-probability"], "format": "value", "calculator": true, "title": "Compare returning to a state with remaining there", "source": "ai-hl-2025-may-tz2-p2-q07.b", build({rng}) {
const a=rng.int(34,77)/100,b=rng.int(17,58)/100;
const stay=a*a,returning=(1-a)*b,end=stay+returning,cond=returning/end;
const table=tb(["Current state","Next East","Next West"],[["East",N(a),N(fix(1-a))],["West",N(b),N(fix(1-b))]]);
return Q({a,b},"A shuttle is initially at East. Its next location depends only on its current location, according to the table.",[
 P("Find the probability it is at East on each of the next two steps.",2,ans.sf(stay),[`Multiply the East-to-East probability by itself, giving $${sf(stay)}$.`]),
 P("Find the probability it is at East after exactly two steps, regardless of the intermediate location.",2,ans.sf(end),[`Add the probabilities of the two paths ending at East. The sum is $${sf(end)}$.`]),
 P("Given that it is at East after two steps, find the probability it visited West at the intermediate step.",2,ans.sf(cond),[`Divide the probability of the East-West-East path by the total probability of ending at East: $${sf(cond)}$.`])
],{table});
  }}]);
  E.registerAll({ }, [{"home": "aa-sl", "type": "t4-scale-median-append-extreme", "unknown": "median-append-extreme", "representation": "terms", "syllabus": ["4.3"], "levels": [1], "skills": ["SL4.3.mean-median-mode"], "format": "value", "calculator": false, "title": "Predict which median changes after appending one extreme observation", "source": "aa-sl-2026-may-tz2-p2-q01.b", build({rng}) {
const a=rng.int(8,27),b=a+rng.int(2,8),c=b+rng.int(1,10),d=c+rng.int(1,7),e=d+rng.int(1,10),f=e+rng.int(20,45);
const data=[a,b,c,d,e],m=(c+d)/2;
return Q({data,f},`The ordered data are $${data.join(",\\ ")}$. Then ${N(f)}, a new largest observation, is added.`,[
 P("Find the original median.",1,ans.int(c),[`The third value is the middle value, ${N(c)}.`]),
 P("Find the new median.",1,ans.dec(m),[`The six observations have two middle values. Average ${N(c)} and ${N(d)} to get ${N(m)}.`])
]);
  }}]);
  E.registerAll({ }, [{"home": "aa-sl", "type": "t4-scale-normal-conditional-visual", "unknown": "normal-conditional-visual", "representation": "graph", "syllabus": ["4.9"], "levels": [2], "skills": ["SL4.9.normal-probability", "SL4.9.central-interval", "SL4.9.symmetry-probability"], "format": "mcq", "calculator": false, "title": "Select a shaded component of a central normal region", "source": "aa-sl-2025-nov-tz1-p2-q02.b", build({rng}) {
const c=rng.int(30,60),s=rng.pick([2,3,4]),l=c-4*s,r=c+4*s,a=c+s,b=c-s;
const ys=Array.from({length:161},(_,i)=>{const u=l+(r-l)*i/160;return [u,Math.exp(-(((u-c)/s)**2)/2)/(s*Math.sqrt(2*Math.PI))];});
const g=(u,v)=>({graph:{x:[l,r],y:[0,.48/s],xStep:s,yStep:1,
  functions:[{fn:{type:"pwl",points:ys}}],regions:[{fn:0,x:[u,v]}],yLabel:" ",alt:"A normal curve with an interval shaded"},value:[u,v]});
const k=rng.int(12,43)/100;
const choice=(u,v,why)=>({text:`$${u}<X<${v}$`,value:[u,v],why});
return Q({c,s,a,b,k},`The normal variable $X$ has mean ${N(c)}. Its central interval $[${b},\\, ${a}]$ has probability ${N(k)}.`,[
 P("Which inequality describes the shaded part of the graph?",2,ans.choice(rng,choice(b,c),[
  choice(c,a,"The highlighted interval is to the left of the mean."),
  choice(b,a,"The event stops at the mean, not the upper cut-off."),
  choice(l,b,"The outer tail is not shaded.")
 ]),["Use the lower cut-off and the mean as the two bounds."]),
 P("Find the probability of the shaded part.",2,ans.dec(fix(k/2)),[`The mean cuts this symmetric interval into two equally probable parts, each with probability ${N(fix(k/2))}.`])
],{graph:g(b,c).graph});
  }}]);
})(typeof globalThis==="undefined"?this:globalThis);
