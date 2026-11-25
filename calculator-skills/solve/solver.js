export const WATCH=Object.freeze({equation:'2^x=x+4', lower:2, upper:3, show:'2ˣ=x+4'});
export const TRY_CASES=Object.freeze({
 demo:{equation:'x^2=5',lower:'2',upper:'3',label:'Two roots · first search'},
 positive:{equation:'x^2=5',lower:'2',upper:'3',label:'Positive root'},
 negative:{equation:'x^2=5',lower:'-3',upper:'-2',label:'Negative root'}
});
const isNumber=t=>Boolean(t)&&/^\d+(?:\.\d*)?$|^\.\d+$/.test(t);
const allowedFuncs={sin:Math.sin,cos:Math.cos,exp:Math.exp};
function limit(v){if(!Number.isFinite(v))throw Error('This expression becomes too large or undefined in the interval. Try narrower bounds.');return v}
function constant(c){return {c,fn:()=>c}}
function combine(lhs,rhs,f){if(lhs.c!=null&&rhs.c!=null)return constant(limit(f(lhs.c,rhs.c)));return {c:null,fn:(x)=>limit(f(lhs.fn(x),rhs.fn(x)))}}
function normalize(s){
 if(/[0-9.]\s+[0-9.]/.test(s))throw Error('Do not put spaces inside a number.');
 return s.toLowerCase().replace(/\s+/g,'').replace(/−/g,'-').replace(/[×·]/g,'*').replace(/÷/g,'/').replace(/²/g,'^2').replace(/³/g,'^3');
}
function parse(str){
 const ts=str.match(/\d+(?:\.\d*)?|\.\d+|sin|cos|exp|pi|[e+x\-*/^()]/g)||[];
 if(!ts.length||ts.join('')!==str)throw Error('Use x, numbers, +, −, ×, ÷, ^, and parentheses. sin, cos and exp also work.');
 if(ts.some((t,i)=>i>0&&isNumber(t)&&isNumber(ts[i-1])))throw Error('Check the number format.');
 let pos=0, next=()=>ts[pos];
 function atom(){
    const t=ts[pos++];
    if(t==='('){let e=expr();if(ts[pos++]!==')')throw Error('Check the parentheses.');return e;}
    if(t==='x')return {c:null,fn:x=>x};
    if(t==='pi')return constant(Math.PI);if(t==='e')return constant(Math.E);
    if(isNumber(t))return constant(Number(t));
    if(Object.hasOwn(allowedFuncs,t)){
      if(ts[pos++]!=='(')throw Error('Use parentheses after '+t+'.');
      let e=expr();if(ts[pos++]!==')')throw Error('Check the parentheses.');
      const f=allowedFuncs[t];return e.c!=null?constant(limit(f(e.c))):{c:null,fn:x=>limit(f(e.fn(x)))};
    }
    throw Error('Check the equation. Example: x^2=5.');
 }
 function power(){
   const a=atom();if(next()!=='^')return a;
   pos++;const b=unary();
   if(a.c!=null&&b.c!=null)return constant(limit(a.c**b.c));
   const constantPositive=a.c!=null&&a.c>0;
   const wholePower=b.c!=null&&Number.isInteger(b.c)&&b.c>=0&&b.c<=32;
   if(!constantPositive&&!wholePower)throw Error('For a variable base, use a whole power from 0 to 32. Or use a positive base such as 2^x.');
   return combine(a,b,(l,r)=>l**r);
 }
 function unary(){
   if(next()==='+'){pos++;return unary()}
   if(next()==='-'){pos++;return combine(constant(0),unary(),(a,b)=>a-b)}
   return power();
 }
 function term(){
   let a=unary();
   while(pos<ts.length){
     let t=next();
     if(t==='*'){pos++;a=combine(a,unary(),(x,y)=>x*y)}
     else if(t==='/'){pos++;let b=unary();if(b.c==null||b.c===0)throw Error('The practice solver only divides by nonzero constants.');a=combine(a,b,(x,y)=>x/y)}
     else if(t==='x'||t==='('||t==='e'||t==='pi'||Object.hasOwn(allowedFuncs,t)){a=combine(a,unary(),(x,y)=>x*y)}
     else break;
   }return a;
 }
 function expr(){
   let a=term();
   while(next()==='+'||next()==='-'){const t=ts[pos++];a=combine(a,term(),(x,y)=>t==='+'?x+y:x-y)}
   return a
 }
 const res=expr();if(pos!==ts.length)throw Error('Check the expression and any parentheses.');
 return res;
}
export function parseEquation(raw){
 if(typeof raw!=='string'||raw.length>100)throw Error('Enter an equation of up to 100 characters.');
 const normal=normalize(raw), sides=normal.split('=');
 if(sides.length!==2||!sides[0]||!sides[1])throw Error('Use one equals sign, for example x^2=5.');
 if(!normal.includes('x'))throw Error('Include the variable x.');
 const l=parse(sides[0]),r=parse(sides[1]);
 return {equation:normal,l:l.fn,r:r.fn};
}
function evaluate(q,x){
 const l=limit(q.l(x)),r=limit(q.r(x));return {err:limit(l-r),scale:Math.max(Math.abs(l),Math.abs(r),Number.MIN_VALUE)};
}
function fmt(n,nDigits=6){return Object.is(n,-0)?'0':String(Number(n.toPrecision(nDigits)))}
function bracket(q,l,r,fl,fr){
 let best=Math.abs(fl.err)<Math.abs(fr.err)?l:r;
 for(let i=0;i<65;i++){
   const m=l+(r-l)/2, fm=evaluate(q,m);
   if(fm.err===0)return m;
   best=m;
   if(m===l||m===r)break;
   if(Math.sign(fm.err)===Math.sign(fl.err)){l=m;fl=fm}else{r=m;fr=fm}
 }
 return best;
}
export function solveInBounds(equation,lower,upper){
 if(!Number.isFinite(lower)||!Number.isFinite(upper)||lower>=upper)throw Error('Enter finite bounds, with the lower bound less than the upper bound.');
 if(Math.max(Math.abs(lower),Math.abs(upper))>1e6)throw Error('Keep both bounds between −1,000,000 and 1,000,000.');
 const q=parseEquation(equation);
 const N=640;
 let x0=lower,y0=evaluate(q,x0), firstZero=y0.err===0, testedNonzero=y0.err!==0, root=firstZero?x0:null;
 for(let j=1;j<=N;j++){
   const x1=j===N?upper:lower+(upper-lower)*(j/N),y1=evaluate(q,x1);
   if(y1.err!==0)testedNonzero=true;
   if(root===null){
     if(y1.err===0)root=x1;
     else if(y0.err!==0&&Math.sign(y0.err)!==Math.sign(y1.err))root=bracket(q,x0,x1,y0,y1);
   }
   if(root!==null&&testedNonzero)break;
   x0=x1;y0=y1;
 }
 if(root!==null&&!testedNonzero)throw Error('Both sides agree across the sampled interval. No single solution is isolated.');
 if(root===null)return {kind:'not-found',equation:q.equation};
 const e=evaluate(q,root);if(Math.abs(e.err)>5e-8*e.scale&&Math.abs(e.err)>1e-12*Math.max(1,Math.abs(root)))return {kind:'not-found',equation:q.equation};
 return {kind:'root',equation:q.equation,root,screen:fmt(root),rounded:root.toPrecision(3)};
}
