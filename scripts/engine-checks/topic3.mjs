// Independent answer verifiers for the Topic 3 generators, keyed by generator id.
// Triangles are rebuilt from coordinates; trig equations are solved by root search; exact values
// are checked against Math.sin/cos/tan of the angle itself.

// Triangle with A at the origin, AB along the x-axis (length c) and AC of length b at angle A (degrees).
function triangle(c, b, Adeg, T) {
  const A = [0, 0], B = [c, 0], C = [b * Math.cos(T.rad(Adeg)), b * Math.sin(T.rad(Adeg))];
  const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  // shoelace area
  const area = Math.abs(A[0] * (B[1] - C[1]) + B[0] * (C[1] - A[1]) + C[0] * (A[1] - B[1])) / 2;
  return { a: dist(B, C), area };
}
const trig = { sin: Math.sin, cos: Math.cos, tan: Math.tan };
// theta, in degrees, read back from the stem's multiple of pi (the generator's own table is not used)
const TWO_PI = 2 * Math.PI;

export default {
  "t3-distance-midpoint/distance-two-points/words": (q, T) => {
    const { A, B } = q.params;
    // the midpoint is the point M with AM = MB that lies on the segment: test each option
    const d = (p, r) => Math.hypot(p[0] - r[0], p[1] - r[1], p[2] - r[2]);
    const hit = T.optionWhere(q, "a", (v) => Math.abs(d(v, A) - d(v, B)) < 1e-9 && Math.abs(d(v, A) + d(v, B) - d(A, B)) < 1e-9);
    T.require(Math.abs(d(A, B) - Math.round(d(A, B))) < 1e-9, "the length is a whole number");
    return { a: hit, b: d(A, B) };
  },
  "t3-sine-cosine-rule/side-cosine-rule/equation": (q, T) => {
    const { a, b, A } = q.params, t = triangle(b, a, A, T);
    T.require(A > 0 && A < 180, "a possible angle");
    return { a: t.a, b: t.area };
  },
  "t3-sine-cosine-rule/angle-sine-rule/equation": (q, T) => {
    const { A, a, b } = q.params;
    T.require(b < a, "the angle opposite the shorter side is acute, so there is one triangle");
    // slide C along the ray from A until BC has the right length: AB = c unknown, AC = b
    const c = T.bisect((x) => triangle(x, b, A, T).a - a, b * Math.cos(T.rad(A)), 100);
    // angle at B from the dot product
    const B = [c, 0], C = [b * Math.cos(T.rad(A)), b * Math.sin(T.rad(A))];
    const angB = T.deg(Math.acos(((0 - B[0]) * (C[0] - B[0]) + (0 - B[1]) * (C[1] - B[1])) / (c * a)));
    return { a: angB, b: c };
  },
  "t3-triangle-area/area-from-two-sides/equation": (q, T) => {
    const { a, b, C } = q.params, t = triangle(a, b, C, T);
    return { a: t.area, b: t.a };
  },
  "t3-sine-cosine-rule/side-cosine-rule/words": (q, T) => {
    const { AB, AC, A } = q.params;
    return { a: T.optionWhere(q, "a", (v, i, text) => /between them/.test(text)), b: triangle(AB, AC, A, T).a };
  },
  "t3-ambiguous-case/both-angles/equation": (q, T) => {
    const { A, a, b } = q.params;
    // both positions of B on the ray: AB = c with BC = a has two solutions
    const f = (x) => triangle(x, b, A, T).a - a;
    const cs = T.roots(f, 1e-6, 60, 60000);
    T.require(cs.length === 2, "two possible triangles");
    const angB = (c) => { const B = [c, 0], C = [b * Math.cos(T.rad(A)), b * Math.sin(T.rad(A))]; return T.deg(Math.acos(((0 - B[0]) * (C[0] - B[0]) + (0 - B[1]) * (C[1] - B[1])) / (c * a))); };
    const angles = cs.map(angB).sort((x, y) => x - y);
    T.require(angles[0] < 90 && angles[1] > 90, "one acute and one obtuse angle");
    return { a: T.approx(angles[0], 1e-4), b: T.approx(angles[1], 1e-4) };
  },
  "t3-arc-sector/sector-area/equation": (q, T) => {
    const { r, th } = q.params;
    T.require(th > 0 && th < TWO_PI, "an angle less than a full turn");
    // fraction of the full circle
    return { a: (th / TWO_PI) * TWO_PI * r, b: T.integrate((x) => x * th, 0, r) };
  },
  "t3-exact-values/related-value/equation": (q, T) => {
    const th = T.rad(q.params.dg), quadrant = Math.cos(th) > 0 ? (Math.sin(th) > 0 ? 1 : 4) : Math.sin(th) > 0 ? 2 : 3;
    T.require(Math.abs(Math.cos(th)) > 1e-9 && Math.abs(Math.sin(th)) > 1e-9, "the angle is not on an axis");
    return { a: T.option(quadrant), b: Math.sin(th), c: Math.cos(th), d: Math.tan(th) };
  },
  "t3-identity-values/sin2-from-ratio/equation": (q, T) => {
    const { opp, hyp, useSin } = q.params, th = useSin ? Math.asin(opp / hyp) : Math.acos(opp / hyp);
    T.require(th > 0 && th < Math.PI / 2, "theta is acute");
    return { a: useSin ? Math.cos(th) : Math.sin(th), b: Math.sin(2 * th) };
  },
  "t3-prove-identity/expand-square/equation": (q, T) => {
    const k = q.params.key;
    const sides = { plus: [(t) => (Math.sin(t) + Math.cos(t)) ** 2, (t) => 1 + Math.sin(2 * t)], minus: [(t) => (Math.sin(t) - Math.cos(t)) ** 2, (t) => 1 - Math.sin(2 * t)],
      fourth: [(t) => Math.cos(t) ** 4 - Math.sin(t) ** 4, (t) => Math.cos(2 * t)], "one-minus": [(t) => (1 - Math.cos(2 * t)) / 2, (t) => Math.sin(t) ** 2] }[k];
    T.require(T.range(-3, 3, 0.37).every((t) => Math.abs(sides[0](t) - sides[1](t)) < 1e-12), "the identity is true");
    return {};
  },
  "t3-trig-read-features/amp-period/equation": (q, T) => {
    const { a, b, d, fn } = q.params, f = (x) => a * trig[fn](b * x) + d;
    const max = T.extremum(f, 0, 7, "max", 70000).value, min = T.extremum(f, 0, 7, "min", 70000).value;
    // period: the smallest shift p > 0 that leaves f unchanged at many points
    const same = (p) => [0.1, 0.7, 1.3, 2.9].every((x) => Math.abs(f(x + p) - f(x)) < 1e-7);
    let period = null;
    for (let k = 1; k <= 24 && period === null; k++) if (same((Math.PI * k) / 12)) period = (Math.PI * k) / 12;
    return { a: (max - min) / 2, b: period, c: max, d: min };
  },
  "t3-trig-model-use/first-max-time/words": (q, T) => {
    const { A, b, d } = q.params, h = (t) => A * Math.sin(b * t) + d;
    const max = T.extremum(h, 0, 7, "max", 70000).value, min = T.extremum(h, 0, 7, "min", 70000).value;
    const same = (p) => [0.1, 0.7, 1.3, 2.9].every((x) => Math.abs(h(x + p) - h(x)) < 1e-7);
    let period = null;
    for (let k = 1; k <= 24 && period === null; k++) if (same((Math.PI * k) / 12)) period = (Math.PI * k) / 12;
    T.require(min > 0, "the depth stays positive");
    // first time the model reaches its greatest value
    const first = T.roots((t) => T.deriv(h, t), 1e-6, period, 20000)[0];
    return { a: (max - min) / 2, b: period, c: max, d: min, e: T.approx(first, 1e-6) };
  },
  "t3-trig-equation/basic-exact/equation": (q, T) => {
    const { fn, target } = q.params, f = (x) => trig[fn](x) - target;
    const r = T.roots(f, 0, TWO_PI, 62832);
    T.require(r.length === 2, "two solutions in the interval");
    return { a: r[0], b: r[1] };
  },
  "t3-trig-quadratic/all-solutions/equation": (q, T) => {
    const { fn, cs } = q.params, us = T.roots((u) => T.poly(cs, u), -3, 3, 6001);
    T.require(us.length === 2 && us.every((u) => Math.abs(u) <= 1), "two usable values of the ratio");
    // solutions of the whole equation: scan a fine grid for zeros (some are double roots, so no sign change)
    const g = (x) => T.poly(cs, trig[fn](x));
    const sols = [];
    for (let k = 0; k <= 720; k++) { const x = (TWO_PI * k) / 720; if (Math.abs(g(x)) < 1e-9) sols.push(x); }
    for (let k = 0; k < 7200; k++) { const x0 = (TWO_PI * k) / 7200, x1 = (TWO_PI * (k + 1)) / 7200; if (g(x0) * g(x1) < -1e-18) T.require(sols.some((s) => Math.abs(s - (x0 + x1) / 2) < 0.01), "every solution is a multiple of a quarter degree"); }
    return { a: us[0], b: us[1], c: sols.length, d: sols[sols.length - 1] };
  },
};
