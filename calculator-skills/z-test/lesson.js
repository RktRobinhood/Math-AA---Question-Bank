(function(){"use strict";
const C=window.StatsLesson,$=id=>document.getElementById(id),stage=$("stage"),seek=$("seek"),overlay=$("start-overlay"),play=$("play");
function num(value){
 const s=String(value??"").trim().replace(/−/g,"-");
 if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(s))return null;
 const v=Number(s);return Number.isFinite(v)&&Math.abs(v)<=1e9?v:null;
}
const clone=x=>JSON.parse(JSON.stringify(x)), timed=t=>"0:"+String(Math.floor(t)).padStart(2,"0"), fmt=n=>String(Number(n.toPrecision(7))).replace(/-/g,"−");
const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const fields=C.fields.map(x=>x[0]),defaults=C.fields.map(x=>x[1]);
function parse(entry,val){
 if(entry[2])return entry[2].some(([x])=>x===val)?val:null;
 if(C.id==="CT43"&&entry[0]==="lower"&&/^[−-](?:inf(?:inity)?|∞)$/i.test(String(val).trim()))return "−∞";
 if(C.id==="CT43"&&entry[0]==="upper"&&/^\+?(?:inf(?:inity)?|∞)$/i.test(String(val).trim()))return "∞";
 if(entry[0]==="list"){
  const p=String(val).trim().split(/[,;]/).map(num);
  return p.length<=12&&p.every(x=>x!==null)?p:null;
 }
 return num(val);
}
const params=new URLSearchParams(location.search),tabs=[$("watch-tab"),$("try-tab")];
function readProblem(fromURL=false){
 const d={...C.assigned};let any=false;
 for(const input of C.input){
  const k=input[0];if(fromURL&&!params.has(k))continue;
  const val=fromURL?params.getAll(k):[$("input-"+k).value];any=true;
  const entered=val.length===1?parse(input,val[0]):null;
  if(entered===null)return {d:C.assigned,error:"One or more example inputs are invalid.",any};
  d[k]=entered;
 }
 return {d,error:C.validate(d),any};
}
const request=params.get("mode")==="try"?readProblem(true):{d:C.assigned,any:false,error:""};
const original=request.error?C.assigned:request.d;
const shell=HandheldShell.mount({host:$("handheld-host"),screen:$("lcd"),interactive:false,label:"TI-Nspire CX II-T "+C.app+" trainer",onKey:k=>physical(k)});
let mode="watch",clock=0,playing=false,frame=0,origin=0,stamped="",started=false,focusOn=false,preferFocus=false,considered=false,firstWatch=true,light=0,problem=original,warning=request.error?"Could not load that linked question. The original Try example is shown. "+request.error:"";
const initial=d=>({page:"idle",menu:0,item:0,branch:"default",field:0,replace:true,drop:null,values:[...defaults],result:null,cmd:"",data:d,fromWatch:false,error:"",row:0});
let practiceState=initial(problem),state=practiceState,forkKey=null;
const forkDrafts=new Map();
function keepFork(){forkDrafts.set(forkKey,state);if(forkDrafts.size>24)forkDrafts.delete(forkDrafts.keys().next().value);}
seek.max=C.duration;
$("title").textContent=C.name;$("intro").textContent=C.intro;$("lcd-app").textContent=C.app;
$("keys-help").textContent="Keyboard: M → "+C.path.join(" → ")+". Use Tab between fields, arrows to choose, and Enter to confirm.";
function inputs(spec,host,prefix,blank=false){
 for(const [k,text,opts] of spec){
  const lab=node("label",text),el=node(opts?"select":"input");lab.htmlFor=el.id=prefix+k;
  if(opts){if(blank){const start=node("option","Choose");start.value="";el.append(start);}opts.forEach(([v,n])=>{const o=node("option",n);o.value=v;el.append(o);});}
  else{el.autocomplete="off";el.spellcheck=false;el.inputMode=["list","lower","upper"].includes(k)?"text":"decimal";}
  host.append(lab,el);
 }
}
inputs(C.input,$("data-fields"),"input-");inputs(C.answers,$("answer-fields"),"answer-",true);
function fillInputs(){for(const [k] of C.input)$("input-"+k).value=Array.isArray(problem[k])?problem[k].join(", "):problem[k];}
fillInputs();
const menuList=s=>C.id==="CT43"&&s.menu===1&&s.branch==="stats"?["1: Stat Calculations","2: Stat Results","3: List Math","4: List Operations","5: Distributions"]:C.menu[s.menu];
function press(base,key){
 const s=clone(base);s.error="";
 if(key==="esc"){if(s.drop!==null)s.drop=null;else if(s.page==="menu"&&s.menu>0){s.menu--;s.item=0;}else if(s.page!=="idle")s.page="idle";return s;}
 if(key==="menu"){s.page="menu";s.menu=0;s.item=0;s.branch="default";s.drop=null;s.result=null;return s;}
 if(s.page==="menu"){
  const entries=menuList(s);
  if(key==="up"||key==="down"){s.item=(s.item+(key==="up"?-1:1)+entries.length)%entries.length;return s;}
  const chosen=(key==="right"||key==="enter")?entries[s.item][0]:key;
  if(s.menu===0&&C.id==="CT43"&&chosen==="6"){s.branch="stats";s.menu=1;s.item=0;return s;}
  if(chosen!==C.path[s.menu])return s;
  if(s.menu<2){s.menu++;s.item=0;return s;}
  s.page=C.setup?"setup":"wizard";s.field=0;s.replace=true;s.values=[...defaults];return s;
 }
 if(s.page==="setup"){
  if(key==="enter"){s.page="wizard";s.field=0;}return s;
 }
 if(s.page==="idle"&&s.data.list&&["up","down"].includes(key)){s.row=Math.max(0,Math.min(s.data.list.length-5,s.row+(key==="up"?-1:1)));return s;}
 if(s.page==="entry"&&key==="enter"){
  try{s.result=C.evaluate(s.values,num,s.data);s.page="result";}catch(e){s.error=e.message;}return s;
 }
 if(s.page!=="wizard")return s;
 if(s.drop!==null){
  const opts=C.choices[s.field];
  if(["up","left","down","right"].includes(key))s.drop=(s.drop+(key==="up"||key==="left"?-1:1)+opts.length)%opts.length;
  if(key==="tab"||key==="enter"){s.values[s.field]=opts[s.drop];s.drop=null;if(key==="tab")s.field=(s.field+1)%(fields.length+2);s.replace=true;}
  return s;
 }
 if(key==="tab"||key==="shift-tab"||key==="up"||key==="down"){
  s.field=(s.field+(key==="up"||key==="shift-tab"?fields.length+1:1))%(fields.length+2);s.replace=true;return s;
 }
 if((key==="right"||key==="left")&&C.choices[s.field]){s.drop=Math.max(0,C.choices[s.field].indexOf(s.values[s.field]));return s;}
 if(key==="enter"){
  if(s.field===fields.length+1){s.page="idle";return s;}
  try{
   C.evaluate(s.values,num,s.data);
   if(C.twoEnter){s.cmd=C.command(s.values);s.page="entry";}
   else{s.result=C.evaluate(s.values,num,s.data);s.page="result";}
  }catch(e){s.error=e.message;}
  return s;
 }
 if(s.field>=fields.length||C.choices[s.field]||s.data.list&&s.field>1)return s;
 const ch=/^[0-9]$/.test(key)?key:{"dot":".","neg":"−","minus":"−","ee":"e"}[key];
 if(key==="del"){s.values[s.field]=s.replace?"":s.values[s.field].slice(0,-1);s.replace=false;}
 if(ch!==undefined){s.values[s.field]=s.replace?ch:(s.values[s.field]+ch).slice(0,21);s.replace=false;}
 return s;
}
const btn=(text,active,click)=>{const b=node("button",text,active?"calc-active":"");b.type="button";if(click)b.addEventListener("click",click);else b.disabled=true;return b;};
function renderLCD(s,watch){
 const d=$("lcd-body");d.replaceChildren();let description="";
 if(s.page==="menu"){
  const rows=menuList(s);description=rows.join("; ");
  const ul=node("ul",undefined,"menu-list");
  rows.forEach((v,i)=>{const li=node("li");li.append(btn(v,s.item===i,watch?null:()=>physical(v[0])));ul.append(li);});d.append(ul);
 }else if(s.page==="setup"){
  const panel=node("div",undefined,"wizard");panel.append(node("strong",C.title),node("span",C.setup+": Data"),btn("OK",true,watch?null:()=>physical("enter")));d.append(panel);
  description=C.setup+": Data";
 }else if(s.page==="wizard"){
  const panel=node("div",undefined,"wizard"),grid=node("fieldset"),actions=node("div",undefined,"actions");
  panel.append(node("strong",C.title));fields.forEach((name,i)=>{
   const opt=C.choices[i],b=btn(s.values[i]+(opt?" ▾":""),s.field===i,watch?null:()=>{
    state={...state,field:i,drop:null,replace:true};if(opt)physical("right");else{paintTry();stage.focus({preventScroll:true});}
   });
   b.setAttribute("aria-label",name+": "+s.values[i]);grid.append(node("span",name),b);
  });
  actions.append(btn("OK",s.field===fields.length,watch?null:()=>{state={...state,field:fields.length};physical("enter");}),btn("Cancel",s.field===fields.length+1,watch?null:()=>physical("esc")));panel.append(grid,actions);
  if(s.drop!==null){
   const drop=node("div",undefined,"dropdown");C.choices[s.field].forEach((v,i)=>drop.append(btn(v,s.drop===i,watch?null:()=>{state={...state,drop:i};physical("tab");stage.focus({preventScroll:true});})));panel.append(drop);
  }
  d.append(panel);description=C.title+". "+fields.map((f,i)=>f+": "+s.values[i]).join("; ")+(s.drop===null?"":"; Choose "+C.choices[s.field][s.drop]);
 }else if(s.page==="entry"||s.page==="result"&&!s.data.list){
  const line=node("p",s.cmd,"lcd-command");d.append(line);
  description=s.cmd;if(s.result){d.append(node("p",C.display(s.result)[0][1],"lcd-number"));description+=" = "+C.display(s.result)[0][1];}
 }else if(s.page==="result"){
  const table=node("table",undefined,"lcd-sheet result"),b=table.createTBody();
  b.insertRow().append(node("th",""),node("th","B"),node("th","C"));
  C.display(s.result).forEach(([label,val],i)=>b.insertRow().append(node("th",String(i+1)),node("td",label),node("td",val)));d.append(table);
  description=C.display(s.result).map(([l,v])=>l+" "+v).join("; ");
 }else if(s.data.list){
  const table=node("table",undefined,"lcd-sheet data-sheet"),b=table.createTBody();
  b.insertRow().append(node("th",""),node("th","A"),node("th","B"));
  b.insertRow().append(node("th",""),node("td","readings"),node("td",""));
  s.data.list.slice(s.row,s.row+5).forEach((v,i)=>b.insertRow().append(node("th",String(i+s.row+1)),node("td",fmt(v)),node("td","")));
  d.append(table);description="Column A readings: "+s.data.list.map(fmt).join(", ");
 }else{d.append(node("p","▏","lcd-command"));description="Calculator ready.";}
 $("lcd-text").textContent=description;stage.dataset.scene=s.page;
}
function snapshot(t){let s=initial(C.demo),key="";for(const [at,k] of C.keys){if(at>t)break;s=press(s,k);key=t<at+.36?k:"";}return {s,key};}
const chapters=C.id==="CT43"?["Set up the mean","Find the standard error","Check the normality basis","Open Normal Cdf","Enter bounds","Enter μ and standard error","Run the command","Interpret the result"]:["Set up H₀ and Hₐ","Known population σ","Open z Test","Choose Data","Enter μ₀, σ and List","Choose the tail","Compare p and α","Interpret the result"];
C.captions.forEach(([at],i)=>{const li=node("li"),b=btn("",false,()=>seekTo(at));b.append(node("span",String(i+1).padStart(2,"0")),document.createTextNode(chapters[i]));li.append(b);$("chapters").append(li);});
const canFork=()=>clock>0&&clock<C.duration-.015;
function paintWatch(){
 if(mode!=="watch")return;
 const {s,key}=snapshot(clock),c=C.captions.findLastIndex(x=>x[0]<=clock);
 seek.value=clock;seek.setAttribute("aria-valuetext",timed(clock)+" of "+timed(C.duration));$("clock").textContent=timed(clock)+" / "+timed(C.duration);
 shell.setKeys(key?[key]:[]);overlay.hidden=started||clock>0;$("take").textContent=canFork()?"Take over":"Open Try";
 const stamp=JSON.stringify([c,s]);if(stamped===stamp)return;stamped=stamp;
 renderLCD(s,true);$("caption").textContent=C.captions[c][1];$("takeaway").textContent=C.captions[c][2];
 [...$("chapters").children].forEach((li,i)=>li.firstElementChild.setAttribute("aria-current",String(i===c)));
}
function shown(id,v){$(id).hidden=!v;}
function status(id,text,bad=false){const e=$(id);e.textContent=text;e.dataset.error=String(bad);}
function paintTry(){
 renderLCD(state,false);
 $("try-context").textContent=state.fromWatch?"Continue from the frozen Watch frame. Return to Try for independent practice.":C.task(problem);
 status("tool-status",state.error||(forkKey===null?warning:""),Boolean(state.error||forkKey===null&&warning));
 shown("answer",!state.fromWatch);shown("given-list",!!state.data.list);
 if(state.data.list)$("given-list").textContent="Column A: "+state.data.list.map(fmt).join(", ");
 shown("edit-details",forkKey===null);$("reset").textContent=forkKey===null?"Reset Try":"Return to Try";
}
function update(next){state=next;if(forkKey===null){practiceState=state;warning="";}else keepFork();status("assess-feedback","");paintTry();}
function physical(k){
 if(mode!=="try")return;
 if(document.activeElement!==stage)stage.focus({preventScroll:true});
 clearTimeout(light);shell.setKeys([k]);light=setTimeout(()=>shell.setKeys([]),160);update(press(state,k));
}
$("data-form").addEventListener("submit",e=>{
 e.preventDefault();if(forkKey!==null)return;const draft=readProblem();
 if(draft.error){status("tool-status",draft.error,true);return;}
 problem=draft.d;$("answer").reset();update(initial(problem));$("edit-details").open=false;stage.focus({preventScroll:true});
});
function match(given,expected){
 const x=num(given);if(x===null||!Number.isFinite(expected))return false;
 return x===expected||Array.from({length:10},(_,i)=>i+3).some(n=>x===Number(expected.toPrecision(n)))||Math.abs(x-expected)<=Math.abs(expected)*3e-8;
}
$("answer").addEventListener("submit",e=>{
 e.preventDefault();if(forkKey!==null)return;const a=Object.fromEntries(C.answers.map(([k])=>[k,$("answer-"+k).value]));
 const msg=!state.result||state.page!=="result"?"Run the handheld calculation before checking.":C.grade(problem,state.result,a,match);
 status("assess-feedback",msg||C.success,Boolean(msg));
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
 focusOn=v;stage.classList.toggle("focus-open",v);document.body.classList.toggle("stats-focus",v);
 const f=$("focus");f.textContent=v?"Exit":"Focus";f.setAttribute("aria-pressed",String(v));f.setAttribute("aria-label",v?"Exit focused view":"Focused view");if(v)stage.scrollTop=0;size();
}
function labelPlay(){const t=playing?"Pause":clock>=C.duration-.015?"Replay":"Play";play.textContent=t;play.setAttribute("aria-label",t);}
function seekTo(t){clock=Math.min(C.duration,Math.max(0,Number(t)||0));origin=performance.now()-clock*1000;paintWatch();labelPlay();}
function pause(){playing=false;cancelAnimationFrame(frame);paintWatch();labelPlay();}
function tick(t){if(!playing||mode!=="watch")return;clock=Math.min(C.duration,Math.max(0,(t-origin)/1000));paintWatch();if(clock>=C.duration){pause();return;}frame=requestAnimationFrame(tick);}
function start(){
 if(mode!=="watch")return;
 if(!considered){considered=true;const h=window.visualViewport?.height||innerHeight;if($("watch-player").getBoundingClientRect().bottom>h-3||shell.body.getBoundingClientRect().width<185)focus(true);}
 if(document.activeElement===overlay)play.focus({preventScroll:true});
 started=true;if(clock>=C.duration-.015)seekTo(0);
 playing=true;origin=performance.now()-clock*1000;paintWatch();labelPlay();frame=requestAnimationFrame(tick);
}
function toggle(){if(playing)pause();else start();}
play.onclick=overlay.onclick=toggle;
$("back").onclick=()=>seekTo(clock-10);$("forward").onclick=()=>seekTo(clock+10);
$("replay").onclick=()=>{pause();seekTo(0);start();};seek.oninput=()=>seekTo(seek.value);
$("focus").onclick=()=>{considered=true;focus(!focusOn);};
function reset(){
 if(forkKey!==null){forkKey=null;state=practiceState;status("assess-feedback","");return;}
 problem=original;practiceState=initial(problem);state=practiceState;warning="";fillInputs();$("answer").reset();$("edit-details").open=false;status("assess-feedback","");
}
function switchMode(to,take=false){
 if(to==="try"&&mode==="watch"){
  pause();preferFocus=focusOn;if(focusOn)focus(false);
  forkKey=take&&canFork()?String(Math.round(clock*1000)):null;
  state=forkKey===null?practiceState:(forkDrafts.get(forkKey)||{...snapshot(clock).s,fromWatch:true});
 }else if(to==="try"&&!take&&forkKey!==null){forkKey=null;state=practiceState;}
 mode=to;stage.dataset.mode=mode;stamped="";const w=mode==="watch";
 document.body.classList.toggle("stats-try",!w);
 ["watch-message","watch-player","watch-panel"].forEach(id=>shown(id,w));["try-header","try-panel"].forEach(id=>shown(id,!w));
 tabs.forEach((e,i)=>{const yes=w===(i===0);e.tabIndex=yes?0:-1;e.setAttribute("aria-selected",String(yes));});
 clearTimeout(light);shell.setKeys([]);shell.setInteractive(!w);
 if(w){paintWatch();size();if(preferFocus||firstWatch&&shell.body.getBoundingClientRect().width<156)focus(true);firstWatch=false;}
 else{overlay.hidden=true;paintTry();size();}
}
tabs.forEach((b,i)=>{
 b.onclick=()=>{switchMode(i?"try":"watch");if(i)stage.focus({preventScroll:true});};
 b.onkeydown=e=>{if(["ArrowLeft","ArrowRight","Home","End"].includes(e.key)){e.preventDefault();const k=e.key==="Home"?0:e.key==="End"?1:1-i;switchMode(k?"try":"watch");tabs[k].focus();}};
});
$("take").onclick=()=>{switchMode("try",true);stage.focus({preventScroll:true});};
$("return").onclick=()=>{switchMode("watch");play.focus({preventScroll:true});};
$("reset").onclick=()=>{reset();paintTry();stage.focus({preventScroll:true});};
document.addEventListener("keydown",e=>{
 if(e.target!==document.body&&!e.target.closest?.(".qb-calculator-lesson"))return;
 if(e.key==="Escape"&&focusOn){e.preventDefault();considered=true;focus(false);$("focus").focus({preventScroll:true});return;}
 const el=e.target;if(e.altKey||e.metaKey||e.ctrlKey||el.closest("input,textarea,select,a,summary,[contenteditable]"))return;
 if(mode==="watch"){if(el.closest("button")||e.repeat)return;const k=e.key.toLowerCase();if(k==="k"||k===" "){e.preventDefault();toggle();}else if(k==="j"||k==="l"){e.preventDefault();seekTo(clock+(k==="j"?-10:10));}return;}
 if((!stage.contains(el)&&el!==document.body)||(el.closest("button")&&["Enter"," "].includes(e.key)))return;
 if(e.key==="Tab"&&!e.shiftKey&&el===stage&&state.page==="wizard"){e.preventDefault();physical("tab");return;}
 const keys={m:"menu",M:"menu",Escape:"esc",Enter:"enter",Backspace:"del",Delete:"del",ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down","-":"neg",".":"dot"};
 const k=keys[e.key]||(/^[0-9]$/.test(e.key)?e.key:"");if(k){
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
