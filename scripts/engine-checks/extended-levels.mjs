// Verification uses enumeration, line intersections, dot products and integration;
// never reads the generated answer to recompute one.
const keys = {
  't1-ext-rung-signed-change/find-change/words': ({params:p},T) => {
    const i=T.range(-24,24).find(n=>p.before+n===p.after);
    T.require(Number.isInteger(i) && i!==0,'non-zero signed integer change in range');
    return {a:i};
  },
  't1-ext-rung-two-running-totals/compare-term-and-total-crossings/words': ({params:p},T) => {
    let A=p.a,B=p.b,sA=0,sB=0,firstTerm=0,firstTotal=0,lead=0;
    T.require(A>B && p.h>0 && p.ratio>1,'arithmetic starts ahead; both sequences increase');
    for (let day=1;day<=18;day++) {
      sA+=A;sB+=B;
      if (!firstTerm && B>A) {firstTerm=day; lead=sA-sB;}
      if (!firstTotal && sB>sA) firstTotal=day;
      B*=p.ratio;A+=p.h;
    }
    T.require(firstTerm>1 && firstTotal>firstTerm && lead>0,'there are two distinct, ordered overtake dates');
    return {a:firstTerm,b:lead,c:firstTotal};
  },
  'fn-ext-rung-horizontal-change/find-input-change/equation': ({params:p},T) => {
    const coordinate=T.range(-13,13).find(n=>p.x1+n===p.x2);
    T.require(Number.isInteger(coordinate) && coordinate!==0,'non-zero horizontal change');
    return {a:coordinate};
  },
  'fn-ext-rung-tariff-lower-envelope/maximise-affordable-use/words': ({params:p},T) => {
    const a=x=>p.p+p.s*x,b=x=>p.q+p.t*x;
    const equal=T.range(0,125).filter(x=>a(x)===b(x));
    T.require(equal.length===1 && a(0)>b(0) && a(125)<b(125),'one whole-hour crossing with reversed ordering');
    const affordable=T.range(0,125).filter(x=>a(x)<=p.budget||b(x)<=p.budget);
    T.require(a(0)<=p.budget && affordable.at(-1)<125,'both offers initially feasible and exhaustive search exceeds max');
    return {a:equal[0],b:T.range(0,125).find(x=>a(x)<b(x)),c:affordable.at(-1)};
  },
  't3-ext-rung-right-triangle-length/find-hypotenuse/words': ({params:p},T) => {
    const expected=T.range(1,1570).find(x=>x*x===p.a*p.a+p.b*p.b);
    T.require(expected>Math.max(p.a,p.b),'positive integer hypotenuse larger than both legs');
    return {a:expected};
  },
  't3-ext-rung-drone-lines-of-sight/connect-bearing-elevation-and-space-angle/words': ({params:p},T) => {
    const {a,b,h}=p;
    const O=[0,0,0], A=[a,0,0], D=[a,b,h], diff=(x,y)=>x.map((v,i)=>v-y[i]);
    const u=diff(O,D),v=diff(A,D),dot=u.reduce((sum,x,i)=>sum+x*v[i],0);
    const norm=x=>Math.sqrt(x.reduce((acc,v)=>acc+v*v,0));
    const borne=T.deg(Math.atan2(a,b)), elev=T.deg(Math.asin(h/norm(D))), view=T.deg(Math.acos(dot/(norm(u)*norm(v))));
    T.require([borne,elev,view].every(x=>0<x&&x<90),'three distinct sight constructions with valid acute angles');
    return {a:borne,b:elev,c:view};
  },
  't4-ext-rung-whole-from-groups/find-fraction-of-whole/words': ({params:p},T) => {
    const clips=p.counts.flatMap((count,i)=>Array(count).fill(i));
    const nBlue=clips.filter(id=>id===0).length;
    T.require(nBlue>0 && nBlue<clips.length,'proper nonzero fraction of the full collection');
    return {a:nBlue/clips.length};
  },
  't4-ext-rung-hidden-machine/update-and-predict-a-batch/words': ({params:p},T) => {
    const buckets=[0,0,0];
    // Enumerate every future success/failure sequence with a fixed latent machine.
    for (const [i,mix,pass] of [[0,p.w,p.pa],[1,1-p.w,p.pb]]) {
      for (let mask=0;mask<2**p.n;mask++) {
        let weight=mix*(1-pass), passes=0;
        for (let trial=0;trial<p.n;trial++) {
          if (mask&(1<<trial)) {weight*=pass;passes++;}
          else weight*=1-pass;
        }
        buckets[0]+=weight;
        if (!i) buckets[1]+=weight;
        if (passes>=2) buckets[2]+=weight;
      }
    }
    const [fail,fromA,withTwo]=buckets;
    T.require(p.pa>p.pb && fromA/fail<p.w,'first failure lowers posterior for the more reliable machine');
    T.require(withTwo>0 && withTwo<fail,'non-trivial conditional predictive probability');
    return {a:fail,b:fromA/fail,c:withTwo/fail};
  },
  't5-ext-rung-line-rise-over-run/find-gradient/equation': ({params:p},T) => {
    const {x,y,x2,y2}=p, horizontal=Math.abs(x2-x), vertical=Math.abs(y2-y);
    const step=T.gcd(horizontal,vertical), sign=y2>y?1:-1;
    T.require(x2>x && y2!==y,'positive run and nonzero rise');
    return {a:sign*(vertical/step)/(horizontal/step)};
  },
  't5-ext-rung-signed-transfer/connect-rate-volume-and-throughput/words': ({params:p},T) => {
    const {h,k,start,end}=p;
    const flow=t=>k*(h-t)*(h+t);
    const V=t=>start+T.integrate(flow,0,t,400);
    const maximum=T.extremum(V,0,end,'max',1200);
    const reset=T.bisect(t=>V(t)-start,maximum.x,end,70);
    const total=T.integrate(t=>Math.abs(flow(t)),0,end,400);
    T.require(V(0)>0&&V(end)>0&&maximum.x>0&&maximum.x<reset&&reset<end,'positive volumes and interior maximum followed by return');
    return {a:V(h/2),b:T.approx(maximum.x,1e-5),c:maximum.value,d:reset,e:total};
  }
};

export default keys;
