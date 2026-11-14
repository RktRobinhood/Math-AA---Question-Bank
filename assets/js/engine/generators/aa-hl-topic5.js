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

  // =====================================================================================
  // 5.15 further standard derivatives and integrals
  // =====================================================================================
  const CSC = "\\operatorname{cosec}";
  const INT = (lo, hi, body, v) => `\\displaystyle\\int_{${lo}}^{${hi}} ${body}\\,\\mathrm{d}${v || "x"}`;
  // (n/d) sym with the symbol on top of the fraction: \dfrac{3\pi}{4}, \dfrac{\sqrt{3}}{2}, 2\ln 3
  const symQ = (n, d, sym) => { const q = fmt.Q(n, d); if (q.n === 0) return "0"; const top = (Math.abs(q.n) === 1 ? "" : Math.abs(q.n)) + sym; return (q.n < 0 ? "-" : "") + (q.d === 1 ? top : `\\dfrac{${top}}{${q.d}}`); };
  const SDV = { type: "t5-ahl-standard-derivatives", syllabus: ["5.15"], representation: "equation" };
  const sdTex = (c, f, k) => {
    const kx = coef(k, "x"), k2 = k * k;
    const body = { sec2: `\\sec^{2} ${kx}`, sectan: `\\sec ${kx}\\tan ${kx}`, csc2: `${CSC}^{2} ${kx}`, csccot: `${CSC} ${kx}\\cot ${kx}`, axln: `${k}^{x}\\ln ${k}`, xax1: `x \\times ${k}^{x - 1}`, ax: `${k}^{x}`, axdivln: `\\dfrac{${k}^{x}}{\\ln ${k}}`,
      "1/xln": `\\dfrac{1}{x\\ln ${k}}`, "1/x": "\\dfrac{1}{x}", "ln/x": `\\dfrac{\\ln ${k}}{x}`, "k/x": `\\dfrac{${k}}{x}` }[f];
    if (body) return coef(c, body);
    const den = { atan: `1 + ${k2}x^{2}`, atanbad: `1 + ${k}x^{2}`, asin: `\\sqrt{1 - ${k2}x^{2}}` }[f];
    return `${c < 0 ? "-" : ""}\\dfrac{${Math.abs(c)}}{${den}}`;
  };
  reg({ ...SDV, unknown: "identify-derivative", format: "mcq", levels: [1], skills: ["AHL5.15.linear-composites", "AHL5.15.trig-derivatives", "AHL5.15.exp-log-base-derivatives", "AHL5.15.inverse-trig-derivatives"], title: "Recognise a further standard derivative",
    build({ rng }) {
      const kind = rng.pick(["tan", "sec", "cot", "cosec", "exp", "log", "arctan", "arcsin", "arccos"]), k = rng.int(2, 7), kx = coef(k, "x");
      const t = { tan: [`\\tan ${kx}`, [k, "sec2"], [[1, "sec2"], [k, "sectan"], [-k, "csc2"]], "\\tan x", "\\sec^{2} x"],
        sec: [`\\sec ${kx}`, [k, "sectan"], [[1, "sectan"], [k, "sec2"], [-k, "sectan"]], "\\sec x", "\\sec x\\tan x"],
        cot: [`\\cot ${kx}`, [-k, "csc2"], [[-1, "csc2"], [k, "csc2"], [-k, "csccot"]], "\\cot x", `-${CSC}^{2} x`],
        cosec: [`${CSC} ${kx}`, [-k, "csccot"], [[-1, "csccot"], [k, "csccot"], [-k, "csc2"]], `${CSC} x`, `-${CSC} x\\cot x`],
        exp: [`${k}^{x}`, [1, "axln"], [[1, "xax1"], [1, "ax"], [1, "axdivln"]], "a^{x}", "a^{x}\\ln a"],
        log: [`\\log_{${k}} x`, [1, "1/xln"], [[1, "1/x"], [1, "ln/x"], [1, "k/x"]], "\\log_{a} x", "\\dfrac{1}{x\\ln a}"],
        arctan: [`\\arctan ${kx}`, [k, "atan"], [[1, "atan"], [k, "atanbad"], [k, "asin"]], "\\arctan x", "\\dfrac{1}{1 + x^{2}}"],
        arcsin: [`\\arcsin ${kx}`, [k, "asin"], [[1, "asin"], [k, "atan"], [-k, "asin"]], "\\arcsin x", "\\dfrac{1}{\\sqrt{1 - x^{2}}}"],
        arccos: [`\\arccos ${kx}`, [-k, "asin"], [[-1, "asin"], [k, "asin"], [-k, "atan"]], "\\arccos x", "-\\dfrac{1}{\\sqrt{1 - x^{2}}}"] }[kind];
      const simple = kind === "exp" || kind === "log";
      const opt = ([c, f], why) => ({ text: m(`f'(x) = ${sdTex(c, f, k)}`), value: [c, f, k], why });
      return { params: { kind, k }, stem: `Let $f(x) = ${t[0]}$.`, parts: [
        P("Which expression is $f'(x)$?", simple ? 1 : 2, ans.choice(rng, opt(t[1]), [
          opt(t[2][0], simple ? "This treats the function as a power of $x$." : `By the chain rule the derivative is also multiplied by $${k}$, the derivative of $${kx}$.`),
          opt(t[2][1], `The derivative of $${t[3]}$ is $${t[4]}$.`), opt(t[2][2], `The derivative of $${t[3]}$ is $${t[4]}$.`)]), simple ? [
          `The derivative of $${t[3]}$ is $${t[4]}$.`, `With $a = ${k}$: $f'(x) = ${sdTex(t[1][0], t[1][1], k)}$`] : [
          `The derivative of $${t[3]}$ is $${t[4]}$.`, `By the chain rule, replace $x$ by $${kx}$ and multiply by $${k}$: $f'(x) = ${sdTex(t[1][0], t[1][1], k)}$`])] };
    } });
  reg({ ...SDV, unknown: "gradient-inverse-trig", format: "value", levels: [2], skills: ["AHL5.15.inverse-trig-derivatives", "AHL5.15.linear-composites"], title: "Gradient of an inverse trigonometric function at a point",
    build({ rng }) {
      const kind = rng.pick(["arctan", "arctan", "arcsin", "arccos"]);
      if (kind === "arctan") {
        let c, k, p;
        do { c = rng.nonzero(-5, 6); k = rng.int(1, 4); p = rng.nonzero(-3, 3); } while (Math.abs(c) === 1 && k === 1);
        const den = 1 + k * k * p * p;
        return { params: { kind, c, k, p }, stem: `Let $f(x) = ${coef(c, `\\arctan ${coef(k, "x")}`)}$.`, parts: [
          P(`Find $f'(${p})$.`, 3, ans.frac(c * k, den), [
            `The derivative of $\\arctan x$ is $\\dfrac{1}{1 + x^{2}}$.`,
            `By the chain rule, $f'(x) = ${c * k < 0 ? "-" : ""}\\dfrac{${Math.abs(c * k)}}{1 + ${k === 1 ? "" : k * k}x^{2}}$`,
            `$f'(${p}) = ${c * k < 0 ? "-" : ""}\\dfrac{${Math.abs(c * k)}}{1 + ${k === 1 ? "" : k * k}${br(p)}^{2}} = ${frac(c * k, den)}$`])] };
      }
      const [p0, r, a] = rng.pick([[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13], [6, 8, 10], [8, 6, 10], [8, 15, 17], [15, 8, 17]]), p = p0 * rng.sign(), s = kind === "arcsin" ? 1 : -1;
      return { params: { kind, a, p }, stem: `Let $f(x) = \\${kind}\\left(\\dfrac{x}{${a}}\\right)$, for $-${a} < x < ${a}$.`, parts: [
        P(`Find $f'(${p})$.`, 3, ans.frac(s, r), [
          `The derivative of $\\${kind} x$ is $${s < 0 ? "-" : ""}\\dfrac{1}{\\sqrt{1 - x^{2}}}$.`,
          `By the chain rule, $f'(x) = ${s < 0 ? "-" : ""}\\dfrac{1}{${a}} \\times \\left(1 - \\dfrac{x^{2}}{${a * a}}\\right)^{-\\frac{1}{2}} = ${s < 0 ? "-" : ""}\\dfrac{1}{\\sqrt{${a * a} - x^{2}}}$`,
          `$f'(${p}) = ${s < 0 ? "-" : ""}\\dfrac{1}{\\sqrt{${a * a} - ${p * p}}} = ${frac(s, r)}$`])] };
    } });
  reg({ ...SDV, syllabus: ["5.15", "5.4"], unknown: "tangent-exponential-base", format: "value", levels: [3], skills: ["AHL5.15.exp-log-base-derivatives"], title: "Tangent to an exponential or logarithmic curve with another base",
    build({ rng }) {
      const kind = rng.pick(["exp", "log"]), a = rng.pick([2, 3, 5, 6, 7]), p = rng.pick(a > 3 ? [1, 2] : [1, 2, 3]), ap = Math.pow(a, p), L = Math.log(a);
      const ic = `${p} - \\dfrac{1}{\\ln ${a}}`;
      if (kind === "exp") return { params: { kind, a, p }, stem: `The curve $C$ has equation $y = ${a}^{x}$. The point $\\mathrm{A}$ on $C$ has $x$-coordinate $${p}$.`, parts: [
        P("Find the exact gradient of $C$ at $\\mathrm{A}$.", 2, ans.exact(ap * L, `${ap}\\ln ${a}`), [`$${D} = ${a}^{x}\\ln ${a}$`, `At $x = ${p}$ the gradient is $${pw(a, p)}\\ln ${a}${p === 1 ? "" : ` = ${ap}\\ln ${a}`}$.`]),
        P("The tangent to $C$ at $\\mathrm{A}$ meets the $x$-axis at the point $(k,\\, 0)$. Find the exact value of $k$.", 3, ans.exact(p - 1 / L, ic), [
          `$\\mathrm{A}$ is $${point(p, ap)}$, so the tangent is $y - ${ap} = ${ap}\\ln ${a}\\,(x - ${p})$.`,
          `At $y = 0$: $x - ${p} = -\\dfrac{${ap}}{${ap}\\ln ${a}} = -\\dfrac{1}{\\ln ${a}}$`,
          `$k = ${ic}$`])] };
      return { params: { kind, a, p }, stem: `The curve $C$ has equation $y = \\log_{${a}} x$, for $x > 0$. The point $\\mathrm{A}$ on $C$ has $x$-coordinate $${ap}$.`, parts: [
        P("Find the exact gradient of $C$ at $\\mathrm{A}$.", 2, ans.exact(1 / (ap * L), `\\dfrac{1}{${ap}\\ln ${a}}`), [`$${D} = \\dfrac{1}{x\\ln ${a}}$`, `At $x = ${ap}$ the gradient is $\\dfrac{1}{${ap}\\ln ${a}}$.`]),
        P("The tangent to $C$ at $\\mathrm{A}$ meets the $y$-axis at the point $(0,\\, k)$. Find the exact value of $k$.", 3, ans.exact(p - 1 / L, ic), [
          `At $x = ${ap}$, $y = \\log_{${a}} ${ap} = ${p}$, so the tangent is $y - ${p} = \\dfrac{1}{${ap}\\ln ${a}}(x - ${ap})$.`,
          `At $x = 0$: $y - ${p} = -\\dfrac{${ap}}{${ap}\\ln ${a}} = -\\dfrac{1}{\\ln ${a}}$`,
          `$k = ${ic}$`])] };
    } });
  reg({ ...SDV, unknown: "stationary-tan-cot", format: "value", levels: [3], skills: ["AHL5.15.trig-derivatives"], title: "Stationary point of a sum of tan and cot",
    build({ rng }) {
      const c = rng.int(1, 6), ratio = rng.pick([1, 3, 13]);            // b/a = 1, 3 or 1/3
      const a = ratio === 13 ? 3 * c : c, b = ratio === 3 ? 3 * c : c;
      const [xn, xd, tanTex, t2] = ratio === 1 ? [1, 4, "1", "1"] : ratio === 3 ? [1, 3, "\\sqrt{3}", "3"] : [1, 6, "\\dfrac{1}{\\sqrt{3}}", "\\dfrac{1}{3}"];
      const minTex = ratio === 1 ? `${2 * c}` : `${2 * c}\\sqrt{3}`, minV = 2 * Math.sqrt(a * b);
      const sub = ratio === 1 ? `${a} + ${b}` : ratio === 3 ? `${a}\\sqrt{3} + \\dfrac{${b}}{\\sqrt{3}} = ${a}\\sqrt{3} + ${c}\\sqrt{3}` : `\\dfrac{${a}}{\\sqrt{3}} + ${b}\\sqrt{3} = ${c}\\sqrt{3} + ${b}\\sqrt{3}`;
      return { params: { a, b }, stem: `Let $f(x) = ${coef(a, "\\tan x")} + ${coef(b, "\\cot x")}$, for $0 < x < \\dfrac{\\pi}{2}$. The graph of $f$ has exactly one stationary point, which is a minimum.`, parts: [
        P("Find the exact value of $x$ at the stationary point.", 4, ans.exact(Math.PI * xn / xd, piFrac(xn, xd)), [
          `$f'(x) = ${coef(a, "\\sec^{2} x")} - ${coef(b, `${CSC}^{2} x`)}$`,
          `$f'(x) = 0$ gives $\\dfrac{${a}}{\\cos^{2} x} = \\dfrac{${b}}{\\sin^{2} x}$, so $\\tan^{2} x = ${t2}$.`,
          `In the interval $\\tan x > 0$, so $\\tan x = ${tanTex}$.`,
          `$x = ${piFrac(xn, xd)}$`]),
        P("Find the exact minimum value of $f$.", 2, ans.exact(minV, minTex), [
          `With $\\tan x = ${tanTex}$: $f(x) = ${sub}$`.replace(/\{1\\sqrt/g, "{\\sqrt").replace(/([= ])1\\sqrt/g, "$1\\sqrt"),
          `The minimum value is $${minTex}$.`])] };
    } });

  const SIN = { type: "t5-ahl-standard-integrals", syllabus: ["5.15"], representation: "equation", format: "value" };
  reg({ ...SIN, unknown: "inverse-trig-definite", levels: [2], skills: ["AHL5.15.standard-integrals", "AHL5.15.linear-composites"], title: "A definite integral from the further standard results",
    build({ rng }) {
      const kind = rng.pick(["atan", "asin", "sec2", "atan3"]), c = rng.int(1, 6);
      if (kind === "atan" || kind === "atan3") {
        const a = rng.int(2, 6), up = kind === "atan" ? `${a}` : `${a}\\sqrt{3}`, [n, d] = kind === "atan" ? [c, 4 * a] : [c, 3 * a];
        return { params: { kind, c, a }, stem: `Consider the integral $${INT("0", up, `\\dfrac{${c}}{${a * a} + x^{2}}`)}$.`, parts: [
          P("Find the exact value of this integral.", 3, ans.exact(Math.PI * n / d, piFrac(n, d)), [
            `$\\displaystyle\\int \\dfrac{1}{a^{2} + x^{2}}${dx} = \\dfrac{1}{a}\\arctan\\left(\\dfrac{x}{a}\\right) + C$, here with $a = ${a}$.`,
            `The integral is $\\left[${frac(c, a)}\\arctan\\left(\\dfrac{x}{${a}}\\right)\\right]_{0}^{${up}} = ${frac(c, a)}\\left(\\arctan ${kind === "atan" ? "1" : "\\sqrt{3}"} - \\arctan 0\\right)$`.replace(/\[1\\arctan/, "[\\arctan").replace(/= 1\\left/, "= \\left"),
            `$= ${frac(c, a)} \\times ${kind === "atan" ? "\\dfrac{\\pi}{4}" : "\\dfrac{\\pi}{3}"} = ${piFrac(n, d)}$`])] };
      }
      if (kind === "asin") {
        const a = rng.pick([2, 4, 6, 8, 10]);
        return { params: { kind, c, a }, stem: `Consider the integral $${INT("0", a / 2, `\\dfrac{${c}}{\\sqrt{${a * a} - x^{2}}}`)}$.`, parts: [
          P("Find the exact value of this integral.", 3, ans.exact(Math.PI * c / 6, piFrac(c, 6)), [
            `$\\displaystyle\\int \\dfrac{1}{\\sqrt{a^{2} - x^{2}}}${dx} = \\arcsin\\left(\\dfrac{x}{a}\\right) + C$, here with $a = ${a}$.`,
            `The integral is $\\left[${coef(c, `\\arcsin\\left(\\dfrac{x}{${a}}\\right)`)}\\right]_{0}^{${a / 2}} = ${c === 1 ? "" : c}\\left(\\arcsin \\dfrac{1}{2} - \\arcsin 0\\right)$`,
            `$= ${c === 1 ? "" : `${c} \\times `}\\dfrac{\\pi}{6}${c === 1 ? "" : ` = ${piFrac(c, 6)}`}$`])] };
      }
      const k = rng.int(2, 6);
      return { params: { kind, c, a: k }, stem: `Consider the integral $${INT("0", piFrac(1, 4 * k), coef(c, `\\sec^{2} ${coef(k, "x")}`))}$.`, parts: [
        P("Find the exact value of this integral.", 3, ans.frac(c, k), [
          `The derivative of $\\tan ${coef(k, "x")}$ is $${k}\\sec^{2} ${coef(k, "x")}$, so $\\displaystyle\\int \\sec^{2} ${coef(k, "x")}${dx} = \\dfrac{1}{${k}}\\tan ${coef(k, "x")} + C$.`,
          `The integral is $\\left[${frac(c, k)}\\tan ${coef(k, "x")}\\right]_{0}^{${piFrac(1, 4 * k)}} = ${frac(c, k)}\\left(\\tan \\dfrac{\\pi}{4} - \\tan 0\\right)$`.replace(/\[1\\tan/, "[\\tan").replace(/= 1\\left/, "= \\left"),
          `$= ${frac(c, k)}$`])] };
    } });
  reg({ ...SIN, syllabus: ["5.15", "1.11"], unknown: "partial-fractions-definite", levels: [3], skills: ["AHL5.15.partial-fraction-integral"], title: "Integrate with partial fractions and give a single logarithm",
    build({ rng }) {
      let r1, r2, A, B, p, q, Kn, Kd;
      const pwI = (b, e) => Math.pow(b, Math.abs(e));
      do {
        r1 = rng.int(-4, 2); r2 = r1 + rng.int(1, 4); A = rng.nonzero(-3, 3); B = rng.nonzero(-3, 3); p = r2 + rng.int(1, 3); q = p + rng.int(1, 4);
        Kn = 1; Kd = 1;
        for (const [e, hi, lo] of [[A, q - r1, p - r1], [B, q - r2, p - r2]]) { if (e > 0) { Kn *= pwI(hi, e); Kd *= pwI(lo, e); } else { Kn *= pwI(lo, e); Kd *= pwI(hi, e); } }
        const g = gcd(Kn, Kd); Kn /= g; Kd /= g;
      } while (A + B === 0 || Kn === Kd || Kn > 600 || Kd > 600 || (Math.abs(A) === 1 && Math.abs(B) === 1));
      const al = A + B, be = -A * r2 - B * r1, f1 = fmt.factor(r1), f2 = fmt.factor(r2);
      const L = (v) => `\\ln ${v}`;
      return { params: { r1, r2, al, be, p, q }, stem: `Let $f(x) = \\dfrac{${lin(al, be)}}{${f1}${f2}}$. It is given that $f(x) = \\dfrac{A}{${lin(1, -r1)}} + \\dfrac{B}{${lin(1, -r2)}}$, where $A$ and $B$ are constants.`, parts: [
        P("Find the value of $A$.", 2, ans.int(A), [
          `Multiply through by $${f1}${f2}$: $${lin(al, be)} = A${f2} + B${f1}$`,
          `Let $x = ${r1}$: $${al * r1 + be} = ${coef(r1 - r2, "A")}$, so $A = ${A}$.`]),
        P("Find the value of $B$.", 1, ans.int(B), [`Let $x = ${r2}$: $${al * r2 + be} = ${coef(r2 - r1, "B")}$, so $B = ${B}$.`]),
        P(`It is given that $${INT(p, q, "f(x)")} = \\ln k$. Find the value of $k$.`, 3, ans.frac(Kn, Kd), [
          `$${INT(p, q, "f(x)")} = \\left[${expr([[A, `\\ln|${lin(1, -r1)}|`], [B, `\\ln|${lin(1, -r2)}|`]])}\\right]_{${p}}^{${q}}$`,
          `$= ${expr([[A, L(q - r1)], [B, L(q - r2)], [-A, L(p - r1)], [-B, L(p - r2)]])}$`,
          `Using the laws of logarithms this is $\\ln ${fmt.wrap(frac(Kn, Kd))}$, so $k = ${frac(Kn, Kd)}$.`.replace(/\\ln \((\d+)\)/, "\\ln $1")])] };
    } });

  // =====================================================================================
  // 5.16 integration by substitution and by parts
  // =====================================================================================
  const SUB = { type: "t5-ahl-substitution", syllabus: ["5.16"], representation: "equation" };
  reg({ ...SUB, unknown: "new-limits", format: "value", levels: [1], skills: ["AHL5.16.change-limits"], title: "Change the limits of an integral under a substitution",
    build({ rng }) {
      const kind = rng.pick(["sqrt", "lin", "sq"]);
      let p, q, lo, hi, u, body, w;
      if (kind === "sqrt") { lo = rng.int(1, 3); hi = lo + rng.int(1, 3); p = lo * lo; q = hi * hi; const c = rng.int(1, 5); u = "\\sqrt{x}"; body = `\\dfrac{1}{${c} + \\sqrt{x}}`; w = (x, v) => `$u = \\sqrt{${x}} = ${v}$`; }
      else if (kind === "lin") { const a = rng.int(2, 5), b = rng.nonzero(-6, 6), n = rng.int(3, 6); p = rng.int(-2, 2); q = p + rng.int(1, 3); lo = a * p + b; hi = a * q + b; u = lin(a, b); body = `x\\left(${u}\\right)^{${n}}`; w = (x, v) => `$u = ${a}${br(x)} ${fmt.signed(b)} = ${v}$`; var a1 = a, b1 = b; }
      else { const c = rng.int(1, 9); p = rng.int(0, 2); q = p + rng.int(1, 3); lo = p * p + c; hi = q * q + c; u = `x^{2} + ${c}`; body = `x^{3}\\sqrt{x^{2} + ${c}}`; w = (x, v) => `$u = ${br(x)}^{2} + ${c} = ${v}$`; var c1 = c; }
      return { params: { kind, p, q, a: a1, b: b1, c: c1 }, stem: `The substitution $u = ${u}$ is used to write $${INT(p, q, body)}$ as an integral with respect to $u$.`, parts: [
        P("Write down the lower limit of the new integral.", 1, ans.int(lo), [`The new limits are the values of $u$ at the old limits. When $x = ${p}$: ${w(p, lo)}`]),
        P("Write down the upper limit of the new integral.", 1, ans.int(hi), [`When $x = ${q}$: ${w(q, hi)}`])] };
    } });
  reg({ ...SUB, unknown: "linear-substitution", format: "mcq", levels: [2], skills: ["AHL5.16.given-substitution", "AHL5.16.change-limits"], title: "Integrate a product with a linear substitution",
    build({ rng }) {
      const b = rng.nonzero(-3, 3), n = rng.int(2, 4), U = rng.pick([1, 2]), lo = -b, hi = U - b;
      const I = (l, h, s) => INT(l, h, `${fmt.factor(-s, "u")}u^{${n}}`, "u"), opt = (v, why) => ({ text: m(I(v[0], v[1], v[2])), value: v, why });
      const val = fmt.rat.sub(fmt.Q(Math.pow(U, n + 2), n + 2), fmt.Q(b * Math.pow(U, n + 1), n + 1));
      return { params: { b, n, U }, stem: `The integral $I = ${INT(lo, hi, `x${fmt.factor(-b)}^{${n}}`)}$ is to be found using the substitution $u = ${lin(1, b)}$.`, parts: [
        P("Which integral is equal to $I$?", 2, ans.choice(rng, opt([0, U, -b]), [
          opt([lo, hi, -b], "The limits must be changed to values of $u$."),
          opt([0, U, b], `Rearranging $u = ${lin(1, b)}$ gives $x = ${lin(1, -b, "u")}$.`),
          opt([0, U, 0], `The factor $x$ must also be written in terms of $u$: $x = ${lin(1, -b, "u")}$.`)]), [
          `$u = ${lin(1, b)}$ gives $x = ${lin(1, -b, "u")}$ and $\\mathrm{d}x = \\mathrm{d}u$.`,
          `When $x = ${lo}$, $u = 0$; when $x = ${hi}$, $u = ${U}$.`,
          `$I = ${I(0, U, -b)}$`]),
        P("Find the value of $I$.", 2, ans.frac(val.n, val.d), [
          `$I = ${INT(0, U, `\\left(${expr([[1, `u^{${n + 1}}`], [-b, `u^{${n}}`]])}\\right)`, "u")} = \\left[${expr([[fmt.Q(1, n + 2), `u^{${n + 2}}`], [fmt.Q(-b, n + 1), `u^{${n + 1}}`]])}\\right]_{0}^{${U}}$`,
          `$I = ${expr([[fmt.Q(Math.pow(U, n + 2), n + 2), ""], [fmt.Q(-b * Math.pow(U, n + 1), n + 1), ""]])}${val.d === 1 || true ? ` = ${frac(val.n, val.d)}` : ""}$`])] };
    } });
  reg({ ...SUB, unknown: "root-substitution", format: "mcq", levels: [3], skills: ["AHL5.16.given-substitution", "AHL5.16.change-limits"], title: "Definite integral with a square-root substitution",
    build({ rng }) {
      let c, s, t;
      do { c = rng.nonzero(-4, 6); s = rng.int(1, 2); t = s + rng.int(1, 2); } while (c + s * s < -3);
      const p = c + s * s, q = c + t * t, rootTex = `\\sqrt{${lin(1, -c)}}`, uc = `u^{2} ${fmt.signed(c)}`;
      const texK = { 2: `2\\left(${uc}\\right)`, "1/u": `\\dfrac{${uc}}{u}`, "2u": `2u\\left(${uc}\\right)`, 1: `\\left(${uc}\\right)` };
      const opt = (v, why) => ({ text: m(INT(v[0], v[1], texK[v[2]], "u")), value: v, why });
      const n = 2 * (t * t * t - s * s * s) + 6 * c * (t - s);
      return { params: { c, s, t }, stem: `The integral $I = ${INT(p, q, `\\dfrac{x}{${rootTex}}`)}$ is to be found using the substitution $u = ${rootTex}$.`, parts: [
        P("Which integral is equal to $I$?", 3, ans.choice(rng, opt([s, t, "2"]), [
          opt([s, t, "1/u"], "$\\mathrm{d}x$ must be replaced as well: $\\mathrm{d}x = 2u\\,\\mathrm{d}u$."),
          opt([p, q, "2"], "The limits must be changed to values of $u$."),
          opt([s, t, "2u"], "The factor $u$ from $\\mathrm{d}x = 2u\\,\\mathrm{d}u$ cancels with the $u$ in the denominator."),
          opt([s, t, "1"], "$\\mathrm{d}x = 2u\\,\\mathrm{d}u$, so a factor of $2$ remains.")]), [
          `$u^{2} = ${lin(1, -c)}$, so $x = ${uc}$ and $\\mathrm{d}x = 2u\\,\\mathrm{d}u$.`,
          `When $x = ${p}$, $u = ${s}$; when $x = ${q}$, $u = ${t}$.`,
          `$I = ${INT(s, t, `\\dfrac{${uc}}{u} \\times 2u`, "u")} = ${INT(s, t, texK[2], "u")}$`]),
        P("Find the value of $I$.", 3, ans.frac(n, 3), [
          `$I = \\left[${expr([[fmt.Q(2, 3), "u^{3}"], [2 * c, "u"]])}\\right]_{${s}}^{${t}}$`,
          `$I = \\left(${expr([[fmt.Q(2 * t * t * t, 3), ""], [2 * c * t, ""]])}\\right) - \\left(${expr([[fmt.Q(2 * s * s * s, 3), ""], [2 * c * s, ""]])}\\right)$`,
          `$I = ${frac(n, 3)}$`])] };
    } });
  reg({ ...SUB, unknown: "trig-substitution", format: "value", levels: [3], skills: ["AHL5.16.given-substitution", "AHL5.16.change-limits"], title: "Definite integral with a trigonometric substitution",
    build({ rng }) {
      const kind = rng.pick(["circle", "circle", "tan", "sin2"]), a = kind === "circle" ? rng.int(1, 9) : kind === "tan" ? rng.int(1, 4) : rng.pick([2, 4, 6, 8]), a2 = a * a, a3 = a2 * a;
      const th = "\\theta", dth = "\\,\\mathrm{d}\\theta", ca = (body) => (a === 1 ? body : `${a}${body}`);
      const d = {
        circle: { sub: ca(`\\sin ${th}`), I: INT(0, a, `\\sqrt{${a2} - x^{2}}`), up: [1, 2], v: Math.PI * a2 / 4, tex: symQ(a2, 4, "\\pi"), w: [
          `$\\mathrm{d}x = ${ca(`\\cos ${th}`)}${dth}$ and $\\sqrt{${a2} - x^{2}} = \\sqrt{${a2}\\cos^{2} ${th}} = ${ca(`\\cos ${th}`)}$.`.replace(/\{1\\cos/, "{\\cos"),
          `The integral becomes $${INT(0, "\\frac{\\pi}{2}", `${a2 === 1 ? "" : a2}\\cos^{2} ${th}`, th)} = ${INT(0, "\\frac{\\pi}{2}", `${frac(a2, 2)}\\left(1 + \\cos 2${th}\\right)`, th)}$`,
          `$= ${frac(a2, 2)}\\left[${th} + \\dfrac{1}{2}\\sin 2${th}\\right]_{0}^{\\frac{\\pi}{2}} = ${frac(a2, 2)} \\times \\dfrac{\\pi}{2}$`,
          `$= ${symQ(a2, 4, "\\pi")}$`] },
        tan: { sub: ca(`\\tan ${th}`), I: INT(0, a, `\\dfrac{1}{\\left(${a2} + x^{2}\\right)^{2}}`), up: [1, 4], v: (Math.PI + 2) / (8 * a3), tex: `\\dfrac{\\pi + 2}{${8 * a3}}`, w: [
          `$\\mathrm{d}x = ${ca(`\\sec^{2} ${th}`)}${dth}$ and $${a2} + x^{2} = ${a2 === 1 ? "" : a2}\\sec^{2} ${th}$.`,
          `The integral becomes $${INT(0, "\\frac{\\pi}{4}", `\\dfrac{${ca(`\\sec^{2} ${th}`)}}{${a2 * a2 === 1 ? "" : a2 * a2}\\sec^{4} ${th}}`, th)} = ${INT(0, "\\frac{\\pi}{4}", `${a3 === 1 ? "" : `\\dfrac{1}{${a3}}`}\\cos^{2} ${th}`, th)}$`,
          `$= \\dfrac{1}{${2 * a3}}\\left[${th} + \\dfrac{1}{2}\\sin 2${th}\\right]_{0}^{\\frac{\\pi}{4}} = \\dfrac{1}{${2 * a3}}\\left(\\dfrac{\\pi}{4} + \\dfrac{1}{2}\\right)$`,
          `$= \\dfrac{\\pi + 2}{${8 * a3}}$`] },
        sin2: { sub: ca(`\\sin ${th}`), I: INT(0, a / 2, `\\dfrac{x^{2}}{\\sqrt{${a2} - x^{2}}}`), up: [1, 6], v: a2 * (Math.PI / 12 - Math.sqrt(3) / 8), tex: `${symQ(a2, 12, "\\pi")} - ${symQ(a2, 8, "\\sqrt{3}")}`, w: [
          `$\\mathrm{d}x = ${ca(`\\cos ${th}`)}${dth}$, $x^{2} = ${a2}\\sin^{2} ${th}$ and $\\sqrt{${a2} - x^{2}} = ${ca(`\\cos ${th}`)}$.`,
          `The integral becomes $${INT(0, "\\frac{\\pi}{6}", `${a2}\\sin^{2} ${th}`, th)} = ${INT(0, "\\frac{\\pi}{6}", `${frac(a2, 2)}\\left(1 - \\cos 2${th}\\right)`, th)}$`,
          `$= ${frac(a2, 2)}\\left[${th} - \\dfrac{1}{2}\\sin 2${th}\\right]_{0}^{\\frac{\\pi}{6}} = ${frac(a2, 2)}\\left(\\dfrac{\\pi}{6} - \\dfrac{\\sqrt{3}}{4}\\right)$`,
          `$= ${symQ(a2, 12, "\\pi")} - ${symQ(a2, 8, "\\sqrt{3}")}$`] } }[kind];
      const fix = (s) => s.replace(/([=\[ ])1\\left/g, "$1\\left").replace(/= 1 \\times /g, "= ").replace(/\}1\\left/g, "}\\left");
      const upTex = piFrac(d.up[0], d.up[1]), xUp = kind === "sin2" ? a / 2 : a;
      return { params: { kind, a }, stem: `The substitution $x = ${d.sub}$ is used to find the exact value of $${d.I}$.`, parts: [
        P(`The lower limit $x = 0$ becomes $${th} = 0$. Find the value of $${th}$, with $0 < ${th} \\le \\dfrac{\\pi}{2}$, that the upper limit becomes.`, 2, ans.exact(Math.PI * d.up[0] / d.up[1], upTex), [
          `At the upper limit $${d.sub} = ${xUp}$, so $${kind === "tan" ? "\\tan" : "\\sin"} ${th} = ${frac(xUp, a)}$.`, `$${th} = ${upTex}$`]),
        P("Find the exact value of the integral.", 4, ans.exact(d.v, d.tex), d.w.map(fix))] };
    } });

  const BP = { type: "t5-ahl-by-parts", syllabus: ["5.16"], representation: "equation" };
  reg({ ...BP, unknown: "indefinite-once", format: "mcq", levels: [2], skills: ["AHL5.16.by-parts"], title: "Integrate x times a standard function by parts",
    build({ rng }) {
      const kind = rng.pick(["exp", "cos", "sin"]), k = rng.int(2, 5) * (kind === "exp" ? rng.sign() : 1), kx = coef(k, "x");
      const g = kind === "exp" ? ex(k) : tr(kind, k);
      const [G1, G2, s1, s2] = kind === "exp" ? [ex(k), ex(k), 1, -1] : kind === "cos" ? [`\\sin ${kx}`, `\\cos ${kx}`, 1, 1] : [`\\cos ${kx}`, `\\sin ${kx}`, -1, 1];
      const c1 = fmt.Q(s1, k), c2 = fmt.Q(s2, k * k);
      const tex = (a, b) => `${expr([[a, `x${G1}`], [b, G2]])} + C`, opt = (a, b, why) => ({ text: m(tex(a, b)), value: [fmt.rat.num(a), fmt.rat.num(b)], why });
      const vTex = kind === "exp" ? `${frac(1, k)}${ex(k)}` : kind === "cos" ? `${frac(1, k)}\\sin ${kx}` : `-${frac(1, k)}\\cos ${kx}`;
      return { params: { kind, k }, stem: `Consider the integral $\\displaystyle\\int x${g}${dx}$.`, parts: [
        P("Which expression is equal to this integral?", 3, ans.choice(rng, opt(c1, c2), [
          opt(c1, fmt.rat.neg(c2), "Check the sign of the second term: the integral of $v$ times the derivative of $u$ is subtracted."),
          opt(c1, fmt.Q(s2, k), `The second integration also divides by $${k}$.`),
          opt(fmt.Q(s1 * k, 1), fmt.Q(s2 * k * k, 1), `Integrating $${g}$ divides by $${k}$; it does not multiply by it.`)]), [
          `Let $u = x$ and $\\dfrac{\\mathrm{d}v}{\\mathrm{d}x} = ${g}$, so $\\dfrac{\\mathrm{d}u}{\\mathrm{d}x} = 1$ and $v = ${vTex}$.`,
          `$\\displaystyle\\int x${g}${dx} = uv - \\displaystyle\\int v\\,\\dfrac{\\mathrm{d}u}{\\mathrm{d}x}${dx} = ${coef(c1, `x${G1}`)} - \\displaystyle\\int ${fmt.wrap(vTex)}${dx}$`,
          `$= ${tex(c1, c2)}$`])] };
    } });
  reg({ ...BP, unknown: "log-definite", format: "value", levels: [3], skills: ["AHL5.16.by-parts"], title: "Integrate a power of x times ln x by parts",
    build({ rng }) {
      const n = rng.int(1, 4), c = rng.pick([1, 2, 3, 4, 6, n + 1, (n + 1) * (n + 1)]), N = n + 1;
      const A = fmt.Q(c, N), B = fmt.Q(-c, N * N), g = gcd(c, N * N), cn = c / g, dn = N * N / g;
      const top = `${coef(cn * n, `${E_}^{${N}}`)} + ${cn}`, tex = dn === 1 ? top : `\\dfrac{${top}}{${dn}}`;
      const f = coef(c, `x${n === 1 ? "" : `^{${n}}`}\\ln x`), xN = `x^{${N}}`;
      return { params: { n, c }, stem: `It is given that $\\displaystyle\\int ${f}${dx} = A${xN}\\ln x + B${xN} + C$, where $A$ and $B$ are constants and $C$ is the constant of integration.`, parts: [
        P("Find the value of $A$.", 2, ans.frac(A.n, A.d), [
          `Let $u = \\ln x$ and $\\dfrac{\\mathrm{d}v}{\\mathrm{d}x} = ${coef(c, pw("x", n))}$, so $\\dfrac{\\mathrm{d}u}{\\mathrm{d}x} = \\dfrac{1}{x}$ and $v = ${coef(A, xN)}$.`,
          `The term $uv$ is $${coef(A, xN)}\\ln x$, so $A = ${frac(A.n, A.d)}$.`]),
        P("Find the value of $B$.", 2, ans.frac(B.n, B.d), [
          `The remaining integral is $-\\displaystyle\\int ${coef(A, xN)} \\times \\dfrac{1}{x}${dx} = -\\displaystyle\\int ${coef(A, pw("x", n))}${dx}$.`,
          `$= ${coef(B, xN)}$, so $B = ${frac(B.n, B.d)}$.`]),
        P(`Hence find the exact value of $${INT(1, E_, f)}$.`, 2, ans.exact(c * (n * Math.exp(N) + 1) / (N * N), tex), [
          `$\\left[${coef(A, xN)}\\ln x ${fmt.signed(B)}${xN}\\right]_{1}^{${E_}} = \\left(${coef(A, `${E_}^{${N}}`)} ${fmt.signed(B)}${E_}^{${N}}\\right) - \\left(0 ${fmt.signed(B)}\\right)$`.replace(/(\+|-) 1(x|\\mathrm)/g, "$1 $2"),
          `$= ${tex}$`])] };
    } });
  reg({ ...BP, unknown: "repeated", format: "mcq", levels: [3], skills: ["AHL5.16.repeated-parts", "AHL5.16.by-parts"], title: "Integration by parts used twice",
    build({ rng }) {
      const kind = rng.pick(["exp", "sin", "cos"]), a = rng.pick([-3, -1, 1, 2, 3, 4]);
      const u = `x^{2} ${fmt.signed(a)}x`.replace(/(\+|-) 1x/, "$1 x"), du = lin(2, a);
      const d = { exp: { g: ex(1), V: ex(1), lo: "0", hi: "1", sB: 1, sI: -1, v: Math.E - 2 + a, tex: a === 2 ? E_ : `${E_} ${fmt.signed(a - 2)}`,
          w2: [`A second use of integration by parts gives $${INT(0, 1, `\\left(${du}\\right)${ex(1)}`)} = \\left[\\left(${du}\\right)${ex(1)}\\right]_{0}^{1} - ${INT(0, 1, `2${ex(1)}`)} = ${coef(2 + a, E_)} ${fmt.signed(-a)} - \\left(2${E_} - 2\\right) = ${expr([[a, E_], [2 - a, ""]])}$`,
            `The first term is $\\left[\\left(${u}\\right)${ex(1)}\\right]_{0}^{1} = ${coef(1 + a, E_)}$.`,
            `The integral is $${coef(1 + a, E_)} - \\left(${expr([[a, E_], [2 - a, ""]])}\\right) = ${a === 2 ? E_ : `${E_} ${fmt.signed(a - 2)}`}$.`] },
        sin: { g: "\\sin x", V: "\\cos x", lo: "0", hi: "\\pi", sB: -1, sI: 1, v: Math.PI * Math.PI - 4 + a * Math.PI, tex: `\\pi^{2} ${fmt.signed(a)}\\pi - 4`.replace(/(\+|-) 1\\pi/, "$1 \\pi"),
          w2: [`A second use of integration by parts gives $${INT(0, "\\pi", `\\left(${du}\\right)\\cos x`)} = \\left[\\left(${du}\\right)\\sin x\\right]_{0}^{\\pi} - ${INT(0, "\\pi", "2\\sin x")} = 0 - 4 = -4$`,
            `The first term is $\\left[-\\left(${u}\\right)\\cos x\\right]_{0}^{\\pi} = \\pi^{2} ${fmt.signed(a)}\\pi$.`.replace(/(\+|-) 1\\pi/, "$1 \\pi"),
            `The integral is $\\pi^{2} ${fmt.signed(a)}\\pi - 4$.`.replace(/(\+|-) 1\\pi/, "$1 \\pi")] },
        cos: { g: "\\cos x", V: "\\sin x", lo: "0", hi: "\\frac{\\pi}{2}", sB: 1, sI: -1, v: Math.PI * Math.PI / 4 + a * Math.PI / 2 - 2 - a, tex: `\\dfrac{\\pi^{2}}{4} ${a < 0 ? "-" : "+"} ${symQ(Math.abs(a), 2, "\\pi")} ${fmt.signed(-2 - a)}`,
          w2: [`A second use of integration by parts gives $${INT(0, "\\frac{\\pi}{2}", `\\left(${du}\\right)\\sin x`)} = \\left[-\\left(${du}\\right)\\cos x\\right]_{0}^{\\frac{\\pi}{2}} + ${INT(0, "\\frac{\\pi}{2}", "2\\cos x")} = ${a} + 2 = ${a + 2}$`,
            `The first term is $\\left[\\left(${u}\\right)\\sin x\\right]_{0}^{\\frac{\\pi}{2}} = \\dfrac{\\pi^{2}}{4} ${a < 0 ? "-" : "+"} ${symQ(Math.abs(a), 2, "\\pi")}$.`,
            `The integral is $\\dfrac{\\pi^{2}}{4} ${a < 0 ? "-" : "+"} ${symQ(Math.abs(a), 2, "\\pi")} ${fmt.signed(-2 - a)}$.`] } }[kind];
      // da = 0: the derivative of u taken as 2x; da = 2: the second factor not integrated
      const optTex = (sB, sI, da) => `${sB < 0 ? "-" : ""}\\left[\\left(${u}\\right)${d.V}\\right]_{${d.lo}}^{${d.hi}} ${sI < 0 ? "-" : "+"} ${INT(d.lo, d.hi, `${da ? `\\left(${du}\\right)` : "2x"}${da === 2 ? d.g : d.V}`)}`;
      const opt = (sB, sI, da, why) => ({ text: m(optTex(sB, sI, da)), value: [sB, sI, da], why });
      const third = kind === "sin" ? opt(d.sB, d.sI, 2, `The remaining integral contains $v$, the integral of $${d.g}$, not $${d.g}$ itself.`) : opt(d.sB, d.sI, 0, `The derivative of $${u}$ is $${du}$.`);
      return { params: { kind, a }, stem: `Let $I = ${INT(d.lo, d.hi, `\\left(${u}\\right)${d.g}`)}$.`, parts: [
        P("Which expression is obtained for $I$ after integrating by parts once?", 3, ans.choice(rng, opt(d.sB, d.sI, 1), [
          opt(d.sB, -d.sI, 1, "Integration by parts gives $uv$ minus the integral of $v$ times the derivative of $u$; check the signs."),
          third,
          opt(-d.sB, -d.sI, 1, `Check the sign of the integral of $${d.g}$.`)]), [
          `Let $u = ${u}$ and $\\dfrac{\\mathrm{d}v}{\\mathrm{d}x} = ${d.g}$, so $\\dfrac{\\mathrm{d}u}{\\mathrm{d}x} = ${du}$ and $v = ${kind === "sin" ? "-" : ""}${d.V}$.`,
          `$I = ${optTex(d.sB, d.sI, 1)}$`]),
        P("Find the exact value of $I$.", 3, ans.exact(d.v, d.tex), d.w2.map((s) => s.replace(/= 1\\mathrm\{e\}/g, `= ${E_}`).replace(/\$1\\mathrm\{e\}/g, `$${E_}`).replace(/= 0\\mathrm\{e\} /, "= ")))] };
    } });
  reg({ ...BP, unknown: "cyclic", format: "value", levels: [3], skills: ["AHL5.16.cyclic-parts"], title: "A cyclic integration by parts",
    build({ rng }) {
      let a, b; const kind = rng.pick(["sin", "cos"]), oth = kind === "sin" ? "cos" : "sin";
      do { a = rng.nonzero(-3, 4); b = rng.int(1, 4); } while (a === 1 && b === 1);
      const s = a * a + b * b, pq = fmt.Q(a, s), qq = fmt.Q(kind === "sin" ? -b : b, s), e = ex(a), bx = coef(b, "x"), I = `\\displaystyle\\int ${e}\\${kind} ${bx}${dx}`, J = `\\displaystyle\\int ${e}\\${oth} ${bx}${dx}`;
      const sg = kind === "sin" ? "-" : "+", sg2 = kind === "sin" ? "+" : "-";
      return { params: { kind, a, b }, stem: `It is given that $${I} = ${e}\\left(p\\${kind} ${bx} + q\\${oth} ${bx}\\right) + C$, where $p$ and $q$ are constants and $C$ is the constant of integration.`, parts: [
        P("Find the value of $p$.", 3, ans.frac(pq.n, pq.d), [
          `Let $I = ${I}$. Integrating by parts with $u = \\${kind} ${bx}$ and $\\dfrac{\\mathrm{d}v}{\\mathrm{d}x} = ${e}$: $I = ${expr([[fmt.Q(1, a), `${e}\\${kind} ${bx}`], [fmt.Q(kind === "sin" ? -b : b, a), J]])}$`,
          `Integrating by parts again: $${J} = ${expr([[fmt.Q(1, a), `${e}\\${oth} ${bx}`], [fmt.Q(kind === "sin" ? b : -b, a), "I"]])}$`,
          `Substituting and collecting the terms in $I$: $\\left(1 + ${frac(b * b, a * a)}\\right)I = ${expr([[fmt.Q(1, a), `${e}\\${kind} ${bx}`], [fmt.Q(kind === "sin" ? -b : b, a * a), `${e}\\${oth} ${bx}`]])}$`,
          `Multiplying by $${frac(a * a, s)}$: $I = ${e}\\left(${frac(pq.n, pq.d)}\\${kind} ${bx} ${fmt.signed(qq)}\\${oth} ${bx}\\right) + C$, so $p = ${frac(pq.n, pq.d)}$.`]),
        P("Find the value of $q$.", 2, ans.frac(qq.n, qq.d), [
          `From the result above, the coefficient of $${e}\\${oth} ${bx}$ is $q = ${frac(qq.n, qq.d)}$.`,
          `Check by differentiating: the derivative of $${e}\\left(p\\${kind} ${bx} + q\\${oth} ${bx}\\right)$ must equal $${e}\\${kind} ${bx}$.`])] };
    } });

  // =====================================================================================
  // 5.17 areas against the y-axis and volumes of revolution
  // =====================================================================================
  const AY = { type: "t5-ahl-area-y-axis", syllabus: ["5.17"], representation: "graph" };
  reg({ ...AY, unknown: "parabola-region", format: "mcq", levels: [2], skills: ["AHL5.17.area-y-axis", "AHL5.17.rearrange-for-x"], title: "Area between a parabola and the y-axis",
    build({ rng }) {
      let c, k;
      do { c = rng.int(1, 5); k = rng.int(2, 4); } while (3 * c === k * k);
      const q = c + k * k;
      const texK = { "sqrt-": `\\sqrt{y - ${c}}`, "sqrt+": `\\sqrt{y + ${c}}`, y2: `\\left(y^{2} + ${c}\\right)`, x: `\\left(x^{2} + ${c}\\right)` };
      const opt = (v, why) => ({ text: m(INT(v[0], v[1], texK[v[2]], v[2] === "x" ? "x" : "y")), value: v, why });
      return { params: { c, k }, stem: `The diagram shows the curve $y = x^{2} + ${c}$ for $x \\ge 0$ and the line $y = ${q}$. The shaded region $R$ is bounded by the curve, the $y$-axis and the line.`,
        graph: { x: [-1, k + 1], y: [0, q + 2], xStep: 1, yStep: q > 12 ? 4 : 2, functions: [{ fn: { type: "poly", coeffs: [c, 0, 1] }, domain: [0, k + 0.6] }, { fn: { type: "poly", coeffs: [q] } }], regions: [{ x: [0, k], fn: 0, to: 1 }], alt: "A curve rising from the y-axis to meet a horizontal line, with the region between the curve, the y-axis and the line shaded" },
        parts: [
          P("Which integral gives the area of $R$?", 2, ans.choice(rng, opt([c, q, "sqrt-"]), [
            opt([0, k, "x"], "This is the area between the curve and the $x$-axis."),
            opt([c, q, "sqrt+"], `Rearranging $y = x^{2} + ${c}$ gives $x^{2} = y - ${c}$.`),
            opt([c, q, "y2"], "The integrand must be $x$ written in terms of $y$.")]), [
            `The area between a curve and the $y$-axis is $\\displaystyle\\int x\\,\\mathrm{d}y$.`,
            `$y = x^{2} + ${c}$ with $x \\ge 0$ gives $x = \\sqrt{y - ${c}}$. The curve meets the $y$-axis at $y = ${c}$.`,
            `Area $= ${INT(c, q, texK["sqrt-"], "y")}$`]),
          P("Find the area of $R$.", 2, ans.frac(2 * k * k * k, 3), [
            `$${INT(c, q, `(y - ${c})^{\\frac{1}{2}}`, "y")} = \\left[\\dfrac{2}{3}(y - ${c})^{\\frac{3}{2}}\\right]_{${c}}^{${q}}$`,
            `$= \\dfrac{2}{3}${br(k * k)}^{\\frac{3}{2}} = ${frac(2 * k * k * k, 3)}$`])] };
    } });
  reg({ ...AY, syllabus: ["5.17", "5.16"], unknown: "exponential-region", format: "value", levels: [3], skills: ["AHL5.17.area-y-axis", "AHL5.17.rearrange-for-x", "AHL5.16.by-parts"], title: "Area between an exponential curve and the y-axis",
    build({ rng }) {
      const a = rng.int(1, 4), T = rng.int(2, 6), xe = a === 1 ? "x" : `\\frac{x}{${a}}`;
      const tex = `${a * T}\\ln ${T} - ${a * (T - 1)}`, v = a * (T * Math.log(T) - T + 1);
      return { params: { a, T }, stem: `The diagram shows the curve $y = ${E_}^{${xe}}$ and the line $y = ${T}$, which meet at the point $\\mathrm{A}$. The shaded region $R$ is bounded by the curve, the $y$-axis and the line.`,
        graph: { x: [-1, Math.ceil(a * Math.log(T)) + 1], y: [0, T + 1], xStep: 1, yStep: 1, functions: [{ fn: { type: "exp", a: 1, b: Math.exp(1 / a) } }, { fn: { type: "poly", coeffs: [T] } }], points: [{ x: a * Math.log(T), y: T, label: "A" }], regions: [{ x: [0, a * Math.log(T)], fn: 0, to: 1 }], alt: "An exponential curve crossing the y-axis and rising to meet a horizontal line at the point A, with the region between the curve, the y-axis and the line shaded" },
        parts: [
          P("Find the exact $x$-coordinate of $\\mathrm{A}$.", 1, ans.exact(a * Math.log(T), coef(a, `\\ln ${T}`)), [`$${E_}^{${xe}} = ${T}$ gives ${a === 1 ? "" : `$\\dfrac{x}{${a}} = \\ln ${T}$, so `}$x = ${coef(a, `\\ln ${T}`)}$.`]),
          P("By integrating with respect to $y$, find the exact area of $R$.", 5, ans.exact(v, tex), [
            `$y = ${E_}^{${xe}}$ gives $x = ${coef(a, "\\ln y")}$. The curve meets the $y$-axis at $y = 1$.`,
            `Area $= ${INT(1, T, coef(a, "\\ln y"), "y")}$`,
            `By parts with $u = \\ln y$ and $\\dfrac{\\mathrm{d}v}{\\mathrm{d}y} = 1$: $\\displaystyle\\int \\ln y\\,\\mathrm{d}y = y\\ln y - \\displaystyle\\int 1\\,\\mathrm{d}y = y\\ln y - y + C$`,
            `Area $= ${a === 1 ? "" : a}\\left[y\\ln y - y\\right]_{1}^{${T}} = ${a === 1 ? "" : a}\\left(${T}\\ln ${T} - ${T} + 1\\right)$`,
            `Area $= ${tex}$`])] };
    } });

  const VR = { type: "t5-ahl-volume-revolution", syllabus: ["5.17"] };
  reg({ ...VR, unknown: "identify-integral", representation: "equation", format: "mcq", levels: [1], skills: ["AHL5.17.volume-x-axis"], title: "Choose the integral for a volume of revolution",
    build({ rng }) {
      const kind = rng.pick(["sqrt", "exp", "quad", "recip"]), c = rng.int(1, 6), p = rng.int(0, 2) + (kind === "recip" ? 1 : 0), q = p + rng.int(1, 3);
      const [y, y2] = { sqrt: [`\\sqrt{x + ${c}}`, `\\left(x + ${c}\\right)`], exp: [`${c === 1 ? "" : c}${E_}^{x}`, `${c * c === 1 ? "" : c * c}${E_}^{2x}`], quad: [`x^{2} + ${c}`, `\\left(x^{2} + ${c}\\right)^{2}`], recip: [`\\dfrac{${c}}{x}`, `\\dfrac{${c * c}}{x^{2}}`] }[kind];
      const opt = (code, text, why) => ({ text: m(text), value: code, why });
      return { params: { kind, c, p, q }, stem: `The region bounded by the curve $y = ${y}$, the $x$-axis and the lines $x = ${p}$ and $x = ${q}$ is rotated through $2\\pi$ about the $x$-axis to form a solid.`, parts: [
        P("Which expression gives the volume of the solid?", 2, ans.choice(rng, opt("pi-sq", `\\pi${INT(p, q, y2)}`), [
          opt("pi-lin", `\\pi${INT(p, q, kind === "quad" ? `\\left(${y}\\right)` : y)}`, "Each thin disc has radius $y$, so its area is $\\pi y^{2}$."),
          opt("sq", INT(p, q, y2), "Each thin disc has area $\\pi y^{2}$; the factor $\\pi$ is missing."),
          opt("2pi-sq", `2\\pi${INT(p, q, y2)}`, "The formula is $V = \\pi\\displaystyle\\int y^{2}\\,\\mathrm{d}x$; rotating through $2\\pi$ does not double it.")]), [
          `A rotation about the $x$-axis gives $V = \\pi\\displaystyle\\int_{a}^{b} y^{2}${dx}$.`,
          `Here $y^{2} = ${y2.replace(/^\\left\((.*)\\right\)$/, "$1")}$, so $V = \\pi${INT(p, q, y2)}$.`])] };
    } });
  reg({ ...VR, unknown: "power-curve-x-axis", representation: "graph", format: "value", levels: [2], skills: ["AHL5.17.volume-x-axis"], title: "Volume of revolution of a simple curve about the x-axis",
    build({ rng }) {
      const kind = rng.pick(["sqrt", "line", "quad"]);
      let a, p, q;
      do { a = rng.int(1, kind === "quad" ? 2 : 4); p = rng.int(0, 2); q = p + rng.int(1, kind === "quad" ? 2 : 4); } while ((kind === "line" && a * q > 12) || (kind === "quad" && a * q * q > 12) || (p === 0 && rng.bool()));
      const mm = kind === "sqrt" ? 2 : kind === "line" ? 3 : 5, n = a * a * (Math.pow(q, mm) - Math.pow(p, mm));
      const y = kind === "sqrt" ? coef(a, "\\sqrt{x}") : kind === "line" ? coef(a, "x") : coef(a, "x^{2}"), y2 = coef(a * a, pw("x", mm - 1));
      const fn = kind === "sqrt" ? { type: "sqrt", a } : { type: "poly", coeffs: kind === "line" ? [0, a] : [0, 0, a] }, top = kind === "sqrt" ? a * Math.sqrt(q) : kind === "line" ? a * q : a * q * q;
      return { params: { kind, a, p, q }, stem: `The diagram shows the curve $y = ${y}$${kind === "sqrt" ? "" : " for $x \\ge 0$"}. The shaded region is bounded by the curve, the $x$-axis and the line${p ? "s" : ""} ${p ? `$x = ${p}$ and ` : ""}$x = ${q}$. This region is rotated through $2\\pi$ about the $x$-axis.`,
        graph: { x: [-1, q + 1], y: [-1, Math.ceil(top) + 1], xStep: 1, yStep: top > 8 ? 2 : 1, functions: [{ fn, domain: [0, q + 0.7] }], asymptotes: p ? [{ x: p }, { x: q }] : [{ x: q }], regions: [{ x: [p, q], fn: 0 }], alt: "A curve rising from the origin, with the region under it shaded as far as a vertical dashed line" },
        parts: [
          P("Find the exact volume of the solid formed.", 3, ans.exact(Math.PI * n / mm, symQ(n, mm, "\\pi")), [
            `$V = \\pi${INT(p, q, "y^{2}")} = \\pi${INT(p, q, y2)}$`,
            `$V = \\pi\\left[${coef(fmt.Q(a * a, mm), pw("x", mm))}\\right]_{${p}}^{${q}}$`,
            `$V = ${symQ(n, mm, "\\pi")}$`])] };
    } });
  reg({ ...VR, unknown: "exact-x-axis", representation: "graph", format: "value", levels: [3], skills: ["AHL5.17.volume-x-axis"], title: "Exact volume of revolution about the x-axis",
    build({ rng }) {
      const kind = rng.pick(["sin", "cos", "exp", "recip", "sec", "xexp"]), a = rng.int(1, kind === "exp" ? 3 : 5), a2 = a * a, k = rng.int(2, 3);
      const A = a === 1 ? "" : `${a}`, A2 = a2 === 1 ? "" : `${a2}`;
      const d = {
        sin: { y: `${A}\\sin x`, lo: "0", hi: "\\pi", hiV: Math.PI, fn: { type: "trig", name: "sin", a }, top: a, v: a2 * Math.PI * Math.PI / 2, tex: symQ(a2, 2, "\\pi^{2}"), ends: "the $x$-axis between $x = 0$ and $x = \\pi$", w: [
          `$V = \\pi${INT(0, "\\pi", `${A2}\\sin^{2} x`)} = \\pi${INT(0, "\\pi", `${frac(a2, 2)}\\left(1 - \\cos 2x\\right)`)}$`,
          `$V = ${symQ(a2, 2, "\\pi")}\\left[x - \\dfrac{1}{2}\\sin 2x\\right]_{0}^{\\pi} = ${symQ(a2, 2, "\\pi")} \\times \\pi$`, `$V = ${symQ(a2, 2, "\\pi^{2}")}$`] },
        cos: { y: `${A}\\cos x`, lo: "0", hi: "\\frac{\\pi}{2}", hiV: Math.PI / 2, fn: { type: "trig", name: "cos", a }, top: a, v: a2 * Math.PI * Math.PI / 4, tex: symQ(a2, 4, "\\pi^{2}"), ends: "the $x$-axis and the $y$-axis", w: [
          `$V = \\pi${INT(0, "\\frac{\\pi}{2}", `${A2}\\cos^{2} x`)} = \\pi${INT(0, "\\frac{\\pi}{2}", `${frac(a2, 2)}\\left(1 + \\cos 2x\\right)`)}$`,
          `$V = ${symQ(a2, 2, "\\pi")}\\left[x + \\dfrac{1}{2}\\sin 2x\\right]_{0}^{\\frac{\\pi}{2}} = ${symQ(a2, 2, "\\pi")} \\times \\dfrac{\\pi}{2}$`, `$V = ${symQ(a2, 4, "\\pi^{2}")}$`] },
        exp: { y: `${A}${E_}^{x}`, lo: "0", hi: `\\ln ${k}`, hiV: Math.log(k), fn: { type: "exp", a }, top: a * k, v: Math.PI * a2 * (k * k - 1) / 2, tex: symQ(a2 * (k * k - 1), 2, "\\pi"), ends: `the $x$-axis, the $y$-axis and the line $x = \\ln ${k}$`, w: [
          `$V = \\pi${INT(0, `\\ln ${k}`, `${A2}${E_}^{2x}`)} = \\pi\\left[${frac(a2, 2)}${E_}^{2x}\\right]_{0}^{\\ln ${k}}$`,
          `$${E_}^{2\\ln ${k}} = ${k * k}$, so $V = ${symQ(a2, 2, "\\pi")}\\left(${k * k} - 1\\right)$`, `$V = ${symQ(a2 * (k * k - 1), 2, "\\pi")}$`] },
        recip: { y: `\\dfrac{${a}}{\\sqrt{1 + x^{2}}}`, lo: "0", hi: "1", hiV: 1, fn: null, top: a, v: a2 * Math.PI * Math.PI / 4, tex: symQ(a2, 4, "\\pi^{2}"), ends: "the $x$-axis, the $y$-axis and the line $x = 1$", w: [
          `$V = \\pi${INT(0, 1, `\\dfrac{${a2}}{1 + x^{2}}`)} = ${a2 === 1 ? "" : a2}\\pi\\left[\\arctan x\\right]_{0}^{1}$`,
          `$V = ${a2 === 1 ? "" : a2}\\pi \\times \\dfrac{\\pi}{4}$`, `$V = ${symQ(a2, 4, "\\pi^{2}")}$`] },
        sec: { y: `${A}\\sec x`, lo: "0", hi: "\\frac{\\pi}{4}", hiV: Math.PI / 4, fn: null, top: a * Math.SQRT2, v: a2 * Math.PI, tex: symQ(a2, 1, "\\pi"), ends: "the $x$-axis, the $y$-axis and the line $x = \\dfrac{\\pi}{4}$", w: [
          `$V = \\pi${INT(0, "\\frac{\\pi}{4}", `${A2}\\sec^{2} x`)} = ${A2}\\pi\\left[\\tan x\\right]_{0}^{\\frac{\\pi}{4}}$`,
          `$V = ${A2}\\pi\\left(1 - 0\\right)$`, `$V = ${symQ(a2, 1, "\\pi")}$`] },
        xexp: { y: `${A}\\sqrt{x}\\,${E_}^{x}`, lo: "0", hi: "1", hiV: 1, fn: null, top: a * Math.E, v: a2 * Math.PI * (Math.E * Math.E + 1) / 4, tex: a2 % 4 === 0 ? `${a2 === 4 ? "" : a2 / 4}\\pi\\left(${E_}^{2} + 1\\right)` : `\\dfrac{${A2}\\pi\\left(${E_}^{2} + 1\\right)}{4}`, ends: "the $x$-axis and the line $x = 1$", w: [
          `$V = \\pi${INT(0, 1, `${A2}x${E_}^{2x}`)}$`,
          `By parts with $u = x$ and $\\dfrac{\\mathrm{d}v}{\\mathrm{d}x} = ${E_}^{2x}$: $${INT(0, 1, `x${E_}^{2x}`)} = \\left[\\dfrac{1}{2}x${E_}^{2x}\\right]_{0}^{1} - ${INT(0, 1, `\\dfrac{1}{2}${E_}^{2x}`)}$`,
          `$= \\dfrac{1}{2}${E_}^{2} - \\left[\\dfrac{1}{4}${E_}^{2x}\\right]_{0}^{1} = \\dfrac{1}{2}${E_}^{2} - \\dfrac{1}{4}${E_}^{2} + \\dfrac{1}{4} = \\dfrac{${E_}^{2} + 1}{4}$`,
          `$V = ${a2 % 4 === 0 ? `${a2 === 4 ? "" : a2 / 4}\\pi\\left(${E_}^{2} + 1\\right)` : `\\dfrac{${A2}\\pi\\left(${E_}^{2} + 1\\right)}{4}`}$`] } }[kind];
      const fn = d.fn || (kind === "recip" ? { type: "pwl", points: Array.from({ length: 41 }, (_, i) => [-0.5 + i * 0.05, a / Math.sqrt(1 + (-0.5 + i * 0.05) ** 2)]) } : kind === "sec" ? { type: "pwl", points: Array.from({ length: 41 }, (_, i) => [-0.5 + i * 0.04, a / Math.cos(-0.5 + i * 0.04)]) } : { type: "pwl", points: Array.from({ length: 49 }, (_, i) => [i * 0.025, a * Math.sqrt(i * 0.025) * Math.exp(i * 0.025)]) });
      const xr = kind === "sin" ? [-0.5, 3.5] : kind === "cos" ? [-0.5, 2] : kind === "exp" ? [-0.5, Math.log(k) + 0.4] : [-0.5, 1.5];
      const vert = kind === "sin" || kind === "cos" ? [] : [{ x: d.hiV }];
      const fix = (s) => s.replace(/([= ])1\\left/g, "$1\\left").replace(/\[1\\mathrm/, `[${E_}`).replace(/= 1 \\times /, "= ").replace(/= 1\\pi/, "= \\pi");
      return { params: { kind, a, k }, stem: `The diagram shows the curve $y = ${d.y}$. The shaded region is bounded by the curve, ${d.ends}. This region is rotated through $2\\pi$ about the $x$-axis.`,
        graph: { x: xr, y: [-0.5, Math.ceil(d.top + 0.5)], xStep: 0.5, yStep: d.top > 6 ? 2 : 1, functions: [{ fn, domain: kind === "sin" ? [0, Math.PI] : kind === "cos" ? [-0.5, Math.PI / 2] : kind === "xexp" ? [0, 1.2] : undefined }], asymptotes: vert, regions: [{ x: [0, d.hiV], fn: 0 }], alt: "A curve above the x-axis with the region between the curve and the axis shaded" },
        parts: [P("Find the exact volume of the solid formed.", kind === "xexp" ? 6 : 5, ans.exact(d.v, d.tex), [`A rotation about the $x$-axis gives $V = \\pi\\displaystyle\\int y^{2}${dx}$.`].concat(d.w.map(fix)))] };
    } });
  reg({ ...VR, unknown: "parabola-y-axis", representation: "graph", format: "mcq", levels: [3], skills: ["AHL5.17.volume-y-axis", "AHL5.17.rearrange-for-x"], title: "Volume of revolution about the y-axis",
    build({ rng }) {
      let a, c, s, t;
      do { a = rng.int(1, 3); c = rng.int(0, 4); s = rng.int(0, 2); t = s + rng.int(1, 2); } while (a * t * t + c > 20 || (s === 0 && c === 0 && rng.bool()));
      const p = a * s * s + c, q = a * t * t + c, n = (q - c) * (q - c) - (p - c) * (p - c), yc = c ? `y - ${c}` : "y";
      const curve = `${coef(a, "x^{2}")}${c ? ` + ${c}` : ""}`;
      const x2 = { ok: a === 1 ? yc : `\\dfrac{${yc}}{${a}}`, plus: a === 1 ? `y + ${c || 1}` : `\\dfrac{y + ${c || 1}}{${a}}`, mult: a === 1 ? `\\sqrt{${yc}}` : `${a}\\left(${yc}\\right)`, sq: a === 1 ? `\\left(${yc}\\right)^{2}` : `\\dfrac{y}{${a}}${c ? ` - ${c}` : " - 1"}` };
      const opt = (code, why) => ({ text: m(`x^{2} = ${x2[code]}`), value: code, why });
      const regions = s === 0 ? [{ x: [0, t], fn: 0, to: 1 }] : [{ x: [0, s], fn: 2, to: 1 }, { x: [s, t], fn: 0, to: 1 }];
      return { params: { a, c, s, t }, stem: `The diagram shows the curve $y = ${curve}$ for $x \\ge 0$. The shaded region is bounded by the curve, the $y$-axis and the line${s ? "s" : ""} ${s ? `$y = ${p}$ and ` : ""}$y = ${q}$. This region is rotated through $2\\pi$ about the $y$-axis.`,
        graph: { x: [-1, t + 1], y: [0, q + 2], xStep: 1, yStep: q > 10 ? 2 : 1, functions: [{ fn: { type: "poly", coeffs: [c, 0, a] }, domain: [0, t + 0.5] }, { fn: { type: "poly", coeffs: [q] } }].concat(s ? [{ fn: { type: "poly", coeffs: [p] } }] : []), regions, alt: "A curve rising from the y-axis, with the region between the curve, the y-axis and one or two horizontal lines shaded" },
        parts: [
          P("Which equation gives $x^{2}$ in terms of $y$ for points on the curve?", 2, ans.choice(rng, opt("ok"), [
            opt("plus", `Subtract $${c || 0}$ from both sides before dividing.`.replace("Subtract $0$ from both sides before dividing.", "Divide both sides by the coefficient of $x^{2}$ only.")),
            opt("mult", a === 1 ? "The question asks for $x^{2}$, not $x$." : `Divide by $${a}$; do not multiply.`),
            opt("sq", a === 1 ? "Rearranging does not square the other side." : "Subtract the constant before dividing.")]), [
            c ? `$y = ${curve}$ gives $${coef(a, "x^{2}")} = ${yc}$.` : `$y = ${curve}$`, `$x^{2} = ${x2.ok}$`]),
          P("Find the exact volume of the solid formed.", 4, ans.exact(Math.PI * n / (2 * a), symQ(n, 2 * a, "\\pi")), [
            `A rotation about the $y$-axis gives $V = \\pi\\displaystyle\\int x^{2}\\,\\mathrm{d}y$.`,
            `$V = \\pi${INT(p, q, x2.ok, "y")}$`,
            `$V = \\pi\\left[${a === 1 && !c ? "\\dfrac{y^{2}}{2}" : `\\dfrac{\\left(${yc}\\right)^{2}}{${2 * a}}`}\\right]_{${p}}^{${q}} = \\pi\\left(\\dfrac{${(q - c) * (q - c)}}{${2 * a}} - \\dfrac{${(p - c) * (p - c)}}{${2 * a}}\\right)$`,
            `$V = ${symQ(n, 2 * a, "\\pi")}$`])] };
    } });
  reg({ ...VR, unknown: "between-curves", representation: "graph", format: "value", levels: [4], calculator: true, skills: ["AHL5.17.volume-between-curves", "AHL5.17.volume-x-axis"], title: "Volume of revolution of a region between two curves",
    build({ rng }) {
      const a = rng.int(3, 7), b = rng.pick([0.25, 0.5, 1]), k = rng.pick([0.5, 1]);
      const f = (x) => a - b * x * x, g = (x) => Math.exp(k * x);
      let lo = 0, hi = 6;
      for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (f(mid) > g(mid)) lo = mid; else hi = mid; }
      const p = lo, N = 4000, h = p / N;
      let V = 0;
      for (let i = 0; i < N; i++) { const x = (i + 0.5) * h; V += (f(x) * f(x) - g(x) * g(x)) * h; }
      V *= Math.PI;
      const ft = `${a} - ${b === 1 ? "" : num(b)}x^{2}`, gt = `${E_}^{${k === 1 ? "x" : "0.5x"}}`;
      return { params: { a, b, k }, stem: `The diagram shows the curves $y = ${ft}$ and $y = ${gt}$ for $x \\ge 0$. The curves meet at the point $\\mathrm{A}$. The shaded region $R$ is bounded by the two curves and the $y$-axis.`,
        graph: { x: [-0.5, Math.ceil(p) + 1], y: [0, a + 1], xStep: 1, yStep: 1, functions: [{ fn: { type: "poly", coeffs: [a, 0, -b] }, domain: [0, Math.ceil(p) + 0.5] }, { fn: { type: "exp", a: 1, b: Math.exp(k) }, domain: [0, Math.ceil(p) + 0.5] }], points: [{ x: p, y: f(p), label: "A" }], regions: [{ x: [0, p], fn: 1, to: 0 }], alt: "A falling parabola and a rising exponential curve that meet at the point A, with the region between them and the y-axis shaded" },
        parts: [
          P("Find the $x$-coordinate of $\\mathrm{A}$.", 2, ans.sf(p), [`Solve $${ft} = ${gt}$ with the graphing calculator.`, `$x = ${sf(p)}$ (the value $${sf(p, 5)}$ is kept for the next part).`]),
          P("The region $R$ is rotated through $2\\pi$ about the $x$-axis. Find the volume of the solid formed.", 4, ans.sf(V), [
            `The solid is the one formed by the upper curve with the one formed by the lower curve removed.`,
            `$V = \\pi${INT(0, sf(p, 5), `\\left(\\left(${ft}\\right)^{2} - \\left(${gt}\\right)^{2}\\right)`)}$`,
            `With the graphing calculator, $V = ${sf(V)}$.`])] };
    } });
  reg({ ...VR, unknown: "vase-y-axis", representation: "words", format: "value", levels: [4], calculator: true, skills: ["AHL5.17.volume-y-axis", "AHL5.17.rearrange-for-x"], title: "Volume of a vase modelled by a rotation about the y-axis",
    build({ rng }) {
      const a = rng.int(4, 9), h = rng.int(Math.ceil(0.8 * a), Math.floor(1.6 * a)), top = Math.exp(h / a);
      const Vof = (d) => Math.PI * a / 2 * (Math.exp(2 * d / a) - 1), V = Vof(h), half = a / 2 * Math.log(1 + V / (Math.PI * a));
      return { params: { a, h }, stem: `The inside of a vase is modelled by rotating the part of the curve $y = ${a}\\ln x$ between $y = 0$ and $y = ${h}$ through $2\\pi$ about the $y$-axis, where $x$ and $y$ are measured in centimetres.`, parts: [
        P("Find the radius of the opening at the top of the vase.", 1, ans.sf(top), [`At the top $${a}\\ln x = ${h}$, so $x = ${E_}^{\\frac{${h}}{${a}}} = ${sf(top)}\\text{ cm}$.`.replace(/\\frac\{(\d+)\}\{\1\}/, "1").replace(/\^\{1\}/, "")]),
        P("Find the volume of the vase, in $\\text{cm}^{3}$.", 4, ans.sf(V), [
          `$y = ${a}\\ln x$ gives $x = ${E_}^{\\frac{y}{${a}}}$, so $x^{2} = ${E_}^{\\frac{2y}{${a}}}$.`,
          `$V = \\pi\\displaystyle\\int x^{2}\\,\\mathrm{d}y = \\pi${INT(0, h, `${E_}^{\\frac{2y}{${a}}}`, "y")}$`,
          `$V = ${sf(V)}\\text{ cm}^{3}$`]),
        P("Water is poured into the empty vase until it is half full. Find the depth of the water.", 2, ans.sf(half), [
          `Solve $\\pi${INT(0, "d", `${E_}^{\\frac{2y}{${a}}}`, "y")} = ${sf(V / 2, 4)}$ for the depth $d$.`,
          `$d = ${sf(half)}\\text{ cm}$`])] };
    } });

  // PART-C

})(typeof window !== "undefined" ? window : globalThis);
