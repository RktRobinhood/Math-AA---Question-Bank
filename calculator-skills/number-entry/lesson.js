"use strict";
(function(){
const $=id=>document.getElementById(id),M=CT01Math;
const stage=$("stage"),audio=$("narration"),seek=$("seek"),play=$("play"),overlay=$("start-overlay"),lcd=$("lcd-body");
const approach=new URLSearchParams(location.search), defaultCase={expr:M.defaultExpr,sf:3,value:M.evaluate(M.defaultExpr)};
let task=defaultCase,invalidLink=false,fixedLink=false;
if(approach.has("expr")){
 try{task=M.linked(approach);fixedLink=true;}catch{invalidLink=true;}
}
const cue=[
 [0,"Open a Calculator page."],
 [2.1,"Group the numerator and denominator before entering a fraction."],
 [6.44,"Use the scientific notation key for powers of 10."],
 [10.24,"Keep the negative sign inside the exponent."],
 [13.32,"Read the unrounded value first."],
 [16.02,"Scientific notation on the screen may use the letter E."],
 [20.06,"Show the requested precision in your written answer."],
 [23.45,"6.00 has three significant figures."]
];
const keys=[[.03,"home"],[.53,"1"],[1.12,"enter"],[2.36,"ctrl"],[3.02,"div"],[6.45,"4"],[6.96,"ee"],[7.49,"5"],[7.97,"mul"],[8.41,"3"],[9.06,"ee"],[10.52,"neg"],[11.00,"2"],[11.54,"down"],[11.91,"2"],[12.33,"ee"],[12.77,"3"],[13.23,"enter"]];
const checkpoints=[[0,"Open Calculator"],[2.1,"Group a fraction"],[6.44,"Use EE and (−)"],[13.32,"Read the value"],[20.06,"Write three significant figures"]];
let mode="watch",state=M.pristine("calc",task.expr),usedTry=false,focused=false,firstStart=true,t=0,duration=27.01,playing=false,pending=false,epoch=0,raf=0,base=0,speed=.9,sound=true,stamp="";
const shell=HandheldShell.mount({host:$("handheld-host"),screen:$("lcd"),label:"TI-Nspire CX II-T Calculator",interactive:false,onKey:(k,event)=>{doKey(k);if(mode==="try"&&event?.detail>0)lcd.focus({preventScroll:true});}});
const names=["Watch","Try"].map(x=>$(x.toLowerCase()+"-tab"));
const node=(tag,cls,label)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(label!==undefined)n.textContent=label;return n;};
const fmt=t=>Math.floor(t/60)+":"+String(Math.floor(t)%60).padStart(2,"0");
function fraction(parent,f,at=null){
 const wrap=node("span","lcd-frac");
 for(const key of ["top","bottom"]){
  const item=node("span",f.active===key&&at!==null?"active":"");
  cursor(item,f[key],f.active===key?at:null);wrap.append(item);
 }
 parent.append(wrap);
 if(f.after||f.active==="after"){const then=node("span","lcd-frac-after");cursor(then,f.after,f.active==="after"?at:null);parent.append(then);}
}
function cursor(el,text,at){
 if(at===null){el.append(M.show(text)||"□");return;}
 at=Math.min(text.length,at);
 el.append(M.show(text.slice(0,at)),node("i","lcd-caret"),M.show(text.slice(at)));
}
function renderLCD(s){
 const b=lcd; b.replaceChildren();b.dataset.app=s.app;
 const title={off:"TI-Nspire",home:"Home",new:"New Document",calc:"1.1   Calculator",scratch:"Scratchpad  Calculate"};
 $("lcd-title").textContent=title[s.app];
 if(s.app==="home"){
  const groups=node("div","home-menu");
  for(const pair of [["Scratchpad",["A Calculate","B Graph"]],["Documents",["1 New","2 Browse","3 Recent","4 Current","5 Settings"]]]){
   const g=node("div");g.append(node("b","",pair[0]));
   for(const item of pair[1])g.append(node("div",item==="1 New"?"chosen":"",item));
   groups.append(g);
  }
  const apps=node("div","home-apps","▦  ◫  △  ▤  ▥  ▣");
  b.append(groups,apps);
 }else if(s.app==="new"){
  const ul=node("ul","new-menu");
  for(const [i,n] of ["Calculator","Graphs","Geometry","Lists & Spreadsheet","Data & Statistics","Notes","Vernier DataQuest"].entries())ul.append(node("li",i===0?"chosen":"",(i+1)+": Add "+n));
  b.append(ul);
 }else if(s.app!=="off"){
  for(const row of s.rows.slice(-2)){
   const history=node("div","lcd-row"),e=node("div","lcd-expression");
   if(row.frac)fraction(e,row.frac);else e.textContent=M.show(row.text);
   history.append(e,node("div","lcd-result",M.number(row.value)));b.append(history);
  }
  const entry=node("div","lcd-input");
  if(s.frac)fraction(entry,s.frac,s.at);else cursor(entry,s.entry,s.at);
  b.append(entry);
  if(s.ctrl)b.append(node("span","ctrl-flag","ctrl"));
  if(s.error)b.append(node("div","lcd-error",s.error));
 }
 $("lcd-text").textContent=[title[s.app],s.app==="new"?"1: Add Calculator":s.app==="home"?"1 New, A Calculate":"",s.app==="calc"||s.app==="scratch"?M.input(s):"",s.rows.length?"Last result "+M.number(s.rows.at(-1).value):"",s.error].filter(Boolean).join(". ");
}
function snapshot(time){
 let s=M.pristine("off"),key="",prev="";
 for(const [when,k] of keys){
  if(when>time)break;
  const held=s.ctrl;
  s=M.pressed(s,k);
  if(time<when+.25){key=k;prev=held&&k!=="ctrl"?"ctrl":"";}
  else {key="";prev="";}
 }
 return {s,key,prev};
}
function renderWatch(){
 if(mode!=="watch")return;
 const a=cue.findLastIndex(x=>x[0]<=t), c=checkpoints.findLastIndex(x=>x[0]<=t), f=snapshot(t);
 seek.value=t;
 seek.setAttribute("aria-valuetext",fmt(t>=duration-.015?Math.round(duration):t)+" of "+fmt(Math.round(duration)));
 $("clock").textContent=fmt(t>=duration-.015?Math.round(duration):t)+" / "+fmt(Math.round(duration));
 shell.setKeys([f.prev,f.key].filter(Boolean));overlay.hidden=playing||t>0.04;
 const next=JSON.stringify([a,c,f.s]);
 if(next===stamp)return;stamp=next;
 renderLCD(f.s);$("caption").textContent=cue[a][1];
 const note=$("takeaway");
 note.hidden=t<2.1||(t>=13.32&&t<16.02);
 note.textContent=t<6.44?"Use the fraction template to keep the numerator and denominator separate.":t<13.32?"EE enters the power of ten. Use (−), not subtraction, for a negative exponent.":t>=23.45?"Written answer: 6.00 · three significant figures":t>=20.06?"Calculator: 6   →   Written to 3 s.f.: 6.00":"In the entry above: 3E−2 means 3 × 10⁻².";
 [...$("steps").children].forEach((n,i)=>n.firstElementChild.setAttribute("aria-current",String(i===c)));
}
function renderTry(){
 if(mode!=="try")return;
 renderLCD(state);
 const tip=({home:"Press 1 for New, or A for Scratchpad Calculate.",new:"Press 1 to add the Calculator page.",calc:"Use the calculator keys, or select the screen and type. Press Enter to evaluate.",scratch:"Use the keys or type on the screen. Press Enter to evaluate."}[state.app]??"Press Home to open the calculator.");
 const text=state.error||tip;
 if($("hint").textContent!==text)$("hint").textContent=text;
 $("hint").classList.toggle("is-wrong",Boolean(state.error));
}
function doKey(k){if(mode!=="try")return;state=M.pressed(state,k);renderTry();}
function label(){
 const name=playing?"Pause":t>=duration-.015?"Replay":"Play";
 play.textContent=name;play.setAttribute("aria-label",name);play.dataset.playing=String(playing);
}
function pause(){
 epoch++;pending=false;if(playing&&sound)t=audio.currentTime;
 playing=false;audio.pause();cancelAnimationFrame(raf);label();renderWatch();
}
function go(time){
 t=Math.max(0,Math.min(duration,Number(time)||0));base=performance.now()-t*1000/speed;
 if(sound&&Number.isFinite(audio.duration))audio.currentTime=t;
 renderWatch();label();
}
function focus(v){
 focused=Boolean(v);stage.classList.toggle("ct10-focused",focused);document.body.classList.toggle("ct10-focus-open",focused);
 const f=$("focus-view"),name=focused?"Exit focused view":"Focused view";f.setAttribute("aria-pressed",String(focused));f.setAttribute("aria-label",name);f.textContent=focused?"Exit":"⛶";
}
function finish(){pause();t=duration;renderWatch();label();}
function step(now){
 if(!playing||mode!=="watch")return;
 t=sound?audio.currentTime:(now-base)*speed/1000;
 if(t>=duration){finish();return;}
 renderWatch();raf=requestAnimationFrame(step);
}
function fallback(){
 sound=false;base=performance.now()-t*1000/speed;$("media-status").textContent="Captions only";$("sound-label").hidden=true;
}
async function start(){
 if(mode!=="watch")return;
 if(firstStart){firstStart=false;if(stage.getBoundingClientRect().bottom>innerHeight-57)focus(true);}
 if(t>=duration-.015)go(0);
 const id=++epoch;pending=true;base=performance.now()-t*1000/speed;
 if(sound){
  try{audio.currentTime=t;await audio.play();}
  catch {if(id!==epoch)return;fallback();}
 }
 if(id!==epoch||mode!=="watch")return;
 pending=false;playing=true;
 if(document.activeElement===overlay)play.focus({preventScroll:true});
 renderWatch();label();raf=requestAnimationFrame(step);
}
function toggle(){if(playing||pending)pause();else void start();}
function setMode(next,fork=false){
 if(next===mode)return;
 pause();focus(false);
 if(next==="try"&&fork&&!usedTry&&!fixedLink){
  const f=snapshot(t).s;
  state=f.app==="off"?M.pristine():f;
  usedTry=true;
 }
 if(next==="try")usedTry=true;
 mode=next;stage.dataset.mode=mode;stamp="";
 for(const [i,n] of names.entries()){const selected=(i===0)===(mode==="watch");n.setAttribute("aria-selected",String(selected));n.tabIndex=selected?0:-1;}
 for(const id of ["try-panel","try-player","challenge"])$(id).hidden=next!=="try";
 for(const id of ["watch-panel","watch-player"])$(id).hidden=next!=="watch";
 lcd.tabIndex=next==="try"?0:-1;
 shell.setInteractive(next==="try");shell.setKeys([]);
 if(mode==="watch"){renderWatch();label();}
 else{overlay.hidden=true;renderTry();}
}
for(const [i,n] of names.entries()){
 n.addEventListener("click",()=>setMode(i===0?"watch":"try"));
 n.addEventListener("keydown",e=>{if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();const other=names[1-i];other.click();other.focus();}});
}
audio.addEventListener("loadedmetadata",()=>{
 if(!sound||!Number.isFinite(audio.duration)||audio.duration<=0)return;
 duration=audio.duration;seek.max=duration;renderWatch();
});
audio.addEventListener("error",fallback);audio.addEventListener("ended",finish);
$("sound").addEventListener("change",()=>{audio.muted=!$("sound").checked;});
audio.playbackRate=speed;
audio.preservesPitch=true;
$("play-rate").addEventListener("change",e=>{
 speed=Number(e.target.value);
 audio.playbackRate=speed;
 base=performance.now()-t*1000/speed;
});

for(const b of [play,overlay])b.addEventListener("click",toggle);
$("back").addEventListener("click",()=>go(t-10));$("next").addEventListener("click",()=>go(t+10));
$("replay").addEventListener("click",()=>{pause();go(0);void start();});
seek.addEventListener("input",()=>go(seek.value));$("focus-view").addEventListener("click",()=>focus(!focused));
$("take-over").addEventListener("click",()=>{setMode("try",true);lcd.focus();});
$("return-watch").addEventListener("click",()=>{setMode("watch");play.focus({preventScroll:true});});
$("reset-keypad").addEventListener("click",()=>{state=M.pristine();renderTry();lcd.focus();});
lcd.addEventListener("click",()=>{if(mode==="try")lcd.focus({preventScroll:true});});
lcd.addEventListener("paste",e=>{
 if(mode!=="try"||!["calc","scratch"].includes(state.app)||state.frac)return;
 const text=e.clipboardData?.getData("text/plain")?.trim();
 if(!text)return;
 e.preventDefault();
 const next=state.entry.slice(0,state.at)+text+state.entry.slice(state.at);
 if(next.length>120||!/^[0-9Ee.()+\-−–/*×÷^ ]+$/.test(next)){
  state={...state,error:"Paste a numerical expression no longer than 120 characters."};
 }else{
  const app=state.app,at=state.at+text.length;
  state={...M.typed(state,next),app,at};
 }
 renderTry();
});
$("answer-form").addEventListener("submit",e=>{
 e.preventDefault();
 const chk=M.grade($("answer").value,task.value,task.sf),f=$("feedback");
 const msg={correct:"Correct value and precision.",precision:"The value is right. Show exactly "+task.sf+" significant figures.",format:"Use a decimal or E notation, such as 3.40E−2.",value:"Not quite. Recheck the grouping and round only at the end."};
 f.textContent=msg[chk.kind];f.className="feedback "+(chk.ok?"is-right":"is-wrong");
});
document.addEventListener("keydown",e=>{
 const target=e.target;
 if(e.key==="Escape"&&focused){e.preventDefault();focus(false);return;}
 if(e.metaKey||e.altKey||target?.closest?.("input,select,a,summary,textarea,[contenteditable]"))return;
 if(target?.closest?.("button")&&["Enter"," ","Tab"].includes(e.key))return;
 if(mode==="watch"&&!e.ctrlKey){
  if(e.key===" "||e.key.toLowerCase()==="k"){e.preventDefault();toggle();}
  if(e.key.toLowerCase()==="j"||e.key.toLowerCase()==="l"){e.preventDefault();go(t+(e.key.toLowerCase()==="j"?-10:10));}
  return;
 }
 if(mode!=="try")return;
 if(e.ctrlKey){if(e.key==="/"){e.preventDefault();doKey("ctrl");doKey("div");}return;}
 const k=e.key, z=k.toLowerCase();
 if(z==="tab")return;
 const keyMap={Backspace:"del",Delete:"del",Escape:"esc",Enter:"enter",ArrowLeft:"left",ArrowRight:"right",ArrowDown:"down",ArrowUp:"up",Home:"home","(":"lparen",")":"rparen","*":"mul","/":"div","-":/E$/i.test(state.frac?state.frac[state.frac.active]:state.entry)?"neg":"minus","+":"plus","^":"power",".":"dot",e:state.app==="calc"||state.app==="scratch"?"ee":"e",a:"a"};
 const match=keyMap[k]??keyMap[z]??(/^[0-9]$/.test(k)?k:null);
 if(match){e.preventDefault();doKey(match);shell.setKeys([match]);setTimeout(()=>{if(mode==="try")shell.setKeys([]);},125);}
});
for(const [when,name] of checkpoints){
 const li=node("li"),b=node("button");b.type="button";b.append(node("span","",String(1+$("steps").children.length).padStart(2,"0")),document.createTextNode(name));
 b.addEventListener("click",()=>go(when));li.append(b);$("steps").append(li);
}
const sup={"-":"⁻","+":"⁺","0":"⁰","1":"¹","2":"²","3":"³","4":"⁴","5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹"};
const written=task.expr.replace(/(\d+(?:\.\d+)?)[eE]([+-]?\d+)/g,(_,c,e)=>c+" × 10"+[...e].map(v=>sup[v]).join("")).replace(/\*/g," × ").replace(/\//g," ÷ ").replace(/-/g,"−");
$("question").textContent="Evaluate "+written+". Give the written answer to "+task.sf+" significant figure"+(task.sf===1?"":"s")+".";
if(invalidLink)$("question").prepend("The linked expression could not be loaded. Default example: ");
const theme=$("theme");
try{theme.value=localStorage.getItem("calculator-theme")||"system";}catch{}
document.documentElement.dataset.theme=theme.value||"system";
theme.addEventListener("change",()=>{document.documentElement.dataset.theme=theme.value;try{localStorage.setItem("calculator-theme",theme.value);}catch{}});
stage.dataset.mode="watch";renderWatch();label();
if(approach.get("mode")==="try")setMode("try");
})();
