"use strict";
(function(){
 const $=id=>document.getElementById(id),M=CT13Math,T=CT13Tape,S=CT13Screen,H=HandheldTransport;
 const stage=$("stage"),lcd=$("lcd"),canvas=$("drawing"),screen=S.screen(canvas),inputs=[$("curve-f"),$("curve-g")],bound=$("bound");
 const params=new URLSearchParams(location.search),names=["f","g","op","lower","upper"],scope=[$("op"),$("low"),$("high")];
 const parsePair=(f,g)=>[M.parse(f),M.parse(g,false)];
 function model(raw,op,a,b){
  const curves=parsePair(...raw),l=M.number(a),u=M.number(b);
  const checked=M.solve(curves,l,u,op);
  return {curves,op,limits:[l,u],checked};
 }
 let challenge=model(["((x+1)(x^2-9))/(x+1)","0"],"lt","-4","4"),unsafe=false;
 const typed=names.some(k=>params.has(k));
 if(typed)try{
  if(names.some(k=>params.getAll(k).length!==1))throw Error("Incomplete or repeated inputs");
  challenge=model([params.get("f"),params.get("g")],params.get("op"),params.get("lower"),params.get("upper"));
 }catch{unsafe=true;}
 const fixed=typed||params.get("case")==="inequality-demo"||params.get("example")==="demo";
 const watchModel=model(["(x^2-4)/(x-1)","0"],"le","-4","4"),watchLimits=watchModel.limits;
 const watchPoints=[M.rootsIn(watchModel.curves,-3,-1),M.rootsIn(watchModel.curves,1.5,3)];
 const create=(raw,preset,op)=>({state:"entry",raw:[...raw],slot:0,preset,op,curves:[],low:null,high:null,cursor:null,draft:"",points:[],excluded:false,menuIndex:0,subIndex:0,error:"",probe:"",dirty:false,settings:[op,...preset.map(String)]});
 const initial=()=>create(challenge.curves.map(c=>c.raw),challenge.limits,challenge.op);
 let mode="watch",state=initial(),edited=false,returnToWatch,stamp="",light=0;
 const handheld=$("handheld-host"),hot=$("hotspots");
 const shell=CalculatorLessonHandset.mount(handheld,{screen:lcd,label:"TI-Nspire CX II-T Graphs",interactive:false,onKey:k=>{press(k);stage.focus({preventScroll:true});}});
 const hints={
  entry:"Plot both sides before comparing.",plotted:"Use Menu → Analyze Graph → Intersection to bracket one crossing.",
  menu:"Choose 6: Analyze Graph.",submenu:"Choose 4: Intersection.",
  lower:"Type or point to a bound left of one intersection. Press Enter.",upper:"Choose a bound right of that intersection. Press Enter.",
  result:"Record the x-coordinate. Also check where either side is undefined."
 };
 function graphLabel(s){
  const limit=s.low!=null?" Lower: "+M.pretty(s.low)+".":"",draft=s.draft?" Typed "+s.draft+".":"";
  const results=s.points.map(p=>" Intersection: ("+M.pretty(p.x)+", "+M.pretty(p.y)+").").join("");
  const prior=s.excluded?" Lesson note: f₁ is undefined at x equals 1.":"";
  const menu=s.state==="menu"?" Selected: "+S.PANEL.main.rows[s.menuIndex]+".":s.state==="submenu"?" Selected: "+S.PANEL.sub.rows[s.subIndex]+".":"";
  $("lcd-text").textContent=(s.state==="entry"?"Function "+(s.slot+1)+" entry "+M.displayExpr(s.raw[s.slot]):s.curves.map((q,i)=>"Graph "+(i+1)+": "+M.displayExpr(q.raw)).join("; "))+". "+hints[s.state]+menu+limit+draft+results+prior+(s.error?" "+s.error:"");
 }
 function jumpMenu(panel,index,fn){
  const b=document.createElement("button");b.type="button";b.setAttribute("aria-label",panel.rows[index]);
  b.style.left=panel.x/3.2+"%";b.style.top=(panel.y+2+index*panel.h)/2.4+"%";b.style.width=panel.w/3.2+"%";b.style.height=panel.h/2.4+"%";
  b.addEventListener("click",e=>{e.stopPropagation();fn();});hot.append(b);
 }
 function setMessage(text="",wrong=false){
  const v=$("keypad-result");v.hidden=!text;v.textContent=text;v.className="feedback "+(wrong?"is-wrong":"is-right");
 }
 const picking=()=>state.state==="lower"||state.state==="upper";
 function checkerEnabled(){return !state.dirty;}
 const goal=()=>{
  const a=state.curves.length===2?state.curves.map(c=>c.raw):state.raw;
  const condition="f₁(x) "+M.symbol[state.op]+" f₂(x) on ["+state.preset.map(M.pretty).join(", ")+"]";
  return condition+"; f₁(x) = "+M.displayExpr(a[0])+", f₂(x) = "+M.displayExpr(a[1])+".";
 };
 function renderTry(){
  if(mode!=="try")return;
  screen.draw(state);graphLabel(state);hot.replaceChildren();
  lcd.classList.toggle("pick",picking());$("bound-form").hidden=!picking();
  $("bound-label").textContent=state.state==="lower"?"Lower bound x":"Upper bound x";
  $("probe-form").hidden=state.curves.length!==2||picking()||state.dirty;
  $("probe-result").textContent=state.probe;
  $("keypad-hint").textContent=state.dirty&&state.curves.length===2?"Plot both curves to apply your edits.":hints[state.state];
  $("keypad-problem").textContent=$("try-line").textContent=goal();
  if(bound.value!==state.draft)bound.value=state.draft;
  $("answer-form").hidden=!checkerEnabled();
  if(!checkerEnabled())$("feedback").textContent="";
  const invalid=unsafe&&!edited?"This link did not supply a valid problem. Showing the original exercise.":"";
  const latest=state.points.at(-1);
  setMessage(state.error||invalid||(state.state==="result"&&latest?"Intersection: ("+M.pretty(latest.x)+", "+M.pretty(latest.y)+").":""),Boolean(state.error||invalid));
  if(state.state==="menu")jumpMenu(S.PANEL.main,5,()=>press("analysis"));
  if(state.state==="submenu")jumpMenu(S.PANEL.sub,3,()=>press("intersection"));
 }
 function select(next,properties={}){
  state={...state,state:next,error:"",draft:"",...properties};renderTry();
 }
 function syncInputs(){
  inputs.forEach((field,i)=>{if(field.value!==state.raw[i])field.value=state.raw[i];});
  scope.forEach((field,i)=>{if(field.value!==state.settings[i])field.value=state.settings[i];});
 }
 function plotBoth(){
  edited=true;const raw=inputs.map(e=>e.value),settings=scope.map(e=>e.value);
  try{
   const m=model(raw,...settings);state={...create(m.curves.map(q=>q.raw),m.limits,m.op),curves:m.curves,state:"plotted"};
   $("feedback").textContent="";$("solution").value="";syncInputs();
  }catch(e){state={...create(raw,state.preset,state.op),dirty:true,settings,error:e.message};}
  renderTry();
 }
 function plotOne(){
  const i=state.slot;
  if(i===1&&!state.curves[0]){state.error="Plot f₁ first, or use Plot both curves.";renderTry();return;}
  edited=true;
  try{
   const q=M.parse(inputs[i].value,i===0),raw=[...state.raw];raw[i]=q.raw;
   const curves=i&&state.curves[0]?[state.curves[0],q]:[q];
   if(curves.length===2){plotBoth();return;}
   select("plotted",{raw,curves,points:[],excluded:false,probe:""});syncInputs();
  }catch(e){state.error=e.message;renderTry();}
 }
 function beginIntersection(){
  const {x0,x1}=M.graphWindow(state.curves,state.preset);
  if(state.curves.length!==2){state.error="Plot both equations before finding an intersection.";renderTry();return;}
  select("lower",{low:null,high:null,cursor:(x0+x1)/2,excluded:false});
 }
 function confirm(x){
  if(!picking()||state.curves.length!==2)return;
  edited=true;
  if(!Number.isFinite(x)||Math.abs(x)>M.LIMIT){state.error="Type a finite bound between −20 and 20.";renderTry();return;}
  if(state.state==="lower"){select("upper",{low:x,cursor:x});return;}
  try{
   const p=M.rootsIn(state.curves,state.low,x);
   const others=state.points.filter(old=>Math.abs(old.x-p.x)>1e-8);
   select("result",{high:x,cursor:x,points:[...others,p].slice(-8)});
  }catch(e){state.error=e.message;renderTry();}
 }
 function numericDraft(k){
  if(!["del","neg","minus","plus","dot"].includes(k)&&!/^[0-9]$/.test(k))return false;
  if(document.activeElement!==bound)bound.setSelectionRange(bound.value.length,bound.value.length);
  return H.modify(bound,k);
 }
 function press(k){
  if(mode==="try"){clearTimeout(light);shell.setKeys([k]);light=setTimeout(()=>shell.setKeys([]),175);}
  if(mode!=="try")return;const w=state.state;
  if(k==="esc"){edited=true;select(w==="submenu"?"menu":state.curves.length?"plotted":"entry",{low:null,high:null,cursor:null,excluded:false});return;}
  if(k==="menu"&&state.curves.length){edited=true;select("menu",{menuIndex:0,low:null,high:null,cursor:null,excluded:false});return;}
  if(k==="tab"){
   edited=true;
   const slot=w==="entry"?1-state.slot:state.curves.length===1?1:0;
   select("entry",{slot,excluded:false,low:null,high:null});return;
  }
  if(w==="menu"){
   if(k==="up"||k==="down"){select("menu",{menuIndex:(state.menuIndex+(k==="down"?1:S.PANEL.main.rows.length-1))%S.PANEL.main.rows.length});return;}
   if(k==="analysis"||k==="6"||(["enter","right","select"].includes(k)&&state.menuIndex===5))select("submenu",{subIndex:0});return;
  }
  if(w==="submenu"){
   if(k==="left"){select("menu",{menuIndex:5});return;}
   if(k==="up"||k==="down"){select("submenu",{subIndex:(state.subIndex+(k==="down"?1:S.PANEL.sub.rows.length-1))%S.PANEL.sub.rows.length});return;}
   if(k==="intersection"||k==="4"||(["enter","right","select"].includes(k)&&state.subIndex===3))beginIntersection();return;
  }
  if(picking()){
   if(k==="enter"||k==="select"){confirm(state.draft?M.number(state.draft):state.cursor);return;}
   if(k==="left"||k==="right"){
    const {x0,x1}=M.graphWindow(state.curves,state.preset,state.low,state.high),step=(x1-x0)/60;
    edited=true;state.cursor=M.clamp(state.cursor+(k==="left"?-step:step),x0,x1);state.draft="";state.error="";renderTry();return;
   }
   if(numericDraft(k))return;
   return;
  }
  if(k==="enter"){if(w==="entry")plotOne();return;}
  if(H.character(k)!==null||k==="del"){
   edited=true;const field=inputs[state.slot];H.modify(field,k,{replace:w!=="entry"});
  }
 }
 $("expression-form").addEventListener("submit",e=>{e.preventDefault();plotBoth();});
 inputs.forEach((field,i)=>field.addEventListener("input",()=>{
  if(mode!=="try")return;
  edited=true;const raw=inputs.map(f=>f.value),still=state.curves[0]&&i===1?[state.curves[0]]:[];
  state={...create(raw,state.preset,state.op),slot:i,curves:still,settings:scope.map(e=>e.value),dirty:true};
  renderTry();
 }));
 scope.forEach(el=>el.addEventListener("input",()=>{
  edited=true;state={...state,dirty:true,settings:scope.map(o=>o.value)};renderTry();
 }));
 $("probe-form").addEventListener("submit",e=>{
  e.preventDefault();
  const x=M.number($("probe").value);if(state.curves.length!==2)return;
  if(!Number.isFinite(x)||x<state.preset[0]||x>state.preset[1])state.probe="Choose a value inside the problem's domain.";
  else{
   const r=M.compare(state.curves,x),place="At x = "+M.pretty(x)+", ";
   state.probe=place+(r.sign===null?"a function is undefined. Leave this value out.":r.sign===0?"the functions are equal.":r.sign<0?"f₁ is below f₂.":"f₁ is above f₂.");
  }
  renderTry();
 });
 bound.addEventListener("input",()=>{
  if(mode!=="try"||!picking())return;
  edited=true;state.draft=bound.value;state.error="";
  const d=M.number(state.draft);if(Number.isFinite(d)&&Math.abs(d)<=M.LIMIT)state.cursor=d;
  screen.draw(state);graphLabel(state);setMessage("");
 });
 $("bound-form").addEventListener("submit",e=>{e.preventDefault();confirm(state.draft?M.number(state.draft):state.cursor);});
 $("reset-keypad").addEventListener("click",()=>{
  edited=true;state=initial();syncInputs();
  $("answer-form").reset();$("probe").value="";$("feedback").textContent="";renderTry();stage.focus({preventScroll:true});
 });
 function pointer(e){
  const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*320/r.width,y=(e.clientY-r.top)*240/r.height;
  return x>=S.SCREEN_X.l&&x<=S.SCREEN_X.r&&y>=26&&y<=226?S.pointAt(state,x):null;
 }
 lcd.addEventListener("pointermove",e=>{
  if(mode!=="try"||!picking()||state.draft||e.pointerType==="touch")return;
  const x=pointer(e);if(x===null)return;state.cursor=x;screen.draw(state);graphLabel(state);
 });
 lcd.addEventListener("click",e=>{
  if(mode!=="try"||!picking()||e.target.closest("button"))return;
  const x=pointer(e);if(x!==null)confirm(x);
 });
 const tape=T.keys.filter(k=>k.key);
 const watchStates=[create(["",""],watchLimits,"le")];
 let shown=0,count=0;
 for(const ev of tape){
  const {shown:j,count:i,...delta}=ev.delta;shown=j??shown;count=i??count;
  watchStates.push({...watchStates.at(-1),...delta,curves:watchModel.curves.slice(0,shown),points:watchPoints.slice(0,count)});
 }
 function renderWatch(device,{beat,point,crossed,key}){
  if(handheld.parentElement!==device)device.append(handheld);
  const n=crossed.length,lit=n&&!point.speaking&&key?.beat===beat&&(point.fraction-key.at)*(point.span.end-point.span.voiceEnd)<.62;
  shell.setKeys(lit?[tape[n-1].key]:[]);
  const tag=n+"-"+beat;if(stamp===tag)return;stamp=tag;
  const s=beat>=7?{...watchStates[n],excluded:true,low:null,high:null}:watchStates[n];
  screen.draw(s);graphLabel(s);
 }
 function enterTry(device,actions){
  mode="try";returnToWatch=actions.returnToWatch;device.prepend(stage);$("try-deck").prepend(handheld);stage.hidden=false;
  shell.setKeys([]);shell.setInteractive(true);syncInputs();renderTry();stage.focus({preventScroll:true});
 }
 function exitTry(){
  mode="watch";stage.hidden=true;stamp="";clearTimeout(light);hot.replaceChildren();lcd.classList.remove("pick");shell.setKeys([]);shell.setInteractive(false);
 }
 $("return-watch").onclick=()=>returnToWatch?.();
 document.addEventListener("keydown",e=>{
  if(e.target!==document.body&&!e.target.closest?.(".qb-calculator-lesson"))return;
  if(e.metaKey||e.ctrlKey||e.altKey||e.target.closest("input,textarea,select,a,summary,[contenteditable]"))return;
  if(e.defaultPrevented||e.target.closest?.(".top, .tabbar"))return;

  if(mode!=="try"||(!stage.contains(e.target)&&e.target!==document.body)||e.target.closest("button")&&(e.key==="Enter"||e.key===" "))return;
  const keys={Escape:"esc",Enter:"enter",Backspace:"del",Delete:"del",ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down",m:"menu",M:"menu",".":"dot","^":"power","+":"plus","-":"minus","*":"mul","/":"div","(":"lparen",")":"rparen","²":"square"};
  const k=keys[e.key]||(/^[0-9xX]$/.test(e.key)?e.key.toLowerCase():"");
  if(k){e.preventDefault();press(k);}
 });
 $("answer-form").addEventListener("input",()=>{edited=true;$("feedback").textContent="";});
 $("answer-form").addEventListener("submit",e=>{
  e.preventDefault();if(!checkerEnabled())return;edited=true;
  const v=$("feedback");let yes=false;
  try{
   const expected=M.solve(parsePair(...state.raw),...state.preset,state.op).intervals;
   yes=M.grade($("solution").value,expected);
   v.textContent=yes?"Correct. Your intervals include the right points and exclude every undefined value.":"Not quite. Check which curve is above on each interval, and check whether each boundary belongs.";
  }catch(e){v.textContent=e.message;}
  v.className="feedback "+(yes?"is-right":"is-wrong");
 });
 window.CalculatorLessonAdapter=Object.freeze({initialMode:params.get("mode")==="try"||typed?"try":"watch",renderWatch,enterTry,exitTry});
})();
