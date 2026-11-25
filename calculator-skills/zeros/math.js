(function(global){'use strict';

const clamp=(v,l,h)=>Math.max(l,Math.min(h,v));
const pretty=(n)=>n===0?'0':String(Number(n.toPrecision(6))).replace(/-/g,'−');
function displayExpr(v){return v.replace(/\^2/g,'²').replace(/\*/g,'·').replace(/-/g,'−')}
function parseQuadratic(raw){
  if(/[0-9.]\s+[0-9.]/.test(raw))throw Error('Check the number format: use no spaces within a number.');
  const str=raw.trim().toLowerCase().replace(/^[fy](?:[₁1]?\(x\))?\s*=\s*/,'').replace(/\s/g,'').replace(/−/g,'-').replace(/²/g,'^2').replace(/[×·]/g,'*').replace(/÷/g,'/');
  if(!str||str.length>80) throw Error('Enter a short quadratic in x.');
  const tokens=str.match(/\d+(?:\.\d*)?|\.\d+|[x()+\-*/^]/g)||[];
  if(tokens.join('')!==str)throw Error('Use numbers, x, parentheses and + − × ÷. Use ^2 to square.');
  if(tokens.some((v,i)=>i>0&&/^[0-9.]/.test(v)&&/^[0-9.]/.test(tokens[i-1])))throw Error('Check the number format.');
  let at=0;
  const atTok=()=>tokens[at];
  const c=(n)=>[n,0,0];
  function add(a,b,k=1){return a.map((v,i)=>v+k*b[i]);}
  function mul(a,b){
    let out=[0,0,0,0,0];
    a.forEach((v,i)=>b.forEach((w,j)=>out[i+j]+=v*w));
    if(out[3]||out[4])throw Error('Use a quadratic: no powers higher than x².');
    return out.slice(0,3);
  }
  function atom(){
    let t=tokens[at++];
    if(t==='('){let v=expr();if(tokens[at++]!==')')throw Error('Check the parentheses.');return v;}
    if(t==='x')return [0,1,0];
    if(t&&/^(?:\d|\.)/.test(t))return c(Number(t));
    throw Error('Check the expression. Example: 2(x−1)^2+3.');
  }
  function power(){
    let v=atom();
    if(atTok()==='^'){at++;let n=tokens[at++];if(n==='2')return mul(v,v);if(n==='1')return v;if(n==='0')return c(1);throw Error('The practice tool supports powers 0, 1 and 2.');}
    return v;
  }
  function unary(){if(atTok()==='-'){at++;return unary().map(v=>-v);}if(atTok()==='+'){at++;return unary()}return power()}
  function term(){
    let v=unary();
    while(at<tokens.length){
      const t=atTok();
      if(t==='*'){at++;v=mul(v,unary())}
      else if(t==='/'){at++;let q=unary();if(!q[0]||q[1]||q[2])throw Error('Only division by a nonzero constant is supported.');v=v.map(w=>w/q[0]);}
      else if(t==='('||t==='x'||/^(?:\d|\.)/.test(t)){v=mul(v,unary());}else break;
    }
    return v;
  }
  function expr(){
    let v=term();
    while(atTok()==='+'||atTok()==='-'){const t=tokens[at++];v=add(v,term(),t==='-'?-1:1);}
    return v;
  }
  const [c0,b,a]=expr();
  if(at!==tokens.length)throw Error('Check the expression and parentheses.');
  if(![a,b,c0].every(v=>Number.isFinite(v)&&Math.abs(v)<=1e6))throw Error('Use finite coefficients up to one million.');
  if(a!==0&&Math.abs(a)<1e-8||a===0&&Math.abs(b)<1e-8)throw Error('Use a non-constant line or a quadratic with coefficients of useful size.');
  if(a===0){const x=-c0/b;if(Math.abs(x)>1e5)throw Error('Use a function with the zero closer to the origin.');return {raw:str,a,b,c:c0,x,y:0,f:u=>b*u+c0};}
  const x=-b/(2*a), y=c0+b*x/2;
  if(!Number.isFinite(x)||!Number.isFinite(y)||Math.abs(x)>1e5||Math.abs(y)>1e7||Math.abs(a)>1e6)throw Error('Use smaller values so the graph can be displayed clearly.');
  return {raw:str,a,b,c:c0,x,y,f:(u)=>a*(u-x)**2+y};
}
function roots(q){
  if(q.a===0)return [{x:q.x,touch:false}];
  const D=q.b*q.b-4*q.a*q.c;
  const near=4*Number.EPSILON*(Math.abs(q.b*q.b)+Math.abs(4*q.a*q.c));
  if(D< -near)return [];
  if(Math.abs(D)<=near)return[{x:-q.b/(2*q.a),touch:true}];
  const s=-.5*(q.b+(q.b<0?-1:1)*Math.sqrt(D));
  return [s/q.a,q.c/s].sort((a,b)=>a-b).map(x=>({x:Object.is(x,-0)?0:x,touch:false}));
}
function windowFor(q){
  if(!q)return{x0:-4,x1:8,y0:-4,y1:8};
  const zs=roots(q).map(r=>r.x),center=q.x;
  const h=Math.max(3.5,Math.ceil(Math.max(0,...zs.map(x=>Math.abs(x-center)))*1.22));
  const x0=center-h,x1=center+h;
  const ys=[q.f(x0),q.f(x1),q.f(center),0],lo=Math.min(...ys),hi=Math.max(...ys),d=Math.max(hi-lo,1);
  // Zoom vertically around two shallow crossings so both remain legible on a phone.
  if(zs.length===2&&q.y!==0){
    const close=Math.abs(q.y),range=Math.max(0.02,Math.min(d*1.08,close*8));
    const edge=Math.max(0.015,close*1.8);
    return{x0,x1,y0:q.a>0?-edge:-range,y1:q.a>0?range:edge};
  }
  return{x0,x1,y0:lo-d*.22,y1:hi+d*.08};
}
function zero(q,lo,hi){
  if(!q||!Number.isFinite(lo)||!Number.isFinite(hi)||lo>=hi)return{ok:false,message:'Set an upper bound to the right of the lower bound.'};
  const all=roots(q),list=all.filter(r=>lo<r.x&&r.x<hi);
  if(list.length>1)return{ok:false,message:'Two zeros lie between the bounds. Choose an interval with only one crossing.'};
  if(list.length===1&&list[0].touch)return{ok:false,message:'This graph touches the axis. This lesson practices crossings only.'};
  if(all.some(r=>r.x===lo||r.x===hi))return{ok:false,message:'A bound sits on a zero. Put the bounds on opposite sides instead.'};
  if(!list.length)return{ok:false,message:'No crossing lies inside those bounds. Look for where the curve crosses the x-axis.'};
  return{ok:true,x:list[0].x,y:0};
}
global.CT10Math=Object.freeze({parse:parseQuadratic,roots,windowFor,zero,pretty,displayExpr,clamp});
})(typeof module==='object'&&module.exports?module.exports:globalThis);
