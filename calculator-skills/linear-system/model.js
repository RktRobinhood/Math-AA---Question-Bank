(function(g,f){'use strict';const v=f();if(typeof module==='object'&&module.exports)module.exports=v;else g.CT07=v;})(globalThis,()=>{
'use strict';
const abs=n=>n<0n?-n:n,lim=1n<<128n;
function gcd(a,b){a=abs(a);b=abs(b);while(b)[a,b]=[b,a%b];return a||1n;}
function Q(n,d=1n){
 if(!d)throw Error('Division by zero is not allowed.');
 if(d<0n){n=-n;d=-d;}
 const h=gcd(n,d);n/=h;d/=h;
 if(abs(n)>lim||d>lim)throw Error('These coefficients are too large for this exercise.');
 return Object.freeze({n,d});
}
const Z=Q(0n),O=Q(1n),add=(a,b)=>Q(a.n*b.d+b.n*a.d,a.d*b.d),sub=(a,b)=>Q(a.n*b.d-b.n*a.d,a.d*b.d),
 mul=(a,b)=>Q(a.n*b.n,a.d*b.d),div=(a,b)=>Q(a.n*b.d,a.d*b.n),neg=a=>Q(-a.n,a.d);
const qtext=q=>String(q.n).replace('-','−')+(q.d===1n?'':'/'+q.d);
const normalize=s=>s.trim().toLowerCase().replace(/[−–]/g,'-').replace(/[×·]/g,'*').replace(/÷/g,'/');
const disp=s=>String(s).replace(/-/g,'−').replace(/\*/g,'·');
const sameQ=(a,b)=>a.n===b.n&&a.d===b.d;
function parseSide(raw){
 const s=raw.replace(/\s/g,'');
 const tokens=s.match(/\d+(?:\.\d*)?|\.\d+|[xy()+\-*/]/g)||[];
 const numeric=t=>Boolean(t)&&/^[\d.]/.test(t);
 if(!s||tokens.join('')!==s||tokens.some((t,i)=>numeric(t)&&numeric(tokens[i-1])))
  throw Error('Use only numbers, x, y, brackets and + − × ÷.');
 let i=0;
 const constant=q=>[Z,Z,q],flat=a=>!a[0].n&&!a[1].n,scale=(a,n)=>a.map(c=>mul(c,n));
 const atom=()=>{
  const t=tokens[i++];
  if(t==='('){const e=expr();if(tokens[i++]!==')')throw Error('Check the brackets.');return e;}
  if(t==='x')return [O,Z,Z];if(t==='y')return [Z,O,Z];
  if(numeric(t)){const [a,b='']=t.split('.');if(a.length>9||b.length>8)throw Error('Use up to 9 whole digits and 8 decimal digits.');return constant(Q(BigInt((a||'0')+b),10n**BigInt(b.length)));}
  throw Error('An equation is incomplete. Check numbers, signs and brackets.');
 };
 const unary=()=>tokens[i]==='-'?(i++,unary().map(neg)):tokens[i]==='+'?(i++,unary()):atom();
 const implicit=t=>t==='x'||t==='y'||t==='('||numeric(t);
 const term=()=>{
  let a=unary();
  while(tokens[i]==='*'||tokens[i]==='/'||implicit(tokens[i])){
   const op=tokens[i];if(op==='*'||op==='/')i++;
   const b=unary();
   if(op==='/'){
    if(implicit(tokens[i]))throw Error('Use brackets or explicit × after division.');
    if(!flat(b))throw Error('Divide only by a number, not by an expression containing x or y.');
    a=a.map(v=>div(v,b[2]));
   }else{
    if(!flat(a)&&!flat(b))throw Error('The equations must be linear: do not multiply variables together.');
    a=flat(a)?scale(b,a[2]):scale(a,b[2]);
   }
  }
  return a;
 };
 const expr=()=>{
  let a=term();
  while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++],b=term();a=a.map((v,j)=>(op==='+'?add:sub)(v,b[j]));}
  return a;
 };
 const out=expr();if(i!==tokens.length)throw Error('Check the brackets or arithmetic signs.');
 return out;
}
function equation(raw){
 if(typeof raw!=='string'||raw.length>60||/[\d.]\s+[\d.]/.test(raw))throw Error('Use an equation up to 60 characters, with no spaces inside a number.');
 const s=normalize(raw), halves=s.split('=');
 if(halves.length!==2||halves.some(v=>!v.trim()))throw Error('Give each equation exactly one equals sign and two sides.');
 const a=parseSide(halves[0]),b=parseSide(halves[1]),v=[sub(a[0],b[0]),sub(a[1],b[1]),sub(b[2],a[2])];
 return Object.freeze({raw:s.replace(/\s/g,''),row:Object.freeze(v)});
}
const cross=(a,b,c,d)=>sub(mul(a,d),mul(b,c));
function solve(m,n){
 const [a,b,c]=m.row,[d,e,f]=n.row;
 if((!a.n&&!b.n&&c.n)||(!d.n&&!e.n&&f.n))return {kind:'none'};
 const det=cross(a,b,d,e);
 if(!det.n){
  if(cross(a,c,d,f).n||cross(b,c,e,f).n)return {kind:'none'};
  return {kind:'many'};
 }
 return {kind:'unique',x:div(cross(c,b,f,e),det),y:div(cross(a,c,d,f),det)};
}
function sameEquation(a,b){
 const p=a.row.findIndex(v=>v.n);
 if(p<0)return !b.row.some(v=>v.n);
 if(!b.row[p].n)return false;
 return a.row.every((q,i)=>!cross(q,a.row[p],b.row[i],b.row[p]).n);
}
function sameSystem(a,b){return (sameEquation(a[0],b[0])&&sameEquation(a[1],b[1]))||(sameEquation(a[0],b[1])&&sameEquation(a[1],b[0]));}
function answer(raw){
 if(typeof raw!=='string'||raw.length>40||/[\d.]\s+[\d.]/.test(raw))return null;
 try{const a=parseSide(normalize(raw));return a[0].n||a[1].n?null:a[2];}catch{return null;}
}
function link(params){
 if(!params.has('eq1')&&!params.has('eq2'))return null;
 if(params.getAll('eq1').length!==1||params.getAll('eq2').length!==1)throw Error('Provide exactly two equations.');
 return [equation(params.get('eq1')),equation(params.get('eq2'))];
}
const MENUS={main:['1: Actions','2: Number','3: Algebra ▸','4: Calculus','5: Probability','6: Statistics','7: Matrix & Vector'],algebra:['1: Numerical Solve','2: Solve System of Linear Equations…','3: Polynomial Tools ▸']};
const base=()=>({page:'calc',selected:0,field:0,dim:'2',order:'x,y',setupReplace:true,rows:['',''],caret:0,last:null,error:'',fromWatch:false});
const load=(s,rows)=>({...s,page:'entry',field:0,rows:[...rows],caret:rows[0].length,order:order(s)?s.order:'x,y',error:'',last:null,fromWatch:false});
const order=s=>/^(x,y|y,x)$/.test(s.order)?s.order.split(','):null;
function key(old,k){
 const s={...old,rows:[...old.rows],error:''},confirm=k==='enter'||k==='select';
 if(k==='esc')return {...s,page:s.page==='algebra'?'main':'calc',selected:s.page==='algebra'?2:0};
 if(k==='menu')return {...s,page:'main',selected:0};
 if(MENUS[s.page]){
  if(k==='up'||k==='down')return {...s,selected:(s.selected+(k==='up'?-1:1)+MENUS[s.page].length)%MENUS[s.page].length};
  const i=confirm||k==='right'?s.selected:Number(k)-1;
  if(s.page==='main'&&i===2)return {...s,page:'algebra',selected:0};
  if(s.page==='algebra'&&i===1)return {...s,page:'setup',field:0,dim:'2',order:'x,y',setupReplace:true};
  return s;
 }
 const ch=/^[0-9xy]$/.test(k)?k:({neg:'-',minus:'-',plus:'+',dot:'.',eq:'=',equals:'=',mul:'*',div:'/',lparen:'(',rparen:')',comma:','})[k];
 if(s.page==='setup'){
  if(k==='tab'||k==='shift-tab'||k==='up'||k==='down'){s.field=(s.field+(k==='up'||k==='shift-tab'?3:1))%4;s.setupReplace=true;return s;}
  if(confirm){
   if(s.field===3)return {...s,page:'calc'};
   if(s.dim!=='2'||!order(s))return {...s,error:'This practice supports 2 equations and the variables x,y (or y,x).'};
   return {...s,page:'entry',field:0,rows:['',''],caret:0,last:null};
  }
  if(s.field>1)return s;
  const f=s.field===0?'dim':'order';
  if(k==='del'){s[f]=s.setupReplace?'':s[f].slice(0,-1);s.setupReplace=false;}
  if(ch&&(f==='dim'?/^\d$/:/^[xy,]$/).test(ch)){const v=(s.setupReplace?'':s[f])+ch;if(v.length<=8)s[f]=v;s.setupReplace=false;}
  return s;
 }
 if(s.page!=='entry')return s;
 if(k==='tab'||k==='shift-tab'||k==='up'||k==='down'){s.field=1-s.field;s.caret=s.rows[s.field].length;return s;}
 const raw=s.rows[s.field];
 if(k==='left'||k==='right'){s.caret=Math.min(raw.length,Math.max(0,s.caret+(k==='left'?-1:1)));return s;}
 if(confirm){
  try{
   const a=equation(s.rows[0]),b=equation(s.rows[1]); const result=solve(a,b);
   return {...s,page:'calc',last:{rows:[a.raw,b.raw],order:order(s),result}};
  }catch(e){return {...s,error:e.message};}
 }
 if(k==='del'&&s.caret>0){s.rows[s.field]=raw.slice(0,s.caret-1)+raw.slice(s.caret);s.caret--;return s;}
 if(ch&&ch!==','&&raw.length<60){s.rows[s.field]=raw.slice(0,s.caret)+ch+raw.slice(s.caret);s.caret++;}
 return s;
}
return Object.freeze({Q,qtext,disp,sameQ,equation,solve,sameSystem,link,answer,MENUS,base,load,key});
});
