(function(g){"use strict";
const worked={obs:[28,20,32],probs:[.2,.3,.5],alpha:.05},practice={obs:[14,27,19],probs:[.25,.35,.4],alpha:.05};
const menu={
 menu:[[1,"Actions"],[2,"Insert"],[3,"Data"],[4,"Statistics"],[5,"Function Table"]],
 stats:[[1,"Stat Calculations"],[2,"Distributions"],[3,"Confidence Intervals"],[4,"Stat Tests"]],
 tests:[[5,"1-Prop z Test"],[6,"2-Prop z Test"],[7,"χ² GOF"],[8,"χ² 2-way Test"],[9,"2-Sample F Test"]]
};
const paths={menu:"Lists & Spreadsheet menu",stats:"Statistics",tests:"Stat Tests"};
const fields=["observed","expected","df","out","draw"],labels={observed:"Observed List",expected:"Expected List",df:"Deg of Freedom, df",out:"1st Result Column",draw:"Draw"};
const ALPHA=[.01,.05,.1],scale=10000,toTicks=x=>Math.round(x*scale);
const rows=[0,1,2,3,4,5];
const rawObs=/^\d{1,3}$/,rawProb=/^(?:0?(?:\.\d{1,4})|1(?:\.0{1,4})?)$/,rawExp=/^(?:\d{1,4}(?:\.\d{1,4})?|\.\d{1,4})$/;
const sum=a=>a.reduce((x,y)=>x+y,0);
function list(raw,kind){
 const pat=kind==="obs"?rawObs:rawProb;
 if(typeof raw!=="string"||raw.length>64)throw Error("Use short comma-separated lists.");
 const values=raw.split(",").map(v=>v.trim());
 if(values.length<3||values.length>6||values.some(x=>!pat.test(x)))throw Error(kind==="obs"?"Use 3–6 whole observed counts from 0 to 999.":"Use 3–6 positive decimal probabilities, with at most four decimal places.");
 return values.map(Number);
}
function setup(obs,probs,alpha=.05){
 if(obs.length<3||obs.length>6||obs.length!==probs.length||obs.some(x=>!Number.isInteger(x)||x<0||x>999))throw Error("Use matching lists of 3–6 categories.");
 const N=sum(obs),pr=probs.map(toTicks);
 if(probs.some((p,i)=>!Number.isFinite(p)||p<=0||p>1||Math.abs(pr[i]/scale-p)>1e-12)||sum(pr)!==scale)throw Error("The model probabilities must sum to exactly 1.");
 if(!ALPHA.includes(alpha))throw Error("Choose alpha = 0.01, 0.05, or 0.10.");
 const exp=pr.map(v=>v*N/scale);
 if(exp.some(e=>e<=5))throw Error("The current IB exam shortcut requires every expected count to be greater than 5.");
 return {obs,probs,alpha,N,exp,df:obs.length-1};
}
function request(params){
 const linked=["obs","probs","alpha"].some(k=>params.has(k));
 if(!linked)return {target:practice,linked,error:""};
 try{
  if(params.getAll("obs").length!==1||params.getAll("probs").length!==1||params.getAll("alpha").length>1)throw Error();
  const rawAlpha=params.get("alpha")??"0.05";if(!/^(?:0?\.01|0?\.05|0?\.1(?:0)?)$/.test(rawAlpha))throw Error();
  const target={obs:list(params.get("obs"),"obs"),probs:list(params.get("probs"),"probs"),alpha:Number(rawAlpha)};
  setup(target.obs,target.probs,target.alpha);return {target,linked,error:""};
 }catch{return {target:practice,linked,error:"Invalid GOF link. The unsolved practice example is shown instead."};}
}
const logGammaHalf=[null,Math.log(Math.sqrt(Math.PI)),0,Math.log(Math.sqrt(Math.PI)/2),0,Math.log(3*Math.sqrt(Math.PI)/4)];
function qgamma(df,x){
 if(x===0)return 1;
 const a=df/2,l=a*Math.log(x)-x-logGammaHalf[df];
 if(x<a+1){
  let k=a,term=1/a,total=term;
  for(let i=0;i<400;i++){k++;term*=x/k;total+=term;if(Math.abs(term)<1e-16*total)break;}
  return Math.max(0,Math.min(1,1-total*Math.exp(l)));
 }
 let b=x+1-a,c=1e294,d=1/b,h=d;
 for(let i=1;i<=500;i++){
  const u=-i*(i-a);b+=2;d=u*d+b;c=b+u/c;
  if(Math.abs(d)<1e-294)d=1e-294;if(Math.abs(c)<1e-294)c=1e-294;
  d=1/d;const f=d*c;h*=f;if(Math.abs(f-1)<5e-16)break;
 }
 return Math.exp(l+Math.log(h));
}
function calculate(obs,exp,df){
 if(obs.length<3||obs.length>6||obs.length!==exp.length||obs.some(x=>!Number.isInteger(x)||x<0||x>999)||exp.some(x=>!Number.isFinite(x)||x<=5||Math.abs(x-toTicks(x)/scale)>1e-12))throw Error("Match observed and expected lists; every expected count must exceed 5.");
 if(sum(obs)*scale!==sum(exp.map(toTicks)))throw Error("Observed and expected totals must be the same.");
 if(!Number.isInteger(df)||df<1||df>=obs.length)throw Error("Use a valid whole-number df. For fixed probabilities, use number of categories minus one.");
 const contributions=obs.map((x,i)=>(x-exp[i])**2/exp[i]),stat=sum(contributions),p=qgamma(df,stat/2);
 return {obs:obs.slice(),exp:exp.slice(),df,stat,p,contributions,underflow:p===0};
}
function matches(r,target){
 if(!r)return false;
 const t=setup(target.obs,target.probs,target.alpha);
 return (!r.selection||r.selection[0]==="obs"&&r.selection[1]==="expt")&&r.df===t.df&&r.obs.length===t.obs.length&&r.exp.every((x,i)=>toTicks(x)===toTicks(t.exp[i])&&r.obs[i]===t.obs[i]);
}
function start(target=worked){
 return {page:"sheet",index:0,col:1,row:0,cells:[target.obs.map(String),target.obs.map(()=>""),[]],draft:null,
 fields:{observed:"",expected:"",df:""},field:0,error:"",result:null};
}
function chooseCell(s,col,row){return {...s,col,row,draft:null,error:""};}
function press(s,key){
 const select=key==="enter"||key==="select";
 if(key==="menu")return {...s,page:"menu",index:0,draft:null,error:""};
 if(key==="esc"){
  if(s.page==="tests")return {...s,page:"stats",index:3,error:""};
  if(s.page==="stats")return {...s,page:"menu",index:3,error:""};
  return {...s,page:s.result?"result":"sheet",draft:null,error:""};
 }
 if(menu[s.page]){
  const m=menu[s.page];
  if(["up","down"].includes(key))return {...s,index:(s.index+(key==="down"?1:m.length-1))%m.length,error:""};
  if(key==="left"&&s.page!=="menu")return press(s,"esc");
  const id=key==="right"||select?m[s.index][0]:Number(key);
  if(s.page==="menu"&&id===4)return {...s,page:"stats",index:0,error:""};
  if(s.page==="stats"&&id===4)return {...s,page:"tests",index:2,error:""};
  if(s.page==="tests"&&id===7)return {...s,page:"form",field:0,fields:{observed:"",expected:"",df:""},error:""};
  return s;
 }
 if(s.page==="form"){
  const k=fields[s.field],v=s.fields[k]??"";
  if(["tab","down"].includes(key))return {...s,field:(s.field+1)%7,error:""};
  if(["backtab","up"].includes(key))return {...s,field:(s.field+6)%7,error:""};
  if(select){
   if(s.field===6)return {...s,page:s.result?"result":"sheet",error:""};
   try{
    const names={obs:s.cells[0],expt:s.cells[1]},obs=names[s.fields.observed],exp=names[s.fields.expected];
    if(!obs||!exp)throw Error("Use the named lists obs and expt in the correct order.");
    if(obs.some(v=>!rawObs.test(v))||exp.some(v=>!rawExp.test(v)))throw Error("Complete both lists in category order before running the test.");
    if(!/^\d$/.test(s.fields.df))throw Error("Enter the degrees of freedom.");
    return {...s,page:"result",row:0,col:1,result:{...calculate(obs.map(Number),exp.map(Number),Number(s.fields.df)),selection:[s.fields.observed,s.fields.expected]},error:""};
   }catch(e){return {...s,error:e.message};}
  }
  if(["observed","expected","df"].includes(k)&&(key==="del"||k==="df"&&/^\d$/.test(key)||k!=="df"&&/^[a-z]$/.test(key))){
   return {...s,fields:{...s.fields,[k]:key==="del"?v.slice(0,-1):v.length<7?v+key:v},error:""};
  }
  return s;
 }
 if(!["sheet","result"].includes(s.page))return s;
 const {col,row}=s,n=s.cells[0].length;
 if(["left","right","tab"].includes(key))return chooseCell(s,Math.max(0,Math.min(1,col+(key==="left"?-1:1))),row);
 if(["up","down"].includes(key))return chooseCell(s,col,Math.max(0,Math.min(n-1,row+(key==="up"?-1:1))));
 if(select){
  if(s.draft===null)return chooseCell(s,col,Math.min(n-1,row+1));
  if(s.draft!==""&&!(col===0?rawObs:rawExp).test(s.draft))return {...s,error:"Enter a valid count before moving on."};
  const cells=s.cells.map((arr,j)=>j===col?arr.map((v,i)=>i===row?s.draft:v):arr);
  return {...s,page:"sheet",cells,row:Math.min(n-1,row+1),draft:null,error:"",result:null};
 }
 if(key==="del"&&s.draft===null)return {...s,draft:"",error:""};
 if(/^\d$/.test(key)||key==="dot"||key==="del"){
  const v=s.draft??"";
  return {...s,draft:key==="dot"?(col===1&&!v.includes(".")?v+".":v):key==="del"?v.slice(0,-1):v.length<9?v+key:v,error:""};
 }
 return s;
}
const duration=45;
const cues=[
 [0,"Start with a claimed distribution","One categorical variable, three outcomes. The claimed proportions are 0.20, 0.30 and 0.50. The observed counts total 80. The observed list is already entered."],
 [6,"Enter expected counts","Multiply 80 by each claimed proportion: 16, 24 and 40. Enter them into expt in the same category order. All are greater than 5."],
 [17,"Open χ² GOF","On Lists & Spreadsheet: Menu → 4 Statistics → 4 Stat Tests → 7 χ² GOF. This is not the two-way test of independence."],
 [22,"Assign the two lists","Enter obs as Observed List and expt as Expected List. Three categories and no fitted parameters give df = 2. Leave c[] and Draw off; tab to OK."],
 [36,"Read the upper-tail probability","Read χ² and PVal. The p-value is the upper-tail probability under the claimed distribution, not the probability that the claim is true."],
 [40.5,"Decide in context","PVal is about 0.00358, below 0.05. Reject the claimed category proportions; the sample gives evidence the distribution does not fit."]
];
function seq(at,ks,gap){return ks.map((k,j)=>[Number((at+j*gap).toFixed(3)),k]);}
const tape=[
 ...seq(7.2,["1","6","enter","2","4","enter","4","0","enter"],.8),
 ...seq(17.8,["menu","4","4","7"],.91),
 ...seq(22.6,["o","b","s","tab","e","x","p","t","tab","2","tab","tab","tab","enter"],.90)
];
function watchAt(time){
 const t=Math.max(0,Math.min(duration,Number(time)||0));let state=start(worked),keys=[];
 for(const [at,key] of tape){if(t<at)break;state=press(state,key);keys=t<at+.39?[key]:[];}
 return {state,keys,chapter:cues.findLastIndex(([at])=>at<=t)};
}
const api={worked,practice,menu,paths,fields,labels,start,press,request,list,setup,calculate,matches,chooseCell,cues,tape,watchAt,duration};
if(typeof module==="object"&&module.exports)module.exports=api;else g.CT48=api;
})(globalThis);
