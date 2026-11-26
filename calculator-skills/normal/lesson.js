'use strict';
(function(){
const $=id=>document.getElementById(id), {normalMass,density}=globalThis.NspireNormal;
const demo={mean:20,sd:2,lower:18,upper:23}, task={mean:20,sd:2,lower:23,upper:Infinity};
const defaults=['−∞','∞','0','1'], fields=['Lower Bound','Upper Bound','μ','σ'];
const menuItems={
 top:[['1','Actions'],['2','Number'],['3','Algebra'],['4','Calculus'],['5','Probability','probability'],['6','Statistics','statistics']],
 probability:[['1','Factorial'],['2','Permutations'],['3','Combinations'],['4','Random'],['5','Distributions','distributions']],
 statistics:[['1','Stat Calculations'],['2','Stat Results'],['3','List Math'],['4','List Operations'],['5','Distributions','distributions']],
 distributions:[['1','Normal Pdf'],['2','Normal Cdf','wizard'],['3','Inverse Normal'],['4','t Pdf'],['5','t Cdf']]
};
const base=()=>({page:'idle',branch:'probability',selected:0,field:0,values:defaults.slice(),replace:true,previous:'',answer:''});
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const show=n=>String(Number(n.toPrecision(7))).replace(/-/g,'−');
const bound=n=>n===Infinity?'∞':n===-Infinity?'−∞':show(n);
const fmtAnswer=n=>n===0?'≈0 (below display range)':String(Number(n.toPrecision(6)));
const rawBound=n=>n===Infinity?'∞':n===-Infinity?'−∞':String(n).replaceAll('-','−');
const parse=(val,allowInfinite)=> {
 const n=val.trim().replaceAll('−','-');
 if(allowInfinite&&/^[+-]?(?:∞|infinity|9(?:\.0*)?e\+?999)$/i.test(n))return n.startsWith('-')?-Infinity:Infinity;
 if(!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(n))return NaN;
 const a=Number(n);return Number.isFinite(a)?a:NaN;
};
function decode(v){
 const [lower,upper,mean,sd]=v.map((a,i)=>parse(a,i<2));
 if(!Number.isFinite(mean)||!Number.isFinite(sd)||sd<=0)throw Error('Use a finite mean and a standard deviation greater than zero.');
 if(Number.isNaN(lower)||Number.isNaN(upper))throw Error('Enter a number or infinity in each bound.');
 return {mean,sd,lower,upper};
}
function step(s,key){
 if(key==='esc'){
   if(s.page==='distributions'){s.page=s.branch;s.selected=4;}
   else if(['probability','statistics'].includes(s.page)){s.page='top';s.selected=s.branch==='probability'?4:5;}
   else if(s.page==='wizard'){s.page='idle';}
   else s.page=s.answer?'result':'idle';
   return;
 }
 if(key==='menu'){s.page='top';s.selected=0;return}
 if(menuItems[s.page]){
   const items=menuItems[s.page], i=items.findIndex(a=>a[0]===key);
   if(key==='down'||key==='up'){s.selected=(s.selected+(key==='down'?1:-1)+items.length)%items.length;return}
   const activate=(['right','enter','select'].includes(key)?items[s.selected]:i>=0?items[i]:null);
   if(!activate)return;
   if(!activate[2])throw Error('This lesson practises Normal Cdf. Use Probability or Statistics → Distributions.');
   s.page=activate[2];s.selected=0;
   if(['probability','statistics'].includes(s.page))s.branch=s.page;
   if(s.page==='wizard'){
     s.values=(s.prefill??defaults).slice();s.field=0;s.replace=true;
   }
   return;
 }
 if(s.page==='entry'&&key==='enter'){
   const model=decode(s.values), n=normalMass(model);
   s.answer=fmtAnswer(n);s.page='result';s.model=model;return;
 }
 if(s.page!=='wizard')return;
 if(key==='tab'||key==='up'||key==='down'||key==='shift-tab'){
   s.field=(s.field+(key==='up'||key==='shift-tab'?5:1))%6;
   s.replace=true;return;
 }
 if(key==='enter'||key==='select'){
   if(s.field===5){s.page='idle';return}
   const model=decode(s.values);normalMass(model);
   s.previous='normCdf('+[model.lower,model.upper,model.mean,model.sd].map(rawBound).join(',')+')';
   s.page='entry';s.answer='';return;
 }
 if(s.field>3)return;
 const ch=key==='del'?'':key==='ee'?'e':/^[\da-z]$/.test(key)?key:({dot:'.',neg:'−',minus:'−',plus:'+',infinity:'∞'})[key];
 if(ch===undefined)return;
 const old=s.values[s.field];
 if(key==='del')s.values[s.field]=s.replace?'':old.slice(0,-1);
 else if(s.replace||old.length<21)s.values[s.field]=s.replace?ch:old+ch;
 s.replace=false;
}
function LCD(s){
 const drawMenu=(id,ix)=>'<ul class="lcd-menu">'+menuItems[id].map(([k,n,to],j)=>'<li data-menu-item="'+k+'" data-menu-page="'+id+'"'+(j===ix?' class="current"':'')+'>'+k+': '+n+(to&&to!=='wizard'?' ▸':'')+'</li>').join('')+'</ul>';
 if(menuItems[s.page]){
   let menu=s.page==='top'?drawMenu('top',s.selected):s.page==='distributions'?drawMenu(s.branch,4)+drawMenu(s.page,s.selected):drawMenu('top',s.branch==='statistics'?5:4)+drawMenu(s.page,s.selected);
   return '<div class="menu-stack">'+menu+'</div>';
 }
 if(s.page==='wizard')return '<div class="lcd-dialog"><strong>Normal Cdf</strong>'+fields.map((f,i)=>'<div data-field="'+i+'" class="lcd-field'+(i===s.field?' active':'')+'"><span>'+f+':</span><span>'+esc(s.values[i].replace(/infinity/ig,'∞'))+'&nbsp;</span></div>').join('')+'<div class="lcd-ok"><span data-dialog="4" class="'+(s.field===4?'active':'')+'">OK</span> <span data-dialog="5" class="'+(s.field===5?'active':'')+'">Cancel</span></div></div>';
 return (s.page==='result'?'<p>'+esc(s.previous)+'</p><p class="answers"><strong>'+esc(s.answer)+'</strong></p>':'')+'<div class="entry"><p>'+esc(s.page==='entry'?s.previous:'▏')+'</p></div>';
}
const qp=new URL(location.href).searchParams;
const qpMode=qp.get('mode'), tryHost=$('try-host'), work=$('try-work'), tryFeedback=$('try-feedback');
const fresh=(prefill=null)=>({...base(),prefill,model:null,error:''});
let live=fresh();
function paintTry(){
 tryHost.dataset.scene=live.page;work.innerHTML=LCD(live);tryFeedback.textContent=live.error;
 if(live.page==='result'&&live.model)curve($('try-curve'),live.model);
 else $('try-curve').replaceChildren();

}
function interact(key){
 try{
   step(live,key);live.error='';
 }catch(err){live.error=err.message;live.selected=live.selected??0}
 paintTry();
}
work.addEventListener('click',e=>{
 const menu=e.target.closest('[data-menu-item]'),field=e.target.closest('[data-field]'),button=e.target.closest('[data-dialog]');
 if(menu&&menu.dataset.menuPage===live.page)interact(menu.dataset.menuItem);
 else if(field&&live.page==='wizard'){live.field=Number(field.dataset.field);live.replace=true;paintTry();}
 else if(button&&live.page==='wizard'){live.field=Number(button.dataset.dialog);interact('enter');}
 else return;
 tryHost.focus({preventScroll:true});
});
const tryShell=CalculatorLessonHandset.mount(tryHost,{screen:tryHost.querySelector('.screen'),interactive:false,onKey:key=>{interact(key);tryHost.focus({preventScroll:true});},label:'Interactive TI-Nspire CX II-T'});
document.addEventListener('keydown',e=>{
 if($('try').hidden||e.defaultPrevented||e.isComposing||e.altKey||e.metaKey||e.ctrlKey||e.repeat)return;
 const focused=e.target===tryHost,fromBody=e.target===document.body||e.target===$('try');
 if(!focused&&!fromBody)return;
 if(e.key==='Tab'&&(!focused||live.page!=='wizard'||(e.shiftKey?live.field===0:live.field===5)))return;
 const k=e.key.toLowerCase()==='m'&&live.page!=='wizard'?'menu':e.key==='Tab'?e.shiftKey?'shift-tab':'tab':e.key;
 const norm=HandheldShell.normalizeKey(k), key=tryShell.getKey(norm);
 if(!key&&!['shift-tab','infinity'].includes(norm))return;
 e.preventDefault();
 tryHost.focus({preventScroll:true});
 if(key)key.click();else interact(norm);
});
// The Watch and independent editable Try move the same shell/LCD, never their state.
const tryPanel=$('try'),tryDock=tryHost.parentElement;
let returnToWatch,watchStamp='';
const sketch=document.createElement('figure'),sketchTitle=document.createElement('figcaption'),sketchCurve=document.createElement('div');
sketch.className='normal-watch-sketch';sketchCurve.className='curve';
sketch.append(sketchTitle,sketchCurve);sketch.hidden=true;
const physical=event=>({Menu:'menu',Tab:'tab',Enter:'enter','.':'dot'})[event.label]||event.label;
function renderWatch(device,{beat,point,crossed,key}){
 if(tryHost.parentElement!==device)device.append(tryHost,sketch);
 const tail=beat>=6,press=crossed.at(-1),duration=point.span.end-point.span.voiceEnd;
 const lit=press&&!point.speaking&&key?.beat===beat&&(point.fraction-key.at)*duration<.58;
 tryShell.setKeys(lit?[physical(press)]:[]);
 const count=crossed.length,stamp=beat+':'+count;
 if(stamp===watchStamp)return;watchStamp=stamp;
 const state=base(),sameExample=tail?crossed.slice(17):crossed;

 for(const action of sameExample)step(state,physical(action));
 tryHost.dataset.scene=state.page;work.innerHTML=LCD(state);
 const showSketch=(!tail&&beat===0)||(tail&&sameExample.length===0);
 sketch.hidden=!showSketch;
 if(showSketch){
  sketchTitle.textContent=tail?'Area sketch · P(X > 22)':'Area sketch · P(18 < X < 23)';
  curve(sketchCurve,tail?{...demo,lower:22,upper:Infinity}:demo);
 }
}
function enterTry(device,actions){
 returnToWatch=actions.returnToWatch;
 sketch.hidden=true;sketch.remove();
 device.prepend(tryPanel);tryDock.prepend(tryHost);tryPanel.hidden=false;
 tryShell.setInteractive(true);paintTry();
 tryHost.focus({preventScroll:true});
}
function exitTry(){
 watchStamp='';tryPanel.hidden=true;tryShell.setInteractive(false);
}
$('return-watch').addEventListener('click',()=>returnToWatch?.());
 $('reset-try').addEventListener('click',()=>{restorePractice();tryHost.focus({preventScroll:true});});
function curve(el,{mean,sd,lower=-Infinity,upper=Infinity}){
 const L=18,R=314,B=79;
 const clamp=(v)=>Math.max(-4.35,Math.min(4.35,v));
 const x=z=>L+(z+4.4)*(R-L)/8.8,y=z=>B-150*density(z);
 const path=(a,b)=>{
  const out=[];for(let i=0;i<=84;i++){const z=a+(b-a)*i/84;out.push((i?'L':'M')+x(z).toFixed(2)+','+y(z).toFixed(2))}return out.join(' ');
 };
 const a=(lower-mean)/sd,b=(upper-mean)/sd,aa=clamp(a),bb=clamp(b);
 const drawn=aa<bb?'<path class="shade" d="'+path(aa,bb)+' L'+x(bb).toFixed(2)+','+B+' L'+x(aa).toFixed(2)+','+B+' Z"/>':'';
 const cutData=[];
 if(Number.isFinite(a)&&Math.abs(a)<4.3)cutData.push([a,lower]);
 if(Number.isFinite(b)&&Math.abs(b)<4.3)cutData.push([b,upper]);
 const lab0=show(mean);
 const cuts=cutData.map(([z,f],i)=>{
   const v=x(z).toFixed(2), at=i===1&&Math.abs(z-cutData[0][0])<.6?110:96;
   return '<path class="cut" d="M'+v+','+B+' V'+y(z).toFixed(2)+'"/>'+ (Math.abs(z)>.23?'<text x="'+v+'" y="'+at+'" text-anchor="middle">'+show(f)+'</text>':'');
 }).join('');
 el.innerHTML='<svg viewBox="0 0 332 117" role="img" aria-label="Normal curve; shaded from '+bound(lower)+' to '+bound(upper)+'" xmlns="http://www.w3.org/2000/svg"><path class="axis" d="M12,'+B+' H320"/>'+drawn+'<path class="bell" d="'+path(-4.35,4.35)+'"/><path class="axis" d="M'+x(0)+','+(B-2)+' v4"/><text x="'+x(0)+'" y="96" text-anchor="middle">'+lab0+'</text>'+cuts+'</svg>';
}


const linkParams=['event','mean','sd','lower','upper','example'];
const valuesFor=(m,threshold=true)=>[
 threshold||m.lower===-Infinity?rawBound(m.lower):'',
 threshold||m.upper===Infinity?rawBound(m.upper):'',rawBound(m.mean),rawBound(m.sd)
];
function fromURL(){
 if(qpMode!=='try')return {model:task,event:'upper'};
 if(!linkParams.some(k=>qp.has(k)))return {model:task,event:'upper'};
 try{
   if(['mode',...linkParams].some(k=>qp.getAll(k).length>1))throw Error();
   if(qp.has('example')){
     if(qp.get('example')!=='demo'||linkParams.slice(0,-1).some(k=>qp.has(k)))throw Error();
     return {event:'upper',model:task,linked:true,threshold:false};
   }
   const event=qp.get('event'), names={range:['lower','upper'],lower:['upper'],upper:['lower']}[event];
   if(!Array.isArray(names))throw Error();
   const needed=['event','mean','sd',...names];
   if(linkParams.some(k=>qp.has(k)!==needed.includes(k)))throw Error();
   const n=k=>{
     const raw=qp.get(k), v=raw&&raw.length<=21?parse(raw,false):NaN;
     if(!Number.isFinite(v)||Math.abs(v)>(k==='lower'||k==='upper'?1e10:1e9))throw Error();
     return v;
   };
   const model={mean:n('mean'),sd:n('sd'),lower:event==='lower'?-Infinity:n('lower'),upper:event==='upper'?Infinity:n('upper')};
   normalMass(model);
   return {event,model,linked:true,threshold:true};
 }catch{
   return {event:'upper',model:task,error:'The link needs an event, a finite mean, a positive SD and the relevant bound(s). The original Try is shown; you can enter your own values on its handheld.'};
 }
}
const assignment=fromURL();
const eventLabel=(type,model)=>{
 const l=rawBound(model.lower), u=rawBound(model.upper);
 return type==='lower'?'P(X < '+u+')':type==='upper'?'P(X > '+l+')':'P('+l+' < X < '+u+')';
};
function restorePractice(){
 const {model,event,linked,threshold,error}=assignment;
 live=fresh(linked?valuesFor(model,threshold):null);
 $('challenge-title').textContent=event==='range'?'Interval practice':'Tail practice';
 $('challenge-prompt').textContent='Mean '+rawBound(model.mean)+', standard deviation '+rawBound(model.sd)+'. Find '+eventLabel(event,model)+'.';
 $('hint').textContent=(event==='lower'?'Leave the lower bound at −∞. ':event==='upper'?'Leave the upper bound at ∞. ':'Enter both finite bounds in increasing order. ')+'Use the standard deviation, not the variance.';
 $('answer').value='';$('feedback').textContent='';$('feedback').className='feedback';
 $('link-notice').textContent=error??'';$('link-notice').hidden=!error;
 paintTry();
}
$('answer').addEventListener('input',()=>{$('feedback').textContent='';$('feedback').className='feedback';});
$('answer-form').addEventListener('submit',e=>{
 e.preventDefault();
 const raw=$('answer').value.trim().replace(',','.'),v=Number(raw),el=$('feedback'),prob=normalMass(assignment.model),expected=prob.toFixed(4);
 let ok=false;
 if(!raw||!Number.isFinite(v)||v<0||v>1)el.textContent='Enter a probability from 0 to 1.';
 else if(v===Number(expected)&&/^(?:[01])?\.\d{4}$/.test(raw)){ok=true;el.textContent='Correct: '+expected+'. That is the requested area under the normal curve.'}
 else if(v===Number(expected)||Math.abs(v-prob)<5e-6)el.textContent='The area is right. Write the probability to four decimal places.';
 else el.textContent='Not yet. Check the shaded region, each bound, and that you used the standard deviation.';
 el.classList.toggle('is-right',ok);el.classList.toggle('is-wrong',!ok);
});
restorePractice();
window.CalculatorLessonAdapter=Object.freeze({initialMode:qpMode==='try'?'try':'watch',renderWatch,enterTry,exitTry});
})();
