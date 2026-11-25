"use strict";
(function(){
 const $=id=>document.getElementById(id),M=CT30Math,T=CT30Tape,S=CT30Screen;
 const stage=$("stage"),lcd=$("lcd"),canvas=$("drawing"),data=$("data"),screen=S.screen(canvas),seek=$("seek"),play=$("play");
 const params=new URLSearchParams(location.search),typed=params.has("data");
 const original=M.parse("-9,-7,2,2,3,5,7,8,8,8,9,12"),worked=M.parse("0,1,2,2,3,4,4,5,6,6,12,13");
 let assigned=original,unsafe=false;
 if(typed)try{
  if(params.getAll("data").length!==1)throw Error("Repeated input");
  assigned=M.parse(params.get("data"));
 }catch{unsafe=true;}
 const fixed=typed||params.get("case")==="boxplot-demo"||params.get("example")==="demo";
 const create=values=>({summary:M.describe(values),menu:"",selection:0,plot:"dot",mark:null,draft:M.listText(values),dirty:false,error:""});
 let mode="watch",state=create(assigned),practiceState=state,forkState=null,track="practice",attemptedLoad=false;
 let started=false,focusConsidered=false,focused=false,t=0,playing=false,origin=0,raf=0,cache="";
 const shell=HandheldShell.mount({host:$("handheld-host"),screen:lcd,label:"TI-Nspire CX II-T Data & Statistics",interactive:false,onKey:press});
 const hot=$("hotspots"),tabs=[$("watch-tab"),$("try-tab")];
 const watchState=create(worked);
 function snapshot(time){
  const s={...watchState};let key="";
  for(const [at,k,delta] of T.keys){if(time<at)break;Object.assign(s,delta);key=time<at+.31?k:"";}
  return {s,key};
 }
 const markText=s=>{const p=S.pointFor(s);return p?S.formatMark(p.id,p.n):"";};
 const describe=s=>{
  const kind={dot:"Dot plot",modified:"Modified box plot",standard:"Standard box plot"}[s.plot];
  const row=s.menu==="main"?S.PANEL.main.rows[s.selection]:s.menu==="type"?S.PANEL.type.rows[s.selection]:s.menu==="props"?S.propName(s):"";
  const point=markText(s);
  lcd.dataset.plot=s.plot;lcd.dataset.menu=s.menu;
  $("lcd-text").textContent=kind+" of reading. "+(row?"Menu selection: "+row+". ":point?point+". ":"");
 };
 const steps=$("steps");
 T.titles.forEach((name,i)=>{
  const li=document.createElement("li"),b=document.createElement("button"),no=document.createElement("span");
  b.type="button";no.textContent="0"+(i+1);b.append(no,document.createTextNode(name));
  b.addEventListener("click",()=>go(T.starts[i]));li.append(b);steps.append(li);
 });
 const clock=x=>Math.floor(x/60)+":"+String(Math.floor(x)%60).padStart(2,"0");
 function renderWatch(){
  if(mode!=="watch")return;
  const ch=T.starts.findLastIndex(x=>t>=x),ph=T.captions.findLastIndex(([x])=>t>=x),{s,key}=snapshot(t);
  seek.value=t;$("clock").textContent=clock(t)+" / "+clock(T.duration);seek.setAttribute("aria-valuetext",clock(t)+" of "+clock(T.duration));
  shell.setKeys(key?[key]:[]);$("stage-play").hidden=started||t>=.1;
  const stamp=[s.menu,s.selection,s.plot,s.mark,ch,ph].join("|");
  if(stamp===cache)return;cache=stamp;
  screen.draw(s);describe(s);$("caption").textContent=T.captions[ph][1];
  const line=["","","Q₁ = 2 · Med = 4 · Q₃ = 6","IQR = 4 · 1.5 × IQR = 6","2 − 6 = −4 · 6 + 6 = 12","Lower fence −4 ≠ left whisker 0","Math rule: 12 stays in · 13 is out","","Standard whiskers: 0 and 13","","Modified: 0 to 12 · 13 separate"][ph];
  const eq=$("watch-equation");
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
  focused=Boolean(v);stage.classList.toggle("ct30-focused",focused);stage.dataset.focused=String(focused);document.body.classList.toggle("ct30-focus-open",focused);
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
 function buttonAt(panel,index,label,fn){
  const b=document.createElement("button");b.type="button";b.setAttribute("aria-label",label);
  b.style.left=panel.x/3.2+"%";b.style.top=(panel.y+2+index*panel.h)/2.4+"%";b.style.width=panel.w/3.2+"%";b.style.height=panel.h/2.4+"%";
  b.addEventListener("click",e=>{e.stopPropagation();fn();});hot.append(b);
 }
 function setMessage(value="",wrong=false){
  const li=$("keypad-result");li.hidden=!value;li.textContent=value;li.className="feedback "+(wrong?"is-wrong":"is-right");
 }
 function renderTry(){
  if(mode!=="try")return;
  screen.draw(state);describe(state);hot.replaceChildren();
  const plot=state.plot,menu=state.menu;
  const welcome=track==="fork"?"Exploring the Watch data.":"Find the fences, modified whiskers and outliers for this list.";
  $("keypad-problem").textContent=$("try-line").textContent=welcome;
  $("keypad-hint").textContent=state.dirty?"Load list to apply your changes.":menu==="main"?"Choose Plot Type or Plot Properties.":menu==="type"?"Choose 2: Box Plot.":menu==="props"?"Select the item by name.":plot==="dot"?"Open Menu → 1: Plot Type → 2: Box Plot.":"Compare the two box plot modes in Plot Properties.";
  $("answer-form").hidden=track!=="practice"||state.dirty;
  $("trace-help").hidden=Boolean(menu)||plot==="dot";
  const fallback=unsafe&&!attemptedLoad?"This link did not contain a valid list. Showing the original practice data.":"";
  setMessage(state.error||fallback||(!menu&&markText(state)),Boolean(state.error||fallback));
  if(menu==="main"){
   buttonAt(S.PANEL.main,0,"1: Plot Type",()=>press("1"));buttonAt(S.PANEL.main,1,"2: Plot Properties",()=>press("2"));
  }
  if(menu==="type"){
   buttonAt(S.PANEL.type,0,"1: Dot Plot",()=>press("1"));buttonAt(S.PANEL.type,1,"2: Box Plot",()=>press("2"));
  }
  if(menu==="props")buttonAt(S.PANEL.props,0,S.propName(state),()=>press("enter"));
 }
 function update(props={}){
  state={...state,error:"",...props};renderTry();
 }
 const menuRows=menu=>menu==="main"?S.PANEL.main.rows.length:menu==="type"?S.PANEL.type.rows.length:1;
 function inspect(id){
  if(!id||mode!=="try"||state.menu)return;
  update({mark:id});
 }
 function press(k){
  if(mode!=="try")return;
  const menu=state.menu;
  if(k==="menu"){update({menu:"main",selection:0,mark:null});return;}
  if(k==="esc"){update({menu:menu==="props"||menu==="type"?"main":"",selection:0,mark:null});return;}
  if(menu){
   if(k==="up"||k==="down"){const n=menuRows(menu);update({selection:(state.selection+(k==="down"?1:n-1))%n});return;}
   if(k==="left"&&menu!=="main"){update({menu:"main",selection:menu==="type"?0:1});return;}
   const pick=["enter","select","right"].includes(k)?state.selection+1:Number(k);
   if(menu==="main"&&(pick===1||pick===2)){
    if(pick===2&&state.plot==="dot"){update({error:"Make a box plot before changing its whiskers."});return;}
    update({menu:pick===1?"type":"props",selection:0,mark:null});return;
   }
   if(menu==="type"&&(pick===1||pick===2)){
    update({menu:"",plot:pick===1?"dot":"modified",mark:null});return;
   }
   if(menu==="props"&&["enter","select","right"].includes(k)){update({menu:"",plot:state.plot==="modified"?"standard":"modified",mark:null});return;}
   return;
  }
  if((k==="left"||k==="right")&&state.plot!=="dot"){
   const marks=S.details(state).slice().sort((a,b)=>a.x-b.x),i=marks.findIndex(x=>x.id===state.mark);
   const j=i<0?(k==="right"?0:marks.length-1):M.clamp(i+(k==="right"?1:-1),0,marks.length-1);
   inspect(marks[j]?.id);
  }
 }
 function nearest(e){
  const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*320/r.width,y=(e.clientY-r.top)*240/r.height;
  const d=m=>Math.hypot(m.x-x,Math.max(31,m.y)-y),marks=S.details(state).slice().sort((a,b)=>d(a)-d(b));
  return marks[0]&&d(marks[0])<22?marks[0].id:null;
 }
 // Inspect individual marks only after a user gesture. Hover updates the LCD
 // without writing the quiz or emitting an additional live-region announcement.
 lcd.addEventListener("pointermove",e=>{
  if(mode!=="try"||state.menu||e.pointerType==="touch")return;
  const id=nearest(e);if(id&&id!==state.mark){state={...state,mark:id};screen.draw(state);describe(state);}
 });
 lcd.addEventListener("click",e=>{if(mode==="try"&&!state.menu&&!e.target.closest("button"))inspect(nearest(e));});
 data.addEventListener("input",e=>{
  if(mode!=="try")return;
  state={...state,draft:e.target.value,dirty:true,error:""};renderTry();
 });
 $("data-form").addEventListener("submit",e=>{
  e.preventDefault();attemptedLoad=true;
  try{
   state=create(M.parse(data.value));data.value=state.draft;$("answer-form").reset();$("feedback").textContent="";
   renderTry();stage.focus({preventScroll:true});
  }catch(e){update({dirty:true,error:e.message});}
 });
 $("answer-form").addEventListener("input",()=>{$("feedback").textContent="";});
 $("answer-form").addEventListener("submit",e=>{
  e.preventDefault();if(track!=="practice"||state.dirty)return;
  const v=$("feedback");
  try{
   const result=M.grade(["fence-low","fence-high","whisker-low","whisker-high","outliers"].map(id=>$(id).value),state.summary);
   const missing=[],ok=result.fences&&result.whiskers&&result.outliers;
   if(!result.fences)missing.push("recalculate Q₁ − 1.5 × IQR and Q₃ + 1.5 × IQR");
   if(!result.whiskers)missing.push("use observations, not cutoffs, for both whisker ends");
   if(!result.outliers)missing.push("include only observations strictly beyond a fence");
   v.textContent=ok?"Correct. Fences are cutoffs; modified whiskers end at observed values.":"Check your work: "+missing.join("; ")+".";
   v.className="feedback "+(ok?"is-right":"is-wrong");
  }catch(e2){v.textContent=e2.message;v.className="feedback is-wrong";}
 });
 $("reset-keypad").addEventListener("click",()=>{
  attemptedLoad=true;if(track==="fork")forkState=null;track="practice";state=create(assigned);practiceState=state;
  data.value=state.draft;$("answer-form").reset();$("feedback").textContent="";renderTry();stage.focus({preventScroll:true});
 });
 function modeTo(next,takeOver=false){
  const previous=mode;
  if(previous==="try"&&next==="watch"){
   if(track==="fork")forkState=state;else practiceState=state;
   window.scrollTo(0,0);
  }
  if(previous==="watch"&&next==="try"){
   pause();if(focused)focus(false);
   track=takeOver&&!fixed?"fork":"practice";
   if(track==="fork"&&!forkState)forkState=snapshot(t).s;
   state=track==="fork"?forkState:practiceState;
   data.value=state.draft;
  }
  mode=next;stage.dataset.mode=mode;cache="";
  const watch=mode==="watch";
  tabs.forEach((b,i)=>{const yes=watch===(i===0);b.tabIndex=yes?0:-1;b.setAttribute("aria-selected",String(yes));});
  for(const id of ["watch","watch-message","watch-side","watch-player"])$(id).hidden=!watch;
  for(const id of ["try","try-side","try-player"])$(id).hidden=watch;
  shell.setKeys([]);shell.setInteractive(!watch);
  if(watch){hot.replaceChildren();renderWatch();labelPlay();fitAtEntry();}
  else{$("stage-play").hidden=true;renderTry();}
 }
 tabs.forEach((b,i)=>{
  b.addEventListener("click",()=>{modeTo(i?"try":"watch");if(i)stage.focus({preventScroll:true});});
  b.addEventListener("keydown",e=>{if(!["ArrowLeft","ArrowRight","Home","End"].includes(e.key))return;e.preventDefault();const j=e.key==="Home"?0:e.key==="End"?1:1-i;modeTo(j?"try":"watch");tabs[j].focus();});
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
  const keys={Escape:"esc",Enter:"enter",ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down",m:"menu",M:"menu"};
  const k=keys[e.key]||(/^[0-9]$/.test(e.key)?e.key:"");
  if(k){e.preventDefault();press(k);}
 });
 modeTo(params.get("mode")==="try"?"try":"watch");fitAtEntry();
})();
