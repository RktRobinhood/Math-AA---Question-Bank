(function(){"use strict";
const M=window.CT22,$=id=>document.getElementById(id),stage=$("stage"),seek=$("seek"),screen=$("screen");
const params=new URLSearchParams(location.search),request=M.request(params);
const {cues,duration}=M;
seek.max=duration;
let mode="watch",t=0,origin=0,playing=false,started=false,focus=false,frame=0,stamp="",s=M.start(),forked=false,light=0;
let colon=false,target=request.target,linkError=request.error,savedPractice=null;
const shell=HandheldShell.mount({host:$("handheld-host"),screen:$("lcd"),interactive:false,label:"TI-Nspire CX II-T Calculator",onKey:k=>{physical(k);stage.focus({preventScroll:true});}});
const tt=t=>"0:"+String(Math.floor(t)).padStart(2,"0"),pretty=v=>String(v).replace(/-/g,"−");
const elt=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
function label(text,action,active,watch,cls){
 const b=elt("button",text,cls);b.type="button";
 if(active)b.classList.add("active");
 if(watch)b.disabled=true;else if(action)b.addEventListener("click",action);
 return b;
}
function matrix(rows,{snapshot=null,interactive=false,fixed=false,toDisplay=pretty}={}){
 const m=elt("span",undefined,"matrix");m.style.setProperty("--m-columns",rows[0].length);m.dataset.matrix=JSON.stringify(rows);
 rows.forEach((row,i)=>row.forEach((v,j)=>{
  const idx=i*row.length+j,active=snapshot?.cell===idx,symbol=v===""?" ":toDisplay(v);
  const a=interactive?label(symbol,()=>{s={...s,cell:idx};render(s,false);stage.focus({preventScroll:true});},active,false,"matrix-cell"):elt("span",symbol,"matrix-cell"+(active?" active":""));
  if(snapshot){ a.classList.toggle("placeholder",v==="");a.setAttribute("aria-label","Row "+(i+1)+", column "+(j+1)+(v===""?", empty":": "+v)); a.dataset.cell=idx; }
  if(fixed)a.classList.add("fixed");
  m.append(a);
 }));
 return m;
}
function expression(s){
 const out=elt("span",s.input.replace(":="," := ").replace("×"," · "));
 if(s.ctrl)out.append(elt("small","ctrl","ctrl-on"));
 else out.append(elt("i",undefined,"cursor"));
 return out;
}
function logLine(entry){
 const row=elt("div",undefined,"log-line");row.dataset.kind=entry.kind;
 row.append(elt("span",entry.name.replace("×"," · "),"log-operation"));
 const v=matrix(entry.result);v.classList.add("log-value");row.append(v);return row;
}
function plot(node,entry){
 if(!M.isImage(entry)){node.hidden=true;node.replaceChildren();return;}
 const P=entry.right.map(r=>r[0]),Q=entry.result.map(r=>r[0]),pair=v=>"("+v.map(pretty).join(", ")+")";
 const cap=elt("figcaption"),axis=elt("span","Coordinate sketch · not on TI screen","plot-label");
 const marks=elt("span",undefined,"plot-legend");
 marks.append(elt("span","P "+pair(P),"plot-original"),elt("span","P′ "+pair(Q),"plot-image"));
 cap.append(axis,marks);
 const ns="http://www.w3.org/2000/svg",el=(tag,props)=>{const n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(props))n.setAttribute(k,v);return n;};
 const svg=el("svg",{viewBox:"0 0 200 166",role:"img","aria-label":"Original point "+pair(P)+" and image point "+pair(Q)+". Both axes have the same scale."});
 const limit=Math.max(2,...P.map(Math.abs),...Q.map(Math.abs)),S=64/limit;
 const line=(x1,y1,x2,y2,className)=>el("line",{x1,y1,x2,y2,class:className});
 for(const i of [-2,-1,1,2]){
  svg.append(line(100+i*32,15,100+i*32,151,"grid-line"),line(32,83+i*32,168,83+i*32,"grid-line"));
 }
 svg.append(line(26,83,177,83,"plot-axis"),line(100,156,100,9,"plot-axis"));
 for(const [name,x,y] of [["x",181,87],["y",105,15]]){
  const t=el("text",{x,y,class:"axis-text"});t.textContent=name;svg.append(t);
 }
 for(const [i,vec] of [P,Q].entries()){
  const [x,y]=[100+vec[0]*S,83-vec[1]*S],className=i?"vector-new":"vector-old";
  svg.append(line(100,83,x,y,className));
  if(i){svg.append(el("path",{d:"M"+x+" "+(y-5)+" l5 5 -5 5 -5 -5 z",class:"point-new"}));}
  else svg.append(el("circle",{cx:x,cy:y,r:7,class:"point-old"}));
 }
 node.replaceChildren(svg,cap);node.hidden=false;
}
function controls(snapshot,watch){
 const modal=elt("div",undefined,"lcd-modal");
 if(snapshot.page==="menu"){
  const names=["Calculator menu","Matrix & Vector","Create"];
  modal.setAttribute("aria-label",names[snapshot.menu]);modal.append(elt("strong",names[snapshot.menu],"menu-title"));
  const entries=M.menus[snapshot.menu],offset=snapshot.menu===0?(snapshot.field>=5?4:0):0;
  for(const [i,[id,name]] of entries.entries())if(i>=offset&&i<offset+5){
   modal.append(label(id+": "+name+((id===7&&snapshot.menu===0||id===1&&snapshot.menu===1)?" ▸":""),()=>physical(String(id)),i===snapshot.field,watch,"menu-item"));
  }
  if(snapshot.menu===0&&offset===0)modal.append(label("7: Matrix & Vector ▸",()=>physical("7"),snapshot.field===6,watch,"menu-item wanted"));
  return modal;
 }
 modal.setAttribute("aria-label","Create a Matrix");modal.append(elt("strong","Create a Matrix"));
 const grid=elt("div",undefined,"lcd-grid"),actions=elt("div",undefined,"lcd-actions");
 ["Number of rows","Number of columns"].forEach((text,i)=>{
  const b=label(snapshot.dim[i]||" ",()=>{s={...s,field:i};render(s,false);stage.focus({preventScroll:true});},snapshot.field===i,watch,"dim-value");
  b.setAttribute("aria-label",text+": "+(snapshot.dim[i]||"blank"));grid.append(elt("span",text),b);
 });
 [["OK",2],["Cancel",3]].forEach(([text,i])=>actions.append(label(text,()=>{s={...s,field:i};physical("enter");},snapshot.field===i,watch)));
 modal.append(grid,actions);return modal;
}
function render(snapshot,watch){
 stage.dataset.lcd=snapshot.page;screen.replaceChildren();
 const text=elt("div",undefined,"calc-input");
 if(snapshot.page==="cells"){
  const C=Number(snapshot.dim[1]),rows=Array.from({length:Number(snapshot.dim[0])},(_,i)=>snapshot.cells.slice(i*C,(i+1)*C));
  if(snapshot.input.endsWith(":="))text.append(elt("span",snapshot.input.replace(":="," :="),"entry-prefix"));
  text.append(matrix(rows,{snapshot,interactive:!watch}));
  if(snapshot.cell===snapshot.cells.length)text.append(elt("i",undefined,"cursor"));
 }else{
  for(const entry of snapshot.history.slice(-2))screen.append(logLine(entry));
  text.append(expression(snapshot));
 }
 screen.append(text);
 if(snapshot.page==="menu"||snapshot.page==="dims")screen.append(controls(snapshot,watch));
 if(snapshot.error)screen.append(elt("div",snapshot.error.split(". ")[0].replace(/\.$/,""),"lcd-error"));
 const newest=snapshot.history.at(-1);
 if(watch){plot($("watch-plot"),newest);stage.classList.toggle("revealed",M.isImage(newest));}
 else{
  const hints={
   calc:!snapshot.vars.t?"Store the 2×2 matrix as t. Type t, then Ctrl + template. Open Menu → 7 → 1 → 1.":!snapshot.vars.p?"Store the point as p. Open the same menu and choose 2 rows and 1 column.":"Type t × p, then Enter. Read the upper coordinate before the lower.",
   menu:"Choose Matrix & Vector → Create → Matrix.",dims:"Set the number of rows and columns. Tab to OK, then Enter.",
   cells:"Enter each row from left to right. Use Tab to move on. Press Enter to store."
  };
  $("hint").textContent=hints[snapshot.page];
  const error=snapshot.error||(!forked&&linkError)||"";$("error").textContent=error;$("error").hidden=!error;
  const isImage=M.isImage(newest)&&!snapshot.error;
  const ok=isImage&&M.same(newest.left,target.matrix)&&M.same(newest.right,target.point.map(x=>[x]));
  const progress=$("progress");
  progress.textContent=isImage?(forked?"Read the two entries from top to bottom.":ok?"Task complete. The top entry is x′; the bottom entry is y′.":"This product used different values from the exercise. Compare your stored matrices with the prompt."):"";
  progress.hidden=!progress.textContent;
  plot($("try-plot"),isImage?newest:null);
 }
}
function physical(key){
 if(mode!=="try")return;
 clearTimeout(light);
 const keys=s.ctrl&&key==="templates"?["ctrl","templates"]:[key==="assign"?"templates":key];
 shell.setKeys(keys);light=setTimeout(()=>shell.setKeys([]),175);
 s=M.press(s,key);render(s,false);
}
cues.forEach(([,title],i)=>{const row=elt("li");row.append(label(String(i+1).padStart(2,"0")+"  "+title,()=>go(cues[i][0]),false,false));$("chapters").append(row);});
function targetDraw(){
 $("target-wrap").replaceChildren(elt("span","t ="),matrix(target.matrix,{fixed:true}),elt("span","P = ("+target.point.map(pretty).join(", ")+")"));
 $("edit-matrix").value=target.matrix.map(row=>row.join(",")).join(";");
 $("edit-point").value=target.point.join(",");
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
function fitFocused(){
 if(!focus)return;
 const avail=innerHeight-$("watch-message").offsetHeight-$("watch-player").offsetHeight-25;
 stage.style.setProperty("--fit-handset",Math.max(162,Math.min(322,Math.floor(avail*.4777)))+"px");
}
window.addEventListener("resize",fitFocused);
function setFocus(next){
 focus=next;stage.classList.toggle("focused",focus);document.body.classList.toggle("has-focus",focus);
 document.querySelectorAll("main > header, main > .tabs, main > .reference").forEach(n=>n.inert=focus);
 $("focus").setAttribute("aria-pressed",String(focus));$("focus").setAttribute("aria-label",focus?"Exit Focus":"Focus");$("focus").textContent=focus?"Exit":"⛶";if(focus){fitFocused();stage.scrollTop=0;}
}
function ensureFit(){if(mode==="watch"&&!focus&&$("watch-player").getBoundingClientRect().bottom>innerHeight+1)setFocus(true);}
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
 $("task").textContent=forked?"Continue from the copied Watch frame, or open the separate practice.":"Find the image of P. Write (x′, y′).";
 $("target-wrap").hidden=forked;$("reset").textContent=forked?"Practice task":"Reset";
 $("reset").setAttribute("aria-label",forked?"Practice task":"Reset practice calculator");
 $("edit").hidden=forked;
}
function restorePractice(){
 if(!forked)return;
 s=savedPractice;savedPractice=null;forked=false;colon=false;
}
function change(to,takeover=false,fromTab=false){
 if(to===mode)return;
 if(mode==="watch"){
  pause();
  if(focus)setFocus(false);
  if(to==="try"){
   if(takeover&&t<duration-.012){
    if(!forked)savedPractice=s;
    s=M.watchAt(t).state;forked=true;colon=false;
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
 else{s=M.start();colon=false;}
 taskMode();render(s,false);stage.focus({preventScroll:true});
};
$("edit-form").onsubmit=e=>{
 e.preventDefault();
 const msg=$("edit-error");
 try{
  target=M.parse($("edit-matrix").value,$("edit-point").value);linkError="";s=M.start();colon=false;
  targetDraw();render(s,false);msg.hidden=true;$("edit").open=false;stage.focus({preventScroll:true});
 }catch(error){msg.textContent=error.message;msg.hidden=false;}
};
document.addEventListener("keydown",e=>{
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
 if(e.key===":"){colon=true;e.preventDefault();return;}
 const map={m:"menu",M:"menu",Escape:"esc",Enter:"enter",ArrowDown:"down",ArrowUp:"up",ArrowLeft:"left",ArrowRight:"right",Backspace:"del",Delete:"del","-":"neg","×":"mul","*":"mul","=":colon?"assign":""};
 let key=map[e.key]||(/^[tp0-9]$/i.test(e.key)?e.key.toLowerCase():"");
 colon=false;
 if(e.key==="Tab"&&["dims","cells"].includes(s.page)){
  if(s.page==="dims"&&(e.shiftKey&&s.field===0||!e.shiftKey&&s.field===3)||s.page==="cells"&&(e.shiftKey&&s.cell===0||!e.shiftKey&&s.cell===s.cells.length))return;
  key=e.shiftKey?"backtab":"tab";
 }
 if(key){e.preventDefault();if(e.target===document.body)stage.focus({preventScroll:true});physical(key);}
});
const theme=$("theme");
try{const pref=localStorage.getItem("ti-lab-theme");if(["light","dark"].includes(pref))theme.value=pref;}catch{}
document.documentElement.dataset.theme=theme.value;
theme.onchange=()=>{document.documentElement.dataset.theme=theme.value;try{localStorage.setItem("ti-lab-theme",theme.value==="system"?"auto":theme.value);}catch{}};
stage.dataset.mode="watch";draw();labelPlay();if(params.get("mode")==="try"||request.linked)change("try",false,true);
requestAnimationFrame(ensureFit);
})();
