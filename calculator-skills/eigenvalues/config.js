"use strict";
globalThis.StatsLesson=(()=>{
const M=EigenLessonMath;
const keys={"+":"plus","-":"minus","*":"mul","/":"div","^":"power","(":"lparen",")":"rparen",".":"dot"};
const tape=(start,dt,text)=>[...text].map((c,i)=>[Number((start+dt*i).toFixed(3)),keys[c]||c]);
return {
 id:"CT25",app:"Calculator",name:"Eigenvalues and long-run behaviour",duration:74,
 demo:{a:4,b:1,c:2,d:3},assigned:{a:4,b:4,c:1,d:4},
 intro:"Find the two roots, match each with its own eigenvector, and compare magnitudes rather than signed values.",
 input:[["a","Top-left entry"],["b","Top-right entry"],["c","Bottom-left entry"],["d","Bottom-right entry"]],
 answers:[["low","Lower eigenvalue"],["high","Higher eigenvalue"],["lowv","Vector for lower λ: x,y"],["highv","Vector for higher λ: x,y"],["dominant","Largest |λ|",[
  ["low","Lower λ"],["high","Higher λ"],["tie","Equal magnitudes"]]]],
 validate:M.validate,
 task:()=>"Find both eigenvalues, give one nonzero eigenvector for each, and compare their magnitudes.",
 grade(data,s,a){
  const f=M.facts(data),[lo,hi]=f.roots;
  if(!M.demonstrated(data,f,s.history))return "Enter four calculations on the handheld: a+d, ad−bc, and the two quadratic-formula roots. Show the two terms before each sum or difference.";
  if(!M.near(M.inputNumber(a.low),lo)||!M.near(M.inputNumber(a.high),hi))return "Check the roots of λ² − trace·λ + det = 0, in increasing numerical order.";
  if(!M.isVector(data,lo,M.parseVector(a.lowv)))return "For the lower eigenvalue, enter nonzero x,y such that Av = λv. Any nonzero rescaling can work.";
  if(!M.isVector(data,hi,M.parseVector(a.highv)))return "For the higher eigenvalue, check both rows of Av = λv. Its eigenvector is a different direction.";
  if(a.dominant!==f.dom)return "Compare absolute values, not signed eigenvalues. Equal magnitudes give no single dominant direction.";
  return "";
 },
 success:"Correct. An eigenvector component scales by λⁿ over n steps; a negative λ reverses it at each step.",
 notes:"For A = [a b; c d], the characteristic equation is λ² − (a + d)λ + (ad − bc) = 0. To find a vector, use a nonzero row of (A − λI)v = 0. Use the second row if the first vanishes. Each eigenvector is nonzero and may be rescaled. Under repeated multiplication, a component on an eigenvector scales by λⁿ. A larger |λ| eventually dominates the relative direction only when that component is present initially and there is no tie in |λ|. Its sign controls flips, and |λ| controls growth or decay. This lesson uses Calculator arithmetic rather than the optional eigen commands; the reconstructed LCD shows decimals for irrational values. On the physical CX II-T with Exact Arithmetic enabled, Ctrl+Enter requests a decimal. Supported inputs: 2×2 whole entries from −20 to 20 and two distinct real roots.",
 refs:[["TI CX II-T features","https://education.ti.com/en-au/products/calculators/graphing-calculators/ti-nspire-cx-ii-cx-ii-cas"],["TI family eigen commands","https://education.ti.com/en/customer-support/knowledge-base/ti-nspire-family/product-usage/34032"],["IB AI guide (AHL 1.15)","https://ibo.org/globalassets/new-structure/university-admission/pdfs/dp-mathematics-applications-and-interpretation-guide-en.pdf#page=39"]],
 chapters:["Read the matrix","Find the trace","Find the determinant","Form the quadratic","Take the square root","Find the lower root","Find the upper root","Verify the first row","Verify the second row","Match the other eigendirection","Distinguish long-run behaviour"],
 captions:[
 [0,"Start from a two-by-two matrix. We will use its characteristic equation, not an eigenvalue menu.","A = [ 4  1 ; 2  3 ]"],
 [5,"Add the main diagonal entries for the trace.","Trace: 4 + 3"],
 [11,"For the determinant, subtract the product off the diagonal from the product on it.","Det: 4 × 3 − 1 × 2"],
 [20,"The characteristic equation is lambda squared minus seven lambda plus ten. Find its discriminant.","λ² − 7λ + 10 = 0 · Δ = 7² − 4×10"],
 [27.8,"For the square root, press Ctrl + x². Enter 9, then Right to leave the slot.","√9 = 3"],
 [31,"The discriminant is 9. Take its square root, 3, and subtract it from the trace before dividing by two.","Lower root: (7 − 3) ÷ 2"],
 [40,"Use plus three instead. The matching upper root is five.","Higher root: (7 + 3) ÷ 2"],
 [49,"For λ = 5, the first row of Av = λv gives y = x. Set x = 1 to get (1,1).","First entry: 4 × 1 + 1 × 1"],
 [56,"The second entry is also 5, so Av = (5,5) = 5v. Any nonzero multiple of v works.","Second entry: 2 × 1 + 3 × 1"],
 [64,"For λ = 2, the first row gives y = −2x. For v = (1,−2), Av = (2,−4).","Match each vector to its own λ."],
 [69,"Five has the larger magnitude. Its direction dominates only if the starting vector has a component there.","λⁿ scales each component · λ < 0 flips it"]],
 keys:[...tape(6,.76,"4+3"),[8.8,"enter"],...tape(12,.82,"4*3-1*2"),[18,"enter"],
 ...tape(21,.75,"7*7-4*10"),[27.2,"enter"],
 [28,"ctrl"],[28.5,"square"],[29,"9"],[29.5,"right"],[30,"enter"],
 ...tape(31.6,.69,"(7-3)/2"),[37.1,"enter"],...tape(41,.69,"(7+3)/2"),[46.6,"enter"],
 ...tape(49.5,.65,"4*1+1*1"),[54.35,"enter"],...tape(56.8,.65,"2*1+3*1"),[61.55,"enter"]]
};
})();
