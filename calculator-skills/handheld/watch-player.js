/* Opt-in video controls for a lesson with its own playback / seek logic. */
(function (global) {
  'use strict';
  function mount({player,surface,play,seek,expand,feedback,active}) {
    const motion=matchMedia('(prefers-reduced-motion: reduce)');
    let fallback=false, timer=0, mutedSiblings=[];
    function flash(playing) {
      clearTimeout(timer);
      feedback.dataset.action=playing?'play':'pause';
      feedback.hidden=false;
      timer=setTimeout(()=>{feedback.hidden=true;},motion.matches?220:440);
    }
    function fullscreen() { return document.fullscreenElement===player||fallback; }
    function sync() {
      const on=fullscreen();
      const label=on?'Exit fullscreen':'Fullscreen';
      expand.setAttribute('aria-label',label);
      expand.setAttribute('aria-pressed',String(on));
      expand.title=label;
    }
    function fallbackSet(on) {
      if(on===fallback)return;
      fallback=on;
      player.classList.toggle('watch-fullscreen-fallback',on);
      document.body.classList.toggle('watch-fullscreen-open',on);
      if(on) {
        for(let child=player;child.parentElement&&child!==document.body;child=child.parentElement) {
          for(const el of child.parentElement.children) if(el!==child&&!el.inert) { el.inert=true;mutedSiblings.push(el); }
        }
      } else {
        for(const el of mutedSiblings)el.inert=false;
        mutedSiblings=[];
      }
      sync();
    }
    async function exit() {
      if(fallback)fallbackSet(false);
      if(document.fullscreenElement===player)await document.exitFullscreen().catch(()=>{});
      sync();
    }
    async function toggleFullscreen() {
      if(!active())return;
      if(fullscreen()){await exit();return;}
      try {
        if(typeof player.requestFullscreen!=='function')throw Error('Fullscreen API unavailable');
        await player.requestFullscreen();
        if(!active())await exit();
      } catch { if(active())fallbackSet(true); }
      sync();
    }
    function toggle() { if(active())play.click(); }
    function jump(delta) {
      seek.value=String(Math.min(Number(seek.max),Math.max(Number(seek.min),Number(seek.value)+delta)));
      seek.dispatchEvent(new Event('input',{bubbles:true}));
    }
    surface.addEventListener('click',e=>{
      if(!e.target.closest('button,a,input,textarea,select,summary,[contenteditable]')&&!global.getSelection()?.toString())toggle();
    });
    expand.addEventListener('click',toggleFullscreen);
    document.addEventListener('fullscreenchange',sync);
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape'&&fallback){e.preventDefault();exit();return;}
      if(!active()||e.ctrlKey||e.metaKey||e.altKey||e.repeat||e.defaultPrevented)return;
      const target=e.target, key=e.key.toLowerCase(), inside=player.contains(target);
      if(target!==document.body&&!inside)return;
      const interactive=target.closest?.('button,a,input,textarea,select,summary,[contenteditable]');
      const arrow=key==='arrowleft'||key==='arrowright';
      if(interactive&&!((target===seek&&arrow)||([play,expand,seek].includes(target)&&['f','j','l','k'].includes(key))))return;
      if(arrow){e.preventDefault();jump((key==='arrowleft'?-1:1)*(target===seek?1:5));}
      else if(key==='k'||key===' '){e.preventDefault();toggle();}
      else if(key==='j'||key==='l'){e.preventDefault();jump(key==='j'?-10:10);}
      else if(key==='f'){e.preventDefault();toggleFullscreen();}
    });
    sync();
    return Object.freeze({flash,exit,clear(){clearTimeout(timer);feedback.hidden=true;}});
  }
  global.CalculatorWatchPlayer=Object.freeze({mount});
})(window);
