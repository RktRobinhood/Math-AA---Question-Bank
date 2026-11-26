"use strict";
(function(){
const $=id=>document.getElementById(id),M=CT01Math;
const stage=$("stage"),audio=$("narration"),seek=$("seek"),play=$("play"),overlay=$("play-feedback"),lcd=$("lcd-body"),surface=$("workspace");
const approach=new URLSearchParams(location.search), defaultCase={expr:M.defaultExpr,sf:3,explicitPrecision:false,value:M.evaluate(M.defaultExpr)};
let task=defaultCase,invalidLink=false;
if(approach.has("expr")){
 try{task=M.linked(approach);}catch{invalidLink=true;}
}
// The unchanged legacy take is usable through beat 7 only. The last sentence
// is retired for accuracy; the corrected last beat is unvoiced until a new take.
const cue=[
 [0,"Open a Calculator page."],
 [2.152,"Group the numerator and denominator before entering a fraction."],
 [6.453,"Use the scientific notation key for powers of 10."],
 [10.147,"Keep the negative sign inside the exponent."],
 [13.373,"Read the unrounded value first."],
 [16.050,"Scientific notation on the screen may use the letter E."],
 [20.099,"Show the requested precision in your written answer."]
];
// Measured cuts inside each quiet gap (FFmpeg silencedetect -39 dB, dwell .18 s).
// The existing George file stays at 1×. Only the separate teaching holds vary.
const recordedBeatCount=cue.length;
const correctedEnding="The exact result here is 6. Write 6. For an approximation, 6.274… to three significant figures is 6.27. Follow any precision the question specifies.";
const beats=[
 [0,1.78,6], [1.78,6.08,8], [6.08,9.80,12], [9.80,12.96,12],
 [12.96,15.68,8], [15.68,19.70,7], [19.70,23.09,9], [23.09,26.974,7]
];
const actions=[
 [[.12,"home"],[.40,"1"],[.67,"enter"]],
 [[.21,"ctrl"],[.46,"div"]],
 [[.10,"4"],[.23,"ee"],[.36,"5"],[.49,"mul"],[.62,"3"],[.78,"ee"]],
 [[.09,"neg"],[.21,"2"],[.34,"down"],[.47,"2"],[.59,"ee"],[.71,"3"],[.85,"enter"]],
 [],[],[],[]
];
const chapters=[[0,"Open Calculator"],[1,"Set up the fraction"],[2,"Find EE"],[3,"Enter the negative exponent"],[4,"Read the result"],[6,"Round on paper"]];
const teaching=[
 "Press Home. Choose 1: New, then Enter on Add Calculator.",
 "Press Ctrl, then ÷. The top box is for the numerator; the bottom box is for the denominator.",
 "Find EE at the far left of the letter keys. Type 4, EE, 5, then ×. Start the next factor with 3, EE.",
 "Use (−), just left of Enter, for a negative exponent. Type 2, then ↓ to the denominator. Type 2, EE, 3, then Enter.",
 "Read the result from the Calculator history. Keep it unrounded until the last step.",
 "E means “times ten to the power of”. In the entry, 3E−2 means 3 × 10⁻².",
 "Give an exact answer if you have one. Otherwise round the final answer to three significant figures, unless the question asks for something else.",
 correctedEnding
];
const keyNames={ctrl:"Ctrl",div:"÷",ee:"EE",neg:"(−)",mul:"×",enter:"Enter",down:"↓",home:"Home"};
let mode="watch",state=M.pristine("calc",task.expr),t=0,playing=false,pending=false,epoch=0,raf=0,base=0,phase="",sound=true,stamp="",showCaptions=false,initiated=false;
let layout=TeachingHolds.make(beats), duration=layout.duration,activeFrame="";
const framingKey="qb-calculator-watch-frame";
function readFrame(){try{return localStorage.getItem(framingKey)==="full"?"full":"screen";}catch{return "screen";}}
let framing=readFrame();
const chrome=CalculatorWatchPlayer.mount({player:stage,surface,play,seek,expand:$("fullscreen"),feedback:overlay,active:()=>mode==="watch"});
function paintFraming(){
 const next=mode!=="watch"?"full":framing;
 if(activeFrame===next)return;
 activeFrame=next;
 stage.classList.toggle("ct01-screen-view",mode==="watch"&&next==="screen");
 $("view-full").setAttribute("aria-pressed",String(next==="full"));
 $("view-screen").setAttribute("aria-pressed",String(next==="screen"));
 fitBankWatch();
}
function chooseFrame(value){
 framing=value;try{localStorage.setItem(framingKey,value);}catch{}
 paintFraming();
}
$("view-full").addEventListener("click",()=>chooseFrame("full"));
$("view-screen").addEventListener("click",()=>chooseFrame("screen"));
window.addEventListener("storage",e=>{if(!e.key||e.key===framingKey){framing=readFrame();paintFraming();}});
function captions(v){
 showCaptions=v;
 $("cc").setAttribute("aria-pressed",String(v));
 $("cc").setAttribute("aria-label",v?"Hide captions":"Show captions");
 $("caption-band").hidden=mode!=="watch"||!v;
}
$("cc").addEventListener("click",()=>captions(!showCaptions));
$("transcript").textContent=cue.map(([,spoken])=>spoken).join(" ")+" [Unvoiced final note] "+correctedEnding;
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
 let s=M.pristine("off"),key="",prev="",last="",eventIndex=-1;
 for(const [i,row] of actions.entries()){
  const span=layout.spans[i];
  for(const [position,k] of row){
   const when=span.voiceEnd+(span.end-span.voiceEnd)*position;
   if(when>time)break;
   const held=s.ctrl;
   s=M.pressed(s,k);eventIndex++;
   last=held&&k!=="ctrl"?"ctrl+"+k:k;
   if(time<when+.45){key=k;prev=held&&k!=="ctrl"?"ctrl":"";}
   else{key="";prev="";}
  }
 }
 return {s,key,prev,last,eventIndex};
}
function renderWatch(){
 if(mode!=="watch")return;
 const point=layout.at(t), a=point.span.i,c=chapters.findLastIndex(x=>x[0]<=a), f=snapshot(t);
 seek.value=t;
 seek.setAttribute("aria-valuetext",fmt(t>=duration-.015?Math.round(duration):t)+" of "+fmt(Math.round(duration)));
 $("clock").textContent=fmt(t>=duration-.015?Math.round(duration):t)+" / "+fmt(Math.round(duration));
 paintFraming();
 const active=railGroups[c];
 const latest=railEvents[f.eventIndex];
 chapterRail.setState({chapterId:active.id,keyId:latest?.chapter===active.id?latest.id:null});
 shell.setKeys([f.prev,f.key].filter(Boolean));
 $("active-key").textContent=f.last?f.last.split("+").map(k=>keyNames[k]||k).join(" + "):"—";
 if(!initiated){overlay.hidden=t>.04;overlay.dataset.initial="true";}
 const source=point.audioTime,end=Number.isFinite(beats[a+1]?.[0])?beats[a][1]-.16:26.77;
 const caption=point.speaking&&a<recordedBeatCount&&source>=cue[a][0]&&source<end?cue[a][1]:"";
 if(sound){$("media-status").textContent="Final note is on screen only";$("media-status").hidden=a<recordedBeatCount;}
 $("caption").textContent=caption;
 const next=JSON.stringify([a,c,f.s]);
 if(next===stamp)return;stamp=next;
 renderLCD(f.s);
 const note=$("takeaway");note.hidden=false;note.textContent=teaching[a];


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
 play.setAttribute("aria-label",name);play.title=name;play.dataset.playing=String(playing);
 play.querySelector(".play-icon").toggleAttribute("hidden",playing);play.querySelector(".pause-icon").toggleAttribute("hidden",!playing);
}
function pause(){
 epoch++;pending=false;playing=false;phase="";audio.pause();cancelAnimationFrame(raf);label();renderWatch();
}
function go(time){
 const resume=playing||pending;
 if(resume)pause();
 t=Math.max(0,Math.min(duration,Number(time)||0));
 if(sound&&layout.at(t).span.i<recordedBeatCount&&Number.isFinite(audio.duration))audio.currentTime=Math.min(audio.duration,layout.at(t).audioTime);
 renderWatch();label();if(resume)void start(false);
}
function finish(){pause();t=duration;renderWatch();label();}
function fallback(){
 if(!sound)return;
 sound=false;audio.pause();base=performance.now()-t*1000;
 $("media-status").textContent="Captions only";$("media-status").hidden=false;$("sound").hidden=true;captions(true);
}
async function enterPhase(id){
 const p=layout.at(t);base=performance.now()-t*1000;
 phase=p.speaking?"voice":"hold";
 if(sound&&p.speaking&&p.span.i<recordedBeatCount){
  try{
   audio.currentTime=Math.min(Number.isFinite(audio.duration)?audio.duration:p.audioTime,p.audioTime);
   audio.playbackRate=1;
   // A media request can remain pending during a seek (for example if a
   // browser cannot resume its network stream). Don't strand the Watch clock.
   let deadline;
   try{await Promise.race([audio.play(),new Promise((_,reject)=>{deadline=setTimeout(()=>reject(Error("audio seek timed out")),4500);})]);}
   finally{clearTimeout(deadline);}
  } catch {if(id!==epoch)return false;fallback();}
 }else audio.pause();
 return id===epoch&&mode==="watch";
}
function step(now){
 if(!playing||mode!=="watch")return;
 const p=layout.at(t),s=p.span;
 if(phase==="voice"&&sound&&s.i<recordedBeatCount){
  t=Math.min(s.voiceEnd,s.start+Math.max(0,audio.currentTime-s.from));
  if(audio.currentTime>=s.to-.014||audio.ended){
   audio.pause();t=s.voiceEnd;phase="hold";base=performance.now()-t*1000;
  }
 }else if(phase==="voice"){
  t=Math.min(s.voiceEnd,(now-base)/1000);
  if(t>=s.voiceEnd){phase="hold";base=performance.now()-t*1000;}
 }else{
  t=Math.min(s.end,(now-base)/1000);
  if(t>=duration){finish();return;}
  if(t>=s.end){
   const id=epoch;
   renderWatch();
   void enterPhase(id).then(ok=>{if(ok&&playing)raf=requestAnimationFrame(step);});
   return;
  }
 }
 renderWatch();raf=requestAnimationFrame(step);
}
async function start(manual=true){
 if(mode!=="watch")return;
 initiated=true;overlay.dataset.initial="false";
 if(t>=duration-.015)t=0;
 const id=++epoch;pending=true;
 if(!await enterPhase(id))return;
 pending=false;playing=true;renderWatch();label();if(manual)chrome.flash(true);raf=requestAnimationFrame(step);
}
function toggle(){if(playing||pending){pause();chrome.flash(false);}else void start();}
function setMode(next){
 if(next===mode)return;
 pause();chrome.clear();void chrome.exit();
 mode=next;stage.dataset.mode=mode;stamp="";paintFraming();captions(showCaptions);
 for(const [i,n] of names.entries()){const selected=(i===0)===(mode==="watch");n.setAttribute("aria-selected",String(selected));n.tabIndex=selected?0:-1;}
 for(const id of ["try-panel","try-player","challenge"])$(id).hidden=next!=="try";
 for(const id of ["watch-panel","watch-player","key-strip"])$(id).hidden=next!=="watch";
 lcd.tabIndex=next==="try"?0:-1;
 shell.setInteractive(next==="try");shell.setKeys([]);
 if(mode==="watch"){renderWatch();label();fitBankWatch();}
 else{overlay.hidden=true;renderTry();}
}
for(const [i,n] of names.entries()){
 n.addEventListener("click",()=>setMode(i===0?"watch":"try"));
 n.addEventListener("keydown",e=>{if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();const other=names[1-i];other.click();other.focus();}});
}
audio.addEventListener("error",fallback);
document.addEventListener("visibilitychange",()=>{if(document.hidden&&(playing||pending))pause();});
$("sound").addEventListener("click",()=>{
 audio.muted=!audio.muted; $("sound").setAttribute("aria-pressed",String(audio.muted));
 const name=audio.muted?"Unmute narration":"Mute narration";
 $("sound").setAttribute("aria-label",name);$("sound").title=name;
  $("sound").querySelector(".sound-waves").toggleAttribute("hidden",audio.muted);
  $("sound").querySelector(".sound-off").toggleAttribute("hidden",!audio.muted);
});
audio.playbackRate=1;
audio.preservesPitch=true;
$("play-rate").addEventListener("change",e=>{
 const resume=playing||pending;
 if(resume)pause();
 const previous=layout;
 layout=TeachingHolds.make(beats,Number(e.target.value));duration=layout.duration;
 t=layout.remap(previous,t);seek.max=duration;
 renderWatch();label();if(resume)void start(false);
});

play.addEventListener("click",toggle);
seek.addEventListener("input",()=>go(seek.value));
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
 const chk=M.grade($("answer").value,task.value,task.sf,{explicitPrecision:task.explicitPrecision}),f=$("feedback");
 const msg={correct:task.explicitPrecision?"Correct value and precision.":"Correct.",precision:"The value is right. Show exactly "+task.sf+" significant figures.",format:"Use a decimal or E notation, such as 3.40E−2.",value:"Not quite. Recheck the grouping and round only at the end."};
 f.textContent=msg[chk.kind];f.className="feedback "+(chk.ok?"is-right":"is-wrong");
});
document.addEventListener("keydown",e=>{
 const target=e.target;
 if(e.metaKey||e.altKey||target?.closest?.("input,select,a,summary,textarea,[contenteditable]"))return;
 if(target?.closest?.("button")&&["Enter"," ","Tab"].includes(e.key))return;
 if(mode!=="try")return;
 if(e.ctrlKey){if(e.key==="/"){e.preventDefault();doKey("ctrl");doKey("div");}return;}
 const k=e.key, z=k.toLowerCase();
 if(z==="tab")return;
 const keyMap={Backspace:"del",Delete:"del",Escape:"esc",Enter:"enter",ArrowLeft:"left",ArrowRight:"right",ArrowDown:"down",ArrowUp:"up",Home:"home","(":"lparen",")":"rparen","*":"mul","/":"div","-":/E$/i.test(state.frac?state.frac[state.frac.active]:state.entry)?"neg":"minus","+":"plus","^":"power",".":"dot",e:state.app==="calc"||state.app==="scratch"?"ee":"e",a:"a"};
 const match=keyMap[k]??keyMap[z]??(/^[0-9]$/.test(k)?k:null);
 if(match){e.preventDefault();doKey(match);shell.setKeys([match]);setTimeout(()=>{if(mode==="try")shell.setKeys([]);},125);}
});
const keyTrailName={down:"Down arrow",neg:"Negative key",ee:"E E",div:"Divide",mul:"Multiply"};
const railGroups=chapters.map(([beat,title],i)=>{
 const id="step-"+(i+1);
 return {id,title,keys:actions[beat].map(([,key],j)=>({id:id+"-"+(j+1),label:keyNames[key]||key,ariaLabel:keyTrailName[key]||keyNames[key]||key,chapter:id}))};
});
const railEvents=railGroups.flatMap(g=>g.keys);
const chapterRail=CalculatorWatchChapters.mount($("steps"),railGroups,{label:"Steps and calculator keys",
 onChapter:id=>go(layout.spans[chapters[railGroups.findIndex(g=>g.id===id)][0]].start)
});
const sup={"-":"⁻","+":"⁺","0":"⁰","1":"¹","2":"²","3":"³","4":"⁴","5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹"};
const written=task.expr.replace(/(\d+(?:\.\d+)?)[eE]([+-]?\d+)/g,(_,c,e)=>c+" × 10"+[...e].map(v=>sup[v]).join("")).replace(/\*/g," × ").replace(/\//g," ÷ ").replace(/-/g,"−");
$("question").textContent="Evaluate "+written+". "+(task.explicitPrecision ? "Give the answer to "+task.sf+" significant figure"+(task.sf===1?"":"s")+"." : "Give the exact answer if you can, or round to three significant figures.");
if(invalidLink)$("question").prepend("The linked expression could not be loaded. Default example: ");
seek.max=duration;stage.dataset.mode="watch";paintFraming();renderWatch();label();
if(approach.get("mode")==="try")setMode("try");

function fitBankWatch(){
 if(mode!=="watch"||!shell.body.offsetWidth)return;
 const full=document.fullscreenElement===stage||stage.classList.contains("watch-fullscreen-fallback");
 const nav=full?0:document.querySelector(".tabbar").getBoundingClientRect().height;
 const box=stage.getBoundingClientRect();
 const vh=window.visualViewport?.height||innerHeight;
 const occupied=$("watch-player").offsetHeight+$("caption-band").offsetHeight+(innerWidth<=700?$("watch-panel").offsetHeight+10:0);
 const room=vh-nav-(full?0:box.top+window.scrollY)-occupied-25;
 stage.style.setProperty("--ct01-handset-fit",Math.floor(Math.max(!full&&innerHeight<660&&innerWidth<381?75:120,Math.min(full?620:296,(room-28)*558/1168)))+"px");
 stage.style.setProperty("--ct01-lcd-fit",Math.floor(Math.max(142,Math.min(full?1160:600,(room-31)*4/3)))+"px");
}
const bankWatchSizing=new ResizeObserver(fitBankWatch);
[$("watch-player"),$("caption-band"),$("watch-panel"),document.querySelector("main>.header")].forEach(el=>bankWatchSizing.observe(el));
window.addEventListener("resize",fitBankWatch);
document.addEventListener("fullscreenchange",fitBankWatch);
new MutationObserver(fitBankWatch).observe(stage,{attributes:true,attributeFilter:["class"]});
fitBankWatch();
})();
