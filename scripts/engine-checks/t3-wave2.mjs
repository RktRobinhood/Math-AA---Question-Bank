const D=Math.PI/180, vs=(a,b)=>a.map((n,i)=>n-b[i]), norm=v=>Math.hypot(...v);
const V={};const add=(id,rep,fn)=>V["t3-wave2-"+id+"/result/"+rep]=(q,T)=>fn(q.params,T,q);
const V1=(root,fn,steps=80)=>{let lo=root[0],hi=root[1],y=fn(lo);for(let i=0;i<steps;i++){const x=(hi+lo)/2;if((fn(x)>0)===(y>0)) lo=x;else hi=x;}return (lo+hi)/2;};
add("exact-included-angle","equation",({a,b,m},T)=>{
 // Project the other side onto and perpendicular to the known base.
 const angle=Math.acos(m/5), v=b*Math.sin(angle), x=b*Math.cos(angle);
 return {a:Math.round(Math.hypot(a-x,v)**2),b:a*v/2,c:v};
});
add("balcony-two-objects","words",({h,a,b,p,q},T)=>{
 const position=(horizontal,tangent,up)=>[horizontal,h+Math.abs(horizontal)*Math.tan(up*Math.atan(tangent))];
 const light=position(a,p/3,1),sensor=position(-b,q/4,-1);
 T.require(sensor[1]>0,"sensor stays above courtyard");
 return {a:light[1],b:sensor[1],c:Math.round(norm(vs(light,sensor))**2)};
});
add("double-angle-measurement","words",({n},T)=>{
 const q=n/100;
 const t=V1([Math.PI/4,Math.PI/2],x=>2*Math.sin(x)*Math.cos(x)-q);
 return {a:T.approx(Math.cos(t)**2-Math.sin(t)**2,1e-10),b:T.approx(Math.sin(t),1e-10),c:T.approx(t,1e-10)};
});
add("phase-threshold-two-times","equation",({a,b,c},T)=>{
 const fun=t=>a*Math.cos(t)+b*Math.sin(t), vals=T.roots(t=>fun(t)-c,0,2*Math.PI,1201);
 T.require(vals.length===2&&vals[1]<2*Math.PI,"two distinct threshold times in one turn");
 const peak=Math.hypot(a,b), arg=Math.atan(b/a);
 return {a:T.approx(fun(arg),1e-10),b:T.approx(vals[0],1e-8),c:T.approx(vals[1],1e-8)};
});
add("reflected-signal-difference","equation",({a,b,c},T)=>{
 const fun=t=>a*Math.sin(t)+b*Math.cos(t), f=t=>fun(t)-fun(Math.PI-t)-c, t=V1([0,Math.PI],f);
 return {b:T.approx(t,1e-10),c:T.approx(fun(t),1e-10)};
});
add("force-rail-direction","words",({x,y,z,a,b,c,s},T)=>{
 const u=[x,y,z],v=[a*s,-b*s,c*s];
 const q0=norm(u),q1=norm(v);
 const cosine=(q0*q0+q1*q1-norm(vs(u,v))**2)/(2*q0*q1);
 return {a:T.approx(q1*cosine,1e-10),b:T.approx(Math.acos(cosine)/D,1e-10)};
});
add("parallel-witness-coordinate","equation",({x,y,z,a,b,c,Q0},T)=>{
 const [rx,ry,rz]=vs(Q0,[x,y,z]);
 const q=rx/a, ratios=[q,ry/b,rz/c];
 const witness=ratios.findIndex(x=>Math.abs(x-q)>1e-10);
 T.require(witness>0,"exactly one of the later coordinates disagrees");
 return {a:T.option(witness)};
});
add("plane-height-interpolation","words",({a,b,c,u,v,p,q},T)=>{
 // Build the plane normal from edge vectors and use that equation.
 const normal=[-u*b,-v*a,a*b];
 const f=(x,y)=>c-(normal[0]*x+normal[1]*y)/normal[2];
 return {a:T.approx(f(1,0)-f(0,0),1e-10),b:T.approx(f(0,1)-f(0,0),1e-10),c:T.approx(f(a*p,b*q),1e-10)};
});
add("line-plane-parallel-gap","equation",({a,b,x,y,d},T)=>{
 const point=t=>[x+b*t,y-a*t], residual=t=>point(t).reduce((sum,e,i)=>sum+e*[a,b][i],-d);
 T.require(residual(0)===residual(1),"the same residual at two points forces a constant residual");
 return {a:T.option(residual(0)===0?2:0)};
});
add("ai-nearest-sensor-switch","words",({a,b,x,y,u,v},T)=>{
 const path=t=>[x+u*t,y+v*t], site=[2*a,2*b], delta=t=>norm(path(t))-norm(vs(path(t),site));
 T.require(delta(0)<0&&delta(90)>0,"the route crosses the bisector in forward time");
 const t=V1([0,90],delta);
 return {b:T.approx(t,1e-8),c:T.approx(norm(vs(path(t),site)),1e-8)};
});
add("ai-exact-reciprocal-tangent","equation",({shift,acute,sign},T)=>{
 // Brute-check the shifted unit circle, comparing sine and cosine rather than evaluating tangent at poles.
 const d=sign*Math.tan(acute*D), hits=[];
 for(let a=-90;a<270;a++){
  if(Math.abs(Math.cos(a*D))>.0001&&Math.abs(Math.sin(a*D)-d*Math.cos(a*D))<1e-9)hits.push(a);
 }
 T.require(hits.length===2,"two permitted exact angles");
 return {a:hits[1]-shift,b:hits[0]-shift,c:T.option(Math.round(Math.acos(-Math.cos(hits[1]*D))/D))};
});
add("ai-bipartite-audit","words",({a,b,d},T)=>{
 const group=Array.from({length:a+b},(_,i)=>i).filter(i=>i+b<a+b);
 const edges=group.flatMap(i=>Array.from({length:b},(_,j)=>[i,j+a]));
 const deg=Array(a+b).fill(0);
 for(const [i,j] of edges.slice(d)){deg[i]++;deg[j]++;}
 return {a:group.length,b:edges.length,c:deg.reduce((x,y)=>x+y,0)};
});
add("ai-closed-walks-wheel","words",({n,k},T)=>{
 const adj=Array.from({length:1+n+k},()=>[]);
 const edge=(u,v)=>{adj[u].push(v);adj[v].push(u);};
 for(let i=1;i<=n+k;i++)edge(0,i);
 for(let i=1;i<=n;i++)edge(i,i===n?1:i+1);
 const walks=(a,len,out=0)=>len===0?Number(out===0):a[out].reduce((u,v)=>u+walks(a,len-1,v),0);
 const trimmed=adj.slice(0,n+1).map(r=>r.filter(x=>x<=n));
 return {a:walks(adj,2),b:walks(adj,3),c:walks(adj,2)-walks(trimmed,2)};
});
export default V;
