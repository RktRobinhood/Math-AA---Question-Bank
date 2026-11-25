// Wave 5 geometry: original questions and worked answers.
(function(root){
"use strict";
const E=root.QBEngine,{ans:A,fmt:F}=E,I="ai-sl",H="ai-hl",D=Math.PI/180;
const R=(chunks,...values)=>String.raw({raw:chunks},...values).replace(/@/g,"\\");
const P=(prompt,marks,answer,...working)=>({prompt,marks,answer,working});
const Q=(stem,params,...parts)=>({stem,params,parts});
const s=x=>F.sf(x,3),u=x=>A.sf(x,3),f=(x,y)=>F.frac(x,y),pt=(...v)=>"("+v.join(", ")+")";
const deg=x=>String(x)+R`^{@circ}`, b3=x=>deg(String(x).padStart(3,"0"));
const mat=M=>R`@begin{pmatrix}`+M.map(r=>r.join("&")).join(R`@@`)+R`@end{pmatrix}`,col=(...v)=>mat(v.map(x=>[x]));
const coeff=(a,v)=>a===1?v:a===-1?"-"+v:String(a)+v;
const signed=x=>x<0?" - "+(-x):" + "+x;
const ch=(r,v,opts)=>A.choice(r,opts.find(o=>o.value===v),opts.filter(o=>o.value!==v));
const opt=(value,text,why)=>({value,text,why});
const add=(id,title,home,code,skills,level,representation,build,format="value")=>E.register({
 type:"w5-geometry-"+id,unknown:"result",title,home,syllabus:Array.isArray(code)?code:[code],skills:skills.split(" "),
 levels:[level],calculator:level===4||level===5,niceOk:id==="postman-budget-road-limit",format,representation,source:"original-wave-5",build,
});
add("bisector-gradient-sign","Find the gradient of a sloping perpendicular bisector",I,"3.5","AI-SL3.5.bisector-gradient",1,"equation",({rng:r})=>{
 const g=r.sign()*r.int(2,9),a=r.int(-6,8),b=r.int(-9,11),d=r.int(1,3);
 return Q(R`The line segment from $A${pt(a,b)}$ to $B${pt(a+d,b+d*g)}$ has gradient $${g}$.`,{a,b,d,g},
  P("Find the exact gradient of its perpendicular bisector. Give your answer as a fraction.",1,A.frac(-1,g),
    R`Perpendicular gradients have product $-1$. The negative reciprocal of $${g}$ is $${f(-1,g)}$.`));
});
add("two-depot-coverage","Place a standby point to minimise the longer of two distances",I,"3.5","AI-SL3.5.bisector-equation",4,"words",({rng:r})=>{
 const d=r.int(30,47),p=r.int(4,13),q=p+r.int(2,8),sg=r.sign(),a=sg===1?p:q,b=sg===1?q:p;
 const k=(d*d+b*b-a*a)/(2*d),m=Math.floor(k),mode=r.int(0,2);
 const l=mode===2?m+2:m-3,h=mode===1?m-1:m+4,x=Math.max(l,Math.min(h,k)),da=Math.hypot(x,a),db=Math.hypot(d-x,b);
 return Q(R`Two depots are at $A${pt(0,a)}$ and $B${pt(d,b)}$ on a map in kilometres. A standby point must lie on the horizontal road $y=0$, with $${l}@le x@le${h}$. Response distances are straight-line distances. The agency wants to make the longer of its two depot distances as small as possible.`,{d,a,b,l,h},
  P("On the full line $y=0$, find the $x$-coordinate where both distances are equal, to three significant figures.",2,u(k),
    R`The point is on the perpendicular bisector. Set $x^2+${a}^2=(${d}-x)^2+${b}^2$. Cancel $x^2$ and solve to get $x@approx ${s(k)}$.`),
  P("Find the best legal $x$-coordinate, to three significant figures.",2,u(x),
    R`On the stated road, the distance to $A$ increases and the distance to $B$ decreases as $x$ increases. The larger distance is smallest where they meet, if allowed. ${mode===0?"Their meeting point is allowed.":mode===1?"Their meeting point is beyond the right endpoint, so use that endpoint.":"Their meeting point is beyond the left endpoint, so use that endpoint."} Thus $x@approx ${s(x)}$.`),
  P("Find the longer depot distance at the best point, in kilometres, to three significant figures.",2,u(Math.max(da,db)),
    R`Use the unrounded best position and the two distance formulas. The two distances round to $${s(da)}$ km and $${s(db)}$ km; the longer distance rounds to $${s(Math.max(da,db))}$ km.`));
});
add("named-angle-ratio","Read a trigonometric ratio for a named corner",I,"3.2","SL3.2.right-ratio",1,"words",({rng:r})=>{
 const [a,b,c]=r.pick([[3,4,5],[5,12,13],[8,15,17],[7,24,25],[20,21,29],[12,35,37]]);
 const k=r.int(1,5),swap=r.int(0,1),j=r.int(0,1),trig=r.pick(["sin","cos","tan"]);
 const x=(swap?b:a)*k,y=(swap?a:b)*k,z=c*k,opp=j?x:y,adj=j?y:x,top=trig==="cos"?adj:opp,bot=trig==="tan"?adj:z,letter=j?"B":"A";
 return Q(R`Triangle $@mathrm{ABC}$ has a right angle at $C$. The side lengths are $AC=${x}$, $BC=${y}$ and $AB=${z}$.`,{x,y,z,j,trig},
  P(R`Write down $@${trig} ${letter}$ as an exact fraction.`,1,A.frac(top,bot),
    R`For angle $${letter}$, the opposite side is $${opp}$ and the adjacent leg is $${adj}$. The hypotenuse is $${z}$. Use ${trig==="sin"?"opposite over hypotenuse":trig==="cos"?"adjacent over hypotenuse":"opposite over adjacent"}: $${f(top,bot)}$.`));
});
add("shared-altitude-area-split","Locate a divider using two triangle areas on the same baseline",I,"3.2","SL3.2.area-sine",3,"words",({rng:r})=>{
 const b=r.int(24,51),a=r.int(9,17),theta=r.pick([30,150]),m=r.int(2,6),n=m+r.int(1,5),rev=r.int(0,1),j=rev?n:m,k=rev?m:n;
 const leftN=a*b*j,leftD=4*(j+k),tN=b*j,tD=j+k;
 return Q(R`In triangle $@mathrm{ABC}$, $AB=${b}$ cm, $AC=${a}$ cm and angle $@mathrm{BAC}=${deg(theta)}$. Point $P$ lies on segment $AB$. The areas of triangles $@mathrm{APC}$ and $@mathrm{PBC}$ are in the ratio $${j}:${k}$, respectively. Use $@sin${deg(theta)}=@tfrac12$.`,{a,b,theta,j,k},
  P("Find the exact area of triangle $\\mathrm{APC}$, in square centimetres.",3,A.frac(leftN,leftD),
    R`Since $@sin${deg(theta)}=@tfrac12$, the total area is $@tfrac12(${a})(${b})@tfrac12=${f(a*b,4)}$. Triangle $@mathrm{APC}$ is a fraction $${f(j,j+k)}$ of the total, so its area is $${f(leftN,leftD)}$ square centimetres.`),
  P("Find the exact length $AP$, in centimetres.",2,A.frac(tN,tD),
    R`The altitude from $C$ to $AB$ is the same for both triangles. The area ratio therefore equals $AP:PB$. Hence $AP=${b}@times ${f(j,j+k)}=${f(tN,tD)}$ cm.`));
});
add("reverse-compass-reading","Reverse a bearing and report it with three digits",I,"3.3","SL3.3.bearings",1,"words",({rng:r})=>{
 const a=r.int(1,359),b=(a+180)%360,bearing=v=>R`$${b3(v)}$`;
 const opts=[opt(b,bearing(b),"This reverses the direction."),opt(a,bearing(a),"This is the original direction."),
  opt((a+90)%360,bearing((a+90)%360),"This turns a quarter turn from the original direction."),opt((a+270)%360,bearing((a+270)%360),"This turns a quarter turn the other way.")];
 return Q(R`On a map, the bearing of lighthouse $B$ from lighthouse $A$ is $${b3(a)}$.`,{a},
  P("What is the bearing of $A$ from $B$?",1,ch(r,b,opts),
    R`Reversing direction turns through $180^{@circ}$. ${a<180?"Add":"Subtract"} $180^{@circ}$ and give the result using three digits: $${b3(b)}$.`));
},"mcq");
add("signal-rays-component-cancel","Use opposite east–west movements to locate a landing point",I,["3.3","3.2"],"SL3.3.bearings SL3.2.right-side",3,"words",({rng:r})=>{
 const a=r.pick([30,45,60]),b=r.pick([30,45,60]),d=r.int(15,55),north=r.int(0,1);
 const th1=north?a:180-a,th2=north?180+b:360-b,sign=north?1:-1;
 const sinNumerator=x=>x===30?1:x===45?2:3,n=d*d*sinNumerator(a),den=sinNumerator(b);
 const sinData=[...new Set([a,b])].sort((a,b)=>a-b).map(t=>R`$@sin^{2}${deg(t)}=${f(sinNumerator(t),4)}$`).join(" and ");
 const answer=a===b?"Start":sign*(b-a)>0?"North":"South";
 const opts=[opt("North","Due north of the start.","Compare the northward and southward components."),opt("South","Due south of the start.","Compare the northward and southward components."),opt("Start","At the starting point.","Both the east–west and north–south components must cancel for this to be true.")];
 return Q(R`A survey boat travels $${d}$ metres on a bearing of $${b3(th1)}$. It takes a second straight leg of length $L$ metres on a bearing of $${b3(th2)}$, stopping on the north–south line through its starting point. There is no drift. Use ${sinData}.`,{a,b,d,th1,th2},
  P("Find the exact value of $L^{2}$ in square metres.",3,A.frac(n,den),
    R`The eastward distance $${d}@sin${deg(a)}$ equals the westward distance $L@sin${deg(b)}$. Square and divide: $L^{2}=${d}^{2}@tfrac{@sin^{2}${deg(a)}}{@sin^{2}${deg(b)}}=${f(n,den)}$.`),
  P("Where does the boat stop relative to its starting point?",2,ch(r,answer,opts),
    R`For a fixed east–west distance, a leg closer to the north–south direction has the greater north–south component. ${a===b?"The bearings are opposite and the components cancel, so the boat returns to its start.":(a<b?"The first leg is closer to north–south":"The second leg is closer to north–south")+", so its "+answer.toLowerCase()+"ward component dominates."}`));
});
add("repeated-shear-register","Recover the count of equal shears and determine which points never move",H,"3.9","AI-AHL3.9.iterate-transformation AI-AHL3.9.fixed-point",3,"equation",({rng:r})=>{
 const k=r.sign()*r.int(1,5),p=r.int(-8,8),q=r.sign()*r.int(2,6),t=r.int(3,9),v=p+t*k*q;
 return Q(R`Each pass of a graphics filter applies the matrix $S=${mat([[1,k],[0,1]])}$ to a position column vector. After the same positive number of passes at every point, the point $@mathrm{P}${pt(p,q)}$ has image $@mathrm{P}'${pt(v,q)}$.`,{k,p,q,v},
  P("Find the number of passes.",3,A.int(t),
    R`Each pass keeps $y$ unchanged and adds $${coeff(k,"y")}$ to $x$. At $P$ this adds $${k*q}$. The total change in $x$ is $${v-p}$, so the number of passes is $${t}$.`),
  P("Which points stay fixed under the full sequence?",2,ch(r,"x-axis",[
    opt("x-axis","Exactly the points on the $x$-axis.","The change depends on $y$."),opt("y-axis","Exactly the points on the $y$-axis.","Zero $x$ does not stop the shift."),
    opt("origin","Only the origin.","Every point with $y=0$ is unchanged."),opt("all","All points.","Any nonzero $y$ gives a nonzero horizontal shift.")]),
    R`A general point gets a horizontal change $${t*k}y$. This vanishes exactly on $y=0$, whatever the starting $x$.`));
});
add("composition-order-audit","Recover the order of a stretch and quarter-turn from an image",H,"3.9","AI-AHL3.9.compose-transformations AI-AHL3.9.work-back-from-images",3,"equation",({rng:r})=>{
 const k=r.int(2,6),sg=r.sign(),first=r.int(0,1),a=r.sign()*r.int(2,8),b=r.sign()*r.int(2,8);
 const x=sg*b*(first?1:k),y=-sg*a*(first?k:1),v=r.sign()*r.int(2,9),w=r.sign()*r.int(2,9);
 const kY=first?1:k,kX=first?k:1;
 return Q(R`A machine applies each of the two matrices once, in an unknown order: $S=${mat([[k,0],[0,1]])}$ and $R=${mat([[0,sg],[-sg,0]])}$. Column vectors are used. The point $@mathrm{P}${pt(a,b)}$ maps to $@mathrm{P}'${pt(x,y)}$.`,{k,sg,a,b,x,y,v,w},
  P("Which matrix was applied first?",2,ch(r,first?"S":"R",[opt("S","$S$ first.","Compare the complete mapping with the observed image."),opt("R","$R$ first.","Compare the complete mapping with the observed image."),opt("either","Either order gives this image.","Horizontal stretching changes a different component before and after the quarter-turn.")]),
    R`Applying $S$ first gives $RS${col(a,b)}=${col(sg*b,-sg*k*a)}$. Applying $R$ first gives $SR${col(a,b)}=${col(sg*k*b,-sg*a)}$. The recorded image matches ${first?"the first":"the second"} product.`),
  P(R`Another point maps to $Q'${pt(w,v)}$. Find the original point's $x$-coordinate as an exact value.`,2,A.frac(v,-sg*kX),
    R`The observed order gives $y'=${coeff(-sg*kX,'x')}$. Work back from $y'=${v}$ to obtain $x=${f(v,-sg*kX)}$.`),
  P("Find its original $y$-coordinate as an exact value.",1,A.frac(w,sg*kY),
    R`The same order gives $x'=${coeff(sg*kY,'y')}$. Thus $y=${f(w,sg*kY)}$.`));
});
add("opposite-parameter-range","Reconcile two vector-line parameters describing one physical segment",H,"3.11","AI-AHL3.11.line-equation AI-AHL3.11.point-on-line",3,"equation",({rng:r})=>{
 const p=[r.int(-8,8),r.int(-7,7),r.int(-5,5)],d=[r.sign()*r.int(1,4),r.sign()*r.int(1,5),r.sign()*r.int(1,3)],k=r.int(2,5),c=r.int(4,12),a=r.int(-1,2),b=a+r.int(2,5),q=p.map((x,i)=>x+c*d[i]);
 return Q(R`The same straight rail has two position descriptions: $@mathbf r=${col(...p)}+t${col(...d)}$ and $@mathbf r=${col(...q)}+u${col(...d.map(x=>-k*x))}$. A service section uses $${a}@le t@le${b}$ in the first description.`,{p,d,q,k,a,b},
  P("Find the lower bound of $u$ for the same section. Give an exact value.",2,A.frac(c-b,k),
    R`Equating any component gives $t=${c}-${k}u$. The lower $u$ therefore corresponds to the upper $t$. Substituting $t=${b}$ gives $u=${f(c-b,k)}$.`),
  P("Find the upper bound of $u$ for that section. Give an exact value.",2,A.frac(c-a,k),
    R`The upper $u$ occurs at the lower $t=${a}$, giving $u=${f(c-a,k)}$.`),
  P("Find the exact parameter $u$ at the midpoint of the section.",1,A.frac(2*c-a-b,2*k),R`Parameter $u$ varies linearly along the rail. Average the two bounds to get $u=${f(2*c-a-b,2*k)}$.`));
});
add("signed-vector-dot-calibration","Infer one vector component from a scalar product, then classify the angle",H,"3.13","AI-AHL3.13.scalar-product AI-AHL3.13.angle-between-vectors",3,"equation",({rng:r})=>{
 const a=r.sign()*r.int(2,6),b=r.sign()*r.int(1,5),c=r.sign()*r.int(1,5),v=Math.sign(b)*r.int(2,7),w=-Math.sign(c)*r.int(1,8),e=r.sign()*r.int(1,7),dot=a*e+b*v+c*w;
 const angle=dot===0?"right":dot>0?"acute":"obtuse";
 return Q(R`The vectors $@mathbf a=${col(a,b,c)}$ and $@mathbf b=${col("x",v,w)}$ have scalar product $${dot}$.`,{a,b,c,v,w,dot},
  P("Find $x$.",3,A.int(e),
    R`The scalar product is $${a}x${signed(b*v)}${signed(c*w)}$. Equate this with the given scalar product and solve for $x$, giving $${e}$.`),
  P("Classify the angle between the vectors without calculating its size.",2,ch(r,angle,[
    opt("acute","Acute.","Check the sign of the scalar product."),opt("right","Right.","A right angle requires zero scalar product."),opt("obtuse","Obtuse.","Negative cosine makes the angle obtuse."),opt("straight","Straight.","This requires oppositely directed parallel vectors.")]),
    R`The vectors are not parallel, since their second components have the same sign and their third components have opposite signs. The sign of $@cos@theta$ is the sign of the scalar product $${dot}$, so the angle is ${angle}.`));
});
add("walk-counter-missing-arrow","Use an observed two-step walk count to repair one unknown arrow",H,"3.15","AI-AHL3.15.count-walks AI-AHL3.15.read-adjacency-matrix AI-AHL3.15.walks-up-to-k",3,"equation",({rng:r})=>{
 const [a,b,c,d]=r.shuffle([0,1,2,3]),j=r.int(0,1),f0=r.int(0,1),f1=r.int(0,1),f2=r.int(0,1),f3=r.int(0,1);
 const M=Array.from({length:4},()=>[0,0,0,0]),L="ABCD";M[a][b]=1;M[a][c]=1;M[b][d]=1;M[c][d]=j;M[d][a]=1;
 M[b][c]=f0;M[c][b]=f1;M[d][b]=f2;M[d][c]=f3;M[c][a]=r.int(0,1);M[b][a]=r.int(0,1);
 const copy=M.map(row=>row.slice());copy[c][d]="p";
 const count=(i,k,j)=>k===0?+(i===j):M[i].reduce((n,x,h)=>n+x*count(h,k-1,j),0),upto=count(a,1,d)+count(a,2,d)+count(a,3,d);
 return Q(R`A simple directed graph has adjacency matrix $A=${mat(copy)}$ with rows and columns ordered $A,B,C,D$. Rows give origins and columns give destinations. An audit counts $${1+j}$ ${j?"walks":"walk"} of length two from $${L[a]}$ to $${L[d]}$.`,{copy,a,b,c,d,observed:1+j},
  P("Find the missing entry $p$.",2,A.int(j),
    R`The only possible intermediate vertices are $${L[b]}$ and $${L[c]}$. Via $${L[b]}$ there is one walk. Via $${L[c]}$ there are $p$. Thus $1+p=${1+j}$ and $p=${j}$.`),
  P(R`How many walks from $${L[a]}$ to $${L[d]}$ have length at least one and at most three? Repeated vertices are allowed.`,3,A.int(upto),
    R`For length three, walks must follow the pattern $${L[a]}@to ${L[b]}@to ${L[c]}@to ${L[d]}$ or $${L[a]}@to ${L[c]}@to ${L[b]}@to ${L[d]}$. These contribute $${M[b][c]*j}$ and $${M[c][b]}$, respectively. Add the walk counts of lengths one, two and three: $${count(a,1,d)}+${count(a,2,d)}+${count(a,3,d)}=${upto}$.`));
});
add("postman-budget-road-limit","Find the greatest unknown road length allowed by a closed inspection budget",H,"3.16","AI-AHL3.16.chinese-postman",4,"table",({rng:r})=>{
 const p=r.int(8,11),q=r.int(8,11),j=r.int(8,11),k=r.int(8,11),z=r.int(7,12),goal=r.int(7,12);
 const base=p+q+j+k+z,repeat=t=>Math.min(t+z,p+k,q+j),B=base+goal+repeat(goal);
 const stem=R`The six roads connect four junctions in a complete undirected network. Every road length is in kilometres; $x$ is a whole number with $6@le x@le13$. An inspection vehicle starts at $A$, travels along every road at least once and returns to $A$. The budget is a maximum of $${B}$ km.`;
 return {...Q(stem,{p,q,j,k,z,B},
  P("Find the least extra distance for roads repeated when $x=13$, in kilometres.",2,A.int(repeat(13)),
    R`All four junctions have odd degree. Every direct road is at most $13$ km, and two roads cost at least $14$ km when $x=13$, so each paired shortest path is direct. Pairings cost $13+${z}$, $${p}+${k}$ and $${q}+${j}$; choose $${repeat(13)}$ km.`),
  P("Find the greatest whole-number value of $x$ for which the budget is achievable.",4,A.int(goal),
    R`Each direct road is no longer than any alternative: two roads including the $x$-road cost at least $6+7=13$ km, and two roads without it cost at least $14$ km. The minimum route length is $${base}+x+@min(x+${z},${p+k},${q+j})$, which increases strictly with $x$. At $x=${goal}$ it is $${B}$ km; at $x=${goal+1}$ it rises to $${base+goal+1+repeat(goal+1)}$ km. The greatest allowed value is $${goal}$.`)),
  table:{head:["Road","$AB$","$AC$","$AD$","$BC$","$BD$","$CD$"],rows:[["Length (km)","$x$",...[p,q,j,k,z].map(v=>"$"+v+"$")]]}};
});
})(typeof globalThis!=="undefined"?globalThis:this);
