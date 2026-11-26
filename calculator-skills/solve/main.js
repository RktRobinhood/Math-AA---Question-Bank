import {surface,MENUS} from './screen.js';
import {WATCH,TRY_CASES,solveInBounds} from './solver.js';


const $=id=>document.getElementById(id);
const lcd=$('lcd'),host=$('handheld-host'),player=$('player'),hotspots=$('hotspots');
const cmd=(eq,a,b)=>'nSolve('+eq+', x, '+a+', '+b+')';
const prettify=s=>String(s).replace(/-/g,'−').replace(/\^2/g,'²').replace(/\^3/g,'³');
const wPos=solveInBounds(WATCH.equation,2,3),wNeg=solveInBounds(WATCH.equation,-4,-3);
const first={cmd:cmd(WATCH.show,2,3),result:wPos.screen},second={cmd:cmd(WATCH.show,-4,-3),result:wNeg.screen};
const SCREEN=surface($('drawing'));
lcd.dataset.renderer=SCREEN.backend;
const params=new URL(location.href).searchParams,key=params.get('example')??params.get('case'),legalKey=key==='roots-demo'?'demo':key;
const practiceCase={equation:'2^x=x+3',lower:'2',upper:'3',label:'Second pair of models'};
const originalPreset=Object.hasOwn(TRY_CASES,legalKey);
const chosen=originalPreset?TRY_CASES[legalKey]:practiceCase;
$('try-task').textContent=originalPreset?
 'Find where y = x² and y = 5 meet. Use a different interval for each x-value.':
 'Find where y = 2ˣ and y = x + 3 meet between x = −3 and x = 3. Use one interval for each crossing.';
const tape=window.HandheldKeyCues.CT06, practiceWatch=document.documentElement.dataset.practiceWatch==='true';
let mode='watch',step='idle',values={equation:chosen.equation,lower:chosen.lower,upper:chosen.upper},activeResult=null,cache='',returnToWatch;
function beat(i,keys=[],copy=''){$('try-tip').textContent=copy;}
function showScreen(f){SCREEN.draw(f);$('lcd-text').textContent=[f.state,f.cmd,f.result,f.historyFocus].filter(Boolean).join('. ');}
function renderWatch(device,{beat,point,key,crossed}){
 if(host.parentElement!==device)device.append(host);
 const count=crossed.length,e=tape[count-1],hold=point.span.end-point.span.voiceEnd;
 shell.setKeys(e&&!point.speaking&&key?.beat===beat&&(point.fraction-key.at)*hold<.55?[e.key]:[]);
 const signature=beat+':'+count;
 if(signature===cache)return;cache=signature;
 let f={state:'idle',cursor:true};
 if(count===1)f={state:'menu'};
 else if(count===2)f={state:'submenu'};
 else if(count>=3&&count<19)f={state:'entry',cmd:e.cmdAfter,cursor:true,exponentOpen:e.exponentOpen};
 else if(count>=19&&count<22)f={state:'result',...first,historyFocus:e.historyFocus};
 else if(count>=22&&count<33)f={state:'entry',history:[first],cmd:e.cmdAfter??tape.slice(0,count).findLast(c=>c.cmdAfter)?.cmdAfter,cursor:true,cursorFromEnd:e.cursorFromEnd};
 else if(count===33)f={state:'result',history:[first],...second};
 showScreen(f);
}
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
 const v=originalPreset?TRY_CASES[k]:k==='negative'?{...practiceCase,lower:'-3',upper:'-2'}:practiceCase;values={equation:v.equation,lower:v.lower,upper:v.upper};sync(values);
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
 showScreen({state:step,cmd:screenCmd,result:activeResult?.result||'',cursor:step==='idle'});
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

let targetField=0,lastField=-1;
fields.forEach((field,i)=>field.addEventListener('focus',()=>{targetField=i;lastField=i}));
function handleHandheld(key){
 if(mode!=='try')return;
 const k=String(key).toLowerCase();
 if(k==='home'||k==='scratchpad'){location.assign('../scratchpad/index.html');return}
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
const shell=CalculatorLessonHandset.mount(host,{screen:lcd,label:'TI-Nspire CX II-T Calculator',onKey:(key,event)=>{
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

function enterTry(device,actions){
 if(practiceWatch)return;
 mode='try';returnToWatch=actions.returnToWatch;device.prepend(player);$('try-grid').prepend(host);player.hidden=false;
 shell.setKeys([]);shell.setInteractive(true);drawTry();player.focus({preventScroll:true});
}
function exitTry(){mode='watch';cache='';player.hidden=true;form.hidden=true;hotspots.replaceChildren();shell.setKeys([]);shell.setInteractive(false);}
$('return-watch').addEventListener('click',()=>returnToWatch?.());
sync(values);shell.setInteractive(false);
window.CalculatorLessonAdapter=Object.freeze({initialMode:!practiceWatch&&params.get('mode')==='try'?'try':'watch',renderWatch,enterTry,exitTry});
if(practiceWatch){
 const root=document.querySelector('[data-calculator-watch]'),tell=type=>window.parent.postMessage({type},location.origin);
 const observer=new MutationObserver(()=>{if(!root.querySelector('.lw-stage'))return;observer.disconnect();tell('qb-practice-watch-ready');});
 observer.observe(root,{childList:true,subtree:true});
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&!event.defaultPrevented&&!document.fullscreenElement&&!root.querySelector('.watch-fullscreen-fallback')){
   event.preventDefault();tell('qb-practice-watch-exit');
  }
 },false);
}
await import('../handheld/watch-bootstrap.js?v=1');
