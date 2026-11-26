import {EXAMPLE,clamp,displayExpr,parseQuadratic,parseGraph,graphMinimum,pretty,windowFor} from './model.js';
import {screen,PANEL,pointAt} from './screen.js';

const $=id=>document.getElementById(id);
import {demoTime,tape} from './minimum-watch-plan.js?v=2';
const BANK='https://rktrobinhood.github.io/Math-AA---Question-Bank/';
const bankName='Math AA question bank';
const u=new URL(location.href), p=u.searchParams;
const queryRef=(p.get('question')||p.get('ref')||'').trim().slice(0,100);
const fallbackExpr='x^2-6x+4';
const fromQuery=(p.get('expr')||p.get('function')||'').trim().slice(0,81);
const contexts={demo:{expr:fallbackExpr,name:'CT12 · original linked example'},original:{expr:fallbackExpr,name:'CT12 · original linked example'}};
const preset=contexts[p.get('example')];
const liveSource=p.get('source')||'';
let validSource=null;
try{
 const v=new URL(liveSource);
 if(v.protocol==='https:'&&v.hostname==='rktrobinhood.github.io'&&v.pathname.startsWith('/Math-AA---Question-Bank/'))validSource=v.href;
}catch{}
const initialMode=p.get('mode')==='try'?'try':'watch';
const context=preset?.name||queryRef;
const linkedRaw=fromQuery||preset?.expr||'';
const watchQ=parseQuadratic(EXAMPLE);
let validLinked=null;
try{if(linkedRaw)validLinked=parseGraph(linkedRaw);}catch{}
const exercise=parseQuadratic('2x^2-8x+13');
const assigned=validLinked||exercise,assignedRaw=assigned.raw;
let mode='watch', lastFrame='', tryState=emptyTry(), firstVisit=true;
const host=$('handheld-host'),lcd=$('lcd'),tryStage=$('try-stage');
const render=screen($('drawing'));
lcd.dataset.renderer=render.backend;
if(context||linkedRaw){$('context').textContent=context||'Linked practice';$('context').hidden=false;}
if(validSource||queryRef){const a=$('return-question');a.href=validSource||BANK;a.hidden=false;a.textContent='Back to '+bankName+' ↗';}
$('challenge').textContent=validLinked?'For f(x) = '+displayExpr(assignedRaw)+', find a turning-point minimum. Report its x-coordinate and value.':
 'A second greenhouse models daily pump energy as E = 2x² − 8x + 13 kWh, for 0 ≤ x ≤ 5 hours after sunrise. When should the pump start, and what is its least energy use?';
if(!validLinked){$('answer-x-label').textContent='Hours after sunrise';$('answer-y-label').textContent='Least energy (kWh)';}
function emptyTry(){
 return validLinked?{state:'plotted',q:validLinked,raw:assignedRaw,low:null,high:null,cursor:null,error:null}:
  {state:'entry',q:null,raw:assignedRaw,low:null,high:null,cursor:null,error:null};
}

function frame(t){
 const q=watchQ,raw=q.raw,tran=(a,b)=>clamp((t-a)/(b-a),0,1);
 const r=windowFor(q),lo=q.x-r.h*.29,hi=q.x+r.h*.34;
 const recent=tape.findLast(e=>t*1000>=e.timeMs&&typeof e.rawAfter==='string');
 if(t<4.78)return {state:'entry',q:null,raw:recent?.rawAfter||''};
 if(t<5.49)return {state:'plotted',q,raw};
 if(t<7.35)return {state:'menu',q,raw};
 if(t<9.18)return {state:'submenu',q,raw};
 if(t<18.02)return {state:'lower',q,raw,cursor:q.x+(lo-q.x)*tran(14.1,17.48)};
 if(t<23.35)return {state:'upper',q,raw,low:lo,cursor:lo+(hi-lo)*tran(19.5,22.55)};
 const ghost=t<34;
 return {state:'result',phase:ghost?'preview':t<30.33?'result':'notes',q,raw,low:lo,high:hi,ghost};
}
function labelGraph(f){
 const pair=f.state==='result'&&!f.error&&f.q?f.extremum||f.q:null;
 let step=f.state==='menu'?'Graphs Menu':f.state==='submenu'?'6: Analyze Graph. 2: Minimum.':f.state==='lower'?'lower bound?':f.state==='upper'?'upper bound?':pair?(f.ghost?'Minimum preview ':'Minimum ')+ '('+pretty(pair.x)+', '+pretty(pair.y)+')':'';
 $('lcd-text').textContent=[f.raw?'f₁(x) = '+displayExpr(f.raw):'',step].filter(Boolean).join('. ');
}
function renderWatch(device,{point,beat,key}){
 if(host.parentElement!==device){
  device.append(host);host.hidden=false;form.hidden=true;hotspots.replaceChildren();lcd.classList.remove('pick');
 }
 const initials=demoTime(point),edge=beat===8&&point.fraction>.98;
 // The legacy editorial key tape still owns LCD interpolation; key IDs in the
 // authored JSON align to its exact event offsets within each physical hold.
 const event=key?tape[Number(key.id.split('-').at(-1))]:null;
 const demo=event&&Math.abs(initials-event.timeMs/1000)<.00001?event.timeMs/1000:initials;
 const f=frame(edge?Math.max(34,demo):demo);
 const sd=event?(demo-event.timeMs/1000)*1000:Infinity;
 const duration=event?.durationMs??0;
 const lit=!point.speaking&&key?.beat===beat&&sd>=-1e-6&&sd<Math.max(duration,380);
 shell.setKeys(lit?[event.key]:[]);
 const stamp=JSON.stringify([f.state,f.phase,f.raw,f.cursor,f.ghost]);
 if(stamp!==lastFrame){lastFrame=stamp;render.draw(f);labelGraph(f);}
 lcd.dataset.renderer=render.backend;
}

const hotspots=$('hotspots'), form=$('expression-form'), input=$('expression'), feedback=$('feedback'), answer=$('answer');
input.value=tryState.raw;
const tell=(msg)=>{feedback.textContent=msg||'';feedback.hidden=!msg};
const showAnswer=(msg)=>{answer.textContent=msg||'';answer.hidden=!msg};
function addHotspot(panel,i,callback){
 const h=document.createElement('button');h.type='button';h.className='hot';h.setAttribute('aria-label',panel.rows[i]);h.style.left=(panel.x/320*100)+'%';h.style.top=((panel.y+2+i*panel.h)/240*100)+'%';h.style.width=(panel.w/320*100)+'%';h.style.height=(panel.h/240*100)+'%';
 h.addEventListener('click',e=>{e.stopPropagation();callback()});hotspots.append(h);
}
function state(next,focus=true){tryState.state=next;tryState.error=null;tell('');showAnswer('');drawTry(focus);}
function pinMinimum(){
 const s=tryState;
 if(s.state!=='result'||!s.ghost||!s.extremum)return;
 s.ghost=false;drawTry();
}
function setBound(v){
 const s=tryState;
 if(!Number.isFinite(v)){tell('Enter an x-value.');return}
 const r=windowFor(s.q);
 if(v<r.x0||v>r.x1){tell('Choose a bound inside the graph window: '+pretty(r.x0)+' to '+pretty(r.x1)+'.');return}
 if(s.state==='lower'){s.low=v;s.cursor=v;state('upper');return}
 if(s.state==='upper'){
   if(v<=s.low){tell('Choose an upper bound greater than the lower bound.');return;}
   s.high=v;
   const result=graphMinimum(s.q,s.low,s.high);
   s.extremum=result.ok?{x:result.x,y:result.y}:null;
   s.ghost=result.ok;
   if(result.ok)state('result');
   else{s.state='result';s.error=result.message;drawTry();tell(result.message);}
 }
}
function drawTry(focus=false){
 const s=tryState;
 const hints={
   entry:'Type the function on the calculator screen or use its keypad. Press Enter to plot.',
   plotted:'Press Menu, then 6: Analyze Graph.',
   menu:'Choose 6: Analyze Graph.',
   submenu:'Choose 2: Minimum.',
   lower:'Tap to the left of the valley, or use ← and press Enter.',
   upper:'Tap to the right of the valley, or use → and press Enter.',
   result:s.ghost?'Press Enter to pin the preview, or reopen Menu to try new bounds.':'Open Menu to try new bounds.'
 };
 render.draw(s);labelGraph(s);
 syncTask();
 $('try-instructions').textContent=hints[s.state];
 hotspots.replaceChildren();
 form.hidden=s.state!=='entry';
 lcd.classList.toggle('pick',s.state==='lower'||s.state==='upper');
 if(s.state==='entry'){if(focus)input.focus({preventScroll:true});return}
 if(focus)lcd.focus({preventScroll:true});
 if(s.state==='menu') addHotspot(PANEL.main,5,()=>state('submenu'));
 if(s.state==='submenu')addHotspot(PANEL.sub,1,()=>{s.cursor=s.q.x;state('lower')});
 if(s.state==='result'&&s.extremum)showAnswer('Minimum value: '+pretty(s.extremum.y)+', at x = '+pretty(s.extremum.x)+'.'+(s.ghost?' Press Enter to pin.':''));
}
function loadTry(raw,focus=false){
 checked('');
 try{
   const q=parseGraph(raw);tryState={state:'plotted',q,raw:q.raw,low:null,high:null,cursor:null,error:null};input.value=q.raw;
   tell('');showAnswer('');drawTry(focus);
 }
 catch(e){
   tryState={state:'entry',q:null,raw:input.value,low:null,high:null,cursor:null,error:null};
   drawTry(false);tell(e.message);showAnswer('');return false;
 }return true;
}
form.addEventListener('submit',e=>{e.preventDefault();loadTry(input.value,true)});
lcd.addEventListener('pointermove',e=>{
 const s=tryState;
 if(mode!=='try'||!['lower','upper'].includes(s.state)||e.pointerType==='touch')return;
 const r=lcd.querySelector('canvas').getBoundingClientRect();
 s.cursor=pointAt(s.q,clamp((e.clientX-r.left)/r.width*320,10,310));render.draw(s);
});
lcd.addEventListener('click',e=>{
 const s=tryState;
 if(mode!=='try'||!['lower','upper'].includes(s.state))return;
 const r=lcd.querySelector('canvas').getBoundingClientRect(), x=(e.clientX-r.left)/r.width*320, y=(e.clientY-r.top)/r.height*240;
 if(x>=10&&x<=310&&y>=20&&y<226)setBound(Number(pointAt(s.q,x).toFixed(4)))
});
let firstKeyEdit=true;
function handleHandheld(key){
 if(mode!=='try')return;
 const k=String(key).toLowerCase(); const s=tryState;
 if(k==='home'||k==='scratchpad'){location.assign('scratchpad/index.html');return}
 if(k==='menu'){if(s.q)state('menu',false);else tell('Plot your function first.');return}
 if(k==='esc'){
   if(s.state==='menu')state('plotted',false);
   else if(s.state==='submenu')state('menu',false);
   else if(s.q)state('plotted',false);return;
 }
 if(k==='tab'){
   tryState={state:'entry',q:null,raw:input.value,low:null,high:null,cursor:null,error:null};
   firstKeyEdit=false;checked('');drawTry(true);return;
 }
 if(s.state==='menu'&&(k==='6'||k==='enter'||k==='right')){state('submenu',false);return}
 if(s.state==='submenu'&&(k==='2'||k==='enter'||k==='right')){s.cursor=s.q.x;state('lower',false);return}
 if(s.state==='lower'||s.state==='upper'){
   if(k==='left'||k==='right'){
     const w=windowFor(s.q), direction=k==='left'?-1:1;
     s.cursor=clamp((s.cursor??s.q.x)+direction*w.h/10,w.x0,w.x1);
     render.draw(s);return;
   }
   if(k==='enter'||k==='click'||k==='select'){setBound(Number((s.cursor??s.q.x).toFixed(5)));return}
   return;
 }
 if(s.state==='result'&&k==='enter'){if(s.extremum)pinMinimum();else loadTry(input.value,false);return}
 if(k==='enter'){loadTry(input.value,false);return}
 const t=window.HandheldTransport;
 if(t&&(t.character(k)!==null||k==='del')){
   if(s.state==='menu'||s.state==='submenu')return;
   const newEntry=s.state!=='entry'||firstKeyEdit&&input.value===assignedRaw;firstKeyEdit=false;
   if(t.modify(input,k,{replace:newEntry})){
     tryState={state:'entry',q:null,raw:input.value,low:null,high:null,cursor:null,error:null};
     drawTry(false);
   }
 }
}
function syncTask(){
 let same=false;
 try{
  const graph=tryState.q||parseGraph(tryState.raw);
  if(!assigned.general&&!graph.general)same=['a','b','c'].every(k=>Math.abs(assigned[k]-graph[k])<1e-10*Math.max(1,Math.abs(assigned[k])));
  else same=graph.raw.replace(/\s+/g,'').replace(/−/g,'-')===assignedRaw.replace(/\s+/g,'').replace(/−/g,'-');
 }catch{}
 $('answer-form').hidden=!same;$('custom-task').hidden=same;
}
const readNumber=raw=>{
 const str=raw.trim().replace('−','-');
 return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[Ee][+-]?\d+)?$/.test(str)?Number(str):NaN;
};
const matches=(val,n)=>Number.isFinite(val)&&(Math.abs(val-n)<=1e-8*Math.max(1,Math.abs(n))||val===Number(n.toPrecision(6)));
function checked(message,type){
 const box=$('check-feedback');box.hidden=!message;box.textContent=message;box.dataset.kind=type||'';
}
$('answer-form').addEventListener('submit',e=>{
 e.preventDefault();if(e.currentTarget.hidden)return;
 if(!tryState.extremum||tryState.state!=='result'){checked('Use Minimum to find a point between your bounds before checking.','hint');return;}
 const required=validLinked?tryState.extremum:exercise;
 const x=readNumber($('answer-x').value),y=readNumber($('answer-y').value);
 if(matches(x,required.x)&&matches(y,required.y)){
  checked(validLinked?'Correct. The first value is the x-coordinate; the second is the function value.':
   'Correct. Start 2 hours after sunrise. The least daily energy use is 5 kWh.','right');
 }else if(matches(x,required.y)&&matches(y,required.x))checked('The coordinates are reversed. Read the timing (x) first, then the minimum value.','wrong');
 else checked('Not quite. Compare both entries with the coordinates on your calculator screen.','wrong');
});
$('answer-form').addEventListener('input',()=>checked(''));
$('reset-try').addEventListener('click',()=>{
 tryState=emptyTry();input.value=assignedRaw;firstKeyEdit=true;
 for(const id of ['answer-x','answer-y'])$(id).value='';
 tell('');showAnswer('');checked('');drawTry();lcd.focus({preventScroll:true});
});
const shell=CalculatorLessonHandset.mount(host,{screen:lcd,label:'TI-Nspire CX II-T Graphs',onKey:(key)=>{
 handleHandheld(key);
 if(document.activeElement!==input)lcd.focus({preventScroll:true});
}});
document.addEventListener('keydown',e=>{
 if(mode!=='try'||(e.ctrlKey||e.altKey||e.metaKey)||e.target.closest?.('input,select,textarea,a,summary,[contenteditable],.lw-mode,.ct12-check'))return;
 if(!host.contains(e.target)&&e.target!==document.body)return;
 if(e.target.closest?.('button')&&['Enter',' '].includes(e.key))return;
 const key=e.key.toLowerCase()==='m'?'menu':shell.keyId(e.key);
 if(!key||e.key==='Tab')return;
 e.preventDefault();handleHandheld(key);
});
input.addEventListener('input',()=>{
 if(mode==='try'&&tryState.state==='entry'){tryState.raw=input.value;firstKeyEdit=false;render.draw(tryState);syncTask();checked('');}
});
$('watch-transcript').addEventListener('toggle',async()=>{
 const out=$('transcript');if(!$('watch-transcript').open||out.dataset.loaded)return;
 out.dataset.loaded='true';
 try{const r=await fetch('paperclip-audio/lessons/CT12.txt');if(!r.ok)throw Error();out.textContent=(await r.text()).trim().replace(/\n/g,' ');}
 catch{out.textContent='Transcript unavailable. Spoken captions are available in Watch.';delete out.dataset.loaded;}
});
window.CalculatorLessonAdapter={
 initialMode,
 renderWatch,
 enterTry(){
  const fromModeButton=document.activeElement?.closest('.lw-mode');
  mode='try';tryStage.hidden=false;$('try-device').append(host);host.hidden=false;
  shell.setInteractive(true);drawTry();
  if(fromModeButton)lcd.focus({preventScroll:true});
  if(firstVisit&&linkedRaw&&!validLinked)tell('The linked expression could not be loaded. Use the original exercise or enter your own function.');
  firstVisit=false;
 },
 exitTry(){
  mode='watch';tryStage.hidden=true;lastFrame='';
  shell.setInteractive(false);
 }
};
