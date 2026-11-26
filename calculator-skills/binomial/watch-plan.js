/* Visual holds for the original, unchanged George recording.
   Internal audio cuts are measured inside the original MP3's quiet gaps
   (silencedetect -45 dB); the end is the signed decoded duration. */
window.CT38WatchPlan=(()=>{
 // TI KB 29570 documents the direct E shortcut; do not simulate a
 // pre-highlighted Binomial Pdf list and an additional selection Enter.
 const original=HandheldKeyCues.CT38;
 const tape=Object.freeze([...original.slice(0,3),{...original[4],key:"e"},...original.slice(5)]);
 // [voice from, voice to, teaching hold, first key index, timings in hold]
 const parts=[
  [0,6.40,2.6,0,[]],                                      // identify the event
  [6.40,14.20,7.7,0,[.55,2.0,3.45,5.05]],                  // Menu → 5 → 5 → E
  [14.20,20.28,16.2,4,[.65,1.4,2.7,3.6,4.35,5.1,5.85,7.2,8.23,9.55,10.45,11.2,12.65]],
  [20.28,23.10,6.2,17,[.65,3.1]],                         // Enter inserts, Enter evaluates
  [23.10,27.82,1.9,19,[]],                                // at least, 5–12
  [27.82,31.55,4.0,19,[]],                                // at most, 0–5
  [31.55,34.87,2.2,19,[]],                                // strict excludes its boundary
  [34.87,39.079,4.5,19,[]]                                // more than 5, 6–12
 ];
 const chapter=[0,1,2,3,3,3,4,4], entry=[0,1,2,3,6];
 const tips=[
  'Count whole-number successes. Keep the first and last counts in the event.',
  'Follow the lit keys: Menu → 5 → 5 → E.',
  'The first two fields describe the model. The last two fields describe the event.',
  'The first Enter inserts the command. The second Enter calculates it.',
  'At least five includes 5 through 12. No count can exceed 12 trials.',
  'At most five includes 0 through 5. These bounds are shown, not calculated.',
  'A strict inequality is different: more than five does not include 5.',
  'More than five starts at 6. These bounds are shown, not calculated.'
 ];
 const words=[
  'Before opening the calculator, identify the first and last whole-number counts that belong in the event.',
  'On a Calculator page, open Probability, then Distributions, and choose Binomial C D F.',
  'Enter the trial count and success probability, followed by the lower and upper success counts.',
  'The calculator includes both bounds.',
  'For an at-least question, the upper bound is the total number of trials.',
  'For an at-most question, the lower bound is zero.',
  'A strict inequality leaves its boundary out.',
  'Move to the next included whole number before you enter the bounds.'
 ];
 const spokenAt=[0,6.868,14.647,20.641,23.361,28.089,31.851,35.192];
 const name=k=>({menu:'Menu',down:'↓',enter:'Enter',tab:'Tab',decimal:'.',e:'E'}[k]||k);
 function visual(point){
  const i=point.span.i, [,,hold,first,keys]=parts[i];
  const elapsed=point.speaking?-1:point.fraction*hold;
  const ix=keys.findLastIndex(at=>at<=elapsed), last=first+ix;
  return {i,last,current:ix>=0&&elapsed<keys[ix]+.60?tape[last]?.key:null,example:i>=7?2:i>=5?1:0};
 }
 return Object.freeze({make:scale=>TeachingHolds.make(parts,scale),visual,chapter,entry,tips,words,spokenAt,name,tape});
})();
