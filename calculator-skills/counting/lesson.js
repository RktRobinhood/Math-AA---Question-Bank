"use strict";
(function(){
const $=id=>document.getElementById(id),M=CT03,T=CT03Tape;
const stage=$("stage"),seek=$("seek"),play=$("play"),overlay=$("start-overlay"),op=$("op"),n=$("n"),r=$("r");
const params=new URLSearchParams(location.search),original={op:"ncr",n:11,r:4};
let task=original,linked=false,invalid=false;
try{const p=M.link(params);if(p){task=p;linked=true;}}catch{invalid=true;}
const goal=M.count(task),fmt=x=>Math.floor(x/60)+":"+String(Math.floor(x)%60).padStart(2,"0");
const node=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=value;return e;};
let mode="watch",state=M.base(),worked=false,focusOn=false,considered=false,firstWatch=true,clock=0,origin=0,frame=0,playing=false,started=false,stamp="",typedNote="";
const FORK_LIMIT=24, forks=new Map();
let practice=null,activeFork=null;
const answer=$("answer"),feedback=$("feedback");
function captureTry(){return {state,worked,typedNote,form:[op.value,n.value,r.value],answer:answer.value,feedback:feedback.textContent,error:feedback.getAttribute("data-error")};}
function restoreTry(d){
 state=d.state;worked=d.worked;typedNote=d.typedNote;
 [op.value,n.value,r.value]=d.form;
 answer.value=d.answer;feedback.textContent=d.feedback;
 if(d.error===null)feedback.removeAttribute("data-error");else feedback.setAttribute("data-error",d.error);
}
function saveFork(key,d){
 forks.delete(key);forks.set(key,d);
 if(forks.size>FORK_LIMIT)forks.delete(forks.keys().next().value);
}
function newFork(){
 const {s}=snapshot(clock),formula=s.entry||s.rows.at(-1)?.text||"";
 const combo=/^nCr\((\d*)(?:,(\d*))?/.exec(formula),fact=/^(\d+)!?$/.exec(formula);
 const opName=clock>=T.chapters[2][0]?"ncr":"fact";
 const form=opName==="ncr"?[opName,combo?.[1]??"",combo?.[2]??""]:[opName,fact?.[1]??"",""];
 return {state:s,worked:false,typedNote:"",form,answer:"",feedback:"",error:null};
}
const shell=HandheldShell.mount({host:$("handheld-host"),screen:$("lcd"),label:"TI-Nspire CX II-T Calculator",interactive:false,onKey:press});
const tabs=[$("watch-tab"),$("try-tab")];
$("question").textContent=linked?(task.op==="fact"?"Evaluate "+M.expression(task)+" exactly.":"How many different groups of "+task.r+" items can be selected from "+task.n+" distinct items if order does not matter?"):"The curator has 11 different photos. How many groups of four can the curator archive if positions are not assigned?";
function clearFeedback(){$("feedback").textContent="";}
function sync(p){op.value=p.op;n.value=String(p.n);r.value=p.r===null?"":String(p.r);}
function preferred(){try{return M.problem(op.value,n.value,r.value);}catch{return null;}}
function exerciseActive(){
 if(activeFork!==null||!M.same(preferred(),task))return false;
 const input=state.entry||state.rows.at(-1)?.text;
 if(!input)return true;
 try{return M.same(M.parse(input),task);}catch{return true;}
}
function lcd(s,isTry=false){
 const b=$("lcd-body"),lines=[];
 b.replaceChildren();b.classList.toggle("case-error",Boolean(s.error));
 if(s.page==="calc"){
  for(const q of s.rows){
   const h=node("div","lcd-expression",q.text);h.append(node("div","lcd-result",q.value));b.append(h);
  }
  const e=node("div","lcd-entry"),caret=node("i","lcd-caret");caret.setAttribute("aria-hidden","true");
  e.append(s.entry.slice(0,s.at),caret,s.entry.slice(s.at));b.append(e);
  lines.push("Entry: "+(s.entry||"blank"));
 }else{
  const container=node("div","menu-stack");
  const panel=(id,active)=>{
   const ul=node("ul",id);
   M.MENU[id].forEach((text,i)=>{
    const li=node("li",""),live=isTry&&id===s.page;
    const row=node(live?"button":"span",i===active?"calc-active":"",text);
    if(live){row.type="button";row.addEventListener("click",()=>{press(String(i+1));stage.focus({preventScroll:true});});}
    li.append(row);ul.append(li);
   });
   return ul;
  };
  container.append(panel("main",s.page==="prob"?4:s.selected));if(s.page==="prob")container.append(panel("prob",s.selected));b.append(container);
  lines.push(s.page==="main"?"Menu. Select 5: Probability":"Probability. 1: Factorial. 3: Combinations");
 }
 if(s.error)b.append(node("div","lcd-error",s.error));
 const q=s.rows.at(-1);
 if(q)lines.push("Last calculation: "+q.text+" equals "+q.value);
 if(s.error)lines.push(s.error.replace(/[.!?]$/,""));
 $("lcd-text").textContent=lines.join(". ")+".";
}
function snapshot(t){
 let s=M.base(),highlight="";
 for(const [at,key] of T.keys){if(at>t)break;s=M.key(s,key);highlight=t<at+.34?key:"";}
 return {s,highlight};
}
T.chapters.forEach(([at,title],i)=>{
 const li=node("li",""),b=node("button",""),serial=node("span","","0"+(i+1));
 b.append(serial,document.createTextNode(title));b.type="button";b.addEventListener("click",()=>go(at));li.append(b);$("chapters").append(li);
});
const canFork=()=>!linked&&!invalid&&clock>0&&clock<T.duration-.015;
function paintWatch(){
 if(mode!=="watch")return;
 const {s,highlight}=snapshot(clock),c=T.captions.findLastIndex(x=>x[0]<=clock),j=T.chapters.findLastIndex(x=>x[0]<=clock);
 seek.value=clock;seek.setAttribute("aria-valuetext",fmt(clock)+" of "+fmt(T.duration));$("clock").textContent=fmt(clock)+" / "+fmt(T.duration);
 shell.setKeys(highlight?[highlight]:[]);overlay.hidden=started||clock>0;$("take").textContent=canFork()?"Take over":"Open Try";
 const next=JSON.stringify([c,j,s]);if(next===stamp)return;stamp=next;
 lcd(s);$("caption").textContent=T.captions[c][1];$("takeaway").textContent=T.captions[c][2];
 [...$("chapters").children].forEach((e,i)=>e.firstElementChild.setAttribute("aria-current",String(i===j)));
}
function paintTry(){
 if(mode!=="try")return;
 lcd(state,true);
 const p=preferred(),check=exerciseActive(),fork=activeFork!==null;
 $("r-field").hidden=op.value==="fact";$("answer-form").hidden=!check;$("exercise-inactive").hidden=check;if(!check)clearFeedback();
 $("reset").textContent=fork?"Return to assigned Try":"Reset calculator";
 $("question").hidden=fork;
 $("exercise-inactive").textContent=fork?"This copy is for exploration. Return to assigned Try to use its answer check.":"Calculator is exploring another entry. Reset to return to this question and its answer check.";
 $("try-context").textContent=fork?"Continue the worked Watch example on this copy.":check?(task.op==="fact"?"Write the exact factorial.":"Choose "+task.r+" from "+task.n+" without assigning roles."):"Exploring another entry.";
 $("hint").textContent=state.page==="main"?"Choose 5: Probability.":state.page==="prob"?"Choose 1 for Factorial or 3 for Combinations.":(p?.op||op.value)==="fact"?"Type n first. Then use Menu → 5 → 1, or load the typed value below.":"Use Menu → 5 → 3, or load the typed values below.";
 const notice=state.error||typedNote|| (invalid&&!worked?"That Try link could not load. The original question is shown instead.":"");
 $("tool-status").textContent=notice;$("tool-status").dataset.error=String(Boolean(state.error||invalid&&!worked));
}
function press(key){
 if(mode!=="try")return;
 worked=true;typedNote="";state=M.key(state,key);paintTry();
}
function label(){const t=playing?"Pause":clock>=T.duration-.015?"Replay":"Play";play.textContent=t;play.setAttribute("aria-label",t);}
function go(t){clock=Math.min(T.duration,Math.max(0,Number(t)||0));origin=performance.now()-clock*1000;paintWatch();label();}
function pause(){playing=false;cancelAnimationFrame(frame);paintWatch();label();}
function tick(t){if(!playing||mode!=="watch")return;clock=Math.min(T.duration,Math.max(0,(t-origin)/1000));paintWatch();if(clock>=T.duration){pause();return;}frame=requestAnimationFrame(tick);}
function navigationInset(){return document.querySelector(".tabbar")?.offsetHeight||0;}
function size(){
 if(mode!=="watch")return;
 const avail=(window.visualViewport?.height||innerHeight)-(Math.max(0,stage.getBoundingClientRect().top)+navigationInset());
 const fixed=$("watch-message").offsetHeight+$("watch-player").offsetHeight+20;
 stage.style.setProperty("--watch-fit",Math.max(96,Math.min(focusOn?350:297,Math.floor((avail-fixed)*558/1168)))+"px");
}
const observer=new ResizeObserver(size);
for(const x of [$("watch-message"),$("watch-player"),document.querySelector(".head")])observer.observe(x);
window.addEventListener("resize",size);window.visualViewport?.addEventListener("resize",size);
function focus(v){
 focusOn=v;stage.classList.toggle("focus-open",v);document.body.classList.toggle("ct03-focus",v);
 const f=$("focus");f.textContent=v?"Exit":"Focus";f.setAttribute("aria-pressed",String(v));f.setAttribute("aria-label",v?"Exit focused view":"Focused view");if(v)stage.scrollTop=0;size();
}
function start(){
 if(mode!=="watch")return;
 if(!considered){considered=true;const h=window.visualViewport?.height||innerHeight;if($("watch-player").getBoundingClientRect().bottom>h-3||shell.body.getBoundingClientRect().width<185)focus(true);}
 if(document.activeElement===overlay)play.focus({preventScroll:true});
 started=true;if(clock>=T.duration-.015)go(0);
 playing=true;origin=performance.now()-clock*1000;paintWatch();label();frame=requestAnimationFrame(tick);
}
function toggle(){if(playing)pause();else start();}
play.addEventListener("click",toggle);overlay.addEventListener("click",toggle);
$("back").addEventListener("click",()=>go(clock-10));$("forward").addEventListener("click",()=>go(clock+10));
$("replay").addEventListener("click",()=>{pause();go(0);start();});
seek.addEventListener("input",()=>go(seek.value));$("focus").addEventListener("click",()=>{considered=true;focus(!focusOn);});
function switchTo(next,take=false){
 if(mode==="try"&&next==="watch"){
  if(activeFork===null)practice=captureTry();else saveFork(activeFork,captureTry());
 }
 if(next==="try"&&mode==="watch"){
  pause();if(focusOn)focus(false);
  activeFork=take&&canFork()?clock.toFixed(6):null;
  if(activeFork===null)restoreTry(practice);
  else{
   const draft=forks.get(activeFork)||newFork();
   saveFork(activeFork,draft);restoreTry(draft);
  }
 }
 mode=next;stage.dataset.mode=mode;stamp="";const watch=mode==="watch";
 ["watch-message","watch-player","watch-panel"].forEach(id=>$(id).hidden=!watch);
 ["try-header","try-panel","exercise"].forEach(id=>$(id).hidden=watch);
 tabs.forEach((b,i)=>{const yes=watch===(i===0);b.tabIndex=yes?0:-1;b.setAttribute("aria-selected",String(yes));});
 shell.setKeys([]);shell.setInteractive(!watch);
 if(watch){
  paintWatch();size();
  if(firstWatch){firstWatch=false;if(shell.body.getBoundingClientRect().width<156)focus(true);}
 }else{overlay.hidden=true;paintTry();}
}
tabs.forEach((b,i)=>{
 b.addEventListener("click",()=>{switchTo(i?"try":"watch");if(i)stage.focus({preventScroll:true});});
 b.addEventListener("keydown",e=>{if(["ArrowLeft","ArrowRight","Home","End"].includes(e.key)){e.preventDefault();const k=e.key==="Home"?0:e.key==="End"?1:1-i;switchTo(k?"try":"watch");tabs[k].focus();}});
});
$("take").addEventListener("click",()=>{switchTo("try",true);stage.focus({preventScroll:true});});
$("return").addEventListener("click",()=>{switchTo("watch");play.focus({preventScroll:true});});
$("reset").addEventListener("click",()=>{
 if(activeFork!==null){saveFork(activeFork,captureTry());activeFork=null;restoreTry(practice);}
 else{worked=true;state=M.base();typedNote="";sync(task);answer.value="";clearFeedback();}
 paintTry();stage.focus({preventScroll:true});
});
for(const el of [op,n,r])el.addEventListener(el===op?"change":"input",()=>{worked=true;typedNote="";state={...state,error:""};clearFeedback();paintTry();});
$("typed").addEventListener("submit",e=>{
 e.preventDefault();worked=true;
 try{
  const p=M.problem(op.value,n.value,r.value);
  state=M.load(state,p);
  typedNote="Entry loaded. Press Enter on the calculator to evaluate.";paintTry();stage.focus({preventScroll:true});
 }catch(e){typedNote="";state={...state,error:e.message};paintTry();}
});
document.addEventListener("keydown",e=>{
 if(e.target!==document.body&&!e.target.closest?.(".qb-calculator-lesson"))return;
 if(e.key==="Escape"&&focusOn){e.preventDefault();considered=true;focus(false);$("focus").focus();return;}
 const el=e.target;if(e.altKey||e.metaKey||e.ctrlKey||el.closest("input,textarea,select,a,summary,[contenteditable]"))return;
 if(mode==="watch"&&!el.closest("button")&&!e.repeat){
  const k=e.key.toLowerCase();if(k==="k"||k===" "){e.preventDefault();toggle();}else if(k==="j"||k==="l"){e.preventDefault();go(clock+(k==="j"?-10:10));}return;
 }
 if(mode!=="try"||(!stage.contains(el)&&el!==document.body)||(el.closest("button")&&["Enter"," "].includes(e.key)))return;
 const keys={m:"menu",M:"menu",Escape:"esc",Enter:"enter",Backspace:"del",Delete:"del",ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down",",":"comma","(":"lparen",")":"rparen","-":"neg",".":"dot","+":"plus","!":"factorial"};
 const k=keys[e.key]||(/^\d$/.test(e.key)?e.key:"");if(k){e.preventDefault();press(k);}
});
$("answer").addEventListener("input",()=>{worked=true;clearFeedback();});
$("answer-form").addEventListener("submit",e=>{
 e.preventDefault();if(!exerciseActive())return;worked=true;
 const value=M.answer($("answer").value),ok=value!==null&&value===goal,f=$("feedback");
 f.dataset.error=String(!ok);f.textContent=ok?"Correct. That is the exact count.":value===null?"Enter one whole-number count.":task.op==="fact"?"Not yet. Check that the factorial uses the whole number before !.":"Not yet. Enter the total first and the number chosen second. Do not count orders separately.";
});
sync(task);practice=captureTry();switchTo(params.get("mode")==="try"?"try":"watch");
})();
