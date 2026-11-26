(function(){"use strict";
const M=window.CT46,$=id=>document.getElementById(id),stage=$("stage"),screen=$("screen");
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
let answer="",answerFeedback="";
const fmt=n=>pretty(Number(n.toPrecision(6)));
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
  M.menu[page].forEach(([id,name],i)=>modal.append(label(id+": "+name+((page==="menu"&&id===6||page==="stats"&&id===7)?" ▸":""),()=>physical(String(id)),i===snapshot.index,watch,"menu-item")));
  return modal;
 }
 const test=snapshot.test,title=M.title(test),table=elt("div",undefined,"lcd-grid"),actions=elt("div",undefined,"lcd-actions");
 modal.setAttribute("aria-label",title);modal.append(elt("strong",title,"menu-title"));
 const method=page==="method",fs=method?["method"]:M.fields(test);
 const choose=(i,key)=>refresh(snapshot,{field:i,list:!!key,error:""});
 const list=fs[snapshot.field],isAlt=list==="alt";
 const caption=k=>k==="method"?"Data Input Method":M.labels[k];
 const visual=(key,value)=>key==="alt"?M.hypothesis(test,value):key==="pooled"?value==="yes"?"Yes":"No":pretty(value);
 const first=Math.min(Math.max(0,fs.length-4),Math.max(0,snapshot.field-2));
 fs.forEach((key,i)=>{
  if(i<first||i>=first+4)return;
  const dropdown=["method","alt","pooled"].includes(key),value=method?snapshot.method:snapshot.values[key],v=visual(key,value);
  const h=label(v+(dropdown?" ▾":"")||" ",()=>choose(i,dropdown),snapshot.field===i,watch,"dim-value");
  h.setAttribute("aria-label",caption(key)+": "+(v||"blank"));h.dataset.field=key;
  table.append(elt("span",caption(key)),h);
 });
 [["OK",fs.length],["Cancel",fs.length+1]].forEach(([name,i])=>actions.append(label(name,()=>{s={...s,field:i,list:false};physical("enter");},snapshot.field===i,watch)));
 modal.append(table,actions);
 if(snapshot.list){
  modal.append(method?options(snapshot,watch,"Input methods",["Data","Stats"],snapshot.method,v=>v):
  options(snapshot,watch,caption(list),isAlt?M.alts:["no","yes"],snapshot.values[list],v=>visual(list,v)));
 }
 return modal;
}
function resultCard(result){
 const el=elt("div",undefined,"stat-card");el.append(elt("strong",M.title(result.task.test),"stat-title"),elt("div",M.hypothesis(result.task.test,result.task.alt),"stat-hyp"));
 for(const [name,val,text] of [["t",result.t,fmt(result.t)],["PVal",result.p,result.extremeSmall?"< 1E−308":fmt(result.p)],["df",result.df,fmt(result.df)],...(result.sp===null?[]:[["sp",result.sp,fmt(result.sp)]])]){
  const row=elt("div",undefined,"stat-row"),value=elt("b",text);value.dataset.stat=name;if(name!=="PVal"||!result.extremeSmall)value.dataset.exact=String(val);
  row.append(elt("span",name),value);el.append(row);
 }
 return el;
}
function render(snapshot,watch){
 handheld.dataset.lcd=stage.dataset.lcd=snapshot.page;screen.replaceChildren();
 if(snapshot.result)screen.append(resultCard(snapshot.result));
 screen.append(elt("div",undefined,"calc-input"));
 screen.lastElementChild.append(elt("i",undefined,"cursor"));
 if(M.menu[snapshot.page]||["method","form"].includes(snapshot.page))screen.append(controls(snapshot,watch));
 if(snapshot.error)screen.append(elt("div",snapshot.error.split(". ")[0],"lcd-error"));
 if(watch)return;
 const labels={calc:"Open Menu → 6 Statistics → 7 Stat Tests. Choose the test that matches the study.",menu:"Choose Statistics.",stats:"Choose Stat Tests.",tests:"Use t Test for one sample, or 2-Sample t Test for independent groups.",method:"Use the dropdown to choose Stats. Then confirm.",form:"Enter the supplied summaries. Set the alternative and, for two samples, pooling. Tab to OK, then Enter.",result:"Read PVal for the hypothesis shown. Compare it with α."};
 $("hint").textContent=labels[snapshot.page];
 const e=snapshot.error||linkError||"";$("error").textContent=e;$("error").hidden=!e;
 const current=snapshot.page==="result"?snapshot.result:null,matched=M.matches(current,target);
 $("progress").textContent=current?(matched?"Use this PVal for the assigned test.":"This output uses a different test, tail, or inputs from the task."):"";
 $("progress").hidden=!$("progress").textContent;
 $("decision").hidden=!matched;
 $("decision-value").value=answer;
 $("decision-feedback").textContent=answerFeedback;$("decision-feedback").hidden=!answerFeedback;
}
function physical(key){
 if(mode!=="try")return;
 clearTimeout(light);
 const keys=[key];
 shell.setKeys(keys);light=setTimeout(()=>shell.setKeys([]),175);
 const old=s.result;s=M.press(s,key);if(s.result!==old){answer="";answerFeedback="";}render(s,false);
}
function editDraw(test,target){
 $("edit-pool-wrap").hidden=test!=="two";
 $("edit-values").replaceChildren(...M.fields(test).filter(k=>!["alt","pooled"].includes(k)).map(k=>{
  const lab=elt("label",M.labels[k]+" "),input=elt("input");input.name=k;input.required=true;input.maxLength=8;input.value=target?.[k]??"";lab.append(input);return lab;
 }));
}
function targetDraw(){
 const v=M.parse(target),name=v.test==="two"?["Group 1: "+[v.mean1,v.sd1,v.n1].map(pretty).join(", "), "Group 2: "+[v.mean2,v.sd2,v.n2].map(pretty).join(", ")]:["μ₀ = "+pretty(v.mu),"x̄ = "+pretty(v.mean),"sx = "+v.sd,"n = "+v.n];
 $("target-wrap").replaceChildren(...name.map(x=>elt("span",x)),elt("span","H₁: "+M.hypothesis(v.test,v.alt)),...(v.test==="two"?[elt("span","Pooled: "+(v.pooled==="yes"?"Yes":"No"))]:[]),elt("span","α = "+v.alpha));
 $("edit-test").value=v.test;$("edit-alt").value=v.alt;$("edit-alpha").value=v.alpha===.1?"0.10":String(v.alpha);$("edit-pooled").value=v.pooled??"yes";editDraw(v.test,v);
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
function taskMode(){$("task").textContent=target.test==="two"?"Independent normal samples · x̄, sx, n":"One normal sample · σ unknown";}
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
 s=M.start();answer="";answerFeedback="";
 taskMode();render(s,false);stage.focus({preventScroll:true});
};
$("edit-test").onchange=()=>editDraw($("edit-test").value,$("edit-test").value===target.test?target:null);
$("edit-form").onsubmit=e=>{
 e.preventDefault();
 const msg=$("edit-error"),test=$("edit-test").value;
 try{
  const draft={test,...Object.fromEntries(new FormData($("edit-form"))),alt:$("edit-alt").value,alpha:$("edit-alpha").value,...(test==="two"?{pooled:$("edit-pooled").value}:{})};
  M.parse(draft);target=draft;linkError="";s=M.start();answer="";answerFeedback="";
  targetDraw();taskMode();render(s,false);msg.hidden=true;$("edit").open=false;stage.focus({preventScroll:true});
 }catch(error){msg.textContent=error.message;msg.hidden=false;}
};
$("decision-value").onchange=()=>{answer=$("decision-value").value;answerFeedback="";};
$("decision").onsubmit=e=>{
 e.preventDefault();if(!M.matches(s.result,target))return;
 answer=$("decision-value").value;
 const reject=s.result.p<=M.parse(target).alpha;
 answerFeedback=!answer?"Choose a decision first.":(answer==="yes")===reject?(reject?"Correct: p ≤ α. There is evidence for the stated alternative.":"Correct: p > α. There is insufficient evidence for the stated alternative."):"Compare PVal with α. Reject only when p ≤ α.";
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
  const n=s.page==="method"?1:M.fields(s.test).length;
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
