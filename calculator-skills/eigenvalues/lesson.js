(function(){"use strict";
const C=window.StatsLesson,$=id=>document.getElementById(id),stage=$("stage");
function num(value){
 const s=String(value??"").trim().replace(/−/g,"-");
 if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(s))return null;
 const v=Number(s);return Number.isFinite(v)&&Math.abs(v)<=1e9?v:null;
}
const clone=x=>JSON.parse(JSON.stringify(x)), fmt=n=>String(Number(n.toPrecision(7))).replace(/-/g,"−");
const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
function parse(entry,val){return entry[2]?entry[2].some(([x])=>x===val)?val:null:num(val);}
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
let mode="watch",light=0,returnToWatch,problem=original,warning=request.error?"Could not load that linked question. The original Try example is shown. "+request.error:"";
const handheld=$("handheld-host");
const shell=CalculatorLessonHandset.mount(handheld,{screen:$("lcd"),interactive:false,label:"TI-Nspire CX II-T Calculator",onKey:k=>physical(k)});
const initial=d=>({page:"idle",raw:"",cursor:0,ctrl:false,history:[],result:null,assessment:null,data:d,fromWatch:false,error:""});
let state=initial(problem);
$("lcd-app").textContent=C.app;
$("keys-help").textContent="Use Calculator arithmetic. Ctrl + x² opens a square root; Right exits the radical.";
function inputs(spec,host,prefix,blank=false){
 for(const [k,text,opts] of spec){
  const lab=node("label",text),el=node(opts?"select":"input");lab.htmlFor=el.id=prefix+k;
  if(opts){if(blank){const start=node("option","Choose");start.value="";el.append(start);}opts.forEach(([v,n])=>{const o=node("option",n);o.value=v;el.append(o);});}
  else{el.autocomplete="off";el.spellcheck=false;el.inputMode=["low","high","lowv","highv"].includes(k)?"text":"decimal";}
  host.append(lab,el);
 }
}
inputs(C.input,$("data-fields"),"input-");inputs(C.answers,$("answer-fields"),"answer-",true);
function fillInputs(){for(const [k] of C.input)$("input-"+k).value=Array.isArray(problem[k])?problem[k].join(", "):problem[k];}
fillInputs();
const chars={"lparen":"(","rparen":")","dot":".","minus":"-","neg":"-","plus":"+","mul":"*","div":"/","power":"^"};
function openSlot(raw){
 const stack=[];
 for(let i=0;i<raw.length;i++){
  if(raw.startsWith("sqrt(",i)){stack.push("sqrt");i+=4;}
  else if(raw[i]==="(")stack.push("group");else if(raw[i]===")")stack.pop();
 }
 return stack.at(-1);
}
function press(base,key){
 const s=clone(base);s.error="";
 const insert=text=>{if(s.raw.length+text.length<=104){s.raw=s.raw.slice(0,s.cursor)+text+s.raw.slice(s.cursor);s.cursor+=text.length;s.page="entry";}};
 if(key==="ctrl"){s.ctrl=!s.ctrl;return s;}
 if(s.ctrl){
  s.ctrl=false;
  if(key==="square"){insert("sqrt(");return s;}
 }
 if(key==="esc"){s.raw="";s.cursor=0;s.page=s.result?"result":"idle";return s;}
 if(key==="left"||key==="right"){
  if(key==="right"&&s.cursor===s.raw.length&&openSlot(s.raw)==="sqrt"){insert(")");return s;}
  const next=Math.max(0,Math.min(s.raw.length,s.cursor+(key==="left"?-1:1)));
  // The radical token is one template rather than four individually editable letters.
  const start=s.raw.lastIndexOf("sqrt(",next);
  s.cursor=start>=0&&next>start&&next<start+5?(key==="left"?start:start+5):next;return s;
 }
 if(key==="del"){
  const n=s.raw.slice(0,s.cursor).endsWith("sqrt(")?5:1;
  if(s.cursor>0){s.raw=s.raw.slice(0,Math.max(0,s.cursor-n))+s.raw.slice(s.cursor);s.cursor=Math.max(0,s.cursor-n);}
  s.page=s.raw?"entry":s.result?"result":"idle";return s;
 }
 if(key==="enter"||key==="select"){
  try{
   if(openSlot(s.raw)==="sqrt")throw Error("Use Right to leave the square-root box before pressing Enter.");
   const r={...EigenLessonMath.calc(s.raw),text:s.raw};s.history=[...s.history,r].slice(-32);s.result=r;s.raw="";s.cursor=0;s.page="result";
  }catch(e){s.error=e.message;}
  return s;
 }
 if(key==="menu"){s.error="This lesson uses direct arithmetic on a Calculator page, not an eigenvalue menu.";return s;}
 const ch=key==="square"?"^2":chars[key]||(/^[0-9]$/.test(key)?key:"");
 if(ch)insert(ch);
 return s;
}
const pretty=x=>x.replace(/sqrt/g,"√").replace(/\*/g,"×").replace(/\//g,"÷").replace(/-/g,"−").replace(/\^2/g,"²");
function renderLCD(s){
 const d=$("lcd-body");d.replaceChildren();
 const history=node("div",undefined,"arithmetic-history");
 s.history.slice(-2).forEach(r=>{const row=node("div",undefined,"arithmetic-row");row.append(node("p",pretty(r.text),"arithmetic-expr"),node("p",fmt(r.value),"arithmetic-result"));history.append(row);});
 const input=node("p",undefined,"arithmetic-in"),caret=node("span",undefined,"arithmetic-caret");caret.setAttribute("aria-hidden","true");
 input.append(document.createTextNode(pretty(s.raw.slice(0,s.cursor))),caret,document.createTextNode(pretty(s.raw.slice(s.cursor))+(s.ctrl?"  ctrl":"")));
 d.append(history,input);
 $("lcd-text").textContent=[...s.history.slice(-2).map(r=>pretty(r.text)+" equals "+fmt(r.value)),s.raw?"Entry: "+pretty(s.raw):"Calculator ready."].join("; ");
 stage.dataset.scene=s.page;
}
function shown(id,v){$(id).hidden=!v;}
function status(id,text,bad=false){const e=$(id);e.textContent=text;e.dataset.error=String(bad);}
function drawGiven(d){
 const host=$("given-list");host.replaceChildren();
 const children=[[d.a,d.b],[d.c,d.d]];
 const label=node("span","Given matrix A","matrix-label"),t=node("table",undefined,"given-matrix");
 t.setAttribute("aria-label","Given matrix A: first row "+children[0].join(", ")+", second row "+children[1].join(", "));
 for(const row of children){const tr=t.insertRow();for(const x of row)tr.append(node("td",String(x).replace("-","−")));}
 host.append(label,t);
}
function paintTry(){
 renderLCD(state);$("try-context").textContent=C.task(problem);
 status("tool-status",state.error||warning,Boolean(state.error||warning));drawGiven(problem);shown("given-list",true);
 status("assess-feedback",state.assessment?.text||"",Boolean(state.assessment?.wrong));
}
function update(next){state=next;warning="";paintTry();}
function assessment(text,wrong=false){
 state={...state,assessment:text?{text,wrong}:null};status("assess-feedback",text,wrong);
}
function physical(k){
 if(mode!=="try")return;
 if(document.activeElement!==stage)stage.focus({preventScroll:true});
 clearTimeout(light);shell.setKeys([k]);light=setTimeout(()=>shell.setKeys([]),160);update(press(state,k));
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
 const msg=!state.result||state.page!=="result"?"Run the handheld calculation before checking.":C.grade(problem,state,a,match);
 assessment(msg||C.success,Boolean(msg));
});
$("answer").addEventListener("input",()=>assessment(""));
const physicalLabel={"(−)":"neg","−":"minus","Ctrl":"ctrl","x²":"square","→":"right","×":"mul","÷":"div","+":"plus","(":"lparen",")":"rparen",".":"dot","Enter":"enter"};
const frames=[initial(C.demo)];let previousAction=-1;
function renderWatch(device,{beat,point,crossed,key}){
 if(handheld.parentElement!==device)device.append(handheld);
 for(let i=frames.length-1;i<crossed.length;i++){
   const k=physicalLabel[crossed[i].label]||crossed[i].label;
   frames.push(press(frames[i],k));
 }
 const n=crossed.length,k=key&&(physicalLabel[key.label]||key.label);
 const lit=n&&!point.speaking&&key?.beat===beat&&(point.fraction-key.at)*(point.span.end-point.span.voiceEnd)<.62;
 shell.setKeys(lit?(k==="square"&&frames[n-1].ctrl?["ctrl","square"]:[k]):[]);
 if(previousAction===n)return;
 previousAction=n;renderLCD(frames[n]);
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
 paintTry();stage.focus({preventScroll:true});
};
document.addEventListener("keydown",e=>{
 if(e.target!==document.body&&!e.target.closest?.(".qb-calculator-lesson"))return;
 const el=e.target;if(e.altKey||e.metaKey||e.ctrlKey&&e.key!=="Control"||el.closest("input,textarea,select,a,summary,[contenteditable]"))return;
 if(mode!=="try"||e.defaultPrevented||e.target.closest?.(".top, .tabbar"))return;
 if((!stage.contains(el)&&el!==document.body)||(el.closest("button")&&["Enter"," "].includes(e.key)))return;
 
 const keys={m:"menu",M:"menu",Escape:"esc",Enter:"enter",Backspace:"del",Delete:"del",ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down","-":"minus",".":"dot","+":"plus","*":"mul","/":"div","^":"power","(":"lparen",")":"rparen",s:"square",S:"square",Control:"ctrl"};
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
