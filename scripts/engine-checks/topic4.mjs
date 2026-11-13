// Independent answer verifiers for the Topic 4 generators, keyed by generator id.
// Probabilities are checked by simulation or by counting over a whole population; normal
// probabilities by numerical integration of the density; statistics by sorting and counting.

// A population of `size` people split exactly according to probabilities, to turn probability rules into counts.
const binomCdfAtLeast1 = (n, p, T) => { let s = 0; for (let k = 1; k <= n; k++) s += T.binomPmf(n, p, k); return s; };
const normalBetween = (mu, sig, a, b, T) => T.integrate((x) => T.normalPdf((x - mu) / sig) / sig, a, b, 4000);

export default {
  "t4-sampling/better-method/words": (q, T) => {
    T.require(q.stem.includes(q.params.pop), "the population is named in the question");
    return { a: T.option("bias"), b: T.option("good") };
  },
  "t4-outlier-rule/outliers-in-data/equation": (q, T) => {
    const { data } = q.params, s = data.slice().sort((x, y) => x - y);
    T.require(JSON.stringify(s) === JSON.stringify(data) && data.length === 9, "nine values in order");
    const [q1, q3] = T.quartiles(s), fence = q3 + 1.5 * (q3 - q1);
    T.require(s.every((x) => Math.abs(x - fence) > 1e-9), "no value sits exactly on the boundary");
    return { a: T.median(s), b: q1, c: q3, d: q3 - q1, e: fence, f: s.filter((x) => x - q3 > 1.5 * (q3 - q1)).length };
  },
  "t4-summary-statistics/iqr-of-data/equation": (q, T) => {
    const { data } = q.params, [q1, q3] = T.quartiles(data);
    T.require(data.every((x, i) => i === 0 || data[i - 1] <= x), "the data are in order");
    return { a: T.mean(data), b: T.median(data), c: q3 - q1 };
  },
  "t4-regression-interpret/read-estimate/equation": (q, T) => {
    const { mm, c, x, actual, r } = q.params, line = (t) => mm * t + c;
    T.require(Math.abs(r) > 0.7 && Math.abs(r) < 1 && Math.sign(r) === Math.sign(mm), "r is strong and agrees with the gradient's sign");
    return { a: line(x), b: actual - line(x), c: T.option([1, Math.sign(r)]) };
  },
  "t4-expected-occurrences/expected-count/words": (q, T) => {
    const { n, p } = q.params;
    T.require(p > 0 && p < 1, "a probability between 0 and 1");
    // expected value of a binomial count, summed from the distribution
    let e = 0;
    for (let k = 0; k <= n; k++) e += k * Math.exp(lnBinom(n, k) + k * Math.log(p) + (n - k) * Math.log(1 - p));
    return { a: T.approx(e, 1e-6), b: T.approx(n - e, 1e-6) };
  },
  "t4-conditional-probability/reverse-from-tree/words": (q, T) => {
    const { pD, sens, fp } = q.params;
    T.require([pD, sens, fp].every((p) => p > 0 && p < 1), "probabilities between 0 and 1");
    // count in a population of ten million
    const N = 1e7, ill = N * pD, well = N - ill, posIll = ill * sens, posWell = well * fp;
    return { a: (posIll + posWell) / N, b: posIll / (posIll + posWell) };
  },
  "t4-independence/test-from-probabilities/equation": (q, T) => {
    const { pA, pB, pAB } = q.params;
    T.require(pAB > 0 && pAB < Math.min(pA, pB) && pA + pB - pAB < 1, "the probabilities fit a Venn diagram");
    // regions of the Venn diagram
    const onlyA = pA - pAB, onlyB = pB - pAB, indep = Math.abs(pAB - pA * pB) < 1e-9;
    T.require(indep || Math.abs(pAB - pA * pB) > 0.005, "independence is clear-cut");
    return { a: onlyA + onlyB + pAB, b: pAB / (onlyB + pAB), c: T.option([indep, true]) };
  },
  "t4-expected-value/expected-value/table": (q, T) => {
    const { xs, w } = q.params, total = T.sum(w), k = T.bisect((x) => total * x - 1, 0, 1);
    const probs = w.map((v) => v * k);
    T.require(Math.abs(T.sum(probs) - 1) < 1e-9 && probs.every((p) => p > 0 && p < 1), "the probabilities are valid and add up to 1");
    T.require(q.table.head.length === xs.length + 1 && q.table.rows[0].length === xs.length + 1, "the table has one column per value");
    // simulate draws from the distribution
    const rnd = T.random(xs.length * 1000 + total), N = 200000;
    let s = 0;
    for (let i = 0; i < N; i++) { let u = rnd(), j = 0; while (j < xs.length - 1 && u > probs[j]) { u -= probs[j]; j++; } s += xs[j]; }
    const exact = T.sum(xs, (x, i) => x * probs[i]);
    T.require(Math.abs(s / N - exact) < 0.03, "a simulation agrees with the expected value");
    return { a: k, b: exact };
  },
  "t4-discrete-distribution/missing-probability/equation": (q, T) => {
    const { p0, p1, p3 } = q.params, k = T.bisect((x) => p0 + p1 + x + p3 - 1, 0, 1);
    T.require(k > 0.01 && k < 1, "k is a valid probability");
    return { a: k, b: 0 * p0 + 1 * p1 + 2 * k + 3 * p3 };
  },
  "t4-binomial/exact-probability/words": (q, T) => {
    const { n, p, k } = q.params;
    T.require(k >= 1 && k <= n, "k is a possible count");
    return { a: T.binomPmf(n, p, k), b: binomCdfAtLeast1(n, p, T), c: T.sum(T.range(0, n), (j) => j * T.binomPmf(n, p, j)) };
  },
  "t4-binomial/binomial-then-normal/words": (q, T) => {
    const { n, p, k, mu, sigma, x } = q.params;
    return { a: T.option("ok"), b: T.binomPmf(n, p, k), c: T.approx(normalBetween(mu, sigma, x, mu + 12 * sigma, T), 1e-7) };
  },
  "t4-normal-probability/prob-between/words": (q, T) => {
    const { mu, sig, a, b } = q.params;
    T.require(a < mu && mu < b, "the interval contains the mean");
    return { a: T.approx(normalBetween(mu, sig, mu - 12 * sig, b, T), 1e-7), b: T.approx(normalBetween(mu, sig, a, b, T), 1e-7) };
  },
  "t4-normal-unknown-parameter/unknown-sd/words": (q, T) => {
    const { mu, a, pg } = q.params;
    T.require(a > mu && pg < 0.5, "a value above the mean has less than half the distribution above it");
    // sigma such that the upper tail beyond a is pg
    const sigma = T.bisect((s) => normalBetween(mu, s, a, a + 40 * s, T) - pg, 0.5, 400, 60);
    return { a: T.approx(T.invNorm(1 - pg), 1e-5), b: T.approx(sigma, 1e-4) };
  },
};

// ln of n choose k, by adding logs
function lnBinom(n, k) {
  let s = 0;
  for (let i = 1; i <= k; i++) s += Math.log(n - k + i) - Math.log(i);
  return s;
}
