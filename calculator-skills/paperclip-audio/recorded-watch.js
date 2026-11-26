"use strict";
// Optional bridge for original lesson renderers. No recording means no UI
// or playback changes. A validated recording owns the only running clock.
(function(root){
 const script=typeof document==="undefined"?null:document.currentScript;
 const int=n=>Number.isSafeInteger(n)&&n>=0;
 const rec=x=>x&&typeof x==="object"&&!Array.isArray(x);
 const sha=/^[0-9a-f]{64}$/;
 const name=/^narration(?:-[a-z0-9]+(?:-[a-z0-9]+)*)?\.(?:mp3|ogg|m4a|wav)$/;
 function requiredPoints(cue){
  const w=cue.watch, end=w.sliderEndAtExtractionMs, times=[0,end];
  for(const a of w.captionCues||[]) times.push(a.startMs);
  for(const a of w.authoredTape||[])for(const k of a.keys||[])times.push(k.timeMs);
  for(const k of w.displayKeyStateChanges||[])if(k.keys?.length)times.push(k.timeMs);
  for(const k of w.pointerStateChanges||[])times.push(k.timeMs);
  return [...new Set(times.filter(t=>int(t)&&t<=end))].sort((a,b)=>a-b);
 }
 function decode(raw,cue,config){
  if(!rec(raw)||raw.version!==1||raw.status!=="measured"||raw.lesson!==config.id||
     raw.transcriptSha256!==config.transcript||raw.cueMapSha256!==config.cue||
     !sha.test(raw.audioSha256)||typeof raw.audio!=="string"||!name.test(raw.audio)||
     !int(raw.durationMs)||raw.durationMs<8000||raw.durationMs>600000||
     !rec(cue)||cue.id!==config.id||!rec(cue.watch)||!Array.isArray(cue.spokenCues)||
     !Array.isArray(raw.anchors)||raw.anchors.length<2||raw.anchors.length>600||
     !Array.isArray(raw.captions)||raw.captions.length!==cue.spokenCues.length)return null;
  const max=cue.watch.sliderEndAtExtractionMs;
  if(!int(max)||Math.abs(max-config.duration)>20)return null;
  const required=requiredPoints(cue), editorial=new Set();
  let lastAudio=-1,lastEditorial=-1;
  for(const a of raw.anchors){
   if(!rec(a)||!int(a.audioMs)||!int(a.editorialMs)||a.audioMs<=lastAudio||
      a.editorialMs<=lastEditorial||a.audioMs>raw.durationMs||a.editorialMs>max)return null;
   lastAudio=a.audioMs;lastEditorial=a.editorialMs;editorial.add(a.editorialMs);
  }
  const first=raw.anchors[0],final=raw.anchors.at(-1);
  if(first.audioMs!==0||first.editorialMs!==0||final.audioMs!==raw.durationMs||
     final.editorialMs!==max||!required.every(t=>editorial.has(t)))return null;
  let lastEnd=0;
  const captions=[];
  for(let i=0;i<raw.captions.length;i++){
   const c=raw.captions[i],s=cue.spokenCues[i];
   if(!rec(c)||!rec(s)||c.id!==s.id||!int(c.startMs)||!int(c.endMs)||
      c.startMs<lastEnd||c.endMs-c.startMs<300||c.endMs>raw.durationMs||
      typeof s.text!=="string"||!s.text.trim()||s.text.length>600)return null;
   lastEnd=c.endMs;captions.push({...c,text:s.text.trim()});
  }
  return {audio:raw.audio,durationMs:raw.durationMs,anchors:raw.anchors,captions};
 }
 function map(points,value,from,to){
  const i=points.findLastIndex(p=>p[from]<=value);
  if(i<0)return points[0][to];
  if(i>=points.length-1)return points.at(-1)[to];
  const a=points[i],b=points[i+1];
  return a[to]+(value-a[from])*(b[to]-a[to])/(b[from]-a[from]);
 }
 if(typeof module==="object"&&module.exports){module.exports={decode,requiredPoints,map};return;}
 if(!script)return;
 const id=script.dataset.lesson, cueHash=script.dataset.cueSha, textHash=script.dataset.transcriptSha;
 if(!/^(?:CT\d{2}(?:-max)?|SUP-HIST-01)$/.test(id)||!sha.test(cueHash)||!sha.test(textHash))return;
 const cueURL=new URL("lessons/"+id+".cues.json",script.src);
 let bound=false;
 root.QBRecordedWatch=Object.freeze({bind(stop,onLayout){
  if(bound||typeof stop!=="function")return;
  bound=true;
  const $=s=>document.getElementById(s), watchTab=$("watch-tab"), stage=$("stage"), slider=$("seek"), old=$("watch-player")||$("player"), oldCaption=$("caption");
  if(!watchTab||!stage||!slider||!old||!oldCaption)return;
  const inWatch=()=>watchTab.getAttribute("aria-selected")==="true";
  let requested=false;
  function prepare(){
   if(!inWatch()||requested)return;
   requested=true;
   load().catch(()=>{}); // Absent, invalid and offline all retain caption mode.
  }
  async function load(){
   const packageURL=new URL("narration.sync.json",document.baseURI);
   const response=await fetch(packageURL,{cache:"no-cache"});
   if(!response.ok)return;
   const raw=await response.json();
   if(!rec(raw)||raw.status!=="measured"||raw.lesson!==id)return;
   const cueResponse=await fetch(cueURL);
   if(!cueResponse.ok)return;
   const bytes=await cueResponse.arrayBuffer();
   const digest=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes)),v=>v.toString(16).padStart(2,"0")).join("");
   if(digest!==cueHash)return;
   const cue=JSON.parse(new TextDecoder().decode(bytes));
   const deck=decode(raw,cue,{id,transcript:textHash,cue:cueHash,duration:Math.round(Number(slider.max)*1000)});
   if(!deck)return;
   const audio=document.createElement("audio");
   audio.preload="metadata";audio.hidden=true;audio.dataset.recordedWatch=id;
   audio.src=new URL(deck.audio,packageURL).href;stage.append(audio);
   audio.addEventListener("error",()=>audio.remove(),{once:true});
   audio.addEventListener("loadedmetadata",()=>{
    if(!Number.isFinite(audio.duration)||Math.abs(audio.duration*1000-deck.durationMs)>120){audio.remove();return;}
    install(deck,audio);
   },{once:true});
  }
  const observer=new MutationObserver(prepare);
  observer.observe(watchTab,{attributes:true,attributeFilter:["aria-selected"]});
  prepare();
  function install(deck,audio){
   const make=(tag,txt)=>{const n=document.createElement(tag);if(txt!==undefined)n.textContent=txt;return n;};
   const button=(text,label=text)=>{const b=make("button",text);b.type="button";b.setAttribute("aria-label",label);return b;};
   const wrap=make("div"), ccBand=make("p"), bar=make("div"), sliderAudio=make("input"), status=make("span"), time=make("span");
   wrap.className="recorded-watch";ccBand.className="recorded-caption";bar.className="recorded-controls";
   bar.setAttribute("role","group");bar.setAttribute("aria-label","Narrated playback controls");
   const play=button("Play","Play narration"), cc=button("CC","Hide spoken captions");
   cc.setAttribute("aria-pressed","true");
   sliderAudio.type="range";sliderAudio.min="0";sliderAudio.max=String(audio.duration);sliderAudio.step=".01";sliderAudio.value="0";
   sliderAudio.setAttribute("aria-label","Seek narration");
   const rate=make("select");rate.setAttribute("aria-label","Narration playback speed");
   for(const v of [.5,.75,.9,1,1.25,1.5]){const o=make("option",v+"×");o.value=String(v);rate.append(o);}
   rate.value="1";
   status.className="recorded-status";status.setAttribute("role","status");status.hidden=true;
   time.className="recorded-time";time.setAttribute("aria-hidden","true");
   bar.append(play,sliderAudio,time,cc,rate);
   for(const [selector,title,icon] of [["#view-screen","Screen only","▭"],["#view-full","Full calculator","▥"],["#fullscreen,#focus-view,#focus","Fullscreen or focused view","⛶"]]){
    const target=old.querySelector(selector);
    if(!target)continue;
    const tool=button(icon,title);tool.title=title;
    const sync=()=>{if(target.hasAttribute("aria-pressed"))tool.setAttribute("aria-pressed",target.getAttribute("aria-pressed"));};
    const ob=new MutationObserver(sync);ob.observe(target,{attributes:true,attributeFilter:["aria-pressed"]});
    tool.onclick=()=>{target.click();sync();};sync();bar.append(tool);
   }
   wrap.append(ccBand,bar,status);old.insertAdjacentElement("afterend",wrap);
   // The modern angle page fits its LCD to the actual visible transport.
   const layout=typeof onLayout==="function"?new ResizeObserver(onLayout):null;
   if(layout)layout.observe(wrap);
   let disabled=false, frame=0, lastDraw=NaN, armed=false, captions=true, navigationPending=false;
   const pad=n=>Math.floor(n/60)+":"+String(Math.floor(n)%60).padStart(2,"0");
   const toWatch=ms=>map(deck.anchors,ms,"audioMs","editorialMs");
   const toAudio=ms=>map(deck.anchors,ms,"editorialMs","audioMs");
   const syncLabel=()=>{const ended=audio.ended, label=audio.paused?(ended?"Replay":"Play"):"Pause";
    play.textContent=label;play.setAttribute("aria-label",label+" narration");};
   function draw(force=false){
    if(disabled||!inWatch()||navigationPending)return;
    const timeMs=audio.currentTime*1000, editorial=toWatch(Math.min(deck.durationMs,timeMs));
    // Render through the original owning lesson, not a separate reconstruction.
    if(force||Math.abs(editorial-lastDraw)>2||!Number.isFinite(lastDraw)){
     lastDraw=editorial;
     slider.value=String(editorial/1000);slider.dispatchEvent(new Event("input",{bubbles:true}));
    }
    sliderAudio.value=String(audio.currentTime);
    time.textContent=pad(audio.currentTime)+" / "+pad(audio.duration);sliderAudio.setAttribute("aria-valuetext",time.textContent);
    const active=deck.captions.findLastIndex(c=>timeMs>=c.startMs&&timeMs<c.endMs);
    const spoken=active<0?"":deck.captions[active].text;
    if(ccBand.textContent!==spoken)ccBand.textContent=spoken;
    ccBand.hidden=!captions;
    syncLabel();
   }
   function raf(){draw();if(!audio.paused&&inWatch()&&!disabled&&!navigationPending)frame=requestAnimationFrame(raf);}
   function seek(n){
    if(disabled||!inWatch()||!Number.isFinite(n))return;
    audio.currentTime=Math.min(audio.duration,Math.max(0,n));draw(true);
   }
   function toggle(){
    if(disabled||!inWatch())return;
    if(audio.paused){
     if(audio.ended||audio.currentTime>=audio.duration-.015)seek(0);
     status.hidden=true;
     audio.play().catch(()=>{if(!inWatch()||disabled)return;status.textContent="Press Play again to start the recording.";status.hidden=false;syncLabel();});
    }else audio.pause();
   }
   const frameSelector="#play,#stage-play,#start-overlay,#overlay,#play-feedback";
   function click(e){
    if(disabled||!inWatch()||!stage.contains(e.target))return;
    const action=e.target.closest?.(frameSelector);
    const chapter=e.target.closest?.("#steps button,#chapters button,.steps button");
    if(chapter&&!wrap.contains(chapter)){
     const before=slider.value;
     navigationPending=true;cancelAnimationFrame(frame);
     requestAnimationFrame(()=>{
      navigationPending=false;if(disabled||!inWatch())return;
      if(before!==slider.value)seek(toAudio(Number(slider.value)*1000)/1000);
      if(!audio.paused){cancelAnimationFrame(frame);raf();}
     });
    }
    if(action||(!e.target.closest?.("button,a,input,textarea,select,summary,[contenteditable],label")&&
      Boolean(e.target.closest?.("#handheld-host,#host,#workspace,#lcd"))&&!root.getSelection()?.toString())){
     e.preventDefault();e.stopImmediatePropagation();toggle();
    }
   }
   function keyboard(e){
    if(disabled||!inWatch()||e.altKey||e.ctrlKey||e.metaKey||e.defaultPrevented)return;
    const t=e.target,k=e.key.toLowerCase();
    if(t!==document.body&&!stage.contains(t))return;
    const interactive=t.closest?.("input,select,textarea,button,a,summary,[contenteditable]");
    const arrow=k==="arrowleft"||k==="arrowright";
    if(interactive&&!((t===play&&k!==" ")||(t===sliderAudio&&arrow)))return;
    if(![" ","k","j","l","arrowleft","arrowright"].includes(k))return;
    e.preventDefault();e.stopImmediatePropagation();
    if(k===" "||k==="k"){if(!e.repeat)toggle();return;}
    seek(audio.currentTime+(["j","arrowleft"].includes(k)?-1:1)*(k==="l"||k==="j"?10:t===sliderAudio?1:5));
   }
   function change(){
    const active=inWatch();
    wrap.hidden=!active;
    stage.classList.toggle("has-recorded-watch",active);
    old.classList.toggle("recorded-replaced",active);
    oldCaption.classList.toggle("recorded-replaced",active);
    if(!active){audio.pause();return;}
    if(!armed){stop();armed=true;seek(toAudio(Number(slider.value)*1000)/1000);}
    else draw(true);
   }
   play.onclick=toggle;sliderAudio.oninput=()=>seek(Number(sliderAudio.value));
   cc.onclick=()=>{captions=!captions;cc.setAttribute("aria-pressed",String(captions));cc.setAttribute("aria-label",captions?"Hide spoken captions":"Show spoken captions");draw();};
   rate.onchange=()=>{audio.playbackRate=Number(rate.value);};
   audio.addEventListener("playing",()=>{cancelAnimationFrame(frame);raf();});
   ["timeupdate","seeked","pause","ended"].forEach(evt=>audio.addEventListener(evt,()=>{if(audio.paused)cancelAnimationFrame(frame);draw();}));
   audio.addEventListener("error",()=>{
    disabled=true;cancelAnimationFrame(frame);watchObserver.disconnect();layout?.disconnect();
    stage.classList.remove("has-recorded-watch");old.classList.remove("recorded-replaced");oldCaption.classList.remove("recorded-replaced");
    wrap.remove();audio.remove();root.removeEventListener("click",click,true);root.removeEventListener("keydown",keyboard,true);
   },{once:true});
   const watchObserver=new MutationObserver(change);
   watchObserver.observe(watchTab,{attributes:true,attributeFilter:["aria-selected"]});
   root.addEventListener("click",click,true);root.addEventListener("keydown",keyboard,true);
   document.addEventListener("visibilitychange",()=>{if(document.hidden)audio.pause();});
   change();
  }
 }});
})(typeof window!=="undefined"?window:globalThis);
