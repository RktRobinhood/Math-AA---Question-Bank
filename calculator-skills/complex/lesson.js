(function(){
'use strict';
const M=window.CT20,W=window.CT20Watch,$=id=>document.getElementById(id),stage=$('stage'),seek=$('seek'),screen=$('screen');
const params=new URLSearchParams(location.search),request=M.request(params),duration=W.duration,cues=W.chapter;
let mode='watch',t=0,origin=0,playing=false,started=false,focus=false,frame=0,stamp='',light=0,colon=false;
let practiceState=M.start(request.target.unit,'rect'), forkKey=null, forked=false;
const forks=new Map();
const edit=()=>forked?forks.get(forkKey):practiceState;
const set=s=>{if(forked)forks.set(forkKey,s);else practiceState=s;};
const shell=HandheldShell.mount({host:$('handheld-host'),screen:$('lcd'),interactive:false,label:'TI-Nspire CX II-T Calculator',onKey:k=>{physical(k);stage.focus({preventScroll:true});}});
seek.max=duration;
const tt=t=>'0:'+String(Math.floor(t)).padStart(2,'0'),pretty=v=>String(v).replaceAll('-','−').replaceAll('acos(','cos⁻¹(').replaceAll('*','×').replaceAll('/','÷').replaceAll(':=',' :=');
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
  setStatus('error',s.error||(!forked?request.error:''));
  setStatus('progress',forked?'':M.match(s,request.target));
 }
}
function setStatus(id,text){const e=$(id);e.textContent=text;e.hidden=!text;}
function physical(key){
 if(mode!=='try')return;
 const s=edit();
 clearTimeout(light);shell.setKeys(s.ctrl?['ctrl',key]:[key==='imunit'?'pi':key==='anglemark'?'catalog':key]);light=setTimeout(()=>shell.setKeys([]),175);
 set(M.press(s,key));render(edit(),false);
}
function draw(){
 if(mode!=='watch')return;const w=W.at(t),sig=JSON.stringify(w.state)+'|'+w.chapter;
 seek.value=t;seek.setAttribute('aria-valuetext',tt(t)+' of '+tt(duration));$('clock').textContent=tt(t)+' / '+tt(duration);
 shell.setKeys(w.keys);$('stage-play').hidden=started||t>0;
 if(sig!==stamp){
  stamp=sig;render(w.state,true);$('caption').textContent=cues[w.chapter][2];fit();
  [...$('chapters').children].forEach((it,i)=>it.firstElementChild.setAttribute('aria-current',String(i===w.chapter)));
 }
}
const bounded=at=>Math.min(duration,Math.max(0,Number(at)||0));
const ended=()=>t>=duration-.005;
const controls=()=>{
 const name=playing?'Pause':ended()?'Replay':'Play';$('play').textContent=name;$('play').setAttribute('aria-label',name);
 $('takeover').textContent=ended()||t===0?'Open Try':'Take over';
};
function go(at){t=bounded(at);origin=performance.now()-t*1000;draw();controls();}
function pause(){if(playing)t=bounded((performance.now()-origin)/1000);playing=false;cancelAnimationFrame(frame);draw();controls();}
function loop(now){if(!playing||mode!=='watch')return;t=bounded((now-origin)/1000);if(t>=duration){pause();return;}draw();controls();frame=requestAnimationFrame(loop);}
function nativeBottom(){return (window.visualViewport?.height||innerHeight)-(document.querySelector(".tabbar")?.getBoundingClientRect().height||0);}
function fit(){
 if(mode!=='watch')return;
 const top=Math.max(0,stage.getBoundingClientRect().top),height=nativeBottom();
 const cap=innerWidth<=700?(focus?310:280):(focus?330:305);
 const available=height-top-$('watch-message').offsetHeight-$('watch-player').offsetHeight-23;
 stage.style.setProperty('--watch-fit',Math.round(Math.max(focus?120:159,Math.min(cap,available*.475)))+'px');
}
function setFocus(next){
 focus=Boolean(next);stage.classList.toggle('focused',focus);document.body.classList.toggle('has-focus',focus);
 $('focus').setAttribute('aria-pressed',String(focus));$('focus').setAttribute('aria-label',focus?'Exit Focus':'Focus');$('focus').textContent=focus?'Exit':'Focus';
 if(focus)stage.scrollTop=0;fit();
}
function ensureFit(){
 if(mode!=='watch')return;fit();
 if(!focus&&($('watch-player').getBoundingClientRect().bottom>nativeBottom()+1||shell.body.getBoundingClientRect().width<183))setFocus(true);
}
function toggle(){
 if(mode!=='watch')return;if(playing){pause();return;}if(!started)ensureFit();
 if(document.activeElement===$('stage-play'))$('play').focus({preventScroll:true});
 started=true;if(ended())go(0);origin=performance.now()-t*1000;playing=true;draw();controls();frame=requestAnimationFrame(loop);
}
cues.forEach(([,name],i)=>{const l=elt('li');const b=button(String(i+1).padStart(2,'0')+'  '+name,()=>go(cues[i][0]));l.append(b);$('chapters').append(l);});
function taskMessage(){
 $('task').textContent=forked?'Watch copy. Edit the current entry without changing the replay.':'Find the modulus and principal argument '+(request.target.unit==='rad'?'in radians':'in degrees')+'. Display z in polar form.';
 $('target-wrap').hidden=forked;$('reset').textContent=forked?'Assigned task':'Reset';
}
$('target-wrap').textContent='z = '+M.cart(request.target.re,request.target.im);
function change(to,takeover=false,tab=false){
 if(to===mode)return;
 if(mode==='watch'){
  pause();if(focus)setFocus(false);
  if(takeover&&t>0&&!ended()){
   forkKey=Math.round(t*1000);
   if(!forks.has(forkKey)){
    if(forks.size===8)forks.delete(forks.keys().next().value);
    forks.set(forkKey,W.at(t).state);
   }
   forked=true;
  }else forked=false;
 }
 mode=to;stage.dataset.mode=mode;document.body.classList.toggle('in-try',to==='try');
 const watch=to==='watch';[$('watch-tab'),$('try-tab')].forEach((e,i)=>{const yes=(i===0)===watch;e.setAttribute('aria-selected',String(yes));e.tabIndex=yes?0:-1;});
 for(const id of ['watch','watch-message','watch-player'])$(id).hidden=!watch;
 for(const id of ['try','try-message'])$(id).hidden=watch;
 shell.setInteractive(!watch);clearTimeout(light);shell.setKeys([]);colon=false;
 if(watch){stamp='';draw();requestAnimationFrame(ensureFit);if(!tab)$('play').focus({preventScroll:true});}
 else{$('stage-play').hidden=true;taskMessage();render(edit(),false);if(!tab)stage.focus({preventScroll:true});}
}
[$('watch-tab'),$('try-tab')].forEach((b,i)=>{
 b.onclick=()=>change(i?'try':'watch');b.onkeydown=e=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
  e.preventDefault();const to=e.key==='Home'?'watch':e.key==='End'?'try':i?'watch':'try';change(to,false,true);$(to+'-tab').focus();
 };
});
$('stage-play').onclick=$('play').onclick=toggle;
$('back').onclick=()=>go(t-10);$('next').onclick=()=>go(t+10);
$('replay').onclick=()=>{pause();go(0);toggle();};$('focus').onclick=()=>setFocus(!focus);seek.oninput=()=>go(seek.value);
$('takeover').onclick=()=>change('try',true);$('return').onclick=()=>change('watch');
$('reset').onclick=()=>{if(forked)forked=false;else practiceState=M.start(request.target.unit,'rect');taskMessage();render(edit(),false);stage.focus({preventScroll:true});};
window.addEventListener('resize',ensureFit);window.visualViewport?.addEventListener('resize',ensureFit);
document.addEventListener('keydown',e=>{
 if(e.defaultPrevented||e.target.closest?.(".top, .tabbar"))return;
 if(e.key==='Escape'&&focus){e.preventDefault();setFocus(false);$('focus').focus();return;}
 if(e.isComposing||e.altKey||e.ctrlKey||e.metaKey||e.target.closest('input,select,a,summary,textarea,[contenteditable]'))return;
 const b=e.target.closest('button');
 if(mode==='watch'){
  if(b||e.repeat)return;
  if(e.key===' '||e.key==='k'){e.preventDefault();toggle();}
  if(e.key==='j'||e.key==='l'){e.preventDefault();go(t+(e.key==='j'?-10:10));}return;
 }
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
stage.dataset.mode='watch';draw();controls();
if(params.get('mode')==='try'||request.linked)change('try',false,true);
requestAnimationFrame(ensureFit);
window.QBRecordedWatch?.bind(pause);
})();
