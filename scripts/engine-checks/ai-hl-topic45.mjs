// Independent answer verifiers for the AI HL Topic 4 and Topic 5 generators (ai-hl-topic45.js), keyed by generator id.
// Distributions are recomputed by numerical integration of the density (normal, t, chi-squared) or by direct
// summation (Poisson, binomial); variances of combinations by enumerating two-point variables; regression by
// elimination on centred data; Euler tables by re-running the recurrence; differential equations by
// Runge-Kutta integration or numerical substitution; eigenvalues from the trace and determinant.

const sum = (xs) => xs.reduce((s, x) => s + x, 0);
const mean = (xs) => sum(xs) / xs.length;
// Gamma at integers and half-integers by the recurrence from Gamma(1) = 1 and Gamma(1/2) = sqrt(pi)
const gammaHalf = (twice) => { let g = twice % 2 ? Math.sqrt(Math.PI) : 1; for (let x = twice % 2 ? 0.5 : 1; x < twice / 2 - 1e-9; x += 1) g *= x; return g; };
const tPdf = (t, v) => (gammaHalf(v + 1) / (Math.sqrt(v * Math.PI) * gammaHalf(v))) * Math.pow(1 + (t * t) / v, -(v + 1) / 2);
const tCdf = (t, v, T) => 0.5 + T.integrate((u) => tPdf(u, v), 0, t, 2000);
const tInv = (p, v, T) => T.bisect((t) => tCdf(t, v, T) - p, -60, 60, 60);
const chiPdf = (x, k) => (Math.pow(x, k / 2 - 1) * Math.exp(-x / 2)) / (Math.pow(2, k / 2) * gammaHalf(k));
const chiSf = (x, k, T) => T.integrate((u) => chiPdf(u, k), x, x + 150, 20000);
const normBelow = (x, mu, sd, T) => T.normalCdf((x - mu) / sd);
// Poisson probabilities by the recurrence p(k) = p(k - 1) * lambda / k
const poisList = (lam, upTo) => { const out = [Math.exp(-lam)]; for (let k = 1; k <= upTo; k++) out.push((out[k - 1] * lam) / k); return out; };
const poisCdf = (lam, k) => (k < 0 ? 0 : sum(poisList(lam, k)));
const binCdf = (n, p, k, T) => { let s = 0; for (let i = 0; i <= k; i++) s += T.binomPmf(n, p, i); return s; };
// Mean and variance of a sum of independent variables, each replaced by a two-point variable mu +/- sd
function twoPoint(parts) { // parts: [[coefficient, mu, sd], ...]
  const n = parts.length, totals = [];
  for (let mask = 0; mask < 1 << n; mask++) totals.push(sum(parts.map(([c, mu, sd], i) => c * (mu + ((mask >> i) & 1 ? sd : -sd)))));
  const mu = mean(totals);
  return { mean: mu, variance: mean(totals.map((t) => (t - mu) * (t - mu))) };
}
const decide = (p, alpha) => (p < alpha ? "reject" : "keep");
function rk4(f, t0, y0, t1, n = 4000) { // y is an array
  const h = (t1 - t0) / n;
  let t = t0, y = y0.slice();
  const add = (a, b, k) => a.map((v, i) => v + k * b[i]);
  for (let i = 0; i < n; i++) {
    const k1 = f(t, y), k2 = f(t + h / 2, add(y, k1, h / 2)), k3 = f(t + h / 2, add(y, k2, h / 2)), k4 = f(t + h, add(y, k3, h));
    y = y.map((v, j) => v + (h / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
    t += h;
  }
  return y;
}

const RV_KIND = ["test-retest", "parallel", "content", "criterion", "test-retest", "criterion", "content", "parallel"];
const SURVEY_FLAW = ["leading", "double", "vague", "overlap", "negative"];
function chi(q, T) {
  const s = q.params.sit, o = s.obs.slice(), e = s.exp.slice();
  T.require(Math.abs(sum(o) - s.n) < 1e-9 && Math.abs(sum(e) - s.n) < 0.011, "frequencies add up to the sample size");
  // merge from whichever end is too small until none is
  for (;;) {
    if (e[e.length - 1] <= 5) { e.splice(-2, 2, e[e.length - 2] + e[e.length - 1]); o.splice(-2, 2, o[o.length - 2] + o[o.length - 1]); }
    else if (e[0] <= 5) { e.splice(0, 2, e[0] + e[1]); o.splice(0, 2, o[0] + o[1]); }
    else break;
  }
  T.require(e.every((v) => v > 5.2), "every combined expected frequency is clearly above 5");
  T.require(e.length < s.exp.length, "some categories had to be combined");
  const df = e.length - 1 - (s.est ? 1 : 0), stat = sum(e.map((v, i) => ((o[i] - v) ** 2) / v));
  T.require(df >= 1, "at least one degree of freedom");
  return { cats: e.length, df, stat, p: chiSf(stat, df, T) };
}
function ss(q) {
  const s = q.params.sit, y = s.ys.map((v) => v / 10);
  const quad = (x) => (s.q[0] * x * x + s.q[1] * x + s.q[2]) / 10, line = (x) => (s.l[0] * x + s.l[1]) / 10;
  const of = (f) => sum(s.xs.map((x, i) => (y[i] - f(x)) ** 2));
  return { s, quad, line, ssQ: of(quad), ssL: of(line) };
}
function solve(A, b) { // Gaussian elimination with pivoting
  const n = b.length, M = A.map((r, i) => r.concat(b[i]));
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  return M.map((r, i) => r[n] / r[i]);
}

export default {
  "t4-ai-reliability-validity/identify/words": (q, T) => {
    const k = RV_KIND[q.params.id];
    return { a: T.option(k === "content" || k === "criterion" ? "validity" : "reliability"), b: T.option(k) };
  },
  "t4-ai-survey-design/flawed-question/words": (q, T) => ({ a: T.option(SURVEY_FLAW[q.params.id]), b: T.option("good") }),
  "t4-ai-chi-grouping/degrees-of-freedom/table": (q, T) => { const c = chi(q, T); return { a: c.cats, b: c.df }; },
  "t4-ai-chi-grouping/test-statistic/table": (q, T) => {
    const c = chi(q, T);
    T.require(Math.abs(c.p - 0.05) > 0.008, "the p-value is not on the boundary");
    return { a: c.df, b: c.stat, c: T.approx(c.p, 1e-5), d: T.option(decide(c.p, 0.05)) };
  },
  "t4-ai-regression-residuals/ss-res/table": (q) => { const r = ss(q); return { a: r.quad(r.s.xs[r.s.k]), b: r.ssQ }; },
  "t4-ai-regression-residuals/compare-models/table": (q, T) => {
    const r = ss(q), first = r.s.quadFirst;
    T.require(r.ssQ < r.ssL, "the quadratic model is the better one");
    return { a: first ? r.ssQ : r.ssL, b: first ? r.ssL : r.ssQ, c: T.option(first ? "A" : "B"), d: r.quad(r.s.xp) };
  },
  "t4-ai-regression-fit/quadratic-fit/table": (q, T) => {
    const { xs, ys, xp } = q.params, mx = mean(xs), u = xs.map((x) => x - mx);
    // fit y = A u^2 + B u + C on centred x by elimination, then expand
    const S = (p, f = () => 1) => sum(u.map((v, i) => v ** p * f(i)));
    const [A, B, C] = solve([[S(4), S(3), S(2)], [S(3), S(2), S(1)], [S(2), S(1), u.length]], [S(2, (i) => ys[i]), S(1, (i) => ys[i]), S(0, (i) => ys[i])]);
    const a = A, b = B - 2 * A * mx, c = C - B * mx + A * mx * mx;
    const res = (a2, b2, c2) => sum(xs.map((x, i) => (ys[i] - (a2 * x * x + b2 * x + c2)) ** 2)), best = res(a, b, c);
    for (const d of [-0.01, 0.01]) T.require(res(a + d, b, c) > best && res(a, b + d, c) > best && res(a, b, c + d) > best, "the fitted curve minimises the sum of square residuals");
    const my = mean(ys);
    return { a, b, c: 1 - best / sum(ys.map((y) => (y - my) ** 2)), d: a * xp * xp + b * xp + c };
  },
  "t4-ai-regression-fit/r-squared-meaning/words": (q) => ({ a: q.params.R, b: q.params.r * q.params.r }),
  "t4-ai-linear-combination/transformation/equation": (q) => { const { mu, v, a, b } = q.params, ys = [mu - Math.sqrt(v), mu + Math.sqrt(v)].map((x) => a * x + b); return { a: mean(ys), b: ((ys[1] - ys[0]) / 2) ** 2 }; },
  "t4-ai-linear-combination/total/words": (q) => {
    const s = q.params.sit, t = twoPoint(Array(s.n).fill([1, s.m1, s.s1]).concat(Array(s.k).fill([1, s.m2, s.s2])));
    return { a: t.mean, b: Math.sqrt(t.variance) };
  },
  "t4-ai-linear-combination/find-constants/equation": (q, T) => {
    const { mu, v, a, b, mw, vw, c1, c2 } = q.params;
    // search for the positive a and the b that give the stated mean and variance of Y
    const stated = /E\}\(Y\) = (-?\d+)\$ and \$\\mathrm\{Var\}\(Y\) = (\d+)/.exec(q.stem).slice(1).map(Number);
    const hits = [];
    for (let A = 1; A <= 12; A++) for (let B = -40; B <= 40; B++) { const t = twoPoint([[A, mu, Math.sqrt(v)]]); if (T.close(t.mean + B, stated[0]) && T.close(t.variance, stated[1])) hits.push([A, B]); }
    T.require(hits.length === 1 && hits[0][0] === a && hits[0][1] === b, "one pair of constants fits");
    return { a: hits[0][0], b: hits[0][1], c: twoPoint([[c1, mu, Math.sqrt(v)], [-c2, mw, Math.sqrt(vw)]]).variance };
  },
  "t4-ai-unbiased-estimates/from-summary/words": (q) => { const d = q.params.data, mu = mean(d); return { a: mu, b: sum(d.map((x) => (x - mu) ** 2)) / (d.length - 1) }; },
  "t4-ai-unbiased-estimates/from-data/table": (q) => {
    const d = q.params.data, y = d.map((x) => q.params.a * x + q.params.b), est = (xs) => { const mu = mean(xs); return [mu, sum(xs.map((x) => (x - mu) ** 2)) / (xs.length - 1)]; };
    return { a: est(d)[0], b: est(d)[1], c: est(y)[0], d: est(y)[1] };
  },
  "t4-ai-normal-combination/total-probability/words": (q, T) => {
    const s = q.params.sit, t = twoPoint(Array(s.n).fill([1, s.m1, s.s1]).concat(Array(s.k).fill([1, s.m2, s.s2]))), d = twoPoint([[1, s.m1, s.s1], [-1, s.m2, s.s2]]);
    return { a: t.mean, b: t.variance, c: T.approx(1 - normBelow(q.params.lim, t.mean, Math.sqrt(t.variance), T), 1e-6), d: T.approx(1 - normBelow(q.params.d, d.mean, Math.sqrt(d.variance), T), 1e-6) };
  },
  "t4-ai-sample-mean/standard-error/words": (q) => { const s = q.params.sit, k = Math.min(s.n, 10), t = twoPoint(Array(k).fill([1 / k, s.mu, s.sd])); return { a: t.mean, b: (t.variance * k) / s.n }; },
  "t4-ai-sample-mean/probability/words": (q, T) => {
    const s = q.params.sit, k = Math.min(s.n, 10), t = twoPoint(Array(k).fill([1 / k, s.mu, s.sd])), se = Math.sqrt((t.variance * k) / s.n);
    const below = normBelow(s.cut, s.mu, se, T);
    return { a: se, b: T.approx(s.below ? below : 1 - below, 1e-6) };
  },
  "t4-ai-sample-mean/central-limit-theorem/words": (q, T) => {
    const { mu, sd, n, lo, hi, tot } = q.params, se = sd / Math.sqrt(n);
    T.require(n > 30, "the sample is large enough for the central limit theorem");
    const between = T.integrate((x) => T.normalPdf((x - mu) / se) / se, lo, hi, 4000), sdT = sd * Math.sqrt(n);
    return { a: T.option("clt"), b: T.approx(between, 1e-6), c: T.approx(T.integrate((x) => T.normalPdf((x - n * mu) / sdT) / sdT, tot, n * mu + 12 * sdT, 20000), 1e-6) };
  },
};
