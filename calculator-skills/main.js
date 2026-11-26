import {EXAMPLE,clamp,displayExpr,parseQuadratic,parseGraph,graphMinimum,pretty,windowFor} from './model.js';
import {screen,PANEL,pointAt} from './screen.js';

const $=id=>document.getElementById(id);
import {makeLayout,demoTime,tape,pin} from './minimum-watch-plan.js?v=2';
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
let layout=makeLayout(),t=0,duration=layout.duration,playing=false,pending=false,raf=0,origin=0,useAudio=audio.hasAttribute('src'),playEpoch=0,lastWatchStamp='',phase='',trailIndex=-2,chapterIndex=-1;
let initialUpdate=true,lastBeat='';
const holdNotes=[
 'Type the function, then press Enter.',
 'Open Menu → 6: Analyze Graph → 2: Minimum.',
 'Spot the valley you want to bracket.',
 'Move left of the valley, then press Enter.',
 'Move right of the valley, then press Enter.',
 'Check: the shaded interval contains one valley.',
 'Read the coordinates beside the marker.',
 'First coordinate: where the minimum occurs.',
 'Second coordinate: the minimum value.'
];
const readable={x:'x',square:'x²',enter:'Enter',minus:'−',plus:'+',menu:'Menu',left:'←',right:'→'};
// The chapter boundaries follow the existing teaching timeline; key rows
// are only a presentation of the existing immutable physical tape.
const chapters=[
 {span:0,name:'Plot the function',until:9},
 {span:1,name:'Find Minimum',until:12},
 {span:3,name:'Lower bound',until:14},
 {span:4,name:'Upper bound',until:16},
 {span:5,name:'Read result',until:17}
];
const keyA11y={square:'Squared',left:'Left arrow',right:'Right arrow',minus:'Minus',plus:'Plus'};
const chips=[];
const chapterButtons=chapters.map(({span,name,until},chapter)=>{
 const li=document.createElement('li'),button=document.createElement('button'),number=document.createElement('span');
 button.type='button';number.textContent=String(chapter+1).padStart(2,'0');number.setAttribute('aria-hidden','true');
 button.append(number,document.createTextNode(name));
 button.addEventListener('click',()=>seekWatch(layout.spans[span].start));
 const row=document.createElement('ol');row.className='ct12-trail-row';row.setAttribute('aria-label',name+' key presses');
 for(let i=chips.length;i<until;i++){
   const event=tape[i],item=document.createElement('li'),key=document.createElement('kbd');
   key.textContent=event===pin?'Enter*':readable[event.key]||event.key;
   key.setAttribute('aria-label',event===pin?'Optional: Enter to pin the label':keyA11y[event.key]||key.textContent);
   key.title=event===pin?'Optional: Enter to pin the label':event.note||'';
   item.append(key);row.append(item);chips.push({key,chapter});
 }
 if(tape[until-1]===pin){
   const pinNote=document.createElement('li');pinNote.className='ct12-pin-note';pinNote.textContent='optional';row.append(pinNote);
 }
 li.append(button,row);$('key-steps').append(li);
 return button;
});
 const surface=$("workspace"),overlay=$("play-feedback"),cc=$("cc"),speedSelect=$("play-rate");
 const framingKey="qb-calculator-watch-frame";
 const readFrame=()=>{try{return localStorage.getItem(framingKey)==="full"?"full":"screen";}catch{return "screen";}};
 let framing=readFrame(),showCaptions=false,initiated=false;
 seek.max=duration.toFixed(3);audio.playbackRate=1;audio.preservesPitch=true;
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
 const ghost=t<34;
 return {state:'result',phase:ghost?'preview':t<30.33?'result':'notes',q,raw,low:lo,high:hi,ghost};
}
function labelGraph(f){
 const pair=f.state==='result'&&!f.error&&f.q?f.extremum||f.q:null;
 let step=f.state==='menu'?'Graphs Menu':f.state==='submenu'?'6: Analyze Graph. 2: Minimum.':f.state==='lower'?'lower bound?':f.state==='upper'?'upper bound?':pair?(f.ghost?'Minimum preview ':'Minimum ')+ '('+pretty(pair.x)+', '+pretty(pair.y)+')':'';
 $('lcd-text').textContent=[f.raw?'f₁(x) = '+displayExpr(f.raw):'',step].filter(Boolean).join('. ');
}
function renderWatch(){
 if(mode!=='watch')return;
 const point=layout.at(t),demo=demoTime(point),f=frame(demo),now=demo*1000;
 const i=tape.findLastIndex(e=>now>=e.timeMs-.01),last=tape[i];
 const key=!point.speaking&&last&&now<last.timeMs+Math.max(last.durationMs??500,400)?last.key:'';
 const timeLabel=fmtTime(t>=duration-.015?Math.round(duration):t)+' / '+fmtTime(Math.round(duration));
 seek.value=t;seek.setAttribute('aria-valuetext',timeLabel.replace('/','of'));$('clock').textContent=timeLabel;
 shell?.setKeys(key?[key]:[]);
 const chapter=chapters.findLastIndex(c=>c.span<=point.span.i);
 if(i!==trailIndex||chapter!==chapterIndex){
   trailIndex=i;chapterIndex=chapter;
   chapterButtons.forEach((button,n)=>{
     if(n===chapter)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');
   });
   chips.forEach(({key,chapter:group},j)=>{
     const current=j===i&&group===chapter;
     key.dataset.progress=current?'current':j<=i?'done':'next';
     if(current)key.setAttribute('aria-current','true');else key.removeAttribute('aria-current');
   });
 }
 if(!initiated){overlay.dataset.initial='true';overlay.hidden=t>.04;}
 const line=point.speaking?spokenCues[point.span.i][1]:'';
 if(cap.textContent!==line)cap.textContent=line;
 $('caption-band').hidden=!showCaptions||!line;
 stage.dataset.phase=point.speaking?'voice':'hold';
 const hold=$('hold-note'),hint=point.speaking?'':point.span.i===8&&point.fraction>.36?'Enter again to pin the label (optional).':holdNotes[point.span.i];
 if(hold.textContent!==hint)hold.textContent=hint;
 const stamp=JSON.stringify([f.state,f.phase,f.raw,f.cursor,f.ghost]);
 if(stamp!==lastWatchStamp){
   lastWatchStamp=stamp;render.draw(f);labelGraph(f);onBeat(f.phase||f.state);
 }
 lcd.dataset.renderer=render.backend;
}
 function setOrigin(){origin=performance.now()-t*1000;}
 function labelPlay(){
  const monitor=playing||pending,label=monitor?'Pause':t>=duration-.015?'Replay':'Play';
  play.setAttribute('aria-label',label);play.title=label;play.dataset.playing=String(playing);
  play.querySelector('.play-icon').toggleAttribute('hidden',monitor);
  play.querySelector('.pause-icon').toggleAttribute('hidden',!monitor);
 }
 function pause(){
  playEpoch++;pending=false;playing=false;audio.pause();cancelAnimationFrame(raf);phase='';labelPlay();renderWatch();
 }
 function tick(now){
  if(!playing||mode!=='watch')return;
  const point=layout.at(t),span=point.span;
  if(phase==='voice'){
   t=useAudio?Math.min(span.voiceEnd,span.start+Math.max(0,audio.currentTime-span.from)):
     Math.min(span.voiceEnd,(now-origin)/1000);
   if(t>=span.voiceEnd-.012||useAudio&&audio.ended){audio.pause();t=span.voiceEnd;phase='hold';setOrigin();}
  }else{
   t=Math.min(span.end,(now-origin)/1000);
   if(t>=duration){t=duration;pause();return;}
   if(t>=span.end){
    const token=playEpoch;renderWatch();
    void enterPhase(token).then(ok=>{if(ok&&playing)raf=requestAnimationFrame(tick);});
    return;
   }
  }
  renderWatch();raf=requestAnimationFrame(tick);
 }
 async function enterPhase(token){
  const point=layout.at(t);setOrigin();phase=point.speaking?'voice':'hold';
  if(!point.speaking||!useAudio){audio.pause();return token===playEpoch&&mode==='watch';}
  let deadline;
  try{
   audio.currentTime=point.audioTime;
   await Promise.race([audio.play(),new Promise((_,reject)=>{deadline=setTimeout(()=>reject(Error('Audio unavailable')),4500);})]);
  }catch{if(token===playEpoch)silentMedia();}
  finally{clearTimeout(deadline);}
  return token===playEpoch&&mode==='watch';
 }
 async function start(manual=true){
  if(mode!=='watch')return;
  initiated=true;overlay.dataset.initial='false';overlay.hidden=true;
  if(t>=duration-.015)t=0;
  const token=++playEpoch;pending=true;labelPlay();
  if(!await enterPhase(token))return;
  pending=false;playing=true;labelPlay();
  if(manual)chrome.flash(true);
  raf=requestAnimationFrame(tick);
 }
 function toggle(){if(playing||pending){pause();chrome.flash(false);}else void start();}
 function silentMedia(){
  if(!useAudio)return;
  useAudio=false;audio.pause();setOrigin();
  $('media-status').textContent='Narration unavailable. Captions only.';
  $('media-status').hidden=mode!=='watch';$('sound').hidden=true;captions(true);renderWatch();
 }
 audio.addEventListener('error',silentMedia);
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&(pending||playing))pause();});
 $('sound').addEventListener('click',()=>{
  audio.muted=!audio.muted;const label=audio.muted?'Unmute narration':'Mute narration';
  $('sound').setAttribute('aria-pressed',String(audio.muted));$('sound').setAttribute('aria-label',label);$('sound').title=label;
 });
 speedSelect.addEventListener('change',()=>{
  const resume=playing||pending;if(resume)pause();
  const old=layout;layout=makeLayout(Number(speedSelect.value));duration=layout.duration;seek.max=duration.toFixed(3);
  t=layout.remap(old,t);renderWatch();labelPlay();if(resume)void start(false);
 });
 play.addEventListener('click',toggle);
 function seekWatch(next){
  const resume=playing||pending;if(resume)pause();
  t=clamp(next,0,duration);renderWatch();labelPlay();if(resume)void start(false);
 }
 seek.addEventListener('input',()=>seekWatch(Number(seek.value)));

$('download-video').hidden=false;

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
 render.draw(s);labelGraph(s);lastBeat='';
 onBeat(s.ghost&&s.state==='result'?'preview':s.state,hints[s.state]);
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
 if(m==='try'){void chrome.exit();chrome.clear();}
 $('watch-chapters').hidden=m!=='watch';$('watch-synopsis').hidden=m!=='watch';
 modeButtons.forEach(b=>{let yes=b.dataset.mode===m;b.classList.toggle('active',yes);b.setAttribute('aria-pressed',String(yes));});
 $('watch-player').hidden=m!=='watch';$('practice').hidden=m!=='try';
 $('media-status').hidden=useAudio||m!=='watch';
 paintFraming();captions(showCaptions);
 if(m==='watch'){form.hidden=true;hotspots.replaceChildren();lcd.classList.remove('pick');renderWatch();}
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
   const newEntry=s.state!=='entry'||firstKeyEdit&&input.value==='2(x+1)^2-3';firstKeyEdit=false;
   if(t.modify(input,k,{replace:newEntry})){
     tryState={state:'entry',q:null,raw:input.value,low:null,high:null,cursor:null,error:null};
     drawTry(false);
   }
 }
}
const shell=window.HandheldShell?.mount({screen:lcd,host:lcd.closest('.lcd-group'),label:'TI-Nspire CX II-T Graphs',onKey:handleHandheld});
document.addEventListener('keydown',e=>{
 if(mode!=='try'||e.ctrlKey||e.altKey||e.metaKey||!stage.contains(e.target)||e.target.closest('input,select,textarea,button'))return;
 const keys={ArrowLeft:'left',ArrowRight:'right',Enter:'enter',Escape:'esc',ContextMenu:'menu'};
 if(keys[e.key]){e.preventDefault();handleHandheld(keys[e.key]);}
});
input.addEventListener('input',()=>{if(mode==='try'&&tryState.state==='entry'){tryState.raw=input.value;render.draw(tryState)}});
modeButtons.forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));

 function fitBankWatch(){
  if(mode!=="watch"||!shell?.body.offsetWidth)return;
  const full=document.fullscreenElement===stage||stage.classList.contains("watch-fullscreen-fallback");
  const nav=full?0:(document.querySelector(".tabbar")?.offsetHeight||0);
  const box=stage.getBoundingClientRect(),vh=window.visualViewport?.height||innerHeight;
  const chapterHeight=matchMedia("(max-width:700px)").matches?$("watch-chapters").offsetHeight:0;
  stage.style.setProperty("--ct12-chapters-height",chapterHeight+"px");
  const occupied=$("watch-player").offsetHeight+$("caption-band").offsetHeight+(chapterHeight?chapterHeight+7:0);
  const pads=getComputedStyle(surface);
  const room=vh-nav-(full?0:box.top+window.scrollY)-occupied-parseFloat(pads.paddingTop)-parseFloat(pads.paddingBottom)-3;
  stage.style.setProperty("--ct12-handset-fit",Math.floor(Math.max(innerHeight<680?78:101,Math.min(full?370:296,room*558/1168)))+"px");
  stage.style.setProperty("--ct12-lcd-fit",Math.floor(Math.max(142,Math.min(full?680:600,room*4/3)))+"px");
  stage.style.setProperty("--ct12-scene-room",Math.floor(Math.max(140,room))+"px");
 }
 const bankWatchSizing=new ResizeObserver(fitBankWatch);
 [$("watch-player"),$("caption-band"),$("watch-chapters"),document.querySelector("main>.title")].forEach(el=>bankWatchSizing.observe(el));
 window.addEventListener("resize",fitBankWatch);
 window.visualViewport?.addEventListener("resize",fitBankWatch);
 document.addEventListener("fullscreenchange",fitBankWatch);
 new MutationObserver(fitBankWatch).observe(stage,{attributes:true,attributeFilter:["class"]});
 setMode(mode);if(audio.error)silentMedia();
 fitBankWatch();
