/* Original Wave 5 practice: ranked data, sampling design and probability. */
(function(root){
"use strict";
const E=root.QBEngine,{ans:A,fmt:F}=E,{num,frac,sf}=F,T=String.raw;
const I="ai-sl",S="aa-sl",H="ai-hl",L=n=>String.fromCharCode(65+n);
const seq=n=>Array.from({length:n},(_,i)=>i),sum=a=>a.reduce((x,y)=>x+y,0);
const N=x=>T`$${num(x)}$`,P=(prompt,marks,answer,...working)=>({prompt,marks,answer,working});
const C=(r,k,o)=>{const all=o.map(([value,text])=>({value,text}));return A.choice(r,all.find(x=>x.value===k),all.filter(x=>x.value!==k));};
const Q=(params,stem,parts,head,rows)=>({params,stem,parts,...(head?{table:{head,rows:rows.map(z=>z.map(x=>typeof x==="number"?N(x):x))}}:{})});
const reg=(slug,title,home,code,level,representation,skills,build,calculator=false)=>E.register({type:"w5-statistics-"+slug,title,home,syllabus:[code],levels:[level],skills,unknown:"solve",representation,format:"value",source:"original-wave5",build,calculator,niceOk:slug==="stratified-capacity-exact"});
const rank=x=>x.map(v=>1+x.filter(z=>z<v).length+(x.filter(z=>z===v).length-1)/2);
function rho(rows){
 const a=rank(rows.map(z=>z[0])),b=rank(rows.map(z=>z[1])),u=(rows.length+1)/2;
 return sum(a.map((x,i)=>(x-u)*(b[i]-u)))/Math.sqrt(sum(a.map(x=>(x-u)**2))*sum(b.map(x=>(x-u)**2)));
}

reg("rank-agreement-pattern","Recognise complete rank agreement and reversal",I,"4.10",1,"table",["AI-SL4.10.calculate-rs","AI-SL4.10.interpret-rs"],({rng:r})=>{
 const n=r.int(5,9),a=r.shuffle(seq(n).map(i=>i+1)),kind=r.pick(["same","reverse","neither"]);
 let b=a.slice();
 if(kind==="reverse")b=b.map(x=>n+1-x);
 if(kind==="neither"){const p=r.int(0,n-1),q=(p+r.int(1,n-1))%n;[b[p],b[q]]=[b[q],b[p]];}
 return Q({a,b},T`Two judges independently rank the same $${n}$ entries, each using rank $1$ for the best entry, with no ties.`,[
  P("Without running a regression, what must be true about Spearman's rank coefficient for the two judges?",2,C(r,kind,[["same","It is exactly $+1$."],["reverse","It is exactly $-1$."],["neither","It is neither $+1$ nor $-1$."]]),
   kind==="same"?"The ranks agree for every entry, so the association is perfectly positive.":kind==="reverse"?T`Every rank $k$ is paired with $${n+1}-k$, so the rankings are exact reverses.`:"The ranks are neither identical nor exact reverses. For complete untied rankings, these are the only ways to obtain the two extreme coefficients.")
 ],["Entry","Judge A rank","Judge B rank"],a.map((v,i)=>[L(i),v,b[i]]));
});

reg("coefficient-target-selection","Match the association measure to the analytical goal",I,"4.10",1,"words",["AI-SL4.10.compare-with-r","AI-SL4.10.interpret-rs"],({rng:r})=>{
 const caseId=r.int(0,8),k=caseId%3;
 const cases=[
  ["A charge rises rapidly at first, then more slowly but never decreases.","One number should reflect how consistently the two variables move in the same order, not how straight the trend is."],
  ["A calibration graph is approximately a straight line.","The technician wants a coefficient for the strength and direction of a linear relationship on the original scales."],
  ["A response increases up to a middle setting, then decreases.","An analyst wants a single coefficient to describe the rise and the later fall as one overall pattern."],
  ["Running time falls with experience, but the fall tapers off.","The task is to quantify monotonic association, even though the trend is not linear."],
  ["The amount delivered by a pump tracks its operating time approximately linearly.","The task is to quantify linear association using the measured values, not just their order."],
  ["Crop yield falls at first as salinity rises, then increases again over the displayed range.","A report asks whether one linear or monotonic association coefficient by itself adequately describes both halves of the curve."],
  ["A scale's displayed score consistently increases in a curved, monotonic trend as its input increases.","The purpose is to compare the ordering of inputs and outputs, not test linearity."],
  ["Fuel use and distance show an approximately straight-line trend over the observed range.","A researcher specifically wants the strength and direction of linear association between the measurements."],
  ["A filter's response falls to a middle minimum, then rises again.","A single proposed coefficient is supposed to describe both opposing trends on the full interval."]
 ][caseId],key=["spearman","pearson","neither"][k];
 return Q({caseId},cases.join(" "),[
  P("Which measure is suited to the stated goal?",2,C(r,key,[["spearman","Spearman's rank coefficient."],["pearson","Pearson's correlation coefficient."],["neither","Neither coefficient alone describes the stated pattern."]]),
   ["Spearman measures the tendency for ranks to move together monotonically, even when the relationship is curved.","Pearson measures linear association in the original values, which is what the goal specifies.","The relationship changes direction; a single linear or monotonic association coefficient does not represent both portions of the curve."][k])
 ]);
});

reg("rank-update-new-pair","Trace both columns' rank changes when an observation is added",I,"4.10",3,"table",["AI-SL4.10.rank-data","AI-SL4.10.interpret-rs"],({rng:r})=>{
 const n=r.int(6,8),b=r.int(10,44),c=r.int(31,58),dx=r.int(3,6),dy=r.int(3,8),shift=r.int(1,n-2);
 const order=seq(n),perm=order.slice();[perm[shift],perm[shift+1]]=[perm[shift+1],perm[shift]];
 if(r.bool(.5))perm.reverse();
 const rows=r.shuffle(order.map(i=>[b+dx*i,c+dy*perm[i]]));
 const newRow=[b+dx*r.int(1,n-3)+1,c+dy*r.int(1,n-3)+1],all=[...rows,newRow];
 const xRanks=rank(all.map(z=>z[0])),yRanks=rank(all.map(z=>z[1]));
 const both=rows.filter(z=>z[0]>newRow[0]&&z[1]>newRow[1]).length;
 return Q({rows,newRow},T`A workshop records an input setting and a measured score each day. After the table was compiled, a new record arrived: input $${newRow[0]}$, score $${newRow[1]}$. Use rank $1$ for each smallest value. No correlation calculation is needed.`,[
  P("Find the new record's input rank.",1,A.int(xRanks.at(-1)),"Count old input values smaller than the new input and add one."),
  P("Find the new record's score rank.",1,A.int(yRanks.at(-1)),"Repeat for the score column, independently of the input column."),
  P("Find how many original records move up by one in both of their numerical ranks.",2,A.int(both),"A rank increases by one only when the new value is below that record in its column. Count the original rows that satisfy both comparisons."),
  P("Could including this one record make Spearman's coefficient exactly $+1$?",1,C(r,"no",[["no","No: an existing pair of records already has opposing rank order."],["yes","Yes: a newly inserted rank can reverse the order of two original records."],["unknown","It depends on the units used for the input."]]),"At least one pair of original rows differs in its relative input and score order. Inserting a new row does not change that relative ordering.")
 ],["Record","Input","Score"],rows.map((z,i)=>[L(i),...z]));
});

reg("rank-export-tie-check","Audit two spreadsheet rank exports that handle ties differently",I,"4.10",3,"table",["AI-SL4.10.rank-data"],({rng:r})=>{
 const n=r.int(7,8),baseX=r.int(24,52),baseY=r.int(16,38),h=r.int(2,5),k=r.int(3,7);
 const groupsX=r.shuffle([0,0,1,2,2,...Array(n-5).fill(3)]),groupsY=r.shuffle([0,1,1,2,...Array(n-4).fill(3)]);
 const sx=groupsX.map(v=>baseX+h*v),sy=groupsY.map(v=>baseY+k*v);
 const shownX=sx.map(v=>1+sx.filter(z=>z<v).length),shownY=groupsY.map(v=>1+v),rx=rank(sx),ry=rank(sy),chosen=groupsY.indexOf(3);
 const gain=sum(rx)-sum(shownX),repairs=seq(n).filter(i=>rx[i]!==shownX[i]||ry[i]!==shownY[i]).length;
 return Q({sx,sy,shownX,shownY,chosen},T`A spreadsheet exports ranks for the same $${n}$ entries on two scales. Neither exported column uses the average-rank rule required before calculating Spearman's coefficient. In the corrected lists, rank $1$ is assigned to the smallest value if it is unique; every tied group shares the mean of its occupied positions.`,[
  P("By how much does the sum of the ranks in scale X increase when corrected?",2,A.int(gain),T`Compare each tie group's exported sum with the sum of its occupied positions. The combined deficit is $${gain}$.`),
  P(T`Give the corrected scale Y rank for entry ${L(chosen)}.`,1,A.dec(ry[chosen]),T`The largest tied values take all positions from $5$ through $${n}$, averaging to $${num(ry[chosen])}$.`),
  P("How many entries need a correction in X, in Y, or in both? Count each entry only once.",2,A.int(repairs),"Recalculate both lists by entry ID. Count the rows where at least one of the two exported ranks differs from its corrected value.")
 ],["Entry","Scale X","Exported X rank","Scale Y","Exported Y rank"],sx.map((x,i)=>[L(i),x,shownX[i],sy[i],shownY[i]]));
});

reg("rank-audit-missing-pair","Recover a missing observation from a reported rank coefficient",I,"4.10",4,"table",["AI-SL4.10.rank-data","AI-SL4.10.calculate-rs"],({rng:r})=>{
 const off=r.int(31,67),scale=r.int(3,7),x0=r.int(8,20),xstep=r.int(2,5),n=6;
 const yPerm=r.shuffle(seq(n-1)),known=yPerm.map((v,i)=>[x0+xstep*i,off+scale*v]),newX=x0+xstep*n;
 const pool=[off-1,...seq(n-2).map(i=>off+scale*i+1),off+scale*(n-2)+1],slots=r.shuffle(pool).slice(0,3);
 const options=slots.map(y=>Number(rho([...known,[newX,y]]).toFixed(4))),distinct=new Set(options);
 // Inserting the maximum x into a new y rank strictly raises its correlation with x ranks as that y insertion rank rises.
 const j=r.int(0,slots.length-1),shown=options[j],winner=slots[j],wrong=Math.min(...slots.filter(y=>y!==winner)),wrongRho=rho([...known,[newX,wrong]]);
 if(distinct.size!==slots.length)throw Error("Rank audit candidates must be separable");
 return Q({known,newX,slots,shown},T`Six devices were scored by two tests. The sixth score in test Y is missing from the table. An audit file lists exactly three possibilities: $${slots.join(",\ ")}$. It also reports the Spearman coefficient of all six complete pairs, rounded to four decimal places, as $${shown.toFixed(4)}$.`,[
  P("Find the missing score.",3,A.int(winner),T`For each candidate, rank the six Y scores and find the correlation of the paired ranks. In listed order the coefficients at four decimal places are $${options.map(x=>x.toFixed(4)).join(",\ ")}$. Only $${winner}$ produces the recorded coefficient.`),
  P("State the rank of the recovered Y score, with rank $1$ for the smallest.",1,A.int(rank([...known.map(z=>z[1]),winner]).at(-1)),"Count the Y values smaller than the recovered one and add one."),
  P("Instead use the smaller of the two rejected scores. Give the resulting coefficient to three significant figures.",2,A.sf(wrongRho),T`Replace only the missing score with $${wrong}$, re-rank and calculate $r_s\approx${sf(wrongRho)}$.`)
 ],["Device","Test X","Test Y"],[...known.map((z,i)=>[L(i),...z]),[L(n-1),newX,"?"]]);
},true);

reg("systematic-periodic-start","Diagnose how a periodic list affects a systematic sample",S,"4.1",3,"table",["SL4.1.sampling-technique","SL4.1.bias-reliability"],({rng:r})=>{
 const slots=r.int(5,9),blocks=r.int(12,27),active=r.int(2,slots-2),pattern=r.shuffle([...Array(active).fill(1),...Array(slots-active).fill(0)]),start=r.int(1,slots),first=pattern[start-1];
 return Q({pattern,blocks,start},T`A schedule contains $${blocks}$ consecutive blocks of $${slots}$ jobs. The table shows the arrangement of urgent jobs in every block. One start position is chosen uniformly from the first block, then every $${slots}$th job is inspected. The actual start is position $${start}$.`,[
  P("How many inspected jobs in this sample are urgent?",2,A.int(first*blocks),T`Every selection uses position $${start}$ in its block. All inspected jobs are therefore ${first?"urgent":"non-urgent"}.`),
  P("Find the exact probability, over the random start, that every inspected job is urgent.",2,A.frac(active,slots),T`Exactly $${active}$ of the $${slots}$ allowed starts use an urgent position.`),
  P("Which statement identifies the limitation?",1,C(r,"period",[["period","A random start does not prevent every selected job falling in a single repeated position."],["represent","A random start guarantees the sample has the same urgent fraction as the full schedule."],["size","Adding more blocks of the same layout, without changing the interval, guarantees a representative sample."]]),"The selection interval matches the period in the frame. The random start gives equal individual inclusion chances, but the realised sample can still miss a whole kind of job.")
 ],["Position within a block","Urgent?"],pattern.map((v,i)=>[i+1,v?"Yes":"No"]));
});

reg("sample-frame-duplicate-entries","Compare a random record draw with a random person draw",S,"4.1",3,"table",["SL4.1.population-sample","SL4.1.bias-reliability"],({rng:r})=>{
 const onlyA=r.int(22,42),onlyB=r.int(16,38),both=r.int(9,27),nb=onlyA+onlyB+both,entries=nb+both;
 return Q({onlyA,onlyB,both},T`Two library lists contain the people eligible for a survey. Every person has one entry in each list they belong to. The lists are joined without removing duplicate people, and one entry is drawn uniformly. The eligible population comprises all distinct people in either list.`,[
  P("Find the number of people in the eligible population.",1,A.int(nb),T`Add all three disjoint groups; count a person in both lists only once.`),
  P("Find the exact probability that the drawn entry belongs to the overlap group.",2,A.frac(2*both,entries),T`Every overlap person has two entries, giving $${2*both}$ overlap entries out of $${entries}$ entries.`),
  P("Find the exact probability instead if repeats are removed before the draw.",2,A.frac(both,nb),T`There are then $${both}$ overlap people and $${nb}$ equally likely people in total.`)
 ],["List membership","Distinct people"],[["A only",onlyA],["B only",onlyB],["Both lists",both]]);
});

reg("stratified-capacity-exact","Maximise an exactly proportional sample subject to staffing and cost",S,"4.1",4,"table",["SL4.1.stratified-numbers","SL4.1.sampling-technique"],({rng:r})=>{
 const a=r.int(8,17),b=r.int(19,28),c=r.int(13,23),g=(x,y)=>y?g(y,x%y):x,d=g(g(a,b),c),weights=[a/d,b/d,c/d],scale=r.int(67,95),u=r.int(29,46),limit=r.int(0,2),basis=sum(weights);
 const pop=weights.map(x=>x*scale),caps=weights.map((x,i)=>i===limit?x*u+r.int(0,x-1):x*(u+r.int(1,4))+r.int(0,x-1));
 const cost=seq(3).map(()=>r.int(217,698)),unit=sum(cost.map((v,i)=>v*weights[i])),budgetBlocks=r.int(u-8,u+8),budget=budgetBlocks*unit+r.int(0,unit-1),k=Math.min(u,budgetBlocks),max=k*basis;
 return Q({pop,caps,cost,budget},T`Three sites form a population. A stratified sample must have exactly the same site proportions as the population, without rounding any site allocation. Sampling is random within each site. Allow at most $${num(budget/100)}$ credits overall, and respect each site's cap.`,[
  P("Find the smallest positive total sample size with exactly these proportions, ignoring the caps and budget.",2,A.int(basis),T`Reduce the population counts to the whole-number ratio $${weights.join(":")}$. Its sum, $${basis}$, is the first feasible positive total.`),
  P("Find the largest sample size allowed by both the site caps and the budget.",3,A.int(max),T`Compute the price of one exact proportional block: $${num(unit/100)}$ credits. At most $${budgetBlocks}$ blocks fit the budget, but site ${L(limit)} limits recruitment to $${u}$ blocks. Use the smaller limit with $${basis}$ records in each block.`),
  P("How many records does site B supply in this largest sample?",1,A.int(k*weights[1]),T`Multiply the B term of the reduced ratio by $${k}$.`)
 ],["Site","Population records","Maximum available","Cost per record"],pop.map((v,i)=>[L(i),v,caps[i],T`$${(cost[i]/100).toFixed(2)}$`]));
},true);

reg("overlapping-quota-feasibility","Use overlapping quota margins to plan recruitment time",S,"4.1",4,"table",["SL4.1.sampling-technique","SL4.1.bias-reliability"],({rng:r})=>{
 const n=r.int(90,120),a=r.int(39,58),b=n-r.int(20,32),low=a+b-n,high=Math.min(a,b),cap=r.int(low+2,high-2);
 const t=seq(3).map(()=>r.int(150,540)),sign=r.pick([-1,1]);
 t.push(t[1]+t[2]-t[0]+sign*r.int(26,109));
 if(t[3]<80)t[3]=80+Number(t[0]-t[1]-t[2]+80===0);
 const slope=t[0]-t[1]-t[2]+t[3],x=slope>0?low:cap,groups=[x,a-x,b-x,n-a-b+x],minutes=sum(groups.map((v,i)=>v*t[i]))/100;
 return Q({n,a,b,cap,t},T`A quota sample must include exactly $${n}$ people, of whom exactly $${a}$ are cyclists and exactly $${b}$ are commuters. At most $${cap}$ people who are both can be recruited. All other groups have enough available. The table gives expected recruitment minutes per completed survey in each group.`,[
  P("Find the smallest possible number of participants belonging to both groups.",2,A.int(low),T`At least $${a}+${b}-${n}=${low}$ people count towards both targets.`),
  P("Find the minimum expected total recruitment time in minutes, to three significant figures.",3,A.sf(minutes),T`With $x$ people in both groups, the four counts are $x$, $${a}-x$, $${b}-x$, and $${n-a-b}+x$. The time changes by $${num(slope/100)}$ minutes per additional person in both while holding the margins fixed. The minimum uses $x=${x}$, giving about $${sf(minutes)}$ minutes.`),
  P("The recruiter takes the first available people in each chosen group. What does meeting the margins tell you about this sample?",1,C(r,"quota",[["quota","The quotas are met, but recruitment is not made random by meeting them."],["random","The sample is simple random."],["full","Every joint count is uniquely fixed by the margins alone."]]),"Quotas constrain numbers, but first-arrival recruitment need not give eligible people equal selection chances.")
 ],["Group","Expected minutes per survey"],["Both","Cyclist only","Commuter only","Neither"].map((v,i)=>[v,T`$${(t[i]/100).toFixed(2)}$`]));
},true);

reg("rounded-p-value-audit","Check whether a displayed p-value supports a test decision",I,"4.11",3,"table",["AI-SL4.11.conclusion","AI-SL4.11.test-conditions"],({rng:r})=>{
 const level=r.pick([1,5,10]),pbase=10*level,low=r.int(1,5),high=r.int(1,5),cases=r.shuffle([["below",pbase-low],["edge",pbase],["above",pbase+high]]);
 return Q({level,cases},T`Three correctly set up chi-squared tests of independence use a significance level of $${level}\%$. The report displays each $p$-value rounded to the nearest $0.001$. The rule is to reject independence only if the true $p$-value is strictly below the significance level.`,
 cases.map(([kind,p],i)=>P(T`What does the report alone justify for test ${L(i)}?`,2,C(r,kind,[["below","Reject $H_0$."],["edge","The report lacks enough precision to decide."],["above","Do not reject $H_0$."]]),
  T`The printed $p=${(p/1000).toFixed(3)}$ represents true values within $0.0005$. Relative to $${(pbase/1000).toFixed(3)}$, this interval is ${kind==="edge"?"on both sides of the cutoff":kind==="below"?"entirely below the cutoff":"entirely above the cutoff"}.`)),
 ["Test","Printed p-value"],cases.map(([,x],i)=>[L(i),T`$${(x/1000).toFixed(3)}$`]));
});

reg("poisson-two-interval-composition","Use Poisson totals without assuming two intervals contribute equally",H,"4.17",4,"words",["AI-AHL4.17.rescale-mean","AI-AHL4.17.poisson-probability","AI-AHL4.17.sum-of-poissons"],({rng:r})=>{
 const rate1=r.int(12,23),rate2=r.int(5,10),t1=r.int(2,3)*5,t2=r.int(3,5)*5,a=rate1*t1/60,b=rate2*t2/60,l=a+b,
  total2=Math.exp(-l)*l*l/2,both=Math.exp(-l)*a*b;
 return Q({rate1,rate2,t1,t2},T`Messages arrive independently. During the first $${t1}$ minutes they form a Poisson process at rate $${rate1}$ per hour, and during the next $${t2}$ minutes at rate $${rate2}$ per hour. The counts in these two intervals are independent. Give probabilities to $3$ significant figures.`,[
  P("Find the probability that there are exactly two messages in total.",2,A.sf(total2),T`The independent counts have means $${frac(rate1*t1,60)}$ and $${frac(rate2*t2,60)}$. Add the means and use the Poisson probability at $2$: $${sf(total2)}$.`),
  P("Find the probability that there is exactly one message in each interval.",2,A.sf(both),T`Multiply the two independent probabilities of exactly one message. This gives $${sf(both)}$.`),
  P("Given that there are exactly two messages in total, find the probability that each interval has one.",3,A.sf(both/total2),T`One in each is a subset of two in total. Divide its probability by the probability of the total, giving $${sf(both/total2)}$.`)
 ]);
},true);
})(typeof window==="undefined"?globalThis:window);
