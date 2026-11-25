"use strict";
window.CT13Tape=(()=>{
 const keys=[];
 const add=(t,key,delta={})=>keys.push({t,key,delta});
 const text="(x^2-4)/(x-1)";
 const map={"(":"lparen",")":"rparen","^":"power","-":"minus","/":"div"};
 Array.from(text).forEach((ch,i)=>add(.48+i*.24,map[ch]||ch,{raw:[text.slice(0,i+1),""]}));
 add(3.88,"enter",{state:"plotted",shown:1});add(4.79,"tab",{state:"entry",slot:1});
 add(5.25,"0",{raw:[text,"0"]});add(5.91,"enter",{state:"plotted",shown:2});
 add(9.11,"menu",{state:"menu",menuIndex:0});add(10.08,"6",{state:"submenu",subIndex:0});add(11.19,"4",{state:"lower",cursor:-2});
 add(13.11,"neg",{draft:"−"});add(13.49,"3",{draft:"−3",cursor:-3});add(14.30,"enter",{state:"upper",low:-3,draft:""});
 add(15.51,"neg",{draft:"−"});add(15.94,"1",{draft:"−1",cursor:-1});add(16.81,"enter",{state:"result",high:-1,draft:"",count:1});
 add(20.1,"menu",{state:"menu",menuIndex:0,low:null,high:null});add(20.84,"6",{state:"submenu",subIndex:0});add(21.55,"4",{state:"lower",cursor:2});
 add(22.16,"1",{draft:"1",cursor:1});add(22.45,"dot",{draft:"1."});add(22.75,"5",{draft:"1.5",cursor:1.5});add(23.28,"enter",{state:"upper",low:1.5,draft:""});
 add(24.34,"3",{draft:"3",cursor:3});add(25.14,"enter",{state:"result",high:3,draft:"",count:2});
 add(29.4,"",{excluded:true,low:null,high:null});
 return Object.freeze({
  duration:51,starts:[0,8.6,19.5,29.4,36.5,45.1],
  titles:["Plot both sides","Bracket the first crossing","Bracket the second crossing","Find the exclusion","Test the intervals","Write the solution"],
  captions:[
   [0,"Plot f₁(x) = (x² − 4)/(x − 1) in Graphs."],
   [4.5,"Press Tab. Plot f₂(x) = 0. We want f₁(x) ≤ f₂(x), for −4 ≤ x ≤ 4."],
   [8.6,"Open Menu → 6: Analyze Graph → 4: Intersection."],
   [12.6,"Bracket the first crossing from −3 to −1. Confirm each bound."],
   [17.1,"The first crossing is x = −2. Record it."],
   [19.5,"Run Intersection again. Bracket the second crossing from 1.5 to 3."],
   [25.6,"The second crossing is x = 2. Record it."],
   [29.4,"The denominator x − 1 is zero at x = 1. That point is undefined, not an intersection."],
   [33.4,"Split the domain at −2, 1 and 2. Check one value in each interval."],
   [36.5,"At x = −3, f₁ is below f₂. At x = 0, it is above."],
   [40.3,"At x = 1.5, f₁ is below f₂ again. At x = 3, it is above."],
   [45.1,"Include equal points at −2 and 2 because the sign is ≤. Leave x = 1 out."],
   [48.2,"At the domain edge x = −4, f₁ is below f₂, so include −4 too."]
  ].map(([t,text])=>({t,text})),
  keys
 });
})();
