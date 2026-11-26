/* Shared, opt-in Calculator Skills Watch template. A calculator adapter owns
   the worked state and Try. This file owns every lesson's transport and pacing. */
(function (root) {
'use strict';
const sha = /^[a-f0-9]{64}$/;
const token = /^[a-z0-9][a-z0-9-]{0,47}$/;
const frameStorage = 'qb-calculator-watch-frame';
const validText = (text, max) => typeof text === 'string' && text.trim() === text && text.length > 0 && text.length <= max;

function validate(spec) {
 const fail = message => { throw new Error('Watch lesson: ' + message); };
 if (!spec || !/^(?:CT\d{2}(?:-[a-z]+)?|SUP-[A-Z0-9-]+)$/.test(spec.id) ||
     !validText(spec.title,100) || !validText(spec.intro,220)) fail('invalid lesson identity');
 if (spec.initialFraming !== undefined && !['full','screen'].includes(spec.initialFraming)) fail('invalid opening framing');
 if (!Array.isArray(spec.chapters) || !spec.chapters.length || !Array.isArray(spec.beats) || !spec.beats.length)
   fail('supply chapters and beats');
 const chapters = new Map(), keys = new Set();
 for (const chapter of spec.chapters) {
   if (typeof chapter?.id!=='string' || !token.test(chapter.id) || chapters.has(chapter.id) || !validText(chapter.title,85)) fail('invalid or duplicate chapter');
   chapters.set(chapter.id, []);
 }
 let previousChapter = -1, end = 0;
 const order = new Map(spec.chapters.map((c,i) => [c.id,i]));
 const events = [];
 for (const [i,beat] of spec.beats.entries()) {
   const column = order.get(beat?.chapter);
   if (column === undefined || column < previousChapter || !Number.isFinite(beat.end) || beat.end <= end ||
       !Number.isFinite(beat.hold) || beat.hold < 0 || !validText(beat.coach,300) ||
       (beat.spoken !== '' && !validText(beat.spoken,500))) fail('bad beat ' + (i+1));
   if (!Array.isArray(beat.keys)) fail('a beat needs an explicit key list');
   if (!beat.hold && beat.keys.length) fail('keys require a teaching hold');
   let last = -1;
   for (const key of beat.keys) {
     if (typeof key?.id!=='string' || !token.test(key.id) || keys.has(key.id) || !validText(key.label,22) ||
         (key.ariaLabel !== undefined && !validText(key.ariaLabel,70)) ||
         !Number.isFinite(key.at) || key.at <= last || key.at < 0 || key.at >= 1) fail('invalid physical key event');
     keys.add(key.id);last=key.at;
     const event = Object.freeze({...key,beat:i,chapter:beat.chapter});
     events.push(event);chapters.get(beat.chapter).push(event);
   }
   previousChapter=column;end=beat.end;
 }
 if (spec.chapters.some(c=>!spec.beats.some(b=>b.chapter===c.id))) fail('empty chapter');
 if (spec.recording && (!sha.test(spec.recording.audioSha256) || !sha.test(spec.recording.scriptSha256) ||
     !validText(spec.recording.file,120))) fail('recordings need both audio and spoken-script hashes');
 return Object.freeze({ events:Object.freeze(events),
   groups:spec.chapters.map(c=>Object.freeze({...c,keys:Object.freeze(chapters.get(c.id))})) });
}

function stateAt(layout, authored, time) {
 const point = layout.at(time);
 const crossed = authored.events.filter(k => k.beat<point.span.i || (k.beat===point.span.i&&!point.speaking&&k.at<=point.fraction));
 return {point,crossed,key:crossed.at(-1)??null};
}

async function recordingFor(spec, win) {
 if(!spec.recording)return null;
 const signed=spec.recording, url=new URL(signed.file,win.document.baseURI);
 if (url.origin!==win.location.origin||!url.pathname.endsWith('.mp3')||!win.crypto?.subtle) return null;
 const checksum=async bytes => [...new Uint8Array(await win.crypto.subtle.digest('SHA-256',bytes))]
      .map(n=>n.toString(16).padStart(2,'0')).join('');
 const text=new win.TextEncoder().encode(spec.beats.map(b=>b.spoken).filter(Boolean).join('\n')+'\n');
 if(await checksum(text)!==signed.scriptSha256)return null;
 const response=await win.fetch(url.href,{signal:win.AbortSignal.timeout(8500)});
 if(!response.ok)return null;
 const bytes=await response.arrayBuffer();
 if(bytes.byteLength>16000000||await checksum(bytes)!==signed.audioSha256)return null;
 const blob=win.URL.createObjectURL(new win.Blob([bytes],{type:'audio/mpeg'}));
 const audio=win.document.createElement('audio');
 audio.hidden=true;audio.preload='metadata';audio.playbackRate=1;audio.defaultPlaybackRate=1;
 let timer;
 try{
   await Promise.race([new Promise((ok,fail)=>{
     audio.addEventListener('loadedmetadata',ok,{once:true});
     audio.addEventListener('error',fail,{once:true});audio.src=blob;
   }),new Promise((_,fail)=>{timer=win.setTimeout(fail,4000);})]);
   if(Math.abs(audio.duration-spec.beats.at(-1).end)>.12)throw new Error('unexpected audio duration');
   return {audio, release:()=>win.URL.revokeObjectURL(blob)};
 }catch{audio.removeAttribute('src');audio.load();win.URL.revokeObjectURL(blob);return null;}
 finally{win.clearTimeout(timer);}
}

function mount(host, input, adapter) {
 if(!host||typeof adapter?.renderWatch!=='function')throw new Error('Watch template needs a calculator adapter');
 const hasTry=typeof adapter.enterTry==='function', initial=adapter.initialMode===undefined?'watch':adapter.initialMode;
 function validateMode(next){
   if(next!=='watch'&&next!=='try')throw new RangeError('Watch lesson mode must be watch or try');
   if(next==='try'&&!hasTry)throw new Error('Watch lesson has no Try adapter');
 }
 validateMode(initial);
 const spec=JSON.parse(JSON.stringify(input)), authored=validate(spec);
 const doc=host.ownerDocument, win=doc.defaultView, ns='http://www.w3.org/2000/svg';
 if(!win.TeachingHolds||!win.CalculatorWatchPlayer||!win.CalculatorWatchChapters)throw new Error('Load the central Watch modules first');
 const el=(tag,text,css)=>{const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;if(css)n.className=css;return n;};
 const btn=(label,text,cls)=>{const n=el('button',text,cls);n.type='button';n.setAttribute('aria-label',label);n.title=label;return n;};
 const glyph=(d,className)=>{
   const icon=doc.createElementNS(ns,'svg'), path=doc.createElementNS(ns,'path');
   icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('aria-hidden','true');
   if(className)icon.setAttribute('class',className);path.setAttribute('d',d);icon.append(path);return icon;
 };
 const triangle='M8 5v14l11-7z', bars='M8 5h3v14H8zm6 0h3v14h-3z',
       fullscreen='M3 3h6v2H5v4H3zm12 0h6v6h-2V5h-4zM3 15h2v4h4v2H3zm16 0h2v6h-6v-2h4z';
 host.classList.add('lw-lesson');
 const header=el('header',undefined,'lw-header'),title=el('div'), h1=el('h1',spec.title), intro=el('p',spec.intro);
 title.append(h1,intro);header.append(title);
 const choice=el('div',undefined,'lw-mode'),watch=btn('Watch','Watch'),tryButton=btn('Try','Try');
 if(hasTry){choice.append(watch,tryButton);header.append(choice);}
 const stage=el('section',undefined,'lw-stage');stage.tabIndex=0;stage.setAttribute('aria-label',spec.title+' player');
 const surface=el('div',undefined,'lw-surface'), devicePanel=el('div',undefined,'lw-device-panel'),
       device=el('div',undefined,'lw-device'), side=el('aside',undefined,'lw-guide'),
       coach=el('p',undefined,'lw-coach'), groups=el('div',undefined,'lw-groups');
 device.setAttribute('aria-label','Calculator display');
 side.append(coach,groups);
 const feedback=el('span',undefined,'lw-feedback');feedback.dataset.action='play';feedback.dataset.initial='true';feedback.setAttribute('aria-hidden','true');
 feedback.append(glyph(triangle,'lw-play-glyph'),glyph(bars,'lw-pause-glyph'));
 devicePanel.append(device,feedback);surface.append(devicePanel,side);
 const compactCoach=el('div',undefined,'lw-compact-coach');compactCoach.hidden=true;
 const caption=el('p',undefined,'lw-caption'),captionAnchor=el('div',undefined,'lw-caption-anchor');
 caption.hidden=true;captionAnchor.append(caption);
 const bar=el('div',undefined,'lw-transport');bar.setAttribute('role','group');bar.setAttribute('aria-label','Playback controls');
 const play=btn('Play',undefined,'lw-play'),iconPlay=glyph(triangle),iconPause=glyph(bars);
 play.append(iconPlay,iconPause);
 const sound=btn('Mute narration',undefined,'lw-sound'),waves=glyph('M3 9h4l5-4v14l-5-4H3zm12-1 1-1a7 7 0 0 1 0 10l-1-1a5.5 5.5 0 0 0 0-8z'),muted=glyph('M3 9h4l5-4v14l-5-4H3zm12 0 5 6-1 1-5-6zm4 0 1 1-5 6-1-1z');
 sound.append(waves,muted);sound.hidden=true;
 const seek=el('input',undefined,'lw-seek');seek.type='range';seek.min='0';seek.step='.005';seek.setAttribute('aria-label','Seek walkthrough');
 const clock=el('span',undefined,'lw-clock');clock.setAttribute('aria-hidden','true');
 const frames=el('div',undefined,'lw-frames');frames.setAttribute('aria-label','Calculator framing');frames.setAttribute('role','group');
 const screen=btn('Screen only'),full=btn('Full calculator');
 full.append(glyph('M7 2h10v20H7zm2 2v6h6V4zm0 8v2h2v-2zm4 0v2h2v-2zm-4 4v2h2v-2zm4 0v2h2v-2z'));
 screen.append(glyph('M2 5h20v14H2zm2 2v10h16V7z'));frames.append(full,screen);
 const cc=btn('Show captions','CC','lw-cc'),scale=el('select'),expand=btn('Fullscreen',undefined,'lw-expand');
 scale.setAttribute('aria-label','Teaching pauses');
 for(const [value,label] of [[.7,'Short'],[1,'Normal'],[1.4,'Long']]){
   const option=el('option',label);option.value=String(value);scale.append(option);
 } scale.value='1';
 const pace=el('label',undefined,'lw-pace');pace.append(el('span','Pauses'),scale);
 expand.append(glyph(fullscreen));bar.append(seek,clock,play,sound,frames,cc,pace,expand);
 const mediaNote=el('p','Captioned walkthrough','lw-media-status');mediaNote.setAttribute('role','status');
 stage.append(surface,compactCoach,captionAnchor,bar,mediaNote);host.replaceChildren(header,stage);
 let lastEnd=0;
 const beats=spec.beats.map(b=>{const row=[lastEnd,b.end,b.hold];lastEnd=b.end;return row;});
 let layout=win.TeachingHolds.make(beats),t=0,mode='watch',framing=spec.initialFraming??'screen',ccOn=false,clockOrigin=0,playing=false,pending=false,phase='',epoch=0,frameRequest=0,activeMedia=null,disposed=false,initiated=false,restorePlayFocus=false;
 try { if(!spec.initialFraming&&win.localStorage.getItem(frameStorage)==='full')framing='full'; } catch {}
 const basePlayer=win.CalculatorWatchPlayer.mount({player:stage,surface,play,seek,expand,feedback,active:()=>mode==='watch'});
 const chapterNav=win.CalculatorWatchChapters.mount(groups,authored.groups,{onChapter:id=>{
   seekTo(layout.spans[spec.beats.findIndex(b=>b.chapter===id)].start);
 }});
 const compactRail=win.matchMedia('(max-width:780px) and (max-height:670px)');
 const stacked=win.matchMedia('(max-width:780px)');
 function fitPresentation(){
   if(disposed)return;
   const expanded=doc.fullscreenElement===stage||stage.classList.contains('watch-fullscreen-fallback');
   const railBelow=compactRail.matches&&!expanded;
   if((side.parentElement===stage)!==railBelow){
     const focused=side.contains(doc.activeElement)?doc.activeElement:null;
     if(railBelow){mediaNote.after(side);compactCoach.append(coach);}
     else {surface.append(side);side.prepend(coach);}
     if(focused)focused.focus({preventScroll:true});
   }
   compactCoach.hidden=mode!=='watch'||!railBelow;
   if(mode!=='watch')return;
   const h=win.visualViewport?.height||win.innerHeight;
   const start=expanded?0:Math.max(0,stage.getBoundingClientRect().top+win.scrollY);
   const nav=expanded?0:doc.querySelector('.tabbar')?.offsetHeight||0;
   const styles=win.getComputedStyle(surface);
   const gap=stacked.matches&&!railBelow?side.offsetHeight+parseFloat(styles.rowGap||'0'):0;
   const room=h-start-nav-bar.offsetHeight-mediaNote.offsetHeight-
     compactCoach.offsetHeight-gap-parseFloat(styles.paddingTop||'0')-parseFloat(styles.paddingBottom||'0')-4;
   stage.style.setProperty('--lw-scene-height',Math.floor(Math.max(105,room))+'px');
 }
 const fitObserver=new win.ResizeObserver(fitPresentation);
 [header,side,bar,mediaNote,compactCoach].forEach(e=>fitObserver.observe(e));
 const fullscreenObserver=new win.MutationObserver(fitPresentation);
 fullscreenObserver.observe(stage,{attributes:true,attributeFilter:['class']});
 win.addEventListener('resize',fitPresentation);win.visualViewport?.addEventListener('resize',fitPresentation);
 doc.addEventListener('fullscreenchange',fitPresentation);
 const fmt=n=>Math.floor(n/60)+':'+String(Math.floor(n%60)).padStart(2,'0');
 function update(){
   if(mode!=='watch')return;
   const {point,crossed,key}=stateAt(layout,authored,t),beat=spec.beats[point.span.i];
   stage.dataset.framing=framing;stage.dataset.phase=point.speaking?'speech':'hold';
   if(!initiated)feedback.hidden=t>.04;
   coach.textContent=beat.coach;
   chapterNav.setState({chapterId:beat.chapter,keyId:key?.chapter===beat.chapter?key.id:null});
   caption.textContent=point.speaking?beat.spoken:'';
   caption.hidden=!(point.speaking&&beat.spoken&&(ccOn||!activeMedia));
   cc.hidden=!activeMedia;
   full.setAttribute('aria-pressed',String(framing==='full'));screen.setAttribute('aria-pressed',String(framing==='screen'));
   seek.max=layout.duration;seek.value=t;
   seek.setAttribute('aria-valuetext',fmt(t)+' of '+fmt(layout.duration));
   clock.textContent=fmt(t)+' / '+fmt(layout.duration);
   adapter.renderWatch(device,{beat:point.span.i,chapter:beat.chapter,t,point,key,crossed,framing});
 }
 function label(){
   const name=playing?'Pause':t>=layout.duration-.012?'Replay':'Play';
   play.setAttribute('aria-label',name);play.title=name;
   iconPlay.toggleAttribute('hidden',playing);iconPause.toggleAttribute('hidden',!playing);
 }
 function halt(){
   epoch++;pending=false;playing=false;phase='';activeMedia?.audio.pause();win.cancelAnimationFrame(frameRequest);label();
 }
 function seekTo(next){
   const resume=playing||pending;halt();t=Math.min(layout.duration,Math.max(0,Number(next)||0));update();label();
   if(resume&&t<layout.duration)void start(false);
 }
 function loseMedia(){
   activeMedia?.audio.pause();activeMedia?.audio.remove();activeMedia?.release();activeMedia=null;sound.hidden=true;
   mediaNote.hidden=false;mediaNote.textContent='Narration unavailable. Follow the captions.';
   clockOrigin=win.performance.now()-t*1000;update();
 }
 async function enter(ticket){
   const point=layout.at(t),a=activeMedia?.audio;phase=point.speaking?'voice':'hold';
   clockOrigin=win.performance.now()-t*1000;
   if(!a||phase!=='voice'){a?.pause();return ticket===epoch;}
   let timeout;
   try{
      a.currentTime=point.audioTime;a.playbackRate=1;
      await Promise.race([a.play(),new Promise((_,no)=>{timeout=win.setTimeout(no,4200);})]);
   }catch{if(ticket===epoch&&activeMedia?.audio===a)loseMedia();}
   finally{win.clearTimeout(timeout);}
   return ticket===epoch;
 }
 function step(now){
   if(!playing||disposed||mode!=='watch')return;
   const here=layout.at(t).span,a=activeMedia?.audio;
   if(phase==='voice'){
      t=a?Math.min(here.voiceEnd,here.start+Math.max(0,a.currentTime-here.from)):Math.min(here.voiceEnd,(now-clockOrigin)/1000);
      if(t>=here.voiceEnd-.013||a?.ended){
        a?.pause();t=here.voiceEnd;
        if(here.end===here.voiceEnd){
          if(t>=layout.duration){halt();update();return;}
          const ticket=epoch;update();void enter(ticket).then(ok=>{if(ok&&playing)frameRequest=win.requestAnimationFrame(step);});return;
        }
        phase='hold';clockOrigin=win.performance.now()-t*1000;
      }
   }else{
      t=Math.min(here.end,(now-clockOrigin)/1000);
      if(t>=layout.duration){halt();update();return;}
      if(t>=here.end){const ticket=epoch;update();void enter(ticket).then(ok=>{if(ok&&playing)frameRequest=win.requestAnimationFrame(step);});return;}
   }
   update();frameRequest=win.requestAnimationFrame(step);
 }
 async function start(flash=true){
   if(mode!=='watch'||disposed)return;
   if(t>=layout.duration-.012)t=0;
   initiated=true;feedback.dataset.initial='false';feedback.hidden=true;
   pending=true;const ticket=++epoch;
   if(!await enter(ticket))return;
   pending=false;playing=true;label();update();if(flash)basePlayer.flash(true);frameRequest=win.requestAnimationFrame(step);
 }
 function focusMode(){
   restorePlayFocus=mode==='watch'&&play.disabled;
   const target=mode==='watch'?(restorePlayFocus?watch:play):tryButton;
   target.focus({preventScroll:true});
 }
 function changeMode(next,{focus=false}={}){
   validateMode(next);
   if(disposed)return;
   if(next===mode){if(focus)focusMode();return;}
   halt();basePlayer.clear();void basePlayer.exit();mode=next;stage.dataset.mode=mode;
   watch.setAttribute('aria-pressed',String(mode==='watch'));tryButton.setAttribute('aria-pressed',String(mode==='try'));
   bar.hidden=side.hidden=mode==='try';mediaNote.hidden=mode==='try'||!!activeMedia;
   if(mode==='try'){
     caption.hidden=true;feedback.hidden=true;stage.dataset.framing='full';
     adapter.enterTry(device,{returnToWatch:()=>changeMode('watch',{focus:true})});
   }else {adapter.exitTry?.(device);update();}
   fitPresentation();
   if(focus)focusMode();
 }
 play.onclick=()=>{if(playing||pending){halt();basePlayer.flash(false);}else void start();};
 seek.oninput=()=>seekTo(seek.value);
 scale.onchange=()=>{
   const resume=playing||pending,old=layout;halt();layout=win.TeachingHolds.make(beats,Number(scale.value));
   t=layout.remap(old,t);update();if(resume)void start(false);
 };
 cc.onclick=()=>{ccOn=!ccOn;cc.setAttribute('aria-pressed',String(ccOn));cc.setAttribute('aria-label',ccOn?'Hide captions':'Show captions');cc.title=cc.getAttribute('aria-label');update();};
 sound.onclick=()=>{
   if(!activeMedia)return;
   const a=activeMedia.audio;a.muted=!a.muted;sound.setAttribute('aria-label',a.muted?'Unmute narration':'Mute narration');
   waves.toggleAttribute('hidden',a.muted);muted.toggleAttribute('hidden',!a.muted);
 };
 function choose(next){framing=next;try{if(!spec.initialFraming)win.localStorage.setItem(frameStorage,next);}catch{}update();}
 screen.onclick=()=>choose('screen');full.onclick=()=>choose('full');
 watch.onclick=()=>changeMode('watch');tryButton.onclick=()=>changeMode('try');
 function hide(){if(doc.hidden)halt();}
 function unload(event){if(!event.persisted)destroy();}
 function destroy(){
   if(disposed)return;disposed=true;halt();chapterNav.destroy();
   doc.removeEventListener('visibilitychange',hide);win.removeEventListener('pagehide',unload);
   fitObserver.disconnect();fullscreenObserver.disconnect();
   win.removeEventListener('resize',fitPresentation);win.visualViewport?.removeEventListener('resize',fitPresentation);
   doc.removeEventListener('fullscreenchange',fitPresentation);
   if(activeMedia){activeMedia.audio.remove();activeMedia.release();activeMedia=null;}
 }
 doc.addEventListener('visibilitychange',hide);win.addEventListener('pagehide',unload);
 watch.setAttribute('aria-pressed','true');tryButton.setAttribute('aria-pressed','false');
 stage.dataset.mode='watch';cc.setAttribute('aria-pressed','false');muted.setAttribute('hidden','');
 label();if(initial==='try')changeMode('try');else{update();fitPresentation();}
 if(spec.recording){
   play.disabled=true;mediaNote.textContent='Checking narration…';
   void recordingFor(spec,win).catch(()=>null).then(verified=>{
     if(disposed){verified?.release();return;}
     play.disabled=false;
     if(restorePlayFocus && mode==='watch' && doc.activeElement===watch)play.focus({preventScroll:true});
     restorePlayFocus=false;
     if(!verified){mediaNote.textContent='Captioned walkthrough';return;}
     activeMedia=verified;stage.append(verified.audio);verified.audio.addEventListener('error',loseMedia,{once:true});
     sound.hidden=false;mediaNote.hidden=true;update();
   });
 }
 return Object.freeze({destroy,seekTo,setMode:changeMode});
}
const api=Object.freeze({validate,stateAt,mount});
if(typeof module==='object'&&module.exports)module.exports=api;else root.CalculatorWatchLesson=api;
})(globalThis);
