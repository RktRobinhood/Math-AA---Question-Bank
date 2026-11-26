(function(){"use strict";
const M=window.CT18,$=id=>document.getElementById(id),stage=$("stage");
const request=M.request(new URLSearchParams(location.search));
const fmt=v=>String(v).replaceAll("-","−"),pair=p=>"("+p.map(fmt).join(", ")+")";
const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const shown=(id,visible)=>$(id).hidden=!visible;
const status=(id,text,bad=false)=>{const e=$(id);e.textContent=text;e.dataset.error=String(bad);};
let mode="watch",light=0,returnToWatch,target=request.target,notice=request.error,state=M.start();
const handheld=$("handheld-host");
const shell=CalculatorLessonHandset.mount(handheld,{screen:$("lcd"),interactive:false,label:"TI-Nspire CX II-T Calculator",onKey:physical});
const fields=[["a","Site A (x, y)"],["b","Site B (x, y)"],["c","Site C (x, y)"],["p","Target P (x, y)"],["values","Readings A, B, C"]];
for(const [k,text] of fields){
 const l=node("label",text),el=node("input");el.name=k;el.required=true;el.maxLength=60;
 el.autocomplete="off";el.spellcheck=false;l.append(el);$("data-fields").append(l);
}
function resetInputs(){
 const form=$("data-form"),d=M.encode(target);
 for(const [k] of fields)form.elements[k].value=d[k];
}
function resetAssessment(){$("answer").reset();shown("value-wrap",false);status("assess-feedback","");}
function typedText(n,s){
 const chunks=s.split("²");chunks.forEach((part,i)=>{
  if(i)n.append(node("sup","2"));
  if(part)n.append(document.createTextNode(M.pretty(part)));
 });
}
function renderLCD(s){
 const d=$("lcd-body"); d.replaceChildren();
 const hist=node("div",undefined,"arithmetic-history");
 s.history.slice(-2).forEach(o=>{
  const row=node("div",undefined,"arithmetic-row"),exp=node("p",undefined,"arithmetic-expr");
  typedText(exp,o.text);const value=node("p",fmt(o.value),"arithmetic-result");value.dataset.result=o.value;
  row.append(exp,value);hist.append(row);
 });
 const entry=node("div",undefined,"arithmetic-in"),caret=node("span",undefined,"arithmetic-caret");caret.setAttribute("aria-hidden","true");
 typedText(entry,s.raw.slice(0,s.cursor));entry.append(caret);typedText(entry,s.raw.slice(s.cursor));d.append(hist,entry);
 if(s.error)d.append(node("p",s.error.includes("rehearsal")?"Use Calculator arithmetic.":"Check entry", "calculator-error"));
 entry.scrollLeft=Math.max(0,caret.offsetLeft-entry.clientWidth+8);
 $("lcd-text").textContent=[...s.history.slice(-2).map(r=>M.pretty(r.text)+" equals "+r.value),s.raw?"Entry: "+M.pretty(s.raw):"Calculator ready."].join("; ");
 stage.dataset.scene=s.error?"error":s.raw?"entry":s.result?"result":"idle";
}
function map(host,d,{edge=false,highlight=""}={}){
 const pts=M.ids.map(s=>[s,...d[s.toLowerCase()]]).concat([["P",...d.p]]);
 const minX=Math.min(...pts.map(([,x])=>x)),maxX=Math.max(...pts.map(([,x])=>x)),minY=Math.min(...pts.map(([,x,y])=>y)),maxY=Math.max(...pts.map(([,x,y])=>y));
 const cx=(minX+maxX)/2,cy=(minY+maxY)/2,scale=Math.min(29,234/Math.max(5,maxX-minX),140/Math.max(4,maxY-minY));
 const x=v=>135+(v-cx)*scale,y=v=>90-(v-cy)*scale;
 const ns="http://www.w3.org/2000/svg";
 const e=(tag,attrs={})=>{const n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);return n;};
 const svg=e("svg",{viewBox:"0 0 270 180",class:"voronoi-map",role:"img","aria-label":pts.map(([s,a,b])=>s+" "+pair([a,b])).join("; ")+(edge?"; A–B nearest-site boundary is drawn below its meeting point with the third site's cell.":"")});
 for(let u=minX-1;u<=maxX+1;u++)svg.append(e("line",{x1:x(u),x2:x(u),y1:0,y2:180,class:"map-grid"}));
 for(let v=minY-1;v<=maxY+1;v++)svg.append(e("line",{x1:0,x2:270,y1:y(v),y2:y(v),class:"map-grid"}));
 if(edge)svg.append(e("line",{x1:x(4),x2:x(4),y1:180,y2:y(2.7),class:"map-edge"}));
 if(highlight){
  for(const site of highlight){
   const [sx,sy]=d[site.toLowerCase()];svg.append(e("line",{x1:x(sx),y1:y(sy),x2:x(d.p[0]),y2:y(d.p[1]),class:"map-link"}));
  }
 }
 pts.forEach(([site,u,v])=>{
  const px=x(u),py=y(v),isP=site==="P";
  svg.append(e(isP?"rect":"circle",isP?{x:px-4,y:py-4,width:8,height:8,rx:1,class:"map-target"}:{cx:px,cy:py,r:4.75,class:"map-site"}));
  const t=e("text",{x:Math.min(251,px+8),y:Math.max(13,Math.min(173,py+(isP?14:-7))),class:"map-name"});
  t.textContent=site;svg.append(t);
 });
 const caption=node("figcaption",(edge?"A–B boundary · ":"")+"Lesson map · not the TI screen");
 (typeof host==="string"?$(host):host).replaceChildren(svg,caption);
}
function targetDraw(){
 $("givens").replaceChildren(node("span","P "+pair(target.p)),...M.ids.map((s,i)=>node("span",s+" "+pair(target[s.toLowerCase()])+" → "+target.values[i])));
 map("try-plot",target);
}
function press(k){
 if(mode!=="try")return;
 if(document.activeElement!==stage)stage.focus({preventScroll:true});
 clearTimeout(light);shell.setKeys([k]);light=setTimeout(()=>shell.setKeys([]),160);
 state=M.press(state,k);
 status("tool-status",state.error||notice,Boolean(state.error||notice));
 renderLCD(state);
}
function physical(k){press(k);}
function paintTry(){
 $("try-context").textContent="Give the estimate at P using the nearest site’s reading. No tie-break rule is given.";
 status("tool-status",state.error||notice,Boolean(state.error||notice));
 targetDraw();renderLCD(state);
}
$("answer-rule").onchange=()=>shown("value-wrap",$("answer-rule").value==="value");
$("answer").oninput=()=>status("assess-feedback","");
$("answer").onsubmit=e=>{
 e.preventDefault();
 const a=Object.fromEntries(["da","db","dc","near","rule","value"].map(k=>[k,$("answer-"+k).value]));
 const result=M.grade(target,state,a);status("assess-feedback",result.feedback,!result.ok);
};
$("data-form").onsubmit=e=>{
 e.preventDefault();
 try{
  target=M.parse(Object.fromEntries(new FormData(e.currentTarget)));notice="";state=M.start();
  $("edit-details").open=false;status("edit-feedback","");resetInputs();resetAssessment();paintTry();stage.focus({preventScroll:true});
 }catch(err){status("edit-feedback",err.message,true);}
};
const physicalLabel={"Enter":"enter","x²":"square","−":"minus","(−)":"neg","+":"plus","(":"lparen",")":"rparen"};
const frames=[M.start()];let previousAction=-1;
const board=node("figure",undefined,"watch-map");board.hidden=true;board.setAttribute("aria-label","Lesson diagram, not the calculator screen");
function renderWatch(device,{beat,chapter,point,crossed,key}){
 if(handheld.parentElement!==device)device.append(handheld);
 if(board.parentElement!==device.parentElement)device.after(board);
 for(let i=frames.length-1;i<crossed.length;i++){
   const k=physicalLabel[crossed[i].label]||crossed[i].label;
   frames.push(M.press(frames[i],k));
 }
 const n=crossed.length,k=key&&(physicalLabel[key.label]||key.label);
 const lit=n&&!point.speaking&&key?.beat===beat&&(point.fraction-key.at)*(point.span.end-point.span.voiceEnd)<.62;
 shell.setKeys(lit?[k]:[]);
 const stamp=n+"-"+chapter+"-"+point.speaking;
 if(previousAction===stamp)return;
 previousAction=stamp;renderLCD(frames[n]);
 const show=["read-map","copy-reading","no-unique"].includes(chapter)||(chapter==="check-boundary"&&point.speaking);
 const hadBoard=!board.hidden;board.hidden=!show;
 if(show&&(!hadBoard||board.dataset.chapter!==chapter)){
   board.dataset.chapter=chapter;
   const boundary=beat>=5;
   map(board,boundary?M.boundary:M.demo,{edge:boundary,highlight:chapter==="read-map"?"":boundary?"AB":"A"});
 }
}
function enterTry(device,actions){
 mode="try";returnToWatch=actions.returnToWatch;device.prepend(stage);$("try-deck").prepend(handheld);stage.hidden=false;board.hidden=true;
 shell.setKeys([]);shell.setInteractive(true);paintTry();stage.focus({preventScroll:true});
}
function exitTry(){
 mode="watch";stage.hidden=true;previousAction=-1;clearTimeout(light);shell.setKeys([]);shell.setInteractive(false);
}
$("return").onclick=()=>returnToWatch?.();
$("reset").onclick=()=>{state=M.start();notice="";resetAssessment();paintTry();stage.focus({preventScroll:true});};
resetInputs();resetAssessment();
document.addEventListener("keydown",e=>{
 if(e.target!==document.body&&!e.target.closest?.(".qb-calculator-lesson"))return;
 const el=e.target;if(e.altKey||e.metaKey||e.ctrlKey||e.isComposing||el.closest("input,textarea,select,a,summary,[contenteditable]"))return;
 if(mode!=="try"||e.defaultPrevented||e.target.closest?.(".top, .tabbar"))return;
 if((!stage.contains(el)&&el!==document.body)||(el.closest("button")&&["Enter"," "].includes(e.key)))return;
 const keys={m:"menu",M:"menu",Escape:"esc",Enter:"enter",Backspace:"del",Delete:"del",ArrowLeft:"left",ArrowRight:"right","-":/[\d)²]/.test(state.raw[state.cursor-1]??"")?"minus":"neg","−":"minus","+":"plus","*":"mul","×":"mul","(":"lparen",")":"rparen",s:"square",S:"square","²":"square"};
 const k=keys[e.key]||(/^[0-9]$/.test(e.key)?e.key:"");if(k){e.preventDefault();press(k);}
});
window.CalculatorLessonAdapter=Object.freeze({initialMode:new URLSearchParams(location.search).get("mode")==="try"||request.linked?"try":"watch",renderWatch,enterTry,exitTry});
})();
