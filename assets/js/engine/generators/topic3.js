/* Topic 3 (Geometry and trigonometry) generators. Self-contained: needs only engine.js.
   Each generator's independent verifier is in scripts/engine-checks/topic3.mjs under the same id.
   `source` names the old practice template a generator was ported from. */
(function (root) {
  "use strict";
  const E = root.QBEngine;
  const { ans, fmt } = E;
  const { num, frac, signed, br, expr, m, sf, coef, rat, unit, deg, piFrac, surd } = fmt;
  const P = (prompt, marks, answer, working) => ({ prompt, marks, answer, working });
  const reg = (def) => E.register(Object.assign({ courses: ["aa-sl"], calculator: false }, def));
  const rad = (d) => (d * Math.PI) / 180;

  // Exact values of sin, cos and tan at multiples of 30 and 45 degrees, as [value, LaTeX].
  const S3 = Math.sqrt(3), S2 = Math.SQRT2;
  const REF = {
    30: { sin: [0.5, "\\dfrac{1}{2}"], cos: [S3 / 2, "\\dfrac{\\sqrt{3}}{2}"], tan: [S3 / 3, "\\dfrac{\\sqrt{3}}{3}"] },
    45: { sin: [S2 / 2, "\\dfrac{\\sqrt{2}}{2}"], cos: [S2 / 2, "\\dfrac{\\sqrt{2}}{2}"], tan: [1, "1"] },
    60: { sin: [S3 / 2, "\\dfrac{\\sqrt{3}}{2}"], cos: [0.5, "\\dfrac{1}{2}"], tan: [S3, "\\sqrt{3}"] },
  };
  // name is sin, cos or tan; degrees is not a multiple of 90
  function exact(name, degrees) {
    const d = ((degrees % 360) + 360) % 360, quadrant = Math.floor(d / 90) + 1;
    const ref = quadrant === 1 ? d : quadrant === 2 ? 180 - d : quadrant === 3 ? d - 180 : 360 - d;
    const positive = quadrant === 1 || (name === "sin" && quadrant === 2) || (name === "tan" && quadrant === 3) || (name === "cos" && quadrant === 4);
    const [v, tex] = REF[ref][name];
    return { value: positive ? v : -v, tex: (positive ? "" : "-") + tex, quadrant, ref };
  }
  const angleTex = (degrees) => piFrac(degrees / 15, 12);

  // ======================= 3.1 distance and midpoint =======================
  reg({ type: "t3-distance-midpoint", syllabus: ["3.1"], representation: "words", format: "mcq", unknown: "distance-two-points", levels: [3],
    skills: ["SL3.1.distance-3d", "SL3.1.midpoint-3d"], title: "Midpoint and distance in three dimensions", source: "three-d-distance-midpoint",
    build({ rng }) {
      const A = [rng.int(-4, 4), rng.int(-3, 5), rng.int(0, 6)];
      const d = rng.shuffle(rng.pick([[2, 4, 4], [4, 4, 2], [2, 6, 9], [6, 8, 0], [2, 2, 1], [4, 4, 7], [8, 4, 1], [2, 10, 11], [6, 6, 7], [4, 8, 8]])).map((v) => v * rng.sign());
      const B = A.map((v, i) => v + d[i]), mid = A.map((v, i) => rat.Q(v + B[i], 2)), dist2 = d.reduce((s, v) => s + v * v, 0), dist = Math.round(Math.sqrt(dist2));
      const pt = (c) => `\\left(${c.map((x) => (typeof x === "number" ? num(x) : rat.tex(x))).join(",\\, ")}\\right)`;
      const opt = (c, why) => ({ text: m(pt(c)), value: c.map((x) => (typeof x === "number" ? x : rat.num(x))), why });
      return { params: { A, B }, stem: `The points $\\mathrm{A}${pt(A)}$ and $\\mathrm{B}${pt(B)}$ are given.`, parts: [
        P("Which are the coordinates of the midpoint of $[\\mathrm{AB}]$?", 2, ans.choice(rng, opt(mid), [
          opt(d.map((v) => rat.Q(v, 2)), "This halves the differences of the coordinates; the midpoint uses half of each sum."),
          opt(A.map((v, i) => v + B[i]), "The sums of the coordinates have not been halved."),
          opt(d, "This is the displacement from $\\mathrm{A}$ to $\\mathrm{B}$, not the midpoint."),
          opt(mid.map((x, i) => (i === 2 ? rat.add(x, 1) : x)))]), [
          `The midpoint is $\\left(\\dfrac{x_{1} + x_{2}}{2},\\, \\dfrac{y_{1} + y_{2}}{2},\\, \\dfrac{z_{1} + z_{2}}{2}\\right)$.`, `Midpoint $= ${pt(mid)}$`]),
        P("Find the length of $[\\mathrm{AB}]$.", 3, ans.int(dist), [
          `$\\mathrm{AB} = \\sqrt{${d.map((v) => `${br(v)}^{2}`).join(" + ")}}$`, `$\\mathrm{AB} = \\sqrt{${dist2}} = ${dist}$`])] };
    } });

  // ======================= 3.2 triangle trigonometry =======================
  const TRI = { type: "t3-sine-cosine-rule", syllabus: ["3.2"], format: "value", calculator: true };
  reg({ ...TRI, representation: "equation", unknown: "side-cosine-rule", levels: [4], skills: ["SL3.2.cosine-rule-side", "SL3.2.area-sine"], title: "Cosine rule for a side, then the area", source: "triangle-trig/A",
    build({ rng }) {
      const b = rng.int(4, 12), a = rng.int(5, 13), A = rng.pick([32, 40, 47, 50, 58, 63, 70, 76, 80, 104, 115]);
      const c = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(rad(A))), area = 0.5 * a * b * Math.sin(rad(A));
      return { params: { a, b, A }, stem: `In triangle $\\mathrm{ABC}$, $\\mathrm{AB} = ${unit(b, "cm")}$, $\\mathrm{AC} = ${unit(a, "cm")}$ and $\\mathrm{B\\hat{A}C} = ${deg(A)}$.`, parts: [
        P("Find $\\mathrm{BC}$, in centimetres.", 3, ans.sf(c), [
          `$\\mathrm{BC}^{2} = ${b}^{2} + ${a}^{2} - 2${br(b)}${br(a)}\\cos ${deg(A)}$`, `$\\mathrm{BC}^{2} = ${sf(c * c, 4)}$`, `$\\mathrm{BC} = ${unit(sf(c), "cm")}$`]),
        P("Find the area of triangle $\\mathrm{ABC}$, in square centimetres.", 2, ans.sf(area), [`Area $= \\dfrac{1}{2}${br(b)}${br(a)}\\sin ${deg(A)}$`, `Area $= ${sf(area)}\\text{ cm}^{2}$`])] };
    } });
  reg({ ...TRI, representation: "equation", unknown: "angle-sine-rule", levels: [4], skills: ["SL3.2.sine-rule"], title: "Sine rule for an angle, then a side", source: "triangle-trig/B",
    build({ rng }) {
      const A = rng.pick([28, 35, 40, 44, 50, 57, 63]), a = rng.int(7, 12), b = rng.int(3, a - 2);
      const B = (Math.asin((b * Math.sin(rad(A))) / a) * 180) / Math.PI, C = 180 - A - B, c = (a * Math.sin(rad(C))) / Math.sin(rad(A));
      return { params: { A, a, b }, stem: `In triangle $\\mathrm{ABC}$, $\\mathrm{B\\hat{A}C} = ${deg(A)}$, $\\mathrm{BC} = ${unit(a, "cm")}$ and $\\mathrm{AC} = ${unit(b, "cm")}$.`, parts: [
        P("Find $\\mathrm{A\\hat{B}C}$, in degrees.", 3, ans.sf(B), [
          `$\\dfrac{\\sin B}{${b}} = \\dfrac{\\sin ${deg(A)}}{${a}}$`, `$\\sin B = ${sf((b * Math.sin(rad(A))) / a, 4)}$`,
          `$\\mathrm{AC} < \\mathrm{BC}$, so $B$ is acute: $B = ${deg(sf(B))}$`]),
        P("Find $\\mathrm{AB}$, in centimetres.", 2, ans.sf(c), [`$C = ${deg(180)} - ${deg(A)} - ${deg(sf(B, 4))} = ${deg(sf(C, 4))}$`, `$\\mathrm{AB} = \\dfrac{${a}\\sin ${deg(sf(C, 4))}}{\\sin ${deg(A)}} = ${unit(sf(c), "cm")}$`])] };
    } });
  reg({ type: "t3-triangle-area", syllabus: ["3.2"], format: "value", calculator: true, representation: "equation", unknown: "area-from-two-sides", levels: [4],
    skills: ["SL3.2.area-sine", "SL3.2.cosine-rule-side"], title: "Area from two sides and the included angle, then the third side", source: "triangle-trig/included angle area",
    build({ rng }) {
      const a = rng.pick([5, 7, 9, 12, 14]), b = rng.pick([6, 8, 10, 13, 15]), C = rng.pick([35, 50, 65, 110, 125, 98]);
      const c = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(rad(C))), area = 0.5 * a * b * Math.sin(rad(C));
      return { params: { a, b, C }, stem: `In triangle $\\mathrm{PQR}$, $\\mathrm{PQ} = ${unit(a, "cm")}$, $\\mathrm{PR} = ${unit(b, "cm")}$ and $\\mathrm{Q\\hat{P}R} = ${deg(C)}$.`, parts: [
        P("Find the area of triangle $\\mathrm{PQR}$, in square centimetres.", 3, ans.sf(area), [`Area $= \\dfrac{1}{2}${br(a)}${br(b)}\\sin ${deg(C)}$`, `Area $= ${sf(area)}\\text{ cm}^{2}$`]),
        P("Find $\\mathrm{QR}$, in centimetres.", 3, ans.sf(c), [`$\\mathrm{QR}^{2} = ${a}^{2} + ${b}^{2} - 2${br(a)}${br(b)}\\cos ${deg(C)}$`, `$\\mathrm{QR}^{2} = ${sf(c * c, 4)}$`, `$\\mathrm{QR} = ${unit(sf(c), "cm")}$`])] };
    } });
  reg({ ...TRI, representation: "words", format: "mcq", unknown: "side-cosine-rule", levels: [4], skills: ["SL3.2.cosine-rule-side", "SL3.3.multi-triangle"], title: "Distance between the ends of two paths", source: "triangle-trig/bearing style context",
    build({ rng }) {
      const AB = rng.pick([8, 10, 12, 6.5, 9]), AC = rng.pick([11, 14, 16, 7.5, 13]), A = rng.pick([42, 58, 73, 66, 105, 37]);
      const BC = Math.sqrt(AB * AB + AC * AC - 2 * AB * AC * Math.cos(rad(A)));
      const right = "Two sides and the angle between them are known.";
      return { params: { AB, AC, A }, stem: `Two straight paths leave a hut at $\\mathrm{A}$. One leads to a lake at $\\mathrm{B}$, $${unit(AB, "km")}$ away, and the other to a peak at $\\mathrm{C}$, $${unit(AC, "km")}$ away. The angle between the paths is $${deg(A)}$.`, parts: [
        P("Which statement explains why the cosine rule is the right tool for finding $\\mathrm{BC}$?", 1, ans.choice(rng, right, [
          { text: "Two angles and one side are known.", why: "Only one angle is given. Two angles and a side would suit the sine rule." },
          { text: "The triangle has a right angle.", why: "Nothing says the triangle is right-angled." },
          { text: "Two sides and an angle opposite one of them are known.", why: "The given angle is between the two known sides, not opposite one of them." }]), [
          `The known angle at $\\mathrm{A}$ lies between the known sides $\\mathrm{AB}$ and $\\mathrm{AC}$.`]),
        P("Find the distance $\\mathrm{BC}$, in kilometres.", 4, ans.sf(BC), [
          `$\\mathrm{BC}^{2} = ${num(AB)}^{2} + ${num(AC)}^{2} - 2${br(AB)}${br(AC)}\\cos ${deg(A)}$`, `$\\mathrm{BC}^{2} = ${sf(BC * BC, 4)}$`, `$\\mathrm{BC} = ${unit(sf(BC), "km")}$`])] };
    } });
  reg({ type: "t3-ambiguous-case", syllabus: ["3.5", "3.2"], format: "value", calculator: true, representation: "equation", unknown: "both-angles", levels: [4],
    skills: ["SL3.5.ambiguous-case", "SL3.2.sine-rule"], title: "Sine rule: the two possible angles", source: "triangle-ambiguous-sine",
    build({ rng }) {
      let A, a, b, sinB;
      do { A = rng.pick([25, 30, 35, 40, 28, 33]); a = rng.int(5, 9); b = a + rng.int(1, 4); sinB = (b * Math.sin(rad(A))) / a; } while (sinB > 0.96);
      const B1 = (Math.asin(sinB) * 180) / Math.PI, B2 = 180 - B1;
      return { params: { A, a, b }, stem: `In triangle $\\mathrm{ABC}$, $\\mathrm{B\\hat{A}C} = ${deg(A)}$, $\\mathrm{BC} = ${unit(a, "cm")}$ and $\\mathrm{AC} = ${unit(b, "cm")}$. There are two possible triangles.`, parts: [
        P("Find the acute value of $\\mathrm{A\\hat{B}C}$, in degrees.", 3, ans.sf(B1), [`$\\dfrac{\\sin B}{${b}} = \\dfrac{\\sin ${deg(A)}}{${a}}$`, `$\\sin B = ${sf(sinB, 4)}$`, `$B = ${deg(sf(B1))}$`]),
        P("Find the obtuse value of $\\mathrm{A\\hat{B}C}$, in degrees.", 2, ans.sf(B2), [
          `$\\sin(${deg(180)} - B) = \\sin B$, so the other value is $${deg(180)} - ${deg(sf(B1, 4))}$.`, `$B = ${deg(sf(B2))}$, which is possible because $${deg(A)} + ${deg(sf(B2))} < ${deg(180)}$.`])] };
    } });

  // ======================= 3.4 arcs and sectors =======================
  reg({ type: "t3-arc-sector", syllabus: ["3.4"], format: "value", representation: "equation", unknown: "sector-area", levels: [3],
    skills: ["SL3.4.arc-length", "SL3.4.sector-area"], title: "Arc length and area of a sector", source: "circle-sector",
    build({ rng }) {
      const r = rng.int(3, 12), th = rng.pick([0.4, 0.5, 0.6, 0.8, 1.2, 1.5, 2, 2.5, 0.75, 1.25]);
      const arc = Number((r * th).toFixed(4)), area = Number((0.5 * r * r * th).toFixed(4));
      return { params: { r, th }, stem: `A sector $\\mathrm{OAB}$ of a circle with centre $\\mathrm{O}$ has radius $${unit(r, "cm")}$ and angle $\\mathrm{A\\hat{O}B} = ${num(th)}$ radians.`, parts: [
        P("Find the length of the arc $\\mathrm{AB}$, in centimetres.", 2, ans.dec(arc), [`$l = r\\theta = ${r} \\times ${num(th)}$`, `$l = ${unit(arc, "cm")}$`]),
        P("Find the area of the sector, in square centimetres.", 3, ans.dec(area), [`$A = \\dfrac{1}{2}r^{2}\\theta = \\dfrac{1}{2} \\times ${r}^{2} \\times ${num(th)}$`, `$A = \\dfrac{1}{2} \\times ${r * r} \\times ${num(th)}$`, `$A = ${num(area)}\\text{ cm}^{2}$`])] };
    } });

  // ======================= 3.5 exact values =======================
  reg({ type: "t3-exact-values", syllabus: ["3.5"], format: "mcq", representation: "equation", unknown: "related-value", levels: [3],
    skills: ["SL3.5.exact-special", "SL3.5.related-angles", "SL3.5.unit-circle"], title: "Exact trig ratios of an angle on the unit circle", source: "exact-trig-unit-circle",
    build({ rng }) {
      const dg = rng.pick([120, 135, 150, 210, 225, 240, 300, 315, 330]);
      const s = exact("sin", dg), c = exact("cos", dg), t = exact("tan", dg), names = ["first", "second", "third", "fourth"];
      return { params: { dg }, stem: `Let $\\theta = ${angleTex(dg)}$.`, parts: [
        P("Which quadrant contains the angle $\\theta$?", 1, ans.choice(rng, { text: `the ${names[s.quadrant - 1]} quadrant`, value: s.quadrant }, names.map((n, i) => ({ text: `the ${n} quadrant`, value: i + 1 })).filter((o) => o.value !== s.quadrant)), [
          `$${angleTex(dg)}$ is $${deg(dg)}$, which lies in the ${names[s.quadrant - 1]} quadrant.`]),
        P("Find the exact value of $\\sin\\theta$.", 1, ans.exact(s.value, s.tex), [`The reference angle is $${angleTex(s.ref)}$ and sine is ${s.value > 0 ? "positive" : "negative"} in this quadrant.`, `$\\sin\\theta = ${s.tex}$`]),
        P("Find the exact value of $\\cos\\theta$.", 1, ans.exact(c.value, c.tex), [`Cosine is ${c.value > 0 ? "positive" : "negative"} in this quadrant: $\\cos\\theta = ${c.tex}$`]),
        P("Find the exact value of $\\tan\\theta$.", 2, ans.exact(t.value, t.tex), [`$\\tan\\theta = \\dfrac{\\sin\\theta}{\\cos\\theta}$`, `$\\tan\\theta = ${t.tex}$`])] };
    } });

  // ======================= 3.6 identities =======================
  reg({ type: "t3-identity-values", syllabus: ["3.6"], format: "value", representation: "equation", unknown: "sin2-from-ratio", levels: [2],
    skills: ["SL3.6.ratio-from-ratio", "SL3.6.double-angle-values"], title: "From one ratio to another, then a double angle", source: "trig-identity/A",
    build({ rng }) {
      const [x, y, h] = rng.pick([[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13], [8, 15, 17], [15, 8, 17], [7, 24, 25], [24, 7, 25], [20, 21, 29]]);
      const useSin = rng.bool(), given = useSin ? "\\sin" : "\\cos", other = useSin ? "\\cos" : "\\sin";
      return { params: { opp: x, hyp: h, useSin }, stem: `It is given that $${given}\\theta = ${frac(x, h)}$ and $0 < \\theta < \\dfrac{\\pi}{2}$.`, parts: [
        P(`Find the exact value of $${other}\\theta$.`, 2, ans.frac(y, h), [
          `$${other}^{2}\\theta = 1 - ${given}^{2}\\theta = 1 - ${frac(x * x, h * h)} = ${frac(y * y, h * h)}$`, `$\\theta$ is acute, so $${other}\\theta = ${frac(y, h)}$.`]),
        P("Find the exact value of $\\sin 2\\theta$.", 2, ans.frac(2 * x * y, h * h), [`$\\sin 2\\theta = 2\\sin\\theta\\cos\\theta = 2 \\times ${frac(x, h)} \\times ${frac(y, h)}$`, `$\\sin 2\\theta = ${frac(2 * x * y, h * h)}$`])] };
    } });
  reg({ type: "t3-prove-identity", syllabus: ["3.6", "1.6"], format: "self", representation: "equation", unknown: "expand-square", levels: [2], fixedPool: true,
    skills: ["SL3.6.prove-identity"], title: "Prove a trigonometric identity", source: "trig-identity/B",
    build({ rng }) {
      const c = rng.pick([
        { key: "plus", ask: "Show that $(\\sin\\theta + \\cos\\theta)^{2} = 1 + \\sin 2\\theta$.", model: "Expand the left side and use $\\sin^{2}\\theta + \\cos^{2}\\theta = 1$ and $2\\sin\\theta\\cos\\theta = \\sin 2\\theta$.",
          work: ["$(\\sin\\theta + \\cos\\theta)^{2} = \\sin^{2}\\theta + 2\\sin\\theta\\cos\\theta + \\cos^{2}\\theta$", "$\\sin^{2}\\theta + \\cos^{2}\\theta = 1$ and $2\\sin\\theta\\cos\\theta = \\sin 2\\theta$", "So $(\\sin\\theta + \\cos\\theta)^{2} = 1 + \\sin 2\\theta$."] },
        { key: "minus", ask: "Show that $(\\sin\\theta - \\cos\\theta)^{2} = 1 - \\sin 2\\theta$.", model: "Expand the left side and use $\\sin^{2}\\theta + \\cos^{2}\\theta = 1$ and $2\\sin\\theta\\cos\\theta = \\sin 2\\theta$.",
          work: ["$(\\sin\\theta - \\cos\\theta)^{2} = \\sin^{2}\\theta - 2\\sin\\theta\\cos\\theta + \\cos^{2}\\theta$", "$\\sin^{2}\\theta + \\cos^{2}\\theta = 1$ and $2\\sin\\theta\\cos\\theta = \\sin 2\\theta$", "So $(\\sin\\theta - \\cos\\theta)^{2} = 1 - \\sin 2\\theta$."] },
        { key: "fourth", ask: "Show that $\\cos^{4}\\theta - \\sin^{4}\\theta = \\cos 2\\theta$.", model: "Factorise as a difference of two squares, then use $\\cos^{2}\\theta + \\sin^{2}\\theta = 1$ and $\\cos^{2}\\theta - \\sin^{2}\\theta = \\cos 2\\theta$.",
          work: ["$\\cos^{4}\\theta - \\sin^{4}\\theta = \\left(\\cos^{2}\\theta + \\sin^{2}\\theta\\right)\\left(\\cos^{2}\\theta - \\sin^{2}\\theta\\right)$", "$\\cos^{2}\\theta + \\sin^{2}\\theta = 1$ and $\\cos^{2}\\theta - \\sin^{2}\\theta = \\cos 2\\theta$", "So $\\cos^{4}\\theta - \\sin^{4}\\theta = \\cos 2\\theta$."] },
        { key: "one-minus", ask: "Show that $\\dfrac{1 - \\cos 2\\theta}{2} = \\sin^{2}\\theta$.", model: "Replace $\\cos 2\\theta$ by $1 - 2\\sin^{2}\\theta$ and simplify.",
          work: ["$\\cos 2\\theta = 1 - 2\\sin^{2}\\theta$", "$\\dfrac{1 - \\cos 2\\theta}{2} = \\dfrac{1 - \\left(1 - 2\\sin^{2}\\theta\\right)}{2} = \\dfrac{2\\sin^{2}\\theta}{2}$", "So $\\dfrac{1 - \\cos 2\\theta}{2} = \\sin^{2}\\theta$."] }]);
      return { params: { key: c.key }, stem: "This question asks for a proof. Write every step, starting from one side of the identity.", parts: [P(c.ask, 4, ans.self(c.model), c.work)] };
    } });

  // ======================= 3.7 circular functions =======================
  const wave = (rng) => ({ a: rng.int(2, 6), b: rng.pick([2, 3, 4, 6]), d: rng.int(-3, 8), fn: rng.pick(["sin", "cos"]) });
  reg({ type: "t3-trig-read-features", syllabus: ["3.7"], format: "value", representation: "equation", unknown: "amp-period", levels: [3],
    skills: ["SL3.7.read-features"], title: "Amplitude, period and range of a sine or cosine function", source: "trig-fn",
    build({ rng }) {
      const s = wave(rng), per = rat.Q(2, s.b);
      return { params: s, stem: `The function $f$ is defined by $f(x) = ${s.a}\\${s.fn}(${s.b}x) ${signed(s.d)}$, for $x \\in \\mathbb{R}$.`, parts: [
        P("Write down the amplitude of $f$.", 1, ans.int(s.a), [`The amplitude is the coefficient of $\\${s.fn}$: $${s.a}$.`]),
        P("Find the period of $f$, giving an exact answer.", 2, ans.exact((2 * Math.PI) / s.b, piFrac(per.n, per.d)), [`Period $= \\dfrac{2\\pi}{b} = \\dfrac{2\\pi}{${s.b}}${per.n === 2 ? "" : ` = ${piFrac(per.n, per.d)}`}$`]),
        P("Write down the maximum value of $f$.", 1, ans.int(s.d + s.a), [`$\\${s.fn}(${s.b}x)$ is at most $1$, so the maximum is $${s.a} ${signed(s.d) || "+ 0"} = ${s.d + s.a}$.`]),
        P("Write down the minimum value of $f$.", 1, ans.int(s.d - s.a), [`$\\${s.fn}(${s.b}x)$ is at least $-1$, so the minimum is $-${s.a} ${signed(s.d) || "+ 0"} = ${s.d - s.a}$.`])] };
    } });
  reg({ type: "t3-trig-model-use", syllabus: ["3.7"], format: "value", representation: "words", unknown: "first-max-time", levels: [3],
    skills: ["SL3.7.model-context", "SL3.7.read-features"], title: "A sine model: features and the first maximum", source: "trig-graph-section-b",
    build({ rng }) {
      const A = rng.int(2, 5), b = rng.pick([2, 3, 4, 6]), d = A + rng.int(2, 6), per = rat.Q(2, b), tm = rat.Q(1, 2 * b);
      return { params: { A, b, d }, stem: `The depth of water in a harbour, in metres, is modelled by $h(t) = ${A}\\sin(${b}t) + ${d}$, for $t \\ge 0$, where $t$ is measured in radians.`, parts: [
        P("Write down the amplitude of $h$.", 1, ans.int(A), [`For $a\\sin(bt) + d$ the amplitude is $a = ${A}$.`]),
        P("Find the period of $h$, giving an exact answer.", 2, ans.exact((2 * Math.PI) / b, piFrac(per.n, per.d)), [`Period $= \\dfrac{2\\pi}{${b}}${per.n === 2 ? "" : ` = ${piFrac(per.n, per.d)}`}$`]),
        P("Write down the greatest depth of the water, in metres.", 1, ans.int(d + A), [`Maximum $= ${d} + ${A} = ${d + A}$`]),
        P("Write down the least depth of the water, in metres.", 1, ans.int(d - A), [`Minimum $= ${d} - ${A} = ${d - A}$`]),
        P("Find the first value of $t$ at which the depth is greatest, giving an exact answer.", 2, ans.exact(Math.PI / (2 * b), piFrac(tm.n, tm.d)), [
          `The depth is greatest when $\\sin(${b}t) = 1$, first when $${b}t = \\dfrac{\\pi}{2}$.`, `$t = ${piFrac(tm.n, tm.d)}$`])] };
    } });

  // ======================= 3.8 trigonometric equations =======================
  reg({ type: "t3-trig-equation", syllabus: ["3.8", "3.5"], format: "value", representation: "equation", unknown: "basic-exact", levels: [2],
    skills: ["SL3.8.solve-basic", "SL3.5.exact-special"], title: "Solve a basic trig equation exactly", source: "trig-solve",
    build({ rng }) {
      const fn = rng.pick(["sin", "cos", "tan"]), dg = rng.pick([30, 45, 60, 120, 135, 150, 210, 225, 240, 300, 315, 330]), v = exact(fn, dg);
      // every angle in [0, 360) with the same ratio
      const sols = [30, 45, 60, 120, 135, 150, 210, 225, 240, 300, 315, 330].filter((x) => Math.abs(exact(fn, x).value - v.value) < 1e-9);
      // the equation as shown: 2 sin x = sqrt(3), sqrt(2) cos x = -1, tan x = -sqrt(3), ...
      const lhsRhs = fn === "tan" ? [`\\tan x`, v.tex.replace("\\dfrac{\\sqrt{3}}{3}", "\\dfrac{1}{\\sqrt{3}}")]
        : v.ref === 45 ? [`\\sqrt{2}\\,\\${fn} x`, v.value > 0 ? "1" : "-1"] : [`2\\${fn} x`, Math.abs(Math.abs(v.value) - 0.5) < 1e-9 ? (v.value > 0 ? "1" : "-1") : (v.value > 0 ? "" : "-") + "\\sqrt{3}"];
      const quad = (x) => ["first", "second", "third", "fourth"][Math.floor(x / 90)];
      return { params: { fn, target: v.value }, stem: `Consider the equation $${lhsRhs[0]} = ${lhsRhs[1]}$, for $0 \\le x \\le 2\\pi$. The equation has two solutions.`, parts: [
        P("Find the smaller solution, giving an exact answer.", 2, ans.exact(rad(sols[0]), angleTex(sols[0])), [
          `$\\${fn} x = ${v.tex}$`, `The reference angle is $${angleTex(v.ref)}$, and $\\${fn} x$ is ${v.value > 0 ? "positive" : "negative"} in the ${quad(sols[0])} and ${quad(sols[1])} quadrants.`, `$x = ${angleTex(sols[0])}$`]),
        P("Find the larger solution, giving an exact answer.", 2, ans.exact(rad(sols[1]), angleTex(sols[1])), [`In the ${quad(sols[1])} quadrant, $x = ${angleTex(sols[1])}$.`])] };
    } });
  reg({ type: "t3-trig-quadratic", syllabus: ["3.8", "2.7"], format: "value", representation: "equation", unknown: "all-solutions", levels: [3],
    skills: ["SL3.8.quadratic-in-trig", "SL2.7.hidden-quadratic"], title: "A quadratic in sine or cosine", source: "trig-solve/quadratic cases",
    build({ rng }) {
      const fn = rng.pick(["sin", "cos"]), half = rng.sign(), one = rng.sign();
      // (2u - half)(u - one) = 0 with u = sin x or cos x: u = half/2 or u = one
      const cs = [2, -(2 * one + half), half * one], u1 = half / 2, u2 = one, lo = Math.min(u1, u2), hi = Math.max(u1, u2);
      const all = [];
      for (let x = 0; x <= 360; x += 30) { const val = fn === "sin" ? Math.sin(rad(x)) : Math.cos(rad(x)); if (Math.abs(val - u1) < 1e-9 || Math.abs(val - u2) < 1e-9) all.push(x); }
      const f2 = `\\${fn}^{2} x`, f1 = `\\${fn} x`, big = all[all.length - 1];
      return { params: { fn, cs }, stem: `Consider the equation $${expr([[cs[0], f2], [cs[1], f1], [cs[2], ""]])} = 0$, for $0 \\le x \\le 2\\pi$.`, parts: [
        P(`The equation gives two possible values of $${f1}$. Find the smaller value.`, 2, ans.frac(lo * 2, 2), [
          `Let $u = ${f1}$: $${expr([[cs[0], "u^{2}"], [cs[1], "u"], [cs[2], ""]])} = 0$`, `$\\left(${expr([[2, "u"], [-half, ""]])}\\right)\\left(${expr([[1, "u"], [-one, ""]])}\\right) = 0$, so $u = ${frac(half, 2)}$ or $u = ${one}$`, `The smaller value is $${frac(lo * 2, 2)}$.`]),
        P("Write down the larger value.", 1, ans.frac(hi * 2, 2), [`The larger value is $${frac(hi * 2, 2)}$.`]),
        P("Find the number of solutions of the equation in the given interval.", 2, ans.int(all.length), [
          `$${f1} = ${frac(half, 2)}$ and $${f1} = ${one}$ together give $x = ${all.map((x) => angleTex(x)).join(",\\ ")}$.`, `There are $${all.length}$ solutions.`]),
        P("Find the largest solution, giving an exact answer.", 2, ans.exact(rad(big), angleTex(big)), [`The largest solution is $x = ${angleTex(big)}$.`])] };
    } });
})(typeof globalThis !== "undefined" ? globalThis : this);
