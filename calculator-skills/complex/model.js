(function(root){
'use strict';
const worked=Object.freeze({re:-8,im:15,unit:'deg'}),assigned=Object.freeze({re:5,im:-12,unit:'deg'});
const fields=['Display Digits','Angle','Exponential Format','Real or Complex','Calculation Mode','Exact Arithmetic','OK','Cancel'];
const units=['rad','deg','grad'],formats=['real','rect','polar'];
const unitText=['Radian','Degree','Gradian'], formatText=['Real','Rectangular','Polar'];
const symbol=['π','e','𝑖','E','∞','θ','∠'];
const N='(?:\\d{1,3}(?:\\.\\d{0,6})?|\\.\\d{1,6})', signed='[+-]?'+N;
const exact=new RegExp('^'+signed+'$');
function bounded(x){
 if(typeof x!=='number'&&typeof x!=='string')throw new Error('Enter a signed decimal.');
 const s=String(x).trim().replaceAll('−','-');
 if(!exact.test(s))throw new Error('Use up to 3 digits before and 6 after the decimal point.');
 return Number(s)||0;
}
function principal(a,b,unit='rad'){
 const re=bounded(a),im=bounded(b);
 if(!units.includes(unit))throw new Error('Choose a supported angle unit.');
 const radius=Math.hypot(re,im);
 const rad=radius===0?null:Math.atan2(im,re);
 return {re,im,radius,rad,theta:rad===null?null:rad*(unit==='deg'?180/Math.PI:unit==='grad'?200/Math.PI:1),unit};
}
function parseRect(raw){
 const s=raw.replaceAll('−','-');
 if(!s.endsWith('𝑖'))return {re:bounded(s),im:0};
 const input=s.slice(0,-'𝑖'.length).replace(/\*$/,'');
 const mixed=input.match(new RegExp('^('+signed+')([+-])('+N+')?$'));
 if(mixed)return {re:bounded(mixed[1]),im:(mixed[2]==='-'?-1:1)*bounded(mixed[3]||1)};
 return {re:0,im:bounded(input===''||input==='+'?1:input==='-'?-1:input)};
}
function fromPolar(r,angle,unit='rad'){
 const text=String(r).trim().replaceAll('−','-');
 if(!new RegExp('^[+-]?'+N.replace('1,3','1,4')+'$').test(text)||Number(text)<0||Number(text)>1500)throw new Error('Use a polar radius from 0 to 1500.');
 r=Number(text)||0; angle=bounded(angle);
 if(!units.includes(unit))throw new Error('Choose a supported angle unit.');
 const factor=unit==='deg'?Math.PI/180:unit==='grad'?Math.PI/200:1, rad=angle*factor;
 // Do not erase genuine small components: special-case only exact cardinal degree/gradian inputs.
 const q=unit==='deg'?angle/90:unit==='grad'?angle/100:NaN;
 if(Number.isInteger(q))return [{re:r,im:0},{re:0,im:r},{re:-r,im:0},{re:0,im:-r}][(q%4+4)%4];
 return {re:r*Math.cos(rad),im:r*Math.sin(rad)};
}
function form(x){
 if(x===0)return '0';
 return String(Number(x.toPrecision(6))).replaceAll('-','−');
}
function cart(re,im){
 const magnitude=Math.abs(im),n=magnitude===1?'':form(magnitude),suffix=n+'𝑖';
 if(im===0)return form(re);
 if(re===0)return (im<0?'−':'')+suffix;
 return form(re)+(im<0?' − ':' + ')+suffix;
}
function request(p){
 const items=['re','im','unit'], any=items.some(k=>p.has(k)), names=['case','example'].filter(k=>p.has(k));
 if(!any&&!names.length)return {target:assigned,linked:false,error:''};
 if(!any&&names.length===1&&p.getAll(names[0]).length===1&&['demo','complex-demo'].includes(p.get(names[0])))return {target:assigned,linked:true,error:''};
 try{
  if(names.length||['re','im'].some(k=>p.getAll(k).length!==1)||p.getAll('unit').length>1)throw 0;
  const unit=p.has('unit')?p.get('unit'):'deg';if(!['deg','rad'].includes(unit))throw 0;
  const re=bounded(p.get('re')),im=bounded(p.get('im'));return {target:{re,im,unit},linked:true,error:''};
 }catch{return {target:assigned,linked:true,error:'The link is invalid. The original Try problem is ready.'};}
}
function start(unit='rad',format='real'){return {page:'calc',unit,format,input:'',answer:null,hist:[],proof:[],ctrl:false,field:0,select:null,error:'',zeroInput:null};}
const confirm=k=>k==='enter'||k==='select';
const buttons={plus:'+',neg:'-',minus:'-',dot:'.',mul:'*',lparen:'(',rparen:')'};
const set=(s,patch)=>({...s,...patch}), fail=(s,error)=>set(s,{error});
function lastEntry(s){
 if(!s.input)return s;
 try{
  const raw=s.input.trim(),suffix=raw.match(/►(Polar|Rect)$/),part=suffix?raw.slice(0,suffix.index):raw;
  const op=part.match(/^(abs|angle)\((.*)\)$/i), expr=op?op[2]:part;
  const polar=expr.match(new RegExp('^\\(('+N.replace('1,3','1,4')+')∠('+signed+')\\)$'));
  if(expr.includes('i'))throw new Error('The letter i is not the imaginary unit. Use the π palette.');
  const z=expr==='ans'?s.answer:polar?fromPolar(polar[1],polar[2],s.unit):parseRect(expr);
  if(!z)throw new Error('Calculate a value before using ans.');
  const r=Math.hypot(z.re,z.im),rad=r===0?null:Math.atan2(z.im||0,z.re),theta=rad===null?null:rad*(s.unit==='deg'?180/Math.PI:s.unit==='grad'?200/Math.PI:1);
  const kind=op?op[1].toLowerCase():suffix?suffix[1].toLowerCase():s.format==='polar'?'polar':'rect';
  if(kind==='angle'&&theta===null)return set(s,{error:'The argument of zero is undefined.',zeroInput:z});
  const result=kind==='abs'?r:kind==='angle'?theta:null;
  const output=kind==='abs'?form(r):kind==='angle'?form(theta)+(s.unit==='deg'?'°':''):kind==='rect'?cart(z.re,z.im):r===0?'0':null;
  const line={kind,input:raw,out:output,z,unit:s.unit,r,theta,result};
  const proof=s.proof.filter(e=>!(e.kind===kind&&e.z.re===z.re&&e.z.im===z.im&&e.unit===s.unit));
  return set(s,{input:'',hist:[...s.hist,line].slice(-3),proof:[...proof,line].slice(-24),answer:suffix?s.answer:result===null?z:{re:result,im:0},error:''});
 }catch(e){return fail(s,e.message||'Enter a complex number in this lesson’s format.');}
}
function enterPicker(s){
 const choices=s.select==='angle'?units:formats,name=choices[s.field];
 return set(s,{[s.select==='angle'?'unit':'format']:name,field:s.select==='angle'?1:3,select:null});
}
function pickSymbol(s,at=s.field){
 const token=symbol[at];if(token!=='𝑖'&&token!=='∠')return fail(s,'Choose the imaginary unit or the polar angle symbol for this rehearsal.');
 return set(s,{page:'calc',input:(s.input+token).slice(0,52),error:''});
}
function press(s,key){
 if(key==='ctrl')return set(s,{ctrl:!s.ctrl});
 let modified=s.ctrl;s=set(s,{ctrl:false,error:''});
 if(key==='esc'){
  if(s.page==='settings'&&s.select)return set(s,{field:s.select==='angle'?1:3,select:null});
  if(s.page==='settings')return set(s,{...s.defaults,page:'home',defaults:null});
  if(s.page!=='calc')return set(s,{page:'calc'});
  return set(s,{input:''});
 }
 if(key==='home')return set(s,{page:'home'});
 if(s.page==='home'){
  if(key==='5')return set(s,{page:'home-settings'});
  if(key==='4'||confirm(key))return set(s,{page:'calc'});
  return s;
 }
 if(s.page==='home-settings')return key==='2'||confirm(key)?set(s,{page:'settings',field:0,select:null,defaults:{unit:s.unit,format:s.format}}):s;
 if(s.page==='settings'){
  if(s.select){
   if(confirm(key))return enterPicker(s);
   if(key==='up'||key==='down')return set(s,{field:Math.max(0,Math.min(2,s.field+(key==='up'?-1:1)))});
   return s;
  }
  if(['tab','down','up','backtab'].includes(key))return set(s,{field:(s.field+(['up','backtab'].includes(key)?fields.length-1:1))%fields.length});
  if((key==='right'||confirm(key))&&s.field===1)return set(s,{select:'angle',field:units.indexOf(s.unit)});
  if((key==='right'||confirm(key))&&s.field===3)return set(s,{select:'format',field:formats.indexOf(s.format)});
  if(confirm(key)&&s.field===6)return set(s,{page:'home',defaults:null});
  if(confirm(key)&&s.field===7)return set(s,{...s.defaults,page:'home',defaults:null});
  return s;
 }
 if(s.page==='symbols'){
  if(confirm(key))return pickSymbol(s);
  if(key==='right'||key==='left')return set(s,{field:Math.max(0,Math.min(symbol.length-1,s.field+(key==='right'?1:-1)))});
  if(key==='down')return set(s,{field:symbol.length-1});
  if(key==='up')return set(s,{field:0});
  return s;
 }
 if(s.page==='commands'){
  if(['p','r','a'].includes(key))return set(s,{filter:key,field:0});
  const choices=catalogue(s);
  if(key==='up'||key==='down')return set(s,{field:Math.max(0,Math.min(choices.length-1,s.field+(key==='up'?-1:1)))});
  if(confirm(key))return set(s,{page:'calc',input:(s.input+(choices[s.field]||'')).slice(0,52)});
  return s;
 }
 if(key==='pi'||(modified&&key==='catalog'))return set(s,{page:'symbols',field:0});
 if(key==='catalog')return set(s,{page:'commands',filter:'a',field:0});
 if(modified&&key==='neg')return set(s,{input:(s.input+'ans').slice(0,52)});
 if(key==='imunit'||key==='anglemark')return set(s,{input:(s.input+(key==='imunit'?'𝑖':'∠')).slice(0,52)});
 if(key==='del')return set(s,{input:Array.from(s.input).slice(0,-1).join('')});
 if(confirm(key))return lastEntry(s);
 if(buttons[key]||/^[a-z0-9]$/.test(key))return set(s,{input:(s.input+(buttons[key]||key)).slice(0,52)});
 return s;
}
function catalogue(s){return s.filter==='p'?['►Polar']:s.filter==='r'?['►Rect']:['abs(','angle('];}
function match(s,d){
 const m=e=>e.z.re===d.re&&e.z.im===d.im&&e.unit===d.unit, kinds=new Set(s.proof.filter(m).map(e=>e.kind));
 if(kinds.has('abs')&&d.re===0&&d.im===0&&s.zeroInput)return 'Complete. The modulus is zero; the argument is undefined.';
 if(kinds.has('abs')&&kinds.has('angle')&&kinds.has('polar'))return 'Complete. The modulus and principal argument describe the same number in polar form.';
 if(!kinds.size)return '';
 return 'Check the modulus, the principal argument, and the polar display for this same input.';
}
root.CT20=Object.freeze({worked,assigned,start,press,fields,units,formats,unitText,formatText,symbol,pickSymbol,catalogue,principal,parseRect,fromPolar,form,cart,request,match});
})(typeof window==='undefined'?globalThis:window);
