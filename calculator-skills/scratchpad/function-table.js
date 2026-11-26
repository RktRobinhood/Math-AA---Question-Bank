/* The Graphs value table shares the plotted functions; no worksheet cells or answer engine. */
(function(root){
'use strict';
const ROWS=12, LIMIT=100000;
const signatures={binompdf:3,binomcdf:4,poisspdf:2,poisscdf:3};
function parseRelation(raw,mode){
 const G=root.TIGraphGeneral,T=root.TICalcTools;
 if(!/^\s*(?:binom|poiss)(?:pdf|cdf)\s*\(/i.test(raw))return G.parse(raw,{angle:mode});
 const [cmd,args]=T.argumentsFor(raw)||[];
 if(!Object.hasOwn(signatures,cmd)||args.length!==signatures[cmd]||args.some(x=>!x))throw Error('Check the probability command and its arguments.');
 const parts=args.map(x=>G.parse(x,{angle:mode})), cache=new Map();
 const source=cmd+'('+args.join(',')+')';
 return Object.freeze({discrete:true,evaluate(x){
   if(!Number.isInteger(x)||Math.abs(x)>LIMIT)return NaN;
   if(cache.has(x))return cache.get(x);
   let y, i=0;
   try{y=T.evaluate(source,()=>parts[i++].evaluate(x),mode).value;}catch{y=NaN;}
   if(cache.size>640)cache.clear();
   cache.set(x,y);return y;
 }});
}
const el=(tag,c,text)=>{const n=document.createElement(tag);if(c)n.className=c;if(text!==undefined)n.textContent=text;return n;};
const fmt=x=>!Number.isFinite(x)?'undef':String(Number(x.toPrecision(9)));
function mount({plane,glass,graph,head,models,evaluate,onGraph,notify}){
 const panel=el('section','np-table');panel.hidden=true;panel.setAttribute('aria-label','Function table');
 const table=el('table'),thead=el('thead'),body=el('tbody');table.append(thead,body);panel.append(table);plane.append(panel);
 const dialog=el('form','np-dialog');dialog.hidden=true;dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label','Table Settings');
 const title=el('div','np-dialog-title','Table Settings'),fields=el('div','np-dialog-fields'),buttons=el('div','np-dialog-actions'),warn=el('div','np-dialog-warning');
 warn.setAttribute('role','status');
 const controls=['Table Start','Table Step'].map(name=>{
   const row=el('label','np-dialog-field'),text=el('span',null,name+':'),i=el('input','np-dialog-input');i.type='text';i.inputMode='none';i.autocomplete='off';i.maxLength=40;
   i.setAttribute('aria-label',name);i.addEventListener('focus',()=>{last=i;});row.append(text,i);fields.append(row);return i;
 });
 const ok=el('button',null,'OK'), cancel=el('button',null,'Cancel');
 ok.type='submit';cancel.type='button';buttons.append(ok,cancel);dialog.append(title,fields,buttons,warn);glass.append(dialog);
 let start=0,step=1,first=0,rowIndex=0,col=0,last=controls[0],active=false;
 const value=i=>Number((start+i*step).toPrecision(13));
 const present=()=>models().map((f,i)=>({f,i})).filter(o=>o.f);
 const shown=()=>!panel.hidden;
 const focused=()=>shown()&&active;
 const cell=()=>body.rows[rowIndex-first]?.cells[col]?.firstElementChild;
 function focus(){
   if(!shown())return;
   active=true;panel.dataset.active='true';
   const target=cell();
   if(!target)return;
   target.focus({preventScroll:true});
   const a=target.getBoundingClientRect(),r=panel.getBoundingClientRect(),h=thead.getBoundingClientRect().height;
   if(a.top<r.top+h)panel.scrollTop-=r.top+h-a.top;
   if(a.bottom>r.bottom)panel.scrollTop+=a.bottom-r.bottom;
   notify(target.scrollWidth>target.clientWidth+1?target.getAttribute('aria-label'):'');
 }
 function blur(){active=false;delete panel.dataset.active;}
 function render(refocus=false){
   if(!shown())return;
   const fs=present();col=Math.min(col,fs.length);
   const columns=['x',...fs.map(({i})=>'f'+(i+1)+'(x)')];
   const headers=el('tr');for(const name of columns){const h=el('th',null,name);h.scope='col';headers.append(h);}thead.replaceChildren(headers);
   const chunk=document.createDocumentFragment();
   for(let r=first;r<first+ROWS&&Math.abs(value(r))<=LIMIT;r++){
     const x=value(r), row=el('tr'), results=[x,...fs.map(({f})=>f.evaluate(x))];
     results.forEach((v,c)=>{
       const td=el('td'),text=fmt(v),b=el('button','np-table-cell',text);b.type='button';
       b.tabIndex=r===rowIndex&&c===col?0:-1;
       b.dataset.selected=String(r===rowIndex&&c===col);b.title=text;
       b.setAttribute('aria-label',columns[c]+': '+text+(c?' at x = '+fmt(x):''));
       b.addEventListener('click',()=>choose(r,c));td.append(b);row.append(td);
     });
     chunk.append(row);
   }
   body.replaceChildren(chunk);
   if(refocus)focus();
 }
 function choose(r,c){
   if(Math.abs(r)>1e9||Math.abs(value(r))>LIMIT)return;
   rowIndex=r;col=Math.max(0,Math.min(c,present().length));
   if(r<first)first=r;if(r>=first+ROWS)first=r-ROWS+1;
   render(true);
 }
 function show(){
   if(!present().length){notify('Plot a function first.');return false;}
   panel.hidden=false;plane.dataset.split='true';render(true);return true;
 }
 function hide(){
   panel.hidden=true;delete plane.dataset.split;blur();onGraph();notify('');
 }
 function toggle(){return shown()?hide():show();}
 function settings(){
   if(!shown()||!dialog.hidden)return;
   controls[0].value=fmt(start);controls[1].value=fmt(step);warn.textContent='';
   graph.inert=true;head.inert=true;dialog.hidden=false;last=controls[0];last.focus({preventScroll:true});last.select();
 }
 function close(save){
   if(save){
     try{
       const [a,b]=controls.map(x=>evaluate(x.value));
       if(!(Number.isFinite(a)&&Math.abs(a)<=LIMIT&&b>=.0001&&b<=LIMIT))throw Error('Start: ±100,000. Step: 0.0001 to 100,000.');
       start=a;step=b;first=rowIndex=0;col=0;
     }catch(e){warn.textContent=e.message;return;}
   }
   dialog.hidden=true;graph.inert=false;head.inert=false;
   render(true);
 }
 dialog.addEventListener('submit',e=>{e.preventDefault();close(true);});
 cancel.addEventListener('click',()=>close(false));
 const tokens={dot:'.',minus:'-',neg:'-',plus:'+',mul:'*',div:'/',lparen:'(',rparen:')',power:'^',pi:'π',ee:'E'};
 function dialogKey(k,event){
   const curr=document.activeElement,order=[...controls,ok,cancel];
   if(k==='esc'||k==='menu'){close(false);return true;}
   if(k==='enter'||k==='select'||k==='return'){close(curr!==cancel);return true;}
   if(['tab','backtab','up','down'].includes(k)){
     const j=order.indexOf(curr),move=k==='up'||k==='backtab'||event?.shiftKey?-1:1,n=order[(Math.max(0,j)+move+order.length)%order.length];n.focus({preventScroll:true});if(n.matches('input'))n.select();return true;
   }
   if(event)return false;
   const a=last.selectionStart,b=last.selectionEnd;
   if(k==='del'){last.setRangeText('',a===b?Math.max(0,a-1):a,b,'end');last.focus();return true;}
   if(k==='left'||k==='right'){const n=Math.min(last.value.length,Math.max(0,k==='left'?(a!==b?a:a-1):(a!==b?b:b+1)));last.focus();last.setSelectionRange(n,n);return true;}
   const token=tokens[k]??(/^[0-9e]$/.test(k)?k:null);
   if(token===null)return false;
   last.setRangeText(token,a,b,'end');last.focus();return true;
 }
 function key(k){
   if(!focused())return false;
   if(k==='up'||k==='down'){choose(rowIndex+(k==='up'?-1:1),col);return true;}
   if(k==='left'||k==='right'){choose(rowIndex,col+(k==='left'?-1:1));return true;}
   if(k==='esc'||k==='tab'||k==='switch-pane'){blur();onGraph();notify('');return true;}
   return ['select','enter','return'].includes(k);
 }
 panel.addEventListener('focusin',()=>{active=true;panel.dataset.active='true';});
 return {shown,focused,show,hide,toggle,settings,key,dialogKey,isDialog:()=>!dialog.hidden,render,focus,blur,owns:t=>panel.contains(t)};
}
root.NspireFunctionTable=Object.freeze({mount,parseRelation});
})(globalThis);
