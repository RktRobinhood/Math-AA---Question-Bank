"use strict";
globalThis.WalkMatrix=(()=>{
const labels=["A","B","C"];
const menus=[
 [[1,"Actions"],[2,"Number"],[3,"Algebra"],[4,"Calculus"],[5,"Probability"],[6,"Statistics"],[7,"Matrix & Vector"],[8,"Finance"]],
 [[1,"Create"],[2,"Transpose"],[3,"Determinant"]],
 [[1,"Matrix"]]
];
function entries(source){
 const s=String(source);
 if(s.length>30)return null;
 const rows=s.split(";").map(r=>r.split(",").map(x=>x.trim()));
 return rows.length===3&&rows.every(r=>r.length===3&&r.every(x=>/^[0-3]$/.test(x)))?rows.map(r=>r.map(Number)):null;
}
function validate(d){
 if(!entries(d.matrix))return "Enter three rows of three whole counts (0–3). Use commas within rows and semicolons between rows.";
 if(!labels.includes(d.from)||!labels.includes(d.to))return "Choose a start and an end vertex.";
 if(!Number.isInteger(d.k)||d.k<2||d.k>6)return "Enter an exact walk length from 2 through 6.";
 return "";
}
function power(matrix,k){
 const a=typeof matrix==="string"?entries(matrix):matrix;
 if(!Array.isArray(a)||a.length!==3||a.some(row=>!Array.isArray(row)||row.length!==3||row.some(x=>!Number.isInteger(x)||x<0||x>3))||
    !Number.isInteger(k)||k<1||k>6)throw Error("Use a 3 by 3 adjacency matrix and an integer power from 1 to 6.");
 let b=Array.from({length:3},(_,i)=>Array.from({length:3},(_,j)=>Number(i===j)));
 for(let n=0;n<k;n++)b=b.map((row)=>row.map((_,j)=>row.reduce((sum,v,i)=>sum+v*a[i][j],0)));
 return b;
}
function start(data){return {page:"calc",raw:"",A:null,history:[],result:null,ctrl:false,error:"",field:0,menu:0,cells:null,dim:null,cell:0,data,fromWatch:false};}
const plain=(s,update={})=>({...s,page:"calc",ctrl:false,error:"",...update});
const out=(s,entry,extra={})=>plain(s,{raw:"",dim:null,cells:null,result:entry,history:[...s.history,entry].slice(-6),...extra});
const fail=(s,error)=>({...s,error});
const digits=/^\d$/;
function goMenu(s,id){
 if(s.menu===0&&id===7)return {...s,menu:1,field:0};
 if(s.menu===1&&id===1)return {...s,menu:2,field:0};
 if(s.menu===2&&id===1)return {...s,page:"dims",dim:["2","2"],field:0};
 return fail(s,"Choose Matrix & Vector → Create → Matrix.");
}
function press(s,key){
 const enter=key==="enter"||key==="select";
 s={...s,error:""};
 if(key==="ctrl")return {...s,ctrl:!s.ctrl};
 if(s.ctrl){
  s={...s,ctrl:false};
  if(key==="var"&&s.page==="cells"&&s.cell===9){
   if(s.cells.some(x=>! /^[0-3]$/.test(x)))return fail(s,"Fill all nine arrow counts before storing.");
   return {...s,page:"store",raw:""};
  }
  if(key==="del"&&s.page==="calc")return {...s,raw:""};
 }
 if(key==="esc"){
  if(s.page==="menu"&&s.menu)return {...s,menu:s.menu-1,field:s.menu===1?6:0};
  if(s.page!=="calc")return plain(s,{cells:null,dim:null});
  return {...s,raw:""};
 }
 if(key==="menu"&&(s.page==="calc"||s.page==="menu"))return {...s,page:"menu",menu:0,field:0};
 if(s.page==="menu"){
  const m=menus[s.menu];
  if(key==="up"||key==="down")return {...s,field:(s.field+(key==="down"?1:m.length-1))%m.length};
  if(key==="left"&&s.menu)return {...s,menu:s.menu-1,field:s.menu===1?6:0};
  return enter||key==="right"?goMenu(s,m[s.field][0]):digits.test(key)?goMenu(s,+key):s;
 }
 if(s.page==="dims"){
  if(key==="tab"||key==="down"||key==="up"||key==="shift-tab")return {...s,field:(s.field+((key==="up"||key==="shift-tab")?3:1))%4};
  if(enter){if(s.field===3)return plain(s,{dim:null});
   if(s.dim.some(x=>x!=="3"))return fail(s,"For this three-vertex graph set both rows and columns to 3.");
   return {...s,page:"cells",cells:Array(9).fill(""),cell:0};
  }
  if(s.field<2&&(digits.test(key)||key==="del")){const dim=s.dim.slice();dim[s.field]=key==="del"?"":key;return {...s,dim};}
  return s;
 }
 if(s.page==="store"){
  if(key==="a")return {...s,raw:"a"};
  if(enter){
   if(s.raw!=="a")return fail(s,"Type a, then press Enter to store the matrix.");
   const A=[0,1,2].map(r=>s.cells.slice(3*r,3*r+3).map(Number));
   return out(s,{op:"Matrix → a",matrix:A,k:0},{A,result:null});
  }
  if(key==="del")return {...s,raw:""};
  return s;
 }
 if(s.page==="cells"){
  const i=s.cell;
  if(enter){
   if(s.cells.some(x=>! /^[0-3]$/.test(x)))return fail(s,"Fill every cell with a whole arrow count from 0 to 3.");
   const A=[0,1,2].map(r=>s.cells.slice(3*r,3*r+3).map(Number));
   return out(s,{op:"Matrix",matrix:A,k:0},{result:null});
  }
  if(key==="tab"||key==="right")return {...s,cell:Math.min(9,i+1)};
  if(key==="shift-tab"||key==="left")return {...s,cell:Math.max(0,i-1)};
  if(key==="up")return {...s,cell:Math.max(0,i-3)};
  if(key==="down")return {...s,cell:Math.min(8,i+3)};
  if(i<9&&(digits.test(key)||key==="del")){
   const cells=s.cells.slice();cells[i]=key==="del"?"":key;return {...s,cells};
  }
  return s;
 }
 if(enter){
  if(!s.raw)return s;
  if(!s.A)return fail(s,"Store the directed adjacency matrix in a first.");
  if(s.raw==="a")return out(s,{op:"a",matrix:s.A,k:1,source:s.A});
  const m=/^a\^([2-6])$/.exec(s.raw);
  if(!m)return fail(s,"Type a, then the power key and a whole exponent 2–6.");
  const k=+m[1];return out(s,{op:"a^"+k,matrix:power(s.A,k),k,source:s.A});
 }
 if(key==="del")return {...s,raw:s.raw.endsWith(":=")?s.raw.slice(0,-2):s.raw.slice(0,-1)};
 if(key==="square"&&s.raw==="a")return {...s,raw:"a^2"};
 const ch=key==="a"||digits.test(key)?key:key==="power"?"^":"";
 return ch&&s.raw.length<8?{...s,raw:s.raw+ch}:s;
}
return Object.freeze({labels,menus,entries,validate,power,start,press});
})();
