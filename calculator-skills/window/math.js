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
      else if(t==='/'){at++;let q=unary();if(/^(?:x|\(|\d|\.)/.test(atTok()||''))throw Error('Use parentheses or an explicit multiplication after division.');if(!q[0]||q[1]||q[2])throw Error('Only division by a nonzero constant is supported.');v=v.map(w=>w/q[0]);}
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
  if(a===0)throw Error('Enter a quadratic in x; a straight line has no vertex.');
  const x=(-b/(2*a))||0, y=(c0+b*x/2)||0;
  if(!Number.isFinite(x)||!Number.isFinite(y)||Math.abs(x)>1e5||Math.abs(y)>1e7||Math.abs(a)>1e6)throw Error('Use smaller values so the graph can be displayed clearly.');
  return {raw:str,a,b,c:c0,x,y,f:(u)=>a*(u-x)**2+y};
}
const standard=Object.freeze({x0:-10,x1:10,xs:'Auto',y0:-20/3,y1:20/3,ys:'Auto'});
const fields=['x0','x1','xs','y0','y1','ys'];
const names=['XMin','XMax','XScale','YMin','YMax','YScale'];
const rawBounds=box=>fields.map(k=>typeof box[k]==='number'?String(+box[k].toPrecision(13)):box[k]);
function readValue(text,scale){
  const raw=String(text).trim().replace(/−/g,'-');
  if(scale&&/^auto$/i.test(raw))return 'Auto';
  const match=raw.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))(?:\/([+-]?(?:\d+(?:\.\d*)?|\.\d+)))?$/);
  if(!match) return NaN;
  return match[2]===undefined?Number(match[1]):Number(match[1])/Number(match[2]);
}
function apply(raw){
 const next={};
 for(let i=0;i<fields.length;i++){
  const k=fields[i],scale=k.endsWith('s'),v=readValue(raw[i],scale);
  if(v==='Auto'){next[k]=v;continue;}
  if(!Number.isFinite(v)||Math.abs(v)>1e9)return {field:i,error:names[i]+': enter a finite decimal or fraction'+(scale?', or Auto.':'.')};
  if(scale&&v<=0)return {field:i,error:names[i]+' must be positive or Auto.'};
  next[k]=v;
 }
 if(next.x1<=next.x0)return {field:1,error:'XMax must be greater than XMin.'};
 if(next.y1<=next.y0)return {field:4,error:'YMax must be greater than YMin.'};
 if(next.x1-next.x0<1e-7)return {field:1,error:'The horizontal span is smaller than this practice viewer supports.'};
 if(next.y1-next.y0<1e-7)return {field:4,error:'The vertical span is smaller than this practice viewer supports.'};
 return {bounds:next};
}
function assess(q,w){
 const {x,y}=q,dx=w.x1-w.x0,dy=w.y1-w.y0;
 if(!q.a)return {good:false,limit:'graph',message:'The exercise needs a quadratic with a vertex.'};
 if(x<=w.x0||x>=w.x1)return {good:false,limit:'x',message:'The vertex is outside or on the edge of your horizontal window.'};
 if(y<=w.y0||y>=w.y1)return {good:false,limit:'y',message:'The vertex is outside or on the edge of your vertical window.'};
 const span=Math.min(x-w.x0,w.x1-x);
 if(span<.10*dx)return {good:false,limit:'x',message:'The vertex is too close to a side. Leave room on both sides.'};
 if(Math.min(y-w.y0,w.y1-y)<.10*dy)return {good:false,limit:'y',message:'The vertex is too close to a vertical edge. Leave more vertical space.'};
 const turn=q.f(x+span*.6);
 if(Math.abs(turn-y)<.10*dy)return {good:false,limit:'y',message:'The curve looks almost flat here. Tighten the vertical range.'};
 if(turn<=w.y0||turn>=w.y1)return {good:false,limit:'y',message:'The arms leave the screen too quickly. Widen the vertical range or narrow the horizontal range.'};
 return {good:true,message:'That works: the vertex sits inside both ranges with space to see both arms.'};
}
global.CT08Math=Object.freeze({parse:parseQuadratic,pretty,displayExpr,clamp,standard,rawBounds,fields,names,readValue,apply,assess});
})(typeof module==='object'&&module.exports?module.exports:globalThis);
