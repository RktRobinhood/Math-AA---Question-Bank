import {EXAMPLE,clamp,displayExpr,parseQuadratic,parseGraph,graphMinimum,pretty,windowFor} from './model.js';
import {screen,PANEL,pointAt} from './screen.js';

const $=id=>document.getElementById(id);
const DURATION=35.788;
const spokenCues=[
 [0,'On a Graphs page, enter the function you want to investigate and press Enter.'],
 [5.22,'Open Menu, choose Analyze Graph, and select Minimum.'],
 [10.02,'We’re looking for the lowest point in the interval you choose.'],
 [13.51,'To set the lower bound, move the cursor to the left of the minimum, then press Enter.'],
 [19.13,'For the upper bound, move to the right of the minimum and press Enter again.'],
 [23.96,'Bracket just one turning point.'],
 [26.67,'The calculator marks the minimum and shows its coordinates.'],
 [30.33,'The x-coordinate tells you where it occurs.'],
 [33.22,'The y-coordinate is the minimum value.']
];
const beats={
 entry:['01','Plot the function','Start on a Graphs page.'],
 plotted:['01','Plot the function','Press Enter to draw the graph.'],
 menu:['02','Find Minimum in the menu','Open Analyze Graph.'],
 submenu:['02','Find Minimum in the menu','Choose 2: Minimum.'],
 lower:['03','Set the lower bound','Place it to the left of the valley.'],
 upper:['04','Set the upper bound','Place it to the right of the valley.'],
 preview:['05','Preview the minimum','The turning point is (3, 4). Press Enter again to pin it.'],
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
$('transcript').textContent=spokenCues.map(c=>c[1]).join(' ');
const render=screen($('drawing'));
const lcd=$('lcd');
lcd.dataset.renderer=render.backend;
const stage=$('stage');
const modeButtons=[...document.querySelectorAll('[data-mode]')];
const audio=$('narration');
const seek=$('seek');
const play=$('play');
const cap=$('caption');
let mode=p.get('mode')==='try'?'try':'watch', tryState={state:'entry',q:null,raw:preloadExpr||'2(x+1)^2-3',low:null,high:null,cursor:null,error:null};
let t=0,duration=DURATION,playing=false,pending=false,raf=0,origin=0,useAudio=audio.hasAttribute('src'),playEpoch=0,lastWatchStamp='';
let initialUpdate=true,lastBeat='';
const ordinaryTape=window.HandheldKeyCues.CT12;
// The original recording needs only the preview. This final Enter models the optional pin step without changing its words.
const tape=[...ordinaryTape,{timeMs:27430,key:'enter',durationMs:230,state:'pinned'}];
const readable={x:'x',square:'x²',enter:'Enter',minus:'−',plus:'+',menu:'Menu',left:'←',right:'→'};
 const surface=$("workspace"),overlay=$("play-feedback"),cc=$("cc"),speedSelect=$("play-rate");
 const framingKey="qb-calculator-watch-frame";
 const readFrame=()=>{try{return localStorage.getItem(framingKey)==="full"?"full":"screen";}catch{return "screen";}};
 let framing=readFrame(),speed=Number(speedSelect.value),showCaptions=false,initiated=false,pendingSeek=null;
 audio.playbackRate=speed;audio.preservesPitch=true;
 const chrome=CalculatorWatchPlayer.mount({player:stage,surface,play,seek,expand:$("fullscreen"),feedback:overlay,active:()=>mode==="watch"});
 function paintFraming(){
  stage.classList.toggle("ct12-screen-view",mode==="watch"&&framing==="screen");
  $("view-full").setAttribute("aria-pressed",String(framing==="full"));
  $("view-screen").setAttribute("aria-pressed",String(framing==="screen"));
  fitBankWatch();
 }
 function chooseFrame(value){
  framing=value;try{localStorage.setItem(framingKey,value);}catch{}
  paintFraming();
 }
 $("view-full").addEventListener("click",()=>chooseFrame("full"));
 $("view-screen").addEventListener("click",()=>chooseFrame("screen"));
 window.addEventListener("storage",e=>{if(e.key===null||e.key===framingKey){framing=readFrame();paintFraming();}});
 function captions(value){
  showCaptions=value;cc.setAttribute("aria-pressed",String(value));
  cc.setAttribute("aria-label",value?"Hide captions":"Show captions");
  $("caption-band").hidden=mode!=="watch"||!value;
  fitBankWatch();
 }
 cc.addEventListener("click",()=>captions(!showCaptions));
function onBeat(state,tip=''){
 const [n,title,defaultTip]=beats[state];
 let index=state+'|'+tip;
 if(lastBeat===index)return;lastBeat=index;
 $('beat-number').textContent=n;$('beat-title').textContent=title;$('beat-tip').textContent=tip||defaultTip;
}
const fmtTime=value=>{
 const n=Math.max(0,Math.floor(value));return Math.floor(n/60)+':'+String(n%60).padStart(2,'0');
};
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
 const ghost=t<27.43;
 return {state:'result',phase:ghost?'preview':t<30.33?'result':'notes',q,raw,low:lo,high:hi,ghost};
}
function labelGraph(f){
 const pair=f.state==='result'&&!f.error&&f.q?f.extremum||f.q:null;
 let step=f.state==='menu'?'Graphs Menu':f.state==='submenu'?'6: Analyze Graph. 2: Minimum.':f.state==='lower'?'lower bound?':f.state==='upper'?'upper bound?':pair?(f.ghost?'Minimum preview ':'Minimum ')+ '('+pretty(pair.x)+', '+pretty(pair.y)+')':'';
 $('lcd-text').textContent=[f.raw?'f₁(x) = '+displayExpr(f.raw):'',step].filter(Boolean).join('. ');
}
function renderWatch(){
 if(mode!=='watch')return;
 const f=frame(t),now=t*1000;
 const last=tape.findLast(e=>now>=e.timeMs),key=last&&now<last.timeMs+Math.max(last.durationMs??500,230)?last.key:'';
 const timeLabel=fmtTime(t>=duration-.015?Math.round(duration):t)+' / '+fmtTime(Math.round(duration));
 seek.value=t;seek.setAttribute('aria-valuetext',timeLabel.replace('/','of'));$('clock').textContent=timeLabel;
 shell?.setKeys(key?[key]:[]);
 $('key-strip').hidden=!last;
 $('active-key').textContent=last?.state==='pinned'?'Enter · pin':readable[last?.key]||last?.key||'';
 if(!initiated){overlay.dataset.initial='true';overlay.hidden=t>.04;}
 const line=spokenCues.findLast(c=>c[0]<=t)?.[1]||'';
 if(cap.textContent!==line)cap.textContent=line;
 const stamp=JSON.stringify([f.state,f.phase,f.raw,f.cursor]);
 if(stamp!==lastWatchStamp){
   lastWatchStamp=stamp;render.draw(f);labelGraph(f);onBeat(f.phase||f.state);
 }
 lcd.dataset.renderer=render.backend;
}
 function setOrigin(){origin=performance.now()-t*1000/speed;}
 function audioSeek(){
  if(!useAudio)return;
  if(Number.isFinite(audio.duration)){audio.currentTime=t;pendingSeek=null;}
  else pendingSeek=t;
 }
 function go(v){
  t=clamp(Number(v)||0,0,duration);setOrigin();audioSeek();renderWatch();if(!playing)labelPlay();
 }
 function labelPlay(){
  const monitor=playing||pending,label=monitor?"Pause":t>=duration-.015?"Replay":"Play";
  play.setAttribute("aria-label",label);play.title=label;play.dataset.playing=String(playing);
  play.querySelector(".play-icon").hidden=monitor;play.querySelector(".pause-icon").hidden=!monitor;
 }
 function pause(){
  playEpoch++;pending=false;if(playing&&useAudio&&Number.isFinite(audio.currentTime))t=audio.currentTime;
  playing=false;audio.pause();cancelAnimationFrame(raf);labelPlay();renderWatch();
 }
 function finish(){pause();t=duration;labelPlay();renderWatch();}
 function tick(now){
  if(!playing||mode!=="watch")return;
  t=useAudio?audio.currentTime:(now-origin)*speed/1000;
  if(t>=duration-.002){finish();return;}
  renderWatch();raf=requestAnimationFrame(tick);
 }
 async function start(){
  if(mode!=="watch")return;
  initiated=true;overlay.dataset.initial="false";overlay.hidden=true;
  if(t>=duration-.015)go(0);
  const stamp=++playEpoch;
  pending=true;setOrigin();labelPlay();
  if(useAudio){
   try{audioSeek();await audio.play();}
   catch(error){if(stamp!==playEpoch)return;silentMedia();}
  }
  if(stamp!==playEpoch||mode!=="watch"){if(!playing&&!pending)audio.pause();return;}
  if(!useAudio)setOrigin();
  pending=false;playing=true;labelPlay();chrome.flash(true);raf=requestAnimationFrame(tick);
 }
 function toggle(){if(playing||pending){pause();chrome.flash(false);}else void start();}
 function silentMedia(){
  useAudio=false;pendingSeek=null;setOrigin();
  $("media-status").textContent="Narration unavailable. Captions only.";
  $("media-status").hidden=mode!=="watch";$("sound").hidden=true;
  captions(true);
 }
 audio.addEventListener("loadedmetadata",()=>{
  if(!useAudio||!Number.isFinite(audio.duration)||audio.duration<=0)return;
  duration=audio.duration;seek.max=duration;t=clamp(t,0,duration);
  if(pendingSeek!==null)audioSeek();
  renderWatch();labelPlay();
 });
 audio.addEventListener("error",silentMedia);audio.addEventListener("ended",finish);
 audio.addEventListener("pause",()=>{if(useAudio&&playing&&audio.paused&&!audio.ended)pause();});
 $("sound").addEventListener("click",()=>{
  audio.muted=!audio.muted;const label=audio.muted?"Unmute narration":"Mute narration";
  $("sound").setAttribute("aria-pressed",String(audio.muted));$("sound").setAttribute("aria-label",label);$("sound").title=label;
 });
 speedSelect.addEventListener("change",()=>{
  if(playing&&!useAudio)t=clamp((performance.now()-origin)*speed/1000,0,duration);
  speed=Number(speedSelect.value);audio.playbackRate=speed;setOrigin();
 });
 play.addEventListener("click",toggle);seek.addEventListener("input",()=>go(seek.value));

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
 render.draw(s);labelGraph(s);lastBeat='';
 onBeat(s.ghost&&s.state==='result'?'preview':s.state,s.ghost&&s.state==='result'?'Press Enter to pin these coordinates.':s.state==='entry'?'Enter a function below or use the handheld keypad, then press enter.':s.state==='lower'?'Tap the graph to the left of the valley, or enter x below.':s.state==='upper'?'Tap to the right of the valley, or enter x below.':s.state==='plotted'?'Open the calculator’s Menu.':'');
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
 if(s.state==='result'){
   if(s.extremum){
     showAnswer('Minimum value: '+pretty(s.extremum.y)+', at x = '+pretty(s.extremum.x)+'.'+(s.ghost?' Press Enter to pin.':''));
     if(s.ghost)row.append(helpButton('Pin minimum',pinMinimum,true));
   }
   row.append(helpButton('Try new bounds',()=>{s.low=s.high=s.extremum=null;s.ghost=false;s.cursor=s.q.x;state('lower')},!s.ghost));
 }
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
 pause();initialUpdate=false;mode=m;lastBeat='';lastWatchStamp='';
 document.body.dataset.cxMode=m;stage.dataset.watchMode=m;
 shell?.setKeys([]);shell?.setInteractive(m==='try');
 if(m==='try'){void chrome.exit();chrome.clear();$('key-strip').hidden=true;}
 modeButtons.forEach(b=>{let yes=b.dataset.mode===m;b.classList.toggle('active',yes);b.setAttribute('aria-pressed',String(yes));});
 $('watch-player').hidden=m!=='watch';$('practice').hidden=m!=='try';
 $('media-status').hidden=useAudio||m!=='watch';
 paintFraming();captions(showCaptions);
 if(m==='watch'){hotspots.replaceChildren();lcd.classList.remove('pick');renderWatch();}
 else{
   if(tryState.state==='entry'&&preloadExpr&&formulaOk)loadTry(preloadExpr);
   else {drawTry();if(preloadExpr&&!formulaOk)tell('The linked expression could not be loaded. Edit it or enter your own function.');}
 }
}
let firstKeyEdit=true;
function handleHandheld(key){
 if(mode!=='try')return;
 const k=String(key).toLowerCase(); const s=tryState;
 if(k==='home'||k==='scratchpad'){location.assign('scratchpad/index.html');return}
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
 if(s.state==='result'&&k==='enter'){if(s.extremum)pinMinimum();else loadTry(input.value,false);return}
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
input.addEventListener('input',()=>{if(mode==='try'&&tryState.state==='entry'){tryState.raw=input.value;render.draw(tryState)}});
modeButtons.forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));

 function fitBankWatch(){
  if(mode!=="watch"||!shell?.body.offsetWidth)return;
  const full=document.fullscreenElement===stage||stage.classList.contains("watch-fullscreen-fallback");
  const nav=full?0:(document.querySelector(".tabbar")?.offsetHeight||0);
  const box=stage.getBoundingClientRect(),vh=window.visualViewport?.height||innerHeight;
  const occupied=$("watch-player").offsetHeight+$("caption-band").offsetHeight;
  const pads=getComputedStyle(surface);
  const room=vh-nav-(full?0:box.top+window.scrollY)-occupied-parseFloat(pads.paddingTop)-parseFloat(pads.paddingBottom)-3;
  stage.style.setProperty("--ct12-handset-fit",Math.floor(Math.max(innerHeight<680?78:101,Math.min(full?370:296,room*558/1168)))+"px");
  stage.style.setProperty("--ct12-lcd-fit",Math.floor(Math.max(142,Math.min(full?680:600,room*4/3)))+"px");
  stage.style.setProperty("--ct12-scene-room",Math.floor(Math.max(140,room))+"px");
 }
 const bankWatchSizing=new ResizeObserver(fitBankWatch);
 [$("watch-player"),$("caption-band"),document.querySelector("main>.title")].forEach(el=>bankWatchSizing.observe(el));
 window.addEventListener("resize",fitBankWatch);
 window.visualViewport?.addEventListener("resize",fitBankWatch);
 document.addEventListener("fullscreenchange",fitBankWatch);
 new MutationObserver(fitBankWatch).observe(stage,{attributes:true,attributeFilter:["class"]});
 setMode(mode);if(audio.error)silentMedia();
 fitBankWatch();
