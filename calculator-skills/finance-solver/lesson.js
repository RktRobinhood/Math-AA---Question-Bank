(function(){"use strict";
const M=window.CT05,$=id=>document.getElementById(id),stage=$("stage"),seek=$("seek"),screen=$("screen");
const params=new URLSearchParams(location.search),request=M.request(params);
const {cues,duration}=M;
seek.max=duration;
let mode="watch",t=0,origin=0,playing=false,started=false,focus=false,frame=0,stamp="",s=M.start(),forked=false,light=0,savedPractice=null;
const shell=HandheldShell.mount({host:$("handheld-host"),screen:$("lcd"),interactive:false,label:"TI-Nspire CX II-T Calculator",onKey:k=>{physical(k);stage.focus({preventScroll:true});}});
const tt=t=>"0:"+String(Math.floor(t)).padStart(2,"0");
const pretty=v=>String(v).replace(/-/g,"−");
const num=(n,opt={})=>new Intl.NumberFormat("en-GB",{maximumFractionDigits:6,...opt}).format(n);
const currency=n=>num(n,{minimumFractionDigits:2,maximumFractionDigits:2});
const elt=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
function label(text,action,active,watch,cls){
 const b=elt("button",text,cls);b.type="button";
 if(active)b.classList.add("calc-active");
 if(watch)b.disabled=true;else if(action)b.addEventListener("click",action);
 return b;
}
function solver(snapshot,watch){
 const dialog=elt("section",undefined,"solver");dialog.setAttribute("aria-label","Finance Solver");
 dialog.append(elt("strong","Finance Solver","solver-title"));
 const fields=elt("div",undefined,"solver-fields");
 M.fieldNames.forEach((name,i)=>{
  const row=elt("div",undefined,"solver-row");row.classList.toggle("wide",i===4&&!!snapshot.result);row.dataset.field=name;
  const value=i===4&&snapshot.result;
  let formatted=pretty(snapshot.values[i]);
  if(value)formatted=pretty(Number(value.value.toPrecision(9)).toString());
  row.append(elt("span",name+":"));
  const field=label(formatted||" ",()=>{s=M.chooseField(s,i);render(s,false);stage.focus({preventScroll:true});},i===snapshot.field,watch,"field-value");
  field.setAttribute("aria-label",name+": "+(value?pretty(value.value):snapshot.values[i]||"empty"));
  if(value){
   const short=pretty(value.value.toPrecision(6)).replace(/e\+/,"E").replace(/e-/,"E−");
   field.dataset.result=String(value.value);field.dataset.compact=short;field.dataset.label=formatted;
  }
  row.append(field);fields.append(row);
 });
 dialog.append(fields);
 const foot=elt("div",snapshot.result?"Finance Solver info stored":(snapshot.field===4?"Press ENTER to calculate":"↳ "+M.help[snapshot.field]),"solver-help");
 dialog.append(foot);
 return dialog;
}
function menu(snapshot,watch){
 const isMain=snapshot.page==="menu",block=elt("div",undefined,"lcd-modal");
 const entries=isMain?M.menu0:M.menu1,title=isMain?"Calculator menu":"Finance";
 block.setAttribute("aria-label",title);block.append(elt("strong",title,"menu-title"));
 entries.forEach(([id,name],i)=>block.append(label(id+": "+name+(id===8?" ▸":""),()=>{physical(String(id));stage.focus({preventScroll:true});},snapshot.menuIndex===i,watch,"menu-item"+(id===8?" wanted":""))));
 return block;
}
function render(snapshot,watch){
 stage.dataset.lcd=snapshot.page;screen.replaceChildren();
 if(snapshot.page==="solver")screen.append(solver(snapshot,watch));
 else{
  const line=elt("div",undefined,"calc-input");line.append(elt("i",undefined,"cursor"));screen.append(line);
  if(["menu","finance"].includes(snapshot.page))screen.append(menu(snapshot,watch));
 }
 if(snapshot.error)screen.append(elt("div",snapshot.error.split(". ")[0].replace(/\.$/,""),"lcd-error"));
 if(!watch){
  const hints={
   calc:"Open Menu, then choose Finance → Finance Solver.",
   menu:"Choose 8: Finance.",finance:"Choose 1: Finance Solver.",
   solver:"Set the known fields, then highlight FV and press Enter."
  };
  $("hint").textContent=hints[snapshot.page];
  const error=snapshot.error||request.error;$("error").textContent=error;$("error").hidden=!error;
  const p=$("progress");let feedback="";
  if(snapshot.result){
   if(forked)feedback="FV from these entries: "+currency(snapshot.result.value)+" (to two decimal places).";
   else if(M.match(snapshot.result,request.target))feedback="Correct setup. The balance is "+currency(snapshot.result.value)+" to two decimal places.";
   else if(snapshot.result.PV>0)feedback="A deposit leaves you now. Use a negative PV to find the positive amount you receive later.";
   else feedback="The solver used your inputs. Check the deposit, annual rate, compounding frequency and time in the task.";
  }
  p.textContent=feedback;p.hidden=!feedback;
 }
}
function physical(key){
 if(mode!=="try")return;
 clearTimeout(light);shell.setKeys([key==="backtab"?"tab":key]);
 light=setTimeout(()=>shell.setKeys([]),175);
 s=M.choose(s,key);render(s,false);
}
cues.forEach(([,title],i)=>{const row=elt("li");row.append(label(String(i+1).padStart(2,"0")+"  "+title,()=>go(cues[i][0]),false,false));$("chapters").append(row);});
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
function fitTry(){
 if(mode!=="try"||innerWidth>700||innerHeight>700)return;
 const available=innerHeight-$("handheld-host").getBoundingClientRect().top-4;
 stage.style.setProperty("--try-fit", Math.max(158,Math.min(240,Math.floor(available*.4777)))+"px");
}
window.addEventListener("resize",()=>{fitFocused();fitTry();});
function setFocus(next){
 focus=next;stage.classList.toggle("focused",focus);document.body.classList.toggle("has-focus",focus);
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
 const d=request.target, names={1:"annually",2:"semiannually",4:"quarterly",12:"monthly",365:"daily"};
 const freq=names[d.frequency]||d.frequency+" times a year";
 const y=d.years===1?"1 year":num(d.years)+" years";
 $("task").textContent=forked?"This is a copy of the Watch frame. Continue here, or return to the separate practice.":"Deposit "+num(d.deposit)+" for "+y+" at "+num(d.rate)+"% nominal, compounded "+freq+". No later payments. Find FV.";
 $("reset").textContent=forked?"Practice task":"Reset";fitTry();
}
function restorePractice(){if(forked){s=savedPractice;savedPractice=null;forked=false;}}
function change(to,takeover=false,fromTab=false){
 if(to===mode)return;
 if(mode==="watch"){
  pause();
  if(focus)setFocus(false);
  if(to==="try"){
   if(takeover&&t<duration-.012){
    if(!forked)savedPractice=s;
    s=M.watchAt(t).state;forked=true;
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
 else s=M.start();
 taskMode();render(s,false);stage.focus({preventScroll:true});
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
 const map={m:"menu",M:"menu",Escape:"esc",Enter:"enter",ArrowDown:"down",ArrowUp:"up",ArrowLeft:"left",ArrowRight:"right",Backspace:"del",Delete:"del",b:"b",e:"e","-":"neg",".":"dot"};
 let key=map[e.key]||(/^\d$/.test(e.key)?e.key:"");
 if(e.key==="Tab"&&s.page==="solver")key=e.shiftKey?"backtab":"tab";
 if(key){e.preventDefault();if(e.target===document.body)stage.focus({preventScroll:true});physical(key);}
});
stage.dataset.mode="watch";draw();labelPlay();if(params.get("mode")==="try"||request.linked)change("try",false,true);
requestAnimationFrame(ensureFit);
})();
