/* Original AA Practice scaffold: track one point through each transform order.
 * Each operation is given, so comparing the orders cannot be confused with finding
 * another equivalent decomposition of the very same graph. */
(function (root) {
  "use strict";
  const E = root.QBEngine;
  const { ans, fmt } = E;
  const { point, signed, frac } = fmt;
  const P = (prompt, marks, answer, working) => ({ prompt, marks, answer, working });
  E.register({
    type: "fn-concept-transform-order", unknown: "point-both-orders", representation: "equation",
    format: "value", levels: [2], home: "aa-sl", courses: ["aa-sl", "aa-hl"], notFor: ["ai-sl", "ai-hl"], syllabus: ["2.11"],
    skills: ["SL2.11.image-point", "SL2.11.composite-transform"],
    title: "What changes when you swap the order?",
    build({ rng }) {
      const scaleDenominator = rng.pick([2, 3, 4]);
      const anchorUnits = rng.nonzero(-4, 4);
      const shiftUnits = rng.nonzero(-3, 3);
      const y = rng.nonzero(-8, 8);
      const x = scaleDenominator * anchorUnits;
      const shift = scaleDenominator * shiftUnits;
      const stretchThenShift = anchorUnits + shift;
      const shiftThenStretch = anchorUnits + shiftUnits;
      const direction = shift > 0 ? "right" : "left";
      return {
        params: { scaleDenominator, x, y, shift },
        stem: `The point $\\mathrm{A}${point(x, y)}$ is on the graph of $y=f(x)$. A horizontal stretch has scale factor $${frac(1, scaleDenominator)}$. A translation moves points $${Math.abs(shift)}$ units to the ${direction}.`,
        parts: [
          P("Find the $x$-coordinate of the image of $\\mathrm{A}$ after the stretch alone.", 1, ans.int(anchorUnits), [
            `The stretch divides the $x$-coordinate by $${scaleDenominator}$, so it becomes $\\dfrac{${x}}{${scaleDenominator}} = ${anchorUnits}$.`
          ]),
          P("Find the $x$-coordinate after doing the stretch first, then the translation.", 1, ans.int(stretchThenShift), [
            `After the stretch the coordinate is $${anchorUnits}$. Apply the translation to that coordinate.`,
            `$x = ${anchorUnits} ${signed(shift)} = ${stretchThenShift}$.`
          ]),
          P("Find the $x$-coordinate if the translation is done first, then the stretch.", 2, ans.int(shiftThenStretch), [
            `First translate: $x = ${x} ${signed(shift)} = ${x + shift}$.`,
            `Now stretch: $x = \\dfrac{${x + shift}}{${scaleDenominator}} = ${shiftThenStretch}$.`,
            "The orders give different $x$-coordinates. Neither move changes the $y$-coordinate."
          ])
        ]
      };
    }
  });
})(typeof window !== "undefined" ? window : globalThis);
