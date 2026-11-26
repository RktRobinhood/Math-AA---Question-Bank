/* A generated lesson route supplies only its JSON and calculator adapter. */
(async function () {
 'use strict';
 const host=document.querySelector('[data-calculator-watch]');
 if(!host)return;
 try{
   const response=await fetch(new URL('definition.json',location.href));
   if(!response.ok)throw new Error('Missing lesson definition');
   const spec=await response.json();
   document.title=spec.title+' · Calculator Skills | IB Math Question Bank';
   CalculatorWatchLesson.mount(host,spec,window.CalculatorLessonAdapter);
 }catch(e){
   host.textContent='This Calculator Skills lesson could not load.';
   host.setAttribute('role','status');
   console.error(e);
 }
})();
