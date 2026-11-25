/* Topic 4, second original variety wave. Loaded by the native practice registry. */
(function(root){
"use strict";
const E=root.QBEngine,{ans:A,fmt:F}=E,{num,frac,sf}=F,T=String.raw;
const N=x=>T`$${num(x)}$`,P=(prompt,marks,answer,...working)=>({prompt,marks,answer,working});
const Q=(params,stem,parts,table)=>({params,stem,parts,...(table?{table}:{})});
const table=(head,rows)=>({head,rows}),row=(...v)=>v.map(x=>typeof x==="number"?N(x):x);
const val=(text,value,why)=>({text,value,why});
const choice=(r,c,d)=>A.choice(r,c,d);
const rg=(slug,title,home,code,level,representation,skills,build,calculator=false,niceOk=false)=>E.register({type:"t4-wave2-"+slug,title,home,syllabus:[code],levels:[level],skills,unknown:"solve",representation,format:"value",source:"original-wave2",build,calculator,niceOk});
const S="aa-sl",I="ai-sl",H="ai-hl";
// Integrate the normal density's convergent power series; these generated z-scores are small.
function phi(z){
 let term=z,sum=term;
 for(let i=1;i<=40;i++){term*=-z*z*(2*i-1)/(2*i*(2*i+1));sum+=term;}
 return .5+sum/Math.sqrt(2*Math.PI);
}
rg("repair-disproportionate-sample","Correct an overall estimate when strata are over- and undersampled",S,"4.1",4,"table",["SL4.1.bias-reliability","SL4.1.stratified-numbers"],({rng:r})=>{
 const n1=r.int(12,21),n2=r.int(22,32),w1=r.int(6,10),w2=r.int(14,23),a=r.int(2,5),b=r.int(n2-7,n2-2),n=n1*w1+n2*w2,h=a*w1+b*w2;
 return Q({n1,n2,w1,w2,a,b}, "Two depots each took a simple random sample to estimate what fraction of their combined workforce cycles to work. The two depots sampled at different rates.",[
  P("Use the depot sample proportions and workforce sizes to estimate the overall number of cyclists.",3,A.int(h),T`Each sampled worker represents $${w1}$ workers at A and $${w2}$ at B, respectively. Thus the estimated numbers of cyclists are $${a}\times${w1}$ and $${b}\times${w2}$. Their sum is $${h}$.`),
  P("Find the estimated fraction of the combined workforce that cycles. Give an exact fraction.",2,A.frac(h,n),T`Divide the estimated total by the whole workforce, not by the sample size: $${frac(h,n)}$.`),
  P("What happens if the raw sample cyclist proportion is used instead?",2,choice(r,val("It underestimates the weighted estimate.","under"),[val("It overestimates the weighted estimate.","over"),val("It gives the same estimate.","same")]),"The depot with more cyclists proportionally is underrepresented in the sample, so the raw sample proportion is too low.")
 ],table(["Depot","Workforce","Sample size","Cyclists in sample"],[row("A",n1*w1,n1,a),row("B",n2*w2,n2,b)]));
},true,true);
rg("histogram-split-bins","Read a cutoff inside a histogram bar before estimating a percentile",S,"4.2",4,"table",["SL4.2.frequency-histogram","SL4.2.cumfreq-quartiles"],({rng:r})=>{
 const a=r.int(3,8)*2,b=r.int(4,11)*2,c=r.pick([5,6,7,8,9,10,11,12,13].filter(u=>u*2!==a))*2,d=r.int(2,5),e=r.int(5,8),f=r.int(2,6),x=a+b/2,n=a*d+b*e+c*f,at=a*d+b*e/2,rank=Math.ceil((100*at/n+100*(a*d+b*e)/n)/2),target=rank*n/100,l=a+(target-a*d)/e;
 return Q({a,b,c,d,e,f,x,rank},"Use this frequency-density histogram summary. Within each class, estimate frequencies by assuming the observations are evenly spread.",[
  P(T`Estimate the percentage of observations below $${x}$.`,3,A.sf(100*at/n),T`The first bar contributes $${a*d}$ observations, and half the middle bar contributes $${b*e/2}$. Divide $${at}$ by the full area $${n}$ and multiply by $100$: approximately $${sf(100*at/n)}\%$.`),
  P(T`Estimate the $${rank}\%$ quantile, the value below which about $${rank}\%$ of observations lie.`,3,A.sf(l),T`The target cumulative count is $${num(target)}$, inside the middle class. The first bar accounts for $${a*d}$; at density $${e}$ the additional width is $\dfrac{${num(target)}-${a*d}}{${e}}$. Add $${a}$ to obtain $${sf(l)}$.`)
 ],table(["Class interval","Frequency density"],[[T`$0\leq x<${a}$`,N(d)],[T`$${a}\leq x<${a+b}$`,N(e)],[T`$${a+b}\leq x<${a+b+c}$`,N(f)]]));
},true);
rg("conditional-removal-reversal","Use a random removal before observing a two-draw result",S,"4.6",4,"words",["SL4.6.tree","SL4.6.conditional-diagram"],({rng:r})=>{
 const a=r.int(4,10),b=r.int(3,10),d=a+b,w=(d-1)*(d-2),rr=(a-1)*(a-2),rb=a*(a-1),total=a*rr+b*rb,den=d*w;
 return Q({a,b},T`A pouch starts with $${a}$ amber beads and $${b}$ blue beads. One bead is removed at random and hidden. Two more beads are then drawn without replacement.`,[
  P("Find the probability that both later beads are amber. Give an exact fraction.",4,A.frac(total,den),T`If amber was hidden, the conditional probability is $${frac(rr,w)}$; if blue was hidden, it is $${frac(rb,w)}$. Weight these by $${frac(a,d)}$ and $${frac(b,d)}$ to get $${frac(total,den)}$.`),
  P("Given that both later beads are amber, find the probability that the hidden bead is blue. Give an exact fraction.",3,A.frac(b*rb,total),T`Among all outcomes with two later amber beads, keep only the branch that first hides blue. The ratio is $${frac(b*rb,total)}$.`)
 ]);
},true,true);
rg("capped-payout-expectation","Compare a cap and an uncapped charge under the same distribution",S,"4.7",4,"table",["SL4.7.table-probabilities","SL4.7.expected-value","SL4.7.fair-game"],({rng:r})=>{
 const d=r.int(19,28),a=r.int(3,6),b=r.int(3,6),c=r.int(2,5),w=d-a-b-c,m=r.int(3,7),j=r.int(2,5),u=m+j+r.int(4,8),cap=m+r.int(1,j-1);
 const fee=r.int(1,2),free=a*m+b*(m+j)+c*u,limited=(a*m+(b+c)*cap)+d*fee;
 return Q({d,a,b,c,m,j,u,cap,fee},"The table shows the random cost of damage to a hire bicycle, in points. A waiver instead charges a fixed fee plus the damage cost capped at the stated amount.",[
  P(T`Without the waiver, find the expected cost exactly.`,2,A.frac(free,d),T`Multiply each damage cost by its probability and add: $${frac(free,d)}$.`),
  P(T`The waiver costs $${fee}$ points and caps the damage charge at $${cap}$ points. Find its expected total cost exactly.`,3,A.frac(limited,d),T`Use the original cost below the cap and $${cap}$ for both higher costs, then add the fee for every outcome: $${frac(limited,d)}$.`),
  P("Find the probability that the waiver is strictly cheaper on an individual hire. Give an exact fraction.",2,A.frac((m+j>cap+fee?b:0)+c,d),T`Compare the uncapped cost with capped cost plus fee in each row. Keep only the outcomes with uncapped cost strictly greater, giving $${frac((m+j>cap+fee?b:0)+c,d)}$.`)
 ],table(["Damage cost","Probability"],[[N(0),T`$${frac(w,d)}$`],[N(m),T`$${frac(a,d)}$`],[N(m+j),T`$${frac(b,d)}$`],[N(u),T`$${frac(c,d)}$`]]));
},true,true);
function ranks(xs){
 const sorted=xs.slice().sort((a,b)=>a-b);
 return xs.map(x=>(sorted.indexOf(x)+sorted.lastIndexOf(x)+2)/2);
}
function correlation(x,y){
 const avg=a=>a.reduce((s,b)=>s+b,0)/a.length;
 const u=avg(x),v=avg(y);
 return x.reduce((s,a,i)=>s+(a-u)*(y[i]-v),0)/Math.sqrt(x.reduce((s,a)=>s+(a-u)**2,0)*y.reduce((s,a)=>s+(a-v)**2,0));
}
rg("spearman-transform-one-score","Separate rank invariance from a genuine rank change",I,"4.10",3,"table",["AI-SL4.10.rank-data","AI-SL4.10.calculate-rs","AI-SL4.10.compare-with-r"],({rng:r})=>{
 const o=r.int(7,35),d=r.int(2,7),p=r.int(8,29),e=r.int(2,6),ord=r.pick([[0,1,1,3,4,5],[0,2,2,1,4,5],[0,1,1,4,3,5],[1,2,2,0,4,5]]),x=ord.map((_,i)=>o+d*i),y=ord.map(v=>p+e*v),a=r.int(2,4),b=r.int(1,8),y2=y.slice(),i=r.pick([1,2]),h=r.int(1,3);
 y2[i]=p+(5+h)*e;
 const u=Number(correlation(ranks(x),ranks(y)).toFixed(3)),old=ranks(y),next=ranks(y2),other=i===1?2:1;
 return Q({x,y,a,b,i,newY:y2[i]},T`Two devices measured the same six samples. Rank the smallest value first; average ranks for ties. The original Spearman coefficient, reported to three decimal places, is $${num(u)}$.`,[
  P(T`Device Y converts all its old readings to new display units by $y' = ${a}y+${b}$. Give the reported Spearman coefficient after conversion.`,2,A.dec(u),"The conversion is strictly increasing. The order of readings and all ties stay the same, so the displayed rank correlation is unchanged."),
  P(T`Instead discard the unit conversion. Sample $${i+1}$'s original Y reading is corrected to $${y2[i]}$. By how many rank positions does that sample move up in Y? Give an exact value.`,2,A.frac(2*(next[i]-old[i]),2),T`The corrected reading becomes the largest, breaking the tie. Its rank moves from $${num(old[i])}$ to $${next[i]}$.`),
  P(T`What is the new Y rank of sample $${other+1}$?`,1,A.int(next[other]),T`Only one of the original tied readings moved. Re-rank the unchanged reading among the new values to obtain rank $${next[other]}$.`)
 ],table(["Sample","Device X","Device Y"],x.map((u,j)=>row(j+1,u,y[j]))));
});
rg("test-observed-direction","Choose the correct one-sided p-value from a two-sided output",I,"4.11",3,"words",["AI-SL4.11.hypotheses","AI-SL4.11.two-sample-t-test","AI-SL4.11.conclusion"],({rng:r})=>{
 const a=r.int(28,76)/10,d=r.int(5,23)/10,s=r.pick([-1,1]),two=r.pick([r.int(32,99),r.int(101,179)])/1000,l=r.pick([1,5,10]),high=a+s*d,one=Number((s>0?two/2:1-two/2).toFixed(4)),reject=one<l/100;
 return Q({a,high,two,l},T`A team pre-registered a test of whether coating A gives a higher population mean output than coating B. The independent samples satisfy the conditions for a pooled two-sample $t$-test. Sample means are $${num(high)}$ for A and $${num(a)}$ for B. The software was accidentally set to “not equal” and reports $p=${num(two)}$ (use this value exactly).`,[
  P("Recover the exact one-sided p-value for the pre-registered alternative.",3,A.dec(one),T`The two-sided p-value covers both tails equally. The sample difference points ${s>0?"towards":"away from"} the alternative. ${s>0?"Halve the p-value.":"Take one minus half the p-value."} This gives $${num(one)}$.`),
  P(T`At the $${l}\%$ level, choose the correct conclusion.`,2,choice(r,reject?val("There is evidence that coating A gives a higher population mean output.","reject"):val("There is insufficient evidence that coating A gives a higher population mean output.","retain"),[reject?val("There is insufficient evidence that coating A gives a higher population mean output.","retain"):val("There is evidence that coating A gives a higher population mean output.","reject"),val("The two population means have been shown to be equal.","equal")]),T`Compare the one-sided p-value with $${num(l/100)}$. ${reject?"There is sufficient evidence for a higher population mean.":"The data do not support a higher population mean; this does not establish equality."}`)
 ]);
},false);
rg("test-retest-versus-calibration","Diagnose a stable calibration error without mistaking reliability for validity",H,"4.12",3,"table",["AI-AHL4.12.reliability","AI-AHL4.12.validity"],({rng:r})=>{
 const a=r.int(21,45),d=r.int(4,8),e=r.int(7,12),b=r.int(3,9),k=r.pick([-1,1]),j=r.int(0,1);
 const ref=[a,a+d,a+d+e],one=ref.map(v=>v+k*b),two=one.map((v,i)=>v+(i===j?1:0));
 return Q({ref,one,two},"A new bench sensor is tested on three fixed masses. Over the two runs the masses and conditions did not change. Reference readings come from accepted calibration standards. The intended use needs absolute readings within one unit.",[
  P("Find the mean signed error (first-run measurement minus reference).",2,A.int(k*b),T`First-run errors are identical: the sensor reads $${b}$ units ${k>0?"too high":"too low"} on all three standards, giving signed mean error $${k*b}$.`),
  P("Which diagnosis is supported by these data for this use?",3,choice(r,val("Good test–retest reliability but poor agreement with the external criterion.","reliable-only"),[val("Poor test–retest reliability with good agreement with the criterion.","valid-only"),val("Good test–retest reliability and good agreement with the criterion.","both"),val("Poor test–retest reliability and poor agreement with the criterion.","neither")]),"The runs agree to within one unit, but are systematically far from the independent references.")
 ],table(["Standard","Reference","First run","Second run"],ref.map((x,i)=>row(i+1,x,one[i],two[i]))));
});
rg("held-out-residual-check","Select a model using separate held-out observations",H,"4.13",3,"table",["AI-AHL4.13.ssres","AI-AHL4.13.r-squared","AI-AHL4.13.compare-models"],({rng:r})=>{
 const scale=r.int(2,7),start=r.int(5,11),d=r.int(2,5),startY=r.int(25,45),rA=r.int(1,4),rB=r.int(5,8),side=r.pick([-1,1]),r1=r.int(84,92),r2=r.int(94,99);
 const observed=Array.from({length:3},(_,i)=>startY+scale*i*i),x=observed.map((_,i)=>start+d*i),pa=observed.map((y,i)=>y+side*([1,rA,2][i])),pb=observed.map((y,i)=>y+side*([rB,4,5][i]));
 const ss=q=>observed.reduce((s,y,i)=>s+(y-q[i])**2,0);
 return Q({x,observed,pa,pb,r1,r2},T`Quadratic model A and cubic model B were fitted to the same training data. Training $R^2$ was $${num(r1/100)}$ for A and $${num(r2/100)}$ for B. Predictive performance will be judged by sum of squared residuals on the separate held-out data shown.`,[
  P("Find the held-out sum of squared residuals for model A.",2,A.int(ss(pa)),T`Subtract each prediction from its observed value, square each residual, then sum: $${ss(pa)}$.`),
  P("Find the held-out sum of squared residuals for model B.",2,A.int(ss(pb)),T`The sum of squares from the other prediction column is $${ss(pb)}$.`),
  P("Which model is better according to the stated predictive criterion?",1,choice(r,val("Model A, because its held-out error is smaller.","A"),[val("Model B, because its training $R^2$ is larger.","B"),val("Neither; the held-out errors are equal.","tie")]),"The higher training $R^2$ does not imply better prediction on separate observations.")
 ],table(["Input","Observed","Model A prediction","Model B prediction"],x.map((u,i)=>row(u,observed[i],pa[i],pb[i]))));
});
rg("paired-independent-contrasts","Distinguish systematic shifts from independent variation",H,"4.14",2,"words",["AI-AHL4.14.linear-combination","AI-AHL4.14.linear-transformation"],({rng:r})=>{
 const a=r.int(10,18),b=r.int(3,9),sdA=r.int(2,6),sdB=r.int(1,5),k=r.int(2,4),c=r.int(3,8),m=a-k*b+c,v=sdA**2+(k*sdB)**2;
 return Q({a,b,sdA,sdB,k,c},T`Independent random measurements $X$ and $Y$ have means $${a}$ and $${b}$, with standard deviations $${sdA}$ and $${sdB}$ respectively. A contrast is defined as $D=X-${k}Y+${c}$.`,[
  P(T`Find the expected value of $D$.`,2,A.int(m),T`Use linearity: $${a}-${k}(${b})+${c}=${m}$.`),
  P(T`Find the variance of $D$.`,2,A.int(v),T`The constant adds no variance. Independence removes covariance, so use $${sdA}^2+${k}^2(${sdB}^2)=${v}$, not a difference of variances.`)
 ]);
});
rg("two-normal-batches-disagree","Find the chance that one sample mean exceeds another",H,"4.15",4,"words",["AI-AHL4.15.normal-combination","AI-AHL4.15.sample-mean"],({rng:r})=>{
 const m=r.int(18,48),delta=r.int(2,7)/2,s=r.int(6,13),t=r.int(5,12),n=r.pick([4,9,16,25]),j=r.pick([9,16,25,36]),gap=r.int(1,4),v=s*s/n+t*t/j,z=(gap-delta)/Math.sqrt(v),p0=1-phi(z);
 return Q({m,delta,s,t,n,j,gap},T`Independent samples from normal processes A and B contain $${n}$ and $${j}$ measurements respectively. The population means are $${num(m+delta)}$ and $${m}$; population standard deviations are $${s}$ and $${t}$. Let $D$ be the mean of sample A minus the mean of sample B.`,[
  P(T`Find the standard deviation of $D$.`,2,A.sf(Math.sqrt(v)),T`The sample means are independent. Their variances add in the difference, giving standard deviation $\sqrt{\dfrac{${s}^2}{${n}}+\dfrac{${t}^2}{${j}}}\approx${sf(Math.sqrt(v))}$.`),
  P(T`Find $\mathrm{P}(D>${gap})$.`,3,A.sf(p0),T`The difference is exactly normal with mean $${num(delta)}$. Use the upper tail with standard deviation from (a), obtaining $${sf(p0)}$.`)
 ]);
},true);
rg("confidence-precision-tradeoff","Trade measurement precision for a higher confidence level",H,"4.16",3,"words",["AI-AHL4.16.find-interval","AI-AHL4.16.interval-conditions"],({rng:r})=>{
 const sigma=r.int(11,32),m=r.int(23,51),n=r.pick([25,36,49,64,81]),root=Math.sqrt(n),ci=r.pick([[90,165,95,196],[90,165,99,258],[95,196,99,258]]),[l,z1,h,z2]=ci;
 const boundary=sigma*z1/z2, candidate=Math.floor(boundary)+r.int(0,2),ok=candidate<=boundary;
 return Q({sigma,m,n,l,z1,h,z2,candidate},T`For one normal-population study, the sample size is $${n}$, the sample mean is $${m}$ and the population standard deviation is known to be $${sigma}$. For this exercise take the critical values for $${l}\%$ and $${h}\%$ central intervals to be $${num(z1/100)}$ and $${num(z2/100)}$ exactly.`,[
  P(T`Give the exact margin of error for the $${l}\%$ interval.`,2,A.frac(z1*sigma,100*root),T`The standard error is $${frac(sigma,root)}$. Multiplying by the stated critical value gives margin $${frac(z1*sigma,100*root)}$.`),
  P(T`A new instrument leaves the population normal and sample size unchanged, but changes the known standard deviation. Find the largest standard deviation it can have so that the $${h}\%$ interval is no wider than the old interval. Give an exact fraction.`,3,A.frac(z1*sigma,z2),T`Match the two margins. Since the sample sizes cancel, the new standard deviation cannot exceed $${frac(z1*sigma,z2)}$.`),
  P(T`Would an instrument with standard deviation $${candidate}$ satisfy the requirement?`,1,choice(r,ok?val("Yes.","yes"):val("No.","no"),[ok?val("No.","no"):val("Yes.","yes"),val("There is not enough information to decide.","unknown")]),T`Compare $${candidate}$ with the upper limit from (b). ${ok?"It meets":"It exceeds"} the limit.`)
 ]);
});
rg("poisson-separate-windows","Account for an overlap before combining Poisson counts",H,"4.17",3,"words",["AI-AHL4.17.poisson-probability","AI-AHL4.17.rescale-mean","AI-AHL4.17.sum-of-poissons"],({rng:r})=>{
 const a=r.int(3,7),b=r.int(3,8),c=r.int(3,9),k=r.int(3,8),rate=k/4;
 const count=(label,total)=>val(T`$${num(total)}$: ${label}`,total);
 return Q({a,b,c,k},T`Events follow a homogeneous Poisson process at mean rate $${num(rate)}$ per minute, with independent counts in disjoint windows. Recorder A runs from minute $0$ to $${a+b}$, and B runs from minute $${a}$ to $${a+b+c}$. Both record all events during their active windows.`,[
  P("Find the mean number of events that appear in both logs.",2,A.frac(b*k,4),T`Only the shared $${b}$-minute interval can contribute duplicates. Multiply that duration by the rate, giving $${frac(b*k,4)}$.`),
  P("Find the mean number of distinct events logged, counting a duplicated event only once.",2,A.frac((a+b+c)*k,4),T`Use the full union of the windows, a duration of $${a+b+c}$ minutes. Multiplying by the rate gives $${frac((a+b+c)*k,4)}$.`),
  P("Which mean parameter should be used to model the probability of no distinct events in either record?",2,choice(r,count("the mean over the union",(a+b+c)*rate),[count("the mean over the overlap",b*rate),count("the sum of both individual recorder means",(a+2*b+c)*rate)]),"Zero distinct detections means no events anywhere in the union. Do not count the shared window twice.")
 ]);
});
rg("markov-recover-transition","Recover a missing transition by comparing two starting states",H,"4.19",3,"words",["AI-AHL4.19.transition-matrix","AI-AHL4.19.n-step"],({rng:r})=>{
 const x=r.int(2,8),y=r.pick([2,3,4,5,6,7,8].filter(v=>v!==x)),a=r.int(1,6),b=r.int(1,6),p=x/10,q=y/10,f=p*p+(1-p)*q;
 return Q({x,y,a,b},T`A two-state Markov chain has states A and B. Starting in A, the probability of being in A after one step is $${num(p)}$; the probability of being in A after two steps is $${num(Number(f.toFixed(2)))}$. Transitions are the same at every step.`,[
  P("Find the one-step transition probability from B to A.",3,A.dec(q),T`The two paths A→A→A and A→B→A add to $${num(Number(f.toFixed(2)))}$. Set $${num(p)}^2+(1-${num(p)})q=${num(Number(f.toFixed(2)))}$, giving $q=${num(q)}$.`),
  P(T`A different initial distribution has A and B in the ratio $${a}:${b}$. Find the exact probability of being at A after one step.`,2,A.frac(a*x+b*y,10*(a+b)),T`Weight the two one-step probabilities by their initial state probabilities, giving $${frac(a*x+b*y,10*(a+b))}$.`)
 ]);
});
})(typeof globalThis==="undefined"?this:globalThis);
