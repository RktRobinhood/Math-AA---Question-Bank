"use strict";
(function(){
 const $=id=>document.getElementById(id);
 const M=window.CT16Math,S=window.CT16Screen,T=window.CT16Tape,H=window.HandheldTransport;
 const stage=$("stage");
 const lcd=$("lcd"),canvas=$("drawing"),screen=S.screen(canvas),fields=[$("expression-1"),$("expression-2")],bound=$("bound");
 const pair=(f,g)=>[M.parse(f),M.parse(g,"target")];
 const watchPair=pair("5*1.5^x","12"),defaultTry=pair("60*0.8^x","30"),params=new URLSearchParams(location.search);
 const watchEnd=8,knownWindow={x0:-.5,x1:4.25,y0:-4,y1:34};
 const initial=(raw,end)=>({state:"entry",raw:raw.slice(),q:[null,null],end,active:0,low:null,high:null,cursor:null,mark:null,error:null,typed:"",windows:null});
 let linked=null,unsafe=false,exerciseEnd=8;
 const customLink=["expr","target","end"].some(k=>params.has(k));
 if(customLink){
  try{
   for(const k of ["expr","target","end"])if(params.getAll(k).length!==1)throw Error("Provide one model, target and end time.");
   const q=pair(params.get("expr"),params.get("target")),end=M.parseEnd(params.get("end")),r=M.modelInfo(q,end);
   if(!r.ok)throw Error(r.message);
   linked=q;exerciseEnd=end;
  }catch{unsafe=true;}
 }
 const exercise=linked||defaultTry,goal=M.modelInfo(exercise,exerciseEnd);
 const describe=(q,end,r)=>"For 0 to "+end+" days, "+(q===defaultTry?"stock":"the quantity")+" follows "+M.displayExpr(q[0].raw)+". Find when it first reaches "+(r.increasing?"at least ":"at most ")+M.pretty(q[1].T)+" units.";
 const prompt=describe(exercise,exerciseEnd,goal);
 const sameCurve=(a,b)=>a.A===b.A&&a.B===b.B&&a.T===b.T;
 let mode="watch",state=initial(exercise.map(q=>q.raw),exerciseEnd),edited=false,fresh=true,returnToWatch,stamp="";
 const handheld=$("handheld-host");
 const shell=CalculatorLessonHandset.mount(handheld,{screen:lcd,label:"TI-Nspire CX II-T Graphs",interactive:false,onKey:key=>{press(key);stage.focus({preventScroll:true});}});
 const hot=$("hotspots");
 const hints={entry:"Enter a function and press Enter to plot. Use the handheld Tab to open the other line.",plotted:"Two curves are needed. Press Menu when both are plotted.",menu:"Choose 6: Analyze Graph.",submenu:"Choose 4: Intersection.",lower:"Place the lower bound just left of one crossing. Type an x-value or move the cursor.",upper:"Choose the upper bound just right of the same crossing.",result:"Read the x-coordinate for the time. Test which whole day first meets the threshold."};
 const syncFields=()=>{fields.forEach((el,i)=>{el.value=state.raw[i];el.setSelectionRange(el.value.length,el.value.length);});bound.value=state.typed;};
 const getWindow=()=>state.windows||M.windowFor(state.q,state.end);
 const fmtPair=z=>"("+M.pretty(z.x)+", "+M.pretty(z.y)+")";
 function labelGraph(s){
  const graphs=s.q.flatMap((p,i)=>p?["f"+(i+1)+" of x = "+M.displayExpr(p.raw)]:[]);
  if(s.state==="entry")graphs.push("Function entry "+(s.active+1)+": "+M.displayExpr(s.raw[s.active]));
  $("lcd-text").textContent=[...graphs,hints[s.state],s.low!=null?"Lower: "+M.pretty(s.low):"",s.typed?"Typed bound: "+s.typed:"",s.cursor!=null?"Cursor: "+M.pretty(s.cursor):"",s.mark?"Intersection "+fmtPair(s.mark):"",s.error||""].filter(Boolean).join(". ");
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
 function isExercise(){
  try{
   const typed=pair(...state.raw);
   return state.end===exerciseEnd&&sameCurve(typed[0],exercise[0])&&sameCurve(typed[1],exercise[1]);
  }catch{return false;}
 }
 function renderTry(){
  if(mode!=="try")return;
  screen.draw(state);labelGraph(state);hot.replaceChildren();
  const inExercise=isExercise(),info=M.modelInfo(state.q,state.end);
  $("answer-form").hidden=!inExercise;
  $("checker-context").hidden=inExercise;
  if(!inExercise)$("feedback").textContent="";
  $("reset-keypad").textContent="Reset calculator";
  $("checker-context").textContent="Exploration only. Reset the calculator to return to the set exercise.";
  $("keypad-problem").textContent=inExercise?prompt:info.ok?describe(state.q,state.end,info):"Explore a different model and horizontal target, from 0 to "+state.end+" days.";
  $("try-line").textContent=$("keypad-problem").textContent;
  const b=state.state==="lower"||state.state==="upper";lcd.classList.toggle("pick",b);
  $("bound-form").hidden=!b;$("retry-bounds").hidden=state.state!=="result";
  $("bound-label").textContent=state.state==="lower"?"Lower bound x":"Upper bound x";
  $("keypad-hint").textContent=state.state==="plotted"?state.q.every(Boolean)?"Press Menu on the handheld.":"Press the handheld Tab key to enter the other function.":hints[state.state];
  show(state.error||(state.mark?"Crossing: "+fmtPair(state.mark)+". The x-coordinate is the time.":"")|| (unsafe&&!edited?"The linked model, target or time range was invalid. The original exercise is shown instead.":""),Boolean(state.error||unsafe&&!edited));
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
   for(const i of indices){parsing=i;q[i]=M.parse(fields[i].value,i===1?"target":"model");raw[i]=q[i].raw;}
   state={...initial(raw,state.end),q,state:"plotted",active:indices.at(-1),fromWatch:state.fromWatch};
   syncFields();renderTry();
  }catch(e){select("entry",{active:parsing,error:"Function "+(parsing+1)+": "+e.message});}
 }
 function analyze(){
  const info=M.modelInfo(state.q,state.end);
  if(!info.ok){select("plotted",{error:info.message,mark:null});return;}
  const {x0,x1}=getWindow();select("lower",{low:null,high:null,cursor:M.clamp((x0+x1)/2,0,state.end),mark:null});
 }
 const readBound=s=>/^[+−-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s.trim())?Number(s.trim().replace("−","-")):NaN;
 function confirm(x){
  if(!state.q.every(Boolean)||!["lower","upper"].includes(state.state))return;
  edited=true;
  if(!Number.isFinite(x)||x<0||x>state.end){show("Enter a bound within the time domain, 0 to "+state.end+" days.",true);return;}
  if(state.state==="lower"){select("upper",{low:x,cursor:x});return;}
  if(x<=state.low){show("The upper bound must be to the right of the lower bound.",true);return;}
  const r=M.solve(state.q,state.low,x,state.end);
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
    state.typed="";bound.value="";state.cursor=M.clamp(state.cursor+(k==="left"?-step:step),0,Math.min(x1,state.end));
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
   const raw=state.raw.slice(),q=state.q.slice();raw[i]=el.value;q[i]=null;state={...initial(raw,state.end),q,active:i,fromWatch:state.fromWatch};renderTry();
  });
 });
 $("bound-form").addEventListener("submit",e=>{e.preventDefault();confirm(readBound(bound.value));});
 bound.addEventListener("input",()=>{if(mode!=="try")return;edited=true;state.typed=bound.value;labelGraph(state);screen.draw(state);});
 $("retry-bounds").addEventListener("click",()=>{edited=true;analyze();});
 function restoreExercise(){
  edited=true;fresh=true;state=initial(exercise.map(q=>q.raw),exerciseEnd);syncFields();
  $("answer-x").value="";$("answer-day").value="";$("feedback").textContent="";renderTry();
 }
 $("reset-keypad").addEventListener("click",()=>{
  restoreExercise();
  stage.focus({preventScroll:true});
 });
 function pointer(ev){
  const r=canvas.getBoundingClientRect(),xp=(ev.clientX-r.left)*320/r.width,yp=(ev.clientY-r.top)*240/r.height;
  return xp>=S.SCREEN_X.l&&xp<=S.SCREEN_X.r&&yp>=26&&yp<=226?S.pointAt(state.q,xp,getWindow()):null;
 }
 lcd.addEventListener("pointermove",e=>{
  if(mode!=="try"||!lcd.classList.contains("pick")||e.pointerType==="touch"||state.typed)return;
  const x=pointer(e);if(x===null)return;state.cursor=x;screen.draw(state);
 });
 lcd.addEventListener("click",e=>{
  if(mode!=="try"||!lcd.classList.contains("pick"))return;
  const x=pointer(e);if(x!==null)confirm(x);
 });
 const watchStates=[{state:"entry",active:0,first:"",second:"",firstPlot:false,secondPlot:false}];
 for(const e of T.keys)watchStates.push({...watchStates.at(-1),...e.delta});
 function renderWatch(device,{beat,point,crossed,key}){
  if(handheld.parentElement!==device)device.append(handheld);
  const n=crossed.length,lit=n&&!point.speaking&&key?.beat===beat&&(point.fraction-key.at)*(point.span.end-point.span.voiceEnd)<.62;
  shell.setKeys(lit?[T.keys[n-1].key]:[]);
  if(stamp===n)return;
  stamp=n;const v=watchStates[n],s={...initial([v.first,v.second],watchEnd),...v,q:[v.firstPlot?watchPair[0]:null,v.secondPlot?watchPair[1]:null],windows:knownWindow};
  screen.draw(s);labelGraph(s);
 }
 function enterTry(device,actions){
  mode="try";returnToWatch=actions.returnToWatch;device.prepend(stage);$("try-deck").prepend(handheld);stage.hidden=false;
  shell.setKeys([]);shell.setInteractive(true);syncFields();renderTry();stage.focus({preventScroll:true});
 }
 function exitTry(){
  mode="watch";stage.hidden=true;stamp="";hot.replaceChildren();lcd.classList.remove("pick");shell.setKeys([]);shell.setInteractive(false);
 }
 $("return-watch").onclick=()=>returnToWatch?.();
 document.addEventListener("keydown",e=>{
  if(e.target!==document.body&&!e.target.closest?.(".qb-calculator-lesson"))return;
  if(e.metaKey||e.ctrlKey||e.altKey||e.target.closest("input,textarea,select,a,summary,[contenteditable]"))return;
  if(e.defaultPrevented||e.target.closest?.(".top, .tabbar"))return;
  if(mode!=="try"||!stage.contains(e.target)&&e.target!==document.body||e.target.closest("button")&&(e.key==="Enter"||e.key===" "))return;
  const keys={Escape:"esc",Enter:"enter",Backspace:"del",Delete:"del",ArrowLeft:"left",ArrowRight:"right",m:"menu",M:"menu",".":"dot","^":"power","+":"plus","-":"minus","*":"mul","/":"div","(":"lparen",")":"rparen","²":"square"};
  const k=keys[e.key]||(/^[0-9xX]$/.test(e.key)?e.key.toLowerCase():"");
  if(k){e.preventDefault();press(k);}
 });
 const answer=[$("answer-x"),$("answer-day")],feedback=$("feedback");
 answer.forEach(a=>a.addEventListener("input",()=>{edited=true;feedback.textContent="";}));
 $("answer-form").addEventListener("submit",e=>{
  e.preventDefault();if(!isExercise())return;edited=true;
  const [continuous,day]=answer.map(a=>a.valueAsNumber);
  if(!Number.isFinite(continuous)||!Number.isInteger(day))return;
  const timeRight=Array.from({length:15},(_,i)=>Number(goal.x.toPrecision(i+3))).some(x=>Math.abs(x-continuous)<=1e-12*Math.abs(x));
  const dayRight=day===goal.day,yes=timeRight&&dayRight;
  feedback.className="feedback "+(yes?"is-right":"is-wrong");
  feedback.textContent=yes?"Both correct. Day "+goal.day+" is the first checkpoint that meets the threshold.":timeRight?"The continuous time is correct. Test the adjacent whole days against the target rather than rounding.":dayRight?"The whole day is correct. Read the x-coordinate at the intersection for the continuous time.":"Use Intersection for the continuous time, then test the adjacent whole days against the target.";
 });
 window.CalculatorLessonAdapter=Object.freeze({initialMode:params.get("mode")==="try"||customLink?"try":"watch",renderWatch,enterTry,exitTry});
})();
