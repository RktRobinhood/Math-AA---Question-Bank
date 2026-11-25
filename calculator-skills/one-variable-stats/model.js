(function(g){"use strict";
const demo=Object.freeze({values:[2,4,7,11],freq:[1,2,3,2]}), practice=Object.freeze({values:[3,6,9,15],freq:[1,3,2,1]});
const rows=6, menu=[["1: Actions","2: Insert","3: Data","4: Statistics","5: Function Tab"],["1: Stat Calculations","2: Distributions","3: Confidence Intervals","4: Stat Tests"],["1: One-Variable Statistics","2: Two-Variable Statistics","3: Linear Regression (mx+b)"]];
const fields=["X1 List","Frequency List","Category List","Include Categories","1st Result Column","OK","Cancel"];
const choices=(s)=>s.field===0?["values","freq"]:s.field===1?["1","values","freq"]:s.field===4?["c[]","d[]"]:null;
const trim=s=>String(s).trim(), valuePattern=/^[+−-]?(?:\d{1,3}(?:\.\d{0,6})?|\.\d{1,6})$/;
function parseValue(s){
 const t=trim(s), x=Number(t.replace("−","-"));
 if(!valuePattern.test(t)||Math.abs(x)>999)throw Error("Enter a number from −999 to 999 (up to six decimal places).");
 return Object.is(x,-0)?0:x;
}
function parseFreq(s){
 const t=trim(s);
 if(!/^\d{1,3}$/.test(t))throw Error("Frequencies must be whole numbers from 0 to 999.");
 return Number(t);
}
function summary(values,freq=null){
 if(!Array.isArray(values)||values.length<2||values.length>rows)throw Error("Enter two to six data rows.");
 const xs=Array.from(values,parseValue);
 if(freq!==null&&(!Array.isArray(freq)||freq.length!==xs.length))throw Error("Each data row needs one frequency.");
 const f=freq===null?xs.map(()=>1):Array.from(freq,parseFreq);
 const n=f.reduce((a,b)=>a+b,0);
 if(n===0)throw Error("At least one observation must have positive frequency.");
 const terms=xs.map((x,i)=>[x,f[i]]).filter(x=>x[1]>0);
 const base=terms[0][0], mean=base+terms.reduce((a,[x,w])=>a+w*(x-base),0)/n;
 const sum=terms.reduce((a,[x,w])=>a+w*x,0),squares=terms.reduce((a,[x,w])=>a+w*x*x,0);
 const ss=terms.reduce((a,[x,w])=>a+w*(x-mean)**2,0);
 terms.sort((a,b)=>a[0]-b[0]);
 const at=k=>{for(const [x,w] of terms){if(k<w)return x;k-=w;}return terms.at(-1)[0];};
 const med=(start,len)=>(at(start+Math.floor((len-1)/2))+at(start+Math.floor(len/2)))/2;
 const half=Math.floor(n/2);
 return {mean,sum,squares,sd:Math.sqrt(ss/n),sample:n>1?Math.sqrt(ss/(n-1)):null,n,ss,min:terms[0][0],max:terms.at(-1)[0],median:med(0,n),q1:half?med(0,half):null,q3:half?med(n-half,half):null};
}
function series(s,fn){return s.split(",").map(fn);}
function request(q){
 const any=q.has("values")||q.has("freq"), bad="Invalid linked dataset. The original practice task is loaded.";
 if(!any)return {data:practice,linked:false,error:""};
 try{
  if(q.getAll("values").length!==1||q.getAll("freq").length>1)throw Error();
  const values=series(q.get("values"),parseValue),freq=q.has("freq")?series(q.get("freq"),parseFreq):null;
  summary(values,freq);return {data:{values,freq},linked:true,error:""};
 }catch{return {data:practice,linked:false,error:bad};}
}
function create(data){
 return {data:{values:data.values.map(String),freq:(data.freq||[]).map(String)},page:"sheet",menu:0,field:0,drop:null,count:"1",x:"values",freq:"1",out:"c[]",row:0,col:0,edit:null,result:null,lastRun:null,offset:0,error:""};
}
function commit(s){
 if(s.edit===null)return s;
 const k=s.col?"freq":"values";
 const v=s.data[k].slice(),p=s.col?parseFreq:parseValue;
 if(s.edit===""){delete v[s.row];}else v[s.row]=String(p(s.edit));
 while(v.length&&!Object.hasOwn(v,v.length-1))v.length--;
 return {...s,data:{...s.data,[k]:v}, edit:null,result:null,lastRun:null};
}
function calculate(s){
 try{
  const x=s.data[s.x],f=s.freq==="1"?null:s.data[s.freq];
  if(!x?.length)throw Error("Select a populated X1 List.");
  if(x.some(v=>v===undefined)||Array.from(x).includes(undefined)||f&&Array.from(f).includes(undefined))throw Error("Fill each row in both selected lists; do not leave gaps.");
  return {...s,page:"result",result:summary(x,f),lastRun:{x:s.x,freq:s.freq,out:s.out},offset:0,error:""};
 }catch(e){return {...s,error:e.message};}
}
const menuHot=["4","1","1"], clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
function press(s,k){
 s={...s,error:""};const enter=k==="enter"||k==="select";
 if(k==="esc"){
  if(s.drop!==null)return {...s,drop:null};
  if(s.page==="sheet"&&s.edit!==null)return {...s,edit:null};
  return {...s,page:s.result?"result":"sheet"};
 }
 if(k==="menu"){
  try{s=commit(s);}catch(e){return {...s,error:e.message};}
  return {...s,page:"menu",menu:0,field:3,drop:null};
 }
 if(s.page==="menu"){
  if(k==="up"||k==="down")return {...s,field:clamp(s.field+(k==="down"?1:-1),0,menu[s.menu].length-1)};
  if(k===menuHot[s.menu]||((enter||k==="right")&&s.field===(s.menu===0?3:0))){
   return s.menu===2?{...s,page:"count",count:"1",field:0}:{...s,menu:s.menu+1,field:0};
  }
  if(k==="left"&&s.menu>0)return {...s,menu:s.menu-1,field:s.menu===1?3:0};
  return s;
 }
 if(s.page==="count"){
  if(k==="tab")return {...s,field:(s.field+1)%3};
  if(k==="up"||k==="down")return {...s,field:clamp(s.field+(k==="down"?1:-1),0,2)};
  if(/^[0-9]$/.test(k))return {...s,count:k,field:0};
  if(enter&&s.field===2)return {...s,page:s.result?"result":"sheet"};
  if(enter||k==="right"){
   if(s.count!=="1")return {...s,error:"Use one list in this lesson."};
   return {...s,page:"wizard",field:0,x:"values",freq:"1",out:"c[]"};
  }
  return s;
 }
 if(s.page==="wizard"){
  const fieldKey=s.field===0?"x":s.field===1?"freq":"out",opts=choices(s);
  if(s.drop!==null){
   if(k==="up"||k==="down")return {...s,drop:clamp(s.drop+(k==="down"?1:-1),0,opts.length-1)};
   if(enter)return {...s,[fieldKey]:opts[s.drop],drop:null};
   return s;
  }
  if(k==="tab"||k==="backtab")return {...s,field:(s.field+(k==="tab"?1:6))%7};
  if((k==="right"||k==="down")&&opts)return {...s,drop:opts.indexOf(s[fieldKey])};
  if(k==="up"||k==="down")return {...s,field:clamp(s.field+(k==="down"?1:-1),0,6)};
  if(k==="1"&&s.field===1)return {...s,freq:"1"};
  if(k==="v"&&s.field===0)return {...s,x:"values"};
  if(k==="f"&&s.field===1)return {...s,freq:"freq"};
  if(enter)return s.field===6?{...s,page:s.result?"result":"sheet"}:calculate(s);
  return s;
 }
 if(s.page==="result"){
  if(k==="down"||k==="up")return {...s,offset:clamp(s.offset+(k==="down"?1:-1),0,6)};
  if(k==="left")return {...s,page:"sheet"};
  return s;
 }
 if(s.page==="sheet"){
  if(/^\d$/.test(k)||["dot","neg","minus","del"].includes(k)){
   const v=s.edit===null?"":s.edit;
   const edit=k==="del"?v.slice(0,-1):v+(k==="dot"?".":k==="neg"||k==="minus"?"-":k);
   return {...s,edit:edit.slice(0,11)};
  }
  if(enter||["up","down","left","right","tab"].includes(k)){
   try{s=commit(s);}catch(e){return {...s,error:e.message};}
   return {...s,row:clamp(s.row+(k==="up"?-1:(k==="down"||enter?1:0)),0,rows-1),col:k==="tab"?1-s.col:k==="left"?0:k==="right"?1:s.col};
  }
 }
 return s;
}
function grade(input,calc,target,kind){
 if(!calc)return "Run One-Variable Statistics first.";
 if(calc.lastRun.x!=="values"||calc.lastRun.freq!==(target.freq?"freq":"1"))return "Check the X1 List and Frequency List before grading.";
 const a=calc.data.values.map(Number),b=calc.data.freq.map(Number);
 const equal=(x,y)=>x.length===y.length&&x.every((v,i)=>v===y[i]);
 if(!equal(a,target.values)||target.freq&&!equal(b,target.freq))return "Use the original task data. Reset to restore them.";
 if(kind!=="population")return "These are all the observations in the stated collection, so use σx.";
 const expected=summary(target.values,target.freq);
 const check=(v,n)=>Number.isFinite(v)&&(n===0?v===0:Math.abs(v-n)<=Math.abs(n)*1e-12||Array.from({length:14},(_,i)=>Number(n.toPrecision(i+3))).includes(v));
 if(!check(input.mean,expected.mean))return "Read x̄ for the mean.";
 if(!check(input.sd,expected.sd))return "Read σx, not sx, for this population standard deviation.";
 return "";
}
g.CT29=Object.freeze({demo,practice,rows,menu,fields,choices,summary,parseValue,parseFreq,request,create,press,grade});
})(typeof window==="undefined"?globalThis:window);
