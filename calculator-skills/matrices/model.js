(function(g){"use strict";
const worked=[[2,1],[1,1]], practice=[[3,2],[1,2]];
const menus=[
 [[1,"Actions"],[2,"Number"],[3,"Algebra"],[4,"Calculus"],[5,"Probability"],[6,"Statistics"],[7,"Matrix & Vector"],[8,"Finance"]],
 [[1,"Create"],[2,"Transpose"],[3,"Determinant"]],
 [[1,"Matrix"]]
];
const digits=/^\d$/, integer=/^[+−-]?\d{1,3}$/;
function val(s){const t=String(s).trim();if(!integer.test(t))throw Error("Use whole-number entries from −999 to 999.");return Number(t.replace("−","-"))||0;}
function validate(matrix){
 if(!Array.isArray(matrix)||matrix.length<2||matrix.length>3||!Array.isArray(matrix[0])||matrix[0].length<2||matrix[0].length>3||matrix.some(r=>!Array.isArray(r)||r.length!==matrix[0].length))throw Error("Use a 2- or 3-row matrix with the same 2 or 3 entries in every row.");
 return matrix.map(r=>r.map(val));
}
function determinant(A){if(A.length===1)return A[0][0];return A[0].reduce((d,a,j)=>d+(j%2?-1:1)*a*determinant(minor(A,0,j)),0)||0;}
function minor(A,i,j){return A.filter((_,k)=>i!==k).map(r=>r.filter((_,k)=>j!==k));}
function fraction(n,d){if(!n)return 0;let a=Math.abs(n),b=Math.abs(d);while(b)[a,b]=[b,a%b];n=n/a*Math.sign(d);d=Math.abs(d/a);return d===1?n:n+"/"+d;}
function output(matrix){
 const A=validate(matrix);
 if(A.length!==A[0].length)return {det:null,inverse:null};
 const det=determinant(A);
 return {det,inverse:det?A.map((r,i)=>r.map((_,j)=>fraction((i+j)%2?-determinant(minor(A,j,i)):determinant(minor(A,j,i)),det))):null};
}
function request(params){
 const entered=params.get("matrix");
 if(entered===null)return {target:practice,linked:false,error:""};
 try{
  if(entered.length>65)throw Error();
  return {target:validate(entered.split(";").map(r=>r.split(","))),linked:true,error:""};
 }catch{return {target:practice,linked:true,error:"Matrix link not recognized. Use comma-separated entries and semicolons between rows; the practice example has been loaded."};}
}
function start(){return {page:"calc",input:"",A:null,history:[],ctrl:false,error:"",field:0,menu:0,cells:null,dim:null,cell:0};}
function toCalc(s,update={}){return {...s,page:"calc",ctrl:false,error:"",...update};}
function clear(s){return toCalc(s,{input:"",cells:null,dim:null});}
function history(s,kind,result,name){return {...clear(s),history:[...s.history,{kind,result,name}].slice(-3)};}
function fail(s,error){return {...s,error};}
function commitCells(s,store=false){
 try{
  const A=validate(Array.from({length:Number(s.dim[0])},(_,i)=>s.cells.slice(i*Number(s.dim[1]),(i+1)*Number(s.dim[1]))));
  return history(store?{...s,A}:s,store?"store":"matrix",A,store?"a := matrix":"matrix");
 }catch{return fail(s, "Fill every cell with a whole number from −999 to 999.");}
}
function command(s){
 if(!s.input)return s;
 if(s.input==="a"){
  if(!s.A)return fail(s,"Store a matrix in a first.");
  return history(s,"matrix",s.A,"a");
 }
 const det=s.input==="det(a)", inv=/^a\^(?:-1|\(-1\))$/.test(s.input);
 if(!det&&!inv)return fail(s,"This lesson uses a := matrix, det(a), and a to the power −1.");
 if(!s.A)return fail(s,"Store a matrix in a first.");
 const result=output(s.A);
 if(result.det===null)return fail(s,"Not a square matrix. Determinant and inverse require equal rows and columns.");
 if(det)return history(s,"det",result.det,"det(a)");
 if(!result.inverse)return fail(s,"Singular matrix. The determinant is 0, so no inverse exists.");
 return history(s,"inverse",result.inverse,"a⁻¹");
}
function move(s,i){return {...s,field:i,error:""};}
function goMenu(s,id){
 if(s.menu===0&&id===7)return {...s,menu:1,field:0};
 if(s.menu===1&&id===1)return {...s,menu:2,field:0};
 if(s.menu===1&&id===3)return toCalc(s,{input:"det("});
 if(s.menu===2&&id===1)return {...s,page:"dims",dim:["2","2"],field:0};
 return fail(s,"This lesson uses Matrix & Vector → Create → Matrix.");
}
function press(s,key){
 const select=key==="enter"||key==="select";
 if(key==="ctrl")return {...s,ctrl:!s.ctrl};
 if(s.ctrl){
  s={...s,ctrl:false};
  if(key==="templates"&&s.page==="calc"&&s.input==="a")return {...s,input:"a:=",error:""};
  if(key==="del"&&s.page==="calc")return clear(s);
 }
 if(key==="esc"){
  if(s.page==="menu"&&s.menu>0)return {...s,menu:s.menu-1,field:s.menu===1?menus[0].findIndex(v=>v[0]===7):0,error:""};
  if(s.page!=="calc")return toCalc(s,{cells:null,dim:null});
  return clear(s);
 }
 s={...s,error:""};
 if(key==="menu"&&["calc","menu"].includes(s.page))return {...s,page:"menu",menu:0,field:0};
 if(s.page==="menu"){
  const items=menus[s.menu];
  if(key==="up"||key==="down")return move(s,(s.field+(key==="down"?1:items.length-1))%items.length);
  if(key==="left"&&s.menu)return {...s,menu:s.menu-1,field:s.menu===1?6:0};
  return select||key==="right"?goMenu(s,items[s.field][0]):digits.test(key)?goMenu(s,Number(key)):s;
 }
 if(s.page==="dims"){
  if(key==="tab"||key==="down")return move(s,(s.field+1)%4);
  if(key==="backtab"||key==="up")return move(s,(s.field+3)%4);
  if(select&&!([0,1].includes(s.field)))return s.field===3?toCalc(s,{dim:null}):createCells(s);
  if(select)return createCells(s);
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
  if(select)return commitCells(s,s.input==="a:=");
  if(idx<N&&(digits.test(key)||key==="neg"||key==="minus"||key==="del")){
   const cells=s.cells.slice(),v=cells[idx];cells[idx]=key==="del"?v.slice(0,-1):key==="neg"||key==="minus"?v.startsWith("-")?v.slice(1):"-"+v:v.replace("-","").length<3?v+key:v;
   return {...s,cells};
  }
  return s;
 }
 if(s.page!=="calc")return s;
 if(select)return command(s);
 if(key==="del")return {...s,input:s.input.endsWith(":=")?s.input.slice(0,-2):s.input.slice(0,-1)};
 if(key==="assign"&&s.input==="a")return {...s,input:"a:="};
 const chars={a:"a",d:"d",e:"e",t:"t",lparen:"(",rparen:")",power:"^",neg:"-",minus:"-"};
 return (chars[key]||digits.test(key))&&s.input.length<12?{...s,input:s.input+(chars[key]||key)}:s;
}
function createCells(s){
 if(s.dim.some(v=>!["2","3"].includes(v)))return fail(s,"Select 2 or 3 for both rows and columns.");
 return {...s,page:"cells",cells:Array(Number(s.dim[0])*Number(s.dim[1])).fill(""),cell:0};
}
const cues=[
 [0,"Set up the matrix","Start on a Calculator page. Type a, then Ctrl + template (:=) to name the matrix."],
 [4.1,"Open the entry template","Open Menu → 7: Matrix & Vector → 1: Create → 1: Matrix. Set the number of rows and columns."],
 [12,"Fill the cells","Fill the matrix from left to right, row by row. Use Tab to move between cells. Press Enter to store it."],
 [19.4,"Find its determinant","Type det(a), then press Enter. The determinant is a single number."],
 [25.7,"Find its inverse","For a square matrix with nonzero determinant, type a, ^, the negative key, 1, then Enter."],
 [32,"Check the result","The inverse is another matrix. If the determinant is zero, the matrix is singular and has no inverse."]
];
const duration=36;
const tape=[
 [1.8,"a"],[2.62,"ctrl"],[3.14,"templates"],[4.8,"menu"],[5.72,"7"],[6.55,"1"],[7.25,"1"],
 [8.45,"2"],[9.06,"tab"],[9.6,"2"],[10.3,"tab"],[11.33,"enter"],
 [12.72,"2"],[13.41,"tab"],[14.03,"1"],[14.72,"tab"],[15.4,"1"],[16.1,"tab"],[16.76,"1"],[18.33,"enter"],
 [20.15,"d"],[20.7,"e"],[21.25,"t"],[21.9,"lparen"],[22.5,"a"],[23.08,"rparen"],[24.32,"enter"],
 [26.4,"a"],[27.3,"power"],[28.18,"neg"],[29.1,"1"],[30.6,"enter"]
];
function watchAt(t){
 let state=start(),keys=[];
 for(const [time,key] of tape){
  if(t<time)break;
  state=press(state,key);
  keys=t<time+.38?(key==="templates"?["ctrl",key]:[key]):[];
 }
 return {state,keys,chapter:cues.findLastIndex(([time])=>time<=t)};
}
const api={worked,practice,menus,request,start,press,output,cues,duration,tape,watchAt};
if(typeof module==="object"&&module.exports)module.exports=api;else g.CT21=api;
})(globalThis);
