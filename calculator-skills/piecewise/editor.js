(function(g,f){'use strict';const v=f(typeof module==='object'&&module.exports?require("./math.js").CT15Math:g.CT15Math);if(typeof module==='object'&&module.exports)module.exports=v;else g.CT15Editor=v;})(globalThis,M=>{
'use strict';
const opts=['=','<','>','≤','≥','≠'];
const base=()=>({page:"blank",slots:["","","",""],slot:0,caret:0,selection:0,relation:0,count:"2",countFresh:true,ctrl:false,model:null,error:"",probe:null,fromWatch:false});
const at=(s,slot)=>({...s,slot,caret:s.slots[slot].length,error:""});
const load=(s,slots)=>({...s,page:"editor",slots:[...slots],slot:0,caret:slots[0].length,model:null,probe:null,error:"",fromWatch:false});
function insert(s,text){
 const i=s.slot,raw=s.slots[i],n=s.caret;
 if(raw.length+text.length>(i%2?46:80))return s;
 s.slots[i]=raw.slice(0,n)+text+raw.slice(n);s.caret=n+text.length;return s;
}
function key(old,k){
 let s={...old,slots:[...old.slots],error:""};
 const ok=k==="enter"||k==="select";
 if(k==="ctrl"){s.ctrl=!s.ctrl;return s;}
 const combo=s.ctrl&&k==="eq"||k==="relation";s.ctrl=false;
 if(k==="esc"){
  if(s.page==="relation")s.page="editor";
  else if(s.page==="count")s.page="templates";
  else if(s.page==="templates"||s.page==="editor")s.page=s.model?"plotted":"blank";
  return s;
 }
 if(k==="templates"&&["blank","editor","plotted"].includes(s.page))return {...s,page:"templates",selection:0};
 if(s.page==="templates"){
  if(ok&&s.selection===7)return {...s,page:"count",count:"2",countFresh:true};
  if(ok)return {...s,error:"This rehearsal uses the n-piece piecewise template (first row, last icon)."};
  if(k==="right"||k==="left")s.selection=M.clamp(s.selection+(k==="right"?1:-1),0,7);
  return s;
 }
 if(s.page==="count"){
  if(ok){
   if(s.count!=="2")return {...s,error:"Choose two pieces for this rehearsal."};
   return {...s,page:"editor",slot:0,caret:0,slots:["","","",""],model:null,probe:null};
  }
  if(/^\d$/.test(k)){s.count=(s.countFresh?"":s.count)+k;s.count=s.count.slice(0,2);s.countFresh=false;}
  if(k==="del"){s.count=s.countFresh?"":s.count.slice(0,-1);s.countFresh=false;}
  return s;
 }
 if(s.page==="plotted"&&k==="tab"){s=at(s,0);return {...s,page:"editor",probe:null};}
 if(s.page==="relation"){
  if(k==="left"||k==="right")s.relation=M.clamp(s.relation+(k==="right"?1:-1),0,5);
  if(ok)return insert({...s,page:"editor"},opts[s.relation]);
  return s;
 }
 if(s.page!=="editor")return s;
 const n=s.slot,raw=s.slots[n];
 if(combo&&n%2)return {...s,page:"relation",relation:0};
 if(k==="up"&&n>=2)return at(s,n-2);
 if(k==="down"&&n<2)return at(s,n+2);
 if(k==="tab"||k==="shift-tab")return at(s,(n+(k==="tab"?1:3))%4);
 if(k==="right"){
  if(n%2===0&&s.caret===raw.length)return at(s,n+1);
  s.caret=Math.min(raw.length,s.caret+1);return s;
 }
 if(k==="left"){
  if(n%2===1&&s.caret===0)return at(s,n-1);
  s.caret=Math.max(0,s.caret-1);return s;
 }
 if(ok){
  try{return {...s,page:"plotted",model:M.make(s.slots),probe:null};}
  catch(e){return {...s,error:e.message};}
 }
 if(k==="del"&&s.caret){s.slots[n]=raw.slice(0,s.caret-1)+raw.slice(s.caret);s.caret--;return s;}
 const c=/^[0-9x]$/.test(k)?k:({minus:"-",neg:"-",plus:"+",dot:".",mul:"*",div:"/",square:"^2",power:"^",lparen:"(",rparen:")",lt:"<",gt:">",le:"≤",ge:"≥",eq:"="})[k];
 if(c&&(n%2?/^[0-9x.<>≤≥=+\-]+$/:/^[0-9x.()+\-*/^]+$/).test(c))return insert(s,c);
 return s;
}
return Object.freeze({opts,base,key,load,at});
});
