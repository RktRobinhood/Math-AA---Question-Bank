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
  // @@TOPIC3@@
};
