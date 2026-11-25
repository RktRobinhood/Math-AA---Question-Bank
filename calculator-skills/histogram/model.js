/* Narrow mathematical model for raw-observation equal-width frequency bins. Units: thousandths internally. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FreqHistogram=api;})(globalThis,()=>{
'use strict';
const scale=1000, max=10000;
function integer(raw){
 const s=String(raw).trim().replaceAll('−','-');
 if(!/^[+-]?(?:\d+(?:\.\d{1,3})?|\.\d{1,3})$/.test(s)||Math.abs(Number(s))>max)throw Error('Use finite numbers from −10000 to 10000, at most three decimal places.');
 return Math.round(Number(s)*scale)||0;
}
const text=x=>String(x/scale).replace('-','−');
function list(raw){
 const t=String(raw).trim();
 if(!t||t.length>400||/^[,;]|[,;]$|[,;]\s*[,;]/.test(t))throw Error('Enter 6–28 observations without empty entries.');
 const a=t.split(/\s*[,;]\s*|\s+/).map(integer);
 if(a.length<6||a.length>28)throw Error('Enter 6–28 observations.');
 if(Math.max(...a)===Math.min(...a))throw Error('Use at least two distinct observations in this lesson.');
 return a;
}
function bins(data,width,anchor){
 if(!Number.isInteger(width)||width<=0)throw Error('Width must be greater than zero.');
 if(!Number.isInteger(anchor))throw Error('Enter a valid alignment.');
 const idx=x=>Math.floor((x-anchor)/width), lo=idx(Math.min(...data)), hi=idx(Math.max(...data));
 if(hi-lo+1>14)throw Error('Choose a larger width so there are at most 14 visible bins in this lesson.');
 const out=Array.from({length:hi-lo+1},(_,i)=>{
  const lower=anchor+(lo+i)*width;
  return {lower,upper:lower+width,count:0};
 });
 for(const x of data)out[idx(x)-lo].count++;
 return out;
}
const row=(lo,hi)=>'['+text(lo)+', '+text(hi)+')';
function setup(data,width,alignment,lower,cutoff){
 const z=bins(data,width,alignment), requested=z.find(b=>b.lower===lower);
 if(!requested)throw Error('The chosen class must start at a visible bin boundary.');
 if(!z.some(b=>b.upper===cutoff)||cutoff===z.at(-1).upper)throw Error('Choose an internal bin boundary as the cutoff.');
 return {data,width,alignment,lower,cutoff};
}
function auto(data){
 const lo=Math.min(...data),hi=Math.max(...data),delta=hi-lo;
	return {width:Math.max(1,Math.ceil(delta/4)),alignment:lo};
}
function result(c){
 const z=bins(c.data,c.width,c.alignment);
 return {frequency:z.find(b=>b.lower===c.lower).count,cumulative:z.filter(b=>b.upper<=c.cutoff).reduce((n,b)=>n+b.count,0)};
}
const readCase=o=>setup(list(o.data),integer(o.width),integer(o.alignment),integer(o.bin),integer(o.cutoff));
return {integer,text,list,bins,row,setup,auto,result,readCase};
});
