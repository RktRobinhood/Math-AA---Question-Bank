(function(){"use strict";
const M=window.CT34,T=window.CT34Tape,$=id=>document.getElementById(id),stage=$("stage"),seek=$("seek"),overlay=$("start-overlay"),play=$("play");
const params=new URLSearchParams(location.search),request=M.request(params),tabs=[$("watch-tab"),$("try-tab")];
const shell=HandheldShell.mount({host:$("handheld-host"),screen:$("lcd"),interactive:false,label:"TI-Nspire CX II-T log-linearization handheld",onKey:k=>{physical(k);stage.focus({preventScroll:true});}});
const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const btn=(text,active,click)=>{const b=node("button",text,active?"calc-active":"");b.type="button";if(click)b.addEventListener("click",click);else b.disabled=true;return b;};
const format=v=>v===null?"":M.display(v), timed=t=>"0:"+String(Math.floor(t)).padStart(2,"0");
let mode="watch",clock=0,playing=false,frame=0,origin=0,stamped="",started=false,focusOn=false,preferFocus=false,considered=false,firstWatch=true,hasOwnTry=false,light=0,state=M.init(request.data),assignedState=state,assignedAnswer=null,feedbackState=null,forkAt=null;
const forks=new Map();
seek.max=T.duration;
function keyOf(k){return ({esc:"escape",del:"backspace",neg:"negative",dot:".",lparen:"(",rparen:")"})[k]||k;}
function dataSheet(s,watch){
 const t=node("table",undefined,"lcd-sheet data-sheet"),head=t.createTHead(),body=t.createTBody();
 [["","A","B","C"],["","xval","yval",s.cname]].forEach((tr,k)=>{const row=head.insertRow();for(const [i,x] of tr.entries()){
   const edit=s.row===-2&&s.col===2&&k===1&&i===3,cell=node("th",edit&&s.edit!==null?s.edit:x,edit?"calc-active":"");
   if(k===1&&i===3&&!watch){cell.dataset.cell="-2:2";cell.onclick=()=>cellAt(-2,2);}
   row.append(cell);
 }});
 const form=body.insertRow();form.className="form";
 const formula=s.row===-1&&s.col===2&&s.edit!==null?s.edit:s.formula;
 const f=node("td",(s.cname?s.cname+":=":"=")+formula,s.row===-1&&s.col===2?"calc-active":"");
 f.title=(s.cname?s.cname+":=":"=")+formula;
 if(!watch){f.dataset.cell="-1:2";f.onclick=()=>cellAt(-1,2);}
 form.append(node("th",""),node("td","="),node("td","="),f);
 function cellAt(i,j){const q=state.edit!==null?M.press(state,"enter"):state;update(q.error?q:{...q,row:i,col:j});stage.focus({preventScroll:true});}
 const rows=Math.max(5,s.x.findLastIndex(x=>x!==null)+1,s.y.findLastIndex(x=>x!==null)+1,s.row+1),start=Math.max(0,s.row-4);
 for(let i=start;i<Math.min(start+5,rows);i++){
  const row=body.insertRow();row.append(node("th",String(i+1)));
  [s.x,s.y,s.y.map(v=>v!==null&&v>0&&s.formula?Math.log(v):null)].forEach((a,j)=>{
   const active=i===s.row&&j===s.col&&s.page==="sheet",td=node("td",(active&&s.edit!==null?s.edit:format(a[i]))||" ",active?"calc-active":"");
   if(!watch&&s.page==="sheet"){
    td.dataset.cell=i+":"+j;td.title=(j===0?"xval":j===1?"yval":"lny")+", row "+(i+1);
    td.addEventListener("click",()=>cellAt(i,j));
   }
   row.append(td);
  });
 }
 return t;
}
function statsRows(s){
 const r=s.run;
 return [["Title","Linear Regression"],["RegEqn","mx+b"],["m",format(r.slope)],["b",format(r.intercept)],["r²",format(r.r2)||"undef"],["r",format(r.r)||"undef"],["Resid","{"+r.logResiduals.map(format).join(",")+"}"]];
}
function resultSheet(s,watch,c){
 const t=node("table",undefined,"lcd-sheet result"),h=t.createTHead(),b=t.createTBody();h.insertRow().append(node("th",""),node("th","D"),node("th","E"));
 statsRows(s).slice(s.choice,s.choice+6).forEach(([label,value],i)=>{
  const row=b.insertRow();if(watch&&((c===4||c===5||c>=7)&&["m","b"].includes(label)||c===6&&["r²","r"].includes(label)))row.className="cue";
  row.append(node("th",String(s.choice+i+1)),node("td",label),node("td",value));
 });
 return t;
}
function showMenu(s,watch){
 const ul=node("ul",undefined,"menu-list"), labels=["Lists & Spreadsheet menu","Statistics menu","Stat Calculations menu"];
 ul.setAttribute("aria-label",labels[s.menu]);
 const list=M.menu[s.menu], top=Math.max(0,s.choice-4),visible=list.slice(top,top+5);
 visible.forEach((v,i)=>{const li=node("li"),option=btn(v,top+i===s.choice,watch?null:()=>physical(v[0].toLowerCase()));li.append(option);ul.append(li);});
 if(top+visible.length<list.length)ul.append(node("li","▾","more-rows"));
 return ul;
}
function showWizard(s,watch){
 const modal=node("div",undefined,"wizard");modal.append(node("strong","Linear Regression (mx+b)"));
 const grid=node("fieldset"),buttons=node("div",undefined,"actions"),click=(i,key)=>()=>{state={...state,field:i,dropdown:null};physical(key);stage.focus({preventScroll:true});};
 M.fields.forEach((field,i)=>{
  let value=s.settings[i]||" ";if(i<3)value+=" ▾";
  const b=btn(value,s.field===i,watch||i>2?null:click(i,"right"));b.setAttribute("aria-label",field+": "+s.settings[i]);
  grid.append(node("span",field),b);
 });
 buttons.append(btn("OK",s.field===7,watch?null:click(7,"enter")),btn("Cancel",s.field===8,watch?null:click(8,"enter")));
 modal.append(grid,buttons);
 if(s.dropdown!==null){
  const opts=node("div",undefined,"dropdown");
  M.choices(s).forEach((v,i)=>opts.append(btn(v,i===s.dropdown,watch?null:()=>{state={...state,dropdown:i};physical("tab");stage.focus({preventScroll:true});})));
  modal.append(opts);
 }
 return modal;
}
function lcd(s,watch,c){
 const d=$("lcd-body");d.replaceChildren(s.page==="result"?resultSheet(s,watch,c):dataSheet(s,watch));
 if(s.page==="menu")d.append(showMenu(s,watch));else if(s.page==="wizard")d.append(showWizard(s,watch));
 else if(s.page==="sheet"&&s.edit!==null)d.append(node("div",s.edit,"lcd-note"));
 else if(s.page==="result")d.append(node("div","LinRegMx → "+s.run.store,"lcd-note result-store"));
 let description="Paired rows xval: "+M.readings(s).x.map(v=>v===null?"blank":M.display(v)).join(", ")+"; yval: "+M.readings(s).y.map(v=>v===null?"blank":M.display(v)).join(", ");
 if(s.page==="menu")description="Menu: "+M.menu[s.menu].join(". ");
 if(s.page==="wizard")description="Linear Regression (mx+b). "+M.fields.map((f,i)=>f+": "+(s.settings[i]||"blank")).join("; ")+(s.dropdown===null?"":". Choose "+M.choices(s)[s.dropdown]);
 if(s.page==="result")description=statsRows(s).map(([a,b])=>a+" "+b).join("; ")+"; Equation stored to "+s.run.store;
 if(s.cname)description+=". Column C: "+s.cname+(s.formula?" = "+s.formula:"");
 if(s.edit!==null)description+=". Editing "+s.edit;
 $("lcd-text").textContent=description;
 stage.dataset.scene=s.page;
}
function chart(where,d,r=null,mark=false){
 const v="http://www.w3.org/2000/svg",svg=document.createElementNS(v,"svg"),add=(tag,a)=>{const e=document.createElementNS(v,tag);Object.entries(a).forEach(([k,x])=>e.setAttribute(k,x));svg.append(e);return e;};
 if(d.x.length!==d.y.length||!d.x.length||[...d.x,...d.y].includes(null)){where.replaceChildren();return;}
 const lo=Math.min(...d.x),hi=Math.max(...d.x), yy=[Math.min(...d.y),Math.max(...d.y)];
 const line=r?Array.from({length:45},(_,i)=>{const x=lo+(hi-lo)*i/44;return [x,M.value(r,x)];}):[];
 if(r) yy[0]=Math.min(yy[0],...line.map(x=>x[1])),yy[1]=Math.max(yy[1],...line.map(x=>x[1]));
 const dx=hi-lo||1,dy=yy[1]-yy[0]||1, X=x=>36+(x-lo)*176/dx,Y=y=>104-(y-yy[0])*75/dy;
 svg.setAttribute("viewBox","0 0 245 134");svg.setAttribute("role","img");
 svg.setAttribute("aria-label",mark?"Study chart of the fitted exponential curve and the observed points.":r?"Study chart of paired data and fitted exponential curve.":"Study chart of the paired data, one dot per row.");
 add("path",{d:"M28 15V114H230",fill:"none",stroke:"currentColor","stroke-width":"1"});
 add("text",{x:230,y:129,fill:"currentColor","font-size":"12"}).textContent="x";
 add("text",{x:13,y:17,fill:"currentColor","font-size":"12"}).textContent="y";
 if(r)add("polyline",{points:line.map(([x,y])=>X(x)+","+Y(y)).join(" "),fill:"none",stroke:"currentColor","stroke-width":"2","stroke-dasharray":"4 3",opacity:".78"});
 d.x.forEach((x,i)=>add("circle",{cx:X(x),cy:Y(d.y[i]),r:"3.8",fill:"currentColor"}));
 if(r&&mark&&d.at>=lo&&d.at<=hi){
  const x=X(d.at),y=Y(M.value(r,d.at));add("path",{d:`M${x} ${y-5}l5 5-5 5-5-5Z`,fill:"var(--page)",stroke:"currentColor","stroke-width":"2"});
 }
 const cap=node("small",mark?"Dots: readings · diamond: estimate inside range":r?"Dots: readings · dashed curve: fit":"Study chart · one dot per pair");
 where.replaceChildren(svg,cap);
}
const tapeStates=T.keys.reduce((frames,[at,k])=>{const prev=frames.at(-1),s=M.press(prev?.s||M.init(M.demo),keyOf(k));frames.push({at,k,s,ctrl:prev?.s.ctrl||false});return frames;},[]);
function snapshot(t){const f=tapeStates.findLast(v=>v.at<=t+1e-9);return {s:f?.s||M.init(M.demo),keys:f&&t<f.at+.32?(f.ctrl?["ctrl",f.k]:[f.k]):[]};}
T.chapters.forEach(([s,title],i)=>{const li=node("li"),b=btn("",false,()=>seekTo(s));b.append(node("span",String(i+1).padStart(2,"0")),document.createTextNode(title));li.append(b);$("chapters").append(li);});
const canFork=()=>clock>0&&clock<T.duration-.015;
function paintWatch(){
 if(mode!=="watch")return;
 const {s,keys}=snapshot(clock),c=T.captions.findLastIndex(x=>x[0]<=clock),j=T.chapters.findLastIndex(x=>x[0]<=clock);
 seek.value=clock;seek.setAttribute("aria-valuetext",timed(clock)+" of "+timed(T.duration));$("clock").textContent=timed(clock)+" / "+timed(T.duration);
 shell.setKeys(keys);overlay.hidden=started||clock>0;$("take").textContent=canFork()?"Take over":"Open Try";
 const stamp=JSON.stringify([c,j,s]);if(stamped===stamp)return;stamped=stamp;
 lcd(s,true,c);$("caption").textContent=T.captions[c][1];$("takeaway").textContent=T.captions[c][2];
 [...$("chapters").children].forEach((li,i)=>li.firstElementChild.setAttribute("aria-current",String(i===j)));
 chart($("watch-picture"),M.demo,c>=6?s.run:null,c>=7);
}
function shown(id,v){$(id).hidden=!v;}
function status(id,text,bad=false){const e=$(id);e.textContent=text;e.dataset.error=String(bad);}
function paintTry(){
 lcd(state,false,-1);
 $("reset").textContent=state.fromWatch?"Assigned task":"Reset Try";
 const data=M.readings(state),r=state.run,correct=r&&r.provenance[0]===0&&r.provenance[1]===2&&state.page==="result";
 $("try-context").textContent=state.fromWatch?"Continue from the frozen Watch frame. Reset Try for different pairs.":"Transform yval, then regress lny on xval. Predict at x = "+M.display(data.at)+" and classify that input and x = "+M.display(data.also)+".";
 $("first-label").textContent="First input: x = "+M.display(data.at);
 $("second-label").textContent="Second input: x = "+M.display(data.also);
 status("tool-status",state.error||(request.error&&!hasOwnTry?request.error:"")||(r&&state.page==="result"?"Equation stored to "+r.store+".":""),Boolean(state.error||request.error&&!hasOwnTry));
 for(const [id,v] of [["x-input",data.x],["y-input",data.y],["at-input",data.at],["also-input",data.also]])if(document.activeElement!==$(id))$(id).value=Array.isArray(v)?v.map(x=>x??"").join(", "):v;
 shown("back-to-data",state.page!=="sheet"||!!r);$("back-to-data").textContent=state.page==="sheet"?"Show fit":"Show data";
 shown("answer",!state.fromWatch);shown("try-picture",Boolean(correct));
 if(correct)chart($("try-picture"),data,r);else $("try-picture").replaceChildren();
 shown("transfer",Boolean(correct&&!state.fromWatch));
 if(correct&&!state.fromWatch)$("transfer").textContent="The handheld gives m and b in ln(y) = mx + b. The model coefficients below are eᵇ and eᵐ.";

}
function update(next){state=next;if(!state.fromWatch)hasOwnTry=true;status("assess-feedback","");paintTry();}
function physical(k){
 if(mode!=="try")return;
 clearTimeout(light);shell.setKeys(state.ctrl?["ctrl",k]:[k]);light=setTimeout(()=>shell.setKeys([]),160);update(M.press(state,keyOf(k)));
}
$("data-form").addEventListener("submit",e=>{
 e.preventDefault();const x=M.parseList($("x-input").value),y=M.parseList($("y-input").value),at=M.number($("at-input").value),also=M.number($("also-input").value);
 const next=M.replace(state,x,y,at,also);
 if(next.error){status("tool-status",next.error,true);return;}
 $("answer").reset();update(next);$("edit-details").open=false;stage.focus({preventScroll:true});
});
$("answer").addEventListener("submit",e=>{
 e.preventDefault();const msg=M.grade(state,["a","b","y","first","second"].map(k=>$("answer-"+k).value));
 const b=state.run?.b,trend=b<1?"The multiplier is below one, so this fit models decay.":b>1?"The multiplier is above one, so this fit models growth.":"The multiplier equals one, so this fit stays constant.";
 status("assess-feedback",msg||"Correct. "+trend+" Extrapolation assumes the trend continues.",Boolean(msg));
});
$("answer").addEventListener("input",()=>status("assess-feedback",""));
function navigationInset(){return document.querySelector(".tabbar")?.offsetHeight||0;}
function size(){
 if(mode==="try"){
  const host=$("handheld-host"),height=window.visualViewport?.height||innerHeight;
  const top=host.getBoundingClientRect().top+window.scrollY;
  // Work from the original page position so scrolling or focusing a key
  // does not resize the keypad. Extremely short views remain scrollable.
  const available=Math.floor(Math.max(0,height-top-9)*558/1168);
  stage.style.setProperty("--try-fit",Math.max(150,Math.min(307,available))+"px");
  return;
 }
 const avail=(window.visualViewport?.height||innerHeight)-(Math.max(0,stage.getBoundingClientRect().top)+navigationInset());
 const fixed=$("watch-message").offsetHeight+$("watch-player").offsetHeight+20;
 stage.style.setProperty("--watch-fit",Math.max(96,Math.min(focusOn?350:297,Math.floor((avail-fixed)*558/1168)))+"px");
}
const obs=new ResizeObserver(size);for(const x of [$("watch-message"),$("watch-player"),$("try-header"),document.querySelector(".head")])obs.observe(x);
window.addEventListener("resize",size);window.visualViewport?.addEventListener("resize",size);
function focus(v){
 focusOn=v;stage.classList.toggle("focus-open",v);document.body.classList.toggle("ct34-focus",v);
 const f=$("focus");f.textContent=v?"Exit":"Focus";f.setAttribute("aria-pressed",String(v));f.setAttribute("aria-label",v?"Exit focused view":"Focused view");if(v)stage.scrollTop=0;size();
}
function labelPlay(){const t=playing?"Pause":clock>=T.duration-.015?"Replay":"Play";play.textContent=t;play.setAttribute("aria-label",t);}
function seekTo(t){clock=Math.min(T.duration,Math.max(0,Number(t)||0));origin=performance.now()-clock*1000;paintWatch();labelPlay();}
function pause(){playing=false;cancelAnimationFrame(frame);paintWatch();labelPlay();}
function tick(t){if(!playing||mode!=="watch")return;clock=Math.min(T.duration,Math.max(0,(t-origin)/1000));paintWatch();if(clock>=T.duration){pause();return;}frame=requestAnimationFrame(tick);}
function start(){
 if(mode!=="watch")return;
 if(!considered){considered=true;const h=window.visualViewport?.height||innerHeight;if($("watch-player").getBoundingClientRect().bottom>h-3||shell.body.getBoundingClientRect().width<185)focus(true);}
 if(document.activeElement===overlay)play.focus({preventScroll:true});
 started=true;if(clock>=T.duration-.015)seekTo(0);
 playing=true;origin=performance.now()-clock*1000;paintWatch();labelPlay();frame=requestAnimationFrame(tick);
}
function toggle(){if(playing)pause();else start();}
play.onclick=overlay.onclick=toggle;
$("back").onclick=()=>seekTo(clock-10);$("forward").onclick=()=>seekTo(clock+10);
$("replay").onclick=()=>{pause();seekTo(0);start();};seek.oninput=()=>seekTo(seek.value);
$("focus").onclick=()=>{considered=true;focus(!focusOn);};
function recordTry(){
 if(forkAt!==null){forks.set(forkAt,state);return;}
 assignedState=state;assignedAnswer=["a","b","y","first","second"].map(x=>$("answer-"+x).value);
 feedbackState=[$("assess-feedback").textContent,$("assess-feedback").dataset.error==="true"];
}
function restoreTry(){
 state=assignedState;forkAt=null;$("answer").reset();
 if(assignedAnswer)["a","b","y","first","second"].forEach((x,i)=>$("answer-"+x).value=assignedAnswer[i]);
 if(feedbackState)status("assess-feedback",...feedbackState);else status("assess-feedback","");
}
function reset(){
 if(state.fromWatch){recordTry();restoreTry();}
 else{state=M.init(request.data);assignedState=state;assignedAnswer=null;feedbackState=null;hasOwnTry=true;$("answer").reset();status("assess-feedback","");}
 $("edit-details").open=false;
}
function switchMode(to,take=false){
 if(to==="watch"&&mode==="try")recordTry();
 if(to==="try"&&mode==="watch"){
  pause();preferFocus=focusOn;if(focusOn)focus(false);
  if(take&&canFork()){
   forkAt=Math.round(clock*1000);
   if(!forks.has(forkAt)){
    if(forks.size===8)forks.delete(forks.keys().next().value);
    forks.set(forkAt,{...snapshot(clock).s,fromWatch:true});
   }
   state=forks.get(forkAt);
  }else restoreTry();
 }
 mode=to;stage.dataset.mode=mode;stamped="";const w=mode==="watch";
 document.body.classList.toggle("ct34-try",!w);
 ["watch-message","watch-player","watch-panel"].forEach(id=>shown(id,w));["try-header","try-panel"].forEach(id=>shown(id,!w));
 tabs.forEach((e,i)=>{const yes=w===(i===0);e.tabIndex=yes?0:-1;e.setAttribute("aria-selected",String(yes));});
 clearTimeout(light);shell.setKeys([]);shell.setInteractive(!w);
 if(w){paintWatch();size();if(preferFocus||shell.body.getBoundingClientRect().width<176||$("watch-player").getBoundingClientRect().bottom>(window.visualViewport?.height||innerHeight)-1)focus(true);firstWatch=false;}
 else{overlay.hidden=true;paintTry();size();}
}
tabs.forEach((b,i)=>{
 b.onclick=()=>{switchMode(i?"try":"watch");if(i){hasOwnTry=!state.fromWatch;stage.focus({preventScroll:true});}};
 b.onkeydown=e=>{if(["ArrowLeft","ArrowRight","Home","End"].includes(e.key)){e.preventDefault();const k=e.key==="Home"?0:e.key==="End"?1:1-i;switchMode(k?"try":"watch");if(k&&!state.fromWatch)hasOwnTry=true;tabs[k].focus();}};
});
$("take").onclick=()=>{switchMode("try",true);stage.focus({preventScroll:true});};
$("return").onclick=()=>{switchMode("watch");play.focus({preventScroll:true});};
$("reset").onclick=()=>{reset();paintTry();stage.focus({preventScroll:true});};
$("back-to-data").onclick=()=>{update({...state,page:state.page==="sheet"&&state.run?"result":"sheet",dropdown:null,error:"",edit:null});stage.focus({preventScroll:true});};
document.addEventListener("keydown",e=>{
 if(e.target!==document.body&&!e.target.closest?.(".qb-calculator-lesson"))return;
 if(e.key==="Escape"&&focusOn){e.preventDefault();considered=true;focus(false);$("focus").focus({preventScroll:true});return;}
 const el=e.target;if(e.altKey||e.metaKey||e.ctrlKey||el.closest("input,textarea,select,a,summary,[contenteditable]"))return;
 if(mode==="watch"){if(el.closest("button")||e.repeat)return;const k=e.key.toLowerCase();if(k==="k"||k===" "){e.preventDefault();toggle();}else if(k==="j"||k==="l"){e.preventDefault();seekTo(clock+(k==="j"?-10:10));}return;}
 if((!stage.contains(el)&&el!==document.body)||(el.closest("button")&&["Enter"," "].includes(e.key)))return;
 if(e.key==="Tab"&&!e.shiftKey&&el===stage&&state.page==="wizard"&&state.field<8){e.preventDefault();physical("tab");return;}
 const keys={m:"menu",M:"menu",Escape:"esc",Enter:"enter",Backspace:"del",Delete:"del",ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down","-":"neg",".":"dot","(":"lparen",")":"rparen"};
 const k=keys[e.key]||(/^[a-z0-9]$/i.test(e.key)?e.key.toLowerCase():"");if(k){
  e.preventDefault();
  // A direct Try URL initially has the body focused. The first calculator
  // shortcut opts into the stage so the upcoming wizard Tab selects a field.
  if(el===document.body)stage.focus({preventScroll:true});
  physical(k);
 }
});
switchMode(params.get("mode")==="try"?"try":"watch");
window.QBRecordedWatch?.bind(pause);
})();
