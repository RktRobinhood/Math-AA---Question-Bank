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
const fresh={rule:"2*2^(n-1)",lower:"1",upper:"5",step:"1",task:"sum"};
const allKeys=["rule","lower","upper","step","task"];
const params=new URLSearchParams(location.search), isTyped=allKeys.some(k=>params.has(k));
let problem={...fresh},badLink=false;
if(isTyped)try{
 if(allKeys.some(k=>params.getAll(k).length!==1))throw Error("Incomplete link");
 problem=Object.fromEntries(allKeys.map(k=>[k,params.get(k)]));M.calculate(problem,problem.task);
}catch{problem={...fresh};badLink=true;}
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
const keys=[["press-1", "home"], ["press-2", "1"], ["press-3", "1"], ["press-4", "3"], ["press-5", "mul"], ["press-6", "2"], ["press-7", "power"], ["press-8", "lparen"], ["press-9", "5"], ["press-10", "minus"], ["press-11", "1"], ["press-12", "rparen"], ["press-13", "enter"], ["press-14", "menu"], ["press-15", "4"], ["press-16", "3"], ["press-17", "n"], ["press-18", "tab"], ["press-19", "1"], ["press-20", "tab"], ["press-21", "5"], ["press-22", "tab"], ["press-23", "3"], ["press-24", "mul"], ["press-25", "2"], ["press-26", "power"], ["press-27", "lparen"], ["press-28", "n"], ["press-29", "minus"], ["press-30", "1"], ["press-31", "rparen"], ["press-32", "enter"], ["press-33", "menu"], ["press-34", "6"], ["press-35", "4"], ["press-36", "5"], ["press-37", "3"], ["press-38", "mul"], ["press-39", "2"], ["press-40", "power"], ["press-41", "lparen"], ["press-42", "n"], ["press-43", "minus"], ["press-44", "1"], ["press-45", "rparen"], ["press-46", "right"], ["press-47", "comma"], ["press-48", "n"], ["press-49", "comma"], ["press-50", "2"], ["press-51", "comma"], ["press-52", "8"], ["press-53", "comma"], ["press-54", "2"], ["press-55", "enter"], ["press-56", "menu"], ["press-57", "6"], ["press-58", "3"], ["press-59", "5"], ["press-60", "menu"], ["press-61", "6"], ["press-62", "4"], ["press-63", "5"], ["press-64", "3"], ["press-65", "mul"], ["press-66", "2"], ["press-67", "power"], ["press-68", "lparen"], ["press-69", "n"], ["press-70", "minus"], ["press-71", "1"], ["press-72", "rparen"], ["press-73", "right"], ["press-74", "comma"], ["press-75", "n"], ["press-76", "comma"], ["press-77", "2"], ["press-78", "comma"], ["press-79", "8"], ["press-80", "comma"], ["press-81", "2"], ["press-82", "enter"], ["press-83", "esc"], ["press-84", "3"], ["press-85", "mul"], ["press-86", "2"], ["press-87", "power"], ["press-88", "lparen"], ["press-89", "6"], ["press-90", "minus"], ["press-91", "1"], ["press-92", "rparen"], ["press-93", "enter"]];
const keyNames={"*":"mul","/":"div","^":"power","-":"minus","(":"lparen",")":"rparen",",":"comma","+":"plus",".":"dot"};

let mode="watch",cache="",returnToWatch,practice=make(),experiment={...problem},counterpart=!isTyped||badLink, threshold=false;
const host=$("handheld-host");
const shell=CalculatorLessonHandset.mount(host,{screen:$("lcd"),label:"TI-Nspire CX II-T Calculator",interactive:false,onKey:handle});
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

function feedback(text="",cls=""){
 const v=$("feedback");v.textContent=text;v.className=cls;
}
function renderTry(){
 const s=practice;renderLCD(s);inputState();
 $("try-title").textContent="Try it yourself";
 $("taskline").textContent=threshold?"The second line packs 2 × 2ⁿ⁻¹ cartons on day n. On which day does it first pack at least 50 cartons? Compare neighboring days before answering.":counterpart?"A second packing line fills uₙ = 2 × 2ⁿ⁻¹ cartons on day n. "+describePacking(experiment):describe(experiment);
 $("presets").hidden=isTyped&&!badLink;
 $("run").hidden=!s.loaded;
 $("link-status").hidden=!badLink;
 $("link-status").textContent=badLink?"This link did not supply a valid exercise. The fresh practice is shown instead.":"";
 const hint=s.menu?"Use the numbered menu key, or arrows and Enter.":s.loaded?"The calculation is loaded. Press Enter to run it.":s.style==="sigma"?"Type in the current box; use Tab to move between boxes.":s.style==="seq"||s.style==="sumseq"?"Type rule, n, lower, upper, step.":"Use the keypad, or edit the problem and load it.";
 $("key-hint").textContent=hint;
 const msg=$("output");msg.hidden=!s.error&&!s.out;msg.textContent=s.error||s.out;msg.className=s.error?"error":"right";
 $("answer-form").hidden=!checked||threshold;
 $("threshold-form").hidden=!threshold;
 const isList=checked?.task==="list";
 $("answer-label").textContent=isList?"Your list (in order, separated by commas)":"Your answer";
 $("answer").inputMode=isList?"text":"decimal";
}
function checkInputs(p){checked=null;try{checked=M.calculate(p,p.task);}catch(e){return e.message;}return "";}
function handle(k){
 if(mode!=="try")return;
 const s=practice;pressOn(s,k);if(k==="enter"||k==="home"||k==="esc"||k==="menu")s.loaded=false;renderTry();
}
function load(e){
 e.preventDefault();const p=fields();const error=checkInputs(p);
 experiment=p;feedback();$("answer").value="";
 const s=practice;s.out="";s.prior="";s.error=error;
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
 const s=practice;s.loaded=false;s.out="";s.prior="";s.error="";s.raw="";s.style="plain";s.menu="";
 if(!threshold||$("rule").value!==fresh.rule||$("task").value!=="term"){threshold=false;counterpart=false;}experiment=fields();checkInputs(experiment);feedback();$("answer").value="";
 renderTry();
});
$("answer-form").addEventListener("submit",e=>{
 e.preventDefault();if(!checked)return;
 if(!$("answer").value.trim()){feedback("Enter a value before checking.","wrong");return;}
 const right=M.compare($("answer").value,checked);
 feedback(right?(counterpart?"Correct. This is the output in cartons for the days you selected.":"Correct. The requested output matches."):checked.task==="list"?"Not quite. Check the first index, the step and the order of your list.":"Not quite. Check whether the problem asks for one term or a total.",""+(right?"right":"wrong"));
});
document.addEventListener("keydown",e=>{
 if(mode!=="try"||!stage.contains(e.target)||e.defaultPrevented||e.ctrlKey||e.altKey||e.metaKey||e.target.closest("input,textarea,select,button,a,summary,[contenteditable]"))return;
 if(e.key==="Tab"&&practice.style==="sigma"){e.preventDefault();handle(e.shiftKey?"left":"tab");return;}
 const k={Backspace:"del",Enter:"enter",Escape:"esc",ArrowRight:"right",ArrowLeft:"left",ArrowUp:"up",ArrowDown:"down"}[e.key]??keyNames[e.key]??e.key.toLowerCase();
 if(shell.keyId(k)){e.preventDefault();handle(k);}
});

function renderWatch(device,{beat,point,key,crossed}){
 if(host.parentElement!==device)device.append(host);
 const s=make();
 for(const [i,e] of crossed.entries())pressOn(s,keys[i][1]);
 const last=key?.beat===beat&&keys[crossed.length-1]?.[1],hold=point.span.end-point.span.voiceEnd;
 shell.setKeys(last&&!point.speaking&&(point.fraction-key.at)*hold<.50?[last]:[]);
 const signature=beat+":"+crossed.length;
 if(signature!==cache){cache=signature;renderLCD(s);}
}
function enterTry(device,actions){
 mode="try";returnToWatch=actions.returnToWatch;
 device.prepend(stage);$("try-grid").prepend(host);stage.hidden=false;
 shell.setKeys([]);shell.setInteractive(true);renderTry();stage.focus({preventScroll:true});
}
function exitTry(){mode="watch";cache="";stage.hidden=true;shell.setKeys([]);shell.setInteractive(false);}
$("return").addEventListener("click",()=>returnToWatch?.());
function restore(p){practice=make();experiment={...p};refill(experiment);checkInputs(experiment);$("answer").value="";feedback();renderTry();}
$("reset").addEventListener("click",()=>{counterpart=!isTyped||badLink;threshold=false;restore(problem);});
const preset={total:{},one:{task:"term"},list:{task:"list",lower:"2",upper:"8",step:"2"},stepped:{lower:"2",upper:"8",step:"2"},threshold:{task:"term"}};
$("presets").querySelectorAll("button").forEach(button=>button.addEventListener("click",()=>{
 counterpart=true;threshold=button.dataset.seqPart==="threshold";
 $("threshold-day").value="";$("threshold-feedback").textContent="";
 restore({...fresh,...preset[button.dataset.seqPart]});
}));
$("threshold-form").addEventListener("submit",e=>{
 e.preventDefault();if(!threshold)return;
 const day=Number($("threshold-day").value);
 const feedback=$("threshold-feedback");
 if(!Number.isInteger(day)||day<1||day>20){feedback.textContent="Enter a whole day from 1 to 20.";return;}
 const output=n=>M.calculate({...fresh,upper:String(n)},"term").value;
 const valid=output(day)>=50&&(day===1||output(day-1)<50);
 feedback.textContent=valid?"Correct. Day 5 gives 32 cartons and day 6 gives 64 cartons, so day 6 is first.":"Not yet. The first day meets the target, but the previous day does not.";
});
function describePacking(p){
 if(p.task==="term")return "How many cartons are packed on day "+p.upper+"?";
 if(p.step==="2")return p.task==="list"?"How many cartons are packed on each of days 2, 4, 6 and 8?":"How many cartons in total on days 2, 4, 6 and 8?";
 return "How many cartons in total are packed on days 1 to 5?";
}
refill(experiment);checkInputs(experiment);
window.CalculatorLessonAdapter=Object.freeze({initialMode:params.get("mode")==="try"||isTyped&&!badLink?"try":"watch",renderWatch,enterTry,exitTry});
})();
