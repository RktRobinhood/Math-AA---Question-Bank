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
};
