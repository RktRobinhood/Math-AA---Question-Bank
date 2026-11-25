(function(g,f){'use strict';const v=f(typeof module==='object'&&module.exports?require("./math").CT52Math:g.CT52Math);if(typeof module==='object'&&module.exports)module.exports=v;else g.CT52Editor=v;})(globalThis,M=>{
 const base=(raw="")=>({page:"f1",raw,caret:raw.length,q:null,both:false,ctrl:false,shift:false,var:"",arg:"",field:0,select:0,curve:1,low:null,cursor:0,buf:"",marks:[],error:"",probe:null,fromWatch:false});
 const menu=["1: Actions","2: View","3: Graph Entry/Edit","4: Window/Zoom","5: Trace","6: Analyze Graph ▸","7: Table","8: Geometry","9: Settings…"];
 const sub=["1: Zero","2: Minimum","3: Maximum","4: Intersection","5: dy/dx","6: Integral","7: Bounded Area","8: Analyze Conics"];
 function confirmBound(s,x){
  if(x===null||!Number.isFinite(x)||x< -20||x>20)return {...s,error:"Use a decimal bound in [−20,20]."};
  if(s.page==="lower")return {...s,page:"upper",low:x,cursor:x,buf:"",error:""};
  if(s.page==="upper"){
   try{const x0=M.between(s.q,s.low,x);return {...s,page:"graph",marks:[...new Set([...s.marks,x0])].slice(-4),buf:"",error:""};}
   catch(e){return {...s,error:e.message};}
  }
  return s;
 }
 function k(old,key){
  let s={...old,error:""};const ok=key==="enter"||key==="select";
  if(key==="ctrl"){s.ctrl=!s.ctrl;s.shift=false;return s;}
  if(key==="shift"){s.shift=!s.shift;s.ctrl=false;return s;}
  const derivative=s.shift&&key==="minus"||key==="derivative-template";s.shift=false;
  const combo=s.ctrl&&key==="g"||key==="ctrl-g";s.ctrl=false;
  if(key==="esc"){
   if(s.page==="sub")return {...s,page:"menu",select:5};
   if(s.page==="templates")return {...s,page:"f2"};
   return {...s,page:s.q?"graph":"f1",low:null,buf:""};
  }
  if(combo&&s.q)return {...s,page:"f2",field:0,var:"",arg:"",probe:null,low:null,buf:""};
  if(key==="edit-f1")return {...s,page:"f1",caret:s.raw.length,both:false,marks:[],probe:null};
  if(key==="menu"&&s.q)return {...s,page:"menu",select:0,probe:null,low:null,buf:""};
  if(s.page==="menu"||s.page==="sub"){
   if(key==="up"||key==="down"){const count=s.page==="menu"?menu.length:sub.length;return {...s,select:(s.select+(key==="up"?-1:1)+count)%count};}
   const i=ok||key==="right"?s.select:Number(key)-1;
   if(s.page==="menu"&&i===5)return {...s,page:"sub",select:0};
   if(s.page==="sub"&&i===0)return s.both?{...s,page:"curve",curve:1}:{...s,error:"Add f₂, the derivative, before using Zero in this workflow."};
   return s;
  }
  if(s.page==="curve"){
   if(["up","down","left","right"].includes(key))return {...s,curve:3-s.curve};
   if(ok)return s.curve===2?{...s,page:"lower",cursor:0,low:null,buf:""}:{...s,error:"Select f₂, the derivative graph, before choosing bounds."};
   return s;
  }
  if(s.page==="lower"||s.page==="upper"){
   if(ok)return confirmBound(s,s.buf?M.readX(s.buf):s.cursor);
   if(key==="left"||key==="right")return {...s,cursor:M.clamp(Number((s.cursor+(key==="left"?-.25:.25)).toFixed(9)),-20,20),buf:""};
   if(key==="del")return {...s,buf:s.buf.slice(0,-1)};
   const digit=/^\d$/.test(key)?key:({neg:"-",minus:"-",dot:"."})[key];
   return digit&&s.buf.length<18?{...s,buf:s.buf+digit}:s;
  }
  if(s.page==="f2"&&derivative)return {...s,page:"diff",field:0,var:"",arg:""};
  if(s.page==="f2"&&key==="templates")return {...s,page:"templates",select:0};
  if(s.page==="templates"){
   if(key==="right"||key==="left")return {...s,select:M.clamp(s.select+(key==="right"?1:-1),0,5)};
   if(ok&&s.select===4)return {...s,page:"diff",field:0,var:"",arg:""};
   if(ok)return {...s,error:"Choose the first derivative symbol d/dx."};
  }
  if(s.page==="diff"){
   if(key==="right"||key==="tab")return {...s,field:1};
   if(key==="left"&&s.arg==="")return {...s,field:0};
   if(ok){
    if(s.var!=="x"||s.arg!=="f1(x)")return {...s,error:"Use x in the variable box and f1(x) as the expression."};
    return {...s,page:"graph",both:true,marks:[],probe:null};
   }
   const part=s.field?"arg":"var";
   const letter=/^[0-9fx]$/.test(key)?key:({lparen:"(",rparen:")"})[key];
   if(key==="del")return {...s,[part]:s[part].slice(0,-1)};
   return letter&&s[part].length<14?{...s,[part]:s[part]+letter}:s;
  }
  if(s.page!=="f1")return s;
  if(ok){
   try{return {...s,q:M.parse(s.raw),both:false,page:"graph",marks:[],probe:null};}
   catch(e){return {...s,error:e.message};}
  }
  if(key==="left"||key==="right")return {...s,caret:M.clamp(s.caret+(key==="left"?-1:1),0,s.raw.length)};
  if(key==="del"&&s.caret)return {...s,raw:s.raw.slice(0,s.caret-1)+s.raw.slice(s.caret),caret:s.caret-1};
  const a=/^[0-9x]$/.test(key)?key:({minus:"-",neg:"-",plus:"+",square:"^2",power:"^",dot:".",mul:"*",div:"/",lparen:"(",rparen:")"})[key];
  if(a&&s.raw.length+a.length<=80)return {...s,raw:s.raw.slice(0,s.caret)+a+s.raw.slice(s.caret),caret:s.caret+a.length};
  return s;
 }
 return Object.freeze({base,k,confirmBound,menu,sub});
});
