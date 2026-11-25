// Alternate checks: sampled signs/values, finite differences, ternary optimisation.
function value(c,x){return c.reduceRight((a,b)=>a*x+b,0);}
function slope(f,x,h=1e-4){return (f(x+h)-f(x-h))/(2*h);}
function golden(fn,a,b,maximise) {
  const d=maximise?1:-1;
  for(let i=0;i<85;i++){
    const l=(2*a+b)/3,r=(a+2*b)/3;
    if(d*fn(l)<d*fn(r)) a=l; else b=r;
  }
  return (a+b)/2;
}
export default {
  "t5-ext-curve-sign-evidence/classify-sign-table/table":(q,T)=>{
    const data=q.table.rows;
    const nums=row=>row.slice(1).map(v=>v==="$+$"?1:v==="$-$"?-1:0);
    const [left,at,right]=nums(data[0]), [cl,,cr]=nums(data[1]);
    const cat=cl!==cr?(at===0?"si":"ni"):(left>right?"max":"min");
    return {a:T.option(cat)};
  },
  "t5-ext-degenerate-points/flat-point-classification/equation":(q,T)=>{
    const {a,h,sign}=q.params;
    const f=x=>sign*Math.pow(x-a,4)+h;
    return {a:T.option(f(a)<Math.min(f(a-1),f(a+1))?"min":"max")};
  },
  "t5-ext-derivative-trends/concavity-from-gradient-change/words":(q,T)=>{
    const {up,increasing}=q.params;
    const trend = x => (increasing?10:-10)+(up?1:-1)*x;
    return {a:T.option(trend(1)>trend(0)?1:-1)};
  },
  "t5-ext-curve-sign-evidence/audit-inflexion-claim/words":(q,T)=>{
    const {changes,sign}=q.params;
    const h=x=>sign*x+sign*(changes?-(x**3):x**4);
    const curvature=x=>(h(x+.001)+h(x-.001)-2*h(x))/(.001**2);
    // Compare the stated signs rather than read the generated correct choice.
    const left=Math.sign(curvature(-0.1)), right=Math.sign(curvature(0.1));
    T.require(slope(h,0)!==0,"non-zero central gradient");
    return {a:T.option(false),b:T.option(left!==right)};
  },
  "t5-ext-derivative-trends/gradient-graph-vertex/graph":(q,T)=>{
    const coeffs=q.graph.functions[0].fn.coeffs;
    const [lo,hi]=q.graph.x;
    const x=Math.round(golden(x=>value(coeffs,x),lo,hi,coeffs[2]<0));
    T.require(Math.abs(value(coeffs,x))>0.5,"gradient vertex off the axis");
    return {a:x, b:T.option("ni")};
  },
  "t5-ext-context-rate/interpret-cooling-curvature/words":(q,T)=>{
    const {a,b,h,at}=q.params;
    const f=x=>value([h,-b,a],x);
    const v=slope(f,at);
    T.require(v<0,"temperature is falling");
    T.require(slope(f,at+0.1)>slope(f,at-0.1),"cooling magnitude is decreasing");
    return {a:Math.round(v),b:T.option("cool-slower")};
  },
  "t5-ext-degenerate-points/quartic-zero-second-derivative/equation":(q,T)=>{
    const {a,c,n}=q.params, f=x=>c+n*(x-a)**4;
    let best=-8;
    for(let x=-7;x<=8;x++)if(n>0?f(x)<f(best):f(x)>f(best)) best=x;
    const h=0.001, curvature=(f(best+h)+f(best-h)-2*f(best))/(h*h);
    return {a:best,b:Math.round(curvature),c:T.option(f(best)<f(best+1)?"min":"max")};
  },
  "t5-ext-derivative-trends/parameter-from-inflexion/equation":(q,T)=>{
    const {a,u,d}=q.params, h=0.125;
    const f=(k,x)=>value([0,d,k,u],x);
    const curvature=k=>f(k,a-h)-2*f(k,a)+f(k,a+h);
    let k;
    for(let c=-40;c<=40;c++)if(Math.abs(curvature(c))<1e-8) k=c;
    T.require(k!==undefined,"integer parameter gives zero curvature");
    const v=Math.round(slope(x=>f(k,x),a));
    return {a:k,b:v,c:T.option(v===0?"si":"ni")};
  },
  "t5-ext-context-constraint/minimum-with-capacity-limit/words":(q,T)=>{
    const {lo,hi,r,c,h}=q.params, f=x=>value([c*r*r+h,-2*c*r,c],x);
    let free=0;
    for(let x=1;x<=20;x++)if(f(x)<f(free))free=x;
    let allowed=lo;
    for(let x=lo+1;x<=hi;x++)if(f(x)<f(allowed))allowed=x;
    T.require(Math.abs(free-r)<1e-8&&free>hi,"unconstrained minimum lies outside safety limits");
    return {a:free,b:allowed,c:f(allowed)};
  },
  "t5-ext-context-constraint/least-enclosure-cost/words":(q,T)=>{
    const {a,b,area}=q.params;
    const cost=x=>2*(a*x+b*(area/x));
    const x=golden(cost,.001,2*area,false);
    T.require(x>0&&x<2*area,"positive dimensions");
    return {b:T.approx(x,1e-5),c:T.approx(cost(x),1e-5)};
  },
  "t5-ext-context-rate/largest-reading-on-time-interval/words":(q,T)=>{
    const {a,b,d,h,end}=q.params, f=x=>h+a*x-b*Math.pow(Math.E,x/d);
    const t=golden(f,0,end,true);
    T.require(t>0&&t<end&&f(t)>f(0)&&f(t)>f(end),"interior maximum on time window");
    return {b:T.approx(t,1e-5),c:T.approx(f(t),1e-5)};
  },
  "fn-ext-graph-threshold/crossing-time-and-integer/words":(q,T)=>{
    const {a,p,b,c}=q.params;
    const delta=x=>a*Math.exp(Math.log(p/100)*x)-b-c*x;
    let first=0;
    while(first<50&&delta(first)>=0) first++;
    T.require(first>0&&first<50,"initially enough reserve, then strictly below");
    const roots=T.roots(delta,first-1,first,401);
    T.require(roots.length===1,"one crossing in the bracket");
    return {a:T.approx(roots[0],1e-6),b:first};
  }
};
