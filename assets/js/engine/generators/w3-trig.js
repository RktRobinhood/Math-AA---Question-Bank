(function(root){
"use strict";
const E=root.QBEngine,{ans:A,fmt:F}=E,R=String.raw,D=Math.PI/180,N=x=>A.sf(x,3),I=x=>A.int(x),S=x=>F.sf(x,3);
const P=(prompt,marks,answer,...working)=>({prompt,marks,answer,working});
const C=(r,labels,correct,why)=>A.choice(r,{text:labels[correct],value:correct},labels.flatMap((text,i)=>i===correct?[]:[{text,value:i,why}]));
function reg(id,title,home,c,skills,level,rep,build){
 E.register({type:"w3-trig-"+id,title,home,syllabus:[c],skills:skills.split(" "),levels:[level],calculator:level===4,representation:rep,unknown:"result",format:"value",build});
}
reg("ssa-perimeter-cap","Select a possible triangle using a perimeter limit","aa-sl","3.5","SL3.5.ambiguous-case",3,"words",({rng:r})=>{
 const k=r.int(2,14),t=r.pick([45,60]),sin=t===45?R`\sqrt{2}`:R`\sqrt{3}`;
 const labels=[R`$${t}^{\circ}$`,R`$${180-t}^{\circ}$`,"Both angles","Neither angle"];
 // For t=45, c_short/k=(sqrt(6)-sqrt(2))/2; c_long/k=(sqrt(6)+sqrt(2))/2.
 // For t=60, c_short/k=1; c_long/k=2.
 const cs=t===45?R`\dfrac{${k}(\sqrt{6}-\sqrt{2})}{2}` : String(k),
 cl=t===45?R`\dfrac{${k}(\sqrt{6}+\sqrt{2})}{2}` : String(2*k);
 // Exact perimeter bounds: 2k < short < 4k < long < 5k.
 const factor=r.pick([2,4,5]),cap=factor*k, answer=factor===2?3:factor===4?1:2;
 return {params:{k,t,cap},stem:R`In triangle $\mathrm{ABC}$, $A=30^{\circ}$, $\mathrm{BC}=${k}$ centimetres and $\mathrm{AC}=${k}\,${sin}$ centimetres. A frame built around the triangle must have perimeter at most $${cap}$ centimetres.`,parts:[
  P("Find the larger of the two possible angles at $B$, in degrees, before applying the frame limit.",2,I(180-t),R`The sine rule gives $\sin B=\dfrac{${sin}}{2}$. Its solutions in this triangle are $${t}^{\circ}$ and $${180-t}^{\circ}$.`),
  P("Which of the possible angles at $B$ can be used for the frame?",3,C(r,labels,answer,"Find the third side for each possible angle and compare the complete perimeters."),R`The third angle is $150^{\circ}-B$. The sine rule gives lengths $2(${k})\sin(150^{\circ}-B)$, namely $${cl}$ for $B=${t}^{\circ}$ and $${cs}$ for $B=${180-t}^{\circ}$.`,R`Adding the two fixed sides gives $2(${k})<P_{\mathrm{short}}<4(${k})<P_{\mathrm{long}}<5(${k})$. ${t===45?"For example, square the bounds $1.4<\\sqrt{2}<1.5$ and $2.4<\\sqrt{6}<2.5$ to check the comparisons.":"The bounds follow from $1<\\sqrt{3}<2$."}`,R`Compare the perimeter bound to $${cap}$. ${factor===2?"Neither triangle fits.":factor===4?"Only the triangle with the larger angle at $B$ fits.":"Both triangles fit."}`)
 ]};
});
reg("intercept-a-bearing","Recover a missing sailing distance from a required final bearing","aa-sl","3.3","SL3.3.bearings SL3.3.multi-triangle",4,"words",({rng:r})=>{
 const u=r.int(6,23),a=r.int(24,49),b=r.int(62,81), x=u*Math.sin(a*D),y=u*Math.cos(a*D),w=y*Math.tan(b*D)-x;
 const f=y/Math.cos(b*D);
 return {params:{u,a,b},stem:R`A boat leaves harbour $O$ and travels $${u}$ km on a bearing of $0${a}^{\circ}$ to $P$. It then travels due east to $Q$. The bearing of $Q$ from $O$ is $0${b}^{\circ}$.`,parts:[
  P("Find the distance from $P$ to $Q$ in kilometres, to three significant figures.",3,N(w),R`The north component stays $${u}\cos${a}^{\circ}$ on the eastward leg. The east component of $OQ$ equals this north component multiplied by $\tan${b}^{\circ}$.`,R`Subtract the east component $${u}\sin${a}^{\circ}$ of $OP$ to get $PQ\approx${S(w)}\,\mathrm{km}$.`),
  P("Find the direct distance from the harbour to $Q$, to three significant figures.",2,N(f),R`Divide the unchanged north component by $\cos${b}^{\circ}$ to obtain $OQ\approx${S(f)}\,\mathrm{km}$.`)
 ]};
});
reg("same-travel-different-sweep","Compare two sweep areas when the tips travel equally far","ai-hl","3.7","AI-AHL3.7.arc-length AI-AHL3.7.sector-area",3,"words",({rng:r})=>{
 const k=r.int(3,14),p=r.pick([2,3,4,5]),q=p+r.int(1,4),v=r.int(2,6),s=k*v;
 return {params:{k,p,q,v},stem:R`Two arms start at fixed pivots. Their lengths are $${k*p}$ cm and $${k*q}$ cm. Each tip travels exactly $${s}$ cm along its own circle, without completing a full turn.`,parts:[
  P("Find the exact turning angle of the longer arm in radians.",2,A.frac(v,q),R`Divide the arc length by the longer radius: $\theta=${F.frac(s,k*q)}=${F.frac(v,q)}$.`),
  P("Find the exact ratio of the shorter arm’s swept area to the longer arm’s swept area. Enter the ratio as a fraction.",2,A.frac(p,q),R`For either arm the swept area is $\dfrac12r^{2}\theta=\dfrac12rs$. Since $s$ is fixed, compare the radii, not their squares. The ratio is $${F.frac(p,q)}$.`),
  P("Find the exact difference between the swept areas, in square centimetres.",2,A.frac(s*k*(q-p),2),R`Subtract the areas: $\dfrac12(${k*q}-${k*p})(${s})=${F.frac(s*k*(q-p),2)}\,\mathrm{cm}^{2}$.`)
 ]};
});
reg("rising-baseline-crossing","Find when a falling oscillation meets a rising baseline","aa-sl","3.7","SL3.7.model-context",4,"equation",({rng:r})=>{
 const h=r.int(8,20),a=r.int(3,8),p=r.int(16,36),d=r.int(1,8)/10,b=r.int(11,35)/100;
 const f=x=>h+a*Math.cos(2*Math.PI*x/p),g=x=>h+d+b*x;
 let l=0,u=p/4;
 for(let i=0;i<56;i++){const m=(l+u)/2;if(f(m)>g(m))l=m;else u=m;}
 const x=(l+u)/2;
 return {params:{h,a,p,d,b},stem:R`A sensor on a floating buoy has height $f(t)=${h}+${a}\cos\!\left(\dfrac{2\pi t}{${p}}\right)$. A rising reference marker has height $g(t)=${Number((h+d).toFixed(1))}+${b}t$. Heights are in metres and $t$ is in seconds. Consider $0\le t\le ${F.frac(p,4)}$.`,parts:[
  P("Which statement explains why there cannot be two intersections on this interval?",1,C(r,["Both heights decrease at the same rate.","The sensor height decreases and the reference height increases.","Both heights are periodic.","The two heights start at the same value."],1,"Compare the direction in which each height changes on the given interval."),R`The cosine argument increases from $0$ to $\pi/2$, so the sensor height strictly decreases. The reference height strictly increases.`),
  P("Use technology to find when the heights are equal, to three significant figures. State which command and interval you used in your working.",3,N(x),R`Graph both models in radian mode. Use the graph intersection command, selecting the crossing inside the stated interval, to obtain $t\approx${S(x)}$.`),
  P("Find their common height, to three significant figures.",1,N(g(x)),R`Use the ordinate of the intersection or substitute the unrounded time into either model: $${S(g(x))}\,\mathrm m$.`)
 ]};
});
})(typeof window==="undefined"?globalThis:window);
