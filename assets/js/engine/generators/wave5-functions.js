/* Original geometry-free AI modelling and functions, Wave 5. */
(function(root){
"use strict";
const E=root.QBEngine,{ans:A,fmt:F}=E;
const R=(t,...v)=>String.raw({raw:t},...v).replace(/@/g,"\\");
const n=F.num,m=x=>F.m(String(x)),fr=F.frac;
const p=(prompt,marks,answer,...working)=>({prompt,marks,answer,working});
const q=(stem,params,...parts)=>({stem,params,parts});
const tbl=(base,head,rows)=>({...base,table:{head,rows}});
const ai="ai-sl",hl="ai-hl",aa="aa-sl";
const add=(id,title,home,code,skill,l,representation,build)=>{
 const type="w5-fn-"+id,unknown="reasoning";
 E.register({type,unknown,title,home,syllabus:Array.isArray(code)?code:[code],skills:skill.split(" "),levels:[l],format:"value",representation,calculator:l===4,source:"original-wave-5",build});
};
const choose=(r,labels,ans)=>A.choice(r,{text:labels[ans],value:ans},labels.flatMap((text,i)=>i===ans?[]:[{text,value:i}]));

add("sinusoid-return-same-phase","Find when a sinusoidal reading repeats in the same direction",ai,"2.5","AI-SL2.5.sinusoidal-model",1,"words",({rng:r})=>{
 const t=r.int(2,32),T=r.pick([6,8,10,12,14,16,18,20,24,28]),h=r.int(4,19),rise=r.bool();
 return q(R`A platform’s height varies sinusoidally with period $${T}$ seconds. At $t=${t}$ it crosses its mean height of $${h}$ metres while moving ${rise?"upwards":"downwards"}.`, {t,T,h,rise},
  p("Find the next time in seconds when it crosses the mean moving in the same direction.",2,A.int(t+T),
   R`Half a period later it crosses in the opposite direction. Add the full period: $${t}+${T}=${t+T}$.`));
});

add("inverse-square-distance-control","Change distance to achieve an intensity multiplier",ai,"2.5","AI-SL2.5.variation",1,"words",({rng:r})=>{
 const a=r.int(2,13),k=r.int(2,6),up=r.bool(),at=k*a;
 return q(R`The brightness measured from a lamp is inversely proportional to the square of the distance $d$. The current distance is $${at}$ metres.`, {at,k,up},
  p(R`What new distance in metres gives $${up?k*k:fr(1,k*k)}$ times the current brightness?`,2,A.int(up?a:k*at),
   R`Use the ratio $@dfrac{I_{@mathrm{new}}}{I_{@mathrm{old}}}=@left(@dfrac{d_{@mathrm{old}}}{d_{@mathrm{new}}}@right)^2$. The distance must be ${up?"divided":"multiplied"} by $${k}$, giving $${up?a:k*at}$ metres.`));
});

add("floor-from-exponential-differences","Find the unobserved floor of an exponential model",ai,["2.6","2.5"],"AI-SL2.6.find-parameters AI-SL2.5.exponential-model AI-SL2.5.horizontal-asymptote",3,"table",({rng:r})=>{
 const b=r.int(11,35),c=r.int(2,8),den=r.pick([2,3,4]),a=c*den**2,obs=[b+a,b+c*den,b+c];
 const variant=r.pick([["A material cools in a chamber.","Temperature"],["After pumping stops, the flow rate settles towards a background level.","Flow rate"]]);
 return tbl(q(R`${variant[0]} The readings follow $y=B+A@,r^t$, where $0<r<1$. Times are equally spaced.`, {obs},
  p("Find the exact value of $r$.",2,A.frac(1,den),R`The successive decreases are $${obs[0]-obs[1]}$ and $${obs[1]-obs[2]}$. Their ratio is $${fr(1,den)}$ because the baseline cancels from both changes.`),
  p("Find the long-run reading $B$ exactly.",2,A.int(b),R`At $t=1$, $y_1-B=r(y_0-B)$. Rearrange for $B$, giving $${b}$.`),
  p("Predict the reading at $t=3$ exactly.",2,A.frac(b*den+c,den),R`At $t=2$, the reading is $${c}$ above the baseline. After one more step its excess is $${fr(c,den)}$, so the reading is $${fr(b*den+c,den)}$.`)),
  ["Time",m(0),m(1),m(2)],[[variant[1],...obs.map(m)]]);
});

add("two-decays-with-reversing-order","Locate when a smaller initial reading becomes larger","ai-sl","2.5","AI-SL2.5.exponential-model AI-SL2.5.horizontal-asymptote",3,"equation",({rng:r})=>{
 const B=r.int(8,31),d=r.int(2,9),b=r.pick([2,3]),k=r.int(2,5),h=r.int(1,4),C=d*b**k;
 const models=["Model A","Model B","The models remain equal"];
 const exponent=h>1?R`-@dfrac{t}{${h}}`:"-t";
 return q(R`Two calibrations give readings at time $t@ge0$ hours: $A(t)=${B}+${2*C}@cdot${b}^{${exponent}}$ and $B(t)=${B+d}+${C}@cdot${b}^{${exponent}}$.`, {B,d,b,h,C},
  p("Find the long-run value of $B(t)-A(t)$.",1,A.int(d),
   R`The exponential terms tend to zero. The difference then tends to $(${B+d})-${B}=${d}$.`),
  p("Find the exact time in hours when the two readings are equal.",3,A.int(h*k),
   R`At equality, $${C}@cdot${b}^{${exponent}}=${d}$. Since $${C}=${d}@cdot${b}^{${k}}$, the exponent equals $-${k}$. This gives $t=${h*k}$.`),
  p("Which model gives the lower reading after this time?",1,choose(r,models,0),
   R`The difference $B(t)-A(t)$ is the positive floor difference minus a shrinking positive exponential term. It starts increasing through zero at equality and stays positive. Model A is lower.`));
});


add("cubic-limited-run-window","Compare the lengths of two distinct time windows above a threshold",ai,"2.5","AI-SL2.5.cubic-model",3,"words",({rng:r})=>{
 const a=r.int(2,5),b=a+r.int(2,4),c=b+r.int(2,5),H=r.int(58,91),K=r.int(2,6);
 // Leading coefficient is positive, so the above-threshold intervals are (a,b) and (c,end].
 const horizon=c+(b-a)+r.pick([-1,1,2]);
 return q(R`A controller displays the score $S(t)=${H}+${K}(t-${a})(t-${b})(t-${c})$ during a timed diagnostic, $0@le t@le ${horizon}$ minutes. High mode is on exactly when $S(t)>${H}$.`, {a,b,c,horizon,H,K},
  p(R`Find the total number of minutes spent in high mode.`,3,A.int((b-a)+(horizon-c)),
   R`The score equals the threshold at $t=${a},${b},${c}$. Between the first two roots exactly two factors are negative; after the last all are positive. High mode lasts $${b-a}$ minutes in the first interval and $${horizon-c}$ in the second.`),
  p("Find the length of the longest uninterrupted stretch in high mode.",2,A.int(Math.max(b-a,horizon-c)),
   R`Compare the durations of the two separate stretches. The longer is $${Math.max(b-a,horizon-c)}$ minutes. Do not join the stretches across the time below threshold.`));
});

add("in-range-unphysical-model","Reject a physically impossible prediction within the observed range",ai,"2.6","AI-SL2.6.test-model AI-SL2.6.limitations",1,"words",({rng:r})=>{
 const cap=r.int(18,65),gap=r.int(1,9),hi=r.bool(),y=hi?cap+gap:-gap,t=r.int(4,38);
 const opts=["The estimate is impossible because it falls outside the physical range.","The estimate is reliable because it is within the observed input range.","The estimate must be reliable because the model has a formula."];
 return q(R`A tank holds between $0$ and $${cap}$ litres. A fitted model predicts $${y}$ litres at time $t=${t}$ minutes. This time lies within the range of times used to fit the model.`, {cap,y,t},
  p("What can be concluded about this prediction?",2,choose(r,opts,0),
   R`The output is ${hi?"above capacity":"negative"}, so it is impossible even though the input is inside the fitted time range.`));
});

add("bias-shift-held-out-check","Correct a signed model bias and test it on a separate observation",ai,"2.6","AI-SL2.6.test-model AI-SL2.6.find-parameters",3,"table",({rng:r})=>{
 const a=r.int(20,46),b=a+r.int(3,13),c=b+r.int(3,19),k=r.int(3,8)*r.sign(),test=r.pick([0,1,2,3,4,5,6,7,8])*(k>0?1:-1);
 const ref=r.bool()?-test:test,obs=[a,b,c],pred=[a+k,b+k,c+ref],newPred=c+ref-k,delta=Math.abs(ref-k)-Math.abs(ref);
 return tbl(q("A model’s signed error is its prediction minus the observation. A technician subtracts one constant from all predictions so that the two calibration entries match their observations. The test entry was not used for calibration.", {obs,pred},
  p("Find the signed constant the technician must subtract.",2,A.int(k),
   R`For each calibration case, prediction minus observation is $${k}$. Subtracting this signed value makes both match.`),
  p("Find the corrected prediction for the test entry.",1,A.int(newPred),
   R`Subtract the same constant from the original test prediction: $${pred[2]}-(${k})=${newPred}$.`),
  p("Find corrected absolute test error minus original absolute test error.",2,A.int(delta),
   R`The original absolute error is $${Math.abs(ref)}$. The new one is $${Math.abs(ref-k)}$. Their difference is $${delta}$. A negative result means the correction helped; a positive result means it made the test prediction worse.`)),
  ["Entry","Calibration A","Calibration B","Test"],[["Observed",...obs.map(m)],["Predicted",...pred.map(m)]]);
});

add("difference-from-two-segment-tables","Recover two zeros by interpolating a difference graph",aa,"2.3","SL2.3.sum-difference",3,"table",({rng:r})=>{
 const u=r.int(1,8),d=r.int(2,8),e=r.int(2,8),g=[r.int(9,16),r.int(10,21),r.int(8,17)];
 const A0=r.int(2,8),B0=r.int(3,9),C0=r.int(2,8),sg=r.sign(),diff=[sg*A0,-sg*B0,sg*C0];
 const xs=[u,u+d,u+d+e],f=g.map((x,j)=>x+diff[j]),root1=u*(A0+B0)+d*A0,root2=(u+d)*(B0+C0)+e*B0;
 return tbl(q(R`Both $f$ and $g$ are straight between successive table entries, with no extensions. Let $h=f-g$.`, {xs,f,g},
  p(R`Find the exact value of $h(${u+d})$.`,1,A.int(diff[1]),
   R`At that input the difference is $${f[1]}-${g[1]}=${diff[1]}$.`),
  p("Find the smaller zero of $h$ exactly.",2,A.frac(root1,A0+B0),
   R`The first segment has endpoint differences $${diff[0]}$ and $${diff[1]}$. Start at $x=${u}$ and move $${fr(A0,A0+B0)}$ of the interval’s width: the zero is $${fr(root1,A0+B0)}$.`),
  p("Find the larger zero of $h$ exactly.",2,A.frac(root2,B0+C0),
   R`On the next segment, start at $x=${u+d}$ and move $${fr(B0,B0+C0)}$ of its width. The zero is $${fr(root2,B0+C0)}$.`)),
  [m("x"),...xs.map(m)],[[m("f(x)"),...f.map(m)],[m("g(x)"),...g.map(m)]]);
});

add("flat-maximum-threshold-window","Distinguish a flat maximum from a wider qualifying interval",aa,"2.4","SL2.4.max-min SL2.4.interval-from-graph",3,"table",({rng:r})=>{
 const a=r.int(2,5),b=a+r.int(2,7),d=r.int(2,8),s1=r.int(2,4),s2=r.int(2,4);
 const c=b+d,M=r.int(33,60),gap=r.int(1,3),V=M-gap,z0=M-a*s1,z3=M-d*s2;
 const duration=(b-a)*s1*s2+gap*(s1+s2);
 return tbl(q(R`A ramp profile is straight between consecutive records and is only defined over the table’s time span. Height is in centimetres and time in seconds. A switch is on whenever the height is at least $${V}$ centimetres.`, {a,b,c,z0,z3,M,V},
  p("For how many seconds does the profile stay at its maximum height?",2,A.int(b-a),
   R`The flat top is the entire interval from $${a}$ to $${b}$ seconds, so it lasts $${b-a}$ seconds.`),
  p("Find the exact time in seconds when the switch first turns on.",2,A.frac(a*s1-gap,s1),
   R`On the rising ramp, the height changes by $${s1}$ centimetres per second. Back up $${fr(gap,s1)}$ seconds from $${a}$ to reach the threshold: $t=${fr(a*s1-gap,s1)}$.`),
  p("For how many seconds is the switch on? Give an exact answer.",2,A.frac(duration,s1*s2),
   R`On the descending ramp it reaches threshold $${fr(gap,s2)}$ seconds after $${b}$. Add the two ramp times to the flat top duration: $${b-a}+${fr(gap,s1)}+${fr(gap,s2)}=${fr(duration,s1*s2)}$.`)),
  ["Time",m(0),m(a),m(b),m(c)],[["Height",m(z0),m(M),m(M),m(z3)]]);
});

add("composite-domain-reject-branch","Undo a two-stage calibration and reject its impossible branch",hl,"2.7","AI-AHL2.7.composite-equation AI-AHL2.7.inverse-domain-range",3,"words",({rng:r})=>{
 const h=r.int(3,12),m0=r.int(2,6),u=r.int(1,5),d=r.int(1,3),z=r.int(3,17),rad=d+m0*u;
 const c=h+d,reading=z+rad*rad;
 return q(R`A calibration first converts a nonnegative input $x$ to $u=f(x)=${m0}x+${c}$. Its displayed reading is then $g(u)=(u-${h})^2+${z}$. The displayed reading is $${reading}$.`, {h,m0,c,z,reading},
  p("Ignoring the physical restriction, find the smaller algebraic candidate for $u$.",2,A.int(h-rad),
   R`The equation is $(u-${h})^2=${rad*rad}$. The two candidates are $${h-rad}$ and $${h+rad}$; the smaller is $${h-rad}$.`),
  p("Find the only allowed original input $x$ exactly.",2,A.int(u),
   R`The smaller intermediate value gives a negative $x$ because it is less than $${c}$. Use the larger value $${h+rad}$ in $u=${m0}x+${c}$: $x=${u}$.`),
  p("Find the least reading this calibration can display.",2,A.int(z+d*d),
   R`Allowed intermediate values satisfy $u@ge${c}>${h}$, so $(u-${h})^2$ is smallest when $x=0$. The resulting reading is $${z+d*d}$.`));
});

add("log-axis-next-grid-label","Continue consecutive major labels on a logarithmic scale",hl,"2.10","AI-AHL2.10.log-scale",1,"table",({rng:r})=>{
 const p0=r.int(-3,2),fac=r.pick([2,3,4,5,6,7,8,9]),over=r.bool();
 const at=fac*10**p0,B=fac*10**(p0+1),C=fac*10**(p0+2),D=fac*10**(p0-1);
 // Round the display data only to remove IEEE 754 dust from representing powers of ten.
 const val=x=>Number(x.toPrecision(8));
 return tbl(q("Consecutive marked gridlines of a base-ten logarithmic input axis are equally far apart. The gap between these gridlines is one whole base-ten unit on the transformed scale.", {at:val(at),B:val(B),over},
  p(R`Find the missing labelled value on this original-unit axis.`,2,A.dec(val(over?C:D)),
   R`In the increasing direction add one to the logarithm, which multiplies the original value by $10$. ${over?"Multiply the right-hand known label by":"Divide the left-hand known label by"} $10$ to get $${n(val(over?C:D))}$.`)),
  ["Gridline A","Gridline B","Gridline C"],[over?[m(n(val(at))),m(n(val(B))),"?"]:["?",m(n(val(at))),m(n(val(B)))]]);
});

add("decrease-to-multiplier","Convert a fixed percentage decrease to its repeated multiplier",ai,"2.5","AI-SL2.5.exponential-model",0,"words",({rng:r})=>{
 const percent=r.int(4,86);
 return q(R`Each day a process keeps all of its current amount except a fixed $${percent}@%$ loss.`, {percent},
  p("Write the daily multiplier as a decimal.",1,A.dec((100-percent)/100),
   R`Keep $100@%-${percent}@%=${100-percent}@%$ of the previous amount. As a decimal this is $${n((100-percent)/100)}$.`));
});
})(typeof window==="undefined"?globalThis:window);
