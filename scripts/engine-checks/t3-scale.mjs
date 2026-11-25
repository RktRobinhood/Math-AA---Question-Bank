/* Independent mathematical checks. Do not import generator code or answers. */
const D=Math.PI/180,S=Math.sin,C=Math.cos,H=Math.hypot;
const key=id=>"t3-scale-"+id+"/solve/words";
const sq=x=>x*x,dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const minus=(a,b)=>a.map((x,i)=>x-b[i]),times=(a,k)=>a.map(x=>x*k);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const outward=(Q,P)=>H(...minus(Q,P));
export default Object.fromEntries(Object.entries({
 "endpoint-cable":(q,T)=>{
   const {a,b,c,h,j,k}=q.params,mid=[h,j,k],u=[h+a,j+b,k+c],v=mid.map((x,i)=>x-(u[i]-x));
   T.require(outward(u,v)>0&&outward(u,mid)===outward(mid,v),"distinct endpoints with equal distances to midpoint");
   return {a:v[2],b:outward(u,v)};
 },
 "hollow-basin":(q,T)=>{
   const {R,k}=q.params;T.require(R>k&&k>0,"positive inner radius below outer radius");
   const cap=T.integrate(y=>Math.PI*(k*k-y*y),0,k,40),radius=T.bisect(r=>2*Math.PI*r**3/3-cap,0,R);
   return {a:R-radius,b:T.integrate(y=>Math.PI*(R*R-y*y),0,R,40)-cap};
 },
 "slant-floor":(q,T)=>{
   const {k}=q.params;T.require(k>0,"positive rise");
   const h=T.bisect(x=>H(x,k)-2*k,0,2*k);
   return {a:Math.atan2(k,h)/D,b:h};
 },
 "ssa-perimeter":(q,T)=>{
   const {a,b,g}=q.params,d=a*a-sq(b*S(g*D));
   T.require(d>0,"two real candidate sides");
   const sides=[b*C(g*D)-Math.sqrt(d),b*C(g*D)+Math.sqrt(d)];
   T.require(sides[0]>0&&sides.every(c=>a+c>b&&a+b>c&&b+c>a),"two positive nondegenerate triangles");
   const angle=c=>Math.acos((a*a+c*c-b*b)/(2*a*c))/D;
   return {a:Math.max(...sides.map(angle)),b:a+b+sides[0]};
 },
 "reverse-bearing":(q,T)=>{
   const {a,b,c}=q.params,L=Math.sqrt(a*a+b*b-2*a*b*C((180-c)*D));
   const east=b*S(c*D),north=a+b*C(c*D);T.require(east>0&&L>0,"non-cardinal nonzero return directed west");
   return {a:L,b:360-Math.acos(-north/L)/D};
 },
 "opposite-observers":(q,T)=>{
   const {d,a,b}=q.params,m=Math.tan(a*D),n=Math.tan(b*D),x=d*n/(m+n);
   T.require(x>0&&x<d,"mast inside observation baseline");
   return {a:m*x,b:x};
 },
 "sector-reverse":(q,T)=>{
   const {l,n}=q.params,theta=T.bisect(t=>l*l/(2*t)-n/2,.001,2*Math.PI);
   T.require(theta>0&&theta<2*Math.PI,"sector less than one revolution");
   return {a:l/theta,b:theta};
 },
 "wheel-signed-travel":(q,T)=>{
   const {k,u,v}=q.params;T.require(u>v&&v>0,"positive net displacement with a reverse turn");
   const rim=2*Math.PI*k,steps=rim/12;
   return {a:(steps*u-steps*v)/k,b:steps*u+steps*v};
 },
 "double-angle-sign":(q,T)=>{
   const {a,b,c,quadrant,given}=q.params;T.require(a*a+b*b===c*c&&a*b!==0,"Pythagorean reference ratio");
   const x=given==="sin"?a/c:b/c,lo=(quadrant-1)*Math.PI/2,hi=quadrant*Math.PI/2;
   const t=T.bisect(theta=>(given==="sin"?S(theta):C(theta))-x,lo,hi);
   T.require(t>lo&&t<hi&&Math.abs(S(t)-a/c)<1e-8&&Math.abs(C(t)-b/c)<1e-8,"the given ratio determines a unique angle and compatible signs in the stated quadrant");
   return {a:S(2*t),b:C(2*t)};
 },
 "retained-zero":(q,T)=>{
   const {k,l,j}=q.params;T.require(k>1&&l>0&&j>0,"compound argument and nonzero lead");
   const f=x=>l*S(2*k*x)-l*S(k*x),roots=T.roots(f,0,2*j*Math.PI/k,432*j);
   T.require(roots.length===4*j+1&&Math.abs(roots[0])<1e-8&&Math.abs(roots.at(-1)-2*j*Math.PI/k)<1e-8,"closed endpoints not omitted");
   return {a:roots.length,b:roots[1]};
 },
 "opposed-temperature":(q,T)=>{
   const {a,b,u,v,d}=q.params;
   const f=x=>(u+v+a*C(x*Math.PI/d)+b*C((x-d)*Math.PI/d))/2;
   T.require(b>a&&f(0)!==f(d),"nonconstant combined signal");
   const hi=Math.max(...T.range(0,96).map(i=>f(i*d/48)));
   const at=T.range(0,96).map(i=>i*d/48).filter(x=>Math.abs(f(x)-f(0))<1e-8);
   T.require(at.length===2,"first and last trough differ by one full period");
   return {a:at[1]-at[0],b:hi};
 },
 "inverse-principal-branch":(q,T)=>{
   const {n,j}=q.params,t=(12*j+6+n)*Math.PI/6;
   T.require(j>0&&n>0&&n<6,"reflex angle after removing whole turns");
   return {a:Math.asin(S(t)),b:Math.acos(C(t))};
 },
 "compound-rotation":(q,T)=>{
   const {a,b,c,d,e,f}=q.params;
   T.require(a*a+b*b===c*c&&d*d+e*e===f*f,"both ratios have exact real complements");
   const t=Math.atan2(d,-e)-Math.atan2(a,b);
   return {a:S(t),b:C(t)};
 },
 "external-vector-division":(q,T)=>{
   const {x,y,z,a,b,c,j}=q.params;
   const u=[x,y,z],v=[x+a,y+b,z+c],w2=outward(u,v)/(j/(j-1)-1),k=w2/outward(u,v);
   T.require(j/(j-1)>1&&w2>0,"exterior point in correct ray");
   return {a:v[2]+k*(v[2]-u[2]),b:w2};
 },
 "dot-from-resultant":(q,T)=>{
   const {a,b,s}=q.params;const a1=Math.acos((s-a*a-b*b)/(2*a*b));T.require(Number.isFinite(a1)&&a1>0&&a1<Math.PI,"strict triangle magnitude inequalities");
   const u=[a,0],v=[b*C(a1),b*S(a1)],p=minus(u,v);
   return {a:u[0]*v[0],b:H(...p)};
 },
 "nearest-space-line":(q,T)=>{
   const {U,d,V}=q.params,z=minus(V,U);
   const t=dot(z,d)/dot(d,d),v=cross(z,d);
   T.require(H(...v)>0,"external point distinct from line");
   return {a:t,b:H(...v)/H(...d)};
 },
 "skew-separation":(q,T)=>{
   const {U,V,D,G}=q.params,n=cross(D,G),d=minus(V,U);
   T.require(H(...n)>0&&dot(d,n)!==0,"nonparallel nonintersecting");
   const scale=H(...n)/Math.sqrt(3);return {a:Math.abs(dot(d,n))/scale,b:Math.abs(dot(d,n))/H(...n)};
 },
 "slant-projection-area":(q,T)=>{
   const {u,v,w}=q.params;
   const area=(x,y,z)=>{const s=(x+y+z)/2;return Math.sqrt(s*(s-x)*(s-y)*(s-z));};
   T.require(u>0&&v>0&&w>0,"two nondegenerate triangles");
   return {a:area(u,H(v,w),H(u,v,w)),b:area(u,v,H(u,v))};
 },
 "line-plane-coefficient":(q,T)=>{
   const {a,b,c,h,i,j,t,u,v,s}=q.params;
   const z=T.bisect(w=>a*(h+t*u)+b*(i+t*v)+c*w-s,-100,100);
   T.require(c!==0&&t!==0,"solvable coefficient on line crossing");
   return {a:(z-j)/t,b:z};
 },
 "sector-cone-liner":(q,T)=>{
   const {s,a}=q.params;
   const rim=2*Math.PI*s*a/360,base=rim/(2*Math.PI),height=T.bisect(h=>H(base,h)-s,0,s);
   T.require(base>0&&height>0,"non-flat cone");
   return {a:base,b:T.integrate(z=>Math.PI*sq(base*(1-z/height)),0,height,40)};
 },
 "reflect-voronoi":(q,T)=>{
   const {a,b,u,v,l}=q.params;
   const ratio=(u*a-v*b-l)/(u*u+v*v),x=a-2*u*ratio,y=b+2*v*ratio;
   T.require(Math.abs(ratio)>0&&Math.abs(u*(a+x)/2-v*(b+y)/2-l)<1e-9,"distinct sites and midpoint on boundary");
   return {a:x,b:y};
 },
 "voronoi-boundary-tie":(q,T)=>{
   const {s,t,x,y,j}=q.params,A=[x,y],B=[x+2*s,y],C=[x,y+2*t];
   const xc=T.bisect(a=>outward([a,0],A)-outward([a,0],B),x-20,x+40);
   const yc=T.bisect(b=>outward([0,b],A)-outward([0,b],C),y-20,y+40);
   const d=[A,B,C].map(p=>outward([xc,yc-j],p)),min=Math.min(...d);
   T.require(j>0&&Math.abs(outward([xc,yc],A)-outward([xc,yc],C))<1e-9,"interior tie vertex and distinct reading");
   return {a:xc,b:d.filter(n=>Math.abs(n-min)<1e-9).length};
 },
 "composite-matrix-area":(q,T)=>{
   const {a,b,S,s,x,y}=q.params;
   const transformed=(u,v,k)=>[-k*v,a*u+b*v];
   const factor=k=>{const A=transformed(1,0,k),B=transformed(0,1,k);return Math.abs(A[0]*B[1]-A[1]*B[0]);};
   const k=T.bisect(k=>S*factor(k)-s,0,10);
   T.require(k>0&&Math.abs(S*factor(k)-s)<1e-9,"unique positive scale");
   return {a:k,b:transformed(x,y,k)[0]};
 },
 "staggered-crossing":(q,T)=>{
   const {u,v,x,y,t,s,d}=q.params;
   const B=[x+u*t,y-v*s],at=T.bisect(k=>x+u*k-B[0],0,20),bt=T.bisect(k=>B[1]+v*(k-d)-y,d,30);
   T.require(bt>at&&at>0,"both paths cross at nonnegative elapsed times but no collision");
   return {a:at,b:bt-at};
 },
}).map(([id,fn])=>[key(id),fn]));
