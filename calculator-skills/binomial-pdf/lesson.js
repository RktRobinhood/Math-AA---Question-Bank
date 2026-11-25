"use strict";
(function(){
 function lessonEnd(){return (window.visualViewport?.height||innerHeight)-(document.querySelector("body > .tabbar")?.offsetHeight||0);}
const $=id=>document.getElementById(id);
 const captions=[
  "Exactly three means one count: X = 3. Start on a Calculator page.",
  "Press Menu, 5 for Probability, 5 for Distributions, then D for Binomial Pdf.",
  "Enter 8 trials, 0.3 for the success probability, and 3 for X Value. Use Tab between fields.",
  "Press Enter to insert the command, then Enter again to calculate.",
  "The screen shows P(X = 3). At most three is a different event; it also includes 0, 1 and 2."
 ];
 const stages=["Pick the exact count","Find Binomial Pdf","Fill the three fields","Calculate","Compare with at most"];
 const rehearsal={duration:23.8,starts:[0,3.5,8.4,15.4,19.6],captions,tape:window.BinomialPdfTape};
 const sourceNode=$("ct37-narration-manifest"),media=window.BinomialPdfMedia;
 const manifestNode=sourceNode?.type==="application/json"?sourceNode:null;
 const recording=manifestNode?media?.decode(manifestNode.textContent,rehearsal.tape):null;
 let timeline=rehearsal,audio=null,mediaReady=false,pending=false,generation=0,loadTimer=0;
 const watchExample={n:8,p:.3,k:3}, practiceExample={n:10,p:.4,k:2};
 const menuA=["1: Actions","2: Number","3: Algebra","4: Calculus","5: Probability","6: Statistics","7: Matrix & Vector","8: Finance"];
 const menuB=["1: Factorial","2: Permutations","3: Combinations","4: Random","5: Distributions"];
 const menuC=["⋮","D: Binomial Pdf","E: Binomial Cdf","F: Inverse Binomial"];
 const labels=["Num Trials","Probability of Success","X Value"];
 const play=$("play"),seek=$("seek"),stage=document.querySelector(".ct37-shared");
 const work=$("screen-work"),steps=$("steps"),hint=$("keypad-hint"),kpReport=$("keypad-result");
 const params=new URLSearchParams(location.search),tabs=[$("watch-tab"),$("try-tab")];
 const model=$("model"),nEl=$("trials"),pEl=$("chance"),kEl=$("count"),out=$("result"),eventLine=$("event-line");
 const shell=HandheldShell.mount({host:$("handheld-host"),screen:$("lcd"),interactive:false,onKey:key=>physical(key)});
 let mode="watch",time=0,raf=0,playing=false,sig="",chapter=0,origin=0;
 let calcState="idle",calcValues=["","",""],selected=0,activeMenu=0,replaceField=true,history=[],entry="",focusView=false,focusChoice=null,focusMemory=false,started=false;
 const overlay=$("stage-play"),forks=new Map();
 let lane=null,independent=null,reportText="",reportError=false;

 // Normalize the requested mass against total mass from the mode outward.
 // This avoids a huge binomial coefficient followed by tiny factors.
 function mass(n,p,k){
  if(p===0)return k===0?1:0;if(p===1)return k===n?1:0;
  const m=Math.min(n,Math.floor((n+1)*p));
  let total=1,selected=m===k?1:0,w=1;
  for(let i=m;i>0;i--){w*=i/(n-i+1)*(1-p)/p;total+=w;if(i-1===k)selected=w;}
  w=1;for(let i=m;i<n;i++){w*=(n-i)/(i+1)*p/(1-p);total+=w;if(i+1===k)selected=w;}
  return Math.min(1,selected/total);
 }
 const fmt=x=>x===0||x===1?String(x):x<1e-5?x.toExponential(5):Number(x.toPrecision(6)).toString();
 const cmd=(n,p,k)=>"binomPdf("+[n,p,k].join(",")+")";
 const command=cmd(watchExample.n,watchExample.p,watchExample.k);
 const watchedResult=fmt(mass(watchExample.n,watchExample.p,watchExample.k));
 const escape=(s)=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
 const timecode=t=>Math.floor(t/60)+":"+String(Math.floor(t)%60).padStart(2,"0");
 const mkMenu=(list,sel,which,live)=>'<ul class="lcd-menu">'+list.map((name,i)=>'<li'+(i===sel?' class="current"':'')+(live?' data-menu="'+which+':'+i+'"':'')+'>'+escape(name)+'</li>').join("")+"</ul>";
 const wizard=(values,field,live)=>'<div class="lcd-dialog"><strong>Binomial Pdf</strong>'+labels.map((n,i)=>'<div class="lcd-field'+(i===field?' active':'')+(live?' kbd-action" data-field="'+i:'')+'"><span>'+n+':</span><span>'+escape(values[i]||"\u00a0")+'</span></div>').join("")+'<div class="lcd-ok"><span'+(field===3?' class="calc-active"':'')+(live?' data-field="3"':'')+'>OK</span> <span'+(live?' data-field="4"':'')+'>Cancel</span></div></div>';
 const lcdResult=h=>'<div class="lcd-history"><p>'+escape(h.command)+'</p><p class="answers"><strong>'+escape(h.value)+'</strong></p></div>';
 const lcdEntry=x=>'<div class="lcd-entry"><p>'+escape(x||"\u00a0")+'</p></div>';
 const activate=(b,v)=>{b.setAttribute("aria-current",String(v));};

 function watchSnapshot(t){
  const ms=t*1000,values=["","",""];let state="idle",field=0,key=null;
  for(const e of timeline.tape){
   if(e.timeMs>ms)break;
   if(e.state)state=e.state;
   if(e.field!==undefined)field=e.field;
   if(e.fieldAfter!==undefined)values[e.field]=e.fieldAfter;
   key=ms<e.timeMs+Math.max(170,e.durationMs)?e.key:null;
  }
  return {state,field,key,values};
 }
 function renderWatch(t){
  if(mode!=="watch")return;
  const {starts,duration,captions}=timeline;
  chapter=0;for(let i=1;i<starts.length;i++){if(t>=starts[i])chapter=i;else break}
  seek.value=t;seek.setAttribute("aria-valuetext",timecode(t)+" of "+timecode(duration));
  $("clock").textContent=timecode(t)+" / "+timecode(duration);
  const {state,field,key,values}=watchSnapshot(t);
  shell.setKeys(key?[key]:[]);
  overlay.hidden=started||t>0;
  $("take-over").textContent=t>0&&t<duration-.02?"Take over":t>=duration-.02?"Start assigned Try":"Open Try";
  const comparison=t>=starts[4];
  const nextSig=[chapter,state,field,values.join("|"),comparison].join("/");
  if(nextSig===sig)return;
  sig=nextSig;
  let html="";
  if(state==="probability-menu")html='<div class="menu-stack">'+mkMenu(menuA,4,"a",false)+"</div>";
  if(state==="probability-submenu")html='<div class="menu-stack">'+mkMenu(menuA,4,"a",false)+mkMenu(menuB,4,"b",false)+"</div>";
  if(state==="distributions-submenu")html='<div class="menu-stack">'+mkMenu(menuB,4,"b",false)+mkMenu(menuC,1,"c",false)+"</div>";
  if(state==="wizard")html=wizard(values,field,false);
  if(state==="entry")html=lcdEntry(command);
  if(state==="result")html=lcdResult({command,value:watchedResult})+lcdEntry("");
  if(!html)html=lcdEntry("");
  work.innerHTML=html;
  $("caption").textContent=captions[chapter];
  $("watch-bounds").textContent=comparison?"At most 3 → 0, 1, 2, 3 (CDF). The LCD shows exactly 3 only.":"Worked event: exactly 3 → include 3 only.";
  [...steps.children].forEach((li,i)=>activate(li.firstElementChild,i===chapter));
 }
 stages.forEach((s,i)=>{
  const li=document.createElement("li"),b=document.createElement("button"),num=document.createElement("span");
  b.type="button";num.textContent="0"+(i+1);b.append(num,document.createTextNode(s));b.addEventListener("click",()=>go(timeline.starts[i]));li.append(b);steps.append(li);
 });
 const clamp=t=>Math.max(0,Math.min(Number(t)||0,timeline.duration));
 function labelPlay(){
  const name=playing||pending?"Pause":time>=timeline.duration-.02?"Replay":"Play";
  play.textContent=name;play.setAttribute("aria-label",name);play.dataset.playing=String(playing);
 }
 function status(label,note=""){
  $("media-status").textContent=label;
  $("media-notice").textContent=note;$("media-notice").hidden=!note;
 }
 function applyTimeline(next){
  time=media.remap(time,timeline,next);timeline=next;sig="";
  seek.max=String(timeline.duration);renderWatch(time);labelPlay();
 }
 function mediaSeek(){
  if(mediaReady&&audio)audio.currentTime=clamp(time);
 }
 function go(t){
  time=clamp(t);
  if(audio)mediaSeek();else origin=performance.now()-time*1000;
  renderWatch(time);labelPlay();
 }
 function readTime(now=performance.now()){
  if(!playing)return time;
  return clamp(audio?audio.currentTime:(now-origin)/1000);
 }
 function stop(){
  generation++;pending=false;playing=false;
  clearTimeout(loadTimer);cancelAnimationFrame(raf);audio?.pause();labelPlay();
 }
 function pause(){time=readTime();stop();renderWatch(time);}
 function end(){time=timeline.duration;stop();renderWatch(time);}
 function tick(now){
  if(!playing||mode!=="watch")return;
  time=readTime(now);
  if(audio?audio.ended:time>=timeline.duration){end();return;}
  renderWatch(time);raf=requestAnimationFrame(tick);
 }
 function startCaptionClock(){
  origin=performance.now()-time*1000;playing=true;pending=false;labelPlay();
  raf=requestAnimationFrame(tick);
 }
 function fallback(reason){
  const continuePlayback=mode==="watch"&&(pending||playing);
  time=readTime();stop();
  const failed=audio;audio=null;mediaReady=false;failed?.remove();
  if(failed){failed.removeAttribute("src");failed.load();}
  applyTimeline(rehearsal);stage.dataset.clock="caption";
  status("Captions only",reason+" Continuing with captions.");
  if(continuePlayback&&time<timeline.duration-.02)startCaptionClock();
 }
 function adoptMetadata(){
  if(!audio)return;
  const verified=media.decodedTimeline(recording,audio.duration);
  if(!verified){fallback("The local audio does not match its measured cues.");return;}
  if(!mediaReady||Math.abs(timeline.duration-verified.duration)>.001){
   mediaReady=true;applyTimeline(verified);mediaSeek();stage.dataset.clock="audio";
  }
 }
 function setupAudio(){
  stage.dataset.clock="caption";
  if(!manifestNode)return;
  if(!recording){status("Captions only","The narration cue file is invalid. Using captions.");return;}
  const el=document.createElement("audio");el.id="ct37-narration";el.hidden=true;el.preload="auto";
  audio=el;status("Preparing narration…");
  el.addEventListener("loadedmetadata",()=>{if(audio===el)adoptMetadata()});
  el.addEventListener("durationchange",()=>{if(audio===el&&el.readyState>=1)adoptMetadata()});
  el.addEventListener("loadeddata",()=>{if(audio===el&&mediaReady)status("Narration")});
  el.addEventListener("ended",()=>{if(audio===el&&playing&&mode==="watch")end()});
  el.addEventListener("pause",()=>{if(audio===el&&playing&&el.paused&&!el.ended)pause()});
  el.addEventListener("error",()=>{if(audio===el)fallback("Narration could not load or decode.")});
  el.src=recording.audio;$("watch-player").append(el);
 }
 function start(){
  if(mode!=="watch"||playing||pending)return;
  fitView(true);
  if(document.activeElement===overlay)play.focus({preventScroll:true});
  started=true;overlay.hidden=true;
  if(time>=timeline.duration-.02)go(0);
  if(!audio){startCaptionClock();return;}
  const el=audio,ticket=++generation;
  pending=true;labelPlay();mediaSeek();
  loadTimer=setTimeout(()=>{if(ticket===generation&&pending)fallback("Narration did not start.");},8000);
  function refused(){
   if(ticket===generation&&audio===el)fallback("Narration could not play.");
  }
  try{
   Promise.resolve(el.play()).then(()=>{
    if(ticket!==generation||mode!=="watch"||audio!==el)return;
    if(!mediaReady)adoptMetadata();
    if(ticket!==generation||!mediaReady)return;
    clearTimeout(loadTimer);pending=false;playing=true;status("Narration");labelPlay();
    time=readTime();renderWatch(time);
    raf=requestAnimationFrame(tick);
   },refused);
  }catch{refused();}
 }
 function toggle(){if(playing||pending)pause();else start();}
 play.addEventListener("click",toggle);overlay.addEventListener("click",toggle);
 $("back").addEventListener("click",()=>go(readTime()-10));
 $("next").addEventListener("click",()=>go(readTime()+10));
 $("replay").addEventListener("click",()=>{pause();go(0);start();});
 seek.addEventListener("input",()=>go(Number(seek.value)));
 document.addEventListener("visibilitychange",()=>{if(document.hidden&&(playing||pending))pause();});

 function report(message,error=false){
  reportText=message||"";reportError=Boolean(error);kpReport.textContent=reportText;kpReport.hidden=!reportText;kpReport.className="feedback"+(reportError?"is-wrong":"is-right");
 }
 const decimal=/^(?:\d+(?:\.\d*)?|\.\d+)$/;
 function readNumber(x){return decimal.test(x)?Number(x):NaN;}
 function readProbability(x){
  if(!x.includes("/"))return readNumber(x);
  const [a,b,...extra]=x.split("/");if(extra.length||!b)return NaN;
  return readNumber(a)/readNumber(b);
 }
 function data(){
  const n=readNumber(calcValues[0]),p=readProbability(calcValues[1]),k=readNumber(calcValues[2]);
  if(!Number.isInteger(n)||n<1||n>500)return "Enter a whole trial count from 1 to 500.";
  if(!Number.isFinite(p)||p<0||p>1)return "Enter a success probability between 0 and 1.";
  if(!Number.isInteger(k)||k<0||k>n)return "Enter a whole X Value from zero to the trial count.";
  return{n,p,k};
 }
 function explainTry(){
  const cue={
   idle:"Press Menu to begin.",
   menu:"Choose 5: Probability.",
   probability:"Choose 5: Distributions.",
   dist:"Press D or choose Binomial Pdf and press Enter.",
   wizard:selected<3?"Enter "+labels[selected].toLowerCase()+". Tab moves to the next field.":"Press Enter to send the command to the Calculator page.",
   entry:"Press Enter again to evaluate the command.",
   result:"To use new values, press Menu and start another calculation."
  };
  hint.textContent=cue[calcState];
 }
 function renderTry(){
  if(mode!=="try")return;
  let html=history.slice(-2).map(lcdResult).join("");
  if(calcState==="menu")html+='<div class="menu-stack">'+mkMenu(menuA,activeMenu,"a",true)+"</div>";
  if(calcState==="probability")html+='<div class="menu-stack">'+mkMenu(menuA,4,"a",true)+mkMenu(menuB,activeMenu,"b",true)+"</div>";
  if(calcState==="dist")html+='<div class="menu-stack">'+mkMenu(menuB,4,"b",true)+mkMenu(menuC,activeMenu,"c",true)+"</div>";
  if(calcState==="wizard")html+=wizard(calcValues,selected,true);
  if(["idle","entry","result"].includes(calcState))html+=lcdEntry(calcState==="entry"?entry:"");
  work.innerHTML=html;explainTry();
 }
 function newWizard(){
  calcState="wizard";selected=0;replaceField=true;report("");
 }
 function openMenu(next,start){calcState=next;activeMenu=start;report("");}
 function confirmWizard(){
  const v=data();
  if(typeof v==="string"){report(v,true);return;}
  entry=cmd(v.n,calcValues[1],v.k);calcState="entry";report("");
 }
 function press(k){
  if(mode!=="try")return;
  if(k==="menu"){openMenu("menu",4);renderTry();return}
  if(k==="esc"){
   if(calcState==="wizard"){openMenu("dist",1);}
   else if(calcState==="dist"){openMenu("probability",4);}
   else if(calcState==="probability"){openMenu("menu",4);}
   else {calcState="idle";report("");}
   renderTry();return;
  }
  if(calcState==="menu"||calcState==="probability"||calcState==="dist"){
   const cfg={menu:[menuA,4,"probability",4,"5"],probability:[menuB,4,"dist",1,"5"],dist:[menuC,1,"wizard",0,"d"]}[calcState];
   const [list,right,to,next,shortcut]=cfg;
   if(k==="up"||k==="down")activeMenu=Math.max(calcState==="dist"?1:0,Math.min(list.length-1,activeMenu+(k==="up"?-1:1)));
   else if(k===shortcut||["enter","right","select"].includes(k)&&activeMenu===right){
    if(to==="wizard")newWizard();else openMenu(to,next);
   }else if(["enter","right","select"].includes(k)||/^[0-9a-z]$/.test(k)){report("This lesson uses Binomial Pdf. Choose the highlighted route.",true);}
   renderTry();return;
  }
  if(calcState==="wizard"){
   if(k==="tab"||k==="down"||k==="up"){
    const d=k==="up"?-1:1;selected=(selected+d+4)%4;replaceField=true;report("");
   }else if(k==="enter"||k==="select"){confirmWizard();}
   else if(selected<3&&k==="del"){calcValues[selected]=replaceField?"":calcValues[selected].slice(0,-1);replaceField=false;report("");}
   else if(selected<3&&(/^[0-9]$/.test(k)||k==="dot"||k==="div")){
    const c=k==="dot"?".":k==="div"?"/":k;
    if(c!=="."&&c!=="/"||selected===1){
     let x=replaceField?"":calcValues[selected];const part=x.split("/").pop();
     if(x.length<19&&(c!=="."||!part.includes("."))&&(c!=="/"||!x.includes("/")&&decimal.test(x)))x+=c;
     calcValues[selected]=x;replaceField=false;report("");
    }
   }
   renderTry();return;
  }
  if(calcState==="entry"&&["enter","select"].includes(k)){
   const v=data();
   if(typeof v==="string"){report(v,true);return}
   const probability=mass(v.n,v.p,v.k),value=fmt(probability);
   history.push({command:entry,value});history=history.slice(-2);calcState="result";
   report(probability===0&&v.p>0&&v.p<1?"The nonzero probability is too small for this simulator to represent.":"Probability of exactly "+v.k+" = "+value+".");renderTry();return;
  }
 }
 work.addEventListener("click",e=>{
  if(mode!=="try")return;
  const f=e.target.closest("[data-field]"),m=e.target.closest("[data-menu]");
  if(f&&calcState==="wizard"){
   stage.focus({preventScroll:true});const n=Number(f.dataset.field);
   if(n===4){press("esc");return}
   if(n===3){selected=3;press("enter");return}
   selected=n;replaceField=true;renderTry();return;
  }
  if(m){
   const [which,i]=m.dataset.menu.split(":");const names={menu:"a",probability:"b",dist:"c"};
   if(which===names[calcState]){stage.focus({preventScroll:true});activeMenu=Number(i);press("enter");uiFlash("enter")}
  }
 });
 stage.addEventListener("keydown",e=>{
  if(mode!=="try"||e.metaKey||e.ctrlKey||e.altKey||e.target.closest("input,select,textarea,[contenteditable]"))return;
  if((e.key==="Enter"||e.key===" ")&&e.target.closest("button"))return;
  if(e.key==="Tab"&&(calcState!=="wizard"||e.target!==stage||e.shiftKey))return;
  if(e.key==="Tab"&&selected===3){e.preventDefault();(lane===null?$("answer"):$("return-watch")).focus();return;}
  const map={Enter:"enter",Escape:"esc",Backspace:"del",Delete:"del",ArrowUp:"up",ArrowDown:"down",ArrowRight:"right",Tab:"tab",m:"menu",M:"menu",".":"dot","/":"div"};
  const k=map[e.key]||(/^[0-9dD]$/.test(e.key)?e.key.toLowerCase():null);
  if(k){e.preventDefault();press(k);uiFlash(k);}
 });
 let blink=0;
 function uiFlash(k){clearTimeout(blink);shell.setKeys([k]);blink=setTimeout(()=>{if(mode==="try")shell.setKeys([]);},185)}
 function physical(k){
  if(mode!=="try")return;
  stage.focus({preventScroll:true});press(k);uiFlash(k);
 }
 function capture(){return {calcState,calcValues:calcValues.slice(),selected,activeMenu,replaceField,history:history.slice(),entry,reportText,reportError};}
 function loadState(s){
  ({calcState,selected,activeMenu,replaceField,entry}=s);calcValues=s.calcValues.slice();history=s.history.slice();
  report(s.reportText,s.reportError);
 }
 function saveTry(){
  if(lane===null){independent=capture();return;}
  forks.set(lane,capture());if(forks.size>32)forks.delete(forks.keys().next().value);
 }
 function blank(practice){
  const values=practice?[String(practice.n),practice.pText||String(practice.p),String(practice.k)]:["","",""];
  return {calcState:"idle",calcValues:values,selected:0,activeMenu:0,replaceField:true,history:[],entry:"",reportText:"",reportError:false};
 }
 $("reset-keypad").addEventListener("click",()=>{
  if(lane!==null){onMode("try",true);return;}
  loadState(blank(challenge));independent=capture();renderTry();stage.focus({preventScroll:true});
 });
 function fitView(allowFocus=false){
  if(typeof stage.getBoundingClientRect!=="function")return;
  const height=lessonEnd(), v=stage.getBoundingClientRect();
  if(mode==="try"){
   const top=$("handheld-host").getBoundingClientRect().top+window.scrollY;
   stage.style.setProperty("--try-fit",Math.min(298,Math.max(151,Math.floor((height-top-11)*558/1168)))+"px");return;
  }
  const avail=height-Math.max(0,v.top);
  const landscape=focusView&&innerWidth>700&&avail<=600;
  const reserve=landscape?23:$("watch-message").offsetHeight+$("watch-player").offsetHeight+24;
  const width=Math.min(focusView?334:284,Math.max(98,Math.floor((avail-reserve)*558/1168)));
  stage.style.setProperty("--watch-fit",width+"px");
  if(allowFocus&&!focusView&&focusChoice!==false&&(focusMemory||width<171||$("watch-player").getBoundingClientRect().bottom>height-2))focusStage(true);
 }
 function focusStage(v){
  focusView=Boolean(v);stage.classList.toggle("ct37-focused",focusView);
  document.body.classList.toggle("ct37-focus-open",focusView);
  const name=focusView?"Exit focused view":"Focused view", button=$("focus-view");
  button.setAttribute("aria-pressed",String(focusView));button.setAttribute("aria-label",name);button.title=name;button.textContent=focusView?"Exit":"Focus";
  for(const el of document.querySelectorAll?.("main > .header, main > .calc-tabs, main > .notes")||[])el.inert=focusView;
  if(focusView)stage.scrollTop=0;
  if(!focusView&&mode==="watch")button.focus({preventScroll:true});fitView();
 }
 $("focus-view").addEventListener("click",()=>{focusChoice=!focusView;focusStage(!focusView);});
 if(typeof ResizeObserver!=="undefined"){
  const ob=new ResizeObserver(()=>fitView());
  for(const el of [$("watch-message"),$("watch-player"),$("try-player"),$("try-side"),document.querySelector(".header")])ob.observe(el);
  window.addEventListener("resize",()=>fitView(true));window.visualViewport?.addEventListener("resize",()=>fitView(true));
 }
 function forkWatch(){
  const x=watchSnapshot(time), map={idle:"idle","probability-menu":"menu","probability-submenu":"probability","distributions-submenu":"dist",wizard:"wizard",entry:"entry",result:"result"};
  const calcState=map[x.state];
  return {calcState,selected:x.field,calcValues:x.values.slice(),activeMenu:x.state==="distributions-submenu"?1:4,replaceField:!x.values[x.field],
   entry:calcState==="entry"||calcState==="result"?command:"",history:calcState==="result"?[{command,value:watchedResult}]:[],reportText:"",reportError:false};
 }
 function onMode(next,focus=false,takeover=false){
  if(next!=="watch"&&next!=="try")return;
  if(mode==="try")saveTry();
  if(mode==="watch"&&next==="try"){
   pause();focusMemory=focusView;if(focusView)focusStage(false);
   lane=takeover&&time>0&&time<timeline.duration-.02?String(Math.round(time*1000)):null;
   loadState(lane===null?independent:(forks.get(lane)||forkWatch()));
  }else if(mode==="try"&&next==="try"&&lane!==null&&!takeover){
   lane=null;loadState(independent);
  }
  mode=next;stage.dataset.mode=next;stage.dataset.tryLane=next==="watch"?"":lane===null?"practice":"fork";
  sig="";clearTimeout(blink);shell.setKeys([]);shell.setInteractive(next==="try");
  tabs.forEach((el,i)=>{
   const yes=(i===0)===(next==="watch");el.tabIndex=yes?0:-1;el.setAttribute("aria-selected",String(yes));$(el.getAttribute("aria-controls")).hidden=!yes;
  });
  $("watch-side").hidden=$("watch-player").hidden=$("watch-message").hidden=next!=="watch";
  $("try-side").hidden=$("try-player").hidden=next!=="try";
  $("try").dataset.fork=String(lane!==null);
  if(typeof window.scrollTo==="function")window.scrollTo(0,0);
  if(next==="watch"){renderWatch(time);fitView(true);if(focus)play.focus({preventScroll:true});}
  else{
   overlay.hidden=true;$("reset-keypad").textContent=lane===null?"Restart keypad":"Open independent Try";
   $("keypad-problem").textContent=lane===null?problemText(challenge):"Watch copy: n = 8, p = 0.3, P(X = 3).";
   $("prefill-notice").hidden=lane!==null||!prefillError;$("prefill-notice").textContent=prefillError;
   renderTry();fitView();if(focus)stage.focus({preventScroll:true});
  }
 }
 tabs.forEach((el,i)=>{
  el.addEventListener("click",()=>onMode(i?"try":"watch",Boolean(i)));
  el.addEventListener("keydown",e=>{if(["ArrowLeft","ArrowRight","Home","End"].includes(e.key)){
   e.preventDefault();const x=e.key==="Home"?0:e.key==="End"?1:1-i;onMode(x?"try":"watch");tabs[x].focus();
  }});
 });
 $("take-over").addEventListener("click",()=>onMode("try",true,true));
 $("return-watch").addEventListener("click",()=>onMode("watch",true));
 document.addEventListener("keydown",e=>{if(e.target!==document.body&&!e.target.closest?.(".qb-calculator-lesson"))return;
  if(focusView&&e.key==="Escape"){e.preventDefault();focusChoice=false;focusStage(false);return}
  // A linked Try can land on the document body without stealing focus.
  if(mode==="try"&&e.target===document.body&&!e.altKey&&!e.ctrlKey&&!e.metaKey&&!e.repeat&&e.key.toLowerCase()==="m"){
   e.preventDefault();stage.focus({preventScroll:true});press("menu");uiFlash("menu");return;
  }
  if(mode!=="watch"||e.altKey||e.ctrlKey||e.metaKey||e.repeat||e.target.closest("input,button,a,select,summary,[contenteditable]"))return;
  if(e.key==="k"||e.key===" "){e.preventDefault();toggle();}
  else if(e.key==="j"){e.preventDefault();go(readTime()-10)}else if(e.key==="l"){e.preventDefault();go(readTime()+10)}
 });


 function typedPrefill(){
  const raw={n:params.get("n"),p:params.get("p"),k:params.get("k")};
  if(!Object.values(raw).some(v=>v!==null)||Object.keys(raw).some(k=>params.getAll(k).length!==1))return null;
  const integer=v=>typeof v==="string"&&/^\d{1,3}$/.test(v)?Number(v):NaN;
  const prob=v=>typeof v==="string"&&/^(?:[01](?:\.\d{1,15})?|\.\d{1,15})$/.test(v)?Number(v):NaN;
  const n=integer(raw.n),p=prob(raw.p),k=integer(raw.k);
  if(!Number.isInteger(n)||n<1||n>500||!Number.isFinite(p)||p<0||p>1||!Number.isInteger(k)||k>n)return null;
  return{n,p,k,pText:raw.p};
 }
 const hasTyped=["n","p","k"].some(k=>params.has(k));
 const cases=["case","example"].filter(k=>params.has(k));
 const named=cases.length===1&&params.getAll(cases[0]).length===1&&((cases[0]==="case"&&params.get("case")==="binomial-pdf-demo")||(cases[0]==="example"&&params.get("example")==="demo"));
 const linked=hasTyped&&!cases.length?typedPrefill():null;
 let prefillError=hasTyped&&!linked||cases.length&&!named?"Linked inputs could not be loaded. The original Try question is ready.":"";
 let challenge={...(linked||practiceExample)};
 nEl.value=challenge.n;pEl.value=challenge.pText||challenge.p;kEl.value=challenge.k;
 independent=blank(linked||named?challenge:null);loadState(independent);
 const answer=$("answer"),feedback=$("feedback"),problemText=d=>"Assigned Try: n = "+d.n+", p = "+d.p+", P(X = "+d.k+").";
 function challengeView(custom=false){
  $("keypad-problem").textContent=problemText(challenge);
  if(custom||linked){
   $("challenge-title").textContent=custom?"Your exact-count question":"Linked exact-count event";
   $("challenge-description").textContent="For "+challenge.n+" independent trials, each with success probability "+challenge.p+", find P(X = "+challenge.k+").";
   $("answer-hint").textContent="Use the single count as X Value. An at-most question would include counts below it as well.";
  }
 }
 function update(){
  const n=nEl.valueAsNumber,k=kEl.valueAsNumber;kEl.max=Number.isInteger(n)&&n>=1&&n<=500?n:500;
  eventLine.textContent=[nEl,pEl,kEl].every(x=>Number.isFinite(x.valueAsNumber)&&x.validity.valid)?"Draft: P(X = "+k+")":"Enter valid values to set the event.";
  out.hidden=true;out.replaceChildren();
 }
 challengeView();
 model.addEventListener("input",update);model.addEventListener("change",update);update();
 model.addEventListener("submit",e=>{
  e.preventDefault();if(lane!==null)return;
  const n=nEl.valueAsNumber,p=pEl.valueAsNumber,k=kEl.valueAsNumber;
  const raw=pEl.value;
  if(!model.reportValidity()||!Number.isInteger(n)||n<1||n>500||!Number.isInteger(k)||k<0||k>n)return;
  if(!/^(?:[01](?:\.\d{1,15})?|\.\d{1,15})$/.test(raw)||!Number.isFinite(p)||p<0||p>1){
   out.textContent="Use a probability from 0 to 1 written as a decimal (up to 15 places).";out.hidden=false;return;
  }
  challenge={n,p,k,pText:raw};prefillError="";$("prefill-notice").hidden=true;challengeView(true);
  answer.value="";feedback.textContent="";feedback.className="feedback";
  independent=blank(challenge);loadState(independent);renderTry();
  out.textContent="New givens loaded. Use the handheld to calculate.";out.hidden=false;
 });
 answer.addEventListener("input",()=>{feedback.textContent="";feedback.className="feedback";});
 $("answer-form").addEventListener("submit",e=>{
  e.preventDefault();if(lane!==null)return;
  const v=answer.valueAsNumber,correct=mass(challenge.n,challenge.p,challenge.k),r=Number(correct.toPrecision(3));
  if(!Number.isFinite(v)||v<0||v>1)return;
  if(correct===0&&challenge.p>0&&challenge.p<1){feedback.className="feedback is-wrong";feedback.textContent="This nonzero probability is too small for the simulator to check.";return;}
  const valid=v===r;feedback.className="feedback"+(valid?"is-right":"is-wrong");
  feedback.textContent=valid?"Correct. You found the probability of exactly "+challenge.k+".":Math.abs(v-correct)<=Math.max(Number.MIN_VALUE,Math.abs(correct)*.00055)?"The probability is right. Now round it to three significant figures.":"Not yet. Binomial Pdf needs a single X Value. Check n, p and the exact count.";
 });
 setupAudio();
 onMode(params.get("mode")==="try"?"try":"watch");
})();
