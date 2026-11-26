(function(){"use strict";
const C=window.StatsLesson,$=id=>document.getElementById(id),stage=$("stage");
function num(value){
 const s=String(value??"").trim().replace(/−/g,"-");
 if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(s))return null;
 const v=Number(s);return Number.isFinite(v)&&Math.abs(v)<=1e9?v:null;
}
const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
function parse(entry,val){return entry[2]?entry[2].some(([x])=>x===val)?val:null:entry[0]==="matrix"?(WalkMatrix.entries(val)?WalkMatrix.entries(val).map(r=>r.join(",")).join(";"):null):num(val);}
const params=new URLSearchParams(location.search);
function readProblem(fromURL=false){
 const d={...C.assigned};let any=false;
 if(fromURL&&C.input.some(([k])=>params.has(k))&&C.input.some(([k])=>params.getAll(k).length!==1)){
  return {d,error:"Linked cases need all "+C.input.map(([k])=>k).join(", ")+" exactly once.",any:true};
 }
 for(const input of C.input){
  const k=input[0];if(fromURL&&!params.has(k))continue;
  const val=fromURL?params.getAll(k):[$("input-"+k).value];any=true;
  const entered=val.length===1?parse(input,val[0]):null;
  if(entered===null)return {d:C.assigned,error:"One or more example inputs are invalid.",any};
  d[k]=entered;
 }
 return {d,error:C.validate(d),any};
}
const linked=C.input.some(([k])=>params.has(k));
const request=params.get("mode")==="try"||linked?readProblem(true):{d:C.assigned,any:false,error:""};
const original=request.error?C.assigned:request.d;
let mode="watch",stamp=-1,light=0,returnToWatch,problem=original,warning=request.error?"Could not load that linked question. The original Try example is shown. "+request.error:"";
const handheld=$("handheld-host");
const shell=CalculatorLessonHandset.mount(handheld,{screen:$("lcd"),interactive:false,label:"TI-Nspire CX II-T Calculator",onKey:k=>physical(k)});
const initial=d=>WalkMatrix.start(d);let state=initial(problem);
$("lcd-app").textContent=C.app;
$("keys-help").textContent="Menu → 7 → 1 → 1. Set both dimensions to 3. Enter row by row with Tab. Ctrl + Var stores the matrix.";
function inputs(spec,host,prefix,blank=false){
 for(const [k,text,opts] of spec){
  const lab=node("label",text),el=node(opts?"select":"input");lab.htmlFor=el.id=prefix+k;
  if(opts){if(blank){const start=node("option","Choose");start.value="";el.append(start);}opts.forEach(([v,n])=>{const o=node("option",n);o.value=v;el.append(o);});}
  else{el.autocomplete="off";el.spellcheck=false;el.inputMode=k==="matrix"?"text":"numeric";}
  host.append(lab,el);
 }
}
inputs(C.input,$("data-fields"),"input-");inputs(C.answers,$("answer-fields"),"answer-",true);
function fillInputs(){for(const [k] of C.input)$("input-"+k).value=Array.isArray(problem[k])?problem[k].join(", "):problem[k];}
fillInputs();
const press=WalkMatrix.press;
const btn=(text,active,click)=>{const b=node("button",text,active?"calc-active":"");b.type="button";if(click)b.addEventListener("click",click);else b.disabled=true;return b;};
const expText=raw=>raw.replace(":="," :=").replace("^2","²").replace("^3","³").replace("^4","⁴").replace("^5","⁵").replace("^6","⁶");
function matrixView(data,s,watch){
 const m=node("div",undefined,"walk-matrix"+(s?"":" walk-output")+(data.flat().some(x=>String(x).length>4)?" wide-digits":""));
 for(const [i,value] of data.flat().entries()){
  if(s){
   const b=btn(String(value||" "),s.cell===i,watch?null:()=>{state={...state,cell:i};paintTry();stage.focus({preventScroll:true});});
   b.setAttribute("aria-label","Row "+(Math.floor(i/3)+1)+", column "+(i%3+1)+": "+(value||"empty"));m.append(b);
  }else m.append(node("span",String(value)));
 }
 return m;
}
function renderLCD(s,watch){
 const d=$("lcd-body");d.replaceChildren();let desc="Calculator ready.";
 if(s.page==="menu"){
  const wrap=node("ul",undefined,"menu-list"),entries=WalkMatrix.menus[s.menu];
  const indices=s.menu===0?(s.field>=5?[3,4,5,6,7]:[0,1,2,3,4,6]):entries.map((_,i)=>i);
  for(const i of indices){const [number,label]=entries[i],li=node("li");li.append(btn(number+": "+label,s.field===i,watch?null:()=>physical(String(number))));wrap.append(li);}
  d.append(wrap);desc=entries.map(([i,n])=>i+": "+n).join("; ");
 }else if(s.page==="dims"){
  const wiz=node("div",undefined,"wizard"),g=node("fieldset"),acts=node("div",undefined,"actions");
  wiz.append(node("strong","Create a Matrix"));
  ["Number of rows","Number of columns"].forEach((label,i)=>{
   const b=btn(s.dim[i]||" ",s.field===i,watch?null:()=>{state={...state,field:i};paintTry();stage.focus({preventScroll:true});});
   b.setAttribute("aria-label",label+": "+s.dim[i]);g.append(node("span",label),b);
  });
  ["OK","Cancel"].forEach((label,i)=>acts.append(btn(label,s.field===i+2,watch?null:()=>{state={...state,field:i+2};physical("enter");})));
  wiz.append(g,acts);d.append(wiz);desc="Create a Matrix; Number of rows: "+s.dim[0]+"; Number of columns: "+s.dim[1]+".";
 }else if(s.page==="cells"||s.page==="store"){
  const work=node("div",undefined,"matrix-work");
  const vals=[0,1,2].map(i=>s.cells.slice(3*i,3*i+3));work.append(matrixView(vals,s.page==="cells"?s:null,watch));
  if(s.page==="store")work.append(node("strong","→ "+s.raw+"▏"));else if(s.cell===9)work.append(node("strong","▏"));
  d.append(work);
  desc="Matrix entry: "+s.cells.map(v=>v||"blank").join(", ")+(s.page==="store"?"; Store to "+(s.raw||"blank"):s.cell===9?"; Cursor after matrix.":"; row "+(Math.floor(s.cell/3)+1)+", column "+(s.cell%3+1));
 }else{
  if(s.history.length){
   const h=s.history.at(-1),work=node("div",undefined,"matrix-work");work.append(node("strong",expText(h.op)),matrixView(h.matrix,null,watch));d.append(work);
   desc=h.op+" = "+h.matrix.map(r=>r.join(", ")).join("; ");
  }
  d.append(node("p",expText(s.raw)+(s.ctrl?" · ctrl":"")+"▏","matrix-entry"));
  if(s.raw)desc+="; Entry: "+s.raw;
 }
 $("lcd-text").textContent=desc;stage.dataset.scene=s.result&&!s.raw&&s.page==="calc"?"result":s.page;
}
function displayGiven(d,hidden){
 const host=$("given-list");host.hidden=hidden;if(hidden)return;
 const v=WalkMatrix.entries(d.matrix),t=node("table",undefined,"adjacency-source");
 t.append(node("caption","Directed arrow counts (row → column)"));
 const th=t.createTHead().insertRow();th.append(node("th","From / to"));
 for(const label of WalkMatrix.labels){const c=node("th",label);c.scope="col";th.append(c);}
 const tb=t.createTBody();
 v.forEach((r,i)=>{const row=tb.insertRow(),h=node("th",WalkMatrix.labels[i]);h.scope="row";row.append(h,...r.map(v=>node("td",String(v))));});
 host.replaceChildren(t);
}
function status(id,text,bad=false){const e=$(id);e.textContent=text;e.dataset.error=String(bad);}
function paintTry(){
 renderLCD(state,false);$("try-context").textContent=C.task(problem);
 status("tool-status",state.error||warning,Boolean(state.error||warning));displayGiven(problem,false);
}
function update(next){state=next;warning="";status("assess-feedback","");paintTry();}
function physical(k){
 if(mode!=="try")return;
 if(document.activeElement!==stage)stage.focus({preventScroll:true});
 clearTimeout(light);shell.setKeys(k==="var"&&state.ctrl?["ctrl","var"]:[k]);light=setTimeout(()=>shell.setKeys([]),160);update(press(state,k));
}
$("data-form").addEventListener("submit",e=>{
 e.preventDefault();const draft=readProblem();
 if(draft.error){status("tool-status",draft.error,true);return;}
 problem=draft.d;$("answer").reset();update(initial(problem));$("edit-details").open=false;stage.focus({preventScroll:true});
});
function match(given,expected){
 const x=num(given);if(x===null||!Number.isFinite(expected))return false;
 return x===expected||Array.from({length:10},(_,i)=>i+3).some(n=>x===Number(expected.toPrecision(n)))||Math.abs(x-expected)<=Math.abs(expected)*3e-8;
}
$("answer").addEventListener("submit",e=>{
 e.preventDefault();const a=Object.fromEntries(C.answers.map(([k])=>[k,$("answer-"+k).value]));
 const msg=!state.result||state.raw||state.page!=="calc"?"Run the handheld calculation before checking.":C.grade(problem,state,a,match);
 status("assess-feedback",msg||C.success,Boolean(msg));
});
$("answer").addEventListener("input",()=>status("assess-feedback",""));
const physicalLabel={Menu:"menu",Tab:"tab",Enter:"enter",Ctrl:"ctrl",Var:"var","^":"power"};
const frames=[initial(C.demo)];let previousAction=-1;
function renderWatch(device,{beat,chapter,point,crossed,key}){
 if(handheld.parentElement!==device)device.append(handheld);
 for(let i=frames.length-1;i<crossed.length;i++){
   const k=physicalLabel[crossed[i].label]||crossed[i].label;
   frames.push(press(frames[i],k));
 }
 const n=crossed.length,k=key&&(physicalLabel[key.label]||key.label);
 const lit=n&&!point.speaking&&key?.beat===beat&&(point.fraction-key.at)*(point.span.end-point.span.voiceEnd)<.62;
 shell.setKeys(lit?(k==="var"&&frames[n-1].ctrl?["ctrl","var"]:[k]):[]);
 const stamp=n+"-"+chapter;
 if(previousAction===stamp)return;
 previousAction=stamp;renderLCD(frames[n],true);
 const cells=$("lcd-body").querySelectorAll(".walk-output span");
 if(chapter==="read-walks"){
   cells[2]?.classList.add("walk-focus");cells[6]?.classList.add("walk-reverse");
 }else if(chapter==="repeated-vertices")cells[2]?.classList.add("walk-focus");
}
function enterTry(device,actions){
 mode="try";returnToWatch=actions.returnToWatch;device.prepend(stage);$("try-deck").prepend(handheld);stage.hidden=false;
 shell.setKeys([]);shell.setInteractive(true);paintTry();stage.focus({preventScroll:true});
}
function exitTry(){
 mode="watch";stage.hidden=true;previousAction=-1;clearTimeout(light);shell.setKeys([]);shell.setInteractive(false);
}
$("return").onclick=()=>returnToWatch?.();
$("reset").onclick=()=>{
 problem=original;state=initial(problem);warning="";fillInputs();$("answer").reset();$("edit-details").open=false;
 status("assess-feedback","");paintTry();stage.focus({preventScroll:true});
};
document.addEventListener("keydown",e=>{
 if(e.target!==document.body&&!e.target.closest?.(".qb-calculator-lesson"))return;
 const el=e.target;if(e.altKey||e.metaKey||e.ctrlKey&&e.key!=="Control"||el.closest("input,textarea,select,a,summary,[contenteditable]"))return;
 if(mode!=="try"||e.defaultPrevented||e.target.closest?.(".top, .tabbar"))return;
 if((!stage.contains(el)&&el!==document.body)||(el.closest("button")&&["Enter"," "].includes(e.key)))return;
 
 if(e.key==="Tab"&&el===stage&&["dims","cells"].includes(state.page)){e.preventDefault();physical(e.shiftKey?"shift-tab":"tab");return;}
 const keys={m:"menu",M:"menu",a:"a",A:"a",Control:"ctrl",v:"var",V:"var",Escape:"esc",Enter:"enter",Backspace:"del",Delete:"del",ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down","^":"power"};
 const k=keys[e.key]||(/^[0-9]$/.test(e.key)?e.key:"");if(k){
  e.preventDefault();
  // A direct Try URL initially has the body focused. The first calculator
  // shortcut opts into the stage so the upcoming wizard Tab selects a field.
  if(el===document.body)stage.focus({preventScroll:true});
  physical(k);
 }
});
window.CalculatorLessonAdapter=Object.freeze({initialMode:params.get("mode")==="try"||linked?"try":"watch",renderWatch,enterTry,exitTry});
})();
