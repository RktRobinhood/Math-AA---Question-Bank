/* Wave 4: original geometry and trigonometry Practice families. */
(function(root){
"use strict";
const E=root.QBEngine,{ans:A,fmt:F}=E;
const AA="aa-sl",D=Math.PI/180, P=(prompt,marks,answer,...working)=>({prompt,marks,answer,working});
const Q=(stem,params,...parts)=>({stem,params,parts});
const R=(chunks,...values)=>String.raw({raw:chunks},...values).replace(/@/g,"\\");
const n=F.num,s=x=>F.sf(x,3),dec=x=>A.sf(x,3),Fq=F.frac,tex=x=>F.m(String(x));
const add=(id,title,code,skills,level,representation,build)=>E.register({
 type:"w4-t3-"+id,unknown:"result",title,home:AA,syllabus:Array.isArray(code)?code:[code],skills:skills.split(" "),
 levels:[level],calculator:level===4||level===5,format:"value",representation,source:"original-wave-4",build,
});

// 3.8 exact: recover equation data from solution geometry, rather than find roots.
add("two-roots-recover-target","Recover a shifted cosine equation from two known solutions","3.8","SL3.8.solve-basic",2,"equation",({rng:r})=>{
 const c=r.int(12,145),d=r.pick([60,90,120]),a=2*r.int(2,8),b=r.int(9,20),H=b+(d===60?a/2:d===120?-a/2:0);
 return Q(R`For angles in degrees, $${a}@cos(x-c)+${b}=H$ has consecutive solutions $x=${c-d}^{@circ}$ and $x=${c+d}^{@circ}$. Between these two solutions the cosine reaches its maximum at $x=c$ exactly once.`, {a,b,l:c-d,u:c+d},
  P("Find $c$ in degrees.",2,A.int(c),R`The two intersections lie equally far from the cosine peak. The midpoint is $c=${c}^{@circ}$.`),
  P("Find the exact value of $H$.",2,A.int(H),R`Using the right-hand solution gives $H=${a}@cos${d}^{@circ}+${b}=${H}$.`));
});

// 3.8 exact: translation plus endpoint membership, with no general solution required.
add("tangent-endpoint-policy","Distinguish open and closed ends of a shifted tangent solution interval","3.8","SL3.8.solve-basic SL3.8.compound-angle",2,"equation",({rng:r})=>{
 const shift=5*r.int(1,8),sg=r.sign(),base=shift+45*sg,L=base+180*r.int(-2,0),count=r.int(1,3),U=L+180*count,left=r.int(0,1),right=r.int(0,1);
 const m=count-1+left+right;
 // With one period and both ends open, there is no solution; use count only as a valid answer.
 const interval=R`$${L}^{@circ}${left?"@le":"<"} x ${right?"@le":"<"} ${U}^{@circ}$`;
 return Q(R`Consider $@tan(x-${shift}^{@circ})=${sg}$ on ${interval}. Both displayed boundary angles solve the equation, but the inequalities determine whether to count them.`, {shift,sg,L,U,left,right},
  P("How many solutions lie in the stated interval?",2,A.int(m),
    R`Successive solutions are $180^{@circ}$ apart. There are $${count-1}$ strictly inside; ${left?"include":"exclude"} the lower endpoint and ${right?"include":"exclude"} the upper endpoint. The count is $${m}$.`),
  P(R`Move the lower boundary to $${L-30}^{@circ}$ and keep both inequality signs and the upper boundary unchanged. How many solutions are in the new interval?`,2,A.int(count+right),
    R`At the old lower angle, the solution is now strictly inside. No other solution lies in the added $30^{@circ}$, because the next solution to the left is $180^{@circ}$ away. The new count is $${count+right}$.`));
});

// 3.8 technology: model equality produces both feasible and infeasible algebra branches.
add("fundamental-harmonic-crossings","Discard an infeasible cosine level, then track crossings in a shifted interval","3.8","SL3.8.quadratic-in-trig SL3.8.graphical",4,"equation",({rng:r})=>{
 const m=r.int(16,24)/100,d=r.int(26,60)/100,disc=1-8*m*(d-m);
 const u=2*(d-m)/(1+Math.sqrt(disc)),v=(1+Math.sqrt(disc))/(4*m),t=Math.acos(u),last=2*Math.PI+t;
 return Q(R`Two signals are $f(x)=@cos x$ and $g(x)=${n(d)}+${n(m)}@cos(2x)$ on $-@pi@le x@le3@pi$. All angles are in radians.`, {m,d},
  P(R`Set $f(x)=g(x)$ and write a quadratic equation in $u=@cos x$.`,2,A.self(R`$${n(2*m)}u^2-u+${n(d-m)}=0$`),
   R`Substitute $@cos(2x)=2u^2-1$ and move all terms to one side.`),
  P("Find the value of $u$ that can correspond to a crossing, to three significant figures.",2,dec(u),
   R`The quadratic roots are approximately $${s(u)}$ and $${s(v)}$. Reject the second because no cosine exceeds $1$.`),
  P("Find the greatest crossing angle, to three significant figures.",2,dec(last),
   R`With the unrounded $u$, put $t=@arccos u$. Candidates in the interval are $-t$, $t$, $2@pi-t$ and $2@pi+t$. The greatest is $${s(last)}$ radians.`));
});

// 3.8 technology: unsigned error requires two signs and gives separate solution branches.
add("unsigned-signal-tolerance","Choose both branches of an unsigned trig tolerance","3.8","SL3.8.graphical SL3.8.solve-basic",4,"words",({rng:r})=>{
 const a=r.int(28,47)/10, d=r.int(2,8)/10, h=d+r.int(6,11)/10, hi=(d+h)/a,lo=(d-h)/a, p=Math.asin(hi),q=2*Math.PI+Math.asin(lo);
 // The amplitude chosen here is strictly larger than both levels, including at max d/h.
 return Q(R`A position indicator shows $y(t)=${n(a)}@sin t$ for $0@le t<2@pi$, in radians. Its reference level is $${n(d)}$. The indicator flags whenever the absolute difference between the reading and the reference equals $${n(h)}$.`, {a,d,h},
  P("Write the two signed reading levels which would trigger the flag.",2,A.self(R`$${n(d-h)}$ and $${n(d+h)}$`),
   R`The absolute difference ignores sign: the signed difference is $-${n(h)}$ or $${n(h)}$. Add the reference to both.`),
  P("How many times does the indicator flag during this interval?",1,A.int(4),
   "Each signed reading lies strictly between the extrema and is nonzero. A full cycle meets each of those distinct levels twice."),
  P("Find the first flag time, to three significant figures.",2,dec(p),
   R`The earlier positive-level crossing solves $@sin t=${Fq(Math.round(10*(d+h)),Math.round(10*a))}$ before $@dfrac{@pi}{2}$. It is at $${s(p)}$.`),
  P("Find the last flag time, to three significant figures.",2,dec(q),
   R`The later negative-level crossing is above $@dfrac{3@pi}{2}$ and below $2@pi$. Use $2@pi+@arcsin@left(${Fq(Math.round(10*(d-h)),Math.round(10*a))}@right)@approx${s(q)}$.`));
});

add("double-angle-recover-signed-ratio","Recover a signed ratio from a same-angle and doubled-angle signal","3.6","SL3.6.double-angle-values SL3.6.ratio-from-ratio",2,"equation",({rng:r})=>{
 const [a,b,c]=r.pick([[3,4,5],[5,12,13],[8,15,17],[7,24,25],[20,21,29],[12,35,37]]);
 const sg=r.sign(),tg=r.sign(),flip=r.int(0,1),v=flip?b:a,w=flip?a:b;
 return Q(R`A signal gives $@sin@theta=${Fq(sg*v,c)}$ and $@sin(2@theta)=${Fq(sg*tg*2*v*w,c*c)}$.`, {numerator:sg*v,den:c,n2:sg*tg*2*v*w},
  P(R`Find $@cos@theta$ exactly, including its sign.`,2,A.frac(tg*w,c),R`Divide the doubled sine by $2@sin@theta$, using $@sin(2@theta)=2@sin@theta@cos@theta$. This gives $${Fq(tg*w,c)}$.`),
  P(R`Find $@cos(2@theta)$ exactly.`,2,A.frac(w*w-v*v,c*c),R`Use $@cos^2@theta-@sin^2@theta=${Fq(w*w-v*v,c*c)}$. The first powers could be negative, but the squares are not.`));
});

add("double-angle-interval-compatibility","Use the doubled-cosine interval to check two measurement channels","3.6","SL3.6.double-angle-values SL3.6.ratio-from-ratio",4,"words",({rng:r})=>{
 const a=r.int(21,69)/100,b=a+r.int(13,26)/100,lo=1-2*b*b,hi=1-2*a*a,ok=r.int(0,1);
 const y=ok?Math.round((lo+hi)*500)/1000:Math.round((hi+.061)*1000)/1000;
 return Q(R`One measurement channel restricts $@sin@theta$ to the interval $[${n(a)},${n(b)}]$. A second channel reports $@cos(2@theta)=${n(y)}$. Treat the given readings as exact when checking compatibility.`, {a,b,y},
  P(R`Find the least possible value of $@cos(2@theta)$, to three significant figures.`,2,dec(lo),
   R`Write $@cos(2@theta)=1-2@sin^2@theta$. All permitted sine values are positive, so the least doubled cosine uses the greatest sine value, $${n(b)}$. The result is $${s(lo)}$.`),
  P(R`Find the greatest possible value of $@cos(2@theta)$, to three significant figures.`,2,dec(hi),
   R`The greatest doubled cosine uses $@sin@theta=${n(a)}$, giving $${s(hi)}$.`),
  P("Are the reported readings compatible? Justify your conclusion.",1,A.self(ok?"Yes, they are compatible.":"No, they are incompatible."),
   R`Compare the second reading with the full unrounded interval. It is ${ok?"inside":"above"} that interval, so the two readings ${ok?"can":"cannot"} come from the same angle.`));
});

add("annular-ribbon-from-two-edges","Use the difference in two curved edge lengths to recover an annular sector","3.4","SL3.4.arc-length SL3.4.sector-area",4,"words",({rng:r})=>{
 const e=r.int(27,50)/10,J=r.int(86,147)/10,d=r.int(23,51)/10,K=J+d,T=d/e,r0=J/T,area=(J+K)*e/2;
 return Q(R`A curved strip is the part of a sector between two concentric circular arcs. The radial width is $${n(e)}$ centimetres. The inner arc is $${n(J)}$ centimetres long and the outer arc is $${n(K)}$ centimetres long. The two arcs have the same central angle.`, {e,J,K},
  P("Find the central angle in radians, to three significant figures.",2,dec(T),
   R`Subtracting the two equations $s=r@theta$ cancels the inner radius. Divide the arc-length difference by the radial width to get $@theta@approx${s(T)}$.`),
  P("Find the inner radius in centimetres, to three significant figures.",2,dec(r0),
   R`Use the unrounded central angle and the inner arc: $r_{@text{inner}}=@dfrac{${n(J)}}{@theta}@approx${s(r0)}$.`),
  P("Find the strip area in square centimetres, to three significant figures.",2,dec(area),
   R`Subtract the inner sector area from the outer sector area. Factoring the difference of two squares gives the mean of the two arc lengths multiplied by their radial separation: $A@approx${s(area)}$.`));
});

add("two-overlapping-circular-sweeps","Combine two unequal segments to measure an overlap",["3.4","3.2"],"SL3.4.sector-area SL3.4.segment-shaded SL3.2.cosine-rule-angle",5,"words",({rng:r})=>{
 const a=r.int(8,15),b=a+r.int(3,6),d=Math.floor(.68*(a+b))+r.int(0,2),al=2*Math.acos((a*a+d*d-b*b)/(2*a*d)),be=2*Math.acos((b*b+d*d-a*a)/(2*b*d));
 const L=a*a*(al-Math.sin(al))/2+b*b*(be-Math.sin(be))/2,portion=100*L/(Math.PI*a*a);
 return Q(R`Two circular scanners cover disks of radii $${a}$ and $${b}$ metres on level ground. The centres of the disks are $${d}$ metres apart. The scanners reach every point in their respective disks. The two points at which the disk boundaries intersect are $P$ and $Q$. Use three significant figures for numerical answers, keeping full precision for subsequent parts.`, {a,b,d},
  P("Find the smaller angle subtended by chord $PQ$ at the centre of the smaller disk, in radians.",2,dec(al),
   R`Join one intersection to the two centres. The triangle has sides $${a}$, $${b}$ and $${d}$. The cosine rule gives half the required angle; doubling gives $${s(al)}$ radians.`),
  P("Find the smaller angle subtended by the same chord at the other centre, in radians.",2,dec(be),
   R`Apply the same cosine rule at the centre of the larger disk instead, then double that angle. The result is $${s(be)}$ radians.`),
  P("Calculate the area covered by both scanners, in square metres.",3,dec(L),
   R`The overlap consists of one circular segment from each disk. For radius $r$ and its angle $u$ in radians, subtract triangle from sector: $A=@dfrac{r^{2}}{2}(u-@sin u)$. Add the two segment areas to get $${s(L)}$.`),
  P("What percentage of the smaller scanner’s coverage is not reached by the larger scanner?",2,dec(100-portion),
   R`Divide the overlap by the full smaller disk area, $${a}^{2}@pi$, and subtract the percentage from $100@%$. This gives $${s(100-portion)}@%$.`));
});

add("fraction-turn-to-degrees","Read the degrees in a proper fraction of one turn","3.4","SL3.4.arc-length",0,"words",({rng:r})=>{
 const d=r.pick([5,8,9,10,12,15,18,20,24]),u=r.int(1,d-1);
 return Q(R`A wheel rotates through $${Fq(u,d)}$ of one full turn.`, {u,d},
  P("How many degrees does it rotate through?",1,A.int(360*u/d),
   R`A full turn is $360^{@circ}$. Multiply by $${Fq(u,d)}$ to get $${360*u/d}^{@circ}$.`));
});

add("quarter-cycle-model-direction","Use table order to recover the sign and period of a sine model","3.7","SL3.7.read-features SL3.7.model-context",2,"table",({rng:r})=>{
 const q=r.int(2,8),m=r.int(12,27),b=r.int(3,9)*r.sign(),shift=r.int(1,8);
 const obj=Q(R`A periodic measurement has model $y=d+a@sin@left(@dfrac{2@pi(t-${shift})}{T}@right)$, where $T>0$. The successive rows below are a midline, the next extremum, and the next midline.`, {q,m,b,shift},
  P("Find the period $T$.",2,A.int(4*q),R`The two stated midline crossings have one extremum between them, so they are half a period apart. The period is $${4*q}$.`),
  P("Find the signed coefficient $a$.",2,A.int(b),
   R`At the first extremum, the sine has advanced by a quarter cycle and is $1$. Subtract the midline $${m}$ from the next observation to get $a=${b}$.`));
 return {...obj,table:{head:["Time", "Measurement"],rows:[[tex(shift),tex(m)],[tex(shift+q),tex(m+b)],[tex(shift+2*q),tex(m)]]}};
});

add("compass-turn-wrap","Normalize a clockwise compass turn across north","3.3","SL3.3.bearings",0,"words",({rng:r})=>{
 const start=r.int(311,353),ending=r.int(4,46),sweep=360-start+ending;
 return Q(R`A camera starts pointing at a bearing of $${start}^{@circ}$ and rotates clockwise by $${sweep}^{@circ}$. Bearings are measured clockwise from north and reset to zero after a full turn.`, {start,sweep},
  P("Find the final bearing in degrees. Use three digits when you write a bearing.",1,A.int(ending,{display:tex(R`${String(ending).padStart(3,"0")}^{@circ}`)}),
   R`The total is $${start}+${sweep}=${360+ending}$ degrees. Subtract a full turn. Write the bearing as $${String(ending).padStart(3,"0")}^{@circ}$.`));
});
})(typeof window==="undefined"?globalThis:window);
