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

  // =====================================================================================
  // Depth: a recall level, a Paper 1 and a Paper 2 level for every subtopic, the exam types that
  // had no generator, and a second way of asking each type. Generators that name only 2.1 to 2.4
  // are also offered in the AI courses.
  // =====================================================================================
  const more = (v) => num(Number(v.toPrecision(5)));                 // an unrounded calculator value in working
  const solve = (f, lo, hi) => { let flo = f(lo); for (let i = 0; i < 90; i++) { const mid = (lo + hi) / 2, fm = f(mid); if ((flo < 0) === (fm < 0)) { lo = mid; flo = fm; } else hi = mid; } return (lo + hi) / 2; };
  const units = (n) => (Math.abs(n) === 1 ? "unit" : "units");
  const CALC = { calculator: true };

  // ---------------- 2.1 ----------------
  reg({ ...LINE, ...CALC, unknown: "triangle-area", representation: "equation", format: "value", levels: [4],
    skills: ["SL2.1.intersection-lines", "SL2.1.intercepts", "SL2.1.equation-of-line"], title: "Two lines and the triangle they make with the x-axis",
    build({ rng }) {
      let m1, c1, m2, c2, xA, yA, a1, a2;
      do {
        m1 = rng.pick([0.4, 0.6, 0.8, 1.2, 1.5, 1.6, 2.5]); c1 = rng.pick([0.9, 1.3, 1.7, 2.2, 2.6, 3.1]);
        m2 = -rng.pick([0.5, 0.7, 0.9, 1.1, 1.4, 1.8]); c2 = rng.pick([5.2, 6.4, 7.1, 7.9, 8.6, 9.3]);
        xA = (c2 - c1) / (m1 - m2); yA = m1 * xA + c1; a1 = -c1 / m1; a2 = -c2 / m2;
      } while (a2 - a1 > 16 || yA > 9 || yA < 3);
      const area = 0.5 * (a2 - a1) * yA;
      return { params: { m1, c1, m2, c2 },
        graph: { x: [Math.floor(a1) - 1, Math.ceil(a2) + 1], y: [-2, Math.ceil(yA) + 2], xStep: 1, yStep: 1,
          functions: [{ fn: { type: "poly", coeffs: [c1, m1] }, label: "L₁" }, { fn: { type: "poly", coeffs: [c2, m2] }, label: "L₂" }],
          regions: [{ x: [a1, xA], fn: 0 }, { x: [xA, a2], fn: 1 }], points: [{ x: xA, y: yA, label: "A" }], alt: "Two straight lines crossing at A above the x-axis, with the triangle between them and the x-axis shaded" },
        stem: `The line $L_{1}$ has equation $y = ${lin(m1, c1)}$ and the line $L_{2}$ has equation $y = ${lin(m2, c2)}$. The lines intersect at the point $\\mathrm{A}$. The triangle enclosed by $L_{1}$, $L_{2}$ and the $x$-axis is shaded in the diagram.`,
        parts: [
          P("Find the $x$-coordinate of $\\mathrm{A}$.", 2, ans.sf(xA), [`At $\\mathrm{A}$, $${lin(m1, c1)} = ${lin(m2, c2)}$, so $${num(m1 - m2)}x = ${num(c2 - c1)}$.`, `$x = ${more(xA)}\\ldots = ${sf(xA)}$ (to three significant figures)`]),
          P("Find the $y$-coordinate of $\\mathrm{A}$.", 1, ans.sf(yA), [`$y = ${num(m1)}(${more(xA)}) + ${num(c1)} = ${sf(yA)}$`]),
          P("Find the area of the shaded triangle.", 3, ans.sf(area), [
            `$L_{1}$ meets the $x$-axis where $${lin(m1, c1)} = 0$, so $x = ${more(a1)}$. $L_{2}$ meets it where $${lin(m2, c2)} = 0$, so $x = ${more(a2)}$.`,
            `The base of the triangle is $${more(a2)} - (${more(a1)}) = ${more(a2 - a1)}$ and its height is the $y$-coordinate of $\\mathrm{A}$.`,
            `Area $= \\dfrac{1}{2} \\times ${more(a2 - a1)} \\times ${more(yA)} = ${sf(area)}$`])] };
    } });

  // ---------------- 2.2 ----------------
  reg({ ...CALC, type: "fn-evaluate-function", syllabus: ["2.2"], unknown: "time-for-target", representation: "words", format: "value", levels: [4],
    skills: ["SL2.2.function-model", "SL2.2.evaluate-notation"], title: "A model: a value, and the inputs that give a stated output",
    build({ rng }) {
      let A, B, top, L, t1, t2;
      const t0 = rng.pick([0.5, 1.5, 2.5, 3.5]);
      do {
        A = rng.pick([12, 15, 18, 24, 30]); B = rng.pick([3, 4, 5, 6, 8]); top = A / (2 * Math.sqrt(B));
        L = Math.round(top * rng.pick([5, 6, 7])) / 10;
        const disc = A * A - 4 * L * L * B;
        t1 = disc > 0 ? (A - Math.sqrt(disc)) / (2 * L) : 0; t2 = disc > 0 ? (A + Math.sqrt(disc)) / (2 * L) : 0;
      } while (!(L > 0.5 && L < 0.85 * top && t2 < 14 && t1 > 0.3));
      const C = (t) => (A * t) / (t * t + B);
      return { params: { A, B, L, t0 },
        graph: { x: [0, Math.ceil(t2) + 2], y: [0, Math.ceil(top) + 1], xLabel: "t", yLabel: "C",
          functions: [{ fn: { type: "rational", num: [0, A], den: [B, 0, 1] }, domain: [0, Math.ceil(t2) + 2] }, { fn: { type: "poly", coeffs: [L] }, dashed: true }], alt: "A curve that rises quickly to a maximum and then falls slowly, with a dashed horizontal line crossing it twice" },
        stem: `The concentration of a medicine in a patient's blood, in milligrams per litre, is modelled by $C(t) = \\dfrac{${A}t}{t^{2} + ${B}}$, for $t \\ge 0$, where $t$ is the time in hours after the medicine is taken. The medicine is effective while $C(t) \\ge ${num(L)}$. The graph shows $C$ and the line $C = ${num(L)}$.`,
        parts: [
          P(`Find $C(${num(t0)})$.`, 2, ans.sf(C(t0)), [`$C(${num(t0)}) = \\dfrac{${A}(${num(t0)})}{(${num(t0)})^{2} + ${B}} = \\dfrac{${num(A * t0)}}{${num(t0 * t0 + B)}}$`, `$C(${num(t0)}) = ${sf(C(t0))}$ (to three significant figures)`]),
          P("Find the time, in hours, at which the medicine first becomes effective.", 2, ans.sf(t1), [`Solve $C(t) = ${num(L)}$: graph $y = C(t)$ and $y = ${num(L)}$ on a calculator and find where they cross.`, `The first crossing is at $t = ${sf(t1)}$.`]),
          P("Find the time, in hours, at which the medicine stops being effective.", 1, ans.sf(t2), [`The second crossing is at $t = ${sf(t2)}$.`]),
          P("Find the length of time, in hours, for which the medicine is effective.", 1, ans.sf(t2 - t1), [`$${more(t2)} - ${more(t1)} = ${sf(t2 - t1)}$`])] };
    } });
  const INVR = { type: "fn-inverse-reflection", syllabus: ["2.2"] };
  reg({ ...INVR, unknown: "image-point", representation: "words", format: "value", levels: [1],
    skills: ["SL2.2.inverse-undo"], title: "A point on the graph of an inverse function",
    build({ rng }) {
      let a, b;
      do { a = rng.int(-6, 8); b = rng.int(-6, 8); } while (a === b);
      return { params: { a, b }, stem: `The function $f$ has an inverse, $f^{-1}$. The point $${point(a, b)}$ lies on the graph of $f$.`, parts: [
        P("The corresponding point on the graph of $f^{-1}$ is the reflection of this point in the line $y = x$. Write down its $x$-coordinate.", 1, ans.int(b), [`Reflecting in $y = x$ swaps the coordinates, so the point is $${point(b, a)}$ and its $x$-coordinate is $${b}$.`]),
        P(`Write down the value of $f^{-1}(${b})$.`, 1, ans.int(a), [`$f(${a}) = ${b}$, so $f^{-1}(${b}) = ${a}$.`])] };
    } });
  reg({ ...INVR, unknown: "sketch-inverse", representation: "graph", format: "graph-pick", levels: [2],
    skills: ["SL2.2.inverse-undo", "SL2.4.symmetry"], title: "Pick the graph of the inverse function",
    build({ rng }) {
      const steps = rng.shuffle(rng.pick([[1, 1, 3, 4], [1, 2, 2, 4], [1, 1, 2, 5]])), xs = [-4, -2, 0, 2, 4];
      let y = rng.pick([-5, -4]);
      const pts = [[xs[0], y]];
      steps.forEach((s, i) => { y += s; pts.push([xs[i + 1], y]); });
      const yEqX = { fn: { type: "poly", coeffs: [0, 1] }, dashed: true };
      const gr = (map, name) => { const p = pts.map(map).sort((u, v) => u[0] - v[0]); return { value: name, graph: win([-6, 6], [-6, 6], { functions: [{ fn: { type: "pwl", points: p } }, yEqX], alt: "A graph made of straight segments, with the line y equals x dashed" }) }; };
      const right = gr(([x, yy]) => [yy, x], "inverse");
      const wrongs = G.pickDistinct(right.graph, [
        Object.assign(gr(([x, yy]) => [x, -yy], "x-axis"), { why: "This is the reflection in the $x$-axis, which is the graph of $y = -f(x)$." }),
        Object.assign(gr(([x, yy]) => [-x, yy], "y-axis"), { why: "This is the reflection in the $y$-axis, which is the graph of $y = f(-x)$." }),
        Object.assign(gr(([x, yy]) => [-yy, -x], "other diagonal"), { why: "This is the reflection in the line $y = -x$, not in $y = x$." }),
        gr(([x, yy]) => [-x, -yy], "rotation")], 3);
      const i = rng.int(1, 3), ex = pts.slice(1).sort((u, v) => Math.abs(v[0] - v[1]) - Math.abs(u[0] - u[1]))[0];
      return { params: { pts, c: pts[i][1] },
        graph: win([-6, 6], [-6, 6], { functions: [{ fn: { type: "pwl", points: pts }, label: "f" }, yEqX], points: pts.map(([x, yy]) => ({ x, y: yy })), alt: "The graph of f, made of straight segments joining marked points, with the line y equals x dashed" }),
        stem: "The graph of the function $f$ is shown for $-4 \\le x \\le 4$. It consists of straight line segments joining points with integer coordinates. The line $y = x$ is dashed.",
        parts: [
          P("Which graph shows $y = f^{-1}(x)$?", 2, ans.graph(rng, right, wrongs), [
            "The graph of $f^{-1}$ is the reflection of the graph of $f$ in the line $y = x$.",
            `Every point $(a,\\, b)$ on $f$ becomes $(b,\\, a)$: for example $${point(pts[0][0], pts[0][1])}$ becomes $${point(pts[0][1], pts[0][0])}$ and $${point(ex[0], ex[1])}$ becomes $${point(ex[1], ex[0])}$.`]),
          P(`Write down the value of $f^{-1}(${pts[i][1]})$.`, 1, ans.int(pts[i][0]), [`From the graph, $f(${pts[i][0]}) = ${pts[i][1]}$, so $f^{-1}(${pts[i][1]}) = ${pts[i][0]}$.`])] };
    } });

  // ---------------- 2.3 ----------------
  reg({ type: "fn-graph-table-composite-inverse", syllabus: ["2.3"], unknown: "read-value", representation: "graph", format: "value", levels: [1],
    skills: ["SL2.3.read-graph"], title: "Read a value and an input from a graph",
    build({ rng }) {
      const xs = [-3, -2, -1, 0, 1, 2, 3], steps = rng.shuffle([1, 1, 1, 2, 2, 2]), dir = rng.sign();
      let y = rng.pick([-5, -4]);
      const ys = [y];
      for (const s of steps) { y += s; ys.push(y); }
      const pts = xs.map((x, i) => [x, dir * ys[i]]);
      const [a, c0] = rng.sample(xs, 2);
      return { params: { a, c: pts[c0 + 3][1] },
        graph: win([-4, 4], [-6, 6], { functions: [{ fn: { type: "pwl", points: pts }, label: "f" }], points: pts.map(([x, yy]) => ({ x, y: yy })), alt: "The graph of f, made of straight segments between marked points" }),
        stem: "The graph of the function $f$ is shown for $-3 \\le x \\le 3$. It consists of straight line segments joining points with integer coordinates.",
        parts: [
          P(`Write down the value of $f(${a})$.`, 1, ans.int(pts[a + 3][1]), [`Go up or down from $x = ${a}$ to the graph and read across: $f(${a}) = ${pts[a + 3][1]}$.`]),
          P(`Write down the value of $x$ for which $f(x) = ${pts[c0 + 3][1]}$.`, 1, ans.int(c0), [`Go across from $y = ${pts[c0 + 3][1]}$ to the graph and read down: $x = ${c0}$.`])] };
    } });
  const SKG = { type: "fn-sketch-gdc", syllabus: ["2.3", "2.4"], ...CALC };
  const cubicSit = (rng) => {
    let c, d;
    do { c = rng.pick([1.5, 1.8, 2.1, 2.2, 2.6, 2.7]); d = rng.pick([-1.5, -1, 1, 1.5]); } while (Math.abs(d) > 0.8 * ((2 * c) / 3) * Math.sqrt(c / 0.6) || Math.abs(12.8 - 4 * c - ((2 * c) / 3) * Math.sqrt(c / 0.6)) < 0.3);
    return { c, d };
  };
  const cubicFn = (s) => (x) => 0.2 * x * x * x - s.c * x + s.d;
  const cubicStem = (s) => `The function $f$ is defined by $f(x) = ${poly([0.2, 0, -s.c, s.d])}$, for $-4 \\le x \\le 4$.`;
  const cubicGraph = (cs, extra) => win([-5, 5], [-10, 10], Object.assign({ yStep: 2, functions: [{ fn: { type: "poly", coeffs: cs }, domain: [-4, 4] }], alt: "A cubic curve drawn between two end points" }, extra));
  reg({ ...SKG, unknown: "sketch-on-domain", representation: "equation", format: "graph-pick", levels: [4],
    skills: ["SL2.3.sketch-from-equation", "SL2.4.max-min"], title: "Graph of a cubic on a domain, its local maximum and greatest value", situationKey: "cubic-on-domain", situation: cubicSit,
    build({ rng, sit: s }) {
      const f = cubicFn(s), xm = -Math.sqrt(s.c / 0.6), ym = f(xm), end = f(4), top = Math.max(ym, end);
      const gr = (cs, name) => ({ value: name, graph: cubicGraph(cs) });
      const right = gr([s.d, -s.c, 0, 0.2], "f");
      const wrongs = G.pickDistinct(right.graph, [
        Object.assign(gr([-s.d, s.c, 0, -0.2], "-f"), { why: "This is the reflection in the $x$-axis: check the sign of $f(4)$." }),
        Object.assign(gr([s.d, s.c, 0, -0.2], "f(-x)"), { why: "This is the reflection in the $y$-axis: check the value of $f(4)$." }),
        Object.assign(gr([-s.d, -s.c, 0, 0.2], "wrong intercept"), { why: "The $y$-intercept has the wrong sign: $f(0)$ is the constant term." }),
        Object.assign(gr([s.d, s.c, 0, 0.2], "no turning points"), { why: "This graph has no turning points: the sign of the term in $x$ is wrong." })], 3);
      return { stem: cubicStem(s), parts: [
        P("Which graph shows $y = f(x)$?", 2, ans.graph(rng, right, wrongs), ["Graph $f$ on a calculator with the window $-4 \\le x \\le 4$.",
          `The $y$-intercept is $f(0) = ${num(s.d)}$, the end points are $${point(-4, more(f(-4)))}$ and $${point(4, more(end))}$, and there is a local maximum to the left of the $y$-axis and a local minimum to the right.`]),
        P("Find the $x$-coordinate of the local maximum point.", 1, ans.sf(xm), [`The maximum tool gives $x = ${sf(xm)}$.`]),
        P("Find the $y$-coordinate of the local maximum point.", 2, ans.sf(ym), [`The maximum tool gives $y = ${more(ym)}\\ldots$`, `$y = ${sf(ym)}$ (to three significant figures)`]),
        P("Find the greatest value of $f(x)$ on its domain.", 2, ans.sf(top), [`Compare the local maximum, $${sf(ym)}$, with the value at the right-hand end point, $f(4) = ${more(end)}$.`,
          `The ${end > ym ? "end point is higher" : "local maximum is higher"}, so the greatest value is $${sf(top)}$.`])] };
    } });
  reg({ ...SKG, unknown: "label-zeros", representation: "equation", format: "value", levels: [2],
    skills: ["SL2.4.zeros-intercepts", "SL2.3.sketch-from-equation"], title: "Intercept and zeros of a cubic with technology", situationKey: "cubic-on-domain", situation: cubicSit,
    build({ sit: s }) {
      const f = cubicFn(s), xm = Math.sqrt(s.c / 0.6), z1 = solve(f, -4, -xm), z3 = solve(f, xm, 4);
      return { graph: cubicGraph([s.d, -s.c, 0, 0.2], { functions: [{ fn: { type: "poly", coeffs: [s.d, -s.c, 0, 0.2] }, domain: [-4, 4], label: "f" }] }),
        stem: cubicStem(s) + " The graph of $f$ is shown.", parts: [
          P("Write down the $y$-intercept of the graph of $f$.", 1, ans.dec(s.d), [`$f(0) = ${num(s.d)}$`]),
          P("Find the smallest zero of $f$.", 2, ans.sf(z1), ["Graph $f$ on a calculator and use its zero (root) tool.", `The left-hand zero is $x = ${sf(z1)}$.`]),
          P("Find the largest zero of $f$.", 1, ans.sf(z3), [`The right-hand zero is $x = ${sf(z3)}$.`])] };
    } });

  // ---------------- 2.4 ----------------
  reg({ type: "fn-rational-asymptotes-intercepts", syllabus: ["2.4"], unknown: "features-from-graph", representation: "graph", format: "value", levels: [1],
    skills: ["SL2.4.asymptotes"], title: "Asymptotes read from a graph",
    build({ rng }) {
      const a = rng.pick([1, 2, 3, -1, -2, -3]), h = rng.nonzero(-3, 3), k = rng.nonzero(-3, 3);
      return { params: { h, k },
        graph: win([-6, 6], [-6, 6], { functions: [{ fn: { type: "rational", num: [a - k * h, k], den: [-h, 1] }, label: "f" }], asymptotes: [{ x: h }, { y: k }], alt: "A curve in two branches, with a vertical and a horizontal dashed asymptote" }),
        stem: "The graph of a function $f$ is shown. Its two asymptotes are drawn as dashed lines, and each one crosses an axis at an integer.",
        parts: [
          P("The vertical asymptote has equation $x = p$. Write down the value of $p$.", 1, ans.int(h), [`The vertical dashed line crosses the $x$-axis at $${h}$, so $p = ${h}$.`]),
          P("The horizontal asymptote has equation $y = q$. Write down the value of $q$.", 1, ans.int(k), [`The horizontal dashed line crosses the $y$-axis at $${k}$, so $q = ${k}$.`])] };
    } });
  reg({ type: "fn-ext-match-graph", syllabus: ["2.4", "2.3"], unknown: "equation-from-graph", representation: "graph", format: "value", levels: [3],
    skills: ["SL2.4.zeros-intercepts", "SL2.3.read-graph", "SL2.3.match-graph"], title: "Equation of a cubic from the zeros and the y-intercept of its graph",
    build({ rng }) {
      let p, q, r, a, peak;
      do {
        [p, q, r] = rng.sample([-4, -3, -2, -1, 1, 2, 3, 4], 3).sort((u, v) => u - v); a = rat.Q(rng.sign(), rng.pick([1, 2, 4]));
        peak = 0;
        for (let x = p; x <= r; x += 0.05) peak = Math.max(peak, Math.abs(rat.num(a) * (x - p) * (x - q) * (x - r)));
      } while (!Number.isInteger(rat.num(a) * p * q * r) || peak > 10 || peak < 1.5 || Math.abs(rat.num(a) * p * q * r) > 10);
      const av = rat.num(a), yi = -av * p * q * r;
      const cs = [yi, av * (p * q + p * r + q * r), -av * (p + q + r), av];
      return { params: { p, q, r },
        graph: win([-6, 6], [-12, 12], { yStep: 2, functions: [{ fn: { type: "poly", coeffs: cs }, label: "f" }], points: [{ x: p, y: 0 }, { x: q, y: 0 }, { x: r, y: 0 }, { x: 0, y: yi }], alt: "A cubic curve with its three x-intercepts and its y-intercept marked" }),
        stem: "The graph of the function $f(x) = a(x - p)(x - q)(x - r)$, where $p < q < r$, is shown. The marked points, where the graph meets the axes, have integer coordinates.",
        parts: [
          P("Write down the value of $p$.", 1, ans.int(p), [`The zeros of $f$ are the $x$-intercepts: $${p}$, $${q}$ and $${r}$. The smallest is $p = ${p}$.`]),
          P("Write down the value of $q$.", 1, ans.int(q), [`The middle zero is $q = ${q}$.`]),
          P("Write down the value of $r$.", 1, ans.int(r), [`The largest zero is $r = ${r}$.`]),
          P("Find the value of $a$.", 3, ans.frac(a.n, a.d), [`$f(x) = a${factor(p)}${factor(q)}${factor(r)}$`,
            `The graph passes through $${point(0, yi)}$: $${yi} = a${br(-p)}${br(-q)}${br(-r)} = ${coef(-p * q * r, "a")}$`, `$a = ${rat.tex(a)}$`])] };
    } });

  // ---------------- 2.5 ----------------
  const INVA = { type: "fn-inverse-algebraic" };
  reg({ ...INVA, syllabus: ["2.5"], unknown: "inverse-linear", representation: "equation", format: "mcq", levels: [1],
    skills: ["SL2.5.find-inverse"], title: "Inverse of a linear function",
    build({ rng }) {
      const a = rng.int(2, 6), b = rng.nonzero(-7, 7);
      const opt = (text, value, why) => ({ text: m(text), value, why });
      return { params: { a, b }, stem: `The function $f$ is defined by $f(x) = ${lin(a, b)}$, for $x \\in \\mathbb{R}$.`, parts: [
        P("Which expression is equal to $f^{-1}(x)$?", 2, ans.choice(rng, opt(`\\dfrac{${lin(1, -b)}}{${a}}`, [1, -b, a]), [
          opt(`\\dfrac{${lin(1, b)}}{${a}}`, [1, b, a], "To undo adding a number, subtract it (and to undo subtracting, add)."),
          opt(`\\dfrac{x}{${a}} ${signed(-b)}`, [1, -b * a, a], "The constant must be undone before dividing, so it is divided as well."),
          opt(`\\dfrac{1}{${lin(a, b)}}`, "reciprocal", "This is the reciprocal of $f(x)$, not the inverse function."),
          opt(lin(a, -b), [a * a, -b * a, a], "Changing the sign of the constant does not undo the multiplication.")]), [
          `Write $y = ${lin(a, b)}$ and make $x$ the subject: $y ${signed(-b)} = ${a}x$`, `$x = \\dfrac{y ${signed(-b)}}{${a}}$, so $f^{-1}(x) = \\dfrac{${lin(1, -b)}}{${a}}$.`])] };
    } });
  reg({ ...INVA, syllabus: ["2.5", "2.8"], unknown: "inverse-rational", representation: "equation", format: "mcq", levels: [3],
    skills: ["SL2.5.find-inverse", "SL2.8.rational-inverse", "SL2.5.inverse-domain-range"], title: "Inverse of a rational function, its domain and a value",
    build({ rng }) {
      let a, b, c, dl;
      do { a = rng.nonzero(-4, 5); b = rng.nonzero(-6, 6); c = rng.nonzero(-5, 5); dl = rng.pick([-2, -1, 1, 2, 3]); } while (a === c || b === -a * c || a === -c || c * (a + dl) + b === 0);
      const R = (n1, n0, d0) => `\\dfrac{${lin(n1, n0)}}{${lin(1, d0)}}`, opt = (n1, n0, d0, why) => ({ text: m(R(n1, n0, d0)), value: [n1, n0, d0], why });
      const mv = a + dl, v = rat.Q(c * mv + b, dl);
      return { params: { a, b, c, mv }, stem: `The function $f$ is defined by $f(x) = ${R(a, b, -c)}$, for $x \\ne ${c}$.`, parts: [
        P("Which expression is equal to $f^{-1}(x)$?", 3, ans.choice(rng, opt(c, b, -a), [
          opt(c, -b, -a, "A sign has been lost when the terms in $x$ were collected on one side."),
          opt(c, b, a, "A sign has been lost: collecting the terms in $x$ gives $x(y - a)$ on one side."),
          { text: m(`\\dfrac{${lin(1, -c)}}{${lin(a, b)}}`), value: "reciprocal", why: "This is the reciprocal of $f(x)$, not the inverse function." },
          opt(a, b, c, "Only the sign in the denominator has been changed; $x$ has not been made the subject.")]), [
          `Write $y = ${R(a, b, -c)}$, so $y(${lin(1, -c)}) = ${lin(a, b)}$.`, `$${expr([[1, "xy"], [-c, "y"]])} = ${lin(a, b)}$, so $${expr([[1, "xy"], [-a, "x"]])} = ${expr([[c, "y"], [b, ""]])}$`,
          `$x(${lin(1, -a, "y")}) = ${expr([[c, "y"], [b, ""]])}$, so $x = \\dfrac{${expr([[c, "y"], [b, ""]])}}{${lin(1, -a, "y")}}$ and $f^{-1}(x) = ${R(c, b, -a)}$.`]),
        P("The domain of $f^{-1}$ is $x \\ne k$. Write down the value of $k$.", 1, ans.int(a), [`The denominator of $f^{-1}(x)$ is zero when $x = ${a}$, so $k = ${a}$. (This is the horizontal asymptote of $f$, $y = ${a}$.)`]),
        P(`Find $f^{-1}(${mv})$.`, 2, ans.frac(v.n, v.d), [`$f^{-1}(${mv}) = \\dfrac{${paren(c)} \\times ${paren(mv)} ${signed(b)}}{${mv} ${signed(-a)}}$`, `$f^{-1}(${mv}) = ${v.d === Math.abs(dl) && dl > 0 ? "" : `\\dfrac{${c * mv + b}}{${dl}} = `}${rat.tex(v)}$`])] };
    } });
  reg({ ...COMP, ...CALC, unknown: "build-from-words", representation: "words", format: "value", levels: [4],
    skills: ["SL2.5.composite-value", "SL2.5.composite-expression", "SL2.5.find-inverse"], title: "A composite model: area of a growing circle",
    build({ rng }) {
      const p = rng.pick([1.2, 1.4, 1.6, 1.8, 2.2, 2.5]), q = rng.pick([0.4, 0.6, 0.8, 1.5]), t0 = rng.pick([3, 5, 7, 8, 10]), R = rng.pick([5, 6, 7.5, 8, 9]), S = rng.pick([100, 150, 200, 250, 300]);
      const r0 = p * Math.sqrt(t0) + q, area = Math.PI * r0 * r0, tR = Math.pow((R - q) / p, 2), rS = Math.sqrt(S / Math.PI), tS = Math.pow((rS - q) / p, 2);
      return { params: { p, q, t0, R, S },
        stem: `An oil patch on a lake is circular. Its radius, in metres, is modelled by $r(t) = ${num(p)}\\sqrt{t} + ${num(q)}$, for $t \\ge 0$, where $t$ is the time in minutes after a spill. The area of a circle of radius $r$ is $A(r) = \\pi r^{2}$.`,
        parts: [
          P(`Find $(A \\circ r)(${t0})$, the area of the patch in square metres when $t = ${t0}$.`, 2, ans.sf(area), [`$r(${t0}) = ${num(p)}\\sqrt{${t0}} + ${num(q)} = ${more(r0)}$`, `$(A \\circ r)(${t0}) = \\pi(${more(r0)})^{2} = ${sf(area)}$`]),
          P(`Find the value of $t$ at which the radius of the patch is $${unit(R, "m")}$.`, 2, ans.sf(tR), [`$${num(p)}\\sqrt{t} + ${num(q)} = ${num(R)}$, so $\\sqrt{t} = \\dfrac{${num(R - q)}}{${num(p)}} = ${more((R - q) / p)}$`, `$t = (${more((R - q) / p)})^{2} = ${sf(tR)}$`]),
          P(`Find the value of $t$ at which the area of the patch is $${S}$ square metres.`, 3, ans.sf(tS), [`$(A \\circ r)(t) = \\pi\\left(${num(p)}\\sqrt{t} + ${num(q)}\\right)^{2} = ${S}$`,
            `Solve on a calculator, or work back: $r = \\sqrt{\\dfrac{${S}}{\\pi}} = ${more(rS)}$`, `$\\sqrt{t} = \\dfrac{${more(rS)} - ${num(q)}}{${num(p)}}$, so $t = ${sf(tS)}$`])] };
    } });

  // ---------------- 2.6 ----------------
  reg({ ...QM, ...CALC, unknown: "second-time-at-height", representation: "words", format: "value", levels: [4], title: "Projectile model: maximum, landing and time above a height",
    build({ rng }) {
      const v = rng.pick([12.5, 14, 15.5, 17, 18.5, 21]), h0 = rng.pick([1.2, 1.5, 1.8, 2.4, 3]);
      const tM = v / 9.8, hM = h0 + (v * v) / 19.6, land = (v + Math.sqrt(v * v + 19.6 * h0)) / 9.8, H = Math.round(hM * rng.pick([0.5, 0.6, 0.7]));
      const half = Math.sqrt((hM - H) / 4.9), dur = 2 * half;
      return { params: { v, h0, H },
        graph: { x: [0, Math.ceil(land) + 1], y: [0, Math.ceil(hM / 5) * 5 + 5], xLabel: "t", yLabel: "h",
          functions: [{ fn: { type: "poly", coeffs: [h0, v, -4.9] }, domain: [0, land] }, { fn: { type: "poly", coeffs: [H] }, dashed: true }], alt: "A parabola opening downwards from launch to landing, with a dashed horizontal line crossing it twice" },
        stem: `A ball is thrown upwards. Its height above the ground, in metres, is modelled by $h(t) = ${poly([-4.9, v, h0], "t")}$, where $t$ is the time in seconds after it is thrown, until it lands. The graph shows $h$ and the line $h = ${H}$.`,
        parts: [
          P("Find the maximum height of the ball, in metres.", 2, ans.sf(hM), [`The vertex is at $t = -\\dfrac{b}{2a} = \\dfrac{${num(v)}}{9.8} = ${more(tM)}$ (or use the maximum tool on a calculator).`, `$h(${more(tM)}) = ${sf(hM)}$`]),
          P("Find the time, in seconds, at which the ball lands.", 2, ans.sf(land), [`Solve $${poly([-4.9, v, h0], "t")} = 0$ with the quadratic formula or a calculator.`, `$t = ${sf(land)}$ (the other solution is negative)`]),
          P(`Find the length of time, in seconds, for which the ball is more than $${unit(H, "m")}$ above the ground.`, 3, ans.sf(dur), [`Solve $h(t) = ${H}$: $t = ${more(tM - half)}$ or $t = ${more(tM + half)}$`, `The ball is above $${unit(H, "m")}$ between these times.`, `$${more(tM + half)} - ${more(tM - half)} = ${sf(dur)}$`])] };
    } });

  // ---------------- 2.7 ----------------
  reg({ ...SQ, ...CALC, unknown: "solve-in-context", representation: "words", format: "value", levels: [4],
    skills: ["SL2.7.solve-equation", "SL2.7.discriminant"], title: "A rectangle whose sides satisfy a quadratic equation",
    build({ rng }) {
      const d = rng.pick([1.5, 2.5, 3.5, 4.5, 6.5]), A = rng.pick([40, 55, 72, 86, 95, 120]);
      const disc = d * d + 4 * A, w = (-d + Math.sqrt(disc)) / 2, len = w + d, diag = Math.hypot(w, len);
      return { params: { d, A },
        graph: { alt: "A rectangle with its width and length labelled", shapes: [{ type: "polygon", points: [[0, 0], [len, 0], [len, w], [0, w]], sides: [`w + ${d}`, "w", null, null] }] },
        stem: `A rectangular garden has width $w$ metres. Its length is $${num(d)}$ metres more than its width, and its area is $${A}$ square metres, so $w$ satisfies the equation $${poly([1, d, -A], "w")} = 0$.`,
        parts: [
          P("Find the discriminant of this equation.", 2, ans.dec(disc), [`$\\Delta = b^{2} - 4ac = ${num(d)}^{2} - 4(1)(${-A})$`, `$\\Delta = ${num(d * d)} + ${4 * A} = ${num(disc)}$`]),
          P("Find the width of the garden, in metres.", 2, ans.sf(w), [`$w = \\dfrac{-${num(d)} \\pm \\sqrt{${num(disc)}}}{2}$, so $w = ${more(w)}$ or $w = ${more((-d - Math.sqrt(disc)) / 2)}$`, `A width is positive, so $w = ${sf(w)}$.`]),
          P("Find the length of a diagonal of the garden, in metres.", 2, ans.sf(diag), [`The length is $${more(w)} + ${num(d)} = ${more(len)}$.`, `By Pythagoras, the diagonal is $\\sqrt{${more(w)}^{2} + ${more(len)}^{2}} = ${sf(diag)}$`])] };
    } });
  reg({ ...CALC, type: "fn-quadratic-inequality", syllabus: ["2.7"], unknown: "largest-integer", representation: "equation", format: "value", levels: [4],
    skills: ["SL2.7.inequality", "SL2.7.solve-equation"], title: "Integers that satisfy a quadratic inequality",
    build({ rng }) {
      let b, c, disc;
      do { b = rng.int(-9, 11); c = rng.int(-12, 14); disc = b * b - 4 * c; } while (disc < 12 || Number.isInteger(Math.sqrt(disc)) || b === 0 || c === 0 || disc > 110);
      const r1 = (b - Math.sqrt(disc)) / 2, r2 = (b + Math.sqrt(disc)) / 2, lo = Math.ceil(r1), hi = Math.floor(r2), bottom = c - (b * b) / 4;
      return { params: { b, c },
        graph: { x: [Math.floor(r1) - 2, Math.ceil(r2) + 2], y: [Math.floor(bottom) - 1, Math.max(4, Math.ceil(-bottom / 3))], xStep: 1,
          functions: [{ fn: { type: "poly", coeffs: [c, -b, 1] }, label: "f" }], regions: [{ x: [r1, r2], fn: 0 }], alt: "A parabola opening upwards, with the region between the curve and the x-axis shaded" },
        stem: `Consider the function $f(x) = ${poly([1, -b, c])}$. The region where the graph of $f$ lies below the $x$-axis is shaded in the diagram.`,
        parts: [
          P("Find the smaller solution of $f(x) = 0$.", 2, ans.sf(r1), [`$x = \\dfrac{${b} \\pm \\sqrt{${disc}}}{2}$ (or use a calculator)`, `The smaller solution is $x = ${sf(r1)}$.`]),
          P("Find the larger solution of $f(x) = 0$.", 1, ans.sf(r2), [`The larger solution is $x = ${sf(r2)}$.`]),
          P("Find the number of integers $x$ for which $f(x) < 0$.", 2, ans.int(hi - lo + 1), [`The graph is below the $x$-axis between the roots: $${sf(r1)} < x < ${sf(r2)}$.`, `The integers in this interval run from $${lo}$ to $${hi}$, so there are $${hi - lo + 1}$ of them.`]),
          P("Write down the largest integer $x$ for which $f(x) < 0$.", 1, ans.int(hi), [`The largest integer less than $${sf(r2)}$ is $${hi}$.`])] };
    } });

  // ---------------- 2.8 ----------------
  reg({ type: "fn-rational-asymptotes-intercepts", syllabus: ["2.8"], unknown: "va-from-equation", representation: "equation", format: "value", levels: [1],
    skills: ["SL2.8.asymptotes", "SL2.8.transformed-reciprocal"], title: "Asymptotes of a shifted reciprocal",
    build({ rng }) {
      const a = rng.int(1, 9), h = rng.nonzero(-8, 8), k = rng.nonzero(-8, 8);
      return { params: { a, h, k }, stem: `The function $f$ is defined by $f(x) = \\dfrac{${a}}{${lin(1, -h)}} ${signed(k)}$, for $x \\ne ${h}$.`, parts: [
        P("The graph of $f$ has a vertical asymptote $x = p$. Write down the value of $p$.", 1, ans.int(h), [`The denominator is zero when $x = ${h}$, so $p = ${h}$.`]),
        P("The graph of $f$ has a horizontal asymptote $y = q$. Write down the value of $q$.", 1, ans.int(k), [`As $x$ becomes very large the fraction approaches $0$, so $f(x)$ approaches $${k}$ and $q = ${k}$.`])] };
    } });
  reg({ ...CALC, type: "fn-ext-rational-model", syllabus: ["2.8"], unknown: "least-n-for-target", representation: "words", format: "value", levels: [4],
    skills: ["SL2.8.rational-model", "SL2.8.asymptotes"], title: "Average cost model: a value, the long-run value and a least number",
    build({ rng }) {
      let v, F, n0, T, nMin;
      do { v = rng.pick([1.8, 2.4, 3.6, 4.5]); F = rng.pick([650, 850, 1200, 1500, 2300]); n0 = rng.pick([75, 120, 250, 400]); T = v + rng.pick([0.35, 0.6, 0.85, 1.25]); nMin = Math.floor(F / (T - v) + 1e-9) + 1; }
      while (Math.abs(F / (T - v) - Math.round(F / (T - v))) < 1e-6);
      const C0 = v + F / n0;
      return { params: { v, F, n0, T }, stem: `A workshop makes $n$ chairs in a month. The average cost of making one chair, in euros, is modelled by $C(n) = ${num(v)} + \\dfrac{${num(F)}}{n}$, for $n \\ge 1$.`,
        parts: [
          P(`Find $C(${n0})$.`, 2, ans.sf(C0), [`$C(${n0}) = ${num(v)} + \\dfrac{${num(F)}}{${n0}} = ${num(v)} + ${more(F / n0)}$`, `$C(${n0}) = ${sf(C0)}$ (to three significant figures)`]),
          P("As $n$ becomes very large, $C(n)$ approaches the value $q$. Write down the value of $q$.", 1, ans.dec(v), [`As $n$ becomes very large, $\\dfrac{${num(F)}}{n}$ approaches $0$, so $q = ${num(v)}$ (the horizontal asymptote).`]),
          P(`Find the least number of chairs for which the average cost is less than $${num(T)}$ euros.`, 3, ans.int(nMin), [`$${num(v)} + \\dfrac{${num(F)}}{n} < ${num(T)}$, so $\\dfrac{${num(F)}}{n} < ${num(T - v)}$`, `$n > \\dfrac{${num(F)}}{${num(T - v)}} = ${more(F / (T - v))}$`, `$n$ is a whole number, so the least value is $${num(nMin)}$.`])] };
    } });

  // ---------------- 2.9 ----------------
  reg({ type: "fn-exp-log-inverse-composite", syllabus: ["2.9"], unknown: "evaluate-log-function", representation: "equation", format: "value", levels: [1],
    skills: ["SL2.9.exp-log-inverse", "SL2.9.log-graph"], title: "A value of a log function and of its inverse",
    build({ rng }) {
      const b = rng.pick([2, 3, 5, 10]), n = rng.int(2, b === 2 ? 6 : b === 3 ? 4 : 3), mm = rng.int(2, b === 2 ? 5 : 3);
      return { params: { b, x: Math.pow(b, n), mm }, stem: `The function $f$ is defined by $f(x) = \\log_{${b}} x$, for $x > 0$.`, parts: [
        P(`Find $f(${num(Math.pow(b, n))})$.`, 1, ans.int(n), [`$${num(Math.pow(b, n))} = ${b}^{${n}}$, so $f(${num(Math.pow(b, n))}) = ${n}$.`]),
        P(`Find $f^{-1}(${mm})$.`, 1, ans.int(Math.pow(b, mm)), [`The inverse of $\\log_{${b}} x$ is $${b}^{x}$, so $f^{-1}(${mm}) = ${b}^{${mm}} = ${num(Math.pow(b, mm))}$.`])] };
    } });

  // ---------------- 2.10 ----------------
  reg({ type: "fn-curve-intersection-quadratic", syllabus: ["2.10"], unknown: "meeting-x", representation: "graph", format: "value", levels: [1],
    skills: ["SL2.10.number-of-solutions", "SL2.10.solve-gdc"], title: "Solutions of an equation read from two graphs",
    build({ rng }) {
      let r1, r2, mm, d, a, ok;
      const mk = () => { const f = (x) => a * (x - r1) * (x - r2) + mm * x + d; return { f, vx: (r1 + r2) / 2 - mm / (2 * a) }; };
      do {
        a = rng.sign(); r1 = rng.int(-4, 1); r2 = r1 + rng.int(2, 5); mm = rng.pick([-2, -1, 1, 2, 0.5, -0.5]); d = rng.int(-3, 3);
        const { f, vx } = mk();
        ok = r2 <= 4 && Math.abs(mm * r1 + d) <= 6 && Math.abs(mm * r2 + d) <= 6 && Math.abs(f(vx)) <= 7 && Number.isInteger(mm * r1 + d) && Number.isInteger(mm * r2 + d);
      } while (!ok);
      const y1 = mm * r1 + d, y2 = mm * r2 + d;
      return { params: { r1, r2 },
        graph: win([-6, 6], [-8, 8], { functions: [{ fn: { type: "poly", coeffs: [a * r1 * r2 + d, mm - a * (r1 + r2), a] }, label: "f" }, { fn: { type: "poly", coeffs: [d, mm] }, label: "g" }],
          points: [{ x: r1, y: y1 }, { x: r2, y: y2 }], alt: "A parabola f and a straight line g crossing at two marked points" }),
        stem: "The graphs of a quadratic function $f$ and a linear function $g$ are shown. They cross at two marked points, which have integer coordinates.",
        parts: [
          P("Write down the smaller solution of the equation $f(x) = g(x)$.", 1, ans.int(r1), [`The solutions of $f(x) = g(x)$ are the $x$-coordinates of the points where the graphs cross: $${point(r1, y1)}$ and $${point(r2, y2)}$.`, `The smaller solution is $x = ${r1}$.`]),
          P("Write down the larger solution.", 1, ans.int(r2), [`The larger solution is $x = ${r2}$.`])] };
    } });
  reg({ ...CALC, type: "fn-gdc-optimise-combined", syllabus: ["2.10"], unknown: "first-whole-day", representation: "words", format: "value", levels: [4],
    skills: ["SL2.10.context-apply", "SL2.10.solve-gdc", "SL2.4.max-min"], title: "When one model overtakes another, and the greatest gap",
    build({ rng }) {
      let a, b, c, d, tc, tg;
      const gap = (t) => c + d * t - a * Math.pow(b, t);
      do {
        a = rng.pick([8, 10, 12, 15]); b = rng.pick([1.06, 1.08, 1.09, 1.12]); c = rng.pick([25, 30, 36, 40]); d = rng.pick([1.5, 2, 2.5, 3]);
        tg = Math.log(d / (a * Math.log(b))) / Math.log(b); tc = tg > 1 ? solve(gap, tg, 400) : 0;
      } while (!(tg > 2 && tc < 60 && Math.abs(tc - Math.round(tc)) > 0.02));
      return { params: { a, b, c, d },
        graph: { x: [0, Math.ceil(tc / 10) * 10 + 10], y: [0, Math.ceil((c + d * tc) / 20) * 20 + 40], xLabel: "t",
          functions: [{ fn: { type: "exp", a, b }, label: "A" }, { fn: { type: "poly", coeffs: [c, d] }, label: "B" }], alt: "An exponential curve A that starts below a straight line B and later crosses above it" },
        stem: `Two streaming services are launched at the same time. After $t$ months, the numbers of subscribers, in thousands, are modelled by $A(t) = ${a} \\times ${num(b)}^{t}$ and $B(t) = ${lin(d, c, "t")}$, for $t \\ge 0$.`,
        parts: [
          P("Find the value of $t$ for which the two services have the same number of subscribers.", 3, ans.sf(tc), ["Graph $y = A(t)$ and $y = B(t)$ on a calculator.", "Use the intersection tool to find where the graphs cross.", `$t = ${sf(tc)}$`]),
          P("Write down the first whole number of months after which service A has more subscribers than service B.", 1, ans.int(Math.ceil(tc)), [`$A(t) > B(t)$ for $t > ${sf(tc)}$, so the first whole number of months is $${Math.ceil(tc)}$.`]),
          P("Find the greatest number of subscribers, in thousands, by which service B is ahead of service A.", 3, ans.sf(gap(tg)), [`The lead of B is $D(t) = B(t) - A(t) = ${lin(d, c, "t")} - ${a} \\times ${num(b)}^{t}$.`, `Graph $D$ and use the maximum tool: the maximum is at $t = ${sf(tg)}$.`, `The greatest lead is $${sf(gap(tg))}$ thousand.`])] };
    } });

  // ---------------- 2.11 ----------------
  const TD = { type: "fn-transform-describe", syllabus: ["2.11"] };
  reg({ ...TD, unknown: "describe-translation", representation: "equation", format: "value", levels: [1],
    skills: ["SL2.11.translate", "SL2.11.describe"], title: "Translation vector from a rule",
    build({ rng }) {
      const h = rng.nonzero(-8, 8), k = rng.nonzero(-8, 8);
      return { params: { h, k }, stem: `The function $g$ is defined by $g(x) = f(${lin(1, -h)}) ${signed(k)}$. The graph of $g$ is obtained from the graph of $f$ by a translation by the vector $\\begin{pmatrix} p \\\\ q \\end{pmatrix}$.`, parts: [
        P("Write down the value of $p$.", 1, ans.int(h), [`Replacing $x$ by $${lin(1, -h)}$ moves the graph $${Math.abs(h)}$ ${units(h)} to the ${h > 0 ? "right" : "left"}, so $p = ${h}$.`]),
        P("Write down the value of $q$.", 1, ans.int(k), [`${k > 0 ? "Adding" : "Subtracting"} $${Math.abs(k)}$ moves the graph $${Math.abs(k)}$ ${units(k)} ${k > 0 ? "up" : "down"}, so $q = ${k}$.`])] };
    } });
  reg({ ...TA, ...CALC, syllabus: ["2.11", "2.4"], unknown: "image-point", representation: "equation", format: "value", levels: [4],
    skills: ["SL2.11.image-point", "SL2.11.composite-transform", "SL2.4.max-min"], title: "A maximum point found with technology, and its image",
    build({ rng }) {
      const a = rng.pick([2, 4, 5, 7, 8]), s = rng.pick([2, 3, 0.5, 1.5]), h = rng.pick([-2.5, -1.5, 0.8, 1.5, 2.5]), k = rng.pick([-3, -1.2, 0.7, 2, 4.5]);
      const xm = -Math.sqrt(a / 3), ym = xm * xm * xm - a * xm;
      return { params: { a, s, h, k },
        stem: `The function $f$ is defined by $f(x) = ${poly([1, 0, -a, 0])}$, for $x \\in \\mathbb{R}$. The graph of $f$ has a local maximum point at $\\mathrm{A}$. The function $g$ is defined by $g(x) = ${gRule(s, h, k)}$, and $\\mathrm{A}$ is mapped to the point $\\mathrm{B}$ on the graph of $g$.`,
        parts: [
          P("Find the $x$-coordinate of $\\mathrm{A}$.", 2, ans.sf(xm), ["Graph $f$ on a calculator and use its maximum tool.", `$x = ${sf(xm)}$`]),
          P("Find the $y$-coordinate of $\\mathrm{A}$.", 1, ans.sf(ym), [`The maximum tool gives $y = ${sf(ym)}$.`]),
          P("Find the $x$-coordinate of $\\mathrm{B}$.", 1, ans.sf(xm + h), [`Replacing $x$ by $${lin(1, -h)}$ moves the graph $${num(Math.abs(h))}$ units to the ${h > 0 ? "right" : "left"}: $x = ${more(xm)} ${signed(h)} = ${sf(xm + h)}$`]),
          P("Find the $y$-coordinate of $\\mathrm{B}$.", 2, ans.sf(s * ym + k), [`The $y$-coordinate is multiplied by $${num(s)}$ and then $${num(Math.abs(k))}$ is ${k > 0 ? "added" : "subtracted"}.`, `$y = ${num(s)}(${more(ym)}) ${signed(k)} = ${sf(s * ym + k)}$`])] };
    } });

  // ---------------- exam types that had no generator, and second ways of asking ----------------
  const SFF = { type: "fn-sketch-from-features" };
  const parab = (a, p, q) => ({ value: [a, p, q], graph: win([-6, 6], [-10, 10], { yStep: 2, functions: [{ fn: { type: "poly", coeffs: [a * p * q, -a * (p + q), a] } }], alt: "A parabola" }) });
  reg({ ...SFF, syllabus: ["2.3", "2.4"], unknown: "sketch-from-conditions", representation: "words", format: "graph-pick", levels: [2],
    skills: ["SL2.3.sketch-from-info", "SL2.4.zeros-intercepts", "SL2.4.symmetry"], title: "Pick the graph that has the stated features",
    build({ rng }) {
      let p, q, a;
      do { p = rng.int(-4, 2); q = p + 2 * rng.int(1, 2); a = rng.sign(); } while (p + q === 0 || q > 4 || p * q === 0);
      const wrongs = G.pickDistinct(parab(a, p, q).graph, [
        Object.assign(parab(-a, p, q), { why: `This graph has a ${a > 0 ? "maximum" : "minimum"} point, not a ${a > 0 ? "minimum" : "maximum"} point.` }),
        Object.assign(parab(a, -q, -p), { why: "The zeros have the wrong signs." }),
        Object.assign(parab(-a, -q, -p), { why: "The zeros have the wrong signs and the turning point is the wrong kind." }),
        parab(a, p + 1, q + 1), parab(a, p - 1, q - 1)], 3);
      return { params: { a, p, q }, stem: `A function $f$ has zeros at $x = ${p}$ and $x = ${q}$. Its graph has a ${a > 0 ? "minimum" : "maximum"} point and crosses the $y$-axis at $${point(0, a * p * q)}$.`,
        parts: [
          P("Which graph could be the graph of $f$?", 2, ans.graph(rng, parab(a, p, q), wrongs), [
            `The graph crosses the $x$-axis at $${p}$ and $${q}$ and the $y$-axis at $${a * p * q}$.`, `It has a ${a > 0 ? "minimum point, so it opens upwards" : "maximum point, so it opens downwards"}.`]),
          P("The graph is symmetric about the line $x = h$. Find the value of $h$.", 1, ans.int((p + q) / 2), [`The line of symmetry is midway between the zeros: $h = \\dfrac{${p} + ${paren(q)}}{2} = ${(p + q) / 2}$`])] };
    } });
  reg({ ...SFF, syllabus: ["2.6", "2.3"], unknown: "sketch-quadratic", representation: "equation", format: "graph-pick", levels: [2],
    skills: ["SL2.6.sketch", "SL2.6.vertex", "SL2.3.sketch-from-info"], title: "Pick the graph of a quadratic in vertex form",
    build({ rng }) {
      let a, h, k;
      do { a = rng.pick([1, -1, 2, -2]); h = rng.nonzero(-3, 3); k = rng.nonzero(-6, 6); } while (h === k || Math.abs(a * h * h + k) > 30);
      const gr = (a2, h2, k2) => ({ value: [a2, h2, k2], graph: win([-6, 6], [-10, 10], { yStep: 2, functions: [{ fn: { type: "poly", coeffs: [a2 * h2 * h2 + k2, -2 * a2 * h2, a2] } }], alt: "A parabola" }) });
      const wrongs = G.pickDistinct(gr(a, h, k).graph, [
        Object.assign(gr(a, -h, k), { why: "The vertex is on the wrong side of the $y$-axis: $(x - h)^{2}$ puts the vertex at $x = h$." }),
        Object.assign(gr(-a, h, k), { why: "The parabola opens the wrong way: check the sign of the coefficient of the bracket." }),
        Object.assign(gr(a, h, -k), { why: "The $y$-coordinate of the vertex has the wrong sign." }),
        Object.assign(gr(a, k, h), { why: "The coordinates of the vertex have been swapped." }), gr(-a, -h, k)], 3);
      return { params: { a, h, k }, stem: `Consider the function $f(x) = ${coef(a, `${factor(h)}^{2}`)} ${signed(k)}$.`, parts: [
        P("Which graph shows $y = f(x)$?", 2, ans.graph(rng, gr(a, h, k), wrongs), [`The vertex is $${point(h, k)}$.`, `The coefficient of the bracket is ${a > 0 ? "positive, so the parabola opens upwards" : "negative, so the parabola opens downwards"}.`]),
        P("Find the $y$-intercept of the graph of $f$.", 1, ans.int(a * h * h + k), [`$f(0) = ${coef(a, `${br(-h)}^{2}`)} ${signed(k)} = ${a * h * h} ${signed(k)} = ${a * h * h + k}$`])] };
    } });
  reg({ ...CALC, type: "fn-gdc-optimise-combined", syllabus: ["2.3", "2.4"], unknown: "max-difference", representation: "equation", format: "value", levels: [4],
    skills: ["SL2.3.sum-difference", "SL2.4.max-min", "SL2.4.intersection"], title: "Greatest vertical distance between two graphs",
    build({ rng }) {
      const a = rng.pick([3, 4, 5, 6]), b = rng.pick([4, 5, 6, 8]);
      const dd = (x) => a * Math.log(x + 1) - (x * x) / b, xm = (-1 + Math.sqrt(1 + 2 * a * b)) / 2, xr = solve(dd, xm, 60);
      return { params: { a, b },
        graph: { x: [-1, Math.ceil(xr) + 2], y: [-2, Math.ceil(a * Math.log(xr + 1)) + 3], functions: [{ fn: { type: "log", a, h: -1 }, domain: [0, Math.ceil(xr) + 2], label: "f" }, { fn: { type: "poly", coeffs: [0, 0, 1 / b] }, domain: [0, Math.ceil(xr) + 2], label: "g" }],
          regions: [{ x: [0, xr], fn: 0, to: 1 }], points: [{ x: xr, y: (xr * xr) / b, label: "A" }], alt: "A logarithmic curve f and a parabola g that meet at the origin and at A, with the region between them shaded" },
        stem: `Let $f(x) = ${a}\\ln(x + 1)$ and $g(x) = \\dfrac{x^{2}}{${b}}$, for $x \\ge 0$. The graphs of $f$ and $g$ meet at the origin and at the point $\\mathrm{A}$. The region enclosed by the two graphs is shaded in the diagram.`,
        parts: [
          P("Find the $x$-coordinate of $\\mathrm{A}$.", 2, ans.sf(xr), ["Graph both functions on a calculator and use its intersection tool.", `$x = ${sf(xr)}$`]),
          P("Between the origin and $\\mathrm{A}$, the vertical distance between the graphs is $d(x) = f(x) - g(x)$. Find the value of $x$ at which $d$ is greatest.", 2, ans.sf(xm), [`Graph $d(x) = ${a}\\ln(x + 1) - \\dfrac{x^{2}}{${b}}$ and use the maximum tool.`, `$x = ${sf(xm)}$`]),
          P("Find the greatest vertical distance between the two graphs in the shaded region.", 2, ans.sf(dd(xm)), [`The maximum tool gives $d = ${more(dd(xm))}\\ldots$`, `The greatest distance is $${sf(dd(xm))}$.`])] };
    } });
  const LQ = { type: "fn-log-of-quadratic", syllabus: ["2.9", "2.7"] };
  const lqSit = (rng) => { const [b, w, u, mm] = rng.pick([[2, 3, 1, 3], [2, 5, 3, 4], [2, 6, 2, 5], [3, 5, 4, 2], [3, 6, 3, 3]]); let h; do { h = rng.nonzero(-5, 5); } while (Math.abs(h) === w); return { b, w, u, mm, h }; };
  const lqStem = (s) => `The function $f$ is defined by $f(x) = \\log_{${s.b}}\\left(${poly([-1, 2 * s.h, s.w * s.w - s.h * s.h])}\\right)$, for the values of $x$ that make the bracket positive.`;
  const lqFactor = (s) => `$${poly([-1, 2 * s.h, s.w * s.w - s.h * s.h])} = -${factor(s.h - s.w)}${factor(s.h + s.w)}$`;
  reg({ ...LQ, syllabus: ["2.7", "2.9"], unknown: "domain-from-inequality", representation: "equation", format: "value", levels: [3],
    skills: ["SL2.7.inequality", "SL2.9.log-graph", "SL1.5.exp-log-form"], title: "Domain of a log of a quadratic, then an equation", situationKey: "log-quadratic", situation: lqSit,
    build({ sit: s }) {
      const p = s.h - s.w, q = s.h + s.w, t = Math.pow(s.b, s.mm), c = s.w * s.w - s.h * s.h;
      return { stem: lqStem(s) + " The domain of $f$ is $p < x < q$.", parts: [
        P("Find the value of $p$.", 2, ans.int(p), [lqFactor(s), `The bracket is positive between its zeros, $x = ${p}$ and $x = ${q}$, because the coefficient of $x^{2}$ is negative. So $p = ${p}$.`]),
        P("Write down the value of $q$.", 1, ans.int(q), [`The larger zero is $q = ${q}$.`]),
        P(`Find the smaller solution of $f(x) = ${s.mm}$.`, 2, ans.int(s.h - s.u), [`$${poly([-1, 2 * s.h, c])} = ${s.b}^{${s.mm}} = ${t}$, so $${poly([1, -2 * s.h, t - c])} = 0$`, `$${factor(s.h - s.u)}${factor(s.h + s.u)} = 0$, so $x = ${s.h - s.u}$ or $x = ${s.h + s.u}$; the smaller is $${s.h - s.u}$.`]),
        P("Write down the larger solution.", 1, ans.int(s.h + s.u), [`The larger solution is $x = ${s.h + s.u}$. Both solutions lie in the domain.`])] };
    } });
  reg({ ...LQ, unknown: "asymptotes", representation: "equation", format: "value", levels: [2],
    skills: ["SL2.9.log-graph", "SL2.4.asymptotes", "SL2.6.axis-symmetry"], title: "Asymptotes and axis of symmetry of a log of a quadratic", situationKey: "log-quadratic", situation: lqSit,
    build({ sit: s }) {
      const p = s.h - s.w, q = s.h + s.w;
      return { stem: lqStem(s) + " The graph of $f$ has two vertical asymptotes.", parts: [
        P("The left-hand asymptote is $x = p$. Find the value of $p$.", 2, ans.int(p), [lqFactor(s), `The graph has a vertical asymptote where the bracket is zero: $x = ${p}$ and $x = ${q}$. So $p = ${p}$.`]),
        P("Write down the equation of the other asymptote in the form $x = q$, giving the value of $q$.", 1, ans.int(q), [`$q = ${q}$`]),
        P("The graph of $f$ is symmetric about the line $x = h$. Find the value of $h$.", 1, ans.int(s.h), [`The line of symmetry is midway between the asymptotes: $h = \\dfrac{${p} + ${paren(q)}}{2} = ${s.h}$`])] };
    } });
  reg({ type: "fn-quadratic-from-conditions", syllabus: ["2.6"], unknown: "a-from-vertex-and-point", representation: "words", format: "value", levels: [3],
    skills: ["SL2.6.find-equation", "SL2.6.vertex", "SL2.7.solve-equation"], title: "Quadratic from its vertex and a point, then its intercepts",
    build({ rng }) {
      let a, h, s0, dx;
      do { a = rat.Q(rng.sign() * rng.pick([1, 2, 1, 3]), rng.pick([1, 1, 2])); h = rng.nonzero(-4, 4); s0 = rng.int(1, 4); dx = rng.pick([-4, -2, 2, 4, 6]); }
      while (Math.abs(dx) === s0 || h + dx === 0 || !Number.isInteger(rat.num(a) * s0 * s0) || !Number.isInteger(rat.num(a) * h * h));
      const av = rat.num(a), k = -av * s0 * s0, x1 = h + dx, y1 = k + av * dx * dx, yi = av * h * h + k;
      return { params: { h, k, x1, y1 }, stem: `The graph of a quadratic function $f$ has its vertex at $${point(h, k)}$ and passes through the point $${point(x1, y1)}$. The function can be written as $f(x) = a(x - h)^{2} + k$.`, parts: [
        P("Find the value of $a$.", 3, ans.frac(a.n, a.d), [`The vertex gives $f(x) = a${factor(h)}^{2} ${signed(k)}$.`, `Substitute $${point(x1, y1)}$: $${y1} = a${br(dx)}^{2} ${signed(k)}$, so $${dx * dx}a = ${y1 - k}$`, `$a = ${rat.tex(a)}$`]),
        P("Find the $y$-intercept of the graph of $f$.", 1, ans.int(yi), [`$f(0) = ${coef(a, `${br(-h)}^{2}`)} ${signed(k)} = ${yi}$`]),
        P("Find the larger zero of $f$.", 2, ans.int(h + s0), [`$${coef(a, `${factor(h)}^{2}`)} = ${-k}$, so $${factor(h)}^{2} = ${s0 * s0}$`,`$x = ${h} \\pm ${s0}$; the larger zero is $x = ${h + s0}$.`])] };
    } });
  reg({ type: "fn-rational-sketch", syllabus: ["2.8"], unknown: "equation-from-sketch", representation: "graph", format: "value", levels: [3],
    skills: ["SL2.8.transformed-reciprocal", "SL2.8.asymptotes", "SL2.8.sketch-rational"], title: "Equation of a shifted reciprocal from its graph",
    build({ rng }) {
      let a, h, k;
      do { a = rng.pick([1, 2, 3, 4, -1, -2, -3, -4]); h = rng.nonzero(-3, 3); k = rng.nonzero(-3, 3); } while (Math.abs(k + a) > 5 || k + a === 0 || a === h * k);
      const x0 = rat.sub(h, rat.Q(a, k));
      return { params: { h, k },
        graph: win([-6, 6], [-6, 6], { functions: [{ fn: { type: "rational", num: [a - k * h, k], den: [-h, 1] }, label: "f" }], asymptotes: [{ x: h }, { y: k }], points: [{ x: h + 1, y: k + a, label: "A" }], alt: "A curve in two branches with a vertical and a horizontal dashed asymptote and a marked point A" }),
        stem: "The graph of $f(x) = \\dfrac{a}{x - h} + k$ is shown, with its asymptotes dashed. The asymptotes cross the axes at integers, and the marked point $\\mathrm{A}$ on the graph has integer coordinates.",
        parts: [
          P("Write down the value of $h$.", 1, ans.int(h), [`The vertical asymptote is $x = ${h}$, so $h = ${h}$.`]),
          P("Write down the value of $k$.", 1, ans.int(k), [`The horizontal asymptote is $y = ${k}$, so $k = ${k}$.`]),
          P("Find the value of $a$.", 2, ans.int(a), [`$\\mathrm{A}$ is the point $${point(h + 1, k + a)}$: $${k + a} = \\dfrac{a}{${h + 1} - ${paren(h)}} ${signed(k)}$`, `$a = ${k + a} - ${paren(k)} = ${a}$`]),
          P("Find the $x$-intercept of the graph of $f$.", 2, ans.frac(x0.n, x0.d), [`$\\dfrac{${a}}{${lin(1, -h)}} ${signed(k)} = 0$, so $${lin(1, -h)} = ${frac(a, -k)}$`, `$x = ${rat.tex(x0)}$`])] };
    } });
  reg({ ...CALC, type: "fn-gdc-features", syllabus: ["2.4"], unknown: "zeros-gdc", representation: "equation", format: "value", levels: [2],
    skills: ["SL2.4.zeros-intercepts", "SL2.4.max-min"], title: "Zeros and a minimum of a cubic with technology",
    build({ rng }) {
      const a = rng.pick([3, 4, 5]), b = rng.pick([1, 2, 3]), f = (x) => x * x * x - a * x * x + b;
      const z1 = solve(f, -3, 0), z3 = solve(f, (2 * a) / 3, a + 1), low = f((2 * a) / 3);
      return { params: { a, b }, stem: `The function $f$ is defined by $f(x) = ${poly([1, -a, 0, b])}$, for $x \\in \\mathbb{R}$. The graph of $f$ crosses the $x$-axis three times.`, parts: [
        P("Find the smallest zero of $f$.", 2, ans.sf(z1), ["Graph $f$ on a calculator and use its zero (root) tool.", `The left-hand zero is $x = ${sf(z1)}$.`]),
        P("Find the largest zero of $f$.", 1, ans.sf(z3), [`The right-hand zero is $x = ${sf(z3)}$.`]),
        P("Find the $y$-coordinate of the local minimum point of the graph.", 1, ans.sf(low), [`The minimum tool gives the point $${point(sf((2 * a) / 3), sf(low))}$, so $y = ${sf(low)}$.`])] };
    } });
  reg({ ...CALC, type: "fn-gdc-intersection", syllabus: ["2.4"], unknown: "solve-f-equals-g", representation: "equation", format: "value", levels: [2],
    skills: ["SL2.4.intersection"], title: "Where a parabola meets an exponential curve",
    build({ rng }) {
      const c = rng.int(3, 8), b = rng.pick([2, 3]), dd = (x) => c - x * x - Math.pow(b, x);
      const x1 = solve(dd, -4, 0), x2 = solve(dd, 0, 4);
      return { params: { c, b },
        graph: win([-4, 4], [-2, 10], { functions: [{ fn: { type: "poly", coeffs: [c, 0, -1] }, label: "f" }, { fn: { type: "exp", b }, label: "g" }], alt: "A parabola f opening downwards and an exponential curve g that cross twice" }),
        stem: `Let $f(x) = ${poly([-1, 0, c])}$ and $g(x) = ${b}^{x}$. The graphs of $f$ and $g$ intersect at two points.`, parts: [
          P("Find the $x$-coordinate of the left-hand point of intersection.", 2, ans.sf(x1), ["Graph both functions on a calculator and use its intersection tool.", `$x = ${sf(x1)}$`]),
          P("Find the $x$-coordinate of the right-hand point of intersection.", 1, ans.sf(x2), [`The second intersection is at $x = ${sf(x2)}$.`]),
          P("Find the $y$-coordinate of the right-hand point of intersection.", 1, ans.sf(Math.pow(b, x2)), [`The intersection tool gives $y = ${sf(Math.pow(b, x2))}$.`])] };
    } });
  reg({ ...CALC, type: "fn-gdc-solve-equation", syllabus: ["2.10"], unknown: "count-roots", representation: "equation", format: "value", levels: [4],
    skills: ["SL2.10.solve-gdc", "SL2.10.number-of-solutions"], title: "Solutions of a cubic equation, and when there are three",
    build({ rng }) {
      const a = rng.pick([4, 5, 7, 8, 10]), k0 = rng.int(1, 3), f = (x) => x * x * x - a * x - k0, t = Math.sqrt(a / 3), top = 2 * t * t * t;
      const s1 = solve(f, -6, -t), s3 = solve(f, t, 6);
      return { params: { a, k0 }, stem: `Consider the equation $${poly([1, 0, -a, 0])} = k$, where $k$ is a constant.`, parts: [
        P(`For $k = ${k0}$, find the smallest solution of the equation.`, 2, ans.sf(s1), [`Graph $y = ${poly([1, 0, -a, 0])}$ and $y = ${k0}$ on a calculator and find their intersections.`, `The smallest solution is $x = ${sf(s1)}$.`]),
        P(`For $k = ${k0}$, find the largest solution.`, 1, ans.sf(s3), [`The largest solution is $x = ${sf(s3)}$.`]),
        P("The equation has three distinct solutions when $-m < k < m$. Find the value of $m$.", 3, ans.sf(top), [`A horizontal line $y = k$ crosses the graph of $y = ${poly([1, 0, -a, 0])}$ three times when it lies between the local minimum and the local maximum.`,
          `The maximum tool gives the local maximum point $${point(sf(-t), sf(top))}$, and by symmetry the local minimum value is $${sf(-top)}$.`, `$m = ${sf(top)}$`])] };
    } });
})(typeof globalThis !== "undefined" ? globalThis : this);
