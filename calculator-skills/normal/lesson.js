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
 const drawMenu=(id,ix)=>'<ul class="lcd-menu">'+menuItems[id].map(([k,n,to],j)=>'<li data-menu-item="'+k+'" data-menu-page="'+id+'"'+(j===ix?' class="current"':'')+'>'+k+': '+n+(to&&to!=='wizard'?' ▸':'')+'</li>').join('')+'</ul>';
 if(menuItems[s.page]){
   let menu=s.page==='top'?drawMenu('top',s.selected):s.page==='distributions'?drawMenu(s.branch,4)+drawMenu(s.page,s.selected):drawMenu('top',s.branch==='statistics'?5:4)+drawMenu(s.page,s.selected);
   return '<div class="menu-stack">'+menu+'</div>';
 }
 if(s.page==='wizard')return '<div class="lcd-dialog"><strong>Normal Cdf</strong>'+fields.map((f,i)=>'<div data-field="'+i+'" class="lcd-field'+(i===s.field?' active':'')+'"><span>'+f+':</span><span>'+esc(s.values[i].replace(/infinity/ig,'∞'))+'&nbsp;</span></div>').join('')+'<div class="lcd-ok"><span data-dialog="4" class="'+(s.field===4?'active':'')+'">OK</span> <span data-dialog="5" class="'+(s.field===5?'active':'')+'">Cancel</span></div></div>';
 return (s.page==='result'?'<p>'+esc(s.previous)+'</p><p class="answers"><strong>'+esc(s.answer)+'</strong></p>':'')+'<div class="entry"><p>'+esc(s.page==='entry'?s.previous:'▏')+'</p></div>';
}
const qp=new URL(location.href).searchParams;
const qpMode=qp.get('mode'), tryHost=$('try-host'), work=$('try-work'), tryFeedback=$('try-feedback');
const fresh=(prefill=null)=>({...base(),prefill,model:null,error:''});
let live=fresh();
function paintTry(){
 work.innerHTML=LCD(live);tryFeedback.textContent=live.error;
 if(live.page==='result'&&live.model)curve($('try-curve'),live.model);
 else $('try-curve').replaceChildren();

}
function interact(key){
 try{
   step(live,key);live.error='';
 }catch(err){live.error=err.message;live.selected=live.selected??0}
 paintTry();
}
const watchShell=HandheldShell.mount({host:'#watch-host',screen:'#watch-host .screen',interactive:false,label:'Demonstrated TI-Nspire CX II-T'});
work.addEventListener('click',e=>{
 const menu=e.target.closest('[data-menu-item]'),field=e.target.closest('[data-field]'),button=e.target.closest('[data-dialog]');
 if(menu&&menu.dataset.menuPage===live.page)interact(menu.dataset.menuItem);
 else if(field&&live.page==='wizard'){live.field=Number(field.dataset.field);live.replace=true;paintTry();}
 else if(button&&live.page==='wizard'){live.field=Number(button.dataset.dialog);interact('enter');}
 else return;
 tryHost.focus({preventScroll:true});
});
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
const voice=window.CT39Voice,plan=window.CT39WatchPlan;
let fallback=plan.make(1);
const timecode=t=>Math.floor(t/60)+':'+String(Math.floor(t)%60).padStart(2,'0');
const seek=$('seek'),play=$('play'),steps=$('steps'),audio=$('narration'),notice=$('audio-state');
const stage=$('watch-stage'),surface=$('watch-surface'),overlay=$('play-feedback'),speed=$('play-rate'),devicePane=$('watch-device-pane');
const player=CalculatorWatchPlayer.mount({player:stage,surface,play,seek,expand:$('fullscreen'),feedback:overlay,active:()=>!$('watch').hidden});
const frameKey='qb-calculator-watch-frame';
let framing='screen';
try{if(localStorage.getItem(frameKey)==='full')framing='full';}catch{}
function frame(next,save=false){
 framing=next;
 if(save)try{localStorage.setItem(frameKey,next);}catch{}
 stage.dataset.frame=next;devicePane.scrollTop=0;
 $('view-screen').setAttribute('aria-pressed',String(next==='screen'));
 $('view-full').setAttribute('aria-pressed',String(next==='full'));
 fitWatch();
}
$('view-screen').addEventListener('click',()=>frame('screen',true));
$('view-full').addEventListener('click',()=>frame('full',true));
let track=fallback,duration=track.duration,now=0,running=false,raf=0,reference=0,last=-2,active=-2,phase='';
const trail=$('key-steps');let chips=[],compact=[],shownTrail=-2;
function keyName(key){return ({menu:'Menu',tab:'Tab',enter:'Enter',dot:'.'})[key]??key;}
let mediaState='rehearsal',pending=false,generation=0,loadingTimeout=0,playTimeout=0;
function snapshotAt(t){
 const snapshot=base();
 const start=t>=track.states['tail-context']?track.states['tail-context']:0;
 for(const [time,key] of track.keys){if(time>t)break;if(time>=start)step(snapshot,key);}
 return snapshot;
}
function render(t){
 seek.value=String(t);seek.setAttribute('aria-valuetext',timecode(t)+' of '+timecode(duration));$('clock').textContent=timecode(t)+' / '+timecode(duration);
 const frame=voice.frameAt(track,t);
 const stale=frame.phase==='tail'&&track.keys[frame.lastKey]?.[0]<track.states['tail-context'];
 watchShell.setKeys(frame.highlight&&!stale?[frame.highlight]:[]);
 const chapter=(track.chapters??track.captions).findLastIndex(c=>c.t<=t);
 if(shownTrail!==frame.lastKey||active!==chapter){
  shownTrail=frame.lastKey;
  for(const [i,v] of chips.entries()){
   const state=i===shownTrail?'current':i<shownTrail?'done':'next';v.dataset.progress=state;
   if(state==='current')v.setAttribute('aria-current','step');else v.removeAttribute('aria-current');
   compact[i].firstElementChild.dataset.progress=state;compact[i].hidden=Number(compact[i].dataset.chapter)!==chapter;
  }
  $('key-label').textContent=chapter<0?'Keys':'Keys '+String(chapter+1).padStart(2,'0');
  const any=compact.some(n=>!n.hidden);
  trail.classList.toggle('no-keys',!any);const activeCell=compact[shownTrail];
  if(activeCell&&!activeCell.hidden)trail.scrollLeft=Math.max(0,activeCell.offsetLeft+activeCell.offsetWidth-trail.clientWidth);
  else trail.scrollLeft=0;
 }
 if(last!==frame.lastKey||phase!==frame.phase){
   $('screen-work').innerHTML=LCD(snapshotAt(t));last=frame.lastKey;
 }
 const cue=track.captions[frame.caption];
 let text=cue&&t<(cue.until??Infinity)?cue.text:'';
 // Measured assets use the same pre-Enter disclosure rule as rehearsal.
 if(track.measured&&((frame.caption===4&&t<track.states['range-result'])||(frame.caption===7&&t<track.states['tail-result'])))
  text=text.split(/\bThe (?:upper-tail )?probability is about\b/)[0].trimEnd();
 if($('caption').textContent!==text)$('caption').textContent=text;
 stage.dataset.phase=track.layout?(track.layout.at(t).speaking?'read':'hold'):'voice';
 $('pace-tip').textContent=track.why?.[chapter]??'';
 $('pace-tip').hidden=!track.why;
 if(active!==chapter){
   active=chapter;
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
 play.dataset.playing=String(running);play.title=name;play.setAttribute('aria-label',name);
 play.querySelector('.play-icon').toggleAttribute('hidden',running||pending);
 play.querySelector('.pause-icon').toggleAttribute('hidden',!running&&!pending);
 if(!running&&!pending&&now<=.005&&mediaState!=='loading'){
   overlay.dataset.action='play';overlay.dataset.initial='true';overlay.hidden=false;
 }
}
function configure(profile,secs=profile.duration,position=0){
 track=profile;duration=secs;last=profile.measured?-2:-1;active=-2;phase='';
 $('screen-work').replaceChildren();
 steps.replaceChildren();
 const chapters=track.chapters??track.captions;
 chips=[];compact=[];
 chapters.forEach(({title,t},i)=>{
  const li=document.createElement('li'), b=document.createElement('button'), num=document.createElement('span');
  b.type='button';num.textContent=String(i+1).padStart(2,'0');b.append(num,document.createTextNode(title));
  b.addEventListener('click',()=>go(t));li.append(b);steps.append(li);
  const group=document.createElement('div');group.className='step-chips';group.setAttribute('aria-label',title+' keys');group.setAttribute('role','list');
  track.keys.forEach(([at,key],j)=>{
   if(at<t||at>=(chapters[i+1]?.t??Infinity))return;
   const chip=document.createElement('kbd');chip.textContent=keyName(key);chip.setAttribute('role','listitem');group.append(chip);chips[j]=chip;
   const cell=document.createElement('li');cell.dataset.chapter=i;const clone=chip.cloneNode(true);clone.removeAttribute('role');cell.append(clone);compact[j]=cell;
  });
  if(group.children.length)li.append(group);
 });
 trail.replaceChildren(...compact);shownTrail=-2;
 $('transcript').textContent=track.transcript??track.captions.map(c=>c.text).join(' ');
 speed.disabled=profile.measured;
 speed.title=profile.measured?'The approved narration plays at normal speed.':'';

 seek.step=profile.measured?'.001':'.01';seek.max=String(duration);
 $('caption-beta').hidden=profile.measured;go(position);updatePlay();
}
const clampTime=x=>Math.min(duration,Math.max(0,Number.isFinite(x)?x:0));
function go(t){
 now=clampTime(t);
 if(mediaState==='ready'){
   if(Math.abs(audio.currentTime-now)>.0005)audio.currentTime=now;
 }else reference=performance.now()-now*1000;
 if(!running&&now>.005&&overlay.dataset.initial==='true'){overlay.dataset.initial='false';player.clear();}
 render(now);fitWatch();
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
   audio.playbackRate=1;configure(profile,audio.duration);play.disabled=false;explain('');
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
play.addEventListener('click',()=>{
 if(mediaState==='loading')return;
 const stopping=running||pending;
 overlay.dataset.initial='false';player.clear();
 if(stopping)stop();else void start();
 player.flash(!stopping);
});
configure(fallback);
if(window.NormalMeasuredCues!==undefined){
 try{prepare(voice.validate(window.NormalMeasuredCues));}
 catch(err){explain('Measured narration could not be enabled. Caption-only rehearsal is available.');}
}
seek.addEventListener('input',()=>go(Number(seek.value)));
speed.addEventListener('change',()=>{
 if(mediaState==='ready')return;
 const resume=running;
 if(resume)stop();
 const previous=fallback;
 fallback=plan.make(Number(speed.value));
 configure(fallback,fallback.duration,fallback.layout.remap(previous.layout,now));
 if(resume)startCaptionClock();
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&(running||pending))stop();});
$('cc').addEventListener('click',()=>{
 const hide=!$('caption-band').hidden;
 $('caption-band').hidden=hide;
 $('cc').setAttribute('aria-pressed',String(!hide));
 $('cc').setAttribute('aria-label',hide?'Show captions':'Hide captions');
 fitWatch();
});
function fitWatch(){
 if($('watch').hidden)return;
 const expanded=stage.matches(':fullscreen,.watch-fullscreen-fallback');
 const max=(window.visualViewport?.height||innerHeight)-surface.getBoundingClientRect().top-(expanded?0:window.scrollY);
 const footer=$('watch-player').offsetHeight+(expanded?0:(document.querySelector('.tabbar')?.offsetHeight||0));
 const overhead=footer+$('pace-tip').offsetHeight+$('key-strip').offsetHeight+surface.querySelector('.worked-prompt').offsetHeight+22;
 const available=max-overhead;
 const full=Math.min(expanded?350:267,Math.max(142,Math.floor(available*558/1168)));
 const needsScroll=framing==='full'&&Math.ceil(full*1168/558)>available+2;
 $('full-fit-note').hidden=!needsScroll;
 devicePane.tabIndex=needsScroll?0:-1;
 if(needsScroll)devicePane.setAttribute('aria-label','Full calculator. Scroll to see the keypad.');
 else devicePane.removeAttribute('aria-label');
 stage.style.setProperty('--normal-full-fit',full+'px');
 stage.style.setProperty('--normal-full-max-h',needsScroll?Math.max(108,available-27)+'px':'none');
 stage.style.setProperty('--normal-screen-fit',Math.min(expanded?620:420,Math.max(160,Math.floor(available*4/3)))+'px');
}
const resize=new ResizeObserver(fitWatch);
[$('pace-tip'),$('watch-player'),surface.querySelector('.worked-prompt'),document.querySelector('main>.header')].forEach(el=>resize.observe(el));
window.addEventListener('resize',fitWatch);
document.addEventListener('fullscreenchange',fitWatch);
frame(framing);
const tabs=[$('watch-tab'),$('try-tab')];
function tab(i,target){
 if(i){if(running||pending)stop();void player.exit();}
 tabs.forEach((el,k)=>{el.tabIndex=k===i?0:-1;el.setAttribute('aria-selected',String(k===i));$(el.getAttribute('aria-controls')).hidden=k!==i});
 if(!i){window.scrollTo({top:0,left:0,behavior:'instant'});fitWatch();}
 if(target)(i?tryHost:play).focus({preventScroll:true});
}
tabs.forEach((el,i)=>{
 el.addEventListener('click',()=>tab(i,Boolean(i)));
 el.addEventListener('keydown',e=>{
   if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const j=e.key==='Home'?0:e.key==='End'?1:1-i;tab(j,false);tabs[j].focus();}
 });
});
$('to-try').addEventListener('click',()=>tab(1,true));
$('reset-try').addEventListener('click',()=>{restorePractice();tryHost.focus({preventScroll:true});});
$('return-watch').addEventListener('click',()=>tab(0,true));
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
   return {event:'upper',model:task,error:'The link needs an event, a finite mean, a positive SD and the relevant bound(s). The original Try is shown; you can enter your own values on its handheld.'};
 }
}
const assignment=fromURL();
const eventLabel=(type,model)=>{
 const l=rawBound(model.lower), u=rawBound(model.upper);
 return type==='lower'?'P(X < '+u+')':type==='upper'?'P(X > '+l+')':'P('+l+' < X < '+u+')';
};
function restorePractice(){
 const {model,event,linked,threshold,error}=assignment;
 live=fresh(linked?valuesFor(model,threshold):null);
 $('challenge-title').textContent=event==='range'?'Interval practice':'Tail practice';
 $('challenge-prompt').textContent='Mean '+rawBound(model.mean)+', standard deviation '+rawBound(model.sd)+'. Find '+eventLabel(event,model)+'.';
 $('hint').textContent=(event==='lower'?'Leave the lower bound at −∞. ':event==='upper'?'Leave the upper bound at ∞. ':'Enter both finite bounds in increasing order. ')+'Use the standard deviation, not the variance.';
 $('answer').value='';$('feedback').textContent='';$('feedback').className='feedback';
 $('link-notice').textContent=error??'';$('link-notice').hidden=!error;
 paintTry();
}
$('answer').addEventListener('input',()=>{$('feedback').textContent='';$('feedback').className='feedback';});
$('answer-form').addEventListener('submit',e=>{
 e.preventDefault();
 const raw=$('answer').value.trim().replace(',','.'),v=Number(raw),el=$('feedback'),prob=normalMass(assignment.model),expected=prob.toFixed(4);
 let ok=false;
 if(!raw||!Number.isFinite(v)||v<0||v>1)el.textContent='Enter a probability from 0 to 1.';
 else if(v===Number(expected)&&/^(?:[01])?\.\d{4}$/.test(raw)){ok=true;el.textContent='Correct: '+expected+'. That is the requested area under the normal curve.'}
 else if(v===Number(expected)||Math.abs(v-prob)<5e-6)el.textContent='The area is right. Write the probability to four decimal places.';
 else el.textContent='Not yet. Check the shaded region, each bound, and that you used the standard deviation.';
 el.classList.toggle('is-right',ok);el.classList.toggle('is-wrong',!ok);
});
restorePractice();
if(qpMode==='try')tab(1,false);
else tab(0,false);
})();
