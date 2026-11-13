/* Topic 5 (Calculus) generators. Self-contained: needs only engine.js.
   Each generator's independent verifier is in scripts/engine-checks/topic5.mjs under the same id.
   `source` names the old practice template a generator was ported from. */
(function (root) {
  "use strict";
  const E = root.QBEngine;
  const { ans, fmt } = E;
  const { num, frac, poly, lin, signed, br, paren, expr, m, coef, rat, factor, point, unit } = fmt;
  const P = (prompt, marks, answer, working) => ({ prompt, marks, answer, working });
  const reg = (def) => E.register(Object.assign({ courses: ["aa-sl"], calculator: false }, def));
  const D = "\\dfrac{\\mathrm{d}y}{\\mathrm{d}x}";
  const dx = "\\,\\mathrm{d}x";
  const polyOpt = (cs, why) => ({ text: m(`f'(x) = ${poly(cs)}`), value: cs, why });

  // ======================= 5.2 increasing and decreasing =======================
  reg({ type: "t5-increasing-decreasing", syllabus: ["5.2"], representation: "equation", format: "mcq", unknown: "interval-from-equation", levels: [2],
    skills: ["SL5.2.increasing-decreasing-intervals"], title: "Where a function is decreasing, from its derivative", source: "increasing-decreasing-intervals",
    build({ rng }) {
      let a, b;
      do { a = rng.int(-5, 2); b = a + rng.int(2, 6); } while (a * b === 0);
      const dec = rng.bool();
      const inside = `$${a} < x < ${b}$`, outside = `$x < ${a}$ or $x > ${b}$`;
      return { params: { a, b, dec }, stem: `The derivative of a function $f$ is $f'(x) = ${factor(a)}${factor(b)}$.`, parts: [
        P("The graph of $f$ has two stationary points. Write down the smaller of their $x$-coordinates.", 1, ans.int(a), [`Stationary points have $f'(x) = 0$, so $x = ${a}$ or $x = ${b}$. The smaller is $${a}$.`]),
        P("Write down the larger of their $x$-coordinates.", 1, ans.int(b), [`The larger is $x = ${b}$.`]),
        P(`For which values of $x$ is $f$ ${dec ? "decreasing" : "increasing"}?`, 2, ans.choice(rng, { text: dec ? inside : outside, value: [dec ? "in" : "out", a, b] }, [
          { text: dec ? outside : inside, value: [dec ? "out" : "in", a, b], why: "$f$ is increasing where $f'(x) > 0$ and decreasing where $f'(x) < 0$." },
          { text: `$x < ${a}$`, value: ["below", a, b], why: "Check the sign of $f'(x)$ on both sides of each stationary point." },
          { text: `$x > ${b}$`, value: ["above", a, b], why: "Check the sign of $f'(x)$ on both sides of each stationary point." }]), [
          `$f'(x)$ is a quadratic with a positive coefficient of $x^{2}$, so it is negative between its zeros and positive outside them.`,
          `$f$ is ${dec ? "decreasing where $f'(x) < 0$" : "increasing where $f'(x) > 0$"}: ${dec ? inside : outside}.`])] };
    } });

  // ======================= 5.3 differentiating polynomials =======================
  reg({ type: "t5-differentiate-polynomial", syllabus: ["5.3"], representation: "equation", format: "mcq", unknown: "gradient-at-point", levels: [2],
    skills: ["SL5.3.power-rule", "SL5.3.gradient-at-point"], title: "Differentiate a polynomial and evaluate the derivative", source: "differentiate-polynomial-integer",
    build({ rng }) {
      const a = rng.pick([2, 3, -2, 1, -1]), b = rng.pick([4, -5, 6, 2, -3]), c = rng.nonzero(-6, 6), x = rng.pick([1, 2, -1, -2]);
      const d = [4 * a, 3 * b, 0, c], v = 4 * a * x * x * x + 3 * b * x * x + c;
      return { params: { a, b, c, x }, stem: `Let $f(x) = ${poly([a, b, 0, c, 0])}$.`, parts: [
        P("Which expression is $f'(x)$?", 2, ans.choice(rng, polyOpt(d), [
          polyOpt([a, b, 0, c], "Each term must also be multiplied by its power."), polyOpt([4 * a, 3 * b, 0, c, 0], "The powers have not been reduced by one."),
          polyOpt([4 * a, 3 * b, 0, 0], "The derivative of the term in $x$ is its coefficient, not zero."), polyOpt([3 * a, 2 * b, 0, c])]), [
          `Use $\\dfrac{\\mathrm{d}}{\\mathrm{d}x}\\left(x^{n}\\right) = nx^{n-1}$ on each term.`, `$f'(x) = ${poly(d)}$`]),
        P(`Find $f'(${x})$.`, 2, ans.int(v), [`$f'(${x}) = ${expr([[4 * a, `${br(x)}^{3}`], [3 * b, `${br(x)}^{2}`], [c, ""]])}$`, `$f'(${x}) = ${v}$`])] };
    } });

  // ======================= 5.4 tangents and normals =======================
  const TN = { type: "t5-tangent-normal-equation", syllabus: ["5.4"], representation: "equation", format: "value" };
  reg({ ...TN, syllabus: ["5.4", "5.6"], unknown: "tangent-at-point", levels: [3], skills: ["SL5.4.tangent-equation", "SL5.6.chain-rule"], title: "Chain rule, then the tangent at a point", source: "differentiate-sp/chain rule tangent",
    build({ rng }) {
      let a, b, n, x, y, mm;
      do { a = rng.pick([2, 3]); b = rng.pick([1, 4, -2, -1, -3, -5]); n = rng.pick([2, 3]); x = rng.pick([1, 2]); y = Math.pow(a * x + b, n); mm = n * a * Math.pow(a * x + b, n - 1); } while (a * x + b === 0 || Math.abs(y) > 400);
      const c = y - mm * x, inner = lin(a, b);
      return { params: { a, b, n, x }, stem: `The curve $C$ has equation $y = \\left(${inner}\\right)^{${n}}$. The point $\\mathrm{A}$ on $C$ has $x$-coordinate $${x}$.`, parts: [
        P("Find the gradient of $C$ at $\\mathrm{A}$.", 3, ans.int(mm), [
          `By the chain rule, $${D} = ${n}\\left(${inner}\\right)${n === 2 ? "" : `^{${n - 1}}`} \\times ${a} = ${n * a}\\left(${inner}\\right)${n === 2 ? "" : `^{${n - 1}}`}$`,
          `At $x = ${x}$: $${D} = ${n * a}${br(a * x + b)}${n === 2 ? "" : `^{${n - 1}}`} = ${mm}$`]),
        P("The tangent to $C$ at $\\mathrm{A}$ has equation $y = mx + c$. Find the value of $c$.", 3, ans.int(c), [
          `At $x = ${x}$, $y = ${br(a * x + b)}^{${n}} = ${y}$, so $\\mathrm{A}$ is $${point(x, y)}$.`, `$${y} = ${mm}${br(x)} + c$`, `$c = ${c}$`])] };
    } });
  reg({ ...TN, unknown: "normal-at-point", levels: [3], skills: ["SL5.4.tangent-equation", "SL5.4.normal-equation", "SL5.3.gradient-at-point"], title: "Tangent and normal to a parabola", source: "tangent-normal-line",
    build({ rng }) {
      let a, b, c, x0, mm;
      do { a = rng.pick([1, 2, -1]); b = rng.pick([-4, -2, 3, 1, 5]); c = rng.pick([1, 5, -2, 0, 3]); x0 = rng.pick([1, 2, 3, -1]); mm = 2 * a * x0 + b; } while (mm === 0 || Math.abs(mm) === 1);
      const y0 = a * x0 * x0 + b * x0 + c, tc = y0 - mm * x0;
      return { params: { a, b, c, x0 }, stem: `The curve $C$ has equation $y = ${poly([a, b, c])}$. The point $\\mathrm{A}$ on $C$ has $x$-coordinate $${x0}$.`, parts: [
        P("Find the $y$-coordinate of $\\mathrm{A}$.", 1, ans.int(y0), [`$y = ${expr([[a, `${br(x0)}^{2}`], [b, br(x0)], [c, ""]])} = ${y0}$`]),
        P("Find the gradient of the tangent to $C$ at $\\mathrm{A}$.", 2, ans.int(mm), [`$${D} = ${lin(2 * a, b)}$`, `At $x = ${x0}$, the gradient is $${expr([[2 * a, br(x0)], [b, ""]])} = ${mm}$.`]),
        P("The tangent at $\\mathrm{A}$ has equation $y = mx + c$. Find the value of $c$.", 2, ans.int(tc), [`$${y0} = ${mm}${br(x0)} + c$`, `$c = ${tc}$`]),
        P("Find the gradient of the normal to $C$ at $\\mathrm{A}$.", 2, ans.frac(-1, mm), [`The normal is perpendicular to the tangent, so its gradient is the negative reciprocal of $${mm}$.`, `Gradient of the normal $= ${frac(-1, mm)}$`])] };
    } });

  // ======================= 5.6 differentiation rules =======================
  reg({ type: "t5-differentiation-rules", syllabus: ["5.6"], representation: "equation", format: "mcq", unknown: "product-polys", levels: [3],
    skills: ["SL5.6.product-rule"], title: "Product rule and the derivative at a point", source: "differentiate-sp/product rule",
    build({ rng }) {
      const a = rng.int(2, 5), b = rng.nonzero(-5, 5), k = rng.int(1, 4), x = rng.pick([1, 2, 3, -1]);
      // f(x) = (x^2 + k)(ax + b) = a x^3 + b x^2 + a k x + b k
      const d = [3 * a, 2 * b, a * k], v = 3 * a * x * x + 2 * b * x + a * k;
      const prod = (u, w) => m(`f'(x) = ${u} + ${w}`);
      const right = { text: prod(`2x\\left(${lin(a, b)}\\right)`, `${a}\\left(x^{2} + ${k}\\right)`), value: d };
      return { params: { a, b, k, x }, stem: `Let $f(x) = \\left(x^{2} + ${k}\\right)\\left(${lin(a, b)}\\right)$.`, parts: [
        P("Which expression is $f'(x)$?", 3, ans.choice(rng, right, [
          { text: m(`f'(x) = 2x \\times ${a}`), value: [0, 2 * a, 0], why: "The derivative of a product is not the product of the derivatives." },
          { text: prod(`2x\\left(x^{2} + ${k}\\right)`, `${a}\\left(${lin(a, b)}\\right)`), value: [2, 0, 2 * k + a * a, a * b], why: "Each derivative must multiply the other factor, not its own." },
          { text: m(`f'(x) = 2x\\left(${lin(a, b)}\\right) - ${a}\\left(x^{2} + ${k}\\right)`), value: [a, 2 * b, -a * k], why: "The product rule adds the two terms." },
          { text: prod(`x\\left(${lin(a, b)}\\right)`, `${a}\\left(x^{2} + ${k}\\right)`), value: [2 * a, b, a * k] }]), [
          `Let $u = x^{2} + ${k}$ and $v = ${lin(a, b)}$, so $u' = 2x$ and $v' = ${a}$.`, `$f'(x) = u'v + uv' = 2x\\left(${lin(a, b)}\\right) + ${a}\\left(x^{2} + ${k}\\right)$`]),
        P(`Find $f'(${x})$.`, 2, ans.int(v), [`$f'(${x}) = 2${br(x)}${br(a * x + b)} + ${a}${br(x * x + k)}$`, `$f'(${x}) = ${v}$`])] };
    } });

  // ======================= 5.7 and 5.8 stationary points =======================
  const SP = { type: "t5-stationary-points", syllabus: ["5.8", "5.6"], representation: "equation" };
  reg({ ...SP, format: "mcq", unknown: "stationary-points", levels: [3], skills: ["SL5.8.find-stationary-points", "SL5.3.power-rule"], title: "Stationary points of a cubic", source: "differentiate-sp/C",
    build({ rng }) {
      const k = rng.int(1, 3), c = rng.int(-5, 5), b = -3 * k * k, yMax = 2 * k * k * k + c, yMin = -2 * k * k * k + c;
      return { params: { k, c }, stem: `Let $f(x) = ${poly([1, 0, b, c])}$, for $x \\in \\mathbb{R}$.`, parts: [
        P("Which expression is $f'(x)$?", 2, ans.choice(rng, polyOpt([3, 0, b]), [
          polyOpt([3, 0, b, c], "The derivative of a constant is zero."), polyOpt([1, 0, b], "The power must come down as a multiplier."), polyOpt([3, b, 0], "The term in $x$ differentiates to a constant."), polyOpt([3, 0, 0])]), [
          `$f'(x) = ${poly([3, 0, b])}$`]),
        P("The graph of $f$ has a local maximum point. Find its $x$-coordinate.", 2, ans.int(-k), [
          `$f'(x) = 0$ gives $3x^{2} = ${-b}$, so $x^{2} = ${k * k}$ and $x = \\pm ${k}$.`, `$f''(x) = 6x$ is negative at $x = ${-k}$, so the local maximum is at $x = ${-k}$.`]),
        P("Find the $y$-coordinate of the local maximum point.", 1, ans.int(yMax), [`$f(${-k}) = ${expr([[1, `(${-k})^{3}`], [b, `(${-k})`], [c, ""]])} = ${yMax}$`]),
        P("Find the $y$-coordinate of the local minimum point.", 1, ans.int(yMin), [`The local minimum is at $x = ${k}$: $f(${k}) = ${expr([[1, `${br(k)}^{3}`], [b, br(k)], [c, ""]])} = ${yMin}$`])] };
    } });
  reg({ ...SP, format: "value", unknown: "max-value", levels: [2], skills: ["SL5.8.find-stationary-points", "SL5.3.gradient-at-point"], title: "Stationary point of a quadratic by differentiation", source: "differentiate-sp/Q",
    build({ rng }) {
      const a = rng.pick([1, 2, -1, -2, 3, -3]), h = rng.nonzero(-4, 4), b = -2 * a * h, c = rng.int(-4, 6), y = a * h * h + b * h + c, x1 = h + rng.nonzero(-2, 2);
      return { params: { a, b, c, x1 }, stem: `Let $f(x) = ${poly([a, b, c])}$, for $x \\in \\mathbb{R}$.`, parts: [
        P(`Find $f'(${x1})$.`, 2, ans.int(2 * a * x1 + b), [`$f'(x) = ${lin(2 * a, b)}$`, `$f'(${x1}) = ${expr([[2 * a, br(x1)], [b, ""]])} = ${2 * a * x1 + b}$`]),
        P("Find the $x$-coordinate of the stationary point of the graph of $f$.", 1, ans.int(h), [`$f'(x) = 0$ gives $${coef(2 * a, "x")} = ${-b}$, so $x = ${h}$.`]),
        P("Find the $y$-coordinate of the stationary point.", 1, ans.int(y), [`$f(${h}) = ${expr([[a, `${br(h)}^{2}`], [b, br(h)], [c, ""]])} = ${y}$`])] };
    } });
  reg({ ...SP, syllabus: ["5.7", "5.8"], format: "mcq", unknown: "nature", levels: [3], skills: ["SL5.8.classify-stationary-points", "SL5.7.find-second-derivative", "SL5.8.find-stationary-points"], title: "Classify stationary points with the second derivative", source: "second-derivative-classify",
    build({ rng }) {
      const p = rng.int(1, 4), c = rng.int(-6, 6), s = rng.sign(), x2 = 2 * p, f2 = s * (x2 * x2 * x2 - 3 * p * x2 * x2) + c;
      // f(x) = s(x^3 - 3p x^2) + c: stationary at x = 0 and x = 2p
      const kind = (v) => (v < 0 ? "a local maximum" : "a local minimum");
      return { params: { p, c, s }, stem: `Let $f(x) = ${poly([s, -3 * p * s, 0, c])}$. The graph of $f$ has stationary points at $x = 0$ and at $x = a$, where $a \\ne 0$.`, parts: [
        P("Find the value of $a$.", 2, ans.int(x2), [`$f'(x) = ${poly([3 * s, -6 * p * s, 0])} = ${coef(3 * s, "x")}${factor(x2)}$`, `$f'(x) = 0$ when $x = 0$ or $x = ${x2}$, so $a = ${x2}$.`]),
        P("Find $f''(0)$.", 2, ans.int(-6 * p * s), [`$f''(x) = ${lin(6 * s, -6 * p * s)}$`, `$f''(0) = ${-6 * p * s}$`]),
        P("What does this show about the stationary point at $x = 0$?", 1, ans.choice(rng, { text: `It is ${kind(-6 * p * s)}.`, value: -s }, [
          { text: `It is ${kind(6 * p * s)}.`, value: s, why: "A negative second derivative means a maximum; a positive one means a minimum." },
          { text: "It is a point of inflexion.", value: 0, why: "That would need the second derivative to be zero and to change sign." }, { text: "It is not a stationary point.", value: 9 }]), [
          `$f''(0) ${-6 * p * s < 0 ? "<" : ">"} 0$, so the point is ${kind(-6 * p * s)}.`]),
        P("Find the $y$-coordinate of the stationary point at $x = a$.", 2, ans.int(f2), [`$f(${x2}) = ${expr([[s, `${br(x2)}^{3}`], [-3 * p * s, `${br(x2)}^{2}`], [c, ""]])}$`, `$f(${x2}) = ${f2}$`])] };
    } });
  reg({ type: "t5-optimisation-modelling", syllabus: ["5.8"], representation: "words", format: "value", unknown: "quadratic-optimum", levels: [3],
    skills: ["SL5.8.optimisation-modelling"], title: "Largest rectangle with a fixed perimeter", source: "optimization-rectangle-section-b",
    build({ rng }) {
      const per = rng.pick([40, 48, 60, 72, 36, 52, 84, 100]), half = per / 2, x = rat.Q(half, 2), area = rat.mul(x, x);
      return { params: { per }, stem: `A rectangle has perimeter $${unit(per, "cm")}$. One side has length $${unit("x", "cm")}$ and the area of the rectangle is $A\\text{ cm}^{2}$.`, parts: [
        P(`Show that $A = ${half}x - x^{2}$.`, 2, ans.self(`The other side is $${half} - x$, so $A = x(${half} - x) = ${half}x - x^{2}$.`), [
          `Let the other side be $y$. Then $2x + 2y = ${per}$, so $y = ${half} - x$.`, `$A = xy = x(${half} - x) = ${half}x - x^{2}$`]),
        P("Find the value of $x$ for which the area is greatest.", 2, ans.frac(x.n, x.d), [`$\\dfrac{\\mathrm{d}A}{\\mathrm{d}x} = ${half} - 2x$`, `$${half} - 2x = 0$ gives $x = ${rat.tex(x)}$, and $\\dfrac{\\mathrm{d}^{2}A}{\\mathrm{d}x^{2}} = -2 < 0$, so this is a maximum.`]),
        P("Find the greatest area, in square centimetres.", 2, ans.frac(area.n, area.d), [`$A = ${rat.tex(x)}\\left(${half} - ${rat.tex(x)}\\right) = ${rat.tex(area)}$`])] };
    } });

  // ======================= 5.9 kinematics =======================
  reg({ type: "t5-kinematics-motion", syllabus: ["5.9"], representation: "equation", format: "value", unknown: "acceleration-at-time", levels: [3],
    skills: ["SL5.9.velocity-acceleration", "SL5.9.displacement-from-velocity"], title: "Acceleration and position from a velocity function", source: "kinematics",
    build({ rng }) {
      const a = 3 * rng.int(1, 2), b = 2 * rng.nonzero(-4, 4), c = rng.int(-3, 4), t = rng.int(2, 4), s0 = rng.pick([0, 5, 10, -4]);
      const acc = 2 * a * t + b, st = (a / 3) * t * t * t + (b / 2) * t * t + c * t + s0;
      const sTex = expr([[a / 3, "t^{3}"], [b / 2, "t^{2}"], [c, "t"]]);
      return { params: { a, b, c, t, s0 }, stem: `A particle moves in a straight line. Its velocity, $v\\text{ m s}^{-1}$, at time $t$ seconds is $v(t) = ${poly([a, b, c], "t")}$, for $t \\ge 0$. When $t = 0$ the displacement of the particle from a fixed point $\\mathrm{O}$ is $${unit(s0, "m")}$.`, parts: [
        P(`Find the acceleration of the particle, in $\\text{m s}^{-2}$, when $t = ${t}$.`, 2, ans.int(acc), [`$a(t) = v'(t) = ${lin(2 * a, b, "t")}$`, `$a(${t}) = ${2 * a}${br(t)} ${signed(b)} = ${acc}$`]),
        P(`Find the displacement of the particle from $\\mathrm{O}$, in metres, when $t = ${t}$.`, 3, ans.int(st), [
          `$s(t) = \\displaystyle\\int v(t)\\,\\mathrm{d}t = ${sTex} + C$`, `$s(0) = ${s0}$, so $C = ${s0}$.`, `$s(${t}) = ${expr([[a / 3, `${br(t)}^{3}`], [b / 2, `${br(t)}^{2}`], [c, br(t)], [s0, ""]])} = ${st}$`])] };
    } });

  // ======================= 5.5, 5.10 and 5.11 integration =======================
  const DI = { type: "t5-definite-integral-area", syllabus: ["5.11"], representation: "equation", format: "value" };
  reg({ ...DI, unknown: "area-below-axis", levels: [3], skills: ["SL5.11.area-with-negative-regions", "SL5.11.evaluate-definite"], title: "Area between a parabola and the x-axis", source: "integrate-area/A",
    build({ rng }) {
      const p = rng.int(2, 7), area = rat.Q(p * p * p, 6);
      return { params: { p }, stem: `The curve $C$ has equation $y = x(x - ${p})$.`, parts: [
        P("The curve crosses the $x$-axis at the origin and at one other point. Write down the $x$-coordinate of this other point.", 1, ans.int(p), [`$x(x - ${p}) = 0$ gives $x = 0$ or $x = ${p}$.`]),
        P("Find the exact area of the region enclosed by $C$ and the $x$-axis.", 4, ans.frac(area.n, area.d), [
          `Between $x = 0$ and $x = ${p}$ the curve is below the axis, so the area is $-\\displaystyle\\int_{0}^{${p}} \\left(x^{2} - ${p}x\\right)${dx}$.`,
          `$\\displaystyle\\int_{0}^{${p}} \\left(x^{2} - ${p}x\\right)${dx} = \\left[\\dfrac{x^{3}}{3} - ${coef(rat.Q(p, 2), "x^{2}")}\\right]_{0}^{${p}}$`,
          `$= ${frac(p * p * p, 3)} - ${frac(p * p * p, 2)} = ${frac(-p * p * p, 6)}$`, `Area $= ${rat.tex(area)}$`])] };
    } });
  reg({ ...DI, unknown: "evaluate-polynomial", levels: [2], skills: ["SL5.11.evaluate-definite", "SL5.5.antidiff-power"], title: "Evaluate a definite integral of a power", source: "integrate-area/B",
    build({ rng }) {
      const n = rng.int(2, 4), a = rng.int(1, 5), b = rng.int(1, 4), v = rat.Q(a * Math.pow(b, n + 1), n + 1), anti = coef(rat.Q(a, n + 1), `x^{${n + 1}}`);
      return { params: { n, a, b }, stem: `Consider the integral $\\displaystyle\\int_{0}^{${b}} ${coef(a, `x^{${n}}`)}${dx}$.`, parts: [
        P("Find the exact value of the integral.", 3, ans.frac(v.n, v.d), [
          `$\\displaystyle\\int_{0}^{${b}} ${coef(a, `x^{${n}}`)}${dx} = \\left[${anti}\\right]_{0}^{${b}}$`, `$= ${coef(rat.Q(a, n + 1), `${br(b)}^{${n + 1}}`)} - 0$`, `$= ${rat.tex(v)}$`])] };
    } });
  reg({ ...DI, syllabus: ["5.11", "5.10"], unknown: "unknown-stretch", levels: [3], skills: ["SL5.11.unknown-limit-or-parameter", "SL5.11.evaluate-definite"], title: "Find a constant from the value of a definite integral", source: "integrate-area/definite integral with parameter",
    build({ rng }) {
      const k = rng.int(2, 9), target = rat.Q(4 * k, 3), second = rat.Q(14 * k, 3);
      return { params: { target: rat.num(target) }, stem: `It is given that $\\displaystyle\\int_{0}^{1} \\left(kx^{2} + k\\right)${dx} = ${rat.tex(target)}$, where $k$ is a constant.`, parts: [
        P("Find the value of $k$.", 3, ans.int(k), [`$\\displaystyle\\int_{0}^{1} \\left(kx^{2} + k\\right)${dx} = \\left[\\dfrac{kx^{3}}{3} + kx\\right]_{0}^{1} = \\dfrac{4k}{3}$`, `$\\dfrac{4k}{3} = ${rat.tex(target)}$, so $k = ${k}$.`]),
        P(`Hence find the exact value of $\\displaystyle\\int_{0}^{2} \\left(kx^{2} + k\\right)${dx}$.`, 3, ans.frac(second.n, second.d), [
          `$\\left[${coef(rat.Q(k, 3), "x^{3}")} + ${k}x\\right]_{0}^{2} = ${frac(8 * k, 3)} + ${2 * k}$`, `$= ${rat.tex(second)}$`])] };
    } });
  reg({ ...DI, syllabus: ["5.5", "5.11"], unknown: "area-above-axis", levels: [2], skills: ["SL5.11.evaluate-definite", "SL5.5.antidiff-power"], title: "Area under a parabola", source: "area-under-curve-basic",
    build({ rng }) {
      const a = rng.int(1, 4), b = rng.int(1, 5), u = rng.int(1, 4), area = rat.add(rat.Q(a * u * u * u, 3), b * u);
      return { params: { a, b, u }, stem: `The curve $C$ has equation $y = ${poly([a, 0, b])}$. The region $R$ is bounded by $C$, the $x$-axis, the $y$-axis and the line $x = ${u}$.`, parts: [
        P("Find the exact area of $R$.", 4, ans.frac(area.n, area.d), [
          `The curve is above the $x$-axis, so the area is $\\displaystyle\\int_{0}^{${u}} \\left(${poly([a, 0, b])}\\right)${dx}$.`,
          `$= \\left[${coef(rat.Q(a, 3), "x^{3}")} + ${coef(b, "x")}\\right]_{0}^{${u}}$`, `$= ${frac(a * u * u * u, 3)} + ${b * u}$`, `$= ${rat.tex(area)}$`])] };
    } });
  const AB = { type: "t5-area-between-curves", syllabus: ["5.11"], representation: "equation", format: "value" };
  reg({ ...AB, unknown: "area-line-curve", levels: [3], skills: ["SL5.11.area-between-curves"], title: "Area between a line through the origin and a parabola", source: "integrate-area/area between curves",
    build({ rng }) {
      const mm = rng.int(2, 9), area = rat.Q(mm * mm * mm, 6);
      return { params: { mm }, stem: `The line $y = ${mm}x$ and the curve $y = x^{2}$ enclose a finite region $R$.`, parts: [
        P("The line and the curve meet at the origin and at one other point. Find the $x$-coordinate of this other point.", 2, ans.int(mm), [`$x^{2} = ${mm}x$ gives $x(x - ${mm}) = 0$, so $x = 0$ or $x = ${mm}$.`]),
        P("Find the exact area of $R$.", 4, ans.frac(area.n, area.d), [
          `For $0 \\le x \\le ${mm}$ the line is above the curve, so the area is $\\displaystyle\\int_{0}^{${mm}} \\left(${mm}x - x^{2}\\right)${dx}$.`,
          `$= \\left[${coef(rat.Q(mm, 2), "x^{2}")} - \\dfrac{x^{3}}{3}\\right]_{0}^{${mm}}$`, `$= ${frac(mm * mm * mm, 2)} - ${frac(mm * mm * mm, 3)}$`, `$= ${rat.tex(area)}$`])] };
    } });
  reg({ ...AB, unknown: "meeting-limits", levels: [3], skills: ["SL5.11.area-between-curves", "SL5.11.composite-region-area"], title: "Area between a line and a parabola that meet at two points", source: "area-between-curves-section-b",
    build({ rng }) {
      let r1, r2;
      do { r1 = rng.int(-3, 1); r2 = r1 + rng.int(2, 5); } while (r1 * r2 === 0);
      const c = rng.int(0, 4), s = r1 + r2, pr = r1 * r2, area = rat.Q(Math.pow(r2 - r1, 3), 6);
      // curve y = x^2 + c and line y = s x - pr + c meet at x = r1 and x = r2
      const F = (x) => rat.sub(rat.sub(rat.Q(s * x * x, 2), pr * x), rat.Q(x * x * x, 3));
      return { params: { c, s, k: c - pr }, stem: `The curve $y = ${poly([1, 0, c])}$ and the line $y = ${lin(s, c - pr)}$ intersect at two points and enclose a finite region $R$.`, parts: [
        P("Find the $x$-coordinate of the left-hand point of intersection.", 1, ans.int(r1), [`$${poly([1, 0, c])} = ${lin(s, c - pr)}$ gives $${poly([1, -s, pr])} = 0$`, `$${factor(r1)}${factor(r2)} = 0$, so $x = ${r1}$ or $x = ${r2}$.`]),
        P("Write down the $x$-coordinate of the right-hand point of intersection.", 1, ans.int(r2), [`The right-hand point has $x = ${r2}$.`]),
        P("Find the exact area of $R$.", 4, ans.frac(area.n, area.d), [
          `Between the points the line is above the curve, so the area is $\\displaystyle\\int_{${r1}}^{${r2}} \\left(${poly([-1, s, -pr])}\\right)${dx}$.`,
          `$= \\left[${expr([[rat.Q(-1, 3), "x^{3}"], [rat.Q(s, 2), "x^{2}"], [-pr, "x"]])}\\right]_{${r1}}^{${r2}}$`,
          `$= ${paren(F(r2))} - ${paren(F(r1))}$`, `$= ${rat.tex(area)}$`])] };
    } });
  reg({ type: "t5-indefinite-integral", syllabus: ["5.10"], representation: "equation", format: "value", unknown: "linear-power", levels: [2],
    skills: ["SL5.10.linear-composites"], title: "Integrate a power of a linear expression", source: "reverse-chain-integral",
    build({ rng }) {
      const a = rng.int(2, 5), b = rng.nonzero(-6, 6), n = rng.int(2, 5), k = a * rng.pick([1, 2, 3, 5, 6]), A = rat.Q(k, a * (n + 1)), inner = lin(a, b);
      return { params: { a, b, n, k }, stem: `It is given that $\\displaystyle\\int ${k}\\left(${inner}\\right)^{${n}}${dx} = A\\left(${inner}\\right)^{m} + C$, where $A$ and $m$ are constants.`, parts: [
        P("Write down the value of $m$.", 1, ans.int(n + 1), [`Integrating raises the power by one, so $m = ${n + 1}$.`]),
        P("Find the value of $A$.", 3, ans.frac(A.n, A.d), [
          `Differentiate $\\left(${inner}\\right)^{${n + 1}}$ with the chain rule: $${(n + 1) * a}\\left(${inner}\\right)^{${n}}$`, `So $A \\times ${(n + 1) * a} = ${k}$`, `$A = ${rat.tex(A)}$`])] };
    } });

  // ======================= helpers for the generators below =======================
  const G = E.graph;
  const { sf, dp, piFrac, power } = fmt;
  const win = (x, y, extra) => Object.assign({ x, y, xStep: 1, yStep: 1 }, extra);
  const ek = (k, v) => `\\mathrm{e}^{${coef(k, v || "x")}}`; // e^{kx}
  const sg = (v) => (v < 0 ? "-" : "+");
  // Bisection and 3-point Gauss-Legendre quadrature, for calculator questions with no closed form.
  // (The verifiers use a grid root search and Simpson's rule instead.)
  const bisect = (f, lo, hi) => { let flo = f(lo); for (let i = 0; i < 90; i++) { const mid = (lo + hi) / 2, fm = f(mid); if ((flo < 0) === (fm < 0)) { lo = mid; flo = fm; } else hi = mid; } return (lo + hi) / 2; };
  const gauss = (f, a, b, n) => { n = n || 200; const h = (b - a) / n, r = (Math.sqrt(0.6) * h) / 2; let s = 0; for (let i = 0; i < n; i++) { const c = a + (i + 0.5) * h; s += 5 * f(c - r) + 8 * f(c) + 5 * f(c + r); } return (s * h) / 18; };
  // A sum of standard terms [[coefficient, kind, k], ...] as LaTeX. Kinds: "pow" (x^k, k may be
  // negative), "sin" and "cos" (of kx), "exp" (e^{kx}), "ln" (ln x). The same list is the option's
  // machine-readable value, which the verifier evaluates numerically.
  const tBody = (kind, k) => (kind === "sin" || kind === "cos" ? `\\${kind} ${coef(k, "x")}` : kind === "exp" ? ek(k) : kind === "ln" ? "\\ln x" : power("x", k));
  const termsTex = (ts) => {
    let out = "";
    for (const [c0, kind, k0] of ts) {
      const k = k0 === undefined ? 1 : k0, c = typeof c0 === "number" ? c0 : c0.n / c0.d;
      if (c === 0) continue;
      const q = typeof c0 === "number" ? (Number.isInteger(c0) ? rat.Q(Math.abs(c0)) : Math.abs(c0)) : rat.Q(Math.abs(c0.n), c0.d);
      const tex = kind === "pow" && k < 0 ? `\\dfrac{${typeof q === "number" ? num(q) : q.n}}{${typeof q === "number" || q.d === 1 ? "" : q.d}${power("x", -k)}}` : expr([[q, tBody(kind, k)]]);
      out += out ? ` ${sg(c)} ${tex}` : (c < 0 ? "-" : "") + tex;
    }
    return out || "0";
  };
  const termOpt = (lhs) => (ts, why) => ({ text: m(lhs + termsTex(ts)), value: ts, why });
  const intervalOpts = (a, b, ta, tb) => {
    ta = ta === undefined ? String(a) : ta; tb = tb === undefined ? String(b) : tb;
    return { in: { text: `$${ta} < x < ${tb}$`, value: ["in", a, b] }, out: { text: `$x < ${ta}$ or $x > ${tb}$`, value: ["out", a, b] }, below: { text: `$x < ${ta}$`, value: ["below", a, b] }, above: { text: `$x > ${tb}$`, value: ["above", a, b] } };
  };
  const intervalChoice = (rng, a, b, right, ta, tb) => {
    const o = intervalOpts(a, b, ta, tb), other = right === "in" ? "out" : "in";
    return ans.choice(rng, o[right], [Object.assign(o[other], { why: "$f$ is increasing where $f'(x) > 0$ and decreasing where $f'(x) < 0$." }),
      Object.assign(o.below, { why: "Check the sign of $f'(x)$ on both sides of each stationary point." }), Object.assign(o.above, { why: "Check the sign of $f'(x)$ on both sides of each stationary point." })]);
  };

  // ======================= 5.1 limits, chords and the derivative as a rate =======================
  reg({ type: "t5-derivative-meaning", syllabus: ["5.1"], unknown: "limit-from-table", representation: "table", format: "value", levels: [1],
    skills: ["SL5.1.estimate-limit"], title: "Estimate a limit from a table of values",
    build({ rng }) {
      const n = rng.pick([3, 3, 4]), a = n === 3 ? rng.nonzero(-3, 3) : rng.nonzero(-2, 2), k = rng.pick([1, 1, 2]);
      const f = (x) => (k * (Math.pow(x, n) - Math.pow(a, n))) / (x - a), lim = k * n * Math.pow(a, n - 1);
      const xs = [-0.1, -0.01, -0.001, 0.001, 0.01, 0.1].map((d) => a + d);
      const top = poly([k, ...Array(n - 1).fill(0), -k * Math.pow(a, n)]);
      return { params: { n, a, k }, stem: `The function $f$ is defined by $f(x) = \\dfrac{${top}}{${lin(1, -a)}}$, for $x \\ne ${a}$. The table shows values of $f(x)$, correct to four decimal places, for values of $x$ close to $${a}$.`,
        table: { head: ["$x$", ...xs.map((x) => `$${num(x)}$`)], rows: [["$f(x)$", ...xs.map((x) => `$${dp(f(x), 4)}$`)]] },
        parts: [P(`Write down the value of $\\displaystyle\\lim_{x \\to ${a}} f(x)$.`, 1, ans.int(lim), [
          `On both sides of $x = ${a}$ the values of $f(x)$ get closer and closer to $${lim}$.`, `$\\displaystyle\\lim_{x \\to ${a}} f(x) = ${lim}$`])] };
    } });
  reg({ type: "t5-ext-gradient-from-graph", syllabus: ["5.1"], unknown: "tangent-drawn", representation: "graph", format: "value", levels: [1],
    skills: ["SL5.1.gradient-from-graph"], title: "Gradient of a curve from a drawn tangent",
    build({ rng }) {
      let a, d, h, x0, y0, mm, xB, yB;
      do {
        a = rng.pick([1, -1, 0.5, -0.5]); d = Math.abs(a) === 1 ? rng.pick([-2, -1, 1, 2]) : rng.pick([-4, -2, 2, 4]);
        x0 = rng.int(-3, 3); h = x0 - d; y0 = rng.int(-3, 3); mm = 2 * a * d;
        const step = rng.pick([1, 2, -1, -2]); xB = x0 + step; yB = y0 + mm * step;
      } while (Math.abs(h) > 4 || Math.abs(yB) > 7 || Math.abs(xB) > 5);
      const k = y0 - a * d * d;
      return { params: { a, h, k, x0 },
        graph: win([-6, 6], [-8, 8], { functions: [{ fn: { type: "poly", coeffs: [k + a * h * h, -2 * a * h, a] }, label: "C" }, { fn: { type: "poly", coeffs: [y0 - mm * x0, mm] } }],
          points: [{ x: x0, y: y0, label: "A" }, { x: xB, y: yB, label: "B" }], alt: "A parabola C with its tangent at the point A; the tangent also passes through the point B" }),
        stem: "The diagram shows a curve $C$ and the tangent to $C$ at the point $\\mathrm{A}$. The tangent also passes through the point $\\mathrm{B}$. Both $\\mathrm{A}$ and $\\mathrm{B}$ have integer coordinates.",
        parts: [P("Find the gradient of $C$ at $\\mathrm{A}$.", 2, ans.int(mm), [
          "The gradient of a curve at a point is the gradient of its tangent at that point.", `$\\mathrm{A}$ is $${point(x0, y0)}$ and $\\mathrm{B}$ is $${point(xB, yB)}$.`,
          `Gradient: $\\dfrac{${yB} - ${paren(y0)}}{${xB} - ${paren(x0)}} = ${mm}$`])] };
    } });
  const CHORD = { type: "t5-ext-chord-to-tangent", syllabus: ["5.1"], representation: "equation", format: "value", skills: ["SL5.1.chord-to-tangent"] };
  reg({ ...CHORD, unknown: "chord-gradients", levels: [2], title: "Gradients of chords that approach a tangent",
    build({ rng }) {
      const a = rng.pick([1, 2, 3, -1, -2]), b = rng.int(-4, 4), c = rng.int(-3, 5), x0 = rng.pick([-1, 1, 2, 3]);
      const f = (x) => a * x * x + b * x + c, yA = f(x0), y1 = f(x0 + 1), g1 = y1 - yA;
      const xb = Number((x0 + 0.1).toFixed(1)), y2 = Number(f(xb).toFixed(2)), g2 = Number(((y2 - yA) / 0.1).toFixed(1)), g = 2 * a * x0 + b;
      return { params: { a, b, c, x0 }, stem: `The curve $C$ has equation $y = ${poly([a, b, c])}$. The points $\\mathrm{A}$ and $\\mathrm{B}$ lie on $C$, and the $x$-coordinate of $\\mathrm{A}$ is $${x0}$.`, parts: [
        P(`Find the gradient of the chord $[\\mathrm{AB}]$ when the $x$-coordinate of $\\mathrm{B}$ is $${x0 + 1}$.`, 2, ans.int(g1), [
          `At $\\mathrm{A}$, $y = ${yA}$. When $x = ${x0 + 1}$, $y = ${y1}$.`, `Gradient of $[\\mathrm{AB}]$: $\\dfrac{${y1} - ${paren(yA)}}{${x0 + 1} - ${paren(x0)}} = ${g1}$`]),
        P(`Find the gradient of $[\\mathrm{AB}]$ when the $x$-coordinate of $\\mathrm{B}$ is $${num(xb)}$.`, 1, ans.dec(g2), [
          `When $x = ${num(xb)}$, $y = ${num(y2)}$.`, `Gradient of $[\\mathrm{AB}]$: $\\dfrac{${num(y2)} - ${paren(yA)}}{0.1} = ${num(g2)}$`]),
        P("As $\\mathrm{B}$ moves along $C$ towards $\\mathrm{A}$, the gradient of $[\\mathrm{AB}]$ approaches a limiting value. Find this value.", 1, ans.int(g), [
          "The limiting value is the gradient of the tangent to $C$ at $\\mathrm{A}$.", `$${D} = ${lin(2 * a, b)}$, and at $x = ${x0}$ this is $${g}$.`])] };
    } });
  reg({ ...CHORD, unknown: "chord-limit", levels: [3], title: "Gradient of a chord in terms of h, and its limit",
    build({ rng }) {
      let a, b, c, p, g, h0;
      do { a = rng.pick([1, 2, 3, -1, -2]); b = rng.nonzero(-5, 5); c = rng.int(-4, 4); p = rng.pick([-2, -1, 1, 2, 3]); g = 2 * a * p + b; h0 = rng.nonzero(-3, 4); } while (g === 0);
      const fA = a * p * p + b * p + c, G1 = g + a * h0, chord = expr([[g, ""], [a, "h"]]), bh = `\\left(${p} + h\\right)`;
      const quot = `\\dfrac{f(${p} + h) - f(${p})}{h} = \\dfrac{${poly([a, g, 0], "h")}}{h} = ${chord}`;
      return { params: { a, b, c, p, G1 }, stem: `Let $f(x) = ${poly([a, b, c])}$. The curve $C$ has equation $y = f(x)$. The point $\\mathrm{A}$ on $C$ has $x$-coordinate $${p}$ and the point $\\mathrm{B}$ on $C$ has $x$-coordinate $${p} + h$, where $h \\ne 0$.`, parts: [
        P(`Show that the gradient of the chord $[\\mathrm{AB}]$ is $${chord}$.`, 3, ans.self(`$${quot}$`), [
          `$f(${p} + h) = ${expr([[a, `${bh}^{2}`], [b, bh], [c, ""]])}$`, `$f(${p} + h) = ${poly([a, g, fA], "h")}$`, `$f(${p}) = ${fA}$`, `Gradient of $[\\mathrm{AB}]$: $${quot}$`]),
        P("Hence write down the gradient of the tangent to $C$ at $\\mathrm{A}$.", 1, ans.int(g), [`As $h$ approaches $0$, $${chord}$ approaches $${g}$, so the gradient of the tangent is $${g}$.`]),
        P(`Find the value of $h$ for which the gradient of $[\\mathrm{AB}]$ is $${G1}$.`, 2, ans.int(h0), [`$${chord} = ${G1}$`, `$${coef(a, "h")} = ${G1 - g}$, so $h = ${h0}$.`])] };
    } });
  const RATE_CTX = [
    { q: "T", open: "The temperature of a cup of tea, $T$ degrees Celsius, $t$ minutes after it is poured", is: "the temperature of the tea", u: "degrees Celsius", per: "minute", ts: "minutes", c: [18, 20, 21, 22], A: [55, 60, 64, 70], k: [0.04, 0.05, 0.06, 0.08], t0: [5, 8, 10, 12] },
    { q: "V", open: "The volume of water in a leaking tank, $V$ litres, $t$ minutes after the leak starts", is: "the volume of water in the tank", u: "litres", per: "minute", ts: "minutes", c: [40, 50, 60], A: [250, 300, 360, 400], k: [0.02, 0.03, 0.05], t0: [10, 15, 20] },
    { q: "V", open: "The value of a machine, $V$ thousand euros, $t$ years after it is bought", is: "the value of the machine", u: "thousand euros", per: "year", ts: "years", c: [4, 5, 6], A: [30, 36, 45], k: [0.15, 0.2, 0.25], t0: [2, 3, 4] }];
  reg({ type: "t5-derivative-meaning", syllabus: ["5.1"], unknown: "interpret-value", representation: "words", format: "mcq", levels: [2], calculator: true,
    skills: ["SL5.1.interpret-derivative"], title: "Find a derivative of a model and say what it means",
    build({ rng }) {
      const ci = rng.int(0, RATE_CTX.length - 1), X = RATE_CTX[ci], c = rng.pick(X.c), A = rng.pick(X.A), k = rng.pick(X.k), t0 = rng.pick(X.t0);
      const r = -A * k * Math.exp(-k * t0), size = sf(-r), at = `After $${t0}$ ${X.ts}`;
      return { params: { c, A, k, t0 }, stem: `${X.open}, is modelled by $${X.q}(t) = ${c} + ${A}${ek(-k, "t")}$, for $t \\ge 0$.`, parts: [
        P(`Find $${X.q}'(${t0})$.`, 2, ans.sf(r), [`Use the numerical derivative on the GDC, or differentiate: $${X.q}'(t) = ${num(-A * k)}${ek(-k, "t")}$`, `$${X.q}'(${t0}) = ${num(-A * k)}\\mathrm{e}^{${num(-k * t0)}} \\approx ${sf(r)}$`]),
        P("Which statement correctly interprets this value?", 2, ans.choice(rng, { text: `${at}, ${X.is} is falling at a rate of about $${size}$ ${X.u} per ${X.per}.`, value: "falling-rate" }, [
          { text: `${at}, ${X.is} is about $${size}$ ${X.u}.`, value: "value", why: "A derivative is a rate of change, not the value of the quantity." },
          { text: `In the first $${t0}$ ${X.ts}, ${X.is} falls by about $${size}$ ${X.u} in total.`, value: "total-change", why: "The derivative gives the rate at one instant, not the total change over an interval." },
          { text: `${at}, ${X.is} is rising at a rate of about $${size}$ ${X.u} per ${X.per}.`, value: "rising-rate", why: "A negative derivative means the quantity is decreasing." }]), [
          `$${X.q}'(${t0})$ is the rate of change of ${X.is} at the instant $t = ${t0}$.`, `It is negative, so ${X.is} is falling, at about $${size}$ ${X.u} per ${X.per}.`])] };
    } });
  reg({ type: "t5-derivative-meaning", syllabus: ["5.1"], unknown: "rate-at-time", representation: "equation", format: "value", levels: [4], calculator: true,
    skills: ["SL5.1.interpret-derivative"], title: "Rates of change of a model with the GDC",
    build({ rng }) {
      const a = rng.int(4, 12), k = rng.pick([0.2, 0.25, 0.4, 0.5, 0.8]), t1 = k <= 0.4 ? rng.pick([1, 2]) : 1, tmax = 1 / k;
      const C = (t) => a * t * Math.exp(-k * t), dC = (t) => a * Math.exp(-k * t) * (1 - k * t), t2 = bisect((t) => C(t) - C(t1), tmax, 80 / k);
      return { params: { a, k, t1 }, stem: `The concentration of a medicine in a patient's blood, $C$ milligrams per litre, $t$ hours after it is taken, is modelled by $C(t) = ${a}t${ek(-k, "t")}$, for $t \\ge 0$.`, parts: [
        P(`Find the concentration when $t = ${t1}$.`, 1, ans.sf(C(t1)), [`$C(${t1}) = ${a}${br(t1)}\\mathrm{e}^{${num(-k * t1)}} \\approx ${sf(C(t1))}$`]),
        P(`Find the rate at which the concentration is changing when $t = ${t1}$.`, 2, ans.sf(dC(t1)), [
          `The rate of change is $C'(${t1})$. Use the numerical derivative on the GDC at $t = ${t1}$.`, `$C'(${t1}) \\approx ${sf(dC(t1))}$, so the concentration is rising by about $${sf(dC(t1))}$ milligrams per litre per hour.`]),
        P("Find the time at which the concentration is greatest.", 2, ans.sf(tmax), [
          "The concentration is greatest where $C'(t) = 0$. Find the maximum point of the graph of $C$ on the GDC.", `The maximum point is at $t = ${sf(tmax)}$.`]),
        P(`After this maximum, the concentration falls back to the value it had when $t = ${t1}$. Find the time at which this happens.`, 2, ans.sf(t2), [
          `Solve $C(t) = C(${t1})$ on the GDC: draw the horizontal line through the point of the graph where $t = ${t1}$ and find where it meets the graph again.`, `The second intersection is at $t \\approx ${sf(t2)}$.`])] };
    } });

  // ======================= 5.2 increasing and decreasing: more ways to ask =======================
  const INC = { type: "t5-increasing-decreasing", syllabus: ["5.2"] };
  reg({ ...INC, unknown: "quadratic-interval", representation: "equation", format: "value", levels: [1], skills: ["SL5.2.increasing-decreasing-intervals"], title: "Where a quadratic changes from decreasing to increasing",
    build({ rng }) {
      const a = rng.pick([1, 2, 3, -1, -2]), h = rng.nonzero(-5, 5), c = rng.int(-6, 6), b = -2 * a * h, up = a > 0;
      return { params: { a, b, c }, stem: `Let $f(x) = ${poly([a, b, c])}$, for $x \\in \\mathbb{R}$. The function $f$ is ${up ? "decreasing" : "increasing"} for $x < k$ and ${up ? "increasing" : "decreasing"} for $x > k$.`, parts: [
        P("Find the value of $k$.", 2, ans.int(h), [`$f'(x) = ${lin(2 * a, b)}$`, `$f'(x) = 0$ when $x = ${h}$. For $x < ${h}$, $f'(x) ${up ? "<" : ">"} 0$, and for $x > ${h}$, $f'(x) ${up ? ">" : "<"} 0$, so $k = ${h}$.`])] };
    } });
  reg({ type: "t5-ext-sign-at-point", syllabus: ["5.2"], unknown: "sign-at-point", representation: "equation", format: "mcq", levels: [1], skills: ["SL5.2.sign-at-point"], title: "Increasing or decreasing at a point",
    build({ rng }) {
      let a, b, c, k, v;
      do { a = rng.pick([1, 2, -1]); b = rng.int(-4, 4); c = rng.int(-9, 9); k = rng.pick([-2, -1, 1, 2, 3]); v = 3 * a * k * k + 2 * b * k + c; } while (v === 0 || Math.abs(v) > 30);
      const word = (s) => `$f$ is ${s > 0 ? "increasing" : "decreasing"} at $x = ${k}$.`;
      return { params: { a, b, c, k }, stem: `Let $f(x) = ${poly([a, b, c, 0])}$.`, parts: [
        P(`Find $f'(${k})$.`, 1, ans.int(v), [`$f'(x) = ${poly([3 * a, 2 * b, c])}$`, `$f'(${k}) = ${expr([[3 * a, `${br(k)}^{2}`], [2 * b, br(k)], [c, ""]])} = ${v}$`]),
        P(`What does this show about $f$ at $x = ${k}$?`, 1, ans.choice(rng, { text: word(v), value: Math.sign(v) }, [
          { text: word(-v), value: -Math.sign(v), why: "A positive derivative means the function is increasing; a negative derivative means it is decreasing." },
          { text: `$f$ has a stationary point at $x = ${k}$.`, value: 0, why: "A stationary point needs $f'(x) = 0$." }]), [`$f'(${k}) ${v > 0 ? ">" : "<"} 0$, so $f$ is ${v > 0 ? "increasing" : "decreasing"} at $x = ${k}$.`])] };
    } });
  reg({ ...INC, unknown: "parameter-shift", representation: "equation", format: "mcq", levels: [3], skills: ["SL5.2.increasing-decreasing-intervals", "SL5.2.parameter-for-monotonic", "SL5.3.power-rule"], title: "Decreasing interval of a cubic, then a constant that makes it increasing",
    build({ rng }) {
      let p, q, c;
      do { p = rng.int(-5, 3); q = p + 2 * rng.int(1, 3); c = rng.nonzero(-6, 6); } while (p * q === 0 || p + q === 0);
      const B = (-3 * (p + q)) / 2, Cc = 3 * p * q, kmin = 3 * ((q - p) / 2) ** 2, mid = (p + q) / 2;
      return { params: { B, Cc, c }, stem: `Let $f(x) = ${poly([1, B, Cc, c])}$, for $x \\in \\mathbb{R}$.`, parts: [
        P("Which expression is $f'(x)$?", 2, ans.choice(rng, polyOpt([3, 2 * B, Cc]), [
          polyOpt([3, B, Cc], "The term in $x^{2}$ must also be multiplied by its power."), polyOpt([3, 2 * B, Cc + c], "The derivative of a constant is zero."),
          polyOpt([3, 2 * B, 0], "The term in $x$ differentiates to its coefficient."), polyOpt([1, 2 * B, Cc])]), [`$f'(x) = ${poly([3, 2 * B, Cc])}$`]),
        P("The function $f$ is decreasing for $a < x < b$. Find the value of $a$.", 2, ans.int(p), [
          "$f$ is decreasing where $f'(x) < 0$.", `$f'(x) = 3\\left(${poly([1, -(p + q), p * q])}\\right) = 3${factor(p)}${factor(q)}$`, `$f'(x) < 0$ between its zeros, so $${p} < x < ${q}$ and $a = ${p}$.`]),
        P("Write down the value of $b$.", 1, ans.int(q), [`$b = ${q}$`]),
        P("Let $g(x) = f(x) + kx$, where $k$ is a constant. Find the least value of $k$ for which $g'(x) \\ge 0$ for all values of $x$.", 2, ans.int(kmin), [
          "$g'(x) = f'(x) + k$, so $k$ must make up for the least value of $f'(x)$.",
          `$f'(x)$ is a quadratic, so it is least halfway between its zeros, at $x = ${mid}$: $f'(${mid}) = 3${br(mid - p)}${br(mid - q)} = ${-kmin}$`,
          `$g'(x) \\ge 0$ for all $x$ when $k \\ge ${kmin}$, so the least value of $k$ is $${kmin}$.`])] };
    } });
  reg({ ...INC, unknown: "interval-gdc", representation: "equation", format: "mcq", levels: [4], calculator: true, skills: ["SL5.2.increasing-decreasing-intervals"], title: "Decreasing interval of a cubic with the GDC",
    build({ rng }) {
      let b, c, d, disc;
      do { b = rng.int(1, 5); c = rng.int(1, 7); d = rng.int(-4, 6); disc = 4 * b * b + 12 * c; } while (Number.isInteger(Math.sqrt(disc)));
      const r1 = (2 * b - Math.sqrt(disc)) / 6, r2 = (2 * b + Math.sqrt(disc)) / 6, least = -c - (b * b) / 3;
      return { params: { b, c, d }, stem: `Let $f(x) = ${poly([1, -b, -c, d])}$, for $x \\in \\mathbb{R}$.`, parts: [
        P("Find the $x$-coordinate of the local maximum point of the graph of $f$.", 2, ans.sf(r1), [
          `$f'(x) = ${poly([3, -2 * b, -c])}$`, `Solve $f'(x) = 0$ on the GDC: $x \\approx ${sf(r1)}$ or $x \\approx ${sf(r2)}$.`,
          `A cubic with a positive coefficient of $x^{3}$ rises, falls and then rises again, so the local maximum is at $x \\approx ${sf(r1)}$.`]),
        P("Find the $x$-coordinate of the local minimum point.", 1, ans.sf(r2), [`The other solution of $f'(x) = 0$ is the local minimum: $x \\approx ${sf(r2)}$.`]),
        P("For which values of $x$ is $f$ decreasing?", 1, intervalChoice(rng, r1, r2, "in", sf(r1), sf(r2)), [`$f$ is decreasing where $f'(x) < 0$, which is between the two stationary points: $${sf(r1)} < x < ${sf(r2)}$.`]),
        P("Find the least value of $f'(x)$.", 2, ans.sf(least), [
          `$f'(x)$ is a quadratic. Find its minimum point on the GDC, or use $f''(x) = ${lin(6, -2 * b)} = 0$, which gives $x = ${frac(b, 3)}$.`, `The least value of $f'(x)$ is $f'\\left(${frac(b, 3)}\\right) \\approx ${sf(least)}$.`])] };
    } });
  reg({ ...INC, unknown: "interval-from-derivative-graph", representation: "graph", format: "mcq", levels: [2], skills: ["SL5.2.sign-from-graph", "SL5.2.increasing-decreasing-intervals"], title: "Increasing and decreasing from the graph of the derivative",
    build({ rng }) {
      let a, b;
      do { a = rng.int(-4, 2); b = a + rng.pick([2, 4]); } while (b > 4);
      const s = rng.sign(), sc = s * (b - a === 2 ? rng.pick([1, 2]) : rng.pick([0.5, 1])), inc = rng.bool(), right = (s > 0) === inc ? "out" : "in";
      return { params: { inc },
        graph: win([-6, 6], [-6, 6], { functions: [{ fn: { type: "poly", coeffs: [sc * a * b, -sc * (a + b), sc] } }], alt: "A parabola, the graph of the derivative of f, crossing the x-axis twice" }),
        stem: "The diagram shows the graph of $y = f'(x)$, where $f'$ is the derivative of a function $f$. The graph crosses the $x$-axis at two points with integer coordinates.", parts: [
          P("The graph of $f$ has two stationary points. Write down the smaller of their $x$-coordinates.", 1, ans.int(a), [`Stationary points of $f$ are where $f'(x) = 0$, which is where the graph shown crosses the $x$-axis: $x = ${a}$ and $x = ${b}$.`]),
          P("Write down the larger of their $x$-coordinates.", 1, ans.int(b), [`The larger is $x = ${b}$.`]),
          P(`For which values of $x$ is $f$ ${inc ? "increasing" : "decreasing"}?`, 2, intervalChoice(rng, a, b, right), [
            `$f$ is ${inc ? "increasing" : "decreasing"} where $f'(x) ${inc ? ">" : "<"} 0$, which is where the graph shown is ${inc ? "above" : "below"} the $x$-axis.`, `That is for ${intervalOpts(a, b)[right].text}.`])] };
    } });

  // ======================= 5.3 differentiating powers: more ways to ask =======================
  const DP = { type: "t5-differentiate-polynomial", syllabus: ["5.3"], representation: "equation" };
  reg({ ...DP, unknown: "derivative", format: "value", levels: [1], skills: ["SL5.3.power-rule"], title: "Derivative of a single power",
    build({ rng }) {
      const n = rng.int(2, 6), a = rng.pick([2, 3, 4, 5, 6, 7, -2, -3, -4]), c = rng.int(-9, 9);
      return { params: { n, a, c }, stem: `Let $f(x) = ${poly([a, ...Array(n - 1).fill(0), c])}$. The derivative of $f$ can be written as $f'(x) = px^{q}$, where $p$ and $q$ are constants.`, parts: [
        P("Write down the value of $p$.", 1, ans.int(a * n), [`Multiply by the power and reduce the power by one: $f'(x) = ${coef(a * n, power("x", n - 1))}$`, `$p = ${a * n}$`]),
        P("Write down the value of $q$.", 1, ans.int(n - 1), [`The power goes down by one, so $q = ${n - 1}$.`])] };
    } });
  reg({ ...DP, syllabus: ["5.3", "5.8"], unknown: "derivative-from-fraction", format: "mcq", levels: [3], skills: ["SL5.3.negative-powers", "SL5.3.gradient-at-point", "SL5.3.point-with-given-gradient"], title: "Differentiate a function with a negative power",
    build({ rng }) {
      let a, k, x1;
      do { a = rng.int(1, 3); k = rng.pick([-2, -1, 1, 2]); x1 = rng.pick([-2, -1, 1, 2]); } while (x1 === k);
      const b = 2 * a * k * k * k, val = rat.sub(2 * a * x1, rat.Q(b, x1 * x1)), opt = termOpt("f'(x) = ");
      return { params: { a, b, x1 }, stem: `Let $f(x) = ${termsTex([[a, "pow", 2], [b, "pow", -1]])}$, for $x \\ne 0$.`, parts: [
        P("Which expression is $f'(x)$?", 2, ans.choice(rng, opt([[2 * a, "pow", 1], [-b, "pow", -2]]), [
          opt([[2 * a, "pow", 1], [b, "pow", -2]], "The derivative of $x^{-1}$ is $-x^{-2}$, so the sign of that term changes."),
          opt([[2 * a, "pow", 1], [-b, "pow", 0]], "Reducing the power $-1$ by one gives $-2$, not $0$."),
          opt([[a, "pow", 1], [-b, "pow", -2]], "The term in $x^{2}$ must be multiplied by its power."), opt([[2 * a, "pow", 1], [-2 * b, "pow", -3]])]), [
          `Write $f(x) = ${a === 1 ? "" : a}x^{2} ${sg(b)} ${Math.abs(b)}x^{-1}$ and differentiate each term.`, `$f'(x) = ${2 * a}x ${sg(-b)} ${Math.abs(b)}x^{-2} = ${termsTex([[2 * a, "pow", 1], [-b, "pow", -2]])}$`]),
        P(`Find $f'(${x1})$.`, 2, ans.frac(val.n, val.d), [`$f'(${x1}) = ${2 * a}${br(x1)} ${sg(-b)} \\dfrac{${Math.abs(b)}}{${br(x1)}^{2}}$`, `$f'(${x1}) = ${rat.tex(val)}$`]),
        P("Find the $x$-coordinate of the point on the graph of $f$ where the gradient is zero.", 2, ans.int(k), [
          `$f'(x) = 0$ gives $${2 * a}x = ${termsTex([[b, "pow", -2]])}$`, `Multiply by $x^{2}$: $${2 * a}x^{3} = ${b}$, so $x^{3} = ${k * k * k}$`, `$x = ${k}$`])] };
    } });
  const UC = { type: "t5-ext-unknown-coefficients", syllabus: ["5.3"], representation: "equation", format: "value" };
  reg({ ...UC, unknown: "k-from-gradient", levels: [2], skills: ["SL5.3.unknown-coefficients", "SL5.3.gradient-at-point"], title: "Find a coefficient from a gradient",
    build({ rng }) {
      let k, b, x0, x1;
      do { k = rng.nonzero(-4, 4); b = rng.nonzero(-9, 9); x0 = rng.pick([1, 2, -1, -2]); x1 = rng.pick([1, 2, 3, -1]); } while (Math.abs(x1) === Math.abs(x0));
      const g = 3 * k * x0 * x0 + b, g1 = 3 * k * x1 * x1 + b;
      return { params: { b, x0, g, x1 }, stem: `The curve $C$ has equation $y = ${expr([[1, "kx^{3}"], [b, "x"]])}$, where $k$ is a constant. The gradient of $C$ at the point where $x = ${x0}$ is $${g}$.`, parts: [
        P("Find the value of $k$.", 3, ans.int(k), [`$${D} = 3kx^{2} ${signed(b)}$`, `At $x = ${x0}$: $${3 * x0 * x0}k ${signed(b)} = ${g}$`, `$${3 * x0 * x0}k = ${g - b}$, so $k = ${k}$.`]),
        P(`Find the gradient of $C$ at the point where $x = ${x1}$.`, 1, ans.int(g1), [`$${D} = ${poly([3 * k, 0, b])}$, so at $x = ${x1}$ the gradient is $${3 * k}${br(x1)}^{2} ${signed(b)} = ${g1}$.`])] };
    } });
  reg({ ...UC, unknown: "two-from-gradient-and-point", levels: [3], skills: ["SL5.3.unknown-coefficients", "SL5.3.gradient-at-point"], title: "Two coefficients from a point and a gradient",
    build({ rng }) {
      let p, q, x0, x2;
      do { p = rng.nonzero(-3, 3); q = rng.nonzero(-6, 6); x0 = rng.pick([1, 2, -1]); x2 = rng.pick([2, 3, -2]); } while (x2 === x0 || 3 * p * x0 * x0 + q === 0);
      const y0 = p * x0 ** 3 + q * x0, g = 3 * p * x0 * x0 + q, g2 = 3 * p * x2 * x2 + q;
      return { params: { x0, y0, g, x2 }, stem: `The curve $C$ has equation $y = px^{3} + qx$, where $p$ and $q$ are constants. The point $\\mathrm{A}${point(x0, y0)}$ lies on $C$, and the gradient of $C$ at $\\mathrm{A}$ is $${g}$.`, parts: [
        P("Find the value of $p$.", 4, ans.int(p), [`$${D} = 3px^{2} + q$`, `The gradient at $x = ${x0}$ is $${g}$: $${expr([[3 * x0 * x0, "p"], [1, "q"]])} = ${g}$`, `$\\mathrm{A}$ lies on $C$: $${expr([[x0 ** 3, "p"], [x0, "q"]])} = ${y0}$`,
          x0 === 1 ? `Subtract the second equation from the first: $2p = ${g - y0}$` : x0 === -1 ? `Add the two equations: $2p = ${g + y0}$` :`Multiply the first equation by $${x0}$ and subtract the second: $${coef(2 * x0 ** 3, "p")} = ${g * x0 - y0}$`, `$p = ${p}$`]),
        P("Find the value of $q$.", 1, ans.int(q), [`$q = ${g} - ${3 * x0 * x0}${br(p)} = ${q}$`]),
        P(`Find the gradient of $C$ at the point where $x = ${x2}$.`, 2, ans.int(g2), [`$${D} = ${poly([3 * p, 0, q])}$`, `At $x = ${x2}$: $${3 * p}${br(x2)}^{2} ${signed(q)} = ${g2}$`])] };
    } });

  // ======================= 5.4 tangents and normals: more ways to ask =======================
  reg({ ...TN, unknown: "read-from-tangent", levels: [1], skills: ["SL5.4.read-from-tangent"], title: "Read a value and a gradient from a given tangent",
    build({ rng }) {
      const a = rng.nonzero(-4, 5), mm = rng.pick([-5, -4, -3, -2, 2, 3, 4, 5, 6]), c = rng.nonzero(-9, 9);
      return { params: { a, mm, c }, stem: `The tangent to the graph of a function $f$ at the point where $x = ${a}$ has equation $y = ${lin(mm, c)}$.`, parts: [
        P(`Write down the value of $f'(${a})$.`, 1, ans.int(mm), [`$f'(${a})$ is the gradient of the tangent at $x = ${a}$, which is $${mm}$.`]),
        P(`Find the value of $f(${a})$.`, 1, ans.int(mm * a + c), [`The tangent touches the graph where $x = ${a}$, so that point lies on the tangent: $f(${a}) = ${mm}${br(a)} ${signed(c)} = ${mm * a + c}$`])] };
    } });
  reg({ ...TN, unknown: "tangent-to-cubic", levels: [2], skills: ["SL5.4.tangent-equation", "SL5.3.gradient-at-point"], title: "Tangent to a cubic at a point",
    build({ rng }) {
      let b, c, x0, mm;
      do { b = rng.nonzero(-4, 4); c = rng.int(-5, 5); x0 = rng.pick([1, 2, -1, -2]); mm = 3 * x0 * x0 + 2 * b * x0; } while (mm === 0);
      const y0 = x0 ** 3 + b * x0 * x0 + c, tc = y0 - mm * x0;
      return { params: { b, c, x0 }, stem: `The curve $C$ has equation $y = ${poly([1, b, 0, c])}$. The point $\\mathrm{A}$ on $C$ has $x$-coordinate $${x0}$.`, parts: [
        P("Find the gradient of the tangent to $C$ at $\\mathrm{A}$.", 2, ans.int(mm), [`$${D} = ${poly([3, 2 * b, 0])}$`, `At $x = ${x0}$: $${expr([[3, `${br(x0)}^{2}`], [2 * b, br(x0)]])} = ${mm}$`]),
        P("The tangent to $C$ at $\\mathrm{A}$ has equation $y = mx + c$. Find the value of $c$.", 2, ans.int(tc), [`At $x = ${x0}$, $y = ${y0}$, so $\\mathrm{A}$ is $${point(x0, y0)}$.`, `$${y0} = ${mm}${br(x0)} + c$`, `$c = ${tc}$`])] };
    } });
  const TC = { type: "t5-tangent-condition", representation: "equation", format: "value" };
  reg({ ...TC, syllabus: ["5.4", "5.3"], unknown: "x-for-gradient", levels: [2], skills: ["SL5.3.point-with-given-gradient", "SL5.4.tangent-gradient"], title: "Points on a cubic with a given gradient",
    build({ rng }) {
      let r1, r2, g, d;
      do { r1 = rng.int(-4, 2); r2 = r1 + 2 * rng.int(1, 3); g = rng.int(-6, 9); d = rng.int(-5, 5); } while (r2 > 5);
      const B = (-3 * (r1 + r2)) / 2, Cc = g + 3 * r1 * r2;
      return { params: { B, Cc, d, g }, stem: `Let $f(x) = ${poly([1, B, Cc, d])}$. There are two points on the graph of $f$ at which the gradient is $${g}$.`, parts: [
        P("Find the $x$-coordinate of the left-hand point.", 3, ans.int(r1), [`$f'(x) = ${poly([3, 2 * B, Cc])}$`, `$f'(x) = ${g}$ gives $${poly([3, 2 * B, Cc - g])} = 0$`, `Divide by $3$: $${poly([1, -(r1 + r2), r1 * r2])} = 0$`,
          `$${factor(r1)}${factor(r2)} = 0$, so $x = ${r1}$ or $x = ${r2}$. The left-hand point has $x = ${r1}$.`]),
        P("Write down the $x$-coordinate of the right-hand point.", 1, ans.int(r2), [`The right-hand point has $x = ${r2}$.`])] };
    } });
  reg({ ...TC, syllabus: ["5.4"], unknown: "coefficient-from-tangent", levels: [3], skills: ["SL5.4.tangency-condition", "SL5.4.tangent-gradient"], title: "Find a constant so that a line is a tangent",
    build({ rng }) {
      let xt, b, mm, c;
      do { xt = rng.nonzero(-3, 4); b = rng.int(-5, 5); mm = 2 * xt + b; c = rng.int(-6, 6); } while (mm === 0);
      const yt = mm * xt + c, k = yt - xt * xt - b * xt;
      return { params: { b, mm, c }, stem: `The line $L$ has equation $y = ${lin(mm, c)}$. The curve $C$ has equation $y = ${expr([[1, "x^{2}"], [b, "x"]])} + k$, where $k$ is a constant. The line $L$ is a tangent to $C$.`, parts: [
        P("Find the $x$-coordinate of the point where $L$ touches $C$.", 3, ans.int(xt), [`For $C$, $${D} = ${lin(2, b)}$.`, `Where $L$ touches $C$ the two gradients are equal: $${lin(2, b)} = ${mm}$`, `$x = ${xt}$`]),
        P("Find the $y$-coordinate of this point.", 1, ans.int(yt), [`The point lies on $L$: $y = ${mm}${br(xt)} ${signed(c)} = ${yt}$`]),
        P("Find the value of $k$.", 2, ans.int(k), [`The point $${point(xt, yt)}$ also lies on $C$: $${yt} = ${expr([[1, `${br(xt)}^{2}`], [b, br(xt)]])} + k$`, `$k = ${k}$`])] };
    } });
  reg({ type: "t5-normal-meets-curve", syllabus: ["5.4"], unknown: "tangent-x-intercept", representation: "equation", format: "value", levels: [4], calculator: true,
    skills: ["SL5.4.tangent-meets-axes-or-curve", "SL5.4.tangent-equation"], title: "Where a tangent to an exponential curve meets the axes",
    build({ rng }) {
      let a, k, b, x0, mm, y0, xi, yi;
      do {
        a = rng.int(2, 5); k = rng.pick([0.3, 0.4, 0.5, 0.6, -0.4, -0.5]); b = rng.pick([-2, -1, 1, 2]); x0 = rng.int(1, 3);
        y0 = a * Math.exp(k * x0) + b * x0; mm = a * k * Math.exp(k * x0) + b; yi = y0 - mm * x0; xi = x0 - y0 / mm;
      } while (Math.abs(mm) < 0.5 || Math.abs(xi) > 40 || Math.abs(yi) < 0.2 || Math.abs(xi) < 0.2 || Math.abs(y0) < 0.2);
      return { params: { a, k, b, x0 }, stem: `The curve $C$ has equation $y = ${expr([[a, ek(k)], [b, "x"]])}$. The point $\\mathrm{A}$ on $C$ has $x$-coordinate $${x0}$. The tangent to $C$ at $\\mathrm{A}$ meets the $y$-axis at $\\mathrm{Q}$ and the $x$-axis at $\\mathrm{R}$.`, parts: [
        P("Find the $y$-coordinate of $\\mathrm{A}$.", 1, ans.sf(y0), [`$y = ${expr([[a, `\\mathrm{e}^{${num(k * x0)}}`], [b * x0, ""]])} \\approx ${sf(y0)}$`]),
        P("Find the gradient of $C$ at $\\mathrm{A}$.", 2, ans.sf(mm), [`$${D} = ${expr([[a * k, ek(k)], [b, ""]])}$`, `At $x = ${x0}$: $${D} \\approx ${sf(mm)}$`]),
        P("Find the $y$-coordinate of $\\mathrm{Q}$.", 2, ans.sf(yi), [`The tangent is $y = ${sf(mm)}(x - ${x0}) ${sg(y0)} ${sf(Math.abs(y0))}$. Keep the unrounded values on the GDC.`, `At $x = 0$: $y \\approx ${sf(yi)}$`]),
        P("Find the $x$-coordinate of $\\mathrm{R}$.", 2, ans.sf(xi), ["Set $y = 0$ in the equation of the tangent and solve for $x$.", `$x \\approx ${sf(xi)}$`])] };
    } });

  // ======================= 5.5 antiderivatives and a boundary condition =======================
  const intOpt = (lhs) => (ts, why) => ({ text: m(lhs + termsTex(ts) + " + C"), value: ts, why });
  const II = { type: "t5-indefinite-integral", representation: "equation" };
  const AC = { type: "t5-antiderivative-condition", representation: "equation" };
  reg({ ...II, syllabus: ["5.5"], unknown: "power-polynomial", format: "value", levels: [1], skills: ["SL5.5.antidiff-power"], title: "Integrate a single power",
    build({ rng }) {
      const n = rng.int(1, 5), a = rng.pick([2, 3, 4, 5, 6, 8, 9, 10, 12]), p = rat.Q(a, n + 1), raw = `\\dfrac{${a}}{${n + 1}}`;
      return { params: { n, a }, stem: `It is given that $\\displaystyle\\int ${coef(a, power("x", n))}${dx} = px^{q} + C$, where $p$ and $q$ are constants.`, parts: [
        P("Write down the value of $q$.", 1, ans.int(n + 1), [`Integrating raises the power by one, so $q = ${n + 1}$.`]),
        P("Find the value of $p$.", 1, ans.frac(p.n, p.d), [`Divide the coefficient by the new power: $p = ${raw === rat.tex(p) ? raw : `${raw} = ${rat.tex(p)}`}$`])] };
    } });
  reg({ ...AC, syllabus: ["5.5", "5.10"], unknown: "poly-function", format: "value", levels: [2], skills: ["SL5.5.boundary-condition", "SL5.5.antidiff-power"], title: "Find a function from its derivative and a point",
    build({ rng }) {
      let a, b, c, x0, x1, C;
      do { a = rng.pick([1, 2, -1]); b = rng.int(-3, 3); c = rng.int(-5, 5); x0 = rng.pick([1, 2, -1]); x1 = rng.pick([2, 3, -2]); C = rng.nonzero(-8, 8); } while (x1 === x0 || (b === 0 && c === 0));
      const F = (x) => a * x ** 3 + b * x * x + c * x, y0 = F(x0) + C, d = poly([3 * a, 2 * b, c]);
      return { params: { a, b, c, x0, y0, x1 }, stem: `The derivative of a function $f$ is $f'(x) = ${d}$. The graph of $f$ passes through the point $${point(x0, y0)}$.`, parts: [
        P("Find $f(0)$.", 3, ans.int(C), [`$f(x) = \\displaystyle\\int \\left(${d}\\right)${dx} = ${poly([a, b, c, 0])} + C$`, `$f(${x0}) = ${y0}$ gives $${F(x0)} + C = ${y0}$, so $C = ${C}$.`, `$f(0) = C = ${C}$`]),
        P(`Find $f(${x1})$.`, 1, ans.int(F(x1) + C), [`$f(${x1}) = ${expr([[a, `${br(x1)}^{3}`], [b, `${br(x1)}^{2}`], [c, br(x1)], [C, ""]])} = ${F(x1) + C}$`])] };
    } });
  reg({ ...AC, syllabus: ["5.5", "5.10"], unknown: "negative-power", format: "mcq", levels: [3], skills: ["SL5.5.boundary-condition", "SL5.5.antidiff-power", "SL5.10.find-function-from-derivative"], title: "Integrate a negative power and use a given value",
    build({ rng }) {
      let a, b, y0, C;
      do { a = rng.pick([1, 2, 3, -1]); b = 2 * rng.nonzero(-4, 4); y0 = rng.int(-6, 9); C = y0 - a + b; } while (C === 0);
      const opt = intOpt(""), fp = [[2 * a, "pow", 1], [b, "pow", -2]], f2 = 4 * a - b / 2 + C;
      return { params: { a, b, y0 }, stem: `The derivative of a function $f$ is $f'(x) = ${termsTex(fp)}$, for $x > 0$. It is given that $f(1) = ${y0}$.`, parts: [
        P("Which expression is $\\displaystyle\\int f'(x)\\,\\mathrm{d}x$?", 2, ans.choice(rng, opt([[a, "pow", 2], [-b, "pow", -1]]), [
          opt([[a, "pow", 2], [b, "pow", -1]], "Integrating $x^{-2}$ gives $-x^{-1}$, so the sign of that term changes."),
          opt([[2 * a, "pow", 0], [-2 * b, "pow", -3]], "This is the derivative of $f'(x)$, not its integral."),
          opt([[2 * a, "pow", 2], [-b, "pow", -1]], "When integrating, divide by the new power."), opt([[a, "pow", 2], [-b, "pow", -3]])]), [
          `Write $f'(x) = ${2 * a}x ${sg(b)} ${Math.abs(b)}x^{-2}$ and integrate each term: raise the power by one and divide by the new power.`,
          `$\\displaystyle\\int f'(x)\\,\\mathrm{d}x = ${a === 1 ? "" : a === -1 ? "-" : a}x^{2} ${sg(-b)} ${Math.abs(b)}x^{-1} + C = ${termsTex([[a, "pow", 2], [-b, "pow", -1]])} + C$`]),
        P("Find the value of the constant of integration for the function $f$.", 2, ans.int(C), [`$f(1) = ${y0}$ gives $${a} ${sg(-b)} ${Math.abs(b)} + C = ${y0}$`, `$C = ${C}$`]),
        P("Find $f(2)$.", 2, ans.int(f2), [`$f(x) = ${termsTex([[a, "pow", 2], [-b, "pow", -1], [C, "pow", 0]])}$`, `$f(2) = ${4 * a} ${sg(-b)} ${Math.abs(b) / 2} ${signed(C)} = ${f2}$`])] };
    } });

  // ======================= 5.6 the rules of differentiation: more ways to ask =======================
  const DR = { type: "t5-differentiation-rules", syllabus: ["5.6"], representation: "equation" };
  reg({ ...DR, unknown: "standard-terms", format: "mcq", levels: [1], skills: ["SL5.6.standard-derivatives"], title: "Derivatives of the standard functions",
    build({ rng }) {
      const a = rng.pick([2, 3, 4, 5, -2, -3]), b = rng.pick([2, 3, 4, 5, 6, -4]), fam = rng.int(0, 2), opt = termOpt("f'(x) = ");
      const X = [
        { f: [[a, "sin", 1], [b, "exp", 1]], d: [[a, "cos", 1], [b, "exp", 1]], rule: "The derivative of $\\sin x$ is $\\cos x$ and the derivative of $\\mathrm{e}^{x}$ is $\\mathrm{e}^{x}$.",
          w: [opt([[-a, "cos", 1], [b, "exp", 1]], "The derivative of $\\sin x$ is $\\cos x$, with no change of sign."), opt([[a, "cos", 1]], "The derivative of $\\mathrm{e}^{x}$ is $\\mathrm{e}^{x}$, not zero."), opt([[-a, "sin", 1], [b, "exp", 1]])] },
        { f: [[a, "cos", 1], [b, "ln", 1]], d: [[-a, "sin", 1], [b, "pow", -1]], rule: "The derivative of $\\cos x$ is $-\\sin x$ and the derivative of $\\ln x$ is $\\dfrac{1}{x}$.",
          w: [opt([[a, "sin", 1], [b, "pow", -1]], "The derivative of $\\cos x$ is $-\\sin x$."), opt([[-a, "sin", 1], [b, "ln", 1]], "The derivative of $\\ln x$ is $\\dfrac{1}{x}$."), opt([[-a, "sin", 1], [b, "pow", 0]])] },
        { f: [[a, "exp", 1], [b, "cos", 1]], d: [[a, "exp", 1], [-b, "sin", 1]], rule: "The derivative of $\\mathrm{e}^{x}$ is $\\mathrm{e}^{x}$ and the derivative of $\\cos x$ is $-\\sin x$.",
          w: [opt([[a, "exp", 1], [b, "sin", 1]], "The derivative of $\\cos x$ is $-\\sin x$."), opt([[-b, "sin", 1]], "The derivative of $\\mathrm{e}^{x}$ is $\\mathrm{e}^{x}$, not zero."), opt([[a, "exp", 1], [-b, "cos", 1]])] }][fam];
      return { params: { f: X.f }, stem: `Let $f(x) = ${termsTex(X.f)}$${fam === 1 ? ", for $x > 0$" : ""}.`, parts: [
        P("Which expression is $f'(x)$?", 2, ans.choice(rng, opt(X.d), X.w), [X.rule, `$f'(x) = ${termsTex(X.d)}$`])] };
    } });
  reg({ ...DR, unknown: "chain-function", format: "mcq", levels: [2], skills: ["SL5.6.chain-rule", "SL5.6.standard-derivatives"], title: "Chain rule with a sine and an exponential",
    build({ rng }) {
      const a = rng.pick([1, 2, 3, -2]), b = rng.int(2, 4), c = rng.pick([1, 2, 3, -1]), k = rng.pick([2, 3, -1, -2]), opt = termOpt("f'(x) = ");
      const f = [[a, "sin", b], [c, "exp", k]], d = [[a * b, "cos", b], [c * k, "exp", k]], v = a * b + c * k;
      return { params: { f }, stem: `Let $f(x) = ${termsTex(f)}$.`, parts: [
        P("Which expression is $f'(x)$?", 2, ans.choice(rng, opt(d), [
          opt([[a, "cos", b], [c, "exp", k]], "Each term must also be multiplied by the derivative of its inside function."),
          opt([[a * b, "sin", b], [c * k, "exp", k]], "The derivative of $\\sin u$ is $\\cos u$."),
          opt([[-a * b, "cos", b], [c * k, "exp", k]], "The derivative of $\\sin u$ is $\\cos u$, with no change of sign."), opt([[a * b, "cos", b], [c, "exp", k]])]), [
          `By the chain rule, the derivative of $\\sin ${b}x$ is $${b}\\cos ${b}x$ and the derivative of $${ek(k)}$ is $${coef(k, ek(k))}$.`, `$f'(x) = ${termsTex(d)}$`]),
        P("Find $f'(0)$.", 2, ans.int(v), [`$f'(0) = ${expr([[a * b, "\\cos 0"], [c * k, "\\mathrm{e}^{0}"]])}$`, `$\\cos 0 = 1$ and $\\mathrm{e}^{0} = 1$, so $f'(0) = ${v}$.`])] };
    } });
  reg({ ...DR, unknown: "quotient-linear", format: "value", levels: [2], skills: ["SL5.6.quotient-rule"], title: "Quotient rule for two linear expressions",
    build({ rng }) {
      let a, b, c, d, k, x0;
      do { a = rng.nonzero(-4, 4); b = rng.nonzero(-5, 5); c = rng.int(1, 3); d = rng.nonzero(-4, 4); k = a * d - b * c; x0 = rng.int(-2, 3); } while (k === 0 || c * x0 + d === 0 || Math.abs(c * x0 + d) > 5);
      const den = `\\left(${lin(c, d)}\\right)^{2}`, v = rat.Q(k, (c * x0 + d) ** 2);
      return { params: { a, b, c, d, x0 }, stem: `Let $f(x) = \\dfrac{${lin(a, b)}}{${lin(c, d)}}$, for $x \\ne ${frac(-d, c)}$. The derivative of $f$ can be written as $f'(x) = \\dfrac{k}{${den}}$, where $k$ is a constant.`, parts: [
        P("Find the value of $k$.", 3, ans.int(k), [`Let $u = ${lin(a, b)}$ and $v = ${lin(c, d)}$, so $u' = ${a}$ and $v' = ${c}$.`,
          `$f'(x) = \\dfrac{u'v - uv'}{v^{2}} = \\dfrac{${coef(a, `\\left(${lin(c, d)}\\right)`)} - ${coef(c, `\\left(${lin(a, b)}\\right)`)}}{${den}}$`,
          `The numerator is $${lin(a * c, a * d)} - \\left(${lin(a * c, b * c)}\\right) = ${k}$, so $k = ${k}$.`]),
        P(`Find $f'(${x0})$.`, 1, ans.frac(v.n, v.d), [`$f'(${x0}) = \\dfrac{${k}}{${br(c * x0 + d)}^{2}} = ${rat.tex(v)}$`])] };
    } });
  reg({ ...DR, syllabus: ["5.6", "5.8"], unknown: "gradient-product", format: "value", levels: [3], skills: ["SL5.6.product-rule", "SL5.6.show-derivative-form", "SL5.8.find-stationary-points"], title: "Product rule with an exponential, then the stationary point",
    build({ rng }) {
      let a, b, k, p, q;
      do { a = rng.int(1, 3); b = rng.nonzero(-4, 4); k = rng.pick([2, 3, -1, -2]); p = a * k; q = b * k + a; } while (q === 0);
      const e = ek(k), st = rat.Q(-q, p);
      return { params: { a, b, k }, stem: `Let $f(x) = \\left(${lin(a, b)}\\right)${e}$. The derivative of $f$ can be written as $f'(x) = (px + q)${e}$, where $p$ and $q$ are constants.`, parts: [
        P("Find the value of $p$.", 3, ans.int(p), [`Let $u = ${lin(a, b)}$ and $v = ${e}$, so $u' = ${a}$ and $v' = ${coef(k, e)}$.`,
          `$f'(x) = u'v + uv' = ${coef(a, e)} ${sg(k)} ${coef(Math.abs(k), `\\left(${lin(a, b)}\\right)${e}`)}$`, `$f'(x) = \\left(${lin(p, q)}\\right)${e}$, so $p = ${p}$.`]),
        P("Write down the value of $q$.", 1, ans.int(q), [`From the same line, $q = ${q}$.`]),
        P("Find the $x$-coordinate of the stationary point of the graph of $f$.", 2, ans.frac(st.n, st.d), [`$f'(x) = 0$ and $${e}$ is never zero, so $${lin(p, q)} = 0$.`, `$x = ${rat.tex(st)}$`])] };
    } });

  // ======================= 5.7 the second derivative: more ways to ask =======================
  const CV = { type: "t5-concavity", syllabus: ["5.7"], representation: "equation" };
  reg({ ...CV, unknown: "second-derivative", format: "value", levels: [1], skills: ["SL5.7.find-second-derivative"], title: "Second derivative of a cubic",
    build({ rng }) {
      const a = rng.pick([1, 2, 3, -1, -2]), b = rng.nonzero(-5, 5), c = rng.int(-6, 6), d = rng.int(-5, 5);
      return { params: { a, b, c, d }, stem: `Let $f(x) = ${poly([a, b, c, d])}$. The second derivative of $f$ can be written as $f''(x) = px + q$, where $p$ and $q$ are constants.`, parts: [
        P("Write down the value of $p$.", 1, ans.int(6 * a), [`$f'(x) = ${poly([3 * a, 2 * b, c])}$`, `$f''(x) = ${lin(6 * a, 2 * b)}$, so $p = ${6 * a}$.`]),
        P("Write down the value of $q$.", 1, ans.int(2 * b), [`$q = ${2 * b}$`])] };
    } });
  reg({ ...CV, unknown: "second-derivative-value", format: "value", levels: [2], skills: ["SL5.7.find-second-derivative", "SL5.7.concavity"], title: "Second derivative of a cubic and where it is concave up or down",
    build({ rng }) {
      const a = rng.pick([1, 2, -1, -2]), k = rng.nonzero(-3, 3), c = rng.int(-6, 6), b = -3 * a * k, up = a > 0, rel = up ? ">" : "<";
      let x1;
      do { x1 = rng.int(-2, 3); } while (x1 === k);
      const v = 6 * a * x1 + 2 * b;
      return { params: { a, b, c, x1, up }, stem: `Let $f(x) = ${poly([a, b, c, 0])}$, for $x \\in \\mathbb{R}$.`, parts: [
        P(`Find $f''(${x1})$.`, 2, ans.int(v), [`$f'(x) = ${poly([3 * a, 2 * b, c])}$`, `$f''(x) = ${lin(6 * a, 2 * b)}$, so $f''(${x1}) = ${6 * a}${br(x1)} ${signed(2 * b)} = ${v}$`]),
        P(`The graph of $f$ is concave ${up ? "up" : "down"} for $x > k$. Find the value of $k$.`, 2, ans.int(k), [
          `The graph is concave ${up ? "up" : "down"} where $f''(x) ${rel} 0$: $${lin(6 * a, 2 * b)} ${rel} 0$`,
          up ? `$${coef(6 * a, "x")} > ${-2 * b}$, so $x > ${k}$.` : `$${coef(6 * a, "x")} < ${-2 * b}$, and dividing by the negative number $${6 * a}$ reverses the inequality: $x > ${k}$.`, `$k = ${k}$`])] };
    } });

  // ======================= 5.9 kinematics: more ways to ask =======================
  const KM = { type: "t5-kinematics-motion", syllabus: ["5.9"], representation: "equation", format: "value" };
  const MOVES = "A particle moves in a straight line.";
  reg({ ...KM, unknown: "velocity-expression", levels: [1], skills: ["SL5.9.velocity-acceleration"], title: "Velocity from displacement",
    build({ rng }) {
      const a = rng.int(1, 6), b = rng.nonzero(-9, 9);
      return { params: { a, b }, stem: `${MOVES} Its displacement, $s$ metres, from a fixed point $\\mathrm{O}$ at time $t$ seconds is $s(t) = ${poly([a, b, 0], "t")}$, for $t \\ge 0$. Its velocity, in $\\text{m s}^{-1}$, is $v(t) = pt + q$, where $p$ and $q$ are constants.`, parts: [
        P("Write down the value of $p$.", 1, ans.int(2 * a), [`Velocity is the rate of change of displacement: $v(t) = s'(t) = ${lin(2 * a, b, "t")}$`, `$p = ${2 * a}$`]),
        P("Write down the value of $q$.", 1, ans.int(b), [`$q = ${b}$`])] };
    } });
  reg({ ...KM, unknown: "velocity-at-time", levels: [2], skills: ["SL5.9.velocity-acceleration"], title: "Velocity and acceleration from displacement",
    build({ rng }) {
      const a = rng.int(1, 2), b = rng.nonzero(-6, 6), c = rng.int(0, 8), t1 = rng.int(1, 4), v = 3 * a * t1 * t1 + 2 * b * t1 + c, acc = 6 * a * t1 + 2 * b;
      return { params: { a, b, c, t1 }, stem: `${MOVES} Its displacement, $s$ metres, from a fixed point $\\mathrm{O}$ at time $t$ seconds is $s(t) = ${poly([a, b, c, 0], "t")}$, for $t \\ge 0$.`, parts: [
        P(`Find the velocity of the particle, in $\\text{m s}^{-1}$, when $t = ${t1}$.`, 2, ans.int(v), [`$v(t) = s'(t) = ${poly([3 * a, 2 * b, c], "t")}$`, `$v(${t1}) = ${expr([[3 * a, `${br(t1)}^{2}`], [2 * b, br(t1)], [c, ""]])} = ${v}$`]),
        P(`Find the acceleration of the particle, in $\\text{m s}^{-2}$, when $t = ${t1}$.`, 2, ans.int(acc), [`$a(t) = v'(t) = ${lin(6 * a, 2 * b, "t")}$`, `$a(${t1}) = ${6 * a}${br(t1)} ${signed(2 * b)} = ${acc}$`])] };
    } });
  reg({ ...KM, unknown: "first-at-rest", levels: [2], skills: ["SL5.9.rest-and-direction", "SL5.9.velocity-acceleration"], title: "When a particle is first at rest",
    build({ rng }) {
      const a = rng.int(1, 3), p = rng.int(1, 4), q = p + rng.int(1, 4), acc = a * (p - q);
      return { params: { a, p, q }, stem: `${MOVES} Its velocity, $v\\text{ m s}^{-1}$, at time $t$ seconds is $v(t) = ${poly([a, -a * (p + q), a * p * q], "t")}$, for $t \\ge 0$.`, parts: [
        P("Find the time at which the particle is first instantaneously at rest.", 2, ans.int(p), [
          `The particle is at rest when $v(t) = 0$: $${a === 1 ? "" : a}${factor(p, "t")}${factor(q, "t")} = 0$`, `$t = ${p}$ or $t = ${q}$, so it is first at rest when $t = ${p}$.`]),
        P("Find the acceleration of the particle, in $\\text{m s}^{-2}$, at this time.", 2, ans.int(acc), [`$a(t) = v'(t) = ${lin(2 * a, -a * (p + q), "t")}$`, `$a(${p}) = ${2 * a}${br(p)} - ${a * (p + q)} = ${acc}$`])] };
    } });

  // ======================= 5.10 integration by recognition, and trigonometric antiderivatives =======================
  reg({ ...II, syllabus: ["5.10", "5.11"], unknown: "inspection-power", format: "value", levels: [3], skills: ["SL5.10.inspection-substitution", "SL5.10.hence-from-derivative", "SL5.11.evaluate-definite"], title: "Integrate by recognising a derivative, then evaluate",
    build({ rng }) {
      const n = rng.int(2, 3), c = rng.int(1, 3), A = rng.pick([rat.Q(1, 2), rat.Q(3), rat.Q(2), rat.Q(3, 2)]), k = rat.num(rat.mul(A, 2 * (n + 1))), inner = `\\left(x^{2} + ${c}\\right)`;
      const val = rat.mul(A, (1 + c) ** (n + 1) - c ** (n + 1)), integrand = `${k}x${inner}^{${n}}`;
      return { params: { n, c, k }, stem: `Let $g(x) = ${inner}^{${n + 1}}$.`, parts: [
        P(`The derivative of $g$ can be written as $g'(x) = px${inner}^{${n}}$. Find the value of $p$.`, 2, ans.int(2 * (n + 1)), [
          `By the chain rule, $g'(x) = ${n + 1}${inner}^{${n}} \\times 2x = ${2 * (n + 1)}x${inner}^{${n}}$`, `$p = ${2 * (n + 1)}$`]),
        P(`It follows that $\\displaystyle\\int ${integrand}${dx} = A${inner}^{${n + 1}} + C$, where $A$ is a constant. Find the value of $A$.`, 2, ans.frac(A.n, A.d), [
          `$${integrand} = ${rat.tex(A)} \\times g'(x)$, because $${rat.tex(A)} \\times ${2 * (n + 1)} = ${k}$.`, `Integrating $g'(x)$ gives $g(x)$, so $A = ${rat.tex(A)}$.`]),
        P(`Hence find the value of $\\displaystyle\\int_{0}^{1} ${integrand}${dx}$.`, 3, ans.frac(val.n, val.d), [
          `$\\displaystyle\\int_{0}^{1} ${integrand}${dx} = \\left[${coef(A, `${inner}^{${n + 1}}`)}\\right]_{0}^{1}$`, `$= ${coef(A, `${br(1 + c)}^{${n + 1}}`)} - ${coef(A, `${br(c)}^{${n + 1}}`)}$`, `$= ${rat.tex(val)}$`])] };
    } });
  reg({ ...AC, syllabus: ["5.10"], unknown: "trig-chain", format: "mcq", levels: [3], skills: ["SL5.10.find-function-from-derivative", "SL5.10.linear-composites", "SL5.10.standard-integrals"], title: "Find a function from a trigonometric derivative and a value",
    build({ rng }) {
      const b = rng.int(2, 4), j = rng.pick([1, 2, 3, -1, -2]), k = rng.pick([1, 2, 3, 4, 6]), c0 = rng.nonzero(-5, 5), a = b * j;
      const fp = [[a, "cos", b], [k, "pow", 0]], right = [[j, "sin", b], [k, "pow", 1], [c0, "pow", 0]], opt = termOpt("f(x) = ");
      const xq = piFrac(1, 2 * b), v = j + (k * Math.PI) / (2 * b) + c0, tex = `${piFrac(k, 2 * b)} ${signed(j + c0)}`.trim();
      return { params: { fp, c0, b }, stem: `The derivative of a function $f$ is $f'(x) = ${termsTex(fp)}$. It is given that $f(0) = ${c0}$.`, parts: [
        P("Which expression is $f(x)$?", 3, ans.choice(rng, opt(right), [
          opt([[a, "sin", b], [k, "pow", 1], [c0, "pow", 0]], `Integrating $\\cos ${b}x$ divides by $${b}$.`),
          opt([[-j, "sin", b], [k, "pow", 1], [c0, "pow", 0]], "The integral of $\\cos u$ is $\\sin u$, with no change of sign."),
          opt([[j, "sin", b], [k, "pow", 1]], `A constant of integration is needed so that $f(0) = ${c0}$.`), opt([[a * b, "sin", b], [k, "pow", 1], [c0, "pow", 0]])]), [
          `$f(x) = \\displaystyle\\int \\left(${termsTex(fp)}\\right)${dx} = ${termsTex([[j, "sin", b], [k, "pow", 1]])} + C$`, `$f(0) = ${c0}$ and $\\sin 0 = 0$, so $C = ${c0}$.`, `$f(x) = ${termsTex(right)}$`]),
        P(`Find the exact value of $f\\left(${xq}\\right)$.`, 3, ans.exact(v, tex), [
          `$f\\left(${xq}\\right) = ${expr([[j, "\\sin\\left(\\dfrac{\\pi}{2}\\right)"], [k, `\\left(${xq}\\right)`], [c0, ""]])}$`, `$\\sin\\left(\\dfrac{\\pi}{2}\\right) = 1$, so $f\\left(${xq}\\right) = ${tex}$`])] };
    } });

  // ======================= 5.7 concavity, and matching f with its derivative =======================
  const f2Opt = (cs, why) => ({ text: m(`f''(x) = ${poly(cs)}`), value: cs, why });
  reg({ ...CV, unknown: "concave-interval", format: "mcq", levels: [3], skills: ["SL5.7.find-second-derivative", "SL5.7.concavity", "SL5.8.points-of-inflexion"], title: "Concavity and points of inflexion of a quartic",
    build({ rng }) {
      let p, q, c, d;
      do { p = rng.int(-2, 2); q = p + rng.int(1, 3); c = rng.int(-4, 4); d = rng.int(-3, 3); } while (p * q === 0 || p + q === 0 || q > 3);
      const S = p + q, Pq = p * q, f = (x) => x ** 4 - 2 * S * x ** 3 + 6 * Pq * x * x + c * x + d;
      return { params: { S, Pq, c, d }, stem: `Let $f(x) = ${poly([1, -2 * S, 6 * Pq, c, d])}$, for $x \\in \\mathbb{R}$.`, parts: [
        P("Which expression is $f''(x)$?", 2, ans.choice(rng, f2Opt([12, -12 * S, 12 * Pq]), [
          f2Opt([4, -6 * S, 12 * Pq, c], "This is $f'(x)$. Differentiate once more."), f2Opt([12, -6 * S, 12 * Pq], "The term in $x^{2}$ of $f'(x)$ must be multiplied by its power."),
          f2Opt([12, -12 * S, 6 * Pq]), f2Opt([12, -12 * S, 12 * Pq + c])]), [`$f'(x) = ${poly([4, -6 * S, 12 * Pq, c])}$`, `$f''(x) = ${poly([12, -12 * S, 12 * Pq])}$`]),
        P("The graph of $f$ is concave down for $a < x < b$. Find the value of $a$.", 2, ans.int(p), [
          "The graph is concave down where $f''(x) < 0$.", `$f''(x) = 12\\left(${poly([1, -S, Pq])}\\right) = 12${factor(p)}${factor(q)}$`, `$f''(x) < 0$ between its zeros, so $${p} < x < ${q}$ and $a = ${p}$.`]),
        P("Write down the value of $b$.", 1, ans.int(q), [`$b = ${q}$`]),
        P("Find the $y$-coordinate of the left-hand point of inflexion of the graph of $f$.", 2, ans.int(f(p)), [
          `$f''(x)$ changes sign at $x = ${p}$, so there is a point of inflexion there.`, `$f(${p}) = ${expr([[1, `${br(p)}^{4}`], [-2 * S, `${br(p)}^{3}`], [6 * Pq, `${br(p)}^{2}`], [c, br(p)], [d, ""]])} = ${f(p)}$`])] };
    } });
  reg({ ...CV, syllabus: ["5.7", "5.6"], unknown: "concave-exponential", format: "mcq", levels: [3], skills: ["SL5.7.find-second-derivative", "SL5.7.concavity", "SL5.6.product-rule"], title: "Concavity of a product with an exponential",
    build({ rng }) {
      let j, s, q;
      do { j = rng.nonzero(-6, 6); s = rng.sign(); q = j + 2 * s; } while (q === 0);
      const e = ek(s), d0 = s * j + 1, first = `\\left(${lin(s, d0)}\\right)${e}`;
      return { params: { j, s }, stem: `Let $f(x) = ${factor(-j)}${e}$. The second derivative of $f$ can be written as $f''(x) = (x + q)${e}$, where $q$ is a constant.`, parts: [
        P("Find $f'(0)$.", 2, ans.int(d0), [`By the product rule, $f'(x) = ${e} ${sg(s)} ${factor(-j)}${e} = ${first}$`, `$f'(0) = ${d0}$`]),
        P("Find the value of $q$.", 2, ans.int(q), [`Differentiate again with the product rule: $f''(x) = ${coef(s, e)} ${sg(s)} ${first}$`, `$f''(x) = \\left(${lin(1, q)}\\right)${e}$, so $q = ${q}$.`]),
        P("Find the $x$-coordinate of the point of inflexion of the graph of $f$.", 1, ans.int(-q), [`$f''(x) = 0$ when $x = ${-q}$, and $f''(x)$ changes sign there.`]),
        P("For which values of $x$ is the graph of $f$ concave up?", 1, ans.choice(rng, { text: `$x > ${-q}$`, value: ["gt", -q] }, [
          { text: `$x < ${-q}$`, value: ["lt", -q], why: "The graph is concave up where $f''(x) > 0$." }, { text: `$x > ${q}$`, value: ["gt", q], why: "Solve $x + q > 0$ carefully." }, { text: `$x < ${q}$`, value: ["lt", q] }]), [
          `$${e} > 0$ for all $x$, so $f''(x) > 0$ when $${lin(1, q)} > 0$, that is when $x > ${-q}$.`])] };
    } });
  const parab = (a2, r1, r2) => ({ type: "poly", coeffs: [a2 * r1 * r2, -a2 * (r1 + r2), a2] });
  reg({ ...CV, syllabus: ["5.7", "5.2"], unknown: "match-derivative", representation: "graph", format: "graph-pick", levels: [2], skills: ["SL5.7.sketch-match-graphs", "SL5.2.sign-from-graph"], title: "Pick the graph of the derivative",
    build({ rng }) {
      const d = rng.pick([1, 2]), mid = rng.int(-1, 1), s = rng.sign(), A = s * (d === 1 ? 3 : 0.75), k0 = rng.int(-1, 1);
      const W = (fn, alt) => win([-5, 5], [-6, 6], { functions: [{ fn }], alt });
      const right = { graph: W(parab(A, mid - d, mid + d), "A parabola crossing the x-axis twice"), value: "derivative" };
      const wrongs = G.pickDistinct(right.graph, [
        { graph: W(parab(-A, mid - d, mid + d), "A parabola crossing the x-axis twice"), value: "negative", why: "Where $f$ is increasing, $f'(x)$ must be positive." },
        { graph: W(parab(A, mid, mid + 2 * d), "A parabola crossing the x-axis twice"), value: "shifted", why: "The zeros of $f'$ must be at the $x$-coordinates of the turning points of $f$." },
        { graph: W({ type: "poly", coeffs: [-2 * A * mid, 2 * A] }, "A straight line"), value: "line", why: "The derivative of a cubic is a quadratic, so its graph is a parabola." },
        { graph: W(parab(A, mid, mid), "A parabola touching the x-axis"), value: "touching", why: "$f$ has two turning points, so $f'$ has two zeros." }], 3);
      const xmax = s > 0 ? mid - d : mid + d;
      return { params: { d, mid },
        graph: W({ type: "transform", of: { type: "poly", coeffs: [0, -d * d, 0, 1 / 3] }, a: A, h: mid, k: k0 }, "A cubic curve with a local maximum and a local minimum"),
        stem: "The diagram shows the graph of $y = f(x)$, where $f$ is a cubic function. The turning points and the point of inflexion of the graph have integer $x$-coordinates.", parts: [
          P("Which graph shows $y = f'(x)$?", 2, ans.graph(rng, right, wrongs), [
            `$f$ has turning points at $x = ${mid - d}$ and $x = ${mid + d}$, so $f'(x) = 0$ there.`,
            `Between them $f$ is ${s > 0 ? "decreasing" : "increasing"}, so $f'(x)$ is ${s > 0 ? "negative" : "positive"}; outside them $f'(x)$ is ${s > 0 ? "positive" : "negative"}.`]),
          P("Write down the $x$-coordinate of the local maximum point of the graph of $f$.", 1, ans.int(xmax), [`The graph rises to a turning point and then falls at $x = ${xmax}$.`]),
          P("Write down the $x$-coordinate of the point of inflexion of the graph of $f$.", 1, ans.int(mid), [`The graph changes from concave ${s > 0 ? "down" : "up"} to concave ${s > 0 ? "up" : "down"} halfway between the turning points, at $x = ${mid}$.`])] };
    } });
  reg({ type: "t5-derivative-graph", syllabus: ["5.7", "5.8", "5.2"], unknown: "extremum-from-derivative", representation: "graph", format: "value", levels: [2], skills: ["SL5.7.f-from-derivative-graph", "SL5.2.sign-from-graph"], title: "Turning points and inflexion of f from the graph of its derivative",
    build({ rng }) {
      let a, b;
      do { a = rng.int(-4, 2); b = a + rng.pick([2, 4]); } while (b > 4);
      const s = rng.sign(), sc = s * (b - a === 2 ? rng.pick([1, 2]) : rng.pick([0.5, 1])), xmax = s > 0 ? a : b, xmin = s > 0 ? b : a, mid = (a + b) / 2;
      return { params: { s },
        graph: win([-6, 6], [-6, 6], { functions: [{ fn: parab(sc, a, b) }], alt: "A parabola, the graph of the derivative of f, crossing the x-axis twice" }),
        stem: "The diagram shows the graph of $y = f'(x)$, where $f'$ is the derivative of a function $f$. The graph crosses the $x$-axis at two points with integer coordinates, and its vertex has an integer $x$-coordinate.", parts: [
          P("Find the $x$-coordinate of the local maximum point of the graph of $f$.", 2, ans.int(xmax), [`$f$ has stationary points where $f'(x) = 0$: at $x = ${a}$ and $x = ${b}$.`,
            `At $x = ${xmax}$, $f'(x)$ changes from positive to negative, so $f$ changes from increasing to decreasing. This is the local maximum.`]),
          P("Write down the $x$-coordinate of the local minimum point of the graph of $f$.", 1, ans.int(xmin), [`At $x = ${xmin}$, $f'(x)$ changes from negative to positive, so this is the local minimum.`]),
          P("Write down the $x$-coordinate of the point of inflexion of the graph of $f$.", 1, ans.int(mid), [`A point of inflexion of $f$ is where $f'$ has a turning point: the vertex of the graph shown, at $x = ${mid}$.`])] };
    } });

  // ======================= 5.8 stationary points, inflexion and optimisation: more ways to ask =======================
  reg({ ...SP, syllabus: ["5.8"], representation: "words", format: "mcq", unknown: "nature", levels: [1], skills: ["SL5.8.find-stationary-points", "SL5.8.classify-stationary-points"], title: "A stationary point and its nature from a linear derivative",
    build({ rng }) {
      const a = rng.pick([1, 2, 3, -1, -2, -3]), h = rng.nonzero(-6, 6), mm = 2 * a, c = -2 * a * h, kind = (v) => (v > 0 ? "A local minimum" : "A local maximum");
      return { params: { mm, c }, stem: `A function $f$ has derivative $f'(x) = ${lin(mm, c)}$. The graph of $f$ has one stationary point.`, parts: [
        P("Write down the $x$-coordinate of the stationary point.", 1, ans.int(h), [`$f'(x) = 0$ gives $${lin(mm, c)} = 0$, so $x = ${h}$.`]),
        P("What kind of stationary point is it?", 1, ans.choice(rng, { text: kind(a), value: Math.sign(a) }, [
          { text: kind(-a), value: -Math.sign(a), why: "A positive second derivative means a local minimum; a negative one means a local maximum." }, { text: "A point of inflexion", value: 0, why: "At a point of inflexion the second derivative is zero and changes sign." }]), [
          `$f''(x) = ${mm}$, which is ${a > 0 ? "positive" : "negative"}, so the point is ${a > 0 ? "a local minimum" : "a local maximum"}.`])] };
    } });
  reg({ ...SP, syllabus: ["5.8", "5.7"], format: "value", unknown: "inflexion-point", levels: [3], skills: ["SL5.8.points-of-inflexion", "SL5.7.find-second-derivative"], title: "Point of inflexion of a cubic",
    build({ rng }) {
      const a = rng.pick([1, 2, -1]), mI = rng.nonzero(-3, 3), c = rng.int(-6, 6), d = rng.int(-5, 5), b = -3 * a * mI;
      const f = (x) => a * x ** 3 + b * x * x + c * x + d, g = 3 * a * mI * mI + 2 * b * mI + c;
      return { params: { a, b, c, d }, stem: `Let $f(x) = ${poly([a, b, c, d])}$, for $x \\in \\mathbb{R}$. The graph of $f$ has one point of inflexion.`, parts: [
        P("Find the $x$-coordinate of the point of inflexion.", 3, ans.int(mI), [`$f'(x) = ${poly([3 * a, 2 * b, c])}$`, `$f''(x) = ${lin(6 * a, 2 * b)}$`, `$f''(x) = 0$ when $x = ${mI}$, and $f''(x)$ changes sign there, so the point of inflexion is at $x = ${mI}$.`]),
        P("Find the $y$-coordinate of the point of inflexion.", 2, ans.int(f(mI)), [`$f(${mI}) = ${expr([[a, `${br(mI)}^{3}`], [b, `${br(mI)}^{2}`], [c, br(mI)], [d, ""]])}$`, `$f(${mI}) = ${f(mI)}$`]),
        P("Find the gradient of the graph of $f$ at the point of inflexion.", 2, ans.int(g), [`$f'(${mI}) = ${expr([[3 * a, `${br(mI)}^{2}`], [2 * b, br(mI)], [c, ""]])} = ${g}$`])] };
    } });
  const OM = { type: "t5-optimisation-modelling", syllabus: ["5.8"], representation: "words", format: "value", skills: ["SL5.8.optimisation-modelling"] };
  reg({ ...OM, unknown: "box-best-cut", levels: [4], calculator: true, title: "Largest open box cut from a sheet of card",
    build({ rng }) {
      let a, b;
      do { a = rng.pick([12, 15, 16, 18, 20, 21, 24]); b = a + rng.pick([4, 5, 6, 8, 10, 12]); } while (Number.isInteger(Math.sqrt(a * a - a * b + b * b)));
      const root = Math.sqrt(a * a - a * b + b * b), x = (a + b - root) / 6, x2 = (a + b + root) / 6, V = (t) => t * (a - 2 * t) * (b - 2 * t), full = poly([4, -2 * (a + b), a * b, 0]);
      return { params: { a, b }, stem: `A rectangular sheet of card measures $${unit(a, "cm")}$ by $${unit(b, "cm")}$. A square of side $x\\text{ cm}$ is cut from each corner, and the sides are folded up to make an open box with volume $V\\text{ cm}^{3}$.`, parts: [
        P(`Show that $V = ${full}$.`, 2, ans.self(`The base measures $${a} - 2x$ by $${b} - 2x$ and the height is $x$, so $V = x(${a} - 2x)(${b} - 2x) = ${full}$.`), [
          `Cutting out the squares leaves a base that measures $${a} - 2x$ by $${b} - 2x$, and the height of the box is $x$.`, `$V = x(${a} - 2x)(${b} - 2x) = x\\left(${poly([4, -2 * (a + b), a * b])}\\right) = ${full}$`]),
        P("Find the value of $x$ for which the volume of the box is greatest.", 3, ans.sf(x), [`$\\dfrac{\\mathrm{d}V}{\\mathrm{d}x} = ${poly([12, -4 * (a + b), a * b])}$`,
          `Solve $\\dfrac{\\mathrm{d}V}{\\mathrm{d}x} = 0$ on the GDC: $x \\approx ${sf(x)}$ or $x \\approx ${sf(x2)}$.`, `The squares must fit on the sheet, so $0 < x < ${num(a / 2)}$. Only $x \\approx ${sf(x)}$ is possible, and it gives the greatest volume.`]),
        P("Find the greatest volume of the box, in cubic centimetres.", 2, ans.sf(V(x)), [`Substitute the unrounded value of $x$: $V \\approx ${sf(V(x))}$`])] };
    } });
  reg({ ...OM, unknown: "optimum-value", levels: [3], title: "Least surface area of a box with a fixed volume",
    build({ rng }) {
      const open = rng.bool(), k = open ? rng.int(1, 5) : rng.int(2, 5), V = open ? 4 * k ** 3 : k ** 3, x = open ? 2 * k : k, c2 = open ? 1 : 2, least = c2 * x * x + (4 * V) / x;
      const sq = coef(c2, "x^{2}"), Sx = `${sq} + \\dfrac{${4 * V}}{x}`;
      return { params: { open, V }, stem: `${open ? "An open box (with no lid)" : "A closed box"} has a square base of side $x\\text{ cm}$ and height $h\\text{ cm}$. The volume of the box is $${unit(V, "cm")}^{3}$. The total area of ${open ? "its base and four sides" : "its six faces"} is $S\\text{ cm}^{2}$.`, parts: [
        P(`Show that $S = ${Sx}$.`, 2, ans.self(`$x^{2}h = ${V}$, so $h = \\dfrac{${V}}{x^{2}}$ and $S = ${sq} + 4xh = ${Sx}$.`), [
          `The volume is $x^{2}h = ${V}$, so $h = \\dfrac{${V}}{x^{2}}$.`, `$S = ${sq} + 4xh = ${sq} + 4x \\times \\dfrac{${V}}{x^{2}} = ${Sx}$`]),
        P("Find the value of $x$ for which $S$ is least.", 3, ans.int(x), [`$\\dfrac{\\mathrm{d}S}{\\mathrm{d}x} = ${coef(2 * c2, "x")} - \\dfrac{${4 * V}}{x^{2}}$`,
          `$\\dfrac{\\mathrm{d}S}{\\mathrm{d}x} = 0$ gives $${coef(2 * c2, "x^{3}")} = ${4 * V}$, so $x^{3} = ${(4 * V) / (2 * c2)}$ and $x = ${x}$.`,
          `$\\dfrac{\\mathrm{d}^{2}S}{\\mathrm{d}x^{2}} = ${2 * c2} + \\dfrac{${8 * V}}{x^{3}} > 0$ for $x > 0$, so this is a minimum.`]),
        P("Find the least value of $S$.", 2, ans.int(least), [`$S = ${coef(c2, `${br(x)}^{2}`)} + \\dfrac{${4 * V}}{${x}} = ${least}$`])] };
    } });
  reg({ type: "t5-ext-closed-interval-extremes", syllabus: ["5.8"], unknown: "greatest-least", representation: "equation", format: "value", levels: [3], skills: ["SL5.8.closed-interval-extremes", "SL5.8.find-stationary-points"], title: "Greatest and least values on a closed interval",
    build({ rng }) {
      const p = rng.int(-2, 1), q = p + rng.int(1, 3), lo = p - rng.int(1, 2), hi = q + rng.int(1, 2), c = rng.int(-5, 5);
      const f = (x) => 2 * x ** 3 - 3 * (p + q) * x * x + 6 * p * q * x + c, vals = [lo, p, q, hi].map(f), big = Math.max(...vals), small = Math.min(...vals);
      return { params: { p, q, lo, hi, c }, stem: `Let $f(x) = ${poly([2, -3 * (p + q), 6 * p * q, c])}$, for $${lo} \\le x \\le ${hi}$.`, parts: [
        P("Find the smaller of the $x$-coordinates of the stationary points of the graph of $f$.", 2, ans.int(p), [`$f'(x) = ${poly([6, -6 * (p + q), 6 * p * q])} = 6${factor(p)}${factor(q)}$`, `$f'(x) = 0$ when $x = ${p}$ or $x = ${q}$. The smaller is $${p}$.`]),
        P("Write down the larger of these $x$-coordinates.", 1, ans.int(q), [`The larger is $x = ${q}$.`]),
        P("Find the greatest value of $f$ on this interval.", 2, ans.int(big), ["The greatest and least values are at stationary points or at the ends of the interval.",
          `$f(${lo}) = ${vals[0]}$, $f(${p}) = ${vals[1]}$, $f(${q}) = ${vals[2]}$ and $f(${hi}) = ${vals[3]}$.`, `The greatest of these is $${big}$.`]),
        P("Find the least value of $f$ on this interval.", 2, ans.int(small), [`From the same four values, the least is $${small}$.`])] };
    } });
  reg({ type: "t5-ext-stationary-conditions", syllabus: ["5.8"], unknown: "k-from-stationary-x", representation: "equation", format: "value", levels: [2], skills: ["SL5.8.stationary-point-conditions", "SL5.8.find-stationary-points"], title: "Find a constant from the position of a stationary point",
    build({ rng }) {
      const a = rng.int(1, 2), h = rng.nonzero(-3, 3), c = rng.int(-6, 6), k = -3 * a * h * h, y = a * h ** 3 + k * h + c;
      return { params: { a, h, c }, stem: `Let $f(x) = ${expr([[a, "x^{3}"], [1, "kx"], [c, ""]])}$, where $k$ is a constant. The graph of $f$ has a stationary point where $x = ${h}$.`, parts: [
        P("Find the value of $k$.", 2, ans.int(k), [`$f'(x) = ${coef(3 * a, "x^{2}")} + k$`, `$f'(${h}) = 0$ gives $${3 * a}${br(h)}^{2} + k = 0$, so $k = ${k}$.`]),
        P("Find the $y$-coordinate of this stationary point.", 1, ans.int(y), [`$f(${h}) = ${expr([[a, `${br(h)}^{3}`], [k, br(h)], [c, ""]])} = ${y}$`]),
        P("Write down the $x$-coordinate of the other stationary point of the graph of $f$.", 1, ans.int(-h), [`$f'(x) = ${poly([3 * a, 0, k])} = 0$ gives $x^{2} = ${h * h}$, so the other stationary point is at $x = ${-h}$.`])] };
    } });

  // ======================= 5.9 distance travelled =======================
  const KD = { type: "t5-kinematics-distance", syllabus: ["5.9", "5.11"] };
  reg({ ...KD, unknown: "total-distance-split", representation: "equation", format: "value", levels: [3], skills: ["SL5.9.total-distance", "SL5.9.displacement-from-velocity", "SL5.9.rest-and-direction"], title: "Displacement and total distance when a particle turns round",
    build({ rng }) {
      const c = rng.int(1, 2), k = rng.int(1, 3), T = 2 * k + rng.int(1, 2), r = 2 * k;
      const S = (t) => c * (t ** 3 - 3 * k * t * t), back = -S(r), fwd = S(T) - S(r), anti = poly([c, -3 * c * k, 0, 0], "t"), vI = (lo, hi) => `\\displaystyle\\int_{${lo}}^{${hi}} v(t)\\,\\mathrm{d}t`;
      return { params: { c, k, T }, stem: `${MOVES} Its velocity, $v\\text{ m s}^{-1}$, at time $t$ seconds is $v(t) = ${poly([3 * c, -6 * c * k, 0], "t")}$, for $0 \\le t \\le ${T}$.`, parts: [
        P("Find the value of $t$, with $t > 0$, at which the particle is instantaneously at rest.", 2, ans.int(r), [`$v(t) = 0$ gives $${3 * c}t${factor(r, "t")} = 0$`, `$t = 0$ or $t = ${r}$, so the particle is at rest when $t = ${r}$.`]),
        P(`Find the displacement of the particle, in metres, from its starting position when $t = ${T}$.`, 2, ans.int(S(T)), [`$${vI(0, T)} = \\left[${anti}\\right]_{0}^{${T}}$`, `$= ${S(T)}$`]),
        P(`Find the total distance, in metres, travelled by the particle for $0 \\le t \\le ${T}$.`, 3, ans.int(back + fwd), [
          `The particle changes direction at $t = ${r}$, so work out the two parts of the motion separately.`,
          `$${vI(0, r)} = ${-back}$ and $${vI(r, T)} = ${S(T)} - ${paren(S(r))} = ${fwd}$`, `Total distance: $${back} + ${fwd} = ${back + fwd}$`])] };
    } });
  reg({ ...KD, syllabus: ["5.9"], unknown: "total-distance-gdc", representation: "equation", format: "value", levels: [4], calculator: true, skills: ["SL5.9.total-distance", "SL5.9.rest-and-direction", "SL5.9.velocity-acceleration"], title: "Rest, acceleration and total distance with the GDC",
    build({ rng }) {
      const a = rng.int(3, 6), b = rng.pick([0.5, 0.8, 1.2, 1.5]), c = rng.int(1, 2), T = 6, t0 = rng.int(1, 3), al = Math.asin(c / a);
      const V = (t) => -(a / b) * Math.cos(b * t) - c * t, roots = [];
      for (let n = 0; n < 4; n++) roots.push((al + 2 * Math.PI * n) / b, (Math.PI - al + 2 * Math.PI * n) / b);
      const cuts = [0, ...roots.filter((t) => t > 0 && t < T).sort((x, y) => x - y), T];
      let dist = 0;
      for (let i = 1; i < cuts.length; i++) dist += Math.abs(V(cuts[i]) - V(cuts[i - 1]));
      const acc = a * b * Math.cos(b * t0), vt = `${a}\\sin(${num(b)}t) - ${c}`;
      return { params: { a, b, c, T, t0 }, stem: `${MOVES} Its velocity, $v\\text{ m s}^{-1}$, at time $t$ seconds is $v(t) = ${vt}$, for $0 \\le t \\le ${T}$.`, parts: [
        P("Find the time at which the particle is first instantaneously at rest.", 2, ans.sf(cuts[1]), ["The particle is at rest when $v(t) = 0$. With the GDC in radians, find the first zero of the graph of $v$.", `$t \\approx ${sf(cuts[1])}$`]),
        P(`Find the acceleration of the particle, in $\\text{m s}^{-2}$, when $t = ${t0}$.`, 2, ans.sf(acc), [
          `Acceleration is $v'(t)$. Use the numerical derivative on the GDC at $t = ${t0}$, or differentiate: $v'(t) = ${num(a * b)}\\cos(${num(b)}t)$`, `$v'(${t0}) \\approx ${sf(acc)}$`]),
        P(`Find the total distance, in metres, travelled by the particle for $0 \\le t \\le ${T}$.`, 3, ans.sf(dist), [
          `The velocity changes sign, so the distance is the integral of the speed: $\\displaystyle\\int_{0}^{${T}} \\left|v(t)\\right|\\,\\mathrm{d}t$`,
          `On the GDC, $\\displaystyle\\int_{0}^{${T}} \\left|${vt}\\right|\\,\\mathrm{d}t \\approx ${sf(dist)}$`])] };
    } });
  reg({ ...KD, syllabus: ["5.9"], unknown: "distance-from-graph", representation: "graph", format: "value", levels: [2], skills: ["SL5.9.motion-graphs", "SL5.9.total-distance"], title: "Acceleration and distance from a velocity-time graph",
    build({ rng }) {
      const t1 = rng.int(1, 2), t2 = t1 + rng.int(2, 4), t3 = t2 + rng.int(1, 2), t4 = t3 + rng.int(1, 2), V = rng.pick([2, 3, 4, 6]), W = rng.int(1, 3);
      const pts = [[0, 0], [t1, V], [t2, V], [t3, 0], [t4, -W]], acc = rat.Q(V, t1), fwd = rat.Q((t3 + t2 - t1) * V, 2), back = rat.Q((t4 - t3) * W, 2), total = rat.add(fwd, back);
      return { params: { t1 },
        graph: { x: [0, t4 + 1], y: [-4, 7], xStep: 1, yStep: 1, xLabel: "t", yLabel: "v", functions: [{ fn: { type: "pwl", points: pts } }], points: pts.map(([x, y]) => ({ x, y })), alt: "A velocity-time graph made of straight line segments" },
        stem: "The diagram shows the velocity-time graph of a particle moving in a straight line, where $v$ is its velocity in metres per second and $t$ is the time in seconds. The graph is made of straight line segments joining points with integer coordinates.", parts: [
          P(`Find the acceleration of the particle, in $\\text{m s}^{-2}$, for $0 < t < ${t1}$.`, 1, ans.frac(acc.n, acc.d), [`Acceleration is the gradient of the velocity-time graph: $\\dfrac{${V} - 0}{${t1} - 0} = ${rat.tex(acc)}$`]),
          P("Write down the time at which the particle changes direction.", 1, ans.int(t3), [`The particle changes direction when its velocity changes sign, which is at $t = ${t3}$.`]),
          P(`Find the total distance, in metres, travelled by the particle for $0 \\le t \\le ${t4}$.`, 2, ans.frac(total.n, total.d), [
            "Distance is the area between the graph and the $t$-axis, with the part below the axis counted as positive.",
            `Above the axis there is a trapezium with parallel sides $${t3}$ and $${t2 - t1}$ and height $${V}$, so its area is $${rat.tex(fwd)}$.`,
            `Below the axis there is a triangle with base $${t4 - t3}$ and height $${W}$, so its area is $${rat.tex(back)}$.`, `Total distance: $${rat.tex(fwd)} + ${rat.tex(back)} = ${rat.tex(total)}$`])] };
    } });

  // ======================= 5.5 areas and integrals with the GDC =======================
  reg({ type: "t5-ext-area-under-curve", syllabus: ["5.5", "5.11"], unknown: "area-gdc-limits", representation: "graph", format: "value", levels: [4], calculator: true,
    skills: ["SL5.5.area-positive", "SL5.5.definite-integral-gdc", "SL5.5.area-expression"], title: "Area between a curve and the x-axis with the GDC",
    build({ rng }) {
      const a = rng.int(2, 5), b = rng.int(1, 3), f = (x) => a + b * x - Math.exp(x), F = (x) => a * x + (b * x * x) / 2 - Math.exp(x);
      const r1 = bisect(f, -a / b - 1, 0), r2 = bisect(f, 0, 6), area = F(r2) - F(r1), top = f(Math.log(b)), fx = expr([[a, ""], [b, "x"], [-1, "\\mathrm{e}^{x}"]]);
      return { params: { a, b },
        graph: { x: [Math.floor(r1) - 1, Math.ceil(r2) + 1], y: [-2, Math.ceil(top) + 1], xStep: 1, yStep: 1, functions: [{ fn: { type: "sum", of: [{ type: "poly", coeffs: [a, b] }, { type: "exp", a: -1 }] }, label: "f" }],
          points: [{ x: r1, y: 0, label: "A" }, { x: r2, y: 0, label: "B" }], regions: [{ x: [r1, r2], fn: 0 }], alt: "A curve that rises above the x-axis between the points A and B, with the region between the curve and the axis shaded" },
        stem: `The diagram shows the graph of $f(x) = ${fx}$. The graph crosses the $x$-axis at the points $\\mathrm{A}$ and $\\mathrm{B}$. The region $R$, shaded in the diagram, is enclosed by the graph of $f$ and the $x$-axis.`, parts: [
          P("Find the $x$-coordinate of $\\mathrm{A}$.", 2, ans.sf(r1), ["Find the zeros of $f$ on the GDC.", `The left-hand zero is $x \\approx ${sf(r1)}$.`]),
          P("Find the $x$-coordinate of $\\mathrm{B}$.", 1, ans.sf(r2), [`The right-hand zero is $x \\approx ${sf(r2)}$.`]),
          P("Find the area of $R$.", 3, ans.sf(area), [
            `Between $\\mathrm{A}$ and $\\mathrm{B}$ the graph is above the $x$-axis, so the area is $\\displaystyle\\int_{${sf(r1)}}^{${sf(r2)}} \\left(${fx}\\right)${dx}$.`, `Using the unrounded limits on the GDC, the area is approximately $${sf(area)}$.`])] };
    } });
  reg({ type: "t5-ext-integral-gdc", syllabus: ["5.5"], unknown: "gdc-value", representation: "equation", format: "value", levels: [1], calculator: true, skills: ["SL5.5.definite-integral-gdc"], title: "A definite integral on the GDC",
    build({ rng }) {
      const fam = rng.int(0, 2), k = rng.int(2, 6), lo = rng.int(0, 2), hi = lo + rng.int(1, 3);
      const X = [{ tex: `\\sqrt{x^{3} + ${k}}`, f: (x) => Math.sqrt(x ** 3 + k) }, { tex: `\\ln\\left(x^{2} + ${k}\\right)`, f: (x) => Math.log(x * x + k) }, { tex: `${k}\\mathrm{e}^{-x^{2}}`, f: (x) => k * Math.exp(-x * x) }][fam];
      const I = gauss(X.f, lo, hi), whole = `\\displaystyle\\int_{${lo}}^{${hi}} ${X.tex}${dx}`;
      return { params: { fam, k, lo, hi }, stem: `Consider the integral $${whole}$.`, parts: [
        P("Use the GDC to find the value of this integral.", 2, ans.sf(I), ["This integral cannot be found by hand with the methods of this course, so use the numerical integration function on the GDC.", `$${whole} \\approx ${sf(I)}$`])] };
    } });

  // ======================= 5.6 rules with a model and with values from a table =======================
  const DM = { type: "t5-derivative-model-gdc", syllabus: ["5.6", "5.1"] };
  reg({ ...DM, unknown: "greatest-rate", representation: "equation", format: "value", levels: [4], calculator: true, skills: ["SL5.6.rules-with-values", "SL5.1.interpret-derivative"], title: "Rate of growth of a logistic model",
    build({ rng }) {
      const L = rng.pick([40, 60, 80, 120, 150]), c = rng.pick([4, 5, 8, 9, 12, 15, 19]), k = rng.pick([0.2, 0.25, 0.3, 0.4, 0.5, 0.6]), t1 = rng.pick([2, 3, 5]);
      const h = (t) => L / (1 + c * Math.exp(-k * t)), dh = (t) => (L * c * k * Math.exp(-k * t)) / (1 + c * Math.exp(-k * t)) ** 2, tm = Math.log(c) / k, top = (L * k) / 4;
      return { params: { L, c, k, t1 }, stem: `The height of a sunflower, $h$ centimetres, $t$ weeks after it is planted, is modelled by $h(t) = \\dfrac{${L}}{1 + ${c}${ek(-k, "t")}}$, for $t \\ge 0$.`, parts: [
        P("Find the height of the sunflower when it is planted.", 1, ans.sf(h(0)), [`$h(0) = \\dfrac{${L}}{1 + ${c}} \\approx ${sf(h(0))}$`]),
        P(`Find the rate at which the sunflower is growing when $t = ${t1}$.`, 2, ans.sf(dh(t1)), [`The rate of growth is $h'(${t1})$. Use the numerical derivative on the GDC.`, `$h'(${t1}) \\approx ${sf(dh(t1))}$, in centimetres per week.`]),
        P("Find the value of $t$ at which the sunflower is growing fastest.", 2, ans.sf(tm), ["Draw the graph of $h'(t)$ on the GDC and find its maximum point.", `The maximum of $h'(t)$ is at $t \\approx ${sf(tm)}$.`]),
        P("Find the greatest rate of growth of the sunflower.", 2, ans.sf(top), [`The $y$-coordinate of the maximum point of the graph of $h'(t)$ is approximately $${sf(top)}$, so the greatest rate of growth is about $${sf(top)}$ centimetres per week.`])] };
    } });
  reg({ ...DM, syllabus: ["5.6"], unknown: "product-from-table", representation: "table", format: "value", levels: [3], skills: ["SL5.6.rules-with-values", "SL5.6.product-rule", "SL5.6.chain-rule"], title: "Product and chain rules with values from a table",
    build({ rng }) {
      const nz = () => rng.nonzero(-5, 6), f = [nz(), nz(), nz()], g = [rng.int(2, 3), nz(), nz()], fp = [nz(), nz(), nz()], gp = [nz(), nz(), nz()];
      const hp = fp[1] * g[1] + f[1] * gp[1], kp = fp[g[0] - 1] * gp[0], row = (name, vs) => [name, ...vs.map((v) => `$${v}$`)];
      return { params: { f, g, fp, gp }, stem: "The table gives values of two functions $f$ and $g$ and of their derivatives $f'$ and $g'$ at $x = 1$, $x = 2$ and $x = 3$.",
        table: { head: ["$x$", "$1$", "$2$", "$3$"], rows: [row("$f(x)$", f), row("$g(x)$", g), row("$f'(x)$", fp), row("$g'(x)$", gp)] }, parts: [
          P("Let $h(x) = f(x)g(x)$. Find $h'(2)$.", 3, ans.int(hp), ["By the product rule, $h'(x) = f'(x)g(x) + f(x)g'(x)$.", `$h'(2) = f'(2)g(2) + f(2)g'(2) = ${br(fp[1])}${br(g[1])} + ${br(f[1])}${br(gp[1])}$`, `$h'(2) = ${hp}$`]),
          P("Let $k(x) = f(g(x))$. Find $k'(1)$.", 3, ans.int(kp), ["By the chain rule, $k'(x) = f'(g(x)) \\times g'(x)$.", `$k'(1) = f'(g(1)) \\times g'(1) = f'(${g[0]}) \\times ${paren(gp[0])}$`, `$k'(1) = ${br(fp[g[0] - 1])}${br(gp[0])} = ${kp}$`])] };
    } });

  // ======================= 5.10 standard integrals and a rate model =======================
  reg({ ...II, syllabus: ["5.10"], unknown: "standard-exp-trig", format: "mcq", levels: [1], skills: ["SL5.10.standard-integrals"], title: "Integrals of sine, cosine and the exponential function",
    build({ rng }) {
      const a = rng.pick([2, 3, 4, 5, 6]), b = rng.pick([2, 3, 4, 5, 7]), fam = rng.int(0, 1), opt = intOpt("");
      const X = [
        { f: [[a, "cos", 1], [b, "exp", 1]], F: [[a, "sin", 1], [b, "exp", 1]], rule: "The integral of $\\cos x$ is $\\sin x$ and the integral of $\\mathrm{e}^{x}$ is $\\mathrm{e}^{x}$.",
          w: [opt([[-a, "sin", 1], [b, "exp", 1]], "The integral of $\\cos x$ is $\\sin x$, with no change of sign."), opt([[a, "cos", 1], [b, "exp", 1]], "The term in $\\cos x$ has not been integrated."), opt([[a, "sin", 1], [-b, "exp", 1]])] },
        { f: [[a, "sin", 1], [b, "exp", 1]], F: [[-a, "cos", 1], [b, "exp", 1]], rule: "The integral of $\\sin x$ is $-\\cos x$ and the integral of $\\mathrm{e}^{x}$ is $\\mathrm{e}^{x}$.",
          w: [opt([[a, "cos", 1], [b, "exp", 1]], "The integral of $\\sin x$ is $-\\cos x$."), opt([[a, "sin", 1], [b, "exp", 1]], "The term in $\\sin x$ has not been integrated."), opt([[-a, "sin", 1], [b, "exp", 1]])] }][fam];
      return { params: { f: X.f }, stem: `Consider $\\displaystyle\\int \\left(${termsTex(X.f)}\\right)${dx}$.`, parts: [
        P("Which expression is equal to this integral?", 2, ans.choice(rng, opt(X.F), X.w), [X.rule, `$\\displaystyle\\int \\left(${termsTex(X.f)}\\right)${dx} = ${termsTex(X.F)} + C$`])] };
    } });
  reg({ ...II, syllabus: ["5.10"], unknown: "linear-trig", format: "value", levels: [2], skills: ["SL5.10.linear-composites", "SL5.10.standard-integrals"], title: "Integrate a sine or cosine and an exponential of a multiple of x",
    build({ rng }) {
      const a = rng.int(2, 5), k = rng.pick([1, 2, 3, 4, 6, 8, 9, 10]), isSin = rng.bool(), b = rng.pick([2, 3, 4, -2, -3]), j = rng.pick([1, 2, 3, 5, 6, 8]);
      const A = rat.Q(isSin ? -k : k, a), B = rat.Q(j, b), f1 = isSin ? "sin" : "cos", F1 = isSin ? "cos" : "sin", da = isSin ? -a : a, e = ek(b);
      return { params: { a, k, isSin, b, j }, stem: "This question is about integrating functions of a multiple of $x$. In each part, $C$ is a constant of integration.", parts: [
        P(`It is given that $\\displaystyle\\int ${coef(k, `\\${f1} ${a}x`)}${dx} = A\\${F1} ${a}x + C$, where $A$ is a constant. Find the value of $A$.`, 2, ans.frac(A.n, A.d), [
          `The derivative of $\\${F1} ${a}x$ is $${coef(da, `\\${f1} ${a}x`)}$.`, `So $A \\times ${paren(da)} = ${k}$ and $A = ${rat.tex(A)}$.`]),
        P(`It is given that $\\displaystyle\\int ${coef(j, e)}${dx} = B${e} + C$, where $B$ is a constant. Find the value of $B$.`, 2, ans.frac(B.n, B.d), [
          `The derivative of $${e}$ is $${coef(b, e)}$.`, `So $B \\times ${paren(b)} = ${j}$ and $B = ${rat.tex(B)}$.`])] };
    } });
  reg({ ...AC, syllabus: ["5.10", "5.5"], unknown: "rate-model", representation: "words", format: "value", levels: [4], calculator: true, skills: ["SL5.10.find-function-from-derivative", "SL5.5.total-change-from-rate"], title: "Amount from a rate of change and a starting value",
    build({ rng }) {
      const a = rng.pick([8, 10, 12, 16, 18, 20]), k = rng.pick([0.1, 0.2, 0.25, 0.4, 0.5]), V0 = rng.pick([20, 30, 50, 75]), t1 = rng.int(3, 6), cap = Math.round(a / k), lim = V0 + cap;
      const Vt = (t) => V0 + cap * (1 - Math.exp(-k * t)), target = Math.round(V0 + rng.pick([0.5, 0.6, 0.7, 0.8]) * cap), t2 = -Math.log(1 - (target - V0) / cap) / k, R = `${a}${ek(-k, "t")}`;
      return { params: { a, k, V0, t1, target }, stem: `Water is pumped into a tank. The rate at which water enters the tank, in litres per minute, $t$ minutes after the pump is switched on, is modelled by $R(t) = ${R}$, for $t \\ge 0$. When the pump is switched on, the tank already contains $${V0}$ litres of water.`, parts: [
        P(`Find the volume of water in the tank, in litres, when $t = ${t1}$.`, 3, ans.sf(Vt(t1)), [
          `The volume added is the integral of the rate: $\\displaystyle\\int_{0}^{${t1}} ${R}\\,\\mathrm{d}t \\approx ${sf(Vt(t1) - V0)}$`, `Add the starting volume: $${V0} + ${sf(Vt(t1) - V0)} \\approx ${sf(Vt(t1))}$`]),
        P(`Find the value of $t$ at which the tank contains $${target}$ litres of water.`, 2, ans.sf(t2), [
          `The volume at time $t$ is $${V0} + ${cap}\\left(1 - ${ek(-k, "t")}\\right)$, found by integrating $R$ and adding the starting volume.`, `Solve $${V0} + ${cap}\\left(1 - ${ek(-k, "t")}\\right) = ${target}$ on the GDC: $t \\approx ${sf(t2)}$`]),
        P("As $t$ increases, the volume of water in the tank approaches $L$ litres. Find the value of $L$.", 2, ans.int(lim), [
          `As $t$ increases, $${ek(-k, "t")}$ approaches $0$, so the volume approaches $${V0} + ${cap}$.`, `$L = ${lim}$`])] };
    } });

  // ======================= 5.11 definite integrals and areas: more ways to ask =======================
  reg({ ...DI, unknown: "evaluate-linear", levels: [1], skills: ["SL5.11.evaluate-definite"], title: "Evaluate a definite integral of a linear function",
    build({ rng }) {
      const a = rng.int(1, 4), c = rng.int(1, 6), lo = rng.int(0, 2), hi = lo + rng.int(1, 3), F = (x) => a * x * x + c * x, v = F(hi) - F(lo), whole = `\\displaystyle\\int_{${lo}}^{${hi}} \\left(${lin(2 * a, c)}\\right)${dx}`;
      return { params: { a, c, lo, hi }, stem: `Consider the integral $${whole}$.`, parts: [
        P("Find the value of the integral.", 2, ans.int(v), [`$${whole} = \\left[${poly([a, c, 0])}\\right]_{${lo}}^{${hi}}$`, `$= ${F(hi)} - ${F(lo)} = ${v}$`])] };
    } });
  reg({ ...DI, unknown: "evaluate-trig", levels: [3], skills: ["SL5.11.evaluate-definite", "SL5.10.linear-composites"], title: "Definite integrals of sine and cosine",
    build({ rng }) {
      const b = rng.pick([2, 3, 4, 6]), a = rng.int(1, 9), c = rng.int(1, 6), d = rng.int(1, 4), v1 = rat.Q(a, b), cb = rat.Q(c, b), up1 = `\\frac{\\pi}{${2 * b}}`, up2 = `\\frac{\\pi}{${b}}`;
      const f = coef(a, `\\cos ${b}x`), g = `${coef(c, `\\sin ${b}x`)} + ${d}`, tex2 = `${rat.tex(rat.Q(2 * c, b))} + ${piFrac(d, b)}`, half = "\\sin\\left(\\dfrac{\\pi}{2}\\right)";
      return { params: { a, b, c, d }, stem: `Let $f(x) = ${f}$ and $g(x) = ${g}$.`, parts: [
        P(`Find the exact value of $\\displaystyle\\int_{0}^{${up1}} f(x)${dx}$.`, 3, ans.frac(v1.n, v1.d), [
          `$\\displaystyle\\int_{0}^{${up1}} ${f}${dx} = \\left[${coef(v1, `\\sin ${b}x`)}\\right]_{0}^{${up1}}$`, `$= ${coef(v1, half)} - ${coef(v1, "\\sin 0")}$`, `$= ${rat.tex(v1)}$`]),
        P(`Find the exact value of $\\displaystyle\\int_{0}^{${up2}} g(x)${dx}$.`, 3, ans.exact((2 * c) / b + (d * Math.PI) / b, tex2), [
          `$\\displaystyle\\int_{0}^{${up2}} \\left(${g}\\right)${dx} = \\left[${coef(rat.neg(cb), `\\cos ${b}x`)} + ${coef(d, "x")}\\right]_{0}^{${up2}}$`,
          `$= \\left(${coef(rat.neg(cb), "\\cos \\pi")} + ${piFrac(d, b)}\\right) - \\left(${coef(rat.neg(cb), "\\cos 0")}\\right)$`,
          `$\\cos \\pi = -1$ and $\\cos 0 = 1$, so the value is $${rat.tex(cb)} + ${piFrac(d, b)} + ${rat.tex(cb)} = ${tex2}$`])] };
    } });
  reg({ ...DI, unknown: "evaluate-log", levels: [3], skills: ["SL5.11.evaluate-definite", "SL5.10.standard-integrals", "SL5.10.linear-composites"], title: "Definite integrals that give logarithms",
    build({ rng }) {
      const k = rng.int(2, 3), a = rng.int(2, 3), c = rng.int(2, 4), p = rng.int(1, 4), N = k ** a, M = c * p + 1;
      const I1 = `\\displaystyle\\int_{1}^{${k}} \\dfrac{${a}}{x}${dx}`, I2 = `\\displaystyle\\int_{0}^{${p}} \\dfrac{${c}}{${c}x + 1}${dx}`;
      return { params: { k, a, c, p }, stem: "In this question, each integral can be written as the natural logarithm of an integer.", parts: [
        P(`It is given that $${I1} = \\ln N$. Find the value of $N$.`, 3, ans.int(N), [`$${I1} = \\left[${a}\\ln x\\right]_{1}^{${k}} = ${a}\\ln ${k} - ${a}\\ln 1$`, `$\\ln 1 = 0$ and $${a}\\ln ${k} = \\ln ${k}^{${a}} = \\ln ${N}$`, `$N = ${N}$`]),
        P(`It is given that $${I2} = \\ln M$. Find the value of $M$.`, 3, ans.int(M), [
          `The derivative of $\\ln(${c}x + 1)$ is $\\dfrac{${c}}{${c}x + 1}$, so $${I2} = \\left[\\ln(${c}x + 1)\\right]_{0}^{${p}}$`, `$= \\ln ${M} - \\ln 1 = \\ln ${M}$`, `$M = ${M}$`])] };
    } });
  reg({ ...DI, unknown: "area-across-root", representation: "graph", levels: [3], skills: ["SL5.11.area-with-negative-regions", "SL5.11.evaluate-definite"], title: "Area of a region that is partly below the x-axis",
    build({ rng }) {
      const k = rng.int(1, 3), mU = k + rng.int(1, 2), I = rat.sub(rat.Q(mU ** 3, 3), k * k * mU), below = rat.Q(2 * k ** 3, 3), above = rat.add(I, below), area = rat.add(above, below);
      const body = `\\left(x^{2} - ${k * k}\\right)${dx}`, J = (lo, hi) => `\\displaystyle\\int_{${lo}}^{${hi}} ${body}`;
      return { params: { k, mU },
        graph: { x: [-1, mU + 1], y: [-k * k - 1, mU * mU - k * k + 1], xStep: 1, functions: [{ fn: { type: "poly", coeffs: [-k * k, 0, 1] } }], asymptotes: [{ x: mU }], points: [{ x: k, y: 0 }], regions: [{ x: [0, mU], fn: 0 }], alt: "A parabola that crosses the x-axis, with a vertical dashed line to its right and the regions between the curve and the x-axis shaded" },
        stem: `The diagram shows part of the curve $y = x^{2} - ${k * k}$ and the line $x = ${mU}$. The region $R$, shaded in the diagram, is bounded by the curve, the $x$-axis, the $y$-axis and the line $x = ${mU}$. Part of $R$ is below the $x$-axis and part is above it.`, parts: [
          P(`Find $${J(0, mU)}$.`, 2, ans.frac(I.n, I.d), [`$\\left[\\dfrac{x^{3}}{3} - ${coef(k * k, "x")}\\right]_{0}^{${mU}} = ${frac(mU ** 3, 3)} - ${k * k * mU}$`, `$= ${rat.tex(I)}$`]),
          P("Find the $x$-coordinate of the point where the curve crosses the positive $x$-axis.", 1, ans.int(k), [`$x^{2} - ${k * k} = 0$ and $x > 0$, so $x = ${k}$.`]),
          P("Find the total area of $R$.", 3, ans.frac(area.n, area.d), [
            `For $0 \\le x \\le ${k}$ the curve is below the axis: $${J(0, k)} = ${frac(k ** 3, 3)} - ${k ** 3} = ${rat.tex(rat.neg(below))}$, so this part has area $${rat.tex(below)}$.`,
            `For $${k} \\le x \\le ${mU}$ the curve is above the axis: $${J(k, mU)} = ${rat.tex(I)} - ${paren(rat.neg(below))} = ${rat.tex(above)}$`, `Total area: $${rat.tex(below)} + ${rat.tex(above)} = ${rat.tex(area)}$`])] };
    } });
  reg({ ...DI, unknown: "area-gdc", representation: "graph", levels: [4], calculator: true, skills: ["SL5.11.evaluate-definite", "SL5.5.definite-integral-gdc", "SL5.11.unknown-limit-or-parameter"], title: "Area under a curve with the GDC, and a line that halves it",
    build({ rng }) {
      const a = rng.int(2, 5), k = rng.pick([0.25, 0.4, 0.5, 0.8]), qU = rng.int(4, 6), F = (x) => -(a / k) * (x + 1 / k) * Math.exp(-k * x);
      const area = F(qU) - F(0), top = a / (k * Math.E), half = bisect((x) => F(x) - F(0) - area / 2, 0, qU), fx = `${a}x${ek(-k)}`;
      return { params: { a, k, qU },
        graph: { x: [0, qU + 1], y: [0, Math.ceil(top) + 1], xStep: 1, functions: [{ fn: { type: "product", of: [{ type: "poly", coeffs: [0, a] }, { type: "exp", b: Math.exp(-k) }] }, label: "f" }], asymptotes: [{ x: qU }], regions: [{ x: [0, qU], fn: 0 }], alt: "A curve that rises from the origin to a maximum and then falls, with a vertical dashed line and the region under the curve shaded" },
        stem: `The diagram shows the graph of $f(x) = ${fx}$, for $x \\ge 0$, and the line $x = ${qU}$. The region $R$, shaded in the diagram, is enclosed by the graph of $f$, the $x$-axis and the line $x = ${qU}$.`, parts: [
          P("Find the maximum value of $f$.", 2, ans.sf(top), [`Find the maximum point of the graph of $f$ on the GDC. It is at $x = ${sf(1 / k)}$.`, `The maximum value is approximately $${sf(top)}$.`]),
          P("Find the area of $R$.", 2, ans.sf(area), [`Area: $\\displaystyle\\int_{0}^{${qU}} ${fx}${dx}$`, `Using the GDC, the area is approximately $${sf(area)}$.`]),
          P("The line $x = m$ divides $R$ into two regions of equal area. Find the value of $m$.", 3, ans.sf(half), [
            `Each region has area $\\dfrac{${sf(area)}}{2} \\approx ${sf(area / 2)}$.`, `Solve $\\displaystyle\\int_{0}^{m} ${fx}${dx} = ${sf(area / 2)}$ on the GDC, keeping unrounded values.`, `$m \\approx ${sf(half)}$`])] };
    } });
  reg({ ...DI, unknown: "unknown-upper-limit", format: "mcq", levels: [3], skills: ["SL5.11.unknown-limit-or-parameter", "SL5.11.evaluate-definite"], title: "Find an unknown upper limit",
    build({ rng }) {
      let r, s;
      do { r = rng.int(1, 6); s = rng.int(1, 7); } while (r === s);
      const b = s - r, N = r * s, kOpt = (cs, why) => ({ text: m(poly(cs, "k")), value: cs, why }), whole = `\\displaystyle\\int_{0}^{k} \\left(${lin(2, b)}\\right)${dx}`;
      return { params: { b, N }, stem: `It is given that $${whole} = ${N}$, where $k > 0$.`, parts: [
        P(`Which expression is equal to $${whole}$?`, 2, ans.choice(rng, kOpt([1, b, 0]), [
          kOpt([2, b], "This is the integrand with $x$ replaced by $k$. It has not been integrated."), kOpt([2, b, 0], "Integrating $2x$ gives $x^{2}$: divide by the new power."),
          kOpt([1, 0, b], `Integrating the constant $${b}$ gives $${coef(b, "x")}$.`), kOpt([1, 2 * b, 0])]), [`$${whole} = \\left[${poly([1, b, 0])}\\right]_{0}^{k}$`, `$= ${poly([1, b, 0], "k")}$`]),
        P("Find the value of $k$.", 3, ans.int(r), [`$${poly([1, b, 0], "k")} = ${N}$, so $${poly([1, b, -N], "k")} = 0$`, `$${factor(r, "k")}${factor(-s, "k")} = 0$, so $k = ${r}$ or $k = ${-s}$`, `Since $k > 0$, $k = ${r}$.`])] };
    } });
  reg({ type: "t5-ext-integral-properties", syllabus: ["5.11"], unknown: "linear-combination", representation: "equation", format: "value", levels: [2], skills: ["SL5.11.integral-properties"], title: "Use the properties of definite integrals",
    build({ rng }) {
      const p = rng.int(0, 2), q = p + rng.int(2, 4), r = q + rng.int(1, 3), A = rng.nonzero(-6, 9), B = rng.nonzero(-5, 8), c = rng.int(2, 4), d = rng.int(1, 5);
      const I = (lo, hi, body) => `\\displaystyle\\int_{${lo}}^{${hi}} ${body}${dx}`, combo = `\\left(${c}f(x) + ${d}\\right)`, v = c * A + d * (q - p);
      return { params: { p, q, r, A, B, c, d }, stem: `It is given that $${I(p, q, "f(x)")} = ${A}$ and $${I(q, r, "f(x)")} = ${B}$.`, parts: [
        P(`Find $${I(p, r, "f(x)")}$.`, 1, ans.int(A + B), [`$${I(p, r, "f(x)")} = ${I(p, q, "f(x)")} + ${I(q, r, "f(x)")} = ${A} + ${paren(B)} = ${A + B}$`]),
        P(`Find $${I(q, p, "f(x)")}$.`, 1, ans.int(-A), [`Swapping the limits changes the sign: $${I(q, p, "f(x)")} = ${-A}$`]),
        P(`Find $${I(p, q, combo)}$.`, 2, ans.int(v), [`$${I(p, q, combo)} = ${c}${I(p, q, "f(x)")} + ${I(p, q, String(d))}$`, `$= ${c}${br(A)} + ${d}${br(q - p)} = ${v}$`])] };
    } });
  reg({ ...AB, unknown: "area-two-parabolas", representation: "graph", levels: [3], skills: ["SL5.11.area-between-curves"], title: "Area between two parabolas",
    build({ rng }) {
      let a, k;
      do { a = rng.int(1, 2); k = rng.int(1, 3); } while (a * k * k > 9);
      const c = rng.int(0, 3), top = 2 * a * k * k + c, area = rat.Q(8 * a * k ** 3, 3), Fk = rat.Q(4 * a * k ** 3, 3), fT = poly([a, 0, c]), gT = poly([-a, 0, top]);
      return { params: { a, c, top },
        graph: { x: [-k - 1, k + 1], y: [-1, top + 1], xStep: 1, functions: [{ fn: { type: "poly", coeffs: [c, 0, a] }, label: "f" }, { fn: { type: "poly", coeffs: [top, 0, -a] }, label: "g" }], regions: [{ x: [-k, k], fn: 0, to: 1 }], alt: "Two parabolas, one opening upwards and one opening downwards, crossing at two points, with the region between them shaded" },
        stem: `The diagram shows the graphs of $f(x) = ${fT}$ and $g(x) = ${gT}$. The graphs intersect at two points and enclose a region $R$, which is shaded.`, parts: [
          P("Find the positive value of $x$ at which the graphs intersect.", 2, ans.int(k), [`$${fT} = ${gT}$ gives $${coef(2 * a, "x^{2}")} = ${2 * a * k * k}$`, `$x^{2} = ${k * k}$, so $x = ${k}$ or $x = ${-k}$. The positive value is $${k}$.`]),
          P("Find the exact area of $R$.", 4, ans.frac(area.n, area.d), [
            `Between the points of intersection $g(x) \\ge f(x)$, so the area is $\\displaystyle\\int_{${-k}}^{${k}} \\left(g(x) - f(x)\\right)${dx} = \\displaystyle\\int_{${-k}}^{${k}} \\left(${poly([-2 * a, 0, 2 * a * k * k])}\\right)${dx}$`,
            `$= \\left[${expr([[rat.Q(-2 * a, 3), "x^{3}"], [2 * a * k * k, "x"]])}\\right]_{${-k}}^{${k}}$`, `$= ${rat.tex(Fk)} - ${paren(rat.neg(Fk))}$`, `$= ${rat.tex(area)}$`])] };
    } });
  reg({ ...AB, unknown: "gdc-area", representation: "graph", levels: [4], calculator: true, skills: ["SL5.11.area-between-curves", "SL5.5.definite-integral-gdc"], title: "Area between two curves with the GDC",
    build({ rng }) {
      const a = rng.int(2, 4), b = rng.pick([0.5, 1, 1.5, 2]), d = (x) => a * Math.sin(x) - b * x * x, pX = bisect(d, 0.3, Math.PI), area = a * (1 - Math.cos(pX)) - (b * pX ** 3) / 3;
      const xm = bisect((x) => a * Math.cos(x) - 2 * b * x, 0, pX), gap = d(xm), gx = coef(b, "x^{2}");
      return { params: { a, b },
        graph: { x: [0, 4], y: [-1, a + 1], xStep: 1, yStep: 1, functions: [{ fn: { type: "trig", name: "sin", a }, label: "f" }, { fn: { type: "poly", coeffs: [0, 0, b] }, label: "g" }], points: [{ x: pX, y: a * Math.sin(pX), label: "A" }], regions: [{ x: [0, pX], fn: 0, to: 1 }], alt: "A sine curve and a parabola that cross at the origin and at the point A, with the region between them shaded" },
        stem: `The diagram shows the graphs of $f(x) = ${a}\\sin x$ and $g(x) = ${gx}$, for $x \\ge 0$. The graphs intersect at the origin and at the point $\\mathrm{A}$. The region $R$, shaded in the diagram, is enclosed by the two graphs.`, parts: [
          P("Find the $x$-coordinate of $\\mathrm{A}$.", 2, ans.sf(pX), [`With the GDC in radians, solve $${a}\\sin x = ${gx}$ and take the solution with $x > 0$.`, `$x \\approx ${sf(pX)}$`]),
          P("Find the area of $R$.", 3, ans.sf(area), [
            `Between the origin and $\\mathrm{A}$ the graph of $f$ is above the graph of $g$, so the area is $\\displaystyle\\int_{0}^{${sf(pX)}} \\left(${a}\\sin x - ${gx}\\right)${dx}$.`, `Using the unrounded limit on the GDC, the area is approximately $${sf(area)}$.`]),
          P("Find the greatest vertical distance between the two graphs for values of $x$ between the origin and $\\mathrm{A}$.", 2, ans.sf(gap), [
            `The vertical distance is $${a}\\sin x - ${gx}$. Find the maximum point of the graph of this difference on the GDC.`, `The greatest distance is approximately $${sf(gap)}$, at $x \\approx ${sf(xm)}$.`])] };
    } });

  // ======================= second generators for two exam types =======================
  reg({ type: "t5-derivative-graph", syllabus: ["5.7", "5.8", "5.2"], unknown: "pick-f-from-derivative", representation: "graph", format: "graph-pick", levels: [3], skills: ["SL5.7.f-from-derivative-graph", "SL5.7.sketch-match-graphs", "SL5.7.concavity"], title: "Pick the graph of f from the graph of its derivative",
    build({ rng }) {
      const d = rng.pick([1, 2]), mid = rng.int(-1, 1), s = rng.sign(), A = s * (d === 1 ? 3 : 0.75), a = mid - d, b = mid + d;
      const W = (fn, alt) => win([-5, 5], [-6, 6], { functions: [{ fn }], alt });
      const cubic = (A2, m2, d2, k2) => ({ type: "transform", of: { type: "poly", coeffs: [0, -d2 * d2, 0, 1 / 3] }, a: A2, h: m2, k: k2 || 0 });
      const right = { graph: W(cubic(A, mid, d), "A cubic curve with two turning points"), value: "f" };
      const wrongs = G.pickDistinct(right.graph, [
        { graph: W(cubic(-A, mid, d), "A cubic curve with two turning points"), value: "reflected", why: "$f$ must be increasing where $f'(x) > 0$ and decreasing where $f'(x) < 0$." },
        { graph: W(cubic(A, mid + d, d), "A cubic curve with two turning points"), value: "shifted", why: "The turning points of $f$ must be at the zeros of $f'$." },
        { graph: W({ type: "transform", of: { type: "poly", coeffs: [0, 0, 0, 1] }, a: s * 0.25, h: mid }, "A cubic curve with no turning points"), value: "no-turning-points", why: "$f'$ has two zeros, so $f$ has two stationary points." },
        { graph: W(parab(-A, a, b), "A parabola"), value: "parabola", why: "$f'$ is a quadratic, so $f$ is a cubic." }], 3);
      return { params: { mid, s },
        graph: W(parab(A, a, b), "A parabola, the graph of the derivative of f, crossing the x-axis twice"),
        stem: "The diagram shows the graph of $y = f'(x)$, where $f'$ is the derivative of a function $f$. The graph crosses the $x$-axis at two points with integer coordinates, and its vertex has an integer $x$-coordinate.", parts: [
          P("Which graph could be the graph of $y = f(x)$?", 3, ans.graph(rng, right, wrongs), [
            `$f'(x) = 0$ at $x = ${a}$ and $x = ${b}$, so $f$ has turning points there.`,
            `Between them $f'(x)$ is ${s > 0 ? "negative" : "positive"}, so $f$ is ${s > 0 ? "decreasing" : "increasing"}; outside them $f$ is ${s > 0 ? "increasing" : "decreasing"}.`,
            `So $f$ has a local ${s > 0 ? "maximum" : "minimum"} at $x = ${a}$ and a local ${s > 0 ? "minimum" : "maximum"} at $x = ${b}$.`]),
          P("Write down the value of $x$ for which $f''(x) = 0$.", 1, ans.int(mid), [`$f''(x)$ is the gradient of the graph of $f'$, which is zero at the vertex: $x = ${mid}$.`]),
          P("For which values of $x$ is the graph of $f$ concave up?", 2, ans.choice(rng, { text: `$x ${s > 0 ? ">" : "<"} ${mid}$`, value: [s > 0 ? "gt" : "lt", mid] }, [
            { text: `$x ${s > 0 ? "<" : ">"} ${mid}$`, value: [s > 0 ? "lt" : "gt", mid], why: "The graph of $f$ is concave up where $f'$ is increasing." },
            { text: `$${a} < x < ${b}$`, value: ["in", a, b], why: "This is where $f'(x)$ keeps one sign, which is about $f$ increasing or decreasing, not about concavity." },
            { text: `$x < ${a}$ or $x > ${b}$`, value: ["out", a, b], why: "This is where $f'(x)$ keeps one sign, which is about $f$ increasing or decreasing, not about concavity." }]), [
            "The graph of $f$ is concave up where $f''(x) > 0$, which is where $f'$ is increasing.", `The graph of $f'$ is rising for $x ${s > 0 ? ">" : "<"} ${mid}$.`])] };
    } });
  reg({ type: "t5-normal-meets-curve", syllabus: ["5.4"], unknown: "normal-y-intercept", representation: "equation", format: "value", levels: [4], calculator: true,
    skills: ["SL5.4.tangent-meets-axes-or-curve", "SL5.4.normal-equation"], title: "Where a normal to a logarithmic curve meets the axes",
    build({ rng }) {
      const a = rng.pick([2, 3, 4, 5, 6]), x0 = rng.pick([2, 3, 4, 5].filter((x) => a % x !== 0)), y0 = a * Math.log(x0) + x0, mm = a / x0 + 1, nm = -1 / mm, yi = y0 + x0 / mm, xi = x0 + mm * y0;
      return { params: { a, x0 }, stem: `The curve $C$ has equation $y = ${a}\\ln x + x$, for $x > 0$. The point $\\mathrm{A}$ on $C$ has $x$-coordinate $${x0}$. The normal to $C$ at $\\mathrm{A}$ meets the $y$-axis at $\\mathrm{Q}$ and the $x$-axis at $\\mathrm{R}$.`, parts: [
        P("Find the gradient of $C$ at $\\mathrm{A}$.", 2, ans.sf(mm), [`$${D} = \\dfrac{${a}}{x} + 1$`, `At $x = ${x0}$: $${D} = \\dfrac{${a}}{${x0}} + 1 \\approx ${sf(mm)}$`]),
        P("Find the gradient of the normal to $C$ at $\\mathrm{A}$.", 1, ans.sf(nm), [`The normal is perpendicular to the tangent, so its gradient is the negative reciprocal of the gradient of $C$: approximately $${sf(nm)}$.`]),
        P("Find the $y$-coordinate of $\\mathrm{Q}$.", 2, ans.sf(yi), [`At $\\mathrm{A}$, $y = ${a}\\ln ${x0} + ${x0} \\approx ${sf(y0)}$.`, `The normal is $y = ${sf(nm)}(x - ${x0}) + ${sf(y0)}$. Keep the unrounded values on the GDC.`, `At $x = 0$: $y \\approx ${sf(yi)}$`]),
        P("Find the $x$-coordinate of $\\mathrm{R}$.", 2, ans.sf(xi), ["Set $y = 0$ in the equation of the normal and solve for $x$.", `$x \\approx ${sf(xi)}$`])] };
    } });
})(typeof globalThis !== "undefined" ? globalThis : this);
