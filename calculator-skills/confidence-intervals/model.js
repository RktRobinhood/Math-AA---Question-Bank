(function(g){"use strict";
const workedZ={method:"z",mean:"40",sd:"6",n:"36",level:"0.95"},workedT={method:"t",mean:"40",sd:"6",n:"36",level:"0.95"};
const practice={method:"t",mean:"32",sd:"4",n:"16",level:"0.90"};
const menu={
 menu:[[3,"Algebra"],[4,"Calculus"],[5,"Probability"],[6,"Statistics"],[7,"Matrix & Vector"]],
 stats:[[3,"List Math"],[4,"List Operations"],[5,"Distributions"],[6,"Confidence Intervals"],[7,"Stat Tests"]],
 intervals:[[1,"z Interval"],[2,"t Interval"],[3,"2-Sample z Interval"],[4,"2-Sample t Interval"],[5,"1-Prop z Interval"]]
};
const paths={menu:"Calculator menu",stats:"Statistics",intervals:"Confidence Intervals"};
const keys=["method","mean","sd","n","level"],fields=kind=>kind==="z"?["sd","mean","n","level"]:["mean","sd","n","level"];
const labelFields=kind=>({sd:kind==="z"?"σ":"sx",mean:"x̄",n:"n",level:"C Level"});
const title=kind=>kind+" Interval";
function num(v,name){
 const raw=String(v).trim().replaceAll("−","-");
 if(!/^[+-]?(?:\d{1,3}(?:\.\d{1,3})?|\.\d{1,3})$/.test(raw)||Math.abs(Number(raw))>999)throw Error("Check "+name+": use a number from −999 to 999, up to three decimals.");
 return Number(raw)||0;
}
function parse(task){
 const method=task.method;if(!["z","t"].includes(method))throw Error("Select a z or t interval.");
 const mean=num(task.mean,"the sample mean"),sd=num(task.sd,"the standard deviation"),n=num(task.n,"the sample size"),level=num(task.level,"C Level");
 if(sd<=0)throw Error("Use a positive standard deviation.");
 if(!Number.isInteger(n)||n<2||n>999)throw Error("Use a whole-number sample size from 2 to 999.");
 if(level<.5||level>.999)throw Error("C Level is a proportion from 0.5 to 0.999, not a percentage.");
 return {method,mean,sd,n,level};
}
function request(params){
 if(!keys.some(k=>params.has(k)))return {target:practice,linked:false,error:""};
 try{
  if(keys.some(k=>params.getAll(k).length!==1))throw Error();
  const target=Object.fromEntries(keys.map(k=>[k,params.get(k)]));parse(target);
  return {target,linked:true,error:""};
 }catch{return {target:practice,linked:true,error:"Invalid confidence-interval link. The unsolved practice example is shown instead."};}
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

// The supported z quantiles have z/sqrt(2)<2.33. The convergent erf series is accurate on this bounded interval.
function erf(z){
 let term=z,sum=z;
 for(let k=1;k<=80;k++){term*=-z*z/k;const t=term/(2*k+1);sum+=t;if(Math.abs(t)<1e-18)break;}
 return 2/Math.sqrt(Math.PI)*sum;
}
function tail(x,df){
 if(df===null)return (1-erf(x/Math.SQRT2))/2;
 return ibeta(df/2,.5,df/(df+x*x))/2;
}
function critical(level,df){
 const p=(1-level)/2;let a=0,b=df===null?3.5:1;
 while(df!==null&&tail(b,df)>p&&b<32768)b*=2;
 for(let k=0;k<75;k++){const m=(a+b)/2;if(tail(m,df)>p)a=m;else b=m;}
 return(a+b)/2;
}
function calculate(raw){
 const task=parse(raw),df=task.method==="t"?task.n-1:null,z=critical(task.level,df),se=task.sd/Math.sqrt(task.n),me=z*se;
 return {task,df,z,se,me,low:task.mean-me,high:task.mean+me};
}
function matches(r,task){return !!r&&JSON.stringify(r.task)===JSON.stringify(parse(task));}
function start(){return {page:"calc",kind:"z",index:0,method:"Data",field:0,values:{},list:false,error:"",result:null,earlier:null};}
function choose(s,method){return {...s,method,field:0,list:false,error:""};}
function openForm(s){
 if(s.method!=="Stats")return {...s,error:"This rehearsal uses summary statistics. Choose Stats first."};
 return {...s,page:"form",field:0,list:false,error:"",values:{mean:"",sd:"",n:"",level:""}};
}
function press(s,key){
 const select=["enter","select"].includes(key);
 if(key==="menu")return {...s,page:"menu",index:0,list:false,error:""};
 if(key==="esc"){
  if(s.list)return {...s,list:false,error:""};
  if(s.page==="intervals")return {...s,page:"stats",index:3,error:""};
  if(s.page==="stats")return {...s,page:"menu",index:3,error:""};
  return {...s,page:"calc",field:0,error:""};
 }
 if(menu[s.page]){
  const rows=menu[s.page];
  if(["up","down"].includes(key))return {...s,index:(s.index+(key==="down"?1:rows.length-1))%rows.length,error:""};
  if(key==="left"&&s.page!=="menu")return press(s,"esc");
  const id=key==="right"||select?rows[s.index][0]:Number(key);
  if(s.page==="menu"&&id===6)return {...s,page:"stats",index:0,error:""};
  if(s.page==="stats"&&id===6)return {...s,page:"intervals",index:0,error:""};
  if(s.page==="intervals"&&[1,2].includes(id))return {...s,page:"method",kind:id===1?"z":"t",index:0,method:"Data",field:0,error:""};
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
 const fs=fields(s.kind),k=fs[s.field];
 if(key==="tab"||key==="down")return {...s,field:(s.field+1)%(fs.length+2),error:""};
 if(key==="backtab"||key==="up")return {...s,field:(s.field+fs.length+1)%(fs.length+2),error:""};
 if(select){
  if(s.field===fs.length+1)return {...s,page:"calc",error:""};
  try{return {...s,page:"result",earlier:s.result,result:calculate({method:s.kind,...s.values}),error:""};}
  catch(e){return {...s,error:e.message};}
 }
 if(k){
  const v=s.values[k],digit=/^\d$/;
  if(key==="del"||key==="neg"||key==="minus"||key==="dot"||digit.test(key)){
   const input=key==="del"?v.slice(0,-1):key==="neg"||key==="minus"?v[0]==="-"?v.slice(1):"-"+v:key==="dot"?v.includes(".")?v:v+".":v.length<8?v+key:v;
   return {...s,values:{...s.values,[k]:input},error:""};
  }
 }
 return s;
}
const duration=52;
const cues=[
 [0,"Know which standard deviation you have","Estimate the mean of a normal population. The sample mean is 40 and n = 36. First suppose the population standard deviation σ = 6 is known."],
 [5.15,"Choose z Interval and Stats","On a Calculator page, choose Menu → Statistics → Confidence Intervals → z Interval. Select Stats rather than Data."],
 [12.2,"Enter the known population SD","Enter σ = 6, x̄ = 40, n = 36, and C Level = 0.95. Enter a proportion, not 95."],
 [22.3,"Read both ends","Read CLower and CUpper: about 38.04 and 41.96. ME is the half-width, not an endpoint."],
 [27.0,"Switch to t when σ is unknown","Now suppose 6 is only the sample SD, sx. Use t Interval with Stats. The distinction is whether σ is known, not whether n exceeds 30."],
 [35,"Enter the sample SD","For t, enter x̄ first and sx second. Keep n = 36 and C Level = 0.95."],
 [47.1,"Interpret the interval","About 37.97 to 42.03 for the population mean. Over many repeated samples, this method would capture the true mean about 95% of the time."]
];
function seq(at,ks,gap){return ks.map((k,j)=>[Number((at+j*gap).toFixed(3)),k]);}
const tape=[
 ...seq(5.45,["menu","6","6","1","right","down","enter","tab","enter"],.71),
 ...seq(12.45,["6","tab","4","0","tab","3","6","tab","0","dot","9","5","tab","enter"],.64),
 ...seq(27.35,["menu","6","6","2","right","down","enter","tab","enter"],.71),
 ...seq(35.28,["4","0","tab","6","tab","3","6","tab","0","dot","9","5","tab","enter"],.72)
];
function watchAt(time){
 const t=Math.max(0,Math.min(duration,Number(time)||0));let state=start(),keys=[];
 for(const [at,key] of tape){if(t<at)break;state=press(state,key);keys=t<at+.39?[key]:[];}
 return {state,keys,chapter:cues.findLastIndex(([at])=>at<=t)};
}
const api={workedZ,workedT,practice,menu,paths,labelFields,title,fields,start,press,choose,parse,request,calculate,critical,matches,cues,tape,watchAt,duration};
if(typeof module==="object"&&module.exports)module.exports=api;else g.CT49=api;
})(globalThis);
