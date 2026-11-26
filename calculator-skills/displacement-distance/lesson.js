"use strict";
(()=>{
const $=id=>document.getElementById(id),M=CT53Math,H=HandheldTransport,S=CT53Screen;
const stage=$("stage"),lcd=$("lcd"),canvas=$("drawing"),screen=S.screen(canvas),hot=$("hotspots");
const example={v:"3-2x",lower:"0",upper:"4"},fresh={v:"(x-1)^2*(x-3)",lower:"0",upper:"5"}, watchModel=M.model(example.v,example.lower,example.upper);
const allKeys=["v","lower","upper"],params=new URLSearchParams(location.search);
const typed=["v","q","lower","upper"].some(k=>params.has(k));
let problem={...fresh},badLink=false;
if(typed)try{
 const count=params.getAll("v").length+params.getAll("q").length;
 if(count!==1||["lower","upper"].some(k=>params.getAll(k).length!==1))throw Error("Incomplete or repeated inputs");
 problem={v:params.get("v")??params.get("q"),lower:params.get("lower"),upper:params.get("upper")};
 M.model(problem.v,problem.lower,problem.upper);
}catch{badLink=true;problem={...fresh};}
function make(preset,raw=""){
 return {state:"entry",raw,preset,q:null,low:null,high:null,cursor:null,draft:"",result:null,zero:null,tool:"",teaching:false,menuIndex:0,subIndex:0,error:""};
}
function plotted(s,raw){
 try{const q=M.parse(raw);Object.assign(s,make(s.preset,q.raw),{q,state:"plotted"});}
 catch(e){s.error=e.message;}
}
const picking=s=>["lower","upper"].includes(s.state);
function scene(s,state,p={}){
 Object.assign(s,{state,error:"",draft:"",...p});
}
function begin(s,tool){
 if(!s.q)return;
 const {x0,x1}=M.windowFor(s.q,s.preset);
 scene(s,"lower",{tool,cursor:(x0+x1)/2,low:null,high:null,result:null,zero:null});
}
function confirm(s,x){
 if(!picking(s)||!s.q)return;
 if(!Number.isFinite(x)||Math.abs(x)>M.LIMIT){s.error="Enter a finite bound between −16 and 16.";return;}
 if(s.state==="lower"){scene(s,"upper",{low:x,cursor:x});return;}
 try{
  if(s.tool==="zero"){
   const r=M.integrate(s.q,s.low,x);
   if(r.cross.length!==1)throw Error(r.cross.length?"Bracket just one sign change.":r.touch.length?"The graph touches the axis here but does not reverse. Try a bracket with opposite signs.":"No sign crossing in that bracket. Choose one bound on each side.");
   scene(s,"ghost",{high:x,zero:r.cross[0]});
  }else scene(s,"result",{high:x,result:M.integrate(s.q,s.low,x)});
 }catch(e){s.error=e.message;}
}
function pressOn(s,k){
 const w=s.state;
 if(k==="esc"){
  if(w==="submenu"){scene(s,"menu",{menuIndex:5});return;}
  if(s.q)scene(s,"plotted",{tool:"",low:null,high:null,result:null,zero:null,cursor:null});
  else scene(s,"entry");
  return;
 }
 if(k==="menu"&&s.q){scene(s,"menu",{menuIndex:0,low:null,high:null,result:null,zero:null,cursor:null});return;}
 if(w==="menu"){
  if(k==="up"||k==="down"){s.menuIndex=(s.menuIndex+(k==="down"?1:S.PANEL.main.rows.length-1))%S.PANEL.main.rows.length;return;}
  if(k==="6"||(["enter","right","select"].includes(k)&&s.menuIndex===5))scene(s,"submenu",{subIndex:0});return;
 }
 if(w==="submenu"){
  if(k==="left"){scene(s,"menu",{menuIndex:5});return;}
  if(k==="up"||k==="down"){s.subIndex=(s.subIndex+(k==="down"?1:S.PANEL.sub.rows.length-1))%S.PANEL.sub.rows.length;return;}
  if(k==="1"||(["enter","right","select"].includes(k)&&s.subIndex===0))begin(s,"zero");
  if(k==="6"||(["enter","right","select"].includes(k)&&s.subIndex===5))begin(s,"integral");return;
 }
 if(k==="tab"&&!picking(s)){scene(s,"entry",{raw:s.raw,low:null,high:null,result:null,zero:null,cursor:null});return;}
 if(w==="ghost"&&["enter","select"].includes(k)){scene(s,"zero",{cursor:null});return;}
 if(picking(s)){
  if(k==="enter"||k==="select"){confirm(s,s.draft?M.number(s.draft):s.cursor);return;}
  if(k==="left"||k==="right"){
   const {x0,x1}=M.windowFor(s.q,s.preset,s.low,s.high),step=(x1-x0)/10;
   s.cursor=M.clamp(s.cursor+(k==="left"?-step:step),x0,x1);s.draft="";s.error="";return;
  }
  if(!["del","neg","minus","plus","dot"].includes(k)&&!/^[0-9]$/.test(k))return;
  s.draft=k==="del"?s.draft.slice(0,-1):(s.draft+(H.character(k)??"")).slice(0,24);
  const typed=M.number(s.draft);if(Number.isFinite(typed)&&Math.abs(typed)<=M.LIMIT)s.cursor=typed;
  s.error="";return;
 }
 if(k==="enter"||k==="select"){if(w==="entry")plotted(s,s.raw);return;}
 const c=H.character(k);
 if((c&&/^[0-9x()+\-*/^.]+$/.test(c))||k==="del"){
  if(w!=="entry")scene(s,"entry",{raw:"",low:null,high:null,result:null,zero:null,cursor:null});
  s.raw=k==="del"?s.raw.slice(0,-1):(s.raw+c).slice(0,80);s.error="";
 }
}
const keyNames={"*":"mul","/":"div","^":"power","-":"minus","(":"lparen",")":"rparen","+":"plus",".":"dot","=":"eq"};
function graphLabel(s){
 let text=s.q?"Graph of "+M.displayExpr(s.q.raw)+". ":"Graph entry f1(x) equals "+M.displayExpr(s.raw)+". ";
 if(s.state==="menu")text+="Graph menu. "+S.PANEL.main.rows[s.menuIndex]+". ";
 if(s.state==="submenu")text+="Analyze Graph. "+S.PANEL.sub.rows[s.subIndex]+". ";
 if(picking(s))text+=(s.state==="lower"?"Lower":"Upper")+" bound for "+s.tool+". "+(s.draft?"Typed "+s.draft+". ":"");
 if(s.state==="ghost")text+="Preview zero at "+M.pretty(s.zero)+". Press Enter to mark. ";
 if(s.state==="zero")text+="Zero at x equals "+M.pretty(s.zero)+". ";
 if(s.result)text+="Signed integral equals "+M.pretty(s.result.total)+". ";
 $("lcd-text").textContent=text+s.error;
}
let mode="watch",cache="",returnToWatch;
let practice=make(M.model(problem.v,problem.lower,problem.upper).limits,problem.v),experiment={...problem};
const handheld=$("handheld-host");
const shell=CalculatorLessonHandset.mount(handheld,{screen:lcd,label:"TI-Nspire CX II-T Graphs",interactive:false,onKey:k=>handle(k)});
const tape=["3", "minus", "2", "x", "enter", "menu", "6", "6", "0", "enter", "4", "enter", "menu", "6", "1", "left", "left", "enter", "right", "right", "right", "enter", "enter", "menu", "6", "6", "0", "enter", "1", "dot", "5", "enter", "menu", "6", "6", "1", "dot", "5", "enter", "4", "enter"],frames=[make(watchModel.limits)];
for(const key of tape){const next={...frames.at(-1)};pressOn(next,key);frames.push(next);}
function renderWatch(device,{beat,point,crossed,key}){
 if(handheld.parentElement!==device)device.append(handheld);
 const n=crossed.length,pressed=tape[n-1];
 const lit=pressed&&!point.speaking&&key?.beat===beat&&(point.fraction-key.at)*(point.span.end-point.span.voiceEnd)<.65;
 shell.setKeys(lit?[pressed]:[]);
 if(cache===n)return;cache=n;
 screen.draw(frames[n]);graphLabel(frames[n]);
}
const fields=()=>Object.fromEntries(allKeys.map(k=>[k,$(k).value]));
const refill=values=>allKeys.forEach(k=>{$(k).value=values[k];});
const state=()=>practice;
let checked=M.model(problem.v,problem.lower,problem.upper),edited=false;
function feedback(text="",cls=""){$("feedback").textContent=text;$("feedback").className=cls;}
function checkInputs(p){
 checked=null;try{checked=M.model(p.v,p.lower,p.upper);}catch(e){return e.message;}return "";
}
function hotspot(panel,i,f){
 const b=document.createElement("button");b.type="button";b.setAttribute("aria-label",panel.rows[i]);
 b.style.left=panel.x/3.2+"%";b.style.top=(panel.y+2+i*panel.h)/2.4+"%";b.style.width=panel.w/3.2+"%";b.style.height=panel.h/2.4+"%";
 b.addEventListener("click",e=>{e.stopPropagation();f();});hot.append(b);
}
function renderTry(){
 const s=state();
 screen.draw(s);graphLabel(s);hot.replaceChildren();const picks=picking(s);
 lcd.classList.toggle("pick",picks);$("bound-form").hidden=!picks;
 $("bound-label").textContent=s.state==="lower"?"Lower bound (time)":"Upper bound (time)";
 if($("bound").value!==s.draft)$("bound").value=s.draft;
 $("try-title").textContent="Find both totals";
 $("taskline").textContent="Find displacement, distance and each reversal for v(x) = "+M.displayExpr(experiment.v)+" from "+experiment.lower+" to "+experiment.upper+" s.";
 $("link-status").hidden=!badLink||edited;
 $("link-status").textContent=badLink?"This link did not supply a valid exercise. The fresh practice is shown instead.":"";
 const hint={entry:"Press Enter on the handheld or use Plot velocity.",plotted:"Open Menu → Analyze Graph. Zero finds a crossing; Integral keeps the sign.",menu:"Choose 6: Analyze Graph.",submenu:"Choose 1: Zero or 6: Integral.",lower:"Enter a lower bound, or use the arrow keys and Enter.",upper:"Enter an upper bound, or use the arrow keys and Enter.",ghost:"Press Enter to mark the crossing.",zero:"Check the sign on both sides of this crossing before splitting.",result:"This is a signed integral, not automatically a distance."};
 $("key-hint").textContent=hint[s.state];
 const msg=$("output"),res=s.result?"Signed integral: "+M.pretty(s.result.total)+" m.":s.state==="zero"?"Marked zero at "+M.pretty(s.zero)+" s.":"";
 msg.hidden=!s.error&&!res;msg.textContent=s.error||res;msg.className=s.error?"error":"right";
 $("answer-form").hidden=!checked;
 if(s.state==="menu")hotspot(S.PANEL.main,5,()=>handle("6"));
 if(s.state==="submenu"){hotspot(S.PANEL.sub,0,()=>handle("1"));hotspot(S.PANEL.sub,5,()=>handle("6"));}
}
function handle(key){
 if(mode!=="try")return;
 const s=state(),before=s.raw;
 if((key==="enter"||key==="select")&&s.state==="entry"){
  const p=fields();const err=checkInputs({...p,v:s.raw});
  if(err){s.error=err;renderTry();return;}
  s.preset=checked.limits;
 }
 pressOn(s,key);
 if(before!==s.raw){
  $("v").value=s.raw;
  experiment=fields();checkInputs(experiment);feedback();$("answer-form").reset();
 }
 renderTry();
}
$("edit-inputs").addEventListener("click",()=>$("v").focus());
$("fields").addEventListener("submit",e=>{
 e.preventDefault();const p=fields(),s=state(),err=checkInputs(p);
 if(err){s.error=err;renderTry();return;}
 Object.assign(s,make(checked.limits,checked.q.raw),{q:checked.q,state:"plotted"});
 const changed=allKeys.some(k=>p[k]!==experiment[k]);experiment=p;
 if(changed){feedback();$("answer-form").reset();}
 renderTry();
});
$("fields").addEventListener("input",()=>{
 const p=fields(),s=state();edited=true;
 const err=checkInputs(p);Object.assign(s,make(err?s.preset:checked.limits,p.v));
 experiment=p;feedback();$("answer-form").reset();
 renderTry();
});
$("bound-form").addEventListener("submit",e=>{e.preventDefault();if(mode!=="try")return;const s=state();confirm(s,s.draft?M.number(s.draft):s.cursor);renderTry();});
$("bound").addEventListener("input",()=>{
 if(mode!=="try"||!picking(state()))return;
 const s=state();s.draft=$("bound").value;const x=M.number(s.draft);
 if(Number.isFinite(x)&&Math.abs(x)<=M.LIMIT)s.cursor=x;
 s.error="";screen.draw(s);graphLabel(s);$("output").hidden=true;
});
function pointer(e){
 const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*320/r.width,y=(e.clientY-r.top)*240/r.height;
 return x>=S.SCREEN_X.l&&x<=S.SCREEN_X.r&&y>=26&&y<212?S.pointAt(state(),x):null;
}
canvas.addEventListener("pointermove",e=>{
 if(mode!=="try"||!picking(state())||e.pointerType==="touch"||state().draft)return;
 const x=pointer(e);if(x===null)return;state().cursor=x;screen.draw(state());graphLabel(state());
});
canvas.addEventListener("click",e=>{if(mode!=="try"||!picking(state()))return;const x=pointer(e);if(x!==null){confirm(state(),x);renderTry();}});
$("answer-form").addEventListener("input",()=>feedback());
$("answer-form").addEventListener("submit",e=>{
 e.preventDefault();if(!checked)return;
 const a=checked.answer;
 const results=[M.match(M.answerNumber($("displacement").value),a.total),M.match(M.answerNumber($("distance").value),a.area),M.matchTimes($("reversals").value,a.cross)];
 const names=["displacement","distance","reversal times"], wrong=names.filter((_,i)=>!results[i]);
 if(!wrong.length)feedback("All correct. The signed pieces add for displacement; their magnitudes add for distance.","right");
 else feedback("Recheck "+wrong.join(", ")+". Only split where the velocity changes sign; taking the magnitude of the net result is not the same as adding the magnitudes.","wrong");
});
function enterTry(device,actions){
 mode="try";returnToWatch=actions.returnToWatch;device.prepend(stage);$("try-grid").prepend(handheld);stage.hidden=false;
 shell.setKeys([]);shell.setInteractive(true);refill(experiment);checkInputs(experiment);renderTry();stage.focus({preventScroll:true});
}
function exitTry(){
 mode="watch";stage.hidden=true;cache="";hot.replaceChildren();lcd.classList.remove("pick");shell.setKeys([]);shell.setInteractive(false);
}
$("return").onclick=()=>returnToWatch?.();
$("reset").onclick=()=>{
 experiment={...problem};edited=false;checkInputs(experiment);practice=make(checked.limits,experiment.v);
 refill(experiment);$("answer-form").reset();feedback();renderTry();stage.focus({preventScroll:true});
};
document.addEventListener("keydown",e=>{
 if(e.defaultPrevented||e.target.closest?.(".top, .tabbar"))return;
 if(e.defaultPrevented||e.ctrlKey||e.altKey||e.metaKey||e.target.closest("input,textarea,select,a,summary,[contenteditable]"))return;
 if(mode!=="try")return;
 if(e.target.closest("button")&&["Enter"," "].includes(e.key))return;
 const k={Backspace:"del",Delete:"del",Enter:"enter",Escape:"esc",ArrowRight:"right",ArrowLeft:"left",ArrowUp:"up",ArrowDown:"down",m:"menu",M:"menu","²":"square"}[e.key]??keyNames[e.key]??e.key.toLowerCase();
 if(shell.keyId(k)){e.preventDefault();handle(k);}
});
window.CalculatorLessonAdapter=Object.freeze({initialMode:params.get("mode")==="try"?"try":"watch",renderWatch,enterTry,exitTry});
})();
