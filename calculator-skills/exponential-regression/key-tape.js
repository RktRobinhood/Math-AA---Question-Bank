"use strict";
window.CT33Tape=Object.freeze({
 duration:52,
 chapters:[[0,"Check the paired readings"],[6,"Open Exponential Regression"],[13,"Assign X and Y"],[24,"Read a and b"],[38,"Interpolate or extrapolate?"]],
 captions:[
 [0,"Each row records dough volume at one hour. Every volume must be positive because ExpReg fits ln(y).","X: hour · Y: positive reading"],
 [6,"Open Statistics, then Stat Calculations. Press the letter A, even if the option is below the visible list.","Menu → 4 → 1 → A"],
 [13,"Use the right arrow and Tab. Set xval as the X List and yval as the Y List.","X predicts · Y responds"],
 [20,"Use each pair once. Save to f1 and keep the results in C and D. Press Enter.","f1 · Frequency List 1"],
 [24,"Read a and b. The value a is the estimate at x = 0. It need not equal the measurement there.","a ≈ 24.294 · b ≈ 1.50682"],
 [30,"A one-unit rise in x multiplies the estimate by b. Here that is about a 50.7% increase.","Model: ŷ = a · bˣ"],
 [34.8,"The r and r² rows assess the line fitted to x and ln(y), not the raw readings.","r² ≈ 0.999347 on the log scale"],
 [38,"At x = 2.5 the input is inside the observed span. Substituting gives an interpolation.","2.5 lies between 0 and 4 · ŷ ≈ 67.7"],
 [44,"At x = 6 the input is outside the observed span. The model can predict, but the trend may not continue.","x = 6 · ŷ ≈ 284.4 · extrapolation"]
 ],
 keys:[[6.25,"menu"],[7.25,"4"],[8.45,"1"],[10.1,"a"],[13.2,"right"],[14.15,"tab"],[15.8,"right"],[17.1,"right"],[18.4,"tab"],[22.1,"enter"]]
});
