/* Caption-led replay. The status indicator on a CX II toggles RAD/DEG on a touchpad click.
   Times are illustration cues, not voice timings. */
(function(host){
 'use strict';
 const duration=31.8;
 const chapters=[
  [0,'Choose the units','Find the principal angle for sin θ = 0.6 in degrees. Check the top-right RAD or DEG label.'],
  [3.4,'Click RAD','Use the touchpad to move the pointer to RAD. Click the touchpad centre. RAD changes to DEG.'],
  [8.6,'Choose inverse sine','Press trig. Move down to sin⁻¹ and press Enter. The superscript −1 means inverse, not reciprocal.'],
  [14.3,'Enter the ratio','Type 0.6 and press Enter. Inverse sine takes a ratio and gives an angle.'],
  [21.7,'Read the principal angle','About 36.87°. That’s one principal angle. If asked for all solutions, check the whole interval.'],
 ];
 const keys=[[6.05,'angle'],[9.30,'trig'],[10.95,'down'],[12.02,'enter'],[15.0,'0'],[15.46,'dot'],[15.95,'6'],[17.25,'enter']];
 function snapshot(time){
  let state=host.CT02Model.create(),key='',last='';
  for(const [at,code] of keys){if(at>time)break;
   state=code==='angle'?host.CT02Model.toggleAngle(state):host.CT02Model.press(state,code);
   key=time<at+.32?code:'';last=code;
  }
  return{state,key,last,chapter:chapters.findLastIndex(c=>c[0]<=time)};
 }
 function pointer(time){
  if(time<4.2||time>=7.9)return null;
  return {progress:Math.min(1,(time-4.2)/1.52),at:time>=5.68,clicked:time>=6.05};
 }
 host.CT02Tape=Object.freeze({duration,chapters,keys,snapshot,pointer});
})(typeof window==='undefined'?globalThis:window);
