(function(root){"use strict";
const SCALE=10000,MIN=4,MAX=32,BOUND=1000000,clamp=(x,l,h)=>Math.min(h,Math.max(l,x));
function scaled(raw){
 const n=String(raw).trim().replace(/−/g,"-");
 if(!/^[+-]?(?:\d{1,7}(?:\.\d{0,4})?|\.\d{1,4})$/.test(n))return NaN;
 const neg=n.startsWith("-"),[w,d=""]=n.replace(/^[+-]/,"").split("."),v=Number(w||"0")*SCALE+Number(d.padEnd(4,"0"));
 return v<=BOUND*SCALE?(neg?-v:v):NaN;
}
function list(raw,answer=false){
 const t=String(raw).trim();
 if(answer&&/^(?:none|no outliers|∅)$/i.test(t))return [];
 if(!t||t.length>480)throw Error("Enter a short comma- or space-separated list.");
 if(/,\s*,|^,|,$/.test(t))throw Error("Fill every position in the list.");
 const values=t.split(/\s*,\s*|\s+/).map(scaled);
 if(values.some(x=>!Number.isFinite(x)))throw Error("Use numbers from −1,000,000 to 1,000,000, with at most four decimal places.");
 if(values.length>MAX||!answer&&values.length<MIN)throw Error("Use between 4 and 32 observations.");
 return values;
}
const parse=raw=>list(raw);
const text=x=>(x===0?"0":String(Number(x.toFixed(6)))).replace(/-/g,"−");
const listText=data=>data.map(x=>text(x/SCALE)).join(", ");
function describe(a){
 if(!Array.isArray(a)||a.length<MIN||a.length>MAX||a.some(x=>!Number.isSafeInteger(x)||Math.abs(x)>SCALE*BOUND))throw Error("Unsupported observations.");
 const sorted=a.slice().sort((x,y)=>x-y),n=sorted.length,m=Math.floor(n/2);
 const doubleMedian=v=>{const i=Math.floor(v.length/2);return v.length%2?2*v[i]:v[i-1]+v[i];};
 const q1=doubleMedian(sorted.slice(0,m)),median=doubleMedian(sorted),q3=doubleMedian(sorted.slice(n-m));
 const iqr=q3-q1,left4=2*q1-3*iqr,right4=2*q3+3*iqr;
 const inliers=sorted.filter(x=>left4<=x*4&&x*4<=right4);
 const out=sorted.filter(x=>x*4<left4||x*4>right4);
 return {q1:q1/(2*SCALE),median:median/(2*SCALE),q3:q3/(2*SCALE),iqr:iqr/(2*SCALE),
  leftFence:left4/(4*SCALE),rightFence:right4/(4*SCALE),
  left:inliers[0]/SCALE,right:inliers.at(-1)/SCALE,min:sorted[0]/SCALE,max:sorted.at(-1)/SCALE,
  outliers:out.map(x=>x/SCALE),sorted:sorted.map(x=>x/SCALE)
 };
}
function grade(answers,q){
 // Fences can have up to six decimals although each input had at most four.
 const read=t=>/^[+-]?(?:\d{1,8}(?:\.\d{0,6})?|\.\d{1,6})$/.test(String(t).trim().replace(/−/g,"-"))?Number(String(t).trim().replace(/−/g,"-")):NaN;
 const [low,high,l,r,raw]=answers,outer=list(raw,true).sort((a,b)=>a-b).map(x=>x/SCALE);
 return {fences:read(low)===q.leftFence&&read(high)===q.rightFence,whiskers:read(l)===q.left&&read(r)===q.right,
  outliers:outer.length===q.outliers.length&&outer.every((x,i)=>x===q.outliers[i])};
}
root.CT30Math=Object.freeze({SCALE,MIN,MAX,BOUND,parse,describe,grade,text,listText,clamp});
})(typeof module==="object"&&module.exports?module.exports:globalThis);
