(function(){
'use strict';
const M=window.CT36,W=window.CT36Watch,$=id=>document.getElementById(id),stage=$('stage'),screen=$('screen'),handheld=$('handheld-host');
const params=new URLSearchParams(location.search),request=M.request(params);
let mode='watch',watchStamp=null,light=0,touched=false,practice=M.start(request.data),returnToWatch=null;
const shell=CalculatorLessonHandset.mount(handheld,{screen:$('lcd'),label:'TI-Nspire CX II-T Calculator',
 onKey:k=>{physical(k);stage.focus({preventScroll:true});}});
const pretty=v=>String(v).replaceAll('-','−').replaceAll('acos(','cos⁻¹(').replaceAll('*','×').replaceAll('/','÷').replaceAll(':=',' :=');
const elt=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
function render(s,watch){
 stage.dataset.lcd='calc';screen.replaceChildren();
 for(const e of s.history.slice(-2)){
  const r=elt('div',undefined,'log-line');r.dataset.kind=e.type||'other';
  r.append(elt('span',pretty(e.raw),'log-operation'),elt('strong',pretty(e.result),'log-value'));screen.append(r);
 }
 const input=elt('div',undefined,'calc-input'),line=elt('span',undefined,'entry-expression');
 line.append(document.createTextNode(pretty(s.input.slice(0,s.at))),
  elt('i',undefined,'cursor'),document.createTextNode(pretty(s.input.slice(s.at))));
 input.append(line);if(s.ctrl)input.append(elt('span','ctrl','ctrl-on'));screen.append(input);
 if(s.error)screen.append(elt('div',s.error,'lcd-error'));
 if(!watch){
  $('hint').textContent='Check the total with + first. Then enter one product per row and add the products.';
  setStatus('error',s.error||(!touched?request.error:''));
  setStatus('progress',M.progress(s));writeTable(s.data);
  if(!$('edit-distribution').open){$('x-edit').value=s.data.x.join(', ');$('p-edit').value=s.data.p.join(', ');}
 }
}
function setStatus(id,text){const e=$(id);e.textContent=text;e.hidden=!text;}
function physical(key){
 if(mode!=='try')return;
 const before=practice;
 clearTimeout(light);shell.setKeys(before.ctrl?['ctrl',key]:[key]);light=setTimeout(()=>shell.setKeys([]),175);
 touched=true;practice=M.press(before,key);render(practice,false);
}
function renderWatch(device,{point,crossed,key}){
 if(handheld.parentElement!==device)device.append(handheld);
 const count=crossed.length;
 if(watchStamp!==count){watchStamp=count;render(count?W.tape[count-1].s:M.start(M.worked),true);}
 const down=!point.speaking&&key?.beat===point.span.i&&point.fraction-key.at<.057;
 shell.setKeys(down?[W.tape[count-1].key]:[]);
}
function writeTable(d){
 const t=elt('table',undefined,'dist-table');t.setAttribute('aria-label','Practice distribution: outcome and probability');
 const tbody=t.createTBody();
 for(const [values,lead] of [[d.x,'x'],[d.p,'P(X=x)']]){
  const row=tbody.insertRow(),h=elt('th',lead);h.scope='row';row.append(h);
  for(const v of values)row.append(elt('td',pretty(v)));
 }
 $('target-wrap').replaceChildren(t);
}
$('edit-form').onsubmit=e=>{
 e.preventDefault();const chunks=v=>v.split(',').map(x=>x.trim());
 const next=M.resetData(practice,chunks($('x-edit').value),chunks($('p-edit').value));
 if(!next.error){touched=true;$('edit-distribution').open=false;}
 practice=next;render(practice,false);
 if(!next.error)stage.focus({preventScroll:true});
};
function enterTry(device,actions){
 mode='try';returnToWatch=actions.returnToWatch;document.body.classList.add('in-try');
 device.prepend(stage);$('try-deck').prepend(handheld);stage.hidden=false;
 shell.setInteractive(true);clearTimeout(light);shell.setKeys([]);render(practice,false);
}
function exitTry(){
 mode='watch';stage.hidden=true;watchStamp=null;document.body.classList.remove('in-try');
 shell.setInteractive(false);clearTimeout(light);shell.setKeys([]);
}
$('return').onclick=()=>returnToWatch?.();
$('reset').onclick=()=>{
 $('edit-distribution').open=false;touched=true;practice=M.start(request.data);
 render(practice,false);stage.focus({preventScroll:true});
};
document.addEventListener('keydown',e=>{
 if(e.defaultPrevented||e.target.closest?.(".top, .tabbar"))return;
 if(e.isComposing||e.altKey||e.ctrlKey||e.metaKey||e.target.closest('input,select,a,summary,textarea,[contenteditable]'))return;
 const b=e.target.closest('button');
 if(mode!=='try')return;
 if((!stage.contains(e.target)&&e.target!==document.body)||(b&&['Enter',' ','Tab'].includes(e.key)))return;
 const chars={Escape:'esc',Enter:'enter',ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',Backspace:'del',Delete:'del','-':'neg','.':'dot','(':'lparen',')':'rparen','+':'plus','*':'mul','×':'mul'};
 const key=chars[e.key]||(/^\d$/.test(e.key)?e.key:'');
 if(key){e.preventDefault();if(e.target===document.body)stage.focus({preventScroll:true});physical(key);}
});
window.CalculatorLessonAdapter=Object.freeze({
 initialMode:params.get('mode')==='try'||request.linked?'try':'watch',renderWatch,enterTry,exitTry
});
})();
