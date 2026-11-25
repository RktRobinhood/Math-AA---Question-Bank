/* Interpret the given quantities independently; do not call generation helpers. */
const id=(name,rep)=>"w3-number-"+name+"/reasoning/"+rep;
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
export default {
 [id("product-certificate","words")]:({params:{s,p},parts},T)=>{
  const half=s/2,score=x=>x*(s-x);
  const opt=T.extremum(score,0,s,"max",100);
  const x=T.bisect(n=>score(n)-p,half,s);
  const y=s-x;
  const vals=parts[0].answer.values;
  T.require(opt.x>0&&opt.x<s&&score(half)>p&&p>0,"positive allocations and feasible separate products");
  T.require(Math.abs(score(x)-p)<1e-7&&x>y&&y>0,"second allocation recovered by an independent root solve");
  T.require(vals.includes("square")&&[2,6,17].every(n=>Math.abs((n+half)**2-4*n*half-(n-half)**2)<1e-9),"candidate identity checked against positive pairs");
  return{a:T.option("square"),b:T.approx(opt.value,1e-7),c:T.approx(x-y,1e-7)};
 },
 [id("balanced-block-read","table")]:({params:{l,w,v,d},table,parts},T)=>{
  const values=[];
  for(let n=l;n<=l+2*w;n++)values.push(v+(n-l)*d);
  T.require(l>0&&d!==0&&table.head.length===3&&table.rows[0].length===3,"nonconstant arithmetic series and two displayed endpoints");
  T.require(table.head[0]==="$n$"&&table.rows[0][0]==="$u_n$"&&parts[0].marks===2,"AA notation and short skill practice");
  T.require(!/mean|average|index/i.test(parts[0].prompt)&&parts[0].prompt.includes("inclusive"),"unambiguous arithmetic sum");
  return{a:values.reduce((s,x)=>s+x,0)};
 },
 [id("geometric-recovery-leg","words")]:({params:{a,b,n,fall}},T)=>{
  const run=x=>[[n,x],[n+1,x*a/b],[n+2,x*a/b*a/b]];
  const x=T.bisect(z=>{const v=run(z);return v[0][1]-v[2][1]-fall;},0,1000);
  T.require(n>=2&&Math.abs(run(x)[2][1]+fall-x)<1e-8&&x>run(x)[1][1],"one positive declining scale");
  return{a:T.approx(x,1e-8),b:T.approx(run(x)[1][1],1e-8)};
 },
 [id("depreciation-discrete-loss","words")]:({params:{r,firstloss,at}},T)=>{
  const retains=1-r/10,after=x=>x*retains;
  const x=T.bisect(z=>z-after(z)-firstloss,0,6000);
  T.require(at>=1&&retains>0&&retains<1&&x>after(x)&&after(x)>after(after(x)),"two distinct positive annual losses");
  return{a:T.approx(x,1e-8),b:T.approx(after(x)-after(after(x)),1e-8)};
 },
 [id("change-base-reciprocal","equation")]:({params:{p,q,u}},T)=>{
  const base=Math.exp(p/q);
  T.require(base>1&&u>1,"valid logarithm base and nontrivial power");
  return{a:T.approx(Math.log(Math.exp(u))/Math.log(base),1e-8)};
 },
 [id("infinite-tail-fraction-test","table")]:({params:{order,ratios}},T)=>{
  const labels=["P","Q","R"];
  const pass=order.flatMap((n,i)=>{
   const [a,b]=ratios[n];
   const v=Math.abs((a/b)**200);
   return v<1?[labels[i]]:[];
  });
  T.require(pass.length===1,"one sequence has terms whose magnitudes approach zero");
  return{a:T.option(pass[0])};
 },
 [id("log-two-measurements-repair","table")]:({params:{a,b,p,q,observed,scale}},T)=>{
  const readings=[p+Math.log10(a),q+Math.log10(b)];
  const actual=readings.reduce((s,x)=>s+x,0),reported=p+q+Math.log10(observed/scale);
  T.require(a>0&&b>0&&reported!==actual&&Math.abs(actual-reported)>0.99,"positive inputs and truly different sum");
  return{a:T.approx(10**(actual-p-q),1e-8),b:T.approx(actual-reported,1e-8)};
 },
 [id("weighted-pole-reconstruction","equation")]:({params:{p,q,x,y,U,V}},T)=>{
  const hits=[];
  for(let A=-12;A<=12;A++)for(let B=-48;B<=48;B++){
   const tx=(x-p)*(A/(x-p)+B/(x-q)),ty=(y-p)*(A/(y-p)+B/(y-q));
   if(Math.abs(tx-U)<1e-9&&Math.abs(ty-V)<1e-9)hits.push([A,B]);
  }
  T.require(p<q&&q<x&&x<y&&hits.length===1&&hits[0].every(Boolean),"two usable inputs determine two nonzero coefficients");
  return{a:hits[0][1],b:hits[0][0]};
 },
 [id("argand-perpendicular-bisector","equation")]:({params:{a,b,c,d}},T)=>{
  const u=x=>Math.sqrt((x-a)**2+b*b),v=x=>Math.sqrt((x-c)**2+d*d);
  const x=T.bisect(t=>u(t)-v(t),0,120);
  const radius=u(x),angle=Math.acos((a-x)/radius);
  T.require(Math.abs(radius-v(x))<1e-10&&x>a&&b>0&&angle>Math.PI/2,"genuine equidistance and quadrant II argument");
  return{a:T.approx(x,1e-8),b:T.approx(radius,1e-8),c:T.approx(angle,1e-8)};
 },
 [id("subtracted-rounding-error","words")]:({params:{A,B,u,v}},T)=>{
  const display=A-B, samples=[];
  for(const x of [A-u,A,A+u])for(const y of [B-v,B,B+v])samples.push(x-y);
  T.require(samples.every(x=>x>0)&&A%(2*u)===0&&B%(2*v)===0,"true difference stays positive and all displays respect their rounding steps");
  const error=x=>100*Math.abs(display/x-1);
  const extremum=Math.max(...samples.map(error));
  T.require(extremum===error(Math.min(...samples)),"relative error highest at smallest feasible difference");
  return{a:Math.min(...samples),b:Math.max(...samples),c:T.approx(extremum,1e-8)};
 },
 [id("annuity-shifted-stream","table")]:({params:{d,rate,t}},T)=>{
  const simulate=first=>{let value=0;for(let k=1;k<=t+1;k++){value+=rate*value/100;if(first<=k&&k<first+t)value+=d;}return value;};
  const [a,b]=[simulate(1),simulate(2)];
  T.require(a>b&&t>=3&&d>0&&b>t*d,"monthly deposits and correct earlier start advantage");
  return{a:T.option("A"),b:T.approx(100*(a-b)/b,1e-8),c:T.approx(b/a,1e-8)};
 },
 [id("eigenline-reconstruct-column","equation")]:({params:{r,h,a,d}},T)=>{
  const v=[a,a],w=[d,-d],u=v.map(x=>h*x),z=w.map(x=>r*x);
  const works=(i,j,k)=>dot([i,j],v)===u[k]&&dot([i,j],w)===z[k];
  const possible=[[],[]];
  for(let i=-12;i<=12;i++)for(let j=-12;j<=12;j++){
   if(works(i,j,0))possible[0].push([i,j]);
   if(works(i,j,1))possible[1].push([i,j]);
  }
  const A=possible.map(x=>x[0]);
  T.require(h!==r&&possible.every(z=>z.length===1),"two independent eigenlines determine a unique matrix");
  const trace=A[0][0]+A[1][1],det=A[0][0]*A[1][1]-A[0][1]*A[1][0];
  return{a:T.approx((trace+Math.sqrt(trace*trace-4*det))/2,1e-10),b:A[0][1]};
 }
};
