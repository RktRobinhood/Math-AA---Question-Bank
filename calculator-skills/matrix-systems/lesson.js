(function(){"use strict";
const M=window.CTMatrix,$=id=>document.getElementById(id),stage=$("stage"),seek=$("seek"),screen=$("screen");
const params=new URLSearchParams(location.search),request=M.request(params);
const {cues,duration}=M;
seek.max=duration;
let mode="watch",t=0,origin=0,playing=false,started=false,focus=false,frame=0,stamp="",s=M.start(),forked=false,light=0;
let colon=false,target=request.target,linkError=request.error,savedPractice=null,forkKey="";
const forks=new Map(),SYS=M.SYS;
const shell=HandheldShell.mount({host:$("handheld-host"),screen:$("lcd"),interactive:false,label:"TI-Nspire CX II-T Calculator",onKey:k=>{physical(k);stage.focus({preventScroll:true});}});
const tt=t=>Math.floor(t/60)+":"+String(Math.floor(t)%60).padStart(2,"0"),pretty=v=>String(v).replace(/-/g,"−");
const elt=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
function label(text,action,active,watch,cls){
 const b=elt("button",text,cls);b.type="button";
 if(active)b.classList.add("calc-active");
 if(watch)b.disabled=true;else if(action)b.addEventListener("click",action);
 return b;
}
function matrix(rows,{snapshot=null,interactive=false,fixed=false,toDisplay=v=>pretty(M.fmt(v)),stack=false}={}){
 const m=elt("span",undefined,"matrix");m.style.setProperty("--m-columns",rows[0].length);m.dataset.matrix=JSON.stringify(rows);
 rows.forEach((row,i)=>row.forEach((v,j)=>{
  const idx=i*row.length+j,active=snapshot?.cell===idx,symbol=v===""?" ":toDisplay(v);
  const a=interactive?label(symbol,()=>{s={...s,cell:idx};render(s,false);stage.focus({preventScroll:true});},active,false,"matrix-cell"):elt("span",symbol,"matrix-cell"+(active?" calc-active":""));
  if(snapshot){ a.classList.toggle("placeholder",v==="");a.setAttribute("aria-label","Row "+(i+1)+", column "+(j+1)+(v===""?", empty":": "+v)); a.dataset.cell=idx; }
  if(stack&&typeof v==="string"&&v.includes("/")){
   const [n,d]=v.split("/");a.classList.add("fraction");a.setAttribute("aria-label",pretty(n)+" over "+d);
   a.replaceChildren(elt("span",pretty(n),"numerator"),elt("span",d,"denominator"));
  }
  if(fixed)a.classList.add("fixed");
  m.append(a);
 }));
 return m;
}
function notation(s,active=false){
 const n=elt("span"),m=/^(.*?)\^(-?[0-9]*)(.*)$/.exec(s.input);
 if(m){n.append(elt("span",m[1]));const e=elt("sup",pretty(m[2]),"exponent");
  if(active&&s.sup)e.append(elt("i",undefined,"cursor"));
  n.append(e,elt("span",m[3].replaceAll("×"," × ")));
 }else n.append(elt("span",s.input.replace(":="," := ").replaceAll("×"," × ")));
 if(active&&s.ctrl)n.append(elt("small","ctrl","ctrl-on"));
 else if(active&&!s.sup)n.append(elt("i",undefined,"cursor"));
 if(active&&s.input.startsWith("rref(")&&!s.input.endsWith(")")) n.append(elt("span",")","auto-close"));
 return n;
}
function logLine(entry,last){
 const row=elt("div",undefined,"log-line"+(last?" latest-log":"")+(entry.result[0].length>1?" wide-log":""));row.dataset.kind=entry.kind;
 const op=notation({input:entry.name});op.className="log-operation";row.append(op);
 const v=matrix(entry.result,{stack:entry.kind==="inverse"||entry.kind==="rref",...(entry.kind==="power"?{toDisplay:v=>pretty(Number(v.toPrecision(6)))}:{})});v.classList.add("log-value");row.append(v);return row;
}
function controls(snapshot,watch){
 const modal=elt("div",undefined,"lcd-modal");
 if(snapshot.page==="menu"){
  const names=["Calculator menu","Matrix & Vector","Create"];
  modal.setAttribute("aria-label",names[snapshot.menu]);modal.append(elt("strong",names[snapshot.menu],"menu-title"));
  const entries=M.menus[snapshot.menu],offset=snapshot.menu===0&&snapshot.field>=5?4:0;
  const indices=snapshot.menu===0?(offset?[4,5,6,7,8]:[0,1,2,3,4,6]):snapshot.menu===1?(snapshot.field===5?[1,2,3,4,5]:[0,1,2,3,4]):snapshot.field>=4?[2,3,4,5]:[0,1,2,3];
  for(const i of indices){
   const [id,name]=entries[i],essential=snapshot.menu===1&&id===5;
   modal.append(label(id+": "+name+((id===7&&snapshot.menu===0||id===1&&snapshot.menu===1)?" ▸":""),()=>physical(String(id)),i===snapshot.field,watch,"menu-item"+(essential?" essential":"")));
  }
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
function resetAnswer(){
 $("classification").value="";$("guess-x").value="";$("guess-y").value="";$("answer-feedback").textContent="";
 $("answer").hidden=true;setAnswerFields();
}
function setAnswerFields(){$("answer").querySelector(".answer-fields").hidden=SYS&&$("classification").value!=="unique";}
$("classification").onchange=()=>{setAnswerFields();$("answer-feedback").textContent="";};
$("status-field").hidden=!SYS;
$("answer-x").textContent=SYS?"x (exact)":"P(Ready), 3 decimal places";
$("answer-y").textContent=SYS?"y (exact)":"Steady-state P(Ready), exact";
$("answer").onsubmit=e=>{
 e.preventDefault();if(forked||!M.matches(s.history.at(-1),target))return;
 const feedback=M.grade(target,$("classification").value,$("guess-x").value,$("guess-y").value);
 $("answer-feedback").textContent=feedback;$("answer-feedback").classList.toggle("bad",!feedback.startsWith("Correct."));
};
function render(snapshot,watch){
 stage.dataset.lcd=snapshot.page;screen.replaceChildren();
 const input=elt("div",undefined,"calc-input");
 if(snapshot.page==="cells"){
  const C=Number(snapshot.dim[1]),rows=Array.from({length:Number(snapshot.dim[0])},(_,i)=>snapshot.cells.slice(i*C,(i+1)*C));
  if(snapshot.input.endsWith(":="))input.append(elt("span",snapshot.input.replace(":="," :="),"entry-prefix"));
  input.append(matrix(rows,{snapshot,interactive:!watch}));
  if(snapshot.cell===snapshot.cells.length)input.append(elt("i",undefined,"cursor"));
 }else{
  const history=snapshot.history.slice(-2);
  history.forEach((entry,i)=>screen.append(logLine(entry,i===history.length-1)));
  input.append(notation(snapshot,true));
 }
 screen.append(input);
 if(snapshot.page==="menu"||snapshot.page==="dims")screen.append(controls(snapshot,watch));
 if(snapshot.error)screen.append(elt("div",snapshot.error.split(". ")[0].replace(/\.$/,""),"lcd-error"));
 if(watch)return;
 const newest=snapshot.history.at(-1);
 const h=SYS?
  (forked?"Continue from the copied calculator. Your assigned exercise is separate.":target.matrix[0][0]*target.matrix[1][1]===target.matrix[0][1]*target.matrix[1][0]?
  "Use a 2×3 matrix m: x-coefficients, y-coefficients, then right-hand sides. Select Menu → 7 → 5 and enter m.":!snapshot.vars.a?
  "Store the coefficient matrix as a. Use Ctrl + template, then Menu → 7 → 1 → 1.":
  !snapshot.vars.b?"Store the right-hand sides as a 2×1 column called b.":"Enter a ^ (−) 1, →, × b, Enter. Match each result to the variable order."):
  !snapshot.vars.t?"Store t using the 2×2 template. The two entries in each starting-state column must sum to 1.":
  !snapshot.vars.s?"Store s using the 2×1 template. Ready goes above In use.":"Enter t ^ n, then →, × s, Enter. Replace n with the number of transitions requested.";
 const hints={calc:h,menu:SYS?"Build a matrix via Create, or use Reduced Row-Echelon Form for m.":"Choose Matrix & Vector → Create → Matrix.",dims:"Set the number of rows and columns. Tab to OK, then Enter.",cells:"Enter the entries row by row. Tab to move between cells and Enter to finish."};
 $("hint").textContent=hints[snapshot.page];
 const error=snapshot.error||(!forked&&linkError)||"";$("error").textContent=error;$("error").hidden=!error;
 const result=["prediction","inverse","rref"].includes(newest?.kind)&&!snapshot.error,matching=result&&M.matches(newest,target)&&!forked;
 $("progress").textContent=result?(forked?"This is the copied demonstration, not your assigned exercise.":matching?"Read the output, then check your interpretation.":"The result used different inputs or a different number of transitions from the exercise."): "";
 $("progress").hidden=!$("progress").textContent;
 $("answer").hidden=!matching;
}
function physical(key){
 if(mode!=="try")return;
 clearTimeout(light);
 const keys=s.ctrl&&key==="templates"?["ctrl","templates"]:[key==="assign"?"templates":key];
 shell.setKeys(keys);light=setTimeout(()=>shell.setKeys([]),175);
 const old=s.history.at(-1);s=M.press(s,key);
 if(!forked&&s.history.at(-1)!==old&&M.matches(s.history.at(-1),target)&&!M.matches(old,target))resetAnswer();
 render(s,false);
}
cues.forEach(([,title],i)=>{const row=elt("li");row.append(label(String(i+1).padStart(2,"0")+"  "+title,()=>go(cues[i][0]),false,false));$("chapters").append(row);});
const fieldLabels=SYS?{matrix:"Coefficients: a,b;c,d",rhs:"Right-hand sides: e,f"}:{transition:"Transition matrix: a,b;c,d",state:"Start column: p,q",steps:"Transitions: 1–30"};
M.taskKeys.forEach(k=>{
 const label=elt("label",fieldLabels[k]),input=elt("input");input.type="text";input.name=k;input.maxLength=64;input.required=true;input.autocomplete="off";
 label.append(input);$("edit-values").append(label);
});
$("edit-copy").textContent=SYS?"Use two integer rows, separated by a semicolon. Use (x, y) coefficient order. Applying clears only your practice calculator.":"Use positive transition probabilities, up to three decimal places, with each column summing to 1. Use Ready, In use order; applying clears only your practice calculator.";
function targetDraw(){
 const [a,b]=M.taskKeys,A=target[a],B=target[b],wrap=$("target-wrap");
 wrap.replaceChildren(elt("span",SYS?"A =":"T ="),matrix(A,{fixed:true}),elt("span",SYS?"b =":"s₀ ="),matrix(B.map(v=>[v]),{fixed:true}));
 if(!SYS)wrap.append(elt("span","n = "+target.steps));
 const data=M.encode(target);M.taskKeys.forEach(k=>{$("edit-form").elements.namedItem(k).value=data[k];});
 $("edit-error").hidden=true;
}
targetDraw();resetAnswer();
function draw(){
 if(mode!=="watch")return;
 const {state,keys,chapter}=M.watchAt(t),sig=JSON.stringify(state)+"|"+chapter;
 seek.value=t;seek.setAttribute("aria-valuetext",tt(t)+" of "+tt(duration));$("clock").textContent=tt(t)+" / "+tt(duration);
 shell.setKeys(keys);$("stage-play").hidden=started||t>0;
 if(sig!==stamp){
  stamp=sig;render(state,true);$("caption").textContent=cues[chapter][2];fitFocused();ensureFit();
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
 $("task").textContent=forked?"Copied Watch calculator. Your independent practice is unchanged.":SYS?"Use rows in x, y order. Decide how many solutions there are; if unique, find x and y exactly.":"States: Ready above In use. Find P(Ready) after n transitions, then its exact steady-state value.";
 $("target-wrap").hidden=forked;$("reset").textContent=forked?"Practice task":"Reset";
 $("reset").setAttribute("aria-label",forked?"Practice task":"Reset practice calculator");
 $("edit").hidden=forked;
}
function draft(){return {choice:$("classification").value,x:$("guess-x").value,y:$("guess-y").value,feedback:$("answer-feedback").textContent,bad:$("answer-feedback").classList.contains("bad")};}
function restorePractice(){
 if(!forked)return;
 s=savedPractice.s;const a=savedPractice.answer;
 $("classification").value=a.choice;$("guess-x").value=a.x;$("guess-y").value=a.y;
 $("answer-feedback").textContent=a.feedback;$("answer-feedback").classList.toggle("bad",a.bad);setAnswerFields();
 savedPractice=null;forked=false;forkKey="";colon=false;
}
function saveFork(){
 if(!forked||!forkKey)return;
 forks.delete(forkKey);forks.set(forkKey,s);
 if(forks.size>12)forks.delete(forks.keys().next().value);
}
function change(to,takeover=false,fromTab=false){
 if(to===mode)return;
 if(mode==="try")saveFork();
 if(mode==="watch"){
  pause();
  if(focus)setFocus(false);
  if(to==="try"){
   if(takeover&&t<duration-.012){
    if(!forked)savedPractice={s,answer:draft()};
    forkKey=t.toFixed(3);s=forks.get(forkKey)??M.watchAt(t).state;forked=true;colon=false;resetAnswer();
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
 if(forked){saveFork();restorePractice();}
 else{s=M.start();colon=false;resetAnswer();}
 taskMode();render(s,false);stage.focus({preventScroll:true});
};
$("edit-form").onsubmit=e=>{
 e.preventDefault();
 const msg=$("edit-error");
 try{
  target=M.parse(Object.fromEntries(new FormData(e.currentTarget)));linkError="";s=M.start();colon=false;resetAnswer();
  targetDraw();render(s,false);msg.hidden=true;$("edit").open=false;stage.focus({preventScroll:true});
 }catch(error){msg.textContent=error.message;msg.hidden=false;}
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
 if(e.key===":"){colon=true;e.preventDefault();return;}
 const map={M:"menu",Escape:"esc",Enter:"enter",ArrowDown:"down",ArrowUp:"up",ArrowLeft:"left",ArrowRight:"right",Backspace:"del",Delete:"del","-":"neg","×":"mul","*":"mul","^":"power",".":"dot",")":"rparen","=":colon?"assign":""};
 let key=e.shiftKey&&e.key.toLowerCase()==="m"?"menu":map[e.key]||(/^[abmst0-9]$/i.test(e.key)?e.key.toLowerCase():"");
 colon=false;
 if(e.key==="Tab"&&["dims","cells"].includes(s.page)){
  if(s.page==="dims"&&(e.shiftKey&&s.field===0||!e.shiftKey&&s.field===3)||s.page==="cells"&&(e.shiftKey&&s.cell===0||!e.shiftKey&&s.cell===s.cells.length))return;
  key=e.shiftKey?"backtab":"tab";
 }
 if(key){e.preventDefault();if(e.target===document.body)stage.focus({preventScroll:true});physical(key);}
});
stage.dataset.mode="watch";draw();labelPlay();if(params.get("mode")==="try"||request.linked)change("try",false,true);
requestAnimationFrame(ensureFit);
})();
