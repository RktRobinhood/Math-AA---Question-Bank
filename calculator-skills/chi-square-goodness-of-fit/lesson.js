(function(){"use strict";
const M=window.CT48,$=id=>document.getElementById(id),stage=$("stage"),seek=$("seek"),screen=$("screen");
const params=new URLSearchParams(location.search),request=M.request(params);
const {cues,duration}=M;
seek.max=duration;
let mode="watch",t=0,origin=0,playing=false,started=false,focus=false,frame=0,stamp="",s=M.start(request.target),forked=false,light=0;
let target=request.target,linkError=request.error,savedPractice=null,forkKey=null;
const forkDrafts=new Map();
const shell=HandheldShell.mount({host:$("handheld-host"),screen:$("lcd"),interactive:false,label:"TI-Nspire CX II-T Lists & Spreadsheet",onKey:k=>{physical(k);stage.focus({preventScroll:true});}});
const tt=t=>"0:"+String(Math.floor(t)).padStart(2,"0"),pretty=v=>String(v).replace(/-/g,"−");
const elt=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
function label(text,action,active,watch,cls){
 const b=elt("button",text,cls);b.type="button";
 if(active)b.classList.add("calc-active");
 if(watch)b.disabled=true;else if(action)b.addEventListener("click",action);
 return b;
}
let answer={stat:"",decision:""},answerFeedback="";
const fmt=n=>pretty(Number(n.toPrecision(6)));
function refresh(snapshot,mod){s={...snapshot,...mod};render(s,false);stage.focus({preventScroll:true});}
function controls(snapshot,watch){
 const modal=elt("div",undefined,"lcd-modal"),page=snapshot.page;
 if(M.menu[page]){
  const title=M.paths[page];modal.setAttribute("aria-label",title);modal.append(elt("strong",title,"menu-title"));
  M.menu[page].forEach(([id,name],i)=>modal.append(label(id+": "+name+((page==="menu"&&id===4||page==="stats"&&id===4)?" ▸":""),()=>physical(String(id)),i===snapshot.index,watch,"menu-item")));
  return modal;
 }
 const title="χ² GOF",table=elt("div",undefined,"lcd-grid"),actions=elt("div",undefined,"lcd-actions");
 modal.setAttribute("aria-label",title);modal.append(elt("strong",title,"menu-title"));
 M.fields.forEach((key,i)=>{
  const name=M.labels[key],v=key==="out"?"c[]":key==="draw"?"☐ Shade P Value":snapshot.fields[key],n=label(pretty(v)||" ",()=>refresh(snapshot,{field:i,error:""}),snapshot.field===i,watch,"dim-value");
  n.setAttribute("aria-label",name+": "+(v||"blank"));n.dataset.field=key;
  const caption=elt("span",name);
  if(key==="df"||key==="out")caption.replaceChildren(elt("span",name,"field-wide"),elt("span",key==="df"?"df":"Result column","field-compact"));
  if(key==="draw")n.replaceChildren(elt("span",v,"field-wide"),elt("span","☐ Off","field-compact"));
  table.append(caption,n);
 });
 [["OK",5],["Cancel",6]].forEach(([name,i])=>actions.append(label(name,()=>{s={...s,field:i};physical("enter");},snapshot.field===i,watch)));
 modal.append(table,actions);return modal;
}
const showValue=n=>Number(n.toPrecision(6));
const short=n=>pretty(showValue(n));
function sheet(snapshot,watch){
 const r=snapshot.result,show=!!r,grid=elt("div",undefined,"sheet-grid");
 grid.classList.toggle("with-output",show);grid.append(elt("span","","row-num"));
 for(const name of show?["A","B","C","D"]:["A","B","C"])grid.append(elt("span",name,"col-id"));
 grid.append(elt("span","","row-num"),elt("span","obs","list-name"),elt("span","expt","list-name"),elt("span","","list-name"));if(show)grid.append(elt("span","","list-name"));
 const outputs=r?[["χ²",r.stat],["PVal",r.p],["df",r.df]]:[];
 const last=snapshot.cells[0].length,start=Math.min(Math.max(0,last-4),Math.max(0,snapshot.row-3));
 for(let i=start;i<Math.min(last,start+4);i++){
  grid.append(elt("span",String(i+1),"row-num"));
  [0,1].forEach(j=>{
   const active=snapshot.col===j&&snapshot.row===i&&(snapshot.page==="sheet"||snapshot.page==="result"),
     displayed=active&&snapshot.draft!==null?snapshot.draft:snapshot.cells[j][i];
   const n=label(displayed||" ",()=>{s=M.chooseCell(s,j,i);render(s,false);stage.focus({preventScroll:true});},active,watch||!["sheet","result"].includes(snapshot.page),"sheet-cell");
   n.dataset.sheet=j+","+i;n.setAttribute("aria-label",(j?"Expected":"Observed")+" count, row "+(i+1)+": "+(displayed||"blank"));grid.append(n);
  });
  if(show){
   const [name,val]=outputs[i]??["",null],a=elt("span",name,"sheet-out"),b=elt("b",val===null?"":name==="PVal"&&r.underflow?"<1E−308":short(val),"sheet-out");
   if(name){b.dataset.stat=name;if(name!=="PVal"||!r.underflow)b.dataset.exact=String(val);}
   grid.append(a,b);
  }else grid.append(elt("span","","sheet-out"));
 }
 return grid;
}
function render(snapshot,watch){
 stage.dataset.lcd=snapshot.page;screen.replaceChildren(sheet(snapshot,watch));
 const line=elt("div",undefined,"calc-input");line.append(elt("span",String.fromCharCode(65+snapshot.col)+(snapshot.row+1)+" = "+(snapshot.draft??snapshot.cells[snapshot.col][snapshot.row]??"")));screen.append(line);
 if(M.menu[snapshot.page]||snapshot.page==="form")screen.append(controls(snapshot,watch));
 if(snapshot.error)screen.append(elt("div",snapshot.error.split(". ")[0],"lcd-error"));
 if(watch)return;
 const labels={sheet:"Multiply total observations by each claimed proportion. Enter expected counts in expt, pressing Enter after each. The sheet scrolls as you go.",menu:"Choose Statistics.",stats:"Choose Stat Tests.",tests:"Select χ² GOF, not the two-way test.",form:"Enter obs, then expt, then categories minus one. Keep c[] as the result column and Draw off.",result:"Read the χ² statistic, PVal and df. Compare PVal with the task's significance level."};
 $("hint").textContent=labels[snapshot.page];
 const e=snapshot.error||(!forked&&linkError)||"";$("error").textContent=e;$("error").hidden=!e;
 const current=snapshot.page==="result"?snapshot.result:null,matched=!forked&&M.matches(current,target);
 $("progress").textContent=current&&!forked&&!matched?"These results use different counts, list roles or degrees of freedom from the task.":matched&&showValue(current.p)===target.alpha&&current.p!==target.alpha?"The display rounds PVal to α. The unrounded p-value is "+(current.p>target.alpha?"just above":"just below")+" α.":"";
 $("progress").hidden=!$("progress").textContent;
 $("decision").hidden=!matched;
 $("guess-stat").value=answer.stat;$("decision-value").value=answer.decision;
 $("decision-feedback").textContent=answerFeedback;$("decision-feedback").hidden=!answerFeedback;
}
function physical(key){
 if(mode!=="try")return;
 clearTimeout(light);
 const keys=[key];
 shell.setKeys(keys);light=setTimeout(()=>shell.setKeys([]),175);
 const old=s.result;s=M.press(s,key);if(s.result!==old){answer={stat:"",decision:""};answerFeedback="";}render(s,false);
}
cues.forEach(([,title],i)=>{const row=elt("li");row.append(label(String(i+1).padStart(2,"0")+"  "+title,()=>go(cues[i][0]),false,false));$("chapters").append(row);});
function targetDraw(){
 const {obs,probs,alpha}=target;
 $("target-wrap").replaceChildren(elt("span","Claimed proportions: "+probs.join(", ")),elt("span","α = "+alpha));
 for(const [k,v] of [["obs",obs.join(",")],["probs",probs.join(",")],["alpha",String(alpha)]])$("edit-form").elements[k].value=v;
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
 $("task").textContent=forked?"Continue the copied Watch frame, or open the separate practice.":"Test one claimed categorical distribution.";
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
 saveFork();s=savedPractice.s;answer=savedPractice.answer;answerFeedback=savedPractice.answerFeedback;savedPractice=null;forked=false;forkKey=null;
}
function change(to,takeover=false,fromTab=false){
 if(to===mode)return;
 if(mode==="try")saveFork();
 if(mode==="watch"){
  pause();
  if(focus)setFocus(false);
  if(to==="try"){
   if(takeover&&t<duration-.012){
    if(!forked)savedPractice={s,answer,answerFeedback};
    forkKey=t.toFixed(3);s=forkDrafts.get(forkKey)??M.watchAt(t).state;forked=true;answer={stat:"",decision:""};answerFeedback="";
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
 else{s=M.start(target);answer={stat:"",decision:""};answerFeedback="";}
 taskMode();render(s,false);stage.focus({preventScroll:true});
};
$("edit-form").onsubmit=e=>{
 e.preventDefault();const msg=$("edit-error"),fd=new FormData($("edit-form"));
 try{
  const draft={obs:M.list(fd.get("obs"),"obs"),probs:M.list(fd.get("probs"),"probs"),alpha:Number(fd.get("alpha"))};
  M.setup(draft.obs,draft.probs,draft.alpha);target=draft;linkError="";s=M.start(target);answer={stat:"",decision:""};answerFeedback="";
  targetDraw();taskMode();render(s,false);msg.hidden=true;$("edit").open=false;stage.focus({preventScroll:true});
 }catch(error){msg.textContent=error.message;msg.hidden=false;}
};
$("guess-stat").oninput=()=>{answer.stat=$("guess-stat").value;answerFeedback="";$("decision-feedback").hidden=true;};
$("decision-value").onchange=()=>{answer.decision=$("decision-value").value;answerFeedback="";$("decision-feedback").hidden=true;};
$("decision").onsubmit=e=>{
 e.preventDefault();if(!M.matches(s.result,target)||s.page!=="result")return;
 const reject=s.result.p<=target.alpha,raw=answer.stat.trim();
 const guess=/^[+]?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?$/i.test(raw)?Number(raw):NaN;
 const expected=[s.result.stat,showValue(s.result.stat)].map(x=>Number(x.toPrecision(3)));
 answerFeedback=!Number.isFinite(guess)||!answer.decision?"Enter the statistic and choose a decision.":!expected.some(x=>Math.abs(guess-x)<=1e-10*Math.max(1,Math.abs(x)))?"Read χ², not PVal, and give three significant figures.":(answer.decision==="yes")===reject?(reject?"Correct: p ≤ α. There is evidence the claimed proportions do not fit.":"Correct: p > α. There is insufficient evidence against the claimed proportions."):"Compare PVal with α. Reject only when p ≤ α.";
 render(s,false);
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
 const map={m:"menu",M:"menu",Escape:"esc",Enter:"enter",ArrowDown:"down",ArrowUp:"up",ArrowLeft:"left",ArrowRight:"right",Backspace:"del",Delete:"del","-":"neg",".":"dot"};
 let key=map[e.key]||(/^[a-z0-9]$/i.test(e.key)?e.key.toLowerCase():"");
 if(e.key==="Tab"&&s.page==="form"){
  const n=M.fields.length;
  if(e.shiftKey&&s.field===0||!e.shiftKey&&s.field===n+1)return;
  key=e.shiftKey?"backtab":"tab";
 }
 if(key){e.preventDefault();if(e.target===document.body)stage.focus({preventScroll:true});physical(key);}
});
stage.dataset.mode="watch";draw();labelPlay();if(params.get("mode")==="try"||request.linked)change("try",false,true);
requestAnimationFrame(ensureFit);
window.QBRecordedWatch?.bind(pause);
})();
