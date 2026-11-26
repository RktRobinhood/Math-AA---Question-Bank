(function(){"use strict";
const M=window.CT29,$=id=>document.getElementById(id),stage=$("stage"),seek=$("seek"),screen=$("screen");
const params=new URLSearchParams(location.search),request=M.request(params),target=request.data;
const starts=[0,4,10.5,16,20,27,34.3],duration=39.5;
const chapters=[
 ["Read a named list","Column A is named values. For the first run, use each row once."],
 ["Open One-Variable Statistics","Menu → 4: Statistics → 1: Stat Calculations → 1: One-Variable Statistics. Confirm one list."],
 ["Set X1 List and Frequency List","Choose values as X1 List. Leave Frequency List at 1. Send the results to c[]."],
 ["Read x̄, sx and σx","Read the result names in C and values in D. Use σx for the whole collection, or sx for sample SD."],
 ["Open a frequency run","Run the same menu. Keep values for X1 List; choose freq instead of 1 for Frequency List."],
 ["Calculate with frequency","Confirm and read the new mean and σx. Now n is the sum of frequencies, not the number of rows."],
 ["Transfer to a new example","Check that n counts observations, not rows. Open Try for a different collection."]
];
const keys=[
 [4.25,"menu"],[4.95,"4"],[5.65,"1"],[6.55,"1"],[8,"1"],[8.68,"tab"],[9.44,"enter"],
 [10.85,"right"],[11.56,"enter"],[12.18,"tab"],[12.76,"tab"],[13.11,"tab"],[13.48,"tab"],[13.96,"tab"],[15.45,"enter"],
 [20.45,"menu"],[21.08,"4"],[21.63,"1"],[22.24,"1"],[22.94,"1"],[23.3,"tab"],[23.76,"enter"],
 [24.1,"tab"],[24.56,"right"],[24.99,"down"],[25.42,"down"],[25.96,"enter"],
 [27.3,"tab"],[27.66,"tab"],[28.05,"tab"],[28.5,"tab"],[29.1,"enter"]
];
seek.max=duration;
let mode="watch",t=0,origin=0,playing=false,started=false,focus=false,frame=0,stamp="",s=M.create(target),edited=false,forked=false,light=0;
const shell=HandheldShell.mount({host:$("handheld-host"),screen:$("lcd"),interactive:false,label:"TI-Nspire CX II-T Lists and Spreadsheet",onKey:k=>physical(k)});
const fmt=n=>n===null?"undef":String(Number(n.toPrecision(6))).replace("-","−");
const tt=t=>"0:"+String(Math.floor(t)).padStart(2,"0");
const elt=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
function label(text,action,active,watch,cls){
 const b=elt("button",text,cls);b.type="button";
 if(active)b.classList.add("calc-active");
 if(watch)b.disabled=true;else if(action)b.addEventListener("click",action);
 return b;
}
function plate(headers,names){
 const table=elt("table",undefined,"sheet"),thead=table.createTHead();
 [headers,names].forEach((r,i)=>{const row=thead.insertRow();r.forEach(x=>row.append(elt("th",x)));});
 return table;
}
function dataSheet(snapshot,watch){
 const table=plate(["","A","B"],["","values","freq"]),body=table.createTBody();
 for(let i=0;i<M.rows;i++){
  const row=body.insertRow();row.append(elt("th",String(i+1)));
  ["values","freq"].forEach((k,j)=>{
   const selected=snapshot.page==="sheet"&&snapshot.row===i&&snapshot.col===j,raw=(selected&&snapshot.edit!==null?snapshot.edit:snapshot.data[k][i])??"";
   const td=elt("td",raw||" ",selected?"calc-active":"");
   if(!watch&&snapshot.page==="sheet"){
    td.setAttribute("data-cell",i+":"+j);td.setAttribute("title",k+", row "+(i+1));
    td.addEventListener("click",()=>{
     const kept=s.edit===null?s:M.press(s,"enter");
     if(kept.error){s=kept;render(s,false);return;}
     transfer({...kept,row:i,col:j});stage.focus({preventScroll:true});
    });
   }
   row.append(td);
  });
 }
 return table;
}
function resultSheet(snapshot,watch){
 const out=snapshot.lastRun.out==="d[]"?"D":"C", table=plate(["",out,out==="C"?"D":"E"],["","stat.results"," "]),body=table.createTBody();
 table.classList.add("result");
 const r=snapshot.result,items=[["x̄",r.mean],["Σx",r.sum],["Σx²",r.squares],["sx",r.sample],["σx",r.sd],["n",r.n],["MinX",r.min],["Q1X",r.q1],["MedianX",r.median],["Q3X",r.q3],["MaxX",r.max],["SSX",r.ss]];
 for(let i=snapshot.offset;i<Math.min(items.length,snapshot.offset+6);i++){
  const row=body.insertRow(),[name,v]=items[i];
  if([0,3,4,5].includes(i))row.className="key-result";
  row.append(elt("th",String(i+1)),elt("td",name),elt("td",fmt(v)));
 }
 if(!watch)table.addEventListener("wheel",e=>{e.preventDefault();physical(e.deltaY>0?"down":"up")},{passive:false});
 return table;
}
function controls(snapshot,watch){
 const modal=elt("div",undefined,"lcd-modal");
 if(snapshot.page==="menu"){
  modal.setAttribute("aria-label",["Lists & Spreadsheet Menu","Statistics menu","Stat Calculations menu"][snapshot.menu]);
  M.menu[snapshot.menu].forEach((v,i)=>modal.append(label(v,()=>physical(v[0]),i===snapshot.field,watch,"menu-item")));
  return modal;
 }
 modal.append(elt("strong",snapshot.page==="count"?"One-Variable Statistics":"One-Variable Statistics"));
 const grid=elt("div",undefined,"lcd-grid"),actions=elt("div",undefined,"lcd-actions");
 const click=(i,k)=>()=>{s={...s,field:i};physical(k);stage.focus({preventScroll:true});};
 if(snapshot.page==="count"){
  grid.append(elt("span","Num of Lists"),label(snapshot.count,click(0,"1"),snapshot.field===0,watch));
  actions.append(label("OK",click(1,"enter"),snapshot.field===1,watch),label("Cancel",click(2,"enter"),snapshot.field===2,watch));
 }else{
  const vals=[snapshot.x,snapshot.freq," "," ",snapshot.out];
  for(let i=0;i<5;i++){
   const can=i===0||i===1||i===4,b=label(vals[i]+(can?" ▾":""),can?click(i,"right"):null,snapshot.field===i,watch||!can);
   b.setAttribute("aria-label",M.fields[i]+": "+vals[i]);grid.append(elt("span",M.fields[i]),b);
  }
  actions.append(label("OK",click(5,"enter"),snapshot.field===5,watch),label("Cancel",click(6,"enter"),snapshot.field===6,watch));
  if(snapshot.drop!==null){
   const opt=elt("div",undefined,"lcd-choices choice-"+snapshot.field),opts=M.choices(snapshot);
   opts.forEach((v,i)=>opt.append(label(v,()=>{s={...s,drop:i};physical("enter");stage.focus({preventScroll:true})},i===snapshot.drop,watch)));
   modal.append(opt);
  }
 }
 modal.append(grid,actions);
 return modal;
}
function render(snapshot,watch){
 stage.dataset.lcd=snapshot.page;screen.replaceChildren(snapshot.page==="result"?resultSheet(snapshot,watch):dataSheet(snapshot,watch));
 if(["menu","count","wizard"].includes(snapshot.page))screen.append(controls(snapshot,watch));
 if(!watch){
  const state=snapshot.page;
  const hints={sheet:"Open Menu to start. Select a cell to edit the spreadsheet, or Reset to restore the task.",menu:"Choose Statistics, then Stat Calculations and One-Variable Statistics.",count:"Use one list, then confirm.",wizard:"Choose values as X1 List. Use "+(target.freq?"freq for the row counts":"1 to use each raw row once")+". Keep the results in separate columns, then confirm.",result:"Read x̄ and σx for this complete collection. Give the answers to at least three significant figures."};
  $("hint").textContent=hints[state];
  $("error").textContent=snapshot.error||request.error;$("error").hidden=!$("error").textContent;
 }
}
function show(id,text,bad=false){const el=$(id);el.textContent=text;el.hidden=!text;el.classList.toggle("bad",bad);}
function transfer(state){
 s=state;edited=true;render(s,false);show("feedback","");
}
function physical(key){
 if(mode!=="try")return;
 clearTimeout(light);shell.setKeys([key]);light=setTimeout(()=>shell.setKeys([]),155);
 transfer(M.press(s,key));
}
function snapshot(at){
 let base=M.create(M.demo),key="";
 for(const [ms,k] of keys){if(ms>at)break;base=M.press(base,k);key=at<ms+.24?k:"";}
 return {base,key};
}
chapters.forEach(([title],i)=>{const row=elt("li");row.append(label(String(i+1).padStart(2,"0")+"  "+title,()=>go(starts[i]),false,false));$("chapters").append(row);});
function draw(){
 if(mode!=="watch")return;
 const {base,key}=snapshot(t),part=starts.findLastIndex(x=>x<=t), sig=JSON.stringify(base)+"|"+part;
 seek.value=t;seek.setAttribute("aria-valuetext",tt(t)+" of "+tt(duration));$("clock").textContent=tt(t)+" / "+tt(duration);
 shell.setKeys(key?[key]:[]);$("stage-play").hidden=started||t>0;
 if(sig!==stamp){stamp=sig;render(base,true);$("caption").textContent=chapters[part][1];fitFocused();
  [...$("chapters").children].forEach((it,i)=>it.firstElementChild.setAttribute("aria-current",String(i===part)));
 }
}
const bounded=at=>Math.min(duration,Math.max(0,Number(at)||0));
function labelPlay(){const name=playing?"Pause":t>=duration-.012?"Replay":"Play";$("play").textContent=name;$("play").setAttribute("aria-label",name);}
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
 $("focus").setAttribute("aria-pressed",String(focus));$("focus").setAttribute("aria-label",focus?"Exit Focus":"Focus"); $("focus").textContent=focus?"Exit":"⛶";if(focus){fitFocused();stage.scrollTop=0;}
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
function task(){
 const d=target;$("task").textContent="Find the mean and population standard deviation for this complete collection. "+(d.freq?"Use the values and their paired frequencies.":"Use each listed value once.");
}
function change(to,takeover=false,fromTab=false){
 if(to===mode)return;
 if(mode==="watch"){pause();if(focus)setFocus(false);if(takeover&&!edited&&!request.linked&&!forked){s=snapshot(t).base;forked=true;}}
 mode=to;stage.dataset.mode=mode;
 const watch=to==="watch",tabs=[$("watch-tab"),$("try-tab")];
 tabs.forEach((b,i)=>{const yes=(i===0)===watch;b.setAttribute("aria-selected",String(yes));b.tabIndex=yes?0:-1;});
 for(const id of ["watch","watch-message","watch-player"])$(id).hidden=!watch;
 for(const id of ["try","try-message"])$(id).hidden=watch;
 shell.setInteractive(!watch);shell.setKeys([]);clearTimeout(light);
 if(watch){stamp="";draw();requestAnimationFrame(ensureFit);if(!fromTab)$("play").focus({preventScroll:true});}
 else{ $("stage-play").hidden=true;task();render(s,false);if(!fromTab)stage.focus({preventScroll:true});}
}
[$("watch-tab"),$("try-tab")].forEach((b,i)=>{b.onclick=()=>change(i?"try":"watch",false,false);b.onkeydown=e=>{
 if(!["ArrowLeft","ArrowRight","Home","End"].includes(e.key))return;
 e.preventDefault();const target=e.key==="Home"?"watch":e.key==="End"?"try":i?"watch":"try";change(target,false,true);$(target+"-tab").focus();
};});
$("takeover").onclick=()=>change("try",true);$("return").onclick=()=>change("watch");
$("reset").onclick=()=>{transfer(M.create(target));forked=false;$("answer").reset();stage.focus({preventScroll:true});};
$("answer").onsubmit=e=>{e.preventDefault();edited=true;const miss=M.grade({mean:$("mean").valueAsNumber,sd:$("sd").valueAsNumber},s.result?s:null,target,$("kind").value);
 show("feedback",miss||"Correct: you read the mean and the population standard deviation.",Boolean(miss));
};
$("answer").addEventListener("input",()=>{edited=true;show("feedback","")});
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
 const map={m:"menu",M:"menu",Escape:"esc",Enter:"enter",ArrowDown:"down",ArrowUp:"up",ArrowLeft:"left",ArrowRight:"right",Backspace:"del",Delete:"del",".":"dot","-":"neg",v:"v",f:"f"};
 let key=map[e.key]||(/^[0-9]$/.test(e.key)?e.key:"");
 if(e.key==="Tab"&&(s.page==="wizard"||s.page==="count")&&s.drop===null){
  if(e.shiftKey&&s.field===0||!e.shiftKey&&s.field===(s.page==="count"?2:6))return;
  key=e.shiftKey&&s.page==="wizard"?"backtab":"tab";
 }
 if(key){e.preventDefault();if(e.target===document.body)stage.focus({preventScroll:true});physical(key);}
});
stage.dataset.mode="watch";draw();labelPlay();if(params.get("mode")==="try"||request.linked)change("try",false,true);
requestAnimationFrame(ensureFit);
window.QBRecordedWatch?.bind(pause);
})();
