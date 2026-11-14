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
  // PART-B
};
