/* AA HL Topic 5 (Calculus, additional higher level content: 5.12 to 5.19) generators.
   Self-contained: needs only engine.js. Codes are AA HL codes (home "aa-hl").
   Each generator's independent verifier is in scripts/engine-checks/aa-hl-topic5.mjs under the same id. */
(function (root) {
  "use strict";
  const E = root.QBEngine;
  const { ans, fmt } = E;
  const { num, frac, poly, lin, br, paren, expr, m, coef, point, sf, piFrac } = fmt;
  const P = (prompt, marks, answer, working) => ({ prompt, marks, answer, working });
  const reg = (def) => E.registerAll({ home: "aa-hl", calculator: false }, [def])[0];
  const D = "\\dfrac{\\mathrm{d}y}{\\mathrm{d}x}";
  const dd = (a, b) => `\\dfrac{\\mathrm{d}${a}}{\\mathrm{d}${b}}`;
  const dx = "\\,\\mathrm{d}x";
  const LIM = (to, body, v) => `\\displaystyle\\lim_{${v || "x"} \\to ${to}} ${body}`;
  const gcd = fmt.gcd;
  // n/d as written, then reduced when that differs: "\dfrac{4}{6} = \dfrac{2}{3}".
  const fr2 = (n, d) => {
    if (d < 0) { n = -n; d = -d; }
    const raw = d === 1 ? `${n}` : `${n < 0 ? "-" : ""}\\dfrac{${Math.abs(n)}}{${d}}`, red = frac(n, d);
    return raw === red ? red : `${raw} = ${red}`;
  };
  const E_ = "\\mathrm{e}";
  const ex = (k, v) => `${E_}^{${coef(k, v || "x")}}`;                 // e^{kx}
  const tr = (name, k, v) => `\\${name} ${coef(k, v || "x")}`;          // \sin 2x
  const pw = (b, n) => (n === 1 ? `${b}` : `${b}^{${n}}`);
  const cases = (rows) => `\\begin{cases} ${rows.map(([f, c]) => `${f} & ${c}`).join(" \\\\ ")} \\end{cases}`;

  // =====================================================================================
  // 5.12 continuity, differentiability, limits, first principles, higher derivatives
  // =====================================================================================
  const FP = { type: "t5-ahl-first-principles", syllabus: ["5.12"], representation: "equation", skills: ["AHL5.12.first-principles"] };
  reg({ ...FP, unknown: "quotient-at-point", format: "value", levels: [2], title: "Simplify the difference quotient of a quadratic at a point",
    build({ rng }) {
      let a, b, c, p;
      do { a = rng.nonzero(-4, 5); b = rng.int(-6, 6); c = rng.int(-5, 5); p = rng.nonzero(-3, 4); } while (2 * a * p + b === 0);
      const A = 2 * a * p + b, fp = a * p * p + b * p + c, ph = expr([[p, ""], [1, "h"]]);
      return { params: { a, b, c, p }, stem: `Let $f(x) = ${poly([a, b, c])}$. For $h \\ne 0$, the expression $\\dfrac{f(${ph}) - f(${p})}{h}$ simplifies to $A + Bh$, where $A$ and $B$ are constants.`, parts: [
        P("Find the value of $A$.", 2, ans.int(A), [
          `$f(${ph}) = ${expr([[a, `(${ph})^{2}`], [b, `(${ph})`], [c, ""]])} = ${poly([a, A, fp], "h")}$`,
          `$f(${p}) = ${fp}$, so $f(${ph}) - f(${p}) = ${poly([a, A, 0], "h")}$.`,
          `Dividing by $h$: $\\dfrac{f(${ph}) - f(${p})}{h} = ${expr([[A, ""], [a, "h"]])}$, so $A = ${A}$.`]),
        P("Find the value of $B$.", 1, ans.int(a), [`The coefficient of $h$ in $${expr([[A, ""], [a, "h"]])}$ is $B = ${a}$.`]),
        P(`Hence write down the value of $f'(${p})$.`, 1, ans.int(A), [`$f'(${p}) = ${LIM("0", `\\left(${expr([[A, ""], [a, "h"]])}\\right)`, "h")} = ${A}$`])] };
    } });
  reg({ ...FP, unknown: "derivative-cubic", format: "mcq", levels: [3], title: "Differentiate a cubic from first principles",
    build({ rng }) {
      let a, b, p;
      do { a = rng.nonzero(-3, 4); b = rng.nonzero(-7, 7); p = rng.nonzero(-3, 3); } while (Math.abs(a) === 1 && Math.abs(b) === 1);
      const q = (cs) => expr([[cs[0], "x^{2}"], [cs[2], "xh"], [cs[3], "h^{2}"], [cs[1], ""]]);
      const opt = (cs, why) => ({ text: m(q(cs)), value: cs, why });
      const v = 3 * a * p * p + b;
      return { params: { a, b, p }, stem: `Let $f(x) = ${poly([a, 0, b, 0])}$. The derivative of $f$ is to be found from first principles.`, parts: [
        P("Which expression is equal to $\\dfrac{f(x + h) - f(x)}{h}$ for $h \\ne 0$?", 3, ans.choice(rng, opt([3 * a, b, 3 * a, a]), [
          opt([3 * a, b, 0, a], "The expansion of $(x + h)^{3}$ contains the term $3xh^{2}$, which gives $3xh$ after dividing by $h$."),
          opt([a, b, a, a], "The binomial coefficients of $(x + h)^{3}$ are $1$, $3$, $3$, $1$."),
          opt([3 * a, 0, 3 * a, a], `The term $${coef(b, "x")}$ contributes $${coef(b, "h")}$ to the numerator, which gives $${b}$ after dividing by $h$.`),
          opt([3 * a, b, 3 * a, 0], "The term in $h^{3}$ gives $h^{2}$ after dividing by $h$; it only disappears in the limit.")]), [
          `$(x + h)^{3} = x^{3} + 3x^{2}h + 3xh^{2} + h^{3}$`,
          `$f(x + h) - f(x) = ${expr([[a, "\\left(3x^{2}h + 3xh^{2} + h^{3}\\right)"], [b, "h"]])}$`,
          `Dividing by $h$: $\\dfrac{f(x + h) - f(x)}{h} = ${q([3 * a, b, 3 * a, a])}$`]),
        P(`Hence, by letting $h$ tend to zero, find $f'(${p})$.`, 2, ans.int(v), [
          `$f'(x) = ${LIM("0", `\\left(${q([3 * a, b, 3 * a, a])}\\right)`, "h")} = ${expr([[3 * a, "x^{2}"], [b, ""]])}$`,
          `$f'(${p}) = ${expr([[3 * a, `${br(p)}^{2}`], [b, ""]])} = ${v}$`])] };
    } });

  const LR = { type: "t5-ahl-limit-reasoning", syllabus: ["5.12"], representation: "equation", format: "value", skills: ["AHL5.12.limit-reasoning"] };
  reg({ ...LR, unknown: "rational-at-infinity", levels: [1], title: "Limit of a rational function as x tends to infinity",
    build({ rng }) {
      let a, b, c, d, e;
      do { a = rng.nonzero(-9, 9); d = rng.pick([2, 3, 4, 5, 6, 7, 8]); b = rng.nonzero(-9, 9); c = rng.int(-9, 9); e = rng.int(1, 9); } while (gcd(a, d) !== 1);
      return { params: { a, b, c, d, e }, stem: `Consider the function $f(x) = \\dfrac{${poly([a, b, c])}}{${poly([d, 0, e])}}$, $x \\in \\mathbb{R}$.`, parts: [
        P(`Find $${LIM("\\infty", "f(x)")}$.`, 2, ans.frac(a, d), [
          `Divide the numerator and the denominator by $x^{2}$: $f(x) = \\dfrac{${expr([[a, ""], [b, "x^{-1}"], [c, "x^{-2}"]])}}{${expr([[d, ""], [e, "x^{-2}"]])}}$`,
          `As $x \\to \\infty$, the terms in $x^{-1}$ and $x^{-2}$ tend to zero, so the limit is $${frac(a, d)}$.`])] };
    } });
  reg({ ...LR, unknown: "removable-point", levels: [2], title: "Limit of a rational function where it is not defined",
    build({ rng }) {
      let p, q, r;
      do { p = rng.nonzero(-5, 5); q = rng.nonzero(-6, 6); r = rng.nonzero(-6, 6); } while (q === p || r === p || q === r || (p - q) % (p - r) === 0);
      // f(x) = (x - p)(x - q) / ((x - p)(x - r))
      return { params: { p, q, r }, stem: `Consider the function $f(x) = \\dfrac{${poly([1, -(p + q), p * q])}}{${poly([1, -(p + r), p * r])}}$, which is not defined at $x = ${p}$.`, parts: [
        P(`Find $${LIM(p, "f(x)")}$.`, 3, ans.frac(p - q, p - r), [
          `Factorise: $f(x) = \\dfrac{${fmt.factor(p)}${fmt.factor(q)}}{${fmt.factor(p)}${fmt.factor(r)}}$`,
          `For $x \\ne ${p}$, $f(x) = \\dfrac{${lin(1, -q)}}{${lin(1, -r)}}$.`,
          `$${LIM(p, "f(x)")} = ${fr2(p - q, p - r)}$`])] };
    } });

  const CT = { type: "t5-ahl-continuity", syllabus: ["5.12"], representation: "equation", format: "value" };
  reg({ ...CT, unknown: "continuity-constant", levels: [2], skills: ["AHL5.12.continuity"], title: "Find a constant that makes a piecewise function continuous",
    build({ rng }) {
      let a, b, k, p, c;
      do { a = rng.nonzero(-3, 3); b = rng.int(-6, 6); k = rng.nonzero(-6, 6); p = rng.nonzero(-3, 4); c = a * p * p + b - k * p; } while (Math.abs(c) > 15 || c === 0);
      const lhs = a * p * p + b;
      return { params: { a, b, c, p }, stem: `The function $f$ is defined by $f(x) = ${cases([[poly([a, 0, b]), `x < ${p}`], [`kx ${fmt.signed(c)}`, `x \\ge ${p}`]])}$, where $k$ is a constant. It is given that $f$ is continuous at $x = ${p}$.`, parts: [
        P("Find the value of $k$.", 3, ans.int(k), [
          `For continuity the two pieces must have the same value at $x = ${p}$.`,
          `$${expr([[a, `${br(p)}^{2}`], [b, ""]])} = ${coef(p, "k")} ${fmt.signed(c)}$, so $${lhs} = ${coef(p, "k")} ${fmt.signed(c)}$.`,
          `$${coef(p, "k")} = ${lhs - c}$, so $k = ${k}$.`])] };
    } });
  reg({ ...CT, unknown: "differentiable-join", levels: [3], skills: ["AHL5.12.differentiability", "AHL5.12.continuity"], title: "Find two constants that make a piecewise function differentiable",
    build({ rng }) {
      let al, be, p, cub, mm, c;
      do {
        cub = rng.bool(); al = rng.nonzero(-3, 3); be = rng.int(-5, 5); p = rng.nonzero(-2, 3);
        mm = cub ? 3 * al * p * p + be : 2 * al * p + be;
        c = (cub ? al * p * p * p + be * p : al * p * p + be * p) - mm * p;
      } while (mm === 0 || c === 0 || Math.abs(c) > 60);
      const left = cub ? poly([al, 0, be, 0]) : poly([al, be, 0]), dl = cub ? poly([3 * al, 0, be]) : poly([2 * al, be]);
      const val = cub ? al * p * p * p + be * p : al * p * p + be * p;
      return { params: { al, be, p, cub }, stem: `The function $f$ is defined by $f(x) = ${cases([[left, `x \\le ${p}`], ["ax + b", `x > ${p}`]])}$, where $a$ and $b$ are constants. It is given that $f$ is both continuous and differentiable at $x = ${p}$.`, parts: [
        P("Find the value of $a$.", 3, ans.int(mm), [
          `For $f$ to be differentiable at $x = ${p}$ the two pieces must have the same gradient there.`,
          `For $x < ${p}$, $f'(x) = ${dl}$, which tends to $${mm}$ as $x \\to ${p}$.`,
          `For $x > ${p}$, $f'(x) = a$, so $a = ${mm}$.`]),
        P("Find the value of $b$.", 3, ans.int(c), [
          `For continuity the two pieces must have the same value at $x = ${p}$.`,
          `The first piece gives $f(${p}) = ${val}$, so $${mm}${br(p)} + b = ${val}$.`,
          `$b = ${val} - ${paren(mm * p)} = ${c}$`])] };
    } });

  const HD = { type: "t5-ahl-higher-derivatives", syllabus: ["5.12"], representation: "equation", skills: ["AHL5.12.higher-derivatives"] };
  reg({ ...HD, unknown: "values-at-zero", format: "value", levels: [2], title: "Second and third derivatives at zero",
    build({ rng }) {
      const kind = rng.pick(["exp", "cos", "sin"]), a = rng.nonzero(-4, 4), k = rng.pick([2, 3, -2, -1, 4].filter((v) => kind === "exp" || v > 0)), b = rng.nonzero(-3, 3);
      const fx = kind === "exp" ? coef(a, ex(k)) : coef(a, tr(kind, k));
      const d1 = kind === "exp" ? coef(a * k, ex(k)) : kind === "cos" ? coef(-a * k, tr("sin", k)) : coef(a * k, tr("cos", k));
      const d2 = kind === "exp" ? coef(a * k * k, ex(k)) : kind === "cos" ? coef(-a * k * k, tr("cos", k)) : coef(-a * k * k, tr("sin", k));
      const d3 = kind === "exp" ? coef(a * k * k * k, ex(k)) : kind === "cos" ? coef(a * k * k * k, tr("sin", k)) : coef(-a * k * k * k, tr("cos", k));
      const v2 = kind === "exp" ? a * k * k : kind === "cos" ? -a * k * k : 0, t3 = kind === "exp" ? a * k * k * k : kind === "cos" ? 0 : -a * k * k * k;
      return { params: { kind, a, k, b }, stem: `Let $f(x) = ${fx} ${fmt.signed(b)}x^{3}$.`.replace(/(\+|-) 1x/, "$1 x"), parts: [
        P("Find $f''(0)$.", 2, ans.int(v2), [
          `$f'(x) = ${d1} ${fmt.signed(3 * b)}x^{2}$`,
          `$f''(x) = ${d2} ${fmt.signed(6 * b)}x$`,
          `$f''(0) = ${v2}$`]),
        P("Find $f^{(3)}(0)$.", 2, ans.int(t3 + 6 * b), [
          `$f^{(3)}(x) = ${d3} ${fmt.signed(6 * b)}$`,
          `$f^{(3)}(0) = ${t3 + 6 * b}$`])] };
    } });
  reg({ ...HD, unknown: "nth-pattern", format: "mcq", levels: [3], title: "Find the pattern in the derivatives of a product",
    build({ rng }) {
      const k = rng.pick([2, 3, -2, -3, 4, -1].filter(Boolean)), N = rng.int(5, 8);
      const kb = k < 0 ? `(${k})` : `${k}`, e = ex(k);
      // candidate: k^(n-1+s) (mode) e^{kx}
      const body = (mode) => (mode === 0 ? `\\left(n ${fmt.signed(k)}x\\right)`.replace(/(\+|-) 1x/, "$1 x") : mode === 1 ? `\\left(1 ${k < 0 ? "-" : "+"} ${Math.abs(k) === 1 ? "" : Math.abs(k)}nx\\right)` : `n\\left(1 ${fmt.signed(k)}x\\right)`.replace(/(\+|-) 1x/, "$1 x"));
      const opt = (s, mode, why) => ({ text: m(`f^{(n)}(x) = ${kb}^{${s ? "n" : "n - 1"}}${body(mode)}${e}`), value: [s, mode], why });
      const big = N * Math.pow(k, N - 1);
      return { params: { k, N }, stem: `Let $f(x) = x${e}$.`, parts: [
        P("Find $f''(0)$.", 2, ans.int(2 * k), [
          `By the product rule, $f'(x) = ${e} ${fmt.signed(k)}x${e}$`.replace(/(\+|-) 1x/, "$1 x"),
          `$f''(x) = ${coef(2 * k, e)} ${fmt.signed(k * k)}x${e}$`.replace(/(\+|-) 1x/, "$1 x"),
          `$f''(0) = ${2 * k}$`]),
        P("Which formula gives the $n$th derivative of $f$ for every positive integer $n$?", 3, ans.choice(rng, opt(0, 0), [
          opt(1, 0, "Check with $n = 1$: the formula must give $f'(x)$."),
          opt(0, 1, "Each differentiation adds one more copy of the exponential term; the term in $x$ keeps a single factor of $x$."),
          opt(0, 2, "Check with $n = 2$ against $f''(x)$."),
          opt(1, 1, "Check with $n = 1$: the formula must give $f'(x)$.")]), [
          `$f'(x) = ${kb}^{0}${body(0).replace("n", "1")}${e}$ and $f''(x) = ${kb}^{1}${body(0).replace("n", "2")}${e}$.`.replace(/\^\{1\}/, ""),
          `Each differentiation multiplies by $${k}$ and adds one more $${kb}^{n - 1}${e}$ from the product rule.`,
          `$f^{(n)}(x) = ${kb}^{n - 1}${body(0)}${e}$ (this can be proved by induction).`]),
        P(`Hence find $f^{(${N})}(0)$.`, 2, ans.int(big), [
          `$f^{(${N})}(0) = ${kb}^{${N - 1}} \\times ${N} \\times ${E_}^{0}$`,
          `$f^{(${N})}(0) = ${num(big)}$`])] };
    } });

  // =====================================================================================
  // 5.13 l'Hopital's rule and limits by series
  // =====================================================================================
  const LH = { type: "t5-ahl-lhopital", syllabus: ["5.13"], representation: "equation", format: "value" };
  reg({ ...LH, unknown: "standard-limit", levels: [1], skills: ["AHL5.13.standard-limit"], title: "Use the standard limit of sin x over x",
    build({ rng }) {
      let a, b; const kind = rng.pick(["sin-x", "sin-sin", "tan-x"]);
      do { a = rng.int(1, 9); b = rng.int(2, 9); } while (gcd(a, b) !== 1);
      const top = kind === "tan-x" ? tr("tan", a) : tr("sin", a), bot = kind === "sin-sin" ? tr("sin", b) : coef(b, "x");
      const w = kind === "sin-x" ? [`$\\dfrac{${top}}{${bot}} = ${frac(a, b)} \\times \\dfrac{${top}}{${coef(a, "x")}}$`.replace("= 1 \\times", "="), `As $x \\to 0$, $\\dfrac{${top}}{${coef(a, "x")}} \\to 1$, so the limit is $${frac(a, b)}$.`]
        : kind === "sin-sin" ? [`$\\dfrac{${top}}{${bot}} = \\dfrac{${top}}{${coef(a, "x")}} \\times \\dfrac{${coef(b, "x")}}{${bot}} \\times ${frac(a, b)}$`, `As $x \\to 0$, each of the first two factors tends to $1$, so the limit is $${frac(a, b)}$.`]
        : [`$\\dfrac{${top}}{${bot}} = \\dfrac{${tr("sin", a)}}{${coef(a, "x")}} \\times \\dfrac{${a}}{${coef(b, tr("cos", a))}}$`, `As $x \\to 0$, $\\dfrac{${tr("sin", a)}}{${coef(a, "x")}} \\to 1$ and $${tr("cos", a)} \\to 1$, so the limit is $${frac(a, b)}$.`];
      return { params: { kind, a, b }, stem: `It is given that $${LIM("0", "\\dfrac{\\sin \\theta}{\\theta}", "\\theta")} = 1$.`, parts: [
        P(`Find $${LIM("0", `\\dfrac{${top}}{${bot}}`)}$.`, 2, ans.frac(a, b), w)] };
    } });
  // forms for one application: [numerator, denominator, numerator', denominator', value of num' at the point, value of den' at the point, point]
  const once = (rng) => {
    const kind = rng.pick(["exp-sin", "ln-lin", "exp-exp", "pow-pow", "pow-ln", "tan-exp"]);
    let a, b, c, U, V;
    for (;;) {
      a = rng.nonzero(-6, 7); b = rng.int(2, 7); c = rng.nonzero(-5, 5);
      if (kind === "pow-pow" || kind === "pow-ln") a = Math.abs(a) + 1;
      if (kind === "pow-pow") b += 1;
      if (kind === "tan-exp") a = Math.abs(a);
      U = kind === "exp-exp" ? a - c : kind === "pow-ln" ? a : a; V = kind === "pow-ln" ? 1 : kind === "tan-exp" ? b : b;
      if (kind === "exp-exp" && (a === c)) continue;
      if (kind === "pow-ln") break;
      if (gcd(U, V) === 1 && U !== 0) break;
    }
    const f = {
      "exp-sin": [`${ex(a)} - 1`, tr("sin", b), coef(a, ex(a)), coef(b, tr("cos", b)), 0],
      "ln-lin": [`\\ln(1 ${fmt.signed(a)}x)`.replace(/(\+|-) 1x/, "$1 x"), coef(b, "x"), `\\dfrac{${a}}{1 ${fmt.signed(a)}x}`.replace(/(\+|-) 1x/, "$1 x"), `${b}`, 0],
      "exp-exp": [`${ex(a)} - ${ex(c)}`, coef(b, "x"), `${coef(a, ex(a))} ${fmt.signed(-c)}${ex(c)}`.replace(/(\+|-) 1\\mathrm/, "$1 \\mathrm"), `${b}`, 0],
      "pow-pow": [`x^{${a}} - 1`, `x^{${b}} - 1`, coef(a, pw("x", a - 1)), coef(b, pw("x", b - 1)), 1],
      "pow-ln": [`x^{${a}} - 1`, "\\ln x", coef(a, pw("x", a - 1)), "\\dfrac{1}{x}", 1],
      "tan-exp": [tr("tan", a), `${ex(b)} - 1`, `${a === 1 ? "" : a}\\sec^{2} ${coef(a, "x")}`, coef(b, ex(b)), 0],
    }[kind];
    return { kind, a, b, c, U, V, f };
  };
  reg({ ...LH, unknown: "once", levels: [2], skills: ["AHL5.13.lhopital"], title: "Find a limit with one use of l'Hôpital's rule",
    build({ rng }) {
      const { kind, a, b, c, U, V, f } = once(rng), [nu, de, dn, dd2, at] = f;
      return { params: { kind, a, b, c }, stem: `Consider the limit $${LIM(at, `\\dfrac{${nu}}{${de}}`)}$.`, parts: [
        P("Use l'Hôpital's rule to find the value of this limit.", 3, ans.frac(U, V), [
          `At $x = ${at}$ the numerator and the denominator are both zero, so l'Hôpital's rule applies.`,
          `The derivative of the numerator is $${dn}$ and the derivative of the denominator is $${dd2}$.`,
          `At $x = ${at}$ these are $${U}$ and $${V}$, so the limit is $${frac(U, V)}$.`])] };
    } });
  reg({ ...LH, unknown: "infinity-form", levels: [2], skills: ["AHL5.13.lhopital"], title: "Find a limit of the form infinity over infinity",
    build({ rng }) {
      const kind = rng.pick(["lin-ln", "exp-lin", "ln-ln"]);
      let a, b, c, d;
      do { a = rng.nonzero(-7, 7); c = rng.int(2, 7); b = rng.int(1, 6); d = rng.int(1, 6); } while (gcd(a, c) !== 1 || (kind === "ln-ln" && a < 0));
      const f = { "lin-ln": [`${coef(a, "x")} + ${coef(b, "\\ln x")}`, lin(c, d), `${a} + \\dfrac{${b}}{x}`, `${c}`, `As $x \\to \\infty$, $\\dfrac{${b}}{x} \\to 0$, so the limit is $${frac(a, c)}$.`],
        "exp-lin": [`${coef(a, ex(1))} + ${coef(b, "x")}`, `${coef(c, ex(1))} + ${d}`, `${coef(a, ex(1))} + ${b}`, coef(c, ex(1)), `This is still of the form $\\dfrac{\\infty}{\\infty}$; applying the rule again gives $\\dfrac{${coef(a, ex(1))}}{${coef(c, ex(1))}}$, so the limit is $${frac(a, c)}$.`],
        "ln-ln": [`\\ln\\left(x^{${a}} + ${b}\\right)`, `\\ln\\left(x^{${c}} + ${d}\\right)`, `${coef(a, pw("x", a - 1))}\\left(x^{${a}} + ${b}\\right)^{-1}`.replace(/\^\{1\}/, ""), `${coef(c, pw("x", c - 1))}\\left(x^{${c}} + ${d}\\right)^{-1}`, `The quotient of these is $\\dfrac{${coef(a, pw("x", a - 1))}\\left(x^{${c}} + ${d}\\right)}{${coef(c, pw("x", c - 1))}\\left(x^{${a}} + ${b}\\right)}$, whose numerator and denominator both have leading term in $x^{${a + c - 1}}$, so the limit is $${frac(a, c)}$.`] }[kind];
      const fixed = f.map((s) => s.replace(/x\^\{1\}/g, "x").replace(/\+ -/g, "- "));
      return { params: { kind, a, b, c, d }, stem: `Consider the limit $${LIM("\\infty", `\\dfrac{${fixed[0]}}{${fixed[1]}}`)}$.`, parts: [
        P("Use l'Hôpital's rule to find the value of this limit.", 3, ans.frac(a, c), [
          `As $x \\to \\infty$ the numerator and the denominator both become infinite, so l'Hôpital's rule applies.`,
          `The derivative of the numerator is $${fixed[2]}$ and the derivative of the denominator is $${fixed[3]}$.`,
          fixed[4]])] };
    } });
  reg({ ...LH, unknown: "twice", levels: [3], skills: ["AHL5.13.lhopital-repeated", "AHL5.13.lhopital"], title: "Find a limit with repeated use of l'Hôpital's rule",
    build({ rng }) {
      const kind = rng.pick(["cos", "exp", "ln", "coscos", "xsin"]);
      let a, b, U, V;
      do {
        a = rng.int(2, 6); b = rng.int(1, 6);
        if (kind === "exp" || kind === "ln") a = a * rng.sign();
        [U, V] = kind === "cos" || kind === "exp" ? [a * a, 2 * b] : kind === "ln" ? [-a * a, 2 * b] : kind === "coscos" ? [b * b - a * a, 2] : [2 * a, b * b];
      } while (U === 0 || (kind === "coscos" && a === b) || (kind === "xsin" && b === 1 && a > 9));
      const ax = coef(a, "x"), l1 = `(1 ${fmt.signed(a)}x)`.replace(/(\+|-) 1x/, "$1 x");
      const f = {
        cos: [`1 - ${tr("cos", a)}`, coef(b, "x^{2}"), coef(a, tr("sin", a)), coef(2 * b, "x"), coef(a * a, tr("cos", a)), `${2 * b}`],
        exp: [`${ex(a)} - 1 ${fmt.signed(-a)}x`, coef(b, "x^{2}"), `${coef(a, ex(a))} ${fmt.signed(-a)}`, coef(2 * b, "x"), coef(a * a, ex(a)), `${2 * b}`],
        ln: [`\\ln${l1} ${fmt.signed(-a)}x`, coef(b, "x^{2}"), `${a}${l1}^{-1} ${fmt.signed(-a)}`, coef(2 * b, "x"), `${-a * a}${l1}^{-2}`, `${2 * b}`],
        coscos: [`${tr("cos", a)} - ${tr("cos", b)}`, "x^{2}", `${coef(-a, tr("sin", a))} + ${coef(b, tr("sin", b))}`, "2x", `${coef(-a * a, tr("cos", a))} + ${coef(b * b, tr("cos", b))}`, "2"],
        xsin: [`x${tr("sin", a)}`, `1 - ${tr("cos", b)}`, `${tr("sin", a)} + ${ax}${tr("cos", a)}`, coef(b, tr("sin", b)), `${coef(2 * a, tr("cos", a))} - ${coef(a * a, "x")}${tr("sin", a)}`, coef(b * b, tr("cos", b))],
      }[kind];
      return { params: { kind, a, b }, stem: `Consider the limit $${LIM("0", `\\dfrac{${f[0]}}{${f[1]}}`)}$.`, parts: [
        P("Use l'Hôpital's rule to find the value of this limit.", 5, ans.frac(U, V), [
          `At $x = 0$ the numerator and the denominator are both zero, so l'Hôpital's rule applies.`,
          `$${LIM("0", `\\dfrac{${f[0]}}{${f[1]}}`)} = ${LIM("0", `\\dfrac{${f[2]}}{${f[3]}}`)}$`,
          `At $x = 0$ the new numerator and denominator are again both zero, so the rule is applied a second time.`,
          `$${LIM("0", `\\dfrac{${f[2]}}{${f[3]}}`)} = ${LIM("0", `\\dfrac{${f[4]}}{${f[5]}}`)}$`,
          `Substituting $x = 0$ gives $${fr2(U, V)}$.`])] };
    } });
  reg({ ...LH, unknown: "unknown-constant", levels: [3], skills: ["AHL5.13.indeterminate-form-condition", "AHL5.13.lhopital-repeated"], title: "Find a constant for which a limit is finite, then the limit",
    build({ rng }) {
      const kind = rng.pick(["exp", "sin", "ln"]);
      let a, c;
      do { a = rng.nonzero(-4, 4); c = rng.int(1, 4); } while (Math.abs(a) === 1 && c === 1 || (kind === "sin" && a < 0));
      const k = c * a, l1 = `(1 ${fmt.signed(a)}x)`.replace(/(\+|-) 1x/, "$1 x");
      const [U, V] = kind === "exp" ? [c * a * a, 2] : kind === "sin" ? [-c * a * a * a, 6] : [-c * a * a, 2];
      const pwr = kind === "sin" ? 3 : 2;
      const f = {
        exp: [`${coef(c, ex(a))} - ${c} - kx`, `${coef(c * a, ex(a))} - k`, coef(c * a * a, ex(a)), "2", ""],
        sin: [`${coef(c, tr("sin", a))} - kx`, `${coef(c * a, tr("cos", a))} - k`, coef(-c * a * a, tr("sin", a)), "6x", coef(-c * a * a * a, tr("cos", a))],
        ln: [`${coef(c, `\\ln${l1}`)} - kx`, `${c * a}${l1}^{-1} - k`, `${-c * a * a}${l1}^{-2}`, "2", ""],
      }[kind];
      const d1 = kind === "sin" ? "3x^{2}" : "2x";
      return { params: { kind, a, c }, stem: `It is given that $${LIM("0", `\\dfrac{${f[0]}}{x^{${pwr}}}`)}$ exists and is finite, where $k$ is a constant.`, parts: [
        P("Find the value of $k$.", 3, ans.int(k), [
          `At $x = 0$ the numerator and the denominator are both zero. Applying l'Hôpital's rule gives $${LIM("0", `\\dfrac{${f[1]}}{${d1}}`)}$.`,
          `The denominator tends to zero, so the limit can only be finite if the numerator also tends to zero.`,
          `At $x = 0$ the numerator is $${k} - k$, so $k = ${k}$.`]),
        P("Find the value of the limit.", 3, ans.frac(U, V), kind === "sin" ? [
          `With $k = ${k}$, apply the rule again: $${LIM("0", `\\dfrac{${f[2]}}{${f[3]}}`)}$, where the numerator and the denominator are again both zero at $x = 0$.`,
          `Apply the rule a third time: $${LIM("0", `\\dfrac{${f[4]}}{6}`)}$`,
          `The limit is $${fr2(U, V)}$.`] : [
          `With $k = ${k}$, apply the rule again: $${LIM("0", `\\dfrac{${f[2]}}{${f[3]}}`)}$`,
          `Substituting $x = 0$ gives $${fr2(U, V)}$.`])] };
    } });
  reg({ ...LH, syllabus: ["5.13", "5.19"], unknown: "by-series", levels: [3], skills: ["AHL5.13.limit-by-series", "AHL5.19.standard-series"], title: "Find a limit by substituting Maclaurin series",
    build({ rng }) {
      let a, b, c, n, d;
      do { a = rng.int(1, 4); b = rng.int(1, 4); c = rng.int(1, 6); n = a * (3 * b * b - a * a); d = 6 * c; } while (n === 0);
      // sin(ax) - ax cos(bx) = x^3 (-a^3/6 + a b^2/2) + ...
      const top = `${tr("sin", a)} - ${coef(a, "x")}${tr("cos", b)}`;
      return { params: { a, b, c }, stem: `Let $f(x) = ${top}$.`, parts: [
        P("The Maclaurin series of $f$ begins with a term in $x^{3}$. Find the coefficient of $x^{3}$.", 3, ans.frac(n, 6), [
          `$${tr("sin", a)} = ${coef(a, "x")} - \\dfrac{${a === 1 ? "x^{3}" : `(${coef(a, "x")})^{3}`}}{6} + \\dots = ${coef(a, "x")} - ${frac(a * a * a, 6)}x^{3} + \\dots$`.replace(/ 1x\^/, " x^"),
          `$${coef(a, "x")}${tr("cos", b)} = ${coef(a, "x")}\\left(1 - \\dfrac{${b === 1 ? "x^{2}" : `(${coef(b, "x")})^{2}`}}{2} + \\dots\\right) = ${coef(a, "x")} - ${frac(a * b * b, 2)}x^{3} + \\dots$`.replace(/ 1x\^/, " x^"),
          `Subtracting, the coefficient of $x^{3}$ is $-${frac(a * a * a, 6)} + ${frac(a * b * b, 2)} = ${frac(n, 6)}$.`]),
        P(`Hence find $${LIM("0", `\\dfrac{f(x)}{${coef(c, "x^{3}")}}`)}$.`, 2, ans.frac(n, d), [
          `$f(x) = ${coef(rat0(n, 6), "x^{3}")} + \\dots$, so dividing by $${coef(c, "x^{3}")}$ gives $${frac(n, d)} + \\dots$, where the remaining terms contain positive powers of $x$.`,
          `As $x \\to 0$ the limit is $${frac(n, d)}$.`])] };
    } });
  function rat0(n, d) { return fmt.Q(n, d); }

  // =====================================================================================
  // 5.14 implicit differentiation, related rates, optimisation with endpoints
  // =====================================================================================
  const IM = { type: "t5-ahl-implicit", syllabus: ["5.14"], representation: "equation" };
  reg({ ...IM, unknown: "conic-gradient", format: "value", levels: [1], skills: ["AHL5.14.implicit-derivative"], title: "Gradient of a conic at a point by implicit differentiation",
    build({ rng }) {
      let a, b, p, q;
      do { a = rng.int(1, 4); b = rng.pick([1, 2, 3, -1, -2]); p = rng.nonzero(-4, 4); q = rng.nonzero(-4, 4); } while (a === b || a * p * p + b * q * q === 0 || gcd(a, Math.abs(b)) !== 1);
      const c = a * p * p + b * q * q;
      return { params: { a, b, p, q }, stem: `The curve $C$ has equation $${expr([[a, "x^{2}"], [b, "y^{2}"]])} = ${c}$. The point $\\mathrm{A}${point(p, q)}$ lies on $C$.`, parts: [
        P(`Find the value of $${D}$ at $\\mathrm{A}$.`, 2, ans.frac(-a * p, b * q), [
          `Differentiate each term with respect to $x$: $${coef(2 * a, "x")} ${fmt.signed(2 * b)}y${D} = 0$`,
          `At $\\mathrm{A}$: $${2 * a * p} ${fmt.signed(2 * b * q)}${D} = 0$, so $${D} = ${fr2(-2 * a * p, 2 * b * q)}$.`.replace(/(\+|-) 1\\dfrac\{\\mathrm/, "$1 \\dfrac{\\mathrm")])] };
    } });
  reg({ ...IM, unknown: "gradient-at-point", format: "value", levels: [2], skills: ["AHL5.14.implicit-derivative"], title: "Gradient of an implicit curve with a product term",
    build({ rng }) {
      let a, p, q, N, Dn;
      do { a = rng.pick([-4, -3, -1, 1, 3, 4]); p = rng.nonzero(-3, 3); q = rng.nonzero(-3, 3); N = -(2 * p + a * q); Dn = a * p + 2 * q; } while (Dn === 0 || N === 0 || p * p + a * p * q + q * q === 0);
      const c = p * p + a * p * q + q * q;
      return { params: { a, p, q }, stem: `The curve $C$ has equation $x^{2} ${fmt.signed(a)}xy + y^{2} = ${c}$. The point $\\mathrm{A}${point(p, q)}$ lies on $C$.`.replace(/(\+|-) 1xy/, "$1 xy"), parts: [
        P(`Find the value of $${D}$ at $\\mathrm{A}$.`, 4, ans.frac(N, Dn), [
          `By the product rule, $\\dfrac{\\mathrm{d}}{\\mathrm{d}x}(xy) = y + x${D}$.`,
          `Differentiating the equation: $2x ${fmt.signed(a)}\\left(y + x${D}\\right) + 2y${D} = 0$`.replace(/(\+|-) 1\\left/, "$1 \\left"),
          `At $\\mathrm{A}$: $${2 * p} ${fmt.signed(a)}\\left(${q} ${fmt.signed(p)}${D}\\right) ${fmt.signed(2 * q)}${D} = 0$`.replace(/(\+|-) 1\\left/, "$1 \\left").replace(/(\+|-) 1\\dfrac\{\\mathrm/, "$1 \\dfrac{\\mathrm"),
          `$${coef(Dn, D)} = ${N}$, so $${D} = ${frac(N, Dn)}$.`])] };
    } });
  reg({ ...IM, syllabus: ["5.14", "5.4"], unknown: "tangent-intercept", format: "mcq", levels: [3], skills: ["AHL5.14.implicit-tangent-normal", "AHL5.14.implicit-derivative"], title: "Implicit derivative and the tangent at a point",
    build({ rng }) {
      let a, p, q, N, Dn, c;
      do { a = rng.nonzero(-3, 3); p = rng.nonzero(-3, 3); q = rng.nonzero(-2, 2); N = -(2 * p + a * q); Dn = 3 * q * q + a * p; c = q * q * q + a * p * q + p * p; }
      while (Dn === 0 || N === 0 || c === 0 || Math.abs(Dn / gcd(N, Dn)) > 9);
      const g = gcd(N, Dn) * (Dn < 0 ? -1 : 1), mn = N / g, md = Dn / g; // gradient mn/md
      const top = (cx, cy) => expr([[cx, "x"], [cy, "y"]]), bot = (cy2, cx) => expr([[cy2, "y^{2}"], [cx, "x"]]);
      const opt = (v, why) => ({ text: m(`${D} = -\\dfrac{${top(v[0], v[1])}}{${bot(v[2], v[3])}}`), value: v, why });
      const ic = fmt.rat.sub(q, fmt.rat.mul(fmt.Q(mn, md), p));
      return { params: { a, p, q }, stem: `The curve $C$ has equation $y^{3} ${fmt.signed(a)}xy + x^{2} = ${c}$. The point $\\mathrm{A}${point(p, q)}$ lies on $C$.`.replace(/(\+|-) 1xy/, "$1 xy"), parts: [
        P(`Which expression is $${D}$?`, 3, ans.choice(rng, opt([2, a, 3, a]), [
          opt([2, 0, 3, a], "The product rule on $xy$ gives two terms; the term in $y$ is missing."),
          opt([2, a, 3, 0], `The product rule on $xy$ gives two terms; the term containing $${D}$ is missing.`),
          opt([2, a, 1, a], "The derivative of $y^{3}$ with respect to $x$ is $3y^{2}$ times the derivative of $y$."),
          opt([2, -a, 3, a], "Check the signs when collecting the terms.")]), [
          `Differentiate each term with respect to $x$: $3y^{2}${D} ${fmt.signed(a)}\\left(y + x${D}\\right) + 2x = 0$`.replace(/(\+|-) 1\\left/, "$1 \\left"),
          `$\\left(${bot(3, a)}\\right)${D} = -\\left(${top(2, a)}\\right)$`,
          `$${D} = -\\dfrac{${top(2, a)}}{${bot(3, a)}}$`]),
        P("Find the gradient of the tangent to $C$ at $\\mathrm{A}$.", 1, ans.frac(mn, md), [
          `At $\\mathrm{A}$: $${D} = -\\dfrac{${expr([[2, br(p)], [a, br(q)]])}}{${expr([[3, `${br(q)}^{2}`], [a, br(p)]])}} = ${frac(mn, md)}$`.replace(/(\+|-) 1\(/g, "$1 (").replace(/\{1\(/, "{(")]),
        P("The tangent to $C$ at $\\mathrm{A}$ meets the $y$-axis at the point $(0,\\, c)$. Find the value of $c$.", 2, ans.frac(ic.n, ic.d), [
          `The tangent is $y - ${paren(q)} = ${frac(mn, md)}\\left(x - ${paren(p)}\\right)$.`.replace("= 1\\left", "= \\left").replace("= -1\\left", "= -\\left"),
          `At $x = 0$: $c = ${q} - ${fmt.wrap(frac(mn, md))}${br(p)} = ${frac(ic.n, ic.d)}$`])] };
    } });

  const RR = { type: "t5-ahl-related-rates", syllabus: ["5.14"], format: "value", skills: ["AHL5.14.related-rates"] };
  reg({ ...RR, unknown: "rate-of-measure", representation: "words", levels: [2], title: "Rate of change of an area or volume from the rate of a radius",
    build({ rng }) {
      const kind = rng.pick(["circle", "sphere-volume", "sphere-surface"]), v = rng.pick([2, 3, 4, 5, 0.5, 1.5]), r = rng.int(3, 12);
      const k = kind === "circle" ? 2 * r * v : kind === "sphere-volume" ? 4 * r * r * v : 8 * r * v;
      const s = { circle: ["A circular patch of oil on water spreads so that its radius", "area $A$ of the patch", "A", "A = \\pi r^{2}", "2\\pi r", "\\text{ cm}^{2}\\text{ s}^{-1}", `2\\pi${br(r)}`],
        "sphere-volume": ["A spherical balloon is inflated so that its radius", "volume $V$ of the balloon", "V", "V = \\dfrac{4}{3}\\pi r^{3}", "4\\pi r^{2}", "\\text{ cm}^{3}\\text{ s}^{-1}", `4\\pi${br(r)}^{2}`],
        "sphere-surface": ["A spherical soap bubble grows so that its radius", "surface area $S$ of the bubble", "S", "S = 4\\pi r^{2}", "8\\pi r", "\\text{ cm}^{2}\\text{ s}^{-1}", `8\\pi${br(r)}`] }[kind];
      return { params: { kind, v, r }, stem: `${s[0]} $r$ increases at a constant rate of $${num(v)}\\text{ cm s}^{-1}$.`, parts: [
        P(`Find the rate at which the ${s[1]} is increasing at the instant when $r = ${r}\\text{ cm}$. Give your answer in $${s[5].replace("\\text{ ", "\\text{")}$, as a multiple of $\\pi$.`, 3, ans.exact(k * Math.PI, `${num(k)}\\pi`), [
          `$${s[3]}$, so $${dd(s[2], "r")} = ${s[4]}$.`,
          `By the chain rule, $${dd(s[2], "t")} = ${dd(s[2], "r")} \\times ${dd("r", "t")} = ${s[4]} \\times ${num(v)}$.`,
          `When $r = ${r}$: $${dd(s[2], "t")} = ${s[6]} \\times ${num(v)} = ${num(k)}\\pi${s[5]}$`])] };
    } });
  reg({ ...RR, unknown: "radius-rate-from-volume", representation: "words", levels: [3], title: "Rate of change of a radius from the rate of a volume",
    build({ rng }) {
      let q, r;
      do { q = rng.pick([10, 12, 20, 24, 30, 36, 40, 50, 60, 72]); r = rng.int(2, 6); } while (false);
      const g = gcd(q, 4 * r * r), n = q / g, d = 4 * r * r / g, s2 = fmt.Q(2 * q, r);
      const tex = d === 1 ? `\\dfrac{${n}}{\\pi}` : `\\dfrac{${n}}{${d}\\pi}`;
      return { params: { q, r }, stem: `Air is pumped into a spherical balloon at a constant rate of $${q}\\text{ cm}^{3}\\text{ s}^{-1}$. The balloon has radius $r\\text{ cm}$, volume $V\\text{ cm}^{3}$ and surface area $S\\text{ cm}^{2}$, where $V = \\dfrac{4}{3}\\pi r^{3}$ and $S = 4\\pi r^{2}$.`, parts: [
        P(`Find the exact value of $${dd("r", "t")}$ at the instant when $r = ${r}$.`, 3, ans.exact(q / (4 * Math.PI * r * r), tex), [
          `$${dd("V", "r")} = 4\\pi r^{2}$, and by the chain rule $${dd("V", "t")} = ${dd("V", "r")} \\times ${dd("r", "t")}$.`,
          `When $r = ${r}$: $${q} = 4\\pi${br(r)}^{2} \\times ${dd("r", "t")} = ${4 * r * r}\\pi \\times ${dd("r", "t")}$`,
          `$${dd("r", "t")} = ${tex}$`]),
        P(`Find the value of $${dd("S", "t")}$ at this instant.`, 2, ans.frac(s2.n, s2.d), [
          `$${dd("S", "r")} = 8\\pi r$, so $${dd("S", "t")} = 8\\pi r \\times ${dd("r", "t")}$.`,
          `$${dd("S", "t")} = 8\\pi${br(r)} \\times ${tex} = ${frac(s2.n, s2.d)}$`])] };
    } });
  reg({ ...RR, unknown: "sliding-rod", representation: "diagram", levels: [3], title: "A rod sliding down a wall",
    build({ rng }) {
      const [x, y, L] = rng.pick([[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10], [5, 12, 13], [12, 5, 13], [8, 15, 17], [15, 8, 17], [9, 12, 15], [12, 9, 15], [20, 21, 29], [21, 20, 29], [12, 16, 20], [16, 12, 20]]);
      const v = rng.int(2, 6), r = fmt.Q(-x * v, y);
      return { params: { x, y, L, v }, stem: `A straight rod $[\\mathrm{AB}]$ of length $${L}\\text{ cm}$ rests with $\\mathrm{A}$ on horizontal ground and $\\mathrm{B}$ against a vertical wall. The point $\\mathrm{O}$ is at the foot of the wall, with $\\mathrm{OA} = x\\text{ cm}$ and $\\mathrm{OB} = y\\text{ cm}$. The end $\\mathrm{A}$ slides away from the wall at a constant rate of $${v}\\text{ cm s}^{-1}$. The diagram shows the rod at the instant when $x = ${x}$.`,
        graph: { alt: "A right-angled triangle formed by the ground, the wall and the rod", shapes: [
          { type: "polygon", points: [[0, 0], [x, 0], [0, y]], labels: ["O", "A", "B"], sides: ["x", `${L} cm`, "y"] },
          { type: "angle", at: [0, 0], from: [x, 0], to: [0, y], right: true }] },
        parts: [
          P(`Find the value of $y$ at the instant when $x = ${x}$.`, 1, ans.int(y), [`$x^{2} + y^{2} = ${L}^{2}$, so $y = \\sqrt{${L * L} - ${x * x}} = ${y}$.`]),
          P(`Find the value of $${dd("y", "t")}$ at this instant.`, 4, ans.frac(r.n, r.d), [
            `Differentiate $x^{2} + y^{2} = ${L * L}$ with respect to $t$: $2x${dd("x", "t")} + 2y${dd("y", "t")} = 0$`,
            `Substitute $x = ${x}$, $y = ${y}$ and $${dd("x", "t")} = ${v}$: $2${br(x)}${br(v)} + 2${br(y)}${dd("y", "t")} = 0$`,
            `$${dd("y", "t")} = ${fr2(-2 * x * v, 2 * y)}$`,
            `The negative sign shows that $\\mathrm{B}$ is moving down the wall.`])] };
    } });
  reg({ ...RR, unknown: "cone-filling", representation: "words", levels: [4], calculator: true, title: "Water poured into a conical container",
    build({ rng }) {
      let R, H, h0, q;
      do { R = rng.int(4, 12); H = rng.int(10, 30); h0 = rng.int(3, H - 3); q = rng.pick([15, 20, 25, 30, 40, 50, 60, 75]); } while (H <= R || (R * h0 * 10) % H !== 0);
      const r0 = R * h0 / H, dh = q / (Math.PI * r0 * r0), dA = 2 * q / h0;
      return { params: { R, H, h0, q }, stem: `A container has the shape of an inverted right circular cone of base radius $${R}\\text{ cm}$ and height $${H}\\text{ cm}$, with its axis vertical. Water is poured in at a constant rate of $${q}\\text{ cm}^{3}\\text{ s}^{-1}$. At time $t$ seconds the depth of the water is $h\\text{ cm}$ and the water surface is a circle of radius $r\\text{ cm}$.`, parts: [
        P(`Find the value of $r$ when $h = ${h0}$.`, 1, ans.dec(r0), [`By similar triangles $\\dfrac{r}{h} = \\dfrac{${R}}{${H}}$, so $r = ${frac(R, H)}h = ${num(r0)}$ when $h = ${h0}$.`.replace("= 1h", "= h")]),
        P(`Find the rate, in $\\text{cm s}^{-1}$, at which the depth of the water is increasing when $h = ${h0}$.`, 4, ans.sf(dh), [
          `$V = \\dfrac{1}{3}\\pi r^{2}h = \\dfrac{1}{3}\\pi\\left(${frac(R, H)}h\\right)^{2}h = ${frac(R * R, 3 * H * H)}\\pi h^{3}$`.replace("(1h)", "(h)"),
          `$${dd("V", "h")} = ${frac(R * R, H * H)}\\pi h^{2}$, which is $${sf(Math.PI * r0 * r0, 4)}$ when $h = ${h0}$.`,
          `By the chain rule, $${dd("h", "t")} = ${dd("V", "t")} \\div ${dd("V", "h")} = ${q} \\div ${sf(Math.PI * r0 * r0, 4)}$`,
          `$${dd("h", "t")} = ${sf(dh)}\\text{ cm s}^{-1}$`]),
        P(`Find the rate, in $\\text{cm}^{2}\\text{ s}^{-1}$, at which the area of the water surface is increasing when $h = ${h0}$.`, 2, ans.sf(dA), [
          `The surface has area $A = \\pi r^{2} = ${frac(R * R, H * H)}\\pi h^{2}$, so $${dd("A", "h")} = ${frac(2 * R * R, H * H)}\\pi h$.`,
          `$${dd("A", "t")} = ${dd("A", "h")} \\times ${dd("h", "t")} = ${sf(2 * Math.PI * R * R * h0 / (H * H), 4)} \\times ${sf(dh, 4)} = ${sf(dA)}\\text{ cm}^{2}\\text{ s}^{-1}$`])] };
    } });
  reg({ type: "t5-ahl-endpoint-optimisation", syllabus: ["5.14"], unknown: "cost-on-domain", representation: "words", format: "value", levels: [4], calculator: true, skills: ["AHL5.14.endpoint-optimisation"], title: "Least and greatest cost on a restricted domain",
    build({ rng }) {
      let a, b, lo, hi, vs;
      do { a = rng.pick([0.02, 0.03, 0.04, 0.05, 0.06, 0.08]); b = rng.pick([90, 120, 150, 180, 200, 240, 300, 350]); lo = rng.pick([20, 25, 30, 40, 45]); hi = lo + rng.pick([25, 30, 40, 50]); vs = Math.sqrt(b / a); }
      while (Math.abs(vs - hi) < 3 || Math.abs(vs - lo) < 3 || vs < lo || Math.abs(a * lo + b / lo - a * hi - b / hi) < 0.05);
      const C = (v) => a * v + b / v, inside = vs < hi, best = inside ? vs : hi, worst = C(lo) > C(hi) ? lo : hi;
      return { params: { a, b, lo, hi }, stem: `A haulage firm models the running cost of a lorry on a long journey, $C$ euros per hour, by $C(v) = ${num(a)}v + \\dfrac{${b}}{v}$` + `, where $v\\text{ km h}^{-1}$ is the constant speed of the lorry. On this journey the speed must satisfy $${lo} \\le v \\le ${hi}$.`, parts: [
        P("Find the positive value of $v$ for which $C'(v) = 0$.", 2, ans.sf(vs), [
          `$C'(v) = ${num(a)} - \\dfrac{${b}}{v^{2}}$`,
          `$C'(v) = 0$ gives $v^{2} = ${num(b / a)}$, so $v = ${sf(vs)}$.`]),
        P("Find the least possible running cost per hour on this journey.", 2, ans.sf(C(best)), inside ? [
          `$v = ${sf(vs)}$ lies in the domain, and $C'(v)$ changes from negative to positive there, so the cost is least at this speed.`,
          `$C(${sf(vs)}) = ${sf(C(vs))}$ euros per hour`] : [
          `$v = ${sf(vs)}$ is outside the domain. For $${lo} \\le v \\le ${hi}$, $C'(v) < 0$, so $C$ is decreasing and the least cost is at the endpoint $v = ${hi}$.`,
          `$C(${hi}) = ${num(a)}${br(hi)} + \\dfrac{${b}}{${hi}} = ${sf(C(hi))}$ euros per hour`]),
        P("Find the greatest possible running cost per hour on this journey.", 2, ans.sf(C(worst)), [
          `There is no local maximum, so the greatest cost is at an endpoint of the domain.`,
          `$C(${lo}) = ${sf(C(lo))}$ and $C(${hi}) = ${sf(C(hi))}$, so the greatest cost is $${sf(C(worst))}$ euros per hour.`])] };
    } });

  // PART-B

})(typeof window !== "undefined" ? window : globalThis);
