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
 const fixed=Boolean(linked)||params.get("case")==="intersection-demo"||params.get("example")==="demo";
 const challenge=linked||defaultTry,points=M.crossings(challenge).points;
 const right=Boolean(linked)&&params.get("target")==="right",target=right?points.at(-1):points[0];
 const where=points.length>1?(right?"larger":"smaller")+" x-coordinate":"unique crossing";
 const title=points.length>1?(right?"Find the right crossing":"Find the left crossing"):"Find the crossing";
 const pairText="f₁(x) = "+M.displayExpr(challenge[0].raw)+"; f₂(x) = "+M.displayExpr(challenge[1].raw)+".";
 const prompt=points.length>1?"Find both coordinates of the intersection with the "+where+".":"Find both coordinates of the intersection.";
 const sameCurve=(a,b)=>["a","b","c"].every(k=>a[k]===b[k]);
 let mode="watch",state=initial(challenge.map(q=>q.raw)),edited=false,forked=false,focused=false,focusConsidered=false,started=false,fresh=true;
 let t=0,duration=T.duration,playing=false,pending=false,raf=0,origin=0,useAudio=audio.hasAttribute("src"),playEpoch=0,cache="";
 const shell=HandheldShell.mount({host:$("handheld-host"),screen:lcd,label:"TI-Nspire CX II-T Graphs",interactive:false,onKey:key=>press(key)});
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
  const v={state:"entry",active:0,first:"",second:"",firstPlot:false,secondPlot:false}, key="";
  let lit=key;
  for(const e of T.keys){
   if(time<e.time)break;
   Object.assign(v,e.delta);lit=time<e.time+.185?e.key:"";
  }
  const s={...initial([v.first,v.second]),...v,q:[v.firstPlot?watchPair[0]:null,v.secondPlot?watchPair[1]:null],windows:knownWindow};
  return{s,key:lit};
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
  const keyStamp=[s.state,...s.raw,s.cursor,chapter,phrase].join("|");
  seek.value=t;seek.setAttribute("aria-valuetext",clock(t)+" of "+clock(duration));$("clock").textContent=clock(t)+" / "+clock(duration);
  shell.setKeys(key?[key]:[]);
  $("stage-play").hidden=started||t>0;
  if(cache===keyStamp)return;cache=keyStamp;
  screen.draw(s);labelGraph(s);
  cap.textContent=T.captions[phrase];
  const captionsGuide=phrase===3?"Two curves: the lower-bound prompt opens directly.":phrase===5?"Intersection: (3, 9).":phrase===6?"Same output: 3² = 2(3) + 3 = 9.":"";
  $("readout").hidden=!captionsGuide;$("readout").textContent=captionsGuide;
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
   const low=Math.max($("watch-player").getBoundingClientRect().bottom,...["enter","4","x","tab"].map(k=>shell.getKey(k).getBoundingClientRect().bottom));
   if(!focused&&low>h+9)focus(true);
  }
  started=true;
  if(!$("stage-play").hidden){if(document.activeElement===$("stage-play"))play.focus({preventScroll:true});$("stage-play").hidden=true;}
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
 play.addEventListener("click",toggle);$("stage-play").addEventListener("click",toggle);$("back").addEventListener("click",()=>go(t-10));$("next").addEventListener("click",()=>go(t+10));
 $("replay").addEventListener("click",()=>{pause();go(0);void start();});seek.addEventListener("input",()=>go(seek.value));
 function focus(v){
  focused=Boolean(v);stage.classList.toggle("ct11-focused",focused);document.body.classList.toggle("ct11-focus-open",focused);
  const b=$("focus-view"),name=focused?"Exit focused view":"Focused view";
  b.setAttribute("aria-pressed",String(focused));b.setAttribute("aria-label",name);b.title=name;b.textContent=focused?"Exit":"Focus";
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
  $("keypad-problem").textContent=inExercise?prompt:state.fromWatch?"You took over the Watch example.":"Explore intersections for your own functions.";
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
 function modeTo(next,steal=false){
  if(next==="try"&&mode==="watch"){
   pause();if(focused)focus(false);
   if(steal&&!fixed&&!edited&&!forked){state={...snapshot(t).s,fromWatch:true};bound.value="";fresh=false;forked=true;}
   syncFields();
  }
  mode=next;stage.dataset.mode=mode;cache="";
  const watch=mode==="watch";
  tabs.forEach((b,i)=>{const yes=watch===(i===0);b.tabIndex=yes?0:-1;b.setAttribute("aria-selected",String(yes));});
  for(const n of ["watch","watch-side","watch-player","watch-message"])$(n).hidden=!watch;
  for(const n of ["try","try-side","try-player"])$(n).hidden=watch;
  shell.setKeys([]);shell.setInteractive(!watch);
  if(watch){hot.replaceChildren();lcd.classList.remove("pick");renderWatch();}
  else{$("stage-play").hidden=true;renderTry();}
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

// Reserve the bank's fixed bottom tabs in in-page Watch. The existing Focus view owns the viewport.
function fitBankWatch(){
 if(!matchMedia("(max-width:700px)").matches||stage.dataset.mode!=="watch"||focused)return;
 const nav=document.querySelector(".tabbar").getBoundingClientRect().height;
 const box=stage.getBoundingClientRect(),shellHeight=shell.body.getBoundingClientRect().height;
 const room=innerHeight-nav-box.top-window.scrollY-(box.height-shellHeight)-8;
 stage.style.setProperty("--bank-watch-fit",Math.floor(Math.max(145,Math.min(275,room*558/1168)))+"px");
}
const bankWatchSizing=new ResizeObserver(fitBankWatch);
bankWatchSizing.observe(stage);
window.addEventListener("resize",fitBankWatch);
fitBankWatch();
})();
