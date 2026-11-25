import {surface,MENUS} from './screen.js';
import {WATCH,TRY_CASES,solveInBounds} from './solver.js';

const $=id=>document.getElementById(id);
const media=$('voice'),play=$('play'),seek=$('seek'),cc=$('captions'),caption=$('caption'),lcd=$('lcd');
const CAPTIONS=[
 [0,'On a Calculator page, open Menu, choose Algebra, then Numerical Solve.'],
 [6.24,'Enter the equation, then a comma and the variable you’re solving for.'],
 [10.70,'To limit the search to an interval, add a comma, then enter the lower and upper bounds separated by another comma.'],
 [17.91,'Close the bracket and press Enter. The calculator gives one numerical solution.'],
 [23.58,'If the equation may have more than one solution, use separate intervals and check each result.'],
 [29.43,'Keep the calculator’s full precision while you work, then round the final answer as the question asks.'],
];
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
$('transcript').textContent=CAPTIONS.map(c=>c[1]).join(' ');
const SCREEN=surface($('drawing'));
lcd.dataset.renderer=SCREEN.backend;
const watchers=[...document.querySelectorAll('[data-mode]')];
const hotspots=$('hotspots');
let mode=null,time=0,duration=35.553,running=false,rafId=0,prevFrame=0,ccOn=false,silent=false,silentOrigin=0,pendingSeek=null,frameSig='';
let step='idle', values={equation:chosen.equation,lower:chosen.lower,upper:chosen.upper}, activeResult=null;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function configureTheme(){
 const theme=$('theme'),dark=matchMedia('(prefers-color-scheme:dark)');
 let mode='auto';try{mode=localStorage.getItem('ti-lab-theme')||'auto'}catch{}
 theme.value=mode;
 function set(){document.documentElement.dataset.theme=mode==='auto'?(dark.matches?'dark':'light'):mode}
 theme.addEventListener('change',()=>{mode=theme.value;try{localStorage.setItem('ti-lab-theme',mode)}catch{}set()});
 dark.addEventListener?.('change',set);set();
}
configureTheme();
function beat(i,keys=[],override=''){
 const [n,t,desc]=TOPICS[i];const key=n+'|'+keys.join('|')+'|'+override;
 if(frameSig===key)return;frameSig=key;
 $('beat-number').textContent=n;$('beat-title').textContent=t;$('beat-tip').textContent=override||desc;
 $('keypress').hidden=!keys.length;
 $('keys').replaceChildren(...keys.map(k=>{const el=document.createElement('kbd');el.className='key';el.textContent=k;return el}));
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
 window.HandheldTransport?.lightAt(shell,'CT06',t);
 let f=frame(t);
 const tape=window.HandheldKeyCues?.CT06||[], ms=t*1000;
 const past=tape.filter(e=>e.timeMs<=ms);
 const cmdCue=past.filter(e=>typeof e.cmdAfter==='string').at(-1);
 if(t>=23.58&&t<24.18){f={state:'result',n:4,...first,historyFocus:past.filter(e=>e.historyFocus).at(-1)?.historyFocus,keys:[]};}
 else if(f.state==='entry'&&cmdCue){f.cmd=cmdCue.cmdAfter;f.cursorFromEnd=cmdCue.cursorFromEnd??0;f.exponentOpen=!!cmdCue.exponentOpen;}
 SCREEN.draw(f);beat(f.n,f.keys,f.tip);
 let cap='';for(const [start,text] of CAPTIONS){if(start>t)break;cap=text}
 if(caption.textContent!==cap)caption.textContent=cap;
 caption.hidden=!ccOn;seek.value=t;
 seek.setAttribute('aria-valuetext',timecode(t)+' of '+timecode(Math.ceil(duration)));
 $('time').textContent=timecode(t)+' / '+timecode(Math.ceil(duration));
}
function playing(v){
 running=v;play.setAttribute('aria-label',v?'Pause':'Play');play.querySelector('.play-icon').hidden=v;play.querySelector('.pause-icon').hidden=!v;
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
media.addEventListener('pause',()=>{if(!silent&&running)pause()});
cc.addEventListener('click',()=>captionsState(!ccOn));
seek.addEventListener('input',()=>{
 time=clamp(Number(seek.value),0,duration);
 if(silent)silentOrigin=performance.now()-time*1000;
 else if(Number.isFinite(media.duration))media.currentTime=time;
 else pendingSeek=time;
 if(mode==='watch')paint(time);
});
let playTicket=0;
play.addEventListener('click',async()=>{
 if(mode!=='watch')return;
 if(running){playTicket++;pause();return}
 if(time>=duration-.04)time=0;
 if(silent||media.error){useSilent();playing(true);return}
 const token=++playTicket;
 if(Number.isFinite(media.duration))media.currentTime=time;else pendingSeek=time;
 try{await media.play();if(mode==='watch'&&token===playTicket)playing(true);else media.pause()}
 catch(e){if(e.name!=='AbortError'&&mode==='watch'&&token===playTicket){useSilent();playing(true)}}
});
const input=$('equation'),lo=$('lower'),hi=$('upper'),form=$('solver-form'),work=$('try-work');
const feedback=$('feedback'),answer=$('answer');
function show(el,s){el.textContent=s||'';el.hidden=!s}
function sync(v){input.value=v.equation;lo.value=v.lower;hi.value=v.upper;}
function btn(label,fn,quiet=false){const b=document.createElement('button');b.type='button';b.className=quiet?'quiet':'solid';b.textContent=label;b.addEventListener('click',fn);return b;}
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
 hotspots.replaceChildren();work.replaceChildren();
 $('restart').hidden=step==='idle';
 $('try-summary').hidden=step!=='idle';
 $('try-summary').textContent='Selected: '+prettify(values.equation)+' on ['+prettify(values.lower)+', '+prettify(values.upper)+']';
 form.hidden=step!=='entry'&&step!=='result';
 const row=document.createElement('div');row.className='inputrow';work.append(row);
 const state=step;
 const screenCmd=step==='entry'?'nSolve('+prettify(values.equation)+', x, '+values.lower+', '+values.upper+')':step==='result'?activeResult?.command||'':'';
 SCREEN.draw({state,cmd:screenCmd,result:activeResult?.result||'',cursor:state==='idle'});
 if(step==='idle'){
   beat(0,[],'Open Menu on the simulated Calculator page.');row.append(btn('menu',()=>tryStep('menu',true)));
 }else if(step==='menu'){
   beat(0,['menu'],'Choose 3: Algebra.');
   const next=()=>tryStep('submenu',true);
   row.append(btn('3: Algebra',next),btn('esc',()=>tryStep('idle',true),true));hotspot(MENUS.main,2,next);
 }else if(step==='submenu'){
   beat(0,['menu','3'],'Choose 1: Numerical Solve.');
   const next=()=>tryStep('entry',true);
   row.append(btn('1: Numerical Solve',next),btn('esc',()=>tryStep('menu',true),true));hotspot(MENUS.sub,0,next);
 }else if(step==='entry'){
   beat(2,['menu','3','1'],'Enter the equation and both bounds, then press Enter.');
   if(focus&&matchMedia('(pointer:fine)').matches)input.focus({preventScroll:true});
 }else if(step==='result'){
   beat(3,['enter'],'This run searches one interval. Change the bounds to look for the other solution.');
 }
 if(focus)row.querySelector('button')?.focus({preventScroll:true});
}
const fields=[input,lo,hi];
fields.forEach(f=>f.addEventListener('input',()=>{
 values={equation:input.value,lower:lo.value,upper:hi.value};
 if(step==='result'){step='entry';activeResult=null;show(answer,'');}
 show(feedback,'');if(step==='entry'){SCREEN.draw({state:'entry',cmd:cmd(prettify(values.equation),values.lower,values.upper)});beat(2,['menu','3','1'],'Enter the equation and both bounds, then press Enter.');}
}));
form.addEventListener('submit',ev=>{
 ev.preventDefault();values={equation:input.value,lower:lo.value,upper:hi.value};
 show(answer,'');show(feedback,'');
 try{
    const r=solveInBounds(values.equation,lo.valueAsNumber,hi.valueAsNumber);
    step='result';activeResult={command:cmd(prettify(r.equation),values.lower,values.upper),result:r.kind==='root'?r.screen:'No root found'};drawTry();
    if(r.kind==='root')show(answer,'x ≈ '+prettify(r.screen)+' · '+prettify(r.rounded)+' to 3 significant figures.');
    else show(feedback,'This practice scanner found no sign-changing root. Try a narrower interval that brackets a crossing; a root that only touches may be missed.');
 }catch(e){if(step==='result'){step='entry';drawTry()}show(feedback,e.message)}
});
document.querySelectorAll('[data-case]').forEach(b=>b.addEventListener('click',()=>choosePreset(b.dataset.case)));
$('restart').addEventListener('click',()=>tryStep('idle',true));

function setMode(m){
 if(mode===m)return;
 playTicket++;pause();mode=m;frameSig='';hotspots.replaceChildren();
 document.body.dataset.cxMode=m;shell?.setKeys([]);shell?.setInteractive(m==='try');$('take-over').hidden=m!=='watch';
 watchers.forEach(b=>{const yes=b.dataset.mode===m;b.classList.toggle('active',yes);b.setAttribute('aria-pressed',String(yes));});
 $('watch-controls').hidden=m!=='watch';$('practice').hidden=m!=='try';$('watch-example').hidden=m!=='watch';$('audio-notice').hidden=!(m==='watch'&&silent);
 if(m==='watch')paint(time);else{caption.hidden=true;drawTry()}
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
const shell=window.HandheldShell?.mount({screen:lcd,host:lcd.closest('.lcd-group'),label:'TI-Nspire CX II-T Calculator',onKey:handleHandheld});
window.HandheldTransport?.controls({container:$('watch-controls'),play,seek,active:()=>mode==='watch'});
$('take-over').addEventListener('click',()=>{
 const fresh=step==='idle'&&!key;
 setMode('try');
 if(fresh){values={equation:WATCH.equation,lower:2,upper:3};sync(values);tryStep('entry',false);show(feedback,'Watch is paused at your place. Edit the equation or choose different bounds.');}
});
watchers.forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
sync(values);
setMode(params.get('mode')==='try'?'try':'watch');
