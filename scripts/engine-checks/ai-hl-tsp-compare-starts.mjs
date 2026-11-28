/* Independently rank all candidate paths by their sequential edge weights. */
const lengths = path => path.reduce((total,x)=>total+x,0);
const permutations = values => values.length === 0 ? [[]] :
  values.flatMap((v,i)=>permutations(values.filter((_,j)=>i!==j)).map(p=>[v,...p]));
function compare(a,b) {
  for (let i=0;i<a.length;i++) if(a[i]!==b[i]) return a[i]-b[i];
  return 0;
}
export default {
  "t3-ai-graph-algorithms/tsp-compare-starts/table": (q,T) => {
    const D=q.table.rows.map(row=>row.slice(1).map(s=>Number(s.slice(1,-1))));
    const ids=[0,1,2,3,4], edges=ids.flatMap(i=>ids.slice(i+1).map(j=>D[i][j]));
    T.require(edges.length===10 && new Set(edges).size===10, "no equal off-diagonal lengths");
    T.require(D.every((row,a)=>row.every((v,b)=>v===D[b][a] && (a===b?v===0:v>0)
      && ids.every(c=>v<=D[a][c]+D[c][b]))), "symmetric metric table");
    const starts=q.parts.slice(0,2).map(p=>"ABCDE".indexOf((p.prompt.match(/mathrm\{([A-E])\}/)||[])[1]));
    T.require(starts.every(s=>s>=0)&&starts[0]!==starts[1], "two distinct starts visible in the actual prompts");
    const bounds=starts.map(start=>{
      const tours=permutations(ids.filter(i=>i!==start)).map(p=>[start,...p,start]);
      const costs=tours.map(p=>p.slice(1).map((v,i)=>D[p[i]][v]));
      return {greedy:lengths(costs.slice().sort(compare)[0]),optimum:Math.min(...costs.map(lengths))};
    });
    const [a,b]=bounds.map(x=>x.greedy);
    T.require(a!==b && bounds[0].optimum===bounds[1].optimum
      && bounds[0].optimum<=Math.min(a,b), "the tours differ and both give true upper bounds");
    return {a,b,c:Math.min(a,b)};
  },
};
