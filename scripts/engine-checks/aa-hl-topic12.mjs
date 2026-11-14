// Independent answer verifiers for the AA HL generators of Topic 1 (1.10 to 1.16) and Topic 2
// (2.12 to 2.16), keyed by generator id. Each recomputes the answers by a different route from the
// generator's formula: brute-force counting, numerical differentiation and integration, limits,
// complex arithmetic done numerically with the argument found by search, root search, Cramer's
// rule and grid tests of an inequality's solution set. T.require(...) states a constraint.

// ---- complex numbers as [re, im] ----
const cmul = ([a, b], [c, d]) => [a * c - b * d, a * d + b * c];
const cdiv = ([a, b], [c, d]) => { const n = c * c + d * d; return [(a * c + b * d) / n, (b * c - a * d) / n]; };
const cpow = (z, n) => { let r = [1, 0]; for (let i = 0; i < n; i++) r = cmul(r, z); return r; };
const cis = (r, t) => [r * Math.cos(t), r * Math.sin(t)];
// The principal argument, by search: the direction t in (-pi, pi] for which z e^{-it} is real and positive.
const argOf = (T, [a, b]) => {
  const s = Math.hypot(a, b);
  const rs = T.roots((t) => (b * Math.cos(t) - a * Math.sin(t)) / s, -Math.PI + 1e-7, Math.PI + 1e-7, 2400).filter((t) => a * Math.cos(t) + b * Math.sin(t) > 0);
  if (rs.length !== 1) throw new Error("argument search found " + rs.length + " directions");
  return Math.abs(rs[0]) < 1e-9 ? 0 : rs[0];
};
const isPrime = (v) => { if (v < 2 || !Number.isInteger(v)) return false; for (let i = 2; i * i <= v; i++) if (v % i === 0) return false; return true; };
const det3 = (m) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
// Cramer's rule for a 3 by 3 system
const cramer = (m, d) => { const D = det3(m); return [0, 1, 2].map((j) => det3(m.map((row, i) => row.map((v, k) => (k === j ? d[i] : v)))) / D); };
// the constants of a split over two linear factors, as limits
const pfLimits = (f, a, b) => ({ A: (1e-7) * f(a + 1e-7), B: (1e-7) * f(b + 1e-7) });
const pfFn = (s) => (x) => (s.pN * x + s.qN) / ((x - s.a) * (x - s.b));
const binom = (q, T, f) => ({ c1: T.approx(T.deriv(f, 0, 1e-4), 1e-5), c2: T.approx(T.deriv2(f, 0, 2e-3) / 2, 1e-4) });
const perms = (n) => { const out = []; const go = (cur, left) => { if (!left.length) out.push(cur); else left.forEach((v, i) => go(cur.concat(v), left.filter((_, j) => j !== i))); }; go([], Array.from({ length: n }, (_, i) => i)); return out; };
// a cubic with roots p + qi, p - qi and r, evaluated without expanding it
const cubicAt = (p, q, r) => (x) => (x - r) * ((x - p) * (x - p) + q * q);

// synthetic division of a polynomial (highest power first) by x - a
const synth = (cs, a) => { const out = []; let carry = 0; for (const c of cs) { carry = carry * a + c; out.push(carry); } return { rem: out.pop(), quo: out }; };
// all complex roots of a polynomial by the Durand-Kerner iteration
const dkRoots = (cs) => {
  const n = cs.length - 1, mon = cs.map((c) => c / cs[0]);
  let zs = Array.from({ length: n }, (_, i) => cpow([0.4, 0.9], i).map((v) => v * 1.7));
  const at = (z) => mon.reduce((s, c) => { const t = cmul(s, z); return [t[0] + c, t[1]]; }, [0, 0]);
  for (let it = 0; it < 400; it++) zs = zs.map((z, i) => { let den = [1, 0]; zs.forEach((w, j) => { if (j !== i) den = cmul(den, [z[0] - w[0], z[1] - w[1]]); }); const st = cdiv(at(z), den); return [z[0] - st[0], z[1] - st[1]]; });
  return zs;
};
// the option whose first curve agrees with f at every test point (points near an asymptote count when both are large)
const whichGraph = (q, label, f, T, xs = [-4.63, -3.37, -2.41, -1.57, -0.61, 0.43, 1.39, 2.53, 3.61, 4.47]) =>
  T.optionWhere(q, label, (v, i) => {
    const fn = q.parts.find((p) => p.label === label).answer.options[i].functions[0].fn;
    return xs.every((x) => { const a = T.evalGraph(fn, x), b = f(x); return Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(b)); });
  });
const holds = (rel, v) => (rel === "ge" ? v >= 0 : rel === "le" ? v <= 0 : rel === "gt" ? v > 0 : v < 0);
// Is the union of the intervals the set where cond holds? Tested on a grid that avoids the end points.
const sameSet = (iv, cond, lo, hi, skip = []) => {
  const ends = iv.flat().concat(skip);
  for (let x = lo + 0.0137; x < hi; x += 0.0491) {
    if (ends.some((e) => Math.abs(x - e) < 0.004)) continue;
    if (iv.some(([a, b]) => x > a && x < b) !== cond(x)) return false;
  }
  return true;
};

export default {
  // ======================= 1.10 =======================
  "t1-ahl-counting/code-count/words": (q, T) => {
    const { L, nl, D, nd, rep } = q.params;
    let digits = 0;
    const go = (used) => { if (used.length === D) { digits++; return; } for (let v = 1; v <= nd; v++) if (rep || !used.includes(v)) go(used.concat(v)); };
    go([]);
    return { a: Math.pow(nl, L) * digits };
  },
  "t1-ahl-counting/award-places/words": (q) => {
    const n = q.params.n;
    let all = 0, withFirst = 0;
    for (let g = 0; g < n; g++) for (let s = 0; s < n; s++) for (let b = 0; b < n; b++) if (g !== s && g !== b && s !== b) { all++; if (g === 0 || s === 0 || b === 0) withFirst++; }
    return { a: all, b: withFirst };
  },
  "t1-ahl-counting/together/words": (q) => {
    const n = q.params.n, ps = perms(n);
    const tog = ps.filter((p) => Math.abs(p.indexOf(0) - p.indexOf(1)) === 1).length;
    const ends = ps.filter((p) => (p[0] === 0 && p[n - 1] === 1) || (p[0] === 1 && p[n - 1] === 0)).length;
    return { a: ps.length, b: tog, c: ps.length - tog, d: ends };
  },
  "t1-ahl-counting/committee-at-least-one/words": (q, T) => {
    const { M, W, k, j } = q.params, n = M + W;      // people 0..W-1 are the women
    let total = 0, exact = 0, some = 0, more = 0;
    for (let mask = 0; mask < 1 << n; mask++) {
      let size = 0, w = 0;
      for (let i = 0; i < n; i++) if (mask & (1 << i)) { size++; if (i < W) w++; }
      if (size !== k) continue;
      total++; if (w === j) exact++; if (w >= 1) some++; if (w > k - w) more++;
    }
    T.require(k <= M, "a committee with no women is possible");
    return { a: total, b: exact, c: some, d: more / total };
  },
  "t1-ahl-binomial-rational/coefficients/equation": (q, T) => {
    const { n, a } = q.params, { c1, c2 } = binom(q, T, (x) => Math.pow(1 + a * x, n));
    const edge = Math.abs(T.bisect((x) => 1 + a * x, -5, 5));      // the expansion fails where 1 + ax = 0
    return { a: c1, b: c2, c: T.option(edge) };
  },
  "t1-ahl-binomial-rational/expand-shifted/equation": (q, T) => {
    const { n, p, q: qq } = q.params, f = (x) => Math.pow(p + qq * x, n), { c1, c2 } = binom(q, T, f);
    return { a: f(0), b: c1, c: c2, d: Math.abs(T.bisect((x) => p + qq * x, -20, 20)) };
  },
  "t1-ahl-binomial-rational/approximation/equation": (q, T) => {
    const { n, a, x0 } = q.params, f = (x) => Math.pow(1 + a * x, n), { c1, c2 } = binom(q, T, f);
    const est = 1 + c1.value * x0 + c2.value * x0 * x0;
    T.require(Math.abs(a * x0) < 1, "the value used is inside the interval of validity");
    return { a: c1, b: c2, c: T.approx(est, 1e-6), d: T.approx((100 * Math.abs(est - f(x0))) / f(x0), 1e-4) };
  },
  // ======================= 1.11 =======================
  "t1-ahl-partial-fractions/one-constant/equation": (q, T) => {
    const s = q.params.sit, L = pfLimits(pfFn(s), s.a, s.b);
    T.require(s.a !== s.b, "two distinct linear factors");
    return { a: T.approx(L.A, 1e-4) };
  },
  "t1-ahl-partial-fractions/constants/equation": (q, T) => {
    const s = q.params.sit, L = pfLimits(pfFn(s), s.a, s.b);
    T.require(s.a !== s.b, "two distinct linear factors");
    return { a: T.approx(L.A, 1e-4), b: T.approx(L.B, 1e-4) };
  },
  "t1-ahl-partial-fractions/telescoping-sum/equation": (q, T) => {
    const { d, a, c, N } = q.params, f = (r) => c / ((d * r + a) * (d * r + a + d));
    const r1 = -a / d + 1e-7, r2 = -(a + d) / d + 1e-7;
    let sum = 0;
    for (let r = 1; r <= N; r++) sum += f(r);
    return { a: T.approx(f(r1) * (d * r1 + a), 1e-4), b: T.approx(f(r2) * (d * r2 + a + d), 1e-4), c: sum };
  },
  "t1-ahl-partial-fractions/then-integrate/equation": (q, T) => {
    const s = q.params, f = pfFn(s), L = pfLimits(f, s.a, s.b);
    T.require(s.lo > Math.max(s.a, s.b), "the interval of integration avoids the asymptotes");
    return { a: T.approx(L.A, 1e-4), b: T.approx(L.B, 1e-4), c: T.approx(T.integrate(f, s.lo, s.hi, 4000), 1e-7) };
  },
  // ======================= 1.12 =======================
  "t1-ahl-complex-cartesian/conjugate-modulus/equation": (q, T) => {
    const { a, b } = q.params;
    // the conjugate is the number a + yi whose product with z is real
    return { a: T.bisect((r) => r * r - (a * a + b * b), 0, 100), b: T.bisect((y) => cmul([a, b], [a, y])[1], -100, 100) };
  },
  "t1-ahl-complex-cartesian/argand-point/graph": (q, T) => {
    const { a, b } = q.params, at = (x, y) => q.graph.points.find((p) => p.x === x && p.y === y).label;
    T.require(new Set(q.graph.points.map((p) => p.x + "," + p.y)).size === 4, "four different points");
    return { a: T.option(at(a, -b)), b: T.option(at(-a, -b)) };
  },
  "t1-ahl-complex-cartesian/product/equation": (q, T) => {
    const { a, b, c, d } = q.params, r = Math.hypot(a, b) * Math.hypot(c, d), t = argOf(T, [a, b]) + argOf(T, [c, d]);
    return { a: T.approx(r * Math.cos(t), 1e-6), b: T.approx(r * Math.sin(t), 1e-6) };
  },
  "t1-ahl-complex-cartesian/complex-quadratic/equation": (q, T) => {
    const { b, c } = q.params, m = T.extremum((x) => x * x + b * x + c, -20, 20, "min", 4000);
    T.require(m.value > 0, "the quadratic has no real roots");
    return { a: T.approx(-4 * m.value, 1e-6), b: T.approx(m.x, 1e-6), c: T.approx(Math.sqrt(m.value), 1e-6) };
  },
  "t1-ahl-complex-cartesian/quotient/equation": (q, T) => {
    const { a, b, c, d } = q.params, r = Math.hypot(a, b) / Math.hypot(c, d), t = argOf(T, [a, b]) - argOf(T, [c, d]);
    return { a: T.approx(Math.pow(Math.hypot(c, d), 2), 1e-9), b: T.approx(r * Math.cos(t), 1e-6), c: T.approx(r * Math.sin(t), 1e-6) };
  },
  "t1-ahl-complex-cartesian/equate-parts/equation": (q, T) => {
    const { al, be, p, q: qq } = q.params, hits = [];
    for (let x = -12; x <= 12; x++) for (let y = -12; y <= 12; y++) {
      const iz = cmul([0, 1], [x, -y]);
      if (al * x + be * iz[0] === p && al * y + be * iz[1] === qq) hits.push([x, y]);
    }
    T.require(hits.length === 1, "exactly one solution");
    return { a: hits[0][0], b: hits[0][1] };
  },
  "t1-ahl-complex-cartesian/modulus-argument-values/equation": (q, T) => {
    const { a, b, c, d } = q.params, zw = cmul([a, b], [c, d]), t = argOf(T, zw);
    T.require(Math.abs(Math.abs(t) - Math.PI) > 0.05, "the argument of the product is not at the edge of the interval");
    return { a: T.bisect((r) => r * r - (a * a + b * b), 0, 100), b: argOf(T, [a, b]), c: Math.hypot(zw[0], zw[1]), d: t };
  },
  // ======================= 1.13 =======================
  "t1-ahl-complex-polar/polar-to-cartesian/equation": (q) => { const z = cis(q.params.R, q.params.t * Math.PI); return { a: z[0], b: z[1] }; },
  "t1-ahl-complex-polar/cartesian-to-polar/equation": (q, T) => {
    const { a, b } = q.params, t = argOf(T, [a, b]);
    return { a: a * Math.cos(t) + b * Math.sin(t), b: t };
  },
  "t1-ahl-complex-polar/rotation-enlargement/words": (q, T) => {
    const { a2, b2, neg, mz } = q.params, w = [(neg ? -1 : 1) * Math.sqrt(a2), Math.sqrt(b2)], t = argOf(T, w), img = cmul(w, [mz, 0]);
    T.require(t > 0, "the rotation angle is in the stated interval");
    return { a: w[0] * Math.cos(t) + w[1] * Math.sin(t), b: t, c: Math.hypot(img[0], img[1]) };
  },
  "t1-ahl-complex-polar/multiply-divide-polar/equation": (q, T) => {
    const { r1, r2, t1, t2 } = q.params, z1 = cis(r1, t1 * Math.PI), z2 = cis(r2, t2 * Math.PI), pr = cmul(z1, z2), qu = cdiv(z1, z2);
    return { a: Math.hypot(pr[0], pr[1]), b: argOf(T, pr), c: Math.hypot(qu[0], qu[1]), d: argOf(T, qu) };
  },
  "t1-ahl-complex-polar/polar-calculator/equation": (q, T) => {
    const { a, b, r, th } = q.params, w = cis(r, th), zw = cmul([a, b], w), t = argOf(T, zw);
    T.require(Math.abs(Math.abs(t) - Math.PI) > 0.05, "the argument of the product is not at the edge of the interval");
    return { a: w[0], b: w[1], c: Math.hypot(zw[0], zw[1]), d: argOf(T, [a, b]), e: t };
  },
  // ======================= 1.14 =======================
  "t1-ahl-de-moivre/power/equation": (q, T) => {
    const { R, t, n } = q.params, z = cpow(cis(R, t * Math.PI), n);
    return { a: Math.hypot(z[0], z[1]), b: argOf(T, z), c: T.approx(z[0], 1e-6 * Math.hypot(z[0], z[1])) };
  },
  "t1-ahl-de-moivre/cartesian-power/equation": (q, T) => {
    const { a, b, n } = q.params, z = cpow([a, b], n), m = Math.hypot(z[0], z[1]);
    return { a: Math.hypot(a, b), b: argOf(T, [a, b]), c: T.approx(z[0], 1e-6 * m), d: T.approx(z[1], 1e-6 * m) };
  },
  "t1-ahl-de-moivre/nth-roots/equation": (q, T) => {
    const { n, W, al } = q.params, r = T.bisect((x) => Math.pow(x, n) - W, 0, 10);
    // directions t with (cis t)^n pointing the same way as w
    const ts = T.roots((t) => Math.sin(n * t - al * Math.PI), -Math.PI + 1e-7, Math.PI + 1e-7, 4800).filter((t) => Math.cos(n * t - al * Math.PI) > 0);
    T.require(ts.length === n, "n distinct roots");
    for (const t of ts) { const z = cpow(cis(r, t), n), w = cis(W, al * Math.PI); T.require(Math.hypot(z[0] - w[0], z[1] - w[1]) < 1e-6 * W, "each root satisfies the equation"); }
    const pts = ts.map((t) => cis(r, t));
    let area = 0;
    for (let i = 0; i < n; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % n]; area += (x1 * y2 - x2 * y1) / 2; }
    return { a: r, b: Math.min(...ts.filter((t) => t > 1e-6)), c: T.approx(Math.abs(area), 1e-6) };
  },
  "t1-ahl-de-moivre/least-power-real/equation": (q, T) => {
    const { q: den, p, r, mm, pos } = q.params, z = cis(r, (p * Math.PI) / den);
    let n = 0, w = [1, 0];
    do { n++; w = cmul(w, z); } while (n < 200 && !(Math.abs(w[1]) < 1e-9 * Math.hypot(w[0], w[1]) && (!pos || w[0] > 0)));
    T.require(n < 200, "some power is real");
    const m = cpow(z, mm);
    return { a: Math.hypot(m[0], m[1]), b: n, c: w[0] };
  },
  "t1-ahl-conjugate-roots/write-conjugate-root/equation": (q, T) => {
    const { p, q: im } = q.params;
    // the other root x + yi makes the sum and the product of the two roots real
    const y = T.bisect((v) => im + v, -50, 50), x = T.bisect((v) => cmul([p, im], [v, y])[1], -50, 50);
    return { a: T.approx(x, 1e-6), b: T.approx(y, 1e-6) };
  },
  "fn-ahl-modulus-equations/shifted-modulus/equation": (q, T) => {
    const { a, k } = q.params, rs = T.roots((x) => Math.abs(x - a) - k, -40.03, 40.07, 16000);
    T.require(rs.length === 2, "two solutions");
    return { a: T.approx(rs[0], 1e-6), b: T.approx(rs[1], 1e-6) };
  },
  "t1-ahl-conjugate-roots/cubic-coefficients/equation": (q, T) => {
    const { p, q: im, r } = q.params, f = cubicAt(p, im, r), c = f(0);
    // the third root: the y for which (z1)(p + yi) is real, as it must be for real coefficients
    return { a: T.bisect((y) => cmul([p, im], [p, y])[1], -50, 50), b: (f(1) + f(-1)) / 2 - c, c };
  },
  "t1-ahl-conjugate-roots/find-real-root/equation": (q, T) => {
    const { p, q: im, a } = q.params;
    const aOf = (r) => { const f = cubicAt(p, im, r); return (f(1) + f(-1)) / 2 - f(0); };
    const r = T.bisect((x) => aOf(x) - a, -60, 60), f = cubicAt(p, im, r);
    T.require(Math.abs(r - Math.round(r)) < 1e-6, "the real root is an integer");
    return { a: T.approx(r, 1e-6), b: T.approx((f(1) - f(-1)) / 2 - 1, 1e-5), c: T.approx(f(0), 1e-5) };
  },
  // ======================= 1.15 =======================
  "t1-ahl-proof-induction/series/equation": (q, T) => {
    const { fam, a, b, c } = q.params, term = (r) => (fam === 0 ? a * r + b : r * (r + c));
    const S = (n) => { let s = 0; for (let r = 1; r <= n; r++) s += term(r); return s; };
    const closed = (n) => (fam === 0 ? (n * (a * n + a + 2 * b)) / 2 : (n * (n + 1) * (2 * n + 1 + 3 * c)) / 6);
    for (let n = 1; n <= 12; n++) T.require(S(n) === closed(n), "the statement is true");
    // the quadratic in k behind the inductive step, fitted from two values of k
    const g = (k) => (fam === 0 ? 2 * S(k + 1) - a * k * k : (6 * S(k + 1)) / (k + 1) - 2 * k * k);
    return { a: term(1), b: g(2) - g(1) };
  },
  "t1-ahl-proof-induction/divisibility/equation": (q, T) => {
    const { d, a, c0 } = q.params, f = (n) => Math.pow(a, n) + c0;
    for (let n = 1; n <= 7; n++) T.require(f(n) % d === 0, "the statement is true");
    T.require(f(3) - a * f(2) === f(2) - a * f(1), "f(k + 1) - a f(k) is constant");
    return { a: f(1), b: f(2) - a * f(1) };
  },
  "t1-ahl-proof-other/counterexample-prime/equation": (q, T) => {
    const { pr, sg, n0 } = q.params, f = (n) => n * n + sg * n + pr;
    const pick = T.optionWhere(q, "b", (v) => !isPrime(f(v))), bad = q.parts[1].answer.values[pick.index];
    for (let n = 1; n < bad; n++) T.require(isPrime(f(n)), "the counterexample is the first one");
    let fac = 2;
    while (f(bad) % fac) fac++;
    return { a: f(n0), b: pick, c: fac };
  },
  "t1-ahl-proof-other/counterexample-pick/words": (q, T) => {
    const holds = [(x) => x * x >= x, ([a, b]) => !(a > b) || a * a > b * b, (x) => Math.sqrt(x * x) === x, (n) => n * n * n >= n * n, ([a, b]) => (a + b) * (a + b) === a * a + b * b, (n) => isPrime(Math.pow(2, n) - 1)][q.params.key];
    return { a: T.optionWhere(q, "a", (v) => !holds(v)) };
  },
  "t1-ahl-proof-other/contradiction-linear/words": (q, T) => {
    const { p, q: qq, r } = q.params;
    let g = 1;
    for (let k = 1; k <= Math.min(p, qq); k++) if (p % k === 0 && qq % k === 0) g = k;
    for (let a = -60; a <= 60; a++) for (let b = -60; b <= 60; b++) T.require(p * a + qq * b !== r, "the statement is true on a grid of integers") || 0;
    return { a: g, b: r - g * Math.floor(r / g) };
  },
  "t1-ahl-proof-other/contradiction-irrational/words": (q, T) => {
    const p = q.params.p;
    T.require(isPrime(p), "the number under the root is prime");
    // b^2 = p c^2: every b up to a bound that makes c an integer is a multiple of p
    for (let b = 1; b <= 200; b++) { const c = Math.sqrt((b * b) / p); if (Number.isInteger(c)) T.require(b % p === 0, "b is a multiple of p"); }
    return { a: Math.round(Math.sqrt(p) * Math.sqrt(p)), b: T.option("multiple") };
  },
  // ======================= 1.16 =======================
  "t1-ahl-linear-systems/classify/equation": (q, T) => {
    const { a, b, c, m, n } = q.params, M = [[1, a, b], [0, 1, c], [0, 0, m]];
    return { a: T.option(Math.abs(det3(M)) > 1e-9 ? "one" : n !== 0 ? "none" : "many") };
  },
  "t1-ahl-linear-systems/solve-partly-reduced/equation": (q, T) => {
    const { R, d } = q.params;
    T.require(Math.abs(det3(R)) > 1e-9, "a unique solution");
    const [x, y, z] = cramer(R, d);
    return { a: y, b: z, c: x };
  },
  "t1-ahl-linear-systems/solve-unique/equation": (q, T) => {
    const { R, d } = q.params;
    T.require(Math.abs(det3(R)) > 1e-9, "a unique solution");
    const [x, y, z] = cramer(R, d);
    return { a: z, b: y, c: x };
  },
  "t1-ahl-linear-systems/consistency-condition/equation": (q, T) => {
    const { R1, R2, r3, d1, d2 } = q.params;
    const k = T.bisect((kk) => det3([R1, R2, [r3[0], r3[1], kk]]), -200, 200);
    // two points of the line in which the first two planes meet: z = 0 and z = 1
    const at = (z) => { const D = R1[0] * R2[1] - R1[1] * R2[0], e1 = d1 - R1[2] * z, e2 = d2 - R2[2] * z; return [(e1 * R2[1] - R1[1] * e2) / D, (R1[0] * e2 - e1 * R2[0]) / D, z]; };
    const P0 = at(0), P1 = at(1), third = (P) => r3[0] * P[0] + r3[1] * P[1] + k * P[2];
    T.require(Math.abs(third(P0) - third(P1)) < 1e-6, "with this k the third plane is parallel to the line");
    return { a: T.approx(k, 1e-6), b: T.approx(third(P0), 1e-5), c: P0[1], d: P1[1] - P0[1] };
  },
  "t1-ahl-linear-systems/set-up-system/words": (q, T) => {
    const { M, tot, order } = q.params, pr = cramer(M, tot);
    T.require(Math.abs(det3(M)) >= 3 && pr.every((v) => v > 0), "a unique solution with positive prices");
    return { a: T.approx(pr[0], 1e-6), b: T.approx(pr[1], 1e-6), c: T.approx(pr[2], 1e-6), d: T.approx(order[0] * pr[0] + order[1] * pr[1] + order[2] * pr[2], 1e-6) };
  },

  // ======================= 2.12 =======================
  "fn-ahl-polynomial-theorems/remainder/equation": (q, T) => ({ a: synth(q.params.cs, q.params.a).rem }),
  "fn-ahl-polynomial-theorems/factor-coefficient/equation": (q, T) => {
    const { a, C, D, d } = q.params, k = T.bisect((kk) => T.poly([1, kk, C, D], a), -200, 200);
    T.require(Math.abs(k - Math.round(k)) < 1e-6, "k is an integer");
    return { a: T.approx(k, 1e-6), b: T.approx(synth([1, Math.round(k), C, D], d).rem, 1e-6) };
  },
  "fn-ahl-polynomial-theorems/factorise-solve/equation": (q, T) => {
    const { a, B, D } = q.params, k = Math.round(T.bisect((kk) => T.poly([1, B, kk, D], a), -400, 400)), f = (x) => T.poly([1, B, k, D], x);
    const rs = T.roots(f, -12.03, 12.07, 6000).filter((r) => Math.abs(r - a) > 1e-6);
    T.require(Math.abs(f(a)) < 1e-9 && rs.length === 2, "x - a is a factor and there are two other real roots");
    const quo = synth([1, B, k, D], a).quo;      // the quadratic factor, by synthetic division
    return { a: k, b: quo[1], c: quo[2], d: T.approx(rs[0], 1e-6), e: T.approx(rs[1], 1e-6) };
  },
  "fn-ahl-polynomial-theorems/graph-multiplicity/graph": (q, T) => {
    const { s, p, q: z } = q.params, f = (x) => s * (x - p) * (x - p) * (x - z);
    return { a: whichGraph(q, "a", f, T), b: f(0) };
  },
  "fn-ahl-polynomial-theorems/remainders-and-root/equation": (q, T) => {
    const { c, u, R1, R2 } = q.params;
    // f(1) = R1 and f(u) = R2 are two linear equations in a and b
    const D = 1 * u - u * u, e1 = R1 - 1 - c, e2 = R2 - u * u * u - c, a = (e1 * u - e2) / D, b = (e2 - u * u * e1) / D;
    const f = (x) => T.poly([1, a, b, c], x), rs = T.roots(f, -40.01, 40.03, 16000);
    T.require(rs.length === 1, "exactly one real root");
    const quo = synth([1, a, b, c], rs[0]).quo;
    T.require(quo[1] * quo[1] - 4 * quo[2] < 0, "the other two roots are not real");
    return { a: T.approx(a, 1e-9), b: T.approx(b, 1e-9), c: T.approx(rs[0], 1e-7), d: T.approx(-quo[1], 1e-7) };
  },
  "fn-ahl-polynomial-roots/coefficients-from-sum-product/equation": (q, T) => {
    const { n, a, c1, c2, S, Pr } = q.params, cs = (k, m) => (n === 3 ? [a, k, c1, m] : [a, k, c2, c1, m]);
    const sumOf = (k) => dkRoots(cs(k, 1)).reduce((s, z) => s + z[0], 0);
    const prodOf = (m) => dkRoots(cs(1, m)).reduce((s, z) => cmul(s, z), [1, 0])[0];
    return { a: T.approx(T.bisect((k) => sumOf(k) - S, -80, 80, 60), 1e-4), b: T.approx(T.bisect((m) => prodOf(m) - Pr, -80, 80, 60), 1e-4) };
  },
  "fn-ahl-polynomial-roots/fourth-root/equation": (q, T) => {
    const { cs, p, q: im, r1 } = q.params, f = (x) => T.poly(cs, x), real = T.roots(f, -9.03, 9.07, 6000);
    T.require(real.length === 2 && real.some((r) => Math.abs(r - r1) < 1e-6), "two real roots, one of them the given one");
    const z = [p, im], val = cs.reduce((s, c) => { const t = cmul(s, z); return [t[0] + c, t[1]]; }, [0, 0]);
    T.require(Math.hypot(val[0], val[1]) < 1e-6, "the given complex number is a root");
    const other = real.find((r) => Math.abs(r - r1) > 1e-6);
    return { a: T.approx(2 * p + r1 + other, 1e-6), b: T.approx((p * p + im * im) * r1 * other, 1e-5), c: T.approx(other, 1e-6) };
  },
  // ======================= 2.13 =======================
  "fn-ahl-rational-quadratic/vertical-asymptotes/equation": (q, T) => {
    const { p, q: z, r } = q.params, rs = T.roots((x) => x * x - (p + z) * x + p * z, -12.03, 12.07, 6000);
    T.require(rs.length === 2 && rs.every((x) => Math.abs(x - r) > 1e-6), "two asymptotes, neither cancelled by the numerator");
    return { a: T.approx(rs[0], 1e-6), b: T.approx(rs[1], 1e-6) };
  },
  "fn-ahl-rational-quadratic/oblique-asymptote/equation": (q, T) => {
    const { cs, h } = q.params, f = (x) => T.poly(cs, x) / (x - h), X = 1e6, p = (f(2 * X) - f(X)) / X;
    T.require(Math.abs(T.poly(cs, h)) > 1e-9, "no common factor");
    return { a: T.bisect((x) => x - h, -50, 50), b: T.approx(p, 1e-4), c: T.approx(f(X) - Math.round(p) * X, 1e-3), d: f(0) };
  },
  "fn-ahl-rational-quadratic/linear-over-quadratic-graph/graph": (q, T) => {
    const { k, r, p, q: z } = q.params, f = (x) => (k * (x - r)) / ((x - p) * (x - z));
    T.require(r !== p && r !== z, "no common factor");
    return { a: T.approx(f(1e7), 1e-5), b: whichGraph(q, "b", f, T) };
  },
  "fn-ahl-rational-quadratic/quadratic-over-linear-graph/graph": (q, T) => {
    const { cs, h } = q.params, f = (x) => T.poly(cs, x) / (x - h), X = 1e6;
    T.require(Math.abs(T.poly(cs, h)) > 1e-9, "no common factor");
    const pick = whichGraph(q, "d", f, T), line = q.parts[3].answer.options[pick.index].functions[1].fn;
    T.require(Math.abs(T.evalGraph(line, X) - f(X)) < 1e-3, "the dashed line of the correct graph is the oblique asymptote");
    return { a: T.bisect((x) => x - h, -50, 50), b: T.approx(f(X) - X, 1e-3), c: f(0), d: pick };
  },
  "fn-ahl-rational-quadratic/range-rational/equation": (q, T) => {
    const { a, b, c } = q.params, f = (x) => (x - a) / (x * x + b * x + c);
    T.require(b * b - 4 * c < 0, "the denominator has no real zeros");
    const mx = T.extremum(f, -80, 80, "max", 40000).value, mn = T.extremum(f, -80, 80, "min", 40000).value;
    return { a: T.approx(f(1e8), 1e-6), b: T.approx(mx, 1e-7), c: T.approx(mn, 1e-7), d: T.optionWhere(q, "d", (v) => Math.abs(v[0] - mn) < 1e-6 && Math.abs(v[1] - mx) < 1e-6) };
  },
  // ======================= 2.14 =======================
  "fn-ahl-odd-even/classify/equation": (q, T) => {
    const f = (x) => T.evalGraph(q.params.fn, x), xs = [0.3, 0.9, 1.7, 2.4, 3.1];
    const odd = xs.every((x) => Math.abs(f(-x) + f(x)) < 1e-9), even = xs.every((x) => Math.abs(f(-x) - f(x)) < 1e-9);
    return { a: T.option(odd ? "odd" : even ? "even" : "neither") };
  },
  "fn-ahl-odd-even/symmetry-coefficients/equation": (q, T) => {
    const { even, a1, a2, e, c, d, x0 } = q.params;
    const F = (k, m) => (x) => (even ? a1 * x ** 4 + (k - c) * x ** 3 + a2 * x * x + (m + d) * x + e : a1 * x ** 3 + (k - c) * x * x + a2 * x + (m + d));
    // how far f is from the symmetry, at two values of x; each is linear in k and in m
    const miss = (k, m) => [1, 2].map((x) => F(k, m)(x) - (even ? 1 : -1) * F(k, m)(-x));
    const m0 = miss(0, 0), mk = miss(1, 0), mm = miss(0, 1);
    const A = [[mk[0] - m0[0], mm[0] - m0[0]], [mk[1] - m0[1], mm[1] - m0[1]]], D = A[0][0] * A[1][1] - A[0][1] * A[1][0];
    const k = (-m0[0] * A[1][1] + A[0][1] * m0[1]) / D, m = (-A[0][0] * m0[1] + m0[0] * A[1][0]) / D;
    return { a: T.approx(k, 1e-9), b: T.approx(m, 1e-9), c: T.approx(F(k, m)(x0), 1e-6) };
  },
  "fn-ahl-inverse-restricted/quadratic-inverse/equation": (q, T) => {
    const { b, c, side, v } = q.params, f = (x) => x * x + b * x + c, vx = T.extremum(f, -30, 30, "min", 6000);
    const h = Math.round(vx.x), sols = T.roots((x) => f(x) - v, -30.03, 30.07, 9000).filter((x) => side * (x - h) >= 0);
    T.require(sols.length === 1, "one value in the restricted domain");
    const pick = T.optionWhere(q, "d", ([hh, ss, kk]) => [0.5, 2, 7.3].every((dy) => { const y = vx.value + dy, x = hh + ss * Math.sqrt(y - kk); return isFinite(x) && side * (x - h) >= 0 && Math.abs(f(x) - y) < 1e-9; }));
    return { a: T.approx(vx.x, 1e-6), b: T.approx(sols[0], 1e-6), c: T.approx(vx.value, 1e-6), d: pick };
  },
  "fn-ahl-inverse-restricted/self-inverse/equation": (q, T) => {
    const { a, b, v } = q.params, f = (k) => (x) => (a * x + b) / (x - k);
    const ks = [];
    for (let k = -15; k <= 15; k++) if ([0.37, 1.9, -2.3, 7.1].every((x) => Math.abs(f(k)(f(k)(x)) - x) < 1e-9)) ks.push(k);
    T.require(ks.length === 1 && a * a + b !== 0, "one value of k makes f self-inverse");
    // the inverse value by solving f(x) = v
    return { a: ks[0], b: T.approx(T.roots((x) => f(ks[0])(x) - v, -200.03, 200.07, 40000)[0], 1e-6) };
  },
  // ======================= 2.15 =======================
  "fn-ahl-inequalities/factorised-cubic/equation": (q, T) => {
    const { a, b, c, s, rel } = q.params, f = (x) => s * (x - a) * (x - b) * (x - c);
    return { a: T.optionWhere(q, "a", (iv) => sameSet(iv, (x) => holds(rel, f(x)), -12, 12)) };
  },
  "fn-ahl-inequalities/cubic-vs-line/equation": (q, T) => {
    const { fc, mm, n, rg, rel } = q.params, h = (x) => T.poly(fc, x) - (mm * x + n), rs = T.roots(h, -9.03, 9.07, 6000);
    T.require(rs.length === 3 && rs.some((r) => Math.abs(r - rg) < 1e-6), "three intersections, one of them the given one");
    const others = rs.filter((r) => Math.abs(r - rg) > 1e-6);
    return { a: T.approx(others[0], 1e-6), b: T.approx(others[1], 1e-6), c: T.optionWhere(q, "c", (iv) => sameSet(iv, (x) => holds(rel, h(x)), -12, 12)) };
  },
  "fn-ahl-inequalities/rational-vs-line/equation": (q, T) => {
    const { a, b, c, le } = q.params, h = (x) => (x + a) / (x - b) - (x + c), rs = T.roots(h, -30.013, 30.017, 24000);
    T.require(rs.length === 2 && rs[0] < b && b < rs[1], "two intersections, one on each side of the asymptote");
    return { a: T.approx(rs[0], 1e-7), b: T.approx(rs[1], 1e-7), c: T.optionWhere(q, "c", (iv) => sameSet(iv, (x) => holds(le ? "le" : "ge", h(x)), -14, 14, [b])) };
  },
  // ======================= 2.16 =======================
  "fn-ahl-modulus-graphs/modulus-of-f/graph": (q, T) => {
    const { p, q: z } = q.params.sit, t = q.params.t, f = (x) => Math.abs((x - p) * (x - z));
    T.require(Math.abs(T.evalGraph(q.graph.functions[0].fn, 1.3) - (1.3 - p) * (1.3 - z)) < 1e-9, "the diagram shows f");
    return { a: whichGraph(q, "a", f, T), b: T.roots((x) => f(x) - t, -15.03, 15.07, 12000).length };
  },
  "fn-ahl-modulus-graphs/f-of-modulus/graph": (q, T) => {
    const { p, q: z } = q.params.sit, f = (x) => (Math.abs(x) - p) * (Math.abs(x) - z);
    T.require(Math.abs(T.evalGraph(q.graph.functions[0].fn, 1.3) - (1.3 - p) * (1.3 - z)) < 1e-9, "the diagram shows f");
    return { a: whichGraph(q, "a", f, T), b: T.roots(f, -15.03, 15.07, 12000).length };
  },
  "fn-ahl-modulus-graphs/reciprocal-graph/graph": (q, T) => {
    const { A, p, q: z } = q.params, f = (x) => ((x - p) * (x - z)) / A, g = (x) => 1 / f(x), zs = T.roots(f, -12.03, 12.07, 6000);
    T.require(Math.abs(T.evalGraph(q.graph.functions[0].fn, 1.3) - f(1.3)) < 1e-9 && zs.length === 2, "the diagram shows f, which has two zeros");
    return { a: T.approx(zs[0], 1e-6), b: T.approx(zs[1], 1e-6), c: g(0), d: T.approx(T.extremum(g, zs[0] + 0.05, zs[1] - 0.05, "max", 4000).value, 1e-6), e: whichGraph(q, "e", g, T) };
  },
  "fn-ahl-modulus-equations/linear-equals-constant/equation": (q, T) => {
    const { a, b, k } = q.params, rs = T.roots((x) => Math.abs(a * x + b) - k, -40.03, 40.07, 16000);
    let n = 0;
    for (let x = -200; x <= 200; x++) if (Math.abs(a * x + b) < k) n++;
    T.require(rs.length === 2, "two solutions");
    return { a: T.approx(rs[0], 1e-6), b: T.approx(rs[1], 1e-6), c: n };
  },
  "fn-ahl-modulus-equations/modulus-vs-line/equation": (q, T) => {
    const { a, b, c, d, lt } = q.params, h = (x) => Math.abs(a * x + b) - (c * x + d), rs = T.roots(h, -60.013, 60.017, 48000);
    T.require(rs.length === 2, "two solutions");
    return { a: T.approx(rs[0], 1e-6), b: T.approx(rs[1], 1e-6), c: T.optionWhere(q, "c", (iv) => sameSet(iv, (x) => holds(lt ? "lt" : "gt", h(x)), -70, 70)) };
  },
  "fn-ahl-modulus-equations/modulus-vs-quadratic/equation": (q, T) => {
    const { a, c } = q.params, rs = T.roots((x) => Math.abs(x * x - a) - (x + c), -12.013, 12.017, 48000);
    T.require(rs.length >= 2, "at least two solutions");
    return { a: rs.length, b: T.approx(rs[0], 1e-7), c: T.approx(rs[rs.length - 1], 1e-7) };
  },
};
