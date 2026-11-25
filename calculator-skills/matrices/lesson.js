(function(){"use strict";
const M=window.CT21,$=id=>document.getElementById(id),stage=$("stage"),seek=$("seek"),screen=$("screen");
const params=new URLSearchParams(location.search),request=M.request(params);
const {cues,duration}=M;
seek.max=duration;
let mode="watch",t=0,origin=0,playing=false,started=false,focus=false,frame=0,stamp="",s=M.start(),forked=false,light=0;
let colon=false,lastTarget=null, milestones=new Set(),attemptKind="",savedPractice=null;
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
 if(/^a\^/.test(s.input)){const h=elt("span","a"),exp=elt("sup",pretty(s.input.slice(2))||" ","exponent");exp.append(elt("i",undefined,"cursor"));h.append(exp);return h;}
 const out=elt("span",s.input.replace(":="," := ").replace(/-/g,"−"));
 if(s.ctrl)out.append(elt("small","ctrl","ctrl-on"));
 else out.append(elt("i",undefined,"cursor"));
 return out;
}
function logLine(entry){
 const row=elt("div",undefined,"log-line");row.dataset.kind=entry.kind;
 row.append(elt("span",entry.name==="a := matrix"?"a :=":entry.name==="matrix"?"Matrix":entry.name,"log-operation"));
 const large=entry.kind==="inverse"&&entry.result.some(r=>r.some(x=>String(x).length>6));
 const concise=x=>{
  const [num,den=1]=String(x).split("/").map(Number);
  const n=num/den, val=n!==0&&(Math.abs(n)<.01||Math.abs(n)>=1000)?n.toExponential(2):String(Number(n.toPrecision(3)));
  return pretty(val.replace(/^(-?)0\./,"$1.").replace(".0e","e").replace("e+","E").replace("e-","E-"));
 };
 if(large){
  row.classList.add("approx");
  row.firstElementChild.textContent+=" ≈";
  row.setAttribute("aria-label","a inverse, approximate display");
 }
 let v=Array.isArray(entry.result)?matrix(entry.result,{toDisplay:large?concise:pretty}):elt("span",pretty(entry.result));
 v.classList.add("log-value");row.append(v);return row;
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
  if(snapshot.input==="a:=")text.append(elt("span","a :=","entry-prefix"));
  text.append(matrix(rows,{snapshot,interactive:!watch}));
  if(snapshot.cell===snapshot.cells.length)text.append(elt("i",undefined,"cursor"));
 }else{
  for(const entry of snapshot.history.slice(-2))screen.append(logLine(entry));
  text.append(expression(snapshot));
 }
 screen.append(text);
 if(snapshot.page==="menu"||snapshot.page==="dims")screen.append(controls(snapshot,watch));
 if(snapshot.error)screen.append(elt("div",snapshot.error.split(". ")[0].replace(/\.$/,""),"lcd-error"));
 if(!watch){
  const hints={
   calc:snapshot.A?"Type det(a) for the determinant or a raised to −1 for the inverse.":"Type a, then Ctrl + template. Open Menu → 7 → 1 → 1.",
   menu:"Choose Matrix & Vector → Create → Matrix.",dims:"Choose the number of rows and columns. Tab to OK, then Enter.",
   cells:"Type entries row by row. Tab moves to the next cell. Enter stores the matrix."
  };
  $("hint").textContent=hints[snapshot.page];
  const error=snapshot.error||request.error;$("error").textContent=error;$("error").hidden=!error;
 }
}
function same(A,B){return A&&B&&A.length===B.length&&A.every((row,i)=>row.length===B[i].length&&row.every((v,j)=>v===B[i][j]));}
function observe(old,now,key){
 const entry=now.history.at(-1);
 if(entry?.kind==="store"&&entry!==old.history.at(-1)){milestones=new Set();lastTarget=same(now.A,request.target);attemptKind="";}
 if(lastTarget&&entry!==old.history.at(-1)&&["det","inverse"].includes(entry?.kind))milestones.add(entry.kind);
 if(lastTarget&&["enter","select"].includes(key)&&now.error.startsWith("Singular matrix"))milestones.add("singular");
 if(lastTarget&&["enter","select"].includes(key)&&now.error.startsWith("Not a square matrix")){
  if(old.input==="det(a)")milestones.add("non-square-det");else if(old.input.startsWith("a^"))milestones.add("non-square-inverse");
 }
 if(entry?.kind==="store"&&entry!==old.history.at(-1)&&!lastTarget)attemptKind="That is a different matrix. Compare the rows with the Try matrix.";
 displayProgress();
}
function displayProgress(){
 const complete=milestones.has("det")&&(milestones.has("inverse")||milestones.has("singular"))||milestones.has("non-square-det")&&milestones.has("non-square-inverse");
 const p=$("progress");
 p.textContent=complete?"Complete. You used both operations and checked whether they were defined.":milestones.has("det")?"Determinant checked. Now try the inverse.":attemptKind;
 p.hidden=!p.textContent;
}
function physical(key){
 if(mode!=="try")return;
 clearTimeout(light);
 const keys=s.ctrl&&key==="templates"?["ctrl","templates"]:[key==="assign"?"templates":key];
 shell.setKeys(keys);light=setTimeout(()=>shell.setKeys([]),175);
 const old=s;s=M.press(s,key);observe(old,s,key);render(s,false);
}
cues.forEach(([,title],i)=>{const row=elt("li");row.append(label(String(i+1).padStart(2,"0")+"  "+title,()=>go(cues[i][0]),false,false));$("chapters").append(row);});
$("target").append(matrix(request.target,{fixed:true}));
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
 $("task").textContent=forked?"This is a copy of the Watch frame. Continue here, or start the separate practice.":"Enter this matrix as a. Find its determinant and inverse if they exist.";
 $("target-wrap").hidden=forked;$("reset").textContent=forked?"Practice task":"Reset";
}
function resetProgress(){lastTarget=null;milestones=new Set();attemptKind="";displayProgress();colon=false;}
function copyPractice(){return {state:s,targetMatched:lastTarget,marks:new Set(milestones),message:attemptKind};}
function restorePractice(){
 if(!forked)return;
 const work=savedPractice;
 s=work.state;lastTarget=work.targetMatched;milestones=new Set(work.marks);attemptKind=work.message;
 savedPractice=null;forked=false;colon=false;displayProgress();
}
function change(to,takeover=false,fromTab=false){
 if(to===mode)return;
 if(mode==="watch"){
  pause();
  if(focus)setFocus(false);
  if(to==="try"){
   if(takeover&&t<duration-.012){
    if(!forked)savedPractice=copyPractice();
    s=M.watchAt(t).state;forked=true;resetProgress();
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
 else{s=M.start();resetProgress();}
 taskMode();render(s,false);stage.focus({preventScroll:true});
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
 const map={m:"menu",M:"menu",Escape:"esc",Enter:"enter",ArrowDown:"down",ArrowUp:"up",ArrowLeft:"left",ArrowRight:"right",Backspace:"del",Delete:"del","-":"neg","^":"power","(":"lparen",")":"rparen","=":colon?"assign":""};
 let key=map[e.key]||(/^[adet0-9]$/i.test(e.key)?e.key.toLowerCase():"");
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
