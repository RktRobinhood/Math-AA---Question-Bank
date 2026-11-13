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

  // ---- Diagrams: QBEngine.graph figures (see graph.js). Labels are plain text, not LaTeX. ----
  const pol = (r, a) => [r * Math.cos(rad(a)), r * Math.sin(rad(a))];
  const dl = (a) => `${a}°`, ul = (v, u) => `${v} ${u}`;
  // a multiple of pi as plain text: piText(2, 3) is 2π/3
  const piText = (n, d) => { const q = rat.Q(n, d); return `${q.n === 1 ? "" : q.n}π${q.d === 1 ? "" : "/" + q.d}`; };
  // A triangle. names: three letters; pts: the vertices in the same order; o.sides[i] labels the side from
  // vertex i to the next; o.angles[i] labels the angle at vertex i; o.right: the vertex with a right angle;
  // o.dash: a side drawn dashed; o.more: further shapes.
  function triangle(names, pts, o) {
    const sides = o.sides || [], shapes = [];
    if (o.dash === undefined) shapes.push({ type: "polygon", points: pts, labels: names.split(""), sides });
    else {
      pts.forEach((p, i) => shapes.push({ type: "line", from: p, to: pts[(i + 1) % 3], label: sides[i] || undefined, dashed: i === o.dash }));
      pts.forEach((p, i) => shapes.push({ type: "point", at: p, label: names[i], dot: false }));
    }
    (o.angles || []).forEach((t, i) => { if (t) shapes.push({ type: "angle", at: pts[i], from: pts[(i + 1) % 3], to: pts[(i + 2) % 3], label: t }); });
    if (o.right !== undefined) shapes.push({ type: "angle", at: pts[o.right], from: pts[(o.right + 1) % 3], to: pts[(o.right + 2) % 3], right: true });
    return { shapes: shapes.concat(o.more || []), alt: o.alt || `Triangle ${names} with the given lengths and angles marked` };
  }
  // vertices of a triangle from two sides and the angle between them: the first side lies along the bottom
  const sas = (c, b, A) => [[0, 0], [c, 0], pol(b, A)];
  // A sector with centre O, drawn with its line of symmetry vertical. o.radius, o.angle and o.arc are labels;
  // o.names: "OAB" or "O"; o.chord: draw [AB]; o.shade: shade the segment between the chord and the arc.
  function sectorFig(r, degrees, o) {
    const from = 90 - degrees / 2, to = 90 + degrees / 2, O = [0, 0], A = pol(r, from), B = pol(r, to), names = o.names || "";
    const shapes = [{ type: "sector", centre: O, radius: r, from, to, label: o.arc }];
    if (o.shade) shapes.push({ type: "segment", centre: O, radius: r, from, to, fill: true, stroke: false });
    if (o.chord) shapes.push({ type: "line", from: A, to: B });
    if (o.radius) shapes.push({ type: "line", from: O, to: A, label: o.radius });
    [O, A, B].forEach((p, i) => { if (names[i]) shapes.push({ type: "point", at: p, label: names[i], dot: false }); });
    if (o.angle) shapes.push({ type: "angle", at: O, from: A, to: B, label: o.angle });
    return { shapes, alt: o.alt || "A sector of a circle with its radius and angle marked" };
  }
  // The cross-section of a cone through its vertex. Labels for the radius, the height and the slant height.
  const coneFig = (r, h, labels) => ({ alt: "The cross-section of a cone: an isosceles triangle with its height drawn", shapes: [
    { type: "polygon", points: [[-r, 0], [r, 0], [0, h]], sides: [null, labels.slant, null] },
    { type: "line", from: [0, 0], to: [0, h], dashed: true, label: labels.height, side: 1 },
    { type: "line", from: [0, 0], to: [r, 0], label: labels.radius, side: -1 },
    { type: "angle", at: [0, 0], from: [r, 0], to: [0, h], right: true }] });

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
      return { graph: triangle("ABC", sas(b, a, A), { sides: [ul(b, "cm"), null, ul(a, "cm")], angles: [dl(A)] }), params: { a, b, A }, stem: `In triangle $\\mathrm{ABC}$, $\\mathrm{AB} = ${unit(b, "cm")}$, $\\mathrm{AC} = ${unit(a, "cm")}$ and $\\mathrm{B\\hat{A}C} = ${deg(A)}$.`, parts: [
        P("Find $\\mathrm{BC}$, in centimetres.", 3, ans.sf(c), [
          `$\\mathrm{BC}^{2} = ${b}^{2} + ${a}^{2} - 2${br(b)}${br(a)}\\cos ${deg(A)}$`, `$\\mathrm{BC}^{2} = ${sf(c * c, 4)}$`, `$\\mathrm{BC} = ${unit(sf(c), "cm")}$`]),
        P("Find the area of triangle $\\mathrm{ABC}$, in square centimetres.", 2, ans.sf(area), [`Area $= \\dfrac{1}{2}${br(b)}${br(a)}\\sin ${deg(A)}$`, `Area $= ${sf(area)}\\text{ cm}^{2}$`])] };
    } });
  reg({ ...TRI, representation: "equation", unknown: "angle-sine-rule", levels: [4], skills: ["SL3.2.sine-rule"], title: "Sine rule for an angle, then a side", source: "triangle-trig/B",
    build({ rng }) {
      const A = rng.pick([28, 35, 40, 44, 50, 57, 63]), a = rng.int(7, 12), b = rng.int(3, a - 2);
      const B = (Math.asin((b * Math.sin(rad(A))) / a) * 180) / Math.PI, C = 180 - A - B, c = (a * Math.sin(rad(C))) / Math.sin(rad(A));
      return { graph: triangle("ABC", sas(c, b, A), { sides: [null, ul(a, "cm"), ul(b, "cm")], angles: [dl(A)] }), params: { A, a, b }, stem: `In triangle $\\mathrm{ABC}$, $\\mathrm{B\\hat{A}C} = ${deg(A)}$, $\\mathrm{BC} = ${unit(a, "cm")}$ and $\\mathrm{AC} = ${unit(b, "cm")}$.`, parts: [
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
      return { graph: triangle("PQR", sas(a, b, C), { sides: [ul(a, "cm"), null, ul(b, "cm")], angles: [dl(C)] }), params: { a, b, C }, stem: `In triangle $\\mathrm{PQR}$, $\\mathrm{PQ} = ${unit(a, "cm")}$, $\\mathrm{PR} = ${unit(b, "cm")}$ and $\\mathrm{Q\\hat{P}R} = ${deg(C)}$.`, parts: [
        P("Find the area of triangle $\\mathrm{PQR}$, in square centimetres.", 3, ans.sf(area), [`Area $= \\dfrac{1}{2}${br(a)}${br(b)}\\sin ${deg(C)}$`, `Area $= ${sf(area)}\\text{ cm}^{2}$`]),
        P("Find $\\mathrm{QR}$, in centimetres.", 3, ans.sf(c), [`$\\mathrm{QR}^{2} = ${a}^{2} + ${b}^{2} - 2${br(a)}${br(b)}\\cos ${deg(C)}$`, `$\\mathrm{QR}^{2} = ${sf(c * c, 4)}$`, `$\\mathrm{QR} = ${unit(sf(c), "cm")}$`])] };
    } });
  reg({ ...TRI, representation: "words", format: "mcq", unknown: "side-cosine-rule", levels: [4], skills: ["SL3.2.cosine-rule-side", "SL3.3.multi-triangle"], title: "Distance between the ends of two paths", source: "triangle-trig/bearing style context",
    build({ rng }) {
      const AB = rng.pick([8, 10, 12, 6.5, 9]), AC = rng.pick([11, 14, 16, 7.5, 13]), A = rng.pick([42, 58, 73, 66, 105, 37]);
      const BC = Math.sqrt(AB * AB + AC * AC - 2 * AB * AC * Math.cos(rad(A)));
      const right = "Two sides and the angle between them are known.";
      return { graph: triangle("ABC", sas(AB, AC, A), { sides: [ul(AB, "km"), null, ul(AC, "km")], angles: [dl(A)], dash: 1, alt: "Two paths from A, to B and to C, with the angle between them marked" }), params: { AB, AC, A }, stem: `Two straight paths leave a hut at $\\mathrm{A}$. One leads to a lake at $\\mathrm{B}$, $${unit(AB, "km")}$ away, and the other to a peak at $\\mathrm{C}$, $${unit(AC, "km")}$ away. The angle between the paths is $${deg(A)}$.`, parts: [
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
      // the two positions of B on the line through A: the far one gives the acute angle
      const foot = b * Math.cos(rad(A)), half = Math.sqrt(a * a - (b * Math.sin(rad(A))) ** 2);
      const graph = triangle("ABC", [[0, 0], [foot + half, 0], pol(b, A)], { sides: [null, ul(a, "cm"), ul(b, "cm")], angles: [dl(A)],
        more: [{ type: "line", from: pol(b, A), to: [foot - half, 0], dashed: true }], alt: "Triangle ABC, with the other possible position of the side BC drawn dashed" });
      return { graph, params: { A, a, b }, stem: `In triangle $\\mathrm{ABC}$, $\\mathrm{B\\hat{A}C} = ${deg(A)}$, $\\mathrm{BC} = ${unit(a, "cm")}$ and $\\mathrm{AC} = ${unit(b, "cm")}$. There are two possible triangles. The diagram shows one of them, with the other possible position of $[\\mathrm{BC}]$ drawn dashed.`, parts: [
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
      return { graph: sectorFig(r, dgr(th), { names: "OAB", radius: ul(r, "cm"), angle: `${th} rad` }), params: { r, th }, stem: `A sector $\\mathrm{OAB}$ of a circle with centre $\\mathrm{O}$ has radius $${unit(r, "cm")}$ and angle $\\mathrm{A\\hat{O}B} = ${num(th)}$ radians.`, parts: [
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

  // =====================================================================================
  // Second set: level 1 and 2 questions for every subtopic, 3.3, and more exam types.
  // =====================================================================================
  const { point } = fmt;
  const dgr = (r) => (r * 180) / Math.PI;
  // True when v is so close to a 3 s.f. rounding edge that a small slip changes the answer.
  const edge = (v) => { const e = Math.floor(Math.log10(Math.abs(v))), s = Math.abs(v) / Math.pow(10, e - 2); return Math.abs(s - Math.floor(s) - 0.5) < 0.03; };
  // k sqrt(radicand) / n, simplified, as {value, tex, rational}.
  function surdQ(k, radicand, n) {
    const p = fmt.sqrtParts(radicand), q = rat.Q(k * p.out, n);
    if (p.in === 1) return { value: q.n / q.d, tex: frac(q.n, q.d), rational: q };
    const top = coef(Math.abs(q.n), `\\sqrt{${p.in}}`);
    return { value: (q.n * Math.sqrt(p.in)) / q.d, tex: (q.n < 0 ? "-" : "") + (q.d === 1 ? top : `\\dfrac{${top}}{${q.d}}`) };
  }
  const ansRoot = (r) => (r.rational ? ans.frac(r.rational.n, r.rational.d) : ans.exact(r.value, r.tex));
  const QUAD = ["first", "second", "third", "fourth"];
  const WORD = { sin: "sine", cos: "cosine", tan: "tangent" };
  const Word = { sin: "Sine", cos: "Cosine", tan: "Tangent" };
  const positiveIn = { sin: [1, 2], cos: [1, 4], tan: [1, 3] };
  // A point of three-dimensional space, as LaTeX and as a choice option.
  const pt3 = (c) => `\\left(${c.map((x) => (typeof x === "number" ? num(x) : rat.tex(x))).join(",\\, ")}\\right)`;
  const opt3 = (c, why) => ({ text: m(pt3(c)), value: c.map((x) => (typeof x === "number" ? x : rat.num(x))), why });

  // ======================= 3.1 =======================
  reg({ type: "t3-distance-midpoint", syllabus: ["3.1"], representation: "equation", format: "value", unknown: "distance-2d", levels: [1],
    skills: ["SL3.1.distance-3d"], title: "Distance between two points in the plane",
    build({ rng }) {
      const d = rng.shuffle(rng.pick([[3, 4], [6, 8], [5, 12], [8, 15], [9, 12], [7, 24], [12, 16]])).map((v) => v * rng.sign());
      const A = [rng.int(-6, 6), rng.int(-6, 6)], B = [A[0] + d[0], A[1] + d[1]], dist = Math.round(Math.hypot(d[0], d[1]));
      return { params: { A, B }, stem: `The points $\\mathrm{A}${point(A[0], A[1])}$ and $\\mathrm{B}${point(B[0], B[1])}$ are given.`, parts: [
        P("Find the length of $[\\mathrm{AB}]$.", 2, ans.int(dist), [
          `$\\mathrm{AB} = \\sqrt{(${B[0]} - ${fmt.paren(A[0])})^{2} + (${B[1]} - ${fmt.paren(A[1])})^{2}}$`,
          `$\\mathrm{AB} = \\sqrt{${d[0] * d[0]} + ${d[1] * d[1]}} = \\sqrt{${dist * dist}} = ${dist}$`])] };
    } });
  reg({ type: "t3-distance-midpoint", syllabus: ["3.1"], representation: "equation", format: "mcq", unknown: "missing-endpoint", levels: [2],
    skills: ["SL3.1.midpoint-3d", "SL3.1.distance-3d"], title: "An endpoint from the midpoint, then a length",
    build({ rng }) {
      const A = [rng.int(-4, 4), rng.int(-3, 5), rng.int(-2, 6)];
      const d = rng.shuffle(rng.pick([[1, 2, 2], [2, 3, 6], [1, 4, 8], [4, 4, 7], [2, 4, 4], [3, 6, 6], [2, 6, 9], [6, 6, 7]])).map((v) => v * rng.sign());
      const M = A.map((v, i) => v + d[i]), B = A.map((v, i) => v + 2 * d[i]), half = Math.round(Math.hypot(d[0], d[1], d[2])), sq = d.map((v) => v * v);
      return { params: { A, M }, stem: `The point $\\mathrm{M}${pt3(M)}$ is the midpoint of the line segment $[\\mathrm{AB}]$, where $\\mathrm{A}$ has coordinates $${pt3(A)}$.`, parts: [
        P("Which are the coordinates of $\\mathrm{B}$?", 2, ans.choice(rng, opt3(B), [
          opt3(A.map((v, i) => v + M[i]), "The coordinates of $\\mathrm{A}$ and $\\mathrm{M}$ have been added. Each coordinate of $\\mathrm{M}$ is half the sum of the coordinates of $\\mathrm{A}$ and $\\mathrm{B}$."),
          opt3(A.map((v, i) => rat.Q(v + M[i], 2)), "This is the midpoint of $[\\mathrm{AM}]$. The point $\\mathrm{B}$ lies beyond $\\mathrm{M}$."),
          opt3(A.map((v, i) => 2 * v - M[i]), "This goes from $\\mathrm{M}$ back past $\\mathrm{A}$, in the wrong direction."),
          opt3(d, "This is the displacement from $\\mathrm{A}$ to $\\mathrm{M}$, not a point."),
          opt3(B.map((v, i) => (i === 2 ? v + 1 : v)))]), [
          `Going from $\\mathrm{A}$ to $\\mathrm{M}$ changes the coordinates by $${pt3(d)}$.`,
          `The same step again takes $\\mathrm{M}$ to $\\mathrm{B}$: $\\mathrm{B} = ${pt3(B)}$`]),
        P("Find the length of $[\\mathrm{AB}]$.", 2, ans.int(2 * half), [
          `$\\mathrm{AM} = \\sqrt{${sq.join(" + ")}} = \\sqrt{${half * half}} = ${half}$`, `$\\mathrm{AB} = 2 \\times \\mathrm{AM} = ${2 * half}$`])] };
    } });
  const CONE = { type: "t3-solid-volume-area", syllabus: ["3.1"], representation: "words", format: "value", levels: [2], situationKey: "cone",
    situation(rng) { const [r, h, l] = rng.pick([[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10], [5, 12, 13], [12, 5, 13], [9, 12, 15], [12, 9, 15], [8, 15, 17], [15, 8, 17], [12, 16, 20], [7, 24, 25]]); return { r, h, l }; } };
  reg({ ...CONE, unknown: "cone-volume-from-slant", skills: ["SL3.1.volume-solids"], title: "Height and volume of a cone from its slant height",
    build({ sit }) {
      const { r, h, l } = sit;
      return { graph: coneFig(r, h, { radius: ul(r, "cm"), slant: ul(l, "cm"), height: "h" }), stem: `A right circular cone has a base of radius $${unit(r, "cm")}$ and a slant height of $${unit(l, "cm")}$. The diagram shows a vertical cross-section of the cone through its vertex.`, parts: [
        P("Find the vertical height of the cone, in centimetres.", 2, ans.int(h), [
          `The radius, the height $h$ and the slant height form a right-angled triangle: $h^{2} = ${l}^{2} - ${r}^{2} = ${l * l - r * r}$`, `$h = ${h}$`]),
        P("Find the volume of the cone, in cubic centimetres. Give your answer in terms of $\\pi$.", 2, ans.exact((Math.PI * r * r * h) / 3, piFrac(r * r * h, 3)), [
          `$V = \\dfrac{1}{3}\\pi r^{2}h = \\dfrac{1}{3}\\pi${br(r)}^{2}${br(h)}$`, `$V = ${piFrac(r * r * h, 3)}\\text{ cm}^{3}$`])] };
    } });
  reg({ ...CONE, unknown: "cone-total", skills: ["SL3.1.surface-area"], title: "Slant height and total surface area of a cone",
    build({ sit }) {
      const { r, h, l } = sit;
      return { graph: coneFig(r, h, { radius: ul(r, "cm"), height: ul(h, "cm"), slant: "l" }), stem: `A solid right circular cone has a base of radius $${unit(r, "cm")}$ and a vertical height of $${unit(h, "cm")}$. The diagram shows a vertical cross-section of the cone through its vertex.`, parts: [
        P("Find the slant height of the cone, in centimetres.", 2, ans.int(l), [
          `The radius, the height and the slant height $l$ form a right-angled triangle: $l^{2} = ${r}^{2} + ${h}^{2} = ${l * l}$`, `$l = ${l}$`]),
        P("Find the total surface area of the cone, in square centimetres. Give your answer in terms of $\\pi$.", 2,
          ans.exact(Math.PI * r * (l + r), piFrac(r * (l + r), 1), { misconceptions: [{ value: Math.PI * r * l, text: "This is the curved surface only. The total surface area includes the circular base." }] }), [
            `$A = \\pi rl + \\pi r^{2} = \\pi${br(r)}${br(l)} + \\pi${br(r)}^{2}$`, `$A = ${r * l}\\pi + ${r * r}\\pi = ${piFrac(r * (l + r), 1)}\\text{ cm}^{2}$`])] };
    } });
  reg({ type: "t3-solid-volume-area", syllabus: ["3.1"], representation: "words", format: "value", unknown: "sphere-volume", levels: [1],
    skills: ["SL3.1.volume-solids"], title: "Volume of a sphere in terms of pi",
    build({ rng }) {
      const r = rng.int(2, 9), thing = rng.pick(["A solid sphere", "A spherical ball", "A spherical glass bead", "A spherical tank"]);
      return { graph: { alt: "A circle with a radius drawn", shapes: [{ type: "circle", centre: [0, 0], radius: r }, { type: "point", at: [0, 0] }, { type: "line", from: [0, 0], to: pol(r, 25), label: ul(r, "cm") }] }, params: { r }, stem: `${thing} has a radius of $${unit(r, "cm")}$.`, parts: [
        P("Find its volume, in cubic centimetres. Give your answer in terms of $\\pi$.", 2, ans.exact((4 * Math.PI * r ** 3) / 3, piFrac(4 * r ** 3, 3)), [
          `$V = \\dfrac{4}{3}\\pi r^{3} = \\dfrac{4}{3}\\pi${br(r)}^{3}$`, `$V = \\dfrac{4}{3}\\pi \\times ${r ** 3} = ${piFrac(4 * r ** 3, 3)}\\text{ cm}^{3}$`])] };
    } });
  reg({ type: "t3-3d-angle", syllabus: ["3.1", "3.2"], representation: "words", format: "value", unknown: "cuboid-diagonal-base", levels: [4], calculator: true,
    skills: ["SL3.1.angle-line-plane", "SL3.1.distance-3d"], title: "Diagonals of a cuboid and the angle with the base",
    build({ rng }) {
      let a, b, c, AC, AG, ang;
      do { a = rng.int(16, 48) / 2; b = rng.int(10, 30) / 2; c = rng.int(8, 30) / 2; AC = Math.hypot(a, b); AG = Math.hypot(a, b, c); ang = dgr(Math.atan(c / AC)); }
      while (a <= b || ang < 12 || ang > 78 || [30, 45, 60].some((x) => Math.abs(ang - x) < 0.5) || edge(AC) || edge(AG) || edge(ang));
      // an oblique view: the edges going back are drawn shortened and at an angle
      // (not to scale: the proportions are evened out, and the view is the one that keeps the diagonals clear of the edges)
      const [sa, sb, sc] = [a, b, c].map(Math.sqrt), dirOf = (v) => Math.atan2(v[1], v[0]);
      const views = [[0.55, 30], [0.55, 42], [0.7, 35], [0.7, 50]].map(([k, t]) => {
        const view = (x, y, z) => [x + k * y * Math.cos(rad(t)), z + k * y * Math.sin(rad(t))];
        const g = dirOf(view(sa, sb, sc)), cl = Math.min(Math.abs(g - dirOf(view(sa, 0, sc))), Math.abs(g - dirOf(view(sa, sb, 0))), Math.abs(dirOf(view(sa, sb, 0)) - dirOf(view(0, sb, 0))) / 2, dirOf(view(sa, sb, 0)));
        return { view, cl };
      });
      const view = views.reduce((best, v) => (v.cl > best.cl + 1e-9 ? v : best)).view;
      const V = { A: view(0, 0, 0), B: view(sa, 0, 0), C: view(sa, sb, 0), D: view(0, sb, 0), E: view(0, 0, sc), F: view(sa, 0, sc), G: view(sa, sb, sc), H: view(0, sb, sc) };
      const edge3 = (pair, o) => Object.assign({ type: "line", from: V[pair[0]], to: V[pair[1]] }, o);
      const graph = { alt: "A cuboid with base ABCD and top EFGH, with the diagonals AC and AG drawn dashed", shapes: [
        edge3("AB", { label: ul(a, "cm") }), edge3("BC", { label: ul(b, "cm") }), edge3("AE", { label: ul(c, "cm") }),
        ...["BF", "EF", "CG", "FG", "GH", "EH"].map((e) => edge3(e)), ...["AD", "DC", "DH", "AC", "AG"].map((e) => edge3(e, { dashed: true })),
        ...Object.keys(V).map((n) => ({ type: "point", at: V[n], label: n, dot: false }))] };
      return { graph, params: { a, b, c }, stem: `A cuboid has a horizontal rectangular base $\\mathrm{ABCD}$. The vertices $\\mathrm{E}$, $\\mathrm{F}$, $\\mathrm{G}$ and $\\mathrm{H}$ of the top face are vertically above $\\mathrm{A}$, $\\mathrm{B}$, $\\mathrm{C}$ and $\\mathrm{D}$ respectively. The lengths of the edges are $\\mathrm{AB} = ${unit(a, "cm")}$, $\\mathrm{BC} = ${unit(b, "cm")}$ and $\\mathrm{AE} = ${unit(c, "cm")}$. The diagram shows the cuboid and is not to scale.`, parts: [
        P("Find the length of the diagonal $[\\mathrm{AC}]$ of the base, in centimetres.", 2, ans.sf(AC), [
          `Triangle $\\mathrm{ABC}$ has a right angle at $\\mathrm{B}$: $\\mathrm{AC}^{2} = ${num(a)}^{2} + ${num(b)}^{2} = ${num(a * a + b * b)}$`, `$\\mathrm{AC} = ${unit(sf(AC), "cm")}$`]),
        P("Find the length of the diagonal $[\\mathrm{AG}]$ of the cuboid, in centimetres.", 2, ans.sf(AG), [
          `Triangle $\\mathrm{ACG}$ has a right angle at $\\mathrm{C}$, and $\\mathrm{CG} = \\mathrm{AE}$: $\\mathrm{AG}^{2} = ${num(a * a + b * b)} + ${num(c)}^{2} = ${num(a * a + b * b + c * c)}$`, `$\\mathrm{AG} = ${unit(sf(AG), "cm")}$`]),
        P("Find the angle between the diagonal $[\\mathrm{AG}]$ and the base $\\mathrm{ABCD}$, in degrees.", 2,
          ans.sf(ang, 3, { misconceptions: [{ value: 90 - ang, text: "This is the angle between the diagonal and the vertical edge. The angle with the base is at $\\mathrm{A}$, between $[\\mathrm{AG}]$ and $[\\mathrm{AC}]$." }] }), [
            `The point of the base directly below $\\mathrm{G}$ is $\\mathrm{C}$, so the angle is $\\mathrm{G\\hat{A}C}$.`,
            `$\\tan \\mathrm{G\\hat{A}C} = \\dfrac{\\mathrm{CG}}{\\mathrm{AC}} = \\dfrac{${num(c)}}{${sf(AC, 4)}}$`, `$\\mathrm{G\\hat{A}C} = ${deg(sf(ang))}$`])] };
    } });
  reg({ type: "t3-solid-volume-area", syllabus: ["3.1"], representation: "words", format: "value", unknown: "composite-volume", levels: [4], calculator: true,
    skills: ["SL3.1.volume-solids", "SL3.1.surface-area"], title: "Volume and surface area of a cylinder with a hemisphere on top",
    build({ rng }) {
      let r, h, Vc, Vh, V, S;
      do { r = rng.int(15, 60) / 10; h = rng.int(30, 140) / 10; Vc = Math.PI * r * r * h; Vh = (2 * Math.PI * r ** 3) / 3; V = Vc + Vh; S = 3 * Math.PI * r * r + 2 * Math.PI * r * h; }
      while (h <= r || edge(V) || edge(S) || Number.isInteger(r));
      const thing = rng.pick(["A grain silo", "A solid concrete bollard", "A water tank", "A solid wooden post"]);
      return { graph: { alt: "The cross-section of the solid: a rectangle with a semicircle on top", shapes: [
        { type: "line", from: [-r, 0], to: [r, 0] }, { type: "line", from: [-r, 0], to: [-r, h] }, { type: "line", from: [r, 0], to: [r, h], label: ul(h, "m") },
        { type: "line", from: [-r, h], to: [0, h], dashed: true }, { type: "line", from: [0, h], to: [r, h], dashed: true, label: ul(r, "m") },
        { type: "arc", centre: [0, h], radius: r, from: 0, to: 180 }, { type: "point", at: [0, h] }] }, params: { r, h }, stem: `${thing} has the shape of a cylinder of radius $${unit(r, "m")}$ and height $${unit(h, "m")}$ with a hemisphere of the same radius on top. The flat face of the hemisphere fits exactly on the top of the cylinder, and the base of the cylinder is a flat circle. The diagram shows a vertical cross-section of the solid.`, parts: [
        P("Find the volume of the solid, in cubic metres.", 3, ans.sf(V), [
          `$V = \\pi r^{2}h + \\dfrac{2}{3}\\pi r^{3}$`, `$V = \\pi${br(r)}^{2}${br(h)} + \\dfrac{2}{3}\\pi${br(r)}^{3}$`, `$V = ${sf(Vc, 4)} + ${sf(Vh, 4)} = ${sf(V)}\\text{ m}^{3}$`]),
        P("Find the total area of the outside surface of the solid, including its base, in square metres.", 3,
          ans.sf(S, 3, { misconceptions: [{ value: S + Math.PI * r * r, text: "The flat face of the hemisphere is inside the solid, so it is not part of the surface." }] }), [
            `The surface is made of the circular base, the curved surface of the cylinder and the curved surface of the hemisphere.`,
            `$A = \\pi r^{2} + 2\\pi rh + 2\\pi r^{2} = 3\\pi${br(r)}^{2} + 2\\pi${br(r)}${br(h)}$`, `$A = ${sf(3 * Math.PI * r * r, 4)} + ${sf(2 * Math.PI * r * h, 4)} = ${sf(S)}\\text{ m}^{2}$`])] };
    } });

  // ======================= 3.2 =======================
  const triAngles = (a, b, c) => [(b * b + c * c - a * a) / (2 * b * c), (a * a + c * c - b * b) / (2 * a * c), (a * a + b * b - c * c) / (2 * a * b)].map((x) => dgr(Math.acos(x)));
  reg({ type: "t3-sine-cosine-rule", syllabus: ["3.2"], representation: "words", format: "value", unknown: "angle-cosine-rule", levels: [2], calculator: true,
    skills: ["SL3.2.cosine-rule-angle"], title: "Cosine rule for an angle from three sides",
    build({ rng }) {
      let a, b, c, angs;
      do { a = rng.int(5, 15); b = rng.int(4, 14); c = rng.int(4, 14); angs = triAngles(a, b, c); }
      while (!(Math.min(...angs) >= 20 && Math.max(...angs) <= 140) || a === b || b === c || a === c || edge(angs[0]) || [60, 90, 120].some((x) => Math.abs(angs[0] - x) < 1.5));
      const top = b * b + c * c - a * a, A = angs[0];
      return { graph: triangle("ABC", sas(c, b, A), { sides: [ul(c, "cm"), ul(a, "cm"), ul(b, "cm")] }), params: { a, b, c }, stem: `In triangle $\\mathrm{ABC}$, $\\mathrm{AB} = ${unit(c, "cm")}$, $\\mathrm{AC} = ${unit(b, "cm")}$ and $\\mathrm{BC} = ${unit(a, "cm")}$.`, parts: [
        P("Find $\\mathrm{B\\hat{A}C}$, in degrees.", 3, ans.sf(A), [
          `The angle at $\\mathrm{A}$ is opposite $\\mathrm{BC}$: $\\cos A = \\dfrac{\\mathrm{AB}^{2} + \\mathrm{AC}^{2} - \\mathrm{BC}^{2}}{2(\\mathrm{AB})(\\mathrm{AC})}$`,
          `$\\cos A = \\dfrac{${c}^{2} + ${b}^{2} - ${a}^{2}}{2${br(c)}${br(b)}} = ${frac(top, 2 * b * c)}$`, `$A = ${deg(sf(A))}$`])] };
    } });
  reg({ type: "t3-sine-cosine-rule", syllabus: ["3.2"], representation: "words", format: "value", unknown: "side-sine-rule", levels: [2], calculator: true,
    skills: ["SL3.2.sine-rule"], title: "Sine rule for a side from two angles",
    build({ rng }) {
      let A, B, C, a, b;
      do { A = rng.int(25, 110); B = rng.int(25, 110); C = 180 - A - B; a = rng.int(5, 20); b = (a * Math.sin(rad(B))) / Math.sin(rad(A)); } while (C < 20 || A === B || Math.abs(A - 90) < 2 || edge(b));
      return { graph: triangle("ABC", sas((a * Math.sin(rad(C))) / Math.sin(rad(A)), b, A), { sides: [null, ul(a, "cm"), null], angles: [dl(A), dl(B)] }), params: { A, B, a }, stem: `In triangle $\\mathrm{ABC}$, $\\mathrm{B\\hat{A}C} = ${deg(A)}$, $\\mathrm{A\\hat{B}C} = ${deg(B)}$ and $\\mathrm{BC} = ${unit(a, "cm")}$.`, parts: [
        P("Write down $\\mathrm{A\\hat{C}B}$, in degrees.", 1, ans.int(C), [`$\\mathrm{A\\hat{C}B} = ${deg(180)} - ${deg(A)} - ${deg(B)} = ${deg(C)}$`]),
        P("Find $\\mathrm{AC}$, in centimetres.", 3, ans.sf(b, 3, { misconceptions: [{ value: (a * Math.sin(rad(A))) / Math.sin(rad(B)), text: "Each side goes with the sine of the angle opposite it: $\\mathrm{AC}$ is opposite the angle at $\\mathrm{B}$, and $\\mathrm{BC}$ is opposite the angle at $\\mathrm{A}$." }] }), [
          `$\\mathrm{AC}$ is opposite the angle at $\\mathrm{B}$ and $\\mathrm{BC}$ is opposite the angle at $\\mathrm{A}$: $\\dfrac{\\mathrm{AC}}{\\sin ${deg(B)}} = \\dfrac{${a}}{\\sin ${deg(A)}}$`,
          `$\\mathrm{AC} = \\dfrac{${a}\\sin ${deg(B)}}{\\sin ${deg(A)}}$`, `$\\mathrm{AC} = ${unit(sf(b), "cm")}$`])] };
    } });
  reg({ type: "t3-triangle-area", syllabus: ["3.2", "3.5"], representation: "words", format: "value", unknown: "area-from-two-sides", levels: [3],
    skills: ["SL3.2.cosine-rule-side", "SL3.2.area-sine", "SL3.2.sine-rule", "SL3.5.exact-triangle"], title: "A triangle with an exact angle: side, area and a sine",
    build({ rng }) {
      const [u, v, A, a] = rng.pick([[3, 5, 120, 7], [5, 8, 60, 7], [3, 8, 60, 7], [7, 8, 120, 13], [7, 15, 60, 13], [8, 15, 60, 13], [5, 16, 120, 19], [5, 21, 60, 19], [16, 21, 60, 19], [6, 10, 120, 14], [10, 16, 60, 14], [6, 16, 60, 14]]);
      const [c, b] = rng.bool() ? [u, v] : [v, u], cosTex = A === 60 ? "\\dfrac{1}{2}" : "-\\dfrac{1}{2}", area = surdQ(b * c, 3, 4), sinB = surdQ(b, 3, 2 * a);
      return { graph: triangle("ABC", sas(c, b, A), { sides: [ul(c, "cm"), null, ul(b, "cm")], angles: [dl(A)] }), params: { b, c, A }, stem: `In triangle $\\mathrm{ABC}$, $\\mathrm{AB} = ${unit(c, "cm")}$, $\\mathrm{AC} = ${unit(b, "cm")}$ and $\\mathrm{B\\hat{A}C} = ${deg(A)}$.`, parts: [
        P("Find $\\mathrm{BC}$, in centimetres.", 3, ans.int(a), [
          `$\\mathrm{BC}^{2} = ${c}^{2} + ${b}^{2} - 2${br(c)}${br(b)}\\cos ${deg(A)}$`,
          `$\\cos ${deg(A)} = ${cosTex}$, so $\\mathrm{BC}^{2} = ${c * c} + ${b * b} ${signed(A === 60 ? -b * c : b * c)} = ${a * a}$`, `$\\mathrm{BC} = ${a}$`]),
        P("Find the exact area of triangle $\\mathrm{ABC}$, in square centimetres.", 2, ansRoot(area), [
          `Area $= \\dfrac{1}{2}${br(c)}${br(b)}\\sin ${deg(A)} = \\dfrac{1}{2}${br(c)}${br(b)}\\left(\\dfrac{\\sqrt{3}}{2}\\right)$`, `Area $= ${area.tex}\\text{ cm}^{2}$`]),
        P("Find the exact value of $\\sin \\mathrm{A\\hat{B}C}$.", 2, ansRoot(sinB), [
          `$\\dfrac{\\sin \\mathrm{A\\hat{B}C}}{\\mathrm{AC}} = \\dfrac{\\sin ${deg(A)}}{\\mathrm{BC}}$`,
          `$\\sin \\mathrm{A\\hat{B}C} = ${frac(b, a)} \\times \\dfrac{\\sqrt{3}}{2} = ${sinB.tex}$`])] };
    } });
  reg({ type: "t3-right-angle-trig", syllabus: ["3.2"], representation: "words", format: "value", unknown: "side-from-angle", levels: [1], calculator: true,
    skills: ["SL3.2.right-side", "SL3.2.right-ratio"], title: "A side of a right-angled triangle from an angle and a side",
    build({ rng }) {
      // Right angle at B; the angle given is at A. AC is the hypotenuse, AB is adjacent and BC is opposite.
      const CASES = [
        { known: "AC", want: "BC", f: "sin", mult: true }, { known: "AC", want: "AB", f: "cos", mult: true }, { known: "AB", want: "BC", f: "tan", mult: true },
        { known: "AB", want: "AC", f: "cos", mult: false }, { known: "BC", want: "AB", f: "tan", mult: false }, { known: "BC", want: "AC", f: "sin", mult: false }];
      let cs, th, k, v;
      do { cs = rng.pick(CASES); th = rng.int(20, 70); k = rng.int(5, 25); const t = Math[cs.f](rad(th)); v = cs.mult ? k * t : k / t; } while (Math.abs(th - 45) < 5 || edge(v));
      const ratio = cs.mult ? `\\dfrac{\\mathrm{${cs.want}}}{${k}}` : `\\dfrac{${k}}{\\mathrm{${cs.want}}}`;
      return { graph: triangle("ABC", [[0, 0], [Math.cos(rad(th)), 0], [Math.cos(rad(th)), Math.sin(rad(th))]], { sides: ["AB", "BC", "AC"].map((n) => (n === cs.known ? ul(k, "cm") : null)), angles: [dl(th)], right: 1 }), params: { known: cs.known, want: cs.want, th, k }, stem: `Triangle $\\mathrm{ABC}$ has a right angle at $\\mathrm{B}$, with $\\mathrm{B\\hat{A}C} = ${deg(th)}$ and $\\mathrm{${cs.known}} = ${unit(k, "cm")}$.`, parts: [
        P(`Find $\\mathrm{${cs.want}}$, in centimetres.`, 2, ans.sf(v), [
          `$[\\mathrm{AC}]$ is the hypotenuse, $[\\mathrm{BC}]$ is opposite the angle at $\\mathrm{A}$ and $[\\mathrm{AB}]$ is adjacent to it, so $\\${cs.f} ${deg(th)} = ${ratio}$`,
          `$\\mathrm{${cs.want}} = ${cs.mult ? `${k}\\${cs.f} ${deg(th)}` : `\\dfrac{${k}}{\\${cs.f} ${deg(th)}}`} = ${unit(sf(v), "cm")}$`])] };
    } });
  reg({ type: "t3-right-angle-trig", syllabus: ["3.2"], representation: "words", format: "value", unknown: "ratio-needs-pythagoras", levels: [2],
    skills: ["SL3.2.right-ratio", "SL3.2.right-side"], title: "Trig ratios in a right-angled triangle after Pythagoras",
    build({ rng }) {
      const [p, q, h] = rng.pick([[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13], [8, 15, 17], [15, 8, 17], [7, 24, 25], [24, 7, 25], [20, 21, 29], [21, 20, 29], [9, 40, 41]]);
      // AB = p, BC = q, AC = h. At A: opposite q, adjacent p. At C: opposite p, adjacent q.
      const at = rng.pick(["A", "C"]), f = rng.pick(["sin", "cos"]), other = at === "A" ? "C" : "A";
      const name = (v) => (v === "A" ? "\\mathrm{B\\hat{A}C}" : "\\mathrm{A\\hat{C}B}");
      const opp = (v) => (v === "A" ? [q, "BC"] : [p, "AB"]), adj = (v) => (v === "A" ? [p, "AB"] : [q, "BC"]);
      const top = f === "sin" ? opp(at) : adj(at);
      return { graph: triangle("ABC", p >= q ? [[0, 0], [p, 0], [p, q]] : [[0, p], [0, 0], [q, 0]], { sides: [ul(p, "cm"), ul(q, "cm"), null], right: 1 }), params: { p, q, at, f }, stem: `Triangle $\\mathrm{ABC}$ has a right angle at $\\mathrm{B}$, with $\\mathrm{AB} = ${unit(p, "cm")}$ and $\\mathrm{BC} = ${unit(q, "cm")}$.`, parts: [
        P("Find $\\mathrm{AC}$, in centimetres.", 2, ans.int(h), [`$\\mathrm{AC}^{2} = ${p}^{2} + ${q}^{2} = ${h * h}$`, `$\\mathrm{AC} = ${h}$`]),
        P(`Write down the exact value of $\\${f} ${name(at)}$.`, 1, ans.frac(top[0], h), [
          `$\\${f} ${name(at)} = \\dfrac{\\text{${f === "sin" ? "opposite" : "adjacent"}}}{\\text{hypotenuse}} = \\dfrac{\\mathrm{${top[1]}}}{\\mathrm{AC}} = ${frac(top[0], h)}$`]),
        P(`Write down the exact value of $\\tan ${name(other)}$.`, 1, ans.frac(opp(other)[0], adj(other)[0]), [
          `$\\tan ${name(other)} = \\dfrac{\\text{opposite}}{\\text{adjacent}} = \\dfrac{\\mathrm{${opp(other)[1]}}}{\\mathrm{${adj(other)[1]}}} = ${frac(opp(other)[0], adj(other)[0])}$`])] };
    } });

  // ======================= 3.3 =======================
  const B3 = { type: "t3-bearings-elevation", syllabus: ["3.3", "3.2"], representation: "words", format: "value", calculator: true };
  reg({ ...B3, unknown: "height-from-elevation", levels: [1], skills: ["SL3.3.elevation-depression", "SL3.2.right-side"], title: "A height from an angle of elevation",
    build({ rng }) {
      let d, th, h;
      do { d = rng.int(12, 80); th = rng.int(15, 68); h = d * Math.tan(rad(th)); } while (edge(h) || th === 45);
      const thing = rng.pick(["flagpole", "tower", "tree", "mast", "building"]);
      return { graph: { alt: `A right-angled triangle: the ground, the vertical ${thing} and the line of sight to its top`, shapes: [
        { type: "line", from: [0, 0], to: [d, 0], label: ul(d, "m") }, { type: "line", from: [d, 0], to: [d, h], label: "h" }, { type: "line", from: [0, 0], to: [d, h], dashed: true },
        { type: "angle", at: [0, 0], from: [d, 0], to: [d, h], label: dl(th) }, { type: "angle", at: [d, 0], from: [d, h], to: [0, 0], right: true }] }, params: { d, th }, stem: `From a point on level ground $${unit(d, "m")}$ from the base of a vertical ${thing}, the angle of elevation of the top of the ${thing} is $${deg(th)}$.`, parts: [
        P(`Find the height of the ${thing}, in metres.`, 2, ans.sf(h), [
          `The height $h$ is opposite the angle and the distance along the ground is adjacent to it: $\\tan ${deg(th)} = \\dfrac{h}{${d}}$`, `$h = ${d}\\tan ${deg(th)} = ${unit(sf(h), "m")}$`])] };
    } });
  reg({ ...B3, unknown: "angle-of-depression", levels: [2], skills: ["SL3.3.elevation-depression", "SL3.2.right-angle"], title: "An angle of depression and a line of sight",
    build({ rng }) {
      let h, d, ang, TB;
      do { h = rng.int(25, 140); d = rng.int(40, 400); ang = dgr(Math.atan(h / d)); TB = Math.hypot(h, d); } while (ang < 8 || ang > 62 || Math.abs(ang - 45) < 5 || edge(ang) || edge(TB) || Number.isInteger(TB));
      const [top, obj] = rng.pick([["a vertical cliff", "A small boat"], ["a lighthouse", "A buoy"], ["a vertical sea wall", "A swimmer"], ["an observation tower beside a lake", "A canoe"]]);
      return { graph: triangle("TFB", [[0, h], [0, 0], [d, 0]], { sides: [ul(h, "m"), ul(d, "m"), null], right: 1, dash: 2, alt: "A right-angled triangle TFB with the line of sight from T to B dashed" }), params: { h, d }, stem: `The top $\\mathrm{T}$ of ${top} is $${unit(h, "m")}$ above the water, and $\\mathrm{F}$ is the point at water level vertically below $\\mathrm{T}$. ${obj} is at the point $\\mathrm{B}$ on the water, $${unit(d, "m")}$ from $\\mathrm{F}$. The diagram shows the line of sight from $\\mathrm{T}$ to $\\mathrm{B}$ as a dashed line.`, parts: [
        P("Find the angle of depression of $\\mathrm{B}$ from $\\mathrm{T}$, in degrees.", 2,
          ans.sf(ang, 3, { misconceptions: [{ value: 90 - ang, text: "This is the angle between the line of sight and the vertical. An angle of depression is measured down from the horizontal." }] }), [
            `The angle of depression is measured downwards from the horizontal through $\\mathrm{T}$. That horizontal is parallel to $[\\mathrm{FB}]$, so the angle equals $\\mathrm{T\\hat{B}F}$.`,
            `$\\tan \\mathrm{T\\hat{B}F} = \\dfrac{\\mathrm{TF}}{\\mathrm{FB}} = ${frac(h, d)}$, so the angle of depression is $${deg(sf(ang))}$.`]),
        P("Find the distance $\\mathrm{TB}$, in metres.", 2, ans.sf(TB), [`$\\mathrm{TB}^{2} = ${h}^{2} + ${d}^{2} = ${num(h * h + d * d)}$`, `$\\mathrm{TB} = ${unit(sf(TB), "m")}$`])] };
    } });
  reg({ ...B3, unknown: "height-with-eye-level", levels: [2], skills: ["SL3.3.elevation-depression", "SL3.2.right-side"], title: "A height from an angle of elevation measured at eye level",
    build({ rng }) {
      let d, th, e, x;
      do { d = rng.int(8, 45); th = rng.int(20, 65); e = rng.pick([1.4, 1.5, 1.6, 1.7, 1.8]); x = d * Math.tan(rad(th)); } while (edge(x + e) || edge(x) || th === 45 || sf(Number(sf(x, 4)) + e) !== sf(x + e));
      const who = rng.pick(["Amara", "Kenji", "Leila", "Tomas", "Ines", "Ravi"]), thing = rng.pick(["tree", "statue", "street lamp", "climbing wall"]);
      return { graph: { alt: "A person and a vertical object on level ground, with the horizontal at eye level and the line of sight to the top", shapes: [
        { type: "line", from: [0, 0], to: [d, 0], label: ul(d, "m") }, { type: "line", from: [0, 0], to: [0, e], label: ul(e, "m") }, { type: "line", from: [d, 0], to: [d, e + x] },
        { type: "line", from: [0, e], to: [d, e], dashed: true }, { type: "line", from: [0, e], to: [d, e + x] },
        { type: "angle", at: [0, e], from: [d, e], to: [d, e + x], label: dl(th) }, { type: "angle", at: [d, e], from: [d, e + x], to: [0, e], right: true }] }, params: { d, th, e }, stem: `${who} stands on level ground $${unit(d, "m")}$ from the base of a vertical ${thing} and looks at its top. The angle of elevation of the top, measured from eye level, is $${deg(th)}$. ${who}'s eye level is $${unit(e, "m")}$ above the ground.`, parts: [
        P(`Find the height of the ${thing}, in metres.`, 3, ans.sf(x + e, 3, { misconceptions: [{ value: x, text: "This is the height of the top above eye level. Add the height of the eyes above the ground." }] }), [
          `Let $x$ be the height of the top above eye level: $\\tan ${deg(th)} = \\dfrac{x}{${d}}$`, `$x = ${d}\\tan ${deg(th)} = ${sf(x, 4)}$`, `Height $= ${sf(x, 4)} + ${num(e)} = ${unit(sf(x + e), "m")}$`])] };
    } });
  // Two legs of a journey. Bearings are whole degrees, written with three figures.
  const bear = (x) => deg(String(Math.round(x)).padStart(3, "0"));
  const LEGS = { ...B3, skills: ["SL3.3.bearings", "SL3.3.multi-triangle", "SL3.2.cosine-rule-side", "SL3.2.sine-rule"], situationKey: "two-legs",
    situation(rng) {
      let t1, turn, right, t2, d1, d2, ABC, AC, BAC, brg;
      do {
        t1 = rng.int(20, 300); turn = rng.int(40, 140); right = rng.bool(); t2 = right ? t1 + turn : t1 - turn; d1 = rng.int(6, 30); d2 = rng.int(6, 30);
        ABC = 180 - turn; AC = Math.sqrt(d1 * d1 + d2 * d2 - 2 * d1 * d2 * Math.cos(rad(ABC))); BAC = dgr(Math.asin((d2 * Math.sin(rad(ABC))) / AC)); brg = right ? t1 + BAC : t1 - BAC;
      } while (t2 < 10 || t2 > 350 || Math.abs(turn - 90) < 3 || d1 === d2 || d2 >= Math.max(d1, AC) - 0.5 || BAC < 10 || brg < 10 || brg > 350 || edge(AC) || edge(brg) || t1 % 180 === 0
        || sf(right ? t1 + Number(sf(BAC, 4)) : t1 - Number(sf(BAC, 4))) !== sf(brg) || !legFigClear({ t1, t2, d1, d2 }));
      const back = t1 < 180 ? t1 + 180 : t1 - 180;
      return { t1, t2, d1, d2, right, turn, ABC, AC, BAC, brg, back };
    } };
  // The journey A to B to C, drawn to scale with north up; bearings are marked clockwise from north.
  const legFig = (s, withDistances) => {
    const step = (p, dist, t) => [p[0] + dist * Math.sin(rad(t)), p[1] + dist * Math.cos(rad(t))];
    const A = [0, 0], B = step(A, s.d1, s.t1), C = step(B, s.d2, s.t2), L = 0.3 * Math.max(s.d1, s.d2), b3 = (t) => String(t).padStart(3, "0") + "°";
    const shapes = [{ type: "north", at: A, length: L }, { type: "north", at: B, length: L },
      { type: "line", from: A, to: B, arrow: "mid", label: withDistances ? ul(s.d1, "km") : undefined }, { type: "line", from: B, to: C, arrow: "mid", label: withDistances ? ul(s.d2, "km") : undefined },
      { type: "angle", at: A, from: [A[0], A[1] + L], to: B, sweep: "cw", label: b3(s.t1) }, { type: "angle", at: B, from: [B[0], B[1] + L], to: C, sweep: "cw", label: b3(s.t2) },
      { type: "point", at: A, label: "A" }, { type: "point", at: B, label: "B" }, { type: "point", at: C, label: "C" }];
    if (withDistances) shapes.push({ type: "line", from: A, to: C, dashed: true });
    return { shapes, alt: "The journey from A to B to C, with north arrows at A and B and the two bearings marked" };
  };
  // False for the rare journey (one leg much shorter than the other, both bearings large) whose diagram
  // has no room for all its labels; the situation is then drawn again.
  function legFigClear(s) {
    return [true, false].every((withDistances) => [[420, 320], [320, 240], [260, 200]].every(([width, height]) => E.graph.figureInfo(legFig(s, withDistances), { width, height }).problems.length === 0));
  }
  const legStem = (s, withDistances) => `A ship leaves a port $\\mathrm{A}$ and sails ${withDistances ? `$${unit(s.d1, "km")}$ ` : ""}on a bearing of $${bear(s.t1)}$ to a buoy $\\mathrm{B}$. At $\\mathrm{B}$ it changes course and sails ${withDistances ? `$${unit(s.d2, "km")}$ ` : ""}on a bearing of $${bear(s.t2)}$ to a harbour $\\mathrm{C}$.`;
  const legAngleWork = (s) => {
    const diff = Math.abs(s.back - s.t2);
    return [`Seen from $\\mathrm{B}$, the port $\\mathrm{A}$ is on a bearing of $${bear(s.back)}$ and the harbour $\\mathrm{C}$ is on a bearing of $${bear(s.t2)}$.`,
      diff <= 180 ? `The angle between these directions is $\\mathrm{A\\hat{B}C} = ${deg(Math.max(s.back, s.t2))} - ${deg(Math.min(s.back, s.t2))} = ${deg(s.ABC)}$.`
        : `The bearings differ by $${deg(diff)}$, which is more than $${deg(180)}$, so $\\mathrm{A\\hat{B}C} = ${deg(360)} - ${deg(diff)} = ${deg(s.ABC)}$.`];
  };
  reg({ ...LEGS, unknown: "angle-from-bearing", levels: [2], calculator: false, title: "A back bearing and the angle between two legs",
    build({ sit: s }) {
      return { graph: legFig(s, false), stem: legStem(s, false), parts: [
        P("Write down the bearing of $\\mathrm{A}$ from $\\mathrm{B}$.", 1, ans.int(s.back, { display: m(bear(s.back)) }), [
          `The opposite direction differs by $${deg(180)}$: $${deg(s.t1)} ${s.t1 < 180 ? "+" : "-"} ${deg(180)} = ${deg(s.back)}$${s.back < 100 ? `, written $${bear(s.back)}$` : ""}.`]),
        P("Find $\\mathrm{A\\hat{B}C}$, in degrees.", 2, ans.int(s.ABC, { display: m(deg(s.ABC)), misconceptions: [{ value: s.turn, text: "This is the angle the ship turns through at $\\mathrm{B}$. The angle inside the triangle is between the directions from $\\mathrm{B}$ to $\\mathrm{A}$ and from $\\mathrm{B}$ to $\\mathrm{C}$." }] }), legAngleWork(s))] };
    } });
  reg({ ...LEGS, unknown: "two-leg-distance", levels: [4], title: "Two legs on bearings: the distance and bearing of the end from the start",
    build({ sit: s }) {
      const shown = s.brg < 100 ? "0" + sf(s.brg) : sf(s.brg);
      return { graph: legFig(s, true), stem: legStem(s, true), parts: [
        P("Find $\\mathrm{A\\hat{B}C}$, in degrees.", 2, ans.int(s.ABC, { display: m(deg(s.ABC)) }), [
          `The bearing of $\\mathrm{A}$ from $\\mathrm{B}$ is $${deg(s.t1)} ${s.t1 < 180 ? "+" : "-"} ${deg(180)} = ${deg(s.back)}$.`].concat(legAngleWork(s).slice(1))),
        P("Find the distance $\\mathrm{AC}$, in kilometres.", 2, ans.sf(s.AC), [
          `$\\mathrm{AC}^{2} = ${s.d1}^{2} + ${s.d2}^{2} - 2${br(s.d1)}${br(s.d2)}\\cos ${deg(s.ABC)} = ${sf(s.AC * s.AC, 4)}$`, `$\\mathrm{AC} = ${unit(sf(s.AC), "km")}$`]),
        P("Find the bearing of $\\mathrm{C}$ from $\\mathrm{A}$.", 3, ans.sf(s.brg, 3, { display: m(deg(shown)) }), [
          `$\\dfrac{\\sin \\mathrm{B\\hat{A}C}}{${s.d2}} = \\dfrac{\\sin ${deg(s.ABC)}}{${sf(s.AC, 4)}}$`,
          `$\\mathrm{B\\hat{A}C} = ${deg(sf(s.BAC, 4))}$, which is acute because $[\\mathrm{BC}]$ is not the longest side.`,
          `The ship turned to the ${s.right ? "right" : "left"} at $\\mathrm{B}$, so the bearing of $\\mathrm{C}$ from $\\mathrm{A}$ is $${deg(s.t1)} ${s.right ? "+" : "-"} ${deg(sf(s.BAC, 4))} = ${deg(shown)}$.`])] };
    } });
  const TWO = { type: "t3-ext-two-observations", representation: "words", format: "value" };
  const twoStem = (thing, d, al, be) => `The points $\\mathrm{A}$ and $\\mathrm{B}$ are on level ground, in a straight line with the foot $\\mathrm{F}$ of a vertical ${thing}. The point $\\mathrm{B}$ is between $\\mathrm{A}$ and $\\mathrm{F}$, and $\\mathrm{AB} = ${unit(d, "m")}$. The top of the ${thing} is $\\mathrm{T}$. The angle of elevation of $\\mathrm{T}$ is $${deg(al)}$ from $\\mathrm{A}$ and $${deg(be)}$ from $\\mathrm{B}$.`;
  // h: the height TF; the figure is to scale
  const twoFig = (d, al, be, h) => {
    const A = [0, 0], B = [d, 0], F = [d + h / Math.tan(rad(be)), 0], T = [F[0], h];
    return { alt: "Points A, B and F in a line on the ground, with T vertically above F and the lines of sight from A and from B to T", shapes: [
      { type: "line", from: A, to: B, label: ul(d, "m") }, { type: "line", from: B, to: F }, { type: "line", from: F, to: T }, { type: "line", from: A, to: T }, { type: "line", from: B, to: T },
      { type: "angle", at: A, from: F, to: T, label: dl(al) }, { type: "angle", at: B, from: F, to: T, label: dl(be) }, { type: "angle", at: F, from: T, to: B, right: true },
      { type: "point", at: A, label: "A", dot: false }, { type: "point", at: B, label: "B", dot: false }, { type: "point", at: F, label: "F", dot: false }, { type: "point", at: T, label: "T", dot: false }] };
  };
  const twoAngleWork = (al, be) => [`$\\mathrm{A\\hat{B}T} = ${deg(180)} - ${deg(be)} = ${deg(180 - be)}$`, `$\\mathrm{A\\hat{T}B} = ${deg(180)} - ${deg(al)} - ${deg(180 - be)} = ${deg(be - al)}$`];
  reg({ ...TWO, syllabus: ["3.3", "3.2"], unknown: "height-two-angles", levels: [4], calculator: true, skills: ["SL3.3.two-observations", "SL3.3.elevation-depression", "SL3.2.sine-rule"], title: "A height from two angles of elevation",
    build({ rng }) {
      let al, be, d, BT, h;
      do { al = rng.int(18, 42); be = al + rng.int(12, 32); d = rng.int(15, 90); BT = (d * Math.sin(rad(al))) / Math.sin(rad(be - al)); h = BT * Math.sin(rad(be)); }
      while (be > 72 || edge(BT) || edge(h) || sf(Number(sf(BT, 4)) * Math.sin(rad(be))) !== sf(h));
      const thing = rng.pick(["mast", "tower", "chimney", "wind turbine"]);
      return { graph: twoFig(d, al, be, h), params: { al, be, d }, stem: twoStem(thing, d, al, be), parts: [
        P("Find $\\mathrm{A\\hat{T}B}$, in degrees.", 2, ans.int(be - al, { display: m(deg(be - al)) }), twoAngleWork(al, be)),
        P("Find the distance $\\mathrm{BT}$, in metres.", 3, ans.sf(BT), [
          `In triangle $\\mathrm{ABT}$, $\\mathrm{BT}$ is opposite the angle at $\\mathrm{A}$ and $\\mathrm{AB}$ is opposite the angle at $\\mathrm{T}$: $\\dfrac{\\mathrm{BT}}{\\sin ${deg(al)}} = \\dfrac{${d}}{\\sin ${deg(be - al)}}$`,
          `$\\mathrm{BT} = \\dfrac{${d}\\sin ${deg(al)}}{\\sin ${deg(be - al)}}$`, `$\\mathrm{BT} = ${unit(sf(BT), "m")}$`]),
        P(`Find the height of the ${thing}, in metres.`, 2, ans.sf(h), [
          `Triangle $\\mathrm{BFT}$ has a right angle at $\\mathrm{F}$: $\\mathrm{TF} = \\mathrm{BT}\\sin ${deg(be)}$`, `$\\mathrm{TF} = ${sf(BT, 4)} \\times \\sin ${deg(be)} = ${unit(sf(h), "m")}$`])] };
    } });
  reg({ ...TWO, syllabus: ["3.3", "3.5"], unknown: "exact-height", levels: [3], skills: ["SL3.3.two-observations", "SL3.3.elevation-depression", "SL3.5.exact-triangle"], title: "An exact height from two angles of elevation",
    build({ rng }) {
      const n = rng.int(4, 40), thing = rng.pick(["mast", "tower", "chimney", "flagpole", "tree"]), h = surdQ(n, 3, 2);
      return { graph: twoFig(n, 30, 60, h.value), params: { al: 30, be: 60, d: n }, stem: twoStem(thing, n, 30, 60), parts: [
        P("Find $\\mathrm{A\\hat{T}B}$, in degrees.", 1, ans.int(30, { display: m(deg(30)) }), twoAngleWork(30, 60)),
        P("Find the distance $\\mathrm{BT}$, in metres.", 2, ans.int(n), [
          `$\\mathrm{B\\hat{A}T} = \\mathrm{A\\hat{T}B} = ${deg(30)}$, so triangle $\\mathrm{ABT}$ is isosceles.`, `$\\mathrm{BT} = \\mathrm{AB} = ${unit(n, "m")}$`]),
        P(`Find the exact height of the ${thing}, in metres.`, 2, ansRoot(h), [
          `Triangle $\\mathrm{BFT}$ has a right angle at $\\mathrm{F}$: $\\mathrm{TF} = \\mathrm{BT}\\sin ${deg(60)} = ${n} \\times \\dfrac{\\sqrt{3}}{2}$`, `$\\mathrm{TF} = ${h.tex}\\text{ m}$`]),
        P("Find the distance $\\mathrm{BF}$, in metres.", 1, ans.frac(n, 2), [`$\\mathrm{BF} = \\mathrm{BT}\\cos ${deg(60)} = ${n} \\times \\dfrac{1}{2} = ${frac(n, 2)}$`])] };
    } });

  // ======================= 3.4 =======================
  reg({ type: "t3-arc-sector", syllabus: ["3.4"], representation: "equation", format: "value", unknown: "deg-to-rad", levels: [1],
    skills: ["SL3.4.convert"], title: "Convert between degrees and radians",
    build({ rng }) {
      const [d1, d2] = rng.sample([15, 20, 36, 40, 54, 72, 75, 80, 100, 105, 108, 135, 140, 144, 150, 160, 165, 210, 225, 240, 252, 270, 300, 315, 320, 330], 2);
      return { params: { d1, d2 }, stem: "Angles can be measured in degrees or in radians.", parts: [
        P(`Write $${deg(d1)}$ in radians, as an exact multiple of $\\pi$.`, 1, ans.exact(rad(d1), piFrac(d1, 180)), [`$${deg(d1)} = ${d1} \\times \\dfrac{\\pi}{180} = ${piFrac(d1, 180)}$`]),
        P(`Write $${piFrac(d2, 180)}$ radians in degrees.`, 1, ans.int(d2, { display: m(deg(d2)) }), [`$${piFrac(d2, 180)} \\times \\dfrac{180^\\circ}{\\pi} = ${deg(d2)}$`])] };
    } });
  reg({ type: "t3-arc-sector", syllabus: ["3.4"], representation: "equation", format: "value", unknown: "theta-from-arc", levels: [2],
    skills: ["SL3.4.arc-length", "SL3.4.sector-area"], title: "The angle of a sector from its arc length, then its area",
    build({ rng }) {
      const r = rng.int(4, 12), th = rng.pick([0.5, 0.6, 0.75, 0.8, 1.2, 1.25, 1.5, 1.6, 1.75, 2, 2.4, 2.5]), l = Number((r * th).toFixed(4)), area = Number((0.5 * r * r * th).toFixed(4));
      return { graph: sectorFig(r, dgr(th), { radius: ul(r, "cm"), arc: ul(l, "cm"), angle: "θ", alt: "A sector of a circle with its radius and arc length marked" }), params: { r, l }, stem: `A sector of a circle has radius $${unit(r, "cm")}$ and arc length $${unit(l, "cm")}$.`, parts: [
        P("Find the angle of the sector, in radians.", 2, ans.dec(th), [`$l = r\\theta$, so $\\theta = \\dfrac{l}{r} = \\dfrac{${num(l)}}{${r}}$`, `$\\theta = ${num(th)}$`]),
        P("Find the area of the sector, in square centimetres.", 2, ans.dec(area), [`$A = \\dfrac{1}{2}r^{2}\\theta = \\dfrac{1}{2}${br(r)}^{2}${br(th)}$`, `$A = ${num(area)}\\text{ cm}^{2}$`])] };
    } });
  reg({ type: "t3-arc-sector", syllabus: ["3.4"], representation: "words", format: "value", unknown: "arc-length", levels: [2],
    skills: ["SL3.4.arc-length", "SL3.4.sector-area"], title: "Exact arc length and area of a sector in context",
    build({ rng }) {
      const r = rng.int(3, 15), [n, d] = rng.pick([[1, 6], [1, 4], [1, 3], [2, 5], [3, 4], [2, 3], [5, 6], [3, 5], [1, 5], [4, 9], [5, 12], [7, 12]]);
      const [what, edgeName] = rng.pick([["A lawn sprinkler at the point $\\mathrm{O}$ waters a region of grass", "the curved edge of the region"], ["A security light at the point $\\mathrm{O}$ lights a region of a flat yard", "the curved edge of the region"], ["A flower bed with a corner at the point $\\mathrm{O}$ covers a region of a garden", "the curved edge of the region"]]);
      return { graph: sectorFig(r, (180 * n) / d, { names: "O", radius: ul(r, "m"), angle: piText(n, d) }), params: { r, n, d }, stem: `${what}. The region is a sector of a circle with centre $\\mathrm{O}$, radius $${unit(r, "m")}$ and angle $${piFrac(n, d)}$ radians.`, parts: [
        P(`Find the exact length of ${edgeName}, in metres.`, 2, ans.exact((r * n * Math.PI) / d, piFrac(r * n, d)), [`$l = r\\theta = ${r} \\times ${piFrac(n, d)}$`, `$l = ${piFrac(r * n, d)}\\text{ m}$`]),
        P("Find the exact area of the region, in square metres.", 2, ans.exact((r * r * n * Math.PI) / (2 * d), piFrac(r * r * n, 2 * d)), [
          `$A = \\dfrac{1}{2}r^{2}\\theta = \\dfrac{1}{2} \\times ${r}^{2} \\times ${piFrac(n, d)}$`, `$A = ${piFrac(r * r * n, 2 * d)}\\text{ m}^{2}$`])] };
    } });
  const SEG = { type: "t3-composite-circular-region", syllabus: ["3.4", "3.2"], representation: "words", format: "value" };
  const segStem = (r, thTex) => `The points $\\mathrm{A}$ and $\\mathrm{B}$ lie on a circle with centre $\\mathrm{O}$ and radius $${unit(r, "cm")}$, and $\\mathrm{A\\hat{O}B} = ${thTex}$ radians. The chord $[\\mathrm{AB}]$ divides the sector $\\mathrm{OAB}$ into the triangle $\\mathrm{OAB}$ and a segment, which lies between the chord and the arc $\\mathrm{AB}$. The segment is shaded in the diagram.`;
  reg({ ...SEG, unknown: "segment-area", levels: [4], calculator: true, skills: ["SL3.4.segment-shaded", "SL3.4.sector-area", "SL3.2.area-sine", "SL3.2.cosine-rule-side"], title: "Sector, triangle, segment and chord",
    build({ rng }) {
      let r, th, S, Tr, seg, AB;
      do { r = rng.int(30, 150) / 10; th = rng.int(60, 280) / 100; S = 0.5 * r * r * th; Tr = 0.5 * r * r * Math.sin(th); seg = S - Tr; AB = Math.sqrt(2 * r * r - 2 * r * r * Math.cos(th)); }
      while (Number.isInteger(r) || edge(S) || edge(Tr) || edge(seg) || edge(AB) || sf(Number(sf(S, 4)) - Number(sf(Tr, 4))) !== sf(seg));
      return { graph: sectorFig(r, dgr(th), { names: "OAB", radius: ul(r, "cm"), angle: `${th} rad`, chord: true, shade: true, alt: "A sector OAB of a circle with the chord AB drawn and the segment between the chord and the arc shaded" }), params: { r, th }, stem: segStem(r, num(th)), parts: [
        P("Find the area of the sector $\\mathrm{OAB}$, in square centimetres.", 2, ans.sf(S), [`$A = \\dfrac{1}{2}r^{2}\\theta = \\dfrac{1}{2}${br(r)}^{2}${br(th)}$`, `$A = ${sf(S)}\\text{ cm}^{2}$`]),
        P("Find the area of the triangle $\\mathrm{OAB}$, in square centimetres.", 2, ans.sf(Tr), [
          `With the calculator in radians, area $= \\dfrac{1}{2}r^{2}\\sin\\theta = \\dfrac{1}{2}${br(r)}^{2}\\sin ${num(th)}$`, `Area $= ${sf(Tr)}\\text{ cm}^{2}$`]),
        P("Find the area of the segment, in square centimetres.", 1, ans.sf(seg), [`Area of segment $=$ area of sector $-$ area of triangle $= ${sf(S, 4)} - ${sf(Tr, 4)} = ${sf(seg)}\\text{ cm}^{2}$`]),
        P("Find the length of the chord $[\\mathrm{AB}]$, in centimetres.", 2, ans.sf(AB, 3, { misconceptions: [{ value: r * th, text: "This is the length of the arc. The chord is the straight line from $\\mathrm{A}$ to $\\mathrm{B}$." }] }), [
          `$\\mathrm{AB}^{2} = ${num(r)}^{2} + ${num(r)}^{2} - 2${br(r)}${br(r)}\\cos ${num(th)} = ${sf(AB * AB, 4)}$`, `$\\mathrm{AB} = ${unit(sf(AB), "cm")}$`])] };
    } });
  reg({ ...SEG, syllabus: ["3.4", "3.5"], unknown: "segment-exact", levels: [3], skills: ["SL3.4.segment-shaded", "SL3.4.sector-area", "SL3.2.area-sine", "SL3.5.exact-special"], title: "The exact area of a segment",
    build({ rng }) {
      const r = rng.pick([2, 4, 6, 8, 10, 12]), dg = rng.pick([30, 60, 90, 120, 150]), thTex = piFrac(dg, 180), sec = rat.Q(r * r * dg, 360), secTex = piFrac(sec.n, sec.d);
      const tri = dg === 90 ? surdQ(r * r, 1, 2) : dg === 30 || dg === 150 ? surdQ(r * r, 1, 4) : surdQ(r * r, 3, 4);
      const sinTex = dg === 90 ? "1" : dg === 30 || dg === 150 ? "\\dfrac{1}{2}" : "\\dfrac{\\sqrt{3}}{2}", secV = (Math.PI * sec.n) / sec.d;
      return { graph: sectorFig(r, dg, { names: "OAB", radius: ul(r, "cm"), angle: piText(dg, 180), chord: true, shade: true, alt: "A sector OAB of a circle with the chord AB drawn and the segment between the chord and the arc shaded" }), params: { r, dg }, stem: segStem(r, thTex), parts: [
        P("Find the exact area of the sector $\\mathrm{OAB}$, in square centimetres.", 2, ans.exact(secV, secTex), [`$A = \\dfrac{1}{2}r^{2}\\theta = \\dfrac{1}{2} \\times ${r}^{2} \\times ${thTex}$`, `$A = ${secTex}\\text{ cm}^{2}$`]),
        P("Find the exact area of the triangle $\\mathrm{OAB}$, in square centimetres.", 2, ansRoot(tri), [
          `Area $= \\dfrac{1}{2}r^{2}\\sin\\theta = \\dfrac{1}{2} \\times ${r}^{2} \\times \\sin ${thTex}$`, `$\\sin ${thTex} = ${sinTex}$, so the area is $${tri.tex}\\text{ cm}^{2}$.`]),
        P("Find the exact area of the segment, in square centimetres.", 1, ans.exact(secV - tri.value, `${secTex} - ${tri.tex}`), [
          `Area of segment $=$ area of sector $-$ area of triangle $= ${secTex} - ${tri.tex}$`])] };
    } });

  // ======================= 3.5 =======================
  // Special values as k sqrt(radicand) / den.
  const SV = { sin: { 30: [1, 1, 2], 45: [1, 2, 2], 60: [1, 3, 2] }, cos: { 30: [1, 3, 2], 45: [1, 2, 2], 60: [1, 1, 2] }, tan: { 30: [1, 3, 3], 45: [1, 1, 1], 60: [1, 3, 1] } };
  const svRoot = (f, a) => surdQ(SV[f][a][0], SV[f][a][1], SV[f][a][2]);
  const EX = { type: "t3-exact-values", syllabus: ["3.5"] };
  reg({ ...EX, representation: "equation", format: "mcq", unknown: "special-value", levels: [1], skills: ["SL3.5.exact-special"], title: "Recall an exact trig value",
    build({ rng }) {
      const f = rng.pick(["sin", "cos", "tan"]), a = rng.pick([30, 45, 60]), radians = rng.bool(), at = (x) => (radians ? piFrac(x, 180) : deg(x));
      const o = (g, x, why) => ({ text: m(svRoot(g, x).tex), value: svRoot(g, x).value, why });
      const others = ["sin", "cos", "tan"].filter((g) => g !== f), angles = [30, 45, 60].filter((x) => x !== a);
      const wrongs = [o(others[0], a, `This is $\\${others[0]} ${at(a)}$.`), o(f, angles[0], `This is $\\${f} ${at(angles[0])}$.`), o(f, angles[1], `This is $\\${f} ${at(angles[1])}$.`), o(others[1], a, `This is $\\${others[1]} ${at(a)}$.`), o("tan", 60), o("sin", 45)];
      const tri = a === 45 ? "a right-angled isosceles triangle with sides $1$, $1$ and $\\sqrt{2}$" : "half of an equilateral triangle, with sides $1$, $\\sqrt{3}$ and $2$";
      return { params: { f, a }, stem: `Consider the angle $${at(a)}$${radians ? " radians" : ""}.`, parts: [
        P(`Which is the exact value of $\\${f} ${at(a)}$?`, 1, ans.choice(rng, o(f, a), wrongs), [`Use ${tri}.`, `$\\${f} ${at(a)} = ${svRoot(f, a).tex}$`])] };
    } });
  reg({ ...EX, representation: "words", format: "mcq", unknown: "sign-in-quadrant", levels: [1], skills: ["SL3.5.unit-circle", "SL3.5.related-angles"], title: "The quadrant from the signs of two ratios",
    build({ rng }) {
      const q = rng.int(1, 4), [f, g] = rng.pick([["sin", "cos"], ["sin", "tan"], ["cos", "tan"]]), pos = (h) => positiveIn[h].includes(q);
      const where = (h) => { const qs = pos(h) ? positiveIn[h] : [1, 2, 3, 4].filter((x) => !positiveIn[h].includes(x)); return `${Word[h]} is ${pos(h) ? "positive" : "negative"} in the ${QUAD[qs[0] - 1]} and ${QUAD[qs[1] - 1]} quadrants.`; };
      return { params: { f, g, signs: [pos(f) ? 1 : -1, pos(g) ? 1 : -1] }, stem: `The angle $\\theta$ satisfies $\\${f}\\theta ${pos(f) ? ">" : "<"} 0$ and $\\${g}\\theta ${pos(g) ? ">" : "<"} 0$.`, parts: [
        P("In which quadrant does $\\theta$ lie?", 1, ans.choice(rng, { text: `the ${QUAD[q - 1]} quadrant`, value: q }, QUAD.map((n, i) => ({ text: `the ${n} quadrant`, value: i + 1 })).filter((x) => x.value !== q)), [
          where(f), where(g), `Both are true only in the ${QUAD[q - 1]} quadrant.`])] };
    } });
  reg({ ...EX, representation: "equation", format: "value", unknown: "special-sum", levels: [2], skills: ["SL3.5.exact-special"], title: "Exact values: a product and a sum of squares",
    build({ rng }) {
      const fs = ["sin", "cos", "tan"], as = [30, 45, 60], radians = rng.bool(), at = (x) => (radians ? piFrac(x, 180) : deg(x));
      let f1, a1, f2, a2, c, prod;
      do { f1 = rng.pick(fs); a1 = rng.pick(as); f2 = rng.pick(fs); a2 = rng.pick(as); c = rng.pick([2, 4, 6, 8]); prod = SV[f1][a1][1] * SV[f2][a2][1]; }
      while ((f1 === f2 && a1 === a2) || fmt.sqrtParts(prod).in === 6 || (f1 === "tan" && a1 === 45) || (f2 === "tan" && a2 === 45));
      const res = surdQ(c * SV[f1][a1][0] * SV[f2][a2][0], prod, SV[f1][a1][2] * SV[f2][a2][2]);
      let g1, b1, g2, b2;
      do { g1 = rng.pick(fs); b1 = rng.pick(as); g2 = rng.pick(fs); b2 = rng.pick(as); } while ((g1 === g2 && b1 === b2) || (g1 === "tan" && b1 === 45) || (g2 === "tan" && b2 === 45));
      const sq = (g, b) => rat.Q(SV[g][b][0] ** 2 * SV[g][b][1], SV[g][b][2] ** 2), s1 = sq(g1, b1), s2 = sq(g2, b2), sum = rat.add(s1, s2);
      const t = (g, b) => `\\${g} ${at(b)}`, t2 = (g, b) => `\\${g}^{2} ${at(b)}`;
      return { params: { c, f1, a1, f2, a2, g1, b1, g2, b2 }, stem: "Do not use a calculator in this question.", parts: [
        P(`Find the exact value of $${c}${t(f1, a1)}${t(f2, a2)}$.`, 2, ansRoot(res), [
          `$${t(f1, a1)} = ${svRoot(f1, a1).tex}$ and $${t(f2, a2)} = ${svRoot(f2, a2).tex}$`, `$${c} \\times ${svRoot(f1, a1).tex} \\times ${svRoot(f2, a2).tex} = ${res.tex}$`]),
        P(`Find the exact value of $${t2(g1, b1)} + ${t2(g2, b2)}$.`, 2, ans.frac(sum.n, sum.d), [
          `$${t2(g1, b1)} = \\left(${svRoot(g1, b1).tex}\\right)^{2} = ${rat.tex(s1)}$`, `$${t2(g2, b2)} = \\left(${svRoot(g2, b2).tex}\\right)^{2} = ${rat.tex(s2)}$`, `$${rat.tex(s1)} + ${rat.tex(s2)} = ${rat.tex(sum)}$`])] };
    } });
  reg({ ...EX, representation: "equation", format: "value", unknown: "given-related", levels: [2], skills: ["SL3.5.related-angles", "SL3.5.unit-circle"], title: "Ratios of related angles",
    build({ rng }) {
      const f = rng.pick(["sin", "cos", "tan"]);
      const [p, q] = f === "tan" ? rng.pick([[3, 2], [2, 5], [5, 4], [7, 3], [1, 4], [4, 7], [8, 5]]) : rng.pick([[2, 7], [3, 8], [1, 4], [3, 5], [5, 9], [2, 3], [4, 7], [1, 6], [5, 8]]);
      const REL = [{ tex: "\\pi - \\theta", quad: 2 }, { tex: "\\pi + \\theta", quad: 3 }, { tex: "2\\pi - \\theta", quad: 4 }, { tex: "-\\theta", quad: 4 }];
      const picks = rng.sample([0, 1, 2, 3], 3);
      return { params: { f, p, q, picks }, stem: `It is given that $\\${f}\\theta = ${frac(p, q)}$, where $0 < \\theta < \\dfrac{\\pi}{2}$.`, parts: picks.map((i) => {
        const r = REL[i], plus = positiveIn[f].includes(r.quad);
        return P(`Write down the value of $\\${f}(${r.tex})$.`, 1, ans.frac(plus ? p : -p, q), [
          `The angle $${r.tex}$ is in the ${QUAD[r.quad - 1]} quadrant, where ${WORD[f]} is ${plus ? "positive" : "negative"}, and its reference angle is $\\theta$.`,
          `$\\${f}(${r.tex}) = ${plus ? "" : "-"}\\${f}\\theta = ${frac(plus ? p : -p, q)}$`]);
      }) };
    } });

  // ======================= 3.6 =======================
  const ID = { type: "t3-identity-values", syllabus: ["3.6"], representation: "equation" };
  reg({ ...ID, format: "value", unknown: "cos2-from-sin", levels: [3], skills: ["SL3.6.ratio-from-ratio", "SL3.6.double-angle-values"], title: "Ratios and double angles for an angle in a given quadrant",
    build({ rng }) {
      const [p, q] = rng.pick([[3, 5], [4, 5], [5, 13], [12, 13], [8, 17], [15, 17], [7, 25], [24, 25], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [2, 7], [3, 7]]);
      const quad = rng.pick([2, 3, 4]), given = rng.pick(["sin", "cos"]), other = given === "sin" ? "cos" : "sin";
      const sg = (h) => (positiveIn[h].includes(quad) ? 1 : -1), R = q * q - p * p;
      const gv = surdQ(sg(given) * p, 1, q), ov = surdQ(sg(other), R, q), s2 = surdQ(2 * sg("sin") * sg("cos") * p, R, q * q);
      const c2n = given === "sin" ? q * q - 2 * p * p : 2 * p * p - q * q, t2 = surdQ(2 * sg("sin") * sg("cos") * p * q * q, R, q * q * c2n);
      const range = { 2: "\\dfrac{\\pi}{2} < \\theta < \\pi", 3: "\\pi < \\theta < \\dfrac{3\\pi}{2}", 4: "\\dfrac{3\\pi}{2} < \\theta < 2\\pi" }[quad];
      const sinTex = given === "sin" ? gv.tex : ov.tex, cosTex = given === "cos" ? gv.tex : ov.tex;
      return { params: { p, q, quad, given }, stem: `It is given that $\\${given}\\theta = ${gv.tex}$ and $${range}$.`, parts: [
        P(`Find the exact value of $\\${other}\\theta$.`, 2, ansRoot(ov), [
          `$\\${other}^{2}\\theta = 1 - \\${given}^{2}\\theta = 1 - ${frac(p * p, q * q)} = ${frac(R, q * q)}$`,
          `$\\theta$ is in the ${QUAD[quad - 1]} quadrant, where ${WORD[other]} is ${sg(other) > 0 ? "positive" : "negative"}, so $\\${other}\\theta = ${ov.tex}$.`]),
        P("Find the exact value of $\\sin 2\\theta$.", 2, ansRoot(s2), [
          `$\\sin 2\\theta = 2\\sin\\theta\\cos\\theta = 2 \\times \\left(${sinTex}\\right) \\times \\left(${cosTex}\\right)$`, `$\\sin 2\\theta = ${s2.tex}$`]),
        P("Find the exact value of $\\cos 2\\theta$.", 2, ans.frac(c2n, q * q), [
          given === "sin" ? `$\\cos 2\\theta = 1 - 2\\sin^{2}\\theta = 1 - 2 \\times ${frac(p * p, q * q)}$` : `$\\cos 2\\theta = 2\\cos^{2}\\theta - 1 = 2 \\times ${frac(p * p, q * q)} - 1$`, `$\\cos 2\\theta = ${frac(c2n, q * q)}$`]),
        P("Find the exact value of $\\tan 2\\theta$.", 1, ansRoot(t2), [
          `$\\tan 2\\theta = \\dfrac{\\sin 2\\theta}{\\cos 2\\theta}$`, `$\\tan 2\\theta = \\left(${s2.tex}\\right) \\div \\left(${frac(c2n, q * q)}\\right) = ${t2.tex}$`])] };
    } });
  reg({ ...ID, format: "value", unknown: "expand-square", levels: [3], skills: ["SL3.6.double-angle-values", "SL3.6.simplify"], title: "From the sum of sine and cosine to the double angle",
    build({ rng }) {
      const [kn, kd] = rng.pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [5, 4], [4, 3], [1, 5], [2, 5], [3, 5], [4, 5], [6, 5], [7, 5]]), sgn = rng.sign(), plus = rng.bool();
      const k = rat.Q(sgn * kn, kd), k2 = rat.mul(k, k), sc = plus ? rat.div(rat.sub(k2, 1), 2) : rat.div(rat.sub(1, k2), 2), s2 = rat.mul(sc, 2), otherSq = rat.sub(2, k2);
      const op = plus ? "+" : "-", op2 = plus ? "-" : "+", lhs = `(\\sin\\theta ${op} \\cos\\theta)^{2}`, lhs2 = `(\\sin\\theta ${op2} \\cos\\theta)^{2}`;
      return { params: { k: rat.num(k), plus }, stem: `It is given that $\\sin\\theta ${op} \\cos\\theta = ${rat.tex(k)}$.`, parts: [
        P("Find the value of $\\sin\\theta\\cos\\theta$.", 3, ans.frac(sc.n, sc.d), [
          `$${lhs} = \\sin^{2}\\theta ${op} 2\\sin\\theta\\cos\\theta + \\cos^{2}\\theta = 1 ${op} 2\\sin\\theta\\cos\\theta$`,
          `$1 ${op} 2\\sin\\theta\\cos\\theta = \\left(${rat.tex(k)}\\right)^{2} = ${rat.tex(k2)}$`,
          `$2\\sin\\theta\\cos\\theta = ${plus ? `${rat.tex(k2)} - 1` : `1 - ${rat.tex(k2)}`} = ${rat.tex(s2)}$, so $\\sin\\theta\\cos\\theta = ${rat.tex(sc)}$.`]),
        P("Hence find the value of $\\sin 2\\theta$.", 1, ans.frac(s2.n, s2.d), [`$\\sin 2\\theta = 2\\sin\\theta\\cos\\theta = ${rat.tex(s2)}$`]),
        P(`Find the value of $${lhs2}$.`, 2, ans.frac(otherSq.n, otherSq.d), [
          `$${lhs2} = 1 ${op2} 2\\sin\\theta\\cos\\theta = 1 ${op2} \\sin 2\\theta$`, `$1 ${op2} ${fmt.paren(s2)} = ${rat.tex(otherSq)}$`])] };
    } });
  reg({ ...ID, format: "mcq", unknown: "product-sine", levels: [1], skills: ["SL3.6.simplify"], title: "Recognise a double-angle identity",
    build({ rng }) {
      const form = rng.pick(["product", "difference", "one-minus", "minus-one"]), a = rng.int(1, 4), k = rng.int(1, 4), ax = coef(a, "x");
      const o = (c, f, mult, why) => ({ text: m(coef(c, `\\${f} ${coef(mult, "x")}`)), value: [c, f, mult], why });
      let shown, right, wrongs, rule;
      if (form === "product") {
        shown = `${2 * k}\\sin ${ax}\\cos ${ax}`; right = o(k, "sin", 2 * a); rule = "\\sin 2A = 2\\sin A\\cos A";
        wrongs = [o(2 * k, "sin", 2 * a, "The factor $2$ is part of the identity $\\sin 2A = 2\\sin A\\cos A$, so it is used up."), o(k, "sin", a, "The angle doubles."), o(k, "cos", 2 * a, "The product of a sine and a cosine of the same angle gives the sine of the double angle."), o(2 * k, "sin", a)];
      } else {
        shown = form === "difference" ? `\\cos^{2} ${ax} - \\sin^{2} ${ax}` : form === "one-minus" ? `1 - 2\\sin^{2} ${ax}` : `2\\cos^{2} ${ax} - 1`;
        right = o(1, "cos", 2 * a); rule = form === "difference" ? "\\cos 2A = \\cos^{2} A - \\sin^{2} A" : form === "one-minus" ? "\\cos 2A = 1 - 2\\sin^{2} A" : "\\cos 2A = 2\\cos^{2} A - 1";
        wrongs = [o(1, "sin", 2 * a, "These forms all belong to the cosine of the double angle."), o(1, "cos", a, "The angle doubles."), o(-1, "cos", 2 * a, "Check the sign against the identity."), o(2, "cos", 2 * a)];
      }
      return { params: { form, a, k }, stem: `Consider the expression $${shown}$.`, parts: [
        P("Which expression is equal to it for all values of $x$?", 1, ans.choice(rng, right, wrongs), [`Use $${rule}$ with $A = ${ax}$.`, `$${shown} = ${right.text.slice(1, -1)}$`])] };
    } });

  // ======================= 3.7 =======================
  reg({ type: "t3-trig-read-features", syllabus: ["3.7"], representation: "equation", format: "value", unknown: "amplitude", levels: [1],
    skills: ["SL3.7.read-features"], title: "Amplitude and principal axis from an equation",
    build({ rng }) {
      const a = rng.int(2, 7) * rng.pick([1, 1, -1]), b = rng.int(1, 5), d = rng.nonzero(-6, 6), fn = rng.pick(["sin", "cos"]);
      return { params: { a, b, d, fn }, stem: `The function $f$ is defined by $f(x) = ${coef(a, `\\${fn} ${coef(b, "x")}`)} ${signed(d)}$, for $x \\in \\mathbb{R}$.`, parts: [
        P("Write down the amplitude of $f$.", 1, ans.int(Math.abs(a), a < 0 ? { misconceptions: [{ value: a, text: "An amplitude is a distance, so it is positive. The negative sign reflects the graph." }] } : undefined), [
          `The amplitude is the size of the coefficient of $\\${fn} ${coef(b, "x")}$: $${Math.abs(a)}$.`]),
        P("The principal axis of the graph of $f$ has equation $y = k$. Write down the value of $k$.", 1, ans.int(d), [`The constant term gives the principal axis: $y = ${d}$, so $k = ${d}$.`])] };
    } });
  reg({ type: "t3-trig-read-features", syllabus: ["3.7"], representation: "graph", format: "value", unknown: "a-d-from-graph", levels: [2],
    skills: ["SL3.7.read-features", "SL3.7.equation-from-graph"], title: "Amplitude, principal axis and period from a graph",
    build({ rng }) {
      const p = rng.pick([4, 8, 12]), a = rng.int(1, 4), d = rng.nonzero(-2, 4), fn = rng.pick(["sin", "cos"]);
      const A = fn === "sin" ? [p / 4, d + a] : [p, d + a], B = fn === "sin" ? [(3 * p) / 4, d - a] : [p / 2, d - a], gap = Math.abs(A[0] - B[0]);
      const graph = { x: [0, 2 * p], y: [Math.min(0, d - a) - 1, Math.max(0, d + a) + 1], xStep: p / 4, yStep: 1,
        functions: [{ fn: { type: "trig", name: fn, a, b: (2 * Math.PI) / p, c: 0, d } }], points: [{ x: A[0], y: A[1], label: "A" }, { x: B[0], y: B[1], label: "B" }],
        alt: "A wave with a maximum point A and a minimum point B marked" };
      return { params: { p, fn }, graph, stem: `The graph shows $y = f(x)$ for $0 \\le x \\le ${2 * p}$, where $f(x) = a\\${fn}(bx) + d$ and $a > 0$, $b > 0$. The point $\\mathrm{A}${point(A[0], A[1])}$ is a maximum point and the point $\\mathrm{B}${point(B[0], B[1])}$ is the ${fn === "sin" ? "next" : "previous"} minimum point.`, parts: [
        P("Find the value of $a$.", 1, ans.int(a), [`The amplitude is half the distance between the maximum and minimum values: $a = \\dfrac{${d + a} - ${fmt.paren(d - a)}}{2} = ${a}$`]),
        P("Find the value of $d$.", 1, ans.int(d), [`The principal axis is halfway between the maximum and minimum values: $d = \\dfrac{${d + a} + ${fmt.paren(d - a)}}{2} = ${d}$`]),
        P("Find the exact value of $b$.", 2, ans.exact((2 * Math.PI) / p, piFrac(2, p)), [
          `A maximum and the nearest minimum are half a period apart, so the period is $2 \\times ${gap} = ${p}$.`, `$b = \\dfrac{2\\pi}{\\text{period}} = \\dfrac{2\\pi}{${p}} = ${piFrac(2, p)}$`])] };
    } });
  reg({ type: "t3-trig-sketch", syllabus: ["3.7"], representation: "graph", format: "graph-pick", unknown: "sketch-wave", levels: [2],
    skills: ["SL3.7.sketch", "SL3.7.read-features"], title: "Pick the graph of a sine or cosine function",
    build({ rng }) {
      const fn = rng.pick(["sin", "cos"]), other = fn === "sin" ? "cos" : "sin", a = rng.pick([2, 3]), k = rng.pick([2, 4]), d = rng.int(-2, 2), W = 4 * k, Y = a + Math.max(Math.abs(d), 2) + 2;
      const mk = (nm, a2, k2, d2, why) => ({ graph: { x: [0, W], y: [-Y, Y], xStep: k / 2, yStep: 1, functions: [{ fn: { type: "trig", name: nm, a: a2, b: Math.PI / k2, c: 0, d: d2 } }], alt: "A wave" }, value: [nm, a2, k2, d2], why });
      const right = mk(fn, a, k, d);
      const wrongs = E.graph.pickDistinct(right.graph, rng.shuffle([
        mk(other, a, k, d, fn === "sin" ? "This graph starts at a maximum, as a cosine graph does. A sine graph starts on its principal axis and rises." : "This graph starts on its principal axis, as a sine graph does. A cosine graph starts at a maximum."),
        mk(fn, -a, k, d, "This graph has been reflected in its principal axis."),
        mk(fn, a, k / 2, d, "This graph has half the correct period."),
        mk(fn, a, 2 * k, d, "This graph has twice the correct period."),
        mk(fn, a, k, d === 0 ? 2 : -d, "The principal axis of this graph is in the wrong place."),
        mk(fn, a + 1, k, d, "The amplitude of this graph is too large.")]), 3);
      return { params: { fn, a, k, d }, stem: `Let $f(x) = ${a}\\${fn}\\left(\\dfrac{\\pi x}{${k}}\\right) ${signed(d)}$, for $0 \\le x \\le ${W}$.`, parts: [
        P("Which graph shows $y = f(x)$?", 2, ans.graph(rng, right, wrongs), [
          `The amplitude is $${a}$ and the principal axis is $y = ${d}$, so the graph lies between $y = ${d - a}$ and $y = ${d + a}$.`,
          `The period is $2\\pi \\div \\dfrac{\\pi}{${k}} = ${2 * k}$, so the graph repeats every $${2 * k}$ units.`,
          fn === "sin" ? `$f(0) = ${d}$, and the graph rises from its principal axis.` : `$f(0) = ${d + a}$, so the graph starts at a maximum.`]),
        P("Write down the period of $f$.", 1, ans.int(2 * k), [`Period $= 2\\pi \\div \\dfrac{\\pi}{${k}} = ${2 * k}$`]),
        P("Write down the maximum value of $f$.", 1, ans.int(d + a), [`The maximum is the principal axis plus the amplitude: $${d} + ${a} = ${d + a}$`])] };
    } });
  reg({ type: "t3-trig-model-parameters", syllabus: ["3.7"], representation: "words", format: "value", unknown: "wheel-model", levels: [3],
    skills: ["SL3.7.model-context", "SL3.7.equation-from-graph", "SL3.5.exact-special"], title: "Build a cosine model from a description",
    build({ rng }) {
      const wheel = rng.bool(), R = wheel ? rng.int(6, 30) : rng.int(1, 4), lo = wheel ? rng.int(1, 4) : rng.int(1, 5), hi = lo + 2 * R, T = wheel ? rng.pick([6, 9, 12, 15, 18, 24, 30]) : 12;
      const a = wheel ? -R : R, d = lo + R, j = T % 6 === 0 ? rng.pick([1, 2, 4, 5]) : rng.pick([2, 4]), ts = (j * T) / 6, cosv = j === 1 || j === 5 ? 1 : -1, val = rat.Q(2 * d + a * cosv, 2);
      const stem = wheel
        ? `A Ferris wheel has a diameter of $${unit(2 * R, "m")}$, and its lowest point is $${unit(lo, "m")}$ above the ground. The wheel turns at a constant rate and completes one revolution every $${T}$ minutes. A seat starts at the lowest point of the wheel. The height of the seat above the ground, in metres, $t$ minutes later is modelled by $h(t) = a\\cos(bt) + d$, where $b > 0$.`
        : `The depth of water at the end of a pier is modelled by $h(t) = a\\cos(bt) + d$, where $h$ is in metres, $t$ is the time in hours after a high tide and $b > 0$. The depth is $${unit(hi, "m")}$ at high tide and $${unit(lo, "m")}$ at low tide, and successive high tides are $${T}$ hours apart.`;
      return { params: { wheel, lo, hi, T, ts }, stem, parts: [
        P("Find the value of $d$.", 1, ans.int(d), [`${wheel ? `The greatest height is $${lo} + ${2 * R} = ${hi}$ and the least is $${lo}$. ` : ""}The value of $d$ is halfway between the greatest and least values: $d = \\dfrac{${hi} + ${lo}}{2} = ${d}$`]),
        P("Find the value of $a$.", 2, ans.int(a, wheel ? { misconceptions: [{ value: R, text: "The seat starts at its lowest point, but a positive cosine curve starts at its highest point. So $a$ is negative." }] } : undefined), [
          `The amplitude is $\\dfrac{${hi} - ${lo}}{2} = ${R}$.`,
          wheel ? `At $t = 0$ the seat is at its lowest point, and $\\cos 0 = 1$, so $a$ is negative: $a = ${a}$` : `At $t = 0$ the depth is greatest, and $\\cos 0 = 1$, so $a$ is positive: $a = ${a}$`]),
        P("Find the exact value of $b$.", 2, ans.exact((2 * Math.PI) / T, piFrac(2, T)), [`The period is $${T}$.`, `$b = \\dfrac{2\\pi}{${T}}${T % 2 ? "" : ` = ${piFrac(2, T)}`}$`]),
        P(wheel ? `Find the height of the seat above the ground, in metres, when $t = ${ts}$.` : `Find the depth of the water, in metres, when $t = ${ts}$.`, 2, ans.frac(val.n, val.d), [
          `$h(${ts}) = ${coef(a, `\\cos\\left(${piFrac(2, T)} \\times ${ts}\\right)`)} + ${d} = ${coef(a, `\\cos\\left(${piFrac(2 * ts, T)}\\right)`)} + ${d}$`,
          `$\\cos\\left(${piFrac(2 * ts, T)}\\right) = ${frac(cosv, 2)}$, so $h(${ts}) = ${rat.tex(rat.Q(a * cosv, 2))} + ${d} = ${rat.tex(val)}$`])] };
    } });
  reg({ type: "t3-trig-model-use", syllabus: ["3.7", "3.8"], representation: "graph", format: "value", unknown: "duration-above", levels: [4], calculator: true,
    skills: ["SL3.7.model-context", "SL3.8.graphical"], title: "A cosine model: a value, a first time and a duration",
    build({ rng }) {
      let a, d, b, W, L, t0, t1, t2, v0;
      do {
        a = rng.int(12, 45) / 10; d = a + rng.int(10, 40) / 10; b = rng.pick([0.48, 0.5, 0.52, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8]); W = Math.floor((2 * Math.PI) / b);
        L = Math.round((d + a * (rng.int(-50, 60) / 100)) * 10) / 10; t1 = Math.acos((d - L) / a) / b; t2 = (2 * Math.PI) / b - t1; t0 = rng.int(1, W - 1); v0 = d - a * Math.cos(b * t0);
      } while (t2 > W - 0.3 || t1 < 0.5 || edge(t1) || edge(t2 - t1) || edge(v0) || Math.abs(t0 - t1) < 0.4 || sf(Number(sf(t2, 4)) - Number(sf(t1, 4))) !== sf(t2 - t1));
      const tide = rng.bool(), q = tide ? "depth of the water" : "height of the seat above the ground";
      const stem = tide
        ? `The depth of the water in a harbour, in metres, is modelled by $h(t) = ${num(d)} - ${num(a)}\\cos(${num(b)}t)$, for $0 \\le t \\le ${W}$, where $t$ is the time in hours after a low tide. The graph of $h$ is shown, with the line $h = ${num(L)}$ dashed.`
        : `A seat on a Ferris wheel starts at its lowest point. Its height above the ground, in metres, is modelled by $h(t) = ${num(d)} - ${num(a)}\\cos(${num(b)}t)$, for $0 \\le t \\le ${W}$, where $t$ is the time in minutes after the start. The graph of $h$ is shown, with the line $h = ${num(L)}$ dashed.`;
      const graph = { x: [0, W], y: [0, Math.ceil(d + a) + 1], xStep: 1, yStep: 1, functions: [{ fn: { type: "trig", name: "cos", a: -a, b, c: 0, d } }], asymptotes: [{ y: L }], xLabel: "t", yLabel: "h", alt: "One cycle of a wave that starts at its minimum, with a dashed horizontal line across it" };
      return { params: { a, d, b, W, L, t0 }, graph, stem, parts: [
        P(`Find the ${q} when $t = ${t0}$.`, 2, ans.sf(v0), [`With the calculator in radians, $h(${t0}) = ${num(d)} - ${num(a)}\\cos(${num(b)} \\times ${t0})$`, `$h(${t0}) = ${unit(sf(v0), "m")}$`]),
        P(`Find the first value of $t$ for which the ${q} is $${unit(L, "m")}$.`, 2, ans.sf(t1), [
          `Solve $${num(d)} - ${num(a)}\\cos(${num(b)}t) = ${num(L)}$ with the calculator, for example by finding where the graph of $h$ meets the line $h = ${num(L)}$.`, `The first solution is $t = ${sf(t1)}$.`]),
        P(tide ? `A ship can enter the harbour only when the depth of the water is more than $${unit(L, "m")}$. Find the length of time, in hours, during $0 \\le t \\le ${W}$ for which the ship can enter.`
          : `Find the length of time, in minutes, during $0 \\le t \\le ${W}$ for which the seat is more than $${unit(L, "m")}$ above the ground.`, 3,
          ans.sf(t2 - t1, 3, { misconceptions: [{ value: t2, text: "This is the time at which the level is passed for the second time. The length of time is the difference between the two times." }] }), [
            `The second solution in the interval is $t = ${sf(t2, 4)}$.`, `The graph is above the line between the two solutions.`, `Length of time $= ${sf(t2, 4)} - ${sf(t1, 4)} = ${sf(t2 - t1)}$`])] };
    } });

  // ======================= 3.8 =======================
  const TE = { type: "t3-trig-equation", syllabus: ["3.8", "3.5"], representation: "equation", format: "value" };
  const NICE = [30, 45, 60, 120, 135, 150, 210, 225, 240, 300, 315, 330];
  // The equation fn(arg) = value as it is shown: 2 sin x = sqrt(3), sqrt(2) cos x = -1, tan x = -sqrt(3), ...
  function shownEq(fn, v, arg) {
    if (fn === "tan") return `\\tan ${arg} = ${v.tex.replace("\\dfrac{\\sqrt{3}}{3}", "\\dfrac{1}{\\sqrt{3}}")}`;
    if (v.ref === 45) return `\\sqrt{2}\\,\\${fn} ${arg} = ${v.value > 0 ? "1" : "-1"}`;
    return `2\\${fn} ${arg} = ${Math.abs(Math.abs(v.value) - 0.5) < 1e-9 ? (v.value > 0 ? "1" : "-1") : (v.value > 0 ? "" : "-") + "\\sqrt{3}"}`;
  }
  reg({ ...TE, unknown: "basic-degrees", levels: [1], skills: ["SL3.8.solve-basic", "SL3.5.exact-special"], title: "Solve a basic trig equation in degrees",
    build({ rng }) {
      const fn = rng.pick(["sin", "cos", "cos", "tan", "tan"]), top = fn === "sin" ? 90 : 180, dg = rng.pick(fn === "sin" ? [30, 45, 60] : [30, 45, 60, 120, 135, 150]), v = exact(fn, dg);
      return { params: { fn, target: v.value, top }, stem: `Consider the equation $${shownEq(fn, v, "x")}$, for $${deg(0)} \\le x \\le ${deg(top)}$.`, parts: [
        P("Find the value of $x$, in degrees.", 2, ans.int(dg, { display: m(deg(dg)) }), [
          `$\\${fn} x = ${v.tex}$`,
          dg < 90 ? `$\\${fn} x$ is positive, so $x$ is in the first quadrant: $x = ${deg(dg)}$` : `The reference angle is $${deg(v.ref)}$, and $\\${fn} x$ is negative, so $x$ is in the second quadrant: $x = ${deg(180)} - ${deg(v.ref)} = ${deg(dg)}$`])] };
    } });
  reg({ ...TE, unknown: "multiple-angle", levels: [3], skills: ["SL3.8.compound-angle", "SL3.5.exact-special"], title: "Solve a trig equation in a multiple angle",
    build({ rng }) {
      const fn = rng.pick(["sin", "cos", "tan"]), k = rng.pick([2, 2, 3]), top = k === 3 || rng.bool() ? 180 : 360, v = exact(fn, rng.pick(NICE));
      // every value y = kx in [0, k top] with the right ratio; x = y / k
      const ys = [];
      for (let y = 15; y < k * top; y += 15) if (y % 90 !== 0 && Math.abs(Math[fn](rad(y)) - v.value) < 1e-9) ys.push(y);
      const xt = (y) => piFrac(y, 180 * k), topTex = piFrac(top, 180), kx = `${k}x`;
      return { params: { fn, k, target: v.value, top }, stem: `Consider the equation $${shownEq(fn, v, kx)}$, for $0 \\le x \\le ${topTex}$.`, parts: [
        P("Find the smallest solution, giving an exact answer.", 2, ans.exact(rad(ys[0] / k), xt(ys[0])), [
          `$\\${fn} ${kx} = ${v.tex}$, and the smallest positive angle with this ${WORD[fn]} is $${piFrac(ys[0], 180)}$.`, `$${kx} = ${piFrac(ys[0], 180)}$, so $x = ${xt(ys[0])}$.`]),
        P("Find the number of solutions of the equation in the given interval.", 2, ans.int(ys.length, { misconceptions: [{ value: ys.filter((y) => y <= top).length, text: `The angle $${kx}$ runs from $0$ to $${piFrac(k * top, 180)}$, so look for values of $${kx}$ in that whole interval.` }].filter((mc) => mc.value !== ys.length) }), [
          `Since $0 \\le x \\le ${topTex}$, the angle $${kx}$ lies between $0$ and $${piFrac(k * top, 180)}$.`,
          `In that interval $${kx} = ${ys.map((y) => piFrac(y, 180)).join(",\\ ")}$.`, `There are $${ys.length}$ solutions.`]),
        P("Find the largest solution, giving an exact answer.", 2, ans.exact(rad(ys[ys.length - 1] / k), xt(ys[ys.length - 1])), [
          `The largest value is $${kx} = ${piFrac(ys[ys.length - 1], 180)}$.`, `$x = ${xt(ys[ys.length - 1])}$`])] };
    } });
  reg({ ...TE, syllabus: ["3.8", "3.6"], unknown: "double-equals-sin", levels: [3], skills: ["SL3.8.factorise-not-divide", "SL3.6.double-angle-values", "SL3.8.solve-basic"], title: "An equation with a double angle: factorise, do not divide",
    build({ rng }) {
      const common = rng.pick(["sin", "cos"]), inner = common === "sin" ? "cos" : "sin", sgn = rng.sign(), size = rng.pick([1, 2, 3]);
      const kAbs = size === 1 ? "" : `\\sqrt{${size}}`, halfTex = (sgn < 0 ? "-" : "") + (size === 1 ? "\\dfrac{1}{2}" : `\\dfrac{\\sqrt{${size}}}{2}`), half = (sgn * Math.sqrt(size)) / 2;
      const zeros = common === "sin" ? [180] : [90, 270], others = NICE.filter((x) => Math.abs(exact(inner, x).value - half) < 1e-9), all = zeros.concat(others).sort((x, y) => x - y);
      const rhs = `${sgn < 0 ? "-" : ""}${kAbs}\\${common} x`, moved = `2\\sin x\\cos x ${sgn > 0 ? "-" : "+"} ${kAbs}\\${common} x = 0`, bracket = `2\\${inner} x ${sgn > 0 ? "-" : "+"} ${kAbs || "1"}`;
      return { params: { common, k: sgn * Math.sqrt(size) }, stem: `Consider the equation $\\sin 2x = ${rhs}$, for $0 < x < 2\\pi$.`, parts: [
        P("Find the number of solutions of the equation in the given interval.", 3, ans.int(all.length, { misconceptions: [{ value: others.length, text: `Dividing both sides by $\\${common} x$ loses the solutions of $\\${common} x = 0$. Factorise instead.` }] }), [
          `$\\sin 2x = 2\\sin x\\cos x$, so $${moved}$`,
          `$\\${common} x\\left(${bracket}\\right) = 0$, so $\\${common} x = 0$ or $\\${inner} x = ${halfTex}$`,
          `$\\${common} x = 0$ gives $x = ${zeros.map((x) => angleTex(x)).join(",\\ ")}$, and $\\${inner} x = ${halfTex}$ gives $x = ${others.map((x) => angleTex(x)).join(",\\ ")}$.`,
          `There are $${all.length}$ solutions.`]),
        P("Find the smallest solution, giving an exact answer.", 2, ans.exact(rad(all[0]), angleTex(all[0])), [`In order, the solutions are $x = ${all.map((x) => angleTex(x)).join(",\\ ")}$.`, `The smallest is $x = ${angleTex(all[0])}$.`]),
        P("Find the largest solution, giving an exact answer.", 2, ans.exact(rad(all[all.length - 1]), angleTex(all[all.length - 1])), [`The largest solution is $x = ${angleTex(all[all.length - 1])}$.`])] };
    } });
  reg({ type: "t3-trig-model-equation", syllabus: ["3.8", "2.10"], representation: "graph", format: "value", unknown: "solve-vs-line", levels: [4], calculator: true,
    skills: ["SL3.8.graphical"], title: "Where a sine curve meets a straight line",
    build({ rng }) {
      const W = 6, N = 1200;
      let a, b, mm, c, f, g, u, xs;
      const scan = () => {
        // crossings of f and g by a sign scan and bisection; null when a crossing is not clear-cut
        const out = [];
        if (Math.abs(u(0)) < 0.3 || Math.abs(u(W)) < 0.3 || Math.abs(g(0)) > a + 1 || Math.abs(g(W)) > a + 1) return null;
        const du = (x) => (u(x + 1e-5) - u(x - 1e-5)) / 2e-5;
        let px = 0, pu = u(0), pd = du(0);
        for (let i = 1; i <= N; i++) {
          const x = (W * i) / N, ux = u(x), dx = du(x);
          if ((pd < 0) !== (dx < 0) && Math.abs(ux) < 0.35) return null; // the curves nearly touch
          if ((pu < 0) !== (ux < 0)) {
            let lo = px, hi = x;
            for (let j = 0; j < 60; j++) { const mid = (lo + hi) / 2; if ((u(mid) < 0) === (pu < 0)) lo = mid; else hi = mid; }
            const r = (lo + hi) / 2;
            if (Math.abs(du(r)) < 0.6) return null;
            out.push(r);
          }
          px = x; pu = ux; pd = dx;
        }
        return out;
      };
      do {
        a = rng.pick([2, 2.5, 3, 3.5, 4]); b = rng.pick([1, 1.5, 2]); mm = rng.pick([0.2, 0.3, 0.4, 0.5, 0.6, 0.8]) * rng.sign(); c = rng.int(-4, 6) / 2;
        f = (x) => a * Math.sin(b * x); g = (x) => mm * x + c; u = (x) => f(x) - g(x); xs = scan();
      } while (!xs || xs.length < 2 || xs.length > 4 || xs[0] < 0.2 || xs.some(edge));
      const last = xs[xs.length - 1], Y = Math.ceil(a) + 1;
      const graph = { x: [0, W], y: [-Y, Y], xStep: 1, yStep: 1, functions: [{ fn: { type: "trig", name: "sin", a, b, c: 0, d: 0 }, label: "f" }, { fn: { type: "poly", coeffs: [c, mm] }, label: "g" }], alt: "A sine curve f and a straight line g that cross several times" };
      return { params: { a, b, m: mm, c, W }, graph, stem: `Let $f(x) = ${num(a)}\\sin${b === 1 ? " x" : `(${num(b)}x)`}$ and $g(x) = ${fmt.lin(mm, c)}$, for $0 \\le x \\le ${W}$. The graphs of $f$ and $g$ are shown.`, parts: [
        P("Write down the number of solutions of the equation $f(x) = g(x)$.", 1, ans.int(xs.length), [`Each solution is a point where the two graphs cross. They cross $${xs.length}$ times in the interval.`]),
        P("Find the smallest solution of $f(x) = g(x)$.", 2, ans.sf(xs[0]), [`With the calculator in radians, draw both graphs for $0 \\le x \\le ${W}$ and find their intersections.`, `The first intersection is at $x = ${sf(xs[0])}$.`]),
        P("Find the largest solution of $f(x) = g(x)$.", 2, ans.sf(last), [`The last intersection in the interval is at $x = ${sf(last)}$.`])] };
    } });
})(typeof globalThis !== "undefined" ? globalThis : this);
