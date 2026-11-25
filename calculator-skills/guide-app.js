(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const param=new URLSearchParams(location.search);
  const id=CalculatorLessonLinks.skillId(param.get('id'));
  const data=Array.isArray(window.CALCULATOR_LESSONS)?window.CALCULATOR_LESSONS:[];
  const lesson=data.find(l=>l.id===id);
  if(id && CalculatorLessonLinks.isDedicated(id)){
    const dest=param.get('mode')==='try'?
      CalculatorLessonLinks.tryHref(id):CalculatorLessonLinks.lessonHref(id);
    location.replace(dest);
    return;
  }
  if(!lesson || !Array.isArray(lesson.steps) || !lesson.steps.length || !lesson.try){
    $('not-found').hidden=false;return;
  }
  const {steps,try:exercise}=lesson;
  const displayText=(v)=>String(v??'');
  const create=(tag,text)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=displayText(text);return el;};
  const buttons=[...document.querySelectorAll('[data-mode]')];
  const parts=t=>String(t??'').trim().split(/\s*(?:→|›|->|\n|\|)\s*/u).filter(Boolean);

  $('lesson').hidden=false;
  $('skill-id').textContent=id;
  $('lesson-title').textContent=lesson.title;
  document.title=lesson.title+' · TI‑Nspire CX II';
  $('print-example').textContent='Calculator notes · '+id;
  $('prompt').textContent=displayText(exercise.prompt);
  $('print').addEventListener('click',()=>window.print());
  let notesWereOpen;
  window.addEventListener('beforeprint',()=>{notesWereOpen=$('notes').open;$('notes').open=true;});
  window.addEventListener('afterprint',()=>{if(notesWereOpen!==undefined)$('notes').open=notesWereOpen;});

  // File:// friendly: the assembly inlines an optional authoritative audio manifest.
  const audioCue=window.CALCULATOR_AUDIO?.lessons?.[id];
  const audioOK=audioCue && audioCue.src==='guided-audio/'+id+'.mp3' &&
      Number.isFinite(audioCue.durationMs) && audioCue.durationMs>0 &&
      Array.isArray(audioCue.cueStartsMs) && audioCue.cueStartsMs.length===steps.length &&
      audioCue.cueStartsMs.every((n,i,a)=>Number.isFinite(n)&&n<audioCue.durationMs&&(i===0?n===0:n>a[i-1]));
  const audio=audioOK?new Audio(audioCue.src):null;
  if(audio){audio.preload='metadata';$('walk-kind').textContent='Narrated guide';}
  let syncWithAudio=!!audio;
  let t=0, ticks=[], duration=0, mode='watch', running=false, frame=0,
      anchor=0, idx=-1, signature=0, initial=true;
  const seek=$('seek'), play=$('play'), prev=$('prior'), next=$('next');
  if(syncWithAudio){
    ticks=audioCue.cueStartsMs.map(ms=>ms/1000);
    duration=audioCue.durationMs/1000;
  }else{
    for(const step of steps){
      ticks.push(duration);
      const words=displayText(step.say).trim().split(/\s+/).filter(Boolean).length;
      duration+=Math.min(15,Math.max(3.3,words*.34+1));
    }
  }
  seek.max=String(duration);
  const clock=(s)=>{
    const n=Math.floor(s+0.001);
    return Math.floor(n/60)+':'+String(n%60).padStart(2,'0');
  };
  const clamp=val=>Math.max(0,Math.min(duration,val));
  const indexAt=val=>{
    for(let k=ticks.length-1;k>=0;k--)if(val>=ticks[k]-1e-5)return k;
    return 0;
  };

  const jumps=steps.map((step,k)=>{
    const button=create('button',String(k+1).padStart(2,'0'));
    button.type='button';
    button.setAttribute('aria-label','Step '+(k+1));
    button.addEventListener('click',()=>jump(k));
    const li=create('li');
    const key=parts(step.key).join(' → ');
    if(key)li.append(create('strong',key+': '));
    li.append(document.createTextNode(displayText(step.say)));
    if(step.screen){
      const line=create('div',displayText(step.screen));
      line.style.whiteSpace='pre-wrap';
      li.append(line);
    }
    $('note-steps').append(li);
    return button;
  });
  $('steps').append(...jumps);

  function display(current,announce=false){
    t=clamp(current);
    const at=indexAt(t);
    const completed=t>=duration-.055;
    const keys=parts(steps[at].key);
    const end=completed?keys.length-1:Math.floor((t-ticks[at])*3.5);
    const highlighted=keys.length?Math.max(0,Math.min(keys.length-1,end)):-1;
    const changed=idx!==at;
    if(changed){
      idx=at;
      $('beat-code').textContent='Step '+(idx+1)+' of '+steps.length;
      $('beat-title').textContent=idx===steps.length-1?'Read the result':'Follow on your calculator';
      $('caption').textContent=displayText(steps[idx].say);
      const screen=$('screen');
      screen.textContent=displayText(steps[idx].screen);
      screen.classList.toggle('is-result',idx===steps.length-1);
      screen.classList.remove('update');
      if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
        requestAnimationFrame(()=>{if(idx===at)screen.classList.add('update');});
      }
      $('keyrow').hidden=!keys.length;
      $('keys').replaceChildren(...keys.map(k=>create('kbd',k)));
      jumps.forEach((el,i)=>el.setAttribute('aria-current',String(i===idx)));
    }
    [...$('keys').children].forEach((el,i)=>el.classList.toggle('active',i===highlighted));
    if(changed||announce)$('step-announcement').textContent='Step '+(idx+1)+' of '+steps.length+'. '+displayText(steps[idx].say);
    seek.value=String(t);
    seek.setAttribute('aria-valuetext',clock(t)+', step '+(idx+1)+' of '+steps.length);
    $('time').textContent=clock(t)+' / '+clock(Math.ceil(duration));
    $('to-try').hidden=idx!==steps.length-1;
    prev.disabled=idx===0;
    next.disabled=idx===steps.length-1;
    if(!running)play.textContent=completed?'Replay':'Play';
  }
  function stop(){
    signature++;
    running=false;
    cancelAnimationFrame(frame);
    if(audio && !audio.paused)audio.pause();
    display(t);
  }
  function seekAt(n){
    t=clamp(n);
    if(syncWithAudio){
      try{audio.currentTime=t;}catch{}
    }
    anchor=performance.now()-t*1000;
    display(t,true);
  }
  function update(now){
    if(!running || mode!=='watch')return;
    const value=syncWithAudio?audio.currentTime:(now-anchor)/1000;
    if(value>=duration-.025){
      t=duration;
      stop();
      return;
    }
    display(value);
    frame=requestAnimationFrame(update);
  }
  function fallback(){
    if(!syncWithAudio)return;
    syncWithAudio=false;
    audio.pause();
    $('walk-kind').textContent='Captioned guide';
    $('sound-notice').textContent='Narration is unavailable. The same steps are available without sound.';
    anchor=performance.now()-t*1000;
  }
  async function start(){
    if(running){stop();return;}
    if(t>=duration-.055)seekAt(0);
    const intent=++signature;
    if(syncWithAudio){
      try{audio.currentTime=t;await audio.play();}
      catch{if(intent!==signature||mode!=='watch')return;fallback();}
    }
    if(intent!==signature||mode!=='watch'){if(audio&&!audio.paused)audio.pause();return;}
    running=true;play.textContent='Pause';
    anchor=performance.now()-t*1000;
    frame=requestAnimationFrame(update);
  }
  function jump(k){
    if(k<0||k>=ticks.length)return;
    stop();
    seekAt(ticks[k]+.001);
  }
  if(audio){
    audio.addEventListener('error',fallback);
    audio.addEventListener('ended',()=>{t=duration;stop();});
  }
  play.addEventListener('click',start);
  prev.addEventListener('click',()=>jump(idx-1));
  next.addEventListener('click',()=>jump(idx+1));
  seek.addEventListener('input',()=>seekAt(Number(seek.value)));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});

  // A checked practice is numeric for simple scalar forms, otherwise matches the
  // authored short answer and aliases (not a computer algebra system).
  const norm=v=>String(v??'').toLowerCase().trim()
    .replace(/[−–—]/g,'-').replace(/[“”‘’]/g,"'")
    .replace(/[\s\u202f]+/g,'').replace(/[.。]$/u,'');
  function number(s){
    let source=String(s??'').toLowerCase().trim().replace(/[−–]/g,'-').replace(/\s+/g,'');
    if(/\bin degrees\b/i.test(displayText(exercise.prompt)))source=source.replace(/°$/,'');
    if(!source)return null;
    const pattern=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/;
    const atom=v=>pattern.test(v)&&Number.isFinite(Number(v))?Number(v):null;
    if(source.endsWith('%')){
      const val=atom(source.slice(0,-1));return val===null?null:val/100;
    }
    if(source.includes('/')){
      const aa=source.split('/');
      if(aa.length===2){const a=atom(aa[0]),b=atom(aa[1]);if(a!==null && b!==null && b!==0)return a/b;}
      return null;
    }
    const sci=source.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))[×x*]10\^([+-]?\d{1,3})$/);
    if(sci){
      const val=Number(sci[1])*10**Number(sci[2]);
      return Number.isFinite(val)?val:null;
    }
    return atom(source);
  }
  function same(a,b){
    if(norm(a)===norm(b) && norm(b)!=='')return true;
    const x=number(a),y=number(b);
    return x!==null&&y!==null&&Math.abs(x-y)<=1e-10*Math.max(Math.abs(y),1e-6);
  }
  const input=$('answer-controls'), choiceValues=Array.isArray(exercise.choices)?exercise.choices:[], choices=choiceValues.map((value,k)=>{
    if(value && typeof value==='object')return {label:value.label??value.text??value.value, value:value.value??value.id??value.label??value.text??k};
    return {label:value, value};
  });
  let response=null;
  if(choices.length){
    const fs=create('fieldset');
    fs.append(create('legend','Choose one answer'));
    choices.forEach(({label,value})=>{
      const option=create('label'), radio=create('input');
      radio.type='radio';radio.name='response';radio.value=displayText(value);radio.required=true;
      option.className='choice';option.append(radio,create('span',label));fs.append(option);
    });
    input.append(fs);
  }else{
    const label=create('label','Your answer'), row=create('div');
    label.className='attempt-label';label.htmlFor='typed-answer';
    response=create('input');response.className='answer-input';response.type='text';response.id='typed-answer';
    response.required=true;response.maxLength=180;response.autocomplete='off';response.spellcheck=false;
    if(number(exercise.answer)>=0 && number(exercise.answer)!==null && !(exercise.alternatives||[]).some(a=>number(a)===null))response.inputMode='decimal';
    row.className='answer-row';row.append(response);
    input.append(label,row);
  }
  if(exercise.formatHint){
    const hint=create('small', exercise.formatHint);hint.id='format-hint';input.append(hint);
    response?.setAttribute('aria-describedby','format-hint');
  }
  let tried=0;
  const fb=$('feedback'),reveal=$('reveal'),solution=$('solution');
  const rawExpected=Array.isArray(exercise.answer)?exercise.answer:[exercise.answer];
  const aliases=Array.isArray(exercise.alternatives)?exercise.alternatives:[];
  const expected=[...rawExpected,...aliases].filter(v=>v!==null && v!==undefined);
  function work(){
    $('answer').textContent=rawExpected.map(answer=>choices.find(c=>String(c.value)===String(answer))?.label??answer).join(' / ');
    $('reason').textContent=displayText(exercise.explain);
    solution.hidden=false;
    reveal.hidden=true;
  }
  $('practice-form').addEventListener('submit',ev=>{
    ev.preventDefault();
    const value=response?.value??input.querySelector('input:checked')?.value??'';
    if(!value.trim()){
      fb.textContent='Enter an answer first.';fb.dataset.outcome='retry';fb.hidden=false;return;
    }
    tried++;
    fb.hidden=false;
    if(expected.some(ans=>same(value,ans))){
      fb.textContent='Correct.';fb.dataset.outcome='correct';work();
    }else{
      fb.textContent=exercise.retryHint?displayText(exercise.retryHint):
        (tried===1?'Not quite. Check your calculator entries and any rounding in the question.':'Not quite. You can try again or look at the worked answer.');
      fb.dataset.outcome='retry';
      reveal.hidden=!solution.hidden;
    }
  });
  reveal.addEventListener('click',work);
  function change(nextMode,focus=false){
    mode=nextMode;
    stop();
    buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
    $('watch').hidden=mode!=='watch';
    $('try').hidden=mode!=='try';
    if(!initial){
      try{
        const url=new URL(location.href);
        if(mode==='try')url.searchParams.set('mode','try');
        else url.searchParams.delete('mode');
        history.replaceState(null,'',url);
      }catch{}
    }
    initial=false;
    if(focus){
      const title=$('try-title');title.tabIndex=-1;title.focus();
    }
  }
  buttons.forEach(b=>b.addEventListener('click',()=>change(b.dataset.mode)));
  $('to-try').addEventListener('click',()=>change('try',true));
  change(param.get('mode')==='try'?'try':'watch');
})();
