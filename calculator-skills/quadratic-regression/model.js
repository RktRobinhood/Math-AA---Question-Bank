/* Scoped paired-data tool; no emulator/firmware dependencies. */
(function(root,factory){"use strict";const api=factory();if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.CT32=api;})(typeof window==="undefined"?globalThis:window,()=>{
"use strict";
const LIMIT=10000,MAX=6;
const demo=Object.freeze({x:Object.freeze([0,1,2,3,4]),y:Object.freeze([10.25,15,19.5,15,10.25]),at:1.5});
const assigned=Object.freeze({x:Object.freeze([0,1,2,3,4]),y:Object.freeze([5.25,12,18.5,16,13.25]),at:1.5});
const fields=["X List","Y List","Save RegEqn to","Frequency List","Category List","Include Categories","1st Result Column"];
const menu=[
 ["1: Actions","2: Insert","3: Data","4: Statistics","5: Function Table"],
 ["1: Stat Calculations","2: Distributions","3: Confidence Intervals","4: Stat Tests"],
 ["1: One-Variable Statistics","2: Two-Variable Statistics","3: Linear Regression (mx+b)","4: Linear Regression (a+bx)","5: Median-Median Line","6: Quadratic Regression"]
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
 if(!Array.isArray(x)||!Array.isArray(y)||x.length!==y.length||x.length<3||x.length>MAX||x.some(v=>v===null)||y.some(v=>v===null))return "Enter three to six complete pairs, with one x and one y on each row.";
 if([...x,...y].some(v=>typeof v!=="number"||!Number.isFinite(v)||Math.abs(v)>LIMIT))return "Use only finite readings between −10,000 and 10,000.";
 return "";
};
function value(r,x){
 const t=(x-r.center)/r.scale;
 const raw=(r.A*t+r.B)*t+r.C;
 const dust=32*Number.EPSILON*(Math.abs(r.A*t*t)+Math.abs(r.B*t)+Math.abs(r.C));
 return Math.abs(raw)<=dust?0:raw;
}
function fit(x,y){
 const error=admit(x,y);if(error)return {error};
 if(new Set(x).size<3)return {error:"A unique quadratic fit needs at least three distinct x-values."};
 const n=x.length, min=Math.min(...x),max=Math.max(...x),center=(min+max)/2,scale=(max-min)/2;
 const t=x.map(v=>(v-center)/scale),w=t.map(v=>v*v);
 const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),norm=a=>Math.hypot(...a);
 const q0=t.map(()=>1/Math.sqrt(n));
 const r01=dot(t,q0),r02=dot(w,q0),v1=t.map((v,i)=>v-r01*q0[i]), r11=norm(v1);
 const q1=v1.map(v=>v/r11), r12=dot(w,q1),v2=w.map((v,i)=>v-r02*q0[i]-r12*q1[i]),r22=norm(v2);
 if(!(r22>1e-9)||!Number.isFinite(scale))return {error:"The x-values are too tightly clustered for a reliable fit. Use more separated readings."};
 const q2=v2.map(v=>v/r22),avg=y.reduce((s,v)=>s+v,0)/n, dy=y.map(v=>v-avg);
 const tiny=64*Number.EPSILON*Math.max(...dy.map(Math.abs),Number.MIN_VALUE);
 const first=dot(y,q0),second=dot(dy,q1),third=dot(dy,q2);
 const A=Math.abs(third)<=tiny?0:third/r22;
 const B=Math.abs(second-r12*A)<=tiny?0:(second-r12*A)/r11;
 const C=(first-r01*B-r02*A)/Math.sqrt(n);
 const clean=(v,m)=>Math.abs(v)<=32*Number.EPSILON*m?0:v;
 const a=A/(scale*scale), u=B/scale,v=2*a*center;
 const b=clean(u-v,Math.abs(u)+Math.abs(v)),offset=center*(b+a*center);
 const c=clean(C-offset,Math.abs(C)+Math.abs(offset));
 if(![a,b,c].every(Number.isFinite))return {error:"The fitted coefficients are too large for this lesson. Use more separated x-values."};
 const r={a,b,c,A,B,C,center,scale,min,max};
 const residuals=x.map((v,i)=>{const f=value(r,v);return clean(y[i]-f,Math.abs(y[i])+Math.abs(f));});
 const sse=dot(residuals,residuals),sst=dot(dy,dy);
 const r2=sst===0?null:Math.max(0,Math.min(1,1-sse/sst));
 return {...r,r2,residuals};
}
function greatest(r){
 if(r.A===0&&r.B===0)return {x:[r.min,r.max],y:r.C,all:true};
 const vertex=r.A<0?r.center-r.scale*r.B/(2*r.A):NaN;
 if(Number.isFinite(vertex)&&vertex>r.min&&vertex<r.max)return {x:[vertex],y:value(r,vertex),all:false};
 // In normalized coordinates t = -1 and +1, so their difference is 2B.
 const x=r.B>0?[r.max]:r.B<0?[r.min]:[r.min,r.max];
 return {x,y:value(r,x[0]),all:false};
}
function request(params){
 const keys=["x","y","at"],linked=params.get("mode")==="try"&&keys.some(k=>params.has(k));
 if(!linked)return {data:assigned,linked:false,error:""};
 const xx=params.getAll("x"),yy=params.getAll("y"),p=params.getAll("at");
 const x=parseList(xx[0]),y=parseList(yy[0]),fitAt=p.length?number(p[0]):(x?.length?(Math.min(...x)+Math.max(...x))/2:null);
 // Reject a link whose predictor cannot identify a quadratic.
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
const choices=s=>s.field===2?["f1","f2","f3"]:options;
const nameIndex=a=>a==="xval"||a==="a[]"?0:a==="yval"||a==="b[]"?1:-1;
const menuLabels=[3,0,5];
function run(s){
 if(nameIndex(s.settings[0])<0||nameIndex(s.settings[1])<0){s.error="Choose both the X List and Y List.";return s;}
 const d=readings(s),provenance=s.settings.slice(0,2).map(nameIndex), all=[d.x,d.y];
 const ans=fit(all[provenance[0]],all[provenance[1]]);
 if(ans.error){s.error=ans.error;return s;}
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
  if(key===String(menuLabels[s.menu]+1)||((key==="right"||key==="enter")&&s.choice===menuLabels[s.menu])){
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
 const v=Number(txt), round=p=>Number(expected.toPrecision(p));
 // Correct 3–6 s.f. handheld readouts and full precision, not broad absolute tolerance.
 return Number.isFinite(v)&&([3,4,5,6].some(p=>v===round(p))||Math.abs(v-expected)<=Math.abs(expected)*1e-7);
}
function grade(s,answers){
 if(s.fromWatch)return "Reset to start the independent Try assignment.";
 if(!s.run)return "Run the regression on the handheld before checking.";
 if(s.run.provenance[0]!==0||s.run.provenance[1]!==1)return "Use xval as the X List and yval as the Y List. Swapping them changes the prediction model.";
 const data=readings(s),max=greatest(s.run);
 if(!compare(answers[0],value(s.run,s.at)))return "Check the prediction. Substitute the requested x into the stored quadratic.";
 const x=number(answers[1]),good=max.all?x!==null&&x>=s.run.min&&x<=s.run.max:max.x.some(v=>compare(answers[1],v));
 if(!good)return "Check x at the fitted maximum on the observed x-range.";
 if(!compare(answers[2],max.y))return "Check the greatest fitted value. Use the model, not a data row.";
 if(!compare(answers[3],Math.max(...data.y)))return "Check the largest observed value in column B.";
 return "";
}
return Object.freeze({MAX,demo,assigned,fields,menu,names,options,choices,number,admit,parseList,fit,value,greatest,request,init,readings,replace,press,display,grade});
});
