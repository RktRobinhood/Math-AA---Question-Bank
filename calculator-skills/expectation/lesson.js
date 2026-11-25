(function(){
'use strict';
const M=window.CT36,W=window.CT36Watch,$=id=>document.getElementById(id),stage=$('stage'),seek=$('seek'),screen=$('screen');
const params=new URLSearchParams(location.search),request=M.request(params),duration=W.duration,cues=W.chapter;
let mode='watch',t=0,origin=0,playing=false,started=false,focus=false,frame=0,stamp='',light=0,colon=false;
let touched=false;
let practiceState=M.start(request.data), forkKey=null, forked=false;
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
function render(s,watch){
 stage.dataset.lcd='calc';screen.replaceChildren();
 for(const e of s.history.slice(-2)){
  const r=elt('div',undefined,'log-line');r.dataset.kind=e.type||'other';
  r.append(elt('span',pretty(e.raw),'log-operation'),elt('strong',pretty(e.result),'log-value'));screen.append(r);
 }
 const input=elt('div',undefined,'calc-input'),line=elt('span',undefined,'entry-expression');
 line.append(document.createTextNode(pretty(s.input.slice(0,s.at))),
  elt('i',undefined,'cursor'),document.createTextNode(pretty(s.input.slice(s.at))));
 input.append(line);if(s.ctrl)input.append(elt('span','ctrl','ctrl-on'));screen.append(input);
 if(s.error)screen.append(elt('div',s.error,'lcd-error'));
 if(!watch){
  $('hint').textContent='Check the total with + first. Then enter one product per row and add the products.';
  setStatus('error',s.error||(!forked&&!touched?request.error:''));
  setStatus('progress',forked?'':M.progress(s));writeTable(s.data);
  if(!$('edit-distribution').open){$('x-edit').value=s.data.x.join(', ');$('p-edit').value=s.data.p.join(', ');}
 }
}
function setStatus(id,text){const e=$(id);e.textContent=text;e.hidden=!text;}
function physical(key){
 if(mode!=='try')return;
 const s=edit();
 clearTimeout(light);shell.setKeys(s.ctrl?['ctrl',key]:[key]);light=setTimeout(()=>shell.setKeys([]),175);
 if(!forked)touched=true;set(M.press(s,key));render(edit(),false);
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
function writeTable(d){
 const t=elt('table',undefined,'dist-table');t.setAttribute('aria-label','Practice distribution: outcome and probability');
 const tbody=t.createTBody();
 for(const [values,lead] of [[d.x,'x'],[d.p,'P(X=x)']]){
  const row=tbody.insertRow(),h=elt('th',lead);h.scope='row';row.append(h);
  for(const v of values)row.append(elt('td',pretty(v)));
 }
 $('target-wrap').replaceChildren(t);
}
function taskMessage(){
 $('task').textContent=forked?'Watch copy. Change the draft without changing playback.':'Check the probabilities, then find the expectation.';
 $('reset').textContent=forked?'Assigned task':'Reset';
 $('edit-distribution').hidden=forked;
}
$('edit-form').onsubmit=e=>{
 e.preventDefault();const st=edit(),chunks=v=>v.split(',').map(x=>x.trim());
 const next=M.resetData(st,chunks($('x-edit').value),chunks($('p-edit').value));
 if(!next.error){touched=true;$('edit-distribution').open=false;}
 set(next);render(next,false);
 if(!next.error)stage.focus({preventScroll:true});
};
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
 shell.setInteractive(!watch);clearTimeout(light);shell.setKeys([]);shell.body.querySelectorAll('.hh-tap').forEach(k=>k.classList.remove('hh-tap'));colon=false;
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
$('reset').onclick=()=>{$('edit-distribution').open=false;if(forked)forked=false;else{touched=true;practiceState=M.start(request.data);};taskMessage();render(edit(),false);stage.focus({preventScroll:true});};
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
 const chars={Escape:'esc',Enter:'enter',ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',Backspace:'del',Delete:'del','-':'neg','.':'dot','(':'lparen',')':'rparen','+':'plus','*':'mul','×':'mul'};
 const key=chars[e.key]||(/^\d$/.test(e.key)?e.key:'');
 if(key){e.preventDefault();if(e.target===document.body)stage.focus({preventScroll:true});physical(key);}
});
stage.dataset.mode='watch';draw();controls();
if(params.get('mode')==='try'||request.linked)change('try',false,true);
requestAnimationFrame(ensureFit);
})();
