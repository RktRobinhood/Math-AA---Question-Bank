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
// A test for "v is a x b": perpendicular to both, of the right length (Lagrange's identity), and right-handed.
const isCross = (a, b) => (v) => Math.abs(dot(v, a)) < 1e-9 && Math.abs(dot(v, b)) < 1e-9 && Math.abs(dot(v, v) - (dot(a, a) * dot(b, b) - dot(a, b) ** 2)) < 1e-9 && det3(a, b, v) > 0;
// Area of a triangle from its three side lengths.
const heron = (A, B, C) => { const x = len(sub(B, A)), y = len(sub(C, B)), z = len(sub(A, C)), s = (x + y + z) / 2; return Math.sqrt(Math.max(0, s * (s - x) * (s - y) * (s - z))); };
// The angle between a line (direction d) and a plane (normal n): the angle between d and its projection onto the plane, in degrees.
const linePlaneAngle = (d, n) => { const proj = sub(d, mul(dot(d, n) / dot(n, n), n)); return angleDeg(d, proj); };
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

  // ======================= 3.16 =======================
  "t3-ahl-vector-product/compute/equation": (q, T) => ({ a: T.optionWhere(q, "a", isCross(q.params.a, q.params.b)) }),
  "t3-ahl-vector-product/triangle-area/equation": (q, T) => {
    const { A, B, C } = q.params, u = sub(B, A), w = sub(C, A);
    const out = { a: T.optionWhere(q, "a", isCross(u, w)), b: heron(A, B, C) };
    // distance from C to the line AB by minimisation along the line
    if (q.level === 4) out.c = T.approx(T.extremum((t) => len(sub(add(A, mul(t, u)), C)), -30, 30, "min", 6000).value, 1e-6);
    return out;
  },
  "t3-ahl-vector-product/exact-area-normal/equation": (q, T) => {
    const { A, B, C, vz } = q.params, u = sub(B, A), w = sub(C, A), hits = [];
    // the vector (p, q, vz) perpendicular to both: search whole numbers
    for (let p = -60; p <= 60; p++) for (let r = -60; r <= 60; r++) if (dot([p, r, vz], u) === 0 && dot([p, r, vz], w) === 0) hits.push(p);
    T.require(hits.length === 1, "one perpendicular vector has the given third component");
    return { a: T.optionWhere(q, "a", isCross(u, w)), b: T.approx(heron(A, B, C), 1e-7), c: hits[0] };
  },
  "t3-ahl-vector-product/magnitude-algebra/equation": (q, T) => {
    const { p, q: qq, D } = q.params, c = D / (p * qq);
    T.require(Math.abs(c) < 1, "the scalar product fits the magnitudes");
    // concrete vectors with these magnitudes and this scalar product
    const th = T.bisect((x) => Math.cos(x) - c, 0, Math.PI), a = [p, 0, 0], b = [qq * Math.cos(th), qq * Math.sin(th), 0], x = len(cross(a, b));
    return { a: T.approx(c, 1e-9), b: T.approx(x, 1e-7), c: T.approx(heron([0, 0, 0], a, b), 1e-7), d: T.approx(len(cross(add(a, b), sub(a, b))), 1e-7) };
  },

  // ======================= 3.17 =======================
  "t3-ahl-plane/point-constant/equation": (q, T) => {
    const { n, D, Q } = q.params, g = (k) => dot(n, Q.map((x) => (x === null ? k : x))) - D;
    return { a: T.bisect(g, -200, 200) };
  },
  "t3-ahl-plane/normal-point/equation": (q, T) => {
    const { n, A, y, z } = q.params;
    // (k, y, z) is in the plane when the vector from A to it is perpendicular to n
    return { a: dot(n, A), b: T.bisect((k) => dot(sub([k, y, z], A), n), -500, 500) };
  },
  "t3-ahl-plane/three-points/equation": (q, T) => {
    const { A, B, C } = q.params, u = sub(B, A), w = sub(C, A);
    T.require(!zero(cross(u, w)), "the three points are not collinear");
    const on = (o, p) => Math.abs(dot(o.n, p) - o.d) < 1e-9;
    // the point of the z-axis in the plane: the scalar triple product of (X - A), AB and AC is zero
    return { a: T.optionWhere(q, "a", isCross(u, w)), b: T.optionWhere(q, "b", (o) => !zero(o.n) && on(o, A) && on(o, B) && on(o, C)), c: T.bisect((k) => det3(sub([0, 0, k], A), u, w), -1000, 1000) };
  },
  "t3-ahl-plane/vector-form/equation": (q, T) => {
    const { a, b, c, Q } = q.params;
    T.require(!zero(cross(b, c)), "the two direction vectors are not parallel");
    return { a: T.optionWhere(q, "a", (v) => !zero(v) && Math.abs(dot(v, b)) < 1e-9 && Math.abs(dot(v, c)) < 1e-9), b: T.bisect((k) => det3(sub([Q[0], Q[1], k], a), b, c), -1000, 1000) };
  },

  // ======================= 3.18 =======================
  "t3-ahl-line-plane/meet-point/equation": (q, T) => {
    const { a, d, n, D } = q.params, lam = T.bisect((l) => dot(n, add(a, mul(l, d))) - D, -500, 500), Q = add(a, mul(lam, d));
    T.require(Math.abs(dot(n, d)) > 1e-9, "the line is not parallel to the plane");
    return { a: lam, b: T.optionWhere(q, "b", (p) => len(sub(p, Q)) < 1e-6) };
  },
  "t3-ahl-line-plane/angle-line-plane/equation": (q, T) => {
    const { d, n } = q.params;
    return { a: (dot(add(d, n), add(d, n)) - dot(sub(d, n), sub(d, n))) / 4, b: linePlaneAngle(d, n) };
  },
  "t3-ahl-line-plane/distance-reflection/equation": (q, T) => {
    const { n, D, A } = q.params, lam = T.bisect((l) => dot(n, add(A, mul(l, n))) - D, -500, 500), Fp = add(A, mul(lam, n));
    // the reflection: the same distance from every point of the plane as A, and not A itself
    const inPlane = [Fp, add(Fp, cross(n, [1, 0, 0])), add(Fp, cross(n, [0, 1, 0])), add(Fp, cross(n, [0, 0, 1]))];
    return { a: lam, b: Math.abs(dot(n, A) - D) / len(n), c: T.optionWhere(q, "c", (p) => !same(p, A) && inPlane.every((x) => Math.abs(len(sub(x, p)) - len(sub(x, A))) < 1e-9)) };
  },
  "t3-ahl-line-plane/two-planes-line/equation": (q, T) => {
    const { n1, n2, d1, d2 } = q.params, D = n1[0] * n2[1] - n1[1] * n2[0];
    T.require(Math.abs(D) > 1e-9, "the line is not parallel to the plane z = 0");
    // z = 0: two equations in x and y, by Cramer's rule
    return { a: T.optionWhere(q, "a", (v) => !zero(v) && Math.abs(dot(v, n1)) < 1e-9 && Math.abs(dot(v, n2)) < 1e-9), b: (d1 * n2[1] - n1[1] * d2) / D, c: (n1[0] * d2 - d1 * n2[0]) / D };
  },
  "t3-ahl-line-plane/angle-two-planes/equation": (q, T) => {
    const { n1, n2 } = q.params, th = angleDeg(n1, n2);
    return { a: (dot(add(n1, n2), add(n1, n2)) - dot(sub(n1, n2), sub(n1, n2))) / 4, b: Math.min(th, 180 - th) };
  },
  "t3-ahl-line-plane/line-plane-chain/equation": (q, T) => {
    const { a, d, n, D } = q.params, lam = T.bisect((l) => dot(n, add(a, mul(l, d))) - D, -500, 500), phi = linePlaneAngle(d, n);
    // distance from A to the plane: along the line to the meeting point, then the component perpendicular to the plane
    return { a: lam, b: phi, c: Math.abs(lam) * len(d) * Math.sin(T.rad(phi)) };
  },
  "t3-ahl-line-plane/three-planes/equation": (q, T) => {
    const { n1, n2, n3xy, d1, d2, d3 } = q.params, n3 = (k) => [n3xy[0], n3xy[1], k];
    const k = T.bisect((x) => det3(n1, n2, n3(x)), -500, 500);
    T.require(Math.abs(det3(n1, n2, n3(k + 1))) > 1e-9, "the determinant depends on k");
    // two points of the line where the first two planes meet; the third plane contains both or neither
    const dir = cross(n1, n2), D = n1[0] * n2[1] - n1[1] * n2[0], p0 = [(d1 * n2[1] - n1[1] * d2) / D, (n1[0] * d2 - d1 * n2[0]) / D, 0], p1 = add(p0, dir);
    const on = (p) => Math.abs(dot(n3(k), p) - d3) < 1e-6;
    T.require(on(p0) === on(p1), "the third plane contains the whole line or none of it");
    return { a: k, b: T.option(on(p0) ? "line" : "none") };
  },

  // ======================= 4.13 =======================
  "t4-ahl-bayes/formula/equation": (q, T) => {
    const { pA, pBA, pB } = q.params, N = 1e6, both = N * pA * pBA;
    T.require(both < N * pB && N * pB - both <= N * (1 - pA) + 1e-6, "the three probabilities fit one sample space");
    return { a: both / (N * pB) };                                          // of the outcomes in B, the share that are also in A
  },
  "t4-ahl-bayes/two-branch/words": (q, T) => {
    const { pA, pBA, pBnA } = q.params, N = 1e8, inA = N * pA, hitA = inA * pBA, hitN = (N - inA) * pBnA;
    T.require([pA, pBA, pBnA].every((p) => p > 0 && p < 1), "probabilities between 0 and 1");
    return { a: (hitA + hitN) / N, b: hitA / (hitA + hitN) };
  },
  "t4-ahl-bayes/three-branch/words": (q, T) => {
    const { s, r, w, o } = q.params, N = 1e9, from = s.map((x) => (N * x) / 100), bad = from.map((x, i) => (x * r[i]) / 100), tot = T.sum(bad);
    T.require(T.sum(s) === 100 && r.every((x) => x > 0 && x < 100), "the shares add up to 100 per cent");
    const out = { a: T.approx(tot / N, 1e-9), b: T.approx(bad[w] / tot, 1e-9) };
    if (q.level === 4) out.c = T.approx((from[o] - bad[o]) / (N - tot), 1e-9);
    return out;
  },
  "t4-ahl-bayes/unknown-prior/words": (q, T) => {
    const { s, f, p0, T: target } = q.params, post = (p) => { const N = 1e8, d = N * p; return (d * s) / (d * s + (N - d) * f); };
    T.require(post(1e-6) < target && post(1 - 1e-6) > target, "the stated probability can be reached");
    return { a: post(p0), b: T.bisect((p) => post(p) - target, 1e-6, 1 - 1e-6) };
  },

  // ======================= 4.14 =======================
  "t4-ahl-rv-variance/linear-transform/equation": (q, T) => {
    const { mu, v, a, b } = q.params, sd = Math.sqrt(v);
    // a two-point distribution with this mean and variance, transformed value by value
    const ys = [mu - sd, mu + sd].map((x) => a * x + b), m = T.mean(ys);
    return { a: T.approx(m, 1e-9), b: T.approx(T.mean(ys.map((y) => (y - m) ** 2)), 1e-9) };
  },
  "t4-ahl-rv-variance/discrete-variance/table": (q, T) => {
    const { xs, w } = q.params, p = w.map((k) => k / 10), m = T.sum(xs, (x, i) => x * p[i]);
    T.require(Math.abs(T.sum(p) - 1) < 1e-12 && q.table.head.length === 5 && q.table.rows[0].length === 5, "the probabilities add up to 1 and the table has one column per value");
    return { a: T.approx(m, 1e-9), b: T.approx(T.sum(xs, (x, i) => x * x * p[i]), 1e-9), c: T.approx(T.sum(xs, (x, i) => (x - m) ** 2 * p[i]), 1e-9) };
  },
  "t4-ahl-rv-variance/discrete-unknown/table": (q, T) => {
    const { xs, w, i, j, c, a, b } = q.params;
    const k = T.bisect((x) => T.sum(w, (v, t) => (t === i ? x : t === j ? c * x : v)) - 1, 0, 1), p = w.map((v, t) => (t === i ? k : t === j ? c * k : v));
    T.require(p.every((x) => x > 0 && x < 1), "every probability is between 0 and 1");
    const m = T.sum(xs, (x, t) => x * p[t]), vr = T.sum(xs, (x, t) => (x - m) ** 2 * p[t]), ys = xs.map((x) => a * x + b), my = T.sum(ys, (y, t) => y * p[t]);
    return { a: T.approx(k, 1e-9), b: T.approx(m, 1e-9), c: T.approx(vr, 1e-9), d: T.approx(T.sum(ys, (y, t) => (y - my) ** 2 * p[t]), 1e-7) };
  },
  "t4-ahl-continuous-rv/normalise-probability/equation": (q, T) => {
    const { c, lo, hi, cut, below } = q.params, g = (x) => c.reduce((s, ci, i) => s + ci * x ** i, 0), I = T.integrate(g, lo, hi);
    T.require(T.range(lo, hi, (hi - lo) / 200).every((x) => g(x) >= -1e-12), "the density is never negative");
    return { a: T.approx(1 / I, 1e-8), b: T.approx((below ? T.integrate(g, lo, cut) : T.integrate(g, cut, hi)) / I, 1e-8) };
  },
  "t4-ahl-continuous-rv/mean-variance/equation": (q, T) => {
    const { c, lo, hi } = q.params, g = (x) => c.reduce((s, ci, i) => s + ci * x ** i, 0), I = T.integrate(g, lo, hi);
    T.require(T.range(lo, hi, (hi - lo) / 200).every((x) => g(x) >= -1e-12), "the density is never negative");
    const m = T.integrate((x) => x * g(x), lo, hi) / I;
    return { a: T.approx(1 / I, 1e-8), b: T.approx(m, 1e-8), c: T.approx(T.integrate((x) => (x - m) ** 2 * g(x), lo, hi) / I, 1e-8) };
  },
  "t4-ahl-continuous-rv/median-mode/equation": (q, T) => {
    const { fam, lo, hi, s } = q.params, g = fam === "lin" ? (x) => x + s : (x) => 1 / (x * x), I = T.integrate(g, lo, hi, 4000);
    const med = T.bisect((m) => T.integrate(g, lo, m, 4000) / I - 0.5, lo, hi, 60);
    return { a: T.approx(1 / I, 1e-7), b: T.approx(med, 1e-6), c: T.approx(T.extremum(g, lo, hi, "max").x, 1e-6) };
  },
  "t4-ahl-continuous-rv/technology/equation": (q, T) => {
    const { fam, a, r } = q.params, g = { sqrt: (x) => Math.sqrt(x), exp: (x) => Math.exp(-r * x), recip: (x) => 1 / (x + 1), xexp: (x) => x * Math.exp(-x) }[fam];
    // integrate with x = u^2, which is smooth for every one of these functions
    const area = (h, top) => T.integrate((u) => h(u * u) * 2 * u, 0, Math.sqrt(top), 2000), I = area(g, a);
    const med = T.bisect((m) => area(g, m) / I - 0.5, 0, a, 60);
    return { a: T.approx(1 / I, 1e-7), b: T.approx(area((x) => x * g(x), a) / I, 1e-7), c: T.approx(med, 1e-6) };
  },
  "t4-ahl-continuous-rv/triangular-graph/graph": (q, T) => {
    const { b, c, m } = q.params, fn = q.graph.functions[0].fn, f = (x) => T.evalGraph(fn, x);
    // integrate the drawn function piece by piece (each piece is a straight line, so Simpson's rule is exact)
    const area = (lo, hi) => (lo < c && hi > c ? T.integrate(f, lo, c, 20) + T.integrate(f, c, hi, 20) : T.integrate(f, lo, hi, 20));
    T.require(Math.abs(area(0, b) - 1) < 1e-9, "the area under the graph is 1");
    return { a: T.approx(T.extremum(f, 0, b, "max", 4000).x, 1e-3), b: T.approx(area(0, c), 1e-9), c: T.approx(area(m, b), 1e-9) };
  },
  // ==END==
};
