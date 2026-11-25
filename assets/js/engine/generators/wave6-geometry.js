/* Original 2021 AI HL Geometry and Trigonometry practice. Exam metadata is not source text. */
(function(root){"use strict";
const E=root.QBEngine,{ans:A,fmt:F}=E;
const R=(s,...v)=>String.raw({raw:s},...v).replace(/@/g,"\\");
const q=(stem,params,...parts)=>({stem,params,parts}),p=(prompt,marks,answer,...working)=>({prompt,marks,answer,working});
const I=A.int,X=A.self,T=x=>F.m(String(x));
const v=(...x)=>R`@begin{pmatrix}${x.join('@@')}@end{pmatrix}`;
const mat=rows=>R`@begin{pmatrix}${rows.map(x=>x.join('&')).join('@@')}@end{pmatrix}`;
const add=(id,u,rep,l,code,skills,title,build)=>E.register({type:"w6-geometry-"+id,unknown:u,representation:rep,format:"value",levels:[l],home:"ai-hl",syllabus:[code],skills:skills.split(" ").map(x=>"AI-AHL"+code+"."+x),title,calculator:false,source:"original-wave-6",build});
const pair=(a,b)=>R`@left(${a},${b}@right)`;
const scalar=(n)=>n<0?'('+n+')':String(n);
const point3=x=>R`@left(${x.join(',')}@right)`;

add("midpoint-image-readback","recover-matrix-entry-from-centre","equation",2,"3.9","image-under-transformation work-back-from-images","Recover one matrix entry from the image of a centre",({rng:r})=>{
 const x=r.int(2,7),y=r.int(2,7),j=r.int(1,5),k=r.int(1,5),a=r.int(2,7),b=r.int(2,6),h=r.int(1,4),m=r.int(2,6),t=r.int(2,6);
 const P=[x-j,y-k],Q=[x+j,y+k],Mx=a*x+b*y,My=h*x+m*y;
 return q(R`The midpoint of $P${pair(...P)}$ and $Q${pair(...Q)}$ is $C$. A linear transformation takes $C$ to $C' ${pair(Mx,My)}$. Its matrix is $${mat([[a,"k"],[h,m]])}$. The letter $k$ is unknown.`,{P,Q,Mx,My,a,h,m,t},
 p("Find the x-coordinate of $C$.",1,I(x),R`Average the input x-coordinates: $@dfrac{${P[0]}+${scalar(Q[0])}}{2}=${x}$.`),
 p("Find $k$.",2,I(b),R`The midpoint has y-coordinate $${y}$. Its image satisfies $${a}(@,${x}@,)+${y}k=${Mx}$, hence $k=${b}$.`),
 p(R`Find the x-coordinate of the image of $@left(0,${t}@right)$.`,1,I(b*t),R`Only the second matrix column contributes. The first component is $${b}(@,${t}@,)=${b*t}$.`));
});

add("vector-length-rescale","read-length-from-negative-scaling","equation",1,"3.10","magnitude parallel-vectors","Read the length after reversing and scaling a vector",({rng:r})=>{
 const m=r.int(5,32),k=r.int(2,8);
 return q(R`The length of vector $@mathbf{v}$ is $${m}$ units.`,{m,k},
 p(R`Find the length of $-${k}@mathbf{v}$.`,1,I(m*k),R`The minus sign reverses the direction, not the length. Multiply by $${k}$ to obtain $${k}(@,${m}@,)=${k*m}$ units.`));
});

add("missing-balance-leg","separate-resultant-from-missing-displacement","words",2,"3.10","displacement-vector magnitude","Recover the missing displacement from a total and two known legs",({rng:r})=>{
 const m=r.int(1,5),flip=r.sign(),A1=[r.int(2,11)*r.sign(),r.int(2,9)*r.sign()],B1=[r.int(3,16)*r.sign(),r.int(1,12)*r.sign()];
 const C=[3*m*flip,-4*m],Z=[A1[0]+B1[0]+C[0],A1[1]+B1[1]+C[1]];
 return q(R`A survey team makes three successive displacements, in metres east and north. The first and third are $${v(...A1)}$ and $${v(...B1)}$. The final displacement from the start is $${v(...Z)}$.`,{A1,B1,Z},
 p("Find the east component of the second displacement.",1,I(C[0]),R`The east components add: $${Z[0]}-${scalar(A1[0])}-${scalar(B1[0])}=${C[0]}$.`),
 p("Find the north component of the second displacement.",1,I(C[1]),R`Subtract the known north components from the total: $${Z[1]}-${scalar(A1[1])}-${scalar(B1[1])}=${C[1]}$.`),
 p("Find the length of the second displacement.",2,I(5*m),R`Use both components of the missing leg: $@sqrt{${scalar(C[0])}^{2}+${scalar(C[1])}^{2}}=${5*m}$ m.`));
});

add("line-one-coordinate-inconsistent","test-membership-after-one-coordinate","equation",2,"3.11","point-on-line parametric-form","Check every coordinate before declaring that a point lies on a line",({rng:r})=>{
 const a=r.int(2,6)*r.sign(),b=r.int(2,7)*r.sign(),c=r.int(2,8)*r.sign(),u=r.int(1,10),w=r.int(1,11),h=r.int(1,13),t=r.int(2,5)*r.sign(),d=r.bool()?0:r.int(2,8)*r.sign();
 const P=[u+t*a,w+t*b,h+t*c+d], actual=h+t*c;
 return q(R`Consider the line $@mathbf{r}=${v(u,w,h)}+t${v(a,b,c)}$, $t@in@mathbb{R}$. A student says $P${point3(P)}$ is on the line because its first coordinate fits.`,{a,b,c,u,w,h,P},
 p("Find the only parameter value compatible with the first coordinate of $P$.",1,I(t),
  R`Solve $${u}+${scalar(a)}t=${P[0]}$, so $t=${t}$.`),
 p("Find the z-coordinate of the line at that parameter.",1,I(actual),
  R`Evaluate the third component: $${h}+${scalar(c)}(@,${scalar(t)}@,)=${actual}$.`),
 p("Determine whether $P$ lies on the line. Justify.",1,X(d?"No. The third coordinate does not match.":"Yes. All three coordinates match at the same parameter."),
  d?R`The first coordinate fixes $t=${t}$. The third coordinate is then $${actual}$, not $${P[2]}$.`:
  R`At $t=${t}$ the second coordinate is $${w}+${scalar(b)}(@,${scalar(t)}@,)=${P[1]}$ and the third is $${actual}$. All three match.`));
});

add("line-nonzero-parameter-anchor","reconstruct-origin-of-parameter","equation",2,"3.11","line-equation parametric-form","Recover the base point from a known nonzero parameter",({rng:r})=>{
 const h=r.int(2,5),d=[r.int(2,6)*r.sign(),r.int(1,5)*r.sign(),r.int(2,7)*r.sign()],b=[r.int(1,12),r.int(2,19),r.int(3,18)],P=b.map((v,i)=>v+h*d[i]);
 return q(R`A line is written $@mathbf r=@mathbf p+t${v(...d)}$. At parameter $t=${h}$ the point is $P${point3(P)}$.`,{h,d,P},
 ...b.map((z,i)=>p("Find the "+["first","second","third"][i]+" component of $@mathbf p$.".replace("@","\\"),1,I(z),
   R`At $t=${h}$, subtract the parameter displacement in component $${i+1}$: $${P[i]}-${h}(@,${scalar(d[i])}@,)=${z}$.`)));
});

add("velocity-direction-reversed","distinguish-reversal-from-speed-change","equation",1,"3.12","speed-direction","Tell what happens to the speed when velocity is reversed",({rng:r})=>{
 const m=r.int(2,11),i=r.int(0,1),speed=5*m,vel=i?[4*m,-3*m]:[-3*m,-4*m];
 return q(R`A vehicle has velocity $${v(...vel)}$ metres per second. Its new velocity is the negative of this vector.`,{vel},
 p("Give its new speed in metres per second.",2,I(speed),R`Negating both components does not change the magnitude. It is $@sqrt{${(3*m)**2}+${(4*m)**2}}=${speed}$ metres per second.`));
});

add("velocity-change-remaining-time","split-travel-at-one-velocity-change","table",2,"3.12","position-at-time interpret-path","Split elapsed time between two constant velocity vectors",({rng:r})=>{
 const initial=[r.int(3,32),r.int(4,22)],cut=r.int(3,9),q0=r.int(2,8),end=cut+q0;
 const A1=[r.int(2,8),r.int(1,6)*r.sign()],B1=[r.int(2,7)*-1,r.int(2,9)];
 const W=initial.map((v,i)=>v+cut*A1[i]+q0*B1[i]);
 const Q=q(R`A robot starts at $${pair(...initial)}$ metres when $t=0$. Use the given velocities to find its position at $t=${end}$ seconds.`,{initial,cut,end,A1,B1},
 p("How long does it travel with the second velocity, in seconds?",1,I(q0),R`The second interval lasts $${end}-${cut}=${q0}$ seconds, not $${end}$ seconds.`),
 ...W.map((z,i)=>p("Find the final "+["x","y"][i]+"-coordinate, in metres.",1,I(z),
   R`Use the corresponding component of each leg: $${initial[i]}+${cut}(@,${scalar(A1[i])}@,)+${q0}(@,${scalar(B1[i])}@,)=${z}$.`)));
 return {...Q,table:{head:["Time (s)","Velocity (m/s)"],rows:[[T(R`0@le t<${cut}`),T(v(...A1))],[T(R`t@ge${cut}`),T(v(...B1))]]}};
});

add("velocity-from-odometer-pings","derive-average-vector-then-recover-earlier-position","words",2,"3.12","position-at-time speed-direction","Use two timed positions to recover a constant velocity and earlier position",({rng:r})=>{
 const t=r.int(2,6),k=r.int(2,8),m=r.int(1,4),start=[r.int(15,45),r.int(23,50)],u=[3*m*r.sign(),4*m*r.sign()];
 const P=start.map((v,i)=>v+t*u[i]),Q=start.map((v,i)=>v+(t+k)*u[i]);
 return q(R`At $t=${t}$ s a trolley is at $P${pair(...P)}$ metres. At $t=${t+k}$ s it is at $Q${pair(...Q)}$ metres. The velocity is constant from $t=0$.`,{t,k,P,Q},
 p("Find the x-component of its velocity.",1,I(u[0]),R`The x displacement divided by the time gap is $@dfrac{${Q[0]}-${scalar(P[0])}}{${k}}=${u[0]}$ m/s.`),
 p("Find its speed.",2,I(5*m),R`The y-component is $@dfrac{${Q[1]}-${scalar(P[1])}}{${k}}=${u[1]}$ m/s; take the magnitude of $${v(...u)}$ to obtain $${5*m}$ m/s.`),
 p("Find its x-coordinate at $t=0$.",1,I(start[0]),R`Go back $${t}$ seconds: $${P[0]}-${t}(@,${scalar(u[0])}@,)=${start[0]}$ m.`));
});

add("weighted-degree-is-not-weight","distinguish-incidence-from-cost","table",1,"3.14","classify-graph vertex-degree","Distinguish the degree of a vertex from the sum of its edge weights",({rng:r})=>{
 const n=r.int(4,7),names="ABCDEFG".slice(0,n).split(""),target=r.int(1,n-2);
 const list=names.slice(1).map((x,i)=>[names[i]+x,r.int(2,17)]);
 if(r.bool()){const other=r.pick(names.map((_,i)=>i).filter(i=>Math.abs(i-target)>1));list.push([[names[target],names[other]].sort().join(""),r.int(2,17)]);}
 const label=names[target],count=list.filter(([a])=>a.includes(label)).length;
 const item=q(R`The table lists every edge of an undirected road graph. The weight is distance in kilometres.`,{list,label},
 p(R`Find the degree of vertex ${label}.`,1,I(count),R`Count the edges incident to ${label}: ${list.filter(([a])=>a.includes(label)).map(([a])=>a).join(", ")}. Its degree is $${count}$; the distances are not added.`));
 return {...item,table:{head:["Edge","Distance (km)"],rows:list.map(([a,d])=>[a,T(d)])}};
});

add("audit-one-unlogged-edge","recover-endpoints-from-degree-deficits","words",2,"3.14","model-as-graph vertex-degree","Recover a missing edge from two understated endpoint degrees",({rng:r})=>{
 const n=r.int(5,8),names="ABCDEFGH".slice(0,n).split("");
 const missing=r.pick(names.slice(2)),base=names.slice(1).map((x,i)=>names[i]+x);
 const options=[];for(let i=1;i<n-2;i++)for(let j=i+2;j<n;j++)options.push(names[i]+names[j]);
 const e=r.pick(options),tag="A"+missing,list=[...base,e],num=list.length+1;
 const degree=names.map(x=>list.filter(k=>k.includes(x)).length+Number(tag.includes(x)));
 return q(R`A simple undirected graph has vertices ${names.join(", ")}. Its edge list is ${list.join(", ")} plus one missing record. The audited degrees, in vertex order, are $${degree.join(",@, ")}$.`,{names,list,degree},
 p("Find the total number of edges in the complete record.",1,I(num),R`The audited degrees sum to $${degree.reduce((a,b)=>a+b)}$. Divide by two because each edge contributes at two endpoints, giving $${num}$.`),
 p("State the missing edge and explain how the audit identifies its endpoints.",2,X("The missing edge is "+tag+". Only A and "+missing+" have an understated degree in the listed edges."),
  R`Compare listed with audited degree at every vertex. Only A and ${missing} are short by one, so the missing edge joins those two vertices.`));
});

add("reverse-and-relabel-adjacency","read-a-transposed-entry-in-new-order","equation",2,"3.15","read-adjacency-matrix write-adjacency-matrix","Read a reversed directed network when the matrix order changes",({rng:r})=>{
 const w=r.int(1,5),a=r.int(2,7),b=r.int(1,6),c=r.int(1,8),d=r.int(1,8),e=r.int(2,7);
 const matrix=[[0,w,a],[b,0,c],[d,e,0]];
 return q(R`The adjacency matrix of a directed multigraph is $M=${mat(matrix)}$ in vertex order A, B, C. Row means origin and column means destination. Every arrow is reversed and the new matrix $N$ is written in order C, A, B.`,{matrix},
 p("Find the number of arrows from A to C before reversal.",1,I(a),R`Read row A and column C in the original matrix: $M_{1,3}=${a}$.`),
 p("Find $N_{2,3}$.",1,I(b),R`In new order, row $2$ is A and column $3$ is B. Count A to B after reversal, which was B to A before reversal: $${b}$.`),
 p("Find the sum of the entries in the first row of $N$.",2,I(a+c),R`Those arrows from C were originally the incoming arrows to C. Read old column C and sum $${a}+${c}+0=${a+c}$.`));
});

add("walk-random-choice-from-parallel-arrows","normalize-local-outdegree-before-combining-routes","equation",2,"3.15","graph-transition-matrix random-walk-probability","Use local outdegrees instead of raw walk counts",({rng:r})=>{
 const a=r.int(1,3),b=r.int(1,3),c=r.int(1,4),d=r.int(1,4),e=r.int(1,4);
 const M=[[0,a,b,0],[0,0,0,c],[e,0,0,d],[1,0,0,0]],n=a*(d+e)+b*d,den=(a+b)*(d+e);
 return q(R`The adjacency matrix of a directed multigraph, in order A, B, C, D, is $${mat(M)}$. Rows are origins. At each step, a token chooses uniformly among the arrows leaving its current vertex. It starts at A.`,{M},
 p("Find the probability that the first move goes to C. Give an exact value.",1,A.frac(b,a+b),
  R`Of the $${a+b}$ outgoing arrows from A, $${b}$ lead to C. The probability is $${F.frac(b,a+b)}$.`),
 p("Find the probability that the token is at D after exactly two moves. Give an exact value.",3,A.frac(n,den),
  R`Through B the probability is $${F.frac(a,a+b)}@cdot 1$. Through C it is $${F.frac(b,a+b)}@cdot${F.frac(d,d+e)}$. Add the disjoint routes to obtain $${F.frac(n,den)}$.`));
});
})(typeof window==="undefined"?globalThis:window);
