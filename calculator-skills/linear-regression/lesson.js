(function(){"use strict";
const M=window.CT31,T=window.CT31Tape,$=id=>document.getElementById(id),stage=$("stage");
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
 const t=node("table",undefined,"lcd-sheet"),head=t.createTHead(),body=t.createTBody();
 [["","A","B"],["","xval","yval"]].forEach(tr=>{const r=head.insertRow();for(const x of tr)r.append(node("th",x));});
 const form=body.insertRow();form.className="form";form.append(node("th",""),node("td","="),node("td","="));
 const rows=Math.max(4,s.x.findLastIndex(x=>x!==null)+1,s.y.findLastIndex(x=>x!==null)+1,s.row+1),start=Math.max(0,s.row-3);
 for(let i=start;i<Math.min(start+4,rows);i++){
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
 return [["Title","Linear Regression"],["RegEqn","m·x+b"],["m",format(r.m)],["b",format(r.b)],["r²",format(r.r2)||"undef"],["r",format(r.r)||"undef"],["Resid","{"+r.residuals.map(format).join(",")+"}"]];
}
function resultSheet(s,watch,c){
 const t=node("table",undefined,"lcd-sheet result"),h=t.createTHead(),b=t.createTBody();h.insertRow().append(node("th",""),node("th","C"),node("th","D"));
 statsRows(s).slice(s.choice,s.choice+6).forEach(([label,value],i)=>{
  const row=b.insertRow();if(watch&&((c===4||c===7)&&["m","b"].includes(label)||(c===5||c===6)&&["r","r²"].includes(label)))row.className="cue";
  row.append(node("th",String(s.choice+i+1)),node("td",label),node("td",value));
 });
 return t;
}
function showMenu(s,watch){
 const ul=node("ul",undefined,"menu-list"), labels=["Lists & Spreadsheet menu","Statistics menu","Stat Calculations menu"];
 ul.setAttribute("aria-label",labels[s.menu]);
 M.menu[s.menu].forEach((v,i)=>{const li=node("li"),option=btn(v,i===s.choice,watch?null:()=>physical(v[0]));li.append(option);ul.append(li);});
 return ul;
}
function showWizard(s,watch){
 const modal=node("div",undefined,"wizard");modal.append(node("strong","Linear Regression (mx+b)"));
 const grid=node("fieldset"),buttons=node("div",undefined,"actions"),click=(i,key)=>()=>{state={...state,field:i,dropdown:null};physical(key);stage.focus({preventScroll:true});};
 M.fields.forEach((field,i)=>{
  let value=s.settings[i]||" ";if(i<2)value+=" ▾";
  const b=btn(value,s.field===i,watch||i>1?null:click(i,"right"));b.setAttribute("aria-label",field+": "+s.settings[i]);
  grid.append(node("span",field),b);
 });
 buttons.append(btn("OK",s.field===7,watch?null:click(7,"enter")),btn("Cancel",s.field===8,watch?null:click(8,"enter")));
 modal.append(grid,buttons);
 if(s.dropdown!==null){
  const opts=node("div",undefined,"dropdown");
  M.options.forEach((v,i)=>opts.append(btn(v,i===s.dropdown,watch?null:()=>{state={...state,dropdown:i};physical("tab");stage.focus({preventScroll:true});})));
  modal.append(opts);
 }
 return modal;
}
function lcd(s,watch,c){
 const d=$("lcd-body");d.replaceChildren(s.page==="result"?resultSheet(s,watch,c):dataSheet(s,watch));
 if(s.page==="menu")d.append(showMenu(s,watch));else if(s.page==="wizard")d.append(showWizard(s,watch));
 else if(s.page==="sheet"&&s.edit!==null)d.append(node("div",s.edit,"lcd-note"));
 let description="Paired rows xval: "+M.readings(s).x.map(v=>v===null?"blank":M.display(v)).join(", ")+"; yval: "+M.readings(s).y.map(v=>v===null?"blank":M.display(v)).join(", ");
 if(s.page==="menu")description="Menu: "+M.menu[s.menu].join(". ");
 if(s.page==="wizard")description="Linear Regression (mx+b). "+M.fields.map((f,i)=>f+": "+(s.settings[i]||"blank")).join("; ")+(s.dropdown===null?"":". Choose "+M.options[s.dropdown]);
 if(s.page==="result")description=statsRows(s).map(([a,b])=>a+" "+b).join("; ");
 if(s.edit!==null)description+=". Editing "+s.edit;
 $("lcd-text").textContent=description;
 handheld.dataset.scene=stage.dataset.scene=s.page;
}
function chart(where,d,r=null){
 const v="http://www.w3.org/2000/svg",svg=document.createElementNS(v,"svg"),add=(tag,a)=>{const e=document.createElementNS(v,tag);Object.entries(a).forEach(([k,x])=>e.setAttribute(k,x));svg.append(e);return e;};
 if(d.x.length!==d.y.length||!d.x.length||[...d.x,...d.y].includes(null)){where.replaceChildren();return;}
 const xx=[Math.min(...d.x),Math.max(...d.x)], yy=[Math.min(...d.y),Math.max(...d.y)];
 if(r){const edges=xx.map(x=>r.m*x+r.b);yy[0]=Math.min(yy[0],...edges);yy[1]=Math.max(yy[1],...edges);}
 const dx=xx[1]-xx[0]||1,dy=yy[1]-yy[0]||1, X=x=>36+(x-xx[0])*176/dx,Y=y=>105-(y-yy[0])*76/dy;
 svg.setAttribute("viewBox","0 0 245 134");svg.setAttribute("role","img");svg.setAttribute("aria-label","Study chart of the paired data"+(r?", with its fitted line":""));
 add("path",{d:"M28 15V114H230",fill:"none",stroke:"currentColor","stroke-width":"1"});
 add("text",{x:230,y:129,fill:"currentColor","font-size":"12"}).textContent="x";
 add("text",{x:13,y:17,fill:"currentColor","font-size":"12"}).textContent="y";
 if(r)add("line",{x1:X(xx[0]),y1:Y(r.m*xx[0]+r.b),x2:X(xx[1]),y2:Y(r.m*xx[1]+r.b),stroke:"currentColor","stroke-width":"2","stroke-dasharray":"4 3",opacity:".70"});
 d.x.forEach((x,i)=>add("circle",{cx:X(x),cy:Y(d.y[i]),r:"3.8",fill:"currentColor"}));
 const cap=node("small",r?"Study chart · dashed fitted line":"Study chart · one dot per pair");
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
 chart($("watch-picture"),M.demo,c>=4?s.run:null);
}
function shown(id,v){$(id).hidden=!v;}
function status(id,text,bad=false){const e=$(id);e.textContent=text;e.dataset.error=String(bad);}
function paintTry(writeData=true){
 lcd(state,false,-1);
 const data=M.readings(state),r=state.run,correct=r&&r.provenance[0]===0&&r.provenance[1]===1&&state.page==="result";
 $("try-context").textContent="Use xval to predict yval. Find the fitted line, both correlation rows, and predict y at x = "+M.display(data.at)+".";
 status("tool-status",state.error||(request.error&&!touched?request.error:"")||(r?.notes&&state.page==="result"?r.notes:""),Boolean(state.error||request.error&&!touched));
 for(const [id,v] of [["x-input",data.x],["y-input",data.y],["at-input",data.at]])if(writeData&&document.activeElement!==$(id))$(id).value=Array.isArray(v)?v.map(x=>x??"").join(", "):v;
 shown("back-to-data",state.page!=="sheet");shown("try-picture",Boolean(correct));
 if(correct)chart($("try-picture"),data,r);else $("try-picture").replaceChildren();
 shown("transfer",Boolean(correct));
 if(correct)$("transfer").textContent=r.r===null?"For an undefined correlation, enter undefined in both correlation fields.":"Check the sign of r against the direction of the fitted line. r² cannot tell them apart.";
}
function update(next){state=next;touched=true;status("assess-feedback","");paintTry();}
function physical(k){
 if(mode!=="try")return;
 clearTimeout(light);shell.setKeys([k]);light=setTimeout(()=>shell.setKeys([]),160);update(M.press(state,keyOf(k)));
}
$("data-form").addEventListener("submit",e=>{
 e.preventDefault();const x=M.parseList($("x-input").value),y=M.parseList($("y-input").value),at=M.number($("at-input").value);
 const next=M.replace(state,x,y,at);
 if(next.error){status("tool-status",next.error,true);return;}
 $("answer").reset();update(next);$("edit-details").open=false;stage.focus({preventScroll:true});
});
$("answer").addEventListener("submit",e=>{
 e.preventDefault();const msg=M.grade(state,["m","b","r","r2","y"].map(k=>$("answer-"+k).value));
 status("assess-feedback",msg||"Correct. The prediction comes from the fitted line; read the sign of Pearson r separately.",Boolean(msg));
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
$("back-to-data").onclick=()=>{update({...state,page:"sheet",dropdown:null,error:"",edit:null,run:null});stage.focus({preventScroll:true});};
document.addEventListener("keydown",e=>{
 const el=e.target;
 if(mode!=="try"||e.defaultPrevented||e.isComposing||e.altKey||e.metaKey||e.ctrlKey||
    el.closest("input,textarea,select,a,summary,[contenteditable],.top,.tabbar"))return;
 if((!stage.contains(el)&&el!==document.body)||(el.closest("button")&&["Enter"," "].includes(e.key)))return;
 if(e.key==="Tab"&&!e.shiftKey&&el===stage&&state.page==="wizard"){e.preventDefault();physical("tab");return;}
 const keys={m:"menu",M:"menu",Escape:"esc",Enter:"enter",Backspace:"del",Delete:"del",ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down","-":"neg",".":"dot"};
 const k=keys[e.key]||(/^[0-9]$/.test(e.key)?e.key:"");if(k){e.preventDefault();if(el===document.body)stage.focus({preventScroll:true});physical(k);}
});
window.CalculatorLessonAdapter=Object.freeze({
 initialMode:params.get("mode")==="try"||request.linked?"try":"watch",
 renderWatch,enterTry,exitTry
});
})();
