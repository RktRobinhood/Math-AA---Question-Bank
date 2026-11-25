/* Caption rehearsal: times are authored beats, not speech timings. State comes from the same physical events as Try. */
(function(host){
 'use strict';
 const duration=31.8;
 const chapters=[
  [0,'Choose from the requested units','Given sin θ = 0.6, find the principal angle in degrees. Check the angle mode first.'],
  [3.4,'Open Document Settings','Press Home, then 5: Settings and 2: Document Settings.'],
  [7.1,'Apply Degree mode','Tab to Angle, press Right, select Degree, then tab to OK and confirm.'],
  [13.1,'Select inverse sine','Return to the current document. Press trig and choose sin⁻¹, not sin.'],
  [18.5,'Enter the ratio','Enter 0.6 and press Enter. Inverse sine turns a ratio into an angle, not its reciprocal.'],
  [25,'Read the principal angle','The display is in degrees. The calculator gives one principal angle; check the range for other solutions.'],
 ];
 const keys=[[3.65,'home'],[4.58,'5'],[5.6,'2'],[7.34,'tab'],[8.10,'right'],[8.77,'down'],[9.45,'enter'],
 [10.06,'tab'],[10.37,'tab'],[10.68,'tab'],[10.99,'tab'],[11.31,'tab'],[11.94,'enter'],
 [13.42,'4'],[14.3,'trig'],[15.78,'down'],[16.65,'enter'],[18.86,'0'],[19.27,'dot'],[19.68,'6'],[20.54,'enter']];
 function snapshot(time){
  let state=host.CT02Model.create(),key='';
  for(const [at,code] of keys){if(at>time)break;state=host.CT02Model.press(state,code);if(time<at+.245)key=code;else key='';}
  return{state,key,chapter:chapters.findLastIndex(c=>c[0]<=time)};
 }
 host.CT02Tape=Object.freeze({duration,chapters,keys,snapshot});
})(typeof window==='undefined'?globalThis:window);
