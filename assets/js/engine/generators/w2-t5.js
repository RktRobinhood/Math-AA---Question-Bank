/* Original Practice wave 2, calculus. */
(function(root){
'use strict';
const E=root.QBEngine,{ans:A,fmt:F}=E,{frac,sf,piFrac}=F;
const R=(chunks,...v)=>String.raw({raw:chunks},...v).replace(/@/g,'\\');
const P=(prompt,marks,answer,...working)=>({prompt,marks,answer,working});
const Q=(stem,params,...parts)=>({stem,params,parts});
const h="ai-hl",i="ai-sl",a="aa-sl",b="aa-hl";
const groupTex=tex=>tex.replace(/\d{5,}/g,v=>F.num(Number(v)));
const piTex=(x,y=1)=>groupTex(piFrac(x,y));
const exactFrac=(x,y)=>A.frac(x,y,{display:F.m(groupTex(frac(x,y)))});
const calc=x=>A.sf(x,3);
const m=x=>F.m(String(x));
const reg=(name,rep,unknown,level,home,syllabus,skills,title,build)=>
 E.register({type:'w2-t5-'+name,representation:rep,unknown,format:'value',levels:[level],home,syllabus,skills:skills.split(' '),title,calculator:level===4,source:"original-wave-2",build});

reg("stationary-curvature-from-coeff","equation","curvature",1,h,["5.10"],"AI-AHL5.10.find-second-derivative AI-AHL5.10.concavity","Read concavity at a stationary point from a local polynomial",({rng:r})=>{
 const t=r.int(2,9),k=r.int(2,8)*r.sign(),n=r.int(2,5),j=r.int(2,12);
 return Q(R`The function $f(x)=${n}(x-${t})^{3}${k>0?'+':'-'}${Math.abs(k)}(x-${t})^{2}+${j}$ has a stationary point at $x=${t}$.`,{t,k,n,j},
 P(R`Find $f''(${t})$.`,1,A.int(2*k),R`The cubic's contribution to $f''$ is proportional to $x-${t}$ and so vanishes at this point. The quadratic contributes $2(${k})=${2*k}$.`),
 P("Classify the point using the second derivative test.",1,A.self(k>0?"Local minimum":"Local maximum"),R`At the stationary point the second derivative is ${k>0?'positive':'negative'}, so it is a local ${k>0?'minimum':'maximum'}.`));
});

reg("reverse-chain-frequency","equation","signed-coefficient",1,h,["5.11"],"AI-AHL5.11.standard-integrals AI-AHL5.11.linear-composites","Find the signed coefficient of a cosine antiderivative",({rng:r})=>{
 const f=r.int(2,9), k=r.int(2,11), n=f*k;
 return Q(R`An antiderivative of $${n}@sin(${k}x)$, with angles in radians, is $c@cos(${k}x)+C$.`,{f,k,n},
 P("Find $c$.",2,A.int(-f),R`Differentiating the proposed form gives $-${k}c@sin(${k}x)$. Equating coefficients gives $-${k}c=${n}$, or $c=-${f}$.`));
});

reg("net-inflow-two-decays","words","change",4,h,["5.11"],"AI-AHL5.11.standard-integrals AI-AHL5.11.linear-composites","Compare two accumulated transfers with different exponential rates",({rng:r})=>{
 const u=r.int(14,27),v=r.int(4,13),p=r.int(3,7),q=p+r.int(1,3),end=r.int(4,8),base=r.int(30,80);
 const net=u*10/p*(-Math.expm1(-p*end/10))-v*10/q*(-Math.expm1(-q*end/10));
 return Q(R`A tank contains $${base}$ litres at $t=0$. Inflow is $${u}@mathrm{e}^{-${frac(p,10)}t}$ and outflow is $${v}@mathrm{e}^{-${q===10?"":frac(q,10)}t}$, in litres per minute.`,{u,v,p,q,end,base},
 P(R`Write a definite integral for the change in the number of litres from $t=0$ to $t=${end}$.`,2,A.self(R`$@int_{0}^{${end}}@left(${u}@mathrm{e}^{-${frac(p,10)}t}-${v}@mathrm{e}^{-${q===10?"":frac(q,10)}t}@right)@,@mathrm{d}t$`),"Integrate the net rate: inflow minus outflow."),
 P(R`Calculate the number of litres at $t=${end}$ to three significant figures.`,3,calc(base+net),R`The antiderivative of $@mathrm{e}^{-kt}$ is $-@dfrac{@mathrm{e}^{-kt}}{k}$. Evaluate both terms and add the starting volume to get $${sf(base+net,3)}@text{ L}$.`));
});

reg("washer-slice-axis-reading","words","slice-area",1,h,["5.12"],"AI-AHL5.12.volume-y-axis","Identify the inner radius of a slice about the y-axis",({rng:r})=>{
 const u=r.int(2,7),v=u+r.int(2,6),y=r.int(1,12);
 return Q(R`At height $y=${y}$ centimetres, a region to the right of the vertical axis runs from $x=${u}$ to $x=${v}$. Rotate it about the $y$-axis.`,{u,v,y},
 P("State the inner radius of the cross-section at this height, in centimetres.",1,A.int(u),R`The nearer endpoint to the axis $x=0$ is at $x=${u}$.`),
 P(R`The area is $K@pi$ square centimetres. Find $K$.`,1,A.int(v*v-u*u),R`Subtract the inner disk from the outer one: $@pi(${v}^{2}-${u}^{2})=${piFrac(v*v-u*u)}$.`));
});

reg("area-vertically-translated-density","equation","level-shift",3,i,["5.5"],"SL5.5.area-positive SL5.5.antidiff-power","Recover a vertical shift from a known area",({rng:r})=>{
 const n=r.int(2,5),k=r.int(2,12),f=r.int(1,5),c=3*f,d=r.int(2,7),total=f*((d+n)**3-d**3)+n*k;
 return Q(R`On $${d}@le x@le ${d+n}$ the curve is $y=${c}x^2+k$ with $k>0$. The area between the curve and the $x$-axis on this interval is $${total}$.`,{n,k,f,c,d,total},
 P("Find the contribution to the area from the quadratic term alone.",2,A.int(total-n*k),R`Its antiderivative is $${f===1?'':f}x^3$. Subtract the lower value from the upper value to get $${total-n*k}$.`),
 P("Find $k$.",3,A.int(k),R`The constant adds a rectangle of area $${n}k$. Subtract the quadratic contribution and divide by $${n}$: $k=${k}$. The curve stays above the axis.`));
});

reg("trapezoid-unknown-sample-time","table","sample-time",3,i,["5.8"],"AI-SL5.8.interval-width AI-SL5.8.from-table","Recover a sampling time from two unequal trapezoids",({rng:r})=>{
 const L=2*r.int(5,12),t=r.int(2,L-2),a0=2*r.int(2,8),c0=a0+2*r.int(2,9),b0=2*r.int(4,12);
 const u=(a0+b0)/2,v=(b0+c0)/2,total=u*t+v*(L-t);
 const q=Q(R`A logger sampled flow rate. The estimate from one trapezoid per adjacent pair is $${total}$ litres. Time is in minutes and flow rate in litres per minute.`,{L,t,a0,c0,b0,total},
 P("Calculate the missing sampling time $t$, showing how both widths enter.",4,A.int(t),R`The widths are $t$ and $${L}-t$. The average heights are $${u}$ and $${v}$. Hence $${u}t+${v}(${L}-t)=${total}$, giving $t=${t}$.`),
 P("With the same measured flow rates, how much smaller would the estimate be if the middle time were one minute later?",2,A.int(v-u),R`One minute moves from the second trapezoid to the first. Their average heights differ by $${v-u}$ litres per minute, so the estimate would be $${v-u}$ litres smaller.`));
 return {...q,table:{head:["Time",m(0),m("t"),m(L)],rows:[["Flow rate",m(a0),m(b0),m(c0)]]}};
});

reg("coupled-euler-substep","equation","refinement",3,h,["5.16"],"AI-AHL5.16.coupled-system AI-AHL5.16.compare-values","Compare one Euler step with two half-steps for a coupled system",({rng:r})=>{
 const x=r.int(2,12),y=r.int(2,12),c=r.int(2,6),d=r.int(2,5),den=r.int(2,7),K=2*den;
 const X=K*x+c*y,Y=K*y+d*x,z=K*X+c*Y;
 return Q(R`For $x'=${c}y$ and $y'=${d}x$, start from $x(0)=${x}$, $y(0)=${y}$. Use Euler's method to estimate $x$ at $t=${frac(1,den)}$.`,{x,y,c,d,den},
 P("Find the estimate using one full step, exactly.",2,A.frac(den*x+c*y,den),R`Use the initial slope $x'=${c*y}$, giving $${frac(den*x+c*y,den)}$.`),
 P("Find the estimate using two equal half-steps, exactly.",3,A.frac(z,K*K),R`After the first half-step, $(x,y)=@left(${frac(X,K)},${frac(Y,K)}@right)$. Evaluate the new $x'$ using that new $y$; then $x@approx${frac(z,K*K)}$.`),
 P("Find the two-step estimate minus the one-step estimate, exactly.",1,A.frac(c*d*x,K*K),R`The extra change in the second step is the half-step size times the change in $x'$, giving $${frac(c*d*x,K*K)}$.`));
});

reg("reciprocal-sum-area-threshold","equation","upper-bound",4,b,["5.15"],"AHL5.15.standard-integrals AHL5.15.linear-composites","Use the logarithmic antiderivative to solve an area threshold",({rng:r})=>{
 const a0=r.int(2,5),b0=a0+r.int(1,3),u=r.int(3,7),v=r.int(3,7),K=r.int(2,4);
 const F0=x=>u*Math.log1p(x/a0)+v*Math.log1p(x/b0);
 let lo=0,hi=12;for(let j=0;j<55;j++){const z=(lo+hi)/2;if(F0(z)<K)lo=z;else hi=z;}
 const t=(lo+hi)/2;
 return Q(R`The graph $y=@dfrac{${u}}{x+${a0}}+@dfrac{${v}}{x+${b0}}$ is above the $x$-axis on $0@le x@le12$.`,{a0,b0,u,v,K},
 P(R`Write an equation for the bound $t$ at which the area from $0$ to $t$ is $${K}$.`,2,A.self(R`$${u}@ln@left(@dfrac{t+${a0}}{${a0}}@right)+${v}@ln@left(@dfrac{t+${b0}}{${b0}}@right)=${K}$`),"Integrate each reciprocal and subtract its value at zero."),
 P("Solve for $t$ to three significant figures.",2,calc(t),R`The numerical solution is $t@approx${sf(t,3)}$.`),
 P("Explain why there is no other solution in the interval.",1,A.self("The accumulated area is strictly increasing."),"The rate of increase of the area is the positive integrand, so the same area cannot be reached at two different inputs."));
});

reg("isolated-zero-in-increasing-interval","equation","monotonic-set",2,a,["5.2"],"SL5.2.increasing-decreasing-intervals","Decide which stationary input does not interrupt increase",({rng:r})=>{
 const u=r.int(1,7),v=u+r.int(1,7),j=r.int(2,7);
 return Q(R`A differentiable function has derivative $f'(x)=${j}(x-${u})(x-${v})^2$ on the real line.`,{u,v,j},
 P("Find the input where the derivative changes sign.",2,A.int(u),R`The squared factor has the same sign either side of $x=${v}$. The linear factor changes sign at $x=${u}$.`),
 P("State the maximal open interval on which the function is strictly increasing.",2,A.self(R`$(${u},@infty)$`),R`The derivative is positive to the right of $${u}$ except at the isolated point $${v}$. There is no constant or decreasing segment there.`));
});

reg("revolution-truncated-apex-scale","words","volume-ratio",2,b,["5.17"],"AHL5.17.volume-x-axis","Find the portion of a solid produced before a given height",({rng:r})=>{
 const d=r.int(5,10),k=r.int(2,d-1),a0=r.int(2,8);
 return Q(R`Rotate the region below the line $y=${a0}x$ and above the $x$-axis for $0@le x@le ${d}$ about the $x$-axis.`,{d,k,a0},
 P(R`The volume from $0$ to $${k}$ is $K@pi$. Find $K$ exactly.`,2,exactFrac(a0*a0*k**3,3),R`The disk area is $@pi(${a0}x)^2$. Its integral up to $${k}$ gives $${piTex(a0*a0*k**3,3)}$.`),
 P("Find the fraction of total volume generated over that portion.",2,A.frac(k**3,d**3),R`The volume scales with the cube of the endpoint, so the fraction is $${frac(k**3,d**3)}$.`));
});

reg("integrating-power-prerequisite","equation","exponent",0,a,["5.5"],"SL5.5.antidiff-power","Recall the exponent relationship behind antidifferentiation",({rng:r})=>{
 const p=r.int(2,13),name=r.pick(['x','t','u']);
 return Q(R`Differentiating $${name}^{k}$ changes the exponent to $k-1$.`,{p,name},
 P(R`What exponent $k$ produces an exponent of $${p}$ after differentiation?`,1,A.int(p+1),R`Set $k-1=${p}$ to obtain $k=${p+1}$.`));
});

reg("revolve-positive-intersection-synoptic","equation","meeting-and-volume",5,b,["5.17","5.11"],"AHL5.17.volume-x-axis AHL5.17.volume-between-curves SL5.11.area-between-curves","Connect an intersection, a region's area and its volume of revolution",({rng:r})=>{
 const k=r.int(2,6),d=r.int(2,7),c=k*d;
 return Q(R`For $x@ge0$ consider $f(x)=${c}x$ and $g(x)=${d}x^2$. Their graphs enclose a bounded region.`,{k,d,c},
 P("Find the positive $x$-intercept of $f-g$.",2,A.int(k),R`Solve $x(${c}-${d}x)=0$. The positive root is $${k}$, with $f>g$ between the roots.`),
 P("Find the exact area of the bounded region.",2,A.frac(d*k**3,6),R`Integrate $${c}x-${d}x^2$ from $0$ to $${k}$: $${frac(d*k**3,6)}$.`),
 P(R`On rotation about the $x$-axis, the volume is $K@pi$. Find $K$ exactly.`,4,exactFrac(2*d*d*k**5,15),R`Both radii are measured from the axis. The washer area is $@pi(f^2-g^2)$, not $@pi(f-g)^2$. Integrating from $0$ to $${k}$ gives $${piTex(2*d*d*k**5,15)}$.`));
});
})(typeof window!=="undefined"?window:globalThis);
