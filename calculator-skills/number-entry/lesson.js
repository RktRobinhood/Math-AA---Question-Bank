"use strict";
(function(){
const $=id=>document.getElementById(id),M=CT01Math;
const stage=$("stage"),lcd=$("lcd-body"),host=$("handheld-host");
const approach=new URLSearchParams(location.search), defaultCase={expr:M.defaultExpr,sf:3,explicitPrecision:false,value:M.evaluate(M.defaultExpr)};
let task=defaultCase,invalidLink=false;
if(approach.has("expr")){
 try{task=M.linked(approach);}catch{invalidLink=true;}
}
let mode="watch",state=M.pristine("calc",task.expr),cache="",returnToWatch;
const shell=CalculatorLessonHandset.mount(host,{screen:$("lcd"),label:"TI-Nspire CX II-T Calculator",interactive:false,onKey:(k)=>doKey(k)});
const node=(tag,cls,label)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(label!==undefined)n.textContent=label;return n;};
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
function renderTry(){
 if(mode!=="try")return;
 renderLCD(state);
 const tip=({home:"Press 1 for New, or A for Scratchpad Calculate.",new:"Press 1 to add the Calculator page.",calc:"Use the calculator keys, or select the screen and type. Press Enter to evaluate.",scratch:"Use the keys or type on the screen. Press Enter to evaluate."}[state.app]??"Press Home to open the calculator.");
 const text=state.error||tip;
 if($("hint").textContent!==text)$("hint").textContent=text;
 $("hint").classList.toggle("is-wrong",Boolean(state.error));
}
function doKey(k){if(mode!=="try")return;state=M.pressed(state,k);renderTry();}
$("reset-keypad").addEventListener("click",()=>{state=M.pristine();$("answer").value="";$("feedback").textContent="";renderTry();lcd.focus();});
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
 if(mode!=="try"||!stage.contains(e.target))return;
 if(e.ctrlKey){if(e.key==="/"){e.preventDefault();doKey("ctrl");doKey("div");}return;}
 const k=e.key, z=k.toLowerCase();
 if(z==="tab")return;
 const keyMap={Backspace:"del",Delete:"del",Escape:"esc",Enter:"enter",ArrowLeft:"left",ArrowRight:"right",ArrowDown:"down",ArrowUp:"up",Home:"home","(":"lparen",")":"rparen","*":"mul","/":"div","-":/E$/i.test(state.frac?state.frac[state.frac.active]:state.entry)?"neg":"minus","+":"plus","^":"power",".":"dot",e:state.app==="calc"||state.app==="scratch"?"ee":"e",a:"a"};
 const match=keyMap[k]??keyMap[z]??(/^[0-9]$/.test(k)?k:null);
 if(match){e.preventDefault();doKey(match);shell.setKeys([match]);setTimeout(()=>{if(mode==="try")shell.setKeys([]);},125);}
});
const sup={"-":"⁻","+":"⁺","0":"⁰","1":"¹","2":"²","3":"³","4":"⁴","5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹"};
const written=task.expr.replace(/(\d+(?:\.\d+)?)[eE]([+-]?\d+)/g,(_,c,e)=>c+" × 10"+[...e].map(v=>sup[v]).join("")).replace(/\*/g," × ").replace(/\//g," ÷ ").replace(/-/g,"−");
$("question").textContent="Evaluate "+written+". "+(task.explicitPrecision ? "Give the answer to "+task.sf+" significant figure"+(task.sf===1?"":"s")+"." : "Give the exact answer if you can, or round to three significant figures.");
if(invalidLink)$("question").prepend("The linked expression could not be loaded. Default example: ");

const keys=[["press-1", "home"], ["press-2", "1"], ["press-3", "enter"], ["press-4", "ctrl"], ["press-5", "div"], ["press-6", "4"], ["press-7", "ee"], ["press-8", "5"], ["press-9", "mul"], ["press-10", "3"], ["press-11", "ee"], ["press-12", "neg"], ["press-13", "2"], ["press-14", "down"], ["press-15", "2"], ["press-16", "ee"], ["press-17", "3"], ["press-18", "enter"]];
function renderWatch(device,{beat,point,key,crossed}){
 if(host.parentElement!==device)device.append(host);
 let s=M.pristine("off"),twin="";
 for(const [i] of crossed.entries()){
  const k=keys[i][1];
  twin=s.ctrl&&k!=="ctrl"?"ctrl":"";
  s=M.pressed(s,k);
 }
 const last=key?.beat===beat&&keys[crossed.length-1]?.[1],hold=point.span.end-point.span.voiceEnd;
 shell.setKeys(last&&!point.speaking&&(point.fraction-key.at)*hold<.50?[twin,last].filter(Boolean):[]);
 const sig=beat+":"+crossed.length;
 if(sig!==cache){cache=sig;renderLCD(s);}
}
function enterTry(device,actions){
 mode="try";returnToWatch=actions.returnToWatch;device.prepend(stage);$("workspace").prepend(host);stage.hidden=false;
 lcd.tabIndex=0;shell.setKeys([]);shell.setInteractive(true);renderTry();lcd.focus({preventScroll:true});
}
function exitTry(){
 mode="watch";cache="";stage.hidden=true;lcd.tabIndex=-1;shell.setKeys([]);shell.setInteractive(false);
}
$("return-watch").addEventListener("click",()=>returnToWatch?.());
window.CalculatorLessonAdapter=Object.freeze({initialMode:approach.get("mode")==="try"?"try":"watch",renderWatch,enterTry,exitTry});
})();
