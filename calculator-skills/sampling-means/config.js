"use strict";
window.StatsLesson=(()=>{
const normal=window.NspireNormal, display=x=>String(Number(x.toPrecision(7))).replace(/-/g,"−");
const bound=x=>x==="−∞"?-Infinity:x==="∞"?Infinity:x;
const boundText=x=>typeof x==="string"?x:display(x);
function sample(d){
 const {mean,sd,n,lower,upper,population}=d;
 if(![mean,sd,n].every(Number.isFinite)||!Number.isFinite(lower)&&lower!=="−∞"||!Number.isFinite(upper)&&upper!=="∞")return "Use finite population inputs and ordered bounds.";
 if(sd<=0)return "Population σ must be positive.";
 if(!Number.isInteger(n)||n<1||n>100000)return "Use a sample size that is a whole number from 1 to 100,000.";
 if(!(bound(lower)<bound(upper)))return "The lower bound must be below the upper bound.";
 if(population!=="normal"&&n<=30)return "For this unknown-shape CLT exercise, use n > 30. That is the IB exam convention, not a universal guarantee.";
 return "";
}
return {
 id:"CT43",name:"Sampling means and the CLT",app:"Calculator",duration:54,title:"Normal Cdf",
 intro:"Use the spread of sample means, not the spread of individual values.",
 demo:{mean:80,sd:12,n:36,lower:78,upper:83,population:"skew"},
 assigned:{mean:120,sd:14,n:49,lower:117,upper:124,population:"normal"},
 input:[["mean","Population mean μ"],["sd","Population SD σ"],["n","Sample size n"],["lower","Lower bound (or -inf)"],["upper","Upper bound (or inf)"],["population","Population shape",[["normal","Normal"],["skew","Non-normal / unknown shape"]]]],
 answers:[["se","Standard error"],["p","Probability"],["basis","Normality",[["exact","Exact (normal population)"],["clt","Approximate (CLT)"]]]],
 menu:[["1: Actions","2: Number","3: Algebra","4: Calculus","5: Probability","6: Statistics"],["1: Factorial","2: Permutations","3: Combinations","4: Random","5: Distributions"],["1: Normal Pdf","2: Normal Cdf","3: Inverse Normal","4: t Pdf","5: t Cdf"]],
 path:["5","5","2"], fields:[["Lower Bound","−∞"],["Upper Bound","∞"],["μ","0"],["σ","1"]],
 choices:{}, twoEnter:true, setup:null,
 task:d=>"Independent observations: μ = "+display(d.mean)+", σ = "+display(d.sd)+", n = "+d.n+". Find P("+boundText(d.lower)+" < X̄ < "+boundText(d.upper)+"). Population: "+(d.population==="normal"?"normal.":"not assumed normal."),
 validate:sample,
 evaluate(v,num){
  const [lower,upper,mean,sd]=v.map((r,i)=>i<=1&&/^[−-]?∞$/.test(r)?(r.startsWith("−")||r.startsWith("-")?-Infinity:Infinity):num(r));
  if(mean===null||sd===null||!(sd>0)||lower===null||upper===null||!(lower<upper))throw Error("Enter ordered bounds, a finite mean, and σ greater than zero.");
  const p=normal.normalMass({lower,upper,mean,sd});
  if(p===0)throw Error("This nonzero tail is below the simulator’s numerical range.");
  return {lower,upper,mean,sd,p};
 },
 command:v=>"normCdf("+v.join(",")+")",
 display:r=>[["Probability",display(r.p)]],
 grade(d,r,a,match){
  const se=d.sd/Math.sqrt(d.n);
  if(!match(String(r.sd),se)||r.mean!==d.mean||r.lower!==bound(d.lower)||r.upper!==bound(d.upper))return "Use the assigned interval and population mean, but put the standard error in the σ box.";
  if(!match(a.se,se))return "Check σ divided by the square root of n.";
  const actual=normal.normalMass({lower:bound(d.lower),upper:bound(d.upper),mean:d.mean,sd:se});
  if(!match(a.p,actual)&&!match(a.p,r.p))return "Check the area for this interval using the standard error.";
  if(a.basis!==(d.population==="normal"?"exact":"clt"))return "Decide whether normality is exact from the population, or a large-sample approximation.";
  return "";
 },
 success:"Correct. The centre stays μ; the spread of the sample mean is σ/√n.",
 notes:"Normal population → exact normal sample mean (for independent observations). For a non-normal population with finite variance, the CLT is an approximation and convergence depends on shape; the current IB guide takes n > 30 as sufficient in exams. Enter standard deviation σ/√n into Normal Cdf, not variance σ²/n. For a one-sided event, leave its unused bound at the calculator’s infinity default.",
 refs:[["TI CX II-T workbook (p. 69)","https://education.ti.com/-/media/ti/education/images/products/product-details/ti-nspire/au-qld-cx-ii-t/qce-mm-trb-for-cx-ii-t-2025.pdf"],["IB AI guide (AHL 4.15)","https://www.ibo.org/globalassets/new-structure/university-admission/pdfs/dp-mathematics-applications-and-interpretation-guide-en.pdf"]],
 captions:[
 [0,"We want an average, not one observation. Independent population readings have mean 80 and standard deviation 12.","n = 36 · population is mildly skewed"],
 [6,"The sample mean keeps the same centre. Its spread is the standard error: 12 divided by the square root of 36.","μ = 80 · σ/√n = 2"],
 [12,"For this large sample, the CLT gives an approximately normal mean. A normal population would give an exact normal mean.","Use the sample-mean distribution"],
 [18.6,"On a Calculator page, open Probability, Distributions, then Normal Cdf.","Menu → 5 → 5 → 2"],
 [24,"Enter the lower and upper bounds of the interval.","78 < X̄ < 83"],
 [33,"Keep the mean at 80. Enter 2 as the standard deviation of the mean, not 12 and not the variance 4.","Normal Cdf: μ = 80 · σ = 2"],
 [42,"Enter inserts the command, then Enter again evaluates it.","normCdf(78,83,80,2)"],
 [48,"The chance is about 0.775 under the normal approximation. In Try, decide whether your model is exact or approximate.","P(78 < X̄ < 83) ≈ 0.775"]],
 keys:[[19,"menu"],[20.3,"5"],[21.5,"5"],[22.6,"2"],[25,"7"],[26,"8"],[27,"tab"],[29,"8"],[30,"3"],[31,"tab"],[34,"8"],[35,"0"],[36.4,"tab"],[38,"2"],[43,"enter"],[45,"enter"]]
};
})();
