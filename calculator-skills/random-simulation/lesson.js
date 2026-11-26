"use strict";
(function(){
const M=SimulationMath,$=id=>document.getElementById(id),stage=$("stage");
const menuRows=[["1: Actions","2: Number","3: Algebra","4: Calculus","5: Probability","6: Statistics","7: Matrix & Vector","8: Finance","9: Functions"],
 ["1: Factorial (!)","2: Permutations","3: Combinations","4: Random","5: Distributions"],
 ["1: Number","2: Integer","3: Binomial","4: Normal","5: Sample","6: Seed"]],path=["5","4","2"];
const req=M.query(location.search);
const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;};
const state0=data=>({data,expression:"",caret:0,menu:-1,selection:0,history:[],error:""});
let problem=req.problem,state=state0(problem),warning=req.error?"Could not load that linked question. The original Try exercise is shown. "+req.error:"",draftError="",answerFeedback={text:"",error:false};
let mode="watch",stamp="",light=0,returnToWatch;
const handheld=$("handheld-host");
const shell=CalculatorLessonHandset.mount(handheld,{screen:$("lcd"),interactive:false,label:"TI-Nspire CX II-T Calculator trainer",onKey:physical});
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
const tape=["menu", "5", "4", "2", "1", "comma", "5", "comma", "1", "2", "rparen", "enter", "menu", "5", "4", "2", "1", "comma", "5", "comma", "1", "2", "rparen", "enter"],frames=[state0(M.demo)];
let replayIndex=0;
for(const key of tape)frames.push(mutate(frames.at(-1),key,key==="enter"?M.tape[replayIndex++]:null));
function renderWatch(device,{beat,point,crossed,key}){
 if(handheld.parentElement!==device)device.append(handheld);
 const count=crossed.length,pressed=tape[count-1];
 const lit=pressed&&!point.speaking&&key?.beat===beat&&(point.fraction-key.at)*(point.span.end-point.span.voiceEnd)<.65;
 shell.setKeys(lit?[pressed]:[]);
 const next=beat+":"+count;if(stamp===next)return;stamp=next;
 renderLCD(frames[count],true);
}
function status(id,text,error=false){const el=$(id);el.textContent=text;el.dataset.error=String(error);}
function show(id,on){$(id).hidden=!on;}
function tryPrompt(p){
 return "A fair spinner has "+p.sides+" sectors. "+(p.target===1?"Only sector 1 is blue.":"Sectors 1–"+p.target+" are blue.")+" Simulate "+p.trials+" spins.";
}
function paintTry(){
 renderLCD(state,false);
 const run=state.history.at(-1);
 $("try-context").textContent=tryPrompt(problem);
 $("keys-help").textContent="Open Menu → 5 → 4 → 2. Enter the first label, last label and number of spins; then press Enter. Keyboard: M opens Menu.";
 show("inspect",!!run);
 if(run){
  $("run-title").textContent="Most recent run · "+run.list.length+(run.list.length===1?" outcome":" outcomes");
  $("outcomes").replaceChildren(...run.list.map(x=>node("li",String(x))));
 }
 status("tool-status",state.error||(draftError||warning)||"",Boolean(state.error||(draftError||warning)));
 status("assess-feedback",answerFeedback.text,answerFeedback.error);
}
function physical(k){
 if(mode!=="try")return;
 if(document.activeElement!==stage)stage.focus({preventScroll:true});
 clearTimeout(light);shell.setKeys([k]);light=setTimeout(()=>shell.setKeys([]),170);
 const next=mutate(state,k),newRun=next.history!==state.history;state=next;
 if(newRun){$("answer").reset();answerFeedback={text:"",error:false};}
 paintTry();
}
function fillInputs(){M.keys.forEach(k=>$("input-"+k).value=problem[k]);}
function clearTry(resetProblem){
 if(resetProblem){problem=req.problem;fillInputs();}
 state=state0(problem);$("answer").reset();$("edit-details").open=false;
 answerFeedback={text:"",error:false};warning="";draftError="";
}
$("data-form").onsubmit=e=>{
 e.preventDefault();
 const next=Object.fromEntries(M.keys.map(k=>[k,M.uint($("input-"+k).value)]));
 const error=M.validate(next);if(error){draftError=error;paintTry();return;}
 problem=next;clearTry(false);paintTry();stage.focus({preventScroll:true});
};
$("data-form").oninput=()=>{if(draftError){draftError="";paintTry();}};
$("answer").onsubmit=e=>{
 e.preventDefault();
 const a=Object.fromEntries(["count","empirical","model"].map(k=>[k,$("answer-"+k).value]));
 const msg=M.check(problem,state.history.at(-1),a);answerFeedback={text:msg||"Correct. Your sample gives an estimate; the sector model gives the exact probability.",error:!!msg};
 status("assess-feedback",answerFeedback.text,answerFeedback.error);
};
$("answer").oninput=()=>{answerFeedback={text:"",error:false};status("assess-feedback","");};
function enterTry(device,actions){
 mode="try";returnToWatch=actions.returnToWatch;
 device.prepend(stage);$("try-grid").prepend(handheld);stage.hidden=false;
 clearTimeout(light);shell.setInteractive(true);shell.setKeys([]);paintTry();stage.focus({preventScroll:true});
}
function exitTry(){
 mode="watch";stage.hidden=true;stamp="";clearTimeout(light);shell.setKeys([]);shell.setInteractive(false);
}
$("return").onclick=()=>returnToWatch?.();
$("reset").onclick=()=>{clearTry(true);paintTry();stage.focus({preventScroll:true});};
document.addEventListener("keydown",e=>{
 if(e.target!==document.body&&!e.target.closest?.(".qb-calculator-lesson"))return;
 const el=e.target;
 if(e.altKey||e.metaKey||e.ctrlKey||el.closest("input,textarea,select,a,summary,[contenteditable]"))return;
 if(mode!=="try"||e.defaultPrevented)return;
 if((!stage.contains(el)&&el!==document.body)||(el.closest("button")&&["Enter"," "].includes(e.key)))return;
 const shortcuts={Escape:"esc",Enter:"enter",Backspace:"del",Delete:"del",ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down",",":"comma","(":"lparen",")":"rparen"," ":"space"};
 const k=shortcuts[e.key]||(e.key.toLowerCase()==="m"?"menu":/^[a-z0-9]$/i.test(e.key)?e.key.toLowerCase():"");
 if(k){e.preventDefault();physical(k);}
});
fillInputs();
window.CalculatorLessonAdapter=Object.freeze({initialMode:req.mode,renderWatch,enterTry,exitTry});
})();
