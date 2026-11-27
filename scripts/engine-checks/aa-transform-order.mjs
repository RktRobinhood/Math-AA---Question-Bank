// Verify by searching for the inputs that map back to the original point.
// After shrink alone the original input is k*t. Undoing a translation
// first subtracts d; undoing the stretch first multiplies by k.
export default {
  "fn-concept-transform-order/point-both-orders/equation": (q, T) => {
    const { x, y, shift: d, scaleDenominator: k } = q.params;
    T.require(q.calculator === false && q.level === 2, "a hand-method Level 2 scaffold");
    T.require([2, 3, 4].includes(k) && d !== 0 && [x, y, d].every(Number.isInteger),
      "a proper horizontal scale factor and nonzero translation");
    const search = inverse => {
      const matches = T.range(-24, 24).filter(t => inverse(t) === x);
      T.require(matches.length === 1, "each inverse point mapping has one integer input");
      return matches[0];
    };
    const a = search(t => k * t);
    const b = search(t => k * (t - d));
    const c = search(t => k * t - d);
    T.require(new Set([a, b, c]).size === 3, "the three requested coordinates distinguish the steps");
    return { a, b, c };
  },
};
