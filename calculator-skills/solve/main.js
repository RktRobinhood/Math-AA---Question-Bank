import {surface,MENUS} from './screen.js';
import {WATCH,TRY_CASES,solveInBounds} from './solver.js';

const $=id=>document.getElementById(id);
const media=$('voice'),play=$('play'),seek=$('seek'),cc=$('captions'),caption=$('caption'),lcd=$('lcd');
import narration from './narration-cues.json';
const CAPTIONS=narration.cues;
const TOPICS=[
 ['01','Open Numerical Solve','On a Calculator page, choose Menu → 3: Algebra → 1: Numerical Solve.'],
 ['02','Enter the equation','Type the equation, a comma, and the variable. On the handheld, use → to exit the exponent first.'],
 ['03','Add two bounds','The lower bound comes first. Both bounds are values of x.'],
 ['04','Read one solution','Press Enter. The display gives a numerical solution in the chosen interval.'],
 ['05','Search separate intervals','If you expect another root, choose another interval and run nSolve again.'],
 ['06','Round at the end','Keep the unrounded result while working. Round the final answer as needed.'],
];
const cmd=(eq,a,b)=>'nSolve('+eq+', x, '+a+', '+b+')';
const prettify=s=>String(s).replace(/-/g,'−').replace(/\^2/g,'²').replace(/\^3/g,'³');
const wPos=solveInBounds(WATCH.equation,2,3);
const wNeg=solveInBounds(WATCH.equation,-4,-3);
const first={cmd:cmd(WATCH.show,2,3),result:wPos.screen};
const second={cmd:cmd(WATCH.show,-4,-3),result:wNeg.screen};
const params=new URL(location.href).searchParams;
const key=params.get('example')??params.get('case');
const legalKey=key==='roots-demo'?'demo':key;
const chosen=Object.hasOwn(TRY_CASES,legalKey)?TRY_CASES[legalKey]:TRY_CASES.demo;
$('context').textContent='CT06'+(key&&Object.hasOwn(TRY_CASES,legalKey)?' · '+chosen.label:'');
$('transcript').textContent=CAPTIONS.map(c=>c.text).join(' ');
const SCREEN=surface($('drawing'));
lcd.dataset.renderer=SCREEN.backend;
const watchers=[...document.querySelectorAll('[data-mode]')];
const hotspots=$('hotspots');
let mode=null,time=0,duration=35.553,running=false,rafId=0,prevFrame=0,ccOn=false,silent=false,silentOrigin=0,pendingSeek=null,frameSig='';
let step='idle', values={equation:chosen.equation,lower:chosen.lower,upper:chosen.upper}, activeResult=null;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const player=$('player'),fullButton=$('view-full'),screenButton=$('view-screen'),keyButton=$('key-labels'),keyOverlay=$('key-overlay');
const playerUI=window.CalculatorWatchPlayer.mount({player, surface:$('watch-surface'), play,seek,expand:$('fullscreen'),
 feedback:$('play-feedback'),active:()=>mode==='watch'});
let showKeys=false,screenOnly=false,willPlay=false;
const scene=$('watch-surface');
function fitWatch(){
 if(mode!=='watch')return;
 const h=window.innerHeight, top=scene.getBoundingClientRect().top+window.scrollY;
 const tab=document.querySelector('.tabbar'), nav=tab?.getBoundingClientRect().height||0;
 const captionHeight=caption.getBoundingClientRect().height;
 const room=h-top-nav-$('watch-controls').getBoundingClientRect().height-captionHeight;
 player.style.setProperty('--watch-caption-height',captionHeight+'px');
 const stacked=matchMedia('(max-width:735px) and (min-height:701px)').matches;
 const beatH=stacked?scene.querySelector('.beat').getBoundingClientRect().height+8:0;
 player.style.setProperty('--watch-handheld-fit',Math.floor(Math.max(126,Math.min(300,(room-beatH-25)*558/1168)))+'px');
 player.style.setProperty('--watch-lcd-fit',Math.floor(Math.max(198,Math.min(570,(room-beatH-81)*4/3)))+'px');
}
window.addEventListener('resize',fitWatch);
document.addEventListener('fullscreenchange',fitWatch);
const stageObserver=new ResizeObserver(fitWatch);
[document.querySelector('main>.title'),$('watch-controls'),caption,scene.querySelector('.beat')].forEach(e=>stageObserver.observe(e));

function viewState(){
 const screenMode=mode==='watch'&&screenOnly;
 player.classList.toggle('solve-screen-only',screenMode);
 fullButton.setAttribute('aria-pressed',String(!screenOnly));
 screenButton.setAttribute('aria-pressed',String(screenOnly));
 fitWatch();
}
function beat(i,keys=[],override=''){
 const [n,t,desc]=TOPICS[i];const key=n+'|'+keys.join('|')+'|'+override;
 if(frameSig===key)return;frameSig=key;
 $('beat-number').textContent=n;$('beat-title').textContent=t;$('beat-tip').textContent=override||desc;

}
function frame(t){
 if(t<1.60)return {state:'idle',n:0,keys:[]};
 if(t<3.55)return {state:'menu',n:0,keys:['menu']};
 if(t<5.31)return {state:'submenu',n:0,keys:['menu','3']};
 if(t<6.25)return {state:'entry',n:0,cmd:'nSolve(',cursor:true,keys:['menu','3','1']};
 if(t<8.86)return {state:'entry',n:1,cmd:'nSolve('+WATCH.show.slice(0,Math.floor(clamp((t-6.25)/2.6,0,1)*WATCH.show.length)),cursor:true,keys:t<7.15?['2','^','x']:t<7.8?['→','=']:['=','x','+','4']};
 if(t<10.70)return {state:'entry',n:1,cmd:'nSolve('+WATCH.show+(t<9.75?',':', x'),cursor:true,keys:[',','x']};
 if(t<17.91)return {state:'entry',n:2,cmd:'nSolve('+WATCH.show+', x'+(t<13.5?',':t<15.4?', 2':', 2, 3'),cursor:true,keys:t<13.5?[',']:t<15.4?[',','2']:[',','3']};
 if(t<20.5)return {state:'entry',n:3,cmd:first.cmd,cursor:true,keys:[')']};
 if(t<23.58)return {state:'result',n:3,...first,keys:t<22.4?['enter']:[]};
 if(t<27.92)return {state:'entry',n:4,cmd:second.cmd,history:[first],cursor:true,keys:['−','4',',','−','3']};
 if(t<29.43)return {state:'result',n:4,...second,history:[first],keys:t<29.1?['enter']:[]};
 return{state:'result',n:5,...second,history:[first],keys:[],tip:'To 3 significant figures: x ≈ '+prettify(wNeg.rounded)+' or '+wPos.rounded+'.'};
}
const timecode=t=>Math.floor(Math.max(0,t)/60)+':'+String(Math.floor(Math.max(0,t))%60).padStart(2,'0');
function paint(t){
 const keys=window.HandheldTransport?.lightAt(shell,'CT06',t)||[];
 let f=frame(t);
 const tape=window.HandheldKeyCues?.CT06||[], ms=t*1000;
 const past=tape.filter(e=>e.timeMs<=ms);
 const cmdCue=past.filter(e=>typeof e.cmdAfter==='string').at(-1);
 if(t>=23.58&&t<24.18){f={state:'result',n:4,...first,historyFocus:past.filter(e=>e.historyFocus).at(-1)?.historyFocus,keys:[]};}
 else if(f.state==='entry'&&cmdCue){f.cmd=cmdCue.cmdAfter;f.cursorFromEnd=cmdCue.cursorFromEnd??0;f.exponentOpen=!!cmdCue.exponentOpen;}
 SCREEN.draw(f);beat(f.n,f.keys,f.tip);
 const cap=CAPTIONS.find(c=>ms>=c.startMs&&ms<c.endMs)?.text||'';
 if(caption.textContent!==cap)caption.textContent=cap;
 caption.hidden=!ccOn||!cap;
 keyOverlay.hidden=!showKeys||!keys.length;
 if(keys.length)keyOverlay.querySelector('kbd').textContent=({right:'→',left:'←',up:'↑',down:'↓',enter:'Enter',menu:'Menu',power:'^',delete:'Del',neg:'(−)',eq:'=',comma:',',plus:'+',minus:'−'})[keys[0]]||keys[0];
 player.dataset.step=f.state;
 seek.value=t;
 seek.setAttribute('aria-valuetext',timecode(t)+' of '+timecode(duration));
 $('time').textContent=timecode(t)+' / '+timecode(duration);
 $('take-over').textContent=t>=duration-.04?'Open Try':'Take over';
 $('take-over').setAttribute('aria-label',t>=duration-.04?'Open independent Try':'Take over the calculator');
}
function playing(v){
 running=v;willPlay=false;play.setAttribute('aria-label',v?'Pause':time>=duration-.04?'Replay':'Play');play.querySelector('.play-icon').hidden=v;play.querySelector('.pause-icon').hidden=!v;
 cancelAnimationFrame(rafId);if(v)rafId=requestAnimationFrame(tick);
}
function tick(now){
 if(!running||mode!=='watch')return;
 if(now-prevFrame>=31){
  prevFrame=now;time=silent?clamp((now-silentOrigin)/1000,0,duration):media.currentTime;
  paint(time);
  if(time>=duration-.015){end();return}
 }
 rafId=requestAnimationFrame(tick)
}
function end(){time=duration;playing(false);media.pause();if(mode==='watch')paint(time)}
function pause(){
 if(!silent&&running&&Number.isFinite(media.currentTime))time=media.currentTime;
 media.pause();playing(false);if(mode==='watch')paint(time);
}
function captionsState(v){ccOn=v;cc.setAttribute('aria-pressed',String(v));cc.setAttribute('aria-label',v?'Hide captions':'Show captions');if(mode==='watch')paint(time)}
function useSilent(){
 silent=true;silentOrigin=performance.now()-time*1000;$('audio-notice').hidden=mode!=='watch';captionsState(true)
}
media.addEventListener('loadedmetadata',()=>{
 if(Number.isFinite(media.duration))duration=media.duration;seek.max=duration;
 if(pendingSeek!==null){media.currentTime=pendingSeek;pendingSeek=null}
 if(mode==='watch')paint(time);
});
media.addEventListener('error',useSilent);
media.addEventListener('ended',end);
media.addEventListener('pause',()=>{if(!silent&&running&&media.paused)pause()});
cc.addEventListener('click',()=>captionsState(!ccOn));
keyButton.addEventListener('click',()=>{showKeys=!showKeys;keyButton.setAttribute('aria-pressed',String(showKeys));keyButton.title=showKeys?'Hide key presses':'Show key presses';if(mode==='watch')paint(time)});
fullButton.addEventListener('click',()=>{screenOnly=false;viewState()});
screenButton.addEventListener('click',()=>{screenOnly=true;viewState()});
seek.addEventListener('input',()=>{
 time=clamp(Number(seek.value),0,duration);
 if(silent)silentOrigin=performance.now()-time*1000;
 else if(Number.isFinite(media.duration))media.currentTime=time;
 else pendingSeek=time;
 if(mode==='watch'){paint(time);if(!running)play.setAttribute('aria-label',time>=duration-.04?'Replay':'Play');}
});
let playTicket=0;
play.addEventListener('click',async()=>{
 if(mode!=='watch')return;
 if(running||willPlay){playTicket++;pause();playerUI.flash(false);return}
 if(time>=duration-.04)time=0;
 if(silent||media.error){useSilent();playing(true);playerUI.flash(true);return}
 const token=++playTicket;willPlay=true;
 if(Number.isFinite(media.duration))media.currentTime=time;else pendingSeek=time;
 try{await media.play();if(mode==='watch'&&token===playTicket){playing(true);playerUI.flash(true)}else if(!willPlay&&!running)media.pause()}
 catch(e){if(e.name!=='AbortError'&&mode==='watch'&&token===playTicket){useSilent();playing(true);playerUI.flash(true)}}
});
const input=$('equation'),lo=$('lower'),hi=$('upper'),form=$('solver-form');
const feedback=$('feedback'),answer=$('answer');
function show(el,s){el.textContent=s||'';el.hidden=!s}
function sync(v){input.value=v.equation;lo.value=v.lower;hi.value=v.upper;}
function hotspot(m,index,fn){
 const b=document.createElement('button');b.type='button';b.tabIndex=-1;b.setAttribute('aria-hidden','true');b.className='hot';
 b.style.cssText='left:'+m.x/3.2+'%;top:'+(m.y+2+index*15)/2.4+'%;width:'+m.w/3.2+'%;height:'+15/2.4+'%';
 b.addEventListener('mousedown',e=>e.preventDefault());b.addEventListener('click',e=>{e.stopPropagation();fn()});hotspots.append(b);
}
function choosePreset(k){
 const v=TRY_CASES[k];values={equation:v.equation,lower:v.lower,upper:v.upper};sync(values);
 tryStep(step==='idle'?'idle':'entry',false);
}
function tryStep(s,focus=false){
 step=s;activeResult=null;show(answer,'');show(feedback,'');drawTry(focus);
}
function drawTry(focus=false){
 hotspots.replaceChildren();
 $('restart').hidden=step==='idle';
 $('edit-entry').hidden=step!=='result';
 $('try-summary').hidden=step!=='idle';
 $('try-summary').textContent='Selected: '+prettify(values.equation)+' on ['+prettify(values.lower)+', '+prettify(values.upper)+']';
 const wasHidden=form.hidden;
 form.hidden=step!=='entry';
 player.dataset.step=step;
 const screenCmd=step==='result'?activeResult?.command||'':'';
 SCREEN.draw({state:step,cmd:screenCmd,result:activeResult?.result||'',cursor:step==='idle'});
 if(step==='idle')beat(0,[],'Open Menu on the simulated Calculator page.');
 else if(step==='menu'){
   beat(0,['menu'],'Choose 3: Algebra.');
   hotspot(MENUS.main,2,()=>tryStep('submenu',true));
 }else if(step==='submenu'){
   beat(0,['menu','3'],'Choose 1: Numerical Solve.');
   hotspot(MENUS.sub,0,()=>tryStep('entry',true));
 }else if(step==='entry'){
   beat(2,['menu','3','1'],'Enter the equation and both bounds, then press Enter.');
   if((wasHidden||focus)&&matchMedia('(pointer:fine)').matches)input.focus({preventScroll:true});
 }else if(step==='result')beat(3,['enter'],'This run searches one interval. Change the bounds to look for the other solution.');
}
const fields=[input,lo,hi];
fields.forEach(f=>f.addEventListener('input',()=>{
 values={equation:input.value,lower:lo.value,upper:hi.value};
 if(step==='result'){step='entry';activeResult=null;show(answer,'');}
 show(feedback,'');
}));
function readBound(value){
 const s=value.trim().replace(/−/g,'-');
 return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(s)?Number(s):NaN;
}
form.addEventListener('submit',ev=>{
 ev.preventDefault();values={equation:input.value,lower:lo.value,upper:hi.value};
 show(answer,'');show(feedback,'');
 try{
    const r=solveInBounds(values.equation,readBound(values.lower),readBound(values.upper));
    step='result';activeResult={command:cmd(prettify(r.equation),values.lower,values.upper),result:r.kind==='root'?r.screen:'No root found'};drawTry();
    if(r.kind==='root')show(answer,'x ≈ '+prettify(r.screen)+' · '+prettify(r.rounded)+' to 3 significant figures.');
    else show(feedback,'This practice scanner found no sign-changing root. Try a narrower interval that brackets a crossing; a root that only touches may be missed.');
 }catch(e){if(step==='result'){step='entry';drawTry()}show(feedback,e.message)}
});
document.querySelectorAll('[data-case]').forEach(b=>b.addEventListener('click',()=>choosePreset(b.dataset.case)));
$('restart').addEventListener('click',()=>{tryStep('idle',true);player.focus({preventScroll:true})});
$('edit-entry').addEventListener('click',()=>tryStep('entry',true));
form.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();form.requestSubmit();}});

function setMode(m){
 if(mode===m)return;
 playTicket++;pause();mode=m;frameSig='';hotspots.replaceChildren();
 document.body.dataset.cxMode=m;viewState();shell?.setKeys([]);shell?.setInteractive(m==='try');$('take-over').hidden=m!=='watch';
 watchers.forEach(b=>{const yes=b.dataset.mode===m;b.classList.toggle('active',yes);b.setAttribute('aria-pressed',String(yes));});
 $('watch-controls').hidden=m!=='watch';$('practice').hidden=m!=='try';$('watch-example').hidden=m!=='watch';$('audio-notice').hidden=!(m==='watch'&&silent);
 if(m==='watch'){form.hidden=true;paint(time)}else{playerUI.clear();playerUI.exit();caption.hidden=true;keyOverlay.hidden=true;drawTry()}
}
let targetField=0,lastField=-1;
fields.forEach((field,i)=>field.addEventListener('focus',()=>{targetField=i;lastField=i}));
function handleHandheld(key){
 if(mode!=='try')return;
 const k=String(key).toLowerCase();
 if(k==='home'||k==='scratchpad'){location.assign('../handheld/index.html');return}
 if(k==='menu'){tryStep('menu',false);return}
 if(k==='esc'){tryStep(step==='submenu'?'menu':'idle',false);return}
 if(step==='idle'&&(k==='enter'||k==='click')){tryStep('menu',false);return}
 if(step==='menu'&&(k==='3'||k==='enter'||k==='right')){tryStep('submenu',false);return}
 if(step==='submenu'&&(k==='1'||k==='enter'||k==='right')){targetField=0;lastField=-1;tryStep('entry',false);return}
 if(step!=='entry'&&step!=='result')return;
 if(k==='tab'||k==='down'||k==='up'){
   targetField=(targetField+(k==='up'?2:1))%fields.length;lastField=-1;
   const x=fields[targetField];x.focus({preventScroll:true});lastField=-1;
   show(feedback,['Enter the equation.','Enter the lower bound.','Enter the upper bound.'][targetField]);return;
 }
 if(k==='enter'||k==='click'){form.requestSubmit();return}
 const t=window.HandheldTransport,field=fields[targetField], ch=t?.character(k);
 if((ch!==null||k==='del')&&(targetField===0||k==='del'||/^[0-9.\-]$/.test(ch??''))){
   t.modify(field,k,{replace:targetField!==lastField});lastField=targetField;
 }
}
const shell=window.HandheldShell?.mount({screen:lcd,host:lcd.closest('.lcd-group'),label:'TI-Nspire CX II-T Calculator',onKey:(key,event)=>{
 const focusesField=step==='entry'&&['tab','down','up'].includes(key);
 handleHandheld(key);
 if(!focusesField&&!fields.includes(document.activeElement)&&mode==='try')player.focus({preventScroll:true});
}});
document.addEventListener('keydown',e=>{
 if(mode!=='try'||e.ctrlKey||e.metaKey||e.altKey||e.repeat||e.defaultPrevented)return;
 if(e.target!==document.body&&e.target!==player)return;
 const key=e.key.toLowerCase()==='m'?'menu':e.key==='Tab'&&step==='entry'&&!e.shiftKey?'tab':HandheldShell.normalizeKey(e.key);
 if(!shell.getKey(key)||e.key==='Tab'&&key!=='tab')return;
 e.preventDefault();shell.getKey(key).click();
});
$('take-over').addEventListener('click',()=>{
 const ended=time>=duration-.04,fresh=!ended&&step==='idle'&&!key;
 setMode('try');
 if(fresh){values={equation:WATCH.equation,lower:2,upper:3};sync(values);tryStep('entry',false);show(feedback,'Watch is paused at your place. Edit the equation or choose different bounds.');}
 player.focus({preventScroll:true});
});
watchers.forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
sync(values);
setMode(params.get('mode')==='try'?'try':'watch');
