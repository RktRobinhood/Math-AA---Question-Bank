(function(){"use strict";
const M=window.CT57,$=id=>document.getElementById(id),stage=$("stage"),screen=$("screen");
const params=new URLSearchParams(location.search),request=M.request(params);
let mode="watch",stamp="",s=M.start(),light=0,returnToWatch;
let target=request.target,linkError=request.error;
const handheld=$("handheld-host");
const shell=CalculatorLessonHandset.mount(handheld,{screen:$("lcd"),interactive:false,label:"TI-Nspire CX II-T Calculator",onKey:k=>{physical(k);stage.focus({preventScroll:true});}});
const tape=M.tape.map(([,k])=>k),frames=[M.start()];
for(const k of tape)frames.push(M.press(frames.at(-1),k));
const pretty=v=>String(v).replace(/-/g,"−");
const elt=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
function label(text,action,active,watch,cls){
 const b=elt("button",text,cls);b.type="button";
 if(active)b.classList.add("calc-active");
 if(watch)b.disabled=true;else if(action)b.addEventListener("click",action);
 return b;
}
const show=v=>pretty(v).replaceAll("*","·").replaceAll("^2","²");
function plot(node,task){
 const setup=M.setup(task),mid=(setup.a+setup.b)/2,r=M.evalPoly(setup.inner,mid),R=M.evalPoly(setup.outer,mid),rad=R>0?32*r/R:0,anchor=65-rad;
 const cap=elt("figcaption",rad>0?"Cross-section sketch · not on TI screen":"Disk sketch · not on TI screen","plot-label");
 const ns="http://www.w3.org/2000/svg",el=(tag,props)=>{const n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(props))n.setAttribute(k,v);return n;};
 const svg=el("svg",{viewBox:"0 0 132 89",role:"img","aria-label":rad>0?"Washer cross-section with an outer radius R and inner radius r.":"A disk cross-section with radius R and no hole."});
 svg.append(el("circle",{cx:62,cy:43,r:32,class:"washer"}));
 if(rad>0)svg.append(el("circle",{cx:62,cy:43,r:rad,class:"hole"}));
 svg.append(el("line",{x1:62,y1:43,x2:85,y2:21,class:"radius"}));
 const lab=el("text",{x:91,y:20,class:"axis-text"});lab.textContent="R";svg.append(lab);
 if(rad>0){svg.append(el("line",{x1:62,y1:43,x2:62-rad,y2:43,class:"radius"}));const tag=el("text",{x:Math.max(27,anchor-19),y:57,class:"axis-text"});tag.textContent="r";svg.append(tag);}
 node.replaceChildren(svg,cap);node.hidden=false;
}
function controls(snapshot,watch){
 const modal=elt("div",undefined,"lcd-modal");
 if(snapshot.showPi){
  modal.classList.add("symbol-sheet");modal.setAttribute("aria-label","π symbols");
  modal.append(label("π",()=>physical("enter"),true,watch,"symbol"));
  for(const v of ["e","i","E","∞","θ","→","_","▷","°"])modal.append(elt("span",v,"symbol"));
  return modal;
 }
 const level=snapshot.page==="menu"?0:1,title=level?"Calculus":"Calculator menu",list=M.menus[level],at=snapshot.menu;
 modal.setAttribute("aria-label",title);modal.append(elt("strong",title,"menu-title"));
 let from=at>=4?Math.min(list.length-5,at-3):0;from=Math.max(0,from);
 for(const [i,[id,name]] of list.entries())if(i>=from&&i<from+5){
  modal.append(label(id+": "+name+(!level&&id===4?" ▸":""),()=>physical(String(id)),i===at,watch,"menu-item"));
 }
 return modal;
}
function render(snapshot,watch){
 stage.dataset.lcd=snapshot.page; screen.replaceChildren();
 const line=elt("div",undefined,"calc-input integral-line");
 if(snapshot.pi)line.append(elt("span",snapshot.mul?"π ·":"π","integral-factor"));
 if(snapshot.page==="template"||snapshot.page==="result"||snapshot.fields.some(Boolean)){
  const term=elt("span",undefined,"integral-term");
  const field=(i,cls)=>{
   const raw=snapshot.fields[i],v=raw?show(raw):"□",active=snapshot.field===i&&snapshot.page==="template";
   const n=watch||snapshot.page!=="template"?elt("span",v,"iterm "+cls+(active?" calc-active":"")):label(v,()=>{s={...s,field:i};render(s,false);stage.focus({preventScroll:true});},active,false,"iterm "+cls);
   n.dataset.slot=i;n.setAttribute("aria-label",(["Lower bound","Upper bound","Integrand","Variable"][i])+": "+(v==="□"?"blank":v));return n;
  };
  const integral=elt("span","∫","integral-sign"),bounds=elt("span",undefined,"integral-bounds");bounds.append(field(1,"bound"),integral,field(0,"bound"));term.append(bounds,field(2,"integrand"),elt("span","d"),field(3,"variable"));line.append(term);
 }else if(!snapshot.showPi&&snapshot.page==="calc")line.append(elt("i",undefined,"cursor"));
 screen.append(line);
 if(snapshot.result){
  const n=elt("div",pretty(Number(snapshot.result.value.toPrecision(7))),"integral-result");n.dataset.value=String(snapshot.result.value);screen.append(n);
 }
 if(["menu","submenu"].includes(snapshot.page)||snapshot.showPi)screen.append(controls(snapshot,watch));
 if(snapshot.error)screen.append(elt("div",snapshot.error.split(". ")[0],"lcd-error"));
 if(watch){
  $("watch-study").hidden=!snapshot.result;if(snapshot.result)plot($("watch-plot"),M.worked);
 }else{
  const p=$("progress"),ok=snapshot.result&&M.matches(snapshot.result,M.setup(target));
  p.textContent=!snapshot.result?"":ok?"Task complete. Write "+Number(snapshot.result.value.toPrecision(7))+" cubic units before rounding.":"That calculation does not use the assigned interval and washer-area formula.";
  p.hidden=!p.textContent;
  if(ok)plot($("try-plot"),target);else $("try-plot").hidden=true;
  const h=snapshot.page==="calc"?"Enter π and ×. Then open Menu → 4 → 2.":snapshot.page==="template"?"Tab: lower bound, upper bound, the difference of squares, then x after d. Press Enter.":snapshot.result?"Read the result in cubic units.":"Choose Calculus → Numerical Definite Integral.";
  $("hint").textContent=h;
  const error=snapshot.error||linkError||"";$("error").textContent=error;$("error").hidden=!error;
 }
}
function physical(key){
 if(mode!=="try")return;
 clearTimeout(light);
 const keys=[key];
 shell.setKeys(keys);light=setTimeout(()=>shell.setKeys([]),175);
 s=M.press(s,key);render(s,false);
}
function targetDraw(){
 $("target-wrap").replaceChildren(elt("span","R = "+show(target.outer)),elt("span","r = "+show(target.inner)),elt("span",show(target.lower)+" ≤ x ≤ "+show(target.upper)));
 M.allKeys.forEach(k=>$("edit-"+k).value=target[k]);
}
targetDraw();
function renderWatch(device,{beat,point,crossed,key}){
 if(handheld.parentElement!==device)device.append(handheld);
 const count=crossed.length,pressed=tape[count-1];
 const lit=pressed&&!point.speaking&&key?.beat===beat&&(point.fraction-key.at)*(point.span.end-point.span.voiceEnd)<.65;
 shell.setKeys(lit?[pressed]:[]);
 const next=beat+":"+count;if(stamp===next)return;stamp=next;render(frames[count],true);
}
function enterTry(device,actions){
 mode="try";returnToWatch=actions.returnToWatch;device.prepend(stage);$("try-grid").prepend(handheld);stage.hidden=false;
 $("watch-study").hidden=true;clearTimeout(light);shell.setKeys([]);shell.setInteractive(true);$("task").textContent="Find the volume about the x-axis.";render(s,false);stage.focus({preventScroll:true});
}
function exitTry(){
 mode="watch";stage.hidden=true;stamp="";clearTimeout(light);shell.setKeys([]);shell.setInteractive(false);
}
$("return").onclick=()=>returnToWatch?.();
$("reset").onclick=()=>{s=M.start();render(s,false);stage.focus({preventScroll:true});};
$("edit-form").onsubmit=e=>{
 e.preventDefault();
 const msg=$("edit-error");
 try{
  const draft=Object.fromEntries(M.allKeys.map(k=>[k,$("edit-"+k).value]));M.setup(draft);target=draft;linkError="";s=M.start();
  targetDraw();render(s,false);msg.hidden=true;$("edit").open=false;stage.focus({preventScroll:true});
 }catch(error){msg.textContent=error.message;msg.hidden=false;}
};
document.addEventListener("keydown",e=>{
 if(e.defaultPrevented||e.target.closest?.(".top, .tabbar"))return;
 if(e.altKey||e.ctrlKey||e.metaKey||e.isComposing||e.target.closest("input,select,a,summary,textarea,[contenteditable]"))return;
 const b=e.target.closest("button");
 if(mode!=="try")return;
 if((!stage.contains(e.target)&&e.target!==document.body)||(b&&["Enter"," ","Tab"].includes(e.key)))return;
 const map={m:"menu",M:"menu",p:"pi",P:"pi",Escape:"esc",Enter:"enter",ArrowDown:"down",ArrowUp:"up",ArrowLeft:"left",ArrowRight:"right",Backspace:"del",Delete:"del","-":"minus","+":"plus","×":"mul","*":"mul","^":"square",".":"dot","(":"lparen",")":"rparen"};
 let key=map[e.key]||(/^[x0-9]$/i.test(e.key)?e.key.toLowerCase():"");
 if(e.key==="Tab"&&s.page==="template"&&!(e.shiftKey&&s.field===0||!e.shiftKey&&s.field===3))key=e.shiftKey?"backtab":"tab";
 if(key){e.preventDefault();if(e.target===document.body)stage.focus({preventScroll:true});physical(key);}
});
window.CalculatorLessonAdapter=Object.freeze({initialMode:params.get("mode")==="try"||request.linked?"try":"watch",renderWatch,enterTry,exitTry});
})();
