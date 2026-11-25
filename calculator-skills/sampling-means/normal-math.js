/* Gaussian integration over eighth-unit slices. Direct integration avoids subtracting nearly equal CDFs. */
(function(){
  'use strict';
  const nodes=[.1834346424956498,.525532409916329,.7966664774136267,.9602898564975363];
  const weights=[.362683783378362,.3137066458778873,.2223810344533745,.1012285362903763];
  const root2pi=Math.sqrt(2*Math.PI), limit=38.6;
  const density=t=>Math.exp(-t*t/2)/root2pi;
  function standardMass(a,b){
    a=Math.max(-limit,a);b=Math.min(limit,b);
    if(a>=b)return 0;
    const slices=Math.max(1,Math.ceil((b-a)*8)), width=(b-a)/slices, half=width/2;
    let result=0;
    for(let j=0;j<slices;j++){
      const m=a+(j+.5)*width;
      for(let i=0;i<nodes.length;i++){const d=half*nodes[i];result+=half*weights[i]*(density(m-d)+density(m+d));}
    }
    return Math.min(1,Math.max(0,result));
  }
  function normalMass({mean,sd,lower=-Infinity,upper=Infinity}){
    if(!Number.isFinite(mean)||!Number.isFinite(sd)||sd<=0)throw Error('Mean must be finite and standard deviation must be greater than zero.');
    if(!(lower<upper))throw Error('The lower bound must be less than the upper bound.');
    let a=(lower-mean)/sd,b=(upper-mean)/sd;
    if(Number.isFinite(lower)&&Number.isFinite(upper)&&a===b)throw Error('These bounds are too close together at this scale.');
    return standardMass(a,b);
  }
  const api={normalMass,standardMass,density};
  if(typeof module==='object'&&module.exports)module.exports=api;
  else globalThis.NspireNormal=api;
})();
