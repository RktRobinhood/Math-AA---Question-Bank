/* Original, bounded calculus practice; uses the bank's ordinary answer and table contracts. */
(function(root){
"use strict";
const E=root.QBEngine,{ans,fmt}=E,{m,poly,frac,sf,br}=fmt;
const R=(pieces,...args)=>String.raw({raw:pieces},...args).replace(/@/g,"\\");
const P=(prompt,marks,answer,...working)=>({prompt,marks,answer,working});
const Q=(stem,params,parts,ext={})=>({stem,params,parts,...ext});
const B=x=>x<0?`(x + ${-x})`:x>0?`(x - ${x})`:"x";
const Y=x=>x<0?`(y + ${-x})`:x>0?`(y - ${x})`:"y";
const M=value=>m(String(value));
const O=(rng,right,wrong)=>ans.choice(rng,{text:right[0],value:right[1]},wrong.map(([text,value,why])=>({text,value,why})));
const F=(rng,v,wr)=>O(rng,[v[0],v[1]],wr.map(([a,b])=>[a,b,"Check the condition using the model rather than the name of the rule."]));
function add(id,representation,level,home,code,skills,title,build,extra={}) {
  E.register({type:"t5-scale-"+id,unknown:"result",representation,format:"value",levels:[level],home,calculator:level===4,syllabus:[code],skills:skills.split(" "),title,build,...extra});
}
const A="aa-sl", H="aa-hl", I="ai-sl", J="ai-hl";

add("same-cubic-gradients","equation",2,A,"5.3","SL5.3.unknown-coefficients SL5.3.gradient-at-point","Calibrate a cubic so two slopes agree",({rng})=>{
 const a=2*rng.int(1,4), u=rng.int(1,3), v=u+rng.int(1,3), b=-3*a*(u+v)/2, c=rng.int(2,6), g=3*a*u*u+2*b*u;
 return Q(R`Let $f(x)=${a}x^{3}+kx^{2}+${c}$. The tangents at $x=${u}$ and $x=${v}$ have the same gradient.`,{a,u,v,c},[
  P("Find $k$.",2,ans.int(b),R`The derivative is $f'(x)=${3*a}x^{2}+2kx$.`,R`Equating the two gradients and cancelling the common factor $${v-u}$ gives $2k=-${3*a*(u+v)}$.`),
  P("Find the common gradient.",2,ans.int(g),R`Substitute $x=${u}$ and $k=${b}$ into the derivative. This gives $${g}$.`)
 ]);
});
add("reciprocal-target-slope","words",4,A,"5.3","SL5.3.negative-powers SL5.3.point-with-given-gradient","Locate where a reciprocal model reaches a target gradient",({rng})=>{
 const a=rng.int(16,87), p=rng.int(2,4), h=rng.int(3,12), g=rng.int(3,14), x=(p*a/g)**(1/(p+1)), f=t=>h+a*t**(-p);
 const fprime=R`$f'(x)=-${p*a}x^{-${p+1}}$`;
 return Q(R`A calibration curve is modelled by $f(x)=${h}+${a}x^{-${p}}$ for $x>0$.`,{a,p,h,g},[
  P("Find $f'(x)$.",2,ans.self(fprime),`The power rule gives ${fprime}.`),
  P(R`Find the input giving gradient $-${g}$, to three significant figures.`,2,ans.sf(x,3),R`Rearrange to $x^{${p+1}}=${frac(p*a,g)}$ and choose the positive solution.`,R`$x@approx${sf(x,3)}$.`),
  P("Find the function value there, to three significant figures.",1,ans.sf(f(x),3),R`Substitute the unrounded input into $f$ to get $${sf(f(x),3)}$.`)
 ]);
});
add("steepest-decline","words",4,A,"5.7","SL5.7.find-second-derivative SL5.7.interpret-second-derivative SL5.6.product-rule","Use a second derivative to locate the steepest decline",({rng})=>{
 const a=rng.int(7,26), d=rng.int(2,6), end=3*d, t=2*d, v=-a*Math.exp(-2);
 const fp=R`$S'(t)=${a}@mathrm{e}^{-@frac{t}{${d}}}@left(1-@dfrac{t}{${d}}@right)$`;
 return Q(R`A signal is modelled by $S(t)=${a}t@mathrm{e}^{-@frac{t}{${d}}}$ for $0@le t@le${end}$.`,{a,d,end},[
  P("Find $S'(t)$.",2,ans.self(fp),`The product rule gives ${fp}.`),
  P("Find when the instantaneous rate of change is least.",2,ans.int(t),R`$S''(t)=${frac(a,d)}@mathrm{e}^{-@frac{t}{${d}}}@left(@dfrac{t}{${d}}-2@right)$ changes from negative to positive at $t=${t}$.`,R`The gradient is least there.`),
  P("Find the least rate of change, to three significant figures.",2,ans.sf(v,3),R`Evaluate $S'(${t})=-${a}@mathrm{e}^{-2}@approx${sf(v,3)}$.`)
 ]);
},{syllabus:["5.7","5.6"]});
add("velocity-position-backwards","graph",3,A,"5.9","SL5.9.motion-graphs SL5.9.initial-displacement SL5.9.displacement-from-velocity","Use signed areas to recover an initial position",({rng})=>{
 const a=rng.int(2,4), b=rng.int(2,4), p=2*rng.int(1,3), n=2*rng.int(1,3), end=2*a+2*b, finish=rng.int(12,39), dp=a*p-b*n;
 const graph={x:[0,end+2],y:[-n-2,p+2],xStep:1,yStep:2,functions:[{fn:{type:"pwl",points:[[0,0],[a,p],[2*a,0],[2*a+b,-n],[end,0]]}}],alt:"Velocity against time, with one positive triangular region and one negative triangular region."};
 return Q(R`The graph gives velocity in metres per second against time in seconds. At $t=${end}$ the cart's position is $${finish}@text{ m}$.`,{a,b,p,n,end,finish},[
  P("Find the distance travelled while the velocity is positive.",2,ans.int(a*p),R`The first triangle's base is $${2*a}$ and its height is $${p}$. Its area is $${a*p}$.`),
  P(R`Find the displacement over $0@le t@le${end}$.`,2,ans.int(dp),R`The second triangle contributes $-${b*n}$. The net signed area is $${dp}$.`),
  P("Find the initial position.",1,ans.int(finish-dp),R`Subtract the displacement from the final position to obtain $${finish-dp}@text{ m}$.`)
 ],{graph});
});
add("ai-stationary-bracket","table",1,I,"5.6","AI-SL5.6.solve-gradient-zero","Find the interval where a stationary point must occur",({rng})=>{
 const x=rng.int(-4,4), h=rng.int(1,3), r=rng.int(0,2), top=Array.from({length:4},(_,i)=>x+i*h), s=rng.sign();
 const v=top.map((_,i)=>(i<=r?s:-s)*rng.int(1,8)); const L=i=>R`$${top[i]}<x<${top[i+1]}$`;
 return Q(R`Starting at $x=${x}$, values of a continuous derivative are sampled at regular intervals.`,{top,v},[
  P("Which interval must contain a stationary point?",2,O(rng,[L(r),r],[0,1,2].filter(k=>k!==r).map(k=>[L(k),k,"The gradient has the same sign at both ends."])),
   "A continuous derivative with opposite signs at the ends must be zero somewhere between them.")
 ],{table:{head:[M("x"),...top.map(M)],rows:[[M("f'(x)"),...v.map(M)]]}});
},{format:"mcq"});
add("ai-shift-stationary","equation",2,I,"5.6","AI-SL5.6.turning-point AI-SL5.6.classify-from-derivative","Track a turning point through a vertical adjustment",({rng})=>{
 const a=rng.int(1,6)*rng.sign(), c=rng.int(-6,6), h=rng.nonzero(-5,5), k=rng.int(1,7);
 return Q(R`Let $f(x)=${poly([a,-2*a*h,a*h*h+c])}$ and $g(x)=f(x)+${k}$.`,{a,c,h,k},[
  P("Find the $x$-coordinate of the stationary point of $g$.",2,ans.int(h),R`$g'(x)=f'(x)=${poly([2*a,-2*a*h])}$, since the added constant differentiates to zero.`,R`Solve $g'(x)=0$ to obtain $x=${h}$.`),
  P("Find the value of $g$ at its stationary point.",2,ans.int(c+k),R`Substitution gives $f(${h})=${c}$ and $g(${h})=${c+k}$.`)
 ]);
});
add("ai-zero-height-gradient","equation",1,I,"5.6","AI-SL5.6.solve-gradient-zero","Distinguish a curve's zero from a zero gradient",({rng})=>{
 const p=rng.nonzero(-7,7), a=rng.int(1,5), c=rng.int(1,3);
 return Q(R`The cubic $f(x)=${c===1?B(p):c+B(p)}^{3}+${a===1?B(p):a+B(p)}$ crosses the horizontal axis at $x=${p}$.`,{p,a,c},[
  P(R`Find $f'(${p})$.`,2,ans.int(a),R`The derivative of the cubic term vanishes at $x=${p}$. The linear term contributes gradient $${a}$.`)
 ]);
});
add("ai-whole-item-profit","words",4,I,"5.7","AI-SL5.7.optimal-input AI-SL5.7.optimum-value AI-SL5.7.test-optimality","Convert a continuous profit optimum to a whole-number decision",({rng})=>{
 const a=rng.int(3,8), j=rng.int(8,19), r=rng.pick([1,2*a-1]), b=2*a*j+r, end=j+5;
 const u=b/(2*a), k=r===1?j:j+1, f=x=>b*x-a*x*x;
 return Q(R`A workshop's profit is $G(q)=${b}q-${a}q^{2}$ euros, with $0@le q@le${end}$. Only whole items can be made.`,{a,b,j,end},[
  P("For continuous output, find the maximising output to three significant figures.",2,ans.sf(u,3),R`$G'(q)=${b}-${2*a}q$ changes from positive to negative at $q=${frac(b,2*a)}@approx${sf(u,3)}$.`),
  P("Find the maximising whole-number output.",2,ans.int(k),R`Compare the adjacent integers: $G(${j})=${f(j)}$ and $G(${j+1})=${f(j+1)}$. Choose $q=${k}$.`),
  P("Give that greatest whole-output profit.",1,ans.int(f(k)),R`This gives $${f(k)}$ euros.`)
 ]);
});
add("ai-optimum-fixed-fee","words",2,I,"5.7","AI-SL5.7.parameter-from-optimum AI-SL5.7.optimum-value","Tell what a flat fee changes about a profit maximum",({rng})=>{
 const a=rng.int(2,9), r=rng.int(6,16), t=rng.int(12,24), max=a*r*r;
 return Q(R`A stall's profit is $G(q)=${2*a*r}q-${a}q^{2}$ euros. Its maximum occurs at $q=${r}$. A flat fee of $${t}$ euros is added regardless of output.`,{a,r,t},[
  P("Find the output that now maximises profit.",1,ans.int(r),"A flat fee subtracts the same amount from every possible profit, so it does not change the preferred output."),
  P("Find the new maximum profit.",2,ans.int(max-t),R`Evaluate $G(${r})=${max}$, then subtract $${t}$ to get $${max-t}$ euros.`)
 ]);
});
add("ai-objective-difference","words",4,I,"5.7","AI-SL5.7.form-objective AI-SL5.7.optimal-input AI-SL5.7.optimum-value","Compose an objective from a pair of competing models",({rng})=>{
 const a=rng.int(3,9), b=rng.int(73,95), c=rng.int(23,31), d=rng.int(6,11), x=(b-c)/(2*a), f=t=>(b-c)*t-a*t*t-d;
 const g=R`$G(q)=${poly([-a,b-c,-d],"q")}$`;
 return Q(R`An organiser models receipts by $R(q)=${b}q$ and total cost by $C(q)=${a}q^{2}+${c}q+${d}$, in euros. Treat $q$ as continuous for $0@le q@le 20$.`,{a,b,c,d},[
  P("Write a model for receipts minus cost.",2,ans.self(g),`Subtract the whole cost expression. This gives ${g}.`),
  P("Find the output for greatest surplus, to three significant figures.",2,ans.sf(x,3),R`Solve $G'(q)=${b-c}-${2*a}q=0$. The quadratic opens downwards, so the maximum occurs at $q@approx${sf(x,3)}$.`),
  P("Find the greatest surplus, to three significant figures.",1,ans.sf(f(x),3),R`Evaluate $G$ at the unrounded optimum to obtain $${sf(f(x),3)}$ euros.`)
 ]);
});
add("ai-trap-recover-endpoint","table",2,I,"5.8","AI-SL5.8.from-table AI-SL5.8.interval-width","Recover a missing endpoint from a trapezoidal estimate",({rng})=>{
 const h=rng.int(2,5), a=rng.int(3,7), b=rng.int(7,15), c=rng.int(17,25), S=h*(a+2*b+c)/2;
 return Q(R`The two-strip trapezoidal estimate from this table is $${S}$.`,{h,a,b,c,S},[
  P("State the interval width.",1,ans.int(h),R`The successive times differ by $${h}$.`),
  P("Find the missing reading.",2,ans.int(c),R`The estimate is $${h===2?"":frac(h,2)}@left(${a}+2(${b})+z@right)$.`,R`Set this equal to $${S}$ and solve to get $z=${c}$.`)
 ],{table:{head:[M("t"),M(0),M(h),M(2*h)],rows:[[M("f(t)"),M(a),M(b),M("z")]]}});
});
add("ai-trap-refine-midpoint","words",4,I,"5.8","AI-SL5.8.improve-estimate AI-SL5.8.accumulated-quantity","Improve a volume estimate with a halfway measurement",({rng})=>{
 const a=rng.int(17,59)/10, b=rng.int(22,50)/10, c=rng.int(89,135)/10, h=rng.int(13,24)/10, t=2*h, one=h*(a+c), two=h/2*(a+2*b+c), d=Math.abs(one-two);
 return Q(R`A pump's flow rate in litres per minute is $${a}$ at time $0$ and $${c}$ at time $${t}$ minutes. A halfway measurement gives $${b}$ litres per minute.`,{a,b,c,h},[
  P("Estimate the volume using only the first and last readings, to three significant figures.",2,ans.sf(one,3),R`One trapezoid of width $${t}$ gives $${sf(one,3)}@text{ L}$.`),
  P("Estimate the volume using all three readings, to three significant figures.",2,ans.sf(two,3),R`Use two trapezoids of width $${h}$. Count the middle reading twice to obtain $${sf(two,3)}@text{ L}$.`),
  P("By how many litres do the estimates differ? Give three significant figures.",1,ans.sf(d,3),R`Subtract the unrounded estimates and take the magnitude: $${sf(d,3)}@text{ L}$.`)
 ]);
});

add("aa-hl-corner-audit","equation",3,H,"5.12","AHL5.12.continuity AHL5.12.differentiability AHL5.12.limit-reasoning","Audit a continuous join where the one-sided gradients disagree",({rng})=>{
 const a=rng.int(2,7), b=rng.int(1,6), h=rng.nonzero(-4,4), c=rng.int(-4,8);
 // Write the piecewise text explicitly in terms of the centre to make gradients easy to inspect.
 const C=c>0?`+${c}`:c<0?`-${-c}`:"", Afx=a+B(h)+C, Bfx=(b===1?B(h):b+B(h))+"^{2}"+C;
 const Ftx=R`$f(x)=@begin{cases}${Afx},&x@le${h}@@${Bfx},&x>${h}@end{cases}$`;
 return Q(R`Consider ${Ftx}.`,{a,b,h,c},[
  P(R`Find the two-sided limit as $x@to${h}$.`,2,ans.int(c),R`The shifted inputs tend to zero, so both pieces tend to $${c}$.`),
  P("Find the left-hand derivative at the join.",1,ans.int(a),R`The gradient of the left-hand straight line is $${a}$.`),
  P("Find the right-hand derivative at the join.",1,ans.int(0),R`The derivative of the right-hand quadratic approaches zero.`),
  P("Which description holds at the join?",1,F(rng,["Continuous but not differentiable","corner"],[["Differentiable but not continuous","impossible"],["Both continuous and differentiable","smooth"]]),"The pieces agree in value at the join, but their one-sided gradients are not equal.")
 ]);
},{format:"mcq"});
add("aa-hl-lhopital-validity","equation",1,H,"5.13","AHL5.13.indeterminate-form-condition","Choose whether l'Hôpital's rule can start a calculation",({rng})=>{
 const a=rng.int(2,9), b=rng.pick([0,0,2,3,5,7]), d=b===0?"x":`x+${b}`;
 const yes="Yes, the direct substitution has form zero over zero.";
 const no="No, direct substitution already gives a finite value.";
 return Q(R`Consider $@displaystyle@lim_{x@to0}@dfrac{@mathrm{e}^{${a}x}-1}{${d}}$.`,{a,b},[
  P("Is l'Hôpital's rule justified on the original quotient?",2,F(rng,b===0?[yes,"yes"]:[no,"no"],[[b===0?no:yes,b===0?"no":"yes"],["No, exponential functions cannot be differentiated.","bad"]]),
  b===0?"Both numerator and denominator tend to zero, and the derivative of the denominator is non-zero nearby.":"The numerator tends to zero but the denominator does not. Direct substitution already gives zero.")
 ]);
},{format:"mcq"});
add("aa-hl-implicit-horizontal","equation",3,H,"5.14","AHL5.14.implicit-derivative AHL5.14.implicit-tangent-normal","Locate an implicit curve's upper horizontal tangent",({rng})=>{
 const k=rng.int(1,6), h=rng.nonzero(-5,5), j=rng.nonzero(-5,5);
 const u=h>0?`x-${h}`:`x+${-h}`, v=j>0?`y-${j}`:`y+${-j}`;
 const deriv=R`$@dfrac{@mathrm{d}y}{@mathrm{d}x}=-@dfrac{2u+v}{u+2v}$`;
 return Q(R`Let $u=${u}$ and $v=${v}$. A closed curve is defined by $u^{2}+uv+v^{2}=${3*k*k}$. Consider the horizontal tangent with the greater $y$-coordinate.`,{k,h,j},[
  P("Find the derivative of $y$ with respect to $x$, in terms of $u$ and $v$.",2,ans.self(deriv),R`Differentiate implicitly, using $@dfrac{@mathrm{d}u}{@mathrm{d}x}=1$ and $@dfrac{@mathrm{d}v}{@mathrm{d}x}=@dfrac{@mathrm{d}y}{@mathrm{d}x}$.`,R`The result before rearranging is $2u+v+(u+2v)@dfrac{@mathrm{d}y}{@mathrm{d}x}=0$, giving ${deriv}.`),
  P("Find the point's $x$-coordinate.",2,ans.int(h-k),R`With zero gradient, $2u+v=0$. Substituting $v=-2u$ gives $3u^{2}=${3*k*k}$.`,R`The greater $y$ corresponds to the greater $v$. Choose $u=-${k}$, so $x=${h-k}$.`),
  P("Find the point's $y$-coordinate.",1,ans.int(j+2*k),R`Here $v=${2*k}$, so $y=${j+2*k}$. Also, $u+2v=${3*k}@ne0$, so the derivative is defined.`)
 ]);
});
add("aa-hl-parts-frequency","equation",4,H,"5.16","AHL5.16.by-parts","Compare two oscillatory integrals using integration by parts",({rng})=>{
 const n=rng.int(2,5), h=rng.int(7,13)/10, a=rng.int(2,5), evalI=b=>a*(Math.sin(b*h)/b**2-h*Math.cos(b*h)/b), l=evalI(n), u=evalI(n+1);
 return Q(R`For a positive integer $k$, define $I(k)=@displaystyle@int_{0}^{${h}} ${a}x@sin(kx)@,@mathrm{d}x$, with angles in radians.`,{n,h,a},[
  P(R`Use integration by parts to find an antiderivative of $${a}x@sin(kx)$.`,2,ans.self(R`$-@dfrac{${a}x@cos(kx)}{k}+@dfrac{${a}@sin(kx)}{k^{2}}+C$`),R`Take $u=${a}x$ and $@mathrm{d}v=@sin(kx)@,@mathrm{d}x$. The remaining integral after applying parts is a multiple of cosine.`),
  P(R`Find $I(${n})$ to three significant figures.`,2,ans.sf(l,3),R`Both terms vanish at $x=0$. Evaluate the upper endpoint in radian mode: $${sf(l,3)}$.`),
  P(R`Find $I(${n+1})-I(${n})$ to three significant figures.`,2,ans.sf(u-l,3),R`Use the same antiderivative at the new frequency, then subtract the unrounded integrals to get $${sf(u-l,3)}$.`)
 ]);
});
add("aa-hl-mac-inverse-coefficient","equation",3,H,"5.19","AHL5.19.multiply-series AHL5.19.derive-from-derivatives","Recover a missing multiplier from a Maclaurin coefficient",({rng})=>{
 const n=2*rng.int(1,3), p=rng.int(1,5), c=n*n/2+p*n, d=n**3/6+p*n*n/2;
 return Q(R`Let $f(x)=(1+px)@mathrm{e}^{${n}x}$. The coefficient of $x^{2}$ in its Maclaurin series is $${c}$.`,{n,p,c},[
  P("Find the coefficient of $x$ in the exponential factor.",1,ans.int(n),R`Use $@mathrm{e}^{${n}x}=1+${n}x+${n*n/2}x^{2}+@cdots$.`),
  P("Find $p$.",2,ans.int(p),R`The quadratic coefficient is $${n*n/2}+${n}p=${c}$, hence $p=${p}$.`),
  P("Find the coefficient of $x^{3}$ in $f(x)$.",2,ans.frac(Math.round(6*d),6),R`Add the exponential's cubic coefficient and $p$ times its quadratic coefficient. The result is $${frac(Math.round(6*d),6)}$.`)
 ]);
});
add("aa-hl-diff-eq-constant-solution","equation",1,H,"5.18","AHL5.18.separable AHL5.18.interpret-solution","Identify a solution lost by dividing through",({rng})=>{
 const n=rng.int(2,8), sign=rng.sign(), k=n*sign;
 const f=Y(k);
 return Q(R`Consider the differential equation $@dfrac{@mathrm{d}y}{@mathrm{d}x}=${f}^{2}$. A student divides by $${f}^{2}$ before integrating.`,{k},[
  P("Determine the constant value of $y$ that division excludes.",2,ans.int(k),R`When $y=${k}$, both sides are zero. Dividing by zero excludes this valid constant solution.`)
 ]);
});
add("ai-hl-nullcline-at-input","equation",2,J,"5.15","AI-AHL5.15.gradient-at-point AI-AHL5.15.zero-gradient-curve","Use a zero-slope line to locate a horizontal field segment",({rng})=>{
 const a=rng.int(2,5), b=rng.int(2,4), d=rng.nonzero(-4,4), k=rng.int(-5,5), x=d+b, v=k-a;
 return Q(R`A slope field is generated by $@dfrac{@mathrm{d}y}{@mathrm{d}x}=${a}${B(d)}+${b}${Y(k)}$.`,{a,b,d,k,x},[
  P(R`At $x=${x}$, find the value of $y$ where the field segment is horizontal.`,2,ans.int(v),R`At this $x$, the numerator is zero when $${a*b}+${b}${Y(k)}=0$. Thus $y=${v}$.`),
  P(R`Find the slope at the same $x$ one unit above this horizontal segment.`,1,ans.int(b),R`An increase of one in $y$ adds $${b}$ to the slope.`)
 ]);
});
add("ai-hl-euler-recover-step","table",2,J,"5.16","AI-AHL5.16.single-equation AI-AHL5.16.use-output","Recover an Euler step size from the first row change",({rng})=>{
 const a=2*rng.int(2,6), x=rng.int(1,4), y=rng.int(2,6), d=rng.pick([2,4]), y1=y+(a+x)/d, x1=x+1/d, z=y1+(a+x1)/d;
 return Q(R`A student uses Euler's method for $@dfrac{@mathrm{d}y}{@mathrm{d}x}=x+${a}$ with a constant step size.`,{a,x,y,d,y1},[
  P("Find the step size.",2,ans.frac(1,d),R`Divide the first change in $y$, $${y1-y}$, by the starting gradient $${a+x}$. This gives $${frac(1,d)}$.`),
  P("Find the next estimate of $y$.",2,ans.frac(Math.round(z*d*d),d*d),R`Update the gradient using $x=${x1}$. Add $${frac(1,d)}$ times this gradient to $${y1}$, obtaining $${z}$.`)
 ],{table:{head:["Step",M("x"),M("y")],rows:[[M(0),M(x),M(y)],[M(1),"Unknown",M(y1)]]}});
});
add("ai-hl-shifted-equilibrium","equation",2,J,"5.17","AI-AHL5.17.equilibrium-points AI-AHL5.17.classify-equilibrium","Locate and classify a non-origin equilibrium",({rng})=>{
 const a=rng.int(1,5), b=rng.int(1,5), u=rng.nonzero(-6,6), v=rng.nonzero(-6,6), s=rng.sign(), t=rng.sign();
 const meaning=s>0?(t>0?"source":"saddle"):(t>0?"saddle":"sink");
 const term=(f,n)=>n===1?f:n===-1?`-${f}`:`${n}${f}`;
 return Q(R`A phase portrait comes from $@dfrac{@mathrm{d}x}{@mathrm{d}t}=${term(B(u),a*s)}$ and $@dfrac{@mathrm{d}y}{@mathrm{d}t}=${term(Y(v),b*t)}$.`,{a,b,u,v,s,t},[
  P("Find the equilibrium's $x$-coordinate.",1,ans.int(u),R`The first rate is zero when $x=${u}$.`),
  P("Find the equilibrium's $y$-coordinate.",1,ans.int(v),R`The second rate is zero when $y=${v}$.`),
  P("Classify the equilibrium.",2,F(rng,[meaning[0].toUpperCase()+meaning.slice(1),meaning],["source","saddle","sink"].filter(k=>k!==meaning).map(k=>[k[0].toUpperCase()+k.slice(1),k])),`The two coordinates vary independently. The signs of the two rate coefficients identify a ${meaning}.`)
 ]);
},{format:"mcq"});
add("ai-hl-euler-recover-velocity","table",2,J,"5.18","AI-AHL5.18.euler-system AI-AHL5.18.interpret-velocity","Recover the initial velocity from an Euler position row",({rng})=>{
 const x=rng.int(1,6), v=2*rng.int(2,6), k=rng.int(2,5), r=rng.pick([2,4]), h=1/r, x1=x+h*v, v1=v-h*k*x;
 return Q(R`A position obeys $x''=-${k}x$. Use Euler's method with step size $${h}$, treating velocity as a separate variable.`,{x,v,k,r,x1},[
  P("Recover the initial velocity.",2,ans.int(v),R`The first displacement is $${x1-x}$. Dividing by the step size gives velocity $${v}$.`),
  P("Find the velocity estimate after one step.",2,ans.frac(Math.round(r*v1),r),R`The initial acceleration is $-${k*x}$. Multiplying by the step size and adding to the initial velocity gives $${v1}$.`)
 ],{table:{head:[M("t"),M("x")],rows:[[M(0),M(x)],[M(h),M(x1)]]}});
});
add("ai-hl-euler-acceleration-zero","equation",1,J,"5.18","AI-AHL5.18.convert-to-system AI-AHL5.18.interpret-velocity","Find where damping exactly offsets constant acceleration",({rng})=>{
 const a=rng.int(2,7), v=rng.int(2,9);
 return Q(R`A motion model has $x''=${a*v}-${a}x'$. Let $v=x'$ denote velocity.`,{a,v},[
  P("Find the velocity at which acceleration is zero.",2,ans.int(v),R`Set $${a*v}-${a}v=0$ and solve to obtain $v=${v}$.`)
 ]);
});
add("ai-hl-verify-reciprocal-ode","equation",2,J,"5.14","AI-AHL5.14.verify-solution AI-AHL5.14.particular-solution","Verify a reciprocal solution against a differential equation and an initial condition",({rng})=>{
 const p=rng.int(2,6), k=rng.int(2,7), a=rng.int(2,5);
 return Q(R`A proposed solution to $@dfrac{@mathrm{d}y}{@mathrm{d}x}=-cy^{2}$ is $y=@dfrac{${p}}{${k}+${a}x}$ for $x@ge0$.`,{p,k,a},[
  P("Find $c$ so the proposed solution satisfies the equation.",2,ans.frac(a,p),R`Differentiation gives $-@dfrac{${p*a}}{(${k}+${a}x)^{2}}$. Divide its magnitude by $y^{2}$ to obtain $c=${frac(a,p)}$.`),
  P("Find the initial value $y(0)$.",1,ans.frac(p,k),R`Substitute $x=0$ into the proposed solution. This gives $y(0)=${frac(p,k)}$.`)
 ]);
});

add("slope-at-origin-select-term","equation",1,A,"5.3","SL5.3.gradient-at-point SL5.3.power-rule","Identify which polynomial term determines the slope at the origin",({rng})=>{
 const a=rng.int(2,6), b=rng.int(2,6), c=rng.nonzero(-8,8), d=rng.int(-8,8), n=rng.int(4,6);
 const p=R`${a}x^{${n}}+${b}x^{2}${c>0?"+":"-"}${Math.abs(c)===1?"":Math.abs(c)}x${d===0?"":d>0?"+"+d:d}`;
 return Q(R`Let $f(x)=${p}$.`,{a,b,c,d,n},[
  P("Find the gradient at $x=0$.",2,ans.int(c),R`After differentiating, the higher-power terms are still multiples of $x$. At $x=0$ only the derivative of the linear term remains, giving $${c}$.`)
 ]);
});
add("aa-hl-mac-recover-derivatives","equation",2,H,"5.19","AHL5.19.derive-from-derivatives AHL5.19.differentiate-integrate-series","Recover derivatives from a displayed Maclaurin polynomial",({rng})=>{
 const a=rng.int(2,8), b=rng.nonzero(-6,6), c=rng.nonzero(-5,5), d=rng.nonzero(-8,8);
 return Q(R`A function has Maclaurin series $f(x)=${poly([d,c,b,a])}+@cdots$, where the omitted terms have degree at least four.`,{a,b,c,d},[
  P("Find $f''(0)$.",2,ans.int(2*c),R`The coefficient of $x^{2}$ is $@dfrac{f''(0)}{2!}=${c}$, so $f''(0)=${2*c}$.`),
  P("Find $f'''(0)$.",2,ans.int(6*d),R`The coefficient of $x^{3}$ is $@dfrac{f'''(0)}{3!}=${d}$, so $f'''(0)=${6*d}$.`)
 ]);
});
add("ai-hl-euler-initial-row-audit","equation",3,J,"5.18","AI-AHL5.18.convert-to-system AI-AHL5.18.euler-system AI-AHL5.18.interpret-velocity","Detect a mixed-row update in a coupled Euler step",({rng})=>{
 const x=rng.int(2,7), v=2*rng.int(1,3), a=rng.int(2,5), d=rng.int(1,3), r=rng.pick([2,4]), h=1/r, X=x+h*v, U=v-h*(a*x+d*v);
 const wrong=v-h*(a*X+d*v), df=U-wrong;
 return Q(R`A model has $x''=-${a}x-${d===1?"":d}x'$ with $x(0)=${x}$ and $x'(0)=${v}$. Use explicit Euler with step size $${h}$.`,{x,v,a,d,r},[
  P("Find the first position estimate.",2,ans.frac(Math.round(X*r),r),R`Add the step size times the initial velocity. This gives $${X}$.`),
  P("Find the first velocity estimate.",2,ans.frac(Math.round(U*r),r),R`Use the initial position and velocity in the acceleration. The first velocity estimate is $${U}$.`),
  P(R`A student uses the new position to estimate velocity $${wrong}$. By how much does this underestimate your estimate?`,1,ans.frac(Math.round(df*r*r),r*r),R`Euler uses both rates from the old row. The amount underestimated is $${df}$.`)
 ]);
});
add("ai-hl-diff-eq-target-time","words",4,J,"5.14","AI-AHL5.14.separate-variables AI-AHL5.14.particular-solution AI-AHL5.14.interpret-model","Recover a decay parameter and predict a later threshold",({rng})=>{
 const s=rng.int(27,55), m=s-rng.int(7,12), n=m-rng.int(4,7), t=rng.int(3,9), k=(1/m-1/s)/t, tt=(1/n-1/s)/k;
 return Q(R`A process reduces a measured concentration $y$ according to $@dfrac{@mathrm{d}y}{@mathrm{d}t}=-ky^{2}$, where $k>0$. At $t=0$, $y=${s}$; at $t=${t}$, $y=${m}$.`,{s,m,n,t},[
  P(R`Write the relationship between $@dfrac{1}{y}$ and $t$, in terms of $k$.`,2,ans.self(R`$@dfrac{1}{y}=kt+${frac(1,s)}$`),R`Separate variables and integrate $y^{-2}$. The initial value fixes the constant, giving $@dfrac{1}{y}=kt+${frac(1,s)}$.`),
  P("Find $k$ to three significant figures.",2,ans.sf(k,3),R`Substitute the measured pair and solve: $k@approx${sf(k,3)}$.`),
  P(R`Find the time when $y=${n}$, to three significant figures.`,2,ans.sf(tt,3),R`Set the reciprocal concentration to $${frac(1,n)}$ and solve with the unrounded parameter. This gives $t@approx${sf(tt,3)}$.`)
 ]);
});
})(typeof window==="undefined"?globalThis:window);
