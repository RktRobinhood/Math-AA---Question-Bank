(function(){
"use strict";
const M=CT17,$=id=>document.getElementById(id),stage=$("stage");
const p=new URLSearchParams(location.search),link=M.request(p),original=link.d;
const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;return e;};
const button=(text,fn,active=false,watch=false)=>{const b=node("button",text,active?"calc-active":"");b.type="button";b.disabled=watch||!fn;if(!b.disabled)b.onclick=fn;return b;};
let mode="watch",light=0,returnToWatch;
let current=M.initial(),problem={...original},warning=link.error,assess="";
const handheld=$("handheld-host");
const shell=CalculatorLessonHandset.mount(handheld,{screen:$("lcd"),interactive:false,label:"TI-Nspire CX II-T Calculator",onKey:physical});
const label={east:"East component (km)",north:"North component (km)",up:"Vertical component (km)"};
const answers={horizontal:"Horizontal distance (km)",bearing:"Clockwise bearing (°)",elevation:"Signed elevation (°)",diagonal:"Sloping distance (km)"};
const refs={};
// Align the shared shell's decorative square-root legend with the official real key.
const powerLegend=shell.body.querySelector('[data-hh-key="power"] + .hh-secondary');
if(powerLegend)shell.body.querySelector('[data-hh-key="square"]').after(powerLegend);

function addFields(def,host,prefix){
 for(const [k,txt] of Object.entries(def)){
  const lab=node("label",txt),input=node("input");
  lab.htmlFor=input.id=prefix+k;input.inputMode=k==="bearing"?"numeric":"decimal";input.maxLength=26;input.autocomplete="off";input.spellcheck=false;
  $(host).append(lab,input);refs[input.id]=input;
 }
}
addFields(label,"data-fields","problem-");addFields(answers,"answer-fields","answer-");
const sign=n=>String(n).replace("-","−"), showAnswers=()=>{for(const k in answers)refs["answer-"+k].value="";};
function fill(){for(const k in label)refs["problem-"+k].value=sign(problem[k]);}
fill();

function compass(host,d){
 const target=typeof host==="string"?$(host):host;target.replaceChildren();
 const uri="http://www.w3.org/2000/svg",el=(tag,attributes,text)=>{const g=document.createElementNS(uri,tag);Object.entries(attributes).forEach(([k,v])=>g.setAttribute(k,v));if(text)g.textContent=text;return g;};
 const s=el("svg",{viewBox:"0 0 220 149",role:"img","aria-label":"Top view from the base, north up, east right; "+M.direction(d).word+" displacement. Horizontal plan only."});
 const X=107,Y=73,scale=50/Math.max(Math.abs(d.east),Math.abs(d.north)),x=X+d.east*scale,y=Y-d.north*scale;
 s.append(el("line",{x1:24,y1:Y,x2:192,y2:Y,class:"comp-axis"}),el("line",{x1:X,y1:14,x2:X,y2:132,class:"comp-axis"}));
 const ticks=[["N",X,10,"middle"],["S",X,145,"middle"],["W",13,Y+4,"middle"],["E",204,Y+4,"middle"]];
 for(const [text,tx,ty,anchor] of ticks)s.append(el("text",{x:tx,y:ty,"text-anchor":anchor},text));
 s.append(el("path",{d:`M ${X} ${Y} H ${x} V ${y}`,class:"comp-proj"}));
 s.append(el("line",{x1:X,y1:Y,x2:x,y2:y,class:"comp-run"}));
 // A fixed north-to-east marker teaches the clockwise convention without measuring or giving the answer.
 s.append(el("path",{d:`M ${X} ${Y-23} A 23 23 0 0 1 ${X+23} ${Y}`,class:"comp-arc"}),el("path",{d:`M ${X+19} ${Y-5} L ${X+23} ${Y} L ${X+27} ${Y-5}`,class:"comp-arc"}));
 s.append(el("circle",{cx:X,cy:Y,r:2.7,class:"base"}),el("circle",{cx:x,cy:y,r:3.8,class:"drone"}));
 s.append(el("text",{x:x+(x>X?7:-7),y:y+(y>Y?-7:13),"text-anchor":x>X?"start":"end",class:"point-label"},"P"));
 s.append(el("text",{x:X-5,y:Y-5,"text-anchor":"end",class:"point-label"},"O"));
 target.append(s,node("p","Plan only · O is the base, P is the horizontal projection.","comp-note"));
}
compass("try-sketch",problem);
const pretty=str=>str.replaceAll("sqrt","√").replaceAll("asin","sin⁻¹").replaceAll("acos","cos⁻¹").replaceAll("atan","tan⁻¹").replaceAll("^2","²").replaceAll("*","×").replaceAll("/","÷").replaceAll("-","−");
function expression(target,raw,cursor=null){
 const caret=()=>{const i=node("span",null,"arithmetic-caret");i.setAttribute("aria-hidden","true");return i;};
 const hasRoot=raw.startsWith("sqrt(")&&raw.endsWith(")")&&!raw.slice(5,-1).includes(")");
 if(hasRoot){
  const cap=node("span","√","root-sign"),under=node("span",null,"root-inner"),inside=raw.slice(5,-1);
  if(cursor!=null&&cursor<5)target.append(caret());
  target.append(cap,under);
  if(cursor==null||cursor<5||cursor>=raw.length)under.textContent=pretty(inside);
  else under.append(document.createTextNode(pretty(inside.slice(0,cursor-5))),caret(),document.createTextNode(pretty(inside.slice(cursor-5))));
  if(cursor===raw.length)target.append(caret());
 }else if(cursor===null)target.textContent=pretty(raw);
 else target.append(document.createTextNode(pretty(raw.slice(0,cursor))),caret(),document.createTextNode(pretty(raw.slice(cursor))));
}
function draw(s,watch){
 const body=$("lcd-body");body.replaceChildren();
 $("lcd-mode").textContent=s.mode.toUpperCase();
 $("lcd-app").textContent=s.view==="home"||s.view==="settings-menu"?"Home":s.view==="settings"?"Settings":"Calculator";
 stage.dataset.scene=s.view;
 const act=k=>()=>physical(k);
 const click=(txt,fn,a=false)=>button(txt,fn,a,watch);
 let mirror="";
 if(s.view==="home"||s.view==="settings-menu"){
  const home=node("div",null,"home-grid"),a=node("div"),b=node("div");
  a.append(node("b","Scratchpad"),click("A Calculate",null),click("B Graph",null));
  b.append(node("b","Documents"),click("1 New…",null),click("2 Browse…",null),click("3 Recent…",null),click("4 Current",act("4")),click("5 Settings…",act("5"),s.view==="settings-menu"));
  home.append(a,b);body.append(home);mirror="Home. 4 Current, 5 Settings.";
  if(s.view==="settings-menu"){
   const drop=node("div",null,"settings-list");
   ["1 Change Language","2 Document Settings","3 Graphs & Geometry","4 Handheld Setup","5 Status"].forEach((name,i)=>drop.append(click(name,i===1?act("2"):null,i===1)));
   body.append(drop);mirror="Settings. 2 Document Settings.";
  }
 }else if(s.view==="settings"){
  const panel=node("div",null,"lcd-dialog"),rows=node("div",null,"lcd-fields"),buttons=node("div",null,"lcd-actions");
  panel.append(node("strong","Document Settings"),rows,buttons);
  ["Float 6",M.forms[s.draft],"Normal","Real","Auto","On"].forEach((value,i)=>{
   rows.append(node("span",M.settings[i]));
   const b=click(value,i===1?()=>update({...current,field:1,drop:true,choice:M.modes.indexOf(current.draft)}):null,s.field===i);
   b.setAttribute("aria-label",M.settings[i]+": "+value);rows.append(b);
  });
  buttons.append(click("OK",()=>update(M.press(M.press(current,"point-ok"),"select")),s.field===6),click("Cancel",act("esc"),s.field===7));
  if(watch&&s.field===6){const arrow=node("span","➤","ok-pointer");arrow.setAttribute("aria-hidden","true");buttons.firstElementChild.append(arrow);}
  if(s.drop){
   const drop=node("div",null,"angle-options");
   M.modes.forEach((m,i)=>drop.append(click(M.forms[m],()=>update(M.press({...current,choice:i},"enter")),i===s.choice)));
   panel.append(drop);
  }
  body.append(panel);
  mirror="Document Settings. Angle "+M.forms[s.draft]+". "+(s.drop?"Select Radian, Degree or Gradian.":"Field: "+M.settings[s.field]+".");
 }else{
  const hist=node("div",null,"arithmetic-history");
  for(const r of s.hist.slice(-2)){
   const row=node("div",null,"arithmetic-row"),ex=node("p",null,"arithmetic-expr");
   expression(ex,r.raw);row.append(ex,node("p",M.display(r.value),"arithmetic-result"));hist.append(row);
  }
  const input=node("p",null,"arithmetic-in");expression(input,s.raw,s.cursor);body.append(hist,input);
  mirror=[...s.hist.slice(-2).map(r=>pretty(r.raw)+" = "+M.display(r.value)),s.raw?"Entry: "+pretty(s.raw):"Calculator ready."].join("; ");
  if(s.view==="palette"){
   const panel=node("div",null,"trig-grid");panel.setAttribute("role","group");panel.setAttribute("aria-label","Trig symbol palette");
   M.fnames.forEach((name,i)=>{const b=click(M.glyph(s,i),()=>update(M.chooseTrig(current,i)),i===s.trig);b.setAttribute("aria-label",i>=6?"Inverse "+name.slice(1):name);panel.append(b);});
   body.append(panel);mirror+=" Trig palette. Selected "+M.glyph(s,s.trig)+".";
  }
  if(s.ctrl){const c=node("span","ctrl","ctrl-ind");c.setAttribute("aria-hidden","true");body.append(c);}
 }
 $("lcd-text").textContent=mirror;
}
function paintTry(){
 const active=document.activeElement?.closest?.("#lcd-body");
 draw(current,false);
 if(active)stage.focus({preventScroll:true});
 const h=k=>sign(problem[k]);
 $("try-context").textContent="Find the lengths, bearing and signed elevation. E "+h("east")+" · N "+h("north")+" · up "+h("up")+" km";
 $("tool-status").textContent=current.error||warning;$("tool-status").dataset.error=String(Boolean(current.error||warning));
 $("assess-feedback").textContent=assess;
}
function update(s){current=s;if(mode==="try")paintTry();}
function physical(key){
 if(mode!=="try")return;
 if(document.activeElement!==stage)stage.focus({preventScroll:true});
 clearTimeout(light);shell.setKeys(current.ctrl?["ctrl",key]:[key]);light=setTimeout(()=>shell.setKeys([]),180);
 warning="";assess="";
 update(M.press(current,key));
}
$("data-form").onsubmit=e=>{
 e.preventDefault();
 const d=Object.fromEntries(M.ids.map(k=>[k,M.number(refs["problem-"+k].value)])),err=M.validate(d);
 if(err){warning=err;paintTry();return;}
 problem=d;warning="";assess="";current=M.initial();showAnswers();compass("try-sketch",problem);$("edit-details").open=false;paintTry();stage.focus({preventScroll:true});};
$("answer").onsubmit=e=>{
 e.preventDefault();
 const msg=M.grade(problem,Object.fromEntries(Object.keys(answers).map(k=>[k,refs["answer-"+k].value])),current.hist);
 assess=msg||"Correct. The bearing uses the horizontal plan; the elevation and sloping distance also use the height.";
 $("assess-feedback").dataset.error=String(Boolean(msg));paintTry();
};
$("answer").oninput=()=>{assess="";$("assess-feedback").textContent="";};

const physicalLabel={"Home":"home","Enter":"enter","x²":"square","−":"minus","+":"plus","÷":"div","Ctrl":"ctrl","Tab":"tab","→":"right","↓":"down","trig":"trig","Centre click":"select"};
const frames=[M.initial()];let previousAction=-1;
const board=node("figure",undefined,"watch-map compass");board.hidden=true;board.setAttribute("aria-label","Compass plan. Not the calculator screen");
function renderWatch(device,{beat,chapter,point,crossed,key}){
 if(handheld.parentElement!==device)device.append(handheld);
 if(board.parentElement!==device.parentElement)device.after(board);
 for(let i=frames.length-1;i<crossed.length;i++){
   const k=physicalLabel[crossed[i].label]||crossed[i].label;
   frames.push(M.press(k==="select"?M.press(frames[i],"point-ok"):frames[i],k));
 }
 const n=crossed.length,k=key&&(physicalLabel[key.label]||key.label);
 const lit=n&&!point.speaking&&key?.beat===beat&&(point.fraction-key.at)*(point.span.end-point.span.voiceEnd)<.62;
 shell.setKeys(lit?(frames[n-1].ctrl?["ctrl",k]:[k]):[]);
 const aiming=chapter==="degree"&&n===7&&!point.speaking&&point.fraction>=.72;
 const stamp=n+"-"+chapter+"-"+aiming;
 if(previousAction===stamp)return;
 previousAction=stamp;draw(aiming?M.press(frames[n],"point-ok"):frames[n],true);
 const show=chapter==="plan"||chapter==="rounded";
 if(show&&board.hidden)compass(board,M.demo);
 board.hidden=!show;
}
function enterTry(device,actions){
 mode="try";returnToWatch=actions.returnToWatch;device.prepend(stage);$("try-deck").prepend(handheld);stage.hidden=false;board.hidden=true;
 shell.setKeys([]);shell.setInteractive(true);paintTry();stage.focus({preventScroll:true});
}
function exitTry(){
 mode="watch";stage.hidden=true;previousAction=-1;clearTimeout(light);shell.setKeys([]);shell.setInteractive(false);
}
$("return").onclick=()=>returnToWatch?.();
$("reset").onclick=()=>{
 problem={...original};current=M.initial();warning="";assess="";fill();showAnswers();compass("try-sketch",problem);
 $("edit-details").open=false;paintTry();stage.focus({preventScroll:true});
};
const map={Home:"home",Escape:"esc",Backspace:"del",Delete:"del",Enter:"enter",ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down",
 "-":"minus","+":"plus","/":"div","*":"mul","^":"power",".":"dot","(":"lparen",")":"rparen",s:"square",t:"trig",c:"ctrl"};
document.addEventListener("keydown",e=>{
 if(e.target!==document.body&&!e.target.closest?.(".qb-calculator-lesson"))return;
 const el=e.target;
 if(e.altKey||e.metaKey||e.ctrlKey||e.isComposing||el.closest?.("input,textarea,select,a,summary,[contenteditable]"))return;
 if(!stage.contains(el)&&el!==document.body)return;
 if(mode!=="try"||e.defaultPrevented||e.target.closest?.(".top, .tabbar"))return;
 if(el.closest?.("button")&&["Enter"," "].includes(e.key))return;
 const key=map[e.key]||(/^[0-9]$/.test(e.key)?e.key:e.key==="Tab"&&current.view==="settings"&&!current.drop&&!e.shiftKey&&current.field!==7?"tab":null);
 if(key){e.preventDefault();physical(key);}
});
window.CalculatorLessonAdapter=Object.freeze({initialMode:p.get("mode")==="try"||link.valid||link.error?"try":"watch",renderWatch,enterTry,exitTry});
})();
