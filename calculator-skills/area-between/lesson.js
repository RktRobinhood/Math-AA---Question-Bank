"use strict";
(function(){
 const $=id=>document.getElementById(id),M=CT55Math,T=CT55Tape,S=CT55Screen,H=HandheldTransport;
 const stage=$("stage"),lcd=$("lcd"),canvas=$("drawing"),screen=S.screen(canvas),inputs=[$("curve-f"),$("curve-g")],bound=$("bound");
 const params=new URLSearchParams(location.search),names=["f","g","lower","upper"];
 let challenge={curves:[M.parse("x^2+1"),M.parse("5")],limits:[0,3]},unsafe="";
 const hasCustom=names.some(k=>params.has(k));
 if(hasCustom)try{
  if(names.some(k=>params.getAll(k).length!==1))throw Error("Incomplete or repeated inputs");
  const [l,u]=[M.number(params.get("lower")),M.number(params.get("upper"))];
  if(!(l>=-M.LIMIT&&u<=M.LIMIT&&u-l>=1e-8))throw Error("Invalid bounds");
  const curves=[M.parse(params.get("f")),M.parse(params.get("g"))];
  M.between(...curves,l,u); // Do not offer an assigned checker for an unresolved linked task.
  challenge={curves,limits:[l,u]};
 }catch(e){unsafe=e.code==="CT55_PRECISION"?e.message+" The original exercise is shown.":"This link had incomplete or invalid curves or bounds. The original exercise is shown.";}
 const watchCurves=[M.parse("x+1"),M.parse("3")],watchLimits=[0,5];
 const region=(curves,left,right)=>({left,right,area:M.between(...curves,left,right).area});
 const watchRegions=[region(watchCurves,0,2),region(watchCurves,2,5)];
 const create=(raw,preset)=>({state:"entry",raw:[...raw],slot:0,preset,curves:[],low:null,high:null,cursor:null,draft:"",regions:[],markCross:false,menuIndex:0,subIndex:0,error:""});
 const initial=()=>create(challenge.curves.map(c=>c.raw),challenge.limits);
 const goal="Find the area between f₁(x) = "+M.displayExpr(challenge.curves[0].raw)+" and f₂(x) = "+M.displayExpr(challenge.curves[1].raw)+" from "+M.pretty(challenge.limits[0])+" to "+M.pretty(challenge.limits[1])+".";
 const answer=$("area-answer"),feedback=$("feedback");
 let mode="watch",state=initial(),edited=false,cache="",returnToWatch;
 const handheld=$("handheld-host");
 const shell=CalculatorLessonHandset.mount(handheld,{screen:lcd,label:"TI-Nspire CX II-T Graphs",interactive:false,onKey:k=>press(k)});
 const hot=$("hotspots");
 const hints={
  entry:"Enter both functions to plot them.",plotted:"Open Menu. Choose Analyze Graph, then Bounded Area.",
  menu:"Choose Analyze Graph.",submenu:"Choose Bounded Area by name.",
  lower:"Type or point to the lower bound, then press Enter.",upper:"Type or point to the upper bound, then press Enter.",
  result:"Record this area. If there is another region, measure it separately, then add."
 };
 function snapshot(time){
  const s=create(["",""],watchLimits);let key="",shown=0,count=0;
  for(const ev of T.keys){
   if(time<ev.time)break;
   const {shown:n,count:r,...delta}=ev.delta;
   Object.assign(s,delta);
   if(n!==undefined)shown=n;if(r!==undefined)count=r;
   key=time<ev.time+.26?ev.key:"";
  }
  s.curves=watchCurves.slice(0,shown);s.regions=watchRegions.slice(0,count);
  return {s,key};
 }
 function graphLabel(s){
  const limit=s.low!=null?" Lower: "+M.pretty(s.low)+".":"",draft=s.draft?" Typed "+s.draft+".":"";
  const results=s.regions.map(p=>" Area from "+M.pretty(p.left)+" to "+M.pretty(p.right)+": "+M.pretty(p.area)+".").join("");
  const prior=s.markCross?" Lesson marker: the curves cross at x equals 2.":"";
  const menu=s.state==="menu"?" Selected: "+S.PANEL.main.rows[s.menuIndex]+".":s.state==="submenu"?" Selected: "+S.PANEL.sub.rows[s.subIndex]+".":"";
  handheld.dataset.scene=s.state;
  $("lcd-text").textContent=(s.state==="entry"?"Function "+(s.slot+1)+" entry "+M.displayExpr(s.raw[s.slot]):s.curves.map((q,i)=>"Graph "+(i+1)+": "+M.displayExpr(q.raw)).join("; "))+". "+hints[s.state]+menu+limit+draft+results+prior+(s.error?" "+s.error:"");
 }
 // Passive annotations belong to their original visual cue, not to the rail.
 const physicalTape=T.keys.filter(event=>event.key);
 const passiveTape=T.keys.filter(event=>!event.key);
 function renderWatch(device,{beat,point,crossed,key}){
  if(handheld.parentElement!==device)device.append(handheld);
  const count=crossed.length,press=physicalTape[count-1],hold=point.span.end-point.span.voiceEnd;
  const lit=press&&!point.speaking&&key?.beat===beat&&(point.fraction-key.at)*hold<.65;
  shell.setKeys(lit?[press.key]:[]);
  const stamp=beat+":"+count;
  if(stamp===cache)return;cache=stamp;
  const passive=passiveTape.findLast(event=>event.time<=T.captionStarts[beat]);
  const {s}=snapshot(Math.max(0,press?.time??0,passive?.time??0));
  screen.draw(s);graphLabel(s);
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
 const same=(r,p)=>r.length===p.length&&r.every((x,i)=>x===p[i]);
 function checkerEnabled(){
  try{return state.raw.every((raw,i)=>same(M.parse(raw).p,challenge.curves[i].p))&&same(state.preset,challenge.limits);}
  catch{return false;}
 }
 function renderTry(){
  if(mode!=="try")return;
  screen.draw(state);graphLabel(state);hot.replaceChildren();
  lcd.classList.toggle("pick",picking());$("bound-form").hidden=!picking();$("retry-bounds").hidden=state.state!=="result";
  $("bound-label").textContent=state.state==="lower"?"Lower bound x":"Upper bound x";
  $("keypad-hint").textContent=hints[state.state];
  if(bound.value!==state.draft)bound.value=state.draft;
  const grade=checkerEnabled();$("answer-form").hidden=!grade;$("checker-context").hidden=grade;
  $("keypad-problem").textContent=$("try-line").textContent=goal;
  $("checker-context").textContent=grade?"":"Exploration only. Reset calculator to return to the assigned answer check.";
  if(!grade)$("feedback").textContent="";
  const invalid=edited?"":unsafe;
  const latest=state.regions.at(-1);
  setMessage(state.error||invalid||(state.state==="result"&&latest?"Area from "+M.pretty(latest.left)+" to "+M.pretty(latest.right)+": "+M.pretty(latest.area)+" square units.":""),Boolean(state.error||invalid));
  if(state.state==="menu")jumpMenu(S.PANEL.main,5,()=>press("analysis"));
  if(state.state==="submenu")jumpMenu(S.PANEL.sub,6,()=>press("bounded"));
 }
 function select(next,properties={}){
  state={...state,state:next,error:"",draft:"",...properties};renderTry();
 }
 function syncInputs(){inputs.forEach((field,i)=>{if(field.value!==state.raw[i])field.value=state.raw[i];});}
 function plotBoth(){
  edited=true;
  const raw=inputs.map(e=>e.value);
  try{const curves=raw.map(e=>M.parse(e));state={...create(curves.map(q=>q.raw),state.preset),curves,state:"plotted"};syncInputs();}
  catch(e){state={...create(raw,state.preset),error:e.message};}
  renderTry();
 }
 function plotOne(){
  const i=state.slot;
  edited=true;
  try{
   const q=M.parse(inputs[i].value),raw=[...state.raw];raw[i]=q.raw;
   const curves=i&&state.curves[0]?[state.curves[0],q]:[q];
   select("plotted",{raw,curves,regions:[],markCross:false});syncInputs();
  }catch(e){state.error=e.message;renderTry();}
 }
 function beginArea(){
  const {x0,x1}=M.windowFor(state.curves,state.preset);
  if(state.curves.length!==2){state.error="Plot two curves before measuring the area between them.";renderTry();return;}
  select("lower",{low:null,high:null,cursor:(x0+x1)/2,markCross:false});
 }
 function confirm(x){
  if(!picking()||state.curves.length!==2)return;
  edited=true;
  if(!Number.isFinite(x)||Math.abs(x)>M.LIMIT){state.error="Type a finite bound between −20 and 20.";renderTry();return;}
  if(state.state==="lower"){select("upper",{low:x,cursor:x});return;}
  try{
   const result=M.between(...state.curves,state.low,x);
   if(result.crossings.length)throw Error("The upper curve changes in this interval. In this practice viewer, split at the crossing and measure one region at a time.");
   const p={left:state.low,right:x,area:result.area};
   const others=state.regions.filter(old=>old.left!==p.left||old.right!==p.right);
   select("result",{high:x,cursor:x,regions:[...others,p].slice(-8)});
  }catch(e){state.error=e.message;renderTry();}
 }
 function numericDraft(k){
  if(!["del","neg","minus","plus","dot"].includes(k)&&!/^[0-9]$/.test(k))return false;
  if(document.activeElement!==bound)bound.setSelectionRange(bound.value.length,bound.value.length);
  return H.modify(bound,k);
 }
 function press(k){
  if(mode!=="try")return;const w=state.state;
  if(k==="esc"){edited=true;select(w==="submenu"?"menu":state.curves.length?"plotted":"entry",{low:null,high:null,cursor:null,markCross:false});return;}
  if(k==="menu"&&state.curves.length){edited=true;select("menu",{menuIndex:0,low:null,high:null,cursor:null,markCross:false});return;}
  if(k==="tab"){
   edited=true;
   const slot=w==="entry"?1-state.slot:state.curves.length===1?1:0;
   select("entry",{slot,markCross:false,low:null,high:null});return;
  }
  if(w==="menu"){
   if(k==="up"||k==="down"){select("menu",{menuIndex:(state.menuIndex+(k==="down"?1:S.PANEL.main.rows.length-1))%S.PANEL.main.rows.length});return;}
   if(k==="analysis"||k==="6"||(["enter","right","select"].includes(k)&&state.menuIndex===5))select("submenu",{subIndex:0});return;
  }
  if(w==="submenu"){
   if(k==="left"){select("menu",{menuIndex:5});return;}
   if(k==="up"||k==="down"){select("submenu",{subIndex:(state.subIndex+(k==="down"?1:S.PANEL.sub.rows.length-1))%S.PANEL.sub.rows.length});return;}
   if(k==="bounded"||(["enter","right","select"].includes(k)&&state.subIndex===6))beginArea();return;
  }
  if(picking()){
   if(k==="enter"||k==="select"){confirm(state.draft?M.number(state.draft):state.cursor);return;}
   if(k==="left"||k==="right"){
    const {x0,x1}=M.windowFor(state.curves,state.preset,state.low,state.high),step=(x1-x0)/60;
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
  state={...create(raw,state.preset),slot:i,curves:still};
  // On the second line the first plotted curve stays visible while typing.
  renderTry();
 }));
 bound.addEventListener("input",()=>{
  if(mode!=="try"||!picking())return;
  edited=true;state.draft=bound.value;state.error="";
  const d=M.number(state.draft);if(Number.isFinite(d)&&Math.abs(d)<=M.LIMIT)state.cursor=d;
  screen.draw(state);graphLabel(state);setMessage("");
 });
 $("bound-form").addEventListener("submit",e=>{e.preventDefault();confirm(state.draft?M.number(state.draft):state.cursor);});
 $("retry-bounds").addEventListener("click",()=>{edited=true;beginArea();});
 $("reset-keypad").addEventListener("click",()=>{
  edited=true;state=initial();$("answer-form").reset();feedback.textContent="";
  syncInputs();renderTry();stage.focus({preventScroll:true});
 });
 function pointer(e){
  const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*320/r.width,y=(e.clientY-r.top)*240/r.height;
  if(!(x>=S.SCREEN_X.l&&x<=S.SCREEN_X.r&&y>=26&&y<=226))return null;
  const raw=S.pointAt(state,x),{x0,x1,y0,y1}=M.windowFor(state.curves,state.preset,state.low,state.high);
  const deltaX=Math.min(7,Math.max(2,3*320/r.width))*(x1-x0)/300;
  const deltaY=Math.min(11,4*240/r.height)*(y1-y0)/200;
  const yCoord=y1-(y-26)*(y1-y0)/200;
  let crossings;
  try{crossings=M.between(...state.curves,x0,x1).crossings;}
  catch(e){if(e.code==="CT55_PRECISION")return raw;throw e;}
  const nearby=crossings.filter(z=>Math.abs(z-raw)<=deltaX&&Math.abs(state.curves[0].f(z)-yCoord)<=deltaY);
  return nearby.sort((a,b)=>Math.abs(a-raw)-Math.abs(b-raw))[0]??raw;
 }
 lcd.addEventListener("pointermove",e=>{
  if(mode!=="try"||!picking()||state.draft||e.pointerType==="touch")return;
  const x=pointer(e);if(x===null)return;state.cursor=x;screen.draw(state);graphLabel(state);
 });
 lcd.addEventListener("click",e=>{
  if(mode!=="try"||!picking()||e.target.closest("button"))return;
  const x=pointer(e);if(x!==null)confirm(x);
 });
 function enterTry(device,actions){
  mode="try";returnToWatch=actions.returnToWatch;
  device.prepend(stage);$("try-grid").prepend(handheld);stage.hidden=false;
  syncInputs();renderTry();
  shell.setKeys([]);shell.setInteractive(true);stage.focus({preventScroll:true});
 }
 function exitTry(){
  mode="watch";stage.hidden=true;cache="";
  hot.replaceChildren();lcd.classList.remove("pick");shell.setKeys([]);shell.setInteractive(false);
 }
  $("return-watch").addEventListener("click",()=>returnToWatch?.());
 document.addEventListener("keydown",e=>{
  if(mode!=="try"||e.defaultPrevented||e.isComposing||e.target.closest?.(".top, .tabbar"))return;
  if(e.metaKey||e.ctrlKey||e.altKey||e.target.closest("input,textarea,select,a,summary,[contenteditable]"))return;
  if((!stage.contains(e.target)&&e.target!==document.body)||e.target.closest("button")&&(e.key==="Enter"||e.key===" "))return;
  const keys={Escape:"esc",Enter:"enter",Backspace:"del",Delete:"del",ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down",m:"menu",M:"menu",".":"dot","^":"power","+":"plus","-":"minus","*":"mul","/":"div","(":"lparen",")":"rparen","²":"square"};
  const k=keys[e.key]||(/^[0-9xX]$/.test(e.key)?e.key.toLowerCase():"");
  if(k){e.preventDefault();press(k);}
 });
 $("answer-form").addEventListener("input",()=>{edited=true;$("feedback").textContent="";});
 $("answer-form").addEventListener("submit",e=>{
  e.preventDefault();if(!checkerEnabled())return;edited=true;
  const entered=answer.valueAsNumber;
  let expected;
  try{expected=M.between(...challenge.curves,...challenge.limits).area;}
  catch(e){feedback.className="feedback is-wrong";feedback.textContent=e.message;return;}
  const correct=expected===0?entered===0:[expected,...Array.from({length:10},(_,i)=>Number(expected.toPrecision(i+3)))].some(y=>Math.abs(entered-y)<=1e-10*Math.abs(y));
  const v=$("feedback");v.className="feedback "+(correct?"is-right":"is-wrong");
  v.textContent=correct?"Correct. You found the total area between the curves.":"Not quite. Check the original bounds and add the area of every region.";
 });
 window.CalculatorLessonAdapter=Object.freeze({
  initialMode:params.get("mode")==="try"?"try":"watch",
  renderWatch,enterTry,exitTry
 });
})();
