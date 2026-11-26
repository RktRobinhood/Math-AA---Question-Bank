"use strict";
(()=>{
const $=id=>document.getElementById(id),M=CT56Math,H=HandheldTransport,stage=$("stage"),screen=$("lcd-work");
const example={f:"x^2",lower:"0",upper:"4",n:"4"}, fresh={f:"x^2+1",lower:"0",upper:"2",n:"4"};
const four=M.trapezoid("x^2","0","4","4"),eight=M.trapezoid("x^2","0","4","8");
const mainMenu=["1: Actions","2: Number","3: Algebra","4: Calculus","5: Probability","6: Statistics","7: Matrix & Vector","8: Finance"];
const actions=["1: Define","2: Delete Variable","3: Clear History"];
const allKeys=["f","lower","upper","n"];
const params=new URLSearchParams(location.search),isTyped=allKeys.some(k=>params.has(k));
let problem={...fresh},badLink=false;
const parseModel=p=>M.trapezoid(p.f,p.lower,p.upper,p.n);
if(isTyped)try{
 if(allKeys.some(k=>params.getAll(k).length!==1))throw Error("Incomplete link");
 problem=Object.fromEntries(allKeys.map(k=>[k,params.get(k)]));parseModel(problem);
}catch{problem={...fresh};badLink=true;}
const pretty=s=>s.replace(/\*/g,"×").replace(/-/g,"−").replace(/\//g,"÷");
function make(){return {menu:"",selected:0,style:"plain",raw:"",stored:"",prior:"",out:"",error:"",loaded:false};}
function enter(s){
 s.error="";
 try{
  const val=s.raw.trim();
  if(!val)throw Error("Enter a calculation first.");
  if(s.style==="define"||/^define /i.test(val)){
   const m=/^(?:define\s+)?f\(x\)\s*=\s*(.+)$/i.exec(val);
   if(!m)throw Error("After Define, type f(x)= followed by the rule in x.");
   M.parse(m[1]);s.stored=m[1];s.prior="Define "+m[0].replace(/^define\s+/i,"");s.out="Done";
  }else{
   const f=s.stored?M.parse(s.stored):null;
   s.out=M.format(M.numerical(val,f));s.prior=val;
  }
  s.raw="";s.style="plain";s.loaded=false;
 }catch(e){s.error=e.message;}
}
function selectMenu(s,i){
 if(i!==0)return;
 if(s.menu==="main"){s.menu="actions";s.selected=0;return;}
 s.menu="";s.style="define";s.raw="";s.loaded=false;
}
const keyNames={"*":"mul","/":"div","^":"power","-":"minus","(":"lparen",")":"rparen","+":"plus",".":"dot","=":"eq"};
function pressOn(s,k){
 if(k==="menu"){s.menu="main";s.selected=0;s.error="";return;}
 if(k==="esc"){
  if(s.menu==="actions"){s.menu="main";s.selected=0;}
  else if(s.menu)s.menu="";
  else {s.raw="";s.error="";s.style="plain";s.loaded=false;}
  return;
 }
 if(s.menu){
  const menu=s.menu==="main"?mainMenu:actions;
  if(k==="down"||k==="up")s.selected=(s.selected+menu.length+(k==="down"?1:-1))%menu.length;
  else if(/^[1-8]$/.test(k))selectMenu(s,Number(k)-1);
  else if(["enter","right","select"].includes(k))selectMenu(s,s.selected);
  else if(k==="left")pressOn(s,"esc");
  return;
 }
 if(k==="enter"){enter(s);return;}
 if(k==="del"){s.raw=s.raw.slice(0,-1);s.error="";return;}
 const c=H.character(k);
 if(c&&s.raw.length+c.length<1398){s.raw+=c;s.error="";}
}
function node(tag,klass,text){const el=document.createElement(tag);if(klass)el.className=klass;if(text!==undefined)el.textContent=text;return el;}
function mathText(target,s){
 const raw=pretty(s);let i=0;
 while(i<raw.length){
  if(raw[i]!=="^"){target.append(document.createTextNode(raw[i++]));continue;}
  const m=/^\^(\d+)/.exec(raw.slice(i));
  if(!m){target.append(document.createTextNode(raw[i++]));continue;}
  target.append(node("sup","",m[1]));i+=m[0].length;
 }
}
function renderLCD(s){
 const wrap=document.createDocumentFragment(), lines=node("div","lcd-lines");
 if(s.prior){const p=node("div","lcd-prior");mathText(p,s.prior);lines.append(p);}
 if(s.out)lines.append(node("div","lcd-result",s.out));
 wrap.append(lines);
 const draft=node("div","lcd-draft trap"+(s.raw.length>67?" long":"")), rule=node("span","lcd-rule");
 mathText(rule,(s.style==="define"?"Define ":"")+(s.raw||"▏"));draft.append(rule);wrap.append(draft);
 if(s.menu){
  const menu=node("ul","lcd-menu");(s.menu==="main"?mainMenu:actions).forEach((v,i)=>{const li=node("li","",v);li.dataset.current=String(s.selected===i);menu.append(li);});wrap.append(menu);
 }
 screen.replaceChildren(wrap);
}
const svg=$("strips"), NS="http://www.w3.org/2000/svg";
function svgNode(tag,attrs,t){
 const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);
 if(t!==undefined)n.textContent=t;return n;
}
function drawPlot(r,bands,weights){
 const X=x=>20+x*56,Y=y=>128-y*6.3,title=svgNode("title",{},bands?r.n+" strips and "+(r.n+1)+" ordinates for x squared, with the endpoints emphasized.":"Curve y equals x squared on [0,4].");
 svg.replaceChildren(title,svgNode("path",{d:"M20 11V128H256",class:"plot-axis"}));
 if(bands)for(let i=0;i<r.n;i++){
  const x1=X(r.xs[i]),x2=X(r.xs[i+1]),y1=Y(r.ys[i]),y2=Y(r.ys[i+1]);
  svg.append(svgNode("path",{d:`M${x1} 128L${x1} ${y1}L${x2} ${y2}L${x2} 128Z`,class:"plot-trap"}));
 }
 const path=Array.from({length:65},(_,i)=>{const x=i/16;return (i?"L":"M")+X(x)+" "+Y(x*x);}).join("");
 svg.append(svgNode("path",{d:path,class:"plot-curve"}));
 if(bands)r.xs.forEach((x,i)=>{
  const end=i===0||i===r.n;svg.append(svgNode("circle",{cx:X(x),cy:Y(r.ys[i]),r:end?3.4:2.7,class:"plot-dot"+(end?" endpoint":"")}));
  if(weights)svg.append(svgNode("text",{x:X(x),y:Y(r.ys[i])-9,class:"plot-label"},end?"1":"2"));
 });
 for(let i=0;i<=4;i++)svg.append(svgNode("text",{x:X(i),y:140,class:"plot-label"},String(i)));
 $("graph-heading").textContent=!bands?"The curve on [0, 4]":r.n+" equal strips";
 $("graph-note").textContent=weights?"Filled endpoints count once; hollow interior ordinates count twice.":"Teaching diagram, not the Calculator screen.";
}
let mode="watch",cache="",practice=make(),experiment={...problem},returnToWatch;
const handheld=$("handheld-host");
const shell=CalculatorLessonHandset.mount(handheld,{screen:$("lcd"),label:"TI-Nspire CX II-T Calculator",interactive:false,onKey:k=>handle(k)});
const tape=["menu", "1", "1", "f", "lparen", "x", "rparen", "eq", "x", "square", "enter", "dot", "5", "mul", "lparen", "f", "lparen", "0", "rparen", "plus", "2", "mul", "lparen", "f", "lparen", "1", "rparen", "plus", "f", "lparen", "2", "rparen", "plus", "f", "lparen", "3", "rparen", "rparen", "plus", "f", "lparen", "4", "rparen", "rparen", "enter", "dot", "2", "5", "mul", "lparen", "f", "lparen", "0", "rparen", "plus", "2", "mul", "lparen", "f", "lparen", "dot", "5", "rparen", "plus", "f", "lparen", "1", "rparen", "plus", "f", "lparen", "1", "dot", "5", "rparen", "plus", "f", "lparen", "2", "rparen", "plus", "f", "lparen", "2", "dot", "5", "rparen", "plus", "f", "lparen", "3", "rparen", "plus", "f", "lparen", "3", "dot", "5", "rparen", "rparen", "plus", "f", "lparen", "4", "rparen", "rparen", "enter"],frames=[make()];
for(const k of tape){const next={...frames.at(-1)};pressOn(next,k);frames.push(next);}
function renderWatch(device,{beat,point,crossed,key}){
 if(handheld.parentElement!==device)device.append(handheld);
 const count=crossed.length,pressed=tape[count-1];
 const lit=pressed&&!point.speaking&&key?.beat===beat&&(point.fraction-key.at)*(point.span.end-point.span.voiceEnd)<.65;
 shell.setKeys(lit?[pressed]:[]);
 const sig=beat+":"+count;if(sig===cache)return;cache=sig;
 if(svg.dataset.cue!==String(beat)){svg.dataset.cue=String(beat);drawPlot(beat>=8?eight:four,beat>=3,beat>=4);}
 renderLCD(frames[count]);
}
const fields=()=>Object.fromEntries(allKeys.map(k=>[k,$(k).value]));
function refill(values){allKeys.forEach(k=>{$(k).value=values[k];});}
let checked=null;
const state=()=>practice;
function feedback(text="",cls=""){$("feedback").textContent=text;$("feedback").className=cls;}
function checkInputs(p){checked=null;try{checked=parseModel(p);}catch(e){return e.message;}return "";}
function renderTry(){
 const s=state();renderLCD(s);
 $("try-title").textContent="Try it yourself";
 $("taskline").replaceChildren();
 mathText($("taskline"),"Estimate the integral of f(x) = "+experiment.f+" on ["+experiment.lower+", "+experiment.upper+"] using "+experiment.n+" equal strips.");
 $("run").hidden=!s.loaded;
 $("link-status").hidden=!badLink;
 $("link-status").textContent=badLink?"This link did not supply a valid exercise. The fresh practice is shown instead.":"";
 $("key-hint").textContent=s.menu?"Use the numbered menu key, or the arrows and Enter.":s.loaded?"Press Enter to run the loaded calculation.":s.stored?"Function stored. Type the weighted sum, or load it below.":"Choose Menu → Actions → Define, or load the definition below.";
 const message=$("output");message.hidden=!s.error&&!s.out;message.textContent=s.error||s.out;message.className=s.error?"error":"right";
 $("answer-form").hidden=!checked;
}
function handle(key){if(mode!=="try")return;pressOn(state(),key);renderTry();}
function prepare(kind){
 const s=state(),p=fields();
 const err=checkInputs(p);
 s.error=err;s.prior="";s.out="";s.loaded=false;
 if(err){renderTry();return;}
 if(kind==="define"){s.style="define";s.raw="f(x)="+checked.model.src;}
 else{
  let matching=false;
  try{matching=JSON.stringify(M.parse(s.stored).coefs)===JSON.stringify(checked.model.coefs);}catch{}
  if(!matching){s.error="Store this function with Define before loading the sum.";renderTry();return;}
  s.style="plain";s.raw=M.makeExpression(checked);
 }
 s.loaded=true;s.menu="";renderTry();$("run").focus({preventScroll:true});
}
$("edit-inputs").addEventListener("click",()=>$("f").focus());
$("fields").addEventListener("submit",e=>{e.preventDefault();prepare("define");});
$("load-sum").addEventListener("click",()=>prepare("sum"));
$("run").addEventListener("click",()=>handle("enter"));
$("fields").addEventListener("input",()=>{
 const s=state();s.loaded=false;s.out="";s.prior="";s.error="";s.raw="";s.style="plain";s.menu="";
 experiment=fields();checkInputs(experiment);feedback();$("answer").value="";
 renderTry();
});
$("answer-form").addEventListener("submit",e=>{
 e.preventDefault();if(!checked)return;
 if(!$("answer").value.trim()){feedback("Enter your estimate before checking.","wrong");return;}
 const right=M.answer($("answer").value,checked);
 feedback(right?"Correct. This is the trapezoidal estimate.":"Not quite. Check h/2, the two end heights and the doubled interior heights.",right?"right":"wrong");
});
function enterTry(device,actions){
 mode="try";returnToWatch=actions.returnToWatch;
 device.prepend(stage);$("try-grid").prepend(handheld);stage.hidden=false;$("watch-study").hidden=true;
 shell.setKeys([]);shell.setInteractive(true);refill(experiment);checkInputs(experiment);renderTry();stage.focus({preventScroll:true});
}
function exitTry(){
 mode="watch";stage.hidden=true;$("watch-study").hidden=false;cache="";shell.setKeys([]);shell.setInteractive(false);
}
$("return").onclick=()=>returnToWatch?.();
$("reset").onclick=()=>{
 practice=make();experiment={...problem};refill(experiment);checkInputs(experiment);
 $("answer").value="";renderTry();feedback();stage.focus({preventScroll:true});
};
document.addEventListener("keydown",e=>{
 if(e.defaultPrevented||e.target.closest?.(".top, .tabbar"))return;
 if(e.defaultPrevented||e.ctrlKey||e.altKey||e.metaKey||e.target.closest("input,textarea,select,button,a,summary,[contenteditable]"))return;
 if(mode!=="try")return;
 const k={Backspace:"del",Enter:"enter",Escape:"esc",ArrowRight:"right",ArrowLeft:"left",ArrowUp:"up",ArrowDown:"down"}[e.key]??keyNames[e.key]??e.key.toLowerCase();
 if(shell.keyId(k)){e.preventDefault();handle(k);}
});
window.CalculatorLessonAdapter=Object.freeze({initialMode:params.get("mode")==="try"||isTyped?"try":"watch",renderWatch,enterTry,exitTry});
})();
