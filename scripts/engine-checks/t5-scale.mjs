function dd(f,x,h=1e-4){return (f(x+h)-f(x-h))/(2*h);}
function optimise(f,lo,hi,max=true){
 for(let i=0;i<75;i++){
  const a=(2*lo+hi)/3,b=(lo+2*hi)/3;
  if(max?f(a)<f(b):f(a)>f(b))lo=a; else hi=b;
 }
 return (lo+hi)/2;
}
function integrate(fn,h,n=1000){
 const dx=h/n; let a=fn(0)+fn(h);
 for(let i=1;i<n;i++)a+=(i%2?4:2)*fn(i*dx);
 return a*dx/3;
}
const V={};
const add=(id,rep,fn)=>V["t5-scale-"+id+"/result/"+rep]=(q,T)=>fn(q.params,T,q);
add("same-cubic-gradients","equation",({a,u,v,c},T)=>{
 const f=k=>x=>((a*x+k)*x)*x+c;
 const f0=f(0), f1=f(1), D=g=>dd(g,u)-dd(g,v), k=Math.round(-D(f0)/(D(f1)-D(f0)));
 return {a:k,b:Math.round(dd(f(k),u))};
});
add("reciprocal-target-slope","words",({a,p,h,g},T)=>{
 const f=x=>h+a/Math.pow(x,p);
 const roots=T.roots(x=>dd(f,x)+g,0.2,20,1501);
 T.require(roots.length===1,"unique positive target gradient");
 return {b:T.approx(roots[0],1e-5),c:T.approx(f(roots[0]),1e-5)};
});
add("steepest-decline","words",({a,d,end},T)=>{
 const f=t=>a*t/Math.exp(t/d), t=optimise(x=>dd(f,x),.0001,end-.0001,false);
 T.require(dd(f,t)<dd(f,0)&&dd(f,t)<dd(f,end),"steepest slope compares both endpoints");
 return {b:Math.round(t),c:T.approx(dd(f,t),1e-5)};
});
add("velocity-position-backwards","graph",({finish},T,q)=>{
 const pts=q.graph.functions[0].fn.points;
 const areas=pts.slice(1).map(([x,y],i)=>(x-pts[i][0])*(y+pts[i][1])/2);
 const displacement=areas.reduce((a,b)=>a+b,0);
 return {a:areas.filter(x=>x>0).reduce((a,b)=>a+b,0),b:displacement,c:finish-displacement};
});
add("ai-stationary-bracket","table",({top,y,v},T,q)=>{
 const read=s=>Number(s.replaceAll("$","")), col=q.table.rows[1].slice(1).map(read).findIndex(t=>t===0);
 T.require(col>=0&&v.filter(t=>t===0).length===1&&new Set(top).size===top.length,"one listed zero gradient");
 T.require(q.table.rows[0].slice(1).map(read).every((n,i)=>n===y[i]),"function row matches display");
 return {a:read(q.table.head[col+1]),b:read(q.table.rows[0][col+1])};
});
add("ai-shift-stationary","equation",({a,c,h,k},T)=>{
 const f=x=>a*(x-h)*(x-h)+c+k, root=T.roots(x=>dd(f,x),-10,10,501);
 T.require(root.length===1,"single stationary point");
 return {a:Math.round(root[0]),b:Math.round(f(root[0]))};
});
add("ai-zero-height-gradient","equation",({p,a,c})=>({a:Math.round(dd(x=>(x-p)*(c*(x-p)**2+a),p))}));
add("ai-whole-item-profit","words",({a,b,end},T)=>{
 const gain=x=>x*(b-a*x), z=optimise(gain,0,end);
 const ranked=Array.from({length:end+1},(_,x)=>x).sort((j,k)=>gain(k)-gain(j));
 T.require(gain(ranked[0])>gain(ranked[1]),"unique whole-output maximum");
 return {a:T.approx(z,1e-5),b:ranked[0],c:gain(ranked[0])};
});
add("ai-optimum-fixed-fee","words",({a,r,t},T)=>{
 const g=x=>a*(r*r-(x-r)**2)-t, z=optimise(g,0,2*r);
 return {a:Math.round(z),b:Math.round(g(z))};
});
add("ai-objective-difference","words",({a,b,c,d},T)=>{
 const diff=x=>b*x-(a*x*x+c*x+d), z=optimise(diff,0,20);
 return {b:T.approx(z,1e-5),c:T.approx(diff(z),1e-5)};
});
add("ai-trap-recover-endpoint","table",({h,a,b,S},T,q)=>{
 const rx=q.table.head.slice(1).map(x=>Number(x.replace(/\$/g,""))), width=rx[1]-rx[0];
 const area=(u,v)=>(u+v)*width/2, c0=area(a,b);
 const inv=Array.from({length:80},(_,i)=>i).find(i=>Math.abs(c0+area(b,i)-S)<1e-10);
 T.require(inv!==undefined,"integer endpoint matches the total");
 return {a:width,b:inv};
});
add("ai-trap-refine-midpoint","words",({a,b,c,h},T)=>{
 const coarse=x=>a+(c-a)*x/(2*h), refined=x=>x<h?a+(b-a)*x/h:b+(c-b)*(x-h)/h;
 const x=integrate(coarse,2*h), y=integrate(refined,2*h);
 return {a:T.approx(x,1e-6),b:T.approx(y,1e-6),c:T.approx(Math.abs(x-y),1e-6)};
});
add("aa-hl-corner-audit","equation",({a,b,h,c},T)=>{
 const f=x=>x<=h?c+a*(x-h):c+b*(x-h)**2, s=.000001;
 const l=(f(h)-f(h-s))/s, r=(f(h+s)-f(h))/s;
 T.require(Math.abs(f(h-s)-f(h+s))<1e-4&&Math.abs(l-r)>1,"continuous corner");
 return {a:Math.round((f(h-s)+f(h+s))/2),b:Math.round(l),c:Math.round(r),d:T.option("corner")};
});
add("aa-hl-lhopital-validity","equation",({a,b},T)=>{
 const n=x=>Math.expm1(a*x), d=x=>x+b;
 T.require(n(0)===0,"numerator tends to zero");
 return {a:T.option(d(0)===0?"yes":"no")};
});
add("aa-hl-implicit-horizontal","equation",({k,h,j},T)=>{
 const f=x=>j+(h-x+Math.sqrt(Math.max(0,12*k*k-3*(x-h)**2)))/2;
 const x=optimise(f,h-2*k,h+2*k), y=f(x);
 T.require(Math.abs(dd(f,x))<1e-5,"upper branch has horizontal tangent");
 return {b:Math.round(x),c:Math.round(y)};
});
add("aa-hl-parts-frequency","equation",({n,h,a},T)=>{
 const lo=integrate(x=>a*x*Math.sin(n*x),h), hi=integrate(x=>a*x*Math.sin((n+1)*x),h);
 return {b:T.approx(lo,1e-7),c:T.approx(hi-lo,1e-7)};
});
add("aa-hl-mac-inverse-coefficient","equation",({n,c},T)=>{
 const p=Array.from({length:8},(_,i)=>i).find(p=>Math.abs((1+n*.0001+n*n*.0001**2/2)*(1+p*.0001)-1-(n+p)*.0001-c*.0001**2)<1e-9);
 T.require(p!==undefined,"unique small multiplier");
 // Product derivatives at zero: f'''(0)=n^3+3pn^2.
 return {a:Math.round(dd(x=>Math.exp(n*x),0)),b:p,c:(n**3+3*p*n*n)/6};
});
add("aa-hl-diff-eq-constant-solution","equation",({k},T)=>{
 const rhs=y=>(y-k)**2, match=Array.from({length:19},(_,i)=>i-9).filter(y=>rhs(y)===0);
 T.require(match.length===1,"exactly one constant state");
 return {a:match[0]};
});
add("ai-hl-nullcline-at-input","equation",({a,b,d,k,x},T)=>{
 const f=y=>a*x+b*y-(a*d+b*k), z=T.roots(f,-20,20,301);
 T.require(z.length===1,"unique horizontal field segment on this line");
 return {a:Math.round(z[0]),b:Math.round(f(Math.round(z[0])+1))};
});
add("ai-hl-euler-recover-step","table",({a,x,y,d,y1},T)=>{
 const slope=x=>a+x, choices=[.25,.5];
 const h=choices.find(s=>Math.abs(y+s*slope(x)-y1)<1e-10);
 T.require(h!==undefined,"only one allowed step matches the observed change");
 const second=y+h*(slope(x)+slope(x+h));
 return {a:h,b:second};
});
add("ai-hl-shifted-equilibrium","equation",({a,b,u,v,s,t},T)=>{
 const x0=T.roots(x=>a*s*x-a*s*u,-12,12,301)[0], y0=T.roots(y=>b*t*y-b*t*v,-12,12,301)[0];
 const af=Math.exp(s*a*.1)>1,bf=Math.exp(t*b*.1)>1;
 return {a:Math.round(x0),b:Math.round(y0),c:T.option(af===bf?(af?"source":"sink"):"saddle")};
});
add("ai-hl-euler-recover-velocity","table",({x,k,r,x1},T)=>{
 const h=1/r;
 const v=Array.from({length:40},(_,i)=>i-10).find(v=>x+v*h===x1);
 T.require(v!==undefined,"one starting velocity matches the observed displacement");
 return {a:v,b:v-k*x*h};
});
add("ai-hl-euler-acceleration-zero","equation",({a,v},T)=>{
 const accel=t=>(a*v)-a*t, roots=T.roots(accel,-16,16,321);
 T.require(roots.length===1,"one equilibrium velocity");
 return {a:Math.round(roots[0])};
});
add("ai-hl-verify-reciprocal-ode","equation",({p,k,a},T)=>{
 const y=x=>p/(k+a*x), c0=-dd(y,1)/y(1)**2;
 return {a:Math.round(c0*p)/p,b:y(0)};
});
add("slope-at-origin-select-term","equation",({a,b,c,d,n})=>({a:Math.round(dd(x=>a*x**n+b*x*x+c*x+d,0))}));
add("aa-hl-mac-recover-derivatives","equation",({a,b,c,d})=>{
 const f=x=>((d*x+c)*x+b)*x+a, h=.1;
 const f2=(x)=>(f(x+h)+f(x-h)-2*f(x))/(h*h);
 return {a:Math.round(f2(0)),b:Math.round(dd(f2,0,.1))};
});
add("ai-hl-euler-initial-row-audit","equation",({x,v,a,d,r})=>{
 const t=1/r, next=x+t*v, accel=(q,w)=>-a*q-d*w, good=v+t*accel(x,v), wrong=v+t*accel(next,v);
 return {a:next,b:good,c:good-wrong};
});
add("ai-hl-diff-eq-target-time","words",({s,m,n,t},T)=>{
 // A time ratio follows from integrating the separable equation over concentration, not time.
 const to=z=>integrate(y=>(s-z)/(s-(s-z)*y)**2,1);
 const first=to(m), last=to(n);
 return {b:T.approx(first/t,1e-8),c:T.approx(t*last/first,1e-7)};
});
export default V;
