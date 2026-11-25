/* Original bounded function and modelling activities, Wave 6. */
(function(root){
"use strict";
const E=root.QBEngine,{ans:A,fmt:F}=E;
const R=(t,...v)=>String.raw({raw:t},...v).replace(/@/g,"\\");
const m=x=>F.m(String(x)), fr=F.frac, lin=F.lin, pm=(x,c)=>F.lin(1,-c,x);
const P=(prompt,marks,answer,...working)=>({prompt,marks,answer,working});
const Q=(stem,params,...parts)=>({stem,params,parts});
const table=(q,head,rows)=>({...q,table:{head,rows}});
const choose=(r,items,i)=>A.choice(r,{text:items[i],value:i},items.flatMap((text,j)=>j===i?[]:[{text,value:j}]));
const add=(id,title,home,code,skills,l,representation,build)=>{
 E.register({type:"w6-fn-"+id,unknown:"reasoning",title,home,syllabus:[code],skills:skills.split(" "),levels:[l],format:"value",representation,calculator:false,source:"original-wave-6",build});
};
const aa="aa-sl",ai="ai-sl",hl="ai-hl";

add("negative-distance-intercept","Read a signed rate using two line intercepts",aa,"2.1","SL2.1.gradient SL2.1.intercepts",1,"words",({rng:r})=>{
 const a=r.int(2,13)*r.sign(), b=r.int(2,19)*r.sign();
 return Q(R`A line crosses the horizontal axis at $${a}$ and the vertical axis at $${b}$.`,{a,b},
 P("Find its exact gradient.",2,A.frac(-b,a),
 R`The points are $(${a},0)$ and $(0,${b})$. The change in height is $${b}$ as $x$ changes by $${-a}$, so the gradient is $${fr(-b,a)}$.`));
});

add("rate-gap-reconstruct-plans","Recover two competing linear tariffs from two price gaps",aa,"2.1","SL2.1.line-model SL2.1.gradient SL2.1.intersection-lines",3,"table",({rng:r})=>{
 const s=r.int(2,7),c=r.int(4,14),k=r.int(1,s-1)*r.sign(),cross=r.int(6,13);
 const x0=r.int(1,4),x1=cross+r.int(2,6),g0=k*(x0-cross),g1=k*(x1-cross);
 // Both starting fees are nonnegative; publish Plan A's fee high enough when needed.
 const a0=c+Math.max(0,k*cross),b=a0-k*cross;
 return table(Q(R`Two tariff plans have linear total prices for any nonnegative whole number of units. Plan A charges a starting fee of $${a0}$ euros plus $${s}$ euros per unit. The table shows Plan B's total price minus Plan A's total price.`,{s,a0,x0,x1,g0,g1},
 P("Find Plan B’s charge per unit, in euros.",2,A.int(s+k),
 R`The gap changes by $${g1-g0}$ euros over $${x1-x0}$ units, so its gradient is $${k}$. Add it to Plan A’s rate: $${s+k}$ euros per unit.`),
 P("Find Plan B’s starting fee, in euros.",2,A.int(b),
 R`Extrapolate the linear gap to zero units: $${g0}-(${k})(${x0})=${-k*cross}$. Add this signed gap to $${a0}$ euros to get $${b}$ euros.`),
 P("Find the number of units for which the total prices agree.",2,A.int(cross),
 R`Set the price gap to zero: $${lin(k,-k*cross)}=0$, giving $x=${cross}$ units.`)),
 ["Quantity","Signed price gap"],[[m(x0)+" units",m(g0)+" euros"],[m(x1)+" units",m(g1)+" euros"]]);
});

add("blocked-input-range-gaps","Recover a discrete function’s range after removing unavailable inputs",aa,"2.2","SL2.2.domain SL2.2.range",2,"table",({rng:r})=>{
 const x=r.int(3,15),y=r.int(14,32),d=r.int(2,7), f=[y,y+d,y+d,y+2*d,y+3*d,y+3*d];
 const miss=r.pick([[1,3],[2,3],[0,4],[0,5],[3,4],[3,5],[0,3],[1,4],[4,5]]), xs=f.map((_,i)=>x+i),out=f.filter((_,i)=>!miss.includes(i)), vals=[...new Set(out)];
 return table(Q(R`A controller maps each available input $x$ to one output. The table shows the output that each setting would give. Two settings, $x=${xs[miss[0]]}$ and $x=${xs[miss[1]]}$, are disabled and every other table input remains available. There are no other inputs.`,{xs,f,miss},
 P("How many distinct outputs are in the actual range?",2,A.int(vals.length),
 R`Remove the disabled rows. The remaining outputs are $${out.join(",")}$, so the range is $@{${vals.join(",")}@}$ with $${vals.length}$ distinct values.`),
 P("Find the smallest output in this range.",1,A.int(Math.min(...vals)),
 R`Take the minimum of the remaining outputs: $${Math.min(...vals)}$.`)),
 ["Input","Output"],xs.map((v,i)=>[m("x="+v),m("f(x)="+f[i])]));
});

add("key-features-different-baseline","Distinguish the zero of a graph from the zero of a shifted graph",aa,"2.4","SL2.4.zeros-intercepts SL2.4.max-min",3,"table",({rng:r})=>{
 const x=[r.int(0,5)];for(let i=0;i<4;i++)x.push(x.at(-1)+r.int(2,7));
 const a=r.int(3,9),b=r.int(2,6),c=r.int(2,8),e=r.int(3,9), y=[-a,b,c+b,b,-e];
 const N=x[0]*(a+b)+(x[1]-x[0])*a,D=a+b;
 return table(Q("A sensor’s signed reading is given by $f(x)$. The graph consists of straight segments joining successive entries with no extension beyond the table. A recalibrated graph is $g(x)=f(x)-B$, where $B$ is chosen so that the second and fourth listed inputs are zeros of $g$.",{x,y},
 P("Find the exact smaller zero of the original graph $f$.",2,A.frac(N,D),
 R`On the first segment the reading rises by $${D}$ from $-${a}$, so zero is $${fr(a,D)}$ of the way from $${x[0]}$ to $${x[1]}$: $x=${fr(N,D)}$.`),
 P("Find the value of $B$.",1,A.int(b),
 R`Both readings are $${b}$ so subtract $B=${b}$.`),
 P("Find the maximum reading of the recalibrated graph $g$.",2,A.int(c),
 R`A straight segment has no reading above both endpoints. The original largest entry is $${b+c}$, so the recalibrated largest reading is $${b+c}-${b}=${c}$.`)),
 ["Input","Signed reading"],x.map((v,i)=>[m("x="+v),m("f(x)="+y[i])]));
});

add("two-branches-clearance","Use a quadratic inequality to check clearance beyond a buffer zone",aa,"2.7","SL2.7.inequality SL2.7.solve-equation",2,"words",({rng:r})=>{
 const a=r.int(6,18),d=r.int(2,5),s=r.int(1,4),y=r.int(5,13),cap=a+d+r.int(2,6),low=y+s*d*d;
 return Q(R`The clearance above a track is $C(x)=${s===1?"":s}(${pm("x",a)})^2+${y}$ metres for $0@le x@le ${cap}$ metres. A vehicle requires at least $${low}$ metres of clearance.`,{a,d,s,y,cap,low},
 P("Find the smaller $x$ where clearance is exactly the requirement.",2,A.int(a-d),
 R`Equal clearance gives $(${pm("x",a)})^2=${d*d}$. The two positions are $${a-d}$ and $${a+d}$ metres.`),
 P("Find the total length of track on which the clearance is sufficient.",2,A.int(cap-2*d),
 R`Clearance is sufficient outside the central interval: from $0$ to $${a-d}$ and from $${a+d}$ to $${cap}$. The two lengths add to $${cap-2*d}$ metres.`));
});

add("reciprocal-centre-meeting","Find where two shifted reciprocal branches share a height",aa,"2.8","SL2.8.rational-equation SL2.8.asymptotes",2,"equation",({rng:r})=>{
 const c=r.int(1,11)*r.sign(),a=c+r.int(3,8),u=r.int(2,7),v=r.int(2,9),b=r.int(2,12),den=u+v,X=u*a+v*c;
 return Q(R`Let $f(x)=${b}+@dfrac{${u}}{${pm("x",c)}}$ and $g(x)=${b}-@dfrac{${v}}{${pm("x",a)}}$.`,{c,a,u,v,b},
 P("Give the value of $y$ on the shared horizontal asymptote.",1,A.int(b),
 R`Each reciprocal term approaches zero as $|x|$ increases, so both functions approach $y=${b}$.`),
 P("Find the exact $x$-coordinate of their intersection.",3,A.frac(X,den),
 R`Cancel the common baseline. Then $${u}(${pm("x",a)})=-${v}(${pm("x",c)})$, giving $x=${fr(X,den)}$. This lies strictly between $${c}$ and $${a}$, so it is in both domains.`));
});

add("reflection-translation-order","Compare graph images when reflection and translation swap order",aa,"2.11","SL2.11.composite-transform SL2.11.image-point",3,"words",({rng:r})=>{
 const x=r.int(1,13)*r.sign(),y=r.int(2,9)*r.sign(),h=r.int(2,9)*r.sign(),v=r.int(2,9)*r.sign(),acrossY=r.bool();
 const ax=acrossY?-x+h:x+h,ay=acrossY?y+v:-y+v,bx=acrossY?-x-h:x+h,by=acrossY?y+v:-y-v;
 return Q(R`A graph contains the marked point $P=(${x},${y})$. Transformation A first reflects the graph in the $${acrossY?"y":"x"}$-axis, then adds $${h}$ to every horizontal coordinate and $${v}$ to every vertical coordinate. Transformation B performs the same two operations in the opposite order.`,{x,y,h,v,acrossY},
 P(R`Find the $${acrossY?"x":"y"}$-coordinate of the image of $P$ under transformation A.`,2,A.int(acrossY?ax:ay),
 R`Reflect $P$ to $(${acrossY?-x:x},${acrossY?y:-y})$ and then translate to $(${ax},${ay})$.`),
 P(R`Find the $${acrossY?"x":"y"}$-coordinate of the image of $P$ under transformation B.`,2,A.int(acrossY?bx:by),
 R`Translate $P$ to $(${x+h},${y+v})$ and then reflect to $(${bx},${by})$.`),
 P("Find the distance between these two images of $P$.",2,A.int(acrossY?2*Math.abs(h):2*Math.abs(v)),
 R`The image points have the same ${acrossY?"vertical":"horizontal"} coordinate. The absolute difference of the other coordinates gives $${acrossY?2*Math.abs(h):2*Math.abs(v)}$ units.`));
});

add("mean-error-can-hide-offsets","Check whether zero mean signed error means a model is exact",ai,"2.6","AI-SL2.6.test-model AI-SL2.6.limitations",1,"table",({rng:r})=>{
 const x=r.int(21,39),z=r.int(52,79),d=r.int(2,10)*r.sign(),one=x+d,two=z-d;
 const opts=["Both predictions must equal the measured values.","The two nonzero signed errors cancel.","The signed errors are both positive.","Both predictions must have lower values than the measurements."];
 return table(Q("The table shows two checks of one sensor model. A signed prediction error is the prediction minus the observation.",{x,z,one,two},
 P("The mean signed error is zero. Which statement explains why?",2,choose(r,opts,1),
 R`The signed errors are $${one}-${x}=${d}$ and $${two}-${z}=${-d}$. They cancel in the mean, but neither one is zero.`)),
 ["Observation","Prediction"],[["A observed: "+m(x),"A predicted: "+m(one)],["B observed: "+m(z),"B predicted: "+m(two)]]);
});

add("logistic-gap-to-capacity","Infer the hidden logistic parameter from a gap to capacity",hl,"2.9","AI-AHL2.9.logistic-model AI-AHL2.9.carrying-capacity",2,"words",({rng:r})=>{
 const d=r.pick([2,3,4,5,6,7,8]),i=r.int(12,69),K=d*i, gap=K-i,k=r.pick([2,3,4,5,6,7,8,9]);
 return Q(R`A filtration system’s output at time $t@ge0$ follows $H(t)=@dfrac{${K}}{1+a@, @mathrm{e}^{-@dfrac{t}{${k}}}}$, where $a>0$. Initially its output is $${gap}$ units below its long-run capacity.`,{K,gap,k},
 P("Find the output at $t=0$.",1,A.int(i),
 R`The long-run capacity is $${K}$. Subtract the stated initial gap: $${K}-${gap}=${i}$ units.`),
 P("Find the exact value of $a$.",2,A.int(d-1),
 R`At $t=0$ the exponential term is $1$. Thus $1+a=${fr(K,i)}$ and $a=${d-1}$.`));
});

add("log-difference-slope-two-axis","Recover the original-unit multiplier from change on a log–log plot",hl,"2.10","AI-AHL2.10.transform-data AI-AHL2.10.predict-from-line",3,"table",({rng:r})=>{
 const x0=r.pick([2,3,4,5,6,7]), y0=r.int(2,9), s=r.pick([-3,-2,2,3]),p=r.pick([2,3,4]),j=p===4||Math.abs(s)===3?2:r.int(2,3), x1=x0*p, den=s<0?p**(-s):1, nom=s<0?y0:y0*p**s, power=p**j;
 const facn=s>0?power**s:1,facd=s<0?power**(-s):1;
 return table(Q("A straight line is obtained by plotting base-$10$ logarithms of $y$ against base-$10$ logarithms of $x$. Two points from the line are given below as original, untransformed coordinates.",{x0,y0,x1,nom,den,power},
 P(R`By how much does the logarithm of $x$ increase between these readings? Choose the exact expression.`,1,
 choose(r,[m(R`@log_{10}(${p})`),m(R`@log_{10}(${x1-x0})`),m(R`@log_{10}@left(@dfrac{1}{${p}}@right)`),m(R`@log_{10}(${x1})+@log_{10}(${x0})`)].filter((_,i)=>i!==1||x1-x0!==p),0),
 R`Subtract the logarithms; taking the logarithm of the quotient gives $@log_{10}@left(@dfrac{${x1}}{${x0}}@right)=@log_{10}(${p})$.`),
 P("Find the exact gradient of the line on the transformed plot.",2,A.int(s),
 R`The output ratio is $${fr(nom,y0*den)}=${p}^{${s}}$. Therefore the change in $@log_{10}y$ is $${s}@log_{10}(${p})$. Divide by the change in $@log_{10}x$ to get $${s}$.`),
 P(R`Find the exact factor by which $y$ is multiplied when the original $x$ is multiplied by $${power}$.`,2,A.frac(facn,facd),
 R`A multiplier of $${power}$ for $x$ adds $@log_{10}(${power})$ on the horizontal axis, so it adds $${s}@log_{10}(${power})$ on the vertical axis. The output multiplier is $${power}^{${s}}=${fr(facn,facd)}$.`)),
 ["Original input","Original output"],[[m("x="+x0),m("y="+y0)],[m("x="+x1),m("y="+fr(nom,den))]]);
});

})(typeof window==="undefined"?globalThis:window);
