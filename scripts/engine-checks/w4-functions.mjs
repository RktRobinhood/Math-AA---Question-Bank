/* Independent construction from each displayed mathematical model. */
const id=(name,rep)=>"w4-fn-"+name+"/reasoning/"+rep;
export default {
 [id("perpendicular-drop","words")]:({params:{a,b,h,k,u,v}},T)=>{
  const route=x=>k+(x-h)*b/a, d=x=>(x-u)**2+(route(x)-v)**2;
  const opt=T.extremum(d,h-30,h+40,"min",113);
  const X=opt.x,Y=route(X);
  T.require(Math.abs((X-u)*a+(Y-v)*b)<1e-5&&d(X-.02)>opt.value&&d(X+.02)>opt.value,"projection has unique orthogonal closest point");
  return{a:T.approx(-a/b,1e-12),b:T.approx(X,2e-6),c:T.approx(Math.sqrt(opt.value),1e-8)};
 },
 [id("cable-safe-segment","words")]:({params:{p,q,k,l,Y}},T)=>{
  const y=x=>k+p*x/q,hit=T.bisect(x=>y(x)-Y,l,30);
  T.require(y(l)<Y&&hit>l&&y(hit+.001)>Y,"monotone cable clips at different constraints");
  return{a:T.approx(y(l),1e-10),b:T.approx(hit,1e-10),c:T.approx(T.integrate(x=>Math.hypot(1,p/q),l,hit,12),1e-8)};
 },
 [id("calibration-reject-time","words")]:({params:{a,c,H,good,bad}},T)=>{
  const inv=x=>c*x**4+a*x, root=T.bisect(x=>inv(x)-good,0,Math.sqrt(H));
  const vmax=Math.max(...Array.from({length:51},(_,i)=>inv(Math.sqrt(H*i/50))));
  T.require(0<root&&root*root<H&&0<good&&good<vmax&&bad>vmax,"valid root and out-of-range reading on finite increasing domain");
  return{a:T.approx(vmax,1e-8),b:T.approx(root*root,1e-8),c:T.option("no")};
 },
 [id("inverse-duplicate-witness","equation")]:({params:{h,L,a,k,v}},T)=>{
  const sq=(-1+Math.sqrt(1-4*a*(k-v)))/(2*a),first=h-Math.sqrt(sq),last=h+Math.sqrt(sq);
  T.require(sq>0&&h-L<first&&first<h&&h<last&&last<h+L,"two distinct preimages, one per side of the axis");
  return{a:T.approx(first,1e-8),b:T.approx(last,1e-8),c:T.option("right")};
 },
 [id("arch-width-transfer","words")]:({params:{H,Y,d,Z}},T)=>{
  const q=T.bisect(a=>H-a*d*d-Y,0,20),f=x=>H-q*x*x;
  const x=T.bisect(t=>f(t)-Z,0,d);
  T.require(Y<Z&&Z<H&&0<x&&x<d,"second width is genuinely narrower");
  return{a:T.approx(q,1e-10),b:T.approx(x*2,1e-8),c:T.option("decreases")};
 },
 [id("mirror-quadratic-repair","table")]:({params:{h,L,t,Y,W}},T)=>{
  const dx=t-(h-L), D=(W-Y)/dx;
  // Secant slope of quadratic = a(x1+x2)+b; the axis sets b=-2ah.
  const a=D/(h-L+t-2*h),b=-2*a*h,c=Y-a*(h-L)**2-b*(h-L);
  const f=x=>T.poly([a,b,c],x), p=T.roots(x=>f(x)-Y,h-4,h+4,77);
  T.require(p.length===2&&a>0&&f(h)<Y&&Math.abs(f(t)-W)<1e-9,"two equal outputs and a higher exact measurement");
  return{a:T.approx(p[1],1e-7),b:T.approx(a,1e-8),c:T.approx(f(h),1e-8)};
 },
 [id("affine-restore-feature","equation")]:({params:{a,b,h,k,x,y}},T)=>{
  const backX=T.bisect(z=>(h-z)/b-x,-50,50),backY=T.bisect(z=>a*z+k-y,-50,50);
  T.require(a>0&&b>0&&(h+1)/b>h/b&&(h-1)/b<h/b,"input transformation reverses order while output order is preserved");
  return{a:T.approx(backX,1e-10),b:T.approx(backY,1e-10),c:T.option("negative")};
 },
 [id("decay-gap-matching","words")]:({params:{A,B,p,q,c,d}},T)=>{
  const U=t=>c+A*Math.exp(t*Math.log(p)),V=t=>d+B*Math.exp(t*Math.log(q));
  const t=T.bisect(x=>(U(x)-c)-(V(x)-d),0,100);
  T.require(A>B&&p<q&&q<1&&t>0&&Math.abs((U(t)-c)-(V(t)-d))<1e-9,"unique crossing of the two nonzero baseline gaps");
  return{a:U(0)-c,b:T.approx(t,1e-8),c:T.approx(V(t)-d,1e-8)};
 },
 [id("reciprocal-asymptote-absent-output","equation")]:({params:{h,k,a}},T)=>{
  const f=x=>(k*x-k*h+a)/(x-h), v=(f(h+1e6)+f(h-1e6))/2;
  T.require(a!==0&&(f(h+4000)-v)*(f(h-4000)-v)<0,"one horizontal approach from each side");
  return{a:T.approx(v,1e-10)};
 },
 [id("refine-bracket","table")]:({params:{L,R,seek,mid},table},T)=>{
  const values=table.rows[0].slice(1).map((x,i)=>Number(x.slice(1,-1))-Number(table.rows[1][i+1].slice(1,-1)));
  const bracket=values[0]*values[1]<0?[L,mid]:[mid,R];
  T.require(values[0]<0&&values[2]>0&&values[1]!==0&&bracket[0]<seek&&seek<bracket[1],"nonzero midpoint and exactly one preserved sign bracket");
  return{a:bracket[0],b:bracket[1]};
 },
 [id("unit-chain-ready","words")]:({params:{a,b,c,rate},parts},T)=>{
  const i=parts[0].answer.options.indexOf(b);
  T.require(new Set([a,b,c]).size===3&&rate>0&&i>=0,"distinct units and identifiable intermediate output");
  return{a:T.option(parts[0].answer.values[i])};
 },
 [id("reciprocal-linear-tradeoff","words")]:({params:{a,b,B,base}},T)=>{
  const f=x=>a/x+b*x, opt=T.extremum(f,.3,50,"min",240),g=x=>f(x)-B;
  const lo=T.bisect(g,.01,opt.x),hi=T.bisect(g,opt.x,70);
  T.require(lo<opt.x&&opt.x<base&&base<hi&&g(opt.x)<0&&Math.abs(g(lo))+Math.abs(g(hi))<1e-8,"positive feasible interval spans the unique optimum and current setting");
  return{a:T.approx(opt.x,1e-6),b:T.approx(opt.value,1e-8),c:T.approx(lo,1e-8),d:T.approx(hi,1e-8),e:T.approx(f(Number(base.toFixed(6)))-opt.value,1e-8)};
 }
};
