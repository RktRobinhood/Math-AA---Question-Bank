"use strict";
window.CT34Tape=Object.freeze({
 duration:49,
 chapters:[[0,"Start with paired data"],[5,"Name the new column"],[12,"Transform the response"],[23,"Run a linear fit"],[35,"Interpret slope and intercept"],[41,"Return to the y-scale"]],
 captions:[
 [0,"Each response is positive, so we can take its natural logarithm.","AI HL · an exponential model, so log y only"],
 [5,"Move to column C’s name cell. Call the new list lny.","Name → lny. The cell just below is for a formula."],
 [12,"In the formula cell, press Ctrl + eˣ for ln(, then enter yval and close the bracket.","ln(yval) · do not change the original column"],
 [19,"Enter calculates every log in the new column. Keep the same pairing by row.","Move left to xval before opening the statistics menu."],
 [23,"On Lists & Spreadsheet, choose Menu → Statistics → Stat Calculations → Linear Regression (mx+b).","Menu → 4 → 1 → 3, not Logarithmic Regression"],
 [28,"Keep xval as X. In the Y menu choose lny. Press Enter to fit the transformed response.","X = xval · Y = lny · result columns D and E"],
 [35,"The slope is ln(2) and the intercept is ln(3). The saved line predicts ln(y).","ln(y) ≈ 0.693147x + 1.09861"],
 [41,"Exponentiate the slope and intercept to get the multiplier and initial value. Use the original y-scale for predictions.","A = eᵇ = 3 · B = eᵐ = 2 · y = 3 · 2ˣ"],
 [46,"A log-log power fit would transform x too. Do not use that workflow for this exponential example.","Semi-log: x, ln(y) · log-log: ln(x), ln(y)"]
 ],
 keys:[[5.22,"right"],[5.66,"right"],[6.11,"up"],[6.57,"up"],[7.21,"l"],[7.62,"n"],[8.03,"y"],[8.51,"enter"],
 [12.18,"ctrl"],[12.64,"exp"],[13.31,"y"],[13.72,"v"],[14.13,"a"],[14.54,"l"],[15.01,"rparen"],[19.21,"enter"],[20.19,"left"],[20.77,"left"],
 [23.38,"menu"],[24.42,"4"],[25.18,"1"],[25.95,"3"],[28.28,"tab"],[28.86,"right"],[29.45,"right"],[30.05,"right"],[30.80,"tab"],[32.65,"enter"]]
});
