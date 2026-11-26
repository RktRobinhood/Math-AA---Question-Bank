"use strict";
(function(root){
const vars="xyz", varsOrder=/^[xyz],[xyz],[xyz]$/;
const nat=/^(?:\d{1,4}(?:\.\d{1,3})?|\.\d{1,3})$/;
const variable=/^(?:(\d{1,4}(?:\.\d{1,3})?|\.\d{1,3})(?:\*)?)?([xyz])$/;
const clean=s=>String(s).toLowerCase().replace(/\s/g,"").replace(/[−–]/g,"-").replace(/[·×]/g,"*");
function scaled(n){
 const [whole,frac=""]=n.split(".");
 return BigInt(whole||"0")*1000n+BigInt(frac.padEnd(3,"0"));
}
function row(raw){
 if(typeof raw!=="string"||raw.length>64)throw Error("Keep each equation to 64 characters.");
 const halves=clean(raw).split("=");
 if(halves.length!==2||!halves.every(Boolean))throw Error("Use exactly one equals sign in each row.");
 const out=[0n,0n,0n,0n];
 halves.forEach((side,h)=>{
  const parts=side.match(/[+-]?[^+-]+/g);
  if(!parts||parts.join("")!==side||parts.length>20)throw Error("Use a sum of linear terms in x, y and z.");
  for(let term of parts){
   let sign=h?-1n:1n;
   if(term[0]==="-"||term[0]==="+"){if(term[0]==="-")sign=-sign;term=term.slice(1);}
   const m=term.match(variable);
   if(m)out[vars.indexOf(m[2])]+=sign*(m[1]?scaled(m[1]):1000n);
   else if(nat.test(term))out[3]-=sign*scaled(term);
   else throw Error("Use linear terms and numbers only, with at most three decimal places.");
  }
 });
 return out;
}
const abs=x=>x<0n?-x:x;
function rational(n,d=1n){
 if(!d)throw Error("Zero denominator");
 if(!n)return [0n,1n];
 const sign=d<0n?-1n:1n;let a=abs(n),b=abs(d);
 while(b)[a,b]=[b,a%b];
 return [sign*n/a,abs(d)/a];
}
const div=([a,b],[c,d])=>rational(a*d,b*c);
const mul=([a,b],[c,d])=>rational(a*c,b*d);
const sub=([a,b],[c,d])=>rational(a*d-b*c,b*d);
const text=([n,d])=>d===1n?String(n):n+"/"+d;
function solve(rows,order="x,y,z"){
 if(!varsOrder.test(order)||new Set(order.split(",")).size!==3)throw Error("Use x, y and z once each in Variables.");
 if(!Array.isArray(rows)||rows.length!==3)throw Error("Enter all three equations.");
 const matrix=rows.map(x=>row(x).map(v=>rational(v))),pivots=[];
 for(let col=0,r=0;col<3&&r<3;col++){
  const p=matrix.findIndex((a,i)=>i>=r&&a[col][0]!==0n);
  if(p<0)continue;
  [matrix[r],matrix[p]]=[matrix[p],matrix[r]];
  const lead=matrix[r][col];matrix[r]=matrix[r].map(v=>div(v,lead));
  matrix.forEach((a,i)=>{if(i!==r&&a[col][0]){const k=a[col];matrix[i]=a.map((v,j)=>sub(v,mul(k,matrix[r][j])));}});
  pivots[r++]=col;
 }
 const rankA=pivots.length;
 if(matrix.some(a=>!a[0][0]&&!a[1][0]&&!a[2][0]&&a[3][0]))return {kind:"none",rankA,rankAugmented:rankA+1};
 if(rankA<3)return {kind:"many",rankA,rankAugmented:rankA};
 return {kind:"unique",rankA,rankAugmented:rankA,values:order.split(",").map(v=>text(matrix[vars.indexOf(v)][3]))};
}
const original=["x+y+z=3","x-y=3","z+y=2"];
const boot=()=>({page:"calc",selection:0,dim:"2",order:"x,y",replace:true,rows:["","",""],field:0,caret:null,result:null,error:""});
const glyph={plus:"+",minus:"-",eq:"=",comma:",",dot:".",mul:"*"};
const char=k=>glyph[k]??(/^[0-9xyz]$/.test(k)?k:"");
function step(old,k){
 const s={...old,rows:old.rows.slice(),error:""};
 if(k==="menu")return {...boot(),page:"menu"};
 if(k==="esc"||k==="home")return boot();
 if(s.page==="menu"||s.page==="algebra"){
  const size=s.page==="menu"?7:3,idx=s.page==="menu"?2:1;
  if(k==="up"||k==="down")return {...s,selection:(s.selection+size+(k==="up"?-1:1))%size};
  if(Number(k)-1===idx||(k==="enter"||k==="right"||k==="select")&&s.selection===idx){
   return {...s,page:s.page==="menu"?"algebra":"setup",selection:0,field:0};
  }
  return s;
 }
 if(s.page==="setup"){
  if(k==="tab"||k==="shift-tab")return {...s,field:k==="tab"?Math.min(2,s.field+1):Math.max(0,s.field-1),replace:true};
  if(k==="enter"||k==="select"){
   if(s.dim!=="3")return {...s,error:"Set Number of equations to 3 for this lesson."};
   if(!varsOrder.test(s.order)||new Set(s.order.split(",")).size!==3)return {...s,error:"Enter x,y,z, or another order using each variable once."};
   return {...s,page:"entry",field:0,caret:0};
  }
  if(s.field===0&&/^\d$/.test(k))return {...s,dim:k};
  if(s.field===1&&(k==="del"||/^[xyz,]$/.test(char(k)))){
   const next=s.replace?"":s.order;
   return {...s,order:k==="del"?next.slice(0,-1):(next+char(k)).slice(0,5),replace:false};
  }
  return s;
 }
 if(s.page==="entry"){
  const current=s.rows[s.field],pos=s.caret??current.length;
  if(k==="tab"||k==="shift-tab"){
   const f=s.field+(k==="tab"?1:-1);
   return f>=0&&f<=2?{...s,field:f,caret:s.rows[f].length}:s;
  }
  if(k==="enter"){
   try{return {...s,page:"result",result:solve(s.rows,s.order)};}catch(e){return {...s,error:e.message};}
  }
  if(k==="left"||k==="right")return {...s,caret:Math.max(0,Math.min(current.length,pos+(k==="left"?-1:1)))};
  if(k==="del"&&pos){s.rows[s.field]=current.slice(0,pos-1)+current.slice(pos);return {...s,caret:pos-1};}
  const c=char(k);
  if(c&&current.length<64){s.rows[s.field]=current.slice(0,pos)+c+current.slice(pos);return {...s,caret:pos+1};}
 }
 return s;
}
if(typeof module==="object"&&module.exports){module.exports={row,solve,step,boot,original};return;}
const M={solve,step,boot};
let current=null, mode="watch", frameStamp="", live=M.boot(), returnToWatch=null;
const el=(tag,cls="",value)=>{const n=document.createElement(tag);n.className=cls;if(value!==undefined)n.textContent=value;return n;};
const display=x=>x.replaceAll("-","−").replaceAll("*","·");
function nodeButton(text,action,cls=""){
 const b=el("button",cls,text);b.type="button";b.onclick=action;return b;
}
function physical(k,restore=false){
 if(mode!=="try")return;
 const typed=current.screen.querySelector('input[data-row="'+live.field+'"]');
 if(typed&&document.activeElement===typed)live.caret=typed.selectionStart;
 live=M.step(live,k);
 current.handset.setKeys([k]);draw(live,true,restore);
}
function mount(host){
 if(current)return current;
 host.classList.add("ls3-device");
 const handsetHost=el("div","ls3-host"), screen=el("div","ls3-lcd");
 const pane=el("aside","ls3-practice");pane.hidden=true;
 pane.append(el("h2","","Try a different system"),el("p","","Menu → 3 → 2; choose three equations and x,y,z. Then enter this new system."),el("p","ls3-task","x + y + z = 3\nx − y = 3\nz + y = 2"));
 const actions=el("div","ls3-actions");
 actions.append(nodeButton("Reset calculator",()=>{live=M.boot();draw(live,true);current.handset.setKeys([]);},"btn ghost"),
    nodeButton("Return to Watch",()=>returnToWatch?.(),"btn ghost"));pane.append(actions);
 const resultHelp=el("p","ls3-support");resultHelp.setAttribute("role","status");pane.append(resultHelp);
 host.append(handsetHost,pane);
 const handset=CalculatorLessonHandset.mount(handsetHost,{screen,label:"TI-Nspire CX II-T Calculator",onKey:k=>physical(k,k==="enter"||k==="tab")});
 current={host,handsetHost,screen,pane,handset,resultHelp};return current;
}
const head="Solve a System of Linear Equations";
function draw(s,interactive,restore=false){
 const {screen,resultHelp}=current;
 const status=el("div","ls3-status","1.1  Calculator");status.append(el("span","ls3-battery","▰"));
 const body=el("div","ls3-content");screen.replaceChildren(status,body);screen.setAttribute("aria-label","Calculator LCD");
 if(s.page==="menu"||s.page==="algebra"){
  const menu=el("div","ls3-menu"), rootMenu=["1: Actions","2: Number","3: Algebra ▸","4: Calculus","5: Probability","6: Statistics","7: Matrix & Vector"];
  const inner=["1: Numerical Solve…","2: Solve System of Linear Equations…","3: Polynomial Tools ▸"];
  function items(data,name){
   const list=el("ol","ls3-menu-"+name);
   data.forEach((v,i)=>{
    const li=el("li",(s.page===name&&s.selection===i||s.page==="algebra"&&name==="menu"&&i===2)?"ls3-selected":"");
    const valid=interactive&&s.page===name&&i===(name==="menu"?2:1);
    li.append(valid?nodeButton(v,()=>physical(String(i+1))):el("span","",v));list.append(li);
   });
   return list;
  }
  menu.append(items(rootMenu,"menu"));if(s.page==="algebra")menu.append(items(inner,"algebra"));body.append(menu);
 }else if(s.page==="setup"){
  const box=el("section","ls3-setup"), fields=el("div","ls3-fields");
  box.append(el("strong","ls3-dialog-head",head));
  for(const [i,label,value] of [[0,"Number of equations:",s.dim],[1,"Variables:",s.order]]){
   fields.append(el("span","",label));
   const v=interactive?nodeButton(value,()=>{live={...live,field:i,replace:true};draw(live,true);},s.field===i?"ls3-selected":""):el("b",s.field===i?"ls3-selected":"",value);
   fields.append(v);
  }
  const footer=el("div","ls3-dialog-actions");
  footer.append(interactive?nodeButton("OK",()=>physical("enter",true),s.field===2?"ls3-selected":""):el("span",s.field===2?"ls3-selected":"","OK"),
   interactive?nodeButton("Cancel",()=>physical("esc")):el("span","","Cancel"));
  box.append(fields,el("small","ls3-variable-note","Enter variable names separated by commas."),footer);
  body.append(box);
 }else if(s.page==="entry"||s.page==="result"){
  const form=el("div","ls3-command"), group=el("div","ls3-inputs");
  form.append(el("span","ls3-linsolve","linSolve("),el("span","ls3-brace","{"));
  s.rows.forEach((line,i)=>{
   if(interactive&&s.page==="entry"){
    const input=el("input","ls3-cell"+(s.field===i?" ls3-selected":""));
    input.dataset.row=String(i);input.setAttribute("aria-label","Equation "+(i+1));input.type="text";input.maxLength=64;input.value=line;input.autocomplete="off";input.spellcheck=false;
    input.onfocus=()=>{live={...live,field:i,caret:input.selectionStart};};
    input.oninput=()=>{live.rows[i]=input.value;live.caret=input.selectionStart;resultHelp.textContent="";};
    input.onkeydown=e=>{
     if(e.isComposing||e.altKey||e.ctrlKey||e.metaKey)return;
     if(e.key==="Enter"||e.key==="Tab"&&(e.shiftKey?i>0:i<2)){
      e.preventDefault();e.stopPropagation();physical(e.key==="Enter"?"enter":e.shiftKey?"shift-tab":"tab",true);
     }
    };group.append(input);
   }else group.append(el("span","ls3-cell"+(s.page==="entry"&&s.field===i?" ls3-selected":""),line?display(line):"□"));
  });
  form.append(group,el("span","ls3-order",", {"+s.order+"})"));body.append(form);
  if(s.result){
   const unique=s.result.kind==="unique", output=unique?"{"+s.result.values.map(display).join(", ")+"}":s.result.kind==="none"?"No solution found":"No unique solution";
   const result=el("p","ls3-result",output);result.dataset.solution=s.result.kind;body.append(result);
   if(interactive){
    const advice=unique?"Use "+s.order.replaceAll(",",", ")+" order; substitute into the three equations.":
     s.result.kind==="none"?"The equations are inconsistent. No triple makes all three true.":"These equations admit infinitely many solutions. This rehearsal reports the classification, not the calculator’s parameter notation.";
    resultHelp.textContent=advice;
   }
  }
 }else body.append(el("p","ls3-caret","▏"));
 if(s.error){body.append(el("p","ls3-error",s.error));if(interactive)resultHelp.textContent=s.error;}
 else if(interactive&&!s.result)resultHelp.textContent="";
 if(interactive&&restore&&s.page==="entry"){
  const input=body.querySelector('input[data-row="'+s.field+'"]');
  if(input){input.focus({preventScroll:true});input.setSelectionRange(s.caret??input.value.length,s.caret??input.value.length);}
 }
}
function renderWatch(host,{crossed}){
 mount(host);
 if(frameStamp===String(crossed.length))return;
 frameStamp=String(crossed.length);
 const state=crossed.reduce((s,mark)=>M.step(s,mark.physicalKey),M.boot());
 draw(state,false);current.handset.setKeys(crossed.length?[crossed.at(-1).physicalKey]:[]);
}
function enterTry(host,actions){
 mount(host); mode="try";returnToWatch=actions.returnToWatch;current.pane.hidden=false;
 current.handset.setInteractive(true);draw(live,true);
}
function exitTry(){mode="watch";current.pane.hidden=true;current.handset.setInteractive(false);frameStamp="";}
const keyboard={m:"menu",Enter:"enter",Backspace:"del",Delete:"del",Escape:"esc",Tab:"tab",ArrowUp:"up",ArrowDown:"down",ArrowLeft:"left",ArrowRight:"right","+":"plus","-":"minus","=":"eq",",":"comma",".":"dot","*":"mul"};
document.addEventListener("keydown",e=>{
 if(mode!=="try"||e.altKey||e.ctrlKey||e.metaKey||e.isComposing||e.defaultPrevented)return;
 if(e.target!==document.body&&!e.target.closest?.(".lw-stage[data-mode=try]"))return;
 if(e.target.closest?.("input,select,textarea,a,summary,[contenteditable]")||e.target.closest?.("button")&&(e.key===" "||e.key==="Enter"))return;
 let k=keyboard[e.key]||(/^[0-9xyz]$/i.test(e.key)?e.key.toLowerCase():e.key==="M"?"menu":null);
 if(k==="tab"){
  if(live.page!=="setup"&&live.page!=="entry")return;
  if(e.shiftKey)k="shift-tab";
 }
 if(k){e.preventDefault();physical(k,k==="enter"||k==="tab"||k==="shift-tab");}
});
root.CalculatorLessonAdapter=Object.freeze({initialMode:new URLSearchParams(location.search).get("mode")==="try"?"try":"watch",renderWatch,enterTry,exitTry});
})(globalThis);
