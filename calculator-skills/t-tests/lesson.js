(function(){"use strict";
const M=window.CT46,$=id=>document.getElementById(id),stage=$("stage"),seek=$("seek"),screen=$("screen");
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
let answer="",answerFeedback="";
const fmt=n=>pretty(Number(n.toPrecision(6)));
function refresh(snapshot,mod){s={...snapshot,...mod};render(s,false);stage.focus({preventScroll:true});}
function options(snapshot,watch,title,values,current,format){
 const modal=elt("div",undefined,"lcd-modal option-sheet");modal.setAttribute("aria-label",title);
 for(const v of values)modal.append(label(format(v),()=>refresh(snapshot,M.choose(snapshot,v)),v===current,watch,"menu-item"));
 return modal;
}
function controls(snapshot,watch){
 const modal=elt("div",undefined,"lcd-modal"),page=snapshot.page;
 if(M.menu[page]){
  const title=M.paths[page];modal.setAttribute("aria-label",title);modal.append(elt("strong",title,"menu-title"));
  M.menu[page].forEach(([id,name],i)=>modal.append(label(id+": "+name+((page==="menu"&&id===6||page==="stats"&&id===7)?" ▸":""),()=>physical(String(id)),i===snapshot.index,watch,"menu-item")));
  return modal;
 }
 const test=snapshot.test,title=M.title(test),table=elt("div",undefined,"lcd-grid"),actions=elt("div",undefined,"lcd-actions");
 modal.setAttribute("aria-label",title);modal.append(elt("strong",title,"menu-title"));
 const method=page==="method",fs=method?["method"]:M.fields(test);
 const choose=(i,key)=>refresh(snapshot,{field:i,list:!!key,error:""});
 const list=fs[snapshot.field],isAlt=list==="alt";
 const caption=k=>k==="method"?"Data Input Method":M.labels[k];
 const visual=(key,value)=>key==="alt"?M.hypothesis(test,value):key==="pooled"?value==="yes"?"Yes":"No":pretty(value);
 const first=Math.min(Math.max(0,fs.length-4),Math.max(0,snapshot.field-2));
 fs.forEach((key,i)=>{
  if(i<first||i>=first+4)return;
  const dropdown=["method","alt","pooled"].includes(key),value=method?snapshot.method:snapshot.values[key],v=visual(key,value);
  const h=label(v+(dropdown?" ▾":"")||" ",()=>choose(i,dropdown),snapshot.field===i,watch,"dim-value");
  h.setAttribute("aria-label",caption(key)+": "+(v||"blank"));h.dataset.field=key;
  table.append(elt("span",caption(key)),h);
 });
 [["OK",fs.length],["Cancel",fs.length+1]].forEach(([name,i])=>actions.append(label(name,()=>{s={...s,field:i,list:false};physical("enter");},snapshot.field===i,watch)));
 modal.append(table,actions);
 if(snapshot.list){
  modal.append(method?options(snapshot,watch,"Input methods",["Data","Stats"],snapshot.method,v=>v):
  options(snapshot,watch,caption(list),isAlt?M.alts:["no","yes"],snapshot.values[list],v=>visual(list,v)));
 }
 return modal;
}
function resultCard(result){
 const el=elt("div",undefined,"stat-card");el.append(elt("strong",M.title(result.task.test),"stat-title"),elt("div",M.hypothesis(result.task.test,result.task.alt),"stat-hyp"));
 for(const [name,val,text] of [["t",result.t,fmt(result.t)],["PVal",result.p,result.extremeSmall?"< 1E−308":fmt(result.p)],["df",result.df,fmt(result.df)],...(result.sp===null?[]:[["sp",result.sp,fmt(result.sp)]])]){
  const row=elt("div",undefined,"stat-row"),value=elt("b",text);value.dataset.stat=name;if(name!=="PVal"||!result.extremeSmall)value.dataset.exact=String(val);
  row.append(elt("span",name),value);el.append(row);
 }
 return el;
}
function render(snapshot,watch){
 stage.dataset.lcd=snapshot.page;screen.replaceChildren();
 if(snapshot.result)screen.append(resultCard(snapshot.result));
 screen.append(elt("div",undefined,"calc-input"));
 screen.lastElementChild.append(elt("i",undefined,"cursor"));
 if(M.menu[snapshot.page]||["method","form"].includes(snapshot.page))screen.append(controls(snapshot,watch));
 if(snapshot.error)screen.append(elt("div",snapshot.error.split(". ")[0],"lcd-error"));
 if(watch)return;
 const labels={calc:"Open Menu → 6 Statistics → 7 Stat Tests. Choose the test that matches the study.",menu:"Choose Statistics.",stats:"Choose Stat Tests.",tests:"Use t Test for one sample, or 2-Sample t Test for independent groups.",method:"Use the dropdown to choose Stats. Then confirm.",form:"Enter the supplied summaries. Set the alternative and, for two samples, pooling. Tab to OK, then Enter.",result:"Read PVal for the hypothesis shown. Compare it with α."};
 $("hint").textContent=labels[snapshot.page];
 const e=snapshot.error||(!forked&&linkError)||"";$("error").textContent=e;$("error").hidden=!e;
 const current=snapshot.page==="result"?snapshot.result:null,matched=!forked&&M.matches(current,target);
 $("progress").textContent=current&&!forked?(matched?"Use this PVal for the assigned test.":"This output uses a different test, tail, or inputs from the task."):"";
 $("progress").hidden=!$("progress").textContent;
 $("decision").hidden=!matched;
 $("decision-value").value=answer;
 $("decision-feedback").textContent=answerFeedback;$("decision-feedback").hidden=!answerFeedback;
}
function physical(key){
 if(mode!=="try")return;
 clearTimeout(light);
 const keys=[key];
 shell.setKeys(keys);light=setTimeout(()=>shell.setKeys([]),175);
 const old=s.result;s=M.press(s,key);if(s.result!==old){answer="";answerFeedback="";}render(s,false);
}
cues.forEach(([,title],i)=>{const row=elt("li");row.append(label(String(i+1).padStart(2,"0")+"  "+title,()=>go(cues[i][0]),false,false));$("chapters").append(row);});
function editDraw(test,target){
 $("edit-pool-wrap").hidden=test!=="two";
 $("edit-values").replaceChildren(...M.fields(test).filter(k=>!["alt","pooled"].includes(k)).map(k=>{
  const lab=elt("label",M.labels[k]+" "),input=elt("input");input.name=k;input.required=true;input.maxLength=8;input.value=target?.[k]??"";lab.append(input);return lab;
 }));
}
function targetDraw(){
 const v=M.parse(target),name=v.test==="two"?["Group 1: "+[v.mean1,v.sd1,v.n1].map(pretty).join(", "), "Group 2: "+[v.mean2,v.sd2,v.n2].map(pretty).join(", ")]:["μ₀ = "+pretty(v.mu),"x̄ = "+pretty(v.mean),"sx = "+v.sd,"n = "+v.n];
 $("target-wrap").replaceChildren(...name.map(x=>elt("span",x)),elt("span","H₁: "+M.hypothesis(v.test,v.alt)),...(v.test==="two"?[elt("span","Pooled: "+(v.pooled==="yes"?"Yes":"No"))]:[]),elt("span","α = "+v.alpha));
 $("edit-test").value=v.test;$("edit-alt").value=v.alt;$("edit-alpha").value=v.alpha===.1?"0.10":String(v.alpha);$("edit-pooled").value=v.pooled??"yes";editDraw(v.test,v);
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
 $("task").textContent=forked?"Continue the copied Watch frame, or open the separate practice.":target.test==="two"?"Independent normal samples · x̄, sx, n":"One normal sample · σ unknown";
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
    forkKey=t.toFixed(3);s=forkDrafts.get(forkKey)??M.watchAt(t).state;forked=true;answer="";answerFeedback="";
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
 else{s=M.start();answer="";answerFeedback="";}
 taskMode();render(s,false);stage.focus({preventScroll:true});
};
$("edit-test").onchange=()=>editDraw($("edit-test").value,$("edit-test").value===target.test?target:null);
$("edit-form").onsubmit=e=>{
 e.preventDefault();
 const msg=$("edit-error"),test=$("edit-test").value;
 try{
  const draft={test,...Object.fromEntries(new FormData($("edit-form"))),alt:$("edit-alt").value,alpha:$("edit-alpha").value,...(test==="two"?{pooled:$("edit-pooled").value}:{})};
  M.parse(draft);target=draft;linkError="";s=M.start();answer="";answerFeedback="";
  targetDraw();taskMode();render(s,false);msg.hidden=true;$("edit").open=false;stage.focus({preventScroll:true});
 }catch(error){msg.textContent=error.message;msg.hidden=false;}
};
$("decision-value").onchange=()=>{answer=$("decision-value").value;answerFeedback="";};
$("decision").onsubmit=e=>{
 e.preventDefault();if(!M.matches(s.result,target))return;
 answer=$("decision-value").value;
 const reject=s.result.p<=M.parse(target).alpha;
 answerFeedback=!answer?"Choose a decision first.":(answer==="yes")===reject?(reject?"Correct: p ≤ α. There is evidence for the stated alternative.":"Correct: p > α. There is insufficient evidence for the stated alternative."):"Compare PVal with α. Reject only when p ≤ α.";
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
 let key=map[e.key]||(/^\d$/.test(e.key)?e.key:"");
 if(e.key==="Tab"&&["method","form"].includes(s.page)&&!s.list){
  const n=s.page==="method"?1:M.fields(s.test).length;
  if(e.shiftKey&&s.field===0||!e.shiftKey&&s.field===n+1)return;
  key=e.shiftKey?"backtab":"tab";
 }
 if(key){e.preventDefault();if(e.target===document.body)stage.focus({preventScroll:true});physical(key);}
});
stage.dataset.mode="watch";draw();labelPlay();if(params.get("mode")==="try"||request.linked)change("try",false,true);
requestAnimationFrame(ensureFit);
window.QBRecordedWatch?.bind(pause);
})();
