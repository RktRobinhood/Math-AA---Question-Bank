"use strict";
(function(){
 const $=id=>document.getElementById(id);
 const M=window.CT11Math,S=window.CT11Screen,T=window.CT11Tape,H=window.HandheldTransport;
 const stage=$("stage"),play=$("play"),seek=$("seek"),cap=$("caption"),audio=$("narration");
 const lcd=$("lcd"),canvas=$("drawing"),screen=S.screen(canvas),fields=[$("expression-1"),$("expression-2")],bound=$("bound");
 const watchPair=[M.parse("x^2"),M.parse("2x+3")],defaultTry=[M.parse("x^2"),M.parse("x+6")],params=new URLSearchParams(location.search);
 const knownWindow={x0:-4,x1:6,y0:-6,y1:16};
 const initial=raw=>({state:"entry",raw:raw.slice(),q:[null,null],active:0,low:null,high:null,cursor:null,mark:null,error:null,typed:"",windows:null});
 let linked=null,unsafe=false;
 if(params.has("f")||params.has("g")){
  try{
   if(params.getAll("f").length!==1||params.getAll("g").length!==1)throw Error("Invalid pair");
   const pair=[M.parse(params.get("f")),M.parse(params.get("g"))];
   if(M.crossings(pair).kind!=="cross")throw Error("No simple crossing");
   linked=pair;
  }catch{unsafe=true;}
 }
 const challenge=linked||defaultTry,points=M.crossings(challenge).points;
 const right=Boolean(linked)&&params.get("target")==="right",target=right?points.at(-1):points[0];
 const where=points.length>1?(right?"larger":"smaller")+" x-coordinate":"unique crossing";
 const title=points.length>1?(right?"Find the right crossing":"Find the left crossing"):"Find the crossing";
 const pairText="f₁(x) = "+M.displayExpr(challenge[0].raw)+"; f₂(x) = "+M.displayExpr(challenge[1].raw)+".";
 const prompt=points.length>1?"Find both coordinates of the intersection with the "+where+".":"Find both coordinates of the intersection.";
 const sameCurve=(a,b)=>["a","b","c"].every(k=>a[k]===b[k]);
 let mode="watch",state=initial(challenge.map(q=>q.raw)),edited=false,fresh=true;
 let t=0,duration=T.duration,playing=false,pending=false,raf=0,origin=0,useAudio=audio.hasAttribute("src"),playEpoch=0,cache="";
 const shell=HandheldShell.mount({host:$("handheld-host"),screen:lcd,label:"TI-Nspire CX II-T Graphs",interactive:false,onKey:key=>press(key)});
 const surface=$("workspace"),overlay=$("play-feedback"),cc=$("cc"),speedSelect=$("play-rate");
 const framingKey="qb-calculator-watch-frame";
 const readFrame=()=>{try{return localStorage.getItem(framingKey)==="full"?"full":"screen";}catch{return "screen";}};
 let framing=readFrame(),speed=Number(speedSelect.value),showCaptions=false,initiated=false,pendingSeek=null;
 audio.playbackRate=speed;audio.preservesPitch=true;
 const chrome=CalculatorWatchPlayer.mount({player:stage,surface,play,seek,expand:$("fullscreen"),feedback:overlay,active:()=>mode==="watch"});
 function paintFraming(){
  stage.classList.toggle("ct11-screen-view",mode==="watch"&&framing==="screen");
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
  $("caption-band").hidden=mode!=="watch"||!value;
  fitBankWatch();
 }
 cc.addEventListener("click",()=>captions(!showCaptions));
 $("transcript").textContent=T.captions.join(" ");
 const readable={x:"x",square:"x²",enter:"Enter",tab:"Tab",plus:"+",menu:"Menu",right:"→"};
 const tabs=[$("watch-tab"),$("try-tab")],steps=$("steps"),hot=$("hotspots");
 const hints={entry:"Enter a function and press Enter to plot. The handheld Tab key switches lines.",plotted:"Two curves are needed. Press Menu when both are plotted.",menu:"Choose 6: Analyze Graph.",submenu:"Choose 4: Intersection.",lower:"Place the lower bound just left of one crossing. Type an x-value or move the cursor.",upper:"Choose the upper bound just right of the same crossing.",result:"Read the x-coordinate and the common y-coordinate."};
 const syncFields=()=>fields.forEach((el,i)=>{el.value=state.raw[i]});
 const getWindow=()=>state.windows||M.windowFor(state.q);
 const fmtPair=z=>"("+M.pretty(z.x)+", "+M.pretty(z.y)+")";
 $("challenge-title").textContent=title;$("keypad-problem").textContent=prompt;
 $("challenge").textContent=pairText+" "+prompt;
 function labelGraph(s){
  const graphs=s.q.flatMap((p,i)=>p?["f"+(i+1)+" of x = "+M.displayExpr(p.raw)]:[]);
  if(s.state==="entry")graphs.push("Function entry "+(s.active+1)+": "+M.displayExpr(s.raw[s.active]));
  $("lcd-text").textContent=[...graphs,hints[s.state],s.low!=null?"Lower: "+M.pretty(s.low):"",s.typed?"Typed bound: "+s.typed:"",s.cursor!=null?"Cursor: "+M.pretty(s.cursor):"",s.mark?"Intersection "+fmtPair(s.mark):"",s.error||""].filter(Boolean).join(". ");
 }
 function snapshot(time){
  const v={state:"entry",active:0,first:"",second:"",firstPlot:false,secondPlot:false};
  let lit="",last="";
  for(const e of T.keys){
   if(time<e.time)break;
   Object.assign(v,e.delta);last=e.key;lit=time<e.time+.185?e.key:"";
  }
  const s={...initial([v.first,v.second]),...v,q:[v.firstPlot?watchPair[0]:null,v.secondPlot?watchPair[1]:null],windows:knownWindow};
  return{s,key:lit,last};
 }
 T.titles.forEach((title,i)=>{
  const li=document.createElement("li"),b=document.createElement("button"),no=document.createElement("span");
  b.type="button";no.textContent="0"+(i+1);b.append(no,document.createTextNode(title));
  b.addEventListener("click",()=>go(T.starts[i]));li.append(b);steps.append(li);
 });
 const sec=x=>Math.floor(x),clock=x=>Math.floor(x/60)+":"+String(sec(x)%60).padStart(2,"0");
 function renderWatch(){
  if(mode!=="watch")return;
  const chapter=T.starts.findLastIndex(start=>t>=start),phrase=T.captionStarts.findLastIndex(start=>t>=start),{s,key,last}=snapshot(t);
  // A seek can skip across Tab without changing the raw strings or chapter.
  const keyStamp=JSON.stringify([s.state,s.active,s.raw,s.q.map(q=>q?.raw??null),s.cursor,s.low,s.typed,s.mark,s.error,chapter,phrase]);
  const timeLabel=clock(t>=duration-.015?Math.round(duration):t)+" / "+clock(Math.round(duration));
  seek.value=t;seek.setAttribute("aria-valuetext",timeLabel.replace("/","of"));$("clock").textContent=timeLabel;
  shell.setKeys(key?[key]:[]);
  const keyLabel=readable[last]||last||"—";
  if($("active-key").textContent!==keyLabel)$("active-key").textContent=keyLabel;
  if(!initiated){overlay.dataset.initial="true";overlay.hidden=t>.04;}
  if(cache===keyStamp)return;cache=keyStamp;
  screen.draw(s);labelGraph(s);
  cap.textContent=T.captions[phrase];
  const guide=phrase===0?"Enter f₁(x), press Enter, then Tab to open f₂(x).":phrase===3?"With these two curves, the lower-bound prompt opens directly.":phrase===5?"Intersection: (3, 9).":phrase===6?"Same output: 3² = 2(3) + 3 = 9.":"";
  $("readout").hidden=!guide;$("readout").textContent=guide;
  [...steps.children].forEach((li,i)=>li.firstElementChild.setAttribute("aria-current",String(i===chapter)));
 }
 function setOrigin(){origin=performance.now()-t*1000/speed;}
 function audioSeek(){
  if(!useAudio)return;
  if(Number.isFinite(audio.duration)){audio.currentTime=t;pendingSeek=null;}
  else pendingSeek=t;
 }
 function go(v){
  t=M.clamp(Number(v)||0,0,duration);setOrigin();audioSeek();renderWatch();if(!playing)labelPlay();
 }
 function labelPlay(){
  const monitor=playing||pending,label=monitor?"Pause":t>=duration-.015?"Replay":"Play";
  play.setAttribute("aria-label",label);play.title=label;play.dataset.playing=String(playing);
  play.querySelector(".play-icon").hidden=monitor;play.querySelector(".pause-icon").hidden=!monitor;
 }
 function pause(){
  playEpoch++;pending=false;if(playing&&useAudio&&Number.isFinite(audio.currentTime))t=audio.currentTime;
  playing=false;audio.pause();cancelAnimationFrame(raf);labelPlay();renderWatch();
 }
 function finish(){pause();t=duration;labelPlay();renderWatch();}
 function tick(now){
  if(!playing||mode!=="watch")return;
  t=useAudio?audio.currentTime:(now-origin)*speed/1000;
  if(t>=duration-.002){finish();return;}
  renderWatch();raf=requestAnimationFrame(tick);
 }
 async function start(){
  if(mode!=="watch")return;
  initiated=true;overlay.dataset.initial="false";overlay.hidden=true;
  if(t>=duration-.015)go(0);
  const stamp=++playEpoch;
  pending=true;setOrigin();labelPlay();
  if(useAudio){
   try{audioSeek();await audio.play();}
   catch(error){if(stamp!==playEpoch)return;silentMedia();}
  }
  if(stamp!==playEpoch||mode!=="watch"){if(!playing&&!pending)audio.pause();return;}
  if(!useAudio)setOrigin();
  pending=false;playing=true;labelPlay();chrome.flash(true);raf=requestAnimationFrame(tick);
 }
 function toggle(){if(playing||pending){pause();chrome.flash(false);}else void start();}
 function silentMedia(){
  useAudio=false;pendingSeek=null;setOrigin();
  $("media-status").textContent="Narration unavailable. Captions only.";
  $("media-status").hidden=mode!=="watch";$("sound").hidden=true;
  captions(true);
 }
 audio.addEventListener("loadedmetadata",()=>{
  if(!useAudio||!Number.isFinite(audio.duration)||audio.duration<=0)return;
  duration=audio.duration;seek.max=duration;t=M.clamp(t,0,duration);
  if(pendingSeek!==null)audioSeek();
  renderWatch();labelPlay();
 });
 audio.addEventListener("error",silentMedia);audio.addEventListener("ended",finish);
 audio.addEventListener("pause",()=>{if(useAudio&&playing&&audio.paused&&!audio.ended)pause();});
 $("sound").addEventListener("click",()=>{
  audio.muted=!audio.muted;const label=audio.muted?"Unmute narration":"Mute narration";
  $("sound").setAttribute("aria-pressed",String(audio.muted));$("sound").setAttribute("aria-label",label);$("sound").title=label;
 });
 speedSelect.addEventListener("change",()=>{
  if(playing&&!useAudio)t=M.clamp((performance.now()-origin)*speed/1000,0,duration);
  speed=Number(speedSelect.value);audio.playbackRate=speed;setOrigin();
 });
 play.addEventListener("click",toggle);seek.addEventListener("input",()=>go(seek.value));
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
   const typed=state.raw.map(M.parse);
   return sameCurve(typed[0],challenge[0])&&sameCurve(typed[1],challenge[1])
    ||sameCurve(typed[0],challenge[1])&&sameCurve(typed[1],challenge[0]);
  }catch{return false;}
 }
 function renderTry(){
  if(mode!=="try")return;
  screen.draw(state);labelGraph(state);hot.replaceChildren();
  const inExercise=isExercise();
  $("exercise-active").hidden=!inExercise;
  $("exercise-inactive").hidden=inExercise;
  $("keypad-problem").textContent=inExercise?prompt:"Explore intersections for your own functions.";
  const b=state.state==="lower"||state.state==="upper";lcd.classList.toggle("pick",b);
  $("bound-form").hidden=!b;$("retry-bounds").hidden=state.state!=="result";
  $("bound-label").textContent=state.state==="lower"?"Lower bound x":"Upper bound x";
  $("keypad-hint").textContent=state.state==="plotted"?state.q.every(Boolean)?"Press Menu on the handheld.":"Press the handheld Tab key to enter the other function.":hints[state.state];
  show(state.error||(state.mark?"Intersection: "+fmtPair(state.mark)+".":"")|| (unsafe&&!edited?"The linked functions were invalid. An original practice pair is shown instead.":""),Boolean(state.error||unsafe&&!edited));
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
   for(const i of indices){parsing=i;q[i]=M.parse(fields[i].value);raw[i]=q[i].raw;}
   state={...initial(raw),q,state:"plotted",active:indices.at(-1)};
   syncFields();renderTry();
  }catch(e){select("entry",{active:parsing,error:"Function "+(parsing+1)+": "+e.message});}
 }
 function analyze(){
  if(!state.q.every(Boolean)){show("Plot both functions before choosing Intersection.",true);return;}
  const {x0,x1}=getWindow();select("lower",{low:null,high:null,cursor:(x0+x1)/2,mark:null});
 }
 const readBound=s=>/^[+−-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s.trim())?Number(s.trim().replace("−","-")):NaN;
 function confirm(x){
  if(!state.q.every(Boolean)||!["lower","upper"].includes(state.state))return;
  edited=true;const {x0,x1}=getWindow();
  if(!Number.isFinite(x)||x<x0||x>x1){show("Enter an x-value inside the graph window ("+M.pretty(x0)+" to "+M.pretty(x1)+").",true);return;}
  if(state.state==="lower"){select("upper",{low:x,cursor:x});return;}
  if(x<=state.low){show("The upper bound must be to the right of the lower bound.",true);return;}
  const r=M.solve(state.q,state.low,x);
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
    state.typed="";bound.value="";state.cursor=M.clamp(state.cursor+(k==="left"?-step:step),x0,x1);
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
   const raw=state.raw.slice(),q=state.q.slice();raw[i]=el.value;q[i]=null;state={...initial(raw),q,active:i};renderTry();
  });
 });
 $("bound-form").addEventListener("submit",e=>{e.preventDefault();confirm(readBound(bound.value));});
 bound.addEventListener("input",()=>{if(mode!=="try")return;edited=true;state.typed=bound.value;labelGraph(state);screen.draw(state);});
 $("retry-bounds").addEventListener("click",()=>{edited=true;analyze();});
 $("reset-keypad").addEventListener("click",()=>{edited=true;fresh=true;state=initial(challenge.map(q=>q.raw));syncFields();bound.value="";renderTry();stage.focus({preventScroll:true});});
 function pointer(ev){
  const r=canvas.getBoundingClientRect(),xp=(ev.clientX-r.left)*320/r.width,yp=(ev.clientY-r.top)*240/r.height;
  return xp>=S.SCREEN_X.l&&xp<=S.SCREEN_X.r&&yp>=26&&yp<=226?S.pointAt(state.q,xp,state.windows):null;
 }
 lcd.addEventListener("pointermove",e=>{
  if(mode!=="try"||!lcd.classList.contains("pick")||e.pointerType==="touch")return;
  const x=pointer(e);if(x===null)return;state.cursor=x;screen.draw(state);
 });
 lcd.addEventListener("click",e=>{
  if(mode!=="try"||!lcd.classList.contains("pick"))return;
  const x=pointer(e);if(x!==null)confirm(x);
 });
 function modeTo(next){
  if(next==="try"&&mode==="watch"){pause();chrome.clear();void chrome.exit();syncFields();}
  mode=next;stage.dataset.mode=mode;cache="";
  const watch=mode==="watch";
  tabs.forEach((b,i)=>{const yes=watch===(i===0);b.tabIndex=yes?0:-1;b.setAttribute("aria-selected",String(yes));});
  for(const n of ["watch","watch-side","watch-player","key-strip"])$(n).hidden=!watch;
  for(const n of ["try","try-side","try-player"])$(n).hidden=watch;
  shell.setKeys([]);shell.setInteractive(!watch);paintFraming();captions(showCaptions);
  $("media-status").hidden=!watch||useAudio;
  if(watch){hot.replaceChildren();lcd.classList.remove("pick");renderWatch();labelPlay();}
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
  const keys={Escape:"esc",Enter:"enter",Backspace:"del",Delete:"del",ArrowLeft:"left",ArrowRight:"right",m:"menu",M:"menu",".":"dot","^":"power","+":"plus","-":"minus","*":"mul","/":"div","(":"lparen",")":"rparen","²":"square"};
  const k=keys[e.key]||(/^[0-9xX]$/.test(e.key)?e.key.toLowerCase():"");
  if(k){e.preventDefault();press(k);}
 });
 const answer=[$("answer-x"),$("answer-y")],feedback=$("feedback");
 answer.forEach(a=>a.addEventListener("input",()=>{edited=true;feedback.textContent="";}));
 $("answer-form").addEventListener("submit",e=>{
  e.preventDefault();if(!isExercise())return;edited=true;
  const values=answer.map(a=>a.valueAsNumber),goals=[target.x,target.y];
  if(!values.every(Number.isFinite))return;
  const equal=(v,n)=>n===0?v===0:Math.abs(v-n)<=1e-10*Math.abs(n);
  const atThree=values.map((v,i)=>equal(v,Number(goals[i].toPrecision(3))));
  const hits=values.map((v,i)=>[3,4,5,6,7,8,9,10,11,12,13,14,15,16,17].some(sf=>equal(v,Number(goals[i].toPrecision(sf)))));
  const yes=hits.every(Boolean);
  feedback.className="feedback "+(yes?"is-right":"is-wrong");
  feedback.textContent=yes?(atThree.every(Boolean)?"Correct. Both functions have that y-value at your x.":"Correct. Round to three significant figures in your written answer if requested."):hits[0]?"The x-coordinate is right. Check the common y-value.":"Check that your bounds isolated the requested crossing.";
 });
 modeTo(params.get("mode")==="try"?"try":"watch");
 if(audio.error)silentMedia();

 // Fit both live framings to the same stage and reserve the native phone/tablet tabs.
 function fitBankWatch(){
  if(mode!=="watch"||!shell.body.offsetWidth)return;
  const full=document.fullscreenElement===stage||stage.classList.contains("watch-fullscreen-fallback");
  const nav=full?0:(document.querySelector(".tabbar")?.offsetHeight||0);
  const box=stage.getBoundingClientRect(),vh=window.visualViewport?.height||innerHeight;
  const occupied=$("watch-player").offsetHeight+$("caption-band").offsetHeight;
  const pads=getComputedStyle(surface);
  const room=vh-nav-(full?0:box.top+window.scrollY)-occupied-parseFloat(pads.paddingTop)-parseFloat(pads.paddingBottom)-3;
  stage.style.setProperty("--ct11-handset-fit",Math.floor(Math.max(innerHeight<680?78:101,Math.min(full?370:296,room*558/1168)))+"px");
  stage.style.setProperty("--ct11-lcd-fit",Math.floor(Math.max(142,Math.min(full?680:600,room*4/3)))+"px");
  stage.style.setProperty("--ct11-scene-room",Math.floor(Math.max(140,room))+"px");
 }
 const bankWatchSizing=new ResizeObserver(fitBankWatch);
 [$("watch-player"),$("caption-band"),document.querySelector("main>.header")].forEach(el=>bankWatchSizing.observe(el));
 window.addEventListener("resize",fitBankWatch);
 window.visualViewport?.addEventListener("resize",fitBankWatch);
 document.addEventListener("fullscreenchange",fitBankWatch);
 fitBankWatch();
})();
