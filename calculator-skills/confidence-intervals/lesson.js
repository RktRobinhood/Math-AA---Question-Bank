(function(){"use strict";
const M=window.CT49,$=id=>document.getElementById(id),stage=$("stage"),screen=$("screen");
const params=new URLSearchParams(location.search),request=M.request(params);
let mode="watch",stamp=-1,s=M.start(),light=0,returnToWatch;
let target=request.target,linkError=request.error;
const handheld=$("handheld-host");
const shell=CalculatorLessonHandset.mount(handheld,{screen:$("lcd"),label:"TI-Nspire CX II-T Calculator",onKey:k=>{physical(k);stage.focus({preventScroll:true});}});
const pretty=v=>String(v).replace(/-/g,"−");
const elt=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
function label(text,action,active,watch,cls){
 const b=elt("button",text,cls);b.type="button";
 if(active)b.classList.add("calc-active");
 if(watch)b.disabled=true;else if(action)b.addEventListener("click",action);
 return b;
}
let answer=["",""],answerFeedback="";
const displayValue=n=>Number(n.toPrecision(12));
const fmt=n=>pretty(displayValue(n));
function refresh(snapshot,mod){s={...snapshot,...mod};render(s,false);stage.focus({preventScroll:true});}
function options(snapshot,watch,title,values,current,format){
 const modal=elt("div",undefined,"lcd-modal option-sheet");modal.setAttribute("aria-label",title);
 for(const v of values)modal.append(label(format(v),()=>refresh(snapshot,M.choose(snapshot,v)),v===current,watch,"menu-item"));
 return modal;
}
function controls(snapshot,watch){
 const modal=elt("div",undefined,"lcd-modal"),page=snapshot.page;
 if(M.menu[page]){
  const title=M.paths[page];modal.setAttribute("aria-label",title);modal.append(elt("strong",title,"menu-title"));
  M.menu[page].forEach(([id,name],i)=>modal.append(label(id+": "+name+((page==="menu"&&id===6||page==="stats"&&id===6)?" ▸":""),()=>physical(String(id)),i===snapshot.index,watch,"menu-item")));
  return modal;
 }
 const kind=snapshot.kind,title=M.title(kind),table=elt("div",undefined,"lcd-grid"),actions=elt("div",undefined,"lcd-actions");
 modal.setAttribute("aria-label",title);modal.append(elt("strong",title,"menu-title"));
 const method=page==="method",fs=method?["method"]:M.fields(kind);
 fs.forEach((key,i)=>{
  const name=method?"Data Input Method":M.labelFields(kind)[key],v=method?snapshot.method:snapshot.values[key];
  const n=label(pretty(v)+(method?" ▾":"")||" ",()=>refresh(snapshot,{field:i,list:method,error:""}),snapshot.field===i,watch,"dim-value");
  n.setAttribute("aria-label",name+": "+(v||"blank"));n.dataset.field=key;table.append(elt("span",name),n);
 });
 [["OK",fs.length],["Cancel",fs.length+1]].forEach(([name,i])=>actions.append(label(name,()=>{s={...s,field:i,list:false};physical("enter");},snapshot.field===i,watch)));
 modal.append(table,actions);
 if(snapshot.list)modal.append(options(snapshot,watch,"Input methods",["Data","Stats"],snapshot.method,v=>v));
 return modal;
}
function resultCard(r){
 const el=elt("div",undefined,"stat-card");el.append(elt("strong",M.title(r.task.method),"stat-title"));
 for(const [name,val] of [["CLower",r.low],["CUpper",r.high],["ME",r.me],...(r.df===null?[]:[["df",r.df]])]){
  const row=elt("div",undefined,"stat-row"),value=elt("b",fmt(val));value.dataset.stat=name;value.dataset.exact=String(val);
  row.append(elt("span",name),value);el.append(row);
 }
 return el;
}
function render(snapshot,watch){
 handheld.dataset.lcd=stage.dataset.lcd=snapshot.page;screen.replaceChildren();
 if(snapshot.result)screen.append(resultCard(snapshot.result));
 const line=elt("div",undefined,"calc-input");line.append(elt("i",undefined,"cursor"));screen.append(line);
 if(M.menu[snapshot.page]||["method","form"].includes(snapshot.page))screen.append(controls(snapshot,watch));
 if(snapshot.error)screen.append(elt("div",snapshot.error.split(". ")[0],"lcd-error"));
 if(watch)return;
 const labels={calc:"Open Menu → Statistics → Confidence Intervals. Choose based on whether population σ is known.",menu:"Choose Statistics.",stats:"Choose Confidence Intervals.",intervals:"Choose z when population σ is known, otherwise t.",method:"Open the dropdown and choose Stats. Then confirm.",form:"Enter the sample summaries and confidence proportion. Tab to OK, then Enter.",result:"Read CLower and CUpper. ME is the distance from the mean to either endpoint."};
 $("hint").textContent=labels[snapshot.page];
 const e=snapshot.error||linkError||"";$("error").textContent=e;$("error").hidden=!e;
 const current=snapshot.page==="result"?snapshot.result:null,matched=M.matches(current,target);
 $("progress").textContent=current&&!matched?"This interval uses different parameters or the wrong SD type. Compare with the task.":"";
 $("progress").hidden=!$("progress").textContent;
 $("decision").hidden=!matched;
 $("endpoint-low").value=answer[0];$("endpoint-high").value=answer[1];
 $("decision-feedback").textContent=answerFeedback;$("decision-feedback").hidden=!answerFeedback;
}
function physical(key){
 if(mode!=="try")return;
 clearTimeout(light);
 const keys=[key];
 shell.setKeys(keys);light=setTimeout(()=>shell.setKeys([]),175);
 const old=s.result;s=M.press(s,key);if(s.result!==old){answer=["",""];answerFeedback="";}render(s,false);
}
function targetDraw(){
 const v=M.parse(target),sr=v.method==="z"?"σ":"sx";
 $("target-wrap").replaceChildren(...["x̄ = "+pretty(v.mean),sr+" = "+v.sd,"n = "+v.n,"Confidence = "+Number((v.level*100).toFixed(1))+"%"].map(x=>elt("span",x)));
 $("edit-kind").value=v.method;
 for(const k of ["mean","sd","n","level"])$("edit-form").elements[k].value=target[k];
}
targetDraw();
const frames=[M.start(M.worked)];
for(const [,key] of M.tape)frames.push(M.press(frames.at(-1),key));
function renderWatch(device,{beat,point,crossed,key}){
 if(handheld.parentElement!==device)device.append(handheld);
 const count=crossed.length,k=M.tape[count-1]?.[1],hold=point.span.end-point.span.voiceEnd;
 const lit=k&&!point.speaking&&key?.beat===beat&&(point.fraction-key.at)*hold<.65;
 shell.setKeys(lit?[k]:[]);
 if(stamp!==count){stamp=count;render(frames[count],true);}
}
function taskMode(){$("task").textContent=target.method==="z"?"Normal population · σ known":"Normal population · σ unknown";}
function enterTry(device,actions){
 mode="try";returnToWatch=actions.returnToWatch;document.body.classList.add("in-try");
 device.prepend(stage);$("try-deck").prepend(handheld);stage.hidden=false;
 clearTimeout(light);shell.setKeys([]);shell.setInteractive(true);taskMode();render(s,false);stage.focus({preventScroll:true});
}
function exitTry(){
 mode="watch";stage.hidden=true;stamp=-1;document.body.classList.remove("in-try");
 clearTimeout(light);shell.setKeys([]);shell.setInteractive(false);
}
$("return").onclick=()=>returnToWatch?.();
$("reset").onclick=()=>{
 s=M.start();answer=["",""];answerFeedback="";
 taskMode();render(s,false);stage.focus({preventScroll:true});
};
$("edit-form").onsubmit=e=>{
 e.preventDefault();const msg=$("edit-error");
 try{
  const draft=Object.fromEntries(new FormData($("edit-form")));
  M.parse(draft);target=draft;linkError="";s=M.start();answer=["",""];answerFeedback="";
  targetDraw();taskMode();render(s,false);msg.hidden=true;$("edit").open=false;stage.focus({preventScroll:true});
 }catch(error){msg.textContent=error.message;msg.hidden=false;}
};
["low","high"].forEach((k,i)=>$("endpoint-"+k).oninput=()=>{answer[i]=$("endpoint-"+k).value;answerFeedback="";$("decision-feedback").hidden=true;});
$("decision").onsubmit=e=>{
 e.preventDefault();if(!M.matches(s.result,target)||s.page!=="result")return;
 const val=answer.map(w=>{const x=w.trim().replaceAll("−","-");return /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(x)?Number(x):NaN;});
 answerFeedback=val.some(v=>!Number.isFinite(v))?"Enter both numerical endpoints.":val.every((v,i)=>{const expected=[s.result.low,s.result.high][i];return [expected,displayValue(expected)].some(x=>Math.abs(v-Number(x.toFixed(2)))<1e-9);})?"Correct. This interval estimates the population mean.":"Check which value is CLower and which is CUpper, then round each to two decimal places.";
 render(s,false);
};
document.addEventListener("keydown",e=>{
 if(mode!=="try"||e.defaultPrevented||e.target.closest?.(".top, .tabbar"))return;
 if(e.altKey||e.ctrlKey||e.metaKey||e.isComposing||e.target.closest("input,select,a,summary,textarea,[contenteditable]"))return;
 const b=e.target.closest("button");
 if((!stage.contains(e.target)&&e.target!==document.body)||(b&&["Enter"," ","Tab"].includes(e.key)))return;
 const map={m:"menu",M:"menu",Escape:"esc",Enter:"enter",ArrowDown:"down",ArrowUp:"up",ArrowLeft:"left",ArrowRight:"right",Backspace:"del",Delete:"del","-":"neg",".":"dot"};
 let key=map[e.key]||(/^\d$/.test(e.key)?e.key:"");
 if(e.key==="Tab"&&["method","form"].includes(s.page)&&!s.list){
  const n=s.page==="method"?1:M.fields(s.kind).length;
  if(e.shiftKey&&s.field===0||!e.shiftKey&&s.field===n+1)return;
  key=e.shiftKey?"backtab":"tab";
 }
 if(key){e.preventDefault();if(e.target===document.body)stage.focus({preventScroll:true});physical(key);}
});
window.CalculatorLessonAdapter=Object.freeze({
 initialMode:params.get("mode")==="try"||request.linked?"try":"watch",
 renderWatch,enterTry,exitTry
});
})();
