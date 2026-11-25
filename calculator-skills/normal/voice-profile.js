/* Deterministic CT39 media/rehearsal profiles. No DOM, media synthesis or network access. */
(function(root,factory){
 'use strict';
 const out=factory();
 if(typeof module==='object'&&module.exports)module.exports=out;
 else root.CT39Voice=out;
})(globalThis,()=>{
 'use strict';
 const menu=['menu','5','5','2'];
 const fields=['1','8','tab','2','3','tab','2','0','tab','2','tab'];
 const upper=['2','2','tab','tab','2','0','tab','2','tab'];
 const sheet=[
  ['39.01','Shade the interval','Shade the area you want. Here, it’s between eighteen and twenty-three.',[],[['range-context',null]]],
  ['39.02','Open Normal Cdf','On a Calculator page, press Menu. Choose Probability, then Distributions, then Normal C D F.',menu,[['range-wizard',3]]],
  ['39.03','Enter both bounds','The lower bound is eighteen. The upper bound is twenty-three.',fields.slice(0,6),[]],
  ['39.04','Enter the model','Enter the mean, twenty. Then the standard deviation, two. Use two, not the variance of four.',fields.slice(6),[]],
  ['39.05','Evaluate the interval','Confirm the dialog. Press Enter again to calculate. The probability is about zero point seven seven five.',['enter','enter'],[['range-command',0],['range-result',1]]],
  ['39.06','Switch to the upper tail','Now shade the upper tail, beyond twenty-two. Open Menu, then Probability, Distributions, and Normal C D F again.',menu,[['tail-context',null],['tail-wizard',3]]],
  ['39.07','Set the tail bounds','Enter twenty-two as the lower bound. Leave the upper bound at infinity. Keep the mean at twenty and the standard deviation at two.',upper,[]],
  ['39.08','Evaluate the tail','Confirm, then press Enter again. The upper-tail probability is about zero point one five nine.',['enter','enter'],[['tail-command',0],['tail-result',1]]]
 ].map(([id,title,text,keys,events])=>Object.freeze({id,title,text,keys:Object.freeze([...keys]),events:Object.freeze(events.map(v=>Object.freeze([...v])))}));
 Object.freeze(sheet);
 const fail=msg=>{throw new Error(msg);};
 const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
 const ms=v=>Number.isSafeInteger(v)&&v>=0;
 const normText=s=>typeof s==='string'?s.trim().replace(/[‘’]/g,"'").replace(/\s+/g,' '):'';
 const format='ct39-measured-cues-v1', toleranceMs=125;
 function validate(data){
  if(!object(data)||data.format!==format||data.lesson!=='CT39'||!object(data.media))fail('Expected a CT39 measured-cue v1 manifest.');
  const {file,durationMs,sha256}=data.media;
  if(file!=='narration.mp3'||!ms(durationMs)||durationMs<1000||durationMs>180000||typeof sha256!=='string'||!/^[a-f0-9]{64}$/.test(sha256)||/^([a-f0-9])\1{63}$/.test(sha256))fail('Invalid local media identity.');
  if(!Array.isArray(data.cues)||data.cues.length!==sheet.length)fail('Expected all eight narration cues.');
  const captions=[],keys=[],states={};
  let end=null,priorKey=-Infinity;
  for(let i=0;i<sheet.length;i++){
   const expected=sheet[i],cue=data.cues[i];
   if(!object(cue)||cue.id!==expected.id||normText(cue.text)!==normText(expected.text))fail('Wrong cue id or copy at '+expected.id+'.');
   const {startMs,endMs}=cue;
   if(!ms(startMs)||!ms(endMs)||endMs<=startMs||endMs>durationMs||end!==null&&startMs!==end||i===0&&startMs>2500)fail('Invalid caption interval at '+expected.id+'.');
   end=endMs;captions.push({t:startMs/1000,until:endMs/1000,title:expected.title,text:expected.text});
   if(!Array.isArray(cue.keys)||cue.keys.length!==expected.keys.length)fail('Incorrect key count at '+expected.id+'.');
   for(let j=0;j<expected.keys.length;j++){
    const key=cue.keys[j],k=expected.keys[j];
    if(!object(key)||key.key!==k||!ms(key.timeMs)||key.timeMs<startMs||key.timeMs>=endMs||key.timeMs<priorKey+55)fail('Invalid key order or time at '+expected.id+' #'+(j+1)+'.');
    priorKey=key.timeMs;keys.push([key.timeMs/1000,k]);
   }
   if(!Array.isArray(cue.lcdEvents)||cue.lcdEvents.length!==expected.events.length)fail('Invalid locked event count at '+expected.id+'.');
   for(let j=0;j<expected.events.length;j++){
    const [name,keyIndex]=expected.events[j],event=cue.lcdEvents[j];
    if(!object(event)||event.state!==name||!ms(event.timeMs)||event.timeMs<startMs||event.timeMs>=endMs)fail('Invalid named transition '+name+'.');
    if(keyIndex!==null&&event.timeMs!==cue.keys[keyIndex].timeMs)fail(name+' must coincide with its physical key.');
    if(name==='range-context'&&event.timeMs!==startMs)fail('Range context must start with the first phrase.');
    if(name==='tail-context'&&(event.timeMs>startMs+1000||event.timeMs>=cue.keys[0].timeMs))fail('Tail context must begin with the next example, before its menu.');
    states[name]=event.timeMs/1000;
   }
  }
  if(end!==durationMs||durationMs-priorKey<250)fail('Last result must be held through the end of the take.');
  return freezeProfile({measured:true,file,duration:durationMs/1000,sha256,captions,keys,states});
 }
 function freezeProfile(p){
  return Object.freeze({...p,keys:Object.freeze(p.keys.map(a=>Object.freeze([...a]))),captions:Object.freeze(p.captions.map(c=>Object.freeze({...c}))),states:Object.freeze({...p.states})});
 }
 function rehearsal(fallback){
  const [m,p,d,w,f,ok,e]=fallback.anchors, keyTape=[[m,'menu'],[p,'5'],[d,'5'],[w,'2']];
  fields.forEach((key,i)=>keyTape.push([f+(ok-f-.42)*i/fields.length,key]));
  keyTape.push([ok,'enter'],[e,'enter']);
  [...menu,...upper,'enter','enter'].forEach((key,i)=>keyTape.push([fallback.tail.actionTimes[i],key]));
  const x=fallback.tail;
  return freezeProfile({measured:false,duration:fallback.duration,captions:fallback.captions,keys:keyTape,states:{
   'range-context':0,'range-wizard':w,'range-command':ok,'range-result':e,
   'tail-context':x.contextAt,'tail-wizard':x.actionTimes[3],'tail-command':x.actionTimes[13],'tail-result':x.actionTimes[14]
  }});
 }
 function mediaDurationMatches(profile,secs){return profile.measured&&Number.isFinite(secs)&&Math.abs(secs*1000-profile.duration*1000)<=toleranceMs+1e-6;}
 function frameAt(profile,t){
  const lastKey=profile.keys.findLastIndex(([at])=>at<=t);
  const entry=profile.keys[lastKey],highlight=entry&&t-entry[0]<(entry[1]==='tab'?.38:.31)?entry[1]:'';
  const caption=profile.captions.findLastIndex(c=>c.t<=t);
  const phase=t>=profile.states['tail-context']?'tail':'range';
  return {lastKey,highlight,caption,phase};
 }
 function toRehearsal(measured,fallback,time,actual=measured.duration){
  if(!measured.measured)return Math.min(fallback.duration,Math.max(0,time));
  const anchors=[[0,0],...measured.keys.map(([t],i)=>[t,fallback.keys[i][0]]),
    [measured.states['tail-context'],fallback.states['tail-context']],[actual,fallback.duration]];
  anchors.sort((a,b)=>a[0]-b[0]);
  const t=Math.min(actual,Math.max(0,Number.isFinite(time)?time:0));
  const i=anchors.findLastIndex(([a])=>a<=t);
  const [a,x]=anchors[Math.max(0,i)], next=anchors[i+1];
  return !next?x:x+(next[1]-x)*(t-a)/(next[0]-a);
 }
 return Object.freeze({sheet,format,toleranceMs,validate,rehearsal,mediaDurationMatches,frameAt,toRehearsal});
});
