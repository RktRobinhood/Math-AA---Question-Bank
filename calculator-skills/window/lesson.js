"use strict";
(function(){
 const $=id=>document.getElementById(id),M=CT08Math,S=CT08Screen,T=CT08Tape,P=CT08WatchPlan,H=HandheldTransport;
 const canvas=$("drawing"),cap=$("caption");
 const stage=$("stage"),play=$("play"),seek=$("seek"),audio=$("narration"),lcd=$("lcd"),screen=S.screen($("drawing")),expr=$("expression"),settings=$("settings"),hot=$("hotspots");
 const params=new URLSearchParams(location.search),seedTry="(x-15)^2+2",watchQ=M.parse("(x-12)^2+3");
 const create=raw=>({state:"entry",raw,q:null,bounds:{...M.standard},values:M.rawBounds(M.standard),field:0,menuIndex:3,subIndex:0,reframed:false,error:"",bad:null});
 let linked=null,unsafe=false;
 if(params.has("expr")){
  try{
   if(params.getAll("expr").length!==1 || params.get("expr").length>80)throw Error("Invalid link");
   linked=M.parse(params.get("expr"));
  }catch{unsafe=true;}
 }
 const challenge=linked||M.parse(seedTry);
 $("keypad-problem").textContent=$("try-line").textContent="Plot f(x) = "+M.displayExpr(challenge.raw)+". Frame its vertex and both arms.";
 let state=create(challenge.raw),mode="watch",edited=false,replaceActive=true;
 let layout=P.make(),duration=layout.duration,phase="",t=0,playing=false,pending=false,raf=0,origin=0,useAudio=true,playEpoch=0,cache="";
 const shell=HandheldShell.mount({host:$("handheld-host"),screen:lcd,label:"TI-Nspire CX II-T Graphs",interactive:false,onKey:key=>press(key)});
 const surface=$("workspace"),overlay=$("play-feedback"),cc=$("cc"),speedSelect=$("play-rate");
 const framingKey="qb-calculator-watch-frame";
 const readFrame=()=>{try{return localStorage.getItem(framingKey)==="full"?"full":"screen";}catch{return "screen";}};
 let framing=readFrame(),showCaptions=false,initiated=false;
 audio.playbackRate=1;audio.preservesPitch=true;
 const chrome=CalculatorWatchPlayer.mount({player:stage,surface,play,seek,expand:$("fullscreen"),feedback:overlay,active:()=>mode==="watch"});
 function paintFraming(){
  stage.classList.toggle("ct08-screen-view",mode==="watch"&&framing==="screen");
  $("view-full").setAttribute("aria-pressed",String(framing==="full"));
  $("view-screen").setAttribute("aria-pressed",String(framing==="screen"));
  fitBankWatch();
 }
 function chooseFrame(value){
  framing=value;try{localStorage.setItem(framingKey,value);}catch{}
  paintFraming();
 }
 $("view-full").addEventListener("click",()=>chooseFrame("full"));
 $("view-screen").addEventListener("click",()=>chooseFrame("screen"));
 window.addEventListener("storage",e=>{if(e.key===null||e.key===framingKey){framing=readFrame();paintFraming();}});
 function captions(value){
  showCaptions=value;cc.setAttribute("aria-pressed",String(value));
  cc.setAttribute("aria-label",value?"Hide captions":"Show captions");
  $("caption-band").hidden=mode!=="watch"||!value||!layout.at(t).speaking;
  fitBankWatch();
 }
 cc.addEventListener("click",()=>captions(!showCaptions));
 $("transcript").textContent=T.captions.join(" ");
 const readable={x:"x",square:"x²",enter:"Enter",tab:"Tab",plus:"+",minus:"−",lparen:"(",rparen:")",menu:"Menu"};
 const hints={entry:"Press Enter to plot the function.",plotted:"Open Menu → Window/Zoom → Window Settings.",menu:"Choose 4: Window/Zoom.",submenu:"Choose 1: Window Settings.",settings:"Change the minimum and maximum on each axis. Leave the tick spacing on Auto if you don’t need to change it."};
 const controls=M.names.map((name,i)=>{
  const wrap=document.createElement("label"),label=document.createElement("span"),input=document.createElement("input");
  input.id="window-"+name;input.type="text";input.inputMode=i===2||i===5?"text":"decimal";input.maxLength=30;input.spellcheck=false;input.autocomplete="off";input.setAttribute("aria-label",name);
  label.textContent=name;wrap.append(label,input);$("window-fields").append(wrap);
  input.addEventListener("focus",()=>{if(mode!=="try")return;state.field=i;replaceActive=false;input.select();markField();});
  input.addEventListener("input",()=>{if(mode!=="try"||state.state!=="settings")return;state.values[i]=input.value;state.field=i;state.error="";state.bad=null;input.removeAttribute("aria-invalid");edited=true;replaceActive=false;show("");markField();});
  return input;
 });
 const stops=[...controls,$("apply"),$("cancel")];
 stops.slice(6).forEach((b,i)=>b.addEventListener("focus",()=>{if(mode==="try"){state.field=6+i;markField();}}));
 function markField(index=state.field){stops.forEach((e,i)=>e.dataset.active=String(index===i));}
 function show(msg="",wrong=false){
  const v=$("keypad-result");v.hidden=!msg;v.textContent=msg;v.className="feedback "+(wrong?"is-wrong":"is-right");
 }
 function snapshot(n){
  const s=create("");
  for(let i=0;i<n;i++)Object.assign(s,T.keys[i].delta);
  if(s.state!=="entry")s.q=watchQ;
  return s;
 }
 function formatLimits(w){return "x: "+M.pretty(w.x0)+" to "+M.pretty(w.x1)+" · y: "+M.pretty(w.y0)+" to "+M.pretty(w.y1);}
 function label(s){
  const status=s.state==="settings"?"Window Settings. Active: "+(M.names[s.field]||["OK","Cancel"][s.field-6])+".":hints[s.state];
  $("lcd-text").textContent=(s.q?"Graph of "+M.displayExpr(s.q.raw)+". "+formatLimits(s.bounds)+". ":"Function entry "+M.displayExpr(s.raw)+". ")+status;
 }
 function syncSettings(s,watch){
  settings.hidden=s.state!=="settings";
  if(settings.hidden)return;
  controls.forEach((el,i)=>{
   if(el.value!==s.values[i])el.value=s.values[i];
   el.readOnly=watch;el.tabIndex=watch?-1:0;
   if(s.bad===i)el.setAttribute("aria-invalid","true");else el.removeAttribute("aria-invalid");
  });
  stops.slice(6).forEach(el=>{el.disabled=watch;});
  markField(s.field);
 }
 function render(s,watch){stage.dataset.step=s.state;screen.draw(s);label(s);syncSettings(s,watch);}
 const readableKey=k=>readable[k]||k;
 const chapterHost=$("chapter-rail"),mobileChapters=matchMedia("(max-width:700px)");
 const speechKey={lparen:"left parenthesis",rparen:"right parenthesis",square:"x squared",plus:"plus",minus:"minus"};
 const occurrence=n=>"press-"+n;
 const chapterGroups=P.groups.map(([title,from,to],i)=>({
  id:"window-"+(i+1),title,keys:T.keys.slice(from,to).map(({key},j)=>({
   id:occurrence(from+j),label:readableKey(key),ariaLabel:speechKey[key]||readableKey(key)
  }))
 }));
 const chapterRail=CalculatorWatchChapters.mount(chapterHost,chapterGroups,{
  label:"Chapters and calculator keys",
  onChapter:id=>go(layout.spans[P.chapterFor.indexOf(chapterGroups.findIndex(group=>group.id===id))].start)
 });
 function placeChapterRail(){
  const fullscreen=document.fullscreenElement===stage||stage.classList.contains("watch-fullscreen-fallback");
  const target=$(mobileChapters.matches?(fullscreen?"fullscreen-chapters":"mobile-chapters"):"desktop-chapters");
  if(chapterHost.parentElement!==target){
   const focus=chapterHost.contains(document.activeElement)?document.activeElement:null;
   target.append(chapterHost);if(focus)focus.focus({preventScroll:true});
  }
  $("mobile-chapters").hidden=mode!=="watch"||target.id!=="mobile-chapters";
 }
 mobileChapters.addEventListener("change",()=>{placeChapterRail();fitBankWatch();});
 function paintChapters(ch,applied){
  const [,from,to]=P.groups[ch];
  chapterRail.setState({chapterId:chapterGroups[ch].id,keyId:applied>from&&applied<=to?occurrence(applied-1):null});
 }
 const clock=x=>Math.floor(x/60)+":"+String(Math.floor(x)%60).padStart(2,"0");
 function renderWatch(){
  if(mode!=="watch")return;
  const point=layout.at(t),{chapter,applied,key}=P.frame(point);
  stage.dataset.phase=point.speaking?"voice":"hold";
  stage.dataset.applied=applied;
  const timeLabel=clock(t>=duration-.015?Math.round(duration):t)+" / "+clock(Math.round(duration));
  seek.value=t;seek.setAttribute("aria-valuetext",timeLabel.replace("/","of"));$("clock").textContent=timeLabel;
  shell.setKeys(key?[key]:[]);
  const keyLabel=applied?readableKey(T.keys[applied-1].key):"—";
  if($("active-key").textContent!==keyLabel)$("active-key").textContent=keyLabel;
  if(!initiated){overlay.dataset.initial="true";overlay.hidden=t>.04;}
  paintChapters(chapter,applied);
  const coaching=P.note(point,applied);
  for(const el of [$("teaching-note"),$("compact-note")])if(el.textContent!==coaching)el.textContent=coaching;
  const spoken=point.speaking?T.captions[point.span.i]:"";
  if(cap.textContent!==spoken)cap.textContent=spoken;
  const hideCaption=!showCaptions||!spoken;
  if($("caption-band").hidden!==hideCaption)$("caption-band").hidden=hideCaption;
  if(cache===String(applied))return;
  cache=String(applied);
  const s=snapshot(applied);render(s,true);
  const status=s.reframed?"Window: [10, 14] × [0, 8]":s.state==="settings"?
     (s.field<6?M.names[s.field]+": "+s.values[s.field].replace(/^(-?\d+\.\d{5})\d+$/,"$1…").replace("-","−"):"OK · apply window"):s.state==="plotted"?"Default x: −10 to 10":"";
  const readout=$("window-readout");readout.hidden=!status;readout.textContent=status;
 }
 function setOrigin(){origin=performance.now()-t*1000;}
 function labelPlay(){
  const monitor=playing||pending,label=monitor?"Pause":t>=duration-.015?"Replay":"Play";
  play.setAttribute("aria-label",label);play.title=label;play.dataset.playing=String(playing);
  play.querySelector(".play-icon").toggleAttribute("hidden",monitor);play.querySelector(".pause-icon").toggleAttribute("hidden",!monitor);
 }
 function pause(){
  playEpoch++;pending=false;playing=false;audio.pause();phase="";cancelAnimationFrame(raf);labelPlay();renderWatch();
 }
 function tick(now){
  if(!playing||mode!=="watch")return;
  const {span}=layout.at(t);
  if(phase==="voice"){
   t=useAudio?Math.min(span.voiceEnd,span.start+Math.max(0,audio.currentTime-span.from)):
      Math.min(span.voiceEnd,(now-origin)/1000);
   if(t>=span.voiceEnd-.014||(useAudio&&audio.ended)){
    t=span.voiceEnd;phase="hold";audio.pause();setOrigin();
   }
  }else{
   t=Math.min(span.end,(now-origin)/1000);
   if(t>=duration){t=duration;pause();return;}
   if(t>=span.end){
    const stamp=playEpoch;renderWatch();
    void enterPhase(stamp).then(ok=>{if(ok&&playing)raf=requestAnimationFrame(tick);});
    return;
   }
  }
  renderWatch();raf=requestAnimationFrame(tick);
 }
 async function enterPhase(stamp){
  const point=layout.at(t);phase=point.speaking?"voice":"hold";setOrigin();
  if(!point.speaking||!useAudio){audio.pause();return stamp===playEpoch&&mode==="watch";}
  let timeout;
  try{
   audio.currentTime=point.audioTime;audio.playbackRate=1;
   await Promise.race([audio.play(),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error("Narration unavailable")),4500);})]);
  }catch{if(stamp===playEpoch)silentMedia();}
  finally{clearTimeout(timeout);}
  return stamp===playEpoch&&mode==="watch";
 }
 async function start(manual=true){
  if(mode!=="watch")return;
  initiated=true;overlay.dataset.initial="false";overlay.hidden=true;
  if(t>=duration-.015)t=0;
  const stamp=++playEpoch;
  pending=true;labelPlay();renderWatch();
  if(!await enterPhase(stamp))return;
  pending=false;playing=true;labelPlay();if(manual)chrome.flash(true);raf=requestAnimationFrame(tick);
 }
 function go(v){
  const resume=playing||pending;
  if(resume)pause();
  t=M.clamp(Number(v)||0,0,duration);setOrigin();
  if(useAudio&&Number.isFinite(audio.duration))audio.currentTime=layout.at(t).audioTime;
  renderWatch();labelPlay();
  if(resume&&t<duration-.015)void start(false);
 }
 function toggle(){if(playing||pending){pause();chrome.flash(false);}else void start();}
 function silentMedia(){
  if(!useAudio)return;
  useAudio=false;audio.pause();setOrigin();
  $("media-status").textContent="Narration unavailable. Captions only.";
  $("media-status").hidden=mode!=="watch";$("sound").hidden=true;
  captions(true);
 }
 seek.max=duration;
 audio.addEventListener("error",silentMedia);
 document.addEventListener("visibilitychange",()=>{if(document.hidden&&(playing||pending))pause();});
 $("sound").addEventListener("click",()=>{
  audio.muted=!audio.muted;const label=audio.muted?"Unmute narration":"Mute narration";
  $("sound").setAttribute("aria-pressed",String(audio.muted));$("sound").setAttribute("aria-label",label);$("sound").title=label;
  $("sound").querySelector(".sound-waves").toggleAttribute("hidden",audio.muted);
  $("sound").querySelector(".sound-off").toggleAttribute("hidden",!audio.muted);
 });
 speedSelect.addEventListener("change",()=>{
  const resume=playing||pending,old=layout;
  if(resume)pause();
  layout=P.make(Number(speedSelect.value));t=layout.remap(old,t);duration=layout.duration;seek.max=duration;
  renderWatch();labelPlay();
  if(resume&&t<duration-.015)void start(false);
 });
 play.addEventListener("click",toggle);seek.addEventListener("input",()=>go(seek.value));
 function jumpMenu(panel,index,action){
  const b=document.createElement("button");
  b.type="button";b.setAttribute("aria-label",panel.rows[index]);b.style.left=panel.x/3.2+"%";
  b.style.top=(panel.y+2+index*panel.h)/2.4+"%";b.style.width=panel.w/3.2+"%";b.style.height=panel.h/2.4+"%";
  b.addEventListener("click",action);hot.append(b);
 }
 function renderTry(){
  if(mode!=="try")return;
  render(state,false);hot.replaceChildren();
  $("check-window").hidden=!state.q||state.state!=="plotted";
  $("keypad-hint").textContent=hints[state.state];
  const suffix=unsafe&&!edited?"The linked expression was invalid. The original practice function is loaded.":"";
  show(state.error||suffix,Boolean(state.error||suffix));
  if(state.state==="menu")jumpMenu(S.PANEL.main,3,()=>press("4"));
  if(state.state==="submenu"){jumpMenu(S.PANEL.sub,0,()=>press("1"));jumpMenu(S.PANEL.sub,4,()=>press("5"));}
 }
 function transition(next,properties={}){
  if(next!=="plotted")stopPan();
  state={...state,state:next,error:"",bad:null,...properties};renderTry();
 }
 function plot(raw){
  edited=true;
  try{
   const q=M.parse(raw);transition("plotted",{raw:q.raw,q,reframed:false});expr.value=q.raw;
  }catch(e){transition("entry",{raw,q:null,error:e.message});}
 }
 function selectField(i){
  state.field=(i+stops.length)%stops.length;replaceActive=true;markField();label(state);
 }
 function commit(){
  const v=M.apply(state.values);
  if(!v.bounds){state.error=v.error;state.bad=v.field;selectField(v.field);renderTry();return;}
  edited=true;transition("plotted",{bounds:v.bounds,values:M.rawBounds(v.bounds),reframed:true});
 }
 function startSettings(){replaceActive=true;transition("settings",{values:M.rawBounds(state.bounds),field:0});}
 function cancel(){transition("plotted",{values:M.rawBounds(state.bounds)});}
 function handheldEdit(k){
  const field=controls[state.field];if(!field)return;
  if(k==="left"||k==="right"){
   const n=field.selectionEnd+(k==="left"?-1:1);field.setSelectionRange(Math.max(0,n),Math.max(0,n));replaceActive=false;return;
  }
  if(k==="del"||/^[0-9.]$/.test(k)||["neg","minus","plus","dot","div","a","u","t","o"].includes(k)){
   if(replaceActive)field.setSelectionRange(0,field.value.length);
   if(H.modify(field,k))replaceActive=false;
  }
 }
 function press(k){
  if(mode!=="try")return;const w=state.state;
  if(w==="settings"){
   if(k==="esc"){cancel();return;}
   if(k==="tab"||k==="down"){selectField(state.field+1);return;}
   if(k==="up"){selectField(state.field-1);return;}
   if(k==="menu")return;
   if(k==="enter"||k==="select"){if(state.field===7)cancel();else commit();return;}
   handheldEdit(k);return;
  }
  if(k==="esc"){if(w==="submenu")transition("menu");else if(state.q)transition("plotted");else transition("entry");return;}
  if(k==="menu"&&state.q){edited=true;transition("menu",{menuIndex:3});return;}
  if(w==="menu"){
   if(k==="up"||k==="down"){transition("menu",{menuIndex:(state.menuIndex+(k==="down"?1:7))%8});return;}
   if(k==="4"||(["enter","select","right"].includes(k)&&state.menuIndex===3)){transition("submenu",{menuIndex:3,subIndex:0});return;}
   return;
  }
  if(w==="submenu"){
   if(k==="left"){transition("menu");return;}
   if(k==="up"||k==="down"){transition("submenu",{subIndex:(state.subIndex+(k==="down"?1:11))%12});return;}
   if(k==="1"||(["enter","select","right"].includes(k)&&state.subIndex===0)){startSettings();return;}
   if(k==="5"||(["enter","select","right"].includes(k)&&state.subIndex===4)){transition("plotted",{bounds:{...M.standard},reframed:false});return;}
   return;
  }
  if(k==="tab"){transition("entry",{raw:expr.value});return;}
  if(k==="enter"){plot(expr.value);return;}
  if(H.character(k)!==null||k==="del"){if(H.modify(expr,k,{replace:w!=="entry"}))edited=true;}
 }
 $("expression-form").addEventListener("submit",e=>{e.preventDefault();plot(expr.value);});
 expr.addEventListener("input",()=>{if(mode==="try"){edited=true;transition("entry",{raw:expr.value,q:null,reframed:false});}});
 settings.addEventListener("submit",e=>{e.preventDefault();if(mode==="try")commit();});
 settings.addEventListener("keydown",e=>{if(mode==="try"&&e.key==="Escape"){e.preventDefault();e.stopPropagation();cancel();stage.focus();}});
 $("cancel").addEventListener("click",cancel);
 $("check-window").addEventListener("click",()=>{const result=M.assess(state.q,state.bounds);show(result.message,!result.good);});
 $("reset-keypad").addEventListener("click",()=>{stopPan();edited=true;state=create(challenge.raw);expr.value=state.raw;renderTry();stage.focus({preventScroll:true});});
 const tabs=[$("watch-tab"),$("try-tab")];
 let drag=null;
 function stopPan(){
  if(!drag)return;
  const id=drag.id;drag=null;stage.dataset.panning="false";
  if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);
 }
 canvas.addEventListener("pointerdown",e=>{
  if(mode!=="try"||state.state!=="plotted"||!e.isPrimary||e.button!==0)return;
  const rect=canvas.getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width*320,y=(e.clientY-rect.top)/rect.height*240;
  if(x<S.SCREEN_X.l||x>S.SCREEN_X.r||y<28||y>217)return;
  drag={id:e.pointerId,x:e.clientX,y:e.clientY,base:{...state.bounds},
   width:rect.width*(S.SCREEN_X.r-S.SCREEN_X.l)/320,height:rect.height*189/240};
  canvas.setPointerCapture(e.pointerId);stage.dataset.panning="true";
 });
 canvas.addEventListener("pointermove",e=>{
  if(!drag||e.pointerId!==drag.id||mode!=="try"||state.state!=="plotted")return;
  const {base,width,height}=drag;
  const dx=M.clamp((drag.x-e.clientX)/width*(base.x1-base.x0),-1e9-base.x0,1e9-base.x1);
  const dy=M.clamp((e.clientY-drag.y)/height*(base.y1-base.y0),-1e9-base.y0,1e9-base.y1);
  const bounds={...base,x0:base.x0+dx,x1:base.x1+dx,y0:base.y0+dy,y1:base.y1+dy};
  if(["x0","x1","y0","y1"].every(k=>bounds[k]===state.bounds[k]))return;
  edited=true;state.bounds=bounds;state.values=M.rawBounds(bounds);state.error="";
  renderTry();
 });
 for(const type of ["pointerup","pointercancel","lostpointercapture"])
  canvas.addEventListener(type,e=>{if(drag&&e.pointerId===drag.id)stopPan();});
 function modeTo(next){
  if(next==="try"&&mode==="watch"){pause();chrome.clear();void chrome.exit();expr.value=state.raw;}
  stopPan();
  mode=next;stage.dataset.mode=mode;cache="";
  const watch=mode==="watch";
  tabs.forEach((b,i)=>{const yes=watch===(i===0);b.tabIndex=yes?0:-1;b.setAttribute("aria-selected",String(yes));});
  for(const n of ["watch","watch-side","watch-player","key-strip","compact-teaching"])$(n).hidden=!watch;
  for(const n of ["try","try-side","try-player"])$(n).hidden=watch;
  shell.setKeys([]);shell.setInteractive(!watch);placeChapterRail();paintFraming();captions(showCaptions);
  $("media-status").hidden=!watch||useAudio;
  if(watch){hot.replaceChildren();renderWatch();labelPlay();}
  else {overlay.hidden=true;renderTry();}
 }
 tabs.forEach((b,i)=>{
  b.addEventListener("click",()=>{modeTo(i?"try":"watch");if(i)stage.focus({preventScroll:true});});
  b.addEventListener("keydown",e=>{if(!["ArrowLeft","ArrowRight","Home","End"].includes(e.key))return;e.preventDefault();const next=e.key==="Home"?0:e.key==="End"?1:1-i;modeTo(next?"try":"watch");tabs[next].focus();});
 });
 $("return-watch").addEventListener("click",()=>{modeTo("watch");play.focus({preventScroll:true});});
 document.addEventListener("keydown",e=>{
  if(mode!=="try"||e.defaultPrevented||e.metaKey||e.ctrlKey||e.altKey||e.target.closest("input,textarea,select,a,summary,[contenteditable]"))return;
  if((!stage.contains(e.target)&&e.target!==document.body)||e.target.closest("button")&&(e.key==="Enter"||e.key===" "))return;
  if(e.key==="Tab"&&state.state==="settings"&&e.target===stage){e.preventDefault();selectField(state.field+(e.shiftKey?-1:1));return;}
  const keys={Escape:"esc",Enter:"enter",Backspace:"del",Delete:"del",ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down",m:"menu",M:"menu",".":"dot","^":"power","+":"plus","-":"minus","*":"mul","/":"div","(":"lparen",")":"rparen","²":"square"};
  const k=keys[e.key]||(/^[0-9xXaAuUtToO]$/.test(e.key)?e.key.toLowerCase():"");
  if(k){e.preventDefault();press(k);}
 });
 modeTo(params.get("mode")==="try"?"try":"watch");
 if(audio.error)silentMedia();

 // Fit both live framings to the same stage and reserve the native phone/tablet tabs.
 function fitBankWatch(){
  if(mode!=="watch"||!shell.body.offsetWidth)return;
  const full=document.fullscreenElement===stage||stage.classList.contains("watch-fullscreen-fallback");
  const nav=full?0:(document.querySelector(".tabbar")?.offsetHeight||0);
  const box=stage.getBoundingClientRect(),vh=window.visualViewport?.height||innerHeight;
  const occupied=$("watch-player").offsetHeight+$("compact-teaching").offsetHeight;
  const pads=getComputedStyle(surface);
  const room=vh-nav-(full?0:box.top+window.scrollY)-occupied-parseFloat(pads.paddingTop)-parseFloat(pads.paddingBottom)-3;
  stage.style.setProperty("--ct08-handset-fit",Math.floor(Math.max(innerHeight<680?78:101,Math.min(full?620:296,room*558/1168)))+"px");
  stage.style.setProperty("--ct08-lcd-fit",Math.floor(Math.max(142,Math.min(full?1160:600,room*4/3)))+"px");
  stage.style.setProperty("--ct08-scene-room",Math.floor(Math.max(140,room))+"px");
 }
 const bankWatchSizing=new ResizeObserver(fitBankWatch);
 [$("watch-player"),$("compact-teaching"),document.querySelector("main>.header")].forEach(el=>bankWatchSizing.observe(el));
 window.addEventListener("resize",fitBankWatch);
 window.visualViewport?.addEventListener("resize",fitBankWatch);
 function fitPresentation(){placeChapterRail();fitBankWatch();}
 document.addEventListener("fullscreenchange",fitPresentation);
 new MutationObserver(fitPresentation).observe(stage,{attributes:true,attributeFilter:["class"]});
 fitBankWatch();
})();
