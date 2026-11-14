// Independent answer verifiers for the AI HL topic 1 to 3 generators (ai-hl-topic123.js), keyed by generator id.
// Routes used here, none of them the generator's own formula: root search and bisection, numerical
// optimisation, power series, Gaussian elimination, brute-force search over integers, step-by-step
// iteration, and for graph theory full enumeration of walks, paths, spanning trees, tours and pairings.

const ap = (T, v, rel = 1e-7) => T.approx(v, rel * Math.max(1, Math.abs(v)));
// Complex numbers as [re, im]; multiplication through moduli and angles (the generators multiply out brackets).
const cmulPolar = (z, w) => { const r = Math.hypot(...z) * Math.hypot(...w), t = Math.atan2(z[1], z[0]) + Math.atan2(w[1], w[0]); return [r * Math.cos(t), r * Math.sin(t)]; };
const cmul = (z, w) => [z[0] * w[0] - z[1] * w[1], z[0] * w[1] + z[1] * w[0]];
// e^(i t) from its power series
const cis = (t) => { let re = 0, im = 0, term = [1, 0]; for (let k = 0; k < 60; k++) { re += term[0]; im += term[1]; term = [(-term[1] * t) / (k + 1), (term[0] * t) / (k + 1)]; } return [re, im]; };
// Solve A x = b by Gaussian elimination with partial pivoting; also gives the determinant.
function gauss(A, b) {
  const n = A.length, M = A.map((r, i) => [...r, ...(b ? [b[i]] : [])]);
  let det = 1;
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-12) return { det: 0 };
    if (p !== c) { [M[p], M[c]] = [M[c], M[p]]; det = -det; }
    det *= M[c][c];
    for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k < M[r].length; k++) M[r][k] -= f * M[c][k]; }
  }
  return { det, x: b ? M.map((r, i) => r[n] / r[i]) : null };
}
const mulM = (X, Y) => X.map((r) => Y[0].map((_, j) => r.reduce((s, v, k) => s + v * Y[k][j], 0)));
const apply = (M, v) => M.map((r) => r.reduce((s, x, k) => s + x * v[k], 0));

// Arc length and area of a sector by adding up many thin chords and thin triangles.
const sweep = (r, th, n = 20000) => { let arc = 0, area = 0, px = r, py = 0; for (let i = 1; i <= n; i++) { const x = r * Math.cos((th * i) / n), y = r * Math.sin((th * i) / n); arc += Math.hypot(x - px, y - py); area += (px * y - py * x) / 2; px = x; py = y; } return { arc, area }; };
const shoelace = (pts) => Math.abs(pts.reduce((s, p, i) => { const n = pts[(i + 1) % pts.length]; return s + p[0] * n[1] - p[1] * n[0]; }, 0)) / 2;
const dist3 = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]));
const heron = (a, b, c) => { const s = (a + b + c) / 2; return Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c))); };
// u . v from lengths only: |u + v|^2 = |u|^2 + |v|^2 + 2 u.v
const polar = (u, v) => (dist3(u.map((x, i) => x + v[i]), u.map(() => 0)) ** 2 - dist3(u, u.map(() => 0)) ** 2 - dist3(v, v.map(() => 0)) ** 2) / 2;
// The vector product from the sign of each permutation of the axes.
const crossPerm = (u, v) => { const n = [0, 0, 0]; for (const [i, j, k, s] of [[0, 1, 2, 1], [1, 2, 0, 1], [2, 0, 1, 1], [0, 2, 1, -1], [2, 1, 0, -1], [1, 0, 2, -1]]) n[i] += s * u[j] * v[k]; return n; };
// The standard transformations done with distances and angles, not matrices.
const rnd = (v) => v.map((x) => { const r = Math.round(x * 1e6) / 1e6; return r === 0 ? 0 : r; });
function geo(key, k, p) {
  const r = Math.hypot(...p), t = Math.atan2(p[1], p[0]), at = (ang, rad = r) => rnd([rad * Math.cos(ang), rad * Math.sin(ang)]);
  const mirror = (phi) => at(2 * phi - t), turn = (ang) => at(t + ang);
  return { refx: () => mirror(0), refy: () => mirror(Math.PI / 2), refyx: () => mirror(Math.PI / 4), refynx: () => mirror(-Math.PI / 4), rot90: () => turn(Math.PI / 2), rot270: () => turn(-Math.PI / 2), rot180: () => turn(Math.PI),
    enl: () => at(t, k * r), hstr: () => [k * p[0], p[1]], vstr: () => [p[0], k * p[1]] }[key]();
}
// The angle with the given sine or cosine in the stated quadrant, and its other ratio.
function pyth(q, T) {
  const { given, s } = q.params, th = given === "sin" ? T.bisect((x) => s - Math.sin(x), Math.PI / 2, Math.PI) : T.bisect((x) => Math.cos(x) - s, 1.5 * Math.PI, 2 * Math.PI);
  return [th, given === "sin" ? Math.cos(th) : Math.sin(th)];
}
// Both triangles of the ambiguous case by construction: C lies on the ray from A where it is at distance a from B. Obtuse C first.
function ambiguous(q, T) {
  const { c, al, a } = q.params, dir = [Math.cos(T.rad(al)), Math.sin(T.rad(al))], Bp = [c, 0];
  const ts = T.roots((t) => Math.hypot(t * dir[0] - c, t * dir[1]) - a, 0.001, 3 * c, 30000);
  T.require(ts.length === 2, "two triangles fit");
  return ts.map((t) => { const C = [t * dir[0], t * dir[1]], u = [-C[0], -C[1]], w = [Bp[0] - C[0], Bp[1] - C[1]]; return { AC: t, C: T.deg(Math.acos((u[0] * w[0] + u[1] * w[1]) / (Math.hypot(...u) * Math.hypot(...w)))), area: shoelace([[0, 0], Bp, C]) }; });
}

export default {
  // ---------------- 1.9 ----------------
  "t1-ai-log-laws/combine/equation": (q, T) => { const { a, b, c } = q.params; return { a: ap(T, Math.exp(Math.log(a) + Math.log(b) - Math.log(c))) }; },
  "t1-ai-log-laws/expand/equation": (q, T) => {
    const { p, q: qq, m, n } = q.params, a = 10 ** p, b = 10 ** qq;
    return { a: ap(T, Math.log10(a ** m * b)), b: ap(T, Math.log10(Math.sqrt(a) / b ** n)) };
  },
  "t1-ai-log-laws/solve-equation/equation": (q, T) => {
    const { a, k } = q.params, r = T.roots((x) => 2 * Math.log(x) - Math.log(x + a) - Math.log(k), 0.01, 200, 8000);
    T.require(r.length === 1, "one positive solution");
    return { a: ap(T, (r[0] * r[0]) / (r[0] + a)), b: ap(T, r[0]) };
  },
  "t1-ai-log-laws/ratio-quotient-law/words": (q, T) => {
    const { c, e, L1, L2, k } = q.params, I0 = 1e-12, I = (L) => I0 * 10 ** (L / 10);
    const level = (target) => T.bisect((L) => I(L) - target, 0, 200);
    return { a: ap(T, level(c * 10 ** -e)), b: ap(T, I(L1) / I(L2)), c: ap(T, level(k * I(L1))) };
  },
  // ---------------- 1.10 ----------------
  "t1-ai-rational-exponents/evaluate/equation": (q, T) => { const { b, p, n } = q.params; return { a: ap(T, Math.exp((p / n) * Math.log(b))) }; },
  "t1-ai-rational-exponents/root-as-power/equation": (q, T) => {
    const { form, n, p, a } = q.params, f = (x) => [Math.pow(x ** p, 1 / n), 1 / Math.pow(x ** p, 1 / n), x ** a * Math.sqrt(x), x ** a / Math.pow(x, 1 / n)][form];
    return { a: ap(T, Math.log(f(2.3)) / Math.log(2.3)) };   // the power is the slope of ln f against ln x
  },
  "t1-ai-rational-exponents/simplify-power/equation": (q, T) => {
    const { b, e, p, n } = q.params, f = (x) => Math.exp((p / n) * Math.log(b * x ** e));
    return { a: ap(T, f(1)), b: ap(T, Math.log(f(2) / f(1)) / Math.log(2)) };
  },
  "t1-ai-rational-exponents/simplify-chain/equation": (q, T) => {
    const { b, e, p, n, d, r, x } = q.params, f = (t) => Math.exp((p / n) * Math.log(b * t ** e)) / (d * Math.pow(t, 1 / r));
    return { a: ap(T, f(1)), b: ap(T, Math.log(f(2) / f(1)) / Math.log(2)), c: ap(T, f(x)) };
  },
  "t1-ai-rational-exponents/power-model/words": (q, T) => {
    const { c, p, q: qq, x1, y2, f } = q.params, y = (x) => c * Math.exp((p / qq) * Math.log(x));
    return { a: ap(T, y(x1)), b: ap(T, T.bisect((x) => y(x) - y2, 1e-6, 1e7)), c: ap(T, y(5 * f) / y(5)) };
  },
  // ---------------- 1.12 ----------------
  "t1-ai-complex-cartesian/product/equation": (q, T) => { const { a, b, c, d } = q.params, z = cmulPolar([a, b], [c, d]); return { a: ap(T, z[0]), b: ap(T, z[1]) }; },
  "t1-ai-complex-cartesian/quotient/equation": (q, T) => {
    const { a, b, c, d } = q.params, r = Math.hypot(a, b) / Math.hypot(c, d), t = Math.atan2(b, a) - Math.atan2(d, c);
    const z = [r * Math.cos(t), r * Math.sin(t)], back = cmul(z, [c, d]);
    T.require(T.close(back[0], a) && T.close(back[1], b), "the quotient times w gives z back");
    return { a: ap(T, z[0]), b: ap(T, z[1]) };
  },
  "t1-ai-complex-cartesian/modulus-argument/equation": (q, T) => {
    // the modulus is the greatest value of Re(z e^{-i t}) and the argument is where it happens
    const { a, b } = q.params, best = T.extremum((t) => a * Math.cos(t) + b * Math.sin(t), -Math.PI, Math.PI, "max", 4000);
    return { a: T.approx(best.value, 1e-6), b: T.approx(best.x, 1e-5) };
  },
  "t1-ai-complex-cartesian/read-argand/graph": (q, T) => {
    const { a, b, c, d } = q.params, pts = q.graph.points;
    T.require(pts[0].x === a && pts[0].y === b && pts[1].x === c && pts[1].y === d, "the diagram shows the two numbers");
    // cosine rule in the triangle O, A, B
    const dist = Math.sqrt(a * a + b * b + c * c + d * d - 2 * Math.hypot(a, b) * Math.hypot(c, d) * Math.cos(Math.atan2(b, a) - Math.atan2(d, c)));
    return { a: pts[0].y, b: pts[0].x - pts[1].x, c: ap(T, dist) };
  },
  "t1-ai-complex-cartesian/quadratic-roots/equation": (q, T) => {
    const { lead, b, c } = q.params, f = (x) => lead * x * x + b * x + c;
    T.require(T.roots(f, -60, 60, 6000).length === 0, "the graph does not meet the x-axis");
    const v = T.extremum(f, -30, 30, "min", 6000), p = v.x, qq = Math.sqrt(v.value / lead);   // vertex (p, lead q^2)
    const z2 = cmul([p, qq], [p, qq]), val = [lead * z2[0] + b * p + c, lead * z2[1] + b * qq];
    T.require(Math.hypot(...val) < 1e-4, "p + qi satisfies the equation");
    // the discriminant from the least value: f(p) = -disc / (4 lead)
    return { a: T.approx(-4 * lead * v.value, 1e-5), b: T.approx(p, 1e-5), c: T.approx(qq, 1e-5) };
  },
  "t1-ai-complex-cartesian/powers-technology/equation": (q, T) => {
    const { a, b, c, d } = q.params, z = [a, b], z3 = cmulPolar(cmulPolar(z, z), z), pr = cmulPolar(z, [c, -d]);
    const quot = Math.sqrt((z3[0] ** 2 + z3[1] ** 2) / (c * c + d * d));
    return { a: ap(T, z3[0]), b: ap(T, z3[1]), c: ap(T, quot), d: ap(T, Math.atan2(pr[1], pr[0])) };
  },
  // ---------------- 1.13 ----------------
  "t1-ai-complex-polar/polar-to-cartesian/equation": (q, T) => { const { r, th } = q.params, e = cis(th); return { a: ap(T, r * e[0]), b: ap(T, r * e[1]) }; },
  "t1-ai-complex-polar/product-powers/equation": (q, T) => {
    const { ra, rb, th1, th2 } = q.params, z = cis(th1).map((v) => v * ra), w = cis(th2).map((v) => v * rb);
    const zw = cmul(z, w), z3 = cmul(cmul(z, z), z), n = rb * rb, quot = cmul(z3, [w[0] / n, -w[1] / n]);
    T.require(Math.abs(th1 + th2) < Math.PI && Math.abs(3 * th1 - th2) < Math.PI, "the arguments asked for are principal");
    return { a: ap(T, Math.hypot(...zw)), b: ap(T, Math.atan2(zw[1], zw[0])), c: ap(T, Math.hypot(...quot)), d: ap(T, Math.atan2(quot[1], quot[0])) };
  },
  "t1-ai-complex-polar/sum-sinusoids/words": (q, T) => {
    const { a, b, w, ph } = q.params, V = (t) => a * Math.sin(w * t) + b * Math.sin(w * t + ph), per = (2 * Math.PI) / w;
    const best = T.extremum(V, 0, per, "max", 8000), A = best.value, al = Math.asin(V(0) / A);
    T.require(T.deriv(V, 0) > 0 && al > 0 && al < Math.PI / 2, "alpha is between 0 and a right angle");
    T.require([0.3, 1.1, 2.9].every((t) => Math.abs(V(t) - A * Math.sin(w * t + al)) < 1e-5), "the single sinusoid matches the sum");
    return { a: T.approx(A, 1e-6), b: T.approx(al, 1e-5), c: T.approx(best.x, 1e-5) };
  },
  "t1-ai-complex-polar/rotation-stretch/equation": (q, T) => {
    const { a, b, c, d, n } = q.params;
    let z = [c, d];
    for (let i = 0; i < n; i++) z = cmul(z, [a, b]);
    const one = cmul([1, 0], [a, b]), best = T.extremum((t) => one[0] * Math.cos(t) + one[1] * Math.sin(t), 0, Math.PI, "max", 4000);
    return { a: T.approx(best.value, 1e-6), b: T.approx(best.x, 1e-5), c: ap(T, Math.hypot(...z)) };
  },
  // ---------------- 1.14 ----------------
  "t1-ai-matrix-algebra/determinant/equation": (q, T) => ({ a: ap(T, gauss(q.params.A).det) }),
  "t1-ai-matrix-algebra/product-entries/equation": (q, T) => {
    const { A, B, i, j } = q.params, e = [0, 1].map((k) => (k === j ? 1 : 0));
    return { a: apply(A, apply(B, e))[i], b: apply(B, apply(A, e))[i] };   // the image of a base vector under one map, then the other
  },
  "t1-ai-matrix-algebra/inverse-entry/equation": (q, T) => {
    const { A, i, j } = q.params, e = [0, 1].map((k) => (k === j ? 1 : 0)), g = gauss(A, e);   // column j of the inverse solves A x = e_j
    T.require(Math.abs(g.det) > 1e-9, "the matrix is invertible");
    return { a: ap(T, g.det), b: ap(T, g.x[i]) };
  },
  "t1-ai-matrix-algebra/solve-with-inverse/equation": (q, T) => {
    const { A, b } = q.params, hits = [];
    for (let x = -30; x <= 30; x++) for (let y = -30; y <= 30; y++) if (A[0][0] * x + A[0][1] * y === b[0] && A[1][0] * x + A[1][1] * y === b[1]) hits.push([x, y]);
    T.require(hits.length === 1, "one integer solution");
    return { a: ap(T, gauss(A).det), b: hits[0][0], c: hits[0][1] };
  },
  "t1-ai-matrix-algebra/solve-system/table": (q, T) => {
    const { A, b } = q.params, g = gauss(A, b);
    T.require(q.table.rows.every((r, i) => r.slice(1, 4).every((cell, j) => cell === `$${A[i][j]}$`)), "the table shows the matrix");
    T.require(Math.abs(g.det) > 1, "the system has one solution");
    T.require(g.x.every((v) => v > 0.5 && v < 10), "sensible prices");
    return { a: ap(T, g.det), b: T.approx(g.x[0], 1e-7), c: T.approx(g.x[1], 1e-7), d: T.approx(g.x[2], 1e-7) };
  },
  // ---------------- 1.15 ----------------
  "t1-ai-eigen/verify-eigenvector/equation": (q, T) => {
    const { M, v } = q.params, Mv = apply(M, v);
    T.require(Math.abs(Mv[0] * v[1] - Mv[1] * v[0]) < 1e-9, "Mv is parallel to v");
    return { a: Mv[0] / v[0] };
  },
  "t1-ai-eigen/eigenvalues/equation": (q, T) => {
    const { M } = q.params, ch = (l) => gauss([[M[0][0] - l, M[0][1]], [M[1][0], M[1][1] - l]]).det;
    const r = T.roots(ch, -40.03, 40.07, 16000);
    T.require(r.length === 2, "two distinct real eigenvalues");
    return { a: ap(T, ch(1) - 1 - ch(0)), b: ap(T, ch(0)), c: T.approx(r[0], 1e-6), d: T.approx(r[1], 1e-6) };
  },
  "t1-ai-eigen/eigenvectors/equation": (q, T) => {
    const { M } = q.params;
    // (1, k) is an eigenvector when M(1, k) is parallel to (1, k)
    const ks = T.roots((k) => M[1][0] + M[1][1] * k - k * (M[0][0] + M[0][1] * k), -20.03, 20.07, 16000);
    T.require(ks.length === 2, "two eigenvector directions");
    const pairs = ks.map((k) => ({ k, lam: M[0][0] + M[0][1] * k })).sort((x, y) => x.lam - y.lam);
    return { a: T.approx(pairs[0].lam, 1e-6), b: T.approx(pairs[1].lam, 1e-6), c: T.approx(pairs[0].k, 1e-6), d: T.approx(pairs[1].k, 1e-6) };
  },
  "t1-ai-eigen/long-term/words": (q, T) => {
    const { a, b, A0, B0, n } = q.params, Tm = [[1 - a / 100, b / 100], [a / 100, 1 - b / 100]];
    let s = [A0, B0], an = null;
    for (let i = 1; i <= 4000; i++) { s = apply(Tm, s); if (i === n) an = s[0]; }
    const r = T.roots((l) => (Tm[0][0] - l) * (Tm[1][1] - l) - Tm[0][1] * Tm[1][0], -0.5003, 0.9951, 6000);
    T.require(r.length === 1, "one eigenvalue below 1");
    return { a: T.approx(r[0], 1e-7), b: ap(T, an), c: T.approx(s[0], 1e-6) };
  },
  // ---------------- 2.7 ----------------
  "fn-ai-composite-inverse/composite-from-table/table": (q, T) => {
    const cell = (s) => Number(s.replace(/\$/g, "")), xs = q.table.head.slice(1).map(cell), look = (row, x) => cell(q.table.rows[row][1 + xs.indexOf(x)]), k = q.params.k;
    return { a: look(0, look(1, k)), b: look(1, look(0, k)) };
  },
  "fn-ai-composite-inverse/composite-order/words": (q, T) => {
    const { c, d, price } = q.params, cents = price * 100, saleFirst = (cents * (100 - d)) / 100 - c * 100, voucherFirst = ((cents - c * 100) * (100 - d)) / 100;   // in cents
    T.require(saleFirst < voucherFirst, "taking the sale first is cheaper");
    return { a: ap(T, saleFirst / 100), b: ap(T, voucherFirst / 100), c: ap(T, (voucherFirst - saleFirst) / 100) };
  },
  "fn-ai-composite-inverse/inverse-linear/words": (q, T) => {
    const { a, b, v } = q.params;
    return { a: ap(T, T.bisect((x) => b + a * x - v, 0, 1e5)), b: T.option("input-for-output") };
  },
  "fn-ai-composite-inverse/inverse-restricted/equation": (q, T) => {
    const { a, b, c, v } = q.params, f = (x) => a * x * x + b * x + c, low = T.extremum(f, -5, 40, "min", 9000);
    T.require(v > low.value + 1, "the value is in the range of f");
    return { a: T.approx(low.x, 1e-5), b: T.approx(low.value, 1e-6), c: ap(T, T.bisect((x) => f(x) - v, low.x, 500)) };
  },
  "fn-ai-composite-inverse/composite-model/words": (q, T) => {
    const { k, t1, S2, R } = q.params, r = (t) => k * Math.sqrt(t), A = (x) => Math.PI * x * x;
    return { a: ap(T, A(r(t1))), b: ap(T, T.bisect((t) => A(r(t)) - S2, 0, 1e7)), c: ap(T, T.bisect((t) => r(t) - R, 0, 1e7)) };
  },
  // ---------------- 2.9 ----------------
  "fn-ai-further-models/half-life/words": (q, T) => {
    const { k, N0, decay } = q.params, f = (t) => N0 * Math.exp((decay ? -k : k) * t);
    return { a: ap(T, T.bisect((t) => f(t) - (decay ? N0 / 2 : 2 * N0), 0, 1000)) };
  },
  "fn-ai-further-models/log-model/words": (q, T) => {
    const { a, b, x1, y2 } = q.params, f = (x) => a + b * Math.log(x);
    return { a: ap(T, f(x1)), b: ap(T, T.bisect((x) => f(x) - y2, 1e-9, 1e6)) };
  },
  "fn-ai-further-models/piecewise-join/equation": (q, T) => {
    const { a, b, c, m, x2 } = q.params, left = a * c * c + b;
    let k = null;
    for (let t = -500; t <= 500; t++) if (t - m * c === left) k = t;      // search for the constant that closes the gap
    T.require(k !== null && x2 > c, "the pieces can join and the point is on the second piece");
    return { a: k, b: k - m * x2 };
  },
  "fn-ai-further-models/logistic/words": (q, T) => {
    const { L, C, k, target } = q.params, f = (t) => L / (1 + C * Math.exp(-k * t));
    T.require(target > f(0) && target < L, "the target is reached");
    return { a: ap(T, f(0)), b: T.approx(f(1e4), 1e-6), c: ap(T, T.bisect((t) => f(t) - target, 0, 1e4)) };
  },
  "fn-ai-further-models/sinusoidal/words": (q, T) => {
    const { M, lo, T: per, c, t1 } = q.params, A = q.parts.map((p) => p.answer.value);
    const f = (t) => A[0] * Math.sin(A[2] * (t - c)) + A[1], hi = T.extremum(f, 0, per, "max", 6000), low = T.extremum(f, 0, per, "min", 6000);
    // the stated answers must reproduce the facts in the stem
    T.require(Math.abs(hi.value - M) < 1e-6 && Math.abs(low.value - lo) < 1e-6, "the model has the stated greatest and least depths");
    T.require([0.7, 3.1, 8.2].every((t) => Math.abs(f(t + per) - f(t)) < 1e-9) && Math.abs(f(per / 2 + 0.7) - f(0.7)) > 1e-3, "the model has the stated period");
    const b = T.bisect((x) => x * per - 2 * Math.PI, 0, 10);
    return { a: ap(T, (hi.value - low.value) / 2), b: ap(T, (hi.value + low.value) / 2), c: ap(T, b), d: ap(T, ((M - lo) / 2) * Math.sin(b * (t1 - c)) + (M + lo) / 2) };
  },
  // ---------------- 2.10 ----------------
  "fn-ai-linearise/choose-plot/equation": (q, T) => {
    const { kind, a, b } = q.params, y = (x) => (kind === 0 ? a * Math.exp(b * x) : kind === 1 ? a * Math.pow(x, b) : a + b * Math.log(x));
    const tr = { "lny-x": [(x) => x, Math.log], "lny-lnx": [Math.log, Math.log], "y-lnx": [Math.log, (v) => v], "y-x": [(x) => x, (v) => v] };
    const xs = kind === 2 ? [1.02, 1.05, 1.09] : [1.1, 1.9, 3.4], slopes = {};
    for (const [key, [fx, fy]] of Object.entries(tr)) {
      const pts = xs.map((x) => [fx(x), fy(y(x))]), s1 = (pts[1][1] - pts[0][1]) / (pts[1][0] - pts[0][0]), s2 = (pts[2][1] - pts[1][1]) / (pts[2][0] - pts[1][0]);
      if (Math.abs(s1 - s2) < 1e-9) slopes[key] = s1;
    }
    const keys = Object.keys(slopes);
    T.require(keys.length === 1, "exactly one of the plots is straight");
    return { a: T.option(keys[0]), b: ap(T, slopes[keys[0]]) };
  },
  "fn-ai-linearise/line-to-model/equation": (q, T) => {
    const { power, m, c, x1 } = q.params, y = (x) => Math.exp(m * (power ? Math.log(x) : x) + c);
    return { a: ap(T, power ? y(1) : y(0)), b: ap(T, y(x1)) };
  },
  "fn-ai-linearise/log-scale/words": (q, T) => {
    const { c, e, p1, p2 } = q.params, conc = (pH) => 10 ** -pH;
    return { a: ap(T, T.bisect((pH) => c * 10 ** -e - conc(pH), 0, 14)), b: ap(T, conc(p1) / conc(p2), 1e-6) };
  },
  "fn-ai-linearise/regression/table": (q, T) => {
    const { power, xs, ys, x0 } = q.params, cell = (s) => Number(s.replace(/\$/g, ""));
    T.require(q.table.head.slice(1).every((s, i) => cell(s) === xs[i]) && q.table.rows[0].slice(1).every((s, i) => cell(s) === ys[i]), "the table shows the data");
    const X = xs.map((x) => (power ? Math.log(x) : x)), Y = ys.map(Math.log), mx = T.mean(X), my = T.mean(Y);
    // the least squares line passes through the mean point and leaves residuals uncorrelated with X
    const b = T.bisect((g) => T.sum(X, (x, i) => (x - mx) * (Y[i] - my - g * (x - mx))), -50, 50), c = my - b * mx;
    const sse = (g, k) => T.sum(X, (x, i) => (Y[i] - g * x - k) ** 2);
    T.require([[1e-3, 0], [-1e-3, 0], [0, 1e-3], [0, -1e-3]].every(([dg, dk]) => sse(b + dg, c + dk) > sse(b, c)), "the line minimises the sum of squares");
    return { a: ap(T, b), b: ap(T, c), c: ap(T, Math.exp(c)), d: ap(T, power ? Math.exp(c) * x0 ** b : Math.exp(c + b * x0)) };
  },
  // ---------------- 3.7 ----------------
  "t3-ai-radian-measure/convert/equation": (q, T) => {
    const { toRad, d, r } = q.params;   // the same fraction of a full turn in both units
    return { a: ap(T, toRad ? T.bisect((x) => x / (2 * Math.PI) - d / 360, 0, 10) : T.bisect((x) => x / 360 - r / (2 * Math.PI), 0, 400)) };
  },
  "t3-ai-radian-measure/arc-sector/diagram": (q, T) => { const { r, th } = q.params, s = sweep(r, th); return { a: T.approx(s.arc, 1e-6 * s.arc), b: T.approx(s.area, 1e-6 * s.area) }; },
  "t3-ai-radian-measure/sector-exact/equation": (q, T) => {
    const { r, p, q: qq } = q.params, th = T.bisect((x) => x * qq - p * Math.PI, 0, 7), s = sweep(r, th);
    return { a: T.approx(s.arc, 1e-6 * s.arc), b: T.approx(2 * r + s.arc, 1e-5), c: T.approx(s.area, 1e-6 * s.area) };
  },
  "t3-ai-radian-measure/segment/diagram": (q, T) => {
    const { r, th } = q.params, A = [r, 0], Bp = [r * Math.cos(th), r * Math.sin(th)], chord = Math.hypot(A[0] - Bp[0], A[1] - Bp[1]);
    T.require(th < Math.PI, "the segment is the minor one");
    const d = Math.sqrt(r * r - (chord / 2) ** 2), seg = T.integrate((x) => 2 * Math.sqrt(Math.max(0, r * r - x * x)), d, r, 400000);   // strips parallel to the chord
    const tri = Math.abs(A[0] * Bp[1] - A[1] * Bp[0]) / 2;
    return { a: ap(T, chord), b: T.approx(seg + tri, 1e-5 * (seg + tri)), c: T.approx(seg, 1e-5 * Math.max(1, seg)) };
  },
  "t3-ai-radian-measure/angular-rate/words": (q, T) => {
    const { N, t, r } = q.params, turns = (N * t) / 60, s = sweep(r, 1);   // s.arc is the arc for one radian
    const circumference = sweep(r, Math.PI).arc * 2;
    return { a: T.approx((turns * circumference) / s.arc, 1e-4), b: T.approx(turns * circumference, 1e-3) };
  },
  // ---------------- 3.8 ----------------
  "t3-ai-unit-circle/pythagorean-identity/equation": (q, T) => ({ a: ap(T, pyth(q, T)[1]) }),
  "t3-ai-unit-circle/identity-and-tan/equation": (q, T) => { const [th, other] = pyth(q, T); return { a: ap(T, other), b: ap(T, Math.tan(th)) }; },
  "t3-ai-unit-circle/ambiguous-angles/words": (q, T) => { const t = ambiguous(q, T); return { a: ap(T, t[1].C), b: ap(T, t[0].C) }; },
  "t3-ai-unit-circle/ambiguous-triangle/words": (q, T) => { const t = ambiguous(q, T); return { a: ap(T, t[1].C), b: ap(T, t[0].C), c: ap(T, t[0].AC), d: ap(T, t[0].area) }; },
  "t3-ai-unit-circle/solve-trig-equation/graph": (q, T) => {
    const { a, b, d, k, X } = q.params, f = (x) => a * Math.sin(b * x) + d - k, r = T.roots(f, 0, X, 20000);
    const g = q.graph.functions;
    T.require([0.3, 1.7, 4.2].every((x) => Math.abs(T.evalGraph(g[0].fn, x) - (f(x) + k)) < 1e-9 && Math.abs(T.evalGraph(g[1].fn, x) - k) < 1e-9), "the graph shows the function and the line");
    T.require(r.length >= 2 && r.every((x) => Math.abs(T.deriv(f, x)) > 0.3), "the line crosses the curve cleanly");
    return { a: r.length, b: ap(T, r[0]), c: ap(T, r[r.length - 1]) };
  },
  // ---------------- 3.9 ----------------
  "t3-ai-matrix-transformations/identify-matrix/equation": (q, T) => {
    const { key, k } = q.params, e1 = geo(key, k, [1, 0]), e2 = geo(key, k, [0, 1]);
    return { a: T.option([[e1[0], e2[0]], [e1[1], e2[1]]]) };
  },
  "t3-ai-matrix-transformations/area-scale-factor/equation": (q, T) => {
    const { M, S } = q.params, tri = [[0, 0], [1, 0], [0, 1]].map((p) => apply(M, p));
    return { a: ap(T, (shoelace(tri) / 0.5) * S) };
  },
  "t3-ai-matrix-transformations/image-affine/equation": (q, T) => {
    const { M, b, p, S } = q.params, f = (v) => apply(M, v).map((x, i) => x + b[i]), tri = [[0, 0], [1, 0], [0, 1]].map(f);
    // the map is linear plus a shift: the image of p from the images of the origin and the unit points
    const o = f([0, 0]), e1 = f([1, 0]), e2 = f([0, 1]), im = [0, 1].map((i) => o[i] + p[0] * (e1[i] - o[i]) + p[1] * (e2[i] - o[i]));
    return { a: im[0], b: im[1], c: ap(T, (shoelace(tri) / 0.5) * S) };
  },
  "t3-ai-matrix-transformations/compose-standard/words": (q, T) => {
    const { k1, k2, k, p } = q.params, im = geo(k2, k, geo(k1, k, p)), other = geo(k1, k, geo(k2, k, p));
    T.require(Math.hypot(im[0] - other[0], im[1] - other[1]) > 1e-9, "the order of the two transformations matters for this point");
    return { a: im[0], b: im[1] };
  },
  "t3-ai-matrix-transformations/rotate-enlarge/words": (q, T) => {
    const { th, k, p, S } = q.params, turn = (v) => { const r = Math.hypot(...v) * k, a = Math.atan2(v[1], v[0]) + T.rad(th); return [r * Math.cos(a), r * Math.sin(a)]; };
    const im = turn(p), tri = [[0, 0], [3, 0], [0, 2]].map(turn);
    return { a: ap(T, turn([1, 0])[0]), b: ap(T, im[0]), c: ap(T, im[1]), d: ap(T, (shoelace(tri) / 3) * S) };
  },
  "t3-ai-matrix-transformations/fixed-point/equation": (q, T) => {
    const { M, b, Q } = q.params, pre = gauss(M, [Q[0] - b[0], Q[1] - b[1]]).x, fx = gauss([[M[0][0] - 1, M[0][1]], [M[1][0], M[1][1] - 1]], [-b[0], -b[1]]).x;
    const f = (v) => apply(M, v).map((x, i) => x + b[i]), back = f(pre), same = f(fx);
    T.require(T.close(back[0], Q[0]) && T.close(back[1], Q[1]) && T.close(same[0], fx[0]) && T.close(same[1], fx[1]), "the two points do what the question says");
    return { a: ap(T, pre[0]), b: ap(T, pre[1]), c: ap(T, fx[0]), d: ap(T, fx[1]) };
  },
  // ---------------- 3.10 ----------------
  "t3-ai-vector-basics/magnitude/equation": (q, T) => ({ a: ap(T, dist3(q.params.v, [0, 0, 0])) }),
  "t3-ai-vector-basics/displacement-distance/equation": (q, T) => {
    const { a, b } = q.params, L = dist3(a, b), t = T.bisect((s) => s * L - 1, 0, 1);
    return { a: b[0] - a[0], b: ap(T, L), c: ap(T, t * (b[0] - a[0])) };
  },
  "t3-ai-vector-basics/parallel-scaled/equation": (q, T) => {
    const { v, w0, M } = q.params, hits = [];
    for (let p = -80; p <= 80; p++) for (let s = -80; s <= 80; s++) { const w = [w0, p, s]; if (w[0] * v[1] === w[1] * v[0] && w[0] * v[2] === w[2] * v[0] && w[1] * v[2] === w[2] * v[1]) hits.push(w); }
    T.require(hits.length === 1, "one parallel vector with that first component");
    const L = dist3(v, [0, 0, 0]), t = T.bisect((s) => dist3(v.map((x) => x * s), [0, 0, 0]) - M, 0, 100);
    return { a: ap(T, L), b: hits[0][1], c: hits[0][2], d: ap(T, t * v[0]) };
  },
  "t3-ai-vector-basics/resultant/words": (q, T) => {
    const { f, g } = q.params, R = [f[0] + g[0], f[1] + g[1]], best = T.extremum((t) => R[0] * Math.cos(t) + R[1] * Math.sin(t), 0, Math.PI / 2, "max", 4000);
    return { a: T.approx(best.value, 1e-6), b: T.approx(T.deg(best.x), 1e-4) };
  },
  "t3-ai-vector-basics/drone-velocity/words": (q, T) => {
    const { a, b, s } = q.params, L = dist3(a, b), time = T.bisect((t) => s * t - L, 0, 1e4);
    return { a: ap(T, L), b: ap(T, (b[2] - a[2]) / time), c: ap(T, time) };   // height gained over the time taken
  },
  // ---------------- 3.11 ----------------
  "t3-ai-vector-line/point-at-parameter/equation": (q, T) => {
    const { a, d, k, zt } = q.params, at = (l) => a.map((v, i) => v + l * d[i]);
    return { a: at(k)[1], b: ap(T, T.bisect((l) => (at(l)[2] - zt) * Math.sign(d[2]), -50, 50)) };
  },
  "t3-ai-vector-line/through-two-points/equation": (q, T) => {
    const { a, b } = q.params, at = (l) => a.map((v, i) => v + l * (b[i] - a[i])), l = T.bisect((s) => at(s)[2] * Math.sign(b[2] - a[2]), -100, 100);
    return { a: at(1)[1] - at(0)[1], b: ap(T, at(l)[0]), c: ap(T, at(l)[1]) };
  },
  "t3-ai-vector-line/intersection/equation": (q, T) => {
    const { a, d1, c, d2 } = q.params, hits = [];
    for (let l = -12; l <= 12; l++) for (let mu = -12; mu <= 12; mu++) if ([0, 1, 2].every((i) => a[i] + l * d1[i] === c[i] + mu * d2[i])) hits.push([l, mu]);
    T.require(hits.length === 1, "the lines meet at exactly one point");
    return { a: hits[0][0], b: hits[0][1], c: a[2] + hits[0][0] * d1[2] };
  },
  "t3-ai-vector-line/closest-point/equation": (q, T) => {
    const { a, d, p } = q.params, far = (l) => dist3(a.map((v, i) => v + l * d[i]), p), best = T.extremum((l) => far(l) ** 2, -60, 60, "min", 12000);
    return { a: T.approx(best.x, 1e-5), b: T.approx(far(best.x), 1e-6) };
  },
  // ---------------- 3.12 ----------------
  "t3-ai-vector-kinematics/speed/words": (q, T) => ({ a: ap(T, dist3([...q.params.v, 0], [0, 0, 0])) }),
  "t3-ai-vector-kinematics/position-at-time/words": (q, T) => {
    const { r0, v, t } = q.params;
    let pos = r0.slice();
    for (let i = 0; i < 1000; i++) pos = pos.map((x, j) => x + (v[j] * t) / 1000);   // step along the path
    return { a: T.approx(pos[0], 1e-7), b: T.approx(pos[1], 1e-7), c: T.approx(Math.hypot(...pos), 1e-7) };
  },
  "t3-ai-vector-kinematics/closest-approach/words": (q, T) => {
    const { a0, va, b0, vb } = q.params, gap = (t) => Math.hypot(b0[0] + t * vb[0] - a0[0] - t * va[0], b0[1] + t * vb[1] - a0[1] - t * va[1]);
    const best = T.extremum((t) => gap(t) ** 2, 0, 24, "min", 24000);
    T.require(best.x > 0.3 && gap(best.x) < gap(0), "the ships are closest after noon");
    return { a: ap(T, gap(0)), b: T.approx(best.x, 1e-5), c: T.approx(gap(best.x), 1e-6) };
  },
  "t3-ai-vector-kinematics/projectile/words": (q, T) => {
    const { u, w, h, t1 } = q.params, x = (t) => u * t, y = (t) => h + w * t - 4.9 * t * t, land = T.roots(y, 0.01, 60, 6000);
    T.require(land.length === 1 && t1 < land[0], "it lands once, after the first time asked about");
    const Tl = land[0];
    return { a: T.approx(T.deriv(y, t1, 1e-4), 1e-6), b: ap(T, Tl), c: ap(T, x(Tl)), d: T.approx(Math.hypot(T.deriv(x, Tl, 1e-4), T.deriv(y, Tl, 1e-4)), 1e-6) };
  },
  // ---------------- 3.13 ----------------
  "t3-ai-scalar-vector-product/scalar-product/equation": (q, T) => ({ a: ap(T, polar(q.params.v, q.params.w)) }),
  "t3-ai-scalar-vector-product/angle-between/equation": (q, T) => {
    const { v, w } = q.params, a = dist3(v, [0, 0, 0]), b = dist3(w, [0, 0, 0]), c = dist3(v, w);
    return { a: ap(T, polar(v, w)), b: ap(T, T.deg(Math.acos((a * a + b * b - c * c) / (2 * a * b)))) };   // cosine rule in the triangle of the two vectors
  },
  "t3-ai-scalar-vector-product/vector-product/equation": (q, T) => {
    const { v, w } = q.params, n = crossPerm(v, w);
    T.require(Math.abs(polar(n, v)) < 1e-9 && Math.abs(polar(n, w)) < 1e-9, "the product is perpendicular to both vectors");
    T.require(T.close(dist3(n, [0, 0, 0]), 2 * heron(dist3(v, [0, 0, 0]), dist3(w, [0, 0, 0]), dist3(v, w))), "its magnitude is the area of the parallelogram");
    return { a: n[0], b: n[1], c: n[2] };
  },
  "t3-ai-scalar-vector-product/perpendicular-parameter/equation": (q, T) => {
    const { a, b, c, d, e } = q.params, hits = [];
    for (let k = -60; k <= 60; k++) if (a * c + k * d + b * e === 0) hits.push(k);
    T.require(hits.length === 1, "one whole-number value of k");
    return { a: hits[0], b: ap(T, dist3([a, hits[0], b], [0, 0, 0]) ** 2) };
  },
  "t3-ai-scalar-vector-product/triangle-area/words": (q, T) => {
    const { A, B, C } = q.params, c = dist3(A, B), b = dist3(A, C), a = dist3(B, C), cosA = (b * b + c * c - a * a) / (2 * b * c);
    return { a: ap(T, b * c * cosA), b: ap(T, T.deg(Math.acos(cosA))), c: ap(T, heron(a, b, c)) };
  },
  // @@GRAPHS@@
};
