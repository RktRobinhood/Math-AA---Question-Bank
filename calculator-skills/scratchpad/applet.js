/* Screen-only Scratchpad applications. All state is private to this handheld. */
(function(root){
'use strict';
const SVG='http://www.w3.org/2000/svg';
const texts={
 nSolve:['Numerical Solve','nSolve(equation,x,lower,upper); x=guess is optional. One approximate root per run.'],
 nCr:['Combinations','nCr(n,r)'],nPr:['Permutations','nPr(n,r)'],
 normCdf:['Normal Cdf','normCdf(lower,upper,mean,σ)'],
 invNorm:['Inverse Normal','invNorm(leftArea,mean,σ)'],
 binomPdf:['Binomial Pdf','binomPdf(n,p,x)'],
 binomCdf:['Binomial Cdf','binomCdf(n,p,lower,upper)'],
 poissPdf:['Poisson Pdf','poissPdf(λ,x)'],
 poissCdf:['Poisson Cdf','poissCdf(λ,lower,upper)'],
 nDerivative:['Numerical Derivative at a Point','nDerivative(expression,x=value[,order])'],
 nInt:['Numerical Integral','nInt(expression,x,lower,upper)']
};
const html=(tag,c,t)=>{const e=document.createElement(tag);if(c)e.className=c;if(t)e.textContent=t;return e;};
const leaf=(k,t,run)=>({k:String(k),t,run}), branch=(k,t,items)=>({k:String(k),t,items});
function mount({glass,widget,head,entry,history,error,calc,input,notify,focusCalc}){
 const G=root.TIGraphGeneral,F=root.TIFreeCalc;
 let current='calc', menus=[], menuFocus=0, editable=0, useField='function', bounds=null, trace=null, win=[-10,10,-10,10], mark=null,
     sources=['',''], models=[null,null], mode='DEG', scale=[null,null], dialogOpen=false, remembered=null, pan=null, suppressGraphClick=false;
 glass.style.position='relative';
 const graph=html('section','np-graphs');graph.hidden=true;graph.setAttribute('aria-label','Graphs workspace');
 const svg=document.createElementNS(SVG,'svg');svg.setAttribute('viewBox','0 0 240 115');svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('role','img');svg.setAttribute('aria-label','Graph display');
 const label=html('label','np-entry-label'), caption=html('span',null,'f1(x)='), ginput=html('input','np-input'), status=html('div','np-readout');
 ginput.type='text';ginput.inputMode='none';ginput.spellcheck=false;ginput.autocomplete='off';ginput.maxLength=128;
 status.setAttribute('role','status');label.append(caption,ginput);graph.append(svg,label,status);glass.append(graph);
 const menu=html('div','np-menu');menu.hidden=true;menu.setAttribute('role','group');glass.append(menu);
 const dialog=html('form','np-dialog');dialog.hidden=true;dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label','Window Settings');
 const dialogTitle=html('div','np-dialog-title','Window Settings'),fields=html('div','np-dialog-fields'),buttons=html('div','np-dialog-actions'),warn=html('div','np-dialog-warning');
 warn.setAttribute('role','status');
 const windowLabels=['XMin','XMax','XScale','YMin','YMax','YScale'];
 const winInputs=windowLabels.map(name=>{
   const label=html('label','np-dialog-field'),title=html('span',null,name+':'), control=html('input','np-dialog-input');
   control.type='text';control.autocomplete='off';control.inputMode='none';control.spellcheck=false;control.maxLength=40;control.setAttribute('aria-label',name);
   label.append(title,control);fields.append(label);
   control.addEventListener('focus',()=>{remembered=control;});return control;
 });
 const ok=html('button',null,'OK'),cancel=html('button',null,'Cancel');
 ok.type='submit';cancel.type='button';buttons.append(ok,cancel);
 dialog.append(dialogTitle,fields,buttons,warn);glass.append(dialog);
 dialog.addEventListener('submit',e=>{e.preventDefault();commitWindow();});
 cancel.addEventListener('click',()=>closeDialog(false));
 const fmt=x=>Math.abs(x)<1e-8?'0':String(Number(x.toPrecision(8)));
 const focusGraph=()=>ginput.focus({preventScroll:true});
 const focusPage=()=>current==='calc'?focusCalc():focusGraph();
 const numeric=(s)=>F.evaluate(s,{mode,ans:calc.getState().ans});
 const menuStatus=(message)=>notify(message||'');
 function labelMenu(title,items){return {title,items};}
 function path(node, title){
  menus.push(labelMenu(title,node));paintMenu();
 }
 function closeMenu(){menus=[];menu.hidden=true;focusPage();}
 function popup(title,items){menus=[];path(items,title);}
 function paintMenu(preserve=false){
  menu.hidden=false;
  const m=menus.at(-1);
  menu.setAttribute('aria-label',m.title);
  if(!preserve)menuFocus=0;
  menu.dataset.cascade=String(menus.length>1);
  menu.replaceChildren();
  if(menus.length>1){
   const parent=menus.at(-2),ancestor=html('div','np-menu-ancestor');
   ancestor.setAttribute('aria-hidden','true');ancestor.append(html('div','np-menu-title',parent.title));
   for(const row of parent.items){const item=html('div','np-menu-preview',row.k+': '+row.t);if(row.t===m.title)item.dataset.active='true';ancestor.append(item);}
   menu.append(ancestor);
  }
  const pane=html('div','np-menu-pane');pane.append(html('div','np-menu-title',m.title));menu.append(pane);
  m.items.forEach((x,i)=>{
   const b=html('button','np-menu-item',x.k+': '+x.t+(x.items?' ›':''));
   b.type='button';b.dataset.index=i;b.addEventListener('click',()=>pick(x));pane.append(b);
  });
  selected();
 }
 function selected(){
  const bs=[...menu.querySelectorAll('button')];bs.forEach((b,i)=>{b.dataset.current=String(i===menuFocus);b.tabIndex=i===menuFocus?0:-1;});
  bs[menuFocus]?.focus({preventScroll:true});
  if(bs[menuFocus]){
   const el=bs[menuFocus],pane=el.parentElement,r=el.getBoundingClientRect(),m=pane.getBoundingClientRect();
   if(r.top<m.top)pane.scrollTop-=m.top-r.top;
   if(r.bottom>m.bottom)pane.scrollTop+=r.bottom-m.bottom;
  }
 }
 function pick(x){
  if(x.items){path(x.items,x.t);return;}
  closeMenu();x.run();
 }
 function insertTemplate(tag,tail=')',hint=''){
  const state=calc.getState();
  const a=input.selectionStart,b=input.selectionEnd;
  const prefix=state.justEvaluated?'':state.expression.slice(0,a);
  const suffix=state.justEvaluated?'':state.expression.slice(b);
  calc.setText(prefix+tag+tail+suffix,prefix.length+tag.length);
  menuStatus(hint);focusCalc();
 }
 const command=(k,name)=>leaf(k,texts[name][0],()=>insertTemplate(name+'(',')',texts[name][1]));
 const go=(k,title,to)=>leaf(k,title,()=>switchApp(to));
 const distributions=[command(2,'normCdf'),command(3,'invNorm'),command('a','binomPdf'),command('b','binomCdf'),command('d','poissPdf'),command('e','poissCdf')];
 const calcMenu=[
  branch(1,'Actions',[leaf(5,'Clear History',()=>{calc.clearHistory();menuStatus('History cleared.');})]),
  branch(2,'Number',[leaf(1,'Convert to Decimal',()=>{if(calc.getState().expression)calc.press('enter');else {calc.setText('Ans');calc.press('enter');}})]),
  branch(3,'Algebra',[command(1,'nSolve')]),
  branch(4,'Calculus',[command(2,'nDerivative'),command(3,'nInt')]),
  branch(5,'Probability',[command(2,'nPr'),command(3,'nCr'),branch(5,'Distributions',distributions)]),
  branch(6,'Statistics',[branch(2,'Distributions',distributions)])
 ];
 const analyze=[leaf(1,'Zero',()=>start('Zero')),leaf(2,'Minimum',()=>start('Minimum')),leaf(3,'Maximum',()=>start('Maximum')),leaf(4,'Intersection',()=>start('Intersection'))];
 const graphMenu=[
  branch(1,'Actions',[leaf(1,'Edit f1(x)',()=>edit(0)),leaf(2,'Edit f2(x)',()=>edit(1))]),
  branch(4,'Window / Zoom',[leaf(1,'Window Settings',setWindow),leaf(5,'Zoom Standard',()=>{win=[-10,10,-10,10];scale=[null,null];mark=null;draw();})]),
  branch(5,'Trace',[leaf(1,'Graph Trace',()=>start('Trace'))]),
  branch(6,'Analyze Graph',analyze)
 ];
 function plot(){
  try{
   const raw=ginput.value.trim();
   models[editable]=raw?G.parse(raw,{angle:mode}):null;sources[editable]=raw;
   mark=null;trace=null;bounds=null;draw();
   status.textContent=raw?'':'Function cleared';
  }catch(e){status.textContent=e.message;}
 }
 function edit(n){
  editable=n;useField='function';bounds=null;trace=null;
  caption.textContent='f'+(n+1)+'(x)=';
  ginput.setAttribute('aria-label','Function f'+(n+1));ginput.value=sources[n];
  status.textContent='';focusGraph();
 }
 function switchApp(next){
  current=next;graph.hidden=next==='calc';
  for(const n of [history,entry,error])n.hidden=next==='graph';
  head.firstChild.nodeValue=next==='calc'?'Calculator':'Graphs';
  menuStatus('');
  if(next==='graph'){edit(editable);draw();} else focusCalc();
 }
 function setMode(m){
  if(m===mode)return;
  mode=m;
  models=sources.map(s=>s?G.parse(s,{angle:mode}):null);mark=null;
  if(current==='graph')draw();
 }
 function shape(name,attrs){
  const el=document.createElementNS(SVG,name);
  for(const [n,v]of Object.entries(attrs))el.setAttribute(n,v);
  return el;
 }
 function draw(){
  svg.replaceChildren();
  svg.dataset.window=win.join(',');svg.dataset.scale=scale.map(x=>x??'Auto').join(',');
  const [xl,xr,yb,yt]=win, X=x=>240*(x-xl)/(xr-xl),Y=y=>115*(yt-y)/(yt-yb);
  if(xl<=0&&xr>=0)svg.append(shape('line',{x1:X(0),y1:0,x2:X(0),y2:115,class:'np-axis'}));
  if(yb<=0&&yt>=0)svg.append(shape('line',{x1:0,y1:Y(0),x2:240,y2:Y(0),class:'np-axis'}));
  const ticks=(lo,hi)=>{const raw=(hi-lo)/9,k=10**Math.floor(Math.log10(raw)),q=raw/k;return (q<=1?1:q<=2?2:q<=5?5:10)*k;};
  const xt=scale[0]??ticks(xl,xr),ytick=scale[1]??ticks(yb,yt);
  for(let i=Math.ceil(xl/xt);i*xt<=xr&&i<Math.ceil(xl/xt)+28;i++)
   if(yb<=0&&yt>=0)svg.append(shape('line',{x1:X(i*xt),y1:Y(0)-2,x2:X(i*xt),y2:Y(0)+2,class:'np-axis'}));
  for(let i=Math.ceil(yb/ytick);i*ytick<=yt&&i<Math.ceil(yb/ytick)+28;i++)
   if(xl<=0&&xr>=0)svg.append(shape('line',{x1:X(0)-2,y1:Y(i*ytick),x2:X(0)+2,y2:Y(i*ytick),class:'np-axis'}));
  models.forEach((f,i)=>{
   if(!f)return;
   const segments=G.sampleCurve(f,{x0:xl,x1:xr},300);
   for(const seg of segments){
    const path=seg.map((p,n)=>(n?'L':'M')+X(p.x).toFixed(2)+','+Math.max(-1000,Math.min(1000,Y(p.y))).toFixed(2)).join(' ');
    svg.append(shape('path',{d:path,class:'np-curve np-curve-'+i}));
   }
  });
  if(bounds&&bounds.low!==null)svg.append(shape('line',{x1:X(bounds.low),x2:X(bounds.low),y1:0,y2:115,class:'np-bound'}));
  if(mark)svg.append(shape('circle',{cx:X(mark.x),cy:Y(mark.y),r:3.5,class:'np-mark'}));
 }
 function setWindow(){
   if(dialogOpen)return;
   const vals=[win[0],win[1],scale[0]??'Auto',win[2],win[3],scale[1]??'Auto'];
   winInputs.forEach((e,i)=>{e.value=typeof vals[i]==='number'?F.format(vals[i]):String(vals[i]);});
   dialogOpen=true;dialog.hidden=false;warn.textContent='';
   graph.inert=true;head.inert=true;remembered=winInputs[0];remembered.focus({preventScroll:true});remembered.select();
 }
 function closeDialog(saved){
   dialogOpen=false;dialog.hidden=true;graph.inert=false;head.inert=false;
   if(saved){mark=null;bounds=null;trace=null;draw();}
   focusGraph();
 }
 function commitWindow(){
  try{
   const vals=winInputs.map((field,i)=>{
    const v=field.value.trim();
    if((i===2||i===5)&&/^auto$/i.test(v))return null;
    return numeric(v);
   });
   const [x0,x1,xs,y0,y1,ys]=vals;
   if(x0>=x1||y0>=y1||Math.max(...[x0,x1,y0,y1].map(Math.abs))>99999||x1-x0<1e-5||y1-y0<1e-5)throw Error('Minimum must be below maximum.');
   if([xs,ys].some(x=>x!==null&&(!(x>0)||x>1e6)))throw Error('Set a positive scale or Auto.');
   win=[x0,x1,y0,y1];scale=[xs,ys];closeDialog(true);
  }catch(e){warn.textContent=e.message;}
 }
 function dialogKey(k,event){
  if(!dialogOpen)return false;
  const order=[...winInputs,ok,cancel],current=document.activeElement,active=winInputs.includes(current)?current:remembered;
  if(k==='esc'||k==='menu'){closeDialog(false);return true;}
  if(k==='enter'||k==='return'||k==='select'){if(current===cancel)closeDialog(false);else commitWindow();return true;}
  if(['tab','up','down'].includes(k)){
    const prev=k==='up'||(k==='tab'&&event?.shiftKey),i=order.indexOf(dialog.contains(current)?current:active);
    const control=order[(Math.max(0,i)+(prev?-1:1)+order.length)%order.length];
    control.focus({preventScroll:true});if(control.matches('input'))control.select();return true;
  }
  if(event||!active)return false;
  const p=active.selectionStart,e=active.selectionEnd;
  if(k==='left'||k==='right'){
   const i=Math.max(0,Math.min(active.value.length,k==='left'?(p!==e?p:p-1):(p!==e?e:e+1)));
   active.focus();active.setSelectionRange(i,i);return true;
  }
  if(k==='del'){active.setRangeText('',p===e?Math.max(0,p-1):p,e,'end');active.focus();return true;}
  const token=keyTokens[k]??(/^[a-z0-9]$/.test(k)?k:null);
  if(token!==null){active.setRangeText(token,p,e,'end');active.focus();return true;}
  return false;
 }
 function start(name){
  if(name==='Intersection'&&(!models[0]||!models[1])){status.textContent='Plot two functions first. Tab switches f1 and f2.';return;}
  if(!models[editable]&&!models[0]&&!models[1]){status.textContent='Plot a function first.';return;}
  if(!models[editable])editable=models[0]?0:1;
  useField=name==='Trace'?'trace':'bound';mark=null;trace=name==='Trace'?0:null;
  if(useField==='trace'){caption.textContent='x=';ginput.setAttribute('aria-label','Trace x');ginput.value='0';status.textContent='Graph Trace';}
  else{
   bounds={name,low:null};caption.textContent='Lower x=';
   ginput.setAttribute('aria-label','Lower bound');ginput.value='';status.textContent=name+': choose a lower bound.';
  }
  draw();focusGraph();
 }
 function commitBound(){
   try{
    const v=numeric(ginput.value);
    if(v<win[0]||v>win[1])throw Error('Place the bound inside the graph window.');
    if(bounds.low===null){
     bounds.low=v;caption.textContent='Upper x=';ginput.setAttribute('aria-label','Upper bound');ginput.value='';
     status.textContent=bounds.name+': choose an upper bound.';draw();return;
    }
    if(v<=bounds.low)throw Error('Upper bound must exceed the lower bound.');
    const n=bounds.name,f=models[editable];
    let res,coords;
    if(n==='Minimum'||n==='Maximum'){
     const model=n==='Minimum'?f:G.parse('-('+f.expression+')',{angle:mode});
     const out=G.findBoundedMinimum(model,bounds.low,v);
     if(!out.ok)throw Error(out.message.replaceAll('minimum',n.toLowerCase()).replaceAll('valley',n==='Maximum'?'peak':'valley'));
     coords={x:out.minimum.x,y:f.evaluate(out.minimum.x)};
    }else{
     const a=n==='Intersection'?models[0]:f,b=n==='Intersection'?models[1]:G.parse('0',{angle:mode});
     res=G.roots(a,b,bounds.low,v);
     if(res.length!==1)throw Error(res.length?'Several crossings found. Tighten the bounds around one.':'No crossing detected in these bounds.');
     coords=res[0];
    }
    edit(editable);mark=coords;status.textContent=n+' ('+fmt(mark.x)+', '+fmt(mark.y)+')';draw();
   }catch(e){status.textContent=e.message;}
 }
 function tracePoint(v){
  const f=models[editable],y=f.evaluate(v);
  if(!Number.isFinite(y)){status.textContent='Undefined at this x.';return;}
  trace=v;mark={x:v,y};status.textContent='Trace ('+fmt(v)+', '+fmt(y)+')';draw();
 }
 const keyTokens={sqrt:'√(',ln:'ln(',log:'log(',plus:'+',minus:'-',neg:'-',mul:'*',div:'/',dot:'.',power:'^',square:'^2',lparen:'(',rparen:')',comma:',',eq:'=',pi:'π',exp:'e^(',tenpow:'10^(',ee:'e',space:' '};
 function editKey(k){
  const p=ginput.selectionStart,e=ginput.selectionEnd,z=ginput.value;
  if(k==='del'){ginput.setRangeText('',p===e?Math.max(0,p-1):p,e,'end');return true;}
  const s=keyTokens[k]??(/^[a-z0-9]$/.test(k)?k:null);
  if(s!==null){ginput.setRangeText(s,p,e,'end');return true;}
  return false;
 }
 function key(k){
  if(dialogOpen)return dialogKey(k);
  if(k==='menu'){if(menus.length)closeMenu();else popup(current==='calc'?'Calculator menu':'Graphs menu',current==='calc'?calcMenu:graphMenu);return true;}
  if(k==='scratchpad'){closeMenu();switchApp(current==='calc'?'graph':'calc');return true;}
  if(k==='home'||k==='doc'){popup(k==='home'?'Home · Scratchpad':'Document · pages',[go(1,'Calculator','calc'),go(2,'Graphs','graph')]);return true;}
  if(menus.length){
    const m=menus.at(-1);
    if(k==='esc'||k==='left'){menus.pop();if(!menus.length)closeMenu();else paintMenu();return true;}
    if(k==='up'||k==='down'||k==='tab'){
     menuFocus=(menuFocus+(k==='up'?-1:1)+m.items.length)%m.items.length;selected();return true;
    }
    if(['enter','select','right','return','space'].includes(k)){pick(m.items[menuFocus]);return true;}
    const matched=m.items.find(x=>x.k===k);if(matched){pick(matched);return true;}
    return true;
  }
  const graphInsert=(lead,tail='')=>{
    const at=ginput.selectionStart,end=ginput.selectionEnd;
    ginput.setRangeText(lead+tail,at,end,'end');ginput.setSelectionRange(at+lead.length,at+lead.length);focusGraph();
  };
  const append=(lead,tail='')=>current==='calc'?insertTemplate(lead,tail):graphInsert(lead,tail);
  if(k==='catalog'){
   if(current==='calc')popup('Catalog',Object.keys(texts).map((t,i)=>command(i+1,t)));
   else popup('Catalog',[leaf(1,'abs(',()=>append('abs(',')')),leaf(2,'ln(',()=>append('ln(',')')),leaf(3,'log(',()=>append('log(',')')),leaf(4,'sqrt(',()=>append('sqrt(',')'))]);
   return true;
  }
  if(k==='templates'){popup('Templates',[leaf(1,'Fraction',()=>{append('(',')/()');menuStatus('Type the numerator, then move right into the denominator.');}),leaf(2,'Square root',()=>append('√(',')')),leaf(3,'Power',()=>append('^(',')'))]);return true;}
  if(k==='symbols'){popup('Symbols',[leaf(1,'π',()=>append('π')),leaf(2,'√',()=>append('√(',')')),...(current==='calc'?[leaf(3,'Percent',()=>append('%')),leaf(4,'Factorial',()=>append('!'))]:[])]);return true;}
  if(k==='var'){popup('Values',[...(current==='calc'?[leaf(1,'Ans',()=>append('Ans'))]:[]),leaf(2,'x',()=>append('x'))]);return true;}
  if(current==='calc'&&k==='tab'){
   const p=input.selectionEnd, forward=input.value.slice(p).search(/[),]/);
   const to=forward<0?input.value.length:p+forward+1;
   calc.setSelection(to);input.setSelectionRange(to,to);focusCalc();return true;
  }
  if(current==='calc')return false;
  if(k==='esc'){edit(editable);mark=null;draw();return true;}
  if(k==='clear'){ginput.value='';return true;}
  if(k==='tab'||k==='up'||k==='down'){edit(1-editable);return true;}
  if(k==='enter'||k==='select'||k==='return'){
   if(useField==='function')plot();else if(useField==='bound')commitBound();
   else try{tracePoint(numeric(ginput.value));}catch(e){status.textContent=e.message;}
   return true;
  }
  if(k==='left'||k==='right'){
   if(useField==='trace'){
    let v=(trace??0)+(k==='left'?-1:1)*(win[1]-win[0])/40;v=Math.max(win[0],Math.min(win[1],v));ginput.value=Number(v.toPrecision(9));tracePoint(v);
   }else{
    const p=k==='left'?ginput.selectionStart-1:ginput.selectionEnd+1;
    const c=Math.max(0,Math.min(ginput.value.length,p));ginput.setSelectionRange(c,c);
   }
   return true;
  }
  if(k==='trig'){popup('Trigonometry',[leaf(1,'sin(',()=>ginput.setRangeText('sin(',ginput.selectionStart,ginput.selectionEnd,'end')),leaf(2,'cos(',()=>ginput.setRangeText('cos(',ginput.selectionStart,ginput.selectionEnd,'end')),leaf(3,'tan(',()=>ginput.setRangeText('tan(',ginput.selectionStart,ginput.selectionEnd,'end'))]);return true;}
  return editKey(k);
 }
 svg.addEventListener('pointerdown',e=>{
  if(e.button!==0||dialogOpen||menus.length||useField!=='function'||!models.some(Boolean))return;
  pan={id:e.pointerId,x:e.clientX,y:e.clientY,start:win.slice(),rect:svg.getBoundingClientRect(),moved:false};
 });
 svg.addEventListener('pointermove',e=>{
  if(!pan||pan.id!==e.pointerId)return;
  const dx=e.clientX-pan.x,dy=e.clientY-pan.y;
  if(!pan.moved&&Math.hypot(dx,dy)<3)return;
  if(!pan.moved){pan.moved=true;svg.setPointerCapture(e.pointerId);svg.classList.add('np-grabbed');}
  const [xl,xr,yb,yt]=pan.start;
  const sx=-dx/pan.rect.width*(xr-xl),sy=dy/pan.rect.height*(yt-yb);
  const next=[xl+sx,xr+sx,yb+sy,yt+sy];if(Math.max(...next.map(Math.abs))<=99999){win=next;draw();}
  e.preventDefault();
 });
 const stopPan=e=>{
   if(pan?.id!==e.pointerId)return;
   suppressGraphClick=pan.moved;pan=null;svg.classList.remove('np-grabbed');
   if(suppressGraphClick)setTimeout(()=>{suppressGraphClick=false;},100);
 };
 svg.addEventListener('pointerup',stopPan);svg.addEventListener('pointercancel',stopPan);svg.addEventListener('pointerleave',e=>{if(pan&&!pan.moved)stopPan(e);});
 svg.addEventListener('click',e=>{
  if(suppressGraphClick||!['bound','trace'].includes(useField))return;
  const b=svg.getBoundingClientRect(),v=win[0]+(win[1]-win[0])*(e.clientX-b.left)/b.width;
  ginput.value=Number(v.toPrecision(8));
  if(useField==='trace')tracePoint(v);
  focusGraph();
 });
 return Object.freeze({key,setMode,focusPage,isGraph:()=>current==='graph',contains:t=>menu.contains(t)||graph.contains(t),isMenu:()=>menus.length>0,isDialog:()=>dialogOpen,dialogKey,wantsArrows:()=>useField==='trace',graphInput:ginput});
}
root.NspireApplet=Object.freeze({mount});
})(window);
