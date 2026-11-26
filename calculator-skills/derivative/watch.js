"use strict";
(function(root){
 const chapterSpeeds=[.92,1.15,1.05,0,0],minimumHolds=[2.1,2.5,3,7,7];
 function plan(tape,deck=null,pace=1){
  const editorial=tape.starts.concat(tape.duration);
  if(editorial.length!==chapterSpeeds.length+1)throw Error("CT51 cue count");
  const naturalEnds=[5.7,6.15,8.28,6.69,4.55];
  const boundaries=[0];
  for(let i=0;i<naturalEnds.length;i++){
   const a=deck?.captions[i],b=deck?.captions[i+1];
   boundaries.push(deck?(b?(a.endMs+b.startMs)/2000:deck.durationMs/1000):boundaries.at(-1)+naturalEnds[i]);
  }
  const actions=editorial.slice(0,-1).map((start,i)=>tape.keys.filter(e=>e.time>=start&&e.time<editorial[i+1]).map(e=>[e.time,e.key]));
  const h=boundaries.slice(0,-1).map((a,i)=>[a,boundaries[i+1],minimumHolds[i]+chapterSpeeds[i]*actions[i].length]);
  const timeline=TeachingHolds.make(h,pace);
  const keyEvents=actions.map((row,i)=>row.map(([at,key],j)=>({at,key,time:timeline.spans[i].voiceEnd+(.27+chapterSpeeds[i]*j)*pace})));
  function frame(t){
   const p=timeline.at(t), i=p.span.i, keys=keyEvents[i],active=keys.findLastIndex(k=>k.time<=t+1e-7);
   const key=keys[active]??keyEvents.slice(0,i).flat().at(-1);
   const led=active>=0&&t-keys[active].time<.42?keys[active].key:"";
   const c=deck?.captions[i], words=c?(p.speaking&&p.audioTime+1e-5>=c.startMs/1000&&p.audioTime<c.endMs/1000?c.text:""):(p.speaking?tape.captions[i]:"");
   const clock=t>=timeline.duration?tape.duration:i===0&&active<0?0:active>=0?keys[active].at:Math.max(0,...keyEvents.slice(0,i).flat().map(k=>k.at));
   return {i,p,words,clock,key:key?.key??"",led,keys,active};
  }
  return {timeline,frame,actions,keyEvents};
 }
 if(typeof module==="object"&&module.exports){module.exports={plan};return;}
 root.CT51Watch=Object.freeze({mount({tape,stage,render,inWatch}){
  const $=id=>document.getElementById(id), seek=$("seek"),play=$("play"),sound=$("sound"),overlay=$("start-overlay"),cc=$("cc");
  let media=null, release=null, deck=null, p=plan(tape),time=0, frame=0, running=false, pending=false,epoch=0, started=false, captioned=true, lastNotice="";
  let mode="screen";
  const pref="qb-calculator-watch-frame";try{if(localStorage.getItem(pref)==="full")mode="full";}catch{}
  const chrome=CalculatorWatchPlayer.mount({player:stage,surface:$("watch-surface"),play,seek,expand:$("fullscreen"),feedback:$("play-feedback"),active:inWatch});
  const format=t=>Math.floor(t/60)+":"+String(Math.floor(t)%60).padStart(2,"0");
  function framing(){
   stage.dataset.framing=mode;
   $("view-full").setAttribute("aria-pressed",String(mode==="full"));
   $("view-screen").setAttribute("aria-pressed",String(mode==="screen"));
  }
  function controls(){
   const name=running||pending?"Pause":time>=p.timeline.duration-.015?"Replay":"Play";
   play.title=name;play.setAttribute("aria-label",name);
   play.querySelector(".play-icon").toggleAttribute("hidden",name==="Pause");
   play.querySelector(".pause-icon").toggleAttribute("hidden",name!=="Pause");
   seek.max=p.timeline.duration;seek.value=time;
   const now=format(Math.min(Math.round(p.timeline.duration),Math.floor(time+.02))), end=format(Math.round(p.timeline.duration));
   $("clock").textContent=now+" / "+end;seek.setAttribute("aria-valuetext",now+" of "+end);
   overlay.hidden=started||time>.04||!inWatch();
   sound.hidden=!media;
   $("media-status").hidden=!!media;
   $("media-status").textContent=lastNotice||"Captioned rehearsal";
   $("caption").hidden=!captioned;
  }
  function draw(){controls();if(inWatch())render(p.frame(time));}
  function pause(){running=false;pending=false;epoch++;cancelAnimationFrame(frame);media?.pause();draw();}
  function failed(){
   if(!media)return;
   const old=p.timeline, resume=running||pending;
   pause();release?.();release=null;media=null;deck=null;captioned=true;
   cc.setAttribute("aria-pressed","true");cc.setAttribute("aria-label","Hide captions");
   p=plan(tape,null,+$("pace").value);time=p.timeline.remap(old,time);lastNotice="Narration unavailable. Captions only.";
   draw();if(resume)begin(false);
  }
  function current(seconds){if(media&&Number.isFinite(media.duration))media.currentTime=Math.min(seconds,media.duration);}
  async function begin(flash=true){
   if(!inWatch()||running||pending)return;
   if(time>=p.timeline.duration-.015){time=0;current(0);}
   const token=++epoch;started=true;
   if(document.activeElement===overlay)play.focus({preventScroll:true});
   if(flash)chrome.flash(true);
   const start=p.timeline.at(time), span=start.span, isVoice=start.speaking, a=media;
   const advance=()=>{if(token!==epoch||!inWatch())return;running=true;pending=false;const base=performance.now()-time*1000;
    function tick(now){
     if(token!==epoch||!running||!inWatch())return;
     const limit=isVoice?span.voiceEnd:span.end;
     let next=isVoice&&a?span.start+(a.currentTime-span.from):((now-base)/1000);
     if(next>=limit-.009||(isVoice&&a?.ended)){
      time=limit;a?.pause();running=false;draw();
      if(time<p.timeline.duration-.002)void begin(false);
      return;
     }
     time=Math.max(time,next);draw();frame=requestAnimationFrame(tick);
    }
    draw();frame=requestAnimationFrame(tick);
   };
   if(isVoice&&a){
    pending=true;draw();
    try{
     a.playbackRate=1;a.defaultPlaybackRate=1;current(start.audioTime);
     let timer;
     try{await Promise.race([a.play(),new Promise((_,no)=>{timer=setTimeout(()=>no(Error("play timeout")),2200);})]);}
     finally{clearTimeout(timer);}
     if(token!==epoch||!inWatch()){if(!inWatch()||(!running&&!pending)||!p.timeline.at(time).speaking)a.pause();return;}
    }catch{if(token===epoch)failed();return;}
   }
   advance();
  }
  function go(next){
   const resume=running||pending;pause();time=Math.min(p.timeline.duration,Math.max(0,Number(next)||0));current(p.timeline.at(time).audioTime);draw();if(resume)void begin(false);
  }
  play.onclick=()=>{if(running||pending){pause();chrome.flash(false);}else void begin();};
  overlay.onclick=()=>play.click();seek.oninput=()=>go(seek.value);
  $("pace").onchange=()=>{const old=p.timeline,resume=running||pending;pause();p=plan(tape,deck,+$("pace").value);time=p.timeline.remap(old,time);draw();if(resume)void begin(false);};
  cc.onclick=()=>{captioned=!captioned;cc.setAttribute("aria-pressed",String(captioned));cc.setAttribute("aria-label",captioned?"Hide captions":"Show captions");draw();};
  sound.onclick=()=>{if(!media)return;media.muted=!media.muted;sound.querySelector(".sound-waves").toggleAttribute("hidden",media.muted);sound.querySelector(".sound-off").toggleAttribute("hidden",!media.muted);sound.setAttribute("aria-label",media.muted?"Unmute":"Mute");};
  for(const f of ["full","screen"])$("view-"+f).onclick=()=>{mode=f;try{localStorage.setItem(pref,f);}catch{}framing();};
  document.addEventListener("visibilitychange",()=>{if(document.hidden)pause();});
  framing();
  return {pause,draw,goBeat:i=>go(p.timeline.spans[i].start),leave(){pause();chrome.clear();void chrome.exit();},attach(measured,a,dispose){
   if(measured.captions.length!==tape.captions.length||measured.captions.some((row,i)=>i&&row.startMs-measured.captions[i-1].endMs<150)){dispose();return;}
   const old=p.timeline,resume=running||pending;pause();media=a;release=dispose;deck=measured;p=plan(tape,deck,+$("pace").value);time=p.timeline.remap(old,time);current(p.timeline.at(time).audioTime);
   a.addEventListener("error",failed,{once:true});draw();if(resume)void begin(false);
  }};
 }});
})(globalThis);
