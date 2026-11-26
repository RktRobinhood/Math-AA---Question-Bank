(function(){"use strict";
const M=window.CT29,$=id=>document.getElementById(id),stage=$("stage"),screen=$("screen");
const params=new URLSearchParams(location.search),request=M.request(params),target=request.data;
const keys=["menu", "4", "1", "1", "1", "tab", "enter", "right", "enter", "tab", "tab", "tab", "tab", "tab", "enter", "menu", "4", "1", "1", "1", "tab", "enter", "tab", "right", "down", "down", "enter", "tab", "tab", "tab", "tab", "enter"];
const frames=[M.create(M.demo)];
for(const k of keys)frames.push(M.press(frames.at(-1),k));
let mode="watch",stamp="",s=M.create(target),light=0,returnToWatch;
const handheld=$("handheld-host");
const shell=CalculatorLessonHandset.mount(handheld,{screen:$("lcd"),interactive:false,label:"TI-Nspire CX II-T Lists and Spreadsheet",onKey:physical});
const fmt=n=>n===null?"undef":String(Number(n.toPrecision(6))).replace("-","−");
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
  const hints={sheet:"Open Menu to start. Select a cell to edit the spreadsheet, or Reset to restore the task.",menu:"Choose Statistics, then Stat Calculations and One-Variable Statistics.",count:"Use one list, then confirm.",wizard:"Choose values as X1 List. Use "+(target.freq?"freq for the row counts":"1 to use each raw row once")+". Keep the results in separate columns, then confirm.",result:"Read x̄ and σx for this complete collection. Use exact values where possible; round non-exact answers to three significant figures."};
  $("hint").textContent=hints[state];
  $("error").textContent=snapshot.error||request.error;$("error").hidden=!$("error").textContent;
 }
}
function show(id,text,bad=false){const el=$(id);el.textContent=text;el.hidden=!text;el.classList.toggle("bad",bad);}
function transfer(state){
 s=state;render(s,false);show("feedback","");
}
function physical(key){
 if(mode!=="try")return;
 clearTimeout(light);shell.setKeys([key]);light=setTimeout(()=>shell.setKeys([]),155);
 transfer(M.press(s,key));
}
function renderWatch(device,{beat,point,crossed,key}){
 if(handheld.parentElement!==device)device.append(handheld);
 const count=crossed.length,pressed=keys[count-1];
 const lit=pressed&&!point.speaking&&key?.beat===beat&&(point.fraction-key.at)*(point.span.end-point.span.voiceEnd)<.65;
 shell.setKeys(lit?[pressed]:[]);
 const next=beat+":"+count;if(stamp===next)return;stamp=next;
 render(frames[count],true);
}
function task(){
 const d=target;$("task").textContent="Find the mean and population standard deviation for this complete collection. "+(d.freq?"Use the values and their paired frequencies.":"Use each listed value once.");
}
function enterTry(device,actions){
 mode="try";returnToWatch=actions.returnToWatch;
 device.prepend(stage);$("try-grid").prepend(handheld);stage.hidden=false;
 clearTimeout(light);shell.setKeys([]);shell.setInteractive(true);task();render(s,false);stage.focus({preventScroll:true});
}
function exitTry(){
 mode="watch";stage.hidden=true;stamp="";
 clearTimeout(light);shell.setKeys([]);shell.setInteractive(false);
}
$("return").onclick=()=>returnToWatch?.();
$("reset").onclick=()=>{transfer(M.create(target));$("answer").reset();stage.focus({preventScroll:true});};
$("answer").onsubmit=e=>{e.preventDefault();const miss=M.grade({mean:$("mean").valueAsNumber,sd:$("sd").valueAsNumber},s.result?s:null,target,$("kind").value);
 show("feedback",miss||"Correct: you read the mean and the population standard deviation.",Boolean(miss));
};
$("answer").addEventListener("input",()=>{show("feedback","")});
document.addEventListener("keydown",e=>{
 if(e.defaultPrevented||e.target.closest?.(".top, .tabbar"))return;
 if(e.altKey||e.ctrlKey||e.metaKey||e.isComposing||e.target.closest("input,select,a,summary,textarea,[contenteditable]"))return;
 const b=e.target.closest("button");
 if(mode!=="try")return;
 if((!stage.contains(e.target)&&e.target!==document.body)||(b&&["Enter"," ","Tab"].includes(e.key)))return;
 const map={m:"menu",M:"menu",Escape:"esc",Enter:"enter",ArrowDown:"down",ArrowUp:"up",ArrowLeft:"left",ArrowRight:"right",Backspace:"del",Delete:"del",".":"dot","-":"neg",v:"v",f:"f"};
 let key=map[e.key]||(/^[0-9]$/.test(e.key)?e.key:"");
 if(e.key==="Tab"&&(s.page==="wizard"||s.page==="count")&&s.drop===null){
  if(e.shiftKey&&s.field===0||!e.shiftKey&&s.field===(s.page==="count"?2:6))return;
  key=e.shiftKey&&s.page==="wizard"?"backtab":"tab";
 }
 if(key){e.preventDefault();if(e.target===document.body)stage.focus({preventScroll:true});physical(key);}
});
window.CalculatorLessonAdapter=Object.freeze({initialMode:params.get("mode")==="try"||request.linked?"try":"watch",renderWatch,enterTry,exitTry});
})();
