"use strict";
(function(){
 const $=id=>document.getElementById(id),M=CT15Math,S=CT15Screen,T=CT15Tape,E=CT15Editor;
 const stage=$("stage"),lcd=$("lcd"),canvas=$("drawing"),hot=$("hotspots");
 const screen=S.screen(canvas),inputs=["f","c1","g","c2"].map($),exact=$("point-input"),feedback=$("feedback"),mark=$("mark-endpoints");
 const defaults=["x+1","-3<x<=0","x^2+2","0<x<=2"],params=new URLSearchParams(location.search);
 let linked=null,invalid=false;
 try{linked=M.typed(params);}catch{invalid=true;}
 const task=linked||{slots:defaults,model:M.make(defaults),x:0};
 const target=task.x===null?null:M.value(task.model,task.x);
 const pretty=(n)=>M.prettyX(n),show=(a,i)=>i%2?M.displayCond(a):M.displayExpr(a);
 let mode="watch",state=E.base(),edited=false,typedNote="",returnToWatch,stamp=-1,light=0;
 const handheld=$("handheld-host");
 const shell=CalculatorLessonHandset.mount(handheld,{screen:lcd,label:"TI-Nspire CX II-T Graphs",interactive:false,onKey:k=>{press(k);stage.focus({preventScroll:true});}});
 const hints={blank:"Open Math Templates or load the two rules.",templates:"Move right to the n-piece template in the top row and select it.",count:"Use two pieces and press Enter.",editor:"Enter each expression beside its condition. Use arrows, and Ctrl + = for inequality symbols. Press Enter to graph.",relation:"Use the arrows or tap the symbol. Enter inserts it.",plotted:"Check which rule owns an endpoint. Press Tab on the handheld to edit."};
 const sync=src=>inputs.forEach((f,i)=>f.value=show(src[i],i));
 const raw=()=>inputs.map(f=>f.value);
 function describe(s){
  const brief=s.page==="blank"?"Blank Graphs entry.":
   s.page==="templates"?"Math Templates. "+(s.selection===7?"n-piece piecewise function selected.":"Template "+(s.selection+1)+"."):
   s.page==="count"?"Create Piecewise Function. Number of pieces "+s.count+".":
   s.page==="relation"?"Inequality symbols. Selected "+E.opts[s.relation]+".":
   (s.page==="plotted"?"Piecewise graph plotted. ":"Piecewise entry. ")+
   "Expression one: "+(show(s.slots[0],0)||"blank")+". Condition one: "+(show(s.slots[1],1)||"blank")+". Expression two: "+(show(s.slots[2],2)||"blank")+". Condition two: "+(show(s.slots[3],3)||"blank")+".";
  $("lcd-text").textContent=brief+(s.page==="editor"?" Active: "+["expression one","condition one","expression two","condition two"][s.slot]+".":"")+(s.error?" "+s.error:"");
 }
 function button(label,x,y,w,h,action){
  const b=document.createElement("button");b.type="button";b.setAttribute("aria-label",label);
  Object.assign(b.style,{left:x/3.2+"%",top:y/2.4+"%",width:w/3.2+"%",height:h/2.4+"%"});
  b.addEventListener("click",e=>{e.stopPropagation();action();stage.focus({preventScroll:true});});hot.append(b);
 }
 const taskLine=task.model.map((p,i)=>"Rule "+(i+1)+": "+M.displayExpr(p.expr.raw)+" for "+M.displayCond(p.raw)+".").join(" ");
 $("challenge").textContent=task.x===null?taskLine:taskLine+" Find f("+pretty(task.x)+").";
 function inExercise(){
  if(task.x===null)return false;
  try{
   const cfg=M.make(raw());
   if(!M.sameModel(cfg,task.model))return false;
   if(state.model&&!M.sameModel(state.model,task.model))return false;
   if(state.slots.every(Boolean)&&!M.sameModel(M.make(state.slots),task.model))return false;
   return true;
  }catch{return false;}
 }
 function message(msg="",error=false){
  $("keypad-result").textContent=msg;$("keypad-result").hidden=!msg;
  $("keypad-result").className="feedback"+(error?"is-wrong":"is-right");
 }
 function freshTry(){
  if(mode!=="try")return;
  screen.draw(state,{marked:mark.checked});describe(state);hot.replaceChildren();
  const t=state.page,inTask=inExercise();
  $("exercise-active").hidden=!inTask;$("exercise-inactive").hidden=inTask;
  $("keypad-problem").textContent=inTask?"Assigned check: x = "+pretty(task.x)+".":"Edit or enter your own piecewise function.";
  $("keypad-hint").textContent=hints[t];
  $("point-form").hidden=t!=="plotted";$("marker-switch").hidden=t!=="plotted";
  $("probe-result").textContent=state.probe?state.probe.inside?
   "At x = "+pretty(state.probe.x)+", rule "+state.probe.branch+" gives f(x) = "+M.pretty(state.probe.y)+"."
   :"At x = "+pretty(state.probe.x)+", neither condition includes x. The function is undefined.":"";
  const warn=invalid&&!edited?"Invalid linked function or condition. Showing the set exercise.":"";
  message(state.error||warn||typedNote,Boolean(state.error||warn));
  if(t==="templates")button("n-piece piecewise function",270,72,36,30,()=>{state={...state,selection:7};press("enter");});
  if(t==="count")button("OK",206,121,58,21,()=>press("enter"));
  if(t==="editor")["Expression 1","Condition 1","Expression 2","Condition 2"].forEach((name,i)=>button(name,i%2?173:85,i>1?77:43,i%2?135:74,26,()=>{
   state=E.at(state,i);freshTry();
  }));
  if(t==="relation")E.opts.forEach((v,i)=>button("Insert "+v,78+i*27.5,158,26,26,()=>{
   state={...state,relation:i};press("enter");
  }));
 }
 function press(k){
  if(mode!=="try")return;
  clearTimeout(light);shell.setKeys(state.ctrl?["ctrl",k]:[k]);
  light=setTimeout(()=>shell.setKeys(state.ctrl?["ctrl"]:[]),175);
  edited=true;typedNote="";state=E.key(state,k);freshTry();
 }
 function inspect(x){
  if(state.page!=="plotted")return;
  if(x===null){state={...state,error:"Enter a decimal x-value between −20 and 20."};freshTry();return;}
  const v=M.value(state.model,x);
  state={...state,error:"",probe:v?{...v,inside:true}:{x,inside:false}};
  typedNote="";edited=true;freshTry();
 }
 $("point-form").addEventListener("submit",e=>{e.preventDefault();inspect(M.real(exact.value));});
 mark.addEventListener("change",freshTry);
 $("expression-form").addEventListener("submit",e=>{
  e.preventDefault();edited=true;
  try{
   const slots=raw();M.make(slots);
   state=E.load(state,slots);typedNote="Template loaded. Press Enter on the handheld to graph.";
  }catch(err){state={...state,error:err.message};typedNote="";}
  freshTry();stage.focus({preventScroll:true});
 });
 inputs.forEach(e=>e.addEventListener("input",()=>{edited=true;typedNote="";state={...state,error:""};feedback.textContent="";freshTry();}));
 $("reset-keypad").addEventListener("click",()=>{state=E.base();sync(task.slots);edited=true;typedNote="";exact.value="";feedback.textContent="";$("answer-y").value="";freshTry();stage.focus({preventScroll:true});});
 lcd.addEventListener("click",e=>{
  if(mode!=="try"||state.page!=="plotted")return;
  const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*320/r.width,y=(e.clientY-r.top)*240/r.height;
  if(x<S.X.l||x>S.X.r||y<S.Y.t||y>S.Y.b)return;
  const v=Number(S.fromPixel(M.windowFor(state.model),x).toFixed(2));
  if(Math.abs(v)>20)return;exact.value=String(v);inspect(v);
 });
 const frames=[E.base()];
 for(const [,k] of T.keys)frames.push(E.key(frames.at(-1),k));
 function renderWatch(device,{beat,point,crossed,key}){
  if(handheld.parentElement!==device)device.append(handheld);
  const n=crossed.length,k=n&&T.keys[n-1][1],lit=n&&!point.speaking&&key?.beat===beat&&(point.fraction-key.at)*(point.span.end-point.span.voiceEnd)<.62;
  shell.setKeys(lit?(frames[n-1].ctrl?["ctrl",k]:[k]):[]);
  if(stamp===n)return;stamp=n;const s=frames[n];
  screen.draw(s,{marked:s.page==="plotted"});describe(s);
 }
 function enterTry(device,actions){
  mode="try";returnToWatch=actions.returnToWatch;device.prepend(stage);$("try-deck").prepend(handheld);stage.hidden=false;
  shell.setKeys([]);shell.setInteractive(true);freshTry();stage.focus({preventScroll:true});
 }
 function exitTry(){
  mode="watch";stage.hidden=true;stamp=-1;clearTimeout(light);hot.replaceChildren();shell.setKeys([]);shell.setInteractive(false);
 }
 $("return-watch").onclick=()=>returnToWatch?.();
 document.addEventListener("keydown",e=>{if(e.target!==document.body&&!e.target.closest?.(".qb-calculator-lesson"))return;
  if(e.target.closest("input,textarea,select,a,summary,[contenteditable]")||e.altKey)return;
  if(mode==="try"&&(e.ctrlKey||e.metaKey)&&e.key==="="){e.preventDefault();press("relation");return;}
  if(e.ctrlKey||e.metaKey)return;
  const tag=e.target.closest("button");
  if(mode!=="try"||e.defaultPrevented||e.target.closest?.(".top, .tabbar"))return;
  if(!stage.contains(e.target)&&e.target!==document.body||tag&&(e.key==="Enter"||e.key===" "))return;
  if(e.key==="Tab"){
   if(e.target===stage&&(state.page==="plotted"||state.page==="editor"&&(e.shiftKey?state.slot>0:state.slot<3))){e.preventDefault();press(e.shiftKey?"shift-tab":"tab");}
   return;
  }
  const map={Escape:"esc",Enter:"enter",Backspace:"del",Delete:"del",ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down",t:"templates",T:"templates",".":"dot","^":"power","+":"plus","-":"minus","*":"mul","/":"div","(":"lparen",")":"rparen","²":"square","=":"eq","<":"lt",">":"gt","≤":"le","≥":"ge"};
  const k=map[e.key]||(/^[0-9xX]$/.test(e.key)?e.key.toLowerCase():"");
  if(k){e.preventDefault();press(k);}
 });
 $("answer-y").addEventListener("input",()=>{edited=true;feedback.textContent="";});
 $("answer-form").addEventListener("submit",e=>{
  e.preventDefault();if(mode!=="try"||!inExercise())return;edited=true;
  const a=$("answer-y").value.trim().replace("−","-"),num=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(a)?Number(a):NaN;
  const accept=target?Number.isFinite(num)&&[target.y,Number(target.y.toPrecision(7)),Number(target.y.toPrecision(3))].some(x=>Math.abs(x-num)<=Math.abs(x)*1e-10):/^(undefined|undef|no value)$/i.test(a);
  feedback.className="feedback"+(accept?"is-right":"is-wrong");
  feedback.textContent=accept?"Correct. The condition tells you which expression, if any, applies.":"Check which condition includes this x before choosing an expression.";
 });
 sync(task.slots);
 window.CalculatorLessonAdapter=Object.freeze({initialMode:params.get("mode")==="try"||(linked||invalid)&&params.get("mode")!=="watch"?"try":"watch",renderWatch,enterTry,exitTry});
})();
