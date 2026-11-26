(function(){"use strict";
const C=window.StatsLesson,$=id=>document.getElementById(id),stage=$("stage");
function num(value){
 const s=String(value??"").trim().replace(/−/g,"-");
 if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(s))return null;
 const v=Number(s);return Number.isFinite(v)&&Math.abs(v)<=1e9?v:null;
}
const clone=x=>JSON.parse(JSON.stringify(x)), fmt=n=>String(Number(n.toPrecision(7))).replace(/-/g,"−");
const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const fields=C.fields.map(x=>x[0]),defaults=C.fields.map(x=>x[1]);
function parse(entry,val){
 if(entry[2])return entry[2].some(([x])=>x===val)?val:null;
 
 if(entry[0]==="list"){
  const p=String(val).trim().split(/[,;]/).map(num);
  return p.length<=12&&p.every(x=>x!==null)?p:null;
 }
 return num(val);
}
const params=new URLSearchParams(location.search);
function readProblem(fromURL=false){
 const d={...C.assigned};let any=false;
 if(fromURL&&C.input.some(([k])=>params.has(k))&&C.input.some(([k])=>params.getAll(k).length!==1)){
  return {d,error:"Linked cases need all "+C.input.map(([k])=>k).join(", ")+" exactly once.",any:true};
 }
 for(const input of C.input){
  const k=input[0];if(fromURL&&!params.has(k))continue;
  const val=fromURL?params.getAll(k):[$("input-"+k).value];any=true;
  const entered=val.length===1?parse(input,val[0]):null;
  if(entered===null)return {d:C.assigned,error:"One or more example inputs are invalid.",any};
  d[k]=entered;
 }
 return {d,error:C.validate(d),any};
}
const request=params.get("mode")==="try"?readProblem(true):{d:C.assigned,any:false,error:""};
const original=request.error?C.assigned:request.d;
const handheld=$("handheld-host");
const shell=CalculatorLessonHandset.mount(handheld,{screen:$("lcd"),label:"TI-Nspire CX II-T "+C.app+" trainer",
 onKey:k=>physical(k)});
let mode="watch",stamp=-1,light=0,returnToWatch,problem=original,warning=request.error?"Could not load that linked question. The original Try example is shown. "+request.error:"";
const initial=d=>({page:"idle",menu:0,item:0,branch:"default",field:0,replace:true,drop:null,values:[...defaults],result:null,cmd:"",data:d,error:"",row:0});
let state=initial(problem);
$("lcd-app").textContent=C.app;
$("keys-help").textContent="Keyboard: M → 5 → 5 → E. Tab changes fields. Enter inserts; Enter again evaluates.";
function inputs(spec,host,prefix,blank=false){
 for(const [k,text,opts] of spec){
  const lab=node("label",text),el=node(opts?"select":"input");lab.htmlFor=el.id=prefix+k;
  if(opts){if(blank){const start=node("option","Choose");start.value="";el.append(start);}opts.forEach(([v,n])=>{const o=node("option",n);o.value=v;el.append(o);});}
  else{el.autocomplete="off";el.spellcheck=false;el.inputMode=["list","lower","upper"].includes(k)?"text":"decimal";}
  host.append(lab,el);
 }
}
inputs(C.input,$("data-fields"),"input-");inputs(C.answers,$("answer-fields"),"answer-",true);
function fillInputs(){for(const [k] of C.input)$("input-"+k).value=Array.isArray(problem[k])?problem[k].join(", "):problem[k];}
fillInputs();
const menuList=s=>C.id==="CT50"&&s.menu===1&&s.branch==="stats"?["1: Stat Calculations","2: Stat Results","3: List Math","4: List Operations","5: Distributions"]:C.menu[s.menu];
function press(base,key){
 const s=clone(base);s.error="";
 if(key==="esc"){if(s.drop!==null)s.drop=null;else if(s.page==="menu"&&s.menu>0){s.menu--;s.item=0;}else if(s.page!=="idle")s.page="idle";return s;}
 if(key==="menu"){s.page="menu";s.menu=0;s.item=0;s.branch="default";s.drop=null;s.result=null;return s;}
 if(s.page==="menu"){
  const entries=menuList(s);
  if(key==="up"||key==="down"){s.item=(s.item+(key==="up"?-1:1)+entries.length)%entries.length;return s;}
  const chosen=((key==="right"||key==="enter")?(entries[s.item]||" ")[0]:key).toLowerCase();
  if(s.menu===0&&C.id==="CT50"&&chosen==="6"){s.branch="stats";s.menu=1;s.item=0;return s;}
  if(chosen!==C.path[s.menu])return s;
  if(s.menu<2){s.menu++;s.item=0;return s;}
  s.page=C.setup?"setup":"wizard";s.field=0;s.replace=true;s.values=[...defaults];return s;
 }
 if(s.page==="setup"){
  if(key==="enter"){s.page="wizard";s.field=0;}return s;
 }
 if(s.page==="idle"&&s.data.list&&["up","down"].includes(key)){s.row=Math.max(0,Math.min(s.data.list.length-5,s.row+(key==="up"?-1:1)));return s;}
 if(s.page==="entry"&&key==="enter"){
  try{s.result=C.evaluate(s.values,num,s.data);s.page="result";}catch(e){s.error=e.message;}return s;
 }
 if(s.page!=="wizard")return s;
 if(s.drop!==null){
  const opts=C.choices[s.field];
  if(["up","left","down","right"].includes(key))s.drop=(s.drop+(key==="up"||key==="left"?-1:1)+opts.length)%opts.length;
  if(key==="tab"||key==="enter"){s.values[s.field]=opts[s.drop];s.drop=null;if(key==="tab")s.field=(s.field+1)%(fields.length+2);s.replace=true;}
  return s;
 }
 if(key==="tab"||key==="shift-tab"||key==="up"||key==="down"){
  s.field=(s.field+(key==="up"||key==="shift-tab"?fields.length+1:1))%(fields.length+2);s.replace=true;return s;
 }
 if((key==="right"||key==="left")&&C.choices[s.field]){s.drop=Math.max(0,C.choices[s.field].indexOf(s.values[s.field]));return s;}
 if(key==="enter"){
  if(s.field===fields.length+1){s.page="idle";return s;}
  try{
   C.evaluate(s.values,num,s.data);
   if(C.twoEnter){s.cmd=C.command(s.values);s.page="entry";}
   else{s.result=C.evaluate(s.values,num,s.data);s.page="result";}
  }catch(e){s.error=e.message;}
  return s;
 }
 if(s.field>=fields.length||C.choices[s.field]||s.data.list&&s.field>1)return s;
 const ch=/^[0-9]$/.test(key)?key:{"dot":".","neg":"−","minus":"−","ee":"e","e":"e"}[key];
 if(key==="del"){s.values[s.field]=s.replace?"":s.values[s.field].slice(0,-1);s.replace=false;}
 if(ch!==undefined){s.values[s.field]=s.replace?ch:(s.values[s.field]+ch).slice(0,21);s.replace=false;}
 return s;
}
const btn=(text,active,click)=>{const b=node("button",text,active?"calc-active":"");b.type="button";if(click)b.addEventListener("click",click);else b.disabled=true;return b;};
function renderLCD(s,watch){
 const d=$("lcd-body");d.replaceChildren();let description="";
 if(s.page==="menu"){
  const rows=menuList(s);description=rows.join("; ");
  const ul=node("ul",undefined,"menu-list");
  rows.forEach((v,i)=>{const li=node("li");li.append(btn(v,s.item===i,watch?null:()=>physical(v[0])));ul.append(li);});d.append(ul);
 }else if(s.page==="setup"){
  const panel=node("div",undefined,"wizard");panel.append(node("strong",C.title),node("span",C.setup+": Data"),btn("OK",true,watch?null:()=>physical("enter")));d.append(panel);
  description=C.setup+": Data";
 }else if(s.page==="wizard"){
  const panel=node("div",undefined,"wizard"),grid=node("fieldset"),actions=node("div",undefined,"actions");
  panel.append(node("strong",C.title));fields.forEach((name,i)=>{
   const opt=C.choices[i],b=btn(s.values[i]+(opt?" ▾":""),s.field===i,watch?null:()=>{
    state={...state,field:i,drop:null,replace:true};if(opt)physical("right");else{paintTry();stage.focus({preventScroll:true});}
   });
   b.setAttribute("aria-label",name+": "+s.values[i]);grid.append(node("span",name),b);
  });
  actions.append(btn("OK",s.field===fields.length,watch?null:()=>{state={...state,field:fields.length};physical("enter");}),btn("Cancel",s.field===fields.length+1,watch?null:()=>physical("esc")));panel.append(grid,actions);
  if(s.drop!==null){
   const drop=node("div",undefined,"dropdown");C.choices[s.field].forEach((v,i)=>drop.append(btn(v,s.drop===i,watch?null:()=>{state={...state,drop:i};physical("tab");stage.focus({preventScroll:true});})));panel.append(drop);
  }
  d.append(panel);description=C.title+". "+fields.map((f,i)=>f+": "+s.values[i]).join("; ")+(s.drop===null?"":"; Choose "+C.choices[s.field][s.drop]);
 }else if(s.page==="entry"||s.page==="result"&&!s.data.list){
  const line=node("p",s.cmd,"lcd-command");d.append(line);
  description=s.cmd;if(s.result){d.append(node("p",C.display(s.result)[0][1],"lcd-number"));description+=" = "+C.display(s.result)[0][1];}
 }else if(s.page==="result"){
  const table=node("table",undefined,"lcd-sheet result"),b=table.createTBody();
  b.insertRow().append(node("th",""),node("th","B"),node("th","C"));
  C.display(s.result).forEach(([label,val],i)=>b.insertRow().append(node("th",String(i+1)),node("td",label),node("td",val)));d.append(table);
  description=C.display(s.result).map(([l,v])=>l+" "+v).join("; ");
 }else if(s.data.list){
  const table=node("table",undefined,"lcd-sheet data-sheet"),b=table.createTBody();
  b.insertRow().append(node("th",""),node("th","A"),node("th","B"));
  b.insertRow().append(node("th",""),node("td","readings"),node("td",""));
  s.data.list.slice(s.row,s.row+5).forEach((v,i)=>b.insertRow().append(node("th",String(i+s.row+1)),node("td",fmt(v)),node("td","")));
  d.append(table);description="Column A readings: "+s.data.list.map(fmt).join(", ");
 }else{d.append(node("p","▏","lcd-command"));description="Calculator ready.";}
 $("lcd-text").textContent=description;handheld.dataset.scene=stage.dataset.scene=s.page;
}
const frames=[initial(C.demo)];
for(const [,key] of C.keys)frames.push(press(frames.at(-1),key));
function renderWatch(device,{beat,point,crossed,key}){
 if(handheld.parentElement!==device)device.append(handheld);
 const count=crossed.length,physicalKey=C.keys[count-1]?.[1];
 const hold=point.span.end-point.span.voiceEnd;
 const lit=physicalKey&&!point.speaking&&key?.beat===beat&&(point.fraction-key.at)*hold<.65;
 shell.setKeys(lit?[physicalKey]:[]);
 if(stamp!==count){stamp=count;renderLCD(frames[count],true);}
}
function shown(id,v){$(id).hidden=!v;}
function status(id,text,bad=false){const e=$(id);e.textContent=text;e.dataset.error=String(bad);}
function paintTry(){
 renderLCD(state,false);
 $("try-context").textContent=C.task(problem);
 status("tool-status",state.error||warning,Boolean(state.error||warning));
 shown("given-list",!!state.data.list);
 if(state.data.list)$("given-list").textContent="Column A: "+state.data.list.map(fmt).join(", ");
}
function update(next){state=next;warning="";status("assess-feedback","");paintTry();}
function physical(k){
 if(mode!=="try")return;
 if(document.activeElement!==stage)stage.focus({preventScroll:true});
 clearTimeout(light);shell.setKeys([k]);light=setTimeout(()=>shell.setKeys([]),160);update(press(state,k));
}
$("data-form").addEventListener("submit",e=>{
 e.preventDefault();const draft=readProblem();
 if(draft.error){status("tool-status",draft.error,true);return;}
 problem=draft.d;$("answer").reset();update(initial(problem));$("edit-details").open=false;stage.focus({preventScroll:true});
});
function match(given,expected){
 const x=num(given);if(x===null||!Number.isFinite(expected))return false;
 return x===expected||Array.from({length:10},(_,i)=>i+3).some(n=>x===Number(expected.toPrecision(n)))||Math.abs(x-expected)<=Math.abs(expected)*3e-8;
}
$("answer").addEventListener("submit",e=>{
 e.preventDefault();const a=Object.fromEntries(C.answers.map(([k])=>[k,$("answer-"+k).value]));
 const msg=!state.result||state.page!=="result"?"Run the handheld calculation before checking.":C.grade(problem,state.result,a,match);
 status("assess-feedback",msg||C.success,Boolean(msg));
});
$("answer").addEventListener("input",()=>status("assess-feedback",""));
function sizeTry(){
 if(mode!=="try")return;
 const height=window.visualViewport?.height||innerHeight;
 const top=handheld.getBoundingClientRect().top+window.scrollY;
 const available=Math.floor(Math.max(0,height-top-9)*558/1168);
 stage.style.setProperty("--try-fit",Math.max(150,Math.min(307,available))+"px");
}
const observer=new ResizeObserver(sizeTry);observer.observe($("try-header"));
window.addEventListener("resize",sizeTry);window.visualViewport?.addEventListener("resize",sizeTry);
function enterTry(device,actions){
 mode="try";returnToWatch=actions.returnToWatch;document.body.classList.add("stats-try");
 device.prepend(stage);$("try-grid").prepend(handheld);stage.hidden=false;
 clearTimeout(light);shell.setKeys([]);shell.setInteractive(true);paintTry();sizeTry();
}
function exitTry(){
 mode="watch";stage.hidden=true;stamp=-1;document.body.classList.remove("stats-try");
 clearTimeout(light);shell.setKeys([]);shell.setInteractive(false);
}
$("return").onclick=()=>returnToWatch?.();
$("reset").onclick=()=>{
 problem=original;state=initial(problem);warning="";fillInputs();$("answer").reset();$("edit-details").open=false;status("assess-feedback","");
 paintTry();stage.focus({preventScroll:true});
};
document.addEventListener("keydown",e=>{
 const el=e.target;
 if(mode!=="try"||e.defaultPrevented||e.isComposing||e.altKey||e.metaKey||e.ctrlKey||
    el.closest("input,textarea,select,a,summary,[contenteditable],.top,.tabbar"))return;
 if((!stage.contains(el)&&el!==document.body)||(el.closest("button")&&["Enter"," "].includes(e.key)))return;
 if(e.key==="Tab"&&el===stage&&state.page==="wizard"){e.preventDefault();physical(e.shiftKey?"shift-tab":"tab");return;}
 const keys={m:"menu",M:"menu",Escape:"esc",Enter:"enter",Backspace:"del",Delete:"del",ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down","-":"neg",".":"dot",e:"e",E:"e"};
 const k=keys[e.key]||(/^[0-9]$/.test(e.key)?e.key:"");if(k){
  e.preventDefault();
  // A direct Try URL initially has the body focused. The first calculator
  // shortcut opts into the stage so the upcoming wizard Tab selects a field.
  if(el===document.body)stage.focus({preventScroll:true});
  physical(k);
 }
});
window.CalculatorLessonAdapter=Object.freeze({
 initialMode:params.get("mode")==="try"?"try":"watch",
 renderWatch,enterTry,exitTry
});
})();
