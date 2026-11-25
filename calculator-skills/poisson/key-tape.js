"use strict";
window.CT42Tape=(()=>{
 const scene=[
  {entry:"poissPdf(6,6)",at:6.35,eval:11.65},
  {entry:"poissCdf(6,3,6)",at:16.2,eval:22.35},
  {entry:"1-poissCdf(6,0,6)",at:28.25,eval:34.65},
  {entry:"1-poissCdf(6,0,5)",at:39.70,eval:46.0}
 ];
 const map={"(":"lparen",")":"rparen",",":"comma","-":"minus"},keys=[];
 for(const row of scene){
  [...row.entry.toLowerCase()].forEach((ch,i)=>keys.push({at:row.at+i*.25,key:map[ch]||ch,type:"type",char:ch}));
  keys.push({at:row.eval,key:"enter",type:"evaluate"});
 }
 return Object.freeze({
  duration:50.5,starts:[0,5.7,15.5,24.7,36.5],
  titles:["Scale the mean to the interval","Calculate an exact count","Include both CDF bounds","Translate a strict right tail","Translate an inclusive right tail"],
  clips:[
   [0,"The Poisson model averages three events per ten minutes. We are counting in twenty minutes."],
   [3.1,"Double the mean. Use λ = 6 for this interval."],
   [5.7,"For exactly six events, type poissPdf(6,6) on a Calculator page."],
   [11.1,"Press Enter once to evaluate a typed command."],
   [12.2,"Exactly six has probability about 0.161."],
   [15.5,"For three to six events inclusive, type poissCdf(6,3,6)."],
   [21.65,"PDF takes one count. CDF adds every count between its two bounds."],
   [22.8,"Counts 3, 4, 5 and 6 together have probability about 0.544."],
   [24.7,"More than six excludes six. Its complement includes every count from zero through six."],
   [27.9,"Type 1 − poissCdf(6,0,6) and press Enter."],
   [35.15,"More than six has probability about 0.394."],
   [36.5,"At least six includes six. Its complement now stops at five."],
   [39.25,"Type 1 − poissCdf(6,0,5) and press Enter."],
   [46.6,"At least six has probability about 0.554. The two answers differ by the probability of exactly six."]
  ],
  hints:["3 per 10 min → 20 min","λ = 3 × (20 ÷ 10) = 6","Exactly 6 → count 6","","P(X = 6) ≈ 0.160623","Between 3 and 6 → bounds 3, 6","Both bounds are included","P(3 ≤ X ≤ 6) ≈ 0.544334","P(X > 6) = 1 − P(X ≤ 6)","CDF lower = 0 · upper = 6","P(X > 6) ≈ 0.393697","P(X ≥ 6) = 1 − P(X ≤ 5)","CDF lower = 0 · upper = 5","P(X ≥ 6) ≈ 0.554320"],
  keys
 });
})();
