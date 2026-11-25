/* Wave 4: original native Functions practice. */
(function(root){"use strict";
const {ans,fmt,register}=root.QBEngine,{num,lin,frac}=fmt;
const m=s=>"$"+s+"$",N=x=>m(num(x)), F=(a,b)=>m(frac(a,b));
const P=(prompt,marks,answer,...working)=>({prompt,marks,answer,working});
const item=(text,value)=>({text,value}), C=(rng,yes,...wrong)=>ans.choice(rng,yes,wrong);
const iv=(a,b)=>"["+num(a)+",\\,"+num(b)+"]";
const point=(x,y)=>m(fmt.point(x,y));
const grp=x=>"("+num(x)+")", approx=x=>m(fmt.sf(x,3)), demo=x=>Number(x.toFixed(4));
const add=(suffix,code,skill,level,rep,title,build,options={})=>{
  const type="w4-fn-"+suffix,unknown="reasoning";
  register({id:type+"/"+unknown+"/"+rep,type,home:"aa-sl",unknown,representation:rep,format:"value",levels:[level],calculator:level>=4,syllabus:[code],skills:[skill],title,build,...options});
};
const bis=(f,a,b)=>{
 const side=Math.sign(f(a));for(let i=0;i<55;i++){const t=(a+b)/2;if(Math.sign(f(t))===side)a=t;else b=t;}return(a+b)/2;
};

add("perpendicular-drop","2.1","SL2.1.parallel-perpendicular",4,"words","Find the closest point on a straight route",({rng})=>{
 const a=rng.int(2,8),b=rng.int(1,7),h=rng.int(-4,2),k=rng.int(1,7),u=h+rng.int(1,4),v=k+rng.int(16,24);
 const x=h+(a*(u-h)+b*(v-k))*a/(a*a+b*b),y=k+(x-h)*b/a,dist=Math.hypot(x-u,y-v);
 return {params:{a,b,h,k,u,v},stem:"A straight route passes through "+point(h,k)+" and "+point(h+a,k+b)+". A visitor is at "+point(u,v)+". The route extends in both directions.",
 parts:[
  P("Find the gradient of the perpendicular from the visitor to the route.",2,ans.frac(-a,b),"The route has gradient "+F(b,a)+", so its perpendicular has gradient "+F(-a,b)+"."),
  P("Find the x-coordinate of the closest point on the route. Give your answer to three significant figures.",2,ans.sf(x),"Equate the route and its perpendicular: "+m(num(k)+"+"+frac(b,a)+"("+lin(1,-h)+")="+num(v)+"-"+frac(a,b)+"("+lin(1,-u)+")")+".","The common x-coordinate is "+approx(x)+"."),
  P("Find the distance from the visitor to the route to three significant figures.",2,ans.sf(dist),"The common y-coordinate is approximately "+approx(y)+". Use the unrounded intersection.","The distance is approximately "+m("\\sqrt{"+grp(demo(x-u))+"^2+"+grp(demo(y-v))+"^2}")+" to the shown precision, giving "+approx(dist)+".")
 ]};
});

add("cable-safe-segment","2.1","SL2.1.line-model",4,"words","Find the portion of a straight cable that satisfies two limits",({rng})=>{
 const p=rng.int(2,7),q=p+rng.int(2,5),k=rng.int(2,7),l=rng.int(1,3),t=l+rng.int(3,6);
 const Y=Number((k+p*t/q+.13).toFixed(3)), r=(Y-k)*q/p;
 return{params:{p,q,k,l,Y},stem:"A straight cable has height "+m("y="+num(k)+"+"+frac(p,q)+"x")+" metres above the floor at horizontal distance "+m("x")+" metres, for "+m("x\\ge0")+". An accessible portion must be at least "+N(l)+" metres from the origin horizontally and no more than "+N(Y)+" metres above the floor.",parts:[
  P("Find the height at the start of the accessible portion, to three significant figures.",2,ans.sf(k+p*l/q),"At "+m("x="+l)+", the height is "+m(num(k)+"+"+frac(p,q)+grp(l))+", or "+approx(k+p*l/q)+" metres."),
  P("Find the greatest allowed horizontal distance, to three significant figures.",2,ans.sf(r),"Solve "+m(num(k)+"+"+frac(p,q)+"x="+num(Y))+" for "+m("x")+". Larger values exceed the height limit."),
  P("Find the length of the accessible portion of the cable, to three significant figures.",2,ans.sf(Math.hypot(r-l,Y-(k+p*l/q))),"Use "+m("\\sqrt{("+num(demo(r))+"-"+num(l)+")^2+("+num(Y)+"-"+num(demo(k+p*l/q))+")^2}")+" as an approximation. With unrounded endpoints the length is "+approx(Math.hypot(r-l,Y-(k+p*l/q)))+" metres.")
 ]};
});

add("calibration-reject-time","2.2","SL2.2.function-model",4,"words","Distinguish a physical inverse reading from extrapolation",({rng})=>{
 const a=rng.int(2,7),c=rng.int(3,8),H=rng.int(6,10),x0=rng.int(2,4)+.37;
 const F=x=>a*Math.sqrt(x)+c*x*x,good=Number(F(x0).toFixed(2)),bad=Number((F(H)*1.27).toFixed(2));
 return{params:{a,c,H,good,bad},stem:"An instrument model gives the reading "+m("f(t)="+a+"\\sqrt{t}+"+c+"t^2")+" at time "+m("t")+" seconds. Calibration is valid only for "+m("0\\le t\\le "+H)+".",parts:[
  P("Find the greatest valid reading to three significant figures.",2,ans.sf(F(H)),"Both terms increase on the calibrated interval. Evaluate "+m(a+"\\sqrt{"+H+"}+"+c+grp(H)+"^2")+" to get "+approx(F(H))+"."),
  P("Find the time that gives a reading of "+N(good)+", to three significant figures.",3,ans.sf(bis(x=>F(x)-good,0,H)),"Use a numerical solver on "+m(iv(0,H))+" with "+m(a+"\\sqrt{t}+"+c+"t^2="+num(good))+"."),
  P("Does the model give a calibrated time for a reading of "+N(bad)+"?",1,C(rng,item("No. It exceeds the calibrated range.","no"),item("Yes. Any positive reading is valid.","any"),item("Yes. Swap the input and output of the original formula.","swap")),"The reading "+N(bad)+" is greater than the calibrated maximum "+approx(F(H))+".")
 ]};
});

add("inverse-duplicate-witness","2.2","SL2.2.is-function",4,"equation","Find numerical witnesses that a function is not one-to-one",({rng})=>{
 const h=rng.int(3,7),L=rng.int(3,5),a=rng.int(2,9)/10,k=rng.int(2,12),v=k+rng.int(13,27)/10;
 const f=x=>k+(x-h)**2+a*(x-h)**4, x=bis(t=>f(t)-v,h-L,h);
 const formula=k+"+("+lin(1,-h)+")^2+"+num(a)+"("+lin(1,-h)+")^4";
 return{params:{h,L,a,k,v},stem:"The function "+m("f(x)="+formula)+" is defined on "+m(iv(h-L,h+L))+". An instrument reports the output "+N(v)+".",parts:[
  P("Use technology to find the input below "+N(h)+" that produces this output, to three significant figures.",2,ans.sf(x),"Solve "+m(formula+"="+num(v))+" on "+m(iv(h-L,h))+". That branch is decreasing and has one solution, approximately "+approx(x)+"."),
  P("Find the other input to three significant figures without using a second solver.",2,ans.sf(2*h-x),"Reflect about "+N(h)+". Evaluate "+N(2*h)+" minus the unrounded first result (approximately "+approx(x)+"), giving "+approx(2*h-x)+"."),
  P("Which restriction leaves a one-to-one function and keeps the larger input?",2,C(rng,item(m(iv(h,h+L)),"right"),item(m(iv(h-L,h)),"left"),item(m(iv(h-L,h+L)),"all")),"The full domain has two preimages of this output. The right interval is increasing and keeps the larger one.")
 ]};
});

add("arch-width-transfer","2.6","SL2.6.axis-symmetry",4,"words","Transfer a measured width to a different height on a parabola",({rng})=>{
 const H=rng.int(65,125)/10,Y=rng.int(15,30)/10,d=rng.int(29,54)/10,Z=H-rng.int(11,24)/10;
 const A=(H-Y)/(d*d), width=2*Math.sqrt((H-Z)/A);
 return{params:{H,Y,d,Z},stem:"An arch has a parabolic cross-section. Its peak is "+N(H)+" metres above the floor, and its centre is at "+m("x=0")+". At height "+N(Y)+" metres the arch is "+N(2*d)+" metres wide.",parts:[
  P("Find the positive coefficient "+m("A")+" in "+m("y="+num(H)+"-Ax^2")+", to three significant figures.",2,ans.sf(A),"The half-width is "+N(d)+". Solve "+m(num(Y)+"="+num(H)+"-A"+grp(d)+"^2")+", giving "+approx(A)+"."),
  P("Find the width at height "+N(Z)+" metres, to three significant figures.",3,ans.sf(width),"Solve "+m(num(Z)+"="+num(H)+"-Ax^2")+" for positive "+m("x")+", using the unrounded coefficient.","By symmetry the width is "+m("2\\sqrt{\\dfrac{"+num(H)+"-"+num(Z)+"}{A}}")+", or "+approx(width)+" metres."),
  P("Does the width increase or decrease as height rises towards the peak?",1,C(rng,item("Decreases","decreases"),item("Increases","increases"),item("Remains constant","constant")),"At higher outputs the two points are closer to the axis of symmetry.")
 ]};
});

add("mirror-quadratic-repair","2.6","SL2.6.vertex",4,"table","Reconstruct a quadratic from repeated outputs and its axis",({rng})=>{
 const h=rng.int(23,61)/10,L=rng.int(12,27)/10,a0=rng.int(31,84)/100,k0=rng.int(26,64)/10,t=h+rng.int(32,51)/10;
 const Y=Number((k0+a0*L*L).toFixed(3)),W=Number((k0+a0*(t-h)**2+.057).toFixed(3)),other=h+L;
 const a=(W-Y)/((t-h)**2-L**2), k=Y-a*L**2;
 return{params:{h,L,t,Y,W},stem:"A quadratic profile has vertical axis "+m("x="+num(h))+". The measurements in the table are exact. The repeated output belongs to two distinct inputs.",table:{head:[m("x"),N(h-L),m("u"),N(t)],rows:[[m("f(x)"),N(Y),N(Y),N(W)]]},parts:[
  P("Find "+m("u")+" to three significant figures.",2,ans.sf(other),"The first input is "+N(L)+" below the axis. Add that distance to "+N(h)+" to obtain "+N(other)+"."),
  P("Find the positive quadratic coefficient to three significant figures.",3,ans.sf(a),"Write "+m("f(x)=A("+lin(1,-h)+")^2+K")+". Subtract the two equations from the table: "+m(num(W)+"-"+num(Y)+"=A("+grp(t-h)+"^2-"+grp(L)+"^2)")+"."),
  P("Find the output at the vertex to three significant figures.",2,ans.sf(k),"Use "+m("K="+num(Y)+"-A"+grp(L)+"^2")+" with the unrounded coefficient. The vertex output is "+approx(k)+".")
 ]};
});

add("affine-restore-feature","2.11","SL2.11.image-point",4,"equation","Recover an original graph feature by undoing mixed transformations",({rng})=>{
 const a=rng.int(21,45)/10,b=rng.int(13,28)/10,h=rng.int(2,6),k=rng.int(4,11),x=rng.int(12,39)/10,y=rng.int(19,47)/10;
 const g=lin(-b,h);
 return{params:{a,b,h,k,x,y},stem:"The graph of "+m("g(x)="+num(a)+"f("+g+")+"+k)+" has a marked maximum at "+point(x,y)+". It came from a maximum of "+m("f")+".",parts:[
  P("Find the original maximum's x-coordinate, to three significant figures.",2,ans.sf(h-b*x),"Substitute into the full argument "+m(g)+". The original input is "+m(num(h)+"-"+num(b)+grp(x))+", giving "+approx(h-b*x)+"."),
  P("Find the original maximum's y-coordinate, to three significant figures.",2,ans.sf((y-k)/a),"At the marked maximum, the original output solves "+m(num(a)+"f(u)+"+k+"="+num(y))+". Therefore the output is "+m("\\dfrac{"+num(y)+"-"+num(k)+"}{"+num(a)+"}")+"."),
  P("Which horizontal transformation accounts for the reversal of left and right?",1,C(rng,item("The negative multiplier of the input.","negative"),item("The positive multiplier outside the function.","vertical"),item("The increase in the output by a constant.","offset")),"The argument decreases as the marked graph's x-coordinate increases.")
 ]};
});

add("decay-gap-matching","2.9","SL2.9.exp-model",4,"words","Match two exponentially decaying gaps above different baselines",({rng})=>{
 const A=rng.int(32,63),B=rng.int(12,22),p=rng.int(65,79)/100,q=rng.int(87,96)/100,c=rng.int(4,11),d=rng.int(13,23);
 const t=Math.log(B/A)/Math.log(p/q);
 return{params:{A,B,p,q,c,d},stem:"Two displays follow "+m("U(t)="+c+"+"+A+"("+num(p)+")^t")+" and "+m("V(t)="+d+"+"+B+"("+num(q)+")^t")+" for "+m("t\\ge0")+". Their long-run readings are different.",parts:[
  P("Find the initial gap between the first reading and its own long-run reading.",1,ans.int(A),"At the start the first reading is "+N(c+A)+"; subtract its long-run reading "+N(c)+"."),
  P("Find when both readings have the same gap above their own long-run readings, to three significant figures.",3,ans.sf(t),"Subtract the baselines, giving "+m(A+grp(p)+"^t="+B+grp(q)+"^t")+". Divide to obtain "+m("\\left(\\dfrac{"+num(p)+"}{"+num(q)+"}\\right)^t="+frac(B,A))+", then take logarithms."),
  P("Find the common gap then, to three significant figures.",2,ans.sf(A*p**t),"Use "+m(A+grp(p)+"^t")+" at the unrounded time to find a common gap of "+approx(A*p**t)+".")
 ]};
});

add("reciprocal-asymptote-absent-output","2.8","SL2.8.asymptotes",1,"equation","Identify the horizontal asymptote as the missing output",({rng})=>{
 const h=rng.int(2,14),k=rng.nonzero(-14,14),a=rng.nonzero(-9,9);
 const f=num(k)+(a>0?"+":"-")+"\\dfrac{"+Math.abs(a)+"}{"+lin(1,-h)+"}";
 return{params:{h,k,a},stem:"Let "+m("f(x)="+f)+" on its natural domain.",parts:[
  P("Which output does the graph approach as the input grows, but never attain?",2,ans.int(k),"The reciprocal term approaches zero when the magnitude of the input grows. It never equals zero for any finite allowed input.")
 ]};
});

add("refine-bracket","2.10","SL2.10.solve-gdc",2,"table","Refine a numerical root bracket using one new test value",({rng})=>{
 const l=rng.int(1,9),d=rng.int(1,6),L=l*2,R=L+4*d,mid=(L+R)/2,seek=mid+rng.pick([-1,1])*d/3,F=x=>Math.round(3*(x-seek));
 return{params:{L,R,seek,mid},stem:"The difference "+m("D(x)=f(x)-g(x)")+" is continuous and strictly increasing on the interval below. You are solving "+m("f(x)=g(x)")+".",table:{head:[m("x"),N(L),N(mid),N(R)],rows:[[m("D(x)"),N(F(L)),N(F(mid)),N(F(R))]]},parts:[
  P("Give the lower endpoint of the half-interval that still brackets the solution.",2,ans.int(seek<mid?L:mid),"Choose the half containing the change of sign of the difference."),
  P("Give the upper endpoint of that half-interval.",1,ans.int(seek<mid?mid:R),"Strict increase and continuity guarantee one crossing in the bracket.")
 ]};
});

add("unit-chain-ready","2.5","SL2.5.composite-expression",0,"words","Match the output units of one step to the input units of another",({rng})=>{
 const rate=rng.int(3,13),cases=[["minutes","litres","euros"],["hours","kilometres","points"],["days","kilograms","credits"]];
 const [a,b,c]=rng.pick(cases);
 return{params:{a,b,c,rate},stem:"A two-step calculator converts "+a+" to "+b+" at a rate of "+N(rate)+" "+b+" per "+(a==="minutes"?"minute":a==="hours"?"hour":"day")+". Its next step converts "+b+" to "+c+".",parts:[
  P("What must be passed from the first step to the second?",1,C(rng,item(b,"middle"),item(a,"first"),item(c,"final")),"The first output must have the units required as input by the second step.")
 ]};
},{supports:["SL2.5.composite-value","SL2.5.composite-expression"]});

add("reciprocal-linear-tradeoff","2.8","SL2.8.rational-model",5,"words","Balance a reciprocal penalty against a rising linear cost",({rng})=>{
 const a=rng.int(81,179),b=rng.int(13,25)/10,s=Math.sqrt(a/b),B=Number((2.45*Math.sqrt(a*b)).toFixed(1)),disc=Math.sqrt(B*B-4*a*b);
 const f=x=>a/x+b*x,l=(B-disc)/(2*b),r=(B+disc)/(2*b),base=s*1.8;
 return{params:{a,b,B,base},stem:"A controller uses a positive setting "+m("x")+" with total cost "+m("C(x)=\\dfrac{"+a+"}{x}+"+num(b)+"x")+". The first term is a penalty that decreases with setting; the second is a cost that increases with setting. The budget is "+N(B)+" cost units. The current setting is "+N(Number(base.toFixed(6)))+".",parts:[
  P("Use technology to find the setting of minimum total cost, to three significant figures.",2,ans.sf(s),"Graph the total cost for positive settings and find its minimum; neither individual term is the full cost."),
  P("Find the minimum cost to three significant figures.",2,ans.sf(f(s)),"Read the total cost at the minimum, retaining the unrounded setting."),
  P("Find the lower and upper budget-boundary settings to three significant figures. Enter the lower setting here.",2,ans.sf(l),"Find the intersection of the total cost graph with the budget line to the left of the minimum."),
  P("Enter the upper budget-boundary setting.",2,ans.sf(r),"The total cost rises again to the right. The budget is met between the two crossings, inclusive."),
  P("Find the cost saving when moving from the current setting to the minimum-cost setting, to three significant figures.",2,ans.sf(f(Number(base.toFixed(6)))-f(s)),"Evaluate the model at the current setting and subtract the minimum cost.")
 ]};
},{syllabus:["2.8","2.4"],skills:["SL2.8.rational-model","SL2.4.max-min","SL2.4.intersection"]});
})(globalThis);
