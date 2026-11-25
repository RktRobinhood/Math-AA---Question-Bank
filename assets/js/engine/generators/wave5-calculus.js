/* Ten original 2021-syllabus practice families; exam references are skill metadata only. */
(function(root) {
"use strict";
const E=root.QBEngine,{ans:A,fmt:F}=E;
const {num,sf}=F;
const R=(ss,...xs)=>String.raw({raw:ss},...xs).replace(/@/g,"\\");
const I=(lo,hi,expr,v="x")=>R`@int_{${lo}}^{${hi}}${expr}@,@mathrm{d}${v}`;
const q=(stem,params,...parts)=>({stem,params,parts});
const p=(prompt,marks,answer,...working)=>({prompt,marks,answer,working});
const J=(x)=>A.int(x), S=(x)=>A.sf(x,3), X=(x)=>A.self(x);
const T=(x)=>F.m(String(x));
const add=(name,unknown,representation,level,home,code,skills,title,build)=>
 E.register({type:"w5-calculus-"+name,unknown,representation,format:"value",levels:[level],home,syllabus:[code],skills:skills.split(" "),title,calculator:level===4||(home==="ai-sl"&&level===2),source:"original-wave-5",build});
const area=(id,u,r,l,s,t,b)=>add(id,u,r,l,"ai-sl","5.5",s,t,b);
const opt=(id,u,r,l,s,t,b)=>add(id,u,r,l,"ai-sl","5.7",s,t,b);
const aa=(id,u,r,l,c,s,t,b)=>add(id,u,r,l,"aa-sl",c,s,t,b);

area("area-share-by-strip","proportion-from-unintegrated-strip","equation",2,
"SL5.5.definite-integral-gdc SL5.5.area-positive","Find the share of a positive area in a marked strip",({rng:r})=>{
 const a=r.int(2,7),b=r.int(3,18),w=r.int(2,6),l=r.int(1,4),u=l+w,H=u+r.int(2,6);
 const expr=R`@dfrac{${b}}{x+${a}}`,val=(m,n)=>b*Math.log((n+a)/(m+a));
 const strip=val(l,u),whole=val(0,H),pct=100*strip/whole;
 return q(R`The whole region lies between the curve $y=${expr}$ and the $x$-axis for $0@le x@le${H}$. A marked strip consists of the part of this region for $${l}@le x@le${u}$.`,{a,b,l,u,H},
 p("Find the area of the marked strip. Give three significant figures.",2,S(strip),
   R`Integrate the positive height: $${I(l,u,expr)}@approx${sf(strip)}$ square units.`),
 p("Find the percentage of the whole area in the strip. Give three significant figures.",2,S(pct),
   R`The whole area is $${I(0,H,expr)}@approx${sf(whole)}$. Divide the unrounded strip area by the unrounded whole area and multiply by $100$: $${sf(pct)}@%$.`));
});

area("two-nozzle-meter","reconstruct-independent-accumulation","table",2,
"SL5.5.total-change-from-rate SL5.5.definite-integral-gdc","Separate one nozzle’s contribution to a combined meter reading",({rng:r})=>{
 const a=r.int(3,12),k=r.int(2,8)/5,L=r.int(2,7),v=Math.ceil(a+k*L)+r.int(2,8),pre=r.int(11,51),post=pre+L*v;
 const expr=R`${a}+(${num(k)})t`,n1=a*L+k*L*L/2,n2=L*v-n1;
 const item=q(R`A cumulative water meter records the total litres supplied by two nozzles, A and B, into one tank. The table shows the meter at the start and end of a test. For this test, nozzle A supplies water at $${expr}$ litres per minute at time $t$ minutes from the start.`,{a,k,L,pre,post},
 p("Find the volume from nozzle A during the test. Give three significant figures.",2,S(n1),
   R`Integrate the rate over the test interval: $${I(0,L,expr,"t")}@approx${sf(n1)}$ litres.`),
 p("Find the volume from nozzle B during the test. Give three significant figures.",2,S(n2),
   R`The two nozzles together supplied $${post}-${pre}=${L*v}$ litres. Subtract the unrounded amount from A: B supplied $${sf(n2)}$ litres.`));
 return {...item,table:{head:["Time (minutes)",T(0),T(L)],rows:[["Meter reading (litres)",T(pre),T(post)]]}};
});

area("quadratic-area-budget","recover-partition-then-height","equation",3,
"SL5.5.area-expression SL5.5.area-positive","Split an area using a proportion, then find the height at the cut",({rng:r})=>{
 const a=r.int(2,9),L=r.int(3,8),d=r.int(2,5),n=r.int(1,d-1),n3=n**3,d3=d**3;
 const cutN=L*n,heightN=a*cutN**2,wholeN=a*L**3;
 return q(R`Under the curve $y=${a}x^{2}$ from $x=0$ to $x=${L}$, a vertical line $x=c$ leaves $${F.frac(n3,d3)}$ of the total area to its left.`,{a,L,n:n3,d:d3},
  p("Find the exact total area under the curve.",2,A.frac(wholeN,3),
    R`The antiderivative is $@dfrac{${a}x^{3}}{3}$. Hence $${I(0,L,a+"x^{2}")}= @dfrac{${a}(@,${L}@,)^{3}}{3}=${F.frac(wholeN,3)}$.`),
  p("Find the exact value of $c$.",2,A.frac(cutN,d),
    R`Equate $@dfrac{${a}c^{3}}{3}$ to $${F.frac(n3,d3)}$ of the whole area. Thus $@left(@dfrac{c}{${L}}@right)^{3}=${F.frac(n3,d3)}$. Taking the positive cube root gives $c=${F.frac(cutN,d)}$.`),
  p("Find the exact height of the curve at the cut.",1,A.frac(heightN,d*d),
    R`Substitute $c=${F.frac(cutN,d)}$ into $y=${a}c^{2}=${F.frac(heightN,d*d)}$.`));
});

area("folded-shift-panel","compose-mirrored-area-with-offset","equation",3,
"SL5.5.area-expression SL5.5.area-positive","Find the area under two panels with a reversed height profile",({rng:r})=>{
 const a=r.int(2,8),b=r.int(4,19),c=r.int(2,12),L=r.int(2,5),j=r.int(2,4),w=j*L;
 const firstN=a*L**3+3*b*L,fullN=(1+j)*firstN+3*c*w;
 return q(R`Two adjacent panels share a vertical boundary at $x=${L}$. The first panel’s height is $h(x)=${a}x^{2}+${b}$ for $0@le x@le${L}$. The second uses the same heights in reverse order and stretches them horizontally to a width of $${w}$ units. It also adds $${c}$ units to every height. The second panel’s height is $h@left(${L}-@dfrac{x-${L}}{${j}}@right)+${c}$ for $${L}< x@le${L+w}$.`,{a,b,c,L,j},
  p("Find the exact area of the first panel.",2,A.frac(firstN,3),
    R`The first area is $${I(0,L,a+"x^{2}+"+b)}=@dfrac{${a}(@,${L}@,)^{3}}{3}+${b}(@,${L}@,)=${F.frac(firstN,3)}$ square units.`),
  p("Find the exact combined area of both panels.",3,A.frac(fullN,3),
    R`Reversing left and right preserves area. Horizontal stretching multiplies the original area by $${j}$. The height adjustment adds a rectangle of area $${c}(@,${w}@,)=${c*w}$. Thus the total is $(1+${j})@left(@,${F.frac(firstN,3)}@,@right)+${c*w}=${F.frac(fullN,3)}$ square units. Equivalently, integrate the two supplied heights on their respective intervals.`));
});

opt("admissible-cost-table","choose-feasible-tabulated-minimizer","table",1,
"AI-SL5.7.optimal-input","Choose the minimum-cost setting among admissible candidates",({rng:r})=>{
 const l=r.int(2,8),d=r.int(2,7),price=r.int(18,42),inc=r.int(3,10),winner=r.int(0,2);
 const xs=Array.from({length:5},(_,i)=>l+i*d), min=xs[winner+1];
 const vals=xs.map((x,i)=>i===0?price-inc:i===4?price-2*inc:price+(i===winner+1?0:inc*(i+1)));
 const item=q(R`A production test estimates the total cost for five proposed machine settings. Only settings from $${xs[1]}$ to $${xs[3]}$, inclusive, may be used.`,{xs,vals},
  p("Which of the permitted settings gives the lowest estimated cost?",2,J(min),
    R`Discard the two outside settings, $${xs[0]}$ and $${xs[4]}$. Among the permitted columns, the lowest cost is $${price}$ currency units at setting $${min}$.`));
 return {...item,table:{head:["Machine setting",...xs.map(T)],rows:[["Cost (currency units)",...vals.map(T)]]}};
});

opt("rising-cap-boundary","minimize-monotone-model-on-subinterval","words",1,
"AI-SL5.7.optimal-input","Use monotonicity to locate a constrained minimum without solving a derivative equation",({rng:r})=>{
 const l=r.int(4,17),u=l+r.int(2,10),v=r.int(1,l-1),fall=r.int(0,1);
 const result=fall?u:l,direction=fall?"decreases":"increases",which=fall?"largest":"smallest";
 return q(R`A calibrated pump can run between $${l}$ and $${u}$ cycles per minute, inclusive. On the wider interval from $${v}$ to $${u+3}$ cycles per minute, its steady power consumption strictly ${direction} as the setting is increased.`,{l,u,v,fall},
 p("Give the permitted setting at which power consumption is lowest.",1,J(result),
   R`As power consumption strictly ${direction}, use the ${which} permitted setting, $${result}$ cycles per minute. You do not need a stationary point.`));
});

opt("average-cost-reciprocal","differentiate-average-not-total-cost","words",3,
"AI-SL5.7.form-objective AI-SL5.7.optimal-input AI-SL5.7.optimum-value","Minimise an average cost rather than total cost",({rng:r})=>{
 const b=r.int(2,8),c=r.int(5,24),m=r.int(3,12),a=b*m*m,lo=r.int(1,m-1),hi=m+r.int(2,7);
 const v=2*b*m+c;
 return q(R`A process runs for $x$ hours, where $${lo}@le x@le${hi}$ and fractional hours are permitted. Its total cost in currency units is $C(x)=${b}x^{2}+${c}x+${a}$. The aim is to minimise the average cost per running hour.`,{a,b,c,lo,hi},
 p("Write the average cost per running hour $M(x)$ in terms of $x$.",1,X(R`$M(x)=${b}x+${c}+@dfrac{${a}}{x}$.`),
   R`Divide total cost by the number of running hours: $M(x)=@dfrac{C(x)}{x}=${b}x+${c}+@dfrac{${a}}{x}$.`),
 p("Find the stationary running time.",2,J(m),
   R`$M'(x)=${b}-@dfrac{${a}}{x^{2}}$, so $x^{2}=@dfrac{${a}}{${b}}=${m*m}$. Only $x=${m}$ is permitted.`),
 p("Justify that this stationary time gives the global minimum average cost.",1,X("The derivative changes from negative to positive, with no other stationary points."),
   R`For $0<x<${m}$, $@dfrac{${a}}{x^{2}}>${b}$, so $M'(x)<0$. For $x>${m}$, $@dfrac{${a}}{x^{2}}<${b}$, so $M'(x)>0$. This minimum is inside the permitted interval.`),
 p("Find the minimum average cost per hour.",1,J(v),
   R`$M(${m})=${b}(@,${m}@,)+${c}+@dfrac{${a}}{${m}}=${v}$ currency units per hour.`));
});

opt("disjoint-operating-bands","compare-stationary-with-feasible-band-ends","equation",3,
"AI-SL5.7.optimal-input AI-SL5.7.optimum-value AI-SL5.7.test-optimality","Compare the best points in two permitted operating bands",({rng:r})=>{
 const a=r.int(2,7),m=r.int(8,22),u=r.int(1,4),v=r.pick([1,2,3,4,5].filter(z=>z!==u));
 const l=m-u-r.int(1,3),b=m-u,c=m+v,d=c+r.int(1,6),M=a*Math.max(m-l,d-m)**2+r.int(60,150),win=u<v?b:c,F=x=>M-a*(x-m)**2;
 return q(R`The output of a device is modelled by $G(x)=${M}-${a}(x-${m})^{2}$, with $x$ measured in millimetres. A safety rule allows only settings in $[${l},${b}]$ or $[${c},${d}]$. Fractional settings within the two bands are permitted.`,{a,m,M,l,b,c,d},
 p("Find the setting at the maximum of the unrestricted model.",1,J(m),
   R`The model is a downward parabola with its vertex at $x=${m}$. This is in the prohibited gap, not inside either band.`),
 p("Explain which setting to test in each band, before comparing their outputs.",2,
   X(R`Compare $x=${b}$ from the left band and $x=${c}$ from the right band.`),
   R`Output increases throughout the left band, giving its maximum at the right endpoint $x=${b}$. It decreases throughout the right band, giving its maximum at the left endpoint $x=${c}$.`),
 p("Find the permitted setting that maximises output.",1,J(win),
   R`Compare $G(${b})=${F(b)}$ and $G(${c})=${F(c)}$. The larger is at $x=${win}$ millimetres.`),
 p("Find the maximum permitted output.",1,J(F(win)),
   R`Substitute the chosen setting: $G(${win})=${F(win)}$.`));
});

aa("reverse-chain-calibrated-dose","fit-a-nonlinear-boundary-then-invert","words",4,"5.10",
"SL5.10.inspection-substitution SL5.10.find-function-from-derivative","Recover a calibrated accumulation model and invert it",({rng:r})=>{
 const k=r.int(5,21)/100,b=r.int(2,8),t0=r.int(1,2),t1=t0+1,reading=r.int(20,53),gain=r.int(12,35);
 const expr=R`${3*b}(@,${num(k)}@,)t^{2}@mathrm{e}^{${num(k)}t^{3}}`;
 const C=reading-b*Math.exp(k*t0**3),level=b*Math.exp(k*t1**3)+C,target=reading+gain;
 const tt=Math.cbrt(Math.log((target-C)/b)/k);
 return q(R`A sensor’s reading $M(t)$ changes at rate $M'(t)=${expr}$ for $t@ge0$, where $t$ is in minutes. The sensor reads $${reading}$ at $t=${t0}$.`,{k,b,t0,t1,reading,gain},
  p("Find an expression for $M(t)$ that satisfies the given reading.",2,
    X(R`$M(t)=${reading}+${b}(@mathrm{e}^{${num(k)}t^{3}}-@mathrm{e}^{${num(k)}(@,${t0}@,)^{3}})$.`),
    R`Since the derivative of $${num(k)}t^{3}$ is $3(@,${num(k)}@,)t^{2}$, the antiderivative is $${b}@mathrm{e}^{${num(k)}t^{3}}+C$. Substitution at $t=${t0}$ gives $C=${reading}-${b}@mathrm{e}^{${num(k)}(@,${t0}@,)^{3}}$.`),
  p(R`Find $M(${t1})$, giving three significant figures.`,2,S(level),
    R`Preserving the exact constant gives $M(${t1})=${reading}+${b}(@mathrm{e}^{${num(k)}(@,${t1}@,)^{3}}-@mathrm{e}^{${num(k)}(@,${t0}@,)^{3}})@approx${sf(level)}$.`),
  p(R`Find the time when the reading first reaches $${target}$. Give three significant figures.`,2,S(tt),
    R`Solve $@mathrm{e}^{${num(k)}t^{3}}=@mathrm{e}^{${num(k)}(@,${t0}@,)^{3}}+@dfrac{${gain}}{${b}}$. Taking a logarithm and cube root gives $t@approx${sf(tt)}$ minutes. The derivative is positive for $t>0$, so this crossing is unique.`));
});

aa("calibrated-relative-decline","recover-decay-from-relative-gradient","words",4,"5.6",
"SL5.6.product-rule SL5.6.chain-rule","Use relative rather than absolute gradient to calibrate a model",({rng:r})=>{
 const a=r.int(2,8),b=r.int(3,12),s=r.int(1,4),H=s+r.int(2,5),d=r.int(5,23)/100;
 const zz=s+a,k=d+1/zz,F=t=>b*(t+a)*Math.exp(-k*t),pct=100*(1-F(H)/F(s));
 return q(R`A signal has strength $S(t)=${b}(t+${a})@mathrm{e}^{-kt}$ for $t@ge0$, where $t$ is in minutes and $k$ is a positive constant. At $t=${s}$ its instantaneous rate of change divided by its strength is $-${num(d)}$ per minute.`,{a,b,s,H,d},
  p(R`Find an expression for $@dfrac{S'(t)}{S(t)}$ in terms of $t$ and $k$.`,2,
    X(R`$@dfrac{S'(t)}{S(t)}=@dfrac{1}{t+${a}}-k$.`),
    R`The product and chain rules give $S'(t)=${b}@mathrm{e}^{-kt}-${b}k(t+${a})@mathrm{e}^{-kt}$. Divide by $${b}(t+${a})@mathrm{e}^{-kt}$.`),
  p("Find $k$ to three significant figures.",2,S(k),
    R`At $t=${s}$, $@dfrac{1}{${zz}}-k=-${num(d)}$, so $k=${num(d)}+@dfrac{1}{${zz}}@approx${sf(k)}$.`),
  p(R`Find the percentage decrease in $S$ between $t=${s}$ and $t=${H}$. Give three significant figures.`,2,S(pct),
    R`Use the exact $k$ from the previous part. $S(${s})@approx${sf(F(s))}$ and $S(${H})@approx${sf(F(H))}$. Apply $100@left(1-@dfrac{S(${H})}{S(${s})}@right)@approx${sf(pct)}@%$ using unrounded values.`));
});
})(typeof window==="undefined"?globalThis:window);
