/* Original practice variation: graph reading and curve behaviour. */
(function (root) {
  "use strict";
  const E = root.QBEngine;
  const { ans, fmt } = E;
  const { br, poly, m, frac, sf } = fmt;
  const P = (prompt, marks, answer, ...working) => ({prompt, marks, answer, working});
  const reg = (d) => E.register({home:"aa-sl", calculator:false, ...d});
  const q = (stem, params, parts, extras = {}) => ({stem, params, parts, ...extras});
  const s = {
    concavity:"SL5.7.concavity", second:"SL5.7.find-second-derivative",
    graph:"SL5.7.f-from-derivative-graph", interpret:"SL5.7.interpret-second-derivative",
    stationary:"SL5.8.find-stationary-points", classify:"SL5.8.classify-stationary-points",
    inflect:"SL5.8.points-of-inflexion", given:"SL5.8.optimise-given-function",
    model:"SL5.8.optimisation-modelling", closed:"SL5.8.closed-interval-extremes",
    crossing:"SL2.4.intersection"
  };
  const labels={ min:"Local minimum", max:"Local maximum", si:"Stationary point of inflexion", ni:"Non-stationary point of inflexion"};
  const cases=[
    {id:"min",l:-1,z:0,r:1,cl:1,cr:1},
    {id:"max",l:1,z:0,r:-1,cl:-1,cr:-1},
    {id:"si",l:1,z:0,r:1,cl:-1,cr:1},
    {id:"ni",l:1,z:1,r:1,cl:1,cr:-1},
    {id:"si",l:-1,z:0,r:-1,cl:1,cr:-1},
    {id:"ni",l:-1,z:-1,r:-1,cl:-1,cr:1}
  ];
  const whyFor={min:"A local minimum requires a change from decreasing to increasing.",max:"A local maximum requires a change from increasing to decreasing.",si:"Stationary means the gradient is zero; an inflexion also requires a change in concavity.",ni:"A non-stationary point of inflexion has a non-zero gradient and a change in concavity."};
  const classify=(rng,id)=>ans.choice(rng,{text:labels[id],value:id},Object.keys(labels).filter(k=>k!==id).map(k=>({text:labels[k],value:k,why:whyFor[k]})));
  const arrow={down:"Concave down",up:"Concave up"};
  const cu = (rng,up) => ans.choice(rng,{text:up?arrow.up:arrow.down,value:up?1:-1},[
    {text:up?arrow.down:arrow.up,value:up?-1:1,why:"Concavity follows the change in gradient, not the sign of the function."},
    {text:"Not enough information",value:0,why:"The change in the gradient is sufficient to determine concavity here."}
  ]);
  const signText=v=>m(v===0?"0":v>0?"+":"-");
  const dir=v=>v>0?"positive":"negative";
  const sep=a => a<0 ? `(x + ${-a})` : a>0 ? `(x - ${a})` : "x";
  const fPow=(a,n)=>a===0?`x^{${n}}`:`${sep(a)}^{${n}}`;
  const offset = n => n>0?` + ${n}`:n<0?` - ${-n}`:"";
  const mul=(a,b)=>a===1?b:a===-1?`-${b}`:`${a}${b}`;

  reg({type:"t5-ext-curve-sign-evidence",unknown:"classify-sign-table",representation:"table",format:"mcq",levels:[1],syllabus:["5.8"],skills:[s.classify,s.inflect],title:"Classify a point from a derivative sign table",build({rng}){
    const p=rng.pick(cases), a=rng.int(-6,6);
    const table={head:[m("x"),m(`x < ${a}`),m(`x = ${a}`),m(`x > ${a}`)],rows:[[m("f'(x)"),signText(p.l),signText(p.z),signText(p.r)],[m("f''(x)"),signText(p.cl),"Not given",signText(p.cr)]]};
    return q(`The table gives signs at and immediately to either side of $x = ${a}$ for a smooth curve.`,{...p,a},[
      P(`Classify the point on the curve at $x = ${a}$.`,2,classify(rng,p.id),
        p.z===0?"The central gradient is zero, so the point is stationary.":"The central gradient is non-zero, so the point is not stationary.",
        p.cl!==p.cr?"The second derivative changes sign, so the concavity changes.":p.l>p.r?"The first derivative changes from positive to negative, so the point is a local maximum.":"The first derivative changes from negative to positive, so the point is a local minimum.")
    ],{table});
  }});

  reg({type:"t5-ext-degenerate-points",unknown:"flat-point-classification",representation:"equation",format:"mcq",levels:[1],syllabus:["5.8"],skills:[s.classify,s.inflect],title:"A flat curve can still have a turning point",build({rng}){
    const a=rng.nonzero(-5,5), h=rng.int(-5,5), sign=rng.sign();
    return q(`Let $f(x) = ${mul(sign,fPow(a,4))}${offset(h)}$.`,{a,h,sign},[
      P(`Classify the stationary point at $x = ${a}$.`,2,classify(rng,sign>0?"min":"max"),
        `The fourth power $${fPow(a,4)}$ is non-negative and is zero only at $x = ${a}$.`,
        sign>0?`Nearby function values are above $${h}$, so the point is a local minimum.`:`Nearby function values are below $${h}$, so the point is a local maximum.`)
    ]);
  }});

  reg({type:"t5-ext-derivative-trends",unknown:"concavity-from-gradient-change",representation:"words",format:"mcq",levels:[1],syllabus:["5.7"],skills:[s.concavity],title:"Infer concavity from how the gradient changes",build({rng}){
    const a=rng.int(-8,3), b=a+rng.int(2,6), up=rng.bool(), increasing=rng.bool();
    const trend=up?"increases":"decreases";
    return q(`Throughout $${a} < x < ${b}$, the gradient of a smooth curve is always ${increasing?"positive":"negative"} and ${trend} as $x$ increases.`,{a,b,up,increasing},[
      P("State the concavity on this interval.",1,cu(rng,up),`The gradient $f'(x)$ ${trend}, so the curve is ${up?"concave up":"concave down"} on the interval. Its gradient can have either sign.`)
    ]);
  }});

  reg({type:"t5-ext-curve-sign-evidence",unknown:"audit-inflexion-claim",representation:"words",format:"mcq",levels:[2],syllabus:["5.8","5.7"],skills:[s.inflect,s.concavity],title:"Decide what the evidence proves about an inflexion",build({rng}){
    const a=rng.int(-7,7), sign=rng.sign(), changes=rng.bool();
    return q(`A smooth curve has $f'( ${a} ) ${sign>0?">":"<"} 0$ and $f''( ${a} ) = 0$. Immediately to the left, $f''$ is ${dir(sign)}; immediately to the right it is ${dir(changes?-sign:sign)}.`,{a,sign,changes},[
      P(`Does the curve have a stationary point at $x = ${a}$?`,1,ans.choice(rng,{text:"No",value:false},[{text:"Yes",value:true,why:"It is the first derivative, not the second, that must be zero."},{text:"Cannot be determined",value:"unknown",why:"The sign of the first derivative at the point is already given."}]),`Since $f'(${a}) \\ne 0$, the point is not stationary.`),
      P(`Which conclusion about inflexion follows at $x = ${a}$?`,2,ans.choice(rng,{text:changes?"There is a non-stationary point of inflexion.":"There is no point of inflexion.",value:changes},[{text:changes?"There is no point of inflexion.":"There is a non-stationary point of inflexion.",value:!changes,why:"Check whether the second derivative changes sign."},{text:"There is a stationary point of inflexion.",value:"stationary",why:"The gradient at this point is not zero."}]),changes?"The second derivative changes sign. This is a non-stationary point of inflexion.":"The second derivative has the same sign on both sides. Its zero alone does not imply inflexion.")
    ]);
  }});

  reg({type:"t5-ext-derivative-trends",unknown:"gradient-graph-vertex",representation:"graph",format:"mcq",levels:[2],syllabus:["5.7","5.8"],skills:[s.graph,s.concavity,s.inflect],title:"Read concavity from the turning point of a gradient graph",build({rng}){
    const a=rng.int(-4,4), sign=rng.sign(), k=rng.int(1,3);
    const graph={x:[a-3,a+3],y:[-10,10],xStep:1,yStep:2,functions:[{fn:{type:"poly",coeffs:[sign*(a*a-k),-2*a*sign,sign]}}],points:[{x:a,y:-sign*k}],alt:"The graph of the first derivative is a parabola with one marked vertex."};
    return q("The diagram shows the graph of $f'$, not the graph of $f$.",{a,sign,k},[
      P("Write down the $x$-coordinate of the marked vertex on this diagram.",1,ans.int(a),`Read the horizontal coordinate $x = ${a}$.`),
      P("At that same input, what happens on the graph of $f$?",2,classify(rng,"ni"),"The graph of $f'$ changes from rising to falling or from falling to rising, so $f''$ changes sign.",`The vertex is off the horizontal axis: $f'(${a}) = ${-sign*k} \\ne 0$. Thus the inflexion is non-stationary.`)
    ],{graph});
  }});

  reg({type:"t5-ext-context-rate",unknown:"interpret-cooling-curvature",representation:"words",format:"mcq",levels:[2],syllabus:["5.7"],skills:[s.second,s.interpret],title:"Interpret whether a changing quantity is slowing down",build({rng}){
    const a=rng.int(1,3), b=6*a+rng.int(3,7), h=rng.int(70,96), at=rng.int(1,3), v=2*a*at-b;
    return q(`For the first three minutes, the temperature of a mug is modelled by $T(t) = ${poly([a,-b,h],"t")}$, in degrees Celsius, with $t$ in minutes.`,{a,b,h,at},[
      P(`Find $T'(${at})$.`,2,ans.int(v),`$T'(t) = ${poly([2*a,-b],"t")}$.`,`$T'(${at}) = ${v}$.`),
      P(`At $t = ${at}$, which interpretation is correct?`,2,ans.choice(rng,{text:"The mug is cooling, and the rate of cooling is falling.",value:"cool-slower"},[
        {text:"The mug is heating, and the rate of heating is rising.",value:"warm-faster",why:"A negative first derivative means the temperature is falling."},
        {text:"The mug is cooling, and the rate of cooling is rising.",value:"cool-faster",why:"A positive second derivative makes the negative gradient less negative."}]),
        `$T'(${at}) < 0$, so the mug cools.`,`$T''(t) = ${2*a} > 0$, so the negative gradient moves towards zero and the cooling slows.`)
    ]);
  }});

  reg({type:"t5-ext-degenerate-points",unknown:"quartic-zero-second-derivative",representation:"equation",format:"mcq",levels:[3],syllabus:["5.8","5.7"],skills:[s.stationary,s.classify,s.inflect,s.second],title:"Classify a quartic when the second derivative test is inconclusive",build({rng}){
    const a=rng.nonzero(-5,5), c=rng.nonzero(-8,8), sign=rng.sign(), n=sign*rng.int(2,5);
    return q(`Consider $f(x) = ${mul(n,fPow(a,4))}${offset(c)}$.`,{a,c,n},[
      P("Find the $x$-coordinate of the stationary point.",2,ans.int(a),`$f'(x) = ${mul(4*n,fPow(a,3))}$.`,`Setting this equal to zero gives $x = ${a}$.`),
      P("Find the value of the second derivative at the stationary point.",1,ans.int(0),`$f''(x) = ${mul(12*n,fPow(a,2))}$, which is zero at $x = ${a}$.`),
      P("Classify the stationary point.",2,classify(rng,n>0?"min":"max"),n>0?"The first derivative changes from negative to positive, so there is a local minimum.":"The first derivative changes from positive to negative, so there is a local maximum.","The second derivative does not change sign, so this is not an inflexion.")
    ]);
  }});

  reg({type:"t5-ext-derivative-trends",unknown:"parameter-from-inflexion",representation:"equation",format:"mcq",levels:[3],syllabus:["5.7","5.8"],skills:[s.second,s.concavity,s.inflect],title:"Work backwards from a known point of inflexion",build({rng}){
    const a=rng.nonzero(-4,4), u=rng.int(1,3), k=-3*u*a, stationary=rng.bool(), d=3*u*a*a+(stationary?0:rng.nonzero(-6,6));
    const linear=d===0?"":d===1?" + x":d===-1?" - x":`${offset(d)}x`;
    return q(`Let $f(x) = ${mul(u,"x^{3}")} + kx^{2}${linear}$. Its point of inflexion has $x$-coordinate $${a}$.`,{a,u,k,d,stationary},[
      P("Find $k$.",2,ans.int(k),`$f''(x) = ${6*u}x + 2k$.`,`At the inflexion, $${6*u}${br(a)} + 2k = 0$, so $k = ${k}$.`),
      P("Find the gradient at the inflexion.",2,ans.int(d-3*u*a*a),`$f'(x) = ${3*u}x^{2} + 2kx${offset(d)}$.`,`At $x = ${a}$ this gives $f'(${a}) = ${d-3*u*a*a}$.`),
      P("Identify the type of inflexion.",1,classify(rng,stationary?"si":"ni"),"The second derivative is linear and crosses zero, so the concavity changes.",stationary?"The gradient there is zero.":"The gradient there is not zero.")
    ]);
  }});

  reg({type:"t5-ext-context-constraint",unknown:"minimum-with-capacity-limit",representation:"words",format:"value",levels:[3],syllabus:["5.8"],skills:[s.given,s.closed],title:"Check whether a resource limit rules out an optimum",build({rng}){
    const lo=rng.int(1,4), hi=lo+rng.int(2,5), r=hi+rng.int(1,3), c=rng.int(2,12), h=rng.int(30,65), f=x=>c*(x-r)**2+h;
    return q(`A pump’s energy use is modelled by $U(x) = ${c}${fPow(r,2)} + ${h}$, where $x$ is its flow setting. Safety limits the setting to $${lo} \\le x \\le ${hi}$.`,{lo,hi,r,c,h},[
      P("Find the unconstrained setting that would minimise energy use.",2,ans.int(r),`$U'(x) = ${2*c}${sep(r)}$, which is zero at $x = ${r}$.`,`The second derivative is positive, so $x = ${r}$ gives the unconstrained minimum.`),
      P("Find the allowed setting with the least energy use.",2,ans.int(hi),`The unrestricted optimum $${r}$ is outside the allowed interval.`,`Energy decreases over the entire allowed interval, so choose $x = ${hi}$.`),
      P("Find the least possible energy use under the safety constraint.",1,ans.int(f(hi)),`$U(${hi}) = ${f(hi)}$.`)
    ]);
  }});

  reg({type:"t5-ext-context-constraint",unknown:"least-enclosure-cost",representation:"words",format:"value",levels:[4],calculator:true,syllabus:["5.8"],skills:[s.model,s.given],title:"Build and minimise a cost model with two fence prices",build({rng}){
    const a=rng.int(4,11), b=rng.int(3,10), area=rng.int(31,94);
    const x=Math.sqrt(b*area/a), y=area/x, cost=2*a*x+2*b*y;
    return q(`A rectangular animal enclosure has area $${area}\\text{ m}^{2}$. Its two sides of length $x$ use fencing at $${a}$ euros per metre. The other pair use fencing at $${b}$ euros per metre.`,{a,b,area},[
      P("Write the total cost in terms of $x$.",2,ans.self(`$C(x) = ${2*a}x + \\dfrac{${2*b*area}}{x}$`),`The other side is $\\dfrac{${area}}{x}$ metres.`,`The total cost is $C(x) = ${2*a}x + \\dfrac{${2*b*area}}{x}$ for $x > 0$.`),
      P("Find the value of $x$ that gives the minimum cost, to three significant figures.",3,ans.sf(x,3),`Graph $C$ over positive $x$, or solve $C'(x) = ${2*a} - \\dfrac{${2*b*area}}{x^{2}} = 0$.`,"The derivative changes from negative to positive at the unique positive solution.",`$x \\approx ${sf(x,3)}\\text{ m}$.`),
      P("Find the minimum cost in euros, to three significant figures.",1,ans.sf(cost,3),`Evaluate $C$ using the unrounded value of $x$ to obtain $${sf(cost,3)}$ euros.`)
    ]);
  }});

  reg({type:"t5-ext-context-rate",unknown:"largest-reading-on-time-interval",representation:"words",format:"value",levels:[4],calculator:true,syllabus:["5.8","5.6"],skills:[s.given,s.closed,"SL5.6.chain-rule"],title:"Compare an interior maximum with both endpoints",build({rng}){
    const a=rng.int(10,17), b=rng.int(5,8), d=rng.pick([3,4,5]), h=rng.int(20,31), end=3*d;
    const t=d*Math.log(a*d/b), f=x=>h+a*x-b*Math.exp(x/d);
    return q(`A sensor response is modelled by $S(t) = ${h} + ${a}t - ${b}\\mathrm{e}^{t/${d}}$ over $0 \\le t \\le ${end}$ minutes.`.replace(`t/${d}`,`\\frac{t}{${d}}`),{a,b,d,h,end},[
      P("Find $S'(t)$.",2,ans.self(`$S'(t) = ${a} - ${frac(b,d)}\\mathrm{e}^{\\frac{t}{${d}}}$`),`Differentiate the exponential using the chain rule. $S'(t) = ${a} - ${frac(b,d)}\\mathrm{e}^{\\frac{t}{${d}}}$.`),
      // The build bounds below guarantee a unique stationary point inside the given interval.
      P("Find the time when the largest response occurs, to three significant figures.",2,ans.sf(t,3),`Solve $S'(t) = 0$ on the allowed interval; this gives $t \\approx ${sf(t,3)}$.`,`The derivative decreases through zero, so the response rises then falls.`),
      P("Find the largest response, to three significant figures.",2,ans.sf(f(t),3),`Check the endpoints $S(0) \\approx ${sf(f(0),3)}$ and $S(${end}) \\approx ${sf(f(end),3)}$.`,`At the unrounded stationary time the response is greater: $S(t) \\approx ${sf(f(t),3)}$.`)
    ]);
  }});

  reg({type:"fn-ext-graph-threshold",unknown:"crossing-time-and-integer",representation:"words",format:"value",levels:[4],calculator:true,syllabus:["2.4"],skills:[s.crossing],title:"Find a graphical crossing, then answer a whole-period question",build({rng}){
    const a=rng.int(80,138), p=rng.int(76,92), b=rng.int(14,24), c=rng.int(2,5);
    const gap=t=>a*(p/100)**t-(b+c*t);
    let l=0,r=44;
    for(let i=0;i<62;i++){const x=(l+r)/2;if(gap(x)>0)l=x;else r=x;}
    const t=(l+r)/2;
    let first=0;while(gap(first)>=0) first++;
    return q(`A workshop starts with a reserve of supplies. After $t$ weeks its reserve is $R(t) = ${a}(${p/100})^{t}$ units. It needs a reserve of at least $M(t) = ${b} + ${c}t$ units.`,{a,p,b,c},[
      P("Find the time at which the reserve equals the required amount, to three significant figures.",3,ans.sf(t,3),`Graph $y = R(t)$ and $y = M(t)$ for $t \\ge 0$.`,"The reserve decreases while the required amount increases, so the crossing is unique.",`The intersection has $t \\approx ${sf(t,3)}$.`),
      P("Find the first whole number of weeks when the reserve is below the required amount.",2,ans.int(first),`At $t = ${first-1}$ the reserve is not below the target. At $t = ${first}$ it is below.`,`The first whole number of weeks is $${first}$.`)
    ]);
  }});
})(typeof window === "undefined" ? globalThis : window);
