/* Original Functions templates targeting the post-Wave-1 coverage gaps. */
(function(root) {
  "use strict";
  const {ans,fmt,register}=root.QBEngine;
  const {num,lin,frac}=fmt;
  const m=x=>"$"+x+"$";
  const P=(prompt,marks,answer,...working)=>({prompt,marks,answer,working});
  const item=(text,value)=>({text,value});
  const C=(rng,yes,...wrong)=>ans.choice(rng,yes,wrong);
  const iv=(a,b)=>"["+num(a)+",\\,"+num(b)+"]";
  const set=(...entries)=>"\\{"+entries.map(num).join(",")+"\\}";
  const add=(name,home,code,skill,level,rep,title,build,extra={})=>{
    const type="fn-wave2-"+name,unknown="reasoning";
    register({id:type+"/"+unknown+"/"+rep,home,type,unknown,representation:rep,format:"value",levels:[level],calculator:level>=4,syllabus:[code],skills:[skill],title,build,...extra});
  };

  add("range-with-overlap","aa-sl","2.2","SL2.2.range",3,"table","Recover a disconnected range and locate a collision",({rng})=>{
    const x=rng.int(-8,4),y=rng.int(-5,4),w=rng.int(4,7),d=rng.int(2,w-1),jump=rng.int(2,5),u=x+w+3;
    const far=y+w+d+jump;
    const pieces=[[x,x+w,y,y+w],[u,u+w,y+d,y+d+w],[u+w+3,u+w+5,far,far+2]];
    const q=y+d+rng.int(1,w-d),a=x+q-y,b=u+q-y-d;
    return{params:{pieces,q},stem:"A function is made of the three closed line segments in the table. There are no inputs between segments and each segment is increasing.",
      table:{head:["Segment","Input interval","Output at left end","Output at right end"],rows:pieces.map(([l,h,L,H],i)=>[m(num(i+1)),m(iv(l,h)),m(num(L)),m(num(H))])},parts:[
        P("Find the range of the whole function.",3,C(rng,
          item(m(iv(y,y+w+d)+"\\cup"+iv(far,far+2)),"union"),
          item(m(iv(y,far+2)),"filled"),item(m(iv(y+d,y+w)+"\\cup"+iv(far,far+2)),"overlap"),item(m(iv(y,y+w+d)),"drop")),
          "The first two output intervals overlap, so join them. Keep the third interval separate."),
        P("The output "+m(num(q))+" is not enough to identify an input uniquely. Find the smaller input that gives this output.",2,ans.int(a),
          "On each increasing segment the output and input change by the same amount.", "The two inputs are "+m(num(a)+"\\text{ and }"+num(b))+".")
      ]};
  });

  add("touch-beats-sign-scan","aa-sl","2.3","SL2.3.read-graph",3,"graph","Use a graph to recover a root missed by a sign scan",({rng})=>{
    const r=rng.int(-5,-2),s=rng.int(1,4),scale=rng.pick([.2,.25,.5]);
    const co=[-scale*r*s*s,scale*(2*r*s+s*s),-scale*(r+2*s),scale];
    const xs=[r-1,r+1,s-1,s+1],fy=x=>scale*(x-r)*(x-s)**2;
    return{params:{xs,co},stem:"The graph shows the only two solutions of "+m("f(x)=0")+" in the displayed range. A search reports a root only when the signs at two consecutive sample points are opposite.",
      graph:{x:[r-1.6,s+1.6],y:[Math.min(-6,fy(r-1.4)),Math.max(5,fy(s+1.4),fy((2*r+s)/3)*1.15)],xStep:1,yStep:5,
        functions:[{fn:{type:"poly",coeffs:co}}],alt:"A graph crossing the x-axis on the left and touching it on the right. The horizontal tick marks are spaced one unit apart."},
      table:{head:[m("x"),...xs.map(x=>m(num(x)))],rows:[["Sign of "+m("f(x)"),...xs.map(x=>m(fy(x)>0?"+":"-"))]]},parts:[
        P("Find the solution the sign search reports.",2,ans.int(r),"Only the first pair of sample signs changes. Read the crossing in this interval."),
        P("Find the other solution.",1,ans.int(s),"Read where the graph touches the horizontal axis."),
        P("Why does the search miss the other solution?",2,C(rng,item("The graph touches the axis and stays on the same side.","touch"),item("It crosses the axis twice between the same sample points.","double"),item("The ordinate there is above zero.","above")),"At a touching zero the nearby signs need not be different.")
      ]};
  });

  add("ai-cubic-interval-rate","ai-sl","2.5","AI-SL2.5.cubic-model",3,"words","Compare total and per-unit changes in a cubic model",({rng})=>{
    const a=rng.int(2,7),u=rng.int(2,6),d=rng.int(1,4),start=rng.int(20,90);
    const F=x=>start+a*x**3;
    const low=F(u+d)-F(u),high=F(u+2*d)-F(u+d);
    return{params:{a,u,d,start},stem:"A calibration model gives the number of particles in a test chamber as "+m("N(r)="+start+"+"+a+"r^{3}")+", where "+m("r")+" is the chamber radius in centimetres. Compare a change from "+m(num(u))+" to "+m(num(u+d))+" cm with a change from "+m(num(u+d))+" to "+m(num(u+2*d))+" cm.",parts:[
      P("Find the increase in predicted particle count in the first interval.",2,ans.int(low),"Evaluate both endpoints and subtract the starting count from the ending count."),
      P("How many more particles per centimetre does the second interval add, on average, than the first?",3,ans.int((high-low)/d),"The intervals have the same width "+m(num(d))+" cm.","Subtract the changes in count, then divide by that width.")
    ]};
  });

  add("ai-order-equivalence","ai-hl","2.7","AI-AHL2.7.composite-equation",3,"words","Find when two orders of a calibration agree",({rng})=>{
    const d=rng.int(2,5),k=rng.int(1,7),q=rng.int(1,8),div=2*q+d;
    const tex="\\dfrac{x^{2}}{"+div+"}+"+k;
    return{params:{d,k,div},stem:"Two adjustments to a nonnegative sensor score are "+m("f(x)="+tex)+" and "+m("g(x)="+lin(1,d))+". The instrument can apply them in either order.",parts:[
      P("Which expression represents applying "+m("g")+" first and then "+m("f")+"?",1,C(rng,item(m("f(g(x))"),"fog"),item(m("g(f(x))"),"gof"),item(m("f(x)+g(x)"),"add")),
        "The first operation supplies the input for the second."),
      P("Find the input score at which the two orders agree.",4,ans.int(q),
        "Set "+m("f(g(x))=g(f(x))")+". The constant "+m(num(k))+" cancels.",
        "Expand "+m("(x+"+d+")^{2}")+" and cancel the squared terms. Divide by the nonzero shift, giving "+m("2x+"+d+"="+div)+".")
    ]};
  });

  add("ai-log-ruler-interpolation","ai-hl","2.10","AI-AHL2.10.log-scale",3,"table","Interpolate between labels on a logarithmic axis",({rng})=>{
    const a=rng.int(1,4),r=rng.int(2,3),t=rng.int(2,3),n=t+rng.int(1,2),u=rng.int(1,6),d=rng.int(2,4),right=u+d*n,k=u+d*t;
    const end=a*r**n,expected=a*r**t;
    return{params:{a,u,right,k,end},stem:"On a base-ten logarithmic axis, tick marks are spaced every "+m(num(d))+" mm. The position is an ordinary distance from the start of the ruler.",
      table:{head:["Position (mm)",m(num(u)),m(num(k)),m(num(right))],rows:[["Axis label",m(num(a)),"?",m(num(end))]]},parts:[
        P("Find the missing axis label exactly.",3,ans.int(expected),
          "The position is "+m(frac(t,n))+" of the distance between the labelled marks.",
          "Equal distance on a logarithmic axis means equal multiplicative change. The total ratio is "+m(num(end/a))+" over "+m(num(n))+" equal gaps."),
        P("What would the label be at the same position if the scale between the same endpoint labels were linear?",2,ans.frac(n*a+t*(end-a),n),
          "A linear scale divides the ordinary difference between endpoint values in the ratio of the distances.")
      ]};
  });

  add("ahl-inverse-by-odd-symmetry","aa-hl","2.14","AHL2.14.use-symmetry",4,"equation","Use odd symmetry to recover inverse values numerically",({rng})=>{
    const a=rng.int(2,9),b=rng.int(2,8),v=rng.int(15,49),F=x=>x**5+a*x;
    let lo=0,hi=4;for(let i=0;i<55;i++){const c=(lo+hi)/2;if(F(c)<v)lo=c;else hi=c}const w=(lo+hi)/2;
    return{params:{a,b,v},stem:"Let "+m("f(x)=x^{5}+"+a+"x")+" for all real "+m("x")+". The function is strictly increasing. An instrument reports its reading as "+m("g(x)=f(x)+"+b)+".",parts:[
      P("Use technology to find "+m("f^{-1}("+v+")")+". Give your answer to three significant figures.",2,ans.sf(w),
        "Solve "+m("x^{5}+"+a+"x="+v)+"; a crossing in the interval "+m(iv(0,4))+" gives the unique input."),
      P("Find "+m("g^{-1}("+num(b-v)+")")+" without a second numerical solve. Give your answer to three significant figures.",2,ans.sf(-w),
        "Subtract the instrument offset. This asks for the input for which "+m("f(x)="+num(-v))+".",
        "Every power appearing in "+m("f")+" is odd, so negating the input negates the output."),
      P("Is "+m("g")+" odd?",1,C(rng,item("No","no"),item("Yes, because its highest power is odd.","power"),item("Yes, because its inverse exists.","inverse")),
        "An odd function defined at zero must have value zero there; this instrument has a nonzero offset.")
    ]};
  });

  add("ahl-comparison-at-discrete-inputs","aa-hl","2.15","AHL2.15.graphical-inequality",1,"table","Read a weak function inequality at given inputs",({rng})=>{
    const a=rng.int(-8,4),d=rng.int(2,5),xs=Array.from({length:5},(_,i)=>a+i*d),f=xs.map(()=>rng.int(-9,9));
    const c=rng.shuffle([-2,-1,0,1,2]),g=f.map((v,i)=>v+c[i]),le=xs.filter((_,i)=>c[i]>=0);
    return{params:{xs,f,g},stem:"Only the five inputs in the table are in the domain.",table:{head:[m("x"),...xs.map(x=>m(num(x)))],rows:[[m("f(x)"),...f.map(x=>m(num(x)))],[m("g(x)"),...g.map(x=>m(num(x)))]]},parts:[
      P("Select the solution set of "+m("g(x)\\ge f(x)")+".",2,C(rng,item(m(set(...le)),"weak"),
        item(m(set(...xs.filter((_,i)=>c[i]>0))),"strict"),item(m(set(...xs.filter((_,i)=>c[i]<=0))),"reversed"),item(m(set(...xs)), "all")),
        "Compare the two values in each column. Include equality; do not include inputs between columns.")
    ]};
  });

  add("line-translation-crossing","aa-sl","2.1","SL2.1.intersection-lines",3,"equation","Recover an intersection after moving one line",({rng})=>{
    const a=rng.int(2,6),s=rng.int(1,4),b=rng.int(-9,9),x=rng.int(2,7),u=rng.int(2,5),v=rng.nonzero(-6,7);
    const c=b+(a+s)*u-v+s*x;
    return{params:{a,s,b,u,v,c},stem:"Line "+m("L")+" has equation "+m("y="+lin(a,b))+" and line "+m("K")+" has equation "+m("y="+lin(a+s,c))+". Move every point of "+m("K")+" right by "+m(num(u))+" units and vertically by "+m(num(v))+" units (a negative value means down).",parts:[
      P("Find the new line's "+m("y")+"-intercept.",2,ans.int(c-(a+s)*u+v),"The old point at input "+m(num(-u))+" moves onto the vertical axis. Add the vertical displacement to its output."),
      P("Find the "+m("x")+"-coordinate where the moved line meets "+m("L")+".",3,ans.int(-x),"The moved line keeps its original gradient.","Equate the two expressions for "+m("y")+". The gradients differ by "+m(num(s))+", so there is exactly one crossing.")
    ]};
  });

  add("reciprocal-mid-output","aa-sl","2.8","SL2.8.rational-equation",4,"equation","Find where a rational graph reaches a mean output",({rng})=>{
    const a=rng.int(5,12),b=rng.int(1,9),h=rng.int(2,8),d=rng.int(2,5),e=d+rng.int(2,6);
    const F=x=>b+a/(x-h),u=h+d,v=h+e,goal=(F(u)+F(v))/2,hit=h+2*d*e/(d+e);
    return{params:{a,b,h,u,v},stem:"The function "+m("f(x)="+b+"+\\dfrac{"+a+"}{"+lin(1,-h)+"}")+" is sampled at "+m("x="+u)+" and "+m("x="+v)+". Let "+m("M")+" be the arithmetic mean of the two outputs.",parts:[
      P("Find "+m("M")+" to three significant figures.",2,ans.sf(goal),"Evaluate both samples and average them. Keep the unrounded mean for the next part."),
      P("Find the input at which the function takes this mean value. Give your answer to three significant figures.",3,ans.sf(hit),
        "Solve "+m("f(x)=M")+" on the branch containing both samples. Subtract the vertical offset first, then invert the reciprocal relation.")
    ]};
  });

  add("reflect-coordinate-prerequisite","aa-sl","2.11","SL2.11.reflect",0,"words","Repair which coordinate a reflection changes",({rng})=>{
    const x=rng.nonzero(-9,9),y=rng.nonzero(-9,9),axis=rng.pick(["x","y"]);
    return{params:{x,y,axis},stem:"Plot the point "+m(fmt.point(x,y))+" on a coordinate grid, then reflect it in the "+m(axis)+"-axis.",parts:[
      P("Give the new value of the coordinate that changes.",1,ans.int(axis==="x"?-y:-x),
        "The distance from the mirror axis stays the same, on the opposite side. The coordinate measured along the mirror axis is unchanged.")
    ]};
  });

  add("ai-regime-crossing-gap","ai-hl","2.9","AI-AHL2.9.piecewise-model",3,"words","Reject a threshold solution from the wrong regime",({rng})=>{
    const a=rng.int(2,8),d=rng.int(5,9),c=d+rng.int(1,3),near=d-rng.int(1,3),span=c-near,s=c+span;
    const r=rng.pick(Array.from({length:d-1},(_,i)=>i+1).filter(x=>x!==near));
    const target=rng.int(15,35),B=target+span*span,A=target-a*r,end=s+rng.int(1,3);
    return{params:{A,a,B,c,d,end,target},stem:"A chamber's controller changes mode at time "+m("t="+d)+". For "+m("0\\le t<"+d)+", the temperature is "+m("T(t)="+lin(a,A,"t"))+"; for "+m(d+"\\le t\\le "+end)+", it is "+m("T(t)="+B+"-"+ "("+lin(1,-c,"t")+")^{2}")+". Time is in minutes and temperature in degrees Celsius.",parts:[
      P("Find when the target temperature "+m(num(target)+"^{\\circ}\\mathrm{C}")+" is reached in the first mode.",2,ans.int(r),
        "Set the first formula equal to the target and check that the resulting time is below the switch."),
      P("Find when the same target is reached in the second mode.",3,ans.int(s),
        "The quadratic gives two positive times, "+m(num(near))+" and "+m(num(s))+".",
        "The earlier time is before the second mode is active, so reject it.")
    ]};
  });

  add("aa-rectangular-constraint-design","aa-sl","2.6","SL2.6.model",5,"words","Optimise a fenced rectangle with a minimum frontage",({rng})=>{
    const s=rng.int(10,19),offset=rng.int(1,4),front=2*s+2*offset,F=4*s,cap=s-offset;
    return{params:{F,front},stem:"A rectangular plot lies against a long wall. The two sides perpendicular to the wall and the side opposite the wall use exactly "+m(num(F))+" metres of fence. The side opposite the wall must be at least "+m(num(front))+" metres long. Let "+m("x")+" be the length in metres of either perpendicular side.",parts:[
      P("Write an expression for the area in terms of "+m("x")+".",2,ans.self(m(fmt.poly([-2,F,0]))),
        "The remaining fence has length "+m(lin(-2,F))+". Multiply this by the perpendicular length."),
      P("Find the greatest allowed value of "+m("x")+".",2,ans.int(cap),
        "Translate the frontage requirement into "+m(lin(-2,F)+"\\ge "+front)+" and solve."),
      P("Find the unrestricted maximum area (if the minimum frontage requirement were removed).",2,ans.int(2*s*s),
        "The quadratic opens down, with axis of symmetry at "+m(num(s))+". This is physically attainable without the frontage requirement."),
      P("Find the actual maximum area.",2,ans.int(cap*front),
        "The area is increasing throughout the permitted interval, so take its right endpoint."),
      P("Which is the reason the unrestricted maximum cannot be used?",1,C(rng,
        item("At the unrestricted maximum, the frontage is too short.","frontage"),item("At the unrestricted maximum, the fence would be too short.","fence"),item("The position of the vertex changes when the frontage condition is imposed.","vertex")),
        "The vertex is unchanged, but it lies beyond the right endpoint of the allowed interval.")
    ]};
  },{"syllabus":["2.6","2.4"],"skills":["SL2.6.model","SL2.4.max-min"],"niceOk":true});
})(globalThis);
