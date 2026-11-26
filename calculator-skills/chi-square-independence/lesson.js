(function(){"use strict";
const M=window.CT47,$=id=>document.getElementById(id),stage=$("stage"),screen=$("screen");
const params=new URLSearchParams(location.search),request=M.request(params);
let mode="watch",stamp=-1,s=M.prefill(request.counts),light=0,returnToWatch;
const handheld=$("handheld-host");
const shell=CalculatorLessonHandset.mount(handheld,{screen:$("lcd"),label:"TI-Nspire CX II-T Calculator",onKey:k=>{physical(k);stage.focus({preventScroll:true});}});
const fmt=(x,n=6)=>String(Number(x.toPrecision(n)));
const elt=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
function label(text,action,active,watch,cls){
 const b=elt("button",text,cls);b.type="button";
 if(active)b.classList.add("calc-active");
 if(watch)b.disabled=true;else if(action)b.addEventListener("click",action);
 return b;
}
function matrix(rows,{interactive=false,state=null,expect=false}={}){
 const grid=elt("span",undefined,"matrix");grid.style.setProperty("--columns",rows[0].length);grid.dataset.matrix=JSON.stringify(rows);
 rows.forEach((row,i)=>row.forEach((v,j)=>{
  const p=i*row.length+j,active=state?.cell===p,symbol=v===""?" ":expect?fmt(v,5):String(v);
  const cell=interactive?label(symbol,()=>{s=M.chooseCell(s,p);render(s,false);stage.focus({preventScroll:true});},active,false,"matrix-cell"):elt("span",symbol,"matrix-cell"+(active?" calc-active":""));
  if(state){
   cell.setAttribute("aria-label","Count, row "+(i+1)+", column "+(j+1)+": "+(v||"empty"));
   cell.classList.toggle("placeholder",v==="");cell.dataset.cell=p;
  }
  grid.append(cell);
 }));
 return grid;
}
function controls(snapshot,watch){
 const modal=elt("div",undefined,"lcd-modal"),menu=M.menus[snapshot.page],dynamic=snapshot.page==="wizard";
 if(menu){
  const title=M.pageNames[snapshot.page];modal.setAttribute("aria-label",title);modal.append(elt("strong",title,"menu-title"));
  menu.forEach(([id,name],i)=>{
   const focus=M.targets[snapshot.page].includes(id);
   const arrow=focus&&["menu","matrix","stats"].includes(snapshot.page)?" ▸":"";
   modal.append(label(id+": "+name+arrow,()=>{physical(String(id));stage.focus({preventScroll:true});},snapshot.menuIndex===i,watch,"menu-item"+(focus?" wanted":"")));
  });
  return modal;
 }
 const title=dynamic?"χ² 2-way Test":"Create a Matrix";
 modal.setAttribute("aria-label",title);modal.append(elt("strong",title,"menu-title"));
 const inputs=elt("div",undefined,"lcd-grid"),buttons=elt("div",undefined,"lcd-actions");
 const vals=dynamic?[["Observed Matrix",snapshot.name]]:[["Number of rows",snapshot.dim[0]],["Number of columns",snapshot.dim[1]]];
 vals.forEach(([name,v],i)=>{
  const input=label(v||" ",()=>{s=M.chooseField(s,i);render(s,false);stage.focus({preventScroll:true});},snapshot.field===i,watch,"field-value");
  input.setAttribute("aria-label",name+": "+(v||"empty"));inputs.append(elt("span",name+":"),input);
 });
 [["OK",vals.length],["Cancel",vals.length+1]].forEach(([name,i])=>buttons.append(label(name,()=>{s=M.chooseField(s,i);physical("enter");stage.focus({preventScroll:true});},snapshot.field===i,watch)));
 modal.append(inputs,buttons);return modal;
}
function readout(snapshot){
 const result=snapshot.result;if(!result)return null;
 const card=elt("section",undefined,"stat-card");
 if(snapshot.page==="expected"){
  card.dataset.view="expected";card.append(elt("strong","stat.ExpMat","stat-title"),matrix(result.expected,{expect:true}));return card;
 }
 card.dataset.view="result";card.append(elt("strong","χ² 2-way Test","stat-title"));
 for(const [name,v,test] of [["χ²",fmt(result.stat),"stat"],["PVal",M.pText(result),"pval"],["df",String(result.df),"df"],["ExpMatrix","[…]",""],["CompMatrix","[…]",""]]){
  const row=elt("div",undefined,"stat-row"),value=elt("b",v);
  if(test){value.dataset.result=test;value.dataset.exact=String(test==="pval"?result.p:test==="stat"?result.stat:result.df);}
  row.append(elt("span",name),value);card.append(row);
 }
 return card;
}
function render(snapshot,watch){
 handheld.dataset.lcd=stage.dataset.lcd=snapshot.page;screen.replaceChildren();
 const input=elt("div",undefined,"calc-input");
 if(snapshot.page==="cells"){
  const C=Number(snapshot.dim[1]),rows=Array.from({length:Number(snapshot.dim[0])},(_,i)=>snapshot.cells.slice(i*C,(i+1)*C));
  if(snapshot.assign)input.append(elt("span","a :=","entry-prefix"));
  input.append(matrix(rows,{state:snapshot,interactive:!watch}));
 }else{
  if(["result","expected"].includes(snapshot.page))screen.append(readout(snapshot));
  else if(snapshot.stored){
   const a=elt("div",undefined,"stored-row");a.append(elt("span","a :="),matrix(snapshot.stored));screen.append(a);
  }
  if(snapshot.assign)input.append(elt("span","a :=","entry-prefix"));
  else if(snapshot.command)input.append(elt("span",snapshot.command));
  input.append(elt("i",undefined,"cursor"));
  if(snapshot.ctrl)input.append(elt("small","ctrl","ctrl-on"));
 }
 screen.append(input);
 if(M.menus[snapshot.page]||["dims","wizard"].includes(snapshot.page))screen.append(controls(snapshot,watch));
 if(snapshot.error)screen.append(elt("div",snapshot.error.split(". ")[0],"lcd-error"));
 if(!watch){
  const hints={calc:snapshot.stored?"Open Menu → Statistics → Stat Tests → χ² 2-way Test.":"Type a and Ctrl + template, then use Matrix & Vector → Create → Matrix.",matrix:"Open Create.",create:"Choose Matrix.",dims:"Fill rows and columns; use 2×3, 3×2, or 3×3.",cells:"Tap a cell to select it; entering digits replaces its count. Press Enter to store a.",menu:"Choose Statistics to test the stored matrix.",stats:"Choose Stat Tests.",tests:"Choose χ² 2-way Test, not χ² GOF.",wizard:"Type a as Observed Matrix; Tab to OK and press Enter.",result:"Read PVal and df. Use stat.expmat on the next line to check the approximation conditions.",expected:"Expected counts are modelled under independence, not entered observations."};
  $("hint").textContent=hints[snapshot.page]||"";
  const error=snapshot.error||request.error;$("error").textContent=error;$("error").hidden=!error;
  const p=$("progress"),r=snapshot.result,showResult=["result","expected"].includes(snapshot.page)&&r;
  const alpha=request.alpha;
  let message="";
  if(showResult){
   if(r.small)message="At least one expected count is 5 or less. Do not draw an IB-style chi-square conclusion from this p-value.";
   else {
    const reject=r.logP<=Math.log(alpha),context=!request.generic?"between commute mode and arrival status":"between the row and column variables";
    message="At "+Math.round(alpha*100)+"%: "+(reject?"reject H₀. There is evidence of association "+context+".":"do not reject H₀. There is insufficient evidence of association "+context+".");
   }
  }
  p.textContent=message;p.hidden=!message;p.classList.toggle("bad",Boolean(showResult&&r.small));
 }
}
function physical(key){
 if(mode!=="try")return;
 clearTimeout(light);
 shell.setKeys(s.ctrl&&key==="templates"?["ctrl","templates"]:[key==="backtab"?"tab":key==="assign"?"templates":key]);
 light=setTimeout(()=>shell.setKeys([]),175);
 s=M.press(s,key);render(s,false);
}
const frames=[M.start()];
for(const [,key] of M.tape)frames.push(M.press(frames.at(-1),key));
function renderWatch(device,{beat,point,crossed,key}){
 if(handheld.parentElement!==device)device.append(handheld);
 const count=crossed.length,k=M.tape[count-1]?.[1],hold=point.span.end-point.span.voiceEnd;
 const lit=k&&!point.speaking&&key?.beat===beat&&(point.fraction-key.at)*hold<.65;
 shell.setKeys(lit?k==="templates"?["ctrl",k]:[k]:[]);
 if(stamp!==count){stamp=count;render(frames[count],true);}
}
function fitTry(){
 if(mode!=="try"||innerWidth>700||innerHeight>700)return;
 const available=innerHeight-(handheld.getBoundingClientRect().top+window.scrollY)-4;
 stage.style.setProperty("--try-fit",Math.max(158,Math.min(240,Math.floor(available*.4777)))+"px");
}
window.addEventListener("resize",fitTry);
function taskMode(){
 const alpha=String(Math.round(request.alpha*100))+"%";
 $("task").textContent=request.generic?"Use these independent observations to test for a row–column association at "+alpha+".":"Rows: Walk, Cycle, Bus. Columns: On time, Late. Test for association in this separate sample at "+alpha+".";
 fitTry();
}
function enterTry(device,actions){
 mode="try";returnToWatch=actions.returnToWatch;document.body.classList.add("in-try");
 device.prepend(stage);$("try-deck").prepend(handheld);stage.hidden=false;
 $("watch-table").hidden=true;
 clearTimeout(light);shell.setKeys([]);shell.setInteractive(true);taskMode();render(s,false);
}
function exitTry(){
 mode="watch";stage.hidden=true;stamp=-1;document.body.classList.remove("in-try");
 $("watch-table").hidden=false;
 clearTimeout(light);shell.setKeys([]);shell.setInteractive(false);
}
$("return").onclick=()=>returnToWatch?.();
$("reset").onclick=()=>{
 s=M.prefill(request.counts);
 taskMode();render(s,false);stage.focus({preventScroll:true});
};
let colon=false;
document.addEventListener("keydown",e=>{
 if(mode!=="try"||e.defaultPrevented||e.target.closest?.(".top, .tabbar"))return;
 if(e.altKey||e.ctrlKey||e.metaKey||e.isComposing||e.target.closest("input,select,a,summary,textarea,[contenteditable]"))return;
 const b=e.target.closest("button");
 if((!stage.contains(e.target)&&e.target!==document.body)||(b&&["Enter"," ","Tab"].includes(e.key)))return;
 if(e.key===":"){colon=true;e.preventDefault();return;}
 const map={F2:"menu",Escape:"esc",Enter:"enter",ArrowDown:"down",ArrowUp:"up",ArrowLeft:"left",ArrowRight:"right",Backspace:"del",Delete:"del",".":"dot","=":colon?"assign":""};
 let key=map[e.key]||(/^[astepmmx0-9]$/i.test(e.key)?e.key.toLowerCase():"");
 colon=false;if(key==="m"&&!s.command)key="menu";
 if(e.key==="Tab"&&["dims","wizard","cells"].includes(s.page))key=e.shiftKey?"backtab":"tab";
 if(key){e.preventDefault();if(e.target===document.body)stage.focus({preventScroll:true});physical(key);}
});
window.CalculatorLessonAdapter=Object.freeze({
 initialMode:params.get("mode")==="try"||request.linked?"try":"watch",
 renderWatch,enterTry,exitTry
});
})();
