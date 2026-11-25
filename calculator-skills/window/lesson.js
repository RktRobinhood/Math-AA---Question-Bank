"use strict";
(function(){
 const $=id=>document.getElementById(id),M=CT08Math,S=CT08Screen,T=CT08Tape,H=HandheldTransport;
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
 const preset=Boolean(linked)||unsafe||params.get("case")==="window-demo"||params.get("example")==="demo";
 const challenge=linked||M.parse(seedTry);
 $("keypad-problem").textContent=$("try-line").textContent="Plot f(x) = "+M.displayExpr(challenge.raw)+". Frame its vertex and both arms.";
 let state=create(challenge.raw),mode="watch",edited=false,forked=false,focused=false,focusConsidered=false,started=false,replaceActive=true;
 let t=0,duration=T.duration,playing=false,pending=false,raf=0,origin=0,useAudio=true,playEpoch=0,cache="";
 const shell=HandheldShell.mount({host:$("handheld-host"),screen:lcd,label:"TI-Nspire CX II-T Graphs",interactive:false,onKey:key=>press(key)});
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
 function snapshot(time){
  const s=create("");let key="";
  for(const e of T.keys){if(time<e.time)break;Object.assign(s,e.delta);key=time<e.time+.215?e.key:"";}
  if(s.state!=="entry")s.q=watchQ;
  return {s,key};
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
 function render(s,watch){screen.draw(s);label(s);syncSettings(s,watch);}
 const steps=$("steps");
 T.titles.forEach((title,i)=>{
  const li=document.createElement("li"),b=document.createElement("button"),no=document.createElement("span");
  b.type="button";no.textContent="0"+(i+1);b.append(no,document.createTextNode(title));
  b.addEventListener("click",()=>go(T.starts[i]));li.append(b);steps.append(li);
 });
 const clock=x=>Math.floor(x/60)+":"+String(Math.floor(x)%60).padStart(2,"0");
 function renderWatch(){
  if(mode!=="watch")return;
  const ch=T.starts.findLastIndex(v=>t>=v),ph=T.captionStarts.findLastIndex(v=>t>=v),{s,key}=snapshot(t);
  const stamp=[s.state,s.raw,s.bounds.x0,s.field,s.values.join(","),ch,ph].join("|");
  seek.value=t;seek.setAttribute("aria-valuetext",clock(t)+" of "+clock(duration));$("clock").textContent=clock(t)+" / "+clock(duration);
  shell.setKeys(key?[key]:[]);
  $("stage-play").hidden=started||t>=.1;
  if(cache===stamp)return;cache=stamp;render(s,true);
  $("caption").textContent=T.captions[ph];$("window-readout").dataset.visible=String(s.reframed);$("window-readout").setAttribute("aria-hidden",String(!s.reframed));
  [...steps.children].forEach((li,i)=>li.firstElementChild.setAttribute("aria-current",String(i===ch)));
 }
 function go(v){
  t=M.clamp(Number(v)||0,0,duration);origin=performance.now()-t*1000;
  if(Number.isFinite(audio.duration))audio.currentTime=t;
  renderWatch();if(!playing)labelPlay();
 }
 function labelPlay(){const name=playing?"Pause":t>=duration-.015?"Replay":"Play";play.textContent=name;play.setAttribute("aria-label",name);play.dataset.playing=String(playing);}
 function pause(){playEpoch++;pending=false;if(playing&&useAudio)t=audio.currentTime;playing=false;audio.pause();cancelAnimationFrame(raf);labelPlay();renderWatch();}
 function finish(){pause();t=duration;labelPlay();renderWatch();}
 function tick(now){
  if(!playing||mode!=="watch")return;
  t=useAudio?audio.currentTime:(now-origin)/1000;
  if(t>=duration){finish();return;}
  renderWatch();raf=requestAnimationFrame(tick);
 }
 function silentMedia(){useAudio=false;origin=performance.now()-t*1000;$("media-status").textContent="Captions only";$("sound-label").hidden=true;}
 async function start(){
  if(mode!=="watch")return;
  if(!focusConsidered){
   focusConsidered=true;fitWatch();
   const body=shell.body.getBoundingClientRect();
   if(!focused&&(body.width<185||body.top<0))focus(true);
  }
  if(document.activeElement===$("stage-play"))play.focus({preventScroll:true});
  started=true;$("stage-play").hidden=true;
  if(t>=duration-.015)go(0);
  const stamp=++playEpoch;pending=true;origin=performance.now()-t*1000;
  if(useAudio){try{audio.currentTime=t;await audio.play();}catch{if(stamp!==playEpoch)return;silentMedia();}}
  if(stamp!==playEpoch||mode!=="watch")return;
  pending=false;playing=true;labelPlay();raf=requestAnimationFrame(tick);
 }
 function toggle(){if(playing||pending)pause();else void start();}
 audio.addEventListener("loadedmetadata",()=>{if(!useAudio||!Number.isFinite(audio.duration)||audio.duration<=0)return;duration=audio.duration;seek.max=duration;renderWatch();});
 audio.addEventListener("error",silentMedia);audio.addEventListener("ended",finish);
 $("sound").addEventListener("change",()=>{audio.muted=!$("sound").checked;});
 $("stage-play").addEventListener("click",toggle);
 play.addEventListener("click",toggle);$("back").addEventListener("click",()=>go(t-10));$("next").addEventListener("click",()=>go(t+10));
 $("replay").addEventListener("click",()=>{pause();go(0);void start();});seek.addEventListener("input",()=>go(seek.value));
 // Size from the actual caption, controls, header and viewport. Reserving a steady
 // caption/readout envelope also prevents the end-frame from pushing controls below it.
 function fitWatch(){
  if(mode!=="watch")return;
  const nav=focused?0:document.querySelector(".tabbar").getBoundingClientRect().height;
  const h=(window.visualViewport?.height||innerHeight)-nav;
  const top=focused?0:Math.max(0,stage.getBoundingClientRect().top+window.scrollY);
  const occupied=$("watch-message").offsetHeight+$("watch-player").offsetHeight;
  const w=Math.max(82,Math.min(focused?338:304,Math.floor((h-top-occupied-24)*558/1168)));
  stage.style.setProperty("--watch-fit-width",w+"px");
 }
 const fitObserver=new ResizeObserver(fitWatch);
 for(const item of [$("watch-message"),$("watch-player"),document.querySelector(".header")])fitObserver.observe(item);
 window.addEventListener("resize",fitWatch);
 window.visualViewport?.addEventListener("resize",fitWatch);
 function focus(v){
  focused=Boolean(v);stage.classList.toggle("ct08-focused",focused);document.body.classList.toggle("ct08-focus-open",focused);
  const b=$("focus-view"),name=focused?"Exit focused view":"Focused view";
  b.setAttribute("aria-pressed",String(focused));b.setAttribute("aria-label",name);b.title=name;b.textContent=focused?"Exit":"⛶";
  if(focused)stage.scrollTop=0;fitWatch();
 }
 $("focus-view").addEventListener("click",()=>focus(!focused));
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
 $("reset-keypad").addEventListener("click",()=>{edited=true;state=create(challenge.raw);expr.value=state.raw;renderTry();stage.focus({preventScroll:true});});
 const tabs=[$("watch-tab"),$("try-tab")];
 function modeTo(next,steal=false){
  if(next==="try"&&mode==="watch"){
   pause();if(focused)focus(false);
   if(steal&&!preset&&!edited&&!forked){const ss=snapshot(t).s;state={...ss,bounds:{...ss.bounds},values:[...ss.values]};forked=true;replaceActive=true;}
   expr.value=state.raw;
  }
  mode=next;stage.dataset.mode=mode;cache="";
  const watch=mode==="watch";
  tabs.forEach((b,i)=>{const yes=watch===(i===0);b.tabIndex=yes?0:-1;b.setAttribute("aria-selected",String(yes));});
  for(const n of ["watch","watch-side","watch-message","watch-player"])$(n).hidden=!watch;
  for(const n of ["try","try-side","try-player"])$(n).hidden=watch;
  shell.setKeys([]);shell.setInteractive(!watch);
  if(watch){hot.replaceChildren();renderWatch();fitWatch();}else{$("stage-play").hidden=true;renderTry();}
 }
 tabs.forEach((b,i)=>{
  b.addEventListener("click",()=>{modeTo(i?"try":"watch");if(i)stage.focus({preventScroll:true});});
  b.addEventListener("keydown",e=>{if(!["ArrowLeft","ArrowRight","Home","End"].includes(e.key))return;e.preventDefault();const next=e.key==="Home"?0:e.key==="End"?1:1-i;modeTo(next?"try":"watch");tabs[next].focus();});
 });
 $("take-over").addEventListener("click",()=>{modeTo("try",true);stage.focus({preventScroll:true});});
 $("return-watch").addEventListener("click",()=>{modeTo("watch");play.focus({preventScroll:true});});
 document.addEventListener("keydown",e=>{
  if(e.key==="Escape"&&focused){e.preventDefault();focus(false);$("focus-view").focus({preventScroll:true});return;}
  if(e.metaKey||e.ctrlKey||e.altKey||e.target.closest("input,textarea,select,a,summary,[contenteditable]"))return;
  if(mode==="watch"&&!e.target.closest("button")&&!e.repeat){
   const k=e.key.toLowerCase();if(k==="k"||k===" "){e.preventDefault();toggle();}else if(k==="j"||k==="l"){e.preventDefault();go(t+(k==="j"?-10:10));}
   return;
  }
  if(mode!=="try"||!stage.contains(e.target)&&e.target!==document.body||e.target.closest("button")&&(e.key==="Enter"||e.key===" "))return;
  if(e.key==="Tab"&&state.state==="settings"&&e.target===stage){e.preventDefault();selectField(state.field+(e.shiftKey?-1:1));return;}
  const keys={Escape:"esc",Enter:"enter",Backspace:"del",Delete:"del",ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down",m:"menu",M:"menu",".":"dot","^":"power","+":"plus","-":"minus","*":"mul","/":"div","(":"lparen",")":"rparen","²":"square"};
  const k=keys[e.key]||(/^[0-9xXaAuUtToO]$/.test(e.key)?e.key.toLowerCase():"");
  if(k){e.preventDefault();press(k);}
 });
 modeTo(params.get("mode")==="try"?"try":"watch");
 fitWatch();
})();
