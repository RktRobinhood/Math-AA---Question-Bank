"use strict";
(function(){
const T=d=>d.split(" ");
const chunks=[
 [1.35,.01,["templates"]],[2,.34,Array(7).fill("right")],[4.7,.1,["enter"]],[6.2,.54,T("2 enter")],
 [8,.48,T("x square right neg 2 ctrl eq right right right enter x ctrl eq right enter 1")],
 [18.1,.48,T("down left x plus 2 right 1 ctrl eq right right right enter x ctrl eq right right right enter 3")],
 [28.2,.1,["enter"]]
];
const keys=chunks.flatMap(([start,step,list])=>list.map((key,i)=>[Number((start+step*i).toFixed(3)),key]));
window.CT15Tape=Object.freeze({
 duration:43,keys,
 chapters:[[0,"Choose the template"],[5.4,"Set two pieces"],[7.8,"Enter the first rule"],[17.6,"Enter the second rule"],[28.2,"Plot and inspect the endpoints"],[34,"Check the join"]],
 captions:[
 [0,"In Graphs, press the template key. Select the n-piece function template.",""],
 [5.4,"Set the number of pieces to two and press Enter.",""],
 [7.8,"Type the first expression. Move right to its condition. Ctrl + = opens inequality symbols.",""],
 [14,"Use ≤ to include an endpoint and < to leave it out. The first rule does not include x = 1.",""],
 [17.6,"Move down to the second row. Enter its expression, then move right to its condition.",""],
 [25.5,"Include x = 1 in the second condition, so only one rule owns the join.",""],
 [28.2,"Press Enter to graph. The graph only exists where the conditions allow it.","Study overlay: hollow dots exclude an endpoint; filled dots include it."],
 [34,"At the join, read the inequality before using the expression.","Study overlay: x = 1 belongs to x + 2, so f(1) = 3. The hollow dot is not its value."],
 [39,"Both outer endpoints are included. Outside the restricted domain the function is undefined.","Study overlay: f(−2) = 4 and f(3) = 5. No value at x = −3 or x = 4."]
 ]
});
})();
