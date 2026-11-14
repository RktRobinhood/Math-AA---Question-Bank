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
// (least squares: the two normal equations, solved exactly; then a check that no nearby parameters do better).
function closest(T, a, d, b, e) {
  const f = (s, t) => { const v = sub(add(a, mul(s, d)), add(b, mul(t, e))); return dot(v, v); };
  const r = sub(b, a), m11 = dot(d, d), m12 = -dot(d, e), m22 = dot(e, e), r1 = dot(d, r), r2 = -dot(e, r), D = m11 * m22 - m12 * m12;
  const s = (r1 * m22 - m12 * r2) / D, t = (m11 * r2 - m12 * r1) / D, best = f(s, t);
  for (const [ds, dt] of [[0.01, 0], [-0.01, 0], [0, 0.01], [0, -0.01], [0.01, 0.01], [-0.01, 0.01]]) T.require(f(s + ds, t + dt) >= best - 1e-12, "the closest points are a minimum of the distance");
  return { s, t, dist: Math.sqrt(best) };
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

  // ======================= 3.12 =======================
  "t3-ahl-vector-basics/displacement/equation": (q, T) => {
    const { A, B } = q.params;
    return { a: T.optionWhere(q, "a", (v) => same(add(A, v), B)) };          // going from A by the vector arrives at B
  },
  "t3-ahl-vector-basics/magnitude/equation": (q, T) => ({ a: Math.hypot(...q.params.v) }),
  "t3-ahl-vector-basics/distance-unit/equation": (q, T) => {
    const { A, B, k } = q.params, d = Math.hypot(...sub(B, A));
    // C is on the line AB, at k times the distance, on the side given by the sign of k
    return { a: d, b: T.option("unit"), c: T.optionWhere(q, "c", (C) => Math.abs(len(sub(C, A)) - Math.abs(k) * d) < 1e-9 && Math.abs(len(sub(C, B)) - Math.abs(k - 1) * d) < 1e-9) };
  },
  "t3-ahl-vector-basics/parallel-unknown/equation": (q, T) => {
    const { a, b } = q.params, hits = [];
    for (let p = -80; p <= 80; p++) for (let r = -80; r <= 80; r++) if (zero(cross(a.map((x) => (x === null ? p : x)), b.map((x) => (x === null ? r : x))))) hits.push([p, r]);
    T.require(hits.length === 1, "exactly one pair of values makes the vectors parallel");
    return { a: hits[0][0], b: hits[0][1] };
  },
  "t3-ahl-vector-basics/collinear/equation": (q, T) => {
    const { A, B, C, v } = q.params, AB = sub(B, A), hits = [];
    for (let k = -90; k <= 90; k++) for (let m = -90; m <= 90; m++) { const rest = [k, m], c = C.map((x) => (x === null ? rest.shift() : x)); if (zero(cross(sub(c, A), AB))) hits.push(c); }
    T.require(hits.length === 1 && AB[v] !== 0, "exactly one point with the given coordinate is on the line");
    const c = hits[0], AC = sub(c, A), un = c.filter((x, i) => i !== v);
    return { a: len(AB), b: dot(AC, AB) / dot(AB, AB), c: un[0], d: un[1], e: len(AC) };
  },
  "t3-ahl-vector-basics/triangle-lengths/equation": (q, T) => {
    const { A, B, C } = q.params, M = mul(0.5, add(B, C));
    // D is the point for which the diagonals of ABCD share a midpoint: search the lattice near A + C - B
    const mid = mul(0.5, add(A, C)), D = sub(mul(2, mid), B);
    T.require(same(sub(B, A), sub(C, D)) && !zero(cross(sub(B, A), sub(C, A))), "ABCD is a parallelogram and ABC is a triangle");
    return { a: Math.hypot(...sub(B, A)), b: Math.hypot(...sub(M, A)), c: Math.hypot(...sub(D, B)) };
  },

  // ======================= 3.13 =======================
  "t3-ahl-scalar-product/dot-value/equation": (q, T) => {
    const { a, b } = q.params;
    // from the lengths: a.b = (|a + b|^2 - |a - b|^2) / 4
    return { a: (dot(add(a, b), add(a, b)) - dot(sub(a, b), sub(a, b))) / 4 };
  },
  "t3-ahl-scalar-product/perpendicular-unknown/equation": (q, T) => {
    const { a, b, c } = q.params, g = (k) => dot(a.map((x) => (x === null ? k : x)), b.map((x) => (x === null ? c * k : x)));
    T.require(g(-100) * g(100) < 0, "the scalar product changes sign");
    return { a: T.bisect(g, -100, 100) };
  },
  "t3-ahl-scalar-product/angle/equation": (q, T) => {
    const { a, b } = q.params, th = angleDeg(a, b);
    T.require(th > 10 && th < 170, "the angle is not close to 0 or 180 degrees");
    return { a: (dot(add(a, b), add(a, b)) - dot(sub(a, b), sub(a, b))) / 4, b: th };
  },
  "t3-ahl-scalar-product/exact-angle/equation": (q, T) => {
    const { A, B, C } = q.params, u = sub(B, A), w = sub(C, A), g = (k) => dot(add(u, mul(k, w)), u);
    return { a: dot(u, w), b: T.approx(angleDeg(u, w), 1e-6), c: T.bisect(g, -200, 200) };
  },
  "t3-ahl-scalar-product/magnitude-algebra/equation": (q, T) => {
    const { p, q: qq, deg, s, c } = q.params;
    // concrete vectors with these magnitudes and this angle
    const a = [p, 0, 0], b = [qq * Math.cos(T.rad(deg)), qq * Math.sin(T.rad(deg)), 0], w = add(a, mul(s, b));
    return { a: T.approx(dot(a, b), 1e-9), b: T.approx(dot(w, w), 1e-9), c: T.approx(dot(add(mul(c[0], a), mul(c[1], b)), add(mul(c[2], a), mul(c[3], b))), 1e-9) };
  },

  // ======================= 3.14 =======================
  "t3-ahl-line/parameter-of-point/equation": (q, T) => {
    const { a, d, Q } = q.params, hits = T.range(-10, 10, 0.5).filter((l) => same(add(a, mul(l, d)), Q));
    T.require(hits.length === 1, "the point is on the line");
    return { a: hits[0] };
  },
  "t3-ahl-line/through-two-points/equation": (q, T) => {
    const { A, B, C } = q.params, AB = sub(B, A);
    const hits = T.range(-80, 80).filter((k) => zero(cross(sub(C.map((x) => (x === null ? k : x)), A), AB)));
    T.require(hits.length === 1, "one value puts C on the line");
    return { a: T.optionWhere(q, "a", (o) => zero(cross(sub(o.p, A), AB)) && zero(cross(o.d, AB)) && !zero(o.d)), b: hits[0] };
  },
  "t3-ahl-line/cartesian-form/equation": (q, T) => {
    const { a, d } = q.params, onL = (p) => { const r = p.map((x, i) => (x - a[i]) / d[i]); return Math.abs(r[0] - r[1]) < 1e-9 && Math.abs(r[1] - r[2]) < 1e-9; };
    // the point of the line with z = 0, by bisection along the line
    const t = T.bisect((s) => a[2] + s * d[2], -100, 100);
    return { a: T.optionWhere(q, "a", (o) => onL(o.p) && onL(add(o.p, o.d)) && !zero(o.d)), b: a[0] + t * d[0] };
  },
  "t3-ahl-line/angle-between/equation": (q, T) => {
    const { d, e } = q.params, th = angleDeg(d, e);
    return { a: (dot(add(d, e), add(d, e)) - dot(sub(d, e), sub(d, e))) / 4, b: Math.min(th, 180 - th) };
  },
  "t3-ahl-line/foot-of-perpendicular/equation": (q, T) => {
    const { a, d, A } = q.params, dist = (l) => len(sub(add(a, mul(l, d)), A));
    const best = T.extremum(dist, -30, 30, "min", 6000);                    // numerical minimisation along the line
    return { a: T.approx(best.x, 1e-5), b: T.optionWhere(q, "b", (F) => Math.abs(len(sub(F, A)) - best.value) < 1e-6 && zero(cross(sub(F, a), d))), c: T.approx(best.value, 1e-6) };
  },
  "t3-ahl-line/kinematics-closest/words": (q, T) => {
    const { a, b, v, w, t0 } = q.params, D = (t) => len(sub(add(a, mul(t, v)), add(b, mul(t, w))));
    const best = T.extremum(D, 0, 60, "min", 6000);
    T.require(best.x > 1 && best.x < 59 && best.value > 1, "the closest approach is after the start and is not a collision");
    // speed: distance travelled in one second
    return { a: len(sub(add(a, v), a)), b: D(t0), c: T.approx(best.x, 1e-4), d: T.approx(best.value, 1e-6) };
  },
  "t3-ahl-line/kinematics-ship/words": (q, T) => {
    const { r0, v } = q.params, pos = (t) => [r0[0] + t * v[0], r0[1] + t * v[1]];
    const t = T.bisect((s) => pos(s)[0], 0, 100);
    T.require(pos(t)[1] > 0, "the ship is north of O, not south, when it is level with O");
    return { a: Math.hypot(pos(1)[0] - pos(0)[0], pos(1)[1] - pos(0)[1]), b: t, c: Math.hypot(...pos(t)) };
  },

  // ======================= 3.15 =======================
  "t3-ahl-two-lines/intersection-point/equation": (q, T) => {
    const { a, d, b, e } = q.params, c = closest(T, a, d, b, e);
    T.require(c.dist < 1e-6 && !zero(cross(d, e)), "the lines meet at one point");
    const Q = add(a, mul(c.s, d));
    return { a: T.approx(c.s, 1e-5), b: T.approx(c.t, 1e-5), c: T.optionWhere(q, "c", (p) => len(sub(p, Q)) < 1e-4) };
  },
  "t3-ahl-two-lines/classify-parallel/equation": (q, T) => {
    const { a, d, b, e } = q.params;
    T.require(zero(cross(d, e)), "the direction vectors are parallel");
    const k = T.range(-6, 6, 0.5).filter((x) => same(mul(x, d), e));
    // distance from the point of L2 to L1, by minimisation along L1
    const gap = T.extremum((l) => len(sub(add(a, mul(l, d)), b)), -40, 40, "min", 4000).value;
    T.require(gap < 1e-6 || gap > 0.05, "clearly on the line or clearly off it");
    return { a: k[0], b: T.option(gap < 1e-6 ? "coincident" : "parallel") };
  },
  "t3-ahl-two-lines/skew-or-meet/equation": (q, T) => {
    const { a, d, b, e } = q.params;
    // Cramer's rule on the first two component equations: lambda d - mu e = b - a
    const D = d[0] * -e[1] - -e[0] * d[1], r = sub(b, a);
    T.require(Math.abs(D) > 1e-9 && !zero(cross(d, e)), "the first two equations have one solution and the lines are not parallel");
    const lam = (r[0] * -e[1] - -e[0] * r[1]) / D, mu = (d[0] * r[1] - r[0] * d[1]) / D, gap = closest(T, a, d, b, e).dist;
    T.require(gap < 1e-6 || gap > 0.05, "clearly meeting or clearly apart");
    return { a: lam, b: mu, c: T.option(gap < 1e-6 ? "intersect" : "skew") };
  },
  "t3-ahl-two-lines/skew-distance/equation": (q, T) => {
    const { a, d, b, e } = q.params, c = closest(T, a, d, b, e);
    T.require(c.dist > 0.3 && !zero(cross(d, e)), "the lines are skew");
    return { a: T.optionWhere(q, "a", (v) => Math.abs(dot(v, d)) < 1e-9 && Math.abs(dot(v, e)) < 1e-9 && !zero(v)), b: T.approx(c.dist, 1e-6) };
  },
  // ==END==
};
