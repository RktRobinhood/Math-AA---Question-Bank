/* Shared video-style controls and deterministic physical-key rendering. */
(function(global){
  'use strict';
  const people=(n)=>String(n??'');
  function lightAt(shell,id,seconds){
    const events=global.HandheldKeyCues?.[id]||[];
    const ms=seconds*1000;
    const active=events.filter(e=>ms>=e.timeMs&&ms<e.timeMs+Math.max(e.durationMs??500,230)).slice(-1).map(e=>e.key);
    shell?.setKeys(active);
    return active;
  }
  function controls({container,play,seek,active,onRestart}){
    if(!container||!play||!seek)return;
    const add=(label,text,action)=>{
      const b=document.createElement('button');b.type='button';b.className='cx-transport-button';
      b.setAttribute('aria-label',label);b.title=label;b.textContent=text;b.addEventListener('click',action);
      return b;
    };
    function jump(next){
      seek.value=String(Math.min(Number(seek.max),Math.max(Number(seek.min),next)));
      seek.dispatchEvent(new Event('input',{bubbles:true}));
    }
    const back=add('Back 10 seconds','−10',()=>jump(Number(seek.value)-10));
    const forward=add('Forward 10 seconds','+10',()=>jump(Number(seek.value)+10));
    const restart=add('Replay from the start','↺',()=>{
      if(onRestart){onRestart();return;}
      const wasRunning=play.getAttribute('aria-label')==='Pause';
      jump(0); if(!wasRunning)play.click();
    });
    const stage=container.closest('.cx-handheld-stage');
    const setFocus=on=>{stage?.classList.toggle('cx-focused',on);focus.setAttribute('aria-pressed',String(on));focus.setAttribute('aria-label',on?'Exit focused view':'Focused view');};
    const focus=add('Focused view','⛶',()=>setFocus(!stage?.classList.contains('cx-focused')));
    focus.setAttribute('aria-pressed','false');
    play.after(back,forward,restart,focus);
    const takeover=stage?.querySelector('#take-over');
    if(takeover){
      takeover.textContent='Take over';
      takeover.setAttribute('aria-label','Take over the calculator');
      container.append(takeover);
    }
    stage?.addEventListener('click',e=>{if(e.target.id==='take-over')setFocus(false)});
    document.querySelectorAll('[data-mode="try"]').forEach(b=>b.addEventListener('click',()=>setFocus(false)));
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&stage?.classList.contains('cx-focused'))setFocus(false);});
    document.addEventListener('keydown',e=>{
      const el=e.target;
      if(!active()||e.ctrlKey||e.metaKey||e.altKey||e.repeat||el?.closest?.('input,textarea,select,button,a,summary,[contenteditable]'))return;
      if(e.key==='k'||e.key===' '){e.preventDefault();play.click();}
      else if(e.key==='j'){e.preventDefault();jump(Number(seek.value)-10);}
      else if(e.key==='l'){e.preventDefault();jump(Number(seek.value)+10);}
    });
  }
  function character(key){
    const k=people(key).toLowerCase();
    const map={eq:'=',neg:'-',mul:'*',div:'/',dot:'.',power:'^',square:'^2',squared:'^2',plus:'+',add:'+',minus:'-',subtract:'-',negative:'-',times:'*',multiply:'*',divide:'/',decimal:'.',point:'.',equals:'=',equal:'=',comma:',',open:'(',close:')',lparen:'(',rparen:')',openparen:'(',closeparen:')','−':'-','×':'*','÷':'/','²':'^2'};
    if(Object.hasOwn(map,k))return map[k];
    if(/^[0-9a-z()+\-*/^=.,]$/.test(k))return k;
    return null;
  }
  function modify(field,key,{replace=false}={}){
    const del=['del','delete','backspace'].includes(key);
    const ch=character(key);
    if(!del&&ch===null)return false;
    if(replace)field.value='';
    const source=field.value,a=field.selectionStart??source.length,b=field.selectionEnd??source.length;
    const start=del&&a===b?Math.max(0,a-1):a;
    const result=source.slice(0,start)+(del?'':ch)+source.slice(b);
    if(result.length>(field.maxLength>0?field.maxLength:100))return false;
    field.value=result;
    try{field.setSelectionRange(start+(del?0:ch.length),start+(del?0:ch.length));}catch{}
    field.dispatchEvent(new Event('input',{bubbles:true}));
    return true;
  }
  global.HandheldTransport=Object.freeze({controls,lightAt,character,modify});
})(window);
