/* Statistics-only adapter; arithmetic and native key transitions use CT03. */
(function(){
'use strict';
const M=window.CT03,$=id=>document.getElementById(id);
const stage=$('ai-try'),handheld=$('ai-handheld'),lcd=$('ai-lcd'),body=$('ai-display'),status=$('ai-display-text');
const question=$('ai-question'),answer=$('ai-answer'),feedback=$('ai-feedback'),notice=$('ai-notice');
const params=new URLSearchParams(location.search);
const ordinary=M.problem('ncr',10,4);let task=ordinary,linked=false,invalid=false;
try{
 if(params.has('op')&&params.get('op')!=='ncr')throw Error();
 const p=M.link(params);if(p){task=p;linked=true;}
}catch{invalid=true;}
const goal=M.count(task);
const physical={menu:'menu',probability:'5',combinations:'3',total:'8',comma:'comma',successes:'3',close:'rparen',evaluate:'enter'};
const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
let practice=M.base(),mode='watch',watchStamp=null,returnToWatch=null,edited=false;
const shell=CalculatorLessonHandset.mount(handheld,{screen:lcd,label:'TI-Nspire CX II-T Calculator',onKey:press});
question.textContent=linked?'Exactly '+task.r+' of '+task.n+' trials succeed. How many success patterns are possible?':
 'Exactly 4 of 10 seeds germinate. How many ways could those 4 germinating seeds be positioned in a numbered tray?';
function draw(s,interactive){
 body.replaceChildren();body.classList.toggle('case-error',Boolean(s.error));const labels=[];
 if(s.page==='calc'){
  for(const row of s.rows){const box=el('div','lcd-expression',row.text);box.append(el('div','lcd-result',row.value));body.append(box);}
  const entry=el('div','lcd-entry'),caret=el('i','lcd-caret');caret.setAttribute('aria-hidden','true');
  entry.append(s.entry.slice(0,s.at),caret,s.entry.slice(s.at));body.append(entry);
  labels.push('Entry: '+(s.entry||'blank'));
 }else{
  const stack=el('div','menu-stack');
  const panel=(id,selected)=>{
   const ul=el('ul',id);
   M.MENU[id].forEach((label,i)=>{
    const li=el('li'),activeNumber=id==='main'?5:3;
    const live=interactive&&s.page===id&&i+1===activeNumber;
    const item=el(live?'button':'span',i===selected?'calc-active':'',label);
    if(live){item.type='button';item.onclick=()=>{press(String(i+1));stage.focus({preventScroll:true});};}
    li.append(item);ul.append(li);
   });
   return ul;
  };
  stack.append(panel('main',s.page==='prob'?4:s.selected));
  if(s.page==='prob')stack.append(panel('prob',s.selected));
  body.append(stack);
  labels.push(s.page==='main'?'Menu. Choose 5: Probability.':'Probability. Choose 3: Combinations.');
 }
 if(s.error)body.append(el('div','lcd-error',s.error));
 const row=s.rows.at(-1);if(row)labels.push(row.text+' = '+row.value);
 if(s.error)labels.push(s.error);
 status.textContent=labels.join(' ');
}
function assignedActive(){
 const content=practice.entry||practice.rows.at(-1)?.text;
 if(!content)return true;
 try{return M.same(M.parse(content),task);}catch{return true;}
}
function renderTry(){
 draw(practice,true);
 const active=assignedActive();$('ai-answer-form').hidden=!active;$('ai-custom').hidden=active;
 if(!active)feedback.textContent='';
 notice.textContent=practice.error||(invalid&&!edited?'The linked values were invalid. The original practice problem is shown instead.':'');
 $('ai-help').textContent=practice.page==='main'?'Choose 5: Probability.':practice.page==='prob'?'Choose 3: Combinations.':
 'Menu → 5 → 3. Enter total trials, then successes.';
}
function press(key){
 if(mode!=='try')return;
 edited=true;
 const forbidden=practice.page==='prob'&&(/^[1245]$/.test(key)||(['enter','select','right'].includes(key)&&practice.selected!==2));
 if(forbidden)practice={...practice,error:'Choose 3: Combinations for this lesson.'};
 else practice=M.key(practice,key);
 renderTry();
}
function renderWatch(device,{point,crossed,key}){
 if(handheld.parentElement!==device)device.append(handheld);
 const signature=crossed.map(e=>e.id).join(',');
 if(signature!==watchStamp){
  let state=M.base();for(const step of crossed)state=M.key(state,physical[step.id]);
  draw(state,false);watchStamp=signature;
 }
 const down=!point.speaking&&key?.beat===point.span.i&&point.fraction-key.at<.075;
 shell.setKeys(down?[physical[key.id]]:[]);
}
function enterTry(device,actions){
 mode='try';returnToWatch=actions.returnToWatch;
 device.prepend(stage);$('ai-try-grid').prepend(handheld);stage.hidden=false;
 shell.setInteractive(true);renderTry();
}
function exitTry(){
 mode='watch';stage.hidden=true;watchStamp=null;shell.setInteractive(false);shell.setKeys([]);
}
$('ai-return').onclick=()=>returnToWatch?.();
$('ai-reset').onclick=()=>{
 practice=M.base();edited=true;answer.value='';feedback.textContent='';
 renderTry();stage.focus({preventScroll:true});
};
answer.oninput=()=>{feedback.textContent='';};
$('ai-answer-form').onsubmit=e=>{
 e.preventDefault();if(!assignedActive())return;
 const v=M.answer(answer.value);
 feedback.dataset.error=String(v!==goal);
 feedback.textContent=v===goal?'Correct. That is the exact number of success patterns.':
   v===null?'Enter a whole-number count.':'Not yet. Enter total trials first and successes second in nCr.';
};
document.addEventListener('keydown',e=>{
 if(mode!=='try'||e.defaultPrevented||e.altKey||e.ctrlKey||e.metaKey||e.isComposing||
    (!stage.contains(e.target)&&e.target!==document.body)||
    e.target.closest('input,select,textarea,summary,a,[contenteditable]')||
    (e.target.closest('button')&&['Enter',' '].includes(e.key)))return;
 const keys={m:'menu',M:'menu',Escape:'esc',Enter:'enter',Backspace:'del',Delete:'del',ArrowLeft:'left',ArrowRight:'right',
  ArrowUp:'up',ArrowDown:'down',',':'comma',')':'rparen','(':'lparen'};
 const k=keys[e.key]||(/^\d$/.test(e.key)?e.key:null);if(k){e.preventDefault();press(k);}
});
window.CalculatorLessonAdapter=Object.freeze({
 initialMode:params.get('mode')==='try'||linked||invalid?'try':'watch',renderWatch,enterTry,exitTry
});
})();
