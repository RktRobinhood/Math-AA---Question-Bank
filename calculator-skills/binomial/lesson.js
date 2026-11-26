"use strict";
(function(){
 const $=id=>document.getElementById(id);
 const plan=window.CT38WatchPlan, tape=plan.tape;
 const stages=["Interpret the event","Find Binomial Cdf","Enter the four inputs","Read and compare bounds","Check the strict boundary"];
 const watchExample={n:12,p:.25,lower:5,upper:12}, practiceExample={n:9,p:.35,event:"lt",k:3,upper:5};
 const menuA=["1: Actions","2: Number","3: Algebra","4: Calculus","5: Probability","6: Statistics","7: Matrix & Vector","8: Finance"];
 const menuB=["1: Factorial","2: Permutations","3: Combinations","4: Random","5: Distributions"];
 const menuC=["⋮","D: Binomial Pdf","E: Binomial Cdf","F: Inverse Binomial"];
 const labels=["Num Trials","Probability of Success","Lower Bound","Upper Bound"];
 const audio=$("narration"),play=$("play"),seek=$("seek"),stage=document.querySelector(".ct38-shared");
 const work=$("screen-work"),steps=$("steps"),hint=$("keypad-hint"),kpReport=$("keypad-result");
 const params=new URLSearchParams(location.search),tabs=[$("watch-tab"),$("try-tab")];
 const model=$("model"),nEl=$("trials"),pEl=$("chance"),eventEl=$("event"),kEl=$("lower"),jEl=$("upper"),out=$("result"),eventLine=$("event-line");
 const shell=HandheldShell.mount({host:$("handheld-host"),screen:$("lcd"),interactive:false,onKey:key=>press(key)});
 const framingKey="qb-calculator-watch-frame", workspace=$("workspace"), cc=$("cc"), overlay=$("play-feedback"), rate=$("play-rate");
 const readFrame=()=>{try{return localStorage.getItem(framingKey)==="full"?"full":"screen"}catch{return "screen"}};
 let layout=plan.make(1),duration=layout.duration;
 let mode="watch",time=0,raf=0,playing=false,pending=false,useAudio=!!audio.getAttribute("src"),epoch=0,sig="",chapter=0,origin=0,phase="",lastTrail=-2;
 let framing=readFrame(),captionsOn=false,initiated=false;
 audio.playbackRate=1;audio.preservesPitch=true;
 const player=CalculatorWatchPlayer.mount({player:stage,surface:workspace,play,seek,expand:$("fullscreen"),feedback:overlay,active:()=>mode==="watch"});
 const trail=$("key-steps"), chips=tape.map((event,i)=>{
  const li=document.createElement("li"), key=document.createElement("kbd");
  if([4,7,12,14,17].includes(i))li.className="group-start";
  key.textContent=plan.name(event.key);li.hidden=true;li.append(key);trail.append(li);return li;
 });
 for(const id of ["transcript","transcript-mobile"])$(id).textContent=plan.words.join(" ");
 seek.max=String(duration);
 // The original key tape is acted once. Later narration compares settings, not keystrokes.
 const boundsCards=[
  {label:"At least 5", range:"5 ≤ X ≤ 12 · inclusive"},
  {label:"At most 5", range:"0 ≤ X ≤ 5 · preview", values:["12","0.25","0","5"]},
  {label:"More than 5", range:"6 ≤ X ≤ 12 · preview", values:["12","0.25","6","12"]}
 ];
 let calcState="idle",calcValues=["","","",""],selected=0,activeMenu=0,replaceField=true,history=[],entry="";

 function massInRange(n,p,lo,hi){
  if(lo>hi)return 0;if(lo===0&&hi===n)return 1;if(p===0)return lo===0?1:0;if(p===1)return hi===n?1:0;
  const m=Math.min(n,Math.floor((n+1)*p));
  let total=1,sum=m>=lo&&m<=hi?1:0,w=1;
  for(let i=m;i>0;i--){w*=i/(n-i+1)*(1-p)/p;total+=w;if(i-1>=lo&&i-1<=hi)sum+=w}
  w=1;for(let i=m;i<n;i++){w*=(n-i)/(i+1)*p/(1-p);total+=w;if(i+1>=lo&&i+1<=hi)sum+=w}
  return Math.min(1,Math.max(0,sum/total));
 }
 const fmt=x=>x===0||x===1?String(x):x<1e-5?x.toExponential(5):Number(x.toPrecision(6)).toString();
 const cmd=(n,p,l,h)=>"binomCdf("+[n,p,l,h].join(",")+")";
 const command=cmd(watchExample.n,watchExample.p,watchExample.lower,watchExample.upper);
 const watchedResult=fmt(massInRange(watchExample.n,watchExample.p,watchExample.lower,watchExample.upper));
 const escape=(s)=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
 const timecode=t=>Math.floor(t/60)+":"+String(Math.floor(t)%60).padStart(2,"0");
 const mkMenu=(list,sel,which,live)=>'<ul class="lcd-menu">'+list.map((name,i)=>'<li'+(i===sel?' class="current"':'')+(live?' data-menu="'+which+':'+i+'"':'')+'>'+escape(name)+'</li>').join("")+"</ul>";
 const wizard=(values,field,live,preview=false)=>'<div class="lcd-dialog"><strong>Binomial Cdf</strong>'+labels.map((n,i)=>'<div class="lcd-field'+((i===field||(preview&&i>=2))?' active':'')+(live?' kbd-action" data-field="'+i:'')+'"><span>'+n+':</span><span>'+escape(values[i]||"\u00a0")+'</span></div>').join("")+(preview?'<p class="lcd-preview-note">Bounds preview · not calculated</p>':'<div class="lcd-ok"><span'+(field===4?' class="active"':'')+(live?' data-field="4"':'')+'>OK</span> <span'+(live?' data-field="5"':'')+'>Cancel</span></div>')+'</div>';
 const lcdResult=h=>'<div class="lcd-history"><p>'+escape(h.command)+'</p><p class="answers"><strong>'+escape(h.value)+'</strong></p></div>';
 const lcdEntry=x=>'<div class="lcd-entry"><p>'+escape(x||"\u00a0")+'</p></div>';
 const activate=(b,v)=>{b.setAttribute("aria-current",String(v));};

 function watchSnapshot(index){
  const values=["","","",""];let state="idle",field=0;
  for(let i=0;i<=index;i++){
   const e=tape[i];
   if(e.state)state=e.state;
   if(e.field!==undefined)field=e.field;
   if(e.fieldAfter!==undefined)values[e.field]=e.fieldAfter;
  }
  return {state,field,values};
 }
 function renderWatch(t){
  if(mode!=="watch")return;
  const point=layout.at(t), frame=plan.visual(point), {i,last,current,example}=frame;
  chapter=plan.chapter[i];
  seek.value=String(t);seek.setAttribute("aria-valuetext",timecode(t)+" of "+timecode(duration));
  $("clock").textContent=timecode(t)+" / "+timecode(duration);
  stage.dataset.phase=point.speaking?"voice":"hold";
  stage.dataset.watchBeat=String(i);
  shell.setKeys(current&&!example?[current]:[]);
  if(lastTrail!==last){
   lastTrail=last;
   chips.forEach((item,j)=>{item.hidden=j>last;item.classList.toggle("current",j===last);});
   trail.scrollLeft=trail.scrollWidth;
  }
  if(!initiated){overlay.dataset.initial="true";overlay.hidden=t>.04;}
  const spoken=point.speaking&&point.audioTime>=plan.spokenAt[i]-.03?plan.words[i]:"";
  if($("caption").textContent!==spoken)$("caption").textContent=spoken;
  $("caption-band").hidden=!captionsOn||!spoken;
  const {state,field,values}=watchSnapshot(last);
  const nextSig=[i,state,field,values.join("|"),example,point.speaking].join("/");
  if(nextSig===sig)return;
  sig=nextSig;
  $("bounds-case").textContent=boundsCards[example].label;
  $("bounds-range").textContent=boundsCards[example].range;
  const tips={
   wizard:field===4?"OK is selected. The first Enter accepts the four values.":"Fill "+labels[field].toLowerCase()+". Tab moves to the next field.",
   entry:"The command is ready on the entry line. Press Enter again to calculate.",
   result:"All eight counts from 5 through 12 are included in this result."
  };
  $("teaching-tip").textContent=!point.speaking&&!example&&i>=2&&i<=3&&tips[state]?tips[state]:plan.tips[i];
  let html="";
  if(state==="probability-menu")html='<div class="menu-stack">'+mkMenu(menuA,0,"a",false)+"</div>";
  if(state==="probability-submenu")html='<div class="menu-stack">'+mkMenu(menuA,4,"a",false)+mkMenu(menuB,4,"b",false)+"</div>";
  if(state==="distributions-submenu"||state==="cdf-selected")html='<div class="menu-stack">'+mkMenu(menuB,4,"b",false)+mkMenu(menuC,state==="cdf-selected"?2:1,"c",false)+"</div>";
  if(state==="wizard")html=wizard(values,field,false);
  if(state==="entry")html=lcdEntry(command);
  if(state==="result")html=example?wizard(boundsCards[example].values,-1,false,true):lcdResult({command,value:watchedResult})+lcdEntry("");
  if(!html)html=lcdEntry("");
  work.innerHTML=html;
  [...steps.children].forEach((li,j)=>activate(li.firstElementChild,j===chapter));
 }
 stages.forEach((name,i)=>{
  const li=document.createElement("li"),b=document.createElement("button"),num=document.createElement("span");
  b.type="button";num.textContent="0"+(i+1);b.append(num,document.createTextNode(name));b.addEventListener("click",()=>go(layout.spans[plan.entry[i]].start));li.append(b);steps.append(li);
 });
 function paintFrame(){
  stage.classList.toggle("ct38-screen-view",mode==="watch"&&framing==="screen");
  $("view-screen").setAttribute("aria-pressed",String(framing==="screen"));
  $("view-full").setAttribute("aria-pressed",String(framing==="full"));
  fitBankWatch();
 }
 function chooseFrame(value){
  framing=value;try{localStorage.setItem(framingKey,value)}catch{}
  paintFrame();
 }
 $("view-screen").addEventListener("click",()=>chooseFrame("screen"));
 $("view-full").addEventListener("click",()=>chooseFrame("full"));
 window.addEventListener("storage",e=>{if(e.key===null||e.key===framingKey){framing=readFrame();paintFrame()}});
 function paintCaptions(value){
  captionsOn=value;cc.setAttribute("aria-pressed",String(value));
  cc.setAttribute("aria-label",value?"Hide captions":"Show captions");
  if(mode==="watch")renderWatch(time);else $("caption-band").hidden=true;
  fitBankWatch();
 }
 cc.addEventListener("click",()=>paintCaptions(!captionsOn));
 function labelPlay(){
  const active=playing||pending,name=active?"Pause":time>=duration-.015?"Replay":"Play";
  play.title=name;play.setAttribute("aria-label",name);
  play.querySelector(".play-icon").toggleAttribute("hidden",active);
  play.querySelector(".pause-icon").toggleAttribute("hidden",!active);
 }
 function go(t){
  const resume=playing||pending;
  if(resume)pause();
  time=Math.max(0,Math.min(Number(t)||0,duration));
  renderWatch(time);labelPlay();
  if(resume)void start(false);
 }
 function pause(){
  epoch++;pending=false;playing=false;phase="";audio.pause();
  cancelAnimationFrame(raf);labelPlay();renderWatch(time);
 }
 function silentMedia(){
  if(!useAudio)return;
  useAudio=false;audio.pause();origin=performance.now()-time*1000;
  $("media-status").textContent="Narration unavailable. Captions only.";
  $("media-status").hidden=mode!=="watch";$("sound").hidden=true;paintCaptions(true);
 }
 function metadata(){
  if(!useAudio||!Number.isFinite(audio.duration)||audio.duration<=0)return;
  if(Math.abs(audio.duration-39.079)>.14)silentMedia();
 }
 async function enterPhase(token){
  const point=layout.at(time);
  phase=point.speaking?"voice":"hold";origin=performance.now()-time*1000;
  if(!point.speaking||!useAudio){audio.pause();return token===epoch&&mode==="watch";}
  let deadline;
  try{
   audio.currentTime=point.audioTime;audio.playbackRate=1;
   await Promise.race([audio.play(),new Promise((_,reject)=>{deadline=setTimeout(()=>reject(Error("Audio unavailable")),4500);})]);
  }catch{if(token===epoch)silentMedia();}
  finally{clearTimeout(deadline);}
  return token===epoch&&mode==="watch";
 }
 function tick(now){
  if(!playing||mode!=="watch")return;
  const span=layout.at(time).span;
  if(phase==="voice"){
   time=useAudio?Math.min(span.voiceEnd,span.start+Math.max(0,audio.currentTime-span.from)):Math.min(span.voiceEnd,Math.max(span.start,(now-origin)/1000));
   if(time>=span.voiceEnd-.008||(useAudio&&audio.ended)){audio.pause();time=span.voiceEnd;phase="hold";origin=performance.now()-time*1000;}
  }else{
   time=Math.min(span.end,Math.max(span.voiceEnd,(now-origin)/1000));
   if(time>=duration){time=duration;pause();return;}
   if(time>=span.end){
    const token=epoch;renderWatch(time);
    void enterPhase(token).then(ok=>{if(ok&&playing)raf=requestAnimationFrame(tick);});
    return;
   }
  }
  renderWatch(time);raf=requestAnimationFrame(tick);
 }
 async function start(manual=true){
  if(mode!=="watch"||playing||pending)return;
  initiated=true;overlay.hidden=true;overlay.dataset.initial="false";
  if(time>=duration-.015){time=0;renderWatch(time);}
  const token=++epoch;pending=true;labelPlay();
  if(!await enterPhase(token)){if(!pending&&!playing)audio.pause();return;}
  pending=false;playing=true;labelPlay();if(manual)player.flash(true);raf=requestAnimationFrame(tick);
 }
 function toggle(){if(playing||pending){pause();player.flash(false)}else void start();}
 audio.addEventListener("loadedmetadata",metadata);
 audio.addEventListener("error",silentMedia);
 document.addEventListener("visibilitychange",()=>{if(document.hidden&&(playing||pending))pause();});
 $("sound").addEventListener("click",()=>{
  audio.muted=!audio.muted;
  const name=audio.muted?"Unmute narration":"Mute narration";
  $("sound").setAttribute("aria-pressed",String(audio.muted));$("sound").setAttribute("aria-label",name);$("sound").title=name;
 });
 rate.addEventListener("change",()=>{
  const resume=playing||pending;
  if(resume)pause();
  const old=layout;
  layout=plan.make(Number(rate.value));duration=layout.duration;seek.max=duration;
  time=layout.remap(old,time);renderWatch(time);labelPlay();
  if(resume)void start(false);
 });
 play.addEventListener("click",toggle);
 seek.addEventListener("input",()=>go(seek.value));

 function report(message,error=false){
  kpReport.textContent=message||"";kpReport.hidden=!message;kpReport.className="feedback "+(error?"is-wrong":"is-right");
 }
 function data(){
  const vs=calcValues.map(x=>/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(x)?Number(x):NaN), [n,p,l,h]=vs;
  if(!Number.isInteger(n)||n<1||n>500)return "Enter a whole trial count from 1 to 500.";
  if(!Number.isFinite(p)||p<0||p>1)return "Enter a success probability between 0 and 1.";
  if(!Number.isInteger(l)||!Number.isInteger(h)||l<0||h>n||l>h)return "Use whole bounds from 0 to the trial count, lower first.";
  return{n,p,l,h};
 }
 function explainTry(){
  const cue={
   idle:"Press Menu to begin.",
   menu:"Choose 5: Probability.",
   probability:"Choose 5: Distributions.",
   dist:"Press E for Binomial Cdf, or move down from Binomial Pdf and press Enter.",
   wizard:selected<4?"Enter "+labels[selected].toLowerCase()+". Tab moves to the next field.":"Press Enter to send the command to the Calculator page.",
   entry:"Press Enter again to evaluate the command.",
   result:"To use new values, press Menu and start another calculation."
  };
  hint.textContent=cue[calcState];
 }
 function renderTry(){
  if(mode!=="try")return;
  let html=history.slice(-2).map(lcdResult).join("");
  if(calcState==="menu")html+='<div class="menu-stack">'+mkMenu(menuA,activeMenu,"a",true)+"</div>";
  if(calcState==="probability")html+='<div class="menu-stack">'+mkMenu(menuA,4,"a",true)+mkMenu(menuB,activeMenu,"b",true)+"</div>";
  if(calcState==="dist")html+='<div class="menu-stack">'+mkMenu(menuB,4,"b",true)+mkMenu(menuC,activeMenu,"c",true)+"</div>";
  if(calcState==="wizard")html+=wizard(calcValues,selected,true);
  if(["idle","entry","result"].includes(calcState))html+=lcdEntry(calcState==="entry"?entry:"");
  work.innerHTML=html;explainTry();
 }
 function newWizard(){
  calcState="wizard";selected=0;replaceField=true;report("");
 }
 function openMenu(next,start){calcState=next;activeMenu=start;report("");}
 function confirmWizard(){
  const v=data();
  if(typeof v==="string"){report(v,true);return;}
  entry=cmd(v.n,v.p,v.l,v.h);calcState="entry";report("");
 }
 function press(k){
  if(mode!=="try")return;
  if(k==="home"||k==="scratchpad"){location.assign("../scratchpad/index.html");return}
  if(k==="menu"){openMenu("menu",4);renderTry();return}
  if(k==="esc"){
   if(calcState==="wizard"){openMenu("dist",2);}
   else if(calcState==="dist"){openMenu("probability",4);}
   else if(calcState==="probability"){openMenu("menu",4);}
   else {calcState="idle";report("");}
   renderTry();return;
  }
  if(calcState==="menu"||calcState==="probability"||calcState==="dist"){
   const cfg={menu:[menuA,4,"probability",4,"5"],probability:[menuB,4,"dist",1,"5"],dist:[menuC,2,"wizard",0,"e"]}[calcState];
   const [list,right,to,next,shortcut]=cfg;
   if(k==="up"||k==="down")activeMenu=Math.max(calcState==="dist"?1:0,Math.min(list.length-1,activeMenu+(k==="up"?-1:1)));
   else if(k===shortcut||["enter","right","select"].includes(k)&&activeMenu===right){
    if(to==="wizard")newWizard();else openMenu(to,next);
   }else if(["enter","right","select"].includes(k)||/^[0-9a-z]$/.test(k)){report("This lesson uses Binomial Cdf. Choose the highlighted route.",true);}
   renderTry();return;
  }
  if(calcState==="wizard"){
   if(k==="tab"||k==="down"||k==="up"){
    const d=k==="up"?-1:1;selected=(selected+d+5)%5;replaceField=true;report("");
   }else if(k==="enter"||k==="select"){confirmWizard();}
   else if(selected<4&&k==="del"){calcValues[selected]=replaceField?"":calcValues[selected].slice(0,-1);replaceField=false;report("");}
   else if(selected<4&&(/^[0-9]$/.test(k)||k==="dot")){
    const c=k==="dot"?".":k;
    if(c!=="."||selected===1){
     let x=replaceField?"":calcValues[selected];if(x.length<11&&!(c==="."&&x.includes(".")))x+=c;
     calcValues[selected]=x;replaceField=false;report("");
    }
   }
   renderTry();return;
  }
  if(calcState==="entry"&&["enter","select"].includes(k)){
   const v=data();
   if(typeof v==="string"){report(v,true);return}
   const value=fmt(massInRange(v.n,v.p,v.l,v.h));
   history.push({command:entry,value});history=history.slice(-2);calcState="result";
   report("Probability = "+value+". Your bounds include "+v.l+" through "+v.h+".");renderTry();return;
  }
 }
 work.addEventListener("click",e=>{
  if(mode!=="try")return;
  const f=e.target.closest("[data-field]"),m=e.target.closest("[data-menu]");
  if(f&&calcState==="wizard"){
   const n=Number(f.dataset.field);
   if(n===5){press("esc");return}
   if(n===4){selected=4;press("enter");return}
   selected=n;replaceField=true;renderTry();return;
  }
  if(m){
   const [which,i]=m.dataset.menu.split(":");const names={menu:"a",probability:"b",dist:"c"};
   if(which===names[calcState]){activeMenu=Number(i);press("enter")}
  }
 });
 stage.addEventListener("keydown",e=>{
  if(mode!=="try"||e.metaKey||e.ctrlKey||e.altKey||e.target.closest("input,select,textarea,[contenteditable]"))return;
  if((e.key==="Enter"||e.key===" ")&&e.target.closest("button"))return;
  if(e.key==="Tab"&&(calcState!=="wizard"||e.target!==stage||e.shiftKey))return;
  if(e.key==="Tab"&&selected===4){e.preventDefault();$("answer").focus();return;}
  const map={Enter:"enter",Escape:"esc",Backspace:"del",Delete:"del",ArrowUp:"up",ArrowDown:"down",ArrowRight:"right",Tab:"tab",m:"menu",M:"menu",".":"dot"};
  const k=map[e.key]||(/^[0-9eE]$/.test(e.key)?e.key.toLowerCase():null);
  if(k){e.preventDefault();press(k);uiFlash(k);}
 });
 let blink=0;
 function uiFlash(k){clearTimeout(blink);shell.setKeys([k]);blink=setTimeout(()=>{if(mode==="try")shell.setKeys([]);},185)}
 function resetKeypad(){
  calcState="idle";calcValues=["","","",""];selected=0;replaceField=true;history=[];entry="";report("");renderTry()
 }
 $("reset-keypad").addEventListener("click",()=>{resetKeypad();stage.focus({preventScroll:true});});

 function onMode(next,focus=false){
  if(next!=="watch"&&next!=="try")return;
  if(mode==="watch"&&next==="try"){pause();void player.exit();player.clear()}
  mode=next;stage.dataset.mode=next;$("key-strip").hidden=next!=="watch";sig="";clearTimeout(blink);shell.setKeys([]);shell.setInteractive(next==="try");
  tabs.forEach((el,i)=>{
   const yes=(i===0)===(next==="watch");el.tabIndex=yes?0:-1;el.setAttribute("aria-selected",String(yes));$(el.getAttribute("aria-controls")).hidden=!yes;
  });
  $("watch-side").hidden=$("watch-player").hidden=$("watch-bounds").hidden=$("teaching-tip").hidden=next!=="watch";
  $("try-side").hidden=$("try-player").hidden=next!=="try";
  $("media-status").hidden=useAudio||next!=="watch";
  paintFrame();paintCaptions(captionsOn);
  if(next==="watch"){renderWatch(time);if(focus)play.focus({preventScroll:true})}
  else{renderTry();if(focus)stage.focus({preventScroll:true})}
 }
 tabs.forEach((el,i)=>{
  el.addEventListener("click",()=>onMode(i?"try":"watch",Boolean(i)));
  el.addEventListener("keydown",e=>{if(["ArrowLeft","ArrowRight","Home","End"].includes(e.key)){
   e.preventDefault();const x=e.key==="Home"?0:e.key==="End"?1:1-i;onMode(x?"try":"watch");tabs[x].focus();
  }});
 });
 $("return-watch").addEventListener("click",()=>onMode("watch",true));
 document.addEventListener("keydown",e=>{
  // A linked Try can land on the document body without stealing focus.
  if(mode==="try"&&e.target===document.body&&!e.altKey&&!e.ctrlKey&&!e.metaKey&&!e.repeat&&e.key.toLowerCase()==="m"){
   e.preventDefault();stage.focus({preventScroll:true});press("menu");uiFlash("menu");return;
  }

 });


 function typedPrefill(){
  const raw={n:params.get("n")??params.get("trials"),p:params.get("p")??params.get("chance"),event:params.get("event"),k:params.get("k")??params.get("lower"),upper:params.get("upper")};
  if(!Object.values(raw).some(v=>v!==null))return null;
  const integer=v=>typeof v==="string"&&/^\d{1,4}$/.test(v)?Number(v):NaN;
  const prob=v=>typeof v==="string"&&/^(?:\d(?:\.\d{1,15})?|\.\d{1,15})$/.test(v)?Number(v):NaN;
  const n=integer(raw.n),p=prob(raw.p),k=integer(raw.k),upper=integer(raw.upper),event=raw.event;
  const events=["ge","le","gt","lt","range"];
  if(!Number.isInteger(n)||n<1||n>500||!Number.isFinite(p)||p<0||p>1||!events.includes(event)||!Number.isInteger(k)||k>n||(event==="range"&&(!Number.isInteger(upper)||upper<k||upper>n)))return null;
  return{n,p,event,k,upper:event==="range"?upper:k};
 }
 const linked=typedPrefill(),preset=linked||((params.get("case")==="binomial-demo"||params.get("example")==="demo")?practiceExample:null);
 if(preset){nEl.value=preset.n;pEl.value=preset.p;eventEl.value=preset.event;kEl.value=preset.k;jEl.value=preset.upper;}
 function computed(n,e,k,j){
  const map={ge:[k,n,"X ≥ "+k],le:[0,k,"X ≤ "+k],lt:[0,k-1,"X < "+k],gt:[k+1,n,"X > "+k],range:[k,j,k+" ≤ X ≤ "+j]};
  const [a,b,label]=map[e];const lo=Math.max(0,a),hi=Math.min(n,b);
  return{lo,hi,label,impossible:lo>hi,certain:lo===0&&hi===n};
 }
 const challenge=linked||practiceExample;
 const target=computed(challenge.n,challenge.event,challenge.k,challenge.upper);
 $("keypad-problem").textContent="Practice: n = "+challenge.n+", p = "+challenge.p+", P("+target.label+").";
 if(linked){
  $("challenge-title").textContent="Linked binomial event";
  $("challenge-description").textContent="For "+challenge.n+" independent trials, each with success probability "+challenge.p+", find P("+target.label+").";
  $("answer-hint").textContent="List the whole-number counts the event includes before choosing the lower and upper bounds.";
 }
 function update(){
  const range=eventEl.value==="range";$("upper-row").hidden=!range;jEl.disabled=!range;jEl.required=range;
  $("lower-label").textContent=range?"Lower count":"Count k";jEl.setCustomValidity("");
  if(range&&Number.isFinite(kEl.valueAsNumber)&&Number.isFinite(jEl.valueAsNumber)&&jEl.valueAsNumber<kEl.valueAsNumber)jEl.setCustomValidity("Enter an upper count at least as large as the lower count.");
  const row=[nEl,pEl,kEl,...(range?[jEl]:[])];
  eventLine.textContent=row.every(x=>Number.isFinite(x.valueAsNumber)&&x.validity.valid)?"P("+computed(nEl.valueAsNumber,eventEl.value,kEl.valueAsNumber,jEl.valueAsNumber).label+")":"Enter valid values to set the event.";
  out.hidden=true;out.replaceChildren();
 }
 model.addEventListener("input",()=>{update()});model.addEventListener("change",()=>{update()});update();
 const append=(type,content,parent=out)=>{const el=document.createElement(type);el.textContent=content;parent.append(el);return el};
 model.addEventListener("submit",e=>{
  e.preventDefault();const n=nEl.valueAsNumber,p=pEl.valueAsNumber,k=kEl.valueAsNumber,j=jEl.valueAsNumber,event=eventEl.value;
  if(!model.reportValidity()||!Number.isInteger(n)||n<1||n>500||!Number.isFinite(p)||p<0||p>1||!Number.isInteger(k)||(event==="range"&&(!Number.isInteger(j)||j<k)))return;
  const v=computed(n,event,k,j);const value=v.impossible?0:v.certain?1:massInRange(n,p,v.lo,v.hi);
  out.replaceChildren();append("strong","P("+v.label+") = "+fmt(value),append("p",""));
  if(v.impossible)append("p","No possible count is included. The count runs from 0 through "+n+".");
  else if(v.certain)append("p","Every possible count is included.");
  else{
   append("p","Include "+v.lo+" through "+v.hi+". The endpoints count.");
   append("code",cmd(n,p,v.lo,v.hi),append("p",""));
   if(v.lo===0||v.hi===n){
    const [a,b]=v.lo===0?[v.hi+1,n]:[0,v.lo-1];append("code","1 − "+cmd(n,p,a,b),append("p","Complement: "));
   }
   if(value===0&&p>0&&p<1)append("p","This nonzero probability is too small to represent as a browser number.");
  }
  out.hidden=false;
 });
 const answer=$("answer"),feedback=$("feedback");
 answer.addEventListener("input",()=>{feedback.textContent="";feedback.className="feedback";});
 $("answer-form").addEventListener("submit",e=>{
  e.preventDefault();const v=answer.valueAsNumber,correct=target.impossible?0:massInRange(challenge.n,challenge.p,target.lo,target.hi),r=Number(correct.toPrecision(3));
  if(!Number.isFinite(v)||v<0||v>1)return;
  if(correct===0&&!target.impossible&&challenge.p>0&&challenge.p<1){feedback.className="feedback is-wrong";feedback.textContent="This nonzero probability is too small for the browser to check.";return;}
  const valid=v===r;feedback.className="feedback "+(valid?"is-right":"is-wrong");
  feedback.textContent=valid?(linked?"Correct. You used the counts the event includes.":"Correct. Fewer than three includes 0, 1 and 2."):Math.abs(v-correct)<=Math.max(Number.MIN_VALUE,Math.abs(correct)*.00055)?"The probability is right. Now round it to three significant figures.":linked?"Not yet. Check the first and last included counts.":"Not yet. Check that your upper bound excludes a count of 3.";
 });
 function fitBankWatch(){
  if(mode!=="watch")return;
  const full=document.fullscreenElement===stage||stage.classList.contains("watch-fullscreen-fallback");
  const nav=full?0:(document.querySelector(".tabbar")?.offsetHeight||0);
  const box=stage.getBoundingClientRect(),vh=window.visualViewport?.height||innerHeight;
  const occupied=$("watch-player").offsetHeight+$("caption-band").offsetHeight+$("watch-bounds").offsetHeight+$("teaching-tip").offsetHeight;
  const pads=getComputedStyle(workspace);
  const room=vh-nav-(full?0:box.top+window.scrollY)-occupied-parseFloat(pads.paddingTop)-parseFloat(pads.paddingBottom)-4;
  stage.style.setProperty("--ct38-body-fit",Math.floor(Math.max(innerHeight<680?78:98,Math.min(full?365:288,room*558/1168)))+"px");
  stage.style.setProperty("--ct38-lcd-fit",Math.floor(Math.max(176,Math.min(full?650:570,room*4/3)))+"px");
  stage.style.setProperty("--ct38-scene-room",Math.floor(Math.max(126,room))+"px");
 }
 const sizing=new ResizeObserver(fitBankWatch);
 [$("watch-player"),$("caption-band"),$("watch-bounds"),$("teaching-tip"),document.querySelector("main>.header"),document.querySelector("main>.tabs")].forEach(el=>sizing.observe(el));
 window.addEventListener("resize",fitBankWatch);
 window.visualViewport?.addEventListener("resize",fitBankWatch);
 document.addEventListener("fullscreenchange",fitBankWatch);
 new MutationObserver(fitBankWatch).observe(stage,{attributes:true,attributeFilter:["class"]});
 onMode(params.get("mode")==="try"?"try":"watch");
 if(audio.error)silentMedia();else metadata();
 fitBankWatch();
})();
