"use strict";
(function(){
const $=id=>document.getElementById(id),M=CT52Math,E=CT52Editor,S=CT52Screen,T=CT52Tape;
 const stage=$("stage"),lcd=$("lcd"),canvas=$("drawing"),hot=$("hotspots");
 const screen=S.screen(canvas),expr=$("expression"),bound=$("bound"),exact=$("point-input"),feedback=$("feedback");
 const params=new URLSearchParams(location.search),def=M.parse("x^3+4");
 let linked=null,invalid=false;
 if(params.has("expr")||params.has("x"))try{
  if(params.getAll("expr").length!==1||params.getAll("x").length>1)throw Error("Invalid links");
  const q=M.parse(params.get("expr")),x=params.has("x")?M.readX(params.get("x")):null;
  if(params.has("x")&&(x===null||Math.abs(x)>20))throw Error("Invalid candidate");
  linked={q,x};
 }catch{invalid=true;}
 const task=linked||{q:def,x:0},goal=task.x===null?null:M.inspect(task.q,task.x),gradeable=Boolean(goal&&["maximum","minimum","stationary inflection"].includes(goal.kind));
 const pretty=M.prettyX;
 let mode="watch",state=E.base(task.q.raw),edited=false,cache="",typedNote="",returnToWatch;
 const handheld=$("handheld-host");
 const shell=CalculatorLessonHandset.mount(handheld,{screen:lcd,label:"TI-Nspire CX II-T Graphs",interactive:false,onKey:press});
 const hints={f1:"Enter a smooth polynomial and press Enter to plot f₁.",graph:"Open Ctrl + G for f₂, or use Menu to bracket a derivative crossing.",f2:"Open Math Templates.",templates:"Select the first derivative template.",diff:"Use the variable box for x and the expression for f1(x).",menu:"Choose 6: Analyze Graph.",sub:"Choose 1: Zero.",curve:"Select f₂, the derivative, then confirm.",lower:"Choose a lower bound to the left of one derivative crossing.",upper:"Choose an upper bound to the right of the same crossing."};
 const classes={"maximum":"Local maximum","minimum":"Local minimum","stationary inflection":"Stationary inflection"};
 function describe(s){
  handheld.dataset.scene=s.page;
  const label=s.q?"Graph f₁(x) = "+M.displayExpr(s.q.raw):"f₁ entry: "+(M.displayExpr(s.raw)||"blank");
  const both=s.both?" Graph f₂ is the derivative.":"",marks=s.marks.length?" f₂ zeros at x = "+s.marks.map(M.pretty).join(", ")+".":"";
  const detail=s.page==="diff"?" Template derivative variable "+(s.var||"blank")+", expression "+(s.arg||"blank")+".":s.page==="curve"?" Selected curve f"+(s.curve===2?"₂":"₁")+".":s.page==="upper"?" Lower bound "+M.pretty(s.low)+".":"";
  const short=s.error?" "+s.error:"";
  $("lcd-text").textContent=label+". "+hints[s.page]+both+detail+marks+short;
 }
 const physicalTape=T.keys.map(([time,key])=>({time,key}));
 function snapshot(t){
  let s=E.base();
  for(const {time,key} of physicalTape){if(time>t)break;s=E.k(s,key);}
  return s;
 }
 let model;
 function renderWatch(device,{beat,point,crossed,key}){
  if(handheld.parentElement!==device)device.append(handheld);
  const count=crossed.length,press=physicalTape[count-1],hold=point.span.end-point.span.voiceEnd;
  const lit=press&&!point.speaking&&key?.beat===beat&&(point.fraction-key.at)*hold<.65;
  const stamp=beat+":"+count;
  if(stamp!==cache){
   cache=stamp;
   model=snapshot(press?.time??0);
   screen.draw(model);describe(model);
  }
  shell.setKeys(!lit?[]:press.key==="g"?["ctrl","g"]:press.key==="minus"&&model.page==="diff"?["shift","minus"]:[press.key]);
 }
 function button(label,x,y,w,h,action){
  const b=document.createElement("button");b.type="button";b.setAttribute("aria-label",label);
  Object.assign(b.style,{left:x/3.2+"%",top:y/2.4+"%",width:w/3.2+"%",height:h/2.4+"%"});
  b.addEventListener("click",e=>{e.stopPropagation();action();stage.focus({preventScroll:true});});hot.append(b);
 }
 $("challenge").textContent=task.x===null?"Explore f₁(x) = "+M.displayExpr(task.q.raw)+".":"For f₁(x) = "+M.displayExpr(task.q.raw)+", check the candidate x = "+pretty(task.x)+". Give its height and classify it.";
 function inExercise(){
  if(!gradeable)return false;
  try{return M.equivalent(M.parse(expr.value),task.q)&&M.equivalent(M.parse(state.raw),task.q);}
  catch{return false;}
 }
 function message(msg="",error=false){
  $("keypad-result").textContent=msg;$("keypad-result").hidden=!msg;
  $("keypad-result").className="feedback"+(error?"is-wrong":"is-right");
 }
 function freshTry(){
  if(mode!=="try")return;
  screen.draw(state);describe(state);hot.replaceChildren();
  const p=state.page,inTask=inExercise();
  $("exercise-active").hidden=!inTask;$("exercise-inactive").hidden=inTask;
  $("keypad-problem").textContent=task.x!==null&&(inTask||linked)?"Candidate: x = "+pretty(task.x)+".":"Choose a candidate or bracket a derivative crossing.";
  $("keypad-hint").textContent=p==="graph"&&state.both?"Use Zero for a crossing, or check a known candidate separately.":hints[p];
  const finding=p==="lower"||p==="upper";
  $("bound-form").hidden=!finding;$("bound-label").textContent=(p==="upper"?"Upper":"Lower")+" bound x (lesson shortcut)";
  $("point-form").hidden=p!=="graph"||!state.both;
  if(bound.value!==state.buf)bound.value=state.buf;
  const v=state.probe;
  const sign=x=>x>0?"+":x<0?"−":"0";
  $("probe-result").textContent=!v?"":classes[v.kind]?
   "f₁("+pretty(v.x)+") = "+M.pretty(v.y)+". f₂ is zero. Signs: "+sign(v.sl)+" at "+M.pretty(v.left)+", "+sign(v.sr)+" at "+M.pretty(v.right)+". "+classes[v.kind]+"."
   :"f₁("+pretty(v.x)+") = "+M.pretty(v.y)+". f₂("+pretty(v.x)+") ≈ "+M.pretty(v.slope)+". "+(v.kind==="constant"?"The derivative is zero everywhere; there is no isolated stationary point.":"This is not a verified stationary x. A small slope does not prove a root.");
  const warn=invalid&&!edited?"Invalid linked function or candidate. Showing the set exercise.":"";
  const found=p==="graph"&&state.marks.length&&!v?"Zero of f₂: x = "+M.pretty(state.marks.at(-1))+". Check this candidate on f₁.":"";
  message(state.error||warn||typedNote||found,Boolean(state.error||warn));
  if(p==="templates")button("First derivative template",199,82,39,27,()=>{state={...state,select:4};press("enter");});
  if(p==="diff"){button("Variable box",85,49,26,18,()=>{state={...state,field:0};freshTry();});button("Expression box",127,33,132,25,()=>{state={...state,field:1};freshTry();});}
  if(p==="menu")button("6: Analyze Graph",8,100,127,14,()=>press("6"));
  if(p==="sub")button("1: Zero",136,98,162,14,()=>press("1"));
  if(p==="curve")button("Select f₂ derivative graph",224,20,44,18,()=>{state={...state,curve:2};press("enter");});
 }
 function press(k){
  if(mode!=="try")return;
  const prev=state;edited=true;typedNote="";state=E.k(state,k);
  if(state.page==="graph"&&state.marks.length&&state.marks!==prev.marks)exact.value=String(state.marks.at(-1));
  shell.setKeys(state.ctrl?["ctrl"]:state.shift?["shift"]:[]);freshTry();
 }
 function inspect(x){
  if(state.page!=="graph"||!state.both)return;
  if(x===null||Math.abs(x)>20){state={...state,error:"Enter a valid decimal candidate in [−20,20]."};freshTry();return;}
  const marked=state.marks.find(r=>r===x||Number(r.toPrecision(6))===x);
  // A root is reusable after a successful bracket, even at its six-digit screen precision.
  const v=M.inspect(state.q,marked??x,marked!==undefined);
  state={...state,error:"",probe:v};typedNote="";edited=true;freshTry();
 }
 $("point-form").addEventListener("submit",e=>{
  e.preventDefault();
  const x=M.readX(exact.value);inspect(x);
  if(x!==null&&Math.abs(x)<=20)stage.focus({preventScroll:true});
 });
 $("bound-form").addEventListener("submit",e=>{
  e.preventDefault();edited=true;const prev=state;state=E.confirmBound(state,M.readX(bound.value));
  if(state.page==="graph"&&state.marks!==prev.marks)exact.value=String(Number(state.marks.at(-1).toPrecision(6)));
  freshTry();
  if(state.page!==prev.page)stage.focus({preventScroll:true});
 });
 bound.addEventListener("input",()=>{edited=true;state={...state,buf:bound.value,error:""};freshTry();});
 $("expression-form").addEventListener("submit",e=>{
  e.preventDefault();edited=true;
  try{const q=M.parse(expr.value);state=E.base(q.raw);typedNote="f₁ entry loaded. Press Enter to plot.";}
  catch(err){state={...state,error:err.message};typedNote="";}
  freshTry();stage.focus({preventScroll:true});
 });
 expr.addEventListener("input",()=>{edited=true;typedNote="";state={...state,error:""};feedback.textContent="";freshTry();});
 $("reset-keypad").addEventListener("click",()=>{
  state=E.base(task.q.raw);expr.value=task.q.raw;edited=true;typedNote="";exact.value="";
  feedback.textContent="";$("answer-y").value="";$("kind").value="";freshTry();stage.focus({preventScroll:true});
 });
 lcd.addEventListener("click",e=>{
  if(mode!=="try"||!["lower","upper","curve"].includes(state.page))return;
  const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*320/r.width,y=(e.clientY-r.top)*240/r.height;
  if(x<S.X.l||x>S.X.r||y<S.Y.t||y>S.Y.b)return;
  const w=M.window(state.q,state.both),v=Number(S.fromPixel(w,x).toFixed(2));
  if(state.page==="curve"){
   const yy=w.y0+(S.Y.b-y)/(S.Y.b-S.Y.t)*(w.y1-w.y0);
   const which=Math.abs(yy-M.dx(state.q,v))<Math.abs(yy-state.q.f(v))?2:1;
   state={...state,curve:which};press("enter");return;
  }
  state={...state,cursor:v,buf:""};freshTry();
 });
 function enterTry(device,actions){
  mode="try";returnToWatch=actions.returnToWatch;
  device.prepend(stage);$("try-grid").prepend(handheld);stage.hidden=false;
  freshTry();
  shell.setInteractive(true);shell.setKeys(state.ctrl?["ctrl"]:state.shift?["shift"]:[]);
  stage.focus({preventScroll:true});
 }
 function exitTry(){
  mode="watch";stage.hidden=true;cache="";
  hot.replaceChildren();shell.setKeys([]);shell.setInteractive(false);
 }
 $("return-watch").addEventListener("click",()=>returnToWatch?.());
 document.addEventListener("keydown",e=>{if(mode!=="try"||e.defaultPrevented||e.isComposing||e.target.closest?.(".top, .tabbar"))return;
  if(e.target.closest("input,textarea,select,a,summary,[contenteditable]")||e.altKey)return;
  if(mode==="try"&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="g"&&stage.contains(e.target)){e.preventDefault();press("ctrl-g");return;}
  if(e.ctrlKey||e.metaKey)return;
  if(mode==="try"&&state.page==="f2"&&e.shiftKey&&["-","_"].includes(e.key)&&stage.contains(e.target)){e.preventDefault();press("derivative-template");return;}
  const tag=e.target.closest("button");
  if(!stage.contains(e.target)&&e.target!==document.body||tag&&(e.key==="Enter"||e.key===" "))return;
  if(e.key==="Tab"){
   if(e.target===stage&&state.page==="diff"&&!state.field&&!e.shiftKey){e.preventDefault();press("tab");}
   return;
  }
  const map={Escape:"esc",Enter:"enter",Backspace:"del",Delete:"del",ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down",t:"templates",T:"templates",m:"menu",M:"menu",".":"dot","^":"power","+":"plus","-":"minus","*":"mul","/":"div","(":"lparen",")":"rparen","²":"square"};
  const k=map[e.key]||(/^[0-9xXfF]$/.test(e.key)?e.key.toLowerCase():"");
  if(k){e.preventDefault();press(k);}
 });
 [$("answer-y"),$("kind")].forEach(el=>el.addEventListener("input",()=>{edited=true;feedback.textContent="";}));
 $("answer-form").addEventListener("submit",e=>{
  e.preventDefault();if(mode!=="try"||!inExercise())return;edited=true;
  const a=$("answer-y").value.trim().replace("−","-"),n=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(a)?Number(a):NaN;
  const goodY=Number.isFinite(n)&&[goal.y,Number(goal.y.toPrecision(6)),Number(goal.y.toPrecision(3))].some(y=>Math.abs(n-y)<=Math.abs(y)*1e-10);
  const goodKind=$("kind").value===goal.kind,ok=goodY&&goodKind;
  feedback.className="feedback"+(ok?"is-right":"is-wrong");
  feedback.textContent=ok?"Correct. The original function gives the height; the two signs give the class.":goodY?"The height is right. Compare the derivative signs on each side.":"Use the original function for the height, not its derivative.";
 });
 expr.value=task.q.raw;exact.value=task.x===null?"":String(task.x);
 window.CalculatorLessonAdapter=Object.freeze({
  initialMode:params.get("mode")==="try"||linked&&params.get("mode")!=="watch"?"try":"watch",
  renderWatch,enterTry,exitTry
 });
})();
