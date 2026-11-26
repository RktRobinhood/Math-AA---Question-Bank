"use strict";
globalThis.StatsLesson=(()=>{
const M=WalkMatrix,choices=M.labels.map(x=>[x,x]);
const demo={matrix:"0,2,1;0,0,1;1,0,0",from:"A",to:"C",k:2};
const assigned={matrix:"0,0,2;1,0,1;0,1,0",from:"B",to:"A",k:2};
const digits=M.entries(demo.matrix).flat().flatMap((x,i)=>i===8?[String(x)]:[String(x),"tab"]);
const tape=(t,dt,kk)=>kk.map((k,i)=>[Number((t+i*dt).toFixed(3)),k]);
return {
 id:"CT26",app:"Calculator",name:"Adjacency matrices and walks",duration:58,demo,assigned,
 intro:"Rows are the starting vertices, columns are the destinations. A matrix power counts walks of one specified length.",
 input:[["matrix","Adjacency matrix (comma entries; semicolon rows)"],["from","Starting vertex",choices],["to","Ending vertex",choices],["k","Exact number of edges"]],
 answers:[["forward","Walks in stated direction"],["reverse","Walks in reverse direction"],["length","What does the power count?",[["exact","Exactly k edges"],["upto","At most k edges"],["simple","Routes with no repeats only"]]]],
 validate:M.validate,
 task:d=>"Count walks of exactly "+d.k+" edges: "+d.from+"→"+d.to+" and "+d.to+"→"+d.from+". Rows start, columns end.",
 grade(d,s,a){
  const entry=s.result;
  if(entry.k!==d.k||entry.source.flat().join(",")!==M.entries(d.matrix).flat().join(","))return "Store the given adjacency matrix and evaluate the power for exactly the stated walk length.";
  const i=M.labels.indexOf(d.from),j=M.labels.indexOf(d.to),expected=[entry.matrix[i][j],entry.matrix[j][i]];
  const num=x=>/^\d+(?:\.0+)?$/.test(x.trim())?Number(x):NaN;
  if(num(a.forward)!==expected[0]||num(a.reverse)!==expected[1])return "Read row = start, column = end. Reverse the two indices for the opposite direction.";
  if(a.length!=="exact")return "A single power counts walks with exactly k edges, including repeated vertices where possible.";
  return "";
 },
 success:"Correct. A matrix power counts exact-length walks; read the start row and destination column.",
 chapters:["Read the arrow counts","Read a parallel-arrow count","Open the matrix template","Set dimensions and enter counts","Store the matrix","Calculate a²","Read the start row and end column","Change the walk length","Allow repeated vertices"],
 captions:[
 [0,"Enter the directed arrow counts. Rows are where a walk starts; columns are where it goes.","Vertex order: A · B · C"],
 [6,"Two arrows go A→B, so the entry in row A, column B is 2. An absent arrow gives 0.","Directed counts, not road lengths."],
 [11,"Open Matrix & Vector, then Create, then Matrix.","Menu → 7 → 1 → 1"],
 [18,"Set 3 rows and 3 columns. Fill each count, then press Tab.","Rows: 0 2 1  /  0 0 1  /  1 0 0"],
 [31.5,"From after the last cell, use Ctrl + Var (sto→), type a, then Enter.","Store the finished matrix as a."],
 [35.45,"Type a raised to power 2, then Enter. This uses matrix multiplication.","a² counts walks of exactly two edges."],
 [41,"A to C is row A, column C: 2. The two parallel A→B arrows each allow a walk through B. Read the reverse entry: 0.","(a²)₁₃ = 2; (a²)₃₁ = 0"],
 [49,"For exactly three edges, use a³ instead. Do not add shorter lengths to it.","Change the exponent, not the row or column."],
 [54,"There is one three-edge walk A→C→A→C. Repeated vertices are allowed in a walk.","(a³)₁₃ = 1"]],
 keys:[...tape(11.5,.9,["menu","7","1","1"]),
 ...tape(16,.76,["3","tab","3","tab","enter"]),...tape(20,.7,digits),[31.9,"tab"],[32.5,"ctrl"],[33.1,"var"],[33.75,"a"],[34.55,"enter"],
 ...tape(35.6,.85,["a","power","2","enter"]),...tape(49.1,.84,["a","power","3","enter"])]
};
})();
