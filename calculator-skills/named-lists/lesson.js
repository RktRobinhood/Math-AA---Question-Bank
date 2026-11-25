"use strict";
(function(){
const $=id=>document.getElementById(id),M=CT28,T=CT28Tape;
const stage=$("stage"),play=$("play"),seek=$("seek"),overlay=$("start-overlay"),field=$("cell-text");
const params=new URLSearchParams(location.search),tabs=[$("watch-tab"),$("try-tab")];
let problem=M.original,linked=false,invalid=false;
try{const p=M.link(params);if(p){problem=p;linked=true;}}catch{invalid=true;}
let mode="watch",state=M.init(),worked=false,forked=false,focusOn=false,considered=false,firstWatch=true,clock=0,origin=0,frame=0,playing=false,started=false,stamp="";
const shell=HandheldShell.mount({host:$("handheld-host"),screen:$("lcd"),label:"TI-Nspire CX II-T Lists & Spreadsheet",interactive:false,onKey:press});
const fmt=x=>Math.floor(x/60)+":"+String(Math.floor(x)%60).padStart(2,"0");
const node=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=value;return e;};
function source(el,p,caption){
 el.replaceChildren();
 if(caption)el.append(node("caption","",caption));
 const h=node("thead"),tr=node("tr"),tb=node("tbody");
 for(const x of ["Measured value",...(p.f?["Frequency"]:[])]){const e=node("th","",x);e.scope="col";tr.append(e);}
 h.append(tr);
 p.v.forEach((x,i)=>{const row=node("tr");row.append(node("td","",x));if(p.f)row.append(node("td","",p.f[i]));tb.append(row);});
 el.append(h,tb);
}
source($("watch-table"),M.example);
source($("source-table"),problem,problem.f?"Source frequency table":"Source readings");
function cell(s,c,r,interactive){
 const col=s.cols[c],active=s.c===c&&s.row===r,edited=active&&s.buf!==null;
 const value=edited?s.buf:r===-2?col.name:r===-1?"":col.v[r];
 const h=node(interactive?"button":"span",r===-2?"entrycell":"cell-face");
 h.classList.toggle("calc-active",active);if(r===-2)h.append(node("b","","AB"[c]));
 h.append(node("span",value===null?"blank":"",value??"_"));
 if(interactive){
  h.type="button";h.dataset.cell=M.label(c,r).replace(" ","-");h.setAttribute("aria-label",M.label(c,r)+": "+(value===""||value===null?"blank":value));h.setAttribute("aria-pressed",String(active));
  h.addEventListener("click",()=>{worked=true;state=M.select(state,c,r);recorded();paintTry();stage.focus({preventScroll:true});});
 }
 return h;
}
function lcd(s,interactive=false){
 const d=$("lcd-body"),title=$("lcd-title"),rich=$("lcd-text");d.replaceChildren();
 if(s.page==="home"||s.page==="new"){
  const home=s.page==="home", options=home?["1 New Document","2 Browse","3 Recent","4 Current","5 Settings"]:["1: Add Calculator","2: Add Graphs","3: Add Geometry","4: Add Lists & Spreadsheet","5: Add Data & Statistics","6: Add Notes"];
  title.textContent=home?"Home":"New Document";
  const list=node("ul","home-keys");options.forEach((x,i)=>{const row=node("li",i===(home?0:3)?"calc-active":"",x);list.append(row);});d.append(list);
  rich.textContent=home?"Home. Choose 1: New Document.":"New Document. Choose 4: Add Lists & Spreadsheet.";return;
 }
 title.textContent="1.1  Lists & Spreadsheet";
 const table=node("table","spread"),head=node("thead"),hr=node("tr"),body=node("tbody");
 hr.append(node("th","rowno",""));for(let c=0;c<2;c++){const e=node("th","headcell");e.append(cell(s,c,-2,interactive));hr.append(e);}
 head.append(hr);table.append(head);
 const row=(r)=>{
  const e=node("tr");if(r===-1)e.setAttribute("name","formula");
  e.append(node("th","rowno",r===-1?"=":r+1));
  for(let c=0;c<2;c++){const el=node("td","");el.append(cell(s,c,r,interactive));e.append(el);}return e;
 };
 body.append(row(-1));const start=Math.max(0,s.row-3);
 for(let r=start;r<Math.min(M.N,start+4);r++)body.append(row(r));
 table.append(body);d.append(table);
 const current=s.buf??(s.row===-2?s.cols[s.c].name:s.row===-1?(s.cols[s.c].name?s.cols[s.c].name+":=":"="):s.cols[s.c].v[s.row])??"";
 d.append(node("div","lcd-row-entry",M.label(s.c,s.row)+": "+current));
 const coltext=s.cols.map((x,i)=>"Column "+"AB"[i]+": "+(x.name||"unnamed")+"; "+x.v.slice(0,Math.max(3,x.v.findLastIndex(y=>y!==null)+1)).map(y=>y??"blank").join(", ")).join(". ");
 rich.textContent="Selected "+M.label(s.c,s.row)+". "+coltext+(s.buf!==null?". Entering "+s.buf:"")+(s.err?". "+s.err:".");
}
function snapshot(t){
 let s=M.init("home"),highlight="";
 for(const [at,key] of T.keys){if(at>t)break;s=M.step(s,key);highlight=t<at+.35?key:"";}
 return {s,highlight};
}
T.chapters.forEach(([at,title],i)=>{
 const li=node("li",""),b=node("button",""),serial=node("span","","0"+(i+1));
 b.append(serial,document.createTextNode(title));b.type="button";b.addEventListener("click",()=>go(at));li.append(b);$("chapters").append(li);
});
const canFork=()=>clock>0&&clock<T.duration-.015;
function paintWatch(){
 if(mode!=="watch")return;
 const {s,highlight}=snapshot(clock),c=T.captions.findLastIndex(x=>x[0]<=clock),j=T.chapters.findLastIndex(x=>x[0]<=clock);
 seek.value=clock;seek.setAttribute("aria-valuetext",fmt(clock)+" of "+fmt(T.duration));$("clock").textContent=fmt(clock)+" / "+fmt(T.duration);
 shell.setKeys(highlight?[highlight]:[]);overlay.hidden=started||clock>0;$("take").textContent=canFork()?"Take over":"Open Try";
 const next=JSON.stringify([c,j,s]);if(next===stamp)return;stamp=next;
 lcd(s);$("caption").textContent=T.captions[c][1];$("takeaway").textContent=T.captions[c][2];
 [...$("chapters").children].forEach((e,i)=>e.firstElementChild.setAttribute("aria-current",String(i===j)));
}
function recorded(){$("assess-feedback").textContent="";}
function paintTry(){
 if(mode!=="try")return; lcd(state,true);
 $("try-context").textContent=state.fromWatch?"Continue the Watch example. Reset for your assigned lists.":M.context(problem);
 $("assess").disabled=state.fromWatch;
 $("typed").hidden=state.page!=="sheet";$("selection").textContent="("+M.label(state.c,state.row)+")";
 if(document.activeElement!==field){field.value=state.buf??"";}
 const error=state.err||(invalid&&!worked?"That Try link could not load. The original table is shown.":"");
 $("tool-status").textContent=error;$("tool-status").dataset.error=String(Boolean(error));
}
function press(key){
 if(mode!=="try")return;
 worked=true;recorded();state=M.step(state,key);paintTry();
}
function feedback(m){$("assess-feedback").dataset.error=String(!m.ok);$("assess-feedback").textContent=m.message;}
$("assess").addEventListener("click",()=>{if(!state.fromWatch){worked=true;feedback(M.check(state,problem));}});
$("typed").addEventListener("submit",e=>{
 e.preventDefault();worked=true;recorded();state=M.typed(state,field.value);
 if(!state.err){field.value="";}else{field.select();}
 paintTry();
});
function navigationInset(){return document.querySelector(".tabbar")?.offsetHeight||0;}
function size(){
 if(mode!=="watch")return;
 const avail=(window.visualViewport?.height||innerHeight)-(Math.max(0,stage.getBoundingClientRect().top)+navigationInset());
 const fixed=$("watch-message").offsetHeight+$("watch-player").offsetHeight+20;
 stage.style.setProperty("--watch-fit",Math.max(96,Math.min(focusOn?350:297,Math.floor((avail-fixed)*558/1168)))+"px");
}
const observer=new ResizeObserver(size);
for(const x of [$("watch-message"),$("watch-player"),document.querySelector(".head")])observer.observe(x);
window.addEventListener("resize",size);window.visualViewport?.addEventListener("resize",size);
function focus(v){
 focusOn=v;stage.classList.toggle("focus-open",v);document.body.classList.toggle("ct28-focus",v);
 const f=$("focus");f.textContent=v?"Exit":"Focus";f.setAttribute("aria-pressed",String(v));f.setAttribute("aria-label",v?"Exit focused view":"Focused view");if(v)stage.scrollTop=0;size();
}
function label(){const t=playing?"Pause":clock>=T.duration-.015?"Replay":"Play";play.textContent=t;play.setAttribute("aria-label",t);}
function go(t){clock=Math.min(T.duration,Math.max(0,Number(t)||0));origin=performance.now()-clock*1000;paintWatch();label();}
function pause(){playing=false;cancelAnimationFrame(frame);paintWatch();label();}
function tick(t){if(!playing||mode!=="watch")return;clock=Math.min(T.duration,Math.max(0,(t-origin)/1000));paintWatch();if(clock>=T.duration){pause();return;}frame=requestAnimationFrame(tick);}
function start(){
 if(mode!=="watch")return;
 if(!considered){considered=true;const h=window.visualViewport?.height||innerHeight;if($("watch-player").getBoundingClientRect().bottom>h-3||shell.body.getBoundingClientRect().width<185)focus(true);}
 if(document.activeElement===overlay)play.focus({preventScroll:true});
 started=true;if(clock>=T.duration-.015)go(0);
 playing=true;origin=performance.now()-clock*1000;paintWatch();label();frame=requestAnimationFrame(tick);
}
function toggle(){if(playing)pause();else start();}
play.addEventListener("click",toggle);overlay.addEventListener("click",toggle);
$("back").addEventListener("click",()=>go(clock-10));$("forward").addEventListener("click",()=>go(clock+10));
$("replay").addEventListener("click",()=>{pause();go(0);start();});
seek.addEventListener("input",()=>go(seek.value));$("focus").addEventListener("click",()=>{considered=true;focus(!focusOn);});
function reset(){
 worked=true;state=M.init();field.value="";recorded();
}
function switchTo(next,take=false){
 if(next==="try"&&mode==="watch"){
  pause();if(focusOn)focus(false);
  if(take&&!canFork()&&state.fromWatch)reset();
  else if(take&&canFork()&&!linked&&!invalid&&!worked&&!forked){state={...snapshot(clock).s,fromWatch:true};forked=true;}
 }
 mode=next;stage.dataset.mode=mode;stamp="";const watch=mode==="watch";
 ["watch-message","watch-player","watch-panel"].forEach(id=>$(id).hidden=!watch);
 ["try-header","try-panel"].forEach(id=>$(id).hidden=watch);
 tabs.forEach((b,i)=>{const yes=watch===(i===0);b.tabIndex=yes?0:-1;b.setAttribute("aria-selected",String(yes));});
 shell.setKeys([]);shell.setInteractive(!watch);
 if(watch){paintWatch();size();if(firstWatch){firstWatch=false;if(shell.body.getBoundingClientRect().width<156)focus(true);}}
 else{overlay.hidden=true;paintTry();}
}
tabs.forEach((b,i)=>{
 b.addEventListener("click",()=>{switchTo(i?"try":"watch");if(i)stage.focus({preventScroll:true});});
 b.addEventListener("keydown",e=>{if(["ArrowLeft","ArrowRight","Home","End"].includes(e.key)){e.preventDefault();const k=e.key==="Home"?0:e.key==="End"?1:1-i;switchTo(k?"try":"watch");tabs[k].focus();}});
});
$("take").addEventListener("click",()=>{switchTo("try",true);stage.focus({preventScroll:true});});
$("return").addEventListener("click",()=>{switchTo("watch");play.focus({preventScroll:true});});
$("reset").addEventListener("click",()=>{reset();paintTry();stage.focus({preventScroll:true});});
document.addEventListener("keydown",e=>{
 if(e.target!==document.body&&!e.target.closest?.(".qb-calculator-lesson"))return;
 if(e.key==="Escape"&&focusOn){e.preventDefault();considered=true;focus(false);$("focus").focus();return;}
 const el=e.target;if(e.altKey||e.metaKey||e.ctrlKey||el.closest("input,textarea,select,a,summary,[contenteditable]"))return;
 if(mode==="watch"&&!el.closest("button")&&!e.repeat){
  const k=e.key.toLowerCase();if(k==="k"||k===" "){e.preventDefault();toggle();}else if(k==="j"||k==="l"){e.preventDefault();go(clock+(k==="j"?-10:10));}return;
 }
 if(mode!=="try"||(!stage.contains(el)&&el!==document.body)||(el.closest("button")&&["Enter"," "].includes(e.key)))return;
 const keys={Home:"home",Escape:"esc",Enter:"enter",Backspace:"del",Delete:"del",ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down","-":"neg",".":"dot","+":"plus"};
 const k=keys[e.key]||(/^[a-z0-9]$/i.test(e.key)?e.key.toLowerCase():"");if(k){e.preventDefault();press(k);}
});
switchTo(params.get("mode")==="try"?"try":"watch");
})();
