/* Independent Wave 4 geometry and trig checks. */
const rad=Math.PI/180;
const checks={
 "two-roots-recover-target/result/equation":({a,b,l,u},T)=>{
  // Solve equality of the two recorded values rather than use the midpoint.
  const f=c=>Math.cos((l-c)*rad)-Math.cos((u-c)*rad);
  const c=T.bisect(f,l,u);
  T.require(l<c&&c<u&&Math.cos((l-c)*rad)<1&&Math.abs(f(c))<1e-9,"one maximum between two matching points");
  return {a:Math.round(c),b:Math.round(a*Math.cos((u-c)*rad)+b)};
 },
 "tangent-endpoint-policy/result/equation":({shift,sg,L,U,left,right},T)=>{
  const full=[];
  for(let x=L-180;x<=U+180;x++){
   if(Math.abs(Math.tan((x-shift)*rad)-sg)<1e-9)full.push(x);
  }
  const eligible=full.filter(x=>(left?x>=L:x>L)&&(right?x<=U:x<U));
  T.require(full.includes(L)&&full.includes(U),"printed interval boundaries are roots");
  T.require(full.every((x,i)=>i===0||x-full[i-1]===180),"integer angle scan finds spacing of half a turn");
  const changed=full.filter(x=>(left?x>=L-30:x>L-30)&&(right?x<=U:x<U));
  return {a:eligible.length,b:changed.length};
 },
 "fundamental-harmonic-crossings/result/equation":({m,d},T)=>{
  const f=x=>Math.cos(x)-(d+m*Math.cos(2*x)),roots=T.roots(f,-Math.PI,3*Math.PI);
  T.require(roots.length===4&&roots[0]>-Math.PI&&roots[3]<3*Math.PI,"four interior intersections in the shifted domain");
  const cosine=Math.cos(roots[0]);
  T.require(cosine>0&&cosine<1&&roots.every(x=>Math.abs(Math.cos(x)-cosine)<1e-8),"all crossings share the unique feasible cosine ratio");
  return {b:T.approx(cosine,1e-9),c:T.approx(roots.at(-1),1e-9)};
 },
 "unsigned-signal-tolerance/result/words":({a,d,h},T)=>{
  const f=x=>Math.abs(a*Math.sin(x)-d)-h,roots=T.roots(f,0,2*Math.PI);
  T.require(roots.length===4&&roots[0]>0&&roots.at(-1)<2*Math.PI,"four distinct interior trigger times");
  T.require(roots.slice(0,2).every(x=>a*Math.sin(x)>d)&&roots.slice(2).every(x=>a*Math.sin(x)<d),"sampled trigger times genuinely use both signs");
  return {b:roots.length,c:T.approx(roots[0],1e-9),d:T.approx(roots.at(-1),1e-9)};
 },
 "double-angle-recover-signed-ratio/result/equation":({numerator,den,n2},T)=>{
  const alpha=Math.asin(numerator/den),candidates=[alpha,Math.PI-alpha],options=candidates.filter(y=>Math.abs(Math.sin(2*y)-n2/(den*den))<1e-9);
  T.require(options.length===1,"only one of the two unit-circle points has the observed second sine");
  return {a:T.approx(Math.cos(options[0]),1e-9),b:T.approx(Math.cos(2*options[0]),1e-9)};
 },
 "double-angle-interval-compatibility/result/words":({a,b,y},T)=>{
  const l=Math.asin(a),h=Math.asin(b),cos=x=>Math.cos(2*x);
  const samples=Array.from({length:321},(_,i)=>cos(l+(h-l)*i/320)),lo=Math.min(...samples),hi=Math.max(...samples);
  const c=y>=lo&&y<=hi,w=c?T.bisect(x=>cos(x)-y,l,h):0;
  T.require(a>0&&b<1&&a<b&&Math.min(Math.abs(y-lo),Math.abs(y-hi))>.02,"compatibility is not sensitive to last-digit rounding");
  T.require(!c||Math.abs(cos(w)-y)<1e-9,"a compatible reading has an actual angle witness");
  return {a:T.approx(lo,1e-9),b:T.approx(hi,1e-9)};
 },
 "annular-ribbon-from-two-edges/result/words":({e,J,K},T)=>{
  const inner=J*e/(K-J),outer=inner+e,theta=K/outer;
  T.require(inner>0&&theta>0&&theta<Math.PI&&Math.abs(J-inner*theta)<1e-9,"both printed arc lengths consistent with a unique minor sector");
  const surface=T.integrate(r=>r*theta,inner,outer,100);
  return {a:T.approx(theta,1e-9),b:T.approx(inner,1e-9),c:T.approx(surface,1e-8)};
 },
 "two-overlapping-circular-sweeps/result/words":({a,b,d},T)=>{
  const x=(a*a-b*b+d*d)/(2*d),y=Math.sqrt(a*a-x*x);
  const al=Math.atan2(y,x),be=Math.atan2(y,d-x);
  T.require(d>a-b&&d<a+b&&x>0&&x<d&&y>0,"two transversal crossings and two minor, not major, segments");
  // Polar substitution in the vertical strip integral through each cap.
  const strip=(r,u)=>T.integrate(v=>2*(r*Math.sin(v))**2,0,u,1800);
  const area=strip(a,al)+strip(b,be);
  T.require(area>0&&area<Math.PI*a*a,"real overlap occupies a proper fraction of both disks");
  return {a:T.approx(2*al,1e-9),b:T.approx(2*be,1e-9),c:T.approx(area,1e-7),d:T.approx(100*(1-area/(Math.PI*a*a)),1e-7)};
 },
 "fraction-turn-to-degrees/result/words":({u,d},T)=>{
  const al=Math.atan2(Math.sin(2*Math.PI*u/d),Math.cos(2*Math.PI*u/d))/rad;
  const angle=Math.round((al+360)%360);
  T.require(angle>0&&angle<360,"a proper turn yields one angle strictly between endpoints");
  return {a:angle};
 },
 "quarter-cycle-model-direction/result/table":({q,m,b,shift},T)=>{
  const rootResidual=t=>Math.sin(2*Math.PI*(2*q)/t);
  const per=T.bisect(rootResidual,3*q,6*q);
  const y=m+b,z=(y-m)/Math.sin(2*Math.PI*q/per);
  T.require(per>3*q&&per<6*q&&Math.abs(rootResidual(per))<1e-8,"the two crossing times have successive opposite local directions");
  return {a:Math.round(per),b:Math.round(z)};
 },
 "compass-turn-wrap/result/words":({start,sweep},T)=>{
  const ang=Math.atan2(Math.sin((start+sweep)*rad),Math.cos((start+sweep)*rad))/rad;
  T.require(start>270&&ang>0&&ang<90&&sweep<180,"one clockwise wrap across north into the first sector");
  return {a:Math.round(ang)};
 },
};
export default Object.fromEntries(Object.entries(checks).map(([id,verify])=>["w4-t3-"+id,(q,T)=>verify(q.params,T)]));
