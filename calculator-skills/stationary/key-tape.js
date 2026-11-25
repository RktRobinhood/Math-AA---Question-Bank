"use strict";
(function(){
const tape=[[1,.48,"x power 3 right minus 3 x enter"],[5.5,.6,"ctrl g shift minus"],[8,.46,"x right f 1 lparen x rparen enter"],
[13,.45,"menu 6 1 down enter"],[16,.43,"neg 2 enter 0 enter"],[22,.42,"menu 6 1 down enter"],[24.7,.44,"0 enter 2 enter"]];
window.CT52Tape=Object.freeze({
 duration:44,
 keys:tape.flatMap(([a,d,l])=>l.split(" ").map((k,i)=>[Number((a+i*d).toFixed(3)),k])),
 chapters:[[0,"Plot the original"],[5,"Graph its derivative"],[12.6,"Zero on f₂"],[19.2,"Read f₁ and both signs"],[22,"Bracket the second zero"],[30,"Classify and compare"]],
 captions:[
 [0,"On a Graphs page, enter f₁(x) and press Enter.",""],
 [5,"Press Ctrl + G for f₂. Shift + subtraction opens the first derivative template.",""],
 [8,"Enter x in the denominator box and f₁(x) in the expression box. Press Enter to graph f₂.",""],
 [12.6,"Choose Menu → 6: Analyze Graph → 1: Zero. Select f₂, the derivative, not f₁.",""],
 [15.9,"Bracket one crossing of f₂ with bounds on either side. The zero gives an x-coordinate.",""],
 [19.2,"Substitute that x into f₁. The derivative changes from positive to negative.","f₁(−1) = 2; f₂(−1.25) > 0, f₂(−0.75) < 0. Local maximum (−1, 2)."],
 [22,"Repeat Zero on f₂ with a separate bracket around the second crossing.",""],
 [28.3,"Evaluate the original function again. This time the derivative changes from negative to positive.","f₁(1) = −2; f₂(0.75) < 0, f₂(1.25) > 0. Local minimum (1, −2)."],
 [36,"A derivative can touch zero without changing sign. A crossing search may miss it; verify a candidate separately.","Try an example where the derivative is positive on both sides."]
 ]
});
})();
