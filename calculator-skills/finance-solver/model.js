(function(g){"use strict";
const worked=Object.freeze({deposit:1000,rate:6,years:2,frequency:12});
const practice=Object.freeze({deposit:1500,rate:4.8,years:3,frequency:4});
const fieldNames=["N","I(%)","PV","Pmt","FV","PpY","CpY","PmtAt"];
const defaults=["0.","0.","0.","0.","0.","1","1","END"];
const help=[
 "Number of payment periods","Nominal annual interest rate (%)","Present value (cash flow today)","Amount of each periodic payment",
 "Future value (cash flow at maturity)","Payment periods per year","Compounding periods per year","Payment timing: beginning or end"
];
const menu0=[[4,"Calculus"],[5,"Probability"],[6,"Statistics"],[7,"Matrix & Vector"],[8,"Finance"]];
const menu1=[[1,"Finance Solver"]];
const cues=[
 [0,"Choose a cash-flow direction","Deposit 1,000 for 2 years at 6% nominal interest, compounded monthly. There are no later payments."],
 [4,"Open Finance Solver","On a Calculator page, press Menu → 8: Finance → 1: Finance Solver."],
 [8,"Enter periods and annual rate","Two years × 12 months gives N = 24. Enter 6 in I(%), the annual percentage rate."],
 [14,"Enter the two cash flows","PV = −1,000: the deposit leaves you now. Pmt = 0 because there are no recurring payments."],
 [22,"Set the monthly frequency","Skip FV. To count N in months, set both PpY and CpY to 12 here. Keep PmtAt at END; it has no effect when Pmt is zero."],
 [31,"Solve for future value","Move back to FV, then press Enter to solve for the highlighted field."],
 [36,"Read the positive balance","A positive FV is money you receive at the end. Rounded to two decimal places, the balance is 1,127.16."]
];
const duration=40.5;
const tape=[
 [4.57,"menu"],[5.6,"8"],[6.65,"1"],[8.45,"2"],[9.19,"4"],[10.25,"tab"],[11.48,"6"],[12.85,"tab"],
 [14.43,"neg"],[15.16,"1"],[15.8,"0"],[16.46,"0"],[17.1,"0"],[18.43,"tab"],[19.82,"0"],[20.95,"tab"],
 [22.42,"tab"],[23.54,"1"],[24.16,"2"],[25.06,"tab"],[26.3,"1"],[26.96,"2"],[28.15,"tab"],
 [31.34,"tab"],[31.88,"tab"],[32.42,"tab"],[32.96,"tab"],[33.5,"tab"],[34.6,"enter"]
];
function nval(raw){
 if(!/^[+-]?(?:\d{1,6}(?:\.\d{0,6})?|\.\d{1,6})$/.test(String(raw)))return NaN;
 return Number(raw);
}
function inRange(x,lo,hi){return Number.isFinite(x)&&x>=lo&&x<=hi;}
function validate(d){
 if(!inRange(d.deposit,.01,100000)||!inRange(d.rate,0,30)||!inRange(d.years,.01,50)||!Number.isInteger(d.frequency)||!inRange(d.frequency,1,365))throw Error("Use a positive deposit, a 0–30% nominal rate, up to 50 years, and 1–365 compounds per year.");
 const periods=d.years*d.frequency;
 if(periods<.99999999||Math.abs(periods-Math.round(periods))>1e-8)throw Error("The duration must make a whole number of compounding periods.");
 return { ...d,periods:Math.round(periods) };
}
function request(params){
 const keys=["deposit","rate","years","frequency"];
 const linked=keys.some(k=>params.has(k));
 if(!linked)return {target:validate(practice),linked:false,error:""};
 try{
  if(!keys.every(k=>params.has(k)&&params.getAll(k).length===1))throw Error("Supply deposit, rate, years and frequency together.");
  const target=validate(Object.fromEntries(keys.map(k=>[k,nval(params.get(k))])));
  return {target,linked:true,error:""};
 }catch(e){return {target:validate(practice),linked:true,error:e.message+" The standard practice is loaded."};}
}
function calc(input){
 const [N,I,PV,Pmt,,PpY,CpY]=input.slice(0,7).map(nval);
 if(!inRange(N,0,18250)||!inRange(I,0,30)||!inRange(PV,-100000,100000))throw Error("Check N, I(%) and PV. Use numerical entries within the deposit lesson’s range.");
 if(Pmt!==0)throw Error("This lesson has no recurring payments. Set Pmt to 0.");
 if(![PpY,CpY].every(x=>Number.isInteger(x)&&inRange(x,1,365)))throw Error("PpY and CpY must each be whole numbers from 1 to 365.");
 if(N/PpY>50+1e-8)throw Error("The modeled duration is at most 50 years. Check N and PpY.");
 const value=-PV*Math.exp((N/PpY)*CpY*Math.log1p(I/(100*CpY)))||0;
 return {N,I,PV,Pmt,PpY,CpY,value};
}
function start(){return {page:"calc",field:0,menuIndex:0,values:defaults.slice(),editing:false,result:null,error:""};}
function ready(s){return {...s,page:"solver",field:0,editing:false,error:""};}
function reopen(s,page){return {...s,page,editing:false,error:""};}
function chooseField(s,i){return {...s,field:i,editing:false,error:""};}
function choose(s,key){
 if(key==="esc")return reopen(s,s.page==="finance"?"menu":"calc");
 if(key==="menu")return {...reopen(s,"menu"),menuIndex:0};
 if(s.page==="menu"||s.page==="finance"){
  const menu=s.page==="menu"?menu0:menu1;
  if(key==="down"||key==="up")return {...s,menuIndex:(s.menuIndex+(key==="down"?1:menu.length-1))%menu.length};
  if(key==="left"&&s.page==="finance")return {...reopen(s,"menu"),menuIndex:4};
  const action=["right","enter","select"].includes(key)?String(menu[s.menuIndex]?.[0]):key;
  if(s.page==="menu"&&action==="8")return {...reopen(s,"finance"),menuIndex:0};
  if(s.page==="finance"&&action==="1")return ready(s);
  return s;
 }
 if(s.page!=="solver")return s;
 if(key==="tab"||key==="down")return chooseField(s,(s.field+1)%8);
 if(key==="backtab"||key==="up")return chooseField(s,(s.field+7)%8);
 if(key==="enter"||key==="select"){
  if(s.field!==4)return {...s,error:"Select FV, then press Enter. This lesson solves for the final balance.",editing:false};
  try{
   const result=calc(s.values);
   const values=s.values.slice();values[4]=String(result.value);
   return {...s,values,result,editing:false,error:""};
  }catch(e){return {...s,result:null,error:e.message,editing:false};}
 }
 if(s.field===7){
  if(["left","right","b","e"].includes(key)){
   const values=s.values.slice();values[7]=key==="b"?"BEGIN":key==="e"?"END":values[7]==="END"?"BEGIN":"END";
   return {...s,values,error:""};
  }
  return s;
 }
 if(!(/^\d$/.test(key)||["neg","minus","dot","del"].includes(key)))return s;
 const values=s.values.slice(),old=values[s.field],rest=s.editing?old:"";
 let value=rest;
 if(key==="del")value=old.slice(0,-1);
 else if(key==="neg"||key==="minus")value=rest.startsWith("-")?rest.slice(1):"-"+rest;
 else if(key==="dot"){if(!rest.includes("."))value=rest+".";}
 else if(rest.length<12)value=rest+key;
 values[s.field]=value;if(s.field!==4&&s.result!==null)values[4]="0.";
 return {...s,values,editing:true,result:null,error:""};
}
function match(result,target){
 if(!result)return false;
 return result.PV===-target.deposit&&result.I===target.rate&&result.CpY===target.frequency&&Math.abs(result.N/result.PpY-target.years)<1e-9;
}
function watchAt(t){
 let state=start(),key="";
 for(const [at,k] of tape){if(t<at)break;state=choose(state,k);key=t<at+.36?k:"";}
 return {state,keys:key?[key]:[],chapter:cues.findLastIndex(x=>x[0]<=t)};
}
const api={worked,practice,fieldNames,help,menu0,menu1,cues,duration,tape,request,validate,calc,match,start,choose,chooseField,watchAt};
if(typeof module==="object"&&module.exports)module.exports=api;else g.CT05=api;
})(globalThis);
