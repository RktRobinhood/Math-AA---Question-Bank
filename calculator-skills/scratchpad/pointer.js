/* Screen pointer: physical-style relative touchpad drag, plus direct LCD click/tap. */
(function(root){
'use strict';
function mount(holder,glass){
 const el=document.createElementNS('http://www.w3.org/2000/svg','svg');
 el.classList.add('np-pointer');el.setAttribute('viewBox','0 0 15 19');el.setAttribute('aria-hidden','true');el.setAttribute("hidden","");
 const a=document.createElementNS(el.namespaceURI,'path');a.setAttribute('d','M1 1 L1 14 L4.2 11.1 L7.3 17.3 L9.6 16.1 L6.5 10.1 L12 10 Z');el.append(a);glass.append(el);
 const board=holder.querySelector('.hh-body');
 let x=.5,y=.5,armed=false,drag=null,suppress=0;
 function set(nx,ny,interactive){
  x=Math.max(.008,Math.min(.985,nx));y=Math.max(.008,Math.min(.985,ny));
  el.removeAttribute("hidden");el.style.left=(x*100)+'%';el.style.top=(y*100)+'%';
  if(interactive)armed=true;
 }
 function move(dx,dy){
  const box=glass.getBoundingClientRect();
  if(box.width&&box.height)set(x+dx/box.width,y+dy/box.height,true);
 }
 function press(){
  if(!armed)return false;
  const b=glass.getBoundingClientRect(),cx=b.left+x*b.width,cy=b.top+y*b.height;
  const target=document.elementFromPoint(cx,cy);
  if(target&&glass.contains(target)){
   const control=target.closest('button,input,select,textarea,[role="button"],[data-part]');
   if(control){
    if(control.matches('input,select,textarea'))control.focus({preventScroll:true});
    else control.click();
    return true;
   }
   if(target.closest('svg[aria-label="Graph display"]')){
    target.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,clientX:cx,clientY:cy}));
    return true;
   }
  }
  // Pointer click on inert space never evaluates a calculation.
  return true;
 }
 const pad=e=>e.target.closest?.('[data-hh-key=select],[data-hh-key=up],[data-hh-key=down],[data-hh-key=left],[data-hh-key=right]');
 board.addEventListener('pointerdown',e=>{if(!pad(e)||e.button!==0)return;drag={id:e.pointerId,fromX:e.clientX,fromY:e.clientY,lx:e.clientX,ly:e.clientY,moved:false};});
 board.addEventListener('pointermove',e=>{
  if(!drag||drag.id!==e.pointerId)return;
  if(!drag.moved&&Math.hypot(e.clientX-drag.fromX,e.clientY-drag.fromY)<3)return;
  if(!drag.moved){drag.moved=true;board.setPointerCapture(e.pointerId);}
  move((e.clientX-drag.lx)*2.8,(e.clientY-drag.ly)*2.8);drag.lx=e.clientX;drag.ly=e.clientY;e.preventDefault();
 });
 function end(e){
  if(!drag||drag.id!==e.pointerId)return;
  if(drag.moved)suppress=performance.now()+350;
  drag=null;
 }
 board.addEventListener('pointerup',end);board.addEventListener('pointercancel',end);
 board.addEventListener('click',e=>{
  if(drag?.moved||(performance.now()<suppress&&!pad(e))){e.preventDefault();e.stopImmediatePropagation();suppress=0;return;}
  if(pad(e))suppress=0;
 },true);
 glass.addEventListener('pointermove',e=>{
  if(e.pointerType!=='mouse'&&e.pointerType!=='pen')return;
  const b=glass.getBoundingClientRect();
  set((e.clientX-b.left)/b.width,(e.clientY-b.top)/b.height,false);
 });
 glass.addEventListener('pointerleave',()=>{if(!armed)el.setAttribute("hidden","");});
 glass.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){armed=false;el.setAttribute("hidden","");}});
 const hide=()=>{armed=false;el.setAttribute("hidden","");};
 return Object.freeze({move,press,hide});
}
root.HandheldScreenPointer=Object.freeze({mount});
})(window);
