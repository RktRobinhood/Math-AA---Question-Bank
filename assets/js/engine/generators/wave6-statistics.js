/* Original Wave 6 Topic 4: instrument design, comparison and probability structures. */
(function(root){
"use strict";
const E=root.QBEngine,{ans:A,fmt:F}=E,{num,frac,sf}=F,T=String.raw;
const H="ai-hl",I="ai-sl",S="aa-sl";
const sum=x=>x.reduce((a,b)=>a+b,0),seq=n=>Array.from({length:n},(_,i)=>i),label=i=>String.fromCharCode(65+i);
const N=x=>T`$${num(x)}$`,r2=x=>Math.round(100*x)/100;
const P=(prompt,marks,answer,...working)=>({prompt,marks,answer,working});
const C=(r,k,o)=>{const all=o.map(([value,text])=>({value,text}));return A.choice(r,all.find(x=>x.value===k),all.filter(x=>x.value!==k));};
const Q=(params,stem,parts,head,rows)=>({params,stem,parts,...(head?{table:{head,rows:rows.map(z=>z.map(x=>typeof x==="number"?N(x):x))}}:{})});
const reg=(slug,title,home,code,level,representation,skills,build,calculator=false)=>E.register({type:"w6-statistics-"+slug,title,home,syllabus:[code],levels:[level],skills,unknown:"solve",representation,format:"value",source:"original-wave6",build,calculator});
const ph=z=>{
 let term=z,v=z;
 for(let n=1;n<=200;n++){term*=z*z/(2*n+1);v+=term;if(Math.abs(term)<1e-18)break;}
 return .5+v*Math.exp(-z*z/2)/Math.sqrt(2*Math.PI);
};
const upperChi3=x=>2*(1-ph(Math.sqrt(x)))+Math.sqrt(2*x/Math.PI)*Math.exp(-x/2);
const bin=(n,p,k)=>{let x=(1-p)**n;for(let i=1;i<=k;i++)x*=((n-i+1)/i)*p/(1-p);return x;};

reg("validation-across-operating-ranges","Choose a measurement design using repeatability and criterion agreement",H,"4.12",4,"table",["AI-AHL4.12.design-collection","AI-AHL4.12.reliability","AI-AHL4.12.validity"],({rng:r})=>{
 const limit=r.int(3,8),rep=r.int(86,91),d=()=>r.int(1,3),rOK=()=>rep+d(),rFail=()=>rep-d(),near=()=>limit-r.int(0,2),bad=()=>limit+d();
 const confusion=r.bool(),extra=r.bool(),rows=r.shuffle([
  {kind:"both",low:rOK(),high:rOK(),errL:near(),errH:near()},
  {kind:"stable",low:rOK(),high:rOK(),errL:confusion?near():bad(),errH:confusion?bad():near()},
  {kind:"agreement",low:confusion?rFail():rOK(),high:confusion?rOK():rFail(),errL:near(),errH:near()},
  {kind:"fail",low:extra?rOK():rFail(),high:rOK(),errL:bad(),errH:bad()}
 ]);
 const pass=rows.findIndex(z=>z.kind==="both"),stable=rows.findIndex(z=>z.kind==="stable");
 const errors=r.shuffle([-r.int(1,5),-r.int(2,5),-r.int(2,6),0,r.int(2,5),r.int(1,4),r.int(2,6)]),rmse=Math.sqrt(sum(errors.map(x=>x*x))/errors.length);
 return Q({limit,rep,rows,errors},T`A workshop compares four ways to measure belt tension. Each method is tried twice on unchanged belts in both tension ranges. The table reports the test-retest correlation in each range, and the largest absolute error against an independent reference instrument in each range. A method qualifies only if both correlations are at least $${num(rep/100)}$ and neither largest error exceeds $${limit}\,\mathrm{N}$.`,[
  P(T`A separate held-out instrument check has signed errors $${errors.map(num).join(",\\ ")}$ N. Find the root mean squared error, $\sqrt{\dfrac{\sum e_i^2}{7}}$, to three significant figures.`,2,A.sf(rmse),T`Square the errors before averaging; signed errors could cancel. The result is $\sqrt{\dfrac{${sum(errors.map(x=>x*x))}}{7}}\approx${sf(rmse)}\,\mathrm{N}$.`),
  P("Which method qualifies for use across both ranges?",2,C(r,label(pass),rows.map((_,i)=>[label(i),"Method "+label(i)+"."])),T`Only method $${label(pass)}$ passes all four checks. Repeatability and agreement must be checked in both ranges.`),
  P(T`Which claim best describes method $${label(stable)}$ under these rules?`,1,C(r,"stable",[["stable","It meets the repeatability rule but not the criterion-agreement rule."],["valid","It meets the criterion-agreement rule but not the repeatability rule."],["skip","Meeting the repeatability rule means the agreement check can be omitted."]]),"Repeating the method does not check whether its readings agree closely with the independent reference."),
  P("Which follow-up best checks whether a recalibrated method agrees with the external criterion on new belts?",2,C(r,"hold",[["hold","Use new belts in both ranges and compare the recalibrated readings with independent reference measurements."],["reuse","Re-use only the belts used to fit the recalibration."],["repeat","Repeat the recalibrated procedure twice without using the reference."],["one","Check only the range in which the original method performed better."]]),"New belts avoid fitting and validating on the same observations. Both ranges and an independent reference are needed to check the stated use.")
 ],["Method","Low tension","High tension"],rows.map((z,i)=>["Method "+label(i),T`Low: $r=${num(z.low/100)}$, max error $${z.errL}\,\mathrm{N}$`,T`High: $r=${num(z.high/100)}$, max error $${z.errH}\,\mathrm{N}$`]));
},true);

reg("sample-size-before-merging","Plan the smallest goodness-of-fit sample before choosing adjacent merges",H,"4.12",4,"table",["AI-AHL4.12.combine-categories","AI-AHL4.12.reduce-df","AI-SL4.11.expected-frequencies"],({rng:r})=>{
 const a=r.int(2,5),z=a+r.int(1,2),b=r.int(12,17),c=r.int(13,19),e=r.int(18,24),d=100-a-b-c-e-z,w=[a,b,c,d,e,z];
 const variants=[
  {id:"none",weights:w},{id:"left",weights:[a+b,c,d,e,z]},{id:"right",weights:[a,b,c,d,e+z]},{id:"both",weights:[a+b,c,d,e+z]}
 ];
 const minimum=x=>Math.min(...x.weights),needed=x=>Math.floor(500/minimum(x))+1;
 const known=variants[3],fit=variants[1];
 const n=needed(known),expected=known.weights.map(v=>v*n/100),observed=expected.map(Math.floor),
 order=seq(4).sort((i,j)=>(expected[j]-observed[j])-(expected[i]-observed[i]));
 for(let i=0;i<n-sum(expected.map(Math.floor));i++)observed[order[i]]++;
 const statOf=()=>sum(observed.map((v,i)=>(v-expected[i])**2/expected[i]));
 if(r.bool()){
  const target=r.int(0,3),limit=r.int(850,1050)/100;
  for(let i=0;i<n&&statOf()<limit;i++){
   const donors=seq(4).filter(j=>j!==target&&observed[j]>0);
   const donor=donors[r.int(0,donors.length-1)];
   observed[target]++;observed[donor]--;
  }
 }else{
  const i=r.int(0,3),j=(i+r.int(1,3))%4;observed[i]--;observed[j]++;
 }
 const stat=r2(statOf()),p=upperChi3(stat),decision=p<.05?"reject":"retain";
 const choices=[["none","Do not merge."],["left","Merge only the two lowest categories."],["right","Merge only the two highest categories."],["both","Merge both pairs."]];
 return Q({w,stat,observed},T`A manufacturer plans a chi-squared goodness-of-fit study. The table shows planning percentages for six ordered output categories. Before collecting data, the team may merge the lowest two categories, the highest two, both pairs, or neither. It requires at least $3$ degrees of freedom and each expected frequency strictly greater than $5$. For both plans use the displayed percentages when planning the sample size.`,[
  P("Plan F specifies all model parameters independently of the data. Which merge choice gives the smallest allowable sample?",1,C(r,"both",choices),"With no fitted parameters, four groups give three degrees of freedom. Merging both tails removes the two smallest individual probabilities and gives the highest minimum grouped probability."),
  P("Find the smallest whole-number sample size for plan F.",1,A.int(needed(known)),T`The minimum grouped percentage is $${minimum(known)}\%$. Solve $n\times${frac(minimum(known),100)}>5$ and take the smallest integer strictly above the threshold.`),
  P("Plan E estimates one parameter from these data. Which merge choice gives the smallest allowable sample?",1,C(r,"left",choices),T`Now $\mathrm{df}=k-2$, so keeping three degrees of freedom requires at least five groups. The rarer tail is the lowest category, so merge it rather than merging the other tail.`),
  P("Find the smallest whole-number sample size for plan E.",1,A.int(needed(fit)),T`The unmerged highest category is now smallest at $${minimum(fit)}\%$. Use $n\times${frac(minimum(fit),100)}>5$ with a strict inequality.`),
  P(T`The team uses the minimum-sample plan F and obtains $\chi^2=${num(stat)}$. Use technology to find its upper-tail $p$-value to three significant figures.`,2,A.sf(p),T`Plan F has four retained groups and fits no parameters. Evaluate $\mathrm{P}(\chi^2_3\geq${num(stat)})\approx${sf(p)}$.`),
  P(T`Using a $5\%$ significance level, what is the conclusion about the hypothesised fit?`,1,C(r,decision,[["reject","There is sufficient evidence against the hypothesised fit."],["retain","There is insufficient evidence against the hypothesised fit."],["prove","The test proves the model is exactly correct."]]),T`Compare $p$ with $0.05$. Here $p${p<.05?"<":">"}0.05$, so ${p<.05?"reject":"do not reject"} the hypothesised model.`)
 ],["Category (low to high)","Planning percentage"],w.map((v,i)=>[label(i),v]));
},true);

reg("normal-paired-difference","Combine distinct independent normal measurements into a difference",H,"4.15",2,"words",["AI-AHL4.15.normal-combination"],({rng:r})=>{
 const b=r.int(44,70),d=r.int(4,12),k=r.int(1,4),a=b+d,offset=r.pick([-8,-6,-4,-2,2,4,6,8]),m=d+offset*k;
 const probability=1-ph(offset/5);
 return Q({a,b,k,m},T`For one matched shipment, the masses $X$ and $Y$ of two separate parcels are independent and normally distributed. $X$ has mean $${a}$ kg and standard deviation $${3*k}$ kg; $Y$ has mean $${b}$ kg and standard deviation $${4*k}$ kg. The signed difference is $D=X-Y$.`,[
  P("Find the mean of $D$ in kg.",1,A.int(d),T`Subtract the means: $${a}-${b}=${d}$.`),
  P("Find the standard deviation of $D$ in kg.",1,A.int(5*k),T`The variances add under independence, even for a difference: $\sqrt{${3*k}^2+${4*k}^2}=${5*k}$.`),
  P(T`Find $\mathrm{P}(D>${num(m)})$ to three significant figures.`,2,A.sf(probability),T`The standardised threshold is $z=${num(offset/5)}$. Use the upper tail of the normal distribution, giving $\mathrm{P}(D>${num(m)})\approx${sf(probability)}$.`)
 ]);
},true);

reg("confidence-label-recovery","Recover confidence levels from two intervals from the same sample",H,"4.16",2,"table",["AI-AHL4.16.interpret-interval"],({rng:r})=>{
 const mu=r.int(40,80)/2,se=r.int(9,27)/10,sw=r.bool(),a=r2(se*1.7530503557),b=r2(se*2.946712883);
 const wide=sw?"A":"B",narrow=sw?"B":"A",claim=r2(mu+r.pick([-1,1])*(a+b)/2);
 const rows=(sw?[b,a]:[a,b]).map((v,i)=>[label(i),r2(mu-v),r2(mu+v)]);
 return Q({rows,claim},T`Two two-sided one-sample $t$ confidence intervals for a mean processing time (seconds) were calculated from the same sample. One is a $90\%$ interval and the other is a $99\%$ interval. The labels were lost.`,[
  P(T`Which interval is the $99\%$ interval?`,1,C(r,wide,[["A","Interval A."],["B","Interval B."],["unknown","The given intervals do not distinguish the confidence levels."]]),T`On the same sample, the higher confidence level needs the wider interval. Interval $${wide}$ is wider.`),
  P(T`A specification suggests a mean of $${num(claim)}$ seconds. Which of the reported intervals contains this value?`,1,C(r,wide,[["A","Only interval A."],["B","Only interval B."],["both","Both."],["neither","Neither."]]),T`The stated value is outside $${narrow}$ but inside $${wide}$. This is a comparison to the reported endpoints, not a probability that the fixed mean equals the claim.`),
  P("Find the sample mean used in these intervals.",1,A.dec(mu),"The two-sided intervals are symmetric about their common centre, the sample mean.")
 ],["Interval","Reported interval (s)"],rows.map(([id,l,u])=>["Interval "+id,T`$[${num(l)},\ ${num(u)}]$`]));
});

reg("recover-prediction-from-mean-point","Recover a missing coefficient before predicting with the regression of x on y",S,"4.10",2,"words",["SL4.10.mean-point-intersection","SL4.10.predict-x"],({rng:r})=>{
 const xbar=r.int(22,60),ybar=10*r.int(4,9)+5*r.int(0,1),slope=r.int(2,7)/10,d=r.pick([-8,-7,-6,6,7,8]),y=ybar+d;
 const intercept=r2(xbar-slope*ybar),pred=r2(xbar+slope*d);
 return Q({xbar,ybar,slope,y},T`A calibration report gives mean dial setting $\bar{x}=${xbar}$ and mean measured output $\bar{y}=${ybar}$. Its least-squares prediction line for dial setting from measured output is $\widehat x=${num(slope)}y+b$, but the intercept $b$ is unreadable. Output $${y}$ is within the calibration range.`,[
  P("Find the intercept $b$.",2,A.dec(intercept),T`The regression line passes through the mean point. Put $\widehat{x}=${xbar}$ and $y=${ybar}$, giving $b=${num(intercept)}$.`),
  P(T`Predict the dial setting for output $y=${y}$. Give the exact decimal.`,1,A.dec(pred),T`Substitute $y=${y}$ in the completed line. This gives $\widehat{x}=${num(pred)}$.`)
 ]);
});

reg("independence-through-complement","Use split conditional probabilities to test independence and recover a joint probability",S,"4.11",2,"table",["SL4.11.test-independence","SL4.11.multiplication-rule"],({rng:r})=>{
 const n=r.int(3,7),u=r.int(6,13),v=r.bool()?u:u+r.pick([-3,-2,2,3]);
 return Q({n,u,v},T`A lab records whether a device receives a software update (event $B$) and whether it passes a stability check (event $A$). The table gives the group probabilities and the pass probability within each group. Neither group is empty.`,[
  P("Are $A$ and $B$ independent?",1,C(r,u===v?"yes":"no",[["yes","Yes."],["no","No."],["unknown","Not enough information."]]),T`Compare $\mathrm{P}(A\mid B)$ and $\mathrm{P}(A\mid B')$. With both groups present, independence holds exactly when these are equal.`),
  P(T`Find $\mathrm{P}(A\cap B')$ exactly.`,1,A.frac((10-n)*v,200),T`Multiply the probability of the non-updated group by its conditional pass probability: $${frac(10-n,10)}\times${frac(v,20)}=${frac((10-n)*v,200)}$.`),
  P(T`Find $\mathrm{P}(A)$ exactly.`,2,A.frac(n*u+(10-n)*v,200),T`Use the disjoint updated and non-updated groups: $${frac(n*u,200)}+${frac((10-n)*v,200)}=${frac(n*u+(10-n)*v,200)}$.`)
 ],["Update status","Group and pass probabilities"],[["Updated",T`Group: $\mathrm{P}(B)=${frac(n,10)}$; pass: $\mathrm{P}(A\mid B)=${frac(u,20)}$`],["Not updated",T`Group: $\mathrm{P}(B')=${frac(10-n,10)}$; pass: $\mathrm{P}(A\mid B')=${frac(v,20)}$`]]);
});

reg("match-standard-score-across-scales","Compare positions from two Normal models despite reversed raw scores",S,"4.12",2,"table",["SL4.12.standardise"],({rng:r})=>{
 const m2=r.int(42,75),m1=m2+r.int(30,46),s1=2*r.int(2,6),s2=2*r.int(2,6),
 z1=r.pick([-1,-.5,0,.5]),z2=r.pick([1,1.5]),x1=m1+s1*z1,x2=m2+s2*z2,answer=m2+s2*z1;
 return Q({m1,m2,s1,s2,x1,x2},T`Two groups took different versions of a numerical assessment. Scores are modelled by the normal distribution within each version. The table shows one score on each version. A higher standardised score means a higher percentile under its own model.`,[
  P("Find the standardised score for version A.",1,A.dec(z1),T`Subtract the group mean, then divide by its standard deviation: $z_A=\dfrac{${x1}-${m1}}{${s1}}=${num(z1)}$.`),
  P("Which recorded score has the higher percentile in its own version?",1,C(r,"B",[["A","The score on version A."],["B","The score on version B."],["same","They are at the same percentile."]]),T`For B, $z_B=\dfrac{${x2}-${m2}}{${s2}}=${num(z2)}$. It is larger than $z_A$ even though B's raw score is smaller.`),
  P("Which score on version B would match the percentile of the given version A score?",1,A.int(answer),T`Keep $z_A$ and use the mean and standard deviation of version B: $x_B=${m2}+${s2}\times(${num(z1)})=${answer}$.`)
 ],["Version","Model and score"],[["Version A",T`Mean $${m1}$, SD $${s1}$, score $${x1}$`],["Version B",T`Mean $${m2}$, SD $${s2}$, score $${x2}$`]]);
});

reg("cap-and-coalesce-distribution","Rebuild a capped distribution before calculating its mean",S,"4.7",2,"table",["SL4.7.build-distribution","SL4.7.expected-value"],({rng:r})=>{
 const c=r.int(6,12),x=[c-r.int(4,5),c-r.int(1,3),c,c+r.int(2,4),c+r.int(5,8)];
 const a=r.int(3,6),b=r.int(4,8),d=r.int(3,7),e=r.int(3,6),w=[a,b,d,e,32-a-b-d-e],m=sum(x.map((v,i)=>Math.min(c,v)*w[i]));
 return Q({x,w,c},T`The daily demand $X$ for a component has the following distribution. A small store can supply up to $${c}$ components a day, so units actually supplied are $Y=\min(X,${c})$.`,[
  P(T`Find $\mathrm{P}(Y=${c})$ exactly.`,1,A.frac(sum(w.slice(2)),32),T`Demand equal to or above $${c}$ produces the same supplied amount. Add all three probabilities for those demand values.`),
  P("Find the expected number of units supplied per day. Give an exact answer.",2,A.frac(m,32),T`Use distinct supply outcomes $${x[0]},\ ${x[1]},\ ${c}$. Weight the cap by the combined probability, rather than weighting each larger demand by its original size. The mean is $${frac(m,32)}$.`)
 ],["Demand x","Probability"],x.map((v,i)=>[v,T`$${frac(w[i],32)}$`]));
});

reg("binomial-complement-counter","Translate failure-count bounds for a calculator tracking successes",S,"4.8",2,"words",["SL4.8.identify","SL4.8.cumulative-probability"],({rng:r})=>{
 const n=r.int(9,16),s=r.int(6,16),p=s/20,a=r.int(2,n-5),b=a+r.int(2,4),lo=n-b+1,hi=n-a;
 const prob=sum(seq(hi-lo+1).map(i=>bin(n,p,lo+i)));
 return Q({n,s,a,b},T`Each of $${n}$ independently checked devices passes with probability $${num(p)}$. A calculator screen uses $X$ for the number passing. The reported event specifies failures instead: at least $${a}$ failures but fewer than $${b}$ failures.`,[
  P(T`Write the event as $L\leq X\leq U$. Find the least permitted value $L$.`,1,A.int(lo),T`Failures equal $${n}-X$. Fewer than $${b}$ failures means at most $${b-1}$ failures, so $L=${n}-(${b-1})=${lo}$.`),
  P("Find the greatest permitted value $U$.",1,A.int(hi),T`At least $${a}$ failures means at most $${hi}$ passes.`),
  P("Find the probability of the reported event to three significant figures.",2,A.sf(prob),T`Use $X\sim\mathrm{B}(${n},${num(p)})$ and subtract $\mathrm{P}(X\leq${lo-1})$ from $\mathrm{P}(X\leq${hi})$. This gives $${sf(prob)}$.`)
 ]);
},true);

reg("rank-swap-local-audit","Update Spearman's coefficient when two assigned ranks were transposed",I,"4.10",2,"table",["AI-SL4.10.rank-data","AI-SL4.10.calculate-rs"],({rng:r})=>{
 const n=r.int(5,8),a=r.shuffle(seq(n).map(i=>i+1)),b=r.shuffle(seq(n).map(i=>i+1)),i=r.int(0,n-1),j=(i+r.int(1,n-1))%n;
 const d2=z=>sum(a.map((v,k)=>(v-z[k])**2)),old=d2(b),newB=b.slice();[newB[i],newB[j]]=[newB[j],newB[i]];
 const d=d2(newB),den=n*(n*n-1),numerator=den-6*d;
 return Q({a,b,i,j,old},T`Two judges ranked the same $${n}$ entries with no ties. In the published table, Judge B's ranks on entries $${label(i)}$ and $${label(j)}$ were accidentally interchanged. Only these two entries are shown. The published sum of squared rank differences over all entries was $${old}$. For complete untied ranks use $r_s=1-\dfrac{6\sum d_i^2}{n(n^2-1)}$.`,[
  P("Find the corrected sum of squared rank differences.",2,A.int(d),T`Remove the two old squared differences from $${old}$, then add the squared differences after swapping the two B ranks. Other entries are unchanged; the new sum is $${d}$.`),
  P("Find the corrected Spearman coefficient exactly.",1,A.frac(numerator,den),T`Substitute $\sum d_i^2=${d}$ and $n=${n}$ into the given formula: $r_s=${frac(numerator,den)}$.`)
 ],["Entry","Published ranks"],[i,j].map(k=>["Entry "+label(k),T`A: $${a[k]}$; B: $${b[k]}$`]));
});

reg("chi-square-equal-residuals","Compare contributions from equal raw residuals and different expected counts",I,"4.11",2,"table",["AI-SL4.11.expected-frequencies","AI-SL4.11.chi-squared-independence"],({rng:r})=>{
 const a=r.int(12,22),b=a+r.int(5,12),c=r.int(14,25),d=r.pick([-1,1])*r.int(2,5),swap=r.bool(),a1=swap?b:a,b1=swap?a:b;
 const row=[a1+d,b1-d,c],second=[a1-d,b1+d,c];
 return Q({row,second},T`Two equal-sized groups each chose one of three activity types. The table gives their observed counts. Under independence, a cell with observed count $O$ and expected count $E$ contributes $(O-E)^2/E$ to the chi-squared statistic.`,[
  P("Under independence, find the expected number of type A choices in the first group.",1,A.int(a1),"The two row totals are equal, so split the total for type A equally between them."),
  P("Which first-group cell makes a larger contribution: type A or type B?",2,C(r,swap?"B":"A",[["A","The type A cell."],["B","The type B cell."],["same","They make equal contributions."]]),T`Both squared deviations are $${d*d}$. Divide by the expected counts $${a1}$ and $${b1}$ respectively, so the smaller expected count gives the larger contribution.`),
  P("Find the exact combined contribution of the two type A cells.",1,A.frac(2*d*d,a1),T`The two type A deviations have opposite signs, the same square and the same expected count. Their total is $${frac(2*d*d,a1)}$.`)
 ],["Group","Observed counts"],[row,second].map((z,i)=>[T`Group $${i+1}$`,T`A: $${z[0]}$; B: $${z[1]}$; C: $${z[2]}$`]));
});

reg("poisson-zero-one-ratio","Recover a Poisson rate from adjacent masses, then change the exposure",H,"4.17",2,"words",["AI-AHL4.17.find-parameter","AI-AHL4.17.rescale-mean","AI-AHL4.17.poisson-probability"],({rng:r})=>{
 const r4=r.int(3,13),lambda=r4/4,minutes=r.pick([10,12,15,20]),scale=r.int(2,3),t=minutes*scale,k=r.int(1,4),
 mu=scale*lambda,prob=Math.exp(-mu)*mu**k/seq(k).reduce((z,i)=>z*(i+1),1);
 return Q({r4,minutes,scale,k},T`Printer faults occur at a constant rate, and counts in disjoint time intervals are independent. The number $X$ in $${minutes}$ minutes has a Poisson distribution. The probability of one fault is $${num(lambda)}$ times the probability of no faults.`,[
  P(T`Find the Poisson mean for an interval of $${minutes}$ minutes.`,2,A.dec(lambda),T`For a Poisson mean $\lambda$, $\mathrm{P}(X=1)=\lambda \mathrm{e}^{-\lambda}$ and $\mathrm{P}(X=0)=\mathrm{e}^{-\lambda}$. Their ratio is exactly $\lambda$.`),
  P(T`Find the probability of exactly $${k}$ faults in $${t}$ minutes, to three significant figures.`,2,A.sf(prob),T`Multiply the mean by $${scale}$ for the longer interval, then use $\mathrm{Po}(${num(mu)})$ at $${k}$. The probability is approximately $${sf(prob)}$.`)
 ]);
},true);

})(globalThis);
