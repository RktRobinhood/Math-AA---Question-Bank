"use strict";
(function(){
 function lessonEnd(){return (window.visualViewport?.height||innerHeight)-(document.querySelector("body > .tabbar")?.offsetHeight||0);}
const $=id=>document.getElementById(id);
 const M=window.CT51Math,S=window.CT51Screen,T=window.CT51Tape,H=window.HandheldTransport;
 const stage=$("stage"),play=$("play"),seek=$("seek"),cap=$("caption"),overlay=$("stage-play"),lcd=$("lcd"),canvas=$("drawing");
 const screen=S.screen(canvas),expression=$("expression"),exact=$("point-input"),hot=$("hotspots"),steps=$("steps");
 const view={x0:-3,x1:3,y0:-9,y1:16},watchModel=M.parse("x^3+x"),defaultModel=M.parse("2x^2-3x+1"),watchPoint=M.derivative(watchModel,2);

 function fitTry(){
  if(mode!=="try")return;
  const h=lessonEnd(),w=innerWidth,phone=w<=710,host=$("handheld-host");
  if(h>960){stage.style.removeProperty("--retro-try-width");return;}
  const top=Math.max(0,host.getBoundingClientRect().top+window.scrollY);
  const visibleFraction=phone&&h<650?.804:1;
  const width=Math.min(phone?270:305,Math.max(phone?158:126,Math.floor((h-top-10)*558/1168/visibleFraction)));
  stage.style.setProperty("--retro-try-width",width+"px");
 }
 const tryLayout=new ResizeObserver(fitTry);
 for(const el of [document.querySelector("header"),$("try-player")])tryLayout.observe(el);
 window.addEventListener("resize",fitTry);
 const params=new URLSearchParams(location.search),same=name=>params.getAll(name).length===1;
 let linked=null,invalid=false;
 if(params.has("expr")||params.has("x")){
  try{
   if(!same("expr")||!same("x"))throw Error("Incomplete link");
   const q=M.parse(params.get("expr")),x=M.readX(params.get("x"));
   if(x===null)throw Error("Out-of-range point");
   linked={q,x};
  }catch{invalid=true;}
 }
 const exercise=linked||{q:defaultModel,x:-1},target=M.derivative(exercise.q,exercise.x);
 const fixed=Boolean(linked)||params.get("case")==="derivative-demo"||params.get("example")==="demo";
 const initial=raw=>({state:"entry",raw,q:null,w:null,cursor:null,mark:null,error:null});
 let mode="watch",state=initial(exercise.q.raw),fresh=true,edited=false,lane="practice",focused=false,hasStarted=false,focusChecked=false;
 let practice={state,fresh,edited,exact:""},fork=null,forkAt=null,lastWatchFocus=false,focusChoice=null;
 let time=0,origin=0,frame=0,playing=false,cache="";
 const shell=HandheldShell.mount({host:$("handheld-host"),screen:lcd,label:"TI-Nspire CX II-T Graphs",interactive:false,onKey:press});
 const hints={entry:"Enter a polynomial in x (up to a cubic), then press Enter to plot.",plotted:"Open the calculator’s Menu.",menu:"Choose 6: Analyze Graph.",submenu:"Choose 5: dy/dx.",point:"Move to one point on the curve and select it. There are no bounds.",result:"The LCD shows the slope. Use the curve’s height separately."};
 const response=[$("answer-m"),$("answer-b")],feedback=$("feedback");
 const challenge="For f(x) = "+M.displayExpr(exercise.q.raw)+", find m and b in the tangent y = mx + b at x = "+M.prettyX(exercise.x)+".";
 $("challenge").textContent=challenge;
 const clock=x=>Math.floor(x/60)+":"+String(Math.floor(x)%60).padStart(2,"0");
 function labelGraph(s){
  $("lcd-text").textContent=[s.q?"Graph of "+M.displayExpr(s.q.raw):"Function entry "+M.displayExpr(s.raw),hints[s.state].replace(/[.!?]$/,""),s.state==="point"?"Cursor x "+M.prettyX(s.cursor):"",s.mark?"dy/dx = "+M.pretty(s.mark.slope)+" at x = "+M.prettyX(s.mark.x):""].filter(Boolean).join(". ");
 }
 T.titles.forEach((name,i)=>{
  const row=document.createElement("li"),button=document.createElement("button"),n=document.createElement("span");
  button.type="button";n.textContent="0"+(i+1);button.append(n,document.createTextNode(name));
  button.addEventListener("click",()=>go(T.starts[i]));row.append(button);steps.append(row);
 });
 function snapshot(s){
  let model=initial(""),key="";
  for(const e of T.keys){
   if(s<e.time)break;
   Object.assign(model,e.delta);key=s<e.time+.25?e.key:"";
  }
  if(model.state!=="entry"){model.q=watchModel;model.w=view;}
  if(model.state==="result")model.mark={...watchPoint};
  return {model,key};
 }
 function drawWatch(){
  if(mode!=="watch")return;
  const chapter=T.starts.findLastIndex(s=>time>=s),{model,key}=snapshot(time);
  seek.value=time;seek.setAttribute("aria-valuetext",clock(time)+" of "+clock(T.duration));$("clock").textContent=clock(time)+" / "+clock(T.duration);
  overlay.hidden=hasStarted||time>0;shell.setKeys(key?[key]:[]);
  const token=[chapter,model.state,model.raw,model.cursor].join("|");
  if(token===cache)return;cache=token;
  screen.draw(model);labelGraph(model);cap.textContent=T.captions[chapter];
  const text=chapter===3?"Slope 13. Separately: f(2) = 2³ + 2 = 10.":chapter===4?"y − 10 = 13(x − 2), so y = 13x − 16.":"";
  $("readout").hidden=!text;$("readout").textContent=text;
  [...steps.children].forEach((li,i)=>li.firstElementChild.setAttribute("aria-current",String(i===chapter)));
 }
 function updatePlay(){
  const label=playing?"Pause":time>=T.duration-.012?"Replay":"Play";
  play.textContent=label;play.setAttribute("aria-label",label);play.dataset.playing=String(playing);
  $("take-over").textContent=label==="Replay"?"Open Try":"Take over";
 }
 function go(n){
  time=M.clamp(Number(n)||0,0,T.duration);origin=performance.now()-time*1000;
  drawWatch();if(!playing)updatePlay();
 }
 function pause(){
  if(playing)time=M.clamp((performance.now()-origin)/1000,0,T.duration);
  playing=false;cancelAnimationFrame(frame);updatePlay();drawWatch();
 }
 function tick(now){
  if(!playing||mode!=="watch")return;
  time=M.clamp((now-origin)/1000,0,T.duration);
  if(time>=T.duration){pause();return;}
  drawWatch();frame=requestAnimationFrame(tick);
 }
 function focus(v){
  focused=Boolean(v);stage.classList.toggle("ct51-focused",focused);document.body.classList.toggle("ct51-focus-open",focused);
  const b=$("focus-view"),name=focused?"Exit focused view":"Focused view";
  b.setAttribute("aria-pressed",String(focused));b.setAttribute("aria-label",name);b.textContent=focused?"Exit":"Focus";
  if(focused)stage.scrollTop=0;
 }
 function toggle(){
  if(mode!=="watch")return;
  if(playing){pause();return;}
  if(!focusChecked){
   focusChecked=true;const visible=lessonEnd();
   if(!focused&&$("watch-player").getBoundingClientRect().bottom>visible+5)focus(true);
  }
  hasStarted=true;if(document.activeElement===overlay)play.focus({preventScroll:true});
  if(time>=T.duration-.012)go(0);
  origin=performance.now()-time*1000;playing=true;drawWatch();updatePlay();frame=requestAnimationFrame(tick);
 }
 overlay.addEventListener("click",toggle);play.addEventListener("click",toggle);
 $("back").addEventListener("click",()=>go(time-10));$("next").addEventListener("click",()=>go(time+10));
 $("focus-view").addEventListener("click",()=>{focusChoice=!focused;focus(!focused);});$("replay").addEventListener("click",()=>{pause();go(0);toggle();});
 seek.addEventListener("input",()=>go(seek.value));
 function isExercise(){
  if(lane!=='practice')return false;
  try{return M.equivalent(M.parse(state.raw),exercise.q);}catch{return false;}
 }
 function menuClick(panel,index,action){
  const b=document.createElement("button");b.type="button";b.setAttribute("aria-label",panel.rows[index]);
  b.style.left=panel.x/3.2+"%";b.style.top=(panel.y+2+index*panel.h)/2.4+"%";
  b.style.width=panel.w/3.2+"%";b.style.height=panel.h/2.4+"%";
  b.addEventListener("click",e=>{e.stopPropagation();action();});hot.append(b);
 }
 function message(s="",error=false){
  const el=$("keypad-result");el.hidden=!s;el.className="feedback"+(error?"is-wrong":"is-right");el.textContent=s;
 }
 function freshTry(){
  if(mode!=="try")return;
  screen.draw(state);labelGraph(state);hot.replaceChildren();
  const inExercise=isExercise();
  $("exercise-active").hidden=!inExercise;$("exercise-inactive").hidden=inExercise||lane==="fork";
  $("try").hidden=lane==="fork";$("open-independent").hidden=lane!=="fork";$("jump-answer").hidden=!inExercise;
  $("keypad-problem").textContent=inExercise?"Practice point: x = "+M.prettyX(exercise.x)+".":lane==="fork"?"You took over the Watch example.":"Choose a point on your own function.";
  $("keypad-hint").textContent=hints[state.state];
  $("point-form").hidden=state.state!=="point";$("another-point").hidden=state.state!=="result";
  lcd.classList.toggle("pick",state.state==="point");
  const mark=state.mark;
  message(state.error||(mark?"Slope "+M.pretty(mark.slope)+" at x = "+M.prettyX(mark.x)+". Separately, f("+M.prettyX(mark.x)+") = "+M.pretty(mark.y)+".":lane==="practice"&&invalid&&!edited?"Invalid linked function or x-value. Showing the original practice exercise.":""),Boolean(state.error||lane==="practice"&&invalid&&!edited));
  if(state.state==="menu")menuClick(S.PANEL.main,5,()=>press("6"));
  if(state.state==="submenu")menuClick(S.PANEL.sub,4,()=>press("5"));
 }
 function shift(next,props={}){
  state={...state,state:next,error:null,...props};freshTry();
 }
 function plot(){
  edited=true;
  try{
   const q=M.parse(expression.value),aim=M.equivalent(q,exercise.q)?exercise.x:0;
   state={...initial(q.raw),q,w:M.windowFor(q,aim),state:"plotted",fromWatch:state.fromWatch&&M.equivalent(q,watchModel)};
   expression.value=q.raw;freshTry();
  }catch(e){state={...initial(expression.value),error:e.message};freshTry();}
 }
 function point(){
  const w=state.w,center=(w.x0+w.x1)/2;
  exact.value="";shift("point",{cursor:center,mark:null});
 }
 function choose(x){
  if(state.state!=="point")return;edited=true;
  const w=state.w,z=x===null?null:M.derivative(state.q,x);
  if(!z||x<w.x0||x>w.x1){message("Choose an x-value inside the visible window ("+M.pretty(w.x0)+" to "+M.pretty(w.x1)+").",true);return;}
  shift("result",{cursor:x,mark:z});
 }
 function press(k){
  if(mode!=="try")return;
  const w=state.state;
  if(k==="esc"){edited=true;shift(w==="submenu"?"menu":state.q?"plotted":"entry",{mark:null});return;}
  if(k==="tab"){edited=true;fresh=true;shift("entry",{mark:null});return;}
  if(k==="menu"){
   if(!state.q){message("Plot a function first.",true);return;}
   edited=true;shift("menu",{mark:null});return;
  }
  if(w==="menu"){if(["6","enter","right","select"].includes(k)){edited=true;shift("submenu");}return;}
  if(w==="submenu"){if(["5","enter","right","select"].includes(k)){edited=true;point();}return;}
  if(w==="point"){
   if(["enter","select"].includes(k)){choose(state.cursor);return;}
   if(k==="left"||k==="right"){
    edited=true;const a=state.w,b=(a.x1-a.x0)/32*(k==="left"?-1:1);
    state.cursor=M.clamp(Number((state.cursor+b).toFixed(9)),a.x0,a.x1);
    screen.draw(state);labelGraph(state);message();
   }
   return;
  }
  if(k==="enter"){plot();return;}
  const value=H.character(k);
  if(value!==null&&/^[0-9x().+*\/^-]+$/.test(value)||k==="del"){
   edited=true;const replace=w!=="entry"||fresh;fresh=false;
   H.modify(expression,k,{replace});
  }
 }
 $("expression-form").addEventListener("submit",e=>{e.preventDefault();plot();});
 expression.addEventListener("input",()=>{edited=true;fresh=false;state=initial(expression.value);freshTry();});
 $("point-form").addEventListener("submit",e=>{e.preventDefault();choose(M.readX(exact.value));});
 $("another-point").addEventListener("click",point);
 $("reset-keypad").addEventListener("click",()=>{
  edited=true;fresh=lane==="practice";state=lane==="fork"?{...snapshot(time).model,fromWatch:true}:initial(exercise.q.raw);
  if(lane==="practice"){$("answer-form").reset();feedback.textContent="";}
  expression.value=state.raw;exact.value="";freshTry();stage.focus({preventScroll:true});
 });
 $("open-independent").addEventListener("click",()=>{change("try");stage.focus({preventScroll:true});});
 $("jump-input").addEventListener("click",()=>expression.focus());
 $("jump-answer").addEventListener("click",()=>response[0].focus());
 function position(e){
  const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*320/r.width,y=(e.clientY-r.top)*240/r.height;
  if(x<S.SCREEN_X.l||x>S.SCREEN_X.r||y<25||y>228)return null;
  return {x:S.pointAt(state.w,x),y,tol:12*240/r.height};
 }
 lcd.addEventListener("pointermove",e=>{
  if(mode!=="try"||state.state!=="point"||e.pointerType==="touch")return;
  const o=position(e);if(!o)return;
  state.cursor=Number(o.x.toFixed(4));screen.draw(state);labelGraph(state);
 });
 lcd.addEventListener("click",e=>{
  if(mode!=="try"||state.state!=="point")return;
  const o=position(e);if(!o)return;
  if(Math.abs(o.y-S.screenY(state.w,state.q.f(o.x)))>o.tol){message("Tap the curve itself, or use the arrows and click.",true);return;}
  choose(Number(o.x.toFixed(4)));
 });
 const tabs=[$("watch-tab"),$("try-tab")];
 function change(next,takeover=false){
  const targetLane=takeover?"fork":"practice";
  if(mode===next&&next==="try"&&targetLane===lane)return;
  if(mode==="try")Object.assign(lane==="fork"?fork:practice,{state,fresh,edited,exact:exact.value});
  else {pause();lastWatchFocus=focused;if(focused)focus(false);}
  if(next==="try"){
   lane=targetLane;
   if(lane==="fork"&&forkAt!==time){forkAt=time;fork={state:{...snapshot(time).model,fromWatch:true},exact:"",fresh:false,edited:false};}
   const targetLaneData=lane==="fork"?fork:practice;
   ({state,fresh,edited}=targetLaneData);exact.value=targetLaneData.exact;expression.value=state.raw;
  }
  mode=next;stage.dataset.mode=mode;stage.dataset.tryLane=next==="try"?lane:"";cache="";
  const watching=next==="watch";
  tabs.forEach((b,i)=>{const active=watching===(i===0);b.setAttribute("aria-selected",String(active));b.tabIndex=active?0:-1;});
  for(const id of ["watch-player","watch-message","watch-side","watch"])$(id).hidden=!watching;
  for(const id of ["try-player","try-side","try"])$(id).hidden=watching;
  shell.setKeys([]);shell.setInteractive(!watching);
  if(watching){
   hot.replaceChildren();lcd.classList.remove("pick");drawWatch();updatePlay();
   const h=lessonEnd();
   if(lastWatchFocus||focusChoice!==false&&$("watch-player").getBoundingClientRect().bottom>h+5)focus(true);
  }else{overlay.hidden=true;freshTry();fitTry();}
 }
 tabs.forEach((b,i)=>{
  b.addEventListener("click",()=>{change(i?"try":"watch");if(i)stage.focus({preventScroll:true});});
  b.addEventListener("keydown",e=>{
   if(!["ArrowLeft","ArrowRight","Home","End"].includes(e.key))return;
   e.preventDefault();const j=e.key==="Home"?0:e.key==="End"?1:1-i;change(j?"try":"watch");tabs[j].focus();
  });
 });
 $("take-over").addEventListener("click",()=>{change("try",time<T.duration-.012);stage.focus({preventScroll:true});});
 $("return-watch").addEventListener("click",()=>{change("watch");play.focus({preventScroll:true});});
 document.addEventListener("keydown",e=>{if(e.target!==document.body&&!e.target.closest?.(".qb-calculator-lesson"))return;
  if(e.key==="Escape"&&focused){e.preventDefault();focusChoice=false;focus(false);$("focus-view").focus();return;}
  if(e.metaKey||e.ctrlKey||e.altKey||e.target.closest("input,textarea,select,a,summary,[contenteditable]"))return;
  const tag=e.target.closest("button");
  if(mode==="watch"){
   if(tag||e.repeat)return;
   const k=e.key.toLowerCase();
   if(k==="k"||k===" "){e.preventDefault();toggle();}else if(k==="j"||k==="l"){e.preventDefault();go(time+(k==="j"?-10:10));}
   return;
  }
  if(!stage.contains(e.target)&&e.target!==document.body||tag&&(e.key==="Enter"||e.key===" "))return;
  const map={Escape:"esc",Enter:"enter",Backspace:"del",Delete:"del",ArrowLeft:"left",ArrowRight:"right",m:"menu",M:"menu",".":"dot","^":"power","+":"plus","-":"minus","*":"mul","/":"div","(":"lparen",")":"rparen","²":"square"};
  const k=map[e.key]||(/^[0-9xX]$/.test(e.key)?e.key.toLowerCase():"");
  if(k){e.preventDefault();press(k);}
 });
 const sig=[3,4,5,6,7,8,9,10,11,12,13,14,15,16,17];
 const near=(v,n)=>n===0?v===0:Math.abs(v-n)<=Math.abs(n)*1e-10;
 response.forEach(e=>e.addEventListener("input",()=>{edited=true;feedback.textContent="";}));
 $("answer-form").addEventListener("submit",e=>{
  e.preventDefault();if(mode!=="try"||!isExercise())return;edited=true;
  const vals=response.map(v=>v.valueAsNumber),goals=[target.slope,target.intercept];
  if(!vals.every(Number.isFinite))return;
  const ok=vals.map((v,i)=>sig.some(p=>near(v,Number(goals[i].toPrecision(p)))));
  feedback.className="feedback"+(ok.every(Boolean)?"is-right":"is-wrong");
  feedback.textContent=ok.every(Boolean)?"Correct. The line has the slope and passes through the chosen point.":ok[0]?"The slope is right. Check b using the curve’s y-coordinate.":"Check the slope at the specified x.";
 });
 change(params.get("mode")==="try"||linked&&params.get("mode")!=="watch"?"try":"watch");
 // Preserve first-paint access on short mobile viewports. The visible Exit button restores the page.
 if(mode==="watch"){
  const height=lessonEnd();
  if($("watch-player").getBoundingClientRect().bottom>height+5){
   focusChecked=true;focus(true);
  }
 }
})();
