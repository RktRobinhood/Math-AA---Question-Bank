(function(){
'use strict';
const M=window.CT19,W=window.CT19Watch,$=id=>document.getElementById(id),stage=$('stage'),seek=$('seek'),screen=$('screen');
const params=new URLSearchParams(location.search),request=M.request(params),duration=W.duration,cues=W.chapter;
let mode='watch',t=0,origin=0,playing=false,started=false,focus=false,frame=0,stamp='',light=0,colon=false;
let practiceState=M.start(request.target.unit), forkKey=null, forked=false;
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
function row(values,snapshot=null,interactive=false){
 const r=elt('span',undefined,'matrix');r.dataset.row=JSON.stringify(values);r.style.setProperty('--m-columns',values.length);
 values.forEach((v,i)=>{
  const txt=v===''?' ':pretty(v),active=snapshot?.cell===i;
  const b=interactive?button(txt,()=>{set({...edit(),cell:i});render(edit(),false);},active,false,'matrix-cell'):elt('span',txt,'matrix-cell'+(active?' calc-active':''));
  if(snapshot){b.classList.toggle('placeholder',v==='');b.setAttribute('aria-label','Component '+(i+1)+': '+(txt.trim()||'empty'));b.dataset.cell=i; }
  r.append(b);
 });return r;
}
function cursor(){return elt('i',undefined,'cursor');}
function fraction(num,den,snapshot=null){
 const frac=elt('span',undefined,'fraction');
 for(const [i,val] of [num,den].entries()){
  const cell=elt('span',val?pretty(val):' ',i?'den':'num');
  if(snapshot?.side===i){cell.append(cursor());cell.classList.add('active-frac');}
  if(snapshot&&mode==='try'){cell.role='button';cell.tabIndex=0;cell.setAttribute('aria-label',i?'Edit denominator':'Edit numerator');
   cell.onclick=()=>{set({...edit(),side:i});render(edit(),false);stage.focus({preventScroll:true});};
   cell.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();cell.click();}};
  }frac.append(cell);
 }
 return frac;
}
function logLine(e){
 const line=elt('div',undefined,'log-line');line.dataset.kind=e.kind;
 if(e.kind==='store'){line.dataset.name=e.key;line.append(elt('span',e.key+' :=','log-operation'),row(e.values));}
 else{
  const lhs=elt('span',e.label,'log-operation');
  if(e.kind==='angle'){lhs.replaceChildren(elt('span','cos⁻¹('),fraction(e.num,e.den),elt('span',')'));lhs.setAttribute('aria-label','Inverse cosine of '+e.num+' divided by '+e.den);}
  line.append(lhs,elt('strong',M.form(e.value)+(e.kind==='angle'&&e.unit==='deg'?'°':''),'log-value'));
 }
 return line;
}
function modal(s,watch){
 const m=elt('div',undefined,'lcd-modal');
 if(s.page==='menu'){
  const labels=['Calculator menu','Matrix & Vector','Create','Vector','Norms'],items=M.menu[s.menu];
  m.setAttribute('aria-label',labels[s.menu]);m.append(elt('strong',labels[s.menu],'menu-title'));
  // A small LCD shows a scrollable window of the real menu, not renumbered shortcuts.
  const first=s.menu===1?Math.max(0,Math.min(items.length-5,s.field-2)):s.menu===0?Math.max(0,Math.min(items.length-6,s.field-3)):0;
  let display=items.slice(first,first+(s.menu===0?6:5));
  if(s.menu===0&&!display.some(x=>x[0]==='7'))display=[...display.slice(0,5),items[6]];
  if(s.menu===1&&s.field===0)display=[items[0],items[1],items[2],items[6],items[11]];
  display.forEach(([id,name,next])=>{
   const b=button(id.toUpperCase()+': '+name+(next?' ▸':''),()=>physical(id),items[s.field][0]===id,watch,'menu-item');
   if(s.menu===0&&id==='7'||s.menu===1&&['1','7','c'].includes(id)||s.menu===3&&id==='3'||s.menu===4&&id==='1')b.classList.add('wanted');
   m.append(b);
  });
  return m;
 }
 if(s.page==='trig'){
  m.setAttribute('aria-label','Trigonometry palette');m.append(elt('strong','Trigonometry'));const grid=elt('div',undefined,'trig-grid');
  M.palette.forEach((v,i)=>grid.append(button(v,()=>{set({...edit(),field:i});physical('enter');},i===s.field,watch,'trig-cell')));
  m.append(grid);return m;
 }
 m.setAttribute('aria-label','Create a Matrix');m.append(elt('strong','Create a Matrix'));
 const grid=elt('div',undefined,'lcd-grid'),actions=elt('div',undefined,'lcd-actions');
 ['Number of rows','Number of columns'].forEach((name,i)=>{
  const value=button(s.dim[i]||' ',()=>{set({...edit(),field:i});render(edit(),false);},s.field===i,watch,'dim-value');
  value.setAttribute('aria-label',name+': '+(s.dim[i]||'blank'));grid.append(elt('span',name),value);
 });
 [['OK',2],['Cancel',3]].forEach(([name,i])=>actions.append(button(name,()=>{set({...edit(),field:i});physical('enter');},s.field===i,watch)));
 m.append(grid,actions);return m;
}
const hints={
 calc:'Store each vector as its own row. For the scalar use dotP; for the angle use inverse cosine with both norms.',
 menu:'For row entry: Matrix & Vector → Create → Matrix. For calculation: Vector → Dot Product, or Norms → Norm.',
 dims:'Set 1 row and 2 or 3 columns. Tab or tap to move. Confirm with Enter.',
 cells:'Type a signed value in each cell. Tab, the touchpad, or a click selects the next cell. Enter stores the row.',
 trig:'Select cos⁻¹. Then press Ctrl + ÷ for the two parts of the fraction.'
};
function render(s,watch){
 stage.dataset.lcd=s.page;$('unit').textContent=s.unit.toUpperCase();screen.replaceChildren();
 const input=elt('div',undefined,'calc-input');
 if(s.page==='cells'){input.append(elt('span',pretty(s.input)),row(s.cells,s,!watch));if(s.cell===s.cells.length)input.append(cursor());}
 else{
  // Only the two latest calculation rows appear in the available LCD area.
  const entries=s.entries.slice(s.frac?-1:-2);
  for(const e of entries)screen.append(logLine(e));
  input.append(elt('span',pretty(s.input)));
  if(s.frac)input.append(fraction(s.frac[0],s.frac[1],s),elt('span',')'));
  if(s.ctrl)input.append(elt('small','ctrl','ctrl-on'));else if(!s.frac||s.side===2)input.append(cursor());
 }
 screen.append(input);
 if(['menu','dims','trig'].includes(s.page))screen.append(modal(s,watch));
 if(s.error)screen.append(elt('div',s.error,'lcd-error'));
 if(!watch){
  let hint=hints[s.page];
  if(s.page==='calc'&&s.frac)hint=s.side===0?'Above the bar: dotP(a,b). The down arrow moves below.':s.side===1?'Below the bar: norm(a) × norm(b). Enter evaluates the full angle.':'Enter evaluates the full angle. Left returns below the fraction bar.';
  else if(s.page==='calc'&&/^[ab]:=$/.test(s.input))hint='Now open Menu → 7 → 1 → 1 to create a row vector.';
  $('hint').textContent=hint;
  const error=s.error||(!forked?request.error:'');setStatus('error',error);
  setStatus('progress',forked?'':M.status(s,request.target));
 }
}
function setStatus(id,text){const e=$(id);e.textContent=text;e.hidden=!text;}
function physical(key){
 if(mode!=='try')return;
 const s=edit();
 clearTimeout(light);shell.setKeys(s.ctrl?[key,'ctrl']:[key==='assign'?'templates':key==='frac'?'div':key]);light=setTimeout(()=>shell.setKeys([]),175);
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
 $('task').textContent=forked?'Watch copy. Edit its rows without changing the original replay.':'Find the dot product and the angle '+(request.target.unit==='rad'?'in radians.':'in degrees.');
 $('target-wrap').hidden=forked;$('reset').textContent=forked?'Assigned task':'Reset';
}
for(const k of ['a','b']){const r=elt('span',undefined,'target-row');r.append(elt('var',k),' = ',row(request.target[k]));$('target-wrap').append(r);}
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
$('reset').onclick=()=>{if(forked)forked=false;else practiceState=M.start(request.target.unit);taskMessage();render(edit(),false);stage.focus({preventScroll:true});};
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
 if(e.key===':'){colon=true;e.preventDefault();return;}
 const map={m:'menu',t:'trig',f:'frac',Escape:'esc',Enter:'enter',ArrowDown:'down',ArrowUp:'up',ArrowLeft:'left',ArrowRight:'right',Backspace:'del',Delete:'del','-':'neg','.':'dot','(':'lparen',')':'rparen',',':'comma','*':'mul','/':'div','=':colon?'assign':''};
 const s=edit(),char=e.key.length===1?e.key.toLowerCase():e.key;
 let key=map[char]||(/^[abc0-9]$/.test(char)?char:'');
 colon=false;
 if(e.key==='Tab'&&stage.contains(e.target)&&['dims','cells'].includes(s.page)){
  if(s.page==='dims'&&(e.shiftKey&&s.field===0||!e.shiftKey&&s.field===3)||s.page==='cells'&&(e.shiftKey&&s.cell===0||!e.shiftKey&&s.cell===s.cells.length))return;
  key=e.shiftKey?'backtab':'tab';
 }
 if(key){e.preventDefault();if(e.target===document.body)stage.focus({preventScroll:true});physical(key);}
});
stage.dataset.mode='watch';draw();controls();
if(params.get('mode')==='try'||request.linked)change('try',false,true);
requestAnimationFrame(ensureFit);
})();
