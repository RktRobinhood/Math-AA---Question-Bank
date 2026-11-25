/* Original Wave 5 Number and Algebra, native AI course routes. */
(function(root){
"use strict";
const {ans:A,fmt:F,register}=root.QBEngine,T=String.raw;
const I=A.int,M=x=>"$"+x+"$",N=F.num,R=F.frac,S=x=>F.sf(x,3), SF=x=>A.sf(x,3);
const P=(prompt,marks,answer,...working)=>({prompt,marks,answer,working}), Q=(params,stem,...parts)=>({params,stem,parts});
const O=(text,value,why)=>({text,value,why}), C=(r,y,...n)=>A.choice(r,y,n);
const V=(...x)=>T`\left(${x.map(N).join(",\\,")}\right)`;
const AI="ai-sl",H="ai-hl";
function add(id,home,code,ids,level,rep,title,build,extra={}){
 register({type:"w5-number-"+id,home,syllabus:[code],skills:ids.split(" "),unknown:"reasoning",levels:[level],calculator:level===4,representation:rep,format:"value",title,build,...extra});
}
add("signed-bin-model",AI,"1.8","AI-SL1.8.set-up-system",1,"words","Set up a system from a total and a signed difference",({rng:r})=>{
 const y=r.int(9,31),d=r.int(2,14),big=r.bool(),sum=2*y+d;
 const diff=big?"a-b":"b-a",other=big?"b-a":"a-b",text=(q,v)=>M(T`a+b=${sum},\quad ${q}=${v}`);
 return Q({sum,d,big},T`A workshop stores a total of $${sum}$ reels in bins $A$ and $B$. Bin $${big?"A":"B"}$ contains $${d}$ more reels than the other bin. Let $a$ and $b$ be the reel counts.`,
  P("Select the equations that encode the two facts.",2,C(r,O(text(diff,d),"correct"),O(text(other,d),"reverse"),O(M(T`a+b=${d},\quad ${diff}=${sum}`),"swap")),T`The total gives $a+b=${sum}$. Subtract the count in the smaller bin from the count in the larger bin to obtain $${diff}=${d}$.`));
});
add("cubic-missing-column",AI,"1.8","AI-SL1.8.polynomial-equation",1,"equation","Keep the zero coefficient when entering a cubic",({rng:r})=>{
 const a=r.pick([2,3,4,5]),b=r.nonzero(-13,13),c=r.nonzero(-18,18),omit=r.bool(),pos=omit?1:2;
 const coefficients=omit?[a,0,b,c]:[a,b,0,c],w=[a,b,c,0],flip=coefficients.map((x,i)=>i===pos?0:i===3?-x:x);
 const vector=z=>M(V(...z));
 return Q({coefficients},T`A polynomial solver asks for coefficients in the order $x^3$, $x^2$, $x$, constant. Use it on $${F.poly(coefficients)}=0$.`,
  P("Select the coefficient list to enter.",2,C(r,O(vector(coefficients),"correct"),O(vector(w),"shift"),O(vector(flip),"flip")),T`Keep the place for $${omit?"x^2":"x"}$ even though its coefficient is zero. In the required order, the list is $${V(...coefficients)}$.`));
});
add("weighed-swap",AI,"1.8","AI-SL1.8.set-up-system AI-SL1.8.solve-system",3,"words","Recover individual masses from a total and the effect of a swap",({rng:r})=>{
 const a=r.int(3,12),b=a+r.int(2,9),p=r.int(2,6),q=r.int(3,7),k=r.int(2,p),u=r.int(2,6),v=r.int(2,6),W=p*a+q*b,change=k*(b-a);
 return Q({p,q,k,u,v,W,change},T`Identical small blocks each have mass $s$ kilograms, and identical large blocks each have mass $l$ kilograms. A batch of $${p}$ small and $${q}$ large blocks has mass $${W}$ kilograms. After replacing $${k}$ of its small blocks with $${k}$ large blocks, the scale reads $${change}$ kilograms more.`,
  P("Find the mass of one large block, in kilograms.",2,I(b),T`The first fact gives $${p}s+${q}l=${W}$. The swap gives $${k}(l-s)=${change}$ because every replacement adds the difference in the two masses. Solving the system gives $l=${b}$.`),
  P("Find the mass of one small block, in kilograms.",2,I(a),T`Use $l-s=${b-a}$ with the large-block mass, giving $s=${a}$.`),
  P(T`Predict the mass of $${u}$ small and $${v}$ large blocks, in kilograms.`,1,I(u*a+v*b),T`Apply both masses to the new batch: $${u}\cdot${a}+${v}\cdot${b}=${u*a+v*b}$.`));
});
add("recover-polynomial-record",AI,"1.8","AI-SL1.8.polynomial-equation AI-SL1.8.select-roots",3,"table","Recover a missing cubic coefficient from one verified zero",({rng:r})=>{
 const u=-r.int(2,8),v=r.int(2,7),w=v+r.int(1,6),b=-(u+v+w),c=u*v+u*w+v*w,d=-u*v*w;
 const q=Q({b,d,v},T`A solver record for $f(x)=x^3+bx^2+cx+d$ is incomplete. The table gives the known coefficients. A separate check confirms that $x=${v}$ is a zero of $f$.`,
  P("Find the missing coefficient $c$.",2,I(c),T`Substitute the verified zero: $${v}^3+\left(${N(b)}\right)\cdot${v}^2+c\cdot${v}+${N(d)}=0$. Solve for $c$, giving $${N(c)}$.`),
  P("Find the smallest real zero of the completed equation.",2,I(u),T`Enter the completed coefficient list $${V(1,b,c,d)}$ in a polynomial solver, or graph the completed cubic. Read its leftmost zero: $${N(u)}$.`),
  P("Find the largest real zero.",1,I(w),T`The other endpoint of the sorted solution list is $${N(w)}$.`));
 q.table={head:[M("b"),M("c"),M("d")],rows:[[M(N(b)),"Missing",M(N(d))]]};return q;
});
add("upper-tolerance-budget",AI,"1.6","AI-SL1.6.percentage-error AI-SL1.6.reverse-percentage-error",1,"words","Translate a stated percentage tolerance into the greatest acceptable reading",({rng:r})=>{
 const p=r.int(2,12),t=5*r.int(4,24),value=t*(100+p)/100;
 return Q({p,t},T`A check mass is exactly $${t}$ grams. A scale reading is acceptable if its absolute error is at most $${p}\%$ of the check mass. Equality is allowed.`,
  P("Find the greatest acceptable scale reading, in grams.",2,A.exact(value,N(value)),T`The percentage is taken of the known mass. Add $${p}\%$ of $${t}$ to $${t}$, giving $${N(value)}$ grams.`));
});
add("fin-loan-input-sign",AI,"1.7","AI-SL1.7.number-of-payments AI-SL1.7.find-payment",1,"words","Choose loan-solver signs from the borrower's cash flow",({rng:r})=>{
 const years=r.int(2,7),annual=r.pick([4,6,12]),loan=r.int(12,73)*100, periods=years*annual;
 return Q({years,annual,loan},T`A borrower receives €$${N(loan)}$ upfront and repays a loan over $${years}$ years, making $${annual}$ equal payments each year. Use the borrower's perspective and enter the amount received as a positive present value in a finance solver.`,
  P("How many payments should be entered?",1,I(periods),T`Multiply $${annual}$ payments per year by $${years}$ years, so enter $${periods}$.`),
  P("How should the repayment be signed?",1,C(r,O("Negative, because the borrower pays it out.","negative"),O("Positive, because the amount received is positive.","positive"),O("Zero, because the loan is fully repaid.","zero")),"The loan disbursement and the repayments move in opposite directions. Zero at the end refers to the outstanding balance, not the repayments."));
});
add("fund-balancing-gift",AI,"1.7","AI-SL1.7.future-value-deposits AI-SL1.7.compare-interpret",3,"words","Compare a starting gift with equal deposits at the end of each year",({rng:r})=>{
 const n=2,p=r.pick([2,4,5,6,8]),k=r.int(2,7)*(p===5?4:25),gift=(200+p)*k,dep=r.int(5,26)*25;
 const U=100+p,growth=F.dp(U/100,2),A0=(gift*U*U+100*dep*(200+p))/10000,D=k*U*U/100;
 return Q({n,p,dep,gift},T`Two savings plans earn $${p}\%$ a year, compounded annually. Plan A begins with €$${N(gift)}$ and deposits €$${dep}$ at the end of each year. Plan B starts at zero and makes equal end-of-year deposits. Compare both balances just after the second deposit.`,
  P("Find Plan A's final balance, in euros.",3,A.exact(A0,F.dp(A0,2)),T`The opening gift grows for two years; the first deposit grows for one year; the second deposit earns no interest. Thus the final balance is $${N(gift)}\left(${growth}\right)^2+${dep}\left(${growth}\right)+${dep}$, or €$${F.dp(A0,2)}$.`),
  P("Find how much more Plan B must deposit each year than Plan A to give the same final balance.",2,A.exact(D,F.dp(D,2)),T`If the first extra deposit is $d$, it is worth $${growth}d$ at the end of year two. The second is still worth $d$. Together they must replace the grown gift. Solve $d\left(${growth}+1\right)=${N(gift)}\left(${growth}\right)^2$ to get €$${F.dp(D,2)}$.`));
});
add("matrix-order-dimensions",H,"1.14","AI-AHL1.14.multiply",1,"words","Determine which order of rectangular matrix multiplication is defined",({rng:r})=>{
 const [a,b,c]=r.sample([2,3,4,5,6,7,8],3),reverse=r.bool(),l=reverse?c:a,h=reverse?a:c;
 const valid=reverse?"QP":"PQ",invalid=reverse?"PQ":"QP",display=(x,y)=>M(T`${x}\times${y}`);
 const pp=reverse?[b,a]:[a,b],qq=reverse?[c,b]:[b,c];
 return Q({pp,qq},T`Matrix $P$ has dimensions ${display(...pp)} and matrix $Q$ has dimensions ${display(...qq)}.`,
  P("Which product is defined, and what are its dimensions?",2,C(r,O(M(valid)+" with dimensions "+display(l,h),"valid"),O(M(invalid)+" with dimensions "+display(l,h),"wrong-order"),O(M(valid)+" with dimensions "+display(h,l),"reversed-size")),T`The inner dimensions agree only for $${valid}$. In row-by-column multiplication, the outer dimensions give the size ${display(l,h)}.`));
});
add("matrix-det-sign-control",H,"1.14","AI-AHL1.14.determinant AI-AHL1.14.unknown-entries AI-AHL1.14.inverse",3,"equation","Recover an adjustable matrix entry from a signed determinant target",({rng:r})=>{
 const a=r.int(2,6),b=r.int(2,6),k=r.int(2,6),h=r.nonzero(-5,7),c=a*k,t=b*k+h,target=a*h;
 const mat=T`\begin{pmatrix}${a}&${b}\\${c}&x\end{pmatrix}`;
 return Q({a,b,c,target},T`Let $A=${mat}$. A control system changes the entry $x$ and needs an invertible matrix.`,
  P("Find the value of $x$ for which the matrix is singular.",2,I(b*k),T`The determinant is $${a}x-${b*c}$. Set it to zero and solve, giving $x=${b*k}$.`),
  P(T`Find $x$ when $\det A=${target}$.`,2,I(t),T`Solving $${a}x-${b*c}=${target}$ gives $x=${t}$.`),
  P("For that value, find the bottom-right entry of the inverse exactly.",1,A.frac(1,h),T`The bottom-right entry of the adjugate is $${a}$. Divide by the determinant $${target}$, obtaining $${R(1,h)}$.`));
});
add("power-scale-cancellation",H,"1.10","AI-AHL1.10.evaluate-numerical AI-AHL1.10.simplify-algebraic",2,"words","Compare the effects of two simultaneous fractional-power changes",({rng:r})=>{
 const a=r.int(2,6),b=r.int(2,9),[power,den]=r.pick([[1,2],[1,3],[2,3],[1,4],[3,4]]),td=r.pick([2,3]);
 const f=a**power,v=a**den,t=b**td;
 return Q({power,den,td,v,t},T`For two settings of a model, the same positive constant $k$ applies in $S=kV^{${R(power,den)}}T^{-${R(1,td)}}$, with positive $V$ and $T$. The second setting multiplies $V$ by $${N(v)}$ and multiplies $T$ by $${N(t)}$.`,
  P("Find the factor multiplying the part of $S$ that depends on $V$.",1,I(f),T`Take the root of degree $${den}$ of $${N(v)}$${power===1?".":T`, then raise it to the power $${power}$.`} This gives $${f}$.`),
  P("Find the ratio of the new value of $S$ to the old value, exactly.",2,A.frac(f,b),T`Taking the power $-${R(1,td)}$ of $${N(t)}$ gives $${R(1,b)}$. Multiply the two factors: the original inputs and $k$ cancel.`));
});
add("eigenmode-tolerance",H,"1.15","AI-AHL1.15.powers-by-diagonalisation AI-AHL1.15.eigenvectors",4,"equation","Use signed eigenmodes to locate an error threshold",({rng:r})=>{
 const p=r.int(3,12),q=r.int(7,18),w=r.int(3,11)/100,rate=r.int(47,73)/100,step=r.int(2,4);
 const count=Math.ceil(Math.log(w/(2*q))/Math.log(rate)),diff=2*q*(-rate)**step;
 return Q({p,q,w,rate,step},T`A two-component signal starts at $${V(p+q,p-q)}$. Each iteration multiplies the signal vector by a matrix $A$. The vectors $${V(1,1)}$ and $${V(1,-1)}$ are eigenvectors of $A$, with eigenvalues $1$ and $-${rate}$ respectively.`,
  P(T`Find the first component minus the second component after $${step}$ iterations, to three significant figures.`,3,SF(diff),T`In the given eigenvector basis the starting coefficients are $${p}$ and $${q}$. The first mode contributes equally to both components, so it cancels in the difference. The difference becomes $2\cdot${q}(-${rate})^{${step}}\approx${S(diff)}$.`),
  P(T`Find the least number of iterations for which the magnitude of this difference is at most $${w}$.`,3,I(count),T`Its magnitude at step $n$ is $2\cdot${q}\left(${rate}\right)^n$. Solve the inequality by logarithms or successive values. The first acceptable integer is $${count}$.`));
});
})(typeof window==="undefined"?globalThis:window);
