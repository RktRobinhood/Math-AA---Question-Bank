(function(){"use strict";
const M=window.CT57,$=id=>document.getElementById(id),stage=$("stage"),seek=$("seek"),screen=$("screen");
const params=new URLSearchParams(location.search),request=M.request(params);
const {cues,duration}=M;
seek.max=duration;
let mode="watch",t=0,origin=0,playing=false,started=false,focus=false,frame=0,stamp="",s=M.start(),forked=false,light=0;
let target=request.target,linkError=request.error,savedPractice=null,forkKey=null;
const forkDrafts=new Map();
const shell=HandheldShell.mount({host:$("handheld-host"),screen:$("lcd"),interactive:false,label:"TI-Nspire CX II-T Calculator",onKey:k=>{physical(k);stage.focus({preventScroll:true});}});
const tt=t=>"0:"+String(Math.floor(t)).padStart(2,"0"),pretty=v=>String(v).replace(/-/g,"−");
const elt=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
function label(text,action,active,watch,cls){
 const b=elt("button",text,cls);b.type="button";
 if(active)b.classList.add("calc-active");
 if(watch)b.disabled=true;else if(action)b.addEventListener("click",action);
 return b;
}
const show=v=>pretty(v).replaceAll("*","·").replaceAll("^2","²");
function plot(node,task){
 const setup=M.setup(task),mid=(setup.a+setup.b)/2,r=M.evalPoly(setup.inner,mid),R=M.evalPoly(setup.outer,mid),rad=R>0?32*r/R:0,anchor=65-rad;
 const cap=elt("figcaption",rad>0?"Cross-section sketch · not on TI screen":"Disk sketch · not on TI screen","plot-label");
 const ns="http://www.w3.org/2000/svg",el=(tag,props)=>{const n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(props))n.setAttribute(k,v);return n;};
 const svg=el("svg",{viewBox:"0 0 132 89",role:"img","aria-label":rad>0?"Washer cross-section with an outer radius R and inner radius r.":"A disk cross-section with radius R and no hole."});
 svg.append(el("circle",{cx:62,cy:43,r:32,class:"washer"}));
 if(rad>0)svg.append(el("circle",{cx:62,cy:43,r:rad,class:"hole"}));
 svg.append(el("line",{x1:62,y1:43,x2:85,y2:21,class:"radius"}));
 const lab=el("text",{x:91,y:20,class:"axis-text"});lab.textContent="R";svg.append(lab);
 if(rad>0){svg.append(el("line",{x1:62,y1:43,x2:62-rad,y2:43,class:"radius"}));const tag=el("text",{x:Math.max(27,anchor-19),y:57,class:"axis-text"});tag.textContent="r";svg.append(tag);}
 node.replaceChildren(svg,cap);node.hidden=false;
}
function controls(snapshot,watch){
 const modal=elt("div",undefined,"lcd-modal");
 if(snapshot.showPi){
  modal.classList.add("symbol-sheet");modal.setAttribute("aria-label","π symbols");
  modal.append(label("π",()=>physical("enter"),true,watch,"symbol"));
  for(const v of ["e","i","E","∞","θ","→","_","▷","°"])modal.append(elt("span",v,"symbol"));
  return modal;
 }
 const level=snapshot.page==="menu"?0:1,title=level?"Calculus":"Calculator menu",list=M.menus[level],at=snapshot.menu;
 modal.setAttribute("aria-label",title);modal.append(elt("strong",title,"menu-title"));
 let from=at>=4?Math.min(list.length-5,at-3):0;from=Math.max(0,from);
 for(const [i,[id,name]] of list.entries())if(i>=from&&i<from+5){
  modal.append(label(id+": "+name+(!level&&id===4?" ▸":""),()=>physical(String(id)),i===at,watch,"menu-item"));
 }
 return modal;
}
function render(snapshot,watch){
 stage.dataset.lcd=snapshot.page; screen.replaceChildren();
 const line=elt("div",undefined,"calc-input integral-line");
 if(snapshot.pi)line.append(elt("span",snapshot.mul?"π ·":"π","integral-factor"));
 if(snapshot.page==="template"||snapshot.page==="result"||snapshot.fields.some(Boolean)){
  const term=elt("span",undefined,"integral-term");
  const field=(i,cls)=>{
   const raw=snapshot.fields[i],v=raw?show(raw):"□",active=snapshot.field===i&&snapshot.page==="template";
   const n=watch||snapshot.page!=="template"?elt("span",v,"iterm "+cls+(active?" calc-active":"")):label(v,()=>{s={...s,field:i};render(s,false);stage.focus({preventScroll:true});},active,false,"iterm "+cls);
   n.dataset.slot=i;n.setAttribute("aria-label",(["Lower bound","Upper bound","Integrand","Variable"][i])+": "+(v==="□"?"blank":v));return n;
  };
  const integral=elt("span","∫","integral-sign"),bounds=elt("span",undefined,"integral-bounds");bounds.append(field(1,"bound"),integral,field(0,"bound"));term.append(bounds,field(2,"integrand"),elt("span","d"),field(3,"variable"));line.append(term);
 }else if(!snapshot.showPi&&snapshot.page==="calc")line.append(elt("i",undefined,"cursor"));
 screen.append(line);
 if(snapshot.result){
  const n=elt("div",pretty(Number(snapshot.result.value.toPrecision(7))),"integral-result");n.dataset.value=String(snapshot.result.value);screen.append(n);
 }
 if(["menu","submenu"].includes(snapshot.page)||snapshot.showPi)screen.append(controls(snapshot,watch));
 if(snapshot.error)screen.append(elt("div",snapshot.error.split(". ")[0],"lcd-error"));
 if(watch){
  stage.classList.toggle("revealed",!!snapshot.result);if(snapshot.result)plot($("watch-plot"),M.worked);else $("watch-plot").hidden=true;
 }else{
  const p=$("progress"),ok=snapshot.result&&!forked&&M.matches(snapshot.result,M.setup(target));
  p.textContent=!snapshot.result?"":forked?"Read the result in cubic units.":ok?"Task complete. Write "+Number(snapshot.result.value.toPrecision(7))+" cubic units before rounding.":"That calculation does not use the assigned interval and washer-area formula.";
  p.hidden=!p.textContent;
  if(ok)plot($("try-plot"),target);else if(forked&&snapshot.result&&M.matches(snapshot.result,M.setup(M.worked)))plot($("try-plot"),M.worked);else $("try-plot").hidden=true;
  const h=snapshot.page==="calc"?"Enter π and ×. Then open Menu → 4 → 2.":snapshot.page==="template"?"Tab: lower bound, upper bound, the difference of squares, then x after d. Press Enter.":snapshot.result?"Read the result in cubic units.":"Choose Calculus → Numerical Definite Integral.";
  $("hint").textContent=h;
  const error=snapshot.error||(!forked&&linkError)||"";$("error").textContent=error;$("error").hidden=!error;
 }
}
function physical(key){
 if(mode!=="try")return;
 clearTimeout(light);
 const keys=[key];
 shell.setKeys(keys);light=setTimeout(()=>shell.setKeys([]),175);
 s=M.press(s,key);render(s,false);
}
cues.forEach(([,title],i)=>{const row=elt("li");row.append(label(String(i+1).padStart(2,"0")+"  "+title,()=>go(cues[i][0]),false,false));$("chapters").append(row);});
function targetDraw(){
 $("target-wrap").replaceChildren(elt("span","R = "+show(target.outer)),elt("span","r = "+show(target.inner)),elt("span",show(target.lower)+" ≤ x ≤ "+show(target.upper)));
 M.allKeys.forEach(k=>$("edit-"+k).value=target[k]);
}
targetDraw();
function draw(){
 if(mode!=="watch")return;
 const {state,keys,chapter}=M.watchAt(t),sig=JSON.stringify(state)+"|"+chapter;
 seek.value=t;seek.setAttribute("aria-valuetext",tt(t)+" of "+tt(duration));$("clock").textContent=tt(t)+" / "+tt(duration);
 shell.setKeys(keys);$("stage-play").hidden=started||t>0;
 if(sig!==stamp){
  stamp=sig;render(state,true);$("caption").textContent=cues[chapter][2];fitFocused();
  [...$("chapters").children].forEach((it,i)=>it.firstElementChild.setAttribute("aria-current",String(i===chapter)));
 }
}
const bounded=at=>Math.min(duration,Math.max(0,Number(at)||0));
function labelPlay(){
 const ended=t>=duration-.012,name=playing?"Pause":ended?"Replay":"Play";
 $("play").textContent=name;$("play").setAttribute("aria-label",name);
 $("takeover").textContent=ended?"Try it":"Take over";
}
function go(at){t=bounded(at);origin=performance.now()-t*1000;draw();labelPlay();}
function pause(){if(playing)t=bounded((performance.now()-origin)/1000);playing=false;cancelAnimationFrame(frame);draw();labelPlay();}
function loop(now){if(!playing||mode!=="watch")return;t=bounded((now-origin)/1000);if(t>=duration){pause();return;}draw();frame=requestAnimationFrame(loop);}
function nativeBottom(){return (window.visualViewport?.height||innerHeight)-(document.querySelector(".tabbar")?.getBoundingClientRect().height||0);}
function fitFocused(){
 if(!focus)return;
 const avail=stage.getBoundingClientRect().height-$("watch-message").offsetHeight-$("watch-player").offsetHeight-25;
 stage.style.setProperty("--fit-handset",Math.max(120,Math.min(322,Math.floor(avail*.4777)))+"px");
}
window.addEventListener("resize",fitFocused);
const nativeFitObserver=new ResizeObserver(fitFocused);
[$("watch-message"),$("watch-player")].forEach(n=>nativeFitObserver.observe(n));
function setFocus(next){
 focus=next;stage.classList.toggle("focused",focus);document.body.classList.toggle("has-focus",focus);
 document.querySelectorAll("main > header, main > .calc-tabs, main > .reference").forEach(n=>n.inert=focus);
 $("focus").setAttribute("aria-pressed",String(focus));$("focus").setAttribute("aria-label",focus?"Exit Focus":"Focus");$("focus").textContent=focus?"Exit":"⛶";if(focus){fitFocused();stage.scrollTop=0;}
}
function ensureFit(){if(mode==="watch"&&!focus&&$("watch-player").getBoundingClientRect().bottom>nativeBottom()+1)setFocus(true);}
function toggle(){
 if(mode!=="watch")return;
 if(playing){pause();return;}
 if(!started)ensureFit();
 if(document.activeElement===$("stage-play"))$("play").focus({preventScroll:true});
 started=true;if(t>=duration-.012)go(0);origin=performance.now()-t*1000;playing=true;labelPlay();draw();frame=requestAnimationFrame(loop);
}
$("stage-play").onclick=$("play").onclick=toggle;
$("back").onclick=()=>go(t-10);$("next").onclick=()=>go(t+10);$("replay").onclick=()=>{pause();go(0);toggle()};
$("focus").onclick=()=>setFocus(!focus);seek.oninput=()=>go(seek.value);
function taskMode(){
 $("task").textContent=forked?"Continue from the copied Watch frame, or open the separate practice.":"Find the volume about the x-axis.";
 $("target-wrap").hidden=forked;$("reset").textContent=forked?"Practice task":"Reset";
 $("reset").setAttribute("aria-label",forked?"Practice task":"Reset practice calculator");
 $("edit").hidden=forked;
}
function saveFork(){
 if(!forked||forkKey===null)return;
 forkDrafts.delete(forkKey);forkDrafts.set(forkKey,s);
 if(forkDrafts.size>12)forkDrafts.delete(forkDrafts.keys().next().value);
}
function restorePractice(){
 if(!forked)return;
 saveFork();s=savedPractice;savedPractice=null;forked=false;forkKey=null;
}
function change(to,takeover=false,fromTab=false){
 if(to===mode)return;
 if(mode==="try")saveFork();
 if(mode==="watch"){
  pause();
  if(focus)setFocus(false);
  if(to==="try"){
   if(takeover&&t<duration-.012){
    if(!forked)savedPractice=s;
    forkKey=t.toFixed(3);s=forkDrafts.get(forkKey)??M.watchAt(t).state;forked=true;
   }else restorePractice();
  }
 }
 mode=to;stage.dataset.mode=mode;document.body.classList.toggle("in-try",to==="try");
 const watch=to==="watch",tabs=[$("watch-tab"),$("try-tab")];
 tabs.forEach((b,i)=>{const yes=(i===0)===watch;b.setAttribute("aria-selected",String(yes));b.tabIndex=yes?0:-1;});
 for(const id of ["watch","watch-message","watch-player"])$(id).hidden=!watch;
 for(const id of ["try","try-message"])$(id).hidden=watch;
 shell.setInteractive(!watch);shell.setKeys([]);clearTimeout(light);
 if(watch){stamp="";draw();requestAnimationFrame(ensureFit);if(!fromTab)$("play").focus({preventScroll:true});}
 else{$("stage-play").hidden=true;taskMode();render(s,false);if(!fromTab)stage.focus({preventScroll:true});}
}
[$("watch-tab"),$("try-tab")].forEach((b,i)=>{b.onclick=()=>change(i?"try":"watch",false,false);b.onkeydown=e=>{
 if(!["ArrowLeft","ArrowRight","Home","End"].includes(e.key))return;
 e.preventDefault();const to=e.key==="Home"?"watch":e.key==="End"?"try":i?"watch":"try";change(to,false,true);$(to+"-tab").focus();
};});
$("takeover").onclick=()=>change("try",true);$("return").onclick=()=>change("watch");
$("reset").onclick=()=>{
 if(forked)restorePractice();
 else{s=M.start();}
 taskMode();render(s,false);stage.focus({preventScroll:true});
};
$("edit-form").onsubmit=e=>{
 e.preventDefault();
 const msg=$("edit-error");
 try{
  const draft=Object.fromEntries(M.allKeys.map(k=>[k,$("edit-"+k).value]));M.setup(draft);target=draft;linkError="";s=M.start();
  targetDraw();render(s,false);msg.hidden=true;$("edit").open=false;stage.focus({preventScroll:true});
 }catch(error){msg.textContent=error.message;msg.hidden=false;}
};
document.addEventListener("keydown",e=>{
 if(e.defaultPrevented||e.target.closest?.(".top, .tabbar"))return;
 if(e.key==="Escape"&&focus){e.preventDefault();setFocus(false);$("focus").focus({preventScroll:true});return;}
 if(e.altKey||e.ctrlKey||e.metaKey||e.isComposing||e.target.closest("input,select,a,summary,textarea,[contenteditable]"))return;
 const b=e.target.closest("button");
 if(mode==="watch"){
  if(b||e.repeat)return;
  if(e.key===" "||e.key==="k"){e.preventDefault();toggle();}
  if(e.key==="j"||e.key==="l"){e.preventDefault();go(t+(e.key==="j"?-10:10));}
  return;
 }
 if((!stage.contains(e.target)&&e.target!==document.body)||(b&&["Enter"," ","Tab"].includes(e.key)))return;
 const map={m:"menu",M:"menu",p:"pi",P:"pi",Escape:"esc",Enter:"enter",ArrowDown:"down",ArrowUp:"up",ArrowLeft:"left",ArrowRight:"right",Backspace:"del",Delete:"del","-":"minus","+":"plus","×":"mul","*":"mul","^":"square",".":"dot","(":"lparen",")":"rparen"};
 let key=map[e.key]||(/^[x0-9]$/i.test(e.key)?e.key.toLowerCase():"");
 if(e.key==="Tab"&&s.page==="template"&&!(e.shiftKey&&s.field===0||!e.shiftKey&&s.field===3))key=e.shiftKey?"backtab":"tab";
 if(key){e.preventDefault();if(e.target===document.body)stage.focus({preventScroll:true});physical(key);}
});
stage.dataset.mode="watch";draw();labelPlay();if(params.get("mode")==="try"||request.linked)change("try",false,true);
requestAnimationFrame(ensureFit);
window.QBRecordedWatch?.bind(pause);
})();
