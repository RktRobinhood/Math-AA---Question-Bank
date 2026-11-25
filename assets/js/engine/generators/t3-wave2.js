/* Geometry and trigonometry: original bounded generation families. */
(function(root){
"use strict";
const E=root.QBEngine,{ans:A,fmt:F}=E,{frac,surd,sf,num,br}=F;
const T=String.raw, D=Math.PI/180,C=x=>A.sf(x,3), I=x=>A.int(x);
const P=(prompt,marks,answer,...working)=>({prompt,marks,answer,working});
const Q=(params,stem,...parts)=>({params,stem,parts});
const V=(...z)=>T`\left(${z.map(num).join(",\, ")}\right)`;
const S=x=>sf(x,3), M=x=>F.m(String(x));
function add(id,title,home,c,skills,lv,rep,build,extra={}){
 E.register({type:"t3-wave2-"+id,title,home,syllabus:[c],skills:skills.split(" "),levels:[lv],calculator:lv===4,representation:rep,unknown:"result",format:"value",build,...extra});
}
const AA="aa-sl", AH="aa-hl", AI="ai-sl", IH="ai-hl";

add("exact-included-angle","Recover a side, an area and an altitude from one exact angle ratio",AA,"3.2","SL3.2.cosine-rule-side SL3.2.area-sine",3,"equation",({rng:r})=>{
 const a=5*r.int(1,4),b=r.int(6,18),m=r.pick([3,4]),n=7-m,d2=a*a+b*b-2*a*b*m/5, area=a*b*n/10,alt=b*n/5;
 return Q({a,b,m},T`Two sides of a triangle have lengths $${a}$ and $${b}$. The acute angle $\gamma$ between them satisfies $\cos\gamma=${frac(m,5)}$.`,
  P(T`The third side has length $\sqrt{K}$. Find $K$.`,2,I(d2),T`Use the cosine rule. The square of the third side is $${a}^{2}+${b}^{2}-2(${a})(${b})\left(${frac(m,5)}\right)=${d2}$.`,T`The length is $${surd(d2)}$.`),
  P("Find the exact area.",2,A.frac(a*b*n,10),T`Since the angle is acute, its sine is the positive square root of $1-\cos^{2}\gamma$, giving $${frac(n,5)}$.`,T`Use half the product of the two sides and the sine of their included angle: $${frac(a*b*n,10)}$.`),
  P(T`Find the perpendicular height when the side of length $${a}$ is the base.`,1,A.frac(b*n,5),T`Double the area and divide by the base to get $${frac(b*n,5)}$.`));
});
add("balcony-two-objects","Combine one elevation and one depression from the same balcony",AA,"3.3","SL3.3.elevation-depression SL3.3.multi-triangle",3,"words",({rng:r})=>{
 const h=r.int(16,25),a=3*r.int(3,8),b=4*r.int(2,6),p=r.pick([1,2]),q=r.pick([1,2]),e=a*p/3, f=b*q/4, length=(a+b)**2+(e+f)**2;
 return Q({h,a,b,p,q},T`A balcony is $${h}\,\mathrm m$ above a flat courtyard. From the balcony, a light to the east is seen at an angle of elevation whose tangent is $${frac(p,3)}$. A sensor to the west is seen at an angle of depression whose tangent is $${frac(q,4)}$. The two devices lie in the same vertical plane as the observer. Their horizontal distances from the balcony are respectively $${a}$ and $${b}$ metres.`,
  P("Find the height of the light above the courtyard, in metres.",2,I(h+e),T`The light is above the balcony. Its height is $${h}+${a}\left(${frac(p,3)}\right)=${h+e}$.`),
  P("Find the height of the sensor above the courtyard, in metres.",2,I(h-f),T`The sensor is below the balcony. Its height is $${h}-${b}\left(${frac(q,4)}\right)=${h-f}$.`),
  P(T`The straight-line distance between the devices is $\sqrt{K}$ metres. Find $K$.`,2,I(length),T`The horizontal separation is $${a+b}$ and the vertical separation is $${e+f}$. Pythagoras gives $${surd(length)}$.`));
});
add("double-angle-measurement","Use an angle range to recover both readings from a doubled angle",AA,"3.6","SL3.6.double-angle-values SL3.6.ratio-from-ratio",4,"words",({rng:r})=>{
 const n=r.int(27,83),q=n/100, a=(Math.PI-Math.asin(q))/2, c=-Math.sqrt(1-q*q),v=Math.sqrt((1-c)/2);
 return Q({n},T`An instrument has angular setting $\theta$ radians, with $\dfrac{\pi}{4}<\theta<\dfrac{\pi}{2}$. Its first channel reads $\sin(2\theta)=${q}$.`,
  P(T`Find $\cos(2\theta)$ to three significant figures.`,2,C(c),T`The doubled angle is in quadrant two, so the cosine is negative: $-\sqrt{1-${q}^{2}}\approx${S(c)}$.`),
  P(T`Find the value of $\sin\theta$ to three significant figures.`,2,C(v),T`Rearrange $\cos(2\theta)=1-2\sin^{2}\theta$ and take the positive sine: $\sin\theta\approx${S(v)}$.`),
  P(T`Find $\theta$ to three significant figures.`,1,C(a),T`Take the inverse sine of the unrounded value on the allowed acute interval. This gives $${S(a)}$ radians.`));
});
add("phase-threshold-two-times","Solve a weighted sine and cosine model twice in one cycle",AH,"3.10","AHL3.10.compound-angle AHL3.10.solve-equation",4,"equation",({rng:r})=>{
 const a=r.int(2,7),b=r.int(2,8),c=r.pick([.5,1.5,2.5]),R=Math.hypot(a,b), phi=Math.atan2(b,a), d=Math.acos(c/R), x=phi+d,y=phi-d<0?2*Math.PI+phi-d:phi-d;
 const lo=Math.min(x,y),hi=Math.max(x,y);
 return Q({a,b,c},T`A signal is $f(t)=${a}\cos t+${b}\sin t$ for $0\le t<2\pi$. The threshold is $${c}$.`,
  P(T`Find $R>0$ such that $f(t)=R\cos(t-\phi)$ for some acute $\phi$. Give three significant figures.`,2,C(R),T`Expanding the difference gives $R\cos\phi=${a}$ and $R\sin\phi=${b}$. Squaring and adding gives $R\approx${S(R)}$.`),
  P("Find the earlier threshold time, to three significant figures.",2,C(lo),T`The phase is $\phi\approx${S(phi)}$. Solve $\cos(t-\phi)=\dfrac{${c}}{R}$ and keep both angles in the specified cycle. The earlier is $${S(lo)}$.`),
  P("Find the later threshold time, to three significant figures.",2,C(hi),T`Use the other inverse-cosine branch and add a period if needed. The later time is $${S(hi)}$.`));
});
add("reflected-signal-difference","Use reflection symmetry to compare a signal with its mirror",AH,"3.11","AHL3.11.symmetry-relations AHL3.11.simplify-expression",4,"equation",({rng:r})=>{
 const a=r.int(2,9),b=r.int(3,9),c=r.int(1,9)/2, t=Math.acos(c/(2*b)),y=a*Math.sin(t)+b*Math.cos(t);
 return Q({a,b,c},T`Let $f(x)=${a}\sin x+${b}\cos x$ and $g(x)=f(x)-f(\pi-x)$ for $0\le x\le\pi$. Angles are measured in radians.`,
  P("Simplify the expression for $g$.",2,A.self(T`$g(x)=${2*b}\cos x$`),T`In the reflected input, the sine is the same and the cosine changes sign. Subtraction gives $g(x)=${2*b}\cos x$.`),
  P(T`Find the unique $x$ at which $g(x)=${c}$, to three significant figures.`,2,C(t),T`Solve $\cos x=${frac(Math.round(2*c),4*b)}$. Cosine is strictly decreasing on this interval, so $x\approx${S(t)}$ is unique.`),
  P("Find the original value of $f$ at that input, to three significant figures.",1,C(y),T`Evaluate the original sine-plus-cosine expression at the unrounded input to get $${S(y)}$.`));
});
add("force-rail-direction","Distinguish the signed force along a rail from the full force magnitude",AH,"3.13","AHL3.13.scalar-product AHL3.13.angle-between-vectors AHL3.13.scalar-product-algebra",4,"words",({rng:r})=>{
 const x=r.int(3,9),y=r.int(2,7),z=r.int(2,8), a=r.int(6,12),b=r.int(2,5),c=r.int(1,5), s=r.sign(), length=Math.hypot(x,y,z), dot=s*(a*x-b*y+c*z), f=Math.hypot(a,b,c), theta=Math.acos(dot/(length*f))/D;
 return Q({x,y,z,a,b,c,s},T`A straight rail's forward direction is represented by the vector $${V(x,y,z)}$. A force vector in newtons is $${V(s*a,-s*b,s*c)}$.`,
  P("Find the signed component of the force along the rail, to three significant figures.",3,C(dot/length),T`Use the rail's unit direction. The dot product with the given direction is $${dot}$, so dividing by its length gives $${S(dot/length)}$ newtons.`),
  P("Find the angle between the force and the forward direction, in degrees to three significant figures.",2,C(theta),T`Divide that signed component by the full force magnitude to get the cosine. Hence the angle is $${S(theta)}^{\circ}$.`));
});
add("parallel-witness-coordinate","Find the coordinate that rules out coincidence of parallel lines",AH,"3.15","AHL3.15.classify-lines",1,"equation",({rng:r})=>{
 const x=r.int(1,8),y=r.int(1,8),z=r.int(1,8), k=r.int(1,5),a=r.int(1,4),b=r.int(2,5),c=r.int(2,5),g=r.pick([1,2]),d=r.int(1,5);
 const Q0=[x+k*a,y+k*b+(g===1?d:0),z+k*c+(g===2?d:0)], v=[a,b,c];
 const labels=["First coordinate","Second coordinate","Third coordinate"];
 return Q({x,y,z,k,a,b,c,Q0},T`The line $L$ passes through $${V(x,y,z)}$ with direction $${V(...v)}$. A parallel line passes through $${V(...Q0)}$. Compare that point with the point of $L$ that has the same first coordinate.`,
  P("Which coordinate rules out the two lines being the same?",2,A.choice(r,{text:labels[g],value:g},[0,1,2].filter(t=>t!==g).map(t=>({text:labels[t],value:t,why:"Use the first coordinate to fix the parameter before checking the other coordinates."}))),T`The matching first coordinate fixes $t=${k}$. The corresponding point of $L$ is $${V(x+k*a,y+k*b,z+k*c)}$, so only the ${g===1?"second":"third"} coordinate differs.`));
},{format:"mcq"});
add("plane-height-interpolation","Construct a plane from height readings, then interpolate in it",AH,"3.17","AHL3.17.plane-equation AHL3.17.point-in-plane",4,"words",({rng:r})=>{
 const a=r.int(7,15),b=r.int(8,18),c=r.int(15,48)/10,u=r.nonzero(-12,12)/10,v=r.nonzero(-12,12)/10,p=r.int(1,3)/10,q=r.int(4,6)/10,x=Number((a*p).toFixed(4)),y=Number((b*q).toFixed(4)),z=c+u*p+v*q;
 return Q({a,b,c,u,v,p,q},T`A rigid planar test surface has height readings $${V(0,0,c)}$, $${V(a,0,Number((c+u).toFixed(2)))}$ and $${V(0,b,Number((c+v).toFixed(2)))}$. Each triple is $(x,y,z)$. Assume the surface can be written as $z=px+qy+r$.`,
  P("Find the coefficient of $x$ to three significant figures.",2,C(u/a),T`The change in height across the first horizontal direction is $${u}$ over $${a}$ units. Its slope is $${S(u/a)}$.`),
  P("Find the coefficient of $y$ to three significant figures.",2,C(v/b),T`The change in height across the other direction is $${v}$ over $${b}$ units. Its slope is $${S(v/b)}$.`),
  P(T`Find the height at $(x,y)=${V(x,y)}$ to three significant figures.`,2,C(z),T`The intercept is $${c}$. Substitute into the unrounded plane equation to get $z\approx${S(z)}$.`));
});
add("line-plane-parallel-gap","Distinguish disjoint parallelism from a line lying in a plane",AH,"3.18","AHL3.18.line-meets-plane",1,"equation",({rng:r})=>{
 const a=r.int(1,5),b=r.int(1,6),x=r.int(1,5),y=r.int(1,5),s=r.bool(),d=a*x+b*y+(s?0:r.int(1,5));
 const labels=["No common point","Exactly one common point","Every point on the line"];
 return Q({a,b,x,y,d},T`A line passes through $${V(x,y,0)}$ and has direction $${V(b,-a,0)}$. The plane is $${a===1?"":a}x+${b===1?"":b}y=${d}$.`,
  P("Which conclusion holds?",2,A.choice(r,{text:labels[s?2:0],value:s?2:0},[0,1,2].filter(i=>i!==(s?2:0)).map(i=>({text:labels[i],value:i,why:"The substitution cancels the parameter; check the remaining constant."}))),T`The left side stays constant at $${a*x+b*y}$ along the line. ${s?"It equals the plane's constant, so the entire line lies in the plane.":"It differs from the plane's constant, so they have no common point."}`));
},{format:"mcq"});
add("ai-nearest-sensor-switch","Locate where a moving rover switches between two nearest sensors",AI,"3.5","AI-SL3.5.bisector-equation AI-SL3.5.bisector-gradient",4,"words",({rng:r})=>{
 const a=r.int(4,9),b=r.int(4,10),x=r.int(1,3),y=r.int(1,3),u=r.int(4,9)/10,v=r.int(2,8)/10;
 const t=(a*a+b*b-a*x-b*y)/(a*u+b*v), px=x+u*t,py=y+v*t,dd=Math.hypot(px,py);
 const eq=T`$${a}x+${b}y=${a*a+b*b}$`;
 return Q({a,b,x,y,u,v},T`Sensors are at $${V(0,0)}$ and $${V(2*a,2*b)}$. A rover starts at $${V(x,y)}$ and travels on the straight path $x=${x}+${u}t$, $y=${y}+${v}t$, where $t\ge0$.`,
  P("Write the equation of the boundary between the nearer-sensor regions.",2,A.self(eq),T`Square both distances and equate them. The quadratic terms cancel, leaving ${eq}.`),
  P("Find when the two sensors are equally near, to three significant figures.",2,C(t),T`Substitute the rover's coordinates into the boundary equation and solve for time: $t\approx${S(t)}$.`),
  P("Find the distance to either sensor at that moment, to three significant figures.",2,C(dd),T`Use the unrounded time to find the position, then use the distance from the origin. This gives $${S(dd)}$.`));
});
add("ai-exact-reciprocal-tangent","Locate both exact tangent solutions, then recover a signed ratio",IH,"3.8","AI-AHL3.8.tan-quotient AI-AHL3.8.pythagorean-identity AI-AHL3.8.solve-trig-equation",3,"equation",({rng:r})=>{
 const shift=r.int(-5,5)*15, acute=r.pick([30,45,60]), sign=r.sign(), anchor=sign>0?acute:-acute, lo=anchor-shift, hi=lo+180;
 const tex=acute===30?T`\dfrac{\sqrt{3}}{3}`:acute===45?"1":T`\sqrt{3}`;
 const t=shift>0?T`x+${shift}^{\circ}`:shift<0?T`x-${-shift}^{\circ}`:"x";
 const cosSign=-1, cosTex=(cosSign<0?"-":"")+(acute===30?T`\dfrac{\sqrt{3}}{2}`:acute===45?T`\dfrac{\sqrt{2}}{2}`:frac(1,2));
 return Q({shift,acute,sign,anchor},T`Solve $\tan(${t})=${sign<0?"-":""}${tex}$ on the interval $-${shift+90}^{\circ}\le x<${270-shift}^{\circ}$.`,
  P("Find the larger solution, in degrees.",2,I(hi),T`The shifted angle lies from minus ninety degrees up to two hundred and seventy degrees. The relevant larger shifted angle is $${anchor+180}^{\circ}$.`,T`The larger solution for $x$ is $${hi}^{\circ}$.`),
  P("Find the smaller solution, in degrees.",2,I(lo),T`Tangent has period $180^{\circ}$. Subtract a period from the larger solution to get $${lo}^{\circ}$.`),
  P(T`At the larger solution, select the exact value of $\cos(${t})$.`,1,
   A.choice(r,{text:M(cosTex),value:acute},
     [{text:M(cosTex.slice(1)),value:-acute,why:"Check the sign of cosine for the larger angle."},
      ...[30,45,60].filter(z=>z!==acute).map(z=>({text:M(z===30?T`-\dfrac{\sqrt{3}}{2}`:z===45?T`-\dfrac{\sqrt{2}}{2}`:T`-\dfrac{1}{2}`),value:z,why:"Check the reference angle."}))]),
   T`Use the corresponding reference angle and cosine's sign, giving $${cosTex}$.`));
});
add("ai-bipartite-audit","Audit a network whose links must cross between two groups",IH,"3.14","AI-AHL3.14.model-as-graph AI-AHL3.14.vertex-degree AI-AHL3.14.classify-graph",3,"words",({rng:r})=>{
 const a=r.int(3,7),b=r.int(4,10),d=r.int(1,3), n=a+b, full=a*b;
 return Q({a,b,d},T`A network has $${n}$ vertices in two groups. Each vertex in the first group has degree $${b}$, and every pair of vertices in different groups is connected. There are no links within either group. The links are undirected.`,
  P("Find the number of vertices in the first group.",2,I(a),T`A first-group vertex is adjacent to every vertex of the other group. Hence there are $${b}$ in the second group and $${a}$ in the first.`),
  P("Find the number of links.",2,I(full),T`Each of the $${a}$ first-group vertices contributes $${b}$ different links to the other group, giving $${full}$.`),
  P(T`A planner proposes removing $${d}$ links. Find the resulting sum of all vertex degrees.`,1,I(2*(full-d)),T`Each remaining link contributes two to the total degree. The sum is $2(${full-d})=${2*(full-d)}$.`));
});
add("ai-closed-walks-wheel","Subtract the effects of a spur when counting short closed walks",IH,"3.15","AI-AHL3.15.count-walks AI-AHL3.15.read-adjacency-matrix",3,"words",({rng:r})=>{
 const n=r.int(4,11),k=r.int(1,5);
 return Q({n,k},T`A simple undirected graph consists of $${n}$ outer vertices forming a single cycle. Each is joined to a hub $H$. An additional $${k}$ leaf vertices are each joined only to $H$. Let $A$ be the adjacency matrix.`,
  P(T`Find the diagonal entry $(A^{2})_{HH}$.`,2,I(n+k),T`A two-step return goes out to a neighbour and straight back. There are $${n+k}$ neighbours.`),
  P(T`Find the diagonal entry $(A^{3})_{HH}$.`,2,I(2*n),T`A three-step return from the hub traverses an outer-cycle edge between two outer vertices. Each of the $${n}$ outer edges permits both directions, giving $${2*n}$ walks.`),
  P(T`If all the leaves are removed, by how much does $(A^{2})_{HH}$ decrease?`,1,I(k),T`Each removed leaf eliminates one out-and-back walk, so the entry decreases by $${k}$.`));
});

})(typeof window==="undefined"?globalThis:window);
