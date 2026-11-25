export const EXAMPLE='x^2-6x+13';
export const clamp=(v,l,h)=>Math.max(l,Math.min(h,v));
export const pretty=(n)=>Math.abs(n)<1e-9?'0':String(Number(n.toPrecision(6))).replace(/-/g,'−');
export function displayExpr(v){return v.replace(/\^2/g,'²').replace(/\*/g,'·').replace(/-/g,'−')}
export function parseQuadratic(raw){
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
  if(!Number.isFinite(a)||!Number.isFinite(b)||!Number.isFinite(c0)||Math.abs(a)<1e-8)throw Error('Use a quadratic with a nonzero coefficient of x².');
  const x=-b/(2*a), y=c0+b*x/2;
  if(!Number.isFinite(x)||!Number.isFinite(y)||Math.abs(x)>1e5||Math.abs(y)>1e7||Math.abs(a)>1e6)throw Error('Use smaller values so the graph can be displayed clearly.');
  return {raw:str,a,b,c:c0,x,y,f:(u)=>a*(u-x)**2+y};
}
export function parseGraph(raw){
  try{return parseQuadratic(raw)}catch(quadraticError){
    const api=window.TIGraphGeneral;
    if(!api)throw quadraticError;
    const expression=String(raw).trim().replace(/^[fy](?:[₁1]?\(x\))?\s*=\s*/i,'');
    const model=api.parse(expression);
    const win=api.prepareWindow(model);
    const segments=api.sampleCurve(model,win,340);
    return {raw:expression,general:model,f:model.evaluate,x:(win.x0+win.x1)/2,y:null,window:{...win,h:(win.x1-win.x0)/2},segments};
  }
}
export function windowFor(q){
  if(q?.general)return q.window;
  if(!q)return {x0:-10,x1:10,y0:-7,y1:7,h:2};
  let h=Math.abs(q.x)<=4?5:Math.max(1,Math.min(Math.abs(q.x)*.25,20));
  let d=Math.max(Math.abs(q.a)*h*h*.48,3);
  let y0=q.y-d*(q.a>0?.38:1),y1=q.y+d*(q.a>0?1:.38);
  if(y0>0&&y0<.12*d)y0=-.07*d;
  if(y1<0&&-y1<.12*d)y1=.07*d;
  return {x0:q.x-h,x1:q.x+h,y0,y1,h};
}
export function graphMinimum(q,lo,hi){
  if(q?.general){
    const out=window.TIGraphGeneral.findBoundedMinimum(q.general,lo,hi);
    return out.ok?{ok:true,...out.minimum}:{ok:false,message:out.message};
  }
  if(!Number.isFinite(lo)||!Number.isFinite(hi)||lo>=hi)return {ok:false,message:'The upper bound must be greater than the lower bound.'};
  if(q.a<0)return {ok:false,message:'This parabola opens downward. Its turning point is a maximum, so this tool has no interior minimum to mark.'};
  if(!(lo<q.x&&q.x<hi))return {ok:false,message:'No turning-point minimum is inside these bounds. Try a lower bound left of the valley and an upper bound right of it.'};
  return {ok:true,x:q.x,y:q.y};
}
