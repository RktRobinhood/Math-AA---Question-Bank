"use strict";
(function(){
 const $=id=>document.getElementById(id), M=CT42Math;
 const panel=$("try"), host=$("try-host"), dock=host.parentElement, tryLcd=$("try-lcd"), command=$("command"), view=$("watch-command");
 let shown=false,stamp=-1,returnToWatch;
 const visibleTry=()=>shown;
 const tryKeys=CalculatorLessonHandset.mount(host,{screen:tryLcd,label:"TI-Nspire CX II-T",interactive:false,onKey:(key,e)=>press(key,e?.detail===0)});
 const params=new URLSearchParams(location.search), names=["lambda","event","a","b"], typed=names.some(k=>params.has(k));
 function validEvent(l,kind,a,b=""){
  const lambda=M.number(l), low=M.integer(a), upper=kind==="between"?M.integer(b):null;
  let value=null, rangeNotice="";
  try{value=M.event(lambda,kind,low,upper);}
  catch(e){if(!e.message.includes("reliable numeric range"))throw e;rangeNotice=e.message;}
  return {lambda,kind,a:low,b:upper,value,rangeNotice};
 }
 const original=validEvent("3.5","ge","4");
 let assigned=original, badLink=false;
 if(typed)try{
  const kind=params.get("event");
  if(names.slice(0,3).some(k=>params.getAll(k).length!==1)||params.getAll("b").length!==(kind==="between"?1:0))throw Error("Repeated or missing input");
  assigned=validEvent(params.get("lambda"),kind,params.get("a"),params.get("b"));
 }catch{badLink=true;}
 let exercise=assigned, history=[], historyIndex=-1, error="", start=0, end=0, light=0;
 const hist=$("history"), fields=["mean","event","a","b"].map($);
 function announce(message){$("lcd-announcement").textContent=message;}
 function updateHistory(scroll=true){
  hist.replaceChildren();
  for(let i=0;i<history.length;i++){
   const {expression,value}=history[i],row=document.createElement("div"),answer=document.createElement("strong");
   row.append(document.createTextNode(expression),answer);answer.textContent=M.fmt(value);
   if(historyIndex===i)row.setAttribute("aria-current","true");
   hist.append(row);
  }
  if(scroll){
   const row=hist.children[historyIndex];
   if(row){
    const visible=hist.getBoundingClientRect(), target=row.getBoundingClientRect();
    if(target.top<visible.top)hist.scrollTop-=visible.top-target.top;
    else if(target.bottom>visible.bottom)hist.scrollTop+=target.bottom-visible.bottom;
   }else hist.scrollTop=hist.scrollHeight;
  }
  tryLcd.dataset.result=history.length?M.fmt(history.at(-1).value):"";
 }
 function setError(message=""){
  error=message;$("keypad-result").hidden=!error;$("keypad-result").textContent=error;
  if(message)announce(message);
 }
 function selection(){
  if(document.activeElement===command){start=command.selectionStart;end=command.selectionEnd;}
  return [start,end];
 }
 function draft(raw,a,b=a,focus=false){
  command.value=raw;
  if(focus)command.focus({preventScroll:true});
  command.setSelectionRange(a,b);start=a;end=b;
  if(error)setError();
 }
 function selectHistory(i){
  historyIndex=i;updateHistory();
  if(i>=0)announce("History: "+history[i].expression+". Press Enter to copy it to the entry line.");
 }
 function evaluate(focus=false){
  if(historyIndex>=0){
   const raw=history[historyIndex].expression.replace(/−/g,"-");selectHistory(-1);draft(raw,raw.length,raw.length,focus);
   announce("Copied to the entry line. Edit it or press Enter to calculate.");return;
  }
  try{
   const result=M.calculator(command.value);
   history=[...history,result].slice(-8);draft("",0,0,focus);updateHistory();
   announce(result.expression+" equals "+M.fmt(result.value)+".");
  }catch(e){setError(e.message);}
 }
 function press(key,keyboard=false){
  if(!visibleTry())return;
  clearTimeout(light);tryKeys.setKeys([key]);light=setTimeout(()=>tryKeys.setKeys([]),245);
  if(key==="enter"||key==="return"){evaluate(keyboard);return;}
  if(key==="esc"){
   if(historyIndex>=0)selectHistory(-1);else draft("",0,0,keyboard);
   setError();return;
  }
  if(key==="up"||key==="down"){
   if(!history.length)return;
   const i=historyIndex<0?(key==="up"?history.length-1:-1):historyIndex+(key==="up"?-1:1);
   selectHistory(i>=history.length?-1:Math.max(i,historyIndex<0?-1:0));return;
  }
  if(key==="menu"||key==="catalog"){setError("This lesson practises typed Poisson commands. Type one on the Calculator entry line.");return;}
  if(historyIndex>=0)selectHistory(-1);
  const [a,b]=selection();
  if(key==="left"||key==="right"){
   const loc=M.clamp(key==="left"?(a===b?a-1:a):(a===b?b+1:b),0,command.value.length);
   command.setSelectionRange(loc,loc);start=loc;end=loc;return;
  }
  const ch=({lparen:"(",rparen:")",comma:",",dot:".",minus:"-",neg:"-",plus:"+",space:" "})[key]||(/^[a-z0-9]$/.test(key)?key:null);
  if(!ch&&key!=="del")return;
  const from=key==="del"&&a===b?Math.max(0,a-1):a, insert=ch||"";
  const next=command.value.slice(0,from)+insert+command.value.slice(b);
  if(next.length<=100)draft(next,from+insert.length,from+insert.length,keyboard);
 }
 command.addEventListener("keydown",e=>{
  if(e.isComposing||e.ctrlKey||e.altKey||e.metaKey)return;
  const k={ArrowUp:"up",ArrowDown:"down",Escape:"esc"}[e.key];
  if(k){e.preventDefault();press(k,true);}
 });
 command.addEventListener("input",()=>{if(historyIndex>=0)selectHistory(-1);selection();setError();});
 for(const kind of ["select","keyup","pointerup","blur"])command.addEventListener(kind,()=>{start=command.selectionStart;end=command.selectionEnd;});
 $("command-form").onsubmit=e=>{e.preventDefault();press("enter",true);};
 function paintEvent(){
  const v=exercise;
  $("keypad-problem").textContent="Use λ = "+M.neat(v.lambda)+" to find "+M.label(v.kind,v.a,v.b)+".";
  const warning=badLink?"This link did not supply a valid event. Showing the original exercise.":v.rangeNotice;
  $("event-warning").hidden=!warning;$("event-warning").textContent=warning;
  $("answer-form").hidden=v.value===null;
 }
 function shape(){
  const pair=fields[1].value==="between";$("a-caption").textContent=pair?"Lower count":"Count";
  $("b-label").hidden=!pair;fields[3].required=pair;
 }
 function setForm(v){
  [String(v.lambda),v.kind,String(v.a),v.b==null?"":String(v.b)].forEach((x,i)=>fields[i].value=x);shape();
 }
 function clearCheck(){$("answer").value="";$("feedback").textContent="";$("feedback").className="feedback";}
 fields[1].onchange=shape;
 $("model-form").onsubmit=e=>{
  e.preventDefault();
  try{
   exercise=validEvent(...fields.map(f=>f.value));badLink=false;
   $("model-warning").hidden=true;$("custom-case").open=false;clearCheck();paintEvent();
   $("answer").focus({preventScroll:true});
  }catch(err){$("model-warning").textContent=err.message;$("model-warning").hidden=false;}
 };
 $("answer").oninput=()=>{$("feedback").textContent="";$("feedback").className="feedback";};
 $("answer-form").onsubmit=e=>{
  e.preventDefault();if(exercise.value===null)return;
  const right=M.grade($("answer").value,exercise.value),tail=exercise.kind==="gt"||exercise.kind==="ge";
  $("feedback").className="feedback "+(right?"is-right":"is-wrong");
  $("feedback").textContent=right?"Correct. Your count bounds match the event.":tail?"Not quite. Check whether the cutoff itself belongs in the event.":"Not quite. Check which counts the event includes.";
 };
 $("reset-keypad").onclick=()=>{
  exercise=assigned;badLink=false;clearCheck();history=[];historyIndex=-1;
  draft("",0);setError();updateHistory();setForm(exercise);paintEvent();announce("Calculator and practice question reset.");
  $("try-host").focus({preventScroll:true});
 };
 $("try-host").addEventListener("keydown",e=>{
  if(!shown||e.altKey||e.ctrlKey||e.metaKey||e.isComposing||e.target.closest("input,textarea,select,a,summary")||e.target.closest("button")&&[" ","Enter"].includes(e.key))return;
  const keys={Escape:"esc",Enter:"enter",Backspace:"del",Delete:"del",ArrowUp:"up",ArrowDown:"down",ArrowLeft:"left",ArrowRight:"right",".":"dot",",":"comma","(":"lparen",")":"rparen","-":"minus","+":"plus"};
  const k=keys[e.key]||(/^[a-z0-9]$/i.test(e.key)?e.key.toLowerCase():"");
  if(k){e.preventDefault();press(k,true);}
 });

 const action=p=>({"(":"lparen",")":"rparen",",":"comma","-":"minus",Enter:"enter"})[p.label]||p.label.toLowerCase();
 const format=x=>x.replace(/poisspdf/i,"poissPdf").replace(/poisscdf/i,"poissCdf").replace(/-/g,"−");
 function renderWatch(device,{beat,point,crossed,key}){
  if(host.parentElement!==device)device.append(host);
  command.hidden=true;view.hidden=false;
  const lit=key&&!point.speaking&&key.beat===beat&&(point.fraction-key.at)*(point.span.end-point.span.voiceEnd)<.44;
  tryKeys.setKeys(lit?[action(key)]:[]);
  if(crossed.length===stamp)return;
  stamp=crossed.length;
  let raw="";const results=[];
  for(const p of crossed){if(p.label==="Enter"){results.push(M.calculator(raw));raw="";}else raw+=p.label.toLowerCase();}
  hist.replaceChildren();
  for(const result of results.slice(-2)){
   const row=document.createElement("div"), answer=document.createElement("strong");
   row.append(document.createTextNode(result.expression),answer);answer.textContent=M.fmt(result.value);hist.append(row);
  }
  hist.scrollTop=hist.scrollHeight;view.textContent=format(raw)+"▏";
  $("keypad-result").hidden=true;tryLcd.dataset.result=results.length?M.fmt(results.at(-1).value):"";
 }
 function enterTry(device,actions){
  shown=true;returnToWatch=actions.returnToWatch;device.prepend(panel);dock.prepend(host);
  panel.hidden=false;command.hidden=false;view.hidden=true;tryKeys.setInteractive(true);tryKeys.setKeys([]);
  paintEvent();updateHistory(false);$("keypad-result").hidden=!error;host.focus({preventScroll:true});
 }
 function exitTry(){
  shown=false;panel.hidden=true;stamp=-1;clearTimeout(light);tryKeys.setKeys([]);tryKeys.setInteractive(false);
 }
 $("return-watch").onclick=()=>returnToWatch?.();
 setForm(exercise);
 window.CalculatorLessonAdapter=Object.freeze({initialMode:params.get("mode")==="try"?"try":"watch",renderWatch,enterTry,exitTry});
})();
