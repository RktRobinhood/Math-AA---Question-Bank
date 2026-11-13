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
})(typeof globalThis !== "undefined" ? globalThis : this);
