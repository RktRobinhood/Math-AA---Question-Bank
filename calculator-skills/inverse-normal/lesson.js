'use strict';
(function(){
const $=id=>document.getElementById(id), {density}=globalThis.NspireNormal, M=globalThis.NspireInverseNormal, {cutoff,quantile,parse,validate,leftFromGiven}=M;
const demo={mean:50,sd:8,area:.75,side:'left'}, tailDemo={mean:50,sd:8,area:.9,side:'right'};
const defaults=['','0','1'], fields=['Area','μ','σ'];
const okField=fields.length,cancelField=okField+1,count=cancelField+1;
const menuItems={
 top:[['1','Actions'],['2','Number'],['3','Algebra'],['4','Calculus'],['5','Probability','probability'],['6','Statistics','statistics'],['7','Matrix & Vector'],['8','Finance'],['9','Functions & Programs']],
 probability:[['1','Factorial'],['2','Permutations'],['3','Combinations'],['4','Random'],['5','Distributions','distributions']],
 statistics:[['1','Stat Calculations'],['2','Stat Results'],['3','List Math'],['4','List Operations'],['5','Distributions','distributions']],
 distributions:[['1','Normal Pdf'],['2','Normal Cdf'],['3','Inverse Normal','wizard'],['4','t Pdf'],['5','t Cdf']]
};
const base=()=>({page:'idle',branch:'probability',selected:0,field:0,values:defaults.slice(),replace:true,previous:'',answer:'',numeric:null,model:null,prefill:null,side:'left',error:''});
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const show=n=>String(Number(n.toPrecision(7))).replace(/-/g,'−');
const fmtAnswer=n=>n===0?'0':String(Number(n.toPrecision(13)));
const rawNumber=n=>String(n).replaceAll('-','−');
function decode(v){
 const [area,mean,sd]=v.map(parse),model={area,mean,sd};validate(model);return model;
}
function step(s,key){
 if(key==='esc'){
   if(s.page==='distributions'){s.page=s.branch;s.selected=4;}
   else if(['probability','statistics'].includes(s.page)){s.page='top';s.selected=s.branch==='probability'?4:5;}
   else if(s.page==='wizard'){s.page=s.answer?'result':'idle';}
   else s.page=s.answer?'result':'idle';
   return;
 }
 if(key==='menu'){s.page='top';s.selected=0;return}
 if(menuItems[s.page]){
   const items=menuItems[s.page], i=items.findIndex(a=>a[0]===key);
   if(key==='down'||key==='up'){s.selected=(s.selected+(key==='down'?1:-1)+items.length)%items.length;return}
   const activate=(['right','enter','select'].includes(key)?items[s.selected]:i>=0?items[i]:null);
   if(!activate)return;
   if(!activate[2])throw Error('This lesson practises Inverse Normal. Use Probability or Statistics → Distributions.');
   s.page=activate[2];s.selected=0;
   if(['probability','statistics'].includes(s.page))s.branch=s.page;
   if(s.page==='wizard'){
     s.values=(s.prefill??defaults).slice();s.field=0;s.replace=true;
   }
   return;
 }
 if(s.page==='entry'&&['enter','select'].includes(key)){
   const model=decode(s.values), n=cutoff(model);
   s.answer=fmtAnswer(n);s.numeric=n;s.page='result';s.model={...model,side:s.side};return;
 }
 if(s.page!=='wizard')return;
 if(key==='tab'||key==='up'||key==='down'||key==='shift-tab'){
   s.field=(s.field+(key==='up'||key==='shift-tab'?count-1:1))%count;
   s.replace=true;return;
 }
 if(key==='enter'||key==='select'){
   if(s.field===cancelField){s.page=s.answer?'result':'idle';return}
   const model=decode(s.values);
   s.previous='invNorm('+[model.area,model.mean,model.sd].map(rawNumber).join(',')+')';
   s.page='entry';s.answer='';return;
 }
 if(s.field>=okField)return;
 const ch=key==='del'?'':key==='ee'?'e':/^[\da-z]$/.test(key)?key:({dot:'.',neg:'−',minus:'−',plus:'+'})[key];
 if(ch===undefined)return;
 const old=s.values[s.field];
 if(key==='del')s.values[s.field]=s.replace?'':old.slice(0,-1);
 else if(s.replace||old.length<28)s.values[s.field]=s.replace?ch:old+ch;
 s.replace=false;
}
function LCD(s){
 const drawMenu=(id,ix)=>'<ul class="lcd-menu">'+menuItems[id].map(([k,n,to],j)=>'<li data-menu-item="'+k+'" data-menu-page="'+id+'"'+(j===ix?' class="current"':'')+'>'+k+': '+n+(to&&to!=='wizard'?' ▸':'')+'</li>').join('')+'</ul>';
 if(menuItems[s.page]){
   let menu=s.page==='top'?drawMenu('top',s.selected):s.page==='distributions'?drawMenu(s.branch,4)+drawMenu(s.page,s.selected):drawMenu('top',s.branch==='statistics'?5:4)+drawMenu(s.page,s.selected);
   return '<div class="menu-stack">'+menu+'</div>';
 }
 if(s.page==='wizard')return '<div class="lcd-dialog"><strong>Inverse Normal</strong>'+fields.map((f,i)=>'<div data-field="'+i+'" class="lcd-field'+(i===s.field?' active':'')+'"><span>'+f+':</span><span>'+esc(s.values[i])+'&nbsp;</span></div>').join('')+'<div class="lcd-ok"><span data-dialog="3" class="'+(s.field===3?'calc-active':'')+'">OK</span> <span data-dialog="4" class="'+(s.field===4?'calc-active':'')+'">Cancel</span></div></div>';
 return (s.page==='result'?'<p>'+esc(s.previous)+'</p><p class="answers"><strong data-exact="'+esc(s.numeric)+'">'+esc(rawNumber(s.answer))+'</strong></p>':'')+'<div class="entry"><p>'+esc(s.page==='entry'?s.previous:'▏')+'</p></div>';
}
const qp=new URLSearchParams(location.search),request=M.exerciseFrom(qp),target=request.data;
const tryHost=$('try-host'),work=$('try-work'),tryFeedback=$('try-feedback');
let light=0;
function seed(model){
 return {...base(),prefill:[model.side==='left'?rawNumber(model.p):'',rawNumber(model.mean),rawNumber(model.sd)]};
}
let live=seed(target);
function paintTry(){
 work.innerHTML=LCD(live);
 tryFeedback.textContent=live.error||'';
 const chart=$('try-curve');
 if(live.page==='result'&&live.model)curve(chart,live.model,true);
 else chart.replaceChildren();
}
function interact(key){
 if(!visibleTry())return;
 live.error='';
 try{step(live,key)}catch(err){live.error=err.message;live.selected=live.selected??0;}
 if(document.activeElement!==tryHost)tryHost.focus({preventScroll:true});
 clearTimeout(light);tryShell.setKeys([key==='shift-tab'?'tab':key]);light=setTimeout(()=>tryShell.setKeys([]),160);
 paintTry();
}
function visibleTry(){return !$('try').hidden;}
const watchShell=HandheldShell.mount({host:'#watch-host',screen:'#watch-host .screen',interactive:false,label:'Demonstrated TI-Nspire CX II-T'});
const tryShell=HandheldShell.mount({host:tryHost,screen:'#try-host .screen',onKey:interact,label:'Interactive TI-Nspire CX II-T'});
work.addEventListener('click',e=>{
 const menu=e.target.closest('[data-menu-item]'), field=e.target.closest('[data-field]'), button=e.target.closest('[data-dialog]');
 if(menu&&menu.dataset.menuPage===live.page)interact(menu.dataset.menuItem);
 else if(field&&live.page==='wizard'){live.field=Number(field.dataset.field);live.replace=true;paintTry();}
 else if(button&&live.page==='wizard'){live.field=Number(button.dataset.dialog);interact('enter');}
 else return;
 tryHost.focus({preventScroll:true});
});
document.addEventListener('keydown',e=>{if(e.target!==document.body&&!e.target.closest?.(".qb-calculator-lesson"))return;
 if(!visibleTry()||e.altKey||e.metaKey||e.ctrlKey||e.repeat||e.isComposing)return;
 const el=e.target;
 if(el.closest?.('input,textarea,select,a,summary,[contenteditable]')||(!tryHost.contains(el)&&el!==document.body))return;
 if(el.closest?.('button')&&['Enter',' ','Tab'].includes(e.key))return;
 if(e.key==='Tab'&&(el!==tryHost||live.page!=='wizard'||(e.shiftKey?live.field===0:live.field===cancelField)))return;
 const aliases={m:'menu',M:'menu','-':'neg','.':'dot',Escape:'esc',Backspace:'del',Delete:'del',Enter:'enter',ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',Tab:e.shiftKey?'shift-tab':'tab'};
 const k=aliases[e.key]??HandheldShell.normalizeKey(e.key);
 if(!tryShell.getKey(k)&&k!=='shift-tab')return;
 e.preventDefault();interact(k);
});
const media=window.InverseNormalMedia,plan=window.CT40WatchPlan;
let rehearsal=plan.make(1);
const manifest=$('ct40-narration-manifest'),recording=manifest?media.decode(manifest.textContent,rehearsal):null;
const timecode=t=>Math.floor(t/60)+':'+String(Math.floor(t)%60).padStart(2,'0');
const seek=$('seek'),play=$('play'),steps=$('steps'),player=play.closest('.player'),watch=$('watch');
let timeline=rehearsal,audio=null,mediaReady=false,now=0,active=-1,curveSignature='',running=false,raf=0,reference=0,last='',pending=false,generation=0,startTimer=0;
const stage=$('watch-stage'),surface=$('watch-surface'),overlay=$('play-feedback'),speed=$('play-rate'),devicePane=$('watch-device-pane');
const transport=CalculatorWatchPlayer.mount({player:stage,surface,play,seek,expand:$('fullscreen'),feedback:overlay,active:()=>!watch.hidden});
const frameKey='qb-calculator-watch-frame';
const trail=$('key-steps'),chips=[],compact=[];
let activeGroup="",shownTrail=-2;
const keyName=k=>({menu:'Menu',tab:'Tab',enter:'Enter',dot:'.'})[k]??k;

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
watch.dataset.clock='caption';
const clamp=t=>Math.min(timeline.duration,Math.max(0,Number(t)||0));
function snapshotAt(t){
 const snapshot=base(),marker=timeline.markersMs.tailContext;
 for(const {timeMs,key} of timeline.tape){
   if(timeMs/1000>t)break;
   if(t*1000>=marker&&timeMs<marker)continue;
   snapshot.side=timeMs>=marker?'right':'left';step(snapshot,key);
 }
 snapshot.side=t*1000>=marker?'right':'left';
 return snapshot;
}
function captionAt(cue,showResult){
 const text=cue?.text??'';
 if(showResult||!['40.04','40.07'].includes(cue?.id))return text;
 // Before the second Enter show only the original instruction sentences,
 // not the answer already present in the full cue/transcript.
 const instruction=cue.id==='40.04'?'Confirm. Press Enter again to calculate.':'Confirm, then press Enter again.';
 return text.startsWith(instruction)?text.slice(0,instruction.length):'';
}
function render(t){
 const {duration,starts,cues,tape,markersMs,timing}=timeline;
 seek.value=String(t);seek.setAttribute('aria-valuetext',timecode(t)+' of '+timecode(duration));$('clock').textContent=timecode(t)+' / '+timecode(duration);
 const cue=tape.findLastIndex(e=>e.timeMs/1000<=t),event=tape[cue];
 const tail=t*1000>=markersMs.tailContext, current=event&&(!tail||event.timeMs>=markersMs.tailContext)?event:null;
 watchShell.setKeys(current&&t-current.timeMs/1000<(current.key==='tab'?.38:.31)?[current.key]:[]);
 const beat=starts.findLastIndex(u=>u<=t);
 const tailMenu=beat===5&&t<timing['right-inverse-normal']+.38;
 const group=String(beat)+(beat===5?(tailMenu?'a':'b'):'');
 if(activeGroup!==group||shownTrail!==cue){
   shownTrail=cue;activeGroup=group;
   for(const [i,v] of chips.entries()){
    const progress=i===cue?'current':i<cue?'done':'next';v.dataset.progress=progress;
    if(progress==='current')v.setAttribute('aria-current','step');else v.removeAttribute('aria-current');
    compact[i].firstElementChild.dataset.progress=progress;compact[i].hidden=compact[i].dataset.chapter!==group;
   }
   $('key-label').textContent=beat<0?'Keys':'Keys '+String(beat+1).padStart(2,'0')+(beat===5?(tailMenu?'a':'b'):'');
   trail.classList.toggle('no-keys',!compact.some(x=>!x.hidden));const activeCell=compact[shownTrail];
  if(activeCell&&!activeCell.hidden)trail.scrollLeft=Math.max(0,activeCell.offsetLeft+activeCell.offsetWidth-trail.clientWidth);
  else trail.scrollLeft=0;
 }
 stage.dataset.phase=timeline.layout?(timeline.layout.at(t).speaking?'read':'hold'):'voice';
 $('pace-tip').textContent=timeline.tips?.[beat]??'';
 $('pace-tip').hidden=!timeline.tips;

 const keyState=String(tail)+':'+cue;
 if(last!==keyState){$('screen-work').innerHTML=LCD(snapshotAt(t));last=keyState;}
 // The question switches independently of the cue and keyboard caches.
 const isTail=tail,model=isTail?tailDemo:demo;
 const revealed=t>=(isTail?timing['right-evaluate']:timing['left-evaluate']);
 let words=captionAt(cues[beat],revealed);
 if(timeline.layout&&!timeline.layout.at(t).speaking){
  const evaluate=isTail?timing['right-evaluate']:timing['left-evaluate'];
  if((beat!==3&&beat!==6)||!revealed||t<evaluate+.35)words='';
  else words=words.replace(/^(?:Confirm\. Press Enter again to calculate\.|Confirm, then press Enter again\.)\s*/, '');
 }
 if($('caption').textContent!==words)$('caption').textContent=words;
 const captionState=beat+':'+revealed;
 if(active!==captionState){
   active=captionState;
   [...steps.children].forEach((li,i)=>li.firstElementChild.setAttribute('aria-current',String(i===beat)));
 }
 const cs=String(isTail)+':'+String(revealed);
 if(curveSignature!==cs){
   curveSignature=cs;
   $('worked-event').textContent=isTail?'P(X > c) = 0.10 → left area 0.90':'P(X < c) = 0.75';
   curve($('compact-curve'),model,revealed);curve($('watch-curve'),model,revealed);
 }
}
rehearsal.cues.forEach(({title},i)=>{
 const li=document.createElement('li'), b=document.createElement('button'), num=document.createElement('span');
 b.type='button';num.textContent=String(i+1).padStart(2,'0');b.append(num,document.createTextNode(title));
 b.addEventListener('click',()=>go(timeline.starts[i]));li.append(b);steps.append(li);
 const baseGroup=document.createElement('div');baseGroup.className='step-chips';baseGroup.setAttribute('aria-label',i===5?'Open Inverse Normal again':title+' keys');baseGroup.setAttribute('role','list');
 const fieldsGroup=baseGroup.cloneNode(false);fieldsGroup.setAttribute('aria-label','Enter 0.90, 50 and 8');
 let inside=0;
 rehearsal.tape.forEach(({phase,key},j)=>{
  if(phase!==i)return;
  const isMenu=inside++<4, group=i===5&&!isMenu?fieldsGroup:baseGroup;
  const chip=document.createElement('kbd');chip.textContent=keyName(key);chip.setAttribute('role','listitem');group.append(chip);chips[j]=chip;
  const cell=document.createElement('li');cell.dataset.chapter=i+(i===5?(isMenu?'a':'b'):'');const clone=chip.cloneNode(true);clone.removeAttribute('role');cell.append(clone);compact[j]=cell;
 });
 if(baseGroup.children.length)li.append(baseGroup);
 if(fieldsGroup.children.length)li.append(fieldsGroup);
});
trail.replaceChildren(...compact);
function label(){
 const text=running||pending?'Pause':now>=timeline.duration-.002?'Replay':'Play';
 play.title=text;play.setAttribute('aria-label',text);play.dataset.playing=String(running);
 play.querySelector('.play-icon').toggleAttribute('hidden',running||pending);
 play.querySelector('.pause-icon').toggleAttribute('hidden',!running&&!pending);
 if(!running&&!pending&&now<=.005){
   overlay.dataset.action='play';overlay.dataset.initial='true';overlay.hidden=false;
 }
}
function configure(next){
 now=timeline.layout&&next.layout?next.layout.remap(timeline.layout,now):media.remap(now,timeline,next);timeline=next;
 seek.max=String(timeline.duration);last='';active=-1;curveSignature='';activeGroup='';shownTrail=-2;
 speed.disabled=!timeline.layout;speed.title=speed.disabled?'The approved narration plays at normal speed.':'';
 $('transcript').textContent=timeline.cues.map(c=>c.text).join(' ');
 render(now);label();
}
function mediaSeek(){
 if(audio&&mediaReady&&Math.abs(audio.currentTime-now)>.0005)audio.currentTime=now;
}
function go(t){
 now=clamp(t);
 if(mediaReady)mediaSeek();else reference=performance.now()-now*1000;
 if(!running&&now>.005&&overlay.dataset.initial==='true'){overlay.dataset.initial='false';transport.clear();}
 render(now);label();fitWatch();
}
function readTime(at=performance.now()){
 if(!running)return now;
 return clamp(mediaReady&&audio?audio.currentTime:(at-reference)/1000);
}
function stop(capture=true){
 if(capture)now=readTime();
 generation++;pending=false;running=false;
 clearTimeout(startTimer);cancelAnimationFrame(raf);audio?.pause();
 render(now);label();
}
function end(){
 now=timeline.duration;stop(false);
}
function tick(ts){
 if(!running||watch.hidden)return;
 now=readTime(ts);
 if(mediaReady&&audio){
   if(audio.ended){if(now<timeline.duration-.12)fallback('Narration ended before its measured cues.');else end();return;}
 }else if(now>=timeline.duration){end();return;}
 render(now);raf=requestAnimationFrame(tick);
}
function captionPlay(){
 reference=performance.now()-now*1000;running=true;pending=false;label();raf=requestAnimationFrame(tick);
}
function status(message=''){
 $('audio-state').textContent=message;$('audio-state').hidden=!message;
}
function fallback(reason){
 const continuePlayback=!watch.hidden&&(running||pending);
 stop();
 const failed=audio;audio=null;mediaReady=false;
 if(failed){failed.remove();failed.removeAttribute('src');failed.load();}
 configure(rehearsal);watch.dataset.clock='caption';$('caption-beta').hidden=false;
 status(reason+' Using captions instead.');
 if(continuePlayback&&now<timeline.duration-.002)captionPlay();
}
function adopt(){
 if(!audio||audio.readyState<2)return false;
 const verified=media.decodedTimeline(recording,audio.duration);
 if(!verified){fallback('Narration does not match its measured cues.');return false;}
 if(!mediaReady){
   mediaReady=true;configure(verified);mediaSeek();watch.dataset.clock='audio';$('caption-beta').hidden=true;status();
 }else if(Math.abs(timeline.duration-verified.duration)>.001){
   now=readTime();configure(verified);mediaSeek();
 }
 return true;
}
function setupAudio(){
 if(!manifest)return;
 if(!recording){status('Invalid local narration cues. Using captions.');return;}
 const el=document.createElement('audio');el.id='narration';el.hidden=true;el.preload='auto';
 audio=el;
 el.addEventListener('loadedmetadata',()=>{
   if(audio===el&&!media.decodedTimeline(recording,el.duration))fallback('Narration does not match its measured cues.');
 });
 el.addEventListener('loadeddata',()=>{if(audio===el)adopt();});
 el.addEventListener('durationchange',()=>{if(audio===el&&el.readyState>=2)adopt();});
 el.addEventListener('ended',()=>{if(audio===el&&running){now=readTime();if(now<timeline.duration-.12)fallback('Narration ended before its measured cues.');else end();}});
 el.addEventListener('error',()=>{if(audio===el)fallback('Narration could not load or decode.');});
 el.playbackRate=1;el.src=recording.audio;player.append(el);
}
function start(){
 if(watch.hidden||running||pending)return;
 if(now>=timeline.duration-.002)go(0);
 fitWatch();
 if(!audio){captionPlay();return;}
 const el=audio,ticket=++generation;
 pending=true;el.playbackRate=1;label();mediaSeek();
 startTimer=setTimeout(()=>{if(ticket===generation&&pending)fallback('Narration did not start.');},8000);
 const fail=()=>{if(ticket===generation&&audio===el)fallback('Narration could not play.');};
 try{
   Promise.resolve(el.play()).then(()=>{
    if(ticket!==generation||watch.hidden||audio!==el)return;
    if(!adopt()||ticket!==generation||audio!==el)return;
    clearTimeout(startTimer);pending=false;running=true;
    now=readTime();render(now);label();raf=requestAnimationFrame(tick);
   },fail);
 }catch{fail();}
}
play.addEventListener('click',()=>{
 const stopping=running||pending;
 overlay.dataset.initial='false';transport.clear();
 if(stopping)stop();else start();
 transport.flash(!stopping);
});
seek.addEventListener('input',()=>go(Number(seek.value)));
speed.addEventListener('change',()=>{
 if(mediaReady)return;
 const resume=running;
 if(resume)stop();
 rehearsal=plan.make(Number(speed.value));configure(rehearsal);
 reference=performance.now()-now*1000;fitWatch();
 if(resume)captionPlay();
});
$('cc').addEventListener('click',()=>{
 const hide=!$('caption-band').hidden;
 $('caption-band').hidden=hide;
 $('cc').setAttribute('aria-pressed',String(!hide));
 $('cc').setAttribute('aria-label',hide?'Show captions':'Hide captions');
 fitWatch();
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&(running||pending))stop();});
function fitWatch(){
 if($('watch').hidden)return;
 const expanded=stage.matches(':fullscreen,.watch-fullscreen-fallback');
 const max=(window.visualViewport?.height||innerHeight)-surface.getBoundingClientRect().top-(expanded?0:window.scrollY);
 const footer=$('watch-player').offsetHeight+$('caption-band').offsetHeight+(expanded?0:(document.querySelector('.tabbar')?.offsetHeight||0));
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
[$('caption-band'),$('pace-tip'),$('watch-player'),surface.querySelector('.worked-prompt'),document.querySelector('main>.header')].forEach(el=>resize.observe(el));
window.addEventListener('resize',fitWatch);
document.addEventListener('fullscreenchange',fitWatch);
frame(framing);
const tabs=[$('watch-tab'),$('try-tab')];
function tab(i,target){
 if(i){if(running||pending)stop();void transport.exit();}
 tabs.forEach((el,k)=>{el.tabIndex=k===i?0:-1;el.setAttribute('aria-selected',String(i===k));$(el.getAttribute('aria-controls')).hidden=i!==k;});
 clearTimeout(light);tryShell.setKeys([]);
 if(i)paintTry();else{window.scrollTo({top:0,left:0,behavior:'instant'});fitWatch();}
 if(target)(i?tryHost:play).focus({preventScroll:true});
}
tabs.forEach((el,i)=>{
 el.onclick=()=>tab(i,true);
 el.onkeydown=e=>{
   if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const j=e.key==='Home'?0:e.key==='End'?1:1-i;tab(j,false);tabs[j].focus();}
 };
});
$('to-try').onclick=()=>tab(1,true);
$('return-watch').onclick=()=>tab(0,true);
$('reset-try').onclick=()=>{
 live=seed(target);$('answer').value='';$('feedback').textContent='';$('feedback').classList.remove('correct');
 paintTry();tryHost.focus({preventScroll:true});
};
function curve(el,{mean,sd,area,side='left'},reveal){
 const L=18,R=314,B=78;
 const x=z=>L+(z+4.4)*(R-L)/8.8,y=z=>B-150*density(z);
 const path=(a,b)=>{
   const out=[];for(let i=0;i<=72;i++){const z=a+(b-a)*i/72;out.push((i?'L':'M')+x(z).toFixed(2)+','+y(z).toFixed(2));}return out.join(' ');
 };
 const value=cutoff({mean,sd,area}), z=quantile(area), clamped=Math.max(-4.35,Math.min(4.35,z));
 const [a,b]=side==='right'?[clamped,4.35]:[-4.35,clamped], label=reveal?show(value):'c';
 const areaPath=(a,b,cls)=>a<b?'<path class="'+cls+'" d="'+path(a,b)+' L'+x(b).toFixed(2)+','+B+' H'+x(a).toFixed(2)+' Z"/>':'';
 const fill=(side==='right'?areaPath(-4.35,clamped,'complement'):'')+areaPath(a,b,'shade');
 const cut=Math.abs(z)<4.3, marker=x(clamped).toFixed(2);
 el.innerHTML='<svg viewBox="0 0 332 116" role="img" aria-label="Normal curve; '+esc(side)+' side of cutoff shaded'+(reveal?', cutoff '+esc(show(value)):'')+'" xmlns="http://www.w3.org/2000/svg"><path class="axis" d="M12,'+B+' H320"/>'+fill+'<path class="bell" d="'+path(-4.35,4.35)+'"/><path class="axis" d="M'+x(0)+','+(B-2)+' v4"/><text x="'+x(0)+'" y="96" text-anchor="middle">'+esc(show(mean))+'</text>'+(cut?'<path class="cut" d="M'+marker+','+B+' V'+y(z).toFixed(2)+'"/><text x="'+marker+'" y="'+(Math.abs(z)<.37?111:96)+'" text-anchor="middle">'+esc(label)+'</text>':'')+'</svg>';
}
if(request.linked){
 $('challenge-title').textContent='Linked cutoff';
 $('challenge').textContent='Mean '+show(target.mean)+', standard deviation '+show(target.sd)+'. Find the cutoff with probability '+show(target.p)+' to its '+target.side+'.';
}
$('link-warning').textContent=request.error;$('link-warning').hidden=!request.error;
$('answer-form').onsubmit=e=>{
 e.preventDefault();
 const raw=$('answer').value.trim().replace(',','.'),v=parse(raw),el=$('feedback');
 try{
   const answer=cutoff({...target,area:leftFromGiven(target.p,target.side)}),expected=Number(answer.toFixed(2)),lcd=Number(Number(fmtAnswer(answer)).toFixed(2));
   const rounded=(v===expected||v===lcd),fixed=/^[+−-]?\d+\.\d{2}$/.test(raw);
   if(!Number.isFinite(v))el.textContent='Enter a numerical cutoff.';
   else if(rounded&&fixed)el.textContent='Correct. This cutoff leaves the requested area on the '+target.side+'.';
   else if(rounded)el.textContent='The value is right. Give it to two decimal places.';
   else el.textContent='Not yet. Inverse Normal needs area to the left. Check your tail and standard deviation.';
   el.classList.toggle('correct',rounded&&fixed);
 }catch(err){el.textContent=err.message;el.classList.remove('correct');}
};
configure(rehearsal);
if(qp.get('mode')==='try')tab(1,false);else{fitWatch();requestAnimationFrame(fitWatch);}
setupAudio();
})();
