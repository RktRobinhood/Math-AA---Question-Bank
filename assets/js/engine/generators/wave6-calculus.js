/* Original native calculus progression; no examination material reproduced. */
(function(root){"use strict";
const E=root.QBEngine,{ans:A,fmt:F}=E;
const R=(s,...x)=>String.raw({raw:s},...x).replace(/@/g,"\\");
const Q=(stem,params,...parts)=>({stem,params,parts});
const P=(prompt,marks,answer,...working)=>({prompt,marks,answer,working});
const math=x=>F.m(String(x)),j=A.int,sf=A.sf,ex=A.exact,self=A.self,fr=F.frac;
const plus=(a,b)=>b===0?String(a):String(a)+(b<0?"-":"+")+Math.abs(b);
const dx=v=>v===0?"x":v>0?"(x-"+v+")":"(x+"+Math.abs(v)+")";
const N=(name,title,home,syllabus,skills,L,rep,build)=>E.register({type:"w6-calculus-"+name,title,home,syllabus:syllabus.split(" "),skills:skills.split(" "),levels:[L],representation:rep,format:"value",unknown:"reasoning",calculator:L===4,source:"original-wave-6",build});
const answerChoice=(r,win,opts)=>A.choice(r,opts.find(x=>x.value===win),opts.filter(x=>x.value!==win));

N("tangent-axis-intercept-from-local-reference","Use a local reference displacement to locate a tangent’s axis intercept","aa-sl","5.4","SL5.4.tangent-gradient SL5.4.tangent-meets-axes-or-curve",2,"words",({rng:r})=>{
 const h=r.int(2,8),m=r.int(2,7),z=r.int(2,6),a=r.int(2,7),c=m*z;
 return Q(R`Near $x=${h}$, a sensor profile is $f(x)=${a}${dx(h)}^{2}+${m}${dx(h)}+${c}$. A technician replaces it with its tangent at $x=${h}$, then extends that straight line to the $x$-axis.`,{h,m,z,a},
 P(R`Find the tangent gradient at $x=${h}$.`,1,j(m),R`Differentiating gives $f'(x)=${2*a}${dx(h)}+${m}$. At $x=${h}$ the first term is zero.`),
 P("Find the $x$-coordinate where the extended tangent, not the sensor profile, meets the $x$-axis.",2,j(h-z),R`The tangent has height $${c}$ at $x=${h}$. A drop of $${c}$ requires a leftward move of $${c}@div${m}=${z}$, giving $x=${h-z}$.`));
});

N("stationary-spacing-from-slope","Find the separation of stationary points from a slope measurement","ai-sl","5.6","AI-SL5.6.solve-gradient-zero AI-SL5.6.classify-from-derivative",2,"equation",({rng:r})=>{
 const h=r.int(1,7),d=r.int(1,5),a=r.int(1,4),n=r.int(2,5),k=a*d*d,x=h+n,v=a*n*n-k;
 return Q(R`A differentiable function has $f'(x)=${a}${dx(h)}^{2}-k$. At $x=${x}$ its gradient is $${v}$.`,{h,d,a,n,k,x,v},
 P("Find $k$.",1,j(k),R`Substitution gives $${v}=${a}@times ${n}^{2}-k$, so $k=${k}$.`),
 P("Find the horizontal distance between the two stationary points.",2,j(2*d),R`Setting $f'(x)=0$ gives $${dx(h)}^{2}=${d*d}$. The points lie $${d}$ units on either side of $x=${h}$, hence are $${2*d}$ units apart.`),
 P("Which stationary point has the greater function value? Justify your answer.",1,self(R`The one at $x=${h-d}$, because $f'(x)<0$ between them.`),R`Between the two zeros the squared term is smaller than $${d*d}$. Consequently the function decreases from the left stationary point to the right one.`));
});

N("contract-retarget-demand","Infer a pricing parameter from the revenue-maximising choice","ai-sl","5.7","AI-SL5.7.form-objective AI-SL5.7.parameter-from-optimum",2,"words",({rng:r})=>{
 const m=r.int(4,11),b=r.int(2,8),s=r.int(1,m-1),v=m+s,k=2*m*b;
 return Q(R`A club offers access tokens at one price, $x$ credits per token. Its demand model predicts $k-${b}x$ sales, with $0@le x@le${v}$. The revenue-maximising price is known to be $${m}$ credits, strictly inside the interval.`,{m,b,v},
 P("Write the revenue in terms of $x$ and $k$.",1,self(R`$R(x)=x(k-${b}x)$.`),R`Multiply the price $x$ by the predicted demand $k-${b}x$.`),
 P("Find the value of $k$.",2,j(k),R`At the interior maximum, $R'(x)=k-${2*b}x=0$. Using the observed best price $x=${m}$ gives $k=${k}$. The quadratic opens downward.`));
});

N("product-slope-neutral-factor","Choose a local factor slope that flattens the product","aa-sl","5.6","SL5.6.product-rule SL5.6.rules-with-values",2,"table",({rng:r})=>{
 const x=r.int(1,8),u=r.int(2,7),v=r.int(2,6),w=r.nonzero(-5,5),y=u*w;
 const item=Q(R`A display multiplies two changing factors: $H(t)=f(t)g(t)$. The table describes the factors at $t=${x}$.`,{x,u,v,w,y},
 P(R`Find $g'(${x})$ if the product is to have zero instantaneous rate of change at this input.`,2,j(w),R`The product rule gives $0=f'(${x})g(${x})+f(${x})g'(${x})$. Using the table and rearranging gives $g'(${x})=${w}$.`),
 P(R`Find the instantaneous rate of change of the product if the gradient of $g$ at this point is instead one unit larger.`,1,j(u),R`Only the term $f(${x})g'(${x})$ changes. It increases by $f(${x})@times1=${u}$, from zero.`));
 return {...item,table:{head:["Quantity","Value"],rows:[[math(R`f(${x})`),math(u)],[math(R`g(${x})`),math(v*u)],[math(R`f'(${x})`),math(fr(-w,v))]]}};
});

N("reverse-chain-offset-calibration","Recover the scale and offset of a reverse-chain antiderivative","aa-sl","5.10","SL5.10.linear-composites SL5.10.find-function-from-derivative",2,"equation",({rng:r})=>{
 const h=r.int(2,6),a=r.int(2,4),b=r.int(1,4),k=r.int(2,9),x=h+1,c=r.int(2,9),p=a*(x-h)+b,p0=b;
 const Ftex=R`k[${a}${dx(h)}+${b}]^{3}+C`;
 return Q(R`The derivative of $F$ is $F'(x)=${3*k*a}[${a}${dx(h)}+${b}]^{2}$. An antiderivative is written as $F(x)=${Ftex}$. It is known that $F(${h})=${k*p0**3+c}$.`,{h,a,b,c,k},
 P("Find $k$.",2,j(k),R`The bracket's derivative is $${a}$. The cube differentiates to $3@times${a}$ times the squared bracket. Divide its given coefficient $${3*k*a}$ by $${3*a}$ to get $k=${k}$.`),
 P("Find the integration constant $C$.",1,j(c),R`At $x=${h}$ the inner bracket is $${p0}$. Subtract $${k}@times${p0}^{3}$ from the given $F(${h})$.`));
});

N("stationarity-before-curvature","Separate the condition for stationarity from the sign of curvature","ai-hl","5.10","AI-AHL5.10.find-second-derivative AI-AHL5.10.concavity",2,"equation",({rng:r})=>{
 const p=r.int(1,6),a=r.int(2,5),b=r.nonzero(-5,5),m=r.nonzero(-4,4),c=r.int(2,16),x=p+1;
 const ftex=R`${a}${dx(p)}^{3}+${Math.abs(b)}${dx(p)}^{2}`;const expr=(b>0?ftex:ftex.replace("+","-"))+"+"+c;
 return Q(R`Let $f(x)=${expr}+k${dx(p)}$. The gradient at $x=${x}$ is $${3*a+2*b+m}$, where $k$ is a constant.`,{p,a,b,m,c,x},
 P("Find the value of $k$.",1,j(m),R`$f'(x)=${3*a}${dx(p)}^{2}${b>0?"+":"-"}${Math.abs(2*b)}${dx(p)}+k$. At $x=${x}$ the displacement is one, giving $k=${m}$.`),
 P(R`Find $f''(${p})$.`,1,j(2*b),R`$f''(x)=${6*a}${dx(p)}${b>0?"+":"-"}${Math.abs(2*b)}$. Substitute $x=${p}$.`),
 P(R`Does the second derivative test establish a local extremum of $f$ at $x=${p}$? Give a reason.`,2,self(R`No. $f'(${p})=${m}@ne0$, so the point is not stationary.`),R`Before using the second derivative test for an extremum, check stationarity. At this point the first derivative is $k=${m}$, not zero.`));
});

N("double-zero-is-not-inflexion","Distinguish a double zero of curvature from a genuine change of concavity","ai-hl","5.10","AI-AHL5.10.concavity AI-AHL5.10.points-of-inflexion",2,"equation",({rng:r})=>{
 const a=r.int(1,5),b=a+r.int(2,6),C=r.nonzero(-4,4),up=C>0;
 return Q(R`A twice differentiable function has $f''(x)=${C}${dx(a)}^{2}${dx(b)}$. Its second derivative is zero at $x=${a}$ and $x=${b}$.`,{a,b,C},
 P("Find the $x$-coordinate of the point of inflexion.",2,j(b),R`The squared factor is positive on either side of $${a}$, so there is no sign change there. The unsquared factor changes sign at $${b}$, so this is the point of inflexion.`),
 P(R`State the concavity immediately to the left and right of $x=${a}$.`,1,self("Concave "+(up?"down":"up")+" on both sides."),R`Near $x=${a}$ the factor $${dx(b)}$ stays negative, and the squared factor is positive on both sides. The constant determines whether the product is negative or positive.`));
});

N("rate-band-width","Locate the slowest instant, then measure how long the rate stays near it","ai-hl","5.10","AI-AHL5.10.greatest-rate-of-change AI-AHL5.10.points-of-inflexion",4,"words",({rng:r})=>{
 const a=r.int(47,97),b=r.int(1,2),c=r.int(1,2),H=12;
 const t=Math.sqrt(a/(2*c))-b,v=a/(t+b)+2*c*t;
 const high=Math.ceil((v+.22)*10)/10;
 const B=2*b*c-high,C=a-high*b,disc=B*B-8*c*C,span=Math.sqrt(disc)/(2*c);
 return Q(R`The reading of a stable instrument is $R(t)=${a}@ln(t+${b})+${c===1?"":c}t^{2}$ units at time $t$ minutes, for $0@le t@le${H}$. Its monitoring rule checks the rate of increase.`,{a,b,c,H,high},
 P("Find when the reading is increasing most slowly, to three significant figures.",2,sf(t),R`$R'(t)=@dfrac{${a}}{t+${b}}+${2*c}t$. Its derivative is zero when $t+${b}=@sqrt{@dfrac{${a}}{${2*c}}}$. The second derivative of $R$ goes from negative to positive, so the rate has an interior minimum at $t@approx${F.sf(t)}$.`),
 P("Find the smallest instantaneous rate of increase, to three significant figures.",1,sf(v),R`Substitute the unrounded time into $R'$. The rate is approximately $${F.sf(v)}$ units per minute.`),
 P(R`Find the total time during which the rate is no more than $${F.num(high)}$ units per minute, to three significant figures.`,3,sf(span),R`Graph $R'(t)$ and the constant $${F.num(high)}$. The rate meets the limit at two boundary times and stays below it in between. Subtract the smaller from the larger without rounding them first; the interval lasts about $${F.sf(span)}$ minutes.`));
});

N("order-after-reversed-input","Track monotonic intervals under reversed input and negated output","aa-sl","5.2","SL5.2.increasing-decreasing-intervals SL5.2.sign-at-point",3,"words",({rng:r})=>{
 const a=r.int(2,7),b=r.int(2,6),c=r.int(2,6),d=r.int(1,7),l=a-b,u=a+c,p=r.int(1,8),T=p+a;
 return Q(R`A function $f$ has domain $[${l},${u}]$. It is strictly increasing on $[${l},${a}]$ and strictly decreasing on $[${a},${u}]$. Define $g(x)=${d}-f(${T}-x)$ on its full corresponding domain.`,{a,b,c,d,l,u,T},
 P("Find the left endpoint of the domain of $g$.",1,j(T-u),R`The largest permissible input to $f$ is $${u}$, which corresponds to the smallest input to $g$: $x=${T}-${u}=${T-u}$.`),
 P("Find the right endpoint of the domain of $g$.",1,j(T-l),R`The smallest input to $f$ corresponds to the largest input to $g$: $x=${T}-${l<0?"("+l+")":l}=${T-l}$.`),
 P("Find the $x$-coordinate where the direction of change of $g$ switches.",1,j(T-a),R`The switch is where $${T}-x=${a}$, giving $x=${T-a}$.`),
 P("State on which of the two pieces $g$ is increasing. Explain why.",2,self(R`$g$ increases on $[${T-a},${T-l}]$.`),R`The increasing piece of $f$ lies over inputs from $${l}$ to $${a}$. As $x$ increases across the corresponding interval, the argument of $f$ decreases, then subtracting $f$ reverses the change again. The other piece decreases.`));
});

N("pair-of-gradient-readings","Recover inverse-power model coefficients from two gradient readings","ai-sl","5.3","SL5.3.negative-powers SL5.3.gradient-at-point SL5.3.unknown-coefficients",3,"equation",({rng:r})=>{
 const a=4*r.nonzero(-6,6),b=r.nonzero(-9,9),j0=r.int(2,8),m1=b-a,m2=b-a/4;
 return Q(R`The model is $f(x)=@dfrac{A}{x}+Bx+${j0}$ for $x>0$. Its gradients at $x=1$ and $x=2$ are $${m1}$ and $${m2}$, respectively.`,{a,b,j0,m1,m2},
 P("Find the exact value of $A$.",2,j(a),R`$f'(x)=B-@dfrac{A}{x^{2}}$. The two readings are $B-A$ and $B-@dfrac{A}{4}$. Subtract the former from the latter to get $@dfrac{3A}{4}=${m2-m1}$.`),
 P("Find the exact value of $B$.",2,j(b),R`Use the first slope: $B-A=${m1}$, so $B=${b}$.`),
 P("Find $f(2)$ exactly.",1,j(a/2+2*b+j0),R`Substitute $x=2$ in the original model, not in its derivative: $@dfrac{${a}}{2}+2(${b})+${j0}=${a/2+2*b+j0}$.`));
});
})(typeof globalThis!=="undefined"?globalThis:this);
