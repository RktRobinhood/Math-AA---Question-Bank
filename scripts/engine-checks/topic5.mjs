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
};
