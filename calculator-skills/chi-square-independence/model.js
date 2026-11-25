(function(g){"use strict";
const worked=[[30,10],[32,8],[18,22]], practice=[[26,14],[30,10],[28,12]];
const baseAlpha=.05;
const menus={
 menu:[[4,"Calculus"],[5,"Probability"],[6,"Statistics"],[7,"Matrix & Vector"],[8,"Finance"]],
 matrix:[[1,"Create"],[2,"Transpose"],[3,"Determinant"]],
 create:[[1,"Matrix"]],
 stats:[[3,"List Math"],[4,"List Operations"],[5,"Distributions"],[6,"Confidence Intervals"],[7,"Stat Tests"]],
 tests:[[5,"1-Prop z Test"],[6,"2-Prop z Test"],[7,"χ² GOF"],[8,"χ² 2-way Test"],[9,"2-Sample F Test"]]
};
const pageNames={menu:"Calculator menu",matrix:"Matrix & Vector",create:"Create",stats:"Statistics",tests:"Stat Tests"};
const targets={menu:[6,7],matrix:[1],create:[1],stats:[7],tests:[8]};
const cues=[
 [0,"Identify two categorical variables","A random sample records each student once: how they commute and whether they arrive on time. Test for association."],
 [4.6,"State the hypotheses","H₀: commute mode and arrival status are independent. H₁: they are associated. Choose a 5% significance level before testing."],
 [9.1,"Create a named matrix","Type a, then Ctrl + template (:=). Use Menu → Matrix & Vector → Create → Matrix. Choose 3 rows and 2 columns."],
 [19.9,"Enter observed counts, not totals","Enter the Walk, Cycle and Bus counts, row by row. Use Tab between cells and Enter to store a. Leave out totals and percentages."],
 [30.5,"Run the two-way test","Menu → Statistics → Stat Tests → χ² 2-way Test. Enter a as the Observed Matrix and confirm."],
 [38.6,"Read the output","Read χ², PVal and df. PVal is the upper-tail probability under H₀, not the probability that H₀ is true."],
 [44,"Check the expected counts","On the next input line, enter stat.expmat. Expected counts are the counts predicted under independence; here all are greater than 5."],
 [51.2,"Decide in context","PVal ≈ 0.00158 is below 0.05. Reject H₀: this sample gives evidence of association between commute mode and arrival status, not causation."]
];
const duration=56.5;
const tape=[
 [9.45,"a"],[10.05,"ctrl"],[10.6,"templates"],[11.5,"menu"],[12.25,"7"],[13.02,"1"],[13.82,"1"],
 [14.7,"3"],[15.47,"tab"],[16.22,"2"],[17.22,"tab"],[18.48,"enter"],
 [20.25,"3"],[20.68,"0"],[21.16,"tab"],[21.64,"1"],[22.05,"0"],[22.55,"tab"],
 [23.02,"3"],[23.45,"2"],[23.93,"tab"],[24.43,"8"],[24.92,"tab"],
 [25.43,"1"],[25.87,"8"],[26.4,"tab"],[26.9,"2"],[27.33,"2"],[28.78,"enter"],
 [31.0,"menu"],[31.82,"6"],[32.64,"7"],[33.53,"8"],[34.72,"a"],[35.55,"tab"],[36.74,"enter"],
 [44.15,"s"],[44.62,"t"],[45.08,"a"],[45.53,"t"],[45.99,"dot"],[46.45,"e"],[46.91,"x"],[47.38,"p"],[47.84,"m"],[48.3,"a"],[48.78,"t"],[50,"enter"]
];
const validEntry=x=>/^\d{1,3}$/.test(String(x)), digits=/^\d$/;
function validate(v){
 if(!Array.isArray(v)||!([2,3].includes(v.length))||!v.every(r=>Array.isArray(r)&&r.length===v[0].length&&r.every(validEntry))||
 ![2,3].includes(v[0].length)||v.length===2&&v[0].length===2)throw Error("Use a 2×3, 3×2, or 3×3 table of whole counts from 0 to 999.");
 return v.map(r=>r.map(Number));
}
function request(params){
 const linked=params.has("counts")||params.has("alpha");
 try{
  if(params.getAll("counts").length>1||params.getAll("alpha").length>1)throw Error("Supply just one counts and one alpha value.");
  const raw=params.get("counts");
  if(raw&&raw.length>50)throw Error("Table link is too long.");
  const counts=raw===null?validate(practice):validate(raw.split(";").map(r=>r.split(",")));
  const alpha=params.get("alpha")??"0.05";
  if(![".01","0.01",".05","0.05",".1","0.1",".10","0.10"].includes(alpha))throw Error("Use alpha=0.01, 0.05, or 0.10.");
  return {counts,alpha:Number(alpha),linked,error:"",generic:raw!==null&&JSON.stringify(counts)!==JSON.stringify(practice)};
 }catch(e){return {counts:validate(practice),alpha:baseAlpha,linked,generic:false,error:e.message+" Standard practice table loaded."};}
}
function calculate(tab){
 const observed=validate(tab), nr=observed.length,nc=observed[0].length;
 const sum=a=>a.reduce((x,y)=>x+y,0), row=observed.map(sum), col=observed[0].map((v,j)=>sum(observed.map(r=>r[j]))),n=sum(row);
 if(row.some(v=>v===0)||col.some(v=>v===0))throw Error("A row or column total is zero. Check the categories before using the test.");
 const expected=row.map(r=>col.map(c=>r*c/n)), contribution=observed.map((r,i)=>r.map((v,j)=>(v-expected[i][j])**2/expected[i][j]));
 const stat=sum(contribution.flat()),df=(nr-1)*(nc-1), x=stat/2, logP=-x+(df===4?Math.log1p(x):0);
 return {observed,expected,contribution,stat,df,logP,p:Math.exp(logP),small:expected.flat().some(e=>e<=5)};
}
function pText(r,n=6){
 if(r.p>=1e-4)return String(Number(r.p.toPrecision(n)));
 const pow=Math.floor(r.logP/Math.LN10), mant=Number(Math.exp(r.logP-pow*Math.LN10).toPrecision(n));
 return (mant===10?"1":String(mant))+"E"+String(mant===10?pow+1:pow);
}
function start(){return {page:"calc",menuIndex:0,prev:"calc",ctrl:false,assign:false,stored:null,dim:null,field:0,cells:null,cell:0,editing:false,name:"",command:"",result:null,last:"",error:""};}
function prefill(counts){
 const t=validate(counts);return {...start(),page:"cells",assign:true,dim:[String(t.length),String(t[0].length)],cells:t.flat().map(String)};
}
function go(s,page,more={}){return {...s,page,ctrl:false,error:"",...more};}
function chooseCell(s,i){return {...s,cell:i,editing:false,error:""};}
function chooseField(s,i){return {...s,field:i,error:""};}
function goMenu(s,number){
 if(s.page==="menu"&&number===7)return go(s,"matrix",{menuIndex:0});
 if(s.page==="matrix"&&number===1)return go(s,"create",{menuIndex:0});
 if(s.page==="create"&&number===1)return go(s,"dims",{dim:["2","2"],field:0});
 if(s.page==="menu"&&number===6)return go(s,"stats",{menuIndex:0});
 if(s.page==="stats"&&number===7)return go(s,"tests",{menuIndex:0});
 if(s.page==="tests"&&number===8)return go(s,"wizard",{field:0,name:""});
 return {...s,error:"Choose a menu option used in this lesson."};
}
function confirm(s){
 const fail=error=>({...s,error});
 if(s.page==="dims"){
  if(s.field===3)return go(s,"calc");
  if(s.dim.some(v=>!["2","3"].includes(v))||s.dim.every(v=>v==="2"))return fail("Choose 2×3, 3×2, or 3×3 for this IB-style lesson.");
  return go(s,"cells",{cells:Array(Number(s.dim[0])*Number(s.dim[1])).fill(""),cell:0,editing:false});
 }
 if(s.page==="cells"){
  if(!s.assign)return fail("Name the matrix a with a := before opening the matrix template.");
  try{
   const size=Number(s.dim[1]),stored=validate(Array.from({length:Number(s.dim[0])},(_,i)=>s.cells.slice(i*size,(i+1)*size)));
   return go(s,"calc",{stored,assign:false,result:null,command:"",last:"store"});
  }catch(e){return fail("Enter one whole count from 0 to 999 in every cell.");}
 }
 if(s.page==="wizard"){
  if(s.field===2)return go(s,s.prev);
  if(!s.stored||s.name!=="a")return fail("Enter the name a of the stored observed matrix.");
  try{return go(s,"result",{result:calculate(s.stored),assign:false,command:"",last:"result"});}
  catch(e){return fail(e.message);}
 }
 if(["calc","result","expected"].includes(s.page)&&s.command){
  if(s.result&&["stat.expmat","stat.expmatrix"].includes(s.command))return go(s,"expected",{command:"",last:"expected"});
  return fail("Use stat.expmat to view expected counts after running the test.");
 }
 return s;
}
function press(s,key){
 const select=key==="enter"||key==="select";
 if(key==="ctrl")return {...s,ctrl:!s.ctrl};
 if(s.ctrl){
  s={...s,ctrl:false};
  if(key==="templates"&&s.page==="calc"&&s.command==="a")return {...s,assign:true,command:"",error:""};
 }
 if(key==="assign"&&s.page==="calc"&&s.command==="a")return {...s,assign:true,command:"",error:""};
 if(key==="esc"&&s.error)return {...s,error:""};
 if(key==="esc"){
  if(["cells","dims"].includes(s.page))return go(s,"calc",{assign:false,dim:null,cells:null,command:"",editing:false});
  const prev={matrix:"menu",stats:"menu",tests:"stats",create:"matrix",menu:s.prev,wizard:s.prev};
  return go(s,prev[s.page]||"calc",{command:"",menuIndex:0});
 }
 if(key==="menu"&&!["dims","cells","wizard"].includes(s.page))return go(s,"menu",{prev:["calc","result","expected"].includes(s.page)?s.page:s.prev,menuIndex:0});
 if(menus[s.page]){
  const m=menus[s.page],parent={matrix:"menu",create:"matrix",stats:"menu",tests:"stats"};
  if(key==="left"&&parent[s.page])return go(s,parent[s.page],{menuIndex:0});
  if(key==="up"||key==="down")return {...s,menuIndex:(s.menuIndex+(key==="down"?1:m.length-1))%m.length,error:""};
  if(select||key==="right")return goMenu(s,m[s.menuIndex][0]);
  if(digits.test(key))return goMenu(s,Number(key));
  return s;
 }
 if(s.page==="dims"||s.page==="wizard"){
  const max=s.page==="dims"?4:3;
  if(["tab","down","up","backtab"].includes(key))return chooseField(s,(s.field+(key==="tab"||key==="down"?1:max-1))%max);
  if(select)return confirm(s);
  if(s.page==="dims"&&s.field<2&&(digits.test(key)||key==="del")){
   const dim=s.dim.slice();dim[s.field]=key==="del"?"":key;return {...s,dim,error:""};
  }
  if(s.page==="wizard"&&s.field===0){
   if(key==="a")return {...s,name:"a",error:""};
   if(key==="del")return {...s,name:"",error:""};
  }
  return s;
 }
 if(s.page==="cells"){
  const n=s.cells.length,i=s.cell,C=Number(s.dim[1]),off={tab:1,right:1,left:-1,backtab:-1,up:-C,down:C};
  if(Object.hasOwn(off,key))return chooseCell(s,Math.min(n-1,Math.max(0,i+off[key])));
  if(select)return confirm(s);
  if(digits.test(key)||key==="del"){
   const cells=s.cells.slice(),val=cells[i];
   cells[i]=key==="del"?val.slice(0,-1):(!s.editing?"":val).length<3?(!s.editing?"":val)+key:val;
   return {...s,cells,editing:true,error:""};
  }
  return s;
 }
 if(select)return confirm(s);
 if(key==="del")return {...s,command:s.command.slice(0,-1),error:""};
 if(/[astxepm]/.test(key)&&key.length===1||key==="dot")return {...s,command:(s.command+(key==="dot"?".":key)).slice(0,18),error:""};
 return s;
}
function watchAt(t){
 let state=start(),keys=[];
 for(const [time,key] of tape){
  if(t<time)break;
  state=press(state,key);keys=t<time+.275?(key==="templates"?["ctrl",key]:[key]):[];
 }
 return {state,keys,chapter:cues.findLastIndex(x=>x[0]<=t)};
}
const api={worked,practice,baseAlpha,menus,pageNames,targets,cues,duration,tape,start,prefill,press,chooseCell,chooseField,request,calculate,pText,watchAt};
if(typeof module==="object"&&module.exports)module.exports=api;else g.CT47=api;
})(globalThis);
