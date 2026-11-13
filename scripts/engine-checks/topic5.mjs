// Independent answer verifiers for the Topic 5 generators, keyed by generator id.
// Derivatives are taken numerically, integrals by Simpson's rule, stationary points by root search
// on the numerical derivative: nothing here uses the rules of calculus the generators use.

// The option whose polynomial (highest power first) matches g at several points.
const polyOption = (q, label, g, T) => T.optionWhere(q, label, (cs) => [-1.5, -0.5, 0.5, 1.2, 2.3].every((x) => Math.abs(T.poly(cs, x) - g(x)) < 1e-5));
const intervalOption = (q, label, holds, a, b, T) => T.optionWhere(q, label, ([kind, lo, hi]) => T.range(-12, 12, 0.25).filter((x) => x !== a && x !== b)
  .every((x) => (kind === "in" ? x > lo && x < hi : kind === "out" ? x < lo || x > hi : kind === "below" ? x < lo : x > hi) === holds(x)));

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
};
