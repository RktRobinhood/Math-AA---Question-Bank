"use strict";
(function(){
const timeline=[[{"kind":"problem","value":"ramp","id":"read-0","at":0.5,"next":1}],[{"kind":"key","key":"d","value":"d","id":"menu-0","at":0.08333333333333333,"next":2},{"kind":"key","key":"e","value":"e","id":"menu-1","at":0.16666666666666666,"next":3},{"kind":"key","key":"r","value":"r","id":"menu-2","at":0.25,"next":4},{"kind":"key","key":"i","value":"i","id":"menu-3","at":0.3333333333333333,"next":5},{"kind":"key","key":"v","value":"v","id":"menu-4","at":0.4166666666666667,"next":6},{"kind":"key","key":"a","value":"a","id":"menu-5","at":0.5,"next":7},{"kind":"key","key":"t","value":"t","id":"menu-6","at":0.5833333333333334,"next":8},{"kind":"key","key":"i","value":"i","id":"menu-7","at":0.6666666666666666,"next":9},{"kind":"key","key":"v","value":"v","id":"menu-8","at":0.75,"next":10},{"kind":"key","key":"e","value":"e","id":"menu-9","at":0.8333333333333334,"next":11},{"kind":"key","key":"(","value":"(","id":"menu-10","at":0.9166666666666666,"next":12}],[{"kind":"key","key":"(","value":"(","id":"function-0","at":0.043478260869565216,"next":13},{"kind":"key","key":"x","value":"x","id":"function-1","at":0.08695652173913043,"next":14},{"kind":"key","key":"-","value":"-","id":"function-2","at":0.13043478260869565,"next":15},{"kind":"key","key":"1","value":"1","id":"function-3","at":0.17391304347826086,"next":16},{"kind":"key","key":")","value":")","id":"function-4","at":0.21739130434782608,"next":17},{"kind":"key","key":"^","value":"^","id":"function-5","at":0.2608695652173913,"next":18},{"kind":"key","key":"3","value":"3","id":"function-6","at":0.30434782608695654,"next":19},{"kind":"key","key":"+","value":"+","id":"function-7","at":0.34782608695652173,"next":20},{"kind":"key","key":"2","value":"2","id":"function-8","at":0.391304347826087,"next":21},{"kind":"key","key":"*","value":"*","id":"function-9","at":0.43478260869565216,"next":22},{"kind":"key","key":"(","value":"(","id":"function-10","at":0.4782608695652174,"next":23},{"kind":"key","key":"x","value":"x","id":"function-11","at":0.5217391304347826,"next":24},{"kind":"key","key":"-","value":"-","id":"function-12","at":0.5652173913043478,"next":25},{"kind":"key","key":"1","value":"1","id":"function-13","at":0.6086956521739131,"next":26},{"kind":"key","key":")","value":")","id":"function-14","at":0.6521739130434783,"next":27},{"kind":"key","key":"+","value":"+","id":"function-15","at":0.6956521739130435,"next":28},{"kind":"key","key":"3","value":"3","id":"function-16","at":0.7391304347826086,"next":29},{"kind":"key","key":",","value":",","id":"function-17","at":0.782608695652174,"next":30},{"kind":"key","key":"x","value":"x","id":"function-18","at":0.8260869565217391,"next":31},{"kind":"key","key":",","value":",","id":"function-19","at":0.8695652173913043,"next":32},{"kind":"key","key":"2","value":"2","id":"function-20","at":0.9130434782608695,"next":33},{"kind":"key","key":")","value":")","id":"function-21","at":0.9565217391304348,"next":34}],[{"kind":"key","key":"Ctrl","id":"left-0","at":0.09090909090909091,"next":35},{"kind":"key","key":"Catalog","id":"left-1","at":0.18181818181818182,"next":36},{"kind":"key","key":"Enter","value":"insert-bar","id":"left-2","at":0.2727272727272727,"next":37},{"kind":"key","key":"x","value":"x","id":"left-3","at":0.36363636363636365,"next":38},{"kind":"key","key":"=","value":"=","id":"left-4","at":0.45454545454545453,"next":39},{"kind":"key","key":"0","value":"0","id":"left-5","at":0.5454545454545454,"next":40},{"kind":"key","key":".","value":".","id":"left-6","at":0.6363636363636364,"next":41},{"kind":"key","key":"7","value":"7","id":"left-7","at":0.7272727272727273,"next":42},{"kind":"key","key":"5","value":"5","id":"left-8","at":0.8181818181818182,"next":43},{"kind":"key","key":"Enter","value":"evaluate","id":"left-9","at":0.9090909090909091,"next":44}],[{"kind":"key","key":"Up","id":"centre-0","at":0.1,"next":45},{"kind":"key","key":"Left","value":"choose-expression","id":"centre-1","at":0.2,"next":46},{"kind":"key","key":"Enter","value":"recall","id":"centre-2","at":0.3,"next":47},{"kind":"key","key":"Del","id":"centre-3","at":0.4,"next":48},{"kind":"key","key":"Del","id":"centre-4","at":0.5,"next":49},{"kind":"key","key":"Del","id":"centre-5","at":0.6,"next":50},{"kind":"key","key":"Del","id":"centre-6","at":0.7,"next":51},{"kind":"key","key":"1","value":"1","id":"centre-7","at":0.8,"next":52},{"kind":"key","key":"Enter","value":"evaluate","id":"centre-8","at":0.9,"next":53}],[{"kind":"key","key":"Up","id":"right-0","at":0.1,"next":54},{"kind":"key","key":"Left","value":"choose-expression","id":"right-1","at":0.2,"next":55},{"kind":"key","key":"Enter","value":"recall","id":"right-2","at":0.3,"next":56},{"kind":"key","key":"Del","id":"right-3","at":0.4,"next":57},{"kind":"key","key":"1","value":"1","id":"right-4","at":0.5,"next":58},{"kind":"key","key":".","value":".","id":"right-5","at":0.6,"next":59},{"kind":"key","key":"2","value":"2","id":"right-6","at":0.7,"next":60},{"kind":"key","key":"5","value":"5","id":"right-7","at":0.8,"next":61},{"kind":"key","key":"Enter","value":"evaluate","id":"right-8","at":0.9,"next":62}],[{"kind":"key","key":"Up","id":"slope-0","at":0.058823529411764705,"next":63},{"kind":"key","key":"Left","value":"choose-expression","id":"slope-1","at":0.11764705882352941,"next":64},{"kind":"key","key":"Enter","value":"recall","id":"slope-2","at":0.17647058823529413,"next":65},{"kind":"key","key":"Del","id":"slope-3","at":0.23529411764705882,"next":66},{"kind":"key","key":"Del","id":"slope-4","at":0.29411764705882354,"next":67},{"kind":"key","key":"Del","id":"slope-5","at":0.35294117647058826,"next":68},{"kind":"key","key":"Del","id":"slope-6","at":0.4117647058823529,"next":69},{"kind":"key","key":"1","value":"1","id":"slope-7","at":0.47058823529411764,"next":70},{"kind":"key","key":"Left","id":"slope-8","at":0.5294117647058824,"next":71},{"kind":"key","key":"Left","id":"slope-9","at":0.5882352941176471,"next":72},{"kind":"key","key":"Left","id":"slope-10","at":0.6470588235294118,"next":73},{"kind":"key","key":"Left","id":"slope-11","at":0.7058823529411765,"next":74},{"kind":"key","key":"Left","id":"slope-12","at":0.7647058823529411,"next":75},{"kind":"key","key":"Del","id":"slope-13","at":0.8235294117647058,"next":76},{"kind":"key","key":"1","value":"1","id":"slope-14","at":0.8823529411764706,"next":77},{"kind":"key","key":"Enter","value":"evaluate","id":"slope-15","at":0.9411764705882353,"next":78}],[{"kind":"proof","value":"sign-change-and-nonzero-slope","id":"conclude-0","at":0.5,"next":79}]];
const actions=timeline.flat();
const runs=new WeakMap();
const keys={Up:'up',Left:'left',Right:'right',Del:'del',Enter:'enter',Menu:'menu',Ctrl:'ctrl',Catalog:'catalog','(':'lparen',')':'rparen',',':'comma','*':'mul','^':'power','-':'minus','+':'plus','.':'dot','=':'eq'};
const buttonKey=label=>keys[label]||label;
function draw(device,lane) {
 const node=device.ownerDocument.createElement('div');
 node.className='neutral-watch-calc';node.dataset.lane=lane;
 device.replaceChildren(node);
 const calc=window.NeutralCalculator.mount(node,{mode:'RAD'});
 const state={node,calc,applied:0,replaying:false,frame:''};
 if(lane==='watch'){
  node.addEventListener('click',event=>{if(!state.replaying){event.preventDefault();event.stopImmediatePropagation();}},true);
  node.addEventListener('keydown',event=>{event.preventDefault();event.stopImmediatePropagation();},true);
 }
 return state;
}
function act(state,event){
 const b=event.kind==='key'?state.node.querySelector('[data-hh-key="'+buttonKey(event.key)+'"]'):
   event.kind==='menu-item'?[...state.node.querySelectorAll('.np-menu-item')].find(b=>b.textContent.trim().replace(/^\d+:\s*/,'').replace(/\s*›$/,'')===event.value):null;
 if(b&&!b.disabled){b.click();return;}
 if(event.kind==='key'||event.kind==='menu-item')throw new Error('Unrecognized physical calculator action '+(event.key||event.value));
}
function renderWatch(device,{beat,key,crossed,point,framing}) {
 const contexts=runs.get(device)||{};
 runs.set(device,contexts);
 const reached=new Set(crossed.map(c=>c.id));
 let count=0;
 for(let i=0;i<=beat;i++)for(const event of timeline[i]){
  if(i<beat||(event.kind==='key'?reached.has(event.id):!point.speaking&&event.at<=point.fraction))count=event.next;
 }
 const lastFocused=device.ownerDocument.activeElement;
 let state=contexts.watch;
 if(!state||state.applied>count){
  state?.calc.destroy();state=draw(device,'watch');contexts.watch=state;
 }
 if(!device.contains(state.node))device.replaceChildren(state.node);
 if(state.applied!==count){
  state.replaying=true;
  try{for(const event of actions.slice(state.applied,count))act(state,event);}
  finally{state.replaying=false;}
  state.applied=count;
  for(const control of state.node.querySelectorAll('button, input, select, [tabindex]')){
   control.tabIndex=-1;
   if(control.tagName==='BUTTON')control.setAttribute('aria-disabled','true');
  }
 }
 state.node.dataset.actionCount=String(count);
 const wanted=key?.beat===beat?buttonKey(actions.find(e=>e.id===key.id)?.key):'';
 for(const b of state.node.querySelectorAll('.key-tour-held'))if(b.dataset.hhKey!==wanted)b.classList.remove('key-tour-held');
 if(wanted)state.node.querySelector('[data-hh-key="'+wanted+'"]')?.classList.add('key-tour-held');
 const history=state.node.querySelector('.neutral-history');
 history.scrollTop=history.scrollHeight;
 if(state.node.contains(device.ownerDocument.activeElement)){
  if(lastFocused?.isConnected&&!state.node.contains(lastFocused)&&lastFocused!==device.ownerDocument.body)lastFocused.focus({preventScroll:true});
  else device.closest('.lw-stage').focus({preventScroll:true});
 }
}
function enterTry(device){
 const contexts=runs.get(device)||{};
 runs.set(device,contexts);
 if(!contexts.trial){
  const trial=draw(device,'try');
  const task=device.ownerDocument.createElement('p');
  task.className='neutral-watch-task';
  task.textContent='A second ramp is modelled by g(x) = −(x − 2)³ + (x − 2) + 4 on 1.75 ≤ x ≤ 2.25. Check either side of x = 2, then decide whether the inflection is stationary. Explain using the signs and the slope.';
  trial.node.prepend(task);contexts.trial=trial;
 }else device.replaceChildren(contexts.trial.node);
 contexts.trial.calc.focus();
}
window.CalculatorLessonAdapter=Object.freeze({renderWatch,enterTry});

})();
