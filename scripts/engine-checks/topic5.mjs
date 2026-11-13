// Independent answer verifiers for the Topic 5 generators, keyed by generator id.
// Derivatives are taken numerically, integrals by Simpson's rule, stationary points by root search
// on the numerical derivative: nothing here uses the rules of calculus the generators use.

// The option whose polynomial (highest power first) matches g at several points.
const polyOption = (q, label, g, T) => T.optionWhere(q, label, (cs) => [-1.5, -0.5, 0.5, 1.2, 2.3].every((x) => Math.abs(T.poly(cs, x) - g(x)) < 1e-5));
const intervalOption = (q, label, holds, a, b, T) => T.optionWhere(q, label, ([kind, lo, hi]) => T.range(-12, 12, 0.25).filter((x) => x !== a && x !== b)
  .every((x) => (kind === "in" ? x > lo && x < hi : kind === "out" ? x < lo || x > hi : kind === "below" ? x < lo : x > hi) === holds(x)));
// A number with a relative tolerance (numerical derivatives, roots and integrals).
const ap = (T, v, rel = 1e-5) => T.approx(v, rel * Math.max(1, Math.abs(v)));
// Options whose value is a list of standard terms [[coefficient, kind, k], ...] are evaluated here.
const cnum = (c) => (typeof c === "number" ? c : c.n / c.d);
const termsVal = (ts, x) => ts.reduce((s, [c, kind, k = 1]) => s + cnum(c) * (kind === "pow" ? x ** k : kind === "sin" ? Math.sin(k * x) : kind === "cos" ? Math.cos(k * x) : kind === "exp" ? Math.exp(k * x) : Math.log(x)), 0);
const XS = [0.4, 0.9, 1.3, 2.1];
const near = (a, b) => Math.abs(a - b) < 1e-5 * Math.max(1, Math.abs(b));
// The one option equal to g at several points; with deriv, the one option whose numerical derivative is g.
const termsOption = (q, label, g, T, deriv) => T.optionWhere(q, label, (ts) => XS.every((x) => near(deriv ? T.deriv((t) => termsVal(ts, t), x) : termsVal(ts, x), g(x))));
// The area between f and the axis, integrated piece by piece between the given cut points (zeros and corners).
const pieces = (T, f, cuts) => cuts.slice(1).reduce((s, c, i) => s + Math.abs(T.integrate(f, cuts[i], c)), 0);

export default {
  "t5-increasing-decreasing/interval-from-equation/equation": (q, T) => {
    const { a, b, dec } = q.params, fp = (x) => (x - a) * (x - b);
    // rebuild f by integrating f' numerically and test whether it rises or falls
    const f = (x) => T.integrate(fp, 0, x, 200), rising = (x) => f(x + 1e-3) > f(x - 1e-3);
    const zeros = T.roots(fp, -12, 12, 4800);
    T.require(zeros.length === 2, "two stationary points");
    return { a: zeros[0], b: zeros[1], c: intervalOption(q, "c", (x) => (dec ? !rising(x) : rising(x)), a, b, T) };
  },
  "t5-differentiate-polynomial/gradient-at-point/equation": (q, T) => {
    const { a, b, c, x } = q.params, f = (t) => a * t ** 4 + b * t ** 3 + c * t;
    return { a: polyOption(q, "a", (t) => T.deriv(f, t), T), b: T.approx(T.deriv(f, x), 1e-5) };
  },
  "t5-tangent-normal-equation/tangent-at-point/equation": (q, T) => {
    const { a, b, n, x } = q.params, f = (t) => (a * t + b) ** n, mm = T.deriv(f, x, 1e-4);
    T.require(a * x + b !== 0, "the bracket is not zero at the point");
    return { a: T.approx(mm, 1e-4), b: T.approx(f(x) - mm * x, 1e-3) };
  },
  "t5-tangent-normal-equation/normal-at-point/equation": (q, T) => {
    const { a, b, c, x0 } = q.params, f = (t) => a * t * t + b * t + c, mm = Math.round(T.deriv(f, x0) * 1e6) / 1e6;
    T.require(mm !== 0, "the tangent is not horizontal, so the normal has a gradient");
    // the normal's direction (1, g) is perpendicular to the tangent's (1, mm)
    return { a: f(x0), b: mm, c: f(x0) - mm * x0, d: T.bisect((g) => 1 + mm * g, -5, 5) };
  },
  "t5-differentiation-rules/product-polys/equation": (q, T) => {
    const { a, b, k, x } = q.params, f = (t) => (t * t + k) * (a * t + b);
    return { a: polyOption(q, "a", (t) => T.deriv(f, t), T), b: T.approx(T.deriv(f, x), 1e-5) };
  },
  "t5-stationary-points/stationary-points/equation": (q, T) => {
    const { k, c } = q.params, f = (x) => x ** 3 - 3 * k * k * x + c;
    const max = T.extremum(f, -k - 1.5, 0, "max", 30000), min = T.extremum(f, 0, k + 1.5, "min", 30000);
    T.require(Math.abs(T.deriv(f, max.x)) < 1e-4 && Math.abs(T.deriv(f, min.x)) < 1e-4, "both points are stationary");
    return { a: polyOption(q, "a", (t) => T.deriv(f, t), T), b: T.approx(max.x, 1e-5), c: max.value, d: min.value };
  },
  "t5-stationary-points/max-value/equation": (q, T) => {
    const { a, b, c, x1 } = q.params, f = (x) => a * x * x + b * x + c;
    const ex = T.extremum(f, -30, 30, a > 0 ? "min" : "max", 60000);
    return { a: T.approx(T.deriv(f, x1), 1e-6), b: T.approx(ex.x, 1e-5), c: ex.value };
  },
  "t5-stationary-points/nature/equation": (q, T) => {
    const { p, c, s } = q.params, f = (x) => s * (x ** 3 - 3 * p * x * x) + c;
    const zeros = T.roots((x) => T.deriv(f, x), -1, 3 * p, 40000).filter((x) => Math.abs(x) > 1e-3);
    T.require(zeros.length === 1, "one stationary point away from the origin");
    // nature at x = 0 by comparing with nearby values
    const near = f(0.01) + f(-0.01) - 2 * f(0);
    return { a: T.approx(zeros[0], 1e-5), b: T.approx(T.deriv2(f, 0), 1e-4), c: T.option(near < 0 ? -1 : 1), d: T.approx(f(Math.round(zeros[0])), 1e-9) };
  },
  "t5-optimisation-modelling/quadratic-optimum/words": (q, T) => {
    const { per } = q.params, A = (x) => x * (per / 2 - x);
    const ex = T.extremum(A, 0, per / 2, "max", 40000);
    return { b: T.approx(ex.x, 1e-5), c: ex.value };
  },
  "t5-kinematics-motion/acceleration-at-time/equation": (q, T) => {
    const { a, b, c, t, s0 } = q.params, v = (x) => a * x * x + b * x + c;
    return { a: T.approx(T.deriv(v, t), 1e-6), b: T.approx(s0 + T.integrate(v, 0, t), 1e-7) };
  },
  "t5-definite-integral-area/area-below-axis/equation": (q, T) => {
    const { p } = q.params, f = (x) => x * (x - p);
    const z = T.roots(f, 0.5, 20, 3900);
    T.require(z.length === 1, "one crossing besides the origin");
    return { a: z[0], b: T.integrate((x) => Math.abs(f(x)), 0, p) };
  },
  "t5-definite-integral-area/evaluate-polynomial/equation": (q, T) => {
    const { n, a, b } = q.params;
    return { a: T.integrate((x) => a * x ** n, 0, b) };
  },
  "t5-definite-integral-area/unknown-stretch/equation": (q, T) => {
    const { target } = q.params, I = (k, hi) => T.integrate((x) => k * x * x + k, 0, hi);
    const k = T.bisect((x) => I(x, 1) - target, 0, 50);
    return { a: k, b: I(Math.round(k), 2) };
  },
  "t5-definite-integral-area/area-above-axis/equation": (q, T) => {
    const { a, b, u } = q.params, f = (x) => a * x * x + b;
    T.require(T.extremum(f, 0, u, "min").value > 0, "the curve is above the axis on the interval");
    return { a: T.integrate(f, 0, u) };
  },
  "t5-area-between-curves/area-line-curve/equation": (q, T) => {
    const { mm } = q.params, d = (x) => mm * x - x * x;
    const z = T.roots(d, 0.5, 20, 3900);
    T.require(z.length === 1, "one meeting point besides the origin");
    return { a: z[0], b: T.integrate((x) => Math.abs(d(x)), 0, z[0]) };
  },
  "t5-area-between-curves/meeting-limits/equation": (q, T) => {
    const { c, s, k } = q.params, d = (x) => s * x + k - (x * x + c);
    const z = T.roots(d, -20, 20, 8000);
    T.require(z.length === 2, "two meeting points");
    T.require(d((z[0] + z[1]) / 2) > 0, "the line is above the curve between them");
    return { a: z[0], b: z[1], c: T.integrate((x) => Math.abs(d(x)), z[0], z[1]) };
  },
  "t5-indefinite-integral/linear-power/equation": (q, T) => {
    const { a, b, n, k } = q.params, f = (x) => k * (a * x + b) ** n;
    // A from one definite integral: A [(ax+b)^(n+1)] between two points equals the integral of f
    const x0 = 0.1, x1 = 0.6, I = T.integrate(f, x0, x1), A = I / ((a * x1 + b) ** (n + 1) - (a * x0 + b) ** (n + 1));
    // m: the power for which A (ax+b)^m differentiates back to f
    const mPow = T.range(1, 9).find((mm) => Math.abs(T.deriv((x) => A * (a * x + b) ** mm, 0.3, 1e-4) - f(0.3)) < 1e-4 * Math.max(1, Math.abs(f(0.3))));
    T.require(mPow !== undefined, "an antiderivative of the stated form exists");
    return { a: mPow, b: T.approx(A, 1e-7) };
  },

  // ---------------- 5.1 ----------------
  "t5-derivative-meaning/limit-from-table/table": (q, T) => {
    const { n, a, k } = q.params, f = (x) => (k * (x ** n - a ** n)) / (x - a);
    const cell = (s) => Number(s.replace(/[$\\,]/g, ""));
    q.table.head.slice(1).forEach((xs, i) => T.require(Math.abs(cell(q.table.rows[0][i + 1]) - f(cell(xs))) < 6e-5, "each table value is the function's value to four decimal places"));
    const est = (f(a - 1e-4) + f(a + 1e-4)) / 2;
    T.require(Math.abs(est - Math.round(est)) < 1e-4, "the limit is a whole number");
    return { a: T.approx(est, 1e-4) };
  },
  "t5-ext-gradient-from-graph/tangent-drawn/graph": (q, T) => {
    const [A, B] = q.graph.points, slope = (B.y - A.y) / (B.x - A.x), curve = (x) => T.evalGraph(q.graph.functions[0].fn, x), line = (x) => T.evalGraph(q.graph.functions[1].fn, x);
    const d = T.deriv(curve, A.x);
    T.require(Math.abs(curve(A.x) - A.y) < 1e-9 && Math.abs(line(A.x) - A.y) < 1e-9 && Math.abs(line(B.x) - B.y) < 1e-9, "A is on the curve and the line passes through A and B");
    T.require(Math.abs(d - slope) < 1e-6, "the line drawn is the tangent at A");
    T.require([A.x, A.y, B.x, B.y].every(Number.isInteger), "A and B have integer coordinates");
    return { a: T.approx(d, 1e-6) };
  },
  "t5-ext-chord-to-tangent/chord-gradients/equation": (q, T) => {
    const { a, b, c, x0 } = q.params, f = (x) => a * x * x + b * x + c, chord = (h) => (f(x0 + h) - f(x0)) / h;
    return { a: T.approx(chord(1), 1e-9), b: T.approx(chord(0.1), 1e-9), c: T.approx(T.deriv(f, x0), 1e-6) };
  },
  "t5-ext-chord-to-tangent/chord-limit/equation": (q, T) => {
    const { a, b, c, p, G1 } = q.params, f = (x) => a * x * x + b * x + c, chord = (h) => (f(p + h) - f(p)) / h;
    return { b: T.approx(T.deriv(f, p), 1e-6), c: T.approx(T.bisect((h) => chord(h) - G1, -10.3, 10.7), 1e-6) };
  },
  "t5-derivative-meaning/interpret-value/words": (q, T) => {
    const { c, A, k, t0 } = q.params, f = (t) => c + A * Math.exp(-k * t), d = T.deriv(f, t0);
    return { a: ap(T, d), b: T.option(f(t0 + 1e-3) < f(t0 - 1e-3) ? "falling-rate" : "rising-rate") };
  },
  "t5-derivative-meaning/rate-at-time/equation": (q, T) => {
    const { a, k, t1 } = q.params, C = (t) => a * t * Math.exp(-k * t);
    const top = T.extremum(C, 0, 40, "max", 8000), again = T.roots((t) => C(t) - C(t1), top.x + 0.05, 200, 20000);
    T.require(t1 < top.x - 0.1, "the first time is before the maximum");
    T.require(again.length === 1, "the concentration returns to that value exactly once after the maximum");
    return { a: ap(T, C(t1)), b: ap(T, T.deriv(C, t1)), c: T.approx(top.x, 1e-5), d: ap(T, again[0]) };
  },

  // ---------------- 5.2 ----------------
  "t5-increasing-decreasing/quadratic-interval/equation": (q, T) => {
    const { a, b, c } = q.params, f = (x) => a * x * x + b * x + c;
    return { a: T.approx(T.extremum(f, -30, 30, a > 0 ? "min" : "max", 6000).x, 1e-5) };
  },
  "t5-ext-sign-at-point/sign-at-point/equation": (q, T) => {
    const { a, b, c, k } = q.params, f = (x) => a * x ** 3 + b * x * x + c * x;
    return { a: T.approx(T.deriv(f, k), 1e-5), b: T.option(Math.sign(f(k + 1e-4) - f(k - 1e-4))) };
  },
  "t5-increasing-decreasing/parameter-shift/equation": (q, T) => {
    const { B, Cc, c } = q.params, f = (x) => x ** 3 + B * x * x + Cc * x + c, fp = (x) => T.deriv(f, x, 1e-3);
    const zeros = T.roots(fp, -12.001, 12, 4800);
    T.require(zeros.length === 2, "two stationary points");
    T.require(f((zeros[0] + zeros[1]) / 2 + 0.1) < f((zeros[0] + zeros[1]) / 2 - 0.1), "f falls between them");
    T.require([B, Cc].every(Number.isInteger), "whole-number coefficients");
    return { a: polyOption(q, "a", fp, T), b: T.approx(zeros[0], 1e-5), c: T.approx(zeros[1], 1e-5), d: T.approx(-T.extremum(fp, -12, 12, "min", 4800).value, 1e-4) };
  },
  "t5-increasing-decreasing/interval-gdc/equation": (q, T) => {
    const { b, c, d } = q.params, f = (x) => x ** 3 - b * x * x - c * x + d, fp = (x) => T.deriv(f, x, 1e-3);
    const zeros = T.roots(fp, -12.001, 12, 4800);
    T.require(zeros.length === 2, "two stationary points");
    return { a: ap(T, zeros[0]), b: ap(T, zeros[1]), c: intervalOption(q, "c", (x) => f(x + 1e-3) < f(x - 1e-3), zeros[0], zeros[1], T), d: T.approx(T.extremum(fp, -12, 12, "min", 4800).value, 1e-5) };
  },
  "t5-increasing-decreasing/interval-from-derivative-graph/graph": (q, T) => {
    const fp = (x) => T.evalGraph(q.graph.functions[0].fn, x), zeros = T.roots(fp, -6.001, 6, 4800).map((z) => Math.round(z * 1e6) / 1e6);
    T.require(zeros.length === 2 && zeros.every(Number.isInteger), "the derivative has two whole-number zeros in the window");
    const f = (x) => T.integrate(fp, 0, x, 200), rising = (x) => f(x + 1e-3) > f(x - 1e-3);
    return { a: zeros[0], b: zeros[1], c: intervalOption(q, "c", (x) => (q.params.inc ? rising(x) : !rising(x)), zeros[0], zeros[1], T) };
  },

  // ---------------- 5.3 ----------------
  "t5-differentiate-polynomial/derivative/equation": (q, T) => {
    const { n, a, c } = q.params, f = (x) => a * x ** n + c, fp = (x) => T.deriv(f, x);
    // f'(x) = p x^q: p is f'(1), and q comes from how f' grows from x = 1 to x = 2
    return { a: T.approx(fp(1), 1e-5), b: T.approx(Math.log(fp(2) / fp(1)) / Math.log(2), 1e-6) };
  },
  "t5-differentiate-polynomial/derivative-from-fraction/equation": (q, T) => {
    const { a, b, x1 } = q.params, f = (x) => a * x * x + b / x, fp = (x) => T.deriv(f, x);
    const flat = T.roots(fp, -5, 5, 4001);
    T.require(flat.length === 1, "the gradient is zero at exactly one point");
    return { a: termsOption(q, "a", fp, T), b: ap(T, fp(x1)), c: T.approx(flat[0], 1e-5) };
  },
  "t5-ext-unknown-coefficients/k-from-gradient/equation": (q, T) => {
    const { b, x0, g, x1 } = q.params, grad = (k, x) => T.deriv((t) => k * t ** 3 + b * t, x);
    const k = T.bisect((kk) => grad(kk, x0) - g, -20.5, 20.3);
    return { a: T.approx(k, 1e-5), b: T.approx(grad(Math.round(k), x1), 1e-5) };
  },
  "t5-ext-unknown-coefficients/two-from-gradient-and-point/equation": (q, T) => {
    const { x0, y0, g, x2 } = q.params, hits = [];
    // brute force over whole-number pairs
    for (let p = -12; p <= 12; p++) for (let qq = -12; qq <= 12; qq++) {
      const f = (x) => p * x ** 3 + qq * x;
      if (Math.abs(f(x0) - y0) < 1e-9 && Math.abs(T.deriv(f, x0) - g) < 1e-5) hits.push([p, qq]);
    }
    T.require(hits.length === 1, "exactly one pair of coefficients fits");
    const [p, qq] = hits[0];
    return { a: p, b: qq, c: T.approx(T.deriv((x) => p * x ** 3 + qq * x, x2), 1e-5) };
  },

  // ---------------- 5.4 ----------------
  "t5-tangent-normal-equation/read-from-tangent/equation": (q, T) => {
    const { a, mm, c } = q.params, line = (x) => mm * x + c;
    return { a: T.approx(T.deriv(line, a), 1e-6), b: line(a) };
  },
  "t5-tangent-normal-equation/tangent-to-cubic/equation": (q, T) => {
    const { b, c, x0 } = q.params, f = (x) => x ** 3 + b * x * x + c, mm = T.deriv(f, x0);
    T.require(Math.abs(mm) > 1e-6, "the tangent is not horizontal");
    return { a: T.approx(mm, 1e-5), b: T.approx(f(x0) - mm * x0, 1e-4) };
  },
  "t5-tangent-condition/x-for-gradient/equation": (q, T) => {
    const { B, Cc, d, g } = q.params, f = (x) => x ** 3 + B * x * x + Cc * x + d;
    const z = T.roots((x) => T.deriv(f, x, 1e-3) - g, -12.001, 12, 4800);
    T.require(z.length === 2, "two points have that gradient");
    T.require(z.every((x) => Math.abs(x - Math.round(x)) < 1e-5), "both are whole numbers");
    return { a: T.approx(z[0], 1e-5), b: T.approx(z[1], 1e-5) };
  },
  "t5-tangent-condition/coefficient-from-tangent/equation": (q, T) => {
    const { b, mm, c } = q.params;
    // with k = 0 the curve minus the line is least at the point of contact; k lifts that least gap to zero
    const low = T.extremum((x) => x * x + b * x - (mm * x + c), -30, 30, "min", 6000);
    return { a: T.approx(low.x, 1e-5), b: T.approx(mm * low.x + c, 1e-4), c: T.approx(-low.value, 1e-6) };
  },
  "t5-normal-meets-curve/tangent-x-intercept/equation": (q, T) => {
    const { a, k, b, x0 } = q.params, f = (x) => a * Math.exp(k * x) + b * x, mm = T.deriv(f, x0, 1e-4), L = (x) => f(x0) + mm * (x - x0);
    T.require(Math.abs(mm) > 0.4, "the tangent is not close to horizontal");
    T.require(Math.abs(f(x0)) > 0.1, "A is off the x-axis");
    const cross = T.roots(L, -100.003, 100, 2000);
    T.require(cross.length === 1, "the tangent crosses the x-axis once");
    return { a: ap(T, f(x0)), b: ap(T, mm), c: ap(T, L(0)), d: ap(T, cross[0]) };
  },

  // ---------------- 5.5 ----------------
  "t5-indefinite-integral/power-polynomial/equation": (q, T) => {
    const { n, a } = q.params, F = (x) => T.integrate((t) => a * t ** n, 0, x);
    // the antiderivative through the origin is p x^q: p is its value at 1, q is how it grows from 1 to 2
    return { a: T.approx(Math.log(F(2) / F(1)) / Math.log(2), 1e-6), b: ap(T, F(1), 1e-7) };
  },
  "t5-antiderivative-condition/poly-function/equation": (q, T) => {
    const { a, b, c, x0, y0, x1 } = q.params, fp = (x) => 3 * a * x * x + 2 * b * x + c;
    const f0 = y0 - T.integrate(fp, 0, x0);
    T.require(Math.abs(f0) > 1e-6, "the constant of integration is not zero");
    return { a: T.approx(f0, 1e-7), b: T.approx(y0 + T.integrate(fp, x0, x1), 1e-7) };
  },
  "t5-antiderivative-condition/negative-power/equation": (q, T) => {
    const { a, b, y0 } = q.params, fp = (x) => 2 * a * x + b / (x * x);
    const pick = termsOption(q, "a", fp, T, true), C = y0 - termsVal(q.parts[0].answer.values[pick.index], 1);
    T.require(Math.abs(C) > 1e-9, "the constant of integration is not zero");
    return { a: pick, b: T.approx(C, 1e-9), c: T.approx(y0 + T.integrate(fp, 1, 2), 1e-7) };
  },

  // ---------------- 5.6 ----------------
  "t5-differentiation-rules/standard-terms/equation": (q, T) => ({ a: termsOption(q, "a", (x) => T.deriv((t) => termsVal(q.params.f, t), x), T) }),
  "t5-differentiation-rules/chain-function/equation": (q, T) => {
    const fp = (x) => T.deriv((t) => termsVal(q.params.f, t), x);
    return { a: termsOption(q, "a", fp, T), b: ap(T, fp(0)) };
  },
  "t5-differentiation-rules/quotient-linear/equation": (q, T) => {
    const { a, b, c, d, x0 } = q.params, f = (x) => (a * x + b) / (c * x + d), fp = (x) => T.deriv(f, x), top = (x) => fp(x) * (c * x + d) ** 2;
    T.require(Math.abs(top(0.37) - top(1.21)) < 1e-5, "the numerator of the derivative is a constant");
    T.require(Math.abs(top(0.37)) > 1e-3, "the quotient is not a constant");
    return { a: T.approx(top(0.37), 1e-5), b: ap(T, fp(x0)) };
  },
  "t5-differentiation-rules/gradient-product/equation": (q, T) => {
    const { a, b, k } = q.params, f = (x) => (a * x + b) * Math.exp(k * x), g = (x) => T.deriv(f, x) * Math.exp(-k * x);
    // g is the linear factor px + q of the derivative
    const flat = T.roots(g, -12.001, 12, 2400);
    T.require(flat.length === 1, "one stationary point");
    return { a: T.approx(g(1) - g(0), 1e-5), b: T.approx(g(0), 1e-5), c: T.approx(flat[0], 1e-5) };
  },

  // ---------------- 5.7 ----------------
  "t5-concavity/second-derivative/equation": (q, T) => {
    const { a, b, c, d } = q.params, f = (x) => a * x ** 3 + b * x * x + c * x + d, f2 = (x) => T.deriv2(f, x);
    return { a: T.approx(f2(1) - f2(0), 1e-5), b: T.approx(f2(0), 1e-5) };
  },
  "t5-concavity/second-derivative-value/equation": (q, T) => {
    const { a, b, c, x1, up } = q.params, f = (x) => a * x ** 3 + b * x * x + c * x, f2 = (x) => T.deriv2(f, x);
    const z = T.roots(f2, -20.001, 20, 4000);
    T.require(z.length === 1, "the second derivative has one zero");
    T.require((f2(z[0] + 1) > 0) === up, "the graph is concave as stated to the right of k");
    return { a: T.approx(f2(x1), 1e-5), b: T.approx(z[0], 1e-5) };
  },

  // ---------------- 5.9 ----------------
  "t5-kinematics-motion/velocity-expression/equation": (q, T) => {
    const { a, b } = q.params, v = (t) => T.deriv((x) => a * x * x + b * x, t);
    return { a: T.approx(v(1) - v(0), 1e-6), b: T.approx(v(0), 1e-6) };
  },
  "t5-kinematics-motion/velocity-at-time/equation": (q, T) => {
    const { a, b, c, t1 } = q.params, s = (t) => a * t ** 3 + b * t * t + c * t;
    return { a: T.approx(T.deriv(s, t1), 1e-5), b: T.approx(T.deriv2(s, t1), 1e-5) };
  },
  "t5-kinematics-motion/first-at-rest/equation": (q, T) => {
    const { a, p, q: q2 } = q.params, v = (t) => a * t * t - a * (p + q2) * t + a * p * q2;
    const rest = T.roots(v, 0.001, 20, 8000);
    T.require(rest.length === 2 && v(0) !== 0, "the particle starts moving and is at rest twice");
    return { a: T.approx(rest[0], 1e-6), b: T.approx(T.deriv(v, rest[0]), 1e-5) };
  },

  // ---------------- 5.10 ----------------
  "t5-indefinite-integral/inspection-power/equation": (q, T) => {
    const { n, c, k } = q.params, g = (x) => (x * x + c) ** (n + 1), f = (x) => k * x * (x * x + c) ** n;
    const A = T.integrate(f, 0.2, 0.9) / (g(0.9) - g(0.2));
    T.require(Math.abs(T.deriv((x) => A * g(x), 0.6) - f(0.6)) < 1e-5 * f(0.6), "A g(x) differentiates back to the integrand");
    return { a: T.approx(T.deriv(g, 1) / (1 + c) ** n, 1e-5), b: T.approx(A, 1e-7), c: ap(T, T.integrate(f, 0, 1), 1e-7) };
  },
  "t5-antiderivative-condition/trig-chain/equation": (q, T) => {
    const { fp, c0, b } = q.params, d = (x) => termsVal(fp, x);
    const pick = T.optionWhere(q, "a", (ts) => near(termsVal(ts, 0), c0) && XS.every((x) => near(T.deriv((t) => termsVal(ts, t), x), d(x))));
    return { a: pick, b: ap(T, c0 + T.integrate(d, 0, Math.PI / (2 * b)), 1e-7) };
  },

  // ---------------- 5.7 ----------------
  "t5-concavity/concave-interval/equation": (q, T) => {
    const { S, Pq, c, d } = q.params, f = (x) => x ** 4 - 2 * S * x ** 3 + 6 * Pq * x * x + c * x + d, f2 = (x) => T.deriv2(f, x);
    const z = T.roots(f2, -8.001, 8, 3200);
    T.require(z.length === 2, "the second derivative has two zeros");
    T.require(f2((z[0] + z[1]) / 2) < 0, "the graph is concave down between them");
    return { a: polyOption(q, "a", f2, T), b: T.approx(z[0], 1e-5), c: T.approx(z[1], 1e-5), d: T.approx(f(Math.round(z[0])), 1e-9) };
  },
  "t5-concavity/concave-exponential/equation": (q, T) => {
    const { j, s } = q.params, f = (x) => (x + j) * Math.exp(s * x), g2 = (x) => T.deriv2(f, x) * Math.exp(-s * x);
    const z = T.roots(g2, -12.001, 12, 2400);
    T.require(z.length === 1 && Math.abs(z[0] - Math.round(z[0])) < 1e-4, "one point of inflexion, at a whole number");
    const grid = T.range(-10.25, 10.25, 0.5);
    return { a: T.approx(T.deriv(f, 0), 1e-5), b: T.approx(g2(0), 1e-4), c: T.approx(z[0], 1e-4),
      d: T.optionWhere(q, "d", ([kind, v]) => grid.every((x) => (g2(x) > 0) === (kind === "gt" ? x > v : x < v))) };
  },
  "t5-concavity/match-derivative/graph": (q, T) => {
    const f = (x) => T.evalGraph(q.graph.functions[0].fn, x), fp = (x) => T.deriv(f, x, 1e-3), f2 = (x) => T.deriv2(f, x);
    const flat = T.roots(fp, -5.001, 5, 4000), bend = T.roots(f2, -5.001, 5, 4000);
    T.require(flat.length === 2 && bend.length === 1, "two turning points and one point of inflexion in the window");
    T.require([...flat, ...bend].every((x) => Math.abs(x - Math.round(x)) < 1e-5), "they are at whole numbers");
    return { a: T.optionWhere(q, "a", (v, i, opt) => [-3.5, -2, -0.5, 0.5, 2, 3.5].every((x) => Math.abs(T.evalGraph(opt.functions[0].fn, x) - fp(x)) < 1e-4)),
      b: T.approx(flat.find((x) => f2(x) < 0), 1e-5), c: T.approx(bend[0], 1e-5) };
  },
  "t5-derivative-graph/extremum-from-derivative/graph": (q, T) => {
    const fp = (x) => T.evalGraph(q.graph.functions[0].fn, x), z = T.roots(fp, -6.001, 6, 4800);
    T.require(z.length === 2, "the derivative has two zeros in the window");
    // rebuild f by integrating the graph and compare each stationary value with its neighbours
    const f = (x) => T.integrate(fp, 0, x, 200), isMax = (x) => f(x) > f(x - 0.3) && f(x) > f(x + 0.3);
    const top = z.find(isMax), low = z.find((x) => !isMax(x)), turn = T.extremum(fp, z[0], z[1], fp((z[0] + z[1]) / 2) < 0 ? "min" : "max", 4000);
    T.require(top !== undefined && low !== undefined, "one local maximum and one local minimum");
    return { a: T.approx(top, 1e-5), b: T.approx(low, 1e-5), c: T.approx(turn.x, 1e-5) };
  },

  // ---------------- 5.8 ----------------
  "t5-stationary-points/nature/words": (q, T) => {
    const { mm, c } = q.params, fp = (x) => mm * x + c, z = T.roots(fp, -20.001, 20, 4000), f = (x) => T.integrate(fp, 0, x, 200);
    T.require(z.length === 1, "one stationary point");
    return { a: T.approx(z[0], 1e-6), b: T.option(f(z[0] + 0.5) > f(z[0]) && f(z[0] - 0.5) > f(z[0]) ? 1 : -1) };
  },
  "t5-stationary-points/inflexion-point/equation": (q, T) => {
    const { a, b, c, d } = q.params, f = (x) => a * x ** 3 + b * x * x + c * x + d, z = T.roots((x) => T.deriv2(f, x), -12.001, 12, 2400);
    T.require(z.length === 1, "one point of inflexion");
    const x = Math.round(z[0]);
    return { a: T.approx(z[0], 1e-5), b: f(x), c: T.approx(T.deriv(f, x), 1e-5) };
  },
  "t5-optimisation-modelling/box-best-cut/words": (q, T) => {
    const { a, b } = q.params, V = (x) => x * (a - 2 * x) * (b - 2 * x), best = T.extremum(V, 0, a / 2, "max", 4000);
    const flat = T.roots((x) => T.deriv(V, x, 1e-3), 0.001, b, 4000);
    T.require(flat.length === 2 && flat[1] > a / 2, "the second stationary value of x is too big for the sheet");
    return { b: T.approx(best.x, 1e-5), c: ap(T, best.value) };
  },
  "t5-optimisation-modelling/optimum-value/words": (q, T) => {
    const { open, V } = q.params, S = (x) => (open ? 1 : 2) * x * x + (4 * V) / x, best = T.extremum(S, 0.3, 40, "min", 8000);
    return { b: T.approx(best.x, 1e-4), c: T.approx(best.value, 1e-6) };
  },
  "t5-ext-closed-interval-extremes/greatest-least/equation": (q, T) => {
    const { p, q: q2, lo, hi, c } = q.params, f = (x) => 2 * x ** 3 - 3 * (p + q2) * x * x + 6 * p * q2 * x + c;
    const flat = T.roots((x) => T.deriv(f, x, 1e-3), lo + 0.001, hi - 0.0013, 4000);
    T.require(flat.length === 2, "both stationary points are strictly inside the interval");
    return { a: T.approx(flat[0], 1e-5), b: T.approx(flat[1], 1e-5), c: T.approx(T.extremum(f, lo, hi, "max", 4000).value, 1e-5), d: T.approx(T.extremum(f, lo, hi, "min", 4000).value, 1e-5) };
  },
  "t5-ext-stationary-conditions/k-from-stationary-x/equation": (q, T) => {
    const { a, h, c } = q.params, f = (k) => (x) => a * x ** 3 + k * x + c;
    const k = Math.round(T.bisect((kk) => T.deriv(f(kk), h), -200.3, 201.7) * 1e4) / 1e4;
    const flat = T.roots((x) => T.deriv(f(k), x, 1e-3), -6.001, 6, 4800).filter((x) => Math.abs(x - h) > 1e-3);
    T.require(flat.length === 1, "one other stationary point");
    return { a: T.approx(k, 1e-4), b: T.approx(f(k)(h), 1e-3), c: T.approx(flat[0], 1e-5) };
  },

  // ---------------- 5.9 ----------------
  "t5-kinematics-distance/total-distance-split/equation": (q, T) => {
    const { c, k, T: end } = q.params, v = (t) => 3 * c * t * t - 6 * c * k * t, rest = T.roots(v, 0.01, end - 0.0013, 4000);
    T.require(rest.length === 1, "the particle is at rest once inside the interval");
    return { a: T.approx(rest[0], 1e-6), b: T.approx(T.integrate(v, 0, end), 1e-7), c: T.approx(pieces(T, v, [0, rest[0], end]), 1e-6) };
  },
  "t5-kinematics-distance/total-distance-gdc/equation": (q, T) => {
    const { a, b, c, T: end, t0 } = q.params, v = (t) => a * Math.sin(b * t) - c, rest = T.roots(v, 0.001, end - 0.0013, 6000);
    T.require(rest.length >= 1, "the particle comes to rest in the interval");
    return { a: ap(T, rest[0]), b: T.approx(T.deriv(v, t0), 1e-6), c: ap(T, pieces(T, v, [0, ...rest, end])) };
  },
  "t5-kinematics-distance/distance-from-graph/graph": (q, T) => {
    const fn = q.graph.functions[0].fn, v = (t) => T.evalGraph(fn, t), ts = fn.points.map((p) => p[0]);
    const turn = T.roots(v, 0.01, ts[ts.length - 1], 5000);
    T.require(turn.length === 1, "the velocity changes sign once");
    T.require(fn.points.every((p) => p.every(Number.isInteger)), "the corners of the graph have integer coordinates");
    return { a: T.approx(T.deriv(v, q.params.t1 / 2, 1e-4), 1e-6), b: T.approx(turn[0], 1e-6), c: T.approx(pieces(T, v, ts), 1e-7) };
  },

  // ---------------- 5.5 and 5.6 with the GDC, and tables ----------------
  "t5-ext-area-under-curve/area-gdc-limits/graph": (q, T) => {
    const { a, b } = q.params, f = (x) => a + b * x - Math.exp(x), z = T.roots(f, -20.001, 8, 8000);
    T.require(z.length === 2 && f((z[0] + z[1]) / 2) > 0, "two crossings, with the curve above the axis between them");
    T.require(Math.abs(T.evalGraph(q.graph.functions[0].fn, 0.7) - f(0.7)) < 1e-9, "the graph drawn is the graph of f");
    return { a: ap(T, z[0]), b: ap(T, z[1]), c: ap(T, T.integrate(f, z[0], z[1])) };
  },
  "t5-ext-integral-gdc/gdc-value/equation": (q, T) => {
    const { fam, k, lo, hi } = q.params, f = [(x) => Math.sqrt(x ** 3 + k), (x) => Math.log(x * x + k), (x) => k * Math.exp(-x * x)][fam];
    return { a: ap(T, T.integrate(f, lo, hi, 4000), 1e-7) };
  },
  "t5-derivative-model-gdc/greatest-rate/equation": (q, T) => {
    const { L, c, k, t1 } = q.params, h = (t) => L / (1 + c * Math.exp(-k * t)), rate = (t) => T.deriv(h, t, 1e-4), best = T.extremum(rate, 0, 40, "max", 8000);
    T.require(best.x > 0.5 && best.x < 39, "the fastest growth is inside the domain");
    return { a: ap(T, h(0)), b: ap(T, rate(t1)), c: T.approx(best.x, 1e-4), d: ap(T, best.value) };
  },
  "t5-derivative-model-gdc/product-from-table/table": (q, T) => {
    const { f, g, fp, gp } = q.params;
    // functions that agree with the table: straight pieces through each tabulated point with the tabulated gradient
    const local = (v, d) => (x) => { const i = Math.min(2, Math.max(0, Math.round(x) - 1)); return v[i] + d[i] * (x - (i + 1)); };
    const F = local(f, fp), Gf = local(g, gp);
    T.require([1, 2, 3].includes(g[0]), "g(1) is a value of x in the table");
    return { a: T.approx(T.deriv((x) => F(x) * Gf(x), 2, 1e-4), 1e-6), b: T.approx(T.deriv((x) => F(Gf(x)), 1, 1e-4), 1e-6) };
  },

  // ---------------- 5.10 ----------------
  "t5-indefinite-integral/standard-exp-trig/equation": (q, T) => ({ a: termsOption(q, "a", (x) => termsVal(q.params.f, x), T, true) }),
  "t5-indefinite-integral/linear-trig/equation": (q, T) => {
    const { a, k, isSin, b, j } = q.params, f1 = (x) => k * (isSin ? Math.sin(a * x) : Math.cos(a * x)), G1 = (x) => (isSin ? Math.cos(a * x) : Math.sin(a * x));
    const f2 = (x) => j * Math.exp(b * x), G2 = (x) => Math.exp(b * x);
    const A = T.integrate(f1, 0.1, 0.6) / (G1(0.6) - G1(0.1)), B = T.integrate(f2, 0.1, 0.6) / (G2(0.6) - G2(0.1));
    T.require(near(T.deriv((x) => A * G1(x), 0.3), f1(0.3)) && near(T.deriv((x) => B * G2(x), 0.3), f2(0.3)), "each stated form differentiates back to its integrand");
    return { a: T.approx(A, 1e-7), b: T.approx(B, 1e-7) };
  },
  "t5-antiderivative-condition/rate-model/words": (q, T) => {
    const { a, k, V0, t1, target } = q.params, R = (t) => a * Math.exp(-k * t), vol = (t) => V0 + T.integrate(R, 0, t, 400);
    const limit = V0 + T.integrate(R, 0, 60 / k, 20000);
    T.require(target > V0 && target < limit - 1, "the target volume is reached");
    return { a: ap(T, vol(t1), 1e-7), b: ap(T, T.bisect((t) => vol(t) - target, 0, 60 / k, 60), 1e-6), c: T.approx(limit, 1e-5) };
  },

  // ---------------- 5.11 ----------------
  "t5-definite-integral-area/evaluate-linear/equation": (q, T) => {
    const { a, c, lo, hi } = q.params;
    return { a: T.approx(T.integrate((x) => 2 * a * x + c, lo, hi), 1e-8) };
  },
  "t5-definite-integral-area/evaluate-trig/equation": (q, T) => {
    const { a, b, c, d } = q.params;
    return { a: T.approx(T.integrate((x) => a * Math.cos(b * x), 0, Math.PI / (2 * b)), 1e-8), b: T.approx(T.integrate((x) => c * Math.sin(b * x) + d, 0, Math.PI / b), 1e-8) };
  },
  "t5-definite-integral-area/evaluate-log/equation": (q, T) => {
    const { k, a, c, p } = q.params;
    return { a: T.approx(Math.exp(T.integrate((x) => a / x, 1, k)), 1e-6), b: T.approx(Math.exp(T.integrate((x) => c / (c * x + 1), 0, p)), 1e-6) };
  },
  "t5-definite-integral-area/area-across-root/graph": (q, T) => {
    const { k, mU } = q.params, f = (x) => x * x - k * k, z = T.roots(f, 0.001, mU - 0.0013, 4000);
    T.require(z.length === 1, "the curve crosses the axis once inside the region");
    T.require(Math.abs(T.evalGraph(q.graph.functions[0].fn, 0.7) - f(0.7)) < 1e-9, "the graph drawn is the curve");
    return { a: T.approx(T.integrate(f, 0, mU), 1e-8), b: T.approx(z[0], 1e-6), c: T.approx(pieces(T, f, [0, z[0], mU]), 1e-7) };
  },
  "t5-definite-integral-area/area-gdc/graph": (q, T) => {
    const { a, k, qU } = q.params, f = (x) => a * x * Math.exp(-k * x), area = T.integrate(f, 0, qU);
    T.require(Math.abs(T.evalGraph(q.graph.functions[0].fn, 1.3) - f(1.3)) < 1e-9, "the graph drawn is the graph of f");
    return { a: ap(T, T.extremum(f, 0, 30, "max", 6000).value), b: ap(T, area, 1e-7), c: ap(T, T.bisect((mm) => T.integrate(f, 0, mm, 400) - area / 2, 0, qU, 60), 1e-6) };
  },
  "t5-definite-integral-area/unknown-upper-limit/equation": (q, T) => {
    const { b, N } = q.params, I = (k) => T.integrate((x) => 2 * x + b, 0, k, 200), z = T.roots((k) => I(k) - N, 0.01, 40, 4000);
    T.require(z.length === 1, "exactly one positive limit fits");
    return { a: T.optionWhere(q, "a", (cs) => [0.7, 1.9, 3.2].every((k) => near(T.poly(cs, k), I(k)))), b: T.approx(z[0], 1e-6) };
  },
  "t5-ext-integral-properties/linear-combination/equation": (q, T) => {
    const { p, q: q2, r, A, B, c, d } = q.params;
    // one function with the two given integrals: a constant on each interval
    const f = (x) => (x < q2 ? A / (q2 - p) : B / (r - q2)), I = (g, lo, hi) => T.integrate(g, lo, hi, 200);
    return { a: T.approx(I(f, p, q2 - 1e-9) + I(f, q2 + 1e-9, r), 1e-6), b: T.approx(I(f, q2 - 1e-9, p), 1e-6), c: T.approx(I((x) => c * f(x) + d, p, q2 - 1e-9), 1e-6) };
  },
  "t5-area-between-curves/area-two-parabolas/graph": (q, T) => {
    const { a, c, top } = q.params, gap = (x) => top - a * x * x - (a * x * x + c), z = T.roots(gap, -10.001, 10, 8000);
    T.require(z.length === 2 && gap(0) > 0, "two meeting points, with g above f between them");
    T.require(c >= 0, "both curves stay on or above the x-axis in the region");
    return { a: T.approx(z[1], 1e-6), b: T.approx(T.integrate(gap, z[0], z[1]), 1e-7) };
  },
  "t5-area-between-curves/gdc-area/graph": (q, T) => {
    const { a, b } = q.params, gap = (x) => a * Math.sin(x) - b * x * x, z = T.roots(gap, 0.05, 3.5, 7000);
    T.require(z.length === 1, "the curves meet once more after the origin");
    const A = q.graph.points[0];
    T.require(Math.abs(A.x - z[0]) < 1e-6 && Math.abs(A.y - a * Math.sin(z[0])) < 1e-6, "A is drawn at the point of intersection");
    return { a: ap(T, z[0]), b: ap(T, T.integrate(gap, 0, z[0])), c: ap(T, T.extremum(gap, 0, z[0], "max", 4000).value) };
  },
};
