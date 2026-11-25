/* CT19: deliberately scoped TI-Nspire CX II-T Calculator model. */
(function(root){
'use strict';
const worked=Object.freeze({a:Object.freeze(['2','-1','2']),b:Object.freeze(['1','2','-2']),unit:'deg'});
const practice=Object.freeze({a:Object.freeze(['1','2','2']),b:Object.freeze(['3','0','4']),unit:'deg'});
const menu=[
 [['1','Actions'],['2','Number'],['3','Algebra'],['4','Calculus'],['5','Probability'],['6','Statistics'],['7','Matrix & Vector',1],['8','Finance']],
 [['1','Create',2],['2','Transpose'],['3','Determinant'],['4','Row-Echelon Form'],['5','Reduced Row-Echelon Form'],['6','Simultaneous'],['7','Norms',4],['8','Dimensions'],['9','Row Operations'],['a','Element Operations'],['b','Advanced'],['c','Vector',3]],
 [['1','Matrix'],['2','Identity'],['3','Diagonal']],
 [['1','Unit Vector'],['2','Cross Product'],['3','Dot Product'],['4','Convert to Polar'],['5','Convert to Rectangular']],
 [['1','Norm'],['2','Row'],['3','Column']]
];
const palette=['sin','cos','tan','csc','sec','cot','sin⁻¹','cos⁻¹','tan⁻¹','csc⁻¹','sec⁻¹','cot⁻¹'];
const NUM=/^[+-]?(?:\d{1,3}(?:\.\d{1,5})?|\.\d{1,5})$/;
function scaled(raw){
 if(!['string','number'].includes(typeof raw))throw new TypeError('Use a signed number.');
 const src=String(raw).trim().replaceAll('−','-');
 if(!NUM.test(src))throw new Error('Use signed decimals with up to 3 digits before and 5 after the point.');
 const [whole,part='']=src.replace(/^[+-]/,'').split('.');
 return (src[0]==='-'?-1n:1n)*(BigInt(whole||0)*100000n+BigInt(part.padEnd(5,'0')));
}
function normalize(raw){ const n=scaled(raw);return String(Number(n)/1e5); }
function vector(v){
 if(!Array.isArray(v)||![2,3].includes(v.length))throw new Error('Use a row of two or three components.');
 return v.map(normalize);
}
function pair(x,y){
 const a=vector(x).map(scaled),b=vector(y).map(scaled);
 if(a.length!==b.length)throw new Error('Dimension mismatch. Both vectors need the same number of components.');
 return {a,b};
}
function exactDot(a,b){return a.reduce((s,x,i)=>s+x*b[i],0n);}
function measure(x,y){
 const {a,b}=pair(x,y),dp=exactDot(a,b),a2=exactDot(a,a),b2=exactDot(b,b);
 const dot=Number(dp)/1e10,normA=Math.sqrt(Number(a2))/1e5,normB=Math.sqrt(Number(b2))/1e5;
 if(a2===0n||b2===0n)return {dot,normA,normB,cos:null,rad:null,deg:null};
 // Exact integer Gram determinant before converting. atan2 is equivalent to acos for
 // this ratio and stays stable when a very small angle rounds cos(theta) to 1.
 const g=a2*b2-dp*dp,rad=Math.atan2(Math.sqrt(Number(g)),Number(dp));
 return {dot,normA,normB,cos:Math.max(-1,Math.min(1,Number(dp)/Math.sqrt(Number(a2*b2)))),rad,deg:rad*180/Math.PI};
}
function request(params){
 const fields=['a','b','unit'], any=fields.some(k=>params.has(k)), named=['case','example'].filter(k=>params.has(k));
 if(!any&&!named.length)return {target:practice,linked:false,error:''};
 if(!any&&named.length===1&&params.getAll(named[0]).length===1&&['demo','vectors-demo'].includes(params.get(named[0])))return {target:practice,linked:true,error:''};
 try{
  if(named.length||['a','b'].some(k=>params.getAll(k).length!==1)||params.getAll('unit').length>1)throw 0;
  const raw=['a','b'].map(k=>params.get(k));
  if(raw.some(x=>x.length>40))throw 0;
  const [a,b]=raw.map(s=>vector(s.split(',')));pair(a,b);
  const unit=params.get('unit')||'deg';if(!['rad','deg'].includes(unit))throw 0;
  return {target:{a,b,unit},linked:true,error:''};
 }catch{return {target:practice,linked:true,error:'The link is invalid. The original Try problem is ready.'};}
}
function start(unit='deg'){return {page:'calc',unit,input:'',frac:null,side:0,a:null,b:null,entries:[],milestones:{dot:false,angle:false,undefined:false},ctrl:false,menu:0,field:0,dim:null,cells:null,cell:0,error:''};}
const pathParent={1:[0,6],2:[1,0],3:[1,11],4:[1,6]};
const ok=k=>k==='enter'||k==='select',digit=k=>/^\d$/.test(k);
const reset=(s,more={})=>({...s,page:'calc',input:'',frac:null,side:0,dim:null,cells:null,ctrl:false,error:'',...more});
const fail=(s,error)=>({...s,error});
function append(s,token){
 if(s.frac&&s.side<2){const frac=s.frac.slice();if(frac[s.side].length+token.length<=40)frac[s.side]+=token;return {...s,frac};}
 if(s.frac&&s.side===2)return s;
 return {...s,input:(s.input+token).slice(0,70)};
}
function choice(s,id){
 const item=menu[s.menu].find(x=>x[0]===id);
 if(item?.[2])return {...s,menu:item[2],field:0};
 const b={...s,page:'calc'};
 if(s.menu===2&&id==='1')return {...s,page:'dims',dim:['2','2'],field:0};
 if(s.menu===3&&id==='3')return append(b,'dotP(');
 if(s.menu===4&&id==='1')return append(b,'norm(');
 return fail(s,'This rehearsal covers Matrix, Norm and Dot Product only.');
}
function dimensions(s){
 if(s.dim[0]!=='1'||!['2','3'].includes(s.dim[1]))return fail(s,'Use 1 row and 2 or 3 columns for this lesson.');
 if(!/^[ab]:=$/.test(s.input))return fail(s,'Start by typing a or b, then Ctrl + templates. Then create a row.');
 return {...s,page:'cells',cells:Array(Number(s.dim[1])).fill(''),cell:0};
}
function log(s,entry){
 const ok=entry.a!==entry.b&&entry.a&&entry.b&&['dot','angle'].includes(entry.kind);
 return reset(s,{entries:[...s.entries,entry].slice(-4),milestones:ok?{...s.milestones,[entry.kind]:true}:s.milestones});
}
function store(s){
 try{
  const key=s.input[0],row=vector(s.cells);
  // Replacing either row invalidates all recorded results for that pair.
  return log({...s,[key]:row,milestones:{dot:false,angle:false,undefined:false},entries:s.entries.filter(e=>e.kind==='store'&&e.key!==key)},{kind:'store',key,values:row});
 }catch(e){return fail(s,e.message);}
}
function groupedParts(src){
 const x=src.match(/^acos\(\(?dotP\(([ab]),([ab])\)\)?\/\(norm\(([ab])\)\*norm\(([ab])\)\)\)$/i);
 return x&&[x[1].toLowerCase(),x[2].toLowerCase(),x[3].toLowerCase(),x[4].toLowerCase()];
}
function command(s){
 const raw=s.input.trim();
 if(!raw)return s;
 const get=name=>{if(!s[name])throw new Error('Store row '+name+' first.');return s[name];};
 try{
  if(s.frac){
   const [a,b]=s.frac,p=a.match(/^dotP\(([ab]),([ab])\)$/i),n=b.match(/^norm\(([ab])\)\*norm\(([ab])\)$/i);
   if(!p||!n||s.input!=='acos(')throw new Error('Use dotP(a,b) above and norm(a)×norm(b) below.');
   return angle(s,p[1].toLowerCase(),p[2].toLowerCase(),n[1].toLowerCase(),n[2].toLowerCase(),get);
  }
  const dot=raw.match(/^dotP\(([ab]),([ab])\)$/i), norm=raw.match(/^norm\(([ab])\)$/i), expr=groupedParts(raw);
  if(dot){const a=dot[1].toLowerCase(),b=dot[2].toLowerCase();return log(s,{kind:'dot',label:'dotP('+a+','+b+')',value:measure(get(a),get(b)).dot,a,b});}
  if(norm){const a=norm[1].toLowerCase(),v=get(a);return log(s,{kind:'norm',label:'norm('+a+')',value:measure(v,v).normA,a});}
  if(expr)return angle(s,...expr,get);
  throw new Error('Use dotP(a,b), norm(a), or the full inverse cosine fraction.');
 }catch(e){return fail(s,e.message);}
}
function angle(s,a,b,c,d,get){
 // Only matched magnitudes in denominator and inter-vector numerator are supported.
 if(a===b||!((a===c&&b===d)||(a===d&&b===c)))throw new Error('Use the same two different row names in the numerator and the two norms.');
 const data=measure(get(a),get(b));
 if(data.rad===null)return fail({...s,milestones:{...s.milestones,undefined:true}},'The angle is undefined because one vector has zero length.');
 return log(s,{kind:'angle',label:'cos⁻¹',value:data[s.unit],unit:s.unit,a,b,num:'dotP('+a+','+b+')',den:'norm('+c+')×norm('+d+')'});
}
function press(s,key){
 if(key==='ctrl')return {...s,ctrl:!s.ctrl};
 if(s.ctrl){
  s={...s,ctrl:false};
  if(key==='templates'&&s.page==='calc'&&/^[ab]$/.test(s.input))return {...s,input:s.input+':=',error:''};
  if(key==='div'&&s.page==='calc'&&s.input==='acos('&&!s.frac)return {...s,frac:['',''],side:0,error:''};
  if(key==='del'&&s.page==='calc')return reset(s);
 }
 s={...s,error:''};
 if(key==='esc'){
  if(s.page==='menu'&&s.menu)return {...s,menu:pathParent[s.menu][0],field:pathParent[s.menu][1]};
  if(s.page==='menu'||s.page==='trig')return {...s,page:'calc'};
  if(s.page==='dims'||s.page==='cells')return {...s,page:'calc',dim:null,cells:null};
  return reset(s);
 }
 if(s.page==='menu'){
  const items=menu[s.menu];if(key==='up'||key==='down')return {...s,field:(s.field+(key==='up'?items.length-1:1))%items.length};
  if(key==='left'&&s.menu)return {...s,menu:pathParent[s.menu][0],field:pathParent[s.menu][1]};
  return ok(key)||key==='right'?choice(s,items[s.field][0]):/^[0-9abc]$/.test(key)?choice(s,key):s;
 }
 if(s.page==='trig'){
  if(ok(key))return s.field===7?append({...s,page:'calc'},'acos('):fail(s,'Choose inverse cosine, cos⁻¹.');
  const f=s.field,move=key==='right'&&f%6<5?1:key==='left'&&f%6>0?-1:key==='down'&&f<6?6:key==='up'&&f>=6?-6:0;
  return {...s,field:f+move};
 }
 if(s.page==='dims'){
  if(['tab','down','backtab','up'].includes(key))return {...s,field:(s.field+(['backtab','up'].includes(key)?3:1))%4};
  if(ok(key))return s.field===3?{...s,page:'calc',dim:null}:dimensions(s);
  if(s.field<2&&(digit(key)||key==='del')){const dim=s.dim.slice();dim[s.field]=key==='del'?'':key;return {...s,dim};}
  return s;
 }
 if(s.page==='cells'){
  if(['tab','right','left','backtab'].includes(key))return {...s,cell:Math.max(0,Math.min(s.cells.length,s.cell+(['left','backtab'].includes(key)?-1:1)))};
  if(ok(key))return store(s);
  if(s.cell>=s.cells.length)return s;
  const cells=s.cells.slice(),x=cells[s.cell];
  if(key==='del')cells[s.cell]=x.slice(0,-1);
  else if(key==='neg'||key==='minus')cells[s.cell]=x[0]==='-'?x.slice(1):'-'+x;
  else if(key==='dot'&&!x.includes('.'))cells[s.cell]=x+'.';
  else if(digit(key)&&(!x.includes('.')?x.replace('-','').length<3:x.split('.')[1].length<5))cells[s.cell]=x+key;
  return {...s,cells};
 }
 if(key==='menu')return {...s,page:'menu',menu:0,field:0};
 if(key==='trig')return {...s,page:'trig',field:0};
 if(key==='assign'&&/^[ab]$/.test(s.input))return {...s,input:s.input+':='};
 if(s.frac&&['right','down','up','left','tab','backtab'].includes(key)){
  if(['down','tab'].includes(key))return {...s,side:s.side===0?1:2};
  if(['up','backtab'].includes(key))return {...s,side:Math.max(0,s.side-1)};
  if(key==='right')return {...s,side:s.side===0?1:2};
  if(key==='left')return {...s,side:Math.max(0,s.side-1)};
 }
 if(key==='del'){
  if(s.frac&&s.side===2)return {...s,side:1};
  if(s.frac){const frac=s.frac.slice();frac[s.side]=frac[s.side].slice(0,-1);return {...s,frac};}
  return {...s,input:s.input.endsWith(':=')?s.input.slice(0,-2):s.input.slice(0,-1)};
 }
 if(ok(key))return command(s);
 if(key==='frac'&&s.input==='acos('&&!s.frac)return {...s,frac:['',''],side:0};
 const chars={dot:'.',neg:'-',minus:'-',mul:'*',div:'/',lparen:'(',rparen:')',comma:','};
 if(key==='rparen'&&s.frac&&s.side===2)return s;
 if(chars[key]||/^[a-z0-9]$/.test(key))return append(s,chars[key]||key);
 return s;
}
function form(x){
 if(x===0)return '0';
 const abs=Math.abs(x);
 if(abs<.0001)return x.toExponential(5).replace(/(\.\d*?[1-9])0+e/,'$1e').replace(/\.0+e/,'e').replace('e-','ᴇ−');
 return String(Number(x.toPrecision(6))).replaceAll('-','−');
}
function status(s,target){
 const rows=['a','b'].every(k=>s[k]?.length===target[k].length&&s[k].every((v,i)=>v===target[k][i]));
 if(!rows)return '';
 const {dot,angle,undefined:und}=s.milestones;
 if(dot&&und)return 'Complete: dot product zero, but the angle is undefined.';
 if(und)return 'Angle checked. Calculate the scalar dot product separately.';
 if(dot&&angle)return 'Complete: you found the scalar and the angle.';
 if(dot&&[s.a,s.b].some(row=>row.every(n=>Number(n)===0)))return 'Dot product complete. Try the angle command to check why there is no angle here.';
 if(dot)return 'Dot product complete. Now use both lengths to find the angle.';
 if(angle)return 'Angle complete. Calculate the dot product by itself to see its scalar value.';
 return 'Both rows match the assigned values.';
}
root.CT19=Object.freeze({worked,practice,menu,palette,scaled,vector,pair,measure,request,start,press,form,status});
})(typeof window==='undefined'?globalThis:window);
