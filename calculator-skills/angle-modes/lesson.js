(function(){
 'use strict';
 const M=CT02Model,T=CT02Tape,$=n=>document.getElementById(n);
 const stage=$('stage'), body=$('lcd-body'),seek=$('seek'),play=$('play'),toggleAngle=$('angle-toggle');
 const ratio=document.createElement('input');
 Object.assign(ratio,{id:'entry-ratio',type:'text',maxLength:32,enterKeyHint:'go',autocomplete:'off',spellcheck:false});
 ratio.setAttribute('autocapitalize','off');
 ratio.setAttribute('aria-label','Ratio on the calculator screen');
 let caret=[0,0];

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
 let task={...entry.task},state=M.create(entry.linked?task.ratio:''),time=0,mode='watch',playing=false,origin=0,started=false,raf=0,stamp='',lastFrameAt=0;
 let practice={state,task};
 const keys=HandheldShell.mount({host:$('handheld-host'),screen:$('lcd'),label:'TI-Nspire CX II-T physical keypad',interactive:false,onKey:k=>{const keep=document.activeElement===ratio;physical(k);if(mode==='try'&&!keep)stage.focus({preventScroll:true});}});
 keys.body.addEventListener('pointerdown',e=>{
  if(mode==='try'&&document.activeElement===ratio&&e.target.closest('.hh-key'))e.preventDefault();
 });
 const surface=$('workspace'),feedbackGlyph=$('play-feedback'),cc=$('cc'),captionBand=$('caption-band'),rate=$('play-rate');
 const watchFrameKey='qb-calculator-watch-frame';
 const readFraming=()=>{try{return localStorage.getItem(watchFrameKey)==='full'?'full':'screen';}catch{return 'screen';}};
 let framing=readFraming(),speed=Number(rate.value),captionsOn=true;
 const chrome=CalculatorWatchPlayer.mount({player:stage,surface,play,seek,expand:$('fullscreen'),feedback:feedbackGlyph,active:()=>mode==='watch'});
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const statusMode=$('lcd-mode'), cursor=$('lcd-cursor');
 function setFraming(value,store=true){
  framing=value;
  if(store)try{localStorage.setItem(watchFrameKey,value);}catch{}
  paintFraming();
 }
 function paintFraming(){
  stage.classList.toggle('ct02-screen-view',mode==='watch'&&framing==='screen');
  $('view-full').setAttribute('aria-pressed',String(framing==='full'));
  $('view-screen').setAttribute('aria-pressed',String(framing==='screen'));
  size();
 }
 $('view-full').addEventListener('click',()=>setFraming('full'));
 $('view-screen').addEventListener('click',()=>setFraming('screen'));
 window.addEventListener('storage',e=>{if(e.key===null||e.key===watchFrameKey)setFraming(readFraming(),false);});
 cc.addEventListener('click',()=>{
  captionsOn=!captionsOn;
  cc.setAttribute('aria-pressed',String(captionsOn));
  cc.setAttribute('aria-label',captionsOn?'Hide captions':'Show captions');
  captionBand.hidden=!captionsOn;
  size();
 });
 $('transcript').textContent=T.chapters.map(beat=>beat[2]).join(' ');
 const make=(tag,text,cls)=>{const el=document.createElement(tag);if(text!=null)el.textContent=text;if(cls)el.className=cls;return el;};
 const click=(text,action,active=false,watch=false,cls='')=>{
  const b=make('button',text,[active?'calc-active':'',cls].filter(Boolean).join(' '));b.type='button';b.disabled=watch;
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
 function calcScene(s,watch,reuse=null){
  if(s.result){
   const h=make('div',null,'lcd-expression'),sym=s.result.fn+(s.result.inverse?'⁻¹':'');
   h.append(make('p',sym+'('+s.result.raw.replaceAll('-','−')+')'),make('p',M.displayResult(s.result.value,s.result.mode,s.result.inverse),'lcd-result'));
   if(reuse)body.insertBefore(h,reuse);else body.append(h);
  }
  const cmd=reuse??make('div',null,'lcd-entry');
  if(!watch&&s.view==='calc'&&s.sel){
   if(!reuse){
    cmd.classList.add('lcd-edit');
    const before=make('span',null),after=make('span',')');
    before.setAttribute('aria-hidden','true');after.setAttribute('aria-hidden','true');
    cmd.append(before,ratio,after);
    cmd.addEventListener('click',e=>{if(e.target!==ratio)ratio.focus({preventScroll:true});});
   }
   cmd.firstElementChild.textContent=s.sel.name+'(';
   if(ratio.value!==s.raw)ratio.value=s.raw;
   ratio.setAttribute('aria-label',s.sel.name+' argument on the calculator screen');
  }else cmd.textContent=s.sel?s.sel.name+'('+s.raw.replaceAll('-','−')+')':'▏';
  if(!reuse)body.append(cmd);
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
  const old=ratio.closest('.lcd-entry');
  const reuse=!watch&&s.view==='calc'&&s.sel&&old?.parentElement===body?old:null;
  if(reuse)for(const el of [...body.children]){if(el!==reuse)el.remove();}
  else body.replaceChildren();
  const liveToggle=!watch&&(s.view==='calc'||s.view==='palette')&&s.mode!=='grad';
  $('lcd-mode').textContent=s.mode.toUpperCase();$('lcd-mode').hidden=liveToggle;
  toggleAngle.hidden=!liveToggle;
  if(liveToggle){
   const next=s.mode==='rad'?'degrees':'radians',current=M.unitLabels[s.mode];
   toggleAngle.textContent=s.mode.toUpperCase();
   const name='Angle mode: '+current+'. Switch to '+next;
   toggleAngle.setAttribute('aria-label',name);toggleAngle.title=name;
  }
  $('lcd-name').textContent=s.view==='home'||s.view==='settings-menu'?'Home':s.view==='settings'?'Settings':'1.1 Calculator';
  stage.dataset.lcdView=s.view;
  if(s.view==='home'||s.view==='settings-menu')buttonScene(s,watch);
  else if(s.view==='settings')settingsScene(s,watch);
  else calcScene(s,watch,reuse);
 }
 const readable={angle:'Touchpad click',trig:'trig',down:'↓',enter:'Enter',dot:'.'};
 seek.max=T.duration;
 function readPlay(){
  const title=playing?'Pause':time>=T.duration-.015?'Replay':'Play';
  play.setAttribute('aria-label',title);play.title=title;
  play.querySelector('.play-icon').hidden=playing;play.querySelector('.pause-icon').hidden=!playing;
 }
 function placeCursor(){
  const p=T.pointer(time);
  cursor.toggleAttribute("hidden",!p);
  statusMode.dataset.pointed=String(Boolean(p?.at));
  if(!p)return;
  const r=$('lcd').getBoundingClientRect(),a=statusMode.getBoundingClientRect();
  if(!r.width||!r.height)return;
  const x=(a.x+a.width*.56-r.x)/r.width*100, y=(a.y+a.height*.55-r.y)/r.height*100;
  const progress=reduced.matches?1:p.progress;
  cursor.style.left=(44+(x-44)*progress)+'%';
  cursor.style.top=(40+(y-40)*progress)+'%';
 }
 function watch(){
  if(mode!=='watch')return;
  const {state:s,key,last,chapter}=T.snapshot(time),signature=JSON.stringify(s)+'|'+chapter;
  seek.value=String(time);seek.setAttribute('aria-valuetext',clock(time)+' of '+clock(T.duration));
  $('clock').textContent=clock(time)+' / '+clock(T.duration);
  keys.setKeys(key?[key==='angle'?'select':key]:[]);
  if(!started){feedbackGlyph.hidden=time>=.1;feedbackGlyph.dataset.initial='true';}
  $('key-strip').hidden=!last;
  $('active-key').textContent=last?(readable[last]??last):'—';
  if(signature!==stamp){stamp=signature;draw(s,true);
   $('caption').textContent=T.chapters[chapter][2];
   $('beat').textContent=T.chapters[chapter][1];
  }
  placeCursor();
 }
 function setClock(){origin=performance.now()-time*1000/speed;}
 function applyClock(now){time=Math.max(0,Math.min(T.duration,(now-origin)*speed/1000));}
 function go(value){
  time=Math.max(0,Math.min(T.duration,Number(value)||0));setClock();watch();readPlay();
 }
 function halt(sync=true){
  if(playing){
   if(sync)applyClock(performance.now());
   playing=false;cancelAnimationFrame(raf);
  }
  readPlay();watch();
 }
 function updateClock(now){
  if(!playing||mode!=='watch')return;
  if(now-lastFrameAt>=24){
   lastFrameAt=now;applyClock(now);
   if(time>=T.duration){halt(false);return;}
   watch();
  }
  raf=requestAnimationFrame(updateClock);
 }
 function playPause(){
  if(mode!=='watch')return;
  feedbackGlyph.dataset.initial='false';
  if(playing){halt();chrome.flash(false);return;}
  if(time>=T.duration-.015)go(0);
  started=true;playing=true;setClock();watch();readPlay();chrome.flash(true);raf=requestAnimationFrame(updateClock);
 }
 play.addEventListener('click',playPause);
 seek.addEventListener('input',()=>go(seek.value));
 rate.addEventListener('change',()=>{
  if(playing)applyClock(performance.now());
  speed=Number(rate.value);setClock();watch();
 });
 function navigationInset(){return document.querySelector('.tabbar')?.offsetHeight||0;}
 function size(){
  if(mode==='try'){fitTry();return;}
  if(mode!=='watch')return;
  const expanded=document.fullscreenElement===stage||stage.classList.contains('watch-fullscreen-fallback');
  const space=(window.visualViewport?.height||innerHeight)-(expanded?0:Math.max(0,stage.getBoundingClientRect().top+window.scrollY)+navigationInset());
  const room=Math.max(170,space-captionBand.offsetHeight-$('watch-player').offsetHeight);
  const side=innerWidth>710;
  const fullW=Math.min(expanded?360:286,Math.max(96,Math.floor((room-48)*558/1168)));
  const lcdW=Math.min(545,Math.max(198,Math.floor((room-48)*4/3)));
  stage.style.setProperty('--ct02-handset-fit',fullW+'px');
  stage.style.setProperty('--ct02-lcd-fit',lcdW+'px');
  stage.style.setProperty('--ct02-scene-room',Math.max(120,room-(side?43:38))+'px');
  if(!cursor.hasAttribute("hidden"))placeCursor();
 }
 const ro=new ResizeObserver(size);
 for(const e of [captionBand,$('try-header'),$('watch-player'),document.querySelector('.head')])ro.observe(e);
 window.addEventListener('resize',size);window.visualViewport?.addEventListener('resize',size);
 document.addEventListener('fullscreenchange',size);
 new MutationObserver(size).observe(stage,{attributes:true,attributeFilter:['class']});
 function show(msg='',error=false){const e=$('feedback');e.textContent=msg;e.dataset.error=String(error);e.hidden=!msg;}
 function taskView(){
  $('task').textContent=task.fn+' θ = '+task.ratio.replaceAll('-','−')+'. Find the principal angle in '+M.unitLabels[task.unit]+'.';
  $('task-fn').value=task.fn;$('task-ratio').value=task.ratio;$('task-unit').value=task.unit;
  $('link-error').hidden=!entry.error;$('link-error').textContent=entry.error;
 }
 function renderTry({keepRatio=document.activeElement===ratio,range=caret}={}){
  if(mode!=='try')return;
  const active=document.activeElement?.closest?.('#lcd-body');
  draw(state,false);
  if(keepRatio&&body.contains(ratio)){
   ratio.focus({preventScroll:true});
   ratio.setSelectionRange(...range);rememberCaret();
  }else if(active)stage.focus({preventScroll:true});
  $('hint').textContent=state.view==='calc'?(state.sel?(state.result?'Check the calculation against the task.':'Tap the ratio on the calculator screen, or use the keypad. Press Enter to calculate.'):'Tap RAD or DEG at the top to switch units. Press trig to choose a function.'):hints[state.view];
  $('check').hidden=state.view!=='calc'||state.result==null;
  show(state.error,Boolean(state.error));
 }
 function update(next,options){state=next;renderTry(options);}
 function rememberCaret(){if(ratio.selectionStart!==null)caret=[ratio.selectionStart,ratio.selectionEnd];}
 function physical(k){
  if(mode!=='try')return;
  const editing=state.view==='calc'&&state.sel&&body.contains(ratio),wasFocused=document.activeElement===ratio;
  if(editing&&wasFocused)rememberCaret();
  if(editing&&(k==='left'||k==='right')){
   const [start,end]=caret,at=k==='left'?start===end?start-1:start:start===end?end+1:end;
   const p=Math.max(0,Math.min(state.raw.length,at));ratio.setSelectionRange(p,p);rememberCaret();
   return;
  }
  const char=({dot:'.',neg:'-',minus:'-',div:'/',plus:'+'})[k]??(/^\d$/.test(k)?k:null);
  if(editing&&(char!==null||k==='del')){
   const [a,b]=caret.map(i=>Math.min(state.raw.length,i));
   const from=k==='del'&&a===b?Math.max(0,a-1):a, insert=char??'';
   const raw=state.raw.slice(0,from)+insert+state.raw.slice(b);
   if(raw.length>ratio.maxLength)return;
   caret=[from+insert.length,from+insert.length];
   update({...state,raw,result:null,error:'',prefill:''},{keepRatio:wasFocused,range:caret});
   if(!wasFocused)ratio.setSelectionRange(...caret);
   return;
  }
  const next=M.press(state,k);
  if(next.sel!==state.sel||next.raw!==state.raw){caret=[next.raw.length,next.raw.length];}
  update(next,{keepRatio:wasFocused,range:caret});
  if(body.contains(ratio)&&!wasFocused)ratio.setSelectionRange(...caret);
 }
 for(const e of ['select','keyup','pointerup','focus'])ratio.addEventListener(e,rememberCaret);
 ratio.addEventListener('input',()=>{
  if(mode!=='try'||state.view!=='calc'||!state.sel)return;
  rememberCaret();
  const drop=Boolean(state.result||state.error);
  state={...state,raw:ratio.value,prefill:'',result:null,error:''};
  if(drop)renderTry();
 });
 ratio.addEventListener('keydown',e=>{
  if(e.isComposing||e.altKey||e.ctrlKey||e.metaKey)return;
  if(e.key==='Enter'){e.preventDefault();e.stopPropagation();physical('enter');keys.setKeys(['enter']);setTimeout(()=>{if(mode==='try')keys.setKeys([]);},140);}
  else if(e.key==='Escape'){e.preventDefault();e.stopPropagation();stage.focus({preventScroll:true});}
 });
 toggleAngle.addEventListener('click',()=>{
  if(mode!=='try'||toggleAngle.hidden)return;
  update(M.toggleAngle(state));
 });
 $('task-form').addEventListener('submit',e=>{
  e.preventDefault();const fn=$('task-fn').value,unit=$('task-unit').value;
  try{const item=M.parseRatio($('task-ratio').value);M.inverse(fn,item.value,unit);task={fn,unit,ratio:item.raw};state=M.create();caret=[0,0];entry.error='';taskView();$('edit').open=false;renderTry();}
  catch(err){show(err.message,true);}
 });
 $('check').addEventListener('click',()=>{
  const err=M.match(state.result,task);
  if(err){show(err,true);return;}
  show('Matched the task. The calculator returned the principal angle in '+M.unitLabels[task.unit]+'.');
 });
 $('reset').addEventListener('click',()=>{
  state=M.create(entry.linked?task.ratio:'');
  caret=[state.raw.length,state.raw.length];renderTry();
 });
 const editorIds=['task-fn','task-ratio','task-unit'];
 function saveTry(){
  Object.assign(practice,{state,task,message:$('feedback').textContent,messageError:$('feedback').dataset.error==='true',
   caret:caret.slice(),editor:editorIds.map(id=>$(id).value),editorOpen:$('edit').open});
 }
 $('edit-jump').addEventListener('click',()=>{
  $('edit').open=true;$('task-fn').focus({preventScroll:true});$('edit').scrollIntoView({block:'nearest'});
 });
 const tabs=[$('watch-tab'),$('try-tab')];
 function change(next){
  if(mode===next)return;
  if(mode==='try')saveTry();
  else halt();
  if(next==='try'){state=practice.state;task=practice.task;caret=practice.caret??[state.raw.length,state.raw.length];}
  mode=next;stage.dataset.mode=mode;
  tabs.forEach((b,j)=>{const a=(j===0)===(mode==='watch');b.setAttribute('aria-selected',String(a));b.tabIndex=a?0:-1;});
  ['watch-work','watch-player'].forEach(id=>$(id).hidden=mode!=='watch');
  ['try-work','try-header'].forEach(id=>$(id).hidden=mode!=='try');
  captionBand.hidden=mode!=='watch'||!captionsOn;
  keys.setInteractive(mode==='try');keys.setKeys([]);paintFraming();
  if(mode==='watch'){
   stamp='';watch();readPlay();size();
  }else{
   chrome.clear();chrome.exit();$('key-strip').hidden=true;cursor.setAttribute("hidden","");statusMode.dataset.pointed='false';
   taskView();renderTry();
   if(practice.message)show(practice.message,practice.messageError);
   if(practice.editor){editorIds.forEach((id,i)=>$(id).value=practice.editor[i]);$('edit').open=practice.editorOpen;}
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
 $('resume').addEventListener('click',()=>{change('watch');$('play').focus({preventScroll:true});});
 const map={Home:'home',Escape:'esc',ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',Enter:'enter',Backspace:'del',Delete:'del','.':'dot','-':'neg','+':'plus','/':'div'};
 document.addEventListener('keydown',e=>{
  if(e.target!==document.body&&!e.target.closest?.(".qb-calculator-lesson"))return;
  if(e.altKey||e.metaKey||e.ctrlKey||e.isComposing)return;
  if(mode!=='try')return;
  if(!stage.contains(e.target)&&e.target!==document.body)return;
  if(e.target===toggleAngle?['Enter',' ','Tab'].includes(e.key):e.target.closest?.('button,input,select,textarea,a,summary'))return;
  const key=map[e.key]||(/^[0-9]$/.test(e.key)?e.key:e.key==='t'?'trig':e.key==='Tab'&&state.view==='settings'&&!e.shiftKey?'tab':null);
  if(key){e.preventDefault();physical(key);keys.setKeys([key]);setTimeout(()=>{if(mode==='try')keys.setKeys([]);},140);}
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden)halt();});
 paintFraming();watch();readPlay();size();
 if(params.get('mode')==='try' || entry.linked || entry.error)change('try');
})();
