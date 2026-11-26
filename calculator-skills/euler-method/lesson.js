(function(){"use strict";
const C=window.StatsLesson,$=id=>document.getElementById(id),stage=$("stage"),seek=$("seek"),overlay=$("start-overlay"),play=$("play");
function num(value){
 const s=String(value??"").trim().replace(/−/g,"-");
 if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(s))return null;
 const v=Number(s);return Number.isFinite(v)&&Math.abs(v)<=1e9?v:null;
}
const clone=x=>JSON.parse(JSON.stringify(x)), timed=t=>Math.floor(t/60)+":"+String(Math.floor(t)%60).padStart(2,"0"), fmt=n=>String(Number(n.toPrecision(7))).replace(/-/g,"−");
const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
function parse(entry,val){return entry[2]?entry[2].some(([x])=>x===val)?val:null:num(val);}
const params=new URLSearchParams(location.search),tabs=[$("watch-tab"),$("try-tab")];
function readProblem(fromURL=false){
 const d={...C.assigned};let any=false;
 if(fromURL&&C.input.some(([k])=>params.has(k))&&C.input.some(([k])=>params.getAll(k).length!==1)){
  return {d,error:"Linked cases need all "+C.input.map(([k])=>k).join(", ")+" exactly once.",any:true};
 }
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
const initial=d=>({page:"idle",raw:"",cursor:0,history:[],result:null,data:d,fromWatch:false,error:""});
let practiceState=initial(problem),state=practiceState,forkKey=null;
const forkDrafts=new Map();
function keepFork(){forkDrafts.set(forkKey,state);if(forkDrafts.size>24)forkDrafts.delete(forkDrafts.keys().next().value);}
seek.max=C.duration;
$("title").textContent=C.name;$("intro").textContent=C.intro;$("lcd-app").textContent=C.app;$("notes").textContent=C.notes;
$("keys-help").textContent="Type y + h × (slope). Use ( ) and × for multiplication. Enter records each update; never reuse an old slope.";
C.refs.forEach(([title,url],i)=>{if(i)$("references").append(document.createTextNode(" · "));const a=node("a",title);a.href=url;$("references").append(a);});
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
const chars={"lparen":"(","rparen":")","dot":".","minus":"-","neg":"-","plus":"+","mul":"*","div":"/"};
function press(base,key){
 const s=clone(base);s.error="";
 if(key==="esc"){s.raw="";s.cursor=0;s.page=s.result?"result":"idle";return s;}
 if(key==="left"||key==="right"){s.cursor=Math.max(0,Math.min(s.raw.length,s.cursor+(key==="left"?-1:1)));return s;}
 if(key==="del"){if(s.cursor>0){s.raw=s.raw.slice(0,s.cursor-1)+s.raw.slice(s.cursor);s.cursor--;}s.page=s.raw?"entry":s.result?"result":"idle";return s;}
 if(key==="enter"){
  try{const r={...EulerTrainer.calculate(s.raw),text:s.raw};s.history=[...s.history,r].slice(-32);s.result=r;s.raw="";s.cursor=0;s.page="result";}
  catch(e){s.error=e.message;}
  return s;
 }
 if(key==="menu"){s.error="This lesson uses direct arithmetic on an open Calculator page. No menu is needed.";return s;}
 const ch=chars[key]||(/^[0-9]$/.test(key)?key:"");
 if(ch&&s.raw.length<104){s.raw=s.raw.slice(0,s.cursor)+ch+s.raw.slice(s.cursor);s.cursor++;s.page="entry";}
 return s;
}
const pretty=x=>x.replace(/\*/g,"×").replace(/\//g,"÷").replace(/-/g,"−");
const btn=(text,active,click)=>{const b=node("button",text,active?"calc-active":"");b.type="button";if(click)b.addEventListener("click",click);else b.disabled=true;return b;};
function renderLCD(s,watch){
 const d=$("lcd-body");d.replaceChildren();
 const history=node("div",undefined,"arithmetic-history");
 s.history.slice(-2).forEach(r=>{const row=node("div",undefined,"arithmetic-row");row.append(node("p",pretty(r.text),"arithmetic-expr"),node("p",fmt(r.value),"arithmetic-result"));history.append(row);});
 const input=node("p",undefined,"arithmetic-in"),caret=node("span",undefined,"arithmetic-caret");caret.setAttribute("aria-hidden","true");
 input.append(document.createTextNode(pretty(s.raw.slice(0,s.cursor))),caret,document.createTextNode(pretty(s.raw.slice(s.cursor))));
 d.append(history,input);
 $("lcd-text").textContent=[...s.history.slice(-2).map(r=>pretty(r.text)+" equals "+fmt(r.value)),s.raw?"Entry: "+pretty(s.raw):"Calculator ready."].join("; ");
 stage.dataset.scene=s.page;
}
function snapshot(t){let s=initial(C.demo),key="";for(const [at,k] of C.keys){if(at>t)break;s=press(s,k);key=t<at+.36?k:"";}return {s,key};}
const chapters=C.chapters;
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
 const msg=!state.result||state.page!=="result"?"Run the handheld calculation before checking.":C.grade(problem,state,a,match);
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
 for(const el of document.querySelectorAll("main > .head, main > .calc-tabs, main > .notes"))el.inert=v;
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
 
 const keys={m:"menu",M:"menu",Escape:"esc",Enter:"enter",Backspace:"del",Delete:"del",ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down","-":"minus",".":"dot","+":"plus","*":"mul","/":"div","(":"lparen",")":"rparen"};
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
