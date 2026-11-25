/* Independent marking/recompute checks, Wave 3 Functions and Geometry. */
const specs={};
const reg=(id,rep,f)=>specs["w3-functions-geometry-"+id+"/result/"+rep]=(q,T)=>f(q.params,T,q);
const lenSq=(a,b)=>a.reduce((s,n,i)=>s+(n-b[i])**2,0);
reg("radical-branch","equation",({h,k,z},T)=>{
 const candidates=Array.from({length:41},(_,i)=>i-20).filter(x=>(x-h)**2===k*x+z);
 const valid=candidates.filter(x=>Math.sqrt(k*x+z)===x-h);
 T.require(candidates.length===2&&valid.length===1&&valid[0]>candidates[0],"two squared candidates and one genuine root");
 return {a:candidates[0],b:valid[0]};
});
reg("cascade-range","words",({c,end,p,k,base,valid,high},T)=>{
 const response=x=>-base*Math.expm1(-k*(p*x+c));
 const roots=T.roots(x=>response(x)-valid,0,end,501);
 T.require(roots.length===1&&roots[0]>0&&roots[0]<end,"target attained in the interior exactly once");
 T.require(response(end)<high&&high<base,"unattainable output remains below the uncapped asymptote");
 return {a:T.approx(response(end),1e-9),b:T.approx(roots[0],1e-8),c:T.option("dom")};
});
reg("paired-reflection","table",({pairs,proposal},T)=>{
 const wrong=pairs.map(([x,y],i)=>proposal[i][1]!==x||proposal[i][0]!==y);
 T.require(wrong.filter(Boolean).length===1,"only one proposed row has incorrect coordinates");
 const index=wrong.indexOf(true);
 return {a:Math.min(...pairs.map(p=>p[1])),b:T.option(index),c:pairs[index][0]};
});
reg("holdout-tolerance","table",({a,b,hours,observed,tol},T)=>{
 const errors=observed.map((count,i)=>count-(a+b*hours[i]));
 const out=errors.map(x=>Math.abs(x)>tol);
 T.require(out.filter(Boolean).length===1,"uniquely outside, including tolerance edge as accepted");
 const i=out.indexOf(true);
 return {a:hours[i],b:errors[i],c:T.option("fail")};
});
reg("extension-pole","words",({A0,B0,B1},T)=>({
 a:A0[2]+(B1[2]-A0[2])/2,b:lenSq(B1,A0),c:lenSq(B1,A0)-lenSq(B0,A0)
}));
reg("bisector-translation","words",({a,b,u,v,p,q},T)=>{
 const A=[a,b],B=[a+2*u,b+2*v], shift=z=>[z[0]+p,z[1]+q],C=shift(A),D=shift(B);
 const intercept=([a,b],[c,d])=>(c*c+d*d-a*a-b*b)/(2*(d-b));
 const y0=intercept(C,D), y1=y0-(D[0]-C[0])/(D[1]-C[1]);
 for(const point of [[0,y0],[1,y1]])T.require(Math.abs(lenSq(point,C)-lenSq(point,D))<1e-8,"both sample boundary points equidistant");
 return {a:y1-y0,b:v*y0,c:y0-intercept(A,B)};
});
reg("voronoi-added-edge","words",({sites,H,W},T)=>{
 const owner=(s,x)=>s.reduce((A,B)=>Math.abs(A-x)<Math.abs(B-x)?A:B);
 let newSite=0,lost=0;
 for(let i=0;i<W;i++){const a=owner([sites[0],sites[2]],i+.5),b=owner(sites,i+.5);if(b===sites[1])newSite++;if(a===sites[0]&&b!==a)lost++}
 T.require(sites.every(s=>s>0&&s<W)&&H>1&&newSite>0&&lost>0,"all sites interior and new cell gains area from left");
 return {a:newSite,b:H*lost};
});
reg("orientation-ordered-maps","equation",({a,b,x,y,u,v,W},T)=>{
 const mul=(M,v)=>M.map(row=>row.reduce((z,n,i)=>z+n*v[i],0));
 const U=[[a,b],[0,1]],V=[[0,-1],[1,0]];
 const moves=[[U,V],[V,U]], points=moves.map(([P,Q])=>mul(Q,mul(P,[x,y])));
 const hits=points.map(j=>lenSq(j,W)===0);
 T.require(hits.filter(Boolean).length===1,"unique order, distinguished by observed landmark");
 const i=hits.indexOf(true),apply=p=>mul(moves[i][1],mul(moves[i][0],p));
 const [xx,xy]=apply([1,0]),[yx,yy]=apply([0,1]);
 return {a:T.option(i),b:apply([u,v])[0],c:Math.abs(xx*yy-xy*yx)};
});
reg("release-delay","words",({A0,B0,Va,Vb},T)=>{
 const pos=(A,V,t)=>A.map((a,i)=>a+V[i]*t);
 const meets=[];
 for(let i=1;i<=14;i++)for(let j=1;j<=14;j++)if(lenSq(pos(A0,Va,i),pos(B0,Vb,j))===0)meets.push([i,j]);
 T.require(Va[0]*Vb[1]!==Va[1]*Vb[0]&&meets.length===1&&meets[0][0]>meets[0][1],"paths meet only once, with positive release delay");
 const [[i,j]]=meets;return {a:i,b:i-j};
});
reg("missing-intercept-plane","equation",({Ax,By,x,y,z},T)=>{
 const u=[-Ax,By,0],v=[x-Ax,y,z], normal=[u[1]*v[2],-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
 const d=normal[0]*Ax;
 T.require(normal[2]>0&&d>0,"positive z intercept is finite");
 return {a:(normal[0]+normal[1])/d,b:d/normal[2]};
});
reg("symmetry-unknown-phase","equation",({n,p,q,k,j},T)=>{
 const u=Math.asin(p/n), candidates=[k*Math.PI/2-u,k*Math.PI/2-(Math.PI-u)];
 const tau=2*Math.PI, angle=x=>((x%tau)+tau)%tau;
 const valid=candidates.map(angle).filter(t=>Math.abs(Math.cos(j*Math.PI/2-t)-q/n)<1e-10);
 T.require(valid.length===1,"one phase consistent with both sensor readings");
 const [t]=valid;return {a:Math.cos(t),b:Math.tan(t),c:T.option(Math.floor(2*t/Math.PI))};
});
reg("window-log-inequality","equation",({d,slope,c,W},T)=>{
 const balance=x=>Math.log(x-d)-(slope*(x-d)-c),roots=T.roots(balance,d+1e-6,W,1001);
 T.require(roots.length===2&&roots[0]>d&&roots[1]<W&&balance((roots[0]+roots[1])/2)>0,"two interior roots and inequality holds between them");
 return {a:T.approx(roots[0],1e-9),b:T.approx(roots[1],1e-9),c:T.option("inside")};
});
export default specs;
