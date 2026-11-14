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
      do { p = 2 * rng.int(1, 12); q = rng.int(1, 15); mm = rng.pick([2, 3]); n = rng.pick([2, 3]); v2 = p / 2 - n * q; } while (v2 === 0 || p === q);
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
        P(`Find the sound level of a machine whose intensity is $${num(c)} \\times 10^{${-e}}\\text{ W m}^{-2}$.`, 2, ans.sf(La, 3, { unit: "dB" }), [`$L = 10\\log_{10}\\left(\\dfrac{${num(c)} \\times 10^{${-e}}}{${I0}}\\right) = 10\\log_{10}\\left(${num(c)} \\times 10^{${12 - e}}\\right)$`, `$L = ${sf(La)}\\text{ dB}$`]),
        P(`A siren has a sound level of $${unit(L1, "dB")}$ and a lorry has a sound level of $${unit(L2, "dB")}$. Find how many times more intense the sound of the siren is than the sound of the lorry.`, 2, ans.sf(ratio), [
          `$${L1} - ${L2} = 10\\log_{10}\\left(\\dfrac{I_{1}}{I_{0}}\\right) - 10\\log_{10}\\left(\\dfrac{I_{2}}{I_{0}}\\right) = 10\\log_{10}\\left(\\dfrac{I_{1}}{I_{2}}\\right)$, by the quotient law.`,
          `$\\dfrac{I_{1}}{I_{2}} = 10^{${num((L1 - L2) / 10)}} = ${sf(ratio)}$`]),
        P(`A second siren is $${k}$ times as intense as the first siren. Find its sound level.`, 2, ans.sf(Lc, 3, { unit: "dB" }), [
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
        P(`Find the first time after $t = 0$ at which the ${S.sum} is greatest.`, 2, ans.sf(t, 3, { unit: "s" }), [`The sine is greatest when $${wt} + \\alpha = \\dfrac{\\pi}{2}$.`, `$t = \\dfrac{1}{${w}}\\left(\\dfrac{\\pi}{2} - ${sf(al, 4)}\\right) = ${sf(t)}\\text{ s}$`])] };
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
  const charWork = (M) => [`$\\det(${B("M")} - \\lambda ${B("I")}) = (${lin(-1, M[0][0], "\\lambda")})(${lin(-1, M[1][1], "\\lambda")}) - ${br(M[0][1])}${br(M[1][0])}$`,
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
        P(`Find the depth of the water at $t = ${t1}$.`, 2, ans.sf(v, 3, { unit: "m" }), [`$D = ${num(a)}\\sin\\left(\\dfrac{2\\pi}{${num(T)}}(${t1} - ${num(c)})\\right) + ${num(d)}$`, `$D = ${sf(v)}\\text{ m}$`])] };
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

  // @@TOPIC3@@
})(typeof globalThis !== "undefined" ? globalThis : this);
