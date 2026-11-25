(function(g){
"use strict";
const LIMIT=Object.freeze({fact:18,ncr:60});
const MENU=Object.freeze({main:["1: Actions","2: Number","3: Algebra","4: Calculus","5: Probability","6: Statistics","7: Matrix & Vector","8: Finance","9: Functions"],prob:["1: Factorial (!)","2: Permutations","3: Combinations","4: Random","5: Distributions"]});
function whole(x,label){
 const raw=String(x??"").trim().replaceAll("−","-");
 if(!/^[+-]?\d+(?:\.0+)?$/.test(raw)||raw.length>26)throw new Error("Enter a whole number for "+label+".");
 const n=Number(raw);
 if(!Number.isSafeInteger(n))throw new Error("Enter a whole number for "+label+".");
 return n;
}
function problem(op,n0,r0){
 if(op!=="fact"&&op!=="ncr")throw Error("Choose factorial or combinations.");
 const n=whole(n0,"n");
 if(n<0)throw Error("Use n ≥ 0.");
 if(n>LIMIT[op])throw Error("This practice view supports n ≤ "+LIMIT[op]+".");
 const r=op==="ncr"?whole(r0,"r"):null;
 if(r!==null&&(r<0||r>n))throw Error("Use 0 ≤ r ≤ n.");
 return {op,n,r};
}
const expression=({op,n,r})=>op==="fact"?n+"!":"nCr("+n+","+r+")";
function count(p){
 const {op,n,r}=problem(p.op,p.n,p.r);
 let z=1n;
 if(op==="fact"){for(let k=2;k<=n;k++)z*=BigInt(k);return z;}
 const s=Math.min(r,n-r);
 for(let k=1;k<=s;k++)z=z*BigInt(n-k+1)/BigInt(k);
 return z;
}
function parse(raw){
 const t=String(raw??"").trim();
 if(t.endsWith("!"))return problem("fact",t.slice(0,-1));
 if(/^nCr\(/i.test(t)){
  if(!t.endsWith(")"))throw Error("Close nCr with a right parenthesis.");
  const ss=t.slice(4,-1).split(",");
  if(ss.length!==2)throw Error("Separate n and r with one comma.");
  return problem("ncr",ss[0],ss[1]);
 }
 throw Error("Use n! or nCr(n,r) for this lesson.");
}
function link(q){
 const any=["op","n","r"].some(k=>q.has(k));
 if(!any)return null;
 if(["op","n","r"].some(k=>q.getAll(k).length>1)||!q.has("n"))throw Error("Invalid or incomplete Try link.");
 const op=q.get("op")??"ncr";
 if((op==="fact"&&q.has("r"))||(op==="ncr"&&!q.has("r")))throw Error("Invalid or incomplete Try link.");
 return problem(op,q.get("n"),q.get("r"));
}
const base=()=>({page:"calc",at:0,entry:"",rows:[],selected:0,error:"",fromWatch:false});
const clone=s=>({...s,rows:s.rows.map(r=>({...r}))});
function insert(s,t){
 if(s.entry.length+t.length>54){s.error="That entry is too long.";return;}
 s.entry=s.entry.slice(0,s.at)+t+s.entry.slice(s.at);s.at+=t.length;
}
function key(previous,k){
 const s=clone(previous);s.error="";
 if(k==="menu"){s.page="main";s.selected=0;return s;}
 if(k==="esc"){
  if(s.page==="prob"){s.page="main";s.selected=4;}
  else if(s.page==="main"){s.page="calc";}
  else{s.at=0;s.entry="";}
  return s;
 }
 if(s.page!=="calc"){
  const rows=MENU[s.page], byNumber=/^[1-9]$/.test(k)?Number(k)-1:null;
  if(k==="down"||k==="up"){s.selected=(s.selected+(k==="up"?-1:1)+rows.length)%rows.length;return s;}
  if(k==="left"){if(s.page==="prob"){s.page="main";s.selected=4;}return s;}
  const pick=byNumber??(["right","enter","select"].includes(k)?s.selected:null);
  if(pick===null||pick>=rows.length)return s;
  if(s.page==="main"){
   if(pick===4){s.page="prob";s.selected=0;}
   else s.error="Open 5: Probability for this lesson.";
  }else if(pick===0||pick===2){
   s.page="calc";if(pick===0)insert(s,"!");
   else insert(s,"nCr(");
  }else{s.error=pick===1?"Permutations are for ordered choices. Use 3: Combinations for groups.":"Use 1: Factorial or 3: Combinations.";}
  return s;
 }
 if(k==="left"||k==="right"){s.at=Math.max(0,Math.min(s.entry.length,s.at+(k==="left"?-1:1)));return s;}
 if(k==="del"){if(s.at){s.entry=s.entry.slice(0,s.at-1)+s.entry.slice(s.at);s.at--;}return s;}
 if(k==="enter"||k==="return"){
  if(!s.entry)return s;
  try{const p=parse(s.entry),value=count(p).toString();s.rows=[...s.rows,{text:s.entry,value}].slice(-2);s.entry="";s.at=0;}
  catch(e){s.error=e.message;}
  return s;
 }
 const t=/^\d$/.test(k)?k:({comma:",",neg:"−",minus:"−",plus:"+",dot:".",lparen:"(",rparen:")",factorial:"!"})[k];
 if(t)insert(s,t);
 return s;
}
function load(state,p){
 const s=clone(state);s.page="calc";s.selected=0;s.error="";s.entry=expression(p);s.at=s.entry.length;return s;
}
function answer(raw){
 let t=String(raw??"").trim();
 if(t.length>35)return null;
 if(/^\d{1,3}(?:[, \u2009\u202f]\d{3})+$/.test(t))t=t.replace(/[, \u2009\u202f]/g,"");
 return /^\d+$/.test(t)?BigInt(t):null;
}
const same=(a,b)=>a?.op===b?.op&&a?.n===b?.n&&a?.r===b?.r;
g.CT03=Object.freeze({LIMIT,MENU,problem,expression,count,parse,link,base,clone,key,load,answer,same});
})(typeof module==="object"&&module.exports?module.exports:globalThis);
