/* Independent Wave 5 references: exhaustive counts, rank distance and convolution. */
const sum=a=>a.reduce((x,y)=>x+y,0),list=n=>Array.from({length:n},(_,i)=>i);
const ranks=a=>{const order=[...a].sort((x,y)=>x-y);return a.map(v=>order.indexOf(v)+1);};
const coeff=rows=>{
 const x=ranks(rows.map(z=>z[0])),y=ranks(rows.map(z=>z[1])),n=rows.length;
 return 1-6*sum(x.map((v,i)=>(v-y[i])**2))/(n*(n*n-1));
};
const forms={
 "rank-agreement-pattern":(q,T)=>{
  const {a,b}=q.params,coef=coeff(a.map((x,i)=>[x,b[i]]));
  T.require(new Set(a).size===a.length&&new Set(b).size===b.length,"two complete untied rankings");
  return {a:T.option(coef===1?"same":coef===-1?"reverse":"neither")};
 },
 "coefficient-target-selection":(q,T)=>{
  const {caseId}=q.params;
  T.require(Number.isInteger(caseId)&&caseId>=0&&caseId<=8,"valid qualitative evidence case");
  const k=[{spearman:true},{pearson:true},{neither:true},{spearman:true},{pearson:true},{neither:true},{spearman:true},{pearson:true},{neither:true}];
  return {a:T.option(Object.keys(k[caseId])[0])};
 },
 "rank-update-new-pair":(q,T)=>{
  const {rows,newRow}=q.params,updated=rows.concat([newRow]);
  const rankColumns=z=>[0,1].map(i=>ranks(z.map(row=>row[i])));
  const [x0,y0]=rankColumns(rows),[x1,y1]=rankColumns(updated);
  const affected=x0.filter((x,i)=>x1[i]!==x&&y1[i]!==y0[i]).length;
  T.require(x1.at(-1)>1&&x1.at(-1)<updated.length&&y1.at(-1)>1&&y1.at(-1)<updated.length&&coeff(rows)<1&&coeff(updated)<1,"interior insertion preserves prior discordance");
  return {a:x1.at(-1),b:y1.at(-1),c:affected,d:T.option("no")};
 },
 "rank-export-tie-check":(q,T)=>{
  const {sx,sy,shownX,shownY,chosen}=q.params;
  function group(a){
   const out=new Map();
   [...a].sort((x,y)=>x-y).forEach((v,i)=>out.set(v,(out.get(v)||[]).concat(i+1)));
   return a.map(v=>sum(out.get(v))/out.get(v).length);
  }
  const x=group(sx),y=group(sy),delta=sum(x)-sum(shownX);
  T.require(delta>0&&shownY[chosen]!==y[chosen]&&[...sx,...sy].every(Number.isInteger),"the export defects are real and the chosen row is affected");
  return {a:delta,b:y[chosen],c:x.reduce((n,k,i)=>n+Number(k!==shownX[i]||y[i]!==shownY[i]),0)};
 },
 "rank-audit-missing-pair":(q,T)=>{
  const {known,newX,slots,shown}=q.params;
  const fits=slots.filter(y=>Math.abs(coeff(known.concat([[newX,y]]))-shown)<.00005);
  T.require(fits.length===1&&new Set(slots).size===3&&slots.every(y=>known.every(z=>y!==z[1]&&newX!==z[0])),"only one complete untied record matches the reported rounded coefficient");
  const missing=fits[0],ry=ranks(known.map(z=>z[1]).concat([missing]));
  const rejected=slots.filter(y=>y!==missing).sort((a,b)=>a-b);
  return {a:missing,b:ry.at(-1),c:coeff(known.concat([[newX,rejected[0]]]))};
 },
 "systematic-periodic-start":(q,T)=>{
  const {pattern,blocks,start}=q.params,m=pattern.length,timeline=Array.from({length:blocks},()=>pattern).flat();
  const texts=pattern.map((_,offset)=>timeline.filter((_,i)=>(i-offset)%m===0));
  T.require(texts.every(h=>h.length===blocks)&&texts.some(h=>h.every(Boolean))&&texts.some(h=>!h.some(Boolean)),"systematic samples all same size and nonrepresentative for each possible start");
  return {a:sum(texts[start-1]),b:texts.filter(h=>h.every(Boolean)).length/m,c:T.option("period")};
 },
 "sample-frame-duplicate-entries":(q,T)=>{
  const {onlyA,onlyB,both}=q.params,cats=[[...list(onlyA).map(i=>"a"+i),...list(both).map(i=>"c"+i)],[...list(onlyB).map(i=>"b"+i),...list(both).map(i=>"c"+i)]].flat();
  const distinct=[...new Set(cats)],overlap=z=>z.filter(name=>name.startsWith("c")).length/z.length;
  T.require(overlap(cats)>overlap(distinct)&&overlap(cats)<1,"duplicate records increase overlap group's probability");
  return {a:distinct.length,b:overlap(cats),c:overlap(distinct)};
 },
 "stratified-capacity-exact":(q,T)=>{
  const {pop,caps,cost,budget}=q.params,s=sum(pop),allow=list(s).map(i=>i+1).filter(n=>pop.every(v=>n*v%s===0));
  const allocation=n=>pop.map(v=>n*v/s),spend=n=>sum(allocation(n).map((v,i)=>v*cost[i]));
  const fit=allow.filter(n=>allocation(n).every((v,i)=>v<=caps[i])&&spend(n)<=budget);
  T.require(fit.length>1&&fit.length<allow.length&&caps.every((v,i)=>v<pop[i]),"integer proportional sample exists and constraints bind");
  const max=fit.at(-1);
  return {a:allow[0],b:max,c:allocation(max)[1]};
 },
 "overlapping-quota-feasibility":(q,T)=>{
  const {n,a,b,cap,t}=q.params;
  const feasible=[];
  for(let x=0;x<=cap;x++)for(let u=0;u<=n-x;u++){
   const v=a-x,z=n-x-u-v;
   if(v>=0&&z>=0&&u+x===b)feasible.push({x,z,cost:x*t[0]+v*t[1]+u*t[2]+z*t[3]});
  }
  const costs=feasible.map(r=>r.cost).sort((a,b)=>a-b);
  T.require(feasible.length>=3&&costs[0]<costs[1]&&t.every(x=>x>0),"multiple exact-margin designs with a unique minimum and positive service times");
  return {a:Math.min(...feasible.map(z=>z.x)),b:costs[0]/100,c:T.option("quota")};
 },
 "rounded-p-value-audit":(q,T)=>{
  const {level,cases}=q.params,answer={};const alpha=level/100;
  for(const [[_,r],i] of cases.map((z,i)=>[z,i])){
   const possibilities=[r/1000-.00049,r/1000+.00049].map(x=>x<alpha);
   answer[String.fromCharCode(97+i)]=T.option(possibilities.every(Boolean)?"below":possibilities.some(Boolean)?"edge":"above");
  }
  T.require(new Set(cases.map(x=>x[1])).size===3,"each displayed value occupies a distinct part of the decision cases");
  return answer;
 },
 "poisson-two-interval-composition":(q,T)=>{
  const {rate1,rate2,t1,t2}=q.params,means=[rate1*t1/60,rate2*t2/60],pmf=(m,k)=>list(k).reduce((p,j)=>p*m/(j+1),Math.exp(-m)), [a,b]=means;
  const terms=[0,1,2].map(k=>pmf(a,k)*pmf(b,2-k)),total=sum(terms);
  T.require(total>0&&total<1&&terms.every(v=>v>0),"all decompositions of total two have positive weight");
  return {a:total,b:terms[1],c:terms[1]/total};
 },
};
const tables=new Set(["rank-agreement-pattern","rank-update-new-pair","rank-export-tie-check","rank-audit-missing-pair","systematic-periodic-start","sample-frame-duplicate-entries","stratified-capacity-exact","overlapping-quota-feasibility","rounded-p-value-audit"]);
export default Object.fromEntries(Object.entries(forms).map(([slug,v])=>["w5-statistics-"+slug+"/solve/"+(tables.has(slug)?"table":"words"),v]));
