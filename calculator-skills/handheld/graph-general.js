/* Standalone, bounded educational graph engine. No eval, external state, or DOM. */
(function(global){
  'use strict';
  const TAU=2*Math.PI, MAX_SOURCE=128, MAX_TOKENS=96, MAX_DEPTH=28, MAX_X=1e5, MAX_SAMPLES=4096;
  const arity={sin:[1],cos:[1],tan:[1],ln:[1],log:[1,2],exp:[1],sqrt:[1],abs:[1]};
  const bodyByModel=new WeakMap();
  const isDigit=c=>c!==undefined&&/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/.test(c);
  const finite=Number.isFinite;
  function normalize(raw){
    if(typeof raw!=='string'||!raw.trim()||raw.length>MAX_SOURCE)throw Error('Enter a function of up to '+MAX_SOURCE+' characters.');
    if(/[0-9.]\s+[0-9.]/.test(raw))throw Error('Do not put spaces inside a number.');
    return raw.toLowerCase().trim().replace(/^(?:[fy](?:[1₁]?\s*\(\s*x\s*\))?)\s*=\s*/,'')
      .replace(/[−–]/g,'-').replace(/[×·]/g,'*').replace(/÷/g,'/').replace(/π/g,'pi')
      .replace(/√\s*\(/g,'sqrt(').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g,s=>'^'+[...s].map(c=>'⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)).join(''))
      .replace(/\s+/g,'');
  }
  function parse(raw,options={}){
    const s=normalize(raw), tokens=s.match(/(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|sqrt|sin|cos|tan|log|exp|abs|ln|pi|[x(),+\-*/^e]/g)||[];
    if(!tokens.length||tokens.length>MAX_TOKENS)throw Error('Use a shorter function.');
    if(tokens.join('')!==s)throw Error('Use x, numbers, parentheses, powers, or sin, cos, tan, ln, log, exp, sqrt and abs.');
    if(tokens.some((t,i)=>i>0&&isDigit(t)&&isDigit(tokens[i-1])))throw Error('Check the number format.');
    let k=0, d=0;const next=()=>tokens[k];
    const node=(o,a,b)=>({o,a,b});
    function descend(f){if(++d>MAX_DEPTH)throw Error('Use fewer nested operations.');const v=f();d--;return v;}
    function atom(){
      const t=tokens[k++];
      if(t==='('){const a=descend(expression);if(tokens[k++]!==')')throw Error('Check your closing parentheses.');return a}
      if(t==='x')return node('x');
      if(t==='pi'||t==='e'||isDigit(t)){const v=t==='pi'?Math.PI:t==='e'?Math.E:Number(t);if(!finite(v))throw Error('Enter a finite number.');return node('c',v)}
      if(Object.hasOwn(arity,t)){
        if(tokens[k++]!=='(')throw Error('Put the argument to '+t+' in parentheses.');
        const a=descend(expression);let b;
        if(next()===','){k++;b=descend(expression)}
        if(tokens[k++]!==')'||!arity[t].includes(b?2:1))throw Error('Check the arguments and parentheses for '+t+'.');
        return node(t,a,b);
      }
      throw Error('Expected a number, x, or a function. Example: x²+sin(x).');
    }
    function power(){const n=atom();if(next()==='^'){k++;return node('^',n,descend(unary))}return n}
    function unary(){if(next()==='-'){k++;return node('neg',descend(unary))}if(next()==='+'){k++;return descend(unary)}return power()}
    function term(){
      let n=unary();
      while(k<tokens.length){const op=next();
        if(op==='*'||op==='/'){k++;n=node(op,n,unary())}
        else if(op==='x'||op==='('||op==='pi'||op==='e'||Object.hasOwn(arity,op)){n=node('*',n,unary())}
        else break;
      }return n;
    }
    function expression(){
      let n=term();
      while(next()==='+'||next()==='-'){const op=tokens[k++];n=node(op,n,term())}
      return n;
    }
    const root=expression();if(k!==tokens.length)throw Error('Check the function and its parentheses.');
    const unit=String(options.angle||options.mode||'RAD').toUpperCase()==='DEG'?Math.PI/180:1;
    const model=Object.freeze({source:raw.trim(),expression:s,angle:unit===1?'RAD':'DEG',evaluate:(x)=>finite(x)&&Math.abs(x)<=MAX_X?evalNode(root,x,unit):NaN});
    bodyByModel.set(model,{root,unit});return model;
  }
  function evalNode(n,x,u){
    if(n.o==='x')return x;if(n.o==='c')return n.a;
    const a=evalNode(n.a,x,u),b=n.b?evalNode(n.b,x,u):0;
    if(!finite(a)||(n.b&&!finite(b)))return NaN;
    let r;
    switch(n.o){
      case '+':r=a+b;break;case '-':r=a-b;break;case '*':r=a*b;break;case '/':r=b===0?NaN:a/b;break;
      case '^':r=a**b;break;case 'neg':r=-a;break;
      case 'sin':r=Math.sin(a*u);break;case 'cos':r=Math.cos(a*u);break;
      case 'tan':{const v=a*u;r=Math.abs(Math.cos(v))<=1e-13?NaN:Math.tan(v);break}
      case 'ln':r=a>0?Math.log(a):NaN;break;
      case 'log':r=a>0?(n.b?b>0&&b!==1?Math.log(a)/Math.log(b):NaN:Math.log10(a)):NaN;break;
      case 'exp':r=Math.exp(a);break;case 'sqrt':r=Math.sqrt(a);break;case 'abs':r=Math.abs(a);break;
      default:return NaN;
    }return finite(r)?r:NaN;
  }
  function quant(a,b,i,period){
    const tol=Math.max(1,Math.abs(a),Math.abs(b))*Number.EPSILON*6;
    return Math.ceil((a-i-tol)/period)<=Math.floor((b-i+tol)/period);
  }
  function shape(a,b,fn,peak,trough){
    if(b-a>=TAU)return[-1,1];
    const l=fn(a),h=fn(b);
    return [quant(a,b,trough,TAU)?-1:Math.min(l,h),quant(a,b,peak,TAU)?1:Math.max(l,h)];
  }
  function contains(a,b,x){return a<=x&&x<=b}
  function interval(n,min,max,u){
    const box=(lo,hi,osc=0)=>finite(lo)&&finite(hi)?{lo,hi,osc}:null;
    if(n.o==='x')return box(min,max);
    if(n.o==='c')return box(n.a,n.a);
    const a=interval(n.a,min,max,u),b=n.b?interval(n.b,min,max,u):null;
    if(!a||(n.b&&!b))return null;
    const p=a.lo,q=a.hi,r=b?.lo??0,s=b?.hi??0,w=a.osc+(b?.osc||0);
    const ext=(values)=>box(Math.min(...values),Math.max(...values),w);
    switch(n.o){
      case '+':return box(p+r,q+s,w);
      case '-':return box(p-s,q-r,w);
      case '*':return ext([p*r,p*s,q*r,q*s]);
      case '/':return contains(r,s,0)?null:ext([p/r,p/s,q/r,q/s]);
      case '^':{
        if(r===s){
          if(r===0)return box(1,1,w);
          if(p<0&&!Number.isInteger(r)||contains(p,q,0)&&r<0)return null;
          const l=p**r,h=q**r;
          return ext(contains(p,q,0)?[l,h,0]:[l,h]);
        }
        if(p<=0)return null;
        return ext([p**r,p**s,q**r,q**s]);
      }
      case 'neg':return box(-q,-p,w);
      case 'sin':{const z=shape(p*u,q*u,Math.sin,Math.PI/2,-Math.PI/2);return box(z[0],z[1],w+(q-p)*u/TAU)}
      case 'cos':{const z=shape(p*u,q*u,Math.cos,0,Math.PI);return box(z[0],z[1],w+(q-p)*u/TAU)}
      case 'tan':{return quant(p*u,q*u,Math.PI/2,Math.PI)?null:box(Math.tan(p*u),Math.tan(q*u),w+(q-p)*u/Math.PI)}
      case 'ln':return p>0?box(Math.log(p),Math.log(q),w):null;
      case 'log':{
        if(p<=0)return null;
        if(!b)return box(Math.log10(p),Math.log10(q),w);
        if(r<=0||contains(r,s,1))return null;
        return ext([Math.log(p)/Math.log(r),Math.log(q)/Math.log(r),Math.log(p)/Math.log(s),Math.log(q)/Math.log(s)]);
      }
      case 'sqrt':return p>=0?box(Math.sqrt(p),Math.sqrt(q),w):null;
      case 'exp':return box(Math.exp(p),Math.exp(q),w);
      case 'abs':return ext(contains(p,q,0)?[Math.abs(p),Math.abs(q),0]:[Math.abs(p),Math.abs(q)]);
      default:return null;
    }
  }
  function getModel(x){if(typeof x==='string')return parse(x);if(!bodyByModel.has(x))throw Error('Enter a supported function first.');return x;}
  function checkedRange(lo,hi){
    if(!finite(lo)||!finite(hi)||lo>=hi||Math.abs(lo)>MAX_X||Math.abs(hi)>MAX_X)throw Error('Enter two increasing finite bounds between −100,000 and 100,000.');
    if(hi-lo<1e-10*Math.max(1,Math.abs(lo),Math.abs(hi)))throw Error('The bounds are too close for this display.');
  }
  function certify(model,min,max){
    const {root,unit}=bodyByModel.get(model);
    const stack=[[min,max,0]];
    let effort=0,osc=0;
    while(stack.length){
      if(++effort>1180)return{ok:false,osc};
      const [a,b,d]=stack.pop(), i=interval(root,a,b,unit);
      if(i){osc+=i.osc;continue}
      const mid=a+(b-a)/2;
      if(d>=17||!finite(model.evaluate(a))||!finite(model.evaluate(mid))||!finite(model.evaluate(b)))return{ok:false,osc};
      stack.push([a,mid,d+1],[mid,b,d+1]);
    }
    return{ok:true,osc};
  }
  function prepareWindow(input,o={}){
    const model=getModel(input), span=o.lower!=null||o.upper!=null||o.x0!=null||o.x1!=null;
    const scope=span?[[o.lower??o.x0,o.upper??o.x1]]:[[-10,10],[-100,100],[-1000,1000],[-10000,10000],[-MAX_X,MAX_X]];
    let chosen,ys;
    for(const [a,b] of scope){
      checkedRange(a,b);
      const list=[];
      for(let i=0;i<=240;i++){const y=model.evaluate(a+(b-a)*i/240);if(finite(y))list.push(y)}
      if(list.length>5){chosen=[a,b];ys=list;break}
    }
    if(!chosen)throw Error('No plottable section was found in this preview window. Use bounds where the function is defined.');
    ys.sort((a,b)=>a-b);
    let y0=ys[Math.floor((ys.length-1)*.04)],y1=ys[Math.ceil((ys.length-1)*.96)];
    const floor=Math.max(1,Math.min(1e12,Math.abs(y0)),Math.min(1e12,Math.abs(y1)))*1e-7;
    if(y1-y0<floor){y0-=Math.max(floor,1);y1+=Math.max(floor,1)}
    else {const dy=Math.min(1e300,(y1-y0)*.12);y0-=dy;y1+=dy;}
    y0=Math.max(-1e300,y0);y1=Math.min(1e300,y1);
    if(!(y0<y1)||!finite(y0)||!finite(y1))throw Error('The function values are too large for this graph window. Choose a narrower section.');
    const [x0,x1]=chosen;
    return{x0,x1,y0,y1,xMin:x0,xMax:x1,yMin:y0,yMax:y1,sampledFinite:ys.length,angle:model.angle};
  }
  function sampleCurve(input,win,n=300){
    const model=getModel(input);
    const a=win.x0??win.xMin,b=win.x1??win.xMax;checkedRange(a,b);
    n=Math.max(32,Math.min(960,Math.floor(n)||300));
    let output=[],segment=[],old;
    for(let i=0;i<=n;i++){
      const x=a+(b-a)*i/n,y=model.evaluate(x);
      if(!finite(y)||old&&!certify(model,old.x,x).ok){if(segment.length>1)output.push(segment);segment=[];}
      if(finite(y))segment.push({x,y});
      old=finite(y)?{x,y}:null;
    }
    if(segment.length>1)output.push(segment);return output;
  }
  function refine(f,a,b){
    const gr=(Math.sqrt(5)-1)/2;
    let l=b-(b-a)*gr,r=a+(b-a)*gr,vl=f(l),vr=f(r);
    for(let j=0;j<76&&b-a>1e-13*Math.max(1,Math.abs(a),Math.abs(b));j++){
      if(vl<=vr){b=r;r=l;vr=vl;l=b-(b-a)*gr;vl=f(l)}
      else{a=l;l=r;vl=vr;r=a+(b-a)*gr;vr=f(r)}
    }
    const m=a+(b-a)/2;
    return{x:m,y:f(m)};
  }
  function findBoundedMinimum(input,lo,hi){
    const result=(kind,candidates,message)=>({kind,ok:kind==='minimum',candidates,minimum:kind==='minimum'?candidates[0]:null,message});
    let model;
    try{checkedRange(lo,hi);model=getModel(input)}catch(e){return result('invalid',[],e.message)}
    const proof=certify(model,lo,hi);
    if(!proof.ok)return result('discontinuous',[],'The function may be undefined, discontinuous or too large in this interval. Choose bounds around one continuous valley.');
    if(proof.osc>140)return result('ambiguous',[],'This interval oscillates too quickly to check reliably. Zoom in and bracket one valley.');
    const n=Math.min(MAX_SAMPLES,Math.max(768,Math.ceil(proof.osc*24)));
    const f=model.evaluate, w=(hi-lo)/n, vals=new Array(n+1);
    for(let i=0;i<=n;i++){
      vals[i]=f(i===n?hi:lo+w*i);
      if(!finite(vals[i]))return result('discontinuous',[],'Some values in these bounds are undefined. Use a continuous section of the graph.');
    }
    const candidates=[];
    let last=-4;
    for(let i=1;i<n;i++){
      if(i-last<2)continue;
      const a=vals[i-1],b=vals[i],c=vals[i+1];
      // Exact floating-point plateaus, when short, may straddle a turning point.
      if(!(b<=a&&b<=c&&(b<a||b<c)))continue;
      let j=i;
      while(j+1<n&&vals[j+1]===b&&j-i<=5)j++;
      if(j-i>5||vals[j+1]<=b)continue;
      const left=lo+w*(i-1),right=lo+w*(j+1);
      const p=refine(f,left,right);
      if(!finite(p.y)||p.x-lo<=1e-8*w||hi-p.x<=1e-8*w)continue;
      const d=Math.min(w*.28,(p.x-lo)*.7,(hi-p.x)*.7);
      const l=f(p.x-d),r=f(p.x+d);
      if((l>p.y||r>p.y)&&l>=p.y&&r>=p.y)candidates.push(p);
      last=j;
      if(candidates.length>=32)break;
    }
    for(const [a,b] of [[lo,lo+w],[hi-w,hi]]){
      const p=refine(f,a,b);
      if(p.x-a>1e-7*w&&b-p.x>1e-7*w&&p.y<Math.min(f(a),f(b))&&!candidates.some(q=>Math.abs(q.x-p.x)<w*.1))candidates.push(p);
    }
    candidates.sort((a,b)=>a.x-b.x);
    if(candidates.length===1)return result('minimum',candidates,'One interior minimum is detected between these bounds.');
    if(candidates.length>1)return result('ambiguous',candidates,'More than one interior minimum is detected. Choose tighter bounds around one valley.');
    return result('no-turn',[],'No interior minimum was detected. Put one bound on each side of a valley; endpoints are not turning points.');
  }
  const api=Object.freeze({parse,prepareWindow,sampleCurve,findBoundedMinimum});
  if(typeof module==='object'&&module.exports)module.exports=api;else global.TIGraphGeneral=api;
})(globalThis);
