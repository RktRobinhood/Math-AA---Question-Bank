"use strict";
(function(){
const $=id=>document.getElementById(id),M=CT07,T=CT07Tape;
const stage=$("stage"),play=$("play"),typed=[$("eq1"),$("eq2")], answers=[$("answer-x"),$("answer-y")];
const params=new URLSearchParams(location.search),original=["3x+y=14","x-y=2"].map(M.equation);
let task=original,linked=false,invalid=false,goal;
try{const p=M.link(params);if(p){M.solve(...p);task=p;linked=true;}}catch{invalid=true;}
goal=M.solve(...task);
const node=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=value;return e;};
let mode="watch",state=M.base(),worked=false,forked=false,clock=0,stamp="",typedNote="";
const shell=HandheldShell.mount({host:$("handheld-host"),screen:$("lcd"),label:"TI-Nspire CX II-T Calculator",interactive:false,onKey:press});
const tabs=[$("watch-tab"),$("try-tab")];
$("question").textContent=(goal.kind==="unique"?"Solve for x and y: ":"Use the calculator to classify this system: ")+task.map(x=>M.disp(x.raw)).join(" and ")+".";
function clearFeedback(){$("feedback").textContent="";}
function sync(p){typed.forEach((e,i)=>e.value=M.disp(p[i].raw));}
function preferred(){try{return typed.map(e=>M.equation(e.value));}catch{return null;}}
function sameInput(raw){
 try{return M.sameSystem(raw.map(M.equation),task);}
 catch{return null;}
}
function exerciseActive(){
 if(state.fromWatch||goal.kind!=="unique")return false;
 const p=preferred();if(!p||sameInput(p.map(q=>q.raw))!==true)return false;
 if(state.page==="entry"||state.last){const known=sameInput(state.last?.rows||state.rows);if(known===false)return false;}
 return true;
}
function inLCD(tag,name,label,callback){
 const e=node(tag,name,label);
 if(callback){e.type="button";e.addEventListener("click",()=>{callback();stage.focus({preventScroll:true});});}
 return e;
}
function formula(s,isTry=false){
 const a=node("div","lcd-formula"),brace=node("span","lcd-brace","{"),list=node("div","lcd-equations");
 a.append(node("span","","linSolve("),brace,list,node("span","lcd-order",",{"+s.order+"})"));
 s.rows.forEach((raw,i)=>{
  const live=isTry&&s.page==="entry";
  const v=inLCD(live?"button":"span",s.page==="entry"&&s.field===i?"lcd-eq calc-active":"lcd-eq",raw?M.disp(raw):"□",live?()=>{
   state={...state,field:i,caret:raw.length,error:""};paintTry();
  }:null);
  if(s.page==="entry"&&i===s.field){
   if(raw){
     v.textContent="";const caret=node("i","lcd-caret");caret.setAttribute("aria-hidden","true");
     v.append(M.disp(raw.slice(0,s.caret)),caret,M.disp(raw.slice(s.caret)));
   }
  }
  if(live)v.setAttribute("aria-label","Equation "+(i+1)+": "+(M.disp(raw)||"blank"));list.append(v);
 });
 return a;
}
function frac(v){
 if(v.d===1n)return node("span","",M.qtext(v));
 const h=node("span","lcd-fraction");h.append(node("span","",String(v.n).replace("-","−")),node("span","",String(v.d)));return h;
}
function lcd(s,isTry=false){
 const b=$("lcd-body"),lines=[];
 b.replaceChildren();b.classList.toggle("case-error",Boolean(s.error));
 if(s.page==="setup"){
  const box=node("div","setup"),head=node("strong","setup-title","Solve System of Linear Equations"),fields=node("div","setup-fields");
  fields.append(node("span","","Number of equations:"),inLCD(isTry?"button":"span",s.field===0?"calc-active":"",s.dim||"□",isTry?()=>{state={...state,field:0,setupReplace:true};paintTry();}:null),node("span","","Variables:"),inLCD(isTry?"button":"span",s.field===1?"calc-active":"",s.order||"□",isTry?()=>{state={...state,field:1,setupReplace:true};paintTry();}:null));
  const foot=node("div","setup-foot");
  for(const [i,v] of [[2,"OK"],[3,"Cancel"]])foot.append(inLCD(isTry?"button":"span",s.field===i?"calc-active":"",v,isTry?()=>{state={...state,field:i};press("enter");}:null));
  box.append(head,fields,foot);b.append(box);lines.push("Solve System of Linear Equations. Number of equations "+s.dim+". Variables "+s.order);
 }else if(M.MENUS[s.page]){
  const container=node("div","menu-stack");
  const panel=(id,active)=>{
   const ul=node("ul",id);
   M.MENUS[id].forEach((text,i)=>{
    const li=node("li",""),live=isTry&&id===s.page&&((id==="main"&&i===2)||(id==="algebra"&&i===1));
    const row=inLCD(live?"button":"span",i===active?"calc-active":"",text,live?()=>press(String(i+1)):null);
    li.append(row);ul.append(li);
   });
   return ul;
  };
  container.append(panel("main",s.page==="algebra"?2:s.selected));if(s.page==="algebra")container.append(panel("algebra",s.selected));b.append(container);
  lines.push(s.page==="main"?"Menu. Choose 3: Algebra":"Algebra. Choose 2: Solve System of Linear Equations");
 }else if(s.page==="entry"){
  b.append(formula(s,isTry));lines.push("linSolve. Equation 1: "+(M.disp(s.rows[0])||"blank")+". Equation 2: "+(M.disp(s.rows[1])||"blank")+". Variable order "+s.order);
 }else{
  if(s.last){
   b.append(formula({...s,rows:s.last.rows,order:s.last.order.join(",")}));
   const z=s.last.result,out=node("div","lcd-result");
   if(z.kind==="unique"){
    const [a,c]=s.last.order.map(k=>z[k]);out.append("{",frac(a),", ",frac(c),"}");
    lines.push("Solution list {"+M.qtext(a)+", "+M.qtext(c)+"} in order "+s.last.order.join(","));
   }else{
    out.textContent=z.kind==="none"?"No solution found":"Infinitely many solutions";lines.push(out.textContent);
   }
   b.append(out);
  }else lines.push("Calculator entry blank");
  b.append(node("div","lcd-entry","▏"));
 }
 if(s.error){b.append(node("div","lcd-error",s.error));lines.push(s.error.replace(/[.!?]$/,""));}
 $("lcd-text").textContent=lines.join(". ")+".";
}
function snapshot(t){
 let s=M.base();
 for(const [at,key] of T.keys){if(at>t)break;s=M.key(s,key);}
 return {s};
}
const title=["Open the linear solver","Keep two variables","Enter the first equation","Enter the second equation","Read the ordered pair","Check both equations"];
const tips=["Calculator → Menu → 3: Algebra → 2: Solve System of Linear Equations.","Use two equations in x, y order. Enter confirms the setup.","Type 2x + y = 11. Tab selects the next line.","Type y = x − 1. Enter evaluates.","The first value is x; the second is y.","Substitute the values into both original equations."];
const pretty={menu:"Menu",enter:"Enter",tab:"Tab",eq:"=",plus:"+",minus:"−"};
const showKey=k=>pretty[k]||k;
T.chapters.forEach(([at,name],i)=>{
 const li=node("li",""),b=node("button","",""),serial=node("span","","0"+(i+1));
 b.append(serial,document.createTextNode(name));b.type="button";b.addEventListener("click",()=>watch.goBeat(i));li.append(b);$("chapters").append(li);
});
const canFork=()=>clock>0&&clock<T.duration-.025;
function paintWatch(f){
 if(mode!=="watch")return;
 const {i,words,key,led,keys,active}=f;clock=f.clock;
 const s=snapshot(clock).s;
 if($("caption").textContent!==words)$("caption").textContent=words;
 $("active-key").textContent=key?showKey(key):"—";
 shell.setKeys(led?[led]:[]);
 $("take").textContent=canFork()?"Continue this example in Try":"Open Try";
 const next=JSON.stringify([i,active,s],(k,v)=>typeof v==="bigint"?String(v):v);if(next===stamp)return;stamp=next;
 lcd(s);
 $("beat-count").textContent="Step "+(i+1)+" of "+title.length;
 $("beat-title").textContent=title[i];$("takeaway").toggleAttribute("data-result",i>=4);$("takeaway").textContent=i===4?T.captions[4][2]:i===5?T.captions[5][2]:tips[i];
 $("key-steps").replaceChildren(...keys.map(({key},j)=>{
  const li=node("li","",showKey(key));
  li.dataset.progress=j===active?"current":j<active?"done":"next";
  if(j===active)li.setAttribute("aria-current","step");
  return li;
 }));
 [...$("chapters").children].forEach((e,j)=>e.firstElementChild.setAttribute("aria-current",String(j===Math.min(i,4))));
}
function paintTry(){
 if(mode!=="try")return;
 lcd(state,true);
 const check=exerciseActive(),singular=goal.kind!=="unique",same=preferred()&&sameInput(typed.map(e=>e.value))===true;
 $("answer-form").hidden=!check;$("exercise-inactive").hidden=check||singular&&same;if(!check)clearFeedback();
 $("try-context").textContent=state.fromWatch?"Continuing the Watch example. Reset for your own question.":check||singular&&same?(linked?"Linked system":"Set exercise"):"Exploring another system";
 const hints={main:"Choose 3: Algebra.",algebra:"Choose 2: Solve System of Linear Equations.",setup:"Keep 2 equations. The variable order determines the order of the outputs.",entry:"Type both equations, with an equals sign on each line. Tab changes rows; Enter solves."};
 $("hint").textContent=hints[state.page]||(state.last?"Read the result in the order shown in the command.":"Open the calculator’s Menu, or load the two editable equations.");
 const notice=state.error||typedNote||(invalid&&!worked?"That Try link could not load. The original system is shown instead.":"");
 $("tool-status").textContent=notice;$("tool-status").dataset.error=String(Boolean(state.error||invalid&&!worked));
}
function press(key){
 if(mode!=="try")return;
 worked=true;typedNote="";state=M.key(state,key);paintTry();
}
const watch=CT07Watch.mount({tape:T,stage,render:paintWatch,inWatch:()=>mode==="watch"});
function switchTo(next,take=false){
 if(next==="try"&&mode==="watch"){
  watch.leave();
  if(take&&!canFork()&&clock>0&&state.fromWatch){
   state=M.base();worked=true;typedNote="";sync(task);answers.forEach(e=>e.value="");clearFeedback();
  }else if(take&&canFork()&&!linked&&!invalid&&!worked&&!forked){state={...snapshot(clock).s,fromWatch:true};forked=true;}
 }
 mode=next;stage.dataset.mode=mode;stamp="";const isWatch=mode==="watch";
 ["watch-message","watch-player","watch-panel","watch-extra"].forEach(id=>$(id).hidden=!isWatch);
 ["try-header","try-panel","exercise"].forEach(id=>$(id).hidden=isWatch);
 tabs.forEach((b,i)=>{const yes=isWatch===(i===0);b.tabIndex=yes?0:-1;b.setAttribute("aria-selected",String(yes));});
 shell.setKeys([]);shell.setInteractive(!isWatch);
 if(isWatch)watch.draw();else{$("start-overlay").hidden=true;paintTry();}
}
tabs.forEach((b,i)=>{
 b.addEventListener("click",()=>{switchTo(i?"try":"watch");if(i)stage.focus({preventScroll:true});});
 b.addEventListener("keydown",e=>{if(["ArrowLeft","ArrowRight","Home","End"].includes(e.key)){e.preventDefault();const k=e.key==="Home"?0:e.key==="End"?1:1-i;switchTo(k?"try":"watch");tabs[k].focus();}});
});
$("take").addEventListener("click",()=>{switchTo("try",true);stage.focus({preventScroll:true});});
$("return").addEventListener("click",()=>{switchTo("watch");play.focus({preventScroll:true});});
$("reset").addEventListener("click",()=>{worked=true;state=M.base();typedNote="";sync(task);answers.forEach(e=>e.value="");clearFeedback();paintTry();stage.focus({preventScroll:true});});
for(const el of typed)el.addEventListener("input",()=>{
 worked=true;typedNote="";state={...state,error:""};clearFeedback();paintTry();
});
$("typed").addEventListener("submit",e=>{
 e.preventDefault();worked=true;
 try{
  const p=typed.map(v=>M.equation(v.value));M.solve(...p);
  const prior=state.fromWatch?M.base():state;state=M.load(prior,p.map(q=>q.raw));
  typedNote="Template loaded. Press Enter on the calculator to evaluate.";paintTry();stage.focus({preventScroll:true});
 }catch(e){typedNote="";state={...state,error:e.message};paintTry();}
});
document.addEventListener("keydown",e=>{
 if(e.target!==document.body&&!e.target.closest?.(".qb-calculator-lesson"))return;
 const el=e.target;if(e.altKey||e.metaKey||e.ctrlKey||el.closest("input,textarea,select,a,summary,[contenteditable]"))return;
 if(mode!=="try"||(!stage.contains(el)&&el!==document.body)||(el.closest("button")&&["Enter"," "].includes(e.key)))return;
 if(e.key==="Tab"&&el===stage){
  if((state.page==="entry"||state.page==="setup")&&(e.shiftKey?state.field>0:state.field<(state.page==="entry"?1:3))){
   e.preventDefault();press(e.shiftKey?"shift-tab":"tab");
  }
  return;
 }
 const keys={m:"menu",M:"menu",Escape:"esc",Enter:"enter",Backspace:"del",Delete:"del",ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down",",":"comma","(":"lparen",")":"rparen","-":"minus",".":"dot","+":"plus","*":"mul","/":"div","=":"eq"};
 const k=keys[e.key]||(/^[0-9xy]$/i.test(e.key)?e.key.toLowerCase():"");if(k){e.preventDefault();press(k);}
});
answers.forEach(el=>el.addEventListener("input",()=>{worked=true;clearFeedback();}));
$("answer-form").addEventListener("submit",e=>{
 e.preventDefault();if(!exerciseActive())return;worked=true;
 const [x,y]=answers.map(el=>M.answer(el.value)),ok=Boolean(x&&y&&M.sameQ(x,goal.x)&&M.sameQ(y,goal.y)),f=$("feedback");
 const swapped=x&&y&&M.sameQ(x,goal.y)&&M.sameQ(y,goal.x);
 f.dataset.error=String(!ok);
 f.textContent=ok?"Correct. That pair satisfies both equations.":!x||!y?"Enter exact numbers or fractions for both x and y.":swapped?"The two values are swapped. Check the variable list before assigning x and y.":"Check your pair in both equations. Keep exact fractions if needed.";
});
sync(task);switchTo(params.get("mode")==="try"||linked&&params.get("mode")!=="watch"?"try":"watch");
window.QBRecordedWatch?.bind(watch.pause,null,watch.attach);
})();
