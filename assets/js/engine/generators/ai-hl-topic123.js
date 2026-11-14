/* AI HL additional higher level content, topics 1 to 3 (number and algebra, functions, geometry and
   trigonometry including vectors and graph theory). Home course: ai-hl, so every syllabus code here
   is an AI HL code. Self-contained: needs only engine.js and graph.js.
   Each generator's independent verifier is in scripts/engine-checks/ai-hl-topic123.mjs under the same id. */
(function (root) {
  "use strict";
  const E = root.QBEngine;
  const { ans, fmt } = E;
  const { num, sf, frac, poly, lin, signed, br, paren, expr, m, coef, rat, point, unit, deg, pct, gcd } = fmt;
  const P = (prompt, marks, answer, working) => ({ prompt, marks, answer, working });
  // Applications papers all allow a calculator; level 3 is the one set for exact answers by hand.
  const reg = (def) => E.registerAll({ home: "ai-hl", calculator: (l) => l !== 3 }, [def])[0];
  const tx = (x) => (typeof x === "string" ? x : num(x));
  const cx = (a, b) => expr([[a, ""], [b, "\\mathrm{i}"]]);                                  // a + bi
  const col = (...v) => `\\begin{pmatrix} ${v.map(tx).join(" \\\\ ")} \\end{pmatrix}`;         // column vector
  const mat = (rows) => `\\begin{pmatrix} ${rows.map((r) => r.map(tx).join(" & ")).join(" \\\\ ")} \\end{pmatrix}`;
  const B = (s) => `\\boldsymbol{${s}}`;
  const fe = (p, n) => { const q = rat.Q(p, n); return q.d === 1 ? String(q.n) : `${q.n < 0 ? "-" : ""}\\frac{${Math.abs(q.n)}}{${q.d}}`; };
  const rt = (n, s) => (n === 2 ? `\\sqrt{${s}}` : `\\sqrt[${n}]{${s}}`);
  const r2 = (x) => Math.round(x * 100) / 100, r1 = (x) => Math.round(x * 10) / 10;
  const edge = (x) => { const s = Math.abs(x) / Math.pow(10, Math.floor(Math.log10(Math.abs(x))) - 2); return Math.abs(s - Math.round(s)) > 0.48; }; // too close to a 3 s.f. rounding boundary
  const mul2 = (X, Y) => [[X[0][0] * Y[0][0] + X[0][1] * Y[1][0], X[0][0] * Y[0][1] + X[0][1] * Y[1][1]], [X[1][0] * Y[0][0] + X[1][1] * Y[1][0], X[1][0] * Y[0][1] + X[1][1] * Y[1][1]]];
  const ord = ["first", "second", "third"];

  // ======================= 1.9 laws of logarithms =======================
  const LOG = { type: "t1-ai-log-laws", syllabus: ["1.9"], representation: "equation", format: "value" };
  reg({ ...LOG, unknown: "combine", levels: [1], calculator: false, skills: ["AI-AHL1.9.combine"], title: "Combine logarithms into a single logarithm",
    build({ rng }) {
      let a, b, c;
      do { a = rng.int(2, 9); b = rng.int(2, 9); c = rng.int(2, 6); } while ((a * b) % c !== 0 || a * b === c || a === c || b === c);
      const L = rng.bool() ? "\\ln" : "\\log_{10}", k = (a * b) / c;
      return { params: { a, b, c }, stem: `It is given that $${L} ${a} + ${L} ${b} - ${L} ${c} = ${L} k$.`, parts: [
        P("Find the value of $k$.", 2, ans.int(k), [`Adding logarithms multiplies the numbers: $${L} ${a} + ${L} ${b} = ${L}(${a} \\times ${b}) = ${L} ${a * b}$`,
          `Subtracting divides: $${L} ${a * b} - ${L} ${c} = ${L}\\left(\\dfrac{${a * b}}{${c}}\\right) = ${L} ${k}$, so $k = ${k}$.`])] };
    } });
  reg({ ...LOG, unknown: "expand", levels: [2], calculator: false, skills: ["AI-AHL1.9.expand"], title: "Expand the logarithm of a product, quotient and power",
    build({ rng }) {
      let p, q, mm, n, v2;
      do { p = 2 * rng.int(1, 12); q = rng.int(1, 15); mm = rng.pick([2, 3]); n = rng.pick([2, 3]); v2 = p / 2 - n * q; } while (v2 === 0 || p === q || p === 10 || q === 10);
      const L = "\\log_{10}", pd = p / 10, qd = q / 10, v1 = (mm * p + q) / 10;
      return { params: { p: pd, q: qd, m: mm, n }, stem: `It is given that $${L} a = ${num(pd)}$ and $${L} b = ${num(qd)}$.`, parts: [
        P(`Find the value of $${L}\\left(a^{${mm}}b\\right)$.`, 2, ans.dec(v1), [`$${L}\\left(a^{${mm}}b\\right) = ${mm}${L} a + ${L} b$`, `$= ${mm}${br(pd)} + ${num(qd)} = ${num(v1)}$`]),
        P(`Find the value of $${L}\\left(\\dfrac{\\sqrt{a}}{b^{${n}}}\\right)$.`, 2, ans.dec(v2 / 10), [`$\\sqrt{a} = a^{\\frac{1}{2}}$, so $${L}\\left(\\dfrac{\\sqrt{a}}{b^{${n}}}\\right) = \\dfrac{1}{2}${L} a - ${n}${L} b$`,
          `$= \\dfrac{1}{2}${br(pd)} - ${n}${br(qd)} = ${num(v2 / 10)}$`])] };
    } });
  reg({ ...LOG, unknown: "solve-equation", levels: [3], skills: ["AI-AHL1.9.solve-equation", "AI-AHL1.9.combine"], title: "Solve an equation with the laws of logarithms",
    build({ rng }) {
      // 2 ln x - ln(x + a) = ln k  gives  x^2 - kx - ka = 0  with roots r and -s
      let r, s, k, a;
      do { r = rng.int(3, 12); s = rng.int(2, 8); k = r - s; a = (r * s) / k; } while (k < 2 || !Number.isInteger(a) || a > 24);
      return { params: { a, k }, stem: `Consider the equation $2\\ln x - \\ln(${lin(1, a)}) = \\ln ${k}$, where $x > 0$.`, parts: [
        P(`The equation can be written as $x^{2} = p(${lin(1, a)})$. Find the value of $p$.`, 2, ans.int(k), [`$2\\ln x = \\ln\\left(x^{2}\\right)$, so the left side is $\\ln\\left(\\dfrac{x^{2}}{${lin(1, a)}}\\right)$.`,
          `$\\dfrac{x^{2}}{${lin(1, a)}} = ${k}$, so $x^{2} = ${k}(${lin(1, a)})$ and $p = ${k}$.`]),
        P("Hence solve the equation.", 3, ans.int(r), [`$${poly([1, -k, -k * a])} = 0$`, `$(${lin(1, -r)})(${lin(1, s)}) = 0$, so $x = ${r}$ or $x = ${-s}$.`,
          `$\\ln x$ needs $x > 0$, so $x = ${r}$.`])] };
    } });
  reg({ ...LOG, unknown: "ratio-quotient-law", representation: "words", levels: [4], skills: ["AI-AHL1.9.ratio-quotient-law", "AI-AHL1.9.solve-equation"], title: "Sound levels: logarithms of a ratio",
    build({ rng }) {
      let c, e, L1, L2, k, La, ratio, Lc;
      do {
        c = rng.int(11, 95) / 10; e = rng.int(4, 9); L1 = rng.int(62, 98); L2 = L1 - rng.int(4, 27); k = rng.pick([3, 4, 5, 6, 7, 8, 12, 15, 20, 25, 30, 40]);
        La = 10 * Math.log10(c * Math.pow(10, 12 - e)); ratio = Math.pow(10, (L1 - L2) / 10); Lc = L1 + 10 * Math.log10(k);
      } while (edge(La) || edge(ratio) || edge(Lc) || (L1 - L2) % 10 === 0);
      const I0 = "10^{-12}", frac0 = "\\dfrac{I}{I_{0}}";
      return { params: { c, e, L1, L2, k }, stem: `The sound level $L$ of a sound, in decibels (dB), is given by $L = 10\\log_{10}\\left(${frac0}\\right)$, where $I$ is the intensity of the sound in $\\text{W m}^{-2}$ and $I_{0} = ${I0}\\text{ W m}^{-2}$.`, parts: [
        P(`Find the sound level of a machine whose intensity is $${num(c)} \\times 10^{${-e}}\\text{ W m}^{-2}$.`, 2, ans.sf(La), [`$L = 10\\log_{10}\\left(\\dfrac{${num(c)} \\times 10^{${-e}}}{${I0}}\\right) = 10\\log_{10}\\left(${num(c)} \\times 10^{${12 - e}}\\right)$`, `$L = ${sf(La)}\\text{ dB}$`]),
        P(`A siren has a sound level of $${unit(L1, "dB")}$ and a lorry has a sound level of $${unit(L2, "dB")}$. Find how many times more intense the sound of the siren is than the sound of the lorry.`, 2, ans.sf(ratio), [
          `$${L1} - ${L2} = 10\\log_{10}\\left(\\dfrac{I_{1}}{I_{0}}\\right) - 10\\log_{10}\\left(\\dfrac{I_{2}}{I_{0}}\\right) = 10\\log_{10}\\left(\\dfrac{I_{1}}{I_{2}}\\right)$, by the quotient law.`,
          `$\\dfrac{I_{1}}{I_{2}} = 10^{${num((L1 - L2) / 10)}} = ${sf(ratio)}$`]),
        P(`A second siren is $${k}$ times as intense as the first siren. Find its sound level.`, 2, ans.sf(Lc), [
          `$L = 10\\log_{10}\\left(\\dfrac{${k}I_{1}}{I_{0}}\\right) = 10\\log_{10} ${k} + 10\\log_{10}\\left(\\dfrac{I_{1}}{I_{0}}\\right)$, by the product law.`,
          `$L = 10\\log_{10} ${k} + ${L1} = ${sf(Lc)}\\text{ dB}$`])] };
    } });

  // ======================= 1.10 rational exponents =======================
  const REX = { type: "t1-ai-rational-exponents", syllabus: ["1.10"], representation: "equation", format: "value" };
  const POWS = [[4, 2, 2], [8, 2, 3], [9, 3, 2], [16, 2, 4], [16, 4, 2], [25, 5, 2], [27, 3, 3], [32, 2, 5], [36, 6, 2], [49, 7, 2], [64, 4, 3], [81, 3, 4], [100, 10, 2], [125, 5, 3], [1000, 10, 3]]; // [b, c, n]: b = c^n
  reg({ ...REX, unknown: "evaluate", levels: [1], calculator: false, skills: ["AI-AHL1.10.evaluate-numerical"], title: "Evaluate a number raised to a fractional power",
    build({ rng }) {
      let b, c, n, p, neg;
      do { [b, c, n] = rng.pick(POWS); p = rng.int(1, 4); neg = rng.bool(); } while (gcd(p, n) !== 1 || Math.pow(c, p) > 1000 || (p === 1 && !neg));
      const v = Math.pow(c, p), w = [`$${b}^{\\frac{1}{${n}}} = ${rt(n, b)} = ${c}$`];
      if (p > 1) w.push(`$${b}^{${fe(p, n)}} = \\left(${b}^{\\frac{1}{${n}}}\\right)^{${p}} = ${c}^{${p}} = ${v}$`);
      if (neg) w.push(`A negative power is a reciprocal: $${b}^{${fe(-p, n)}} = ${frac(1, v)}$`);
      return { params: { b, p: neg ? -p : p, n }, stem: `Consider the number $${b}^{${fe(neg ? -p : p, n)}}$.`, parts: [
        P("Find its exact value.", 2, neg ? ans.frac(1, v) : ans.int(v), w)] };
    } });
  reg({ ...REX, unknown: "root-as-power", levels: [1], calculator: false, skills: ["AI-AHL1.10.roots-as-powers"], title: "Write a root as a fractional power",
    build({ rng }) {
      let form, n, p, a;
      do { form = rng.int(0, 3); n = rng.pick([2, 3, 4, 5]); p = rng.int(1, 7); a = rng.int(2, 5); } while (gcd(p, n) !== 1 || p === n);
      const xp = p === 1 ? "x" : `x^{${p}}`;
      let texE, k, w;
      if (form === 0) { texE = rt(n, xp); k = rat.Q(p, n); w = [`The $n$th root is the power $\\frac{1}{n}$: $${texE} = \\left(${xp}\\right)^{\\frac{1}{${n}}}$`, `$= x^{${fe(p, n)}}$, so $k = ${frac(p, n)}$.`]; }
      else if (form === 1) { texE = `\\dfrac{1}{${rt(n, xp)}}`; k = rat.Q(-p, n); w = [`$${rt(n, xp)} = x^{${fe(p, n)}}$`, `A reciprocal is a negative power: $${texE} = x^{${fe(-p, n)}}$, so $k = ${frac(-p, n)}$.`]; }
      else if (form === 2) { texE = `x^{${a}}\\sqrt{x}`; k = rat.Q(2 * a + 1, 2); w = [`$\\sqrt{x} = x^{\\frac{1}{2}}$`, `Add the powers: $x^{${a}} \\times x^{\\frac{1}{2}} = x^{${fe(2 * a + 1, 2)}}$, so $k = ${frac(2 * a + 1, 2)}$.`]; }
      else { texE = `\\dfrac{x^{${a}}}{${rt(n, "x")}}`; k = rat.Q(a * n - 1, n); w = [`$${rt(n, "x")} = x^{\\frac{1}{${n}}}$`, `Subtract the powers: $x^{${a}} \\div x^{\\frac{1}{${n}}} = x^{${fe(a * n - 1, n)}}$, so $k = ${frac(a * n - 1, n)}$.`]; }
      return { params: { form, n, p, a }, stem: `For $x > 0$, the expression $${texE}$ can be written as $x^{k}$.`, parts: [P("Find the value of $k$.", 2, ans.frac(k.n, k.d), w)] };
    } });
  reg({ ...REX, unknown: "simplify-power", levels: [2], calculator: false, skills: ["AI-AHL1.10.simplify-algebraic", "AI-AHL1.10.evaluate-numerical"], title: "Simplify a bracket raised to a fractional power",
    build({ rng }) {
      let b, c, n, p, e, neg;
      do { [b, c, n] = rng.pick(POWS); p = rng.int(1, 3); e = rng.int(2, 9); neg = rng.bool(); } while (gcd(p, n) !== 1 || Math.pow(c, p) > 400 || e === n);
      const s = neg ? -1 : 1, q = fe(s * p, n), kk = Math.pow(c, p), mq = rat.Q(s * e * p, n);
      const inner = `${b}x^{${e}}`;
      return { params: { b, e, p: s * p, n }, stem: `For $x > 0$, the expression $\\left(${inner}\\right)^{${q}}$ can be written as $kx^{n}$.`, parts: [
        P("Find the value of $k$.", 2, neg ? ans.frac(1, kk) : ans.int(kk), [`The power applies to each factor: $\\left(${inner}\\right)^{${q}} = ${b}^{${q}} \\times \\left(x^{${e}}\\right)^{${q}}$`,
          `$${b}^{\\frac{1}{${n}}} = ${c}$, so $${b}^{${q}} = ${neg ? frac(1, kk) : kk}$ and $k = ${neg ? frac(1, kk) : kk}$.`]),
        P("Find the value of $n$.", 2, ans.frac(mq.n, mq.d), [`Multiply the powers: $\\left(x^{${e}}\\right)^{${q}} = x^{${e} \\times ${neg ? `\\left(${q}\\right)` : q}}$`, `$n = ${frac(mq.n, mq.d)}$`])] };
    } });
  reg({ ...REX, unknown: "simplify-chain", levels: [3], skills: ["AI-AHL1.10.simplify-algebraic", "AI-AHL1.10.roots-as-powers", "AI-AHL1.10.evaluate-numerical"], title: "Simplify with several exponent laws, then evaluate",
    build({ rng }) {
      let b, c, n, p, e, d, r, mq, kq, t, x, val;
      do {
        [b, c, n] = rng.pick(POWS); p = rng.int(1, 3); e = rng.int(2, 9); d = rng.pick([2, 3, 4, 5, 6, 8, 10]); r = rng.pick([2, 3]);
        mq = rat.sub(rat.Q(e * p, n), rat.Q(1, r)); kq = rat.Q(Math.pow(c, p), d);
        t = rng.pick([2, 3]); x = mq.d === 1 ? t : mq.d === 2 ? t * t : 8;
        const tt = mq.d === 3 ? 2 : t;
        val = mq.d <= 3 ? rat.mul(kq, mq.n >= 0 ? rat.Q(Math.pow(tt, mq.n), 1) : rat.Q(1, Math.pow(tt, -mq.n))) : null;
      } while (gcd(p, n) !== 1 || Math.pow(c, p) > 200 || e === n || mq.d > 3 || mq.n === 0 || Math.abs(mq.n) > 5 || val.n > 2000 || val.d > 400 || (mq.n === mq.d));
      const q = fe(p, n), inner = `${b}x^{${e}}`, eq = rat.Q(e * p, n), tt = mq.d === 3 ? 2 : t;
      const pw = Math.pow(tt, Math.abs(mq.n)), xm = mq.n > 0 ? num(pw) : frac(1, pw);
      return { params: { b, e, p, n, d, r, x }, stem: `For $x > 0$, let $F = \\left(${inner}\\right)^{${q}} \\div \\left(${d}${rt(r, "x")}\\right)$. The expression $F$ can be written as $kx^{n}$.`, parts: [
        P("Find the value of $k$.", 2, ans.frac(kq.n, kq.d), [`$\\left(${inner}\\right)^{${q}} = ${b}^{${q}} \\times x^{${e} \\times ${q}} = ${Math.pow(c, p)}x^{${fe(eq.n, eq.d)}}$`, `Dividing by $${d}$: $k = ${frac(kq.n, kq.d)}$`]),
        P("Find the value of $n$.", 3, ans.frac(mq.n, mq.d), [`$${rt(r, "x")} = x^{\\frac{1}{${r}}}$`, `Dividing subtracts the powers: $n = ${frac(eq.n, eq.d)} - ${frac(1, r)}$`, `$n = ${frac(mq.n, mq.d)}$`]),
        P(`Hence find the exact value of $F$ when $x = ${x}$.`, 2, ans.frac(val.n, val.d), [
          `$${x}^{${fe(mq.n, mq.d)}} = ${xm}$${mq.d > 1 ? `, because $${x}^{\\frac{1}{${mq.d}}} = ${tt}$` : ""}.`, `$F = ${frac(kq.n, kq.d)} \\times ${xm} = ${frac(val.n, val.d)}$`])] };
    } });
  const REXM = [
    { y: "R", x: "m", p: 3, q: 4, c: [32, 38], x1: [12, 80], story: (f) => `The resting metabolic rate $R$, in watts, of a mammal with body mass $m\\text{ kg}$ is modelled by $${f}$.`, a: (x) => `Find the metabolic rate predicted for a mammal of mass $${unit(x, "kg")}$.`, b: (y) => `A mammal has a resting metabolic rate of $${unit(y, "watts")}$. Find its mass, in kilograms, according to the model.`, mult: "mass", what: "metabolic rate", cs: 10, ux: "kg" },
    { y: "A", x: "m", p: 2, q: 3, c: [95, 125], x1: [15, 90], story: (f) => `The surface area $A$, in $\\text{m}^{2}$, of an animal with body mass $m\\text{ kg}$ is modelled by $${f}$.`, a: (x) => `Find the surface area predicted for an animal of mass $${unit(x, "kg")}$.`, b: (y) => `An animal has a surface area of $${num(y)}\\text{ m}^{2}$. Find its mass, in kilograms, according to the model.`, mult: "mass", what: "surface area", cs: 1000, ux: "kg" },
    { y: "T", x: "d", p: 3, q: 2, c: [16, 42], x1: [3, 30], story: (f) => `The time $T$, in days, that a moon takes to orbit a planet at a distance of $d$ million kilometres is modelled by $${f}$.`, a: (x) => `Find the orbit time predicted for a moon at a distance of $${num(x)}$ million kilometres.`, b: (y) => `A moon takes $${num(y)}$ days to orbit the planet. Find its distance from the planet, in millions of kilometres, according to the model.`, mult: "distance", what: "orbit time", cs: 10, ux: "" },
  ];
  reg({ ...REX, unknown: "power-model", representation: "words", levels: [4], skills: ["AI-AHL1.10.evaluate-numerical", "AI-AHL1.10.roots-as-powers"], title: "Use a model with a fractional power",
    build({ rng }) {
      const M = rng.pick(REXM), f = rng.pick([2, 3, 5]);
      let c, x1, y2, v1, v2, v3;
      do {
        c = rng.int(M.c[0], M.c[1]) / M.cs; x1 = M.x1[1] <= 30 ? rng.int(M.x1[0] * 2, M.x1[1] * 2) / 2 : rng.int(M.x1[0], M.x1[1]);
        v1 = c * Math.pow(x1, M.p / M.q); y2 = Number(sf(v1 * rng.pick([0.3, 0.45, 1.6, 2.2, 3.5]), 2)); v2 = Math.pow(y2 / c, M.q / M.p); v3 = Math.pow(f, M.p / M.q);
      } while (edge(v1) || edge(v2));
      const e = fe(M.p, M.q), ei = fe(M.q, M.p), formula = `${M.y} = ${num(c)}${M.x}^{${e}}`;
      return { params: { c, p: M.p, q: M.q, x1, y2, f }, stem: M.story(formula), parts: [
        P(M.a(x1), 2, ans.sf(v1), [`$${M.y} = ${num(c)} \\times ${num(x1)}^{${e}}$`, `$${M.y} = ${sf(v1)}$`]),
        P(M.b(y2), 3, ans.sf(v2), [`$${num(y2)} = ${num(c)}${M.x}^{${e}}$, so $${M.x}^{${e}} = \\dfrac{${num(y2)}}{${num(c)}}$`,
          `Raise both sides to the power $${frac(M.q, M.p)}$: $${M.x} = \\left(\\dfrac{${num(y2)}}{${num(c)}}\\right)^{${ei}}$`, `$${M.x} = ${sf(v2)}$`]),
        P(`The ${M.mult} is multiplied by $${f}$. Find the number by which the model multiplies the ${M.what}.`, 2, ans.sf(v3), [
          `$${num(c)}(${f}${M.x})^{${e}} = ${f}^{${e}} \\times ${num(c)}${M.x}^{${e}}$`, `The ${M.what} is multiplied by $${f}^{${e}} = ${sf(v3)}$.`])] };
    } });

  // ======================= 1.12 complex numbers in Cartesian form =======================
  const CC = { type: "t1-ai-complex-cartesian", syllabus: ["1.12"], representation: "equation", format: "value" };
  reg({ ...CC, unknown: "product", levels: [1], calculator: false, skills: ["AI-AHL1.12.arithmetic"], title: "Multiply two complex numbers",
    build({ rng }) {
      const a = rng.nonzero(-6, 6), b = rng.nonzero(-6, 6), c = rng.nonzero(-6, 6), d = rng.nonzero(-6, 6);
      const re = a * c - b * d, im = a * d + b * c;
      return { params: { a, b, c, d }, stem: `Let $z = ${cx(a, b)}$ and $w = ${cx(c, d)}$.`, parts: [
        P("Find the real part of $zw$.", 1, ans.int(re), [`$zw = ${expr([[a * c, ""], [a * d, "\\mathrm{i}"], [b * c, "\\mathrm{i}"], [b * d, "\\mathrm{i}^{2}"]])}$`,
          `$\\mathrm{i}^{2} = -1$, so $zw = ${cx(re, im)}$. The real part is $${re}$.`]),
        P("Find the imaginary part of $zw$.", 1, ans.int(im), [`From $zw = ${cx(re, im)}$, the imaginary part is $${im}$.`])] };
    } });
  reg({ ...CC, unknown: "quotient", levels: [2], calculator: false, skills: ["AI-AHL1.12.divide", "AI-AHL1.12.conjugate"], title: "Divide complex numbers with the conjugate",
    build({ rng }) {
      let a, b, c, d, N, pn, qn;
      do { a = rng.nonzero(-9, 9); b = rng.nonzero(-9, 9); c = rng.nonzero(-4, 4); d = rng.nonzero(-4, 4); N = c * c + d * d; pn = a * c + b * d; qn = b * c - a * d; } while (pn === 0 || qn === 0 || (pn % N === 0 && qn % N === 0 && rng.bool()));
      return { params: { a, b, c, d }, stem: `Let $z = ${cx(a, b)}$ and $w = ${cx(c, d)}$. The number $\\dfrac{z}{w}$ is written as $p + q\\mathrm{i}$, where $p$ and $q$ are real.`, parts: [
        P("Find the exact value of $p$.", 2, ans.frac(pn, N), [`Multiply top and bottom by the conjugate of $w$: $\\dfrac{z}{w} = \\dfrac{(${cx(a, b)})(${cx(c, -d)})}{(${cx(c, d)})(${cx(c, -d)})}$`,
          `Bottom: $${paren(c)}^{2} + ${paren(d)}^{2} = ${N}$. Top: $${cx(pn, qn)}$.`, `$p = ${frac(pn, N)}$`]),
        P("Find the exact value of $q$.", 2, ans.frac(qn, N), [`$\\dfrac{z}{w} = \\dfrac{${cx(pn, qn)}}{${N}}$, so $q = ${frac(qn, N)}$.`])] };
    } });
  reg({ ...CC, unknown: "modulus-argument", levels: [2], skills: ["AI-AHL1.12.modulus-argument"], title: "Modulus and argument of a complex number",
    build({ rng }) {
      let a, b, r, th;
      do { a = rng.nonzero(-9, 9); b = rng.nonzero(-9, 9); r = Math.hypot(a, b); th = Math.atan2(b, a); } while ((a > 0 && b > 0) || Number.isInteger(r) || edge(r) || edge(th) || Math.abs(a) === Math.abs(b));
      const base = Math.atan(Math.abs(b) / Math.abs(a)), quad = a < 0 ? (b > 0 ? "second" : "third") : "fourth";
      const adj = a < 0 ? (b > 0 ? `$\\arg z = \\pi - ${sf(base, 4)} = ${sf(th)}$` : `$\\arg z = -(\\pi - ${sf(base, 4)}) = ${sf(th)}$`) : `$\\arg z = ${sf(th)}$`;
      return { params: { a, b }, stem: `Let $z = ${cx(a, b)}$.`, parts: [
        P("Find $|z|$.", 2, ans.sf(r), [`$|z| = \\sqrt{${paren(a)}^{2} + ${paren(b)}^{2}} = \\sqrt{${a * a + b * b}}$`, `$|z| = ${sf(r)}$`]),
        P("Find $\\arg z$, in radians, where $-\\pi < \\arg z \\le \\pi$.", 2, ans.sf(th), [`On an Argand diagram $z$ is in the ${quad} quadrant. The acute angle with the real axis is $\\arctan\\left(\\dfrac{${Math.abs(b)}}{${Math.abs(a)}}\\right) = ${sf(base, 4)}$.`, adj])] };
    } });
  reg({ ...CC, unknown: "read-argand", representation: "graph", levels: [2], skills: ["AI-AHL1.12.argand-diagram", "AI-AHL1.12.arithmetic", "AI-AHL1.12.modulus-argument"], title: "Read complex numbers from an Argand diagram",
    build({ rng }) {
      let a, b, c, d, dist;
      do { a = rng.nonzero(-6, 6); b = rng.nonzero(-6, 6); c = rng.nonzero(-6, 6); d = rng.nonzero(-6, 6); dist = Math.hypot(a - c, b - d); } while (Math.abs(a - c) < 2 || Math.abs(b - d) < 2 || Number.isInteger(dist) || edge(dist));
      return { params: { a, b, c, d }, graph: { x: [-7, 7], y: [-7, 7], xStep: 1, yStep: 1, points: [{ x: a, y: b, label: "A" }, { x: c, y: d, label: "B" }], xLabel: "Re", yLabel: "Im", alt: "An Argand diagram with two points A and B marked at grid points" },
        stem: "The Argand diagram shows the points $\\mathrm{A}$ and $\\mathrm{B}$, which represent the complex numbers $z$ and $w$. Both points are at grid points and each grid square has side one unit.", parts: [
          P("Write down the imaginary part of $z$.", 1, ans.int(b), [`$\\mathrm{A}$ is $${point(a, b)}$, so $z = ${cx(a, b)}$ and its imaginary part is $${b}$.`]),
          P("Find the real part of $z - w$.", 1, ans.int(a - c), [`$\\mathrm{B}$ is $${point(c, d)}$, so $w = ${cx(c, d)}$.`, `$z - w = ${cx(a - c, b - d)}$, with real part $${a - c}$.`]),
          P("Find $|z - w|$.", 2, ans.sf(dist), [`$|z - w| = \\sqrt{${paren(a - c)}^{2} + ${paren(b - d)}^{2}} = \\sqrt{${(a - c) ** 2 + (b - d) ** 2}}$`, `$|z - w| = ${sf(dist)}$, the distance $\\mathrm{AB}$.`])] };
    } });
  reg({ ...CC, unknown: "quadratic-roots", levels: [3], skills: ["AI-AHL1.12.quadratic-complex-roots"], title: "Complex roots of a real quadratic",
    build({ rng }) {
      let lead, p, q;
      do { lead = rng.pick([1, 1, 2]); p = rng.nonzero(-5, 5); q = rng.int(1, 6); } while (lead * (p * p + q * q) > 90);
      const b = -2 * lead * p, c = lead * (p * p + q * q), disc = b * b - 4 * lead * c;
      return { params: { lead, b, c }, stem: `Consider the equation $${poly([lead, b, c], "z")} = 0$.`, parts: [
        P("Find the value of the discriminant of the quadratic.", 2, ans.int(disc), [`$\\Delta = ${paren(b)}^{2} - 4${br(lead)}${br(c)}$`, `$\\Delta = ${disc}$, which is negative, so the roots are not real.`]),
        P("The roots are $z = p \\pm q\\mathrm{i}$, where $q > 0$. Find the value of $p$.", 2, ans.int(p), [`$z = \\dfrac{${-b} \\pm \\sqrt{${disc}}}{${2 * lead}}$`, `$p = \\dfrac{${-b}}{${2 * lead}} = ${p}$`]),
        P("Find the value of $q$.", 2, ans.int(q), [`$\\sqrt{${disc}} = \\sqrt{${-disc}}\\,\\mathrm{i} = ${2 * lead * q}\\mathrm{i}$`, `$q = \\dfrac{${2 * lead * q}}{${2 * lead}} = ${q}$, so $z = ${p} \\pm ${coef(q, "\\mathrm{i}")}$.`])] };
    } });
  reg({ ...CC, unknown: "powers-technology", levels: [4], skills: ["AI-AHL1.12.arithmetic", "AI-AHL1.12.divide", "AI-AHL1.12.modulus-argument", "AI-AHL1.12.conjugate"], title: "Powers, quotients and conjugates with technology",
    build({ rng }) {
      let a, b, c, d, z3, md, ar, pr;
      do {
        a = rng.nonzero(-4, 4); b = rng.nonzero(-4, 4); c = rng.nonzero(-6, 6); d = rng.nonzero(-6, 6);
        z3 = [a * a * a - 3 * a * b * b, 3 * a * a * b - b * b * b]; md = Math.pow(Math.hypot(a, b), 3) / Math.hypot(c, d);
        pr = [a * c + b * d, b * c - a * d]; ar = Math.atan2(pr[1], pr[0]);
      } while (z3[0] === 0 || z3[1] === 0 || pr[0] === 0 || pr[1] === 0 || Math.abs(ar) > 3 || edge(md) || edge(ar) || Number.isInteger(md));
      return { params: { a, b, c, d }, stem: `Let $z = ${cx(a, b)}$ and $w = ${cx(c, d)}$. The conjugate of $w$ is written $w^{\\ast}$.`, parts: [
        P("Find the real part of $z^{3}$.", 1, ans.int(z3[0]), [`With technology, $z^{3} = (${cx(a, b)})^{3} = ${cx(z3[0], z3[1])}$. The real part is $${num(z3[0])}$.`]),
        P("Find the imaginary part of $z^{3}$.", 1, ans.int(z3[1]), [`From $z^{3} = ${cx(z3[0], z3[1])}$, the imaginary part is $${num(z3[1])}$.`]),
        P("Find $\\left|\\dfrac{z^{3}}{w}\\right|$.", 2, ans.sf(md), [`$\\left|\\dfrac{z^{3}}{w}\\right| = \\dfrac{|z^{3}|}{|w|} = \\dfrac{\\sqrt{${num(z3[0] ** 2 + z3[1] ** 2)}}}{\\sqrt{${c * c + d * d}}}$`, `$= ${sf(md)}$`]),
        P("Find $\\arg(zw^{\\ast})$, in radians, where $-\\pi < \\arg(zw^{\\ast}) \\le \\pi$.", 2, ans.sf(ar), [`$w^{\\ast} = ${cx(c, -d)}$, so $zw^{\\ast} = (${cx(a, b)})(${cx(c, -d)}) = ${cx(pr[0], pr[1])}$`, `With technology, $\\arg(zw^{\\ast}) = ${sf(ar)}$.`])] };
    } });

  // ======================= 1.13 polar and exponential forms =======================
  const CP = { type: "t1-ai-complex-polar", syllabus: ["1.13"], representation: "equation", format: "value" };
  const expForm = (r, th) => `${r === 1 ? "" : num(r)}\\mathrm{e}^{${coef(th, "\\mathrm{i}")}}`;
  reg({ ...CP, unknown: "polar-to-cartesian", levels: [1], skills: ["AI-AHL1.13.polar-to-cartesian"], title: "Convert polar or exponential form to Cartesian form",
    build({ rng }) {
      let r, th, re, im;
      do { r = rng.int(3, 17) / 2; th = rng.sign() * rng.int(4, 30) / 10; re = r * Math.cos(th); im = r * Math.sin(th); } while (edge(re) || edge(im) || Math.abs(re) < 0.2 || Math.abs(im) < 0.2);
      const form = rng.int(0, 2), z = form === 0 ? expForm(r, th) : form === 1 ? `${num(r)}\\operatorname{cis}(${num(th)})` : `${num(r)}\\left(\\cos(${num(th)}) + \\mathrm{i}\\sin(${num(th)})\\right)`;
      return { params: { r, th }, stem: `Let $z = ${z}$, where the angle is in radians.`, parts: [
        P("Find the real part of $z$.", 1, ans.sf(re), [`$z = ${num(r)}\\cos(${num(th)}) + ${num(r)}\\mathrm{i}\\sin(${num(th)})$`, `$\\operatorname{Re}(z) = ${num(r)}\\cos(${num(th)}) = ${sf(re)}$`]),
        P("Find the imaginary part of $z$.", 1, ans.sf(im), [`$\\operatorname{Im}(z) = ${num(r)}\\sin(${num(th)}) = ${sf(im)}$`])] };
    } });
  reg({ ...CP, unknown: "product-powers", levels: [2], skills: ["AI-AHL1.13.multiply-divide-powers"], title: "Multiply, divide and raise to a power in exponential form",
    build({ rng }) {
      let ra, rb, t1, t2;
      do { ra = rng.pick([2, 3, 4, 5]); rb = rng.pick([2, 4, 5, 8, 10]); t1 = rng.int(2, 9); t2 = rng.sign() * rng.int(3, 15); } while (ra === rb || Math.abs(t1 + t2) > 31 || t1 + t2 === 0 || Math.abs(3 * t1 - t2) > 31 || 3 * t1 === t2);
      const th1 = t1 / 10, th2 = t2 / 10, q = `\\dfrac{z^{3}}{w}`;
      return { params: { ra, rb, th1, th2 }, stem: `Let $z = ${expForm(ra, th1)}$ and $w = ${expForm(rb, th2)}$.`, parts: [
        P("Find $|zw|$.", 1, ans.int(ra * rb), [`Moduli multiply: $|zw| = ${ra} \\times ${rb} = ${ra * rb}$`]),
        P("Find $\\arg(zw)$.", 1, ans.dec((t1 + t2) / 10), [`Arguments add: $\\arg(zw) = ${num(th1)} + ${paren(th2)} = ${num((t1 + t2) / 10)}$`]),
        P(`Find $\\left|${q}\\right|$.`, 1, ans.dec(ra ** 3 / rb), [`$\\left|${q}\\right| = \\dfrac{${ra}^{3}}{${rb}} = ${num(ra ** 3 / rb)}$`]),
        P(`Find $\\arg\\left(${q}\\right)$.`, 1, ans.dec((3 * t1 - t2) / 10), [`A power multiplies the argument and a division subtracts: $\\arg\\left(${q}\\right) = 3${br(th1)} - ${paren(th2)} = ${num((3 * t1 - t2) / 10)}$`])] };
    } });
  const SIN2 = [{ q: "V", unit: "volts", what: "Two alternating voltages are added in a circuit. At time $t$ seconds the voltages, in volts, are", sum: "total voltage" },
    { q: "h", unit: "centimetres", what: "Two waves meet at a buoy. At time $t$ seconds the heights they would each give the water surface above its rest level, in centimetres, are", sum: "total height" },
    { q: "I", unit: "amps", what: "Two alternating currents meet at a junction. At time $t$ seconds the currents, in amps, are", sum: "total current" }];
  reg({ ...CP, unknown: "sum-sinusoids", representation: "words", levels: [4], skills: ["AI-AHL1.13.sum-sinusoids", "AI-AHL1.13.cartesian-to-polar"], title: "Add two sinusoids of equal frequency with complex numbers",
    build({ rng }) {
      const S = rng.pick(SIN2);
      let a, b, w, ph, X, Y, A, al, t;
      do { a = rng.int(3, 12); b = rng.int(3, 12); w = rng.int(2, 6); ph = rng.int(4, 14) / 10; X = a + b * Math.cos(ph); Y = b * Math.sin(ph); A = Math.hypot(X, Y); al = Math.atan2(Y, X); t = (Math.PI / 2 - al) / w; } while (a === b || edge(A) || edge(al) || edge(t));
      const wt = coef(w, "t"), q = S.q;
      return { params: { a, b, w, ph }, stem: `${S.what} $${q}_{1} = ${a}\\sin(${wt})$ and $${q}_{2} = ${b}\\sin(${wt} + ${num(ph)})$, with angles in radians. Their sum can be written as $${q} = A\\sin(${wt} + \\alpha)$, where $A > 0$ and $0 < \\alpha < \\dfrac{\\pi}{2}$.`, parts: [
        P("Find the value of $A$.", 3, ans.sf(A), [`$${q}_{1}$ is the imaginary part of $${a}\\mathrm{e}^{${wt}\\mathrm{i}}$ and $${q}_{2}$ is the imaginary part of $${b}\\mathrm{e}^{(${wt} + ${num(ph)})\\mathrm{i}}$.`,
          `Their sum is the imaginary part of $\\mathrm{e}^{${wt}\\mathrm{i}}\\left(${a} + ${b}\\mathrm{e}^{${num(ph)}\\mathrm{i}}\\right)$.`,
          `With technology, $${a} + ${b}\\mathrm{e}^{${num(ph)}\\mathrm{i}} = ${sf(X, 4)} + ${sf(Y, 4)}\\mathrm{i} = ${sf(A, 4)}\\mathrm{e}^{${sf(al, 4)}\\mathrm{i}}$`, `$A = ${sf(A)}$`]),
        P("Find the value of $\\alpha$.", 2, ans.sf(al), [`$\\alpha$ is the argument of $${sf(X, 4)} + ${sf(Y, 4)}\\mathrm{i}$.`, `$\\alpha = ${sf(al)}$`]),
        P(`Find the first time after $t = 0$ at which the ${S.sum} is greatest.`, 2, ans.sf(t), [`The sine is greatest when $${wt} + \\alpha = \\dfrac{\\pi}{2}$.`, `$t = \\dfrac{1}{${w}}\\left(\\dfrac{\\pi}{2} - ${sf(al, 4)}\\right) = ${sf(t)}\\text{ s}$`])] };
    } });
  reg({ ...CP, unknown: "rotation-stretch", levels: [4], skills: ["AI-AHL1.13.geometric-interpretation", "AI-AHL1.13.cartesian-to-polar", "AI-AHL1.13.multiply-divide-powers"], title: "Multiplication as a rotation with a stretch",
    build({ rng }) {
      let a, b, c, d, n, k, th, md;
      do { a = rng.nonzero(-3, 3); b = rng.int(1, 3); c = rng.nonzero(-5, 5); d = rng.nonzero(-5, 5); n = rng.int(3, 6); k = Math.hypot(a, b); th = Math.atan2(b, a); md = Math.pow(k, n) * Math.hypot(c, d); } while (Number.isInteger(k) || edge(k) || edge(th) || edge(md) || md > 9000);
      return { params: { a, b, c, d, n }, stem: `Let $w = ${cx(a, b)}$. On an Argand diagram, multiplying any complex number by $w$ rotates its point anticlockwise about the origin through an angle $\\theta$, where $0 < \\theta < \\pi$, and stretches its distance from the origin by a scale factor $k$.`, parts: [
        P("Find the value of $k$.", 2, ans.sf(k), [`The scale factor is the modulus of $w$: $k = \\sqrt{${paren(a)}^{2} + ${b}^{2}} = \\sqrt{${a * a + b * b}}$`, `$k = ${sf(k)}$`]),
        P("Find the value of $\\theta$, in radians.", 2, ans.sf(th), [`The angle of rotation is the argument of $w$.`, `With technology, $\\theta = \\arg(${cx(a, b)}) = ${sf(th)}$`]),
        P(`The point representing $z = ${cx(c, d)}$ is transformed in this way $${n}$ times. Find the distance of the final point from the origin.`, 2, ans.sf(md), [
          `The final point represents $w^{${n}}z$, and $|w^{${n}}z| = |w|^{${n}} \\times |z|$.`, `$|w^{${n}}z| = \\left(\\sqrt{${a * a + b * b}}\\right)^{${n}} \\times \\sqrt{${c * c + d * d}} = ${sf(md)}$`])] };
    } });

  // ======================= 1.14 matrices =======================
  const MA = { type: "t1-ai-matrix-algebra", syllabus: ["1.14"], representation: "equation", format: "value" };
  const rm2 = (rng, lo, hi) => [[rng.int(lo, hi), rng.int(lo, hi)], [rng.int(lo, hi), rng.int(lo, hi)]];
  const det2 = (M) => M[0][0] * M[1][1] - M[0][1] * M[1][0];
  const zeros = (M) => M.flat().filter((v) => v === 0).length;
  reg({ ...MA, unknown: "determinant", levels: [1], calculator: false, skills: ["AI-AHL1.14.determinant"], title: "Determinant of a two by two matrix",
    build({ rng }) {
      let A;
      do { A = rm2(rng, -7, 9); } while (zeros(A) > 0 || det2(A) === 0);
      return { params: { A }, stem: `Let $${B("A")} = ${mat(A)}$.`, parts: [
        P(`Find $\\det ${B("A")}$.`, 2, ans.int(det2(A)), [`$\\det ${B("A")} = ${br(A[0][0])}${br(A[1][1])} - ${br(A[0][1])}${br(A[1][0])}$`, `$= ${A[0][0] * A[1][1]} - ${paren(A[0][1] * A[1][0])} = ${det2(A)}$`])] };
    } });
  reg({ ...MA, unknown: "product-entries", levels: [2], calculator: false, skills: ["AI-AHL1.14.multiply"], title: "Entries of two matrix products",
    build({ rng }) {
      let A, C, AB, BA, i, j;
      do { A = rm2(rng, -5, 6); C = rm2(rng, -5, 6); AB = mul2(A, C); BA = mul2(C, A); i = rng.int(0, 1); j = rng.int(0, 1); } while (zeros(A) + zeros(C) > 1 || AB[i][j] === BA[i][j]);
      const where = `row $${i + 1}$ and column $${j + 1}$`;
      const line = (X, Y) => `$${br(X[i][0])}${br(Y[0][j])} + ${br(X[i][1])}${br(Y[1][j])} = ${X[i][0] * Y[0][j] + X[i][1] * Y[1][j]}$`;
      return { params: { A, B: C, i, j }, stem: `Let $${B("A")} = ${mat(A)}$ and $${B("B")} = ${mat(C)}$.`, parts: [
        P(`Find the entry in ${where} of $${B("AB")}$.`, 2, ans.int(AB[i][j]), [`Multiply row $${i + 1}$ of $${B("A")}$ by column $${j + 1}$ of $${B("B")}$.`, line(A, C)]),
        P(`Find the entry in ${where} of $${B("BA")}$.`, 2, ans.int(BA[i][j]), [`The order matters. Multiply row $${i + 1}$ of $${B("B")}$ by column $${j + 1}$ of $${B("A")}$.`, line(C, A)])] };
    } });
  reg({ ...MA, unknown: "inverse-entry", levels: [2], calculator: false, skills: ["AI-AHL1.14.inverse", "AI-AHL1.14.determinant"], title: "Determinant and inverse of a two by two matrix",
    build({ rng }) {
      let A, D, i, j;
      do { A = rm2(rng, -6, 8); D = det2(A); i = rng.int(0, 1); j = rng.int(0, 1); } while (zeros(A) > 0 || Math.abs(D) < 2 || Math.abs(D) > 40);
      const adj = [[A[1][1], -A[0][1]], [-A[1][0], A[0][0]]];
      return { params: { A, i, j }, stem: `Let $${B("A")} = ${mat(A)}$.`, parts: [
        P(`Find $\\det ${B("A")}$.`, 1, ans.int(D), [`$\\det ${B("A")} = ${br(A[0][0])}${br(A[1][1])} - ${br(A[0][1])}${br(A[1][0])} = ${D}$`]),
        P(`Find the exact value of the entry in row $${i + 1}$ and column $${j + 1}$ of $${B("A")}^{-1}$.`, 2, ans.frac(adj[i][j], D), [
          `Swap the entries on the leading diagonal, change the signs of the other two and divide by the determinant: $${B("A")}^{-1} = \\dfrac{1}{${D}}${mat(adj)}$`,
          `The entry is $\\dfrac{${adj[i][j]}}{${D}}${gcd(adj[i][j], D) > 1 || D < 0 ? ` = ${frac(adj[i][j], D)}` : ""}$.`])] };
    } });
  reg({ ...MA, unknown: "solve-with-inverse", levels: [3], skills: ["AI-AHL1.14.solve-with-inverse", "AI-AHL1.14.inverse", "AI-AHL1.14.determinant"], title: "Solve a pair of equations with an inverse matrix",
    build({ rng }) {
      let A, D, x, y;
      do { A = rm2(rng, -5, 7); D = det2(A); x = rng.nonzero(-6, 6); y = rng.nonzero(-6, 6); } while (zeros(A) > 0 || Math.abs(D) < 2 || Math.abs(D) > 30 || x === y);
      const b = [A[0][0] * x + A[0][1] * y, A[1][0] * x + A[1][1] * y], adj = [[A[1][1], -A[0][1]], [-A[1][0], A[0][0]]];
      const t = [adj[0][0] * b[0] + adj[0][1] * b[1], adj[1][0] * b[0] + adj[1][1] * b[1]];
      return { params: { A, b }, stem: `The equations $${expr([[A[0][0], "x"], [A[0][1], "y"]])} = ${b[0]}$ and $${expr([[A[1][0], "x"], [A[1][1], "y"]])} = ${b[1]}$ are written as $${B("A")}${col("x", "y")} = ${col(b[0], b[1])}$, where $${B("A")} = ${mat(A)}$.`, parts: [
        P(`Find $\\det ${B("A")}$.`, 1, ans.int(D), [`$\\det ${B("A")} = ${br(A[0][0])}${br(A[1][1])} - ${br(A[0][1])}${br(A[1][0])} = ${D}$`]),
        P("Use the inverse of the matrix to find the value of $x$.", 2, ans.int(x), [`$${B("A")}^{-1} = \\dfrac{1}{${D}}${mat(adj)}$`, `$${col("x", "y")} = ${B("A")}^{-1}${col(b[0], b[1])} = \\dfrac{1}{${D}}${col(t[0], t[1])}$`, `$x = \\dfrac{${t[0]}}{${D}} = ${x}$`]),
        P("Find the value of $y$.", 2, ans.int(y), [`From the second row, $y = \\dfrac{1}{${D}}\\left(${br(adj[1][0])}${br(b[0])} + ${br(adj[1][1])}${br(b[1])}\\right)$`, `$y = \\dfrac{${t[1]}}{${D}} = ${y}$`])] };
    } });
  const SYS3 = [
    { who: "A café sells coffee in three sizes: small, medium and large.", items: ["Small", "Medium", "Large"], row: "Day", rows: ["Monday", "Tuesday", "Wednesday"], total: "Takings (euros)", q: [8, 40], pr: [[30, 50], [50, 75], [70, 99]], v: ["s", "m", "l"], thing: (i) => `the price of a ${["small", "medium", "large"][i]} coffee`, sold: "The table shows how many of each size were sold on three days and the total takings each day." },
    { who: "A market stall sells cheese, olives and bread.", items: ["Cheese", "Olives", "Bread"], row: "Customer", rows: ["First", "Second", "Third"], total: "Cost (euros)", q: [1, 7], pr: [[45, 95], [20, 60], [15, 45]], v: ["c", "v", "b"], thing: (i) => `the price of one ${["piece of cheese", "tub of olives", "loaf of bread"][i]}`, sold: "The table shows how many of each item three customers bought and what each customer paid." },
  ];
  reg({ ...MA, unknown: "solve-system", representation: "table", levels: [4], skills: ["AI-AHL1.14.matrix-form", "AI-AHL1.14.solve-with-inverse", "AI-AHL1.14.determinant"], title: "Set up and solve three equations with a matrix",
    build({ rng }) {
      const S = rng.pick(SYS3);
      let A, x, D, b;
      do {
        A = [0, 1, 2].map(() => [0, 1, 2].map(() => rng.int(S.q[0], S.q[1])));
        x = S.pr.map(([lo, hi]) => rng.int(lo, hi) * 5 / 100);
        D = A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) - A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) + A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]);
        b = A.map((r) => r2(r[0] * x[0] + r[1] * x[1] + r[2] * x[2]));
      } while (Math.abs(D) < 20 || !(x[0] < x[1] || S.v[0] !== "s") || x.some((v) => Math.round(v * 10) === v * 10) || new Set(x).size < 3);
      const X = col(...S.v), bb = col(...b);
      return { params: { A, b }, stem: `${S.who} ${S.sold} The prices, in euros, satisfy $${B("A")}${X} = ${bb}$, where $${B("A")}$ is the matrix of the numbers in the table.`,
        table: { head: [S.row, ...S.items, S.total], rows: A.map((r, i) => [S.rows[i], ...r.map((v) => `$${v}$`), `$${num(b[i])}$`]) }, parts: [
          P(`Find $\\det ${B("A")}$.`, 1, ans.int(D), [`$${B("A")} = ${mat(A)}$`, `With technology, $\\det ${B("A")} = ${num(D)}$. It is not zero, so the prices can be found.`]),
          P(`Find ${S.thing(0)}, in euros.`, 2, ans.sf(x[0]), [`$${X} = ${B("A")}^{-1}${bb}$`, `With technology, $${X} = ${col(...x.map((v) => sf(v)))}$, so ${S.thing(0)} is $${sf(x[0])}$ euros.`]),
          P(`Find ${S.thing(1)}, in euros.`, 1, ans.sf(x[1]), [`From the same product, $${S.v[1]} = ${sf(x[1])}$.`]),
          P(`Find ${S.thing(2)}, in euros.`, 1, ans.sf(x[2]), [`From the same product, $${S.v[2]} = ${sf(x[2])}$.`])] };
    } });

  // ======================= 1.15 eigenvalues and eigenvectors =======================
  const EIG = { type: "t1-ai-eigen", syllabus: ["1.15"], representation: "equation", format: "value" };
  // A matrix with integer entries, eigenvalues l1 < l2 and eigenvectors (1, m1) and (1, m2).
  const eigSit = (rng) => {
    let l1, l2, m1, m2, t, M;
    do {
      m1 = rng.nonzero(-3, 3); m2 = rng.nonzero(-3, 3); t = rng.nonzero(-2, 2); l1 = rng.int(-5, 6); l2 = l1 + t * (m2 - m1);
      M = [[l1 - m1 * t, t], [-m1 * m2 * t, l2 + m1 * t]];
    } while (m1 === m2 || l2 <= l1 || l1 === 0 || l2 === 0 || l2 > 9 || M.flat().some((v) => v === 0 || Math.abs(v) > 12));
    return { l1, l2, m1, m2, M };
  };
  const charWork = (M) => [`$\\det(${B("M")} - \\lambda ${B("I")}) = (${expr([[M[0][0], ""], [-1, "\\lambda"]])})(${expr([[M[1][1], ""], [-1, "\\lambda"]])}) - ${br(M[0][1])}${br(M[1][0])}$`,
    `$= ${poly([1, -(M[0][0] + M[1][1]), det2(M)], "\\lambda")}$`];
  reg({ ...EIG, unknown: "verify-eigenvector", levels: [1], calculator: false, skills: ["AI-AHL1.15.verify-eigenvector"], situationKey: "eig", situation: eigSit, title: "The eigenvalue of a given eigenvector",
    build({ rng, sit: s }) {
      const big = rng.bool(), k = rng.pick([1, 1, 2, -1]), mm = big ? s.m2 : s.m1, lam = big ? s.l2 : s.l1, v = [k, k * mm], M = s.M;
      const Mv = [M[0][0] * v[0] + M[0][1] * v[1], M[1][0] * v[0] + M[1][1] * v[1]];
      return { params: { M, v }, stem: `Let $${B("M")} = ${mat(M)}$. The vector $${B("v")} = ${col(...v)}$ is an eigenvector of $${B("M")}$.`, parts: [
        P("Find the eigenvalue that corresponds to this eigenvector.", 2, ans.int(lam), [`$${B("Mv")} = ${mat(M)}${col(...v)} = ${col(...Mv)}$`, `$${col(...Mv)} = ${lam}${col(...v)}$, so the eigenvalue is $${lam}$.`])] };
    } });
  reg({ ...EIG, unknown: "eigenvalues", levels: [2], calculator: false, skills: ["AI-AHL1.15.characteristic-polynomial", "AI-AHL1.15.eigenvalues"], situationKey: "eig", situation: eigSit, title: "Characteristic polynomial and eigenvalues",
    build({ sit: s }) {
      const M = s.M, tr = M[0][0] + M[1][1], D = det2(M);
      return { params: { M }, stem: `Let $${B("M")} = ${mat(M)}$. The characteristic polynomial of $${B("M")}$ is $\\det(${B("M")} - \\lambda ${B("I")}) = \\lambda^{2} + b\\lambda + c$.`, parts: [
        P("Find the value of $b$.", 1, ans.int(-tr), [...charWork(M), `$b = ${-tr}$`]),
        P("Find the value of $c$.", 1, ans.int(D), [`From the expansion, $c = ${D}$.`]),
        P(`Find the smaller eigenvalue of $${B("M")}$.`, 1, ans.int(s.l1), [`$${poly([1, -tr, D], "\\lambda")} = 0$ gives $\\lambda = ${s.l1}$ or $\\lambda = ${s.l2}$. The smaller is $${s.l1}$.`]),
        P(`Find the larger eigenvalue of $${B("M")}$.`, 1, ans.int(s.l2), [`The larger is $\\lambda = ${s.l2}$.`])] };
    } });
  reg({ ...EIG, unknown: "eigenvectors", levels: [3], skills: ["AI-AHL1.15.eigenvalues", "AI-AHL1.15.eigenvectors", "AI-AHL1.15.diagonalise"], situationKey: "eig", situation: eigSit, title: "Eigenvalues and eigenvectors by hand",
    build({ sit: s }) {
      const M = s.M, tr = M[0][0] + M[1][1], D = det2(M);
      const vec = (lam, mm, name) => [`$(${expr([[1, B("M")], [-lam, B("I")]])})${col(1, name)} = ${col(0, 0)}$, and the first row gives $${expr([[M[0][0] - lam, ""], [M[0][1], name]])} = 0$.`, `$${name} = ${mm}$`];
      return { params: { M }, stem: `Let $${B("M")} = ${mat(M)}$. The eigenvalues of $${B("M")}$ are $\\lambda_{1}$ and $\\lambda_{2}$, where $\\lambda_{1} < \\lambda_{2}$.`, parts: [
        P("Find $\\lambda_{1}$.", 2, ans.int(s.l1), [...charWork(M), `$${poly([1, -tr, D], "\\lambda")} = 0$ gives $\\lambda = ${s.l1}$ or $\\lambda = ${s.l2}$, so $\\lambda_{1} = ${s.l1}$.`]),
        P("Find $\\lambda_{2}$.", 1, ans.int(s.l2), [`$\\lambda_{2} = ${s.l2}$`]),
        P(`An eigenvector for $\\lambda_{1}$ is $${col(1, "p")}$. Find the value of $p$.`, 2, ans.int(s.m1), vec(s.l1, s.m1, "p")),
        P(`An eigenvector for $\\lambda_{2}$ is $${col(1, "q")}$. Find the value of $q$.`, 2, ans.int(s.m2), [...vec(s.l2, s.m2, "q"),
          `So $${B("M")} = ${B("P")}${B("D")}${B("P")}^{-1}$ with $${B("P")} = ${mat([[1, 1], [s.m1, s.m2]])}$ and $${B("D")} = ${mat([[s.l1, 0], [0, s.l2]])}$.`])] };
    } });
  const MOVE = [{ a: "town $\\mathrm{A}$", b: "town $\\mathrm{B}$", who: "people", per: "year", live: "live in", u: "thousand people", stem: "Two towns, $\\mathrm{A}$ and $\\mathrm{B}$, exchange residents." },
    { a: "network $\\mathrm{A}$", b: "network $\\mathrm{B}$", who: "customers", per: "year", live: "are with", u: "thousand customers", stem: "Two phone networks, $\\mathrm{A}$ and $\\mathrm{B}$, share all the customers of a region." }];
  reg({ ...EIG, unknown: "long-term", representation: "words", levels: [4], skills: ["AI-AHL1.15.eigenvalues", "AI-AHL1.15.powers-by-diagonalisation", "AI-AHL1.15.long-term-limit"], title: "Movement between two places: eigenvalues and the long term",
    build({ rng }) {
      const S = rng.pick(MOVE);
      let a, b, A0, B0, n, s, lam, an, lim;
      do {
        a = rng.int(2, 15); b = rng.int(2, 15); A0 = rng.int(12, 60); B0 = rng.int(12, 60); n = rng.pick([4, 5, 6, 8, 10]);
        s = [A0, B0]; for (let i = 0; i < n; i++) s = [(1 - a / 100) * s[0] + (b / 100) * s[1], (a / 100) * s[0] + (1 - b / 100) * s[1]];
        lam = 1 - (a + b) / 100; an = s[0]; lim = ((A0 + B0) * b) / (a + b);
      } while (a === b || edge(an) || edge(lim) || Math.abs(lim - A0) < 3 || Number.isInteger(lim));
      const T = [[1 - a / 100, b / 100], [a / 100, 1 - b / 100]], Tm = mat(T);
      return { params: { a, b, A0, B0, n }, stem: `${S.stem} Each ${S.per}, $${pct(a)}$ of the ${S.who} who ${S.live} ${S.a} move to ${S.b} and $${pct(b)}$ of the ${S.who} who ${S.live} ${S.b} move to ${S.a}; nobody else joins or leaves. At the start, $${A0}$ ${S.u} ${S.live} ${S.a} and $${B0}$ ${S.u} ${S.live} ${S.b}. The change over one ${S.per} is described by the matrix $${B("T")} = ${Tm}$.`, parts: [
        P(`One eigenvalue of $${B("T")}$ is $1$. Find the other eigenvalue.`, 2, ans.dec(lam), [`$\\det(${B("T")} - \\lambda ${B("I")}) = (${num(T[0][0])} - \\lambda)(${num(T[1][1])} - \\lambda) - ${br(T[0][1])}${br(T[1][0])} = 0$`,
          `$\\lambda^{2} - ${num(T[0][0] + T[1][1])}\\lambda + ${num(lam)} = 0$, so $(\\lambda - 1)(\\lambda - ${num(lam)}) = 0$ and the other eigenvalue is $${num(lam)}$.`]),
        P(`Find how many ${S.u} ${S.live} ${S.a} after $${n}$ ${S.per}s.`, 2, ans.sf(an), [`The state after $${n}$ ${S.per}s is $${B("T")}^{${n}}${col(A0, B0)}$.`, `With technology this is $${col(sf(an, 4), sf(s[1], 4))}$, so the answer is $${sf(an)}$ ${S.u}.`]),
        P(`Find how many ${S.u} ${S.live} ${S.a} in the long term.`, 3, ans.sf(lim), [`$${B("T")}^{n} = ${B("P")}${B("D")}^{n}${B("P")}^{-1}$ and $${num(lam)}^{n}$ tends to $0$, so the populations settle at an eigenvector for the eigenvalue $1$.`,
          `A steady state $${col("x", "y")}$ has $${num(a / 100)}x = ${num(b / 100)}y$ and $x + y = ${A0 + B0}$.`, `$x = \\dfrac{${b}}{${a + b}} \\times ${A0 + B0} = ${sf(lim)}$ ${S.u}.`])] };
    } });

  // ======================= 2.7 composite and inverse functions in context =======================
  const CI = { type: "fn-ai-composite-inverse", syllabus: ["2.7"], representation: "words", format: "value" };
  reg({ ...CI, unknown: "composite-from-table", representation: "table", levels: [1], calculator: false, skills: ["AI-AHL2.7.composite-value"], title: "Composite functions from a table of values",
    build({ rng }) {
      let f, g, k;
      do { f = rng.shuffle([1, 2, 3, 4, 5]); g = rng.shuffle([1, 2, 3, 4, 5]); k = rng.int(1, 5); } while (f[g[k - 1] - 1] === g[f[k - 1] - 1] || f[k - 1] === k || g[k - 1] === k);
      const fg = f[g[k - 1] - 1], gf = g[f[k - 1] - 1], cells = (a) => a.map((v) => `$${v}$`);
      return { params: { k }, stem: "The table shows some values of the functions $f$ and $g$.", table: { head: ["$x$", ...cells([1, 2, 3, 4, 5])], rows: [["$f(x)$", ...cells(f)], ["$g(x)$", ...cells(g)]] }, parts: [
        P(`Find $(f \\circ g)(${k})$.`, 1, ans.int(fg), [`Work from the inside: $g(${k}) = ${g[k - 1]}$, then $f(${g[k - 1]}) = ${fg}$.`]),
        P(`Find $(g \\circ f)(${k})$.`, 1, ans.int(gf), [`$f(${k}) = ${f[k - 1]}$, then $g(${f[k - 1]}) = ${gf}$.`])] };
    } });
  reg({ ...CI, unknown: "composite-order", levels: [2], calculator: false, skills: ["AI-AHL2.7.composite-context", "AI-AHL2.7.composite-value"], title: "The order of a voucher and a discount",
    build({ rng }) {
      const c = rng.pick([5, 8, 10, 12, 15, 20]), d = rng.pick([10, 15, 20, 25, 30, 40]), price = rng.int(6, 24) * 10, k = 1 - d / 100;
      const fg = r2(k * price - c), gf = r2(k * (price - c)), item = rng.pick(["jacket", "pair of boots", "tent", "printer"]);
      return { params: { c, d, price }, stem: `A shop has two offers. A voucher takes $${c}$ euros off a price, $f(x) = ${lin(1, -c)}$, and a sale takes $${pct(d)}$ off a price, $g(x) = ${num(k)}x$, where $x$ is the price in euros. A ${item} has a price of $${price}$ euros.`, parts: [
        P(`Find $(f \\circ g)(${price})$.`, 1, ans.dec(fg), [`$g(${price}) = ${num(k)} \\times ${price} = ${num(k * price)}$, then $f(${num(k * price)}) = ${num(k * price)} - ${c} = ${num(fg)}$`]),
        P(`Find $(g \\circ f)(${price})$.`, 1, ans.dec(gf), [`$f(${price}) = ${price - c}$, then $g(${price - c}) = ${num(k)} \\times ${price - c} = ${num(gf)}$`]),
        P("A customer may use both offers, in either order. Find how many euros the customer saves by choosing the better order instead of the other one.", 2, ans.dec(r2(gf - fg)), [
          `$(f \\circ g)(x)$ applies the sale first and then the voucher; $(g \\circ f)(x)$ applies the voucher first, so the sale also reduces the voucher.`, `The saving is $${num(gf)} - ${num(fg)} = ${num(r2(gf - fg))}$ euros, from taking the sale first.`])] };
    } });
  const INVC = [{ f: "C", x: "d", story: (a, b) => `A taxi firm charges a fixed fee of $${num(b)}$ euros plus $${num(a)}$ euros per kilometre. The cost, in euros, of a journey of $d$ kilometres is $C(d) = ${num(b)} + ${num(a)}d$.`, right: "the length, in kilometres, of a journey that costs that many euros", wrong: ["the cost, in euros, of a journey of that many kilometres", "the cost per kilometre of the journey", "the fixed fee for a journey of that length"], a: [12, 28, 10], b: [25, 60, 10], v: [15, 60] },
    { f: "W", x: "t", story: (a, b) => `A tank holds $${num(b)}$ litres of water and is then filled at $${num(a)}$ litres per minute. The volume of water, in litres, after $t$ minutes is $W(t) = ${num(b)} + ${num(a)}t$.`, right: "the time, in minutes, at which the tank holds that many litres", wrong: ["the volume, in litres, after that many minutes", "the rate at which the tank fills", "the volume of water at the start"], a: [15, 85, 10], b: [20, 90, 1], v: [150, 600] }];
  reg({ ...CI, unknown: "inverse-linear", levels: [2], skills: ["AI-AHL2.7.find-inverse", "AI-AHL2.7.composite-context"], title: "Find and interpret the inverse of a linear model",
    build({ rng }) {
      const S = rng.pick(INVC);
      let a, b, v, x;
      do { a = rng.int(S.a[0], S.a[1]) / S.a[2]; b = rng.int(S.b[0], S.b[1]) / S.b[2]; v = rng.int(S.v[0], S.v[1]); x = (v - b) / a; } while (edge(x) || x < 2);
      return { params: { a, b, v }, stem: S.story(a, b), parts: [
        P(`Find $${S.f}^{-1}(${v})$.`, 2, ans.sf(x), [`Solve $${num(b)} + ${num(a)}${S.x} = ${v}$.`, `$${S.x} = \\dfrac{${v} - ${num(b)}}{${num(a)}} = ${sf(x)}$`]),
        P(`What does $${S.f}^{-1}(${v})$ represent?`, 1, ans.choice(rng, { text: S.right[0].toUpperCase() + S.right.slice(1), value: "input-for-output" }, S.wrong.map((t, i) => ({ text: t[0].toUpperCase() + t.slice(1), value: "wrong" + i, why: i === 0 ? "The inverse function takes an output of the model back to its input." : undefined }))), [
          `The inverse undoes the model: it takes a value of $${S.f}$ and returns the value of $${S.x}$ that gives it.`, `So it is ${S.right}.`])] };
    } });
  reg({ ...CI, unknown: "inverse-restricted", representation: "equation", levels: [4], skills: ["AI-AHL2.7.find-inverse", "AI-AHL2.7.inverse-domain-range"], title: "Restrict a quadratic so that it has an inverse",
    build({ rng }) {
      let a, h, k, v, x;
      do { a = rng.pick([1, 1, 2, 0.5]); h = rng.int(2, 15) / 2; k = rng.int(-12, 20) / (a === 0.5 ? 1 : 2); v = Math.ceil(k) + rng.int(3, 30); x = h + Math.sqrt((v - k) / a); } while (edge(x) || Number.isInteger(Math.sqrt((v - k) / a) * 2) || !Number.isInteger(a * h * h * 4 + k * 4));
      const bb = -2 * a * h, c = a * h * h + k;
      return { params: { a, b: bb, c, v }, stem: `Let $f(x) = ${expr([[a, "x^{2}"], [bb, "x"], [c, ""]])}$ for $x \\ge p$.`, parts: [
        P("Find the least value of $p$ for which $f$ has an inverse function.", 2, ans.dec(h), [`$f$ must be one-to-one, so the domain must start at the vertex of the parabola.`, `The vertex is at $x = -\\dfrac{${num(bb)}}{2${br(a)}} = ${num(h)}$, so $p = ${num(h)}$.`]),
        P(`For this value of $p$, the domain of $f^{-1}$ is $x \\ge q$. Find the value of $q$.`, 2, ans.dec(k), [`The domain of $f^{-1}$ is the range of $f$.`, `The least value of $f$ is $f(${num(h)}) = ${num(k)}$, so $q = ${num(k)}$.`]),
        P(`Find $f^{-1}(${v})$.`, 2, ans.sf(x), [`Solve $${expr([[a, "x^{2}"], [bb, "x"], [c, ""]])} = ${v}$ with technology: $x = ${sf(2 * h - x)}$ or $x = ${sf(x)}$.`, `Only the solution with $x \\ge ${num(h)}$ is in the domain of $f$, so $f^{-1}(${v}) = ${sf(x)}$.`])] };
    } });
  const SPREAD = [{ what: "An oil spill spreads as a circle on calm water.", r: "radius of the circle, in metres,", tu: "minutes", au: "\\text{m}^{2}", ru: "m", after: "after the spill starts" },
    { what: "A circular ripple spreads across a pond.", r: "radius of the ripple, in centimetres,", tu: "seconds", au: "\\text{cm}^{2}", ru: "cm", after: "after a stone lands" },
    { what: "A colony of bacteria grows as a circle on a dish.", r: "radius of the colony, in millimetres,", tu: "hours", au: "\\text{mm}^{2}", ru: "mm", after: "after the dish is prepared" }];
  reg({ ...CI, unknown: "composite-model", levels: [4], skills: ["AI-AHL2.7.composite-context", "AI-AHL2.7.composite-equation", "AI-AHL2.7.find-inverse"], title: "A composite model for a spreading circle",
    build({ rng }) {
      const S = rng.pick(SPREAD);
      let k, t1, S2, R, A1, t2, t3;
      do { k = rng.int(12, 58) / 10; t1 = rng.int(3, 30); R = rng.int(8, 30); A1 = Math.PI * k * k * t1; S2 = Number(sf(A1 * rng.pick([1.7, 2.4, 3.1, 0.4]), 2)); t2 = S2 / (Math.PI * k * k); t3 = (R / k) ** 2; } while (edge(A1) || edge(t2) || edge(t3) || Number.isInteger(t3));
      return { params: { k, t1, S2, R }, stem: `${S.what} The ${S.r} $t$ ${S.tu} ${S.after} is $r(t) = ${num(k)}\\sqrt{t}$, and the area of a circle of radius $x$ is $A(x) = \\pi x^{2}$.`, parts: [
        P(`Find $(A \\circ r)(${t1})$.`, 2, ans.sf(A1), [`$r(${t1}) = ${num(k)}\\sqrt{${t1}} = ${sf(k * Math.sqrt(t1), 4)}$`, `$A(${sf(k * Math.sqrt(t1), 4)}) = \\pi \\times ${sf(k * Math.sqrt(t1), 4)}^{2} = ${sf(A1)}$, the area in $${S.au}$ after $${t1}$ ${S.tu}.`]),
        P(`Find the value of $t$ for which $(A \\circ r)(t) = ${num(S2)}$.`, 3, ans.sf(t2), [`$(A \\circ r)(t) = \\pi\\left(${num(k)}\\sqrt{t}\\right)^{2} = ${sf(Math.PI * k * k, 5)}t$`, `$${sf(Math.PI * k * k, 5)}t = ${num(S2)}$`, `$t = ${sf(t2)}$`]),
        P(`Find $r^{-1}(${R})$.`, 2, ans.sf(t3), [`Solve $${num(k)}\\sqrt{t} = ${R}$: $\\sqrt{t} = \\dfrac{${R}}{${num(k)}}$`, `$t = \\left(\\dfrac{${R}}{${num(k)}}\\right)^{2} = ${sf(t3)}$, the time in ${S.tu} at which the radius is $${unit(R, S.ru)}$.`])] };
    } });

  // ======================= 2.9 further models =======================
  const FM = { type: "fn-ai-further-models", syllabus: ["2.9"], representation: "words", format: "value" };
  reg({ ...FM, unknown: "half-life", levels: [1], skills: ["AI-AHL2.9.half-life"], title: "Half-life or doubling time of an exponential model",
    build({ rng }) {
      const decay = rng.bool();
      let k, N0, T;
      do { k = rng.int(12, 350) / 1000; N0 = rng.int(4, 90) * 10; T = Math.log(2) / k; } while (edge(T));
      const ex = `\\mathrm{e}^{${decay ? "-" : ""}${num(k)}t}`;
      return { params: { k, N0, decay }, stem: decay ? `The mass $M$, in grams, of a radioactive sample after $t$ days is modelled by $M = ${N0}${ex}$.` : `The number $N$ of bacteria in a culture after $t$ hours is modelled by $N = ${N0}${ex}$.`, parts: [
        P(decay ? "Find the half-life of the sample, in days." : "Find the time, in hours, that the number of bacteria takes to double.", 2, ans.sf(T), [
          decay ? `The mass halves when $${ex} = \\dfrac{1}{2}$.` : `The number doubles when $${ex} = 2$.`, `$t = \\dfrac{\\ln 2}{${num(k)}} = ${sf(T)}$`])] };
    } });
  const LOGM = [{ story: (f) => `The height $h$, in metres, of a tree $t$ years after it was planted is modelled by $${f}$, for $t \\ge 1$.`, y: "h", x: "t", a: [8, 30, 10], b: [15, 45, 10], x1: [4, 25], qa: (x) => `Find the height of the tree $${x}$ years after it was planted.`, qb: (y) => `Find the number of years after planting at which the tree is $${unit(y, "m")}$ tall.`, mult: [1.3, 1.6] },
    { story: (f) => `The score $s$ that a learner gets on a typing test after $n$ hours of practice is modelled by $${f}$, for $n \\ge 1$.`, y: "s", x: "n", a: [18, 35, 1], b: [60, 140, 10], x1: [5, 40], qa: (x) => `Find the score predicted after $${x}$ hours of practice.`, qb: (y) => `Find the number of hours of practice after which the model predicts a score of $${num(y)}$.`, mult: [1.15, 1.3] }];
  reg({ ...FM, unknown: "log-model", levels: [2], skills: ["AI-AHL2.9.log-model"], title: "Use a natural logarithmic model",
    build({ rng }) {
      const S = rng.pick(LOGM);
      let a, b, x1, y1, y2, x2;
      do { a = rng.int(S.a[0], S.a[1]) / S.a[2]; b = rng.int(S.b[0], S.b[1]) / S.b[2]; x1 = rng.int(S.x1[0], S.x1[1]); y1 = a + b * Math.log(x1); y2 = Number(sf(y1 * rng.pick(S.mult), 2)); x2 = Math.exp((y2 - a) / b); } while (edge(y1) || edge(x2) || x2 > 400);
      const f = `${S.y} = ${num(a)} + ${num(b)}\\ln ${S.x}`;
      return { params: { a, b, x1, y2 }, stem: S.story(f), parts: [
        P(S.qa(x1), 2, ans.sf(y1), [`$${S.y} = ${num(a)} + ${num(b)}\\ln ${x1}$`, `$${S.y} = ${sf(y1)}$`]),
        P(S.qb(y2), 2, ans.sf(x2), [`$${num(y2)} = ${num(a)} + ${num(b)}\\ln ${S.x}$, so $\\ln ${S.x} = \\dfrac{${num(y2)} - ${num(a)}}{${num(b)}} = ${sf((y2 - a) / b, 4)}$`, `$${S.x} = \\mathrm{e}^{${sf((y2 - a) / b, 4)}} = ${sf(x2)}$`])] };
    } });
  reg({ ...FM, unknown: "piecewise-join", representation: "equation", levels: [2], calculator: false, skills: ["AI-AHL2.9.piecewise-join", "AI-AHL2.9.piecewise-model"], title: "Make the pieces of a piecewise model join",
    build({ rng }) {
      const a = rng.pick([1, 2, 3]), b = rng.int(1, 9), c = rng.int(2, 5), mm = rng.int(2, 6), k = a * c * c + b + mm * c, x2 = c + rng.int(1, 3), v = k - mm * x2;
      return { params: { a, b, c, m: mm, x2 }, stem: `A model is defined by $f(x) = \\begin{cases} ${poly([a, 0, b])}, & 0 \\le x \\le ${c} \\\\ k - ${coef(mm, "x")}, & x > ${c} \\end{cases}$ where $k$ is a constant. The two pieces of the graph of $f$ join at $x = ${c}$.`, parts: [
        P("Find the value of $k$.", 2, ans.int(k), [`At $x = ${c}$ the two pieces give the same value: $${a === 1 ? "" : a}${br(c)}^{2} + ${b} = k - ${mm}${br(c)}$`, `$${a * c * c + b} = k - ${mm * c}$, so $k = ${k}$.`]),
        P(`Find $f(${x2})$.`, 1, ans.int(v), [`$${x2} > ${c}$, so use the second piece: $f(${x2}) = ${k} - ${mm}${br(x2)} = ${v}$`])] };
    } });
  const LGS = [{ story: "The number $P$ of fish in a new lake $t$ years after it is stocked", unit: "fish", tu: "years", L: [40, 250, 10], thing: "the number of fish" },
    { story: "The number $P$ of people in a town who have heard a rumour $t$ days after it starts", unit: "people", tu: "days", L: [50, 900, 10], thing: "the number of people who have heard it" },
    { story: "The number $P$ of phones infected by a virus $t$ hours after it is released", unit: "phones", tu: "hours", L: [20, 400, 100], thing: "the number of infected phones" }];
  reg({ ...FM, unknown: "logistic", levels: [4], skills: ["AI-AHL2.9.logistic-model", "AI-AHL2.9.carrying-capacity"], title: "A logistic model: start, limit and time to reach a value",
    build({ rng }) {
      const S = rng.pick(LGS);
      let L, C, k, P0, target, t, frac8;
      do { L = rng.int(S.L[0], S.L[1]) * S.L[2]; C = rng.int(6, 60); k = rng.int(15, 95) / 100; frac8 = rng.pick([0.5, 0.6, 0.75, 0.8, 0.9]); target = L * frac8; P0 = L / (1 + C); t = Math.log((C * target) / (L - target)) / k; } while (edge(P0) || edge(t) || !Number.isInteger(target));
      const f = `P = \\dfrac{${num(L)}}{1 + ${C}\\mathrm{e}^{-${num(k)}t}}`;
      return { params: { L, C, k, target }, stem: `${S.story} is modelled by $${f}$.`, parts: [
        P(`Find the value of $P$ when $t = 0$.`, 2, ans.sf(P0), [`$\\mathrm{e}^{0} = 1$, so $P = \\dfrac{${num(L)}}{1 + ${C}}$`, `$P = ${sf(P0)}$`]),
        P(`Write down the value that ${S.thing} approaches in the long term.`, 1, ans.int(L), [`As $t$ increases, $\\mathrm{e}^{-${num(k)}t}$ tends to $0$, so $P$ tends to $\\dfrac{${num(L)}}{1 + 0} = ${num(L)}$, the carrying capacity.`]),
        P(`Find the value of $t$ at which $P = ${num(target)}$.`, 3, ans.sf(t), [`$1 + ${C}\\mathrm{e}^{-${num(k)}t} = \\dfrac{${num(L)}}{${num(target)}}$, so $\\mathrm{e}^{-${num(k)}t} = ${sf((L / target - 1) / C, 4)}$`,
          `$-${num(k)}t = \\ln(${sf((L / target - 1) / C, 4)})$`, `$t = ${sf(t)}$ ${S.tu} (or solve with the graph on technology).`])] };
    } });
  reg({ ...FM, unknown: "sinusoidal", levels: [4], skills: ["AI-AHL2.9.sinusoidal-phase"], title: "Build and use a sinusoidal model in radians",
    build({ rng }) {
      let M, lo, T, c, t1, a, d, b, v;
      do { M = rng.int(45, 120) / 10; lo = rng.int(5, 30) / 10; T = rng.pick([12, 12.4, 12.5, 11.8]); c = rng.int(10, 55) / 10; t1 = rng.int(6, 22); a = r2((M - lo) / 2); d = r2((M + lo) / 2); b = (2 * Math.PI) / T; v = a * Math.sin(b * (t1 - c)) + d; } while (M - lo < 2.1 || edge(v) || edge(b));
      return { params: { M, lo, T, c, t1 }, stem: `The depth of water in a harbour, $D$ metres, at $t$ hours after midnight is modelled by $D = a\\sin(b(t - ${num(c)})) + d$, where $a$, $b$ and $d$ are positive constants and the angle is in radians. The greatest depth is $${unit(M, "m")}$, the least depth is $${unit(lo, "m")}$, and the time between one high tide and the next is $${num(T)}$ hours.`, parts: [
        P("Find the value of $a$.", 1, ans.dec(a), [`The amplitude is half the difference between the greatest and least depths: $a = \\dfrac{${num(M)} - ${num(lo)}}{2} = ${num(a)}$`]),
        P("Find the value of $d$.", 1, ans.dec(d), [`The principal axis is half way between them: $d = \\dfrac{${num(M)} + ${num(lo)}}{2} = ${num(d)}$`]),
        P("Find the value of $b$.", 2, ans.sf(b), [`The period is $\\dfrac{2\\pi}{b} = ${num(T)}$.`, `$b = \\dfrac{2\\pi}{${num(T)}} = ${sf(b)}$`]),
        P(`Find the depth of the water at $t = ${t1}$.`, 2, ans.sf(v), [`$D = ${num(a)}\\sin\\left(\\dfrac{2\\pi}{${num(T)}}(${t1} - ${num(c)})\\right) + ${num(d)}$`, `$D = ${sf(v)}\\text{ m}$`])] };
    } });

  // ======================= 2.10 logarithmic scales and linearising data =======================
  const LIN = { type: "fn-ai-linearise", syllabus: ["2.10"], representation: "equation", format: "value" };
  reg({ ...LIN, unknown: "choose-plot", format: "mcq", levels: [1], skills: ["AI-AHL2.10.choose-plot", "AI-AHL2.10.linear-form"], title: "Choose the plot that makes a model linear",
    build({ rng }) {
      const kind = rng.int(0, 2), a = rng.int(12, 95) / 10, b = rng.sign() * rng.int(12, 48) / (kind === 0 ? 100 : 10);
      const model = kind === 0 ? `y = ${num(a)}\\mathrm{e}^{${num(b)}x}` : kind === 1 ? `y = ${num(a)}x^{${num(b)}}` : `y = ${num(a)} ${signed(b)}\\ln x`;
      const opts = [{ text: "$\\ln y$ against $x$", value: "lny-x" }, { text: "$\\ln y$ against $\\ln x$", value: "lny-lnx" }, { text: "$y$ against $\\ln x$", value: "y-lnx" }, { text: "$y$ against $x$", value: "y-x", why: "The model is not linear in $x$ and $y$ themselves; logarithms are needed." }];
      const lines = [`Take logarithms: $\\ln y = \\ln ${num(a)} ${signed(b)}x$, which is linear in $x$.`, `Take logarithms: $\\ln y = \\ln ${num(a)} ${signed(b)}\\ln x$, which is linear in $\\ln x$.`, `The model is already linear in $\\ln x$.`];
      return { params: { kind, a, b }, stem: `Two variables are related by $${model}$, where $x > 0$${kind === 2 ? "" : " and $y > 0$"}.`, parts: [
        P("Which graph is a straight line?", 1, ans.choice(rng, opts[kind], opts.filter((_, i) => i !== kind)), [lines[kind], `So the graph of ${opts[kind].text} is a straight line.`]),
        P("Write down the gradient of this straight line.", 1, ans.dec(b), [`The gradient is the coefficient of ${kind === 0 ? "$x$" : "$\\ln x$"} in the linear form: $${num(b)}$`])] };
    } });
  reg({ ...LIN, unknown: "line-to-model", levels: [2], skills: ["AI-AHL2.10.line-to-model", "AI-AHL2.10.predict-from-line"], title: "Turn a line for logarithmic data into a model",
    build({ rng }) {
      const power = rng.bool();
      let mm, c, x1, A, y1;
      do { mm = rng.sign() * rng.int(12, 290) / (power ? 100 : 1000); c = rng.int(5, 45) / 10; x1 = power ? rng.int(3, 40) : rng.int(4, 30); A = Math.exp(c); y1 = power ? A * Math.pow(x1, mm) : A * Math.exp(mm * x1); } while (edge(A) || edge(y1) || y1 < 0.01 || y1 > 99000 || Number.isInteger(c) || Math.abs(mm) === 1);
      const X = power ? "\\ln x" : "x", line = `\\ln y = ${num(mm)}${X} + ${num(c)}`;
      return { params: { power, m: mm, c, x1 }, stem: `A set of data is linearised. The line of best fit for the transformed data is $${line}$, so the original data can be modelled by $${power ? "y = ax^{b}" : "y = a\\mathrm{e}^{bx}"}$.`, parts: [
        P("Find the value of $a$.", 2, ans.sf(A), [power ? `$y = \\mathrm{e}^{${num(mm)}\\ln x + ${num(c)}} = \\mathrm{e}^{${num(c)}} \\times x^{${num(mm)}}$` : `$y = \\mathrm{e}^{${num(mm)}x + ${num(c)}} = \\mathrm{e}^{${num(c)}} \\times \\mathrm{e}^{${num(mm)}x}$`, `$a = \\mathrm{e}^{${num(c)}} = ${sf(A)}$ and $b = ${num(mm)}$`]),
        P(`Find the value of $y$ that the model predicts when $x = ${x1}$.`, 2, ans.sf(y1), [`$\\ln y = ${num(mm)}${power ? `\\ln ${x1}` : br(x1)} + ${num(c)} = ${sf(mm * (power ? Math.log(x1) : x1) + c, 4)}$`, `$y = \\mathrm{e}^{${sf(mm * (power ? Math.log(x1) : x1) + c, 4)}} = ${sf(y1)}$`])] };
    } });
  reg({ ...LIN, unknown: "log-scale", representation: "words", levels: [2], skills: ["AI-AHL2.10.log-scale"], title: "Compare two values on a logarithmic scale",
    build({ rng }) {
      let c, e, p1, p2, pH, ratio;
      do { c = rng.int(11, 95) / 10; e = rng.int(3, 9); p1 = rng.int(22, 68) / 10; p2 = p1 + rng.int(4, 38) / 10; pH = e - Math.log10(c); ratio = Math.pow(10, p2 - p1); } while (edge(pH) || edge(ratio) || Number.isInteger(r1(p2 - p1)));
      const liquids = rng.sample(["lemon juice", "vinegar", "black coffee", "rain water", "tomato juice", "milk"], 2);
      return { params: { c, e, p1, p2: r1(p2) }, stem: `The acidity of a liquid is measured by its pH, where $\\text{pH} = -\\log_{10} C$ and $C$ is the concentration of hydrogen ions in moles per litre.`, parts: [
        P(`Find the pH of a liquid for which $C = ${num(c)} \\times 10^{${-e}}$.`, 2, ans.sf(pH), [`$\\text{pH} = -\\log_{10}\\left(${num(c)} \\times 10^{${-e}}\\right)$`, `$\\text{pH} = ${sf(pH)}$`]),
        P(`A sample of ${liquids[0]} has a pH of $${num(p1)}$ and a sample of ${liquids[1]} has a pH of $${num(r1(p2))}$. Find how many times greater the concentration of hydrogen ions is in the ${liquids[0]} than in the ${liquids[1]}.`, 2, ans.sf(ratio), [
          `$C = 10^{-\\text{pH}}$, so the ratio is $\\dfrac{10^{-${num(p1)}}}{10^{-${num(r1(p2))}}} = 10^{${num(r1(p2))} - ${num(p1)}}$`, `$10^{${num(r1(p2 - p1))}} = ${sf(ratio)}$`])] };
    } });
  const REGR = [{ power: true, x: "d", y: "T", xs: [[2, 4, 7, 11, 16, 24], [1.5, 3, 5, 8, 12, 20]], story: "An astronomer records the distance $d$, in millions of kilometres, of six moons from their planet and the time $T$, in days, each takes to complete one orbit.", b: [130, 170], a: [4, 30] },
    { power: true, x: "m", y: "R", xs: [[2, 5, 12, 30, 70, 150], [3, 8, 20, 45, 100, 240]], story: "A biologist records the body mass $m$, in kilograms, and the resting energy use $R$, in watts, of six mammals.", b: [62, 82], a: [25, 45] },
    { power: false, x: "t", y: "N", xs: [[0, 2, 4, 6, 8, 10], [1, 3, 5, 7, 9, 11]], story: "A scientist records the number $N$, in thousands, of bacteria in a culture $t$ hours after an experiment starts.", b: [18, 42], a: [12, 60] }];
  reg({ ...LIN, unknown: "regression", representation: "table", levels: [4], skills: ["AI-AHL2.10.transform-data", "AI-AHL2.10.line-to-model", "AI-AHL2.10.predict-from-line"], title: "Linearise data and fit a power or exponential model",
    build({ rng }) {
      const S = rng.pick(REGR);
      let xs, ys, bb, cc, a, x0, y0;
      do {
        xs = rng.pick(S.xs); const b0 = rng.int(S.b[0], S.b[1]) / 100, a0 = rng.int(S.a[0], S.a[1]) / 10;
        ys = xs.map((x) => Number(sf((S.power ? a0 * Math.pow(x, b0) : a0 * Math.exp(b0 * x)) * (1 + rng.int(-7, 7) / 100), 3)));
        const X = xs.map((x) => (S.power ? Math.log(x) : x)), Y = ys.map(Math.log), n = X.length, sx = X.reduce((s, v) => s + v, 0), sy = Y.reduce((s, v) => s + v, 0);
        const sxy = X.reduce((s, v, i) => s + v * Y[i], 0), sxx = X.reduce((s, v) => s + v * v, 0);
        bb = (n * sxy - sx * sy) / (n * sxx - sx * sx); cc = (sy - bb * sx) / n; a = Math.exp(cc);
        x0 = S.power ? Math.round((xs[2] + xs[3]) / 2) + 1 : xs[5] + rng.int(1, 3); y0 = S.power ? a * Math.pow(x0, bb) : a * Math.exp(bb * x0);
      } while (edge(bb) || edge(cc) || edge(a) || edge(y0) || xs.includes(x0));
      const X = S.power ? `\\ln ${S.x}` : S.x, model = S.power ? `${S.y} = a${S.x}^{b}` : `${S.y} = a\\mathrm{e}^{b${S.x}}`;
      return { params: { power: S.power, xs, ys, x0 }, stem: `${S.story} The results are in the table. To fit the model $${model}$, the least squares regression line of $\\ln ${S.y}$ on $${X}$ is found, in the form $\\ln ${S.y} = b${S.power ? `\\ln ${S.x}` : S.x} + c$.`,
        table: { head: [`$${S.x}$`, ...xs.map((v) => `$${num(v)}$`)], rows: [[`$${S.y}$`, ...ys.map((v) => `$${num(v)}$`)]] }, parts: [
          P("Find the value of $b$.", 2, ans.sf(bb), [`Enter the values of $${X}$ and $\\ln ${S.y}$ in two lists${S.power ? `, for example $\\ln ${num(xs[0])} = ${sf(Math.log(xs[0]), 4)}$ and $\\ln ${num(ys[0])} = ${sf(Math.log(ys[0]), 4)}$` : `, for example $\\ln ${num(ys[0])} = ${sf(Math.log(ys[0]), 4)}$`}.`, `Linear regression on technology gives the gradient $b = ${sf(bb)}$.`]),
          P("Find the value of $c$.", 1, ans.sf(cc), [`The same regression gives the intercept $c = ${sf(cc)}$.`]),
          P("Find the value of $a$.", 1, ans.sf(a), [`$\\ln a = c$, so $a = \\mathrm{e}^{${sf(cc, 4)}} = ${sf(a)}$`]),
          P(`Use the model to estimate $${S.y}$ when $${S.x} = ${x0}$.`, 2, ans.sf(y0), [S.power ? `$${S.y} = ${sf(a, 4)} \\times ${x0}^{${sf(bb, 4)}}$` : `$${S.y} = ${sf(a, 4)}\\mathrm{e}^{${sf(bb, 4)} \\times ${x0}}$`, `$${S.y} = ${sf(y0)}$`])] };
    } });

  // ======================= 3.7 radian measure =======================
  const RAD = { type: "t3-ai-radian-measure", syllabus: ["3.7"], representation: "equation", format: "value" };
  const SIZES = [[420, 320], [320, 240], [260, 200]];
  const figOk = (g) => SIZES.every(([width, height]) => E.graph.figureInfo(g, { width, height }).problems.length === 0);
  const pol = (r, a) => [r * Math.cos((a * Math.PI) / 180), r * Math.sin((a * Math.PI) / 180)];
  reg({ ...RAD, unknown: "convert", levels: [1], skills: ["AI-AHL3.7.convert"], title: "Convert between degrees and radians",
    build({ rng }) {
      const toRad = rng.bool();
      let d, r, v;
      do { d = rng.int(11, 355); r = rng.int(3, 62) / 10; v = toRad ? (d * Math.PI) / 180 : (r * 180) / Math.PI; } while (edge(v) || d % 15 === 0);
      return { params: { toRad, d, r }, stem: toRad ? `An angle measures $${deg(d)}$.` : `An angle measures $${num(r)}$ radians.`, parts: [
        P(`Find the size of the angle in ${toRad ? "radians" : "degrees"}.`, 2, ans.sf(v), toRad ? [`$${deg(180)}$ is $\\pi$ radians, so multiply by $\\dfrac{\\pi}{180}$.`, `$${d} \\times \\dfrac{\\pi}{180} = ${sf(v)}$`]
          : [`$\\pi$ radians is $${deg(180)}$, so multiply by $\\dfrac{180}{\\pi}$.`, `$${num(r)} \\times \\dfrac{180}{\\pi} = ${deg(sf(v))}$`])] };
    } });
  const sectorFig = (r, th) => { const dg = (th * 180) / Math.PI; return { alt: "A sector of a circle with centre O, its radius and its angle marked", shapes: [{ type: "sector", centre: [0, 0], radius: r, from: 0, to: dg },
    { type: "line", from: [0, 0], to: [r, 0], label: `${num(r)} cm` }, { type: "angle", at: [0, 0], from: [r, 0], to: pol(r, dg), label: `${num(th)}` },
    { type: "point", at: [0, 0], label: "O" }, { type: "point", at: [r, 0], label: "A", dot: false }, { type: "point", at: pol(r, dg), label: "B", dot: false }] }; };
  reg({ ...RAD, unknown: "arc-sector", representation: "diagram", levels: [2], skills: ["AI-AHL3.7.arc-length", "AI-AHL3.7.sector-area"], title: "Arc length and area of a sector",
    build({ rng }) {
      let r, th, g;
      do { r = rng.int(30, 150) / 10; th = rng.int(5, 28) / 10; g = sectorFig(r, th); } while (edge(r * th) || edge((r * r * th) / 2) || !figOk(g));
      const arc = r * th, area = (r * r * th) / 2;
      return { params: { r, th }, graph: g, stem: `The diagram shows a sector $\\mathrm{OAB}$ of a circle with centre $\\mathrm{O}$ and radius $${unit(r, "cm")}$. The angle $\\mathrm{A\\hat{O}B}$ is $${num(th)}$ radians.`, parts: [
        P("Find the length of the arc $\\mathrm{AB}$.", 2, ans.sf(arc), [`$l = r\\theta = ${num(r)} \\times ${num(th)}$`, `$l = ${sf(arc)}\\text{ cm}$`]),
        P("Find the area of the sector.", 2, ans.sf(area), [`$A = \\dfrac{1}{2}r^{2}\\theta = \\dfrac{1}{2} \\times ${num(r)}^{2} \\times ${num(th)}$`, `$A = ${sf(area)}\\text{ cm}^{2}$`])] };
    } });
  reg({ ...RAD, unknown: "sector-exact", levels: [3], skills: ["AI-AHL3.7.arc-length", "AI-AHL3.7.sector-area", "AI-AHL3.7.convert"], title: "A sector with an angle that is a fraction of pi",
    build({ rng }) {
      const [p, q] = rng.pick([[1, 3], [2, 3], [1, 4], [3, 4], [1, 6], [5, 6], [2, 5], [3, 5], [4, 3], [5, 4]]), r = q * rng.int(1, 4) * (q % 2 ? 2 : 1), th = (p * Math.PI) / q;
      const arc = r * th, area = (r * r * th) / 2, { piFrac } = fmt;
      return { params: { r, p, q }, stem: `A sector of a circle has radius $${unit(r, "cm")}$ and angle $${piFrac(p, q)}$ radians at the centre.`, parts: [
        P("Find the exact length of the arc of the sector, in centimetres.", 2, ans.exact(arc, piFrac(r * p, q)), [`$l = r\\theta = ${r} \\times ${piFrac(p, q)}$`, `$l = ${piFrac(r * p, q)}$`]),
        P("Find the exact perimeter of the sector, in centimetres.", 1, ans.exact(2 * r + arc, `${2 * r} + ${piFrac(r * p, q)}`), [`The perimeter is two radii and the arc: $${r} + ${r} + ${piFrac(r * p, q)} = ${2 * r} + ${piFrac(r * p, q)}$`]),
        P("Find the exact area of the sector, in $\\text{cm}^{2}$.", 2, ans.exact(area, piFrac(r * r * p, 2 * q)), [`$A = \\dfrac{1}{2}r^{2}\\theta = \\dfrac{1}{2} \\times ${r}^{2} \\times ${piFrac(p, q)}$`, `$A = ${piFrac(r * r * p, 2 * q)}$`])] };
    } });
  const segFig = (r, th) => { const h = (th * 90) / Math.PI, A = pol(r, 90 + h), Bp = pol(r, 90 - h); return { alt: "A circle with centre O, radii OA and OB, the chord AB and the segment it cuts off shaded", shapes: [{ type: "circle", centre: [0, 0], radius: r },
    { type: "segment", centre: [0, 0], radius: r, from: 90 - h, to: 90 + h, fill: true }, { type: "line", from: [0, 0], to: A, label: `${num(r)} m` }, { type: "line", from: [0, 0], to: Bp }, { type: "line", from: A, to: Bp },
    { type: "angle", at: [0, 0], from: Bp, to: A, label: `${num(th)}` }, { type: "point", at: [0, 0], label: "O" }, { type: "point", at: A, label: "A", dot: false }, { type: "point", at: Bp, label: "B", dot: false }] }; };
  reg({ ...RAD, unknown: "segment", representation: "diagram", levels: [4], skills: ["AI-AHL3.7.composite-region", "AI-AHL3.7.sector-area"], title: "Chord, sector and segment of a circle",
    build({ rng }) {
      const S = rng.pick([{ what: "a circular pond", part: "The shaded segment is covered by water lilies." }, { what: "a circular lawn", part: "The shaded segment is planted with flowers." }, { what: "a circular window", part: "The shaded segment is made of coloured glass." }]);
      let r, th, g, chord, sec, seg;
      do { r = rng.int(20, 120) / 10; th = rng.int(8, 26) / 10; g = segFig(r, th); chord = 2 * r * Math.sin(th / 2); sec = (r * r * th) / 2; seg = (r * r * (th - Math.sin(th))) / 2; } while (edge(chord) || edge(sec) || edge(seg) || !figOk(g));
      return { params: { r, th }, graph: g, stem: `The diagram shows ${S.what} with centre $\\mathrm{O}$ and radius $${unit(r, "m")}$. The points $\\mathrm{A}$ and $\\mathrm{B}$ are on the circle and angle $\\mathrm{A\\hat{O}B}$ is $${num(th)}$ radians. ${S.part}`, parts: [
        P("Find the length of the chord $\\mathrm{AB}$.", 2, ans.sf(chord), [`Cosine rule in triangle $\\mathrm{OAB}$: $\\mathrm{AB}^{2} = ${num(r)}^{2} + ${num(r)}^{2} - 2 \\times ${num(r)} \\times ${num(r)} \\times \\cos(${num(th)})$`, `$\\mathrm{AB} = ${sf(chord)}\\text{ m}$`]),
        P("Find the area of the sector $\\mathrm{OAB}$.", 2, ans.sf(sec), [`$\\dfrac{1}{2}r^{2}\\theta = \\dfrac{1}{2} \\times ${num(r)}^{2} \\times ${num(th)}$`, `$= ${sf(sec)}\\text{ m}^{2}$`]),
        P("Find the area of the shaded segment.", 3, ans.sf(seg), [`Area of triangle $\\mathrm{OAB}$: $\\dfrac{1}{2} \\times ${num(r)}^{2} \\times \\sin(${num(th)}) = ${sf((r * r * Math.sin(th)) / 2, 4)}$`,
          `Segment $=$ sector $-$ triangle $= ${sf(sec, 4)} - ${sf((r * r * Math.sin(th)) / 2, 4)}$`, `$= ${sf(seg)}\\text{ m}^{2}$`])] };
    } });
  reg({ ...RAD, unknown: "angular-rate", representation: "words", levels: [2], skills: ["AI-AHL3.7.angular-rate", "AI-AHL3.7.arc-length"], title: "Angle turned and distance moved at a steady rate of rotation",
    build({ rng }) {
      let N, t, r, ang, dist;
      do { N = rng.int(8, 24); t = rng.int(2, 9); r = rng.int(20, 60); ang = (2 * Math.PI * N * t) / 60; dist = r * ang; } while (edge(ang) || edge(dist));
      return { params: { N, t, r }, stem: `The blades of a wind turbine turn at a steady rate of $${N}$ complete revolutions per minute. Each blade is $${unit(r, "m")}$ long.`, parts: [
        P(`Find the angle, in radians, through which a blade turns in $${t}$ seconds.`, 2, ans.sf(ang), [`In one second a blade turns $\\dfrac{${N} \\times 2\\pi}{60}$ radians.`, `In $${t}$ seconds: $\\dfrac{${N} \\times 2\\pi}{60} \\times ${t} = ${sf(ang)}$`]),
        P(`Find the distance that the tip of a blade moves in this time.`, 2, ans.sf(dist), [`The tip moves along an arc: $l = r\\theta = ${r} \\times ${sf(ang, 4)}$`, `$l = ${sf(dist)}\\text{ m}$`])] };
    } });

  // ======================= 3.8 unit circle, identity, ambiguous case, trig equations =======================
  const UC = { type: "t3-ai-unit-circle", syllabus: ["3.8"], representation: "equation", format: "value" };
  const pythSit = (rng) => {
    let given, s, other;
    do { given = rng.pick(["sin", "cos"]); s = rng.int(15, 95) / 100; other = -Math.sqrt(1 - s * s); } while (edge(other) || edge(given === "sin" ? s / other : other / s) || Number.isInteger(other * 100));
    return { given, s, other };
  };
  const pythStem = (s) => (s.given === "sin" ? `The angle $\\theta$ satisfies $\\sin\\theta = ${num(s.s)}$ and $\\dfrac{\\pi}{2} < \\theta < \\pi$.` : `The angle $\\theta$ satisfies $\\cos\\theta = ${num(s.s)}$ and $\\dfrac{3\\pi}{2} < \\theta < 2\\pi$.`);
  const pythWork = (s) => { const [g, o] = s.given === "sin" ? ["\\sin", "\\cos"] : ["\\cos", "\\sin"]; return [`$${o}^{2}\\theta = 1 - ${g}^{2}\\theta = 1 - ${num(s.s)}^{2} = ${num(1 - s.s * s.s)}$`,
    `$\\theta$ is in the ${s.given === "sin" ? "second" : "fourth"} quadrant, where $${o}\\theta$ is negative, so $${o}\\theta = -\\sqrt{${num(1 - s.s * s.s)}} = ${sf(s.other)}$`]; };
  reg({ ...UC, unknown: "pythagorean-identity", levels: [1], skills: ["AI-AHL3.8.pythagorean-identity"], situationKey: "pyth", situation: pythSit, title: "Use the Pythagorean identity in a given quadrant",
    build({ sit: s }) {
      return { params: s, stem: pythStem(s), parts: [P(`Find the value of $${s.given === "sin" ? "\\cos" : "\\sin"}\\theta$.`, 2, ans.sf(s.other), pythWork(s))] };
    } });
  reg({ ...UC, unknown: "identity-and-tan", levels: [2], skills: ["AI-AHL3.8.pythagorean-identity", "AI-AHL3.8.tan-quotient"], situationKey: "pyth", situation: pythSit, title: "Find the other two trigonometric ratios of an angle",
    build({ sit: s }) {
      const sin = s.given === "sin" ? s.s : s.other, cos = s.given === "sin" ? s.other : s.s, tn = sin / cos;
      return { params: s, stem: pythStem(s), parts: [P(`Find the value of $${s.given === "sin" ? "\\cos" : "\\sin"}\\theta$.`, 2, ans.sf(s.other), pythWork(s)),
        P("Find the value of $\\tan\\theta$.", 2, ans.sf(tn), [`$\\tan\\theta = \\dfrac{\\sin\\theta}{\\cos\\theta} = \\dfrac{${sf(sin, 4)}}{${sf(cos, 4)}}$`, `$\\tan\\theta = ${sf(tn)}$`])] };
    } });
  const ambSit = (rng) => {
    let c, al, a, C1, C2, B2, AC, area;
    do {
      c = rng.int(8, 20); al = rng.int(20, 55); const lo = c * Math.sin((al * Math.PI) / 180); a = r1(lo + (c - lo) * rng.int(25, 80) / 100);
      C1 = (Math.asin(lo / a) * 180) / Math.PI; C2 = 180 - C1; B2 = 180 - al - C2; AC = (a * Math.sin((B2 * Math.PI) / 180)) / Math.sin((al * Math.PI) / 180); area = 0.5 * c * AC * Math.sin((al * Math.PI) / 180);
    } while (a >= c - 0.3 || C1 > 82 || C1 < al + 4 || B2 < 10 || edge(C1) || edge(C2) || edge(AC) || edge(area));
    return { c, al, a, C1, C2, B2, AC, area };
  };
  const ambStem = (s) => `In triangle $\\mathrm{ABC}$, $\\mathrm{AB} = ${unit(s.c, "cm")}$, $\\mathrm{BC} = ${unit(s.a, "cm")}$ and angle $\\mathrm{B\\hat{A}C} = ${deg(s.al)}$. Two different triangles fit this information.`;
  const ambWork = (s) => [`Sine rule: $\\dfrac{\\sin C}{${s.c}} = \\dfrac{\\sin ${deg(s.al)}}{${num(s.a)}}$, so $\\sin C = ${sf((s.c * Math.sin((s.al * Math.PI) / 180)) / s.a, 4)}$`, `The acute solution is $C = ${deg(sf(s.C1))}$.`];
  reg({ ...UC, unknown: "ambiguous-angles", representation: "words", levels: [2], skills: ["AI-AHL3.8.ambiguous-case"], situationKey: "amb", situation: ambSit, title: "The two angles of the ambiguous case",
    build({ sit: s }) {
      return { params: { c: s.c, al: s.al, a: s.a }, stem: ambStem(s), parts: [
        P("Find the size of angle $\\mathrm{A\\hat{C}B}$ in the triangle where it is acute.", 2, ans.sf(s.C1), ambWork(s)),
        P("Find the size of angle $\\mathrm{A\\hat{C}B}$ in the triangle where it is obtuse.", 2, ans.sf(s.C2), [`$\\sin(${deg(180)} - C) = \\sin C$, so the other solution is $${deg(180)} - ${deg(sf(s.C1, 4))}$.`, `$C = ${deg(sf(s.C2))}$, which is possible because $${deg(sf(s.C2))} + ${deg(s.al)} < ${deg(180)}$.`])] };
    } });
  reg({ ...UC, unknown: "ambiguous-triangle", representation: "words", levels: [4], skills: ["AI-AHL3.8.ambiguous-case"], situationKey: "amb", situation: ambSit, title: "Solve the obtuse triangle of the ambiguous case",
    build({ sit: s }) {
      return { params: { c: s.c, al: s.al, a: s.a }, stem: ambStem(s), parts: [
        P("Find the size of angle $\\mathrm{A\\hat{C}B}$ in the triangle where it is acute.", 2, ans.sf(s.C1), ambWork(s)),
        P("Write down the size of angle $\\mathrm{A\\hat{C}B}$ in the other triangle.", 1, ans.sf(s.C2), [`$${deg(180)} - ${deg(sf(s.C1, 4))} = ${deg(sf(s.C2))}$`]),
        P("For the triangle in which angle $\\mathrm{A\\hat{C}B}$ is obtuse, find the length of $\\mathrm{AC}$.", 2, ans.sf(s.AC), [`Angle $\\mathrm{A\\hat{B}C} = ${deg(180)} - ${deg(s.al)} - ${deg(sf(s.C2, 4))} = ${deg(sf(s.B2, 4))}$`,
          `$\\dfrac{\\mathrm{AC}}{\\sin ${deg(sf(s.B2, 4))}} = \\dfrac{${num(s.a)}}{\\sin ${deg(s.al)}}$, so $\\mathrm{AC} = ${sf(s.AC)}\\text{ cm}$`]),
        P("Find the area of this triangle.", 2, ans.sf(s.area), [`Area $= \\dfrac{1}{2} \\times \\mathrm{AB} \\times \\mathrm{AC} \\times \\sin A = \\dfrac{1}{2} \\times ${s.c} \\times ${sf(s.AC, 4)} \\times \\sin ${deg(s.al)}$`, `$= ${sf(s.area)}\\text{ cm}^{2}$`])] };
    } });
  reg({ ...UC, unknown: "solve-trig-equation", representation: "graph", levels: [4], skills: ["AI-AHL3.8.solve-trig-equation"], title: "Solve a trigonometric equation graphically on an interval",
    build({ rng }) {
      let a, b, d, k, X, sols;
      do {
        a = rng.int(2, 5); b = rng.pick([0.5, 1, 1.5, 2, 3]); d = rng.int(-2, 3); k = d + (rng.sign() * rng.int(2, 9) * a) / 10; X = rng.int(5, 10);
        const base = Math.asin((k - d) / a); sols = [];
        for (let n = -3; n <= 12; n++) for (const x of [(base + 2 * Math.PI * n) / b, (Math.PI - base + 2 * Math.PI * n) / b]) if (x >= 0 && x <= X) sols.push(x);
        sols.sort((p, q) => p - q);
      } while (sols.length < 2 || sols.length > 6 || sols[0] < 0.08 || X - sols[sols.length - 1] < 0.08 || sols.some(edge) || sols.some((x) => Math.abs(x - X) < 0.08));
      const f = `${a}\\sin(${coef(b, "x")}) ${signed(d)}`.trim(), n = sols.length;
      return { params: { a, b, d, k, X }, graph: { x: [0, X], y: [d - a - 1, d + a + 1], xStep: 1, yStep: 1, functions: [{ fn: { type: "trig", name: "sin", a, b, c: 0, d }, label: "f" }, { fn: { type: "poly", coeffs: [k] }, dashed: true }], alt: "The graph of a sine function and a horizontal dashed line" },
        stem: `Let $f(x) = ${f}$ for $0 \\le x \\le ${X}$, where $x$ is in radians. The diagram shows the graph of $f$ and the line $y = ${num(k)}$.`, parts: [
          P(`Write down the number of solutions of $f(x) = ${num(k)}$ in this interval.`, 1, ans.int(n), [`The graph of $f$ crosses the line $y = ${num(k)}$ at $${n}$ points for $0 \\le x \\le ${X}$.`]),
          P("Find the smallest solution.", 2, ans.sf(sols[0]), [`Use technology to find where the two graphs intersect.`, `The first intersection is at $x = ${sf(sols[0])}$.`]),
          P("Find the largest solution.", 2, ans.sf(sols[n - 1]), [`The intersections are at $x = ${sols.map((x) => sf(x)).join(",\\, ")}$.`, `The largest is $x = ${sf(sols[n - 1])}$.`])] };
    } });

  // ======================= 3.9 matrix transformations =======================
  const MT = { type: "t3-ai-matrix-transformations", syllabus: ["3.9"], representation: "equation", format: "value" };
  const STD = (k) => [{ key: "refx", name: "a reflection in the $x$-axis", M: [[1, 0], [0, -1]] }, { key: "refy", name: "a reflection in the $y$-axis", M: [[-1, 0], [0, 1]] },
    { key: "refyx", name: "a reflection in the line $y = x$", M: [[0, 1], [1, 0]] }, { key: "refynx", name: "a reflection in the line $y = -x$", M: [[0, -1], [-1, 0]] },
    { key: "rot90", name: `a rotation of $${deg(90)}$ anticlockwise about the origin`, M: [[0, -1], [1, 0]] }, { key: "rot270", name: `a rotation of $${deg(90)}$ clockwise about the origin`, M: [[0, 1], [-1, 0]] },
    { key: "rot180", name: `a rotation of $${deg(180)}$ about the origin`, M: [[-1, 0], [0, -1]] }, { key: "enl", name: `an enlargement with scale factor $${k}$ and centre the origin`, M: [[k, 0], [0, k]] },
    { key: "hstr", name: `a horizontal stretch with scale factor $${k}$`, M: [[k, 0], [0, 1]] }, { key: "vstr", name: `a vertical stretch with scale factor $${k}$`, M: [[1, 0], [0, k]] }];
  reg({ ...MT, unknown: "identify-matrix", format: "mcq", levels: [1], calculator: false, skills: ["AI-AHL3.9.write-matrix"], title: "Choose the matrix of a standard transformation",
    build({ rng }) {
      const k = rng.int(2, 5), all = STD(k), t = rng.pick(all), wrong = rng.shuffle(all.filter((o) => o.key !== t.key)).slice(0, 3);
      return { params: { key: t.key, k }, stem: `A transformation of the plane is ${t.name}.`, parts: [
        P("Which matrix represents this transformation?", 1, ans.choice(rng, { text: `$${mat(t.M)}$`, value: t.M }, wrong.map((o) => ({ text: `$${mat(o.M)}$`, value: o.M, why: `This matrix represents ${o.name}.` }))), [
          `The columns of the matrix are the images of $${col(1, 0)}$ and $${col(0, 1)}$.`, `Here $${col(1, 0)}$ maps to $${col(t.M[0][0], t.M[1][0])}$ and $${col(0, 1)}$ maps to $${col(t.M[0][1], t.M[1][1])}$, so the matrix is $${mat(t.M)}$.`])] };
    } });
  reg({ ...MT, unknown: "area-scale-factor", levels: [1], calculator: false, skills: ["AI-AHL3.9.area-scale-factor"], title: "Area of an image from the determinant",
    build({ rng }) {
      let M, S;
      do { M = rm2(rng, -4, 5); S = rng.int(2, 12); } while (zeros(M) > 1 || Math.abs(det2(M)) < 2 || Math.abs(det2(M)) > 20);
      const D = det2(M);
      return { params: { M, S }, stem: `A triangle has an area of $${S}\\text{ cm}^{2}$. The triangle is transformed by the matrix $${mat(M)}$.`, parts: [
        P("Find the area of the image of the triangle, in $\\text{cm}^{2}$.", 2, ans.int(Math.abs(D) * S), [`The determinant is $${br(M[0][0])}${br(M[1][1])} - ${br(M[0][1])}${br(M[1][0])} = ${D}$.`, `The area scale factor is $|${D}| = ${Math.abs(D)}$, so the area is $${Math.abs(D)} \\times ${S} = ${Math.abs(D) * S}\\text{ cm}^{2}$.`])] };
    } });
  reg({ ...MT, unknown: "image-affine", levels: [2], calculator: false, skills: ["AI-AHL3.9.image-under-transformation", "AI-AHL3.9.area-scale-factor"], title: "Image of a point and of an area under a matrix and a translation",
    build({ rng }) {
      let M, bv, p, S;
      do { M = rm2(rng, -3, 4); bv = [rng.nonzero(-6, 6), rng.nonzero(-6, 6)]; p = [rng.nonzero(-5, 5), rng.nonzero(-5, 5)]; S = rng.int(3, 9); } while (zeros(M) > 1 || Math.abs(det2(M)) < 2);
      const im = [M[0][0] * p[0] + M[0][1] * p[1] + bv[0], M[1][0] * p[0] + M[1][1] * p[1] + bv[1]], D = det2(M);
      return { params: { M, b: bv, p, S }, stem: `A transformation $T$ maps the point with position vector $${B("x")}$ to the point with position vector $${B("A")}${B("x")} + ${B("b")}$, where $${B("A")} = ${mat(M)}$ and $${B("b")} = ${col(...bv)}$. The point $\\mathrm{C}$ is $${point(...p)}$.`, parts: [
        P("Find the $x$-coordinate of the image of $\\mathrm{C}$.", 1, ans.int(im[0]), [`$${mat(M)}${col(...p)} + ${col(...bv)} = ${col(M[0][0] * p[0] + M[0][1] * p[1], M[1][0] * p[0] + M[1][1] * p[1])} + ${col(...bv)} = ${col(...im)}$`, `The $x$-coordinate is $${im[0]}$.`]),
        P("Find the $y$-coordinate of the image of $\\mathrm{C}$.", 1, ans.int(im[1]), [`From the same product, the $y$-coordinate is $${im[1]}$.`]),
        P(`A shape of area $${S}$ square units is transformed by $T$. Find the area of its image.`, 2, ans.int(Math.abs(D) * S), [`$\\det ${B("A")} = ${D}$; the translation does not change the area.`, `Area $= |${D}| \\times ${S} = ${Math.abs(D) * S}$ square units.`])] };
    } });
  reg({ ...MT, unknown: "compose-standard", representation: "words", levels: [2], calculator: false, skills: ["AI-AHL3.9.compose-transformations", "AI-AHL3.9.write-matrix"], title: "Two transformations one after the other",
    build({ rng }) {
      const k = rng.int(2, 4), all = STD(k);
      let t1, t2, p, M, im;
      do { [t1, t2] = rng.sample(all, 2); p = [rng.nonzero(-6, 6), rng.nonzero(-6, 6)]; M = mul2(t2.M, t1.M); const other = mul2(t1.M, t2.M); im = [M[0][0] * p[0] + M[0][1] * p[1], M[1][0] * p[0] + M[1][1] * p[1]]; if (JSON.stringify(other) === JSON.stringify(M)) im = null; } while (!im || Math.abs(p[0]) === Math.abs(p[1]));
      return { params: { k1: t1.key, k2: t2.key, k, p }, stem: `The transformation $T$ is ${t1.name}, followed by ${t2.name}. The point $\\mathrm{C}$ is $${point(...p)}$.`, parts: [
        P("Find the $x$-coordinate of the image of $\\mathrm{C}$ under $T$.", 2, ans.int(im[0]), [`The matrix of the second transformation goes on the left: $${mat(t2.M)}${mat(t1.M)} = ${mat(M)}$`, `$${mat(M)}${col(...p)} = ${col(...im)}$, so the $x$-coordinate is $${im[0]}$.`]),
        P("Find the $y$-coordinate of the image of $\\mathrm{C}$ under $T$.", 2, ans.int(im[1]), [`From $${col(...im)}$, the $y$-coordinate is $${im[1]}$.`])] };
    } });
  reg({ ...MT, unknown: "rotate-enlarge", representation: "words", levels: [4], skills: ["AI-AHL3.9.write-matrix", "AI-AHL3.9.compose-transformations", "AI-AHL3.9.image-under-transformation", "AI-AHL3.9.area-scale-factor"], title: "A rotation followed by an enlargement",
    build({ rng }) {
      let th, k, p, S, m11, im, area;
      do { th = rng.int(4, 34) * 5; k = rng.pick([1.5, 2, 2.5, 3, 0.5, 1.2]); p = [rng.nonzero(-8, 8), rng.nonzero(-8, 8)]; S = rng.int(4, 20); const c = Math.cos((th * Math.PI) / 180), s = Math.sin((th * Math.PI) / 180);
        m11 = k * c; im = [k * (c * p[0] - s * p[1]), k * (s * p[0] + c * p[1])]; area = k * k * S; } while (th % 45 === 0 || th % 30 === 0 || edge(m11) || edge(im[0]) || edge(im[1]) || Math.abs(im[0]) < 0.1 || Math.abs(im[1]) < 0.1);
      const c = Math.cos((th * Math.PI) / 180), s = Math.sin((th * Math.PI) / 180), R = `\\begin{pmatrix} \\cos ${deg(th)} & -\\sin ${deg(th)} \\\\ \\sin ${deg(th)} & \\cos ${deg(th)} \\end{pmatrix}`;
      return { params: { th, k, p, S }, stem: `A design program rotates a shape anticlockwise about the origin through $${deg(th)}$ and then enlarges it with scale factor $${num(k)}$ and centre the origin. The combined transformation is represented by the matrix $${B("M")}$. One vertex of the shape is $\\mathrm{C}${point(...p)}$ and the shape has an area of $${S}$ square units.`.replace("\\mathrm{C}(", "\\mathrm{C}\\,("), parts: [
        P(`Find the entry in the first row and first column of $${B("M")}$.`, 2, ans.sf(m11), [`$${B("M")} = ${num(k)}${R}$`, `The entry is $${num(k)}\\cos ${deg(th)} = ${sf(m11)}$.`]),
        P("Find the $x$-coordinate of the image of $\\mathrm{C}$.", 2, ans.sf(im[0]), [`$${B("M")} = ${mat([[sf(k * c, 4), sf(-k * s, 4)], [sf(k * s, 4), sf(k * c, 4)]])}$`, `$${B("M")}${col(...p)} = ${col(sf(im[0]), sf(im[1]))}$, so the $x$-coordinate is $${sf(im[0])}$.`]),
        P("Find the $y$-coordinate of the image of $\\mathrm{C}$.", 1, ans.sf(im[1]), [`From the same product, the $y$-coordinate is $${sf(im[1])}$.`]),
        P("Find the area of the image of the shape.", 2, ans.dec(area), [`A rotation keeps areas; the enlargement multiplies them by $${num(k)}^{2}$, which is $\\det ${B("M")}$.`, `Area $= ${num(k * k)} \\times ${S} = ${num(area)}$ square units.`])] };
    } });
  reg({ ...MT, unknown: "fixed-point", levels: [4], skills: ["AI-AHL3.9.fixed-point", "AI-AHL3.9.work-back-from-images"], title: "Work back from an image and find the fixed point",
    build({ rng }) {
      let M, bv, Q, D, D1, pre, fx;
      do {
        M = rm2(rng, -3, 4); bv = [rng.nonzero(-7, 7), rng.nonzero(-7, 7)]; Q = [rng.nonzero(-9, 9), rng.nonzero(-9, 9)]; D = det2(M);
        const N = [[M[0][0] - 1, M[0][1]], [M[1][0], M[1][1] - 1]]; D1 = det2(N);
        if (D !== 0 && D1 !== 0) { const u = [Q[0] - bv[0], Q[1] - bv[1]]; pre = [(M[1][1] * u[0] - M[0][1] * u[1]) / D, (M[0][0] * u[1] - M[1][0] * u[0]) / D]; fx = [(-N[1][1] * bv[0] + N[0][1] * bv[1]) / D1, (-N[0][0] * bv[1] + N[1][0] * bv[0]) / D1]; }
      } while (zeros(M) > 0 || Math.abs(D) < 2 || Math.abs(D1) < 2 || [...pre, ...fx].every((v) => Math.abs(v - Number(v.toPrecision(2))) < 1e-9) || [...pre, ...fx].some((v) => v === 0 || edge(v)));
      return { params: { M, b: bv, Q }, stem: `A transformation $T$ maps the point with position vector $${B("x")}$ to the point with position vector $${B("A")}${B("x")} + ${B("b")}$, where $${B("A")} = ${mat(M)}$ and $${B("b")} = ${col(...bv)}$. The image of a point $\\mathrm{C}$ under $T$ is $${point(...Q)}$, and the point $\\mathrm{F}$ is its own image under $T$.`, parts: [
        P("Find the $x$-coordinate of $\\mathrm{C}$.", 2, ans.sf(pre[0]), [`$${B("A")}${B("x")} + ${B("b")} = ${col(...Q)}$, so $${B("x")} = ${B("A")}^{-1}\\left(${col(...Q)} - ${col(...bv)}\\right) = ${B("A")}^{-1}${col(Q[0] - bv[0], Q[1] - bv[1])}$`, `With technology, $${B("x")} = ${col(sf(pre[0]), sf(pre[1]))}$, so the $x$-coordinate is $${sf(pre[0])}$.`]),
        P("Find the $y$-coordinate of $\\mathrm{C}$.", 1, ans.sf(pre[1]), [`From the same product, the $y$-coordinate is $${sf(pre[1])}$.`]),
        P("Find the $x$-coordinate of $\\mathrm{F}$.", 2, ans.sf(fx[0]), [`$${B("A")}${B("x")} + ${B("b")} = ${B("x")}$, so $(${B("A")} - ${B("I")})${B("x")} = -${B("b")}$`, `$${B("x")} = ${mat([[M[0][0] - 1, M[0][1]], [M[1][0], M[1][1] - 1]])}^{-1}${col(-bv[0], -bv[1])} = ${col(sf(fx[0]), sf(fx[1]))}$, so the $x$-coordinate is $${sf(fx[0])}$.`]),
        P("Find the $y$-coordinate of $\\mathrm{F}$.", 1, ans.sf(fx[1]), [`From the same product, the $y$-coordinate is $${sf(fx[1])}$.`])] };
    } });

  // ======================= 3.10 vectors =======================
  const VB = { type: "t3-ai-vector-basics", syllabus: ["3.10"], representation: "equation", format: "value" };
  const v3 = (rng, lo, hi) => [rng.int(lo, hi), rng.int(lo, hi), rng.int(lo, hi)];
  const sub = (a, b) => a.map((v, i) => v - b[i]), dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0), len = (a) => Math.sqrt(dot(a, a));
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const sq = (v) => v.map((x) => `${paren(x)}^{2}`).join(" + ");
  const AB = "\\overrightarrow{\\mathrm{AB}}", AC = "\\overrightarrow{\\mathrm{AC}}";
  reg({ ...VB, unknown: "magnitude", levels: [1], skills: ["AI-AHL3.10.magnitude"], title: "Magnitude of a vector",
    build({ rng }) {
      let v;
      do { v = v3(rng, -9, 9); } while (v.filter((x) => x === 0).length > 0 || Number.isInteger(len(v)) || edge(len(v)));
      return { params: { v }, stem: `Let $${B("v")} = ${col(...v)}$.`, parts: [P(`Find $|${B("v")}|$.`, 2, ans.sf(len(v)), [`$|${B("v")}| = \\sqrt{${sq(v)}} = \\sqrt{${dot(v, v)}}$`, `$|${B("v")}| = ${sf(len(v))}$`])] };
    } });
  reg({ ...VB, unknown: "displacement-distance", levels: [2], skills: ["AI-AHL3.10.displacement-vector", "AI-AHL3.10.magnitude", "AI-AHL3.10.unit-vector"], title: "Displacement, distance and a unit vector",
    build({ rng }) {
      let a, b, d, L;
      do { a = v3(rng, -8, 9); b = v3(rng, -8, 9); d = sub(b, a); L = len(d); } while (d.some((x) => x === 0) || Number.isInteger(L) || edge(L) || edge(d[0] / L) || a.concat(b).filter((x) => x === 0).length > 1);
      return { params: { a, b }, stem: `The points $\\mathrm{A}$ and $\\mathrm{B}$ have position vectors $${B("a")} = ${col(...a)}$ and $${B("b")} = ${col(...b)}$.`, parts: [
        P(`Find the first component of $${AB}$.`, 1, ans.int(d[0]), [`$${AB} = ${B("b")} - ${B("a")} = ${col(...d)}$, so the first component is $${d[0]}$.`]),
        P("Find the distance $\\mathrm{AB}$.", 2, ans.sf(L), [`$|${AB}| = \\sqrt{${sq(d)}} = \\sqrt{${dot(d, d)}}$`, `$\\mathrm{AB} = ${sf(L)}$`]),
        P(`Find the first component of the unit vector in the direction of $${AB}$.`, 1, ans.sf(d[0] / L), [`The unit vector is $\\dfrac{1}{\\sqrt{${dot(d, d)}}}${col(...d)}$, with first component $\\dfrac{${d[0]}}{\\sqrt{${dot(d, d)}}} = ${sf(d[0] / L)}$.`])] };
    } });
  const TRIPLES = [[1, 2, 2], [2, 3, 6], [1, 4, 8], [4, 4, 7], [2, 6, 9], [6, 6, 7], [3, 4, 12], [2, 10, 11], [1, 2, 2], [2, 3, 6]];
  reg({ ...VB, unknown: "parallel-scaled", levels: [3], skills: ["AI-AHL3.10.magnitude", "AI-AHL3.10.parallel-vectors", "AI-AHL3.10.unit-vector"], title: "Parallel vectors and a vector of given magnitude",
    build({ rng }) {
      let v, k, M, L;
      do { v = rng.shuffle(rng.pick(TRIPLES)).map((x) => x * rng.sign()); L = Math.round(len(v)); k = rng.pick([-3, -2, 2, 3, 4]); M = rng.int(2, 6) * rng.pick([L, 1, 2, 5]); } while (Math.abs(v[0] * k) > 30 || M === L);
      const w0 = k * v[0], q = rat.Q(M * v[0], L);
      return { params: { v, w0, M }, stem: `Let $${B("v")} = ${col(...v)}$. The vector $${B("w")} = ${col(w0, "p", "q")}$ is parallel to $${B("v")}$.`, parts: [
        P(`Find $|${B("v")}|$.`, 2, ans.int(L), [`$|${B("v")}| = \\sqrt{${sq(v)}} = \\sqrt{${L * L}}$`, `$|${B("v")}| = ${L}$`]),
        P("Find the value of $p$.", 1, ans.int(k * v[1]), [`Parallel vectors are multiples of each other, and $${w0} = ${k}${br(v[0])}$, so $${B("w")} = ${k}${B("v")}$.`, `$p = ${k}${br(v[1])} = ${k * v[1]}$`]),
        P("Find the value of $q$.", 1, ans.int(k * v[2]), [`$q = ${k}${br(v[2])} = ${k * v[2]}$`]),
        P(`The vector $${B("u")}$ has magnitude $${M}$ and the same direction as $${B("v")}$. Find the first component of $${B("u")}$.`, 2, ans.frac(q.n, q.d), [`$${B("u")} = \\dfrac{${M}}{|${B("v")}|}${B("v")} = \\dfrac{${M}}{${L}}${col(...v)}$`, `The first component is $\\dfrac{${M}}{${L}} \\times ${paren(v[0])} = ${frac(q.n, q.d)}$.`])] };
    } });
  reg({ ...VB, unknown: "resultant", representation: "words", levels: [2], skills: ["AI-AHL3.10.vector-arithmetic", "AI-AHL3.10.magnitude"], title: "Resultant of two forces",
    build({ rng }) {
      let f, g, R, mag, ang;
      do { f = [rng.nonzero(-9, 12), rng.nonzero(-9, 12)]; g = [rng.nonzero(-9, 12), rng.nonzero(-9, 12)]; R = [f[0] + g[0], f[1] + g[1]]; mag = Math.hypot(...R); ang = (Math.atan2(R[1], R[0]) * 180) / Math.PI; } while (R[0] <= 0 || R[1] <= 0 || R[0] === R[1] || Number.isInteger(mag) || edge(mag) || edge(ang));
      const ij = (v) => expr([[v[0], B("i")], [v[1], B("j")]]);
      return { params: { f, g }, stem: `Two forces act on a small boat: $${B("F")}_{1} = (${ij(f)})$ newtons and $${B("F")}_{2} = (${ij(g)})$ newtons, where $${B("i")}$ points east and $${B("j")}$ points north.`, parts: [
        P("Find the magnitude of the resultant force.", 2, ans.sf(mag), [`$${B("F")}_{1} + ${B("F")}_{2} = ${ij(R)}$`, `Its magnitude is $\\sqrt{${R[0]}^{2} + ${R[1]}^{2}} = ${sf(mag)}\\text{ N}$.`]),
        P(`Find the angle between the resultant force and the direction of $${B("i")}$, in degrees.`, 2, ans.sf(ang), [`$\\tan\\theta = \\dfrac{${R[1]}}{${R[0]}}$`, `$\\theta = ${deg(sf(ang))}$`])] };
    } });
  reg({ ...VB, unknown: "drone-velocity", representation: "words", levels: [4], skills: ["AI-AHL3.10.displacement-vector", "AI-AHL3.10.magnitude", "AI-AHL3.10.unit-vector"], title: "A velocity of given speed along a displacement",
    build({ rng }) {
      let a, b, d, L, s, vz, time;
      do { a = [rng.int(-40, 60), rng.int(-40, 60), rng.int(2, 30)]; b = [rng.int(-90, 140), rng.int(-90, 140), rng.int(20, 90)]; d = sub(b, a); L = len(d); s = rng.int(4, 15); vz = (s * d[2]) / L; time = L / s; } while (d[2] < 8 || Math.abs(d[0]) < 20 || Math.abs(d[1]) < 20 || edge(L) || edge(vz) || edge(time) || Number.isInteger(L));
      return { params: { a, b, s }, stem: `A drone flies in a straight line at a constant speed of $${s}\\text{ m s}^{-1}$ from $\\mathrm{A}$ to $\\mathrm{B}$. Relative to its controller, the position vectors of $\\mathrm{A}$ and $\\mathrm{B}$, in metres, are $${col(...a)}$ and $${col(...b)}$, where the third component is the height above the ground.`, parts: [
        P("Find the distance $\\mathrm{AB}$.", 2, ans.sf(L), [`$${AB} = ${col(...b)} - ${col(...a)} = ${col(...d)}$`, `$\\mathrm{AB} = \\sqrt{${sq(d)}} = ${sf(L)}\\text{ m}$`]),
        P("Find the rate at which the drone gains height, in $\\text{m s}^{-1}$.", 3, ans.sf(vz), [`The velocity has magnitude $${s}$ and the direction of $${AB}$: $${B("v")} = \\dfrac{${s}}{${sf(L, 4)}}${col(...d)}$`,
          `The rate of gaining height is its third component.`, `$\\dfrac{${s} \\times ${d[2]}}{${sf(L, 4)}} = ${sf(vz)}\\text{ m s}^{-1}$`]),
        P("Find the time that the flight takes, in seconds.", 2, ans.sf(time), [`Time $= \\dfrac{\\text{distance}}{\\text{speed}} = \\dfrac{${sf(L, 4)}}{${s}}$`, `$= ${sf(time)}\\text{ s}$`])] };
    } });

  // ======================= 3.11 vector equation of a line =======================
  const VL = { type: "t3-ai-vector-line", syllabus: ["3.11"], representation: "equation", format: "value" };
  const lineEq = (a, d, par, name) => `${B(name || "r")} = ${col(...a)} + ${par}${col(...d)}`;
  reg({ ...VL, unknown: "point-at-parameter", levels: [1], calculator: false, skills: ["AI-AHL3.11.parametric-form", "AI-AHL3.11.point-on-line"], title: "Points on a line from its vector equation",
    build({ rng }) {
      let a, d, k, k2;
      do { a = v3(rng, -7, 8); d = v3(rng, -4, 5); k = rng.nonzero(-3, 4); k2 = rng.nonzero(-4, 5); } while (d.some((x) => x === 0) || k === k2 || k === 1);
      const zt = a[2] + k2 * d[2];
      return { params: { a, d, k, zt }, stem: `A line has vector equation $${lineEq(a, d, "\\lambda")}$.`, parts: [
        P(`Find the $y$-coordinate of the point on the line where $\\lambda = ${k}$.`, 1, ans.int(a[1] + k * d[1]), [`$y = ${a[1]} + \\lambda${br(d[1])} = ${a[1]} + ${br(k)}${br(d[1])} = ${a[1] + k * d[1]}$`]),
        P(`Find the value of $\\lambda$ at the point on the line where $z = ${zt}$.`, 1, ans.int(k2), [`$${a[2]} + \\lambda${br(d[2])} = ${zt}$, so $\\lambda = \\dfrac{${zt - a[2]}}{${d[2]}} = ${k2}$`])] };
    } });
  reg({ ...VL, unknown: "through-two-points", levels: [2], calculator: false, skills: ["AI-AHL3.11.line-equation", "AI-AHL3.11.point-on-line"], title: "A line through two points and where it meets a plane",
    build({ rng }) {
      let a, b, d, lam;
      do { a = v3(rng, -6, 8); b = v3(rng, -6, 8); d = sub(b, a); lam = d[2] ? rat.Q(-a[2], d[2]) : null; } while (d.some((x) => x === 0) || a[2] === 0 || b[2] === 0 || lam.d > 6 || lam.n === lam.d);
      const xq = rat.add(a[0], rat.mul(lam, d[0])), yq = rat.add(a[1], rat.mul(lam, d[1])), lt = frac(lam.n, lam.d);
      return { params: { a, b }, stem: `The line $L$ passes through the points $\\mathrm{A}${point(a[0], `${a[1]},\\, ${a[2]}`)}$ and $\\mathrm{B}${point(b[0], `${b[1]},\\, ${b[2]}`)}$. Its equation is written as $${B("r")} = ${col(...a)} + \\lambda${col("p", "q", "s")}$, where $${col("p", "q", "s")} = ${AB}$.`.replace(/\\mathrm\{([AB])\}\(/g, "\\mathrm{$1}\\,("), parts: [
        P("Find the value of $q$.", 1, ans.int(d[1]), [`$${AB} = ${col(...b)} - ${col(...a)} = ${col(...d)}$, so $q = ${d[1]}$.`]),
        P("The line $L$ meets the plane $z = 0$ at the point $\\mathrm{C}$. Find the $x$-coordinate of $\\mathrm{C}$.", 2, ans.frac(xq.n, xq.d), [`$z = ${a[2]} + \\lambda${br(d[2])} = 0$ gives $\\lambda = ${lt}$.`, `$x = ${a[0]} + ${paren(lam)}${br(d[0])} = ${frac(xq.n, xq.d)}$`]),
        P("Find the $y$-coordinate of $\\mathrm{C}$.", 1, ans.frac(yq.n, yq.d), [`$y = ${a[1]} + ${paren(lam)}${br(d[1])} = ${frac(yq.n, yq.d)}$`])] };
    } });
  reg({ ...VL, unknown: "intersection", levels: [3], skills: ["AI-AHL3.11.intersection-of-lines", "AI-AHL3.11.parametric-form"], title: "Where two lines in three dimensions meet",
    build({ rng }) {
      let X, d1, d2, l0, m0, a, c;
      do { X = v3(rng, -6, 8); d1 = v3(rng, -3, 4); d2 = v3(rng, -3, 4); l0 = rng.nonzero(-3, 4); m0 = rng.nonzero(-3, 4); a = X.map((v, i) => v - l0 * d1[i]); c = X.map((v, i) => v - m0 * d2[i]); }
      while (d1.some((x) => x === 0) || d2.some((x) => x === 0) || d1[0] * d2[1] - d1[1] * d2[0] === 0 || cross(d1, d2).every((x) => x === 0) || l0 === m0 || a.concat(c).some((v) => Math.abs(v) > 15));
      const row = (i) => `${expr([[a[i], ""], [d1[i], "\\lambda"]])} = ${expr([[c[i], ""], [d2[i], "\\mu"]])}`;
      return { params: { a, d1, c, d2 }, stem: `The lines $L_{1}$ and $L_{2}$ have equations $${lineEq(a, d1, "\\lambda")}$ and $${lineEq(c, d2, "\\mu")}$. The lines meet at the point $\\mathrm{C}$.`, parts: [
        P("Find the value of $\\lambda$ at $\\mathrm{C}$.", 2, ans.int(l0), [`Equate the $x$ and $y$ components: $${row(0)}$ and $${row(1)}$.`, `Solving these simultaneously gives $\\lambda = ${l0}$ and $\\mu = ${m0}$.`]),
        P("Find the value of $\\mu$ at $\\mathrm{C}$.", 2, ans.int(m0), [`From the same pair of equations, $\\mu = ${m0}$.`, `Check with the $z$ components: $${a[2]} + ${br(l0)}${br(d1[2])} = ${X[2]}$ and $${c[2]} + ${br(m0)}${br(d2[2])} = ${X[2]}$, which agree.`]),
        P("Find the $z$-coordinate of $\\mathrm{C}$.", 2, ans.int(X[2]), [`Put $\\lambda = ${l0}$ into $L_{1}$: $${B("r")} = ${col(...a)} + ${paren(l0)}${col(...d1)} = ${col(...X)}$`, `The $z$-coordinate is $${X[2]}$.`])] };
    } });
  reg({ ...VL, unknown: "closest-point", levels: [4], skills: ["AI-AHL3.11.closest-point-on-line", "AI-AHL3.11.parametric-form"], title: "The point on a line closest to a given point",
    build({ rng }) {
      let a, d, p, lam, dist;
      do { a = v3(rng, -6, 8); d = v3(rng, -3, 4); p = v3(rng, -8, 9); if (dot(d, d)) { lam = rat.Q(dot(sub(p, a), d), dot(d, d)); const f = a.map((v, i) => v + (lam.n / lam.d) * d[i]); dist = len(sub(p, f)); } }
      while (d.filter((x) => x === 0).length > 0 || lam.n === 0 || lam.d === 1 || lam.d > 30 || dist < 1 || edge(dist) || Number.isInteger(dist));
      const pa = sub(a, p), k0 = dot(pa, d), k1 = dot(d, d);
      return { params: { a, d, p }, stem: `A straight cable lies along the line $${lineEq(a, d, "\\lambda")}$, and a sensor is at the point $\\mathrm{S}$ with position vector $${col(...p)}$. Distances are in metres. The point $\\mathrm{Q}$ on the cable is the point closest to $\\mathrm{S}$.`, parts: [
        P("Find the exact value of $\\lambda$ at $\\mathrm{Q}$.", 3, ans.frac(lam.n, lam.d), [`For a general point of the line, $\\overrightarrow{\\mathrm{SQ}} = ${col(...pa.map((v, i) => expr([[v, ""], [d[i], "\\lambda"]])))}$.`,
          `At the closest point this is perpendicular to the direction of the line: $\\overrightarrow{\\mathrm{SQ}} \\cdot ${col(...d)} = 0$`, `$${expr([[k0, ""], [k1, "\\lambda"]])} = 0$, so $\\lambda = ${frac(lam.n, lam.d)}$`]),
        P("Find the shortest distance from the sensor to the cable.", 3, ans.sf(dist), [`With $\\lambda = ${frac(lam.n, lam.d)}$, $\\overrightarrow{\\mathrm{SQ}} = ${col(...pa.map((v, i) => sf(v + (lam.n / lam.d) * d[i], 4)))}$`, `The distance is the magnitude of this vector.`, `$|\\overrightarrow{\\mathrm{SQ}}| = ${sf(dist)}\\text{ m}$`])] };
    } });

  // ======================= 3.12 vector kinematics =======================
  const VK = { type: "t3-ai-vector-kinematics", syllabus: ["3.12"], representation: "words", format: "value" };
  reg({ ...VK, unknown: "speed", levels: [1], skills: ["AI-AHL3.12.speed-direction"], title: "Speed from a velocity vector",
    build({ rng }) {
      let v;
      do { v = [rng.nonzero(-18, 24), rng.nonzero(-18, 24)]; } while (Number.isInteger(Math.hypot(...v)) || edge(Math.hypot(...v)));
      return { params: { v }, stem: `A ferry moves with constant velocity $${col(...v)}\\text{ km h}^{-1}$.`, parts: [P("Find the speed of the ferry.", 2, ans.sf(Math.hypot(...v)), [`Speed is the magnitude of the velocity: $\\sqrt{${sq(v)}} = \\sqrt{${dot(v, v)}}$`, `$= ${sf(Math.hypot(...v))}\\text{ km h}^{-1}$`])] };
    } });
  reg({ ...VK, unknown: "position-at-time", levels: [2], skills: ["AI-AHL3.12.position-at-time", "AI-AHL3.12.speed-direction"], title: "Position and distance from a constant-velocity model",
    build({ rng }) {
      let r0, v, t, pos, dist;
      do { r0 = [rng.nonzero(-20, 20), rng.nonzero(-20, 20)]; v = [rng.nonzero(-9, 12), rng.nonzero(-9, 12)]; t = rng.pick([1.5, 2, 2.5, 3, 4, 0.5]); pos = [r0[0] + v[0] * t, r0[1] + v[1] * t]; dist = Math.hypot(...pos); } while (edge(dist) || Number.isInteger(dist) || pos.some((x) => x === 0));
      return { params: { r0, v, t }, stem: `The position of a fishing boat, in kilometres relative to a harbour $\\mathrm{O}$, at $t$ hours after noon is $${B("r")} = ${col(...r0)} + t${col(...v)}$.`, parts: [
        P(`Find the first component of the position vector of the boat when $t = ${num(t)}$.`, 1, ans.dec(pos[0]), [`$${B("r")} = ${col(...r0)} + ${num(t)}${col(...v)} = ${col(...pos)}$, so the first component is $${num(pos[0])}$.`]),
        P("Find the second component of this position vector.", 1, ans.dec(pos[1]), [`From the same line, the second component is $${num(pos[1])}$.`]),
        P("Find the distance of the boat from the harbour at this time.", 2, ans.sf(dist), [`The distance is $|${B("r")}| = \\sqrt{${sq(pos)}}$`, `$= ${sf(dist)}\\text{ km}$`])] };
    } });
  reg({ ...VK, unknown: "closest-approach", levels: [4], skills: ["AI-AHL3.12.relative-position", "AI-AHL3.12.closest-approach"], title: "Closest approach of two ships",
    build({ rng }) {
      let a0, va, b0, vb, rel, dv, ts, dmin, d0;
      do { a0 = [rng.int(-10, 10), rng.int(-10, 10)]; b0 = [rng.int(15, 60) * rng.sign(), rng.int(15, 60) * rng.sign()]; va = [rng.nonzero(-12, 12), rng.nonzero(-12, 12)]; vb = [rng.nonzero(-12, 12), rng.nonzero(-12, 12)];
        rel = sub(b0, a0); dv = sub(vb, va); ts = dot(dv, dv) ? -dot(rel, dv) / dot(dv, dv) : -1; dmin = Math.hypot(rel[0] + ts * dv[0], rel[1] + ts * dv[1]); d0 = Math.hypot(...rel); }
      while (ts < 0.4 || ts > 9 || dmin < 0.8 || dmin > 0.6 * d0 || edge(ts) || edge(dmin) || edge(d0) || dv.some((x) => x === 0));
      const comp = (i) => expr([[rel[i], ""], [dv[i], "t"]]);
      return { params: { a0, va, b0, vb }, stem: `Two ships $\\mathrm{A}$ and $\\mathrm{B}$ move with constant velocities. At $t$ hours after noon their positions, in kilometres relative to a lighthouse, are $${B("r")}_{\\mathrm{A}} = ${col(...a0)} + t${col(...va)}$ and $${B("r")}_{\\mathrm{B}} = ${col(...b0)} + t${col(...vb)}$.`, parts: [
        P("Find the distance between the ships at noon.", 2, ans.sf(d0), [`At $t = 0$, $${AB} = ${col(...b0)} - ${col(...a0)} = ${col(...rel)}$`, `The distance is $\\sqrt{${sq(rel)}} = ${sf(d0)}\\text{ km}$.`]),
        P("Find the value of $t$ at which the ships are closest to each other.", 3, ans.sf(ts), [`$${AB} = ${B("r")}_{\\mathrm{B}} - ${B("r")}_{\\mathrm{A}} = ${col(comp(0), comp(1))}$`,
          `The distance is $\\sqrt{(${comp(0)})^{2} + (${comp(1)})^{2}}$.`, `Its minimum, found with technology, is at $t = ${sf(ts)}$.`]),
        P("Find the least distance between the ships.", 2, ans.sf(dmin), [`Put $t = ${sf(ts, 4)}$ into the distance, or read the minimum from the graph.`, `Least distance $= ${sf(dmin)}\\text{ km}$`])] };
    } });
  reg({ ...VK, unknown: "projectile", levels: [4], skills: ["AI-AHL3.12.variable-velocity", "AI-AHL3.12.interpret-path", "AI-AHL3.12.speed-direction"], title: "A projectile from its position vector",
    build({ rng }) {
      let u, w, h, t1, T, vy1, range, sp;
      do { u = rng.int(8, 25); w = rng.int(5, 20); h = rng.int(2, 40); t1 = rng.pick([0.5, 1, 1.5, 2]); T = (w + Math.sqrt(w * w + 19.6 * h)) / 9.8; vy1 = w - 9.8 * t1; range = u * T; sp = Math.hypot(u, w - 9.8 * T); } while (t1 >= T - 0.2 || edge(T) || edge(range) || edge(sp) || vy1 === 0);
      const S = rng.pick([{ what: "A ball is thrown from the top of a cliff", h: "above the sea", end: "hits the sea" }, { what: "A stone is thrown from a tower", h: "above the ground", end: "hits the ground" }]);
      const vy = `${w} - 9.8t`;
      return { params: { u, w, h, t1 }, stem: `${S.what}. Its position, in metres, $t$ seconds after it is thrown is $${B("r")} = ${col(`${u}t`, `${h} + ${coef(w, "t")} - 4.9t^{2}`)}$, where the first component is the horizontal distance from the foot of the ${S.what.includes("cliff") ? "cliff" : "tower"} and the second is the height ${S.h}.`, parts: [
        P(`Find the vertical component of the velocity when $t = ${num(t1)}$.`, 2, ans.sf(vy1), [`Differentiate the position: $${B("v")} = ${col(u, vy)}$`, `When $t = ${num(t1)}$, the vertical component is $${w} - 9.8${br(t1)} = ${num(vy1)}\\text{ m s}^{-1}$.`]),
        P(`Find the value of $t$ at which it ${S.end}.`, 2, ans.sf(T), [`The height is zero: $${h} + ${coef(w, "t")} - 4.9t^{2} = 0$`, `With technology, the positive solution is $t = ${sf(T)}$.`]),
        P(`Find its horizontal distance from the start at that time.`, 1, ans.sf(range), [`$${u} \\times ${sf(T, 4)} = ${sf(range)}\\text{ m}$`]),
        P(`Find its speed at that time.`, 2, ans.sf(sp), [`$${B("v")} = ${col(u, sf(w - 9.8 * T, 4))}$ when $t = ${sf(T, 4)}$.`, `Speed $= \\sqrt{${u}^{2} + (${sf(w - 9.8 * T, 4)})^{2}} = ${sf(sp)}\\text{ m s}^{-1}$`])] };
    } });

  // ======================= 3.13 scalar and vector products =======================
  const SV = { type: "t3-ai-scalar-vector-product", syllabus: ["3.13"], representation: "equation", format: "value" };
  const dotLine = (a, b) => a.map((v, i) => `${br(v)}${br(b[i])}`).join(" + ");
  const vw = (rng) => { let v, w; do { v = v3(rng, -6, 7); w = v3(rng, -6, 7); } while (v.concat(w).filter((x) => x === 0).length > 1 || cross(v, w).some((x) => x === 0) || dot(v, w) === 0); return { v, w }; };
  reg({ ...SV, unknown: "scalar-product", levels: [1], calculator: false, skills: ["AI-AHL3.13.scalar-product"], situationKey: "vw", situation: vw, title: "Scalar product of two vectors",
    build({ sit: { v, w } }) {
      return { params: { v, w }, stem: `Let $${B("v")} = ${col(...v)}$ and $${B("w")} = ${col(...w)}$.`, parts: [P(`Find $${B("v")} \\cdot ${B("w")}$.`, 2, ans.int(dot(v, w)), [`$${B("v")} \\cdot ${B("w")} = ${dotLine(v, w)}$`, `$= ${dot(v, w)}$`])] };
    } });
  reg({ ...SV, unknown: "angle-between", levels: [2], skills: ["AI-AHL3.13.scalar-product", "AI-AHL3.13.angle-between-vectors"], title: "Angle between two vectors",
    build({ rng }) {
      let v, w, th;
      do { ({ v, w } = vw(rng)); th = (Math.acos(dot(v, w) / (len(v) * len(w))) * 180) / Math.PI; } while (edge(th) || th < 8 || th > 172);
      return { params: { v, w }, stem: `Let $${B("v")} = ${col(...v)}$ and $${B("w")} = ${col(...w)}$.`, parts: [
        P(`Find $${B("v")} \\cdot ${B("w")}$.`, 1, ans.int(dot(v, w)), [`$${B("v")} \\cdot ${B("w")} = ${dotLine(v, w)} = ${dot(v, w)}$`]),
        P(`Find the angle between $${B("v")}$ and $${B("w")}$, in degrees.`, 3, ans.sf(th), [`$|${B("v")}| = \\sqrt{${dot(v, v)}}$ and $|${B("w")}| = \\sqrt{${dot(w, w)}}$`,
          `$\\cos\\theta = \\dfrac{${B("v")} \\cdot ${B("w")}}{|${B("v")}||${B("w")}|} = \\dfrac{${dot(v, w)}}{\\sqrt{${dot(v, v)}}\\sqrt{${dot(w, w)}}}$`, `$\\theta = ${deg(sf(th))}$`])] };
    } });
  reg({ ...SV, unknown: "vector-product", levels: [2], calculator: false, skills: ["AI-AHL3.13.vector-product"], situationKey: "vw", situation: vw, title: "Components of a vector product",
    build({ sit: { v, w } }) {
      const c = cross(v, w), nm = `${B("v")} \\times ${B("w")}`;
      return { params: { v, w }, stem: `Let $${B("v")} = ${col(...v)}$ and $${B("w")} = ${col(...w)}$, and let $${nm} = ${col("p", "q", "s")}$.`, parts: [
        P("Find the value of $p$.", 1, ans.int(c[0]), [`$p = v_{2}w_{3} - v_{3}w_{2} = ${br(v[1])}${br(w[2])} - ${br(v[2])}${br(w[1])} = ${c[0]}$`]),
        P("Find the value of $q$.", 1, ans.int(c[1]), [`$q = v_{3}w_{1} - v_{1}w_{3} = ${br(v[2])}${br(w[0])} - ${br(v[0])}${br(w[2])} = ${c[1]}$`]),
        P("Find the value of $s$.", 1, ans.int(c[2]), [`$s = v_{1}w_{2} - v_{2}w_{1} = ${br(v[0])}${br(w[1])} - ${br(v[1])}${br(w[0])} = ${c[2]}$`])] };
    } });
  reg({ ...SV, unknown: "perpendicular-parameter", levels: [3], skills: ["AI-AHL3.13.perpendicular-test", "AI-AHL3.13.scalar-product"], title: "Make two direction vectors perpendicular",
    build({ rng }) {
      let a, b, c, d, e, k;
      do { a = rng.nonzero(-5, 6); b = rng.nonzero(-5, 6); c = rng.nonzero(-5, 6); d = rng.nonzero(-4, 5); e = rng.nonzero(-5, 6); k = -(a * c + b * e) / d; } while (!Number.isInteger(k) || k === 0 || Math.abs(k) > 12 || Math.abs(d) === 1);
      const v = [a, "k", b], w = [c, d, e], m2 = a * a + k * k + b * b;
      return { params: { a, b, c, d, e }, stem: `Two straight pipes run in the directions of the vectors $${B("v")} = ${col(...v)}$ and $${B("w")} = ${col(...w)}$. The pipes are perpendicular.`, parts: [
        P("Find the value of $k$.", 3, ans.int(k), [`Perpendicular vectors have $${B("v")} \\cdot ${B("w")} = 0$.`, `$${br(a)}${br(c)} + ${br(d)}k + ${br(b)}${br(e)} = 0$, so $${coef(d, "k")} = ${-(a * c + b * e)}$`, `$k = ${k}$`]),
        P(`For this value of $k$, find $|${B("v")}|^{2}$.`, 2, ans.int(m2), [`$|${B("v")}|^{2} = ${sq([a, k, b])}$`, `$= ${m2}$`])] };
    } });
  reg({ ...SV, unknown: "triangle-area", representation: "words", levels: [4], skills: ["AI-AHL3.13.angle-between-vectors", "AI-AHL3.13.vector-product", "AI-AHL3.13.area-from-vector-product"], title: "Angle and area of a triangle in three dimensions",
    build({ rng }) {
      let A, Bp, C, u, v, th, cr, area;
      do { A = v3(rng, -5, 8); Bp = v3(rng, -5, 8); C = v3(rng, -5, 8); u = sub(Bp, A); v = sub(C, A); cr = cross(u, v); area = len(cr) / 2; th = len(u) && len(v) ? (Math.acos(dot(u, v) / (len(u) * len(v))) * 180) / Math.PI : 0; }
      while (u.concat(v).filter((x) => x === 0).length > 1 || cr.filter((x) => x === 0).length > 0 || th < 15 || th > 165 || edge(th) || edge(area) || Number.isInteger(area * 2) || dot(u, v) === 0);
      const pt = (n, p) => `$\\mathrm{${n}}\\,${point(p[0], `${p[1]},\\, ${p[2]}`)}$`;
      return { params: { A, B: Bp, C }, stem: `A triangular sail has its corners at the points ${pt("A", A)}, ${pt("B", Bp)} and ${pt("C", C)}, where the coordinates are in metres.`, parts: [
        P(`Find $${AB} \\cdot ${AC}$.`, 2, ans.int(dot(u, v)), [`$${AB} = ${col(...u)}$ and $${AC} = ${col(...v)}$`, `$${AB} \\cdot ${AC} = ${dotLine(u, v)} = ${dot(u, v)}$`]),
        P("Find the size of angle $\\mathrm{B\\hat{A}C}$, in degrees.", 2, ans.sf(th), [`$\\cos \\mathrm{B\\hat{A}C} = \\dfrac{${dot(u, v)}}{\\sqrt{${dot(u, u)}}\\sqrt{${dot(v, v)}}}$`, `$\\mathrm{B\\hat{A}C} = ${deg(sf(th))}$`]),
        P("Find the area of the sail.", 3, ans.sf(area), [`$${AB} \\times ${AC} = ${col(...cr)}$`, `Area $= \\dfrac{1}{2}|${AB} \\times ${AC}| = \\dfrac{1}{2}\\sqrt{${num(dot(cr, cr))}}$`, `$= ${sf(area)}\\text{ m}^{2}$`])] };
    } });

  // ======================= graph theory: drawing and shared helpers =======================
  const VN = "ABCDEF";
  const GRID = [[0, 2.6], [3.4, 2.6], [6.8, 2.6], [0, 0], [3.4, 0], [6.8, 0]];
  // Planar layouts: vertex positions and the edges that may be drawn without crossing.
  const LAYS = [{ pos: GRID, cand: [[0, 1], [1, 2], [3, 4], [4, 5], [0, 3], [1, 4], [2, 5], [0, 4], [1, 5]] }, { pos: GRID, cand: [[0, 1], [1, 2], [3, 4], [4, 5], [0, 3], [1, 4], [2, 5], [1, 3], [2, 4]] },
    { pos: [[1.2, 3.6], [5, 3.9], [6.4, 1.4], [3.4, 0], [0, 1.2]], cand: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [0, 3], [1, 3]] },
    { pos: [[1.5, 3.6], [4.8, 3.6], [6.4, 1.8], [4.8, 0], [1.5, 0], [0, 1.8]], cand: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [0, 4], [1, 4], [1, 3]] }];
  const isConn = (n, edges) => { const p = [...Array(n).keys()], f = (x) => (p[x] === x ? x : (p[x] = f(p[x]))); edges.forEach(([a, b]) => { p[f(a)] = f(b); }); return new Set(p.map((_, i) => f(i))).size === 1; };
  const degOf = (n, edges) => { const d = Array(n).fill(0); edges.forEach(([a, b]) => { d[a]++; d[b]++; }); return d; };
  const eN = ([a, b]) => VN[Math.min(a, b)] + VN[Math.max(a, b)], vx = (i) => `$\\mathrm{${VN[i]}}$`, ed = (e) => `$\\mathrm{${eN(e)}}$`;
  const names = (n) => fmt.list([...Array(n).keys()].map(vx));
  const netFig = (L, edges, w, directed) => ({ alt: `A ${directed ? "directed " : ""}${w ? "weighted " : ""}graph with vertices ${VN.slice(0, L.pos.length).split("").join(", ")} and edges ${edges.map((e, i) => (directed ? `${VN[e[0]]} to ${VN[e[1]]}` : eN(e)) + (w ? ` (${w[i]})` : "")).join(", ")}`,
    shapes: [...edges.map(([a, b], i) => ({ type: "line", from: L.pos[a], to: L.pos[b], label: w ? String(w[i]) : undefined, arrow: directed ? "mid" : undefined })), ...L.pos.map((p, i) => ({ type: "point", at: p, label: VN[i] }))] });
  const net = (rng, keep, ok) => { let li, L, edges, tries = 0; do { li = rng.int(0, LAYS.length - 1); L = LAYS[li]; edges = L.cand.filter(() => rng.int(1, 10) <= keep); tries++; } while (!isConn(L.pos.length, edges) || edges.length < L.pos.length || (ok && tries < 400 && !ok(L.pos.length, edges))); return { li, L, n: L.pos.length, edges }; };
  const adjM = (n, edges, directed) => { const M = [...Array(n)].map(() => Array(n).fill(0)); edges.forEach(([a, b]) => { M[a][b]++; if (!directed) M[b][a]++; }); return M; };
  const mulN = (X, Y) => X.map((r) => Y[0].map((_, j) => r.reduce((s, v, k) => s + v * Y[k][j], 0)));
  const powN = (M, k) => { let R = M; for (let i = 1; i < k; i++) R = mulN(R, M); return R; };

  // ======================= 3.14 graphs: vertices, edges, degrees =======================
  const GB = { type: "t3-ai-graph-basics", syllabus: ["3.14"], representation: "diagram", format: "value", calculator: false };
  const plainSit = (rng) => net(rng, 7);
  reg({ ...GB, unknown: "vertex-degree", levels: [1], skills: ["AI-AHL3.14.vertex-degree"], situationKey: "plain", situation: plainSit, title: "Degree of a vertex and number of edges",
    build({ rng, sit: s }) {
      const d = degOf(s.n, s.edges), x = rng.int(0, s.n - 1);
      return { params: { x }, graph: netFig(s.L, s.edges), stem: `The diagram shows a graph with vertices ${names(s.n)}.`, parts: [
        P(`Write down the degree of vertex ${vx(x)}.`, 1, ans.int(d[x]), [`The degree is the number of edges that meet at the vertex. At ${vx(x)} these are ${fmt.list(s.edges.filter((e) => e.includes(x)).map(ed))}, so the degree is $${d[x]}$.`]),
        P("Write down the number of edges of the graph.", 1, ans.int(s.edges.length), [`The edges are ${fmt.list(s.edges.map(ed))}: $${s.edges.length}$ edges.`])] };
    } });
  reg({ ...GB, unknown: "degree-sum", levels: [2], skills: ["AI-AHL3.14.vertex-degree", "AI-AHL3.14.classify-graph"], situationKey: "plain", situation: plainSit, title: "Degrees, odd vertices and the complete graph",
    build({ sit: s }) {
      const d = degOf(s.n, s.edges), odd = d.filter((v) => v % 2).length, full = (s.n * (s.n - 1)) / 2;
      return { params: {}, graph: netFig(s.L, s.edges), stem: `The diagram shows a graph $G$ with vertices ${names(s.n)}.`, parts: [
        P("Find the sum of the degrees of the vertices of $G$.", 1, ans.int(2 * s.edges.length), [`The degrees of ${names(s.n)} are $${d.join(",\\, ")}$, with sum $${2 * s.edges.length}$ (twice the number of edges).`]),
        P("Write down the number of vertices of odd degree.", 1, ans.int(odd), [odd ? `The vertices of odd degree are ${fmt.list(d.map((v, i) => (v % 2 ? vx(i) : null)).filter(Boolean))}: $${odd}$ of them.` : `Every degree is even, so the number is $0$.`]),
        P("Find the number of edges that must be added to $G$ to make it a complete graph.", 2, ans.int(full - s.edges.length), [`In a complete graph every pair of the $${s.n}$ vertices is joined: $\\dfrac{${s.n} \\times ${s.n - 1}}{2} = ${full}$ edges.`, `$G$ has $${s.edges.length}$ edges, so $${full} - ${s.edges.length} = ${full - s.edges.length}$ more are needed.`])] };
    } });
  reg({ ...GB, unknown: "complete-and-tree", representation: "words", levels: [2], skills: ["AI-AHL3.14.model-as-graph", "AI-AHL3.14.classify-graph", "AI-AHL3.14.vertex-degree"], title: "Complete graphs and spanning trees of a network",
    build({ rng }) {
      const n = rng.int(5, 12), full = (n * (n - 1)) / 2, S = rng.pick([{ a: "offices", b: "cable" }, { a: "islands", b: "ferry route" }, { a: "villages", b: "footpath" }]);
      return { params: { n }, stem: `A network joins $${n}$ ${S.a}. Each pair of ${S.a} is joined directly by one ${S.b}. The network is represented by a graph in which the ${S.a} are the vertices and each ${S.b} is an edge.`, parts: [
        P("Write down the degree of each vertex.", 1, ans.int(n - 1), [`Each vertex is joined to every one of the other $${n - 1}$ vertices, so its degree is $${n - 1}$.`]),
        P("Find the number of edges of the graph.", 1, ans.int(full), [`The sum of the degrees is $${n} \\times ${n - 1} = ${n * (n - 1)}$, which is twice the number of edges: $${full}$ edges.`]),
        P(`Edges are removed until the graph is a tree that still joins all $${n}$ vertices. Find the number of edges that are removed.`, 2, ans.int(full - (n - 1)), [`A tree with $${n}$ vertices has $${n} - 1 = ${n - 1}$ edges.`, `$${full} - ${n - 1} = ${full - n + 1}$ edges are removed.`])] };
    } });
  const reach = (n, arcs, from) => { const seen = new Set([from]), todo = [from]; while (todo.length) { const u = todo.pop(); for (const [a, b] of arcs) if (a === u && !seen.has(b)) { seen.add(b); todo.push(b); } } return seen; };
  reg({ ...GB, unknown: "directed-degrees", levels: [4], calculator: true, niceOk: true, skills: ["AI-AHL3.14.vertex-degree", "AI-AHL3.14.classify-graph", "AI-AHL3.14.model-as-graph"], title: "A directed graph: degrees, reachability and strong connection",
    build({ rng }) {
      const want = rng.bool();
      let s, arcs, strong, x, y, r, tries = 0;
      do { s = net(rng, 8); arcs = s.edges.map(([a, b]) => (rng.bool() ? [a, b] : [b, a])); strong = [...Array(s.n).keys()].every((v) => reach(s.n, arcs, v).size === s.n); x = rng.int(0, s.n - 1); y = rng.int(0, s.n - 1); r = reach(s.n, arcs, x).size - 1; tries++; }
      while (x === y || (strong !== want && tries < 300) || (!strong && (r === 0 || r === s.n - 1)));
      const inn = arcs.filter((e) => e[1] === x), out = arcs.filter((e) => e[0] === y), got = [...reach(s.n, arcs, x)].filter((v) => v !== x).sort();
      const arc = ([a, b]) => `$\\mathrm{${VN[a]}}$ to $\\mathrm{${VN[b]}}$`;
      return { params: { x, y }, graph: netFig(s.L, arcs, null, true), stem: `The diagram shows the one-way streets that join ${s.n === 5 ? "five" : "six"} junctions, ${names(s.n)}, as a directed graph.`, parts: [
        P(`Write down the in-degree of ${vx(x)}.`, 1, ans.int(inn.length), [inn.length ? `The edges that arrive at ${vx(x)} are ${fmt.list(inn.map(arc))}, so the in-degree is $${inn.length}$.` : `No edge arrives at ${vx(x)}, so the in-degree is $0$.`]),
        P(`Write down the out-degree of ${vx(y)}.`, 1, ans.int(out.length), [out.length ? `The edges that leave ${vx(y)} are ${fmt.list(out.map(arc))}, so the out-degree is $${out.length}$.` : `No edge leaves ${vx(y)}, so the out-degree is $0$.`]),
        P(`Find the number of other junctions that can be reached from ${vx(x)} by following the arrows.`, 2, ans.int(r), [`Follow the arrows from ${vx(x)}, one street after another, noting each new junction reached.`, r ? `The junctions reached are ${fmt.list(got.map(vx))}: $${r}$ of them.` : `No junction can be reached.`]),
        P("Which statement about the directed graph is true?", 2, ans.choice(rng, { text: strong ? "It is strongly connected" : "It is connected but not strongly connected", value: strong ? "strong" : "weak" }, [
          { text: strong ? "It is connected but not strongly connected" : "It is strongly connected", value: strong ? "weak" : "strong", why: "A directed graph is strongly connected only when every vertex can be reached from every other vertex along the arrows." },
          { text: "It is not connected", value: "none", why: "Ignoring the arrows, every vertex is joined to the rest, so the graph is connected." }]), [
          `Ignoring the arrows, the graph is in one piece, so it is connected.`, strong ? `Every junction can be reached from every other junction along the arrows, so it is strongly connected.` : `It is not strongly connected: for example, not every junction can be reached from ${vx(x)}.`])] };
    } });

  // ======================= 3.15 adjacency matrices and walks =======================
  const AW = { type: "t3-ai-adjacency-walks", syllabus: ["3.15"], representation: "diagram", format: "value" };
  const order = (n) => `in the order ${names(n)}`;
  reg({ ...AW, unknown: "matrix-sums", levels: [1], calculator: false, skills: ["AI-AHL3.15.write-adjacency-matrix"], situationKey: "plain", situation: plainSit, title: "Row sums of an adjacency matrix",
    build({ rng, sit: s }) {
      const d = degOf(s.n, s.edges), x = rng.int(0, s.n - 1), M = adjM(s.n, s.edges);
      return { params: { x }, graph: netFig(s.L, s.edges), stem: `The diagram shows a graph with vertices ${names(s.n)}. Its adjacency matrix $${B("M")}$ has its rows and columns ${order(s.n)}.`, parts: [
        P(`Find the sum of the entries in the row of $${B("M")}$ for vertex ${vx(x)}.`, 1, ans.int(d[x]), [`The row has a $1$ for each vertex joined to ${vx(x)}: $${M[x].join(" + ")} = ${d[x]}$, the degree of ${vx(x)}.`]),
        P(`Find the sum of all the entries of $${B("M")}$.`, 1, ans.int(2 * s.edges.length), [`Each of the $${s.edges.length}$ edges gives two entries of $1$, so the sum is $${2 * s.edges.length}$.`])] };
    } });
  reg({ ...AW, unknown: "count-walks", levels: [2], niceOk: true, skills: ["AI-AHL3.15.write-adjacency-matrix", "AI-AHL3.15.count-walks"], title: "Count walks with powers of the adjacency matrix",
    build({ rng }) {
      let s, M, M2, M3, x, y;
      do { s = net(rng, 7); M = adjM(s.n, s.edges); M2 = mulN(M, M); M3 = mulN(M2, M); x = rng.int(0, s.n - 1); y = rng.int(0, s.n - 1); } while (x === y || M2[x][y] === 0 || M3[x][y] < 2);
      return { params: { x, y }, graph: netFig(s.L, s.edges), stem: `The diagram shows a graph with vertices ${names(s.n)}. Its adjacency matrix is $${B("M")}$, with rows and columns ${order(s.n)}.`, parts: [
        P(`Find the number of walks of length $2$ from ${vx(x)} to ${vx(y)}.`, 2, ans.int(M2[x][y]), [`$${B("M")} = ${mat(M)}$`, `The number of walks of length $2$ is the entry of $${B("M")}^{2}$ in the row of ${vx(x)} and the column of ${vx(y)}: $${M2[x][y]}$.`]),
        P(`Find the number of walks of length $3$ from ${vx(x)} to ${vx(y)}.`, 2, ans.int(M3[x][y]), [`With technology, find $${B("M")}^{3}$.`, `The entry in the row of ${vx(x)} and the column of ${vx(y)} is $${M3[x][y]}$.`])] };
    } });
  reg({ ...AW, unknown: "walks-from-matrix", representation: "equation", levels: [4], niceOk: true, skills: ["AI-AHL3.15.read-adjacency-matrix", "AI-AHL3.15.count-walks", "AI-AHL3.15.walks-up-to-k"], title: "Walks in a directed graph from its adjacency matrix",
    build({ rng }) {
      let M, P4, x, y, p, q, upto, tr, Ps;
      do { M = [0, 1, 2, 3, 4].map((i) => [0, 1, 2, 3, 4].map((j) => (i !== j && rng.int(1, 10) <= 4 ? 1 : 0))); Ps = [M, mulN(M, M)]; Ps.push(mulN(Ps[1], M)); P4 = mulN(Ps[2], M);
        x = rng.int(0, 4); y = rng.int(0, 4); p = rng.int(0, 4); q = rng.int(0, 4); upto = Ps[0][p][q] + Ps[1][p][q] + Ps[2][p][q]; tr = Ps[2].reduce((t, r, i) => t + r[i], 0); }
      while (x === y || p === q || (p === x && q === y) || P4[x][y] < 2 || upto < 2 || tr === 0 || M.some((r) => r.every((v) => v === 0)) || M.flat().reduce((a, b) => a + b, 0) > 10);
      return { params: { M, x, y, p, q }, stem: `A directed graph has vertices ${names(5)}. Its adjacency matrix, with rows and columns ${order(5)}, is $${B("M")} = ${mat(M)}$, where each entry is the number of edges from the vertex of its row to the vertex of its column.`, parts: [
        P(`Find the number of walks of length $4$ from ${vx(x)} to ${vx(y)}.`, 2, ans.int(P4[x][y]), [`With technology, find $${B("M")}^{4} = ${mat(P4)}$.`, `The entry in the row of ${vx(x)} and the column of ${vx(y)} is $${P4[x][y]}$.`]),
        P(`Find the number of walks of length at most $3$ from ${vx(p)} to ${vx(q)}.`, 3, ans.int(upto), [`Add the entries of $${B("M")}$, $${B("M")}^{2}$ and $${B("M")}^{3}$ in the row of ${vx(p)} and the column of ${vx(q)}.`, `$${B("M")} + ${B("M")}^{2} + ${B("M")}^{3} = ${mat(Ps[0].map((r, i) => r.map((v, j) => v + Ps[1][i][j] + Ps[2][i][j])))}$`, `$${Ps[0][p][q]} + ${Ps[1][p][q]} + ${Ps[2][p][q]} = ${upto}$`]),
        P("Find the total number of walks of length $3$ that end at the vertex where they start.", 2, ans.int(tr), [`These are counted by the entries on the leading diagonal of $${B("M")}^{3}$.`, `$${Ps[2].map((r, i) => r[i]).join(" + ")} = ${tr}$`])] };
    } });
  reg({ ...AW, unknown: "random-walk", levels: [4], skills: ["AI-AHL3.15.graph-transition-matrix", "AI-AHL3.15.random-walk-probability"], title: "A random walk on a graph and its transition matrix",
    build({ rng }) {
      const S = rng.pick([{ who: "A security guard", where: "rooms of a building", moves: "walks", place: "room" }, { who: "A robot cleaner", where: "zones of a warehouse", moves: "moves", place: "zone" }, { who: "A visitor", where: "galleries of a museum", moves: "walks", place: "gallery" }]);
      let s, d, x, y, z, T3, p3, lim, Tm;
      do { s = net(rng, 7); d = degOf(s.n, s.edges); const M = adjM(s.n, s.edges); Tm = M.map((r) => r.map((v, j) => v / d[j])); T3 = powN(Tm, 3); x = rng.int(0, s.n - 1); y = rng.int(0, s.n - 1); z = rng.int(0, s.n - 1); p3 = T3[y][x]; lim = d[z] / (2 * s.edges.length); }
      while (x === y || z === x || d[x] < 2 || p3 === 0 || edge(p3) || edge(lim) || Math.abs(p3 - Number(p3.toPrecision(2))) < 1e-9);
      const nb = s.edges.find((e) => e.includes(x)), w = nb[0] === x ? nb[1] : nb[0];
      return { params: { x, y, z, w }, graph: netFig(s.L, s.edges), stem: `The diagram shows the ${S.where}, ${names(s.n)}, as the vertices of a graph; an edge joins two ${S.place}s that have a door between them. ${S.who} ${S.moves} at random: from each ${S.place}, each of the doors is equally likely to be chosen for the next move.`, parts: [
        P(`Find the probability that a move from ${vx(x)} goes to ${vx(w)}.`, 1, ans.frac(1, d[x]), [`${vx(x)} has degree $${d[x]}$ and each edge is equally likely, so the probability is $${frac(1, d[x])}$.`]),
        P(`The walk starts at ${vx(x)}. Find the probability that it is at ${vx(y)} after exactly three moves.`, 3, ans.sf(p3), [`The transition matrix $${B("T")}$ has, in the column of each vertex, the probability $\\dfrac{1}{\\text{degree}}$ in the row of each neighbour and $0$ elsewhere.`,
          `With technology, find $${B("T")}^{3}$ and read the entry in the column of ${vx(x)} and the row of ${vx(y)}.`, `The probability is $${sf(p3)}$.`]),
        P(`Find the proportion of the moves that end at ${vx(z)} in the long term.`, 3, ans.sf(lim), [`The long-term proportions form the steady state vector, which satisfies $${B("T")}${B("v")} = ${B("v")}$ with entries that add to $1$.`,
          `Solving with technology (or noting that the steady state is in proportion to the degrees $${d.join(",\\, ")}$) gives $\\dfrac{${d[z]}}{${2 * s.edges.length}}$ for ${vx(z)}.`, `The proportion is $${sf(lim)}$.`])] };
    } });

  // ======================= 3.16 graph algorithms =======================
  const GA = { type: "t3-ai-graph-algorithms", syllabus: ["3.16"], representation: "diagram", format: "value", niceOk: true };
  reg({ ...GA, unknown: "eulerian", format: "mcq", levels: [1], calculator: false, skills: ["AI-AHL3.16.eulerian"], title: "Does a graph have an Eulerian trail or circuit?",
    build({ rng }) {
      const want = rng.pick([0, 2, 2, 4]), s = net(rng, 8, (n, e) => degOf(n, e).filter((v) => v % 2).length === want), d = degOf(s.n, s.edges), odd = d.map((v, i) => (v % 2 ? i : -1)).filter((i) => i >= 0);
      const kind = odd.length === 0 ? "circuit" : odd.length === 2 ? "trail" : "neither";
      const T = { circuit: "It has an Eulerian circuit", trail: "It has an Eulerian trail but no Eulerian circuit", neither: "It has neither an Eulerian trail nor an Eulerian circuit" };
      const why = { circuit: "An Eulerian circuit needs every vertex to have even degree.", trail: "An Eulerian trail that is not a circuit needs exactly two vertices of odd degree.", neither: "With no odd vertices there is a circuit; with exactly two there is a trail." };
      return { params: {}, graph: netFig(s.L, s.edges), stem: `The diagram shows a connected graph with vertices ${names(s.n)}.`, parts: [
        P("Write down the number of vertices of odd degree.", 1, ans.int(odd.length), [`The degrees of ${names(s.n)} are $${d.join(",\\, ")}$.`, odd.length ? `The odd vertices are ${fmt.list(odd.map(vx))}: $${odd.length}$ of them.` : `All the degrees are even, so the number is $0$.`]),
        P("Which statement about the graph is true?", 1, ans.choice(rng, { text: T[kind], value: kind }, ["circuit", "trail", "neither"].filter((k) => k !== kind).map((k) => ({ text: T[k], value: k, why: why[k] }))), [
          kind === "circuit" ? "The graph is connected and every vertex has even degree, so it has an Eulerian circuit." : kind === "trail" ? `Exactly two vertices have odd degree, so there is an Eulerian trail from one of them to the other, but no Eulerian circuit.` : `More than two vertices have odd degree, so no walk can use every edge exactly once.`])] };
    } });
  const wSit = (rng) => { const s = net(rng, 8); return { ...s, w: rng.sample([...Array(27).keys()].map((i) => i + 3), s.edges.length) }; };
  const kruskal = (n, edges, w) => { const p = [...Array(n).keys()], f = (x) => (p[x] === x ? x : (p[x] = f(p[x]))), steps = []; let count = 0;
    for (const i of edges.map((_, k) => k).sort((a, b) => w[a] - w[b])) { if (count === n - 1) break; const [a, b] = edges[i]; if (f(a) !== f(b)) { p[f(a)] = f(b); steps.push({ i, add: true }); count++; } else steps.push({ i, add: false }); } return steps; };
  reg({ ...GA, unknown: "kruskal", levels: [2], skills: ["AI-AHL3.16.kruskal"], title: "Minimum spanning tree by Kruskal's algorithm",
    build({ rng }) {
      const s = wSit(rng), steps = kruskal(s.n, s.edges, s.w), added = steps.filter((t) => t.add), total = added.reduce((t, a) => t + s.w[a.i], 0);
      const S = rng.pick(["The weights are the costs, in thousands of euros, of laying a cable along each edge.", "The weights are the lengths, in kilometres, of the paths between campsites.", "The weights are the times, in minutes, to clear snow from each road."]);
      return { params: {}, graph: netFig(s.L, s.edges, s.w), stem: `The diagram shows a weighted graph with vertices ${names(s.n)}. ${S} Kruskal's algorithm is used to find the minimum spanning tree.`, parts: [
        P("Write down the weight of the third edge that is added to the tree.", 1, ans.int(s.w[added[2].i]), [`Kruskal's algorithm takes the edges in order of weight, leaving out any edge that would make a cycle.`, `The first three edges added are ${fmt.list(added.slice(0, 3).map((a) => `${ed(s.edges[a.i])} ($${s.w[a.i]}$)`))}, so the third has weight $${s.w[added[2].i]}$.`]),
        P("Find the total weight of the minimum spanning tree.", 3, ans.int(total), [...steps.map((t) => (t.add ? `Add ${ed(s.edges[t.i])}, weight $${s.w[t.i]}$.` : `Reject ${ed(s.edges[t.i])}, weight $${s.w[t.i]}$: it would make a cycle.`)),
          `The tree now has $${s.n - 1}$ edges. Total weight $= ${added.map((a) => s.w[a.i]).join(" + ")} = ${total}$`])] };
    } });
  // A table of distinct distances between five places, from points on a map.
  const tableSit = (rng) => {
    let pts, D;
    do { pts = [0, 1, 2, 3, 4].map(() => [rng.int(0, 40), rng.int(0, 40)]); D = pts.map((p) => pts.map((q) => Math.round(Math.hypot(p[0] - q[0], p[1] - q[1])))); }
    while (new Set(D.flatMap((r, i) => r.filter((_, j) => j > i))).size < 10 || D.some((r, i) => r.some((v, j) => i !== j && v < 4)));
    return { D };
  };
  const distTable = (D) => ({ head: ["Vertex", ...D.map((_, i) => vx(i))], rows: D.map((r, i) => [vx(i), ...r.map((v, j) => (i === j ? "–" : `$${v}$`))]) });
  const prim = (D, verts, start) => { const inT = [start], order = []; while (inT.length < verts.length) { let best = null; for (const a of inT) for (const b of verts) if (!inT.includes(b) && (!best || D[a][b] < D[best[0]][best[1]])) best = [a, b]; inT.push(best[1]); order.push(best); } return order; };
  reg({ ...GA, unknown: "prim-table", representation: "table", levels: [2], skills: ["AI-AHL3.16.prim"], situationKey: "table", situation: tableSit, title: "Minimum spanning tree by Prim's algorithm on a table",
    build({ sit: { D } }) {
      const order = prim(D, [0, 1, 2, 3, 4], 0), total = order.reduce((t, [a, b]) => t + D[a][b], 0);
      return { params: {}, table: distTable(D), stem: `The table shows the lengths, in metres, of the pipes that could be laid between five pumps, ${names(5)}. Prim's algorithm, starting at ${vx(0)}, is used to find the minimum spanning tree.`, parts: [
        P("Write down the weight of the first edge that is added.", 1, ans.int(D[order[0][0]][order[0][1]]), [`The smallest entry in the row of ${vx(0)} is $${D[order[0][0]][order[0][1]]}$, so the first edge is ${ed(order[0])}.`]),
        P("Find the total weight of the minimum spanning tree.", 3, ans.int(total), [...order.map(([a, b], i) => `${i ? "Then the" : "The"} shortest edge from a vertex in the tree to a vertex not yet in it is ${ed([a, b])}, weight $${D[a][b]}$.`), `Total weight $= ${order.map(([a, b]) => D[a][b]).join(" + ")} = ${total}$`])] };
    } });
  reg({ ...GA, unknown: "chinese-postman", levels: [4], calculator: true, skills: ["AI-AHL3.16.chinese-postman", "AI-AHL3.16.eulerian"], title: "The Chinese postman problem",
    build({ rng }) {
      const want = rng.pick([2, 4, 4]);
      let s, odd;
      do { s = wSit(rng); odd = degOf(s.n, s.edges).map((v, i) => (v % 2 ? i : -1)).filter((i) => i >= 0); } while (odd.length !== want);
      const n = s.n, INF = 1e9, d = [...Array(n)].map((_, i) => [...Array(n)].map((_, j) => (i === j ? 0 : INF))), nx = [...Array(n)].map(() => Array(n).fill(-1));
      s.edges.forEach(([a, b], i) => { d[a][b] = d[b][a] = s.w[i]; nx[a][b] = b; nx[b][a] = a; });
      for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (d[i][k] + d[k][j] < d[i][j]) { d[i][j] = d[i][k] + d[k][j]; nx[i][j] = nx[i][k]; }
      const path = (a, b) => { let t = VN[a]; while (a !== b) { a = nx[a][b]; t += VN[a]; } return `$\\mathrm{${t}}$`; };
      const sum = s.w.reduce((a, b) => a + b, 0), pairs = odd.length === 2 ? [[[odd[0], odd[1]]]] : [[[odd[0], odd[1]], [odd[2], odd[3]]], [[odd[0], odd[2]], [odd[1], odd[3]]], [[odd[0], odd[3]], [odd[1], odd[2]]]];
      const cost = (pr) => pr.reduce((t, [a, b]) => t + d[a][b], 0), best = pairs.reduce((m, pr) => (cost(pr) < cost(m) ? pr : m));
      const S = rng.pick([{ who: "A postal worker", does: "walk along every street", u: "minutes", w: "times, in minutes, to walk along the streets" }, { who: "A gritting lorry", does: "drive along every road", u: "kilometres", w: "lengths, in kilometres, of the roads" }, { who: "An inspector", does: "check every pipeline", u: "kilometres", w: "lengths, in kilometres, of the pipelines" }]);
      const work = [`The vertices of odd degree are ${fmt.list(odd.map(vx))}, so some edges must be used twice.`];
      if (odd.length === 2) work.push(`The shortest route between them is ${path(odd[0], odd[1])}, of weight $${d[odd[0]][odd[1]]}$; its edges are repeated.`);
      else { for (const pr of pairs) work.push(`Pair ${pr.map(([a, b]) => `${vx(a)} with ${vx(b)} (shortest route ${path(a, b)}, $${d[a][b]}$)`).join(" and ")}: total $${cost(pr)}$.`); work.push(`The least total is $${cost(best)}$, so those routes are repeated.`); }
      work.push(`Least total $= ${sum} + ${cost(best)} = ${sum + cost(best)}$ ${S.u}.`);
      return { params: {}, graph: netFig(s.L, s.edges, s.w), stem: `The diagram shows a weighted graph with vertices ${names(n)}. The weights are the ${S.w}. ${S.who} must ${S.does} at least once, starting and finishing at ${vx(0)}.`, parts: [
        P("Find the sum of the weights of all the edges.", 1, ans.int(sum), [`$${s.w.join(" + ")} = ${sum}$`]),
        P("Write down the number of vertices of odd degree.", 1, ans.int(odd.length), [`The degrees of ${names(n)} are $${degOf(n, s.edges).join(",\\, ")}$, so $${odd.length}$ vertices have odd degree.`]),
        P("Find the least possible total weight of the route.", 4, ans.int(sum + cost(best)), work)] };
    } });
  reg({ ...GA, unknown: "tsp-bounds", representation: "table", levels: [4], calculator: true, skills: ["AI-AHL3.16.tsp-upper-bound", "AI-AHL3.16.tsp-lower-bound", "AI-AHL3.16.prim"], situationKey: "table", situation: tableSit, title: "Upper and lower bounds for the travelling salesman problem",
    build({ rng, sit: { D } }) {
      const route = [0]; while (route.length < 5) { const at = route[route.length - 1]; let b = -1; for (let j = 0; j < 5; j++) if (!route.includes(j) && (b < 0 || D[at][j] < D[at][b])) b = j; route.push(b); }
      const legs = route.map((v, i) => D[v][route[(i + 1) % 5]]), upper = legs.reduce((a, b) => a + b, 0);
      const order = prim(D, [1, 2, 3, 4], 1), mst = order.reduce((t, [a, b]) => t + D[a][b], 0), two = [1, 2, 3, 4].map((j) => D[0][j]).sort((a, b) => a - b).slice(0, 2), lower = mst + two[0] + two[1];
      const S = rng.pick(["A courier must visit each of five depots", "A technician must visit each of five masts", "A tour guide must visit each of five villages"]);
      return { params: {}, table: distTable(D), stem: `${S}, ${names(5)}, and return to the start. The table shows the least distances, in kilometres, between them.`, parts: [
        P(`Use the nearest neighbour algorithm, starting at ${vx(0)}, to find an upper bound for the length of the shortest tour.`, 3, ans.int(upper), [`From each place go to the nearest place not yet visited, and return to ${vx(0)} at the end.`,
          `The tour is $${route.concat(0).map((v) => `\\mathrm{${VN[v]}}`).join(" \\to ")}$.`, `Upper bound $= ${legs.join(" + ")} = ${upper}\\text{ km}$`]),
        P(`Vertex ${vx(0)} is deleted. Find the weight of the minimum spanning tree of the remaining graph.`, 2, ans.int(mst), [`Using Prim's algorithm from ${vx(1)}, the edges are ${fmt.list(order.map((e) => `${ed(e)} ($${D[e[0]][e[1]]}$)`))}.`, `Weight $= ${order.map(([a, b]) => D[a][b]).join(" + ")} = ${mst}$`]),
        P("Hence find a lower bound for the length of the shortest tour.", 2, ans.int(lower), [`Add the two shortest edges from ${vx(0)}: $${two[0]}$ and $${two[1]}$.`, `Lower bound $= ${mst} + ${two[0]} + ${two[1]} = ${lower}\\text{ km}$`])] };
    } });
})(typeof globalThis !== "undefined" ? globalThis : this);
