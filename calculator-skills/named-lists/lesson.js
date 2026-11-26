"use strict";
(function(){
const $=id=>document.getElementById(id),M=CT28,T=CT28Tape;
const stage=$("stage"),field=$("cell-text");
const params=new URLSearchParams(location.search);
let problem=M.original,invalid=false;
try{const p=M.link(params);if(p)problem=p;}catch{invalid=true;}
let mode="watch",state=M.init(),worked=false,stamp="",returnToWatch;
const handheld=$("handheld-host");
const shell=CalculatorLessonHandset.mount(handheld,{screen:$("lcd"),label:"TI-Nspire CX II-T Lists & Spreadsheet",interactive:false,onKey:press});
const tape=T.beats.flatMap(b=>b.keys), frames=[M.init("home")];
for(const key of tape)frames.push(M.step(frames.at(-1),key));
const node=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=value;return e;};
function source(el,p,caption){
 el.replaceChildren();
 if(caption)el.append(node("caption","",caption));
 const h=node("thead"),tr=node("tr"),tb=node("tbody");
 for(const x of ["Measured value",...(p.f?["Frequency"]:[])]){const e=node("th","",x);e.scope="col";tr.append(e);}
 h.append(tr);
 p.v.forEach((x,i)=>{const row=node("tr");row.append(node("td","",x));if(p.f)row.append(node("td","",p.f[i]));tb.append(row);});
 el.append(h,tb);
}
source($("source-table"),problem,problem.f?"Source frequency table":"Source readings");
function cell(s,c,r,interactive){
 const col=s.cols[c],active=s.c===c&&s.row===r,edited=active&&s.buf!==null;
 const value=edited?s.buf:r===-2?col.name:r===-1?"":col.v[r];
 const h=node(interactive?"button":"span",r===-2?"entrycell":"cell-face");
 h.classList.toggle("calc-active",active);if(r===-2)h.append(node("b","","AB"[c]));
 h.append(node("span",value===null?"blank":"",value??"_"));
 if(interactive){
  h.type="button";h.dataset.cell=M.label(c,r).replace(" ","-");h.setAttribute("aria-label",M.label(c,r)+": "+(value===""||value===null?"blank":value));h.setAttribute("aria-pressed",String(active));
  h.addEventListener("click",()=>{worked=true;state=M.select(state,c,r);recorded();paintTry();if(r!==-1)field.focus({preventScroll:true});});
 }
 return h;
}
function lcd(s,interactive=false){
 const d=$("lcd-body"),title=$("lcd-title"),rich=$("lcd-text");d.replaceChildren();
 $("lcd-entryline").hidden=s.page!=="sheet";
 if(s.page==="home"||s.page==="new"||s.page==="insert"){
  const home=s.page==="home", options=home?["1 New Document","2 Browse","3 Recent","4 Current","5 Settings"]:["1: Add Calculator","2: Add Graphs","3: Add Geometry","4: Add Lists & Spreadsheet","5: Add Data & Statistics","6: Add Notes"];
  title.textContent=home?"Home":s.page==="insert"?"Insert page":"New Document";
  const list=node("ul","home-keys");options.forEach((x,i)=>{const row=node("li",i===0?"calc-active":"",x);list.append(row);});d.append(list);
  rich.textContent=home?"Home. Choose 1: New Document.":"New Document. Choose 4: Add Lists & Spreadsheet.";return;
 }
 title.textContent="1."+s.sheet+"  Lists & Spreadsheet";
 const table=node("table","spread"),head=node("thead"),hr=node("tr"),body=node("tbody");
 hr.append(node("th","rowno",""));for(let c=0;c<2;c++){const e=node("th","headcell");e.append(cell(s,c,-2,interactive));hr.append(e);}
 head.append(hr);table.append(head);
 const row=(r)=>{
  const e=node("tr");if(r===-1)e.setAttribute("name","formula");
  e.append(node("th","rowno",r===-1?"=":r+1));
  for(let c=0;c<2;c++){const el=node("td","");el.append(cell(s,c,r,interactive));e.append(el);}return e;
 };
 body.append(row(-1));const start=Math.max(0,Math.min(M.N-5,s.row-4));
 for(let r=start;r<Math.min(M.N,start+5);r++)body.append(row(r));
 table.append(body);d.append(table);
 const current=s.buf??(s.row===-2?s.cols[s.c].name:s.row===-1?(s.cols[s.c].name?s.cols[s.c].name+":=":"="):s.cols[s.c].v[s.row])??"";
 $("selection").textContent=M.label(s.c,s.row)+":";$("lcd-value").textContent=current;$("lcd-value").hidden=interactive&&s.row!==-1;
 const coltext=s.cols.map((x,i)=>"Column "+"AB"[i]+": "+(x.name||"unnamed")+"; "+x.v.slice(0,Math.max(3,x.v.findLastIndex(y=>y!==null)+1)).map(y=>y??"blank").join(", ")).join(". ");
 rich.textContent="Selected "+M.label(s.c,s.row)+". "+coltext+(s.buf!==null?". Entering "+s.buf:"")+(s.err?". "+s.err:".");
}
function renderWatch(device,{beat,point,crossed,key}){
 if(handheld.parentElement!==device)device.append(handheld);
 const count=crossed.length,pressed=tape[count-1];
 const lit=pressed&&!point.speaking&&key?.beat===beat&&(point.fraction-key.at)*(point.span.end-point.span.voiceEnd)<.65;
 shell.setKeys(lit?(pressed==="doc"&&tape[count-2]==="ctrl"?["ctrl","doc"]:[pressed]):[]);
 const next=beat+":"+count;if(next===stamp)return;stamp=next;
 $("typed").hidden=true;lcd(frames[count]);
}
function recorded(){$("assess-feedback").textContent="";}
function paintTry(fromType=false){
 if(mode!=="try")return; lcd(state,true);
 $("try-context").textContent=M.context(problem);
 const visible=state.page==="sheet"&&state.row!==-1;
 $("typed").hidden=!visible;
 field.inputMode=state.row===-2?"text":"decimal";
 if(!fromType){const q=state.cols[state.c],prev=state.row===-2?q.name:q.v[state.row];field.value=visible?state.buf??prev??"":"";}
 const error=state.err||(invalid&&!worked?"That Try link could not load. The original table is shown.":"");
 $("tool-status").textContent=error;$("tool-status").dataset.error=String(Boolean(error));
}
function press(key){
 if(mode!=="try")return;
 worked=true;recorded();state=M.step(state,key);paintTry();
}
function feedback(m){$("assess-feedback").dataset.error=String(!m.ok);$("assess-feedback").textContent=m.message;}
$("assess").addEventListener("click",()=>{worked=true;feedback(M.check(state,problem));});
field.addEventListener("input",()=>{worked=true;recorded();state={...state,buf:field.value,err:""};paintTry(true);});
$("typed").addEventListener("submit",e=>{
 e.preventDefault();worked=true;recorded();state=M.typed(state,field.value);
 paintTry();if(state.err)field.select();
});
function enterTry(device,actions){
 mode="try";returnToWatch=actions.returnToWatch;
 device.prepend(stage);$("try-grid").prepend(handheld);stage.hidden=false;
 shell.setKeys([]);shell.setInteractive(true);paintTry();stage.focus({preventScroll:true});
}
function exitTry(){
 mode="watch";stamp="";stage.hidden=true;$("typed").hidden=true;shell.setKeys([]);shell.setInteractive(false);
}
$("return").addEventListener("click",()=>returnToWatch?.());
$("reset").addEventListener("click",()=>{state=M.init();worked=true;field.value="";recorded();paintTry();stage.focus({preventScroll:true});});
document.addEventListener("keydown",e=>{
 const el=e.target;if(mode!=="try"||(!stage.contains(el)&&el!==document.body)||e.altKey||e.metaKey||e.ctrlKey)return;
 if(el===field){if(["ArrowUp","ArrowDown","Escape"].includes(e.key)){e.preventDefault();press(e.key==="Escape"?"esc":e.key==="ArrowUp"?"up":"down");if($("typed").hidden)stage.focus({preventScroll:true});}return;}
 if(el.closest("input,textarea,select,a,summary,[contenteditable]")||(el.closest("button")&&["Enter"," "].includes(e.key)))return;
 const keys={Home:"home",Escape:"esc",Enter:"enter",Tab:"tab",Backspace:"del",Delete:"del",ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down","-":"neg",".":"dot","+":"plus"};
 const k=keys[e.key]||(/^[a-z0-9]$/i.test(e.key)?e.key.toLowerCase():"");
 if(k&&(!(k==="tab")||el===stage)){e.preventDefault();if(el===document.body)stage.focus({preventScroll:true});press(k);}
});
window.CalculatorLessonAdapter=Object.freeze({initialMode:params.get("mode")==="try"||(!invalid&&problem!==M.original)?"try":"watch",renderWatch,enterTry,exitTry});
})();
