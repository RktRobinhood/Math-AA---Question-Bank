'use strict';
(function(){
const $=id=>document.getElementById(id), {density}=globalThis.NspireNormal, M=globalThis.NspireInverseNormal, {cutoff,quantile,parse,validate,leftFromGiven}=M;
const demo={mean:50,sd:8,area:.75,side:'left'}, tailDemo={mean:50,sd:8,area:.9,side:'right'};
const defaults=['','0','1'], fields=['Area','μ','σ'];
const okField=fields.length,cancelField=okField+1,count=cancelField+1;
const menuItems={
 top:[['1','Actions'],['2','Number'],['3','Algebra'],['4','Calculus'],['5','Probability','probability'],['6','Statistics','statistics'],['7','Matrix & Vector'],['8','Finance'],['9','Functions & Programs']],
 probability:[['1','Factorial'],['2','Permutations'],['3','Combinations'],['4','Random'],['5','Distributions','distributions']],
 statistics:[['1','Stat Calculations'],['2','Stat Results'],['3','List Math'],['4','List Operations'],['5','Distributions','distributions']],
 distributions:[['1','Normal Pdf'],['2','Normal Cdf'],['3','Inverse Normal','wizard'],['4','t Pdf'],['5','t Cdf']]
};
const base=()=>({page:'idle',branch:'probability',selected:0,field:0,values:defaults.slice(),replace:true,previous:'',answer:'',numeric:null,model:null,prefill:null,side:'left',error:''});
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const show=n=>String(Number(n.toPrecision(7))).replace(/-/g,'−');
const fmtAnswer=n=>n===0?'0':String(Number(n.toPrecision(13)));
const rawNumber=n=>String(n).replaceAll('-','−');
function decode(v){
 const [area,mean,sd]=v.map(parse),model={area,mean,sd};validate(model);return model;
}
function step(s,key){
 if(key==='esc'){
   if(s.page==='distributions'){s.page=s.branch;s.selected=4;}
   else if(['probability','statistics'].includes(s.page)){s.page='top';s.selected=s.branch==='probability'?4:5;}
   else if(s.page==='wizard'){s.page=s.answer?'result':'idle';}
   else s.page=s.answer?'result':'idle';
   return;
 }
 if(key==='menu'){s.page='top';s.selected=0;return}
 if(menuItems[s.page]){
   const items=menuItems[s.page], i=items.findIndex(a=>a[0]===key);
   if(key==='down'||key==='up'){s.selected=(s.selected+(key==='down'?1:-1)+items.length)%items.length;return}
   const activate=(['right','enter','select'].includes(key)?items[s.selected]:i>=0?items[i]:null);
   if(!activate)return;
   if(!activate[2])throw Error('This lesson practises Inverse Normal. Use Probability or Statistics → Distributions.');
   s.page=activate[2];s.selected=0;
   if(['probability','statistics'].includes(s.page))s.branch=s.page;
   if(s.page==='wizard'){
     s.values=(s.prefill??defaults).slice();s.field=0;s.replace=true;
   }
   return;
 }
 if(s.page==='entry'&&['enter','select'].includes(key)){
   const model=decode(s.values), n=cutoff(model);
   s.answer=fmtAnswer(n);s.numeric=n;s.page='result';s.model={...model,side:s.side};return;
 }
 if(s.page!=='wizard')return;
 if(key==='tab'||key==='up'||key==='down'||key==='shift-tab'){
   s.field=(s.field+(key==='up'||key==='shift-tab'?count-1:1))%count;
   s.replace=true;return;
 }
 if(key==='enter'||key==='select'){
   if(s.field===cancelField){s.page=s.answer?'result':'idle';return}
   const model=decode(s.values);
   s.previous='invNorm('+[model.area,model.mean,model.sd].map(rawNumber).join(',')+')';
   s.page='entry';s.answer='';return;
 }
 if(s.field>=okField)return;
 const ch=key==='del'?'':key==='ee'?'e':/^[\da-z]$/.test(key)?key:({dot:'.',neg:'−',minus:'−',plus:'+'})[key];
 if(ch===undefined)return;
 const old=s.values[s.field];
 if(key==='del')s.values[s.field]=s.replace?'':old.slice(0,-1);
 else if(s.replace||old.length<28)s.values[s.field]=s.replace?ch:old+ch;
 s.replace=false;
}
function LCD(s){
 const drawMenu=(id,ix)=>'<ul class="lcd-menu">'+menuItems[id].map(([k,n,to],j)=>'<li data-menu-item="'+k+'" data-menu-page="'+id+'"'+(j===ix?' class="current"':'')+'>'+k+': '+n+(to&&to!=='wizard'?' ▸':'')+'</li>').join('')+'</ul>';
 if(menuItems[s.page]){
   let menu=s.page==='top'?drawMenu('top',s.selected):s.page==='distributions'?drawMenu(s.branch,4)+drawMenu(s.page,s.selected):drawMenu('top',s.branch==='statistics'?5:4)+drawMenu(s.page,s.selected);
   return '<div class="menu-stack">'+menu+'</div>';
 }
 if(s.page==='wizard')return '<div class="lcd-dialog"><strong>Inverse Normal</strong>'+fields.map((f,i)=>'<div data-field="'+i+'" class="lcd-field'+(i===s.field?' active':'')+'"><span>'+f+':</span><span>'+esc(s.values[i])+'&nbsp;</span></div>').join('')+'<div class="lcd-ok"><span data-dialog="3" class="'+(s.field===3?'calc-active':'')+'">OK</span> <span data-dialog="4" class="'+(s.field===4?'calc-active':'')+'">Cancel</span></div></div>';
 return (s.page==='result'?'<p>'+esc(s.previous)+'</p><p class="answers"><strong data-exact="'+esc(s.numeric)+'">'+esc(rawNumber(s.answer))+'</strong></p>':'')+'<div class="entry"><p>'+esc(s.page==='entry'?s.previous:'▏')+'</p></div>';
}
const qp=new URLSearchParams(location.search),request=M.exerciseFrom(qp),target=request.data;
const tryHost=$('try-host'),work=$('try-work'),tryFeedback=$('try-feedback');
let light=0;
function seed(model){
 return {...base(),prefill:[model.side==='left'?rawNumber(model.p):'',rawNumber(model.mean),rawNumber(model.sd)]};
}
let live=seed(target);
function paintTry(){
 tryHost.dataset.scene=live.page;work.innerHTML=LCD(live);
 tryFeedback.textContent=live.error||'';
 const chart=$('try-curve');
 if(live.page==='result'&&live.model)curve(chart,live.model,true);
 else chart.replaceChildren();
}
function interact(key){
 if(!visibleTry())return;
 live.error='';
 try{step(live,key)}catch(err){live.error=err.message;live.selected=live.selected??0;}
 if(document.activeElement!==tryHost)tryHost.focus({preventScroll:true});
 clearTimeout(light);tryShell.setKeys([key==='shift-tab'?'tab':key]);light=setTimeout(()=>tryShell.setKeys([]),160);
 paintTry();
}
function visibleTry(){return !$('try').hidden;}
const tryShell=CalculatorLessonHandset.mount(tryHost,{screen:tryHost.querySelector('.screen'),interactive:false,onKey:interact,label:'Interactive TI-Nspire CX II-T'});
work.addEventListener('click',e=>{
 const menu=e.target.closest('[data-menu-item]'), field=e.target.closest('[data-field]'), button=e.target.closest('[data-dialog]');
 if(menu&&menu.dataset.menuPage===live.page)interact(menu.dataset.menuItem);
 else if(field&&live.page==='wizard'){live.field=Number(field.dataset.field);live.replace=true;paintTry();}
 else if(button&&live.page==='wizard'){live.field=Number(button.dataset.dialog);interact('enter');}
 else return;
 tryHost.focus({preventScroll:true});
});
document.addEventListener('keydown',e=>{if(e.target!==document.body&&!e.target.closest?.(".qb-calculator-lesson"))return;
 if(!visibleTry()||e.defaultPrevented||e.altKey||e.metaKey||e.ctrlKey||e.repeat||e.isComposing)return;
 const el=e.target;
 if(el.closest?.('input,textarea,select,a,summary,[contenteditable]')||(!tryHost.contains(el)&&el!==document.body))return;
 if(el.closest?.('button')&&['Enter',' ','Tab'].includes(e.key))return;
 if(e.key==='Tab'&&(el!==tryHost||live.page!=='wizard'||(e.shiftKey?live.field===0:live.field===cancelField)))return;
 const aliases={m:'menu',M:'menu','-':'neg','.':'dot',Escape:'esc',Backspace:'del',Delete:'del',Enter:'enter',ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',Tab:e.shiftKey?'shift-tab':'tab'};
 const k=aliases[e.key]??HandheldShell.normalizeKey(e.key);
 if(!tryShell.getKey(k)&&k!=='shift-tab')return;
 e.preventDefault();interact(k);
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
 const tail=beat>=5,press=crossed.at(-1),duration=point.span.end-point.span.voiceEnd;
 const lit=press&&!point.speaking&&key?.beat===beat&&(point.fraction-key.at)*duration<.58;
 tryShell.setKeys(lit?[physical(press)]:[]);
 const count=crossed.length,stamp=beat+':'+count;
 if(stamp===watchStamp)return;watchStamp=stamp;
 const state=base(),sameExample=tail?crossed.slice(16):crossed;
 state.side=tail?'right':'left';
 for(const action of sameExample)step(state,physical(action));
 tryHost.dataset.scene=state.page;work.innerHTML=LCD(state);
 const showSketch=(!tail&&beat===0)||(tail&&sameExample.length===0);
 sketch.hidden=!showSketch;
 if(showSketch){
  sketchTitle.textContent=tail?'Area sketch · top 10%, left area 0.90':'Area sketch · left area 0.75';
  curve(sketchCurve,tail?tailDemo:demo,false);
 }
}
function enterTry(device,actions){
 returnToWatch=actions.returnToWatch;
 sketch.hidden=true;sketch.remove();
 device.prepend(tryPanel);tryDock.prepend(tryHost);tryPanel.hidden=false;
 clearTimeout(light);tryShell.setInteractive(true);paintTry();
 tryHost.focus({preventScroll:true});
}
function exitTry(){
 clearTimeout(light);watchStamp='';tryPanel.hidden=true;tryShell.setInteractive(false);
}
$('return-watch').addEventListener('click',()=>returnToWatch?.());
 $('reset-try').addEventListener('click',()=>{live=seed(target);$('answer').value='';$('feedback').textContent='';$('feedback').classList.remove('correct');paintTry();tryHost.focus({preventScroll:true});});
function curve(el,{mean,sd,area,side='left'},reveal){
 const L=18,R=314,B=78;
 const x=z=>L+(z+4.4)*(R-L)/8.8,y=z=>B-150*density(z);
 const path=(a,b)=>{
   const out=[];for(let i=0;i<=72;i++){const z=a+(b-a)*i/72;out.push((i?'L':'M')+x(z).toFixed(2)+','+y(z).toFixed(2));}return out.join(' ');
 };
 const value=cutoff({mean,sd,area}), z=quantile(area), clamped=Math.max(-4.35,Math.min(4.35,z));
 const [a,b]=side==='right'?[clamped,4.35]:[-4.35,clamped], label=reveal?show(value):'c';
 const areaPath=(a,b,cls)=>a<b?'<path class="'+cls+'" d="'+path(a,b)+' L'+x(b).toFixed(2)+','+B+' H'+x(a).toFixed(2)+' Z"/>':'';
 const fill=(side==='right'?areaPath(-4.35,clamped,'complement'):'')+areaPath(a,b,'shade');
 const cut=Math.abs(z)<4.3, marker=x(clamped).toFixed(2);
 el.innerHTML='<svg viewBox="0 0 332 116" role="img" aria-label="Normal curve; '+esc(side)+' side of cutoff shaded'+(reveal?', cutoff '+esc(show(value)):'')+'" xmlns="http://www.w3.org/2000/svg"><path class="axis" d="M12,'+B+' H320"/>'+fill+'<path class="bell" d="'+path(-4.35,4.35)+'"/><path class="axis" d="M'+x(0)+','+(B-2)+' v4"/><text x="'+x(0)+'" y="96" text-anchor="middle">'+esc(show(mean))+'</text>'+(cut?'<path class="cut" d="M'+marker+','+B+' V'+y(z).toFixed(2)+'"/><text x="'+marker+'" y="'+(Math.abs(z)<.37?111:96)+'" text-anchor="middle">'+esc(label)+'</text>':'')+'</svg>';
}
if(request.linked){
 $('challenge-title').textContent='Linked cutoff';
 $('challenge').textContent='Mean '+show(target.mean)+', standard deviation '+show(target.sd)+'. Find the cutoff with probability '+show(target.p)+' to its '+target.side+'.';
}
$('link-warning').textContent=request.error;$('link-warning').hidden=!request.error;
$('answer-form').onsubmit=e=>{
 e.preventDefault();
 const raw=$('answer').value.trim().replace(',','.'),v=parse(raw),el=$('feedback');
 try{
   const answer=cutoff({...target,area:leftFromGiven(target.p,target.side)}),expected=Number(answer.toFixed(2)),lcd=Number(Number(fmtAnswer(answer)).toFixed(2));
   const rounded=(v===expected||v===lcd),fixed=/^[+−-]?\d+\.\d{2}$/.test(raw);
   if(!Number.isFinite(v))el.textContent='Enter a numerical cutoff.';
   else if(rounded&&fixed)el.textContent='Correct. This cutoff leaves the requested area on the '+target.side+'.';
   else if(rounded)el.textContent='The value is right. Give it to two decimal places.';
   else el.textContent='Not yet. Inverse Normal needs area to the left. Check your tail and standard deviation.';
   el.classList.toggle('correct',rounded&&fixed);
 }catch(err){el.textContent=err.message;el.classList.remove('correct');}
};
window.CalculatorLessonAdapter=Object.freeze({initialMode:qp.get('mode')==='try'?'try':'watch',renderWatch,enterTry,exitTry});
})();
