/* Calculator-only inline numerator/denominator input. Generated text never leaves this widget. */
(function(root){
 'use strict';
 function mount({entry,input,calc,notify}){
  const el=(tag,cls)=>{const e=document.createElement(tag);e.className=cls;return e;};
  const box=el('div','neutral-fraction-editor'), stack=el('div','neutral-fraction-fields'), prefixNode=el('span','neutral-frac-prefix'), suffixNode=el('span','neutral-frac-suffix');
  box.setAttribute('role','group');box.setAttribute('aria-label','Fraction template');box.hidden=true;
  const fields=['Numerator','Denominator'].map(name=>{
   const f=el('input','neutral-frac-'+name.toLowerCase());f.type='text';f.inputMode='none';f.autocomplete='off';f.spellcheck=false;f.maxLength=64;f.placeholder='□';f.setAttribute('aria-label',name);stack.append(f);return f;
  });
  box.append(prefixNode,stack,suffixNode);entry.append(box);
  let active=-1, prefix='', suffix='';
  const size=()=>stack.style.setProperty('--ti-fraction-cols',Math.max(1.65,...fields.map(f=>f.value.length+.65))+'ch');
  fields.forEach(f=>f.addEventListener('input',size));
  const focus=(i,end=true)=>{active=i;fields[i].focus({preventScroll:true});const p=end?fields[i].value.length:0;fields[i].setSelectionRange(p,p);};
  fields.forEach((f,i)=>f.addEventListener('focus',()=>{active=i;}));
  function open(){
   if(active>=0){notify('Use / with parentheses for a fraction inside a box.');return;}
   const s=calc.getState(), a=input.selectionStart,b=input.selectionEnd;
   prefix=s.justEvaluated?'':s.expression.slice(0,a);suffix=s.justEvaluated?'':s.expression.slice(b);
   fields[0].value=s.justEvaluated?'':s.expression.slice(a,b);fields[1].value='';size();
   prefixNode.textContent=prefix;suffixNode.textContent=suffix;
   entry.dataset.fraction='true';box.hidden=false;input.hidden=true;notify('Fill the numerator, then press Down or Tab for the denominator. Press Enter to calculate.');focus(0);
  }
  function leave({cancel=false,commit=false,approximate=false}={}){
   if(active<0)return true;
   const n=fields[0].value.trim(),d=fields[1].value.trim();
   if(!cancel&&(!n||!d)){notify('Fill both the numerator and denominator first.');focus(n?1:0);return false;}
   let expression,at;
   if(!cancel){
     const part='(('+n+')/('+d+'))';expression=prefix+part+suffix;at=prefix.length+part.length;
     if(expression.length>root.TIFreeCalc.MAX_TEXT){notify('That calculation is too long.');return false;}
   }
   active=-1;box.hidden=true;input.hidden=false;delete entry.dataset.fraction;notify('');
   if(!cancel)calc.setText(expression,at);
   input.focus({preventScroll:true});
   if(commit)calc.press(approximate?'approx':'enter');
   return true;
  }
  const tokens={plus:'+',minus:'-',neg:'-',mul:'*',div:'/',dot:'.',lparen:'(',rparen:')',power:'^',square:'^2',exp:'e^(',tenpow:'10^(',pi:'π',ee:'e',ans:'Ans',sqrt:'√(',ln:'ln(',log:'log(',space:' '};
  function key(k, event){
   if(active<0)return false;
   if(['menu','doc','home','scratchpad','catalog','symbols','templates','trig','var'].includes(k)){
    return !leave();
   }
   if(k==='esc'||k==='clear'){leave({cancel:true});return true;}
   if(k==='fraction'){open();return true;}
   if(['enter','return','approx','eq'].includes(k)){leave({commit:true,approximate:k==='approx'});return true;}
   if(k==='tab'){if(active===0)focus(1);else leave();return true;}
   if(k==='backtab'){if(active===1)focus(0);return true;}
   if(k==='down'||k==='up'){focus(k==='down'?1:0);return true;}
   if(k==='select'){fields[active].focus({preventScroll:true});return true;}
   const f=fields[active],a=f.selectionStart,b=f.selectionEnd;
   if(k==='right'||k==='left'){
    if(k==='right'&&a===b&&b===f.value.length){
      if(active===0)focus(1,false);else leave();
    }else if(k==='left'&&active===1&&a===b&&a===0)focus(0);
    else if(!event){const p=k==='right'?Math.min(f.value.length,b+1):Math.max(0,a-1);f.setSelectionRange(p,p);}
    else return false;
    return true;
   }
   if(event)return false; // Ordinary computer typing edits the focused HTML field.
   f.focus({preventScroll:true});
   if(k==='del'){
    f.setRangeText('',a===b?Math.max(0,a-1):a,b,'end');size();return true;
   }
   const fragment=tokens[k]??(/^[0-9a-z%!]+$/.test(k)&&k.length===1?k:null);
   if(fragment&&f.value.length-(b-a)+fragment.length<=64){f.setRangeText(fragment,a,b,'end');size();}
   return true;
  }
  return Object.freeze({open,key,active:()=>active>=0,owns:target=>box.contains(target),focus:()=>fields[active]?.focus({preventScroll:true})});
 }
 root.NspireFraction=Object.freeze({mount});
})(window);
