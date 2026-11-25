/* Independent native verification of the Wave 4 Topic 1 families. */
const verifiers={}, add=(id,rep,f)=>verifiers["w4-t1-"+id+"/reasoning/"+rep]=(q,T)=>f(q.params,T,q);
add("place-value-repair","equation",({a,e},T)=>{
 const x=a*10**e;
 const hits=Array.from({length:25},(_,i)=>i-12).filter(k=>Math.abs((a/10)*10**k/x-1)<1e-10);
 T.require(hits.length===1,"exactly one exponent preserves the value and normalized leading factor");
 return {a:hits[0]};
});
add("load-minimum","words",({e,a,b,m},T)=>{
 const grains=BigInt(a)*10n**BigInt(e)+BigInt(b)*10n**BigInt(e),bag=BigInt(m)*10n**BigInt(e);
 let n=0n;while(n*bag<grains)n++;
 return {a:Number(grains/(10n**BigInt(e))),b:Number(n)};
});
add("remaining-value-rate","words",({v,w},T)=>{
 const possible=Array.from({length:101},(_,i)=>i).filter(i=>v*(100-i)===100*w);
 T.require(possible.length===1&&w<v,"one positive depreciation rate matches both readings");
 return {a:possible[0]};
});
add("divisibility-condition","equation",({m,n,b},T)=>{
 const acceptedY=[];for(let y=-12;y<=12;y++){if(Array.from({length:13},(_,i)=>i-6).every(x=>(4*m*x+2*b*y+4*n)%4===0))acceptedY.push(y);}
 T.require(acceptedY.length&&acceptedY.every(y=>y%2===0)&&acceptedY.some(y=>y%4!==0),"condition enforces evenness, but not divisibility by four");
 return {a:T.option("even")};
});
add("pascal-mirror-position","equation",({n,k},T)=>{
 let coeff=[1];for(let j=0;j<n;j++)coeff=Array.from({length:coeff.length+1},(_,i)=>(coeff[i-1]||0)+(coeff[i]||0));
 const hits=coeff.map((a,i)=>a===coeff[k]&&i!==k?i:null).filter(a=>a!==null);
 T.require(hits.length===1,"exactly one distinct position has that coefficient");
 return {a:hits[0]};
});
add("repair-geometric-record","table",({x,y,wrong},T)=>{
 const alternatives=[-4,-3,-2,-1,1,2,3,4];
 const r=alternatives.find(z=>x*z===y);
 let input=-20;while(input<21&&input*r!==x)input++;
 T.require(input<=20&&wrong!==input,"given first reading differs from the only corrected value");
 return {a:r,b:input};
});
add("reroute-infinite-pool","words",({p,q,allocated},T)=>{
 let x=p,total=0;for(let i=0;i<300;i++){total+=x;x*=q/4;}
 let subtotal=1,y=1;for(let i=1;i<300;i++){y*=.5;subtotal+=y;}
 T.require(total>allocated&&subtotal===2,"new geometric amount is positive");
 return {a:total,b:(total-allocated)/subtotal};
});
add("log-display-tolerance","words",({k,h,offset},T)=>{
 const transform=x=>k*Math.log10(x)+offset;
 const bis=(v)=>{let a=.01,b=100;for(let i=0;i<80;i++){const m=(a+b)/2;if(transform(m)<v)a=m;else b=m;}return (a+b)/2;};
 const a=(Math.round(10*h)*10-5)/100,b=a+.1,lo=bis(a),hi=bis(b);
 T.require(transform(lo-1e-7)<a&&transform(hi+1e-7)>b&&lo<hi,"true intensity boundaries straddle an increasing interval");
 return {a,b:T.approx(lo,1e-10),c:T.approx(hi,1e-10)};
});
add("possible-side-count","words",({L0,W0,p},T)=>{
 const round=x=>10*Math.floor((x+5)/10), hits=[];
 for(let x=1;x<p/2;x++){const y=p/2-x;if(round(x)===L0&&round(y)===W0)hits.push([x,y]);}
 T.require(hits.length>0&&hits.length<=10,"one or more possible integer dimensions, bounded by the rounding cell");
 return {a:hits[0][0],b:hits.length};
});
add("alternating-retention","words",({a,m,n,target},T)=>{
 const terms=[a];
 for(let i=1;i<300;i++)terms.push(terms[i-1]*(i%2?m:n)/100);
 const total=terms.reduce((u,v)=>u+v,0);let sum=0,first=null,pair=null;
 for(let i=0;i<terms.length;i++){sum+=terms[i];if(sum>=target*total){if(first===null)first=i+1;if((i+1)%2===0){pair=(i+1)/2;break;}}}
 T.require(first>0&&pair>0&&(first===2*pair||first===2*pair-1),"first valid prefix and first valid complete pair are adjacent or equal");
 return {a:(terms[2]+terms[3])/(terms[0]+terms[1]),b:T.approx(total,1e-8),c:pair,d:first};
});
export default verifiers;
