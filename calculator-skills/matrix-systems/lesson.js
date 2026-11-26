(function(){"use strict";
const M=window.CTMatrix,$=id=>document.getElementById(id),stage=$("stage"),screen=$("screen");
const params=new URLSearchParams(location.search),request=M.request(params);
let mode="watch",s=M.start(),light=0,stamp=-1,returnToWatch;
let colon=false,target=request.target,linkError=request.error;
const SYS=M.SYS;
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
function matrix(rows,{snapshot=null,interactive=false,fixed=false,toDisplay=v=>pretty(M.fmt(v)),stack=false}={}){
 const m=elt("span",undefined,"matrix");m.style.setProperty("--m-columns",rows[0].length);m.dataset.matrix=JSON.stringify(rows);
 rows.forEach((row,i)=>row.forEach((v,j)=>{
  const idx=i*row.length+j,active=snapshot?.cell===idx,symbol=v===""?" ":toDisplay(v);
  const a=interactive?label(symbol,()=>{s={...s,cell:idx};render(s,false);stage.focus({preventScroll:true});},active,false,"matrix-cell"):elt("span",symbol,"matrix-cell"+(active?" calc-active":""));
  if(snapshot){ a.classList.toggle("placeholder",v==="");a.setAttribute("aria-label","Row "+(i+1)+", column "+(j+1)+(v===""?", empty":": "+v)); a.dataset.cell=idx; }
  if(stack&&typeof v==="string"&&v.includes("/")){
   const [n,d]=v.split("/");a.classList.add("fraction");a.setAttribute("aria-label",pretty(n)+" over "+d);
   a.replaceChildren(elt("span",pretty(n),"numerator"),elt("span",d,"denominator"));
  }
  if(fixed)a.classList.add("fixed");
  m.append(a);
 }));
 return m;
}
function notation(s,active=false){
 const n=elt("span"),m=/^(.*?)\^(-?[0-9]*)(.*)$/.exec(s.input);
 if(m){n.append(elt("span",m[1]));const e=elt("sup",pretty(m[2]),"exponent");
  if(active&&s.sup)e.append(elt("i",undefined,"cursor"));
  n.append(e,elt("span",m[3].replaceAll("×"," × ")));
 }else n.append(elt("span",s.input.replace(":="," := ").replaceAll("×"," × ")));
 if(active&&s.ctrl)n.append(elt("small","ctrl","ctrl-on"));
 else if(active&&!s.sup)n.append(elt("i",undefined,"cursor"));
 if(active&&s.input.startsWith("rref(")&&!s.input.endsWith(")")) n.append(elt("span",")","auto-close"));
 return n;
}
function logLine(entry,last){
 const row=elt("div",undefined,"log-line"+(last?" latest-log":"")+(entry.result[0].length>1?" wide-log":""));row.dataset.kind=entry.kind;
 const op=notation({input:entry.name});op.className="log-operation";row.append(op);
 const v=matrix(entry.result,{stack:entry.kind==="inverse"||entry.kind==="rref",...(entry.kind==="power"?{toDisplay:v=>pretty(Number(v.toPrecision(6)))}:{})});v.classList.add("log-value");row.append(v);return row;
}
function controls(snapshot,watch){
 const modal=elt("div",undefined,"lcd-modal");
 if(snapshot.page==="menu"){
  const names=["Calculator menu","Matrix & Vector","Create"];
  modal.setAttribute("aria-label",names[snapshot.menu]);modal.append(elt("strong",names[snapshot.menu],"menu-title"));
  const entries=M.menus[snapshot.menu],offset=snapshot.menu===0&&snapshot.field>=5?4:0;
  const indices=snapshot.menu===0?(offset?[4,5,6,7,8]:[0,1,2,3,4,6]):snapshot.menu===1?(snapshot.field===5?[1,2,3,4,5]:[0,1,2,3,4]):snapshot.field>=4?[2,3,4,5]:[0,1,2,3];
  for(const i of indices){
   const [id,name]=entries[i],essential=snapshot.menu===1&&id===5;
   modal.append(label(id+": "+name+((id===7&&snapshot.menu===0||id===1&&snapshot.menu===1)?" ▸":""),()=>physical(String(id)),i===snapshot.field,watch,"menu-item"+(essential?" essential":"")));
  }
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
function resetAnswer(){
 $("classification").value="";$("guess-x").value="";$("guess-y").value="";$("answer-feedback").textContent="";
 $("answer").hidden=true;setAnswerFields();
}
function setAnswerFields(){$("answer").querySelector(".answer-fields").hidden=SYS&&$("classification").value!=="unique";}
$("classification").onchange=()=>{setAnswerFields();$("answer-feedback").textContent="";};
$("status-field").hidden=!SYS;
$("answer-x").textContent=SYS?"x (exact)":"P(Ready), 3 decimal places";
$("answer-y").textContent=SYS?"y (exact)":"Steady-state P(Ready), exact";
$("answer").onsubmit=e=>{
 e.preventDefault();if(!M.matches(s.history.at(-1),target))return;
 const feedback=M.grade(target,$("classification").value,$("guess-x").value,$("guess-y").value);
 $("answer-feedback").textContent=feedback;$("answer-feedback").classList.toggle("bad",!feedback.startsWith("Correct."));
};
function render(snapshot,watch){
 stage.dataset.lcd=snapshot.page;screen.replaceChildren();
 const input=elt("div",undefined,"calc-input");
 if(snapshot.page==="cells"){
  const C=Number(snapshot.dim[1]),rows=Array.from({length:Number(snapshot.dim[0])},(_,i)=>snapshot.cells.slice(i*C,(i+1)*C));
  if(snapshot.input.endsWith(":="))input.append(elt("span",snapshot.input.replace(":="," :="),"entry-prefix"));
  input.append(matrix(rows,{snapshot,interactive:!watch}));
  if(snapshot.cell===snapshot.cells.length)input.append(elt("i",undefined,"cursor"));
 }else{
  const history=snapshot.history.slice(-2);
  history.forEach((entry,i)=>screen.append(logLine(entry,i===history.length-1)));
  input.append(notation(snapshot,true));
 }
 screen.append(input);
 if(snapshot.page==="menu"||snapshot.page==="dims")screen.append(controls(snapshot,watch));
 if(snapshot.error)screen.append(elt("div",snapshot.error.split(". ")[0].replace(/\.$/,""),"lcd-error"));
 if(watch)return;
 const newest=snapshot.history.at(-1);
 const h=SYS?
  (target.matrix[0][0]*target.matrix[1][1]===target.matrix[0][1]*target.matrix[1][0]?
  "Use a 2×3 matrix m: x-coefficients, y-coefficients, then right-hand sides. Select Menu → 7 → 5 and enter m.":!snapshot.vars.a?
  "Store the coefficient matrix as a. Use Ctrl + template, then Menu → 7 → 1 → 1.":
  !snapshot.vars.b?"Store the right-hand sides as a 2×1 column called b.":"Enter a ^ (−) 1, →, × b, Enter. Match each result to the variable order."):
  !snapshot.vars.t?"Store t using the 2×2 template. The two entries in each starting-state column must sum to 1.":
  !snapshot.vars.s?"Store s using the 2×1 template. Ready goes above In use.":"Enter t ^ n, then →, × s, Enter. Replace n with the number of transitions requested.";
 const hints={calc:h,menu:SYS?"Build a matrix via Create, or use Reduced Row-Echelon Form for m.":"Choose Matrix & Vector → Create → Matrix.",dims:"Set the number of rows and columns. Tab to OK, then Enter.",cells:"Enter the entries row by row. Tab to move between cells and Enter to finish."};
 $("hint").textContent=hints[snapshot.page];
 const error=snapshot.error||linkError||"";$("error").textContent=error;$("error").hidden=!error;
 const result=["prediction","inverse","rref"].includes(newest?.kind)&&!snapshot.error,matching=result&&M.matches(newest,target);
 $("progress").textContent=result?(matching?"Read the output, then check your interpretation.":"The result used different inputs or a different number of transitions from the exercise."): "";
 $("progress").hidden=!$("progress").textContent;
 $("answer").hidden=!matching;
}
function physical(key){
 if(mode!=="try")return;
 clearTimeout(light);
 const keys=s.ctrl&&key==="templates"?["ctrl","templates"]:[key==="assign"?"templates":key];
 shell.setKeys(keys);light=setTimeout(()=>shell.setKeys([]),175);
 const old=s.history.at(-1);s=M.press(s,key);
 if(s.history.at(-1)!==old&&M.matches(s.history.at(-1),target)&&!M.matches(old,target))resetAnswer();
 render(s,false);
}
const fieldLabels=SYS?{matrix:"Coefficients: a,b;c,d",rhs:"Right-hand sides: e,f"}:{transition:"Transition matrix: a,b;c,d",state:"Start column: p,q",steps:"Transitions: 1–30"};
M.taskKeys.forEach(k=>{
 const label=elt("label",fieldLabels[k]),input=elt("input");input.type="text";input.name=k;input.maxLength=64;input.required=true;input.autocomplete="off";
 label.append(input);$("edit-values").append(label);
});
$("edit-copy").textContent=SYS?"Use two integer rows, separated by a semicolon. Use (x, y) coefficient order. Applying clears only your practice calculator.":"Use positive transition probabilities, up to three decimal places, with each column summing to 1. Use Ready, In use order; applying clears only your practice calculator.";
function targetDraw(){
 const [a,b]=M.taskKeys,A=target[a],B=target[b],wrap=$("target-wrap");
 wrap.replaceChildren(elt("span",SYS?"A =":"T ="),matrix(A,{fixed:true}),elt("span",SYS?"b =":"s₀ ="),matrix(B.map(v=>[v]),{fixed:true}));
 if(!SYS)wrap.append(elt("span","n = "+target.steps));
 const data=M.encode(target);M.taskKeys.forEach(k=>{$("edit-form").elements.namedItem(k).value=data[k];});
 $("edit-error").hidden=true;
}
targetDraw();resetAnswer();
function taskMode(){$("task").textContent="Use rows in x, y order. Decide how many solutions there are; if unique, find x and y exactly.";}
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
$("reset").onclick=()=>{s=M.start();colon=false;resetAnswer();taskMode();render(s,false);stage.focus({preventScroll:true});};
$("edit-form").onsubmit=e=>{
 e.preventDefault();
 const msg=$("edit-error");
 try{
  target=M.parse(Object.fromEntries(new FormData(e.currentTarget)));linkError="";s=M.start();colon=false;resetAnswer();
  targetDraw();render(s,false);msg.hidden=true;$("edit").open=false;stage.focus({preventScroll:true});
 }catch(error){msg.textContent=error.message;msg.hidden=false;}
};
document.addEventListener("keydown",e=>{
 if(e.defaultPrevented||e.target.closest?.(".top, .tabbar"))return;
 if(e.altKey||e.ctrlKey||e.metaKey||e.isComposing||e.target.closest("input,select,a,summary,textarea,[contenteditable]"))return;
 const b=e.target.closest("button");
 if(mode!=="try")return;
 if((!stage.contains(e.target)&&e.target!==document.body)||(b&&["Enter"," ","Tab"].includes(e.key)))return;
 if(e.key===":"){colon=true;e.preventDefault();return;}
 const map={M:"menu",Escape:"esc",Enter:"enter",ArrowDown:"down",ArrowUp:"up",ArrowLeft:"left",ArrowRight:"right",Backspace:"del",Delete:"del","-":"neg","×":"mul","*":"mul","^":"power",".":"dot",")":"rparen","=":colon?"assign":""};
 let key=e.shiftKey&&e.key.toLowerCase()==="m"?"menu":map[e.key]||(/^[abmst0-9]$/i.test(e.key)?e.key.toLowerCase():"");
 colon=false;
 if(e.key==="Tab"&&["dims","cells"].includes(s.page)){
  if(s.page==="dims"&&(e.shiftKey&&s.field===0||!e.shiftKey&&s.field===3)||s.page==="cells"&&(e.shiftKey&&s.cell===0||!e.shiftKey&&s.cell===s.cells.length))return;
  key=e.shiftKey?"backtab":"tab";
 }
 if(key){e.preventDefault();if(e.target===document.body)stage.focus({preventScroll:true});physical(key);}
});
window.CalculatorLessonAdapter=Object.freeze({initialMode:params.get("mode")==="try"||request.linked?"try":"watch",renderWatch,enterTry,exitTry});
})();
