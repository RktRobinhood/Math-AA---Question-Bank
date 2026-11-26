(function(){"use strict";
const M=window.CT18,$=id=>document.getElementById(id),stage=$("stage"),seek=$("seek"),play=$("play"),overlay=$("start-overlay");
const request=M.request(new URLSearchParams(location.search)),tabs=[$("watch-tab"),$("try-tab")];
const fmt=v=>String(v).replaceAll("-","−"),pair=p=>"("+p.map(fmt).join(", ")+")";
const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const shown=(id,visible)=>$(id).hidden=!visible;
const status=(id,text,bad=false)=>{const e=$(id);e.textContent=text;e.dataset.error=String(bad);};
const timed=t=>Math.floor(t/60)+":"+String(Math.floor(t)%60).padStart(2,"0");
const shell=HandheldShell.mount({host:$("handheld-host"),screen:$("lcd"),interactive:false,label:"TI-Nspire CX II-T Calculator trainer",onKey:physical});
let mode="watch",t=0,origin=0,playing=false,started=false,frame=0,stamp="",focusOn=false,preferFocus=false,explicitNoFocus=false,light=0;
let target=request.target,notice=request.error,state=M.start(),practice=state,forkKey=null;
const forks=new Map();
function keep(){
 if(forkKey===null)return;
 forks.delete(forkKey);forks.set(forkKey,state);
 if(forks.size>12)forks.delete(forks.keys().next().value);
}
const fields=[["a","Site A (x, y)"],["b","Site B (x, y)"],["c","Site C (x, y)"],["p","Target P (x, y)"],["values","Readings A, B, C"]];
for(const [k,text] of fields){
 const l=node("label",text),el=node("input");el.name=k;el.required=true;el.maxLength=60;
 el.autocomplete="off";el.spellcheck=false;l.append(el);$("data-fields").append(l);
}
function resetInputs(){
 const form=$("data-form"),d=M.encode(target);
 for(const [k] of fields)form.elements[k].value=d[k];
}
function resetAssessment(){$("answer").reset();shown("value-wrap",false);status("assess-feedback","");}
function typedText(n,s){
 const chunks=s.split("²");chunks.forEach((part,i)=>{
  if(i)n.append(node("sup","2"));
  if(part)n.append(document.createTextNode(M.pretty(part)));
 });
}
function renderLCD(s){
 const d=$("lcd-body"); d.replaceChildren();
 const hist=node("div",undefined,"arithmetic-history");
 s.history.slice(-2).forEach(o=>{
  const row=node("div",undefined,"arithmetic-row"),exp=node("p",undefined,"arithmetic-expr");
  typedText(exp,o.text);const value=node("p",fmt(o.value),"arithmetic-result");value.dataset.result=o.value;
  row.append(exp,value);hist.append(row);
 });
 const entry=node("div",undefined,"arithmetic-in"),caret=node("span",undefined,"arithmetic-caret");caret.setAttribute("aria-hidden","true");
 typedText(entry,s.raw.slice(0,s.cursor));entry.append(caret);typedText(entry,s.raw.slice(s.cursor));d.append(hist,entry);
 if(s.error)d.append(node("p",s.error.includes("rehearsal")?"Use Calculator arithmetic.":"Check entry", "calculator-error"));
 entry.scrollLeft=Math.max(0,caret.offsetLeft-entry.clientWidth+8);
 $("lcd-text").textContent=[...s.history.slice(-2).map(r=>M.pretty(r.text)+" equals "+r.value),s.raw?"Entry: "+M.pretty(s.raw):"Calculator ready."].join("; ");
 stage.dataset.scene=s.error?"error":s.raw?"entry":s.result?"result":"idle";
}
function map(host,d,{edge=false,highlight=""}={}){
 const pts=M.ids.map(s=>[s,...d[s.toLowerCase()]]).concat([["P",...d.p]]);
 const minX=Math.min(...pts.map(([,x])=>x)),maxX=Math.max(...pts.map(([,x])=>x)),minY=Math.min(...pts.map(([,x,y])=>y)),maxY=Math.max(...pts.map(([,x,y])=>y));
 const cx=(minX+maxX)/2,cy=(minY+maxY)/2,scale=Math.min(29,234/Math.max(5,maxX-minX),140/Math.max(4,maxY-minY));
 const x=v=>135+(v-cx)*scale,y=v=>90-(v-cy)*scale;
 const ns="http://www.w3.org/2000/svg";
 const e=(tag,attrs={})=>{const n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);return n;};
 const svg=e("svg",{viewBox:"0 0 270 180",class:"voronoi-map",role:"img","aria-label":pts.map(([s,a,b])=>s+" "+pair([a,b])).join("; ")+(edge?"; A–B nearest-site boundary is drawn below its meeting point with the third site's cell.":"")});
 for(let u=minX-1;u<=maxX+1;u++)svg.append(e("line",{x1:x(u),x2:x(u),y1:0,y2:180,class:"map-grid"}));
 for(let v=minY-1;v<=maxY+1;v++)svg.append(e("line",{x1:0,x2:270,y1:y(v),y2:y(v),class:"map-grid"}));
 if(edge)svg.append(e("line",{x1:x(4),x2:x(4),y1:180,y2:y(2.7),class:"map-edge"}));
 if(highlight){
  for(const site of highlight){
   const [sx,sy]=d[site.toLowerCase()];svg.append(e("line",{x1:x(sx),y1:y(sy),x2:x(d.p[0]),y2:y(d.p[1]),class:"map-link"}));
  }
 }
 pts.forEach(([site,u,v])=>{
  const px=x(u),py=y(v),isP=site==="P";
  svg.append(e(isP?"rect":"circle",isP?{x:px-4,y:py-4,width:8,height:8,rx:1,class:"map-target"}:{cx:px,cy:py,r:4.75,class:"map-site"}));
  const t=e("text",{x:Math.min(251,px+8),y:Math.max(13,Math.min(173,py+(isP?14:-7))),class:"map-name"});
  t.textContent=site;svg.append(t);
 });
 const caption=node("figcaption",(edge?"A–B boundary · ":"")+"Lesson map · not the TI screen");
 $(host).replaceChildren(svg,caption);
}
function targetDraw(){
 if(forkKey!==null){$("givens").replaceChildren();return;}
 $("givens").replaceChildren(node("span","P "+pair(target.p)),...M.ids.map((s,i)=>node("span",s+" "+pair(target[s.toLowerCase()])+" → "+target.values[i])));
 map("try-plot",target);
}
function press(k){
 if(mode!=="try")return;
 if(document.activeElement!==stage)stage.focus({preventScroll:true});
 clearTimeout(light);shell.setKeys([k]);light=setTimeout(()=>shell.setKeys([]),160);
 state=M.press(state,k);
 if(forkKey===null)practice=state;else keep();
 status("tool-status",state.error||((forkKey===null&&notice)||""),Boolean(state.error||forkKey===null&&notice));
 renderLCD(state);
}
function physical(k){press(k);}
function paintTry(){
 const own=forkKey===null;
 $("try-context").textContent=own?"Give the estimate at P using the nearest site’s reading. No tie-break rule is given.":"Try a change in this copied calculator. Your independent practice is unchanged.";
 $("reset").textContent=own?"Reset":"Practice task";
 $("reset").setAttribute("aria-label",own?"Reset practice":"Open the independent practice task");
 for(const id of ["edit-details","answer","try-map"])shown(id,own);
 status("tool-status",state.error||(own?notice:""),Boolean(state.error||own&&notice));
 targetDraw();renderLCD(state);size();
}
$("answer-rule").onchange=()=>shown("value-wrap",$("answer-rule").value==="value");
$("answer").oninput=()=>status("assess-feedback","");
$("answer").onsubmit=e=>{
 e.preventDefault();if(forkKey!==null)return;
 const a=Object.fromEntries(["da","db","dc","near","rule","value"].map(k=>[k,$("answer-"+k).value]));
 const result=M.grade(target,state,a);status("assess-feedback",result.feedback,!result.ok);
};
$("data-form").onsubmit=e=>{
 e.preventDefault();if(forkKey!==null)return;
 try{
  target=M.parse(Object.fromEntries(new FormData(e.currentTarget)));notice="";state=practice=M.start();
  $("edit-details").open=false;status("edit-feedback","");resetInputs();resetAssessment();paintTry();stage.focus({preventScroll:true});
 }catch(err){status("edit-feedback",err.message,true);}
};
function paintWatch(){
 if(mode!=="watch")return;
 const {state:s,active,chapter:j}=M.watchAt(t);
 seek.value=t;seek.setAttribute("aria-valuetext",timed(t)+" of "+timed(M.duration));$("clock").textContent=timed(t)+" / "+timed(M.duration);
 $("take").textContent=t>=M.duration-.012?"Try it":"Take over";
 shell.setKeys(active);overlay.hidden=started||t>0;
 const next=JSON.stringify([j,s]);
 if(stamp===j+"|"+next)return;
 const phase=stamp.split("|")[0],newChapter=Number(phase)!==j||!stamp;
 stamp=j+"|"+next;
 renderLCD(s);$("caption").textContent=M.cues[j][2];
 if(newChapter){
  const boundary=j>=5;map("watch-plot",boundary?M.boundary:M.demo,{edge:boundary,highlight:["","A","B","C","A","AB","C","AB"][j]});
  [...$("chapters").children].forEach((li,i)=>li.firstElementChild.setAttribute("aria-current",String(j===i)));
  size();
 }
}
function navigationInset(){return document.querySelector(".tabbar")?.offsetHeight||0;}
function size(){
 const h=window.visualViewport?.height||innerHeight;
 if(mode==="try"){
  const top=$("handheld-host").getBoundingClientRect().top+window.scrollY;
  stage.style.setProperty("--try-fit",Math.max(153,Math.min(302,Math.floor((h-top-10)*558/1168)))+"px");
  return;
 }
 const avail=h-(Math.max(0,stage.getBoundingClientRect().top)+navigationInset()),short=focusOn&&innerWidth>710&&avail<=600;
 const budget=short?22:$("watch-message").offsetHeight+$("watch-player").offsetHeight+22;
 stage.style.setProperty("--watch-fit",Math.max(115,Math.min(focusOn?348:297,Math.floor((avail-budget)*558/1168)))+"px");
}
const observer=new ResizeObserver(size);["watch-message","watch-player","try-header"].forEach(id=>observer.observe($(id)));
window.addEventListener("resize",size);window.visualViewport?.addEventListener("resize",size);
function focus(next){
 focusOn=next;stage.classList.toggle("focus-open",next);document.body.classList.toggle("stats-focus",next);
 for(const n of document.querySelectorAll("main > .head, main > .calc-tabs, main > .notes"))n.inert=next;
 const f=$("focus");f.textContent=next?"Exit":"Focus";f.setAttribute("aria-pressed",String(next));f.setAttribute("aria-label",next?"Exit focused view":"Focus");
 if(next)stage.scrollTop=0;size();
}
function fitWatch(){
 size();if(mode==="watch"&&!focusOn&&!explicitNoFocus&&($("watch-player").getBoundingClientRect().bottom>innerHeight+1||shell.body.getBoundingClientRect().width<164))focus(true);
}
function labelPlay(){
 const label=playing?"Pause":t>=M.duration-.012?"Replay":"Play";play.textContent=label;play.setAttribute("aria-label",label);
}
function go(at){t=Math.min(M.duration,Math.max(0,Number(at)||0));origin=performance.now()-t*1000;paintWatch();labelPlay();fitWatch();}
function pause(){playing=false;cancelAnimationFrame(frame);paintWatch();labelPlay();}
function animate(now){if(!playing||mode!=="watch")return;t=Math.min(M.duration,Math.max(0,(now-origin)/1000));paintWatch();if(t>=M.duration){pause();return;}frame=requestAnimationFrame(animate);}
function start(){
 if(mode!=="watch")return;
 fitWatch();
 if(document.activeElement===overlay)play.focus({preventScroll:true});
 started=true;if(t>=M.duration-.012)go(0);
 playing=true;origin=performance.now()-t*1000;paintWatch();labelPlay();frame=requestAnimationFrame(animate);
}
function toggle(){if(playing)pause();else start();}
play.onclick=overlay.onclick=toggle;
$("back").onclick=()=>go(t-10);$("forward").onclick=()=>go(t+10);
$("replay").onclick=()=>{pause();go(0);start();};seek.oninput=()=>go(seek.value);
$("focus").onclick=()=>{explicitNoFocus=focusOn;focus(!focusOn);};
M.cues.forEach(([at,title],i)=>{
 const li=node("li"),b=node("button");b.type="button";b.append(node("span",String(i+1).padStart(2,"0")),document.createTextNode(title));
 b.onclick=()=>go(at);li.append(b);$("chapters").append(li);
});
seek.max=M.duration;resetInputs();resetAssessment();
function change(to,take=false,arrow=false){
 if(to===mode&&to==="try"&&forkKey===null)return;
 if(mode==="watch"&&to==="try"){
  pause();preferFocus=focusOn;if(focusOn)focus(false);
  forkKey=take&&t<M.duration-.012?t.toFixed(3):null;
  state=forkKey===null?practice:(forks.get(forkKey)||M.watchAt(t).state);
 }else if(mode==="try"){
  keep();if(to==="try"){forkKey=null;state=practice;}
 }
 mode=to;stage.dataset.mode=to;stamp="";
 const watch=to==="watch";
 document.body.classList.toggle("stats-try",!watch);
 ["watch-message","watch-player","watch-panel"].forEach(id=>shown(id,watch));
 ["try-header","try-panel"].forEach(id=>shown(id,!watch));
 tabs.forEach((el,i)=>{const selected=(i===0)===watch;el.tabIndex=selected?0:-1;el.setAttribute("aria-selected",String(selected));});
 clearTimeout(light);shell.setKeys([]);shell.setInteractive(!watch);
 if(watch){
  paintWatch();labelPlay();if(preferFocus&&!explicitNoFocus)focus(true);
  fitWatch();requestAnimationFrame(fitWatch);if(!arrow)play.focus({preventScroll:true});
 }else{overlay.hidden=true;paintTry();if(!arrow)stage.focus({preventScroll:true});}
}
tabs.forEach((b,i)=>{
 b.onclick=()=>change(i?"try":"watch");
 b.onkeydown=e=>{if(["ArrowLeft","ArrowRight","Home","End"].includes(e.key)){e.preventDefault();const k=e.key==="Home"?0:e.key==="End"?1:1-i;change(k?"try":"watch",false,true);tabs[k].focus();}};
});
$("take").onclick=()=>change("try",true);$("return").onclick=()=>change("watch");
$("reset").onclick=()=>{
 if(forkKey!==null){keep();forkKey=null;state=practice;}
 else{state=practice=M.start();notice="";resetAssessment();}
 paintTry();stage.focus({preventScroll:true});
};
document.addEventListener("keydown",e=>{
 if(e.target!==document.body&&!e.target.closest?.(".qb-calculator-lesson"))return;
 if(e.key==="Escape"&&focusOn){e.preventDefault();explicitNoFocus=true;focus(false);$("focus").focus({preventScroll:true});return;}
 const el=e.target;if(e.altKey||e.metaKey||e.ctrlKey||e.isComposing||el.closest("input,textarea,select,a,summary,[contenteditable]"))return;
 if(mode==="watch"){if(el.closest("button")||e.repeat)return;const k=e.key.toLowerCase();if(k==="k"||k===" "){e.preventDefault();toggle();}else if(k==="j"||k==="l"){e.preventDefault();go(t+(k==="j"?-10:10));}return;}
 if((!stage.contains(el)&&el!==document.body)||(el.closest("button")&&["Enter"," "].includes(e.key)))return;
 const keys={m:"menu",M:"menu",Escape:"esc",Enter:"enter",Backspace:"del",Delete:"del",ArrowLeft:"left",ArrowRight:"right","-":/[\d)²]/.test(state.raw[state.cursor-1]??"")?"minus":"neg","−":"minus","+":"plus","*":"mul","×":"mul","(":"lparen",")":"rparen",s:"square",S:"square","²":"square"};
 const k=keys[e.key]||(/^[0-9]$/.test(e.key)?e.key:"");if(k){e.preventDefault();press(k);}
});
if(new URLSearchParams(location.search).get("mode")==="try"||request.linked)change("try",false,true);
else{paintWatch();labelPlay();requestAnimationFrame(fitWatch);}
window.QBRecordedWatch?.bind(pause);
})();
