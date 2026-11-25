/* Spearman: manual tied ranks, then the existing TI Pearson r result. */
(function(root,factory){const x=factory();if(typeof module!=='undefined'&&module.exports)module.exports=x;else root.CT35=x;})(typeof window==='undefined'?globalThis:window,()=>{
'use strict';
const MAX=6;
const demo=Object.freeze({x:Object.freeze([21,7,15,11]),y:Object.freeze([7,12,5,7])});
const assigned=Object.freeze({x:Object.freeze([12,4,12,7,19]),y:Object.freeze([8,2,15,6,11])});
const fields=['X List','Y List','Save RegEqn to','Frequency List','Category List','Include Categories','1st Result Column'];
const menu=[
 ['1: Actions','2: Insert','3: Data','4: Statistics','5: Function Table'],
 ['1: Stat Calculations','2: Distributions','3: Confidence Intervals','4: Stat Tests'],
 ['1: One-Variable Statistics','2: Two-Variable Statistics','3: Linear Regression (mx+b)','4: Linear Regression (a+bx)','5: Median-Median Line','6: Quadratic Regression','7: Cubic Regression','8: Quartic Regression','9: Power Regression','A: Exponential Regression']
];
const names=['rx','ry'],options=['rx','ry','a[]','b[]'];
function number(raw){
 const s=String(raw??'').trim().replaceAll('−','-');if(!/^[+-]?(?:\d{1,4}(?:\.\d{0,5})?|\.\d{1,5})$/.test(s))return null;
 const v=Number(s);return Number.isFinite(v)?v||0:null;
}
function parseList(raw){const s=String(raw??'');if(s.length>110)return null;const a=s.split(',').map(number);return a.length<=MAX&&!a.includes(null)?a:null;}
function admit(x,y){
 if(!Array.isArray(x)||!Array.isArray(y)||x.length!==y.length||x.length<3||x.length>MAX||[...x,...y].some(x=>typeof x!=='number'||!Number.isFinite(x)||Math.abs(x)>10000))return 'Enter three to six complete numeric pairs.';
 return '';
}
function ranks(v){
 const sorted=v.map((value,i)=>[value,i]).sort((a,b)=>a[0]-b[0]), out=Array(v.length);
 for(let i=0;i<sorted.length;){let hi=i+1;while(hi<sorted.length&&sorted[i][0]===sorted[hi][0])hi++;
  const mean=(i+1+hi)/2;for(let j=i;j<hi;j++)out[sorted[j][1]]=mean;i=hi;}
 return out;
}
function fit(x,y){
 const error=admit(x,y);if(error)return {error};
 const n=x.length,avg=v=>v.reduce((s,t)=>s+t,0)/n,mX=avg(x),mY=avg(y);
 let xx=0,yy=0,xy=0;
 for(let i=0;i<n;i++){const dx=x[i]-mX,dy=y[i]-mY;xx+=dx*dx;yy+=dy*dy;xy+=dx*dy;}
 if(xx<=0||yy<=0)return {error:'Correlation is undefined because one list has no spread.'};
 const b=xy/xx,a=mY-b*mX,r=Math.max(-1,Math.min(1,xy/Math.sqrt(xx*yy)));
 return {a,b,r,r2:r*r,residuals:x.map((t,i)=>y[i]-(a+b*t))};
}
function spearman(x,y){const error=admit(x,y);return error?{error}:fit(ranks(x),ranks(y));}
function request(p){
 const tags=['x','y'],named=['case','example'].filter(k=>p.has(k)),any=tags.some(k=>p.has(k));
 if(!any&&!named.length)return {data:assigned,linked:false,error:''};
 if(!any&&named.length===1&&p.getAll(named[0]).length===1&&['demo','spearman-demo'].includes(p.get(named[0])))return {data:assigned,linked:true,error:''};
 const x=parseList(p.get('x')),y=parseList(p.get('y'));
 if(named.length||tags.some(k=>p.getAll(k).length!==1)||admit(x,y))return {data:assigned,linked:true,error:'The linked data could not load. The original paired table is ready.'};
 return {data:{x,y},linked:true,error:''};
}
const settings=()=>['','','f1','1','','','c[]'];
function init(data=assigned){return {page:'sheet',raw:data,x:Array(data.x.length).fill(null),y:Array(data.y.length).fill(null),row:0,col:0,edit:null,menu:0,choice:0,field:0,dropdown:null,settings:settings(),run:null,error:'',fromWatch:false};}
const readings=s=>({x:s.x.slice(),y:s.y.slice()});
function replace(s,x,y){
 const error=admit(x,y);if(error)return {...s,error};
 return {...init({x,y}),fromWatch:s.fromWatch};
}
function choices(s){return s.field===2?['f1','f2','f3']:options;}
const index=a=>a==='rx'||a==='a[]'?0:a==='ry'||a==='b[]'?1:-1;
const select=[3,0,3],keys=['4','1','4'];
function commit(s){
 if(s.edit===null)return s;
 const raw=s.edit.trim(),n=raw===''?null:number(raw);
 if(n===null&&raw!==''){s.error='Enter a numeric rank.';return s;}
 (s.col===0?s.x:s.y)[s.row]=n;s.edit=null;s.run=null;return s;
}
const same=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
function run(s){
 const provenance=s.settings.slice(0,2).map(index);
 if(provenance.some(k=>k<0)){s.error='Choose the two rank lists.';return s;}
 if(provenance[0]===provenance[1]){s.error='Use two different rank lists, not one list twice.';return s;}
 const d=readings(s),expected=[ranks(s.raw.x),ranks(s.raw.y)],matchX=same(d.x,expected[0]),matchY=same(d.y,expected[1]);
 const list=[d.x,d.y],ans=fit(list[provenance[0]],list[provenance[1]]);
 if(ans.error){s.error=ans.error;
  if(matchX&&matchY&&ans.error.includes('undefined'))s.undefinedConfirmed=true;
  return s;
 }
 s.page='result';s.dropdown=null;s.choice=0;s.run={...ans,provenance,store:s.settings[2],matchX,matchY};return s;
}
function press(base,key){
 const s={...base,settings:base.settings.slice(),x:base.x.slice(),y:base.y.slice(),error:''};
 if(key==='escape'){
  if(s.dropdown!==null)s.dropdown=null;
  else if(s.page==='menu'&&s.menu>0){s.menu--;s.choice=select[s.menu];}
  else if(s.page!=='sheet'){s.page='sheet';s.edit=null;}
  else s.edit=null;
  return s;
 }
 if(key==='menu'){
  if(s.page==='sheet'&&s.edit!==null){commit(s);if(s.error)return s;}
  s.page='menu';s.menu=0;s.choice=0;s.dropdown=null;return s;
 }
 if(s.page==='menu'){
  if(key==='up'||key==='down'){s.choice=(s.choice+(key==='up'?-1:1)+menu[s.menu].length)%menu[s.menu].length;return s;}
  if(key===keys[s.menu]||(['right','enter'].includes(key)&&s.choice===select[s.menu])){
   if(s.menu===2){s.page='wizard';s.field=0;s.dropdown=null;s.settings=settings();s.settings[0]=names[s.col];s.run=null;s.undefinedConfirmed=false;}
   else{s.menu++;s.choice=0;}return s;
  }
  return s;
 }
 if(s.page==='wizard'){
  if(s.dropdown!==null){
   const offered=choices(s);
   if(['right','down','left','up'].includes(key))s.dropdown=(s.dropdown+(['right','down'].includes(key)?1:offered.length-1))%offered.length;
   if(['tab','enter'].includes(key)){s.settings[s.field]=offered[s.dropdown];s.dropdown=null;if(key==='tab')s.field++;}
   return s;
  }
  if(key==='tab'||key==='backtab'){s.field=(s.field+(key==='tab'?1:8))%9;return s;}
  if((key==='right'||key==='down')&&s.field<3){s.dropdown=Math.max(0,choices(s).indexOf(s.settings[s.field]));return s;}
  if(key==='enter'&&s.field===8){s.page='sheet';return s;}
  if(key==='enter')return run(s);
  return s;
 }
 if(s.page==='result'){if(key==='down')s.choice=Math.min(2,s.choice+1);if(key==='up')s.choice=Math.max(0,s.choice-1);return s;}
 if(key==='backspace'){s.edit=(s.edit??String((s.col===0?s.x:s.y)[s.row]??'')).slice(0,-1);s.undefinedConfirmed=false;return s;}
 if(/^[0-9.]$/.test(key)||key==='negative'||key==='minus'){s.edit=((s.edit??'')+(['negative','minus'].includes(key)?'-':key)).slice(0,14);s.undefinedConfirmed=false;return s;}
 if(['enter','tab','up','down','left','right'].includes(key)){
  commit(s);if(s.error)return s;
  if(key==='enter'||key==='down')s.row=Math.min(s.x.length-1,s.row+1);
  if(key==='up')s.row=Math.max(0,s.row-1);
  if(key==='right'||key==='tab')s.col=key==='tab'?1-s.col:1;
  if(key==='left')s.col=0;
 }
 return s;
}
const display=v=>v===null?'undef':String(Number(v.toPrecision(6))).replace(/^-/,'−');
function grade(s,answer){
 if(s.fromWatch)return 'Open the assigned task for a separate exercise.';
 if(s.undefinedConfirmed)return /^(?:undefined|undef)$/i.test(answer.trim())?'':'Enter “undefined” if one rank list has no spread.';
 if(!s.run)return 'Run linear regression on the two rank lists first.';
 if(!s.run.matchX||!s.run.matchY)return 'Check the ranks on their original paired rows, and average every tied group.';
 const raw=String(answer??'').trim().replaceAll('−','-');
 if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(raw))return 'Enter a number, or “undefined” if correlation does not exist.';
 const value=Number(raw),r=s.run.r;
 return [3,4,5,6,7,8,9,10,11,12,13,14,15].some(n=>value===Number(r.toPrecision(n)))||Math.abs(value-r)<=Math.abs(r)*1e-11?'':'Read r, including its sign, not r², a or b.';
}
return Object.freeze({MAX,demo,assigned,fields,menu,names,choices,number,parseList,admit,ranks,fit,spearman,request,init,readings,replace,press,display,grade});
});
