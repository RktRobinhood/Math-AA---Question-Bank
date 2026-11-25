(function(g){"use strict";
const worked={matrix:[[0,-1],[1,0]],point:[4,-1]},practice={matrix:[[1,-2],[0,1]],point:[2,-3]};
const menus=[
 [[1,"Actions"],[2,"Number"],[3,"Algebra"],[4,"Calculus"],[5,"Probability"],[6,"Statistics"],[7,"Matrix & Vector"],[8,"Finance"],[9,"Functions & Programs"]],
 [[1,"Create"],[2,"Transpose"],[3,"Determinant"],[4,"Row-Echelon Form"],[5,"Reduced Row-Echelon Form"],[6,"Simultaneous"]],
 [[1,"Matrix"]]
];
const digits=/^\d$/,integer=/^[+−-]?\d{1,3}$/;
function val(s){const t=String(s).trim();if(!integer.test(t))throw Error("Use integers from −999 to 999.");return Number(t.replace("−","-"))||0;}
function parse(matrix,point){
 if(typeof matrix!=="string"||typeof point!=="string"||matrix.length>64||point.length>34)throw Error("Give both operands.");
 const A=matrix.split(";").map(row=>row.split(","));
 const P=point.split(",");
 if(A.length!==2||A.some(row=>row.length!==2)||P.length!==2)throw Error("Give a 2×2 matrix and two coordinates.");
 return {matrix:A.map(row=>row.map(val)),point:P.map(val)};
}
function request(params){
 if(!params.has("matrix")&&!params.has("point"))return {target:practice,linked:false,error:""};
 try{
  if(params.getAll("matrix").length!==1||params.getAll("point").length!==1)throw Error();
  return {target:parse(params.get("matrix"),params.get("point")),linked:true,error:""};
 }catch{return {target:practice,linked:true,error:"Link not recognised. Use matrix=a,b;c,d and point=x,y. The practice example is shown instead."};}
}
function multiply(left,right){
 if(left[0].length!==right.length)throw Error("Dimension mismatch. The columns on the left must match the rows on the right.");
 return left.map(row=>right[0].map((_,c)=>row.reduce((sum,v,i)=>sum+v*right[i][c],0)));
}
function image(A,P){return multiply(A,P.map(x=>[x])).map(row=>row[0]);}
function same(a,b){return JSON.stringify(a)===JSON.stringify(b);}
function start(){return {page:"calc",input:"",vars:{},history:[],ctrl:false,error:"",field:0,menu:0,cells:null,dim:null,cell:0};}
function toCalc(s,fields={}){return {...s,page:"calc",ctrl:false,error:"",...fields};}
function clear(s){return toCalc(s,{input:"",cells:null,dim:null});}
function fail(s,error){return {...s,error};}
function history(s,entry){return {...clear(s),history:[...s.history,entry].slice(-3)};}
function commitCells(s){
 try{
  const C=Number(s.dim[1]);
  const A=Array.from({length:Number(s.dim[0])},(_,i)=>s.cells.slice(i*C,(i+1)*C).map(val));
  const id=/^([tp]):=$/.exec(s.input)?.[1];
  return id?history({...s,vars:{...s.vars,[id]:A}},{kind:"store",name:id+" :=",result:A}):history(s,{kind:"matrix",name:"",result:A});
 }catch{return fail(s,"Fill every cell with an integer from −999 to 999.");}
}
function command(s){
 if(!s.input)return s;
 if(/^[tp]$/.test(s.input)){
  return s.vars[s.input]?history(s,{kind:"matrix",name:s.input,result:s.vars[s.input]}):fail(s,"Store "+s.input+" first.");
 }
 if(!/^[tp]×[tp]$/.test(s.input))return fail(s,"Use t and p for the matrices, then type t × p.");
 const [left,right]=s.input.split("×"),A=s.vars[left],B=s.vars[right];
 if(!A||!B)return fail(s,"Store both matrices before multiplying.");
 try{return history(s,{kind:"product",name:s.input,result:multiply(A,B),left:A,right:B});}
 catch(e){return fail(s,e.message);}
}
function isImage(entry){return entry?.kind==="product"&&entry.name==="t×p"&&entry.left.length===2&&entry.left[0].length===2&&entry.right.length===2&&entry.right[0].length===1;}
function goMenu(s,id){
 if(s.menu===0&&id===7)return {...s,menu:1,field:0};
 if(s.menu===1&&id===1)return {...s,menu:2,field:0};
 if(s.menu===2&&id===1)return {...s,page:"dims",dim:["2","2"],field:0};
 return fail(s,"This rehearsal uses Matrix & Vector → Create → Matrix.");
}
function createCells(s){
 if(!["1,2","2,1","2,2"].includes(s.dim.join(",")))return fail(s,"Use 2×2 or 2×1 in this lesson. A 1×2 row is also supported to compare.");
 return {...s,page:"cells",cells:Array(Number(s.dim[0])*Number(s.dim[1])).fill(""),cell:0};
}
function press(s,key){
 const select=key==="enter"||key==="select";
 if(key==="ctrl")return {...s,ctrl:!s.ctrl};
 if(s.ctrl){
  s={...s,ctrl:false};
  if(key==="templates"&&s.page==="calc"&&/^[tp]$/.test(s.input))return {...s,input:s.input+":=",error:""};
  if(key==="del"&&s.page==="calc")return clear(s);
 }
 if(key==="esc"){
  if(s.page==="menu"&&s.menu>0)return {...s,menu:s.menu-1,field:s.menu===1?6:0,error:""};
  if(s.page!=="calc")return toCalc(s,{cells:null,dim:null});
  return clear(s);
 }
 s={...s,error:""};
 if(key==="menu"&&["calc","menu"].includes(s.page))return {...s,page:"menu",menu:0,field:0};
 if(s.page==="menu"){
  const items=menus[s.menu];
  if(key==="up"||key==="down")return {...s,field:(s.field+(key==="down"?1:items.length-1))%items.length};
  if(key==="left"&&s.menu)return {...s,menu:s.menu-1,field:s.menu===1?6:0};
  return select||key==="right"?goMenu(s,items[s.field][0]):digits.test(key)?goMenu(s,Number(key)):s;
 }
 if(s.page==="dims"){
  if(key==="tab"||key==="down")return {...s,field:(s.field+1)%4};
  if(key==="backtab"||key==="up")return {...s,field:(s.field+3)%4};
  if(select)return s.field===3?toCalc(s,{dim:null}):createCells(s);
  if(s.field<2&&(digits.test(key)||key==="del")){
   const dim=s.dim.slice();dim[s.field]=key==="del"?"":key;return {...s,dim};
  }
  return s;
 }
 if(s.page==="cells"){
  const C=Number(s.dim[1]),N=s.cells.length,idx=s.cell;
  if(key==="tab"||key==="right")return {...s,cell:Math.min(N,idx+1)};
  if(key==="left"||key==="backtab")return {...s,cell:Math.max(0,idx-1)};
  if(key==="up")return {...s,cell:Math.max(0,idx-C)};
  if(key==="down")return {...s,cell:Math.min(N-1,idx+C)};
  if(select)return commitCells(s);
  if(idx<N&&(digits.test(key)||key==="neg"||key==="minus"||key==="del")){
   const cells=s.cells.slice(),v=cells[idx];
   cells[idx]=key==="del"?v.slice(0,-1):key==="neg"||key==="minus"?v.startsWith("-")?v.slice(1):"-"+v:v.replace("-","").length<3?v+key:v;
   return {...s,cells};
  }
  return s;
 }
 if(select)return command(s);
 if(key==="del")return {...s,input:s.input.endsWith(":=")?s.input.slice(0,-2):s.input.slice(0,-1)};
 if(key==="assign"&&/^[tp]$/.test(s.input))return {...s,input:s.input+":="};
 const char={t:"t",p:"p",mul:"×"}[key];
 return char&&s.input.length<7?{...s,input:s.input+char}:s;
}
const cues=[
 [0,"Name the transformation","Rotate P = (4, −1) 90° anticlockwise about the origin. On a Calculator page, type t, then Ctrl + template (:=)."],
 [4.8,"Enter the 2×2 matrix","Choose Menu → 7: Matrix & Vector → 1: Create → 1: Matrix. Set 2 rows and 2 columns."],
 [12.2,"Fill the first matrix","Enter the rows (0, −1) and (1, 0), left to right. Tab between cells; Enter stores t."],
 [20.8,"Make a point column","Name p with := and use the same menu. Choose 2 rows and 1 column, not 1 row and 2 columns."],
 [30.4,"Store the point","Enter x = 4 above y = −1. Press Enter to store p."],
 [35.6,"Multiply matrix × column","Type t × p, in that order, then Enter. The inner dimensions 2 and 2 match."],
 [41.2,"Read the image","The upper entry is x′; the lower is y′. Write P′ = (1, 4). Here the rotation sends (x, y) to (−y, x)."]
];
const duration=47;
const tape=[
 [1.75,"t"],[2.6,"ctrl"],[3.12,"templates"],
 [5.05,"menu"],[5.82,"7"],[6.52,"1"],[7.33,"1"],
 [8.35,"2"],[9.02,"tab"],[9.57,"2"],[10.25,"tab"],[11.2,"enter"],
 [12.68,"0"],[13.47,"tab"],[14.18,"neg"],[14.73,"1"],[15.43,"tab"],[16.19,"1"],[16.9,"tab"],[17.64,"0"],[19.17,"enter"],
 [21.15,"p"],[21.74,"ctrl"],[22.27,"templates"],
 [23.12,"menu"],[23.83,"7"],[24.43,"1"],[25.1,"1"],[26.07,"2"],[26.72,"tab"],[27.32,"1"],[28.03,"tab"],[29.01,"enter"],
 [30.84,"4"],[31.58,"tab"],[32.32,"neg"],[32.87,"1"],[34.12,"enter"],
 [36.38,"t"],[37.2,"mul"],[38.04,"p"],[40.36,"enter"]
];
function watchAt(time){
 const t=Math.max(0,Math.min(duration,Number(time)||0));
 let state=start(),keys=[];
 for(const [at,key] of tape){
  if(t<at)break;
  state=press(state,key);
  keys=t<at+.38?(key==="templates"?["ctrl",key]:[key]):[];
 }
 return {state,keys,chapter:cues.findLastIndex(([at])=>at<=t)};
}
const api={worked,practice,menus,parse,request,start,press,multiply,image,isImage,same,cues,duration,tape,watchAt};
if(typeof module==="object"&&module.exports)module.exports=api;else g.CT22=api;
})(globalThis);
