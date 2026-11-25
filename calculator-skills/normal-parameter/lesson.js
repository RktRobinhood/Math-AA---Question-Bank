'use strict';
(function(){
function lessonEnd(){return (window.visualViewport?.height||innerHeight)-(document.querySelector("body > .tabbar")?.offsetHeight||0);}
const $=id=>document.getElementById(id), {density}=globalThis.NspireNormal, {cutoff}=globalThis.NspireInverseNormal;
const demos=[{target:'mean',x:20,known:5,p:.1,side:'left'},{target:'sd',x:63,known:52,p:.9,side:'left'}],task={target:'mean',x:37,known:4,p:.75,side:'right'};
const [demo,tailDemo]=demos.map(({p})=>({mean:0,sd:1,area:p,side:'left'}));
const defaults=['','0','1'], fields=['Area','μ','σ'];
const okField=fields.length,cancelField=okField+1,count=cancelField+1;
const menuItems={
 top:[['1','Actions'],['2','Number'],['3','Algebra'],['4','Calculus'],['5','Probability','probability'],['6','Statistics','statistics']],
 probability:[['1','Factorial'],['2','Permutations'],['3','Combinations'],['4','Random'],['5','Distributions','distributions']],
 statistics:[['1','Stat Calculations'],['2','Stat Results'],['3','List Math'],['4','List Operations'],['5','Distributions','distributions']],
 distributions:[['1','Normal Pdf'],['2','Normal Cdf'],['3','Inverse Normal','wizard'],['4','t Pdf'],['5','t Cdf']]
};
const base=()=>({page:'idle',branch:'probability',selected:0,field:0,values:defaults.slice(),replace:true,previous:'',answer:'',history:null,ans:null,expr:[],ctrl:false});
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const show=n=>String(Number(n.toPrecision(7))).replace(/-/g,'−');
const fmtAnswer=n=>n===0?'0':String(Number(n.toPrecision(6))).replace(/-/g,'−');
const rawNumber=n=>String(n).replaceAll('-','−');
const parse=val=>{
 const n=val.trim().replaceAll('−','-');
 if(!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(n))return NaN;
 const a=Number(n);return Number.isFinite(a)?a:NaN;
};
function decode(v){
 const [area,mean,sd]=v.map(parse);
 if(!(area>0&&area<1))throw Error('Area must be strictly between 0 and 1.');
 if(!Number.isFinite(mean)||!Number.isFinite(sd)||sd<=0)throw Error('Use a finite mean and a standard deviation greater than zero.');
 return {mean,sd,area};
}
function step(s,key){
 if(key==='esc'){
   s.expr=[];s.ctrl=false;
   if(s.page==='distributions'){s.page=s.branch;s.selected=4;}
   else if(['probability','statistics'].includes(s.page)){s.page='top';s.selected=s.branch==='probability'?4:5;}
   else if(s.page==='wizard'){s.page='idle';}
   else s.page=s.answer?'result':'idle';
   return;
 }
 if(key==='menu'){s.page='top';s.selected=0;s.expr=[];s.ctrl=false;return}
 if(menuItems[s.page]){
   const items=menuItems[s.page], i=items.findIndex(a=>a[0]===key);
   if(key==='down'||key==='up'){s.selected=(s.selected+(key==='down'?1:-1)+items.length)%items.length;return}
   const activate=(['right','enter','select'].includes(key)?items[s.selected]:i>=0?items[i]:null);
   if(!activate)return;
   if(!activate[2])throw Error('This lesson practises Inverse Normal. Use Probability or Statistics → Distributions.');
   s.page=activate[2];s.selected=0;
   if(['probability','statistics'].includes(s.page))s.branch=s.page;
   if(s.page==='wizard'){
     s.values=(s.prefill??defaults).slice();s.prefill=null;s.field=0;s.replace=true;
   }
   return;
 }
 if(s.page==='entry'&&key==='enter'){
   const model=decode(s.values), n=cutoff(model);
   s.answer=fmtAnswer(n);s.page='result';s.model=model;s.ans=n;
   s.history={command:s.previous,answer:s.answer};s.expr=[];s.ctrl=false;return;
 }
 if(['idle','result','arith'].includes(s.page)){
   if(key==='ctrl'){s.ctrl=!s.ctrl;return}
   let token=s.ctrl&&key==='neg'?'Ans':/^[0-9]$/.test(key)?key:({dot:'.',neg:'−',minus:'−',plus:'+',mul:'×',div:'÷',lparen:'(',rparen:')'})[key];
   s.ctrl=false;
   if(key==='del'&&s.page==='arith'){s.expr.pop();return}
   if(key==='enter'&&s.page==='arith'){
     const input=s.expr.join('');
     if(input.includes('Ans')&&s.ans===null)throw Error('Find a z-score first: Ans is not available.');
     const n=TIFreeCalc.evaluate(input,{ans:s.ans});
     s.previous=input;s.answer=fmtAnswer(n);s.ans=n;s.page='result';s.expr=[];
     return;
   }
   if(token&&s.expr.length<35){s.expr.push(token);s.page='arith'}
   return;
 }

 if(s.page!=='wizard')return;
 if(key==='tab'||key==='up'||key==='down'||key==='shift-tab'){
   s.field=(s.field+(key==='up'||key==='shift-tab'?count-1:1))%count;
   s.replace=true;return;
 }
 if(key==='enter'||key==='select'){
   if(s.field===cancelField){s.page='idle';return}
   const model=decode(s.values);
   s.previous='invNorm('+[model.area,model.mean,model.sd].map(rawNumber).join(',')+')';
   s.page='entry';s.answer='';return;
 }
 if(s.field>=okField)return;
 const ch=key==='del'?'':key==='ee'?'e':/^[\da-z]$/.test(key)?key:({dot:'.',neg:'−',minus:'−',plus:'+'})[key];
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
 if(s.page==='wizard')return '<div class="lcd-dialog"><strong>Inverse Normal</strong>'+fields.map((f,i)=>'<div class="lcd-field'+(i===s.field?' active':'')+'"><span>'+f+':</span><span>'+esc(s.values[i])+'&nbsp;</span></div>').join('')+'<div class="lcd-ok"><span class="'+(s.field===okField?'calc-active':'')+'">OK</span> <span class="'+(s.field===cancelField?'calc-active':'')+'">Cancel</span></div></div>';
 const line=(command,answer)=>'<p>'+esc(command)+'</p><p class="answers"><strong>'+esc(answer)+'</strong></p>';
 const history=s.history?line(s.history.command,s.history.answer):'';
 const latest=s.page==='result'&&s.previous!==s.history?.command?line(s.previous,s.answer):'';
 const entry=s.page==='entry'?s.previous:s.page==='arith'?s.expr.join('')||'▏':'▏';
 return '<div class="history">'+history+latest+'</div><div class="entry"><p>'+esc(entry)+'</p></div>';
}
const qp=new URL(location.href).searchParams;
let live=base(),assigned=null,forkKey=null,assessed=task;
const forks=new Map(),tryHost=$('try-host'),work=$('try-work'),tryFeedback=$('try-feedback');
function paintTry(){
 work.innerHTML=LCD(live);
 const graph=$('try-curve');
 if(live.model)curve(graph,{...live.model,side:live.side??'left'},true);
 else graph.replaceChildren();
}
function interact(key){
 try{
   step(live,key);tryFeedback.textContent='';
 }catch(err){tryFeedback.textContent=err.message;live.selected=live.selected??0}
 paintTry();
}
const watchShell=HandheldShell.mount({host:'#watch-host',screen:'#watch-host .screen',interactive:false,label:'Demonstrated TI-Nspire CX II-T'});
const tryShell=HandheldShell.mount({host:tryHost,screen:'#try-host .screen',onKey:(key,e)=>{if(e?.detail)tryHost.focus({preventScroll:true});interact(key);},label:'Interactive TI-Nspire CX II-T'});
tryHost.addEventListener('keydown',e=>{
 if(e.ctrlKey&&e.key==='-'&&!e.altKey&&!e.metaKey&&!e.repeat&&['idle','result','arith'].includes(live.page)){e.preventDefault();if(!live.ctrl)interact('ctrl');tryShell.getKey('neg').click();return;}
 if(e.altKey||e.metaKey||e.ctrlKey||e.repeat)return;
 if(e.key==='Tab'&&(e.target!==tryHost||live.page!=='wizard'||(e.shiftKey?live.field===0:live.field===cancelField)))return;
 if(e.target!==tryHost&&['Enter',' '].includes(e.key))return;
 const k=e.key==='m'&&live.page!=='wizard'?'menu':e.key==='Tab'?e.shiftKey?'shift-tab':'tab':e.key;
 const norm=HandheldShell.normalizeKey(k);
 if(!tryShell.getKey(norm)&&norm!=='shift-tab')return;
 e.preventDefault();
 if(norm==='shift-tab')interact(norm);
 else tryShell.getKey(norm)?.click();
});
const rehearsal=window.NormalNarration,media=window.NormalParameterMedia;
const manifest=$('ct41-measured-recording');
const recorded=manifest&&media.decode(manifest.textContent,rehearsal);
const seek=$('seek'),play=$('play'),steps=$('steps'),audio=$('narration'),status=$('audio-state');
let timeline=rehearsal,mediaState=recorded?'loading':'none';
let now=0,active=-1,curveSignature='',firstPlay=true,running=false,raf=0,reference=0,last=-1,pending=false,generation=0,loadingIntent=false,metadataTimer=0,cancelPlayWait=null;
const MEDIA_TIMEOUT_MS=3800;
const clipClock=()=>mediaState==='ready';
function snapshotAt(t){
 const snapshot=base();
 for(const event of timeline.tape){if(event.t>t)break;step(snapshot,event.key);}
 return snapshot;
}
const timecode=t=>Math.floor(t/60)+':'+String(Math.floor(t)%60).padStart(2,'0');
const capAt=t=>Number.isFinite(t)?Math.min(timeline.duration,Math.max(0,t)):0;
function render(t){
 const {captions,tape,duration,anchors}=timeline;
 const atBoundary=t<=0||t>=duration-1e-6;
 const cta=$('take-over');cta.textContent=atBoundary?'Try a new problem':'Take over';cta.dataset.action=atBoundary?'try':'fork';cta.setAttribute('aria-label',atBoundary?'Try a new problem':'Take over the calculator');
 $('stage-play').hidden=t>0||!firstPlay;
 seek.value=String(t);seek.setAttribute('aria-valuetext',timecode(t)+' of '+timecode(duration));$('clock').textContent=timecode(t)+' / '+timecode(duration);
 const cue=tape.findLastIndex(e=>e.t<=t),event=tape[cue];
 const visible=event&&t<anchors.rightTailExplanation&&(t<anchors.problemB||event.phase>=5);
 watchShell.setKeys(visible&&t-event.t<(event.key==='tab'?.38:.31)?[event.key]:[]);
 const beat=captions.findLastIndex(c=>c.t<=t);
 if(last!==cue){
   $('screen-work').innerHTML=LCD(snapshotAt(t));last=cue;
 }
 if(active!==beat||$('caption').textContent===''){
   active=beat;$('caption').textContent=captions[beat]?.text??'';
   [...steps.children].forEach((li,i)=>li.firstElementChild.setAttribute('aria-current',String(i===beat)));
 }
 const isTail=t>=anchors.problemB,model=isTail?tailDemo:demo;
 const revealed=t>=(isTail?anchors.sdZRevealed:anchors.meanZRevealed),cs=String(isTail)+':'+String(revealed);
 if(curveSignature!==cs){
   curveSignature=cs;
   $('worked-event').textContent=isTail?'P(X < 63) = 0.90 · μ = 52 · find σ':'P(X < 20) = 0.10 · σ = 5 · find μ';
   curve($('compact-curve'),model,revealed);curve($('watch-curve'),model,revealed);
 }
}
function installTimeline(next){
 now=media.remap(now,timeline,next);timeline=next;last=active=-1;curveSignature='';
 steps.replaceChildren();
 timeline.captions.forEach(({title,t},i)=>{
  const li=document.createElement('li'),b=document.createElement('button'),num=document.createElement('span');
  b.type='button';num.textContent=String(i+1).padStart(2,'0');b.append(num,document.createTextNode(title));
  b.addEventListener('click',()=>go(t));li.append(b);steps.append(li);
 });
 $('transcript').textContent=timeline.captions.map(c=>c.text).join(' ');
 seek.max=String(timeline.duration);render(now);labelPlay();
}
function labelPlay(){
 const name=running||pending||loadingIntent?'Pause':now>=timeline.duration-1e-6?'Replay':'Play';
 play.dataset.playing=String(running);play.textContent=name;play.setAttribute('aria-label',name);
}
function message(text=''){
 status.textContent=text;status.hidden=!text;
}
function go(t){
 now=capAt(t);reference=performance.now()-now*1000;
 if(clipClock()){audio.currentTime=now;now=capAt(audio.currentTime);}
 render(now);labelPlay();
}
function freeze(sample=true){
 if(sample&&running)now=capAt(clipClock()?audio.currentTime:(performance.now()-reference)/1000);
 else if(sample&&pending&&clipClock())now=capAt(audio.currentTime);
 generation++;pending=false;running=false;loadingIntent=false;
 if(cancelPlayWait){cancelPlayWait();cancelPlayWait=null;}
 if(recorded)audio.pause();
 cancelAnimationFrame(raf);render(now);labelPlay();
}
function tick(ts){
 if(!running)return;
 now=capAt(clipClock()?audio.currentTime:(ts-reference)/1000);
 if(!clipClock()&&now>=timeline.duration){freeze(false);return;}
 render(now);raf=requestAnimationFrame(tick);
}
function fallback(text){
 if(mediaState==='failed')return;
 const resume=(running||pending||loadingIntent)&&!$('watch').hidden;
 freeze();mediaState='failed';clearTimeout(metadataTimer);
 audio.removeAttribute('src');audio.preload='none';audio.load();
 $('caption-beta').hidden=false;installTimeline(rehearsal);message(text);
 if(resume)void start();
}
async function start(){
 if(running||pending||loadingIntent||$('watch').hidden)return;
 if(mediaState==='loading'){loadingIntent=true;labelPlay();message('Checking the local recording…');return;}
 if(now>=timeline.duration-1e-6)go(0);
 const ticket=++generation;
 if(clipClock()){
   pending=true;labelPlay();
   try{
     audio.currentTime=now;
     await new Promise((resolve,reject)=>{
       const timer=setTimeout(()=>reject(Error('Decode did not start')),MEDIA_TIMEOUT_MS);
       cancelPlayWait=()=>{clearTimeout(timer);reject(Error('Playback cancelled'));};
       try{Promise.resolve(audio.play()).then(()=>{
         if(ticket!==generation&&(!clipClock()||!running&&!pending))audio.pause();
         resolve();
       },reject);}catch(error){reject(error);}
     });
     if(ticket!==generation){if(!running&&!pending)audio.pause();return;}
     now=capAt(audio.currentTime);
   }catch{
     if(ticket!==generation)return;
     fallback('The recording did not start. Captions only.');return;
   }
 }
 if(cancelPlayWait){cancelPlayWait();cancelPlayWait=null;}
 pending=false;
 if(mediaState!=='failed')message();
 if(firstPlay){
   firstPlay=false;
   fitWatch();
 }
 if(!$('stage-play').hidden){if(document.activeElement===$('stage-play'))play.focus({preventScroll:true});$('stage-play').hidden=true;}
 reference=performance.now()-now*1000;running=true;labelPlay();
 raf=requestAnimationFrame(tick);
}
function toggle(){if(running||pending||loadingIntent)freeze();else void start();}
audio.addEventListener('loadedmetadata',()=>{
 if(mediaState!=='loading')return;
 clearTimeout(metadataTimer);
 const decoded=media.decodedTimeline(recorded,audio.duration);
 if(!decoded){fallback('The recording length does not match its measured cues. Captions only.');return;}
 mediaState='ready';installTimeline(decoded);audio.currentTime=now;
 const resume=loadingIntent;loadingIntent=false;
 $('caption-beta').hidden=true;message();labelPlay();
 if(resume&&!$('watch').hidden)void start();
});
audio.addEventListener('error',()=>{
 if(mediaState==='loading'||mediaState==='ready')fallback('The local recording could not be decoded. Captions only.');
});
audio.addEventListener('ended',()=>{
 if(!clipClock()||!running)return;
 now=capAt(audio.currentTime);freeze(false);
});
for(const name of ['seeking','seeked'])audio.addEventListener(name,()=>{
 if(!clipClock())return;
 now=capAt(audio.currentTime);render(now);labelPlay();
});
play.addEventListener('click',toggle);
$('stage-play').addEventListener('click',toggle);
seek.addEventListener('input',()=>go(Number(seek.value)));
$('captions').addEventListener('change',()=>{$('caption').hidden=!$('captions').checked});
HandheldTransport.controls({container:document.querySelector('.player-top'),play,seek,active:()=>!$('watch').hidden,onRestart:()=>{
 freeze();go(0);void start();
}});
const focusButton=$('watch').querySelector('.cx-transport-button[aria-label="Focused view"]');
const focusText=document.createElement('span');focusText.className='focus-label';focusText.textContent=' Focus';focusButton?.append(focusText);
installTimeline(rehearsal);paintTry();
if(recorded){
 metadataTimer=setTimeout(()=>{if(mediaState==='loading')fallback('The recording metadata did not load. Captions only.');},MEDIA_TIMEOUT_MS);
 audio.preload='metadata';audio.src=recorded.audio;
}
else if(manifest)message('The measured cue sheet is invalid. Captions only.');
document.addEventListener('keydown',e=>{if(e.target!==document.body&&!e.target.closest?.(".qb-calculator-lesson"))return;
 if(!$('try').hidden&&e.target===document.body&&!e.altKey&&!e.ctrlKey&&!e.metaKey&&!e.repeat&&e.key.toLowerCase()==='m'){
   e.preventDefault();tryHost.focus({preventScroll:true});tryShell.getKey('menu').click();
 }
});
const tabs=[$('watch-tab'),$('try-tab')];
const focusStage=$('watch').querySelector('.viewer');
let preferredFocus=false,focusDismissed=false;
focusButton.addEventListener('click',e=>{if(e.isTrusted){preferredFocus=focusButton.getAttribute('aria-pressed')==='true';focusDismissed=!preferredFocus;}});
document.addEventListener('keydown',e=>{if(e.target!==document.body&&!e.target.closest?.(".qb-calculator-lesson"))return;if(e.key==='Escape'&&!$('watch').hidden){preferredFocus=false;focusDismissed=true;}});
function fitWatch(){
 if($('watch').hidden||focusStage.classList.contains('cx-focused'))return;
 const footer=$('watch').querySelector('.player').getBoundingClientRect();
 if(preferredFocus||!focusDismissed&&(footer.bottom>lessonEnd()+1||footer.top<watchShell.body.getBoundingClientRect().bottom+4||innerHeight<660||innerWidth<=375))focusButton.click();
}
const frameEl=focusStage.querySelector('.inverse-frame');
const focusOutside=[document.querySelector('.header'),document.querySelector('.calc-tabs'),$('watch').querySelector('.director'),document.querySelector('.notes')];
function syncFocus(){
 const focused=!$('watch').hidden&&focusStage.classList.contains('cx-focused');
 focusOutside.forEach(el=>{el.inert=focused;});
 $('watch').tabIndex=focused?-1:0;
 if(focused&&!focusStage.contains(document.activeElement))($('stage-play').hidden?play:$('stage-play')).focus({preventScroll:true});
}
new MutationObserver(syncFocus).observe(focusStage,{attributes:true,attributeFilter:['class']});
new ResizeObserver(()=>{
 const box=watchShell.body.querySelector('.hh-lcd').getBoundingClientRect(),frame=frameEl.getBoundingClientRect();
 if(box.height>0)$('stage-play').style.top=(box.top-frame.top+box.height/2)+'px';
}).observe(frameEl);
window.addEventListener('resize',fitWatch);
function tab(i,focus){
 const wasTry=!$('try').hidden;
 if(i!==0){freeze();if(focusStage.classList.contains('cx-focused'))focusButton.click();}
 else if(wasTry)stashTry();
 tabs.forEach((el,k)=>{el.tabIndex=k===i?0:-1;el.setAttribute('aria-selected',String(k===i));$(el.getAttribute('aria-controls')).hidden=k!==i});
 if(i===0)fitWatch();
 syncFocus();
 if(focus)(i?tryHost:play).focus({preventScroll:true});
}
tabs.forEach((el,i)=>{
 el.addEventListener('click',()=>{if(i===1)enterTry(null);else tab(0,false);});
 el.addEventListener('keydown',e=>{
   if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const j=e.key==='Home'?0:e.key==='End'?1:1-i;
     if(j===1)enterTry(null);else tab(0,false);
     if(!focusStage.classList.contains('cx-focused'))tabs[j].focus();
   }
 });
});
$('to-try').addEventListener('click',()=>enterTry(null));
$('take-over').addEventListener('click',()=>{
 freeze();
 if(now<=0||now>=timeline.duration-1e-6){enterTry(null);return;}
 const key=String(Math.round(now*1000));
 const model=demos[now>=timeline.anchors.problemB?1:0];
 enterTry(key,{frame:snapshotAt(now),model});
});
$('return-assigned').addEventListener('click',()=>enterTry(null));
$('reset-try').addEventListener('click',()=>{
 live=base();live.side=assessed.side;
 tryFeedback.textContent='';$('model-feedback').textContent='';paintTry();tryHost.focus();
});
$('return-watch').addEventListener('click',()=>tab(0,true));
const ui={target:$('target'),x:$('x'),known:$('known'),area:$('area'),event:$('event')};
function curve(el,{mean,sd,area,side='left'},reveal){
 const L=18,R=314,B=78;
 const x=z=>L+(z+4.4)*(R-L)/8.8,y=z=>B-150*density(z);
 const path=(a,b)=>{
   const out=[];for(let i=0;i<=72;i++){const z=a+(b-a)*i/72;out.push((i?'L':'M')+x(z).toFixed(2)+','+y(z).toFixed(2));}return out.join(' ');
 };
 const z=cutoff({mean:0,sd:1,area}), value=cutoff({mean,sd,area}), clamped=Math.max(-4.35,Math.min(4.35,z));
 const [a,b]=side==='right'?[clamped,4.35]:[-4.35,clamped], label=reveal?show(value):'z';
 const areaPath=(a,b,cls)=>a<b?'<path class="'+cls+'" d="'+path(a,b)+' L'+x(b).toFixed(2)+','+B+' H'+x(a).toFixed(2)+' Z"/>':'';
 const fill=(side==='right'?areaPath(-4.35,clamped,'complement'):'')+areaPath(a,b,'shade');
 const cut=Math.abs(z)<4.3, marker=x(clamped).toFixed(2);
 el.innerHTML='<svg viewBox="0 0 332 116" role="img" aria-label="Normal curve; '+esc(side)+' side of cutoff shaded'+(reveal?', '+(mean===0&&sd===1?'z-score ':'cutoff ')+esc(show(value)):'')+'" xmlns="http://www.w3.org/2000/svg"><path class="axis" d="M12,'+B+' H320"/>'+fill+'<path class="bell" d="'+path(-4.35,4.35)+'"/><path class="axis" d="M'+x(0)+','+(B-2)+' v4"/><text x="'+x(0)+'" y="96" text-anchor="middle">'+esc(show(mean))+'</text>'+(cut?'<path class="cut" d="M'+marker+','+B+' V'+y(z).toFixed(2)+'"/><text x="'+marker+'" y="'+(Math.abs(z)<.37?111:96)+'" text-anchor="middle">'+esc(label)+'</text>':'')+'</svg>';
}
function leftFromGiven(p,side){
 if(!(p>0&&p<1))throw Error('Use a probability strictly between 0 and 1.');
 if(side==='left')return p;
 const [mantissa,exponent='0']=String(p).split('e');
 const [integer,fraction='']=mantissa.split('.');
 const scale=fraction.length-Number(exponent);
 const whole=10n**BigInt(scale),numerator=BigInt(integer+fraction);
 const exact=(whole-numerator).toString().padStart(scale,'0');
 const q=Number('0.'+exact);
 if(!(q>0&&q<1))throw Error('This right-tail area is too close to zero for the calculator entry.');
 return q;
}
function resolve(preset){
 const {x,known,p,target,side}=preset;
 if(!Number.isFinite(x)||!Number.isFinite(known))throw Error('Enter finite known values.');
 if(Math.abs(x)>1e9||Math.abs(known)>1e9)throw Error('Use known values between −1 billion and 1 billion in this exercise.');
 if(target==='mean'&&known<=0)throw Error('The known standard deviation must be positive.');
 const left=leftFromGiven(p,side),z=cutoff({area:left,mean:0,sd:1});
 if(target==='sd'&&z===0)throw Error(x===known?'At the median, any positive standard deviation works. It cannot be determined.':'At the median the cutoff must equal the mean.');
 const answer=target==='mean'?x-known*z:(x-known)/z;
 if(target==='sd'&&answer<=0)throw Error('These values imply a nonpositive spread. Check which side of the mean the cutoff lies.');
 if(!Number.isFinite(answer)||Math.abs(answer)>=1e12)throw Error('The result is outside this exercise’s numeric range.');
 if(target==='sd'&&Number(answer.toFixed(2))===0)throw Error('This positive spread rounds to zero at two decimal places. Choose a case that stays positive at this precision.');
 return answer;
}
function setPrefill(preset){
 const {x,known,p,target,side}=preset;
 ui.target.value=target;ui.x.value=String(x);ui.known.value=String(known);
 ui.area.value=String(p);ui.event.value=side;
 live.prefill=[side==='left'?rawNumber(p):'','0','1'];live.side=side;
}
const isTry=qp.get('mode')==='try';
function describe(model,label=''){
 const {target,x,known,p,side}=model,parameter=target==='mean'?'mean':'standard deviation';
 $('challenge-title').textContent='Find the '+parameter;
 $('try-context').textContent=label||'Your turn';
 $('challenge').textContent='A normal distribution has '+(target==='mean'?'standard deviation ':'mean ')+rawNumber(known)+'. The probability of a value '+(side==='left'?'below ':'above ') +rawNumber(x)+' is '+String(p)+'. Find the '+parameter+'.';
}
const duplicate=['mode','target','tail','x','sd','mean','p','example'].some(k=>qp.getAll(k).length>1);
if(isTry&&duplicate){$('link-warning').textContent='The link repeats a field, so it is ambiguous. The default practice question is shown instead.';}
else if(isTry&&qp.get('example')==='demo'){setPrefill(task);}
else if(isTry&&['target','tail','x','sd','mean','p'].some(key=>qp.has(key))){
 const target=qp.get('target')??'mean',side=qp.get('tail')??'left';
 const keys=[qp.get('x'),qp.get(target==='sd'?'mean':'sd'),qp.get('p')];
 try{
   if(!keys.every(x=>x&&x.length<29)||!['mean','sd'].includes(target)||!['left','right'].includes(side))throw Error('The link is incomplete or has invalid fields.');
   const [x,known,p]=keys.map(parse);
   if(Math.abs(x)>1e9||Math.abs(known)>1e9)throw Error('The linked values are outside this exercise’s range.');
   const preset={target,side,x,known,p};resolve(preset);
   assessed=preset;setPrefill(preset);
 }catch(error){$('link-warning').textContent=error.message+' The default practice question is shown instead.';}
}
const startingModel=assessed,linked=startingModel!==task||isTry&&!duplicate&&qp.get('example')==='demo';
const controls=['target','x','known','event','area','answer'];
const feedbacks=['try-feedback','model-feedback','feedback'];
function capture(){
 return {live,assessed,inputs:controls.map(id=>$(id).value),feedback:feedbacks.map(id=>$(id).textContent),correct:$('feedback').classList.contains('correct'),hint:$('hint').open};
}
function stashTry(){
 if(forkKey===null){assigned=capture();return;}
 forks.delete(forkKey);forks.set(forkKey,capture());
 if(forks.size>24)forks.delete(forks.keys().next().value);
}
function restore(s){
 ({live,assessed}=s);
 controls.forEach((id,i)=>{$(id).value=s.inputs[i];});
 update();
 feedbacks.forEach((id,i)=>{$(id).textContent=s.feedback[i];});
 $('feedback').classList.toggle('correct',s.correct);$('hint').open=s.hint;
 describe(assessed,forkKey!==null?'Worked example · editable copy':assessed===startingModel&&linked?'Linked practice':assessed===task?'Your turn':'Your example');
 $('return-assigned').hidden=forkKey===null;$('answer-form').hidden=forkKey!==null;
 $('link-warning').hidden=forkKey!==null||!$('link-warning').textContent;
 paintTry();
}
function enterTry(key,fork){
 if(!$('try').hidden&&key===forkKey)return;
 if(!$('try').hidden)stashTry();
 forkKey=key;
 let state=key===null?assigned:forks.get(key);
 if(!state){
   live=fork.frame;assessed=fork.model;
   state={live,assessed,inputs:[assessed.target,String(assessed.x),String(assessed.known),assessed.side,String(assessed.p),''],feedback:['','',''],correct:false,hint:false};
 }
 restore(state);tab(1,true);
}
function update(){
 const side=ui.event.value,p=parse(ui.area.value);
 $('known-label').textContent=ui.target.value==='mean'?'Known standard deviation σ':'Known mean μ';
 $('model-feedback').textContent='';
 let message='Enter a probability between 0 and 1.';
 try {
   leftFromGiven(p,side);message=(side==='left'?'Left':'Right')+' area = '+show(p)+(side==='right'?' · Enter the area to the left.':'');
 }catch{}
 $('event-line').textContent=message;
}
Object.values(ui).forEach(el=>el.addEventListener(el===ui.event||el===ui.target?'change':'input',update));update();
$('model').addEventListener('submit',e=>{
 e.preventDefault();
 const feedback=$('model-feedback');
 try{
   const model={side:ui.event.value,target:ui.target.value,p:parse(ui.area.value),x:parse(ui.x.value),known:parse(ui.known.value)};
   resolve(model);live=base();setPrefill(model);assessed=model;
   describe(model,forkKey===null?'Your example':'Worked copy · edited example');
   $('answer').value='';$('feedback').textContent='';$('feedback').classList.remove('correct');
   paintTry();tryFeedback.textContent='';
   feedback.textContent='Loaded the model. Open Inverse Normal and work out the parameter on the handheld.';
   tryHost.focus();
 }catch(err){feedback.textContent=err.message;}
});
$('answer-form').addEventListener('submit',e=>{
 e.preventDefault();const raw=$('answer').value.trim().replace(',','.'),v=parse(raw),el=$('feedback'),answer=resolve(assessed),expected=answer.toFixed(2);
 let ok=false;
 if(forkKey!==null)return;
 if(!Number.isFinite(v))el.textContent='Enter a numerical result.';
 else if(v===Number(expected)&&/^[+-]?\d+\.\d{2}$/.test(raw)){ok=true;el.textContent='Correct: '+expected+'. Keep z unrounded until the last step.';}
 else if(v===Number(expected)||v.toFixed(2)===expected)el.textContent='The value is right. Give it to two decimal places.';
 else el.textContent='Not yet. Check that the area entered is to the left and that you used the correct rearrangement.';
 el.classList.toggle('correct',ok);
});
assigned=capture();restore(assigned);tab(isTry?1:0,false);
})();
