function optimal(nodes,edges,w,closed,T){
 let best=Infinity,count=0;
 for(let mask=0;mask<1<<edges.length;mask++){
  const take=edges.map((_,i)=>i).filter(i=>(mask>>i)&1);
  if(take.length!==nodes.length-1||take.includes(closed))continue;
  const seen=new Set(nodes.slice(0,1));
  for(let k=0;k<nodes.length;k++)for(const i of take){
   const [a,b]=edges[i];if(seen.has(a)||seen.has(b)){seen.add(a);seen.add(b);}
  }
  if(seen.size!==nodes.length)continue;
  const z=take.reduce((s,i)=>s+w[i],0);
  if(z<best){best=z;count=1;}else if(z===best)count++;
 }
 T.require(count===1&&Number.isFinite(best),"unique connected optimum");
 return best;
}
const key=(a,b)=>[a,b].sort().join(":");
export default {
 "w3-graph-repair-after-closure/reasoning/table":(q,T)=>{
   const {nodes,edges,w}=q.params;
   const before=optimal(nodes,edges,w,-1,T),after=optimal(nodes,edges,w,0,T);
   T.require(after>before&&w.every((v,i)=>!i||w[i-1]<v),"strict closure increase with unique edge ordering");
   return {b:before,d:after-before};
 },
 "w3-graph-cycle-chord-route/reasoning/words":(q,T)=>{
   const {nodes,chord,j}=q.params, cycle=nodes.concat(nodes[0]),trail=cycle.concat(nodes[j]);
   const edgeKeys=arr=>arr.slice(1).map((b,i)=>key(arr[i],b));
   const original=new Set(edgeKeys(cycle).concat(key(...chord)));
   const degrees=nodes.map(a=>[...original].filter(e=>e.split(":").includes(a)).length);
   T.require(original.size===nodes.length+1&&new Set(edgeKeys(trail)).size===original.size&&edgeKeys(trail).every(e=>original.has(e)),"Euler trail covers every original edge");
   T.require(new Set(cycle.slice(0,-1)).size===nodes.length&&cycle[0]===cycle.at(-1),"cycle is Hamiltonian");
   return {a:degrees.filter(d=>d%2).length};
 }
};
