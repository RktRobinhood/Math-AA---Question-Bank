"use strict";
(function(root){
const keys=["sides","target","trials"];
const assigned=Object.freeze({sides:8,target:3,trials:18});
const demo=Object.freeze({sides:5,target:2,trials:12});
const tape=[[2,4,3,1,5,5,2,3,1,4,3,2],[4,1,5,3,2,5,4,3,3,5,2,4]].map(Object.freeze);
function uint(s){const t=String(s).trim();return /^\d{1,4}$/.test(t)?Number(t):NaN;}
function validate({sides,target,trials}){
 if(!Number.isInteger(sides)||sides<2||sides>20)return "Use 2 to 20 equally likely sectors.";
 if(!Number.isInteger(target)||target<1||target>=sides)return "Blue sectors must be between 1 and one less than the number of sectors.";
 if(!Number.isInteger(trials)||trials<2||trials>120)return "Use 2 to 120 spins.";
 return "";
}
function query(search) {
 const p=new URLSearchParams(search);
 const requested=p.getAll("mode");
 if(!requested.includes("try"))return {mode:"watch",problem:assigned,error:""};
 if(requested.length!==1)return {mode:"try",problem:assigned,error:"Use one mode in a linked exercise."};
 if(!keys.some(k=>p.has(k)))return {mode:"try",problem:assigned,error:""};
 if(keys.some(k=>p.getAll(k).length!==1))return {mode:"try",problem:assigned,error:"A linked exercise needs sides, target and trials exactly once."};
 const problem=Object.fromEntries(keys.map(k=>[k,uint(p.get(k))]));
 const error=validate(problem);return {mode:"try",problem:error?assigned:problem,error};
}
function params(expr){
 const hit=/^randint\(\s*(\d{1,4})\s*,\s*(\d{1,4})\s*(?:,\s*(\d{1,4})\s*)?\)?$/i.exec(expr.trim());
 if(!hit)throw Error("Use randInt(lower, upper, trials).");
 const lo=Number(hit[1]),hi=Number(hit[2]),n=hit[3]===undefined?1:Number(hit[3]),many=hit[3]!==undefined;
 if(lo<0||hi>99||hi<lo||n<1||n>120)throw Error("Use ordered bounds 0 to 99 and 1 to 120 trials.");
 return {lo,hi,n,many,command:"randInt("+[lo,hi,...(many?[n]:[])].join(",")+")"};
}
function sample({lo,hi,n},random=Math.random){
 return Array.from({length:n},()=>{
 const u=random();if(!Number.isFinite(u)||u<0||u>=1)throw Error("Random source outside [0,1).");
 return lo+Math.floor(u*(hi-lo+1));
 });
}
function summary(list,{sides,target}){
 const count=list.reduce((n,x)=>n+(x>=1&&x<=target?1:0),0);
 return {count,total:list.length,empirical:count/list.length,model:target/sides};
}
function match(raw,v){
 const s=String(raw).trim();let entered;
 if(/^\d{1,6}\s*\/\s*\d{1,6}$/.test(s)){const [a,b]=s.split("/").map(Number);if(!b)return false;entered=a/b;}
 else if(/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d{1,2})?$/i.test(s))entered=Number(s);
 else return false;
 if(entered<0||entered>1||!Number.isFinite(entered))return false;
 return entered===v||Array.from({length:10},(_,i)=>Number(v.toPrecision(i+3))).includes(entered);
}
function check(problem,run,a){
 if(!run)return "Run the handheld first.";
 if(!run.many||run.lo!==1||run.hi!==problem.sides||run.n!==problem.trials)return "Match all three inputs to the exercise: first label, last label, then number of spins.";
 const r=summary(run.list,problem);
 if(!/^\d{1,4}$/.test(String(a.count).trim())||Number(a.count)!==r.count)return "Count the blue labels in your most recent list, not the number of blue sectors.";
 if(!match(a.empirical,r.empirical))return "Divide the observed blue outcomes by the total number of spins.";
 if(!match(a.model,r.model))return "The exact model uses blue sectors ÷ all equal sectors, not the sampled outcomes.";
 return "";
}
const api={keys,assigned,demo,tape,uint,validate,query,params,sample,summary,match,check};
if(typeof module==="object"&&module.exports)module.exports=api;else root.SimulationMath=api;
})(globalThis);
