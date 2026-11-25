/* Invert the directly integrated Gaussian lower tail. Symmetry avoids
   near-one CDF subtraction during bisection. Scope bounded for teaching. */
(function(root){
 'use strict';
 const standardMass=typeof module==='object'&&module.exports?require('../normal/math.js').standardMass:root.NspireNormal.standardMass;
 const MIN=1e-15,MAX=1-1e-15,LIMIT=1e9;
 const parse=val=>{
   const s=String(val??'').trim().replaceAll('−','-');
   if(s.length>28||!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(s))return NaN;
   const n=Number(s);return Number.isFinite(n)?n:NaN;
 };
 function checkArea(area){
   if(!(Number.isFinite(area)&&area>0&&area<1))throw Error('Area must be strictly between 0 and 1.');
   if(area<MIN||area>MAX)throw Error('This practice calculator supports areas from 10⁻¹⁵ to 1 − 10⁻¹⁵.');
   return area;
 }
 function validate({area,mean,sd}){
   checkArea(area);
   if(!Number.isFinite(mean)||Math.abs(mean)>LIMIT||!(sd>0&&sd<=LIMIT))throw Error('Use a mean between −1 billion and 1 billion and a positive standard deviation no greater than 1 billion.');
 }
 function quantile(area){
   checkArea(area);if(area===.5)return 0;
   const q=area<.5?area:decimalComplement(area),central=q>.25;
   const target=central?.5-q:q;let a=0,b=central?1:9;
   for(let i=0;i<60;i++){
     const m=(a+b)/2;
     if(central?standardMass(0,m)<target:standardMass(-Infinity,-m)>target)a=m;else b=m;
   }
   const z=(a+b)/2;return area<.5?-z:z;
 }
 function cutoff(model){
   validate(model);
   const {area,mean,sd}=model,z=quantile(area),x=mean+sd*z;
   if(z!==0&&x===mean)throw Error('This spread is too small to distinguish the cutoff from the mean at this scale.');
   return x;
 }
 function decimalComplement(p){
   // Complement the canonical decimal before converting back to binary,
   // avoiding gratuitous cancellation (for example 1 - 0.999999999).
   const [mantissa,exponent='0']=String(p).split('e'),[i,f='']=mantissa.split('.');
   const scale=f.length-Number(exponent),whole=10n**BigInt(scale),numerator=BigInt(i+f);
   return Number('0.'+(whole-numerator).toString().padStart(scale,'0'));
 }
 function leftFromGiven(p,side){
   checkArea(p);
   if(side==='left')return p;
   if(side!=='right')throw Error('Choose left or right.');
   return checkArea(decimalComplement(p));
 }
 const standard={mean:40,sd:5,p:.2,side:'right'};
 function exerciseFrom(params){
   if(params.get('mode')!=='try')return {data:standard,linked:false,error:''};
   const keys=['p','mean','sd','tail'],kinds=['example',...keys];
   if(!kinds.some(k=>params.has(k)))return {data:standard,linked:false,error:''};
   try{
     if(kinds.some(k=>params.getAll(k).length>1))throw Error('A linked field was repeated.');
     if(params.has('example')){
       if(params.get('example')!=='demo'||keys.some(k=>params.has(k)))throw Error('Use the named demo by itself, or provide all typed givens.');
       return {data:standard,linked:false,error:''};
     }
     if(keys.slice(0,3).some(k=>!params.has(k)))throw Error('Give p, mean and sd together. tail may be left or right.');
     const data={p:parse(params.get('p')),mean:parse(params.get('mean')),sd:parse(params.get('sd')),side:params.get('tail')??'left'};
     cutoff({...data,area:leftFromGiven(data.p,data.side)});
     return {data,linked:true,error:''};
   }catch(e){return {data:standard,linked:false,error:'Invalid practice link. '+e.message+' Showing the independent exercise.'};}
 }
 const api={cutoff,quantile,validate,checkArea,parse,leftFromGiven,exerciseFrom,standard};
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.NspireInverseNormal=Object.freeze(api);
})(globalThis);
