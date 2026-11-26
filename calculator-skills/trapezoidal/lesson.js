"use strict";
(()=>{
const $=id=>document.getElementById(id),M=CT56Math,H=HandheldTransport,stage=$("stage"),screen=$("lcd-work");
const example={f:"x^2",lower:"0",upper:"4",n:"4"}, fresh={f:"x^2+1",lower:"0",upper:"2",n:"4"};
const four=M.trapezoid("x^2","0","4","4"),eight=M.trapezoid("x^2","0","4","8");
const mainMenu=["1: Actions","2: Number","3: Algebra","4: Calculus","5: Probability","6: Statistics","7: Matrix & Vector","8: Finance"];
const actions=["1: Define","2: Delete Variable","3: Clear History"];
const duration=63,allKeys=["f","lower","upper","n"];
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
const events=[];
const add=(t,period,...ks)=>ks.forEach((key,i)=>events.push({t:t+i*period,pulse:Math.min(.33,period*.9),key:keyNames[key]||key}));
add(2,.45,"menu","1","1");add(4,.45,..."f(x)=x","square","enter");
const expr4=M.makeExpression(four).replace(/\b0\./g,".");
const expr8=M.makeExpression(eight).replace(/\b0\./g,".");
add(16,.38,...expr4,"enter");
add(38,.29,...expr8,"enter");
const enterTimes=events.filter(e=>e.key==="enter").map(e=>e.t);
const chapters=[[0,"Define the function"],[8.65,"Count strips & ordinates"],[15.5,"Enter the weighted sum"],[34,"Use eight strips"],[59,"Compare the estimates"]];
const cues=[
 [0,"Store the curve on a Calculator page so you can reuse its heights.","f(x) = x^2   on   [0, 4]"],
 [1.7,"Open Menu → 1: Actions → 1: Define. Type f(x) = x², then press Enter.","Calculator → Actions → Define"],
 [7.15,"Done means the function is stored. Now f(1), for example, means the height at x = 1.","f(1) = 1"],
 [8.65,"Four equal strips have width 1. Count their edges: there are five ordinates.","4 strips → 5 ordinates • h = 1"],
 [12.6,"The first and last heights belong to one strip each. The interior heights belong to two.","Weights: 1 · 2 · 2 · 2 · 1"],
 [15.5,"Type half the width, times the bracket. Enter each end height once.","0.5 × [f(0) + 2(f(1) + f(2) + f(3)) + f(4)]"],
 [21.5,"Group the interior heights so the factor of two applies to all three.","Interior heights × 2"],
 [enterTimes[1],"Enter returns 22. Each ordinate is a function value; only the sum estimates the integral.","4 strips → 22"],
 [34,"Double the number of strips. The width halves, but there are now nine ordinates.","8 strips → 9 ordinates • h = 0.5"],
 [37.5,"Keep both endpoints; double the seven interior heights. Multiply by 0.25.","Weights: 1·2·2·2·2·2·2·2·1"],
 [48,"Use the half-step x-values (0.5, 1.5, 2.5 and 3.5) as well as the original x-values.","Consecutive x-values differ by 0.5."],
 [enterTimes[2],"Enter returns 21.5. On this convex curve, the tops of the strips lie above the curve.","8 strips → 21.5"],
 [59,"The exact integral is 64/3, about 21.333. Eight strips are closer here; that is not a guarantee for every function.","22 → 21.5   |   exact: 64/3"],
];
function snapshot(t){
 const s=make();let key="";
 for(const e of events){if(e.t>t+.000001)break;pressOn(s,e.key);key=t<e.t+e.pulse?e.key:"";}
 return {s,key};
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
let clock=0, playing=false, tickId=0, origin=0, started=false, mode="watch", track="practice", cache="", focused=false, focusPreference=null;
let practice=make(), experiment={...problem}, draft=null,forkAt=null,forkInputs={...example};
const shell=HandheldShell.mount({host:$("handheld-host"),screen:$("lcd"),label:"TI-Nspire CX II-T Calculator",interactive:false,onKey:k=>handle(k)});
const play=$("play"),seek=$("seek"),tabs=[$("watch-tab"),$("try-tab")];
for(const [i,[t,label]] of chapters.entries()){
 const li=node("li"),b=node("button",""),n=node("span","","0"+(i+1));b.type="button";
 b.append(n,label);b.addEventListener("click",()=>jump(t));li.append(b);$("chapters").append(li);
}
const clamp=t=>Math.max(0,Math.min(t,duration)),time=t=>Math.floor(t/60)+":"+String(Math.floor(t)%60).padStart(2,"0");
function renderWatch(){
 if(mode!=="watch")return;
 const cue=cues.findLastIndex(c=>c[0]<=clock+.000001),chapter=chapters.findLastIndex(c=>c[0]<=clock+.000001),snap=snapshot(clock);
 $("stage-play").hidden=started||clock>.05;
 seek.value=String(clock);seek.setAttribute("aria-valuetext",time(clock)+" of "+time(duration));
 $("clock").textContent=time(clock)+" / "+time(duration);shell.setKeys(snap.key?[snap.key]:[]);
 const sig=JSON.stringify([cue,chapter,snap.s]);if(sig===cache)return;cache=sig;
 $("caption").textContent=cues[cue][1];$("equation").replaceChildren();mathText($("equation"),cues[cue][2]);
 [...$("chapters").children].forEach((e,i)=>e.firstElementChild.setAttribute("aria-current",String(i===chapter)));
 if(svg.dataset.cue!==String(cue)){svg.dataset.cue=cue;drawPlot(clock>=34?eight:four,clock>=8.65,clock>=12.6);fit();}
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
function nativeBottom(){return (window.visualViewport?.height||innerHeight)-(document.querySelector(".tabbar")?.getBoundingClientRect().height||0);}
function fit(){
 if(mode!=="watch")return;
 const Ht=nativeBottom();
 const top=Math.max(0,stage.getBoundingClientRect().top);
 const reserved=$("watch-pane").offsetHeight+$("player").offsetHeight+25;
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
    (focusPreference===true||shell.body.getBoundingClientRect().width<173||$("player").getBoundingClientRect().bottom>nativeBottom()+1))
  focus(true);
}
const resize=new ResizeObserver(fit);for(const e of [$("watch-pane"),$("player"),document.querySelector(".qb-calculator-lesson > header")])resize.observe(e);
window.addEventListener("resize",fit);window.visualViewport?.addEventListener("resize",fit);
const toggle=()=>playing?pause():start();
play.addEventListener("click",toggle);$("stage-play").addEventListener("click",toggle);
seek.addEventListener("input",()=>jump(seek.value));
$("back").addEventListener("click",()=>jump(clock-10));$("forward").addEventListener("click",()=>jump(clock+10));
$("replay").addEventListener("click",()=>{pause();jump(0);start();});
$("focus").addEventListener("click",()=>{focusPreference=!focused;focus(focusPreference);});
const fields=()=>Object.fromEntries(allKeys.map(k=>[k,$(k).value]));
function refill(values){allKeys.forEach(k=>{$(k).value=values[k];});}
let checked=null;
const state=()=>track==="fork"?draft:practice;
function feedback(text="",cls=""){$("feedback").textContent=text;$("feedback").className=cls;}
function checkInputs(p){checked=null;try{checked=parseModel(p);}catch(e){return e.message;}return "";}
function renderTry(){
 const s=state(),isPractice=track==="practice";renderLCD(s);
 $("try-title").textContent=isPractice?"Try it yourself":"Explore the paused example";
 $("taskline").replaceChildren();
 mathText($("taskline"),isPractice?"Estimate the integral of f(x) = "+experiment.f+" on ["+experiment.lower+", "+experiment.upper+"] using "+experiment.n+" equal strips.":"Watch stays paused while you use this copy.");
 $("new-practice").hidden=isPractice;
 $("run").hidden=!s.loaded;
 $("link-status").hidden=!badLink||!isPractice;
 $("link-status").textContent=badLink?"This link did not supply a valid exercise. The fresh practice is shown instead.":"";
 $("key-hint").textContent=s.menu?"Use the numbered menu key, or the arrows and Enter.":s.loaded?"Press Enter to run the loaded calculation.":s.stored?"Function stored. Type the weighted sum, or load it below.":"Choose Menu → Actions → Define, or load the definition below.";
 const message=$("output");message.hidden=!s.error&&!s.out;message.textContent=s.error||s.out;message.className=s.error?"error":"right";
 $("answer-form").hidden=!isPractice||!checked;
}
function enterMode(next,variant){
 if(mode==="watch")pause();
 if(focused)focus(false);
 mode=next;stage.dataset.mode=next;
 for(const [i,b] of tabs.entries()){const active=(i===0)===(next==="watch");b.tabIndex=active?0:-1;b.setAttribute("aria-selected",String(active));}
 $("watch-pane").hidden=$("watch-side").hidden=$("player").hidden=next==="try";
 $("try-pane").hidden=$("try-side").hidden=next!=="try";shell.setInteractive(next==="try");
 if(next==="watch"){cache="";label();renderWatch();maybeFocus();if(!focused&&stage.getBoundingClientRect().top<0)window.scrollTo(0,0);return;}
 if(variant==="fork"){
  if(forkAt!==clock){forkAt=clock;draft=snapshot(clock).s;forkInputs={...example,...(clock>=34?{n:"8"}:{})};}
  track=variant;refill(forkInputs);
 }else{track="practice";refill(experiment);checkInputs(experiment);}
 feedback();$("answer").value="";shell.setKeys([]);$("stage-play").hidden=true;renderTry();
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
 if(track==="practice"){experiment=fields();checkInputs(experiment);feedback();$("answer").value="";}else forkInputs=fields();
 renderTry();
});
$("answer-form").addEventListener("submit",e=>{
 e.preventDefault();if(!checked||track!=="practice")return;
 if(!$("answer").value.trim()){feedback("Enter your estimate before checking.","wrong");return;}
 const right=M.answer($("answer").value,checked);
 feedback(right?"Correct. This is the trapezoidal estimate.":"Not quite. Check h/2, the two end heights and the doubled interior heights.",right?"right":"wrong");
});
$("take-over").addEventListener("click",()=>{const open=$("take-over").textContent==="Open Try";enterMode("try",open?"practice":"fork");$("return").focus({preventScroll:true});});
$("new-practice").addEventListener("click",()=>{enterMode("try","practice");$("f").focus({preventScroll:true});});
$("return").addEventListener("click",()=>{enterMode("watch");play.focus({preventScroll:true});});
$("reset").addEventListener("click",()=>{
 if(track==="fork"){draft=snapshot(clock).s;forkInputs={...example,...(clock>=34?{n:"8"}:{})};refill(forkInputs);}
 else{practice=make();experiment={...problem};refill(experiment);checkInputs(experiment);}
 $("answer").value="";renderTry();feedback();
});
tabs[0].addEventListener("click",()=>enterMode("watch"));tabs[1].addEventListener("click",()=>enterMode("try","practice"));
tabs.forEach((b,i)=>b.addEventListener("keydown",e=>{
 if(!["ArrowLeft","ArrowRight","Home","End"].includes(e.key))return;e.preventDefault();
 const to=e.key==="Home"?0:e.key==="End"?1:1-i;tabs[to].click();tabs[to].focus();
}));
document.addEventListener("keydown",e=>{
 if(e.defaultPrevented||e.target.closest?.(".top, .tabbar"))return;
 if(e.key==="Escape"&&focused){focusPreference=false;focus(false);$("focus").focus({preventScroll:true});return;}
 if(e.defaultPrevented||e.ctrlKey||e.altKey||e.metaKey||e.target.closest("input,textarea,select,button,a,summary,[contenteditable]"))return;
 if(mode==="watch"){if(e.repeat)return;if(e.key===" "||e.key==="k")toggle();else if(e.key==="j")jump(clock-10);else if(e.key==="l")jump(clock+10);else return;e.preventDefault();return;}
 const k={Backspace:"del",Enter:"enter",Escape:"esc",ArrowRight:"right",ArrowLeft:"left",ArrowUp:"up",ArrowDown:"down"}[e.key]??keyNames[e.key]??e.key.toLowerCase();
 if(shell.keyId(k)){e.preventDefault();handle(k);}
});
if(params.get("mode")==="try")enterMode("try","practice");else {label();renderWatch();maybeFocus();}
window.QBRecordedWatch?.bind(pause);
})();
