"use strict";
// A reviewed recording supplies measured captions and timing, never new device actions.
(function(root){
 const audioName=/^narration(?:-[a-z0-9]+(?:-[a-z0-9]+)*)?\.(?:mp3|wav|ogg|m4a)$/;
 const plain=o=>o!==null&&typeof o==="object"&&!Array.isArray(o);
 const ms=n=>Number.isSafeInteger(n)&&n>=0;
 const beatCues=[0,2,5,8,11], results=[4,7,10,13];
 const cueId=i=>"watch-"+String(i+1).padStart(2,"0"), keyId=i=>"key-"+String(i+1).padStart(2,"0");
 function decode(text,script){
  if(typeof text!=="string"||text.length>25000)return null;
  let raw;try{raw=JSON.parse(text);}catch{return null;}
  if(!plain(raw)||raw.version!==1||raw.lesson!=="CT42"||raw.timing!=="measured-playback"||
     typeof raw.audio!=="string"||!audioName.test(raw.audio)||!ms(raw.durationMs)||raw.durationMs>600000||raw.durationMs<8000||
     !Array.isArray(raw.cues)||raw.cues.length!==script.clips.length||!plain(raw.keyTimesMs)||
     Object.keys(raw.keyTimesMs).length!==script.keys.length)return null;
  for(let i=0;i<raw.cues.length;i++){
   const cue=raw.cues[i];
   if(!plain(cue)||cue.id!==cueId(i)||!ms(cue.startMs)||
      (i===0?cue.startMs!==0:cue.startMs<=raw.cues[i-1].startMs)||
      typeof cue.text!=="string"||!cue.text.trim()||cue.text.length>600)return null;
  }
  if(raw.durationMs-raw.cues.at(-1).startMs<300)return null;
  let previous=-1, group=0;
  const keys=[];
  for(let i=0;i<script.keys.length;i++){
   const action=script.keys[i],id=keyId(i),time=raw.keyTimesMs[id];
   // Keep typed keys in the matching section and every Enter strictly
   // before the result is spoken. No numerical answer can leak via timing.
   const first=raw.cues[beatCues[group+1]].startMs, result=raw.cues[results[group]].startMs;
   if(!Object.hasOwn(raw.keyTimesMs,id)||!ms(time)||time<=previous||time<first||time>=result)return null;
   keys.push(Object.freeze({...action,at:time/1000}));
   previous=time;if(action.type==="evaluate")group++;
  }
  const clips=raw.cues.map(c=>Object.freeze([c.startMs/1000,c.text.trim()]));
  return Object.freeze({audio:raw.audio,duration:raw.durationMs/1000,clips:Object.freeze(clips),
   starts:Object.freeze(beatCues.map(i=>clips[i][0])),keys:Object.freeze(keys),titles:script.titles});
 }
 function actual(deck,duration){
  if(!Number.isFinite(duration)||Math.abs(duration-deck.duration)>.12||duration-deck.clips.at(-1)[0]<.18)return null;
  return Object.freeze({...deck,duration});
 }
 function remap(t,a,b){
  if(t<=0)return 0;
  if(t>=a.duration)return b.duration;
  const i=a.clips.findLastIndex(([start])=>start<=t), from=a.clips[i][0], to=b.clips[i][0];
  const nextA=a.clips[i+1]?.[0]??a.duration,nextB=b.clips[i+1]?.[0]??b.duration;
  return to+(t-from)*(nextB-to)/(nextA-from);
 }
 root.CT42Media=Object.freeze({decode,actual,remap,cueId,keyId});
})(typeof window==="undefined"?globalThis:window);
