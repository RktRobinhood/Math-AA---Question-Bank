"use strict";
(function(){
 const $=id=>document.getElementById(id),M=CT13Math,T=CT13Tape,S=CT13Screen,H=HandheldTransport;
 const stage=$("stage"),lcd=$("lcd"),canvas=$("drawing"),screen=S.screen(canvas),play=$("play"),seek=$("seek"),inputs=[$("curve-f"),$("curve-g")],bound=$("bound");
 const params=new URLSearchParams(location.search),names=["f","g","op","lower","upper"],scope=[$("op"),$("low"),$("high")];
 const parsePair=(f,g)=>[M.parse(f),M.parse(g,false)];
 function model(raw,op,a,b){
  const curves=parsePair(...raw),l=M.number(a),u=M.number(b);
  const checked=M.solve(curves,l,u,op);
  return {curves,op,limits:[l,u],checked};
 }
 let challenge=model(["((x+1)(x^2-9))/(x+1)","0"],"lt","-4","4"),unsafe=false;
 const typed=names.some(k=>params.has(k));
 if(typed)try{
  if(names.some(k=>params.getAll(k).length!==1))throw Error("Incomplete or repeated inputs");
  challenge=model([params.get("f"),params.get("g")],params.get("op"),params.get("lower"),params.get("upper"));
 }catch{unsafe=true;}
 const fixed=typed||params.get("case")==="inequality-demo"||params.get("example")==="demo";
 const watchModel=model(["(x^2-4)/(x-1)","0"],"le","-4","4"),watchLimits=watchModel.limits;
 const watchPoints=[M.rootsIn(watchModel.curves,-3,-1),M.rootsIn(watchModel.curves,1.5,3)];
 const create=(raw,preset,op)=>({state:"entry",raw:[...raw],slot:0,preset,op,curves:[],low:null,high:null,cursor:null,draft:"",points:[],excluded:false,menuIndex:0,subIndex:0,error:"",probe:"",dirty:false,settings:[op,...preset.map(String)]});
 const initial=()=>create(challenge.curves.map(c=>c.raw),challenge.limits,challenge.op);
 let mode="watch",state=initial(),edited=false,started=false,focusConsidered=false,focused=false;
 let practiceState=state,forkState=null,tryTrack="practice";
 let t=0,playing=false,origin=0,raf=0,cache="";
 const shell=HandheldShell.mount({host:$("handheld-host"),screen:lcd,label:"TI-Nspire CX II-T Graphs",interactive:false,onKey:k=>press(k)});
 const hot=$("hotspots"),tabs=[$("watch-tab"),$("try-tab")];
 const hints={
  entry:"Plot both sides before comparing.",plotted:"Use Menu → Analyze Graph → Intersection to bracket one crossing.",
  menu:"Choose 6: Analyze Graph.",submenu:"Choose 4: Intersection.",
  lower:"Type or point to a bound left of one intersection. Press Enter.",upper:"Choose a bound right of that intersection. Press Enter.",
  result:"Record the x-coordinate. Also check where either side is undefined."
 };
 function snapshot(time){
  const s=create(["",""],watchLimits,"le");let key="",shown=0,count=0;
  for(const ev of T.keys){
   if(time<ev.t)break;
   const {shown:n,count:r,...delta}=ev.delta;
   Object.assign(s,delta);
   if(n!==undefined)shown=n;if(r!==undefined)count=r;
   key=time<ev.t+.19?ev.key:"";
  }
  s.curves=watchModel.curves.slice(0,shown);s.points=watchPoints.slice(0,count);
  return {s,key};
 }
 function graphLabel(s){
  const limit=s.low!=null?" Lower: "+M.pretty(s.low)+".":"",draft=s.draft?" Typed "+s.draft+".":"";
  const results=s.points.map(p=>" Intersection: ("+M.pretty(p.x)+", "+M.pretty(p.y)+").").join("");
  const prior=s.excluded?" Lesson note: f₁ is undefined at x equals 1.":"";
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
  const ch=T.starts.findLastIndex(x=>t>=x),ph=T.captions.findLastIndex(x=>t>=x.t),{s,key}=snapshot(t);
  seek.value=t;$("clock").textContent=clock(t)+" / "+clock(T.duration);seek.setAttribute("aria-valuetext",clock(t)+" of "+clock(T.duration));
  shell.setKeys(key?[key]:[]);$("stage-play").hidden=started||t>=.1;
  const stamp=[s.state,s.raw,s.cursor,s.draft,s.menuIndex,s.subIndex,s.points.length,s.excluded,ch,ph].join("|");
  if(stamp===cache)return;cache=stamp;
  screen.draw(s);graphLabel(s);$("caption").textContent=T.captions[ph].text;
  const eq=$("watch-equation");
  const line=ph>=12?M.format(watchModel.checked.intervals):ph===11?"−2 and 2 included · 1 excluded":ph===10?"x = 1.5: −3.5 < 0 · x = 3: 2.5 > 0":ph===9?"x = −3: −1.25 < 0 · x = 0: 4 > 0":ph>=7?"x − 1 = 0 at x = 1 → exclude":ph===6?"Second crossing: (2, 0)":ph===4?"First crossing: (−2, 0)":"";
  eq.textContent=line;eq.dataset.visible=String(Boolean(line));eq.setAttribute("aria-hidden",String(!line));
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
  focused=Boolean(v);stage.classList.toggle("ct13-focused",focused);stage.dataset.focused=String(focused);document.body.classList.toggle("ct13-focus-open",focused);
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
 function checkerEnabled(){return tryTrack!=="fork"&&!state.dirty;}
 const goal=()=>{
  const a=state.curves.length===2?state.curves.map(c=>c.raw):state.raw;
  const condition="f₁(x) "+M.symbol[state.op]+" f₂(x) on ["+state.preset.map(M.pretty).join(", ")+"]";
  return tryTrack==="fork"?"Exploring the Watch graphs.":condition+"; f₁(x) = "+M.displayExpr(a[0])+", f₂(x) = "+M.displayExpr(a[1])+".";
 };
 function renderTry(){
  if(mode!=="try")return;
  screen.draw(state);graphLabel(state);hot.replaceChildren();
  lcd.classList.toggle("pick",picking());$("bound-form").hidden=!picking();
  $("bound-label").textContent=state.state==="lower"?"Lower bound x":"Upper bound x";
  $("probe-form").hidden=state.curves.length!==2||picking()||state.dirty;
  $("probe-result").textContent=state.probe;
  $("keypad-hint").textContent=state.dirty&&state.curves.length===2?"Plot both curves to apply your edits.":hints[state.state];
  $("keypad-problem").textContent=$("try-line").textContent=goal();
  if(bound.value!==state.draft)bound.value=state.draft;
  $("answer-form").hidden=!checkerEnabled();
  if(!checkerEnabled())$("feedback").textContent="";
  const invalid=unsafe&&!edited?"This link did not supply a valid problem. Showing the original exercise.":"";
  const latest=state.points.at(-1);
  setMessage(state.error||invalid||(state.state==="result"&&latest?"Intersection: ("+M.pretty(latest.x)+", "+M.pretty(latest.y)+").":""),Boolean(state.error||invalid));
  if(state.state==="menu")jumpMenu(S.PANEL.main,5,()=>press("analysis"));
  if(state.state==="submenu")jumpMenu(S.PANEL.sub,3,()=>press("intersection"));
 }
 function select(next,properties={}){
  state={...state,state:next,error:"",draft:"",...properties};renderTry();
 }
 function syncInputs(){
  inputs.forEach((field,i)=>{if(field.value!==state.raw[i])field.value=state.raw[i];});
  scope.forEach((field,i)=>{if(field.value!==state.settings[i])field.value=state.settings[i];});
 }
 function plotBoth(){
  edited=true;const raw=inputs.map(e=>e.value),settings=scope.map(e=>e.value);
  try{
   const m=model(raw,...settings);state={...create(m.curves.map(q=>q.raw),m.limits,m.op),curves:m.curves,state:"plotted"};
   $("feedback").textContent="";$("solution").value="";syncInputs();
  }catch(e){state={...create(raw,state.preset,state.op),dirty:true,settings,error:e.message};}
  renderTry();
 }
 function plotOne(){
  const i=state.slot;
  if(i===1&&!state.curves[0]){state.error="Plot f₁ first, or use Plot both curves.";renderTry();return;}
  edited=true;
  try{
   const q=M.parse(inputs[i].value,i===0),raw=[...state.raw];raw[i]=q.raw;
   const curves=i&&state.curves[0]?[state.curves[0],q]:[q];
   if(curves.length===2){plotBoth();return;}
   select("plotted",{raw,curves,points:[],excluded:false,probe:""});syncInputs();
  }catch(e){state.error=e.message;renderTry();}
 }
 function beginIntersection(){
  const {x0,x1}=M.graphWindow(state.curves,state.preset);
  if(state.curves.length!==2){state.error="Plot both equations before finding an intersection.";renderTry();return;}
  select("lower",{low:null,high:null,cursor:(x0+x1)/2,excluded:false});
 }
 function confirm(x){
  if(!picking()||state.curves.length!==2)return;
  edited=true;
  if(!Number.isFinite(x)||Math.abs(x)>M.LIMIT){state.error="Type a finite bound between −20 and 20.";renderTry();return;}
  if(state.state==="lower"){select("upper",{low:x,cursor:x});return;}
  try{
   const p=M.rootsIn(state.curves,state.low,x);
   const others=state.points.filter(old=>Math.abs(old.x-p.x)>1e-8);
   select("result",{high:x,cursor:x,points:[...others,p].slice(-8)});
  }catch(e){state.error=e.message;renderTry();}
 }
 function numericDraft(k){
  if(!["del","neg","minus","plus","dot"].includes(k)&&!/^[0-9]$/.test(k))return false;
  if(document.activeElement!==bound)bound.setSelectionRange(bound.value.length,bound.value.length);
  return H.modify(bound,k);
 }
 function press(k){
  if(mode!=="try")return;const w=state.state;
  if(k==="esc"){edited=true;select(w==="submenu"?"menu":state.curves.length?"plotted":"entry",{low:null,high:null,cursor:null,excluded:false});return;}
  if(k==="menu"&&state.curves.length){edited=true;select("menu",{menuIndex:0,low:null,high:null,cursor:null,excluded:false});return;}
  if(k==="tab"){
   edited=true;
   const slot=w==="entry"?1-state.slot:state.curves.length===1?1:0;
   select("entry",{slot,excluded:false,low:null,high:null});return;
  }
  if(w==="menu"){
   if(k==="up"||k==="down"){select("menu",{menuIndex:(state.menuIndex+(k==="down"?1:S.PANEL.main.rows.length-1))%S.PANEL.main.rows.length});return;}
   if(k==="analysis"||k==="6"||(["enter","right","select"].includes(k)&&state.menuIndex===5))select("submenu",{subIndex:0});return;
  }
  if(w==="submenu"){
   if(k==="left"){select("menu",{menuIndex:5});return;}
   if(k==="up"||k==="down"){select("submenu",{subIndex:(state.subIndex+(k==="down"?1:S.PANEL.sub.rows.length-1))%S.PANEL.sub.rows.length});return;}
   if(k==="intersection"||k==="4"||(["enter","right","select"].includes(k)&&state.subIndex===3))beginIntersection();return;
  }
  if(picking()){
   if(k==="enter"||k==="select"){confirm(state.draft?M.number(state.draft):state.cursor);return;}
   if(k==="left"||k==="right"){
    const {x0,x1}=M.graphWindow(state.curves,state.preset,state.low,state.high),step=(x1-x0)/60;
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
  state={...create(raw,state.preset,state.op),slot:i,curves:still,settings:scope.map(e=>e.value),dirty:true};
  renderTry();
 }));
 scope.forEach(el=>el.addEventListener("input",()=>{
  edited=true;state={...state,dirty:true,settings:scope.map(o=>o.value)};renderTry();
 }));
 $("probe-form").addEventListener("submit",e=>{
  e.preventDefault();
  const x=M.number($("probe").value);if(state.curves.length!==2)return;
  if(!Number.isFinite(x)||x<state.preset[0]||x>state.preset[1])state.probe="Choose a value inside the problem's domain.";
  else{
   const r=M.compare(state.curves,x),place="At x = "+M.pretty(x)+", ";
   state.probe=place+(r.sign===null?"a function is undefined. Leave this value out.":r.sign===0?"the functions are equal.":r.sign<0?"f₁ is below f₂.":"f₁ is above f₂.");
  }
  renderTry();
 });
 bound.addEventListener("input",()=>{
  if(mode!=="try"||!picking())return;
  edited=true;state.draft=bound.value;state.error="";
  const d=M.number(state.draft);if(Number.isFinite(d)&&Math.abs(d)<=M.LIMIT)state.cursor=d;
  screen.draw(state);graphLabel(state);setMessage("");
 });
 $("bound-form").addEventListener("submit",e=>{e.preventDefault();confirm(state.draft?M.number(state.draft):state.cursor);});
 $("reset-keypad").addEventListener("click",()=>{
  edited=true;if(tryTrack==="fork")forkState=null;tryTrack="practice";state=initial();practiceState=state;syncInputs();
  $("answer-form").reset();$("probe").value="";$("feedback").textContent="";renderTry();stage.focus({preventScroll:true});
 });
 function pointer(e){
  const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*320/r.width,y=(e.clientY-r.top)*240/r.height;
  return x>=S.SCREEN_X.l&&x<=S.SCREEN_X.r&&y>=26&&y<=226?S.pointAt(state,x):null;
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
   if(tryTrack==="fork")forkState=state;else practiceState=state;
   window.scrollTo(0,0);
  }
  if(next==="try"&&preceding==="watch"){
   pause();if(focused)focus(false);
   tryTrack=steal&&!fixed?"fork":"practice";
   if(tryTrack==="fork"){
    if(!forkState)forkState=snapshot(t).s;
    state=forkState;
   }else state=practiceState;
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
  const v=$("feedback");let yes=false;
  try{
   const expected=M.solve(parsePair(...state.raw),...state.preset,state.op).intervals;
   yes=M.grade($("solution").value,expected);
   v.textContent=yes?"Correct. Your intervals include the right points and exclude every undefined value.":"Not quite. Check which curve is above on each interval, and check whether each boundary belongs.";
  }catch(e){v.textContent=e.message;}
  v.className="feedback "+(yes?"is-right":"is-wrong");
 });
 modeTo(params.get("mode")==="try"?"try":"watch");fitAtEntry();
window.QBRecordedWatch?.bind(pause);
})();
