/* AI HL AHL3.16: compare different starts for the nearest-neighbour upper bound. */
(function (root) {
  "use strict";
  const E = root.QBEngine;
  const N = ["A", "B", "C", "D", "E"];
  const v = i => "$\\mathrm{" + N[i] + "}$";
  const range = [0, 1, 2, 3, 4];
  const pairs = range.flatMap(i => range.slice(i+1).map(j => [i,j]));
  const solve = (D, start) => {
    const visited = new Set([start]), path = [start], weights = [];
    for (let last = start; visited.size < N.length;) {
      let next = -1;
      for (const i of range) if (!visited.has(i) && (next === -1 || D[last][i] < D[last][next])) next = i;
      weights.push(D[last][next]); path.push(next); visited.add(next); last = next;
    }
    weights.push(D[path.at(-1)][start]); path.push(start);
    return { path, weights, cost: weights.reduce((a,b)=>a+b,0) };
  };
  const fallback = [[0,20,23,22,28],[20,0,24,25,26],[23,24,0,21,29],[22,25,21,0,27],[28,26,29,27,0]];
  E.registerAll({home:"ai-hl", calculator:false}, [{
    type:"t3-ai-graph-algorithms", unknown:"tsp-compare-starts", representation:"table",
    format:"value", syllabus:["3.16"], levels:[3], skills:["AI-AHL3.16.tsp-upper-bound"],
    title:"Compare upper bounds from two nearest-neighbour starts",
    build({rng}) {
      let D, pair, tours;
      for (let trial=0; trial<=16 && !pair; trial++) {
        if (trial===16) D=fallback;
        else {
          D=range.map(()=>range.map(()=>0));
          const weights=rng.sample(Array.from({length:20},(_,i)=>20+i),pairs.length);
          pairs.forEach(([i,j],k)=>{D[i][j]=D[j][i]=weights[k];});
        }
        tours=range.map(i=>solve(D,i));
        const choices=pairs.filter(([i,j])=>tours[i].cost!==tours[j].cost);
        if(choices.length) pair=rng.pick(choices);
      }
      if (!pair) throw Error("Nearest-neighbour starts must produce unequal tour lengths.");
      const [i,j] = rng.bool()?pair:[pair[1],pair[0]];
      const km=n=>"$"+n+"\\text{ km}$";
      const method=t=>[
        "Choose the nearest unvisited depot at each step, then close the tour.",
        "The tour is $" + t.path.map(p=>"\\mathrm{"+N[p]+"}").join("\\to ") + "$.",
        "The total is $" + t.weights.join(" + ") + " = " + t.cost + "\\text{ km}$."
      ];
      const a=tours[i], b=tours[j], best=Math.min(a.cost,b.cost);
      const part=(prompt,marks,n,working)=>({prompt,marks,answer:E.ans.int(n),working});
      return {params:{i,j,D}, stem:"A courier must visit each of the five depots and return to the starting depot. The table gives the shortest road distances, in kilometres, between each pair of depots.",
        table:{head:["Depot",...range.map(v)],rows:D.map((row,k)=>[v(k),...row.map(n=>"$"+n+"$")])},
        parts:[
          part("Use the nearest-neighbour algorithm starting at "+v(i)+". Find the total length of the closed tour.",3,a.cost,method(a)),
          part("Repeat the algorithm starting at "+v(j)+". Find the total length of this closed tour.",3,b.cost,method(b)),
          part("Use your two tours to give the better upper bound for the length of a shortest tour.",1,best,["Either completed tour gives an upper bound. The better upper bound is the shorter length, "+km(best)+".", "This does not prove that this tour is the shortest possible."])
        ]
      };
    }
  }]);
})(globalThis);
