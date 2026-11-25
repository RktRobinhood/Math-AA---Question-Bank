/* Wave 6 original AI HL Topic 1: rational powers, log laws and complex numbers. */
(function(g){"use strict";
const E=g.QBEngine,{ans:A,fmt:F}=E,{num,frac,sf}=F,T=String.raw;
const N=x=>T`$${num(x)}$`,P=(prompt,marks,answer,...working)=>({prompt,marks,answer,working});
const Q=(params,stem,parts)=>({params,stem,parts});
const C=(r,k,o)=>{const list=o.map(([value,text])=>({value,text}));return A.choice(r,list.find(x=>x.value===k),list.filter(x=>x.value!==k));};
const add=(slug,title,code,level,rep,tags,build)=>{const prefix="AI-AHL"+code+".";return E.register({type:"w6-number-"+slug,title,home:"ai-hl",syllabus:[code],levels:[level],unknown:"reason",representation:rep,format:"value",skills:tags.split(" ").map(x=>prefix+x),source:"original-wave6",calculator:level===4,build});};
const cx=(a,b)=>num(a)+(b<0?" - ":" + ")+num(Math.abs(b))+T`\mathrm{i}`;

add("power-identity-backsolve","Recover a missing exponent from equality at every positive input","1.10",3,"equation","simplify-algebraic roots-as-powers evaluate-numerical",({rng:r})=>{
 const p=r.int(2,7),q=r.int(3,5),d=r.int(1,5),k=3*q-d,m=k-2*p;
 return Q({p,q,d},T`For every $x>0$, two procedures produce the same number: $x^{\frac{m}{6}}\sqrt[3]{x^{${p}}}=\dfrac{\sqrt{x^{${q}}}}{x^{${frac(d,6)}}}$.`,[
 P("Write the right side as an exact single power of $x$. Enter its exponent.",2,A.frac(k,6),T`The square root gives exponent $${frac(q,2)}$. Subtract $${frac(d,6)}$ when dividing: $${frac(k,6)}$.`),
 P("Find the missing integer $m$.",2,A.int(m),T`The left side has exponent $\dfrac{m+${2*p}}{6}$. Equate the two exponents to get $m=${num(m)}$.`),
 P("Find their common output at $x=64$.",1,A.int(2**k),T`Since $64=2^{6}$, substitute into the combined power to get $2^{${k}}$.`)
 ]);
});
add("power-fourth-root-filter","Solve a hidden quadratic and reject an invalid fourth-root branch","1.10",3,"equation","roots-as-powers evaluate-numerical",({rng:r})=>{
 const a=r.int(2,5),b=a+r.int(2,6),c=b-a,k=a*b;
 return Q({a,b},T`Consider $x^{\frac{1}{2}}+${c}x^{\frac{1}{4}}=${k}$ for $x\geq 0$. A substitution $u=x^{\frac{1}{4}}$ turns it into a quadratic.`,[
 P("Find its larger root in $u$.",2,A.int(a),T`$u^2+${c}u-${k}=(u-${a})(u+${b})$. The larger root is $${a}$.`),
 P("Why must the smaller root in $u$ be rejected?",1,C(r,"domain",[["domain","The principal fourth root is nonnegative."],["quadratic","A real quadratic cannot have a negative root."],["power","Raising a negative root to the fourth power gives a negative value."]]),T`The smaller root is $${-b}$, but $u$ is the principal fourth root, so $u\geq 0$.`),
 P("Find the solution for $x$.",2,A.int(a**4),T`Raise the admissible root to the fourth power: $${a}^{4}=${a**4}$.`)
 ]);
});
add("power-competing-crossover","Find a whole-number switch between two opposite fractional-power responses","1.10",4,"words","evaluate-numerical simplify-algebraic",({rng:r})=>{
 const a=r.int(13,24)/10,b=r.int(162,319)/10,x0=r.int(3,6),cross=(b/a)**(6/7),minimum=Math.floor(cross)+1;
 return Q({a,b,x0},T`A test setting $x>0$ produces readings $A(x)=${num(a)}x^{\frac{2}{3}}$ and $B(x)=${num(b)}x^{-\frac{1}{2}}$. Give noninteger numerical answers to $3$ significant figures.`,[
 P(T`Find the ratio $\dfrac{A(${x0})}{B(${x0})}$.`,2,A.sf((a/b)*x0**(7/6)),T`Dividing the powers gives $x^{\frac{2}{3}+\frac{1}{2}}=x^{\frac{7}{6}}$. Evaluate the ratio at the stated setting.`),
 P("Find the setting at which the two readings are equal.",3,A.sf(cross),T`Solve $x^{\frac{7}{6}}=\dfrac{${num(b)}}{${num(a)}}$ by raising to the power $\dfrac{6}{7}$. The crossover is about $${sf(cross)}$.`),
 P("Find the smallest positive whole-number setting where $A$ is strictly greater than $B$.",2,A.int(minimum),T`The ratio increases with $x$. Use the first integer strictly above the unrounded crossover: $${minimum}$.`)
 ]);
});
add("power-geometric-cancellation","Cancel setting drift by multiplying two power responses","1.10",4,"words","evaluate-numerical simplify-algebraic roots-as-powers",({rng:r})=>{
 const a=r.int(43,96)/10,b=r.int(103,181)/10,x=r.int(23,58)/10,k=r.int(11,39),[p,q]=r.pick([[2,3],[3,4],[5,6]]);
 const ax=a*x**(p/q),stable=Math.sqrt(a*b),delta=100*((1+k/100)**(p/q)-1);
 return Q({a,b,x,k,p,q},T`Two sensors report $A=${num(a)}x^{\frac{${p}}{${q}}}$ and $B=${num(b)}x^{-\frac{${p}}{${q}}}$ for an uncontrolled setting $x>0$. A combined reading is defined as $G=\sqrt{AB}$. Give numerical answers to $3$ significant figures.`,[
 P(T`Find sensor A's reading when $x=${num(x)}$.`,2,A.sf(ax),T`Substitute and evaluate the positive fractional power to get $${sf(ax)}$.`),
 P("Find the combined reading, simplifying the powers before calculating.",2,A.sf(stable),T`In the product the exponents add to zero, so $G=\sqrt{${num(a)}\times ${num(b)}}$ for every setting.`),
 P(T`Find the percentage increase in A alone if the setting rises by $${k}\%$.`,2,A.sf(delta),T`The setting factor is $${num(1+k/100)}$; raise it to $\dfrac{${p}}{${q}}$, subtract $1$, and multiply by $100$. The combined reading does not change.`)
 ]);
});
add("log-identity-weight","Determine a log weight from an identity, then quantify the residual","1.9",2,"equation","expand combine",({rng:r})=>{
 const k=r.int(2,5),d=r.int(2,4),m=r.int(2,6),p=k*d+m,a=r.int(2,7),b=r.int(2,3);
 return Q({k,d,m,p,a,b},T`For all $x>0$, $\ln(${a}x^{${p}})-k\ln(x^{${d}})=\ln(${a})+${m}\ln(x)$.`,[
 P("Find the constant $k$.",2,A.int(k),T`Expand the first logarithm. The coefficient of $\ln(x)$ on the left is $${p}-${d}k$, so it equals $${m}$.`),
 P(T`By how much does the whole expression increase when $x$ is multiplied by $${b}$? Write the increase as $\ln(R)$ and enter $R$.`,2,A.int(b**m),T`The $\ln(x)$ increase is $\ln(${b})$. Multiply by $${m}$, then use the power law to put the multiplier inside the logarithm.`)
 ]);
});
add("log-average-missing-input","Recover a missing reading from the mean of three logs","1.9",2,"words","combine solve-equation",({rng:r})=>{
 const c=12*r.int(1,6),p=r.pick([2,3,4]),q=r.pick([2,3,4]),a=c/p,b=c/q;
 return Q({c,a,b},T`A display reports the arithmetic mean of the natural logarithms of three positive readings. The display is exactly $\ln(${c})$. Two of the original readings are $${a}$ and $${b}$.`,[
 P("Find the product of all three original readings.",2,A.int(c**3),T`The sum of the three logs is $3\ln(${c})$. After combining the logarithms and exponentiating, the product is $${c}^{3}$.`),
 P("Find the missing reading.",2,A.int(c*p*q),T`Divide the product by $${a}\times ${b}$ to obtain $${c*p*q}$.`)
 ]);
});
add("conjugate-reflection-components","Read the component and distance effects of conjugate reflection","1.12",1,"equation","conjugate argand-diagram modulus-argument",({rng:r})=>{
 const x=r.nonzero(-9,9),y=r.nonzero(-9,9);
 return Q({x,y},T`The point for $z=${cx(x,y)}$ is reflected across the real axis to make $w$.`,[
 P("Write down the imaginary part of $w$.",1,A.int(-y),T`Conjugation reverses the sign of the imaginary component, giving $${-y}$.`),
 P("What happens to its modulus?",1,C(r,"equal",[["equal","It stays the same."],["double","It doubles."],["opposite","It changes sign."]]),"Reflection preserves distance from the origin.")
 ]);
});
add("conjugate-mix-reverse","Undo an unequal mix of a complex number and its conjugate","1.12",3,"equation","equate-parts conjugate arithmetic",({rng:r})=>{
 const a=r.int(2,9),b=r.int(1,a-1),x=r.nonzero(-8,8),y=r.nonzero(-8,8),u=(a+b)*x,v=(a-b)*y;
 return Q({a,b,u,v},T`A complex number $z=x+y\mathrm{i}$ satisfies $${a}z+${b}\overline z=${cx(u,v)}$.`,[
 P("Find the real component $x$.",2,A.int(x),T`The real component on the left is $(${a}+${b})x$, which equals $${num(u)}$.`),
 P("Find the imaginary component $y$.",2,A.int(y),T`The imaginary component on the left is $(${a}-${b})y$, which equals $${num(v)}$.`),
 P(T`Find $z\overline z$.`,1,A.int(x*x+y*y),T`Multiplication by the conjugate gives $x^{2}+y^{2}$.`)
 ]);
});
add("complex-circle-row","Recover a complex point from a distance and an imaginary component","1.12",4,"equation","modulus-argument equate-parts argand-diagram",({rng:r})=>{
 const a=r.nonzero(-6,8),b=r.int(2,8),delta=r.int(8,17),radius=r.int(27,63),v=b+delta/10,R=radius/10,h=Math.sqrt(radius*radius-delta*delta)/10,x=a-h,angle=Math.atan2(v,x);
 return Q({a,b,v,R},T`On an Argand diagram, $z$ is at distance $${num(R)}$ from $w=${cx(a,b)}$. The imaginary part of $z$ is $${num(v)}$. Of the two possible points, take the one with the smaller real part. Use $3$ significant figures and radians.`,[
 P("Find the magnitude of the horizontal separation of $z$ and $w$.",2,A.sf(h),T`Use $|z-w|^2=(\Re z-(${num(a)}))^2+(${num(delta/10)})^2$. The horizontal separation is the positive square root of the remaining difference.`),
 P("Find the real part of $z$.",2,A.sf(x),T`The smaller coordinate is the centre's real coordinate minus the horizontal separation: $${sf(x)}$.`),
 P("Find the principal argument of $z$.",2,A.sf(angle),T`Use the unrounded coordinate and the given imaginary component in the correct half-plane. The principal argument is $${sf(angle)}$ radians.`)
 ]);
});
add("polar-cancel-vertical","Choose a polar magnitude so two phasors have a real sum","1.13",2,"equation","polar-to-cartesian geometric-interpretation",({rng:r})=>{
 const a=r.int(2,18),e=r.pick([-1,1]),ma=e<0?"-":"",mb=e>0?"-":"";
 return Q({a,e},T`Let $z=${a}\mathrm{e}^{${ma}\frac{\pi}{3}\mathrm{i}}$ and $w=r\mathrm{e}^{${mb}\frac{\pi}{6}\mathrm{i}}$, where $r>0$. Their sum is real. You may use $\sin\left(\frac{\pi}{6}\right)=\cos\left(\frac{\pi}{3}\right)=\dfrac{1}{2}$ and $\sin\left(\frac{\pi}{3}\right)=\cos\left(\frac{\pi}{6}\right)=\dfrac{\sqrt{3}}{2}$.`,[
 P(T`Write $r$ as $k\sqrt{3}$. Find $k$.`,2,A.int(a),T`The imaginary components point in opposite directions. Their magnitudes are $\dfrac{${a}\sqrt{3}}{2}$ and $\dfrac{r}{2}$. Equate them.`),
 P("Find the real sum $z+w$.",2,A.int(2*a),T`The real parts are $\dfrac{${a}}{2}$ and $\dfrac{r\sqrt{3}}{2}$. Their sum is $${2*a}$.`)
 ]);
});
add("polar-ordered-map-inverse","Undo a rotation and translation, then quantify an order error","1.13",3,"equation","geometric-interpretation multiply-divide-powers",({rng:r})=>{
 const a=r.nonzero(-7,7),b=r.nonzero(-7,7),u=r.nonzero(-12,12),v=r.nonzero(-12,12),e=r.pick([-1,1]);
 const z=[e*(v-b),-e*(u-a)];
 return Q({a,b,u,v,e},T`A point $z$ is first rotated about the origin by multiplication by $\mathrm{e}^{${e<0?"-":""}\frac{\pi}{2}\mathrm{i}}$, then translated by adding $${cx(a,b)}$. The image is $${cx(u,v)}$.`,[
 P("Find the real part of the original $z$.",2,A.int(z[0]),T`Subtract the translation first, then undo the rotation with the opposite quarter-turn. This gives real part $${num(z[0])}$.`),
 P("Find the imaginary part of the original $z$.",1,A.int(z[1]),T`The same inverse quarter-turn gives imaginary part $${num(z[1])}$.`),
 P("Instead translate this original point first and then rotate. Find the squared distance between the two images.",3,A.int(2*(a*a+b*b)),T`The images differ by the translation vector rotated through a quarter-turn minus the original translation vector. These two equal-length vectors are perpendicular. The squared distance is $2((${num(a)})^{2}+(${num(b)})^{2})$.`)
 ]);
});
add("polar-inverse-wave-compensation","Design the missing sinusoid to obtain a specified resultant","1.13",4,"words","sum-sinusoids cartesian-to-polar polar-to-cartesian",({rng:r})=>{
 const A0=r.int(24,97)/10,B=r.int(26,105)/10,a=r.int(3,13)/10,b=-r.int(3,12)/10,w=r.int(2,8);
 const X=A0*Math.cos(a)-B*Math.cos(b),Y=A0*Math.sin(a)-B*Math.sin(b),c=Math.hypot(X,Y),p=Math.atan2(Y,X);
 return Q({A0,B,a,b,w},T`A signal $${num(B)}\sin(${w}t-${num(-b)})$ is already present. Add one signal $C\sin(${w}t+\phi)$ with $C>0$ and $-\pi<\phi\leq\pi$ so that the resultant is $${num(A0)}\sin(${w}t+${num(a)})$. Use radians and $3$ significant figures.`,[
 P(T`Find the imaginary part of the added signal's complex coefficient after factoring out $\mathrm{e}^{${w}t\mathrm{i}}$.`,2,A.sf(Y),T`Subtract the two complex coefficients, target minus existing. Its imaginary part is $${num(A0)}\sin(${num(a)})-${num(B)}\sin(${num(b)})$.`),
 P("Find $C$.",2,A.sf(c),T`Use the modulus of that difference, about $${sf(c)}$. Do not subtract amplitudes directly.`),
 P("Find $\\phi$.",2,A.sf(p),T`With the unrounded real and imaginary components, find the argument of the difference in the specified interval.`)
 ]);
});
})(typeof window==="undefined"?globalThis:window);
