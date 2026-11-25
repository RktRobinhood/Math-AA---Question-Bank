'use strict';
(function(){
const $=id=>document.getElementById(id), {normalMass,density}=globalThis.NspireNormal;
const demo={mean:20,sd:2,lower:18,upper:23}, task={mean:20,sd:2,lower:23,upper:Infinity};
const defaults=['−∞','∞','0','1'], fields=['Lower Bound','Upper Bound','μ','σ'];
const menuItems={
 top:[['1','Actions'],['2','Number'],['3','Algebra'],['4','Calculus'],['5','Probability','probability'],['6','Statistics','statistics']],
 probability:[['1','Factorial'],['2','Permutations'],['3','Combinations'],['4','Random'],['5','Distributions','distributions']],
 statistics:[['1','Stat Calculations'],['2','Stat Results'],['3','List Math'],['4','List Operations'],['5','Distributions','distributions']],
 distributions:[['1','Normal Pdf'],['2','Normal Cdf','wizard'],['3','Inverse Normal'],['4','t Pdf'],['5','t Cdf']]
};
const base=()=>({page:'idle',branch:'probability',selected:0,field:0,values:defaults.slice(),replace:true,previous:'',answer:''});
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const show=n=>String(Number(n.toPrecision(7))).replace(/-/g,'−');
const bound=n=>n===Infinity?'∞':n===-Infinity?'−∞':show(n);
const fmtAnswer=n=>n===0?'≈0 (below display range)':String(Number(n.toPrecision(6)));
const rawBound=n=>n===Infinity?'∞':n===-Infinity?'−∞':String(n).replaceAll('-','−');
const parse=(val,allowInfinite)=> {
 const n=val.trim().replaceAll('−','-');
 if(allowInfinite&&/^[+-]?(?:∞|infinity|9(?:\.0*)?e\+?999)$/i.test(n))return n.startsWith('-')?-Infinity:Infinity;
 if(!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(n))return NaN;
 const a=Number(n);return Number.isFinite(a)?a:NaN;
};
function decode(v){
 const [lower,upper,mean,sd]=v.map((a,i)=>parse(a,i<2));
 if(!Number.isFinite(mean)||!Number.isFinite(sd)||sd<=0)throw Error('Use a finite mean and a standard deviation greater than zero.');
 if(Number.isNaN(lower)||Number.isNaN(upper))throw Error('Enter a number or infinity in each bound.');
 return {mean,sd,lower,upper};
}
function step(s,key){
 if(key==='esc'){
   if(s.page==='distributions'){s.page=s.branch;s.selected=4;}
   else if(['probability','statistics'].includes(s.page)){s.page='top';s.selected=s.branch==='probability'?4:5;}
   else if(s.page==='wizard'){s.page='idle';}
   else s.page=s.answer?'result':'idle';
   return;
 }
 if(key==='menu'){s.page='top';s.selected=0;return}
 if(menuItems[s.page]){
   const items=menuItems[s.page], i=items.findIndex(a=>a[0]===key);
   if(key==='down'||key==='up'){s.selected=(s.selected+(key==='down'?1:-1)+items.length)%items.length;return}
   const activate=(['right','enter','select'].includes(key)?items[s.selected]:i>=0?items[i]:null);
   if(!activate)return;
   if(!activate[2])throw Error('This lesson practises Normal Cdf. Use Probability or Statistics → Distributions.');
   s.page=activate[2];s.selected=0;
   if(['probability','statistics'].includes(s.page))s.branch=s.page;
   if(s.page==='wizard'){
     s.values=(s.prefill??defaults).slice();s.field=0;s.replace=true;
   }
   return;
 }
 if(s.page==='entry'&&key==='enter'){
   const model=decode(s.values), n=normalMass(model);
   s.answer=fmtAnswer(n);s.page='result';s.model=model;return;
 }
 if(s.page!=='wizard')return;
 if(key==='tab'||key==='up'||key==='down'||key==='shift-tab'){
   s.field=(s.field+(key==='up'||key==='shift-tab'?5:1))%6;
   s.replace=true;return;
 }
 if(key==='enter'||key==='select'){
   if(s.field===5){s.page='idle';return}
   const model=decode(s.values);normalMass(model);
   s.previous='normCdf('+[model.lower,model.upper,model.mean,model.sd].map(rawBound).join(',')+')';
   s.page='entry';s.answer='';return;
 }
 if(s.field>3)return;
 const ch=key==='del'?'':key==='ee'?'e':/^[\da-z]$/.test(key)?key:({dot:'.',neg:'−',minus:'−',plus:'+',infinity:'∞'})[key];
 if(ch===undefined)return;
 const old=s.values[s.field];
 if(key==='del')s.values[s.field]=s.replace?'':old.slice(0,-1);
 else if(s.replace||old.length<21)s.values[s.field]=s.replace?ch:old+ch;
 s.replace=false;
}
function LCD(s){
 const drawMenu=(id,ix)=>'<ul class="lcd-menu">'+menuItems[id].map(([k,n,to],j)=>'<li'+(j===ix?' class="current"':'')+'>'+k+': '+n+(to&&to!=='wizard'?' ▸':'')+'</li>').join('')+'</ul>';
 if(menuItems[s.page]){
   let menu=s.page==='top'?drawMenu('top',s.selected):s.page==='distributions'?drawMenu(s.branch,4)+drawMenu(s.page,s.selected):drawMenu('top',s.branch==='statistics'?5:4)+drawMenu(s.page,s.selected);
   return '<div class="menu-stack">'+menu+'</div>';
 }
 if(s.page==='wizard')return '<div class="lcd-dialog"><strong>Normal Cdf</strong>'+fields.map((f,i)=>'<div class="lcd-field'+(i===s.field?' active':'')+'"><span>'+f+':</span><span>'+esc(s.values[i].replace(/infinity/ig,'∞'))+'&nbsp;</span></div>').join('')+'<div class="lcd-ok"><span class="'+(s.field===4?'active':'')+'">OK</span> <span class="'+(s.field===5?'active':'')+'">Cancel</span></div></div>';
 return (s.page==='result'?'<p>'+esc(s.previous)+'</p><p class="answers"><strong>'+esc(s.answer)+'</strong></p>':'')+'<div class="entry"><p>'+esc(s.page==='entry'?s.previous:'▏')+'</p></div>';
}
const qp=new URL(location.href).searchParams;
const qpMode=qp.get('mode'), tryHost=$('try-host'), work=$('try-work'), tryFeedback=$('try-feedback');
const fresh=(prefill=null)=>({...base(),prefill,model:null,error:''});
const forks=new Map(), MAX_FORKS=32;
let practice=fresh(),live=practice,forkKey=null,customLoaded=false,restoreFocus=false;
function paintTry(){
 work.innerHTML=LCD(live);tryFeedback.textContent=live.error;
 if(live.model)curve($('try-curve'),live.model);
 else $('try-curve').replaceChildren();
 const inFork=forkKey!==null;
 $('link-notice').hidden=inFork||!assignment.error;
 $('model').hidden=inFork;$('model-feedback').hidden=inFork;
 $('bench-title').textContent=inFork?'Watch copy':'Set your example';
 $('bench-instructions').textContent=inFork?'Practise the keys here. Your separate Try is unchanged.':'Set a new distribution or event, then practise its calculator entries.';
 $('exercise').hidden=inFork||customLoaded;
 $('reset-try').textContent=inFork?'Return to your Try':'Reset Try';
 $('return-watch').textContent=inFork?'Return to paused Watch':'Return to Watch';
 $('fork-label').textContent=inFork?'Watch copy at '+timecode(now):'';
}
function interact(key){
 try{
   step(live,key);live.error='';
 }catch(err){live.error=err.message;live.selected=live.selected??0}
 paintTry();
}
const watchShell=HandheldShell.mount({host:'#watch-host',screen:'#watch-host .screen',interactive:false,label:'Demonstrated TI-Nspire CX II-T'});
const tryShell=HandheldShell.mount({host:tryHost,screen:'#try-host .screen',onKey:key=>{interact(key);tryHost.focus({preventScroll:true});},label:'Interactive TI-Nspire CX II-T'});
document.addEventListener('keydown',e=>{
 if($('try').hidden||e.altKey||e.metaKey||e.ctrlKey||e.repeat)return;
 const focused=e.target===tryHost,fromBody=e.target===document.body||e.target===$('try');
 if(!focused&&!fromBody)return;
 if(e.key==='Tab'&&(!focused||live.page!=='wizard'||(e.shiftKey?live.field===0:live.field===5)))return;
 const k=e.key.toLowerCase()==='m'&&live.page!=='wizard'?'menu':e.key==='Tab'?e.shiftKey?'shift-tab':'tab':e.key;
 const norm=HandheldShell.normalizeKey(k), key=tryShell.getKey(norm);
 if(!key&&!['shift-tab','infinity'].includes(norm))return;
 e.preventDefault();
 tryHost.focus({preventScroll:true});
 if(key)key.click();else interact(norm);
});
const voice=window.CT39Voice,fallback=voice.rehearsal(window.NormalNarration);
const timecode=t=>Math.floor(t/60)+':'+String(Math.floor(t)%60).padStart(2,'0');
const seek=$('seek'),play=$('play'),stagePlay=$('stage-play'),steps=$('steps'),audio=$('narration'),notice=$('audio-state');
let track=fallback,duration=track.duration,now=0,running=false,raf=0,reference=0,last=-2,active=-2,phase='';
let mediaState='rehearsal',pending=false,generation=0,loadingTimeout=0,playTimeout=0;
function snapshotAt(t){
 const snapshot=base();
 for(const [time,key] of track.keys){if(time>t)break;step(snapshot,key);}
 return snapshot;
}
function render(t){
 stagePlay.hidden=t>.005||running||pending||mediaState==='loading';
 stagePlay.setAttribute('aria-label',mediaState==='ready'?'Play demonstration':'Play caption rehearsal');
 const done=t>=duration-.005;
 $('take-over').textContent=done?'Open Try':'Take over';
 $('take-over').setAttribute('aria-label',done?'Open Try':'Take over the calculator');
 seek.value=String(t);seek.setAttribute('aria-valuetext',timecode(t)+' of '+timecode(duration));$('clock').textContent=timecode(t)+' / '+timecode(duration);
 const frame=voice.frameAt(track,t);
 watchShell.setKeys(frame.highlight?[frame.highlight]:[]);
 if(last!==frame.lastKey){
   $('screen-work').innerHTML=LCD(snapshotAt(t));last=frame.lastKey;
 }
 if(active!==frame.caption){
   active=frame.caption;$('caption').textContent=track.captions[active]?.text??'';
   [...steps.children].forEach((li,i)=>li.firstElementChild.setAttribute('aria-current',String(i===active)));
 }
 // Scene time is independent of caption and LCD caches; seek both directions.
 if(phase!==frame.phase){
   phase=frame.phase;
   const upper=phase==='tail',context=upper?{...demo,lower:22,upper:Infinity}:demo;
   $('worked-event').textContent=upper?'P(X > 22)':'P(18 < X < 23)';
   curve($('compact-curve'),context);curve($('watch-curve'),context);
 }
}
function updatePlay(){
 const name=pending?'Pause':running?'Pause':now>=duration-.02?'Replay':'Play';
 stagePlay.hidden=now>.005||running||pending||mediaState==='loading';
 stagePlay.setAttribute('aria-label',mediaState==='ready'?'Play demonstration':'Play caption rehearsal');
 play.dataset.playing=String(running);play.textContent=name;play.setAttribute('aria-label',name);
}
function configure(profile,secs=profile.duration,position=0){
 track=profile;duration=secs;last=profile.measured?-2:-1;active=-2;phase='';
 $('screen-work').replaceChildren();
 steps.replaceChildren();
 track.captions.forEach(({title,t},i)=>{
  const li=document.createElement('li'), b=document.createElement('button'), num=document.createElement('span');
  b.type='button';num.textContent=String(i+1).padStart(2,'0');b.append(num,document.createTextNode(title));
  b.addEventListener('click',()=>go(t));li.append(b);steps.append(li);
 });
 $('transcript').textContent=track.captions.map(c=>c.text).join(' ');
 seek.step=profile.measured?'.001':'.01';seek.max=String(duration);
 $('caption-beta').hidden=profile.measured;go(position);updatePlay();
}
const clampTime=x=>Math.min(duration,Math.max(0,Number.isFinite(x)?x:0));
function go(t){
 now=clampTime(t);
 if(mediaState==='ready'){
   if(Math.abs(audio.currentTime-now)>.0005)audio.currentTime=now;
 }else reference=performance.now()-now*1000;
 render(now);
 if(!running)updatePlay();
}
function stop(capture=true){
 if(capture&&running)now=clampTime(mediaState==='ready'?audio.currentTime:(performance.now()-reference)/1000);
 generation++;clearTimeout(playTimeout);pending=false;running=false;audio.pause();cancelAnimationFrame(raf);render(now);updatePlay();
}
function tick(ts){
 if(!running)return;
 if(mediaState==='ready'){
   if(audio.ended){now=duration;stop(false);return;}
   now=clampTime(audio.currentTime);
 }else{
   now=clampTime((ts-reference)/1000);
   if(now>=duration){stop(false);return;}
 }
 render(now);raf=requestAnimationFrame(tick);
}
function explain(msg){notice.textContent=msg;notice.hidden=!msg;}
function startCaptionClock(){
 pending=false;reference=performance.now()-now*1000;running=true;updatePlay();
 raf=requestAnimationFrame(tick);
}
function fallbackFromAudio(msg){
 if(mediaState==='rehearsal')return;
 clearTimeout(loadingTimeout);
 const intent=pending||running, observed=audio.currentTime;
 const sourceTime=running&&!audio.seeking&&Number.isFinite(observed)&&Math.abs(observed-now)<1?observed:now;
 const position=voice.toRehearsal(track,fallback,sourceTime,duration);
 stop(false);
 mediaState='rehearsal';audio.removeAttribute('src');audio.load();
 play.disabled=false;configure(fallback,fallback.duration,position);explain(msg+' Caption-only rehearsal is available.');
 if(intent&&position<fallback.duration)startCaptionClock();
}
function prepare(profile){
 mediaState='loading';play.disabled=true;explain('Preparing narration…');
 audio.addEventListener('loadedmetadata',()=>{
   if(mediaState!=='loading')return;
   if(!voice.mediaDurationMatches(profile,audio.duration)){
     fallbackFromAudio('Narration does not match its measured cues.');return;
   }
   clearTimeout(loadingTimeout);mediaState='ready';
   configure(profile,audio.duration);play.disabled=false;explain('');
 });
 audio.addEventListener('durationchange',()=>{
   if(mediaState!=='ready')return;
   if(!voice.mediaDurationMatches(profile,audio.duration)){fallbackFromAudio('Narration duration changed unexpectedly.');return;}
   if(duration!==audio.duration){
    duration=audio.duration;seek.max=String(duration);now=clampTime(now);
    render(now);if(!running)updatePlay();
   }
 });
 audio.addEventListener('error',()=>fallbackFromAudio('Narration could not load.'));
 loadingTimeout=setTimeout(()=>fallbackFromAudio('Narration did not load in time.'),4000);
 audio.src=profile.file;audio.load();
}
async function start(){
 if(mediaState==='loading')return;
 if(now>=duration-.02)go(0);
 const ticket=++generation;
 if(mediaState==='ready'){
   pending=true;updatePlay();
   playTimeout=setTimeout(()=>{if(ticket===generation&&pending)fallbackFromAudio('Narration did not start in time.');},4000);
   try{
     if(Math.abs(audio.currentTime-now)>.0005)audio.currentTime=now;
     await audio.play();
     if(ticket!==generation){if(mediaState!=='ready'||!pending&&!running)audio.pause();return;}
     clearTimeout(playTimeout);
   }catch{
     if(ticket===generation)fallbackFromAudio('Narration could not play.');
     return;
   }
 }else{startCaptionClock();return;}
 pending=false;running=true;updatePlay();raf=requestAnimationFrame(tick);
}
audio.addEventListener('ended',()=>{
 if(running&&mediaState==='ready'){now=duration;stop(false);}
});
play.addEventListener('click',()=>running||pending?stop():void start());
stagePlay.addEventListener('click',()=>{play.click();play.focus({preventScroll:true});});
configure(fallback);
if(window.NormalMeasuredCues!==undefined){
 try{prepare(voice.validate(window.NormalMeasuredCues));}
 catch(err){explain('Measured narration could not be enabled. Caption-only rehearsal is available.');}
}
seek.addEventListener('input',()=>go(Number(seek.value)));
$('captions').addEventListener('change',()=>{$('caption').hidden=!$('captions').checked});
HandheldTransport.controls({container:document.querySelector('.player-top'),play,seek,active:()=>!$('watch').hidden});
const focusButton=$('watch').querySelector('.cx-transport-button[aria-label="Focused view"]');
const focusText=document.createElement('span');focusText.className='focus-label';focusText.textContent=' Focus';focusButton?.append(focusText);
const viewer=$('watch').querySelector('.viewer');
const outer=[document.querySelector('main>.header'),document.querySelector('main>.tabs'),document.querySelector('main>.notes'),$('watch').querySelector('.director')];
const fitWatch=()=>{
 if($('watch').hidden)return;
 const host=$('watch-host').getBoundingClientRect();
 if(!host.width)return;
 const focused=viewer.classList.contains('cx-focused');
 const device=watchShell.body.getBoundingClientRect();
 const shellPadding=host.height-device.height;
 const strip=viewer.querySelector('.player').getBoundingClientRect().height;
 if(focused){
   const landscape=matchMedia('(min-width:701px) and (max-height:700px)').matches;
   const room=viewer.getBoundingClientRect().bottom-host.top-shellPadding-2-(landscape?0:strip);
   viewer.style.setProperty('--ct39-fit',Math.max(155,Math.floor(room*558/1168))+'px');
 }else if(matchMedia('(max-width:700px)').matches){
   const room=document.documentElement.clientHeight-host.top-window.scrollY-shellPadding-strip-4;
   viewer.style.setProperty('--ct39-fit-page',Math.max(167,Math.floor(room*558/1168))+'px');
 }
};
const observer=new ResizeObserver(fitWatch);
[viewer,...outer.slice(0,2),...viewer.querySelectorAll('.player,#caption,.worked-prompt,#audio-state')].forEach(el=>observer.observe(el));
window.addEventListener('resize',fitWatch);
const syncFocus=()=>{
 const focused=viewer.classList.contains('cx-focused')&&!$('watch').hidden;
 outer.forEach(el=>{el.inert=focused;});
 $('watch').tabIndex=focused?-1:0;
 fitWatch();
};
new MutationObserver(syncFocus).observe(viewer,{attributes:true,attributeFilter:['class']});
const tabs=[$('watch-tab'),$('try-tab')];
let enteredWatch=false;
function tab(i,target){
 if(i!==0){
   if(running||pending)stop();
   if(viewer.classList.contains('cx-focused'))focusButton.click();
 }
 tabs.forEach((el,k)=>{el.tabIndex=k===i?0:-1;el.setAttribute('aria-selected',String(k===i));$(el.getAttribute('aria-controls')).hidden=k!==i});
 if(i===0){
   if((restoreFocus||!enteredWatch&&matchMedia('(max-height:700px), (max-width:700px) and (max-height:760px)').matches)&&!viewer.classList.contains('cx-focused'))focusButton.click();
   enteredWatch=true;
   window.scrollTo({top:0,left:0,behavior:'instant'});
   viewer.scrollTop=0;
 }
 syncFocus();
 if(target)(i?tryHost:play).focus({preventScroll:true});
}
function openPractice(focus=true,saveFocus=false){
 restoreFocus=saveFocus&&viewer.classList.contains('cx-focused');forkKey=null;live=practice;paintTry();tab(1,focus);
}
tabs.forEach((el,i)=>{
 el.addEventListener('click',()=>{if(i)openPractice();else tab(0,false);});
 el.addEventListener('keydown',e=>{
   if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const j=e.key==='Home'?0:e.key==='End'?1:1-i;if(j)openPractice(false);else tab(0,false);tabs[j].focus();}
 });
});
$('to-try').addEventListener('click',()=>openPractice());
$('take-over').addEventListener('click',()=>{
   if(running||pending)stop();
   if(now>=duration-.005){openPractice(true,true);return;}
   restoreFocus=viewer.classList.contains('cx-focused');
   forkKey=track.measured+'@'+now.toFixed(3);
   live=forks.get(forkKey)??Object.assign(fresh(),snapshotAt(now));
   forks.delete(forkKey);forks.set(forkKey,live);
   if(forks.size>MAX_FORKS)forks.delete(forks.keys().next().value);
   paintTry();tab(1,true);
});
$('reset-try').addEventListener('click',()=>{
 if(forkKey!==null){openPractice();return;}
 restorePractice();tryHost.focus({preventScroll:true});
});
$('return-watch').addEventListener('click',()=>tab(0,true));
const theme=$('theme'),themeKey='ti-lab-theme';
try{const saved=localStorage.getItem(themeKey);theme.value=['dark','light'].includes(saved)?saved:'system'}catch{}
function setTheme(){document.documentElement.dataset.theme=theme.value;try{localStorage.setItem(themeKey,theme.value)}catch{}}
theme.addEventListener('change',setTheme);setTheme();
const ui={mean:$('mean'),sd:$('sd'),lower:$('lower'),upper:$('upper'),event:$('event')};
function curve(el,{mean,sd,lower=-Infinity,upper=Infinity}){
 const L=18,R=314,B=79;
 const clamp=(v)=>Math.max(-4.35,Math.min(4.35,v));
 const x=z=>L+(z+4.4)*(R-L)/8.8,y=z=>B-150*density(z);
 const path=(a,b)=>{
  const out=[];for(let i=0;i<=84;i++){const z=a+(b-a)*i/84;out.push((i?'L':'M')+x(z).toFixed(2)+','+y(z).toFixed(2))}return out.join(' ');
 };
 const a=(lower-mean)/sd,b=(upper-mean)/sd,aa=clamp(a),bb=clamp(b);
 const drawn=aa<bb?'<path class="shade" d="'+path(aa,bb)+' L'+x(bb).toFixed(2)+','+B+' L'+x(aa).toFixed(2)+','+B+' Z"/>':'';
 const cutData=[];
 if(Number.isFinite(a)&&Math.abs(a)<4.3)cutData.push([a,lower]);
 if(Number.isFinite(b)&&Math.abs(b)<4.3)cutData.push([b,upper]);
 const lab0=show(mean);
 const cuts=cutData.map(([z,f],i)=>{
   const v=x(z).toFixed(2), at=i===1&&Math.abs(z-cutData[0][0])<.6?110:96;
   return '<path class="cut" d="M'+v+','+B+' V'+y(z).toFixed(2)+'"/>'+ (Math.abs(z)>.23?'<text x="'+v+'" y="'+at+'" text-anchor="middle">'+show(f)+'</text>':'');
 }).join('');
 el.innerHTML='<svg viewBox="0 0 332 117" role="img" aria-label="Normal curve; shaded from '+bound(lower)+' to '+bound(upper)+'" xmlns="http://www.w3.org/2000/svg"><path class="axis" d="M12,'+B+' H320"/>'+drawn+'<path class="bell" d="'+path(-4.35,4.35)+'"/><path class="axis" d="M'+x(0)+','+(B-2)+' v4"/><text x="'+x(0)+'" y="96" text-anchor="middle">'+lab0+'</text>'+cuts+'</svg>';
}


const modelFeedback=$('model-feedback'), tryCurve=$('try-curve');
function update(){
 const mode=ui.event.value,isBelow=mode==='lower',isAbove=mode==='upper';
 $('lower-row').hidden=isBelow;$('upper-row').hidden=isAbove;
 $('lower-label').textContent=isAbove?'Threshold':'Lower bound';
 $('upper-label').textContent=isBelow?'Threshold':'Upper bound';
 const l=isBelow?'−∞':ui.lower.value===''?'…':ui.lower.value.replace('-','−');
 const r=isAbove?'∞':ui.upper.value===''?'…':ui.upper.value.replace('-','−');
 $('event-line').textContent=isBelow?'P(X < '+r+')':isAbove?'P(X > '+l+')':'P('+l+' < X < '+r+')';
 modelFeedback.textContent='';
}
Object.values(ui).forEach(el=>el.addEventListener(el===ui.event?'change':'input',update));
const linkParams=['event','mean','sd','lower','upper','example'];
const valuesFor=(m,threshold=true)=>[
 threshold||m.lower===-Infinity?rawBound(m.lower):'',
 threshold||m.upper===Infinity?rawBound(m.upper):'',rawBound(m.mean),rawBound(m.sd)
];
function fromURL(){
 if(qpMode!=='try')return {model:task,event:'upper'};
 if(!linkParams.some(k=>qp.has(k)))return {model:task,event:'upper'};
 try{
   if(['mode',...linkParams].some(k=>qp.getAll(k).length>1))throw Error();
   if(qp.has('example')){
     if(qp.get('example')!=='demo'||linkParams.slice(0,-1).some(k=>qp.has(k)))throw Error();
     return {event:'upper',model:task,linked:true,threshold:false};
   }
   const event=qp.get('event'), names={range:['lower','upper'],lower:['upper'],upper:['lower']}[event];
   if(!Array.isArray(names))throw Error();
   const needed=['event','mean','sd',...names];
   if(linkParams.some(k=>qp.has(k)!==needed.includes(k)))throw Error();
   const n=k=>{
     const raw=qp.get(k), v=raw&&raw.length<=21?parse(raw,false):NaN;
     if(!Number.isFinite(v)||Math.abs(v)>(k==='lower'||k==='upper'?1e10:1e9))throw Error();
     return v;
   };
   const model={mean:n('mean'),sd:n('sd'),lower:event==='lower'?-Infinity:n('lower'),upper:event==='upper'?Infinity:n('upper')};
   normalMass(model);
   return {event,model,linked:true,threshold:true};
 }catch{
   return {event:'upper',model:task,error:'The link needs an event, a finite mean, a positive SD and the relevant bound(s). Open original Try or set your own values below.'};
 }
}
const assignment=fromURL();
const eventLabel=(type,model)=>{
 const l=rawBound(model.lower), u=rawBound(model.upper);
 return type==='lower'?'P(X < '+u+')':type==='upper'?'P(X > '+l+')':'P('+l+' < X < '+u+')';
};
const read=()=>[ui.event.value==='lower'?'−∞':ui.lower.value,ui.event.value==='upper'?'∞':ui.upper.value,ui.mean.value,ui.sd.value].map(a=>a.replaceAll('-','−'));
function restorePractice(){
 const {model,event,linked,threshold,error}=assignment;
 practice=fresh(linked?valuesFor(model,threshold):null);live=practice;customLoaded=false;
 ui.event.value=event;ui.mean.value=model.mean;ui.sd.value=model.sd;
 ui.lower.value=linked&&threshold&&Number.isFinite(model.lower)?model.lower:'';
 ui.upper.value=linked&&threshold&&Number.isFinite(model.upper)?model.upper:'';
 $('challenge-title').textContent=event==='range'?'Interval practice':'Tail practice';
 $('challenge-prompt').textContent='Mean '+rawBound(model.mean)+', standard deviation '+rawBound(model.sd)+'. Find '+eventLabel(event,model)+'.';
 $('hint').textContent=(event==='lower'?'Leave the lower bound at −∞. ':event==='upper'?'Leave the upper bound at ∞. ':'Enter both finite bounds in increasing order. ')+'Use the standard deviation, not the variance.';
 $('answer').value='';$('feedback').textContent='';$('feedback').className='feedback';
 $('link-notice').textContent=error??'';$('link-notice').hidden=!error;
 update();paintTry();
}
$('model').addEventListener('submit',e=>{
 e.preventDefault();
 if(forkKey!==null)return;
 try{
   const draft=read(), m=decode(draft);
   normalMass(m);
   const expected=assignment.model;
   customLoaded=['lower','upper','mean','sd'].some(k=>m[k]!==expected[k]);
   practice=fresh(draft);live=practice;
   paintTry();
   modelFeedback.textContent='Loaded. Open Menu → Probability → Distributions → Normal Cdf.';
   tryHost.focus({preventScroll:true});
 }catch(err){modelFeedback.textContent=err.message;}
});
$('answer').addEventListener('input',()=>{$('feedback').textContent='';$('feedback').className='feedback';});
$('answer-form').addEventListener('submit',e=>{
 e.preventDefault();
 if(forkKey!==null||customLoaded)return;
 const raw=$('answer').value.trim().replace(',','.'),v=Number(raw),el=$('feedback'),prob=normalMass(assignment.model),expected=prob.toFixed(4);
 let ok=false;
 if(!raw||!Number.isFinite(v)||v<0||v>1)el.textContent='Enter a probability from 0 to 1.';
 else if(v===Number(expected)&&/^(?:[01])?\.\d{4}$/.test(raw)){ok=true;el.textContent='Correct: '+expected+'. That is the requested area under the normal curve.'}
 else if(v===Number(expected)||Math.abs(v-prob)<5e-6)el.textContent='The area is right. Write the probability to four decimal places.';
 else el.textContent='Not yet. Check the shaded region, each bound, and that you used the standard deviation.';
 el.classList.toggle('is-right',ok);el.classList.toggle('is-wrong',!ok);
});
restorePractice();
if(qpMode==='try')openPractice(false);
else tab(0,false);
})();
