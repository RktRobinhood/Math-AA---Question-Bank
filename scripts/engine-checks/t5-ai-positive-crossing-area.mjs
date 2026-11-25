const integrate=(f,a,b,N=12000)=>{
  const h=(b-a)/N;
  let s=f(a)+f(b);
  for(let i=1;i<N;i++)s+=f(a+h*i)*(i%2?4:2);
  return s*h/3;
};
export default {
  "t5-ai-positive-crossing-area/line-crossing/graph":(q,T)=>{
    const {a,b,m,h,y0}=q.params; const f=x=>m*x+y0-h;
    T.require(y0>0&&Math.abs(f(a))<1e-9,"both functions stay positive and cross at the displayed point");
    const roots=T.roots(f,0,a+b,1001);
    T.require(roots.length===1,"one internal crossing");
    return {a:T.approx(integrate(f,0,a+b),1e-9),b:T.approx(Math.abs(integrate(f,0,roots[0]))+Math.abs(integrate(f,roots[0],a+b)),1e-8)};
  },
  "t5-ai-positive-crossing-area/quadratic-crossing/equation":(q,T)=>{
    const {h,c,d,w}=q.params;
    const f=x=>x*x+d*x+c-h;
    const roots=T.roots(f,0,w,1001);
    T.require(roots.length===2&&roots[0]>0&&roots[1]<w&&f(-d/2)+h>0,"two crossing points and both graphs stay positive");
    return {a:T.approx(roots[0],1e-8),b:T.approx(roots[1],1e-8),
      c:T.approx(integrate(f,0,w),1e-8),d:T.approx(integrate(x=>Math.abs(f(x)),0,w),1e-7)};
  }
};
