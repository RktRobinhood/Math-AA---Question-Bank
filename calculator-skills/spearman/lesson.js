(function(){"use strict";
const M=window.CT35,T=window.CT35Tape,$=id=>document.getElementById(id),stage=$("stage");
const params=new URLSearchParams(location.search),request=M.request(params);
const handheld=$("handheld-host");
const shell=CalculatorLessonHandset.mount(handheld,{screen:$("lcd"),interactive:false,label:"TI-Nspire CX II-T Spearman rank correlation handheld",onKey:k=>{physical(k);stage.focus({preventScroll:true});}});
const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const btn=(text,active,click)=>{const b=node("button",text,active?"calc-active":"");b.type="button";if(click)b.addEventListener("click",click);else b.disabled=true;return b;};
const format=v=>v===null?"":M.display(v);
let mode="watch",stamp="",light=0,state=M.init(request.data),hasOwnTry=false,entered=false,returnToWatch;
const frames=[M.init(M.demo)];
for(const [,k] of T.keys)frames.push(M.press(frames.at(-1),keyOf(k)));
function keyOf(k){return ({esc:"escape",del:"backspace",neg:"negative",dot:".",lparen:"(",rparen:")"})[k]||k;}
function rawTable(where,d){
 const table=node('table',undefined,'source-readings');table.setAttribute('aria-label','Paired measurements, original order');
 const head=table.createTHead().insertRow();head.append(node('th','Row'),...d.x.map((_,i)=>node('th',String(i+1))));
 for(const [lead,readings] of [['x',d.x],['y',d.y]]){const tr=table.insertRow();tr.append(node('th',lead),...readings.map(x=>node('td',format(x))));}
 where.replaceChildren(table);
}
function dataSheet(s,watch){
 const t=node('table',undefined,'lcd-sheet data-sheet'),head=t.createTHead(),body=t.createTBody();
 [['','A','B'],['','rx','ry']].forEach(tr=>{const row=head.insertRow();tr.forEach(v=>row.append(node('th',v)));});
 const fr=body.insertRow();fr.className='form';fr.append(node('th',''),node('td','='),node('td','='));
 const first=Math.max(0,s.row-4),last=Math.min(first+5,s.x.length);
 for(let i=first;i<last;i++){
  const row=body.insertRow();row.append(node('th',String(i+1)));
  [s.x,s.y].forEach((a,j)=>{
   const active=i===s.row&&j===s.col&&s.page==='sheet',td=node('td',(active&&s.edit!==null?s.edit:format(a[i]))||' ',active?'calc-active':'');
   if(!watch&&s.page==='sheet'){td.dataset.cell=i+':'+j;td.setAttribute('aria-label',(j?'ry':'rx')+', row '+(i+1));td.onclick=()=>{const q=state.edit===null?state:M.press(state,'enter');update(q.error?q:{...q,row:i,col:j});stage.focus({preventScroll:true});};}
   row.append(td);
  });
 }
 return t;
}
function statsRows(s){
 const r=s.run;
 return [['Title','Linear Regression'],['RegEqn','a+bx'],['a',format(r.a)],['b',format(r.b)],['r²',format(r.r2)],['r',format(r.r)],['Resid','{'+r.residuals.map(format).join(',')+'}']];
}
function resultSheet(s,watch,c){
 const t=node("table",undefined,"lcd-sheet result"),h=t.createTHead(),b=t.createTBody();h.insertRow().append(node("th",""),node("th","C"),node("th","D"));
 statsRows(s).slice(s.choice,s.choice+6).forEach(([label,value],i)=>{
  const row=b.insertRow();if((watch&&c>=6||!watch)&&label==='r')row.className='cue';
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
 const modal=node("div",undefined,"wizard");modal.append(node("strong","Linear Regression (a+bx)"));
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
 else if(s.page==="result")d.append(node("div","LinRegBx → "+s.run.store,"lcd-note result-store"));
 let description="Entered rank lists rx: "+M.readings(s).x.map(v=>v===null?"blank":M.display(v)).join(", ")+"; ry: "+M.readings(s).y.map(v=>v===null?"blank":M.display(v)).join(", ");
 if(s.page==="menu")description="Menu: "+M.menu[s.menu].join(". ");
 if(s.page==="wizard")description="Linear Regression (a+bx). "+M.fields.map((f,i)=>f+": "+(s.settings[i]||"blank")).join("; ")+(s.dropdown===null?"":". Choose "+M.choices(s)[s.dropdown]);
 if(s.page==="result")description=statsRows(s).map(([a,b])=>a+" "+b).join("; ")+"; Equation stored to "+s.run.store;
 if(s.error){description+=". "+s.error;d.append(node("div",s.error,"lcd-alert"));}
 if(s.edit!==null)description+=". Editing "+s.edit;
 $("lcd-text").textContent=description;
 stage.dataset.scene=s.page;
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

}
function shown(id,v){$(id).hidden=!v;}
function status(id,text,bad=false){const e=$(id);e.textContent=text;e.dataset.error=String(bad);}
function paintTry(writeData=true){
 lcd(state,false,-1);rawTable($('try-picture'),state.raw);
 $('try-context').textContent='Find Spearman’s rank correlation for these paired scores. Rank each list separately and put the ranks back on their original rows.';
 $('reset').textContent='Reset Try';
 status('tool-status',state.error||(request.error&&!hasOwnTry?request.error:'')||(state.run&&!state.run.matchX?'Check the rx ranks against the original x rows.':state.run&&!state.run.matchY?'Check the ry ranks against the original y rows.':''),Boolean(state.error||request.error&&!hasOwnTry||state.run&&(!state.run.matchX||!state.run.matchY)));
 for(const [id,v] of [['x-input',state.raw.x],['y-input',state.raw.y]])if(writeData&&document.activeElement!==$(id))$(id).value=v.join(', ');
 shown('back-to-data',state.page!=='sheet'||!!state.run);
 $('back-to-data').textContent=state.page==='sheet'?'Show result':'Rank sheet';
 shown('answer',!state.fromWatch);
}
function update(next){state=next;if(!state.fromWatch)hasOwnTry=true;status('assess-feedback','');paintTry();}
function physical(k){
 if(mode!=='try')return;
 clearTimeout(light);shell.setKeys([k]);light=setTimeout(()=>shell.setKeys([]),160);update(M.press(state,keyOf(k)));
}
$('data-form').onsubmit=e=>{
 e.preventDefault();const next=M.replace(state,M.parseList($('x-input').value),M.parseList($('y-input').value));
 if(next.error){status('tool-status',next.error,true);return;}
 $('answer').reset();update(next);$('edit-details').open=false;stage.focus({preventScroll:true});
};
$('answer').onsubmit=e=>{e.preventDefault();const msg=M.grade(state,$('answer-r').value);status('assess-feedback',msg||(state.undefinedConfirmed?'Correct. One list is constant, so rank correlation is undefined.':'Correct. Pearson r on these two rank lists is Spearman’s rₛ.'),Boolean(msg));};
$('answer-r').oninput=()=>status('assess-feedback','');
function enterTry(device,actions){
 mode="try";returnToWatch=actions.returnToWatch;
 device.prepend(stage);$("try-grid").prepend(handheld);stage.hidden=false;$("watch-study").hidden=true;
 clearTimeout(light);shell.setKeys([]);shell.setInteractive(true);paintTry(!entered);entered=true;stage.focus({preventScroll:true});
}
function exitTry(){
 mode="watch";stage.hidden=true;$("watch-study").hidden=false;stamp="";
 clearTimeout(light);shell.setKeys([]);shell.setInteractive(false);
}
$("return").onclick=()=>returnToWatch?.();
$("reset").onclick=()=>{state=M.init(request.data);hasOwnTry=true;$("answer").reset();$("edit-details").open=false;status("assess-feedback","");paintTry();stage.focus({preventScroll:true});};
$("back-to-data").onclick=()=>{update({...state,page:state.page==="sheet"&&state.run?"result":"sheet",dropdown:null,error:"",edit:null});stage.focus({preventScroll:true});};
document.addEventListener("keydown",e=>{
 if(mode!=="try"||e.defaultPrevented)return;
 if(e.target!==document.body&&!e.target.closest?.(".qb-calculator-lesson"))return;
 const el=e.target;if(e.altKey||e.metaKey||e.ctrlKey||el.closest("input,textarea,select,a,summary,[contenteditable]"))return;
 if((!stage.contains(el)&&el!==document.body)||(el.closest("button")&&["Enter"," "].includes(e.key)))return;
 if(e.key==="Tab"&&el===stage&&state.page==="wizard"&&(e.shiftKey?state.field>0:state.field<8)){e.preventDefault();physical(e.shiftKey?"backtab":"tab");return;}
 const keys={m:"menu",M:"menu",Escape:"esc",Enter:"enter",Backspace:"del",Delete:"del",ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down","-":"neg",".":"dot","(":"lparen",")":"rparen"};
 const k=keys[e.key]||(/^[a-z0-9]$/i.test(e.key)?e.key.toLowerCase():"");if(k){
  e.preventDefault();
  // A direct Try URL initially has the body focused. The first calculator
  // shortcut opts into the stage so the upcoming wizard Tab selects a field.
  if(el===document.body)stage.focus({preventScroll:true});
  physical(k);
 }
});
rawTable($("watch-picture"),M.demo);
window.CalculatorLessonAdapter=Object.freeze({
 initialMode:params.get("mode")==="try"||request.linked?"try":"watch",
 renderWatch,enterTry,exitTry
});
})();
