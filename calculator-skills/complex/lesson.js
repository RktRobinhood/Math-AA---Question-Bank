(function(){
'use strict';
const M=window.CT20,$=id=>document.getElementById(id),stage=$('stage'),screen=$('screen');
const params=new URLSearchParams(location.search),request=M.request(params);
let mode="watch",light=0,colon=false,returnToWatch,state=M.start(request.target.unit,"rect");
const edit=()=>state,set=s=>{state=s;};
const handheld=$("handheld-host");
const shell=CalculatorLessonHandset.mount(handheld,{screen:$("lcd"),interactive:false,label:"TI-Nspire CX II-T Calculator",onKey:k=>{physical(k);stage.focus({preventScroll:true});}});
const pretty=v=>String(v).replaceAll('-','−').replaceAll('acos(','cos⁻¹(').replaceAll('*','×').replaceAll('/','÷').replaceAll(':=',' :=');
const elt=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
function button(text,action,active=false,watch=false,cls=''){
 const b=elt('button',text,cls);b.type='button';
 if(active)b.classList.add('calc-active');if(watch)b.disabled=true;else if(action)b.addEventListener('click',()=>{action();stage.focus({preventScroll:true});});
 return b;
}
const label=['1: New Document','2: My Documents','3: Recent','4: Current','5: Settings'];
function logLine(e){
 const line=elt('div',undefined,'log-line');line.dataset.kind=e.kind;
 line.append(elt('span',pretty(e.input),'log-operation'));
 let out;
 if(e.kind!=='polar'||e.r===0)out=elt('strong',e.out,'log-value');
 else if(e.unit==='rad'){out=elt('strong',M.form(e.r)+'e','log-value');out.append(elt('sup',(e.theta===0?'0':M.form(e.theta))+'𝑖'));}
 else out=elt('strong','('+M.form(e.r)+'∠'+M.form(e.theta)+(e.unit==='deg'?'°':'')+')','log-value');
 line.append(out);return line;
}
function modal(s,watch){
 const m=elt('div',undefined,'lcd-modal');
 function act(text,k,i,action){return button(text,action||(()=>physical(k)),i===s.field,watch,'menu-item');}
 if(s.page==='symbols'){
  m.setAttribute('aria-label','Math Symbols Palette');
  m.append(elt('strong','Math Symbols'));const grid=elt('div',undefined,'symbols-grid');
  M.symbol.forEach((sym,i)=>grid.append(act(sym,'enter',i,()=>{set({...edit(),field:i});physical('enter');})));
  m.append(grid);return m;
 }
 if(s.page==='commands'){
  m.setAttribute('aria-label','Catalog');m.append(elt('strong','Catalog · 1'));
  M.catalogue(s).forEach((v,i)=>m.append(act(v,'enter',i,()=>{set({...edit(),field:i});physical('enter');})));
  return m;
 }
 if(s.page==='home'||s.page==='home-settings'){
  m.append(elt('strong',s.page==='home'?'Home':'Settings'));
  (s.page==='home'?label:['1: Language','2: Document Settings','3: Graphs & Geometry','4: Handheld Setup']).forEach(txt=>m.append(act(txt,txt[0],-1)));
  return m;
 }
 m.setAttribute('aria-label','Document Settings');m.append(elt('strong','Document Settings'));
 const grid=elt('div',undefined,'lcd-grid'),actions=elt('div',undefined,'lcd-actions');
 const vals=['Float 6',M.unitText[M.units.indexOf(s.unit)],'Normal',M.formatText[M.formats.indexOf(s.format)],'Auto','On'];
 M.fields.slice(0,6).forEach((name,i)=>{
  const action=()=>{set({...edit(),field:i,select:null});physical('right');};
  grid.append(elt('span',name),button(vals[i]+([1,3].includes(i)?' ▾':''),action,i===s.field&&!s.select,watch||![1,3].includes(i),'dim-value'));
 });
 ['OK','Cancel'].forEach((name,i)=>actions.append(button(name,()=>{set({...edit(),field:i+6,select:null});physical('enter');},s.field===i+6,watch)));
 m.append(grid,actions);
 if(s.select){
  const g=elt('div',undefined,'lcd-select');(s.select==='angle'?M.unitText:M.formatText).forEach((v,i)=>g.append(act(v,'enter',i,()=>{set({...edit(),field:i});physical('enter');})));m.append(g);
 }
 return m;
}
const hints={
 calc:'Use abs(z) for the modulus and angle(z) for the principal argument. Select the imaginary unit from the π palette. To display the number in polar form, use Document Settings or Catalog → P → ►Polar.',
 settings:'Select Degree or Radian as requested. Use Rectangular for a + bi or Polar for radius and argument. Tab to OK, then choose Current.',
 symbols:'Choose the imaginary unit 𝑖 rather than the ordinary letter i. For a polar entry, choose ∠.'
};
function render(s,watch){
 stage.dataset.lcd=s.page;$('unit').textContent=s.unit.toUpperCase();
 screen.replaceChildren();
 const input=elt('div',undefined,'calc-input');
 for(const e of s.hist.slice(-2))screen.append(logLine(e));
 input.append(elt('span',pretty(s.input)));
 if(s.ctrl)input.append(elt('small','ctrl','ctrl-on'));
 else input.append(elt('i',undefined,'cursor'));
 screen.append(input);
 if(s.page!=='calc')screen.append(modal(s,watch));
 if(s.error)screen.append(elt('div',s.error,'lcd-error'));
 if(!watch){
  $('hint').textContent=hints[s.page]||'Select Document Settings or the relevant Catalog command.';
  setStatus('error',s.error||request.error);
  setStatus('progress',M.match(s,request.target));
 }
}
function setStatus(id,text){const e=$(id);e.textContent=text;e.hidden=!text;}
function physical(key){
 if(mode!=='try')return;
 const s=edit();
 clearTimeout(light);shell.setKeys(s.ctrl?['ctrl',key]:[key==='imunit'?'pi':key==='anglemark'?'catalog':key]);light=setTimeout(()=>shell.setKeys([]),175);
 set(M.press(s,key));render(edit(),false);
}
function taskMessage(){
 $("task").textContent="Find the modulus and principal argument "+(request.target.unit==="rad"?"in radians":"in degrees")+". Display z in polar form.";
 $("target-wrap").textContent="z = "+M.cart(request.target.re,request.target.im);
}
const physicalLabel={"Home":"home","Ctrl":"ctrl","Enter":"enter","Tab":"tab","(−)":"neg","+":"plus","π":"pi","→":"right","↓":"down","↑":"up","(":"lparen",")":"rparen"};
const frames=[M.start()];let previousAction=-1;
function renderWatch(device,{beat,point,crossed,key}){
 if(handheld.parentElement!==device)device.append(handheld);
 for(let i=frames.length-1;i<crossed.length;i++){
   const k=physicalLabel[crossed[i].label]||crossed[i].label;
   frames.push(M.press(frames[i],k));
 }
 const n=crossed.length,k=key&&(physicalLabel[key.label]||key.label);
 const lit=n&&!point.speaking&&key?.beat===beat&&(point.fraction-key.at)*(point.span.end-point.span.voiceEnd)<.62;
 shell.setKeys(lit?(frames[n-1].ctrl?["ctrl",k]:[k]):[]);
 if(previousAction===n)return;
 previousAction=n;render(frames[n],true);
}
function enterTry(device,actions){
 mode="try";returnToWatch=actions.returnToWatch;device.prepend(stage);$("try-deck").prepend(handheld);stage.hidden=false;
 shell.setKeys([]);shell.setInteractive(true);colon=false;taskMessage();render(state,false);stage.focus({preventScroll:true});
}
function exitTry(){
 mode="watch";stage.hidden=true;previousAction=-1;clearTimeout(light);shell.setKeys([]);shell.setInteractive(false);
}
$("return").onclick=()=>returnToWatch?.();
$("reset").onclick=()=>{
 state=M.start(request.target.unit,"rect");colon=false;taskMessage();render(state,false);stage.focus({preventScroll:true});
};
document.addEventListener('keydown',e=>{
 if(e.defaultPrevented||e.target.closest?.(".top, .tabbar"))return;
 if(e.isComposing||e.altKey||e.ctrlKey||e.metaKey||e.target.closest('input,select,a,summary,textarea,[contenteditable]'))return;
 const b=e.target.closest('button');
 if(mode!=='try')return;
 if((!stage.contains(e.target)&&e.target!==document.body)||(b&&['Enter',' ','Tab'].includes(e.key)))return;
 if(e.key==='@'){colon=true;e.preventDefault();return;}
 const symbols={Escape:'esc',Enter:'enter',ArrowDown:'down',ArrowUp:'up',ArrowLeft:'left',ArrowRight:'right',Backspace:'del',Delete:'del',Home:'home','-':'neg','.':'dot','(':'lparen',')':'rparen','+':'plus','*':'mul','∠':'anglemark','<':colon?'anglemark':''};
 const s=edit(),char=e.key.length===1?e.key.toLowerCase():e.key;
 let key=(char==='i'&&colon?'imunit':symbols[char])||(/^[a-z0-9]$/.test(char)?char:'');
 colon=false;
 if(e.key==='Tab'&&stage.contains(e.target)&&s.page==='settings'&&!s.select){
  if(e.shiftKey&&s.field===0||!e.shiftKey&&s.field===7)return;
  key=e.shiftKey?'backtab':'tab';
 }
 if(key){e.preventDefault();if(e.target===document.body)stage.focus({preventScroll:true});physical(key);}
});
window.CalculatorLessonAdapter=Object.freeze({initialMode:params.get("mode")==="try"||request.linked?"try":"watch",renderWatch,enterTry,exitTry});
})();
