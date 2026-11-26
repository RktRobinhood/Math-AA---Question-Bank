/* Standalone caption-only teaching pace. These are authoring beats, not
   measured voice times; use the signed recording package for actual audio. */
window.CT40WatchPlan = (() => {
 const original=InverseNormalRehearsal;
 const reads=[6,6.2,5.6,3.8,5.3,8,3.7];
 const holds=[2,6,11.1,5.5,3.5,11,5.5];
 const slots=[[],[.7,1.9,3.1,4.3],[.55,1.25,1.95,2.65,3.6,4.55,5.25,6.2,7.15,8.1],[.8,2.8],[],
  [.65,1.4,2.15,2.9,3.85,4.5,5.15,5.95,6.65,7.3,8.1,8.85,9.6],[.8,2.8]];
 const tips=[
  'The area is known. The calculator finds the cutoff, not another probability.',
  'Follow Menu → 5: Probability → 5: Distributions → 3: Inverse Normal.',
  'Area always means the area to the left. Enter 8 for the standard deviation.',
  'The first Enter inserts the command. The second Enter evaluates it.',
  'The whole area is 1, so the left area is 1 − 0.10 = 0.90.',
  'Use 0.90, not 0.10. The model still has mean 50 and standard deviation 8.',
  'The answer is a cutoff, in the units of X.'
 ];
 function make(scale=1){
  let cursor=0;
  const layout=TeachingHolds.make(reads.map((len,i)=>{const t=cursor;cursor+=len;return[t,cursor,holds[i]];}),scale);
  const cues=original.cues.map((c,i)=>({...c,startMs:Math.round(layout.spans[i].start*1000)}));
  const group=Array(reads.length).fill(0);
  const tape=original.tape.map(e=>{
   const s=layout.spans[e.phase],j=group[e.phase]++;
   return {...e,timeMs:Math.round((s.voiceEnd+slots[e.phase][j]*scale)*1000)};
  });
  return InverseNormalMedia.compose({duration:layout.duration,cues,tape,markersMs:{tailContext:cues[4].startMs},layout,tips});
 }
 return Object.freeze({make});
})();
