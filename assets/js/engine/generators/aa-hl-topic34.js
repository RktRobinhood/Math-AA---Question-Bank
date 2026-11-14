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

  // ==END-TRIG==
})(typeof globalThis !== "undefined" ? globalThis : this);
