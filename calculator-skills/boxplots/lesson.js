"use strict";
(function(){
 const $=id=>document.getElementById(id),M=CT30Math,S=CT30Screen,moments=CT30WatchMoments;
 const stage=$("stage"),lcd=$("lcd"),canvas=$("drawing"),data=$("data"),screen=S.screen(canvas);
 const params=new URLSearchParams(location.search),typed=params.has("data");
 const original=M.parse("-9,-7,2,2,3,5,7,8,8,8,9,12"),worked=M.parse("0,1,2,2,3,4,4,5,6,6,12,13");
 let assigned=original,unsafe=false;
 if(typed)try{
  if(params.getAll("data").length!==1)throw Error("Repeated input");
  assigned=M.parse(params.get("data"));
 }catch{unsafe=true;}
 const create=values=>({summary:M.describe(values),menu:"",selection:0,plot:"dot",mark:null,draft:M.listText(values),dirty:false,error:""});
 let mode="watch",state=create(assigned),attemptedLoad=false,cache="",returnToWatch;
 const handheld=$("handheld-host"),hot=$("hotspots");
 const shell=CalculatorLessonHandset.mount(handheld,{screen:lcd,label:"TI-Nspire CX II-T Data & Statistics",interactive:false,onKey:press});
 const watchState=create(worked);
 const markText=s=>{const p=S.pointFor(s);return p?S.formatMark(p.id,p.n):"";};
 const describe=s=>{
  const kind={dot:"Dot plot",modified:"Modified box plot",standard:"Standard box plot"}[s.plot];
  const row=s.menu==="main"?S.PANEL.main.rows[s.selection]:s.menu==="type"?S.PANEL.type.rows[s.selection]:s.menu==="props"?S.propName(s):"";
  const point=markText(s);
  lcd.dataset.plot=s.plot;lcd.dataset.menu=s.menu;
  $("lcd-text").textContent=kind+" of reading. "+(row?"Menu selection: "+row+". ":point?point+". ":"");
 };
 function renderWatch(device,{beat,point,crossed,key}){
  if(handheld.parentElement!==device)device.append(handheld);
  hot.replaceChildren();
  const snap={...watchState}, fraction=point.speaking?0:point.fraction;
  const past=new Set(crossed.map(k=>k.id));
  let count=0, highlight=null;
  for(let i=0;i<=beat;i++)for(const m of moments[i]){
   if(i<beat||(!m.label?m.at<=fraction:past.has(m.id))){Object.assign(snap,m.delta);count++;if(m.label&&i===beat&&key?.id===m.id)highlight=m;}
  }
  const hold=point.span.end-point.span.voiceEnd;
  const lit=highlight&&!point.speaking&&(fraction-highlight.at)*hold<.65;
  shell.setKeys(lit?[highlight.label.toLowerCase()]:[]);
  const sig=beat+":"+count;if(sig===cache)return;cache=sig;
  screen.draw(snap);describe(snap);
 }
 function buttonAt(panel,index,label,fn){
  const b=document.createElement("button");b.type="button";b.setAttribute("aria-label",label);
  b.style.left=panel.x/3.2+"%";b.style.top=(panel.y+2+index*panel.h)/2.4+"%";b.style.width=panel.w/3.2+"%";b.style.height=panel.h/2.4+"%";
  b.addEventListener("click",e=>{e.stopPropagation();fn();});hot.append(b);
 }
 function setMessage(value="",wrong=false){
  const li=$("keypad-result");li.hidden=!value;li.textContent=value;li.className="feedback "+(wrong?"is-wrong":"is-right");
 }
 function renderTry(){
  if(mode!=="try")return;
  screen.draw(state);describe(state);hot.replaceChildren();
  const plot=state.plot,menu=state.menu;
  const welcome="Find the fences, modified whiskers and outliers for this list.";
  $("keypad-problem").textContent=$("try-line").textContent=welcome;
  $("keypad-hint").textContent=state.dirty?"Load list to apply your changes.":menu==="main"?"Choose Plot Type or Plot Properties.":menu==="type"?"Choose 2: Box Plot.":menu==="props"?"Select the item by name.":plot==="dot"?"Open Menu → 1: Plot Type → 2: Box Plot.":"Compare the two box plot modes in Plot Properties.";
  $("answer-form").hidden=state.dirty;
  $("trace-help").hidden=Boolean(menu)||plot==="dot";
  const fallback=unsafe&&!attemptedLoad?"This link did not contain a valid list. Showing the original practice data.":"";
  setMessage(state.error||fallback||(!menu&&markText(state)),Boolean(state.error||fallback));
  if(menu==="main"){
   buttonAt(S.PANEL.main,0,"1: Plot Type",()=>press("1"));buttonAt(S.PANEL.main,1,"2: Plot Properties",()=>press("2"));
  }
  if(menu==="type"){
   buttonAt(S.PANEL.type,0,"1: Dot Plot",()=>press("1"));buttonAt(S.PANEL.type,1,"2: Box Plot",()=>press("2"));
  }
  if(menu==="props")buttonAt(S.PANEL.props,0,S.propName(state),()=>press("enter"));
 }
 function update(props={}){
  state={...state,error:"",...props};renderTry();
 }
 const menuRows=menu=>menu==="main"?S.PANEL.main.rows.length:menu==="type"?S.PANEL.type.rows.length:1;
 function inspect(id){
  if(!id||mode!=="try"||state.menu)return;
  update({mark:id});
 }
 function press(k){
  if(mode!=="try")return;
  const menu=state.menu;
  if(k==="menu"){update({menu:"main",selection:0,mark:null});return;}
  if(k==="esc"){update({menu:menu==="props"||menu==="type"?"main":"",selection:0,mark:null});return;}
  if(menu){
   if(k==="up"||k==="down"){const n=menuRows(menu);update({selection:(state.selection+(k==="down"?1:n-1))%n});return;}
   if(k==="left"&&menu!=="main"){update({menu:"main",selection:menu==="type"?0:1});return;}
   const pick=["enter","select","right"].includes(k)?state.selection+1:Number(k);
   if(menu==="main"&&(pick===1||pick===2)){
    if(pick===2&&state.plot==="dot"){update({error:"Make a box plot before changing its whiskers."});return;}
    update({menu:pick===1?"type":"props",selection:0,mark:null});return;
   }
   if(menu==="type"&&(pick===1||pick===2)){
    update({menu:"",plot:pick===1?"dot":"modified",mark:null});return;
   }
   if(menu==="props"&&["enter","select","right"].includes(k)){update({menu:"",plot:state.plot==="modified"?"standard":"modified",mark:null});return;}
   return;
  }
  if((k==="left"||k==="right")&&state.plot!=="dot"){
   const marks=S.details(state).slice().sort((a,b)=>a.x-b.x),i=marks.findIndex(x=>x.id===state.mark);
   const j=i<0?(k==="right"?0:marks.length-1):M.clamp(i+(k==="right"?1:-1),0,marks.length-1);
   inspect(marks[j]?.id);
  }
 }
 function nearest(e){
  const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*320/r.width,y=(e.clientY-r.top)*240/r.height;
  const d=m=>Math.hypot(m.x-x,Math.max(31,m.y)-y),marks=S.details(state).slice().sort((a,b)=>d(a)-d(b));
  return marks[0]&&d(marks[0])<22?marks[0].id:null;
 }
 // Inspect individual marks only after a user gesture. Hover updates the LCD
 // without writing the quiz or emitting an additional live-region announcement.
 lcd.addEventListener("pointermove",e=>{
  if(mode!=="try"||state.menu||e.pointerType==="touch")return;
  const id=nearest(e);if(id&&id!==state.mark){state={...state,mark:id};screen.draw(state);describe(state);}
 });
 lcd.addEventListener("click",e=>{if(mode==="try"&&!state.menu&&!e.target.closest("button"))inspect(nearest(e));});
 data.addEventListener("input",e=>{
  if(mode!=="try")return;
  state={...state,draft:e.target.value,dirty:true,error:""};renderTry();
 });
 $("data-form").addEventListener("submit",e=>{
  e.preventDefault();attemptedLoad=true;
  try{
   state=create(M.parse(data.value));data.value=state.draft;$("answer-form").reset();$("feedback").textContent="";
   renderTry();stage.focus({preventScroll:true});
  }catch(e){update({dirty:true,error:e.message});}
 });
 $("answer-form").addEventListener("input",()=>{$("feedback").textContent="";});
 $("answer-form").addEventListener("submit",e=>{
  e.preventDefault();if(state.dirty)return;
  const v=$("feedback");
  try{
   const result=M.grade(["fence-low","fence-high","whisker-low","whisker-high","outliers"].map(id=>$(id).value),state.summary);
   const missing=[],ok=result.fences&&result.whiskers&&result.outliers;
   if(!result.fences)missing.push("recalculate Q₁ − 1.5 × IQR and Q₃ + 1.5 × IQR");
   if(!result.whiskers)missing.push("use observations, not cutoffs, for both whisker ends");
   if(!result.outliers)missing.push("include only observations strictly beyond a fence");
   v.textContent=ok?"Correct. Fences are cutoffs; modified whiskers end at observed values.":"Check your work: "+missing.join("; ")+".";
   v.className="feedback "+(ok?"is-right":"is-wrong");
  }catch(e2){v.textContent=e2.message;v.className="feedback is-wrong";}
 });
 $("reset-keypad").addEventListener("click",()=>{
  attemptedLoad=true;state=create(assigned);
  data.value=state.draft;$("answer-form").reset();$("feedback").textContent="";renderTry();stage.focus({preventScroll:true});
 });
 function enterTry(device,actions){
  mode="try";returnToWatch=actions.returnToWatch;
  device.prepend(stage);$("try-grid").prepend(handheld);stage.hidden=false;
  data.value=state.draft;shell.setKeys([]);shell.setInteractive(true);renderTry();stage.focus({preventScroll:true});
 }
 function exitTry(){
  mode="watch";stage.hidden=true;cache="";
  shell.setKeys([]);shell.setInteractive(false);
 }
 $("return-watch").addEventListener("click",()=>returnToWatch?.());
 document.addEventListener("keydown",e=>{
  if(e.target!==document.body&&!e.target.closest?.(".qb-calculator-lesson"))return;
  if(e.metaKey||e.ctrlKey||e.altKey||e.target.closest("input,textarea,select,a,summary,[contenteditable]"))return;
  if(mode!=="try"||(!stage.contains(e.target)&&e.target!==document.body)||e.target.closest("button")&&(e.key==="Enter"||e.key===" "))return;
  const keys={Escape:"esc",Enter:"enter",ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down",m:"menu",M:"menu"};
  const k=keys[e.key]||(/^[0-9]$/.test(e.key)?e.key:"");
  if(k){e.preventDefault();press(k);}
 });
 window.CalculatorLessonAdapter=Object.freeze({initialMode:params.get("mode")==="try"||(typed&&!unsafe)?"try":"watch",renderWatch,enterTry,exitTry});
})();
