(function(){"use strict";
const M=window.CT21,$=id=>document.getElementById(id),stage=$("stage"),screen=$("screen");
const params=new URLSearchParams(location.search),request=M.request(params);
let mode="watch",s=M.start(),light=0,stamp=-1,returnToWatch;
let colon=false,lastTarget=null,milestones=new Set(),attemptKind="";
const handheld=$("handheld-host");
const shell=CalculatorLessonHandset.mount(handheld,{screen:$("lcd"),interactive:false,label:"TI-Nspire CX II-T Calculator",onKey:k=>{physical(k);stage.focus({preventScroll:true});}});
const pretty=v=>String(v).replace(/-/g,"−");
const elt=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
function label(text,action,active,watch,cls){
 const b=elt("button",text,cls);b.type="button";
 if(active)b.classList.add("calc-active");
 if(watch)b.disabled=true;else if(action)b.addEventListener("click",action);
 return b;
}
function matrix(rows,{snapshot=null,interactive=false,fixed=false,toDisplay=pretty}={}){
 const m=elt("span",undefined,"matrix");m.style.setProperty("--m-columns",rows[0].length);m.dataset.matrix=JSON.stringify(rows);
 rows.forEach((row,i)=>row.forEach((v,j)=>{
  const idx=i*row.length+j,active=snapshot?.cell===idx,symbol=v===""?" ":toDisplay(v);
  const a=interactive?label(symbol,()=>{s={...s,cell:idx};render(s,false);stage.focus({preventScroll:true});},active,false,"matrix-cell"):elt("span",symbol,"matrix-cell"+(active?" calc-active":""));
  if(snapshot){ a.classList.toggle("placeholder",v==="");a.setAttribute("aria-label","Row "+(i+1)+", column "+(j+1)+(v===""?", empty":": "+v)); a.dataset.cell=idx; }
  if(fixed)a.classList.add("fixed");
  m.append(a);
 }));
 return m;
}
function expression(s){
 if(/^a\^/.test(s.input)){const h=elt("span","a"),exp=elt("sup",pretty(s.input.slice(2))||" ","exponent");exp.append(elt("i",undefined,"cursor"));h.append(exp);return h;}
 const out=elt("span",s.input.replace(":="," := ").replace(/-/g,"−"));
 if(s.ctrl)out.append(elt("small","ctrl","ctrl-on"));
 else out.append(elt("i",undefined,"cursor"));
 return out;
}
function logLine(entry){
 const row=elt("div",undefined,"log-line");row.dataset.kind=entry.kind;
 row.append(elt("span",entry.name==="a := matrix"?"a :=":entry.name==="matrix"?"Matrix":entry.name,"log-operation"));
 const large=entry.kind==="inverse"&&entry.result.some(r=>r.some(x=>String(x).length>6));
 const concise=x=>{
  const [num,den=1]=String(x).split("/").map(Number);
  const n=num/den, val=n!==0&&(Math.abs(n)<.01||Math.abs(n)>=1000)?n.toExponential(2):String(Number(n.toPrecision(3)));
  return pretty(val.replace(/^(-?)0\./,"$1.").replace(".0e","e").replace("e+","E").replace("e-","E-"));
 };
 if(large){
  row.classList.add("approx");
  row.firstElementChild.textContent+=" ≈";
  row.setAttribute("aria-label","a inverse, approximate display");
 }
 let v=Array.isArray(entry.result)?matrix(entry.result,{toDisplay:large?concise:pretty}):elt("span",pretty(entry.result));
 v.classList.add("log-value");row.append(v);return row;
}
function controls(snapshot,watch){
 const modal=elt("div",undefined,"lcd-modal");
 if(snapshot.page==="menu"){
  const names=["Calculator menu","Matrix & Vector","Create"];
  modal.setAttribute("aria-label",names[snapshot.menu]);modal.append(elt("strong",names[snapshot.menu],"menu-title"));
  const entries=M.menus[snapshot.menu],offset=snapshot.menu===0?(snapshot.field>=5?4:0):0;
  for(const [i,[id,name]] of entries.entries())if(i>=offset&&i<offset+5){
   modal.append(label(id+": "+name+((id===7&&snapshot.menu===0||id===1&&snapshot.menu===1)?" ▸":""),()=>physical(String(id)),i===snapshot.field,watch,"menu-item"));
  }
  if(snapshot.menu===0&&offset===0)modal.append(label("7: Matrix & Vector ▸",()=>physical("7"),snapshot.field===6,watch,"menu-item wanted"));
  return modal;
 }
 modal.setAttribute("aria-label","Create a Matrix");modal.append(elt("strong","Create a Matrix"));
 const grid=elt("div",undefined,"lcd-grid"),actions=elt("div",undefined,"lcd-actions");
 ["Number of rows","Number of columns"].forEach((text,i)=>{
  const b=label(snapshot.dim[i]||" ",()=>{s={...s,field:i};render(s,false);stage.focus({preventScroll:true});},snapshot.field===i,watch,"dim-value");
  b.setAttribute("aria-label",text+": "+(snapshot.dim[i]||"blank"));grid.append(elt("span",text),b);
 });
 [["OK",2],["Cancel",3]].forEach(([text,i])=>actions.append(label(text,()=>{s={...s,field:i};physical("enter");},snapshot.field===i,watch)));
 modal.append(grid,actions);return modal;
}
function render(snapshot,watch){
 screen.dataset.lcd=snapshot.page;screen.replaceChildren();
 const text=elt("div",undefined,"calc-input");
 if(snapshot.page==="cells"){
  const C=Number(snapshot.dim[1]),rows=Array.from({length:Number(snapshot.dim[0])},(_,i)=>snapshot.cells.slice(i*C,(i+1)*C));
  if(snapshot.input==="a:=")text.append(elt("span","a :=","entry-prefix"));
  text.append(matrix(rows,{snapshot,interactive:!watch}));
  if(snapshot.cell===snapshot.cells.length)text.append(elt("i",undefined,"cursor"));
 }else{
  for(const entry of snapshot.history.slice(-2))screen.append(logLine(entry));
  text.append(expression(snapshot));
 }
 screen.append(text);
 if(snapshot.page==="menu"||snapshot.page==="dims")screen.append(controls(snapshot,watch));
 if(snapshot.error)screen.append(elt("div",snapshot.error.split(". ")[0].replace(/\.$/,""),"lcd-error"));
 if(!watch){
  const hints={
   calc:snapshot.A?"Type det(a) for the determinant or a raised to −1 for the inverse.":"Type a, then Ctrl + template. Open Menu → 7 → 1 → 1.",
   menu:"Choose Matrix & Vector → Create → Matrix.",dims:"Choose the number of rows and columns. Tab to OK, then Enter.",
   cells:"Type entries row by row. Tab moves to the next cell. Enter stores the matrix."
  };
  $("hint").textContent=hints[snapshot.page];
  const error=snapshot.error||request.error;$("error").textContent=error;$("error").hidden=!error;
 }
}
function same(A,B){return A&&B&&A.length===B.length&&A.every((row,i)=>row.length===B[i].length&&row.every((v,j)=>v===B[i][j]));}
function observe(old,now,key){
 const entry=now.history.at(-1);
 if(entry?.kind==="store"&&entry!==old.history.at(-1)){milestones=new Set();lastTarget=same(now.A,request.target);attemptKind="";}
 if(lastTarget&&entry!==old.history.at(-1)&&["det","inverse"].includes(entry?.kind))milestones.add(entry.kind);
 if(lastTarget&&["enter","select"].includes(key)&&now.error.startsWith("Singular matrix"))milestones.add("singular");
 if(lastTarget&&["enter","select"].includes(key)&&now.error.startsWith("Not a square matrix")){
  if(old.input==="det(a)")milestones.add("non-square-det");else if(old.input.startsWith("a^"))milestones.add("non-square-inverse");
 }
 if(entry?.kind==="store"&&entry!==old.history.at(-1)&&!lastTarget)attemptKind="That is a different matrix. Compare the rows with the Try matrix.";
 displayProgress();
}
function displayProgress(){
 const complete=milestones.has("det")&&(milestones.has("inverse")||milestones.has("singular"))||milestones.has("non-square-det")&&milestones.has("non-square-inverse");
 const p=$("progress");
 p.textContent=complete?"Complete. You used both operations and checked whether they were defined.":milestones.has("det")?"Determinant checked. Now try the inverse.":attemptKind;
 p.hidden=!p.textContent;
}
function physical(key){
 if(mode!=="try")return;
 clearTimeout(light);
 const keys=s.ctrl&&key==="templates"?["ctrl","templates"]:[key==="assign"?"templates":key];
 shell.setKeys(keys);light=setTimeout(()=>shell.setKeys([]),175);
 const old=s;s=M.press(s,key);observe(old,s,key);render(s,false);
}
$("target").append(matrix(request.target,{fixed:true}));
function taskMode(){ $("task").textContent="Enter this matrix as a. Find its determinant and inverse if they exist."; }
function resetProgress(){lastTarget=null;milestones=new Set();attemptKind="";displayProgress();colon=false;}
const tape=M.tape.map(x=>x[1]),frames=[M.start()];
for(const k of tape)frames.push(M.press(frames.at(-1),k));
function renderWatch(device,{beat,point,crossed,key}){
 if(handheld.parentElement!==device)device.append(handheld);
 const n=crossed.length,lit=n&&!point.speaking&&key?.beat===beat&&(point.fraction-key.at)*(point.span.end-point.span.voiceEnd)<.62;
 shell.setKeys(lit?(tape[n-1]==='templates'?['ctrl','templates']:[tape[n-1]]):[]);
 if(stamp===n)return;stamp=n;render(frames[n],true);
}
function enterTry(device,actions){
 mode="try";returnToWatch=actions.returnToWatch;device.prepend(stage);$("try-deck").prepend(handheld);stage.hidden=false;
 shell.setKeys([]);shell.setInteractive(true);colon=false;taskMode();render(s,false);stage.focus({preventScroll:true});
}
function exitTry(){
 mode="watch";stage.hidden=true;stamp=-1;clearTimeout(light);shell.setKeys([]);shell.setInteractive(false);
}
$("return").onclick=()=>returnToWatch?.();
$("reset").onclick=()=>{s=M.start();resetProgress();taskMode();render(s,false);stage.focus({preventScroll:true});};
document.addEventListener("keydown",e=>{
 if(e.defaultPrevented||e.target.closest?.(".top, .tabbar"))return;
 if(e.altKey||e.ctrlKey||e.metaKey||e.isComposing||e.target.closest("input,select,a,summary,textarea,[contenteditable]"))return;
 const b=e.target.closest("button");
 if(mode!=="try")return;
 if((!stage.contains(e.target)&&e.target!==document.body)||(b&&["Enter"," ","Tab"].includes(e.key)))return;
 if(e.key===":"){colon=true;e.preventDefault();return;}
 const map={m:"menu",M:"menu",Escape:"esc",Enter:"enter",ArrowDown:"down",ArrowUp:"up",ArrowLeft:"left",ArrowRight:"right",Backspace:"del",Delete:"del","-":"neg","^":"power","(":"lparen",")":"rparen","=":colon?"assign":""};
 let key=map[e.key]||(/^[adet0-9]$/i.test(e.key)?e.key.toLowerCase():"");
 colon=false;
 if(e.key==="Tab"&&["dims","cells"].includes(s.page)){
  if(s.page==="dims"&&(e.shiftKey&&s.field===0||!e.shiftKey&&s.field===3)||s.page==="cells"&&(e.shiftKey&&s.cell===0||!e.shiftKey&&s.cell===s.cells.length))return;
  key=e.shiftKey?"backtab":"tab";
 }
 if(key){e.preventDefault();if(e.target===document.body)stage.focus({preventScroll:true});physical(key);}
});
window.CalculatorLessonAdapter=Object.freeze({initialMode:params.get("mode")==="try"||request.linked?"try":"watch",renderWatch,enterTry,exitTry});
})();
