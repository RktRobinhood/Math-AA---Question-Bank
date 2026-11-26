"use strict";
(function(){
const M=SimulationMath,$=id=>document.getElementById(id),stage=$("stage"),seek=$("seek"),play=$("play"),overlay=$("start-overlay");
const D=49;
const chapters=[
 [0,"Code the model","A fair five-sector spinner has blue sectors 1 and 2. Use one random integer from 1 to 5 for each spin.","5 equal sectors · 2 blue"],
 [6,"Find random integers","On a Calculator page open Probability, Random, then Integer.","Menu → 5 → 4 → 2"],
 [13,"Set the trial count","Enter the first label, last label, and number of spins. Both labels are included.","randInt(1,5,12)"],
 [24,"Count from the actual list","Count every blue result, including repeats. Here 1 or 2 appears five times in the 12 observed outcomes.","First run: 5 ÷ 12 ≈ 0.417"],
 [32,"Run the same model again","Choose the same command with the same inputs. Press Enter again after entering those inputs; the new run uses fresh draws.","Same model and trial count, new sample"],
 [42,"Compare estimate with model","The next list gives three blues in 12 spins. The estimates differ; the exact 2 ÷ 5 stays the same.","0.417 and 0.250 are estimates · 0.400 is exact"]
];
const actions=[[7,"menu"],[8.16,"5"],[9.32,"4"],[10.6,"2"],[14,"1"],[15,"comma"],[16,"5"],[17,"comma"],[18.2,"1"],[19.3,"2"],[20.5,"rparen"],[22,"enter"],
 [32.25,"menu"],[33,"5"],[33.75,"4"],[34.45,"2"],[35.2,"1"],[35.75,"comma"],[36.25,"5"],[36.75,"comma"],[37.25,"1"],[37.75,"2"],[38.25,"rparen"],[40.25,"enter"]];
const menuRows=[["1: Actions","2: Number","3: Algebra","4: Calculus","5: Probability","6: Statistics","7: Matrix & Vector","8: Finance","9: Functions"],
 ["1: Factorial (!)","2: Permutations","3: Combinations","4: Random","5: Distributions"],
 ["1: Number","2: Integer","3: Binomial","4: Normal","5: Sample","6: Seed"]],path=["5","4","2"];
const req=M.query(location.search),tabs=[$("watch-tab"),$("try-tab")],txids=["data-form","answer","edit-details"];
const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;};
const state0=data=>({data,expression:"",caret:0,menu:-1,selection:0,history:[],error:""});
let problem=req.problem,practice=state0(problem),state=practice,warning=req.error?"Could not load that linked question. The original Try exercise is shown. "+req.error:"",draftError="",answerFeedback={text:"",error:false};
let mode="watch",clock=0,playing=false,started=false,frame=0,origin=0,stamp="",focusOn=false,preferFocus=false,firstWatch=true,light=0,forkKey=null;
const forks=new Map();
const shell=HandheldShell.mount({host:$("handheld-host"),screen:$("lcd"),interactive:false,label:"TI-Nspire CX II-T Calculator trainer",onKey:physical});
function mutate(base,key,fixture=null){
 const s={...base,error:""};
 if(key==="menu"){s.menu=0;s.selection=0;return s;}
 if(key==="esc"){if(s.menu>=0){s.menu--;s.selection=0;}else{s.expression="";s.caret=0;}return s;}
 if(s.menu>=0){
  const rows=menuRows[s.menu];
  if(key==="up"||key==="down"){s.selection=(s.selection+(key==="up"?-1:1)+rows.length)%rows.length;return s;}
  if(key==="left"){s.menu--;s.selection=0;return s;}
  const digit=(key==="right"||key==="enter")?rows[s.selection][0]:key;
  if(digit!==path[s.menu])return s;
  if(s.menu<2){s.menu++;s.selection=0;}else{
   s.expression=s.expression.slice(0,s.caret)+"randInt("+s.expression.slice(s.caret);
   s.caret+=8;s.menu=-1;
  }
  return s;
 }
 if(key==="enter"){
  if(!s.expression)return s;
  try{
   const args=M.params(s.expression),list=fixture?fixture:M.sample(args);
   s.history=[...s.history.slice(-6),{...args,list}];s.expression="";s.caret=0;
  }catch(e){s.error=e.message;}
  return s;
 }
 if(key==="left"||key==="right"){s.caret=Math.max(0,Math.min(s.expression.length,s.caret+(key==="left"?-1:1)));return s;}
 if(key==="del"&&s.caret>0){s.expression=s.expression.slice(0,s.caret-1)+s.expression.slice(s.caret);s.caret--;return s;}
 const ch=/^[0-9a-z]$/.test(key)?key:{comma:",",lparen:"(",rparen:")",space:" "}[key];
 if(ch&&s.expression.length<64){s.expression=s.expression.slice(0,s.caret)+ch+s.expression.slice(s.caret);s.caret++;}
 return s;
}
const fmt=t=>Math.floor(t/60)+":"+String(Math.floor(t)%60).padStart(2,"0");
function renderLCD(s,watch){
 const d=$("lcd-body");d.replaceChildren();let description="";
 if(s.menu>=0){
  const pane=node("div",undefined,"menu-stack");pane.dataset.depth=s.menu;
  for(let level=0;level<=s.menu;level++){
   const list=node("ul");menuRows[level].forEach((item,i)=>{
    const li=node("li"),active=level===s.menu?s.selection===i:item[0]===path[level];
    const b=node(watch||level!==s.menu?"span":"button",item,active?"calc-active":"");
    if(b.tagName==="BUTTON"){b.type="button";b.onclick=()=>physical(item[0]);}
    li.append(b);list.append(li);
   });pane.append(list);
  }
  d.append(pane);description=menuRows[s.menu].join("; ");
 }else{
  const hist=node("div",undefined,"lcd-history");
  s.history.slice(-2).forEach(r=>{
   const row=node("div",undefined,"lcd-expression"),out=r.many?"{"+r.list.join(",")+"}":String(r.list[0]);
   row.append(node("p",r.command),node("p",out,"lcd-result"));hist.append(row);
  });
  d.append(hist);
  const entry=node("p",undefined,"lcd-entry");
  entry.append(document.createTextNode(s.expression.slice(0,s.caret)),node("i",undefined,"lcd-caret"),document.createTextNode(s.expression.slice(s.caret)));
  d.append(entry);if(s.error)d.append(node("p","Error: "+s.error,"lcd-error"));
  const last=s.history.at(-1);description=(last?last.command+" returned "+last.list.join(", ")+". ":"")+(s.expression?"Entry: "+s.expression:(!last?"Calculator ready.":""));
 }
 $("lcd-text").textContent=description;
 stage.dataset.scene=s.menu>=0?"menu-"+s.menu:s.expression?"entry":s.history.length?"result":"idle";
}
function snapshot(t){
 let s=state0(M.demo),key="",runs=0;
 for(const [at,k] of actions){
  if(at>t)break;
  s=mutate(s,k,k==="enter"?M.tape[runs++]:null);
  key=t<at+.38?k:"";
 }
 return {s,key};
}
function status(id,text,error=false){const el=$(id);el.textContent=text;el.dataset.error=String(error);}
function show(id,on){$(id).hidden=!on;}
function tryPrompt(p){
 return "A fair spinner has "+p.sides+" sectors. "+(p.target===1?"Only sector 1 is blue.":"Sectors 1–"+p.target+" are blue.")+" Simulate "+p.trials+" spins.";
}
function paintTry(){
 renderLCD(state,false);
 const fork=forkKey!==null, run=state.history.at(-1);
 $("try-context").textContent=fork?"Continue the frozen Watch example in a copy.":tryPrompt(problem);
 $("keys-help").textContent="Open Menu → 5 → 4 → 2. Enter the first label, last label and number of spins; then press Enter. Keyboard: M opens Menu.";
 $("reset").textContent=fork?"Return to Try":"Reset Try";
 txids.forEach(id=>show(id,!fork));show("inspect",!!run);
 if(run){
  $("run-title").textContent="Most recent run · "+run.list.length+(run.list.length===1?" outcome":" outcomes");
  $("outcomes").replaceChildren(...run.list.map(x=>node("li",String(x))));
 }
 status("tool-status",state.error||(!fork&&(draftError||warning))||"",Boolean(state.error||!fork&&(draftError||warning)));
 status("assess-feedback",answerFeedback.text,answerFeedback.error);
}
function physical(k){
 if(mode!=="try")return;
 if(document.activeElement!==stage)stage.focus({preventScroll:true});
 clearTimeout(light);shell.setKeys([k]);light=setTimeout(()=>shell.setKeys([]),170);
 const next=mutate(state,k),newRun=next.history!==state.history;state=next;
 if(forkKey!==null){
  forks.set(forkKey,state);if(forks.size>30)forks.delete(forks.keys().next().value);
 }else{
  practice=state;
  if(newRun){$("answer").reset();answerFeedback={text:"",error:false};}
 }
 paintTry();
}
function fillInputs(){M.keys.forEach(k=>$("input-"+k).value=problem[k]);}
function clearTry(resetProblem){
 if(resetProblem){problem=req.problem;fillInputs();}
 practice=state=state0(problem);$("answer").reset();$("edit-details").open=false;
 answerFeedback={text:"",error:false};warning="";draftError="";
}
$("data-form").onsubmit=e=>{
 e.preventDefault();if(forkKey!==null)return;
 const next=Object.fromEntries(M.keys.map(k=>[k,M.uint($("input-"+k).value)]));
 const error=M.validate(next);if(error){draftError=error;paintTry();return;}
 problem=next;clearTry(false);paintTry();stage.focus({preventScroll:true});
};
$("data-form").oninput=()=>{if(draftError){draftError="";paintTry();}};
$("answer").onsubmit=e=>{
 e.preventDefault();if(forkKey!==null)return;
 const a=Object.fromEntries(["count","empirical","model"].map(k=>[k,$("answer-"+k).value]));
 const msg=M.check(problem,state.history.at(-1),a);answerFeedback={text:msg||"Correct. Your sample gives an estimate; the sector model gives the exact probability.",error:!!msg};
 status("assess-feedback",answerFeedback.text,answerFeedback.error);
};
$("answer").oninput=()=>{answerFeedback={text:"",error:false};status("assess-feedback","");};
chapters.forEach(([at,label],i)=>{
 const li=node("li"),b=node("button");b.type="button";b.onclick=()=>seekTo(at);
 b.append(node("span",String(i+1).padStart(2,"0")),document.createTextNode(label));li.append(b);$("chapters").append(li);
});
function canFork(){return clock>0&&clock<D-.015;}
function watch(){
 if(mode!=="watch")return;
 const {s,key}=snapshot(clock),ch=chapters.findLastIndex(x=>x[0]<=clock);
 seek.value=clock;$("clock").textContent=fmt(clock)+" / "+fmt(D);seek.setAttribute("aria-valuetext",fmt(clock)+" of "+fmt(D));
 shell.setKeys(key?[key]:[]);overlay.hidden=started||clock>0;$("take").textContent=canFork()?"Take over":"Open Try";
 const next=JSON.stringify([ch,s]);if(stamp===next)return;
 stamp=next;renderLCD(s,true);$("caption").textContent=chapters[ch][2];$("takeaway").textContent=chapters[ch][3];
 [...$("chapters").children].forEach((li,i)=>li.firstElementChild.setAttribute("aria-current",String(i===ch)));
}
function navigationInset(){return document.querySelector(".tabbar")?.offsetHeight||0;}
function size(){
 const vh=window.visualViewport?.height||innerHeight, host=$("handheld-host");
 const width=Math.max(150,Math.min(307,Math.floor((vh-host.getBoundingClientRect().top-window.scrollY-9)*558/1168)));
 if(mode==="try"){stage.style.setProperty("--try-fit",width+"px");return;}
 const compact=focusOn&&innerWidth>=740&&vh<630;
 const y=(Math.max(0,stage.getBoundingClientRect().top)+navigationInset());
 const fixed=$("watch-player").offsetHeight+(compact?0:$("watch-message").offsetHeight)+18;
 stage.style.setProperty("--watch-fit",Math.max(100,Math.min(focusOn?345:295,Math.floor((vh-y-fixed)*558/1168)))+"px");
}
new ResizeObserver(size).observe($("watch-message"));
new ResizeObserver(size).observe($("watch-player"));
new ResizeObserver(size).observe($("try-header"));
addEventListener("resize",size);window.visualViewport?.addEventListener("resize",size);
function focus(on){
 focusOn=on;stage.classList.toggle("focus-open",on);document.body.classList.toggle("stats-focus",on);
 for(const el of document.querySelectorAll("main > .head, main > .calc-tabs, main > .notes"))el.inert=on;
 const f=$("focus");f.textContent=on?"Exit":"Focus";f.setAttribute("aria-pressed",String(on));
 f.setAttribute("aria-label",on?"Exit focused view":"Focused view");if(on)stage.scrollTop=0;size();
}
function labelPlay(){const s=playing?"Pause":clock>=D-.015?"Replay":"Play";play.textContent=s;play.setAttribute("aria-label",s);}
function seekTo(t){clock=Math.min(D,Math.max(0,Number(t)||0));origin=performance.now()-clock*1000;watch();labelPlay();}
function pause(){playing=false;cancelAnimationFrame(frame);watch();labelPlay();}
function tick(t){if(!playing||mode!=="watch")return;clock=Math.min(D,Math.max(0,(t-origin)/1000));watch();if(clock>=D){pause();return;}frame=requestAnimationFrame(tick);}
function start(){if(mode!=="watch")return;if(document.activeElement===overlay)play.focus({preventScroll:true});
 started=true;if(clock>=D-.015)seekTo(0);playing=true;origin=performance.now()-clock*1000;watch();labelPlay();frame=requestAnimationFrame(tick);}
function toggle(){if(playing)pause();else start();}
play.onclick=overlay.onclick=toggle;seek.max=D;seek.oninput=()=>seekTo(seek.value);
$("back").onclick=()=>seekTo(clock-10);$("forward").onclick=()=>seekTo(clock+10);
$("replay").onclick=()=>{pause();seekTo(0);start();};$("focus").onclick=()=>focus(!focusOn);
function switchMode(to,take=false){
 if(to==="try"&&mode==="watch"){
  pause();preferFocus=focusOn;if(focusOn)focus(false);
  forkKey=take&&canFork()?String(Math.round(clock*1000)):null;
  state=forkKey===null?practice:forks.get(forkKey)||snapshot(clock).s;
 }else if(to==="try"&&!take&&forkKey!==null){forkKey=null;state=practice;}
 mode=to;stage.dataset.mode=mode;stamp="";const w=mode==="watch";
 document.body.classList.toggle("stats-try",!w);
 ["watch-message","watch-player","watch-panel"].forEach(id=>show(id,w));["try-header","try-panel"].forEach(id=>show(id,!w));
 tabs.forEach((b,i)=>{const yes=w===(i===0);b.tabIndex=yes?0:-1;b.setAttribute("aria-selected",String(yes));});
 clearTimeout(light);shell.setKeys([]);shell.setInteractive(!w);
 if(w){watch();size();if(preferFocus||firstWatch&&(shell.body.getBoundingClientRect().width<205||$("watch-player").getBoundingClientRect().bottom>innerHeight-5))focus(true);firstWatch=false;}
 else{overlay.hidden=true;paintTry();size();}
}
tabs.forEach((b,i)=>{
 b.onclick=()=>{switchMode(i?"try":"watch");if(i)stage.focus({preventScroll:true});};
 b.onkeydown=e=>{if(!["ArrowLeft","ArrowRight","Home","End"].includes(e.key))return;
 e.preventDefault();const next=e.key==="Home"?0:e.key==="End"?1:1-i;switchMode(next?"try":"watch");if(focusOn)play.focus({preventScroll:true});else tabs[next].focus();};
});
$("take").onclick=()=>{switchMode("try",true);stage.focus({preventScroll:true});};
$("return").onclick=()=>{switchMode("watch");play.focus({preventScroll:true});};
$("reset").onclick=()=>{if(forkKey!==null){forkKey=null;state=practice;}else clearTry(true);paintTry();stage.focus({preventScroll:true});};
document.addEventListener("keydown",e=>{
 if(e.target!==document.body&&!e.target.closest?.(".qb-calculator-lesson"))return;
 const el=e.target;
 if(e.key==="Escape"&&focusOn){e.preventDefault();focus(false);$("focus").focus({preventScroll:true});return;}
 if(e.altKey||e.metaKey||e.ctrlKey||el.closest("input,textarea,select,a,summary,[contenteditable]"))return;
 if(mode==="watch"){if(el.closest("button")||e.repeat)return;const k=e.key.toLowerCase();if(k==="k"||k===" "){e.preventDefault();toggle();}else if(k==="j"||k==="l"){e.preventDefault();seekTo(clock+(k==="j"?-10:10));}return;}
 if((!stage.contains(el)&&el!==document.body)||(el.closest("button")&&["Enter"," "].includes(e.key)))return;
 const shortcuts={Escape:"esc",Enter:"enter",Backspace:"del",Delete:"del",ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down",",":"comma","(":"lparen",")":"rparen"," ":"space"};
 const k=shortcuts[e.key]||(e.key.toLowerCase()==="m"?"menu":/^[a-z0-9]$/i.test(e.key)?e.key.toLowerCase():"");
 if(k){e.preventDefault();physical(k);}
});
fillInputs();switchMode(req.mode);
window.QBRecordedWatch?.bind(pause);
})();
