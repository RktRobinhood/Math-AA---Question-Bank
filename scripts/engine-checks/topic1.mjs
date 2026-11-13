// Independent answer verifiers for the Topic 1 generators, keyed by generator id.
// Sequences are rebuilt term by term and searched by brute force; equations are solved by root search.

// the arithmetic sequence as a list of terms u_1 .. u_n
const arith = (u1, d, n) => Array.from({ length: n }, (_, i) => u1 + i * d);
const total = (xs) => xs.reduce((s, x) => s + x, 0);
const geomSum = (u1, r, n) => { let s = 0, t = u1; for (let i = 0; i < n; i++) { s += t; t *= r; } return s; };
const years = (start, ratio, test) => { let n = 0, v = start; while (!test(v)) { v *= ratio; n++; if (n > 5000) throw new Error("no such year"); } return n; };

// a positive number as [mantissa, power of ten], found by repeated division or multiplication by ten
const norm = (v) => { let a = Math.abs(v), k = 0; while (a >= 10) { a /= 10; k++; } while (a < 1) { a *= 10; k--; } return [a, k]; };
// polynomials as coefficient lists, lowest power first, multiplied out term by term
const polyMul = (p, q) => { const out = new Array(p.length + q.length - 1).fill(0); p.forEach((a, i) => q.forEach((b, j) => { out[i + j] += a * b; })); return out; };
const polyPow = (p, n) => { let out = [1]; for (let i = 0; i < n; i++) out = polyMul(out, p); return out; };
const geomTerms = (u1, r, n) => { const xs = []; let t = u1; for (let i = 0; i < n; i++) { xs.push(t); t *= r; } return xs; };
const intLog = (b, N) => { for (let k = -12; k <= 20; k++) if (Math.abs(Math.pow(b, k) - N) < 1e-9 * Math.max(1, N)) return k; throw new Error("no whole power"); };

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
  // ---- second batch ----
  "t1-standard-form/to-form-large/equation": (q, T) => {
    const [a, k] = norm(q.params.N);
    T.require(k >= 3, "a large number");
    return { a, b: k };
  },
  "t1-standard-form/to-form-small/equation": (q, T) => {
    const [a, k] = norm(q.params.N);
    T.require(k <= -2, "a small number");
    return { a, b: k };
  },
  "t1-standard-form/multiply-renormalise/equation": (q, T) => {
    const { a, m, b, n } = q.params, [c, k] = norm(a * Math.pow(10, m) * b * Math.pow(10, n));
    T.require(a >= 1 && a < 10 && b >= 1 && b < 10 && a * b >= 10, "both factors are in standard form and the product needs renormalising");
    return { a: c, b: k };
  },
  "t1-standard-form/divide-renormalise/equation": (q, T) => {
    const { a, m, b, n } = q.params, [c, k] = norm((a * Math.pow(10, m)) / (b * Math.pow(10, n)));
    T.require(a >= 1 && a < 10 && b >= 1 && b < 10 && a < b, "both numbers are in standard form and the quotient needs renormalising");
    return { a: c, b: k };
  },
  "t1-standard-form/total-from-unit/words": (q, T) => {
    const { m1, e1, n1, e2, m3, e3 } = q.params, one = m1 * Math.pow(10, -e1);
    const [a, k] = norm(one * n1 * Math.pow(10, e2)), [b, n] = norm((m3 * Math.pow(10, -e3)) / one);
    T.require(m1 >= 1 && m1 < 10 && m3 >= 1 && m3 < 10 && n1 >= 1 && n1 < 10, "the given numbers are in standard form");
    T.require(n >= 2, "the second sample holds many items");
    return { a, b: k, c: b, d: n };
  },
  "t1-standard-form/sphere-volume-pi/words": (q, T) => {
    const { rm, re, mm, mk } = q.params, r = rm * Math.pow(10, re);
    const V = T.integrate((x) => Math.PI * (r * r - x * x), -r, r, 400); // the sphere as a stack of discs
    const [a, k] = norm(V), density = (mm * Math.pow(10, mk)) / V;
    T.require(density > 1000 && density < 9000, "a density a rock or metal body could have");
    return { a, b: k, c: density };
  },
  "t1-arithmetic-sequence/term-from-u1-d/notation": (q, T) => {
    const { u1, d, n } = q.params.sit;
    T.require(d !== 0, "the terms change");
    return { a: arith(u1, d, n)[n - 1] };
  },
  "t1-arithmetic-sequence/sum-from-u1-d/terms": (q, T) => {
    const { t1, t2, n } = q.params, d = t2 - t1, xs = arith(t1, d, n);
    T.require(d !== 0, "the terms change");
    return { a: d, b: xs[n - 1], c: total(xs) };
  },
  "t1-arithmetic-sequence/n-from-sum/notation": (q, T) => {
    const { u1, d, S } = q.params;
    let run = 0, n = 0, t = u1;
    while (run < S) { run += t; t += d; n++; }
    T.require(run === S && u1 > 0 && d > 0, "the sum is reached exactly by an increasing sequence");
    return { a: n, b: t - d };
  },
  "t1-geometric-sequence/r-from-terms/terms": (q, T) => {
    const { t1, t2, t3 } = q.params, r = t2 / t1;
    T.require(T.close(t3 / t2, r), "the three terms are geometric");
    return { a: r, b: t3 * r };
  },
  "t1-geometric-sequence/term-from-u1-r/graph": (q, T) => {
    const { u1, rn, rd } = q.params, terms = geomTerms(u1, rn / rd, 5);
    return { a: T.optionWhere(q, "a", (v) => v.every((y, i) => T.close(y, terms[i]))) };
  },
  "t1-geometric-sequence/term-exact/notation": (q, T) => {
    const { u1, rn, rd, n } = q.params, xs = geomTerms(u1, rn / rd, n);
    T.require(xs.every((x) => T.close(x, Math.round(x))), "every term is a whole number");
    return { a: xs[n - 1], b: total(xs) };
  },
  "t1-geometric-sequence/sigma-evaluate/notation": (q, T) => {
    const { a, b, n } = q.params;
    let s = 0;
    for (let r = 1; r <= n; r++) s += a * Math.pow(b, r);
    return { a: a * b, b: (a * b * b) / (a * b), c: s };
  },
  "t1-geometric-in-context/rebound-height/words": (q, T) => {
    const { H, pc, n } = q.params;
    let h = H;
    for (let i = 0; i < n; i++) h = (h * pc) / 100;
    T.require(pc < 100, "each bounce is lower");
    return { a: pc / 100, b: h };
  },
  "t1-geometric-in-context/least-n-term/words": (q, T) => {
    const { F, p, n, target } = q.params;
    let v = F, month = 1, run = 0, atN = null, sumN = null, first = null;
    while (first === null && month < 500) {
      run += v;
      if (month === n) { atN = v; sumN = run; }
      if (v > target) first = month;
      v += (v * p) / 100; month++;
    }
    T.require(first !== null && first > n, "the target is reached after the month already asked about");
    T.require(Math.abs(F * Math.pow(1 + p / 100, first - 1) - target) > 1e-6 * target, "the target is not a value the sequence takes");
    return { a: atN, b: sumN, c: first };
  },
  "t1-depreciation/read-rate/equation": (q, T) => {
    const { V0, mult } = q.params, f = (t) => V0 * Math.pow(mult, t);
    T.require(mult > 0 && mult < 1, "the value falls");
    return { a: f(0), b: (1 - f(1) / f(0)) * 100 };
  },
  "t1-compound-interest/interest-earned/words": (q, T) => {
    const { P0, rate, years: yrs } = q.params, A = P0 * Math.pow(1 + rate / 100, yrs);
    T.require(T.close(A, Math.round(A)), "the value is a whole number of euros");
    return { a: P0 * (1 + rate / 100), b: A, c: A - P0 };
  },
  "t1-ext-exponent-laws/evaluate-zero-negative/equation": (q) => {
    const { b, n, s, t, n2 } = q.params;
    return { a: Math.pow(b, -n), b: Math.pow(s / t, -n2) };
  },
  "t1-ext-exponent-laws/simplify-powers/equation": (q, T) => {
    const { a, m, n } = q.params, f = (x) => Math.pow(a * Math.pow(x, m), 2) * Math.pow(x, n);
    return { a: T.optionWhere(q, "a", (v) => [2, 3, 1.5].every((x) => T.close(v[0] * Math.pow(x, v[1]), f(x)))) };
  },
  "t1-log-exp-form/value-whole-power/equation": (q) => {
    const { b, N, c, arg } = q.params;
    return { a: intLog(b, N), b: intLog(c, arg) };
  },
  "t1-log-exp-form/to-log-form/equation": (q, T) => {
    const { b, n, N } = q.params;
    T.require(Math.pow(b, n) === N, "the given statement is true");
    return { a: T.optionWhere(q, "a", (v) => Math.abs(Math.pow(v[0], v[2]) - v[1]) < 1e-9) };
  },
  "t1-log-exp-form/solve-log-linear/equation": (q, T) => {
    const { b1, N, c, m, p, q: qq } = q.params;
    const r = T.roots((x) => Math.log(p * x + qq) / Math.log(c) - m, -qq / p + 1e-6, 200, 40000);
    T.require(r.length === 1, "one solution");
    return { a: intLog(b1, 1 / N), b: r[0] };
  },
  "t1-log-exp-form/solve-log-square/equation": (q, T) => {
    const { c, m, p, q: qq, M, n } = q.params;
    const hits = T.range(-200, 200).filter((x) => { const arg = x * x + p * x + qq; return arg > 0 && Math.abs(Math.log(arg) / Math.log(c) - m) < 1e-9; });
    T.require(hits.length === 2, "two whole-number solutions");
    return { a: hits[0], b: hits[1], c: T.bisect((t) => Math.pow(t, n) - M, 1, 60) };
  },
  "t1-log-exp-form/model-time/words": (q, T) => {
    const { A, B, t1, target } = q.params, R = (t) => A - (B * Math.log(t + 1)) / Math.LN10;
    const t = T.bisect((x) => target - R(x), 0, 2000);
    T.require(R(0) === A && target < A && t > 1 && t < 100, "the target is reached at a sensible time");
    return { a: R(0), b: R(t1), c: t };
  },
  "t1-ext-logs-with-technology/evaluate-and-solve/equation": (q, T) => {
    const { N, M, A, R } = q.params;
    return { a: T.bisect((x) => Math.pow(10, x) - N, 0, 5), b: T.bisect((x) => Math.pow(10, x) - M, 0, 5), c: T.bisect((x) => A * Math.exp(x) - R, -5, 10) };
  },
  "t1-algebraic-proof/represent-integers/words": (q, T) => {
    const mod = (v, k) => ((v % k) + k) % k;
    const tests = { odd: (v) => mod(v, 2) === 1, even: (v) => mod(v, 2) === 0, three: (v) => mod(v, 3) === 0, four: (v) => mod(v, 4) === 0 };
    const test = tests[q.params.prop];
    return { a: T.optionWhere(q, "a", (c) => T.range(-40, 40).every((n) => test(c[0] * n * n + c[1] * n + c[2]))) };
  },
  "t1-ext-identity-constants/expand-compare/equation": (q, T) => {
    const { a, b, c } = q.params, f = (x) => (x + a) ** 2 - (x + b) * (x + c);
    T.require(f(2) - f(1) === f(1) - f(0) && f(7) - f(6) === f(1) - f(0), "the left side is linear");
    return { a: f(1) - f(0), b: f(0) };
  },
  "t1-algebraic-proof/finish-divisibility/equation": (q, T) => {
    const { c, a, X, Y } = q.params, f = (n) => (c * n + a) ** 2 - (c * n - a) ** 2;
    T.require(f(0) === 0 && T.range(-20, 20).every((n) => f(n) === f(1) * n), "the expression is a constant times n");
    let g = 0;
    for (let n = -40; n <= 40; n++) g = T.gcd(g, f(n));
    T.require((X - a) % c === 0 && X - Y === 2 * a, "the two squares come from a whole value of n");
    return { a: f(1), b: g, c: X * X - Y * Y };
  },
  "t1-rational-exponents/value-fraction/equation": (q, T) => {
    const { base, p, d } = q.params, v = Math.pow(base, p / d);
    T.require(T.close(v, Math.round(v)), "the value is a whole number");
    return { a: v };
  },
  "t1-rational-exponents/value-fraction-base/equation": (q) => {
    const { base, p, d, A, B, p2, d2 } = q.params;
    return { a: Math.pow(base, -p / d), b: Math.pow(A / B, -p2 / d2) };
  },
  "t1-log-laws/value-hidden/equation": (q, T) => {
    const { b, m1, m2, top, Q } = q.params, L = (x) => Math.log(x) / Math.log(b);
    T.require(![m1, m2, top, Q].some((x) => T.close(L(x), Math.round(L(x)))), "no single logarithm is a whole number");
    return { a: L(m1) + L(m2), b: L(top) - L(Q) };
  },
  "t1-log-laws/cob-common-base/equation": (q, T) => {
    const { base, arg } = q.params, v = Math.log(arg) / Math.log(base);
    T.require(!T.close(v, Math.round(v)), "the value is not a whole number");
    return { a: v };
  },
  "t1-log-laws/given-log-laws/equation": (q, T) => {
    const { p, q: qq, m, n } = q.params, x = Math.pow(2, p), y = Math.pow(2, qq); // a = 2
    T.require(p !== 0, "x is not 1, so it can be a base");
    return { a: Math.log2(Math.pow(x, m) * y), b: Math.log2(x / Math.pow(y, n)), c: Math.log(y) / Math.log(x) };
  },
  "t1-ext-common-base/solve-common-base/equation": (q, T) => {
    const { A, R, A2, B2, k, c, e } = q.params;
    const r = T.roots((x) => (x + c) * Math.log(A2) - (k * x + e) * Math.log(B2), -80, 80, 3211);
    T.require(r.length === 1, "one solution");
    return { a: T.bisect((x) => Math.pow(A, x) - R, -10, 10), b: r[0] };
  },
  "t1-solve-exponential/isolate-e-exact/equation": (q, T) => {
    const { A, k, B, C } = q.params, r = T.roots((x) => A * Math.exp(k * x) + B - C, -5, 5, 2001);
    T.require(r.length === 1, "one solution");
    return { a: r[0] };
  },
  "t1-solve-exponential/two-bases-3sf/equation": (q, T) => {
    const { a, b, N, k, c, e } = q.params;
    const r = T.roots((x) => Math.pow(a, k * x + c) / Math.pow(b, x + e) - 1, -35, 35, 7001);
    T.require(r.length === 1, "one solution");
    return { a: T.bisect((x) => Math.pow(a, x) - N, 0, 10), b: r[0] };
  },
  "t1-sum-to-infinity/exists-claim/notation": (q, T) => {
    // a sequence has a sum to infinity when its partial sums settle
    const settles = (v) => { const s = (n) => geomSum(v[0], v[1], n); return Math.abs(s(3001) - s(1500)) < 1e-6 && Math.abs(s(3000) - s(1500)) < 1e-6; };
    return { a: T.optionWhere(q, "a", settles) };
  },
  "t1-sum-to-infinity/sinf-value/terms": (q, T) => {
    const { t1, t2 } = q.params, r = t2 / t1;
    T.require(Math.abs(r) < 1, "the series converges");
    return { a: r, b: T.approx(geomSum(t1, r, 6000), 1e-6) };
  },
  "t1-sum-to-infinity/u1-from-sinf/notation": (q, T) => {
    const { rn, rd, S } = q.params, r = rn / rd, one = geomSum(1, r, 6000), u1 = T.bisect((u) => u * one - S, 0, 1e5);
    T.require(Math.abs(r) < 1, "the series converges");
    return { a: T.approx(u1, 1e-6), b: T.approx(u1 * r * r, 1e-6) };
  },
  "t1-sum-to-infinity/recurring-decimal/words": (q, T) => {
    const { blk } = q.params;
    let value = 0;
    for (let i = 1; i <= 9; i++) value += blk / Math.pow(100, i);
    let hit = null;
    for (let d = 1; d <= 99 && !hit; d++) { const n = Math.round(value * d); if (Math.abs(n / d - value) < 1e-12) hit = [n, d]; }
    T.require(hit !== null && Math.floor(blk / 10) !== blk % 10, "the block is not one digit repeated");
    return { a: (blk / 10000) / (blk / 100), b: hit[0], c: hit[1] };
  },
  "t1-sum-to-infinity/x-interval/equation": (q, T) => {
    const { A, k, c, x0 } = q.params, r = T.roots((x) => Math.abs(k * x + c) - 1, -20, 20, 4000);
    T.require(r.length === 2 && x0 > r[0] && x0 < r[1], "the value of x is inside the interval of convergence");
    return { a: r[0], b: r[1], c: T.approx(geomSum(A, k * x0 + c, 6000), 1e-6) };
  },
  "t1-binomial-term/ncr-value/equation": (q, T) => ({ a: T.nCr(q.params.n, q.params.r) }),
  "t1-binomial-term/coefficient-plain/equation": (q) => {
    const { n, a, m } = q.params, cs = polyPow([a, 1], n);
    return { a: cs.filter((c) => c !== 0).length, b: cs[m] };
  },
  "t1-binomial-term/first-three-terms/equation": (q, T) => {
    const { a, n } = q.params, cs = polyPow([1, a], n);
    T.require(cs[0] === 1, "the expansion starts with 1");
    return { a: cs[1], b: cs[2] };
  },
  "t1-binomial-term/coefficient-negative/equation": (q, T) => {
    const { a, b, n, m } = q.params, cs = polyPow([-b, a], n);
    T.require(Math.abs(cs[m]) <= 20000, "a coefficient that can be found by hand");
    return { a: cs[0], b: cs[m] };
  },
  "t1-ext-binomial-constant-term/constant-term/equation": (q, T) => {
    const { p, s, n, k } = q.params;
    // powers of x may be negative, so keep the expansion as a map from power to coefficient
    let cur = new Map([[0, 1]]);
    for (let i = 0; i < n; i++) { const nx = new Map(); for (const [e, c] of cur) { nx.set(e + p, (nx.get(e + p) || 0) + c); nx.set(e - s, (nx.get(e - s) || 0) + c * k); } cur = nx; }
    const rs = T.range(0, n).filter((r) => p * (n - r) - s * r === 0);
    T.require(rs.length === 1 && cur.has(0), "exactly one term is constant");
    return { a: rs[0], b: cur.get(0) };
  },
  "t1-ext-binomial-product/product-coefficient/equation": (q) => {
    const { a, b, n, m, kk } = q.params, cs = polyPow([a, b], n), prod = polyMul([1, kk], cs);
    return { a: cs[m], b: cs[m - 1], c: prod[m] };
  },
};
