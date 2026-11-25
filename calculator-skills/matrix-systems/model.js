(function(global){"use strict";
const KIND=23, SYS=KIND===23;
const taskKeys=SYS?["matrix","rhs"]:["transition","state","steps"];
const worked=SYS?{matrix:[[2,1],[1,-1]],rhs:[7,2]}:{transition:[[.8,.3],[.2,.7]],state:[1,0],steps:4};
const practice=SYS?{matrix:[[3,-1],[2,2]],rhs:[7,2]}:{transition:[[.75,.1],[.25,.9]],state:[.6,.4],steps:5};
const linked=SYS?{matrix:[[2,3],[1,-1]],rhs:[2,-2]}:{transition:[[.65,.15],[.35,.85]],state:[.8,.2],steps:3};
const menus=[
 [[1,"Actions"],[2,"Number"],[3,"Algebra"],[4,"Calculus"],[5,"Probability"],[6,"Statistics"],[7,"Matrix & Vector"],[8,"Finance"],[9,"Functions & Programs"]],
 [[1,"Create"],[2,"Transpose"],[3,"Determinant"],[4,"Row-Echelon Form"],[5,"Reduced Row-Echelon Form"],[6,"Simultaneous"]],
 [[1,"Matrix"],[2,"Augment"],[3,"Identity"],[4,"Diagonal"],[5,"Rand Matrix"],[6,"Fill"]]
];
const digits=/^\d$/, integer=/^[+−-]?\d{1,3}$/, unit=/^(?:0(?:\.\d{1,3})?|1(?:\.0{1,3})?|\.\d{1,3})$/;
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b), column=a=>a.map(v=>[v]);
function number(x){
 const t=String(x).trim();
 if(!(SYS?integer:unit).test(t))throw Error(SYS?"Use integers from −999 to 999.":"Use probabilities from 0 to 1, with up to three decimal places.");
 return Number(t.replace("−","-"))||0;
}
function parse(input){
 if(taskKeys.some(k=>typeof input[k]!=="string"||input[k].length>64))throw Error("Use every input field.");
 const A=input[taskKeys[0]].split(";").map(row=>row.split(","));
 const y=input[taskKeys[1]].split(",");
 if(A.length!==2||A.some(row=>row.length!==2)||y.length!==2)throw Error("Enter two matrix rows separated by a semicolon, and two column entries separated by a comma.");
 const T=A.map(row=>row.map(number)),p=y.map(number);
 if(SYS)return {matrix:T,rhs:p};
 if(T.some(r=>r.some(v=>v<=0||v>=1)))throw Error("Every transition probability must lie strictly between 0 and 1.");
 for(let j=0;j<2;j++)if(Math.round(T[0][j]*1000)+Math.round(T[1][j]*1000)!==1000)throw Error("Each column of T must sum to 1.");
 if(p.reduce((sum,v)=>sum+Math.round(v*1000),0)!==1000)throw Error("Both entries of the starting state must sum to 1.");
 const n=input.steps.trim();
 if(!/^(?:[1-9]|[12][0-9]|30)$/.test(n))throw Error("Use a whole transition count from 1 to 30.");
 return {transition:T,state:p,steps:+n};
}
function request(params){
 if(!taskKeys.some(k=>params.has(k)))return {target:practice,linked:false,error:""};
 try{
  if(taskKeys.some(k=>params.getAll(k).length!==1))throw Error("All required fields must appear exactly once.");
  return {target:parse(Object.fromEntries(taskKeys.map(k=>[k,params.get(k)]))),linked:true,error:""};
 }catch(e){return {target:practice,linked:true,error:"Invalid practice link. "+e.message+" Using a fresh independent exercise instead."};}
}
const encode=target=>({[taskKeys[0]]:target[taskKeys[0]].map(r=>r.join(",")).join(";"),[taskKeys[1]]:target[taskKeys[1]].join(","),...(!SYS?{steps:String(target.steps)}:{})});
function gcd(a,b){for(a=Math.abs(a),b=Math.abs(b);b;)[a,b]=[b,a%b];return a||1}
function frac(n,d=1){if(!d)throw Error("The coefficient matrix is singular; there is no inverse.");const g=gcd(n,d)*Math.sign(d);return [n/g||0,d/g];}
function fstr([n,d]){return d===1?String(n):n+"/"+d;}
const fnum=([n,d])=>n/d, sub=([a,b],[c,d])=>frac(a*d-c*b,b*d), times=([a,b],[c,d])=>frac(a*c,b*d), divide=([a,b],[c,d])=>frac(a*d,b*c);
function rref(A){
 const rows=A.map(r=>r.map(v=>frac(v)));let pivot=0;
 for(let col=0;col<A[0].length&&pivot<rows.length;col++){
  const p=rows.findIndex((row,i)=>i>=pivot&&row[col][0]!==0);
  if(p<0)continue;
  [rows[p],rows[pivot]]=[rows[pivot],rows[p]];
  const div=rows[pivot][col];rows[pivot]=rows[pivot].map(v=>divide(v,div));
  for(let i=0;i<rows.length;i++){if(i===pivot)continue;const k=rows[i][col];rows[i]=rows[i].map((v,j)=>sub(v,times(k,rows[pivot][j])));}
  pivot++;
 }
 return rows;
}
function solve(A,b){
 const R=rref(A.map((r,i)=>[...r,b[i]]));
 const status=R.some(r=>!r[0][0]&&!r[1][0]&&r[2][0])?"none":R.some(r=>r.every(q=>!q[0]))?"many":"unique";
 return {status,exact:status==="unique"?R.map(r=>r[2]):null,R};
}
function inverse([[a,b],[c,d]],v){
 const D=a*d-b*c;
 return [frac(d*v[0]-b*v[1],D),frac(a*v[1]-c*v[0],D)];
}
function multiply(A,B){
 if(A[0].length!==B.length)throw Error("Dimension mismatch. A column-state vector belongs on the right.");
 return A.map(r=>B[0].map((_,j)=>r.reduce((u,v,i)=>u+v*B[i][j],0)));
}
function predict(A,p,n){
 let B=column(p),P=A;
 for(let k=n;k;k>>=1){if(k&1)B=multiply(P,B);if(k>1)P=multiply(P,P);}
 return B.map(r=>r[0]);
}
function stationary(T){const b=Math.round(T[0][1]*1000),c=Math.round(T[1][0]*1000);return [frac(b,b+c),frac(c,b+c)];}
function prob(A){return A?.length===2&&A[0].length===2&&A.every(r=>r.every(v=>v>0&&v<1))&&[0,1].every(j=>Math.round(A[0][j]*1000)+Math.round(A[1][j]*1000)===1000);}
function state(B){return B?.length===2&&B[0].length===1&&B.flat().every(v=>v>=0&&v<=1)&&B.flat().reduce((sum,v)=>sum+Math.round(v*1000),0)===1000;}
function start(){return {page:"calc",input:"",vars:{},history:[],ctrl:false,error:"",field:0,menu:0,cells:null,dim:null,cell:0,sup:false};}
const clean=(s,extra={})=>({...s,page:"calc",ctrl:false,error:"",...extra});
const clear=s=>clean(s,{input:"",cells:null,dim:null,sup:false});
const fail=(s,error)=>({...s,error});
const add=(s,entry)=>({...clear(s),history:[...s.history,entry].slice(-4)});
const names=SYS?/^[abm]$/:/^[ts]$/;
function commit(s){
 if(s.cell<s.cells.length)s={...s,cell:s.cells.length};
 try{
  const c=+s.dim[1],A=Array.from({length:+s.dim[0]},(_,i)=>s.cells.slice(i*c,(i+1)*c).map(number));
  const name=s.input.endsWith(":=")?s.input[0]:null;
  return add(name?{...s,vars:{...s.vars,[name]:A}}:s,{kind:name?"store":"matrix",name:name?name+" :=":"",result:A});
 }catch(e){return fail(s,e.message);}
}
function calc(s){
 const u=s.input,W=s.vars; if(!u)return s;
 try{
  if(names.test(u)&&W[u])return add(s,{kind:"matrix",name:u,result:W[u]});
  if(SYS&&/^rref\(m\)?$/.test(u)){
   if(!W.m||W.m.length!==2||W.m[0].length!==3)throw Error("Store the augmented 2×3 matrix as m first.");
   const sol=solve(W.m.map(r=>r.slice(0,2)),W.m.map(r=>r[2]));
   return add(s,{kind:"rref",name:"rref(m)",result:sol.R.map(r=>r.map(fstr)),status:sol.status,m:W.m});
  }
  if(SYS&&u==="a^-1×b"){
   if(!W.a||W.a.length!==2||W.a[0].length!==2||!W.b||W.b.length!==2||W.b[0].length!==1)throw Error("Store a as the 2×2 coefficient matrix and b as the 2×1 constants column.");
   const exact=inverse(W.a,W.b.flat());return add(s,{kind:"inverse",name:u,result:column(exact.map(fstr)),a:W.a,b:W.b,status:"unique"});
  }
  if(!SYS&&/^s(?:\^\d{1,2})?×t$/.test(u))throw Error("Dimension mismatch. Put the transition matrix on the left and the state column on the right.");
  const match=!SYS&&/^t(?:\^(\d{1,2}))?×s$/.exec(u);
  if(match){
   const k=match[1]===undefined?1:Number(match[1]);
   if(k>30)throw Error("Choose an exponent from 0 to 30.");
   if(!prob(W.t))throw Error("Store t as a strictly positive 2×2 matrix with columns summing to 1.");
   if(!state(W.s))throw Error("Store s as a 2×1 probability column summing to 1.");
   const v=predict(W.t,W.s.flat(),k);
   return add(s,{kind:"prediction",name:u,result:column(v),t:W.t,s:W.s,k});
  }
  if(!SYS&&/^t\^\d{1,2}$/.test(u)){
   const k=Number(u.slice(2));if(k>30||!prob(W.t))throw Error("Store a valid t and choose an exponent from 0 to 30.");
   const p=predict(W.t,[1,0],k),q=predict(W.t,[0,1],k);
   return add(s,{kind:"power",name:u,result:[[p[0],q[0]],[p[1],q[1]]]});
  }
  throw Error(SYS?"Use a^−1 × b, or select Reduced Row-Echelon Form and enter m.":"Enter t × s or raise t to a whole-number power before multiplying by s.");
 }catch(e){return fail(s,e.message);}
}
function goMenu(s,id){
 if(s.menu===0&&id===7)return {...s,menu:1,field:0};
 if(s.menu===1&&id===1)return {...s,menu:2,field:0};
 if(SYS&&s.menu===1&&id===5)return clean(s,{input:"rref(",sup:false});
 if(s.menu===2&&id===1)return {...s,page:"dims",dim:["2","2"],field:0};
 return fail(s,"This rehearsal only models the menu operations used here.");
}
function press(s,key){
 const select=key==="enter"||key==="select";
 if(key==="ctrl")return {...s,ctrl:!s.ctrl};
 if(s.ctrl){
  s={...s,ctrl:false};
  if(key==="templates"&&s.page==="calc"&&names.test(s.input))return {...s,input:s.input+":=",error:""};
  if(key==="del"&&s.page==="calc")return clear(s);
 }
 if(key==="esc"){
  if(s.page==="menu"&&s.menu>0)return {...s,menu:s.menu-1,field:s.menu===1?6:0,error:""};
  return s.page!=="calc"?clean(s,{cells:null,dim:null}):clear(s);
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
  if(select){
   if(s.field===3)return clean(s,{dim:null});
   if(!(SYS?["2,1","2,2","2,3"]:["1,2","2,1","2,2"]).includes(s.dim.join(",")))return fail(s,SYS?"Use 2×2, 2×1 or 2×3.":"Use 2×2 or 2×1. A 1×2 row is available for comparison.");
   return {...s,page:"cells",cells:Array(+s.dim[0]*+s.dim[1]).fill(""),cell:0};
  }
  if(s.field<2&&(digits.test(key)||key==="del")){const dim=s.dim.slice();dim[s.field]=key==="del"?"":key;return {...s,dim};}
  return s;
 }
 if(s.page==="cells"){
  const C=+s.dim[1],N=s.cells.length,idx=s.cell;
  if(key==="tab"||key==="right")return {...s,cell:Math.min(N,idx+1)};
  if(key==="left"||key==="backtab")return {...s,cell:Math.max(0,idx-1)};
  if(key==="up")return {...s,cell:Math.max(0,idx-C)};
  if(key==="down")return {...s,cell:Math.min(N-1,idx+C)};
  if(select)return commit(s);
  if(idx<N){
   let cell=s.cells[idx];
   if(key==="del")cell=cell.slice(0,-1);
   else if(SYS&&key==="neg"&&cell==="")cell="-";
   else if(!SYS&&key==="dot"&&!cell.includes("."))cell+=".";
   else if(digits.test(key)&&(SYS?cell.replace("-","").length<3:cell.includes(".")?cell.split(".")[1].length<3:cell.length<1))cell+=key;
   else return s;
   const cells=s.cells.slice();cells[idx]=cell;return {...s,cells};
  }
  return s;
 }
 if(select)return calc(s);
 if(key==="del"){const input=s.input.endsWith(":=")?s.input.slice(0,-2):s.input.slice(0,-1);return {...s,input,sup:s.sup&&input.includes("^")};}
 if(key==="assign"&&names.test(s.input))return {...s,input:s.input+":="};
 if(key==="right"&&s.sup)return {...s,sup:false};
 if(key==="power"&&(SYS?s.input==="a":/^[ts]$/.test(s.input)))return {...s,input:s.input+"^",sup:true};
 if(s.sup){
  if((digits.test(key)||SYS&&key==="neg"&&s.input.endsWith("^"))&&s.input.split("^")[1].length<2)return {...s,input:s.input+(key==="neg"?"-":key)};
  return s;
 }
 const char=names.test(key)?key:key==="mul"?"×":SYS&&key==="rparen"?")":"";
 return char&&s.input.length<15?{...s,input:s.input+char}:s;
}
function matches(e,target){
 if(SYS)return e?.kind==="inverse"&&same(e.a,target.matrix)&&same(e.b,column(target.rhs))||e?.kind==="rref"&&same(e.m,target.matrix.map((r,i)=>[...r,target.rhs[i]]));
 return e?.kind==="prediction"&&same(e.t,target.transition)&&same(e.s,column(target.state))&&e.k===target.steps;
}
function rationalInput(raw){
 const t=raw.trim().replaceAll("−","-");
 if(t.length>35)return null;
 const f=/^([+-]?\d+)\s*\/\s*(\d+)$/.exec(t);if(f)return BigInt(f[2])>0n?[BigInt(f[1]),BigInt(f[2])]:null;
 if(!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(t))return null;
 const [a,b=""]=t.replace(/^[+-]/,"").split(".");
 return [(t.startsWith("-")?-1n:1n)*BigInt(a+b),10n**BigInt(b.length)];
}
const equals=(v,[n,d])=>!!v&&v[0]*BigInt(d)===v[1]*BigInt(n);
function markovRounded(A,p,k){
 const v=A.flat().map(v=>BigInt(Math.round(v*1000)));
 let l=BigInt(Math.round(p[0]*1000)),r=BigInt(Math.round(p[1]*1000)),d=1000n;
 for(let i=0;i<k;i++){[l,r]=[v[0]*l+v[1]*r,v[2]*l+v[3]*r];d*=1000n;}
 return Number((2000n*l+d)/(2n*d));
}
const fmt=v=>typeof v==="number"?String(Number(v.toPrecision(SYS?7:9))):v;
function grade(target,choice,x,y){
 if(SYS){
  const sol=solve(target.matrix,target.rhs);
  if(choice!==sol.status)return "Read the rows again. A contradictory row differs from an all-zero row.";
  if(sol.status!=="unique")return sol.status==="none"?"Correct. The contradiction cannot be satisfied.":"Correct. There are fewer independent equations than variables, so at least one variable is free.";
  const values=[x,y].map(rationalInput),ok=sol.exact.every((v,i)=>equals(values[i],v));
  return ok?"Correct. Substitution satisfies both equations.":"Read x before y. If an entry is a fraction, give its exact value.";
 }
 const r=predict(target.transition,target.state,target.steps)[0],z=stationary(target.transition)[0];
 const exact=markovRounded(target.transition,target.state,target.steps),shown=Number(fmt(r));
 const answer=rationalInput(x);
 if(!equals(answer,[exact,1000])&&!equals(answer,[Math.round((shown+Number.EPSILON)*1000),1000]))return "Check the upper entry of the state column after the requested transitions.";
 if(!equals(rationalInput(y),z))return "For steady state, solve the balance equation together with the sum-to-one condition. Give an exact number or fraction.";
 return "Correct. The first value is a finite-step prediction; the second is the unchanged proportion.";
}
const cues=SYS?[
 [0,"Set the variable order","Solve 2x + y = 7 and x − y = 2. Use x, y in that order. Store the coefficients as a with Ctrl + template (:=)."],
 [4,"Set the matrix size","On a Calculator page choose Menu → 7: Matrix & Vector → 1: Create → 1: Matrix. Use 2 rows and 2 columns."],
 [9,"Fill the coefficient rows","Enter 2, 1 in the first row and 1, −1 in the second. Tab moves to the next cell. Press Enter to store a."],
 [15,"Make the constants column","Store b the same way, but use 2 rows and 1 column. Enter 7 above 2 to match the original equation order."],
 [27,"Multiply in this order","Type a, then ^, the negative key and 1. Press → to leave the exponent, then ×, b, Enter. A⁻¹ multiplies b on the left."],
 [34,"Read and check","Read x = 3 above y = 1. In the original equations, 2(3) + 1 = 7 and 3 − 1 = 2."],
 [39,"What if there is no inverse?","For x + 2y = 4 and 2x + 4y = 9, enter a 2×3 matrix m. Keep x, y first; put the constants in the final column."],
 [56,"Reduce the augmented rows","Select Menu → 7: Matrix & Vector → 5: Reduced Row-Echelon Form. Enter m inside rref( and press Enter."],
 [62,"Read the contradiction","The last row represents 0x + 0y = 1, so there is no solution. A zero row instead leaves one variable free here. This is a diagnostic, not the invertible exam case."]
]:[
 [0,"Label the states","A locker is either ready (A) or in use (B). Columns of T are the current states; rows are the next states. Store T as t."],
 [4,"Open a 2×2 matrix","Type t then Ctrl + template (:=). On a Calculator page open Menu → 7: Matrix & Vector → 1: Create → 1: Matrix."],
 [9,"Enter row by row","Enter 0.8, 0.3 then 0.2, 0.7. The second column says a locker currently in use moves to Ready with probability 0.3."],
 [22,"Make the starting state a column","Store s using the same menu, with 2 rows and 1 column. The locker starts Ready, so enter 1 above 0."],
 [32,"Predict the first transition","Enter t × s. The state column belongs on the right. The upper result, 0.8, is the probability of Ready after one transition."],
 [40,"Predict four transitions","Enter t ^ 4, then → to leave the exponent, then × s, Enter. Read 0.625 after four transitions; do not take the fourth power of each entry."],
 [50,"Compare the long run","Repeat with exponent 24. It is very close to 0.6 for Ready. For these positive transitions the model tends to a unique steady state."],
 [60,"Find the exact steady state","At equilibrium, flow from Ready to In use equals flow back: 0.2p = 0.3(1 − p), so p = 3/5. That is exact; a finite power is only an approximation."]
];
const duration=SYS?69:68,tape=[];
const keyAt=(when,list,spacing=.55)=>list.forEach((k,i)=>tape.push([+(when+i*spacing).toFixed(3),k]));
const chars=n=>String(n).split("").map(k=>k==="-"?"neg":k==="."?"dot":k);
const rows=A=>A.flat().flatMap((n,i,F)=>[...chars(n),...(i+1===F.length?[]:["tab"])]);
const store=(name,cols)=>[name,"ctrl","templates","menu","7","1","1","2","tab",String(cols),"tab","enter"];
if(SYS){
 keyAt(1.6,["a","ctrl","templates"],.65);
 keyAt(4.25,store("a",2).slice(3),.54);
 keyAt(9.4,[...rows(worked.matrix),"enter"],.52);
 keyAt(15.4,store("b",1),.53);
 keyAt(22.2,["7","tab","2","enter"],.58);
 keyAt(27.3,["a","power","neg","1","right","mul","b","enter"],.67);
 keyAt(39.35,store("m",3),.64);
 keyAt(47.4,[...rows([[1,2,4],[2,4,9]]),"enter"],.63);
 keyAt(56.35,["menu","7","5","m","enter"],.85);
}else{
 keyAt(3.1,["t","ctrl","templates"],.5);
 keyAt(4.7,store("t",2).slice(3),.49);
 keyAt(9.43,[...rows(worked.transition),"enter"],.62);
 keyAt(22.4,store("s",1),.57);
 keyAt(29.4,["1","tab","0","enter"],.54);
 keyAt(32.4,["t","mul","s","enter"],.73);
 keyAt(40.4,["t","power","4","right","mul","s","enter"],.78);
 keyAt(50.4,["t","power","2","4","right","mul","s","enter"],.8);
}
function watchAt(time){
 const t=Math.max(0,Math.min(duration,Number(time)||0));let state=start(),keys=[];
 for(const [at,key] of tape){
  if(t<at)break;
  state=press(state,key);
  keys=t<at+.38?(key==="templates"?["ctrl",key]:[key]):[];
 }
 return {state,keys,chapter:cues.findLastIndex(([at])=>at<=t)};
}
const api={KIND,SYS,worked,practice,linked,menus,taskKeys,parse,request,encode,start,press,predict,stationary,markovRounded,solve,inverse,frac,fstr,fmt,matches,grade,cues,duration,tape,watchAt};
if(typeof module==="object"&&module.exports)module.exports=api;else global.CTMatrix=api;
})(globalThis);
