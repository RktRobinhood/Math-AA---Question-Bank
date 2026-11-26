'use strict';
(function(){
  const $=id=>document.getElementById(id), tryHost=$('try-host'), work=$('try-work'), panel=$('try'), dock=tryHost.parentElement;
  const fields=['Num Trials','Probability of Success','Lower Bound','Upper Bound'];
  const items={
    top:[['1','Actions'],['2','Number'],['3','Algebra'],['4','Calculus'],['5','Probability','probability'],['6','Statistics']],
    probability:[['1','Factorial'],['2','Permutations'],['3','Combinations'],['4','Random'],['5','Distributions','distributions']],
    distributions:[['D','Binomial Pdf'],['E','Binomial Cdf','wizard'],['F','Inverse Binomial']]
  };
  const esc=x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  const base=prefill=>({page:'idle',index:0,field:0,change:true,values:['','','',''],prefill,history:[],command:'',error:''});
  const decimal=/^(?:\d+(?:\.\d*)?|\.\d+)$/;
  function val(raw){
    const [n,p,l,h]=raw;
    const number=x=>decimal.test(x)?Number(x):NaN;
    let frac=p.split('/'),pr=frac.length===1?number(p):frac.length===2?number(frac[0])/number(frac[1]):NaN;
    const trials=number(n),lo=number(l),hi=number(h);
    if(!Number.isInteger(trials)||trials<1||trials>500)throw Error('Enter a whole trial count from 1 to 500.');
    if(!Number.isFinite(pr)||pr<0||pr>1)throw Error('Enter a success probability between 0 and 1.');
    if(!Number.isInteger(lo)||!Number.isInteger(hi)||lo<0||hi>trials||lo>hi)throw Error('Enter whole bounds from 0 to the trial count, lower first.');
    return {n:trials,p:pr,lo,hi};
  }
  // Sum ratios outwards from the mode. No overflowing binomial coefficient.
  function mass({n,p,lo,hi}){
    if(lo>hi)return 0;if(lo===0&&hi===n)return 1;
    if(p===0)return lo===0?1:0;if(p===1)return hi===n?1:0;
    const m=Math.min(n,Math.floor((n+1)*p));
    let total=1,selected=m>=lo&&m<=hi?1:0,w=1;
    for(let i=m;i>0;i--){w*=i/(n-i+1)*(1-p)/p;total+=w;if(i-1>=lo&&i-1<=hi)selected+=w;}
    w=1;for(let i=m;i<n;i++){w*=(n-i)/(i+1)*p/(1-p);total+=w;if(i+1>=lo&&i+1<=hi)selected+=w;}
    return Math.min(1,selected/total);
  }
  const fmt=n=>n<1e-5&&n!==0?n.toExponential(5):String(Number(n.toPrecision(6)));
  function step(s,k){
    if(k==='menu'){s.page='top';s.index=4;return}
    if(k==='esc'){
      if(s.page==='wizard'){s.page='distributions';s.index=1}
      else if(s.page==='distributions'){s.page='probability';s.index=4}
      else if(s.page==='probability'){s.page='top';s.index=4}
      else s.page='idle';
      return;
    }
    if(items[s.page]){
      const list=items[s.page];if(k==='up'||k==='down'){
        s.index=Math.min(list.length-1,Math.max(0,s.index+(k==='up'?-1:1)));return;
      }
      const choice=['right','enter','select'].includes(k)?list[s.index]:list.find(x=>x[0].toLowerCase()===k);
      if(!choice)return;
      if(!choice[2])throw Error('This lesson uses Probability → Distributions → Binomial Cdf.');
      s.page=choice[2];s.index=s.page==='probability'?4:0;
      if(s.page==='wizard'){
        if(s.prefill){s.values=s.prefill.slice();s.prefill=null}
        s.field=0;s.change=true;
      }
      return;
    }
    if(s.page==='wizard'){
      if(['tab','shift-tab','up','down'].includes(k)){s.field=(s.field+(['shift-tab','up'].includes(k)?5:1))%6;s.change=true;return}
      if(['enter','select'].includes(k)){
        if(s.field===5){s.page='distributions';s.index=1;return}
        const v=val(s.values);s.command='binomCdf('+[v.n,s.values[1],v.lo,v.hi].join(',')+')';s.page='entry';return;
      }
      if(s.field>3)return;
      if(k==='del'){s.values[s.field]=s.change?'':s.values[s.field].slice(0,-1);s.change=false;return}
      let x=s.change?'':s.values[s.field], ch=k==='dot'?'.':k==='div'?'/':k;
      if(!/^[0-9]$/.test(ch)&&!(s.field===1&&ch==='.'&&!x.split('/').at(-1).includes('.'))&&!(s.field===1&&ch==='/'&&decimal.test(x)))return;
      if(x.length<19)s.values[s.field]=x+ch;s.change=false;return;
    }
    if(s.page==='entry'&&['enter','select'].includes(k)){
      const v=val(s.values), prob=mass(v);
      s.history.push({command:s.command,result:prob===0&&v.p>0&&v.p<1?'≈0 (below display range)':fmt(prob)});
      s.history=s.history.slice(-2);s.page='result';
    }
  }
  function lcd(s){
    const menu=(id,index)=>'<ul class="lcd-menu">'+items[id].map(([k,n],i)=>'<li data-menu-page="'+id+'" data-menu-item="'+k+'"'+(index===i?' class="current"':'')+'>'+k+': '+n+'</li>').join('')+'</ul>';
    if(items[s.page]){
      const prev=s.page==='probability'?'top':s.page==='distributions'?'probability':null;
      return '<div class="menu-stack">'+(prev?menu(prev,4):'')+menu(s.page,s.index)+'</div>';
    }
    if(s.page==='wizard')return '<div class="lcd-dialog"><strong>Binomial Cdf</strong>'+fields.map((n,i)=>'<div data-field="'+i+'" class="lcd-field'+(s.field===i?' active':'')+'"><span>'+n+':</span><span>'+esc(s.values[i])+'&nbsp;</span></div>').join('')+'<div class="lcd-ok"><span data-dialog="4" class="'+(s.field===4?'active':'')+'">OK</span> <span data-dialog="5" class="'+(s.field===5?'active':'')+'">Cancel</span></div></div>';
    return s.history.map(h=>'<div><p>'+esc(h.command)+'</p><p class="answers"><strong>'+esc(h.result)+'</strong></p></div>').join('')+'<div class="entry"><p>'+esc(s.page==='entry'?s.command:'▏')+'</p></div>';
  }
  const params=new URLSearchParams(location.search), original={n:9,p:.35,event:'lt',k:3,upper:3};
  const aliases={n:['n','trials'],p:['p','chance'],event:['event'],k:['k','lower'],upper:['upper']};
  const tryMode=params.get('mode')==='try';
  function bounds({n,event,k,upper}){
    const [lo,hi,label]={ge:[k,n,'X ≥ '+k],le:[0,k,'X ≤ '+k],gt:[k+1,n,'X > '+k],lt:[0,k-1,'X < '+k],range:[k,upper,k+' ≤ X ≤ '+upper]}[event];
    return {lo,hi,label};
  }
  function assignment(){
    const named=['example','case'].filter(k=>params.has(k));
    const typed=Object.keys(aliases).filter(k=>aliases[k].some(x=>params.has(x)));
    const one=key=>aliases[key].map(x=>params.get(x)).find(x=>x!==null);
    const fallback={data:original,invalid:true};
    if(['mode','example','case',...Object.values(aliases).flat()].some(k=>params.getAll(k).length>1)
      || typed.some(k=>aliases[k].filter(x=>params.has(x)).length!==1))return fallback;
    if(!named.length&&!typed.length)return {data:original};
    const fill=data=>{const {lo,hi}=bounds(data);return {data,prefill:lo<=hi?[String(data.n),String(data.p),String(lo),String(hi)]:null};};
    if(!typed.length&&named.length===1&&(params.get('example')==='demo'||params.get('case')==='binomial-demo'))return fill(original);
    if(named.length)return fallback;
    const n=one('n'),p=one('p'),event=one('event'),k=one('k'),upper=one('upper'),integer=x=>typeof x==='string'&&/^\d{1,3}$/.test(x);
    if(!integer(n)||+n<1||+n>500||typeof p!=='string'||!/^(?:[01](?:\.\d{1,15})?|\.\d{1,15})$/.test(p)||+p>1||
      !integer(k)||+k>+n||!['ge','le','gt','lt','range'].includes(event)||
      (event==='range'&&(!integer(upper)||+upper<+k||+upper>+n)))return fallback;
    return fill({n:+n,p:+p,event,k:+k,upper:event==='range'?+upper:+k});
  }
  const setup=assignment();
  let live=base(setup.prefill), shown=false, returnToWatch, stamp='';
  function paint(s){tryHost.dataset.scene=s.page;work.innerHTML=lcd(s)}
  function paintTry(){paint(live);$('try-feedback').textContent=live.error}
  function physical(k){
    if(!shown)return;
    try{step(live,k);live.error=''}catch(e){live.error=e.message}
    paintTry();tryHost.focus({preventScroll:true});
  }
  const shell=CalculatorLessonHandset.mount(tryHost,{screen:tryHost.querySelector('.screen'),interactive:false,onKey:physical,label:'Interactive TI-Nspire CX II-T'});
  work.addEventListener('click',e=>{
    if(!shown)return;
    const m=e.target.closest('[data-menu-item]'), f=e.target.closest('[data-field]'), d=e.target.closest('[data-dialog]');
    if(m&&m.dataset.menuPage===live.page)return physical(m.dataset.menuItem.toLowerCase());
    if(f&&live.page==='wizard'){live.field=Number(f.dataset.field);live.change=true;live.error='';paintTry();tryHost.focus({preventScroll:true})}
    if(d&&live.page==='wizard'){live.field=Number(d.dataset.dialog);physical('enter')}
  });
  document.addEventListener('keydown',e=>{
    if(!shown||e.defaultPrevented||e.isComposing||e.altKey||e.metaKey||e.ctrlKey||e.repeat)return;
    const focused=e.target===tryHost;
    if(!focused&&e.target!==document.body)return;
    if(e.key==='Tab'&&(!focused||live.page!=='wizard'||(e.shiftKey?live.field===0:live.field===5)))return;
    const k=e.key.toLowerCase()==='m'&&live.page!=='wizard'?'menu':e.key==='Tab'?(e.shiftKey?'shift-tab':'tab'):e.key;
    const normalized=HandheldShell.normalizeKey(k), key=shell.getKey(normalized);
    if(!key&&normalized!=='shift-tab')return;
    e.preventDefault();if(key)key.click();else physical(normalized);
  });
  const action=e=>({Menu:'menu',Tab:'tab',Enter:'enter','.':'dot',E:'e'})[e.label]||e.label;
  function renderWatch(device,{beat,point,crossed,key}){
    if(tryHost.parentElement!==device)device.append(tryHost);
    const press=crossed.at(-1), duration=point.span.end-point.span.voiceEnd;
    const lit=press&&!point.speaking&&key?.beat===beat&&(point.fraction-key.at)*duration<.6;
    shell.setKeys(lit?[action(press)]:[]);
    const alt=beat===5?'strict':beat===4&&(!point.speaking||point.audioTime>=28.089)?'at-most':'';
    const current=beat+':'+crossed.length+':'+alt;
    if(current===stamp)return;
    stamp=current;const s=base(null);for(const p of crossed)step(s,action(p));
    if(alt){
      s.page='wizard';s.field=-1;s.values=['12','0.25',alt==='strict'?'6':'0',alt==='strict'?'12':'5'];
      paint(s);
      const dialog=work.querySelector('.lcd-dialog');
      dialog.querySelector('.lcd-ok').remove();
      const note=document.createElement('p');note.className='bounds-preview';note.textContent='Bounds preview · not calculated';dialog.append(note);
    }else paint(s);
  }
  function enterTry(device,actions){
    returnToWatch=actions.returnToWatch;shown=true;device.prepend(panel);dock.prepend(tryHost);
    panel.hidden=false;shell.setInteractive(true);paintTry();tryHost.focus({preventScroll:true});
  }
  function exitTry(){shown=false;stamp='';panel.hidden=true;shell.setInteractive(false)}
  $('return-watch').addEventListener('click',()=>returnToWatch?.());
  $('reset-try').addEventListener('click',()=>{live=base(setup.prefill);$('answer').value='';$('feedback').textContent='';paintTry();tryHost.focus({preventScroll:true})});
  if(setup.invalid){$('link-notice').hidden=false;$('link-notice').textContent='The linked values were not valid. The original Try is ready.'}
  const {n,p}=setup.data, target=bounds(setup.data);
  $('challenge-prompt').textContent='For '+n+' independent trials with success probability '+p+', find P('+target.label+').';
  $('answer').addEventListener('input',()=>{$('feedback').textContent=''});
  $('answer-form').addEventListener('submit',event=>{
    event.preventDefault();const raw=$('answer').value.trim().replace(',','.'), v=Number(raw), result=mass({n,p,...target}), f=$('feedback');
    const valid=/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(raw)&&Number.isFinite(v)&&v<=1;
    const correct=valid&&v===Number(result.toPrecision(3));
    if(result===0&&target.lo<=target.hi&&p>0&&p<1){f.textContent='This nonzero probability is below the simulator display range.';f.classList.add('bad');return}
    f.textContent=!valid?'Enter a probability between 0 and 1.':correct?'Correct. You included the right counts.':Math.abs(v-result)<=Math.max(Number.MIN_VALUE,Math.abs(result)*.00055)?'The probability is right. Now round it to three significant figures.':'Not yet. Check the first and last included counts.';
    f.classList.toggle('bad',!correct);
  });
  window.CalculatorLessonAdapter=Object.freeze({initialMode:tryMode?'try':'watch',renderWatch,enterTry,exitTry});
})();
