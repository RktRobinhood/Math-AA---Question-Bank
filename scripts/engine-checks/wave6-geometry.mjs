// Reconstruct from displayed data, independently enumerating graphs and sampled trajectories.
const C={
 "midpoint-image-readback/recover-matrix-entry-from-centre/equation":({P,Q,Mx,My,a,h,m,t},T)=>{
  const x=T.mean([P[0],Q[0]]),y=T.mean([P[1],Q[1]]);
  const candidates=T.range(-40,40).filter(k=>(a*P[0]+k*P[1]+a*Q[0]+k*Q[1])/2===Mx);
  T.require(candidates.length===1&&h*x+m*y===My&&y!==0,"single matrix entry fits the image of the centre");
  return {a:x,b:candidates[0],c:candidates[0]*t};
 },
 "vector-length-rescale/read-length-from-negative-scaling/equation":({m,k},T)=>{
  // Any direction of length m suffices. Scale a constructed 3-4-5 vector.
  const ax=-k*.6*m,ay=-k*.8*m;
  T.require(k>1&&m>0&&ax<0&&ay<0,"nontrivial reversal and scale");
  return {a:Math.round(Math.hypot(ax,ay))};
 },
 "missing-balance-leg/separate-resultant-from-missing-displacement/words":({A1,B1,Z},T)=>{
  const solutions=Z.map((z,i)=>T.range(-30,30).find(n=>n+A1[i]+B1[i]===z));
  T.require(solutions.every(k=>Number.isInteger(k)&&k!==0),"one nonzero missing component on each axis");
  return {a:solutions[0],b:solutions[1],c:Math.hypot(...solutions)};
 },
 "line-one-coordinate-inconsistent/test-membership-after-one-coordinate/equation":({a,b,c,u,w,h,P},T,q)=>{
  const ts=T.range(-15,15).filter(t=>a*t+u===P[0]);
  T.require(a!==0&&ts.length===1&&b*ts[0]+w===P[1],"first two coordinates fit one unique parameter");
  const fits=c*ts[0]+h===P[2];
  T.require(q.parts[2].answer.display.startsWith(fits?"Yes.":"No."),"membership verdict independently verified");
  return {a:ts[0],b:c*ts[0]+h};
 },
 "line-nonzero-parameter-anchor/reconstruct-origin-of-parameter/equation":({h,d,P},T)=>{
  const start=P.map((z,i)=>T.range(-24,40).find(v=>{
   let current=v;
   for(let j=0;j<h;j++)current+=d[i];
   return current===z;
  }));
  T.require(h>1&&d.every(x=>x!==0)&&start.every(Number.isInteger),"all components move between the base and reference point");
  return {a:start[0],b:start[1],c:start[2]};
 },
 "velocity-direction-reversed/distinguish-reversal-from-speed-change/equation":({vel},T)=>{
  const after=vel.map(x=>-x);
  T.require(after.every((v,i)=>v!==vel[i])&&after.reduce((s,x,i)=>s+x*vel[i],0)<0,"nonzero direction really reverses");
  return {a:Math.hypot(...after)};
 },
 "velocity-change-remaining-time/split-travel-at-one-velocity-change/table":({initial,cut,end,A1,B1},T)=>{
  let final=[...initial],used=0;
  for(let s=0;s<end;s++){
   const first=s<cut;
   if(!first)used++;
   (first?A1:B1).forEach((v,i)=>final[i]+=v);
  }
  T.require(used>0&&used<end&&A1[0]*B1[0]<0,"both time intervals matter and x reverses");
  return {a:used,b:final[0],c:final[1]};
 },
 "velocity-from-odometer-pings/derive-average-vector-then-recover-earlier-position/words":({t,k,P,Q},T)=>{
  const u=Q.map((q,i)=>T.range(-30,30).find(v=>P[i]+k*v===q));
  let x=P[0];
  for(let i=t;i>0;i--)x-=u[0];
  T.require(t>0&&k>1&&u.every(v=>Number.isInteger(v)&&v!==0),"two distinct times identify two nonzero components");
  return {a:u[0],b:Math.hypot(...u),c:x};
 },
 "weighted-degree-is-not-weight/distinguish-incidence-from-cost/table":({list,label},T)=>{
  const arcs=list.map(([s,w])=>[...s,w]),attached=arcs.filter(([a,b])=>a===label||b===label);
  T.require(attached.length>1&&attached.reduce((v,x)=>v+x[2],0)>attached.length&&new Set(list.map(([edge])=>[...edge].sort().join(""))).size===list.length,"simple network and weighted sum would give a different answer");
  return {a:attached.length};
 },
 "audit-one-unlogged-edge/recover-endpoints-from-degree-deficits/words":({names,list,degree},T)=>{
  const old=names.map(x=>list.reduce((s,k)=>s+[...k].filter(c=>c===x).length,0)),possible=[];
  for(let i=0;i<names.length;i++)for(let j=i+1;j<names.length;j++){
   if(list.includes(names[i]+names[j]))continue;
   if(old.every((x,k)=>x+Number(k===i||k===j)===degree[k]))possible.push(names[i]+names[j]);
  }
  T.require(possible.length===1&&degree.reduce((a,b)=>a+b)/2===list.length+1,"exactly one missing simple edge reconciles the audit");
  return {a:list.length+1};
 },
 "reverse-and-relabel-adjacency/read-a-transposed-entry-in-new-order/equation":({matrix},T)=>{
  const arcs=[];
  matrix.forEach((row,i)=>row.forEach((n,j)=>{for(let k=0;k<n;k++)arcs.push(["ABC"[i],"ABC"[j]]);}));
  const rev=arcs.map(([a,b])=>[b,a]),count=(E,a,b)=>E.filter(([u,v])=>u===a&&(b===null||v===b)).length;
  T.require(arcs.length===rev.length&&arcs.every(([a,b])=>a!==b),"reversal preserves the total and no loops are introduced");
  return {a:count(arcs,"A","C"),b:count(rev,"A","B"),c:count(rev,"C",null)};
 },
 "walk-random-choice-from-parallel-arrows/normalize-local-outdegree-before-combining-routes/equation":({M},T)=>{
  const out=M.map(row=>row.flatMap((count,d)=>Array.from({length:count},()=>d)));
  let first=0,done=0,tot=0;
  // Enumerate uniform first choices, then use a common number of slots per outgoing branch.
  const common=out[1].length*out[2].length;
  for(const i of out[0]){
   if(i===2)first++;
   for(let k=0;k<common;k++){tot++;if(out[i][k%out[i].length]===3)done++;}
  }
  const canReach=(start,goal)=>{const seen=new Set([start]),todo=[start];for(let i=0;i<todo.length;i++)for(const y of out[todo[i]])if(!seen.has(y)){seen.add(y);todo.push(y);}return seen.has(goal);};
  T.require(done>0&&done<tot&&[0,1,2,3].every(x=>[0,1,2,3].every(y=>canReach(x,y))),"probability strictly interior and all vertices strongly connected");
  return {a:first/out[0].length,b:done/tot};
 }
};
export default Object.fromEntries(Object.entries(C).map(([k,f])=>["w6-geometry-"+k,(q,T)=>f(q.params,T,q)]));
