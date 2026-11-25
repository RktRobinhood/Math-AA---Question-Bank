(function(global){'use strict';

const clamp=(v,l,h)=>Math.max(l,Math.min(h,v));
const pretty=(n)=>n===0?'0':String(Number(n.toPrecision(6))).replace(/-/g,'−');
function displayExpr(v){return v.replace(/\^2/g,'²').replace(/\*/g,'·').replace(/-/g,'−')}
function parse(raw){
  if(typeof raw!=='string'||raw.length>80)throw Error('Enter a function of up to 80 characters.');
  if(/[0-9.]\s+[0-9.]/.test(raw))throw Error('Check the number format: use no spaces within a number.');
  const str=raw.trim().toLowerCase().replace(/^[fy](?:[₁₂12]?\(x\))?\s*=\s*/,'').replace(/\s/g,'').replace(/−/g,'-').replace(/²/g,'^2').replace(/[×·]/g,'*').replace(/÷/g,'/');
  if(!str||str.length>80) throw Error('Enter a constant, line or quadratic in x.');
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

  return Object.freeze({raw:str,a,b,c:c0,f:x=>(a*x+b)*x+c0});
}
function crossings(q){
 if(!q||q.length!==2||q.some(p=>!p))return{kind:"incomplete",points:[]};
 const [f,g]=q,a=f.a-g.a,b=f.b-g.b,c=f.c-g.c;
 if(a===0&&b===0)return{kind:c===0?"identical":"none",points:[]};
 let xs=[],touch=false;
 if(a===0)xs=[-c/b];
 else{
  const D=b*b-4*a*c,near=4*Number.EPSILON*(Math.abs(b*b)+Math.abs(4*a*c));
  if(D< -near)return{kind:"none",points:[]};
  if(Math.abs(D)<=near){xs=[-b/(2*a)];touch=true;}
  else{const p=-.5*(b+(b<0?-1:1)*Math.sqrt(D));xs=[p/a,c/p].sort((x,y)=>x-y);}
 }
 const points=xs.map(x=>({x:Object.is(x,-0)?0:x,y:f.f(x),touch}));
 if(points.some(({x,y})=>!Number.isFinite(x)||!Number.isFinite(y)||Math.abs(x)>1e5||Math.abs(y)>1e9))return{kind:"out-of-range",points:[]};
 return{kind:touch?"touch":"cross",points};
}
function windowFor(q){
 const basis={x0:-5,x1:7,y0:-5,y1:15}, xs=crossings(q).points.map(v=>v.x);
 if(!xs.length)return basis;
 const lo=xs[0],hi=xs.at(-1),mid=(lo+hi)/2,half=Math.max(4,(hi-lo)*.8);
 const x0=mid-half,x1=mid+half;
 const ys=q.flatMap(p=>{
  const x=p.a!==0?-p.b/(2*p.a):Infinity;
  return [x0,x1,mid,...xs,...(x>x0&&x<x1?[x]:[])].map(n=>p.f(n));
 });
 // Show both intersections, then spend most vertical range around the two curves.
 const low=Math.min(...ys),high=Math.max(...ys),span=Math.max(.02,high-low);
 return{x0,x1,y0:low-span*.09,y1:high+span*.09};
}
function solve(q,l,h){
 if(!Number.isFinite(l)||!Number.isFinite(h)||l>=h)return{ok:false,message:"Set the upper bound to the right of the lower bound."};
 const {kind,points}=crossings(q);
 if(kind==="identical")return{ok:false,message:"The graphs coincide. There is no isolated intersection to mark."};
 if(kind==="out-of-range")return{ok:false,message:"The intersections are outside this simulator’s numerical display range."};
 const near=(x,y)=>Math.abs(x-y)<=Math.max(Math.abs(x),Math.abs(y))*Number.EPSILON*4;
 if(points.some(p=>near(p.x,l)||near(p.x,h)))return{ok:false,message:"A bound is on an intersection. Put the bounds on either side."};
 const inside=points.filter(p=>p.x>l&&p.x<h);
 if(inside.length>1)return{ok:false,message:"Two crossings lie inside the bounds. Bracket only one."};
 if(inside[0]?.touch)return{ok:false,message:"These graphs touch without crossing. This lesson practices crossings only."};
 if(!inside.length)return{ok:false,message:"No crossing lies inside these bounds."};
 return{ok:true,...inside[0]};
}
global.CT11Math=Object.freeze({parse,crossings,windowFor,solve,pretty,displayExpr,clamp});
})(typeof module==='object'&&module.exports?module.exports:globalThis);
