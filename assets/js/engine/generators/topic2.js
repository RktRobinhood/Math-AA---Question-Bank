/* Topic 2 (Functions) generators. Self-contained: needs only engine.js and graph.js.
   Each generator's independent verifier is in scripts/engine-checks/topic2.mjs under the same id.
   `source` names the old practice template a generator was ported from. */
(function (root) {
  "use strict";
  const E = root.QBEngine;
  const { ans, fmt, graph: G } = E;
  const { num, frac, poly, lin, signed, paren, br, expr, m, sf, surd, point, factor, coef, rat, unit, pct } = fmt;
  const P = (prompt, marks, answer, working) => ({ prompt, marks, answer, working });
  const T2 = { courses: ["aa-sl"], calculator: false };
  const reg = (def) => E.register(Object.assign({}, T2, def));
  const win = (x, y, extra) => Object.assign({ x, y, xStep: 1, yStep: 1 }, extra);

  // ======================= 2.1 straight lines =======================
  const LINE = { type: "fn-line-from-conditions", syllabus: ["2.1"] };
  reg({ ...LINE, unknown: "gradient-from-two-points", representation: "words", format: "value", levels: [1],
    skills: ["SL2.1.gradient"], title: "Gradient through two points",
    build({ rng }) {
      const x1 = rng.int(-5, 3), y1 = rng.int(-6, 6), dx = rng.int(1, 6), dy = rng.nonzero(-8, 8);
      const x2 = x1 + dx, y2 = y1 + dy;
      return { params: { x1, y1, x2, y2 },
        stem: `The points $\\mathrm{A}${point(x1, y1)}$ and $\\mathrm{B}${point(x2, y2)}$ lie on a straight line.`,
        parts: [P("Find the gradient of the line.", 2, ans.frac(dy, dx), [
          `$m = \\dfrac{y_{2} - y_{1}}{x_{2} - x_{1}} = \\dfrac{${y2} - ${paren(y1)}}{${x2} - ${paren(x1)}}$`,
          `$m = \\dfrac{${dy}}{${dx}}${rat.Q(dy, dx).d === dx ? "" : " = " + frac(dy, dx)}$`])] };
    } });

  const linePoint = (rng) => ({ mm: rng.pick([-4, -3, -2, 2, 3, 4]), c0: rng.nonzero(-5, 5), x0: rng.nonzero(-4, 4), y0: rng.int(-6, 6) });
  const lineStem = (s) => `The line $L$ has equation $y = ${lin(s.mm, s.c0)}$. The point $\\mathrm{A}$ has coordinates $${point(s.x0, s.y0)}$.`;
  reg({ ...LINE, unknown: "parallel-through-point", representation: "equation", format: "value", levels: [2],
    skills: ["SL2.1.parallel-perpendicular", "SL2.1.equation-of-line"], title: "Parallel line through a point",
    source: "line-parallel-perpendicular", situationKey: "line-point", situation: linePoint,
    build({ sit: s }) {
      const c = s.y0 - s.mm * s.x0;
      return { stem: lineStem(s) + " A second line passes through $\\mathrm{A}$ and is parallel to $L$.", parts: [
        P("Write down the gradient of the second line.", 1, ans.int(s.mm), [`Parallel lines have equal gradients, so the gradient is $${s.mm}$.`]),
        P("The second line has equation $y = mx + c$. Find the value of $c$.", 2, ans.int(c), [
          `Substitute $\\mathrm{A}$: $${s.y0} = ${s.mm}${br(s.x0)} + c$`, `$c = ${s.y0} - ${paren(s.mm * s.x0)} = ${c}$`])] };
    } });
  reg({ ...LINE, unknown: "perpendicular-through-point", representation: "equation", format: "value", levels: [2],
    skills: ["SL2.1.parallel-perpendicular", "SL2.1.equation-of-line"], title: "Perpendicular line through a point",
    source: "line-parallel-perpendicular", situationKey: "line-point", situation: linePoint,
    build({ sit: s }) {
      const mp = rat.Q(-1, s.mm), c = rat.sub(s.y0, rat.mul(mp, s.x0));
      return { stem: lineStem(s) + " A second line passes through $\\mathrm{A}$ and is perpendicular to $L$.", parts: [
        P("Find the gradient of the second line.", 2, ans.frac(mp.n, mp.d), [
          `Perpendicular gradients multiply to $-1$: $m \\times ${paren(s.mm)} = -1$`, `$m = ${rat.tex(mp)}$`]),
        P("The second line has equation $y = mx + c$. Find the value of $c$.", 2, ans.frac(c.n, c.d), [
          `Substitute $\\mathrm{A}$: $${s.y0} = ${rat.tex(mp)} \\times ${paren(s.x0)} + c$`, `$c = ${s.y0} - ${paren(rat.mul(mp, s.x0))} = ${rat.tex(c)}$`])] };
    } });
  reg({ ...LINE, unknown: "perpendicular-bisector", representation: "words", format: "value", levels: [3],
    skills: ["SL2.1.parallel-perpendicular", "SL2.1.equation-of-line", "SL2.1.gradient"], title: "Perpendicular bisector of a segment",
    build({ rng }) {
      const x1 = rng.int(-5, 3), y1 = rng.int(-5, 3), dx = 2 * rng.nonzero(-3, 3), dy = 2 * rng.nonzero(-3, 3);
      const x2 = x1 + dx, y2 = y1 + dy, mx = x1 + dx / 2, my = y1 + dy / 2;
      const mAB = rat.Q(dy, dx), mp = rat.Q(-dx, dy), c = rat.sub(my, rat.mul(mp, mx));
      return { params: { x1, y1, x2, y2 },
        stem: `The points $\\mathrm{A}${point(x1, y1)}$ and $\\mathrm{B}${point(x2, y2)}$ are given. The line $L$ is the perpendicular bisector of $[\\mathrm{AB}]$.`,
        parts: [
          P("Find the gradient of $[\\mathrm{AB}]$.", 1, ans.frac(mAB.n, mAB.d), [`$m_{\\mathrm{AB}} = \\dfrac{${y2} - ${paren(y1)}}{${x2} - ${paren(x1)}} = ${rat.tex(mAB)}$`]),
          P("Write down the gradient of $L$.", 1, ans.frac(mp.n, mp.d), [`$L$ is perpendicular to $[\\mathrm{AB}]$, so its gradient is the negative reciprocal: $${rat.tex(mp)}$.`]),
          P("The equation of $L$ is $y = mx + c$. Find the value of $c$.", 3, ans.frac(c.n, c.d), [
            `$L$ passes through the midpoint of $[\\mathrm{AB}]$: $\\left(\\dfrac{${x1} + ${paren(x2)}}{2},\\, \\dfrac{${y1} + ${paren(y2)}}{2}\\right) = ${point(mx, my)}$`,
            `$${my} = ${rat.tex(mp)} \\times ${paren(mx)} + c$`, `$c = ${rat.tex(c)}$`])] };
    } });
  reg({ ...LINE, unknown: "equation-two-points", representation: "graph", format: "value", levels: [2],
    skills: ["SL2.1.gradient", "SL2.1.equation-of-line", "SL2.1.intercepts"], title: "Gradient and intercept from a graph",
    build({ rng }) {
      const mq = rng.pick([[1, 2], [-1, 2], [1, 1], [-1, 1], [2, 1], [-2, 1], [3, 2], [-3, 2]]), c = rng.int(-3, 3);
      const at = (x) => c + (mq[0] * x) / mq[1];
      const xa = -2, xb = 2;
      return { params: { xa, xb },
        graph: win([-6, 6], [-8, 8], { functions: [{ fn: { type: "poly", coeffs: [c, mq[0] / mq[1]] } }],
          points: [{ x: xa, y: at(xa), label: "A" }, { x: xb, y: at(xb), label: "B" }], alt: "A straight line through two marked points A and B" }),
        stem: "The graph shows a straight line passing through the points $\\mathrm{A}$ and $\\mathrm{B}$, which have integer coordinates.",
        parts: [
          P("Find the gradient of the line.", 2, ans.frac(mq[0], mq[1]), [
            `Read off $\\mathrm{A}${point(xa, at(xa))}$ and $\\mathrm{B}${point(xb, at(xb))}$.`,
            `$m = \\dfrac{${at(xb)} - ${paren(at(xa))}}{${xb} - ${paren(xa)}} = ${frac(mq[0], mq[1])}$`]),
          P("Write down the $y$-intercept of the line.", 1, ans.int(c), [`The line crosses the $y$-axis at $${point(0, c)}$, so the $y$-intercept is $${c}$.`])] };
    } });

  // ======================= 2.2 functions, domain, range =======================
  reg({ type: "fn-evaluate-function", syllabus: ["2.2"], unknown: "value-at-input", representation: "equation", format: "value", levels: [1],
    skills: ["SL2.2.evaluate-notation"], title: "Evaluate a function",
    build({ rng }) {
      const a = rng.pick([1, 2, 3, -1, -2]), b = rng.nonzero(-5, 5), c = rng.int(-6, 6), k = rng.nonzero(-4, 4);
      const v = a * k * k + b * k + c;
      return { params: { a, b, c, k }, stem: `The function $f$ is defined by $f(x) = ${poly([a, b, c])}$, for $x \\in \\mathbb{R}$.`,
        parts: [P(`Find $f(${k})$.`, 2, ans.int(v), [
          `$f(${k}) = ${coef(a, `${br(k)}^{2}`)} ${signed(b)}${br(k)} ${signed(c)}$`, `$f(${k}) = ${a * k * k} ${signed(b * k)} ${signed(c)} = ${v}$`])] };
    } });
  reg({ type: "fn-domain-range", syllabus: ["2.2", "2.5"], unknown: "range-restricted", representation: "equation", format: "value", levels: [2],
    skills: ["SL2.2.range", "SL2.5.inverse-domain-range", "SL2.5.find-inverse"], title: "Range of a linear function on an interval, and an inverse value",
    source: "domain-range-inverse-linear",
    build({ rng }) {
      const a = rng.pick([2, 3, -2, -4, 5, -3]), b = rng.pick([-5, -1, 3, 6, 2]), lo = rng.int(-3, 1), hi = lo + rng.int(4, 6);
      const y1 = a * lo + b, y2 = a * hi + b, rLo = Math.min(y1, y2), rHi = Math.max(y1, y2);
      const xk = rng.int(lo + 1, hi - 1), k = a * xk + b;
      return { params: { a, b, lo, hi, k },
        stem: `The function $f$ is defined by $f(x) = ${lin(a, b)}$, for $${lo} \\le x \\le ${hi}$. The range of $f$ is $p \\le f(x) \\le q$.`,
        parts: [
          P("Find the value of $p$.", 1, ans.int(rLo), [`$f$ is linear, so its extreme values are at the ends of the domain: $f(${lo}) = ${y1}$ and $f(${hi}) = ${y2}$.`, `The smaller is $p = ${rLo}$.`]),
          P("Find the value of $q$.", 1, ans.int(rHi), [`The larger end value is $q = ${rHi}$.`]),
          P(`Find $f^{-1}(${k})$.`, 2, ans.int(xk), [`Solve $f(x) = ${k}$: $${lin(a, b)} = ${k}$`, `$${coef(a, "x")} = ${k - b}$, so $x = ${xk}$ and $f^{-1}(${k}) = ${xk}$.`])] };
    } });
  reg({ type: "fn-domain-range", syllabus: ["2.2", "2.6"], unknown: "range-quadratic", representation: "equation", format: "value", levels: [3],
    skills: ["SL2.2.range", "SL2.2.domain", "SL2.5.inverse-domain-range"], title: "Range of a quadratic on an interval; restricting for an inverse",
    build({ rng }) {
      const a = rng.pick([1, 2]), h = rng.int(-2, 3), k = rng.int(-6, 4), dl = rng.int(1, 2), dr = rng.int(3, 4);
      const lo = h - dl, hi = h + dr, top = a * dr * dr + k;
      return { params: { a, h, k, lo, hi },
        stem: `The function $f$ is defined by $f(x) = ${coef(a, `${factor(h)}^{2}`)} ${signed(k)}$, for $${lo} \\le x \\le ${hi}$.`,
        parts: [
          P("Find the least value of $f(x)$.", 2, ans.int(k), [`The vertex is $${point(h, k)}$ and $x = ${h}$ lies in the domain.`, `The parabola opens upwards, so the least value is $${k}$.`]),
          P("Find the greatest value of $f(x)$.", 2, ans.int(top), [`The greatest value is at the end of the domain furthest from $x = ${h}$, which is $x = ${hi}$.`, `$f(${hi}) = ${coef(a, `${br(dr)}^{2}`)} ${signed(k)} = ${top}$`]),
          P(`The domain is now restricted to $c \\le x \\le ${hi}$ so that $f$ has an inverse. Find the least possible value of $c$.`, 1, ans.int(h), [`$f$ is one-to-one only on one side of the vertex, so the least value is $c = ${h}$.`])] };
    } });

  // ======================= 2.3 graphs of functions =======================
  reg({ type: "fn-ext-match-graph", syllabus: ["2.3", "2.6"], unknown: "graph-from-equation", representation: "graph", format: "graph-pick", levels: [2],
    skills: ["SL2.3.match-graph", "SL2.4.zeros-intercepts"], title: "Pick the graph of a factorised quadratic",
    build({ rng }) {
      let p, q, a;
      do { p = rng.int(-4, 2); q = p + rng.int(2, 5); a = rng.sign(); } while (p + q === 0 || q > 4 || p * q === 0 || Math.abs((a * (q - p) * (q - p)) / 4) > 8);
      const gr = (a2, p2, q2) => ({ graph: win([-6, 6], [-10, 10], { yStep: 2, functions: [{ fn: { type: "poly", coeffs: [a2 * p2 * q2, -a2 * (p2 + q2), a2] } }], alt: "A parabola" }), value: [a2, p2, q2] });
      const wrongs = G.pickDistinct(gr(a, p, q).graph, [
        Object.assign(gr(-a, p, q), { why: "This is the reflection in the $x$-axis: the sign of the leading coefficient is wrong." }),
        Object.assign(gr(a, -q, -p), { why: "The zeros have the wrong signs: $(x - r)$ gives a zero at $x = r$." }),
        Object.assign(gr(-a, -q, -p), { why: "Both the zeros and the direction of opening are wrong." }),
        gr(a, p + 1, q + 1), gr(a, p - 1, q - 1)], 3);
      const body = `${factor(p)}${factor(q)}`;
      return { params: { a, p, q }, stem: `Consider the function $f(x) = ${a < 0 ? "-" : ""}${body}$.`,
        parts: [
          P("Which graph shows $y = f(x)$?", 2, ans.graph(rng, gr(a, p, q), wrongs), [
            `The zeros are $x = ${p}$ and $x = ${q}$.`, `The coefficient of $x^{2}$ is ${a > 0 ? "positive, so the parabola opens upwards" : "negative, so the parabola opens downwards"}.`]),
          P("Write down the $y$-intercept of the graph of $f$.", 1, ans.int(a * p * q), [`$f(0) = ${a < 0 ? "-" : ""}${br(-p)}${br(-q)} = ${a * p * q}$`])] };
    } });
  reg({ type: "fn-graph-table-composite-inverse", syllabus: ["2.3", "2.2", "2.5"], unknown: "mixed-inverse-composite", representation: "graph", format: "value", levels: [3],
    skills: ["SL2.3.read-graph", "SL2.5.composite-value", "SL2.2.inverse-undo"], title: "Values, a composite and an inverse value read from a graph",
    build({ rng }) {
      const xs = [-3, -2, -1, 0, 1, 2, 3], steps = rng.shuffle([1, 1, 1, 2, 2, 2]), dir = rng.sign();
      let y = rng.pick([-5, -4]);
      const ys = [y];
      for (const s of steps) { y += s; ys.push(y); }
      const pts = xs.map((x, i) => [x, dir * ys[i]]);
      const f = (x) => pts[x + 3][1];
      const okA = xs.filter((x) => Math.abs(f(x)) <= 3 && f(x) !== x);
      const a = rng.pick(okA), c0 = rng.pick(xs.filter((x) => x !== a)), c = f(c0);
      return { params: { a, c },
        graph: win([-4, 4], [-6, 6], { functions: [{ fn: { type: "pwl", points: pts } }], points: pts.map(([x, yy]) => ({ x, y: yy })), alt: "The graph of f, made of straight segments between marked points" }),
        stem: "The graph of the function $f$ is shown for $-3 \\le x \\le 3$. It consists of straight line segments joining points with integer coordinates.",
        parts: [
          P(`Write down the value of $f(${a})$.`, 1, ans.int(f(a)), [`From the graph, when $x = ${a}$, $y = ${f(a)}$.`]),
          P(`Find $(f \\circ f)(${a})$.`, 2, ans.int(f(f(a))), [`$(f \\circ f)(${a}) = f(f(${a})) = f(${f(a)})$`, `From the graph, $f(${f(a)}) = ${f(f(a))}$.`]),
          P(`Find $f^{-1}(${c})$.`, 2, ans.int(c0), [`$f^{-1}(${c})$ is the value of $x$ for which $f(x) = ${c}$.`, `From the graph, $f(${c0}) = ${c}$, so $f^{-1}(${c}) = ${c0}$.`])] };
    } });

  // ======================= 2.4 key features of graphs =======================
  reg({ type: "fn-gdc-features", syllabus: ["2.4", "2.10"], unknown: "turning-point-coordinates", representation: "equation", format: "value", levels: [2], calculator: true,
    skills: ["SL2.4.max-min", "SL2.10.solve-gdc"], title: "Maximum point with technology",
    build({ rng }) {
      const A = rng.int(2, 9), k = rng.pick([1.5, 2.5, 3.5, 1.2, 1.8, 2.4, 3.2, 4.5]);
      const top = (A * k) / Math.E;
      return { params: { A, k },
        graph: { x: [0, Math.ceil(5 * k)], y: [0, Math.ceil(top + 1)], functions: [{ fn: { type: "product", of: [{ type: "poly", coeffs: [0, A] }, { type: "exp", b: Math.exp(-1 / k) }] } }], alt: "A curve that rises to a maximum and then decays towards the x-axis" },
        stem: `The function $f$ is defined by $f(x) = ${A}x\\,\\mathrm{e}^{-\\frac{x}{${num(k)}}}$, for $x \\ge 0$. The graph of $f$ has a maximum point at $\\mathrm{M}$.`,
        parts: [
          P("Find the $x$-coordinate of $\\mathrm{M}$.", 1, ans.sf(k), ["Graph $f$ on a calculator and use its maximum tool.", `$x = ${sf(k)}$`]),
          P("Find the $y$-coordinate of $\\mathrm{M}$.", 2, ans.sf(top), [`The maximum tool gives $y = ${num(Number(top.toPrecision(5)))}\\ldots$`, `$y = ${sf(top)}$ (to three significant figures)`])] };
    } });
  reg({ type: "fn-gdc-intersection", syllabus: ["2.4", "2.10"], unknown: "intersection-points", representation: "equation", format: "value", levels: [4], calculator: true,
    skills: ["SL2.4.intersection", "SL2.10.solve-gdc", "SL2.4.max-min"], title: "Intersections of a log curve and a line with technology",
    build({ rng }) {
      const a = rng.int(2, 5), c = rng.pick([1.5, 2, 2.5, 3, 3.5]);
      const d = (x) => a * Math.log(x) - x + c;
      const newton = (x) => { for (let i = 0; i < 80; i++) x = Math.max(x - d(x) / (a / x - 1), 1e-9); return x; };
      const r1 = newton(Math.exp(-c / a) / 2), r2 = newton(6 * a + 4 * c), gap = a * Math.log(a) - a + c;
      return { params: { a, c },
        graph: { x: [0, Math.ceil(r2 + 2)], y: [-Math.ceil(c + 2), Math.ceil(r2 - c + 2)], functions: [{ fn: { type: "log", a }, label: "f" }, { fn: { type: "poly", coeffs: [-c, 1] }, label: "g" }], alt: "A logarithmic curve f and a straight line g that cross twice" },
        stem: `Let $f(x) = ${a}\\ln x$ and $g(x) = ${lin(1, -c)}$, for $x > 0$. The graphs of $f$ and $g$ intersect at two points, $\\mathrm{A}$ and $\\mathrm{B}$, where $\\mathrm{A}$ is to the left of $\\mathrm{B}$.`,
        parts: [
          P("Find the $x$-coordinate of $\\mathrm{A}$.", 2, ans.sf(r1), ["Graph both functions on a calculator and use its intersection tool.", `$x = ${sf(r1)}$`]),
          P("Find the $x$-coordinate of $\\mathrm{B}$.", 1, ans.sf(r2), [`The second intersection is at $x = ${sf(r2)}$.`]),
          P("Between $\\mathrm{A}$ and $\\mathrm{B}$ the graph of $f$ is above the graph of $g$. Find the greatest vertical distance between the two graphs.", 3, ans.sf(gap), [
            `The vertical distance is $d(x) = f(x) - g(x) = ${a}\\ln x - x ${signed(c)}$.`, "Graph $d$ and use the maximum tool.", `The maximum is at $x = ${a}$, where $d = ${sf(gap)}$.`])] };
    } });

  // ======================= 2.5 composite and inverse functions =======================
  const COMP = { type: "fn-composite", syllabus: ["2.5"] };
  const compSit = (rng) => ({ a: rng.int(2, 5), b: rng.nonzero(-4, 4), c: rng.int(1, 5), k: rng.nonzero(-3, 3) });
  const compStem = (s) => `Let $f(x) = ${lin(s.a, s.b)}$ and $g(x) = ${poly([1, 0, s.c])}$, for $x \\in \\mathbb{R}$.`;
  reg({ ...COMP, unknown: "value-inside-out", representation: "equation", format: "value", levels: [1],
    skills: ["SL2.5.composite-value"], title: "Value of a composite", situationKey: "linear-quadratic", situation: compSit,
    build({ sit: s }) {
      const inner = s.k * s.k + s.c, v = s.a * inner + s.b;
      return { stem: compStem(s), parts: [P(`Find $(f \\circ g)(${s.k})$.`, 2, ans.int(v), [
        `Work from the inside out: $g(${s.k}) = ${paren(s.k)}^{2} + ${s.c} = ${inner}$`, `$(f \\circ g)(${s.k}) = f(${inner}) = ${s.a}(${inner}) ${signed(s.b)} = ${v}$`])] };
    } });
  reg({ ...COMP, unknown: "expression", representation: "equation", format: "mcq", levels: [2],
    skills: ["SL2.5.composite-expression", "SL2.5.composite-value"], title: "Expression for a composite", situationKey: "linear-quadratic", situation: compSit,
    build({ rng, sit: s }) {
      const opt = (cs, why) => ({ text: m(poly(cs)), value: cs, why });
      const inner = s.a * s.k + s.b, v = inner * inner + s.c;
      return { stem: compStem(s), parts: [
        P("Which expression is equal to $(f \\circ g)(x)$?", 2, ans.choice(rng, opt([s.a, 0, s.a * s.c + s.b]), [
          opt([s.a, 0, s.c + s.b], "Every term of $g(x)$ must be multiplied by the coefficient in $f$."),
          opt([s.a * s.a, 2 * s.a * s.b, s.b * s.b + s.c], "This is $(g \\circ f)(x)$: the order is the wrong way round."),
          opt([s.a, 0, s.a * s.c], "The constant term of $f$ has been left out."),
          opt([s.a, s.b, s.c], "This is not a composite: $g(x)$ must replace $x$ in $f$.")]), [
          `$(f \\circ g)(x) = f(g(x)) = ${s.a}\\left(${poly([1, 0, s.c])}\\right) ${signed(s.b)}$`, `$(f \\circ g)(x) = ${poly([s.a, 0, s.a * s.c + s.b])}$`]),
        P(`Find $(g \\circ f)(${s.k})$.`, 2, ans.int(v), [`$f(${s.k}) = ${s.a}${br(s.k)} ${signed(s.b)} = ${inner}$`, `$(g \\circ f)(${s.k}) = g(${inner}) = ${paren(inner)}^{2} + ${s.c} = ${v}$`])] };
    } });
  reg({ ...COMP, unknown: "compare-orders", representation: "equation", format: "value", levels: [3],
    skills: ["SL2.5.composite-expression", "SL2.5.find-inverse"], title: "Both composites and an inverse value", source: "composite-fn/A",
    build({ rng }) {
      const a = rng.int(2, 5), b = rng.nonzero(-3, 3), c = rng.int(1, 5), n = rng.int(-4, 5), mm = a * n + b;
      return { params: { a, b, c, mm }, stem: `Let $f(x) = ${lin(a, b)}$ and $g(x) = ${poly([1, 0, c])}$, for $x \\in \\mathbb{R}$.`, parts: [
        P("The composite $(f \\circ g)(x)$ can be written as $px^{2} + q$. Find the value of $q$.", 2, ans.int(a * c + b), [
          `$(f \\circ g)(x) = ${a}\\left(${poly([1, 0, c])}\\right) ${signed(b)} = ${poly([a, 0, a * c + b])}$`, `$q = ${a * c + b}$`]),
        P("The composite $(g \\circ f)(x)$ can be written as $rx^{2} + sx + t$. Find the value of $s$.", 2, ans.int(2 * a * b), [
          `$(g \\circ f)(x) = \\left(${lin(a, b)}\\right)^{2} + ${c} = ${poly([a * a, 2 * a * b, b * b + c])}$`, `$s = ${2 * a * b}$`]),
        P(`Find $f^{-1}(${mm})$.`, 2, ans.int(n), [`Solve $${lin(a, b)} = ${mm}$: $${a}x = ${mm - b}$`, `$x = ${n}$, so $f^{-1}(${mm}) = ${n}$.`])] };
    } });
  reg({ ...COMP, unknown: "self-composite", representation: "equation", format: "value", levels: [2],
    skills: ["SL2.5.composite-expression", "SL2.5.find-inverse"], title: "A function composed with itself, and an inverse value", source: "composite-fn/B",
    build({ rng }) {
      const p = rng.pick([2, 3, 4]), a = rng.pick([1, 3, 5, 7]), k = rng.pick([5, 7, 9, 11, 13]);
      const inv = rat.Q(k + a, p);
      return { params: { p, a, k }, stem: `Let $f(x) = ${lin(p, -a)}$, for $x \\in \\mathbb{R}$.`, parts: [
        P("The composite $(f \\circ f)(x)$ can be written as $mx + n$. Find the value of $n$.", 2, ans.int(-a * (p + 1)), [
          `$(f \\circ f)(x) = ${p}\\left(${lin(p, -a)}\\right) - ${a} = ${lin(p * p, -a * p)} - ${a}$`, `$(f \\circ f)(x) = ${lin(p * p, -a * (p + 1))}$, so $n = ${-a * (p + 1)}$.`]),
        P(`Find $f^{-1}(${k})$.`, 2, ans.frac(inv.n, inv.d), [`Solve $${lin(p, -a)} = ${k}$: $${p}x = ${k + a}$`, `$f^{-1}(${k}) = ${rat.tex(inv)}$`])] };
    } });
  reg({ ...COMP, unknown: "solve-composite", representation: "equation", format: "value", levels: [3],
    skills: ["SL2.5.composite-expression", "SL2.2.domain"], title: "Solve an equation with a composite on a restricted domain", source: "function-composition-context-b",
    build({ rng }) {
      const a = rng.int(2, 4), b = rng.pick([-5, -3, 1, 2]), c = rng.pick([1, 2, 4]), r = rng.int(2, 5), q = a * c + b, target = a * r * r + q;
      return { params: { a, b, c, target }, stem: `Let $f(x) = ${lin(a, b)}$, for $x \\in \\mathbb{R}$, and $g(x) = ${poly([1, 0, c])}$, for $x \\ge 0$.`, parts: [
        P(`The composite $(f \\circ g)(x)$ can be written as $${a}x^{2} + q$. Find the value of $q$.`, 2, ans.int(q), [
          `$(f \\circ g)(x) = ${a}\\left(${poly([1, 0, c])}\\right) ${signed(b)} = ${poly([a, 0, q])}$`, `$q = ${q}$`]),
        P(`Solve $(f \\circ g)(x) = ${target}$.`, 3, ans.int(r), [`$${poly([a, 0, q])} = ${target}$`, `$${a}x^{2} = ${target - q}$, so $x^{2} = ${r * r}$ and $x = \\pm ${r}$.`,
          `The domain of $g$ is $x \\ge 0$, so $x = -${r}$ is rejected and $x = ${r}$.`])] };
    } });

  // ======================= 2.6 the quadratic function =======================
  const QF = { type: "fn-quadratic-features", syllabus: ["2.6", "2.4"] };
  const quadSit = (rng) => {
    const a = rng.pick([1, -1, 2, -2]);
    let p, q;
    do { p = rng.int(-5, 3); q = p + 2 * rng.int(1, 3); } while (p * q === 0);
    const h = (p + q) / 2;
    return { a, p, q, h, k: (-a * (q - p) * (q - p)) / 4, b: -a * (p + q), c: a * p * q };
  };
  const vertexForm = (s) => `${coef(s.a, `${factor(s.h)}^{2}`)} ${signed(s.k)}`;
  const vertexWork = (s) => `The parabola opens ${s.a > 0 ? "upwards" : "downwards"}, so the vertex is a ${s.a > 0 ? "minimum" : "maximum"}.`;
  reg({ ...QF, unknown: "vertex-from-vertex-form", representation: "equation", format: "value", levels: [1],
    skills: ["SL2.6.vertex", "SL2.6.axis-symmetry"], title: "Vertex read from vertex form", situationKey: "quadratic", situation: quadSit,
    build({ sit: s }) {
      return { stem: `The graph of $f(x) = ${vertexForm(s)}$ is a parabola.`, parts: [
        P("The axis of symmetry is $x = h$. Write down the value of $h$.", 1, ans.int(s.h), [`In the form $a(x - h)^{2} + k$ the axis of symmetry is $x = h$, so $h = ${s.h}$.`]),
        P("Write down the $y$-coordinate of the vertex.", 1, ans.int(s.k), [`The vertex is $${point(s.h, s.k)}$, so its $y$-coordinate is $${s.k}$.`])] };
    } });
  reg({ ...QF, unknown: "vertex-from-factorised", representation: "equation", format: "value", levels: [2],
    skills: ["SL2.6.axis-symmetry", "SL2.6.vertex", "SL2.6.factorised-form"], title: "Axis and vertex from factorised form", situationKey: "quadratic", situation: quadSit,
    build({ sit: s }) {
      return { stem: `The graph of $f(x) = ${coef(s.a, factor(s.p) + factor(s.q))}$ is a parabola.`, parts: [
        P("The axis of symmetry is $x = h$. Find the value of $h$.", 2, ans.int(s.h), [`The zeros are $x = ${s.p}$ and $x = ${s.q}$.`, `The axis is midway between them: $h = \\dfrac{${s.p} + ${paren(s.q)}}{2} = ${s.h}$`]),
        P("Find the $y$-coordinate of the vertex.", 2, ans.int(s.k), [`$f(${s.h}) = ${coef(s.a, `${br(s.h - s.p)}${br(s.h - s.q)}`)} = ${s.k}$`, vertexWork(s)])] };
    } });
  reg({ ...QF, unknown: "vertex-from-general", representation: "equation", format: "value", levels: [2],
    skills: ["SL2.6.axis-symmetry", "SL2.6.vertex"], title: "Axis and vertex from general form", situationKey: "quadratic", situation: quadSit,
    build({ sit: s }) {
      return { stem: `The graph of $f(x) = ${poly([s.a, s.b, s.c])}$ is a parabola.`, parts: [
        P("The axis of symmetry is $x = h$. Find the value of $h$.", 2, ans.int(s.h), [`$h = -\\dfrac{b}{2a} = -\\dfrac{${s.b}}{2${br(s.a)}} = ${s.h}$`]),
        P("Find the $y$-coordinate of the vertex.", 2, ans.int(s.k), [`$f(${s.h}) = ${expr([[s.a, `(${s.h})^{2}`], [s.b, `(${s.h})`], [s.c, ""]])} = ${s.k}$`, vertexWork(s)])] };
    } });
  reg({ ...QF, unknown: "factorised-from-vertex-form", representation: "equation", format: "value", levels: [3],
    skills: ["SL2.6.vertex", "SL2.6.axis-symmetry", "SL2.7.solve-equation"], title: "Vertex and intercepts from vertex form", source: "quadratic-fn/A",
    build({ rng }) {
      const a = rng.pick([1, 2, -1, -2]), h = rng.nonzero(-4, 4), inner = rng.pick([1, 2, 3, 4, 5, 6, 7, 8, 9]), k = -a * inner;
      const sp = fmt.sqrtParts(inner), root = h + Math.sqrt(inner);
      const rootTex = sp.in === 1 ? num(h + sp.out) : `${h} + ${surd(inner)}`;
      return { params: { a, h, k }, stem: `The function $f$ is defined by $f(x) = ${coef(a, `${factor(h)}^{2}`)} ${signed(k)}$, for $x \\in \\mathbb{R}$.`, parts: [
        P("Write down the $x$-coordinate of the vertex of the graph of $f$.", 1, ans.int(h), [`In the form $a(x - h)^{2} + k$ the vertex is $(h,\\, k) = ${point(h, k)}$.`]),
        P("Write down the $y$-coordinate of the vertex.", 1, ans.int(k), [`The $y$-coordinate is $k = ${k}$.`]),
        P("Find the larger $x$-intercept of the graph of $f$, giving an exact answer.", 3, sp.in === 1 ? ans.int(h + sp.out) : ans.exact(root, rootTex), [
          `Set $f(x) = 0$: $${coef(a, `${factor(h)}^{2}`)} = ${-k}$`, `$${factor(h)}^{2} = ${inner}$, so $x = ${h} \\pm ${surd(inner)}$`, `The larger intercept is $x = ${rootTex}$.`])] };
    } });
  reg({ type: "fn-quadratic-from-conditions", syllabus: ["2.6", "2.3"], unknown: "a-from-roots-and-point", representation: "graph", format: "value", levels: [2],
    skills: ["SL2.6.find-equation", "SL2.6.factorised-form", "SL2.3.read-graph"], title: "Equation of a parabola from its graph",
    build({ rng }) {
      let a, p, q;
      do { a = rng.pick([1, -1, 2, -2]); p = rng.int(-4, 1); q = p + rng.pick([2, 4]); } while (p * q === 0 || Math.abs(a * p * q) > 9 || Math.abs((a * (q - p) * (q - p)) / 4) > 9);
      const yi = a * p * q;
      return { params: { p, q },
        graph: win([-6, 6], [-10, 10], { yStep: 2, functions: [{ fn: { type: "poly", coeffs: [yi, -a * (p + q), a] } }], points: [{ x: p, y: 0 }, { x: q, y: 0 }, { x: 0, y: yi }], alt: "A parabola with its two x-intercepts and its y-intercept marked" }),
        stem: "The graph of a quadratic function $f$ is shown. The marked points, where the graph meets the axes, have integer coordinates. The function can be written as $f(x) = a(x - p)(x - q)$.",
        parts: [
          P("The axis of symmetry is $x = h$. Find the value of $h$.", 1, ans.int((p + q) / 2), [`The $x$-intercepts are $${p}$ and $${q}$, and the axis is midway between them: $h = ${(p + q) / 2}$.`]),
          P("Find the value of $a$.", 3, ans.int(a), [`$f(x) = a${factor(p)}${factor(q)}$`, `The graph passes through $${point(0, yi)}$: $${yi} = a${br(-p)}${br(-q)} = ${coef(p * q, "a")}$`, `$a = ${a}$`])] };
    } });
  const QM = { type: "fn-ext-quadratic-model", syllabus: ["2.6"], skills: ["SL2.6.model", "SL2.6.vertex"] };
  reg({ ...QM, unknown: "max-value", representation: "equation", format: "value", levels: [2], title: "Maximum of a quadratic model in vertex form", source: "quadratic-fn/context maximum",
    build({ rng }) {
      const a = rng.pick([1, 2]), h = rng.int(2, 5), k = a * h * h + rng.pick([4, 6, 10, 15, 20]);
      return { params: { a, h, k }, stem: `The height of a model rocket above the ground, in metres, is modelled by $H(t) = ${coef(-a, `${factor(h, "t")}^{2}`)} + ${k}$, where $t$ is the time in seconds after launch.`, parts: [
        P("Write down the maximum height of the rocket, in metres.", 1, ans.int(k), [`The vertex of the parabola is $${point(h, k)}$, so the maximum height is $${unit(k, "m")}$.`]),
        P("Write down the time, in seconds, at which the rocket is highest.", 1, ans.int(h), [`The maximum occurs at $t = ${h}$.`]),
        P("Find the height from which the rocket is launched, in metres.", 2, ans.int(k - a * h * h), [`$H(0) = ${coef(-a, `${br(-h)}^{2}`)} + ${k} = ${-a * h * h} + ${k}$`, `$H(0) = ${k - a * h * h}$`])] };
    } });
  reg({ ...QM, unknown: "zero-time", representation: "equation", format: "value", levels: [3], title: "Quadratic projectile model: start, maximum and landing", source: "quadratic-model-section-b",
    build({ rng }) {
      const T = rng.pick([5, 6, 7, 8, 9, 10]), p = rng.int(1, 3), b = T - p, c = T * p, tM = rat.Q(b, 2), hM = rat.Q(b * b + 4 * c, 4);
      return { params: { b, c }, stem: `The height of a ball above the ground, in metres, is modelled by $h(t) = ${poly([-1, b, c], "t")}$, where $t$ is the time in seconds after it is thrown, until it lands.`, parts: [
        P("Write down the height from which the ball is thrown, in metres.", 1, ans.int(c), [`$h(0) = ${c}$`]),
        P("Find the time, in seconds, at which the ball reaches its maximum height.", 2, ans.frac(tM.n, tM.d), [`The axis of symmetry is $t = -\\dfrac{b}{2a} = -\\dfrac{${b}}{2(-1)} = ${rat.tex(tM)}$`]),
        P("Find the maximum height of the ball, in metres.", 2, ans.frac(hM.n, hM.d), [`$h\\left(${rat.tex(tM)}\\right) = -\\left(${rat.tex(tM)}\\right)^{2} + ${b}\\left(${rat.tex(tM)}\\right) + ${c} = ${rat.tex(hM)}$`]),
        P("Find the time, in seconds, at which the ball lands.", 2, ans.int(T), [`Solve $${poly([-1, b, c], "t")} = 0$, which factorises as $-${factor(T, "t")}${factor(-p, "t")} = 0$.`, `$t = ${T}$ or $t = ${-p}$. Time is not negative, so $t = ${T}$.`])] };
    } });

  // ======================= 2.7 quadratic equations and inequalities =======================
  const SQ = { type: "fn-solve-quadratic", syllabus: ["2.7"] };
  reg({ ...SQ, unknown: "solve-factorisable", representation: "equation", format: "value", levels: [1, 2],
    skills: ["SL2.7.solve-equation"], title: "Solve a quadratic by factorising",
    build({ rng, level }) {
      if (level === 1) {
        let r1, r2;
        do { r1 = rng.int(-7, 4); r2 = r1 + rng.int(1, 8); } while (r1 * r2 === 0);
        return { params: { coeffs: [1, -(r1 + r2), r1 * r2] }, stem: `Consider the equation $${poly([1, -(r1 + r2), r1 * r2])} = 0$.`, parts: [
          P("Write down the smaller solution.", 1, ans.int(r1), [`$${factor(r1)}${factor(r2)} = 0$`, `$x = ${r1}$ or $x = ${r2}$; the smaller is $${r1}$.`]),
          P("Write down the larger solution.", 1, ans.int(r2), [`The larger solution is $x = ${r2}$.`])] };
      }
      let mm, n, r;
      do { mm = rng.pick([2, 3, 4, 5]); n = rng.nonzero(-7, 7); r = rng.nonzero(-5, 5); } while (fmt.gcd(mm, n) !== 1 || n === mm * r);
      const cs = [mm, -(mm * r + n), n * r], q1 = rat.Q(n, mm), lo = n / mm < r ? q1 : rat.Q(r), hi = n / mm < r ? rat.Q(r) : q1;
      return { params: { coeffs: cs }, stem: `Consider the equation $${poly(cs)} = 0$.`, parts: [
        P("Find the smaller solution.", 2, ans.frac(lo.n, lo.d), [`$${poly(cs)} = \\left(${lin(mm, -n)}\\right)${factor(r)}$`, `$x = ${rat.tex(q1)}$ or $x = ${r}$; the smaller is $${rat.tex(lo)}$.`]),
        P("Find the larger solution.", 2, ans.frac(hi.n, hi.d), [`The larger solution is $x = ${rat.tex(hi)}$.`])] };
    } });
  reg({ ...SQ, syllabus: ["2.7", "1.5"], unknown: "solve-hidden-exponential", representation: "equation", format: "value", levels: [3],
    skills: ["SL2.7.hidden-quadratic", "SL2.7.solve-equation"], title: "A quadratic in disguise (exponential)",
    build({ rng }) {
      let base, e, n;
      do { base = rng.pick([2, 3]); e = rng.int(2, base === 2 ? 5 : 3); n = rng.int(1, 6); } while (n === Math.pow(base, e));
      const u = Math.pow(base, e), B = n - u, C = -n * u;
      return { params: { base, B, C }, stem: `Consider the equation $${expr([[1, `${base}^{2x}`], [B, `\\left(${base}^{x}\\right)`], [C, ""]])} = 0$.`, parts: [
        P(`Let $u = ${base}^{x}$. The equation becomes a quadratic in $u$. Find the positive solution for $u$.`, 3, ans.int(u), [
          `$${base}^{2x} = \\left(${base}^{x}\\right)^{2} = u^{2}$, so $${poly([1, B, C], "u")} = 0$`, `$${factor(u, "u")}${factor(-n, "u")} = 0$`, `$u = ${u}$ or $u = ${-n}$; the positive solution is $u = ${u}$.`]),
        P("Hence solve the equation for $x$.", 2, ans.int(e), [`$${base}^{x} = ${-n}$ has no solution, because $${base}^{x} > 0$.`, `$${base}^{x} = ${u} = ${base}^{${e}}$, so $x = ${e}$.`])] };
    } });
  const DISC = { type: "fn-discriminant", syllabus: ["2.7"] };
  reg({ ...DISC, unknown: "nature-from-equation", representation: "equation", format: "mcq", levels: [2],
    skills: ["SL2.7.discriminant"], title: "Discriminant and the nature of the roots", source: "quadratic-fn/B",
    build({ rng }) {
      const a = rng.int(1, 3), b = 2 * rng.int(-4, 4), c = rng.nonzero(-5, 6), disc = b * b - 4 * a * c;
      const names = ["two distinct real roots", "two equal real roots", "no real roots"], right = disc > 0 ? 0 : disc === 0 ? 1 : 2;
      return { params: { a, b, c }, stem: `Consider the equation $${poly([a, b, c])} = 0$.`, parts: [
        P("Find the value of the discriminant.", 2, ans.int(disc), [`$\\Delta = b^{2} - 4ac = ${paren(b)}^{2} - 4${br(a)}${br(c)}$`, `$\\Delta = ${b * b} - ${paren(4 * a * c)} = ${disc}$`]),
        P("Hence state the nature of the roots of the equation.", 1, ans.choice(rng, { text: names[right], value: right }, names.map((t, i) => ({ text: t, value: i })).filter((o) => o.value !== right)
          .map((o) => Object.assign(o, { why: "Compare the discriminant with zero: positive gives two distinct real roots, zero gives equal roots, negative gives none." }))), [
          `$\\Delta ${disc > 0 ? ">" : disc === 0 ? "=" : "<"} 0$, so the equation has ${names[right]}.`])] };
    } });
  reg({ ...DISC, unknown: "k-interval", representation: "equation", format: "value", levels: [3],
    skills: ["SL2.7.discriminant-parameter", "SL2.7.solve-equation"], title: "Largest integer constant for two distinct roots", source: "quadratic-fn/discriminant parameter",
    build({ rng }) {
      const b = 2 * rng.int(2, 8), c = (b * b) / 4 - 1;
      return { params: { b }, stem: `The equation $x^{2} - ${b}x + c = 0$, where $c$ is an integer, has two distinct real roots.`, parts: [
        P("Find the greatest possible value of $c$.", 3, ans.int(c), [`Two distinct real roots need $\\Delta > 0$: $${br(-b)}^{2} - 4c > 0$`, `$${b * b} - 4c > 0$, so $c < ${(b * b) / 4}$`, `The greatest integer is $c = ${c}$.`]),
        P("For this value of $c$, find the smaller root of the equation.", 1, ans.int(b / 2 - 1), [`$${poly([1, -b, c])} = ${factor(b / 2 - 1)}${factor(b / 2 + 1)} = 0$`, `The smaller root is $x = ${b / 2 - 1}$.`]),
        P("Write down the larger root.", 1, ans.int(b / 2 + 1), [`The larger root is $x = ${b / 2 + 1}$.`])] };
    } });
  reg({ ...DISC, unknown: "k-for-equal-roots", representation: "equation", format: "value", levels: [3],
    skills: ["SL2.7.discriminant-parameter"], title: "Values of a constant for equal roots",
    build({ rng }) {
      const s = rng.int(2, 6), c = s * s - 1, k1 = 2 - 2 * s, k2 = 2 + 2 * s;
      return { params: { c }, stem: `The equation $x^{2} + kx + k + ${c} = 0$ has two equal real roots.`, parts: [
        P("Find the smaller possible value of $k$.", 3, ans.int(k1), [`Equal roots need $\\Delta = 0$: $k^{2} - 4(k + ${c}) = 0$`, `$${poly([1, -4, -4 * c], "k")} = 0$, so $${factor(k1, "k")}${factor(k2, "k")} = 0$`, `$k = ${k1}$ or $k = ${k2}$; the smaller is $${k1}$.`]),
        P("Find the larger possible value of $k$.", 2, ans.int(k2), [`From the factorised equation, the larger value is $k = ${k2}$.`])] };
    } });
  reg({ type: "fn-quadratic-inequality", syllabus: ["2.7"], unknown: "solve-against-zero", representation: "equation", format: "mcq", levels: [3],
    skills: ["SL2.7.inequality", "SL2.7.discriminant"], title: "Discriminant, then a quadratic inequality", source: "quadratic-inequality-discriminant",
    build({ rng }) {
      let r1, r2;
      do { r1 = rng.int(-6, 2); r2 = r1 + rng.int(3, 7); } while (r1 + r2 === 0 || r1 * r2 === 0);
      const b = -(r1 + r2), c = r1 * r2, disc = b * b - 4 * c, less = rng.bool();
      const inside = (lo, hi) => `$${lo} < x < ${hi}$`, outside = (lo, hi) => `$x < ${lo}$ or $x > ${hi}$`;
      const right = less ? inside(r1, r2) : outside(r1, r2);
      return { params: { b, c, less }, stem: `Consider the function $f(x) = ${poly([1, b, c])}$.`, parts: [
        P("Find the discriminant of $f$.", 2, ans.int(disc), [`$\\Delta = ${paren(b)}^{2} - 4(1)${br(c)} = ${b * b} - ${paren(4 * c)} = ${disc}$`]),
        P(`Solve $f(x) ${less ? "<" : ">"} 0$.`, 3, ans.choice(rng, { text: right, value: [less ? "in" : "out", r1, r2] }, [
          { text: less ? outside(r1, r2) : inside(r1, r2), value: [less ? "out" : "in", r1, r2], why: "The parabola opens upwards, so it is below the axis between the roots and above it outside them." },
          { text: less ? inside(-r2, -r1) : outside(-r2, -r1), value: [less ? "in" : "out", -r2, -r1], why: "The roots have the wrong signs." },
          { text: less ? outside(-r2, -r1) : inside(-r2, -r1), value: [less ? "out" : "in", -r2, -r1], why: "The roots have the wrong signs and the region is the wrong one." }]), [
          `$f(x) = ${factor(r1)}${factor(r2)}$, so the roots are $x = ${r1}$ and $x = ${r2}$.`,
          `The coefficient of $x^{2}$ is positive, so the graph is below the $x$-axis between the roots and above it outside them.`, `The solution is ${right}.`])] };
    } });

  // ======================= 2.8 rational functions =======================
  const RAT = { type: "fn-rational-asymptotes-intercepts", syllabus: ["2.8", "2.4"] };
  reg({ ...RAT, unknown: "x-intercept", representation: "equation", format: "value", levels: [2],
    skills: ["SL2.8.asymptotes", "SL2.4.asymptotes", "SL2.4.zeros-intercepts"], title: "Asymptotes and intercepts of a rational function",
    build({ rng }) {
      let a, b, c, d;
      do { a = rng.nonzero(-4, 4); b = rng.nonzero(-6, 6); c = rng.pick([1, 1, 2, 3]); d = rng.nonzero(-5, 5); } while (a * d === b * c || fmt.gcd(c, d) !== 1);
      const tex = `\\dfrac{${lin(a, b)}}{${lin(c, d)}}`;
      return { params: { a, b, c, d }, stem: `The function $f$ is defined by $f(x) = ${tex}$, for $x \\ne ${frac(-d, c)}$.`, parts: [
        P("The graph of $f$ has a vertical asymptote $x = p$. Write down the value of $p$.", 1, ans.frac(-d, c), [`The denominator is zero when $${lin(c, d)} = 0$, so $p = ${frac(-d, c)}$.`]),
        P("The graph of $f$ has a horizontal asymptote $y = q$. Write down the value of $q$.", 1, ans.frac(a, c), [`As $x$ becomes very large, $f(x)$ approaches the ratio of the coefficients of $x$: $q = ${frac(a, c)}$.`]),
        P("Find the $x$-intercept of the graph of $f$.", 1, ans.frac(-b, a), [`$f(x) = 0$ when the numerator is zero: $${lin(a, b)} = 0$, so $x = ${frac(-b, a)}$.`]),
        P("Find the $y$-intercept of the graph of $f$.", 1, ans.frac(b, d), [`Substitute $x = 0$: $f(0) = ${frac(b, d)}$`])] };
    } });
  reg({ ...RAT, unknown: "ha-from-equation", representation: "equation", format: "value", levels: [3],
    skills: ["SL2.8.asymptotes", "SL2.8.transformed-reciprocal", "SL2.10.solve-analytic"], title: "Asymptotes of a shifted reciprocal, then an equation", source: "rational-asymptotes",
    build({ rng }) {
      const a = rng.pick([2, 3, 4, 6, 5]), h = rng.nonzero(-4, 4), k = rng.nonzero(-3, 3), dy = rng.pick([1, 2, -1, -2, 3, 4]), y = k + dy, x = rat.add(h, rat.Q(a, dy));
      const tex = `\\dfrac{${a}}{${lin(1, -h)}} ${signed(k)}`;
      return { params: { a, h, k, y }, stem: `The function $f$ is defined by $f(x) = ${tex}$, for $x \\ne ${h}$.`, parts: [
        P("The graph of $f$ has a vertical asymptote $x = p$. Write down the value of $p$.", 1, ans.int(h), [`The denominator is zero when $x = ${h}$, so $p = ${h}$.`]),
        P("The graph of $f$ has a horizontal asymptote $y = q$. Write down the value of $q$.", 1, ans.int(k), [`As $x$ becomes very large, $\\dfrac{${a}}{${lin(1, -h)}}$ approaches $0$, so $q = ${k}$.`]),
        P(`Solve $f(x) = ${y}$.`, 3, ans.frac(x.n, x.d), [`$\\dfrac{${a}}{${lin(1, -h)}} = ${y} - ${paren(k)} = ${dy}$`, `$${lin(1, -h)} = ${frac(a, dy)}$`, `$x = ${rat.tex(x)}$`])] };
    } });
  reg({ type: "fn-rational-sketch", syllabus: ["2.8", "2.3"], unknown: "sketch-from-equation", representation: "graph", format: "graph-pick", levels: [2],
    skills: ["SL2.8.sketch-rational", "SL2.8.asymptotes"], title: "Pick the graph of a shifted reciprocal",
    build({ rng }) {
      let a, h, k;
      do { a = rng.pick([1, 2, 3, -1, -2, -3]); h = rng.nonzero(-3, 3); k = rng.nonzero(-3, 3); } while (h === k);
      const gr = (a2, h2, k2) => ({ value: [a2, h2, k2], graph: win([-6, 6], [-6, 6], { functions: [{ fn: { type: "rational", num: [a2 - k2 * h2, k2], den: [-h2, 1] } }], asymptotes: [{ x: h2 }, { y: k2 }], alt: "A hyperbola with a vertical and a horizontal asymptote" }) });
      const wrongs = G.pickDistinct(gr(a, h, k).graph, [
        Object.assign(gr(a, -h, k), { why: "The vertical asymptote is on the wrong side: $x - h$ in the denominator gives the asymptote $x = h$." }),
        Object.assign(gr(a, h, -k), { why: "The horizontal asymptote has the wrong sign." }),
        Object.assign(gr(-a, h, k), { why: "The branches are in the wrong corners: check the sign of the numerator." }),
        Object.assign(gr(a, k, h), { why: "The two asymptotes have been swapped." }), gr(-a, -h, k)], 3);
      const y0 = rat.sub(k, rat.Q(a, h));
      return { params: { a, h, k }, stem: `Consider the function $f(x) = ${a < 0 ? "-" : ""}\\dfrac{${Math.abs(a)}}{${lin(1, -h)}} ${signed(k)}$, for $x \\ne ${h}$.`, parts: [
        P("Which graph shows $y = f(x)$?", 2, ans.graph(rng, gr(a, h, k), wrongs), [
          `The vertical asymptote is $x = ${h}$ and the horizontal asymptote is $y = ${k}$.`,
          `The numerator is ${a > 0 ? "positive, so the branches lie to the upper right and lower left of the asymptotes" : "negative, so the branches lie to the upper left and lower right of the asymptotes"}.`]),
        P("Find the $y$-intercept of the graph of $f$.", 1, ans.frac(y0.n, y0.d), [`$f(0) = ${frac(a, -h)} ${signed(k)}${rat.tex(y0) === `${frac(a, -h)} ${signed(k)}` ? "" : ` = ${rat.tex(y0)}`}$`])] };
    } });

  // ======================= 2.9 exponential and logarithmic functions =======================
  const EXPM = { type: "fn-exponential-model", syllabus: ["2.9"], calculator: true };
  const expSit = (rng) => {
    const grow = rng.bool(), r = grow ? rng.pick([3, 4, 6, 7, 8, 12]) : rng.pick([6, 8, 11, 12, 14, 15]);
    return { grow, r, A: rng.pick([240, 350, 520, 780, 1250, 2600]), T: rng.int(3, 9), factor: grow ? rng.pick([2, 3, 1.5]) : rng.pick([0.5, 0.25, 0.4]),
      thing: rng.pick(grow ? ["the number of bacteria in a culture", "the number of users of an app", "the population of a colony of insects"] : ["the mass of a substance, in grams,", "the number of fish in a lake", "the value of a machine, in euros,"]) };
  };
  const expB = (s) => (s.grow ? 1 + s.r / 100 : 1 - s.r / 100);
  const expStem = (s) => `After $t$ years, ${s.thing} is modelled by $N(t) = ${num(s.A)} \\times ${num(expB(s))}^{t}$, for $t \\ge 0$.`;
  const expValue = (s) => P(`Find the value of $N$ when $t = ${s.T}$.`, 2, ans.sf(s.A * Math.pow(expB(s), s.T)), [
    `$N(${s.T}) = ${num(s.A)} \\times ${num(expB(s))}^{${s.T}}$`, `$N(${s.T}) = ${sf(s.A * Math.pow(expB(s), s.T))}$ (to three significant figures)`]);
  reg({ ...EXPM, unknown: "predict-value", representation: "words", format: "value", levels: [2],
    skills: ["SL2.9.exp-model"], title: "Use an exponential model", situationKey: "exp-model", situation: expSit,
    build({ sit: s }) {
      return { stem: expStem(s), parts: [P("Write down the initial value of $N$.", 1, ans.int(s.A), [`$N(0) = ${num(s.A)} \\times ${num(expB(s))}^{0} = ${num(s.A)}$`]), expValue(s)] };
    } });
  reg({ ...EXPM, syllabus: ["2.9", "1.7"], unknown: "time-to-level", representation: "words", format: "value", levels: [4],
    skills: ["SL2.9.exp-model", "SL1.7.solve-with-logs"], title: "Time for an exponential model to reach a level", situationKey: "exp-model", situation: expSit,
    build({ sit: s }) {
      const target = s.A * s.factor, t = Math.log(s.factor) / Math.log(expB(s));
      return { stem: expStem(s), parts: [expValue(s),
        P(`Find the value of $t$ for which $N(t) = ${num(target)}$.`, 3, ans.sf(t), [
          `$${num(s.A)} \\times ${num(expB(s))}^{t} = ${num(target)}$, so $${num(expB(s))}^{t} = ${num(s.factor)}$`,
          `$t = \\dfrac{\\ln ${num(s.factor)}}{\\ln ${num(expB(s))}}$ (or solve on a calculator)`, `$t = ${sf(t)}$ (to three significant figures)`])] };
    } });
  const LOGF = { type: "fn-log-function-features", syllabus: ["2.9", "2.4"] };
  reg({ ...LOGF, unknown: "x-intercept", representation: "equation", format: "value", levels: [2],
    skills: ["SL2.9.log-graph", "SL2.4.asymptotes", "SL2.4.zeros-intercepts"], title: "Asymptote, a value and the zero of a log function",
    build({ rng }) {
      const b = rng.pick([2, 3]), h = rng.nonzero(-4, 4), k = -rng.int(1, b === 2 ? 3 : 2), n = rng.int(0, b === 2 ? 4 : 3), xv = h + Math.pow(b, n), x0 = h + Math.pow(b, -k);
      return { params: { b, h, k, xv }, stem: `The function $f$ is defined by $f(x) = \\log_{${b}}(${lin(1, -h)}) ${signed(k)}$, for $x > ${h}$.`, parts: [
        P("The graph of $f$ has a vertical asymptote $x = p$. Write down the value of $p$.", 1, ans.int(h), [`The logarithm is not defined when $${lin(1, -h)} = 0$, so the asymptote is $x = ${h}$.`]),
        P(`Find $f(${xv})$.`, 1, ans.int(n + k), [`$f(${xv}) = \\log_{${b}}(${xv - h}) ${signed(k)} = ${n} ${signed(k)} = ${n + k}$`]),
        P("Find the $x$-intercept of the graph of $f$.", 2, ans.int(x0), [`$\\log_{${b}}(${lin(1, -h)}) = ${-k}$, so $${lin(1, -h)} = ${k === -1 ? "" : `${b}^{${-k}} = `}${Math.pow(b, -k)}$`, `$x = ${x0}$`])] };
    } });
  reg({ ...LOGF, unknown: "pick-graph", representation: "graph", format: "graph-pick", levels: [2],
    skills: ["SL2.9.log-graph", "SL2.4.asymptotes", "SL2.2.domain"], title: "Pick the graph of a log function",
    build({ rng }) {
      const h = rng.nonzero(-3, 3), a = rng.sign(), b = 2;
      const gr = (a2, h2, flip) => ({ value: [a2, h2, flip], graph: win([-6, 6], [-5, 5], { functions: [{ fn: flip ? { type: "transform", q: -1, of: { type: "log", a: a2, base: b, h: h2 } } : { type: "log", a: a2, base: b, h: h2 } }], asymptotes: [{ x: flip ? -h2 : h2 }], alt: "A logarithmic curve with a vertical asymptote" }) });
      const wrongs = G.pickDistinct(gr(a, h, false).graph, [
        Object.assign(gr(a, -h, false), { why: "The asymptote is on the wrong side: $\\log(x - h)$ has the asymptote $x = h$." }),
        Object.assign(gr(-a, h, false), { why: "This is the reflection in the $x$-axis." }),
        Object.assign(gr(a, -h, true), { why: "This graph is a reflection in the vertical asymptote: its domain is on the wrong side." }), gr(-a, -h, false)], 3);
      return { params: { a, h, b }, stem: `Consider the function $f(x) = ${a < 0 ? "-" : ""}\\log_{${b}}(${lin(1, -h)})$, for $x > ${h}$.`, parts: [
        P("Which graph shows $y = f(x)$?", 2, ans.graph(rng, gr(a, h, false), wrongs), [
          `The domain is $x > ${h}$, so the graph lies to the right of the asymptote $x = ${h}$.`, `The graph crosses the $x$-axis at $x = ${h + 1}$ and is ${a > 0 ? "increasing" : "decreasing"}.`]),
        P("The graph of $f$ has a vertical asymptote $x = p$. Write down the value of $p$.", 1, ans.int(h), [`$${lin(1, -h)} = 0$ when $x = ${h}$, so $p = ${h}$.`])] };
    } });
  reg({ type: "fn-exp-log-inverse-composite", syllabus: ["2.9", "2.5"], unknown: "evaluate-inverse", representation: "equation", format: "value", levels: [3],
    skills: ["SL2.9.exp-log-inverse", "SL2.5.find-inverse", "SL2.5.inverse-domain-range"], title: "An exponential function, its range and its inverse",
    build({ rng }) {
      const b = rng.pick([2, 3]), h = rng.nonzero(-3, 4), k = rng.nonzero(-5, 5), n = rng.int(0, 2), e = rng.int(Math.max(n + 1, 2), b === 2 ? 5 : 4), x1 = h + n, target = Math.pow(b, e) + k;
      return { params: { b, h, k, x1, target }, stem: `The function $f$ is defined by $f(x) = ${b}^{${lin(1, -h)}} ${signed(k)}$, for $x \\in \\mathbb{R}$.`, parts: [
        P(`Find $f(${x1})$.`, 1, ans.int(Math.pow(b, n) + k), [`$f(${x1}) = ${n === 1 ? b : `${b}^{${n}}`} ${signed(k)} = ${Math.pow(b, n) + k}$`]),
        P("The range of $f$ is $f(x) > c$. Write down the value of $c$.", 1, ans.int(k), [`$${b}^{${lin(1, -h)}} > 0$ for every $x$, so $f(x) > ${k}$ and $c = ${k}$.`]),
        P(`Find $f^{-1}(${target})$.`, 3, ans.int(h + e), [`Solve $f(x) = ${target}$: $${b}^{${lin(1, -h)}} = ${target} - ${paren(k)} = ${Math.pow(b, e)}$`, `$${Math.pow(b, e)} = ${b}^{${e}}$, so $${lin(1, -h)} = ${e}$`, `$x = ${h + e}$, so $f^{-1}(${target}) = ${h + e}$.`])] };
    } });

  // ======================= 2.10 solving equations =======================
  reg({ type: "fn-gdc-solve-equation", syllabus: ["2.10"], unknown: "solve-mixed-equation", representation: "equation", format: "value", levels: [2], calculator: true,
    skills: ["SL2.10.solve-gdc"], title: "Solve an equation with technology",
    build({ rng }) {
      const mm = rng.int(1, 4), c = rng.pick([1.5, 2, 2.5, 3, 4, 5, 6]);
      const f = (x) => Math.exp(x) - mm * x - c;
      const newton = (x) => { for (let i = 0; i < 200; i++) x -= f(x) / (Math.exp(x) - mm); return x; };
      const r1 = newton(-c / mm - 1), r2 = newton(Math.log(5 * mm + c) + 2);
      return { params: { mm, c }, stem: `Consider the equation $\\mathrm{e}^{x} = ${lin(mm, c)}$. The equation has two solutions.`, parts: [
        P("Find the negative solution.", 2, ans.sf(r1), [`Graph $y = \\mathrm{e}^{x}$ and $y = ${lin(mm, c)}$ on a calculator and find their intersections.`, `$x = ${sf(r1)}$`]),
        P("Find the positive solution.", 1, ans.sf(r2), [`The other intersection is at $x = ${sf(r2)}$.`])] };
    } });
  reg({ type: "fn-curve-intersection-quadratic", syllabus: ["2.10", "2.7", "2.4"], unknown: "meeting-points", representation: "equation", format: "value", levels: [3],
    skills: ["SL2.10.solve-analytic", "SL2.4.intersection", "SL2.7.solve-equation"], title: "Where a parabola meets a line",
    build({ rng }) {
      let r1, r2, mm, d;
      do { r1 = rng.int(-5, 2); r2 = r1 + rng.int(2, 6); mm = rng.nonzero(-3, 3); d = rng.int(-5, 5); } while (mm === r1 + r2 || r1 * r2 === 0);
      const b = mm - (r1 + r2), c = d + r1 * r2;
      return { params: { b, c, mm, d }, stem: `The curve $y = ${poly([1, b, c])}$ and the line $y = ${lin(mm, d)}$ intersect at two points, $\\mathrm{A}$ and $\\mathrm{B}$, where $\\mathrm{A}$ is to the left of $\\mathrm{B}$.`, parts: [
        P("Find the $x$-coordinate of $\\mathrm{A}$.", 2, ans.int(r1), [`At the intersections $${poly([1, b, c])} = ${lin(mm, d)}$, so $${poly([1, b - mm, c - d])} = 0$`, `$${factor(r1)}${factor(r2)} = 0$, so $x = ${r1}$ or $x = ${r2}$. $\\mathrm{A}$ has $x = ${r1}$.`]),
        P("Write down the $x$-coordinate of $\\mathrm{B}$.", 1, ans.int(r2), [`$\\mathrm{B}$ has $x = ${r2}$.`]),
        P("Find the $y$-coordinate of $\\mathrm{B}$.", 2, ans.int(mm * r2 + d), [`Substitute into the line: $y = ${mm}${br(r2)} ${signed(d)} = ${mm * r2 + d}$`])] };
    } });

  // ======================= 2.11 transformations =======================
  const TA = { type: "fn-transform-apply", syllabus: ["2.11"] };
  const trSit = (rng) => ({ a: rng.pick([2, 3, -1, -2, 4]), h: rng.nonzero(-5, 5), k: rng.nonzero(-5, 5), p: rng.int(-4, 4), q: rng.nonzero(-5, 5) });
  const gRule = (a, h, k) => `${coef(a, `f(${lin(1, -h)})`)} ${signed(k)}`;
  reg({ ...TA, unknown: "image-point", representation: "words", format: "value", levels: [2],
    skills: ["SL2.11.image-point", "SL2.11.composite-transform"], title: "Image of a point under a transformation", situationKey: "transform", situation: trSit,
    build({ sit: s }) {
      return { stem: `The point $\\mathrm{A}${point(s.p, s.q)}$ lies on the graph of $y = f(x)$. The function $g$ is defined by $g(x) = ${gRule(s.a, s.h, s.k)}$. The point $\\mathrm{A}$ is mapped to the point $\\mathrm{B}$ on the graph of $y = g(x)$.`, parts: [
        P("Find the $x$-coordinate of $\\mathrm{B}$.", 2, ans.int(s.p + s.h), [`Replacing $x$ by $${lin(1, -s.h)}$ translates the graph $${Math.abs(s.h)}$ ${Math.abs(s.h) === 1 ? "unit" : "units"} to the ${s.h > 0 ? "right" : "left"}.`, `$x = ${s.p} ${signed(s.h)} = ${s.p + s.h}$`]),
        P("Find the $y$-coordinate of $\\mathrm{B}$.", 2, ans.int(s.a * s.q + s.k), [`The $y$-coordinate is multiplied by $${s.a}$ and then $${Math.abs(s.k)}$ is ${s.k > 0 ? "added" : "subtracted"}.`, `$y = ${s.a}${br(s.q)} ${signed(s.k)} = ${s.a * s.q + s.k}$`])] };
    } });
  reg({ ...TA, unknown: "rule-from-moves", representation: "words", format: "mcq", levels: [2],
    skills: ["SL2.11.composite-transform", "SL2.11.image-point"], title: "Rule for a stretched and translated graph", situationKey: "transform", situation: trSit,
    build({ rng, sit: s }) {
      const A = Math.abs(s.a) === 1 ? 2 : Math.abs(s.a);
      const opt = (a, h, k, why) => ({ text: m(`g(x) = ${gRule(a, h, k)}`), value: [a, h, k], why });
      return { stem: `The graph of $y = f(x)$ is stretched vertically by a scale factor of $${A}$, and then translated by the vector $\\begin{pmatrix} ${s.h} \\\\ ${s.k} \\end{pmatrix}$, to give the graph of $y = g(x)$.`, parts: [
        P("Which rule defines $g$?", 2, ans.choice(rng, opt(A, s.h, s.k), [
          opt(A, -s.h, s.k, "A translation of $h$ units in the $x$-direction replaces $x$ by $x - h$."),
          opt(A, s.k, s.h, "The two components of the translation have been swapped."),
          opt(A, -s.h, -s.k, "Both components of the translation have the wrong sign."),
          opt(A, s.h, -s.k, "The vertical component of the translation has the wrong sign.")]), [
          `The vertical stretch gives $y = ${A}f(x)$.`, `The translation replaces $x$ by $${lin(1, -s.h)}$ and ${s.k > 0 ? "adds" : "subtracts"} $${Math.abs(s.k)}$: $g(x) = ${gRule(A, s.h, s.k)}$`]),
        P(`The point $${point(s.p, s.q)}$ lies on the graph of $f$. Find the $y$-coordinate of its image on the graph of $g$.`, 1, ans.int(A * s.q + s.k), [`$y = ${A}${br(s.q)} ${signed(s.k)} = ${A * s.q + s.k}$`])] };
    } });
  reg({ ...TA, syllabus: ["2.11", "2.3"], unknown: "sketch-stretch-shift", representation: "graph", format: "graph-pick", levels: [3],
    skills: ["SL2.11.sketch-transformed", "SL2.11.translate", "SL2.11.image-point"], title: "Pick the translated graph",
    build({ rng }) {
      const ys = [rng.int(-2, 2), 0, 0, 0];
      do { ys[1] = rng.int(-3, 3); ys[2] = rng.int(-3, 3); ys[3] = rng.int(-2, 2); } while (ys[1] === ys[0] || ys[2] === ys[1] || ys[3] === ys[2] || (ys[1] - ys[0]) * (ys[2] - ys[1]) > 0);
      const pts = [-3, -1, 1, 3].map((x, i) => [x, ys[i]]), base = { type: "pwl", points: pts };
      const h = rng.pick([-3, -2, 2, 3]), k = rng.pick([-3, -2, 2, 3]);
      const gr = (h2, k2, a2) => ({ value: [h2, k2, a2], graph: win([-7, 7], [-7, 7], { functions: [{ fn: { type: "transform", of: base, h: h2, k: k2, a: a2 } }], alt: "A graph made of three straight segments" }) });
      const wrongs = G.pickDistinct(gr(h, k, 1).graph, [
        Object.assign(gr(-h, k, 1), { why: "The horizontal move is the wrong way: $f(x - h)$ moves the graph $h$ units to the right." }),
        Object.assign(gr(h, -k, 1), { why: "The vertical move is the wrong way." }),
        Object.assign(gr(-h, -k, 1), { why: "Both moves are the wrong way." }),
        Object.assign(gr(k, h, 1), { why: "The horizontal and vertical moves have been swapped." }), gr(h, k, -1)], 3);
      const i = rng.int(0, 3);
      return { params: { h, k, pts, i },
        graph: win([-7, 7], [-7, 7], { functions: [{ fn: base }], points: pts.map(([x, y]) => ({ x, y })), alt: "The graph of f: three straight segments joining four marked points" }),
        stem: `The graph of $y = f(x)$, for $-3 \\le x \\le 3$, is shown. It consists of straight line segments joining points with integer coordinates. The function $g$ is defined by $g(x) = f(${lin(1, -h)}) ${signed(k)}$.`,
        parts: [
          P("Which graph shows $y = g(x)$?", 3, ans.graph(rng, gr(h, k, 1), wrongs), [
            `Replacing $x$ by $${lin(1, -h)}$ moves the graph $${Math.abs(h)}$ units to the ${h > 0 ? "right" : "left"}.`, `Adding $${k}$ moves it $${Math.abs(k)}$ units ${k > 0 ? "up" : "down"}.`,
            `So the graph of $f$ is translated by the vector $\\begin{pmatrix} ${h} \\\\ ${k} \\end{pmatrix}$.`]),
          P(`The point $${point(pts[i][0], pts[i][1])}$ on the graph of $f$ is mapped to the point $\\mathrm{B}$ on the graph of $g$. Find the $x$-coordinate of $\\mathrm{B}$.`, 1, ans.int(pts[i][0] + h), [`$x = ${pts[i][0]} ${signed(h)} = ${pts[i][0] + h}$`]),
          P("Find the $y$-coordinate of $\\mathrm{B}$.", 1, ans.int(pts[i][1] + k), [`$y = ${pts[i][1]} ${signed(k)} = ${pts[i][1] + k}$`])] };
    } });
  reg({ type: "fn-transform-describe", syllabus: ["2.11", "2.6"], unknown: "stretch-and-shift-parameters", representation: "equation", format: "value", levels: [3],
    skills: ["SL2.11.describe", "SL2.11.stretch", "SL2.11.translate", "SL2.6.complete-square"], title: "Stretch and translation taking one parabola to another",
    build({ rng }) {
      const a = rng.pick([2, 3, 4, -2, -3]), h = rng.nonzero(-4, 4), k = rng.nonzero(-6, 6), b = -2 * a * h, c = a * h * h + k;
      return { params: { a, b, c }, stem: `Let $f(x) = x^{2}$ and $g(x) = ${poly([a, b, c])}$. The function $g$ can be written in the form $g(x) = a\\,f(x - h) + k$.`, parts: [
        P("Write down the value of $a$.", 1, ans.int(a), [`$a\\,f(x - h) + k = a(x - h)^{2} + k$, and the coefficient of $x^{2}$ is $a = ${a}$.`]),
        P("Find the value of $h$.", 2, ans.int(h), [`$g(x) = ${a}\\left(${poly([1, -2 * h, 0])}\\right) ${signed(c)}$`, `$${poly([1, -2 * h, 0])} = ${factor(h)}^{2} - ${h * h}$, so $h = ${h}$.`]),
        P("Find the value of $k$.", 2, ans.int(k), [`$g(x) = ${a}${factor(h)}^{2} ${signed(-a * h * h)} ${signed(c)}$`, `$k = ${-a * h * h} ${signed(c)} = ${k}$`])] };
    } });

  // ======================= level 0: prior learning that Topic 2 leans on =======================
  const PRE = { syllabus: ["2.7"], skills: [], levels: [0], representation: "equation", format: "value" };
  reg({ ...PRE, type: "fn-pre-factorise", unknown: "monic-trinomial", title: "Factorise a quadratic",
    build({ rng }) {
      let u, v;
      do { u = rng.nonzero(-7, 7); v = rng.nonzero(-7, 7); } while (u >= v);
      return { params: { b: u + v, c: u * v }, stem: `The expression $${poly([1, u + v, u * v])}$ can be written as $(x + p)(x + q)$, where $p < q$.`, parts: [
        P("Find the value of $p$.", 1, ans.int(u), [`Look for two numbers with product $${u * v}$ and sum $${u + v}$: they are $${u}$ and $${v}$.`, `$${poly([1, u + v, u * v])} = ${factor(-u)}${factor(-v)}$, so $p = ${u}$.`]),
        P("Find the value of $q$.", 1, ans.int(v), [`The larger of the two numbers is $q = ${v}$.`])] };
    } });
  reg({ ...PRE, syllabus: ["2.6"], type: "fn-pre-expand", unknown: "double-bracket", title: "Expand two brackets",
    build({ rng }) {
      const u = rng.nonzero(-8, 8), v = rng.nonzero(-8, 8);
      return { params: { u, v }, stem: `The expression $${factor(-u)}${factor(-v)}$ is expanded and written as $x^{2} + bx + c$.`, parts: [
        P("Find the value of $b$.", 1, ans.int(u + v), [`$${factor(-u)}${factor(-v)} = ${expr([[1, "x^{2}"], [v, "x"], [u, "x"], [u * v, ""]])}$`, `$b = ${u} ${signed(v)} = ${u + v}$`]),
        P("Find the value of $c$.", 1, ans.int(u * v), [`$c = ${paren(u)} \\times ${paren(v)} = ${u * v}$`])] };
    } });
  reg({ ...PRE, syllabus: ["2.1"], type: "fn-pre-linear-equations", unknown: "two-step", title: "Solve a linear equation",
    build({ rng }) {
      const a = rng.pick([2, 3, 4, 5, 6, -2, -3, -4]), b = rng.nonzero(-9, 9), c = rng.int(-9, 12), x = rat.Q(c - b, a);
      return { params: { a, b, c }, stem: `Consider the equation $${lin(a, b)} = ${c}$.`, parts: [
        P("Solve the equation for $x$.", 2, ans.frac(x.n, x.d), [`$${coef(a, "x")} = ${c} - ${paren(b)} = ${c - b}$`, `$x = \\dfrac{${c - b}}{${a}}${x.d === Math.abs(a) && a > 0 ? "" : " = " + rat.tex(x)}$`])] };
    } });
  reg({ ...PRE, syllabus: ["2.2"], type: "fn-pre-substitute", unknown: "negative-into-square", title: "Substitute a negative number",
    build({ rng }) {
      const a = rng.pick([1, 2, 3, -1, -2]), b = rng.nonzero(-6, 6), n = rng.int(1, 5), v = a * n * n - b * n;
      return { params: { a, b, n }, stem: `Consider the expression $${poly([a, b, 0])}$.`, parts: [
        P(`Find the value of the expression when $x = -${n}$.`, 2, ans.int(v), [`$${coef(a, `(-${n})^{2}`)} ${signed(b)}(-${n}) = ${coef(a, `(${n * n})`)} ${signed(-b * n)}$`, `The value is $${v}$.`])] };
    } });
  reg({ ...PRE, syllabus: ["2.8"], type: "fn-pre-algebraic-fractions", unknown: "excluded-value", title: "Value that makes a denominator zero",
    build({ rng }) {
      let c, d;
      do { c = rng.pick([1, 2, 3, 4, 5]); d = rng.nonzero(-9, 9); } while (fmt.gcd(c, d) !== 1 && c !== 1);
      const a = rng.int(1, 5), b = rng.nonzero(-5, 5);
      return { params: { c, d }, stem: `The expression $\\dfrac{${lin(a, b)}}{${lin(c, d)}}$ is not defined for exactly one value of $x$.`, parts: [
        P("Find this value of $x$.", 1, ans.frac(-d, c), [`A fraction is not defined when its denominator is zero: $${lin(c, d)} = 0$`, `$x = ${frac(-d, c)}$`])] };
    } });
  reg({ ...PRE, syllabus: ["2.4"], type: "fn-pre-graph-reading", unknown: "round-3sf", title: "Round to three significant figures", calculator: true,
    build({ rng }) {
      let digits;
      do { digits = rng.int(10000, 99999); } while (digits % 100 === 50);
      const scale = rng.pick([1, 10, 100, 1000, 100000, 1000000]), x = digits / scale, r = Number(x.toPrecision(3));
      return { params: { x }, stem: `A calculator displays the value $${num(x)}$.`, parts: [
        P("Write this value correct to three significant figures.", 1, ans.dec(r), [`The first three significant figures are $${String(digits).slice(0, 3).split("").join(",\\ ")}$, and the next digit is $${String(digits)[3]}$, so round ${Number(String(digits)[3]) >= 5 ? "up" : "down"}.`, `The value is $${num(r)}$.`])] };
    } });
  reg({ ...PRE, syllabus: ["2.9"], type: "fn-pre-percent-multiplier", unknown: "increase-multiplier", title: "Percentage change as a multiplier",
    build({ rng }) {
      const up = rng.bool(), r = rng.pick([2, 3, 4, 5, 7.5, 8, 12, 15, 20, 2.5, 35]), mult = up ? 1 + r / 100 : 1 - r / 100;
      return { params: { up, r }, stem: `A quantity ${up ? "increases" : "decreases"} by $${pct(r)}$.`, parts: [
        P("Write down the number the quantity is multiplied by.", 1, ans.dec(mult), [`${up ? "An increase" : "A decrease"} of $${pct(r)}$ leaves $100\\% ${up ? "+" : "-"} ${pct(r)} = ${pct(up ? 100 + r : 100 - r)}$ of the quantity.`, `The multiplier is $${num(mult)}$.`])] };
    } });
})(typeof globalThis !== "undefined" ? globalThis : this);
