"use strict";
// This opt-in route validates the existing signed Paperclip bundle without editing it.
(function(){
 const cfg=document.currentScript.dataset, SHA=/^[0-9a-f]{64}$/, file=/^narration(?:-[a-z0-9]+(?:-[a-z0-9]+)*)?\.(mp3|ogg|m4a|wav)$/;
 const mime={mp3:"audio/mpeg",ogg:"audio/ogg",m4a:"audio/mp4",wav:"audio/wav"};
 async function read(url,limit,hash){
  const r=await fetch(url,{cache:"no-cache"});if(!r.ok)throw Error("asset unavailable");
  const bytes=await r.arrayBuffer();if(bytes.byteLength>limit||!bytes.byteLength)throw Error("asset length");
  if(hash){
   const actual=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes)),n=>n.toString(16).padStart(2,"0")).join("");
   if(actual!==hash)throw Error("digest mismatch");
  }
  return bytes;
 }
 const base=new URL("../paperclip-audio/lessons/",location.href);
 const parse=bytes=>JSON.parse(new TextDecoder().decode(bytes));
 function verify(pack,cue,transcript){
  const times=new Set([0,44000,...(cue.watch?.captionCues||[]).map(c=>c.startMs)]);
  for(const c of cue.watch?.authoredTape||[])for(const k of c.keys||[])times.add(k.timeMs);
  for(const c of cue.watch?.displayKeyStateChanges||[])if(c.keys?.length)times.add(c.timeMs);
  for(const c of cue.watch?.pointerStateChanges||[])times.add(c.timeMs);
  if(cue.id!==cfg.lesson||cue.watch?.sliderEndAtExtractionMs!==44000||cue.spokenCues?.length!==7||pack.captions?.length!==7||
     transcript.trim()!==cue.spokenCues.map(c=>c.text.trim()).join("\n"))throw Error("signature scope");
  let prevAudio=-1,prevEdit=-1;
  if(!Array.isArray(pack.anchors)||pack.anchors.length>600)throw Error("anchors");
  for(const row of pack.anchors){
   if(!Number.isSafeInteger(row.audioMs)||!Number.isSafeInteger(row.editorialMs)||row.audioMs<=prevAudio||row.editorialMs<=prevEdit||
     row.audioMs>pack.durationMs||row.editorialMs>44000)throw Error("anchor ordering");
   prevAudio=row.audioMs;prevEdit=row.editorialMs;times.delete(row.editorialMs);
  }
  if(pack.anchors[0]?.audioMs!==0||pack.anchors[0]?.editorialMs!==0||prevAudio!==pack.durationMs||prevEdit!==44000||
    [...times].some(t=>Number.isSafeInteger(t)&&t>=0&&t<=44000))throw Error("missing source anchors");
  let prevEnd=0;
  const cuts=[0];
  const captions=pack.captions.map((a,i)=>{
   if(!Number.isSafeInteger(a.startMs)||!Number.isSafeInteger(a.endMs)||a.id!==cue.spokenCues[i].id||
     a.startMs<prevEnd||a.endMs-a.startMs<300||a.endMs>pack.durationMs)throw Error("caption ordering");
   // A cut must be inside measured silence, not synthetic speech retiming.
   if(i){if(a.startMs-prevEnd<150)throw Error("no measured inter-line hold");cuts.push((a.startMs+prevEnd)/2000);}
   prevEnd=a.endMs;return {...a,text:cue.spokenCues[i].text};
  });
  cuts.push(pack.durationMs/1000);
  return {cuts,captions};
 }
 async function load(){
  const pack=parse(await read(new URL("narration.sync.json",location.href),500000));
  if(pack.status!=="measured"||pack.version!==1||pack.lesson!==cfg.lesson||
   pack.cueMapSha256!==cfg.cueSha||pack.transcriptSha256!==cfg.transcriptSha||!SHA.test(pack.audioSha256)||
   !file.test(pack.audio)||!Number.isSafeInteger(pack.durationMs)||pack.durationMs<8000||pack.durationMs>600000)return null;
  const [cueBytes,textBytes,audioBytes]=await Promise.all([
   read(new URL(cfg.lesson+".cues.json",base),500000,cfg.cueSha),read(new URL(cfg.lesson+".txt",base),50000,cfg.transcriptSha),
   read(new URL(pack.audio,location.href),16000000,pack.audioSha256)
  ]);
  const data=verify(pack,parse(cueBytes),new TextDecoder().decode(textBytes));
  const audio=document.createElement("audio"),url=URL.createObjectURL(new Blob([audioBytes],{type:mime[file.exec(pack.audio)[1]]}));
  audio.hidden=true;audio.preload="metadata";audio.defaultPlaybackRate=1;audio.playbackRate=1;
  try{
   await new Promise((resolve,reject)=>{
    const end=()=>{clearTimeout(timer);resolve();},fail=()=>{clearTimeout(timer);reject(Error("media unavailable"));};
    const timer=setTimeout(fail,7000);
    audio.addEventListener("loadedmetadata",end,{once:true});audio.addEventListener("error",fail,{once:true});audio.src=url;
   });
   if(Math.abs(audio.duration*1000-pack.durationMs)>120)throw Error("duration mismatch");
   return {...data,audio,release:()=>URL.revokeObjectURL(url)};
  }catch(e){URL.revokeObjectURL(url);throw e;}
 }
 window.CT28Media=Object.freeze({load});
})();
