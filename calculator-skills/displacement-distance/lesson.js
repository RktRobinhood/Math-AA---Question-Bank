"use strict";
(()=>{
const $=id=>document.getElementById(id),M=CT53Math,H=HandheldTransport,S=CT53Screen;
const stage=$("stage"),lcd=$("lcd"),canvas=$("drawing"),screen=S.screen(canvas),hot=$("hotspots");
const example={v:"3-2x",lower:"0",upper:"4"},fresh={v:"(x-1)^2*(x-3)",lower:"0",upper:"5"}, watchModel=M.model(example.v,example.lower,example.upper);
const duration=50,allKeys=["v","lower","upper"],params=new URLSearchParams(location.search);
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
const events=[];
const add=(t,p,...ks)=>ks.forEach((key,i)=>events.push({t:t+i*p,pulse:p*.86,key:keyNames[key]||key}));
add(.8,.44,..."3-2x","enter");
add(5.1,.5,"menu","6","6");add(7.4,.55,"0","enter","4","enter");
add(11.5,.5,"menu","6","1");add(13.55,.48,"left","left","enter","right","right","right","enter","enter");
add(22.3,.46,"menu","6","6");add(24.1,.47,"0","enter","1",".","5","enter");
add(31.1,.46,"menu","6","6");add(33,.44,"1",".","5","enter","4","enter");
const chapters=[[0,"Plot the velocity"],[4.5,"Measure displacement"],[10.9,"Locate the reversal"],[21.4,"Measure both pieces"],[41,"Compare the two totals"]];
const cues=[
 [0,"Enter 3 − 2x in Graphs. The calculator’s x is time t, measured in seconds.","v(t) = 3 − 2t   ·   0 ≤ t ≤ 4"],
 [4.5,"For displacement, take one signed integral. Choose Menu → 6: Analyze Graph → 6: Integral.","Displacement keeps the signs."],
 [7.35,"Type 0 and press Enter for the lower bound. Type 4 and press Enter for the upper bound.","Bounds: 0 to 4 s"],
 [9.04,"The signed result is −4 m: the cart finishes 4 m behind its starting point.","Displacement = −4 m"],
 [10.9,"The distance needs the reversal time. Choose Menu → 6: Analyze Graph → 1: Zero.","Zero locates the candidate reversal."],
 [13.5,"Move the cursor to either side of the crossing, confirming each bound with Enter.","Lower bound left of 1.5; upper bound right"],
 [16.87,"Press Enter to mark the zero. Velocity is positive before 1.5 s and negative after it.","Split at t = 1.5 s"],
 [21.4,"Repeat Integral from 0 to 1.5. This positive part is the forward travel.","First interval: 0 to 1.5 s"],
 [26.46,"The forward piece is +2.25 m.","Forward: +2.25 m"],
 [30.5,"Repeat Integral from 1.5 to 4. The second result is negative because motion was backward.","Second interval: 1.5 to 4 s"],
 [35.21,"The second signed piece is −6.25 m, so the cart travelled 6.25 m backward.","Backward: −6.25 m signed"],
 [41,"Add magnitudes for distance. Taking the absolute value of the net result would lose the forward travel.","Distance = 2.25 + 6.25 = 8.5 m"],
 [45,"If the graph only touches zero and stays on the same side, the cart stops but does not reverse. Try a fresh model.","Displacement −4 m · Distance 8.5 m"]
];
const tapeStates=(()=>{
 const s=make(watchModel.limits);
 return events.map(e=>{pressOn(s,e.key);return {...s};});
})();
function snapshot(t){
 const i=events.findLastIndex(e=>e.t<=t+.000001);
 if(i<0)return {s:make(watchModel.limits),key:""};
 const e=events[i];return {s:{...tapeStates[i]},key:t<e.t+e.pulse?e.key:""};
}
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
let clock=0, playing=false, tickId=0, origin=0, started=false, mode="watch", track="practice", cache="", focused=false, focusPreference=null;
let practice=make(M.model(problem.v,problem.lower,problem.upper).limits,problem.v), experiment={...problem}, draft=null,forkAt=null,forkInputs={...example};
const shell=HandheldShell.mount({host:$("handheld-host"),screen:lcd,label:"TI-Nspire CX II-T Graphs",interactive:false,onKey:k=>handle(k)});
const play=$("play"),seek=$("seek"),tabs=[$("watch-tab"),$("try-tab")];
for(const [i,[t,label]] of chapters.entries()){
 const li=document.createElement("li"),b=document.createElement("button"),n=document.createElement("span");b.type="button";n.textContent="0"+(i+1);
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
 $("caption").textContent=cues[cue][1];$("equation").textContent=cues[cue][2];fit();
 [...$("chapters").children].forEach((e,i)=>e.firstElementChild.setAttribute("aria-current",String(i===chapter)));
 screen.draw(snap.s);graphLabel(snap.s);
}
function label(){
 const name=playing?"Pause":clock>=duration-.02?"Replay":"Play";
 play.textContent=name;play.setAttribute("aria-label",name);play.dataset.playing=String(playing);
 const tryNext=clock>=duration-.02||typed||params.has("case");$("take-over").textContent=tryNext?"Open Try":"Take over";
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
function fitTry(){
 if(mode!=="try")return;
 const height=nativeBottom(),host=$("handheld-host"),mobile=innerWidth<=700;
 if(height>960){stage.style.removeProperty("--try-width");return;}
 const y=host.getBoundingClientRect().top+window.scrollY,available=height-Math.max(0,y)-10;
 // Very short phones keep Enter visible; taller phones and short desktops fit the whole keypad.
 const scale=mobile&&height<650?.804:1;
 const width=Math.min(mobile?270:300,Math.max(mobile?165:134,Math.floor(available*558/1168/scale)));
 stage.style.setProperty("--try-width",width+"px");
}
function fit(){
 if(mode==="try"){fitTry();return;}
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
const resize=new ResizeObserver(fit);for(const e of [$("watch-pane"),$("try-pane"),$("player"),document.querySelector(".qb-calculator-lesson > header")])resize.observe(e);
window.addEventListener("resize",fit);window.visualViewport?.addEventListener("resize",fit);
const toggle=()=>playing?pause():start();
play.addEventListener("click",toggle);$("stage-play").addEventListener("click",toggle);
seek.addEventListener("input",()=>jump(seek.value));
$("back").addEventListener("click",()=>jump(clock-10));$("forward").addEventListener("click",()=>jump(clock+10));
$("replay").addEventListener("click",()=>{pause();jump(0);start();});
$("focus").addEventListener("click",()=>{focusPreference=!focused;focus(focusPreference);});
const fields=()=>Object.fromEntries(allKeys.map(k=>[k,$(k).value]));
const refill=values=>allKeys.forEach(k=>{$(k).value=values[k];});
const state=()=>track==="fork"?draft:practice;
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
 const s=state(),isPractice=track==="practice";
 screen.draw(s);graphLabel(s);hot.replaceChildren();const picks=picking(s);
 lcd.classList.toggle("pick",picks);$("bound-form").hidden=!picks;
 $("bound-label").textContent=s.state==="lower"?"Lower bound (time)":"Upper bound (time)";
 if($("bound").value!==s.draft)$("bound").value=s.draft;
 $("try-title").textContent=isPractice?"Find both totals":"Explore the paused example";
 $("taskline").textContent=isPractice?"Find displacement, distance and each reversal for v(x) = "+M.displayExpr(experiment.v)+" from "+experiment.lower+" to "+experiment.upper+" s.":"Watch stays paused while you use this copy.";
 $("new-practice").hidden=isPractice;
 $("link-status").hidden=!badLink||!isPractice||edited;
 $("link-status").textContent=badLink?"This link did not supply a valid exercise. The fresh practice is shown instead.":"";
 const hint={entry:"Press Enter on the handheld or use Plot velocity.",plotted:"Open Menu → Analyze Graph. Zero finds a crossing; Integral keeps the sign.",menu:"Choose 6: Analyze Graph.",submenu:"Choose 1: Zero or 6: Integral.",lower:"Enter a lower bound, or use the arrow keys and Enter.",upper:"Enter an upper bound, or use the arrow keys and Enter.",ghost:"Press Enter to mark the crossing.",zero:"Check the sign on both sides of this crossing before splitting.",result:"This is a signed integral, not automatically a distance."};
 $("key-hint").textContent=hint[s.state];
 const msg=$("output"),res=s.result?"Signed integral: "+M.pretty(s.result.total)+" m.":s.state==="zero"?"Marked zero at "+M.pretty(s.zero)+" s.":"";
 msg.hidden=!s.error&&!res;msg.textContent=s.error||res;msg.className=s.error?"error":"right";
 $("answer-form").hidden=!isPractice||!checked;
 if(s.state==="menu")hotspot(S.PANEL.main,5,()=>handle("6"));
 if(s.state==="submenu"){hotspot(S.PANEL.sub,0,()=>handle("1"));hotspot(S.PANEL.sub,5,()=>handle("6"));}
}
function enterMode(next,variant){
 if(mode==="watch")pause();
 if(focused)focus(false);
 mode=next;stage.dataset.mode=next;
 for(const [i,b] of tabs.entries()){const active=(i===0)===(next==="watch");b.tabIndex=active?0:-1;b.setAttribute("aria-selected",String(active));}
 $("watch-pane").hidden=$("watch-side").hidden=$("player").hidden=next==="try";
 $("try-pane").hidden=$("try-side").hidden=next!=="try";shell.setInteractive(next==="try");
 if(next==="watch"){cache="";hot.replaceChildren();lcd.classList.remove("pick");label();renderWatch();maybeFocus();if(!focused&&stage.getBoundingClientRect().top<0)window.scrollTo(0,0);return;}
 if(variant==="fork"){
  if(forkAt!==clock){forkAt=clock;draft=snapshot(clock).s;forkInputs={...example,v:draft.raw};}
  track=variant;refill(forkInputs);
 }else{track="practice";refill(experiment);checkInputs(experiment);}
 shell.setKeys([]);$("stage-play").hidden=true;renderTry();fitTry();
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
  if(track==="practice"){experiment=fields();checkInputs(experiment);feedback();$("answer-form").reset();}
  else forkInputs=fields();
 }
 renderTry();
}
$("edit-inputs").addEventListener("click",()=>$("v").focus());
$("fields").addEventListener("submit",e=>{
 e.preventDefault();const p=fields(),s=state(),err=checkInputs(p);
 if(err){s.error=err;renderTry();return;}
 Object.assign(s,make(checked.limits,checked.q.raw),{q:checked.q,state:"plotted"});
 if(track==="practice"){
  const changed=allKeys.some(k=>p[k]!==experiment[k]);experiment=p;
  if(changed){feedback();$("answer-form").reset();}
 }else forkInputs=p;
 renderTry();
});
$("fields").addEventListener("input",()=>{
 const p=fields(),s=state();edited=true;
 const err=checkInputs(p);Object.assign(s,make(err?s.preset:checked.limits,p.v));
 if(track==="practice"){experiment=p;feedback();$("answer-form").reset();}else forkInputs=p;
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
 e.preventDefault();if(!checked||track!=="practice")return;
 const a=checked.answer;
 const results=[M.match(M.answerNumber($("displacement").value),a.total),M.match(M.answerNumber($("distance").value),a.area),M.matchTimes($("reversals").value,a.cross)];
 const names=["displacement","distance","reversal times"], wrong=names.filter((_,i)=>!results[i]);
 if(!wrong.length)feedback("All correct. The signed pieces add for displacement; their magnitudes add for distance.","right");
 else feedback("Recheck "+wrong.join(", ")+". Only split where the velocity changes sign; taking the magnitude of the net result is not the same as adding the magnitudes.","wrong");
});
$("take-over").addEventListener("click",()=>{const open=$("take-over").textContent==="Open Try";enterMode("try",open?"practice":"fork");$("return").focus({preventScroll:true});});
function resetAssigned(){
 experiment={...problem};checkInputs(experiment);practice=make(checked.limits,experiment.v);
 $("answer-form").reset();feedback();
}
$("new-practice").addEventListener("click",()=>{resetAssigned();enterMode("try","practice");$("v").focus({preventScroll:true});});
$("return").addEventListener("click",()=>{enterMode("watch");play.focus({preventScroll:true});});
$("reset").addEventListener("click",()=>{
 if(track==="fork"){draft=snapshot(clock).s;forkInputs={...example,v:draft.raw};refill(forkInputs);}
 else{resetAssigned();refill(experiment);}
 renderTry();
});
tabs[0].addEventListener("click",()=>enterMode("watch"));tabs[1].addEventListener("click",()=>enterMode("try","practice"));
tabs.forEach((b,i)=>b.addEventListener("keydown",e=>{
 if(!["ArrowLeft","ArrowRight","Home","End"].includes(e.key))return;e.preventDefault();
 const to=e.key==="Home"?0:e.key==="End"?1:1-i;tabs[to].click();tabs[to].focus();
}));
document.addEventListener("keydown",e=>{
 if(e.defaultPrevented||e.target.closest?.(".top, .tabbar"))return;
 if(e.key==="Escape"&&focused){focusPreference=false;focus(false);$("focus").focus({preventScroll:true});return;}
 if(e.defaultPrevented||e.ctrlKey||e.altKey||e.metaKey||e.target.closest("input,textarea,select,a,summary,[contenteditable]"))return;
 if(mode==="watch"){if(e.repeat||e.target.closest("button"))return;if(e.key===" "||e.key==="k")toggle();else if(e.key==="j")jump(clock-10);else if(e.key==="l")jump(clock+10);else return;e.preventDefault();return;}
 if(e.target.closest("button")&&["Enter"," "].includes(e.key))return;
 const k={Backspace:"del",Delete:"del",Enter:"enter",Escape:"esc",ArrowRight:"right",ArrowLeft:"left",ArrowUp:"up",ArrowDown:"down",m:"menu",M:"menu","²":"square"}[e.key]??keyNames[e.key]??e.key.toLowerCase();
 if(shell.keyId(k)){e.preventDefault();handle(k);}
});
if(params.get("mode")==="try")enterMode("try","practice");else {label();renderWatch();maybeFocus();}
})();
