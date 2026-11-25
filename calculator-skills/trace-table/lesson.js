"use strict";
(function(){
 function lessonEnd(){return (window.visualViewport?.height||innerHeight)-(document.querySelector("body > .tabbar")?.offsetHeight||0);}
const $=id=>document.getElementById(id),M=window.CT09Math,S=window.CT09Screen,T=window.CT09Tape,H=window.HandheldTransport;
 const stage=$("stage"),play=$("play"),seek=$("seek"),cap=$("caption"),overlay=$("stage-play"),lcd=$("lcd"),canvas=$("drawing");
 const screen=S.screen(canvas),expression=$("expression"),exact=$("point-input"),hot=$("hotspots"),steps=$("steps"),feedback=$("feedback");
 const watchModel=M.parse("2x^2-3"),defaultModel=M.parse("3x^2-2x+1");
 const params=new URLSearchParams(location.search),same=k=>params.getAll(k).length===1;
 let linked=null,invalid=false;
 if(params.has("expr")||params.has("x")){
  try{
   if(!same("expr")||!same("x"))throw Error("Provide one expression and x");
   const q=M.parse(params.get("expr")),x=M.readX(params.get("x"));
   if(x===null)throw Error("Invalid x");
   linked={q,x};
  }catch{invalid=true;}
 }
 const practice=linked||{q:defaultModel,x:-2};
 const target=M.evaluate(practice.q,practice.x),askedX=linked?params.get("x").trim().replaceAll("-","−"):M.prettyX(practice.x);
 $("challenge").textContent="Use Graph Trace or a table to find f("+askedX+") for f(x) = "+M.displayExpr(practice.q.raw)+".";
 $("exercise-hint").textContent="Type "+askedX+" as the input. On Trace read the second coordinate; in a table read the entry in the f₁(x) column on the correct row.";
 function readAnswer(raw){
  const text=raw.trim().replaceAll("−","-");
  if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text))return null;
  const n=Number(text);return Number.isFinite(n)?n:null;
 }
 
 const initial=raw=>({state:"entry",raw,q:null,w:null,cursor:0,buffer:"",committed:false,pane:"graph",row:0,rows:[],tableOpen:false,ask:false,askDraft:false,setting:0,dropdown:false,tableValue:null,error:null,ctrl:false,fromWatch:false});
 let mode="watch",state=initial(practice.q.raw),fresh=true,edited=false,focused=false,hasStarted=false,focusChecked=false;
 let time=0,origin=0,frame=0,playing=false,cache="",watchFocus=false,watchScroll=0;
 const forks=new Map(),MAX_FORKS=24,answerY=$("answer-y");
 let activeFork=null,assigned=null;
 function capture(){const display=$("keypad-result");return {state,fresh,edited,answer:answerY.value,feedback:feedback.textContent,gradeClass:feedback.className,status:{text:display.textContent,cls:display.className,hidden:display.hidden}};}
 function restore(d){({state,fresh,edited}=d);answerY.value=d.answer;feedback.textContent=d.feedback;feedback.className=d.gradeClass;}
 function saveLane(){const d=capture();if(activeFork===null){assigned=d;return;}
  forks.delete(activeFork);forks.set(activeFork,d);
  if(forks.size>MAX_FORKS)forks.delete(forks.keys().next().value);
 }
 function newFork(){return {state:{...snapshot(time).model,fromWatch:true},fresh:false,edited:true,answer:"",feedback:"",gradeClass:"feedback"};}
 function clearAssigned(){state=initial(practice.q.raw);fresh=true;edited=false;answerY.value="";feedback.textContent="";feedback.className="feedback";expression.value=state.raw;exact.value="";}
 function restoreStatus(d){if(!d?.status)return;const e=$("keypad-result");e.textContent=d.status.text;e.className=d.status.cls;e.hidden=d.status.hidden;}

 const shell=HandheldShell.mount({host:$("handheld-host"),screen:lcd,label:"TI-Nspire CX II-T Graphs and Table",interactive:false,onKey:press});
 const hints={entry:"Enter a polynomial in x (up to a cubic), then press Enter to plot.",graph:"Open Menu for Graph Trace or a split-screen table.",main:"Choose 5: Trace or 7: Table.",traceMenu:"Choose 1: Graph Trace.",openMenu:"Choose 1: Split-screen Table.",trace:"Arrow keys step along the graph. Type an x-value and press Enter to jump to it.",table:"Use Up or Down to move through the Auto rows. To enter your own x-value, change Independent to Ask.",tableRoot:"Choose 2: Table.",tableMenu:"Choose 5: Edit Table Settings.",settings:"Tab to Independent, open its choice and select Ask. Leave Dependent at Auto."};
 const finished=()=>time>=T.duration-.25;
 const clock=x=>Math.floor(x/60)+":"+String(Math.floor(x)%60).padStart(2,"0");
 const isTable=s=>["table","tableRoot","tableMenu","settings"].includes(s.state);
 function lcText(s){
  let t=s.q?"Graph of "+M.displayExpr(s.q.raw):"Function entry "+M.displayExpr(s.raw);
  if(!s.q)return t;
  if(s.state==="trace"){
   const v=M.evaluate(s.q,s.cursor);
   if(v)t+=". Trace f₁: ("+M.prettyX(v.x)+", "+M.pretty(v.y)+")";
   if(s.buffer)t+=". Entering x "+s.buffer;
  }
  if(isTable(s)){
   t+=". Split-screen table. Independent: "+(s.ask||s.askDraft&&s.state==="settings"?"Ask":"Auto");
   if(s.state==="settings")t+=". Edit Table Settings";
   if(s.ask&&s.rows.length)t+=". Rows: "+s.rows.map(x=>M.prettyX(x)+" → "+M.pretty(s.q.f(x))).join("; ");
   else if(s.state==="table"&&!s.ask)t+=". Selected row: "+M.prettyX(s.row)+" → "+M.pretty(s.q.f(s.row));
   if(s.buffer)t+=". Entering x "+s.buffer;
  }
  return t;
 }
 T.titles.forEach((name,i)=>{
  const row=document.createElement("li"),button=document.createElement("button"),n=document.createElement("span");
  button.type="button";n.textContent="0"+(i+1);button.append(n,document.createTextNode(name));
  button.addEventListener("click",()=>go(T.starts[i]));row.append(button);steps.append(row);
 });
 function snapshot(s){
  let model=initial(""),active=[];
  for(const e of T.keys){
   if(s<e.time)break;
   Object.assign(model,e.delta);
   if(s<e.time+.27)active=e.key==="t"?["ctrl","t"]:[e.key];else active=[];
  }
  if(model.state!=="entry"){model.q=watchModel;model.w={x0:-4,x1:4,y0:-6,y1:32};}
  return {model:{...model,rows:[...model.rows]},active};
 }
 function drawWatch(){
  if(mode!=="watch")return;
  const chapter=T.starts.findLastIndex(s=>time>=s),{model,active}=snapshot(time);
  seek.value=time;seek.setAttribute("aria-valuetext",clock(time)+" of "+clock(T.duration));$("clock").textContent=clock(time)+" / "+clock(T.duration);
  overlay.hidden=hasStarted||time>0;shell.setKeys(active);
  $("take-over").textContent=finished()?"Open Try":"Take over";
  const token=JSON.stringify([chapter,model.state,model.raw,model.cursor,model.buffer,model.pane,model.row,model.rows,model.ask,model.askDraft,model.setting,model.dropdown]);
  if(token===cache)return;cache=token;
  screen.draw(model);$("lcd-text").textContent=lcText(model);cap.textContent=T.captions[chapter];
  const text=chapter===2&&model.committed?"Trace: (3, 15). The second coordinate tells you f(3) = 15.":chapter>=5&&model.rows.length===2?"Table: x = −1.5 → 1.5; x = 3 → 15.":chapter>=5&&model.rows.length?"Table: x = −1.5 → 1.5.":"";
  $("readout").hidden=!text;$("readout").textContent=text;
  [...steps.children].forEach((li,i)=>li.firstElementChild.setAttribute("aria-current",String(i===chapter)));
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
 function focus(v){
  focused=Boolean(v);stage.classList.toggle("ct09-focused",focused);document.body.classList.toggle("ct09-focus-open",focused);
  const b=$("focus-view"),name=focused?"Exit focused view":"Focused view";
  b.setAttribute("aria-pressed",String(focused));b.setAttribute("aria-label",name);b.textContent=focused?"Exit":"Focus";
  document.querySelectorAll(".header,.calc-tabs,.notes,#watch,#try").forEach(e=>e.inert=focused);
  if(focused)stage.scrollTop=0;
 }
 function ensureVisible(){
  const height=lessonEnd();
  if(!focused&&$("watch-player").getBoundingClientRect().bottom>height+1){focusChecked=true;focus(true);}
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
 function isExercise(){
  if(activeFork!==null||state.fromWatch)return false;
  try{return M.equivalent(M.parse(state.raw),practice.q);}catch{return false;}
 }
 function hit(label,x,y,w,h,action){
  const b=document.createElement("button");b.type="button";b.setAttribute("aria-label",label);
  Object.assign(b.style,{left:x/3.2+"%",top:y/2.4+"%",width:w/3.2+"%",height:h/2.4+"%"});
  b.addEventListener("click",e=>{e.stopPropagation();action();});hot.append(b);
 }
 function menuHit(panel,index,action){hit(panel.rows[index],panel.x,panel.y+2+index*panel.h,panel.w,panel.h,action);}
 function message(s="",error=false){
  const el=$("keypad-result");el.hidden=!s;el.className="feedback"+(error?"is-wrong":"is-right");el.textContent=s;
 }
 function warning(){return invalid&&!edited?"Invalid linked function or x-value. Showing the set exercise.":"";}
 function fitTry(){
  if(mode!=="try")return;
  const h=lessonEnd(),phone=innerWidth<=700;
  const top=Math.max(0,$("handheld-host").getBoundingClientRect().top+scrollY);
  const width=Math.min(phone?267:302,Math.max(phone?158:155,Math.floor((h-top-10)*558/1168)));
  stage.style.setProperty("--retro-try-width",width+"px");
 }
 const tryLayout=new ResizeObserver(fitTry);
 for(const el of [document.querySelector("header"),$("try-player")])tryLayout.observe(el);
 window.addEventListener("resize",fitTry);
 window.visualViewport?.addEventListener("resize",fitTry);
 function freshTry(){
  if(mode!=="try")return;
  screen.draw(state);$("lcd-text").textContent=lcText(state);hot.replaceChildren();
  const inExercise=isExercise(),t=state.state;
  $("exercise-active").hidden=!inExercise;$("exercise-inactive").hidden=inExercise;
  $("reset-keypad").textContent=activeFork===null?"Reset calculator":"Return to assigned Try";
  $("keypad-problem").textContent=inExercise?(linked?"Linked input: x = ":"Practice input: x = ")+askedX+".":activeFork!==null?"You took over the Watch example.":linked?"Linked input: x = "+askedX+".":"Choose inputs for your own function.";
  $("keypad-hint").textContent=t==="table"&&state.ask?"Select an x cell, type an input and press Enter. Read the function value on the same row.":hints[t];
  const entry=t==="trace"||t==="table"&&state.ask&&state.pane==="table";
  $("point-form").hidden=!entry;$("point-label").textContent=t==="trace"?"Trace x":"Table x cell";
  if(exact.value!==state.buffer)exact.value=state.buffer;
  lcd.classList.toggle("pick",t==="trace");
  let result=null;
  if(t==="trace"&&state.committed)result=M.evaluate(state.q,state.cursor);
  if(t==="table"&&state.tableValue!==null)result=M.evaluate(state.q,state.tableValue);
  const warn=warning();
  message(state.error||warn||(result?(t==="trace"?"Trace: ":"Table: ")+"f("+M.prettyX(result.x)+") = "+M.pretty(result.y)+".":""),Boolean(state.error||warn));
  const p=S.PANELS;
  if(t==="main"){menuHit(p.main,4,()=>press("5"));menuHit(p.main,6,()=>press("7"));}
  if(t==="traceMenu")menuHit(p.trace,0,()=>press("1"));
  if(t==="openMenu"){menuHit(p.open,0,()=>press("1"));if(state.tableOpen)menuHit(p.open,1,()=>press("2"));}
  if(t==="tableRoot")menuHit(p.tableRoot,1,()=>press("2"));
  if(t==="tableMenu"){menuHit(p.table,4,()=>press("5"));menuHit(p.table,0,()=>press("1"));}
  if(t==="settings"){
   if(state.dropdown){
    hit("Independent Auto",150,145,109,21,()=>setDraft(false));
    hit("Independent Ask",150,166,109,21,()=>setDraft(true));
   }else{
    hit("Independent Auto or Ask",149,125,110,22,()=>shift("settings",{setting:2,dropdown:true}));
    hit("OK",148,172,51,18,applySettings);
    hit("Cancel",205,172,55,18,()=>press("esc"));
   }
  }
 }
 function shift(next,props={}){state={...state,state:next,error:null,...props};freshTry();}
 function plot(){
  edited=true;feedback.textContent="";
  try{
   const q=M.parse(expression.value),aim=linked&&M.equivalent(q,linked.q)?linked.x:0;
   state={...initial(q.raw),q,w:M.windowFor(q,aim),state:"graph",fromWatch:state.fromWatch&&M.equivalent(q,watchModel)};
   expression.value=q.raw;freshTry();
  }catch(e){state={...initial(expression.value),error:e.message};freshTry();}
 }
 function trace(){shift("trace",{tableOpen:false,cursor:state.w.x0<=0&&state.w.x1>=0?0:(state.w.x0+state.w.x1)/2,buffer:"",committed:false});}
 function tableToggle(){
  if(!state.q){message("Plot a function first.",true);return;}
  edited=true;
  if(isTable(state)||state.tableOpen)shift("graph",{buffer:"",tableOpen:false,pane:"graph"});
  else shift("table",{pane:"table",row:0,buffer:"",tableOpen:true,tableValue:null});
 }
 function setDraft(b){shift("settings",{askDraft:b,dropdown:false});}
 function applySettings(){
  const changed=state.ask!==state.askDraft;
  shift("table",{ask:state.askDraft,rows:changed?[]:state.rows,row:0,buffer:"",tableValue:null,dropdown:false,pane:"table",tableOpen:true});
 }
 function inputX(x){
  if(!state.q||x===null){shift(state.state,{error:"Enter a decimal x-value from −100 to 100."});return;}
  if(state.state==="trace"){
   const w=x<state.w.x0||x>state.w.x1?M.windowFor(state.q,x):state.w;
   shift("trace",{cursor:x,w,buffer:"",committed:true});return;
  }
  if(state.state==="table"&&state.ask&&state.pane==="table"){
   const rows=state.rows.slice(),i=state.row;
   if(i<rows.length)rows[i]=x;else rows.push(x);
   const kept=rows.slice(-12);
   shift("table",{rows:kept,tableValue:x,buffer:"",row:Math.min(kept.length,i+1)});
  }
 }
 function editX(k){
  const char=H.character(k);
  if(k==="del"){shift(state.state,{buffer:state.buffer.slice(0,-1)});return true;}
  if(char===null||!/^[0-9.+-]$/.test(char))return false;
  const buf=state.buffer+char;
  if(buf.length<=19)shift(state.state,{buffer:buf});
  return true;
 }
 function press(k){
  if(mode!=="try")return;
  if(k==="ctrl"){state.ctrl=!state.ctrl;shell.setKeys(state.ctrl?["ctrl"]:[]);return;}
  const modifier=state.ctrl;if(modifier){state.ctrl=false;shell.setKeys([]);}
  const t=state.state;
  if(modifier&&k==="t"){tableToggle();return;}
  if(modifier&&k==="tab"&&t==="table"){shift(t,{pane:state.pane==="table"?"graph":"table",buffer:""});return;}
  if(k==="esc"){
   edited=true;
   const back={main:"graph",traceMenu:"main",openMenu:state.tableOpen?"table":"main",trace:"graph",tableRoot:"table",tableMenu:"tableRoot",settings:state.dropdown?"settings":"table"};
   shift(back[t]||t,{buffer:"",committed:false,dropdown:false});return;
  }
  if(k==="menu"){
   if(!state.q){message("Plot a function first.",true);return;}
   edited=true;shift(isTable(state)&&state.pane==="table"?"tableRoot":"main",{buffer:"",committed:false});return;
  }
  if(t==="main"){if(k==="5"||k==="enter"||k==="right"||k==="select"){shift("traceMenu");return;}if(k==="7"){shift("openMenu");return;}return;}
  if(t==="traceMenu"){if(["1","right","enter","select"].includes(k))trace();return;}
  if(t==="openMenu"){if(["1","right","enter","select"].includes(k)&&!state.tableOpen) tableToggle();else if(k==="2"&&state.tableOpen)tableToggle();return;}
  if(t==="tableRoot"){if(["2","right","enter","select"].includes(k))shift("tableMenu");return;}
  if(t==="tableMenu"){if(k==="1"){tableToggle();return;}if(["5","right","enter","select"].includes(k))shift("settings",{setting:0,askDraft:state.ask,dropdown:false});return;}
  if(t==="settings"){
   if(state.dropdown){if(k==="up"||k==="down")shift(t,{askDraft:k==="down"});else if(k==="enter"||k==="select")setDraft(state.askDraft);return;}
   if(k==="tab"||k==="down"||k==="up"){shift(t,{setting:M.clamp(state.setting+(k==="up"?-1:1),0,4)});return;}
   if(state.setting===2&&["right","enter","select"].includes(k)){shift(t,{dropdown:true});return;}
   if((k==="enter"||k==="select")&&state.setting===4)applySettings();return;
  }
  if(t==="trace"){
   if(["enter","select"].includes(k)&&state.buffer){edited=true;inputX(M.readX(state.buffer));return;}
   if(k==="left"||k==="right"){
    edited=true;const x=M.clamp(Number((state.cursor+(k==="left"?-.5:.5)).toFixed(12)),-100,100);
    const w=x<state.w.x0||x>state.w.x1?M.windowFor(state.q,x):state.w;
    shift(t,{cursor:x,w,buffer:"",committed:true});return;
   }
   if(k==="enter"||k==="select"){shift(t,{committed:true});return;}
   if(editX(k))edited=true;return;
  }
  if(t==="table"){
   if(k==="left"||k==="right"){shift(t,{pane:k==="left"?"graph":"table",buffer:""});return;}
   if(state.pane!=="table")return;
   if(k==="up"||k==="down"){
    const row=M.clamp(state.row+(k==="up"?-1:1),state.ask?0:-100,state.ask?state.rows.length:100);
    shift(t,{row,buffer:"",tableValue:state.ask?(state.rows[row]??null):row});return;
   }
   if(!state.ask){if(H.character(k)!==null)message("Auto uses regular rows. Set Independent to Ask to type x.",true);return;}
   if(k==="enter"||k==="select"){if(state.buffer){edited=true;inputX(M.readX(state.buffer));}return;}
   if(editX(k))edited=true;return;
  }
  if(k==="tab"&&state.q){edited=true;fresh=true;shift("entry",{buffer:"",tableOpen:false});return;}
  if(k==="enter"){plot();return;}
  const value=H.character(k);
  if(value!==null&&/^[0-9x().+*\/^-]+$/.test(value)||k==="del"){
   edited=true;const replace=t!=="entry"||fresh;fresh=false;
   H.modify(expression,k,{replace});
  }
 }
 $("expression-form").addEventListener("submit",e=>{e.preventDefault();plot();});
 expression.addEventListener("input",()=>{edited=true;fresh=false;state=initial(expression.value);feedback.textContent="";freshTry();});
 exact.addEventListener("input",()=>{edited=true;state={...state,buffer:exact.value,error:null};freshTry();});
 $("point-form").addEventListener("submit",e=>{e.preventDefault();edited=true;inputX(M.readX(exact.value));});
 $("reset-keypad").addEventListener("click",()=>{
  if(activeFork!==null){saveLane();activeFork=null;restore(assigned);expression.value=state.raw;freshTry();restoreStatus(assigned);}
  else{clearAssigned();freshTry();}
  stage.focus({preventScroll:true});
 });
 function position(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*320/r.width,y:(e.clientY-r.top)*240/r.height,tol:12*240/r.height};}
 lcd.addEventListener("pointermove",e=>{
  if(mode!=="try"||state.state!=="trace"||e.pointerType==="touch"||state.buffer)return;
  const o=position(e);if(o.x<S.SCREEN_X.l||o.x>S.SCREEN_X.r||o.y<34||o.y>219)return;
  const x=Number(S.pointAt(state.w,o.x).toFixed(3));
  if(Math.abs(o.y-S.screenY(state.w,state.q.f(x)))>o.tol)return;
  state={...state,cursor:x,committed:true};screen.draw(state);$("lcd-text").textContent=lcText(state);
 });
 lcd.addEventListener("click",e=>{
  if(mode!=="try")return;
  const o=position(e);
  if(state.state==="trace"&&o.x>=S.SCREEN_X.l&&o.x<=S.SCREEN_X.r&&o.y>=34&&o.y<=219){
   const x=Number(S.pointAt(state.w,o.x).toFixed(3));
   if(Math.abs(o.y-S.screenY(state.w,state.q.f(x)))<=o.tol){edited=true;inputX(x);}
  }
  if(state.state==="table"){
   const G=S.grid,first=S.rowStart(state.ask,state.row);
   const pane=o.x>=155?"table":"graph";
   const hitRow=first+Math.floor((o.y-G.top)/G.rowHeight);
   const row=pane==="table"&&o.y>=G.top&&o.y<220?M.clamp(hitRow,state.ask?0:-100,state.ask?state.rows.length:100):state.row;
   shift("table",{pane,row,buffer:"",tableValue:state.ask?(state.rows[row]??null):row});
  }
 });
 const tabs=[$("watch-tab"),$("try-tab")];
 function change(next,takeover=false){
  let restored=null;
  if(mode==="try"&&next==="try"&&!takeover&&activeFork!==null){
   saveLane();activeFork=null;restored=assigned;restore(restored);expression.value=state.raw;
  }else if(mode==="try"&&next==="watch"){saveLane();activeFork=null;}
  else if(mode==="watch"&&next==="try"){
   pause();watchFocus=focused;watchScroll=scrollY;if(focused)focus(false);
   if(!assigned){assigned=capture();delete assigned.status;}
   activeFork=takeover?String(Math.round(time*1000)):null;
   restored=activeFork===null?assigned:forks.get(activeFork)||newFork();
   restore(restored);expression.value=state.raw;
  }
  mode=next;stage.dataset.mode=mode;cache="";
  const watching=next==="watch";
  tabs.forEach((b,i)=>{const active=watching===(i===0);b.setAttribute("aria-selected",String(active));b.tabIndex=active?0:-1;});
  for(const id of ["watch-player","watch-message","watch-side","watch"])$(id).hidden=!watching;
  for(const id of ["try-player","try-side","try"])$(id).hidden=watching;
  shell.setKeys([]);shell.setInteractive(!watching);
  if(watching){hot.replaceChildren();lcd.classList.remove("pick");drawWatch();window.scrollTo(0,watchScroll);if(watchFocus)focus(true);else ensureVisible();}
  else{overlay.hidden=true;freshTry();restoreStatus(restored);fitTry();}
 }
 tabs.forEach((b,i)=>{
  b.addEventListener("click",()=>{change(i?"try":"watch");if(i)stage.focus({preventScroll:true});});
  b.addEventListener("keydown",e=>{
   if(!["ArrowLeft","ArrowRight","Home","End"].includes(e.key))return;
   e.preventDefault();const j=e.key==="Home"?0:e.key==="End"?1:1-i;change(j?"try":"watch");tabs[j].focus();
  });
 });
 $("take-over").addEventListener("click",()=>{
  change("try",!finished());stage.focus({preventScroll:true});
 });
 $("return-watch").addEventListener("click",()=>{change("watch");play.focus({preventScroll:true});});
 document.addEventListener("keydown",e=>{if(e.target!==document.body&&!e.target.closest?.(".qb-calculator-lesson"))return;
  if(e.key==="Escape"&&focused){e.preventDefault();focus(false);$("focus-view").focus();return;}
  if(e.metaKey||e.ctrlKey||e.altKey||e.target.closest("input,textarea,select,a,summary,[contenteditable]"))return;
  const tag=e.target.closest("button");
  if(mode==="watch"){
   if(tag||e.repeat)return;
   const k=e.key.toLowerCase();
   if(k==="k"||k===" "){e.preventDefault();toggle();}else if(k==="j"||k==="l"){e.preventDefault();go(time+(k==="j"?-10:10));}return;
  }
  if(!stage.contains(e.target)&&e.target!==document.body||tag&&(e.key==="Enter"||e.key===" "))return;
  if(e.key==="Tab"&&(tForTab()==="settings"||e.target===stage&&tForTab()==="graph")&&!e.shiftKey){
   if(tForTab()==="settings"&&state.setting===4&&!state.dropdown)return;
   e.preventDefault();press("tab");return;
  }
  const map={Escape:"esc",Enter:"enter",Backspace:"del",Delete:"del",ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down",m:"menu",M:"menu",".":"dot","^":"power","+":"plus","-":"minus","*":"mul","/":"div","(":"lparen",")":"rparen","²":"square"};
  const k=map[e.key]||(/^[0-9xX]$/.test(e.key)?e.key.toLowerCase():"");
  if(k){e.preventDefault();press(k);}
 });
 const tForTab=()=>state.state;
 $("answer-y").addEventListener("input",()=>{edited=true;feedback.textContent="";});
 $("answer-form").addEventListener("submit",e=>{
  e.preventDefault();if(mode!=="try"||!isExercise())return;edited=true;
  const v=readAnswer(answerY.value),shown=Number(M.pretty(target.y).replaceAll("−","-"));
  const ok=v!==null&&(v===shown||v===target.y||Math.abs(v-target.y)<=Math.abs(target.y)*1e-12);
  feedback.className="feedback"+(ok?"is-right":"is-wrong");
  feedback.textContent=ok?"Correct. Read the second coordinate or the entry in the f₁(x) column.":v===practice.x?"You entered x. Read the output next to that input.":"Check the row for x = "+askedX+", or the second coordinate in Trace.";
 });
 seek.max=T.duration;
 change(params.get("mode")==="try"||linked&&params.get("mode")!=="watch"?"try":"watch");
})();
