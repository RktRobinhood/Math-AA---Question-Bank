// Independent answer verifiers for the AI SL generators in assets/js/engine/generators/ai-sl-own.js,
// keyed by generator id. Nothing here uses the generators' formulas: loans and annuities are simulated
// month by month, equations are solved by elimination or root search, areas and probabilities come from
// numerical integration, Voronoi answers from brute-force distance comparisons.

const ap = (T, v, rel = 1e-6) => T.approx(v, rel * Math.max(1, Math.abs(v)));
const cents = (T, v) => T.approx(v, 0.0051);
const round2 = (x) => Math.round(x * 100) / 100;
// Gaussian elimination with partial pivoting.
function solve(A, b) {
  const n = b.length, M = A.map((r, i) => r.concat([b[i]]));
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    if (Math.abs(M[c][c]) < 1e-12) return null;
    for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  return M.map((r, i) => r[n] / r[i]);
}
// A loan or an annuity, period by period: interest is added, then the payment is taken off.
function run(pv, rate, pay, k) { let b = pv; for (let j = 0; j < k; j++) b = b * (1 + rate / 1200) - pay; return b; }
const levelPayment = (T, pv, rate, n) => T.bisect((x) => -run(pv, rate, x, n), 0, pv * 2, 200);
function paymentsToClear(pv, rate, pay) { let b = pv, n = 0; while (b > 1e-9 && n < 5000) { b = b * (1 + rate / 1200) - pay; n++; } return { n, last: b }; }
const mcValue = (T, q, label, test) => T.optionWhere(q, label, test);

// ---- geometry ----
// An arc measured as a chain of many short chords.
function arcByChords(r, th, n = 20000) {
  let s = 0, px = r, py = 0;
  for (let i = 1; i <= n; i++) { const t = (th * Math.PI / 180) * i / n, x = r * Math.cos(t), y = r * Math.sin(t); s += Math.hypot(x - px, y - py); px = x; py = y; }
  return s;
}
// A sector as a stack of thin rings: each ring at distance x from the centre has length x times the angle.
const sectorByRings = (T, r, th) => T.integrate((x) => x * (th * Math.PI / 180), 0, r, 200);
const slopeBySearch = (T, A, B) => T.bisect((m) => (B[1] - A[1]) - m * (B[0] - A[0]), -1000, 1000, 100) * 1 || 0;
// The perpendicular bisector as a locus: on each vertical line, the point that is as far from A as from B.
function bisectorLine(T, A, B) {
  const yAt = (x) => T.bisect((y) => (x - A[0]) ** 2 + (y - A[1]) ** 2 - (x - B[0]) ** 2 - (y - B[1]) ** 2, -1e5, 1e5, 200);
  const c = yAt(0);
  return { m: yAt(1) - c, c };
}
const distTo = (sites, X) => sites.map((s) => Math.hypot(s[0] - X[0], s[1] - X[1]));
const nearest = (sites, X) => { const d = distTo(sites, X); return d.indexOf(Math.min(...d)); };
const gap = (sites, X) => { const d = distTo(sites, X).sort((a, b) => a - b); return d[1] - d[0]; };
// Every drawn edge is made of points equidistant from their two nearest sites, and every boundary between cells is drawn.
function voronoiChecks(q, T, sites) {
  const [x0, x1] = q.graph.x, [y0, y1] = q.graph.y;
  T.require(new Set(sites.map((s) => s[1])).size === sites.length, "no two sites share a y-coordinate");
  const segs = q.graph.functions.map((f) => f.fn.points);
  for (const [p, r] of segs) for (const w of [0.02, 0.3, 0.5, 0.77, 0.98]) {
    const X = [p[0] + w * (r[0] - p[0]), p[1] + w * (r[1] - p[1])];
    T.require(gap(sites, X) < 1e-6, "a drawn edge is equidistant from its two nearest sites");
    T.require(X[0] >= x0 - 1e-9 && X[0] <= x1 + 1e-9 && X[1] >= y0 - 1e-9 && X[1] <= y1 + 1e-9, "edges stay inside the window");
  }
  // walk along horizontal lines: wherever the nearest site changes, a drawn edge must pass through
  const onSeg = (X) => segs.some(([p, r]) => { const dx = r[0] - p[0], dy = r[1] - p[1], t = ((X[0] - p[0]) * dx + (X[1] - p[1]) * dy) / (dx * dx + dy * dy); return t > -0.01 && t < 1.01 && Math.hypot(p[0] + t * dx - X[0], p[1] + t * dy - X[1]) < 0.03; });
  for (let y = y0 + 0.37; y < y1; y += 0.9) for (let x = x0 + 0.01; x < x1 - 0.02; x += 0.01) {
    if (nearest(sites, [x, y]) !== nearest(sites, [x + 0.01, y])) T.require(onSeg([x + 0.005, y]), "every boundary between two cells is drawn");
  }
}
// The point of the window equidistant from three sites, by repeated grid search on the spread of the distances.
function equidistant(sites, W, H) {
  let cx = W / 2, cy = H / 2, half = Math.max(W, H) / 2;
  const spread = (X) => { const d = distTo(sites, X); return Math.max(...d) - Math.min(...d); };
  for (let round = 0; round < 40; round++) {
    let best = [cx, cy], bv = spread(best);
    for (let i = -10; i <= 10; i++) for (let j = -10; j <= 10; j++) { const X = [cx + half * i / 10, cy + half * j / 10], v = spread(X); if (v < bv) { bv = v; best = X; } }
    [cx, cy] = best; half *= 0.6;
  }
  return [cx, cy];
}
// Does the point satisfy an equation written as "3x - 2y = 7"?
function lineHolds(tex, V) {
  const [left, right] = tex.replace(/\s+/g, "").split("=");
  const co = (v) => { const mt = new RegExp("([+-]?\\d*)" + v).exec(left); if (!mt) return 0; return mt[1] === "" || mt[1] === "+" ? 1 : mt[1] === "-" ? -1 : Number(mt[1]); };
  return Math.abs(co("x") * V[0] + co("y") * V[1] - Number(right)) < 1e-6;
}

export default {
  // ---------------- 1.6 ----------------
  "t1-ai-approx-bounds/bounds-of-measurement/words": (q, T) => {
    const { v, acc } = q.params, hits = [];
    for (let k = -400; k < 400; k++) { const x = v + (k + 0.5) * acc / 400; if (Math.round(x / acc) === Math.round(v / acc)) hits.push(x); }
    return { a: T.approx(Math.min(...hits), acc / 300), b: T.approx(Math.max(...hits), acc / 300) };
  },
  "t1-ai-percentage-error/error-of-estimate/words": (q, T) => {
    const { a, b } = q.params, exact = T.integrate(() => b, 0, a, 10), est = Math.round(a) * Math.round(b);
    const pe = T.bisect((e) => exact * e / 100 - Math.abs(est - exact), 0, 100);
    T.require(pe > 0.3, "the estimate is not the exact value");
    return { a: ap(T, exact), b: est, c: ap(T, pe, 1e-5) };
  },
  "t1-ai-approx-bounds/bounds-of-volume/words": (q, T) => {
    const { r, h } = q.params, vol = (a, b) => T.integrate((x) => 2 * Math.PI * x * b, 0, a, 100);   // cylindrical shells
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i <= 20; i++) for (let j = 0; j <= 20; j++) { const v = vol(r - 0.05 + i * 0.005, h - 0.05 + j * 0.005); lo = Math.min(lo, v); hi = Math.max(hi, v); }
    const nom = vol(r, h);
    return { a: ap(T, r + 0.05), b: ap(T, lo), c: ap(T, hi), d: ap(T, (nom - lo) / lo * 100, 1e-5) };
  },
  "t1-ai-percentage-error/whole-items/words": (q, T) => {
    const { a, b, cover, extra, price } = q.params, need = a * b * (100 + extra) / 100;
    let n = 0; while (n * cover < need) n++;
    T.require(n * cover - need > 1e-6 && need - (n - 1) * cover > 1e-6, "not on a rounding boundary");
    return { a: n, b: cents(T, n * price) };
  },
  // ---------------- 1.7 ----------------
  "t1-ai-amortization/payment-and-interest/words": (q, T) => {
    const { pv, rate, n } = q.params, pay = levelPayment(T, pv, rate, n), shown = round2(pay);
    T.require(Math.abs(run(pv, rate, pay, n)) < 1e-4, "the payment clears the loan");
    T.require(Math.abs(pay * 100 - Math.round(pay * 100)) < 0.49, "payment not on a rounding boundary");
    return { a: cents(T, pay), b: cents(T, shown * n), c: cents(T, shown * n - pv) };
  },
  "t1-ai-amortization/compare-two-terms/words": (q, T) => {
    const { pv, rate, n, n2 } = q.params, p1 = levelPayment(T, pv, rate, n), p2 = levelPayment(T, pv, rate, n2);
    T.require(n2 < n && n2 >= 12, "the second loan is shorter");
    T.require(Math.abs(p2 * 100 - Math.round(p2 * 100)) < 0.49 && Math.abs(p1 * 100 - Math.round(p1 * 100)) < 0.49, "payments not on a rounding boundary");
    return { a: cents(T, p1), b: cents(T, p2), c: cents(T, round2(p1) * n - round2(p2) * n2) };
  },
  "t1-ai-amortization/balance-and-payments-left/words": (q, T) => {
    const { pv, rate, pay, k } = q.params, bal = run(pv, rate, pay, k), all = paymentsToClear(pv, rate, pay);
    T.require(pay > pv * rate / 1200, "the payment is more than the first month's interest");
    T.require(k < all.n - 3, "the loan is not repaid before the balance asked for");
    T.require(all.last < -1 && run(pv, rate, pay, all.n - 1) > 1, "the last payment is clearly a part payment");
    return { a: cents(T, bal), b: cents(T, k * pay - (pv - round2(bal))), c: all.n };
  },
  "t1-ai-amortization/total-repaid/words": (q, T) => {
    const { pv, n, pay } = q.params; let tot = 0; for (let j = 0; j < n; j++) tot += pay;
    T.require(tot > pv, "interest is positive");
    return { a: ap(T, tot), b: ap(T, tot - pv) };
  },
  "t1-ai-annuity/savings-future-value/words": (q, T) => {
    const { dep, rate, n } = q.params, fv = -run(0, rate, dep, n);
    return { a: n, b: cents(T, fv), c: cents(T, round2(fv) - dep * n) };
  },
  "t1-ai-annuity/withdrawals/words": (q, T) => {
    const { pv, rate, w, k, y2 } = q.params;
    let b = pv, full = 0; while (b * (1 + rate / 1200) >= w) { b = b * (1 + rate / 1200) - w; full++; }
    T.require(b > 1 && w - b * (1 + rate / 1200) > 1, "the number of full withdrawals is clear-cut");
    T.require(12 * y2 > full, "the longer period is longer");
    return { a: cents(T, run(pv, rate, w, 12 * k)), b: full, c: cents(T, levelPayment(T, pv, rate, 12 * y2)) };
  },
  // ---------------- 1.8 ----------------
  "t1-ai-linear-systems/solve-two-by-two/equation": (q, T) => {
    const s = solve(q.params.A, q.params.rhs);
    T.require(s !== null, "a unique solution");
    return { a: ap(T, s[0]), b: ap(T, s[1]) };
  },
  "t1-ai-linear-systems/three-prices/table": (q, T) => {
    const { A, tot, order } = q.params, s = solve(A, tot);
    T.require(s !== null && s.every((x) => x > 0), "a unique solution with positive prices");
    return { a: ap(T, s[0]), b: ap(T, s[1]), c: ap(T, T.sum(order, (n, i) => n * s[i])) };
  },
  "t1-ai-linear-systems/tickets-three-unknowns/words": (q, T) => {
    const { T: total, R, k, pa, pc, ps } = q.params, s = solve([[1, 1, 1], [pa, pc, ps], [0, 1, -k]], [total, R, 0]);
    T.require(s !== null && s.every((x) => x > 0 && Math.abs(x - Math.round(x)) < 1e-6), "whole numbers of tickets");
    // the right equation is the one the solution satisfies (and that is not about money)
    const a = mcValue(T, q, "a", (v) => v[0] === 0 && v.length === 3 && Math.abs(v[1] * s[1] + v[2] * s[2]) < 1e-6 && Math.abs(v[1]) === 1);
    return { a, b: ap(T, s[0]), c: ap(T, s[1]), d: ap(T, s[0] * pa / R * 100) };
  },
  "t1-ai-polynomial-equations/real-roots/equation": (q, T) => {
    const f = (x) => T.poly(q.params.cs, x), r = T.roots(f, -70, 70, 28000);
    T.require(r.length === 1 || (r.length === 3 && r[1] - r[0] > 0.3 && r[2] - r[1] > 0.3), "one real root, or three well separated ones");
    // a turning point close to the axis would make the count unreadable on a GDC
    for (const t of T.roots((x) => T.deriv(f, x), -70, 70, 28000)) T.require(Math.abs(f(t)) > 0.5, "no turning point near the axis");
    return r.length === 1 ? { a: 1, b: ap(T, r[0], 1e-5) } : { a: 3, b: ap(T, r[0], 1e-5), c: ap(T, r[2], 1e-5) };
  },
  "t1-ai-polynomial-equations/box-volume-roots/words": (q, T) => {
    const { a, b, K, x0 } = q.params, V = (x) => x * (b - 2 * x) * (a - 2 * x), r = T.roots((x) => V(x) - K, -5, b + 5, 20000);
    T.require(r.length === 3, "three solutions");
    const ok = r.filter((x) => x > 0 && 2 * x < a);
    T.require(ok.length === 2 && r[2] > a / 2, "exactly two solutions give a box");
    return { a: V(x0), b: ap(T, ok[0], 1e-5), c: ap(T, ok[1], 1e-5), d: T.option(2 * r[2] > a ? "too-wide" : r[2] < 0 ? "negative" : "other-volume") };
  },
  // ---------------- 2.5 ----------------
  "fn-ai-exponential-model/values-and-asymptote/equation": (q, T) => {
    const { a, b, c, t0 } = q.params, f = (t) => a * Math.exp(-t * Math.log(b)) + c;
    return { a: ap(T, f(0)), b: ap(T, f(t0)), c: T.approx(f(5000), 1e-6) };
  },
  "fn-ai-exponential-model/time-to-reach-level/equation": (q, T) => {
    const { a, b, c, t0, level } = q.params, f = (t) => a * Math.exp(-t * Math.log(b)) + c, r = T.roots((t) => f(t) - level, 0, 400, 40000);
    T.require(r.length === 1 && r[0] > 0.5, "the level is reached once, after the start");
    T.require((level - c) * (f(0) - level) > 0, "the level is between the start value and the asymptote");
    return { a: ap(T, f(0)), b: ap(T, f(t0)), c: ap(T, r[0], 1e-5), d: T.approx(f(5000), 1e-6), e: T.option("approaches") };
  },
  "fn-ai-sinusoidal-model/amplitude-period-values/equation": (q, T) => {
    const { a, b, d, t0 } = q.params, h = (t) => a * Math.sin(T.rad(b * t)) + d, ts = T.range(0, 720, 0.25), vals = ts.map(h);
    const mx = Math.max(...vals), mn = Math.min(...vals);
    // the period: the smallest shift that leaves the function unchanged
    let period = null;
    for (let p = 0.5; p <= 400 && period === null; p += 0.5) if ([0.3, 1.7, 4.1, 9.6].every((t) => Math.abs(h(t + p) - h(t)) < 1e-9)) period = p;
    return { a: ap(T, (mx - mn) / 2), b: period, c: ap(T, mx), d: ap(T, h(t0)) };
  },
  "fn-ai-sinusoidal-model/build-from-max-min-period/words": (q, T) => {
    const { mx, mn, period, t0, level } = q.params;
    const d = T.bisect((v) => (v - mn) - (mx - v), mn, mx), a = mx - d;
    // b: the smallest positive value for which a shift of one period is a whole turn
    const b = T.roots((v) => Math.sin(T.rad(v * period / 2)), 0.5, 400, 40000)[0];
    const h = (t) => a * Math.sin(T.rad(b * t)) + d, r = T.roots((t) => h(t) - level, 0, period, 20000);
    T.require(level > d && level < mx, "the level is between the principal axis and the maximum");
    return { a: ap(T, a), b: ap(T, d), c: ap(T, b, 1e-5), d: ap(T, h(t0), 1e-5), e: ap(T, r[0], 1e-5) };
  },
  "fn-ai-variation-model/constant-and-values/words": (q, T) => {
    const { n, x1, y1, x2, y3 } = q.params, k = T.bisect((v) => v * x1 ** n - y1, 0, 1e9, 300), f = (x) => k * x ** n;
    const x3 = T.roots((x) => f(x) - y3, 0.01, 1000, 100000);
    T.require(x3.length === 1, "one positive solution");
    return { a: ap(T, k, 1e-5), b: ap(T, f(x2), 1e-5), c: ap(T, x3[0], 1e-5) };
  },
  "fn-ai-quadratic-model/height-of-a-ball/equation": (q, T) => {
    const { u, h0 } = q.params, h = (t) => -4.9 * t * t + u * t + h0, top = T.extremum(h, 0, 20, "max", 4000), r = T.roots(h, 0.001, 30, 30000);
    T.require(r.length === 1, "the ball lands once");
    return { a: h(0), b: ap(T, top.value, 1e-5), c: ap(T, r[0], 1e-5) };
  },
  "fn-ai-piecewise-linear/cost-from-tariff/equation": (q, T) => {
    const { d, F, r, x1, x2, K } = q.params;
    // the cost as the fixed charge plus the extra charged along the way (midpoint sum of the rate)
    const C = (x) => { let s = F; const n = Math.round(x * 200); for (let i = 0; i < n; i++) if ((i + 0.5) / 200 > d) s += r / 200; return s; };
    const out = { a: T.approx(C(x1), 0.002), b: T.approx(C(x2), 0.002) };
    if (K !== undefined) { T.require(K > F, "the cost is above the fixed charge"); out.c = T.approx(T.bisect((x) => C(x) - K, d, d + 60, 60), 0.01); }
    return out;
  },
  // ---------------- 2.6 ----------------
  "fn-ai-fit-model/exponential-from-two-values/words": (q, T) => {
    const { P0, t1, P1, t2 } = q.params, a = T.bisect((v) => P0 * v ** t1 - P1, 0.2, 3);
    T.require(P1 !== P0, "the quantity changes");
    return { a: P0, b: ap(T, a, 1e-5), c: ap(T, P0 * Math.exp(t2 * Math.log(a)), 1e-5) };
  },
  "fn-ai-fit-model/quadratic-through-three-points/table": (q, T) => {
    const { xs, ys, x3 } = q.params, s = solve(xs.map((x) => [x * x, x, 1]), ys);
    T.require(s !== null && s[0] < 0, "a unique parabola that opens downwards");
    const h = (x) => s[0] * x * x + s[1] * x + s[2], land = T.roots(h, 0.001, 400, 80000);
    T.require(land.length === 1 && land[0] > xs[2], "the path lands after the last measurement");
    const [, x1] = xs;
    return { a: ap(T, s[2]), b: T.optionWhere(q, "b", (v) => Math.abs(v[0] * s[0] + v[1] * s[1] + v[2] * s[2] - ys[1]) < 1e-9 && v[0] === x1 * x1), c: ap(T, s[0]), d: ap(T, s[1]), e: ap(T, h(x3)), f: ap(T, land[0], 1e-5) };
  },
  "fn-ai-choose-model/family-from-table/table": (q, T) => {
    const ys = q.params.ys, diff = (a) => a.slice(1).map((v, i) => v - a[i]), same = (a) => a.every((v) => Math.abs(v - a[0]) < 1e-9);
    const d1 = diff(ys), d2 = diff(d1), ratios = ys.slice(1).map((v, i) => v / ys[i]);
    const kind = same(d1) ? "linear" : same(d2) ? "quadratic" : same(ratios) ? "exponential" : null;
    T.require(kind !== null && [same(d1), same(d2) && !same(d1), same(ratios)].filter(Boolean).length === 1, "exactly one family fits");
    // continue the table two more steps
    const tab = ys.slice();
    for (let i = 0; i < 2; i++) { const n = tab.length; tab.push(kind === "linear" ? tab[n - 1] + d1[0] : kind === "quadratic" ? 2 * tab[n - 1] - tab[n - 2] + d2[0] : tab[n - 1] * ratios[0]); }
    return { a: T.option(kind), b: ap(T, tab[6]) };
  },
  "fn-ai-test-model/linear-model-test-and-predict/words": (q, T) => {
    const { t1, h1, t2, h2, t3, t4, actual, far } = q.params, s = solve([[t1, 1], [t2, 1]], [h1, h2]), H = (t) => s[0] * t + s[1];
    T.require(t3 > t1 && t3 < t2 && t4 > t2, "one prediction inside the data, the test point outside");
    T.require(far > 3 * t2, "the last prediction is far outside the data");
    return { a: ap(T, s[0]), b: ap(T, s[1]), c: ap(T, H(t3)), d: ap(T, T.bisect((e) => actual * e / 100 - Math.abs(H(t4) - actual), 0, 100), 1e-5), e: T.option(far > t2 || far < t1 ? "extrapolation" : "reliable-fit") };
  },
  "fn-ai-choose-model/is-the-prediction-reliable/words": (q, T) => {
    const { lo, hi, x } = q.params;
    return { a: T.option(x >= lo && x <= hi ? "in-reliable" : "out-unreliable") };
  },
  // ---------------- 2.3 and 2.4 ----------------
  "fn-ai-graph-reading/values-and-solutions/graph": (q, T) => {
    const g = q.graph.functions[0], f = (x) => T.evalGraph(g.fn, x), { x0, k } = q.params;
    const r = T.roots((x) => f(x) - k, g.domain[0] - 0.001, g.domain[1] + 0.001, 12000);
    T.require(r.length === 2, "two solutions on the drawn part of the curve");
    T.require([x0, r[0], r[1]].every((x) => Math.abs(x - Math.round(x)) < 1e-6 && Math.abs(f(Math.round(x)) - Math.round(f(Math.round(x)))) < 1e-9), "the points to read are grid points");
    T.require(f(x0) > q.graph.y[0] && f(x0) < q.graph.y[1] && k > q.graph.y[0] && k < q.graph.y[1], "the values are inside the window");
    return { a: ap(T, f(x0)), b: ap(T, r[0]), c: ap(T, r[1]) };
  },
  "fn-ai-graph-reading/family-of-a-graph/graph": (q, T) => {
    const fn = q.graph.functions[0].fn, ys = T.range(-5, 5, 0.5).map((x) => T.evalGraph(fn, x));
    const diff = (a) => a.slice(1).map((v, i) => v - a[i]), zero = (a) => a.every((v) => Math.abs(v) < 1e-9);
    const d1 = diff(ys), d2 = diff(d1), d3 = diff(d2), d4 = diff(d3);
    const turns = d1.slice(1).filter((v, i) => v * d1[i] < 0).length;
    const kind = zero(d2) ? "linear" : zero(d3) ? "quadratic" : zero(d4) ? "cubic" : turns >= 2 ? "sinusoidal" : "exponential";
    // enough of the curve is inside the window to see its shape
    T.require(T.range(-5, 5, 0.25).filter((x) => Math.abs(T.evalGraph(fn, x)) < 6).length >= 8, "the curve is visible");
    return { a: T.option(kind) };
  },
  "fn-ai-gdc-sketch/sketch-and-describe-cubic/graph": (q, T) => {
    const { a, c, k, lvl } = q.params, f = (x) => a * x ** 3 - c * x + k;
    const pick = T.optionWhere(q, "a", (v, i, opt) => [-4, -2.5, -1, 0, 0.7, 2, 3.5].every((x) => Math.abs(T.evalGraph(opt.functions[0].fn, x) - f(x)) < 1e-9));
    const st = T.roots((x) => T.deriv(f, x), -5, 5, 10000);
    T.require(st.length === 2 && T.deriv2(f, st[0]) < 0, "a local maximum, then a local minimum");
    T.require(Math.abs(f(st[0])) < 7.5 && Math.abs(f(st[1])) < 7.5, "the turning points are inside the window");
    T.require(Math.abs(f(st[0]) - lvl) > 0.5 && Math.abs(f(st[1]) - lvl) > 0.5, "the level is not close to a turning value");
    return { a: pick, b: f(0), c: ap(T, st[0], 1e-5), d: T.roots((x) => f(x) - lvl, -40, 40, 80000).length };
  },
  "fn-ai-gdc-key-features/intercept-and-asymptote/equation": (q, T) => {
    const { a, b, c } = q.params, f = (x) => a * b ** x + c;
    return { a: f(0), b: T.approx(f(b > 1 ? -400 : 400), 1e-6) };
  },
  "fn-ai-gdc-key-features/cubic-turning-point-and-zero/equation": (q, T) => {
    const f = (x) => T.poly(q.params.cs, x), st = T.roots((x) => T.deriv(f, x), -40, 40, 80000), zs = T.roots(f, -60, 60, 120000);
    T.require(st.length === 2 && zs.length === 3, "two turning points and three zeros");
    const mx = st.find((x) => T.deriv2(f, x) < 0);
    return { a: f(0), b: ap(T, mx, 1e-5), c: ap(T, f(mx), 1e-5), d: ap(T, zs[2], 1e-5) };
  },
  "fn-ai-gdc-intersection/exponential-meets-line/equation": (q, T) => {
    const { a, b, mm, c } = q.params, f = (x) => a * b ** x, g = (x) => mm * x + c, r = T.roots((x) => f(x) - g(x), -40, 40, 160000);
    T.require(r.length === 2 && r[1] - r[0] > 1, "two well separated intersections");
    const mid = (r[0] + r[1]) / 2;
    return { a: ap(T, r[0], 1e-5), b: ap(T, r[1], 1e-5), c: ap(T, f(r[1]), 1e-5), d: T.option(f(mid) < g(mid) ? "between" : "outside") };
  },
  "fn-ai-gdc-intersection/time-above-a-level/words": (q, T) => {
    const { a, d, L } = q.params, h = (t) => a * Math.sin(T.rad(30 * t)) + d, r = T.roots((t) => h(t) - L, 0, 12, 24000);
    T.require(r.length === 2 && h((r[0] + r[1]) / 2) > L, "above the level between two crossings");
    return { a: ap(T, r[0], 1e-5), b: ap(T, r[1], 1e-5), c: ap(T, r[1] - r[0], 1e-5) };
  },
  // ---------------- 3.4 ----------------
  "t3-ai-sector-degrees/arc-length/diagram": (q, T) => ({ a: ap(T, arcByChords(q.params.r, q.params.th), 1e-6) }),
  "t3-ai-sector-degrees/area-and-perimeter/diagram": (q, T) => {
    const { r, th } = q.params;
    T.require(th > 0 && th < 360, "an angle less than a full turn");
    return { a: ap(T, sectorByRings(T, r, th), 1e-6), b: ap(T, arcByChords(r, th) + 2 * r, 1e-6) };
  },
  "t3-ai-sector-degrees/exact-arc-area-perimeter/diagram": (q, T) => {
    const { r, th } = q.params, arc = arcByChords(r, th);
    return { a: ap(T, arc, 1e-6), b: ap(T, sectorByRings(T, r, th), 1e-6), c: ap(T, arc + 2 * r, 1e-6) };
  },
  "t3-ai-sector-degrees/segment-area-and-perimeter/diagram": (q, T) => {
    const { r, th } = q.params, A = [r, 0], B = [r * Math.cos(T.rad(th)), r * Math.sin(T.rad(th))];
    const tri = Math.abs(A[0] * B[1] - A[1] * B[0]) / 2, sec = sectorByRings(T, r, th), chord = Math.hypot(A[0] - B[0], A[1] - B[1]);
    T.require(th < 180, "a minor segment");
    return { a: ap(T, sec, 1e-6), b: ap(T, tri), c: ap(T, sec - tri, 1e-5), d: ap(T, arcByChords(r, th) + chord, 1e-6) };
  },
  "t3-ai-sector-degrees/area-swept-by-a-wiper/words": (q, T) => {
    const { R, r, th } = q.params;
    T.require(r > 0 && r < R, "an inner radius smaller than the outer one");
    return { a: ap(T, T.integrate((x) => x * T.rad(th), r, R, 200), 1e-6), b: ap(T, arcByChords(R, th), 1e-6) };
  },
  "t3-ai-sector-degrees/angle-from-arc-length/words": (q, T) => {
    const { r, l } = q.params, th = T.bisect((t) => arcByChords(r, t, 4000) - l, 1, 359, 60);
    T.require(th > 10 && th < 180, "a sensible angle");
    return { a: ap(T, th, 1e-5), b: ap(T, sectorByRings(T, r, th), 1e-5) };
  },
  // ---------------- 3.5 ----------------
  "t3-ai-perpendicular-bisector/bisector-by-inspection/words": (q, T) => {
    const { A, B } = q.params, dist = (p, s) => Math.hypot(p[0] - s[0], p[1] - s[1]);
    // the right line is the one whose points are all the same distance from A and B
    return { a: T.optionWhere(q, "a", ([v, k]) => [-7.3, 0.4, 5.9].every((t) => { const p = v === "x" ? [k, t] : [t, k]; return Math.abs(dist(p, A) - dist(p, B)) < 1e-9; })) };
  },
  "t3-ai-perpendicular-bisector/gradient-and-intercept/words": (q, T) => {
    const { A, B } = q.params, bis = bisectorLine(T, A, B);
    return { a: ap(T, slopeBySearch(T, A, B)), b: ap(T, bis.m), c: ap(T, bis.c) };
  },
  "t3-ai-perpendicular-bisector/bisector-and-nearer-point/words": (q, T) => {
    const { A, B, C } = q.params, bis = bisectorLine(T, A, B), dA = Math.hypot(C[0] - A[0], C[1] - A[1]), dB = Math.hypot(C[0] - B[0], C[1] - B[1]);
    const mid = [0.5, 0.5].map((w, i) => w * A[i] + (1 - w) * B[i]);
    T.require(Math.abs(bis.m * mid[0] + bis.c - mid[1]) < 1e-6, "the bisector passes through the midpoint");
    return { a: ap(T, mid[0]), b: ap(T, mid[1]), c: ap(T, bis.m), d: ap(T, bis.c), e: T.option(Math.abs(dA - dB) < 1e-9 ? "same" : dA < dB ? "A" : "B") };
  },
  "t3-ai-perpendicular-bisector/from-line-and-midpoint/equation": (q, T) => {
    const { p, q: qq, a, b } = q.params, m = p / qq;
    // two points of the line either side of M, then the locus of points equidistant from them
    const bis = bisectorLine(T, [a - 2, b - 2 * m], [a + 2, b + 2 * m]);
    return { a: ap(T, bis.m), b: ap(T, bis.c) };
  },
  // ---------------- 3.6 ----------------
  "t3-ai-voronoi/nearest-site/graph": (q, T) => {
    const { sites, X } = q.params, i = nearest(sites, X);
    voronoiChecks(q, T, sites);
    T.require(gap(sites, X) > 0.4, "the point is clearly inside one cell");
    return { a: T.option(i) };
  },
  "t3-ai-voronoi/nearest-neighbour-interpolation/graph": (q, T) => {
    const { sites, X, vals } = q.params, i = nearest(sites, X);
    voronoiChecks(q, T, sites);
    T.require(gap(sites, X) > 0.4 && new Set(vals).size === 4, "the point is clearly inside one cell, and the values differ");
    return { a: T.option(i), b: vals[i], c: ap(T, Math.hypot(sites[i][0] - X[0], sites[i][1] - X[1])) };
  },
  "t3-ai-voronoi/vertex-equidistant-from-three-sites/graph": (q, T) => {
    const { sites } = q.params, V = equidistant(sites, 12, 9);
    voronoiChecks(q, T, sites);
    const ds = sites.map((s) => Math.hypot(s[0] - V[0], s[1] - V[1]));
    T.require(Math.max(...ds) - Math.min(...ds) < 1e-7, "a point equidistant from the three sites exists in the window");
    // V is inside the triangle: it is on the same side of each side as the opposite corner
    const side = (a, b, p) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
    T.require([0, 1, 2].every((i) => side(sites[i], sites[(i + 1) % 3], V) * side(sites[i], sites[(i + 1) % 3], sites[(i + 2) % 3]) > 0), "V is inside the triangle of the sites");
    // the equations quoted in the stem are satisfied by that point
    const eqs = [...q.stem.matchAll(/equation \$([^$]*)\$/g)].map((mt) => mt[1]);
    T.require(eqs.length === 2 && eqs.every((e) => lineHolds(e, V)), "V lies on both quoted edges");
    return { a: ap(T, V[0], 1e-6), b: ap(T, V[1], 1e-6), c: ap(T, ds[0], 1e-6), d: T.option("vertex") };
  },
  "t3-ai-voronoi/compare-two-vertices/graph": (q, T) => {
    const { sites, verts } = q.params, near = verts.map((v) => Math.min(...sites.map((s) => Math.hypot(s[0] - v[0], s[1] - v[1]))));
    voronoiChecks(q, T, sites);
    // each is a vertex: three sites at the same (smallest) distance
    for (const [i, v] of verts.entries()) T.require(sites.filter((s) => Math.abs(Math.hypot(s[0] - v[0], s[1] - v[1]) - near[i]) < 1e-9).length === 3, "three sites are equally near the vertex");
    T.require(Math.abs(near[0] - near[1]) > 0.1, "the two distances differ clearly");
    const best = near[0] > near[1] ? 0 : 1;
    return { a: ap(T, near[0]), b: ap(T, near[1]), c: T.option([best, "far"]) };
  },
};
