/* Original Wave 4 calculus. Parameters are bounded; exam pointers live outside generator code. */
(function(root){
"use strict";
const E=root.QBEngine,{ans:A,fmt:F}=E;
const {num,sf,frac}=F;
const R=(ss,...xs)=>String.raw({raw:ss},...xs).replace(/@/g,"\\");
const p=(prompt,marks,answer,...working)=>({prompt,marks,answer,working});
const q=(stem,params,...parts)=>({stem,params,parts});
const T=x=>F.m(String(x)), round=x=>A.sf(x,3), self=x=>A.self(x);
const inv=(f,a,b)=>{for(let j=0;j<52;j++){const x=(a+b)/2;if(f(x)<0)a=x;else b=x;}return (a+b)/2;};
const add=(id,u,rep,l,syllabus,skills,title,build)=>E.register({type:"w4-t5-"+id,unknown:u,representation:rep,format:"value",levels:[l],home:"aa-sl",syllabus,skills:skills.split(" "),title,calculator:l===4,source:"original-wave-4",build});

add("paired-chord-calibration","separate-even-and-odd-contributions","table",3,["5.1"],"SL5.1.chord-to-tangent SL5.1.estimate-limit","Separate the effects on two opposite chord gradients",({rng:r})=>{
 const x=r.int(3,12),h=r.int(2,6),a=r.int(2,17)*r.sign(),b=r.int(2,8)*r.sign(),c=r.int(2,5),up=a+b*h+c*h*h,down=a-b*h+c*h*h;
 const obj=q(R`Near $x=${x}$ a curve satisfies $f(${x}+k)-f(${x})=Ak+Bk^2+${c}k^3$. The table gives the gradient of the chord from input $${x}$ to input $${x}+k$.`,{x,h,c,up,down},
  p("Find $B$.",2,A.int(b),R`Dividing the ordinate difference by $k$ gives chord gradient $A+Bk+${c}k^2$. Subtract the row for negative $k$ from the row for positive $k$: $2(${h})B=${num(up)}-(${num(down)})$. Hence $B=${b}$.`),
  p(R`Find $f'(${x})$ exactly.`,2,A.int(a),R`The mean of the two chord gradients is $A+${c}(${h})^2$. Subtract the quadratic contribution to obtain $A=${a}$. As $k@to0$ the chord gradient tends to $A$.`),
  p("Explain why averaging the opposite chord gradients does not give the tangent gradient exactly.",1,self("The linear chord terms cancel, but the quadratic chord terms do not."),
  R`Both chord gradients include the same strictly positive term $${c}(${h})^2$; changing the sign of $k$ does not change this term.`));
 return {...obj,table:{head:[T("k"),T(h),T(-h)],rows:[["Chord gradient",T(up),T(down)]]}};
});

add("tangent-prediction-at-slowing-point","rate-threshold-then-prediction-error","words",4,["5.1"],"SL5.1.interpret-derivative SL5.1.chord-to-tangent","Use a local tangent prediction at a specified instantaneous rate",({rng:r,course})=>{
 const h=r.int(2,6),v=r.int(13,32),b=r.int(6,35),d=r.int(12,23)/10,g=r.int(5,13)/5;
 const model=t=>b+v*Math.sqrt(t+h);
 const t=(v/(2*d))**2-h,pred=model(t)+d*g,actual=model(t+g),err=pred-actual;
 return q(R`A reservoir level in centimetres is modelled by $H(t)=${b}+${v}@sqrt{t+${h}}$, where $t@ge0$ is time in minutes. Let $t_{0}$ be the time when the instantaneous rate is $${num(d)}$ centimetres per minute.`,{h,v,b,d,g},
  p(course==="ai-sl" ? "Find $t_{0}$. Give three significant figures." : "Use a numerical derivative and solver, or an algebraic method, to find $t_{0}$. Give three significant figures.",2,round(t),
  course==="ai-sl" ? R`On the GDC, graph the numerical derivative of $H$ and the horizontal line $y=${num(d)}$. Use Intersection on $0@le t@le 180$ to find $t_{0}@approx${sf(t)}$.` : R`Solve $H'(t)=${num(d)}$. The gradient decreases from $H'(0)$ to zero, so there is one solution: $t_{0}@approx${sf(t)}$.`),
  p(R`Use the tangent at $t_{0}$ to predict the level $${num(g)}$ minutes later. Give three significant figures.`,2,round(pred),
  R`The horizontal change is $${num(g)}$ minutes; the tangent assumes the same instantaneous rate throughout. Use $H(t_{0})+${num(d)}(@,${num(g)}@,)@approx${sf(pred)}$ centimetres, keeping the unrounded time.`),
  p("By how many centimetres does this tangent prediction exceed the model value? Give three significant figures.",2,round(err),
  R`Evaluate $H(t_{0}+${num(g)})$ directly. Subtract it from the unrounded tangent estimate. The excess is $${sf(err)}$ centimetres.`));
});

add("monotonicity-with-hole","decrease-separated-by-excluded-input","equation",3,["5.2"],"SL5.2.increasing-decreasing-intervals SL5.2.sign-at-point","Distinguish a missing input from a stationary input in a sign chart",({rng:r})=>{
 const a=r.int(1,9), c=a+r.int(2,6), b=c+r.int(2,7);
 return q(R`A function is differentiable for all real $x$ except $x=${c}$, where it is not defined. Its derivative is $f'(x)=@dfrac{(x-${a})(x-${b})}{(x-${c})^2}$.`,{a,b,c},
  p("Find the number of stationary points.",2,A.int(2),R`At $x=${a}$ and $x=${b}$ the numerator vanishes and the denominator does not. The excluded input $x=${c}$ is not a stationary point.`),
  p("State all maximal open intervals on which the function is strictly decreasing.",2,self(R`$(${a},${c})$ and $(${c},${b})$.`),
  R`The squared denominator is positive wherever defined. The numerator is negative between its two roots. Split that interval at the excluded input.`),
  p(R`Find $f'(${c+1})$ exactly.`,1,A.int((c+1-a)*(c+1-b)),R`At $x=${c+1}$ the denominator equals $1$. The product of the numerator factors is $${(c+1-a)*(c+1-b)}$.`));
});

add("rising-window-in-cycles","combine-two-rising-intervals","equation",4,["5.2"],"SL5.2.increasing-decreasing-intervals SL5.2.sign-at-point","Combine two increasing intervals within a nonaligned observation window",({rng:r})=>{
 const a=r.int(21,78)/100,k=r.int(2,7),lo=r.int(1,3)/100,rgt=r.int(20,45)/100,
    stop=(2+rgt)/k,t0=lo/k,w=Math.acos(a)/(Math.PI*k),
    tL=w,tR=2/k-w,lenL=tL-t0,lenR=Math.min(stop,2/k+w)-tR;
 return q(R`The rate of change of a signal satisfies $S'(t)=@cos(${k}@pi t)-${num(a)}$, with angles in radians. Observe it on $@left[@dfrac{${num(lo)}}{${k}},@dfrac{${num(2+rgt)}}{${k}}@right]$. Time is in seconds.`,{a,k,lo,rgt},
  p("Find the first positive time when the signal changes from increasing to decreasing. Give three significant figures.",2,round(tL),
  R`Solve $@cos(${k}@pi t)=${num(a)}$ in the first half-period. The first boundary is $t@approx${sf(tL)}$.`),
  p("Find the time when the signal next starts increasing. Give three significant figures.",2,round(tR),
  R`In the remainder of the same period, the cosine crosses the threshold at $t=@dfrac{2}{${k}}-t_{1}@approx${sf(tR)}$, where $t_{1}$ is the first boundary.`),
  p("Find the total time within the observed interval for which the signal is increasing. Give three significant figures.",2,round(lenL+lenR),
  R`Count the first rising segment from the observation start. Count the second from its rising boundary up to the earlier of the end of observation and the next falling boundary. Their lengths sum to $${sf(lenL+lenR)}$ seconds.`));
});

add("piecewise-delivery-meter","continuous-rate-change-and-reset","words",4,["5.5"],"SL5.5.definite-integral-gdc SL5.5.total-change-from-rate","Accumulate delivery across a switch of rate model",({rng:r})=>{
 const a=r.int(6,18),m=r.int(2,5),s=r.int(2,6),k=r.int(21,75)/100,L=r.int(3,7),early=a*s+m*s*s/2;
 const v=a+m*s,tail=u=>v*2*((1+k*u)**1.5-1)/(3*k);
 const target=early+Math.floor(tail(L)*0.62),tau=inv(u=>early+tail(u)-target,0,L),total=early+tail(L);
 return q(R`A dispenser starts empty and fills a container. Its rate is $r(t)=${a}+${m}t$ litres per minute for $0@le t@le${s}$. From $t=${s}$ until $t=${s+L}$ the rate is $r(t)=${v}@sqrt{1+${num(k)}(t-${s})}$ litres per minute.`,{a,m,s,k,L,target},
  p(R`Find the volume dispensed by the switch at $t=${s}$. Give three significant figures.`,1,round(early),
  R`Integrate the first rate formula from zero to $${s}$: the volume is $${sf(early)}$ litres.`),
  p("Find the total dispensed by the end of the process. Give three significant figures.",2,round(total),
  R`Add the integral of the second rate from $${s}$ to $${s+L}$ to the volume already dispensed. This gives $${sf(total)}$ litres.`),
  p(R`Find the time from the start when the container first holds $${num(target)}$ litres. Give three significant figures.`,3,round(s+tau),
  R`The target exceeds the first-stage volume. Set $@displaystyle@int_{${s}}^{t}${v}@sqrt{1+${num(k)}(u-${s})}@,@mathrm{d}u=${num(target-early)}$. Use a solver with a numerical integral, or refine with evaluations. The rate is positive, giving one crossing at $t@approx${sf(s+tau)}$ minutes.`));
});

add("steady-reading-unknown-drain","calibrate-baseline-loss-from-integrals","words",4,["5.5"],"SL5.5.definite-integral-gdc SL5.5.total-change-from-rate SL5.5.boundary-condition","Infer a constant leak from equal reservoir readings",({rng:r})=>{
 const a=r.int(12,25),k=r.int(18,61)/100,H=r.int(5,9),w=r.int(2,H-2),V=r.int(100,160);
 const raw=t=>a*2*((1+k*t)**1.5-1)/(3*k),loss=raw(H)/H,delta=raw(w)-loss*w;
 return q(R`A tank starts with $${V}$ litres. The inflow is $I(t)=${a}@sqrt{1+${num(k)}t}$ litres per minute, where $t$ is in minutes. The tank loses water at a constant rate $c$ litres per minute. At $t=${H}$ it again holds $${V}$ litres.`,{a,k,H,w,V},
  p(R`Find the total inflow from $t=0$ to $t=${H}$. Give three significant figures.`,2,round(raw(H)),
  R`Evaluate $@displaystyle@int_{0}^{${H}}${a}@sqrt{1+${num(k)}t}@,@mathrm{d}t$. It is approximately $${sf(raw(H))}$ litres.`),
  p("Find the constant loss rate, to three significant figures.",2,round(loss),
  R`The net change is zero over the stated interval. The total loss is $${H}c$, so divide the unrounded total inflow by $${H}$ to obtain $c@approx${sf(loss)}$.`),
  p(R`Find the volume in the tank at $t=${w}$. Give three significant figures.`,2,round(V+delta),
  R`Add the net change to the initial volume: $V(${w})=${V}+@displaystyle@int_{0}^{${w}} I(t)@,@mathrm{d}t-${w}c@approx${sf(V+delta)}$. Use the unrounded value of $c$.`));
});

add("inverse-power-slope-band","two-slope-thresholds","equation",4,["5.3"],"SL5.3.negative-powers SL5.3.point-with-given-gradient SL5.3.power-rule","Find the width of an input band selected by tangent gradients",({rng:r})=>{
 const a=r.int(2,8),b=r.int(7,24),g=r.int(3,21),j=g+r.int(4,19),f=x=>3*a*x*x-b/(x*x);
 const u=inv(x=>f(x)-g,.1,10),v=inv(x=>f(x)-j,.1,10);
 return q(R`The curve $y=${a}x^3+@dfrac{${b}}{x}$ is defined for $x>0$. Its tangent gradient is between $${g}$ and $${j}$, inclusive, on a single interval.`,{a,b,g,j},
  p("Find an expression for the tangent gradient in terms of $x$.",2,self(R`$${3*a}x^2-@dfrac{${b}}{x^2}$`),
  R`Write the reciprocal term as $${b}x^{-1}$ and differentiate each term.`),
  p(R`Find the smaller endpoint of the interval, to three significant figures.`,2,round(u),
  R`The gradient expression increases on $x>0$. Solve $@dfrac{@mathrm{d}y}{@mathrm{d}x}=${g}$ on that domain to obtain $x@approx${sf(u)}$.`),
  p("Find the width of the interval, to three significant figures.",2,round(v-u),
  R`Solve for the larger endpoint by setting the gradient to $${j}$; it is approximately $${sf(v)}$. Subtract the unrounded smaller endpoint to obtain $${sf(v-u)}$.`));
});

add("log-power-inflection","nonstationary-concavity-switch","equation",4,["5.7","5.6"],"SL5.7.find-second-derivative SL5.7.concavity SL5.6.standard-derivatives","Find where the concavity changes without a stationary point",({rng:r})=>{
 const a=r.int(2,10),b=r.int(45,160),x=(b/(20*a))**.2,y=a*x**5+b*Math.log(x),d=5*a*x**4+b/x;
 return q(R`For $x>0$, let $f(x)=${a}x^5+${b}@ln x$.`,{a,b},
  p("Find an expression for $f''(x)$.",2,self(R`$f''(x)=${20*a}x^3-@dfrac{${b}}{x^2}$.`),
    R`First $f'(x)=${5*a}x^4+@dfrac{${b}}{x}$. Differentiate once more, remembering the minus sign from differentiating the reciprocal.`),
  p("Find the input of the point of inflection, to three significant figures.",2,round(x),
    R`Multiplying $f''(x)$ by the positive $x^2$ gives $${20*a}x^5-${b}$, which changes from negative to positive through one root at $x@approx${sf(x)}$.`),
  p("Find the tangent gradient at the point of inflection, to three significant figures.",2,round(d),
    R`Evaluate $f'$ at the unrounded input, not $f''$. The tangent gradient is approximately $${sf(d)}$, so the inflection is non-stationary.`));
});

add("signed-rise-over-run-prerequisite","opposite-direction-deltas","table",0,["5.2"],"SL5.2.sign-at-point","Read the sign of the change as the input increases",({rng:r})=>{
 const x=r.int(2,8),d=r.int(2,5),y=r.int(2,35),w=r.int(2,11)*r.sign();
 const obj=q("The table gives two points on a straight segment. Read them in order of increasing input.",{x,d,y,w},
 p(R`Find the signed change in $y$ when $x$ increases from $${x}$ to $${x+d}$.`,1,A.int(w),
 R`Use final output minus initial output: $${y+w}-(${y})=${w}$. This sign also gives the sign of the gradient because the change in input is positive.`));
 return {...obj,table:{head:[T("x"),T(x+d),T(x)],rows:[[T("y"),T(y+w),T(y)]]}};
});

add("balanced-chord-quartic","zero-secant-calibrates-monotonicity","equation",5,["5.1","5.2"],"SL5.1.chord-to-tangent SL5.2.increasing-decreasing-intervals","Use a level chord to reconstruct a quartic and its increasing intervals",({rng:r})=>{
 const a=r.int(2,8),s=r.int(1,3),h=r.int(2,9),c=r.int(3,25),d=s,e=7*s,b=a*(d*d+e*e),k=5*s,v=a*k**4;
 return q(R`The curve $f(x)=${a}(x-${h})^4-B(x-${h})^2+${c}$ has a horizontal chord joining the points at $x=${h}-${d}$ and $x=${h}+${e}$.`,{a,s,h,c,d,e},
  p("Use the chord condition to find $B$ exactly.",3,A.int(b),
    R`A horizontal chord means equal endpoint values. Cancel the constant and use $B(${e}^2-${d}^2)=${a}(${e}^4-${d}^4)$. Divide by the positive difference of squares: $B=${num(b)}$.`),
  p("State all maximal open intervals on which $f$ is strictly increasing.",3,self(R`$(${h-k},${h})$ and $(${h+k},@infty)$.`),
    R`With $z=x-${h}$, the derivative is $${4*a}z(z-${k})(z+${k})$. It is positive when $-${k}<z<0$ or $z>${k}$.`),
  p(R`Find the exact vertical distance between the stationary point at $x=${h}$ and the one to its right.`,2,A.int(v),
    R`At the central point, $f=${c}$. At the right-hand stationary point, use $z=${k}$ and $B=2(${a})(${k})^2$. The central point is higher by $${a}(${k})^4=${num(v)}$.`));
});
})(typeof window==="undefined"?globalThis:window);
