(function(g){
"use strict";
const N=6;
function name(raw){
 const s=String(raw??"").trim().toLowerCase();
 if(!/^[a-z][a-z0-9]{0,7}$/.test(s)||["ans","stat","mean","median","min","max","ncr","sum","sin","cos","tan","log","ln"].includes(s))
  throw Error("Use a list name of 1–8 letters or digits, starting with a letter. Avoid built-in names.");
 return s;
}
function number(raw,count=false){
 const t=String(raw??"").trim().replaceAll("−","-");
 if(!/^[+-]?(?:\d{1,3}(?:\.\d{1,3})?|\.\d{1,3})$/.test(t))throw Error(count?"Frequencies must be whole numbers from 0 to 999.":"Enter a signed number from −999 to 999 with up to three decimal places.");
 const n=Number(t);
 if(count&&(!Number.isInteger(n)||n<0||n>999))throw Error("Frequencies must be whole numbers from 0 to 999.");
 if(!count&&Math.abs(n)>999)throw Error("Use measured values between −999 and 999.");
 return Object.is(n,-0)?0:n;
}
function data(v0,f0,x0="value",fName="freq"){
 const v=v0.map(x=>number(x)), f=f0===null?null:f0.map(x=>number(x,true)), xname=name(x0),fname=f===null?null:name(fName);
 if(v.length<2||v.length>N)throw Error("Use two to six entries.");
 if(f&&(f.length!==v.length||!f.some(Boolean)||new Set(v).size!==v.length))
  throw Error("Use each measured value once, with a matching count. The total frequency must be positive.");
 if(fname===xname)throw Error("Use different list names.");
 return {v,f,xname,fname};
}
function link(q){
 const keys=["values","freq","xname","fname"];
 if(!keys.some(k=>q.has(k)))return null;
 if(keys.some(k=>q.getAll(k).length>1)||!q.has("values")||q.has("fname")&&!q.has("freq"))
  throw Error("Invalid or incomplete Try link.");
 const list=k=>{const s=q.get(k);if(s===null||s.length>75)throw Error("Invalid Try data.");return s.split(",");};
 return data(list("values"),q.has("freq")?list("freq"):null,q.get("xname")??(q.has("freq")?"value":"data"),q.get("fname")??"freq");
}
const original=data([1,3,6],[2,5,1],"score","freq");
const example=data([2,4,7],[3,0,2],"lap","freq");
const defaultColumn=()=>({name:"",v:Array(N).fill(null)});
const init=(page="sheet")=>({page,c:0,row:0,cols:[defaultColumn(),defaultColumn()],buf:null,err:"",fromWatch:false});
const clone=s=>({...s,cols:s.cols.map(x=>({name:x.name,v:x.v.slice()}))});
const nextRow=r=>Math.min(N-1,r+1);
const label=(c,r)=>"AB"[c]+(r===-2?" name":r===-1?" formula":r+1);
function move(s,c,row){s.c=c;s.row=row;s.buf=null;return s;}
function select(old,c,r){
 const s=clone(old);s.err="";return move(s,c,r);
}
function commit(s,raw,how="down"){
 const col=s.cols[s.c];
 try{
  if(s.row===-1)throw Error("Leave the formula row empty. Put manual entries in numbered rows.");
  if(s.row===-2){
   const n=name(raw);
   if(s.cols[1-s.c].name===n)throw Error("That list name is already in use. Choose a different name.");
   col.name=n;
  } else {col.v[s.row]=number(raw,s.c===1);}
  s.buf=null;s.err="";
  if(how==="right")s.c=Math.min(1,s.c+1);
  else if(s.row>=0)s.row=nextRow(s.row);
 }catch(e){s.err=e.message;s.buf=String(raw??"");}
 return s;
}
function typed(old,raw){const s=clone(old);return s.page==="sheet"?commit(s,raw):s;}
function step(old,k){
 let s=clone(old);s.err="";
 if(k==="home"){s.page="home";s.buf=null;return s;}
 if(s.page==="home"){if(k==="1"||k==="enter")s.page="new";return s;}
 if(s.page==="new"){if(k==="4"){return {...init(),fromWatch:s.fromWatch};}if(k==="esc")s.page="home";return s;}
 if(k==="esc"){s.buf=null;return s;}
 if(k==="enter"){
  if(s.buf!==null)return commit(s,s.buf);
  s.buf=s.row===-2?s.cols[s.c].name:s.row>=0?String(s.cols[s.c].v[s.row]??""):"";
  if(s.row===-1)s.err="Formula row: leave it empty for this lesson.";
  return s;
 }
 if(k==="tab"){
  if(s.buf!==null)return commit(s,s.buf,"right");
  return move(s,s.c,s.row>=0?-2:0);
 }
 if(k==="left"||k==="right")return move(s,Math.max(0,Math.min(1,s.c+(k==="left"?-1:1))),s.row);
 if(k==="up"||k==="down")return move(s,s.c,Math.max(-2,Math.min(N-1,s.row+(k==="up"?-1:1))));
 if(k==="del"){
  if(s.buf!==null)s.buf=s.buf.slice(0,-1);
  else if(s.row>=0)s.cols[s.c].v[s.row]=null;
  else if(s.row===-2)s.cols[s.c].name="";
  return s;
 }
 const ch=/^[a-z0-9]$/.test(k)?k:({neg:"−",minus:"−",plus:"+",dot:"."})[k];
 if(ch===undefined)return s;
 if(s.row===-1){s.err="Formula row: move down to numbered data row 1.";return s;}
 if((s.buf||"").length<12)s.buf=(s.buf||"")+ch;
 return s;
}
function check(s,p){
 if(s.page!=="sheet")return {ok:false,message:"Open Lists & Spreadsheet first."};
 if(s.buf!==null)return {ok:false,message:"Press Enter to store the current entry before checking."};
 const cols=s.cols, desired=[{name:p.xname,v:p.v},...(p.f?[{name:p.fname,v:p.f}]:[])];
 for(let c=0;c<desired.length;c++){
  const [actual,exp]=[cols[c],desired[c]],letter="AB"[c];
  if(actual.name!==exp.name)return {ok:false,message:"Name column "+letter+" "+exp.name+" in its top cell."};
  const diff=Array.from({length:N},(_,i)=>i).find(i=>actual.v[i]!== (exp.v[i]??null));
  if(diff!==undefined){
   const loc=letter+(diff+1), expected=exp.v[diff];
   return {ok:false,message:expected===undefined?"Clear the extra entry in cell "+loc+".":"Check cell "+loc+". "+(c===1?"Keep each frequency next to its measured value.":"Follow the displayed row order.")};
  }
 }
 if(!p.f&&(cols[1].name||cols[1].v.some(v=>v!==null)))return {ok:false,message:"Raw data need only the named list in column A. Leave column B empty."};
 const n=p.f?p.f.reduce((a,b)=>a+b,0):p.v.length;
 return {ok:true,message:p.f?"Correct. The paired rows describe "+n+" observations, the sum of the frequencies.":"Correct. The named list holds "+n+" observations, including repeats."};
}
const context=(p)=>p.f?"Enter measured values in "+p.xname+" (A), and their counts in "+p.fname+" (B). Keep each pair on the same row.":"Enter every reading, including repeats, in the named list "+p.xname+" (A). Leave B empty.";
g.CT28=Object.freeze({N,name,number,data,link,original,example,init,clone,step,typed,select,label,check,context});
})(typeof module==="object"&&module.exports?module.exports:globalThis);
