/* Original Functions practice extensions for the four IB Mathematics courses. */
(function (root) {
  "use strict";
  const E=root.QBEngine,{ans,fmt}=E;
  const {num,poly,lin,frac,point,factor,br,paren,sf}=fmt;
  const P=(prompt,marks,answer,...working)=>({prompt,marks,answer,working});
  const sq=(h)=>"("+lin(1,-h)+")^{2}";
  const cube=(h)=>"("+lin(1,-h)+")^{3}";
  const fx=(a,h,k,p=2)=>fmt.expr([[a,p===2?sq(h):cube(h)],[k,""]]);
  const m=(s)=>"$"+s+"$";
  const Q=(u,v,w)=>"\\dfrac{"+u+"}{"+v+"}"+(w? w : "");
  const iv=(a,b,cl=true,cr=true)=>(cl?"[":"(")+a+",\\, "+b+(cr?"]":")");
  const S=(x)=>ans.self(m(x));
  const add=(id,home,code,skill,level,rep,title,build,options={})=>E.registerAll({home,calculator:level>=4},[{
    id:"fn-scale-"+id+"/reasoning/"+rep,type:"fn-scale-"+id,unknown:"reasoning",representation:rep,format:"value",levels:[level],
    syllabus:[code],skills:[skill],title,build,...options
  }]);
  const polyprod=(roots,a=1)=>{let p=[a];for(const r of roots){let n=[0,...p];p.forEach((v,i)=>n[i]-=r*v);p=n;}return p.reverse();};
  const term=(a,s)=>fmt.expr([[a,s]]);
  const candidate=(rng,right,wrong)=>ans.choice(rng,right,wrong);
  const opt=(text,value,why)=>({text,value,why});

  // Common functions, notation, and evidence from tables.
  add("finite-range","aa-sl","2.2","SL2.2.range",1,"table","Add the distinct outputs of a finite function",({rng})=>{
    const a=rng.int(-8,1),b=a+rng.int(2,6),c=b+rng.int(2,7),r=rng.int(-4,4);
    const x=[r-3,r,r+1,r+4,r+6],y=rng.shuffle([a,a,b,c,c]);
    return {params:{x,y},stem:"The table lists every input and output of a function.",table:{head:["Input",...x.map(v=>m(num(v)))],rows:[["Output",...y.map(v=>m(num(v)))]]},parts:[
      P("Find the sum of the distinct numbers in the range.",2,ans.int(a+b+c),"The range records output values without repetition.", "List "+m("\\{"+[a,b,c].join(", ")+"\\}")+"; their sum is "+m(num(a+b+c))+".")
    ]};
  });
  add("inverse-input-audit","aa-sl","2.2","SL2.2.inverse-undo",2,"table","Check where a finite inverse is defined",({rng})=>{
    const x=[0,1,2,3];
    const start=rng.int(-8,4),lo=rng.int(9,19),gap=rng.int(2,5),xs=x.map(i=>i+start),ys=rng.shuffle([lo,lo+gap,lo+2*gap,lo+3*gap]),k=rng.int(0,3);
    const target=ys[k],off=lo+1;
    return {params:{xs,ys,target,off},stem:"The table gives the complete definition of "+m("f")+".",table:{head:["Input",...xs.map(v=>m(num(v)))],rows:[["Output",...ys.map(v=>m(num(v)))]]},parts:[
      P("Find "+m("f^{-1}("+target+")")+".",2,ans.int(xs[k]),"An inverse undoes the original function, so look for the input with output "+m(num(target))+".","The matching input is "+m(num(xs[k]))+"."),
      P("Is "+m("f^{-1}("+off+")")+" defined?",1,candidate(rng,opt("No",0),[opt("Yes, because the inverse accepts every real number.",1,"The input of the inverse must be among the original outputs."),opt("Yes, because it lies between two listed outputs.",2,"The table is the complete definition; it does not fill gaps between its outputs.")]),"The domain of the inverse is the range of "+m("f")+".","The number "+m(num(off))+" does not appear in the output row.")
    ]};
  });
  add("line-axis-area","aa-sl","2.1","SL2.1.intercepts",2,"equation","Find a triangle area from both intercepts",({rng})=>{
    const a=rng.int(2,9),b=rng.int(3,10);
    return {params:{a,b},stem:"The line "+m(b+"x + "+a+"y = "+a*b)+" and the coordinate axes enclose a triangle.",parts:[
      P("Find the "+m("x")+"-intercept.",1,ans.int(a),"Set "+m("y=0")+". The intercept is "+m(num(a))+"."),
      P("Find the area of the triangle.",3,ans.frac(a*b,2),"Set "+m("x=0")+" to find the height "+m(num(b))+".","Area "+m("=\\dfrac{1}{2}\\times "+a+"\\times "+b+" = "+frac(a*b,2))+".")
    ]};
  });
  add("graph-other-branch","aa-sl","2.4","SL2.4.symmetry",2,"graph","Use symmetry to locate a matching marked height",({rng})=>{
    const h=rng.int(-3,3),k=rng.int(-5,1),d=rng.int(2,5),c=h-d,Y=k+d*d;
    return {params:{h,k,c,Y},stem:"The graph of a quadratic has labelled vertex "+m("\\mathrm{V}")+" and passes through the plotted point "+m("\\mathrm{A}")+". Point "+m("\\mathrm{B}")+" has the same height as "+m("\\mathrm{A}")+" and lies on the other side of the axis of symmetry.",graph:{x:[h-d-2,h+d+2],y:[k-2,Y+5],xStep:1,yStep:5,functions:[{fn:{type:"poly",coeffs:[h*h+k,-2*h,1]}}],points:[{x:h,y:k,label:"V"},{x:c,y:Y,label:"A"}],alt:"A parabola with one marked branch point and its vertex."},parts:[
      P("State the "+m("x")+"-coordinate of the axis of symmetry.",1,ans.int(h),"The axis is the vertical line through the vertex."),
      P("Find the "+m("x")+"-coordinate of "+m("\\mathrm{B}")+".",2,ans.int(h+d),"The two points are the same horizontal distance from the axis.","Their average "+m("x")+"-coordinate is "+m(num(h))+", so the missing coordinate is "+m(num(h+d))+".")
    ]};
  });

  // AA HL: recover algebraic structure, classify intervals and handle domain traps.
  add("ahl-two-remainders","aa-hl","2.12","AHL2.12.remainder-theorem",3,"equation","Recover a cubic from two independent remainders",({rng})=>{
    const a=rng.nonzero(-6,6),b=rng.nonzero(-9,9),u=rng.int(1,4),v=-rng.int(1,4);
    const R=x=>x**3+a*x+b, F=poly([1,0,0,0])+" + ax + b";
    return {params:{u,v,ru:R(u),rv:R(v)},stem:"Let "+m("p(x)="+F)+". Its remainders on division by "+m(lin(1,-u))+" and "+m(lin(1,-v))+" are "+m(num(R(u)))+" and "+m(num(R(v)))+", respectively.",parts:[
      P("Find "+m("a")+".",3,ans.int(a),"Apply the remainder theorem at both inputs.",m(lin(u,0,"a")+" + b = "+num(R(u)-u**3))+" and "+m(lin(v,0,"a")+" + b = "+num(R(v)-v**3))+".","Subtract the two equations to eliminate "+m("b")+"."),
      P("Find "+m("b")+".",2,ans.int(b),"Substitute "+m("a="+a)+" in either linear equation.","This gives "+m("b="+b)+".")
    ]};
  });
  add("ahl-root-product","aa-hl","2.12","AHL2.12.sum-product-roots",2,"equation","Recover two roots from the given root and Vieta constraints",({rng})=>{
    const r=-rng.int(2,8),s=rng.int(1,4),t=s+rng.int(2,6),a=rng.int(2,4),p=polyprod([r,s,t],a);
    return {params:{p,r},stem:"The polynomial "+m("p(x)="+poly(p))+" has one known root "+m(num(r))+".",parts:[
      P("Find the sum of the other two roots.",2,ans.int(s+t),"The sum of all roots is minus the quadratic coefficient divided by the leading coefficient.","Subtract the known root to obtain "+m(num(s+t))+"."),
      P("Find the product of the other two roots.",2,ans.int(s*t),"The product of all roots is minus the constant divided by the leading coefficient.","Divide by the known root to obtain "+m(num(s*t))+".")
    ]};
  });
  add("ahl-hole-pole","aa-hl","2.13","AHL2.13.vertical-asymptotes",3,"equation","Distinguish a removable hole from a true vertical asymptote",({rng})=>{
    const h=rng.int(-7,-1),p=rng.int(2,8),r=rng.int(10,15),c=rng.int(2,5);
    const top=polyprod([h,r],c),den=polyprod([h,p]);
    return {params:{top,den,h,p},stem:"The function "+m("f(x)="+Q(poly(top),poly(den)))+" is defined wherever the displayed denominator is nonzero.",parts:[
      P("Find the "+m("x")+"-coordinate of the removable hole.",2,ans.int(h),"Factor both polynomials and cancel their common factor, retaining the original exclusion.",m(factor(h))+" is common."),
      P("Find the "+m("x")+"-coordinate of the vertical asymptote.",2,ans.int(p),"The uncancelled denominator is "+m(factor(p))+".","The simplified numerator is nonzero at "+m("x="+p)+"."),
      P("Find the "+m("y")+"-coordinate of the missing point.",2,ans.frac(c*(h-r),h-p),"Evaluate the simplified expression at the input of the hole.","Its limiting output is "+m(frac(c*(h-r),h-p))+".")
    ]};
  });
  add("ahl-rational-range-disc","aa-hl","2.13","AHL2.13.range-rational",3,"equation","Find range boundaries of a rational function using attainability",({rng})=>{
    const h=rng.int(-5,5),k=rng.int(-5,5),a=rng.int(2,9),p=rng.int(2,6);
    const rhs=fmt.expr([[1,sq(h)],[p,""]]);
    return {params:{h,k,a,p},stem:"The function "+m("f(x)="+fmt.expr([[k,""],[1,Q(a,rhs)]]))+" is defined for every real "+m("x")+".",parts:[
      P("Find the greatest attained output.",3,ans.frac(k*p+a,p),"The denominator is at least "+m(num(p))+" because the square is nonnegative.","Equality occurs at "+m("x="+h)+"; the reciprocal term is greatest there."),
      P("State the lower boundary of the range and say whether it is attained.",2,S(iv(k,frac(k*p+a,p),false,true)),"The reciprocal term is strictly positive for every finite input.","It tends to zero as the input tends to either infinity. The range is "+m(iv(k,frac(k*p+a,p),false,true))+".")
    ]};
  });
  add("ahl-reciprocal-symmetry","aa-hl","2.14","AHL2.14.odd-even-test",2,"equation","Choose the constant that makes a rational function odd",({rng})=>{
    const a=rng.int(2,6),b=rng.int(2,10),d=rng.int(-7,7),c=rng.int(2,7);
    return {params:{a,b,c,d},stem:"Let "+m("f(x)="+Q(term(a,"x^{3}")+" + kx + "+b,poly([1,0,c])))+" and "+m("g(x)=f(x) + m")+". An integer "+m("k="+d)+" is fixed.",parts:[
      P("Suppose the constant term in the numerator can be changed. What should it be for the function to be odd when "+m("m = 0")+"?",1,ans.int(0),"The denominator is even. For the quotient to be odd the numerator must be odd, so its constant term must vanish."),
      P("Is there any constant "+m("m")+" that makes the given "+m("g")+" odd?",2,candidate(rng,opt("No",0),[opt("Yes, exactly one constant works.",1,"The nonzero even part varies with the input and cannot be cancelled by one constant."),opt("Yes, every constant works.",2,"An odd function must vanish at the origin, and a nonzero even part obstructs oddness elsewhere.")]),"An odd function has "+m("g(x)+g(-x)=0")+" for every input.","Here the sum is "+m(Q(2*b,poly([1,0,c]))+" + 2m")+"; this is not a constant function for any "+m("m")+".")
    ]};
  });
  add("ahl-restricted-sqrt","aa-hl","2.14","AHL2.14.inverse-restricted",3,"equation","Invert a left-branch quadratic without taking the right square root",({rng})=>{
    const a=rng.int(2,5),h=rng.int(-5,5),k=rng.int(-7,1),j=rng.int(2,6),Y=k+a*j*j;
    const inside=Q(lin(1,-k,"x"),a),inverse=fmt.expr([[h,""],[-1,"\\sqrt{"+inside+"}"]]);
    return {params:{a,h,k,Y},stem:"Let "+m("f(x)="+fx(a,h,k))+" with domain "+m("x\\le "+h)+".",parts:[
      P("Determine the domain of the inverse function.",2,S(iv(k,"\\infty",true,false)),"The range of the original left-hand branch is "+m("y\\ge "+k)+".","This is the domain of the inverse."),
      P("Find "+m("f^{-1}("+Y+")")+".",3,ans.int(h-j),"Solve "+m("y="+fx(a,h,k))+" for the original input.","Only the negative square-root branch makes the original input at most "+m(num(h))+".",m("f^{-1}(x)="+inverse)+" gives "+m(num(h-j))+".")
    ]};
  });
  add("ahl-cross-pole-inequality","aa-hl","2.15","AHL2.15.rational-inequality",3,"equation","Solve a rational inequality without multiplying by an unknown sign",({rng})=>{
    const a=-rng.int(2,8),b=rng.int(1,4),c=b+rng.int(2,7),n=polyprod([a,c]);
    const right=m(iv(a,b,true,false)+"\\cup"+iv(c,"\\infty",true,false));
    return {params:{a,b,c,n},stem:"Consider the inequality "+m(Q(poly(n),factor(b))+"\\ge 0")+".",parts:[
      P("State the input excluded from the domain.",1,ans.int(b),"The denominator vanishes at "+m("x="+b)+"."),
      P("Choose the complete solution set.",4,candidate(rng,opt(right,"right"),[
        opt(m(iv(a,b)+"\\cup"+iv(c,"\\infty",true,false)),"incl-pole","A zero denominator is excluded even with a non-strict inequality."),
        opt(m(iv("-\\infty",a,false,true)+"\\cup"+iv(b,c,false,true)),"wrong-sign","Test a point in each interval; do not assume the denominator stays positive."),
        opt(m(iv(a,c)),"numerator-only","The denominator can change sign, so the numerator alone does not determine the sign.")]),
      "Use the two zeros and the excluded input to split the number line.","Testing signs in order gives "+m("-,+, -, +")+". Include the two zeros, not the excluded input.")
    ]};
  });
  add("ahl-cubic-sign-repeated","aa-hl","2.15","AHL2.15.polynomial-inequality",3,"equation","Use a repeated root without switching the sign there",({rng})=>{
    const h=-rng.int(2,7),r=rng.int(2,8),a=rng.int(1,4),n=polyprod([h,h,r],a);
    return {params:{h,r,a,n},stem:"Let "+m("p(x)="+poly(n))+".",parts:[
      P("Find the smaller zero of "+m("p")+".",2,ans.int(h),"Factor the polynomial.",m("p(x)="+term(a,factor(h)+"^{2}"+factor(r)))+"."),
      P("Choose the solution of "+m("p(x)<0")+".",3,candidate(rng,opt(m(iv("-\\infty",h,false,false)+"\\cup"+iv(h,r,false,false)),"strict-with-hole"),[
        opt(m(iv("-\\infty",r,false,false)),"missing-hole","The repeated root gives zero and must be excluded."),
        opt(m(iv(h,r,false,false)),"one-side","The squared factor has the same sign on both sides of its zero."),
        opt(m(iv(r,"\\infty",false,false)),"reversed","The linear factor is negative to the left of the larger root.")]),
        "The squared factor is positive except at its zero.","The linear factor is negative left of the larger root. Exclude both zeros because the inequality is strict.")
    ]};
  });
  add("ahl-modulus-inverse-level","aa-hl","2.16","AHL2.16.modulus-equation",3,"equation","Count branches of a modulus parabola against a horizontal level",({rng})=>{
    const h=rng.int(-5,5),d=rng.int(4,8),j=rng.int(1,d-1),Y=d*d-j*j;
    return {params:{h,d,j,Y},stem:"Let "+m("f(x)=\\left|"+poly([1,-2*h,h*h-d*d])+"\\right|")+".",parts:[
      P("How many distinct real solutions does "+m("f(x)="+Y)+" have?",2,ans.int(4),"Split the modulus equation into two ordinary equations, with right sides "+m(num(Y))+" and "+m(num(-Y))+".","Both resulting squared expressions equal positive and different numbers."),
      P("Of the two solutions to the left of the axis of symmetry, find the one closest to the axis.",3,ans.int(h-j),"The smaller squared displacement is "+m("("+lin(1,-h)+")^{2}="+j*j)+".","Choose the negative displacement to give "+m(num(h-j))+".")
    ]};
  });
  add("ahl-squared-collapse","aa-hl","2.16","AHL2.16.squared-or-composite",2,"equation","Track sign loss and duplicate outputs after squaring",({rng})=>{
    const a=rng.int(2,6),h=rng.int(-7,7),d=rng.int(2,6),Y=(a*d)**2;
    return {params:{a,h,d,Y},stem:"Given "+m("f(x)="+term(a,factor(h)))+", define "+m("g(x)=[f(x)]^{2}")+".",parts:[
      P("Find the smaller input whose output under "+m("g")+" is "+m(num(Y))+".",2,ans.int(h-d),"The original function can equal either sign of the square root.",m("f(x)=-"+a*d)+" gives the smaller input."),
      P("Find the difference between the two inputs.",2,ans.int(2*d),"The two inputs lie the same distance either side of "+m(num(h))+".","That distance is "+m(num(d))+", so their separation is "+m(num(2*d))+".")
    ]};
  });

  add("inverse-reflect-coordinates","aa-sl","2.2","SL2.2.inverse-undo",0,"equation","Reflect a point onto the inverse graph",({rng})=>{
    const x=rng.int(-9,-1),y=rng.int(1,9);
    return {params:{x,y},stem:m(point(x,y))+" lies on the graph of an invertible function "+m("f")+".",parts:[
      P("Find "+m("f^{-1}("+y+")")+".",2,ans.int(x),"The given point means "+m("f("+x+")="+y)+".","The inverse reverses this input and output.")
    ]};
  });
  add("transform-fixed-height","aa-sl","2.11","SL2.11.image-point",2,"equation","Track a marked point through a horizontal reflection and shift",({rng})=>{
    const a=rng.nonzero(-7,7),b=rng.int(1,8),h=rng.int(2,9),k=-rng.int(2,8);
    return {params:{a,b,h,k},stem:"The point "+m(point(a,b))+" lies on the graph of "+m("y=f(x)")+". A new graph has equation "+m("y=f("+lin(-1,h)+")"+fmt.signed(k))+".",parts:[
      P("Find the new input corresponding to the original input "+m(num(a))+".",2,ans.int(h-a),"The input to "+m("f")+" must remain "+m(num(a))+".",m(lin(-1,h)+"="+a)+" so the new input is "+m(num(h-a))+"."),
      P("Find the corresponding new output.",1,ans.int(b+k),"The vertical translation changes the original output by "+m(num(k))+".")
    ]};
  });

  // Applications SL and HL: fit, validate, interpret and restrict contextual models.
  add("ai-tariff-break-even","ai-sl","2.5","AI-SL2.5.piecewise-linear",4,"words","Choose the correct piece of a tiered tariff before solving",({rng})=>{
    const b=rng.int(3,9),r=rng.int(5,9),s=rng.int(2,r-2),d=rng.int(2,7),f=rng.int(5,14),at=f+r*b,t=at+s*d;
    return {params:{b,r,s,f,t},stem:"A tool library charges a fixed fee of "+m(fmt.unit(f,"euros"))+". It charges "+m(fmt.unit(r,"euros"))+" per hour for the first "+m(fmt.unit(b,"hours"))+" and "+m(fmt.unit(s,"euros"))+" for each further hour. Partial hours are charged proportionally.",parts:[
      P("Find the total charge at the change in hourly rate.",2,ans.int(at),"Add the fixed fee and the charge for the first tier.",m(f+"+"+r+"\\times "+b+"="+at)+"."),
      P("For what total time is the charge "+m(fmt.unit(t,"euros"))+"?",3,ans.int(b+d),"The total exceeds the charge at the end of the first tier.","Divide the remaining charge by the further-hour rate, then add the time in the first tier.",m(b+"+"+Q(t-at,s)+"="+(b+d))+" hours.")
    ]};
  },{niceOk:true});
  add("ai-quadratic-reconstruction-context","ai-sl","2.5","AI-SL2.5.quadratic-model",4,"words","Reconstruct a quadratic arch from its floor contacts and a measured height",({rng})=>{
    const w=rng.int(5,9),a=rng.int(1,w-1),h=rng.int(3,9),v=rng.int(1,w-1),x=w+v,c=h/(w*w-v*v);
    return {params:{w,h,x,a},stem:"An arch is modelled by a quadratic. Its cross-section meets a level floor at "+m(num(0))+" and "+m(fmt.unit(2*w,"m"))+" from the left-hand end. The arch has height "+m(fmt.unit(h,"m"))+" at a distance of "+m(fmt.unit(x,"m"))+" from that end.",parts:[
      P("Find the distance from the left-hand end to the point of greatest height.",2,ans.int(w),"The two floor contacts are symmetric about the highest point.","Take the midpoint of the two distances."),
      P("Find the greatest height.",3,ans.sf(c*w*w),"Write the height as "+m("C\\,x("+lin(-1,2*w)+")")+".","Use the measured height to find "+m("C")+" and substitute the midpoint."),
      P("Find the height at distance "+m(fmt.unit(a,"m"))+" from the left-hand end.",2,ans.sf(c*a*(2*w-a)),"Substitute that distance into the fitted arch equation.")
    ]};
  });
  add("ai-power-scaling","ai-sl","2.5","AI-SL2.5.variation",2,"words","Use two measurements to identify a power model",({rng})=>{
    const x=rng.int(2,5),a=rng.int(2,7),n=rng.pick([2,3]),r=rng.pick([2,3]),y=a*x**n,z=a*(r*x)**n;
    return {params:{x,y,r,z},stem:"A model has the form "+m("y=ax^{n}")+", where "+m("n")+" is a positive integer. The output is "+m(num(y))+" when "+m("x="+x)+" and "+m(num(z))+" when "+m("x="+r*x)+".",parts:[
      P("Find "+m("n")+".",2,ans.int(n),"Divide the two outputs. The input is multiplied by "+m(num(r))+", so the output is multiplied by "+m(r+"^{n}")+".",m(r+"^{n}="+num(z/y))+"."),
      P("Find "+m("a")+".",2,ans.int(a),"Substitute either measured input and output into the fitted power model.","Divide the output by the input raised to the fitted power.")
    ]};
  });
  add("ai-validation-errors","ai-sl","2.6","AI-SL2.6.test-model",4,"table","Choose a model using errors on held-out observations",({rng})=>{
    const x=rng.int(1,5),y=rng.int(18,27),g=rng.int(2,6),bad=rng.int(4,7),better=rng.bool();
    const actual=[y,y+g,y+2*g,y+3*g],near=actual.map((v,j)=>v+[1,-2,2,0][j]),far=actual.map((v,j)=>v+[bad,-bad,bad,-bad][j]),a=better?near:far,b=better?far:near;
    return {params:{actual,a,b},stem:"Two models were fitted using older data. The table gives forecasts for a separate batch of observations. The models will be compared by their mean absolute prediction error.",table:{head:["Index",...Array.from({length:4},(_,i)=>m(num(x+i)))],rows:[["Observed",...actual.map(v=>m(num(v)))],["Model A",...a.map(v=>m(num(v)))],["Model B",...b.map(v=>m(num(v)))]]},parts:[
      P("Find the mean absolute prediction error for Model A.",2,ans.frac(better?5:4*bad,4),"For each column take the absolute difference between forecast and observation.","Average the four absolute values."),
      P("Find the mean absolute prediction error for Model B.",2,ans.frac(better?4*bad:5,4),"Apply the same check to the Model B row."),
      P("Which model has the smaller mean absolute prediction error?",1,candidate(rng,opt(better?"Model A":"Model B",better?"A":"B"),[opt(better?"Model B":"Model A",better?"B":"A","Compare absolute errors on the separate observations."),opt("The two models tie.","tie","The mean absolute errors are different.")]),"Choose the model with the smaller mean absolute error on the new observations.")
    ]};
  },{niceOk:true});
  add("ai-extrapolation-domain","ai-sl","2.6","AI-SL2.6.predict-reliability",2,"words","Separate the validity of a formula from the evidence for a prediction",({rng})=>{
    const a=rng.int(2,6),b=rng.int(9,18),r=rng.int(7,14),j=r+rng.int(2,7),j0=rng.int(2,r-2);
    return {params:{a,b,r,j,j0},stem:"A workshop recorded weekly attendance from week "+m(num(1))+" through week "+m(num(r))+". Its proposed model is "+m("N(t)="+lin(a,b,"t"))+".",parts:[
      P("Calculate the modelled attendance in week "+m(num(j0))+".",1,ans.int(a*j0+b),"Substitute the stated week into the model."),
      P("Choose the claim that the data alone support about applying the model in week "+m(num(j))+".",2,candidate(rng,opt("The formula produces a value, but this is an extrapolation.",1),[
        opt("This is interpolation because the equation is defined at that input.",0,"Interpolation refers to the observed input interval, not the algebraic domain."),
        opt("The formula does not produce a value for that week.",2,"A linear expression is defined there; the issue is the evidence for the estimate.")]),"The later week lies outside the observed interval.","The trend may not continue beyond the available data.")
    ]};
  });

  // AI HL: composition in context, nonlinear models, logarithmic scales and transformed data.
  add("ai-functional-calibration","ai-hl","2.7","AI-AHL2.7.composite-equation",4,"words","Reverse two calibration steps in the right order",({rng})=>{
    const a=rng.int(2,4),b=rng.int(3,7),p=rng.int(2,5),q=rng.int(4,8),t=rng.int(2,8),raw=a*t+b,Y=p*raw+q;
    return {params:{a,b,p,q,Y},stem:"A controller first converts setting "+m("x")+" to raw output "+m("f(x)="+lin(a,b))+". Its display then applies "+m("g(y)="+lin(p,q,"y"))+" to the raw output.",parts:[
      P("Write the display function in the form "+m("Ax+B")+".",2,S(lin(p*a,p*b+q)),"The display receives the raw output, so the function is "+m("(g\\circ f)(x)")+".","Substitute and expand to obtain "+m(lin(p*a,p*b+q))+"."),
      P("Find the raw output when the display reads "+m(num(Y))+".",2,ans.int(raw),"Undo the display conversion first.","Subtract its constant, then divide by its multiplier."),
      P("Find the original controller setting.",2,ans.int(t),"Now undo the raw-output conversion to recover the setting.")
    ]};
  },{niceOk:true});
  add("ai-compose-valid-input","ai-hl","2.7","AI-AHL2.7.inverse-domain-range",2,"words","Pull an instrument's range of acceptable readings back to valid settings",({rng})=>{
    const m0=rng.int(2,7),a=rng.int(3,7),l=rng.int(1,5),h=l+rng.int(3,7),p=m0*l+a,q=m0*h+a;
    return {params:{m0,a,p,q},stem:"A controller uses "+m("r="+lin(m0,a,"s"))+" to turn setting "+m("s")+" into a reading "+m("r")+". An attached meter only accepts readings in "+m(iv(p,q))+".",parts:[
      P("Find the smallest allowed setting.",2,ans.int(l),"The relationship is increasing.","Solve the equation obtained by setting the reading equal to the lower accepted value."),
      P("Find the greatest allowed setting.",2,ans.int(h),"Set the reading equal to the upper accepted value and solve.")
    ]};
  });
  add("ai-logistic-target","ai-hl","2.9","AI-AHL2.9.logistic-model",4,"words","Find when a logistic model reaches a target fraction of capacity",({rng})=>{
    const L=rng.int(8,22)*25,c=rng.int(4,15),k=rng.int(2,7)/10,f=rng.pick([2,3,4,5]),Y=L*(f-1)/f,t=Math.log(c*(f-1))/k;
    const model=Q(num(L),"1+"+c+"\\mathrm{e}^{-"+num(k)+"t}");
    return {params:{L,c,k,Y},stem:"The cumulative enrolment in a learning portal is modelled by "+m("N(t)="+model)+", with "+m("t")+" in weeks.",parts:[
      P("State the carrying capacity.",1,ans.int(L),"As time increases, the exponential term tends to zero.","The denominator tends to one."),
      P("Find the time at which the model reaches "+m(frac(f-1,f))+" of this capacity.",4,ans.sf(t),"Equate the model to the target fraction of its capacity.","Rearrangement gives "+m("\\mathrm{e}^{-"+num(k)+"t}="+frac(1,c*(f-1)))+".","Take natural logarithms and divide by "+m(num(-k))+".")
    ]};
  });
  add("ai-half-life-delay","ai-hl","2.9","AI-AHL2.9.half-life",4,"words","Infer half-life from two later observations, then predict a threshold",({rng})=>{
    const from=rng.int(2,8),d=rng.int(3,9),a=rng.int(8,18)*4,div=rng.pick([3,5,6,7]),t=from+d*Math.log2(div),goal=frac(a,div);
    return {params:{from,d,a,div},stem:"A tracer is assumed to follow exponential decay. Its mass is "+m(fmt.unit(a,"mg"))+" at time "+m(fmt.unit(from,"h"))+" and "+m(fmt.unit(a/2,"mg"))+" at time "+m(fmt.unit(from+d,"h"))+".",parts:[
      P("Find the half-life of the tracer.",2,ans.int(d),"The two observations differ by exactly one halving.","Use the elapsed time rather than either time reading."),
      P("Find the time, measured from the initial time origin, when the mass is "+m(goal+"\\text{ mg}")+".",3,ans.sf(t),"Measure elapsed time from the first recorded mass.",m("(t-"+from+")\\div "+d+"=\\log_{2} "+div)+".","Add the time of the first observation after calculating the elapsed time.")
    ]};
  });
  add("ai-piecewise-join-slope","ai-hl","2.9","AI-AHL2.9.piecewise-join",3,"equation","Choose a quadratic segment that meets a linear ramp and a later checkpoint",({rng})=>{
    const h=rng.int(2,7),d=rng.int(2,5),a=rng.int(2,6),b=rng.int(2,9),A=rng.int(2,5),B=a*h+b,Y=A*d*d+B;
    return {params:{h,d,a,b,Y},stem:"A process uses "+m("p(t)="+lin(a,b,"t"))+" for "+m("0\\le t\\le "+h)+" and "+m("Q(t)=A("+lin(1,-h,"t")+")^{2}+B")+" for "+m("t>"+h)+". The two pieces join without a jump, and "+m("Q("+(h+d)+")="+Y)+".",parts:[
      P("Find "+m("B")+".",2,ans.int(B),"At the join the square is zero.","Match the value of "+m("p")+" at the joining time."),
      P("Find "+m("A")+".",3,ans.int(A),"Substitute the checkpoint time and value into the quadratic segment.","Subtract the joining value and divide by the square of the time since the join.")
    ]};
  });
  add("ai-sinusoid-cycle-window","ai-hl","2.9","AI-AHL2.9.sinusoidal-phase",4,"words","Use a known maximum and period to identify the next descending crossing",({rng})=>{
    const m0=rng.int(5,15),A=rng.int(4,10),t0=rng.int(2,8),p=rng.int(7,19),ratio=rng.pick([.25,.35,.45,.65,.75]),Y=m0+A*ratio,ansT=t0+p*Math.acos(ratio)/(2*Math.PI);
    return {params:{m0,A,t0,p,Y},stem:"The height of a marker oscillates sinusoidally with midline "+m(fmt.unit(m0,"m"))+", amplitude "+m(fmt.unit(A,"m"))+" and period "+m(fmt.unit(p,"s"))+". The marker is at its highest point when "+m("t="+t0)+" seconds.",parts:[
      P("Find the time of the next minimum.",2,ans.dec(t0+p/2),"The next minimum follows the maximum by half a period."),
      P("Find the first time after the stated maximum when the height is "+m(fmt.unit(Y,"m"))+".",3,ans.sf(ansT),"A cosine starting at its maximum models the movement.","Normalise the target by subtracting the midline and dividing by the amplitude.","Use the first cosine crossing after the maximum, then convert the angle to time.")
    ]};
  });
  add("ai-logarithmic-combination","ai-hl","2.10","AI-AHL2.10.log-scale",4,"words","Convert a logarithmic scale back before adding intensities",({rng})=>{
    const l=rng.int(41,62),d=rng.int(2,14),L=l+d,ratio=10**(d/10),sum=L+10*Math.log10(1+1/ratio);
    return {params:{l,L},stem:"Sound level is defined by "+m("L=10\\log_{10}\\left("+Q("I","I_{0}")+"\\right)")+", where "+m("I")+" is intensity. Two independent sources have levels "+m(fmt.unit(l,"dB"))+" and "+m(fmt.unit(L,"dB"))+". At the microphone their intensities add.",parts:[
      P("Find the ratio of the higher intensity to the lower intensity.",2,ans.sf(ratio),"The level difference is ten times the base-ten logarithm of the intensity ratio.","Raise ten to that difference divided by ten."),
      P("Find the overall sound level.",3,ans.sf(sum),"Add the intensities rather than the levels.","Relative to the stronger source, the new intensity is multiplied by one plus the reciprocal of the ratio.","Convert that multiplier into a level increase.")
    ]};
  });
  add("ai-linearised-power-predict","ai-hl","2.10","AI-AHL2.10.predict-from-line",4,"table","Read a line on log-log axes and predict in the original units",({rng})=>{
    const n=rng.pick([2,3]),c=rng.int(-2,2),q=rng.int(11,19)/10,Y=10**(c+n*q);
    return {params:{n,c,q},stem:"A power model "+m("y=Ax^{n}")+" is examined on logarithmic axes. The table gives two points on the fitted line.",table:{head:["Quantity","First point","Second point"],rows:[[m("\\log_{10} x"),m("1"),m("2")],[m("\\log_{10} y"),m(num(c+n)),m(num(c+2*n))]]},parts:[
      P("Find the exponent "+m("n")+".",2,ans.int(n),"The exponent is the gradient of the line in the transformed coordinates.","Divide the difference in transformed outputs by the difference in transformed inputs."),
      P("Predict "+m("y")+" when "+m("\\log_{10} x="+num(q))+".",3,ans.sf(Y),"Use either table point and the fitted gradient to find the transformed output.","Raise ten to the transformed output to return to the original units.")
    ]};
  });
  add("ai-semilog-two-stage","ai-hl","2.10","AI-AHL2.10.linear-form",5,"table","Use a semi-log line to compare two decay paths and assess a mismatch",({rng})=>{
    const c=rng.int(15,25)/10,r=rng.int(2,5)/10,off=rng.int(2,8)/10,q=c-off,a=rng.int(1,6)/10,t=2,logy=c-r*t,k=Math.log(10)*r,l=c+1;
    const other=r+a,cross=(l-c)/a,goal=10**q,when=off/r,res=10**(logy-.1)-10**logy;
    return {params:{c,r,a,q,l,t,obslog:logy-.1},stem:"A population model predicts a straight line for "+m("\\log_{10} P")+" against time "+m("t")+". The table records two fitted points from the first model. A second population follows "+m("\\log_{10} Q="+lin(-other,l,"t"))+".",table:{head:["Time",m("0"),m("1")],rows:[[m("\\log_{10} P"),m(num(c)),m(num(c-r))]]},parts:[
      P("Find the gradient of the first fitted line.",2,ans.dec(-r),"Use the two transformed coordinates to calculate rise over run."),
      P("Write the first model in the form "+m("P=A\\mathrm{e}^{-kt}")+". Find "+m("k")+".",2,ans.sf(k),"Exponentiate the base-ten line.","Use "+m("10^{x}=\\mathrm{e}^{x\\ln 10}")+" to identify the decay coefficient."),
      P("Find the time at which the two population models give the same prediction.",2,ans.sf(cross),"Equality of the two positive populations is equivalent to equality of their base-ten logarithms.","Equate the two transformed lines."),
      P("Find when the first population reaches "+m(Math.abs(q-1)<1e-10?"10":"10^{"+num(q)+"}")+".",2,ans.sf(when),"On the transformed scale the target is "+m(num(q))+".","Solve the linear equation on that scale."),
      P("At time "+m(num(t))+" the observed value of "+m("\\log_{10} P")+" is "+m(num(logy-.1))+". Calculate observed minus predicted population in the original units.",2,ans.sf(res),"Exponentiate both transformed values before subtracting.","The signed residual is negative because the observation is smaller than the prediction.")
    ]};
  },{"syllabus":["2.10","2.1"],"skills":["AI-AHL2.10.linear-form","SL2.1.gradient"]});


  // Higher-demand functions for AA SL, added alongside the shared foundations.
  add("graph-sum-from-plots","aa-sl","2.3","SL2.3.sum-difference",2,"graph","Combine outputs read from two plotted functions",({rng})=>{
    const a=rng.int(2,4),b=rng.int(1,5),c=-rng.int(1,3),d=rng.int(2,7),x0=rng.pick([-2,-1,1,2].filter(x=>(a-c)*x!==d-b));
    const A=a*x0+b,B=c*x0+d;
    const x=[-3,3],y=[Math.min(a*x[0]+b,c*x[1]+d)-2,Math.max(a*x[1]+b,c*x[0]+d)+2];
    return {params:{x0},stem:"The plot shows the lines "+m("f")+" and "+m("g")+", with both heights marked at "+m("x="+x0)+".",graph:{x,y,xStep:1,yStep:2,functions:[{fn:{type:"poly",coeffs:[b,a]},label:"f"},{fn:{type:"poly",coeffs:[d,c]},label:"g",dashed:true}],asymptotes:[],points:[{x:x0,y:A},{x:x0,y:B}],alt:"A rising solid line f and a descending dashed line g. The points at the stated input are marked."},parts:[
      P("Read "+m("f("+x0+")")+" from the rising line.",1,ans.int(A),"Use the marked height on the rising line."),
      P("Find "+m("(f-g)("+x0+")")+".",2,ans.int(A-B),"Read the other marked height from the falling line.","Subtract that height from the height on the rising line.")
    ]};
  });
  add("composite-pullback-radical","aa-sl","2.5","SL2.5.composite-expression",3,"equation","Pull a square-root domain through a decreasing inner function",({rng})=>{
    const a=rng.int(2,6),h=rng.int(1,5),u=rng.int(1,7),k=h+a*u,j=rng.int(2,6),input=u-j*j;
    return {params:{a,h,k,input},stem:"Let "+m("f(x)=\\sqrt{"+lin(1,-h)+"}")+" and "+m("g(x)="+lin(-a,k))+".",parts:[
      P("Find the greatest input in the domain of "+m("f\\circ g")+".",3,ans.int(u),"The input to the square root must be nonnegative.",m(lin(-a,k-h)+"\\ge 0")+".","Dividing by a negative coefficient reverses the inequality."),
      P("Express "+m("(f\\circ g)("+input+")")+" as "+m("n\\sqrt{a}")+", where "+m("a="+a)+". Find "+m("n")+".",2,ans.int(j),"Substitute into the composed expression.",m("(f\\circ g)("+input+")=\\sqrt{"+a*j*j+"}="+j+"\\sqrt{"+a+"}")+".")
    ]};
  });
  add("quadratic-equal-heights","aa-sl","2.6","SL2.6.find-equation",3,"table","Reconstruct a quadratic from equal heights and its vertical intercept",({rng})=>{
    const h=rng.int(3,8),d=rng.int(1,h-1),a=rng.pick([-3,-2,2,3]),k=rng.int(-6,8),u=h-d,v=h+d,y=a*d*d+k,y0=a*h*h+k;
    return {params:{u,v,y,y0},stem:"The table gives three values of the quadratic "+m("f(x)=a(x-h)^{2}+k")+".",table:{head:["Input",m("0"),m(num(u)),m(num(v))],rows:[["Output",m(num(y0)),m(num(y)),m(num(y))]]},parts:[
      P("Find "+m("h")+".",2,ans.int(h),"The equal heights lie the same distance on opposite sides of the symmetry axis.","Average the two nonzero inputs."),
      P("Find "+m("a")+".",2,ans.int(a),"Subtract the equations given by the equal height and the vertical intercept.",m("f(0)-f("+u+")=a("+h+"^{2}-"+d+"^{2})")+"."),
      P("Find "+m("k")+".",1,ans.int(k),"Substitute the known coefficient into either height equation and solve.")
    ]};
  });
  add("quadratic-integer-threshold","aa-sl","2.7","SL2.7.discriminant-parameter",3,"equation","Count integer parameters giving no real roots or one repeated root",({rng})=>{
    const h=rng.int(2,7),k=rng.int(1,4),up=k+rng.int(3,8);
    return {params:{h,k,up},stem:"Consider "+m(fmt.expr([[1,"x^{2}"],[-2*h,"x"],[h*h-k,""],[1,"n"]])+"=0")+", where "+m("n")+" is an integer in "+m(iv(0,up))+".",parts:[
      P("Find the value of "+m("n")+" for which the equation has one repeated root.",2,ans.int(k),"Complete the square to obtain "+m(sq(h)+"="+lin(-1,k,"n"))+".","The square vanishes only at this parameter."),
      P("Find the number of permitted integers "+m("n")+" for which there are no real roots.",3,ans.int(up-k),"A negative value on the right gives no real root.","The relevant integers run from "+m(num(k+1))+" to "+m(num(up))+" inclusive.")
    ]};
  });
  add("reciprocal-asymptote-from-samples","aa-sl","2.8","SL2.8.find-constants",5,"table","Recover a reciprocal model and test an unreachable output",({rng})=>{
    const h=rng.int(1,4),k=rng.int(3,8),a=rng.int(2,6)*12,x1=h+1,x2=h+2,x3=h+3,u=h+4;
    const f=x=>k+a/(x-h);
    return {params:{x1,x2,x3,y1:f(x1),y2:f(x2),y3:f(x3),u},stem:"A model of the form "+m("y=c+"+Q("a","x-b"))+" with "+m("a>0")+" fits the table exactly. All observed inputs lie to the right of the vertical asymptote.",table:{head:["Input",...([x1,x2,x3].map(v=>m(num(v))))],rows:[["Output",...([f(x1),f(x2),f(x3)].map(v=>m(num(v))))]]},parts:[
      P("Find "+m("b")+".",3,ans.int(h),"Take consecutive differences to eliminate the vertical shift.",m(Q("y_{1}-y_{2}","y_{2}-y_{3}")+"="+Q("x_{3}-b","x_{1}-b"))+" because the input gaps are equal.","Use the observed differences in this relation and solve."),
      P("Find "+m("a")+".",2,ans.int(a),"Use the difference of the first two outputs, now that the denominator terms are known."),
      P("Find "+m("c")+".",1,ans.int(k),"Substitute one of the given points and subtract the reciprocal term."),
      P("Predict the output at "+m("x="+u)+".",2,ans.int(f(u)),"Evaluate the fitted expression at the new input."),
      P("Explain why the model never attains output "+m("y=c")+".",2,ans.self("The numerator is nonzero, so the reciprocal term cannot vanish at a finite input."),"The horizontal asymptote is approached only in the limit here.")
    ]};
  },{"syllabus":["2.8","2.2"],"skills":["SL2.8.find-constants","SL2.2.range"]});
  add("exponential-shift-three-observations","aa-sl","2.9","SL2.9.find-parameters",3,"table","Fit a shifted exponential by taking consecutive differences",({rng})=>{
    const a=rng.int(2,7),b=rng.int(2,4),c=rng.int(-7,9),x=rng.int(2,5),ys=[0,1,2].map(j=>a*b**j+c);
    return {params:{ys,x},stem:"The table gives values from "+m("y=AB^{x-"+x+"}+C")+", where "+m("A>0")+" and "+m("B>1")+".",table:{head:["Input",...Array.from({length:3},(_,i)=>m(num(x+i)))],rows:[["Output",...ys.map(v=>m(num(v)))]]},parts:[
      P("Find "+m("B")+".",2,ans.int(b),"Take two consecutive differences to remove the common additive constant.","Dividing the later difference by the earlier one gives "+m("B")+"."),
      P("Find "+m("A")+".",2,ans.int(a),m("y_{2}-y_{1}=A(B-1)")+".","Divide the first difference by "+m("B-1")+"."),
      P("Find the horizontal asymptote "+m("y=C")+".",1,ans.int(c),"At the first input the exponential factor is one.","Subtract the fitted "+m("A")+" from the first output to find "+m("C")+".")
    ]};
  });
  add("gdc-nonpolynomial-two-crossings","aa-sl","2.10","SL2.10.solve-gdc",4,"equation","Isolate two exponential-line intersections with separate brackets",({rng})=>{
    const a=rng.int(3,6),b=rng.pick([2,3,4]),f=x=>b**x-x-a;
    const bis=(l,r)=>{for(let i=0;i<64;i++){const m0=(l+r)/2;if(Math.sign(f(m0))===Math.sign(f(l)))l=m0;else r=m0;}return (l+r)/2;};
    const l=bis(-a,0),r=bis(0,6);
    return {params:{a,b},stem:"Consider "+m(b+"^{x}=x+"+a)+". Give both numerical solutions to three significant figures.",parts:[
      P("Find the solution in "+m(iv(-a,0))+".",3,ans.sf(l),"In a numerical solver use separate bounds on the negative side.",m(b+"^{x}-(x+"+a+")")+" crosses zero between the stated bounds."),
      P("Find the solution in "+m(iv(0,6))+".",2,ans.sf(r),"Repeat the search using the positive interval.","The second intersection is on the increasing branch farther right.")
    ]};
  });



  add("ai-model-tiebreak","ai-sl","2.6","AI-SL2.6.choose-model",3,"table","Use a middle observation to distinguish models agreeing at the endpoints",({rng})=>{
    const A=rng.int(2,9)*2,r=rng.int(2,5),linear=rng.bool(),C=A*r*r,B=linear?(A+C)/2:A*r;
    const pred=linear?A+3*(C-A)/2:C*r;
    return{params:{A,B,C},stem:"A linear model and an exponential model are calibrated to agree with the first and last observations in the table. Exactly one also agrees with the middle observation.",table:{head:[m("t"),m("0"),m("1"),m("2")],rows:[["Observed output",m(num(A)),m(num(B)),m(num(C))]]},parts:[
      P("Find the middle output predicted by the linear model.",2,ans.int((A+C)/2),"For the linear model, equal input gaps give equal differences in output.","The middle prediction is the arithmetic mean of the two endpoints."),
      P("Find the middle output predicted by the exponential model.",2,ans.int(A*r),"Equal input gaps give equal ratios of positive outputs.","The middle prediction is the positive square root of the product of the endpoint outputs."),
      P("Use the model that agrees with all three observations to predict the output when "+m("t=3")+".",2,ans.int(pred),"Compare both middle predictions with the actual middle observation.","Continue with the same difference or ratio, according to the model that fits.")
    ]};
  });
  add("ai-discrete-fee-optimum","ai-sl","2.5","AI-SL2.5.quadratic-model",5,"words","Fit demand, maximise revenue over all permitted whole-euro fees, and test a restriction",({rng})=>{
    const a=2*rng.int(3,8),k=rng.int(5,10),N=a*(2*k+1),p=rng.int(1,k-3),q=p+rng.int(1,k-p-1),cap=k-rng.int(1,3);
    const y=x=>N-a*x, R=x=>x*y(x), top=R(k);
    return{params:{p,q,yp:y(p),yq:y(q),cap},stem:"A theatre models the number of tickets sold as a linear function of the ticket price. It expects to sell "+m(num(y(p)))+" tickets at "+m(fmt.unit(p,"euros"))+" and "+m(num(y(q)))+" tickets at "+m(fmt.unit(q,"euros"))+". Prices must be positive whole numbers of euros, and the model is used only where it predicts at least one ticket sold.",parts:[
      P("Find the decrease in modelled sales for each one-euro price increase.",2,ans.int(a),"Calculate the change in number of tickets per euro using the two observations."),
      P("Find the vertical intercept of the sales formula, which is an extrapolation to zero price.",2,ans.int(N),"Use one observation and the rate of change to recover the vertical intercept of the demand model."),
      P("Find the greatest modelled ticket revenue.",3,ans.int(top),"Multiply price by the corresponding predicted sales, giving a quadratic opening downwards.","The continuous vertex occurs at a half-integer fee. The permitted fees either side are equally good."),
      P("Find the smaller whole-euro price attaining that greatest revenue.",1,ans.int(k),"The two nearest fees are at equal distance from the continuous vertex.","Choose the lower one."),
      P("The theatre caps the fee at "+m(fmt.unit(cap,"euros"))+". Find the greatest ticket revenue under this additional restriction.",2,ans.int(R(cap)),"The cap is below the continuous optimum, on the increasing side of the revenue curve.","The greatest permitted price under the cap gives the greatest revenue there.")
    ]};
  },{"syllabus":["2.5","2.4"],"skills":["AI-SL2.5.quadratic-model","SL2.4.max-min"],"niceOk":true});


})(typeof window==="undefined"?globalThis:window);
