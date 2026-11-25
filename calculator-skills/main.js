import {EXAMPLE,clamp,displayExpr,parseQuadratic,parseGraph,graphMinimum,pretty,windowFor} from './model.js';
import {screen,PANEL,pointAt} from './screen.js';

const $=id=>document.getElementById(id);
const DURATION=35.788;
const captions=[
 [0,'On a Graphs page, enter the function you want to investigate and press Enter.'],
 [5.22,'Open Menu, choose Analyze Graph, and select Minimum.'],
 [10.02,'We’re looking for the lowest point in the interval you choose.'],
 [13.51,'To set the lower bound, move the cursor to the left of the minimum, then press Enter.'],
 [19.13,'For the upper bound, move to the right of the minimum and press Enter again.'],
 [23.96,'Bracket just one turning point. The calculator marks the minimum and shows its coordinates.'],
 [30.33,'The x-coordinate tells you where it occurs. The y-coordinate is the minimum value.']
];
const beats={
 entry:['01','Plot the function','Start on a Graphs page.'],
 plotted:['01','Plot the function','Press Enter to draw the graph.'],
 menu:['02','Find Minimum in the menu','Open Analyze Graph.'],
 submenu:['02','Find Minimum in the menu','Choose 2: Minimum.'],
 lower:['03','Set the lower bound','Place it to the left of the valley.'],
 upper:['04','Set the upper bound','Place it to the right of the valley.'],
 result:['05','Read the minimum','The selected interval should contain one minimum.'],
 notes:['06','Use both coordinates','x is where it occurs. y is the minimum value.']
};
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
let context=preset?.name||queryRef;
let preloadExpr=fromQuery||preset?.expr||'';
const watchQ=parseQuadratic(EXAMPLE);
let formulaOk=true;
try{if(preloadExpr)parseGraph(preloadExpr)}catch{formulaOk=false}
const contextEl=$('context');
if(context||preloadExpr){contextEl.textContent=context||'Linked practice';contextEl.hidden=false}
if(validSource||queryRef){const a=$('return-question');a.href=validSource||BANK;a.hidden=false;a.textContent='Back to '+bankName+' ↗'}
$('example-expr').textContent=displayExpr(watchQ.raw);
$('transcript').textContent=captions.map(c=>c[1]).join(' ');
const render=screen($('drawing'));
const lcd=$('lcd');
lcd.dataset.renderer=render.backend;
const modeButtons=[...document.querySelectorAll('[data-mode]')];
const audio=$('voice');
const seek=$('seek');
const play=$('play');
const caption=$('caption');
const cc=$('captions');
let duration=DURATION, mode=p.get('mode')==='try'?'try':'watch', tryState={state:'entry',q:null,raw:preloadExpr||'2(x+1)^2-3',low:null,high:null,cursor:null,error:null};
let playing=false, time=0, raf=0, captionsOn=false, useSilent=false, silentStart=0, frameAt=0, lastBeat='',pendingSeek=null;
let initialUpdate=true;
const initialNoAudio=()=>audio.error!=null;
const dots=(v)=>[...String(v)].filter(a=>a!==' ');
const audioSync=(t)=>{
 if(!useSilent&&Number.isFinite(audio.duration)){ try{audio.currentTime=t;}catch{pendingSeek=t} }
 else {pendingSeek=t;}
};

function onBeat(state,keyList,tip=''){
 const [n,title,defaultTip]=beats[state];
 let index=state+'|'+keyList.join('|')+'|'+tip;
 if(lastBeat===index)return;lastBeat=index;
 $('beat-number').textContent=n;$('beat-title').textContent=title;$('beat-tip').textContent=tip||defaultTip;
 $('keys').replaceChildren(...keyList.map(k=>{const a=document.createElement('kbd');a.className='key';a.textContent=k;return a}));
 $('keypress').hidden=!keyList.length;
}
const fmtTime=t=>{const r=Math.max(0,Math.round(t));return Math.floor(r/60)+':'+String(r%60).padStart(2,'0')};
function frame(t){
 const q=watchQ, raw=q.raw, tran=(a,b)=>clamp((t-a)/(b-a),0,1);
 const r=windowFor(q), lo=q.x-r.h*.29,hi=q.x+r.h*.34;
 if(t<4.78){
   const f=tran(.55,3.9),n=Math.floor(f*raw.length)+1;
   return {state:'entry',q:null,raw:t<.5?'':raw.slice(0,n),keys:t<.5?[]:[...dots(displayExpr(raw.slice(0,n)))].slice(-4)};
 }
 if(t<5.49)return {state:'plotted',q,raw,keys:['enter']};
 if(t<7.35)return {state:'menu',q,raw,keys:['menu']};
 if(t<9.18)return {state:'submenu',q,raw,keys:['menu','6']};
 if(t<18.02){const s=tran(14.1,17.48);return {state:'lower',q,raw,cursor:q.x+(lo-q.x)*s,keys:t<14.2?['menu','6','2']:['←']}}
 if(t<23.35){const s=tran(19.5,22.55);return {state:'upper',q,raw,low:lo,cursor:lo+(hi-lo)*s,keys:t<19.45?['enter']:['→']}}
 if(t<30.33)return {state:'result',q,raw,low:lo,high:hi,keys:t<24.4?['enter']:[]};
 return {state:'result',phase:'notes',q,raw,low:lo,high:hi,keys:[]};
}
function drawWatch(t){
 const f=frame(t);
 const recent=window.HandheldKeyCues?.CT12?.filter(e=>t*1000>=e.timeMs&&typeof e.rawAfter==='string').at(-1);
 if(recent&&f.state==='entry')f.raw=recent.rawAfter;
 window.HandheldTransport?.lightAt(shell,'CT12',t);
 render.draw(f);onBeat(f.phase||f.state,f.keys);
 const s=captions.findLast(c=>c[0]<=t)?.[1]||'';
 if(caption.textContent!==s)caption.textContent=s;
 caption.hidden=!captionsOn;
 seek.value=t;
 seek.setAttribute('aria-valuetext',fmtTime(t)+' of '+fmtTime(duration));
 $('time').textContent=fmtTime(t)+' / '+fmtTime(duration);
}
function animate(now){
 if(!playing||mode!=='watch')return;
 if(now-frameAt>29){
   frameAt=now;
   time=useSilent?clamp((now-silentStart)/1000,0,duration):audio.currentTime;
   drawWatch(time);
   if(time>=duration-.012){onEnded();return}
 }
 raf=requestAnimationFrame(animate);
}
function showPlaying(v){
 playing=v;play.setAttribute('aria-label',v?'Pause':'Play');
 play.querySelector('.play-icon').hidden=v;
 play.querySelector('.pause-icon').hidden=!v;
 cancelAnimationFrame(raf);if(v)raf=requestAnimationFrame(animate);
}
function stop(){audio.pause();showPlaying(false)}
function onEnded(){time=duration;stop();if(mode==='watch')drawWatch(time)}
audio.addEventListener('ended',onEnded);
audio.addEventListener('pause',()=>{if(!useSilent&&playing){time=audio.currentTime;showPlaying(false);if(mode==='watch')drawWatch(time)}});
audio.addEventListener('loadedmetadata',()=>{
 duration=Number.isFinite(audio.duration)?audio.duration:DURATION;seek.max=duration;
 if(pendingSeek!==null){audio.currentTime=clamp(pendingSeek,0,duration);pendingSeek=null;}
 if(mode==='watch')drawWatch(time);
});
audio.addEventListener('error',()=>{
 if(!initialNoAudio())return;
 useSilent=true;silentStart=performance.now()-time*1000;
 $('audio-notice').textContent='The narration could not load. Captions and visual playback are available.';
 if(!captionsOn){captionsOn=true;cc.setAttribute('aria-pressed','true');cc.setAttribute('aria-label','Hide captions');}
 if(mode==='watch')drawWatch(time);
});
play.addEventListener('click',async()=>{
 if(mode!=='watch')return;
 if(playing){stop();return}
 if(time>=duration-.04)time=0;
 if(useSilent||initialNoAudio()){
   useSilent=true;silentStart=performance.now()-time*1000;showPlaying(true);return;
 }
 audioSync(time);
 try {await audio.play();if(mode==='watch'){showPlaying(true)}else audio.pause()}
 catch(err){
   if(err.name==='AbortError')return;
   useSilent=true;silentStart=performance.now()-time*1000;captionsOn=true;caption.hidden=false;cc.setAttribute('aria-pressed','true');cc.setAttribute('aria-label','Hide captions');
   $('audio-notice').textContent='Narration is unavailable. Showing the captioned walkthrough.';
   if(mode==='watch')showPlaying(true);
 }
});
seek.addEventListener('input',()=>{
 time=clamp(Number(seek.value),0,duration);
 if(useSilent){silentStart=performance.now()-time*1000;}else audioSync(time);
 if(mode==='watch')drawWatch(time)
});
cc.addEventListener('click',()=>{
 captionsOn=!captionsOn;cc.setAttribute('aria-pressed',String(captionsOn));cc.setAttribute('aria-label',captionsOn?'Hide captions':'Show captions');
 if(mode==='watch')drawWatch(time)
});
$('download-video').hidden=false;

const hotspots=$('hotspots'), form=$('expression-form'), input=$('expression'), work=$('try-work'), feedback=$('feedback'), answer=$('answer');
input.value=tryState.raw;
const tell=(msg)=>{feedback.textContent=msg||'';feedback.hidden=!msg};
const showAnswer=(msg)=>{answer.textContent=msg||'';answer.hidden=!msg};
function helpButton(text,handler,solid=false){
 const b=document.createElement('button');b.type='button';b.textContent=text;b.className=solid?'solid':'quiet';b.addEventListener('click',handler);return b;
}
function addHotspot(panel,i,callback){
 const h=document.createElement('button');h.type='button';h.className='hot';h.setAttribute('aria-label',panel.rows[i]);h.style.left=(panel.x/320*100)+'%';h.style.top=((panel.y+2+i*panel.h)/240*100)+'%';h.style.width=(panel.w/320*100)+'%';h.style.height=(panel.h/240*100)+'%';
 h.addEventListener('click',e=>{e.stopPropagation();callback()});hotspots.append(h);
}
function state(next,focus=true){tryState.state=next;tryState.error=null;tell('');showAnswer('');drawTry(focus);}
function restart(focus=true){tryState.low=tryState.high=tryState.cursor=null;state('plotted',focus);}
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
   s.error=!result.ok;
   if(result.ok)state('result');else{s.state='result';drawTry(false);}
   if(!result.ok){s.error=result.message;render.draw({...s,error:true});tell(result.message);}
   else showAnswer('Minimum value: '+pretty(result.y)+', at x = '+pretty(result.x)+'.');
 }
}
function drawTry(focus=false){
 const s=tryState;
 render.draw(s);lastBeat='';
 const keys={entry:[],plotted:['enter'],menu:['menu'],submenu:['menu','6'],lower:['menu','6','2'],upper:['enter'],result:['enter']};
 onBeat(s.state,keys[s.state],s.state==='entry'?'Enter a function below or use the handheld keypad, then press enter.':s.state==='lower'?'Tap the graph to the left of the valley, or enter x below.':s.state==='upper'?'Tap to the right of the valley, or enter x below.':s.state==='plotted'?'Open the calculator’s Menu.':'');
 hotspots.replaceChildren();work.replaceChildren();work.hidden=s.state==='entry';
 lcd.classList.toggle('pick',s.state==='lower'||s.state==='upper');
 if(s.state==='entry'){if(focus)input.focus({preventScroll:true});return}
 const row=document.createElement('div');row.className='inputrow';work.append(row);
 if(s.state==='plotted')row.append(helpButton('menu',()=>state('menu'),true));
 if(s.state==='menu'){
   const go=()=>state('submenu');
   row.append(helpButton('6: Analyze Graph',go,true));
   addHotspot(PANEL.main,5,go)
 }
 if(s.state==='submenu'){
   const go=()=>{s.cursor=s.q.x;state('lower')};
   row.append(helpButton('2: Minimum',go,true));addHotspot(PANEL.sub,1,go);
 }
 if(s.state==='lower'||s.state==='upper'){
   const text=s.state==='lower'?'Lower bound x':'Upper bound x';
   const lab=document.createElement('label');lab.textContent=text;lab.htmlFor='bound';work.prepend(lab);
   const boundForm=document.createElement('form');boundForm.className='inputrow';row.replaceWith(boundForm);
   const x=document.createElement('input');x.id='bound';x.type='number';x.step='any';x.required=true;x.inputMode='decimal';
   const b=document.createElement('button');b.type='submit';b.textContent='Enter';b.className='solid';
   boundForm.append(x,b);boundForm.addEventListener('submit',e=>{e.preventDefault();setBound(x.valueAsNumber)});
   if(s.state==='upper'){const hint=document.createElement('small');hint.textContent='Lower bound: '+pretty(s.low);work.append(hint)}
   if(focus&&matchMedia('(pointer:fine)').matches)x.focus({preventScroll:true});
   return;
 }
 if(s.state==='result')row.append(helpButton('Try new bounds',()=>{s.low=s.high=null;s.cursor=s.q.x;state('lower')},true));
 if(s.state==='menu'||s.state==='submenu')row.append(helpButton('Esc',()=>state(s.state==='submenu'?'menu':'plotted')));
 if(focus)row.querySelector('button')?.focus({preventScroll:true});
}
function loadTry(raw,focus=false){
 try{
   const q=parseGraph(raw);tryState={state:'plotted',q,raw:q.raw,low:null,high:null,cursor:null,error:null};input.value=q.raw;
   tell('');showAnswer('');drawTry(focus);
 }
 catch(e){
   tryState={state:'entry',q:null,raw:'',low:null,high:null,cursor:null,error:null};
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
function setMode(m){
 if(!initialUpdate&&mode===m)return;
 initialUpdate=false;mode=m;lastBeat='';stop();
 document.body.dataset.cxMode=m;shell?.setKeys([]);shell?.setInteractive(m==='try');$('take-over').hidden=m!=='watch';
 modeButtons.forEach(b=>{let yes=b.dataset.mode===m;b.classList.toggle('active',yes);b.setAttribute('aria-pressed',String(yes));});
 $('watch-controls').hidden=m!=='watch';$('practice').hidden=m!=='try';
 if(m==='watch'){hotspots.replaceChildren();lcd.classList.remove('pick');drawWatch(time);}
 else{
   caption.hidden=true;
   if(tryState.state==='entry'&&preloadExpr&&formulaOk)loadTry(preloadExpr);
   else {drawTry();if(preloadExpr&&!formulaOk)tell('The linked expression could not be loaded. Edit it or enter your own function.');}
 }
}
let firstKeyEdit=true;
function handleHandheld(key){
 if(mode!=='try')return;
 const k=String(key).toLowerCase(); const s=tryState;
 if(k==='home'||k==='scratchpad'){location.assign('handheld/index.html');return}
 if(k==='menu'&&s.q){state('menu',false);return}
 if(k==='esc'){
   if(s.state==='menu')state('plotted',false);
   else if(s.state==='submenu')state('menu',false);
   else if(s.q)state('plotted',false);return;
 }
 if(k==='tab'){
   tryState={state:'entry',q:null,raw:input.value,low:null,high:null,cursor:null,error:null};
   firstKeyEdit=false;drawTry(false);return;
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
 if(k==='enter'){loadTry(input.value,false);return}
 const t=window.HandheldTransport;
 if(t?.character(k)!==null||k==='del'){
   if(s.state==='menu'||s.state==='submenu')return;
   const newEntry=s.state!=='entry'||firstKeyEdit;firstKeyEdit=false;
   if(t.modify(input,k,{replace:newEntry})){
     tryState={state:'entry',q:null,raw:input.value,low:null,high:null,cursor:null,error:null};
     drawTry(false);
   }
 }
}
const shell=window.HandheldShell?.mount({screen:lcd,host:lcd.closest('.lcd-group'),label:'TI-Nspire CX II-T Graphs',onKey:handleHandheld});
window.HandheldTransport?.controls({container:$('watch-controls'),play,seek,active:()=>mode==='watch'});
input.addEventListener('input',()=>{if(mode==='try'&&tryState.state==='entry'){tryState.raw=input.value;render.draw(tryState)}});
$('take-over').addEventListener('click',()=>{
 const empty=tryState.state==='entry'&&!preloadExpr&&firstKeyEdit;
 setMode('try');
 if(empty){loadTry(watchQ.raw,false);tell('Watch is paused at your place. Press menu to explore this graph, or type a new function.');}
});
modeButtons.forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
setMode(mode);
const theme=$('theme');let themeChoice='auto';
try{themeChoice=localStorage.getItem('ti-lab-theme')||'auto'}catch{}
theme.value=themeChoice;const dark=matchMedia('(prefers-color-scheme: dark)');
function updateTheme(){document.documentElement.dataset.theme=themeChoice==='auto'?(dark.matches?'dark':'light'):themeChoice}
theme.addEventListener('change',()=>{themeChoice=theme.value;try{localStorage.setItem('ti-lab-theme',themeChoice)}catch{}updateTheme()});dark.addEventListener?.('change',updateTheme);updateTheme();
