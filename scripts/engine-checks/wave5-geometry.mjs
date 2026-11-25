// Math checks use independent geometry, linear algebra and state exploration.
const D=Math.PI/180;
const mod=(x,m)=>((x%m)+m)%m;
const dist=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i]));
const eq=(x,y)=>x.every((v,i)=>Math.abs(v-y[i])<1e-8);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const product=(M,N)=>M.map(r=>N[0].map((_,j)=>r.reduce((s,x,k)=>s+x*N[k][j],0)));
const apply=(M,p)=>product(M,p.map(x=>[x])).flat();
const K={
 "bisector-gradient-sign/equation":({a,b,d,g},T)=>{
  const v=[d,d*g],n=[v[1],-d],slope=n[1]/n[0];
  const C=[a+d*.5,b+d*g*.5],Q=C.map((x,i)=>x+n[i]);
  T.require(Math.abs(dist(Q,[a,b])-dist(Q,[a+d,b+d*g]))<1e-8,"normal through midpoint gives a point equidistant from both ends");
  return {a:T.approx(slope,1e-11)};
 },
 "two-depot-coverage/words":({d,a,b,l,h},T)=>{
  const D1=x=>dist([x,0],[0,a]),D2=x=>dist([x,0],[d,b]),k=T.bisect(x=>D1(x)-D2(x),0,d);
  const risk=x=>Math.max(D1(x),D2(x)),xs=[l,h];if(k>=l&&k<=h)xs.push(k);
  const best=xs.sort((a,b)=>risk(a)-risk(b))[0];
  T.require(0<l&&l<h&&h<d,"legal road lies strictly between depot projections");
  for(let i=0;i<=12;i++)T.require(risk(best)<=risk(l+(h-l)*i/12)+1e-8,"proposed minimax dominates sampled road sites");
  return {a:T.approx(k,1e-8),b:T.approx(best,1e-8),c:T.approx(risk(best),1e-8)};
 },
 "named-angle-ratio/words":({x,y,z,j,trig},T)=>{
  T.require(x*x+y*y===z*z,"all printed sides make a right triangle");
  const theta=j?Math.atan2(x,y):Math.atan2(y,x);
  return {a:T.approx(Math[trig](theta),1e-10)};
 },
 "shared-altitude-area-split/words":({a,b,theta,j,k},T)=>{
  const v=[a*Math.cos(theta*D),a*Math.sin(theta*D),0],area=(e,h)=>Math.abs(cross([h-e,0,0],v)[2])/2;
  const x=T.bisect(t=>k*area(0,t)-j*area(t,b),0,b);
  T.require(x>0&&x<b&&Math.abs(area(0,x)/area(x,b)-j/k)<1e-8,"common determinant areas give the printed divider ratio");
  return {a:T.approx(area(0,x),1e-8),b:T.approx(x,1e-8)};
 },
 "reverse-compass-reading/words":({a},T)=>{
  const e=-Math.sin(a*D),n=-Math.cos(a*D),b=mod(Math.round(Math.atan2(e,n)/D),360);
  T.require(a!==b,"reversed unit direction is distinct");
  return {a:T.option(b)};
 },
 "signal-rays-component-cancel/words":({d,th1,th2},T)=>{
  // Use standard polar angles instead of rewriting each bearing into a quadrant offset.
  const t=(90-th1)*D,s=(90-th2)*D;
  const L=T.bisect(x=>d*Math.cos(t)+x*Math.cos(s),0,2000),y=d*Math.sin(t)+L*Math.sin(s);
  T.require(Math.abs(d*Math.cos(t)+L*Math.cos(s))<1e-8&&L>0,"reconstructed route ends on the correct longitude with positive length");
  return {a:T.approx(L*L,1e-6),b:T.option(Math.abs(y)<1e-8?"Start":y>0?"North":"South")};
 },
 "repeated-shear-register/equation":({k,p,q,v},T)=>{
  const M=[[1,k],[0,1]],hits=[];let x=[p,q];
  for(let i=1;i<=16;i++){x=apply(M,x);if(eq(x,[v,q]))hits.push(i);}
  T.require(hits.length===1,"iterative multiplication gives one positive pass count");
  let test=[[1,0],[3,0],[0,1],[2,-2]],candidate=test.map(t=>{let q=t;for(let j=0;j<hits[0];j++)q=apply(M,q);return eq(q,t);});
  T.require(candidate.join(",")==="true,true,false,false","sampled invariant and non-invariant vectors separate the fixed axis");
  return {a:hits[0],b:T.option("x-axis")};
 },
 "composition-order-audit/equation":({k,sg,a,b,x,y,v,w},T)=>{
  const S=[[k,0],[0,1]],R=[[0,sg],[-sg,0]],matches=Object.entries({S:product(R,S),R:product(S,R)}).filter(([,M])=>eq(apply(M,[a,b]),[x,y]));
  T.require(matches.length===1,"observed image discriminates both compositions");
  const [[name,M]]=matches,[[a1,b1],[c1,d1]]=M,det=a1*d1-b1*c1,vec=apply([[d1/det,-b1/det],[-c1/det,a1/det]],[w,v]);
  T.require(eq(apply(M,vec),[w,v]),"inverse send-back reproduces the second image");
  return {a:T.option(name),b:T.approx(vec[0],1e-10),c:T.approx(vec[1],1e-10)};
 },
 "opposite-parameter-range/equation":({p,d,q,k,a,b},T)=>{
  const candidates=[a,b].map(t=>{
   const end=p.map((v,i)=>v+t*d[i]),ds=d.map(v=>-k*v);
   const u=T.bisect(u=>q[2]+u*ds[2]-end[2],-20,20);
   T.require(eq(q.map((v,i)=>v+u*ds[i]),end),"both parametric forms reach the same spatial endpoint");
   return u;
  }).sort((x,y)=>x-y);
  return {a:T.approx(candidates[0],1e-9),b:T.approx(candidates[1],1e-9),c:T.approx((candidates[0]+candidates[1])/2,1e-9)};
 },
 "signed-vector-dot-calibration/equation":({a,b,c,v,w,dot},T)=>{
  const A=[a,b,c],An=dist(A,[0,0,0]),target=x=>((An**2+x*x+v*v+w*w-dist(A,[x,v,w])**2)/2)-dot;
  const x=T.bisect(target,-10,10),B=[x,v,w],Bn=dist(B,[0,0,0]),cos=(An**2+Bn**2-dist(A,B)**2)/(2*An*Bn);
  T.require(Math.abs(cos)<1-1e-9&&Math.abs(x-Math.round(x))<1e-9,"cosine-rule reconstruction gives nonparallel vectors and integer missing component");
  return {a:Math.round(x),b:T.option(Math.abs(cos)<1e-9?"right":cos>0?"acute":"obtuse")};
 },
 "walk-counter-missing-arrow/equation":({copy,a,d,observed},T)=>{
  const choices=[0,1].map(v=>[v,copy.map(row=>row.map(w=>w==="p"?v:w))]);
  const hit=choices.filter(([,M])=>product(M,M)[a][d]===observed);
  T.require(hit.length===1,"exactly one binary entry fits the measured walk count");
  const [[v,M]]=hit,A2=product(M,M),A3=product(A2,M);
  T.require(M.every((r,i)=>r[i]===0),"no loops enter the walk count");
  return {a:v,b:M[a][d]+A2[a][d]+A3[a][d]};
 },
 "postman-budget-road-limit/table":({p,q,j,k,z,B},T)=>{
  // Dijkstra on (current vertex, bitmask of traversed roads), not by odd pairing.
  const roads=[[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]],length=x=>{
   const w=[x,p,q,j,k,z],cap=256,dist=Array(cap).fill(Infinity),seen=Array(cap).fill(false);dist[0]=0;
   for(let i=0;i<cap;i++){
    let j=-1;for(let s=0;s<cap;s++)if(!seen[s]&&(j<0||dist[s]<dist[j]))j=s;
    if(j<0||!Number.isFinite(dist[j]))break;
    if(j===63*4)return dist[j];seen[j]=true;
    const at=j%4,mask=j>>2;
    roads.forEach(([u,v],e)=>{if(u===at||v===at){const h=((mask|(1<<e))<<2)+(u===at?v:u);dist[h]=Math.min(dist[h],dist[j]+w[e]);}});
   }
   return Infinity;
  };
  const costs=Array.from({length:8},(_,i)=>length(i+6)),allowed=costs.filter(v=>v<=B);
  T.require(costs.every((v,i)=>!i||costs[i-1]<v)&&allowed.length>1&&allowed.length<8,"increasing optimal cost crosses budget inside the printed domain");
  return {a:costs[7]-(13+p+q+j+k+z),b:5+allowed.length};
 },
};
export default Object.fromEntries(Object.entries(K).map(([key,fn])=>{const [id,rep]=key.split("/");return ["w5-geometry-"+id+"/result/"+rep,(q,T)=>fn(q.params,T)];}));
