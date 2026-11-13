// Numerical tools for the independent answer verifiers in scripts/engine-checks/topicN.mjs.
// Nothing here shares code with the generators: answers are recomputed by search, bisection,
// numerical calculus and simulation.

export class VerifyError extends Error {}

export function makeTools(E) {
  let asserts = 0;
  const T = {
    get asserts() { return asserts; },
    // A constraint the question must satisfy (a discriminant's sign, a probability in [0, 1], ...).
    require(cond, what) { asserts++; if (!cond) throw new VerifyError("constraint broken: " + what); },
    close: (a, b, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b)),
    gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; },
    range: (lo, hi, step = 1) => { const out = []; for (let v = lo; v <= hi + 1e-12; v += step) out.push(v); return out; },
    sum: (arr, f = (x) => x) => arr.reduce((s, x, i) => s + f(x, i), 0),
    // polynomial with the highest power first
    poly: (coeffs, x) => coeffs.reduce((s, c) => s * x + c, 0),
    bisect(f, lo, hi, iters = 200) {
      let flo = f(lo);
      for (let i = 0; i < iters; i++) {
        const mid = (lo + hi) / 2, fm = f(mid);
        if (fm === 0) return mid;
        if ((flo < 0) === (fm < 0)) { lo = mid; flo = fm; } else hi = mid;
      }
      return (lo + hi) / 2;
    },
    // All sign-change roots of f on [lo, hi], found on a fine grid and refined by bisection.
    roots(f, lo, hi, n = 4000) {
      const out = [];
      let px = lo, pf = f(lo);
      if (Math.abs(pf) < 1e-12) out.push(lo);
      for (let i = 1; i <= n; i++) {
        const x = lo + ((hi - lo) * i) / n, fx = f(x);
        if (Math.abs(fx) < 1e-12) { if (!out.length || Math.abs(out[out.length - 1] - x) > 1e-9) out.push(x); }
        else if (isFinite(pf) && isFinite(fx) && Math.abs(pf) >= 1e-12 && (pf < 0) !== (fx < 0)) {
          const r = T.bisect(f, px, x);
          if (Math.abs(f(r)) < 1e-6) out.push(r); // a sign change across an asymptote is not a root
        }
        px = x; pf = fx;
      }
      return out;
    },
    deriv: (f, x, h = 1e-5) => (f(x - 2 * h) - 8 * f(x - h) + 8 * f(x + h) - f(x + 2 * h)) / (12 * h),
    deriv2: (f, x, h = 1e-3) => (-f(x - 2 * h) + 16 * f(x - h) - 30 * f(x) + 16 * f(x + h) - f(x + 2 * h)) / (12 * h * h),
    // Simpson's rule
    integrate(f, a, b, n = 2000) {
      const h = (b - a) / n;
      let s = f(a) + f(b);
      for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
      return (s * h) / 3;
    },
    // Largest (or smallest) value of f on [lo, hi]: grid search, then golden-section refinement.
    extremum(f, lo, hi, kind = "max", n = 2000) {
      const s = kind === "max" ? 1 : -1;
      let bx = lo, bv = -Infinity;
      for (let i = 0; i <= n; i++) { const x = lo + ((hi - lo) * i) / n, v = s * f(x); if (v > bv) { bv = v; bx = x; } }
      let a = Math.max(lo, bx - (hi - lo) / n), b = Math.min(hi, bx + (hi - lo) / n);
      const g = (Math.sqrt(5) - 1) / 2;
      for (let i = 0; i < 100; i++) {
        const c = b - g * (b - a), d2 = a + g * (b - a);
        if (s * f(c) > s * f(d2)) b = d2; else a = c;
      }
      const x = (a + b) / 2;
      return { x, value: f(x) };
    },
    nCr(n, r) {
      // Pascal's triangle
      let row = [1];
      for (let i = 0; i < n; i++) row = [1, ...row.slice(1).map((v, j) => v + row[j]), 1];
      return row[r];
    },
    binomPmf(n, p, k) { return T.nCr(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k); },
    normalPdf: (z) => Math.exp((-z * z) / 2) / Math.sqrt(2 * Math.PI),
    // P(Z < z) by numerical integration of the density
    normalCdf(z) { return z < -9 ? 0 : z > 9 ? 1 : 0.5 + T.integrate(T.normalPdf, 0, z, 4000); },
    invNorm(p) { return T.bisect((z) => T.normalCdf(z) - p, -9, 9, 80); },
    // A small independent random source for simulations (mulberry32).
    random(seed) {
      let a = seed >>> 0;
      return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    },
    mean: (xs) => xs.reduce((s, x) => s + x, 0) / xs.length,
    median(xs) { const s = xs.slice().sort((a, b) => a - b), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; },
    // Quartiles the way the IB's calculators do it: medians of the lower and upper halves.
    quartiles(xs) { const s = xs.slice().sort((a, b) => a - b), h = Math.floor(s.length / 2); return [T.median(s.slice(0, h)), T.median(s.slice(s.length - h))]; },
    evalGraph: (fn, x) => E.graph.evaluate(fn, x),
    deg: (r) => (r * 180) / Math.PI,
    rad: (d2) => (d2 * Math.PI) / 180,
    // Expected-answer forms a verifier may return besides a plain number:
    approx: (value, tol) => ({ value, tol }),            // a number with its own tolerance (simulations)
    index: (i) => ({ index: i }),                         // the option at this position is right
    option: (value) => ({ optionValue: value }),          // the option whose `values` entry equals this
    // The one option whose value passes the test.
    optionWhere(q, label, test) {
      const a = q.parts.find((p) => p.label === label).answer;
      const hits = a.values.map((v, i) => (test(v, i, a.options[i]) ? i : -1)).filter((i) => i >= 0);
      if (hits.length !== 1) throw new VerifyError(`part ${label}: ${hits.length} options pass the independent test`);
      return { index: hits[0] };
    },
  };
  return T;
}
