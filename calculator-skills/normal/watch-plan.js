/* CT39 caption-only rehearsal. Silence and reading time are authored
   separately from the physical key tape; do not use these as audio timings. */
window.CT39WatchPlan = (() => {
 const plan=CT39Voice.sheet;
 const read=[4.9,6.4,4.3,5.5,3.4,6.8,7.2,3.4];
 const slots=[[],[.6,1.8,3,4.2],[.55,1.3,2.2,3,3.75,4.65],[.6,1.4,2.4,3.3,4.3],
  [.7,2.8],[.65,1.85,3.05,4.25],[.6,1.35,2.3,3.35,4.25,5,5.95,6.9,7.85],[.7,2.8]];
 const holds=[2.3,5.9,6.2,6,5.9,5.9,9.4,6.2];
 const resultCopy={4:'The probability is about zero point seven seven five.',7:'The upper-tail probability is about zero point one five nine.'};
 const why=['Shade the interval first so you know which area to calculate.','Follow Menu → 5: Probability → 5: Distributions → 2: Normal Cdf.','The smaller x-value is the lower bound.','Enter σ = 2. The variance is σ² = 4, but the calculator needs σ.',
  'The first Enter inserts the command. The second Enter evaluates it.','The new example starts at 22 and includes the area to its right.','Leave ∞ as the upper bound: there is no finite upper endpoint.','Read the probability as an area, not a height.'];
 function make(scale=1){
  let from=0;
  const layout=TeachingHolds.make(read.map((len,i)=>{const t=from;from+=len;return[t,from,holds[i]];}),scale);
  const captions=[],keys=[],states={},chapters=[];
  layout.spans.forEach((span,i)=>{
   const row=plan[i], marked=row.text.indexOf(resultCopy[i]??'\u0000');
   const text=marked<0?row.text:row.text.slice(0,marked).trimEnd();
   chapters.push({title:row.title,t:span.start});
   captions.push({t:span.start,until:span.voiceEnd,title:row.title,text});
   if(marked>=0){const t=span.voiceEnd+(slots[i].at(-1)+.42)*scale;captions.push({t,until:span.end,title:row.title,text:resultCopy[i]});}
   const local=row.keys.map((key,j)=>[span.voiceEnd+slots[i][j]*scale,key]);
   keys.push(...local);
   for(const [name,j] of row.events)states[name]=j===null?span.start:local[j][0];
  });
  return {measured:false,duration:layout.duration,layout,chapters,captions,keys,states,why,transcript:plan.map(c=>c.text).join(' ')};
 }
 return Object.freeze({make});
})();
