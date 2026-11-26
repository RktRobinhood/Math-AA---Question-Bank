"use strict";
(function(){
 function lessonEnd(){return (window.visualViewport?.height||innerHeight)-(document.querySelector("body > .tabbar")?.offsetHeight||0);}
const $=id=>document.getElementById(id);
 const M=window.CT51Math,S=window.CT51Screen,T=window.CT51Tape,H=window.HandheldTransport;
 const stage=$("stage"),play=$("play"),seek=$("seek"),cap=$("caption"),lcd=$("lcd"),canvas=$("drawing");
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
 const initial=raw=>({state:"entry",raw,q:null,w:null,cursor:null,mark:null,error:null});
 let mode="watch",state=initial(exercise.q.raw),fresh=true,edited=false,cache="";
 const shell=HandheldShell.mount({host:$("handheld-host"),screen:lcd,label:"TI-Nspire CX II-T Graphs",interactive:false,onKey:press});
 const hints={entry:"Enter a polynomial in x (up to a cubic), then press Enter to plot.",plotted:"Open the calculator’s Menu.",menu:"Choose 6: Analyze Graph.",submenu:"Choose 5: dy/dx.",point:"Move to one point on the curve and select it. There are no bounds.",result:"The LCD shows the slope. Use the curve’s height separately."};
 const response=[$("answer-m"),$("answer-b")],feedback=$("feedback");
 const challenge="For f(x) = "+M.displayExpr(exercise.q.raw)+", find m and b in the tangent y = mx + b at x = "+M.prettyX(exercise.x)+".";
 $("challenge").textContent=challenge;
 function labelGraph(s){
  stage.dataset.calcState=s.state;
  $("lcd-text").textContent=[s.q?"Graph of "+M.displayExpr(s.q.raw):"Function entry "+M.displayExpr(s.raw),hints[s.state].replace(/[.!?]$/,""),s.state==="point"?"Cursor x "+M.prettyX(s.cursor):"",s.mark?"dy/dx = "+M.pretty(s.mark.slope)+" at x = "+M.prettyX(s.mark.x):""].filter(Boolean).join(". ");
 }
 const symbols={right:"→",power:"^",plus:"+",select:"Click",enter:"Enter",menu:"Menu"};
 const accessible={right:"Right arrow",power:"Exponent",select:"Click the touchpad"};
 const groups=T.titles.map((title,i)=>{
  const id="ct51-step-"+(i+1);
  const actions=T.keys.filter(e=>e.time>=T.starts[i]&&e.time<(T.starts[i+1]??T.duration));
  return {id,title,keys:actions.map(({key},j)=>({id:id+"-"+(j+1),label:symbols[key]||key,ariaLabel:accessible[key]||symbols[key]||key}))};
 });
 const chapterRail=CalculatorWatchChapters.mount(steps,groups,{label:"Labeled groups of key presses",
  onChapter:id=>watch.goBeat(groups.findIndex(group=>group.id===id))
 });
 function snapshot(s){
  let model=initial("");
  for(const e of T.keys){if(s<e.time)break;Object.assign(model,e.delta);}
  if(model.state!=="entry"){model.q=watchModel;model.w=view;}
  if(model.state==="result")model.mark={...watchPoint};
  return model;
 }
 function drawWatch({i,p,clock,led,active,words}){
  if(mode!=="watch")return;
  if(cap.textContent!==words)cap.textContent=words;
  const model=snapshot(clock);
  shell.setKeys(led?[led]:[]);
  const phase=p.speaking?0:p.fraction<.12?0:p.fraction<.56?1:2;
  const token=[i,model.state,model.raw,model.cursor,active,phase].join("|");
  if(token===cache)return;cache=token;
  screen.draw(model);labelGraph(model);
  const readout=$("readout");
  let text=i===2?"Choose one point, not a pair of bounds.":"";
  if(i===3)text=phase===0?"The graph gives the slope. Evaluate the height separately.":phase===1?"f(2) = 2³ + 2 = 10.":"Point (2, 10). Exact slope: f′(2) = 3(2)² + 1 = 13.";
  if(i===4)text=phase===0?"Use the point and the slope to write the tangent.":phase===1?"y − 10 = 13(x − 2)":"y − 10 = 13(x − 2), so y = 13x − 16.";
  readout.hidden=!text;
  if(i===4&&phase>=1){
   readout.replaceChildren();
   for(const line of (phase===2?["y − 10 = 13(x − 2)","y = 13x − 16."]:["y − 10 = 13(x − 2)"])){
    const row=document.createElement("span");row.className="ct51-equation";row.textContent=line;readout.append(row);
   }
  }else readout.textContent=text;
  chapterRail.setState({chapterId:groups[i].id,keyId:groups[i].keys[active]?.id||null});
 }
 const watch=CT51Watch.mount({tape:T,stage,render:drawWatch,inWatch:()=>mode==="watch"});
 function isExercise(){
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
  $("exercise-active").hidden=!inExercise;$("exercise-inactive").hidden=inExercise;
  $("jump-answer").hidden=!inExercise;$("expression-form").hidden=state.state!=="entry";
  $("keypad-problem").textContent=inExercise?"Practice point: x = "+M.prettyX(exercise.x)+".":"Choose a point on your own function.";
  $("keypad-hint").textContent=hints[state.state];
  $("point-form").hidden=state.state!=="point";$("another-point").hidden=state.state!=="result";
  lcd.classList.toggle("pick",state.state==="point");
  const mark=state.mark;
  message(state.error||(mark?"Graph slope readout at x = "+M.prettyX(mark.x)+": "+M.pretty(mark.slope)+". Find the height by evaluating f(x) separately.":invalid&&!edited?"Invalid linked function or x-value. Showing the original practice exercise.":""),Boolean(state.error||invalid&&!edited));
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
   state={...initial(q.raw),q,w:M.windowFor(q,aim),state:"plotted"};
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
  if(k==="tab"){edited=true;fresh=true;shift("entry",{mark:null});expression.focus({preventScroll:true});return;}
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
   if(w!=="entry")shift("entry",{mark:null});
   H.modify(expression,k,{replace});
  }
 }
 $("expression-form").addEventListener("submit",e=>{e.preventDefault();plot();});
 expression.addEventListener("input",()=>{edited=true;fresh=false;state=initial(expression.value);freshTry();});
 $("point-form").addEventListener("submit",e=>{e.preventDefault();choose(M.readX(exact.value));});
 $("another-point").addEventListener("click",point);
 $("reset-keypad").addEventListener("click",()=>{
  edited=true;fresh=true;state=initial(exercise.q.raw);
  $("answer-form").reset();feedback.textContent="";
  expression.value=state.raw;exact.value="";freshTry();stage.focus({preventScroll:true});
 });
 $("jump-input").addEventListener("click",()=>{shift("entry",{mark:null});expression.focus();});
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
 function change(next){
  if(next==="try")watch.leave();
  mode=next;stage.dataset.mode=mode;cache="";
  const watching=next==="watch";
  tabs.forEach((b,i)=>{const active=watching===(i===0);b.setAttribute("aria-selected",String(active));b.tabIndex=active?0:-1;});
  for(const id of ["watch-player","watch-message","watch-side","watch"])$(id).hidden=!watching;
  for(const id of ["try-player","try-side","try"])$(id).hidden=watching;
  shell.setKeys([]);shell.setInteractive(!watching);
  if(watching){
   $("expression-form").hidden=true;hot.replaceChildren();lcd.classList.remove("pick");watch.draw();
  }else{$("start-overlay").hidden=true;expression.value=state.raw;freshTry();fitTry();}
 }
 tabs.forEach((b,i)=>{
  b.addEventListener("click",()=>{change(i?"try":"watch");if(i)stage.focus({preventScroll:true});});
  b.addEventListener("keydown",e=>{
   if(!["ArrowLeft","ArrowRight","Home","End"].includes(e.key))return;
   e.preventDefault();const j=e.key==="Home"?0:e.key==="End"?1:1-i;change(j?"try":"watch");tabs[j].focus();
  });
 });
 $("return-watch").addEventListener("click",()=>{change("watch");play.focus({preventScroll:true});});
 document.addEventListener("keydown",e=>{if(e.target!==document.body&&!e.target.closest?.(".qb-calculator-lesson"))return;
  if(e.metaKey||e.ctrlKey||e.altKey||e.target.closest("input,textarea,select,a,summary,[contenteditable]"))return;
  const tag=e.target.closest("button");
  if(mode==="watch")return;
  if(!stage.contains(e.target)&&e.target!==document.body||tag&&(e.key==="Enter"||e.key===" "))return;
  const map={Escape:"esc",Enter:"enter",Backspace:"del",Delete:"del",ArrowLeft:"left",ArrowRight:"right",m:"menu",M:"menu",".":"dot","^":"power","+":"plus","-":"minus","*":"mul","/":"div","(":"lparen",")":"rparen","²":"square"};
  const k=map[e.key]||(/^[0-9xX]$/.test(e.key)?e.key.toLowerCase():"");
  if(k){e.preventDefault();if(e.target===document.body)stage.focus({preventScroll:true});press(k);}
 });
 const near=(v,n)=>n===0?v===0:Math.abs(v-n)<=Math.abs(n)*2e-12;
 response.forEach(e=>e.addEventListener("input",()=>{edited=true;feedback.textContent="";}));
 $("answer-form").addEventListener("submit",e=>{
  e.preventDefault();if(mode!=="try"||!isExercise())return;edited=true;
  const vals=response.map(v=>M.exactInput(v.value)),goals=[target.slope,target.intercept];
  if(!vals.every(Number.isFinite)){feedback.className="feedback is-wrong";feedback.textContent="Enter an exact number or fraction for each value.";return;}
  const ok=vals.map((v,i)=>near(v,goals[i]));
  feedback.className="feedback"+(ok.every(Boolean)?"is-right":"is-wrong");
  feedback.textContent=ok.every(Boolean)?"Correct. The line has the slope and passes through the chosen point.":ok[0]?"The slope is right. Check b using the curve’s y-coordinate.":"Check the slope at the specified x.";
 });
 change(params.get("mode")==="try"||linked&&params.get("mode")!=="watch"?"try":"watch");
function fitWatch(){
 if(mode!=="watch")return;
 const full=document.fullscreenElement===stage||stage.classList.contains("watch-fullscreen-fallback");
 const rect=stage.getBoundingClientRect(),vh=window.visualViewport?.height||innerHeight;
 const dock=full?0:document.querySelector("body > .tabbar")?.offsetHeight||0;
 const y=full?0:Math.max(0,rect.top+window.scrollY);
 const side=innerWidth<=720&&!(innerWidth<=420&&innerHeight<=660)?$("watch-side").offsetHeight+15:0;
 const room=vh-dock-y-$("watch-message").offsetHeight-$("watch-player").offsetHeight-side-35;
 const screenFit=Math.floor(Math.max(165,Math.min(full?1030:520,(room-9)*4/3)));
 const fullFit=Math.floor(Math.max(innerHeight<=600&&innerWidth<=720?83:107,Math.min(full?490:291,(room-7)*558/1168)));
 if(stage.style.getPropertyValue("--ct51-screen-fit")!==screenFit+"px")stage.style.setProperty("--ct51-screen-fit",screenFit+"px");
 if(stage.style.getPropertyValue("--ct51-full-fit")!==fullFit+"px")stage.style.setProperty("--ct51-full-fit",fullFit+"px");
}
const watchSize=new ResizeObserver(fitWatch);
for(const el of [$("watch-side"),$("watch-message"),$("watch-player"),document.querySelector("main>.header")])watchSize.observe(el);
window.addEventListener("resize",fitWatch);window.visualViewport?.addEventListener("resize",fitWatch);
document.addEventListener("fullscreenchange",fitWatch);
new MutationObserver(fitWatch).observe(stage,{attributes:true,attributeFilter:["class","data-mode","data-framing"]});
fitWatch();
window.QBRecordedWatch?.bind(watch.pause,null,watch.attach);
})();
