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
const request=params.get("mode")==="try"?readProblem(true):{d:C.assigned,any:false,error:""};
const original=request.error?C.assigned:request.d;
const handheld=$("handheld-host");
const shell=CalculatorLessonHandset.mount(handheld,{screen:$("lcd"),interactive:false,label:"TI-Nspire CX II-T "+C.app+" trainer",onKey:k=>physical(k)});
let mode="watch",problem=original,light=0,stamped=-1,returnToWatch,warning=request.error?"Could not load that linked question. The original Try example is shown. "+request.error:"";
const initial=d=>({page:"idle",raw:"",cursor:0,history:[],result:null,data:d,error:""});
let state=initial(problem);
$("lcd-app").textContent=C.app;
$("keys-help").textContent="Type y + h × (slope). Use ( ) and × for multiplication. Enter records each update; never reuse an old slope.";
function inputs(spec,host,prefix,blank=false){
 for(const [k,text,opts] of spec){
  const lab=node("label",text),el=node(opts?"select":"input");lab.htmlFor=el.id=prefix+k;
  if(opts){if(blank){const start=node("option","Choose");start.value="";el.append(start);}opts.forEach(([v,n])=>{const o=node("option",n);o.value=v;el.append(o);});}
  else{el.autocomplete="off";el.spellcheck=false;el.inputMode=["list","lower","upper"].includes(k)?"text":"decimal";}
  host.append(lab,el);
 }
}
inputs(C.input,$("data-fields"),"input-");inputs(C.answers,$("answer-fields"),"answer-",true);
function fillInputs(){for(const [k] of C.input)$("input-"+k).value=Array.isArray(problem[k])?problem[k].join(", "):problem[k];}
fillInputs();
const chars={"lparen":"(","rparen":")","dot":".","minus":"-","neg":"-","plus":"+","mul":"*","div":"/"};
function press(base,key){
 const s=clone(base);s.error="";
 if(key==="esc"){s.raw="";s.cursor=0;s.page=s.result?"result":"idle";return s;}
 if(key==="left"||key==="right"){s.cursor=Math.max(0,Math.min(s.raw.length,s.cursor+(key==="left"?-1:1)));return s;}
 if(key==="del"){if(s.cursor>0){s.raw=s.raw.slice(0,s.cursor-1)+s.raw.slice(s.cursor);s.cursor--;}s.page=s.raw?"entry":s.result?"result":"idle";return s;}
 if(key==="enter"){
  try{const r={...EulerTrainer.calculate(s.raw),text:s.raw};s.history=[...s.history,r].slice(-32);s.result=r;s.raw="";s.cursor=0;s.page="result";}
  catch(e){s.error=e.message;}
  return s;
 }
 if(key==="menu"){s.error="This lesson uses direct arithmetic on an open Calculator page. No menu is needed.";return s;}
 const ch=chars[key]||(/^[0-9]$/.test(key)?key:"");
 if(ch&&s.raw.length<104){s.raw=s.raw.slice(0,s.cursor)+ch+s.raw.slice(s.cursor);s.cursor++;s.page="entry";}
 return s;
}
const pretty=x=>x.replace(/\*/g,"×").replace(/\//g,"÷").replace(/-/g,"−");
function renderLCD(s){
 const d=$("lcd-body");d.replaceChildren();
 const history=node("div",undefined,"arithmetic-history");
 s.history.slice(-2).forEach(r=>{const row=node("div",undefined,"arithmetic-row");row.append(node("p",pretty(r.text),"arithmetic-expr"),node("p",fmt(r.value),"arithmetic-result"));history.append(row);});
 const input=node("p",undefined,"arithmetic-in"),caret=node("span",undefined,"arithmetic-caret");caret.setAttribute("aria-hidden","true");
 input.append(document.createTextNode(pretty(s.raw.slice(0,s.cursor))),caret,document.createTextNode(pretty(s.raw.slice(s.cursor))));
 d.append(history,input);
 $("lcd-text").textContent=[...s.history.slice(-2).map(r=>pretty(r.text)+" equals "+fmt(r.value)),s.raw?"Entry: "+pretty(s.raw):"Calculator ready."].join("; ");

}
function status(id,text,bad=false){const e=$(id);e.textContent=text;e.dataset.error=String(bad);}
function paintTry(){
 renderLCD(state);
 $("try-context").textContent=C.task(problem);
 status("tool-status",state.error||warning,Boolean(state.error||warning));
}
function update(next){state=next;warning="";status("assess-feedback","");paintTry();}
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
 status("assess-feedback",msg||C.success,Boolean(msg));
});
$("answer").addEventListener("input",()=>status("assess-feedback",""));
const tape=C.keys.map(x=>x[1]),frames=[initial(C.demo)];
for(const k of tape)frames.push(press(frames.at(-1),k));
function renderWatch(device,{beat,point,crossed,key}){
 if(handheld.parentElement!==device)device.append(handheld);
 const n=crossed.length,lit=n&&!point.speaking&&key?.beat===beat&&(point.fraction-key.at)*(point.span.end-point.span.voiceEnd)<.62;
 shell.setKeys(lit?[tape[n-1]]:[]);
 if(stamped===n)return;stamped=n;renderLCD(frames[n]);
}
function enterTry(device,actions){
 mode="try";returnToWatch=actions.returnToWatch;device.prepend(stage);$("try-grid").prepend(handheld);stage.hidden=false;
 shell.setKeys([]);shell.setInteractive(true);paintTry();stage.focus({preventScroll:true});
}
function exitTry(){
 mode="watch";stage.hidden=true;stamped=-1;clearTimeout(light);shell.setKeys([]);shell.setInteractive(false);
}
$("return").onclick=()=>returnToWatch?.();
$("reset").onclick=()=>{
 problem=original;state=initial(problem);warning="";fillInputs();
 $("answer").reset();$("edit-details").open=false;status("assess-feedback","");paintTry();stage.focus({preventScroll:true});
};
document.addEventListener("keydown",e=>{
 if(e.target!==document.body&&!e.target.closest?.(".qb-calculator-lesson"))return;
 const el=e.target;if(e.altKey||e.metaKey||e.ctrlKey||el.closest("input,textarea,select,a,summary,[contenteditable]"))return;
 if(mode!=="try")return;
 if((!stage.contains(el)&&el!==document.body)||(el.closest("button")&&["Enter"," "].includes(e.key)))return;
 
 const keys={m:"menu",M:"menu",Escape:"esc",Enter:"enter",Backspace:"del",Delete:"del",ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down","-":"minus",".":"dot","+":"plus","*":"mul","/":"div","(":"lparen",")":"rparen"};
 const k=keys[e.key]||(/^[0-9]$/.test(e.key)?e.key:"");if(k){
  e.preventDefault();
  // A direct Try URL initially has the body focused. The first calculator
  // shortcut opts into the stage so the upcoming wizard Tab selects a field.
  if(el===document.body)stage.focus({preventScroll:true});
  physical(k);
 }
});
window.CalculatorLessonAdapter=Object.freeze({initialMode:params.get("mode")==="try"?"try":"watch",renderWatch,enterTry,exitTry});
})();
