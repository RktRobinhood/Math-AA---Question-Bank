// Independent answer verifiers for the Topic 2 generators, keyed by generator id.
// Each takes the made question (and the tools from tools.mjs) and returns the expected answer
// per part label, recomputed by a different route from the generator's own formula:
// root search, numerical optimisation, reading the graph description, brute force.
// T.require(...) states a constraint the question must satisfy.

const graphFn = (q, i = 0) => q.graph.functions[i].fn;
// The option whose first curve agrees with f at every test point.
const whichGraph = (q, label, f, T, xs = [-4.5, -2.5, -1.5, -0.5, 0.5, 1.5, 2.5, 4.5]) =>
  T.optionWhere(q, label, (v, i) => {
    const fn = q.parts.find((p) => p.label === label).answer.options[i].functions[0].fn;
    return xs.every((x) => { const a = T.evalGraph(fn, x), b = f(x); return (!isFinite(a) && !isFinite(b)) || Math.abs(a - b) < 1e-9 || (Math.abs(b) > 50 && Math.abs(a) > 50); });
  });
const quad = (cs, T) => T.roots((x) => T.poly(cs, x), -60, 60, 4801);

const quadFeatures = (q, T) => {
  const s = q.params.sit, f = (x) => s.a * x * x + s.b * x + s.c;
  T.require(Math.abs(f(s.p)) < 1e-9 && Math.abs(f(s.q)) < 1e-9, "p and q are the zeros");
  const ex = T.extremum(f, -20, 20, s.a > 0 ? "min" : "max", 40000);
  T.require(Number.isInteger(s.h), "the axis is an integer");
  return { a: ex.x, b: ex.value };
};
const linePoint = (q) => q.params.sit;
const comp = (s) => ({ f: (x) => s.a * x + s.b, g: (x) => x * x + s.c });

export default {
  "fn-line-from-conditions/gradient-from-two-points/words": (q, T) => {
    const { x1, y1, x2, y2 } = q.params;
    T.require(x1 !== x2, "the line is not vertical");
    // the gradient m for which the line through A also passes through B
    return { a: T.bisect((mm) => y1 + mm * (x2 - x1) - y2, -100, 100) };
  },
  "fn-line-from-conditions/parallel-through-point/equation": (q, T) => {
    const s = linePoint(q);
    T.require(s.mm !== 0, "gradient is not zero");
    const c = T.bisect((cc) => s.mm * s.x0 + cc - s.y0, -200, 200);
    return { a: s.mm, b: c };
  },
  "fn-line-from-conditions/perpendicular-through-point/equation": (q, T) => {
    const s = linePoint(q);
    // direction (1, mm) of L and (1, m) of the new line must have zero dot product
    const mp = T.bisect((x) => 1 + s.mm * x, -10, 10);
    return { a: mp, b: s.y0 - mp * s.x0 };
  },
  "fn-line-from-conditions/perpendicular-bisector/words": (q, T) => {
    const { x1, y1, x2, y2 } = q.params;
    T.require(x1 !== x2 && y1 !== y2, "AB is neither vertical nor horizontal");
    // the bisector is the set of points equidistant from A and B: test two points of y = mx + c
    const mAB = (y2 - y1) / (x2 - x1), mp = -1 / mAB;
    const d2 = (x, y, px, py) => (x - px) ** 2 + (y - py) ** 2;
    const c = T.bisect((cc) => d2(0, cc, x1, y1) - d2(0, cc, x2, y2), -500, 500);
    T.require(Math.abs(d2(1, mp + c, x1, y1) - d2(1, mp + c, x2, y2)) < 1e-6, "a second point of the line is equidistant from A and B");
    return { a: mAB, b: mp, c };
  },
  "fn-line-from-conditions/equation-two-points/graph": (q, T) => {
    const f = (x) => T.evalGraph(graphFn(q), x), [A, B] = q.graph.points;
    T.require(Math.abs(f(A.x) - A.y) < 1e-9 && Math.abs(f(B.x) - B.y) < 1e-9, "marked points are on the line");
    T.require(Number.isInteger(A.y) && Number.isInteger(B.y), "marked points have integer coordinates");
    return { a: (B.y - A.y) / (B.x - A.x), b: f(0) };
  },
  "fn-evaluate-function/value-at-input/equation": (q, T) => {
    const { a, b, c, k } = q.params;
    return { a: T.poly([a, b, c], k) };
  },
  "fn-domain-range/range-restricted/equation": (q, T) => {
    const { a, b, lo, hi, k } = q.params, f = (x) => a * x + b;
    const xk = T.bisect((x) => f(x) - k, lo, hi);
    T.require(xk > lo && xk < hi, "the inverse value lies inside the domain");
    return { a: T.extremum(f, lo, hi, "min").value, b: T.extremum(f, lo, hi, "max").value, c: xk };
  },
  "fn-domain-range/range-quadratic/equation": (q, T) => {
    const { a, h, k, lo, hi } = q.params, f = (x) => a * (x - h) ** 2 + k;
    T.require(lo < h && h < hi, "the vertex is inside the domain");
    // least c for which f is one-to-one on [c, hi]: where f stops decreasing
    const c = T.bisect((x) => T.deriv(f, x), lo - 1, hi + 1);
    return { a: T.extremum(f, lo, hi, "min", 6000).value, b: T.extremum(f, lo, hi, "max", 6000).value, c };
  },
  "fn-ext-match-graph/graph-from-equation/graph": (q, T) => {
    const { a, p, q: r } = q.params, f = (x) => a * (x - p) * (x - r);
    T.require(p !== r, "two different zeros");
    return { a: whichGraph(q, "a", f, T), b: f(0) };
  },
  "fn-graph-table-composite-inverse/mixed-inverse-composite/graph": (q, T) => {
    const f = (x) => T.evalGraph(graphFn(q), x), { a, c } = q.params;
    T.require(Math.abs(f(a)) <= 3, "f(a) is inside the domain");
    const sols = T.roots((x) => f(x) - c, -3, 3, 600);
    T.require(sols.length === 1, "f(x) = c has exactly one solution (f is one-to-one)");
    return { a: f(a), b: f(f(a)), c: sols[0] };
  },
  "fn-gdc-features/turning-point-coordinates/equation": (q, T) => {
    const { A, k } = q.params, f = (x) => A * x * Math.exp(-x / k);
    const ex = T.extremum(f, 0, 60, "max", 60000);
    T.require(Math.abs(T.evalGraph(graphFn(q), 1.3) - f(1.3)) < 1e-9, "the drawn graph is the function in the stem");
    return { a: T.approx(ex.x, 1e-4), b: ex.value };
  },
  "fn-gdc-intersection/intersection-points/equation": (q, T) => {
    const { a, c } = q.params, d = (x) => a * Math.log(x) - (x - c);
    const r = T.roots(d, 1e-6, 200, 40000);
    T.require(r.length === 2, "exactly two intersections");
    return { a: r[0], b: r[1], c: T.extremum(d, r[0], r[1], "max", 20000).value };
  },
  "fn-composite/value-inside-out/equation": (q) => { const s = q.params.sit, { f, g } = comp(s); return { a: f(g(s.k)) }; },
  "fn-composite/expression/equation": (q, T) => {
    const s = q.params.sit, { f, g } = comp(s);
    // the option that agrees with f(g(x)) at several points
    return { a: T.optionWhere(q, "a", (cs) => [-2, -1, 0, 1, 3].every((x) => T.poly(cs, x) === f(g(x)))), b: g(f(s.k)) };
  },
  "fn-composite/compare-orders/equation": (q, T) => {
    const { a, b, c, mm } = q.params, f = (x) => a * x + b, g = (x) => x * x + c;
    // coefficients from values: q = f(g(0)); s = (g(f(1)) - g(f(-1))) / 2
    return { a: f(g(0)), b: (g(f(1)) - g(f(-1))) / 2, c: T.bisect((x) => f(x) - mm, -100, 100) };
  },
  "fn-composite/self-composite/equation": (q, T) => {
    const { p, a, k } = q.params, f = (x) => p * x - a;
    return { a: f(f(0)), b: T.bisect((x) => f(x) - k, -100, 100) };
  },
  "fn-composite/solve-composite/equation": (q, T) => {
    const { a, b, c, target } = q.params, fg = (x) => a * (x * x + c) + b;
    const r = T.roots((x) => fg(x) - target, 0, 50, 5000);
    T.require(r.length === 1, "one solution on the domain x >= 0");
    return { a: fg(0), b: r[0] };
  },
  "fn-quadratic-features/vertex-from-vertex-form/equation": quadFeatures,
  "fn-quadratic-features/vertex-from-factorised/equation": quadFeatures,
  "fn-quadratic-features/vertex-from-general/equation": quadFeatures,
  "fn-quadratic-features/factorised-from-vertex-form/equation": (q, T) => {
    const { a, h, k } = q.params, f = (x) => a * (x - h) ** 2 + k;
    const ex = T.extremum(f, -30, 30, a > 0 ? "min" : "max", 60000), r = T.roots(f, -30, 30, 60000);
    T.require(r.length === 2, "two x-intercepts (discriminant positive)");
    return { a: ex.x, b: ex.value, c: r[1] };
  },
  "fn-quadratic-from-conditions/a-from-roots-and-point/graph": (q, T) => {
    const f = (x) => T.evalGraph(graphFn(q), x), { p, q: r } = q.params;
    T.require(Math.abs(f(p)) < 1e-9 && Math.abs(f(r)) < 1e-9, "marked x-intercepts are zeros of the drawn curve");
    T.require(q.graph.points.every((pt) => Math.abs(f(pt.x) - pt.y) < 1e-9 && Number.isInteger(pt.y)), "marked points are on the curve");
    T.require(f(0) !== 0, "the y-intercept is not at the origin");
    return { a: T.extremum(f, -6, 6, T.deriv2(f, 0) > 0 ? "min" : "max", 24000).x, b: T.deriv2(f, 0) / 2 };
  },
  "fn-ext-quadratic-model/max-value/equation": (q, T) => {
    const { a, h, k } = q.params, H = (t) => -a * (t - h) ** 2 + k;
    const ex = T.extremum(H, 0, 30, "max", 30000);
    T.require(H(0) > 0, "launched from above the ground");
    return { a: ex.value, b: ex.x, c: H(0) };
  },
  "fn-ext-quadratic-model/zero-time/equation": (q, T) => {
    const { b, c } = q.params, h = (t) => -t * t + b * t + c;
    const ex = T.extremum(h, 0, 30, "max", 60000), r = T.roots(h, 0, 30, 30000);
    T.require(r.length === 1 && c > 0, "one positive landing time and a positive starting height");
    return { a: h(0), b: ex.x, c: ex.value, d: r[0] };
  },
  "fn-solve-quadratic/solve-factorisable/equation": (q, T) => {
    const r = quad(q.params.coeffs, T);
    T.require(r.length === 2, "two distinct real roots");
    return { a: r[0], b: r[1] };
  },
  "fn-solve-quadratic/solve-hidden-exponential/equation": (q, T) => {
    const { base, B, C } = q.params;
    const u = T.roots((x) => x * x + B * x + C, 1e-9, 500, 50000), xs = T.roots((x) => base ** (2 * x) + B * base ** x + C, -10, 10, 20000);
    T.require(u.length === 1 && xs.length === 1, "one positive u and one real x");
    T.require(B !== 0, "the middle term is present");
    return { a: u[0], b: xs[0] };
  },
  "fn-discriminant/nature-from-equation/equation": (q, T) => {
    const { a, b, c } = q.params;
    // count the roots directly: vertex value against zero, then a root search
    const vertex = c - (b * b) / (4 * a), n = Math.abs(vertex) < 1e-9 ? 1 : quad([a, b, c], T).length;
    T.require(a !== 0, "it is a quadratic");
    return { a: -4 * a * vertex, b: T.option(n === 2 ? 0 : n === 1 ? 1 : 2) };
  },
  "fn-discriminant/k-interval/equation": (q, T) => {
    const { b } = q.params;
    let best = null;
    for (let c = Math.floor((b * b) / 4) - 6; c <= (b * b) / 4 + 6; c++) if (quad([1, -b, c], T).length === 2 && Math.abs(c - (b * b) / 4) > 1e-9) best = c;
    const r = quad([1, -b, best], T);
    return { a: best, b: r[0], c: r[1] };
  },
  "fn-discriminant/k-for-equal-roots/equation": (q, T) => {
    const { c } = q.params;
    // k values for which the minimum value of x^2 + kx + k + c is zero
    const ks = T.roots((k) => k + c - (k * k) / 4, -60, 60, 24000);
    T.require(ks.length === 2, "two values of k");
    return { a: ks[0], b: ks[1] };
  },
  "fn-quadratic-inequality/solve-against-zero/equation": (q, T) => {
    const { b, c, less } = q.params, f = (x) => x * x + b * x + c;
    const r = quad([1, b, c], T);
    T.require(r.length === 2, "two distinct roots");
    const holds = (x) => (less ? f(x) < 0 : f(x) > 0);
    const xs = T.range(-15, 15, 0.25).filter((x) => Math.abs(f(x)) > 1e-9);
    return { a: (r[1] - r[0]) ** 2, b: T.optionWhere(q, "b", ([kind, lo, hi]) => xs.every((x) => (kind === "in" ? x > lo && x < hi : x < lo || x > hi) === holds(x))) };
  },
  "fn-rational-asymptotes-intercepts/x-intercept/equation": (q, T) => {
    const { a, b, c, d } = q.params, f = (x) => (a * x + b) / (c * x + d);
    T.require(a * d - b * c !== 0, "the function does not reduce to a constant");
    const va = T.bisect((x) => c * x + d, -100, 100), zeros = T.roots(f, -100, 100, 40000);
    T.require(zeros.length === 1, "one x-intercept");
    return { a: va, b: T.approx(f(1e9), 1e-6), c: zeros[0], d: f(0) };
  },
  "fn-rational-asymptotes-intercepts/ha-from-equation/equation": (q, T) => {
    const { a, h, k, y } = q.params, f = (x) => a / (x - h) + k;
    T.require(y !== k, "the target value is not the asymptote");
    const sols = T.roots((x) => f(x) - y, -200, 200, 20000);
    T.require(sols.length === 1, "one solution");
    T.require(Math.abs(f(h + 1e-7)) > 1e5, "vertical asymptote at x = h");
    return { a: h, b: T.approx(f(1e10), 1e-6), c: sols[0] };
  },
  "fn-rational-sketch/sketch-from-equation/graph": (q, T) => {
    const { a, h, k } = q.params, f = (x) => a / (x - h) + k;
    const hit = whichGraph(q, "a", f, T, [-5.3, -3.7, -2.4, -1.6, -0.3, 0.7, 1.4, 2.6, 4.2, 5.1]);
    const g = q.parts[0].answer.options[hit.index];
    T.require(g.asymptotes.some((s) => s.x === h) && g.asymptotes.some((s) => s.y === k), "the correct graph shows the right asymptotes");
    return { a: hit, b: f(0) };
  },
  "fn-exponential-model/predict-value/words": (q, T) => {
    const s = q.params.sit, b = 1 + (s.grow ? 1 : -1) * s.r / 100;
    let v = s.A;
    for (let i = 0; i < s.T; i++) v *= b; // repeated multiplication, year by year
    T.require(b > 0 && b !== 1, "a genuine growth or decay factor");
    return { a: s.A, b: v };
  },
  "fn-exponential-model/time-to-level/words": (q, T) => {
    const s = q.params.sit, b = 1 + (s.grow ? 1 : -1) * s.r / 100, N = (t) => s.A * Math.exp(t * Math.log(b));
    let v = s.A;
    for (let i = 0; i < s.T; i++) v *= b;
    const t = T.bisect((x) => N(x) - s.A * s.factor, 0, 500);
    T.require(t > 0 && (s.grow ? s.factor > 1 : s.factor < 1), "the level is reached at a positive time");
    return { a: v, b: t };
  },
  "fn-log-function-features/x-intercept/equation": (q, T) => {
    const { b, h, k, xv } = q.params, f = (x) => Math.log(x - h) / Math.log(b) + k;
    const zeros = T.roots(f, h + 1e-6, h + 100, 20000);
    T.require(zeros.length === 1 && xv > h, "one zero, and the input is in the domain");
    T.require(f(h + 1e-12) < -20, "the graph falls away at the asymptote x = h");
    return { a: h, b: f(xv), c: zeros[0] };
  },
  "fn-log-function-features/pick-graph/graph": (q, T) => {
    const { a, h, b } = q.params, f = (x) => (x > h ? (a * Math.log(x - h)) / Math.log(b) : NaN);
    return { a: whichGraph(q, "a", f, T, [-5.5, -4.5, -3.5, -2.5, -1.5, -0.5, 0.5, 1.5, 2.5, 3.5, 4.5, 5.5]), b: h };
  },
  "fn-exp-log-inverse-composite/evaluate-inverse/equation": (q, T) => {
    const { b, h, k, x1, target } = q.params, f = (x) => b ** (x - h) + k;
    T.require(target > k, "the target is in the range");
    return { a: f(x1), b: T.approx(f(-60), 1e-6), c: T.bisect((x) => f(x) - target, -50, 50) };
  },
  "fn-gdc-solve-equation/solve-mixed-equation/equation": (q, T) => {
    const { mm, c } = q.params, r = T.roots((x) => Math.exp(x) - mm * x - c, -30, 12, 42000);
    T.require(r.length === 2 && r[0] < 0 && r[1] > 0, "one negative and one positive solution");
    return { a: r[0], b: r[1] };
  },
  "fn-curve-intersection-quadratic/meeting-points/equation": (q, T) => {
    const { b, c, mm, d } = q.params, curve = (x) => x * x + b * x + c, line = (x) => mm * x + d;
    const r = T.roots((x) => curve(x) - line(x), -40, 40, 16000);
    T.require(r.length === 2, "two intersections");
    return { a: r[0], b: r[1], c: curve(Math.round(r[1])) };
  },
  "fn-transform-apply/image-point/words": (q, T) => {
    const s = q.params.sit;
    // take a concrete f through A and follow the point: f(x) = q + (x - p)^3
    const f = (x) => s.q + (x - s.p) ** 3, g = (x) => s.a * f(x - s.h) + s.k;
    const xB = T.bisect((x) => f(x - s.h) - s.q, -50, 50);
    return { a: xB, b: g(xB) };
  },
  "fn-transform-apply/rule-from-moves/words": (q, T) => {
    const s = q.params.sit, A = Math.abs(s.a) === 1 ? 2 : Math.abs(s.a);
    const f = (x) => s.q + (x - s.p) ** 3 + 2 * (x - s.p);
    // stretch then translate, point by point: (x, y) -> (x + h, A y + k)
    const image = (x) => [x + s.h, A * f(x) + s.k];
    const hit = T.optionWhere(q, "a", ([a, h, k]) => [-2, 0, 1, 3].every((x) => { const [X, Y] = image(x); return Math.abs(a * f(X - h) + k - Y) < 1e-9; }));
    return { a: hit, b: image(s.p)[1] };
  },
  "fn-transform-apply/sketch-stretch-shift/graph": (q, T) => {
    const { h, k, pts, i } = q.params, f = (x) => T.evalGraph(graphFn(q), x);
    T.require(pts.every(([x, y]) => f(x) === y), "the listed points are on the drawn graph of f");
    const g = (x) => f(x - h) + k;
    return { a: whichGraph(q, "a", g, T, [-6.5, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6.5]), b: pts[i][0] + h, c: g(pts[i][0] + h) };
  },
  "fn-transform-describe/stretch-and-shift-parameters/equation": (q, T) => {
    const { a, b, c } = q.params, g = (x) => a * x * x + b * x + c;
    const ex = T.extremum(g, -30, 30, a > 0 ? "min" : "max", 60000);
    T.require(a !== 1, "there is a stretch");
    return { a: T.deriv2(g, 0) / 2, b: ex.x, c: ex.value };
  },
  "fn-pre-factorise/monic-trinomial/equation": (q, T) => {
    const { b, c } = q.params, r = quad([1, b, c], T);
    T.require(r.length === 2, "two different factors");
    // (x + p)(x + q) has zeros -p and -q; p < q
    return { a: -r[1], b: -r[0] };
  },
  "fn-pre-expand/double-bracket/equation": (q) => {
    const { u, v } = q.params, f = (x) => (x + u) * (x + v);
    return { a: (f(1) - f(-1)) / 2, b: f(0) };
  },
  "fn-pre-linear-equations/two-step/equation": (q, T) => {
    const { a, b, c } = q.params;
    return { a: T.bisect((x) => a * x + b - c, -100, 100) };
  },
  "fn-pre-substitute/negative-into-square/equation": (q, T) => { const { a, b, n } = q.params; return { a: T.poly([a, b, 0], -n) }; },
  "fn-pre-algebraic-fractions/excluded-value/equation": (q, T) => { const { c, d } = q.params; return { a: T.bisect((x) => c * x + d, -100, 100) }; },
  "fn-pre-graph-reading/round-3sf/equation": (q, T) => {
    const { x } = q.params;
    // search the three-figure numbers for the nearest one
    const e = Math.floor(Math.log10(x)), step = 10 ** (e - 2);
    let best = 0;
    for (let n = 100; n <= 1000; n++) if (Math.abs(n * step - x) < Math.abs(best - x)) best = n * step;
    T.require(Math.abs(x - best) < step / 2 - 1e-9 * x, "rounding is unambiguous");
    return { a: best };
  },
  "fn-pre-percent-multiplier/increase-multiplier/equation": (q) => {
    const { up, r } = q.params;
    return { a: (100 + (up ? r : -r)) / 100 };
  },

  // ---- depth: recall, Paper 1 and Paper 2 levels, further exam types ----
  "fn-line-from-conditions/triangle-area/equation": (q, T) => {
    const { m1, c1, m2, c2 } = q.params, L1 = (x) => m1 * x + c1, L2 = (x) => m2 * x + c2;
    const xA = T.bisect((x) => L1(x) - L2(x), -100, 100), a1 = T.bisect(L1, -100, 100), a2 = T.bisect(L2, -100, 100);
    T.require(a1 < xA && xA < a2 && L1(xA) > 0, "A is above the x-axis, between the two x-intercepts");
    const [s1, s2] = q.graph.regions;
    T.require(T.close(s1.x[0], a1) && T.close(s1.x[1], xA) && T.close(s2.x[1], a2), "the shaded region is the triangle");
    // shoelace formula on the vertices (a1, 0), (a2, 0), (xA, yA)
    const V = [[a1, 0], [a2, 0], [xA, L1(xA)]];
    const area = Math.abs(V.reduce((s, [x, y], i) => s + x * V[(i + 1) % 3][1] - V[(i + 1) % 3][0] * y, 0)) / 2;
    return { a: xA, b: L2(xA), c: area };
  },
  "fn-evaluate-function/time-for-target/words": (q, T) => {
    const { A, B, L, t0 } = q.params, C = (t) => (A * t) / (t * t + B);
    const r = T.roots((t) => C(t) - L, 1e-6, 80, 80000);
    T.require(r.length === 2, "the level is reached exactly twice");
    T.require(Math.abs(T.evalGraph(graphFn(q), 1.7) - C(1.7)) < 1e-9 && T.evalGraph(graphFn(q, 1), 3) === L, "the graph shows the model and the level");
    return { a: C(t0), b: r[0], c: r[1], d: r[1] - r[0] };
  },
  "fn-inverse-reflection/image-point/words": (q, T) => {
    const { a, b } = q.params, f = (x) => b + 2 * (x - a); // a concrete one-to-one f through the point
    T.require(a !== b, "the point is not on the mirror line");
    const t = (a + b) / 2; // foot of the perpendicular from (a, b) to y = x is (t, t)
    return { a: 2 * t - a, b: T.bisect((x) => f(x) - b, -100, 100) };
  },
  "fn-inverse-reflection/sketch-inverse/graph": (q, T) => {
    const { pts, c } = q.params, f = (x) => T.evalGraph(graphFn(q), x), ys = pts.map((p) => p[1]);
    T.require(ys.every((y, i) => i === 0 || y > ys[i - 1]), "f is increasing, so it has an inverse");
    // the inverse g has domain = range of f and satisfies f(g(y)) = y
    const hit = T.optionWhere(q, "a", (v, i) => {
      const g = q.parts[0].answer.options[i].functions[0].fn;
      return T.range(-5.5, 5.5, 0.5).every((y) => { const x = T.evalGraph(g, y); return y < ys[0] - 1e-9 || y > ys[ys.length - 1] + 1e-9 ? !isFinite(x) : isFinite(x) && Math.abs(f(x) - y) < 1e-9; });
    });
    const sol = T.roots((x) => f(x) - c, -4, 4, 800);
    T.require(sol.length === 1, "one input gives the value");
    return { a: hit, b: sol[0] };
  },
  "fn-graph-table-composite-inverse/read-value/graph": (q, T) => {
    const f = (x) => T.evalGraph(graphFn(q), x), { a, c } = q.params;
    const sol = T.roots((x) => f(x) - c, -3, 3, 600);
    T.require(sol.length === 1, "f(x) = c has exactly one solution");
    return { a: f(a), b: sol[0] };
  },
  "fn-sketch-gdc/sketch-on-domain/equation": (q, T) => {
    const { c, d } = q.params.sit, f = (x) => 0.2 * x ** 3 - c * x + d;
    const hit = whichGraph(q, "a", f, T, [-3.9, -3, -2.2, -1.1, -0.4, 0.6, 1.3, 2.1, 3.2, 3.9]);
    T.require(q.parts[0].answer.options.every((o) => o.functions[0].domain[0] === -4 && o.functions[0].domain[1] === 4), "every option is drawn on the stated domain");
    const ex = T.extremum(f, -4, 0, "max", 40000);
    T.require(ex.x > -3.9 && ex.x < -0.1, "the local maximum is inside the domain");
    return { a: hit, b: T.approx(ex.x, 1e-5), c: ex.value, d: T.extremum(f, -4, 4, "max", 80000).value };
  },
  "fn-sketch-gdc/label-zeros/equation": (q, T) => {
    const { c, d } = q.params.sit, f = (x) => 0.2 * x ** 3 - c * x + d;
    const r = T.roots(f, -4, 4, 16000);
    T.require(r.length === 3, "three zeros on the domain");
    T.require([-3, 0.5, 2.5].every((x) => Math.abs(T.evalGraph(graphFn(q), x) - f(x)) < 1e-9), "the drawn graph is f");
    return { a: f(0), b: r[0], c: r[2] };
  },
  "fn-rational-asymptotes-intercepts/features-from-graph/graph": (q, T) => {
    const f = (x) => T.evalGraph(graphFn(q), x);
    const poles = T.range(-5, 5).filter((x) => !(Math.abs(f(x + 1e-7)) < 1e5));
    T.require(poles.length === 1, "one vertical asymptote at an integer");
    const far = f(1e9);
    T.require(q.graph.asymptotes.some((s) => s.x === poles[0]) && q.graph.asymptotes.some((s) => s.y !== undefined && Math.abs(s.y - far) < 1e-6), "both asymptotes are drawn");
    return { a: poles[0], b: T.approx(far, 1e-6) };
  },
  "fn-ext-match-graph/equation-from-graph/graph": (q, T) => {
    const f = (x) => T.evalGraph(graphFn(q), x);
    const z = T.roots(f, -6, 6, 2400);
    T.require(z.length === 3, "three distinct zeros");
    T.require(q.graph.points.every((pt) => Math.abs(f(pt.x) - pt.y) < 1e-9 && Number.isInteger(pt.y)) && f(0) !== 0, "marked points are on the curve, with integer coordinates");
    // leading coefficient from a third finite difference
    return { a: z[0], b: z[1], c: z[2], d: (f(3) - 3 * f(2) + 3 * f(1) - f(0)) / 6 };
  },
  "fn-inverse-algebraic/inverse-linear/equation": (q, T) => {
    const { a, b } = q.params, f = (x) => a * x + b;
    return { a: T.optionWhere(q, "a", (v) => Array.isArray(v) && [-3, 0, 2, 7].every((y) => Math.abs(f((v[0] * y + v[1]) / v[2]) - y) < 1e-9)) };
  },
  "fn-inverse-algebraic/inverse-rational/equation": (q, T) => {
    const { a, b, c, mv } = q.params, f = (x) => (a * x + b) / (x - c);
    T.require(a * c + b !== 0 && a !== c, "f is not constant and is not its own inverse");
    const hit = T.optionWhere(q, "a", (v) => Array.isArray(v) && [-7.3, -2.6, 0.4, 3.7, 9.1].every((y) => Math.abs(f((v[0] * y + v[1]) / (y + v[2])) - y) < 1e-9));
    const sol = T.roots((x) => f(x) - mv, -300, 300, 120000);
    T.require(sol.length === 1, "one input gives the value");
    return { a: hit, b: T.approx(f(1e10), 1e-6), c: sol[0] };
  },
  "fn-composite/build-from-words/words": (q, T) => {
    const { p, q: q0, t0, R, S } = q.params, r = (t) => p * Math.sqrt(t) + q0;
    // area of a disc as an integral of ring circumferences
    const area = (t) => T.integrate((u) => 2 * Math.PI * u, 0, r(t), 400);
    return { a: area(t0), b: T.bisect((t) => r(t) - R, 0, 500), c: T.bisect((t) => area(t) - S, 0, 500) };
  },
  "fn-ext-quadratic-model/second-time-at-height/words": (q, T) => {
    const { v, h0, H } = q.params, h = (t) => -4.9 * t * t + v * t + h0;
    const ex = T.extremum(h, 0, 10, "max", 40000), land = T.roots(h, 0.01, 12, 24000), at = T.roots((t) => h(t) - H, 0, 12, 24000);
    T.require(land.length === 1 && at.length === 2 && H < ex.value && H > h0, "one landing time, and the height is passed twice");
    return { a: ex.value, b: land[0], c: at[1] - at[0] };
  },
  "fn-solve-quadratic/solve-in-context/words": (q, T) => {
    const { d, A } = q.params, r = T.roots((w) => w * (w + d) - A, -200, 200, 80000);
    T.require(r.length === 2 && r[0] < 0 && r[1] > 0, "one positive width");
    const [, len, wid] = q.graph.shapes[0].points;
    T.require(T.close(len[0], r[1] + d) && T.close(wid[1], r[1]), "the diagram is to scale");
    return { a: (r[1] - r[0]) ** 2, b: r[1], c: Math.hypot(r[1], r[1] + d) };
  },
  "fn-quadratic-inequality/largest-integer/equation": (q, T) => {
    const { b, c } = q.params, f = (x) => x * x - b * x + c, r = quad([1, -b, c], T);
    T.require(r.length === 2 && !Number.isInteger(r[0]) && !Number.isInteger(r[1]), "two roots that are not integers");
    const ints = T.range(-100, 100).filter((x) => f(x) < 0);
    T.require(ints.length >= 1 && T.close(q.graph.regions[0].x[0], r[0]) && T.close(q.graph.regions[0].x[1], r[1]), "the shaded region runs between the roots");
    return { a: r[0], b: r[1], c: ints.length, d: Math.max(...ints) };
  },
  "fn-rational-asymptotes-intercepts/va-from-equation/equation": (q, T) => {
    const { a, h, k } = q.params, f = (x) => a / (x - h) + k;
    const poles = T.range(-10, 10).filter((x) => !(Math.abs(f(x + 1e-7)) < 1e5));
    T.require(poles.length === 1, "one vertical asymptote");
    return { a: poles[0], b: T.approx(f(1e10), 1e-6) };
  },
  "fn-ext-rational-model/least-n-for-target/words": (q, T) => {
    const { v, F, n0, T: target } = q.params, C = (n) => v + F / n;
    let n = 1;
    while (!(C(n) < target)) n++; // brute force
    T.require(n > 1 && Math.abs(F / (target - v) - Math.round(F / (target - v))) > 1e-6, "the boundary is not a whole number");
    return { a: C(n0), b: T.approx(C(1e12), 1e-6), c: n };
  },
  "fn-exp-log-inverse-composite/evaluate-log-function/equation": (q, T) => {
    const { b, x, mm } = q.params;
    let v = 1;
    for (let i = 0; i < mm; i++) v *= b;
    return { a: T.bisect((y) => b ** y - x, 0, 30), b: v };
  },
  "fn-curve-intersection-quadratic/meeting-x/graph": (q, T) => {
    const f = (x) => T.evalGraph(graphFn(q), x), g = (x) => T.evalGraph(graphFn(q, 1), x);
    const r = T.roots((x) => f(x) - g(x), -20, 20, 8000);
    T.require(r.length === 2, "the graphs cross twice");
    T.require(q.graph.points.every((pt) => Math.abs(f(pt.x) - pt.y) < 1e-9 && Math.abs(g(pt.x) - pt.y) < 1e-9 && Number.isInteger(pt.y) && Math.abs(pt.y) <= 8 && Math.abs(pt.x) <= 6), "the marked points are the crossings, inside the window");
    return { a: r[0], b: r[1] };
  },
  "fn-gdc-optimise-combined/first-whole-day/words": (q, T) => {
    const { a, b, c, d } = q.params, A = (t) => a * b ** t, B = (t) => c + d * t;
    const r = T.roots((t) => A(t) - B(t), 0.001, 400, 80000);
    T.require(r.length === 1 && A(0) < B(0), "B starts ahead and A overtakes once");
    let n = 1;
    while (!(A(n) > B(n))) n++;
    T.require([1.5, 7].every((t) => Math.abs(T.evalGraph(graphFn(q), t) - A(t)) < 1e-9 && Math.abs(T.evalGraph(graphFn(q, 1), t) - B(t)) < 1e-9), "the graph shows the two models");
    return { a: r[0], b: n, c: T.extremum((t) => B(t) - A(t), 0, r[0], "max", 40000).value };
  },
  "fn-transform-describe/describe-translation/equation": (q, T) => {
    const { h, k } = q.params, f = (x) => x * x, g = (x) => f(x - h) + k;
    // the vertex (0, 0) of f moves to the vertex of g
    const ex = T.extremum(g, -30, 30, "min", 60000);
    return { a: T.approx(ex.x, 1e-5), b: T.approx(ex.value, 1e-6) };
  },
  "fn-transform-apply/image-point/equation": (q, T) => {
    const { a, s, h, k } = q.params, f = (x) => x ** 3 - a * x, g = (x) => s * f(x - h) + k;
    const A = T.extremum(f, -6, 0, "max", 60000), B = T.extremum(g, -6 + h, h, "max", 60000);
    T.require(s > 0, "the stretch keeps a maximum a maximum");
    return { a: T.approx(A.x, 1e-5), b: A.value, c: T.approx(B.x, 1e-5), d: B.value };
  },
};
