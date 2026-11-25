"use strict";
globalThis.BinomialTest=(()=>{
function mass(n,p,lo,hi){
 if(!Number.isInteger(n)||n<1||n>500||!Number.isFinite(p)||p<0||p>1||
    !Number.isInteger(lo)||!Number.isInteger(hi)||lo<0||hi>n||lo>hi)throw Error("Use a whole trial count (1–500), a probability from 0 to 1, and ordered whole bounds from 0 to n.");
 if(p===0)return lo===0?1:0;
 if(p===1)return hi===n?1:0;
 const mode=Math.min(n,Math.floor((n+1)*p)),q=1-p;
 let total=1,tail=mode>=lo&&mode<=hi?1:0,w=1;
 for(let j=mode;j>0;j--){w*=j*q/((n-j+1)*p);total+=w;if(j-1>=lo&&j-1<=hi)tail+=w;}
 w=1;
 for(let j=mode;j<n;j++){w*=(n-j)*p/((j+1)*q);total+=w;if(j+1>=lo&&j+1<=hi)tail+=w;}
 return Math.min(1,tail/total);
}
// Convert the validated decimal and compare the exact rational before rounding.
function rational(x){
 const [m,e="0"]=String(x).toLowerCase().split("e"),[whole,digits=""]=m.split(".");
 const power=+e-digits.length,a=BigInt(whole+digits);
 return power>=0?[a*10n**BigInt(power),1n]:[a,10n**BigInt(-power)];
}
function exactDecision(n,p,lo,hi,alpha){
 const [pN,pD]=rational(p),[aN,aD]=rational(alpha),q=pD-pN;
 let term=q**BigInt(n),sum=0n;
 for(let j=0;j<=hi;j++){
  if(j>=lo)sum+=term;
  if(j<hi)term=term*BigInt(n-j)*pN/(BigInt(j+1)*q);
 }
 const direct=sum*aD-(pD**BigInt(n))*aN;
 return direct<0?"reject":"retain";
}
function bounds(d){return d.side==="gt"?[d.k,d.n]:[0,d.k];}
function validate(d){
 const {n,p0,k,alpha,side}=d;
 if(!Number.isInteger(n)||n<1||n>500)return "Use a whole number of trials from 1 to 500.";
 if(!Number.isInteger(k)||k<0||k>n)return "Observed successes must be a whole number from 0 to n.";
 if(!(p0>=.000001&&p0<=.999999))return "Use a null probability from 0.000001 to 0.999999.";
 if(!(alpha>=.000001&&alpha<1))return "Enter α as a proportion from 0.000001 up to, but not including, 1.";
 if(!["gt","lt"].includes(side))return "Choose a one-sided alternative.";
 const [lo,hi]=bounds(d);
 if(mass(n,p0,lo,hi)===0)return "That nonzero tail is below this trainer’s numerical range.";
 return "";
}
return Object.freeze({mass,validate,bounds,exactDecision});
})();
