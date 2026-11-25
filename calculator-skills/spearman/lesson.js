(function(){"use strict";
const M=window.CT35,T=window.CT35Tape,$=id=>document.getElementById(id),stage=$("stage"),seek=$("seek"),overlay=$("start-overlay"),play=$("play");
const params=new URLSearchParams(location.search),request=M.request(params),tabs=[$("watch-tab"),$("try-tab")];
const shell=HandheldShell.mount({host:$("handheld-host"),screen:$("lcd"),interactive:false,label:"TI-Nspire CX II-T Spearman rank correlation handheld",onKey:k=>{physical(k);stage.focus({preventScroll:true});}});
const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const btn=(text,active,click)=>{const b=node("button",text,active?"active":"");b.type="button";if(click)b.addEventListener("click",click);else b.disabled=true;return b;};
const format=v=>v===null?"":M.display(v), timed=t=>"0:"+String(Math.floor(t)).padStart(2,"0");
let mode="watch",clock=0,playing=false,frame=0,origin=0,stamped="",started=false,focusOn=false,preferFocus=false,considered=false,firstWatch=true,hasOwnTry=false,light=0,state=M.init(request.data),assignedState=state,assignedAnswer=null,feedbackState=null,forkAt=null;
const forks=new Map();
seek.max=T.duration;
function keyOf(k){return ({esc:"escape",del:"backspace",neg:"negative",dot:".",lparen:"(",rparen:")"})[k]||k;}
function rawTable(where,d){
 const table=node('table',undefined,'source-readings');table.setAttribute('aria-label','Paired measurements, original order');
 const head=table.createTHead().insertRow();head.append(node('th','Row'),...d.x.map((_,i)=>node('th',String(i+1))));
 for(const [lead,readings] of [['x',d.x],['y',d.y]]){const tr=table.insertRow();tr.append(node('th',lead),...readings.map(x=>node('td',format(x))));}
 where.replaceChildren(table);
}
function dataSheet(s,watch){
 const t=node('table',undefined,'lcd-sheet data-sheet'),head=t.createTHead(),body=t.createTBody();
 [['','A','B'],['','rx','ry']].forEach(tr=>{const row=head.insertRow();tr.forEach(v=>row.append(node('th',v)));});
 const fr=body.insertRow();fr.className='form';fr.append(node('th',''),node('td','='),node('td','='));
 const first=Math.max(0,s.row-4),last=Math.min(first+5,s.x.length);
 for(let i=first;i<last;i++){
  const row=body.insertRow();row.append(node('th',String(i+1)));
  [s.x,s.y].forEach((a,j)=>{
   const active=i===s.row&&j===s.col&&s.page==='sheet',td=node('td',(active&&s.edit!==null?s.edit:format(a[i]))||' ',active?'active':'');
   if(!watch&&s.page==='sheet'){td.dataset.cell=i+':'+j;td.setAttribute('aria-label',(j?'ry':'rx')+', row '+(i+1));td.onclick=()=>{const q=state.edit===null?state:M.press(state,'enter');update(q.error?q:{...q,row:i,col:j});stage.focus({preventScroll:true});};}
   row.append(td);
  });
 }
 return t;
}
function statsRows(s){
 const r=s.run;
 return [['Title','Linear Regression'],['RegEqn','a+bx'],['a',format(r.a)],['b',format(r.b)],['r²',format(r.r2)],['r',format(r.r)],['Resid','{'+r.residuals.map(format).join(',')+'}']];
}
function resultSheet(s,watch,c){
 const t=node("table",undefined,"lcd-sheet result"),h=t.createTHead(),b=t.createTBody();h.insertRow().append(node("th",""),node("th","C"),node("th","D"));
 statsRows(s).slice(s.choice,s.choice+6).forEach(([label,value],i)=>{
  const row=b.insertRow();if((watch&&c>=6||!watch)&&label==='r')row.className='cue';
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
 const modal=node("div",undefined,"wizard");modal.append(node("strong","Linear Regression (a+bx)"));
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
 else if(s.page==="result")d.append(node("div","LinRegBx → "+s.run.store,"lcd-note result-store"));
 let description="Entered rank lists rx: "+M.readings(s).x.map(v=>v===null?"blank":M.display(v)).join(", ")+"; ry: "+M.readings(s).y.map(v=>v===null?"blank":M.display(v)).join(", ");
 if(s.page==="menu")description="Menu: "+M.menu[s.menu].join(". ");
 if(s.page==="wizard")description="Linear Regression (a+bx). "+M.fields.map((f,i)=>f+": "+(s.settings[i]||"blank")).join("; ")+(s.dropdown===null?"":". Choose "+M.choices(s)[s.dropdown]);
 if(s.page==="result")description=statsRows(s).map(([a,b])=>a+" "+b).join("; ")+"; Equation stored to "+s.run.store;
 if(s.error){description+=". "+s.error;d.append(node("div",s.error,"lcd-alert"));}
 if(s.edit!==null)description+=". Editing "+s.edit;
 $("lcd-text").textContent=description;
 stage.dataset.scene=s.page;
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
 
}
function shown(id,v){$(id).hidden=!v;}
function status(id,text,bad=false){const e=$(id);e.textContent=text;e.dataset.error=String(bad);}
function paintTry(){
 lcd(state,false,-1);rawTable($('try-picture'),state.raw);
 $('try-context').textContent=state.fromWatch?'Watch copy. Continue this frame without changing the replay.':'Rank the two lists separately. Enter the ranks on the original paired rows.';
 $('reset').textContent=state.fromWatch?'Assigned task':'Reset Try';
 status('tool-status',state.error||(request.error&&!hasOwnTry?request.error:'')||(state.run&&!state.run.matchX?'Check the rx ranks against the original x rows.':state.run&&!state.run.matchY?'Check the ry ranks against the original y rows.':''),Boolean(state.error||request.error&&!hasOwnTry||state.run&&(!state.run.matchX||!state.run.matchY)));
 for(const [id,v] of [['x-input',state.raw.x],['y-input',state.raw.y]])if(document.activeElement!==$(id))$(id).value=v.join(', ');
 shown('back-to-data',state.page!=='sheet'||!!state.run);
 $('back-to-data').textContent=state.page==='sheet'?'Show result':'Rank sheet';
 shown('answer',!state.fromWatch);
}
function update(next){state=next;if(!state.fromWatch)hasOwnTry=true;status('assess-feedback','');paintTry();}
function physical(k){
 if(mode!=='try')return;
 clearTimeout(light);shell.setKeys([k]);light=setTimeout(()=>shell.setKeys([]),160);update(M.press(state,keyOf(k)));
}
$('data-form').onsubmit=e=>{
 e.preventDefault();const next=M.replace(state,M.parseList($('x-input').value),M.parseList($('y-input').value));
 if(next.error){status('tool-status',next.error,true);return;}
 $('answer').reset();update(next);$('edit-details').open=false;stage.focus({preventScroll:true});
};
$('answer').onsubmit=e=>{e.preventDefault();const msg=M.grade(state,$('answer-r').value);status('assess-feedback',msg||(state.undefinedConfirmed?'Correct. One list is constant, so rank correlation is undefined.':'Correct. Pearson r on these two rank lists is Spearman’s rₛ.'),Boolean(msg));};
$('answer-r').oninput=()=>status('assess-feedback','');
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
 const avail=(window.visualViewport?.height||innerHeight)-(focusOn?0:Math.max(0,stage.getBoundingClientRect().top));
 const fixed=$("watch-message").offsetHeight+$("watch-player").offsetHeight+20;
 stage.style.setProperty("--watch-fit",Math.max(96,Math.min(focusOn?350:297,Math.floor((avail-fixed)*558/1168)))+"px");
}
const obs=new ResizeObserver(size);for(const x of [$("watch-message"),$("watch-player"),$("try-header"),document.querySelector(".head")])obs.observe(x);
window.addEventListener("resize",size);window.visualViewport?.addEventListener("resize",size);
function focus(v){
 focusOn=v;stage.classList.toggle("focus-open",v);document.body.classList.toggle("ct35-focus",v);
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
 assignedState=state;assignedAnswer=$("answer-r").value;
 feedbackState=[$("assess-feedback").textContent,$("assess-feedback").dataset.error==="true"];
}
function restoreTry(){
 state=assignedState;forkAt=null;$("answer").reset();
 if(assignedAnswer!==null)$("answer-r").value=assignedAnswer;
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
 document.body.classList.toggle("ct35-try",!w);
 ["watch-message","watch-player","watch-panel"].forEach(id=>shown(id,w));["try-header","try-panel"].forEach(id=>shown(id,!w));
 tabs.forEach((e,i)=>{const yes=w===(i===0);e.tabIndex=yes?0:-1;e.setAttribute("aria-selected",String(yes));});
 clearTimeout(light);shell.setKeys([]);shell.body.querySelectorAll(".hh-tap").forEach(k=>k.classList.remove("hh-tap"));shell.setInteractive(!w);
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
 if(e.key==="Escape"&&focusOn){e.preventDefault();considered=true;focus(false);$("focus").focus({preventScroll:true});return;}
 const el=e.target;if(e.altKey||e.metaKey||e.ctrlKey||el.closest("input,textarea,select,a,summary,[contenteditable]"))return;
 if(mode==="watch"){if(el.closest("button")||e.repeat)return;const k=e.key.toLowerCase();if(k==="k"||k===" "){e.preventDefault();toggle();}else if(k==="j"||k==="l"){e.preventDefault();seekTo(clock+(k==="j"?-10:10));}return;}
 if((!stage.contains(el)&&el!==document.body)||(el.closest("button")&&["Enter"," "].includes(e.key)))return;
 if(e.key==="Tab"&&el===stage&&state.page==="wizard"&&(e.shiftKey?state.field>0:state.field<8)){e.preventDefault();physical(e.shiftKey?"backtab":"tab");return;}
 const keys={m:"menu",M:"menu",Escape:"esc",Enter:"enter",Backspace:"del",Delete:"del",ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down","-":"neg",".":"dot","(":"lparen",")":"rparen"};
 const k=keys[e.key]||(/^[a-z0-9]$/i.test(e.key)?e.key.toLowerCase():"");if(k){
  e.preventDefault();
  // A direct Try URL initially has the body focused. The first calculator
  // shortcut opts into the stage so the upcoming wizard Tab selects a field.
  if(el===document.body)stage.focus({preventScroll:true});
  physical(k);
 }
});
const theme=$("theme");try{const v=localStorage.getItem("ti-lab-theme");if(["light","dark"].includes(v))theme.value=v;}catch{}
function setTheme(){document.documentElement.dataset.theme=theme.value;}
setTheme();theme.onchange=()=>{setTheme();try{localStorage.setItem("ti-lab-theme",theme.value==="system"?"auto":theme.value);}catch{}};
rawTable($("watch-picture"),M.demo);switchMode(params.get("mode")==="try"||request.linked?"try":"watch");
})();
