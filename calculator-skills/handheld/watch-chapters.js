/* A presentation-only chapter rail. The episode owns key timing and seeking. */
(function(global){
'use strict';
let sequence=0;
const text=(value,field)=>{
 if(typeof value!=='string'||!value.trim())throw new TypeError(field+' must be nonempty text');
 return value;
};
function normalize(chapters){
 if(!Array.isArray(chapters)||!chapters.length)throw new TypeError('Watch chapters must be a nonempty array');
 const seenChapters=new Set();
 return chapters.map((chapter)=>{
  if(!chapter||!Array.isArray(chapter.keys))throw new TypeError('A watch chapter requires a keys array');
  const id=text(chapter.id,'Chapter id'),title=text(chapter.title,'Chapter title');
  if(seenChapters.has(id))throw new TypeError('Duplicate watch chapter id: '+id);
  seenChapters.add(id);
  const tip=chapter.tip==null?'':text(chapter.tip,'Chapter tip');
  const seenKeys=new Set(),keys=chapter.keys.map((key)=>{
   const kid=text(key?.id,'Key id'),label=text(key?.label,'Key label');
   if(seenKeys.has(kid))throw new TypeError('Duplicate key occurrence in '+id+': '+kid);
   seenKeys.add(kid);
   return {id:kid,label,ariaLabel:key.ariaLabel==null?label:text(key.ariaLabel,'Key accessible label')};
  });
  return {id,title,tip,keys};
 });
}
function mount(root,chapters,{onChapter=()=>{},label='Lesson chapters'}={}){
 if(!root||root.nodeType!==1)throw new TypeError('A chapter rail requires a DOM element');
 if(typeof onChapter!=='function')throw new TypeError('onChapter must be a function');
 const data=normalize(chapters),doc=root.ownerDocument,prefix='qb-watch-chapters-'+(++sequence);
 const el=(tag,className,value)=>{
  const node=doc.createElement(tag);
  if(className)node.className=className;
  if(value!==undefined)node.textContent=value;
  return node;
 };
 const list=el('ol','qb-watch-chapters');
 list.setAttribute('aria-label',text(label,'Chapter rail label'));
 list.setAttribute('role','list');
 const rows=data.map(({id,title,tip,keys},i)=>{
  const row=el('li','qb-watch-chapters__row'),button=el('button','qb-watch-chapters__button');
  button.type='button';button.dataset.chapterId=id;
  button.setAttribute('aria-label',title);
  const index=el('span','qb-watch-chapters__index',String(i+1).padStart(2,'0'));
  index.setAttribute('aria-hidden','true');
  button.append(index,el('span','qb-watch-chapters__title',title));
  const chips=keys.map(({id,label})=>{
   const chip=el('kbd','qb-watch-chapters__key',label);
   chip.dataset.keyId=id;
   return chip;
  });
  if(chips.length){
   const strip=el('span','qb-watch-chapters__keys');strip.setAttribute('aria-hidden','true');
   strip.append(...chips);button.append(strip);
  }
  row.append(button);
  const details=[keys.length?'Keys: '+keys.map(key=>key.ariaLabel).join(', ')+'.':'',tip].filter(Boolean);
  if(details.length){
   const description=el('span','qb-watch-chapters__description',details.join(' '));
   description.id=prefix+'-'+i;description.hidden=true;
   row.append(description);button.setAttribute('aria-describedby',description.id);
  }
  const listener=event=>onChapter(id,event);
  button.addEventListener('click',listener);
  list.append(row);
  return {id,button,chips,listener,keys};
 });
 const tip=el('p','qb-watch-chapters__tip');
 let currentChapter=null,currentKey=null,destroyed=false;
 function setState({chapterId=null,keyId=null}={}){
  if(destroyed)return;
  const index=chapterId===null?-1:rows.findIndex(row=>row.id===chapterId);
  if(chapterId!==null&&index<0)throw new RangeError('Unknown watch chapter: '+chapterId);
  const keyIndex=keyId===null?-1:rows[index]?.keys.findIndex(key=>key.id===keyId);
  if(keyId!==null&&!(keyIndex>=0))throw new RangeError('Unknown key occurrence for watch chapter: '+keyId);
  if(currentChapter===chapterId&&currentKey===keyId&&list.dataset.initialized)return;
  currentChapter=chapterId;currentKey=keyId;list.dataset.initialized='true';
  rows.forEach(({button,chips},i)=>{
   const status=i<index?'done':i===index?'current':'upcoming';
   button.dataset.progress=status;
   if(i===index)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');
   chips.forEach((chip,j)=>{
    chip.dataset.progress=i<index||i===index&&j<keyIndex?'done':i===index&&j===keyIndex?'current':'upcoming';
   });
  });
  const note=data[index]?.tip||'';
  if(tip.textContent!==note)tip.textContent=note;
  tip.hidden=!note;
 }
 function destroy(){
  if(destroyed)return;
  destroyed=true;
  rows.forEach(({button,listener})=>button.removeEventListener('click',listener));
  list.remove();tip.remove();
 }
 setState({chapterId:data[0].id,keyId:null});root.append(list,tip);
 return Object.freeze({setState,destroy});
}
global.CalculatorWatchChapters=Object.freeze({mount});
})(globalThis);
