(function(){"use strict";
const M=window.CT33,T=window.CT33Tape,$=id=>document.getElementById(id),stage=$("stage");
const params=new URLSearchParams(location.search),request=M.request(params);
const handheld=$("handheld-host");
const shell=CalculatorLessonHandset.mount(handheld,{screen:$("lcd"),label:"TI-Nspire CX II-T regression handheld",
 onKey:k=>{physical(k);stage.focus({preventScroll:true});}});
const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const btn=(text,active,click)=>{const b=node("button",text,active?"calc-active":"");b.type="button";if(click)b.addEventListener("click",click);else b.disabled=true;return b;};
const format=v=>v===null?"":M.display(v);
let mode="watch",stamp="",light=0,state=M.init(request.data),touched=false,entered=false,returnToWatch;
const frames=[M.init(M.demo)];
for(const [,key] of T.keys)frames.push(M.press(frames.at(-1),key));
function keyOf(k){return ({esc:"escape",del:"backspace",neg:"negative",dot:"."})[k]||k;}
function dataSheet(s,watch){
 const t=node("table",undefined,"lcd-sheet data-sheet"),head=t.createTHead(),body=t.createTBody();
 [["","A","B"],["","xval","yval"]].forEach(tr=>{const r=head.insertRow();for(const x of tr)r.append(node("th",x));});
 const form=body.insertRow();form.className="form";form.append(node("th",""),node("td","="),node("td","="));
 const rows=Math.max(5,s.x.findLastIndex(x=>x!==null)+1,s.y.findLastIndex(x=>x!==null)+1,s.row+1),start=Math.max(0,s.row-4);
 for(let i=start;i<Math.min(start+5,rows);i++){
  const row=body.insertRow();row.append(node("th",String(i+1)));
  [s.x,s.y].forEach((a,j)=>{
   const active=i===s.row&&j===s.col&&s.page==="sheet",td=node("td",(active&&s.edit!==null?s.edit:format(a[i]))||" ",active?"calc-active":"");
   if(!watch&&s.page==="sheet"){
    td.dataset.cell=i+":"+j;td.title=(j?"yval":"xval")+", row "+(i+1);
    td.addEventListener("click",()=>{let q=state.edit===null?state:M.press(state,"enter");update(q.error?q:{...q,row:i,col:j});stage.focus({preventScroll:true});});
   }
   row.append(td);
  });
 }
 return t;
}
function statsRows(s){
 const r=s.run;
 return [["Title","Exponential Regression"],["RegEqn","a·bˣ"],["a",format(r.a)],["b",format(r.b)],["r²",format(r.r2)||"undef"],["r",format(r.r)||"undef"],["Resid","{"+r.residuals.map(format).join(",")+"}"],["ResidTrans","{"+r.logResiduals.map(format).join(",")+"}"]];
}
function resultSheet(s,watch,c){
 const t=node("table",undefined,"lcd-sheet result"),h=t.createTHead(),b=t.createTBody();h.insertRow().append(node("th",""),node("th","C"),node("th","D"));
 statsRows(s).slice(s.choice,s.choice+6).forEach(([label,value],i)=>{
  const row=b.insertRow();if(watch&&((c===4||c===5||c>=7)&&["a","b"].includes(label)||c===6&&["r²","r"].includes(label)))row.className="cue";
  row.append(node("th",String(s.choice+i+1)),node("td",label),node("td",value));
 });
 return t;
}
function showMenu(s,watch){
 const ul=node("ul",undefined,"menu-list"), labels=["Lists & Spreadsheet menu","Statistics menu","Stat Calculations menu"];
 ul.setAttribute("aria-label",labels[s.menu]);
 const list=M.menu[s.menu], top=Math.max(0,s.choice-4),visible=list.slice(top,top+5);
 visible.forEach((v,i)=>{const li=node("li"),option=btn(v,top+i===s.choice,watch?null:()=>physical(v[0].toLowerCase()));li.append(option);ul.append(li);});
 if(top+visible.length<list.length)ul.append(node("li","▾","more-rows"));
 return ul;
}
function showWizard(s,watch){
 const modal=node("div",undefined,"wizard");modal.append(node("strong","Exponential Regression"));
 const grid=node("fieldset"),buttons=node("div",undefined,"actions"),click=(i,key)=>()=>{state={...state,field:i,dropdown:null};physical(key);stage.focus({preventScroll:true});};
 M.fields.forEach((field,i)=>{
  let value=s.settings[i]||" ";if(i<3)value+=" ▾";
  const b=btn(value,s.field===i,watch||i>2?null:click(i,"right"));b.setAttribute("aria-label",field+": "+s.settings[i]);
  grid.append(node("span",field),b);
 });
 buttons.append(btn("OK",s.field===7,watch?null:click(7,"enter")),btn("Cancel",s.field===8,watch?null:click(8,"enter")));
 modal.append(grid,buttons);
 if(s.dropdown!==null){
  const opts=node("div",undefined,"dropdown");
  M.choices(s).forEach((v,i)=>opts.append(btn(v,i===s.dropdown,watch?null:()=>{state={...state,dropdown:i};physical("tab");stage.focus({preventScroll:true});})));
  modal.append(opts);
 }
 return modal;
}
function lcd(s,watch,c){
 const d=$("lcd-body");d.replaceChildren(s.page==="result"?resultSheet(s,watch,c):dataSheet(s,watch));
 if(s.page==="menu")d.append(showMenu(s,watch));else if(s.page==="wizard")d.append(showWizard(s,watch));
 else if(s.page==="sheet"&&s.edit!==null)d.append(node("div",s.edit,"lcd-note"));
 else if(s.page==="result")d.append(node("div","ExpReg → "+s.run.store,"lcd-note result-store"));
 let description="Paired rows xval: "+M.readings(s).x.map(v=>v===null?"blank":M.display(v)).join(", ")+"; yval: "+M.readings(s).y.map(v=>v===null?"blank":M.display(v)).join(", ");
 if(s.page==="menu")description="Menu: "+M.menu[s.menu].join(". ");
 if(s.page==="wizard")description="Exponential Regression. "+M.fields.map((f,i)=>f+": "+(s.settings[i]||"blank")).join("; ")+(s.dropdown===null?"":". Choose "+M.choices(s)[s.dropdown]);
 if(s.page==="result")description=statsRows(s).map(([a,b])=>a+" "+b).join("; ")+"; Equation stored to "+s.run.store;
 if(s.edit!==null)description+=". Editing "+s.edit;
 $("lcd-text").textContent=description;
 handheld.dataset.scene=stage.dataset.scene=s.page;
}
function chart(where,d,r=null,mark=false){
 const v="http://www.w3.org/2000/svg",svg=document.createElementNS(v,"svg"),add=(tag,a)=>{const e=document.createElementNS(v,tag);Object.entries(a).forEach(([k,x])=>e.setAttribute(k,x));svg.append(e);return e;};
 if(d.x.length!==d.y.length||!d.x.length||[...d.x,...d.y].includes(null)){where.replaceChildren();return;}
 const lo=Math.min(...d.x),hi=Math.max(...d.x), yy=[Math.min(...d.y),Math.max(...d.y)];
 const line=r?Array.from({length:45},(_,i)=>{const x=lo+(hi-lo)*i/44;return [x,M.value(r,x)];}):[];
 if(r) yy[0]=Math.min(yy[0],...line.map(x=>x[1])),yy[1]=Math.max(yy[1],...line.map(x=>x[1]));
 const dx=hi-lo||1,dy=yy[1]-yy[0]||1, X=x=>36+(x-lo)*176/dx,Y=y=>104-(y-yy[0])*75/dy;
 svg.setAttribute("viewBox","0 0 245 134");svg.setAttribute("role","img");
 svg.setAttribute("aria-label",mark?"Study chart of the fitted exponential curve and the observed points.":r?"Study chart of paired data and fitted exponential curve.":"Study chart of the paired data, one dot per row.");
 add("path",{d:"M28 15V114H230",fill:"none",stroke:"currentColor","stroke-width":"1"});
 add("text",{x:230,y:129,fill:"currentColor","font-size":"12"}).textContent="x";
 add("text",{x:13,y:17,fill:"currentColor","font-size":"12"}).textContent="y";
 if(r)add("polyline",{points:line.map(([x,y])=>X(x)+","+Y(y)).join(" "),fill:"none",stroke:"currentColor","stroke-width":"2","stroke-dasharray":"4 3",opacity:".78"});
 d.x.forEach((x,i)=>add("circle",{cx:X(x),cy:Y(d.y[i]),r:"3.8",fill:"currentColor"}));
 if(r&&mark&&d.at>=lo&&d.at<=hi){
  const x=X(d.at),y=Y(M.value(r,d.at));add("path",{d:`M${x} ${y-5}l5 5-5 5-5-5Z`,fill:"var(--page)",stroke:"currentColor","stroke-width":"2"});
 }
 const cap=node("small",mark?"Dots: readings · diamond: estimate inside range":r?"Dots: readings · dashed curve: fit":"Study chart · one dot per pair");
 where.replaceChildren(svg,cap);
}
function renderWatch(device,{beat,point,crossed,key}){
 if(handheld.parentElement!==device)device.append(handheld);
 const count=crossed.length,physicalKey=T.keys[count-1]?.[1];
 const hold=point.span.end-point.span.voiceEnd;
 const lit=physicalKey&&!point.speaking&&key?.beat===beat&&(point.fraction-key.at)*hold<.65;
 shell.setKeys(lit?[physicalKey]:[]);
 const next=beat+":"+count;if(stamp===next)return;stamp=next;
 const s=frames[count],c=beat;
 lcd(s,true,c);
 chart($("watch-picture"),M.demo,c>=4?s.run:null,c>=7);
}
function shown(id,v){$(id).hidden=!v;}
function status(id,text,bad=false){const e=$(id);e.textContent=text;e.dataset.error=String(bad);}
function paintTry(writeData=true){
 lcd(state,false,-1);
 const data=M.readings(state),r=state.run,correct=r&&r.provenance[0]===0&&r.provenance[1]===1&&state.page==="result";
 $("try-context").textContent="Fit yval on xval. Predict at x = "+M.display(data.at)+" and classify that input and x = "+M.display(data.also)+".";
 $("first-label").textContent="First input: x = "+M.display(data.at);
 $("second-label").textContent="Second input: x = "+M.display(data.also);
 status("tool-status",state.error||(request.error&&!touched?request.error:"")||(r&&state.page==="result"?"Equation stored to "+r.store+".":""),Boolean(state.error||request.error&&!touched));
 for(const [id,v] of [["x-input",data.x],["y-input",data.y],["at-input",data.at],["also-input",data.also]])if(writeData&&document.activeElement!==$(id))$(id).value=Array.isArray(v)?v.map(x=>x??"").join(", "):v;
 shown("back-to-data",state.page!=="sheet"||!!r);$("back-to-data").textContent=state.page==="sheet"?"Show fit":"Show data";
 shown("try-picture",Boolean(correct));
 if(correct)chart($("try-picture"),data,r);else $("try-picture").replaceChildren();
 shown("transfer",Boolean(correct));
 if(correct)$("transfer").textContent="Use the observed x-values to judge each prediction input.";

}
function update(next){state=next;touched=true;status("assess-feedback","");paintTry();}
function physical(k){
 if(mode!=="try")return;
 clearTimeout(light);shell.setKeys([k]);light=setTimeout(()=>shell.setKeys([]),160);update(M.press(state,keyOf(k)));
}
$("data-form").addEventListener("submit",e=>{
 e.preventDefault();const x=M.parseList($("x-input").value),y=M.parseList($("y-input").value),at=M.number($("at-input").value),also=M.number($("also-input").value);
 const next=M.replace(state,x,y,at,also);
 if(next.error){status("tool-status",next.error,true);return;}
 $("answer").reset();update(next);$("edit-details").open=false;stage.focus({preventScroll:true});
});
$("answer").addEventListener("submit",e=>{
 e.preventDefault();const msg=M.grade(state,["a","b","y","first","second"].map(k=>$("answer-"+k).value));
 const b=state.run?.b,trend=b<1?"The multiplier is below one, so this fit models decay.":b>1?"The multiplier is above one, so this fit models growth.":"The multiplier equals one, so this fit stays constant.";
 status("assess-feedback",msg||"Correct. "+trend+" Extrapolation assumes the trend continues.",Boolean(msg));
});
$("answer").addEventListener("input",()=>status("assess-feedback",""));
function enterTry(device,actions){
 mode="try";returnToWatch=actions.returnToWatch;
 device.prepend(stage);$("try-grid").prepend(handheld);stage.hidden=false;$("watch-study").hidden=true;
 clearTimeout(light);shell.setKeys([]);shell.setInteractive(true);paintTry(!entered);entered=true;
}
function exitTry(){
 mode="watch";stage.hidden=true;$("watch-study").hidden=false;stamp="";
 clearTimeout(light);shell.setKeys([]);shell.setInteractive(false);
}
$("return").onclick=()=>returnToWatch?.();
$("reset").onclick=()=>{
 state=M.init(request.data);touched=true;$("answer").reset();$("edit-details").open=false;status("assess-feedback","");
 paintTry();stage.focus({preventScroll:true});
};
$("back-to-data").onclick=()=>{update({...state,page:state.page==="sheet"&&state.run?"result":"sheet",dropdown:null,error:"",edit:null});stage.focus({preventScroll:true});};
document.addEventListener("keydown",e=>{
 const el=e.target;
 if(mode!=="try"||e.defaultPrevented||e.isComposing||e.altKey||e.metaKey||e.ctrlKey||
    el.closest("input,textarea,select,a,summary,[contenteditable],.top,.tabbar"))return;
 if((!stage.contains(el)&&el!==document.body)||(el.closest("button")&&["Enter"," "].includes(e.key)))return;
 if(e.key==="Tab"&&!e.shiftKey&&el===stage&&state.page==="wizard"){e.preventDefault();physical("tab");return;}
 const keys={m:"menu",M:"menu",a:"a",A:"a",Escape:"esc",Enter:"enter",Backspace:"del",Delete:"del",ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down","-":"neg",".":"dot"};
 const k=keys[e.key]||(/^[0-9]$/.test(e.key)?e.key:"");if(k){
  e.preventDefault();
  // A direct Try URL initially has the body focused. The first calculator
  // shortcut opts into the stage so the upcoming wizard Tab selects a field.
  if(el===document.body)stage.focus({preventScroll:true});
  physical(k);
 }
});
window.CalculatorLessonAdapter=Object.freeze({
 initialMode:params.get("mode")==="try"||request.linked?"try":"watch",
 renderWatch,enterTry,exitTry
});
})();
