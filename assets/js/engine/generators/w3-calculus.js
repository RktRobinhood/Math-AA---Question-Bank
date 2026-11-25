/* Original Wave 3 Practice calculus. */
(function(root){
"use strict";
const E=root.QBEngine,{ans:A,fmt:F}=E;
const R=(ss,...xs)=>String.raw({raw:ss},...xs).replace(/@/g,"\\");
const p=(prompt,marks,answer,...working)=>({prompt,marks,answer,working});
const q=(stem,params,...parts)=>({stem,params,parts});
const HI="ai-hl", HA="aa-hl", SA="aa-sl", SI="ai-sl";
const n=F.num, frac=F.frac, tex=x=>F.m(String(x)), s=x=>F.sf(x,3), dec=x=>A.sf(x,3), show=x=>A.self(x);
const tidy=x=>x.replace(/\d{5,}/g,d=>n(Number(d)));
const exact=(a,b)=>A.frac(a,b,{display:tex(tidy(frac(a,b)))});
const bisect=(f,a,b)=>{for(let j=0;j<48;j++){const x=(a+b)/2; if(f(x)<0)a=x;else b=x;} return (a+b)/2;};
const add=(id,u,rep,l,home,code,skills,title,build,notFor)=>E.register({
 type:"w3-calculus-"+id,unknown:u,representation:rep,format:"value",levels:[l],home,
 syllabus:[code],skills:skills.split(" "),title,calculator:l===4,source:"original-wave-3",build,...(notFor?{notFor}:{}),
});

add("minimum-acceleration-from-jerk","acceleration-time-and-value","words",4,HA,"5.12","AHL5.12.higher-derivatives","Locate the least acceleration using the third derivative",({rng:r})=>{
 const a=r.int(2,9),b=r.int(2,9),c=r.int(10,50);
 const jerk=t=>210*a*t**4+120*b*t**3-6*c;
 const acceleration=t=>42*a*t**5+30*b*t**4-6*c*t;
 const t=bisect(jerk,0,2),acc=acceleration(t);
 return q(R`A cart moves along a straight rail. Its position relative to a marker is $s(t)=${a}t^7+${b}t^6-${c}t^3$ metres, for $0@le t@le2$ seconds.`, {a,b,c},
  p("Find an expression for the rate of change of the cart’s acceleration.",2,show(R`$s'''(t)=${210*a}t^4+${120*b}t^3-${6*c}$`),
   R`Acceleration is $s''(t)=${42*a}t^5+${30*b}t^4-${6*c}t$. Differentiate once more to obtain $s'''(t)$.`),
  p("Use technology to find the time at which the cart’s acceleration is least. Give three significant figures.",2,dec(t),
   R`The acceleration decreases when $s'''(t)<0$ and increases when $s'''(t)>0$. The third derivative increases from a negative value and has one zero on $[0,2]$, at $t@approx${s(t)}$ seconds.`),
  p("Find this minimum acceleration in metres per second squared, to three significant figures.",1,dec(acc),
   R`Substitute the unrounded time into $s''(t)$, not $s'''(t)$. This gives $s''(t)@approx${s(acc)}$.`));
});

add("limit-referenced-calibration","positive-threshold","words",4,HA,"5.13","AHL5.13.indeterminate-form-condition AHL5.13.lhopital","Prove a baseline limit and find a numerical tolerance crossing",({rng:r})=>{
 const k=r.pick([2,3,4,6,7,8,9,10,11,12])/5,P=r.int(4,19),target=1+P/100,t=bisect(x=>Math.expm1(k*x)/(k*x)-target,0,1);
 return q(R`For a positive pulse duration $t$ in seconds, a sensor's response ratio is $R(t)=@dfrac{@mathrm{e}^{${n(k)}t}-1}{${n(k)}t}$. The limiting response as $t@to0^+$ is used as the baseline.`, {k,P},
  p("Use l’Hôpital’s rule to justify the exact baseline.",2,show("The baseline is $1$."),R`Both numerator and denominator tend to zero. The ratio of their derivatives is $@mathrm{e}^{${n(k)}t}$, which tends to $1$ as $t@to0^+$.`),
  p(R`For $0<t@le1$, the response ratio increases strictly. Use technology to find the duration at which it is $${P}@%$ above baseline. Give your answer in seconds to three significant figures.`,3,dec(t),
   R`Solve $R(t)=${n(target)}$ on the positive domain; $t=0$ is not part of this equation. The crossing is $t@approx ${s(t)}$ seconds.`));
});

add("equal-slopes-cubic","inflection-and-coefficients","equation",3,HI,"5.10","AI-AHL5.10.find-second-derivative AI-AHL5.10.points-of-inflexion","Locate a cubic inflection from two equal tangent slopes",({rng:r})=>{
 const m=r.int(2,6),d=r.int(1,5),u=d+r.int(1,6),S=r.int(8,95)*r.sign(),l=u-d,h=u+d,j=-3*m*u,c=S+3*m*l*h;
 return q(R`A cubic has the form $f(x)=${m}x^3+qx^2+cx$. Its tangents at $x=${l}$ and $x=${h}$ have the same gradient, $${S}$.`, {m,l,h,S},
  p("Find the $x$-coordinate of the point of inflection.",2,A.int(u),R`The graph of $f'$ is a quadratic; its axis lies halfway between the two equal values, at $x=${u}$. The derivative $f''$ changes sign there.`),
  p("Find $q$.",2,A.int(j),R`Use $f''(x)=${6*m}x+2q$ and $f''(${u})=0$. This gives $q=${j}$.`),
  p("Find $c$.",1,A.int(c),R`Substitute $x=${l}$ into $f'(x)=${3*m}x^2+2qx+c$ and set it equal to $${S}$. This gives $c=${c}$.`));
});

add("substitution-reversed-middle","signed-composite-integral","equation",3,HI,"5.11","AI-AHL5.11.inspection-substitution AI-AHL5.11.exact-definite-integral","Follow a substitution whose inner function reverses direction",({rng:r})=>{
 const a=r.int(4,9),c=r.int(2,9),g=r.int(2,5),h=r.int(1,g-1),d=r.int(2,7),l=a-g,u=a+h,U=g*g+c,V=h*h+c,N=d*(V**3-U**3);
 return q(R`Let $I=@displaystyle@int_{${l}}^{${u}} ${d}(x-${a})@bigl((x-${a})^2+${c}@bigr)^2@,@mathrm{d}x$. Use $u=(x-${a})^2+${c}$.`, {a,c,g,h,d},
  p("State the $u$-bounds in order, starting with the lower $x$-bound.",2,show(R`$${U}$ first, then $${V}$`),R`At $x=${l}$, $u=${U}$; at $x=${u}$, $u=${V}$. Keep this order even though $${U}>${V}$.`),
  p("Find $I$ exactly.",2,exact(N,6),R`Since $@mathrm{d}u=2(x-${a})@,@mathrm{d}x$, evaluate $@dfrac{${d}}{6}[u^3]_{${U}}^{${V}}=${tidy(frac(N,6))}$.`),
  p(R`Why does $u$ turning at $x=${a}$ not invalidate this substitution?`,1,show("The integrand is a chain-rule derivative; overlapping traversals cancel."),
   R`Split at $x=${a}$ if needed. The $u$-path goes from $${U}$ down to $${c}$ and then up to $${V}$. The overlap is traversed in opposite directions, cancelling the signed contributions.`));
});

add("axis-crossing-disk-switch","outer-radius-switch","equation",4,HI,"5.12","AI-AHL5.12.volume-y-axis AI-AHL5.12.composite-volume","Choose a disk radius when the region crosses the axis",({rng:r})=>{
 const k=r.int(2,9),c=r.int(22,65)/10,Y=2*k,t=k*Math.log(c),V=Math.PI*(c*c*t+k*(Math.exp(4)-c*c)/2);
 return q(R`For $0@le y@le ${Y}$, a region lies between $x=-${n(c)}$ and $x=@mathrm{e}^{@frac{y}{${k}}}$. It is rotated about the $y$-axis. Coordinates are in centimetres.`, {k,c},
  p("Explain why each horizontal cross-section is a disk, not a washer with a hole.",1,show("The horizontal slice contains the axis."),"The endpoints lie on opposite sides of the axis, so the segment includes every distance from zero out to the farther endpoint."),
  p("Find the height at which the outer radius changes formula. Give three significant figures.",2,dec(t),R`The endpoints are equally far from the axis when $@mathrm{e}^{@frac{y}{${k}}}=${n(c)}$. Thus $y=${k}@ln(${n(c)})@approx${s(t)}$.`),
  p("Calculate the volume in cubic centimetres to three significant figures.",3,dec(V),R`Write $t=${k}@ln(${n(c)})$. The volume is $@pi@left(@int_{0}^{t} ${n(c)}^2@,@mathrm{d}y+@int_{t}^{${Y}} @mathrm{e}^{@frac{2y}{${k}}}@,@mathrm{d}y@right)@approx${s(V)}$.`));
});

add("parallel-slope-field-calibration","recover-flat-location","table",3,HI,"5.15","AI-AHL5.15.gradient-at-point AI-AHL5.15.zero-gradient-curve","Recover the zero-gradient line from parallel marked segments",({rng:r})=>{
 const a=r.int(2,7),b=r.int(2,6),d=r.int(1,3),x=r.int(3,8),y=r.int(2,7),j=r.int(2,6),w=x+1,X=x+b*d,Y=y+a*d,c=j-a*x+b*y,z=a*w+c;
 const obj=q(R`A slope field is generated by $@dfrac{@mathrm{d}y}{@mathrm{d}x}=${a}x-by+c$, with $b>0$. Two segments in the field are parallel and have the gradient shown.`, {a,x,y,X,Y,j,w},
  p("Find $b$.",2,A.int(b),R`The gradients are equal, so $${a}(${X}-${x})=b(${Y}-${y})$. This gives $b=${b}$.`),
  p("Find $c$.",1,A.int(c),R`At $(${x},${y})$ the gradient is $${j}$. Substituting gives $c=${c}$.`),
  p(R`At $x=${w}$, find the exact $y$-coordinate of the horizontal segment.`,2,exact(z,b),R`Set the gradient equal to zero: $${a}(${w})-${b}y+(${c})=0$, so $y=${frac(z,b)}$.`));
 return {...obj,table:{head:["Point",tex("x"),tex("y"),"Gradient"],rows:[["P",tex(x),tex(y),tex(j)],["Q",tex(X),tex(Y),tex(j)]]}};
});

add("reverse-second-order-euler","initial-velocity","words",3,HI,"5.18","AI-AHL5.18.convert-to-system AI-AHL5.18.euler-system","Recover initial velocity from a two-step Euler position",({rng:r})=>{
 const d=r.int(3,8),k=r.int(2,d-1),x=r.int(3,12),v=r.int(3,9),a=r.int(2,8),M=d*d*x+(2*d-k)*v+a;
 return q(R`The position $x$ of a slider satisfies $x''=${a}-${k}x'$ and $x(0)=${x}$. Using two explicit Euler steps of size $${frac(1,d)}$ gives an estimated position of $${frac(M,d*d)}$ after the second step. In each step, use the position and velocity at its start for both updates.`, {d,k,x,a,M},
  p("Write the two first-order differential equations using velocity $v$.",1,show(R`$x'=v$, $v'=${a}-${k}v$`),R`Set $v=x'$. Then $v'=x''=${a}-${k}v$.`),
  p("Find the initial velocity exactly.",3,A.int(v),R`With starting velocity $v_0$, $x_1=${x}+@dfrac{v_0}{${d}}$ and $v_1=v_0+@dfrac{${a}-${k}v_0}{${d}}$. Then $x_2=x_1+@dfrac{v_1}{${d}}$. Equating this to $${frac(M,d*d)}$ gives $v_0=${v}$.`),
  p("Find the Euler estimate of velocity after the first step, exactly.",1,exact(d*v+a-k*v,d),R`Use $v_1=${v}+@dfrac{${a}-${k}(${v})}{${d}}=${frac(d*v+a-k*v,d)}$.`));
});

add("phase-portrait-angular-direction","axis-crossing-and-radius","equation",3,HI,"5.17","AI-AHL5.17.gradient-direction AI-AHL5.17.match-portrait","Separate rotation from shrinking in a phase portrait",({rng:r})=>{
 const a=r.int(2,8),b=r.int(2,9),d=r.int(2,7),sg=r.sign();
 return q(R`A phase-plane system has $x'=-${a}x${sg===1?"-":"+"}${b}y$ and $y'=${sg===1?"":"-"}${b}x-${a}y$. A trajectory passes through $(${d},0)$.`, {a,b,d,sg},
  p("Find the vertical component of velocity at this point.",1,A.int(sg*b*d),R`With $x=${d}$ and $y=0$, $y'=${sg*b*d}$.`),
  p("Is the motion around the origin clockwise or anticlockwise at this point? Explain.",1,show(sg===1?"Anticlockwise":"Clockwise"),
   R`On the positive $x$-axis the velocity points ${sg===1?"upwards":"downwards"}, so the angle ${sg===1?"increases":"decreases"}.`),
  p(R`The squared distance to the origin is $D=x^2+y^2$. Find the exact value of $@dfrac{D'}{D}$ at any point other than the origin.`,2,A.int(-2*a),
   R`Expand $D'=2xx'+2yy'$. The cross terms cancel and $D'=-${2*a}(x^2+y^2)=-${2*a}D$.`),
  p("Does the trajectory move towards or away from the origin? Justify your answer.",1,show("Towards the origin."),"The squared distance is positive and its derivative is negative, so the distance decreases."));
});

add("perpendicular-motion-closest","closest-time","words",3,HI,"5.9","AI-AHL5.9.related-rates AI-AHL5.9.chain-rule","Use a distance derivative to find when approaching turns to receding",({rng:r})=>{
 const u=r.int(2,8),v=r.int(2,8),x=r.int(1,6),y=Math.floor(u*x/v)+r.int(2,12),den=u*u+v*v,tn=v*y-u*x;
 return q(R`Two floor robots move along perpendicular tracks that meet at a crossing. At $t=0$ robot P is $${x}$ metres east of the crossing and travels east at $${u}$ metres per second. Robot Q is $${y}$ metres north of the crossing and travels south at $${v}$ metres per second. Consider the time before Q reaches the crossing.`, {u,v,x,y},
  p("For their separation $D$, write an expression for $D^2$ in terms of $t$.",2,show(R`$D^2=(${x}+${u}t)^2+(${y}-${v}t)^2$`),"Apply Pythagoras to their distances from the crossing."),
  p("Find the exact time when they are closest together.",2,exact(tn,den),R`Minimising $D$ is equivalent to minimising $D^2$. Its derivative is zero when $${u}(${x}+${u}t)=${v}(${y}-${v}t)$, so $t=${frac(tn,den)}$.`),
  p("Explain why this stationary time is a minimum, not a maximum.",1,show("The quadratic for squared distance has a positive leading coefficient."),
   R`$D^2$ is a quadratic with positive coefficient $${den}$ on $t^2$. Also $D$ increases whenever $D^2$ increases, since distance is non-negative.`));
});

add("gradient-from-uneven-times","compare-secant-estimates","table",2,SA,"5.1","SL5.1.gradient-from-graph","Choose and compare secants using unequal sampling intervals",({rng:r})=>{
 const t=r.int(6,14),k=r.int(2,7),b=r.int(2,8),c=r.int(60,100),d=r.int(2,4),e=r.int(1,d-1),z=e+r.int(1,3);
 const h=x=>c+b*x+k*x*x,U=b+k*(e-d),V=b+k*z;
 const obj=q(R`The table gives the height $h$, in metres, of a lift platform at four times, in seconds. Two students estimate its instantaneous vertical velocity at $t=${t}$.`, {t,k,b,c,d,e,z},
  p(R`Student A uses the earliest recorded time and the first recorded time after $t=${t}$. Find this secant slope in metres per second.`,1,A.int(U),R`The height changes by $${h(e)-h(-d)}$ metres over $${d+e}$ seconds, so the slope is $${U}$.`),
  p(R`Student B uses $t=${t}$ and the last recorded time. Find this secant slope in metres per second.`,1,A.int(V),R`The height changes by $${h(z)-h(0)}$ metres over $${z}$ seconds, so the slope is $${V}$.`),
  p("Do these measurements establish the exact instantaneous velocity at the target time? Explain.",1,show("No. They give average velocities over intervals, not the limiting slope."),
   "The recorded measurements determine the two secant slopes only. Instantaneous velocity is the tangent slope, or the limit of secant slopes as the time interval tends to zero."));
 return {...obj,table:{head:["Time (s)",...[t-d,t,t+e,t+z].map(tex)],rows:[["Height (m)",...[-d,0,e,z].map(j=>tex(h(j)))]]}};
});

add("two-reversals-flow-budget","net-versus-intake","words",4,SI,"5.5","SL5.5.definite-integral-gdc SL5.5.area-positive","Separate intake from net change when a flow reverses twice",({rng:r})=>{
 const M=r.pick([5,6,7,8,10,11,12,13,14,15]),C=r.int(5,8),end=C+r.int(1,3),lo=(C-Math.sqrt(M))/2,hi=(C+Math.sqrt(M))/2;
 const G=t=>M*t+((C-2*t)**3-C**3)/6,gross=G(hi)-G(lo),net=G(end);
 return q(R`A reversible pump has signed flow rate $r(t)=${M}-(2t-${C})^2$ litres per minute for $0@le t@le ${end}$. Positive rates mean water enters the tank; negative rates mean water leaves it.`, {M,C,end},
  p("Find the earlier reversal time to three significant figures.",1,dec(lo),R`Solving $r(t)=0$ gives $t=@dfrac{${C}@pm@sqrt{${M}}}{2}$. The earlier reversal is $${s(lo)}$ minutes.`),
  p("Find the later reversal time to three significant figures.",1,dec(hi),R`The later solution is $${s(hi)}$ minutes. The pump moves water into the tank between the two roots.`),
  p("Find the total amount of water pumped into the tank during the period, to three significant figures.",2,dec(gross),R`Integrate $r(t)$ only between the unrounded reversal times. This gives $${s(gross)}$ litres.`),
  p("Find the signed net change in the amount of water in the tank, to three significant figures.",2,dec(net),R`Integrate the signed rate from $0$ to $${end}$, including the negative parts. The change is $${s(net)}$ litres.`));
},["aa-sl","aa-hl"]);

add("shifted-inverse-drain","time-to-clearance","words",3,HI,"5.14","AI-AHL5.14.set-up AI-AHL5.14.separate-variables AI-AHL5.14.interpret-model","Calibrate a differential equation with a restricted physical domain",({rng:r})=>{
 const B=r.int(2,8),L=r.int(8,13),J=r.int(5,L-2),K=r.int(1,J-2),k=r.int(2,7),H=L*L-J*J,W=2*k,t0=frac(H,W);
 return q(R`The fluid surface is at height $h$ centimetres above the base of a tank. While $h>${B}$, the rate at which the height decreases is inversely proportional to the clearance above a side outlet at height $${B}$. Initially $h=${B+L}$; after $${t0}$ minutes, $h=${B+J}$.`, {B,L,J,K,H,W},
  p(R`Use a positive constant $k$ to write a differential equation for $h$.`,1,show(R`$@dfrac{@mathrm{d}h}{@mathrm{d}t}=-@dfrac{k}{h-${B}}$`),R`The clearance is $h-${B}$ and the height is decreasing, so the derivative is negative.`),
  p("Find $k$ exactly.",2,A.int(k),R`Separating and integrating gives $(h-${B})^2=${L*L}-2kt$. Using $h=${B+J}$ at $t=${t0}$ gives $k=${k}$.`),
  p(R`Find the exact time in minutes, measured from the start, when $h=${B+K}$.`,2,exact(L*L-K*K,2*k),R`The model applies because $${B+K}>${B}$. Solving $${K*K}=${L*L}-${2*k}t$ gives $t=${frac(L*L-K*K,2*k)}$.`));
});
})(typeof window==="undefined"?globalThis:window);
