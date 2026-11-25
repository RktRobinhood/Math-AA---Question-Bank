"use strict";
globalThis.StatsLesson=(()=>{
const M=BinomialTest;
const fmt=x=>String(Number(x.toPrecision(8))).replace(/-/g,"−");
return {
 id:"CT50",name:"Exact binomial hypothesis test",app:"Calculator",duration:59,title:"Binomial Cdf",
 intro:"Use the null probability and include the observed count in the correct tail.",
 demo:{n:16,p0:.25,k:8,side:"gt",alpha:.05},
 assigned:{n:14,p0:.55,k:5,side:"lt",alpha:.05},
 input:[["n","Independent trials n"],["p0","Null success probability p₀"],["k","Observed successes"],["side","Alternative claim",[["gt","p > p₀ (higher)"],["lt","p < p₀ (lower)"]]],["alpha","Significance α (as a proportion)"]],
 answers:[["lower","Lower bound"],["upper","Upper bound"],["pvalue","p-value"],["decision","Decision",[["reject","Reject H₀"],["retain","Do not reject H₀"]]]],
 menu:[["1: Actions","2: Number","3: Algebra","4: Calculus","5: Probability","6: Statistics","7: Matrix & Vector","8: Finance"],["1: Factorial","2: Permutations","3: Combinations","4: Random","5: Distributions"],["⋮","D: Binomial Pdf","E: Binomial Cdf","F: Inverse Binomial"]],
 path:["5","5","e"],fields:[["Num Trials",""],["Probability of Success",""],["Lower Bound",""],["Upper Bound",""]],
 choices:{},twoEnter:true,setup:null,validate:M.validate,
 task:d=>d.k+" successes in "+d.n+" independent trials. Test H₀: p = "+d.p0+" against p "+(d.side==="gt"?">":"<")+" "+d.p0+" at α = "+d.alpha+".",
 evaluate(v,num){
  const values=v.map(num);
  if(values.some(x=>x===null))throw Error("Enter all four fields.");
  const [n,p0,lo,hi]=values,p=M.mass(n,p0,lo,hi);
  if(p===0&&p0>0&&p0<1)throw Error("This nonzero probability is below the trainer’s numerical range.");
  return {n,p0,lo,hi,p};
 },
 command:v=>"binomCdf("+v.join(",")+")",display:r=>[["Tail probability",fmt(r.p)]],
 grade(d,r,a,match){
  const [lo,hi]=M.bounds(d);
  if(r.n!==d.n||r.p0!==d.p0)return "Use the null success probability p₀, not the sample proportion.";
  if(r.lo!==lo||r.hi!==hi||!/^\d+(?:\.0+)?$/.test(a.lower.trim())||!/^\d+(?:\.0+)?$/.test(a.upper.trim())||Number(a.lower)!==lo||Number(a.upper)!==hi)return "The tail must include the observed count and go in the direction of the alternative.";
  if(!match(a.pvalue,r.p))return "Read the cumulative probability for the complete tail, not the probability of one count.";
  if(a.decision!==M.exactDecision(d.n,d.p0,lo,hi,d.alpha))return "Compare the unrounded p-value with α. Here, reject only when p-value < α.";
  return "";
 },
 success:"Correct. The observation and all results more extreme in the chosen direction are included.",
 notes:"Assume a fixed number of independent binary trials with the same probability under H₀. The current IB AI HL guide assesses exact binomial tests one-sided only. For a strict critical region, this lesson rejects when the unrounded p-value is below α; equality is not below. A large p-value is not proof that H₀ is true. There is no continuity correction for an exact binomial calculation.",
 refs:[["TI Binomial Cdf (KB 29570)","https://education.ti.com/en/customer-support/knowledge-base/ti-nspire-family/product-usage/29570"],["IB AI guide (AHL 4.18)","https://ibo.org/globalassets/new-structure/university-admission/pdfs/dp-mathematics-applications-and-interpretation-guide-en.pdf#page=68"]],
 chapters:["Choose hypotheses","Select the upper tail","Open Binomial Cdf","Use the null probability","Enter inclusive bounds","Calculate p","Make the decision","Transfer to a lower tail"],
 captions:[
 [0,"Eight of 16 independent checks pass. Does the pass rate exceed the usual 25%?","H₀: p = 0.25 · Hₐ: p > 0.25"],
 [6.4,"Higher is the alternative, so look at eight or more. Include the observed eight.","Under H₀: X ~ Bin(16, 0.25) · P(X ≥ 8)"],
 [13,"On a Calculator page choose Probability, Distributions, then Binomial Cdf.","Menu → 5 → 5 → E"],
 [20,"Enter 16 trials and the null probability 0.25, not the sample proportion 8/16.","Num Trials: 16 · Probability: 0.25"],
 [31,"Set the lower bound to 8 and the upper bound to 16. Both are included.","CDF bounds: 8 … 16"],
 [40,"Enter inserts the command. Enter again finds the whole upper tail.","binomCdf(16,0.25,8,16)"],
 [46,"The tail probability is about 0.0271. It is below 0.05: reject H₀.","Evidence that the pass rate exceeds 25%."],
 [52,"For a lower alternative, count from zero through the observation. The LCD still shows the upper-tail example.","Lower alternative → P(X ≤ observed)"]],
 keys:[[13.8,"menu"],[15,"5"],[16.3,"5"],[18,"e"],[21,"1"],[22,"6"],[23,"tab"],[24,"0"],[25,"dot"],[26,"2"],[27,"5"],[29,"tab"],[32,"8"],[34,"tab"],[36,"1"],[37,"6"],[41,"enter"],[44,"enter"]]
};
})();
