/* AA HL additional higher level content, topics 3 and 4: reciprocal and inverse trigonometric functions (3.9),
   compound angles (3.10), symmetry relations (3.11), vectors, lines and planes (3.12 to 3.18), Bayes' theorem
   (4.13) and random variables with probability density functions (4.14).
   Self-contained: needs only engine.js. Codes are AA HL codes (home: "aa-hl").
   Each generator's independent verifier is in scripts/engine-checks/aa-hl-topic34.mjs under the same id. */
(function (root) {
  "use strict";
  const E = root.QBEngine;
  const { ans, fmt } = E;
  const { num, frac, signed, br, paren, expr, sf, coef, rat, piFrac, surd, wrap, gcd } = fmt;
  const P = (prompt, marks, answer, working) => ({ prompt, marks, answer, working });
  const reg = (def) => E.registerAll({ home: "aa-hl", calculator: false }, [def])[0];
  const rad = (d) => (d * Math.PI) / 180;

  // ---- exact values ---------------------------------------------------------------------
  // n * sqrt(r) / d as {val, tex}, simplified, with the sign in front.
  function sq(n, r, d) {
    const p = fmt.sqrtParts(r);
    let k = n * p.out;
    if (d < 0) { k = -k; d = -d; }
    const g = gcd(k, d) || 1;
    k /= g; d /= g;
    const val = (k * Math.sqrt(p.in)) / d;
    if (p.in === 1 || k === 0) return { val, tex: frac(k, d) };
    const top = (Math.abs(k) === 1 ? "" : Math.abs(k)) + `\\sqrt{${p.in}}`;
    return { val, tex: (k < 0 ? "-" : "") + (d === 1 ? top : `\\dfrac{${top}}{${d}}`) };
  }
  const TRIG = {
    sin: { 30: [1, 1, 2], 45: [1, 2, 2], 60: [1, 3, 2] }, cos: { 30: [1, 3, 2], 45: [1, 2, 2], 60: [1, 1, 2] }, tan: { 30: [1, 3, 3], 45: [1, 1, 1], 60: [1, 3, 1] },
    cosec: { 30: [2, 1, 1], 45: [1, 2, 1], 60: [2, 3, 3] }, sec: { 30: [2, 3, 3], 45: [1, 2, 1], 60: [2, 1, 1] }, cot: { 30: [1, 3, 1], 45: [1, 1, 1], 60: [1, 3, 3] },
  };
  const FN = { sin: "\\sin", cos: "\\cos", tan: "\\tan", sec: "\\sec", cosec: "\\operatorname{cosec}", cot: "\\cot", arcsin: "\\arcsin", arccos: "\\arccos", arctan: "\\arctan" };
  const SIGNLIKE = { sin: "sin", cosec: "sin", cos: "cos", sec: "cos", tan: "tan", cot: "tan" };
  const quadOf = (deg) => Math.floor((((deg % 360) + 360) % 360) / 90) + 1;
  const signIn = (fn, quad) => ({ sin: quad <= 2, cos: quad === 1 || quad === 4, tan: quad === 1 || quad === 3 }[SIGNLIKE[fn]] ? 1 : -1);
  // Exact value of a trigonometric function at a multiple of 30 or 45 degrees that is not a multiple of 90.
  function exactTrig(fn, deg) {
    const d = ((deg % 360) + 360) % 360, r = d % 180, ref = r > 90 ? 180 - r : r;
    const [n, s, den] = TRIG[fn][ref];
    return sq(signIn(fn, quadOf(d)) * n, s, den);
  }
  const TRIPLES = [[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13], [8, 15, 17], [15, 8, 17], [7, 24, 25], [24, 7, 25]];
  const INTERVAL = { 1: "0 < \\theta < \\dfrac{\\pi}{2}", 2: "\\dfrac{\\pi}{2} < \\theta < \\pi", 3: "\\pi < \\theta < \\dfrac{3\\pi}{2}", 4: "\\dfrac{3\\pi}{2} < \\theta < 2\\pi" };
  const pf = (n, d) => (n * d < 0 ? `\\left(${frac(n, d)}\\right)` : frac(n, d));       // a fraction, bracketed when negative
  const posneg = (s) => (s > 0 ? "positive" : "negative");
  const piAns = (deg) => ans.exact(rad(deg), piFrac(deg, 180));

  // ======================= 3.9 reciprocal ratios =======================
  reg({ type: "t3-ahl-reciprocal-trig", unknown: "exact-value", representation: "equation", format: "mcq", levels: [1], syllabus: ["3.9"],
    skills: ["AHL3.9.reciprocal-ratios"], title: "Exact value of sec, cosec or cot",
    build({ rng }) {
      const ref = rng.pick([30, 45, 60]), quad = rng.int(1, 4), fn = rng.pick(["sec", "cosec", "cot"]);
      const deg = [ref, 180 - ref, 180 + ref, 360 - ref][quad - 1];
      const base = { sec: "cos", cosec: "sin", cot: "tan" }[fn], partner = { sec: "cosec", cosec: "sec", cot: "tan" }[fn];
      const right = exactTrig(fn, deg), b = exactTrig(base, deg), s = Math.sign(right.val);
      const o = (x, why) => ({ text: `$${x.tex}$`, value: x.val, why });
      const neg = () => { const t = TRIG[fn][ref]; return sq(-s * t[0], t[1], t[2]); };
      const fill = [[2, 1, 1], [1, 2, 1], [2, 3, 3], [1, 3, 1], [1, 3, 3], [1, 1, 1]].map((t) => o(sq(s * t[0], t[1], t[2]), "This is the value for a different angle."));
      const A = piFrac(deg, 180);
      return { params: { fn, deg }, stem: `Consider the angle $${A}$ radians.`, parts: [
        P(`Which is the exact value of $${FN[fn]} ${A}$?`, 1, ans.choice(rng, o(right), [
          o(neg(), "The sign is wrong for this quadrant."),
          o(b, `This is $${FN[base]} ${A}$, not its reciprocal.`),
          o(sq(s * TRIG[partner][ref][0], TRIG[partner][ref][1], TRIG[partner][ref][2]), `This comes from $${FN[partner]}$, not $${FN[fn]}$.`)].concat(fill)), [
          `$${FN[fn]}\\theta = \\dfrac{1}{${FN[base]}\\theta}$`,
          `$${FN[base]} ${A} = ${b.tex}$`,
          `$${FN[fn]} ${A} = ${right.tex}$`])] };
    } });

  reg({ type: "t3-ahl-reciprocal-trig", unknown: "other-ratios", representation: "equation", format: "value", levels: [2], syllabus: ["3.9"],
    skills: ["AHL3.9.pythagorean-identities", "AHL3.9.reciprocal-ratios"], title: "Find other ratios from sec, cosec or cot with a Pythagorean identity",
    build({ rng }) {
      const [a, b, c] = rng.pick(TRIPLES), quad = rng.int(2, 4), kind = rng.pick(["sec", "cosec", "cot"]);
      const sx = quad === 1 || quad === 4 ? 1 : -1, sy = quad <= 2 ? 1 : -1, st = sx * sy;
      const iv = `$${INTERVAL[quad]}$`;
      let stem, parts;
      if (kind === "sec") {
        stem = `It is given that $\\sec\\theta = ${frac(sx * c, a)}$, where ${iv}.`;
        parts = [
          P("Find the exact value of $\\tan\\theta$.", 2, ans.frac(st * b, a), [
            "$1 + \\tan^{2}\\theta = \\sec^{2}\\theta$",
            `$\\tan^{2}\\theta = \\dfrac{${c * c}}{${a * a}} - 1 = \\dfrac{${b * b}}{${a * a}}$`,
            `In this interval $\\tan\\theta$ is ${posneg(st)}, so $\\tan\\theta = ${frac(st * b, a)}$.`]),
          P("Find the exact value of $\\operatorname{cosec}\\theta$.", 2, ans.frac(sy * c, b), [
            `$\\cos\\theta = \\dfrac{1}{\\sec\\theta} = ${frac(sx * a, c)}$`,
            `$\\sin\\theta = \\tan\\theta\\cos\\theta = ${frac(sy * b, c)}$`,
            `$\\operatorname{cosec}\\theta = \\dfrac{1}{\\sin\\theta} = ${frac(sy * c, b)}$`])];
      } else if (kind === "cosec") {
        stem = `It is given that $\\operatorname{cosec}\\theta = ${frac(sy * c, b)}$, where ${iv}.`;
        parts = [
          P("Find the exact value of $\\cot\\theta$.", 2, ans.frac(st * a, b), [
            "$1 + \\cot^{2}\\theta = \\operatorname{cosec}^{2}\\theta$",
            `$\\cot^{2}\\theta = \\dfrac{${c * c}}{${b * b}} - 1 = \\dfrac{${a * a}}{${b * b}}$`,
            `In this interval $\\cot\\theta$ is ${posneg(st)}, so $\\cot\\theta = ${frac(st * a, b)}$.`]),
          P("Find the exact value of $\\sec\\theta$.", 2, ans.frac(sx * c, a), [
            `$\\sin\\theta = \\dfrac{1}{\\operatorname{cosec}\\theta} = ${frac(sy * b, c)}$`,
            `$\\cos\\theta = \\cot\\theta\\sin\\theta = ${frac(sx * a, c)}$`,
            `$\\sec\\theta = \\dfrac{1}{\\cos\\theta} = ${frac(sx * c, a)}$`])];
      } else {
        stem = `It is given that $\\cot\\theta = ${frac(st * a, b)}$, where ${iv}.`;
        parts = [
          P("Find the exact value of $\\operatorname{cosec}\\theta$.", 2, ans.frac(sy * c, b), [
            "$1 + \\cot^{2}\\theta = \\operatorname{cosec}^{2}\\theta$",
            `$\\operatorname{cosec}^{2}\\theta = 1 + \\dfrac{${a * a}}{${b * b}} = \\dfrac{${c * c}}{${b * b}}$`,
            `In this interval $\\sin\\theta$ is ${posneg(sy)}, so $\\operatorname{cosec}\\theta = ${frac(sy * c, b)}$.`]),
          P("Find the exact value of $\\cos\\theta$.", 2, ans.frac(sx * a, c), [
            `$\\sin\\theta = \\dfrac{1}{\\operatorname{cosec}\\theta} = ${frac(sy * b, c)}$`,
            `$\\cos\\theta = \\cot\\theta\\sin\\theta = ${pf(st * a, b)} \\times ${pf(sy * b, c)}$`,
            `$\\cos\\theta = ${frac(sx * a, c)}$`])];
      }
      return { params: { kind, given: kind === "sec" ? (sx * c) / a : kind === "cosec" ? (sy * c) / b : (st * a) / b, quad }, stem, parts };
    } });

  // The equations A tan^2 x + B sec x + (C + A) = 0 and A cot^2 x + B cosec x + (C + A) = 0, built from (s - p)(s - q) = 0.
  reg({ type: "t3-ahl-reciprocal-trig", unknown: "solve-quadratic", representation: "equation", format: "value", levels: [3], syllabus: ["3.9"],
    skills: ["AHL3.9.solve-reciprocal-equation", "AHL3.9.pythagorean-identities"], title: "Solve a quadratic equation in sec or cosec using a Pythagorean identity",
    build({ rng }) {
      const fn = rng.pick(["sec", "cosec"]), p = rng.pick([2, -2]);
      const q2 = rng.pick(fn === "sec" ? [-2, 1, -1] : [-2, 2, 1, -1]);              // twice q: q is -1, 1/2, -1/2 (or 1 for cosec)
      const half = Math.abs(q2) === 1;
      const A = half ? 2 : 1, B = half ? -(2 * p + q2) : -(p + q2 / 2), C = half ? p * q2 : (p * q2) / 2;
      const sq2 = fn === "sec" ? "\\tan^{2}x" : "\\cot^{2}x", S = `${FN[fn]} x`, S2 = fn === "sec" ? "\\sec^{2}x" : "\\operatorname{cosec}^{2}x", base = fn === "sec" ? "\\cos" : "\\sin";
      const eq = `${expr([[A, sq2], [B, S], [C + A, ""]])} = 0`;
      const quad = (c) => `${expr([[c[0], S2], [c[1], S], [c[2], ""]])} = 0`;
      const SOL = { sec: { 2: [60, 300], "-2": [120, 240], "-1": [180] }, cosec: { 2: [30, 150], "-2": [210, 330], 1: [90], "-1": [270] } };
      const sols = (SOL[fn][p] || []).concat(half ? [] : SOL[fn][q2 / 2] || []).sort((x, y) => x - y);
      const list = sols.map((d) => piFrac(d, 180)).join(",\\ ");
      const opt = (c, why) => ({ text: `$${quad(c)}$`, value: c, why });
      const qT = half ? frac(q2, 2) : num(q2 / 2);
      return { params: { fn, A, B, K: C + A }, stem: `Consider the equation $${eq}$, for $0 \\le x \\le 2\\pi$.`, parts: [
        P(`Which equation in $${S}$ is equivalent to the given equation?`, 2, ans.choice(rng, opt([A, B, C]), [
          opt([A, B, C + A], `This replaces $${sq2}$ by $${S2}$ and loses the $1$.`),
          opt([A, B, C + 2 * A], `This uses $${sq2} = ${S2} + 1$; the identity gives $${sq2} = ${S2} - 1$.`),
          opt([A, -B, C], "The sign of the middle term has changed.")]), [
          `$${fn === "sec" ? "1 + \\tan^{2}x = \\sec^{2}x" : "1 + \\cot^{2}x = \\operatorname{cosec}^{2}x"}$, so $${sq2} = ${S2} - 1$`,
          `$${expr([[A, `\\left(${S2} - 1\\right)`], [B, S], [C + A, ""]])} = 0$`,
          `$${quad([A, B, C])}$`]),
        P("Find the number of solutions of the equation in the given interval.", 2, ans.int(sols.length), [
          `$(${S} ${signed(-p)})(${half ? "2" : ""}${S} ${signed(half ? -q2 : -q2 / 2)}) = 0$`,
          `$${S} = ${p}$ or $${S} = ${qT}$`,
          half ? `$${S} = ${qT}$ would need $${base} x = ${num(2 / q2)}$, which is impossible.` : `$${base} x = ${frac(1, p)}$ or $${base} x = ${num(2 / q2)}$`,
          `In the interval, $x = ${list}$.`,
          `There are $${sols.length}$ solutions.`]),
        P("Find the smallest solution, giving an exact answer.", 2, piAns(sols[0]), [
          `In order, the solutions are $x = ${list}$.`,
          `The smallest solution is $x = ${piFrac(sols[0], 180)}$.`]),
        P("Find the largest solution, giving an exact answer.", 1, piAns(sols[sols.length - 1]), [
          `The solutions are $x = ${list}$, so the largest is $x = ${piFrac(sols[sols.length - 1], 180)}$.`])] };
    } });

  reg({ type: "t3-ahl-reciprocal-trig", unknown: "solve-calculator", representation: "equation", format: "value", levels: [4], syllabus: ["3.9"], calculator: true,
    skills: ["AHL3.9.solve-reciprocal-equation", "AHL3.9.pythagorean-identities", "AHL3.9.express-with-inverse-trig"], title: "Solve an equation in sec and tan with technology",
    build({ rng }) {
      let t1, t2;
      do { t1 = rng.pick([-5, -4, -3, -2, 2, 3, 4, 5]); t2 = rng.pick([-5, -4, -3, -2, 2, 3, 4, 5, 0.5, -0.5, 1.5, -1.5]); } while (t1 === t2);
      const b = -(t1 + t2), c = t1 * t2 - 1;
      const eq = `${expr([[1, "\\sec^{2}x"], [b, "\\tan x"], [c, ""]])} = 0`;
      const tq = (k) => `${expr([[1, "\\tan^{2}x"], [k[0], "\\tan x"], [k[1], ""]])} = 0`;
      const opt = (k, why) => ({ text: `$${tq(k)}$`, value: k, why });
      const xOf = (t) => (t > 0 ? Math.atan(t) : Math.PI + Math.atan(t)), sol = (t) => (t > 0 ? `\\arctan(${num(t)})` : `\\pi + \\arctan(${num(t)})`);
      const ts = [t1, t2].sort((x, y) => xOf(x) - xOf(y)), xs = ts.map(xOf);
      return { params: { b, c }, stem: `Consider the equation $${eq}$, for $0 \\le x \\le \\pi$.`, parts: [
        P("Which equation in $\\tan x$ is equivalent to the given equation?", 2, ans.choice(rng, opt([b, c + 1]), [
          opt([b, c - 1], "The identity is $\\sec^{2}x = 1 + \\tan^{2}x$, so $1$ is added, not subtracted."),
          opt([b, c], "This replaces $\\sec^{2}x$ by $\\tan^{2}x$ and loses the $1$."),
          opt([-b, c + 1], "The sign of the middle term has changed.")]), [
          "$\\sec^{2}x = 1 + \\tan^{2}x$",
          `$${expr([[1, "1 + \\tan^{2}x"], [b, "\\tan x"], [c, ""]])} = 0$`,
          `$${tq([b, c + 1])}$`]),
        P("Find the smaller solution of the equation.", 2, ans.sf(xs[0]), [
          `Solving the quadratic gives $\\tan x = ${num(Math.min(t1, t2))}$ or $\\tan x = ${num(Math.max(t1, t2))}$.`,
          "For $0 \\le x \\le \\pi$, a positive value of $\\tan x$ gives an angle in the first quadrant and a negative value gives one in the second quadrant.",
          `The smaller solution is $x = ${sol(ts[0])} = ${sf(xs[0])}$.`]),
        P("Find the larger solution of the equation.", 2, ans.sf(xs[1]), [
          `The other value, $\\tan x = ${num(ts[1])}$, gives $x = ${sol(ts[1])}$.`,
          `$x = ${sf(xs[1])}$`])] };
    } });

  // ======================= 3.9 inverse functions =======================
  reg({ type: "t3-ahl-inverse-trig", unknown: "principal-value", representation: "equation", format: "mcq", levels: [1], syllabus: ["3.9"],
    skills: ["AHL3.9.inverse-trig-values"], title: "Exact value of arcsin, arccos or arctan",
    build({ rng }) {
      const fn = rng.pick(["sin", "cos", "tan"]), ref = rng.pick([30, 45, 60]), s = rng.bool(0.7) ? -1 : 1;
      const t = TRIG[fn][ref], arg = sq(s * t[0], t[1], t[2]);
      const right = fn === "cos" ? (s > 0 ? ref : 180 - ref) : s * ref;
      const f = { sin: Math.sin, cos: Math.cos, tan: Math.tan }[fn], inv = FN["arc" + fn];
      const range = fn === "cos" ? "0 \\le y \\le \\pi" : fn === "sin" ? "-\\dfrac{\\pi}{2} \\le y \\le \\dfrac{\\pi}{2}" : "-\\dfrac{\\pi}{2} < y < \\dfrac{\\pi}{2}";
      const cands = [180 - ref, 180 + ref, 360 - ref, -ref, ref, 90 - ref, ref - 180].filter((d) => d !== right && d !== 0);
      const same = (d) => Math.abs(f(rad(d)) - arg.val) < 1e-9;
      const o = (d) => ({ text: `$${piFrac(d, 180)}$`, value: d, why: d === right ? undefined : same(d) ? `This angle has the right ${fn === "sin" ? "sine" : fn === "cos" ? "cosine" : "tangent"} but is outside the range of $${inv}$.` : `The ${fn === "sin" ? "sine" : fn === "cos" ? "cosine" : "tangent"} of this angle is not $${arg.tex}$.` });
      const wrongs = cands.filter(same).concat(cands.filter((d) => !same(d))).map(o);
      return { params: { fn, arg: arg.val }, stem: `Let $\\alpha = ${inv}\\left(${arg.tex}\\right)$.`, parts: [
        P("Which is the exact value of $\\alpha$?", 1, ans.choice(rng, o(right), wrongs), [
          `$\\alpha$ is the angle in the range $${range}$ with $${FN[fn]}\\alpha = ${arg.tex}$.`,
          `$\\alpha = ${piFrac(right, 180)}$`])] };
    } });

  reg({ type: "t3-ahl-inverse-trig", unknown: "composite", representation: "equation", format: "value", levels: [2], syllabus: ["3.9"],
    skills: ["AHL3.9.inverse-trig-values", "AHL3.9.express-with-inverse-trig"], title: "Exact values of expressions that combine trigonometric and inverse functions",
    build({ rng }) {
      const [a, b, c] = rng.pick(TRIPLES), s = rng.sign(), inner = rng.pick(["sin", "cos", "tan"]), outer = rng.pick(["sin", "cos", "tan"].filter((f) => f !== inner));
      // theta = arc<inner>(arg): its sine, cosine and tangent as [numerator, denominator]
      const val = inner === "cos" ? { sin: [b, c], cos: [s * a, c], tan: [s * b, a] } : { sin: [s * b, c], cos: [a, c], tan: [s * b, a] };
      const where = inner === "cos" ? (s > 0 ? "0 < \\theta < \\dfrac{\\pi}{2}" : "\\dfrac{\\pi}{2} < \\theta < \\pi") : s > 0 ? "0 < \\theta < \\dfrac{\\pi}{2}" : "-\\dfrac{\\pi}{2} < \\theta < 0";
      const argT = frac(val[inner][0], val[inner][1]), inv = FN["arc" + inner];
      // part (b): arcf(f(alpha)) with alpha outside the principal range
      const f2 = rng.pick(["sin", "cos", "tan"]);
      const al = rng.pick(f2 === "sin" ? [120, 135, 150, 210, 225, 240, 300, 315, 330] : f2 === "cos" ? [210, 225, 240, 300, 315, 330, -30, -45, -60] : [120, 135, 150, 210, 225, 240]);
      const res = f2 === "sin" ? (al < 270 ? 180 - al : al - 360) : f2 === "cos" ? (al < 0 ? -al : 360 - al) : al - 180;
      const inv2 = FN["arc" + f2], aT = piFrac(al, 180), mid = exactTrig(f2, al);
      const range2 = f2 === "cos" ? "0 \\le y \\le \\pi" : f2 === "sin" ? "-\\dfrac{\\pi}{2} \\le y \\le \\dfrac{\\pi}{2}" : "-\\dfrac{\\pi}{2} < y < \\dfrac{\\pi}{2}";
      return { params: { inner, outer, arg: val[inner][0] / val[inner][1], f2, al }, stem: "This question is about exact values of expressions that use inverse trigonometric functions.", parts: [
        P(`Find the exact value of $${FN[outer]}\\left(${inv}\\left(${argT}\\right)\\right)$.`, 2, ans.frac(val[outer][0], val[outer][1]), [
          `Let $\\theta = ${inv}\\left(${argT}\\right)$, so $${FN[inner]}\\theta = ${argT}$ and $${where}$.`,
          `A right-angled triangle with sides $${Math.min(a, b)}$, $${Math.max(a, b)}$ and $${c}$ gives the other ratios; the signs come from the interval.`,
          `$${FN[outer]}\\theta = ${frac(val[outer][0], val[outer][1])}$`]),
        P(`Find the exact value of $${inv2}\\left(${FN[f2]} ${al < 0 ? `\\left(${aT}\\right)` : aT}\\right)$.`, 2, piAns(res), [
          `$${FN[f2]} ${al < 0 ? `\\left(${aT}\\right)` : aT} = ${mid.tex}$`,
          `The range of $${inv2}$ is $${range2}$, so the answer is the angle in that range with the same ${f2 === "sin" ? "sine" : f2 === "cos" ? "cosine" : "tangent"}.`,
          `$${inv2}\\left(${mid.tex}\\right) = ${piFrac(res, 180)}$`])] };
    } });

  reg({ type: "t3-ahl-inverse-trig", unknown: "domain-range", representation: "equation", format: "value", levels: [2], syllabus: ["3.9"],
    skills: ["AHL3.9.inverse-trig-graphs"], title: "Largest domain and greatest value of a function built from arcsin or arccos",
    build({ rng }) {
      const fn = rng.pick(["arcsin", "arccos"]), A = rng.int(1, 4), b = rng.int(2, 5), c = rng.nonzero(-4, 4);
      const lo = rat.Q(-1 - c, b), hi = rat.Q(1 - c, b), top = fn === "arcsin" ? rat.Q(A, 2) : rat.Q(A, 1);
      const inside = expr([[b, "x"], [c, ""]]);
      return { params: { fn, A, b, c }, stem: `The function $f$ is defined by $f(x) = ${coef(A, `${FN[fn]}(${inside})`)}$, on the largest possible domain $p \\le x \\le q$.`, parts: [
        P("Find the value of $p$.", 1, ans.frac(lo.n, lo.d), [
          `$${FN[fn]}$ is defined only for inputs from $-1$ to $1$, so $-1 \\le ${inside} \\le 1$.`,
          `$${num(-1 - c)} \\le ${b}x \\le ${num(1 - c)}$, so $p = ${frac(lo.n, lo.d)}$.`]),
        P("Find the value of $q$.", 1, ans.frac(hi.n, hi.d), [`From $${b}x \\le ${num(1 - c)}$, $q = ${frac(hi.n, hi.d)}$.`]),
        P("Find the greatest value of $f(x)$, giving an exact answer.", 2, ans.exact((top.n / top.d) * Math.PI, piFrac(top.n, top.d)), [
          fn === "arcsin" ? "The greatest value of $\\arcsin$ is $\\dfrac{\\pi}{2}$, when its input is $1$." : "The greatest value of $\\arccos$ is $\\pi$, when its input is $-1$.",
          `The greatest value of $f$ is $${A === 1 ? "" : A + " \\times "}${fn === "arcsin" ? "\\dfrac{\\pi}{2}" : "\\pi"} = ${piFrac(top.n, top.d)}$.`])] };
    } });

  // ======================= 3.10 compound angles =======================
  reg({ type: "t3-ahl-compound-angle", unknown: "recognise", representation: "equation", format: "mcq", levels: [1], syllabus: ["3.10"],
    skills: ["AHL3.10.compound-angle"], title: "Recognise a compound angle expansion",
    build({ rng }) {
      const n = rng.int(1, 3), mm = n + rng.int(1, 3), pat = rng.pick(["sc+", "sc-", "cc-", "cc+"]);
      const Pm = coef(mm, "x"), Qn = coef(n, "x");
      const ex = { "sc+": `\\sin ${Pm}\\cos ${Qn} + \\cos ${Pm}\\sin ${Qn}`, "sc-": `\\sin ${Pm}\\cos ${Qn} - \\cos ${Pm}\\sin ${Qn}`, "cc-": `\\cos ${Pm}\\cos ${Qn} - \\sin ${Pm}\\sin ${Qn}`, "cc+": `\\cos ${Pm}\\cos ${Qn} + \\sin ${Pm}\\sin ${Qn}` }[pat];
      const fn = pat[0] === "s" ? "sin" : "cos", k = pat === "sc+" || pat === "cc-" ? mm + n : mm - n, other = k === mm + n ? mm - n : mm + n;
      const o = (f, kk, why) => ({ text: `$${FN[f]} ${coef(kk, "x")}$`, value: [f, kk], why });
      const rule = { "sc+": "\\sin A\\cos B + \\cos A\\sin B = \\sin(A + B)", "sc-": "\\sin A\\cos B - \\cos A\\sin B = \\sin(A - B)", "cc-": "\\cos A\\cos B - \\sin A\\sin B = \\cos(A + B)", "cc+": "\\cos A\\cos B + \\sin A\\sin B = \\cos(A - B)" }[pat];
      return { params: { pat, m: mm, n }, stem: `Consider the expression $${ex}$.`, parts: [
        P("Which expression is it equal to, for all values of $x$?", 1, ans.choice(rng, o(fn, k), [
          o(fn, other, fn === "cos" ? "For cosine the sign in the expansion is the opposite of the sign in the angle." : "The sign in the angle is the same as the sign in the expansion."),
          o(fn === "sin" ? "cos" : "sin", k, "This pattern of products belongs to the other function."),
          o(fn === "sin" ? "cos" : "sin", other, "This pattern of products belongs to the other function.")]), [
          `$${rule}$`, `With $A = ${Pm}$ and $B = ${Qn}$, the expression is $${FN[fn]} ${coef(k, "x")}$.`])] };
    } });

  reg({ type: "t3-ahl-compound-angle", unknown: "from-ratios", representation: "equation", format: "value", levels: [2], syllabus: ["3.10"],
    skills: ["AHL3.10.compound-angle", "AHL3.10.exact-value"], title: "Use compound angle identities with given ratios",
    build({ rng }) {
      let t1, t2, sA, sB, sum, dif;
      do {
        t1 = rng.pick(TRIPLES); t2 = rng.pick(TRIPLES); sA = rng.sign(); sB = rng.sign();
        // sin A = b1/c1, cos A = sA a1/c1; cos B = sB a2/c2, sin B = b2/c2
        sum = t1[1] * sB * t2[0] + sA * t1[0] * t2[1]; dif = sA * t1[0] * sB * t2[0] + t1[1] * t2[1];
      } while (sum === 0 || dif === 0 || t1[2] === t2[2] && rng.bool(0.7));
      const [a1, b1, c1] = t1, [a2, b2, c2] = t2, den = c1 * c2;
      const kind = (s) => (s > 0 ? "acute" : "obtuse");
      return { params: { sinA: b1 / c1, sA, cosB: (sB * a2) / c2 }, stem: `It is given that $\\sin A = ${frac(b1, c1)}$, where $A$ is ${kind(sA)}, and $\\cos B = ${frac(sB * a2, c2)}$, where $B$ is ${kind(sB)}.`, parts: [
        P("Find the exact value of $\\sin(A + B)$.", 2, ans.frac(sum, den), [
          `Since $A$ is ${kind(sA)}, $\\cos A = ${frac(sA * a1, c1)}$. Since $B$ is ${kind(sB)}, $\\sin B = ${frac(b2, c2)}$.`,
          "$\\sin(A + B) = \\sin A\\cos B + \\cos A\\sin B$",
          `$= ${frac(b1, c1)} \\times ${pf(sB * a2, c2)} + ${pf(sA * a1, c1)} \\times ${frac(b2, c2)}$`,
          `$= ${frac(sum, den)}$`]),
        P("Find the exact value of $\\cos(A - B)$.", 2, ans.frac(dif, den), [
          "$\\cos(A - B) = \\cos A\\cos B + \\sin A\\sin B$",
          `$= ${pf(sA * a1, c1)} \\times ${pf(sB * a2, c2)} + ${frac(b1, c1)} \\times ${frac(b2, c2)}$`,
          `$= ${frac(dif, den)}$`])] };
    } });

  reg({ type: "t3-ahl-compound-angle", unknown: "exact-surd", representation: "equation", format: "mcq", levels: [2], syllabus: ["3.10"],
    skills: ["AHL3.10.exact-value", "AHL3.10.compound-angle"], title: "Exact value of a ratio of a non-standard angle",
    build({ rng }) {
      const deg = rng.pick([15, 75, 105, 165]), fn = rng.pick(["sin", "cos", "tan"]), inRad = rng.bool();
      const ang = (d) => (inRad ? piFrac(d, 180) : `${d}^\\circ`), big = (d) => (inRad ? `\\left(${piFrac(d, 180)}\\right)` : `${d}^\\circ`);
      const two = (s1, s2) => ({ val: (s1 * Math.sqrt(6) + s2 * Math.sqrt(2)) / 4, tex: s1 > 0 ? `\\dfrac{\\sqrt{6} ${s2 > 0 ? "+" : "-"} \\sqrt{2}}{4}` : s2 > 0 ? "\\dfrac{\\sqrt{2} - \\sqrt{6}}{4}" : "-\\dfrac{\\sqrt{6} + \\sqrt{2}}{4}" });
      const tn = (s1, s2) => ({ val: s1 * 2 + s2 * Math.sqrt(3), tex: s1 > 0 ? `2 ${s2 > 0 ? "+" : "-"} \\sqrt{3}` : s2 > 0 ? "\\sqrt{3} - 2" : "-2 - \\sqrt{3}" });
      const all = fn === "tan" ? [tn(1, 1), tn(1, -1), tn(-1, 1), tn(-1, -1)] : [two(1, 1), two(1, -1), two(-1, 1), two(-1, -1)];
      const truth = { sin: Math.sin, cos: Math.cos, tan: Math.tan }[fn](rad(deg));
      const right = all.find((x) => Math.abs(x.val - truth) < 1e-9);
      const o = (x) => ({ text: `$${x.tex}$`, value: x.val, why: x === right ? undefined : Math.abs(x.val + truth) < 1e-9 ? "The size is right but the sign is wrong for this quadrant." : "A sign in the expansion is wrong." });
      let working;
      if (fn === "tan") {
        const [U, sg] = { 15: [60, -1], 75: [120, -1], 105: [60, 1], 165: [120, 1] }[deg], tU = U === 60 ? "\\sqrt{3}" : "-\\sqrt{3}", bU = U === 60 ? tU : `(${tU})`;
        working = [
          `$\\tan ${ang(deg)} = \\tan\\left(${ang(U)} ${sg > 0 ? "+" : "-"} ${ang(45)}\\right)$`,
          `$\\tan(A ${sg > 0 ? "+" : "-"} B) = \\dfrac{\\tan A ${sg > 0 ? "+" : "-"} \\tan B}{1 ${sg > 0 ? "-" : "+"} \\tan A\\tan B}$`,
          `$= \\dfrac{${tU} ${sg > 0 ? "+" : "-"} 1}{1 ${sg > 0 ? "-" : "+"} ${bU}}$`,
          `Multiplying the top and the bottom by the conjugate of the denominator gives $${right.tex}$.`];
      } else {
        const [U, V, sg] = { 15: [45, 30, -1], 75: [45, 30, 1], 105: [60, 45, 1], 165: [120, 45, 1] }[deg];
        const x = (f, d) => { const v = exactTrig(f, d); return v.val < 0 ? `\\left(${v.tex}\\right)` : v.tex; };
        const opS = fn === "sin" ? (sg > 0 ? "+" : "-") : sg > 0 ? "-" : "+";
        working = [
          `$${FN[fn]} ${ang(deg)} = ${FN[fn]}\\left(${ang(U)} ${sg > 0 ? "+" : "-"} ${ang(V)}\\right)$`,
          fn === "sin" ? `$= \\sin ${big(U)}\\cos ${big(V)} ${opS} \\cos ${big(U)}\\sin ${big(V)}$` : `$= \\cos ${big(U)}\\cos ${big(V)} ${opS} \\sin ${big(U)}\\sin ${big(V)}$`,
          fn === "sin" ? `$= ${x("sin", U)} \\times ${x("cos", V)} ${opS} ${x("cos", U)} \\times ${x("sin", V)}$` : `$= ${x("cos", U)} \\times ${x("cos", V)} ${opS} ${x("sin", U)} \\times ${x("sin", V)}$`,
          `$= ${right.tex}$`];
      }
      return { params: { fn, deg }, stem: `Consider the angle $${ang(deg)}$${inRad ? " radians" : ""}.`, parts: [
        P(`Use a compound angle identity to decide which is the exact value of $${FN[fn]} ${ang(deg)}$.`, 3, ans.choice(rng, o(right), all.filter((x) => x !== right).map(o)), working)] };
    } });

  reg({ type: "t3-ahl-compound-angle", unknown: "tan-compound", representation: "equation", format: "value", levels: [3], syllabus: ["3.10"],
    skills: ["AHL3.10.compound-angle", "AHL3.10.tan-double-angle", "AHL3.10.exact-value"], title: "Use the compound and double angle identities for tan",
    build({ rng }) {
      const pool = [[1, 2, 1, 3], [1, 4, 3, 5], [2, 3, 1, 5], [3, 4, 1, 7], [2, 1, 3, 1], [4, 1, 5, 3], [5, 1, 3, 2], [1, 6, 5, 7], [2, 5, 3, 7], [1, 8, 7, 9]];
      let [pn, pd, qn, qd] = rng.pick(pool);
      if (rng.bool()) [pn, pd, qn, qd] = [qn, qd, pn, pd];
      const p = rat.Q(pn, pd), q = rat.Q(qn, qd), top = rat.add(p, q), bot = rat.sub(1, rat.mul(p, q)), t = rat.div(top, bot);
      const d2 = rat.sub(1, rat.mul(p, p)), t2 = rat.div(rat.mul(2, p), d2), sumDeg = t.n > 0 ? 45 : 135;
      return { params: { p: pn / pd, q: qn / qd }, stem: `The acute angles $A$ and $B$ satisfy $\\tan A = ${rat.tex(p)}$ and $\\tan B = ${rat.tex(q)}$.`, parts: [
        P("Find the value of $\\tan(A + B)$.", 2, ans.int(t.n), [
          "$\\tan(A + B) = \\dfrac{\\tan A + \\tan B}{1 - \\tan A\\tan B}$",
          `$\\tan A + \\tan B = ${rat.tex(top)}$ and $1 - \\tan A\\tan B = ${rat.tex(bot)}$`,
          `$\\tan(A + B) = ${t.n}$`]),
        P("Hence find the exact value of $A + B$.", 2, piAns(sumDeg), [
          "Both angles are acute, so $0 < A + B < \\pi$.",
          `The only angle in that interval with tangent $${t.n}$ is $${piFrac(sumDeg, 180)}$.`]),
        P("Find the exact value of $\\tan 2A$.", 2, ans.frac(t2.n, t2.d), [
          "$\\tan 2A = \\dfrac{2\\tan A}{1 - \\tan^{2}A}$",
          `$2\\tan A = ${rat.tex(rat.mul(2, p))}$ and $1 - \\tan^{2}A = ${rat.tex(d2)}$`,
          `$\\tan 2A = ${rat.tex(t2)}$`])] };
    } });

  reg({ type: "t3-ahl-compound-angle", unknown: "tan-double", representation: "equation", format: "value", levels: [2], syllabus: ["3.10"],
    skills: ["AHL3.10.tan-double-angle", "AHL3.10.compound-angle"], title: "Use the double angle identity for tan",
    build({ rng }) {
      const [n, d] = rng.pick([[1, 2], [1, 3], [2, 1], [3, 1], [2, 3], [3, 4], [1, 4], [-1, 2], [-2, 1], [3, 2], [-1, 3], [4, 3], [-3, 1], [1, 5], [-2, 3]]);
      const t = rat.Q(n, d), d2 = rat.sub(1, rat.mul(t, t)), t2 = rat.div(rat.mul(2, t), d2), up = rat.add(1, t), dn = rat.sub(1, t), tq = rat.div(up, dn);
      return { params: { t: n / d }, stem: `It is given that $\\tan\\theta = ${rat.tex(t)}$.`, parts: [
        P("Find the exact value of $\\tan 2\\theta$.", 2, ans.frac(t2.n, t2.d), [
          "$\\tan 2\\theta = \\dfrac{2\\tan\\theta}{1 - \\tan^{2}\\theta}$",
          `$2\\tan\\theta = ${rat.tex(rat.mul(2, t))}$ and $1 - \\tan^{2}\\theta = ${rat.tex(d2)}$`,
          `$\\tan 2\\theta = ${rat.tex(t2)}$`]),
        P("Find the exact value of $\\tan\\left(\\theta + \\dfrac{\\pi}{4}\\right)$.", 2, ans.frac(tq.n, tq.d), [
          "$\\tan\\left(\\theta + \\dfrac{\\pi}{4}\\right) = \\dfrac{\\tan\\theta + 1}{1 - \\tan\\theta}$, because $\\tan\\dfrac{\\pi}{4} = 1$",
          `$\\tan\\theta + 1 = ${rat.tex(up)}$ and $1 - \\tan\\theta = ${rat.tex(dn)}$`,
          `$\\tan\\left(\\theta + \\dfrac{\\pi}{4}\\right) = ${rat.tex(tq)}$`])] };
    } });

  reg({ type: "t3-ahl-compound-angle", unknown: "solve-equation", representation: "equation", format: "value", levels: [3], syllabus: ["3.10"], fixedPool: true,
    skills: ["AHL3.10.solve-equation", "AHL3.10.compound-angle"], title: "Solve an equation by expanding a compound angle",
    build({ rng }) {
      const h = "\\dfrac{1}{2}", r3 = "\\dfrac{\\sqrt{3}}{2}", r2 = "\\dfrac{\\sqrt{2}}{2}", th = "\\dfrac{3}{2}";
      const L = (f, s, a) => `${FN[f]}\\left(x ${s > 0 ? "+" : "-"} ${piFrac(a, 180)}\\right)`;
      // [function, sign, alpha, k, right side, expanded, collected, tan x as n sqrt(r)/d, base angle]
      const c = rng.pick([
        ["sin", 1, 30, 2, "2\\cos x", `${r3}\\sin x + ${h}\\cos x = 2\\cos x`, `${r3}\\sin x = ${th}\\cos x`, [1, 3, 1], 60],
        ["sin", 1, 30, 1, "\\cos x", `${r3}\\sin x + ${h}\\cos x = \\cos x`, `${r3}\\sin x = ${h}\\cos x`, [1, 3, 3], 30],
        ["sin", 1, 30, -1, "-\\cos x", `${r3}\\sin x + ${h}\\cos x = -\\cos x`, `${r3}\\sin x = -${th}\\cos x`, [-1, 3, 1], 120],
        ["sin", 1, 60, Math.sqrt(3), "\\sqrt{3}\\cos x", `${h}\\sin x + ${r3}\\cos x = \\sqrt{3}\\cos x`, `${h}\\sin x = ${r3}\\cos x`, [1, 3, 1], 60],
        ["sin", 1, 45, Math.sqrt(2), "\\sqrt{2}\\cos x", `${r2}\\sin x + ${r2}\\cos x = \\sqrt{2}\\cos x`, `${r2}\\sin x = ${r2}\\cos x`, [1, 1, 1], 45],
        ["sin", -1, 30, 1, "\\cos x", `${r3}\\sin x - ${h}\\cos x = \\cos x`, `${r3}\\sin x = ${th}\\cos x`, [1, 3, 1], 60],
        ["sin", -1, 30, -2, "-2\\cos x", `${r3}\\sin x - ${h}\\cos x = -2\\cos x`, `${r3}\\sin x = -${th}\\cos x`, [-1, 3, 1], 120],
        ["sin", -1, 30, -1, "-\\cos x", `${r3}\\sin x - ${h}\\cos x = -\\cos x`, `${r3}\\sin x = -${h}\\cos x`, [-1, 3, 3], 150],
        ["cos", 1, 30, -1, "-\\sin x", `${r3}\\cos x - ${h}\\sin x = -\\sin x`, `${r3}\\cos x = -${h}\\sin x`, [-1, 3, 1], 120],
        ["cos", 1, 30, -2, "-2\\sin x", `${r3}\\cos x - ${h}\\sin x = -2\\sin x`, `${r3}\\cos x = -${th}\\sin x`, [-1, 3, 3], 150],
        ["cos", 1, 30, 1, "\\sin x", `${r3}\\cos x - ${h}\\sin x = \\sin x`, `${r3}\\cos x = ${th}\\sin x`, [1, 3, 3], 30],
        ["cos", -1, 60, 2, "2\\cos x", `${h}\\cos x + ${r3}\\sin x = 2\\cos x`, `${r3}\\sin x = ${th}\\cos x`, [1, 3, 1], 60],
        ["cos", -1, 60, -1, "-\\cos x", `${h}\\cos x + ${r3}\\sin x = -\\cos x`, `${r3}\\sin x = -${th}\\cos x`, [-1, 3, 1], 120]]);
      const [f, s, al, k, rhs, expd, coll, tt, base] = c, T = sq(tt[0], tt[1], tt[2]), other = rhs.includes("cos") ? "cos" : "sin";
      const rule = f === "sin" ? `\\sin(A ${s > 0 ? "+" : "-"} B) = \\sin A\\cos B ${s > 0 ? "+" : "-"} \\cos A\\sin B` : `\\cos(A ${s > 0 ? "+" : "-"} B) = \\cos A\\cos B ${s > 0 ? "-" : "+"} \\sin A\\sin B`;
      return { params: { f, s, al, k, other }, stem: `Consider the equation $${L(f, s, al)} = ${rhs}$, for $0 \\le x \\le 2\\pi$.`, parts: [
        P("Find the exact value of $\\tan x$.", 3, ans.exact(T.val, T.tex), [
          `$${rule}$`, `$${expd}$`, `$${coll}$`, `Dividing by $\\cos x$ and rearranging: $\\tan x = ${T.tex}$`]),
        P("Find the smaller solution of the equation, giving an exact answer.", 2, piAns(base), [
          `$\\tan x = ${T.tex}$ has reference angle $${piFrac(base > 90 ? 180 - base : base, 180)}$, and $\\tan x$ is ${posneg(T.val)}.`,
          `The smaller solution is $x = ${piFrac(base, 180)}$.`]),
        P("Find the larger solution of the equation, giving an exact answer.", 1, piAns(base + 180), [
          `$\\tan x$ repeats every $\\pi$, so the other solution is $x = ${piFrac(base, 180)} + \\pi = ${piFrac(base + 180, 180)}$.`])] };
    } });

  // ======================= 3.11 symmetry relations =======================
  // RULES[argument][function] = [sign, function of theta]
  const RULES = {
    "pi-": { sin: [1, "sin"], cos: [-1, "cos"], tan: [-1, "tan"] }, "pi+": { sin: [-1, "sin"], cos: [-1, "cos"], tan: [1, "tan"] },
    neg: { sin: [-1, "sin"], cos: [1, "cos"], tan: [-1, "tan"] }, "half-": { sin: [1, "cos"], cos: [1, "sin"], tan: [1, "cot"] },
    "half+": { sin: [1, "cos"], cos: [-1, "sin"], tan: [-1, "cot"] }, "2pi-": { sin: [-1, "sin"], cos: [1, "cos"], tan: [-1, "tan"] },
  };
  const ARG = { "pi-": "\\pi - \\theta", "pi+": "\\pi + \\theta", neg: "-\\theta", "half-": "\\dfrac{\\pi}{2} - \\theta", "half+": "\\dfrac{\\pi}{2} + \\theta", "2pi-": "2\\pi - \\theta" };
  const WHY = {
    "pi-": "The angle $\\pi - \\theta$ is the reflection of $\\theta$ in the $y$-axis: on the unit circle the $y$-coordinate is unchanged and the $x$-coordinate changes sign.",
    "pi+": "The angle $\\pi + \\theta$ is a half turn on from $\\theta$: both coordinates on the unit circle change sign.",
    neg: "The angle $-\\theta$ is the reflection of $\\theta$ in the $x$-axis: on the unit circle the $x$-coordinate is unchanged and the $y$-coordinate changes sign.",
    "half-": "The angles $\\theta$ and $\\dfrac{\\pi}{2} - \\theta$ are complementary: the sine of one is the cosine of the other.",
    "half+": "Adding $\\dfrac{\\pi}{2}$ is a quarter turn anticlockwise: the point $(x,\\, y)$ on the unit circle moves to $(-y,\\, x)$.",
    "2pi-": "The angle $2\\pi - \\theta$ is in the same position as $-\\theta$, the reflection of $\\theta$ in the $x$-axis.",
  };
  const symT = (f, a) => `${FN[f]}${a.startsWith("half") ? `\\left(${ARG[a]}\\right)` : `(${ARG[a]})`}`;
  const resT = (r) => `${r[0] < 0 ? "-" : ""}${FN[r[1]]}\\theta`;
  const COMBOS = Object.keys(RULES).flatMap((a) => ["sin", "cos", "tan"].map((f) => [f, a]));

  reg({ type: "t3-ahl-trig-symmetry", unknown: "equivalent", representation: "equation", format: "mcq", levels: [1], syllabus: ["3.11"],
    skills: ["AHL3.11.symmetry-relations"], title: "Use a symmetry relation of a trigonometric function",
    build({ rng }) {
      const [f, a] = rng.pick(COMBOS), r = RULES[a][f];
      const names = f === "tan" ? ["tan", "cot"] : ["sin", "cos"];
      const o = (s, nm) => ({ text: `$${resT([s, nm])}$`, value: [s, nm], why: nm === r[1] ? "The sign is wrong." : "The function is wrong: check whether this relation changes the function." });
      return { params: { f, a }, stem: `Consider the expression $${symT(f, a)}$.`, parts: [
        P("Which expression is it equal to, for all values of $\\theta$ where both are defined?", 1, ans.choice(rng, o(r[0], r[1]), [o(-r[0], r[1]), o(r[0], names.find((x) => x !== r[1])), o(-r[0], names.find((x) => x !== r[1]))]), [
          WHY[a], `$${symT(f, a)} = ${resT(r)}$`])] };
    } });

  reg({ type: "t3-ahl-trig-symmetry", unknown: "related-values", representation: "equation", format: "value", levels: [2], syllabus: ["3.11"],
    skills: ["AHL3.11.related-values", "AHL3.11.symmetry-relations"], title: "Find related values using the symmetries of the trigonometric functions",
    build({ rng }) {
      const [a, b, c] = rng.pick(TRIPLES);
      let picks;
      do { picks = rng.sample(COMBOS, 4); } while (new Set(picks.map((x) => x[1])).size < 3 || new Set(picks.map((x) => x[0])).size < 2);
      const base = { sin: [b, c], cos: [a, c], tan: [b, a], cot: [a, b] };
      return { params: { sin: b / c, cos: a / c, picks }, stem: `It is given that $\\sin\\theta = ${frac(b, c)}$ and $\\cos\\theta = ${frac(a, c)}$.`, parts: picks.map(([f, g]) => {
        const r = RULES[g][f], v = base[r[1]];
        return P(`Write down the value of $${symT(f, g)}$.`, 1, ans.frac(r[0] * v[0], v[1]), [
          `$${symT(f, g)} = ${resT(r)}$`, `$${resT(r)} = ${frac(r[0] * v[0], v[1])}$`]);
      }) };
    } });

  reg({ type: "t3-ahl-trig-symmetry", unknown: "simplify-evaluate", representation: "equation", format: "value", levels: [3], syllabus: ["3.11"],
    skills: ["AHL3.11.simplify-expression", "AHL3.11.symmetry-relations", "AHL3.11.related-values"], title: "Simplify an expression with symmetry relations and evaluate it",
    build({ rng }) {
      const base = rng.pick(["sin", "cos", "tan"]), fam = COMBOS.filter(([f, a]) => RULES[a][f][1] === base);
      let t1, t2, p, q, K;
      do { [t1, t2] = rng.sample(fam, 2); p = rng.int(1, 5); q = rng.nonzero(-5, 5); K = p * RULES[t1[1]][t1[0]][0] + q * RULES[t2[1]][t2[0]][0]; } while (K === 0 || Math.abs(K) === 1 && rng.bool(0.6));
      const s1 = RULES[t1[1]][t1[0]][0], s2 = RULES[t2[1]][t2[0]][0];
      const ex = expr([[p, symT(t1[0], t1[1])], [q, symT(t2[0], t2[1])]]), B = `${FN[base]}\\theta`;
      const o = (k, f, why) => ({ text: `$${coef(k, `${FN[f]}\\theta`)}$`, value: [k, f], why });
      const otherF = base === "sin" ? "cos" : base === "cos" ? "sin" : "cot";
      const wrongs = [[p * s1 - q * s2, base, "One of the two signs is wrong."], [-K, base, "Both signs are wrong."], [-p * s1 + q * s2, base, "One of the two signs is wrong."], [p + q, base, "The signs from the symmetry relations have been ignored."], [K, otherF, "The function is wrong."], [-K, otherF, "The function is wrong."]]
        .filter((w) => w[0] !== 0 && !(w[0] === K && w[1] === base)).map((w) => o(w[0], w[1], w[2]));
      const [a, b, c] = rng.pick(TRIPLES), quad = rng.int(2, 4), sx = quad === 4 ? 1 : -1, sy = quad === 2 ? 1 : -1;
      const given = base === "sin" ? ["\\cos", sx * a, c] : ["\\sin", sy * b, c];
      const bv = base === "sin" ? [sy * b, c] : base === "cos" ? [sx * a, c] : [sx * sy * b, a];
      const res = rat.Q(K * bv[0], bv[1]);
      const w2 = base === "sin" ? [`$\\sin^{2}\\theta = 1 - \\cos^{2}\\theta = 1 - \\dfrac{${a * a}}{${c * c}} = \\dfrac{${b * b}}{${c * c}}$`, `In this interval $\\sin\\theta$ is ${posneg(sy)}, so $\\sin\\theta = ${frac(sy * b, c)}$.`]
        : base === "cos" ? [`$\\cos^{2}\\theta = 1 - \\sin^{2}\\theta = 1 - \\dfrac{${b * b}}{${c * c}} = \\dfrac{${a * a}}{${c * c}}$`, `In this interval $\\cos\\theta$ is ${posneg(sx)}, so $\\cos\\theta = ${frac(sx * a, c)}$.`]
        : [`$\\cos^{2}\\theta = 1 - \\sin^{2}\\theta = \\dfrac{${a * a}}{${c * c}}$, and in this interval $\\cos\\theta$ is ${posneg(sx)}, so $\\cos\\theta = ${frac(sx * a, c)}$.`, `$\\tan\\theta = \\dfrac{\\sin\\theta}{\\cos\\theta} = ${frac(sx * sy * b, a)}$`];
      return { params: { base, t1, t2, p, q, given: base === "sin" ? "cos" : "sin", gv: given[1] / given[2], quad }, stem: `Let $E = ${ex}$.`, parts: [
        P("Which expression is equal to $E$?", 2, ans.choice(rng, o(K, base), wrongs), [
          `$${symT(t1[0], t1[1])} = ${resT([s1, base])}$`, `$${symT(t2[0], t2[1])} = ${resT([s2, base])}$`,
          `$E = ${expr([[p * s1, B], [q * s2, B]])} = ${coef(K, B)}$`]),
        P(`It is given that $${given[0]}\\theta = ${frac(given[1], given[2])}$ and $${INTERVAL[quad]}$. Find the exact value of $E$.`, 3, ans.frac(res.n, res.d), w2.concat([
          Math.abs(K) === 1 ? `$E = ${coef(K, B)} = ${rat.tex(res)}$` : `$E = ${coef(K, B)} = ${K} \\times ${pf(bv[0], bv[1])} = ${rat.tex(res)}$`]))] };
    } });

  // ---- vectors ---------------------------------------------------------------------
  const vadd = (a, b) => a.map((x, i) => x + b[i]), vsub = (a, b) => a.map((x, i) => x - b[i]), vmul = (k, a) => a.map((x) => k * x || 0);
  const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0), n2 = (a) => dot(a, a), norm = (a) => Math.sqrt(n2(a));
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]].map((x) => x || 0);
  const isZeroV = (a) => a.every((x) => x === 0), parallel = (a, b) => isZeroV(cross(a, b));
  const zeros = (a) => a.filter((x) => x === 0).length;
  const prim = (a) => { const g = a.reduce((s, x) => gcd(s, x), 0) || 1; return a.map((x) => x / g || 0); };
  const isSq = (n) => Number.isInteger(Math.sqrt(n));
  const tx = (x) => (typeof x === "string" ? x : num(x));
  const col = (v) => `\\begin{pmatrix} ${v.map(tx).join(" \\\\ ")} \\end{pmatrix}`;
  const bv = (s) => `\\boldsymbol{${s}}`, arrow = (s) => `\\overrightarrow{\\mathrm{${s}}}`;
  const coords = (v) => wrap(v.map(tx).join(",\\, "));
  const pt = (name, v) => `\\mathrm{${name}}${coords(v)}`;
  const ijk = (v) => expr([[v[0], bv("i")], [v[1], bv("j")], [v[2], bv("k")]]);
  const lineT = (a, d, par, name) => `${name || bv("r")} = ${col(a)} + ${par || "\\lambda"}${col(d)}`;
  const planeT = (n, d) => `${expr([[n[0], "x"], [n[1], "y"], [n[2], "z"]])} = ${num(d)}`;
  const dotW = (a, b) => a.map((x, i) => `${br(x)}${br(b[i])}`).join(" + ");
  const normW = (a) => `\\sqrt{${a.map((x) => `${paren(x)}^{2}`).join(" + ")}}`;
  const crossW = (a, b) => col([`${br(a[1])}${br(b[2])} - ${br(a[2])}${br(b[1])}`, `${br(a[2])}${br(b[0])} - ${br(a[0])}${br(b[2])}`, `${br(a[0])}${br(b[1])} - ${br(a[1])}${br(b[0])}`]);
  const rvec = (rng, lo, hi) => [rng.int(lo, hi), rng.int(lo, hi), rng.int(lo, hi)];
  const vopt = (v, why) => ({ text: `$${col(v)}$`, value: v, why });
  const popt = (v, why) => ({ text: `$${coords(v)}$`, value: v, why });
  const lopt = (p, d, why, par) => ({ text: `$${lineT(p, d, par)}$`, value: { p, d }, why });
  const sameV = (a, b) => a.every((x, i) => x === b[i]);
  const ORD = ["first", "second", "third"], AX = ["x", "y", "z"];
  // integer vectors with a whole-number length
  const QUADS = [[1, 2, 2, 3], [2, 3, 6, 7], [1, 4, 8, 9], [4, 4, 7, 9], [2, 6, 9, 11], [6, 6, 7, 11], [0, 3, 4, 5], [2, 4, 4, 6], [3, 4, 12, 13]];
  const intNorm = (rng, max, noZero) => { const q = rng.pick(QUADS.filter((x) => x[3] <= (max || 13) && !(noZero && x[0] === 0))); return { v: rng.shuffle(q.slice(0, 3)).map((x) => x * rng.sign() || 0), n: q[3] }; };
  // wrong answers for a vector product a x b
  const crossWrongs = (a, b, orderWhy) => { const n = cross(a, b); return [
    vopt(vmul(-1, n), orderWhy || "This is the product in the other order: every sign is reversed."),
    vopt([n[0], -n[1] || 0, n[2]], "The middle component has the wrong sign."),
    vopt([a[0] * b[0], a[1] * b[1], a[2] * b[2]], "This multiplies matching components; that is not the vector product."),
    vopt([n[0], n[1], -n[2] || 0], "The last component has the wrong sign."),
    vopt([-n[0] || 0, n[1], n[2]], "The first component has the wrong sign.")]; };

  // ======================= 3.12 vector algebra =======================
  reg({ type: "t3-ahl-vector-basics", unknown: "displacement", representation: "equation", format: "mcq", levels: [1], syllabus: ["3.12"],
    skills: ["AHL3.12.position-displacement"], title: "Find the displacement vector between two points",
    build({ rng }) {
      let A, B;
      do { A = rvec(rng, -6, 7); B = rvec(rng, -6, 7); } while (zeros(vsub(B, A)) > 0 || zeros(A) > 0 || zeros(B) > 1);
      const AB = vsub(B, A);
      return { params: { A, B }, stem: `The points $\\mathrm{A}$ and $\\mathrm{B}$ have coordinates $${coords(A)}$ and $${coords(B)}$ respectively.`, parts: [
        P(`Find $${arrow("AB")}$.`, 1, ans.choice(rng, vopt(AB), [
          vopt(vsub(A, B), `This is $${arrow("BA")}$: subtract the position vector of $\\mathrm{A}$ from that of $\\mathrm{B}$.`),
          vopt(vadd(A, B), "The position vectors have been added instead of subtracted."),
          vopt([AB[0], -AB[1], AB[2]], "One component has a sign error."),
          vopt(A.map((x, i) => x * B[i]), "The coordinates have been multiplied.")]), [
          `$${arrow("AB")} = ${arrow("OB")} - ${arrow("OA")}$`, `$${arrow("AB")} = ${col(B)} - ${col(A)} = ${col(AB)}$`])] };
    } });

  reg({ type: "t3-ahl-vector-basics", unknown: "magnitude", representation: "equation", format: "value", levels: [1], syllabus: ["3.12"],
    skills: ["AHL3.12.magnitude-unit"], title: "Find the magnitude of a vector",
    build({ rng }) {
      const { v, n } = intNorm(rng), asIjk = rng.bool();
      return { params: { v }, stem: `Consider the vector $${bv("v")} = ${asIjk ? ijk(v) : col(v)}$.`, parts: [
        P(`Find $|${bv("v")}|$.`, 1, ans.int(n), [`$|${bv("v")}| = ${normW(v)}$`, `$= \\sqrt{${n * n}} = ${n}$`])] };
    } });

  reg({ type: "t3-ahl-vector-basics", unknown: "distance-unit", representation: "equation", format: "value", levels: [2], syllabus: ["3.12"],
    skills: ["AHL3.12.distance-between-points", "AHL3.12.magnitude-unit", "AHL3.12.vector-algebra"], title: "Distance between two points, a unit vector and a point from a vector relation",
    build({ rng }) {
      const { v: AB, n } = intNorm(rng, 9, true), A = rvec(rng, -5, 6), B = vadd(A, AB), k = rng.pick([2, 3, -1, -2]), C = vadd(A, vmul(k, AB));
      const u = (s, w, why) => ({ text: `$${s}${col(w)}$`, value: s, why });
      return { params: { A, B, k }, stem: `The points $\\mathrm{A}$ and $\\mathrm{B}$ have coordinates $${coords(A)}$ and $${coords(B)}$ respectively.`, parts: [
        P("Find the distance between $\\mathrm{A}$ and $\\mathrm{B}$.", 2, ans.int(n), [
          `$${arrow("AB")} = ${col(B)} - ${col(A)} = ${col(AB)}$`, `$|${arrow("AB")}| = ${normW(AB)} = \\sqrt{${n * n}}$`, `The distance is $${n}$.`]),
        P(`Which is the unit vector in the direction of $${arrow("AB")}$?`, 1, ans.choice(rng, { text: `$\\dfrac{1}{${n}}${col(AB)}$`, value: "unit" }, [
          { text: `$\\dfrac{1}{${n * n}}${col(AB)}$`, value: "square", why: "Divide by the magnitude, not by its square." },
          { text: `$\\dfrac{1}{${n}}${col(vmul(-1, AB))}$`, value: "back", why: `This is in the direction of $${arrow("BA")}$.` },
          { text: `$${n}${col(AB)}$`, value: "times", why: "Multiplying by the magnitude makes the vector longer, not of length one." }]), [
          `A unit vector is the vector divided by its magnitude: $\\dfrac{1}{${n}}${col(AB)}$`]),
        P(`The point $\\mathrm{C}$ is such that $${arrow("AC")} = ${coef(k, arrow("AB"))}$. Which are the coordinates of $\\mathrm{C}$?`, 1, ans.choice(rng, popt(C), [
          popt(vadd(B, vmul(k, AB)), "The vector must be added to the position vector of $\\mathrm{A}$, not of $\\mathrm{B}$."),
          popt(vmul(k, AB), `This is $${arrow("AC")}$ itself, not the position of $\\mathrm{C}$.`),
          popt(vmul(k, B), `This is $${coef(k, arrow("OB"))}$.`),
          popt(vadd(A, vmul(-k, AB)), "The direction is reversed.")]), [
          `$${arrow("OC")} = ${arrow("OA")} + ${arrow("AC")} = ${col(A)} ${k < 0 ? "-" : "+"} ${Math.abs(k) === 1 ? "" : Math.abs(k)}${col(AB)}$`, `$\\mathrm{C}$ is $${coords(C)}$.`])] };
    } });

  reg({ type: "t3-ahl-vector-basics", unknown: "parallel-unknown", representation: "equation", format: "value", levels: [2], syllabus: ["3.12"],
    skills: ["AHL3.12.parallel-vectors", "AHL3.12.vector-algebra"], title: "Find unknown components of parallel vectors",
    build({ rng }) {
      const [kn, kd] = rng.pick([[2, 1], [-2, 1], [3, 1], [-3, 1], [-1, 2], [3, 2], [-3, 2], [1, 2], [-4, 1], [5, 2]]);
      let a;
      do { a = [rng.nonzero(-4, 4), rng.nonzero(-4, 4), rng.nonzero(-4, 4)].map((x) => x * kd); } while (new Set(a.map(Math.abs)).size < 2);
      const b = a.map((x) => (x * kn) / kd), [i, j, mm] = rng.shuffle([0, 1, 2]);
      const aT = a.map((x, t) => (t === i ? "p" : x)), bT = b.map((x, t) => (t === j ? "q" : x));
      return { params: { a: a.map((x, t) => (t === i ? null : x)), b: b.map((x, t) => (t === j ? null : x)) }, stem: `The vectors $${bv("a")} = ${col(aT)}$ and $${bv("b")} = ${col(bT)}$ are parallel.`, parts: [
        P("Find the value of $p$.", 2, ans.int(a[i]), [
          `Parallel vectors are scalar multiples of each other: $${bv("b")} = k${bv("a")}$.`,
          `The ${ORD[mm]} components give $${b[mm]} = ${coef(a[mm], "k")}$, so $k = ${frac(kn, kd)}$.`,
          `The ${ORD[i]} components give $${b[i]} = ${frac(kn, kd)}p$, so $p = ${a[i]}$.`]),
        P("Find the value of $q$.", 1, ans.int(b[j]), [`The ${ORD[j]} components give $q = ${frac(kn, kd)} \\times ${paren(a[j])} = ${b[j]}$.`])] };
    } });

  reg({ type: "t3-ahl-vector-basics", unknown: "collinear", representation: "equation", format: "value", levels: [3], syllabus: ["3.12"],
    skills: ["AHL3.12.parallel-vectors", "AHL3.12.distance-between-points", "AHL3.12.position-displacement"], title: "Collinear points: a scalar multiple, unknown coordinates and a distance",
    build({ rng }) {
      const { v: AB, n } = intNorm(rng, 9, true), A = rvec(rng, -5, 6), B = vadd(A, AB);
      const even = AB.every((x) => x % 2 === 0), t = rat.Q(...rng.pick(even ? [[3, 2], [-1, 2], [5, 2], [-3, 2], [3, 1], [-2, 1]] : [[2, 1], [3, 1], [-1, 1], [-2, 1], [4, 1], [-3, 1]]));
      const C = A.map((x, i) => x + (t.n * AB[i]) / t.d), [v, h1, h2] = rng.shuffle([0, 1, 2]), [i1, i2] = [h1, h2].sort();
      const cT = C.map((x, i) => (i === i1 ? "k" : i === i2 ? "m" : x)), tT = rat.tex(t), dist = rat.Q(Math.abs(t.n) * n, t.d);
      return { params: { A, B, C: C.map((x, i) => (i === v ? x : null)), v }, stem: `The points $\\mathrm{A}$ and $\\mathrm{B}$ have coordinates $${coords(A)}$ and $${coords(B)}$. The point $\\mathrm{C}$ has coordinates $${coords(cT)}$ and lies on the line through $\\mathrm{A}$ and $\\mathrm{B}$.`, parts: [
        P(`Find $|${arrow("AB")}|$.`, 2, ans.int(n), [`$${arrow("AB")} = ${col(AB)}$`, `$|${arrow("AB")}| = ${normW(AB)} = ${n}$`]),
        P(`It is given that $${arrow("AC")} = t\\,${arrow("AB")}$. Find the value of $t$.`, 2, ans.frac(t.n, t.d), [
          `The ${ORD[v]} component of $${arrow("AC")}$ is $${num(C[v])} - ${paren(A[v])} = ${num(C[v] - A[v])}$.`,
          `$${num(C[v] - A[v])} = ${coef(AB[v], "t")}$, so $t = ${tT}$.`]),
        P("Find the value of $k$.", 1, ans.int(C[i1]), [`$k = ${A[i1]} + ${t.d === 1 ? paren(t.n) : `\\left(${tT}\\right)`} \\times ${paren(AB[i1])} = ${C[i1]}$`]),
        P("Find the value of $m$.", 1, ans.int(C[i2]), [`$m = ${A[i2]} + ${t.d === 1 ? paren(t.n) : `\\left(${tT}\\right)`} \\times ${paren(AB[i2])} = ${C[i2]}$`]),
        P("Find the distance between $\\mathrm{A}$ and $\\mathrm{C}$.", 1, ans.frac(dist.n, dist.d), [`$|${arrow("AC")}| = |t| \\times |${arrow("AB")}| = ${rat.tex(rat.Q(Math.abs(t.n), t.d))} \\times ${n} = ${rat.tex(dist)}$`])] };
    } });

  reg({ type: "t3-ahl-vector-basics", unknown: "triangle-lengths", representation: "equation", format: "value", levels: [4], syllabus: ["3.12"], calculator: true,
    skills: ["AHL3.12.distance-between-points", "AHL3.12.position-displacement", "AHL3.12.vector-algebra"], title: "Lengths in a triangle and a parallelogram from position vectors",
    build({ rng }) {
      let A, B, C, AB, AM, BD;
      do {
        A = rvec(rng, -6, 8); B = rvec(rng, -6, 8); C = rvec(rng, -6, 8);
        AB = vsub(B, A); AM = vsub(vmul(0.5, vadd(B, C)), A); BD = vsub(vadd(A, C), vmul(2, B));
      } while (parallel(AB, vsub(C, A)) || isSq(n2(AB)) || zeros(AB) > 0 || n2(AM) < 4 || isSq(n2(BD)));
      const M = vmul(0.5, vadd(B, C)), D = vsub(vadd(A, C), B);
      return { params: { A, B, C }, stem: `The points $\\mathrm{A}$, $\\mathrm{B}$ and $\\mathrm{C}$ have position vectors $${bv("a")} = ${col(A)}$, $${bv("b")} = ${col(B)}$ and $${bv("c")} = ${col(C)}$. The point $\\mathrm{M}$ is the midpoint of $[\\mathrm{BC}]$.`, parts: [
        P("Find the length of $[\\mathrm{AB}]$.", 2, ans.sf(norm(AB)), [`$${arrow("AB")} = ${bv("b")} - ${bv("a")} = ${col(AB)}$`, `$|${arrow("AB")}| = ${normW(AB)} = \\sqrt{${n2(AB)}} = ${sf(norm(AB))}$`]),
        P("Find the length of the median $[\\mathrm{AM}]$.", 3, ans.sf(norm(AM)), [
          `$${arrow("OM")} = \\dfrac{1}{2}(${bv("b")} + ${bv("c")}) = ${col(M)}$`, `$${arrow("AM")} = ${col(M)} - ${col(A)} = ${col(AM)}$`,
          `$|${arrow("AM")}| = \\sqrt{${num(n2(AM))}} = ${sf(norm(AM))}$`]),
        P("The point $\\mathrm{D}$ is such that $\\mathrm{ABCD}$ is a parallelogram. Find the length of the diagonal $[\\mathrm{BD}]$.", 2, ans.sf(norm(BD)), [
          `$${arrow("AD")} = ${arrow("BC")}$, so $${arrow("OD")} = ${bv("a")} + ${bv("c")} - ${bv("b")} = ${col(D)}$`,
          `$${arrow("BD")} = ${col(BD)}$, so $|${arrow("BD")}| = \\sqrt{${n2(BD)}} = ${sf(norm(BD))}$`])] };
    } });

  // ======================= 3.13 scalar product =======================
  reg({ type: "t3-ahl-scalar-product", unknown: "dot-value", representation: "equation", format: "value", levels: [1], syllabus: ["3.13"],
    skills: ["AHL3.13.scalar-product"], title: "Compute a scalar product",
    build({ rng }) {
      let a, b;
      do { a = rvec(rng, -5, 5); b = rvec(rng, -5, 5); } while (zeros(a) + zeros(b) > 1 || isZeroV(a) || isZeroV(b));
      const asIjk = rng.bool(0.4);
      return { params: { a, b }, stem: `Let $${bv("a")} = ${asIjk ? ijk(a) : col(a)}$ and $${bv("b")} = ${asIjk ? ijk(b) : col(b)}$.`, parts: [
        P(`Find $${bv("a")} \\cdot ${bv("b")}$.`, 1, ans.int(dot(a, b)), [`$${bv("a")} \\cdot ${bv("b")} = ${dotW(a, b)}$`, `$= ${dot(a, b)}$`])] };
    } });

  reg({ type: "t3-ahl-scalar-product", unknown: "perpendicular-unknown", representation: "equation", format: "value", levels: [2], syllabus: ["3.13"],
    skills: ["AHL3.13.perpendicular-test", "AHL3.13.scalar-product"], title: "Find an unknown that makes two vectors perpendicular",
    build({ rng }) {
      let a, b, c, i, j, mm, K, C;
      do {
        a = [rng.nonzero(-5, 5), rng.nonzero(-5, 5), rng.nonzero(-5, 5)]; b = [rng.nonzero(-5, 5), rng.nonzero(-5, 5), rng.nonzero(-5, 5)];
        [i, j, mm] = rng.shuffle([0, 1, 2]); c = rng.pick([1, 1, 2, 3, -1, -2]);
        K = b[i] + c * a[j]; C = a[mm] * b[mm];                       // a.b = K k + C
      } while (K === 0 || Math.abs(K) === 1 && rng.bool(0.5) || rat.Q(-C, K).d > 6);
      const aT = a.map((x, t) => (t === i ? "k" : x)), bT = b.map((x, t) => (t === j ? coef(c, "k") : x)), k = rat.Q(-C, K);
      return { params: { a: a.map((x, t) => (t === i ? null : x)), b: b.map((x, t) => (t === j ? null : x)), c, i, j }, stem: `The vectors $${bv("a")} = ${col(aT)}$ and $${bv("b")} = ${col(bT)}$ are perpendicular.`, parts: [
        P("Find the value of $k$.", 3, ans.frac(k.n, k.d), [
          `Perpendicular vectors have $${bv("a")} \\cdot ${bv("b")} = 0$.`,
          `$${expr([0, 1, 2].map((t) => (t === i ? [b[i], "k"] : t === j ? [a[j] * c, "k"] : [a[t] * b[t], ""])))} = 0$`,
          `$${expr([[K, "k"], [C, ""]])} = 0$`, `$k = ${rat.tex(k)}$`])] };
    } });

  reg({ type: "t3-ahl-scalar-product", unknown: "angle", representation: "equation", format: "value", levels: [2], syllabus: ["3.13"], calculator: true,
    skills: ["AHL3.13.angle-between-vectors", "AHL3.13.scalar-product"], title: "Find the angle between two vectors",
    build({ rng }) {
      let a, b, th;
      do { a = rvec(rng, -6, 6); b = rvec(rng, -6, 6); th = (Math.acos(dot(a, b) / (norm(a) * norm(b))) * 180) / Math.PI; } while (zeros(a) + zeros(b) > 1 || !(th > 12 && th < 168) || Math.abs(th - 90) < 3 || Math.abs(th - Math.round(th)) < 0.02);
      const d = dot(a, b);
      return { params: { a, b }, stem: `Let $${bv("a")} = ${col(a)}$ and $${bv("b")} = ${col(b)}$.`, parts: [
        P(`Find $${bv("a")} \\cdot ${bv("b")}$.`, 1, ans.int(d), [`$${bv("a")} \\cdot ${bv("b")} = ${dotW(a, b)} = ${d}$`]),
        P(`Find the angle between $${bv("a")}$ and $${bv("b")}$, in degrees.`, 3, ans.sf(th, 3, { unit: "$^\\circ$", misconceptions: [{ value: 180 - th, text: "The sign of the scalar product was lost: a negative scalar product gives an obtuse angle." }] }), [
          `$|${bv("a")}| = \\sqrt{${n2(a)}}$ and $|${bv("b")}| = \\sqrt{${n2(b)}}$`,
          `$\\cos\\theta = \\dfrac{${bv("a")} \\cdot ${bv("b")}}{|${bv("a")}||${bv("b")}|} = \\dfrac{${d}}{\\sqrt{${n2(a)}}\\sqrt{${n2(b)}}}$`,
          `$\\theta = ${sf(th)}^\\circ$`])] };
    } });

  // pairs of small integer vectors whose angle is 30, 45, 60, 120, 135 or 150 degrees
  let nicePairs = null;
  function getNicePairs() {
    if (nicePairs) return nicePairs;
    const all = [];
    for (let x = -3; x <= 3; x++) for (let y = -3; y <= 3; y++) for (let z = -3; z <= 3; z++) if (x || y || z) all.push([x, y, z]);
    nicePairs = [];
    for (const u of all) for (const w of all) {
      const d = dot(u, w), pp = n2(u) * n2(w);
      if (d === 0 || zeros(u) + zeros(w) > 2 || n2(u) < 5 && n2(w) < 5) continue;
      const deg = 4 * d * d === pp ? 60 : 2 * d * d === pp ? 45 : 4 * d * d === 3 * pp ? 30 : 0;
      if (deg) nicePairs.push([u, w, d > 0 ? deg : 180 - deg]);
    }
    return nicePairs;
  }
  reg({ type: "t3-ahl-scalar-product", unknown: "exact-angle", representation: "equation", format: "value", levels: [3], syllabus: ["3.13"],
    skills: ["AHL3.13.angle-between-vectors", "AHL3.13.scalar-product", "AHL3.13.perpendicular-test"], title: "An exact angle in a triangle and a perpendicularity condition",
    build({ rng }) {
      const [u, w, deg] = rng.pick(getNicePairs()), A = rvec(rng, -4, 5), B = vadd(A, u), C = vadd(A, w), d = dot(u, w), k = rat.Q(-n2(u), d);
      return { params: { A, B, C }, stem: `The points $\\mathrm{A}$, $\\mathrm{B}$ and $\\mathrm{C}$ have coordinates $${coords(A)}$, $${coords(B)}$ and $${coords(C)}$ respectively.`, parts: [
        P(`Find $${arrow("AB")} \\cdot ${arrow("AC")}$.`, 2, ans.int(d), [
          `$${arrow("AB")} = ${col(u)}$ and $${arrow("AC")} = ${col(w)}$`, `$${arrow("AB")} \\cdot ${arrow("AC")} = ${dotW(u, w)} = ${d}$`]),
        P("Find the size of the angle $\\mathrm{B\\hat{A}C}$, in degrees.", 3, ans.int(deg, { unit: "$^\\circ$" }), [
          `$|${arrow("AB")}| = ${surd(n2(u))}$ and $|${arrow("AC")}| = ${surd(n2(w))}$`,
          `$\\cos\\mathrm{B\\hat{A}C} = \\dfrac{${d}}{${surd(n2(u))} \\times ${surd(n2(w))}} = ${exactTrig("cos", deg).tex}$`,
          `$\\mathrm{B\\hat{A}C} = ${deg}^\\circ$`]),
        P(`The vector $${arrow("AB")} + k\\,${arrow("AC")}$ is perpendicular to $${arrow("AB")}$. Find the value of $k$.`, 2, ans.frac(k.n, k.d), [
          `$\\left(${arrow("AB")} + k\\,${arrow("AC")}\\right) \\cdot ${arrow("AB")} = 0$`,
          `$|${arrow("AB")}|^{2} + k\\left(${arrow("AC")} \\cdot ${arrow("AB")}\\right) = 0$`,
          `$${expr([[n2(u), ""], [d, "k"]])} = 0$, so $k = ${rat.tex(k)}$`])] };
    } });

  reg({ type: "t3-ahl-scalar-product", unknown: "magnitude-algebra", representation: "equation", format: "value", levels: [3], syllabus: ["3.13"],
    skills: ["AHL3.13.scalar-product-algebra", "AHL3.13.scalar-product"], title: "Use the algebra of the scalar product with given magnitudes and angle",
    build({ rng }) {
      let p, q, c;
      do { p = rng.int(2, 7); q = rng.int(2, 7); c = [rng.nonzero(-3, 3), rng.nonzero(-3, 3), rng.nonzero(-3, 3), rng.nonzero(-3, 3)]; } while ((p * q) % 2 || p === q || c[0] * c[3] === c[1] * c[2] || c[0] * c[3] + c[1] * c[2] === 0);
      const obt = rng.bool(), s = rng.sign(), ab = (obt ? -1 : 1) * p * q / 2, inRad = rng.bool(), ang = inRad ? piFrac(obt ? 2 : 1, 3) : `${obt ? 120 : 60}^\\circ`;
      const m2 = p * p + q * q + 2 * s * ab, mixed = c[0] * c[3] + c[1] * c[2], val = c[0] * c[2] * p * p + mixed * ab + c[1] * c[3] * q * q;
      const a = bv("a"), b = bv("b"), sT = s > 0 ? "+" : "-", f1 = `(${expr([[c[0], a], [c[1], b]])})`, f2 = `(${expr([[c[2], a], [c[3], b]])})`;
      return { params: { p, q, deg: obt ? 120 : 60, s, c }, stem: `The vectors $${a}$ and $${b}$ satisfy $|${a}| = ${p}$ and $|${b}| = ${q}$. The angle between $${a}$ and $${b}$ is $${ang}$.`, parts: [
        P(`Find $${a} \\cdot ${b}$.`, 2, ans.int(ab), [`$${a} \\cdot ${b} = |${a}||${b}|\\cos\\theta$`, `$= ${p} \\times ${q} \\times ${pf(obt ? -1 : 1, 2)} = ${ab}$`]),
        P(`Find $|${a} ${sT} ${b}|^{2}$.`, 2, ans.int(m2), [
          `$|${a} ${sT} ${b}|^{2} = (${a} ${sT} ${b}) \\cdot (${a} ${sT} ${b}) = |${a}|^{2} ${sT} 2\\,${a} \\cdot ${b} + |${b}|^{2}$`,
          `$= ${p * p} ${sT} 2${br(ab)} + ${q * q} = ${m2}$`]),
        P(`Find $${f1} \\cdot ${f2}$.`, 3, ans.int(val), [
          `$${f1} \\cdot ${f2} = ${expr([[c[0] * c[2], `|${a}|^{2}`], [mixed, `${a} \\cdot ${b}`], [c[1] * c[3], `|${b}|^{2}`]])}$`,
          `$= ${expr([[c[0] * c[2], `(${p * p})`], [mixed, `(${ab})`], [c[1] * c[3], `(${q * q})`]])}$`, `$= ${val}$`])] };
    } });

  // ======================= 3.14 lines =======================
  reg({ type: "t3-ahl-line", unknown: "parameter-of-point", representation: "equation", format: "value", levels: [1], syllabus: ["3.14"],
    skills: ["AHL3.14.point-on-line"], title: "Find the parameter of a point on a line",
    build({ rng }) {
      let a, d;
      do { a = rvec(rng, -5, 6); d = rvec(rng, -4, 4); } while (zeros(d) > 0 || zeros(a) > 1);
      const l0 = rng.nonzero(-3, 4), Q = vadd(a, vmul(l0, d));
      return { params: { a, d, Q }, stem: `The line $L$ has equation $${lineT(a, d)}$. The point $${pt("A", Q)}$ lies on $L$.`, parts: [
        P("Find the value of $\\lambda$ at $\\mathrm{A}$.", 2, ans.int(l0), [
          `The first components give $${expr([[a[0], ""], [d[0], "\\lambda"]])} = ${Q[0]}$, so $\\lambda = ${l0}$.`,
          `Check with the other components: $${a[1]} + ${br(l0)}${br(d[1])} = ${Q[1]}$ and $${a[2]} + ${br(l0)}${br(d[2])} = ${Q[2]}$.`])] };
    } });

  reg({ type: "t3-ahl-line", unknown: "through-two-points", representation: "equation", format: "value", levels: [2], syllabus: ["3.14"],
    skills: ["AHL3.14.line-equation", "AHL3.14.point-on-line"], title: "Vector equation of the line through two points and a point on it",
    build({ rng }) {
      let A, B, d;
      do { A = rvec(rng, -5, 6); B = rvec(rng, -5, 6); d = vsub(B, A); } while (zeros(d) > 0 || zeros(A) > 0 || zeros(B) > 0 || n2(d) > 50 || parallel(A, B) || parallel(A, d) || parallel(vadd(A, B), d));
      const fromB = rng.bool(0.3), t = rng.pick(d.every((x) => x % 2 === 0) ? [[3, 2], [-1, 2], [5, 2]] : [[2, 1], [3, 1], [-1, 1], [-2, 1]]), tq = rat.Q(t[0], t[1]);
      const C = A.map((x, i) => x + (t[0] * d[i]) / t[1]), [h, v] = rng.shuffle([0, 1, 2]), cT = C.map((x, i) => (i === h ? "k" : x));
      return { params: { A, B, C: C.map((x, i) => (i === h ? null : x)), h }, stem: `The points $\\mathrm{A}$ and $\\mathrm{B}$ have coordinates $${coords(A)}$ and $${coords(B)}$. The line $L$ passes through $\\mathrm{A}$ and $\\mathrm{B}$.`, parts: [
        P("Which is a vector equation of $L$?", 2, ans.choice(rng, lopt(fromB ? B : A, d), [
          lopt(A, vadd(A, B), `The direction is $${arrow("AB")} = ${bv("b")} - ${bv("a")}$, not the sum of the position vectors.`),
          lopt(d, A, "The position vector and the direction vector have been swapped."),
          lopt(A, B, "The position vector of $\\mathrm{B}$ is not a direction of the line."),
          lopt(B, A, "The position vector of $\\mathrm{A}$ is not a direction of the line.")]), [
          `A direction vector is $${arrow("AB")} = ${col(B)} - ${col(A)} = ${col(d)}$.`,
          `With the position vector of $\\mathrm{${fromB ? "B" : "A"}}$: $${lineT(fromB ? B : A, d)}$`]),
        P(`The point $\\mathrm{C}$ with coordinates $${coords(cT)}$ lies on $L$. Find the value of $k$.`, 2, ans.int(C[h]), [
          `Write $${arrow("AC")} = t\\,${arrow("AB")}$. The ${ORD[v]} components give $${num(C[v] - A[v])} = ${coef(d[v], "t")}$, so $t = ${rat.tex(tq)}$.`,
          `$k = ${A[h]} + ${tq.d === 1 ? paren(tq.n) : `\\left(${rat.tex(tq)}\\right)`} \\times ${paren(d[h])} = ${C[h]}$`])] };
    } });

  reg({ type: "t3-ahl-line", unknown: "cartesian-form", representation: "equation", format: "value", levels: [2], syllabus: ["3.14"],
    skills: ["AHL3.14.convert-forms", "AHL3.14.point-on-line"], title: "Read a line from its Cartesian equations",
    build({ rng }) {
      let a, d, x;
      const dv = () => rng.pick([1, 2, 3, 4, 5, -2, -3, -4]);
      do { a = rvec(rng, -6, 6); d = [dv(), dv(), dv()]; x = rat.Q(a[0] * d[2] - d[0] * a[2], d[2]); } while (a[2] === 0 || zeros(a) > 1 || parallel(a, d) || d.filter((t) => t === 1).length > 1 || x.d > 5 || new Set(d).size === 1);
      const piece = (i) => { const top = a[i] === 0 ? AX[i] : `${AX[i]} ${signed(-a[i])}`; return d[i] === 1 ? top : `\\dfrac{${top}}{${d[i]}}`; };
      const t = rat.Q(-a[2], d[2]);
      return { params: { a, d }, stem: `The line $L$ has Cartesian equations $${piece(0)} = ${piece(1)} = ${piece(2)}$.`, parts: [
        P("Which is a vector equation of $L$?", 2, ans.choice(rng, lopt(a, d), [
          lopt(vmul(-1, a), d, `The numerator $x - a$ means that the line passes through a point with $x = a$: the signs of the point are reversed here.`),
          lopt(d, a, "The denominators give the direction and the numerators give the point; they have been swapped."),
          lopt(vmul(-1, a), vmul(-1, d), "The signs of the point are reversed."),
          lopt(a, d.map((v, i) => (i === 1 ? -v : v)), "One component of the direction has the wrong sign.")]), [
          "Set each fraction equal to $\\lambda$.",
          `$x = ${expr([[a[0], ""], [d[0], "\\lambda"]])}$, $y = ${expr([[a[1], ""], [d[1], "\\lambda"]])}$, $z = ${expr([[a[2], ""], [d[2], "\\lambda"]])}$`,
          `$${lineT(a, d)}$`]),
        P("The line $L$ meets the plane $z = 0$ at the point $\\mathrm{Q}$. Find the $x$-coordinate of $\\mathrm{Q}$.", 2, ans.frac(x.n, x.d), [
          `$z = 0$ gives $${expr([[a[2], ""], [d[2], "\\lambda"]])} = 0$, so $\\lambda = ${rat.tex(t)}$.`,
          `$x = ${a[0]} + ${br(d[0])}${br(t)} = ${rat.tex(x)}$`])] };
    } });

  reg({ type: "t3-ahl-line", unknown: "angle-between", representation: "equation", format: "value", levels: [2], syllabus: ["3.14", "3.13"], calculator: true,
    skills: ["AHL3.14.angle-between-lines", "AHL3.13.angle-between-vectors"], title: "Find the acute angle between two lines",
    build({ rng }) {
      let d, e, th;
      do { d = rvec(rng, -5, 5); e = rvec(rng, -5, 5); if (dot(d, e) > 0 && rng.bool(0.6)) e = vmul(-1, e); th = (Math.acos(Math.abs(dot(d, e)) / (norm(d) * norm(e))) * 180) / Math.PI; } while (zeros(d) + zeros(e) > 1 || isZeroV(d) || isZeroV(e) || !(th > 10 && th < 85) || Math.abs(th - Math.round(th)) < 0.02);
      const a = rvec(rng, -6, 6), b = rvec(rng, -6, 6), dd = dot(d, e);
      return { params: { d, e }, stem: `The line $L_{1}$ has equation $${lineT(a, d)}$ and the line $L_{2}$ has equation $${lineT(b, e, "\\mu")}$.`, parts: [
        P("Find the scalar product of the direction vectors of $L_{1}$ and $L_{2}$.", 1, ans.int(dd), [`$${col(d)} \\cdot ${col(e)} = ${dotW(d, e)} = ${dd}$`]),
        P("Find the acute angle between $L_{1}$ and $L_{2}$, in degrees.", 3, ans.sf(th, 3, { unit: "$^\\circ$", misconceptions: dd < 0 ? [{ value: 180 - th, text: "This is the obtuse angle between the direction vectors. The acute angle between the lines is asked for." }] : [] }), [
          `$\\cos\\theta = \\dfrac{|${dd}|}{\\sqrt{${n2(d)}}\\sqrt{${n2(e)}}}$, using the size of the scalar product to get the acute angle`,
          `$\\theta = ${sf(th)}^\\circ$`])] };
    } });

  reg({ type: "t3-ahl-line", unknown: "foot-of-perpendicular", representation: "equation", format: "value", levels: [3], syllabus: ["3.14", "3.13"],
    skills: ["AHL3.14.foot-of-perpendicular", "AHL3.13.perpendicular-test"], title: "Closest point on a line to a given point and the shortest distance",
    build({ rng }) {
      let nn, d, cands;
      do {
        nn = intNorm(rng, 9); cands = [];
        for (let x = -3; x <= 3; x++) for (let y = -3; y <= 3; y++) for (let z = -3; z <= 3; z++) { const c = [x, y, z]; if (!isZeroV(c) && dot(c, nn.v) === 0 && zeros(c) <= 1 && sameV(prim(c), c)) cands.push(c); }
      } while (!cands.length);
      d = rng.pick(cands);
      const a = rvec(rng, -4, 5), l0 = rng.nonzero(-2, 3), F = vadd(a, vmul(l0, d)), A = vadd(F, nn.v), w = vsub(a, A), wd = dot(w, d), dd = n2(d);
      return { params: { a, d, A }, stem: `The line $L$ has equation $${lineT(a, d)}$. The point $\\mathrm{A}$ has coordinates $${coords(A)}$. The point $\\mathrm{F}$ is the point on $L$ that is closest to $\\mathrm{A}$.`, parts: [
        P("Find the value of $\\lambda$ at $\\mathrm{F}$.", 3, ans.int(l0), [
          `For a point $\\mathrm{R}$ on $L$, $${arrow("AR")} = ${col(a.map((x, i) => expr([[w[i], ""], [d[i], "\\lambda"]])))}$.`,
          `At $\\mathrm{F}$, $${arrow("AR")}$ is perpendicular to $L$: $${arrow("AR")} \\cdot ${col(d)} = 0$`,
          `$${expr([[wd, ""], [dd, "\\lambda"]])} = 0$, so $\\lambda = ${l0}$`]),
        P("Which are the coordinates of $\\mathrm{F}$?", 2, ans.choice(rng, popt(F), [
          popt(vadd(a, vmul(-l0, d)), "The sign of $\\lambda$ is wrong."),
          popt(vadd(A, vmul(l0, d)), "The value of $\\lambda$ must be put into the equation of $L$, not added to $\\mathrm{A}$."),
          popt(vadd(a, vmul(l0 + 1, d)), "This uses a different value of $\\lambda$."),
          popt(vmul(l0, d), "The position vector of the line has been left out.")]), [
          `$${arrow("OF")} = ${col(a)} + ${br(l0)}${col(d)} = ${col(F)}$`]),
        P("Find the shortest distance from $\\mathrm{A}$ to $L$.", 2, ans.int(nn.n), [
          `$${arrow("AF")} = ${col(vsub(F, A))}$`, `$|${arrow("AF")}| = ${normW(vsub(F, A))} = ${nn.n}$`])] };
    } });

  reg({ type: "t3-ahl-line", unknown: "kinematics-closest", representation: "words", format: "value", levels: [4], syllabus: ["3.14"], calculator: true,
    skills: ["AHL3.14.vector-kinematics", "AHL3.14.foot-of-perpendicular"], title: "Two moving objects: speed, distance apart and closest approach",
    build({ rng }) {
      let a, b, v, w, D0, Dv, ts, dmin, t0;
      do {
        a = [rng.int(-30, 30), rng.int(-30, 30), rng.int(5, 20)]; b = [rng.int(-30, 30), rng.int(-30, 30), rng.int(5, 20)];
        v = [rng.nonzero(-6, 6), rng.nonzero(-6, 6), rng.int(-1, 2)]; w = [rng.nonzero(-6, 6), rng.nonzero(-6, 6), rng.int(-1, 2)];
        D0 = vsub(b, a); Dv = vsub(w, v); ts = -dot(D0, Dv) / n2(Dv); dmin = Math.sqrt(Math.max(0, n2(vadd(D0, vmul(ts, Dv))))); t0 = rng.int(1, 3);
      } while (!(ts > 3.5 && ts < 12) || dmin < 1.5 || Number.isInteger(ts * 4) || isSq(n2(v)));
      const what = rng.pick(["drones", "model aircraft", "helicopters"]), Dt = vadd(D0, vmul(t0, Dv));
      const A2 = n2(Dv), B2 = 2 * dot(D0, Dv), C2 = n2(D0), rA = `${bv("r")}_{A}`, rB = `${bv("r")}_{B}`;
      return { params: { a, b, v, w, t0 }, stem: `Two ${what}, $A$ and $B$, move in straight lines with constant velocity. At time $t$ seconds, their position vectors relative to a fixed point on the ground are $${lineT(a, v, "t", rA)}$ and $${lineT(b, w, "t", rB)}$, where distances are in metres.`, parts: [
        P("Find the speed of $A$.", 2, ans.sf(norm(v), 3, { unit: "$\\text{m s}^{-1}$" }), [
          `The velocity of $A$ is $${col(v)}$.`, `Its speed is $${normW(v)} = \\sqrt{${n2(v)}} = ${sf(norm(v))}\\text{ m s}^{-1}$.`]),
        P(`Find the distance between $A$ and $B$ when $t = ${t0}$.`, 2, ans.sf(norm(Dt), 3, { unit: "$\\text{m}$" }), [
          `$${rB} - ${rA} = ${col(D0)} + t${col(Dv)}$`, `When $t = ${t0}$ this is $${col(Dt)}$, of length $\\sqrt{${n2(Dt)}} = ${sf(norm(Dt))}\\text{ m}$.`]),
        P("Find the value of $t$ at which $A$ and $B$ are closest to each other.", 2, ans.sf(ts), [
          `If $D$ is the distance between them, $D^{2} = ${[0, 1, 2].map((i) => `(${expr([[D0[i], ""], [Dv[i], "t"]])})^{2}`).join(" + ")}$.`,
          `$D^{2} = ${expr([[A2, "t^{2}"], [B2, "t"], [C2, ""]])}$`,
          `This is least at the vertex of the quadratic (or from its graph on a GDC): $t = ${sf(ts)}$`]),
        P("Find the least distance between $A$ and $B$.", 1, ans.sf(dmin, 3, { unit: "$\\text{m}$" }), [`Substituting $t = ${sf(ts)}$ gives $D = ${sf(dmin)}\\text{ m}$.`])] };
    } });

  reg({ type: "t3-ahl-line", unknown: "kinematics-ship", representation: "words", format: "value", levels: [2], syllabus: ["3.14"],
    skills: ["AHL3.14.vector-kinematics"], title: "Constant velocity in two dimensions: speed and a position condition",
    build({ rng }) {
      const [p, q, sp] = rng.pick([[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10], [5, 12, 13], [12, 5, 13], [8, 15, 17], [15, 8, 17], [9, 12, 15], [12, 9, 15]]);
      const vx = p * rng.sign(), t1 = rng.pick([2, 3, 4, 5, 1.5, 2.5]), x0 = -vx * t1;
      let vy, y0;
      do { vy = q * rng.sign(); y0 = rng.int(-40, 60); } while (y0 + vy * t1 <= 3 || y0 === 0);
      const north = y0 + vy * t1, craft = rng.pick(["ship", "ferry", "fishing boat"]);
      return { params: { r0: [x0, y0], v: [vx, vy] }, stem: `A ${craft} moves with constant velocity. At time $t$ hours after noon its position vector relative to a lighthouse $\\mathrm{O}$ is $${bv("r")} = ${col([x0, y0])} + t${col([vx, vy])}$, where distances are in kilometres, the first component is the displacement east of $\\mathrm{O}$ and the second is the displacement north of $\\mathrm{O}$.`, parts: [
        P(`Find the speed of the ${craft}.`, 2, ans.int(sp, { unit: "$\\text{km h}^{-1}$" }), [`The velocity is $${col([vx, vy])}$.`, `The speed is $${normW([vx, vy])} = ${sp}\\text{ km h}^{-1}$.`]),
        P(`Find the value of $t$ at which the ${craft} is due north of $\\mathrm{O}$.`, 1, ans.dec(t1), [`Due north of $\\mathrm{O}$ the first component is zero: $${expr([[x0, ""], [vx, "t"]])} = 0$, so $t = ${num(t1)}$.`]),
        P(`Find the distance of the ${craft} from $\\mathrm{O}$ at that time.`, 1, ans.dec(north, { unit: "$\\text{km}$" }), [`The second component is $${y0} + ${br(vy)}${br(t1)} = ${num(north)}$, so the distance is $${num(north)}\\text{ km}$.`])] };
    } });

  // ======================= 3.15 two lines =======================
  const LINES = {
    coincident: "They are the same line.", parallel: "They are parallel and have no common point.",
    intersect: "They intersect at exactly one point.", skew: "They are skew.",
  };
  const linesChoice = (rng, right, whys) => ans.choice(rng, { text: LINES[right], value: right }, Object.keys(LINES).filter((k) => k !== right).map((k) => ({ text: LINES[k], value: k, why: whys[k] })));
  const eqT = (a, d, b, e, i) => `${expr([[a[i], ""], [d[i], "\\lambda"]])} = ${expr([[b[i], ""], [e[i], "\\mu"]])}`;
  // Two lines through a common point Q: a + lambda d (lambda = l0 at Q) and b + mu e (mu = m0 at Q).
  function twoLines(rng, easy) {
    let d, e;
    do { d = rvec(rng, -3, 3); e = rvec(rng, -3, 3); if (easy) e[0] = 0; } while (parallel(d, e) || zeros(d) > 0 || zeros(e) > (easy ? 1 : 0) || d[0] * e[1] - d[1] * e[0] === 0 || n2(d) < 3 || n2(e) < 3);
    const Q = rvec(rng, -5, 6), l0 = rng.nonzero(-3, 3);
    let m0;
    do { m0 = rng.nonzero(-3, 3); } while (m0 === l0);
    return { d, e, Q, l0, m0, a: vsub(Q, vmul(l0, d)), b: vsub(Q, vmul(m0, e)) };
  }
  reg({ type: "t3-ahl-two-lines", unknown: "intersection-point", representation: "equation", format: "value", levels: [2, 3], syllabus: ["3.15"],
    skills: ["AHL3.15.intersection-point"], title: "Find the point where two lines meet",
    build({ rng, level }) {
      const easy = level === 2, { d, e, Q, l0, m0, a, b } = twoLines(rng, easy);
      const wa = easy ? [
        `The ${ORD[0]} components give $${eqT(a, d, b, e, 0)}$, so $\\lambda = ${l0}$.`] : [
        `Equating the first two components: $${eqT(a, d, b, e, 0)}$ and $${eqT(a, d, b, e, 1)}$`,
        `Solving these simultaneously gives $\\lambda = ${l0}$ and $\\mu = ${m0}$.`,
        `Check with the third components: $${a[2]} + ${br(l0)}${br(d[2])} = ${Q[2]}$ and $${b[2]} + ${br(m0)}${br(e[2])} = ${Q[2]}$, which agree.`];
      return { params: { a, d, b, e }, stem: `The line $L_{1}$ has equation $${lineT(a, d)}$ and the line $L_{2}$ has equation $${lineT(b, e, "\\mu")}$. The lines intersect at the point $\\mathrm{Q}$.`, parts: [
        P("Find the value of $\\lambda$ at $\\mathrm{Q}$.", easy ? 2 : 3, ans.int(l0), wa),
        P("Find the value of $\\mu$ at $\\mathrm{Q}$.", 1, ans.int(m0), [easy ? `The second components give $${a[1] + l0 * d[1]} = ${expr([[b[1], ""], [e[1], "\\mu"]])}$, so $\\mu = ${m0}$.` : `From the simultaneous equations, $\\mu = ${m0}$.`]),
        P("Which are the coordinates of $\\mathrm{Q}$?", easy ? 1 : 2, ans.choice(rng, popt(Q), [
          popt(vadd(a, vmul(m0, d)), "The value of $\\mu$ has been used in the equation of $L_{1}$."),
          popt(vadd(b, vmul(l0, e)), "The value of $\\lambda$ has been used in the equation of $L_{2}$."),
          popt(vadd(a, vmul(-l0, d)), "The sign of $\\lambda$ is wrong."),
          popt(vmul(l0, d), "The position vector of the line has been left out.")]), [
          `$${arrow("OQ")} = ${col(a)} + ${br(l0)}${col(d)} = ${col(Q)}$`])] };
    } });

  reg({ type: "t3-ahl-two-lines", unknown: "classify-parallel", representation: "equation", format: "value", levels: [2], syllabus: ["3.15"],
    skills: ["AHL3.15.classify-lines"], title: "Decide whether two parallel lines are the same line",
    build({ rng }) {
      let d;
      do { d = rvec(rng, -3, 3); } while (zeros(d) > 0 || !sameV(prim(d), d));
      const k = rng.pick([2, -2, 3, -3, -1]), e = vmul(k, d), a = rvec(rng, -5, 6), m = rng.nonzero(-3, 3), same = rng.bool(0.45);
      const b = vadd(a, vmul(m, d));
      if (!same) { const i = rng.int(0, 2); b[i] += rng.nonzero(-3, 3); }
      const lam = [0, 1, 2].map((i) => rat.Q(b[i] - a[i], d[i])), right = same ? "coincident" : "parallel";
      return { params: { a, d, b, e }, stem: `The line $L_{1}$ has equation $${lineT(a, d)}$ and the line $L_{2}$ has equation $${lineT(b, e, "\\mu")}$.`, parts: [
        P("The direction vector of $L_{2}$ is $k$ times the direction vector of $L_{1}$. Find the value of $k$.", 1, ans.int(k), [`$${col(e)} = ${k === -1 ? "-" : k}${col(d)}$, so $k = ${k}$ and the lines are parallel.`]),
        P("Which statement describes $L_{1}$ and $L_{2}$?", 2, linesChoice(rng, right, {
          coincident: "The point of $L_{2}$ is not on $L_{1}$, so they are different lines.", parallel: "The point of $L_{2}$ is on $L_{1}$, so the lines share every point.",
          intersect: "Parallel lines cannot meet at exactly one point.", skew: "Skew lines are not parallel; these direction vectors are multiples of each other." }), [
          `Test whether the point $${coords(b)}$ of $L_{2}$ lies on $L_{1}$: $${col(a)} + \\lambda${col(d)} = ${col(b)}$`,
          `The three components give $\\lambda = ${rat.tex(lam[0])}$, $\\lambda = ${rat.tex(lam[1])}$ and $\\lambda = ${rat.tex(lam[2])}$.`,
          same ? "The values agree, so the point is on $L_{1}$ and the two lines are the same line." : "The values do not agree, so the point is not on $L_{1}$: the lines are parallel and distinct."])] };
    } });

  reg({ type: "t3-ahl-two-lines", unknown: "skew-or-meet", representation: "equation", format: "value", levels: [3], syllabus: ["3.15"],
    skills: ["AHL3.15.classify-lines", "AHL3.15.intersection-point"], title: "Decide whether two lines intersect or are skew",
    build({ rng }) {
      const { d, e, Q, l0, m0, a, b } = twoLines(rng, false), skew = rng.bool(0.55);
      if (skew) b[2] += rng.nonzero(-4, 4);
      const z1 = a[2] + l0 * d[2], z2 = b[2] + m0 * e[2];
      return { params: { a, d, b, e }, stem: `The line $L_{1}$ has equation $${lineT(a, d)}$ and the line $L_{2}$ has equation $${lineT(b, e, "\\mu")}$. Equating the first and second components of the two lines gives a pair of simultaneous equations in $\\lambda$ and $\\mu$.`, parts: [
        P("Find the value of $\\lambda$ that satisfies these two equations.", 3, ans.int(l0), [
          `$${eqT(a, d, b, e, 0)}$ and $${eqT(a, d, b, e, 1)}$`, `Solving simultaneously gives $\\lambda = ${l0}$ and $\\mu = ${m0}$.`]),
        P("Find the corresponding value of $\\mu$.", 1, ans.int(m0), [`From the simultaneous equations, $\\mu = ${m0}$.`]),
        P("Which statement describes $L_{1}$ and $L_{2}$?", 2, linesChoice(rng, skew ? "skew" : "intersect", {
          coincident: "The direction vectors are not multiples of each other, so the lines are not the same line.", parallel: "The direction vectors are not multiples of each other, so the lines are not parallel.",
          intersect: "The third components are different for these values of $\\lambda$ and $\\mu$, so there is no common point.", skew: "The third components agree for these values of $\\lambda$ and $\\mu$, so there is a common point." }), [
          `With these values the third component on $L_{1}$ is $${a[2]} + ${br(l0)}${br(d[2])} = ${z1}$ and on $L_{2}$ it is $${b[2]} + ${br(m0)}${br(e[2])} = ${z2}$.`,
          skew ? "These are different, so the lines have no common point. Their direction vectors are not parallel, so the lines are skew." : `These agree, so the lines intersect, at $${coords(Q)}$.`])] };
    } });

  reg({ type: "t3-ahl-two-lines", unknown: "skew-distance", representation: "equation", format: "value", levels: [4], syllabus: ["3.15", "3.16"], calculator: true,
    skills: ["AHL3.15.skew-distance", "AHL3.16.perpendicular-vector"], title: "Shortest distance between two skew lines",
    build({ rng }) {
      let a, b, d, e, n, top, wrongs;
      do {
        a = rvec(rng, -5, 6); b = rvec(rng, -5, 6); d = rvec(rng, -3, 3); e = rvec(rng, -3, 3); n = cross(d, e); top = Math.abs(dot(vsub(b, a), n));
        wrongs = [vopt([n[0], -n[1], n[2]], "The middle component of the vector product has the wrong sign."), vopt(d.map((x, i) => x * e[i]), "This multiplies matching components; that is not the vector product."),
          vopt(vadd(d, e), "The sum of the direction vectors is not perpendicular to them."), vopt(vsub(d, e), "The difference of the direction vectors is not perpendicular to them."), vopt([n[0], n[1], -n[2]], "The last component of the vector product has the wrong sign.")]
          .filter((o) => (dot(o.value, d) !== 0 || dot(o.value, e) !== 0) && !isZeroV(o.value));
      } while (isZeroV(n) || zeros(d) + zeros(e) > 1 || top === 0 || top / norm(n) < 0.6 || wrongs.length < 3 || isSq(n2(n)) || n2(n) > 400);
      const ab = vsub(b, a), dist = top / norm(n);
      return { params: { a, d, b, e }, stem: `The line $L_{1}$ has equation $${lineT(a, d)}$ and the line $L_{2}$ has equation $${lineT(b, e, "\\mu")}$. The lines $L_{1}$ and $L_{2}$ are skew.`, parts: [
        P("Which vector is perpendicular to both $L_{1}$ and $L_{2}$?", 2, ans.choice(rng, vopt(n), wrongs), [
          `The vector product of the direction vectors is perpendicular to both: $${col(d)} \\times ${col(e)} = ${crossW(d, e)}$`, `$= ${col(n)}$`]),
        P("Find the shortest distance between $L_{1}$ and $L_{2}$.", 4, ans.sf(dist), [
          `Let $${bv("n")} = ${col(n)}$, and let $\\mathrm{A}${coords(a)}$ and $\\mathrm{B}${coords(b)}$ be points on $L_{1}$ and $L_{2}$: $${arrow("AB")} = ${col(ab)}$`,
          `The shortest distance is the length of the projection of $${arrow("AB")}$ onto $${bv("n")}$: $\\dfrac{|${arrow("AB")} \\cdot ${bv("n")}|}{|${bv("n")}|}$`,
          `$${arrow("AB")} \\cdot ${bv("n")} = ${dotW(ab, n)} = ${dot(ab, n)}$ and $|${bv("n")}| = \\sqrt{${n2(n)}}$`,
          `The distance is $\\dfrac{${top}}{\\sqrt{${n2(n)}}} = ${sf(dist)}$.`])] };
    } });

  // ==END-VEC1==
})(typeof globalThis !== "undefined" ? globalThis : this);
