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
// A two-state transition matrix (columns: from) built from the switching percentages of the situation
const markov2 = (s) => [[1 - s.p / 10, s.q / 10], [s.p / 10, 1 - s.q / 10]];
// Probability of being in state `to` after `steps` steps from state `from`, by adding up every path
function paths(M, from, to, steps) {
  if (steps === 0) return from === to ? 1 : 0;
  let p = 0;
  for (let mid = 0; mid < M.length; mid++) p += M[mid][from] * paths(M, mid, to, steps - 1);
  return p;
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
    "t4-ai-confidence-interval/z-interval/words": (q, T) => { const s = q.params.sit, h = (T.invNorm(0.5 + s.level / 200) * s.sd) / Math.sqrt(s.n); return { a: s.xbar - h, b: s.xbar + h }; },
  "t4-ai-confidence-interval/t-interval-summary/words": (q, T) => { const s = q.params.sit, h = (tInv(0.5 + s.level / 200, s.n - 1, T) * s.s) / Math.sqrt(s.n); return { a: s.xbar - h, b: s.xbar + h }; },
  "t4-ai-confidence-interval/choose-distribution/words": (q, T) => {
    T.require(/is not known/.test(q.stem) !== q.params.known, "the stem says whether the standard deviation is known");
    return { a: T.optionWhere(q, "a", (v, i, text) => (q.params.known ? /normal/.test(text) : text.includes(`$${q.params.n - 1}$ degrees`))) };
  },
  "t4-ai-confidence-interval/t-interval/table": (q, T) => {
    const { data, level, claim } = q.params, n = data.length, mu = mean(data), s = Math.sqrt(sum(data.map((x) => (x - mu) ** 2)) / (n - 1)), h = (tInv(0.5 + level / 200, n - 1, T) * s) / Math.sqrt(n);
    // the interval covers the stated share of the t-distribution
    T.require(Math.abs(tCdf(h / (s / Math.sqrt(n)), n - 1, T) - tCdf(-h / (s / Math.sqrt(n)), n - 1, T) - level / 100) < 1e-7, "the interval has the stated confidence level");
    T.require(Math.min(Math.abs(claim - mu + h), Math.abs(claim - mu - h)) > 0.1 * h, "the claim is clearly inside or outside");
    return { a: mu, b: mu - h, c: mu + h, d: T.option(claim > mu - h && claim < mu + h ? "inside" : "outside") };
  },
  "t4-ai-confidence-interval/sample-size/words": (q, T) => {
    const s = q.params.sit, z = T.invNorm(0.5 + s.level / 200), h = (z * s.sd) / Math.sqrt(s.n);
    let n = 2;
    while ((2 * z * s.sd) / Math.sqrt(n) >= q.params.w) n++;
    T.require(n > s.n, "more data is needed than the first sample had");
    return { a: s.xbar - h, b: s.xbar + h, c: n };
  },
  "t4-ai-poisson/mean-variance/words": (q) => {
    const s = q.params.sit, one = poisList(s.lam, 120), many = poisList(s.lam * s.t, 250), mu = sum(one.map((p, k) => k * p));
    return { a: sum(one.map((p, k) => (k - mu) ** 2 * p)), b: sum(many.map((p, k) => k * p)) };
  },
  "t4-ai-poisson/probability/words": (q) => { const s = q.params.sit; return { a: poisList(s.lam, s.k)[s.k], b: 1 - poisCdf(s.lam, s.k2 - 1) }; },
  "t4-ai-poisson/rescale-and-sum/words": (q, T) => {
    const s = q.params.sit, { j, M } = q.params, p1 = poisList(s.lam, j), p2 = poisList(s.lam2, j);
    // the t-period count as a sum of t independent one-period counts (convolution), and the two sources likewise
    let conv = [1];
    for (let i = 0; i < s.t; i++) { const one = poisList(s.lam, s.m), next = Array(s.m + 1).fill(0); conv.forEach((a, x) => one.forEach((b, y) => { if (x + y <= s.m) next[x + y] += a * b; })); conv = next; }
    let both = 0;
    for (let x = 0; x <= j; x++) for (let y = 0; x + y <= j; y++) both += p1[x] * p2[y];
    const busy = 1 - poisCdf(s.lam, M);
    T.require(busy > 0.02 && busy < 0.98, "a busy period is neither certain nor impossible");
    return { a: poisList(s.lam, s.k)[s.k], b: 1 - sum(conv), c: both, d: T.nCr(s.n, s.r) * busy ** s.r * (1 - busy) ** (s.n - s.r) };
  },
  "t4-ai-poisson/find-parameter/words": (q, T) => {
    const { p0, k } = q.params, lam = T.bisect((l) => Math.exp(-l) - p0, 0, 20);
    return { a: lam, b: 1 - poisCdf(lam, k), c: 1 - poisList(lam / 2, 0)[0] };
  },
  "t4-ai-poisson-model/choose-model/words": (q, T) => { const k = ["poisson", "binomial", "normal", "poisson", "binomial", "normal", "poisson", "binomial"][q.params.id]; return { a: T.option(k), b: T.option(k) }; },
  "t4-ai-test-mean/z-test/words": (q, T) => {
    const { mu0, sd, n, less, alpha, xbar } = q.params, below = normBelow(xbar, mu0, sd / Math.sqrt(n), T), p = less ? below : 1 - below;
    T.require(Math.abs(p - alpha) > 0.2 * alpha, "the p-value is not on the boundary");
    return { a: T.approx(p, 1e-7), b: T.option(decide(p, alpha)) };
  },
  "t4-ai-test-mean/t-test/table": (q, T) => {
    const { data, mu0, less, alpha } = q.params, n = data.length, mu = mean(data), s2 = sum(data.map((x) => (x - mu) ** 2)) / (n - 1), below = tCdf((mu - mu0) / Math.sqrt(s2 / n), n - 1, T), p = less ? below : 1 - below;
    T.require(Math.abs(p - alpha) > 0.2 * alpha, "the p-value is not on the boundary");
    return { a: mu, b: T.option(less ? "less" : "greater"), c: T.approx(p, 1e-7), d: T.option(decide(p, alpha)) };
  },
  "t4-ai-test-mean/paired-test/table": (q, T) => {
    const { before, after, up, alpha } = q.params, d = after.map((a, i) => a - before[i]), n = d.length, mu = mean(after) - mean(before), s2 = sum(d.map((x) => (x - mu) ** 2)) / (n - 1);
    const below = tCdf(mu / Math.sqrt(s2 / n), n - 1, T), p = up ? 1 - below : below;
    T.require(Math.abs(p - alpha) > 0.2 * alpha, "the p-value is not on the boundary");
    return { a: mu, b: T.approx(p, 1e-7), c: T.option(decide(p, alpha)), d: T.option("normal-d") };
  },
  "t4-ai-test-proportion/p-value/words": (q, T) => {
    const { n, p0, up, x, alpha } = q.params;
    let p = 0;
    for (let k = 0; k <= n; k++) if (up ? k >= x : k <= x) p += T.binomPmf(n, p0, k);
    T.require(Math.abs(p - alpha) > 0.2 * alpha, "the p-value is not on the boundary");
    return { a: T.approx(p, 1e-7), b: T.option(decide(p, alpha)) };
  },
  "t4-ai-test-correlation/rho-test/table": (q, T) => {
    const { xs, ys, pos, alpha } = q.params, n = xs.length;
    // r as the mean product of standard scores
    const z = (v) => { const mu = mean(v), sd = Math.sqrt(mean(v.map((x) => (x - mu) ** 2))); return v.map((x) => (x - mu) / sd); };
    const zx = z(xs), zy = z(ys), r = mean(zx.map((v, i) => v * zy[i])), below = tCdf(r * Math.sqrt((n - 2) / (1 - r * r)), n - 2, T), p = pos ? 1 - below : below;
    T.require(Math.abs(p - alpha) > 0.2 * alpha, "the p-value is not on the boundary");
    return { a: r, b: T.approx(p, 1e-7), c: T.option(decide(p, alpha)) };
  },
  "t4-ai-critical-region/binomial/words": (q, T) => {
    const { n, p0, up, alpha, p1 } = q.params, pmf = (p) => Array.from({ length: n + 1 }, (_, k) => T.binomPmf(n, p, k)), f0 = pmf(p0), f1 = pmf(p1);
    const inRegion = (c) => (k) => (up ? k >= c : k <= c), prob = (f, test) => sum(f.filter((_, k) => test(k)));
    // the largest region whose probability under H0 is below the significance level
    const cs = Array.from({ length: n + 1 }, (_, k) => k).filter((c) => prob(f0, inRegion(c)) < alpha), c = up ? Math.min(...cs) : Math.max(...cs);
    T.require(cs.length > 0, "a critical region exists");
    return { a: c, b: prob(f0, inRegion(c)), c: 1 - prob(f1, inRegion(c)) };
  },
  "t4-ai-critical-region/poisson/words": (q, T) => {
    const { r0, d, up, alpha, r1 } = q.params, f0 = poisList(r0 * d, 150), f1 = poisList(r1 * d, 150);
    const inRegion = (c) => (k) => (up ? k >= c : k <= c), prob = (f, test) => sum(f.filter((_, k) => test(k)));
    const cs = Array.from({ length: 100 }, (_, k) => k).filter((c) => prob(f0, inRegion(c)) < alpha), c = up ? Math.min(...cs) : Math.max(...cs);
    T.require(cs.length > 0, "a critical region exists");
    return { a: c, b: prob(f0, inRegion(c)), c: 1 - prob(f1, inRegion(c)) };
  },
  "t4-ai-critical-region/normal/words": (q, T) => {
    const { mu0, sd, n, up, alpha, mu1 } = q.params, se = sd / Math.sqrt(n), c = up ? mu0 + T.invNorm(1 - alpha) * se : mu0 + T.invNorm(alpha) * se;
    const below = normBelow(c, mu1, se, T);
    T.require(up ? mu1 > mu0 : mu1 < mu0, "the true mean lies on the side of the alternative hypothesis");
    return { a: c, b: alpha, c: T.approx(up ? below : 1 - below, 1e-7) };
  },
  "t4-ai-type-errors/identify/words": (q, T) => ({ a: T.optionWhere(q, "a", (v, i, text) => /^Concluding/.test(text) && v === "I"), b: T.optionWhere(q, "b", (v, i, text) => /^Not rejecting/.test(text) && v === "II") }),
  "t4-ai-markov/matrix-entry/words": (q) => { const s = q.params.sit, T2 = markov2(s); return { a: T2[0][0], b: T2[0][1] }; },
  "t4-ai-markov/n-step/words": (q) => { const T2 = markov2(q.params.sit); return { a: paths(T2, 0, 0, 2), b: paths(T2, 0, 0, 3) }; },
  "t4-ai-markov/steady-state-exact/words": (q) => {
    const T2 = markov2(q.params.sit);
    let v = [1, 0];
    for (let i = 0; i < 3000; i++) v = [T2[0][0] * v[0] + T2[0][1] * v[1], T2[1][0] * v[0] + T2[1][1] * v[1]];
    return { a: paths(T2, 0, 0, 2), b: v[0] };
  },
  "t4-ai-markov/three-state/equation": (q, T) => {
    const { T: M, init, n } = q.params, total = sum(init);
    for (let j = 0; j < 3; j++) T.require(Math.abs(M[0][j] + M[1][j] + M[2][j] - 1) < 1e-12 && M.every((row) => row[j] > 0), "each column is a set of positive probabilities adding to one");
    const after = (to, steps) => sum(init.map((x, from) => x * paths(M, from, to, steps)));
    // steady state: (T - I)s = 0 with the entries adding to one
    const st = solve([[M[0][0] - 1, M[0][1], M[0][2]], [M[1][0], M[1][1] - 1, M[1][2]], [1, 1, 1]], [0, 0, 1]);
    return { a: after(0, 1), b: after(1, n), c: st[2] * total };
  },

  /*NEXTV*/
};
