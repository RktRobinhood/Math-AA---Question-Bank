'use strict';
(function(){
function lessonEnd(){return (window.visualViewport?.height||innerHeight)-(document.querySelector("body > .tabbar")?.offsetHeight||0);}
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
 const drawMenu=(id,ix)=>'<ul class="lcd-menu">'+menuItems[id].map(([k,n,to],j)=>'<li'+(j===ix?' class="current"':'')+'>'+k+': '+n+(to&&to!=='wizard'?' ▸':'')+'</li>').join('')+'</ul>';
 if(menuItems[s.page]){
   let menu=s.page==='top'?drawMenu('top',s.selected):s.page==='distributions'?drawMenu(s.branch,4)+drawMenu(s.page,s.selected):drawMenu('top',s.branch==='statistics'?5:4)+drawMenu(s.page,s.selected);
   return '<div class="menu-stack">'+menu+'</div>';
 }
 if(s.page==='wizard')return '<div class="lcd-dialog"><strong>Inverse Normal</strong>'+fields.map((f,i)=>'<div class="lcd-field'+(i===s.field?' active':'')+'"><span>'+f+':</span><span>'+esc(s.values[i])+'&nbsp;</span></div>').join('')+'<div class="lcd-ok"><span class="'+(s.field===okField?'calc-active':'')+'">OK</span> <span class="'+(s.field===cancelField?'calc-active':'')+'">Cancel</span></div></div>';
 return (s.page==='result'?'<p>'+esc(s.previous)+'</p><p class="answers"><strong data-exact="'+esc(s.numeric)+'">'+esc(rawNumber(s.answer))+'</strong></p>':'')+'<div class="entry"><p>'+esc(s.page==='entry'?s.previous:'▏')+'</p></div>';
}
const qp=new URLSearchParams(location.search),request=M.exerciseFrom(qp),target=request.data;
const tryHost=$('try-host'),work=$('try-work'),tryFeedback=$('try-feedback');
let live,practice,track='practice',forkKey=null,light=0,exploring=false;
const forkDrafts=new Map();
function seed(model){
 return {...base(),side:model.side,prefill:[model.side==='left'?rawNumber(model.p):'',rawNumber(model.mean),rawNumber(model.sd)]};
}
practice=seed(target);live=practice;
function keepFork(){
 if(track!=='fork'||forkKey===null)return;
 forkDrafts.delete(forkKey);forkDrafts.set(forkKey,live);
 if(forkDrafts.size>12)forkDrafts.delete(forkDrafts.keys().next().value);
}
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
 if(track==='fork')keepFork();else practice=live;
 if(document.activeElement!==tryHost)tryHost.focus({preventScroll:true});
 clearTimeout(light);tryShell.setKeys([key==='shift-tab'?'tab':key]);light=setTimeout(()=>tryShell.setKeys([]),160);
 paintTry();
}
function visibleTry(){return !$('try').hidden;}
const watchShell=HandheldShell.mount({host:'#watch-host',screen:'#watch-host .screen',interactive:false,label:'Demonstrated TI-Nspire CX II-T'});
const tryShell=HandheldShell.mount({host:tryHost,screen:'#try-host .screen',onKey:interact,label:'Interactive TI-Nspire CX II-T'});
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
const media=window.InverseNormalMedia,rehearsal=media.compose(window.InverseNormalRehearsal);
const manifest=$('ct40-narration-manifest'),recording=manifest?media.decode(manifest.textContent,rehearsal):null;
const timecode=t=>Math.floor(t/60)+':'+String(Math.floor(t)%60).padStart(2,'0');
const seek=$('seek'),play=$('play'),steps=$('steps'),player=play.closest('.player'),watch=$('watch');
let timeline=rehearsal,audio=null,mediaReady=false,now=0,active=-1,curveSignature='',firstPlay=true,running=false,raf=0,reference=0,last=-1,pending=false,generation=0,startTimer=0;
watch.dataset.clock='caption';
const clamp=t=>Math.min(timeline.duration,Math.max(0,Number(t)||0));
function snapshotAt(t){
 const snapshot=base(),marker=timeline.markersMs.tailContext;
 for(const {timeMs,key} of timeline.tape){
   if(timeMs/1000>t)break;
   snapshot.side=timeMs>=marker?'right':'left';step(snapshot,key);
 }
 snapshot.side=t*1000>=marker?'right':'left';
 return snapshot;
}
function render(t){
 const {duration,starts,cues,tape,markersMs,timing}=timeline;
 const finish=t>=timeline.duration-.002,take=$('take-over');take.textContent=finish?'Try it':'Take over';take.setAttribute('aria-label',finish?'Open independent practice':'Take over the calculator');
 seek.value=String(t);seek.setAttribute('aria-valuetext',timecode(t)+' of '+timecode(duration));$('clock').textContent=timecode(t)+' / '+timecode(duration);
 const cue=tape.findLastIndex(e=>e.timeMs/1000<=t),event=tape[cue];
 watchShell.setKeys(event&&t-event.timeMs/1000<(event.key==='tab'?.38:.31)?[event.key]:[]);
 const beat=starts.findLastIndex(u=>u<=t);
 if(last!==cue){$('screen-work').innerHTML=LCD(snapshotAt(t));last=cue;}
 $('stage-play').hidden=!firstPlay||t>0;
 if(active!==beat||$('caption').textContent===''){
   active=beat;$('caption').textContent=cues[beat]?.text??'';
   [...steps.children].forEach((li,i)=>li.firstElementChild.setAttribute('aria-current',String(i===beat)));
 }
 // This marker is deliberately independent of caption cache and both Evaluate events.
 const isTail=t>=markersMs.tailContext/1000,model=isTail?tailDemo:demo;
 const revealed=t>=(isTail?timing['right-evaluate']:timing['left-evaluate']);
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
});
function label(){
 const text=running||pending?'Pause':now>=timeline.duration-.002?'Replay':'Play';
 play.textContent=text;play.setAttribute('aria-label',text);play.dataset.playing=String(running);
}
function configure(next){
 now=media.remap(now,timeline,next);timeline=next;
 seek.max=String(timeline.duration);last=-1;active=-1;curveSignature='';
 $('transcript').textContent=timeline.cues.map(c=>c.text).join(' ');
 render(now);label();
}
function mediaSeek(){
 if(audio&&mediaReady&&Math.abs(audio.currentTime-now)>.0005)audio.currentTime=now;
}
function go(t){
 now=clamp(t);
 if(mediaReady)mediaSeek();else reference=performance.now()-now*1000;
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
 el.src=recording.audio;player.append(el);
}
function start(){
 if(watch.hidden||running||pending)return;
 if(now>=timeline.duration-.002)go(0);
 fitWatch();
 if(document.activeElement===$('stage-play'))play.focus({preventScroll:true});
 firstPlay=false;$('stage-play').hidden=true;
 if(!audio){captionPlay();return;}
 const el=audio,ticket=++generation;
 pending=true;label();mediaSeek();
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
const toggle=()=>running||pending?stop():start();
play.addEventListener('click',toggle);$('stage-play').addEventListener('click',toggle);
seek.addEventListener('input',()=>go(Number(seek.value)));
$('captions').addEventListener('change',()=>{$('caption').hidden=!$('captions').checked});
HandheldTransport.controls({container:document.querySelector('.player-top'),play,seek,active:()=>!watch.hidden,onRestart:()=>{stop();go(0);start();}});
const focusButton=watch.querySelector('.cx-transport-button[aria-label="Focused view"]');
const focusText=document.createElement('span');focusText.className='focus-label';focusText.textContent=' Focus';focusButton?.append(focusText);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&(running||pending))stop();});
const viewer=watch.querySelector('.viewer'),tabs=[$('watch-tab'),$('try-tab')];
let manuallyExited=false,preferFocus=false;
function focused(){return viewer.classList.contains('cx-focused');}
function setFocus(on){if(focusButton&&on!==focused())focusButton.click();}
function size(){
 if(watch.hidden){
   const panel=$('try-host'),top=panel.getBoundingClientRect().top+scrollY;
   panel.style.setProperty('--try-fit',Math.max(157,Math.min(306,Math.floor((lessonEnd()-top-12)*558/1168)))+'px');return;
 }
 const fixed=focused(),h=lessonEnd(),short=fixed&&innerWidth>710&&h<=600;
 const lines=$('caption').offsetHeight+$('audio-state').offsetHeight+viewer.querySelector('.worked-prompt').offsetHeight;
 const used=short?22:lines+player.offsetHeight+22;
 const top=Math.max(0,viewer.getBoundingClientRect().top);
 viewer.style.setProperty('--watch-fit',Math.max(155,Math.min(fixed?345:287,Math.floor((h-top-used)*558/1168)))+'px');
}
function fitWatch(){
 if(watch.hidden)return;
 size();const b=watchShell.body.getBoundingClientRect(),h=(lessonEnd());
 if(!manuallyExited&&!focused()&&(b.width<176||player.getBoundingClientRect().bottom>h+1))setFocus(true);
}
const sizeObserver=new ResizeObserver(size);
[$('caption'),$('audio-state'),viewer.querySelector('.worked-prompt'),player].forEach(el=>sizeObserver.observe(el));
window.addEventListener('resize',fitWatch);window.visualViewport?.addEventListener('resize',fitWatch);
const focusObserver=new MutationObserver(()=>{
 const on=focused()&&!watch.hidden;
 document.body.classList.toggle('ct40-focused',on);
 for(const item of document.querySelectorAll('main > .header, main > .calc-tabs, main > .notes, .director'))item.inert=on;
 if(on)viewer.scrollTop=0;size();
});
focusObserver.observe(viewer,{attributes:true,attributeFilter:['class']});
focusButton?.addEventListener('click',e=>{if(e.isTrusted)manuallyExited=!focused();});
document.addEventListener('keydown',e=>{if(e.target!==document.body&&!e.target.closest?.(".qb-calculator-lesson"))return;if(e.key==='Escape'&&!watch.hidden&&focusButton?.getAttribute('aria-pressed')==='false'&&document.body.classList.contains('ct40-focused')){
 manuallyExited=true;focusButton.focus({preventScroll:true});
}});
function showTrack(){
 const copy=track==='fork';
 $('try').dataset.track=track;
 $('try-origin').textContent=copy?'Editable copy. Your independent practice stays as you left it.':exploring?'Custom distribution. The independent challenge is paused.':'';
 $('try-origin').hidden=!copy&&!exploring;
 $('exercise').hidden=copy||exploring;
 $('custom-controls').hidden=copy;
 $('reset-try').textContent=copy||exploring?'Open independent practice':'Reset practice';
 $('link-warning').hidden=copy||!request.error;
 paintTry();size();
}
function openPractice(){
 keepFork();track='practice';forkKey=null;live=practice;tab(1,true);
}
function tab(i,shouldFocus){
 if(i===0){keepFork();}
 else if(!watch.hidden){stop();preferFocus=focused();setFocus(false);}
 tabs.forEach((el,k)=>{el.tabIndex=k===i?0:-1;el.setAttribute('aria-selected',String(k===i));$(el.getAttribute('aria-controls')).hidden=k!==i;});
 clearTimeout(light);tryShell.setKeys([]);
 if(i===0){
   render(now);label();if(preferFocus&&!manuallyExited)setFocus(true);fitWatch();requestAnimationFrame(fitWatch);
 }else{showTrack();requestAnimationFrame(size);}
 if(shouldFocus)(i?tryHost:play).focus({preventScroll:true});
}
tabs.forEach((el,i)=>{
 el.onclick=()=>{if(i)openPractice();else tab(0,true);};
 el.onkeydown=e=>{
   if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const j=e.key==='Home'?0:e.key==='End'?1:1-i;if(j)openPractice();else tab(0,false);tabs[j].focus();}
 };
});
$('to-try').onclick=openPractice;
$('take-over').onclick=()=>{
 if(running||pending)stop();
 if(now>=timeline.duration-.002){openPractice();return;}
 track='fork';forkKey=now.toFixed(3);
 live=forkDrafts.get(forkKey)||snapshotAt(now);keepFork();tab(1,true);
};
$('reset-try').onclick=()=>{
 if(track==='fork'){openPractice();return;}
 practice=seed(target);live=practice;exploring=false;
 resetForm();$('answer').value='';$('feedback').textContent='';$('model-feedback').textContent='';
 showTrack();tryHost.focus({preventScroll:true});
};
$('return-watch').onclick=()=>tab(0,true);
const ui={mean:$('mean'),sd:$('sd'),area:$('area'),event:$('event')};
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
const eventLine=$('event-line');
function description(d){
 return 'Mean '+show(d.mean)+', standard deviation '+show(d.sd)+'. Find the cutoff with probability '+show(d.p)+' to its '+d.side+'.';
}
function resetForm(){
 ui.mean.value=String(target.mean);ui.sd.value=String(target.sd);ui.area.value=String(target.p);ui.event.value=target.side;update();
}
function update(){
 const side=ui.event.value,p=parse(ui.area.value);
 $('model-feedback').textContent='';
 let message='Use a probability strictly between 0 and 1.';
 try{leftFromGiven(p,side);message=(side==='left'?'Left':'Right')+' area = '+show(p)+(side==='right'?' · Convert to the left area.':'');}
 catch(e){message=e.message;}
 eventLine.textContent=message;
}
if(request.linked){$('challenge-title').textContent='Linked cutoff';$('challenge').textContent=description(target);}
$('link-warning').textContent=request.error;
Object.values(ui).forEach(el=>el.addEventListener(el===ui.event?'change':'input',update));resetForm();
$('model').onsubmit=e=>{
 e.preventDefault();if(track==='fork')return;
 const feedback=$('model-feedback');
 try{
   const data={side:ui.event.value,p:parse(ui.area.value),mean:parse(ui.mean.value),sd:parse(ui.sd.value)};
   cutoff({...data,area:leftFromGiven(data.p,data.side)});
   practice=seed(data);live=practice;exploring=true;showTrack();
   feedback.textContent=data.side==='right'?'Loaded the model. Enter the left area yourself.':'Loaded. Open Inverse Normal on the handheld to calculate.';
   tryHost.focus({preventScroll:true});
 }catch(err){feedback.textContent=err.message;}
};
$('answer-form').onsubmit=e=>{
 e.preventDefault();if(track==='fork'||exploring)return;
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
