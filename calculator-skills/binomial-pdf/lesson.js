'use strict';
(function(){
  const $=id=>document.getElementById(id), tryHost=$('try-host'), work=$('try-work'), panel=$('try'), dock=tryHost.parentElement;
  const fields=['Num Trials','Probability of Success','X Value'];
  const items={
    top:[['1','Actions'],['2','Number'],['3','Algebra'],['4','Calculus'],['5','Probability','probability'],['6','Statistics']],
    probability:[['1','Factorial'],['2','Permutations'],['3','Combinations'],['4','Random'],['5','Distributions','distributions']],
    distributions:[['D','Binomial Pdf','wizard'],['E','Binomial Cdf'],['F','Inverse Binomial']]
  };
  const esc=x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  const base=prefill=>({page:'idle',index:0,field:0,change:true,values:['','',''],prefill,history:[],command:'',error:''});
  const decimal=/^(?:\d+(?:\.\d*)?|\.\d+)$/;
  function val(raw){
    const [n,p,k]=raw;
    const number=x=>decimal.test(x)?Number(x):NaN;
    let frac=p.split('/'),pr=frac.length===1?number(p):frac.length===2?number(frac[0])/number(frac[1]):NaN;
    const trials=number(n),count=number(k);
    if(!Number.isInteger(trials)||trials<1||trials>500)throw Error('Enter a whole trial count from 1 to 500.');
    if(!Number.isFinite(pr)||pr<0||pr>1)throw Error('Enter a success probability between 0 and 1.');
    if(!Number.isInteger(count)||count<0||count>trials)throw Error('Enter a whole X Value from zero to the trial count.');
    return {n:trials,p:pr,k:count};
  }
  // Sum ratios outwards from the mode. No overflowing binomial coefficient.
  function mass({n,p,k}){
    if(p===0)return k===0?1:0;if(p===1)return k===n?1:0;
    const m=Math.min(n,Math.floor((n+1)*p));
    let total=1,selected=m===k?1:0,w=1;
    for(let i=m;i>0;i--){w*=i/(n-i+1)*(1-p)/p;total+=w;if(i-1===k)selected=w;}
    w=1;for(let i=m;i<n;i++){w*=(n-i)/(i+1)*p/(1-p);total+=w;if(i+1===k)selected=w;}
    return Math.min(1,selected/total);
  }
  const fmt=n=>n<1e-5&&n!==0?n.toExponential(5):String(Number(n.toPrecision(6)));
  function step(s,k){
    if(k==='menu'){s.page='top';s.index=4;return}
    if(k==='esc'){
      if(s.page==='wizard'){s.page='distributions';s.index=0}
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
      if(!choice[2])throw Error('This lesson uses Probability → Distributions → Binomial Pdf.');
      s.page=choice[2];s.index=s.page==='probability'?4:0;
      if(s.page==='wizard'){
        if(s.prefill){s.values=s.prefill.slice();s.prefill=null}
        s.field=0;s.change=true;
      }
      return;
    }
    if(s.page==='wizard'){
      if(['tab','shift-tab','up','down'].includes(k)){s.field=(s.field+(['shift-tab','up'].includes(k)?4:1))%5;s.change=true;return}
      if(['enter','select'].includes(k)){
        if(s.field===4){s.page='distributions';s.index=0;return}
        const v=val(s.values);s.command='binomPdf('+[v.n,s.values[1],v.k].join(',')+')';s.page='entry';return;
      }
      if(s.field>2)return;
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
    if(s.page==='wizard')return '<div class="lcd-dialog"><strong>Binomial Pdf</strong>'+fields.map((n,i)=>'<div data-field="'+i+'" class="lcd-field'+(s.field===i?' active':'')+'"><span>'+n+':</span><span>'+esc(s.values[i])+'&nbsp;</span></div>').join('')+'<div class="lcd-ok"><span data-dialog="3" class="'+(s.field===3?'active':'')+'">OK</span> <span data-dialog="4" class="'+(s.field===4?'active':'')+'">Cancel</span></div></div>';
    return s.history.map(h=>'<div><p>'+esc(h.command)+'</p><p class="answers"><strong>'+esc(h.result)+'</strong></p></div>').join('')+'<div class="entry"><p>'+esc(s.page==='entry'?s.command:'▏')+'</p></div>';
  }
  const params=new URLSearchParams(location.search), original={n:10,p:.4,k:2}, paramIds=['n','p','k'];
  const tryMode=params.get('mode')==='try';
  function assignment(){
    const named=['example','case'].filter(k=>params.has(k)), typed=paramIds.filter(k=>params.has(k));
    if(!typed.length&&!named.length)return {data:original};
    if(['mode','example','case',...paramIds].some(k=>params.getAll(k).length>1))return {data:original,invalid:true};
    if(!typed.length&&named.length===1&&(params.get('example')==='demo'||params.get('case')==='binomial-pdf-demo'))return {data:original,prefill:['10','0.4','2']};
    if(named.length||typed.length!==3)return {data:original,invalid:true};
    const raw=paramIds.map(k=>params.get(k));
    if(!/^\d{1,3}$/.test(raw[0])||!/^\d{1,3}$/.test(raw[2])||!/^(?:[01](?:\.\d{1,15})?|\.\d{1,15})$/.test(raw[1]))return {data:original,invalid:true};
    try{return {data:val(raw),prefill:raw}}catch{return {data:original,invalid:true}}
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
    if(e.key==='Tab'&&(!focused||live.page!=='wizard'||(e.shiftKey?live.field===0:live.field===4)))return;
    const k=e.key.toLowerCase()==='m'&&live.page!=='wizard'?'menu':e.key==='Tab'?(e.shiftKey?'shift-tab':'tab'):e.key;
    const normalized=HandheldShell.normalizeKey(k), key=shell.getKey(normalized);
    if(!key&&normalized!=='shift-tab')return;
    e.preventDefault();if(key)key.click();else physical(normalized);
  });
  const action=e=>({Menu:'menu',Tab:'tab',Enter:'enter','.':'dot',D:'d'})[e.label]||e.label;
  function renderWatch(device,{beat,point,crossed,key}){
    if(tryHost.parentElement!==device)device.append(tryHost);
    const press=crossed.at(-1), duration=point.span.end-point.span.voiceEnd;
    const lit=press&&!point.speaking&&key?.beat===beat&&(point.fraction-key.at)*duration<.6;
    shell.setKeys(lit?[action(press)]:[]);
    const current=beat+':'+crossed.length;
    if(current===stamp)return;
    stamp=current;const s=base(null);for(const p of crossed)step(s,action(p));
    paint(s);
  }
  function enterTry(device,actions){
    returnToWatch=actions.returnToWatch;shown=true;device.prepend(panel);dock.prepend(tryHost);
    panel.hidden=false;shell.setInteractive(true);paintTry();tryHost.focus({preventScroll:true});
  }
  function exitTry(){shown=false;stamp='';panel.hidden=true;shell.setInteractive(false)}
  $('return-watch').addEventListener('click',()=>returnToWatch?.());
  $('reset-try').addEventListener('click',()=>{live=base(setup.prefill);$('answer').value='';$('feedback').textContent='';paintTry();tryHost.focus({preventScroll:true})});
  if(setup.invalid){$('link-notice').hidden=false;$('link-notice').textContent='The linked values were not valid. The original Try is ready.'}
  const {n,p,k}=setup.data;
  $('challenge-prompt').textContent='For '+n+' independent trials with success probability '+p+', find the probability of exactly '+k+' successes.';
  $('answer').addEventListener('input',()=>{$('feedback').textContent=''});
  $('answer-form').addEventListener('submit',event=>{
    event.preventDefault();const raw=$('answer').value.trim().replace(',','.'), v=Number(raw), result=mass(setup.data), f=$('feedback');
    const valid=/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(raw)&&Number.isFinite(v)&&v<=1;
    const correct=valid&&v===Number(result.toPrecision(3));
    if(result===0&&p>0&&p<1){f.textContent='This nonzero probability is below the simulator display range.';f.classList.add('bad');return}
    f.textContent=!valid?'Enter a probability between 0 and 1.':correct?'Correct. That is the probability of exactly '+k+'.':Math.abs(v-result)<=Math.max(Number.MIN_VALUE,Math.abs(result)*.00055)?'The probability is right. Now round it to three significant figures.':'Not yet. Check n, p and the single X Value.';
    f.classList.toggle('bad',!correct);
  });
  window.CalculatorLessonAdapter=Object.freeze({initialMode:tryMode?'try':'watch',renderWatch,enterTry,exitTry});
})();
