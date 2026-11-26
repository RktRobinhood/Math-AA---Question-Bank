/* Piecewise Watch time: audio slices at their original speed, interleaved
   with authored teaching holds. No speech-derived key timing. */
(function(root){
'use strict';
function make(beats,multiplier=1){
 let cursor=0;
 const spans=beats.map((beat,i)=>{
  const [from,to,hold]=beat;
  if(![from,to,hold].every(Number.isFinite)||from<0||to<=from||hold<0||!Number.isFinite(multiplier)||multiplier<=0||
     (i&&Math.abs(from-beats[i-1][1])>1e-6))throw Error('Invalid Watch beat');
  const start=cursor,voiceEnd=start+to-from,end=voiceEnd+hold*multiplier;cursor=end;
  return Object.freeze({i,from,to,start,voiceEnd,end});
 });
 function at(t){
  const position=Math.max(0,Math.min(cursor,Number(t)||0));
  const span=spans.find(s=>position<s.end)||spans.at(-1);
  if(!span)return null;
  const speaking=position<span.voiceEnd;
  const fraction=speaking?(position-span.start)/(span.voiceEnd-span.start):
    (position-span.voiceEnd)/Math.max(.001,span.end-span.voiceEnd);
  return {span,speaking,fraction,audioTime:Math.min(span.to,span.from+position-span.start)};
 }
 function remap(old,position){
  const p=old.at(position);
  const s=spans[p.span.i];
  return p.speaking?s.start+(s.voiceEnd-s.start)*p.fraction:s.voiceEnd+(s.end-s.voiceEnd)*p.fraction;
 }
 return Object.freeze({spans,duration:cursor,at,remap});
}
root.TeachingHolds=Object.freeze({make});
})(globalThis);
