(function(global){'use strict';

const clamp=(v,l,h)=>Math.max(l,Math.min(h,v));
const pretty=(n)=>n===0?'0':String(Number(n.toPrecision(6))).replace(/-/g,'−');
function displayExpr(v){return v.replace(/\^2/g,'²').replace(/\^3/g,'³').replace(/\*/g,'·').replace(/-/g,'−')}
function parse(raw){
  if(typeof raw!=='string'||raw.length>80)throw Error('Enter a function of up to 80 characters.');
  if(/[0-9.]\s+[0-9.]/.test(raw))throw Error('Check the number format: use no spaces within a number.');
  const str=raw.trim().toLowerCase().replace(/^[fy](?:[₁₂12]?\(x\))?\s*=\s*/,'').replace(/\s/g,'').replace(/−/g,'-').replace(/²/g,'^2').replace(/³/g,'^3').replace(/[×·]/g,'*').replace(/÷/g,'/');
  if(!str||str.length>80) throw Error('Enter a constant, line, quadratic or cubic in x.');
  const tokens=str.match(/\d+(?:\.\d*)?|\.\d+|[x()+\-*/^]/g)||[];
  if(tokens.join('')!==str)throw Error('Use numbers, x, parentheses and + − × ÷. Use ^2 to square or ^3 to cube.');
  if(tokens.some((v,i)=>i>0&&/^[0-9.]/.test(v)&&/^[0-9.]/.test(tokens[i-1])))throw Error('Check the number format.');
  let at=0;
  const atTok=()=>tokens[at];
  const c=(n)=>[n,0,0,0];
  function add(a,b,k=1){return a.map((v,i)=>v+k*b[i]);}
  function mul(a,b){
    let out=Array(7).fill(0);
    a.forEach((v,i)=>b.forEach((w,j)=>out[i+j]+=v*w));
    if(out.slice(4).some(Boolean))throw Error('Use a polynomial of degree three or lower.');
    return out.slice(0,4);
  }
  function atom(){
    let t=tokens[at++];
    if(t==='('){let v=expr();if(tokens[at++]!==')')throw Error('Check the parentheses.');return v;}
    if(t==='x')return [0,1,0,0];
    if(t&&/^(?:\d|\.)/.test(t))return c(Number(t));
    throw Error('Check the expression. Example: 2(x−1)^2+3.');
  }
  function power(){
    let v=atom();
    if(atTok()==='^'){at++;let n=tokens[at++];if(n==='3')return mul(mul(v,v),v);if(n==='2')return mul(v,v);if(n==='1')return v;if(n==='0')return c(1);throw Error('The practice tool supports powers 0, 1, 2 and 3.');}
    return v;
  }
  function unary(){if(atTok()==='-'){at++;return unary().map(v=>-v);}if(atTok()==='+'){at++;return unary()}return power()}
  function term(){
    let v=unary();
    while(at<tokens.length){
      const t=atTok();
      if(t==='*'){at++;v=mul(v,unary())}
      else if(t==='/'){at++;let q=unary();if(!q[0]||q.slice(1).some(Boolean))throw Error('Only division by a nonzero constant is supported.');v=v.map(w=>w/q[0]);}
      else if(t==='('||t==='x'||/^(?:\d|\.)/.test(t)){v=mul(v,unary());}else break;
    }
    return v;
  }
  function expr(){
    let v=term();
    while(atTok()==='+'||atTok()==='-'){const t=tokens[at++];v=add(v,term(),t==='-'?-1:1);}
    return v;
  }
  const [c0,b,a,d]=expr();
  if(at!==tokens.length)throw Error('Check the expression and parentheses.');
  if(![d,a,b,c0].every(v=>Number.isFinite(v)&&Math.abs(v)<=1e6))throw Error('Use finite coefficients up to one million.');

  return Object.freeze({raw:str,d,a,b,c:c0,f:x=>((d*x+a)*x+b)*x+c0});
}
function readNumber(v){
 if(typeof v!=="string"||!(/^[+−-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:e[+−-]?\d+)?$/i.test(v.trim())))return NaN;
 return Number(v.trim().replaceAll("−","-").replace(",","."));
}
function interval(lo,hi){
 if(!Number.isFinite(lo)||!Number.isFinite(hi)||lo>=hi||Math.max(Math.abs(lo),Math.abs(hi))>100||hi-lo<.01)
  throw Error("Use increasing endpoints between −100 and 100, separated by at least 0.01.");
 return [lo,hi];
}
function turningPoints(q){
 if(!q)return[];
 const {d,a,b}=q;
 if(d===0)return a===0?[]:[{x:-b/(2*a),type:a<0?"max":"min"}];
 const A=3*d,B=2*a,C=b,D=B*B-4*A*C;
 if(D<=0)return[]; // An equal derivative root is a horizontal inflection, not an extremum.
 const root=Math.sqrt(D), h=-.5*(B+(B<0?-1:1)*root);
 const out=[h/A,C/h].sort((a,b)=>a-b);
 return out.map((x,i)=>({x:Object.is(x,-0)?0:x,type:i===0?(d>0?"max":"min"):(d>0?"min":"max")}));
}
const candidate=(q,x,kind)=>({x:Object.is(x,-0)?0:x,y:q.f(x),kind});
function peak(q,lo,hi){
 if(!(Number.isFinite(lo)&&Number.isFinite(hi)&&lo<hi))return {message:"The upper bound must be to the right of the lower bound."};
 const pts=turningPoints(q).filter(p=>p.type==="max");
 const close=(a,b)=>Math.abs(a-b)<=8*Number.EPSILON*Math.max(Number.MIN_VALUE,Math.abs(a),Math.abs(b));
 if(pts.some(p=>close(p.x,lo)||close(p.x,hi)))return {message:"A bound is on the peak. Set one bound on each side."};
 const reach=pts.find(p=>p.x>lo&&p.x<hi);
 return reach?{mark:candidate(q,reach.x,"peak")}:{message:"No local peak lies inside these bounds. For a closed interval, still check both endpoints."};
}
function compare(q,allowed){
 const [lo,hi]=interval(...allowed);
 const ends=[candidate(q,lo,"left"),candidate(q,hi,"right")];
 const stationary=turningPoints(q).filter(p=>p.type==="max"&&p.x>lo&&p.x<hi).map(p=>candidate(q,p.x,"peak"));
 const candidates=[ends[0],...stationary,ends[1]], maxY=Math.max(...candidates.map(x=>x.y));
 const equal=(a,b)=>Math.abs(a-b)<=8*Number.EPSILON*Math.max(Math.abs(a),Math.abs(b),Number.MIN_VALUE);
 const winners=candidates.filter(x=>equal(x.y,maxY));
 return {candidates,winners,maxY,flat:q.d===0&&q.a===0&&q.b===0};
}
function windowFor(q,allowed){
 const [min,max]=allowed||[-4,4], pad=Math.max((max-min)*.14,.006);
 const x0=min-pad,x1=max+pad;
 if(!q)return {x0,x1,y0:-5,y1:9};
 const ys=[x0,x1,min,max,...turningPoints(q).map(p=>p.x).filter(x=>x>x0&&x<x1)].map(x=>q.f(x));
 const lo=Math.min(...ys),hi=Math.max(...ys),yPad=Math.max(.25,(hi-lo)*.12);
 return {x0,x1,y0:lo-yPad,y1:hi+yPad};
}
function matches(value,goal){
 if(!Number.isFinite(value))return false;
 return Array.from({length:15},(_,i)=>Number(goal.toPrecision(i+3))).some(n=>n===0?value===0:Math.abs(value-n)<=1e-10*Math.abs(n));
}
global.CT12MaxMath=Object.freeze({parse,readNumber,interval,turningPoints,peak,compare,windowFor,pretty,displayExpr,clamp,matches});
})(typeof module==='object'&&module.exports?module.exports:globalThis);
