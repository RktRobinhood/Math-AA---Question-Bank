(function(){
"use strict";
const M=CT17,T=CT17Tape,$=id=>document.getElementById(id),stage=$("stage"),seek=$("seek"),overlay=$("start-overlay"),play=$("play");
const p=new URLSearchParams(location.search),link=M.request(p),original=link.d;
const tabs=[$("watch-tab"),$("try-tab")],scope=["watch-message","watch-player","watch-panel"],tryScope=["try-header","try-panel"];
const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;return e;};
const button=(text,fn,active=false,watch=false)=>{const b=node("button",text,active?"calc-active":"");b.type="button";b.disabled=watch||!fn;if(!b.disabled)b.onclick=fn;return b;};
const clockText=t=>Math.floor(t/60)+":"+String(Math.floor(t)%60).padStart(2,"0");
const label={east:"East component (km)",north:"North component (km)",up:"Vertical component (km)"};
const answers={horizontal:"Horizontal distance (km)",bearing:"Clockwise bearing (°)",elevation:"Signed elevation (°)",diagonal:"Sloping distance (km)"};
const shell=HandheldShell.mount({host:$("handheld-host"),screen:$("lcd"),interactive:false,label:"TI-Nspire CX II-T calculator rehearsal",onKey:physical});
const refs={};
// Align the shared shell's decorative square-root legend with the official real key.
const powerLegend=shell.body.querySelector('[data-hh-key="power"] + .hh-secondary');
if(powerLegend)shell.body.querySelector('[data-hh-key="square"]').after(powerLegend);

let mode="watch",time=0,playing=false,origin=0,frame=0,started=false,stamp="",focused=false,focusMemory=false,focusChoice=null,light=0;
let current=M.initial(), problem={...original}, lane=null, warning=link.error, assess="";
let independent=current;
const forks=new Map();
function addFields(def,host,prefix){
 for(const [k,txt] of Object.entries(def)){
  const lab=node("label",txt),input=node("input");
  lab.htmlFor=input.id=prefix+k;input.inputMode=k==="bearing"?"numeric":"decimal";input.maxLength=26;input.autocomplete="off";input.spellcheck=false;
  $(host).append(lab,input);refs[input.id]=input;
 }
}
addFields(label,"data-fields","problem-");addFields(answers,"answer-fields","answer-");
const sign=n=>String(n).replace("-","−"), showAnswers=()=>{for(const k in answers)refs["answer-"+k].value="";};
function fill(){for(const k in label)refs["problem-"+k].value=sign(problem[k]);}
fill();

function compass(host,d){
 const target=$(host);target.replaceChildren();
 const uri="http://www.w3.org/2000/svg",el=(tag,attributes,text)=>{const g=document.createElementNS(uri,tag);Object.entries(attributes).forEach(([k,v])=>g.setAttribute(k,v));if(text)g.textContent=text;return g;};
 const s=el("svg",{viewBox:"0 0 220 149",role:"img","aria-label":"Top view from the base, north up, east right; "+M.direction(d).word+" displacement. Horizontal plan only."});
 const X=107,Y=73,scale=50/Math.max(Math.abs(d.east),Math.abs(d.north)),x=X+d.east*scale,y=Y-d.north*scale;
 s.append(el("line",{x1:24,y1:Y,x2:192,y2:Y,class:"comp-axis"}),el("line",{x1:X,y1:14,x2:X,y2:132,class:"comp-axis"}));
 const ticks=[["N",X,10,"middle"],["S",X,145,"middle"],["W",13,Y+4,"middle"],["E",204,Y+4,"middle"]];
 for(const [text,tx,ty,anchor] of ticks)s.append(el("text",{x:tx,y:ty,"text-anchor":anchor},text));
 s.append(el("path",{d:`M ${X} ${Y} H ${x} V ${y}`,class:"comp-proj"}));
 s.append(el("line",{x1:X,y1:Y,x2:x,y2:y,class:"comp-run"}));
 // A fixed north-to-east marker teaches the clockwise convention without measuring or giving the answer.
 s.append(el("path",{d:`M ${X} ${Y-23} A 23 23 0 0 1 ${X+23} ${Y}`,class:"comp-arc"}),el("path",{d:`M ${X+19} ${Y-5} L ${X+23} ${Y} L ${X+27} ${Y-5}`,class:"comp-arc"}));
 s.append(el("circle",{cx:X,cy:Y,r:2.7,class:"base"}),el("circle",{cx:x,cy:y,r:3.8,class:"drone"}));
 s.append(el("text",{x:x+(x>X?7:-7),y:y+(y>Y?-7:13),"text-anchor":x>X?"start":"end",class:"point-label"},"P"));
 s.append(el("text",{x:X-5,y:Y-5,"text-anchor":"end",class:"point-label"},"O"));
 target.append(s,node("p","Plan only · O is the base, P is the horizontal projection.","comp-note"));
}
compass("watch-sketch",M.demo);
compass("try-sketch",problem);
const pretty=str=>str.replaceAll("sqrt","√").replaceAll("asin","sin⁻¹").replaceAll("acos","cos⁻¹").replaceAll("atan","tan⁻¹").replaceAll("^2","²").replaceAll("*","×").replaceAll("/","÷").replaceAll("-","−");
function expression(target,raw,cursor=null){
 const caret=()=>{const i=node("span",null,"arithmetic-caret");i.setAttribute("aria-hidden","true");return i;};
 const hasRoot=raw.startsWith("sqrt(")&&raw.endsWith(")")&&!raw.slice(5,-1).includes(")");
 if(hasRoot){
  const cap=node("span","√","root-sign"),under=node("span",null,"root-inner"),inside=raw.slice(5,-1);
  if(cursor!=null&&cursor<5)target.append(caret());
  target.append(cap,under);
  if(cursor==null||cursor<5||cursor>=raw.length)under.textContent=pretty(inside);
  else under.append(document.createTextNode(pretty(inside.slice(0,cursor-5))),caret(),document.createTextNode(pretty(inside.slice(cursor-5))));
  if(cursor===raw.length)target.append(caret());
 }else if(cursor===null)target.textContent=pretty(raw);
 else target.append(document.createTextNode(pretty(raw.slice(0,cursor))),caret(),document.createTextNode(pretty(raw.slice(cursor))));
}
function draw(s,watch){
 const body=$("lcd-body");body.replaceChildren();
 $("lcd-mode").textContent=s.mode.toUpperCase();
 $("lcd-app").textContent=s.view==="home"||s.view==="settings-menu"?"Home":s.view==="settings"?"Settings":"Calculator";
 stage.dataset.scene=s.view;
 const act=k=>()=>physical(k);
 const click=(txt,fn,a=false)=>button(txt,fn,a,watch);
 let mirror="";
 if(s.view==="home"||s.view==="settings-menu"){
  const home=node("div",null,"home-grid"),a=node("div"),b=node("div");
  a.append(node("b","Scratchpad"),click("A Calculate",null),click("B Graph",null));
  b.append(node("b","Documents"),click("1 New…",null),click("2 Browse…",null),click("3 Recent…",null),click("4 Current",act("4")),click("5 Settings…",act("5"),s.view==="settings-menu"));
  home.append(a,b);body.append(home);mirror="Home. 4 Current, 5 Settings.";
  if(s.view==="settings-menu"){
   const drop=node("div",null,"settings-list");
   ["1 Change Language","2 Document Settings","3 Graphs & Geometry","4 Handheld Setup","5 Status"].forEach((name,i)=>drop.append(click(name,i===1?act("2"):null,i===1)));
   body.append(drop);mirror="Settings. 2 Document Settings.";
  }
 }else if(s.view==="settings"){
  const panel=node("div",null,"lcd-dialog"),rows=node("div",null,"lcd-fields"),buttons=node("div",null,"lcd-actions");
  panel.append(node("strong","Document Settings"),rows,buttons);
  ["Float 6",M.forms[s.draft],"Normal","Real","Auto","On"].forEach((value,i)=>{
   rows.append(node("span",M.settings[i]));
   const b=click(value,i===1?()=>update({...current,field:1,drop:true,choice:M.modes.indexOf(current.draft)}):null,s.field===i);
   b.setAttribute("aria-label",M.settings[i]+": "+value);rows.append(b);
  });
  buttons.append(click("OK",()=>update(M.press(M.press(current,"point-ok"),"select")),s.field===6),click("Cancel",act("esc"),s.field===7));
  if(watch&&s.field===6){const arrow=node("span","➤","ok-pointer");arrow.setAttribute("aria-hidden","true");buttons.firstElementChild.append(arrow);}
  if(s.drop){
   const drop=node("div",null,"angle-options");
   M.modes.forEach((m,i)=>drop.append(click(M.forms[m],()=>update(M.press({...current,choice:i},"enter")),i===s.choice)));
   panel.append(drop);
  }
  body.append(panel);
  mirror="Document Settings. Angle "+M.forms[s.draft]+". "+(s.drop?"Select Radian, Degree or Gradian.":"Field: "+M.settings[s.field]+".");
 }else{
  const hist=node("div",null,"arithmetic-history");
  for(const r of s.hist.slice(-2)){
   const row=node("div",null,"arithmetic-row"),ex=node("p",null,"arithmetic-expr");
   expression(ex,r.raw);row.append(ex,node("p",M.display(r.value),"arithmetic-result"));hist.append(row);
  }
  const input=node("p",null,"arithmetic-in");expression(input,s.raw,s.cursor);body.append(hist,input);
  mirror=[...s.hist.slice(-2).map(r=>pretty(r.raw)+" = "+M.display(r.value)),s.raw?"Entry: "+pretty(s.raw):"Calculator ready."].join("; ");
  if(s.view==="palette"){
   const panel=node("div",null,"trig-grid");panel.setAttribute("role","group");panel.setAttribute("aria-label","Trig symbol palette");
   M.fnames.forEach((name,i)=>{const b=click(M.glyph(s,i),()=>update(M.chooseTrig(current,i)),i===s.trig);b.setAttribute("aria-label",i>=6?"Inverse "+name.slice(1):name);panel.append(b);});
   body.append(panel);mirror+=" Trig palette. Selected "+M.glyph(s,s.trig)+".";
  }
  if(s.ctrl){const c=node("span","ctrl","ctrl-ind");c.setAttribute("aria-hidden","true");body.append(c);}
 }
 $("lcd-text").textContent=mirror;
}
const chapterBtns=T.chapters.map(([time,title],i)=>{const li=node("li"),b=button("",()=>jump(time));b.append(node("span",String(i+1).padStart(2,"0")),document.createTextNode(title));li.append(b);$("chapters").append(li);return b;});
seek.max=T.duration;
function paintWatch(){
 if(mode!=="watch")return;
 const {state,key,chapter}=T.snapshot(time),id=JSON.stringify([chapter,state]);
 seek.value=time;seek.setAttribute("aria-valuetext",clockText(time)+" of "+clockText(T.duration));$("clock").textContent=clockText(time)+" / "+clockText(T.duration);
 shell.setKeys(key&&key!=="point-ok"?[key]:[]);overlay.hidden=started||time>0;
 $("take").textContent=time>0&&time<T.duration-.02?"Take over":"Open Try";
 if(id===stamp)return;stamp=id;
 draw(state,true);
 $("caption").textContent=T.chapters[chapter][2];$("takeaway").textContent=T.chapters[chapter][3];chapterBtns.forEach((b,i)=>b.setAttribute("aria-current",String(i===chapter)));
}
function paintTry(){
 const active=document.activeElement?.closest?.("#lcd-body");
 draw(current,false);
 if(active)stage.focus({preventScroll:true});
 const pick=lane!==null?M.demo:problem;
 const h=k=>sign(pick[k]);
 $("try-context").textContent=(lane!==null?"Watch copy. ":"Find the lengths, bearing and signed elevation. ")+"E "+h("east")+" · N "+h("north")+" · up "+h("up")+" km";
 $("edit-details").hidden=lane!==null;$("answer").hidden=lane!==null;$("try-sketch").hidden=lane!==null;
 $("reset").textContent=lane===null?"Reset Try":"Open independent Try";
 $("tool-status").textContent=current.error||(lane===null?warning:"");$("tool-status").dataset.error=String(Boolean(current.error||lane===null&&warning));
 $("assess-feedback").textContent=assess;
}
function stash(){if(lane===null)independent=current;else{forks.set(lane,current);if(forks.size>30)forks.delete(forks.keys().next().value);}}
function update(s){current=s;stash();if(mode==="try")paintTry();}
function physical(key){
 if(mode!=="try")return;
 if(document.activeElement!==stage)stage.focus({preventScroll:true});
 clearTimeout(light);shell.setKeys([key]);light=setTimeout(()=>shell.setKeys([]),180);
 if(lane===null){warning="";assess="";}
 update(M.press(current,key));
}
$("data-form").onsubmit=e=>{
 e.preventDefault();if(lane!==null)return;
 const d=Object.fromEntries(M.ids.map(k=>[k,M.number(refs["problem-"+k].value)])),err=M.validate(d);
 if(err){warning=err;paintTry();return;}
 problem=d;warning="";assess="";current=M.initial();stash();showAnswers();compass("try-sketch",problem);$("edit-details").open=false;paintTry();stage.focus({preventScroll:true});};
$("answer").onsubmit=e=>{
 e.preventDefault();if(lane!==null)return;
 const msg=M.grade(problem,Object.fromEntries(Object.keys(answers).map(k=>[k,refs["answer-"+k].value])),current.hist);
 assess=msg||"Correct. The bearing uses the horizontal plan; the elevation and sloping distance also use the height.";
 $("assess-feedback").dataset.error=String(Boolean(msg));paintTry();
};
$("answer").oninput=()=>{assess="";$("assess-feedback").textContent="";};

function navigationInset(){return document.querySelector(".tabbar")?.offsetHeight||0;}

function size(){
 if(mode==="try"){
  const h=window.visualViewport?.height||innerHeight, top=$("handheld-host").getBoundingClientRect().top+window.scrollY;
  const width=Math.floor((h-Math.max(0,top)-9)*558/1168);
  stage.style.setProperty("--try-fit",Math.min(307,Math.max(154,width))+"px");
  return;
 }
 const avail=(window.visualViewport?.height||innerHeight)-(Math.max(0,stage.getBoundingClientRect().top)+navigationInset());
 const landscape=focused&&innerWidth>710&&avail<=600;
 const fixed=landscape?22:$("watch-message").offsetHeight+$("watch-player").offsetHeight+20;
 stage.style.setProperty("--watch-fit",Math.max(94,Math.min(focused?340:295,Math.floor((avail-fixed)*558/1168)))+"px");
}
const ro=new ResizeObserver(size);for(const e of [$("watch-message"),$("watch-player"),$("try-header"),document.querySelector(".head")])ro.observe(e);
window.addEventListener("resize",size);window.visualViewport?.addEventListener("resize",size);
function focus(on){
 focused=on;stage.classList.toggle("focus-open",on);document.body.classList.toggle("stats-focus",on);
 for(const el of document.querySelectorAll("main > .head, main > .calc-tabs, main > .notes"))el.inert=on;
 const b=$("focus");b.setAttribute("aria-label",on?"Exit focused view":"Focused view");b.setAttribute("aria-pressed",String(on));b.textContent=on?"Exit":"Focus";if(on)stage.scrollTop=0;size();
}
function autofit(){
 size();
 if(focusChoice!==false&&(focusMemory||shell.body.getBoundingClientRect().width<169||$("watch-player").getBoundingClientRect().bottom>innerHeight-2))focus(true);
}
function labelPlay(){const v=playing?"Pause":time>=T.duration-.015?"Replay":"Play";play.textContent=v;play.setAttribute("aria-label",v);}
function jump(x){time=Math.max(0,Math.min(T.duration,Number(x)||0));origin=performance.now()-time*1000;paintWatch();labelPlay();}
function stop(){playing=false;cancelAnimationFrame(frame);paintWatch();labelPlay();}
function tick(now){if(!playing||mode!=="watch")return;time=Math.min(T.duration,Math.max(0,(now-origin)/1000));paintWatch();if(time>=T.duration){stop();return;}frame=requestAnimationFrame(tick);}
function start(){
 if(mode!=="watch")return;
 autofit();if(document.activeElement===overlay)play.focus({preventScroll:true});
 if(time>=T.duration-.015)jump(0);
 started=true;playing=true;origin=performance.now()-time*1000;paintWatch();labelPlay();frame=requestAnimationFrame(tick);
}
function toggle(){if(playing)stop();else start();}
play.onclick=overlay.onclick=toggle;seek.oninput=()=>jump(seek.value);$("back").onclick=()=>jump(time-10);$("forward").onclick=()=>jump(time+10);
$("replay").onclick=()=>{stop();jump(0);start();};
$("focus").onclick=()=>{focusChoice=!focused;focus(!focused);};
function modeTo(to,take=false){
 if(to==="try"){
  if(mode==="watch"){
   stop();focusMemory=focused;if(focused)focus(false);
   lane=take&&time>0&&time<T.duration-.02?String(Math.round(time*1000)):null;
   current=lane===null?independent:(forks.get(lane)||{...T.snapshot(time).state,fromWatch:true});
   stash();
  }else if(!take&&lane!==null){lane=null;current=independent;}
 }
 mode=to;const w=to==="watch";
 stage.dataset.mode=mode;stage.dataset.tryLane=w?"":lane===null?"practice":"fork";document.body.classList.toggle("stats-try",!w);
 scope.forEach(id=>$(id).hidden=!w);tryScope.forEach(id=>$(id).hidden=w);
 tabs.forEach((el,i)=>{const v=(i===0)===w;el.setAttribute("aria-selected",String(v));el.tabIndex=v?0:-1;});
 clearTimeout(light);shell.setKeys([]);shell.setInteractive(!w);stamp="";window.scrollTo(0,0);
 if(w){paintWatch();labelPlay();autofit();}
 else{overlay.hidden=true;paintTry();size();}
}
tabs.forEach((b,i)=>{
 b.onclick=()=>{modeTo(i?"try":"watch");if(i)stage.focus({preventScroll:true});};
 b.onkeydown=e=>{if(!["ArrowLeft","ArrowRight","Home","End"].includes(e.key))return;e.preventDefault();const k=e.key==="Home"?0:e.key==="End"?1:1-i;modeTo(k?"try":"watch");tabs[k].focus();};
});
$("take").onclick=()=>{modeTo("try",true);stage.focus({preventScroll:true});};
$("return").onclick=()=>{modeTo("watch");play.focus({preventScroll:true});};
$("reset").onclick=()=>{
 if(lane!==null){modeTo("try");stage.focus({preventScroll:true});return;}
 problem={...original};current=M.initial();stash();warning="";assess="";fill();showAnswers();compass("try-sketch",problem);$("edit-details").open=false;paintTry();stage.focus({preventScroll:true});
};
const map={Home:"home",Escape:"esc",Backspace:"del",Delete:"del",Enter:"enter",ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down",
 "-":"minus","+":"plus","/":"div","*":"mul","^":"power",".":"dot","(":"lparen",")":"rparen",s:"square",t:"trig",c:"ctrl"};
document.addEventListener("keydown",e=>{
 if(e.target!==document.body&&!e.target.closest?.(".qb-calculator-lesson"))return;
 const el=e.target;
 if(e.altKey||e.metaKey||e.ctrlKey||e.isComposing||el.closest?.("input,textarea,select,a,summary,[contenteditable]"))return;
 if(e.key==="Escape"&&focused){e.preventDefault();focusChoice=false;focus(false);$("focus").focus({preventScroll:true});return;}
 if(!stage.contains(el)&&el!==document.body)return;
 if(mode==="watch"){
  if(el.closest?.("button")||e.repeat)return;
  const key=e.key.toLowerCase();if(key===" "||key==="k"){e.preventDefault();toggle();}else if(key==="j"||key==="l"){e.preventDefault();jump(time+(key==="j"?-10:10));}
  return;
 }
 if(el.closest?.("button")&&["Enter"," "].includes(e.key))return;
 const key=map[e.key]||(/^[0-9]$/.test(e.key)?e.key:e.key==="Tab"&&current.view==="settings"&&!current.drop&&!e.shiftKey&&current.field!==7?"tab":null);
 if(key){e.preventDefault();physical(key);}
});
document.addEventListener("visibilitychange",()=>{if(document.hidden)stop();});
modeTo(p.get("mode")==="try"?"try":"watch");
})();
