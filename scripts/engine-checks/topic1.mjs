// Independent answer verifiers for the Topic 1 generators, keyed by generator id.
// Sequences are rebuilt term by term and searched by brute force; equations are solved by root search.

// the arithmetic sequence as a list of terms u_1 .. u_n
const arith = (u1, d, n) => Array.from({ length: n }, (_, i) => u1 + i * d);
const total = (xs) => xs.reduce((s, x) => s + x, 0);
const geomSum = (u1, r, n) => { let s = 0, t = u1; for (let i = 0; i < n; i++) { s += t; t *= r; } return s; };
const years = (start, ratio, test) => { let n = 0, v = start; while (!test(v)) { v *= ratio; n++; if (n > 5000) throw new Error("no such year"); } return n; };

export default {
  "t1-arithmetic-sequence/d-from-sum/equation": (q, T) => {
    const { k, N } = q.params;
    // search integer u1 and d for the sequence whose k-th term and k-th sum are both N
    const hits = [];
    for (let u1 = -80; u1 <= 80; u1++) for (let d = -20; d <= 20; d++) { const xs = arith(u1, d, k); if (xs[k - 1] === N && total(xs) === N) hits.push([u1, d]); }
    T.require(hits.length === 1, "exactly one sequence fits");
    return { a: hits[0][0], b: hits[0][1] };
  },
  "t1-arithmetic-sequence/n-from-term/equation": (q, T) => {
    const { u1, d } = q.params, xs = arith(u1, d, 400);
    T.require(d < 0 && u1 > 0, "a decreasing sequence that starts positive");
    let best = -Infinity, run = 0;
    for (const x of xs) { run += x; best = Math.max(best, run); }
    T.require(xs.indexOf(0) >= 0, "some term is zero");
    return { a: xs.indexOf(0) + 1, b: best };
  },
  "t1-arithmetic-sequence/d-from-two-terms/equation": (q, T) => {
    const { p, q: qq, up, uq, n } = q.params, d = T.bisect((x) => up + (qq - p) * x - uq, -100, 100), u1 = up - (p - 1) * Math.round(d);
    return { a: d, b: u1, c: total(arith(u1, Math.round(d), n)) };
  },
  "t1-ext-sigma-arithmetic/sum-from-general-term/equation": (q, T) => {
    const { a, b, n } = q.params;
    let s = 0;
    for (let r = 1; r <= n; r++) s += a * r + b;
    T.require(a !== 0, "the terms change");
    return { b: s };
  },
  "t1-arithmetic-in-context/first-total-past/words": (q, T) => {
    const { u1, d, n, target } = q.params, xs = arith(u1, d, 400);
    let run = 0, least = 0;
    while (run < target) run += xs[least++];
    T.require(least > 1 && least < 200, "a sensible number of rows");
    return { a: xs[n - 1], b: total(xs.slice(0, n)), c: least };
  },
  "t1-geometric-sequence/sum-from-u1-r/equation": (q, T) => {
    const { u1, r, n, target } = q.params;
    let k = 1;
    while (geomSum(u1, r, k) <= target) k++;
    T.require(k > n, "the target is past the sum already found");
    return { a: u1 * r ** (n - 1), b: geomSum(u1, r, n), c: k };
  },
  "t1-geometric-sequence/u1-from-two-terms/equation": (q, T) => {
    const { u2, u4 } = q.params, r = T.bisect((x) => u2 * x * x - u4, 0, 1), u1 = u2 / r;
    T.require(r > 0 && r < 1, "the series converges");
    return { a: r, b: u1, c: T.approx(geomSum(u1, r, 4000), 1e-6) };
  },
  "t1-sum-to-infinity/sinf-value/equation": (q, T) => {
    const { u1, rn, rd, eps } = q.params, r = rn / rd, sInf = geomSum(u1, r, 6000);
    let n = 1;
    while (sInf - geomSum(u1, r, n) >= eps) n++;
    const gap = sInf - geomSum(u1, r, n);
    T.require(Math.abs(gap - eps) > 1e-9 && Math.abs(sInf - geomSum(u1, r, n - 1) - eps) > 1e-9, "the answer does not sit on the boundary");
    return { a: T.approx(sInf, 1e-6), b: n };
  },
  "t1-sum-to-infinity/r-from-u2-both/equation": (q, T) => {
    const { u1, u3 } = q.params, r = T.bisect((x) => u1 * x * x - u3, 0, 1);
    T.require(r > 0 && r < 1, "the series converges");
    return { a: r, b: T.approx(geomSum(u1, r, 6000), 1e-6) };
  },
  "t1-depreciation/years-below/words": (q, T) => {
    const { start, p, years: yrs, threshold } = q.params, ratio = (100 - p) / 100;
    let v = start;
    for (let i = 0; i < yrs; i++) v *= ratio;
    const n = years(start, ratio, (x) => x < threshold);
    T.require(Math.abs(start * ratio ** n - threshold) > 1e-6, "the value is not exactly on the threshold");
    return { a: ratio, b: v, c: n };
  },
  "t1-depreciation/least-periods/words": (q, T) => {
    const { P0, r, threshold } = q.params, ratio = (100 - r) / 100, n = years(P0, ratio, (x) => x < threshold);
    T.require(Math.abs(P0 * ratio ** n - threshold) > 1e-6 && n >= 2, "not on the threshold");
    return { a: ratio, b: n };
  },
  "t1-compound-interest/future-value/words": (q, T) => {
    const { P0, r, n } = q.params;
    let v = P0;
    for (let i = 0; i < n; i++) v += (v * r) / 100; // add each year's interest
    T.require(Math.abs(v - Math.floor(v) - 0.5) > 0.005, "rounding to the nearest euro is not a coin toss");
    return { a: T.approx(v, 0.5), b: T.approx(v - P0, 0.5) };
  },
  "t1-compound-interest/time-needed/words": (q, T) => {
    const { pv, rate, years: yrs, target } = q.params, mult = 1 + rate / 100;
    let v = pv;
    for (let i = 0; i < yrs; i++) v *= mult;
    const n = years(pv, mult, (x) => x > target);
    T.require(n > yrs, "the target is beyond the value already found");
    return { a: v, b: n };
  },
  "t1-algebraic-proof/consecutive-sum/words": (q, T) => {
    // the claim in the question is tested on many integers
    const s = q.params.stem, ask = q.parts[0].prompt;
    const ok = (n) => (/odd integers is divisible/.test(ask) ? (4 * n + 4) % 4 === 0 : /even integers/.test(ask) ? (2 * n * (2 * n + 2)) % 8 === 0 : /squares of two consecutive/.test(ask) ? Math.abs(((n + 1) ** 2 - n ** 2) % 2) === 1
      : /three consecutive/.test(ask) ? (3 * n + 3) % 3 === 0 : /square of an odd/.test(ask) ? ((((2 * n + 1) ** 2 - 1) % 4) + 4) % 4 === 0 : false);
    T.require(s.length > 0 && T.range(-30, 30).every(ok), "the statement to prove is true");
    return {};
  },
  "t1-log-laws/solve-log-equation/equation": (q, T) => {
    const { b, c, d } = q.params, f = (x) => Math.log(x) / Math.log(b) + Math.log(x + d) / Math.log(b) - c;
    const r = T.roots(f, 1e-6, 400, 80000);
    T.require(r.length === 1 && d > 0, "one positive solution");
    return { a: r[0] * (r[0] + d), b: r[0] };
  },
  "t1-binomial-find-unknown/k-positive-condition/equation": (q, T) => {
    const { n, mm, coeff } = q.params;
    // expand (x + k)^n by repeated multiplication and read the coefficient of x^mm
    const coeffOf = (k) => { let p = [1]; for (let i = 0; i < n; i++) { const nx = new Array(p.length + 1).fill(0); p.forEach((c, j) => { nx[j] += c * k; nx[j + 1] += c; }); p = nx; } return p[mm]; };
    const hits = T.range(1, 12).filter((k) => coeffOf(k) === coeff);
    T.require(hits.length === 1, "one positive integer k");
    return { a: n - mm, b: hits[0] };
  },
};
