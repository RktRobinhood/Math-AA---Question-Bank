"use strict";
(function(root){
const box=kind=>{const n=document.createElement("div");n.className="key-tour-calc";n.dataset.lane=kind;return n;};
let watch=null,trial=null;
function mount(kind,device){
 const node=box(kind);device.replaceChildren(node);
 const calculator=NeutralCalculator.mount(node,{mode:"DEG"});
 const instance={node,calculator,applied:[],acting:false};
 if(kind==="watch"){
  node.addEventListener("click",event=>{if(!instance.acting){event.preventDefault();event.stopImmediatePropagation();}},true);
  node.addEventListener("keydown",event=>{event.preventDefault();event.stopImmediatePropagation();},true);
 }
 return instance;
}
const TAB_ORDER='button,input,select,[tabindex]';
function preserve(restore,node,device){
 for(const control of node.querySelectorAll(TAB_ORDER)){control.tabIndex=-1;if(control.tagName==="BUTTON")control.setAttribute("aria-disabled","true");}
 if(node.contains(document.activeElement)){
  if(restore?.isConnected&&!node.contains(restore)&&restore!==document.body)restore.focus({preventScroll:true});
  else device.closest(".lw-stage").focus({preventScroll:true});
 }
}
function replay(device,{crossed,key,framing}){
 const next=crossed.map(e=>e.physical);
 const restore=document.activeElement;
 if(watch&&watch.applied.some((v,i)=>next[i]!==v)){
  watch.calculator.destroy();watch=null;
 }
 if(!watch)watch=mount("watch",device);
 const reattach=watch.node.parentNode!==device, changed=next.length!==watch.applied.length;
 if(reattach)device.replaceChildren(watch.node);
 if(changed){
  watch.acting=true;
  try{for(const v of next.slice(watch.applied.length)){
   const k=watch.node.querySelector('[data-hh-key="'+v+'"]');
   if(!k||k.disabled)throw Error("Unavailable authored handset key "+v);
   k.click();
  }}finally{watch.acting=false;}
  watch.applied=next;
 }
 watch.node.dataset.actionCount=String(next.length);
 if(reattach||changed||watch.framing!==framing){
  watch.framing=framing;
  const lane=watch.node;
  requestAnimationFrame(()=>{
   if(lane!==watch?.node||!lane.isConnected)return;
   const history=lane.querySelector(".neutral-history");
   if(history)history.scrollTop=history.scrollHeight;
  });
 }
 // The native keyboard still handles all the actual operations above. This
 // lasting highlight is for the learner and never enables Watch interaction.
 const last=key?.physical||"";
 for(const k of watch.node.querySelectorAll(".key-tour-held"))if(k.dataset.hhKey!==last)k.classList.remove("key-tour-held");
 if(last)watch.node.querySelector('[data-hh-key="'+last+'"]')?.classList.add("key-tour-held");
 preserve(restore,watch.node,device);
}
function practice(device){
 if(!trial){
  trial=mount("try",device);
  const prompt=document.createElement("p");prompt.className="key-tour-task";
  prompt.textContent="Make 7/9 in the fraction boxes. Then start a fresh entry and request a decimal. If you want another check, find cosine in the trig palette.";
  trial.node.prepend(prompt);
 }else device.replaceChildren(trial.node);
 trial.calculator.focus();
}

root.CalculatorLessonAdapter=Object.freeze({
 renderWatch:replay,enterTry:practice,
 initialMode:new URLSearchParams(location.search).get("mode")==="try"?"try":"watch"
});
})(window);
