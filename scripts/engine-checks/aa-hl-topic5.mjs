// Independent answer verifiers for the AA HL Topic 5 generators (5.12 to 5.19), keyed by generator id.
// Nothing here uses the rules of calculus the generators use: derivatives are finite differences,
// limits are evaluated close to the point, integrals are Simpson's rule, differential equations are
// solved with a fine-step Runge-Kutta scheme, and series coefficients come from fitting a polynomial
// to the function itself.

const ap = (T, v, rel = 1e-5) => T.approx(v, rel * Math.max(1, Math.abs(v)));
const near = (a, b, rel = 1e-5) => Math.abs(a - b) <= rel * Math.max(1, Math.abs(a), Math.abs(b));
const fact = (n) => (n < 2 ? 1 : n * fact(n - 1));
// Gaussian elimination with partial pivoting.
function solve(A, b) {
  const n = b.length, M = A.map((r, i) => r.concat([b[i]]));
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = c + 1; r < n; r++) { const k = M[r][c] / M[c][c]; for (let j = c; j <= n; j++) M[r][j] -= k * M[c][j]; }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) { let s = M[r][n]; for (let j = r + 1; j < n; j++) s -= M[r][j] * x[j]; x[r] = s / M[r][r]; }
  return x;
}
// Taylor coefficients of f about x0: the polynomial through f at Chebyshev points of [x0 - r, x0 + r].
function taylor(f, x0 = 0, r = 0.2, deg = 12) {
  const ts = [];
  for (let j = 0; j <= deg; j++) ts.push(Math.cos(((2 * j + 1) * Math.PI) / (2 * deg + 2)));
  const c = solve(ts.map((t) => ts.map((_, i) => t ** i)), ts.map((t) => f(x0 + r * t)));
  return c.map((v, i) => v / r ** i);
}
// The limit of f at p: the mean of the values either side, extrapolated to h = 0.
const limAt = (f, p, h = 1e-2) => { const A = (s) => (f(p + s) + f(p - s)) / 2; return (4 * A(h / 2) - A(h)) / 3; };
// y(x1) for y' = F(x, y), y(x0) = y0, by classical Runge-Kutta with n steps.
function rk4(F, x0, y0, x1, n = 4000) {
  const h = (x1 - x0) / n; let x = x0, y = y0;
  for (let i = 0; i < n; i++) {
    const k1 = F(x, y), k2 = F(x + h / 2, y + (h * k1) / 2), k3 = F(x + h / 2, y + (h * k2) / 2), k4 = F(x + h, y + h * k3);
    y += (h * (k1 + 2 * k2 + 2 * k3 + k4)) / 6; x += h;
  }
  return y;
}
// y on the curve G(x, y) = 0 near y0, by Newton's method with a numerical derivative.
function onCurve(G, x, y0) {
  let y = y0;
  for (let i = 0; i < 60; i++) { const d = (G(x, y + 1e-6) - G(x, y - 1e-6)) / 2e-6; y -= G(x, y) / d; }
  return y;
}
const slopeOn = (G, x, y0, h = 1e-4) => (onCurve(G, x + h, y0) - onCurve(G, x - h, y0)) / (2 * h);

const onceFn = ({ kind, a, b, c }) => ({
  "exp-sin": [(x) => (Math.exp(a * x) - 1) / Math.sin(b * x), 0], "ln-lin": [(x) => Math.log(1 + a * x) / (b * x), 0],
  "exp-exp": [(x) => (Math.exp(a * x) - Math.exp(c * x)) / (b * x), 0], "pow-pow": [(x) => (x ** a - 1) / (x ** b - 1), 1],
  "pow-ln": [(x) => (x ** a - 1) / Math.log(x), 1], "tan-exp": [(x) => Math.tan(a * x) / (Math.exp(b * x) - 1), 0] }[kind]);

export default {
  // ---------------------------------------------------------------- 5.12
  "t5-ahl-first-principles/quotient-at-point/equation": (q, T) => {
    const { a, b, c, p } = q.params, f = (x) => a * x * x + b * x + c, Q = (h) => (f(p + h) - f(p)) / h;
    T.require(Math.abs(T.deriv(f, p)) > 1e-6, "the derivative at the point is not zero");
    return { a: 2 * Q(1) - Q(2), b: Q(2) - Q(1), c: ap(T, T.deriv(f, p)) };
  },
  "t5-ahl-first-principles/derivative-cubic/equation": (q, T) => {
    const { a, b, p } = q.params, f = (x) => a * x ** 3 + b * x;
    const pts = [[0.7, 0.3], [-1.2, 0.5], [2, -0.4], [1.1, 1.3]];
    return { a: T.optionWhere(q, "a", (cs) => pts.every(([x, h]) => near(cs[0] * x * x + cs[1] + cs[2] * x * h + cs[3] * h * h, (f(x + h) - f(x)) / h))), b: ap(T, T.deriv(f, p)) };
  },
  "t5-ahl-limit-reasoning/rational-at-infinity/equation": (q, T) => {
    const { a, b, c, d, e } = q.params, f = (x) => (a * x * x + b * x + c) / (d * x * x + e);
    return { a: ap(T, (10 * f(1e7) - f(1e6)) / 9) };
  },
  "t5-ahl-limit-reasoning/removable-point/equation": (q, T) => {
    const { p, q: q2, r } = q.params, f = (x) => (x * x - (p + q2) * x + p * q2) / (x * x - (p + r) * x + p * r);
    T.require(!isFinite(f(p)) || Number.isNaN(f(p)), "the function is not defined at the point");
    return { a: ap(T, limAt(f, p, 1e-3)) };
  },
  "t5-ahl-continuity/continuity-constant/equation": (q, T) => {
    const { a, b, c, p } = q.params, f = (k) => (x) => (x < p ? a * x * x + b : k * x + c);
    const jump = (k) => f(k)(p - 1e-9) - f(k)(p);
    return { a: ap(T, T.bisect(jump, -60, 60), 1e-6) };
  },
  "t5-ahl-continuity/differentiable-join/equation": (q, T) => {
    const { al, be, p, cub } = q.params, left = (x) => (cub ? al * x ** 3 + be * x : al * x * x + be * x);
    const mm = T.deriv(left, p), c = left(p) - mm * p;
    // with these constants the whole function has matching one-sided difference quotients
    const f = (x) => (x <= p ? left(x) : mm * x + c), h = 1e-5;
    T.require(near((f(p + h) - f(p)) / h, (f(p) - f(p - h)) / h, 1e-3), "the one-sided gradients agree");
    return { a: ap(T, mm), b: ap(T, c) };
  },
  "t5-ahl-higher-derivatives/values-at-zero/equation": (q, T) => {
    const { kind, a, k, b } = q.params, g = kind === "exp" ? Math.exp : kind === "cos" ? Math.cos : Math.sin;
    const c = taylor((x) => a * g(k * x) + b * x ** 3, 0, 0.25);
    return { a: ap(T, 2 * c[2]), b: ap(T, 6 * c[3]) };
  },
  "t5-ahl-higher-derivatives/nth-pattern/equation": (q, T) => {
    const { k, N } = q.params, f = (x) => x * Math.exp(k * x), x0 = 0.3, c = taylor(f, x0, 0.2);
    const cand = ([s, mode], n, x) => k ** (n - 1 + s) * (mode === 0 ? n + k * x : mode === 1 ? 1 + k * n * x : n * (1 + k * x)) * Math.exp(k * x);
    const c0 = taylor(f, 0, 0.25, 14);
    return { a: ap(T, 2 * c0[2]), b: T.optionWhere(q, "b", (v) => [1, 2, 3].every((n) => near(cand(v, n, x0), fact(n) * c[n], 1e-4))), c: fact(N) * (k ** (N - 1) / fact(N - 1)) };   // (c): N! times the coefficient of x^N in x times the exponential series
  },
  // ---------------------------------------------------------------- 5.13
  "t5-ahl-lhopital/standard-limit/equation": (q, T) => {
    const { kind, a, b } = q.params;
    const f = (x) => (kind === "tan-x" ? Math.tan(a * x) : Math.sin(a * x)) / (kind === "sin-sin" ? Math.sin(b * x) : b * x);
    return { a: ap(T, limAt(f, 0)) };
  },
  "t5-ahl-lhopital/once/equation": (q, T) => {
    const [f, at] = onceFn(q.params);
    T.require(!isFinite(f(at)), "the quotient is indeterminate at the point");
    return { a: ap(T, limAt(f, at, 4e-3)) };
  },
  "t5-ahl-lhopital/infinity-form/equation": (q, T) => {
    const { kind, a, b, c, d } = q.params;
    const f = kind === "lin-ln" ? (x) => (a * x + b * Math.log(x)) / (c * x + d) : kind === "exp-lin" ? (x) => (a * Math.exp(x) + b * x) / (c * Math.exp(x) + d) : (x) => Math.log(x ** a + b) / Math.log(x ** c + d);
    return { a: ap(T, f(kind === "exp-lin" ? 60 : 1e15), kind === "ln-ln" ? 1e-3 : 1e-6) };
  },
  "t5-ahl-lhopital/twice/equation": (q, T) => {
    const { kind, a, b } = q.params;
    const f = { cos: (x) => (1 - Math.cos(a * x)) / (b * x * x), exp: (x) => (Math.exp(a * x) - 1 - a * x) / (b * x * x), ln: (x) => (Math.log(1 + a * x) - a * x) / (b * x * x),
      coscos: (x) => (Math.cos(a * x) - Math.cos(b * x)) / (x * x), xsin: (x) => (x * Math.sin(a * x)) / (1 - Math.cos(b * x)) }[kind];
    return { a: ap(T, limAt(f, 0, 1e-2)) };
  },
  "t5-ahl-lhopital/unknown-constant/equation": (q, T) => {
    const { kind, a, c } = q.params, g = kind === "exp" ? (x) => c * Math.exp(a * x) - c : kind === "sin" ? (x) => c * Math.sin(a * x) : (x) => c * Math.log(1 + a * x);
    const k = Math.round(limAt((x) => g(x) / x, 0) * 1e6) / 1e6, n = kind === "sin" ? 3 : 2;
    // any other k makes the quotient blow up near zero
    T.require(Math.abs((g(1e-3) - (k + 0.5) * 1e-3) / 1e-3 ** n) > 100, "another constant gives no finite limit");
    return { a: ap(T, k), b: ap(T, limAt((x) => (g(x) - k * x) / x ** n, 0, 2e-2), 1e-4) };
  },
  "t5-ahl-lhopital/by-series/equation": (q, T) => {
    const { a, b, c } = q.params, f = (x) => Math.sin(a * x) - a * x * Math.cos(b * x), cs = taylor(f, 0, 0.2);
    T.require(Math.abs(cs[1]) < 1e-7 && Math.abs(cs[2]) < 1e-7, "the series starts at the cube term");
    return { a: ap(T, cs[3]), b: ap(T, limAt((x) => f(x) / (c * x ** 3), 0, 2e-2), 1e-4) };
  },
  // ---------------------------------------------------------------- 5.14
  "t5-ahl-implicit/conic-gradient/equation": (q, T) => {
    const { a, b, p, q: y0 } = q.params, c = a * p * p + b * y0 * y0, G = (x, y) => a * x * x + b * y * y - c;
    return { a: ap(T, slopeOn(G, p, y0)) };
  },
  "t5-ahl-implicit/gradient-at-point/equation": (q, T) => {
    const { a, p, q: y0 } = q.params, c = p * p + a * p * y0 + y0 * y0, G = (x, y) => x * x + a * x * y + y * y - c;
    return { a: ap(T, slopeOn(G, p, y0)) };
  },
  "t5-ahl-implicit/tangent-intercept/equation": (q, T) => {
    const { a, p, q: y0 } = q.params, c = y0 ** 3 + a * p * y0 + p * p, G = (x, y) => y ** 3 + a * x * y + x * x - c;
    const xs = [p - 0.004, p + 0.003, p + 0.006], mm = slopeOn(G, p, y0, 1e-5);
    return { a: T.optionWhere(q, "a", (v) => xs.every((x) => { const y = onCurve(G, x, y0); return near(-(v[0] * x + v[1] * y) / (v[2] * y * y + v[3] * x), slopeOn(G, x, y, 1e-5), 1e-4); })),
      b: ap(T, mm), c: ap(T, y0 - mm * p) };
  },
  "t5-ahl-related-rates/rate-of-measure/words": (q, T) => {
    const { kind, v, r } = q.params, M = kind === "circle" ? (x) => Math.PI * x * x : kind === "sphere-volume" ? (x) => (4 / 3) * Math.PI * x ** 3 : (x) => 4 * Math.PI * x * x;
    return { a: ap(T, T.deriv((t) => M(r + v * t), 0, 1e-3)) };
  },
  "t5-ahl-related-rates/radius-rate-from-volume/words": (q, T) => {
    const { q: rate, r } = q.params, V0 = (4 / 3) * Math.PI * r ** 3, rad = (t) => Math.cbrt((3 * (V0 + rate * t)) / (4 * Math.PI));
    return { a: ap(T, T.deriv(rad, 0, 1e-3)), b: ap(T, T.deriv((t) => 4 * Math.PI * rad(t) ** 2, 0, 1e-3)) };
  },
  "t5-ahl-related-rates/sliding-rod/diagram": (q, T) => {
    const { x, y, L, v } = q.params, top = (t) => Math.sqrt(L * L - (x + v * t) ** 2);
    T.require(x * x + y * y === L * L, "the triangle is right-angled");
    return { a: top(0), b: ap(T, T.deriv(top, 0, 1e-4)) };
  },
  "t5-ahl-related-rates/cone-filling/words": (q, T) => {
    const { R, H, h0, q: rate } = q.params, V = (h) => T.integrate((z) => Math.PI * ((R * z) / H) ** 2, 0, h, 40);
    const depth = (t) => T.bisect((h) => V(h) - V(h0) - rate * t, 0.01, H * 2, 70);
    T.require(h0 < H, "the water is inside the cone");
    return { a: (R * h0) / H, b: ap(T, T.deriv(depth, 0, 1e-3), 1e-4), c: ap(T, T.deriv((t) => Math.PI * ((R * depth(t)) / H) ** 2, 0, 1e-3), 1e-4) };
  },
  "t5-ahl-endpoint-optimisation/cost-on-domain/words": (q, T) => {
    const { a, b, lo, hi } = q.params, C = (v) => a * v + b / v;
    const z = T.roots((v) => T.deriv(C, v, 1e-4), 1, 400, 4000);
    T.require(z.length === 1, "one stationary point");
    return { a: ap(T, z[0]), b: ap(T, T.extremum(C, lo, hi, "min").value), c: ap(T, T.extremum(C, lo, hi, "max").value) };
  },
  // ---------------------------------------------------------------- 5.15
  "t5-ahl-standard-derivatives/identify-derivative/equation": (q, T) => {
    const { kind, k } = q.params;
    const f = { tan: (x) => Math.tan(k * x), sec: (x) => 1 / Math.cos(k * x), cot: (x) => 1 / Math.tan(k * x), cosec: (x) => 1 / Math.sin(k * x), exp: (x) => k ** x,
      log: (x) => Math.log(x) / Math.log(k), arctan: (x) => Math.atan(k * x), arcsin: (x) => Math.asin(k * x), arccos: (x) => Math.acos(k * x) }[kind];
    const cand = ([c, name, kk], x) => ({ sec2: c / Math.cos(kk * x) ** 2, sectan: (c * Math.tan(kk * x)) / Math.cos(kk * x), csc2: c / Math.sin(kk * x) ** 2, csccot: (c * Math.cos(kk * x)) / Math.sin(kk * x) ** 2,
      axln: kk ** x * Math.log(kk), xax1: x * kk ** (x - 1), ax: kk ** x, axdivln: kk ** x / Math.log(kk), "1/xln": 1 / (x * Math.log(kk)), "1/x": 1 / x, "ln/x": Math.log(kk) / x, "k/x": kk / x,
      atan: c / (1 + kk * kk * x * x), atanbad: c / (1 + kk * x * x), asin: c / Math.sqrt(1 - kk * kk * x * x) }[name]);
    return { a: T.optionWhere(q, "a", (v) => [0.03, 0.07, 0.11].every((x) => near(cand(v, x), T.deriv(f, x, 1e-5), 1e-5))) };
  },
  "t5-ahl-standard-derivatives/gradient-inverse-trig/equation": (q, T) => {
    const { kind, c, k, a, p } = q.params;
    const f = kind === "arctan" ? (x) => c * Math.atan(k * x) : kind === "arcsin" ? (x) => Math.asin(x / a) : (x) => Math.acos(x / a);
    return { a: ap(T, T.deriv(f, p, 1e-4)) };
  },
  "t5-ahl-standard-derivatives/tangent-exponential-base/equation": (q, T) => {
    const { kind, a, p } = q.params;
    if (kind === "exp") { const f = (x) => a ** x, mm = T.deriv(f, p, 1e-4); return { a: ap(T, mm), b: ap(T, p - f(p) / mm) }; }
    const f = (x) => Math.log(x) / Math.log(a), x0 = a ** p, mm = T.deriv(f, x0, 1e-4);
    return { a: ap(T, mm), b: ap(T, f(x0) - mm * x0) };
  },
  "t5-ahl-standard-derivatives/stationary-tan-cot/equation": (q, T) => {
    const { a, b } = q.params, f = (x) => a * Math.tan(x) + b / Math.tan(x);
    const z = T.roots((x) => T.deriv(f, x, 1e-5), 0.05, 1.52, 3000);
    T.require(z.length === 1, "one stationary point in the interval");
    return { a: ap(T, z[0]), b: ap(T, T.extremum(f, 0.05, 1.52, "min").value) };
  },
  "t5-ahl-standard-integrals/inverse-trig-definite/equation": (q, T) => {
    const { kind, c, a } = q.params;
    const v = kind === "atan" ? T.integrate((x) => c / (a * a + x * x), 0, a) : kind === "atan3" ? T.integrate((x) => c / (a * a + x * x), 0, a * Math.sqrt(3))
      : kind === "asin" ? T.integrate((x) => c / Math.sqrt(a * a - x * x), 0, a / 2) : T.integrate((x) => c / Math.cos(a * x) ** 2, 0, Math.PI / (4 * a));
    return { a: ap(T, v) };
  },
  "t5-ahl-standard-integrals/partial-fractions-definite/equation": (q, T) => {
    const { r1, r2, al, be, p, q: hi } = q.params, f = (x) => (al * x + be) / ((x - r1) * (x - r2));
    T.require(p > r2 && r2 > r1, "the interval is to the right of both discontinuities");
    return { a: ap(T, limAt((x) => (x - r1) * f(x), r1, 1e-3)), b: ap(T, limAt((x) => (x - r2) * f(x), r2, 1e-3)), c: ap(T, Math.exp(T.integrate(f, p, hi, 4000)), 1e-6) };
  },
  // ---------------------------------------------------------------- 5.16
  "t5-ahl-substitution/new-limits/equation": (q, T) => {
    const { kind, p, q: hi, a, b, c } = q.params;
    // the value of u that maps back to each limit of x, found by search on the inverse substitution
    const back = kind === "sqrt" ? (u) => u * u : kind === "lin" ? (u) => (u - b) / a : (u) => Math.sign(u - c) * Math.sqrt(Math.abs(u - c));
    const find = (x) => T.bisect((u) => back(u) - x, kind === "sqrt" ? 0 : -200, 200);
    return { a: ap(T, find(p), 1e-7), b: ap(T, find(hi), 1e-7) };
  },
  "t5-ahl-substitution/linear-substitution/equation": (q, T) => {
    const { b, n, U } = q.params, I = T.integrate((x) => x * (x + b) ** n, -b, U - b);
    return { a: T.optionWhere(q, "a", ([l, h, s]) => l === 0 && h === U && near(T.integrate((u) => (u + s) * u ** n, l, h), I, 1e-7)), b: ap(T, I, 1e-7) };
  },
  "t5-ahl-substitution/root-substitution/equation": (q, T) => {
    const { c, s, t } = q.params, I = T.integrate((x) => x / Math.sqrt(x - c), c + s * s, c + t * t, 4000);
    const g = { 2: (u) => 2 * (u * u + c), "1/u": (u) => (u * u + c) / u, "2u": (u) => 2 * u * (u * u + c), 1: (u) => u * u + c };
    T.require(s >= 1, "the integrand is defined on the whole interval");
    return { a: T.optionWhere(q, "a", ([l, h, kind]) => l === s && h === t && near(T.integrate(g[kind], l, h), I, 1e-7)), b: ap(T, I, 1e-7) };
  },
  "t5-ahl-substitution/trig-substitution/equation": (q, T) => {
    const { kind, a } = q.params;
    const [sub, xUp, f, n] = kind === "circle" ? [(t) => a * Math.sin(t), a, (x) => Math.sqrt(Math.max(0, a * a - x * x)), 400000]
      : kind === "tan" ? [(t) => a * Math.tan(t), a, (x) => 1 / (a * a + x * x) ** 2, 2000] : [(t) => a * Math.sin(t), a / 2, (x) => (x * x) / Math.sqrt(a * a - x * x), 2000];
    return { a: ap(T, T.bisect((t) => sub(t) - xUp, 0, Math.PI / 2), 1e-7), b: ap(T, T.integrate(f, 0, xUp, n), 1e-6) };
  },
  "t5-ahl-by-parts/indefinite-once/equation": (q, T) => {
    const { kind, k } = q.params, g = kind === "exp" ? Math.exp : kind === "cos" ? Math.cos : Math.sin;
    const F = ([c1, c2]) => (x) => (kind === "exp" ? c1 * x * Math.exp(k * x) + c2 * Math.exp(k * x) : kind === "cos" ? c1 * x * Math.sin(k * x) + c2 * Math.cos(k * x) : c1 * x * Math.cos(k * x) + c2 * Math.sin(k * x));
    return { a: T.optionWhere(q, "a", (v) => [0.2, 0.5, 0.9].every((x) => near(T.deriv(F(v), x, 1e-4), x * g(k * x), 1e-5))) };
  },
  "t5-ahl-by-parts/log-definite/equation": (q, T) => {
    const { n, c } = q.params, N = n + 1, f = (x) => c * x ** n * Math.log(x);
    const b1 = (x) => x ** N * Math.log(x), b2 = (x) => x ** N, xs = [1.5, 2.5];
    const [A, B] = solve(xs.map((x) => [T.deriv(b1, x, 1e-4), T.deriv(b2, x, 1e-4)]), xs.map(f));
    return { a: ap(T, A), b: ap(T, B), c: ap(T, T.integrate(f, 1, Math.E), 1e-7) };
  },
  "t5-ahl-by-parts/repeated/equation": (q, T) => {
    const { kind, a } = q.params, u = (x) => x * x + a * x;
    const [g, V, lo, hi] = kind === "exp" ? [Math.exp, Math.exp, 0, 1] : kind === "sin" ? [Math.sin, Math.cos, 0, Math.PI] : [Math.cos, Math.sin, 0, Math.PI / 2];
    // each option is tested as an identity on shorter intervals too, so equal values by accident do not pass
    const ok = ([sB, sI, da]) => [hi, 1, 0.6].every((X) => near(sB * (u(X) * V(X) - u(lo) * V(lo)) + sI * T.integrate((x) => (2 * x + (da ? a : 0)) * (da === 2 ? g(x) : V(x)), lo, X), T.integrate((x) => u(x) * g(x), lo, X), 1e-7));
    return { a: T.optionWhere(q, "a", ok), b: ap(T, T.integrate((x) => u(x) * g(x), lo, hi), 1e-7) };
  },
  "t5-ahl-by-parts/cyclic/equation": (q, T) => {
    const { kind, a, b } = q.params, g = kind === "sin" ? Math.sin : Math.cos, o = kind === "sin" ? Math.cos : Math.sin;
    const b1 = (x) => Math.exp(a * x) * g(b * x), b2 = (x) => Math.exp(a * x) * o(b * x), xs = [0.3, 0.9];
    const [p, qq] = solve(xs.map((x) => [T.deriv(b1, x, 1e-4), T.deriv(b2, x, 1e-4)]), xs.map(b1));
    return { a: ap(T, p), b: ap(T, qq) };
  },
  // ---------------------------------------------------------------- 5.17
  "t5-ahl-area-y-axis/parabola-region/graph": (q, T) => {
    const { c, k } = q.params, top = c + k * k, area = T.integrate((x) => top - (x * x + c), 0, k);   // the same region, cut into vertical strips
    const g = { "sqrt-": (y) => Math.sqrt(Math.max(0, y - c)), "sqrt+": (y) => Math.sqrt(y + c), y2: (y) => y * y + c, x: (x) => x * x + c };
    return { a: T.optionWhere(q, "a", ([l, h, kind]) => near(T.integrate(g[kind], l, h, 400000), area, 1e-5)), b: ap(T, area, 1e-7) };
  },
  "t5-ahl-area-y-axis/exponential-region/graph": (q, T) => {
    const { a, T: top } = q.params, f = (x) => Math.exp(x / a), xa = T.bisect((x) => f(x) - top, 0, 50);
    return { a: ap(T, xa, 1e-7), b: ap(T, T.integrate((x) => top - f(x), 0, xa), 1e-7) };
  },
  "t5-ahl-volume-revolution/identify-integral/equation": (q, T) => {
    const { kind, c, p, q: hi } = q.params, f = kind === "sqrt" ? (x) => Math.sqrt(x + c) : kind === "exp" ? (x) => c * Math.exp(x) : kind === "quad" ? (x) => x * x + c : (x) => c / x;
    // the solid as a stack of thin discs
    const n = 20000, h = (hi - p) / n; let V = 0;
    for (let i = 0; i < n; i++) V += Math.PI * f(p + (i + 0.5) * h) ** 2 * h;
    const I1 = T.integrate(f, p, hi), I2 = T.integrate((x) => f(x) ** 2, p, hi), val = { "pi-sq": Math.PI * I2, "pi-lin": Math.PI * I1, sq: I2, "2pi-sq": 2 * Math.PI * I2 };
    return { a: T.optionWhere(q, "a", (code) => near(val[code], V, 1e-6)) };
  },
  "t5-ahl-volume-revolution/power-curve-x-axis/graph": (q, T) => {
    const { kind, a, p, q: hi } = q.params, f = kind === "sqrt" ? (x) => a * Math.sqrt(x) : kind === "line" ? (x) => a * x : (x) => a * x * x;
    T.require(T.evalGraph(q.graph.functions[0].fn, (p + hi) / 2) === f((p + hi) / 2), "the graph shows the curve of the question");
    return { a: ap(T, T.integrate((x) => Math.PI * f(x) ** 2, p, hi), 1e-7) };
  },
  "t5-ahl-volume-revolution/exact-x-axis/graph": (q, T) => {
    const { kind, a, k } = q.params;
    const [f, hi] = { sin: [(x) => a * Math.sin(x), Math.PI], cos: [(x) => a * Math.cos(x), Math.PI / 2], exp: [(x) => a * Math.exp(x), Math.log(k)], recip: [(x) => a / Math.sqrt(1 + x * x), 1],
      sec: [(x) => a / Math.cos(x), Math.PI / 4], xexp: [(x) => a * Math.sqrt(x) * Math.exp(x), 1] }[kind];
    T.require(near(T.evalGraph(q.graph.functions[0].fn, hi / 2), f(hi / 2), 2e-3), "the graph shows the curve of the question");
    return { a: ap(T, T.integrate((x) => Math.PI * f(x) ** 2, 0, hi), 1e-7) };
  },
  "t5-ahl-volume-revolution/parabola-y-axis/graph": (q, T) => {
    const { a, c, s, t } = q.params, f = (x) => a * x * x + c, p = f(s), top = f(t);
    const cand = { ok: (y) => (y - c) / a, plus: (y) => (y + (c || 1)) / a, mult: (y) => (a === 1 ? Math.sqrt(y - c) : a * (y - c)), sq: (y) => (a === 1 ? (y - c) ** 2 : y / a - (c || 1)) };
    // the solid as nested cylindrical shells about the y-axis
    const V = T.integrate((x) => 2 * Math.PI * x * (top - Math.max(p, f(x))), 0, t, 40000);
    return { a: T.optionWhere(q, "a", (code) => [1.3, 2.2, 0.7].every((x) => near(cand[code](f(x)), x * x, 1e-9))), b: ap(T, V, 1e-6) };
  },
  "t5-ahl-volume-revolution/between-curves/graph": (q, T) => {
    const { a, b, k } = q.params, f = (x) => a - b * x * x, g = (x) => Math.exp(k * x), z = T.roots((x) => f(x) - g(x), 0, 8, 4000);
    T.require(z.length === 1 && f(0) > g(0), "the curves meet once and the parabola starts above");
    return { a: ap(T, z[0], 1e-7), b: ap(T, T.integrate((x) => Math.PI * (f(x) ** 2 - g(x) ** 2), 0, z[0]), 1e-6) };
  },
  "t5-ahl-volume-revolution/vase-y-axis/words": (q, T) => {
    const { a, h } = q.params, radius = (d) => T.bisect((x) => a * Math.log(x) - d, 1, 1e4, 80);
    // shells about the y-axis: full height inside radius 1, then from the curve up to the water level
    const vol = (d) => Math.PI * d + T.integrate((r) => 2 * Math.PI * r * (d - a * Math.log(r)), 1, radius(d), 400);
    const V = vol(h);
    return { a: ap(T, radius(h), 1e-7), b: ap(T, V, 1e-6), c: ap(T, T.bisect((d) => vol(d) - V / 2, 0.01, h, 60), 1e-6) };
  },
  // PART-C
};
