(function(root){"use strict";
const keys=["a","b","c","p","values"], ids=["A","B","C"];
const demo={a:[1,1],b:[7,1],c:[5,6],p:[3,2],values:[15,32,48]};
const boundary={...demo,p:[4,2]};
const practice={a:[-3,1],b:[4,2],c:[1,7],p:[2,3],values:[17,29,45]};
const fixture={a:[0,0],b:[6,0],c:[3,6],p:[3,1],values:[12,24,36]};
const limText="Use integer coordinates from −12 to 12 and whole readings from 0 to 999.";
function parse(parts){
 const fields=keys.map(k=>{
  const raw=parts[k];
  if(typeof raw!=="string"||raw.length>60)throw Error("Give three site coordinates, the target coordinate and all three readings.");
  return raw.split(",").map(e=>{
   const s=e.trim().replace(/−/g,"-");
   if(!(k==="values"?/^\d{1,3}$/:/^[+-]?\d{1,2}$/).test(s))throw Error(limText);
   const n=Number(s);
   if(k!=="values"&&Math.abs(n)>12)throw Error(limText);
   return n||0;
  });
 });
 if(fields.some((a,i)=>a.length!==(i===4?3:2)))throw Error("Give two comma-separated coordinates per point, and three comma-separated site readings.");
 if(new Set(fields.slice(0,3).map(a=>a.join(","))).size!==3)throw Error("The three sites must have distinct coordinates.");
 return Object.fromEntries(keys.map((k,i)=>[k,fields[i]]));
}
function encode(d){return Object.fromEntries(keys.map(k=>[k,d[k].join(",")]));}
function request(params){
 if(!keys.some(k=>params.has(k)))return {target:practice,linked:false,error:""};
 try{
  if(keys.some(k=>params.getAll(k).length!==1))throw Error("Each of a, b, c, p and values is required exactly once.");
  return {target:parse(Object.fromEntries(keys.map(k=>[k,params.get(k)]))),linked:true,error:""};
 }catch(e){return {target:practice,linked:true,error:"Invalid practice link. "+e.message+" Showing the independent exercise instead."};}
}
function compare(d){
 const ds=ids.map(site=>{const [x,y]=d[site.toLowerCase()];return (d.p[0]-x)**2+(d.p[1]-y)**2;});
 const min=Math.min(...ds),near=ids.filter((_,i)=>ds[i]===min),v=near.map(s=>d.values[ids.indexOf(s)]);
 return {ds,near,min,prediction:v.every(n=>n===v[0])?v[0]:null};
}
function expression(p,s){const token=n=>n<0?"~"+Math.abs(n):String(n);return "("+token(p[0])+"-"+token(s[0])+")²+("+token(p[1])+"-"+token(s[1])+")²";}
// Small calculator grammar (integer inputs, parentheses, addition, subtraction,
// multiplication and the dedicated square key). No evaluation of arbitrary code.
function evaluate(str){
 if(typeof str!=="string"||str.length>55||!/^[0-9+−~×()²-]+$/.test(str))throw Error("Use digits, parentheses, ×, +, − and x².");
 const raw=str.replaceAll("−","-");let i=0,work=0;
 const safe=v=>{if(!Number.isInteger(v)||Math.abs(v)>999999999)throw Error("Value outside this practice calculator’s range.");return v||0;};
 const invalid=()=>{throw Error("Check the signs and parentheses, then press Enter.");};
 function literal(){
  if(raw[i]==="("){i++;const v=sum();if(raw[i]!==")")invalid();i++;return v;}
  const match=/^\d{1,5}/.exec(raw.slice(i));if(!match)invalid();i+=match[0].length;return Number(match[0]);
 }
 function power(){
  let v=literal();
  while(raw[i]==="²"){i++;work++;v=safe(v*v);}
  return v;
 }
 function unary(){if(raw[i]==="~"){i++;return -unary();}return power();}
 function product(){let v=unary();while(raw[i]==="×"){i++;work++;v=safe(v*unary());}return v;}
 function sum(){let v=product();while(raw[i]==="+"||raw[i]==="-"){const op=raw[i++];work++;v=safe(v+(op==="+"?1:-1)*product());}return v;}
 const value=safe(sum());if(i!==raw.length)invalid();
 return {value,work};
}
const start=()=>({raw:"",cursor:0,history:[],result:null,error:""});
const glyph={lparen:"(",rparen:")",minus:"-",neg:"~",plus:"+",square:"²",mul:"×"};
function press(base,key){
 const s={...base,error:""};
 if(key==="esc")return {...s,raw:"",cursor:0};
 if(key==="left"||key==="right")return {...s,cursor:Math.max(0,Math.min(s.raw.length,s.cursor+(key==="left"?-1:1)))};
 if(key==="del"&&s.cursor>0)return {...s,raw:s.raw.slice(0,s.cursor-1)+s.raw.slice(s.cursor),cursor:s.cursor-1};
 if(key==="enter"){
  if(!s.raw)return s;
  try{
   const result={...evaluate(s.raw),text:s.raw};
   return {...s,history:[...s.history,result].slice(-30),result,raw:"",cursor:0};
  }catch(e){return {...s,error:e.message};}
 }
 if(key==="menu")return {...s,error:"Use the Calculator keys here. This rehearsal does not draw Voronoi cells on the handheld."};
 const ch=glyph[key]||(/^[0-9]$/.test(key)?key:"");
 if(ch&&s.raw.length<55)return {...s,raw:s.raw.slice(0,s.cursor)+ch+s.raw.slice(s.cursor),cursor:s.cursor+1};
 return s;
}
const pretty=raw=>raw.replace(/[-~]/g,"−");
const numeric=s=>/^\d{1,5}(?:\.0{1,4})?$/.test(String(s).trim())?Number(s):NaN;
function grade(d,s,a){
 const {ds,near,prediction}=compare(d);
 if(!ds.every(x=>s.history.some(r=>r.work>0&&r.value===x)))return {ok:false,feedback:"Use the handheld to calculate the squared distances, then compare your results."};
 const answers=[a.da,a.db,a.dc].map(numeric);
 if(!ds.every((v,i)=>v===answers[i]))return {ok:false,feedback:"Check each site’s squared distance. Subtract matching coordinates first, square each difference, then add."};
 if(near.join(",")!==a.near)return {ok:false,feedback:"Choose every site tied at the smallest squared distance. An equal pair is not nearest if the third site is closer."};
 if(prediction===null?(a.rule!=="no"):a.rule!=="value"||numeric(a.value)!==prediction)
  return {ok:false,feedback:"Use the nearest site’s recorded value. If nearest sites disagree, there is no unique estimate without a tie-break rule. Do not average."};
 return {ok:true,feedback:prediction===null?"Correct. The nearest readings disagree, so no unique estimate is supplied without a rule.":near.length>1?"Correct. All nearest sites report the same value, so it does not matter which is chosen.":"Correct. Copy the nearest site’s reading, not the average of the three."};
}
const cues=[
 [0,"Read the map","P = (3, 2). Sites: A (1, 1), B (7, 1), C (5, 6). Their readings are 15, 32 and 48. Which site's reading estimates P?"],
 [7,"Square differences for A","On the Calculator page, enter (3 − 1)² + (2 − 1)². Close each bracket, tap x², then Enter. No square root is needed."],
 [22,"Compare with B","Use the same P, but subtract B’s coordinates: (3 − 7)² + (2 − 1)². A negative difference becomes positive when squared."],
 [36,"Check the third site","Now use C: (3 − 5)² + (2 − 6)². Compare all the results, not just A and B."],
 [50,"Copy one reading","The squared distances are A: 5, B: 17, C: 20. Site A is nearest. The estimate at P is A’s reading, 15, not an average."],
 [57,"Move P to the boundary","Now move P to (4, 2). Its offsets from A are 3 and 1; from B they are −3 and 1. Enter 3² + 1² to check both."],
 [67,"Check that C is farther","For C the offsets are −1 and −4. Enter (−1)² + (−4)², using the negative key inside each bracket."],
 [79,"Do not average a tie","A and B tie at 10; C is farther at 17. This point lies on their cell boundary. With readings 15 and 32, no unique estimate exists unless a tie-break rule is given."]
];
const duration=87,tape=[];
const tick=(t,raw,pace=.8)=>[...raw,"enter"].forEach((v,i)=>tape.push([+(t+i*pace).toFixed(3),glyphInv[v]||v]));
const glyphInv=Object.fromEntries(Object.entries(glyph).map(([k,v])=>[v,k]));
tick(7.6,expression(demo.p,demo.a),.81);
tick(22.6,expression(demo.p,demo.b),.81);
tick(36.6,expression(demo.p,demo.c),.81);
tick(58.4,"3²+1²",.8);
tick(67.35,"(~1)²+(~4)²",.78);
function watchAt(raw){
 const t=Math.max(0,Math.min(duration,Number(raw)||0));let state=start(),active=[];
 for(const [at,k] of tape){if(at>t)break;state=press(state,k);active=t<at+.4?[k]:[];}
 return {state,active,chapter:cues.findLastIndex(([at])=>at<=t)};
}
const api={keys,ids,demo,boundary,practice,fixture,parse,request,encode,compare,expression,evaluate,start,press,grade,pretty,cues,duration,tape,watchAt};
if(typeof module==="object"&&module.exports)module.exports=api;else root.CT18=api;
})(globalThis);
