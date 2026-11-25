(function(){
 'use strict';
 const M=CT02Model,T=CT02Tape,$=n=>document.getElementById(n);
 const stage=$('stage'), body=$('lcd-body'),seek=$('seek'),play=$('play'),first=$('stage-play'),ratio=$('entry-ratio');

 function fitTry(){
  if(mode!=="try")return;
  const h=innerHeight,w=innerWidth,phone=w<=710,host=$("handheld-host");
  if(h>960){stage.style.removeProperty("--retro-try-width");return;}
  const top=Math.max(0,host.getBoundingClientRect().top+window.scrollY);
  const visibleFraction=phone&&h<650?.804:1;
  const width=Math.min(phone?270:305,Math.max(phone?158:126,Math.floor((h-top-10)*558/1168/visibleFraction)));
  stage.style.setProperty("--retro-try-width",width+"px");
 }
 const tryLayout=new ResizeObserver(fitTry);
 for(const el of [document.querySelector("header"),$("try-header")])tryLayout.observe(el);
 window.addEventListener("resize",fitTry);
 const params=new URLSearchParams(location.search),entry=M.request(params);
 let task={...entry.task},state=M.create(entry.linked?task.ratio:''),time=0,mode='watch',at=0,playing=false,origin=0,started=false,focused=false,raf=0,stamp='',lane='practice',forkAt=null,lastWatchFocus=false,focusChoice=null;
 let practice={state,task},fork=null;
 const keys=HandheldShell.mount({host:$('handheld-host'),screen:$('lcd'),label:'TI-Nspire CX II-T physical keypad',interactive:false,onKey:k=>physical(k)});
 const make=(tag,text,cls)=>{const el=document.createElement(tag);if(text!=null)el.textContent=text;if(cls)el.className=cls;return el;};
 const click=(text,action,active=false,watch=false,cls='')=>{
  const b=make('button',text,[active?'active':'',cls].filter(Boolean).join(' '));b.type='button';b.disabled=watch;
  if(!watch&&action)b.addEventListener('click',action);
  return b;
 };
 const clock=s=>Math.floor(s/60)+':'+String(Math.floor(s)%60).padStart(2,'0');
 const hints={calc:'Press Home, or use trig to choose a function.',home:'Choose 5: Settings or return to the current document.', 'settings-menu':'Choose 2: Document Settings.',settings:'Tab to Angle, then press Right. After choosing the unit, tab to OK.',palette:'Use the arrows to choose the inverse function from the second row, then press Enter.'};
 function action(key){return ()=>physical(key);}
 function buttonScene(s,watch){
  const row=(caption,action,flag=false)=>click(caption,action,flag,watch);
  const shell=make('div',null,'home-grid'),a=make('div'),b=make('div');
  a.append(make('b','Scratchpad'),row('A Calculate',action('a')),row('B Graph',null));
  b.append(make('b','Documents'),row('1 New',null,true),row('2 Browse',null),row('3 Recent…',null),row('4 Current',action('4')),row('5 Settings…',action('5'),s.view==='settings-menu'));
  shell.append(a,b);body.append(shell);
  if(s.view==='settings-menu'){
   const menu=make('div',null,'settings-list');
   ['1 Change Language','2 Document Settings','3 Graphs & Geometry','4 Handheld Setup','5 Status'].forEach((text,j)=>menu.append(row(text,j===1?action('2'):null,j===1)));
   body.append(menu);
  }
 }
 function settingsScene(s,watch){
  const ui=make('div',null,'lcd-dialog');ui.append(make('b','Document Settings'));
  const area=make('div',null,'lcd-fields');
  ['Float 6',M.units[s.draft],'Normal','Real','Auto','On'].forEach((value,i)=>{
   area.append(make('span',M.fields[i]));
   const b=click(value,i===1?()=>{update(M.selectField(state,1));physical('right');}:()=>update(M.selectField(state,i)),s.field===i,watch,i===1?'angle':'');
   b.setAttribute('aria-label',M.fields[i]+': '+value);
   area.append(b);
  });
  ui.append(area);
  const ctl=make('div',null,'lcd-actions');
  ctl.append(click('OK',()=>update(M.save(state)),s.field===6,watch),click('Cancel',action('esc'),s.field===7,watch));
  ui.append(ctl);
  if(s.dropdown){
   const drop=make('div',null,'angle-options');drop.setAttribute('role','group');drop.setAttribute('aria-label','Angle units');
   ['rad','deg','grad'].forEach((v,i)=>drop.append(click(M.units[v],()=>{update({...state,choice:i});physical('enter');},s.choice===i,watch)));
   ui.append(drop);
  }
  body.append(ui);
 }
 function calcScene(s,watch){
  if(s.result){
   const h=make('div',null,'lcd-expression'),sym=s.result.fn+(s.result.inverse?'⁻¹':'');
   h.append(make('p',sym+'('+s.result.raw.replaceAll('-','−')+')'),make('p',M.displayResult(s.result.value,s.result.mode,s.result.inverse),'lcd-result'));
   body.append(h);
  }
  const cmd=make('div',null,'lcd-entry');
  cmd.textContent=s.sel?s.sel.name+'('+s.raw.replaceAll('-','−')+')':'▏';
  body.append(cmd);
  if(s.view==='palette'){
   const grid=make('div',null,'trig-grid');grid.setAttribute('role','group');grid.setAttribute('aria-label','Trigonometry palette');
   M.palette.forEach((o,i)=>{
    const b=click(o.name,()=>update(M.begin(state,i)),s.choiceTrig===i,watch);
    b.setAttribute('aria-label',o.inv?'inverse '+o.fn:o.fn);
    grid.append(b);
   });
   body.append(grid);
  }
 }
 function draw(s,watch){
  body.replaceChildren();
  $('lcd-mode').textContent=s.mode.toUpperCase();
  $('lcd-name').textContent=s.view==='home'||s.view==='settings-menu'?'Home':s.view==='settings'?'Settings':'1.1 Calculator';
  stage.dataset.lcdView=s.view;
  if(s.view==='home'||s.view==='settings-menu')buttonScene(s,watch);
  else if(s.view==='settings')settingsScene(s,watch);
  else calcScene(s,watch);
 }
 const chapterEls=T.chapters.map(([t,title],i)=>{
  const li=make('li'),b=click(null,()=>go(t));
  b.append(make('span',String(i+1).padStart(2,'0')),document.createTextNode(title));li.append(b);$('chapters').append(li);
  return b;
 });
 seek.max=T.duration;
 function readPlay(){
  let title=playing?'Pause':time>=T.duration-.015?'Replay':'Play';
  play.textContent=title;play.setAttribute('aria-label',title);
  const next=title==='Replay';$('open-try').hidden=!next;$('takeover').hidden=next;
 }
 function watch(){
  if(mode!=='watch')return;
  const {state:s,key,chapter}=T.snapshot(time),st=JSON.stringify(s)+'|'+chapter;
  seek.value=String(time);seek.setAttribute('aria-valuetext',clock(time)+' of '+clock(T.duration));
  $('clock').textContent=clock(time)+' / '+clock(T.duration);
  keys.setKeys(key?[key]:[]);
  first.hidden=started||time>=.1;
  if(st===stamp)return;stamp=st;draw(s,true);
  $('caption').textContent=T.chapters[chapter][2];
  chapterEls.forEach((v,i)=>v.setAttribute('aria-current',String(i===chapter)));
 }
 function go(value){
  time=Math.max(0,Math.min(T.duration,Number(value)||0));
  origin=performance.now()-time*1000;
  watch();readPlay();
 }
 function halt(){if(playing){playing=false;cancelAnimationFrame(raf);}readPlay();watch();}
 function updateClock(now){
  if(!playing||mode!=='watch')return;
  time=Math.min(T.duration,(now-origin)/1000);
  if(time>=T.duration){halt();return;}
  watch();raf=requestAnimationFrame(updateClock);
 }
 function playPause(){
  if(mode!=='watch')return;
  if(playing){halt();return;}
  if(document.activeElement===first)play.focus({preventScroll:true});
  if(time>=T.duration-.015)go(0);
  started=true;playing=true;origin=performance.now()-time*1000;watch();readPlay();raf=requestAnimationFrame(updateClock);
 }
 play.addEventListener('click',playPause);first.addEventListener('click',playPause);
 seek.addEventListener('input',()=>go(seek.value));
 $('back').addEventListener('click',()=>go(time-10));
 $('forward').addEventListener('click',()=>go(time+10));
 $('replay').addEventListener('click',()=>{halt();go(0);playPause();});
 function size(){
  if(mode==='try'){fitTry();return;}
  if(mode!=='watch')return;
  const available=(window.visualViewport?.height||innerHeight)-(focused?0:Math.max(0,stage.getBoundingClientRect().top));
  const fixed=$('watch-message').offsetHeight+$('watch-player').offsetHeight+20;
  stage.style.setProperty('--watch-fit',Math.max(93,Math.min(focused?326:289,Math.floor((available-fixed)*558/1168)))+'px');
 }
 function focus(v){
  if(focused===v)return;
  focused=v;stage.classList.toggle('focus-open',v);document.body.classList.toggle('ct02-focus',v);
  const b=$('focus');b.setAttribute('aria-pressed',String(v));b.setAttribute('aria-label',v?'Exit focused view':'Focused view');b.textContent=v?'Exit':'⛶';
  size();
 }
 $('focus').addEventListener('click',()=>{focusChoice=!focused;focus(!focused);});
 const ro=new ResizeObserver(size);
 for(const e of [$('watch-message'),$('try-header'),$('watch-player'),document.querySelector('.head')])ro.observe(e);
 window.addEventListener('resize',size);window.visualViewport?.addEventListener('resize',size);
 function show(msg='',error=false){const e=$('feedback');e.textContent=msg;e.dataset.error=String(error);e.hidden=!msg;}
 function taskView(){
  $('task').textContent=task.fn+' θ = '+task.ratio.replaceAll('-','−')+'. Find the principal angle in '+M.unitLabels[task.unit]+'.';
  $('task-fn').value=task.fn;$('task-ratio').value=task.ratio;$('task-unit').value=task.unit;
  $('link-error').hidden=lane!=='practice'||!entry.error;$('link-error').textContent=entry.error;
  $('edit').hidden=lane==='fork';$('new-try').hidden=lane!=='fork';$('edit-jump').hidden=lane==='fork';
 }
 function renderTry(){
  if(mode!=='try')return;
  const active=document.activeElement?.closest?.('#lcd-body');
  draw(state,false);
  if(active)stage.focus({preventScroll:true});
  $('hint').textContent=state.view==='calc'?(state.sel?(state.result?'Check the calculation against the task.':'Enter the ratio on the keypad or type it below.'):hints.calc):hints[state.view];
  $('check').hidden=lane==='fork'||state.view!=='calc'||state.result==null;
  $('typed-ratio').hidden=state.view!=='calc'||!state.sel;
  if(ratio.value!==state.raw)ratio.value=state.raw;
  show(state.error,Boolean(state.error));
 }
 function update(next){state=next;renderTry();}
 function physical(k){if(mode==='try')update(M.press(state,k));}
 $('typed-ratio').addEventListener('submit',e=>{e.preventDefault();physical('enter');});
 ratio.addEventListener('input',()=>{if(mode!=='try'||!state.sel)return;update({...state,raw:ratio.value,result:null,error:''});});
 $('task-form').addEventListener('submit',e=>{
  e.preventDefault();if(lane!=='practice')return; const fn=$('task-fn').value,unit=$('task-unit').value;
  try{const item=M.parseRatio($('task-ratio').value);M.inverse(fn,item.value,unit);task={fn,unit,ratio:item.raw};state=M.create();entry.error='';taskView();$('edit').open=false;renderTry();}
  catch(err){show(err.message,true);}
 });
 $('check').addEventListener('click',()=>{
  if(lane!=='practice')return;const err=M.match(state.result,task);
  if(err){show(err,true);return;}
  show('Matched the task. The calculator returned the principal angle in '+M.unitLabels[task.unit]+'.');
 });
 $('reset').addEventListener('click',()=>{
  state=lane==='fork'?T.snapshot(time).state:M.create(entry.linked?task.ratio:'');
  renderTry();
 });
 const editorIds=['task-fn','task-ratio','task-unit'];
 function saveLane(){
  const target=lane==='fork'?fork:practice;
  Object.assign(target,{state,task,message:$('feedback').textContent,messageError:$('feedback').dataset.error==='true',
   editor:lane==='practice'?editorIds.map(id=>$(id).value):null,editorOpen:$('edit').open});
 }
 $('edit-jump').addEventListener('click',()=>{
  $('edit').open=true;$('task-fn').focus({preventScroll:true});$('edit').scrollIntoView({block:'nearest'});
 });
 $('new-try').addEventListener('click',()=>change('try'));
 const tabs=[$('watch-tab'),$('try-tab')];
 function change(next,takeover=false){
  const targetLane=takeover?'fork':'practice';
  if(mode===next&&(next==='watch'||targetLane===lane))return;
  if(mode==='try')saveLane();
  else {halt();lastWatchFocus=focused;if(focused)focus(false);}
  if(next==='try'){
   lane=targetLane;
   if(lane==='fork'&&forkAt!==time){forkAt=time;fork={state:T.snapshot(time).state,task:{...M.WORKED}};}
   const target=lane==='fork'?fork:practice;state=target.state;task=target.task;
  }
  mode=next;stage.dataset.mode=mode;stage.dataset.tryLane=next==='try'?lane:'';
  tabs.forEach((b,j)=>{const a=(j===0)===(mode==='watch');b.setAttribute('aria-selected',String(a));b.tabIndex=a?0:-1;});
  ['watch-work','watch-message','watch-player'].forEach(id=>$(id).hidden=mode!=='watch');
  ['try-work','try-header'].forEach(id=>$(id).hidden=mode!=='try');
  keys.setInteractive(mode==='try');keys.setKeys([]);first.hidden=mode==='try';
  if(mode==='watch'){
   stamp='';watch();readPlay();size();
   if(lastWatchFocus||focusChoice!==false&&keys.body.getBoundingClientRect().width<160)focus(true);
  }else{
   const target=lane==='fork'?fork:practice;taskView();renderTry();
   if(target.message)show(target.message,target.messageError);
   if(lane==='practice'&&target.editor){editorIds.forEach((id,i)=>$(id).value=target.editor[i]);$('edit').open=target.editorOpen;}
   fitTry();
  }
 }
 tabs.forEach((b,i)=>{
  b.addEventListener('click',()=>change(i===0?'watch':'try'));
  b.addEventListener('keydown',e=>{
   if(!['ArrowRight','ArrowLeft','Home','End'].includes(e.key))return;
   e.preventDefault();let n=e.key==='Home'?0:e.key==='End'?1:1-i;
   change(n===0?'watch':'try');tabs[n].focus();
  });
 });
 $('takeover').addEventListener('click',()=>{change('try',true);stage.focus({preventScroll:true});});
 $('open-try').addEventListener('click',()=>{change('try');stage.focus({preventScroll:true});});
 $('resume').addEventListener('click',()=>{change('watch');$('play').focus({preventScroll:true});});
 const map={Home:'home',Escape:'esc',ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',Enter:'enter',Backspace:'del',Delete:'del','.':'dot','-':'neg','+':'plus','/':'div'};
 document.addEventListener('keydown',e=>{
  if(e.altKey||e.metaKey||e.ctrlKey||e.isComposing)return;
  if(mode==='watch'&&e.key==='Escape'&&focused){e.preventDefault();focusChoice=false;focus(false);return;}
  if(!stage.contains(e.target)&&e.target!==document.body)return;
  if(e.target.closest?.('button,input,select,textarea,a,summary'))return;
  if(mode==='watch'){
   if(e.key===' '||e.key==='k'){e.preventDefault();playPause();}
   if(e.key==='j'||e.key==='l'){e.preventDefault();go(time+(e.key==='j'?-10:10));}
   return;
  }
  const key=map[e.key]||(/^[0-9]$/.test(e.key)?e.key:e.key==='t'?'trig':e.key==='Tab'&&state.view==='settings'&&!e.shiftKey?'tab':null);
  if(key){e.preventDefault();physical(key);keys.setKeys([key]);setTimeout(()=>{if(mode==='try')keys.setKeys([]);},140);}
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden)halt();});
 const theme=$('theme'),setTheme=value=>{
  const t=['system','light','dark'].includes(value)?value:'system';theme.value=t;document.documentElement.dataset.theme=t;
  try{localStorage.setItem('ti-lab-theme',t==='system'?'auto':t);}catch{}
 };
 let previous='system';try{const p=localStorage.getItem('ti-lab-theme');if(p&&p!=='auto')previous=p;}catch{}
 setTheme(previous);theme.addEventListener('change',()=>setTheme(theme.value));
 watch();readPlay();size();
 requestAnimationFrame(()=>{if(mode==='watch'&&keys.body.getBoundingClientRect().width<160)focus(true);});
 if(params.get('mode')==='try' || entry.linked || entry.error)change('try');
})();
