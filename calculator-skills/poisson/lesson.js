"use strict";
(function(){
 const $=id=>document.getElementById(id), M=CT42Math, T=CT42Tape, S=CT42Screen, media=CT42Media;
 const watch=$("watch"), stage=$("watch-stage"), surface=$("watch-surface"), pane=$("watch-device-pane");
 const play=$("play"), seek=$("seek"), overlay=$("play-feedback"), speed=$("play-rate"), steps=$("steps");
 const lcd=$("watch-lcd"), screen=S.screen($("drawing")), tryLcd=$("try-lcd"), command=$("command");
 const watchKeys=HandheldShell.mount({host:$("watch-host"),screen:lcd,label:"TI-Nspire CX II-T Watch",interactive:false});
 const tryKeys=HandheldShell.mount({host:$("try-host"),screen:tryLcd,label:"TI-Nspire CX II-T Try",onKey:(key,e)=>press(key,e.detail===0)});
 const transport=CalculatorWatchPlayer.mount({player:stage,surface,play,seek,expand:$("fullscreen"),feedback:overlay,active:()=>!watch.hidden});
 const keyNames={lparen:"(",rparen:")",comma:",",minus:"−",enter:"Enter",dot:".",up:"↑",down:"↓",left:"←",right:"→",del:"Del",menu:"Menu",esc:"Esc"};
 const problems=["3 per 10 min → 20 min","λ = 6 · P(X = 6)","λ = 6 · P(3 ≤ X ≤ 6)","λ = 6 · P(X > 6)","λ = 6 · P(X ≥ 6)"];
 const cap=s=>s.replace(/poisspdf/i,"poissPdf").replace(/poisscdf/i,"poissCdf");
 const timecode=t=>Math.floor(t/60)+":"+String(Math.floor(t)%60).padStart(2,"0");
 const clamp=t=>M.clamp(Number(t)||0,0,tape.duration);
 const frameKey="qb-calculator-watch-frame";
 let framePref="screen", now=0, rate=1, stamp=-1, activeClip=-1, activeBeat=-1, raf=0, reference=0, running=false;
 try{if(localStorage.getItem(frameKey)==="full")framePref="full";}catch{}
 const manifest=$("ct42-narration-manifest"), recording=manifest?media.decode(manifest.textContent,T):null;
 let tape=T, audio=null, mediaReady=false, pending=false, generation=0, startTimer=0;
 const visibleTry=()=>watch.hidden;

 function frame(next,save=false){
  framePref=next;stage.dataset.frame=next;pane.scrollTop=0;
  if(save)try{localStorage.setItem(frameKey,next);}catch{}
  $("view-screen").setAttribute("aria-pressed",String(next==="screen"));
  $("view-full").setAttribute("aria-pressed",String(next==="full"));
  fit();
 }
 $("view-screen").onclick=()=>frame("screen",true);
 $("view-full").onclick=()=>frame("full",true);
 function fit(){
  if(watch.hidden)return;
  const fullStage=stage.matches(":fullscreen,.watch-fullscreen-fallback");
  const max=(window.visualViewport?.height||innerHeight)-surface.getBoundingClientRect().top-(fullStage?0:window.scrollY);
  const nav=fullStage?0:(document.querySelector(".tabbar")?.offsetHeight||0);
  const available=max-$("watch-player").offsetHeight-nav-$("key-strip").offsetHeight-surface.querySelector(".worked-prompt").offsetHeight-23;
  const full=Math.min(267,Math.max(142,Math.floor(available*558/1168)));
  const scroll=framePref==="full"&&Math.ceil(full*1168/558)>available+2;
  $("full-fit-note").hidden=!scroll;pane.tabIndex=scroll?0:-1;
  if(scroll)pane.setAttribute("aria-label","Full calculator. Scroll to see the keypad.");
  else pane.removeAttribute("aria-label");
  stage.style.setProperty("--normal-full-fit",full+"px");
  stage.style.setProperty("--normal-full-max-h",scroll?Math.max(134,available-17)+"px":"none");
  stage.style.setProperty("--normal-screen-fit",Math.min(402,Math.max(184,Math.floor(available*4/3)))+"px");
 }
 const resize=new ResizeObserver(fit);
 [$("watch-player"),surface.querySelector(".worked-prompt"),document.querySelector("main>.header")].forEach(el=>resize.observe(el));
 window.addEventListener("resize",fit);
 window.visualViewport?.addEventListener("resize",fit);
 document.addEventListener("fullscreenchange",fit);
 $("fullscreen").addEventListener("click",()=>requestAnimationFrame(fit));
 const fullResize=new MutationObserver(fit);
 fullResize.observe(stage,{attributes:true,attributeFilter:["class"]});

 function render(t){
  seek.value=String(t);seek.setAttribute("aria-valuetext",timecode(t)+" of "+timecode(tape.duration));
  $("clock").textContent=timecode(t)+" / "+timecode(tape.duration);
  const beat=tape.starts.findLastIndex(x=>t>=x), clip=tape.clips.findLastIndex(([x])=>t>=x);
  const keyIndex=tape.keys.findLastIndex(q=>q.at<=t), key=tape.keys[keyIndex], current=key&&key.at>=tape.starts[beat]?key:null;
  $("active-key").textContent=current?(keyNames[current.key]||current.key.toUpperCase()):"—";
  watchKeys.setKeys(current&&t-current.at<(current.key==="enter"?.42:.23)?[current.key]:[]);
  if(stamp!==keyIndex||activeBeat!==beat){
   const state={draft:"",history:[],error:""};
   let active=null;
   for(let i=0;i<=keyIndex;i++){
    const item=tape.keys[i];
    if(item.type==="evaluate"){
     const result=M.calculator(state.draft);state.history.push(result);state.draft="";
     if(item.at>=tape.starts[beat])active=result;
    }else state.draft=cap(state.draft+item.char);
   }
   screen.draw(state);lcd.dataset.result=active?M.fmt(active.value):"";
   $("lcd-text").textContent="Calculator. "+(state.history.at(-1)?state.history.at(-1).expression+" = "+M.fmt(state.history.at(-1).value)+". ":"")+"Entry: "+(state.draft||"blank")+".";
   stamp=keyIndex;
  }
  if(clip!==activeClip){
   $("caption").textContent=tape.clips[clip][1];
   $("worked-event").textContent=clip===1?"3 × (20 ÷ 10) → λ = 6":problems[beat];activeClip=clip;
  }
  if(beat!==activeBeat){
   [...steps.children].forEach((li,i)=>li.firstElementChild.setAttribute("aria-current",String(i===beat)));
   activeBeat=beat;
  }
 }
 T.titles.forEach((title,i)=>{
  const li=document.createElement("li"), b=document.createElement("button"), no=document.createElement("span");
  b.type="button";no.textContent=String(i+1).padStart(2,"0");b.append(no,document.createTextNode(title));
  b.onclick=()=>go(tape.starts[i]);li.append(b);steps.append(li);
 });
 $("transcript").textContent=T.clips.map(x=>x[1]).join(" ");
 function configure(next){
  now=media.remap(now,tape,next);tape=next;seek.max=String(tape.duration);
  stamp=-2;activeClip=-1;activeBeat=-1;
  $("transcript").textContent=tape.clips.map(x=>x[1]).join(" ");
  render(now);label();
 }
 function label(){
  const text=running||pending?"Pause":now>=tape.duration-.002?"Replay":"Play";
  play.setAttribute("aria-label",text);play.title=text;play.dataset.playing=String(running);
  play.querySelector(".play-icon").hidden=running||pending;play.querySelector(".pause-icon").hidden=!running&&!pending;
  if(now<=.005&&!running&&!pending&&overlay.dataset.initial==="true"){overlay.dataset.action="play";overlay.hidden=false;}
 }
 function audioSeek(){
  if(audio&&mediaReady&&Math.abs(audio.currentTime-now)>.0005)audio.currentTime=now;
 }
 function go(t){
  now=clamp(t);reference=performance.now()-now*1000/rate;audioSeek();
  if(now>.005&&overlay.dataset.initial==="true"){overlay.dataset.initial="false";transport.clear();}
  render(now);label();fit();
 }
 function stampNow(ts=performance.now()){
  return running?clamp(audio&&mediaReady?audio.currentTime:(ts-reference)*rate/1000):now;
 }
 function stop(capture=true){
  if(capture)now=stampNow();
  generation++;pending=false;running=false;clearTimeout(startTimer);cancelAnimationFrame(raf);
  audio?.pause();render(now);label();
 }
 function finish(){
  now=tape.duration;stop(false);
 }
 function tick(ts){
  if(!running||watch.hidden)return;
  now=stampNow(ts);
  if(now>=tape.duration){finish();return;}
  render(now);raf=requestAnimationFrame(tick);
 }
 function status(message=""){
  $("audio-state").textContent=message;$("audio-state").hidden=!message;
 }
 function playCaptions(){
  reference=performance.now()-now*1000/rate;running=true;pending=false;label();raf=requestAnimationFrame(tick);
 }
 function fallback(message){
  const continuePlayback=!watch.hidden&&(pending||running);
  stop();
  const rejected=audio;audio=null;mediaReady=false;
  if(rejected){rejected.remove();rejected.removeAttribute("src");rejected.load();}
  configure(T);watch.dataset.clock="caption";$("caption-beta").hidden=false;
  status(message+" Using captions instead.");
  if(continuePlayback&&now<tape.duration-.002)playCaptions();
 }
 function adopt(){
  if(!audio||audio.readyState<2)return false;
  const actual=media.actual(recording,audio.duration);
  if(!actual){fallback("Narration does not match its measured cues.");return false;}
  if(!mediaReady){
   mediaReady=true;configure(actual);audioSeek();watch.dataset.clock="audio";$("caption-beta").hidden=true;status();
  }else if(Math.abs(tape.duration-actual.duration)>.001){
   now=stampNow();configure(actual);audioSeek();
  }
  return true;
 }
 function setupAudio(){
  if(!manifest)return;
  if(!recording){status("Invalid local narration cues. Using captions.");return;}
  const el=document.createElement("audio");audio=el;el.hidden=true;el.preload="auto";el.id="narration";
  el.addEventListener("loadedmetadata",()=>{if(audio===el&&!media.actual(recording,el.duration))fallback("Narration does not match its measured cues.");});
  el.addEventListener("loadeddata",()=>{if(audio===el)adopt();});
  el.addEventListener("durationchange",()=>{if(audio===el&&el.readyState>=2)adopt();});
  el.addEventListener("ended",()=>{if(audio===el&&running){now=stampNow();if(now<tape.duration-.12)fallback("Narration ended before its measured cues.");else finish();}});
  el.addEventListener("error",()=>{if(audio===el)fallback("Narration could not load or decode.");});
  el.playbackRate=rate;el.src=recording.audio;$("watch-player").append(el);
 }
 function startPlayback(){
  if(watch.hidden||running||pending)return;
  if(now>=tape.duration-.002)go(0);
  if(!audio){playCaptions();return;}
  const el=audio,ticket=++generation;pending=true;el.playbackRate=rate;label();audioSeek();
  startTimer=setTimeout(()=>{if(ticket===generation&&pending)fallback("Narration did not start.");},8000);
  const fail=()=>{if(ticket===generation&&audio===el)fallback("Narration could not play.");};
  try{
   Promise.resolve(el.play()).then(()=>{
    if(ticket!==generation||watch.hidden||audio!==el)return;
    if(!adopt()||ticket!==generation||audio!==el)return;
    clearTimeout(startTimer);pending=false;running=true;
    now=stampNow();render(now);label();raf=requestAnimationFrame(tick);
   },fail);
  }catch{fail();}
 }
 play.onclick=()=>{
  if(watch.hidden)return;
  const stopping=running||pending;
  overlay.dataset.initial="false";transport.clear();
  if(stopping)stop();else startPlayback();
  transport.flash(!stopping);
 };
 seek.oninput=()=>go(seek.value);
 speed.onchange=()=>{
  now=stampNow();rate=Number(speed.value);reference=performance.now()-now*1000/rate;
  if(audio)audio.playbackRate=rate;
  render(now);
 };
 document.addEventListener("visibilitychange",()=>{if(document.hidden&&(running||pending))stop();});
 $("cc").onclick=()=>{
  const band=$("caption-band");band.hidden=!band.hidden;
  $("cc").setAttribute("aria-pressed",String(!band.hidden));$("cc").setAttribute("aria-label",band.hidden?"Show captions":"Hide captions");fit();
 };

 const params=new URLSearchParams(location.search), names=["lambda","event","a","b"], typed=names.some(k=>params.has(k));
 function validEvent(l,kind,a,b=""){
  const lambda=M.number(l), low=M.integer(a), upper=kind==="between"?M.integer(b):null;
  let value=null, rangeNotice="";
  try{value=M.event(lambda,kind,low,upper);}
  catch(e){if(!e.message.includes("reliable numeric range"))throw e;rangeNotice=e.message;}
  return {lambda,kind,a:low,b:upper,value,rangeNotice};
 }
 const original=validEvent("3.5","ge","4");
 let assigned=original, badLink=false;
 if(typed)try{
  const kind=params.get("event");
  if(names.slice(0,3).some(k=>params.getAll(k).length!==1)||params.getAll("b").length!==(kind==="between"?1:0))throw Error("Repeated or missing input");
  assigned=validEvent(params.get("lambda"),kind,params.get("a"),params.get("b"));
 }catch{badLink=true;}
 let exercise=assigned, history=[], historyIndex=-1, error="", start=0, end=0, light=0;
 const hist=$("history"), fields=["mean","event","a","b"].map($);
 function announce(message){$("lcd-announcement").textContent=message;}
 function updateHistory(scroll=true){
  hist.replaceChildren();
  for(let i=0;i<history.length;i++){
   const {expression,value}=history[i],row=document.createElement("div"),answer=document.createElement("strong");
   row.append(document.createTextNode(expression),answer);answer.textContent=M.fmt(value);
   if(historyIndex===i)row.setAttribute("aria-current","true");
   hist.append(row);
  }
  if(scroll){
   const row=hist.children[historyIndex];
   if(row){
    const visible=hist.getBoundingClientRect(), target=row.getBoundingClientRect();
    if(target.top<visible.top)hist.scrollTop-=visible.top-target.top;
    else if(target.bottom>visible.bottom)hist.scrollTop+=target.bottom-visible.bottom;
   }else hist.scrollTop=hist.scrollHeight;
  }
  tryLcd.dataset.result=history.length?M.fmt(history.at(-1).value):"";
 }
 function setError(message=""){
  error=message;$("keypad-result").hidden=!error;$("keypad-result").textContent=error;
  if(message)announce(message);
 }
 function selection(){
  if(document.activeElement===command){start=command.selectionStart;end=command.selectionEnd;}
  return [start,end];
 }
 function draft(raw,a,b=a,focus=false){
  command.value=raw;
  if(focus)command.focus({preventScroll:true});
  command.setSelectionRange(a,b);start=a;end=b;
  if(error)setError();
 }
 function selectHistory(i){
  historyIndex=i;updateHistory();
  if(i>=0)announce("History: "+history[i].expression+". Press Enter to copy it to the entry line.");
 }
 function evaluate(focus=false){
  if(historyIndex>=0){
   const raw=history[historyIndex].expression.replace(/−/g,"-");selectHistory(-1);draft(raw,raw.length,raw.length,focus);
   announce("Copied to the entry line. Edit it or press Enter to calculate.");return;
  }
  try{
   const result=M.calculator(command.value);
   history=[...history,result].slice(-8);draft("",0,0,focus);updateHistory();
   announce(result.expression+" equals "+M.fmt(result.value)+".");
  }catch(e){setError(e.message);}
 }
 function press(key,keyboard=false){
  if(!visibleTry())return;
  clearTimeout(light);tryKeys.setKeys([key]);light=setTimeout(()=>tryKeys.setKeys([]),245);
  if(key==="enter"||key==="return"){evaluate(keyboard);return;}
  if(key==="esc"){
   if(historyIndex>=0)selectHistory(-1);else draft("",0,0,keyboard);
   setError();return;
  }
  if(key==="up"||key==="down"){
   if(!history.length)return;
   const i=historyIndex<0?(key==="up"?history.length-1:-1):historyIndex+(key==="up"?-1:1);
   selectHistory(i>=history.length?-1:Math.max(i,historyIndex<0?-1:0));return;
  }
  if(key==="menu"||key==="catalog"){setError("This lesson practises typed Poisson commands. Type one on the Calculator entry line.");return;}
  if(historyIndex>=0)selectHistory(-1);
  const [a,b]=selection();
  if(key==="left"||key==="right"){
   const loc=M.clamp(key==="left"?(a===b?a-1:a):(a===b?b+1:b),0,command.value.length);
   command.setSelectionRange(loc,loc);start=loc;end=loc;return;
  }
  const ch=({lparen:"(",rparen:")",comma:",",dot:".",minus:"-",neg:"-",plus:"+",space:" "})[key]||(/^[a-z0-9]$/.test(key)?key:null);
  if(!ch&&key!=="del")return;
  const from=key==="del"&&a===b?Math.max(0,a-1):a, insert=ch||"";
  const next=command.value.slice(0,from)+insert+command.value.slice(b);
  if(next.length<=100)draft(next,from+insert.length,from+insert.length,keyboard);
 }
 command.addEventListener("keydown",e=>{
  if(e.isComposing||e.ctrlKey||e.altKey||e.metaKey)return;
  const k={ArrowUp:"up",ArrowDown:"down",Escape:"esc"}[e.key];
  if(k){e.preventDefault();press(k,true);}
 });
 command.addEventListener("input",()=>{if(historyIndex>=0)selectHistory(-1);selection();setError();});
 for(const kind of ["select","keyup","pointerup","blur"])command.addEventListener(kind,()=>{start=command.selectionStart;end=command.selectionEnd;});
 $("command-form").onsubmit=e=>{e.preventDefault();press("enter",true);};
 function paintEvent(){
  const v=exercise;
  $("keypad-problem").textContent="Use λ = "+M.neat(v.lambda)+" to find "+M.label(v.kind,v.a,v.b)+".";
  const warning=badLink?"This link did not supply a valid event. Showing the original exercise.":v.rangeNotice;
  $("event-warning").hidden=!warning;$("event-warning").textContent=warning;
  $("answer-form").hidden=v.value===null;
 }
 function shape(){
  const pair=fields[1].value==="between";$("a-caption").textContent=pair?"Lower count":"Count";
  $("b-label").hidden=!pair;fields[3].required=pair;
 }
 function setForm(v){
  [String(v.lambda),v.kind,String(v.a),v.b==null?"":String(v.b)].forEach((x,i)=>fields[i].value=x);shape();
 }
 function clearCheck(){$("answer").value="";$("feedback").textContent="";$("feedback").className="feedback";}
 fields[1].onchange=shape;
 $("model-form").onsubmit=e=>{
  e.preventDefault();
  try{
   exercise=validEvent(...fields.map(f=>f.value));badLink=false;
   $("model-warning").hidden=true;$("custom-case").open=false;clearCheck();paintEvent();
   $("answer").focus({preventScroll:true});
  }catch(err){$("model-warning").textContent=err.message;$("model-warning").hidden=false;}
 };
 $("answer").oninput=()=>{$("feedback").textContent="";$("feedback").className="feedback";};
 $("answer-form").onsubmit=e=>{
  e.preventDefault();if(exercise.value===null)return;
  const right=M.grade($("answer").value,exercise.value),tail=exercise.kind==="gt"||exercise.kind==="ge";
  $("feedback").className="feedback "+(right?"is-right":"is-wrong");
  $("feedback").textContent=right?"Correct. Your count bounds match the event.":tail?"Not quite. Check whether the cutoff itself belongs in the event.":"Not quite. Check which counts the event includes.";
 };
 $("reset-keypad").onclick=()=>{
  exercise=assigned;badLink=false;clearCheck();history=[];historyIndex=-1;
  draft("",0);setError();updateHistory();setForm(exercise);paintEvent();announce("Calculator and practice question reset.");
  $("try-host").focus({preventScroll:true});
 };
 const tabs=[$("watch-tab"),$("try-tab")];
 function tab(i,focus){
  if(i){if(running||pending)stop();void transport.exit();}
  tabs.forEach((el,k)=>{el.tabIndex=i===k?0:-1;el.setAttribute("aria-selected",String(i===k));$(el.getAttribute("aria-controls")).hidden=i!==k;});
  clearTimeout(light);tryKeys.setKeys([]);
  if(i){paintEvent();updateHistory(false);}
  else{window.scrollTo({top:0,left:0,behavior:"instant"});fit();}
  if(focus)(i?$("try-host"):play).focus({preventScroll:true});
 }
 $("try-host").tabIndex=0;
 tabs.forEach((el,i)=>{
  el.onclick=()=>tab(i,true);
  el.onkeydown=e=>{
   if(!["ArrowLeft","ArrowRight","Home","End"].includes(e.key))return;
   e.preventDefault();const j=e.key==="Home"?0:e.key==="End"?1:1-i;tab(j,false);tabs[j].focus();
  };
 });
 $("to-try").onclick=()=>tab(1,true);
 $("return-watch").onclick=()=>tab(0,true);
 $("try-host").addEventListener("keydown",e=>{
  if(e.altKey||e.ctrlKey||e.metaKey||e.isComposing||e.target.closest("input,textarea,select,a,summary")||e.target.closest("button")&&[" ","Enter"].includes(e.key))return;
  const keys={Escape:"esc",Enter:"enter",Backspace:"del",Delete:"del",ArrowUp:"up",ArrowDown:"down",ArrowLeft:"left",ArrowRight:"right",".":"dot",",":"comma","(":"lparen",")":"rparen","-":"minus","+":"plus"};
  const k=keys[e.key]||(/^[a-z0-9]$/i.test(e.key)?e.key.toLowerCase():"");
  if(k){e.preventDefault();press(k,true);}
 });
 watch.dataset.clock="caption";setForm(exercise);frame(framePref);render(now);label();
 tab(params.get("mode")==="try"?1:0,false);setupAudio();
})();
