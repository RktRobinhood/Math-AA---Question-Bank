/* Scoped paired-data tool; no emulator/firmware dependencies. */
(function(root,factory){"use strict";const api=factory();if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.CT33=api;})(typeof window==="undefined"?globalThis:window,()=>{
"use strict";
const LIMIT=10000,MAX=6;
const demo=Object.freeze({x:Object.freeze([0,1,2,3,4]),y:Object.freeze([24,37,55,85,123]),at:2.5,also:6});
const assigned=Object.freeze({x:Object.freeze([1,2,3,4,5]),y:Object.freeze([91,72,59,43,35]),at:3.5,also:7});
const fields=["X List","Y List","Save RegEqn to","Frequency List","Category List","Include Categories","1st Result Column"];
const menu=[
 ["1: Actions","2: Insert","3: Data","4: Statistics","5: Function Table"],
 ["1: Stat Calculations","2: Distributions","3: Confidence Intervals","4: Stat Tests"],
 ["1: One-Variable Statistics","2: Two-Variable Statistics","3: Linear Regression (mx+b)","4: Linear Regression (a+bx)","5: Median-Median Line","6: Quadratic Regression","7: Cubic Regression","8: Quartic Regression","9: Power Regression","A: Exponential Regression","B: Logarithmic Regression","C: Sinusoidal Regression","D: Logistic Regression (d=0)"]
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
const pos=v=>Number.isFinite(v)&&v>0;
function value(r,x){return Math.exp(r.logMean+r.slope*(x-r.xMean));}
function fit(x,y){
 const error=admit(x,y);if(error)return {error};
 if(y.some(v=>v<=0))return {error:"Every y-value must be positive. Exponential regression fits ln(y), which is not defined for zero or negative y."};
 if(new Set(x).size<2)return {error:"Use at least two distinct x-values to calculate a multiplier."};
 const n=x.length,avg=v=>v.reduce((s,x)=>s+x,0)/n,z=y.map(Math.log),xMean=avg(x),logMean=avg(z);
 const dx=x.map(v=>v-xMean),dz=z.map(v=>v-logMean),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
 const xx=dot(dx,dx),zz=dot(dz,dz),xz=dot(dx,dz);
 if(!(xx>0))return {error:"The x-values are too close for a reliable fit."};
 const slope=xz/xx, a=Math.exp(logMean-slope*xMean), b=Math.exp(slope),flat=y.every(v=>v===y[0]);
 if(!pos(a)||!pos(b))return {error:"The fitted coefficients exceed this lesson’s numeric range. Try more widely spaced x-values."};
 const r=flat||!(zz>0)?null:Math.min(1,Math.max(-1,xz/(Math.sqrt(xx)*Math.sqrt(zz))));
 const result={a:flat?y[0]:a,b:flat?1:b,r,r2:r===null?null:r*r,slope:flat?0:slope,logMean,xMean};
 const residuals=x.map((v,i)=>y[i]-value(result,v));
 const logResiduals=x.map((v,i)=>z[i]-(logMean+result.slope*(v-xMean)));
 return {...result,residuals,logResiduals};
}
function classify(x,t){
 if(x.includes(t))return "observed";
 return t<Math.min(...x)||t>Math.max(...x)?"extra":"inter";
}
function request(params){
 const keys=["x","y","at","also"],linked=params.get("mode")==="try"&&keys.some(k=>params.has(k));
 if(!linked)return {data:assigned,linked:false,error:""};
 const xx=params.getAll("x"),yy=params.getAll("y"),pp=params.getAll("at"),qq=params.getAll("also");
 const x=parseList(xx[0]),y=parseList(yy[0]),lo=x?Math.min(...x):0,hi=x?Math.max(...x):0;
 const at=pp.length?number(pp[0]):(lo+hi)/2;
 const also=qq.length?number(qq[0]):(hi+(hi-lo)/2<=LIMIT?hi+(hi-lo)/2:Math.max(-LIMIT,lo-(hi-lo)/2));
 const solution=x&&y?fit(x,y):{error:"Invalid lists"};
 if(xx.length!==1||yy.length!==1||pp.length>1||qq.length>1||at===null||also===null||solution.error||!pos(value(solution,at))||!pos(value(solution,also)))
  return {data:assigned,linked:false,error:"The linked data could not load. The original Try table is shown."};
 return {data:{x,y,at,also},linked:true,error:""};
}
const pad=(v)=>Array.from({length:MAX},(_,i)=>v[i]??null), clone=v=>JSON.parse(JSON.stringify(v));
const init=(data=assigned)=>({page:"sheet",x:pad(data.x),y:pad(data.y),at:data.at,also:data.also,row:0,col:0,edit:null,menu:0,choice:0,field:0,dropdown:null,settings:["","","f1","1","","","c[]"],run:null,error:"",fromWatch:false});
function trim(a){const last=a.findLastIndex(x=>x!==null);return a.slice(0,last+1);}
function readings(s){return {x:trim(s.x),y:trim(s.y),at:s.at,also:s.also};}
function commit(s){
 if(s.edit===null)return s;
 const v=s.edit.trim()===""?null:number(s.edit);
 if(v===null&&s.edit.trim()!==""){s.error="Use a number between −10,000 and 10,000.";return s;}
 (s.col===0?s.x:s.y)[s.row]=v;s.edit=null;s.run=null;return s;
}
function replace(base,x,y,at,also){
 if(!x||!y||at===null||also===null)return {...base,error:"Enter numeric readings in both lists and two numeric prediction inputs."};
 const error=admit(x,y);if(error)return {...base,error};
 return {...init({x,y,at,also}),fromWatch:base.fromWatch};
}
const choices=s=>s.field===2?["f1","f2","f3"]:options;
const nameIndex=a=>a==="xval"||a==="a[]"?0:a==="yval"||a==="b[]"?1:-1;
const menuLabels=[3,0,9], menuShortcuts=["4","1","a"];
function run(s){
 if(nameIndex(s.settings[0])<0||nameIndex(s.settings[1])<0){s.error="Choose both the X List and Y List.";return s;}
 const d=readings(s),provenance=s.settings.slice(0,2).map(nameIndex), all=[d.x,d.y];
 const ans=fit(all[provenance[0]],all[provenance[1]]);
 if(ans.error){s.error=ans.error;return s;}
 if(!pos(value(ans,s.at))||!pos(value(ans,s.also))){s.error="At least one requested prediction exceeds the numeric range. Choose less extreme predictor inputs.";return s;}
 s.page="result";s.choice=0;s.dropdown=null;s.run={...ans,provenance,store:s.settings[2]};
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
  if(key===menuShortcuts[s.menu]||((key==="right"||key==="enter")&&s.choice===menuLabels[s.menu])){
   if(s.menu===2){s.page="wizard";s.field=0;s.dropdown=null;s.settings=["","","f1","1","","","c[]"];s.run=null;}
   else{s.menu++;s.choice=0;}
  }
  return s;
 }
 if(s.page==="wizard"){
  if(s.dropdown!==null){
   const offered=choices(s);
   if(key==="right"||key==="down")s.dropdown=(s.dropdown+1)%offered.length;
   if(key==="left"||key==="up")s.dropdown=(s.dropdown+offered.length-1)%offered.length;
   if(key==="tab"||key==="enter"){s.settings[s.field]=offered[s.dropdown];s.dropdown=null;if(key==="tab")s.field++;}
   return s;
  }
  if(key==="tab"){s.field=(s.field+1)%9;return s;}
  if((key==="right"||key==="down")&&s.field<3){s.dropdown=Math.max(0,choices(s).indexOf(s.settings[s.field]));return s;}
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
 if(!Number.isFinite(expected))return false;
 const v=Number(txt), round=p=>Number(expected.toPrecision(p));
 // Correct 3–6 s.f. handheld readouts and full precision, not broad absolute tolerance.
 return Number.isFinite(v)&&([3,4,5,6].some(p=>v===round(p))||Math.abs(v-expected)<=Math.abs(expected)*1e-7);
}
function grade(s,answers){
 if(s.fromWatch)return "Reset to start the independent Try assignment.";
 if(!s.run)return "Run the regression on the handheld before checking.";
 if(s.run.provenance[0]!==0||s.run.provenance[1]!==1)return "Use xval as the X List and yval as the Y List. Swapping them changes the prediction model.";
 const d=readings(s),r=s.run;
 if(!compare(answers[0],r.a))return "Check a, the model’s estimated value at x = 0.";
 if(!compare(answers[1],r.b))return "Check b, the multiplication factor per increase of one in x.";
 const roundedA=Number(r.a.toPrecision(6)),roundedB=Number(r.b.toPrecision(6));
 if(!compare(answers[2],value(r,d.at))&&!compare(answers[2],roundedA*roundedB**d.at))
  return "Check the prediction. Evaluate a·b^x at the first stated x.";
 if(answers[3]!==classify(d.x,d.at))return "Check how the first input compares with the observed x-range.";
 if(answers[4]!==classify(d.x,d.also))return "Check how the second input compares with the observed x-range.";

 return "";
}
return Object.freeze({MAX,demo,assigned,fields,menu,names,options,choices,number,admit,parseList,fit,value,classify,request,init,readings,replace,press,display,grade});
});
