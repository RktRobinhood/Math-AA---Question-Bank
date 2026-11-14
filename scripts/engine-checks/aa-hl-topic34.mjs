// Independent answer verifiers for the AA HL topic 3 and 4 generators (aa-hl-topic34.js), keyed by generator id.
// Trigonometry is checked by evaluating the functions numerically and by root search; vector answers by
// substitution (a point lies on both lines, a normal is perpendicular to two directions) and distances by
// numerical minimisation; probabilities by counting over a population; pdf answers by numerical integration.

const F = { sin: Math.sin, cos: Math.cos, tan: Math.tan, sec: (x) => 1 / Math.cos(x), cosec: (x) => 1 / Math.sin(x), cot: (x) => 1 / Math.tan(x) };
const QUAD = { 1: [0, Math.PI / 2], 2: [Math.PI / 2, Math.PI], 3: [Math.PI, 1.5 * Math.PI], 4: [1.5 * Math.PI, 2 * Math.PI] };
const ARGS = { "pi-": (t) => Math.PI - t, "pi+": (t) => Math.PI + t, neg: (t) => -t, "half-": (t) => Math.PI / 2 - t, "half+": (t) => Math.PI / 2 + t, "2pi-": (t) => 2 * Math.PI - t };
// The angle in an open interval where f takes a value (f is monotonic there for the cases used).
const angleWith = (T, f, value, lo, hi) => { const r = T.roots((x) => f(x) - value, lo + 1e-7, hi - 1e-7, 2000); if (r.length !== 1) throw new Error(`expected one angle, found ${r.length}`); return r[0]; };
// The principal value of an inverse function, by bisection on its range.
const principal = (T, fn, v) => (fn === "cos" ? T.bisect((y) => Math.cos(y) - v, 0, Math.PI) : fn === "sin" ? T.bisect((y) => Math.sin(y) - v, -Math.PI / 2, Math.PI / 2) : T.bisect((y) => Math.tan(y) - v, -Math.PI / 2 + 1e-9, Math.PI / 2 - 1e-9));

// ---- vectors ----
const add = (a, b) => a.map((x, i) => x + b[i]), sub = (a, b) => a.map((x, i) => x - b[i]), mul = (k, a) => a.map((x) => k * x);
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0), len = (a) => Math.sqrt(dot(a, a));
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const det3 = (a, b, c) => dot(a, cross(b, c));
const zero = (a, tol = 1e-9) => a.every((x) => Math.abs(x) < tol);
const same = (a, b) => zero(sub(a, b));
// The angle between two vectors from the triangle they make (cosine rule on the three side lengths), in degrees.
const angleDeg = (a, b) => { const A = len(a), B = len(b), C = len(sub(a, b)); return (Math.acos(Math.max(-1, Math.min(1, (A * A + B * B - C * C) / (2 * A * B)))) * 180) / Math.PI; };
// The parameters of the closest points of two non-parallel lines a + s d and b + t e, by minimising the squared distance
// (a grid search refined by coordinate descent, no formula).
function closest(T, a, d, b, e) {
  const f = (s, t) => { const v = sub(add(a, mul(s, d)), add(b, mul(t, e))); return dot(v, v); };
  let s = 0, t = 0;
  for (let i = 0; i < 400; i++) {
    s = T.extremum((x) => f(x, t), s - 60, s + 60, "min", 600).x;
    t = T.extremum((x) => f(s, x), t - 60, t + 60, "min", 600).x;
  }
  return { s, t, dist: Math.sqrt(f(s, t)) };
}

export default {
  // ======================= 3.9 =======================
  "t3-ahl-reciprocal-trig/exact-value/equation": (q, T) => {
    const { fn, deg } = q.params;
    T.require(deg % 90 !== 0 && deg > 0 && deg < 360, "the angle is not on an axis");
    return { a: T.option(F[fn](T.rad(deg))) };
  },
  "t3-ahl-reciprocal-trig/other-ratios/equation": (q, T) => {
    const { kind, given, quad } = q.params, [lo, hi] = QUAD[quad];
    const th = angleWith(T, F[kind], given, lo, hi);
    const want = { sec: ["tan", "cosec"], cosec: ["cot", "sec"], cot: ["cosec", "cos"] }[kind];
    return { a: F[want[0]](th), b: F[want[1]](th) };
  },
  "t3-ahl-reciprocal-trig/solve-quadratic/equation": (q, T) => {
    const { fn, A, B, K } = q.params;
    const g = (x) => (fn === "sec" ? A * Math.tan(x) ** 2 + B / Math.cos(x) + K : A / Math.tan(x) ** 2 + B / Math.sin(x) + K);
    // every solution is a whole number of degrees: substitute each one
    const sols = T.range(0, 360).filter((d) => Math.abs(g(T.rad(d))) < 1e-9);
    T.require(sols.length >= 2, "at least two solutions");
    const x0 = 0.83, s = F[fn](x0), lhs = g(x0);
    return { a: T.optionWhere(q, "a", (c) => Math.abs(c[0] * s * s + c[1] * s + c[2] - lhs) < 1e-9), b: sols.length, c: T.rad(sols[0]), d: T.rad(sols[sols.length - 1]) };
  },
  "t3-ahl-reciprocal-trig/solve-calculator/equation": (q, T) => {
    const { b, c } = q.params, g = (x) => 1 / Math.cos(x) ** 2 + b * Math.tan(x) + c;
    const r = T.roots(g, 0.0005, Math.PI - 0.0005, 20000);
    T.require(r.length === 2, "two solutions in the interval");
    const x0 = 0.4, t = Math.tan(x0);
    return { a: T.optionWhere(q, "a", (k) => Math.abs(t * t + k[0] * t + k[1] - g(x0)) < 1e-9), b: r[0], c: r[1] };
  },
  "t3-ahl-inverse-trig/principal-value/equation": (q, T) => {
    const { fn, arg } = q.params;
    return { a: T.option(Math.round(T.deg(principal(T, fn, arg)))) };
  },
  "t3-ahl-inverse-trig/composite/equation": (q, T) => {
    const { inner, outer, arg, f2, al } = q.params;
    T.require(Math.abs(arg) < 1 || inner === "tan", "the input is in the domain of the inverse function");
    return { a: F[outer](principal(T, inner, arg)), b: principal(T, f2, F[f2](T.rad(al))) };
  },
  "t3-ahl-inverse-trig/domain-range/equation": (q, T) => {
    const { fn, A, b, c } = q.params, f = (x) => A * (fn === "arcsin" ? Math.asin(b * x + c) : Math.acos(b * x + c));
    // the ends of the domain: where the function stops being defined, found by bisection from a point inside
    const mid = -c / b, edge = (far) => { let lo = mid, hi = far; for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (Number.isFinite(f(m))) lo = m; else hi = m; } return lo; };
    const p = edge(mid - 5), r = edge(mid + 5);
    return { a: T.approx(p, 1e-9), b: T.approx(r, 1e-9), c: T.approx(Math.max(f(p + 1e-13), f(r - 1e-13)), 1e-5) };
  },

  // ======================= 3.10 =======================
  "t3-ahl-compound-angle/recognise/equation": (q, T) => {
    const { pat, m, n } = q.params, x = 0.37;
    const v = { "sc+": Math.sin(m * x) * Math.cos(n * x) + Math.cos(m * x) * Math.sin(n * x), "sc-": Math.sin(m * x) * Math.cos(n * x) - Math.cos(m * x) * Math.sin(n * x), "cc-": Math.cos(m * x) * Math.cos(n * x) - Math.sin(m * x) * Math.sin(n * x), "cc+": Math.cos(m * x) * Math.cos(n * x) + Math.sin(m * x) * Math.sin(n * x) }[pat];
    return { a: T.optionWhere(q, "a", (o) => Math.abs(F[o[0]](o[1] * x) - v) < 1e-9) };
  },
  "t3-ahl-compound-angle/from-ratios/equation": (q, T) => {
    const { sinA, sA, cosB } = q.params;
    const A = sA > 0 ? angleWith(T, Math.sin, sinA, 0, Math.PI / 2) : angleWith(T, Math.sin, sinA, Math.PI / 2, Math.PI), B = angleWith(T, Math.cos, cosB, 0, Math.PI);
    return { a: Math.sin(A + B), b: Math.cos(A - B) };
  },
  "t3-ahl-compound-angle/exact-surd/equation": (q, T) => ({ a: T.option(F[q.params.fn](T.rad(q.params.deg))) }),
  "t3-ahl-compound-angle/tan-compound/equation": (q, T) => {
    const A = Math.atan(q.params.p), B = Math.atan(q.params.q);
    T.require(q.params.p > 0 && q.params.q > 0, "both angles are acute");
    return { a: Math.tan(A + B), b: A + B, c: Math.tan(2 * A) };
  },
  "t3-ahl-compound-angle/tan-double/equation": (q, T) => {
    const th = Math.atan(q.params.t);
    T.require(Math.abs(Math.abs(q.params.t) - 1) > 1e-9, "tan of the double angle and of the shifted angle are defined");
    return { a: Math.tan(2 * th), b: Math.tan(th + Math.PI / 4) };
  },
  "t3-ahl-compound-angle/solve-equation/equation": (q, T) => {
    const { f, s, al, k, other } = q.params, g = (x) => F[f](x + s * T.rad(al)) - k * F[other](x);
    const r = T.roots(g, 0, 2 * Math.PI, 7200);
    T.require(r.length === 2, "two solutions in the interval");
    return { a: Math.tan(r[0]), b: r[0], c: r[1] };
  },

  // ======================= 3.11 =======================
  "t3-ahl-trig-symmetry/equivalent/equation": (q, T) => {
    const { f, a } = q.params, t = 0.41, v = F[f](ARGS[a](t));
    return { a: T.optionWhere(q, "a", (o) => Math.abs(o[0] * F[o[1]](t) - v) < 1e-9) };
  },
  "t3-ahl-trig-symmetry/related-values/equation": (q, T) => {
    const { sin, cos, picks } = q.params, t = Math.atan2(sin, cos), out = {};
    T.require(Math.abs(sin * sin + cos * cos - 1) < 1e-12, "the given sine and cosine belong to one angle");
    picks.forEach(([f, a], i) => { out["abcd"[i]] = F[f](ARGS[a](t)); });
    return out;
  },
  "t3-ahl-trig-symmetry/simplify-evaluate/equation": (q, T) => {
    const { t1, t2, p, q: qq, given, gv, quad } = q.params, [lo, hi] = QUAD[quad];
    const Ev = (t) => p * F[t1[0]](ARGS[t1[1]](t)) + qq * F[t2[0]](ARGS[t2[1]](t));
    const th = angleWith(T, F[given], gv, lo, hi), t0 = 0.29;
    return { a: T.optionWhere(q, "a", (o) => Math.abs(o[0] * F[o[1]](t0) - Ev(t0)) < 1e-9), b: Ev(th) };
  },
  // ==END==
};
