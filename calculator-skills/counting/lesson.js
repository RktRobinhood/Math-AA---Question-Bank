"use strict";
(function(){
const $=id=>document.getElementById(id),M=CT03;
const stage=$("stage"),handheld=$("handheld-host"),op=$("op"),n=$("n"),r=$("r");
const params=new URLSearchParams(location.search),original={op:"ncr",n:11,r:4};
let task=original,linked=false,invalid=false;
try{const p=M.link(params);if(p){task=p;linked=true;}}catch{invalid=true;}
const goal=M.count(task);
const node=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=value;return e;};
let mode="watch",state=M.base(),worked=false,stamp=null,typedNote="",returnToWatch=null;
const answer=$("answer"),feedback=$("feedback");
const shell=CalculatorLessonHandset.mount(handheld,{screen:$("lcd"),label:"TI-Nspire CX II-T Calculator",interactive:false,onKey:press});
$("question").textContent=linked?(task.op==="fact"?"Evaluate "+M.expression(task)+" exactly.":"How many different groups of "+task.r+" items can be selected from "+task.n+" distinct items if order does not matter?"):"The curator has 11 different photos. How many groups of four can the curator archive if positions are not assigned?";
function clearFeedback(){$("feedback").textContent="";}
function sync(p){op.value=p.op;n.value=String(p.n);r.value=p.r===null?"":String(p.r);}
function preferred(){try{return M.problem(op.value,n.value,r.value);}catch{return null;}}
function exerciseActive(){
 if(!M.same(preferred(),task))return false;
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
const physical={"fact-five":"5","fact-menu":"menu","fact-prob":"5","fact-command":"1","fact-enter":"enter",
 "choose-menu":"menu","choose-prob":"5","choose-command":"3",total:"5",comma:"comma",chosen:"2",close:"rparen","choose-enter":"enter"};
function renderWatch(device,{point,crossed,key}){
 if(handheld.parentElement!==device)device.append(handheld);
 const signature=crossed.map(e=>e.id).join(",");
 if(signature!==stamp){
  let result=M.base();
  for(const e of crossed)result=M.key(result,physical[e.id]);
  lcd(result);stamp=signature;
 }
 const light=!point.speaking&&key?.beat===point.span.i&&point.fraction-key.at<.075;
 shell.setKeys(light?[physical[key.id]]:[]);
}
function paintTry(){
 if(mode!=="try")return;
 lcd(state,true);
 const p=preferred(),check=exerciseActive();
 $("r-field").hidden=op.value==="fact";$("answer-form").hidden=!check;$("exercise-inactive").hidden=check;if(!check)clearFeedback();
 $("try-context").textContent=check?(task.op==="fact"?"Write the exact factorial.":"Choose "+task.r+" from "+task.n+" without assigning roles."):"Exploring another entry.";
 $("hint").textContent=state.page==="main"?"Choose 5: Probability.":state.page==="prob"?"Choose 1 for Factorial or 3 for Combinations.":(p?.op||op.value)==="fact"?"Type n first. Then use Menu → 5 → 1, or load the typed value below.":"Use Menu → 5 → 3, or load the typed values below.";
 const notice=state.error||typedNote|| (invalid&&!worked?"That Try link could not load. The original question is shown instead.":"");
 $("tool-status").textContent=notice;$("tool-status").dataset.error=String(Boolean(state.error||invalid&&!worked));
}
function press(key){
 if(mode!=="try")return;
 worked=true;typedNote="";state=M.key(state,key);paintTry();
}
function enterTry(device,actions){
 returnToWatch=actions.returnToWatch;mode="try";
 device.prepend(stage);$("try-workspace").prepend(handheld);stage.hidden=false;$("exercise").hidden=false;
 shell.setInteractive(true);shell.setKeys([]);paintTry();
}
function exitTry(){
 mode="watch";stage.hidden=true;$("exercise").hidden=true;stamp=null;
 shell.setInteractive(false);shell.setKeys([]);
}
$("return").addEventListener("click",()=>returnToWatch?.());
$("reset").addEventListener("click",()=>{
 worked=true;state=M.base();typedNote="";sync(task);answer.value="";clearFeedback();
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
 const el=e.target;
 if(e.altKey||e.metaKey||e.ctrlKey||el.closest("input,textarea,select,a,summary,[contenteditable]"))return;
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
sync(task);
window.CalculatorLessonAdapter=Object.freeze({
 initialMode:params.get("mode")==="try"||linked||invalid?"try":"watch",
 renderWatch,enterTry,exitTry
});
})();
