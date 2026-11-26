/* One physical device and one LCD for every frame of a templated lesson. */
(function(root){
'use strict';
const mounted=new WeakMap();
function mount(host,{screen,onKey,label,interactive=false,keyboard=false}={}){
 if(!root.HandheldShell||!host||!screen||host.ownerDocument!==screen.ownerDocument)
   throw new TypeError('A Watch handset needs the shared shell, a host, and one LCD.');
 const prior=mounted.get(host);
 if(prior){
  if(prior.screen!==screen)throw new Error('Reuse the same LCD when switching Watch framing or Try.');
  return prior;
 }
 if(!host.contains(screen))host.append(screen);
 const shell=root.HandheldShell.mount({host,screen,interactive,label,onKey});
 let enabled=Boolean(interactive),destroyed=false;
 const originalTab=host.getAttribute('tabindex');
 if(keyboard&&originalTab===null)host.tabIndex=-1;
 function keydown(event){
  const target=event.target;
  if(!enabled||event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey||event.repeat||
     target.closest?.('input,textarea,select,[contenteditable],a,summary'))return;
  if(target.closest?.('button')&&(event.key==='Enter'||event.key===' '))return;
  const key=shell.keyId(event.key);
  if(!key||event.key==='Tab')return; // Keep ordinary focus traversal. A model can own an LCD Tab.
  event.preventDefault();
  shell.setKeys(key);
  onKey?.(key,event);
 }
 if(keyboard)host.addEventListener('keydown',keydown);
 const result=Object.freeze({
   ...shell,screen,
   setInteractive(value){enabled=Boolean(value);shell.setInteractive(enabled);if(enabled)shell.setKeys([]);},
   destroy(){
    if(destroyed)return;destroyed=true;
    if(keyboard){host.removeEventListener('keydown',keydown);if(originalTab===null)host.removeAttribute('tabindex');}
    mounted.delete(host);shell.destroy();
   }
 });
 mounted.set(host,result);return result;
}
root.CalculatorLessonHandset=Object.freeze({mount});
})(globalThis);
