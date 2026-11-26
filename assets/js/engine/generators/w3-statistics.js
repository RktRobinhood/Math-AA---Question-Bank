/* Original Topic 4 structural practice, Wave 3. */
(function(root){
"use strict";
const E=root.QBEngine,{fmt:F,ans:A}=E,{num,frac,sf}=F,T=String.raw;
const S="aa-sl",I="ai-sl",H="ai-hl";
function normalLeft(z){
 let a=z,total=a;
 for(let i=1;i<=46;i++){a*=-z*z*(2*i-1)/(2*i*(2*i+1));total+=a;}
 return .5+total/Math.sqrt(2*Math.PI);
}
const N=x=>T`$${num(x)}$`,P=(prompt,marks,answer,...working)=>({prompt,marks,answer,working});
const Q=(params,stem,parts,table)=>({params,stem,parts,...(table?{table}:{})});
const table=(head,rows)=>({head:head.map(x=>typeof x==="number"?N(x):x),rows:rows.map(z=>z.map(x=>typeof x==="number"?N(x):x))});
const V=(text,value,why)=>({text,value,why});
function C(r,key,options){return A.choice(r,options.find(x=>x.value===key),options.filter(x=>x.value!==key));}
const rg=(slug,title,home,code,level,representation,skills,build,calculator=false,niceOk=false)=>E.register({type:"w3-statistics-"+slug,title,home,syllabus:[code],levels:[level],skills,unknown:"solve",representation,format:"value",source:"original-wave3",build,calculator,niceOk});
rg("outlier-equality","Identify an outlier and decide whether to keep it",S,"4.1",1,"words",["SL4.1.outlier-decision"],({rng:r})=>{
 const a=r.int(24,52),g=2*r.int(2,7),side=r.pick([-1,1]),delta=r.pick([-2,-1,0,1,2]),f=side<0?a-1.5*g:a+2.5*g,v=f+side*delta,out=delta>0,near=side<0?a:a+g,confirmed=r.int(0,1)===1;
 const beyond=side<0?"below the lower quartile":"above the upper quartile", distance=Math.abs(v-near);
 return Q({a,g,side,v,confirmed},T`The lower and upper quartiles of a set of waiting times are $${a}$ and $${a+g}$ minutes. A value is an outlier if it lies more than $1.5$ interquartile ranges below the lower quartile or above the upper quartile.`,[
  P(T`Is a waiting time of $${v}$ minutes an outlier?`,1,C(r,out?"out":"inside",[V("Yes","out"),V("No","inside"),V("Cannot be determined from the given information","unknown")]),T`The interquartile range is $${a+g}-${a}=${g}$, so $1.5 \times ${g}=${1.5*g}$. The time is $${distance}$ minutes ${beyond}. This is ${out?"more":"not more"} than $${1.5*g}$, so it is ${out?"an outlier":"not an outlier"}.`),
  P(`${confirmed?"A second clock independently confirms this time.":"A faulty clock gave this reading, and the correct time is not known."} What should the analyst do with this record?`,1,C(r,confirmed?"keep":"exclude",[V("Keep the recorded time in the data.","keep"),V("Exclude the recorded time and note why.","exclude"),V("Replace the recorded time with the nearest quartile.","replace")]),confirmed?"Keep the reading because it is a genuine observation, even if it is unusually far from the other values.":"Exclude the reading because it is a known error. An unusual value is not, on its own, a reason to exclude it.")
 ]);
});
rg("box-summary-tradeoff","Compare two box summaries when IQR and total range disagree",S,"4.2",3,"table",["SL4.2.box-plot","SL4.2.compare-distributions"],({rng:r})=>{
 const base=r.int(24,63),k=r.int(5,10),l=r.int(2,k-2),outer=r.int(7,11),gap=r.int(1,8),adj=r.int(-3,3),iA=[base-outer,base,base+l,base+k,base+k+outer],b=base+adj,iB=[b-2,b,b+2,b+k+gap,b+k+gap+2],flip=r.int(0,1),a=flip?iB:iA,c=flip?iA:iB,k1=a[3]-a[1],k2=c[3]-c[1],ra=a[4]-a[0],rb=c[4]-c[0];
 return Q({a,c},"The two five-number summaries record complete sample ranges, with no omitted outliers.",[
  P("How much larger is the larger interquartile range than the smaller one?",2,A.int(Math.abs(k1-k2)),T`The interquartile ranges are $${k1}$ and $${k2}$. They differ by $${Math.abs(k1-k2)}$.`),
  P("Which batch has the wider overall range?",1,C(r,ra>rb?"A":"B",[V("Batch A.","A"),V("Batch B.","B"),V("Neither; the overall ranges are equal.","same")]),T`Use the endpoints, not the quartiles. The ranges are $${ra}$ and $${rb}$.`),
  P("A supervisor adds a constant to every reading in batch B so its median matches batch A. What signed constant must be added?",2,A.int(a[2]-c[2]),T`Match the medians by adding $${a[2]}-${c[2]}=${a[2]-c[2]}$ to each reading. Translating an entire batch does not change either measure of spread.`)
 ],table(["Batch","Minimum","Lower quartile","Median","Upper quartile","Maximum"],[["A",...a],["B",...c]]));
});
rg("pooled-spread-as-offsets","Recover pooled spread from two internally summarised batches",S,"4.3",4,"table",["SL4.3.mean-totals","SL4.3.sd-variance","SL4.3.compare-average-spread"],({rng:r})=>{
 const s=r.int(7,16),t=r.int(6,19),a=r.int(26,59),b=a+r.int(3,13),d=r.int(2,7),e=r.int(2,8),size=2*(s+t);
 const total=2*s*a+2*t*b,ss=s*((a-d)**2+(a+d)**2)+t*((b-e)**2+(b+e)**2),m=total/size,sd=Math.sqrt(ss/size-m*m);
 return Q({s,t,a,b,d,e},"Two workshops combined their measurements. Each row states how many times each of the two shown values occurs. Use population standard deviation: divide the total squared deviations by the number of values.",[
  P("Find the mean of the combined data.",2,A.sf(m),T`There are $${size}$ measurements. Weight each displayed value by its frequency: the total is $${num(total)}$, hence mean $${sf(m)}$.`),
  P("Find the population standard deviation of the combined data.",3,A.sf(sd),T`Enter all four values with their frequencies in one-variable statistics, or use mean square minus square of the mean. The sum of weighted squares is $${num(ss)}$; the resulting standard deviation is $${sf(sd)}$.`),
  P("Why is a weighted average of the two workshops' standard deviations not generally correct?",2,C(r,"offset",[V("It misses variation between the two workshops' means.","offset"),V("Standard deviation can only be computed on one workshop at a time.","single"),V("Unequal sample sizes make an overall mean impossible.","means")]),"Variation comes both from spread within each workshop and from the different locations of their centres.")
 ],table(["Workshop","Values measured","Frequency of each value"],[["A",T`$${a-d},\quad ${a+d}$`,s],["B",T`$${b-e},\quad ${b+e}$`,t]]));
},true);
rg("regression-crossover-window","Recover a fitted line and check where two predictions can be compared",S,"4.4",3,"table",["SL4.4.mean-point","SL4.4.predict","SL4.4.interpret-ab"],({rng:r})=>{
 const xbar=r.int(4,11),ybar=r.int(31,65),m=r.int(2,5),other=m+r.pick([-1,1])*r.int(1,2),crossAt=r.int(2,15),k=ybar-m*xbar,alt=k+(m-other)*crossAt;
 const lo=r.int(3,7),hi=r.int(9,13),okay=lo<=crossAt&&crossAt<=hi;
 return Q({xbar,ybar,m,other,alt,lo,hi},"Two separate datasets were each fitted with a least-squares regression of response on input. Treat predictions inside the stated common observed input range as interpolations.",[
  P("Find the intercept of fitted line A.",2,A.int(k),T`The fitted line goes through its mean point. Substitute to get $${ybar}-${m}(${xbar})=${k}$.`),
  P("At which input do the two model predictions agree?",2,A.int(crossAt),T`Equate the two fitted values and rearrange to get $x=${crossAt}$.`),
  P(T`Classify that input relative to the common observed interval $[${lo},${hi}]$.`,1,C(r,okay?"in":crossAt<lo?"left":"right",[V("Interpolation in the common range.","in"),V("Extrapolation below the common range.","left"),V("Extrapolation above the common range.","right")]),T`Compare $${crossAt}$ with both observed endpoints.`)
 ],table(["Model","Slope","Intercept","Mean input","Mean response"],[["A",m,"Unknown",xbar,ybar],["B",other,alt,"Not given","Not given"]]));
});
rg("blend-payout-threshold","Match an expected payout, then assess the resulting chance of a large prize",S,"4.7",4,"table",["SL4.7.expected-value","SL4.7.table-probabilities","SL4.7.unknowns-from-mean"],({rng:r})=>{
 const base=r.int(3,9),step=r.int(2,6),d=r.int(9,18),u=r.int(2,4),v=r.int(5,8),wa=r.int(2,d-2),pa=u/10,pb=v/10,threshold=base+step,
   a=base+step*pa,b=base+step*2*pb,n=(10*base*d+step*(wa*u+2*(d-wa)*v));
 return Q({base,step,d,u,v,wa},"A toy dispenser chooses one mode at random and then draws a prize using the distribution for that mode. All prizes are measured in points.",[
  P("Find the expectation for mode B alone. Give an exact value.",2,A.frac(10*base+2*step*v,10),T`Mode B has the base prize plus an extra $${2*step}$ points with probability $${frac(v,10)}$. Its expectation is $${num(b)}$.`),
  P(T`The dispenser's overall expected prize is $${frac(n,10*d)}$. Find the exact probability it selects mode B.`,3,A.frac(d-wa,d),T`Write $p$ for the selection probability. Solve $(1-p)(${num(a)})+p(${num(b)})=${frac(n,10*d)}$ for $p$, giving $${frac(d-wa,d)}$.`),
  P(T`Find the exact probability of a prize strictly greater than $${threshold}$ points.`,2,A.frac((d-wa)*v,10*d),T`Only the larger prize from mode B qualifies. Multiply the selection probability by $${frac(v,10)}$.`)
 ],table(["Mode","Base prize","Chance of base prize","Higher prize","Chance of higher prize"],[["A",base,N(1-pa),threshold,N(pa)],["B",base,N(1-pb),base+2*step,N(pb)]]));
},true,true);
rg("normal-union-reflection","Reflect a shifted interval without counting the overlap twice",S,"4.9",3,"words",["SL4.9.symmetry-probability","SL4.9.central-interval"],({rng:r})=>{
 const m=r.int(22,76),h=r.int(3,10),k=2*h+r.int(1,7),sigma=k+r.int(2,12);
 const q=Math.round(1000*(2*normalLeft(h/sigma)-1)),w=Math.round(1000*(normalLeft(h/sigma)-normalLeft(-k/sigma))),p=w-q,raw=w/1000;
 return Q({m,h,k,q,p,sigma},T`The normal variable $X$ has mean $${m}$. Its probability of falling from $${m-h}$ to $${m+h}$ is $${num(q/1000)}$. Its probability of falling from $${m-k}$ to $${m+h}$ is $${num(raw)}$. Use the quoted probabilities as exact for this exercise.`,[
  P(T`Find the probability of falling from $${m+h}$ to $${m+k}$.`,3,A.frac(p,1000),T`Subtract the central interval from the wider interval to get the left flank. The right flank has that same mass by reflection about the mean.`),
  P(T`Find the probability of falling outside $[${m-k},${m+k}]$.`,2,A.frac(1000-q-2*p,1000),T`The full inner region consists of the central probability and both flanks. Subtract $${num((q+2*p)/1000)}$ from one.`)
 ]);
});
rg("spearman-reverse-scale","Reverse one rank column without breaking its ties",I,"4.10",2,"table",["AI-SL4.10.rank-data","AI-SL4.10.interpret-rs","AI-SL4.10.compare-with-r"],({rng:r})=>{
 const n=r.int(7,13),start=r.int(1,n-2),r0=(2*start+1)/2,rev=n+1-r0,ax=r.int(9,20),b=r.int(2,7),k=r.int(5,12);
 const ranks=Array.from({length:n},(_,i)=>i+1),xr=r.shuffle(ranks),yr=ranks.map(x=>x===start||x===start+1?r0:x),m=(n+1)/2;
 const cross=xr.reduce((s,v,i)=>s+(v-m)*(yr[i]-m),0);
 const variance=xs=>xs.reduce((s,x)=>s+(x-m)**2,0);
 const rs=Math.round(100*cross/Math.sqrt(variance(xr)*variance(yr)));
 return Q({n,start,rs,ax,b,k,xr},T`A study compares two variables using paired readings from $${n}$ samples. From the table, two samples tie in the Y positions shown. Rank from smallest to largest. The published Spearman coefficient, to two decimal places, is $${num(rs/100)}$. Y is then recoded to $y'=${ax}-${b}y$ before ranking again; X stays unchanged.`,[
  P("Find the average rank of the tied Y readings after recoding.",2,A.frac(2*rev,2),T`The original average rank is $${num(r0)}$. Reversing the rank order maps each original rank $r$ to $${n+1}-r$. It therefore maps the tied average to $${num(rev)}$.`),
  P("Using the displayed value, give the Spearman coefficient after recoding.",2,A.frac(-rs,100),T`The ranked Y column is reflected, so correlation changes sign but not magnitude. The new reported value is $${num(-rs/100)}$.`)
 ],table(["Readings","Original Y value","Original sorted positions occupied"],[["Tied pair",k,T`$${start}\text{ and }${start+1}$`]]));
});
rg("goodness-of-fit-critical-contribution","Find which categories drive a goodness-of-fit decision",I,"4.11",3,"table",["AI-SL4.11.expected-frequencies","AI-SL4.11.goodness-of-fit","AI-SL4.11.conclusion"],({rng:r})=>{
 const e=r.pick([20,25,28,32,36,40]),d=r.int(7,13),k=r.int(1,5),pivot=r.int(0,3),mid=(pivot+1)%4,last=(pivot+2)%4,raw=[e,e,e,e],cut=7.815,score=(d*d+k*k+(d-k)**2)/e,yes=score>cut;
 raw[pivot]+=d;raw[mid]-=k;raw[last]-=d-k;
 const names=["A","B","C","D"], opts=names.map(x=>V("Category "+x+".",x));
 return Q({e,raw},T`A workshop tests whether four equally likely labels match the observed counts. All observations are independent. The significance level is $5\%$ and the given critical chi-squared statistic is $7.815$; reject equal probabilities only if the statistic exceeds that value.`,[
  P("Find the expected count in each category.",1,A.int(e),T`The total $${e*4}$ is split equally over the four categories, giving $${e}$.`),
  P("Find the exact chi-squared statistic.",2,A.frac(d*d+k*k+(d-k)**2,e),T`Sum $\dfrac{(O-E)^2}{E}$ across all four categories. With common expected count $${e}$, this is $${frac(d*d+k*k+(d-k)**2,e)}$.`),
  P("Which category contributes the most to the statistic?",1,C(r,names[pivot],opts),"Since expected counts are equal, the largest absolute deviation gives the largest contribution."),
  P("Which decision follows from the stated rule?",1,C(r,yes?"reject":"retain",[V("Reject equal probabilities.","reject"),V("Do not reject equal probabilities.","retain"),V("The observations prove the probabilities equal.","proved")]),T`The statistic is ${yes?"above":"below"} $7.815$. A non-rejection would not prove equal probabilities.`)
 ],table(["Label",...names],[["Observed",...raw]]));
});
rg("compare-vertical-retunes","Compare two models using squared residuals",H,"4.13",2,"table",["AI-AHL4.13.ssres","AI-AHL4.13.minimise-ssres"],({rng:r})=>{
 const base=r.int(6,13),growth=r.int(3,7),obs=Array.from({length:3},(_,i)=>base+(i+1)*growth+r.int(-1,1));
 const near=[r.pick([-1,1])*r.int(1,2),r.int(-1,1),r.pick([-1,1])*r.int(1,2)],far=[r.pick([-1,1])*r.int(3,4),r.pick([-1,1])*r.int(2,3),r.int(-2,2)];
 const [a,b]=r.int(0,1)?[near,far]:[far,near],pred=offset=>obs.map((v,i)=>v-offset[i]),pA=pred(a),pB=pred(b),score=z=>z.reduce((s,v)=>s+v*v,0),ssA=score(a),ssB=score(b);
 const work=(name,z,ss)=>T`For model ${name}, the residuals (measured minus predicted) are $${z.join(",\\,")}$. Squaring and adding gives $SS_{\mathrm{res}}=${ss}$.`;
 return Q({obs,pA,pB},"Two models predict the height of a seedling. The table gives the measured and predicted heights, in centimetres.",[
  P(T`Find the sum of squared residuals, $SS_{\mathrm{res}}$, for model A.`,2,A.int(ssA),work("A",a,ssA)),
  P(T`Using $SS_{\mathrm{res}}$, decide which model fits these data better.`,2,C(r,ssA<ssB?"A":"B",[V("Model A","A"),V("Model B","B"),V("They fit equally well","tie")]),work("B",b,ssB),T`Model ${ssA<ssB?"A":"B"} has the smaller $SS_{\mathrm{res}}$ for these measurements.`)
 ],table(["Week","Measured","Model A","Model B"],obs.map((v,i)=>[i+1,v,pA[i],pB[i]])));
});
rg("clt-average-or-total","Translate a threshold on an average and justify a normal model",H,"4.15",2,"words",["AI-AHL4.15.sample-mean","AI-AHL4.15.central-limit-theorem"],({rng:r})=>{
 const normal=r.int(0,1)===1,root=r.int(4,10),n=root*root,m=r.int(10,28),sd=r.int(2,6)*root,change=r.pick([-1,1])*r.int(1,4),k=m+change;
 return Q({n,m,sd,k,normal},T`A machine's reading is ${normal?"normally distributed":"not normally distributed"}. Its mean is $${m}$ and standard deviation is $${sd}$. Take $${n}$ independent readings from the same process. The average is $\bar X$ and the sum is $T$.`,[
  P(T`Give the value $t$ such that $\bar X>${k}$ means exactly $T>t$.`,1,A.int(n*k),T`Multiply the threshold by the sample size. The two events are identical.`),
  P(T`Find the standard deviation of $\bar X$.`,1,A.int(sd/root),T`Divide the individual standard deviation by $\sqrt{${n}}$, giving $${sd/root}$.`),
  P("Which statement about this machine's readings and their average is justified?",1,C(r,normal?"exact":"limit",[V("The individual reading and every independent sample average are exactly normal.","exact"),V("The individual reading is not normal, but the standardised sample average converges to a standard normal distribution as sample size grows.","limit"),V("Taking additional readings makes the distribution of a single reading approach the normal distribution.","single")]),normal?"A normal source makes the individual reading exactly normal, and a sum of independent normal readings is exactly normal.":"The central limit theorem concerns the standardised sample average as sample size grows. Without more about the source, it does not guarantee approximation quality at the stated sample size. The standard deviation in (b) is exact.")
 ]);
});
rg("trade-false-alarm-and-miss","Compare false-alarm and miss probabilities when a cutoff changes",H,"4.18",3,"table",["AI-AHL4.18.error-probability","AI-AHL4.18.errors-in-context"],({rng:r})=>{
 const d=r.pick([20,25,40,50]),n0=r.int(2,5),n1=r.int(2,7),n2=r.int(1,4),nc=d-n0-n1-n2,alt0=r.int(1,4),alt1=r.int(2,5),alt2=r.int(3,7),alt3=d-alt0-alt1-alt2,x=r.int(5,14),strict=r.int(0,1)===1;
 const old=x+(strict?2:3),next=x+(strict?3:2),i=n2+(strict?n1:0),ii=alt0+alt1+(strict?alt2:0);
 return Q({d,n0,n1,n2,nc,alt0,alt1,alt2,alt3,x,old,next},T`A monitor returns one of four scores, in increasing order. The table gives exact probabilities when a machine is healthy or faulty. An alert rejects the healthy-state hypothesis.`,[
  P(T`With the alert rule “score at least $${old}$”, find the exact probability of a Type I error.`,2,A.frac(i,d),T`Under healthy conditions, add the probability in the alert region. The total is $${frac(i,d)}$.`),
  P(T`The rule is changed to “score at least $${next}$”. Find the exact probability of a Type II error under the faulty condition shown.`,2,A.frac(ii,d),T`Use the faulty distribution. Missing a fault means recording a score below $${next}$; its probability is $${frac(ii,d)}$.`),
  P("How does the change in threshold affect the two error probabilities?",1,C(r,strict?"strict":"loose",[V("False alarms decrease; missed faults increase.","strict"),V("Both error probabilities decrease.","both"),V("False alarms increase; missed faults decrease.","loose")]),T`The new threshold ${strict?"removes a score from":"adds a score to"} the alert region. That score had positive probability under both conditions.`)
 ],table(["Score",x,x+1,x+2,x+3],[["Healthy",...[nc,n0,n1,n2].map(v=>T`$${frac(v,d)}$`)],["Faulty",...[alt0,alt1,alt2,alt3].map(v=>T`$${frac(v,d)}$`)]]));
});
rg("markov-invert-mixed-start","Infer the starting distribution from a one-step outcome",H,"4.19",2,"table",["AI-AHL4.19.transition-matrix","AI-AHL4.19.n-step"],({rng:r})=>{
 const a=r.int(2,8),b=r.pick([1,2,3,4,5,6,7,8,9].filter(v=>Math.abs(v-a)>=2)),p=r.int(2,8),after=p*a+(10-p)*b,step2=after*a+(100-after)*b;
 return Q({a,b,p},"Machines switch between states A and B each day, with these transition probabilities. The columns are the starting states.",[
  P(T`After one day the proportion in A is $${frac(after,100)}$. Find the exact initial proportion in A.`,2,A.frac(p,10),T`Let the initial proportion in A be $x$. Then $${frac(a,10)}x+${frac(b,10)}(1-x)=${frac(after,100)}$. Solving yields $${frac(p,10)}$.`),
  P("Find the exact proportion in A after two days.",2,A.frac(step2,1000),T`Apply the same transition rule to the distribution after day one. The resulting proportion is $${frac(step2,1000)}$.`)
 ],table(["Destination","From A","From B"],[["A",T`$${frac(a,10)}$`,T`$${frac(b,10)}$`],["B",T`$${frac(10-a,10)}$`,T`$${frac(10-b,10)}$`]]));
});
})(typeof globalThis==="undefined"?this:globalThis);
