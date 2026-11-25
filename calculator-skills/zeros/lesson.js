"use strict";
(function(){
 const $=id=>document.getElementById(id);
 const M=window.CT10Math,S=window.CT10Screen,T=window.CT10Tape,H=window.HandheldTransport;
 const stage=$("stage"),play=$("play"),seek=$("seek"),cap=$("caption"),audio=$("narration");
 const lcd=$("lcd"),canvas=$("drawing"),screen=S.screen(canvas),expr=$("expression"),bound=$("bound");
 const watchQ=M.parse("x^2-5x+6"),defaultTry="x^2-7x+10",params=new URLSearchParams(location.search);
 const initial=raw=>({state:"entry",raw,q:null,low:null,high:null,cursor:null,mark:null,error:null});
 let linked=null,unsafe=false;
 if(params.has("expr")){
  try{
   if(params.getAll("expr").length!==1)throw Error("Invalid link");
   const q=M.parse(params.get("expr"));
   if(!M.roots(q).some(r=>!r.touch))throw Error("Needs one crossing");
   linked=q;
  }catch{unsafe=true;}
 }
 const fixed=Boolean(linked)||params.get("case")==="zero-demo"||params.get("example")==="demo";
 const challenge=linked||M.parse(defaultTry),target=M.roots(challenge).at(-1).x;
 const prompt="Find the "+(M.roots(challenge).length===2?"larger ":"")+"zero of f(x) = "+M.displayExpr(challenge.raw)+".";
 let mode="watch",state=initial(challenge.raw),edited=false,forked=false,focused=false,focusConsidered=false;
 let t=0,duration=T.duration,playing=false,pending=false,raf=0,origin=0,useAudio=audio.hasAttribute("src"),playEpoch=0,cache="";
 const shell=HandheldShell.mount({host:$("handheld-host"),screen:lcd,label:"TI-Nspire CX II-T Graphs",interactive:false,onKey:key=>press(key)});
 const tabs=[$("watch-tab"),$("try-tab")],steps=$("steps"),hot=$("hotspots");
 const hints={entry:"Enter a line or quadratic, then press Enter to plot.",plotted:"Press Menu on the handheld.",menu:"Choose 6: Analyze Graph.",submenu:"Choose 1: Zero.",lower:"Put the lower bound to the left of the crossing. Move with the arrows, tap the graph, or enter x below.",upper:"Put the upper bound to the right of the same crossing, then confirm.",result:"Read the x-coordinate. To find another zero, choose new bounds."};
 $("challenge-title").textContent=M.roots(challenge).length===2?"Find the larger zero":"Find the zero";
 $("keypad-problem").textContent=prompt;$("challenge").textContent=prompt;
 function labelGraph(s){$("lcd-text").textContent=[s.q?"Graph of "+M.displayExpr(s.q.raw):"Function entry "+M.displayExpr(s.raw),hints[s.state],s.low!=null?"Lower: "+M.pretty(s.low):"",s.cursor!=null?"Cursor: "+M.pretty(s.cursor):"",s.mark?"Zero at x = "+M.pretty(s.mark.x):"",s.error||""].filter(Boolean).join(". ");}
 function snapshot(time){
  const s=initial("");let key="";
  for(const e of T.keys){
   if(time<e.time)break;
   Object.assign(s,e.delta);key=time<e.time+.23?e.key:"";
  }
  if(s.state!=="entry")s.q=watchQ;
  return{s,key};
 }
 T.titles.forEach((title,i)=>{
  const li=document.createElement("li"),b=document.createElement("button"),no=document.createElement("span");
  b.type="button";no.textContent="0"+(i+1);b.append(no,document.createTextNode(title));
  b.addEventListener("click",()=>go(T.starts[i]));li.append(b);steps.append(li);
 });
 const sec=x=>Math.floor(x),clock=x=>Math.floor(x/60)+":"+String(sec(x)%60).padStart(2,"0");
 function renderWatch(){
  if(mode!=="watch")return;
  const chapter=T.starts.findLastIndex(start=>t>=start), phrase=T.captionStarts.findLastIndex(start=>t>=start), {s,key}=snapshot(t);
  const keyStamp=[s.state,s.raw,s.cursor,chapter,phrase].join("|");
  seek.value=t;seek.setAttribute("aria-valuetext",clock(t)+" of "+clock(duration));$("clock").textContent=clock(t)+" / "+clock(duration);
  shell.setKeys(key?[key]:[]);
  if(cache===keyStamp)return;cache=keyStamp;
  screen.draw(s);labelGraph(s);
  cap.textContent=T.captions[phrase];$("zero-readout").hidden=phrase!==6;$("intercept-contrast").hidden=phrase<7;
  [...steps.children].forEach((li,i)=>li.firstElementChild.setAttribute("aria-current",String(i===chapter)));
 }
 function go(v){
  t=M.clamp(Number(v)||0,0,duration);origin=performance.now()-t*1000;
  if(Number.isFinite(audio.duration))audio.currentTime=t;
  renderWatch();if(!playing)labelPlay();
 }
 function labelPlay(){const label=playing?"Pause":t>=duration-.015?"Replay":"Play";play.textContent=label;play.setAttribute("aria-label",label);play.dataset.playing=String(playing);}
 function pause(){playEpoch++;pending=false;if(playing&&useAudio)t=audio.currentTime;playing=false;audio.pause();cancelAnimationFrame(raf);labelPlay();renderWatch();}
 function finish(){pause();t=duration;labelPlay();renderWatch();}
 function tick(now){
  if(!playing||mode!=="watch")return;
  t=useAudio?audio.currentTime:(now-origin)/1000;
  if(t>=duration){finish();return}
  renderWatch();raf=requestAnimationFrame(tick);
 }
 async function start(){
  if(mode!=="watch")return;
  if(!focusConsidered){
   focusConsidered=true;const h=window.visualViewport?.height||innerHeight;
   const low=Math.max(...["enter","1","x"].map(k=>shell.getKey(k).getBoundingClientRect().bottom));
   if(!focused&&low>h-26)focus(true);
  }
  if(t>=duration-.015)go(0);
  const stamp=++playEpoch;
  pending=true;origin=performance.now()-t*1000;
  if(useAudio){
   try{audio.currentTime=t;await audio.play();}
   catch(error){if(stamp!==playEpoch)return;silentMedia();}
  }
  if(stamp!==playEpoch||mode!=="watch")return;
  pending=false;playing=true;labelPlay();raf=requestAnimationFrame(tick);
 }
 function toggle(){if(playing||pending)pause();else void start();}
 function silentMedia(){
  useAudio=false;origin=performance.now()-t*1000;
  $("media-status").textContent="Captions only";$("sound-label").hidden=true;
 }
 // The packaging of this lesson includes a narration source only after independent transcript review.
 audio.addEventListener("loadedmetadata",()=>{
  if(!Number.isFinite(audio.duration)||audio.duration<=0)return;
  if(!useAudio)return;duration=audio.duration;seek.max=duration;$("media-status").textContent="Narration";$("sound-label").hidden=false;renderWatch();
 });
 audio.addEventListener("error",silentMedia);audio.addEventListener("ended",finish);
 $("sound").addEventListener("change",()=>{audio.muted=!$("sound").checked;});
 play.addEventListener("click",toggle);$("back").addEventListener("click",()=>go(t-10));$("next").addEventListener("click",()=>go(t+10));
 $("replay").addEventListener("click",()=>{pause();go(0);void start();});seek.addEventListener("input",()=>go(seek.value));
 function focus(v){
  focused=Boolean(v);stage.classList.toggle("ct10-focused",focused);document.body.classList.toggle("ct10-focus-open",focused);
  const b=$("focus-view"),name=focused?"Exit focused view":"Focused view";
  b.setAttribute("aria-pressed",String(focused));b.setAttribute("aria-label",name);b.title=name;b.textContent=focused?"Exit":"⛶";
  if(focused)stage.scrollTop=0;
 }
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
 function renderTry(){
  if(mode!=="try")return;
  screen.draw(state);labelGraph(state);hot.replaceChildren();
  const b=state.state==="lower"||state.state==="upper";lcd.classList.toggle("pick",b);
  $("bound-form").hidden=!b;$("retry-bounds").hidden=state.state!=="result";
  $("bound-label").textContent=state.state==="lower"?"Lower bound x":"Upper bound x";
  $("keypad-hint").textContent=hints[state.state];
  show(state.error||(state.mark?"Zero: ("+M.pretty(state.mark.x)+", 0).":"")|| (unsafe&&!edited?"The linked function was invalid. The original practice problem is shown instead.":""),Boolean(state.error||unsafe&&!edited));
  if(state.state==="menu")jumpMenu(S.PANEL.main,5,()=>press("6"));
  if(state.state==="submenu")jumpMenu(S.PANEL.sub,0,()=>press("1"));
 }
 function select(next,properties={}){
  state={...state,state:next,error:null,...properties};bound.value="";renderTry();
 }
 function plot(raw){
  try{
   const q=M.parse(raw);state={...initial(q.raw),q,state:"plotted"};expr.value=q.raw;renderTry();
  }catch(e){state={...initial(raw),error:e.message};renderTry();}
 }
 function analyze(){
  const {x0,x1}=M.windowFor(state.q);select("lower",{low:null,high:null,cursor:(x0+x1)/2,mark:null});
 }
 function confirm(x){
  if(!state.q||!["lower","upper"].includes(state.state))return;
  edited=true;const {x0,x1}=M.windowFor(state.q);
  if(!Number.isFinite(x)||x<x0||x>x1){show("Enter an x-value in this graph window ("+M.pretty(x0)+" to "+M.pretty(x1)+").",true);return;}
  if(state.state==="lower"){select("upper",{low:x,cursor:x});return;}
  if(x<=state.low){show("The upper bound must be to the right of the lower bound.",true);return;}
  const r=M.zero(state.q,state.low,x);
  select("result",{cursor:x,high:x,mark:r.ok?{x:r.x,y:0}:null,error:r.message||null});
 }
 function press(k){
  if(mode!=="try")return;
  const w=state.state;
  if(k==="esc"){edited=true;state.q?select(w==="submenu"?"menu":"plotted",{low:null,high:null,cursor:null,mark:null}):select("entry");return;}
  if(k==="tab"){edited=true;select("entry",{q:null,raw:expr.value,low:null,high:null,cursor:null,mark:null});return;}
  if(k==="menu"&&state.q){edited=true;select("menu",{low:null,high:null,cursor:null,mark:null});return;}
  if(w==="menu"){if(["6","enter","right","select"].includes(k)){edited=true;select("submenu");}return;}
  if(w==="submenu"){if(["1","enter","right","select"].includes(k)){edited=true;analyze();}return;}
  if(w==="lower"||w==="upper"){
   if(k==="enter"||k==="select"){confirm(state.cursor);return;}
   if(k==="left"||k==="right"){
    edited=true;const {x0,x1}=M.windowFor(state.q),step=(x1-x0)/56;
    state.cursor=M.clamp(state.cursor+(k==="left"?-step:step),x0,x1);
    screen.draw(state);labelGraph(state);
   }
   return;
  }
  if(k==="enter"){edited=true;plot(expr.value);return;}
  if(H.character(k)!==null||k==="del"){
   edited=true;
   const replace=w!=="entry";
   if(H.modify(expr,k,{replace})&&(replace||state.raw!==expr.value)){
    state=initial(expr.value);renderTry();
   }
  }
 }
 $("expression-form").addEventListener("submit",e=>{e.preventDefault();edited=true;plot(expr.value);});
 expr.addEventListener("input",()=>{if(mode!=="try")return;edited=true;state=initial(expr.value);renderTry();});
 $("bound-form").addEventListener("submit",e=>{e.preventDefault();confirm(bound.valueAsNumber);});
 $("retry-bounds").addEventListener("click",()=>{edited=true;analyze();});
 $("reset-keypad").addEventListener("click",()=>{edited=true;state=initial(challenge.raw);expr.value=state.raw;bound.value="";renderTry();stage.focus({preventScroll:true});});
 function pointer(ev){
  const r=canvas.getBoundingClientRect(),xp=(ev.clientX-r.left)*320/r.width,yp=(ev.clientY-r.top)*240/r.height;
  return xp>=S.SCREEN_X.l&&xp<=S.SCREEN_X.r&&yp>=26&&yp<=226?S.pointAt(state.q,xp):null;
 }
 lcd.addEventListener("pointermove",e=>{
  if(mode!=="try"||!lcd.classList.contains("pick")||e.pointerType==="touch")return;
  const x=pointer(e);if(x===null)return;state.cursor=x;screen.draw(state);
 });
 lcd.addEventListener("click",e=>{
  if(mode!=="try"||!lcd.classList.contains("pick"))return;
  const x=pointer(e);if(x!==null)confirm(x);
 });
 function modeTo(next,steal=false){
  if(next==="try"&&mode==="watch"){
   pause();if(focused)focus(false);
   if(steal&&!fixed&&!edited&&!forked){state={...snapshot(t).s};bound.value="";forked=true;}
   expr.value=state.raw;
  }
  mode=next;stage.dataset.mode=mode;cache="";
  const watch=mode==="watch";
  tabs.forEach((b,i)=>{const yes=watch===(i===0);b.tabIndex=yes?0:-1;b.setAttribute("aria-selected",String(yes));});
  for(const n of ["watch","watch-side","watch-player"])$(n).hidden=!watch;
  for(const n of ["try","try-side","try-player"])$(n).hidden=watch;
  shell.setKeys([]);shell.setInteractive(!watch);
  if(watch){hot.replaceChildren();lcd.classList.remove("pick");renderWatch();}
  else renderTry();
 }
 tabs.forEach((b,i)=>{
  b.addEventListener("click",()=>{modeTo(i?"try":"watch");if(i)stage.focus({preventScroll:true});});
  b.addEventListener("keydown",e=>{if(!["ArrowLeft","ArrowRight","Home","End"].includes(e.key))return;e.preventDefault();const next=e.key==="Home"?0:e.key==="End"?1:1-i;modeTo(next?"try":"watch");tabs[next].focus();});
 });
 $("take-over").addEventListener("click",()=>{modeTo("try",true);stage.focus({preventScroll:true});});
 $("return-watch").addEventListener("click",()=>{modeTo("watch");play.focus({preventScroll:true});});
 document.addEventListener("keydown",e=>{
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
 const answer=$("answer"),feedback=$("feedback");
 answer.addEventListener("input",()=>{edited=true;feedback.textContent="";});
 $("answer-form").addEventListener("submit",e=>{
  e.preventDefault();edited=true;const x=answer.valueAsNumber,correct=Number(target.toPrecision(3));
  if(!Number.isFinite(x))return;
  const yes=correct===0?x===0:Math.abs(x-correct)<=1e-10*Math.abs(correct);
  feedback.className="feedback "+(yes?"is-right":"is-wrong");
  feedback.textContent=yes?"Correct. That x-coordinate gives a zero output.":"Not yet. Check that you chose the requested crossing and reported its x-coordinate.";
 });
 const theme=$("theme");try{const v=localStorage.getItem("ti-lab-theme");if(["light","dark"].includes(v))theme.value=v;}catch{}
 const updateTheme=()=>{document.documentElement.dataset.theme=theme.value;};updateTheme();
 theme.addEventListener("change",()=>{updateTheme();try{localStorage.setItem("ti-lab-theme",theme.value==="system"?"auto":theme.value);}catch{}});
 modeTo(params.get("mode")==="try"?"try":"watch");
})();
