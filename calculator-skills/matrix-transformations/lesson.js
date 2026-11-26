(function(){"use strict";
const M=window.CT22,$=id=>document.getElementById(id),stage=$("stage"),screen=$("screen");
const params=new URLSearchParams(location.search),request=M.request(params);
let mode="watch",s=M.start(),light=0,stamp=-1,returnToWatch;
let colon=false,target=request.target,linkError=request.error;
const handheld=$("handheld-host");
const shell=CalculatorLessonHandset.mount(handheld,{screen:$("lcd"),interactive:false,label:"TI-Nspire CX II-T Calculator",onKey:k=>{physical(k);stage.focus({preventScroll:true});}});
const pretty=v=>String(v).replace(/-/g,"−");
const elt=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
function label(text,action,active,watch,cls){
 const b=elt("button",text,cls);b.type="button";
 if(active)b.classList.add("calc-active");
 if(watch)b.disabled=true;else if(action)b.addEventListener("click",action);
 return b;
}
function matrix(rows,{snapshot=null,interactive=false,fixed=false,toDisplay=pretty}={}){
 const m=elt("span",undefined,"matrix");m.style.setProperty("--m-columns",rows[0].length);m.dataset.matrix=JSON.stringify(rows);
 rows.forEach((row,i)=>row.forEach((v,j)=>{
  const idx=i*row.length+j,active=snapshot?.cell===idx,symbol=v===""?" ":toDisplay(v);
  const a=interactive?label(symbol,()=>{s={...s,cell:idx};render(s,false);stage.focus({preventScroll:true});},active,false,"matrix-cell"):elt("span",symbol,"matrix-cell"+(active?" calc-active":""));
  if(snapshot){ a.classList.toggle("placeholder",v==="");a.setAttribute("aria-label","Row "+(i+1)+", column "+(j+1)+(v===""?", empty":": "+v)); a.dataset.cell=idx; }
  if(fixed)a.classList.add("fixed");
  m.append(a);
 }));
 return m;
}
function expression(s){
 const out=elt("span",s.input.replace(":="," := ").replace("×"," · "));
 if(s.ctrl)out.append(elt("small","ctrl","ctrl-on"));
 else out.append(elt("i",undefined,"cursor"));
 return out;
}
function logLine(entry){
 const row=elt("div",undefined,"log-line");row.dataset.kind=entry.kind;
 row.append(elt("span",entry.name.replace("×"," · "),"log-operation"));
 const v=matrix(entry.result);v.classList.add("log-value");row.append(v);return row;
}
function plot(node,entry){
 if(!M.isImage(entry)){node.hidden=true;node.replaceChildren();return;}
 const P=entry.right.map(r=>r[0]),Q=entry.result.map(r=>r[0]),pair=v=>"("+v.map(pretty).join(", ")+")";
 const cap=elt("figcaption"),axis=elt("span","Coordinate sketch · not on TI screen","plot-label");
 const marks=elt("span",undefined,"plot-legend");
 marks.append(elt("span","P "+pair(P),"plot-original"),elt("span","P′ "+pair(Q),"plot-image"));
 cap.append(axis,marks);
 const ns="http://www.w3.org/2000/svg",el=(tag,props)=>{const n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(props))n.setAttribute(k,v);return n;};
 const svg=el("svg",{viewBox:"0 0 200 166",role:"img","aria-label":"Original point "+pair(P)+" and image point "+pair(Q)+". Both axes have the same scale."});
 const limit=Math.max(2,...P.map(Math.abs),...Q.map(Math.abs)),S=64/limit;
 const line=(x1,y1,x2,y2,className)=>el("line",{x1,y1,x2,y2,class:className});
 for(const i of [-2,-1,1,2]){
  svg.append(line(100+i*32,15,100+i*32,151,"grid-line"),line(32,83+i*32,168,83+i*32,"grid-line"));
 }
 svg.append(line(26,83,177,83,"plot-axis"),line(100,156,100,9,"plot-axis"));
 for(const [name,x,y] of [["x",181,87],["y",105,15]]){
  const t=el("text",{x,y,class:"axis-text"});t.textContent=name;svg.append(t);
 }
 for(const [i,vec] of [P,Q].entries()){
  const [x,y]=[100+vec[0]*S,83-vec[1]*S],className=i?"vector-new":"vector-old";
  svg.append(line(100,83,x,y,className));
  if(i){svg.append(el("path",{d:"M"+x+" "+(y-5)+" l5 5 -5 5 -5 -5 z",class:"point-new"}));}
  else svg.append(el("circle",{cx:x,cy:y,r:7,class:"point-old"}));
 }
 node.replaceChildren(svg,cap);node.hidden=false;
}
function controls(snapshot,watch){
 const modal=elt("div",undefined,"lcd-modal");
 if(snapshot.page==="menu"){
  const names=["Calculator menu","Matrix & Vector","Create"];
  modal.setAttribute("aria-label",names[snapshot.menu]);modal.append(elt("strong",names[snapshot.menu],"menu-title"));
  const entries=M.menus[snapshot.menu],offset=snapshot.menu===0?(snapshot.field>=5?4:0):0;
  for(const [i,[id,name]] of entries.entries())if(i>=offset&&i<offset+5){
   modal.append(label(id+": "+name+((id===7&&snapshot.menu===0||id===1&&snapshot.menu===1)?" ▸":""),()=>physical(String(id)),i===snapshot.field,watch,"menu-item"));
  }
  if(snapshot.menu===0&&offset===0)modal.append(label("7: Matrix & Vector ▸",()=>physical("7"),snapshot.field===6,watch,"menu-item wanted"));
  return modal;
 }
 modal.setAttribute("aria-label","Create a Matrix");modal.append(elt("strong","Create a Matrix"));
 const grid=elt("div",undefined,"lcd-grid"),actions=elt("div",undefined,"lcd-actions");
 ["Number of rows","Number of columns"].forEach((text,i)=>{
  const b=label(snapshot.dim[i]||" ",()=>{s={...s,field:i};render(s,false);stage.focus({preventScroll:true});},snapshot.field===i,watch,"dim-value");
  b.setAttribute("aria-label",text+": "+(snapshot.dim[i]||"blank"));grid.append(elt("span",text),b);
 });
 [["OK",2],["Cancel",3]].forEach(([text,i])=>actions.append(label(text,()=>{s={...s,field:i};physical("enter");},snapshot.field===i,watch)));
 modal.append(grid,actions);return modal;
}
function render(snapshot,watch){
 stage.dataset.lcd=snapshot.page;screen.replaceChildren();
 const text=elt("div",undefined,"calc-input");
 if(snapshot.page==="cells"){
  const C=Number(snapshot.dim[1]),rows=Array.from({length:Number(snapshot.dim[0])},(_,i)=>snapshot.cells.slice(i*C,(i+1)*C));
  if(snapshot.input.endsWith(":="))text.append(elt("span",snapshot.input.replace(":="," :="),"entry-prefix"));
  text.append(matrix(rows,{snapshot,interactive:!watch}));
  if(snapshot.cell===snapshot.cells.length)text.append(elt("i",undefined,"cursor"));
 }else{
  for(const entry of snapshot.history.slice(-2))screen.append(logLine(entry));
  text.append(expression(snapshot));
 }
 screen.append(text);
 if(snapshot.page==="menu"||snapshot.page==="dims")screen.append(controls(snapshot,watch));
 if(snapshot.error)screen.append(elt("div",snapshot.error.split(". ")[0].replace(/\.$/,""),"lcd-error"));
 const newest=snapshot.history.at(-1);
 if(watch){plot($("watch-plot"),newest);$("watch-study").hidden=!M.isImage(newest);}
 else{
  const hints={
   calc:!snapshot.vars.t?"Store the 2×2 matrix as t. Type t, then Ctrl + template. Open Menu → 7 → 1 → 1.":!snapshot.vars.p?"Store the point as p. Open the same menu and choose 2 rows and 1 column.":"Type t × p, then Enter. Read the upper coordinate before the lower.",
   menu:"Choose Matrix & Vector → Create → Matrix.",dims:"Set the number of rows and columns. Tab to OK, then Enter.",
   cells:"Enter each row from left to right. Use Tab to move on. Press Enter to store."
  };
  $("hint").textContent=hints[snapshot.page];
  const error=snapshot.error||linkError||"";$("error").textContent=error;$("error").hidden=!error;
  const isImage=M.isImage(newest)&&!snapshot.error;
  const ok=isImage&&M.same(newest.left,target.matrix)&&M.same(newest.right,target.point.map(x=>[x]));
  const progress=$("progress");
  progress.textContent=isImage?(ok?"Task complete. The top entry is x′; the bottom entry is y′.":"This product used different values from the exercise. Compare your stored matrices with the prompt."):"";
  progress.hidden=!progress.textContent;
  plot($("try-plot"),isImage?newest:null);
 }
}
function physical(key){
 if(mode!=="try")return;
 clearTimeout(light);
 const keys=s.ctrl&&key==="templates"?["ctrl","templates"]:[key==="assign"?"templates":key];
 shell.setKeys(keys);light=setTimeout(()=>shell.setKeys([]),175);
 s=M.press(s,key);render(s,false);
}
function targetDraw(){
 $("target-wrap").replaceChildren(elt("span","t ="),matrix(target.matrix,{fixed:true}),elt("span","P = ("+target.point.map(pretty).join(", ")+")"));
 $("edit-matrix").value=target.matrix.map(row=>row.join(",")).join(";");
 $("edit-point").value=target.point.join(",");
}
targetDraw();
function taskMode(){$("task").textContent="Find the image of P. Write (x′, y′).";}
const tape=M.tape.map(x=>x[1]),frames=[M.start()];
for(const k of tape)frames.push(M.press(frames.at(-1),k));
function renderWatch(device,{beat,point,crossed,key}){
 if(handheld.parentElement!==device)device.append(handheld);
 const n=crossed.length,lit=n&&!point.speaking&&key?.beat===beat&&(point.fraction-key.at)*(point.span.end-point.span.voiceEnd)<.62;
 shell.setKeys(lit?(tape[n-1]==='templates'?['ctrl','templates']:[tape[n-1]]):[]);
 if(stamp===n)return;stamp=n;render(frames[n],true);
}
function enterTry(device,actions){
 mode="try";returnToWatch=actions.returnToWatch;device.prepend(stage);$("try-deck").prepend(handheld);stage.hidden=false;$("watch-study").hidden=true;
 shell.setKeys([]);shell.setInteractive(true);colon=false;taskMode();render(s,false);stage.focus({preventScroll:true});
}
function exitTry(){
 mode="watch";stage.hidden=true;stamp=-1;clearTimeout(light);shell.setKeys([]);shell.setInteractive(false);
}
$("return").onclick=()=>returnToWatch?.();
$("reset").onclick=()=>{s=M.start();colon=false;taskMode();render(s,false);stage.focus({preventScroll:true});};
$("edit-form").onsubmit=e=>{
 e.preventDefault();
 const msg=$("edit-error");
 try{
  target=M.parse($("edit-matrix").value,$("edit-point").value);linkError="";s=M.start();colon=false;
  targetDraw();render(s,false);msg.hidden=true;$("edit").open=false;stage.focus({preventScroll:true});
 }catch(error){msg.textContent=error.message;msg.hidden=false;}
};
document.addEventListener("keydown",e=>{
 if(e.defaultPrevented||e.target.closest?.(".top, .tabbar"))return;
 if(e.altKey||e.ctrlKey||e.metaKey||e.isComposing||e.target.closest("input,select,a,summary,textarea,[contenteditable]"))return;
 const b=e.target.closest("button");
 if(mode!=="try")return;
 if((!stage.contains(e.target)&&e.target!==document.body)||(b&&["Enter"," ","Tab"].includes(e.key)))return;
 if(e.key===":"){colon=true;e.preventDefault();return;}
 const map={m:"menu",M:"menu",Escape:"esc",Enter:"enter",ArrowDown:"down",ArrowUp:"up",ArrowLeft:"left",ArrowRight:"right",Backspace:"del",Delete:"del","-":"neg","×":"mul","*":"mul","=":colon?"assign":""};
 let key=map[e.key]||(/^[tp0-9]$/i.test(e.key)?e.key.toLowerCase():"");
 colon=false;
 if(e.key==="Tab"&&["dims","cells"].includes(s.page)){
  if(s.page==="dims"&&(e.shiftKey&&s.field===0||!e.shiftKey&&s.field===3)||s.page==="cells"&&(e.shiftKey&&s.cell===0||!e.shiftKey&&s.cell===s.cells.length))return;
  key=e.shiftKey?"backtab":"tab";
 }
 if(key){e.preventDefault();if(e.target===document.body)stage.focus({preventScroll:true});physical(key);}
});
window.CalculatorLessonAdapter=Object.freeze({initialMode:params.get("mode")==="try"||request.linked?"try":"watch",renderWatch,enterTry,exitTry});
})();
