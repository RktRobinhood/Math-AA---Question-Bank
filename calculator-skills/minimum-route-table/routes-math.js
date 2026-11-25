"use strict";
globalThis.RouteTableMath=(()=>{
const links=["ab","ac","bc","bd","cd"],paths=["ABD","ACD","ABCD","ACBD"];
function validate(d){
 return links.every(k=>Number.isInteger(d[k])&&d[k]>=1&&d[k]<=99)?"":"All five road distances must be whole kilometres from 1 to 99.";
}
function candidates(d){
 const error=validate(d);if(error)throw Error(error);
 return paths.map(path=>{
  const road=[...path].slice(0,-1).map((v,i)=>[v,path[i+1]].sort().join("").toLowerCase());
  const weights=road.map(k=>d[k]);return {path,weights,total:weights.reduce((s,v)=>s+v,0)};
 });
}
function shortest(d){
 const list=candidates(d),distance=Math.min(...list.map(x=>x.total)),winners=list.filter(x=>x.total===distance).map(x=>x.path);
 return {list,distance,winners};
}
function evaluate(s){
 const raw=String(s).replace(/\s/g,"");
 if(!/^\d{1,4}(?:\+\d{1,4}){0,9}$/.test(raw))throw Error("Enter the candidate’s road lengths separated by +.");
 const weights=raw.split("+").map(Number),value=weights.reduce((a,b)=>a+b,0);
 return {weights,value};
}
const key=nums=>[...nums].sort((a,b)=>a-b).join(",");
function covered(d,history){
 const toDo=new Map();
 for(const row of candidates(d)){const k=key(row.weights);toDo.set(k,(toDo.get(k)||0)+1);}
 for(const row of history){const k=key(row.weights);if(toDo.has(k)){const left=toDo.get(k)-1;if(left)toDo.set(k,left);else toDo.delete(k);}}
 return toDo.size===0;
}
function parseChoices(s){
 const items=String(s).toUpperCase().split(/[,;]+/).map(x=>x.trim().replace(/[\s→–—>-]+/g,""));
 if(items.some(x=>!paths.includes(x))||new Set(items).size!==items.length)return [];
 return items.sort();
}
return Object.freeze({links,paths,validate,candidates,shortest,evaluate,covered,parseChoices});
})();
