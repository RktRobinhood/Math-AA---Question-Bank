"use strict";
(function(){
 const $=id=>document.getElementById(id),M=CT55Math,T=CT55Tape,S=CT55Screen,H=HandheldTransport;
 const stage=$("stage"),lcd=$("lcd"),canvas=$("drawing"),screen=S.screen(canvas),play=$("play"),seek=$("seek"),inputs=[$("curve-f"),$("curve-g")],bound=$("bound");
 const params=new URLSearchParams(location.search),names=["f","g","lower","upper"];
 let challenge={curves:[M.parse("x^2+1"),M.parse("5")],limits:[0,3]},unsafe="";
 const hasCustom=names.some(k=>params.has(k));
 if(hasCustom)try{
  if(names.some(k=>params.getAll(k).length!==1))throw Error("Incomplete or repeated inputs");
  const [l,u]=[M.number(params.get("lower")),M.number(params.get("upper"))];
  if(!(l>=-M.LIMIT&&u<=M.LIMIT&&u-l>=1e-8))throw Error("Invalid bounds");
  const curves=[M.parse(params.get("f")),M.parse(params.get("g"))];
  M.between(...curves,l,u); // Do not offer an assigned checker for an unresolved linked task.
  challenge={curves,limits:[l,u]};
 }catch(e){unsafe=e.code==="CT55_PRECISION"?e.message+" The original exercise is shown.":"This link had incomplete or invalid curves or bounds. The original exercise is shown.";}
 const fixed=hasCustom||params.get("case")==="area-between-demo"||params.get("example")==="demo";
 const watchCurves=[M.parse("x+1"),M.parse("3")],watchLimits=[0,5];
 const region=(curves,left,right)=>({left,right,area:M.between(...curves,left,right).area});
 const watchRegions=[region(watchCurves,0,2),region(watchCurves,2,5)];
 const create=(raw,preset)=>({state:"entry",raw:[...raw],slot:0,preset,curves:[],low:null,high:null,cursor:null,draft:"",regions:[],markCross:false,menuIndex:0,subIndex:0,error:""});
 const initial=()=>create(challenge.curves.map(c=>c.raw),challenge.limits);
 const goal="Find the area between f₁(x) = "+M.displayExpr(challenge.curves[0].raw)+" and f₂(x) = "+M.displayExpr(challenge.curves[1].raw)+" from "+M.pretty(challenge.limits[0])+" to "+M.pretty(challenge.limits[1])+".";
 const workedTask="Continue the worked example: area between f₁(x) = x + 1 and f₂(x) = 3 from 0 to 5.";
 const answer=$("area-answer"),feedback=$("feedback"),FORK_LIMIT=24,forks=new Map();
 let mode="watch",state=initial(),edited=false,started=false,focusConsidered=false,focused=false;
 let activeFork=null,practice={state,value:answer.value,message:feedback.textContent,style:feedback.className};
 function saveFork(key,s){
  forks.delete(key);forks.set(key,s);
  if(forks.size>FORK_LIMIT)forks.delete(forks.keys().next().value);
 }
 function restorePractice(){
  state=practice.state;answer.value=practice.value;feedback.className=practice.style;feedback.textContent=practice.message;
 }
 let t=0,playing=false,origin=0,raf=0,cache="";
 const shell=HandheldShell.mount({host:$("handheld-host"),screen:lcd,label:"TI-Nspire CX II-T Graphs",interactive:false,onKey:k=>press(k)});
 const hot=$("hotspots"),tabs=[$("watch-tab"),$("try-tab")];
 const hints={
  entry:"Enter both functions to plot them.",plotted:"Open Menu. Choose Analyze Graph, then Bounded Area.",
  menu:"Choose Analyze Graph.",submenu:"Choose Bounded Area by name.",
  lower:"Type or point to the lower bound, then press Enter.",upper:"Type or point to the upper bound, then press Enter.",
  result:"Record this area. If there is another region, measure it separately, then add."
 };
 function snapshot(time){
  const s=create(["",""],watchLimits);let key="",shown=0,count=0;
  for(const ev of T.keys){
   if(time<ev.time)break;
   const {shown:n,count:r,...delta}=ev.delta;
   Object.assign(s,delta);
   if(n!==undefined)shown=n;if(r!==undefined)count=r;
   key=time<ev.time+.26?ev.key:"";
  }
  s.curves=watchCurves.slice(0,shown);s.regions=watchRegions.slice(0,count);
  return {s,key};
 }
 function graphLabel(s){
  const limit=s.low!=null?" Lower: "+M.pretty(s.low)+".":"",draft=s.draft?" Typed "+s.draft+".":"";
  const results=s.regions.map(p=>" Area from "+M.pretty(p.left)+" to "+M.pretty(p.right)+": "+M.pretty(p.area)+".").join("");
  const prior=s.markCross?" Lesson marker: the curves cross at x equals 2.":"";
  const menu=s.state==="menu"?" Selected: "+S.PANEL.main.rows[s.menuIndex]+".":s.state==="submenu"?" Selected: "+S.PANEL.sub.rows[s.subIndex]+".":"";
  $("lcd-text").textContent=(s.state==="entry"?"Function "+(s.slot+1)+" entry "+M.displayExpr(s.raw[s.slot]):s.curves.map((q,i)=>"Graph "+(i+1)+": "+M.displayExpr(q.raw)).join("; "))+". "+hints[s.state]+menu+limit+draft+results+prior+(s.error?" "+s.error:"");
 }
 const steps=$("steps");
 T.titles.forEach((name,i)=>{
  const li=document.createElement("li"),b=document.createElement("button"),no=document.createElement("span");
  b.type="button";no.textContent="0"+(i+1);b.append(no,document.createTextNode(name));
  b.addEventListener("click",()=>go(T.starts[i]));li.append(b);steps.append(li);
 });
 const clock=x=>Math.floor(x/60)+":"+String(Math.floor(x)%60).padStart(2,"0");
 function renderWatch(){
  if(mode!=="watch")return;
  const ch=T.starts.findLastIndex(x=>t>=x),ph=T.captionStarts.findLastIndex(x=>t>=x),{s,key}=snapshot(t);
  seek.value=t;$("clock").textContent=clock(t)+" / "+clock(T.duration);seek.setAttribute("aria-valuetext",clock(t)+" of "+clock(T.duration));
  shell.setKeys(key?[key]:[]);$("stage-play").hidden=started||t>=.1;
  const stamp=[s.state,s.raw,s.cursor,s.draft,s.menuIndex,s.subIndex,s.regions.length,s.markCross,ch,ph].join("|");
  if(stamp===cache)return;cache=stamp;
  screen.draw(s);graphLabel(s);$("caption").textContent=T.captions[ph];
  const eq=$("watch-equation");
  eq.textContent=ph>=11?"2 + 4.5 = 6.5 square units":ph>=10?"Right region: 4.5":ph>=7?"Left region: 2":ph===2?"x + 1 = 3  →  x = 2":"";
  eq.dataset.visible=String(ph>=7||ph===2);eq.setAttribute("aria-hidden",String(ph<7&&ph!==2));
  [...steps.children].forEach((li,i)=>li.firstElementChild.setAttribute("aria-current",String(i===ch)));
 }
 const atEnd=()=>t>=T.duration-.025;
 function labelPlay(){
  const name=playing?"Pause":atEnd()?"Replay":"Play";play.textContent=name;play.setAttribute("aria-label",name);play.dataset.playing=String(playing);
  const take=$("take-over"),opensPractice=atEnd()||fixed;take.textContent=opensPractice?"Open Try":"Take over";
  take.setAttribute("aria-label",opensPractice?"Open independent Try exercise":"Take over the calculator");
 }
 function go(v){t=M.clamp(Number(v)||0,0,T.duration);origin=performance.now()-t*1000;renderWatch();labelPlay();}
 function pause(){if(playing)t=M.clamp((performance.now()-origin)/1000,0,T.duration);playing=false;cancelAnimationFrame(raf);labelPlay();renderWatch();}
 function tick(now){if(!playing||mode!=="watch")return;t=M.clamp((now-origin)/1000,0,T.duration);if(t>=T.duration){pause();return;}renderWatch();raf=requestAnimationFrame(tick);}
 function fitWatch(){
  if(mode!=="watch")return;
  const h=window.visualViewport?.height||innerHeight,top=Math.max(0,stage.getBoundingClientRect().top)+(document.querySelector(".tabbar")?.offsetHeight||0);
  const occupied=$("watch-message").offsetHeight+$("watch-player").offsetHeight;
  const w=Math.max(82,Math.min(focused?338:304,Math.floor((h-top-occupied-29)*558/1168)));
  stage.style.setProperty("--watch-fit-width",w+"px");
 }
 function focus(v){
  focused=Boolean(v);stage.classList.toggle("ct55-focused",focused);stage.dataset.focused=String(focused);document.body.classList.toggle("ct55-focus-open",focused);
  const b=$("focus-view"),name=focused?"Exit focused view":"Focused view";
  b.setAttribute("aria-pressed",String(focused));b.setAttribute("aria-label",name);b.title=name;b.textContent=focused?"Exit":"⛶";
  if(focused)stage.scrollTop=0;fitWatch();
 }
 function fitAtEntry(){fitWatch();if(mode==="watch"&&!focused&&!focusConsidered&&shell.body.getBoundingClientRect().width<156)focus(true);}
 const observer=new ResizeObserver(fitWatch);
 for(const e of [$("watch-message"),$("watch-player"),document.querySelector(".header")])observer.observe(e);
 window.addEventListener("resize",fitWatch);
 window.visualViewport?.addEventListener("resize",fitWatch);
 function start(){
  if(mode!=="watch")return;
  if(!focusConsidered){
   focusConsidered=true;fitWatch();const r=shell.body.getBoundingClientRect();if(!focused&&(r.width<185||r.top<0))focus(true);
  }
  if(document.activeElement===$("stage-play"))play.focus({preventScroll:true});
  started=true;$("stage-play").hidden=true;
  if(atEnd())go(0);
  playing=true;origin=performance.now()-t*1000;labelPlay();raf=requestAnimationFrame(tick);
 }
 function toggle(){if(playing)pause();else start();}
 $("stage-play").addEventListener("click",toggle);play.addEventListener("click",toggle);seek.addEventListener("input",()=>go(seek.value));
 $("back").addEventListener("click",()=>go(t-10));$("next").addEventListener("click",()=>go(t+10));$("replay").addEventListener("click",()=>{pause();go(0);start();});
 $("focus-view").addEventListener("click",()=>focus(!focused));
 function jumpMenu(panel,index,fn){
  const b=document.createElement("button");b.type="button";b.setAttribute("aria-label",panel.rows[index]);
  b.style.left=panel.x/3.2+"%";b.style.top=(panel.y+2+index*panel.h)/2.4+"%";b.style.width=panel.w/3.2+"%";b.style.height=panel.h/2.4+"%";
  b.addEventListener("click",e=>{e.stopPropagation();fn();});hot.append(b);
 }
 function setMessage(text="",wrong=false){
  const v=$("keypad-result");v.hidden=!text;v.textContent=text;v.className="feedback "+(wrong?"is-wrong":"is-right");
 }
 const picking=()=>state.state==="lower"||state.state==="upper";
 const same=(r,p)=>r.length===p.length&&r.every((x,i)=>x===p[i]);
 function checkerEnabled(){
  if(activeFork!==null)return false;
  try{return state.raw.every((raw,i)=>same(M.parse(raw).p,challenge.curves[i].p))&&same(state.preset,challenge.limits);}
  catch{return false;}
 }
 function renderTry(){
  if(mode!=="try")return;
  screen.draw(state);graphLabel(state);hot.replaceChildren();
  lcd.classList.toggle("pick",picking());$("bound-form").hidden=!picking();$("retry-bounds").hidden=state.state!=="result";
  $("bound-label").textContent=state.state==="lower"?"Lower bound x":"Upper bound x";
  $("keypad-hint").textContent=hints[state.state];
  if(bound.value!==state.draft)bound.value=state.draft;
  const fork=activeFork!==null,grade=checkerEnabled();$("answer-form").hidden=!grade;$("checker-context").hidden=grade;
  $("keypad-problem").textContent=$("try-line").textContent=fork?workedTask:goal;
  $("reset-keypad").textContent=fork?"Return to assigned Try":"Reset calculator";
  $("checker-context").textContent=grade?"":fork?"This copy is for exploration. Return to assigned Try to use its answer check.":"Exploration only. Reset calculator to return to the assigned answer check.";
  if(!grade)$("feedback").textContent="";
  const invalid=edited?"":unsafe;
  const latest=state.regions.at(-1);
  setMessage(state.error||invalid||(state.state==="result"&&latest?"Area from "+M.pretty(latest.left)+" to "+M.pretty(latest.right)+": "+M.pretty(latest.area)+" square units.":""),Boolean(state.error||invalid));
  if(state.state==="menu")jumpMenu(S.PANEL.main,5,()=>press("analysis"));
  if(state.state==="submenu")jumpMenu(S.PANEL.sub,6,()=>press("bounded"));
 }
 function select(next,properties={}){
  state={...state,state:next,error:"",draft:"",...properties};renderTry();
 }
 function syncInputs(){inputs.forEach((field,i)=>{if(field.value!==state.raw[i])field.value=state.raw[i];});}
 function plotBoth(){
  edited=true;
  const raw=inputs.map(e=>e.value);
  try{const curves=raw.map(e=>M.parse(e));state={...create(curves.map(q=>q.raw),state.preset),curves,state:"plotted"};syncInputs();}
  catch(e){state={...create(raw,state.preset),error:e.message};}
  renderTry();
 }
 function plotOne(){
  const i=state.slot;
  edited=true;
  try{
   const q=M.parse(inputs[i].value),raw=[...state.raw];raw[i]=q.raw;
   const curves=i&&state.curves[0]?[state.curves[0],q]:[q];
   select("plotted",{raw,curves,regions:[],markCross:false});syncInputs();
  }catch(e){state.error=e.message;renderTry();}
 }
 function beginArea(){
  const {x0,x1}=M.windowFor(state.curves,state.preset);
  if(state.curves.length!==2){state.error="Plot two curves before measuring the area between them.";renderTry();return;}
  select("lower",{low:null,high:null,cursor:(x0+x1)/2,markCross:false});
 }
 function confirm(x){
  if(!picking()||state.curves.length!==2)return;
  edited=true;
  if(!Number.isFinite(x)||Math.abs(x)>M.LIMIT){state.error="Type a finite bound between −20 and 20.";renderTry();return;}
  if(state.state==="lower"){select("upper",{low:x,cursor:x});return;}
  try{
   const result=M.between(...state.curves,state.low,x);
   if(result.crossings.length)throw Error("The upper curve changes in this interval. In this practice viewer, split at the crossing and measure one region at a time.");
   const p={left:state.low,right:x,area:result.area};
   const others=state.regions.filter(old=>old.left!==p.left||old.right!==p.right);
   select("result",{high:x,cursor:x,regions:[...others,p].slice(-8)});
  }catch(e){state.error=e.message;renderTry();}
 }
 function numericDraft(k){
  if(!["del","neg","minus","plus","dot"].includes(k)&&!/^[0-9]$/.test(k))return false;
  if(document.activeElement!==bound)bound.setSelectionRange(bound.value.length,bound.value.length);
  return H.modify(bound,k);
 }
 function press(k){
  if(mode!=="try")return;const w=state.state;
  if(k==="esc"){edited=true;select(w==="submenu"?"menu":state.curves.length?"plotted":"entry",{low:null,high:null,cursor:null,markCross:false});return;}
  if(k==="menu"&&state.curves.length){edited=true;select("menu",{menuIndex:0,low:null,high:null,cursor:null,markCross:false});return;}
  if(k==="tab"){
   edited=true;
   const slot=w==="entry"?1-state.slot:state.curves.length===1?1:0;
   select("entry",{slot,markCross:false,low:null,high:null});return;
  }
  if(w==="menu"){
   if(k==="up"||k==="down"){select("menu",{menuIndex:(state.menuIndex+(k==="down"?1:S.PANEL.main.rows.length-1))%S.PANEL.main.rows.length});return;}
   if(k==="analysis"||k==="6"||(["enter","right","select"].includes(k)&&state.menuIndex===5))select("submenu",{subIndex:0});return;
  }
  if(w==="submenu"){
   if(k==="left"){select("menu",{menuIndex:5});return;}
   if(k==="up"||k==="down"){select("submenu",{subIndex:(state.subIndex+(k==="down"?1:S.PANEL.sub.rows.length-1))%S.PANEL.sub.rows.length});return;}
   if(k==="bounded"||(["enter","right","select"].includes(k)&&state.subIndex===6))beginArea();return;
  }
  if(picking()){
   if(k==="enter"||k==="select"){confirm(state.draft?M.number(state.draft):state.cursor);return;}
   if(k==="left"||k==="right"){
    const {x0,x1}=M.windowFor(state.curves,state.preset,state.low,state.high),step=(x1-x0)/60;
    edited=true;state.cursor=M.clamp(state.cursor+(k==="left"?-step:step),x0,x1);state.draft="";state.error="";renderTry();return;
   }
   if(numericDraft(k))return;
   return;
  }
  if(k==="enter"){if(w==="entry")plotOne();return;}
  if(H.character(k)!==null||k==="del"){
   edited=true;const field=inputs[state.slot];H.modify(field,k,{replace:w!=="entry"});
  }
 }
 $("expression-form").addEventListener("submit",e=>{e.preventDefault();plotBoth();});
 inputs.forEach((field,i)=>field.addEventListener("input",()=>{
  if(mode!=="try")return;
  edited=true;const raw=inputs.map(f=>f.value),still=state.curves[0]&&i===1?[state.curves[0]]:[];
  state={...create(raw,state.preset),slot:i,curves:still};
  // On the second line the first plotted curve stays visible while typing.
  renderTry();
 }));
 bound.addEventListener("input",()=>{
  if(mode!=="try"||!picking())return;
  edited=true;state.draft=bound.value;state.error="";
  const d=M.number(state.draft);if(Number.isFinite(d)&&Math.abs(d)<=M.LIMIT)state.cursor=d;
  screen.draw(state);graphLabel(state);setMessage("");
 });
 $("bound-form").addEventListener("submit",e=>{e.preventDefault();confirm(state.draft?M.number(state.draft):state.cursor);});
 $("retry-bounds").addEventListener("click",()=>{edited=true;beginArea();});
 $("reset-keypad").addEventListener("click",()=>{
  if(activeFork!==null){saveFork(activeFork,state);activeFork=null;restorePractice();}
  else{edited=true;state=initial();$("answer-form").reset();feedback.textContent="";}
  syncInputs();renderTry();stage.focus({preventScroll:true});
 });
 function pointer(e){
  const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*320/r.width,y=(e.clientY-r.top)*240/r.height;
  if(!(x>=S.SCREEN_X.l&&x<=S.SCREEN_X.r&&y>=26&&y<=226))return null;
  const raw=S.pointAt(state,x),{x0,x1,y0,y1}=M.windowFor(state.curves,state.preset,state.low,state.high);
  const deltaX=Math.min(7,Math.max(2,3*320/r.width))*(x1-x0)/300;
  const deltaY=Math.min(11,4*240/r.height)*(y1-y0)/200;
  const yCoord=y1-(y-26)*(y1-y0)/200;
  let crossings;
  try{crossings=M.between(...state.curves,x0,x1).crossings;}
  catch(e){if(e.code==="CT55_PRECISION")return raw;throw e;}
  const nearby=crossings.filter(z=>Math.abs(z-raw)<=deltaX&&Math.abs(state.curves[0].f(z)-yCoord)<=deltaY);
  return nearby.sort((a,b)=>Math.abs(a-raw)-Math.abs(b-raw))[0]??raw;
 }
 lcd.addEventListener("pointermove",e=>{
  if(mode!=="try"||!picking()||state.draft||e.pointerType==="touch")return;
  const x=pointer(e);if(x===null)return;state.cursor=x;screen.draw(state);graphLabel(state);
 });
 lcd.addEventListener("click",e=>{
  if(mode!=="try"||!picking()||e.target.closest("button"))return;
  const x=pointer(e);if(x!==null)confirm(x);
 });
 function modeTo(next,steal=false){
  const preceding=mode;
  if(preceding==="try"&&next==="watch"){
   if(activeFork===null)practice={state,value:answer.value,message:feedback.textContent,style:feedback.className};
   else saveFork(activeFork,state);
   window.scrollTo(0,0);
  }
  if(next==="try"&&preceding==="watch"){
   pause();if(focused)focus(false);
   activeFork=steal&&!fixed&&!atEnd()?t.toFixed(6):null;
   if(activeFork===null)restorePractice();
   else{
    state=forks.get(activeFork)||snapshot(t).s;
    saveFork(activeFork,state);answer.value="";feedback.textContent="";
   }
   syncInputs();
  }
  mode=next;stage.dataset.mode=mode;cache="";
  const watch=mode==="watch";
  tabs.forEach((b,i)=>{const yes=watch===(i===0);b.tabIndex=yes?0:-1;b.setAttribute("aria-selected",String(yes));});
  for(const id of ["watch","watch-message","watch-side","watch-player"])$(id).hidden=!watch;
  for(const id of ["try","try-side","try-player"])$(id).hidden=watch;
  shell.setKeys([]);shell.setInteractive(!watch);
  if(watch){hot.replaceChildren();lcd.classList.remove("pick");renderWatch();labelPlay();fitAtEntry();}
  else{$("stage-play").hidden=true;renderTry();}
 }
 tabs.forEach((b,i)=>{
  b.addEventListener("click",()=>{modeTo(i?"try":"watch");if(i)stage.focus({preventScroll:true});});
  b.addEventListener("keydown",e=>{if(!["ArrowLeft","ArrowRight","Home","End"].includes(e.key))return;e.preventDefault();const v=e.key==="Home"?0:e.key==="End"?1:1-i;modeTo(v?"try":"watch");tabs[v].focus();});
 });
 $("take-over").addEventListener("click",()=>{modeTo("try",!atEnd());stage.focus({preventScroll:true});});
 $("return-watch").addEventListener("click",()=>{modeTo("watch");play.focus({preventScroll:true});});
 document.addEventListener("keydown",e=>{
  if(e.target!==document.body&&!e.target.closest?.(".qb-calculator-lesson"))return;
  if(e.key==="Escape"&&focused){e.preventDefault();focus(false);$("focus-view").focus({preventScroll:true});return;}
  if(e.metaKey||e.ctrlKey||e.altKey||e.target.closest("input,textarea,select,a,summary,[contenteditable]"))return;
  if(mode==="watch"&&!e.target.closest("button")&&!e.repeat){
   const k=e.key.toLowerCase();if(k==="k"||k===" "){e.preventDefault();toggle();}else if(k==="j"||k==="l"){e.preventDefault();go(t+(k==="j"?-10:10));}return;
  }
  if(mode!=="try"||(!stage.contains(e.target)&&e.target!==document.body)||e.target.closest("button")&&(e.key==="Enter"||e.key===" "))return;
  const keys={Escape:"esc",Enter:"enter",Backspace:"del",Delete:"del",ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down",m:"menu",M:"menu",".":"dot","^":"power","+":"plus","-":"minus","*":"mul","/":"div","(":"lparen",")":"rparen","²":"square"};
  const k=keys[e.key]||(/^[0-9xX]$/.test(e.key)?e.key.toLowerCase():"");
  if(k){e.preventDefault();press(k);}
 });
 $("answer-form").addEventListener("input",()=>{edited=true;$("feedback").textContent="";});
 $("answer-form").addEventListener("submit",e=>{
  e.preventDefault();if(!checkerEnabled())return;edited=true;
  const entered=answer.valueAsNumber;
  let expected;
  try{expected=M.between(...challenge.curves,...challenge.limits).area;}
  catch(e){feedback.className="feedback is-wrong";feedback.textContent=e.message;return;}
  const correct=expected===0?entered===0:[expected,...Array.from({length:10},(_,i)=>Number(expected.toPrecision(i+3)))].some(y=>Math.abs(entered-y)<=1e-10*Math.abs(y));
  const v=$("feedback");v.className="feedback "+(correct?"is-right":"is-wrong");
  v.textContent=correct?"Correct. You found the total area between the curves.":"Not quite. Check the original bounds and add the area of every region.";
 });
 modeTo(params.get("mode")==="try"?"try":"watch");fitAtEntry();
})();
