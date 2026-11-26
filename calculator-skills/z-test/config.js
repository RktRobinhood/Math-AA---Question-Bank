"use strict";
window.StatsLesson=(()=>{
const normal=window.NspireNormal, display=x=>String(Number(x.toPrecision(7))).replace(/-/g,"−");
const alt={"lt":"Ha: μ < μ₀","ne":"Ha: μ ≠ μ₀","gt":"Ha: μ > μ₀"};
function test(mu,sd,list,side){
 if(!["lt","ne","gt"].includes(side))throw Error("Choose a supported alternative hypothesis.");
 if(mu===null||sd===null||!(sd>0))throw Error("Enter the null mean μ₀ and a known population σ greater than zero.");
 if(!Array.isArray(list)||list.length<2||list.some(v=>!Number.isFinite(v)))throw Error("The list needs at least two finite observations.");
 const n=list.length,xbar=list.reduce((s,x)=>s+x,0)/n,z=(xbar-mu)/(sd/Math.sqrt(n));
 if(!Number.isFinite(z))throw Error("The resulting z statistic is outside this lesson’s numerical range.");
 const p=z===0?(side==="ne"?1:.5):side==="lt"?normal.standardMass(-Infinity,z):side==="gt"?normal.standardMass(z,Infinity):Math.min(1,2*normal.standardMass(Math.abs(z),Infinity));
 if(p===0)throw Error("This nonzero p-value is below the simulator’s numerical range.");
 return {mu,sd,side,n,xbar,z,p};
}
return {
 id:"CT45",name:"One-sample z-test",app:"Lists & Spreadsheet",duration:57,title:"z Test",
 intro:"Known population σ only. Choose the alternative before you compare p with α.",
 demo:{mu:50,sd:4,list:[45,46,47,44,48,47,46,45,46],side:"lt",alpha:.05},
 assigned:{mu:100,sd:6,list:[104,102,103,106,101,104,103,101,103],side:"ne",alpha:.10},
 input:[["mu","Null mean μ₀"],["sd","Known population σ"],["list","Independent observations (comma-separated)"],["side","Alternative",[["lt","μ < μ₀"],["ne","μ ≠ μ₀"],["gt","μ > μ₀"]]],["alpha","Significance level α"]],
 answers:[["z","z statistic"],["p","p-value"],["decision","Decision",[["reject","Reject H₀"],["retain","Do not reject H₀"]]]],
 menu:[["1: Actions","2: Insert","3: Data","4: Statistics","5: Function Table"],["1: Stat Calculations","2: Distributions","3: Confidence Intervals","4: Stat Tests"],["1: z Test","2: t Test","3: 2-Sample z Test","4: 2-Sample t Test","5: 1-Prop z Test"]],
 path:["4","4","1"],fields:[["μ₀",""],["σ",""],["List","a[]"],["Frequency List","1"],["Alternate Hyp",alt.ne],["1st Result Column","b[]"],["Draw","☐ Shade P Value"]],
 choices:{2:["a[]","readings","b[]"],4:[alt.lt,alt.ne,alt.gt]},twoEnter:false,setup:"Data Input Method",
 task:d=>"Independent sample from a normal population. Test H₀: μ = "+display(d.mu)+". "+alt[d.side]+"; known σ = "+display(d.sd)+", α = "+display(d.alpha)+".",
 validate:d=>!Number.isFinite(d.mu)||!Number.isFinite(d.sd)||d.sd<=0?"Use a finite null mean and strictly positive known σ.":!Array.isArray(d.list)||d.list.length<2||d.list.length>12?"Enter two to twelve finite readings.":!(d.alpha>0&&d.alpha<1)?"Use a significance level between zero and one.":"",
 evaluate(v,num,d){if(!["a[]","readings"].includes(v[2]))throw Error("Choose the list in column A; column B has no observations.");return test(num(v[0]),num(v[1]),d.list,Object.keys(alt).find(k=>alt[k]===v[4]));},
 command:()=>"",
 display:r=>[["Title","z Test"],["z",display(r.z)],["P Value",display(r.p)],["x̄",display(r.xbar)],["n",String(r.n)]],
 grade(d,r,a,match){
  if(r.mu!==d.mu||r.sd!==d.sd||r.side!==d.side)return "Run the assigned null mean, known σ and alternative. The alternative chooses the tail.";
  if(!match(a.z,r.z))return "Check z, including its sign.";
  if(!match(a.p,r.p))return "Check the p-value for the selected alternative; a two-sided test uses both tails.";
  if(a.decision!==(r.p<=d.alpha?"reject":"retain"))return "Compare p with the stated α. Do not replace ‘do not reject’ with ‘accept’.";
  return "";
 },
 success:"Correct. This is a decision about evidence against H₀, not proof that either hypothesis is true.",
 captions:[
 [0,"A normal population has known standard deviation 4. Test whether its mean is below 50 using an independent sample.","H₀: μ = 50 · Hₐ: μ < 50"],
 [6,"Use a z test because population σ is known. Choose the less-than alternative before seeing the test result.","Known σ = 4 · α = 0.05"],
 [12,"The independent observations are already in column A. Open the one-sample z Test.","Menu → 4 → 4 → 1"],
 [18,"Choose Data because the individual readings are already in a named list.","Data Input Method: Data"],
 [24,"Enter the null mean 50 and the known population standard deviation 4. Then choose readings for List.","μ₀ = 50 · σ = 4"],
 [36,"Keep frequency at 1. Change the alternative to less than. Leave the optional graph unchecked.","Hₐ: μ < μ₀ · Enter runs"],
 [47,"Under H₀, the chance of z = −3 or lower is about 0.00135. The test counted nine observations from the list.","0.00135 < 0.05 · reject H₀"],
 [52,"There is evidence that the mean is below 50. A two-sided alternative uses both tails.","Rejecting H₀ does not prove Hₐ."]],
 keys:[[12.4,"menu"],[13.3,"4"],[14.5,"4"],[16,"1"],[21,"enter"],[24.4,"5"],[25.5,"0"],[26.7,"tab"],[28.3,"4"],[29.5,"tab"],[31.1,"right"],[32.25,"right"],[33.5,"tab"],[36.35,"tab"],[37.8,"right"],[39.3,"left"],[40.6,"tab"],[44,"enter"]]
};
})();
