/* Scoped paired-data tool; no emulator/firmware dependencies. */
(function(root,factory){"use strict";const api=factory();if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.CT31=api;})(typeof window==="undefined"?globalThis:window,()=>{
"use strict";
const LIMIT=10000,MAX=6;
const demo=Object.freeze({x:Object.freeze([1,2,3,4]),y:Object.freeze([2,3,5,6]),at:3.5});
const assigned=Object.freeze({x:Object.freeze([1,2,3,4]),y:Object.freeze([7,6,4,3]),at:3.5});
const fields=["X List","Y List","Save RegEqn to","Frequency List","Category List","Include Categories","1st Result Column"];
const menu=[
 ["1: Actions","2: Insert","3: Data","4: Statistics","5: Function Table"],
 ["1: Stat Calculations","2: Distributions","3: Confidence Intervals","4: Stat Tests"],
 ["1: One-Variable Statistics","2: Two-Variable Statistics","3: Linear Regression (mx+b)","4: Linear Regression (a+bx)","5: Median-Median Line"]
];
const names=["xval","yval"], options=[...names,"a[]","b[]"];
const number=s=>{const str=String(s??"").trim().replace(/−/g,"-");if(!/^[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)$/.test(str))return null;
 const v=Number(str);return Number.isFinite(v)&&Math.abs(v)<=LIMIT?v:null;};
const parseList=x=>{
 const source=String(x??"").trim();
 const parts=/[,;]/.test(source)?source.split(/[,;]/):source.split(/\s+/);
 if(!parts.length||parts.length>MAX)return null;
 const v=parts.map(number);return v.includes(null)?null:v;
};
const admit=(x,y)=>{
 if(!Array.isArray(x)||!Array.isArray(y)||x.length!==y.length||x.length<2||x.length>MAX||x.some(v=>v===null)||y.some(v=>v===null))return "Enter two to six complete pairs, with one x and one y on each row.";
 if([...x,...y].some(v=>typeof v!=="number"||!Number.isFinite(v)||Math.abs(v)>LIMIT))return "Use only finite readings between −10,000 and 10,000.";
 return "";
};
function fit(x,y){
 const error=admit(x,y);if(error)return {error};
 const n=x.length,mean=a=>a.reduce((s,v)=>s+v,0)/n, X=mean(x),Y=mean(y),dx=x.map(v=>v-X),dy=y.map(v=>v-Y);
 const X2=dx.reduce((s,v)=>s+v*v,0),Y2=dy.reduce((s,v)=>s+v*v,0),XY=dx.reduce((s,v,i)=>s+v*dy[i],0);
 if(x.every(v=>v===x[0])||!(X2>0))return {error:"All x-values are equal. A slope and Pearson r cannot be found."};
 const flat=y.every(v=>v===y[0]),m=flat?0:XY/X2,b=flat?y[0]:Y-m*X;
 const r=flat||!(Y2>0)?null:Math.max(-1,Math.min(1,XY/(Math.sqrt(X2)*Math.sqrt(Y2))));
 if(!Number.isFinite(m)||!Number.isFinite(b))return {error:"These readings are too close to distinguish. Use more widely spaced x-values."};
 return {m,b,r,r2:r===null?null:r*r,at:t=>m*t+b,notes:r===null?"All y-values are equal. The fitted line is flat; r and r² are undefined.":""};
}
function request(params){
 const keys=["x","y","at"],linked=params.get("mode")==="try"&&keys.some(k=>params.has(k));
 if(!linked)return {data:assigned,linked:false,error:""};
 const xx=params.getAll("x"),yy=params.getAll("y"),p=params.getAll("at");
 const x=parseList(xx[0]),y=parseList(yy[0]),fitAt=p.length?number(p[0]):(x?.length?(Math.min(...x)+Math.max(...x))/2:null);
 // A linked table may deliberately represent a constant-y edge, but never invalid X.
 const solution=x&&y?fit(x,y):{error:"Invalid lists"};
 if(xx.length!==1||yy.length!==1||p.length>1||fitAt===null||solution.error)return {data:assigned,linked:false,error:"The linked data could not load. The original Try table is shown."};
 return {data:{x,y,at:fitAt},linked:true,error:""};
}
const pad=(v)=>Array.from({length:MAX},(_,i)=>v[i]??null), clone=v=>JSON.parse(JSON.stringify(v));
const init=(data=assigned)=>({page:"sheet",x:pad(data.x),y:pad(data.y),at:data.at,row:0,col:0,edit:null,menu:0,choice:0,field:0,dropdown:null,settings:["","","f1","1","","","c[]"],run:null,error:"",fromWatch:false});
function trim(a){const last=a.findLastIndex(x=>x!==null);return a.slice(0,last+1);}
function readings(s){return {x:trim(s.x),y:trim(s.y),at:s.at};}
function commit(s){
 if(s.edit===null)return s;
 const v=s.edit.trim()===""?null:number(s.edit);
 if(v===null&&s.edit.trim()!==""){s.error="Use a number between −10,000 and 10,000.";return s;}
 (s.col===0?s.x:s.y)[s.row]=v;s.edit=null;s.run=null;return s;
}
function replace(base,x,y,at){
 if(!x||!y||at===null)return {...base,error:"Enter up to six numeric readings in each list and a numeric prediction input."};
 const error=admit(x,y);if(error)return {...base,error};
 return {...init({x,y,at}),fromWatch:base.fromWatch};
}
const nameIndex=a=>a==="xval"||a==="a[]"?0:a==="yval"||a==="b[]"?1:-1;
const menuLabels=[3,0,2];
function run(s){
 if(nameIndex(s.settings[0])<0||nameIndex(s.settings[1])<0){s.error="Choose both the X List and Y List.";return s;}
 const d=readings(s),provenance=s.settings.slice(0,2).map(nameIndex), all=[d.x,d.y];
 const ans=fit(all[provenance[0]],all[provenance[1]]);
 if(ans.error){s.error=ans.error;return s;}
 s.page="result";s.choice=0;s.dropdown=null;s.run={m:ans.m,b:ans.b,r:ans.r,r2:ans.r2,notes:ans.notes,provenance,
  residuals:all[provenance[1]].map((v,i)=>v-(ans.m*all[provenance[0]][i]+ans.b))};
 return s;
}
function press(base,key){
 const s=clone(base);s.error="";
 if(key==="escape"){
  if(s.dropdown!==null)s.dropdown=null;
  else if(s.page==="menu"&&s.menu>0){s.menu--;s.choice=menuLabels[s.menu];}
  else if(s.page!=="sheet"){s.page="sheet";s.edit=null;}
  else s.edit=null;
  return s;
 }
 if(key==="menu"){if(s.page==="sheet"&&s.edit!==null){commit(s);if(s.error)return s;}s.page="menu";s.menu=0;s.choice=0;s.dropdown=null;return s;}
 if(s.page==="menu"){
  if(key==="up"||key==="down"){s.choice=(s.choice+(key==="up"?-1:1)+menu[s.menu].length)%menu[s.menu].length;return s;}
  if(key===String(menuLabels[s.menu]+1)||((key==="right"||key==="enter")&&s.choice===menuLabels[s.menu])){
   if(s.menu===2){s.page="wizard";s.field=0;s.dropdown=null;s.settings=["","","f1","1","","","c[]"];s.run=null;}
   else{s.menu++;s.choice=0;}
  }
  return s;
 }
 if(s.page==="wizard"){
  if(s.dropdown!==null){
   if(key==="right"||key==="down")s.dropdown=(s.dropdown+1)%options.length;
   if(key==="left"||key==="up")s.dropdown=(s.dropdown+options.length-1)%options.length;
   if(key==="tab"||key==="enter"){s.settings[s.field]=options[s.dropdown];s.dropdown=null;if(key==="tab")s.field++;}
   return s;
  }
  if(key==="tab"){s.field=(s.field+1)%9;return s;}
  if((key==="right"||key==="down")&&s.field<2){s.dropdown=Math.max(0,options.indexOf(s.settings[s.field]));return s;}
  if(key==="enter"&&s.field===8){s.page="sheet";return s;}
  if(key==="enter")return run(s);
  return s;
 }
 if(s.page==="result"){if(key==="down")s.choice=Math.min(2,s.choice+1);if(key==="up")s.choice=Math.max(0,s.choice-1);return s;}
 if(key==="backspace"){s.edit=(s.edit??String((s.col===0?s.x:s.y)[s.row]??"")).slice(0,-1);return s;}
 if(/^[0-9.]$/.test(key)||key==="negative"||key==="minus"){s.edit=((s.edit??"")+((key==="negative"||key==="minus")?"-":key)).slice(0,18);return s;}
 if(["enter","tab","up","down","left","right"].includes(key)){
  commit(s);if(s.error)return s;
  if(key==="enter"||key==="down")s.row=Math.min(MAX-1,s.row+1);
  if(key==="up")s.row=Math.max(0,s.row-1);
  if(key==="right"||key==="tab")s.col=1-s.col;
  if(key==="left")s.col=0;
 }
 return s;
}
const display=(v)=>v===null?"undef":String(Number(v.toPrecision(6))).replace(/^-/, "−");
function compare(given,expected){
 if(expected===null)return /^(?:undef(?:ined)?|none|n\/a)$/i.test(String(given??"").trim());
 const txt=String(given??"").trim().replace(/−/g,"-");
 if(!/^[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:e[+-]?\d+)?$/i.test(txt))return false;
 const v=Number(txt), round=p=>Number(expected.toPrecision(p));
 // Correct 3–6 s.f. handheld readouts and full precision, not broad absolute tolerance.
 return Number.isFinite(v)&&([3,4,5,6].some(p=>v===round(p))||Math.abs(v-expected)<=Math.max(1e-10,Math.abs(expected)*1e-7));
}
function grade(s,answers){
 if(s.fromWatch)return "Reset to start the independent Try assignment.";
 if(s.page!=="result"||!s.run)return "Run the regression on the handheld before checking.";
 if(s.run.provenance[0]!==0||s.run.provenance[1]!==1)return "Use xval as the X List and yval as the Y List. Swapping them changes the prediction model.";
 const {m,b,r,r2}=s.run,test=[["slope",m],["intercept",b],["Pearson r",r],["r²",r2],["prediction",m*s.at+b]];
 for(let i=0;i<test.length;i++)if(!compare(answers[i],test[i][1]))return "Check "+test[i][0]+(i===2?". Read r, not the r² row.":i===4?". Use y = mx + b with the stated x.":".");
 return "";
}
return Object.freeze({MAX,demo,assigned,fields,menu,names,options,number,admit,parseList,fit,request,init,readings,replace,press,display,grade});
});
