"use strict";
(function(){
 const $=id=>document.getElementById(id),M=CT54Math,T=CT54Tape,S=CT54Screen,H=HandheldTransport;
 const stage=$("stage"),lcd=$("lcd"),canvas=$("drawing"),screen=S.screen(canvas),expr=$("expression"),bound=$("bound");

 function fitTry(){
  if(mode!=="try")return;
  const h=innerHeight,w=innerWidth,phone=w<=710,host=$("handheld-host");
  if(h>960){stage.style.removeProperty("--retro-try-width");return;}
  const top=Math.max(0,host.getBoundingClientRect().top+window.scrollY);
  const visibleFraction=phone&&h<650?.804:1;
  const width=Math.min(phone?270:305,Math.max(phone?158:126,Math.floor((h-top-10)*558/1168/visibleFraction)));
  stage.style.setProperty("--retro-try-width",width+"px");
 }
 const tryLayout=new ResizeObserver(fitTry);
 tryLayout.observe($("try-player"));
 window.addEventListener("resize",fitTry);
 const params=new URLSearchParams(location.search);
 let challenge={q:M.parse("x-4"),limits:[0,6]},unsafe=false;
 const hasCustom=["expr","lower","upper"].some(k=>params.has(k));
 if(hasCustom)try{
  for(const k of ["expr","lower","upper"])if(params.getAll(k).length>1)throw Error("Repeated input");
  const l=params.has("lower")?M.number(params.get("lower")):0,u=params.has("upper")?M.number(params.get("upper")):6;
  if(!(l>=-M.LIMIT&&u<=M.LIMIT&&u-l>=1e-8))throw Error("Invalid bounds");
  const q=M.parse(params.get("expr")??"x-4");
  challenge={q,limits:[l,u]};
 }catch{unsafe=true;}
 const wd=M.parse("x-3"),watchLimits=[0,4],watchAnswer=M.integrate(wd,0,4);
 const create=(raw,preset)=>({state:"entry",raw,preset,q:null,low:null,high:null,cursor:null,draft:"",result:null,teaching:false,menuIndex:0,subIndex:0,error:""});
 const goal="Find the signed integral and geometric area of f(x) = "+M.displayExpr(challenge.q.raw)+" from "+M.pretty(challenge.limits[0])+" to "+M.pretty(challenge.limits[1])+".";
 $("keypad-problem").textContent=$("try-line").textContent=goal;
 let mode="watch",state=create(challenge.q.raw,challenge.limits),edited=false,cache="",returnToWatch;
 const handheld=$("handheld-host");
 const shell=CalculatorLessonHandset.mount(handheld,{screen:lcd,label:"TI-Nspire CX II-T Graphs",interactive:false,onKey:k=>press(k)});
 const hot=$("hotspots");
 const hints={entry:"Press Enter to plot your function.",plotted:"Press Menu on the handheld.",menu:"Choose 6: Analyze Graph.",submenu:"Choose 6: Integral.",lower:"Type or point to the lower bound, then press Enter.",upper:"Type or point to the upper bound, then press Enter.",result:"The calculator shows the signed integral. To find geometric area, split at each sign change and add magnitudes."};
 function snapshot(time){
  const s=create("",watchLimits);let key="";
  for(const ev of T.keys){if(time<ev.time)break;Object.assign(s,ev.delta);key=time<ev.time+.31?ev.key:"";}
  if(s.state!=="entry")s.q=wd;
  if(s.state==="result")s.result=watchAnswer;
  return {s,key};
 }
 function graphLabel(s){
  const limit=s.low!=null?" Lower: "+M.pretty(s.low)+".":"",draft=s.draft?" Typed "+s.draft+".":"";
  const result=s.result?" Signed integral: "+M.pretty(s.result.total)+".":"";
  const shaded=s.result&&s.teaching?" Below-axis parts are negative; above-axis parts are positive.":"";
  handheld.dataset.scene=s.state;
  $("lcd-text").textContent=(s.q?"Graph of "+M.displayExpr(s.q.raw):"Function entry "+M.displayExpr(s.raw))+". "+hints[s.state]+limit+draft+result+shaded+(s.error?" "+s.error:"");
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
 function checkerEnabled(){
  const samePolynomial=state.q?state.q.p.length===challenge.q.p.length&&state.q.p.every((x,i)=>x===challenge.q.p[i]):state.raw===challenge.q.raw;
  return samePolynomial&&state.preset.every((x,i)=>x===challenge.limits[i]);
 }
 function renderTry(){
  if(mode!=="try")return;
  screen.draw(state);graphLabel(state);hot.replaceChildren();
  lcd.classList.toggle("pick",picking());$("bound-form").hidden=!picking();$("retry-bounds").hidden=!state.result;
  $("bound-label").textContent=state.state==="lower"?"Lower bound x":"Upper bound x";
  $("keypad-hint").textContent=hints[state.state];
  $("color-key").hidden=!(state.result?.pos>0&&state.result.neg<0);
  if(bound.value!==state.draft)bound.value=state.draft;
  const grade=checkerEnabled();$("answer-form").hidden=!grade;$("checker-context").hidden=grade;
  $("checker-context").textContent=grade?"":"Exploration only. Reset calculator to return to the assigned answer check.";
  $("feedback").hidden=!grade;
  $("jump-answer").hidden=!grade;
  const description=grade?goal:"Exploring an edited graph. Reset to return to the assigned exercise.";
  $("keypad-problem").textContent=$("try-line").textContent=description;
  const invalid=unsafe&&!edited?"This link had an invalid function or interval. The original exercise is shown instead.":"";
  setMessage(state.error||invalid||(state.result?"Signed integral: "+M.pretty(state.result.total)+".":""),Boolean(state.error||invalid));
  if(state.state==="menu")jumpMenu(S.PANEL.main,5,()=>press("6"));
  if(state.state==="submenu")jumpMenu(S.PANEL.sub,5,()=>press("6"));
 }
 function select(next,properties={}){
  state={...state,state:next,error:"",draft:"",...properties};renderTry();
 }
 function plot(raw){
  edited=true;
  try{const q=M.parse(raw);state={...create(q.raw,state.preset),q,state:"plotted"};expr.value=q.raw;renderTry();}
  catch(e){state={...create(raw,state.preset),error:e.message};renderTry();}
 }
 function beginIntegral(){
  const {x0,x1}=M.windowFor(state.q,state.preset);
  select("lower",{low:null,high:null,cursor:(x0+x1)/2,result:null,teaching:false});
 }
 function confirm(x){
  if(!picking()||!state.q)return;
  edited=true;
  if(!Number.isFinite(x)||Math.abs(x)>M.LIMIT){state.error="Type a finite bound between −20 and 20.";renderTry();return;}
  if(state.state==="lower"){select("upper",{low:x,cursor:x});return;}
  try{const r=M.integrate(state.q,state.low,x);select("result",{high:x,cursor:x,result:r,teaching:true});}
  catch(e){state.error=e.message;renderTry();}
 }
 function numericDraft(k){
  if(!["del","neg","minus","plus","dot"].includes(k)&&!/^[0-9]$/.test(k))return false;
  if(document.activeElement!==bound)bound.setSelectionRange(bound.value.length,bound.value.length);
  return H.modify(bound,k);
 }
 function press(k){
  if(mode!=="try")return;const w=state.state;
  if(k==="esc"){edited=true;state.q?select(w==="submenu"?"menu":"plotted",{low:null,high:null,result:null,cursor:null,teaching:false}):select("entry");return;}
  if(k==="menu"&&state.q){edited=true;select("menu",{menuIndex:0,low:null,high:null,result:null,cursor:null});return;}
  if(k==="tab"){edited=true;select("entry",{q:null,raw:expr.value,low:null,high:null,result:null,cursor:null});return;}
  if(w==="menu"){
   if(k==="up"||k==="down"){select("menu",{menuIndex:(state.menuIndex+(k==="down"?1:S.PANEL.main.rows.length-1))%S.PANEL.main.rows.length});return;}
   if(k==="6"||(["enter","right","select"].includes(k)&&state.menuIndex===5))select("submenu",{subIndex:0});return;
  }
  if(w==="submenu"){
   if(k==="left"){select("menu",{menuIndex:5});return;}
   if(k==="up"||k==="down"){select("submenu",{subIndex:(state.subIndex+(k==="down"?1:S.PANEL.sub.rows.length-1))%S.PANEL.sub.rows.length});return;}
   if(k==="6"||(["enter","right","select"].includes(k)&&state.subIndex===5))beginIntegral();return;
  }
  if(picking()){
   if(k==="enter"||k==="select"){confirm(state.draft?M.number(state.draft):state.cursor);return;}
   if(k==="left"||k==="right"){
    const {x0,x1}=M.windowFor(state.q,state.preset,state.low,state.high),step=(x1-x0)/60;
    edited=true;state.cursor=M.clamp(state.cursor+(k==="left"?-step:step),x0,x1);state.draft="";state.error="";renderTry();return;
   }
   if(numericDraft(k))return;
   return;
  }
  if(k==="enter"){plot(expr.value);return;}
  if(H.character(k)!==null||k==="del"){edited=true;H.modify(expr,k,{replace:w!=="entry"});}
 }
 $("expression-form").addEventListener("submit",e=>{e.preventDefault();plot(expr.value);});
 expr.addEventListener("input",()=>{if(mode==="try"){edited=true;state=create(expr.value,state.preset);renderTry();}});
 bound.addEventListener("input",()=>{
  if(mode!=="try"||!picking())return;
  edited=true;state.draft=bound.value;state.error="";
  const d=M.number(state.draft);if(Number.isFinite(d)&&Math.abs(d)<=M.LIMIT)state.cursor=d;
  screen.draw(state);graphLabel(state);setMessage("");
 });
 $("bound-form").addEventListener("submit",e=>{e.preventDefault();confirm(state.draft?M.number(state.draft):state.cursor);});
 $("retry-bounds").addEventListener("click",()=>{edited=true;beginIntegral();});
 $("reset-keypad").addEventListener("click",()=>{
  edited=true;state=create(challenge.q.raw,challenge.limits);expr.value=state.raw;
  $("answer-form").reset();$("feedback").textContent="";
  renderTry();stage.focus({preventScroll:true});
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
 function enterTry(device,actions){
  mode="try";returnToWatch=actions.returnToWatch;
  device.prepend(stage);$("try-grid").prepend(handheld);stage.hidden=false;
  expr.value=state.raw;renderTry();fitTry();
  shell.setKeys([]);shell.setInteractive(true);stage.focus({preventScroll:true});
 }
 function exitTry(){
  mode="watch";stage.hidden=true;cache="";
  hot.replaceChildren();lcd.classList.remove("pick");shell.setKeys([]);shell.setInteractive(false);
 }
  $("jump-input").addEventListener("click",()=>expr.focus());
 $("jump-answer").addEventListener("click",()=>$("signed-answer").focus());
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
  const entered=[$("signed-answer").valueAsNumber,$("area-answer").valueAsNumber],r=M.integrate(challenge.q,...challenge.limits),expected=[r.total,r.area];
  const matches=(v,x)=>x===0?v===0:[x,...Array.from({length:10},(_,i)=>Number(x.toPrecision(i+3)))].some(y=>Math.abs(v-y)<=1e-10*Math.abs(y));
  const verdict=entered.map((v,i)=>matches(v,expected[i])),yes=verdict.every(Boolean),v=$("feedback");
  v.className="feedback "+(yes?"is-right":"is-wrong");
  v.textContent=yes?"Both are correct. The integral keeps the signs; geometric area adds magnitudes.":verdict[0]?"Signed integral correct. For geometric area, add the magnitudes of the pieces.":verdict[1]?"Geometric area correct. For the integral, keep negative pieces negative.":"Check both bounds and whether you should keep the signs.";
 });
 window.CalculatorLessonAdapter=Object.freeze({
  initialMode:params.get("mode")==="try"?"try":"watch",
  renderWatch,enterTry,exitTry
 });
})();
