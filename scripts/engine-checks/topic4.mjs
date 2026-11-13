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
  // ---------------- second batch ----------------
  "t4-sampling/quota-number/table": (q, T) => {
    const { sizes, n, i1, i2, want } = q.params, N = T.sum(sizes);
    T.require(sizes.every((s, i) => cell(q.table.rows[0][i + 1]) === s), "the table shows the group sizes");
    // the sampling fraction that makes the group numbers add up to the sample size
    const f = T.bisect((x) => T.sum(sizes, (s) => s * x) - n, 0, 1);
    T.require(sizes.every((s) => Math.abs(s * f - Math.round(s * f)) < 1e-7), "every group gives a whole number in the sample");
    return { a: f * sizes[i1], b: T.option("proportion"), c: T.bisect((t) => (t * sizes[i2]) / N - want, 0, N) };
  },
  "t4-sampling/name-technique/words": (q, T) => {
    const s = q.stem, key = /every (twentieth|fifteenth)/.test(s) ? "systematic" : /in proportion/.test(s) ? "stratified" : /random number generator|without looking/.test(s) ? "simple"
      : /set number|fixed number/.test(s) ? "quota" : /at her table|first few people/.test(s) ? "convenience" : null;
    T.require(key !== null, "the description fits exactly one technique");
    return { a: T.option(key) };
  },
  "t4-sampling/systematic-member/words": (q, T) => {
    const { N, n, s, j } = q.params;
    let k = 1;
    while (k * n < N) k++;
    T.require(k * n === N, "the list divides into equal intervals");
    const chosen = [];
    for (let x = s; x <= N; x += k) chosen.push(x);
    T.require(chosen.length === n && s <= k, "the sample has the stated size");
    return { a: k, b: chosen[j - 1], c: chosen[n - 1] };
  },
  "t4-cumulative-frequency/median-from-graph/graph": (q, T) => {
    const g = cfRead(q, T), s = q.params.sit;
    return { a: g.inv(g.n / 2), b: g.at(s.xs[s.ic]) };
  },
  "t4-cumulative-frequency/iqr-from-graph/graph": (q, T) => {
    const g = cfRead(q, T), s = q.params.sit;
    return { a: g.inv(g.n / 2), b: g.inv((3 * g.n) / 4) - g.inv(g.n / 4), c: g.n - g.at(s.xs[s.ib]) };
  },
  "t4-cumulative-frequency/cutoff-top/graph": (q, T) => {
    const g = cfRead(q, T), s = q.params.sit, k = Number(/\$(\d+)\$/.exec(q.parts[2].prompt)[1]);
    T.require(s.ia < s.ib && k > 0 && k < g.n / 2, "the interval is not empty and the top group is less than half");
    return { a: g.inv(g.n / 4), b: g.at(s.xs[s.ib]) - g.at(s.xs[s.ia]), c: g.inv(g.n - k) };
  },
  "t4-box-plot/read-median/graph": (q, T) => { const f = boxRead(q.graph, T); return { a: f[2], b: f[3] }; },
  "t4-box-plot/read-median-iqr/graph": (q, T) => { const f = boxRead(q.graph, T); return { a: f[2], b: f[3] - f[1], c: f[4] - f[0] }; },
  "t4-box-plot/pick-box-from-data/terms": (q, T) => {
    const d = q.params.data, [q1, q3] = T.quartiles(d), five = [Math.min(...d), q1, T.median(d), q3, Math.max(...d)];
    T.require(d.length === 11 && d.every((x, i) => i === 0 || d[i - 1] < x), "eleven different values in order");
    return { a: q1, b: q3, c: T.optionWhere(q, "c", (v, i, opt) => JSON.stringify(boxRead(opt, T)) === JSON.stringify(five)) };
  },
  "t4-outlier-rule/find-fences/words": (q, T) => {
    const { q1, q3, v } = q.params, iqr = q3 - q1;
    // scan half-unit steps for the last value that is not an outlier on each side
    let up = q3, low = q1;
    while ((up + 0.5 - q3) / iqr <= 1.5) up += 0.5;
    while ((q1 - (low - 0.5)) / iqr <= 1.5) low -= 0.5;
    T.require(Math.abs(v - up) >= 1, "the tested value is clear of the boundary");
    return { a: iqr, b: up, c: low, d: T.option([(v - q3) / iqr > 1.5, "fence"]) };
  },
  "t4-grouped-data/estimate-mean/table": (q, T) => {
    const { x0, w, f } = q.params, list = [];
    f.forEach((n, i) => { for (let j = 0; j < n; j++) list.push(x0 + i * w + w / 2); });
    const top = Math.max(...f), ends = [...q.parts[1].prompt.matchAll(/(\d+(?:\.\d+)?)/g)].map((mt) => Number(mt[1]));
    T.require(f.filter((n) => n === top).length === 1, "one modal class");
    T.require(f.every((n, i) => cell(q.table.rows[0][i + 1]) === n), "the table shows the frequencies");
    return { a: T.option(f.indexOf(top)), b: (ends[0] + ends[1]) / 2, c: T.mean(list) };
  },
  "t4-grouped-data/sd-from-table/table": (q, T) => {
    const { xs, f } = q.params, list = [];
    f.forEach((n, i) => { for (let j = 0; j < n; j++) list.push(xs[i]); });
    const mean = T.mean(list), v = T.mean(list.map((x) => (x - mean) ** 2));
    return { a: mean, b: Math.sqrt(v), c: v, d: T.median(list) };
  },
  "t4-summary-statistics/mode-of-data/terms": (q, T) => {
    const d = q.params.data, count = (x) => d.filter((y) => y === x).length, best = Math.max(...d.map(count)), modes = [...new Set(d.filter((x) => count(x) === best))];
    T.require(modes.length === 1 && best >= 2, "a single mode that occurs at least twice");
    return { a: modes[0], b: Math.max(...d) - Math.min(...d) };
  },
  "t4-summary-statistics/combined-mean/words": (q, T) => {
    const { n1, m1, m2, n2, m3 } = q.params, g1 = Array(n1).fill(m1), g2 = Array(n2).fill(m3);
    const added = T.bisect((v) => T.mean(g1.concat([v])) - m2, -1000, 1000);
    T.require(added > 0, "the added value is positive");
    return { a: T.sum(g1), b: added, c: T.mean(g1.concat(g2)) };
  },
  "t4-constant-changes/add-mean-sd/words": (q, T) => {
    const { mean, sd, a, b } = q.params, y = [mean - sd, mean + sd].map((x) => a * x + b);
    return { a: T.mean(y), b: spread(y, T) };
  },
  "t4-constant-changes/linear-centre-spread/words": (q, T) => {
    const { mean, sd, a, b } = q.params, y = [mean - sd, mean + sd].map((x) => a * x + b);
    T.require(a > 0 && T.mean(y) > 0, "a positive multiplier and a positive new mean");
    return { a: T.mean(y), b: spread(y, T), c: spread(y, T) ** 2 };
  },
  "t4-constant-changes/find-a-and-b/words": (q, T) => {
    const { mean, sd, a, b, M, S } = q.params, x = [mean - sd, mean + sd], y = x.map((t) => a * t + b);
    const c = T.bisect((k) => spread(x.map((t) => k * t), T) - S, 0.001, 1000), d = T.bisect((k) => T.mean(x.map((t) => c * t + k)) - M, -1e5, 1e5);
    return { a: T.mean(y), b: spread(y, T) ** 2, c, d };
  },
  "t4-regression-gdc/regression-line/table": (q, T) => {
    const [xs, ys] = tableData(q), L = fit(xs, ys, T);
    T.require(Math.abs(L.r) >= 0.8 && Math.abs(L.r) <= 0.99, "a strong correlation that is not perfect");
    return { a: L.a, b: L.b, c: L.r, d: T.option([1, Math.sign(L.r)]) };
  },
  "t4-regression-gdc/predict-from-data/table": (q, T) => {
    const [xs, ys] = tableData(q), L = fit(xs, ys, T), s = q.params.sit;
    T.require(s.xq > Math.min(...xs) && s.xq < Math.max(...xs), "the estimate is made inside the data");
    T.require(s.xfar > Math.max(...xs) + (Math.max(...xs) - Math.min(...xs)), "the second value is far outside the data");
    return { a: L.r, b: L.a, c: L.b, d: L.a * s.xq + L.b, e: T.option("extrapolation") };
  },
  "t4-regression-gdc/mean-point/table": (q, T) => { const [xs, ys] = tableData(q); return { a: T.mean(xs), b: T.mean(ys) }; },
  "t4-regression-gdc/c-from-mean-point/table": (q, T) => {
    const [xs, ys] = tableData(q), L = fit(xs, ys, T), xq = q.params.sit.xq;
    T.require(Math.abs(L.r) >= 0.8 - 1e-9 && xq > xs[0] && xq < xs[4], "a strong correlation and an estimate inside the data");
    T.require(q.stem.includes(`$y = ${Math.abs(Math.abs(L.a) - 1) < 1e-9 ? (L.a < 0 ? "-" : "") : String(Number(L.a.toFixed(6)))}x + c$`), "the gradient quoted is the regression gradient of the data");
    return { a: T.mean(xs), b: T.mean(ys), c: T.approx(L.b, 1e-6), d: T.approx(L.a * xq + L.b, 1e-6) };
  },
  "t4-regression-interpret/interpret-gradient/words": (q, T) => {
    const { a, b, x, k } = q.params, line = (t) => a * t + b;
    return { a: T.option("gradient"), b: Math.abs(line(x + k) - line(x)), c: line(x) };
  },
  "t4-regression-x-on-y/x-on-y-line/table": (q, T) => {
    const [xs, ys] = tableData(q), L = fit(ys, xs, T), s = q.params.sit;
    T.require(s.yq > Math.min(...ys) && s.yq < Math.max(...ys), "the estimate is made inside the data");
    return { a: L.a, b: L.b, c: L.a * s.yq + L.b };
  },
  "t4-regression-x-on-y/predict-x-from-data/table": (q, T) => {
    const [xs, ys] = tableData(q), L = fit(ys, xs, T), other = fit(xs, ys, T), s = q.params.sit;
    T.require(L.a * other.a > 0 && L.a * other.a < 1, "the two regression lines differ");
    T.require(s.yfar > Math.max(...ys), "the second value is outside the data");
    return { a: T.option("x-on-y"), b: L.a, c: L.b, d: L.a * s.yq + L.b, e: T.option("extrapolation") };
  },
  "t4-regression-x-on-y/predict-x-from-lines/equation": (q, T) => {
    const s = q.params.sit;
    // the x at which the line of x on y, read as y in terms of x, gives y0
    return { a: T.option("x-on-y"), b: T.bisect((x) => (x - s.d) / s.c - s.y0, -1e4, 1e4) };
  },
  "t4-regression-x-on-y/mean-point-from-lines/equation": (q, T) => {
    const s = q.params.sit;
    T.require(s.a * s.c > 0 && s.a * s.c < 1, "the two lines differ and slope the same way");
    const xb = T.bisect((x) => s.c * (s.a * x + s.b) + s.d - x, -1e4, 1e4);
    return { a: xb, b: s.a * xb + s.b, c: T.option("x-on-y"), d: T.bisect((x) => (x - s.d) / s.c - s.y0, -1e4, 1e4) };
  },
  "t4-probability-basic/two-way-whole/table": (q, T) => {
    const { v, hide, M } = q.params, pop = people(v), N = pop.length, row = q.table.rows[hide < 2 ? 0 : 1];
    const shown = cell(row[hide % 2 === 0 ? 2 : 1]), cnt = (f) => pop.filter(f).length;
    T.require(v.every((x) => x >= 3), "every cell has people in it");
    return { a: cell(row[3]) - shown, b: cnt((p) => p.A) / N, c: cnt((p) => p.A && p.B) / N, d: cnt((p) => p.A || p.B) / N, e: (M * cnt((p) => p.A)) / N };
  },
  "t4-probability-basic/bag-counter/words": (q, T) => {
    const bag = [];
    q.params.n.forEach((k, i) => { for (let j = 0; j < k; j++) bag.push(i); });
    return { a: bag.filter((c) => c === 0).length / bag.length, b: bag.filter((c) => c !== 0).length / bag.length };
  },
  "t4-probability-basic/rf-from-table/table": (q, T) => {
    const { f, M } = q.params, spins = [];
    f.forEach((k, i) => { for (let j = 0; j < k; j++) spins.push(i); });
    const share = (test) => spins.filter(test).length / spins.length;
    return { a: share((c) => c === 0), b: share((c) => c < 2), c: M * share((c) => c !== 2) };
  },
  "t4-expected-occurrences/trials-for-count/words": (q, T) => {
    const { p, e } = q.params, hits = T.range(1, 3000).filter((n) => Math.abs(n * p - e) < 1e-9);
    T.require(hits.length === 1 && p >= 0.05 && p <= 0.6, "one whole number of trials gives the expected number");
    return { a: hits[0], b: hits[0] - e };
  },
  "t4-venn-addition-rule/union-from-rule/equation": (q, T) => {
    const { pA, pB, pAB } = q.params.sit, onlyA = pA - pAB, onlyB = pB - pAB, none = 1 - onlyA - onlyB - pAB;
    T.require([onlyA, onlyB, pAB, none].every((x) => x > 0.01) && pA + pB < 1, "the four regions are positive");
    return { a: onlyA + onlyB + pAB, b: none, c: onlyA + onlyB };
  },
  "t4-venn-addition-rule/intersection-from-rule/equation": (q, T) => {
    const { pA, pB, pU } = q.params.sit, both = T.bisect((x) => pA + pB - x - pU, 0, 1);
    T.require(both > 0.01 && both < Math.min(pA, pB), "the overlap fits inside both events");
    return { a: both, b: pA - both, c: pB - both };
  },
  "t4-venn-addition-rule/x-from-total/words": (q, T) => {
    const { N, a, b, none } = q.params, fits = T.range(0, Math.min(a, b)).filter((x) => a - x + (b - x) + x + none === N);
    T.require(fits.length === 1 && fits[0] > 0 && fits[0] < Math.min(a, b), "one overlap fits the totals, with all regions positive");
    const x = fits[0];
    return { a: x, b: a - x, c: (a - x + (b - x)) / N, d: x / b };
  },
  "t4-tree-diagram/same-or-different/words": (q, T) => {
    const { r, b } = q.params, bag = Array(r).fill("r").concat(Array(b).fill("b"));
    let n = 0, rr = 0, same = 0, some = 0;
    for (let i = 0; i < bag.length; i++) for (let j = 0; j < bag.length; j++) {
      if (i === j) continue;
      n++; if (bag[i] === "r" && bag[j] === "r") rr++; if (bag[i] === bag[j]) same++; if (bag[i] === "r" || bag[j] === "r") some++;
    }
    return { a: rr / n, b: same / n, c: some / n };
  },
  "t4-tree-diagram/path-probability/words": (q, T) => {
    const { p, a, b } = q.params, N = 1e6, first = N * p, hitA = first * a, hitB = (N - first) * b;
    T.require([p, a, b].every((x) => x > 0 && x < 1), "probabilities between 0 and 1");
    return { a: hitA / N, b: (hitA + hitB) / N };
  },
  "t4-sample-space/total-outcomes/table": (q, T) => {
    const cellsAll = q.table.rows.flatMap((r) => r.slice(1).map(cell));
    return { a: cellsAll.length, b: cellsAll.filter((x) => x === q.params.sit.s).length };
  },
  "t4-sample-space/p-score/table": (q, T) => {
    const cellsAll = q.table.rows.flatMap((r) => r.slice(1).map(cell)), { s, t } = q.params.sit;
    T.require(q.table.rows.length <= 8 && q.table.head.length <= 9, "the grid fits a phone");
    T.require(q.table.rows.every((r) => r.slice(1).every((c, j) => cell(c) === cell(r[0]) + cell(q.table.head[j + 1]))), "every cell is the sum of its row and column");
    return { a: cellsAll.filter((x) => x === s).length / cellsAll.length, b: cellsAll.filter((x) => x >= t).length / cellsAll.length };
  },
  "t4-discrete-distribution/event-probability/table": (q, T) => {
    const { xs, p, h, c, lo, hi } = q.params, rest = T.sum(p.filter((_, i) => i !== h)), k = T.bisect((x) => rest + x - 1, 0, 1);
    const full = p.map((v, i) => (i === h ? k : v)), prob = (test) => T.sum(full.filter((_, i) => test(xs[i])));
    T.require(full.every((v) => v >= 0.05 - 1e-9 && v <= 0.6), "every probability is from 0.05 to 0.6");
    T.require(hi < xs.length && !(lo === 0 && hi === xs.length - 1), "the event leaves out at least one value");
    return { a: k, b: prob((x) => x >= xs[c]), c: prob((x) => x >= xs[lo] && x <= xs[hi]) };
  },
  "t4-discrete-distribution/k-from-sum/equation": (q, T) => {
    const { w } = q.params, k = T.bisect((x) => T.sum(w) * x - 1, 0, 1);
    T.require(w.every((v) => v * k > 0 && v * k < 1), "every probability is valid");
    return { a: k };
  },
  "t4-expected-value/fair-stake/words": (q, T) => {
    const { prizes, p, cost } = q.params, plays = 100000;
    T.require(Math.abs(T.sum(p) - 1) < 1e-9 && p.every((v) => v >= 0.05 - 1e-9 && v <= 0.6 + 1e-9), "the probabilities are valid and add up to 1");
    // total prize money over a large number of plays split exactly by the probabilities
    const paid = T.sum(prizes, (x, i) => x * Math.round(plays * p[i])) / plays;
    T.require(cost > paid, "the game costs more than it pays on average");
    return { a: paid, b: cost - paid, c: paid };
  },
  "t4-expected-value/probabilities-from-mean/equation": (q, T) => {
    const { xs, g0, g3, ev } = q.params, hits = [];
    for (let i = 1; i < 100; i++) for (let j = 1; j < 100; j++) {
      const p = i / 100, r = j / 100;
      if (Math.abs(g0 + p + r + g3 - 1) < 1e-9 && Math.abs(xs[0] * g0 + xs[1] * p + xs[2] * r + xs[3] * g3 - ev) < 1e-9) hits.push([p, r]);
    }
    T.require(hits.length === 1 && hits[0][0] !== hits[0][1], "one pair of different probabilities fits");
    return { a: hits[0][0] + hits[0][1], b: hits[0][0], c: hits[0][1] };
  },
  "t4-binomial/at-most-probability/words": (q, T) => {
    const { n, p, k, k2 } = q.params, lo = bsum(n, p, 0, k, T), hi = bsum(n, p, k2, n, T);
    T.require(lo >= 0.005 && hi >= 0.005, "probabilities are not negligible");
    return { a: lo, b: hi };
  },
  "t4-binomial/mean-from-parameters/equation": (q, T) => {
    const { n, p } = q.params, mean = T.sum(T.range(0, n), (k) => k * T.binomPmf(n, p, k));
    return { a: mean, b: T.sum(T.range(0, n), (k) => (k - mean) ** 2 * T.binomPmf(n, p, k)) };
  },
  "t4-binomial/n-and-p-from-mean-variance/equation": (q, T) => {
    const { mean, v } = q.params, hits = [];
    for (let n = 1; n <= 200; n++) for (let i = 1; i < 200; i++) { const p = i / 200; if (Math.abs(n * p - mean) < 1e-9 && Math.abs(n * p * (1 - p) - v) < 1e-9) hits.push([n, p]); }
    T.require(hits.length === 1, "one binomial distribution has this mean and variance");
    const [n, p] = hits[0], m2 = T.sum(T.range(0, n), (k) => 2 * k * T.binomPmf(n, p, k));
    return { a: p, b: n, c: T.sum(T.range(0, n), (k) => (2 * k - m2) ** 2 * T.binomPmf(n, p, k)) };
  },
  "t4-binomial/least-trials/words": (q, T) => {
    const { p, t, n0 } = q.params;
    let n = 1;
    while (bsum(n, p, 1, n, T) <= t) n++;
    T.require(bsum(n, p, 1, n, T) - t > 1e-4 && t - bsum(n - 1, p, 1, n - 1, T) > 1e-4, "the least number of trials is clear-cut");
    return { a: bsum(n0, p, 1, n0, T), b: n, c: T.sum(T.range(0, n), (k) => k * T.binomPmf(n, p, k)) };
  },
  "t4-binomial/between-probability/words": (q, T) => {
    const { n, p, a, b, c } = q.params, mean = T.sum(T.range(0, n), (k) => k * T.binomPmf(n, p, k));
    T.require(a >= 1 && a < b && c <= n, "the ranges are possible");
    return { a: bsum(n, p, a, b, T), b: bsum(n, p, c, n, T), c: T.sum(T.range(0, n), (k) => (k - mean) ** 2 * T.binomPmf(n, p, k)) };
  },
  "t4-normal-properties/empirical-count/words": (q, T) => {
    const { mu, sig, N } = q.params;
    // the rule of thumb is checked against the integrated density, within the rule's own accuracy
    return { a: T.approx(100 * normalBetween(mu, sig, mu - sig, mu + sig, T), 0.5), b: T.approx(100 * normalBetween(mu, sig, mu + 2 * sig, mu + 12 * sig, T), 0.3), c: T.approx(N * normalBetween(mu, sig, mu - 12 * sig, mu - sig, T), 0.004 * N) };
  },
  "t4-normal-properties/mirror-tail/equation": (q, T) => {
    const { mu, a, t } = q.params, b = 2 * mu - a;
    T.require(a > mu && t > 0.5 && t < 1, "a value above the mean has more than half the distribution below it");
    const sig = T.bisect((s) => normalBetween(mu, s, mu - 12 * s, a, T) - t, 0.2, 2000, 80), P = (lo, hi) => T.approx(normalBetween(mu, sig, lo, hi, T), 1e-6);
    return { a: P(a, mu + 12 * sig), b: P(mu - 12 * sig, b), c: P(b, a), d: P(mu, a) };
  },
  "t4-normal-properties/match-curve/diagram": (q, T) => {
    const { mu, sig } = q.params;
    const stats = (g) => {
      // trapezium rule over the straight pieces that are drawn
      const pts = g.functions[0].fn.points, trap = (h, from = -Infinity) => { let s = 0; for (let i = 1; i < pts.length; i++) if ((pts[i - 1][0] + pts[i][0]) / 2 >= from) s += ((h(pts[i - 1]) + h(pts[i])) / 2) * (pts[i][0] - pts[i - 1][0]); return s; };
      const area = trap((p) => p[1]), mean = trap((p) => p[0] * p[1]) / area;
      return { area, mean, sd: Math.sqrt(trap((p) => (p[0] - mean) ** 2 * p[1]) / area), above: trap((p) => p[1], mu) / area };
    };
    const pick = T.optionWhere(q, "a", (v, i, opt) => { const s = stats(opt); return Math.abs(s.mean - mu) < 0.1 * sig && Math.abs(s.sd - sig) < 0.1 * sig; });
    const right = stats(q.parts[0].answer.options[pick.index]);
    T.require(right.area > 0.98 && right.area < 1.01, "the curve encloses an area of 1 inside the window");
    return { a: pick, b: T.approx(right.above, 0.005) };
  },
  "t4-normal-probability/prob-below/words": (q, T) => {
    const { mu, sig, a } = q.params;
    T.require(Math.abs(a - mu) >= 0.1 * sig, "the bound is clear of the mean");
    return { a: T.approx(normalBetween(mu, sig, mu - 12 * sig, a, T), 1e-7), b: T.approx(normalBetween(mu, sig, a, mu + 12 * sig, T), 1e-7) };
  },
  "t4-normal-probability/expected-number/words": (q, T) => {
    const { mu, sig, a, lo, hi, N } = q.params, mid = normalBetween(mu, sig, lo, hi, T);
    T.require(lo < mu && mu < hi, "the interval contains the mean");
    return { a: T.approx(normalBetween(mu, sig, a, mu + 12 * sig, T), 1e-7), b: T.approx(mid, 1e-7), c: T.approx(N * mid, 1e-4) };
  },
  "t4-inverse-normal/value-below/words": (q, T) => {
    const { mu, sig, p, topPc } = q.params;
    T.require(Math.abs(T.invNorm(p)) >= 0.3, "the value is at least 0.3 standard deviations from the mean");
    return { a: T.approx(mu + sig * T.invNorm(p), 1e-5 * mu), b: T.approx(T.bisect((k) => normalBetween(mu, sig, k, mu + 12 * sig, T) - topPc / 100, mu, mu + 8 * sig, 80), 1e-5 * mu) };
  },
  "t4-inverse-normal/central-bounds/words": (q, T) => {
    const { mu, sig, mid } = q.params, q1 = mu + sig * T.invNorm(0.25), q3 = mu + sig * T.invNorm(0.75);
    const d = T.bisect((x) => normalBetween(mu, sig, mu - x, mu + x, T) - mid / 100, 0, 10 * sig, 80);
    return { a: T.approx(q1, 1e-5 * mu), b: T.approx(q3 - q1, 1e-5 * mu), c: T.approx(d, 1e-5 * mu) };
  },
  "t4-conditional-probability/conditional-from-table/table": (q, T) => {
    const pop = people(q.params.v), B = pop.filter((p) => p.B), A = pop.filter((p) => p.A);
    T.require(B.length / pop.length >= 0.1 && A.length / pop.length >= 0.1, "the given event is not rare");
    return { a: B.filter((p) => p.A).length / B.length, b: A.filter((p) => p.B).length / A.length };
  },
  "t4-conditional-probability/conditional-from-probabilities/equation": (q, T) => {
    const { pA, pB, pAB } = q.params, N = 1e6, nA = N * pA, nB = N * pB, nAB = N * pAB;
    T.require(pAB < Math.min(pA, pB) && pA + pB - pAB < 1 && pB >= 0.1 && pA >= 0.1, "the probabilities fit a Venn diagram");
    return { a: nAB / nB, b: nAB / nA };
  },
  "t4-conditional-probability/intersection-from-conditional/equation": (q, T) => {
    const { pB, c1 } = q.params, N = 1e6, nB = N * pB;
    return { a: (nB * c1) / N };
  },
  "t4-conditional-probability/conditional-binomial/words": (q, T) => {
    const { n, p, k } = q.params, some = bsum(n, p, 1, n, T);
    T.require(some >= 0.1 && k >= 1 && k <= n, "the given event has a probability of at least 0.1");
    return { a: some, b: T.binomPmf(n, p, k), c: T.binomPmf(n, p, k) / some };
  },
  "t4-independence/both-from-probabilities/equation": (q, T) => {
    const { pA, pB } = q.params;
    // a 1000 by 1000 grid of equally likely outcomes: A is a band of rows, B a band of columns
    const rows = Math.round(1000 * pA), cols = Math.round(1000 * pB), both = rows * cols;
    return { a: both / 1e6, b: both / (cols * 1000) };
  },
  "t4-independence/unknown-from-union/equation": (q, T) => {
    const { a, u } = q.params, x = T.bisect((t) => a + t - a * t - u, 0, 1);
    T.require(x > 0.05 && x < 0.95 && Math.abs(x - a) > 1e-9, "a valid probability different from the one given");
    return { a: x, b: a * x, c: (a * x) / a, d: (1 - a) * (1 - x) };
  },
  "t4-independence/test-from-table/table": (q, T) => {
    const pop = people(q.params.v), N = pop.length, nA = pop.filter((p) => p.A).length, nB = pop.filter((p) => p.B).length, nAB = pop.filter((p) => p.A && p.B).length;
    const gap = Math.abs(nAB * N - nA * nB);   // whole-number test: independent exactly when this is zero
    T.require(gap === 0 || gap >= N, "independence is clear-cut");
    return { a: nA / N, b: nB / N, c: nAB / N, d: T.option([gap === 0, "product"]) };
  },
  "t4-normal-unknown-parameter/standardise-event/equation": (q, T) => {
    const { mu, sig, x1, z2 } = q.params;
    return { a: T.bisect((z) => mu + z * sig - x1, -20, 20), b: T.bisect((x) => (x - mu) / sig - z2, mu - 20 * sig, mu + 20 * sig) };
  },
  "t4-normal-unknown-parameter/z-from-area/equation": (q, T) => {
    const { p, q: tail } = q.params;
    return { a: T.approx(T.invNorm(p), 1e-6), b: T.approx(T.bisect((z) => T.integrate(T.normalPdf, z, 12, 6000) - tail, -9, 9, 80), 1e-6) };
  },
  "t4-normal-unknown-parameter/unknown-mean/words": (q, T) => {
    const { sig, a, p, below } = q.params;
    T.require(p < 0.5, "the tail is less than half the distribution");
    const tail = (mu) => (below ? normalBetween(mu, sig, mu - 12 * sig, a, T) : normalBetween(mu, sig, a, mu + 12 * sig, T));
    const mu = T.bisect((t) => tail(t) - p, a - 10 * sig, a + 10 * sig, 80);
    T.require(Math.abs(a - mu) >= 0.1 * sig, "the value is clear of the mean");
    return { a: T.approx(T.invNorm(below ? p : 1 - p), 1e-6), b: T.approx(mu, 1e-5 * Math.abs(mu)) };
  },
  "t4-normal-unknown-parameter/mean-and-sd/words": (q, T) => {
    const { a, b, p1, p2 } = q.params, z1 = T.invNorm(p1), z2 = T.invNorm(1 - p2);
    T.require(a < b && p1 + p2 < 1, "the two tails do not overlap");
    // for each sigma the lower tail fixes mu; find the sigma that also gives the upper tail
    const muOf = (s) => a - z1 * s;
    const sig = T.bisect((s) => { const mu = muOf(s); return normalBetween(mu, s, b, mu + 12 * s, T) - p2; }, (b - a) / 20, (b - a) * 20, 50);
    const mu = muOf(sig);
    T.require(Math.abs(normalBetween(mu, sig, mu - 12 * sig, a, T) - p1) < 1e-6, "the lower tail has the stated area");
    T.require(sig > 0 && mu > 0, "a positive mean and standard deviation");
    return { a: T.approx(z1, 1e-6), b: T.approx(z2, 1e-6), c: T.approx(sig, 1e-5 * sig), d: T.approx(mu, 1e-5 * Math.abs(mu)) };
  },
};

// a table cell or heading such as "$12\,500$" as a number
function cell(s) { return Number(String(s).replace(/[^0-9.\-]/g, "")); }
// the x and y lists of a two-row data table
function tableData(q) { return [q.table.head.slice(1).map(cell), q.table.rows[0].slice(1).map(cell)]; }
// population standard deviation, from the definition
function spread(xs, T) { const mean = T.mean(xs); return Math.sqrt(T.mean(xs.map((x) => (x - mean) ** 2))); }
// sum of binomial probabilities from k = lo to hi
function bsum(n, p, lo, hi, T) { let s = 0; for (let k = lo; k <= hi; k++) s += T.binomPmf(n, p, k); return s; }
// one person per count in a 2 by 2 table [A and B, A not B, B not A, neither]
function people(v) {
  const out = [];
  [[true, true], [true, false], [false, true], [false, false]].forEach(([A, B], i) => { for (let j = 0; j < v[i]; j++) out.push({ A, B }); });
  return out;
}
// Least-squares line ys = a xs + b without the textbook formulas: the best intercept for a gradient is
// the mean residual, and the best gradient is where the sum of squared residuals stops falling.
function fit(xs, ys, T) {
  const best = (a) => T.mean(ys.map((y, i) => y - a * xs[i]));
  const sse = (a) => { const b = best(a); return T.sum(xs, (x, i) => (ys[i] - a * x - b) ** 2); };
  const a = T.bisect((s) => sse(s + 1e-4) - sse(s - 1e-4), -1e4, 1e4, 200), my = T.mean(ys), sst = T.sum(ys, (y) => (y - my) ** 2);
  return { a, b: best(a), r: Math.sign(a) * Math.sqrt(1 - sse(a) / sst) };
}
// a cumulative frequency graph as the student sees it: read values off the drawn curve
function cfRead(q, T) {
  const fn = q.graph.functions[0].fn, [x0, x1] = q.graph.x, n = q.graph.y[1], at = (x) => T.evalGraph(fn, x);
  T.require(Math.abs(at(x0)) < 1e-9 && Math.abs(at(x1) - n) < 1e-9, "the curve runs from zero to the total");
  T.require(Number.isInteger(n / 12) && Math.abs(q.graph.yStep - n / 12) < 1e-9, "quartiles are on grid lines");
  T.require(q.stem.includes(`$${n}$`), "the total is stated");
  return { n, at, inv: (c) => T.bisect((x) => at(x) - c, x0, x1) };
}
// the five-number summary drawn in a box plot graph
function boxRead(g, T) {
  const f = g.functions, mid = (d) => (d[0] + d[1]) / 2, five = [f[0].domain[0], f[2].domain[0], mid(f[5].domain), f[2].domain[1], f[1].domain[1]];
  T.require(five.every((x, i) => i === 0 || five[i - 1] < x) && five[0] > g.x[0] && five[4] < g.x[1], "the five values increase and sit inside the axis");
  T.require(f[0].domain[1] === five[1] && f[1].domain[0] === five[3], "the whiskers meet the box");
  return five.map((x) => Number(x.toFixed(6)));
}

// ln of n choose k, by adding logs
function lnBinom(n, k) {
  let s = 0;
  for (let i = 1; i <= k; i++) s += Math.log(n - k + i) - Math.log(i);
  return s;
}
