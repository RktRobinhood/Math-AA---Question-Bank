(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const input=$('expression'), view=$('history'), mode=$('angle'), message=$('message'), trig=$('trig-panel');
  const engine=window.TIFreeCalc.create({mode:'DEG'});let ctrl=false,lastHistory='',lastChange=null;
  function press(id){
    if(id==='ctrl'){ctrl=!ctrl;shell.setKeys(ctrl?['ctrl']:[]);message.textContent=ctrl?'Control: choose √ (power), Ans (negative), or Clear (del).':'';return;}
    if(ctrl){ctrl=false;shell.setKeys([]);id={power:'sqrt',neg:'ans',del:'clear',exp:'ln',tenpow:'log'}[id]||id;}
    if(id==='trig'){trig.hidden=!trig.hidden;if(!trig.hidden)trig.querySelector('button').focus({preventScroll:true});return}
    if(id==='home'||id==='scratchpad'){engine.clear();return;}
    if(['doc','menu','catalog','templates','flag','symbols','var','shift'].includes(id)){
       message.textContent='This practice page supports simple calculations. Use a lesson for Graphs, Numerical Solve or probability.';
       return;
    }
    if(id==='select'||id==='return')id='enter';
    if(lastChange)engine.setSelection(lastChange[0],lastChange[1]);
    engine.press(id);
    if(!trig.hidden&&/^(?:a?sin|a?cos|a?tan)$/.test(id))trig.hidden=true;
  }
  const shell=window.HandheldShell.mount({screen:$('lcd'),host:$('handheld'),label:'TI-Nspire CX II-T calculator practice',onKey:press});
  shell.setInteractive(true);
  engine.subscribe(state=>{
    if(input.value!==state.expression)input.value=state.expression;
    lastChange=[state.selectionStart,state.selectionEnd];
    if(document.activeElement===input){try{input.setSelectionRange(...lastChange)}catch{}}
    $('lcd-mode').textContent=state.mode;mode.value=state.mode;
    $('lcd-error').textContent=state.error||'';
    const signature=JSON.stringify(state.history);
    if(signature!==lastHistory){
      lastHistory=signature;
      view.replaceChildren(...state.history.slice(-5).map(entry=>{
        const block=document.createElement('div');block.className='hist';
        const expr=document.createElement('span'), result=document.createElement('output');
        expr.textContent=entry.expression; result.textContent=entry.result;
        block.append(expr,result);return block;
      }));
      view.scrollTop=view.scrollHeight;
    }
  });
  input.addEventListener('input',()=>engine.setText(input.value,input.selectionStart,input.selectionEnd));
  input.addEventListener('select',()=>{lastChange=[input.selectionStart,input.selectionEnd]});
  input.addEventListener('blur',()=>{lastChange=[input.selectionStart,input.selectionEnd]});
  input.addEventListener('keydown',event=>{
    if(event.key==='Enter'||event.key==='Escape'||event.key==='ArrowUp'||event.key==='ArrowDown'){
      event.preventDefault();press(window.HandheldShell.normalizeKey(event.key));
    }
  });
  mode.addEventListener('change',()=>engine.setMode(mode.value));
  document.querySelectorAll('[data-k]').forEach(b=>b.addEventListener('click',()=>press(b.dataset.k)));
  $('clear').addEventListener('click',()=>engine.clear());
  document.addEventListener('keydown',ev=>{
    if(ev.target.closest('input,select,button,a')||ev.altKey||ev.ctrlKey||ev.metaKey)return;
    if(engine.handleKey(ev))ev.preventDefault();
  });
})();
