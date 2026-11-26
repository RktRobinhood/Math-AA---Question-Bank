"use strict";
(function(){
 const $=id=>document.getElementById(id);
 const M=window.CT11Math,S=window.CT11Screen,T=window.CT11Tape,H=window.HandheldTransport;
 const stage=$("stage"),hot=$("hotspots");
 const lcd=$("lcd"),canvas=$("drawing"),screen=S.screen(canvas),fields=[$("expression-1"),$("expression-2")],expressionForm=$("expression-form");
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
let watchStamp="",returnToWatch=null;
 const handheld=$("handheld-host");
 const shell=CalculatorLessonHandset.mount(handheld,{screen:lcd,label:"TI-Nspire CX II-T Graphs",onKey:physical});
 function physical(k){
  if(mode!=="try")return;
  if(!document.activeElement?.matches("input,textarea,select"))stage.focus({preventScroll:true});
  press(k);
 }
 function drawWatchFrame(beat,point,crossed,key,paint){
  const count=crossed.length,hold=point.span.end-point.span.voiceEnd;
  const current=key?.beat===beat&&!point.speaking&&(point.fraction-key.at)*hold<.66;
  const physical=current&&(T.keys[count-1]?.key||T.keys[count-1]?.[1]);
  shell.setKeys(physical?(physical==="t"&&T.keys[count-2]?.key==="ctrl"?["ctrl","t"]:[physical]):[]);
  paint(count);
 }
 const hints={entry:"Enter a function and press Enter to plot. The handheld Tab key switches lines.",plotted:"Two curves are needed. Press Menu when both are plotted.",menu:"Choose 6: Analyze Graph.",submenu:"Choose 4: Intersection.",lower:"Place the lower bound just left of one crossing. Type an x-value or move the cursor.",upper:"Choose the upper bound just right of the same crossing.",result:"Read the x-coordinate and the common y-coordinate."};
 const syncFields=()=>fields.forEach((el,i)=>{el.value=state.raw[i]});
 const getWindow=()=>state.windows||M.windowFor(state.q);
 const fmtPair=z=>"("+M.pretty(z.x)+", "+M.pretty(z.y)+")";
 $("challenge-title").textContent=title;$("keypad-problem").textContent=prompt;
 $("challenge").textContent=pairText+" "+prompt;
 function labelGraph(s){
  const graphs=s.q.flatMap((p,i)=>p?["f"+(i+1)+" of x = "+M.displayExpr(p.raw)]:[]);
  if(s.state==="entry")graphs.push("Function entry "+(s.active+1)+": "+M.displayExpr(s.raw[s.active]));
  $("lcd-text").textContent=[...graphs,hints[s.state],s.low!=null?"Lower: "+M.pretty(s.low):"",s.high!=null?"Upper: "+M.pretty(s.high):"",s.typed?"Typed bound: "+s.typed:"",s.cursor!=null?"Cursor: "+M.pretty(s.cursor):"",s.mark?"Intersection "+fmtPair(s.mark):"",s.error||""].filter(Boolean).join(". ");
 }
 function snapshot(time){
  const v={state:"entry",active:0,first:"",second:"",firstPlot:false,secondPlot:false};
  let last=-1;
  for(const [i,e] of T.keys.entries()){
   if(time+1e-8<e.time)break;
   Object.assign(v,e.delta);last=i;
  }
  const s={...initial([v.first,v.second]),...v,q:[v.firstPlot?watchPair[0]:null,v.secondPlot?watchPair[1]:null],windows:knownWindow};
  if(last===T.keys.length-1){
   const result=M.solve(s.q,s.low,s.high);
   s.mark=result.ok?{x:result.x,y:result.y}:null;
   s.error=result.message||null;
  }
  return{s,last};
 }

 function renderWatch(device,{beat,point,crossed,key}){
  if(handheld.parentElement!==device)device.append(handheld);
  drawWatchFrame(beat,point,crossed,key,count=>{
   if(watchStamp===String(count))return;watchStamp=String(count);
   const m=snapshot(count?(T.keys[count-1].time+1e-7):0).s;
   screen.draw(m);labelGraph(m);
  });
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
  expressionForm.hidden=state.state!=="entry";
  fields.forEach((el,i)=>{el.closest("label").hidden=i!==state.active;el.disabled=i!==state.active;});
  $("retry-bounds").hidden=state.state!=="result";
  $("keypad-hint").textContent=state.state==="plotted"?state.q.every(Boolean)?"Press Menu on the handheld.":"Press the handheld Tab key to enter the other function.":hints[state.state];
  show(state.error||(state.mark?"Intersection: "+fmtPair(state.mark)+".":"")|| (unsafe&&!edited?"The linked functions were invalid. An original practice pair is shown instead.":""),Boolean(state.error||unsafe&&!edited));
  if(state.state==="menu")jumpMenu(S.PANEL.main,5,()=>press("6"));
  if(state.state==="submenu")jumpMenu(S.PANEL.sub,3,()=>press("4"));
 }
 function select(next,properties={}){
  state={...state,state:next,error:null,typed:"",...properties};renderTry();
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
  state.typed=v;labelGraph(state);screen.draw(state);show();
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
    state.typed="";state.cursor=M.clamp(state.cursor+(k==="left"?-step:step),x0,x1);
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
 expressionForm.addEventListener("submit",e=>{e.preventDefault();edited=true;plot([state.active]);if(state.state==="plotted")stage.focus({preventScroll:true});});
 fields.forEach((el,i)=>{
  el.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.isComposing){e.preventDefault();expressionForm.requestSubmit();}});
  el.addEventListener("focus",()=>{if(mode==="try")state.active=i;});
  el.addEventListener("input",()=>{if(mode!=="try")return;edited=true;fresh=false;
   const raw=state.raw.slice(),q=state.q.slice();raw[i]=el.value;q[i]=null;state={...initial(raw),q,active:i};renderTry();
  });
 });
 $("retry-bounds").addEventListener("click",()=>{edited=true;analyze();});
 $("reset-keypad").addEventListener("click",()=>{edited=true;fresh=true;state=initial(challenge.map(q=>q.raw));syncFields();renderTry();stage.focus({preventScroll:true});});
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
function enterTry(device,actions){
 mode="try";returnToWatch=actions.returnToWatch;
 device.append(stage);$("try-grid").prepend(handheld);stage.hidden=false;$("try").hidden=false;
 document.body.classList.add("graph-try");shell.setInteractive(true);shell.setKeys([]);
 syncFields();renderTry();stage.focus({preventScroll:true});
}
function exitTry(){
 mode="watch";stage.hidden=true;$("try").hidden=true;watchStamp="";
 document.body.classList.remove("graph-try");shell.setInteractive(false);shell.setKeys([]);
 $("hotspots").replaceChildren();lcd.classList.remove("pick");
 expressionForm.hidden=true;
}
$("return-watch").addEventListener("click",()=>returnToWatch?.());

 document.addEventListener("keydown",e=>{
  if(mode!=="try"||e.defaultPrevented||e.metaKey||e.ctrlKey||e.altKey||e.target.closest("input,textarea,select,a,summary,[contenteditable]"))return;
  if((!stage.contains(e.target)&&e.target!==document.body)||e.target.closest("button")&&(e.key==="Enter"||e.key===" "))return;
  const keys={Escape:"esc",Enter:"enter",Backspace:"del",Delete:"del",ArrowLeft:"left",ArrowRight:"right",m:"menu",M:"menu",".":"dot","^":"power","+":"plus","-":"minus","*":"mul","/":"div","(":"lparen",")":"rparen","²":"square"};
  const k=keys[e.key]||(/^[0-9xX]$/.test(e.key)?e.key.toLowerCase():"");
  if(k){e.preventDefault();physical(k);}
 });
 const answer=[$("answer-x"),$("answer-y")],feedback=$("feedback");
 answer.forEach(a=>a.addEventListener("input",()=>{edited=true;feedback.textContent="";}));
 $("answer-form").addEventListener("submit",e=>{
  e.preventDefault();if(!isExercise())return;edited=true;
  const values=answer.map(a=>a.valueAsNumber),goals=[target.x,target.y];
  if(!values.every(Number.isFinite))return;
  const equal=(v,n)=>n===0?v===0:Math.abs(v-n)<=1e-10*Math.abs(n);
  const hits=values.map((v,i)=>[3,4,5,6,7,8,9,10,11,12,13,14,15,16,17].some(sf=>equal(v,Number(goals[i].toPrecision(sf)))));
  const yes=hits.every(Boolean);
  feedback.className="feedback "+(yes?"is-right":"is-wrong");
  feedback.textContent=yes?"Correct. Both functions have that y-value at your x.":hits[0]?"The x-coordinate is right. Check the common y-value.":"Check that your bounds isolated the requested crossing.";
 });
window.CalculatorLessonAdapter=Object.freeze({initialMode:params.get("mode")==="try"?"try":"watch",renderWatch,enterTry,exitTry});
})();
