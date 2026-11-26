"use strict";
(function(){
 const $=id=>document.getElementById(id);
 const M=window.CT10Math,S=window.CT10Screen,T=window.CT10Tape,H=window.HandheldTransport;
 const stage=$("stage"),handheld=$("handheld-host"),hot=$("hotspots");
 const lcd=$("lcd"),canvas=$("drawing"),screen=S.screen(canvas),expr=$("expression"),bound=$("bound");
 const watchQ=M.parse("x^2-5x+6"),watchView={...M.windowFor(watchQ),y1:7.2},defaultTry="x^2-7x+10",params=new URLSearchParams(location.search);
 const initial=raw=>({state:"entry",raw,q:null,low:null,high:null,cursor:null,mark:null,error:null,menuPick:5,traceEntry:null,traceResult:false,view:null});
 let linked=null,unsafe=false;
 if(params.has("expr")){
  try{
   if(params.getAll("expr").length!==1)throw Error("Invalid link");
   const q=M.parse(params.get("expr"));
   if(!M.roots(q).some(r=>!r.touch))throw Error("Needs one crossing");
   linked=q;
  }catch{unsafe=true;}
 }
 const challenge=linked||M.parse(defaultTry),target=M.roots(challenge).at(-1).x;
 const prompt="Find the "+(M.roots(challenge).length===2?"larger ":"")+"zero of f(x) = "+M.displayExpr(challenge.raw)+".";
 let mode="watch",state=initial(challenge.raw),edited=false;
 let frameStamp=-1,returnToWatch=null;
 $("transcript").textContent=T.captions.join(" ");
 function physical(k){
  if(mode!=="try")return;
  if(!document.activeElement?.matches("input,textarea,select"))stage.focus({preventScroll:true});
  press(k);
 }
 const shell=CalculatorLessonHandset.mount(handheld,{screen:lcd,label:"TI-Nspire CX II-T Graphs",onKey:physical});
 const hints={"trace-menu":"Choose 1: Graph Trace.",trace:"Type an x-coordinate, then press Enter to jump to it.",entry:"Enter a line or quadratic, then press Enter to plot.",plotted:"Press Menu on the handheld.",menu:"Choose 6: Analyze Graph.",submenu:"Choose 1: Zero.",lower:"Put the lower bound to the left of the crossing. Move with the arrows, tap the graph, or enter x below.",upper:"Put the upper bound to the right of the same crossing, then confirm.",result:"Read the x-coordinate. To find another zero, choose new bounds."};
 $("challenge-title").textContent=M.roots(challenge).length===2?"Find the larger zero":"Find the zero";
 $("keypad-problem").textContent=prompt;$("challenge").textContent=prompt;
 function stepHint(s){return s.state==="menu"&&s.menuPick===4?"Choose 5: Trace.":hints[s.state];}
 function labelGraph(s){$("lcd-text").textContent=[s.q?"Graph of "+M.displayExpr(s.q.raw):"Function entry "+M.displayExpr(s.raw),stepHint(s),s.low!=null?"Lower: "+M.pretty(s.low):"",s.state==="trace"&&s.traceEntry!==null?"x = "+s.traceEntry:s.state==="trace"&&s.q&&s.cursor!=null?"f₁: ("+M.pretty(s.cursor)+", "+M.pretty(s.cursor===0?s.q.c:s.q.f(s.cursor))+")":s.cursor!=null?"Cursor: "+M.pretty(s.cursor):"",s.mark?"Zero at x = "+M.pretty(s.mark.x):"",s.error||""].filter(Boolean).join(". ");}
 const frames=[initial("")];
 for(const e of T.keys){
  const frame={...frames.at(-1),...e.delta};
  if(frame.state!=="entry"){frame.q=watchQ;frame.view=watchView;}
  frames.push(frame);
 }
 function renderWatch(device,{beat,point,crossed,key}){
  if(handheld.parentElement!==device)device.append(handheld);
  const count=crossed.length;
  const hold=point.span.end-point.span.voiceEnd;
  const lit=key?.beat===beat&&!point.speaking&&(point.fraction-key.at)*hold<.68;
  shell.setKeys(lit?[T.keys[count-1].key]:[]);
  if(frameStamp!==count){frameStamp=count;screen.draw(frames[count]);labelGraph(frames[count]);}
 }
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
  $("keypad-hint").textContent=stepHint(state);
  show(state.error||(state.mark?"Zero: ("+M.pretty(state.mark.x)+", 0).":"")|| (unsafe&&!edited?"The linked function was invalid. The original practice problem is shown instead.":""),Boolean(state.error||unsafe&&!edited));
  if(state.state==="menu"){jumpMenu(S.PANEL.main,4,()=>press("5"));jumpMenu(S.PANEL.main,5,()=>press("6"));}
  if(state.state==="submenu")jumpMenu(S.PANEL.sub,0,()=>press("1"));
  if(state.state==="trace-menu")jumpMenu(S.PANEL.trace,0,()=>press("1"));
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
  const {x0,x1}=state.view||M.windowFor(state.q);select("lower",{low:null,high:null,cursor:(x0+x1)/2,mark:null});
 }
 function confirm(x){
  if(!state.q||!["lower","upper"].includes(state.state))return;
  edited=true;const {x0,x1}=state.view||M.windowFor(state.q);
  if(!Number.isFinite(x)||x<x0||x>x1){show("Enter an x-value in this graph window ("+M.pretty(x0)+" to "+M.pretty(x1)+").",true);return;}
  if(state.state==="lower"){select("upper",{low:x,cursor:x});return;}
  if(x<=state.low){show("The upper bound must be to the right of the lower bound.",true);return;}
  const r=M.zero(state.q,state.low,x);
  select("result",{cursor:x,high:x,mark:r.ok?{x:r.x,y:0}:null,error:r.message||null});
 }
 function press(k){
  if(mode!=="try")return;
  const w=state.state;
  if(k==="esc"){edited=true;state.q?select(["submenu","trace-menu"].includes(w)?"menu":"plotted",{low:null,high:null,cursor:null,mark:null,menuPick:w==="trace-menu"?4:5,traceEntry:null,traceResult:false}):select("entry");return;}
  if(k==="tab"){edited=true;select("entry",{q:null,raw:expr.value,low:null,high:null,cursor:null,mark:null});return;}
  if(k==="menu"&&state.q){edited=true;select("menu",{low:null,high:null,cursor:null,mark:null,menuPick:5,traceEntry:null,traceResult:false});return;}
  if(w==="menu"){
   if(k==="up"||k==="down"){edited=true;select("menu",{menuPick:k==="up"?4:5});return;}
   if(k==="5"||state.menuPick===4&&["enter","right","select"].includes(k)){edited=true;select("trace-menu");}
   else if(["6","enter","right","select"].includes(k)){edited=true;select("submenu");}
   return;
  }
  if(w==="trace-menu"){
   if(["1","enter","right","select"].includes(k)){
    edited=true;const {x0,x1}=state.view||M.windowFor(state.q);
    select("trace",{cursor:M.clamp(0,x0,x1),traceEntry:null,traceResult:false});
   }
   return;
  }
  if(w==="trace"){
   const {x0,x1}=state.view||M.windowFor(state.q);
   if((k==="enter"||k==="select")&&state.traceEntry!==null){
    const raw=state.traceEntry,x=Number(raw);
    if(!/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw)||!Number.isFinite(x)){show("Enter a valid x-coordinate.",true);return;}
    if(x<x0||x>x1){show("That x-coordinate is outside this window.",true);return;}
    edited=true;select("trace",{cursor:x,traceEntry:null,traceResult:true});return;
   }
   if(k==="left"||k==="right"){
    edited=true;select("trace",{cursor:M.clamp(state.cursor+(k==="left"?-1:1)*(x1-x0)/56,x0,x1),traceEntry:null,traceResult:false});return;
   }
   const raw=state.traceEntry??"",ch=/^\d$/.test(k)?k:k==="dot"?".":["minus","neg"].includes(k)?"-":null;
   if(k==="del"||ch!==null&&raw.length<14){
    edited=true;select("trace",{traceEntry:k==="del"?raw.slice(0,-1):raw+ch,traceResult:false});
   }
   return;
  }
  if(w==="submenu"){if(["1","enter","right","select"].includes(k)){edited=true;analyze();}return;}
  if(w==="lower"||w==="upper"){
   if(k==="enter"||k==="select"){confirm(state.cursor);return;}
   if(k==="left"||k==="right"){
    edited=true;const {x0,x1}=state.view||M.windowFor(state.q),step=(x1-x0)/56;
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
  return xp>=S.SCREEN_X.l&&xp<=S.SCREEN_X.r&&yp>=26&&yp<=226?S.pointAt(state.q,xp,state.view):null;
 }
 lcd.addEventListener("pointermove",e=>{
  if(mode!=="try"||!lcd.classList.contains("pick")||e.pointerType==="touch")return;
  const x=pointer(e);if(x===null)return;state.cursor=x;screen.draw(state);
 });
 lcd.addEventListener("click",e=>{
  if(mode!=="try"||!lcd.classList.contains("pick"))return;
  const x=pointer(e);if(x!==null)confirm(x);
 });
 function enterTry(device,actions){
  mode="try";returnToWatch=actions.returnToWatch;
  device.append(stage);$("try-grid").prepend(handheld);stage.hidden=false;$("try").hidden=false;
  document.body.classList.add("ct10-try-active");
  expr.value=state.raw; shell.setInteractive(true);shell.setKeys([]);renderTry();
  stage.focus({preventScroll:true});
 }
 function exitTry(){
  mode="watch";stage.hidden=true;$("try").hidden=true;frameStamp=-1;
  document.body.classList.remove("ct10-try-active");
  shell.setInteractive(false);shell.setKeys([]);hot.replaceChildren();lcd.classList.remove("pick");
 }
 $("return-watch").addEventListener("click",()=>returnToWatch?.());
 document.addEventListener("keydown",e=>{
  if(e.defaultPrevented||e.isComposing||e.metaKey||e.ctrlKey||e.altKey||e.target.closest("input,textarea,select,a,summary,[contenteditable],.top,.tabbar"))return;
  if(mode!=="try"||!stage.contains(e.target)&&e.target!==document.body||e.target.closest("button")&&(e.key==="Enter"||e.key===" "))return;
  const keys={Escape:"esc",Enter:"enter",Backspace:"del",Delete:"del",ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down",m:"menu",M:"menu",".":"dot","^":"power","+":"plus","-":"minus","*":"mul","/":"div","(":"lparen",")":"rparen","²":"square"};
  const k=keys[e.key]||(/^[0-9xX]$/.test(e.key)?e.key.toLowerCase():"");
  if(k){e.preventDefault();physical(k);}
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
window.CalculatorLessonAdapter=Object.freeze({initialMode:params.get("mode")==="try"?"try":"watch",renderWatch,enterTry,exitTry});
})();
