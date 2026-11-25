(function(global){
"use strict";
const length=100, maxIndex=1000, maxTerms=80, valBound=1e14;
function number(s,label) {
 const str=String(s??"").trim().replace(/−/g,"-");
 if(!/^[+-]?\d{1,5}$/.test(str)||Math.abs(Number(str))>maxIndex)throw Error(label+" must be an integer from −1,000 to 1,000.");
 return Number(str);
}
function parse(raw) {
 if(typeof raw!=="string"||raw.length>length)throw Error("Enter a rule using n, numbers and the listed operators.");
 const src=raw.trim().toLowerCase().replace(/−/g,"-").replace(/[×·]/g,"*").replace(/÷/g,"/").replace(/²/g,"^2").replace(/³/g,"^3");
 const tokens=[];let cursor=0,key;
 const pattern=/\s*(\d+(?:\.\d*)?|\.\d+|[n()+\-*/^])/y;
 while(cursor<src.length){
  pattern.lastIndex=cursor;key=pattern.exec(src);
  if(!key)throw Error("Use n, numbers, + − × ÷, ^ and parentheses. Type * for multiplication.");
  cursor=pattern.lastIndex;const value=key[1];
  tokens.push(/^\d|^\./.test(value)?Number(value):value);
 }
 let i=0,tree;
 function take(t){if(tokens[i]!==t)return false;i++;return true;}
 function primary(){
  if(take("(")){const expr=add();if(!take(")"))throw Error("Close every parenthesis.");return expr;}
  if(take("n"))return ["n"];
  if(typeof tokens[i]==="number"){const x=tokens[i++];return ["#",x];}
  throw Error("Enter a complete rule in n.");
 }
 function pow(){let p=primary();if(take("^"))p=["^",p,unary()];return p;}
 function unary(){if(take("-"))return ["neg",unary()];if(take("+"))return unary();return pow();}
 function mul(){let a=unary();while(tokens[i]==="*"||tokens[i]==="/")a=[tokens[i++],a,unary()];return a;}
 function add(){let a=mul();while(tokens[i]==="+"||tokens[i]==="-")a=[tokens[i++],a,mul()];return a;}
 tree=add();if(i!==tokens.length)throw Error("Check the rule; write * when multiplying, including before n or a bracket.");
 function bounded(x){
  if(!Number.isFinite(x))throw Error("The rule is undefined for a selected index.");
  if(Math.abs(x)>valBound)throw Error("Use smaller indices or rule values for this practice simulator.");
  return x===0?0:x;
 }
 function run(node,n){
  const [op,left,right]=node;if(op==="n")return n;if(op==="#")return bounded(left);
  const a=run(left,n);if(op==="neg")return -a;const b=run(right,n);
  if(op==="^"&&Math.abs(b)>1000)throw Error("Use a smaller power for this practice simulator.");
  return bounded(op==="+"?a+b:op==="-"?a-b:op==="*"?a*b:op==="/"?a/b:a**b);
 }
 return Object.freeze({src,usesIndex:tokens.includes("n"),at:n=>run(tree,n)});
}
function calculate(params, task) {
 if(!["sum","list","term"].includes(task))throw Error("Choose an nth term, a list or a sum.");
 const rule=parse(params.rule), hi=number(params.upper,task==="term"?"Index":"Upper index");
 if(task==="term")return {task,rule:rule.src,indexes:[hi],values:[rule.at(hi)],value:rule.at(hi)};
 const lo=number(params.lower,"Lower index"),step=number(params.step,"Step");
 if(step<1)throw Error("Use a positive whole-number step.");
 if(lo>hi)throw Error("The lower index must not be above the upper index.");
 const total=Math.floor((hi-lo)/step)+1;
 if(total>maxTerms)throw Error("Use at most 80 terms in this practice simulator.");
 const indexes=Array.from({length:total},(_,i)=>lo+i*step),values=indexes.map(rule.at);
 const value=task==="sum"?values.reduce((a,b)=>a+b,0):null;
 return {task,rule:rule.src,indexes,values,value};
}
function format(v){return String(Number.isSafeInteger(v)?v:Number(v.toPrecision(10))).replace(/-/g,"−");}
function compare(raw,result){
 let s=raw.trim().replace(/−/g,"-");
 if(s.length>900)return false;
 if(result.task==="list"){
  s=s.replace(/^\{([^}]*)\}$/,"$1").replace(/^\[([^\]]*)\]$/,"$1");
  const parts=s.split(",");return parts.length===result.values.length&&parts.every((p,i)=>eq(p,result.values[i]));
 }
 return eq(s,result.value);
}
function eq(raw,target){
 const s=raw.trim();
 if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(s))return false;
 const v=Number(s);
 return Number.isFinite(v)&&(Number.isSafeInteger(target)?v===target:Math.abs(v-target)<Math.max(1e-9,Math.abs(target)*5e-6));
}
global.CT04Math=Object.freeze({number,parse,calculate,format,compare});
})(typeof window==="undefined"?globalThis:window);
