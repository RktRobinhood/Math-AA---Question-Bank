/* Structured LCD editor for Scratchpad Graphs. Each editable leaf is a real
   text control. The original graph parser remains the only evaluator. */
(function(root){
'use strict';
const el=(type,cls)=>{const n=document.createElement(type);if(cls)n.className=cls;return n;};
const leaf=text=>({text});
const row=(text='')=>[leaf(text)];
const clone=tree=>JSON.parse(JSON.stringify(tree));
function serialize(tree){
 return tree.map(n=>{
   if('text' in n)return n.text;
   if(n.kind==='power'){
    const exp=serialize(n.exp).trim();
    if(!exp)throw Error('Enter an exponent.');
    return '^('+exp+')';
   }
   const top=serialize(n.top).trim(),bottom=serialize(n.bottom).trim();
   if(!top||!bottom)throw Error('Enter the numerator and denominator.');
   return '(('+top+')/('+bottom+'))';
 }).join('');
}
function mount({line,input,notify}){
 const view=el('div','np-mathprint');view.hidden=true;view.setAttribute('role','group');line.append(view);
 let tree=null,index=0,fields=[],selection=null;
 function measure(field){
   const glyphs=field.input.value.length;
   field.input.style.width=(glyphs?glyphs+.38:field.context?'0.87':'.48')+'ch';
   field.input.dataset.empty=String(!glyphs);
 }
 function focusField(field,pos){
   if(!field)return;
   selection=field;field.input.focus({preventScroll:true});
   const p=pos??field.input.value.length;field.input.setSelectionRange(p,p);
   const a=field.input.getBoundingClientRect(),b=view.getBoundingClientRect();
   if(a.right>b.right)view.scrollLeft+=a.right-b.right;
   if(a.left<b.left)view.scrollLeft-=b.left-a.left;
 }
 function locate(node){return fields.find(x=>x.node===node);}
 function render(next,pos){
   fields=[];
   view.setAttribute('aria-label','Function f'+(index+1)+' equation editor');
   function draw(items,parent,context='',ancestors=[]){
    for(let i=0;i<items.length;i++){
     const node=items[i];
     if('text' in node){
      const f=el('input','np-mathprint-slot');
      f.type='text';f.inputMode='none';f.autocomplete='off';f.spellcheck=false;f.maxLength=128;f.value=node.text;
      f.setAttribute('aria-label',context||('Function f'+(index+1)+' baseline'));
      if(context)f.dataset.placeholder='true';
      const field={input:f,node,items,index:i,context,ancestors};fields.push(field);
      measure(field);
      f.addEventListener('input',()=>{node.text=f.value;measure(field);});
      f.addEventListener('focus',()=>{selection=field;});
      parent.append(f);
     }else{
      const boundary=part=>ancestors.concat({node,part,items,index:i});
      if(node.kind==='power'){
       const sup=el('sup','np-mathprint-power'),exp=el('span','np-mathprint-row');
       draw(node.exp,exp,'Exponent',boundary('exp'));sup.append(exp);parent.append(sup);
      }else{
       const frac=el('span','np-mathprint-fraction'),top=el('span','np-mathprint-row np-mathprint-top'),bottom=el('span','np-mathprint-row np-mathprint-bottom');
       draw(node.top,top,'Numerator',boundary('top'));draw(node.bottom,bottom,'Denominator',boundary('bottom'));
       frac.append(top,bottom);parent.append(frac);
      }
     }
    }
   }
   const group=el('span','np-mathprint-row');draw(tree,group);view.replaceChildren(group);
   if(next)focusField(locate(next),pos);
   else selection=fields.at(-1);
 }
 function restore(model,n){
   index=n;tree=model?clone(model):null;view.hidden=!tree;input.hidden=!!tree;line.classList.toggle('np-structured',!!tree);selection=null;
   if(tree)render();
 }
 function save(){return tree?clone(tree):null;}
 function owns(target){return !!tree&&view.contains(target);}
 function focus(){if(tree)focusField(selection??fields.at(-1),selection?.input.selectionEnd);else input.focus({preventScroll:true});}
 function activeField(){return fields.find(x=>x.input===document.activeElement)??selection??fields.at(-1);}
 function insert(kind,n,square=false,base=''){
   index=n;
   let field,node,items,i,a,b,original;
   if(tree){
    field=activeField();if(field.ancestors.length>=3||fields.length>=24){notify('This expression has too many nested templates.');return true;}
    ({node,items,index:i}=field);original=node.text;a=field.input.selectionStart;b=field.input.selectionEnd;
   }else{
    original=input.value;a=input.selectionStart;b=input.selectionEnd;tree=row(original);items=tree;i=0;node=items[0];
    view.hidden=false;input.hidden=true;line.classList.add('np-structured');
   }
   const picked=original.slice(a,b),before=original.slice(0,a),after=original.slice(b);
   node.text=before+(kind==='power'?picked+base:'');
   const part=kind==='power'?{kind,exp:row(square?'2':'')}:{kind,top:row(picked),bottom:row()};
   const tail=leaf(after);
   items.splice(i+1,0,part,tail);
   render(kind==='power'?(square?tail:part.exp[0]):part.top[0],square?0:undefined);
   notify('');return true;
 }
 function insertText(head,tail=''){
   const f=activeField();
   if(!f)return false;
   const a=f.input.selectionStart,b=f.input.selectionEnd;
   if(f.input.value.length-b+a+head.length+tail.length>128){notify('This part of the expression is too long.');return true;}
   f.input.setRangeText(head+tail,a,b,'end');f.input.setSelectionRange(a+head.length,a+head.length);
   f.node.text=f.input.value;measure(f);return true;
 }
 function move(k,physical=false){
   const f=activeField();if(!f)return false;
   const a=f.input.selectionStart,b=f.input.selectionEnd,last=f.input.value.length,j=fields.indexOf(f);
   const group=[...f.ancestors].reverse().find(x=>x.node.kind==='fraction');
   if(k==='up'||k==='down'){
    if(group){
     const slot=k==='up'?'top':'bottom';
     if(group.part!==slot){focusField(fields.find(x=>x.ancestors.some(q=>q.node===group.node&&q.part===slot)));return true;}
    }
    if(k==='down'&&f.ancestors.at(-1)?.part==='exp'){
     const parent=f.ancestors.at(-1);focusField(locate(parent.items[parent.index+1]),0);
    }
    return true;
   }
   if(k==='tab'||k==='backtab'){
     const next=fields[j+(k==='tab'?1:-1)];
     if(!next)return false;
     focusField(next,k==='tab'?0:undefined);return true;
   }
   const direction=k==='left'?-1:1;
   if(a===b&&(direction<0?a===0:b===last)){
     const next=fields[j+direction];if(next)focusField(next,direction>0?0:undefined);return true;
   }
   if(physical)return false;
   const p=a!==b?(direction<0?a:b):a+direction;f.input.setSelectionRange(p,p);return true;
 }
 function erase(){
   const f=activeField();
   if(!f)return false;
   const a=f.input.selectionStart,b=f.input.selectionEnd;
   if(a===0&&b===0){
    // Backspace at a baseline immediately after a template removes it.
    const previous=f.items[f.index-1];
    if(previous&&!('text' in previous)){
     const prior=f.items[f.index-2],cursor=prior.text.length;
     prior.text+=f.node.text;f.items.splice(f.index-1,2);render(prior,cursor);return true;
    }
    return move('left');
   }
   f.input.setRangeText('',a===b?Math.max(0,a-1):a,b,'end');
   f.node.text=f.input.value;measure(f);return true;
 }
 return {active:()=>!!tree,save,restore,owns,focus,insert,insertText,move,erase,expression:()=>tree?serialize(tree):input.value};
}
root.NspireGraphMathPrint=Object.freeze({mount,serialize});
})(globalThis);
