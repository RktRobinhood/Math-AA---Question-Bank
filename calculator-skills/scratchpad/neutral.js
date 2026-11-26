/* Standalone Practice calculator. No problem or lesson context; no global key listener. */
(function(root){
  'use strict';
  const live=new WeakMap();
  function mount(host,{mode='DEG'}={}){
    if(typeof host==='string')host=document.querySelector(host);
    if(!host||typeof host.append!=='function')throw new TypeError('Mount the calculator into an existing element.');
    if(live.has(host))return live.get(host);
    const calc=root.TIFreeCalc.create({mode}), listeners=[], el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;};
    const on=(target,type,fn)=>{target.addEventListener(type,fn);listeners.push(()=>target.removeEventListener(type,fn));};
    const widget=el('section','neutral-calc'), glass=el('div','neutral-glass'), holder=el('div','neutral-handheld'), head=el('div','neutral-status','Calculator');
    widget.setAttribute('aria-label','Calculator');widget.tabIndex=-1;
    const angle=el('button','neutral-angle-text'),history=el('div','neutral-history'),input=el('input','neutral-entry'),error=el('div','neutral-error');
    history.setAttribute('aria-label','Calculation history');
    angle.type='button';on(angle,'click',()=>{calc.setMode(calc.getState().mode==='DEG'?'RAD':'DEG');ui.focusPage();});
    input.type='text';input.autocomplete='off';input.spellcheck=false;input.inputMode='none';input.maxLength=root.TIFreeCalc.MAX_TEXT;input.setAttribute('aria-label','Calculator expression');
    const entry=el('div','neutral-edit'),caret=el('span','neutral-caret'),measure=el('span','neutral-measure');
    const announcement=el('div','neutral-sr');
    announcement.setAttribute('role','status');
    caret.setAttribute('aria-hidden','true');measure.setAttribute('aria-hidden','true');
    error.setAttribute('role','status');head.append(angle);entry.append(input,measure,caret);
    glass.append(head,history,entry,error,announcement);holder.append(glass);
    const trig=el('div','neutral-trig');trig.hidden=true;trig.setAttribute('role','group');trig.setAttribute('aria-label','Trigonometric functions');
    const trigNames=['sin','cos','tan','sin⁻¹','cos⁻¹','tan⁻¹'];
    const trigButtons=trigNames.map((label,i)=>{
      const b=el('button',null,label);b.type='button';trig.append(b);on(b,'click',()=>chooseTrig(i));return b;
    });
    glass.append(trig);
    const notice=el('div','np-notice');notice.setAttribute('role','status');
    const scope=el('small','np-scope','Red labels show Ctrl shortcuts, not disabled keys. Press trig for inverse trig. Some shortcuts are not simulated.');
    widget.append(holder,notice,scope);host.append(widget);
    const say=msg=>{notice.textContent=msg||'';notice.hidden=!msg;};
    say('');
    const shell=root.HandheldShell.mount({host:holder,screen:glass,label:'TI-Nspire CX II-T keypad',onKey:press});
    const pointer=root.HandheldScreenPointer.mount(holder,glass);
    const allowed=new Set(['esc','ctrl','del','eq','trig','menu','scratchpad','home','doc','catalog','tab','templates','symbols','var','comma','space',...'abcdefghijklmnopqrstuvwxyz','up','down','left','right','select','power','square','exp','tenpow','lparen','rparen','pi','ee','mul','div','plus','minus','neg','dot','enter','return',...'0123456789']);
    for(const b of holder.querySelectorAll('[data-hh-key]'))if(!allowed.has(b.dataset.hhKey)){b.disabled=true;b.tabIndex=-1;b.title='Not simulated in this practice handheld';}
    let ctrl=false,stamp='',selection=[0,0],schedule=0,activeHistory=null,flashTimer=0,trigPick=0;
    const shifted={div:'fraction',square:'sqrt',neg:'ans',del:'clear',exp:'ln',tenpow:'log',enter:'approx',return:'approx'};
    const controls={fraction:'Control and Divide opens the fraction template',sqrt:'Control and Square opens square root',ans:'Control and Negative inserts the last answer',clear:'Control and Delete clears the entry',ln:'Control and e to a power opens natural logarithm',log:'Control and Ten to a power opens base-ten logarithm',approx:'Control and Enter calculates a decimal approximation'};
    for(const [key,action] of Object.entries(shifted)){
      const btn=shell.getKey(key);if(btn)btn.title=controls[action];
    }
    shell.getKey('ctrl').title='Control: select a printed secondary function';
    shell.getKey('trig').title='Open sine, cosine, tangent and their inverses';
    function paintCaret(){
      const state=calc.getState();
      const start=input.selectionStart,end=input.selectionEnd;
      caret.hidden=state.historyPart!==null||start!==end;
      if(caret.hidden)return;
      measure.textContent=input.value.slice(0,start);
      const left=4+measure.getBoundingClientRect().width-input.scrollLeft;
      caret.style.left=Math.min(input.clientWidth-3,Math.max(3,left))+'px';
    }
    function queueCaret(){cancelAnimationFrame(schedule);schedule=requestAnimationFrame(paintCaret);}
    const capture=()=>{selection=[input.selectionStart,input.selectionEnd];queueCaret();};
    const fraction=root.NspireFraction.mount({entry,input,calc,notify:say});
    const ui=root.NspireApplet.mount({glass,widget,head,entry,history,error,calc,input,notify:say,focusCalc:()=>input.focus({preventScroll:true}),insertFraction:fraction.open});
    function flash(keys){
      clearTimeout(flashTimer);shell.setKeys(keys);
      flashTimer=setTimeout(()=>shell.setKeys(ctrl?['ctrl']:[]),220);
    }
    function trigFocus(index){
      trigPick=index;trigButtons.forEach((b,i)=>{b.dataset.current=String(i===index);b.tabIndex=i===index?0:-1;});
      trigButtons[index].focus({preventScroll:true});
    }
    function closeTrig(){trig.hidden=true;input.focus({preventScroll:true});}
    function chooseTrig(i){
      const s=calc.getState(),a=selection[0],b=selection[1],head=trigNames[i]+'(';
      const prefix=s.justEvaluated?'':s.expression.slice(0,a),arg=s.justEvaluated?'':s.expression.slice(a,b);
      const suffix=s.justEvaluated?'':s.expression.slice(b),next=prefix+head+arg+')'+suffix;
      closeTrig();
      if(next.length>root.TIFreeCalc.MAX_TEXT){say('That calculation is too long.');return;}
      calc.setText(next,prefix.length+head.length);
    }
    function press(k, event, bypassCtrl=false){
      if(k==='select'&&pointer.press())return;
      if(['menu','doc','home','scratchpad','esc'].includes(k))pointer.hide();
      if(k==='ctrl'){ctrl=!ctrl;clearTimeout(flashTimer);shell.setKeys(ctrl?['ctrl']:[]);say(ctrl?'Ctrl selected. Tap ÷ for a fraction, x² for √, or Enter for a decimal result.':'');return;}
      if(ctrl&&!bypassCtrl){
        const primary=k, next=ui.isGraph()&&!ui.isMenu()&&!ui.isDialog()&&(k==='t'||k==='tab')?(k==='t'?'toggle-table':'switch-pane'):shifted[k];ctrl=false;flash(['ctrl',primary]);
        if(!next){say(k==='trig'?'Press trig by itself for inverse sine, cosine or tangent.':'That Ctrl shortcut is not simulated. Press the key without Ctrl for its main function.');return;}
        say('');k=next;
      }
      if(!trig.hidden){
        if(k==='esc'||k==='trig'){closeTrig();return;}
        if(['left','right','up','down','tab','backtab'].includes(k)){
          const col=trigPick%3,row=Math.floor(trigPick/3);
          const index=k==='tab'?(trigPick+1)%6:k==='backtab'?(trigPick+5)%6:
            k==='up'||k==='down'?(1-row)*3+col:row*3+(col+(k==='right'?1:2))%3;
          trigFocus(index);return;
        }
        if(['enter','return','select'].includes(k)){chooseTrig(trigPick);return;}
        if(!['menu','home','doc','scratchpad'].includes(k))return;
        closeTrig();
      }
      if(fraction.key(k,event?.type==='keydown'?event:undefined))return;
      if(document.activeElement===input)capture();
      calc.setSelection(...selection);
      if(ui.key(k))return;
      if(['sqrt','ln','log'].includes(k)){
        const s=calc.getState(),[a,b]=selection,lead=(k==='sqrt'?'√':k)+'(';
        const left=s.justEvaluated?'':s.expression.slice(0,a),arg=s.justEvaluated?'':s.expression.slice(a,b),right=s.justEvaluated?'':s.expression.slice(b);
        const next=left+lead+arg+')'+right;
        if(next.length>root.TIFreeCalc.MAX_TEXT){say('That calculation is too long.');return;}
        calc.setText(next,left.length+lead.length);input.focus({preventScroll:true});return;
      }
      if(k==='eq'||k==='comma'){calc.insert(k==='eq'?'=':',');input.focus({preventScroll:true});return;}
      if(k==='trig'){trig.hidden=false;trigFocus(0);return;}
      if(k==='select')k='enter';
      calc.press(k);
      if(event?.detail>0)input.focus({preventScroll:true});
      queueCaret();
    }
    const unsub=calc.subscribe(s=>{
      if(input.value!==s.expression)input.value=s.expression;
      selection=[s.selectionStart,s.selectionEnd];
      input.setSelectionRange(...selection);
      angle.textContent=s.mode;
      const unit=s.mode==='DEG'?'Degrees':'Radians',other=s.mode==='DEG'?'Radians':'Degrees';
      angle.title=unit+' · click to use '+other.toLowerCase();angle.setAttribute('aria-label',unit+' angle mode; switch to '+other.toLowerCase());
      error.textContent=s.error;
      ui.setMode(s.mode);say(s.notice||'');
      const key=JSON.stringify(s.history);
      if(key!==stamp){
        stamp=key;activeHistory=null;
        history.replaceChildren(...s.history.map((h,i)=>{
          const row=el('div','neutral-row'),x=el('span','neutral-expression',h.expression),y=el('output','neutral-result',h.result);
          if(h.fraction&&/^-?\d{1,9}\/\d{1,9}$/.test(h.fraction)){const [numerator,denominator]=h.fraction.split('/');y.classList.add('neutral-ratio-result');y.dataset.numerator=numerator;y.dataset.denominator=denominator;}
          for(const [part,item] of [['expression',x],['result',y]]){item.dataset.part=part;item.dataset.index=String(i);}
          row.append(x,y);return row;
        }));
        history.scrollTop=history.scrollHeight;
      }
      const focused=s.historyPart&&history.children[s.historyIndex]?.querySelector('[data-part="'+s.historyPart+'"]');
      if(focused!==activeHistory){
        activeHistory?.classList.remove('neutral-selected');
        activeHistory=focused||null;activeHistory?.classList.add('neutral-selected');
        if(activeHistory){
          const a=activeHistory.getBoundingClientRect(),h=history.getBoundingClientRect();
          if(a.top<h.top)history.scrollTop-=h.top-a.top+2;
          if(a.bottom>h.bottom)history.scrollTop+=a.bottom-h.bottom+2;
          announcement.textContent=(s.historyPart==='result'?'Result: ':'Expression: ')+activeHistory.textContent;
        }else announcement.textContent='';
      }
      queueCaret();
    });
    on(history,'click',e=>{
      const hit=e.target.closest('[data-part]');
      if(hit){calc.setSelection(...selection);calc.selectHistory(Number(hit.dataset.index),hit.dataset.part);input.focus({preventScroll:true});}
    });
    on(holder,'pointerdown',e=>{if(e.target.closest('[data-hh-key]')&&(document.activeElement===input||fraction.owns(document.activeElement)))e.preventDefault();});
    on(input,'input',()=>calc.setText(input.value,input.selectionStart,input.selectionEnd));
    for(const type of ['select','pointerup','blur','focus','keyup','scroll'])on(input,type,capture);
    on(input,'keydown',e=>{
      const nav=calc.getState().historyPart?['ArrowLeft','ArrowRight']:[];
      if(!e.altKey&&!e.ctrlKey&&!e.metaKey&&!e.isComposing&&['Enter','=','Escape','ArrowUp','ArrowDown',...nav].includes(e.key)){
        e.preventDefault();e.stopPropagation();const k=root.HandheldShell.normalizeKey(e.key);flash([k]);press(k);
      }else if(!e.altKey&&!e.ctrlKey&&!e.metaKey&&!e.isComposing&&e.key.length===1){
        const k=root.HandheldShell.normalizeKey(e.key);if(shell.getKey(k))flash([k]);
      }
    });
    on(widget,'keydown',e=>{
      if(e.defaultPrevented||e.target.closest('select')||e.altKey||e.metaKey||e.isComposing)return;
      if(e.ctrlKey&&!ui.isDialog()&&!ui.isMenu()&&(e.key==='/'||e.code==='NumpadDivide')){
        e.preventDefault();e.stopPropagation();ctrl=false;flash(['ctrl','div']);press('fraction',undefined,true);return;
      }
      if(e.ctrlKey&&e.key==='Enter'&&!ui.isGraph()&&!ui.isDialog()&&!ui.isMenu()){
        e.preventDefault();e.stopPropagation();ctrl=false;flash(['ctrl','enter']);press('approx',undefined,true);return;
      }
      if(e.ctrlKey&&e.key.toLowerCase()==='t'&&ui.isGraph()&&!ui.isDialog()&&!ui.isMenu()){
        e.preventDefault();e.stopPropagation();ctrl=false;flash(['ctrl','t']);press('toggle-table',undefined,true);return;
      }
      if(e.ctrlKey&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter'].includes(e.key)){
       e.preventDefault();e.stopPropagation();
       if(e.key==='Enter')pointer.press();
       else pointer.move(e.key==='ArrowRight'?8:e.key==='ArrowLeft'?-8:0,e.key==='ArrowDown'?8:e.key==='ArrowUp'?-8:0);
       return;
      }
      if(e.ctrlKey)return;
      if(ctrl){
        const k=root.HandheldShell.normalizeKey(e.key);
        if(k!=='ctrl'&&shell.getKey(k)){e.preventDefault();e.stopPropagation();press(k);return;}
      }
      if(!trig.hidden){
        const k=e.shiftKey&&e.key==='Tab'?'backtab':root.HandheldShell.normalizeKey(e.key);
        if(['left','right','up','down','tab','backtab','enter','return','esc'].includes(k)){
          e.preventDefault();e.stopPropagation();if(shell.getKey(k))flash([k]);press(k);return;
        }
        return;
      }
      if(fraction.owns(e.target)){
        const k=e.shiftKey&&e.key==='Tab'?'backtab':root.HandheldShell.normalizeKey(e.key);
        if(fraction.key(k,e)){e.preventDefault();e.stopPropagation();if(shell.getKey(k))flash([k]);}
        return;
      }
      if(ui.isDialog()){
       if(ui.dialogKey(root.HandheldShell.normalizeKey(e.key),e)){e.preventDefault();e.stopPropagation();}
       return;
      }
      if(ui.isMenu()||ui.isTable()||e.target===ui.graphInput){
        const k=root.HandheldShell.normalizeKey(e.key);
        if(ui.isMenu()||ui.isTable()&&['left','right','up','down','esc','tab','enter','select'].includes(k)||['enter','esc','tab','up','down'].includes(k)||(['left','right'].includes(k)&&ui.wantsArrows())){
          e.preventDefault();e.stopPropagation();press(k);return;
        }
        return;
      }
      if(e.target===input)return;
      const k=root.HandheldShell.normalizeKey(e.key);
      if(e.target!==widget&&!['up','down','left','right'].includes(k))return;
      if(calc.handleKey(e)){e.stopPropagation();shell.setKeys([k]);setTimeout(()=>{if(!ctrl)shell.setKeys([]);},160);}
    });
    const resize=new ResizeObserver(queueCaret);resize.observe(entry);
    const api=Object.freeze({
      focus(){ui.focusPage();},
      clear(){press('clear');},
      getState:calc.getState,
      destroy(){resize.disconnect();cancelAnimationFrame(schedule);clearTimeout(flashTimer);unsub();listeners.forEach(off=>off());shell.destroy();widget.remove();live.delete(host);}
    });
    live.set(host,api);return api;
  }
  root.NeutralCalculator=Object.freeze({mount});
})(window);
