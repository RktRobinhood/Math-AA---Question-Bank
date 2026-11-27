"use strict";
(function(){
 const $=id=>document.getElementById(id),M=CT08Math,S=CT08Screen,T=CT08Tape,H=HandheldTransport;
 const canvas=$("drawing"),handheld=$("handheld-host");
 const stage=$("stage"),lcd=$("lcd"),screen=S.screen($("drawing")),expr=$("expression"),settings=$("settings"),hot=$("hotspots");
 const params=new URLSearchParams(location.search),seedTry="(x-15)^2+2",watchQ=M.parse("(x-12)^2+3");
 const create=raw=>({state:"entry",raw,q:null,bounds:{...M.standard},values:M.rawBounds(M.standard),field:0,menuIndex:3,subIndex:0,reframed:false,error:"",bad:null});
 let linked=null,unsafe=false;
 if(params.has("expr")){
  try{
   if(params.getAll("expr").length!==1 || params.get("expr").length>80)throw Error("Invalid link");
   linked=M.parse(params.get("expr"));
  }catch{unsafe=true;}
 }
 const challenge=linked||M.parse(seedTry);
 const tryProblem=linked
  ?"Plot f(x) = "+M.displayExpr(challenge.raw)+". Set a window that shows the turn and both arms. Record the coordinates of the turning point."
  :"A different ramp has height h(x) = "+M.displayExpr(challenge.raw)+" metres, where x is the distance in metres from a marker (0 ≤ x ≤ 24). Choose a window that shows the turn. How far from the marker is the lowest point, and how high is it?";
 $("try-line").textContent=$("keypad-problem").textContent=tryProblem;
 if(linked){$("answer-x-label").textContent="x-coordinate";$("answer-y-label").textContent="y-coordinate";}
 let state=create(challenge.raw),mode="watch",edited=false,replaceActive=true;
 let cache="", returnToWatch;
 const shell=CalculatorLessonHandset.mount(handheld,{screen:lcd,label:"TI-Nspire CX II-T Graphs",interactive:false,onKey:press});
 const hints={entry:"Press Enter to plot the function.",plotted:"Open Menu → Window/Zoom → Window Settings.",menu:"Choose 4: Window/Zoom.",submenu:"Choose 1: Window Settings.",settings:"Change the minimum and maximum on each axis. Leave the tick spacing on Auto if you don’t need to change it."};
 const controls=M.names.map((name,i)=>{
  const wrap=document.createElement("label"),label=document.createElement("span"),input=document.createElement("input");
  input.id="window-"+name;input.type="text";input.inputMode=i===2||i===5?"text":"decimal";input.maxLength=30;input.spellcheck=false;input.autocomplete="off";input.setAttribute("aria-label",name);
  label.textContent=name;wrap.append(label,input);$("window-fields").append(wrap);
  input.addEventListener("focus",()=>{if(mode!=="try")return;state.field=i;replaceActive=false;input.select();markField();});
  input.addEventListener("input",()=>{if(mode!=="try"||state.state!=="settings")return;state.values[i]=input.value;state.field=i;state.error="";state.bad=null;input.removeAttribute("aria-invalid");edited=true;replaceActive=false;show("");markField();});
  return input;
 });
 const stops=[...controls,$("apply"),$("cancel")];
 stops.slice(6).forEach((b,i)=>b.addEventListener("focus",()=>{if(mode==="try"){state.field=6+i;markField();}}));
 function markField(index=state.field){stops.forEach((e,i)=>e.dataset.active=String(index===i));}
 function show(msg="",wrong=false){
  const v=$("keypad-result");v.hidden=!msg;v.textContent=msg;v.className="feedback "+(wrong?"is-wrong":"is-right");
 }
 function snapshot(n){
  const s=create("");
  for(let i=0;i<n;i++)Object.assign(s,T.keys[i].delta);
  if(s.state!=="entry")s.q=watchQ;
  return s;
 }
 function formatLimits(w){return "x: "+M.pretty(w.x0)+" to "+M.pretty(w.x1)+" · y: "+M.pretty(w.y0)+" to "+M.pretty(w.y1);}
 function label(s){
  const status=s.state==="settings"?"Window Settings. Active: "+(M.names[s.field]||["OK","Cancel"][s.field-6])+".":hints[s.state];
  $("lcd-text").textContent=(s.q?"Graph of "+M.displayExpr(s.q.raw)+". "+formatLimits(s.bounds)+". ":"Function entry "+M.displayExpr(s.raw)+". ")+status;
 }
 function syncSettings(s,watch){
  settings.hidden=s.state!=="settings";
  if(settings.hidden)return;
  controls.forEach((el,i)=>{
   if(el.value!==s.values[i])el.value=s.values[i];
   el.readOnly=watch;el.tabIndex=watch?-1:0;
   if(s.bad===i)el.setAttribute("aria-invalid","true");else el.removeAttribute("aria-invalid");
  });
  stops.slice(6).forEach(el=>{el.disabled=watch;});
  markField(s.field);
 }
 function render(s,watch){stage.dataset.step=s.state;screen.draw(s);label(s);syncSettings(s,watch);}
 function renderWatch(device,{beat,point,crossed,key}){
  if(handheld.parentElement!==device)device.append(handheld);
  hot.replaceChildren();
  const last=key?.beat===beat&&T.keys[crossed.length-1]?.key;
  const hold=point.span.end-point.span.voiceEnd;
  shell.setKeys(last&&!point.speaking&&(point.fraction-key.at)*hold<.75?[last]:[]);
  const sig=beat+":"+crossed.length;
  if(sig===cache)return;cache=sig;render(snapshot(crossed.length),true);
 }
 function jumpMenu(panel,index,action){
  const b=document.createElement("button");
  b.type="button";b.setAttribute("aria-label",panel.rows[index]);b.style.left=panel.x/3.2+"%";
  b.style.top=(panel.y+2+index*panel.h)/2.4+"%";b.style.width=panel.w/3.2+"%";b.style.height=panel.h/2.4+"%";
  b.addEventListener("click",action);hot.append(b);
 }
 function renderTry(){
  if(mode!=="try")return;
  render(state,false);hot.replaceChildren();
  $("check-window").hidden=!state.q||state.state!=="plotted";
  $("vertex-answer").hidden=!state.q?.a||state.state!=="plotted";
  $("vertex-feedback").textContent="";
  $("keypad-hint").textContent=hints[state.state];
  const suffix=unsafe&&!edited?"The linked expression was invalid. The original practice function is loaded.":"";
  show(state.error||suffix,Boolean(state.error||suffix));
  if(state.state==="menu")jumpMenu(S.PANEL.main,3,()=>press("4"));
  if(state.state==="submenu"){jumpMenu(S.PANEL.sub,0,()=>press("1"));jumpMenu(S.PANEL.sub,4,()=>press("5"));}
 }
 function transition(next,properties={}){
  if(next!=="plotted")stopPan();
  state={...state,state:next,error:"",bad:null,...properties};renderTry();
 }
 function plot(raw){
  edited=true;
  try{
   const q=M.parse(raw);transition("plotted",{raw:q.raw,q,reframed:false});expr.value=q.raw;
  }catch(e){transition("entry",{raw,q:null,error:e.message});}
 }
 function selectField(i){
  state.field=(i+stops.length)%stops.length;replaceActive=true;markField();label(state);
 }
 function commit(){
  const v=M.apply(state.values);
  if(!v.bounds){state.error=v.error;state.bad=v.field;selectField(v.field);renderTry();return;}
  edited=true;transition("plotted",{bounds:v.bounds,values:M.rawBounds(v.bounds),reframed:true});
 }
 function startSettings(){replaceActive=true;transition("settings",{values:M.rawBounds(state.bounds),field:0});}
 function cancel(){transition("plotted",{values:M.rawBounds(state.bounds)});}
 function handheldEdit(k){
  const field=controls[state.field];if(!field)return;
  if(k==="left"||k==="right"){
   const n=field.selectionEnd+(k==="left"?-1:1);field.setSelectionRange(Math.max(0,n),Math.max(0,n));replaceActive=false;return;
  }
  if(k==="del"||/^[0-9.]$/.test(k)||["neg","minus","plus","dot","div","a","u","t","o"].includes(k)){
   if(replaceActive)field.setSelectionRange(0,field.value.length);
   if(H.modify(field,k))replaceActive=false;
  }
 }
 function press(k){
  if(mode!=="try")return;const w=state.state;
  if(w==="settings"){
   if(k==="esc"){cancel();return;}
   if(k==="tab"||k==="down"){selectField(state.field+1);return;}
   if(k==="up"){selectField(state.field-1);return;}
   if(k==="menu")return;
   if(k==="enter"||k==="select"){if(state.field===7)cancel();else commit();return;}
   handheldEdit(k);return;
  }
  if(k==="esc"){if(w==="submenu")transition("menu");else if(state.q)transition("plotted");else transition("entry");return;}
  if(k==="menu"&&state.q){edited=true;transition("menu",{menuIndex:3});return;}
  if(w==="menu"){
   if(k==="up"||k==="down"){transition("menu",{menuIndex:(state.menuIndex+(k==="down"?1:7))%8});return;}
   if(k==="4"||(["enter","select","right"].includes(k)&&state.menuIndex===3)){transition("submenu",{menuIndex:3,subIndex:0});return;}
   return;
  }
  if(w==="submenu"){
   if(k==="left"){transition("menu");return;}
   if(k==="up"||k==="down"){transition("submenu",{subIndex:(state.subIndex+(k==="down"?1:11))%12});return;}
   if(k==="1"||(["enter","select","right"].includes(k)&&state.subIndex===0)){startSettings();return;}
   if(k==="5"||(["enter","select","right"].includes(k)&&state.subIndex===4)){transition("plotted",{bounds:{...M.standard},reframed:false});return;}
   return;
  }
  if(k==="tab"){transition("entry",{raw:expr.value});return;}
  if(k==="enter"){plot(expr.value);return;}
  if(H.character(k)!==null||k==="del"){if(H.modify(expr,k,{replace:w!=="entry"}))edited=true;}
 }
 $("expression-form").addEventListener("submit",e=>{e.preventDefault();plot(expr.value);});
 expr.addEventListener("input",()=>{if(mode==="try"){edited=true;transition("entry",{raw:expr.value,q:null,reframed:false});}});
 settings.addEventListener("submit",e=>{e.preventDefault();if(mode==="try")commit();});
 settings.addEventListener("keydown",e=>{if(mode==="try"&&e.key==="Escape"){e.preventDefault();e.stopPropagation();cancel();stage.focus();}});
 $("cancel").addEventListener("click",cancel);
 $("check-window").addEventListener("click",()=>{const result=M.assess(state.q,state.bounds);show(result.message,!result.good);});
 $("vertex-answer").addEventListener("submit",e=>{
  e.preventDefault();
  if(!state.q?.a)return;
  const dx=M.readValue($("answer-x").value,false),dy=M.readValue($("answer-y").value,false);
  const out=$("vertex-feedback");
  if(!Number.isFinite(dx)||!Number.isFinite(dy)){out.textContent="Enter two numbers.";return;}
  if(!M.assess(state.q,state.bounds).good){out.textContent="First bring the vertex and both arms into view.";return;}
  const close=(a,b)=>Math.abs(a-b)<=Math.max(.0005,Math.abs(b)*.0005);
  if(!close(dx,state.q.x)||!close(dy,state.q.y)){out.textContent="Not yet. Read the x-coordinate first, then the y-coordinate at the turn.";return;}
  if(!["a","b","c"].every(k=>state.q[k]===challenge[k])){
   out.textContent="Correct for the function you plotted. To finish the task, plot the function in the question.";return;
  }
  out.textContent=linked?"Correct. That is the turning point.":
   "Correct. The lowest point is 15 m from the marker and 2 m high. The new window does not change the ramp’s 0 to 24 m domain.";
 });
 for(const id of ["answer-x","answer-y"])$(id).addEventListener("input",()=>$("vertex-feedback").textContent="");
 $("reset-keypad").addEventListener("click",()=>{stopPan();edited=true;state=create(challenge.raw);expr.value=state.raw;$("vertex-answer").reset();renderTry();stage.focus({preventScroll:true});});
 let drag=null;
 function stopPan(){
  if(!drag)return;
  const id=drag.id;drag=null;stage.dataset.panning="false";
  if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);
 }
 canvas.addEventListener("pointerdown",e=>{
  if(mode!=="try"||state.state!=="plotted"||!e.isPrimary||e.button!==0)return;
  const rect=canvas.getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width*320,y=(e.clientY-rect.top)/rect.height*240;
  if(x<S.SCREEN_X.l||x>S.SCREEN_X.r||y<28||y>217)return;
  drag={id:e.pointerId,x:e.clientX,y:e.clientY,base:{...state.bounds},
   width:rect.width*(S.SCREEN_X.r-S.SCREEN_X.l)/320,height:rect.height*189/240};
  canvas.setPointerCapture(e.pointerId);stage.dataset.panning="true";
 });
 canvas.addEventListener("pointermove",e=>{
  if(!drag||e.pointerId!==drag.id||mode!=="try"||state.state!=="plotted")return;
  const {base,width,height}=drag;
  const dx=M.clamp((drag.x-e.clientX)/width*(base.x1-base.x0),-1e9-base.x0,1e9-base.x1);
  const dy=M.clamp((e.clientY-drag.y)/height*(base.y1-base.y0),-1e9-base.y0,1e9-base.y1);
  const bounds={...base,x0:base.x0+dx,x1:base.x1+dx,y0:base.y0+dy,y1:base.y1+dy};
  if(["x0","x1","y0","y1"].every(k=>bounds[k]===state.bounds[k]))return;
  edited=true;state.bounds=bounds;state.values=M.rawBounds(bounds);state.error="";
  renderTry();
 });
 for(const type of ["pointerup","pointercancel","lostpointercapture"])
  canvas.addEventListener(type,e=>{if(drag&&e.pointerId===drag.id)stopPan();});
 function enterTry(device,actions){
  mode="try";returnToWatch=actions.returnToWatch;
  expr.value=state.raw;device.prepend(stage);$("workspace").prepend(handheld);stage.hidden=false;
  shell.setKeys([]);shell.setInteractive(true);renderTry();stage.focus({preventScroll:true});
 }
 function exitTry(){
  stopPan();mode="watch";cache="";stage.hidden=true;shell.setKeys([]);shell.setInteractive(false);
 }
 $("return-watch").addEventListener("click",()=>returnToWatch?.());
 document.addEventListener("keydown",e=>{
  if(mode!=="try"||e.defaultPrevented||e.metaKey||e.ctrlKey||e.altKey||e.target.closest("input,textarea,select,a,summary,[contenteditable]"))return;
  if((!stage.contains(e.target)&&e.target!==document.body)||e.target.closest("button")&&(e.key==="Enter"||e.key===" "))return;
  if(e.key==="Tab"&&state.state==="settings"&&e.target===stage){e.preventDefault();selectField(state.field+(e.shiftKey?-1:1));return;}
  const keys={Escape:"esc",Enter:"enter",Backspace:"del",Delete:"del",ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down",m:"menu",M:"menu",".":"dot","^":"power","+":"plus","-":"minus","*":"mul","/":"div","(":"lparen",")":"rparen","²":"square"};
  const k=keys[e.key]||(/^[0-9xXaAuUtToO]$/.test(e.key)?e.key.toLowerCase():"");
  if(k){e.preventDefault();press(k);}
 });
 window.CalculatorLessonAdapter=Object.freeze({initialMode:params.get("mode")==="try"||linked?"try":"watch",renderWatch,enterTry,exitTry});
})();
