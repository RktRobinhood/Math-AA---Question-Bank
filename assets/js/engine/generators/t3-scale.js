/* Original geometry and trigonometry practice. */
(function(root){
"use strict";
const E=root.QBEngine,{ans:A,fmt:F}=E;
const {m,frac,br,num,surd,piFrac,sf,deg}=F;
const T=String.raw,D=Math.PI/180;
const vect=v=>T`\left(${v.map(num).join(",\\, ")}\right)`;
const int=A.int,rat=A.frac,calc=x=>A.sf(x), pi=(n,d=1)=>A.exact(Math.PI*n/d,piFrac(n,d)),sqr=n=>A.exact(Math.sqrt(n),surd(n));
const P=(prompt,marks,answer,...working)=>({prompt,marks,answer,working});
const Q=(params,stem,...parts)=>({params,stem,parts});
const fmt=n=>sf(n,3);
const value=x=>m(num(x));
const sh=(slug,title,syllabus,skills,level,build,home="aa-sl",niceOk=false)=>E.register({type:"t3-scale-"+slug,unknown:"solve",representation:"words",format:"value",title,syllabus,skills,home,levels:[level],calculator:level===4,niceOk,source:"original-practice-scale",build});
const AA="aa-hl", AI="ai-sl",H="ai-hl";
sh("endpoint-cable","Recover a cable endpoint from its midpoint",["3.1"],["SL3.1.midpoint-3d","SL3.1.distance-3d"],2,({rng:r})=>{
 const a=r.int(2,7),b=r.int(2,8),c=r.int(2,9),h=r.int(2,6),j=r.int(2,6),k=r.int(2,6),d=4*(a*a+b*b+c*c),z=k-c;
 return Q({a,b,c,h,j,k},T`A straight cable has endpoint $\mathrm A${vect([h+a,j+b,k+c])}$ and midpoint $\mathrm M${vect([h,j,k])}$. Its other endpoint is $\mathrm B$.`,
  P(T`Find the third coordinate of $\mathrm B$.`,2,int(z),T`Double the midpoint coordinate and subtract the given endpoint coordinate: $2(${k})-${k+c}=${z}$.`),
  P("Find the exact total length.",2,sqr(d),T`The cable is twice as long as $[\mathrm{AM}]$, so its exact length is $${surd(d)}$.`));
});
sh("hollow-basin","Infer the thickness of a hemispherical basin",["3.1"],["SL3.1.volume-solids"],4,({rng:r})=>{
 const R=r.int(13,24),k=R-r.int(2,6),v=2*Math.PI*(R**3-k**3)/3;
 const q=F.rat.Q(2*k**3,3),cap=q.d===1?num(q.n):T`\dfrac{${num(q.n)}}{3}`;
 return Q({R,k},T`A hemispherical basin has outside radius $${R}\,\mathrm{cm}$. Its capacity is exactly $${cap}\pi\,\mathrm{cm}^{3}$. Its cavity is hemispherical.`,
  P("Find the wall thickness, in centimetres, measured radially.",2,calc(R-k),T`Set $\dfrac{2\pi r^{3}}{3}=${cap}\pi$. The inner radius is $${k}$, giving thickness $${R}-${k}=${R-k}$.`),
  P("Find the volume of material in the basin, in cubic centimetres.",3,calc(v),T`Subtract the inner hemisphere's volume from the outer one: $\dfrac{2\pi}{3}\left(${R}^{3}-${k}^{3}\right)\approx${fmt(v)}$.`));
});
sh("slant-floor","Separate a sloping strut from its floor projection",["3.1"],["SL3.1.angle-line-plane"],2,({rng:r})=>{
 const k=r.int(2,12);
 return Q({k},T`A strut has length $${2*k}\,\mathrm m$. One end is on a horizontal floor and the other is $${k}\,\mathrm m$ vertically above it.`,
  P("Find the angle between the strut and the floor, in degrees.",2,int(30),T`The angle is between the strut and its horizontal projection. Since $\sin\theta=${frac(1,2)}$, $\theta=30^{\circ}$.`),
  P("Find the exact horizontal projection length, in metres.",2,sqr(3*k*k),T`The projection is the horizontal leg of a right triangle: $\sqrt{${4*k*k}-${k*k}}=${surd(3*k*k)}$.`));
});
sh("ssa-perimeter","Choose the shorter of two possible SSA routes",["3.5","3.2"],["SL3.5.ambiguous-case","SL3.2.sine-rule"],4,({rng:r})=>{
 const b=r.int(14,22),a=b-r.int(2,4),g=r.pick([31,34,37,40,43]),s=b*Math.sin(g*D)/a,B=Math.asin(s)/D,c=a*Math.sin((B-g)*D)/Math.sin(g*D);
 return Q({a,b,g},T`In triangular route $\mathrm{ABC}$, $\mathrm{BC}=${a}\,\mathrm{km}$, $\mathrm{AC}=${b}\,\mathrm{km}$ and $\mathrm{B\hat AC}=${deg(g)}$.`,
  P("Find the larger possible angle at the second vertex, in degrees.",3,calc(180-B),T`The sine rule gives $\sin B=\dfrac{${b}\sin(${deg(g)})}{${a}}$. Both candidates leave a positive third angle; the obtuse one is $${fmt(180-B)}^{\circ}$.`),
  P("Find the shorter route perimeter, in kilometres.",3,calc(a+b+c),T`For each candidate, the angle sum fixes $C$ and the sine rule gives $\mathrm{AB}$. In the obtuse case, $C\approx${fmt(B-g)}^{\circ}$, producing the shorter side $\mathrm{AB}\approx${fmt(c)}$.`,T`Add the sides: the smaller perimeter is approximately $${fmt(a+b+c)}$ kilometres.`));
});
sh("reverse-bearing","Compute the return bearing after two compass legs",["3.3","3.2"],["SL3.3.bearings","SL3.2.cosine-rule-side"],4,({rng:r})=>{
 const a=r.int(7,14),b=r.int(11,20),c=r.pick([125,132,140,148,156]),x=b*Math.sin(c*D),y=a+b*Math.cos(c*D),d=Math.hypot(x,y),g=(Math.atan2(-x,-y)/D+360)%360;
 return Q({a,b,c},T`A survey team walks $${a}\,\mathrm{km}$ due north from camp, then $${b}\,\mathrm{km}$ on a bearing of $${deg(c)}$.`,
  P("Find the direct distance from the team to camp, in kilometres.",3,calc(d),T`The signed east and north components are $${fmt(x)}$ and $${fmt(y)}$ kilometres. Their resultant has length $${fmt(d)}$ kilometres.`),
  P("Find the bearing from the team back to camp, in degrees.",3,calc(g),T`Reverse both components to obtain the return direction. Measure clockwise from north in the resulting quadrant, obtaining $${fmt(g)}^{\circ}$.`));
});
sh("opposite-observers","Locate a mast between two observers",["3.3","3.2"],["SL3.3.two-observations","SL3.2.right-angle"],4,({rng:r})=>{
 const d=r.int(40,84),a=r.pick([25,28,32,34]),b=r.pick([47,51,56,61]),h=d/(1/Math.tan(a*D)+1/Math.tan(b*D)),x=h/Math.tan(a*D);
 return Q({d,a,b},T`Two observers stand $${d}\,\mathrm m$ apart on level ground. A vertical mast has its foot between them on their straight line. Their respective angles of elevation to its top are $${deg(a)}$ and $${deg(b)}$. Ignore eye height.`,
  P("Find the height, in metres.",3,calc(h),T`If the height is $h$, the two ground distances are $\dfrac{h}{\tan(${deg(a)})}$ and $\dfrac{h}{\tan(${deg(b)})}$. They add to $${d}$, so $h\approx${fmt(h)}$.`),
  P("Find the ground distance from the first observer to the mast, in metres.",2,calc(x),T`Evaluate the first ground distance using the unrounded height: $x\approx${fmt(x)}$.`));
});
sh("sector-reverse","Recover a sector radius and angle from area and arc",["3.4"],["SL3.4.sector-two-conditions","SL3.4.sector-area"],3,({rng:r})=>{
 const k=r.int(5,12),l=r.int(4,k+3),n=k*l;
 return Q({l,n},T`A circular sector has arc length $${l}\,\mathrm{cm}$ and area $${frac(n,2)}\,\mathrm{cm}^{2}$.`,
  P("Find its radius, in centimetres.",3,int(k),T`Eliminate $\theta$ from $l=r\theta$ and $A=\dfrac{1}{2}r^{2}\theta$. Then $A=\dfrac{1}{2}rl$, giving $r=${k}$.`),
  P("Find its exact angle, in radians.",2,rat(l,k),T`Use $\theta=\dfrac{l}{r}=${frac(l,k)}$.`));
});
sh("wheel-signed-travel","Separate net wheel rotation from total rim travel",["3.4"],["SL3.4.angular-rate","SL3.4.arc-length"],3,({rng:r})=>{
 const k=r.int(4,14),u=r.int(17,32),v=r.int(5,13);
 return Q({k,u,v},T`A wheel of radius $${k}\,\mathrm{cm}$ rotates $${frac(u,12)}$ turns anticlockwise, then $${frac(v,12)}$ turns clockwise. Its centre stays fixed.`,
  P("Find the exact net anticlockwise angular displacement, in radians.",2,pi(u-v,6),T`Subtract the reversed turn and multiply by $2\pi$: $\theta=${piFrac(u-v,6)}$.`),
  P("Find the exact total distance covered by a marked point on the rim, in centimetres.",3,pi(k*(u+v),6),T`For distance, add the magnitudes of both turns. Multiply the resulting angle in radians by the radius to obtain $${piFrac(k*(u+v),6)}$.`));
});
sh("double-angle-sign","Fix quadrant signs before doubling an angle",["3.6"],["SL3.6.double-angle-values","SL3.6.ratio-from-ratio"],3,({rng:r})=>{
 const [u,v,c]=r.pick([[3,4,5],[5,12,13],[8,15,17],[7,24,25],[20,21,29],[12,35,37]]),swap=r.int(0,1),quadrant=r.int(1,4),given=r.pick(["sin","cos"]);
 const a=(quadrant<=2?1:-1)*(swap?v:u),b=(quadrant===1||quadrant===4?1:-1)*(swap?u:v),s=2*a*b,h=b*b-a*a;
 const label=["first","second","third","fourth"][quadrant-1],missing=given==="sin"?"cos":"sin";
 return Q({a,b,c,quadrant,given},T`Angle $\theta$ is in the ${label} quadrant and $${"\\"+given}\theta=${frac(given==="sin"?a:b,c)}$.`,
  P(T`Find the exact value of $\sin(2\theta)$.`,3,rat(s,c*c),T`Use $\sin^{2}\theta+\cos^{2}\theta=1$ for the magnitude of the missing ratio. The ${label} quadrant fixes its sign, so $${"\\"+missing}\theta=${frac(missing==="sin"?a:b,c)}$. Then $2\sin\theta\cos\theta=${frac(s,c*c)}$.`),
  P(T`Find the exact value of $\cos(2\theta)$.`,2,rat(h,c*c),T`Use $\cos^{2}\theta-\sin^{2}\theta=${frac(h,c*c)}$.`));
});
sh("retained-zero","Keep endpoints and the zero branch when solving",["3.8","3.6"],["SL3.8.factorise-not-divide","SL3.8.compound-angle"],3,({rng:r})=>{
 const k=r.int(2,6),l=r.int(2,7),j=r.int(1,3);
 return Q({k,l,j},T`Consider $${l}\sin(${2*k}\theta)=${l}\sin(${k}\theta)$ for $0\le\theta\le${piFrac(2*j,k)}$.`,
  P("Find the number of distinct solutions.",3,int(4*j+1),T`Divide only by the nonzero constant and factor: $\sin(${k}\theta)\left(2\cos(${k}\theta)-1\right)=0$. Over the given interval the transformed angle makes $${j}$ full turns. There are $${2*j+1}$ sine zeros, including both endpoints, and $${2*j}$ cosine-half values.`),
  P("Find the exact smallest positive solution, in radians.",2,pi(1,3*k),T`The first positive cosine-half angle is $\dfrac{\pi}{3}$. It precedes the first positive sine zero. Divide by $${k}$ to obtain $${piFrac(1,3*k)}$.`));
});
sh("opposed-temperature","Use half-period offsets to combine models",["3.7"],["SL3.7.model-context","SL3.7.transformations","SL3.7.read-features"],3,({rng:r})=>{
 const a=r.int(3,8),b=r.int(9,15),u=r.int(18,25),v=r.int(19,30),d=r.int(2,5);
 return Q({a,b,u,v,d},T`Two rooms have temperatures $U(t)=${u}+${a}\cos\left(\dfrac{\pi t}{${d}}\right)$ and $V(t)=${v}+${b}\cos\left(\dfrac{\pi(t-${d})}{${d}}\right)$ in degrees Celsius, with time $t$ in hours.`,
  P("Find the period of the mean temperature, in hours.",2,int(2*d),T`The second cosine is shifted by half a period and so is the negative of the first cosine. The mean's cosine coefficient is nonzero; its period remains $${2*d}$.`),
  P("Find the exact maximum of the mean temperature.",3,rat(u+v+b-a,2),T`The mean is $\dfrac{${u+v}}{2}-\dfrac{${b-a}}{2}\cos\left(\dfrac{\pi t}{${d}}\right)$.`,T`Its negative cosine coefficient makes its maximum occur at cosine $-1$, giving $${frac(u+v+b-a,2)}$.`));
});
sh("inverse-principal-branch","Reduce an angle to each principal inverse-trig branch",["3.9"],["AHL3.9.inverse-trig-values","AHL3.9.inverse-trig-graphs"],3,({rng:r})=>{
 const n=r.int(1,5),j=r.int(1,4),l=Math.min(n,6-n);
 return Q({n,j},T`Let $\theta=${piFrac(12*j+6+n,6)}$. Give exact answers in radians.`,
  P(T`Find $\arcsin(\sin\theta)$.`,3,pi(-l,6),T`After removing full turns the angle is $\pi+${piFrac(n,6)}$. Match its sine in the interval $-\dfrac{\pi}{2}\le y\le\dfrac{\pi}{2}$ to obtain $${piFrac(-l,6)}$.`),
  P(T`Find $\arccos(\cos\theta)$.`,2,pi(6-n,6),T`Reflect the reduced angle around $\pi$ to enter the cosine principal range $0\le y\le\pi$. The result is $${piFrac(6-n,6)}$.`));
},AA);
sh("compound-rotation","Resolve the difference between unequal angle rotations",["3.10"],["AHL3.10.compound-angle","AHL3.10.exact-value"],3,({rng:r})=>{
 const [a,b,c]=r.pick([[3,4,5],[5,12,13],[8,15,17],[7,24,25]]),[d,e,f]=r.pick([[5,12,13],[12,5,13],[15,8,17],[8,15,17]]),s=a*e+b*d,k=a*d-b*e;
 return Q({a,b,c,d,e,f},T`Angle $U$ is acute with $\sin U=${frac(a,c)}$. Angle $V$ is in the second quadrant with $\sin V=${frac(d,f)}$.`,
  P(T`Find the exact value of $\sin(V-U)$.`,3,rat(s,c*f),T`$\cos U=${frac(b,c)}$ and $\cos V=${frac(-e,f)}$. Use $\sin V\cos U-\cos V\sin U$ to obtain $${frac(s,c*f)}$.`),
  P(T`Find the exact value of $\cos(V-U)$.`,2,rat(k,c*f),T`Use $\cos V\cos U+\sin V\sin U=${frac(k,c*f)}$.`));
},AA);
sh("external-vector-division","Divide a directed segment externally",["3.12"],["AHL3.12.position-displacement","AHL3.12.parallel-vectors"],3,({rng:r})=>{
 const x=r.int(-6,6),y=r.int(-6,6),z=r.int(-6,6),a=r.int(2,8),b=r.int(2,8),c=r.int(2,8),j=r.int(2,5),d=(j-1)**2*(a*a+b*b+c*c);
 return Q({x,y,z,a,b,c,j},T`$\mathrm A${vect([x,y,z])}$ and $\mathrm B${vect([x+a,y+b,z+c])}$ lie on a line. Point $\mathrm C$ is beyond $\mathrm B$ and $\mathrm{AC}:\mathrm{BC}=${j}:${j-1}$.`,
  P(T`Find the third coordinate of $\mathrm C$.`,3,int(z+j*c),T`Let $\overrightarrow{\mathrm{AC}}=k\overrightarrow{\mathrm{AB}}$. The distance ratio gives $\dfrac{k}{k-1}=\dfrac{${j}}{${j-1}}$, so $k=${j}$.`,T`The third coordinate is $${z}+${j}(${c})=${z+j*c}$.`),
  P(T`Find the exact length of $[\mathrm{BC}]$.`,2,sqr(d),T`$\overrightarrow{\mathrm{BC}}$ is $${j-1}$ times $\overrightarrow{\mathrm{AB}}$. Its length is $${surd(d)}$.`));
},AA);
sh("dot-from-resultant","Infer a dot product from resultant length",["3.13"],["AHL3.13.scalar-product-algebra","AHL3.13.scalar-product"],3,({rng:r})=>{
 const a=r.int(3,9),b=r.int(4,10),c=r.int(2,Math.min(a*b-1,18))*r.sign(),s=a*a+b*b+2*c,d=a*a+b*b-2*c;
 return Q({a,b,s},T`Vectors $\boldsymbol u,\boldsymbol v$ have magnitudes $${a}$ and $${b}$. Their sum has magnitude $${surd(s)}$.`,
  P(T`Find $\boldsymbol u\cdot\boldsymbol v$.`,3,int(c),T`Expand $|\boldsymbol u+\boldsymbol v|^{2}=|\boldsymbol u|^{2}+2\boldsymbol u\cdot\boldsymbol v+|\boldsymbol v|^{2}$. Substitute to obtain $\boldsymbol u\cdot\boldsymbol v=${c}$.`),
  P("Find the exact magnitude of their difference.",2,sqr(d),T`The squared difference has the opposite cross term. Its magnitude is $${surd(d)}$.`));
},AA);
sh("nearest-space-line","Project a point onto a line then compute separation",["3.14","3.13"],["AHL3.14.foot-of-perpendicular","AHL3.13.perpendicular-test"],3,({rng:r})=>{
 const a=r.int(2,6),b=r.int(2,6),c=r.int(2,6),j=r.int(2,5),k=r.int(2,5),U=[r.int(-3,6),r.int(-3,6),r.int(-3,6)],d=[a,b,c],V=U.map((u,i)=>u+j*d[i]+k*[b,-a,0][i]),s=k*k*(a*a+b*b);
 return Q({U,d,V},T`A line has vector equation $\boldsymbol r=${vect(U)}+t${vect(d)}$. Point $\mathrm P${vect(V)}$ is outside the line.`,
  P(T`Find the value of $t$ giving the closest point to $\mathrm P$.`,3,int(j),T`The vector from the line point to $\mathrm P$ is perpendicular to the direction vector. Set $\left(${vect(V)}-${vect(U)}-t${vect(d)}\right)\cdot${vect(d)}=0$, giving $t=${j}$.`),
  P("Find the exact shortest distance.",3,sqr(s),T`Substitute $t=${j}$ and take the magnitude of the displacement from that point to $\mathrm P$. It is $${surd(s)}$.`));
},AA);
sh("skew-separation","Prove the shortest distance between two skew lines",["3.15","3.16"],["AHL3.15.skew-distance","AHL3.15.classify-lines","AHL3.16.perpendicular-vector"],3,({rng:r})=>{
 const a=r.int(2,6),b=r.int(2,6),i=r.int(-5,5),j=r.int(-5,5),k=r.int(-5,5),h=r.int(2,8),v=r.int(1,4),w=r.int(1,4);
 const U=[i,j,k],V=[i+v*a+h,j+v*a+w*b-h,k+w*b+h],D=[a,a,0],G=[0,b,b];
 return Q({U,V,D,G},T`Two lines have equations $\boldsymbol r=${vect(U)}+\lambda${vect(D)}$ and $\boldsymbol r=${vect(V)}+\mu${vect(G)}$.`,
  P(T`Find the absolute scalar product of the displacement between the two given base points with $\boldsymbol n=(1,-1,1)$.`,2,int(3*h),T`Subtract the first base point from the second, then take the scalar product with $\boldsymbol n$. The absolute value is $${3*h}$.`),
  P("Find the exact shortest distance between the lines.",3,sqr(3*h*h),T`The vector $\boldsymbol n$ is perpendicular to both direction vectors. Project the base-point displacement onto its direction: the distance is $\dfrac{${3*h}}{\sqrt{3}}=${surd(3*h*h)}$.`,T`The nonzero projected distance confirms that the nonparallel lines are skew.`));
},AA);
sh("slant-projection-area","Compare a slanted triangle with its projected area",["3.16"],["AHL3.16.area-triangle-parallelogram"],3,({rng:r})=>{
 const u=r.int(2,8),v=r.int(2,8),w=r.int(2,8),n=u*u*(v*v+w*w),f=n%4===0?surd(n/4):T`\dfrac{${surd(n)}}{2}`;
 return Q({u,v,w},T`Triangle $\mathrm{OAB}$ has vertices $\mathrm O=(0,0,0)$, $\mathrm A=(${u},0,0)$ and $\mathrm B=(0,${v},${w})$.`,
  P("Find its exact area.",3,A.exact(Math.sqrt(n)/2,f),T`The cross product is $(0,-${u*w},${u*v})$. Half its magnitude is $${f}$.`),
  P(T`Find the exact area of its orthogonal projection onto the $xy$ plane.`,2,rat(u*v,2),T`The projection replaces the third coordinate with zero. Its perpendicular base and height yield area $${frac(u*v,2)}$.`));
},AA);
sh("line-plane-coefficient","Find a missing line coefficient from a known plane crossing",["3.18","3.17"],["AHL3.18.line-meets-plane","AHL3.17.point-in-plane"],3,({rng:r})=>{
 const a=r.int(2,6),b=r.int(2,6),c=r.int(3,8),h=r.int(1,6),i=r.int(1,6),j=r.int(2,5),t=r.int(2,4),u=r.int(1,4),v=r.int(1,4),k=r.int(1,4),s=a*(h+t*u)+b*(i+t*v)+c*(j+t*k);
 return Q({a,b,c,h,i,j,t,u,v,s},T`A plane is $${a}x+${b}y+${c}z=${s}$. A line is $\boldsymbol r=(${h},${i},${j})+\lambda(${u},${v},k)$. The line meets the plane when $\lambda=${t}$.`,
  P(T`Find $k$.`,3,int(k),T`Substitute the three coordinates at $\lambda=${t}$ into the plane. The last term is $${c}(${j}+${t}k)$, giving $k=${k}$.`),
  P("Find the third coordinate of the intersection point.",2,int(j+t*k),T`Substitute in the third coordinate of the line: $z=${j}+${t}(${k})=${j+t*k}$.`));
},AA);
sh("sector-cone-liner","Find the opening and volume of a folded sector",["3.4","3.1"],["AI-SL3.4.sector-cone","SL3.1.volume-solids"],4,({rng:r})=>{
 const s=r.int(7,19),a=r.pick([126,144,162,180,198]),k=s*a/360,h=Math.sqrt(s*s-k*k),v=Math.PI*k*k*h/3;
 return Q({s,a},T`A sector of a circle with radius $${s}\,\mathrm{cm}$ and angle $${deg(a)}$ is bent until its straight sides meet without overlap to form a cone without a base.`,
  P("Find the radius of the circular opening, in centimetres.",2,calc(k),T`The sector arc becomes the cone's base circumference. Thus $2\pi r=\dfrac{${a}}{360}(2\pi)(${s})$, giving $r\approx${fmt(k)}$.`),
  P("Find the cone volume, in cubic centimetres.",4,calc(v),T`The sector radius is the slant height. Pythagoras gives the vertical height $h\approx${fmt(h)}$.`,T`Use unrounded values in $V=\dfrac{1}{3}\pi r^{2}h\approx${fmt(v)}$.`));
},AI);
sh("reflect-voronoi","Reflect a missing Voronoi site across a sloping boundary",["3.6","3.5"],["AI-SL3.6.locate-site","AI-SL3.5.bisector-equation"],3,({rng:r})=>{
 const k=r.int(2,5),x=r.int(2,8),y=r.int(7,15),u=r.int(1,4),v=r.int(2,5),a=x+u*k,b=y-v*k,l=u*x-v*y;
 return Q({a,b,u,v,l},T`The edge between Voronoi sites $\mathrm A(${a},${b})$ and $\mathrm B$ lies on the line $${F.lin(u,0,"x")}-${F.lin(v,0,"y")}=${l}$.`,
  P(T`Find the $x$ coordinate of $\mathrm B$.`,3,int(x-u*k),T`Reflect $\mathrm A$ across the boundary, which is the perpendicular bisector. The perpendicular has direction $(${u},-${v})$ and reaches the line at $(${x},${y})$. Thus the reflected coordinate is $${x-u*k}$.`),
  P(T`Find the $y$ coordinate of $\mathrm B$.`,2,int(y+v*k),T`Use the same midpoint: $2(${y})-${br(b)}=${y+v*k}$.`));
},AI);
sh("voronoi-boundary-tie","Identify a tie from a Voronoi vertex",["3.6"],["AI-SL3.6.vertex","AI-SL3.6.nearest-site"],3,({rng:r})=>{
 const s=r.int(2,7),t=r.int(2,8),x=r.int(-4,9),y=r.int(-4,9),j=r.int(1,2);
 return Q({s,t,x,y,j},T`Three sensors are sites in a Euclidean Voronoi diagram: $\mathrm A(${x},${y})$, $\mathrm B(${x+2*s},${y})$ and $\mathrm C(${x},${y+2*t})$. A reading is taken $${j}$ ${j===1?"unit":"units"} due south of their common vertex.`,
  P(T`Find the $x$ coordinate of that vertex.`,2,int(x+s),T`The vertex is on the perpendicular bisector of $\mathrm A$ and $\mathrm B$, which is $x=${x+s}$.`),
  P("Find the number of sensors tied for shortest distance to the reading.",3,int(2),T`Moving due south stays on the first bisector. It leaves the reading strictly south of the perpendicular bisector $y=${y+t}$ for $\mathrm A$ and $\mathrm C$, so only the first two sensors remain tied.`));
},AI);
sh("composite-matrix-area","Recover an unknown stretch from a composite map's area",["3.9"],["AI-AHL3.9.area-scale-factor","AI-AHL3.9.compose-transformations"],3,({rng:r})=>{
 const a=r.int(2,6),b=r.int(2,6),k=r.int(2,7),S=r.int(3,12),s=a*k*S,x=r.int(1,6),y=r.int(1,6);
 return Q({a,b,S,s,x,y},T`A transformation first multiplies position vectors by $\begin{pmatrix}${a}&${b}\\0&k\end{pmatrix}$ and then rotates through $90^{\circ}$ anticlockwise about the origin. The transformation maps a region of area $${S}$ to one of area $${s}$. Assume $k>0$.`,
  P(T`Find $k$.`,3,int(k),T`The rotation preserves area and the matrix has positive determinant $${a}k$. Hence $${S}(${a}k)=${s}$, giving $k=${k}$.`),
  P(T`Find the first coordinate of the final image of $(${x},${y})$.`,2,int(-k*y),T`The first map sends the point to $(${a*x+b*y},${k*y})$. A positive quarter-turn sends $(u,v)$ to $(-v,u)$, so the required coordinate is $${-k*y}$.`));
},H);
sh("staggered-crossing","Distinguish path intersection from collision with staggered starts",["3.12"],["AI-AHL3.12.meet-or-collide","AI-AHL3.12.position-at-time"],3,({rng:r})=>{
 const u=r.int(2,7),v=r.int(2,7),x=r.int(2,10),y=r.int(3,12),t=r.int(2,5),s=t+r.int(1,4),d=r.int(1,4);
 return Q({u,v,x,y,t,s,d},T`At clock time zero a rover leaves $(${x},${y})$ heading east at $${u}\,\mathrm m\,\mathrm s^{-1}$. At clock time $${d}$ seconds another rover leaves $(${x+u*t},${y-v*s})$ heading north at $${v}\,\mathrm m\,\mathrm s^{-1}$. The coordinates are measured in metres.`,
  P("Find the first rover's clock arrival time at the crossing of the paths, in seconds.",2,int(t),T`The intersection is $(${x+u*t},${y})$. Divide its horizontal displacement by its speed to obtain $${t}$.`),
  P("Find the difference between the rovers' clock arrival times there, in seconds.",3,int(d+s-t),T`The second rover takes $${s}$ seconds after its later start, so arrives at clock time $${d}+${s}=${d+s}$. The paths cross but the rovers arrive $${d+s-t}$ seconds apart.`));
},H);
})(typeof window==="undefined"?globalThis:window);
