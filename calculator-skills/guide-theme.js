(() => {
  'use strict';
  const options=['auto','light','dark'], mq=matchMedia('(prefers-color-scheme: dark)');
  let mode='auto';
  try {const saved=localStorage.getItem('ti-lab-theme');if(options.includes(saved))mode=saved;} catch {}
  const apply=()=>{document.documentElement.dataset.theme=mode==='auto'?(mq.matches?'dark':'light'):mode;};
  apply();
  mq.addEventListener?.('change',apply);
  document.addEventListener('DOMContentLoaded',()=>{
    const select=document.querySelector('#theme');
    if(!select)return;
    select.value=mode;
    select.addEventListener('change',()=>{
      mode=options.includes(select.value)?select.value:'auto';
      try{localStorage.setItem('ti-lab-theme',mode);}catch{}
      apply();
    });
  });
})();
