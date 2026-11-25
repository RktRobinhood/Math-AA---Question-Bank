/* Original bounded Wave 3 families, Functions and Geometry. */
(function(root){
"use strict";
const E=root.QBEngine,{ans:A,fmt:F}=E;
const T=String.raw,M=x=>"$"+x+"$",I=A.int,C=x=>A.sf(x,3),S=x=>F.sf(x,3),N=F.num,R=F.frac;
const P=(prompt,marks,answer,...working)=>({prompt,marks,answer,working}), Q=(params,stem,...parts)=>({params,stem,parts});
const V=(...a)=>T`\left(${a.map(N).join(",\\,")}\right)`,L=(a,b,variable)=>F.lin(a,b,variable);
const opt=(text,value,why)=>({text,value,why}), choice=(r,y,...n)=>A.choice(r,y,n);
const AA="aa-sl",AH="aa-hl",AI="ai-sl",IH="ai-hl";
function reg(name,home,code,ids,level,rep,title,build,extra={}){
 E.register({type:"w3-functions-geometry-"+name,title,home,syllabus:[code],skills:ids.split(" "),levels:[level],calculator:level===4,representation:rep,unknown:"result",format:"value",build,...extra});
}
reg("radical-branch",AA,"2.10","SL2.10.solve-analytic SL2.10.number-of-solutions",3,"equation","Reject an extraneous root after squaring",({rng:r})=>{
 const h=r.int(4,15),b=r.int(1,4),c=r.pick([1,2,3,4,5].filter(x=>x!==b)),k=b-c,z=b*c-k*h;
 const form=T`$\sqrt{${L(k,z)}}=${L(1,-h)}$`, lo=h-c,hi=h+b;
 return Q({h,b,c,k,z},T`A student squares both sides when solving ${form}.`,
  P("Find the smaller root of the squared equation.",2,I(lo),T`Write $u=x-${h}$. The squared equation is $u^2-\left(${k}\right)u-${b*c}=0$, or $(u-${b})(u+${c})=0$. The smaller root of the equation in $x$ is $${lo}$.`),
  P("Find the solution of the original equation.",3,I(hi),T`The right side of the original equation must be nonnegative. The smaller candidate makes it $-${c}$ and must be discarded.`,T`The larger candidate makes both sides equal to $${b}$, so $x=${hi}$ is valid.`));
});
reg("cascade-range",AA,"2.5","SL2.5.composite-value SL2.5.inverse-domain-range",4,"words","Check whether cascaded instruments can reach a requested output",({rng:r})=>{
 const c=r.int(3,8),end=r.int(5,8),p=r.int(2,4),k=r.int(15,23)/100,base=r.int(28,55),limit=base*(1-Math.exp(-k*(c+p*end))),lo=base*(1-Math.exp(-k*c));
 const q=r.int(50,70)/100,valid=Math.round(lo+(limit-lo)*q),high=Number((limit+.4*(base-limit)).toFixed(3));
 const value=(-Math.log(1-valid/base)/k-c)/p;
 return Q({c,end,p,k,base,valid,high},T`An instrument sends input $x$ through $g(x)=${L(p,c)}$, then $f(u)=${base}\left(1-\mathrm{e}^{-${k}u}\right)$. The instrument only permits $0\le x\le ${end}$.`,
  P("Find the maximum output, to three significant figures.",2,C(limit),T`The two stages are increasing, so the largest output is $f(g(${end}))\approx ${S(limit)}$.`),
  P(T`Find the input that gives output $${valid}$, to three significant figures.`,2,C(value),T`Set $f(g(x))=${valid}$, isolate the exponential, and solve for $x$ using the unrounded values: $x\approx${S(value)}$.`),
  P(T`Can the output be $${high}$? Select the reason.`,1,choice(r,opt("No. It exceeds the maximum on the permitted input domain.","dom"),opt("Yes. It is below the horizontal asymptote.","asym"),opt("No. It is below the output at input zero.","min")),T`The asymptote without the input cap is $y=${base}$, but the domain cap gives a lower maximum. The proposed value exceeds it.`));
});
reg("paired-reflection",AI,"2.2","SL2.2.inverse-undo SL2.2.range",3,"table","Audit reflected points and bound an inverse",({rng:r})=>{
 const a=r.int(-8,-2),b=r.int(1,6),c=r.int(10,20),d=r.int(3,7),e=r.int(1,d-1),x=r.int(a+1,b-1),j=r.pick([0,1,2]);
 const pairs=[[a,c],[x,c+e],[b,c+d]];
 const bad=[pairs[j][1],pairs[j][0]+1];
 const proposal=pairs.map(([x,y],k)=>k===j?bad:[y,x]);
 const q=Q({pairs,proposal}, "The graph of an increasing one-to-one function is continuous between the first and last points in the table. It has no points outside this input interval. A student proposed three reflected points for its inverse.",
  P("Find the lower endpoint of the inverse function's domain.",2,I(c),T`The inverse's domain is the full range of the original function, beginning at $${c}$.`),
  P("Which proposed inverse point is wrong?",1,choice(r,opt("Row "+M(j+1),j),...[0,1,2].filter(k=>k!==j).map(k=>opt("Row "+M(k+1),k))),"Reflection in $y=x$ swaps the coordinates of each point. Check the two coordinates in each row."),
  P("Find the correct second coordinate of the inverse point in that row.",2,I(pairs[j][0]),T`The corrected point swaps the original coordinates, giving $${V(pairs[j][1],pairs[j][0])}$.`));
 q.table={head:["Row","Point on original graph","Proposed point on inverse"],rows:pairs.map((a,i)=>[M(i+1),M(V(...a)),M(V(...proposal[i]))])};
 return q;
});
reg("holdout-tolerance",AI,"2.6","AI-SL2.6.test-model AI-SL2.6.limitations",3,"table","Audit a model against an error tolerance, not its fit points",({rng:r})=>{
 const a=r.int(12,28),b=r.int(2,8),n=r.int(3,7),tol=r.int(2,5),j=r.int(0,2),dir=r.sign();
 const hours=[n,n+1,n+2],observed=hours.map((x,i)=>a+b*x+(i===j?dir*(tol+r.int(1,3)):r.sign()*r.int(0,tol)));
 const error=observed[j]-a-b*hours[j];
 const q=Q({a,b,hours,observed,tol},T`A model for the number of boxes on a loading platform is $B(t)=${L(b,a,"t")}$, for hour $t$ after opening. The model was fitted to earlier data. During a later check the model is acceptable only if its prediction is within $${tol}$ boxes of each observed count, inclusive.`,
  P("Find the hour for which the prediction fails the check.",2,I(hours[j]),"Calculate predictions for the three hours. Compare the absolute errors with the allowed tolerance, including equality."),
  P("At that hour, find the signed error: observed minus predicted.",2,I(error),T`Subtract the predicted count $${a+b*hours[j]}$ from the observed count $${observed[j]}$. The signed error is $${error}$.`),
  P("Select the appropriate conclusion.",1,choice(r,opt("The model fails the stated check because one prediction is outside tolerance.","fail"),opt("The model passes because most predictions are within tolerance.","majority"),opt("The model is invalid at all earlier times.","all")),"The rule applies to every check point. Failure on the later check does not establish what happened at all earlier times."));
 q.table={head:["Hour",...hours.map(M)],rows:[["Observed boxes",...observed.map(M)]]};return q;
});
reg("extension-pole",AA,"3.1","SL3.1.midpoint-3d SL3.1.distance-3d",3,"words","Locate a relocated midpoint and compare cable lengths",({rng:r})=>{
 const [a,b,c]=[r.int(-5,5),r.int(-5,5),r.int(1,8)],u=r.int(2,7),v=r.int(1,6),w=r.int(2,5),k=r.int(1,4);
 const A0=[a,b,c],B0=[a+2*u,b+2*v,c+2*w],B1=[B0[0],B0[1],B0[2]+2*k],M1=[a+u,b+v,c+w+k],d2=4*(u*u+v*v+(w+k)**2);
 return Q({A0,B0,B1},T`A straight, taut cable is attached at $A${V(...A0)}$ and $B${V(...B0)}$. Coordinates are in metres, with $z$ vertical. The attachment at $B$ is raised by $${2*k}$ metres and a new taut cable is fitted. Its midpoint is $M$.`,
  P("Find the height of the new midpoint above the plane $z=0$, in metres.",2,I(M1[2]),T`Average the endpoint heights: $\dfrac{${c}+${B1[2]}}2=${M1[2]}$.`),
  P(T`The new cable length is $\sqrt{K}$ metres. Find $K$.`,2,I(d2),T`The coordinate changes are $${2*u}$, $${2*v}$ and $${2*(w+k)}$. Sum their squares.`),
  P("By how much does the square of the cable length increase?",1,I(4*k*(2*w+k)),T`Horizontal changes are unchanged. Subtract the old squared vertical change from the new one: $${2*(w+k)}^{2}-${2*w}^{2}=${4*k*(2*w+k)}$.`));
});
reg("bisector-translation",AI,"3.5","AI-SL3.5.bisector-equation AI-SL3.5.bisector-gradient",3,"words","Update a boundary after both sites move together",({rng:r})=>{
 const a=r.int(-4,6),b=r.int(-4,6),u=r.int(1,5),v=r.int(2,6),p=r.int(1,4),q=r.int(1,4),m=u*(a+u)+v*(b+v),change=u*p+v*q,K=m+change;
 const lhs=(u===1?"":u)+"x+"+v+"y";
 return Q({a,b,u,v,p,q},T`Two water stations at $${V(a,b)}$ and $${V(a+2*u,b+2*v)}$ are both moved $${p}$ units east and $${q}$ units north. Before the move their perpendicular bisector was $${lhs}=${m}$. After the move write it as $${lhs}=C$.`,
  P("Find the gradient of the new boundary exactly.",1,A.frac(-u,v),T`The change moves both stations together so the direction of the line is unchanged. Its gradient is $${R(-u,v)}$.`),
  P("Find $C$.",2,I(K),T`The new midpoint is $${V(a+u+p,b+v+q)}$. Substitute it into the boundary equation to obtain $C=${K}$.`),
  P("Find the amount by which the boundary's $y$-intercept increases, giving an exact value.",2,A.frac(change,v),T`At $x=0$ the $y$-intercept equals the constant divided by $${v}$. The increase is $${R(change,v)}$.`));
});
reg("voronoi-added-edge",AI,"3.6","AI-SL3.6.draw-or-update AI-SL3.6.cell-measure",2,"words","Track area transferred to a new Voronoi site",({rng:r})=>{
 const a=r.int(2,6),b=r.int(2,6),u=r.int(1,5),H=r.int(3,11),W=2*(a+b+u)+2;
 const sites=[1,1+2*a,1+2*(a+b)],x1=1+a,x2=1+2*a+b;
 return Q({sites,H,W},T`A flat rectangular map is $0\le x\le${W}$ and $0\le y\le${H}$. It initially has two supply sites at $${V(sites[0],1)}$ and $${V(sites[2],1)}$. A third site opens at $${V(sites[1],1)}$. Each address uses its nearest site.`,
  P("Find the width of the new site's Voronoi cell on this map.",2,I(a+b),T`Both cell edges are vertical bisectors, at $x=${x1}$ and $x=${x2}$. Their separation is $${a+b}$.`),
  P("Find the area lost specifically by the original left-hand site.",2,I(H*b),T`Its right boundary was at $x=${1+a+b}$ and is now at $x=${x1}$. It loses a strip of width $${b}$ and height $${H}$.`));
});

reg("orientation-ordered-maps",IH,"3.9","AI-AHL3.9.compose-transformations AI-AHL3.9.image-under-transformation AI-AHL3.9.area-scale-factor",3,"equation","Use one landmark image to identify transformation order",({rng:r})=>{
 const a=r.int(2,6),b=r.int(1,4),x=r.int(1,6),y=r.int(1,6),u=r.int(1,6),v=r.int(1,6),order=r.bool()?1:0;
 const go=(x,y)=>order?[-a*y+b*x,x]:[-y,a*x+b*y],W=go(x,y),R0=go(u,v);
 return Q({a,b,x,y,u,v,order,W},T`A point is transformed once by each matrix $D=\begin{pmatrix}${a}&${b}\\0&1\end{pmatrix}$ and $J=\begin{pmatrix}0&-1\\1&0\end{pmatrix}$. The point $${V(x,y)}$ has final image $${V(...W)}$.`,
  P("What does the landmark image tell you about the order?",2,choice(r,opt(order?"J was applied first.":"D was applied first.",order),opt(order?"D was applied first.":"J was applied first.",1-order),opt("Either order can give this image.","either")),T`Compute each possible image. Applying $D$ first gives $${V(-y,a*x+b*y)}$; applying $J$ first gives $${V(-a*y+b*x,x)}$.`),
  P(T`For the same order, find the first coordinate of the image of $${V(u,v)}$.`,2,I(R0[0]),T`Use the same multiplication order for this new point. The image is $${V(...R0)}$.`),
  P("Find the area scale factor for the combined transformation.",1,I(a),T`Multiply the absolute determinants. The rotation has determinant $1$ and $D$ has determinant $${a}$, so the factor is $${a}$.`));
});
reg("release-delay",IH,"3.12","AI-AHL3.12.meet-or-collide AI-AHL3.12.time-shift",3,"words","Find the release delay that makes two vehicles meet",({rng:r})=>{
 const x=r.int(2,12),y=r.int(2,12),tB=r.int(2,6),d=r.int(1,5),tA=tB+d,u=r.int(1,4),v=r.int(1,4),w=r.int(1,4),z=-r.int(1,4);
 const Q0=[x+tA*u,y+tA*v],B0=[Q0[0]-tB*w,Q0[1]-tB*z];
 return Q({A0:[x,y],B0,Va:[u,v],Vb:[w,z]},T`Vehicle $A$ leaves point $${V(x,y)}$ at time $0$ with constant velocity $${V(u,v)}$. Vehicle $B$ waits at $${V(...B0)}$ until it is released, then travels with constant velocity $${V(w,z)}$. Positions are in metres and velocities are in metres per second. The vehicles must meet while both are moving.`,
  P("Find the time since vehicle $A$ started when the vehicles can meet, in seconds.",3,I(tA),T`Let $t$ and $s$ be the travel times of $A$ and $B$. Match the two position coordinates: $${L(u,x,"t")}=${L(w,B0[0],"s")}$ and $${L(v,y,"t")}=${L(z,B0[1],"s")}$. Solving gives $t=${tA}$ and $s=${tB}$.`),
  P("Find the required release delay for vehicle $B$, in seconds.",2,I(d),T`The travel times end at the same clock time, so the release delay is $t-s=${d}$.`));
});
reg("missing-intercept-plane",AH,"3.17","AHL3.17.plane-equation AHL3.17.point-in-plane",3,"equation","Infer a missing axis intercept from a point on a plane",({rng:r})=>{
 const a=r.int(2,6),b=r.int(2,7),c=r.int(2,8),m=r.int(1,3),n=r.int(1,3);
 const H=8*c, x=m*a,y=n*b,z=(8-m-n)*c;
 return Q({Ax:8*a,By:8*b,x,y,z},T`A plane cuts the positive $x$-axis at $${V(8*a,0,0)}$ and the positive $y$-axis at $${V(0,8*b,0)}$. It passes through $P${V(x,y,z)}$ and cuts the positive $z$-axis at $(0,0,h)$.`,
  P(T`Write the plane in the form $\alpha x+\beta y+\gamma z=1$. Find $\alpha+\beta$ exactly.`,2,A.frac(a+b,8*a*b),T`Substitute the two known intercepts separately: $\alpha=${R(1,8*a)}$ and $\beta=${R(1,8*b)}$. Add these fractions.`),
  P("Find $h$.",3,I(H),T`Substitute $P$ to get $\gamma\cdot ${z}=1-${R(m,8)}-${R(n,8)}$. This gives $\gamma=${R(1,H)}$. At the $z$-intercept, $\gamma h=1$, so $h=${H}$.`));
});
reg("symmetry-unknown-phase",AH,"3.11","AHL3.11.symmetry-relations AHL3.11.related-values",3,"equation","Recover the original phase quadrant from two shifted readings",({rng:r})=>{
 const h=r.int(2,7),l=r.int(1,h-1),n=h*h+l*l,C0=r.sign()*(h*h-l*l),S0=r.sign()*2*h*l;
 const e=r.int(1,3),f=r.int(1,3),k=2*e+1,j=2*f+1,p=(-1)**e*C0,q=(-1)**f*S0;
 const quadrant=C0>0?(S0>0?0:3):S0>0?1:2, names=["I","II","III","IV"];
 return Q({n,p,q,k,j},T`Two sensors record $\sin\left(\dfrac{${k}\pi}{2}-\theta\right)=${R(p,n)}$ and $\cos\left(\dfrac{${j}\pi}{2}-\theta\right)=${R(q,n)}$, where $0\le\theta<2\pi$.`,
  P(T`Find $\cos\theta$ exactly.`,2,A.frac(C0,n),T`The shifted sine equals $${e%2?"-":""}\cos\theta$. Undo the sign from the half turns: $\cos\theta=${R(C0,n)}$.`),
  P(T`Find $\tan\theta$ exactly.`,2,A.frac(S0,C0),T`The shifted cosine equals $${f%2?"-":""}\sin\theta$, so $\sin\theta=${R(S0,n)}$. Divide this by the recovered cosine.`),
  P("In which quadrant is the unshifted angle?",1,choice(r,opt("Quadrant "+names[quadrant],quadrant),...[0,1,2,3].filter(i=>i!==quadrant).map(i=>opt("Quadrant "+names[i],i))),T`The signs of cosine and sine are ${C0>0?"positive":"negative"} and ${S0>0?"positive":"negative"}, respectively: quadrant ${names[quadrant]}.`));
});
reg("window-log-inequality",AH,"2.15","AHL2.15.graphical-inequality",4,"equation","Find where a logarithm beats a line inside a domain window",({rng:r})=>{
 const d=r.int(-4,3),slope=r.int(15,35)/100,c=Number((1+Math.log(slope)+r.int(18,36)/100).toFixed(4));
 const fn=u=>Math.log(u)-slope*u+c;
 const min=1e-5,max=60;
 const bis=(a,b)=>{let fa=fn(a);for(let i=0;i<60;i++){const m=(a+b)/2;if((fn(m)>0)===(fa>0)){a=m;fa=fn(a);}else b=m;}return (a+b)/2;};
 const peak=1/slope, left=bis(min,peak)+d,right=bis(peak,max)+d,W=Number((Math.round((right-d+.7)*10)/10+d).toFixed(3));
 return Q({d,slope,c,W},T`On the window $${d}<x\le${W}$, compare $g(x)=\ln(${L(1,-d)})$ and $f(x)=${slope}(${L(1,-d)})${c<0?"+"+(-c):"-"+c}$. Solve $g(x)\ge f(x)$.`,
  P("Find the smaller boundary of the solution interval, to three significant figures.",2,C(left),T`Graph both functions only for $x>${d}$ and find the first intersection at $x\approx${S(left)}$.`),
  P("Find the larger boundary, to three significant figures.",2,C(right),T`The second intersection is $x\approx${S(right)}$.`),
  P("Select the part of the window on which the inequality holds.",1,choice(r,opt("Between the intersections, including both intersections.","inside"),opt("Strictly between the intersections, excluding both intersections.","strict"),opt("Outside the intersections, including both intersections.","outside")),"The logarithmic graph is above the line between intersections. Equality at each intersection is allowed."));
});
})(typeof window==="undefined"?globalThis:window);
