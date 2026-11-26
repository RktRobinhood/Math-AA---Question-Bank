"use strict";
(function(){
 const $=id=>document.getElementById(id);
 const M=window.CT16Math,S=window.CT16Screen,T=window.CT16Tape,H=window.HandheldTransport;
 const stage=$("stage"),play=$("play"),seek=$("seek"),cap=$("caption");
 const lcd=$("lcd"),canvas=$("drawing"),screen=S.screen(canvas),fields=[$("expression-1"),$("expression-2")],bound=$("bound");
 const pair=(f,g)=>[M.parse(f),M.parse(g,"target")];
 const watchPair=pair("5*1.5^x","12"),defaultTry=pair("60*0.8^x","30"),params=new URLSearchParams(location.search);
 const watchEnd=8,knownWindow={x0:-.5,x1:4.25,y0:-4,y1:34};
 const initial=(raw,end)=>({state:"entry",raw:raw.slice(),q:[null,null],end,active:0,low:null,high:null,cursor:null,mark:null,error:null,typed:"",windows:null});
 let linked=null,unsafe=false,exerciseEnd=8;
 const customLink=["expr","target","end"].some(k=>params.has(k));
 if(customLink){
  try{
   for(const k of ["expr","target","end"])if(params.getAll(k).length!==1)throw Error("Provide one model, target and end time.");
   const q=pair(params.get("expr"),params.get("target")),end=M.parseEnd(params.get("end")),r=M.modelInfo(q,end);
   if(!r.ok)throw Error(r.message);
   linked=q;exerciseEnd=end;
  }catch{unsafe=true;}
 }
 const exercise=linked||defaultTry,goal=M.modelInfo(exercise,exerciseEnd);
 const describe=(q,end,r)=>"For 0 to "+end+" days, "+(q===defaultTry?"stock":"the quantity")+" follows "+M.displayExpr(q[0].raw)+". Find when it first reaches "+(r.increasing?"at least ":"at most ")+M.pretty(q[1].T)+" units.";
 const prompt=describe(exercise,exerciseEnd,goal);
 const sameCurve=(a,b)=>a.A===b.A&&a.B===b.B&&a.T===b.T;
 let mode="watch",state=initial(exercise.map(q=>q.raw),exerciseEnd),edited=false,focused=false,focusConsidered=false,started=false,fresh=true;
 let t=0,playing=false,raf=0,origin=0,cache="",watchFocus=false,watchScroll=0;
 const forks=new Map(),MAX_FORKS=24;
 let activeFork=null,assigned=null;
 function capture(){const display=$("keypad-result");return {state,edited,fresh,answers:answer.map(a=>a.value),feedback:feedback.textContent,gradeClass:feedback.className,status:{text:display.textContent,cls:display.className,hidden:display.hidden}};}
 function restore(d){({state,edited,fresh}=d);answer.forEach((a,i)=>a.value=d.answers[i]);feedback.textContent=d.feedback;feedback.className=d.gradeClass;syncFields();}
 function saveLane(){const d=capture();if(activeFork===null){assigned=d;return;}
  forks.delete(activeFork);forks.set(activeFork,d);
  if(forks.size>MAX_FORKS)forks.delete(forks.keys().next().value);
 }
 function newFork(){return {state:{...snapshot(t).s,fromWatch:true},edited:true,fresh:false,answers:["",""],feedback:"",gradeClass:"feedback"};}
 function restoreStatus(d){if(!d?.status)return;const e=$("keypad-result");e.textContent=d.status.text;e.className=d.status.cls;e.hidden=d.status.hidden;}

 const shell=HandheldShell.mount({host:$("handheld-host"),screen:lcd,label:"TI-Nspire CX II-T Graphs",interactive:false,onKey:key=>press(key)});
 const tabs=[$("watch-tab"),$("try-tab")],steps=$("steps"),hot=$("hotspots");
 const hints={entry:"Enter a function and press Enter to plot. Use the handheld Tab to open the other line.",plotted:"Two curves are needed. Press Menu when both are plotted.",menu:"Choose 6: Analyze Graph.",submenu:"Choose 4: Intersection.",lower:"Place the lower bound just left of one crossing. Type an x-value or move the cursor.",upper:"Choose the upper bound just right of the same crossing.",result:"Read the x-coordinate for the time. Test which whole day first meets the threshold."};
 const syncFields=()=>{fields.forEach((el,i)=>{el.value=state.raw[i];el.setSelectionRange(el.value.length,el.value.length);});bound.value=state.typed;};
 const getWindow=()=>state.windows||M.windowFor(state.q,state.end);
 const fmtPair=z=>"("+M.pretty(z.x)+", "+M.pretty(z.y)+")";
 function labelGraph(s){
  const graphs=s.q.flatMap((p,i)=>p?["f"+(i+1)+" of x = "+M.displayExpr(p.raw)]:[]);
  if(s.state==="entry")graphs.push("Function entry "+(s.active+1)+": "+M.displayExpr(s.raw[s.active]));
  $("lcd-text").textContent=[...graphs,hints[s.state],s.low!=null?"Lower: "+M.pretty(s.low):"",s.typed?"Typed bound: "+s.typed:"",s.cursor!=null?"Cursor: "+M.pretty(s.cursor):"",s.mark?"Intersection "+fmtPair(s.mark):"",s.error||""].filter(Boolean).join(". ");
 }
 function snapshot(time){
  const v={state:"entry",active:0,first:"",second:"",firstPlot:false,secondPlot:false}, key="";
  let lit=key;
  for(const e of T.keys){
   if(time<e.time)break;
   Object.assign(v,e.delta);lit=time<e.time+.30?e.key:"";
  }
  const s={...initial([v.first,v.second],watchEnd),...v,q:[v.firstPlot?watchPair[0]:null,v.secondPlot?watchPair[1]:null],windows:knownWindow};
  return{s,key:lit};
 }
 T.titles.forEach((title,i)=>{
  const li=document.createElement("li"),b=document.createElement("button"),no=document.createElement("span");
  b.type="button";no.textContent="0"+(i+1);b.append(no,document.createTextNode(title));
  b.addEventListener("click",()=>go(T.starts[i]));li.append(b);steps.append(li);
 });
 const duration=T.duration,clock=(x)=>Math.floor(x/60)+":"+String(Math.floor(x)%60).padStart(2,"0"),endClock=clock(Math.round(duration));
 function renderWatch(){
  if(mode!=="watch")return;
  const chapter=T.starts.findLastIndex(start=>t>=start), phrase=T.captionStarts.findLastIndex(start=>t>=start), {s,key}=snapshot(t);
  const keyStamp=[s.state,...s.raw,s.cursor,s.typed,s.low,s.high,chapter,phrase].join("|");
  seek.value=t;seek.setAttribute("aria-valuetext",clock(t)+" of "+endClock);$("clock").textContent=(t>=duration?endClock:clock(t))+" / "+endClock;
  const take=$("take-over"),done=t>=duration-.015;
  take.textContent=done?"Open Try":"Take over";take.setAttribute("aria-label",done?"Open the independent Try exercise":"Take over this calculator scene");
  shell.setKeys(key?[key]:[]);
  $("stage-play").hidden=started||t>0;
  if(cache===keyStamp)return;cache=keyStamp;
  screen.draw(s);labelGraph(s);
  cap.textContent=T.captions[phrase];
  const strip=phrase>=10?"Continuous: 2.16 days · First whole day: 3":phrase===9?"Day 2: 11.25 < 12 · Day 3: 16.875 ≥ 12":phrase===8?"Day 2: 5 · 1.5² = 11.25 < 12":phrase>=6?"Crossing: (2.159…, 12) · x is the time":"Model: 5 · 1.5ˣ · Target: 12 · 0 ≤ x ≤ 8";
  const v=$("watch-equation");v.dataset.visible="true";v.setAttribute("aria-hidden","false");v.textContent=strip;
  [...steps.children].forEach((li,i)=>li.firstElementChild.setAttribute("aria-current",String(i===chapter)));
  fitWatch();
 }
 function go(v){t=M.clamp(Number(v)||0,0,duration);origin=performance.now()-t*1000;renderWatch();labelPlay();}
 function labelPlay(){const label=playing?"Pause":t>=duration-.015?"Replay":"Play";play.textContent=label;play.setAttribute("aria-label",label);play.dataset.playing=String(playing);}
 function pause(){if(playing)t=M.clamp((performance.now()-origin)/1000,0,duration);playing=false;cancelAnimationFrame(raf);labelPlay();renderWatch();}
 function tick(now){if(!playing||mode!=="watch")return;t=M.clamp((now-origin)/1000,0,duration);if(t>=duration){pause();return;}renderWatch();raf=requestAnimationFrame(tick);}
 function fitWatch(){
  if(mode!=="watch")return;
  const h=window.visualViewport?.height||innerHeight,top=Math.max(0,stage.getBoundingClientRect().top)+(document.querySelector(".tabbar")?.offsetHeight||0);
  const occupied=$("watch-message").offsetHeight+$("watch-player").offsetHeight;
  const w=Math.max(82,Math.min(focused?338:304,Math.floor((h-top-occupied-24)*558/1168)));
  stage.style.setProperty("--watch-fit-width",w+"px");
 }
 function focus(v){
  focused=Boolean(v);stage.classList.toggle("ct16-focused",focused);stage.dataset.focused=String(focused);document.body.classList.toggle("ct16-focus-open",focused);
  const b=$("focus-view"),name=focused?"Exit focused view":"Focused view";
  b.setAttribute("aria-pressed",String(focused));b.setAttribute("aria-label",name);b.title=name;b.textContent=focused?"Exit":"⛶";
  document.querySelectorAll(".header,.calc-tabs,.notes,#watch,#try").forEach(e=>e.inert=focused);
  if(focused)stage.scrollTop=0;fitWatch();
 }
 function fitAtEntry(){fitWatch();if(mode==="watch"&&!focused&&shell.body.getBoundingClientRect().width<156)focus(true);}
 const observer=new ResizeObserver(fitWatch);
 for(const e of [$("watch-message"),$("watch-player"),document.querySelector(".header")])observer.observe(e);
 window.addEventListener("resize",fitWatch);
 function start(){
  if(mode!=="watch")return;
  if(!focusConsidered){focusConsidered=true;fitWatch();const r=shell.body.getBoundingClientRect();if(!focused&&(r.width<185||r.top<0))focus(true);}
  if(document.activeElement===$("stage-play"))play.focus({preventScroll:true});
  started=true;$("stage-play").hidden=true;
  if(t>=duration-.015)go(0);
  playing=true;origin=performance.now()-t*1000;labelPlay();raf=requestAnimationFrame(tick);
 }
 function toggle(){if(playing)pause();else start();}
 play.addEventListener("click",toggle);$("stage-play").addEventListener("click",toggle);
 $("back").addEventListener("click",()=>go(t-10));$("next").addEventListener("click",()=>go(t+10));
 $("replay").addEventListener("click",()=>{pause();go(0);start();});seek.addEventListener("input",()=>go(seek.value));
 $("focus-view").addEventListener("click",()=>focus(!focused));
 function jumpMenu(panel,index,action){
  const b=document.createElement("button");
  b.type="button";b.setAttribute("aria-label",panel.rows[index]);b.style.left=panel.x/3.2+"%";
  b.style.top=(panel.y+2+index*panel.h)/2.4+"%";b.style.width=panel.w/3.2+"%";b.style.height=panel.h/2.4+"%";
  b.addEventListener("click",e=>{e.stopPropagation();action();});hot.append(b);
 }
 function show(message="",wrong=false){
  const v=$("keypad-result");v.hidden=!message;v.textContent=message;v.className="feedback "+(wrong?"is-wrong":"is-right");
 }
 function isExercise(){
  try{
   const typed=pair(...state.raw);
   return activeFork===null&&!state.fromWatch&&state.end===exerciseEnd&&sameCurve(typed[0],exercise[0])&&sameCurve(typed[1],exercise[1]);
  }catch{return false;}
 }
 function fitTry(){
  if(mode!=="try")return;
  const h=window.visualViewport?.height||innerHeight,phone=innerWidth<=700;
  const top=Math.max(0,$("handheld-host").getBoundingClientRect().top+scrollY);
  const width=Math.min(phone?267:302,Math.max(phone?158:155,Math.floor((h-top-10)*558/1168)));
  stage.style.setProperty("--retro-try-width",width+"px");
 }
 const tryLayout=new ResizeObserver(fitTry);
 for(const el of [document.querySelector("header"),$("try-player")])tryLayout.observe(el);
 window.addEventListener("resize",fitTry);
 window.visualViewport?.addEventListener("resize",fitTry);
 function renderTry(){
  if(mode!=="try")return;
  screen.draw(state);labelGraph(state);hot.replaceChildren();
  const inExercise=isExercise(),info=M.modelInfo(state.q,state.end);
  $("answer-form").hidden=!inExercise;
  $("checker-context").hidden=inExercise;
  if(!inExercise)$("feedback").textContent="";
  $("reset-keypad").textContent=activeFork===null?"Reset calculator":"Return to assigned Try";
  $("checker-context").textContent=activeFork===null?"Exploration only. Reset the calculator to return to the set exercise.":"Explore the paused example here. Return to assigned Try to use its answer check.";
  $("keypad-problem").textContent=inExercise?prompt:activeFork!==null?"You took over the Watch example. Fit the target within 0 to "+state.end+" days.":info.ok?describe(state.q,state.end,info):"Explore a different model and horizontal target, from 0 to "+state.end+" days.";
  $("try-line").textContent=$("keypad-problem").textContent;
  const b=state.state==="lower"||state.state==="upper";lcd.classList.toggle("pick",b);
  $("bound-form").hidden=!b;$("retry-bounds").hidden=state.state!=="result";
  $("bound-label").textContent=state.state==="lower"?"Lower bound x":"Upper bound x";
  $("keypad-hint").textContent=state.state==="plotted"?state.q.every(Boolean)?"Press Menu on the handheld.":"Press the handheld Tab key to enter the other function.":hints[state.state];
  show(state.error||(state.mark?"Crossing: "+fmtPair(state.mark)+". The x-coordinate is the time.":"")|| (unsafe&&!edited?"The linked model, target or time range was invalid. The original exercise is shown instead.":""),Boolean(state.error||unsafe&&!edited));
  if(state.state==="menu")jumpMenu(S.PANEL.main,5,()=>press("6"));
  if(state.state==="submenu")jumpMenu(S.PANEL.sub,3,()=>press("4"));
 }
 function select(next,properties={}){
  state={...state,state:next,error:null,typed:"",...properties};bound.value="";renderTry();
 }
 function plot(indices){
  const q=state.q.slice(),raw=state.raw.slice();
  let parsing=indices[0];
  try{
   for(const i of indices){parsing=i;q[i]=M.parse(fields[i].value,i===1?"target":"model");raw[i]=q[i].raw;}
   state={...initial(raw,state.end),q,state:"plotted",active:indices.at(-1),fromWatch:state.fromWatch};
   syncFields();renderTry();
  }catch(e){select("entry",{active:parsing,error:"Function "+(parsing+1)+": "+e.message});}
 }
 function analyze(){
  const info=M.modelInfo(state.q,state.end);
  if(!info.ok){select("plotted",{error:info.message,mark:null});return;}
  const {x0,x1}=getWindow();select("lower",{low:null,high:null,cursor:M.clamp((x0+x1)/2,0,state.end),mark:null});
 }
 const readBound=s=>/^[+−-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s.trim())?Number(s.trim().replace("−","-")):NaN;
 function confirm(x){
  if(!state.q.every(Boolean)||!["lower","upper"].includes(state.state))return;
  edited=true;
  if(!Number.isFinite(x)||x<0||x>state.end){show("Enter a bound within the time domain, 0 to "+state.end+" days.",true);return;}
  if(state.state==="lower"){select("upper",{low:x,cursor:x});return;}
  if(x<=state.low){show("The upper bound must be to the right of the lower bound.",true);return;}
  const r=M.solve(state.q,state.low,x,state.end);
  select("result",{cursor:x,high:x,mark:r.ok?{x:r.x,y:r.y}:null,error:r.message||null});
 }
 function editBound(k){
  let v=state.typed;
  if(k==="del")v=v.slice(0,-1);
  else if(["minus","neg","plus"].includes(k)){if(!v)v=k==="plus"?"+":"-";}
  else if(k==="dot"){if(!v.includes("."))v+=".";}
  else if(v.length<18&&/^\d$/.test(k))v+=k;
  else return;
  state.typed=v;bound.value=v;labelGraph(state);screen.draw(state);show();
 }
 function press(k){
  if(mode!=="try")return;
  const w=state.state;
  if(k==="esc"){edited=true;select(w==="submenu"?"menu":state.q.some(Boolean)?"plotted":"entry",{low:null,high:null,cursor:null,mark:null});return;}
  if(k==="tab"){edited=true;fresh=true;select("entry",{active:1-state.active,low:null,high:null,cursor:null,mark:null});return;}
  if(k==="menu"){
   if(state.q.every(Boolean)){edited=true;select("menu",{low:null,high:null,cursor:null,mark:null});}
   else show("Plot both functions first.",true);
   return;
  }
  if(w==="menu"){if(["6","enter","right","select"].includes(k)){edited=true;select("submenu");}return;}
  if(w==="submenu"){if(["4","enter","right","select"].includes(k)){edited=true;analyze();}return;}
  if(w==="lower"||w==="upper"){
   if(k==="enter"||k==="select"){confirm(state.typed?readBound(state.typed):state.cursor);return;}
   if(k==="left"||k==="right"){
    edited=true;const {x0,x1}=getWindow(),step=(x1-x0)/64;
    state.typed="";bound.value="";state.cursor=M.clamp(state.cursor+(k==="left"?-step:step),0,Math.min(x1,state.end));
    screen.draw(state);labelGraph(state);show();
    return;
   }
   edited=true;editBound(k);return;
  }
  if(k==="enter"){edited=true;plot([state.active]);return;}
  if(H.character(k)!==null||k==="del"){
   edited=true;
   const replace=w!=="entry"||fresh;fresh=false;
   H.modify(fields[state.active],k,{replace});
  }
 }
 $("expression-form").addEventListener("submit",e=>{e.preventDefault();edited=true;plot([0,1]);});
 fields.forEach((el,i)=>{
  el.addEventListener("focus",()=>{if(mode==="try")state.active=i;});
  el.addEventListener("input",()=>{if(mode!=="try")return;edited=true;fresh=false;
   const raw=state.raw.slice(),q=state.q.slice();raw[i]=el.value;q[i]=null;state={...initial(raw,state.end),q,active:i,fromWatch:state.fromWatch};renderTry();
  });
 });
 $("bound-form").addEventListener("submit",e=>{e.preventDefault();confirm(readBound(bound.value));});
 bound.addEventListener("input",()=>{if(mode!=="try")return;edited=true;state.typed=bound.value;labelGraph(state);screen.draw(state);});
 $("retry-bounds").addEventListener("click",()=>{edited=true;analyze();});
 function restoreExercise(){
  edited=true;fresh=true;state=initial(exercise.map(q=>q.raw),exerciseEnd);syncFields();
  $("answer-x").value="";$("answer-day").value="";$("feedback").textContent="";renderTry();
 }
 $("reset-keypad").addEventListener("click",()=>{
  if(activeFork!==null){saveLane();activeFork=null;restore(assigned);renderTry();restoreStatus(assigned);}
  else restoreExercise();
  stage.focus({preventScroll:true});
 });
 function pointer(ev){
  const r=canvas.getBoundingClientRect(),xp=(ev.clientX-r.left)*320/r.width,yp=(ev.clientY-r.top)*240/r.height;
  return xp>=S.SCREEN_X.l&&xp<=S.SCREEN_X.r&&yp>=26&&yp<=226?S.pointAt(state.q,xp,getWindow()):null;
 }
 lcd.addEventListener("pointermove",e=>{
  if(mode!=="try"||!lcd.classList.contains("pick")||e.pointerType==="touch"||state.typed)return;
  const x=pointer(e);if(x===null)return;state.cursor=x;screen.draw(state);
 });
 lcd.addEventListener("click",e=>{
  if(mode!=="try"||!lcd.classList.contains("pick"))return;
  const x=pointer(e);if(x!==null)confirm(x);
 });
 function modeTo(next,steal=false){
  let restored=null;
  if(mode==="try"&&next==="try"&&!steal&&activeFork!==null){
   saveLane();activeFork=null;restored=assigned;restore(restored);
  }else if(mode==="try"&&next==="watch"){saveLane();activeFork=null;}
  else if(next==="try"&&mode==="watch"){
   pause();watchFocus=focused;watchScroll=scrollY;if(focused)focus(false);
   if(!assigned){assigned=capture();delete assigned.status;}
   activeFork=steal?String(Math.round(t*1000)):null;
   restored=activeFork===null?assigned:forks.get(activeFork)||newFork();
   restore(restored);
  }
  mode=next;stage.dataset.mode=mode;cache="";
  const watch=mode==="watch";
  tabs.forEach((b,i)=>{const yes=watch===(i===0);b.tabIndex=yes?0:-1;b.setAttribute("aria-selected",String(yes));});
  for(const n of ["watch","watch-side","watch-player","watch-message"])$(n).hidden=!watch;
  for(const n of ["try","try-side","try-player"])$(n).hidden=watch;
  shell.setKeys([]);shell.setInteractive(!watch);
  if(watch){hot.replaceChildren();lcd.classList.remove("pick");window.scrollTo(0,watchScroll);renderWatch();if(watchFocus)focus(true);else fitAtEntry();}
  else{$("stage-play").hidden=true;renderTry();restoreStatus(restored);fitTry();}
 }
 tabs.forEach((b,i)=>{
  b.addEventListener("click",()=>{modeTo(i?"try":"watch");if(i)stage.focus({preventScroll:true});});
  b.addEventListener("keydown",e=>{if(!["ArrowLeft","ArrowRight","Home","End"].includes(e.key))return;e.preventDefault();const next=e.key==="Home"?0:e.key==="End"?1:1-i;modeTo(next?"try":"watch");tabs[next].focus();});
 });
 $("take-over").addEventListener("click",()=>{const done=t>=duration-.015;modeTo("try",!done);stage.focus({preventScroll:true});});
 $("return-watch").addEventListener("click",()=>{modeTo("watch");play.focus({preventScroll:true});});
 document.addEventListener("keydown",e=>{
  if(e.target!==document.body&&!e.target.closest?.(".qb-calculator-lesson"))return;
  if(e.key==="Escape"&&focused){e.preventDefault();focus(false);$("focus-view").focus();return;}
  if(e.metaKey||e.ctrlKey||e.altKey||e.target.closest("input,textarea,select,a,summary,[contenteditable]"))return;
  if(mode==="watch"&&!e.target.closest("button")&&!e.repeat){
   const k=e.key.toLowerCase();if(k==="k"||k===" "){e.preventDefault();toggle();}else if(k==="j"||k==="l"){e.preventDefault();go(t+(k==="j"?-10:10));}
   return;
  }
  if(mode!=="try"||!stage.contains(e.target)&&e.target!==document.body||e.target.closest("button")&&(e.key==="Enter"||e.key===" "))return;
  const keys={Escape:"esc",Enter:"enter",Backspace:"del",Delete:"del",ArrowLeft:"left",ArrowRight:"right",m:"menu",M:"menu",".":"dot","^":"power","+":"plus","-":"minus","*":"mul","/":"div","(":"lparen",")":"rparen","²":"square"};
  const k=keys[e.key]||(/^[0-9xX]$/.test(e.key)?e.key.toLowerCase():"");
  if(k){e.preventDefault();press(k);}
 });
 const answer=[$("answer-x"),$("answer-day")],feedback=$("feedback");
 answer.forEach(a=>a.addEventListener("input",()=>{edited=true;feedback.textContent="";}));
 $("answer-form").addEventListener("submit",e=>{
  e.preventDefault();if(!isExercise())return;edited=true;
  const [continuous,day]=answer.map(a=>a.valueAsNumber);
  if(!Number.isFinite(continuous)||!Number.isInteger(day))return;
  const timeRight=Array.from({length:15},(_,i)=>Number(goal.x.toPrecision(i+3))).some(x=>Math.abs(x-continuous)<=1e-12*Math.abs(x));
  const dayRight=day===goal.day,yes=timeRight&&dayRight;
  feedback.className="feedback "+(yes?"is-right":"is-wrong");
  feedback.textContent=yes?"Both correct. Day "+goal.day+" is the first checkpoint that meets the threshold.":timeRight?"The continuous time is correct. Test the adjacent whole days against the target rather than rounding.":dayRight?"The whole day is correct. Read the x-coordinate at the intersection for the continuous time.":"Use Intersection for the continuous time, then test the adjacent whole days against the target.";
 });
 modeTo(params.get("mode")==="try"?"try":"watch");
window.QBRecordedWatch?.bind(pause);
})();
