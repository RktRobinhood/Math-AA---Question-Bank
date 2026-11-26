"use strict";
globalThis.StatsLesson=(()=>{
const M=RouteTableMath;
const demo={ab:2,ac:5,bc:4,bd:9,cd:2},assigned={ab:3,ac:5,bc:1,bd:6,cd:4};
const expressions=(d)=>M.candidates(d).map(r=>r.weights.join("+"));
const chars={"+":"plus"};
const tape=(start,raw)=>[...raw].map((c,k)=>[Number((start+k*.66).toFixed(3)),chars[c]||c]);
return {
 id:"CT27", app:"Calculator",name:"Minimum-route-distance table",duration:53, demo,assigned,
 intro:"Compare full routes before entering a distance. The cheapest first road need not lead to the cheapest route.",
 input:M.links.map(k=>[k,k.toUpperCase()+" road (km)"]),
 answers:[["distance","Minimum distance (km)"],["routes","All shortest routes, comma-separated"]],
 validate:M.validate,
 task:()=>"Complete A→D in the least-distance table. Roads are two-way. Find all ties.",
 grade(d,s,a){
  if(!M.covered(d,s.history))return "Enter all four listed road-length sums on the handheld before comparing them.";
  const {distance,winners}=M.shortest(d);
  if(!/^\d+(?:\.0+)?$/.test(a.distance.trim())||Number(a.distance)!==distance)return "The cell needs the smallest complete candidate sum.";
  if(M.parseChoices(a.routes).join(",")!==[...winners].sort().join(","))return "List exactly the routes tied at your minimum; separate them with commas.";
  return "";
 },
 success:"Correct. The cell records the smallest complete route distance; different routes can tie.",
 chapters:["Read the table cell","List all candidate routes","Add A–B–D","Add A–C–D","Add A–B–C–D","Add A–C–B–D","Enter the minimum","Reflect the distance"],
 captions:[
 [0,"Find row A, column D: the shortest A–D distance, not a full tour.","Roads (km): AB 2 · AC 5 · BC 4 · BD 9 · CD 2"],
 [7,"There is no direct A–D road. Compare both two-road routes and both routes that use B–C.","Candidates: ABD · ACD · ABCD · ACBD"],
 [13,"First add the two lengths on A–B–D. The first road is short, but the last one is not.","ABD: AB + BD"],
 [20,"Next add the distances on A–C–D. Keep the total for comparison.","ACD: AC + CD"],
 [27,"A–B–C–D is also possible. Add all three road lengths, in order.","ABCD: AB + BC + CD"],
 [34.5,"The reverse middle leg gives a different route. Add A–C–B–D as well.","ACBD: AC + CB + BD"],
 [42,"Compare 11, 7, 8 and 18. Enter 7 in row A, column D.","ABD 11 · ACD 7 · ABCD 8 · ACBD 18"],
 [48,"Two-way roads give the same distance in reverse. Tied routes share one table value.","ABD 11 · ACD 7 · ABCD 8 · ACBD 18"]],
 keys:[...tape(14,expressions(demo)[0]),[17,"enter"],...tape(21,expressions(demo)[1]),[24,"enter"],...tape(28,expressions(demo)[2]),[32,"enter"],...tape(35.4,expressions(demo)[3]),[40.5,"enter"]]
};
})();
