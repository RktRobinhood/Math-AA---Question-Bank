"use strict";
(function(){
 const $=id=>document.getElementById(id),M=CT42Math,T=CT42Tape,S=CT42Screen;
 const stage=$("stage"),lcd=$("lcd"),command=$("command"),seek=$("seek"),play=$("play"),screen=S.screen($("drawing"));
 const tabs=[$("watch-tab"),$("try-tab")],fields=["mean","event","a","b"].map($);
 const params=new URLSearchParams(location.search),names=["lambda","event","a","b"],typed=names.some(k=>params.has(k));
 function event(l,kind,a,b=""){
  const lambda=M.number(l),low=M.integer(a),upper=kind==="between"?M.integer(b):null;
  let value=null,rangeNotice="";
  try{value=M.event(lambda,kind,low,upper);}
  catch(e){if(!e.message.includes("reliable numeric range"))throw e;rangeNotice=e.message;}
  return {lambda,kind,a:low,b:upper,value,rangeNotice};
 }
 const original=event("3.5","ge","4"),demonstration=event("6","pmf","6");
 let assigned=original,unsafe=false;
 if(typed)try{
  const kind=params.get("event");
  if(names.slice(0,3).some(k=>params.getAll(k).length!==1)||params.getAll("b").length!==(kind==="between"?1:0))throw Error("Repeated or missing input");
  assigned=event(params.get("lambda"),kind,params.get("a"),params.get("b"));
 }catch{unsafe=true;}
 const fixed=typed||params.get("case")==="poisson-demo"||params.get("example")==="demo";
 const eventFields=e=>[String(e.lambda),e.kind,String(e.a),e.b==null?"":String(e.b)];
 const create=e=>({event:e,fields:eventFields(e),draft:"",history:[],error:"",dirty:false,editStart:0,editEnd:0,answer:"",feedback:"",correct:false});
 const record=(s,result)=>({...s,draft:"",history:[...s.history,result].slice(-8),error:"",editStart:0,editEnd:0});
 let mode="watch",state=create(assigned),practiceState=state,forkState=null,track="practice",attempted=false;
 let started=false,focusConsidered=false,focused=false,t=0,playing=false,origin=0,raf=0,cache="";
 const shell=HandheldShell.mount({host:$("handheld-host"),screen:lcd,label:"TI-Nspire CX II-T Calculator",interactive:false,onKey:press});
 const upperCase=s=>s.replace(/poisspdf/i,"poissPdf").replace(/poisscdf/i,"poissCdf");
 function snapshot(time){
  let s=create(demonstration),key="";
  for(const q of T.keys){
   if(time<q.at)break;
   key=time<q.at+.20?q.key:"";
   if(q.type==="evaluate")s=record(s,M.calculator(s.draft));
   else {const draft=upperCase(s.draft+q.char);s={...s,draft,editStart:draft.length,editEnd:draft.length};}
  }
  return {s,key};
 }
 function describe(s){
  const result=s.history.at(-1);
  $("lcd-text").textContent="Calculator. "+(result?result.expression+" = "+M.fmt(result.value)+". ":"")+("Entry: "+(s.draft?s.draft.replace(/-/g,"−"):"blank")+".")+(s.error?" "+s.error:"");
  lcd.dataset.result=result?M.fmt(result.value):"";
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
  const ch=T.starts.findLastIndex(x=>t>=x),ph=T.clips.findLastIndex(([x])=>t>=x),{s,key}=snapshot(t);
  seek.value=t;$("clock").textContent=clock(t)+" / "+clock(T.duration);seek.setAttribute("aria-valuetext",clock(t)+" of "+clock(T.duration));
  shell.setKeys(key?[key]:[]);$("stage-play").hidden=started||t>=.1;
  const stamp=[s.draft,s.history.length,ch,ph].join("|");
  if(stamp===cache)return;cache=stamp;
  screen.draw(s);describe(s);$("caption").textContent=T.clips[ph][1];
  const eq=$("watch-equation"),line=T.hints[ph];
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
  focused=Boolean(v);stage.classList.toggle("ct42-focused",focused);stage.dataset.focused=String(focused);document.body.classList.toggle("ct42-focus-open",focused);
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
 function notice(el,value,type){
  el.hidden=!value;el.textContent=value;el.className="feedback"+(type?" "+type:"");
 }
 function renderTry(){
  if(mode!=="try")return;
  screen.draw(state);describe(state);
  const v=state.event,task="Use λ = "+M.neat(v.lambda)+" to find "+M.label(v.kind,v.a,v.b)+".";
  $("keypad-problem").textContent=$("try-line").textContent=track==="fork"?"Continue the worked calculator entry.":task;
  const kind=fields[1].value;
  $("a-caption").textContent=kind==="between"?"Lower count":"Count";
  $("b-label").hidden=kind!=="between";fields[3].required=kind==="between";
  const latest=state.history.at(-1);
  notice($("keypad-result"),state.error||(!state.draft&&latest?latest.expression+" = "+M.fmt(latest.value):""),state.error?"is-wrong":"is-right");
  notice($("event-warning"),state.modelError||(unsafe&&!attempted?"This link did not supply a valid event. Showing the original exercise.":state.dirty?"Use this event to apply your changes.":v.rangeNotice),"");
  $("answer-form").hidden=track==="fork"||state.dirty||v.value===null;
  $("feedback").textContent=track==="practice"&&!state.dirty?state.feedback:"";
  $("feedback").className="feedback "+(state.correct?"is-right":state.feedback?"is-wrong":"");
 }
 function sync(){
  fields.forEach((e,i)=>e.value=state.fields[i]);command.value=state.draft;
  command.setSelectionRange(state.editStart,state.editEnd);
  $("answer").value=state.answer;
 }
 function putDraft(raw,start,end=start){
  state={...state,draft:raw,error:"",editStart:start,editEnd:end};
  command.value=raw;command.setSelectionRange(start,end);renderTry();
 }
 function evaluate(){
  try{
   state=record(state,M.calculator(state.draft));command.value=state.draft;renderTry();
  }catch(e){state={...state,error:e.message};renderTry();}
 }
 function press(k){
  if(mode!=="try")return;
  if(k==="enter"||k==="return"){evaluate();return;}
  if(k==="esc"){putDraft("",0);return;}
  if(k==="menu"){state={...state,error:"This lesson uses typed Calculator commands. Type the command instead of opening a distribution menu."};renderTry();return;}
  const pos=document.activeElement===command?[command.selectionStart,command.selectionEnd]:[state.editStart,state.editEnd];
  if(k==="left"||k==="right"){
   const at=M.clamp(k==="left"?(pos[0]===pos[1]?pos[0]-1:pos[0]):(pos[0]===pos[1]?pos[1]+1:pos[1]),0,state.draft.length);
   putDraft(state.draft,at);return;
  }
  const char=({lparen:"(",rparen:")",comma:",",dot:".",minus:"-",neg:"-",plus:"+",space:" "})[k]||(/^[a-z0-9]$/.test(k)?k:null);
  if(!char&&k!=="del")return;
  const start=k==="del"&&pos[0]===pos[1]?Math.max(0,pos[0]-1):pos[0],insert=char||"";
  const next=state.draft.slice(0,start)+insert+state.draft.slice(pos[1]);
  if(next.length<=100)putDraft(next,start+insert.length);
 }
 for(const name of ["select","keyup","pointerup"])command.addEventListener(name,()=>{
  if(command.value===state.draft)state={...state,editStart:command.selectionStart,editEnd:command.selectionEnd};
 });
 command.addEventListener("input",()=>{state={...state,draft:command.value,error:"",editStart:command.selectionStart,editEnd:command.selectionEnd};renderTry();});
 $("command-form").addEventListener("submit",e=>{e.preventDefault();evaluate();});
 fields.forEach(e=>e.addEventListener("input",()=>{
  state={...state,fields:fields.map(f=>f.value),dirty:true,modelError:""};renderTry();
 }));
 $("model-form").addEventListener("submit",e=>{
  e.preventDefault();attempted=true;
  try{state=create(event(...fields.map(f=>f.value)));sync();renderTry();stage.focus({preventScroll:true});}
  catch(e2){state={...state,modelError:e2.message};renderTry();}
 });
 $("answer").addEventListener("input",e=>{state={...state,answer:e.target.value,feedback:"",correct:false};renderTry();});
 $("answer-form").addEventListener("submit",e=>{
  e.preventDefault();
  if(state.dirty||track!=="practice"||state.event.value===null)return;
  const yes=M.grade($("answer").value,state.event.value),right=state.event.kind==="gt"||state.event.kind==="ge";
  state={...state,answer:$("answer").value,correct:yes,feedback:yes?"Correct. Your count bounds match the event.":right?"Not quite. Check whether the cutoff itself belongs in the event.":"Not quite. Check which counts the event includes."};
  renderTry();
 });
 $("reset-keypad").addEventListener("click",()=>{
  attempted=true;if(track==="fork")forkState=null;track="practice";state=create(assigned);practiceState=state;
  sync();renderTry();stage.focus({preventScroll:true});
 });
 function modeTo(next,takeOver=false){
  const previous=mode;
  if(previous==="try"&&next==="watch"){
   if(document.activeElement===command)state={...state,editStart:command.selectionStart,editEnd:command.selectionEnd};
   if(track==="fork")forkState=state;else practiceState=state;
   window.scrollTo(0,0);
  }
  if(previous==="watch"&&next==="try"){
   pause();if(focused)focus(false);
   track=takeOver&&!fixed?"fork":"practice";
   if(track==="fork"&&!forkState)forkState=snapshot(t).s;
   state=track==="fork"?forkState:practiceState;sync();
  }
  mode=next;stage.dataset.mode=mode;cache="";
  const watch=mode==="watch";
  tabs.forEach((b,i)=>{const yes=watch===(i===0);b.tabIndex=yes?0:-1;b.setAttribute("aria-selected",String(yes));});
  for(const id of ["watch","watch-message","watch-side","watch-player"])$(id).hidden=!watch;
  for(const id of ["try","try-side","try-player"])$(id).hidden=watch;
  shell.setKeys([]);shell.setInteractive(!watch);
  if(watch){renderWatch();labelPlay();fitAtEntry();}
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
  const keys={Escape:"esc",Enter:"enter",Backspace:"del",Delete:"del",ArrowLeft:"left",ArrowRight:"right",".":"dot",",":"comma","(":"lparen",")":"rparen","-":"minus","+":"plus"};
  const k=keys[e.key]||(/^[a-z0-9]$/i.test(e.key)?e.key.toLowerCase():"");
  if(k){e.preventDefault();press(k);}
 });
 modeTo(params.get("mode")==="try"?"try":"watch");fitAtEntry();
})();
