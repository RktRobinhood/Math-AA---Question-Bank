"use strict";
(function(){
 function lessonEnd(){return (window.visualViewport?.height||innerHeight)-(document.querySelector("body > .tabbar")?.offsetHeight||0);}
const $=id=>document.getElementById(id),M=CT15Math,S=CT15Screen,T=CT15Tape,E=CT15Editor;
 const stage=$("stage"),play=$("play"),seek=$("seek"),overlay=$("stage-play"),lcd=$("lcd"),canvas=$("drawing"),hot=$("hotspots"),steps=$("steps");
 const screen=S.screen(canvas),inputs=["f","c1","g","c2"].map($),exact=$("point-input"),feedback=$("feedback"),mark=$("mark-endpoints");
 const defaults=["x+1","-3<x<=0","x^2+2","0<x<=2"],params=new URLSearchParams(location.search);
 let linked=null,invalid=false;
 try{linked=M.typed(params);}catch{invalid=true;}
 const task=linked||{slots:defaults,model:M.make(defaults),x:0};
 const target=task.x===null?null:M.value(task.model,task.x),fixed=Boolean(linked)||params.get("case")==="piecewise-demo";
 const pretty=(n)=>M.prettyX(n),show=(a,i)=>i%2?M.displayCond(a):M.displayExpr(a);
 let mode="watch",state=E.base(),practiceState=state,forkState=null,track="practice",edited=false,focused=false,hasStarted=false,focusChecked=false;
 let time=0,origin=0,frame=0,playing=false,cache="",typedNote="";
 const shell=HandheldShell.mount({host:$("handheld-host"),screen:lcd,label:"TI-Nspire CX II-T Graphs",interactive:false,onKey:press});
 const fmt=x=>Math.floor(x/60)+":"+String(Math.floor(x)%60).padStart(2,"0");
 const atEnd=()=>time>=T.duration-.2;
 const hints={blank:"Open Math Templates or load the two rules.",templates:"Move right to the n-piece template in the top row and select it.",count:"Use two pieces and press Enter.",editor:"Enter each expression beside its condition. Use arrows, and Ctrl + = for inequality symbols. Press Enter to graph.",relation:"Use the arrows or tap the symbol. Enter inserts it.",plotted:"Check which rule owns an endpoint. Press Tab on the handheld to edit."};
 const sync=src=>inputs.forEach((f,i)=>f.value=show(src[i],i));
 const raw=()=>inputs.map(f=>f.value);
 T.chapters.forEach(([time,label],i)=>{
  const row=document.createElement("li"),b=document.createElement("button"),no=document.createElement("span");
  no.textContent="0"+(i+1);b.type="button";b.append(no,document.createTextNode(label));
  b.addEventListener("click",()=>go(time));row.append(b);steps.append(row);
 });
 function describe(s){
  const brief=s.page==="blank"?"Blank Graphs entry.":
   s.page==="templates"?"Math Templates. "+(s.selection===7?"n-piece piecewise function selected.":"Template "+(s.selection+1)+"."):
   s.page==="count"?"Create Piecewise Function. Number of pieces "+s.count+".":
   s.page==="relation"?"Inequality symbols. Selected "+E.opts[s.relation]+".":
   (s.page==="plotted"?"Piecewise graph plotted. ":"Piecewise entry. ")+
   "Expression one: "+(show(s.slots[0],0)||"blank")+". Condition one: "+(show(s.slots[1],1)||"blank")+". Expression two: "+(show(s.slots[2],2)||"blank")+". Condition two: "+(show(s.slots[3],3)||"blank")+".";
  $("lcd-text").textContent=brief+(s.page==="editor"?" Active: "+["expression one","condition one","expression two","condition two"][s.slot]+".":"")+(s.error?" "+s.error:"");
 }
 function snapshot(t){
  let s=E.base(),key="",trail=[];
  for(const [at,k] of T.keys){if(at>t)break;s=E.key(s,k);key=t<at+.27?k:"";trail=key==="eq"?["ctrl"]:[];}
  return {s,key,trail};
 }
 function drawWatch(){
  if(mode!=="watch")return;
  const ch=T.chapters.findLastIndex(([x])=>x<=time),i=T.captions.findLastIndex(([x])=>x<=time),{s,key,trail}=snapshot(time);
  seek.value=time;seek.setAttribute("aria-valuetext",fmt(time)+" of "+fmt(T.duration));$("clock").textContent=fmt(time)+" / "+fmt(T.duration);
  overlay.hidden=hasStarted||time>0;shell.setKeys(key?[...trail,key]:[]);
  $("take-over").textContent=time>0&&!atEnd()?"Take over":"Open Try";
  const next=JSON.stringify([s,ch,i]);if(next===cache)return;cache=next;
  screen.draw(s,{marked:s.page==="plotted"});describe(s);
  $("caption").textContent=T.captions[i][1];
  $("readout").textContent=T.captions[i][2];$("readout").hidden=!T.captions[i][2];
  [...steps.children].forEach((row,j)=>row.firstElementChild.setAttribute("aria-current",String(ch===j)));
  fit();
 }
 function updatePlay(){
  const label=playing?"Pause":time>=T.duration-.012?"Replay":"Play";
  play.textContent=label;play.setAttribute("aria-label",label);play.dataset.playing=String(playing);
 }
 function go(n){
  time=M.clamp(Number(n)||0,0,T.duration);origin=performance.now()-time*1000;
  drawWatch();if(!playing)updatePlay();
 }
 function pause(){
  if(playing)time=M.clamp((performance.now()-origin)/1000,0,T.duration);
  playing=false;cancelAnimationFrame(frame);updatePlay();drawWatch();
 }
 function tick(now){
  if(!playing||mode!=="watch")return;
  time=M.clamp((now-origin)/1000,0,T.duration);
  if(time>=T.duration){pause();return;}
  drawWatch();frame=requestAnimationFrame(tick);
 }
 function fit(){
  if(mode!=="watch")return;
  const h=lessonEnd(),top=Math.max(0,stage.getBoundingClientRect().top);
  const reserved=$("watch-message").offsetHeight+$("watch-player").offsetHeight+20;
  const cap=innerWidth<=700?(focused?320:270):(focused?360:304);
  stage.style.setProperty("--watch-fit",Math.max(106,Math.min(cap,Math.floor((h-top-reserved)*.4777)))+"px");
 }
 new ResizeObserver(fit).observe($("watch-message"));
 window.addEventListener("resize",fit);window.visualViewport?.addEventListener("resize",fit);
 function focus(v){
  focused=Boolean(v);stage.classList.toggle("ct15-focused",focused);document.body.classList.toggle("ct15-focus-open",focused);
  const b=$("focus-view"),name=focused?"Exit focused view":"Focused view";
  b.setAttribute("aria-pressed",String(focused));b.setAttribute("aria-label",name);b.textContent=focused?"Exit":"Focus";
  if(focused)stage.scrollTop=0;
  fit();
 }
 function ensureVisible(){
  const height=lessonEnd();
  if(!focused&&($("watch-player").getBoundingClientRect().bottom>height+1||shell.body.getBoundingClientRect().width<155)){focusChecked=true;focus(true);}
 }
 function toggle(){
  if(mode!=="watch")return;
  if(playing){pause();return;}
  if(!focusChecked){
   focusChecked=true;ensureVisible();
  }
  hasStarted=true;if(document.activeElement===overlay)play.focus({preventScroll:true});
  if(time>=T.duration-.012)go(0);
  origin=performance.now()-time*1000;playing=true;drawWatch();updatePlay();frame=requestAnimationFrame(tick);
 }
 overlay.addEventListener("click",toggle);play.addEventListener("click",toggle);
 $("back").addEventListener("click",()=>go(time-10));$("next").addEventListener("click",()=>go(time+10));
 $("focus-view").addEventListener("click",()=>focus(!focused));$("replay").addEventListener("click",()=>{pause();go(0);toggle();});
 seek.addEventListener("input",()=>go(seek.value));
 function button(label,x,y,w,h,action){
  const b=document.createElement("button");b.type="button";b.setAttribute("aria-label",label);
  Object.assign(b.style,{left:x/3.2+"%",top:y/2.4+"%",width:w/3.2+"%",height:h/2.4+"%"});
  b.addEventListener("click",e=>{e.stopPropagation();action();stage.focus({preventScroll:true});});hot.append(b);
 }
 const taskLine=task.model.map((p,i)=>"Rule "+(i+1)+": "+M.displayExpr(p.expr.raw)+" for "+M.displayCond(p.raw)+".").join(" ");
 $("challenge").textContent=task.x===null?taskLine:taskLine+" Find f("+pretty(task.x)+").";
 function inExercise(){
  if(track==="fork"||task.x===null)return false;
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
  const t=state.page,inTask=inExercise(),isFork=track==="fork";
  $("exercise-active").hidden=!inTask;$("exercise-inactive").hidden=inTask;
  $("keypad-problem").textContent=isFork?"You took over the Watch example.":inTask?"Assigned check: x = "+pretty(task.x)+".":"Edit or enter your own piecewise function.";
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
  edited=true;typedNote="";state=E.key(state,k);
  shell.setKeys(state.ctrl?["ctrl"]:[]);freshTry();
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
 $("reset-keypad").addEventListener("click",()=>{state=E.base();practiceState=state;track="practice";sync(task.slots);edited=true;typedNote="";exact.value="";feedback.textContent="";$("answer-y").value="";freshTry();stage.focus({preventScroll:true});});
 lcd.addEventListener("click",e=>{
  if(mode!=="try"||state.page!=="plotted")return;
  const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*320/r.width,y=(e.clientY-r.top)*240/r.height;
  if(x<S.X.l||x>S.X.r||y<S.Y.t||y>S.Y.b)return;
  const v=Number(S.fromPixel(M.windowFor(state.model),x).toFixed(2));
  if(Math.abs(v)>20)return;exact.value=String(v);inspect(v);
 });
 const tabs=[$("watch-tab"),$("try-tab")];
 function change(next,takeover=false){
  if(mode==="watch"&&next==="try"){
   pause();if(focused)focus(false);
   if(takeover&&time>0&&!atEnd()&&!fixed&&!edited&&!forkState){track="fork";state={...snapshot(time).s,fromWatch:true};forkState=state;}
   else if(takeover&&atEnd()&&track==="fork"){track="practice";state=practiceState;sync(task.slots);typedNote="";exact.value="";feedback.textContent="";}
  }
  if(mode==="try"&&next==="watch"){if(track==="fork")forkState=state;else practiceState=state;}
  mode=next;stage.dataset.mode=mode;cache="";
  const watching=next==="watch";
  tabs.forEach((b,i)=>{const active=watching===(i===0);b.setAttribute("aria-selected",String(active));b.tabIndex=active?0:-1;});
  for(const id of ["watch-player","watch-message","watch-side","watch"])$(id).hidden=!watching;
  for(const id of ["try-player","try-side","try"])$(id).hidden=watching;
  shell.setKeys([]);shell.setInteractive(!watching);
  if(watching){hot.replaceChildren();drawWatch();ensureVisible();}
  else{overlay.hidden=true;freshTry();}
 }
 tabs.forEach((b,i)=>{
  b.addEventListener("click",()=>{change(i?"try":"watch");if(i)stage.focus({preventScroll:true});});
  b.addEventListener("keydown",e=>{
   if(!["ArrowLeft","ArrowRight","Home","End"].includes(e.key))return;
   e.preventDefault();const j=e.key==="Home"?0:e.key==="End"?1:1-i;change(j?"try":"watch");tabs[j].focus();
  });
 });
 $("take-over").addEventListener("click",()=>{change("try",true);stage.focus({preventScroll:true});});
 $("return-watch").addEventListener("click",()=>{change("watch");play.focus({preventScroll:true});});
 document.addEventListener("keydown",e=>{if(e.target!==document.body&&!e.target.closest?.(".qb-calculator-lesson"))return;
  if(e.key==="Escape"&&focused){e.preventDefault();focus(false);$("focus-view").focus();return;}
  if(e.target.closest("input,textarea,select,a,summary,[contenteditable]")||e.altKey)return;
  if(mode==="try"&&(e.ctrlKey||e.metaKey)&&e.key==="="){e.preventDefault();press("relation");return;}
  if(e.ctrlKey||e.metaKey)return;
  const tag=e.target.closest("button");
  if(mode==="watch"){
   if(tag||e.repeat)return;
   const k=e.key.toLowerCase();
   if(k==="k"||k===" "){e.preventDefault();toggle();}else if(k==="j"||k==="l"){e.preventDefault();go(time+(k==="j"?-10:10));}return;
  }
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
 seek.max=T.duration;sync(task.slots);
 change(params.get("mode")==="try"||linked&&params.get("mode")!=="watch"?"try":"watch");
})();
