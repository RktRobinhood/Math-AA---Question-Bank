/* Independent Wave 5 solutions recomputed from each native question's params. */
const checks={},r=(id,rep,calc)=>checks["w5-number-"+id+"/reasoning/"+rep]=(q,T)=>calc(q.params,T,q);
r("signed-bin-model","words",({sum,d,big},T)=>{
 const pairs=[];for(let a=0;a<=sum;a++){const b=sum-a;if((big?a-b:b-a)===d)pairs.push([a,b]);}
 T.require(pairs.length===1&&pairs[0].every(n=>n>0),"both constraints select one positive integer pair");
 const [a,b]=pairs[0];T.require((big?b-a:a-b)!==d&&a+b!==d,"distracting equations both fail");
 return {a:T.option("correct")};
});
r("cubic-missing-column","equation",({coefficients},T,q)=>{
 // Evaluate each printed coefficient option; only the intended polynomial matches at four inputs.
 const a=q.parts[0].answer;
 const matches=a.options.map(str=>{
  const n=(str.match(/-?\d+/g)||[]).map(Number);
  const value=(v,x)=>v.reduce((sum,e)=>sum*x+e,0);
  return n.length===4&&[-2,-1,0,2].every(x=>value(n,x)===value(coefficients,x));
 });
 T.require(matches.filter(Boolean).length===1,"one solver list matches the original polynomial");
 return {a:T.option(a.values[matches.indexOf(true)])};
});
r("weighed-swap","words",({p,q,k,u,v,W,change},T)=>{
 const hits=[];
 for(let s=1;s<=30;s++)for(let l=s+1;l<=30;l++)
  if(p*s+q*l===W&&(p-k)*s+(q+k)*l===W+change)hits.push([s,l]);
 T.require(hits.length===1,"only one integer mass pair predicts both weighs");
 const [s,l]=hits[0];return {a:l,b:s,c:u*s+v*l};
});
r("recover-polynomial-record","table",({b,d,v},T)=>{
 const test=(x,c)=>x*x*x+b*x*x+c*x+d;
 const fits=Array.from({length:351},(_,i)=>i-230).filter(c=>test(v,c)===0);
 T.require(fits.length===1,"one coefficient matches the verified zero");
 const c=fits[0],hits=Array.from({length:51},(_,i)=>i-25).filter(x=>test(x,c)===0);
 T.require(hits.length===3&&hits[1]===v,"three distinct verified integer zeros, including the supplied middle one");
 return {a:c,b:hits[0],c:hits[2]};
});
r("upper-tolerance-budget","words",({t,p},T)=>{
 let x=100*t;while((x+1-100*t)*100<=p*t*100)x++;
 return {a:x/100};
});
r("fin-loan-input-sign","words",({years,annual,loan},T)=>{
 const vec=[loan,...Array.from({length:years*annual},()=>-loan/(years*annual))];
 T.require(vec[0]>0&&vec.slice(1).every(x=>x<0),"repayment inflow/outflow differs from upfront loan");
 return {a:vec.length-1,b:T.option("negative")};
});
r("fund-balancing-gift","words",({n,p,dep,gift},T)=>{
 const final=(start,deposit)=>{let balance=start;for(let y=1;y<=n;y++)balance=balance+balance*p/100+deposit;return balance;};
 const total=final(gift,dep), extra=(total-final(0,dep))/final(0,1);
 T.require(extra>0&&Math.abs(final(0,dep+extra)-total)<1e-8,"replacement cash flow balances");
 return {a:T.approx(total,1e-8),b:T.approx(extra,1e-8)};
});
r("matrix-order-dimensions","words",({pp,qq},T,q)=>{
 const pq=pp[1]===qq[0],qp=qq[1]===pp[0];
 T.require(pq!==qp,"exactly one order is defined");
 const target=pq?"PQ":"QP", sz=pq?[pp[0],qq[1]]:[qq[0],pp[1]];
 const answer=q.parts[0].answer, possible=answer.options.map(s=>s.includes(target)&&String(s.match(/\d+/g))===String(sz));
 T.require(possible.filter(Boolean).length===1,"one printed option has correct order and dimensions");
 return {a:T.option(answer.values[possible.indexOf(true)])};
});
r("matrix-det-sign-control","equation",({a,b,c,target},T)=>{
 // Columns are parallel exactly when ratios agree. Recover inverse second column from A v = e_2.
 const singular=b*(c/a),x0=-b/a;
 const t=Array.from({length:81},(_,i)=>i-20).find(x=>a*x-b*c===target),balance=c*x0+t;
 T.require(a!==0&&Number.isInteger(t)&&Math.abs(balance)>0.5,"determinant target gives a single nonsingular integer setting");
 return {a:singular,b:t,c:1/balance};
});
r("power-scale-cancellation","words",({power,den,td,v,t},T)=>{
 const original=(v,t)=>Math.exp(power*Math.log(v)/den-Math.log(t)/td);
 const unchanged=original(729,196);
 return {a:original(729*v,196)/unchanged,b:original(729*v,196*t)/unchanged};
});
r("eigenmode-tolerance","equation",({p,q,w,rate,step},T)=>{
 const h=(1-rate)/2,j=(1+rate)/2,advance=([a,b])=>[h*a+j*b,j*a+h*b];
 let x=[p+q,p-q],cycle=0,earliest=null,delta;
 while(cycle<100&&(delta===undefined||earliest===null)){
  const diff=x[0]-x[1];
  if(cycle===step)delta=diff;
  if(earliest===null&&Math.abs(diff)<=w)earliest=cycle;
  x=advance(x);cycle++;
 }
 T.require(earliest!==null&&delta!==undefined,"computed first feasible iterate and sample difference");
 return {a:T.approx(delta,1e-10),b:earliest};
});
export default checks;
