/* Bounded, original educational approximations for non-CAS handheld commands. */
(function(root){
 'use strict';
 function args(raw){
  const m=/^([a-z][a-z0-9]*)\s*\((.*)\)$/is.exec(raw.trim());if(!m)return null;
  let d=0,s='',a=[];
  for(const c of m[2]){if(c===','&&d===0){a.push(s.trim());s='';continue;}if(c==='(')d++;if(c===')')d--;if(d<0)throw Error('Check the brackets.');s+=c;}
  if(d!==0)throw Error('Check the brackets.');a.push(s.trim());return [m[1].toLowerCase(),a];
 }
 function numbers(a,n,ev){if(a.length!==n||a.some(x=>!x))throw Error('Check the number of command arguments.');return a.map(ev);}
 function choose(n,k){
  if(!Number.isInteger(n)||!Number.isInteger(k)||k<0||n>600||k>n)throw Error('Use whole numbers with 0 ≤ r ≤ n ≤ 600.');
  let c=1;for(let i=1;i<=Math.min(k,n-k);i++)c*= (n-i+1)/i;return n<50?Math.round(c):c;
 }
 function bin(n,p,a,b){
  if(!Number.isInteger(n)||n<0||n>600||p<0||p>1||!Number.isSafeInteger(a)||!Number.isSafeInteger(b)||a<0||b>n||a>b)throw Error('Check n, probability and inclusive whole-number bounds.');
  if(p===0||p===1)return Number(a<=(p===0?0:n)&&(p===0?0:n)<=b);
  let r=0;for(let k=a;k<=b;k++)r+=Math.exp(Math.log(choose(n,k))+k*Math.log(p)+(n-k)*Math.log1p(-p));return Math.min(1,r);
 }
 function poiss(l,a,b){
  if(!(l>0&&l<=200&&Number.isInteger(a)&&Number.isInteger(b)&&a>=0&&b<=600&&a<=b))throw Error('Use 0 < λ ≤ 200 and inclusive whole-number bounds from 0 to 600.');
  let r=0,log=0;for(let k=0;k<=b;k++){if(k>0)log+=Math.log(k);if(k>=a)r+=Math.exp(-l+k*Math.log(l)-log);}return Math.min(1,r);
 }
 function solve(eq,v,lo,hi,ev,mode){
  const name=/^x(?:\s*=\s*(.+))?$/i.exec(v||'');
  const sides=eq.split('=');
  if(!name||sides.length!==2||!sides.every(x=>x.trim())||!sides.some(x=>x.toLowerCase().includes("x")))throw Error('Use nSolve(equation,x[,lower,upper]) or x=guess.');
  const guess=name[1]===undefined?0:ev(name[1]);
  const low=lo===undefined?guess-10:ev(lo),high=hi===undefined?guess+10:ev(hi);
  if(lo!==undefined&&name[1]!==undefined&&(guess<low||guess>high))throw Error('Keep the initial guess inside the search bounds.');
  const G=root.TIGraphGeneral,a=G.parse(sides[0],{angle:mode}),b=G.parse(sides[1],{angle:mode}),found=G.roots(a,b,low,high);
  if(!found.length)return {value:null,display:'No solution found',notice:'No root was detected in this search. This is not proof that no solution exists.'};
  const selected=name[1]===undefined?found[0]:found.slice().sort((a,b)=>Math.abs(a.x-guess)-Math.abs(b.x-guess))[0];
  return {value:selected.x,notice:'One approximate solution. It may not be the only one.'};
 }
 function numericalDerivative(f,x,order){
  if(![1,2].includes(order))throw Error('Use order 1 or 2.');
  const h=(order===1?1e-5:1e-3)*Math.max(1,Math.abs(x));
  const a0=(f(x)-f(x-h))/h,a1=(f(x+h)-f(x))/h;
  if(!Number.isFinite(a0+a1)||Math.abs(a0-a1)>(order===1?.003:.05)*Math.max(1,Math.abs(a0),Math.abs(a1)))throw Error('A reliable derivative was not found at that point.');
  return {value:order===1?(a0+a1)/2:(a1-a0)/h,notice:''};
 }
 function evaluate(raw,ev,mode){
  // TI non-CAS desktop keyboard spelling. This educational model supports x
  // with an explicit evaluation point and does not store a variable or use CAS.
  if(/^\s*derivative\s*\(/i.test(raw)){
   const pieces=raw.split('|');
   const parsed=pieces.length===2?args(pieces[0]):null;
   const at=pieces.length===2&&/^\s*x\s*=\s*([^=|]+?)\s*$/i.exec(pieces[1]);
   if(!parsed||!at||!at[1].trim()||![2,3].includes(parsed[1].length)||parsed[1].some(x=>!x)||!/^x$/i.test(parsed[1][1]))
    throw Error('Use derivative(expression,x[,order]) | x=value.');
   const [expr,,order]=parsed[1];
   const f=root.TIGraphGeneral.parse(expr,{angle:mode}).evaluate;
   return numericalDerivative(f,ev(at[1]),order===undefined?1:ev(order));
  }
  if(!/^\s*(?:nsolve|binompdf|binomcdf|normcdf|invnorm|poisspdf|poisscdf|ncr|npr|nderivative|nint)\s*\(/i.test(raw))return null;
  const parsed=args(raw);
  if(!parsed)throw Error('Complete the command and its closing parenthesis.');
  const [n,a]=parsed;
  const value=v=>({value:v,notice:''});
  if(n==='nsolve'){
   if(![2,4].includes(a.length)||a.some(x=>!x))throw Error('Use nSolve(equation,x) or nSolve(equation,x,lower,upper).');
   return solve(...[a[0],a[1],a[2],a[3],ev,mode]);
  }
  if(n==='ncr'||n==='npr'){const [m,k]=numbers(a,2,ev);let r=choose(m,k);if(n==='npr')for(let j=2;j<=k;j++)r*=j;return value(r);}
  if(n==='binompdf'||n==='binomcdf'){
   const [m,p,q,s]=numbers(a,n==='binompdf'?3:4,ev);return value(bin(m,p,q,s??q));
  }
  if(n==='poisspdf'||n==='poisscdf'){
   const [l,q,s]=numbers(a,n==='poisspdf'?2:3,ev);return value(poiss(l,q,s??q));
  }
  if(n==='normcdf'){
   const [lower,upper,mean,sd]=numbers(a,4,ev);
   return value(root.NspireNormal.normalMass({lower,upper,mean,sd}));
  }
  if(n==='invnorm'){
   const [p,m,s]=numbers(a,3,ev);
   if(!(p>0&&p<1&&s>0))throw Error('Use 0 < area < 1 and a positive standard deviation.');
   let lo=-38,hi=38;
   for(let i=0;i<70;i++){const md=(lo+hi)/2;if(root.NspireNormal.standardMass(-38,md)<p)lo=md;else hi=md;}
   return value(m+s*(lo+hi)/2);
  }
  if(n==='nderivative'||n==='nint'){
   const g=root.TIGraphGeneral.parse(a[0],{angle:mode}),f=g.evaluate;
   if(n==='nderivative'){
    const at=/^x\s*=\s*(.+)$/i.exec(a[1]||'');
    if(!at||![2,3].includes(a.length))throw Error('Use nDerivative(expression,x=value[,order]).');
    const x=ev(at[1]),order=a.length===2?1:ev(a[2]);
    return numericalDerivative(f,x,order);
   }
   if(a.length!==4||a[1]!=='x')throw Error('Use nInt(expression,x,lower,upper).');
   const x=ev(a[2]),r=ev(a[3]);if(x===r)return value(0);
   const lo=Math.min(x,r),hi=Math.max(x,r);
   if(root.TIGraphGeneral.sampleCurve(g,{x0:lo,x1:hi},300).length!==1)throw Error('Check the function domain in this interval.');
   const N=800,h=(hi-lo)/N;let s=f(lo)+f(hi);
   for(let j=1;j<N;j++)s+=(j%2?4:2)*f(lo+j*h);
   return value(Math.sign(r-x)*s*h/3);
  }
  return null;
 }
 root.TICalcTools=Object.freeze({evaluate,argumentsFor:args});
})(globalThis);
