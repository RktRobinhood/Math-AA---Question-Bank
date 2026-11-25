/* Original exact-answer graph tasks for AI HL 3.16. */
(function(root){
"use strict";
const E=root.QBEngine,{ans:A,fmt:F}=E;
const P=(prompt,marks,answer,...working)=>({prompt,marks,answer,working});
const R=(id,rep,skills,title,build)=>E.register({type:"w3-graph-"+id,unknown:"reasoning",home:"ai-hl",syllabus:["3.16"],levels:[3],format:"value",calculator:false,representation:rep,skills,title,build});
const tag=(a,b)=>[a,b].sort().join("–");
const route=a=>a.join(" → ");
R("repair-after-closure","table",["AI-AHL3.16.kruskal"],"Repair a minimum spanning tree after a link closes",({rng:r})=>{
 const nodes=r.shuffle("ABCDE".split("")), [a,b,c,d,e]=nodes;
 const edges=[[a,b],[b,c],[a,c],[c,d],[b,d],[d,e],[c,e],[b,e]];
 const gaps=[r.int(1,3),r.int(1,3),r.int(1,3)];
 const w=[r.int(2,5)];for(let j=1;j<8;j++)w.push(w[j-1]+gaps[(j-1)%3]);
 const base=[0,1,3,5],after=[1,2,3,5],edge=j=>tag(...edges[j]),distance=ids=>ids.reduce((n,j)=>n+w[j],0);
 const order=r.shuffle([...Array(8).keys()]);
 return{params:{nodes,edges,w},stem:"The table lists all available links of an undirected network joining five stations. The weights are costs in units.",
 table:{head:["Link","Cost"],rows:order.map(j=>[edge(j),F.m(F.num(w[j]))])},parts:[
 P("Use Kruskal’s algorithm on the original network. List the accepted links in order.",2,A.self(base.map(edge).join(", ")),
   "Add "+edge(0)+" and "+edge(1)+". Skip "+edge(2)+" because it now makes a cycle. Add "+edge(3)+", skip "+edge(4)+" for the same reason, and add "+edge(5)+"."),
 P("Find the total cost of the original minimum spanning tree.",1,A.int(distance(base)),"Add the costs of the four accepted links: "+F.m(F.num(distance(base)))+"."),
 P("Link "+edge(0)+" closes. Which link is added to replace it in the new minimum spanning tree?",1,A.self(edge(2)),
  edge(2)+" is now the only available link incident to "+a+". The other three links of the original tree remain optimal."),
 P("Find the increase in the minimum total cost.",2,A.int(distance(after)-distance(base)),
   "Re-running Kruskal gives "+after.map(edge).join(", ")+". The new total is "+F.m(F.num(distance(after)))+". Subtract the original total to get "+F.m(F.num(distance(after)-distance(base)))+".")
 ]};
});
R("cycle-chord-route","words",["AI-AHL3.16.eulerian","AI-AHL3.16.hamiltonian"],"Compare Eulerian and Hamiltonian routes before and after removing a chord",({rng:r})=>{
 const n=r.int(4,7), nodes=r.shuffle("ABCDEFG".split("").slice(0,n));
 const j=r.int(2,n-2), chord=[nodes[0],nodes[j]], cycle=nodes.concat(nodes[0]), trail=cycle.concat(nodes[j]);
 return{params:{nodes,j,chord},stem:"An undirected network has the cycle "+route(cycle)+" and one extra link "+tag(...chord)+". There are no other links.",parts:[
 P("Find the number of vertices of odd degree before the extra link is removed.",1,A.int(2),chord.join(" and ")+" each has degree three. All the other vertices have degree two."),
 P("Give an open Eulerian trail for this network.",2,A.self(route(trail)),"Follow the original cycle and then take the extra link. This uses every link exactly once and ends at the other odd-degree vertex."),
 P("Give a Hamiltonian cycle for the original network.",1,A.self(route(cycle)),"Use the listed cycle without the extra link. Every vertex appears once except for the start repeated at the end."),
 P("Explain how removing the extra link affects the existence of an Eulerian circuit and a Hamiltonian cycle.",2,A.self("An Eulerian circuit now exists; the Hamiltonian cycle still exists."),"The remaining graph is the original cycle. All degrees are now even, and the cycle still visits every vertex exactly once before returning.")
 ]};
});
})(typeof window!=="undefined"?window:globalThis);
