"use strict";
(function(){
 const $=id=>document.getElementById(id),M=CT52Math,E=CT52Editor,S=CT52Screen,T=CT52Tape;
 const stage=$("stage"),play=$("play"),seek=$("seek"),overlay=$("stage-play"),lcd=$("lcd"),canvas=$("drawing"),hot=$("hotspots"),steps=$("steps");
 const screen=S.screen(canvas),expr=$("expression"),bound=$("bound"),exact=$("point-input"),feedback=$("feedback");
 const params=new URLSearchParams(location.search),def=M.parse("x^3+4");
 let linked=null,invalid=false;
 if(params.has("expr")||params.has("x"))try{
  if(params.getAll("expr").length!==1||params.getAll("x").length>1)throw Error("Invalid links");
  const q=M.parse(params.get("expr")),x=params.has("x")?M.readX(params.get("x")):null;
  if(params.has("x")&&(x===null||Math.abs(x)>20))throw Error("Invalid candidate");
  linked={q,x};
 }catch{invalid=true;}
 const task=linked||{q:def,x:0},goal=task.x===null?null:M.inspect(task.q,task.x),gradeable=Boolean(goal&&["maximum","minimum","stationary inflection"].includes(goal.kind));
 const fixed=Boolean(linked)||params.get("case")==="stationary-demo",pretty=M.prettyX;
 let mode="watch",state=E.base(task.q.raw),practiceState=state,forkState=null,track="practice",edited=false,focused=false,hasStarted=false,focusChecked=false;
 let time=0,origin=0,frame=0,playing=false,cache="",typedNote="";
 const shell=HandheldShell.mount({host:$("handheld-host"),screen:lcd,label:"TI-Nspire CX II-T Graphs",interactive:false,onKey:press});
 const fmt=x=>Math.floor(x/60)+":"+String(Math.floor(x)%60).padStart(2,"0"),atEnd=()=>time>=T.duration-.2;
 const hints={f1:"Enter a smooth polynomial and press Enter to plot f₁.",graph:"Open Ctrl + G for f₂, or use Menu to bracket a derivative crossing.",f2:"Open Math Templates.",templates:"Select the first derivative template.",diff:"Use the variable box for x and the expression for f1(x).",menu:"Choose 6: Analyze Graph.",sub:"Choose 1: Zero.",curve:"Select f₂, the derivative, then confirm.",lower:"Choose a lower bound to the left of one derivative crossing.",upper:"Choose an upper bound to the right of the same crossing."};
 const classes={"maximum":"Local maximum","minimum":"Local minimum","stationary inflection":"Stationary inflection"};
 T.chapters.forEach(([time,label],i)=>{
  const row=document.createElement("li"),b=document.createElement("button"),no=document.createElement("span");
  no.textContent="0"+(i+1);b.type="button";b.append(no,document.createTextNode(label));
  b.addEventListener("click",()=>go(time));row.append(b);steps.append(row);
 });
 function describe(s){
  const label=s.q?"Graph f₁(x) = "+M.displayExpr(s.q.raw):"f₁ entry: "+(M.displayExpr(s.raw)||"blank");
  const both=s.both?" Graph f₂ is the derivative.":"",marks=s.marks.length?" f₂ zeros at x = "+s.marks.map(M.pretty).join(", ")+".":"";
  const detail=s.page==="diff"?" Template derivative variable "+(s.var||"blank")+", expression "+(s.arg||"blank")+".":s.page==="curve"?" Selected curve f"+(s.curve===2?"₂":"₁")+".":s.page==="upper"?" Lower bound "+M.pretty(s.low)+".":"";
  const short=s.error?" "+s.error:"";
  $("lcd-text").textContent=label+". "+hints[s.page]+both+detail+marks+short;
 }
 function snapshot(t){
  let s=E.base(),active=[];
  for(const [at,k] of T.keys){if(at>t)break;s=E.k(s,k);active=t<at+.27?(k==="g"?["ctrl","g"]:k==="minus"&&s.page==="diff"?["shift","minus"]:[k]):[];}
  return {s,active};
 }
 function drawWatch(){
  if(mode!=="watch")return;
  const ch=T.chapters.findLastIndex(([x])=>x<=time),i=T.captions.findLastIndex(([x])=>x<=time),{s,active}=snapshot(time);
  seek.value=time;seek.setAttribute("aria-valuetext",fmt(time)+" of "+fmt(T.duration));$("clock").textContent=fmt(time)+" / "+fmt(T.duration);
  overlay.hidden=hasStarted||time>0;shell.setKeys(active);
  $("take-over").textContent=time>0&&!atEnd()?"Take over":"Open Try";
  const next=JSON.stringify([s,ch,i],(k,v)=>typeof v==="bigint"?String(v):v);if(next===cache)return;cache=next;
  screen.draw(s);describe(s);
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
  const h=window.visualViewport?.height||innerHeight,top=focused?0:Math.max(0,stage.getBoundingClientRect().top);
  const reserved=$("watch-message").offsetHeight+$("watch-player").offsetHeight+20;
  const cap=innerWidth<=700?(focused?320:270):(focused?360:304);
  stage.style.setProperty("--watch-fit",Math.max(106,Math.min(cap,Math.floor((h-top-reserved)*.4777)))+"px");
 }
 new ResizeObserver(fit).observe($("watch-message"));
 window.addEventListener("resize",fit);window.visualViewport?.addEventListener("resize",fit);
 function focus(v){
  focused=Boolean(v);stage.classList.toggle("ct52-focused",focused);document.body.classList.toggle("ct52-focus-open",focused);
  const b=$("focus-view"),name=focused?"Exit focused view":"Focused view";
  b.setAttribute("aria-pressed",String(focused));b.setAttribute("aria-label",name);b.textContent=focused?"Exit":"Focus";
  if(focused)stage.scrollTop=0;
  fit();
 }
 function ensureVisible(){
  const height=window.visualViewport?.height||innerHeight;
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
 $("challenge").textContent=task.x===null?"Explore f₁(x) = "+M.displayExpr(task.q.raw)+".":"For f₁(x) = "+M.displayExpr(task.q.raw)+", check the candidate x = "+pretty(task.x)+". Give its height and classify it.";
 function inExercise(){
  if(track==="fork"||!gradeable)return false;
  try{return M.equivalent(M.parse(expr.value),task.q)&&M.equivalent(M.parse(state.raw),task.q);}
  catch{return false;}
 }
 function message(msg="",error=false){
  $("keypad-result").textContent=msg;$("keypad-result").hidden=!msg;
  $("keypad-result").className="feedback "+(error?"is-wrong":"is-right");
 }
 function freshTry(){
  if(mode!=="try")return;
  screen.draw(state);describe(state);hot.replaceChildren();
  const p=state.page,inTask=inExercise(),isFork=track==="fork";
  $("exercise-active").hidden=!inTask;$("exercise-inactive").hidden=inTask;
  $("keypad-problem").textContent=isFork?"You took over the Watch example.":task.x!==null&&(inTask||linked)?"Candidate: x = "+pretty(task.x)+".":"Choose a candidate or bracket a derivative crossing.";
  $("keypad-hint").textContent=p==="graph"&&state.both?"Use Zero for a crossing, or check a known candidate separately.":hints[p];
  const finding=p==="lower"||p==="upper";
  $("bound-form").hidden=!finding;$("bound-label").textContent=(p==="upper"?"Upper":"Lower")+" bound x (lesson shortcut)";
  $("point-form").hidden=p!=="graph"||!state.both;
  if(bound.value!==state.buf)bound.value=state.buf;
  const v=state.probe;
  const sign=x=>x>0?"+":x<0?"−":"0";
  $("probe-result").textContent=!v?"":classes[v.kind]?
   "f₁("+pretty(v.x)+") = "+M.pretty(v.y)+". f₂ is zero. Signs: "+sign(v.sl)+" at "+M.pretty(v.left)+", "+sign(v.sr)+" at "+M.pretty(v.right)+". "+classes[v.kind]+"."
   :"f₁("+pretty(v.x)+") = "+M.pretty(v.y)+". f₂("+pretty(v.x)+") ≈ "+M.pretty(v.slope)+". "+(v.kind==="constant"?"The derivative is zero everywhere; there is no isolated stationary point.":"This is not a verified stationary x. A small slope does not prove a root.");
  const warn=invalid&&!edited?"Invalid linked function or candidate. Showing the set exercise.":"";
  const found=p==="graph"&&state.marks.length&&!v?"Zero of f₂: x = "+M.pretty(state.marks.at(-1))+". Check this candidate on f₁.":"";
  message(state.error||warn||typedNote||found,Boolean(state.error||warn));
  if(p==="templates")button("First derivative template",199,82,39,27,()=>{state={...state,select:4};press("enter");});
  if(p==="diff"){button("Variable box",85,49,26,18,()=>{state={...state,field:0};freshTry();});button("Expression box",127,33,132,25,()=>{state={...state,field:1};freshTry();});}
  if(p==="menu")button("6: Analyze Graph",8,100,127,14,()=>press("6"));
  if(p==="sub")button("1: Zero",136,98,162,14,()=>press("1"));
  if(p==="curve")button("Select f₂ derivative graph",224,20,44,18,()=>{state={...state,curve:2};press("enter");});
 }
 function press(k){
  if(mode!=="try")return;
  const prev=state;edited=true;typedNote="";state=E.k(state,k);
  if(state.page==="graph"&&state.marks.length&&state.marks!==prev.marks)exact.value=String(state.marks.at(-1));
  shell.setKeys(state.ctrl?["ctrl"]:state.shift?["shift"]:[]);freshTry();
 }
 function inspect(x){
  if(state.page!=="graph"||!state.both)return;
  if(x===null||Math.abs(x)>20){state={...state,error:"Enter a valid decimal candidate in [−20,20]."};freshTry();return;}
  const marked=state.marks.find(r=>r===x||Number(r.toPrecision(6))===x);
  // A root is reusable after a successful bracket, even at its six-digit screen precision.
  const v=M.inspect(state.q,marked??x,marked!==undefined);
  state={...state,error:"",probe:v};typedNote="";edited=true;freshTry();
 }
 $("point-form").addEventListener("submit",e=>{e.preventDefault();inspect(M.readX(exact.value));});
 $("bound-form").addEventListener("submit",e=>{
  e.preventDefault();edited=true;const prev=state;state=E.confirmBound(state,M.readX(bound.value));
  if(state.page==="graph"&&state.marks!==prev.marks)exact.value=String(Number(state.marks.at(-1).toPrecision(6)));
  freshTry();
 });
 bound.addEventListener("input",()=>{edited=true;state={...state,buf:bound.value,error:""};freshTry();});
 $("expression-form").addEventListener("submit",e=>{
  e.preventDefault();edited=true;
  try{const q=M.parse(expr.value);state={...E.base(q.raw),fromWatch:track==="fork"};typedNote="f₁ entry loaded. Press Enter to plot.";}
  catch(err){state={...state,error:err.message};typedNote="";}
  freshTry();stage.focus({preventScroll:true});
 });
 expr.addEventListener("input",()=>{edited=true;typedNote="";state={...state,error:""};feedback.textContent="";freshTry();});
 $("reset-keypad").addEventListener("click",()=>{
  state=E.base(task.q.raw);practiceState=state;track="practice";expr.value=task.q.raw;edited=true;typedNote="";exact.value="";
  feedback.textContent="";$("answer-y").value="";$("kind").value="";freshTry();stage.focus({preventScroll:true});
 });
 lcd.addEventListener("click",e=>{
  if(mode!=="try"||!["lower","upper","curve"].includes(state.page))return;
  const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*320/r.width,y=(e.clientY-r.top)*240/r.height;
  if(x<S.X.l||x>S.X.r||y<S.Y.t||y>S.Y.b)return;
  const w=M.window(state.q,state.both),v=Number(S.fromPixel(w,x).toFixed(2));
  if(state.page==="curve"){
   const yy=w.y0+(S.Y.b-y)/(S.Y.b-S.Y.t)*(w.y1-w.y0);
   const which=Math.abs(yy-M.dx(state.q,v))<Math.abs(yy-state.q.f(v))?2:1;
   state={...state,curve:which};press("enter");return;
  }
  state={...state,cursor:v,buf:""};freshTry();
 });
 const tabs=[$("watch-tab"),$("try-tab")];
 function change(next,takeover=false){
  if(mode==="watch"&&next==="try"){
   pause();if(focused)focus(false);
   if(takeover&&time>0&&!atEnd()&&!fixed&&!edited&&!forkState){track="fork";state={...snapshot(time).s,fromWatch:true};forkState=state;expr.value=state.raw;}
   else if(takeover&&atEnd()&&track==="fork"){track="practice";state=practiceState;expr.value=task.q.raw;typedNote="";exact.value="";feedback.textContent="";}
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
 document.addEventListener("keydown",e=>{
  if(e.key==="Escape"&&focused){e.preventDefault();focus(false);$("focus-view").focus();return;}
  if(e.target.closest("input,textarea,select,a,summary,[contenteditable]")||e.altKey)return;
  if(mode==="try"&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="g"&&stage.contains(e.target)){e.preventDefault();press("ctrl-g");return;}
  if(e.ctrlKey||e.metaKey)return;
  if(mode==="try"&&state.page==="f2"&&e.shiftKey&&["-","_"].includes(e.key)&&stage.contains(e.target)){e.preventDefault();press("derivative-template");return;}
  const tag=e.target.closest("button");
  if(mode==="watch"){
   if(tag||e.repeat)return;
   const k=e.key.toLowerCase();
   if(k==="k"||k===" "){e.preventDefault();toggle();}else if(k==="j"||k==="l"){e.preventDefault();go(time+(k==="j"?-10:10));}return;
  }
  if(!stage.contains(e.target)&&e.target!==document.body||tag&&(e.key==="Enter"||e.key===" "))return;
  if(e.key==="Tab"){
   if(e.target===stage&&state.page==="diff"&&!state.field&&!e.shiftKey){e.preventDefault();press("tab");}
   return;
  }
  const map={Escape:"esc",Enter:"enter",Backspace:"del",Delete:"del",ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down",t:"templates",T:"templates",m:"menu",M:"menu",".":"dot","^":"power","+":"plus","-":"minus","*":"mul","/":"div","(":"lparen",")":"rparen","²":"square"};
  const k=map[e.key]||(/^[0-9xXfF]$/.test(e.key)?e.key.toLowerCase():"");
  if(k){e.preventDefault();press(k);}
 });
 [$("answer-y"),$("kind")].forEach(el=>el.addEventListener("input",()=>{edited=true;feedback.textContent="";}));
 $("answer-form").addEventListener("submit",e=>{
  e.preventDefault();if(mode!=="try"||!inExercise())return;edited=true;
  const a=$("answer-y").value.trim().replace("−","-"),n=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(a)?Number(a):NaN;
  const goodY=Number.isFinite(n)&&[goal.y,Number(goal.y.toPrecision(6)),Number(goal.y.toPrecision(3))].some(y=>Math.abs(n-y)<=Math.abs(y)*1e-10);
  const goodKind=$("kind").value===goal.kind,ok=goodY&&goodKind;
  feedback.className="feedback "+(ok?"is-right":"is-wrong");
  feedback.textContent=ok?"Correct. The original function gives the height; the two signs give the class.":goodY?"The height is right. Compare the derivative signs on each side.":"Use the original function for the height, not its derivative.";
 });
 const theme=$("theme");try{const v=localStorage.getItem("ti-lab-theme");if(["light","dark"].includes(v))theme.value=v;}catch{}
 document.documentElement.dataset.theme=theme.value;
 theme.addEventListener("change",()=>{document.documentElement.dataset.theme=theme.value;try{localStorage.setItem("ti-lab-theme",theme.value==="system"?"auto":theme.value);}catch{}});
 seek.max=T.duration;expr.value=task.q.raw;exact.value=task.x===null?"":String(task.x);
 change(params.get("mode")==="try"||linked&&params.get("mode")!=="watch"?"try":"watch");
})();
