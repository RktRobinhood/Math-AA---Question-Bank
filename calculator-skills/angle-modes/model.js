/* Focused TI-Nspire CX II-T angle settings and trig-practice state, not firmware. */
(function(host){
 'use strict';
 const units=Object.freeze({rad:'Radian',deg:'Degree',grad:'Gradian'});
 const unitLabels=Object.freeze({rad:'radians',deg:'degrees',grad:'gradians'});
 const cols=['sin','cos','tan','csc','sec','cot'];
 const palette=Object.freeze([...cols.map(fn=>({fn,inv:false,name:fn})),...cols.map(fn=>({fn,inv:true,name:fn+'⁻¹'}))]);
 const fields=Object.freeze(['Display Digits','Angle','Exponential Format','Real or Complex','Calculation Mode','Exact Arithmetic','OK','Cancel']);
 const AUTO=Object.freeze({fn:'cos',ratio:'0.4',unit:'deg'});
 const WORKED=Object.freeze({fn:'sin',ratio:'0.6',unit:'deg'});
 function parseRatio(text){
  if(typeof text!=='string'||text.length>32)throw new TypeError('Enter a short number or fraction.');
  const src=text.trim().replaceAll('−','-').replaceAll('÷','/').replace(/\s*\/\s*/,'/').replace(',','.');
  const bits=src.split('/');
  if(bits.length>2||!bits.every(x=>/^[+-]?(?:\d{1,8}(?:\.\d{0,12})?|\.\d{1,12})$/.test(x)))throw new RangeError('Use a signed decimal or fraction, such as 0.4 or 3/5.');
  const x=Number(bits[0])/(bits.length===2?Number(bits[1]):1);
  if(!Number.isFinite(x)||Math.abs(x)>1e6)throw new RangeError('Use a finite ratio between −1,000,000 and 1,000,000.');
  return {raw:src,value:Object.is(x,-0)?0:x};
 }
 function inverse(fn,value,unit){
  if(!['sin','cos','tan'].includes(fn)||!Object.hasOwn(units,unit)||!Number.isFinite(value))throw new TypeError('Choose an inverse trigonometric function and a finite ratio.');
  if(Math.abs(value)>1&&fn!=='tan')throw new RangeError('For inverse sine or cosine, the ratio must be between −1 and 1.');
  const y=(fn==='sin'?Math.asin:fn==='cos'?Math.acos:Math.atan)(value)*(unit==='deg'?180/Math.PI:unit==='grad'?200/Math.PI:1);
  return Math.abs(y)<1e-14?0:y;
 }
 function calc(sel,value,unit){
  if(!sel||!['sin','cos','tan'].includes(sel.fn))throw new TypeError('Select sine, cosine, tangent or one of their inverses.');
  if(sel.inv)return inverse(sel.fn,value,unit);
  const a=value*(unit==='deg'?Math.PI/180:unit==='grad'?Math.PI/200:1);
  if(sel.fn==='tan'&&Math.abs(Math.cos(a))<1e-13)throw new RangeError('Tangent is undefined at this angle.');
  const y=Math[sel.fn](a);return Math.abs(y)<1e-14?0:y;
 }
 const form=v=>v===0?'0':String(Number(v.toPrecision(6))).replaceAll('-','−');
 const displayResult=(result,mode,inv)=>form(result)+(inv&&mode==='deg'?'°':'');
 function request(params){
  const any=['fn','ratio','unit'].some(k=>params.has(k));
  const named=params.has('case')||params.has('example');
  const names=['case','example'].filter(k=>params.has(k));
  if(named&&!any&&(names.length!==1||params.getAll(names[0]).length!==1||!['angle-demo','demo'].includes(params.get(names[0]))))
   return {task:AUTO,linked:false,error:'The linked example was not recognised. The original Try task is ready.'};
  if(!any)return {task:AUTO,linked:named,error:''};
  try{
   if(named||['fn','ratio','unit'].some(k=>params.getAll(k).length!==1))throw Error();
   const fn=params.get('fn'),unit=params.get('unit'),{raw:ratio,value}=parseRatio(params.get('ratio'));
   if(!['deg','rad'].includes(unit))throw Error();
   inverse(fn,value,unit);
   return {task:{fn,ratio,unit},linked:true,error:''};
  }catch{return {task:AUTO,linked:false,error:'The linked inputs are invalid. The original Try task is ready.'};}
 }
 const create=(prefill='')=>({view:'calc',mode:'rad',draft:'rad',field:0,dropdown:false,choice:0,choiceTrig:0,sel:null,raw:'',prefill,result:null,error:''});
 function toggleAngle(s){
  if((s.view!=='calc'&&s.view!=='palette')||s.mode==='grad')return s;
  const unit=s.mode==='rad'?'deg':'rad';
  return {...s,mode:unit,draft:unit,result:null,error:''};
 }
 const modeOrder=['rad','deg','grad'];
 function begin(s,choice){
  const sel=palette[choice];
  if(!['sin','cos','tan'].includes(sel.fn))return {...s,error:'This rehearsal supports sine, cosine, tangent and their inverses.'};
  return {...s,view:'calc',sel,raw:s.raw||s.prefill||'',result:null,error:''};
 }
 function settings(s){return {...s,view:'settings',draft:s.mode,field:0,dropdown:false,choice:modeOrder.indexOf(s.mode),error:''};}
 function save(s){return {...s,view:'home',mode:s.draft,dropdown:false,result:null,error:''};}
 function enter(s){
  if(!s.sel)return {...s,error:'Press trig and select an inverse function first.'};
  try{
   const {value}=parseRatio(s.raw),result=calc(s.sel,value,s.mode);
   return {...s,result:{value:result,fn:s.sel.fn,input:value,raw:s.raw,mode:s.mode,inverse:s.sel.inv},error:''};
  }catch(e){return {...s,result:null,error:e.message};}
 }
 function press(s,key){
  const b={...s,error:''}, confirm=key==='enter'||key==='select';
  if(key==='home')return {...b,view:'home',dropdown:false};
  if(key==='esc'){
   if(s.view==='settings'&&s.dropdown)return {...b,dropdown:false};
   if(s.view==='settings'||s.view==='settings-menu')return {...b,view:'home',dropdown:false};
   return {...b,view:'calc'};
  }
  if(s.view==='home'){
   if(key==='5')return {...b,view:'settings-menu'};
   if(key==='4'||key==='a'||key==='scratchpad')return {...b,view:'calc'};
   return b;
  }
  if(s.view==='settings-menu')return key==='2'||confirm?settings(b):b;
  if(s.view==='settings'){
   if(s.dropdown){
    if(key==='up'||key==='down')return {...b,choice:Math.max(0,Math.min(2,s.choice+(key==='down'?1:-1)))};
    if(confirm)return {...b,dropdown:false,draft:modeOrder[s.choice]};
    return b;
   }
   if(key==='tab'||key==='down'||key==='up')return {...b,field:(s.field+(key==='up'?fields.length-1:1))%fields.length};
   if((key==='right'||confirm)&&s.field===1)return {...b,dropdown:true,choice:modeOrder.indexOf(s.draft)};
   if(confirm&&s.field===6)return save(b);
   if(confirm&&s.field===7)return {...b,view:'home'};
   return b;
  }
  if(s.view==='palette'){
   if(confirm)return begin(b,s.choiceTrig);
   if(key==='trig')return {...b,choiceTrig:(s.choiceTrig+1)%palette.length};
   let k=s.choiceTrig;
   if(key==='down'&&k<6)k+=6;
   if(key==='up'&&k>=6)k-=6;
   if(key==='left'&&k%6>0)k--;
   if(key==='right'&&k%6<5)k++;
   return {...b,choiceTrig:k};
  }
  if(key==='trig')return {...b,view:'palette',choiceTrig:0};
  if(confirm)return enter(b);
  const char={dot:'.',neg:'-',minus:'-',div:'/',plus:'+'}[key]||(typeof key==='string'&&/^\d$/.test(key)?key:'');
  if(char||key==='del'){
   const raw=s.result?'':s.raw;
   return {...b,prefill:'',raw:key==='del'?raw.slice(0,-1):(raw+char).slice(0,32),result:null};
  }
  return b;
 }
 const selectField=(s,i)=>s.view==='settings'?{...s,field:i}:s;
 const match=(seen,task)=>{
  if(!seen)return 'Calculate an angle first.';
  if(seen.mode!==task.unit)return 'Check RAD or DEG at the top of the screen.';
  if(!seen.inverse||seen.fn!==task.fn)return 'Choose the matching inverse function from the trig palette.';
  if(Math.abs(seen.input-parseRatio(task.ratio).value)>1e-10*Math.max(1,Math.abs(seen.input)))return 'Use the ratio in the task.';
  return '';
 };
 host.CT02Model=Object.freeze({units,unitLabels,palette,fields,AUTO,WORKED,parseRatio,inverse,calc,form,displayResult,request,create,press,selectField,begin,save,toggleAngle,match});
})(typeof window==='undefined'?globalThis:window);
