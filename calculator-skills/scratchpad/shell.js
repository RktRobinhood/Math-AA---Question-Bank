/* Original CSS/HTML reconstruction of the TI-Nspire CX II-T face.
 * This is a display/key surface, not calculator firmware.
 */
(function(){
 'use strict';
 const nav=[
  ['esc','esc','',16.5,39.3],['home','⌂ on','off',83.3,39.3],
  ['scratchpad','▣','swap',16.5,44.85],['doc','doc ▾','+ page',83.3,44.85],
  ['tab','tab','',16.5,50.35],['menu','menu','',83.3,50.35]
 ];
 const utility=[
  ['ctrl','ctrl','',16.5,'ctrl'],['shift','⇧ shift','CAPS',35.55,''],['var','var','sto→',64.25,''],['del','del','clear',83.3,'']
 ];
 const rows=[
  [['eq','=','≠'],['trig','trig',''],['7','7'],['8','8'],['9','9'],['templates','▤',':='],['catalog','▣','']],
  [['power','^',''],['square','x²','√'],['4','4'],['5','5'],['6','6'],['mul','×',''],['div','÷','fraction']],
  [['exp','eˣ','ln'],['tenpow','10ˣ','log'],['1','1'],['2','2'],['3','3'],['plus','+',''],['minus','−','']],
  [['lparen','(','['],['rparen',')',']'],['0','0',''],['dot','.','capture'],['neg','(−)','ans'],['enter','enter','≈']]
 ];
 const letters=[
  ['ee','a','b','c','d','e','f','g','symbols'],
  ['pi','h','i','j','k','l','m','n','flag'],
  ['comma','o','p','q','r','s','t','u','return']
 ];
 const bottom=[['v',24.2],['w',32.8],['x',41.4],['y',50],['z',58.65],['space',71.35]];
 const display={ee:'EE',pi:'π ▾',comma:',',symbols:'?! ▾',flag:'□ ▾',return:'↵',space:'⎵'};
 const names={
   esc:'Escape',home:'Home and on',scratchpad:'Scratchpad',doc:'Document',tab:'Tab',menu:'Menu',
   up:'Up',right:'Right',down:'Down',left:'Left',select:'Centre click',
   ctrl:'Control',shift:'Shift',var:'Variable',del:'Delete',eq:'Equals',trig:'Trigonometry',
   power:'Power',square:'Square',exp:'e to a power',tenpow:'Ten to a power',lparen:'Left parenthesis',
   rparen:'Right parenthesis',templates:'Math templates',catalog:'Catalog',mul:'Multiply',div:'Divide · Control: fraction template',
   plus:'Plus',minus:'Subtract',enter:'Enter',neg:'Negative sign',dot:'Decimal point',ee:'Scientific notation',
   pi:'Pi',comma:'Comma',symbols:'Symbols',flag:'Flag',return:'Return',space:'Space'
 };
 const aliases={
  'escape':'esc','on':'home','⌂':'home','home/on':'home','document':'doc','documents':'doc','scratch pad':'scratchpad',
  'arrowup':'up','↑':'up','arrowright':'right','→':'right','arrowdown':'down','↓':'down','arrowleft':'left','←':'left',
  'right arrow':'right','left arrow':'left','up arrow':'up','down arrow':'down',
  'touchpad':'select','click':'select','center':'select','centre':'select','ok':'enter','⏎':'enter',
  'backspace':'del','delete':'del','clear':'del','control':'ctrl','⇧':'shift',
  '=':'eq','equals':'eq','+':'plus','−':'minus','-':'minus','subtract':'minus',
  'negative':'neg','(-)':'neg','(−)':'neg','*':'mul','×':'mul','times':'mul','multiply':'mul',
  '/':'div','÷':'div','divide':'div','.':'dot','decimal':'dot',',':'comma',
  '(':'lparen',')':'rparen','left parenthesis':'lparen','right parenthesis':'rparen',
  '^':'power','x²':'square','²':'square','x^2':'square',
  'rightparen':'rparen','leftparen':'lparen','eˣ':'exp','e^x':'exp','10ˣ':'tenpow','10^x':'tenpow','π':'pi','sqrt':'square','spacebar':'space',' ':'space'
 };
 const cssVar=(el,k,v)=>el.style.setProperty('--hh-'+k,v);
 const create=(name,cls)=>{const el=document.createElement(name);if(cls)el.className=cls;return el};
 function normal(k){
   const raw=String(k??'').toLowerCase();return aliases[raw]||aliases[raw.trim()]||raw.trim();
 }
 function mount(options={}){
   let {screen,host,onKey,label='TI-Nspire CX II-T handheld'}=options;
   if(typeof screen==='string')screen=document.querySelector(screen);
   if(typeof host==='string')host=document.querySelector(host);
   if(!screen||!host)throw new Error('HandheldShell.mount requires existing screen and host elements.');
   if(screen.closest('.hh-body'))throw new Error('This LCD is already mounted in a handheld.');
   const home=screen.parentNode,marker=document.createComment('handheld LCD original position');
   if(home)home.insertBefore(marker,screen);
   const body=create('section','hh-body');body.setAttribute('aria-label',label);
   const face=create('div','hh-face');face.setAttribute('aria-hidden','true');body.append(face);
   const rail1=create('div','hh-rail hh-rail-left'),rail2=create('div','hh-rail hh-rail-right');body.append(rail1,rail2);
   const rule=create('div','hh-face-rule');rule.setAttribute('aria-hidden','true');body.append(rule);
   const logo=create('div','hh-logo');logo.setAttribute('aria-hidden','true');
   const model=create('div','hh-model');model.append('TI-');const ital=create('b');ital.textContent='nspire';model.append(ital,' CX II-T');
   const maker=create('div','hh-maker');maker.innerHTML='<svg viewBox="0 0 22 20" width="14" height="14" focusable="false" aria-hidden="true"><path fill="currentColor" d="M1 5h6V2h7v3h3l2 2v4l2 1-3 3h-4l-2 4-3-1-2-6H3L1 9z"/><path d="M8 8h7m-4 0v6" stroke="#fff" stroke-width="1.1"/></svg><span>Texas Instruments</span>';
   logo.append(model,maker);body.append(logo);
   const bezel=create('div','hh-lcd');bezel.append(screen);screen.classList.add('hh-screen-content');body.append(bezel);
   const pad=create('div','hh-pad');pad.setAttribute('aria-hidden','true');body.append(pad);
   for(const [c,t,x,y] of [['top','⌁',50,36.5],['left','▣',28,44.7],['right','▣',72,44.7],['bottom','◷',50,53.15]]){
     const d=create('i','hh-pad-legend hh-pad-legend-'+c);d.textContent=t;cssVar(d,'x',x+'%');cssVar(d,'y',y+'%');d.setAttribute('aria-hidden','true');body.append(d);
   }
   const panel=create('div','hh-key-layer');panel.setAttribute('role','group');panel.setAttribute('aria-label','Handheld keypad');body.append(panel);
   const keyMap=new Map();let interactive=options.interactive!==false,auto=null,pointerKey='',timer=0,caption=null;
   function light(id){
     if(!keyMap.has(id))return;
     if(pointerKey&&keyMap.has(pointerKey))keyMap.get(pointerKey).classList.remove('hh-tap');
     pointerKey=id;keyMap.get(id).classList.add('hh-tap');clearTimeout(timer);
     timer=setTimeout(()=>{keyMap.get(id)?.classList.remove('hh-tap');pointerKey='';},220);
   }
   function key(id,text,secondary,x,y,w,h,type=''){
      const holder=create('div','hh-key-wrap');
      for(const [n,v] of Object.entries({x,y,w,h}))cssVar(holder,n,v+'%');
      const b=create('button','hh-key'+(type?' '+type.split(' ').map(c=>'hh-'+c).join(' '):''));
      b.type='button';b.dataset.hhKey=id;b.setAttribute('aria-label',names[id]||id.toUpperCase());
      if(type.split(' ').includes('direction'))b.title=names[id];
      b.textContent=text;
      b.addEventListener('click',e=>{
         e.preventDefault();
         if(!interactive)return;
         light(id);
         if(typeof onKey==='function')onKey(id,e);
      });
      holder.append(b);keyMap.set(id,b);
      if(secondary){const el=create('span','hh-secondary');if(secondary==='fraction'){el.classList.add('hh-fraction-mark');el.append(create('i'),create('i'));}else el.textContent=secondary;el.setAttribute('aria-hidden','true');holder.append(el);}
      panel.append(holder);
   }
   nav.forEach(([id,t,s,x,y])=>key(id,t,s,x,y,11.7,3.28,'nav'));
   key('up','▴','',50,39.55,11,2.52,'direction up');
   key('left','◂','',35.65,44.56,8.5,4.10,'direction left');
   key('select','⌁','',50,44.55,11.65,5.6,'select');
   key('right','▸','',64.4,44.56,8.5,4.10,'direction right');
   key('down','▾','',50,49.55,11,2.52,'direction down');
   utility.forEach(([id,t,s,x,type])=>key(id,t,s,x,57.65,11.55,3.3,'utility '+type));
   const cols=[14.75,22.75,35.55,49.95,64.25,76.8,85.1];
   rows.forEach((row,r)=>{
     const yy=[62.35,67.35,72.35,77.33][r];
     for(const [a,b] of [[0,1],[5,6]])if(row[b]){
       const carrier=create('div','hh-rocker');cssVar(carrier,'x',(cols[a]+cols[b])/2+'%');cssVar(carrier,'y',yy+'%');panel.append(carrier);
     }
     row.forEach(([id,t,s],i)=>{
       if(id==='enter'){key(id,t,s,80.95,yy,15.7,3.32,'enter');return;}
       const number=i>=2&&i<=4;
       key(id,t,s,cols[i],yy,number?11.5:7.85,3.28,number?'number':'segment '+(i===0||i===5?'segment-left':'segment-right'));
     });
   });
   const alphaX=[14.4,24.25,32.85,41.45,50,58.6,67.25,75.85,85.6];
   letters.forEach((row,r)=>row.forEach((id,i)=>key(id,display[id]||id.toUpperCase(),'',alphaX[i],[83.0,86.7,90.35][r],i===0||i===8?7.25:5.4,2.75,'letter'+(id.length>1?' special':''))));
   bottom.forEach(([id,x])=>key(id,display[id]||id.toUpperCase(),'',x,94.0,id==='space'?14:5.4,2.75,'letter'+('xyz'.includes(id)?' xyz':id==='space'?' space':'')));
   host.classList.add('hh-host');host.append(body);
   function setInteractive(v){
     interactive=Boolean(v);body.dataset.interactive=String(interactive);
     for(const b of keyMap.values()){
       b.tabIndex=interactive?0:-1;
       b.setAttribute('aria-disabled',String(!interactive));
     }
   }
   function setKeys(input){
     const arr=(Array.isArray(input)?input:input==null?[]:[input]).map(normal).filter(k=>keyMap.has(k));
     const target=arr.join(',');
     if(target===auto)return;
     auto=target;
     const active=arr.at(-1), trail=new Set(arr.slice(0,-1));
     for(const [id,b] of keyMap){
       b.classList.toggle('hh-lit',id===active);
       b.classList.toggle('hh-trail',id!==active&&trail.has(id));
     }
     body.dataset.activeKey=active||'';
   }
   function setCaption(t){
     if(!caption){caption=create('p','hh-announce');caption.setAttribute('role','status');body.append(caption)}
     caption.textContent=t??'';
   }
   function keyId(k){const id=normal(k);return keyMap.has(id)?id:null}
   function destroy(){
     clearTimeout(timer);
     screen.classList.remove('hh-screen-content');
     if(marker.parentNode)marker.replaceWith(screen);
     else screen.remove();
     body.remove();if(!host.querySelector('.hh-body'))host.classList.remove('hh-host');
   }
   setInteractive(interactive);setKeys(options.keys||[]);
   return {body,bezel,setKeys,setCaption,setInteractive,destroy,keyId,getKey:k=>keyMap.get(normal(k))||null};
 }
 window.HandheldShell=Object.freeze({mount,normalizeKey:normal});
})();
