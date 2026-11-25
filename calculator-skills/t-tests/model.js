(function(g){"use strict";
const workedOne={test:"one",mu:"0",mean:"3",sd:"4",n:"9",alt:"gt",alpha:"0.05"};
const workedTwo={test:"two",mean1:"35",sd1:"4",n1:"10",mean2:"31",sd2:"5",n2:"12",alt:"ne",pooled:"yes",alpha:"0.05"};
const practice={test:"two",mean1:"42",sd1:"5",n1:"12",mean2:"45",sd2:"4",n2:"15",alt:"lt",pooled:"yes",alpha:"0.05"};
const menu={
 menu:[[3,"Algebra"],[4,"Calculus"],[5,"Probability"],[6,"Statistics"],[7,"Matrix & Vector"]],
 stats:[[3,"List Math"],[4,"List Operations"],[5,"Distributions"],[6,"Confidence Intervals"],[7,"Stat Tests"]],
 tests:[[1,"z Test"],[2,"t Test"],[3,"2-Sample z Test"],[4,"2-Sample t Test"],[5,"1-Prop z Test"]]
};
const paths={menu:"Calculator menu",stats:"Statistics",tests:"Stat Tests"};
const numericOne=["mu","mean","sd","n"],numericTwo=["mean1","sd1","n1","mean2","sd2","n2"];
const inputKeys=(test)=>test==="one"?numericOne:numericTwo;
const fields=(test)=>[...inputKeys(test),"alt",...(test==="two"?["pooled"]:[])];
const altNames={ne:"≠",lt:"<",gt:">"},alts=Object.keys(altNames);
const parseNum=(v)=>{
 const raw=String(v).trim().replaceAll("−","-");
 if(!/^[+-]?(?:\d{1,3}(?:\.\d{1,3})?|\.\d{1,3})$/.test(raw)||Math.abs(Number(raw))>999)throw Error("Enter numeric summaries from −999 to 999, up to three decimal places.");
 return Number(raw)||0;
};
function parse(task){
 if(!["one","two"].includes(task.test))throw Error("Choose one or two samples.");
 const out={test:task.test};
 for(const k of inputKeys(task.test)){
  out[k]=parseNum(task[k]);
  if(k.startsWith("n")&&(!Number.isInteger(out[k])||out[k]<2||out[k]>999))throw Error("Sample sizes must be whole numbers from 2 to 999.");
  if(k.startsWith("sd")&&out[k]<=0)throw Error("Use a positive sample standard deviation.");
 }
 if(!alts.includes(task.alt))throw Error("Choose one of the alternative hypotheses.");
 out.alt=task.alt;
 if(task.test==="two"){
  if(!["yes","no"].includes(task.pooled))throw Error("Choose Yes or No for pooling.");
  out.pooled=task.pooled;
 }
 const alpha=String(task.alpha??"0.05").trim();if(!/^(?:0?\.0?1|0?\.05|0?\.10)$/.test(alpha)||![.01,.05,.1].includes(Number(alpha)))throw Error("Choose α = 0.01, 0.05 or 0.10.");
 out.alpha=Number(alpha);return out;
}
const allParams=["test",...numericOne,...numericTwo,"alt","pooled","alpha"];
function request(params){
 if(!allParams.some(k=>params.has(k)))return {target:practice,linked:false,error:""};
 try{
  const test=params.get("test"),required=["test",...fields(test)],valid=[...required,"alpha"];
  if(required.some(k=>params.getAll(k).length!==1)||params.getAll("alpha").length>1||allParams.some(k=>!valid.includes(k)&&params.has(k)))throw Error();
  const target=Object.fromEntries(valid.map(k=>[k,params.get(k)??"0.05"]));parse(target);
  return {target,linked:true,error:""};
 }catch{return {target:practice,linked:true,error:"Invalid t-test link. The unsolved practice example is shown instead."};}
}
// Regularized incomplete beta via symmetry and a continued fraction (modified Lentz).
const lanczos=[676.5203681218851,-1259.1392167224028,771.3234287776531,-176.6150291621406,12.5073432786869,-.13857109526572012,9.984369578019572e-6,1.5056327351493116e-7];
function lgamma(z){
 if(z<.5)return Math.log(Math.PI)-Math.log(Math.sin(Math.PI*z))-lgamma(1-z);
 z-=1;let x=.9999999999998099;lanczos.forEach((v,i)=>x+=v/(z+i+1));const t=z+7.5;
 return .91893853320467274+(z+.5)*Math.log(t)-t+Math.log(x);
}
function cf(a,b,x){
 const lim=1e-295,nz=y=>Math.abs(y)<lim?lim:y,ap=a+1,am=a-1,q=a+b;
 let c=1,d=1/nz(1-q*x/ap),h=d;
 for(let m=1;m<=500;m++){
  const j=2*m;let f=m*(b-m)*x/((am+j)*(a+j));d=1/nz(1+f*d);c=nz(1+f/c);h*=d*c;
  f=-(a+m)*(q+m)*x/((a+j)*(ap+j));d=1/nz(1+f*d);c=nz(1+f/c);const delta=d*c;h*=delta;
  if(Math.abs(delta-1)<4e-15)return h;
 }
 throw Error("The simulated tail did not converge.");
}
function ibeta(a,b,x){
 if(x<=0||x>=1)return x<=0?0:1;
 const f=Math.exp(lgamma(a+b)-lgamma(a)-lgamma(b)+a*Math.log(x)+b*Math.log1p(-x));
 return x<(a+1)/(a+b+2)?f*cf(a,b,x)/a:1-f*cf(b,a,1-x)/b;
}
function calculate(task){
 const v=parse(task);let t,df,sp=null;
 if(v.test==="one"){t=(v.mean-v.mu)/(v.sd/Math.sqrt(v.n));df=v.n-1;}
 else if(v.pooled==="yes"){
  df=v.n1+v.n2-2;sp=Math.sqrt(((v.n1-1)*v.sd1**2+(v.n2-1)*v.sd2**2)/df);
  t=(v.mean1-v.mean2)/(sp*Math.sqrt(1/v.n1+1/v.n2));
 }else{
  const a=v.sd1**2/v.n1,b=v.sd2**2/v.n2;df=(a+b)**2/(a*a/(v.n1-1)+b*b/(v.n2-1));
  t=(v.mean1-v.mean2)/Math.sqrt(a+b);
 }
 const x=df/(df+t*t),y=t*t/(df+t*t);
 const tail=.5*(Math.abs(t)<.5?1-ibeta(.5,df/2,y):ibeta(df/2,.5,x));
 const p=Math.max(0,Math.min(1,v.alt==="ne"?2*tail:v.alt==="gt"?(t>=0?tail:1-tail):(t<=0?tail:1-tail)));
 return {task:v,t,df,p,sp,extremeSmall:p===0};
}
function matches(r,task){
 const v=parse(task);return r&&v.test===r.task.test&&fields(v.test).every(k=>v[k]===r.task[k]);
}
const labels={mu:"μ₀",mean:"x̄",sd:"sx",n:"n",mean1:"x̄₁",sd1:"sx₁",n1:"n₁",mean2:"x̄₂",sd2:"sx₂",n2:"n₂",alt:"Alternate Hyp",pooled:"Pooled"};
const title=test=>test==="two"?"2-Sample t Test":"t Test";
function hypothesis(test,a){return test==="two"?"μ₁ "+altNames[a]+" μ₂":"μ "+altNames[a]+" μ₀";}
function start(){return {page:"calc",test:"one",index:0,method:"Data",field:0,values:{},list:false,error:"",result:null,earlier:null};}
function choose(s,choice){
 if(s.page==="method")return {...s,method:choice,field:0,list:false,error:""};
 const k=fields(s.test)[s.field];if(!["alt","pooled"].includes(k))return s;
 return {...s,values:{...s.values,[k]:choice},list:false,error:""};
}
function openForm(s){
 if(s.method!=="Stats")return {...s,error:"This lesson uses summary statistics. Switch Data Input Method to Stats."};
 return {...s,page:"form",field:0,list:false,error:"",values:Object.fromEntries(fields(s.test).map(k=>[k,k==="alt"?"ne":k==="pooled"?"no":""]))};
}
function press(s,key){
 const select=["enter","select"].includes(key);
 if(key==="menu")return {...s,page:"menu",index:0,list:false,error:""};
 if(key==="esc"){
  if(s.list)return {...s,list:false,error:""};
  if(s.page==="tests")return {...s,page:"stats",index:4,error:""};
  if(s.page==="stats")return {...s,page:"menu",index:3,error:""};
  return {...s,page:"calc",field:0,error:""};
 }
 if(menu[s.page]){
  const rows=menu[s.page];
  if(["up","down"].includes(key))return {...s,index:(s.index+(key==="down"?1:rows.length-1))%rows.length,error:""};
  if(key==="left"&&s.page!=="menu")return press(s,"esc");
  const id=key==="right"||select?rows[s.index][0]:Number(key);
  if(s.page==="menu"&&id===6)return {...s,page:"stats",index:0,error:""};
  if(s.page==="stats"&&id===7)return {...s,page:"tests",index:0,error:""};
  if(s.page==="tests"&&[2,4].includes(id))return {...s,page:"method",test:id===2?"one":"two",index:0,method:"Data",field:0,error:"",result:s.result,earlier:s.earlier};
  return s;
 }
 if(s.page==="method"){
  if(s.list){
   if(["up","down","right","left"].includes(key))return {...s,method:s.method==="Data"?"Stats":"Data",error:""};
   if(select)return {...s,list:false,error:""};
   return s;
  }
  if(key==="right"&&s.field===0)return {...s,list:true,error:""};
  if(key==="tab"||key==="down")return {...s,field:(s.field+1)%3,error:""};
  if(key==="backtab"||key==="up")return {...s,field:(s.field+2)%3,error:""};
  if(select)return s.field===2?{...s,page:"calc",error:""}:openForm(s);
  return s;
 }
 if(s.page!=="form")return s;
 const fs=fields(s.test),k=fs[s.field],choices=k==="alt"?alts:k==="pooled"?["no","yes"]:null;
 if(s.list&&choices){
  if(["up","down","right","left"].includes(key))return {...choose(s,choices[(choices.indexOf(s.values[k])+(["up","left"].includes(key)?choices.length-1:1))%choices.length]),list:true};
  if(select)return {...s,list:false,error:""};
  return s;
 }
 if((key==="right"||key==="left")&&choices)return {...s,list:true,error:""};
 if(key==="tab"||key==="down")return {...s,field:(s.field+1)%(fs.length+2),error:""};
 if(key==="backtab"||key==="up")return {...s,field:(s.field+fs.length+1)%(fs.length+2),error:""};
 if(select){
  if(s.field===fs.length+1)return {...s,page:"calc",error:""};
  try{return {...s,page:"result",earlier:s.result,result:calculate({test:s.test,...s.values}),error:""};}
  catch(e){return {...s,error:e.message};}
 }
 if(k&&!choices){
  const v=s.values[k],digit=/^\d$/;
  if(key==="del"||key==="neg"||key==="minus"||key==="dot"||digit.test(key)){
   const input=key==="del"?v.slice(0,-1):key==="neg"||key==="minus"?v[0]==="-"?v.slice(1):"-"+v:key==="dot"?v.includes(".")?v:v+".":v.length<8?v+key:v;
   return {...s,values:{...s.values,[k]:input},error:""};
  }
 }
 return s;
}
const duration=58;
const cues=[
 [0,"Matched pairs are one sample","For the same items measured twice, first compute one difference per item. Here use the nine differences, not two independent lists."],
 [5.4,"Open t Test","Population SD is unknown. On Calculator, choose Menu → 6 Statistics → 7 Stat Tests → 2 t Test. Switch Data Input Method to Stats."],
 [13.1,"Enter summaries and direction","Use μ₀ = 0, x̄ = 3, sx = 4 and n = 9. The claim is an increase: select μ > μ₀ and confirm."],
 [25.8,"Read PVal and decide","t = 2.25, df = 8. The one-sided PVal is about 0.02728. At 5%, reject H₀: there is evidence the mean difference is positive."],
 [30.4,"Independent groups need a different test","For independent normal groups with equal population variances, choose Stat Tests → 4 2-Sample t Test and switch to Stats."],
 [38.15,"Keep groups in order","Group 1: x̄ = 35, sx = 4, n = 10. Group 2: x̄ = 31, sx = 5, n = 12. Choose μ₁ ≠ μ₂ and Pooled: Yes."],
 [53.1,"Interpret the independent test","The two-sided PVal is about 0.0547, above 0.05. Do not reject H₀; that is not evidence the two means are equal."]
];
function seq(at,keys,gap=.61){return keys.map((k,j)=>[Number((at+j*gap).toFixed(3)),k]);}
const tape=[
 ...seq(6.1,["menu","6","7","2","right","down","enter","tab","enter"],.73),
 ...seq(13.4,["0","tab","3","tab","4","tab","9","tab","right","down","down","enter","tab","enter"],.83),
 ...seq(31.1,["menu","6","7","4","right","down","enter","tab","enter"],.73),
 ...seq(38.35,["3","5","tab","4","tab","1","0","tab","3","1","tab","5","tab","1","2","tab","tab","right","down","enter","tab","enter"],.64)
];
function watchAt(time){
 const t=Math.max(0,Math.min(duration,Number(time)||0));let state=start(),keys=[];
 for(const [at,key] of tape){if(t<at)break;state=press(state,key);keys=t<at+.39?[key]:[];}
 return {state,keys,chapter:cues.findLastIndex(([at])=>at<=t)};
}
const api={workedOne,workedTwo,practice,menu,paths,labels,title,fields,alts,hypothesis,start,press,choose,parse,request,calculate,matches,cues,tape,watchAt,duration};
if(typeof module==="object"&&module.exports)module.exports=api;else g.CT46=api;
})(globalThis);
