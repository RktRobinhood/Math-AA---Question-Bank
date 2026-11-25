"use strict";
// Optional local audio. A manifest can time fixed educational events, not redefine device actions.
(function(root){
 const localAudio=/^narration(?:-[a-z0-9]+(?:-[a-z0-9]+)*)?\.(?:mp3|wav|ogg|m4a)$/;
 const plain=o=>o!==null&&typeof o==="object"&&!Array.isArray(o);
 const integer=n=>Number.isSafeInteger(n)&&n>=0;
 function compose(data){
  const starts=data.cues.map(c=>c.startMs/1000),timing=Object.fromEntries(data.tape.map(e=>[e.id,e.timeMs/1000]));
  const landmarks=data.cues.flatMap((c,i)=>[
   starts[i],...(i===4?[data.markersMs.tailContext/1000]:[]),...data.tape.filter(e=>e.phase===i).map(e=>e.timeMs/1000)
  ]).concat(data.duration);
  return Object.freeze({...data,starts:Object.freeze(starts),timing:Object.freeze(timing),landmarks:Object.freeze(landmarks)});
 }
 function decode(text,rehearsal){
  if(typeof text!=="string"||text.length>16500)return null;
  let raw;
  try{raw=JSON.parse(text);}catch{return null;}
  if(!plain(raw)||raw.version!==1||raw.lesson!=="CT40"||raw.timing!=="measured-playback"||
     typeof raw.audio!=="string"||!localAudio.test(raw.audio)||!integer(raw.durationMs)||raw.durationMs<5000||raw.durationMs>600000||
     !Array.isArray(raw.cues)||raw.cues.length!==rehearsal.cues.length||
     !plain(raw.keyTimesMs)||Object.keys(raw.keyTimesMs).length!==rehearsal.tape.length||
     !plain(raw.markersMs)||Object.keys(raw.markersMs).length!==1||!Object.hasOwn(raw.markersMs,"tailContext"))return null;
  for(let i=0;i<raw.cues.length;i++){
   const c=raw.cues[i];
   if(!plain(c)||c.id!==rehearsal.cues[i].id||!integer(c.startMs)||c.startMs>=raw.durationMs||
      (i===0?c.startMs!==0:c.startMs<=raw.cues[i-1].startMs)||
      typeof c.text!=="string"||!c.text.trim()||c.text.length>600)return null;
  }
  const tailContext=raw.markersMs.tailContext;
  if(!integer(tailContext)||tailContext<raw.cues[4].startMs||tailContext>=raw.cues[5].startMs)return null;
  let prev=-1;
  const tape=[];
  for(const e of rehearsal.tape){
   if(!Object.hasOwn(raw.keyTimesMs,e.id))return null;
   const ms=raw.keyTimesMs[e.id],start=raw.cues[e.phase].startMs,end=raw.cues[e.phase+1]?.startMs??raw.durationMs;
   if(!integer(ms)||ms<=prev||ms<start||ms>=end)return null;
   prev=ms;tape.push(Object.freeze({...e,timeMs:ms}));
  }
  return compose({
   duration:raw.durationMs/1000,audio:raw.audio,
   cues:Object.freeze(raw.cues.map((c,i)=>Object.freeze({...rehearsal.cues[i],startMs:c.startMs,text:c.text.trim()}))),
   tape:Object.freeze(tape),markersMs:Object.freeze({tailContext})
  });
 }
 function decodedTimeline(recorded,duration){
  // Actual decoder length controls end/seek. A small container pad is fine, cutting off cues is not.
  if(!Number.isFinite(duration)||duration<=recorded.tape.at(-1).timeMs/1000||
     Math.abs(duration-recorded.duration)>.12)return null;
  return compose({...recorded,duration});
 }
 function remap(t,a,b){
  if(t<=0)return 0;
  if(t>=a.duration)return b.duration;
  const x=a.landmarks,y=b.landmarks,i=x.findIndex(u=>t<u);
  if(i<1)return Math.min(t,b.duration);
  return y[i-1]+(t-x[i-1])*(y[i]-y[i-1])/(x[i]-x[i-1]);
 }
 root.InverseNormalMedia=Object.freeze({compose,decode,decodedTimeline,remap});
})(typeof window==="undefined"?globalThis:window);
