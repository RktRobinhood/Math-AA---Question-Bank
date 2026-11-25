"use strict";
// A measured manifest supplies times only. It cannot supply calculator keys or LCD states.
(function(root){
 const cueIds=Object.freeze(Array.from({length:9},(_,i)=>"41.0"+(i+1)));
 const titles=Object.freeze(["Start from the percentile","Open Inverse Normal","Enter the standard-normal inputs","Find the negative z-score","Recover the mean with Ans","Now find a standard deviation","Find the positive z-score","Recover the spread with Ans","If given the right tail"]);
 const localAudio=/^narration(?:-[a-z0-9]+(?:-[a-z0-9]+)*)?\.(?:mp3|wav|ogg|m4a)$/;
 const integer=n=>Number.isSafeInteger(n)&&n>=0;
 const object=o=>o!==null&&typeof o==="object"&&!Array.isArray(o);
 function decode(text,rehearsal){
  if(typeof text!=="string"||text.length>18000)return null;
  let r;try{r=JSON.parse(text);}catch{return null;}
  const {tape,deriveAnchors}=rehearsal;
  if(!object(r)||r.version!==1||r.lesson!=="CT41"||r.timing!=="measured-playback"||
    typeof r.audio!=="string"||!localAudio.test(r.audio)||!integer(r.durationMs)||r.durationMs<5000||r.durationMs>600000||
    !Array.isArray(r.cues)||r.cues.length!==cueIds.length||!object(r.keyTimesMs)||Object.keys(r.keyTimesMs).length!==tape.length)return null;
  const captions=[];
  for(let i=0;i<r.cues.length;i++){
   const c=r.cues[i];
   if(!object(c)||c.id!==cueIds[i]||!integer(c.startMs)||
      (i===0?c.startMs!==0:c.startMs<=r.cues[i-1].startMs)||c.startMs>=r.durationMs||
      typeof c.text!=="string"||!c.text.trim()||c.text.length>700)return null;
   captions.push(Object.freeze({id:c.id,t:c.startMs/1000,title:titles[i],text:c.text.trim()}));
  }
  const events=[];let previous=-100;
  for(const e of tape){
   if(!Object.hasOwn(r.keyTimesMs,e.id))return null;
   const t=r.keyTimesMs[e.id],start=r.cues[e.phase].startMs,stop=r.cues[e.phase+1].startMs;
   if(!integer(t)||t<previous+90||t<=start||t>=stop)return null;
   previous=t;events.push(Object.freeze({...e,t:t/1000}));
  }
  return Object.freeze({audio:r.audio,duration:r.durationMs/1000,captions:Object.freeze(captions),tape:Object.freeze(events),anchors:deriveAnchors(captions,events)});
 }
 function decodedTimeline(recorded,duration){
  if(!Number.isFinite(duration)||duration<=recorded.anchors.rightTailExplanation||Math.abs(duration-recorded.duration)>.12)return null;
  return Object.freeze({...recorded,duration});
 }
 // Preserve the same calculation, selected scene or post-result beat if a
 // pending recording is accepted/rejected after the viewer has been scrubbed.
 function remap(t,a,b){
  const mk=v=>[0,...v.tape.map(e=>e.t),v.anchors.problemB,v.anchors.rightTailExplanation,v.duration].sort((a,b)=>a-b);
  if(!Number.isFinite(t)||t<=0)return 0;
  if(t>=a.duration)return b.duration;
  const x=mk(a),y=mk(b),next=x.findIndex(v=>v>t),p=next-1;
  return y[p]+(t-x[p])*(y[next]-y[p])/(x[next]-x[p]);
 }
 root.NormalParameterMedia=Object.freeze({cueIds,decode,decodedTimeline,remap});
})(typeof window==="undefined"?globalThis:window);
