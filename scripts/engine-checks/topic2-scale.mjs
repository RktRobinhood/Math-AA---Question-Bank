/* Independent checks: solve/measure the public mathematical data, without generator helpers. */
const id=(s,r)=>"fn-scale-"+s+"/reasoning/"+r;
const meanAbs=(actual,fitted)=>fitted.map((y,i)=>Math.abs(y-actual[i])).reduce((s,v)=>s+v,0)/actual.length;
const rootBetween=(f,a,b,T)=>{T.require(f(a)*f(b)<=0,"valid root bracket");return T.bisect(f,a,b)};
const integers=(f,a=-150,b=150)=>Array.from({length:b-a+1},(_,i)=>a+i).filter(x=>f(x)===0);
export default {
  [id("finite-range","table")]:({params:{x,y}},T)=>{T.require(x.length===new Set(x).size,"unique input row");return {a:[...new Set(y)].reduce((u,v)=>u+v,0)}},
  [id("inverse-input-audit","table")]:({params:{xs,ys,target,off}},T)=>{
    T.require(new Set(ys).size===xs.length,"inverse exists");
    const back=new Map(ys.map((v,i)=>[v,xs[i]]));return{a:back.get(target),b:T.option(Number(back.has(off)))};
  },
  [id("line-axis-area","equation")]:({params:{a,b}},T)=>{
    T.require(a>0&&b>0,"positive enclosed triangle");
    const line=x=>(a*b-b*x)/a;
    const hit=rootBetween(line,0,2*a,T);
    return{a:T.approx(hit,1e-10),b:T.approx(T.integrate(line,0,hit,10),1e-10)};
  },
  [id("graph-other-branch","graph")]:({params:{c,Y},graph},T)=>{
    const [d,b,a]=graph.functions[0].fn.coeffs,F=x=>a*x*x+b*x+d;
    const turn=T.roots(x=>T.deriv(F,x),graph.x[0],graph.x[1],60);
    const roots=T.roots(x=>F(x)-Y,graph.x[0],graph.x[1],100);
    T.require(turn.length===1&&roots.length===2&&Math.abs(roots[0]-c)<1e-8,"one vertex and two intersections at height");
    return {a:T.approx(turn[0],1e-7),b:T.approx(roots[1],1e-7)};
  },
  [id("ahl-two-remainders","equation")]:({params:{u,v,ru,rv}},T)=>{
    const sol=[];
    for(let a=-20;a<=20;a++)for(let b=-25;b<=25;b++)if(T.poly([1,0,a,b],u)===ru&&T.poly([1,0,a,b],v)===rv)sol.push([a,b]);
    T.require(sol.length===1,"unique cubic for distinct remainders");
    return {a:sol[0][0],b:sol[0][1]};
  },
  [id("ahl-root-product","equation")]:({params:{p,r}},T)=>{
    const rs=integers(x=>T.poly(p,x)).filter(x=>x!==r);
    T.require(T.poly(p,r)===0&&rs.length===2&&rs[0]!==rs[1],"three distinct integer roots");
    return {a:rs[0]+rs[1],b:rs[0]*rs[1]};
  },
  [id("ahl-hole-pole","equation")]:({params:{top,den}},T)=>{
    const zero=integers(x=>T.poly(den,x)), hole=zero.find(x=>T.poly(top,x)===0),pole=zero.find(x=>T.poly(top,x)!==0);
    T.require(zero.length===2&&hole!==undefined&&pole!==undefined,"one common root and one remaining pole");
    const h=.00025, F=x=>T.poly(top,x)/T.poly(den,x);
    const first=(F(hole+h)+F(hole-h))/2, second=(F(hole+h/2)+F(hole-h/2))/2;
    return {a:hole,b:pole,c:T.approx((4*second-first)/3,1e-8)};
  },
  [id("ahl-rational-range-disc","equation")]:({params:{h,k,a,p}},T)=>{
    const F=x=>k+a/((x-h)**2+p);
    const mx=T.extremum(F,h-12,h+12,"max",60);
    T.require(p>0&&F(1e6)>k&&F(1e6)-k<1e-8,"only approaches lower bound");
    return{a:T.approx(mx.value,1e-8)};
  },
  [id("ahl-reciprocal-symmetry","equation")]:({params:{a,b,c,d}},T)=>{
    const F=(x,z)=>(a*x**3+d*x+z)/(x*x+c);
    const oddConstants=integers(z=>F(0,z));
    T.require(oddConstants.length===1,"must vanish at origin");
    const sameAtZeroAndTwo=(F(0,b)+F(-0,b))===(F(2,b)+F(-2,b));
    return {a:oddConstants[0],b:T.option(Number(sameAtZeroAndTwo))};
  },
  [id("ahl-restricted-sqrt","equation")]:({params:{a,h,k,Y}},T)=>{
    const F=x=>a*(x-h)**2+k;
    const x=rootBetween(x=>F(x)-Y,h-20,h,T);
    T.require(x<=h&&Math.abs(F(x)-Y)<1e-7,"root must be on left branch");
    return {b:T.approx(x,1e-9)};
  },
  [id("ahl-cross-pole-inequality","equation")]:({params:{a,b,c,n}},T)=>{
    const test=[a-1,(a+b)/2,(b+c)/2,c+1].map(x=>Math.sign(T.poly(n,x)/(x-b)));
    const checks=[-1,1,-1,1];
    T.require(test.every((v,i)=>v===checks[i])&&T.poly(n,b)!==0&&T.poly(n,a)===0&&T.poly(n,c)===0,"right sign chart at all four intervals and true pole");
    return {a:b,b:T.option("right")};
  },
  [id("ahl-cubic-sign-repeated","equation")]:({params:{n}},T)=>{
    const rs=integers(x=>T.poly(n,x)), [lo,hi]=rs, F=x=>T.poly(n,x);
    T.require(rs.length===2&&F(lo-1)<0&&F((lo+hi)/2)<0&&F(hi+1)>0,"small root is excluded but does not reverse sign");
    return {a:lo,b:T.option("strict-with-hole")};
  },
  [id("ahl-modulus-inverse-level","equation")]:({params:{h,d,Y}},T)=>{
    const F=x=>Math.abs((x-h)**2-d*d)-Y;
    const roots=T.roots(F,h-2*d,h+2*d,1001);
    T.require(roots.length===4&&roots[1]<h&&roots[2]>h,"four roots across two modulus signs");
    return {a:roots.length,b:T.approx(roots[1],1e-8)};
  },
  [id("ahl-squared-collapse","equation")]:({params:{a,h,Y}},T)=>{
    const F=x=>(a*x-a*h)**2-Y, xs=T.roots(F,h-20,h+20,401);
    T.require(xs.length===2,"two distinct inputs share the squared output");
    return {a:T.approx(xs[0],1e-8),b:T.approx(xs[1]-xs[0],1e-8)};
  },
  [id("inverse-reflect-coordinates","equation")]:({params:{x,y}},T)=>{
    const graphPair=[x,y],inv=graphPair.slice().reverse();
    T.require(inv[0]===y&&inv[1]<0,"original point swaps roles");
    return {a:inv[1]};
  },
  [id("transform-fixed-height","equation")]:({params:{a,b,h,k}},T)=>{
    const options=integers(x=>h-x-a);
    T.require(options.length===1,"unique transformed input");
    return {a:options[0],b:b+k};
  },
  [id("ai-tariff-break-even","words")]:({params:{b,r,s,f,t}},T)=>{
    const F=x=>{let output=f;for(let j=1;j<=x;j++)output+=j<=b?r:s;return output};
    const roots=integers(x=>F(x)-t,1,40);
    T.require(roots.length===1&&roots[0]>b,"target requires second tier");
    return {a:F(b),b:roots[0]};
  },
  [id("ai-quadratic-reconstruction-context","words")]:({params:{w,h,x,a}},T)=>{
    // Lagrange interpolation through heights (0,0),(x,h),(2w,0).
    const p=t=>h*(t/x)*(t-2*w)/(x-2*w);
    const top=T.extremum(p,0,2*w,"max",100);
    T.require(p(w)>p(x)&&p(a)>0,"measured and asked points on arch, measurement off vertex");
    return {a:T.approx(top.x,1e-6),b:T.approx(top.value,1e-9),c:T.approx(p(a),1e-9)};
  },
  [id("ai-power-scaling","words")]:({params:{x,y,r,z}},T)=>{
    const pairs=[];
    for(let p=1;p<=6;p++)for(let A=1;A<=30;A++)if(A*x**p===y&&A*(r*x)**p===z)pairs.push([p,A]);
    T.require(pairs.length===1,"unique bounded positive integer calibration");
    return {a:pairs[0][0],b:pairs[0][1]};
  },
  [id("ai-validation-errors","table")]:({params:{actual,a,b}},T)=>{
    const ea=meanAbs(actual,a),eb=meanAbs(actual,b);
    T.require(ea!==eb,"error criterion clearly favours one model");
    return {a:ea,b:eb,c:T.option(ea<eb?"A":"B")};
  },
  [id("ai-extrapolation-domain","words")]:({params:{a,b,r,j,j0}},T)=>{
    const samples=Array.from({length:r},(_,i)=>i+1), y=samples.map(t=>b+a*t);
    T.require(samples.includes(j0)&&!samples.includes(j)&&j>r,"in-window evaluation and later extrapolation");
    return {a:y[samples.indexOf(j0)],b:T.option(1)};
  },
  [id("ai-functional-calibration","words")]:({params:{a,b,p,q,Y}},T)=>{
    const hits=[];
    for(let x=-40;x<=40;x++){const raw=a*x+b;if(p*raw+q===Y)hits.push({raw,x});}
    T.require(hits.length===1,"both monotone steps invert uniquely");
    return {b:hits[0].raw,c:hits[0].x};
  },
  [id("ai-compose-valid-input","words")]:({params:{m0,a,p,q}},T)=>{
    const allowed=[];
    for(let s=-60;s<=60;s++){const y=m0*s+a;if(y>=p&&y<=q)allowed.push(s);}
    T.require(allowed.length>1&&(m0*allowed[0]+a)===p&&(m0*allowed.at(-1)+a)===q,"both bounds attained exactly");
    return {a:allowed[0],b:allowed.at(-1)};
  },
  [id("ai-logistic-target","words")]:({params:{L,c,k,Y}},T)=>{
    const F=t=>L/(1+c*Math.exp(-k*t)), target=rootBetween(t=>F(t)-Y,0,60,T);
    T.require(F(50/k)===L&&Y<L,"finite target below numerical asymptote");
    return {a:Math.round(F(50/k)),b:T.approx(target,1e-9)};
  },
  [id("ai-half-life-delay","words")]:({params:{from,d,a,div}},T)=>{
    const F=t=>a*Math.pow(.5,(t-from)/d), half=rootBetween(t=>F(t)-a/2,from,from+30,T), target=rootBetween(t=>F(t)-a/div,from,from+80,T);
    T.require(target>half&&from>0,"threshold later than second measurement");
    return {a:T.approx(half-from,1e-8),b:T.approx(target,1e-8)};
  },
  [id("ai-piecewise-join-slope","equation")]:({params:{h,d,a,b,Y}},T)=>{
    const fits=[];
    for(let j=1;j<12;j++)for(let k=1;k<100;k++)if(j*d*d+k===Y&&a*h+b===k)fits.push([j,k]);
    T.require(fits.length===1,"one exact fit for both join and checkpoint");
    return {a:fits[0][1],b:fits[0][0]};
  },
  [id("ai-sinusoid-cycle-window","words")]:({params:{m0,A,t0,p,Y}},T)=>{
    const F=t=>m0+A*Math.cos((t-t0)*2*Math.PI/p), turn=T.extremum(F,t0,t0+p,"min",160), cross=rootBetween(t=>F(t)-Y,t0,t0+p/2,T);
    T.require(cross<turn.x&&Y>m0,"first crossing on descending branch above midline");
    return {a:T.approx(turn.x,1e-6),b:T.approx(cross,1e-9)};
  },
  [id("ai-logarithmic-combination","words")]:({params:{l,L}},T)=>{
    const f=x=>10**(x/10), lo=f(l),hi=f(L);
    const target=rootBetween(x=>f(x)-(lo+hi),L,L+4,T);
    T.require(target>L&&hi>lo,"adding independent intensities increases max level");
    return {a:T.approx(hi/lo,1e-9),b:T.approx(target,1e-9)};
  },
  [id("ai-linearised-power-predict","table")]:({params:{n,c,q}},T)=>{
    const x1=10,x2=100,y1=10**(c+n),y2=10**(c+2*n),possible=[];
    for(let k=1;k<=7;k++)if(Math.abs(y1*(x2/x1)**k-y2)<1e-7)possible.push(k);
    T.require(possible.length===1,"unique exponent agreeing with both original-scale observations");
    const a=y1/x1**possible[0];
    const prediction=a*(10**q)**possible[0];
    return {a:possible[0],b:T.approx(prediction,Math.abs(prediction)*2e-13+1e-8)};
  },
  [id("ai-semilog-two-stage","table")]:({params:{c,r,a,q,l,t,obslog}},T)=>{
    const p=x=>10**(c-r*x), g=x=>10**(l-(r+a)*x);
    const k=-Math.log(p(1)/p(0)),cross=rootBetween(x=>p(x)-g(x),0,20,T),goal=10**q;
    const when=rootBetween(x=>p(x)-goal,0,20,T);
    T.require(10**obslog<p(t),"observed lower than predicted");
    return {a:T.approx(Math.log10(p(1)/p(0)),1e-9),b:T.approx(k,1e-9),c:T.approx(cross,1e-9),d:T.approx(when,1e-9),e:T.approx(10**obslog-p(t),1e-9)};
  },
  [id("graph-sum-from-plots","graph")]:({params:{x0},graph},T)=>{
    const [f,g]=graph.functions.map(row=>row.fn.coeffs),p=graph.points;
    T.require(p.length===2&&p[0].x===x0&&p[1].x===x0&&p[0].y!==p[1].y,"two distinct marked heights");
    return {a:T.poly(f.slice().reverse(),x0),b:p[0].y-p[1].y};
  },
  [id("composite-pullback-radical","equation")]:({params:{a,h,k,input}},T)=>{
    const square=x=>k-a*x-h,b=rootBetween(square,-20,20,T);
    T.require(square(b-1)>0&&square(b+1)<0&&square(input)>0,"decreasing inner function crosses to invalid domain");
    return {a:T.approx(b,1e-9),b:T.approx(Math.sqrt(square(input))/Math.sqrt(a),1e-9)};
  },
  [id("quadratic-equal-heights","table")]:({params:{u,v,y,y0}},T)=>{
    const fits=[];
    for(let h=0;h<=15;h++)for(let a=-5;a<=5;a++)for(let k=-12;k<=16;k++)if(a!==0&&a*h*h+k===y0&&a*(u-h)**2+k===y&&a*(v-h)**2+k===y)fits.push({a,h,k});
    T.require(fits.length===1&&u>0&&u<v,"three exact data points uniquely identify a nondegenerate quadratic");
    return {a:fits[0].h,b:fits[0].a,c:fits[0].k};
  },
  [id("quadratic-integer-threshold","equation")]:({params:{h,k,up}},T)=>{
    const disc=n=>(-2*h)**2-4*(h*h-k+n);
    const counts=Array.from({length:up+1},(_,n)=>({n,d:disc(n)}));
    const roots=counts.filter(x=>x.d===0),none=counts.filter(x=>x.d<0);
    T.require(roots.length===1&&none.length>0,"one tangent family member and several no-root members");
    return {a:roots[0].n,b:none.length};
  },
  [id("reciprocal-asymptote-from-samples","table")]:({params:{x1,x2,x3,y1,y2,y3,u}},T)=>{
    const models=[];
    for(let b=-10;b<x1;b++)for(let a=1;a<=100;a++){
      const c=y1-a/(x1-b),F=x=>c+a/(x-b);
      if(F(x2)===y2&&F(x3)===y3)models.push({a,b,c,F});
    }
    T.require(models.length===1&&u>x3,"unique positive reciprocal fit and unambiguous extrapolation");
    const {b,a,c,F}=models[0];
    return {a:b,b:a,c,d:F(u)};
  },
  [id("exponential-shift-three-observations","table")]:({params:{ys,x}},T)=>{
    const matches=[];
    for(let A=1;A<=20;A++)for(let B=2;B<=8;B++)for(let C=-12;C<=20;C++)if(ys.every((v,i)=>A*B**i+C===v))matches.push({A,B,C});
    T.require(matches.length===1&&x>=2,"a unique shifted exponential fits all three entries");
    return {a:matches[0].B,b:matches[0].A,c:matches[0].C};
  },
  [id("gdc-nonpolynomial-two-crossings","equation")]:({params:{a,b}},T)=>{
    const F=x=>Math.exp(Math.log(b)*x)-x-a, roots=T.roots(F,-a,6,1801);
    T.require(roots.length===2&&roots[0]<0&&roots[1]>0,"two separated real solutions");
    return {a:T.approx(roots[0],1e-9),b:T.approx(roots[1],1e-9)};
  },

  [id("ai-model-tiebreak","table")]:({params:{A,B,C}},T)=>{
    const linearRate=(C-A)/2, em=[];
    for(let b=2;b<=10;b++)if(A*b*b===C)em.push(b);
    T.require(em.length===1,"unique exponential rate");
    const choice=[A+linearRate,A*em[0]];
    T.require(choice[0]!==choice[1]&&choice.includes(B),"middle value selects exactly one model");
    return{a:choice[0],b:choice[1],c:choice[0]===B?B+2*linearRate:C*em[0]};
  },
  [id("ai-discrete-fee-optimum","words")]:({params:{p,q,yp,yq,cap}},T)=>{
    const fits=[];
    for(let a=1;a<=32;a++)for(let n=1;n<=400;n++)if(n-a*p===yp&&n-a*q===yq)fits.push({a,n});
    T.require(fits.length===1,"exact linear fit");
    const {a,n}=fits[0], values=[];
    for(let x=1;n-a*x>0;x++)values.push({x,r:x*(n-a*x)});
    const top=Math.max(...values.map(o=>o.r)), tie=values.filter(o=>o.r===top),restricted=values.filter(o=>o.x<=cap);
    T.require(tie.length===2&&restricted.length>0&&cap<tie[0].x,"tie is broken by additional cap below both maximisers");
    return {a,b:n,c:top,d:tie[0].x,e:Math.max(...restricted.map(o=>o.r))};
  },

};
