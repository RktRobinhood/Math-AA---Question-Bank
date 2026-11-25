/* Wave 2: original numbers and algebra practice, with native marking. */
(function(root) {
"use strict";
const E=root.QBEngine,{ans,fmt}=E,{num,frac,lin,signed,poly,piFrac}=fmt;
const {abs,sign}=Math;
const M=s=>`$${s}$`,N=x=>M(num(x)),F=(a,b)=>M(frac(a,b));
const P=(prompt,marks,answer,working)=>({prompt,marks,answer,working});
const Q=(params,stem,parts,extra={})=>({params,stem,parts,...extra});
const tb=(head,rows)=>({head,rows});
E.registerAll({}, [{"type": "t1-w2-ratio-interval-endpoints", "home": "ai-sl", "unknown": "ratio-interval-endpoints", "representation": "words", "format": "value", "syllabus": ["1.6"], "levels": [3], "skills": ["AI-SL1.6.write-bounds", "AI-SL1.6.bounds-of-calculation"], "calculator": false, "title": "Bound the ratio of two rounded measurements", "source": "ai-sl-2026-may-tz3-p2-q04.b",build({rng}){
const n=rng.int(2,5),d=rng.int(5,8),A=2*n,B=2*d;
return Q({A,B},`A display gives ${N(A)} units for the length of one part and ${N(B)} units for another, each rounded to the nearest two units. Divide the first actual length by the second to obtain $R$.`,[
 P("Write down the lower bound of the first length.",1,ans.int(A-1),[`The half-step is one unit, giving ${N(A-1)}.`]),
 P("Find the lower bound for $R$. Give an exact answer.",2,ans.frac(A-1,B+1),[`For the lower bound, divide the lower numerator endpoint by the upper denominator endpoint: ${F(A-1,B+1)}.`]),
 P("Find the upper bound for $R$. Give an exact answer.",2,ans.frac(A+1,B-1),[`For the upper bound, reverse the endpoint choices: ${F(A+1,B-1)}.`])
]);
}}]);
E.registerAll({}, [{"type": "t1-w2-amortisation-statement-order", "home": "ai-sl", "unknown": "amortisation-statement-order", "representation": "table", "format": "value", "syllabus": ["1.7"], "levels": [3], "skills": ["AI-SL1.7.outstanding-balance", "AI-SL1.7.total-interest"], "calculator": false, "title": "Read the interest, principal reduction and balance from a loan statement", "source": "ai-sl-2025-may-tz1-p2-q02.d",build({rng}){
const B=100*rng.int(12,42), interest=rng.int(8,29), principal=rng.int(22,55), pay=interest+principal, C=B-principal, extra=rng.int(18,37);
const table=tb(["Item","Amount in euros"],[["Opening balance",N(B)],["Regular payment",N(pay)],["Closing balance",N(C)]]);
return Q({B,pay,C,extra},`The table records one loan period. Interest is added to the opening balance before the payment. An additional payment of ${N(extra)} euros is then made at the end of the same period, with no further interest or fees.`,[
 P("How much of the regular payment reduced the principal, in euros?",2,ans.int(principal),[`The difference between balances is the principal reduction: $${B}-${C}=${principal}$.`]),
 P("Find the interest charged in this period, in euros.",2,ans.int(interest),[`The regular payment also paid the interest. Subtract the principal reduction: $${pay}-${principal}=${interest}$.`]),
 P("Find the balance after the additional payment, in euros.",2,ans.int(C-extra),[`Apply the extra payment to the closing balance, giving $${C}-${extra}=${C-extra}$.`])
],{table});
}}]);
E.registerAll({}, [{"type": "t1-w2-validate-gdc-solutions-in-context", "home": "ai-sl", "unknown": "validate-gdc-solutions-in-context", "representation": "table", "format": "value", "syllabus": ["1.8"], "levels": [3], "skills": ["AI-SL1.8.polynomial-equation", "AI-SL1.8.select-roots"], "calculator": false, "title": "Check exact candidate solutions against model restrictions", "source": "ai-sl-2026-may-tz1-p1-q11.c",build({rng}){
const r=rng.int(4,15),s=rng.int(2,9),t=r+rng.int(1,6),p=rng.int(2,5),z=p*r+t;
const table=tb(["Candidate","Value of the first input"],[["One",N(-s)],["Two",N(r)]]);
return Q({r,s,t,p},`A controller requires $x$ and $y$ to be non-negative integers. Its equations are $${poly([1,s-r,-r*s])}=0$ and $y=${p}x+${t}$. The table shows candidate $x$-values from a calculator; its second input has not been calculated yet.`,[
 P("Which candidate value of $x$ should be rejected?",2,ans.int(-s),[`Reject ${N(-s)} because a negative value of $x$ is not allowed.`]),
 P("Find the valid value of $y$.",2,ans.int(z),[`Substitute the acceptable value of $x$ into the second equation, giving ${N(z)}.`]),
 P("Find the difference between the valid values $y$ and $x$.",1,ans.int(z-r),[`The difference is $${z}-${r}=${z-r}$.`])
],{table});
}}]);
E.registerAll({}, [{"type": "t1-w2-complex-quotient-axis-landing", "home": "ai-hl", "unknown": "complex-quotient-axis-landing", "representation": "equation", "format": "value", "syllabus": ["1.13"], "levels": [3], "skills": ["AI-AHL1.13.multiply-divide-powers", "AI-AHL1.13.geometric-interpretation", "AI-AHL1.13.polar-to-cartesian"], "calculator": false, "title": "Track a complex quotient to a coordinate axis exactly", "source": "ai-hl-2026-may-tz2-p1-q13.c",build({rng}){
const a=rng.int(2,8),b=rng.int(2,7),m=rng.pick([1,2,4]),side=rng.pick([-1,1]),r=a*b;
const polar=(k,j)=>num(k)+(j?"\\mathrm{e}^{\\left("+piFrac(j,6)+"\\right)\\mathrm{i}}":"");
return Q({a,b,m,side,r},`Let $z=${polar(r,m)}$ and $w=${polar(b,m-3*side)}$.`,[
 P("Find the modulus of the quotient of $z$ by $w$.",2,ans.int(a),[`Divide the two moduli: $${r}\\div${b}=${a}$.`]),
 P("Find the imaginary part of the quotient of $z$ by $w$.",2,ans.int(side*a),["Subtract the angles. The quotient has argument $"+piFrac(side,2)+"$ and is purely imaginary.",`The imaginary part is ${N(side*a)}.`]),
 P("Find the real part of the quotient of $z$ by $w$.",2,ans.int(0),["Either direction of a quarter-turn from the positive real axis ends on the imaginary axis. The real part is $0$."])
]);
}}]);
E.registerAll({}, [{"type": "t1-w2-partial-fractions-cancelled-pole", "home": "aa-hl", "unknown": "partial-fractions-cancelled-pole", "representation": "equation", "format": "value", "syllabus": ["1.11"], "levels": [1], "skills": ["AHL1.11.cover-up-or-compare", "AHL1.11.distinct-linear-factors"], "calculator": false, "title": "Recognise a zero coefficient and retain the excluded input", "source": "aa-hl-2026-may-tz2-p1-q11.a",build({rng}){
const a=rng.int(2,12),b=a+rng.int(2,6),p=rng.int(2,10),d=-(p*b);
const factor=x=>"\\left(x-"+x+"\\right)";
return Q({a,b,p,d},`The expression $R(x)=\\dfrac{${lin(p,d)}}{${factor(a)}${factor(b)}}$ can be written as $\\dfrac{A}{x-${a}}+\\dfrac{B}{x-${b}}$ where the original expression is defined.`,[
 P("Find $B$.",1,ans.int(0),[`The numerator contains the factor $x-${b}$, which cancels the second pole. Thus $B=0$.`]),
 P("Which excluded input is not apparent from the simplified expression?",1,ans.int(b),[`The cancellation does not restore the original expression at $x=${b}$. That input is still excluded.`])
]);
}}]);
E.registerAll({}, [{"type": "t1-w2-matrix-eigenline-check", "home": "ai-hl", "unknown": "matrix-eigenline-check", "representation": "table", "format": "mcq", "syllabus": ["1.15"], "levels": [2], "skills": ["AI-AHL1.15.verify-eigenvector", "AI-AHL1.15.eigenvectors"], "calculator": false, "title": "Identify which displayed vector stays on its own line", "source": "ai-hl-2026-may-tz1-p2-q05.d",build({rng}){
const a=rng.int(2,9),raw=rng.int(1,6),b=raw===a?raw+1:raw,v=rng.pick([1,-1]),A=a+v*b;
const vectors=rng.shuffle([[1,v],[1,0],[0,1]]),names=["P","Q","R"],good=names[vectors.findIndex(x=>x[0]===1&&x[1]===v)];
const table=tb(["Vector","First component","Second component"],vectors.map(([x,y],i)=>[names[i],N(x),N(y)]));
const choice=(x,why)=>({text:"Vector "+x,value:x,why});
return Q({a,b,vectors},`Use the transformation matrix $\\begin{pmatrix}${a}&${b}\\\\${b}&${a}\\end{pmatrix}$ and the candidates shown.`,[
 P("Which candidate lies on the same line through the origin as its image?",2,ans.choice(rng,choice(good),names.filter(x=>x!==good).map(x=>choice(x,"The image of this axis vector has two nonzero components."))),[`Multiply each candidate by the matrix. Only vector ${good} stays on its original line.`]),
 P("Find the corresponding eigenvalue.",2,ans.int(A),[`Compare the first component of the image with the original first component. The scale factor is ${N(A)}.`])
],{table});
}}]);
E.registerAll({}, [{"type": "t1-w2-third-report-check", "home": "aa-hl", "unknown": "third-report-check", "representation": "equation", "format": "value", "syllabus": ["1.16"], "levels": [2], "skills": ["AHL1.16.consistency-condition", "AHL1.16.set-up-system"], "calculator": false, "title": "Check whether a third linear report is compatible", "source": "aa-hl-2026-may-tz2-p2-q07.a",build({rng}){
const A=rng.int(5,19),B=rng.int(5,20),k=rng.int(2,5),off=rng.int(-3,3),v=k*A+B,K=v+off;
return Q({A,B,k,off},`Two equations in a report are $x+y=${A}$ and $y+z=${B}$. A third line reports $${k}x+${k+1}y+z=${K}$.`,[
 P("Find the only value the right-hand side of the third line can have if all three equations are consistent.",3,ans.int(v),[`Multiply the first equation by ${N(k)} and add the second. The left-hand side matches the third line, so the required value is ${N(v)}.`]),
 P("Do the originally reported equations have a common solution?",1,ans.self(off?"No. The first two equations imply a different value for the third right-hand side.":"Yes. The third equation adds no restriction, and the first two have a common solution."),[off?"The first two imply a constant left-hand side; the reported value conflicts with it.":"Choose any value for $y$, then find $x$ and $z$ from the first two equations. Each such choice also satisfies the third."])
]);
}}]);
E.registerAll({}, [{"type": "t1-w2-verify-broken-inverse", "home": "ai-hl", "unknown": "verify-broken-inverse", "representation": "equation", "format": "value", "syllabus": ["1.14"], "levels": [2], "skills": ["AI-AHL1.14.inverse", "AI-AHL1.14.unknown-entries", "AI-AHL1.14.determinant"], "calculator": false, "title": "Recover an unreadable entry in an inverse matrix", "source": "ai-hl-2022-may-tz2-p1-q15.b",build({rng}){
const a=rng.int(2,8),b=rng.int(1,7),c=rng.int(1,8),d=rng.int(2,7),
  det=a*d-b*c||a*d-b*(c+1),C=det===a*d-b*c?c:c+1;
const mat=(w,x,y,z)=>"\\begin{pmatrix}"+w+"&"+x+"\\\\"+y+"&"+z+"\\end{pmatrix}";
return Q({a,b,C,d},`A matrix is $A=${mat(a,b,C,d)}$. A damaged copy shows $A^{-1}=${frac(1,abs(det))=== "1" ? "" : frac(1,abs(det))}${mat("q",-(Math.sign(det))*b,-(Math.sign(det))*C,Math.sign(det)*a)}$.`,[
 P("Find the determinant of $A$.",2,ans.int(det),[`Use the diagonal products: $${a*d}-${b*C}=${det}$.`]),
 P("Find the missing integer $q$.",2,ans.int(Math.sign(det)*d),[`The top-left entry in the adjugate is the original bottom-right entry. The positive denominator makes $q=${Math.sign(det)*d}$.`])
]);
}}]);
E.registerAll({}, [{"type": "t1-w2-parity-condition-repair", "home": "aa-sl", "unknown": "parity-condition-repair", "representation": "equation", "format": "value", "syllabus": ["1.6"], "levels": [3], "skills": ["SL1.6.integer-proof", "SL1.6.conditional-proof"], "calculator": false, "title": "Repair an integer divisibility claim with an explicit condition", "source": "aa-sl-2024-nov-tz2-p1-q04",build({rng}){
const k=rng.int(3,21),m=rng.int(2,9),expr=m+"(n+"+k+")";
return Q({k,m},`A student claims that $${expr}$ is divisible by $${2*m}$ for every integer $n$.`,[
 P(`Give the value of the expression when $n=${k+1}$.`,2,ans.int(m*(2*k+1)),[`Substitution gives ${N(m*(2*k+1))}. Dividing by ${N(2*m)} leaves a half-integer.`]),
 P("Give an exact parity condition on $n$ that repairs the claim, and justify it.",3,
  ans.self(k%2?"The claim holds exactly when $n$ is odd.":"The claim holds exactly when $n$ is even."),
  [`A multiple of $${2*m}$ is exactly ${N(m)} times an even integer. Thus $${expr}$ is divisible by $${2*m}$ exactly when $n+${k}$ is even.`,
   "The sum of two integers is even exactly when they have the same parity."])
]);
}}]);
E.registerAll({}, [{"type": "t1-w2-exclude-periodic-subsequence", "home": "aa-sl", "unknown": "exclude-periodic-subsequence", "representation": "equation", "format": "value", "syllabus": ["1.8", "1.3"], "levels": [5], "skills": ["SL1.8.convergence", "SL1.8.sum-to-infinity", "SL1.8.applications", "SL1.8.sn-vs-sinf", "SL1.3.nth-term"], "calculator": false, "title": "Keep every third term of an infinite geometric progression", "source": "aa-sl-2026-may-tz3-p2-q09.a",build({rng}){
const c=rng.pick([2,3,4,5]),a=rng.int(3,18),pick=rng.pick([1,2,3]),start=c**(pick-1),cube=c**3;
const kept=a*cube,den=start*(cube-1),total=a*c,dt=c-1,remove=total*den-kept*dt;
return Q({a,c,pick},`A geometric progression has first term ${N(a)} and ratio ${F(1,c)}. Record the terms whose positions are $${pick}, ${pick+3}, ${pick+6}, \\ldots$ as a separate progression.`,[
 P("Find the first recorded term. Give an exact answer.",2,ans.frac(a,start),[`The first term kept is at position ${N(pick)}, so its value is ${F(a,start)}.`]),
 P("Find the common ratio of the recorded terms.",2,ans.frac(1,cube),[`Between records, the original ratio is applied three times, giving ${F(1,cube)}.`]),
 P("Find the exact total of all the recorded terms.",2,ans.frac(kept,den),[`The new ratio is between zero and one. Apply the infinite sum formula to obtain ${F(kept,den)}.`]),
 P("Find the exact total of the terms that were not recorded.",2,ans.frac(remove,dt*den),[`Subtract the recorded total from the whole progression's sum ${F(total,dt)}, leaving ${F(remove,dt*den)}.`])
]);
}}]);
E.registerAll({}, [{"type": "t1-w2-recurrence-invariant-induction", "home": "aa-hl", "unknown": "recurrence-invariant-induction", "representation": "equation", "format": "value", "syllabus": ["1.15", "1.3"], "levels": [5], "skills": ["AHL1.15.induction-divisibility", "AHL1.15.induction-structure", "AHL1.15.conjecture", "SL1.3.find-r-u1"], "calculator": false, "title": "Find and prove a preserved divisibility relation", "source": "aa-hl-2026-may-tz2-p1-q07",build({rng}){
const d=rng.int(3,16),r=rng.int(2,7),v=rng.int(1,d-1),b=v*(r-1),x=d-v;
const u=n=>d*r**(n-1)-v;
return Q({d,r,v},`Define $u_{1}=${x}$ and $u_{n+1}=${r}u_{n}+${b}$ for positive integers $n$.`,[
 P("Find the second term.",1,ans.int(u(2)),[`Use the recurrence once, giving ${N(u(2))}.`]),
 P("Find the third term.",1,ans.int(u(3)),[`Use the recurrence again, giving ${N(u(3))}.`]),
 P(`Find the smallest non-negative integer $c$ for which $u_{1}+c$ is divisible by $${d}$.`,2,ans.int(v),[`The next multiple of ${N(d)} at or above $u_{1}$ is ${N(d)}. The required shift is ${N(v)}.`]),
 P(`Prove by induction that $u_{n}+c$ is divisible by $${d}$ for every positive integer $n$, using your value of $c$.`,4,
 ans.self(`Base case: $u_{1}+${v}=${d}$. If $${d}$ divides $u_{n}+${v}$, then it also divides $u_{n+1}+${v}=${r}(u_{n}+${v})$. The statement follows by induction.`),
 [`The base case is $u_{1}+${v}=${d}$.`,
  `The shifted terms form a geometric sequence: the recurrence gives $u_{n+1}+${v}=${r}u_{n}+${b+v}=${r}(u_{n}+${v})$.`,
  "A multiple of a number remains a multiple when multiplied by an integer, so the next case follows."])
]);
}}]);
E.registerAll({}, [{"type": "t1-w2-linear-factor-prerequisite", "home": "aa-hl", "unknown": "linear-factor-prerequisite", "representation": "equation", "format": "value", "syllabus": ["1.11"], "levels": [0], "skills": ["AHL1.11.distinct-linear-factors"], "calculator": false, "title": "Find the input that makes a linear denominator zero", "source": "aa-hl-2026-may-tz1-p1-q12.a",build({rng}){
const a=rng.int(2,11),x=rng.nonzero(-11,11),b=-a*x;
return Q({a,b},`A denominator contains the factor $${lin(a,b)}$.`,[
 P("Find the value of $x$ that makes this factor zero.",1,ans.int(x),[`Set the factor equal to zero and solve: $${lin(a,b)}=0$, so $x=${x}$.`])
]);
}}]);
E.registerAll({}, [{"type": "t1-w2-log-ratio-compare", "home": "ai-hl", "unknown": "log-ratio-compare", "representation": "equation", "format": "value", "syllabus": ["1.9"], "levels": [1], "skills": ["AI-AHL1.9.ratio-quotient-law", "AI-AHL1.9.combine"], "calculator": false, "title": "Convert one logarithmic difference into a simple ratio", "source": "ai-hl-2025-may-tz1-p1-q10.a",build({rng}){
const b=rng.int(2,7),k=rng.int(2,8),s=b**2*k;
return Q({b,k,s},`Two positive values are $${s}$ and $${k}$.`,[
 P(`Evaluate $\\log_{${b}}${s}-\\log_{${b}}${k}$.`,2,ans.int(2),[`The quotient law makes this $\\log_{${b}}${s/k}=2$.`])
]);
}}]);
})(typeof globalThis==="undefined"?this:globalThis);
