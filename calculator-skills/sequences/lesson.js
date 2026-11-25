"use strict";
(()=>{
const $=id=>document.getElementById(id),M=CT04Math,H=HandheldTransport,stage=$("stage"),screen=$("lcd-work");
const menus={
 main:["1: Actions","2: Number","3: Algebra","4: Calculus","5: Probability","6: Statistics","7: Matrix & Vector","8: Finance"],
 calculus:["1: Numerical Derivative at a Point","2: Numerical Definite Integral","3: Sum","4: Product"],
 stats:["1: Stat Calculations","2: Stat Results","3: List Math","4: List Operations"],
 listMath:["1: Minimum","2: Maximum","3: Mean","4: Median","5: Sum of Elements"],
 listOps:["1: Sort Ascending","2: Sort Descending","3: Dimension","4: Fill","5: Sequence"]
};
const menuDefault={main:0,calculus:0,stats:0,listMath:0,listOps:0};
const duration=57, example={rule:"3*2^(n-1)",lower:"1",upper:"5",step:"1",task:"sum"};
const fresh={rule:"2*n+3",lower:"2",upper:"6",step:"1",task:"sum"};
const allKeys=["rule","lower","upper","step","task"], formInputs=allKeys.map($);
const params=new URLSearchParams(location.search), isTyped=allKeys.some(k=>params.has(k));
let problem={...fresh},badLink=false;
if(isTyped)try{
 if(allKeys.some(k=>params.getAll(k).length!==1))throw Error("Incomplete link");
 problem=Object.fromEntries(allKeys.map(k=>[k,params.get(k)]));M.calculate(problem,problem.task);
}catch{problem={...fresh};badLink=true;}
let persistedTheme;try{persistedTheme=localStorage.getItem("calculator-coach-theme");}catch{}
const theme=$("theme");
if(["system","light","dark"].includes(persistedTheme))theme.value=persistedTheme;
function applyTheme(){document.documentElement.dataset.theme=theme.value;}applyTheme();
theme.addEventListener("change",()=>{applyTheme();try{localStorage.setItem("calculator-coach-theme",theme.value);}catch{}});
function make(){
 return {setup:"calc",menu:"",selected:0,style:"plain",parts:["","","",""],active:0,raw:"",prior:"",out:"",error:"",loaded:false,shift:false};
}
function makeHome(){return {...make(),setup:"home"};}
const visibleChar=k=>H.character(k)??"";
const pretty=s=>s.replace(/\*/g,"×").replace(/-/g,"−").replace(/\//g,"÷");
const displayVal=M.format;
function displayResult(result){
 return result.task==="list"?"{"+result.values.map(displayVal).join(", ")+"}":displayVal(result.value);
}
function command(s){
 if(s.style==="sigma")return "sumSeq("+[s.parts[3],s.parts[0],s.parts[1],s.parts[2]].join(",")+")";
 if(s.style==="sum")return "sum("+s.raw+")";
 if(s.style==="seq")return "seq("+s.raw+")";
 if(s.style==="sumseq")return "sum(seq("+s.raw+"))";
 return s.raw;
}
function evaluateCommand(s){
 const cmd=command(s).trim();
 if(!cmd)throw Error("Enter a calculation first.");
 if(s.style==="sigma"){
  if(s.parts[0].trim().toLowerCase()!=="n")throw Error("Use n as the index in this practice simulator.");
  return displayResult(M.calculate({rule:s.parts[3],lower:s.parts[1],upper:s.parts[2],step:"1"},"sum"));
 }
 if(/^sumSeq\(/i.test(cmd)||/^seq\(/i.test(cmd)||/^sum\(seq\(/i.test(cmd)){
  const isSigma=/^sumSeq\(/i.test(cmd),isSummed=/^sum\(seq\(/i.test(cmd),wrap=isSummed?2:1;
  const nameLen=isSigma?7:isSummed?8:4;
  if(!cmd.endsWith(")".repeat(wrap)))throw Error("Close the list command.");
  const bits=cmd.slice(nameLen,-wrap).split(",").map(x=>x.trim());
  if((isSigma?bits.length!==4:![4,5].includes(bits.length))||bits[1].toLowerCase()!=="n")throw Error("Use expression, n, lower, upper and an optional step for seq.");
  return displayResult(M.calculate({rule:bits[0],lower:bits[2],upper:bits[3],step:bits[4]??"1"},isSigma||isSummed?"sum":"list"));
 }
 const rule=M.parse(cmd);
 if(rule.usesIndex)throw Error("Substitute a single index, or use the Sum or Sequence command.");
 return displayVal(rule.at(0));
}
function toMenu(s,name){s.menu=name;s.selected=menuDefault[name]||0;s.error="";}
function selectMenu(s,index){
 if(s.menu==="main"){
  if(index===3)toMenu(s,"calculus");
  else if(index===5)toMenu(s,"stats");
  return;
 }
 if(s.menu==="calculus"&&index===2){s.menu="";s.style="sigma";s.parts=["","","",""];s.active=0;s.raw="";return;}
 if(s.menu==="stats"){
  if(index===2)toMenu(s,"listMath");
  else if(index===3)toMenu(s,"listOps");
  return;
 }
 if(s.menu==="listMath"&&index===4){s.menu="";s.style="sum";s.raw="";return;}
 if(s.menu==="listOps"&&index===4){s.menu="";s.style=s.style==="sum"?"sumseq":"seq";s.raw="";}
}
function pressOn(s,k){
 if(k==="home"){Object.assign(s,makeHome());return;}
 if(s.setup==="home"){if(k==="1")s.setup="document";return;}
 if(s.setup==="document"){if(k==="1"||k==="enter"){s.setup="calc";s.error="";}return;}
 if(k==="esc"){
  if(s.menu==="listMath"||s.menu==="listOps")toMenu(s,"stats");
  else if(s.menu==="calculus"||s.menu==="stats")toMenu(s,"main");
  else if(s.menu)s.menu="";
  else {s.style="plain";s.raw="";s.parts=["","","",""];s.active=0;s.error="";}
  return;
 }
 if(k==="menu"){toMenu(s,"main");return;}
 if(s.menu){
  if(k==="left"){pressOn(s,"esc");return;}
  if(k==="down"||k==="up")s.selected=(s.selected+menus[s.menu].length+(k==="down"?1:-1))%menus[s.menu].length;
  else if(/^[1-8]$/.test(k))selectMenu(s,Number(k)-1);
  else if(["enter","right","select"].includes(k))selectMenu(s,s.selected);
  return;
 }
 if(k==="enter"){
  try{
   s.out=evaluateCommand(s);
   s.prior=s.style==="sigma"?"Σ "+pretty(s.parts[3])+" (n = "+s.parts[1]+" to "+s.parts[2]+")":pretty(command(s));
   s.raw="";s.style="plain";s.active=0;s.error="";
  }catch(e){s.error=e.message;}
  return;
 }
 if(s.style==="sigma"&&["tab","right","left"].includes(k)){s.active=(s.active+(k==="left"?3:1))%4;return;}
 if(k==="right"||k==="left"||k==="tab")return;
 if(k==="ctrl"){s.shift=!s.shift;return;}
 const c=k==="del"?"":visibleChar(k);if(!c&&k!=="del")return;
 const max=s.style==="sigma"&&s.active<3?12:100;
 const next=before=>(k==="del"?before.slice(0,-1):before+c).slice(0,max);
 if(s.style==="sigma")s.parts[s.active]=next(s.parts[s.active]);
 else s.raw=next(s.raw);
 s.error="";
}
const keyNames={"*":"mul","/":"div","^":"power","-":"minus","(":"lparen",")":"rparen",",":"comma","+":"plus",".":"dot"};
const events=[];
const add=(t,...ks)=>ks.forEach((key,i)=>events.push({t:t+i*.39,key:keyNames[key]||key}));
const write=(t,x)=>add(t,...x);
add(.7,"home","1","1");
write(3,"3*2^(5-1)"); add(6.85,"enter");
add(9.45,"menu","4","3");add(13,"n","tab","1","tab","5","tab");write(16.75,example.rule);add(21,"enter");
add(25,"menu","6","4","5");add(27.05,...example.rule,"right",...",n,2,8,2");add(34.7,"enter");
add(38,"menu","6","3","5");add(40.15,"menu","6","4","5");add(42.2,...example.rule,"right",...",n,2,8,2");add(49.8,"enter");
const chapters=[
 [0,"One term"],
 [8.5,"Consecutive sum"],
 [23.5,"Every second term"],
 [36.7,"Sum a stepped list"],
 [51.5,"Choose the right output"]
];
const cues=[
 [0,"Find one term first: substitute n = 5 into the rule.","uₙ = 3 × 2^(n−1)"],
 [2.5,"For the fifth term, replace n with 5. Keep the exponent in brackets.","One index → one term"],
 [6.85,"The fifth term is 48. That is not the total of the first five terms.","u₅ = 48"],
 [8.5,"For a total of consecutive terms, open Menu → 4: Calculus → 3: Sum.","Consecutive indices: 1, 2, 3, 4, 5"],
 [12,"Type n, then Tab to the lower index, upper index and rule.","Index letter → lower → upper → rule"],
 [16.4,"Enter the original rule in n. The template automatically steps by one.","uₙ = 3 × 2^(n−1)"],
 [21,"Enter gives 93: the total of all five terms, including both endpoints.","3 + 6 + 12 + 24 + 48 = 93"],
 [23.5,"Need every second index? Insert seq from Statistics → List Operations → Sequence.","Indices: 2, 4, 6, 8"],
 [27,"Type the rule, then press Right to leave the exponent before typing the comma.","seq(rule, n, lower, upper, step)"],
 [30.95,"Enter n, the lower and upper indices, then the step. That last 2 is not the number of terms.","seq(rule, n, 2, 8, 2)"],
 [34.7,"This produces a list of four terms, not their sum.","{6, 24, 96, 384}"],
 [36.7,"For the total, first insert sum from Statistics → List Math → Sum of Elements.","sum( … )"],
 [40,"Inside sum, insert seq again. Keep the last argument: step 2.","sum(seq(rule, n, 2, 8, 2))"],
 [49.8,"Enter gives 510. The outer sum adds only the terms created by seq.","6 + 24 + 96 + 384 = 510"],
 [51.5,"For a first threshold, find the first integer index whose term passes the target, not the first total that does.","If using a continuous crossing, test neighboring integers."]
];
function snapshot(t){
 const s=make();let key="";
 for(const e of events){
  if(e.t>t+.000001)break;pressOn(s,e.key);key=t<e.t+.34?e.key:"";
 }
 return {s,key};
}
function node(tag,klass,value){const el=document.createElement(tag);if(klass)el.className=klass;if(value!==undefined)el.textContent=value;return el;}
function mathText(target,str){
 const raw=pretty(str);let i=0;
 while(i<raw.length){
  if(raw[i]!=="^"){target.append(document.createTextNode(raw[i++]));continue;}
  const tail=raw.slice(i),m=/^\^\(([^()]+)\)/.exec(tail)||/^\^([−+]?\d+(?:\.\d+)?)/.exec(tail);
  if(!m){target.append(document.createTextNode(raw[i++]));continue;}
  target.append(node("sup","",m[1]));i+=m[0].length;
 }
}
function renderLCD(s){
 const frag=document.createDocumentFragment(), lines=node("div","lcd-lines");
 if(s.setup!=="calc"){
  const options=s.setup==="home"?["1: New Document","2: My Documents","3: Recent"]:["1: Add Calculator","2: Add Graphs","3: Add Geometry","4: Add Lists & Spreadsheet","5: Add Data & Statistics"];
  const panel=node("ul","lcd-menu");for(const [i,row] of options.entries()){const li=node("li","",row);li.dataset.current=String(i===0);panel.append(li);}
  screen.replaceChildren(panel);return;
 }
 if(s.prior)lines.append(node("div","lcd-prior",s.prior));
 if(s.out)lines.append(node("div","lcd-result",s.out));
 frag.append(lines);
 const draft=node("div","lcd-draft"), rule=node("span","lcd-rule");
 const slot=(i)=>{const el=node("span","exp-slot"+(s.active===i?" current":""));mathText(el,s.parts[i]||" ");return el;};
 if(s.style==="sigma"){
  draft.classList.add("expanded","stacked");
  const stack=node("span","stack"), lower=node("span","lower-slots");
  lower.append(slot(0),"=",slot(1));stack.append(slot(2),node("span","sigma","Σ"),lower);draft.append(stack,slot(3));
 }else{
  const cmd=command(s), entered=cmd||"▏";mathText(rule,entered);draft.append(rule);
 }
 if(s.error)frag.append(node("p","lcd-error sr",s.error));
 frag.append(draft);
 if(s.menu){
  const menu=node("ul","lcd-menu");
  menus[s.menu].forEach((v,i)=>{const x=node("li","",v);x.dataset.current=String(s.selected===i);menu.append(x);});frag.append(menu);
 }
 screen.replaceChildren(frag);
}
let clock=0, playing=false, tickId=0, origin=0, started=false, mode="watch", track="practice", cache="", focused=false, focusPreference=null;
let practice=make(), experiment={...problem}, draft=null,forkAt=null,forkInputs={...example};
const shell=HandheldShell.mount({host:$("handheld-host"),screen:$("lcd"),label:"TI-Nspire CX II-T Calculator",interactive:false,onKey:k=>handle(k)});
const play=$("play"),seek=$("seek"),tabs=[$("watch-tab"),$("try-tab")];
for(const [i,[t,label]] of chapters.entries()){
 const li=node("li"),b=node("button",""),n=node("span","","0"+(i+1));b.type="button";
 b.append(n,label);b.addEventListener("click",()=>jump(t));li.append(b);$("chapters").append(li);
}
const clamp=t=>Math.max(0,Math.min(t,duration)),time=t=>"0:"+String(Math.floor(t)).padStart(2,"0");
function renderWatch(){
 if(mode!=="watch")return;
 const cue=cues.findLastIndex(c=>c[0]<=clock+.000001),chapter=chapters.findLastIndex(c=>c[0]<=clock+.000001),snap=snapshot(clock);
 $("stage-play").hidden=started||clock>.05;
 seek.value=String(clock);seek.setAttribute("aria-valuetext",time(clock)+" of "+time(duration));
 $("clock").textContent=time(clock)+" / "+time(duration);
 shell.setKeys(snap.key?[snap.key]:[]);
 const sig=JSON.stringify([cue,chapter,snap.s]);
 if(cache===sig)return;cache=sig;
 $("caption").textContent=cues[cue][1];$("equation").replaceChildren();mathText($("equation"),cues[cue][2]);
 [...$("chapters").children].forEach((e,i)=>e.firstElementChild.setAttribute("aria-current",String(i===chapter)));
 renderLCD(snap.s);
}
function label(){
 const name=playing?"Pause":clock>=duration-.02?"Replay":"Play";
 play.textContent=name;play.setAttribute("aria-label",name);play.dataset.playing=String(playing);
 const tryNext=clock>=duration-.02||isTyped||params.has("case");$("take-over").textContent=tryNext?"Open Try":"Take over";
 $("take-over").setAttribute("aria-label",tryNext?"Open independent Try exercise":"Take over the calculator");
}
function jump(t){clock=clamp(Number(t)||0);origin=performance.now()-clock*1000;label();renderWatch();}
function pause(){
 if(playing)clock=clamp((performance.now()-origin)/1000);
 playing=false;cancelAnimationFrame(tickId);label();renderWatch();
}
function tick(now){
 if(!playing||mode!=="watch")return;
 clock=clamp((now-origin)/1000);
 if(clock>=duration){pause();return;}
 renderWatch();tickId=requestAnimationFrame(tick);
}
function start(){
 if(mode!=="watch")return;
 if(document.activeElement===$("stage-play"))play.focus({preventScroll:true});
 started=true;if(clock>=duration-.02)jump(0);
 maybeFocus();
 playing=true;origin=performance.now()-clock*1000;label();renderWatch();tickId=requestAnimationFrame(tick);
}
function fit(){
 if(mode!=="watch")return;
 const Ht=window.visualViewport?.height||innerHeight;
 const top=focused?0:Math.max(0,stage.getBoundingClientRect().top);
 const reserved=$("watch-pane").offsetHeight+$("player").offsetHeight+22;
 const w=Math.max(120,Math.min(300,Math.floor((Ht-top-reserved)*558/1168)));
 stage.style.setProperty("--watch-width",w+"px");
}
function focus(on){
 focused=on;stage.classList.toggle("focused",on);document.body.classList.toggle("focus-open",on);
 const b=$("focus");b.setAttribute("aria-pressed",String(on));b.setAttribute("aria-label",on?"Exit focused view":"Focused view");b.textContent=on?"Exit":"⛶";
 if(on)stage.scrollTop=0;fit();
}
function maybeFocus(){
 fit();
 if(mode==="watch"&&!focused&&focusPreference!==false&&
    (focusPreference===true||shell.body.getBoundingClientRect().width<173||$("player").getBoundingClientRect().bottom>innerHeight+1))
  focus(true);
}
const resize=new ResizeObserver(fit);for(const e of [$("watch-pane"),$("player"),document.querySelector("header")])resize.observe(e);
window.addEventListener("resize",fit);window.visualViewport?.addEventListener("resize",fit);
const toggle=()=>playing?pause():start();
play.addEventListener("click",toggle);$("stage-play").addEventListener("click",toggle);
seek.addEventListener("input",()=>jump(seek.value));
$("back").addEventListener("click",()=>jump(clock-10));$("forward").addEventListener("click",()=>jump(clock+10));
$("replay").addEventListener("click",()=>{pause();jump(0);start();});
$("focus").addEventListener("click",()=>{focusPreference=!focused;focus(focusPreference);});
const fields=() => Object.fromEntries(allKeys.map(k=>[k,$(k).value]));
function refill(values){allKeys.forEach(k=>{$(k).value=values[k];});}
let checked=null;
function describe(p){
 return p.task==="term"?"Find the term at n = "+p.upper+" for uₙ = "+pretty(p.rule)+".":(p.task==="list"?"List the terms":"Find the sum of the terms")+" of uₙ = "+pretty(p.rule)+" from n = "+p.lower+" to "+p.upper+(p.step==="1"?".":" in steps of "+p.step+".");
}
function inputState(){
 const term=$("task").value==="term";
 $("lower-label").hidden=$("step-label").hidden=term;
 $("upper-label").textContent=term?"Index n":"Upper index";
}
function state(){return track==="fork"?draft:practice;}
function feedback(text="",cls=""){
 const v=$("feedback");v.textContent=text;v.className=cls;
}
function renderTry(){
 const s=state(),isPractice=track==="practice";renderLCD(s);inputState();
 $("try-title").textContent=isPractice?"Try it yourself":"Explore the paused example";
 $("taskline").textContent=isPractice?describe(experiment):"Watch stays paused while you use this copy.";
 $("new-practice").hidden=isPractice;
 $("run").hidden=!s.loaded;
 $("link-status").hidden=!badLink||!isPractice;
 $("link-status").textContent=badLink?"This link did not supply a valid exercise. The fresh practice is shown instead.":"";
 const hint=s.menu?"Use the numbered menu key, or arrows and Enter.":s.loaded?"The calculation is loaded. Press Enter to run it.":s.style==="sigma"?"Type in the current box; use Tab to move between boxes.":s.style==="seq"||s.style==="sumseq"?"Type rule, n, lower, upper, step.":"Use the keypad, or edit the problem and load it.";
 $("key-hint").textContent=hint;
 const msg=$("output");msg.hidden=!s.error&&!s.out;msg.textContent=s.error||s.out;msg.className=s.error?"error":"right";
 $("answer-form").hidden=!isPractice||!checked;
 const isList=checked?.task==="list";
 $("answer-label").textContent=isList?"Your list (in order, separated by commas)":"Your answer";
 $("answer").inputMode=isList?"text":"decimal";
}
function checkInputs(p){checked=null;try{checked=M.calculate(p,p.task);}catch(e){return e.message;}return "";}
function enterMode(next,variant){
 if(mode==="watch")pause();
 if(focused)focus(false);
 mode=next;stage.dataset.mode=next;
 for(const [i,button] of tabs.entries()){const active=(i===0)===(next==="watch");button.tabIndex=active?0:-1;button.setAttribute("aria-selected",String(active));}
 $("watch-pane").hidden=$("watch-side").hidden=$("player").hidden=next==="try";
 $("try-pane").hidden=$("try-side").hidden=next!=="try";
 shell.setInteractive(next==="try");
 if(next==="watch"){cache="";label();renderWatch();maybeFocus();if(!focused&&stage.getBoundingClientRect().top<0)window.scrollTo(0,0);return;}
 if(variant==="fork"){
  if(forkAt!==clock){forkAt=clock;draft=snapshot(clock).s;forkInputs={...example};}
  track=variant;refill(forkInputs);
 }
 else{track="practice";refill(experiment);checkInputs(experiment);}
 feedback();$("answer").value="";shell.setKeys([]);$("stage-play").hidden=true;renderTry();
}
function handle(k){
 if(mode!=="try")return;
 const s=state();pressOn(s,k);if(k==="enter"||k==="home"||k==="esc"||k==="menu")s.loaded=false;renderTry();
}
function load(e){
 e.preventDefault();const p=fields();const error=checkInputs(p);
 if(track==="practice"){experiment=p;feedback();$("answer").value="";}
 const s=state();s.out="";s.prior="";s.error=error;
 if(error){s.loaded=false;renderTry();return;}
 s.setup="calc";s.menu="";s.loaded=true;
 if(p.task==="term"){s.style="plain";s.raw=p.rule.toLowerCase().replace(/n/g,"("+p.upper+")");}
 else if(p.task==="sum"&&Number(p.step)===1){s.style="sigma";s.parts=["n",p.lower,p.upper,p.rule];s.active=3;}
 else{s.style=p.task==="sum"?"sumseq":"seq";s.raw=[p.rule,"n",p.lower,p.upper,p.step].join(",");}
 renderTry();$("run").focus({preventScroll:true});
}
$("edit-inputs").addEventListener("click",()=>$("rule").focus());
$("fields").addEventListener("submit",load);
$("run").addEventListener("click",()=>handle("enter"));
$("task").addEventListener("change",inputState);
$("fields").addEventListener("input",()=>{
 const s=state();s.loaded=false;s.out="";s.prior="";s.error="";s.raw="";s.style="plain";s.menu="";
 if(track==="practice"){experiment=fields();checkInputs(experiment);feedback();$("answer").value="";}else forkInputs=fields();
 renderTry();
});
$("answer-form").addEventListener("submit",e=>{
 e.preventDefault();if(!checked||track!=="practice")return;
 if(!$("answer").value.trim()){feedback("Enter a value before checking.","wrong");return;}
 const right=M.compare($("answer").value,checked);
 feedback(right?"Correct. The requested output matches.":checked.task==="list"?"Not quite. Check the first index, the step and the order of your list.":"Not quite. Check whether the problem asks for one term or a total.",""+(right?"right":"wrong"));
});
$("take-over").addEventListener("click",()=>{const open=$("take-over").textContent==="Open Try";enterMode("try",open?"practice":"fork");$("return").focus({preventScroll:true});});
$("new-practice").addEventListener("click",()=>{enterMode("try","practice");$("rule").focus({preventScroll:true});});
$("return").addEventListener("click",()=>{enterMode("watch");play.focus({preventScroll:true});});
$("reset").addEventListener("click",()=>{if(track==="fork"){draft=snapshot(clock).s;forkInputs={...example};refill(forkInputs);}else{practice=make();experiment={...problem};refill(experiment);checkInputs(experiment);}
 $("answer").value="";renderTry();feedback();});
tabs[0].addEventListener("click",()=>enterMode("watch"));
tabs[1].addEventListener("click",()=>enterMode("try","practice"));
tabs.forEach((b,i)=>b.addEventListener("keydown",e=>{
 if(!["ArrowLeft","ArrowRight","Home","End"].includes(e.key))return;
 e.preventDefault();const n=e.key==="Home"?0:e.key==="End"?1:1-i;tabs[n].click();tabs[n].focus();
}));
document.addEventListener("keydown",e=>{
 if(e.key==="Escape"&&focused){focusPreference=false;focus(false);$("focus").focus({preventScroll:true});return;}
 if(e.defaultPrevented||e.ctrlKey||e.altKey||e.metaKey||e.target.closest("input,textarea,select,button,a,summary,[contenteditable]"))return;
 if(mode==="watch"){if(e.repeat)return;if(e.key===" "||e.key==="k")toggle();else if(e.key==="j")jump(clock-10);else if(e.key==="l")jump(clock+10);else return;e.preventDefault();return;}
 const k={Backspace:"del",Enter:"enter",Escape:"esc",ArrowRight:"right",ArrowLeft:"left",ArrowUp:"up",ArrowDown:"down"}[e.key]??keyNames[e.key]??e.key.toLowerCase();
 if(shell.keyId(k)){e.preventDefault();handle(k);}
});
if(params.get("mode")==="try")enterMode("try","practice");else {label();renderWatch();maybeFocus();}
})();
