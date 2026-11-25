/* Wave 3: original numbers and algebra practice for native IB course routes. */
(function(root) {
 "use strict";
 const {ans,fmt,register}=root.QBEngine, {num,frac}=fmt;
 const m=x=>"$"+x+"$", N=x=>m(num(x)), F=(n,d)=>m(frac(n,d));
 const P=(prompt,marks,answer,...working)=>({prompt,marks,answer,working});
 const item=(text,value)=>({text,value});
 const choice=(rng,yes,...wrong)=>ans.choice(rng,yes,wrong);
 const prettyMatrix=M=>"\\begin{pmatrix}"+M.map(row=>row.map(num).join("&")).join("\\\\")+"\\end{pmatrix}";
 const complex=(a,b)=>fmt.expr([[a,""],[b,"\\mathrm{i}"]]);
 const add=(name,home,code,skill,level,rep,title,build,options={})=>{
  const type="w3-number-"+name,unknown="reasoning";
  register({id:type+"/"+unknown+"/"+rep,type,home,syllabus:[code],skills:Array.isArray(skill)?skill:[skill],levels:[level],representation:rep,unknown,format:"value",calculator:level>=4,title,build,...options});
 };

 add("product-certificate","aa-sl","1.6",["SL1.6.inequality-proof","SL1.6.deduce-inequality"],4,"words","Prove and apply a product ceiling",({rng})=>{
  const s=rng.int(2011,4349)/10, delta=s*rng.int(14,38)/100;
  const p=Math.round((s*s-delta*delta)*25)/100;
  return {params:{s,p},stem:"A design uses two positive quantities "+m("x")+" and "+m("y")+". Its score is "+m("xy")+" and the total available is "+m("x+y="+num(s))+".",parts:[
   P("Select the identity that proves "+m("4xy\\le (x+y)^2")+" for every allocation.",2,choice(rng,
    item(m("(x+y)^2-4xy=(x-y)^2"),"square"),
    item(m("(x+y)^2-4xy=x^2+y^2"),"omit"),
    item(m("(x+y)^2-4xy=(x-y)(x+y)"),"diff"),
    item(m("(x+y)^2-4xy=4(x-y)^2"),"scale")),
    "Expand both sides of the identity. A square is nonnegative, so the difference on the left is nonnegative."),
   P("Find the greatest possible score, to three significant figures.",2,ans.sf(s*s/4),
    "The inequality bounds the score by a quarter of the square of the total. Equal allocations make the square of their difference zero, so the upper bound is attained."),
   P("A measured score is "+N(p)+". Use the identity to find the difference between the larger and smaller allocations, to three significant figures.",2,ans.sf(Math.sqrt(s*s-4*p)),
    "Substitute the total and the measured product into the identity, then take the positive square root.")
  ]};
 });

 add("balanced-block-read","aa-sl","1.2","SL1.2.sum",1,"table","Read the average of a symmetric arithmetic block",({rng})=>{
  const l=rng.int(3,19),w=rng.int(1,5),v=rng.int(-10,25),d=rng.nonzero(-8,8);
  return {params:{l,w,v,d},stem:"The table gives three terms of the same arithmetic sequence.",
   table:{head:["Index",N(l),N(l+w),N(l+2*w)],rows:[["Term",N(v),N(v+w*d),N(v+2*w*d)]]},parts:[
    P("Find the mean of all the terms from the first listed index to the last listed index, inclusive.",2,ans.int(v+w*d),
     "The indices are equally spaced around the middle index. Each pair of terms equally far from the middle averages to the middle term.")
   ]};
 });

 add("geometric-recovery-leg","aa-sl","1.3",["SL1.3.model","SL1.3.nth-term"],2,"words","Recover the absolute starting height from just the fall",({rng})=>{
  const b=rng.int(2,5),a=rng.int(1,b-1),n=rng.int(2,5),u=rng.int(3,13),top=u*b*b;
  const first=n,after=n+2;
  return {params:{a,b,n,fall:u*(b*b-a*a)},stem:"After each bounce a marker reaches "+F(a,b)+" of the previous peak. From the peak after bounce "+N(first)+" to that after bounce "+N(after)+" the peak height drops by "+N(u*(b*b-a*a))+" cm.",parts:[
   P("Find the peak height after bounce "+N(first)+". Give your answer in centimetres.",2,ans.int(top),"Two successive bounces multiply the earlier peak by the square of the ratio. The loss is the earlier peak times one minus that squared ratio."),
   P("Find the peak height after bounce "+N(first+1)+". Give your answer in centimetres.",2,ans.int(u*a*b),"Multiply the earlier peak by the ratio once, not twice.")
  ]};
 });

 add("depreciation-discrete-loss","aa-sl","1.4","SL1.4.depreciation",2,"words","Separate first-year loss from next-year loss",({rng})=>{
  const r=rng.int(2,8),base=rng.int(2,9),at=rng.int(1,7),P0=base*100;
  const ask=P0*(10-r)/10;
  return{params:{r,firstloss:P0,at},stem:"A rented display loses "+N(10*r)+" percent of its opening value each year. In year "+N(at)+" it lost "+N(P0)+" euros.",parts:[
   P("Find its value at the start of year "+N(at)+", in euros.",2,ans.frac(P0*10,r),"The observed loss is the opening value multiplied by the depreciation rate."),
   P("Find how many euros it will lose in the following year if the rate stays the same.",2,ans.int(ask),"The following year begins with a smaller value. Its loss is the previous loss multiplied by the retention factor.")
  ]};
 });

 add("change-base-reciprocal","aa-sl","1.7","SL1.7.change-of-base",1,"equation","Recognise the reciprocal when a logarithm swaps its base",({rng})=>{
  const p=rng.int(2,11),d=rng.int(2,10),u=rng.int(2,9),temp=rng.int(1,8);
  const q=p*d+temp;
  return{params:{p,q,u},stem:"Suppose "+m("\\log_{a} b="+frac(p,q))+" for positive "+m("a,b")+" not equal to one.",parts:[
   P("Find "+m("\\log_b(a^{"+u+"})")+" exactly.",2,ans.frac(u*q,p),"Swapping the base and argument takes the reciprocal. Then use the power law for the new argument.")
  ]};
 });

 add("infinite-tail-fraction-test","aa-sl","1.8","SL1.8.convergence",1,"table","Select an alternating series that has a finite sum",({rng})=>{
  const d=rng.int(2,16),a=rng.int(1,d-1),b=rng.int(2,14),k=rng.int(2,10);
  const terms=[b,-b,b],labels=["P","Q","R"];
  const ratios=[[-a,d],[-d,a],[k,1]];
  const order=rng.shuffle([0,1,2]);
  const chosen=labels[order.indexOf(0)];
  return{params:{order,ratios},stem:"Each of the infinite geometric series has a first term of magnitude "+N(b)+". The table shows the signed first term and its common ratio.",
   table:{head:["Series","First term","Common ratio"],rows:order.map((v,i)=>[labels[i],N(terms[v]),F(...ratios[v])])},parts:[
    P("Which series has a finite sum?",2,choice(rng,item(chosen,chosen),...labels.filter(s=>s!==chosen).map(s=>item(s,s))),
     "The common ratio must have absolute value less than one. A negative ratio does not by itself prevent convergence.")
   ]};
 });

 add("log-two-measurements-repair","ai-hl","1.9",["AI-AHL1.9.combine","AI-AHL1.9.solve-equation"],3,"table","Repair an inconsistent logarithmic measurement without undoing both logs",({rng})=>{
  const a=rng.int(2,6),b=rng.int(2,6),p=rng.int(1,4),q=rng.int(1,4);
  const shift=rng.nonzero(-2,2),observed=a*b*10**Math.max(shift,0),scale=10**Math.max(-shift,0);
  const c=p+q;
  return{params:{a,b,p,q,observed,scale},stem:"A record gives an incorrect sum of two logarithmic instrument readings. The two readings and the recorded total are shown.",
   table:{head:["Quantity","Value"],rows:[["First reading",m(p+"+\\log_{10}("+a+")")],["Second reading",m(q+"+\\log_{10}("+b+")")],["Recorded total",m(c+"+\\log_{10}\\left("+frac(observed,scale)+"\\right)")]]},parts:[
   P("Write the correct sum in the form "+m(c+"+\\log_{10} k")+" and give "+m("k")+".",2,ans.int(a*b),"Add the constants and use the product law for the two logarithms."),
   P("Find correct sum minus recorded sum. Give an exact value.",3,ans.int(-shift),"The constants cancel. Combine the difference of logarithms into the logarithm of a quotient. The quotient is a power of ten, whose exponent can be read exactly.")
  ]};
 });

 add("weighted-pole-reconstruction","aa-hl","1.11",["AHL1.11.distinct-linear-factors","AHL1.11.cover-up-or-compare"],3,"equation","Recover both partial fractions from two weighted observations",({rng})=>{
  const p=rng.int(1,7),gap=rng.int(2,6),q=p+gap,A=rng.nonzero(-6,7),k=rng.int(1,3),c=rng.nonzero(-6,7),B=2*k*c;
  const x=q+k,y=q+2*k,U=A+2*c*(x-p),V=A+c*(y-p);
  return{params:{p,q,x,y,U,V},stem:"A proper rational function has the form "+m("R(x)=\\dfrac{A}{x-"+p+"}+\\dfrac{B}{x-"+q+"}")+". Let "+m("T(x)=(x-"+p+")R(x)")+" at all allowed inputs. It is known that "+m("T("+x+")="+num(U))+" and "+m("T("+y+")="+num(V))+".",parts:[
   P("Find "+m("B")+".",3,ans.int(B),"After multiplying through, the observations are both of the form "+m("T(t)=A+B\\dfrac{t-"+p+"}{t-"+q+"}")+".",
    "Subtract the two equations to eliminate "+m("A")+" and solve the resulting linear equation."),
   P("Find "+m("A")+".",2,ans.int(A),"Substitute the coefficient just found into either of the weighted observations.")
  ]};
 });

 add("argand-perpendicular-bisector","aa-hl","1.12",["AHL1.12.argand-diagram","AHL1.12.modulus-argument-values"],4,"equation","Locate the real point equidistant from two complex numbers",({rng})=>{
  const a=rng.int(1,8),dx=rng.int(2,6),c=a+dx,b=rng.int(2,8),d=b+rng.int(1,4);
  const w=(c*c+d*d-a*a-b*b)/(2*dx), magnitude=Math.hypot(w-a,b),theta=Math.atan2(b,a-w);
  return{params:{a,b,c,d},stem:"Let "+m("u="+complex(a,b))+" and "+m("v="+complex(c,d))+". A real number "+m("w")+" is equally far from "+m("u")+" and "+m("v")+" in the complex plane.",parts:[
   P("Find "+m("w")+". Give your answer to three significant figures.",2,ans.sf(w),"Equate the squared moduli of the two differences. The squared terms in the real unknown cancel."),
   P("Find "+m("|u-w|")+" to three significant figures.",2,ans.sf(magnitude),"Use the real and imaginary differences as perpendicular displacements."),
   P("Find the principal argument of "+m("u-w")+", in radians to three significant figures.",2,ans.sf(theta),"The real part is negative and the imaginary part is positive. Choose the angle in the second quadrant.")
  ]};
 });

 add("subtracted-rounding-error","ai-sl","1.6",["AI-SL1.6.bounds-of-calculation","AI-SL1.6.max-percentage-error"],4,"words","Find the largest relative error after subtracting rounded readings",({rng})=>{
  const b=rng.int(21,80),d=rng.int(4,19),a=b+d;
  const steps=rng.pick([[1,2],[2,1],[1,1]]),[u,v]=steps.map(x=>x/2);
  // Different instruments can have different rounding step sizes; choose consistent displays.
  const B=steps[1]===2?b+b%2:b, A=steps[0]===2?a+a%2:a, estimate=A-B;
  const e=u+v,min=estimate-e,max=estimate+e;
  return{params:{A,B,u,v},stem:"A sensor estimates a positive difference by subtracting displayed readings "+N(B)+" from "+N(A)+". The first reading is rounded to the nearest "+N(steps[0])+" units and the second to the nearest "+N(steps[1])+" units.",parts:[
   P("Find the lower bound for the true difference.",2,ans.dec(min),"Subtract the highest possible second reading from the lowest possible first reading."),
   P("Find the upper bound for the true difference.",1,ans.dec(max),"Subtract the lowest possible second reading from the highest possible first reading."),
   P("Find the upper bound for the absolute percentage error in the displayed difference, using the true difference as the denominator. Give your answer to three significant figures.",3,ans.sf(100*e/min),
    "The absolute error has the same bound at either end. Dividing by the smaller possible true difference makes the relative error larger.")
  ]};
 });

 add("annuity-shifted-stream","ai-sl","1.7",["AI-SL1.7.future-value-deposits","AI-SL1.7.compare-interpret"],3,"table","Compare deposit streams shifted by one period",({rng})=>{
  const d=rng.int(3,13),rate=rng.pick([1,2,4,5,8]),t=rng.int(3,7);
  return{params:{d,rate,t},stem:"Two simulated plans each make "+N(t)+" deposits of "+N(d)+" euros, one per month. Plan A's first deposit is at the end of month one; Plan B starts one month later. Both accounts pay "+N(rate)+" percent interest each month before that month's deposit. Compare both balances just after Plan B's last deposit.",
   table:{head:["Plan","First deposit","Last deposit"],rows:[["A","End of month one",N(t)],["B","End of month two",N(t+1)]]},parts:[
    P("Which plan has the greater balance?",1,choice(rng,item("Plan A","A"),item("Plan B","B"),item("They have the same balance","same")),"Every deposit in A was made one period earlier, so it earns one extra period of interest."),
    P("By what exact percentage does A's balance exceed B's?",2,ans.int(rate),"Each term of A's balance is the corresponding term of B's balance multiplied by the same one-period growth factor."),
    P("Find the exact ratio of B's balance to A's balance. Give your answer as a fraction.",2,ans.frac(100,100+rate),"Reverse the direction of the comparison by taking the reciprocal of the multiplier.")
  ]};
 });

 add("eigenline-reconstruct-column","ai-hl","1.15",["AI-AHL1.15.eigenvectors","AI-AHL1.15.diagonalise"],3,"equation","Recover an unknown matrix from two eigenline responses",({rng})=>{
  const a=rng.nonzero(-5,6),d=rng.nonzero(-5,6),r=rng.nonzero(-6,6),s=rng.pick([-2,-1,1,2]),h=r+2*s;
  const A=[[r+s,s],[s,r+s]], v=[[a],[a]],w=[[d],[-d]];
  return{params:{r,h,a,d},stem:"A real matrix "+m("M")+" sends "+m(prettyMatrix(v))+" to "+m(prettyMatrix([[h*a],[h*a]]))+" and sends "+m(prettyMatrix(w))+" to "+m(prettyMatrix([[r*d],[-r*d]]))+".",parts:[
   P("Find the larger eigenvalue of "+m("M")+".",2,ans.int(Math.max(r,h)),"Each output is a scalar multiple of its nonzero input. Compare the two scale factors."),
   P("Find the entry in row one, column two of "+m("M")+".",3,ans.int(A[0][1]),
    "Scale the inputs to obtain "+m(prettyMatrix([[1],[1]]))+" and "+m(prettyMatrix([[1],[-1]]))+". Subtract these inputs and divide by two to obtain the second unit vector. Do the same to their outputs.")
  ]};
 });
})(globalThis);
