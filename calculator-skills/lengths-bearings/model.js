/* CT17: bounded course arithmetic and browser rehearsal, not TI firmware. */
(function(host){
"use strict";
const demo=Object.freeze({east:-6,north:-8,up:5});
const assigned=Object.freeze({east:5,north:-12,up:7});
const ids=["east","north","up"], modes=["rad","deg","grad"], forms={rad:"Radian",deg:"Degree",grad:"Gradian"};
const settings=["Display Digits","Angle","Exponential Format","Real or Complex","Calculation Mode","Exact Arithmetic","OK","Cancel"];
const fnames=["sin","cos","tan","csc","sec","cot","asin","acos","atan","acsc","asec","acot"];
const names={sqrt:"√",asin:"sin⁻¹",acos:"cos⁻¹",atan:"tan⁻¹",acsc:"csc⁻¹",asec:"sec⁻¹",acot:"cot⁻¹"};
const small=x=>Math.abs(x)<1e-13?0:x;
const display=x=>String(Number(x.toPrecision(6))).replaceAll("-","−");
function number(s){
 if(typeof s!=="string"||s.length>24) return null;
 s=s.trim().replaceAll("−","-");
 return /^[+-]?(?:\d{1,4}(?:\.\d{0,8})?|\.\d{1,8})$/.test(s) ? Number(s)||0 : null;
}
function validate(d){
 if(!ids.every(k=>typeof d[k]==="number"&&Number.isFinite(d[k])&&Math.abs(d[k])<=1000&&(d[k]===0||Math.abs(d[k])>=.01)))
  return "Use signed distances from −1000 to 1000 km. A nonzero component must be at least 0.01 km.";
 if(d.east===0&&d.north===0)return "At least one horizontal component must be nonzero; a purely vertical line has no bearing.";
 return "";
}
function request(p){
 const want=p.has("case")||p.has("example")||ids.some(k=>p.has(k));
 if(!want)return {d:assigned,valid:false,error:""};
 if(!ids.some(k=>p.has(k))&&["case","example"].filter(k=>p.has(k)).length===1&&
   ["case","example"].some(k=>p.getAll(k).length===1&&["demo","bearing-demo"].includes(p.get(k))))return {d:assigned,valid:true,error:""};
 if(p.has("case")||p.has("example")||ids.some(k=>p.getAll(k).length!==1))
  return {d:assigned,valid:false,error:"Linked tasks need east, north and up exactly once. The original Try task is ready."};
 const d=Object.fromEntries(ids.map(k=>[k,number(p.get(k))])),error=validate(d);
 return error?{d:assigned,valid:false,error:error+" The original Try task is ready."}:{d,valid:true,error:""};
}
const norm=d=>((d%360)+360)%360;
function geometry(d){
 const error=validate(d);
 if(error)throw RangeError(error);
 const {east:e,north:n,up:u}=d,horizontal=Math.hypot(e,n),diagonal=Math.hypot(e,n,u),bearing=norm(Math.atan2(e,n)*180/Math.PI);
 return {horizontal,diagonal,bearing,elevation:small(Math.atan2(u,horizontal)*180/Math.PI),bearingText:String(Math.round(bearing)%360).padStart(3,"0")};
}
function direction(d){
 const e=Math.sign(d.east),n=Math.sign(d.north);
 if(!e||!n)return {cardinal:true,...(n?{word:n>0?"north":"south",base:n>0?0:180}:{word:e>0?"east":"west",base:e>0?90:270})};
 const quadrant=n>0?(e>0?"north-east":"north-west"):(e>0?"south-east":"south-west");
 return {cardinal:false,word:quadrant,base:n>0?(e>0?0:360):180,op:e===n?"+":"−"};
}
function expr(raw,mode="deg"){
 if(typeof raw!=="string"||raw.length>112||!modes.includes(mode))throw Error("Use a short calculator expression.");
 const s=raw.trim().replaceAll("−","-").replaceAll("×","*").replaceAll("÷","/").replaceAll("²","^2").replaceAll("√","sqrt"),angle=mode==="deg"?Math.PI/180:mode==="grad"?Math.PI/200:1;
 const token=/\s*(?:(\d+(?:\.\d*)?|\.\d+)|([a-z]+)|([()+*/^\-]))/gy, ts=[];
 let i=0;
 while(i<s.length){
  token.lastIndex=i;const m=token.exec(s);
  if(!m)throw Error("Only numbers, parentheses, basic arithmetic, roots and trig are supported here.");
  ts.push(m[1]!==undefined?Number(m[1]):m[2]||m[3]);i=token.lastIndex;
 }
 let k=0,nest=0;
 const ops=new Set(),peek=()=>ts[k],get=()=>ts[k++];
 function need(x){if(get()!==x)throw Error("Check the parentheses.");}
 function call(name,x){
  ops.add(name);
  if(name==="sqrt")return Math.sqrt(x);
  if(name==="sin"||name==="cos")return Math[name](x*angle);
  if(name==="tan"){if(Math.abs(Math.cos(x*angle))<1e-13)throw Error("Tangent is undefined at that angle.");return Math.tan(x*angle);}
  if(name==="asin"||name==="acos"||name==="atan")return Math[name](x)/angle;
  throw Error("Use sin, cos, tan or one of their inverses in this rehearsal.");
 }
 function atom(){
  const t=get();
  if(typeof t==="number")return t;
  if(t==="("||typeof t==="string"&&/^[a-z]+$/.test(t)){
   if(++nest>15)throw Error("Too many nested expressions.");
   if(t!=="(")need("(");
   const x=add();need(")");nest--;
   return t==="("?x:call(t,x);
  }
  throw Error("Enter a complete calculator expression.");
 }
 function power(){const a=atom();if(peek()!=="^")return a;get();ops.add("power");return a**unary();}
 function unary(){
  if(peek()==="+"||peek()==="-"){const t=get();return (t==="-"?-1:1)*unary();}
  return power();
 }
 function mult(){
  let a=unary();while(peek()==="*"||peek()==="/"){const op=get(),b=unary();
   if(op==="/"&&b===0)throw Error("Cannot divide by zero.");a=op==="*"?a*b:a/b;}
  return a;
 }
 function add(){
  let a=mult();while(peek()==="+"||peek()==="-"){const op=get(),b=mult();a=op==="+"?a+b:a-b;}return a;
 }
 const x=add();
 if(k!==ts.length)throw Error("Use explicit × between factors. Check any parentheses.");
 if(!Number.isFinite(x)||Math.abs(x)>1e12)throw Error("The expression has no finite real value in the rehearsal.");
 return {value:small(x),ops:[...ops]};
}
const initial=()=>({view:"calc",mode:"rad",draft:"rad",field:0,choice:0,drop:false,trig:0,ctrl:false,raw:"",cursor:0,hist:[],error:"",fromWatch:false});
function insert(s,text,pointer=text.length){
 return s.raw.length+text.length>112?{...s,error:"Expression too long."}:{...s,raw:s.raw.slice(0,s.cursor)+text+s.raw.slice(s.cursor),cursor:s.cursor+pointer,error:""};
}
function glyph(s,i){return names[fnames[i]]||fnames[i];}
function chooseTrig(s,index){const f=fnames[index];return ["sin","cos","tan","asin","acos","atan"].includes(f)?insert({...s,view:"calc",trig:index},f+"()",f.length+1):{...s,error:"This rehearsal supports sine, cosine, tangent and their inverses."};}
function press(base,k){
 const s={...base,ctrl:k==="ctrl"?!base.ctrl:false,error:""},yes=k==="enter"||k==="select";
 if(k==="home")return {...s,view:"home",drop:false};
 if(k==="esc"){
  if(s.view==="settings"&&s.drop)return {...s,drop:false};
  if(s.view==="settings"||s.view==="settings-menu")return {...s,view:"home"};
  if(s.view!=="calc")return {...s,view:"calc"};
  return {...s,raw:"",cursor:0};
 }
 if(s.view==="home"){
  if(k==="5")return {...s,view:"settings-menu"};
  if(k==="4")return {...s,view:"calc"};
  return s;
 }
 if(s.view==="settings-menu")return k==="2"?{...s,view:"settings",draft:s.mode,field:0,choice:modes.indexOf(s.mode)}:s;
 if(s.view==="settings"){
  if(k==="point-ok"&&!s.drop)return {...s,field:6};
  if(s.drop){
   if(k==="left")return {...s,drop:false};
   if(k==="up"||k==="down")return {...s,choice:Math.min(2,Math.max(0,s.choice+(k==="up"?-1:1)))};
   return yes?{...s,drop:false,draft:modes[s.choice]}:s;
  }
  if(k==="tab"||k==="up"||k==="down")return {...s,field:(s.field+(k==="up"?7:1))%8};
  if((yes||k==="right")&&s.field===1)return {...s,drop:true,choice:modes.indexOf(s.draft)};
  if(yes&&s.field===6)return {...s,mode:s.draft,view:"home"};
  if(yes&&s.field===7)return {...s,view:"home"};
  return s;
 }
 if(s.view==="palette"){
  if(yes)return chooseTrig(s,s.trig);
  let i=s.trig;
  if(k==="down"&&i<6)i+=6;
  if(k==="up"&&i>=6)i-=6;
  if(k==="left"&&i%6>0)i--;
  if(k==="right"&&i%6<5)i++;
  return {...s,trig:i};
 }
 if(k==="trig")return {...s,view:"palette",trig:0};
 if(k==="ctrl")return s;
 if(k==="square")return base.ctrl?insert(s,"sqrt()",5):insert(s,"^2");
 if(k==="rparen"&&s.raw[s.cursor]===")")return {...s,cursor:s.cursor+1};
 if(k==="left"||k==="right")return {...s,cursor:Math.min(s.raw.length,Math.max(0,s.cursor+(k==="right"?1:-1)))};
 if(k==="del"){const p=s.cursor;return p?{...s,raw:s.raw.slice(0,p-1)+s.raw.slice(p),cursor:p-1}:s;}
 if(k==="enter"){
  try{const r=expr(s.raw,s.mode);return {...s,raw:"",cursor:0,hist:[...s.hist,{raw:s.raw,mode:s.mode,...r}].slice(-16)};}
  catch(e){return {...s,error:e.message};}
 }
 const c={lparen:"(",rparen:")",dot:".",minus:"-",neg:"-",plus:"+",mul:"*",div:"/",power:"^"}[k]||(/^[0-9]$/.test(k)?k:"");
 return c?insert(s,c):s;
}
function close(s,v){
 const n=number(s);return n!==null&&[3,4,5,6,7,8,9,10].some(x=>n===Number(v.toPrecision(x)))||n!==null&&Math.abs(n-v)<=3e-9*Math.max(1,Math.abs(v));
}
function grade(d,a,hist){
 const exp=geometry(d);
 const directionAngle=small(Math.atan2(Math.abs(d.east),Math.abs(d.north))*180/Math.PI);
 const matches=(a,b)=>Math.abs(a-b)<=Math.max(1,Math.abs(b))*2e-7;
 if(!hist.some(x=>x.mode==="deg"&&(
   x.ops.includes("sqrt")&&[exp.horizontal,exp.diagonal].some(v=>matches(x.value,v))||
   x.ops.includes("atan")&&[exp.bearing,exp.elevation,directionAngle].some(v=>matches(x.value,v)))))return "Use the handheld in DEG mode to enter at least one of the task’s root or angle calculations.";
 if(!close(a.horizontal,exp.horizontal))return "Check the horizontal distance. Use only the east and north components.";
 if(!/^\d{3}$/.test(String(a.bearing).trim())||String(a.bearing).trim()!==exp.bearingText)return "Give the clockwise bearing as three digits, rounded to the nearest degree. Check its quadrant.";
 if(!close(a.elevation,exp.elevation))return "Check the signed elevation: compare the vertical change with the horizontal distance, not the sloping distance.";
 if(!close(a.diagonal,exp.diagonal))return "Check the straight-line distance: all three perpendicular displacements contribute.";
 return "";
}
host.CT17=Object.freeze({demo,assigned,ids,modes,forms,settings,fnames,names,number,validate,request,geometry,direction,expr,display,initial,press,chooseTrig,glyph,grade});
})(typeof window==="undefined"?globalThis:window);
