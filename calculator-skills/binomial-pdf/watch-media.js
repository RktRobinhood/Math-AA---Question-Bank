"use strict";
// CT37 optional recording manifest. Media never supplies calculator states or key IDs.
(function(root){
 const cueIds=Object.freeze(["37.01","37.02","37.03","37.04","37.05"]);
 const groups=Object.freeze([1,1,1,1,2,2,2,2,2,2,2,3,3]);
 const localAudio=/^narration(?:-[a-z0-9]+(?:-[a-z0-9]+)*)?\.(?:mp3|wav|ogg|m4a)$/;
 const plain=o=>o!==null&&typeof o==="object"&&!Array.isArray(o);
 const time=n=>Number.isSafeInteger(n)&&n>=0;
 function decode(text,tape){
  if(typeof text!=="string"||text.length>12000)return null;
  let raw;
  try{raw=JSON.parse(text);}catch{return null;}
  if(!plain(raw)||raw.version!==1||raw.lesson!=="CT37"||raw.timing!=="measured-playback"||
     typeof raw.audio!=="string"||!localAudio.test(raw.audio)||!time(raw.durationMs)||
     raw.durationMs<5000||raw.durationMs>600000||!Array.isArray(raw.cues)||raw.cues.length!==cueIds.length||
     !plain(raw.keyTimesMs)||Object.keys(raw.keyTimesMs).length!==groups.length||tape?.length!==groups.length)return null;
  const captions=[],starts=[];
  for(let i=0;i<raw.cues.length;i++){
   const c=raw.cues[i];
   if(!plain(c)||c.id!==cueIds[i]||!time(c.startMs)||c.startMs>=raw.durationMs||
      (i===0?c.startMs!==0:c.startMs<=raw.cues[i-1].startMs)||
      typeof c.text!=="string"||!c.text.trim()||c.text.length>600)return null;
   starts.push(c.startMs/1000);captions.push(c.text.trim());
  }
  let last=-1;
  const events=[];
  for(let i=0;i<tape.length;i++){
   const key=tape[i],phase=groups[i];
   if(!Object.hasOwn(raw.keyTimesMs,key.id))return null;
   const ms=raw.keyTimesMs[key.id];
   // A cue starts before its first key and ends after its last. This keeps
   // insertion, result, and the comparison overlay on their own visual steps.
   if(!time(ms)||ms<=last||ms<=raw.cues[phase].startMs||ms>=raw.cues[phase+1].startMs)return null;
   last=ms;events.push(Object.freeze({...key,timeMs:ms}));
  }
  return Object.freeze({audio:raw.audio,duration:raw.durationMs/1000,
   captions:Object.freeze(captions),starts:Object.freeze(starts),tape:Object.freeze(events)});
 }
 function decodedTimeline(recorded,duration){
  // Metadata governs the actual slider length; allow small container padding,
  // never missing dialogue or cues outside the local track.
  return Number.isFinite(duration)&&duration>Math.max(recorded.starts.at(-1),recorded.tape.at(-1).timeMs/1000)&&
   Math.abs(duration-recorded.duration)<=.12?{...recorded,duration}:null;
 }
 const markers=t=>[...t.starts,...t.tape.map(({timeMs})=>timeMs/1000),t.duration].sort((a,b)=>a-b);
 function remap(t,a,b){
  if(!Number.isFinite(t)||t<=0)return 0;
  if(t>=a.duration)return b.duration;
  const x=markers(a),y=markers(b);
  const i=x.findIndex(at=>at>t);
  if(i<=0)return Math.min(t,b.duration);
  return y[i-1]+(t-x[i-1])*(y[i]-y[i-1])/(x[i]-x[i-1]);
 }
 root.BinomialPdfMedia=Object.freeze({decode,decodedTimeline,remap,cueIds});
})(typeof window==="undefined"?globalThis:window);
