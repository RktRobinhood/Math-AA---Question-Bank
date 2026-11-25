/* Original native statistics and probability, Wave 4. */
(function(root){
"use strict";
const E=root.QBEngine,{ans:A,fmt:F}=E,{num,frac,sf}=F,T=String.raw;
const N=x=>T`$${num(x)}$`,P=(prompt,marks,answer,...working)=>({prompt,marks,answer,working});
const Q=(params,stem,parts,table)=>({params,stem:stem+(parts.some(p=>p.answer.sigfigs&&!p.answer.exact)?" Give approximate answers to $3$ significant figures. Keep unrounded values for later parts.":""),parts,...(table?{table}:{})});
const table=(head,rows)=>({head,rows:rows.map(r=>r.map(v=>typeof v==="number"?N(v):v))});
const V=(text,value)=>({text,value});
const largeFraction=(n,d)=>{
 const q=F.rat.Q(n,d);
 return A.frac(q.n,q.d,{display:T`$\dfrac{${num(q.n)}}{${num(q.d)}}$`});
};
const C=(r,k,v)=>A.choice(r,v.find(x=>x.value===k),v.filter(x=>x.value!==k));
const reg=(slug,title,code,level,rep,skills,build,calculator=false,niceOk=false)=>E.register({type:"w4-statistics-"+slug,title,home:"aa-sl",syllabus:Array.isArray(code)?code:[code],...(level===5?{notFor:["ai-sl","ai-hl"]}:{}),levels:[level],skills,unknown:"solve",representation:rep,format:"value",source:"original-wave4",build,calculator,niceOk});
const cdf=z=>{
 if(z===0)return .5;
 if(z>8)return 1;
 if(z< -8)return 0;
 const size=160,step=z/size,f=x=>Math.exp(-x*x/2)/Math.sqrt(2*Math.PI);
 let sum=f(0)+f(z);
 for(let i=1;i<size;i++)sum+=(i%2?4:2)*f(i*step);
 return .5+step*sum/3;
};
const inv=p=>{let lo=-6,hi=6;for(let i=0;i<54;i++){const m=(lo+hi)/2;if(cdf(m)<p)lo=m;else hi=m;}return (lo+hi)/2;};
reg("uniform-numbered-window","Adjust a uniform sample space when a series of tickets is withdrawn","4.5",3,"words",["SL4.5.equally-likely","SL4.5.expected-occurrences","SL4.5.complement"],({rng:r})=>{
 const size=r.int(54,98),a=r.int(11,24),b=a+r.int(9,20),d=r.int(3,7),m=r.int(4,11),eligible=size-b+a-1;
 const hit=Math.floor(size/d)-Math.floor(b/d)+Math.floor((a-1)/d),total=m*eligible;
 return Q({size,a,b,d,m},T`Tickets are numbered from $1$ to $${size}$. All tickets numbered $${a}$ to $${b}$ inclusive are withdrawn. The machine chooses uniformly from the remaining tickets, returning each ticket before the next choice. It flashes if the ticket number is a multiple of $${d}$.`,[
  P("Find the number of remaining tickets.",1,A.int(eligible),T`The removed interval contains $${b}-${a}+1$ tickets. Subtract this from $${size}$.`),
  P("Find the exact probability of a flash on one choice.",2,A.frac(hit,eligible),T`Count the retained multiples using the blocks before and after the withdrawal. There are $${Math.floor((a-1)/d)}$ and $${Math.floor(size/d)-Math.floor(b/d)}$ in the two blocks, so the probability is $${frac(hit,eligible)}$.`),
  P(T`Find the expected number of choices without a flash in $${total}$ choices.`,2,A.int(m*(eligible-hit)),T`Multiply the complement from (b) by $${total}$. The result is $${m*(eligible-hit)}$.`)
 ]);
});
reg("empirical-reroute-cap","Plan a limited reroute using two empirical success rates","4.5",4,"table",["SL4.5.relative-frequency","SL4.5.expected-occurrences"],({rng:r})=>{
 const s=r.int(7,14),t=r.int(9,15),lo=r.int(3,6),hi=lo+r.int(4,10),base=r.int(185,275),cap=r.int(21,48),delta=(hi-lo)/20,min=r.int(5,cap-3),
  target=Number((base*lo/20+delta*(min-.43)).toFixed(3)),initial=base*lo/20,max=initial+delta*cap;
 return Q({s,t,lo,hi,base,cap,target},T`A workshop must assign $${base}$ parts to two calibration routes. Historical data are shown. Use each empirical pass rate as the probability for each part sent there, unchanged by the assignment. Route B can take at most $${cap}$ of the parts; the rest go via A.`,[
  P("Estimate the expected number that pass if everything goes via route A.",2,A.sf(initial),T`Use A's historical pass proportion $${frac(lo,20)}$ for the entire order, giving $${sf(initial)}$ passes in expectation.`),
  P(T`Find the smallest whole number to send via route B if at least $${num(target)}$ passes are required in expectation.`,3,A.int(min),T`Moving one part from A to B increases its pass probability by $${num(delta)}$. With $x$ rerouted the expected count is $${num(initial)}+${num(delta)}x$. Solve the target inequality and round $x$ up to $${min}$; this is within the cap.`),
  P("Find the largest expected number of passes under the cap.",2,A.sf(max),T`Route B has the higher pass rate, so use it for all $${cap}$ allowed parts. This gives $${sf(max)}$ expected passes.`)
 ],table(["Route","Parts previously sent","Parts passed"],[["A",s*20,s*lo],["B",t*20,t*hi]]));
},true);
reg("percent-improvement-before-forecast","Revise an expected count after a relative change, not a percentage-point change","4.5",4,"table",["SL4.5.relative-frequency","SL4.5.expected-occurrences","SL4.5.complement"],({rng:r})=>{
 const weights=r.int(5,15),a=r.int(137,246),n=weights*1000,f=weights*a,d=r.int(11,27),c=r.int(400,650),k=r.int(1,19),original=a/1000,revised=original*(1+d/100),naive=original+d/100,round=naive*c-revised*c,req=revised*c+k,ps=a*(100+d),minTotal=c+Math.floor((k*100000+ps-1)/ps);
 return Q({weights,a,d,c,k},T`A ticket desk records the proportion of bookings made through its app. A change is expected to increase that proportion by $${d}\%$ relative to what it was. The next week is expected to have $${c}$ bookings. Assume each booking has the revised app probability.`,[
  P("Find the revised probability that a booking is not made through the app.",2,A.sf(1-revised),T`Multiply the empirical app proportion by $${num(1+d/100)}$, then take the complement: $${sf(1-revised)}$.`),
  P(T`How many more app bookings would be forecast if $${d}\%$ were mistakenly read as a percentage-point increase? Give the difference in expected counts.`,3,A.sf(round),T`The mistaken probability is $${num(naive)}$, the correct probability is $${num(revised)}$. Multiply their difference by $${c}$, giving $${sf(round)}$.`),
  P(T`The desk raises its target by $${k}$ app bookings above the revised expected app count. At the same revised probability, find the smallest whole total number of bookings needed to meet the raised target in expectation.`,2,A.int(minTotal),T`Divide $${num(req)}$ by the revised probability. Round the total bookings up to $${minTotal}$.`)
 ],table(["Historical total","Historical app bookings"],[[n,f]]));
},true);
reg("reference-plus-signed-steps","Move by signed steps from a reference in equal units","4.12",0,"words",["SL4.12.standardise","SL4.12.z-score"],({rng:r})=>{
 const a=r.int(22,67),b=r.int(3,9),k=r.pick([-1,1])*r.int(2,5),x=a+b*k;
 return Q({a,b,k},T`A reference mark on a measuring scale is $${a}$. One unit of shift on this scale changes the reading by $${b}$. A positive shift means moving to a higher reading.`,[
  P(T`Find the reading after a shift of $${k}$ units from the reference.`,2,A.int(x),T`The change in reading is $${k}\times${b}$. Add this signed change to $${a}$ to get $${x}$.`)
 ]);
});
reg("inverse-z-specification","Turn a lower z-score limit into a raw measurement specification","4.12",2,"words",["SL4.12.z-score","SL4.12.standardise"],({rng:r})=>{
 const mean=r.int(40,94),sd=r.int(3,9)*2,z=-r.int(2,5)/2,cut=mean+sd*z,delta=r.int(-5,5),obs=cut+delta;
 return Q({mean,sd,z,obs},T`Measurements are standardised using mean $${mean}$ and standard deviation $${sd}$. The specification accepts any measurement with $z\geq ${num(z)}$.`,[
  P("Find the lowest accepted raw measurement.",2,A.int(cut),T`Reverse the standardisation: $x=${mean}+(${num(z)})(${sd})=${cut}$.`),
  P(T`A raw measurement is $${obs}$. Is it accepted?`,1,C(r,delta>=0?"yes":"no",[V("Yes: it meets the lower specification.","yes"),V("No: it is below the lower specification.","no"),V("It cannot be determined without the probability of the measurement.","unknown")]),T`Its raw value is ${delta>0?"above":delta===0?"equal to":"below"} $${cut}$. The lower cutoff is included.`)
 ]);
});
reg("pair-of-z-stamps","Reconstruct the unlabelled scale from two signed z-scores","4.12",3,"table",["SL4.12.z-score","SL4.12.unknown-mean-and-sd","SL4.12.standardise"],({rng:r})=>{
 const mu=r.int(41,82),u=r.int(3,9),v=-r.int(2,6),w=r.int(2,6),k=r.int(-4,4),x=mu+u*v,y=mu+u*w;
 return Q({mu,u,v,w,k},T`An instrument records raw readings along with their standardised scores. The two printed rows use the same unknown mean and positive standard deviation.`,[
  P("Use both rows to find the standard deviation.",2,A.int(u),T`The change in raw readings is $${y-x}$ and the change in standardised scores is $${w-v}$. Hence the standard deviation is $${u}$.`),
  P("Find the mean used by the instrument.",2,A.int(mu),T`Use $x=\mu+\sigma z$ in either row to identify $\mu=${mu}$.`),
  P(T`Find the raw reading whose standardised score is $${k}$.`,1,A.int(mu+u*k),T`Apply the reconstructed conversion: $${mu}+(${u})(${k})=${mu+u*k}$.`)
 ],table(["Reading","Raw value","Standardised score"],[["First",x,v],["Second",y,w]]));
});
reg("equal-percentile-window","Move a percentile window between normal distributions","4.12",3,"table",["SL4.12.compare-z","SL4.12.standardise"],({rng:r})=>{
 const a=r.int(48,79),b=r.int(102,145),s=r.int(2,7)*2,t=r.int(3,9)*2,z0=-r.int(1,4)/2,z1=r.int(1,5)/2,
  lo=a+s*z0,hi=a+s*z1,b0=b+t*z0,b1=b+t*z1,probe=r.pick([b0-r.int(1,4),b1+r.int(1,4),r.int(b0,b1)]);
 return Q({a,b,s,t,z0,z1,probe},T`Measurements at each studio are normally distributed. Studio A flags its interval $[${lo},${hi}]$. Studio B wants its lower and upper cutoffs to sit at exactly the same respective percentiles as A's cutoffs.`,[
  P("Find the lower cutoff for studio B.",2,A.int(b0),T`The lower cutoff at A has $z=${num(z0)}$. Matching this at B yields $${b}+${t}(${num(z0)})=${b0}$.`),
  P("Find the upper cutoff for studio B.",2,A.int(b1),T`The upper cutoff at A has $z=${num(z1)}$. At B that is $${b1}$.`),
  P(T`Where does a measurement of $${probe}$ at B lie relative to the new interval?`,1,C(r,probe<b0?"low":probe>b1?"high":"inside",[V("Below the interval.","low"),V("Inside the interval.","inside"),V("Above the interval.","high")]),"Compare the raw measurement with the two translated raw cutoffs.")
 ],table(["Studio","Mean","Standard deviation"],[["A",a,s],["B",b,t]]));
});
reg("same-mean-binomial-risk","Compare binomial zero-success risks at one common mean","4.8",2,"words",["SL4.8.mean-variance","SL4.8.exact-probability","SL4.8.binomial-in-context"],({rng:r})=>{
 const n=r.int(2,4),a=r.pick([1,2,3]),d=r.pick([4,5]),flip=r.int(0,1),strong={n,d,p:a},weak={n:2*n,d:2*d,p:a},u=flip?strong:weak,v=flip?weak:strong;
 return Q({n,a,d,flip},T`Two teams investigate a report with independent searches, each of which either finds a relevant record or does not. Team A carries out $${u.n}$ searches with success probability $${frac(u.p,u.d)}$ each. Team B carries out $${v.n}$ searches with success probability $${frac(v.p,v.d)}$ each.`,[
  P("Find the common expected number of successes. Give an exact fraction.",1,A.frac(n*a,d),T`In each case the number of searches times the success probability is $${frac(n*a,d)}$.`),
  P("Find the exact probability that team A gets no success.",2,largeFraction((u.d-u.p)**u.n,u.d**u.n),T`All of A's searches must fail. Multiply the one-search failure probability for each independent search: $\left(${frac(u.d-u.p,u.d)}\right)^{${u.n}}$.`),
  P("Which team is less likely to get no success?",1,C(r,flip?"A":"B",[V("Team A.","A"),V("Team B.","B"),V("The probabilities are equal.","tie")]),T`For each pair of weaker searches, the chance of two failures is $\left(1-\dfrac{p}{2}\right)^2$, which exceeds $1-p$ for a single stronger search with probability $p$. ${flip?"Team A":"Team B"} has the stronger searches.`)
 ]);
});
function predictX(rows,y){
 const n=rows.length,mx=rows.reduce((s,z)=>s+z[0],0)/n,my=rows.reduce((s,z)=>s+z[1],0)/n;
 const covariance=rows.reduce((s,z)=>s+(z[0]-mx)*(z[1]-my),0),varY=rows.reduce((s,z)=>s+(z[1]-my)**2,0);
 return mx+covariance/varY*(y-my);
}
reg("reverse-fit-calibration-flag","Compare x-on-y predictions before and after a suspect point is excluded","4.10",4,"table",["SL4.10.x-on-y-line","SL4.10.choose-line","SL4.10.predict-x"],({rng:r})=>{
 const x0=r.int(23,43)+r.pick([.13,.17,.23,.37,.43,.51,.63,.77]),y0=r.int(14,31),step=r.int(2,5),slope=r.int(2,6)/2,k=r.int(5,12),sign=r.pick([-1,1]),
  rows=[[-3,1],[-1,-1],[1,-1],[3,1]].map(([u,e])=>[x0+slope*step*u+e,y0+step*u]),suspect=[x0+sign*k,y0],full=[...rows,suspect],y=y0+r.pick([-2,-1,1,2])*step,
  all=predictX(full,y),valid=predictX(rows,y),winner=r.int(0,1),observed=Number(((winner?valid:all)+.1*Math.sign(valid-all)).toFixed(3)),closer=Math.abs(observed-valid)<Math.abs(observed-all);
 return Q({rows,suspect,y,observed},"Estimate a missing input value from a known output using regression. One outlying input was recorded at the central output and carries a calibration flag; you will compare fits with and without that pair.",[
  P(T`Using all five reported pairs, predict the input $x$ for output $y=${y}$.`,2,A.sf(all),T`Fit the regression of $x$ on $y$, since $x$ is being predicted. The full-data means are $(${num(x0+sign*k/5)}, \,${y0})$ as $(x,y)$, and the slope for predicting $x$ is $${num(slope)}$. The prediction is $${num(x0+sign*k/5)}+${num(slope)}(${y}-${y0})\approx ${sf(all)}$.`),
  P(T`Remove only the flagged pair and predict $x$ again at $y=${y}$.`,2,A.sf(valid),T`Refit using the retained pairs. With the means $(${num(x0)},\,${y0})$ and slope $${num(slope)}$, substitute to obtain $${sf(valid)}$.`),
  P(T`An independent measurement gives $x=${num(observed)}$ at $y=${y}$. Which model gave the smaller absolute prediction error for this measurement?`,1,C(r,closer?"retained":"all",[V("The fit excluding the flagged pair.","retained"),V("The fit using all five pairs.","all"),V("The absolute errors are equal.","same")]),"Compare the absolute distances to the independent value, using the unrounded predictions.")
 ],table(["Input $x$","Output $y$","Status"],[...rows.map(v=>[...v,"Retained"]),[...suspect,"Flagged"]]));
},true);
reg("pooled-ogive-placement","Find a pooled percentile from two cumulative frequency profiles","4.2",4,"table",["SL4.2.cumfreq-quartiles","SL4.2.cumfreq-count","SL4.2.compare-distributions"],({rng:r})=>{
 const a=r.int(6,14),b=a+r.int(6,12),c=b+r.int(7,15),d=r.int(3,13),e=d+r.int(19,36),f=e+r.int(22,34),
  g=r.int(9,28),h=g+r.int(12,25),j=h+r.int(10,35),p=r.pick([45,55,65,75]),prefix=[0,d+g,e+h,f+j],xs=[0,a,b,c],target=(f+j)*p/100,
  u=prefix.findIndex(v=>v>=target),quant=xs[u-1]+(xs[u]-xs[u-1])*(target-prefix[u-1])/(prefix[u]-prefix[u-1]),above=100*(f+j-e-h)/(f+j);
 return Q({a,b,c,d,e,f,g,h,j,p},T`The table summarises the cumulative number of readings at or below each threshold for two groups. Estimate values between listed thresholds by joining the cumulative totals with straight segments.`,[
  P(T`Estimate the percentage of the pooled readings above $${b}$.`,2,A.sf(above),T`Subtract both counts at or below $${b}$ from the pooled size of $${f+j}$. Divide by the pooled size and express as a percentage: $${sf(above)}\%$.`),
  P(T`Estimate the threshold at or below which $${p}\%$ of the pooled readings lie.`,3,A.sf(quant),T`Pool each cumulative count first. The target percentage corresponds to a count of $${num(target)}$; interpolate between $${xs[u-1]}$ and $${xs[u]}$ to obtain $${sf(quant)}$.`)
 ],table(["Threshold","Group A cumulative count","Group B cumulative count"],[[0,0,0],[a,d,g],[b,e,h],[c,f,j]]));
},true);
reg("equal-cohort-quota-policy","Design normal-score cutoffs for equal expected recruitment then audit a common-cutoff policy",["4.12","4.9","4.11"],5,"table",["SL4.12.standardise","SL4.12.compare-z","SL4.12.z-score","SL4.9.inverse-normal","SL4.9.normal-probability","SL4.11.reverse-conditional"],({rng:r})=>{
 const ma=r.int(58,67),mb=ma+r.int(2,6),sa=r.int(7,13),sb=r.int(5,10),na=r.int(95,182),nb=r.int(194,260),q=r.int(13,28),
  za=inv(1-q/na),zb=inv(1-q/nb),cA=ma+sa*za,cB=mb+sb*zb,nB=nb*(1-cdf((cA-mb)/sb)),po=nB/(q+nB);
 return Q({ma,mb,sa,sb,na,nb,q},T`Two cohorts have normally distributed placement scores with the parameters shown. Within a cohort, an applicant qualifies if their score is above its cutoff. A proposed policy aims for exactly $${q}$ expected qualifiers in each cohort; cutoffs are allowed to be non-integers.`,[
  P("Find the cutoff for cohort A.",2,A.sf(cA),T`The required upper-tail probability is $${frac(q,na)}$. Find its standardised cutoff, approximately $${sf(za,5)}$, then transform to A's score scale, giving $${sf(cA)}$.`),
  P("Find the cutoff for cohort B.",2,A.sf(cB),T`Use the different upper-tail probability $${frac(q,nb)}$. The standardised cutoff is about $${sf(zb,5)}$. Back-transform using B's scale: $${mb}+${sb}(${sf(zb,5)})\approx${sf(cB)}$.`),
  P("Instead apply A's unrounded cutoff to both cohorts. Find the expected number of qualifiers in B under this common cutoff.",2,A.sf(nB),T`Standardise A's cutoff against B: $z_B=\dfrac{x_A-${mb}}{${sb}}\approx${sf((cA-mb)/sb,5)}$. The expectation is $${nb}\left(1-\Phi(z_B)\right)\approx${sf(nB)}$, where $\Phi$ is the standard normal cumulative probability.`),
  P("Select an applicant uniformly from the combined original pool. Given that this applicant qualifies under the common cutoff, find the probability that the applicant is from B.",2,A.sf(po),T`The combined-pool probabilities weight each cohort by its applicant count. The population denominator cancels when conditioning, giving the expected B count divided by the combined expected count: $${sf(po)}$.`)
 ],table(["Cohort","Applicants","Mean score","Standard deviation"],[["A",na,ma,sa],["B",nb,mb,sb]]));
},true);
})(typeof globalThis==="undefined"?this:globalThis);
