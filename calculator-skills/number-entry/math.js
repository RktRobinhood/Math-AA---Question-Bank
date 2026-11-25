(function(root){
"use strict";
const E=root.TIFreeCalc, defaultExpr="(3.6E5*2.5E-2)/(4.1E3)";
const pristine=(app="calc",entry="")=>({app,entry,frac:null,at:entry.length,ctrl:false,rows:[],value:null,error:""});
const input=s=>s.frac?"(("+s.frac.top+")/("+s.frac.bottom+"))"+s.frac.after:s.entry;
const canonical=text=>String(text).replace(/@E/ig,"E").replace(/[−–]/g,"-").replace(/×/g,"*").replace(/÷/g,"/");
const show=text=>text.replace(/(?<=[\d.])e(?=[+-]?\d|$)/ig,"E").replace(/-/g,"−").replace(/\*/g,"·").replace(/\//g," ÷ ");
const number=v=>{
 if(!Number.isFinite(v))return "";
 if(v!==0&&(Math.abs(v)<.001||Math.abs(v)>=1e10))return show(Number(v.toPrecision(12)).toExponential().replace(/e\+/,"E"));
 return show(String(Number(v.toPrecision(12))));
};
function evaluate(text,ans){
 return E.evaluate(canonical(text),{mode:"DEG",ans});
}
function typed(s,text){
 text=canonical(text).trim().slice(0,120);
 return {...s,app:"calc",entry:text,at:text.length,frac:null,error:"",value:null,ctrl:false};
}
function pressed(s,k){
 k=String(k).toLowerCase();
 const r={...s,ctrl:false,error:"",frac:s.frac&&{...s.frac}};
 if(k==="home")return {...r,app:"home"};
 if(s.app==="home"){
  if(k==="1")return {...r,app:"new"};
  if(k==="a")return {...r,app:"scratch"};
  if(k==="esc")return {...r,app:"calc"};
  return s;
 }
 if(s.app==="new"){
  if(k==="1"||k==="enter"||k==="select")return pristine();
  if(k==="esc")return {...r,app:"home"};
  return s;
 }
 if(k==="ctrl")return {...r,ctrl:!s.ctrl};
 if(k==="esc")return {...r,frac:null,entry:"",at:0,value:null};
 if(s.ctrl&&k==="div"){
  if(s.frac||s.entry)return {...r,error:"Clear the line before opening a new fraction template."};
  return {...r,at:0,frac:{top:"",bottom:"",after:"",active:"top"}};
 }
 if((k==="enter"||k==="return")){
  const text=input(s);
  if(s.frac&&(!s.frac.top||!s.frac.bottom))return {...r,error:"Complete both parts of the fraction."};
  try{
   const value=evaluate(text,s.value??s.rows.at(-1)?.value);
   return {...r,value,frac:null,entry:"",at:0,rows:[...s.rows,{text,value,frac:s.frac&&{...s.frac}}].slice(-6)};
  }catch(e){return {...r,error:e.message};}
 }
 const f=r.frac, active=f?.active,field=f?f[active]:r.entry;
 const set=(t,at)=>{if(f)f[active]=t;else r.entry=t;r.at=at;return r;};
 if(f&&(k==="tab"||k==="down"||k==="up"||(k==="right"&&s.at===field.length&&active!=="after")||(k==="left"&&s.at===0&&active!=="top"))){
  const next=k==="up"?"top":k==="down"?"bottom":k==="left"?(active==="after"?"bottom":"top"):(active==="top"?"bottom":active==="bottom"?"after":"top");
  f.active=next;r.at=f[next].length;return r;
 }
 if(k==="left"||k==="right")return {...r,at:Math.max(0,Math.min(field.length,s.at+(k==="left"?-1:1)))};
 if(k==="del")return s.at?set(field.slice(0,s.at-1)+field.slice(s.at),s.at-1):r;
 const token={ee:"E",neg:"-",minus:"-",plus:"+",mul:"*",div:"/",power:"^",square:"^2",dot:".",lparen:"(",rparen:")",pi:"pi"}[k]??(/^[0-9]$/.test(k)?k:null);
 if(token===null)return s;
 if(k==="ee"&&!/[0-9.]$/.test(field.slice(0,s.at)))return {...r,error:"Enter the coefficient before EE."};
 if(k==="minus"&&/E$/.test(field.slice(0,s.at)))return {...r,error:"Use the (−) key for a negative exponent."};
 if(input(s).length+token.length>120)return {...r,error:"That expression is too long."};
 return set(field.slice(0,s.at)+token+field.slice(s.at),s.at+token.length);
}
function linked(p){
 const opt=p.getAll("expr"),fig=p.getAll("sf");
 if(opt.length!==1||fig.length>1||opt[0].length>120)throw Error("This link needs one usable expression.");
 const expr=canonical(opt[0]).trim(),sf=fig.length?Number(fig[0]):3;
 if(!Number.isInteger(sf)||sf<1||sf>8||!expr||!/^[\d E.e()*/+\-]+$/.test(expr))throw Error("This link is not a supported numerical question.");
 const val=evaluate(expr);
 if(val===0||Math.abs(val)<1e-100||Math.abs(val)>=1e100)throw Error("This rounding practice needs a nonzero finite answer.");
 return {expr,sf,value:val};
}
function roundSF(value,sf){
 if(!value)return value;
 const [coef,e]=Number(Math.abs(value).toPrecision(15)).toExponential().split("e");
 const digits=coef.replace(".","").padEnd(sf+1,"0");
 const n=BigInt(digits.slice(0,sf))+(Number(digits[sf])>=5?1n:0n);
 return Math.sign(value)*Number(String(n)+"e"+(Number(e)-sf+1));
}
function grade(text,value,sf){
 const raw=canonical(String(text)).trim().replace(/\s/g,"");
 const m=/^([+-]?)(\d*\.?\d+|\d+\.)(?:[eE]([+-]?\d+))?$/.exec(raw);
 if(!m||!Number.isFinite(Number(raw)))return {ok:false,kind:"format"};
 if(m[3]&&!/^[1-9](?:\.\d*)?$/.test(m[2]))return {ok:false,kind:"format"};
 const rounded=roundSF(value,sf),given=Number(raw);
 if(given===0||Math.abs(given-rounded)>Math.abs(rounded)*1e-12)return {ok:false,kind:"value"};
 const digits=m[2].replace(".","").replace(/^0+/,""),ambiguity=!m[2].includes(".")&&/0$/.test(digits)&&(!m[3]||digits.length!==sf);
 if(digits.length!==sf||ambiguity)return {ok:false,kind:"precision"};
 return {ok:true,kind:"correct"};
}
root.CT01Math=Object.freeze({pristine,input,show,number,pressed,typed,evaluate,linked,grade,roundSF,defaultExpr});
})(globalThis);
