"use strict";
window.CT42Tape=(()=>{
 const scene=[
  {entry:"poissPdf(6,6)",at:12.0,eval:19.4},
  {entry:"poissCdf(6,3,6)",at:26.5,eval:35.6},
  {entry:"1-poissCdf(6,0,6)",at:50.0,eval:55.95},
  {entry:"1-poissCdf(6,0,5)",at:68.0,eval:74.0}
 ];
 const map={"(":"lparen",")":"rparen",",":"comma","-":"minus"},keys=[];
 for(const row of scene){
  [...row.entry.toLowerCase()].forEach((ch,i)=>keys.push({at:row.at+i*.34,key:map[ch]||ch,type:"type",char:ch}));
  keys.push({at:row.eval,key:"enter",type:"evaluate"});
 }
 return Object.freeze({
  duration:83.5,starts:[0,10.9,25.3,42,61.4],
  titles:["Scale the mean to the interval","Calculate an exact count","Include both CDF bounds","Translate a strict right tail","Translate an inclusive right tail"],
  clips:[
   [0,"The Poisson model averages three events per ten minutes. We are counting in twenty minutes."],
   [6.2,"Double the mean. Use λ = 6 for this interval."],
   [10.9,"For exactly six events, type poissPdf(6,6) on a Calculator page."],
   [17.2,"Press Enter once to evaluate a typed command."],
   [21.0,"Exactly six has probability about 0.161."],
   [25.3,"For three to six events inclusive, type poissCdf(6,3,6)."],
   [31.4,"PDF takes one count. CDF adds every count between its two bounds."],
   [36.5,"Counts 3, 4, 5 and 6 together have probability about 0.544."],
   [42,"More than six excludes six. Its complement includes every count from zero through six."],
   [49.4,"Type 1 − poissCdf(6,0,6) and press Enter."],
   [56.7,"More than six has probability about 0.394."],
   [61.4,"At least six includes six. Its complement now stops at five."],
   [67.4,"Type 1 − poissCdf(6,0,5) and press Enter."],
   [74.7,"At least six has probability about 0.554. The two answers differ by the probability of exactly six."]
  ],
  hints:["3 per 10 min → 20 min","λ = 3 × (20 ÷ 10) = 6","Exactly 6 → count 6","","P(X = 6) ≈ 0.160623","Between 3 and 6 → bounds 3, 6","Both bounds are included","P(3 ≤ X ≤ 6) ≈ 0.544334","P(X > 6) = 1 − P(X ≤ 6)","CDF lower = 0 · upper = 6","P(X > 6) ≈ 0.393697","P(X ≥ 6) = 1 − P(X ≤ 5)","CDF lower = 0 · upper = 5","P(X ≥ 6) ≈ 0.554320"],
  keys
 });
})();
