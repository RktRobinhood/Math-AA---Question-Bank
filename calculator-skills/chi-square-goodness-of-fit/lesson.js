(function(){"use strict";
const M=window.CT48,$=id=>document.getElementById(id),stage=$("stage"),screen=$("screen");
const params=new URLSearchParams(location.search),request=M.request(params);
let mode="watch",stamp=-1,s=M.start(request.target),light=0,returnToWatch;
let target=request.target,linkError=request.error;
const handheld=$("handheld-host");
const shell=CalculatorLessonHandset.mount(handheld,{screen:$("lcd"),label:"TI-Nspire CX II-T Lists & Spreadsheet",onKey:k=>{physical(k);stage.focus({preventScroll:true});}});
const pretty=v=>String(v).replace(/-/g,"−");
const elt=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
function label(text,action,active,watch,cls){
 const b=elt("button",text,cls);b.type="button";
 if(active)b.classList.add("calc-active");
 if(watch)b.disabled=true;else if(action)b.addEventListener("click",action);
 return b;
}
let answer={stat:"",decision:""},answerFeedback="";
const fmt=n=>pretty(Number(n.toPrecision(6)));
function refresh(snapshot,mod){s={...snapshot,...mod};render(s,false);stage.focus({preventScroll:true});}
function controls(snapshot,watch){
 const modal=elt("div",undefined,"lcd-modal"),page=snapshot.page;
 if(M.menu[page]){
  const title=M.paths[page];modal.setAttribute("aria-label",title);modal.append(elt("strong",title,"menu-title"));
  M.menu[page].forEach(([id,name],i)=>modal.append(label(id+": "+name+((page==="menu"&&id===4||page==="stats"&&id===4)?" ▸":""),()=>physical(String(id)),i===snapshot.index,watch,"menu-item")));
  return modal;
 }
 const title="χ² GOF",table=elt("div",undefined,"lcd-grid"),actions=elt("div",undefined,"lcd-actions");
 modal.setAttribute("aria-label",title);modal.append(elt("strong",title,"menu-title"));
 M.fields.forEach((key,i)=>{
  const name=M.labels[key],v=key==="out"?"c[]":key==="draw"?"☐ Shade P Value":snapshot.fields[key],n=label(pretty(v)||" ",()=>refresh(snapshot,{field:i,error:""}),snapshot.field===i,watch,"dim-value");
  n.setAttribute("aria-label",name+": "+(v||"blank"));n.dataset.field=key;
  const caption=elt("span",name);
  if(key==="df"||key==="out")caption.replaceChildren(elt("span",name,"field-wide"),elt("span",key==="df"?"df":"Result column","field-compact"));
  if(key==="draw")n.replaceChildren(elt("span",v,"field-wide"),elt("span","☐ Off","field-compact"));
  table.append(caption,n);
 });
 [["OK",5],["Cancel",6]].forEach(([name,i])=>actions.append(label(name,()=>{s={...s,field:i};physical("enter");},snapshot.field===i,watch)));
 modal.append(table,actions);return modal;
}
const showValue=n=>Number(n.toPrecision(6));
const short=n=>pretty(showValue(n));
function sheet(snapshot,watch){
 const r=snapshot.result,show=!!r,grid=elt("div",undefined,"sheet-grid");
 grid.classList.toggle("with-output",show);grid.append(elt("span","","row-num"));
 for(const name of show?["A","B","C","D"]:["A","B","C"])grid.append(elt("span",name,"col-id"));
 grid.append(elt("span","","row-num"),elt("span","obs","list-name"),elt("span","expt","list-name"),elt("span","","list-name"));if(show)grid.append(elt("span","","list-name"));
 const outputs=r?[["χ²",r.stat],["PVal",r.p],["df",r.df]]:[];
 const last=snapshot.cells[0].length,start=Math.min(Math.max(0,last-4),Math.max(0,snapshot.row-3));
 for(let i=start;i<Math.min(last,start+4);i++){
  grid.append(elt("span",String(i+1),"row-num"));
  [0,1].forEach(j=>{
   const active=snapshot.col===j&&snapshot.row===i&&(snapshot.page==="sheet"||snapshot.page==="result"),
     displayed=active&&snapshot.draft!==null?snapshot.draft:snapshot.cells[j][i];
   const n=label(displayed||" ",()=>{s=M.chooseCell(s,j,i);render(s,false);stage.focus({preventScroll:true});},active,watch||!["sheet","result"].includes(snapshot.page),"sheet-cell");
   n.dataset.sheet=j+","+i;n.setAttribute("aria-label",(j?"Expected":"Observed")+" count, row "+(i+1)+": "+(displayed||"blank"));grid.append(n);
  });
  if(show){
   const [name,val]=outputs[i]??["",null],a=elt("span",name,"sheet-out"),b=elt("b",val===null?"":name==="PVal"&&r.underflow?"<1E−308":short(val),"sheet-out");
   if(name){b.dataset.stat=name;if(name!=="PVal"||!r.underflow)b.dataset.exact=String(val);}
   grid.append(a,b);
  }else grid.append(elt("span","","sheet-out"));
 }
 return grid;
}
function render(snapshot,watch){
 handheld.dataset.lcd=stage.dataset.lcd=snapshot.page;screen.replaceChildren(sheet(snapshot,watch));
 const line=elt("div",undefined,"calc-input");line.append(elt("span",String.fromCharCode(65+snapshot.col)+(snapshot.row+1)+" = "+(snapshot.draft??snapshot.cells[snapshot.col][snapshot.row]??"")));screen.append(line);
 if(M.menu[snapshot.page]||snapshot.page==="form")screen.append(controls(snapshot,watch));
 if(snapshot.error)screen.append(elt("div",snapshot.error.split(". ")[0],"lcd-error"));
 if(watch)return;
 const labels={sheet:"Multiply total observations by each claimed proportion. Enter expected counts in expt, pressing Enter after each. The sheet scrolls as you go.",menu:"Choose Statistics.",stats:"Choose Stat Tests.",tests:"Select χ² GOF, not the two-way test.",form:"Enter obs, then expt, then categories minus one. Keep c[] as the result column and Draw off.",result:"Read the χ² statistic, PVal and df. Compare PVal with the task's significance level."};
 $("hint").textContent=labels[snapshot.page];
 const e=snapshot.error||linkError||"";$("error").textContent=e;$("error").hidden=!e;
 const current=snapshot.page==="result"?snapshot.result:null,matched=M.matches(current,target);
 $("progress").textContent=current&&!matched?"These results use different counts, list roles or degrees of freedom from the task.":matched&&showValue(current.p)===target.alpha&&current.p!==target.alpha?"The display rounds PVal to α. The unrounded p-value is "+(current.p>target.alpha?"just above":"just below")+" α.":"";
 $("progress").hidden=!$("progress").textContent;
 $("decision").hidden=!matched;
 $("guess-stat").value=answer.stat;$("decision-value").value=answer.decision;
 $("decision-feedback").textContent=answerFeedback;$("decision-feedback").hidden=!answerFeedback;
}
function physical(key){
 if(mode!=="try")return;
 clearTimeout(light);
 const keys=[key];
 shell.setKeys(keys);light=setTimeout(()=>shell.setKeys([]),175);
 const old=s.result;s=M.press(s,key);if(s.result!==old){answer={stat:"",decision:""};answerFeedback="";}render(s,false);
}
function targetDraw(){
 const {obs,probs,alpha}=target;
 $("target-wrap").replaceChildren(elt("span","Claimed proportions: "+probs.join(", ")),elt("span","α = "+alpha));
 for(const [k,v] of [["obs",obs.join(",")],["probs",probs.join(",")],["alpha",String(alpha)]])$("edit-form").elements[k].value=v;
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
function taskMode(){$("task").textContent="Test one claimed categorical distribution.";}
function enterTry(device,actions){
 mode="try";returnToWatch=actions.returnToWatch;document.body.classList.add("in-try");
 device.prepend(stage);$("try-deck").prepend(handheld);stage.hidden=false;
 clearTimeout(light);shell.setKeys([]);shell.setInteractive(true);taskMode();render(s,false);
}
function exitTry(){
 mode="watch";stage.hidden=true;stamp=-1;document.body.classList.remove("in-try");
 clearTimeout(light);shell.setKeys([]);shell.setInteractive(false);
}
$("return").onclick=()=>returnToWatch?.();
$("reset").onclick=()=>{
 s=M.start(target);answer={stat:"",decision:""};answerFeedback="";
 taskMode();render(s,false);stage.focus({preventScroll:true});
};
$("edit-form").onsubmit=e=>{
 e.preventDefault();const msg=$("edit-error"),fd=new FormData($("edit-form"));
 try{
  const draft={obs:M.list(fd.get("obs"),"obs"),probs:M.list(fd.get("probs"),"probs"),alpha:Number(fd.get("alpha"))};
  M.setup(draft.obs,draft.probs,draft.alpha);target=draft;linkError="";s=M.start(target);answer={stat:"",decision:""};answerFeedback="";
  targetDraw();taskMode();render(s,false);msg.hidden=true;$("edit").open=false;stage.focus({preventScroll:true});
 }catch(error){msg.textContent=error.message;msg.hidden=false;}
};
$("guess-stat").oninput=()=>{answer.stat=$("guess-stat").value;answerFeedback="";$("decision-feedback").hidden=true;};
$("decision-value").onchange=()=>{answer.decision=$("decision-value").value;answerFeedback="";$("decision-feedback").hidden=true;};
$("decision").onsubmit=e=>{
 e.preventDefault();if(!M.matches(s.result,target)||s.page!=="result")return;
 const reject=s.result.p<=target.alpha,raw=answer.stat.trim();
 const guess=/^[+]?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?$/i.test(raw)?Number(raw):NaN;
 const expected=[s.result.stat,showValue(s.result.stat)].map(x=>Number(x.toPrecision(3)));
 answerFeedback=!Number.isFinite(guess)||!answer.decision?"Enter the statistic and choose a decision.":!expected.some(x=>Math.abs(guess-x)<=1e-10*Math.max(1,Math.abs(x)))?"Read χ², not PVal, and give three significant figures.":(answer.decision==="yes")===reject?(reject?"Correct: p ≤ α. There is evidence the claimed proportions do not fit.":"Correct: p > α. There is insufficient evidence against the claimed proportions."):"Compare PVal with α. Reject only when p ≤ α.";
 render(s,false);
};
document.addEventListener("keydown",e=>{
 if(mode!=="try"||e.defaultPrevented||e.target.closest?.(".top, .tabbar"))return;
 if(e.altKey||e.ctrlKey||e.metaKey||e.isComposing||e.target.closest("input,select,a,summary,textarea,[contenteditable]"))return;
 const b=e.target.closest("button");
 if((!stage.contains(e.target)&&e.target!==document.body)||(b&&["Enter"," ","Tab"].includes(e.key)))return;
 const map={m:"menu",M:"menu",Escape:"esc",Enter:"enter",ArrowDown:"down",ArrowUp:"up",ArrowLeft:"left",ArrowRight:"right",Backspace:"del",Delete:"del","-":"neg",".":"dot"};
 let key=map[e.key]||(/^[a-z0-9]$/i.test(e.key)?e.key.toLowerCase():"");
 if(e.key==="Tab"&&s.page==="form"){
  const n=M.fields.length;
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
