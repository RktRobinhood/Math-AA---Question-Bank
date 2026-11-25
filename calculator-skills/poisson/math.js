(function(root){"use strict";
const MIN=.0001,MAX=120,TOP=150;
const clamp=(x,l,h)=>Math.max(l,Math.min(h,x));
const logs=[0];for(let i=1;i<=800;i++)logs[i]=logs[i-1]+Math.log(i);
const acc=()=>{let s=0,c=0;return {add(v){const y=v-c,t=s+y;c=(t-s)-y;s=t;},sum:()=>s};};
function checkMean(lambda){if(!Number.isFinite(lambda)||lambda<MIN||lambda>MAX)throw Error("Use a Poisson mean between 0.0001 and 120.");}
function checkCount(n){if(!Number.isInteger(n)||n<0||n>TOP)throw Error("Use a whole-number count between 0 and 150.");}
const mass=(l,k)=>Math.exp(-l+k*Math.log(l)-logs[k]);
const supported=p=>{if(p===0||p<1e-308)throw Error("This probability is positive but below the simulator’s reliable numeric range.");return p;};
function pmf(l,k){checkMean(l);checkCount(k);return supported(mass(l,k));}
function cdf(l,a,b){
 checkMean(l);checkCount(a);checkCount(b);if(b<a)throw Error("Use increasing or equal count bounds.");
 const s=acc();for(let k=a;k<=b;k++)s.add(mass(l,k));return supported(Math.min(1,s.sum()));
}
function tail(l,k){
 // Positive mass accumulation for an inclusive tail. Never subtract a rounded CDF from 1.
 checkMean(l);if(!Number.isInteger(k)||k<0||k>TOP+1)throw Error("Use a supported whole-number count.");
 if(k===0)return 1;
 const s=acc();let p=mass(l,k);
 for(let i=k;i<=800;i++){s.add(p);if(i>l&&(p===0||p<Number.EPSILON/4*s.sum()))break;p*=l/(i+1);}
 return supported(Math.min(1,s.sum()));
}
const normalize=s=>String(s).trim().replace(/−/g,"-");
const DEC="[+]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)";
const dec=new RegExp("^"+DEC+"$"),whole=/^\d+$/;
function number(s){const v=String(s).trim();return v.length<=18&&dec.test(v)?Number(v):NaN;}
function integer(s){const v=String(s).trim();return v.length<=5&&whole.test(v)?Number(v):NaN;}
const fmt=x=>x===0?"0":x<1e-4?x.toExponential(5).replace(/e([+-])0*/,"E$1"):String(Number(x.toPrecision(6)));
const neat=x=>String(Number(x.toPrecision(12)));
function calculator(raw){
 if(String(raw).length>100)throw Error("Use one supported Poisson command.");
 const s=normalize(raw),m=/^(1\s*-\s*)?(poisspdf|poisscdf)\s*\(([^()]+)\)$/i.exec(s);
 if(!m)throw Error("Enter poissPdf(λ,x), poissCdf(λ,lower,upper), or 1−poissCdf(λ,0,upper).");
 const complement=Boolean(m[1]),kind=m[2].toLowerCase(),parts=m[3].split(","),pm=kind==="poisspdf";
 if(parts.length!==(pm?2:3)||(pm&&complement))throw Error("Check the number of arguments and the command.");
 const l=number(parts[0]),a=integer(parts[1]),b=pm?null:integer(parts[2]);
 checkMean(l);checkCount(a);if(!pm)checkCount(b);
 if(complement&&a!==0)throw Error("For a right tail, use 0 as the lower CDF bound.");
 const value=pm?pmf(l,a):complement?tail(l,b+1):cdf(l,a,b);
 return {value,expression:(complement?"1−":"")+(pm?"poissPdf":"poissCdf")+"("+[l,a,...(pm?[]:[b])].map(neat).join(",")+")"};
}
function event(l,kind,a,b){
 checkMean(l);checkCount(a);
 if(kind==="pmf")return pmf(l,a);
 if(kind==="between")return cdf(l,a,b);
 if(kind==="gt")return tail(l,a+1);
 if(kind==="ge")return tail(l,a);
 throw Error("Choose a supported event.");
}
const label=(kind,a,b)=>kind==="pmf"?"P(X = "+a+")":kind==="between"?"P("+a+" ≤ X ≤ "+b+")":kind==="gt"?"P(X > "+a+")":"P(X ≥ "+a+")";
function grade(raw,expected){
 const text=String(raw).trim();
 if(!/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d{1,3})?$/i.test(text)||text.length>28)return false;
 const value=Number(text);
 if(expected===0||expected===1)return value===expected;
 if(value===0||!Number.isFinite(value)||value>1)return false;
 return [expected,...Array.from({length:10},(_,i)=>Number(expected.toPrecision(i+3)))].some(x=>Math.abs(value-x)<=Math.abs(x)*2e-10);
}
root.CT42Math=Object.freeze({MIN,MAX,TOP,clamp,pmf,cdf,tail,event,calculator,label,fmt,neat,number,integer,grade});
})(typeof module==="object"&&module.exports?module.exports:globalThis);
