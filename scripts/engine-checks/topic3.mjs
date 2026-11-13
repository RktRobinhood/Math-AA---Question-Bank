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

// ---- helpers for the second set ----
const dist = (p, q) => Math.hypot(...p.map((v, i) => v - q[i]));
// Angle at V between the directions to P1 and P2, in degrees, from the dot product.
function angleAt(V, P1, P2, T) {
  const u = P1.map((v, i) => v - V[i]), w = P2.map((v, i) => v - V[i]);
  return T.deg(Math.acos(Math.max(-1, Math.min(1, u.reduce((s, v, i) => s + v * w[i], 0) / (Math.hypot(...u) * Math.hypot(...w))))));
}
// Period of a wave: turning points are half a period apart.
function periodOf(f, lo, hi, T) {
  const r = T.roots((x) => T.deriv(f, x), lo, hi, 20000);
  return 2 * (r[1] - r[0]);
}
// A journey A to B to C on two bearings, drawn on a map with north up.
function legs(t1, t2, d1, d2, T) {
  const step = (p, brg, d) => [p[0] + d * Math.sin(T.rad(brg)), p[1] + d * Math.cos(T.rad(brg))];
  const bearing = (from, to) => (T.deg(Math.atan2(to[0] - from[0], to[1] - from[1])) + 360) % 360;
  const A = [0, 0], B = step(A, t1, d1), C = step(B, t2, d2);
  return { angB: angleAt(B, A, C, T), AC: dist(A, C), bearingAfromB: bearing(B, A), bearingCfromA: bearing(A, C) };
}
// Two angles of elevation, al from A and be from B, with B d metres nearer the foot F.
function twoObs({ al, be, d }, T) {
  T.require(be > al && be < 90, "the nearer point sees the steeper angle");
  const h = T.bisect((x) => x / Math.tan(T.rad(al)) - x / Math.tan(T.rad(be)) - d, 0, 1e6);
  const F = [0, 0], Tp = [0, h], B = [-h / Math.tan(T.rad(be)), 0], A = [B[0] - d, 0];
  T.require(Math.abs(angleAt(A, F, Tp, T) - al) < 1e-6, "the elevation from A is as given");
  return { h, BT: dist(B, Tp), BF: dist(B, F), angT: angleAt(Tp, A, B, T) };
}
// Sector, triangle, segment and chord for radius r and angle th (radians, less than pi).
function segment(r, th, T) {
  T.require(th > 0 && th < Math.PI, "the sector is less than a semicircle");
  const N = 20000, O = [0, 0], A = [r, 0], B = [r * Math.cos(th), r * Math.sin(th)];
  const shoelace = (P, Q, R) => Math.abs(P[0] * (Q[1] - R[1]) + Q[0] * (R[1] - P[1]) + R[0] * (P[1] - Q[1])) / 2;
  // the sector as a fan of N thin triangles
  const sector = N * shoelace(O, A, [r * Math.cos(th / N), r * Math.sin(th / N)]);
  // the segment as strips parallel to the chord, with x = r cos(phi)
  const seg = T.integrate((phi) => 2 * r * r * Math.sin(phi) ** 2, 0, th / 2);
  return { sector, tri: shoelace(O, A, B), seg, chord: dist(A, B) };
}

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
  // ---- second set ----
  "t3-distance-midpoint/distance-2d/equation": (q, T) => {
    // rotate the displacement onto the x-axis and read its length
    const { A, B } = q.params, dx = B[0] - A[0], dy = B[1] - A[1], t = Math.atan2(dy, dx), len = dx * Math.cos(t) + dy * Math.sin(t);
    T.require(Math.abs(len - Math.round(len)) < 1e-9, "the length is a whole number");
    return { a: len };
  },
  "t3-distance-midpoint/missing-endpoint/equation": (q, T) => {
    const { A, M } = q.params;
    const hit = T.optionWhere(q, "a", (v) => v.every((x, i) => Math.abs((A[i] + x) / 2 - M[i]) < 1e-9));
    const B = q.parts[0].answer.values[hit.index];
    T.require(Math.abs(dist(A, M) - dist(M, B)) < 1e-9, "M is equidistant from A and B");
    return { a: hit, b: dist(A, B) };
  },
  "t3-solid-volume-area/cone-volume-from-slant/words": (q, T) => {
    const { r, l } = q.params.sit, h = T.bisect((x) => r * r + x * x - l * l, 0, l);
    T.require(l > r, "the slant height is longer than the radius");
    // stack of discs
    return { a: h, b: T.integrate((z) => Math.PI * (r * (1 - z / h)) ** 2, 0, h) };
  },
  "t3-solid-volume-area/cone-total/words": (q, T) => {
    const { r, h } = q.params.sit, l = T.bisect((x) => x * x - r * r - h * h, 0, r + h);
    // base disc plus the surface of revolution of the slant line
    return { a: l, b: Math.PI * r * r + T.integrate((z) => 2 * Math.PI * r * (1 - z / h) * Math.sqrt(1 + (r / h) ** 2), 0, h) };
  },
  "t3-solid-volume-area/sphere-volume/words": (q, T) => {
    const { r } = q.params;
    return { a: T.integrate((z) => Math.PI * (r * r - z * z), -r, r) };
  },
  "t3-3d-angle/cuboid-diagonal-base/words": (q, T) => {
    const { a, b, c } = q.params, A = [0, 0, 0], C = [a, b, 0], G = [a, b, c], ang = angleAt(A, G, C, T);
    T.require(ang >= 12 && ang <= 78, "a line-plane angle between 12 and 78 degrees");
    T.require([30, 45, 60].every((x) => Math.abs(ang - x) >= 0.5), "the angle is clear of 30, 45 and 60 degrees");
    return { a: dist(A, C), b: dist(A, G), c: ang };
  },
  "t3-solid-volume-area/composite-volume/words": (q, T) => {
    const { r, h } = q.params;
    const V = T.integrate(() => Math.PI * r * r, 0, h) + T.integrate((z) => Math.PI * (r * r - z * z), 0, r);
    // base disc, cylinder wall, and the hemisphere as rings at latitude phi
    const S = T.integrate((x) => 2 * Math.PI * x, 0, r) + T.integrate(() => 2 * Math.PI * r, 0, h) + T.integrate((phi) => 2 * Math.PI * r * Math.cos(phi) * r, 0, Math.PI / 2);
    return { a: V, b: S };
  },
  "t3-sine-cosine-rule/angle-cosine-rule/words": (q, T) => {
    const { a, b, c } = q.params;
    T.require(a < b + c && b < a + c && c < a + b, "the sides make a triangle");
    const A = T.bisect((x) => triangle(c, b, x, T).a - a, 0.01, 179.99);
    // the other two angles from coordinates
    const Bp = [c, 0], Cp = [b * Math.cos(T.rad(A)), b * Math.sin(T.rad(A))], angB = angleAt(Bp, [0, 0], Cp, T), angC = 180 - A - angB;
    T.require([A, angB, angC].every((x) => x >= 20 - 1e-9 && x <= 140 + 1e-9), "every angle from 20 to 140 degrees");
    return { a: A };
  },
  "t3-sine-cosine-rule/side-sine-rule/words": (q, T) => {
    const { A, B, a } = q.params, Cdeg = 180 - A - B, Bp = [0, 0], Cp = [a, 0];
    T.require(Cdeg >= 20 && A >= 20 && B >= 20 && Math.max(A, B, Cdeg) <= 140, "every angle from 20 to 140 degrees");
    // slide A along the ray from B until the angle at C is right
    const at = (t) => [t * Math.cos(T.rad(B)), t * Math.sin(T.rad(B))];
    const t = T.bisect((x) => angleAt(Cp, Bp, at(x), T) - Cdeg, 1e-6, 1e4), Ap = at(t);
    T.require(Math.abs(angleAt(Ap, Bp, Cp, T) - A) < 1e-6, "the angle at A is as given");
    return { a: Cdeg, b: dist(Ap, Cp) };
  },
  "t3-triangle-area/area-from-two-sides/words": (q, T) => {
    const { b, c, A } = q.params, t = triangle(c, b, A, T);
    T.require(Math.abs(t.a - Math.round(t.a)) < 1e-9, "the third side is a whole number");
    // area = (1/2) AB BC sin B
    return { a: t.a, b: t.area, c: (2 * t.area) / (c * t.a) };
  },
  "t3-right-angle-trig/side-from-angle/words": (q, T) => {
    const { known, want, th, k } = q.params, t = T.rad(th);
    T.require(Math.abs(th - 45) >= 5, "the angle is at least 5 degrees from 45");
    // B at the origin, A at (x, 0), C at (0, y): the angle at A is atan2(y, x)
    let x, y;
    if (known === "AB") { x = k; y = T.bisect((v) => Math.atan2(v, x) - t, 1e-9, 1e5); }
    else if (known === "BC") { y = k; x = T.bisect((v) => Math.atan2(y, v) - t, 1e-9, 1e5); }
    else { x = T.bisect((v) => Math.atan2(Math.sqrt(k * k - v * v), v) - t, 1e-9, k - 1e-12); y = Math.sqrt(k * k - x * x); }
    return { a: { AB: x, BC: y, AC: Math.hypot(x, y) }[want] };
  },
  "t3-right-angle-trig/ratio-needs-pythagoras/words": (q, T) => {
    const { p, q: q2, at, f } = q.params, B = [0, 0], A = [p, 0], C = [0, q2];
    const ang = { A: T.rad(angleAt(A, B, C, T)), C: T.rad(angleAt(C, B, A, T)) }, other = at === "A" ? "C" : "A";
    T.require(Math.abs(dist(A, C) - Math.round(dist(A, C))) < 1e-9, "a Pythagorean triple");
    return { a: dist(A, C), b: trig[f](ang[at]), c: Math.tan(ang[other]) };
  },
  "t3-bearings-elevation/height-from-elevation/words": (q, T) => {
    const { d, th } = q.params;
    return { a: T.bisect((h) => Math.atan2(h, d) - T.rad(th), 0, 1e5) };
  },
  "t3-bearings-elevation/angle-of-depression/words": (q, T) => {
    const { h, d } = q.params, Tp = [0, h], B = [d, 0];
    // angle at T between the horizontal towards the boat and the line of sight
    const ang = angleAt(Tp, [d, h], B, T);
    T.require(Math.abs(ang - 45) >= 5, "the angle is at least 5 degrees from 45");
    return { a: ang, b: dist(Tp, B) };
  },
  "t3-bearings-elevation/height-with-eye-level/words": (q, T) => {
    const { d, th, e } = q.params;
    return { a: T.bisect((H) => Math.atan2(H - e, d) - T.rad(th), e, 1e5) };
  },
  "t3-bearings-elevation/angle-from-bearing/words": (q, T) => {
    const s = q.params.sit, g = legs(s.t1, s.t2, 1, 1, T);
    T.require(g.angB > 20 && g.angB < 160, "a clear angle at B");
    return { a: T.approx(g.bearingAfromB, 1e-6), b: T.approx(g.angB, 1e-6) };
  },
  "t3-bearings-elevation/two-leg-distance/words": (q, T) => {
    const s = q.params.sit, g = legs(s.t1, s.t2, s.d1, s.d2, T);
    T.require(g.angB >= 20 && g.angB <= 140, "the angle at B is from 20 to 140 degrees");
    T.require(g.bearingCfromA >= 10 && g.bearingCfromA <= 350, "the bearing does not wrap past north");
    return { a: T.approx(g.angB, 1e-6), b: g.AC, c: g.bearingCfromA };
  },
  "t3-ext-two-observations/height-two-angles/words": (q, T) => {
    const g = twoObs(q.params, T);
    return { a: T.approx(g.angT, 1e-6), b: g.BT, c: g.h };
  },
  "t3-ext-two-observations/exact-height/words": (q, T) => {
    const g = twoObs(q.params, T);
    return { a: T.approx(g.angT, 1e-6), b: g.BT, c: g.h, d: g.BF };
  },
  "t3-arc-sector/deg-to-rad/equation": (q, T) => {
    const { d1, d2 } = q.params;
    // as fractions of a full turn
    T.require(d1 !== d2, "two different angles");
    return { a: (d1 / 360) * TWO_PI, b: T.bisect((x) => (x / 360) * TWO_PI - T.rad(d2), 0, 720) };
  },
  "t3-arc-sector/theta-from-arc/equation": (q, T) => {
    const { r, l } = q.params, th = T.bisect((t) => r * t - l, 0, 10);
    T.require(th > 0 && th < TWO_PI, "an angle less than a full turn");
    return { a: th, b: T.integrate((x) => x * th, 0, r) };
  },
  "t3-arc-sector/arc-length/words": (q, T) => {
    const { r, n, d } = q.params, th = (n * Math.PI) / d;
    T.require(th > 0 && th < TWO_PI, "an angle less than a full turn");
    return { a: (th / TWO_PI) * TWO_PI * r, b: T.integrate((x) => x * th, 0, r) };
  },
  "t3-composite-circular-region/segment-area/words": (q, T) => {
    const g = segment(q.params.r, q.params.th, T);
    return { a: T.approx(g.sector, 1e-5), b: g.tri, c: g.seg, d: g.chord };
  },
  "t3-composite-circular-region/segment-exact/words": (q, T) => {
    const g = segment(q.params.r, T.rad(q.params.dg), T);
    return { a: T.approx(g.sector, 1e-5), b: g.tri, c: g.seg };
  },
  "t3-exact-values/special-value/equation": (q, T) => {
    const { f, a } = q.params;
    return { a: T.optionWhere(q, "a", (v) => Math.abs(v - trig[f](T.rad(a))) < 1e-9) };
  },
  "t3-exact-values/sign-in-quadrant/words": (q, T) => {
    const { f, g, signs } = q.params, found = new Set();
    for (let x = 1; x < 360; x++) if (x % 90 && Math.sign(trig[f](T.rad(x))) === signs[0] && Math.sign(trig[g](T.rad(x))) === signs[1]) found.add(Math.floor(x / 90) + 1);
    T.require(found.size === 1, "exactly one quadrant fits");
    return { a: T.option([...found][0]) };
  },
  "t3-exact-values/special-sum/equation": (q, T) => {
    const { c, f1, a1, f2, a2, g1, b1, g2, b2 } = q.params, v = (f, a) => trig[f](T.rad(a));
    return { a: c * v(f1, a1) * v(f2, a2), b: v(g1, b1) ** 2 + v(g2, b2) ** 2 };
  },
  "t3-exact-values/given-related/equation": (q, T) => {
    const { f, p, q: q2, picks } = q.params, th = { sin: Math.asin, cos: Math.acos, tan: Math.atan }[f](p / q2);
    T.require(th > 0 && th < Math.PI / 2, "theta is acute");
    const rel = [(t) => Math.PI - t, (t) => Math.PI + t, (t) => TWO_PI - t, (t) => -t];
    return Object.fromEntries(picks.map((i, n) => ["abc"[n], trig[f](rel[i](th))]));
  },
  "t3-identity-values/cos2-from-sin/equation": (q, T) => {
    const { p, q: q2, quad, given } = q.params, lo = ((quad - 1) * Math.PI) / 2, hi = (quad * Math.PI) / 2, other = given === "sin" ? "cos" : "sin";
    const target = Math.sign(trig[given]((lo + hi) / 2)) * (p / q2);
    const r = T.roots((t) => trig[given](t) - target, lo + 1e-9, hi - 1e-9, 2000);
    T.require(r.length === 1, "one angle in the quadrant has this ratio");
    const th = r[0];
    T.require(Math.abs(Math.cos(2 * th)) > 1e-6, "tan of the double angle is defined");
    return { a: trig[other](th), b: Math.sin(2 * th), c: Math.cos(2 * th), d: Math.tan(2 * th) };
  },
  "t3-identity-values/expand-square/equation": (q, T) => {
    const { k, plus } = q.params, s = plus ? 1 : -1;
    const r = T.roots((t) => Math.sin(t) + s * Math.cos(t) - k, 0, TWO_PI, 20000);
    T.require(r.length >= 1, "an angle with this sum exists");
    const th = r[0];
    return { a: Math.sin(th) * Math.cos(th), b: Math.sin(2 * th), c: (Math.sin(th) - s * Math.cos(th)) ** 2 };
  },
  "t3-identity-values/product-sine/equation": (q, T) => {
    const { form, a, k } = q.params;
    const lhs = { product: (x) => 2 * k * Math.sin(a * x) * Math.cos(a * x), difference: (x) => Math.cos(a * x) ** 2 - Math.sin(a * x) ** 2, "one-minus": (x) => 1 - 2 * Math.sin(a * x) ** 2, "minus-one": (x) => 2 * Math.cos(a * x) ** 2 - 1 }[form];
    return { a: T.optionWhere(q, "a", (v) => T.range(-3, 3, 0.37).every((x) => Math.abs(v[0] * trig[v[1]](v[2] * x) - lhs(x)) < 1e-9)) };
  },
  "t3-trig-read-features/amplitude/equation": (q, T) => {
    const { a, b, d, fn } = q.params, f = (x) => a * trig[fn](b * x) + d;
    const max = T.extremum(f, 0, 7, "max", 70000).value, min = T.extremum(f, 0, 7, "min", 70000).value;
    return { a: (max - min) / 2, b: (max + min) / 2 };
  },
  "t3-trig-read-features/a-d-from-graph/graph": (q, T) => {
    // read everything off the picture
    const g = q.graph, f = (x) => T.evalGraph(g.functions[0].fn, x), W = g.x[1];
    const max = T.extremum(f, 0, W, "max", 40000).value, min = T.extremum(f, 0, W, "min", 40000).value;
    const [A, B] = g.points;
    T.require(Math.abs(f(A.x) - A.y) < 1e-9 && Math.abs(A.y - max) < 1e-9, "A is a maximum point of the curve");
    T.require(Math.abs(f(B.x) - B.y) < 1e-9 && Math.abs(B.y - min) < 1e-9, "B is a minimum point of the curve");
    T.require(max < g.y[1] && min > g.y[0], "the whole wave is inside the window");
    return { a: (max - min) / 2, b: (max + min) / 2, c: T.approx(TWO_PI / periodOf(f, 1e-3, W, T), 1e-6) };
  },
  "t3-trig-sketch/sketch-wave/graph": (q, T) => {
    const { fn, a, k, d } = q.params, f = (x) => a * trig[fn]((Math.PI * x) / k) + d, W = 4 * k;
    const hit = T.optionWhere(q, "a", (v, i, opt) => T.range(0, W, W / 97).every((x) => Math.abs(T.evalGraph(opt.functions[0].fn, x) - f(x)) < 1e-9));
    return { a: hit, b: T.approx(periodOf(f, 1e-3, W, T), 1e-6), c: T.extremum(f, 0, W, "max", 40000).value };
  },
  "t3-trig-model-parameters/wheel-model/words": (q, T) => {
    const { wheel, lo, hi, T: per, ts } = q.params;
    // the motion itself: a point going round a circle at a steady rate, starting at the bottom (wheel) or the top (tide)
    const y = (t) => (lo + hi) / 2 + ((hi - lo) / 2) * Math.sin((wheel ? -1 : 1) * (Math.PI / 2) + (TWO_PI * t) / per);
    T.require(Math.abs(y(0) - (wheel ? lo : hi)) < 1e-9, "the motion starts where the story says");
    // fit a cos(bt) + d: d is the mean, |a| comes from the root mean square, b from the period
    const d = T.integrate(y, 0, per) / per, amp = Math.sqrt((2 * T.integrate((t) => (y(t) - d) ** 2, 0, per)) / per);
    return { a: T.approx(d, 1e-6), b: T.approx(Math.sign(y(0) - d) * amp, 1e-6), c: T.approx(TWO_PI / periodOf(y, 1e-3, 2 * per, T), 1e-6), d: y(ts) };
  },
  "t3-trig-model-use/duration-above/graph": (q, T) => {
    const { a, d, b, W, L, t0 } = q.params, h = (t) => d + a * Math.sin(b * t - Math.PI / 2);
    T.require(T.range(0, W, W / 53).every((t) => Math.abs(T.evalGraph(q.graph.functions[0].fn, t) - h(t)) < 1e-9), "the graph shows the model");
    T.require(q.graph.asymptotes[0].y === L, "the dashed line is at the level asked about");
    const r = T.roots((t) => h(t) - L, 0, W, 20000);
    T.require(r.length === 2, "the level is crossed exactly twice in the interval");
    T.require(Math.abs(L - d) < 0.75 * a, "the level is well inside the wave");
    // share of the interval above the level, on a grid
    const N = 200000;
    let above = 0;
    for (let i = 0; i < N; i++) if (h((W * (i + 0.5)) / N) > L) above++;
    T.require(Math.abs((above * W) / N - (r[1] - r[0])) < 1e-3, "the time above the level is the gap between the crossings");
    return { a: h(t0), b: r[0], c: r[1] - r[0] };
  },
  "t3-trig-equation/basic-degrees/equation": (q, T) => {
    const { fn, target, top } = q.params, r = T.roots((x) => trig[fn](T.rad(x)) - target, 0, top, top * 100);
    T.require(r.length === 1, "one solution in the interval");
    T.require(Math.abs(r[0] - Math.round(r[0])) < 1e-6, "a solution in degrees is whole");
    return { a: T.approx(r[0], 1e-6) };
  },
  "t3-trig-equation/multiple-angle/equation": (q, T) => {
    const { fn, k, target, top } = q.params, r = T.roots((x) => trig[fn](k * x) - target, 0, T.rad(top), 40000);
    T.require(r.length >= 2, "at least two solutions");
    T.require(r[0] > 1e-3 && r[r.length - 1] < T.rad(top) - 1e-3, "no solution on an end of the interval");
    return { a: r[0], b: r.length, c: r[r.length - 1] };
  },
  "t3-trig-equation/double-equals-sin/equation": (q, T) => {
    const { common, k } = q.params, r = T.roots((x) => Math.sin(2 * x) - k * trig[common](x), 1e-6, TWO_PI - 1e-6, 40000);
    T.require(r.length >= 3, "the factor and the bracket both give solutions");
    return { a: r.length, b: r[0], c: r[r.length - 1] };
  },
  "t3-trig-model-equation/solve-vs-line/graph": (q, T) => {
    const { a, b, m, c, W } = q.params, [gf, gg] = q.graph.functions.map((x) => x.fn);
    T.require(T.range(0, W, W / 41).every((x) => Math.abs(T.evalGraph(gf, x) - a * Math.sin(b * x)) < 1e-9 && Math.abs(T.evalGraph(gg, x) - (m * x + c)) < 1e-9), "the graph shows the two functions");
    // crossings read off the picture
    const u = (x) => T.evalGraph(gf, x) - T.evalGraph(gg, x), r = T.roots(u, 0, W, 6000);
    T.require(r.length >= 2 && r.length <= 4, "two to four crossings");
    T.require(r.every((x) => Math.abs(T.deriv(u, x)) > 0.5), "the curves cross clearly");
    T.require(Math.abs(u(0)) > 0.25 && Math.abs(u(W)) > 0.25, "no crossing on an end of the interval");
    return { a: r.length, b: r[0], c: r[r.length - 1] };
  },
};
