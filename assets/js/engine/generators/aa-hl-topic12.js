/* AA HL additional higher level content, Topic 1 (1.10 to 1.16) and Topic 2 (2.12 to 2.16).
   Self-contained: needs only engine.js and graph.js. Codes are AA HL's (home: "aa-hl").
   Each generator's independent verifier is in scripts/engine-checks/aa-hl-topic12.mjs under the same id;
   the question types are in data/question-types/aa-hl-topic12.json (1.10 counting uses the main
   catalogue's t1-ahl-counting). */
(function (root) {
  "use strict";
  const E = root.QBEngine;
  const { ans, fmt, graph: G } = E;
  const { num, frac, poly, lin, signed, paren, br, expr, sf, surd, point, factor, coef, rat, piFrac, gcd } = fmt;
  const P = (prompt, marks, answer, working) => ({ prompt, marks, answer, working });
  const reg = (def) => E.registerAll({ home: "aa-hl", calculator: false }, [def])[0];
  const win = (x, y, extra) => Object.assign({ x, y, xStep: 1, yStep: 1 }, extra);
  const I = "\\mathrm{i}";
  const cx = (a, b) => expr([[a, ""], [b, I]]);                 // a + bi
  const ansQ = (q, extra) => ans.frac(q.n, q.d, extra);
  const powT = (q) => (q.d === 1 ? String(q.n) : `${q.n < 0 ? "-" : ""}\\frac{${Math.abs(q.n)}}{${q.d}}`);   // an exponent
  const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
  const nCr = (n, r) => { let v = 1; for (let i = 1; i <= r; i++) v = (v * (n - r + i)) / i; return Math.round(v); };
  const NAMES = ["Ana", "Bruno", "Chloe", "Deniz", "Emeka", "Farah", "Goran", "Hana", "Ines", "Jonas", "Keiko", "Luca"];
  const two = (rng) => rng.sample(NAMES, 2);

  // ======================= 1.10 counting principles =======================
  const CT = { type: "t1-ahl-counting", syllabus: ["1.10"], representation: "words", format: "value" };
  reg({ ...CT, unknown: "code-count", levels: [1], skills: ["AHL1.10.multiplication-addition"], title: "Count codes with the multiplication principle",
    build({ rng }) {
      const L = rng.int(1, 2), nl = rng.pick([3, 4, 5, 6]), D = rng.int(2, 3), nd = rng.pick([5, 6, 7, 8, 9]), rep = rng.bool();
      const fs = Array(L).fill(nl).concat(Array.from({ length: D }, (_, i) => (rep ? nd : nd - i)));
      const total = fs.reduce((s, v) => s * v, 1), added = fs.reduce((s, v) => s + v, 0);
      return { params: { L, nl, D, nd, rep },
        stem: `A code consists of ${L === 1 ? "one letter" : "two letters"} followed by ${D === 2 ? "two digits" : "three digits"}. Each letter is one of $${nl}$ different letters and each digit is one of the digits from $1$ to $${nd}$. ${L === 2 ? "Letters may be repeated. " : ""}${rep ? "Digits may be repeated." : "No digit may be used more than once."}`,
        parts: [P("Find the number of different codes that can be made.", 2, ans.int(total, { misconceptions: [{ value: added, text: "The choices for the positions are multiplied, not added." }] }), [
          `Multiply the numbers of choices for the positions: $${fs.join(" \\times ")}$`, `$= ${num(total)}$ codes`])] };
    } });
  reg({ ...CT, unknown: "award-places", levels: [2], skills: ["AHL1.10.permutations", "AHL1.10.restricted-arrangements"], title: "Medals among runners, with one runner on the podium",
    build({ rng }) {
      const n = rng.int(6, 12), name = rng.pick(NAMES), all = n * (n - 1) * (n - 2), rest = (n - 1) * (n - 2);
      return { params: { n },
        stem: `$${n}$ runners take part in a race. Gold, silver and bronze medals are given to the first three runners, and there are no ties. ${name} is one of the runners.`,
        parts: [
          P("Find the number of different ways in which the three medals can be awarded.", 2, ans.int(all, { misconceptions: [{ value: nCr(n, 3), text: "The order matters here: the same three runners can share the medals in several ways." }] }), [
            `The order matters, so count the choices for gold, then silver, then bronze: $${n} \\times ${n - 1} \\times ${n - 2}$`, `$= ${num(all)}$`]),
          P(`In how many of these does ${name} win a medal?`, 2, ans.int(3 * rest), [
            `${name} can win any one of the $3$ medals.`, `The other two medals go, in order, to two of the remaining $${n - 1}$ runners: $${n - 1} \\times ${n - 2} = ${rest}$ ways.`, `$3 \\times ${rest} = ${num(3 * rest)}$`])] };
    } });
  reg({ ...CT, unknown: "together", levels: [3], skills: ["AHL1.10.restricted-arrangements", "AHL1.10.permutations"], title: "People in a row: together, apart, at the ends",
    build({ rng }) {
      const n = rng.int(5, 7), [A, B] = two(rng), all = fact(n), tog = 2 * fact(n - 1), ends = 2 * fact(n - 2);
      return { params: { n },
        stem: `$${n}$ friends, including ${A} and ${B}, stand in a row for a photograph.`,
        parts: [
          P("Find the number of different orders in which they can stand.", 1, ans.int(all), [`$${n}! = ${num(all)}$`]),
          P(`Find the number of orders in which ${A} and ${B} stand next to each other.`, 2, ans.int(tog, { misconceptions: [{ value: fact(n - 1), text: "The two friends can also swap places inside their block." }] }), [
            `Treat ${A} and ${B} as one block. There are then $${n - 1}$ objects to arrange: $${n - 1}! = ${fact(n - 1)}$ ways.`, `The two can swap places inside the block: $2 \\times ${fact(n - 1)} = ${num(tog)}$`]),
          P(`Find the number of orders in which ${A} and ${B} do not stand next to each other.`, 2, ans.int(all - tog, { misconceptions: [{ value: all - 2, text: "Subtract every order in which the two are together, not just the two people." }] }), [
            `Subtract the orders in which they are together from all the orders.`, `$${num(all)} - ${num(tog)} = ${num(all - tog)}$`]),
          P(`Find the number of orders in which ${A} and ${B} stand at the two ends of the row.`, 2, ans.int(ends), [
            `${A} and ${B} can take the two ends in $2$ ways.`, `The other $${n - 2}$ friends fill the middle places in $${n - 2}! = ${fact(n - 2)}$ ways.`, `$2 \\times ${fact(n - 2)} = ${ends}$`])] };
    } });
  reg({ ...CT, unknown: "committee-at-least-one", levels: [4], calculator: true, skills: ["AHL1.10.combinations", "AHL1.10.restricted-arrangements", "AHL1.10.probability-by-counting"], title: "Committees: exactly, at least one, and a probability",
    build({ rng }) {
      const M = rng.int(5, 8), W = rng.int(4, 7), k = rng.pick([4, 5]), j = rng.int(1, 2);
      const total = nCr(M + W, k), exact = nCr(W, j) * nCr(M, k - j), none = nCr(M, k);
      const ws = []; for (let w = Math.floor(k / 2) + 1; w <= Math.min(k, W); w++) ws.push(w);
      const more = ws.reduce((s, w) => s + nCr(W, w) * nCr(M, k - w), 0);
      const C = (n, r) => `\\dbinom{${n}}{${r}}`;
      return { params: { M, W, k, j },
        stem: `A committee of $${k}$ people is to be chosen from $${M}$ men and $${W}$ women.`,
        parts: [
          P("Find the number of different committees that can be chosen.", 1, ans.int(total, { misconceptions: [{ value: total * fact(k), text: "The order in which the members are chosen does not matter, so use combinations." }] }), [`$${C(M + W, k)} = ${num(total)}$`]),
          P(`Find the number of committees that contain exactly $${j}$ ${j === 1 ? "woman" : "women"}.`, 2, ans.int(exact, { misconceptions: [{ value: nCr(W, j) + nCr(M, k - j), text: "Both groups are chosen, so the two counts are multiplied, not added." }] }), [
            `Choose $${j}$ of the $${W}$ women and $${k - j}$ of the $${M}$ men: $${C(W, j)} \\times ${C(M, k - j)}$`, `$= ${nCr(W, j)} \\times ${nCr(M, k - j)} = ${num(exact)}$`]),
          P("Find the number of committees that contain at least one woman.", 2, ans.int(total - none, { misconceptions: [{ value: W * nCr(M + W - 1, k - 1), text: "Choosing one woman first and then anyone else counts some committees more than once." }] }), [
            `Subtract the committees with no women: $${C(M + W, k)} - ${C(M, k)}$`, `$= ${num(total)} - ${num(none)} = ${num(total - none)}$`]),
          P("The committee is chosen at random. Find the probability that it contains more women than men.", 2, ans.sf(more / total), [
            `More women than men means $${ws.join("$ or $")}$ women: $${ws.map((w) => C(W, w) + C(M, k - w)).join(" + ")} = ${num(more)}$ committees.`,
            `Probability $= \\dfrac{${num(more)}}{${num(total)}} = ${sf(more / total)}$`])] };
    } });

  // ======================= 1.10 binomial theorem for rational indices =======================
  const BR = { type: "t1-ahl-binomial-rational", syllabus: ["1.10"], representation: "equation" };
  const half = rat.Q(1, 2);
  const binC = (n, a) => { const h = rat.mul(rat.mul(n, rat.sub(n, 1)), half); return { c1: rat.mul(n, a), h, c2: rat.mul(h, rat.mul(a, a)) }; };
  const SERIES = "(1 + X)^{n} = 1 + nX + \\dfrac{n(n-1)}{2!}X^{2} + \\dots";
  reg({ ...BR, unknown: "coefficients", format: "value", levels: [2], skills: ["AHL1.10.binomial-rational-index", "AHL1.10.validity-interval"], title: "First coefficients of a rational-index expansion, and where it is valid",
    build({ rng }) {
      const n = rng.pick([rat.Q(-1), rat.Q(-2), rat.Q(-3), rat.Q(1, 2), rat.Q(-1, 2), rat.Q(1, 3)]), a = rng.pick([2, 3, 4, -2, -3, -4]);
      const { c1, h, c2 } = binC(n, a), ab = Math.abs(a);
      return { params: { n: rat.num(n), a },
        stem: `Consider the expansion of $\\left(${expr([[1, ""], [a, "x"]])}\\right)^{${powT(n)}}$ in ascending powers of $x$.`,
        parts: [
          P("Find the coefficient of $x$.", 1, ansQ(c1), [`Use $${SERIES}$ with $n = ${rat.tex(n)}$ and $X = ${coef(a, "x")}$.`, `The term in $x$ is $${br(n)}${br(a)}x$, so the coefficient is $${rat.tex(c1)}$.`]),
          P("Find the coefficient of $x^{2}$.", 2, ansQ(c2), [
            `$\\dfrac{n(n-1)}{2!} = \\dfrac{1}{2} \\times ${paren(n)} \\times ${paren(rat.sub(n, 1))} = ${rat.tex(h)}$`,
            `The coefficient is $${rat.tex(h)} \\times ${br(a)}^{2} = ${rat.tex(c2)}$.`]),
          P("For which values of $x$ is the expansion valid?", 1, ans.choice(rng, { text: `$|x| < ${frac(1, ab)}$`, value: 1 / ab }, [
            { text: `$|x| < ${ab}$`, value: ab, why: `The condition is $|${coef(a, "x")}| < 1$, so divide by $${ab}$.` },
            { text: "$|x| < 1$", value: 1, why: `The condition is on $${coef(a, "x")}$, not on $x$ alone.` },
            { text: "$x \\in \\mathbb{R}$", value: 99, why: "Only an expansion with a positive integer power is valid for every $x$." }]), [
            `The expansion is valid when $|${coef(a, "x")}| < 1$, so $|x| < ${frac(1, ab)}$.`])] };
    } });
  reg({ ...BR, unknown: "expand-shifted", format: "value", levels: [3], skills: ["AHL1.10.binomial-rational-index", "AHL1.10.validity-interval"], title: "Expand (p + qx)^n by taking out a factor",
    build({ rng }) {
      const kind = rng.pick([0, 0, 1, 2, 3]);
      const n = [rat.Q(1, 2), rat.Q(-1, 2), rat.Q(-1), rat.Q(-2)][kind], p = kind < 2 ? rng.pick([4, 9]) : kind === 2 ? rng.pick([2, 3, 4, 5]) : rng.pick([2, 3]);
      let q;
      do { q = rng.nonzero(-3, 3); } while (gcd(q, p) === p);
      const c0 = kind === 0 ? rat.Q(Math.sqrt(p)) : kind === 1 ? rat.Q(1, Math.sqrt(p)) : kind === 2 ? rat.Q(1, p) : rat.Q(1, p * p), ratio = rat.Q(q, p);
      const { h } = binC(n, ratio), c1 = rat.mul(c0, rat.mul(n, ratio)), c2 = rat.mul(c0, rat.mul(h, rat.mul(ratio, ratio)));
      const base = expr([[p, ""], [q, "x"]]), X = coef(ratio, "x");
      return { params: { n: rat.num(n), p, q },
        stem: `The expansion of $\\left(${base}\\right)^{${powT(n)}}$ in ascending powers of $x$ begins $a + bx + cx^{2}$.`,
        parts: [
          P("Find the value of $a$.", 1, ansQ(c0), [`$\\left(${base}\\right)^{${powT(n)}} = ${p}^{${powT(n)}}\\left(${expr([[1, ""], [ratio, "x"]])}\\right)^{${powT(n)}}$`, `$a = ${p}^{${powT(n)}} = ${rat.tex(c0)}$`]),
          P("Find the value of $b$.", 2, ansQ(c1), [`Use $${SERIES}$ with $n = ${rat.tex(n)}$ and $X = ${X}$.`, `$b = ${rat.tex(c0)} \\times ${paren(n)} \\times ${paren(ratio)} = ${rat.tex(c1)}$`]),
          P("Find the value of $c$.", 2, ansQ(c2), [
            `$\\dfrac{n(n-1)}{2!} = \\dfrac{1}{2} \\times ${paren(n)} \\times ${paren(rat.sub(n, 1))} = ${rat.tex(h)}$`,
            `$c = ${rat.tex(c0)} \\times ${paren(h)} \\times ${br(ratio)}^{2} = ${rat.tex(c2)}$`]),
          P("The expansion is valid for $|x| < k$. Find the value of $k$.", 1, ans.frac(p, Math.abs(q)), [`The expansion needs $\\left|${X}\\right| < 1$, so $|x| < ${frac(p, Math.abs(q))}$ and $k = ${frac(p, Math.abs(q))}$.`])] };
    } });
  reg({ ...BR, unknown: "approximation", format: "value", levels: [4], calculator: true, skills: ["AHL1.10.binomial-approximation", "AHL1.10.binomial-rational-index"], title: "Estimate a value with three terms and find the percentage error",
    build({ rng }) {
      let n, a, x0;
      do { n = rng.pick([rat.Q(1, 2), rat.Q(-1, 2), rat.Q(1, 3), rat.Q(-2), rat.Q(-1)]); a = rng.pick([2, 3, 4, -2, -3]); x0 = rng.pick([0.05, 0.1]); } while (Math.abs(a * x0) > 0.41 || Math.abs(a * x0) < 0.14);
      const { c1, h, c2 } = binC(n, a), approx = 1 + rat.num(c1) * x0 + rat.num(c2) * x0 * x0, exact = Math.pow(1 + a * x0, rat.num(n)), err = (100 * Math.abs(approx - exact)) / exact;
      return { params: { n: rat.num(n), a, x0 },
        stem: `Let $f(x) = \\left(${expr([[1, ""], [a, "x"]])}\\right)^{${powT(n)}}$. The expansion of $f(x)$ in ascending powers of $x$ begins $1 + px + qx^{2}$.`,
        parts: [
          P("Find the value of $p$.", 1, ansQ(c1), [`Use $${SERIES}$ with $n = ${rat.tex(n)}$ and $X = ${coef(a, "x")}$.`, `$p = ${br(n)}${br(a)} = ${rat.tex(c1)}$`]),
          P("Find the value of $q$.", 2, ansQ(c2), [
            `$\\dfrac{n(n-1)}{2!} = \\dfrac{1}{2} \\times ${paren(n)} \\times ${paren(rat.sub(n, 1))} = ${rat.tex(h)}$`, `$q = ${rat.tex(h)} \\times ${br(a)}^{2} = ${rat.tex(c2)}$`]),
          P(`Use these three terms to estimate $f(${num(x0)})$.`, 2, ans.sf(approx), [
            `$f(${num(x0)}) \\approx ${expr([[1, ""], [c1, br(x0)], [c2, `${br(x0)}^{2}`]])}$`, `$\\approx ${sf(approx, 6)}$, which is $${sf(approx)}$ to three significant figures.`]),
          P(`Find the percentage error in this estimate. Use the unrounded estimate and the exact value of $f(${num(x0)})$.`, 2, ans.sf(err), [
            `The exact value is $f(${num(x0)}) = ${sf(exact, 6)}$, from a calculator.`,
            `Percentage error $= \\dfrac{|${sf(approx, 6)} - ${sf(exact, 6)}|}{${sf(exact, 6)}} \\times 100\\%$`, `$\\approx ${sf(err)}\\%$`])] };
    } });

  // ======================= 1.11 partial fractions =======================
  const PF = { type: "t1-ahl-partial-fractions", syllabus: ["1.11"], representation: "equation", format: "value" };
  const pfSit = (rng) => {
    let a, b, A, B;
    do { a = rng.int(-4, 5); b = rng.int(-4, 5); A = rng.nonzero(-5, 6); B = rng.nonzero(-5, 6); } while (a === b || A === B);
    return { a, b, A, B, pN: A + B, qN: -(A * b + B * a) };
  };
  const pfFrac = (A, a) => `\\dfrac{${Math.abs(A)}}{${lin(1, -a)}}`;
  const pfSum = (s) => `${s.A < 0 ? "-" : ""}${pfFrac(s.A, s.a)} ${s.B < 0 ? "-" : "+"} ${pfFrac(s.B, s.b)}`;
  const pfStem = (s) => `Let $f(x) = \\dfrac{${lin(s.pN, s.qN)}}{${factor(s.a)}${factor(s.b)}}$. Then $f(x)$ can be written in the form $\\dfrac{A}{${lin(1, -s.a)}} + \\dfrac{B}{${lin(1, -s.b)}}$, where $A$ and $B$ are constants.`;
  const pfA = (s) => [`Multiply both sides by $${factor(s.a)}${factor(s.b)}$: $${lin(s.pN, s.qN)} = A${factor(s.b)} + B${factor(s.a)}$`, `Let $x = ${s.a}$: $${s.pN * s.a + s.qN} = A${br(s.a - s.b)}$`, `$A = ${s.A}$`];
  const pfB = (s) => [`Let $x = ${s.b}$ in $${lin(s.pN, s.qN)} = A${factor(s.b)} + B${factor(s.a)}$: $${s.pN * s.b + s.qN} = B${br(s.b - s.a)}$`, `$B = ${s.B}$`];
  reg({ ...PF, unknown: "one-constant", levels: [1], situationKey: "pf", situation: pfSit, skills: ["AHL1.11.cover-up-or-compare"], title: "Find one constant of a partial fraction split",
    build({ sit: s }) { return { stem: pfStem(s), parts: [P("Find the value of $A$.", 2, ans.int(s.A), pfA(s))] }; } });
  reg({ ...PF, unknown: "constants", levels: [2], situationKey: "pf", situation: pfSit, skills: ["AHL1.11.distinct-linear-factors", "AHL1.11.cover-up-or-compare"], title: "Split a fraction over two distinct linear factors",
    build({ sit: s }) { return { stem: pfStem(s), parts: [P("Find the value of $A$.", 2, ans.int(s.A), pfA(s)), P("Find the value of $B$.", 2, ans.int(s.B), pfB(s))] }; } });
  reg({ ...PF, unknown: "telescoping-sum", levels: [3], skills: ["AHL1.11.distinct-linear-factors", "AHL1.11.cover-up-or-compare"], title: "Partial fractions, then a sum that telescopes",
    build({ rng }) {
      const d = rng.pick([1, 1, 2]), a = d === 1 ? rng.int(0, 2) : rng.pick([-1, 1]), c = d === 1 ? rng.pick([1, 2, 3, 4]) : rng.pick([1, 2, 4, 6]), N = rng.pick([8, 9, 10, 12, 15, 20]);
      const f1 = lin(d, a, "r"), f2 = lin(d, a + d, "r"), fac = (s) => (/[+-]/.test(s) ? `(${s})` : s);
      const A = rat.Q(c, d), S = rat.mul(A, rat.sub(rat.Q(1, d + a), rat.Q(1, d * N + a + d))), At = A.n === 1 && A.d === 1 ? "" : rat.tex(A);
      const sum = `\\displaystyle\\sum_{r=1}^{${N}} f(r)`;
      return { params: { d, a, c, N },
        stem: `Let $f(r) = \\dfrac{${c}}{${fac(f1)}${fac(f2)}}$. Then $f(r)$ can be written in the form $\\dfrac{A}{${f1}} + \\dfrac{B}{${f2}}$, where $A$ and $B$ are constants.`,
        parts: [
          P("Find the value of $A$.", 2, ansQ(A), [`Multiply both sides by $${fac(f1)}${fac(f2)}$: $${c} = A${fac(f2)} + B${fac(f1)}$`, `Let $r = ${frac(-a, d)}$, so that $${f1} = 0$ and $${f2} = ${d}$: $${c} = ${coef(d, "A")}$`, `$A = ${rat.tex(A)}$`]),
          P("Find the value of $B$.", 1, ansQ(rat.neg(A)), [`Let $r = ${frac(-a - d, d)}$, so that $${f2} = 0$ and $${f1} = ${-d}$: $${c} = ${coef(-d, "B")}$`, `$B = ${rat.tex(rat.neg(A))}$`]),
          P(`Hence find the exact value of $${sum}$.`, 3, ansQ(S), [
            `$f(r) = ${At}\\left(\\dfrac{1}{${f1}} - \\dfrac{1}{${f2}}\\right)$`,
            `When the terms are written out, each negative fraction cancels with the positive fraction of the next term. Only the first and the last fractions are left.`,
            `$${sum} = ${At}\\left(${frac(1, d + a)} - ${frac(1, d * N + a + d)}\\right)$`, `$= ${rat.tex(S)}$`])] };
    } });
  reg({ ...PF, syllabus: ["1.11", "5.15"], unknown: "then-integrate", levels: [4], calculator: true, skills: ["AHL1.11.before-integrating", "AHL1.11.distinct-linear-factors"], title: "Partial fractions, then a definite integral",
    build({ rng }) {
      const s = pfSit(rng), lo = Math.max(s.a, s.b) + rng.int(1, 2), hi = lo + rng.int(1, 3);
      const val = s.A * Math.log((hi - s.a) / (lo - s.a)) + s.B * Math.log((hi - s.b) / (lo - s.b));
      const int = `\\displaystyle\\int_{${lo}}^{${hi}}`;
      return { params: { ...s, lo, hi }, stem: pfStem(s), parts: [
        P("Find the value of $A$.", 2, ans.int(s.A), pfA(s)), P("Find the value of $B$.", 1, ans.int(s.B), pfB(s)),
        P(`Hence find the value of $${int} f(x)\\,\\mathrm{d}x$.`, 3, ans.sf(val), [
          `$${int} \\left(${pfSum(s)}\\right)\\mathrm{d}x = \\left[${expr([[s.A, `\\ln|${lin(1, -s.a)}|`], [s.B, `\\ln|${lin(1, -s.b)}|`]])}\\right]_{${lo}}^{${hi}}$`,
          `$= ${expr([[s.A, `\\ln ${frac(hi - s.a, lo - s.a)}`], [s.B, `\\ln ${frac(hi - s.b, lo - s.b)}`]])}$`, `$\\approx ${sf(val)}$`])] };
    } });

  // ======================= 1.12 complex numbers in Cartesian form =======================
  const CC = { type: "t1-ahl-complex-cartesian", syllabus: ["1.12"], representation: "equation", format: "value" };
  reg({ ...CC, unknown: "conjugate-modulus", levels: [1], skills: ["AHL1.12.modulus-argument-values", "AHL1.12.conjugate"], title: "Modulus and conjugate of a complex number",
    build({ rng }) {
      const [u, v, r] = rng.pick([[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13], [6, 8, 10], [8, 6, 10], [8, 15, 17], [15, 8, 17]]), a = u * rng.sign(), b = v * rng.sign();
      return { params: { a, b }, stem: `Let $z = ${cx(a, b)}$.`, parts: [
        P("Find $|z|$.", 1, ans.int(r), [`$|z| = \\sqrt{${br(a)}^{2} + ${br(b)}^{2}} = \\sqrt{${a * a + b * b}} = ${r}$`]),
        P("Write down the imaginary part of $z^{\\ast}$.", 1, ans.int(-b, { misconceptions: [{ value: b, text: "The conjugate changes the sign of the imaginary part." }] }), [`$z^{\\ast} = ${cx(a, -b)}$, so its imaginary part is $${-b}$.`])] };
    } });
  reg({ ...CC, unknown: "argand-point", representation: "graph", format: "mcq", levels: [1], skills: ["AHL1.12.argand-diagram", "AHL1.12.conjugate"], title: "Read the conjugate and the negative from an Argand diagram",
    build({ rng }) {
      let a, b;
      do { a = rng.nonzero(-5, 5); b = rng.nonzero(-5, 5); } while (Math.abs(a) === Math.abs(b));
      const pts = [[a, b], [a, -b], [-a, -b], [-a, b]], L = rng.shuffle(["A", "B", "C", "D"]), opt = (i) => ({ text: `$\\mathrm{${L[i]}}$`, value: L[i] });
      const graph = win([-6, 6], [-6, 6], { xLabel: "Re", yLabel: "Im", points: pts.map(([x, y], i) => ({ x, y, label: L[i] })), alt: "An Argand diagram with four marked points" });
      return { params: { a, b }, graph, stem: `The Argand diagram shows four points. The point $\\mathrm{${L[0]}}$ represents the complex number $z = ${cx(a, b)}$.`, parts: [
        P("Which point represents $z^{\\ast}$?", 1, ans.choice(rng, opt(1), [Object.assign(opt(2), { why: "That point is $-z$: both parts have changed sign." }), Object.assign(opt(3), { why: "That point is $-z^{\\ast}$: the real part has changed sign, not the imaginary part." }), opt(0)]), [
          `$z^{\\ast} = ${cx(a, -b)}$ is the reflection of $z$ in the real axis: the point $${point(a, -b)}$, which is $\\mathrm{${L[1]}}$.`]),
        P("Which point represents $-z$?", 1, ans.choice(rng, opt(2), [Object.assign(opt(1), { why: "That point is $z^{\\ast}$: only the imaginary part has changed sign." }), opt(3), opt(0)]), [
          `$-z = ${cx(-a, -b)}$ is the point $${point(-a, -b)}$, which is $\\mathrm{${L[2]}}$. It is $z$ rotated through a half turn about the origin.`])] };
    } });
  reg({ ...CC, unknown: "product", levels: [2], skills: ["AHL1.12.arithmetic"], title: "Multiply two complex numbers",
    build({ rng }) {
      const a = rng.nonzero(-5, 5), b = rng.nonzero(-5, 5), c = rng.nonzero(-5, 5), d = rng.nonzero(-5, 5), re = a * c - b * d, im = a * d + b * c;
      return { params: { a, b, c, d }, stem: `Let $z = ${cx(a, b)}$ and $w = ${cx(c, d)}$.`, parts: [
        P("Find the real part of $zw$.", 2, ans.int(re, { misconceptions: [{ value: a * c + b * d, text: "Remember that $\\mathrm{i}^{2} = -1$." }, { value: a * c, text: "The product of the two imaginary parts also gives a real number." }] }), [
          `$zw = (${cx(a, b)})(${cx(c, d)}) = ${expr([[a * c, ""], [a * d, I], [b * c, I], [b * d, `${I}^{2}`]])}$`,
          `Since $\\mathrm{i}^{2} = -1$, $zw = ${cx(re, im)}$, so the real part is $${re}$.`]),
        P("Find the imaginary part of $zw$.", 2, ans.int(im), [`Collect the terms in $\\mathrm{i}$: $${expr([[a * d, I], [b * c, I]])} = ${im === 0 ? "0" : coef(im, I)}$`, `The imaginary part is $${im}$.`])] };
    } });
  reg({ ...CC, unknown: "complex-quadratic", levels: [2], skills: ["AHL1.12.complex-quadratic"], title: "Solve a quadratic with complex roots",
    build({ rng }) {
      const p = rng.nonzero(-5, 5), q = rng.int(1, 5), b = -2 * p, c = p * p + q * q, D = b * b - 4 * c;
      return { params: { b, c }, stem: `Consider the equation $${poly([1, b, c], "z")} = 0$, where $z \\in \\mathbb{C}$.`, parts: [
        P("Find the discriminant of the equation.", 1, ans.int(D), [`$b^{2} - 4ac = ${br(b)}^{2} - 4(1)(${c}) = ${D}$`]),
        P("The roots are $z = p \\pm q\\mathrm{i}$, where $q > 0$. Find the value of $p$.", 1, ans.int(p), [`$z = \\dfrac{${-b} \\pm \\sqrt{${D}}}{2}$, and the real part is $\\dfrac{${-b}}{2} = ${p}$.`]),
        P("Find the value of $q$.", 2, ans.int(q), [`$\\sqrt{${D}} = \\sqrt{${-D}}\\,\\mathrm{i} = ${2 * q}\\mathrm{i}$`, `$z = \\dfrac{${-b} \\pm ${2 * q}\\mathrm{i}}{2} = ${p} \\pm ${q === 1 ? "" : q}\\mathrm{i}$, so $q = ${q}$.`])] };
    } });
  reg({ ...CC, unknown: "quotient", levels: [3], skills: ["AHL1.12.division-conjugate", "AHL1.12.conjugate"], title: "Divide complex numbers with the conjugate",
    build({ rng }) {
      let a, b, c, d;
      do { a = rng.nonzero(-6, 6); b = rng.nonzero(-6, 6); c = rng.nonzero(-4, 4); d = rng.nonzero(-4, 4); } while (a * d === b * c || a * c + b * d === 0);
      const N = c * c + d * d, re = a * c + b * d, im = b * c - a * d;
      return { params: { a, b, c, d }, stem: `Let $z = ${cx(a, b)}$ and $w = ${cx(c, d)}$.`, parts: [
        P("Find $ww^{\\ast}$.", 1, ans.int(N), [`$ww^{\\ast} = (${cx(c, d)})(${cx(c, -d)}) = ${br(c)}^{2} + ${br(d)}^{2} = ${N}$`]),
        P("Find the real part of $\\dfrac{z}{w}$.", 2, ans.frac(re, N), [
          `Multiply the numerator and the denominator by $w^{\\ast}$: $\\dfrac{z}{w} = \\dfrac{(${cx(a, b)})(${cx(c, -d)})}{${N}}$`,
          `$(${cx(a, b)})(${cx(c, -d)}) = ${expr([[a * c, ""], [-a * d, I], [b * c, I], [-b * d, `${I}^{2}`]])} = ${cx(re, im)}$`, `The real part is $${frac(re, N)}$.`]),
        P("Find the imaginary part of $\\dfrac{z}{w}$.", 2, ans.frac(im, N), [`$\\dfrac{z}{w} = \\dfrac{${cx(re, im)}}{${N}}$`, `The imaginary part is $${frac(im, N)}$.`])] };
    } });
  reg({ ...CC, unknown: "equate-parts", levels: [3], skills: ["AHL1.12.equate-parts", "AHL1.12.conjugate"], title: "Equate real and imaginary parts to find a complex number",
    build({ rng }) {
      let al, be, x, y;
      do { al = rng.int(2, 4); be = rng.nonzero(-3, 3); x = rng.nonzero(-5, 5); y = rng.nonzero(-5, 5); } while (Math.abs(be) === al);
      const p = al * x + be * y, q = be * x + al * y, det = al * al - be * be;
      const lhs = `${al}z ${be < 0 ? "-" : "+"} ${Math.abs(be) === 1 ? "" : Math.abs(be)}\\mathrm{i}z^{\\ast}`;
      return { params: { al, be, p, q }, stem: `The complex number $z = x + y\\mathrm{i}$, where $x, y \\in \\mathbb{R}$, satisfies $${lhs} = ${cx(p, q)}$.`, parts: [
        P("Find the value of $x$.", 3, ans.int(x), [
          `$z^{\\ast} = x - y\\mathrm{i}$, so $\\mathrm{i}z^{\\ast} = y + x\\mathrm{i}$ and $${lhs} = (${expr([[al, "x"], [be, "y"]])}) + (${expr([[be, "x"], [al, "y"]])})\\mathrm{i}$.`,
          `Equate real parts: $${expr([[al, "x"], [be, "y"]])} = ${p}$. Equate imaginary parts: $${expr([[be, "x"], [al, "y"]])} = ${q}$.`,
          `Multiply the first equation by $${al}$ and the second by $${be}$, then subtract: $${coef(det, "x")} = ${al * p - be * q}$, so $x = ${x}$.`]),
        P("Find the value of $y$.", 3, ans.int(y), [`Substitute $x = ${x}$ into $${expr([[al, "x"], [be, "y"]])} = ${p}$: $${coef(be, "y")} = ${p - al * x}$`, `$y = ${y}$`])] };
    } });
  reg({ ...CC, unknown: "modulus-argument-values", levels: [4], calculator: true, skills: ["AHL1.12.modulus-argument-values", "AHL1.12.arithmetic"], title: "Modulus and argument of two numbers and their product",
    build({ rng }) {
      let a, b, c, d, t;
      const arg = (x, y) => Math.atan2(y, x);
      do { a = rng.nonzero(-6, 6); b = rng.nonzero(-6, 6); c = rng.nonzero(-5, 5); d = rng.nonzero(-5, 5); t = arg(a * c - b * d, a * d + b * c); }
      while (Math.abs(Math.abs(t) - Math.PI) < 0.06 || Math.abs(t) < 0.06 || Number.isInteger(Math.sqrt(a * a + b * b)) || Math.abs(a) === Math.abs(b) || a * c === b * d || a * d === -b * c);
      const mz = Math.hypot(a, b), mw = Math.hypot(c, d), re = a * c - b * d, im = a * d + b * c, quad = (x, y) => (x > 0 ? (y > 0 ? "first" : "fourth") : y > 0 ? "second" : "third");
      return { params: { a, b, c, d }, stem: `Let $z = ${cx(a, b)}$ and $w = ${cx(c, d)}$. All arguments are in radians, with $-\\pi < \\arg z \\le \\pi$.`, parts: [
        P("Find $|z|$.", 1, ans.sf(mz), [`$|z| = \\sqrt{${br(a)}^{2} + ${br(b)}^{2}} = \\sqrt{${a * a + b * b}} \\approx ${sf(mz)}$`]),
        P("Find $\\arg z$.", 2, ans.sf(arg(a, b)), [`$z$ is in the ${quad(a, b)} quadrant of the Argand diagram.`, `$\\arg z \\approx ${sf(arg(a, b))}$, from the calculator or from $\\tan^{-1}\\left(${frac(b, a)}\\right)$ adjusted for the quadrant.`]),
        P("Find $|zw|$.", 1, ans.sf(mz * mw), [`$|zw| = |z||w| = \\sqrt{${a * a + b * b}} \\times \\sqrt{${c * c + d * d}} \\approx ${sf(mz * mw)}$`]),
        P("Find $\\arg(zw)$.", 2, ans.sf(t), [`$zw = ${cx(re, im)}$, which is in the ${quad(re, im)} quadrant.`, `$\\arg(zw) \\approx ${sf(t)}$`])] };
    } });

  // ---- exact trigonometry at multiples of pi/6 and pi/4, and angles as rational multiples of pi ----
  const COS = { 0: [1, 1, 1], 30: [1, 2, 3], 45: [1, 2, 2], 60: [1, 2, 1], 90: [0, 1, 1] };    // [n, d, s]: n sqrt(s) / d
  function cosDeg(deg) {
    deg = ((Math.round(deg) % 360) + 360) % 360;
    if (deg > 180) deg = 360 - deg;
    const neg = deg > 90, [n, d, s] = COS[neg ? 180 - deg : deg];
    return [neg ? -n : n, d, n === 0 ? 1 : s];
  }
  const sinDeg = (deg) => cosDeg(90 - deg);
  // k times n sqrt(s) / d: its value, its LaTeX and (when rational) the fraction
  function surdQ(k, [n, d, s]) {
    const q = rat.Q(k * n, d), v = (q.n / q.d) * Math.sqrt(s);
    if (q.n === 0 || s === 1) return { v, tex: rat.tex(q), q };
    const top = (Math.abs(q.n) === 1 ? "" : Math.abs(q.n)) + `\\sqrt{${s}}`;
    return { v, tex: (q.n < 0 ? "-" : "") + (q.d === 1 ? top : `\\dfrac{${top}}{${q.d}}`) };
  }
  const ansS = (x) => (x.q ? ansQ(x.q) : ans.exact(x.v, x.tex));
  const negT = (tex) => (tex.startsWith("-") ? `\\left(${tex}\\right)` : tex);
  const princ = (t) => { let v = rat.Q(t); while (rat.num(v) > 1) v = rat.sub(v, 2); while (rat.num(v) <= -1) v = rat.add(v, 2); return v; };
  const piT = (t) => piFrac(t.n, t.d);
  const degOf = (t) => (180 * t.n) / t.d;
  const ansArg = (t) => (t.n === 0 ? ans.int(0) : ans.exact(rat.num(t) * Math.PI, piT(t)));
  const angT = (t) => (t.n < 0 ? `\\left(${piT(t)}\\right)` : ` ${piT(t)}`);
  const cisT = (r, t) => `${r === 1 ? "" : r}\\left(\\cos${angT(t)} + ${I}\\sin${angT(t)}\\right)`;
  const eulT = (r, t) => { const top = (Math.abs(t.n) === 1 ? "" : Math.abs(t.n)) + "\\pi" + I; return `${r === 1 ? "" : r}\\mathrm{e}^{${t.n < 0 ? "-" : ""}${t.d === 1 ? top : `\\frac{${top}}{${t.d}}`}}`; };
  const NICE12 = [-10, -9, -8, -6, -4, -3, -2, 2, 3, 4, 6, 8, 9, 10];       // multiples of pi/12 that are multiples of pi/6 or pi/4
  const wrapLine = (raw, t, what) => (rat.num(raw) === rat.num(t) ? [] : [`This is outside $-\\pi < \\theta \\le \\pi$. ${rat.num(raw) > 0 ? "Subtracting" : "Adding"} ${Math.abs(rat.num(raw) - rat.num(t)) > 2.5 ? "a multiple of $2\\pi$" : "$2\\pi$"} gives $${what} = ${piT(t)}$.`]);
  // a complex number whose modulus and argument are exact: parts are [c, s] meaning c sqrt(s)
  const sT = ([c, s]) => surd(s, Math.abs(c));
  const sV = ([c, s]) => c * Math.sqrt(s);
  function cxs(a, b) {
    let out = a[0] ? (a[0] < 0 ? "-" : "") + sT(a) : "";
    if (b[0]) { const mag = (b[1] === 1 ? (Math.abs(b[0]) === 1 ? "" : Math.abs(b[0])) : sT(b) + "\\,") + I; out += out ? (b[0] < 0 ? " - " : " + ") + mag : (b[0] < 0 ? "-" : "") + mag; }
    return out || "0";
  }
  function cartForm(rng, ks) {
    const fam = rng.int(0, 2), k = rng.pick(ks), sa = rng.sign(), sb = rng.sign();
    const a = [sa * k, fam === 1 ? 3 : 1], b = [sb * k, fam === 2 ? 3 : 1], alpha = [rat.Q(1, 4), rat.Q(1, 6), rat.Q(1, 3)][fam];
    const t = sa > 0 ? (sb > 0 ? alpha : rat.neg(alpha)) : sb > 0 ? rat.sub(1, alpha) : rat.sub(alpha, 1);
    const a2 = a[0] * a[0] * a[1], b2 = b[0] * b[0] * b[1], r = fam === 0 ? [k, 2] : [2 * k, 1];
    const quad = sa > 0 ? (sb > 0 ? "first" : "fourth") : sb > 0 ? "second" : "third";
    const modW = [`$|z| = \\sqrt{${a2} + ${b2}} = \\sqrt{${a2 + b2}}${sT(r) === `\\sqrt{${a2 + b2}}` ? "" : ` = ${sT(r)}`}$`];
    const argW = [`Let $\\alpha$ be the acute angle with $\\tan\\alpha = ${["1", "\\dfrac{1}{\\sqrt{3}}", "\\sqrt{3}"][fam]}$, so $\\alpha = ${piT(alpha)}$.`,
      `$z$ is in the ${quad} quadrant, so $\\arg z = ${{ first: "\\alpha", second: "\\pi - \\alpha", third: "-(\\pi - \\alpha)", fourth: "-\\alpha" }[quad]} = ${piT(t)}$.`];
    return { fam, a, b, t, r, tex: cxs(a, b), modW, argW };
  }

  // ======================= 1.13 modulus-argument and Euler forms =======================
  const CP = { type: "t1-ahl-complex-polar", syllabus: ["1.13"], representation: "equation", format: "value" };
  reg({ ...CP, unknown: "polar-to-cartesian", levels: [1], skills: ["AHL1.13.polar-to-cartesian"], title: "Modulus-argument form to Cartesian form",
    build({ rng }) {
      const R = rng.pick([2, 4, 6, 8, 10]), t = rat.Q(rng.pick(NICE12), 12), dg = degOf(t), re = surdQ(R, cosDeg(dg)), im = surdQ(R, sinDeg(dg));
      return { params: { R, t: rat.num(t) }, stem: `Let $z = ${cisT(R, t)}$.`, parts: [
        P("Find the exact value of the real part of $z$.", 1, ansS(re), [`$\\cos${angT(t)} = ${surdQ(1, cosDeg(dg)).tex}$, so the real part is $${R} \\times ${negT(surdQ(1, cosDeg(dg)).tex)} = ${re.tex}$.`]),
        P("Find the exact value of the imaginary part of $z$.", 1, ansS(im), [`$\\sin${angT(t)} = ${surdQ(1, sinDeg(dg)).tex}$, so the imaginary part is $${R} \\times ${negT(surdQ(1, sinDeg(dg)).tex)} = ${im.tex}$.`])] };
    } });
  reg({ ...CP, unknown: "cartesian-to-polar", levels: [2], skills: ["AHL1.13.cartesian-to-polar"], title: "Cartesian form to modulus and argument",
    build({ rng }) {
      const f = cartForm(rng, [1, 2, 3, 4]);
      return { params: { a: sV(f.a), b: sV(f.b) }, stem: `Let $z = ${f.tex}$.`, parts: [
        P("Find the exact value of $|z|$.", 2, f.r[1] === 1 ? ans.int(f.r[0]) : ans.exact(sV(f.r), sT(f.r)), f.modW),
        P("Find the exact value of $\\arg z$, where $-\\pi < \\arg z \\le \\pi$.", 2, ansArg(f.t), f.argW)] };
    } });
  reg({ ...CP, unknown: "rotation-enlargement", representation: "words", levels: [2], skills: ["AHL1.13.geometric-interpretation", "AHL1.13.cartesian-to-polar"], title: "Multiplication as an enlargement and a rotation",
    build({ rng }) {
      // [w, a^2, b^2, modulus as [c, s], argument over pi]
      const [w, a2, b2, r, tq] = rng.pick([[cx(1, 1), 1, 1, [1, 2], [1, 4]], [cx(0, 2), 0, 4, [2, 1], [1, 2]], [cx(-1, 1), 1, 1, [1, 2], [3, 4]], ["-3", 9, 0, [3, 1], [1, 1]], [cx(2, 2), 4, 4, [2, 2], [1, 4]],
        [cxs([1, 3], [1, 1]), 3, 1, [2, 1], [1, 6]], [cxs([1, 1], [1, 3]), 1, 3, [2, 1], [1, 3]], [cxs([-1, 1], [1, 3]), 1, 3, [2, 1], [2, 3]], [cx(0, 3), 0, 9, [3, 1], [1, 2]], [cx(-2, 2), 4, 4, [2, 2], [3, 4]],
        [cxs([-1, 3], [1, 1]), 3, 1, [2, 1], [5, 6]], ["-2", 4, 0, [2, 1], [1, 1]]]);
      const t = rat.Q(tq[0], tq[1]), mz = rng.pick([2, 3, 5]), big = [r[0] * mz, r[1]], ex = (x) => (x[1] === 1 ? ans.int(x[0]) : ans.exact(sV(x), sT(x)));
      const where = b2 === 0 ? "on the negative real axis" : a2 === 0 ? "on the positive imaginary axis" : /^-/.test(w) ? "in the second quadrant" : "in the first quadrant";
      return { params: { a2, b2, neg: /^-/.test(w), mz },
        stem: `Let $w = ${w}$. In an Argand diagram the point $\\mathrm{A}$ represents a complex number $z$, and the point $\\mathrm{B}$ represents $wz$. The point $\\mathrm{A}$ is mapped to $\\mathrm{B}$ by an enlargement with centre the origin and scale factor $k$, followed by an anticlockwise rotation about the origin through an angle $\\theta$, where $0 < \\theta \\le \\pi$.`,
        parts: [
          P("Find the exact value of $k$.", 1, ex(r), [`Multiplying by $w$ multiplies the modulus by $|w|$, so $k = |w| = \\sqrt{${a2} + ${b2}}${sT(r) === `\\sqrt{${a2 + b2}}` ? "" : ` = ${sT(r)}`}$.`]),
          P("Find the exact value of $\\theta$.", 2, ansArg(t), [`Multiplying by $w$ adds $\\arg w$ to the argument, so $\\theta = \\arg w$.`, `$w$ lies ${where}, so $\\theta = ${piT(t)}$.`]),
          P(`Given that $|z| = ${mz}$, find the exact value of $|wz|$.`, 1, ex(big), [`$|wz| = |w||z| = ${sT(r)} \\times ${mz} = ${sT(big)}$`])] };
    } });
  reg({ ...CP, unknown: "multiply-divide-polar", levels: [3], skills: ["AHL1.13.multiply-divide-polar"], title: "Product and quotient in Euler form, with principal arguments",
    build({ rng }) {
      let r1, r2, t1, t2, s, d, rs, rd;
      do {
        r1 = rng.pick([2, 3, 4, 6, 8]); r2 = rng.pick([2, 3, 4, 5]); t1 = rat.Q(rng.pick(NICE12), 12); t2 = rat.Q(rng.pick(NICE12), 12);
        rs = rat.add(t1, t2); rd = rat.sub(t1, t2); s = princ(rs); d = princ(rd);
      } while (r1 === r2 || s.n === 0 || d.n === 0 || rat.num(s) === 1 || rat.num(d) === 1 || (rat.num(rs) === rat.num(s) && rat.num(rd) === rat.num(d)));
      return { params: { r1, r2, t1: rat.num(t1), t2: rat.num(t2) },
        stem: `Let $z_{1} = ${eulT(r1, t1)}$ and $z_{2} = ${eulT(r2, t2)}$. All arguments are to be given in the interval $-\\pi < \\theta \\le \\pi$.`,
        parts: [
          P("Find $|z_{1}z_{2}|$.", 1, ans.int(r1 * r2), [`The moduli multiply: $${r1} \\times ${r2} = ${r1 * r2}$`]),
          P("Find the exact value of $\\arg(z_{1}z_{2})$.", 2, ansArg(s), [`The arguments add: $${piT(t1)} + ${negT(piT(t2))} = ${piT(rs)}$`, ...wrapLine(rs, s, "\\arg(z_{1}z_{2})")]),
          P("Find $\\left|\\dfrac{z_{1}}{z_{2}}\\right|$.", 1, ans.frac(r1, r2), [`The moduli divide: $${r1 % r2 === 0 ? `${r1} \\div ${r2} = ${r1 / r2}` : `\\dfrac{${r1}}{${r2}}${gcd(r1, r2) > 1 ? ` = ${frac(r1, r2)}` : ""}`}$`]),
          P("Find the exact value of $\\arg\\left(\\dfrac{z_{1}}{z_{2}}\\right)$.", 2, ansArg(d), [`The arguments subtract: $${piT(t1)} - ${negT(piT(t2))} = ${piT(rd)}$`, ...wrapLine(rd, d, "\\arg\\left(\\dfrac{z_{1}}{z_{2}}\\right)")])] };
    } });
  reg({ ...CP, unknown: "polar-calculator", levels: [4], calculator: true, skills: ["AHL1.13.polar-to-cartesian", "AHL1.13.multiply-divide-polar", "AHL1.13.cartesian-to-polar"], title: "Mixed forms with a calculator: parts, modulus and argument of a product",
    build({ rng }) {
      let a, b, r, th, az, raw, t;
      do {
        a = rng.nonzero(-6, 6); b = rng.nonzero(-6, 6); r = rng.pick([1.5, 2, 2.5, 3, 4]); th = rng.pick([0.4, 0.7, 1.1, 1.3, 1.8, 2.2, 2.5, 2.9]) * rng.sign();
        az = Math.atan2(b, a); raw = az + th; t = raw > Math.PI ? raw - 2 * Math.PI : raw <= -Math.PI ? raw + 2 * Math.PI : raw;
      } while (Math.abs(Math.abs(raw) - Math.PI) < 0.08 || Math.abs(t) < 0.08 || Math.abs(a) === Math.abs(b) || Number.isInteger(Math.hypot(a, b)));
      const thT = th < 0 ? `(${num(th)})` : ` ${num(th)}`, mz = Math.hypot(a, b);
      return { params: { a, b, r, th },
        stem: `Let $z = ${cx(a, b)}$ and $w = ${num(r)}\\left(\\cos${thT} + ${I}\\sin${thT}\\right)$. Angles are in radians and arguments are in the interval $-\\pi < \\theta \\le \\pi$.`,
        parts: [
          P("Find the real part of $w$.", 1, ans.sf(r * Math.cos(th)), [`$${num(r)}\\cos${thT} \\approx ${sf(r * Math.cos(th))}$`]),
          P("Find the imaginary part of $w$.", 1, ans.sf(r * Math.sin(th)), [`$${num(r)}\\sin${thT} \\approx ${sf(r * Math.sin(th))}$`]),
          P("Find $|zw|$.", 2, ans.sf(mz * r), [`$|z| = \\sqrt{${br(a)}^{2} + ${br(b)}^{2}} = \\sqrt{${a * a + b * b}}$ and $|w| = ${num(r)}$.`, `$|zw| = |z||w| = \\sqrt{${a * a + b * b}} \\times ${num(r)} \\approx ${sf(mz * r)}$`]),
          P("Find $\\arg z$.", 1, ans.sf(az), [`$\\arg z \\approx ${sf(az)}$, from the calculator. Check the quadrant: the real part is ${a > 0 ? "positive" : "negative"} and the imaginary part is ${b > 0 ? "positive" : "negative"}.`]),
          P("Find $\\arg(zw)$.", 2, ans.sf(t), [`$\\arg z + \\arg w \\approx ${sf(az, 4)} + ${paren(th)} = ${sf(raw, 4)}$`,
            raw === t ? `This is in the interval, so $\\arg(zw) \\approx ${sf(t)}$.` : `This is outside the interval, so ${raw > 0 ? "subtract" : "add"} $2\\pi$: $\\arg(zw) \\approx ${sf(t)}$`])] };
    } });

  // ======================= 1.14 De Moivre, powers and roots =======================
  const DM = { type: "t1-ahl-de-moivre", syllabus: ["1.14"], representation: "equation", format: "value" };
  reg({ ...DM, unknown: "power", levels: [2], skills: ["AHL1.14.de-moivre-power"], title: "A power of a number in modulus-argument form",
    build({ rng }) {
      let R, t, n, raw, tn;
      do { R = rng.pick([2, 2, 3]); t = rat.Q(rng.pick(NICE12), 12); n = rng.int(3, R === 2 ? 6 : 5); raw = rat.mul(t, n); tn = princ(raw); } while (rat.num(raw) === rat.num(tn));
      const M = Math.pow(R, n), re = surdQ(M, cosDeg(degOf(tn)));
      return { params: { R, t: rat.num(t), n }, stem: `Let $z = ${cisT(R, t)}$.`, parts: [
        P(`Find $|z^{${n}}|$.`, 1, ans.int(M), [`By De Moivre's theorem, $z^{${n}} = ${R}^{${n}}\\left(\\cos ${n}\\theta + ${I}\\sin ${n}\\theta\\right)$ with $\\theta = ${piT(t)}$.`, `$|z^{${n}}| = ${R}^{${n}} = ${M}$`]),
        P(`Find the exact value of $\\arg(z^{${n}})$, where $-\\pi < \\arg(z^{${n}}) \\le \\pi$.`, 2, ansArg(tn), [`$${n} \\times ${negT(piT(t))} = ${piT(raw)}$`, ...wrapLine(raw, tn, `\\arg(z^{${n}})`)]),
        P(`Find the exact value of the real part of $z^{${n}}$.`, 1, ansS(re), [`$${M}\\cos${angT(tn)} = ${M} \\times ${negT(surdQ(1, cosDeg(degOf(tn))).tex)} = ${re.tex}$`])] };
    } });
  reg({ ...DM, unknown: "cartesian-power", levels: [3], skills: ["AHL1.14.de-moivre-power", "AHL1.13.cartesian-to-polar"], title: "A power of a number given in Cartesian form",
    build({ rng }) {
      const f = cartForm(rng, [1]), n = f.fam === 0 ? rng.pick([4, 6, 8, 10]) : rng.int(3, 6), M = f.fam === 0 ? Math.pow(2, n / 2) : Math.pow(2, n);
      const raw = rat.mul(f.t, n), tn = princ(raw), dg = degOf(tn), re = surdQ(M, cosDeg(dg)), im = surdQ(M, sinDeg(dg)), rT = sT(f.r);
      return { params: { a: sV(f.a), b: sV(f.b), n }, stem: `Let $z = ${f.tex}$.`, parts: [
        P("Find the exact value of $|z|$.", 1, f.r[1] === 1 ? ans.int(f.r[0]) : ans.exact(sV(f.r), rT), f.modW),
        P("Find the exact value of $\\arg z$, where $-\\pi < \\arg z \\le \\pi$.", 2, ansArg(f.t), f.argW),
        P(`Find the exact value of the real part of $z^{${n}}$.`, 2, ansS(re), [
          `By De Moivre's theorem, $|z^{${n}}| = ${/sqrt/.test(rT) ? `\\left(${rT}\\right)` : rT}^{${n}} = ${M}$ and $\\arg(z^{${n}}) = ${n} \\times ${negT(piT(f.t))} = ${piT(raw)}$.`,
          ...(rat.num(raw) === rat.num(tn) ? [] : [`This is the same direction as the angle $${piT(tn)}$.`]),
          `The real part is $${M}\\cos${angT(tn)} = ${re.tex}$.`]),
        P(`Find the exact value of the imaginary part of $z^{${n}}$.`, 1, ansS(im), [`The imaginary part is $${M}\\sin${angT(tn)} = ${im.tex}$.`])] };
    } });
  reg({ ...DM, unknown: "nth-roots", levels: [3], skills: ["AHL1.14.nth-roots", "AHL1.14.roots-geometry"], title: "Roots of a complex number and the polygon they form",
    build({ rng }) {
      const [n, R] = rng.pick([[3, 2], [3, 3], [3, 2], [4, 2], [4, 3], [6, 2]]), al = rat.Q(rng.pick(n === 6 ? [0, 2] : [0, 1, 2, -1]), 2), W = Math.pow(R, n);
      const wT = al.n === 0 ? `${W}` : rat.num(al) === 1 ? `-${W}` : `${al.n < 0 ? "-" : ""}${W}${I}`;
      let best = null;
      for (let j = 0; j < n; j++) { const th = princ(rat.Q(rat.add(al, 2 * j), n)); if (th.n > 0 && (!best || rat.num(th) < rat.num(best))) best = th; }
      const step = rat.Q(2, n), sn = sinDeg(360 / n), sinT = surdQ(1, sn), area = surdQ(n * R * R, [sn[0], 2 * sn[1], sn[2]]);
      const base = rat.Q(al, n), shape = { 3: "an equilateral triangle", 4: "a square", 6: "a regular hexagon" }[n];
      return { params: { n, W, al: rat.num(al) }, stem: `Consider the equation $z^{${n}} = ${wT}$, where $z \\in \\mathbb{C}$.`, parts: [
        P("All the roots have the same modulus. Find it.", 1, ans.int(R), [`$|z|^{${n}} = ${W}$, so $|z| = ${R}$.`]),
        P("Each root is written as $r\\left(\\cos\\theta + \\mathrm{i}\\sin\\theta\\right)$ with $-\\pi < \\theta \\le \\pi$. Find the smallest positive value of $\\theta$.", 2, ansArg(best), [
          `$${wT} = ${cisT(W, al)}$`,
          `By De Moivre's theorem the arguments of the roots are $${base.n === 0 ? "" : piT(base) + " + "}\\dfrac{${step.n === 1 ? "" : step.n}k\\pi}{${step.d}}$, for integer values of $k$.`,
          `The smallest positive one in the interval is $${piT(best)}$.`]),
        P("The roots are the vertices of a polygon in an Argand diagram. Find the exact area of this polygon.", 3, ansS(area), [
          `The $${n}$ roots are equally spaced on a circle with centre the origin and radius $${R}$, so they form ${shape}.`,
          `Joining the vertices to the origin gives $${n}$ triangles, each with area $\\dfrac{1}{2} \\times ${R}^{2} \\times \\sin ${piT(step)}$.`,
          `Area $= ${n} \\times \\dfrac{1}{2} \\times ${R * R} \\times ${sinT.tex} = ${area.tex}$`])] };
    } });
  reg({ ...DM, unknown: "least-power-real", levels: [4], calculator: true, skills: ["AHL1.14.de-moivre-power"], title: "The least power that gives a real number",
    build({ rng }) {
      let q, p, n;
      do { q = rng.pick([5, 7, 8, 9, 10, 12]); p = rng.int(1, q - 1); } while (gcd(p, q) !== 1);
      const r = rng.pick([0.8, 0.9, 1.1, 1.2, 1.3]), mm = rng.int(3, 5), pos = rng.bool();
      for (n = 1; (n * p) % (pos ? 2 * q : q) !== 0; n++);
      const turns = (n * p) / q, val = Math.pow(r, n) * (turns % 2 === 0 ? 1 : -1), ang = `\\dfrac{${p === 1 ? "" : p}\\pi}{${q}}`;
      return { params: { q, p, r, mm, pos }, stem: `Let $z = ${num(r)}\\left(\\cos ${ang} + ${I}\\sin ${ang}\\right)$.`, parts: [
        P(`Find $|z^{${mm}}|$.`, 2, ans.sf(Math.pow(r, mm)), [`By De Moivre's theorem, $|z^{${mm}}| = ${num(r)}^{${mm}}$`, `$\\approx ${sf(Math.pow(r, mm))}$`]),
        P(`Find the least positive integer $n$ for which $z^{n}$ is a ${pos ? "positive real number" : "real number"}.`, 2, ans.int(n), [
          `$\\arg(z^{n}) = \\dfrac{${p === 1 ? "" : p}n\\pi}{${q}}$`,
          `$z^{n}$ is ${pos ? "a positive real number when this is a multiple of $2\\pi$" : "real when this is a multiple of $\\pi$"}, so $${coef(p, "n")}$ must be a multiple of $${pos ? 2 * q : q}$.`,
          `The least such value is $n = ${n}$.`]),
        P("For this value of $n$, find $z^{n}$.", 2, ans.sf(val), [`$z^{${n}} = ${num(r)}^{${n}}\\left(\\cos ${piFrac(turns, 1)} + ${I}\\sin ${piFrac(turns, 1)}\\right) = ${turns % 2 === 0 ? "" : "-"}${num(r)}^{${n}}$`, `$\\approx ${sf(val)}$`])] };
    } });
  const CR = { type: "t1-ahl-conjugate-roots", syllabus: ["1.14"], representation: "equation", format: "value" };
  reg({ ...CR, unknown: "write-conjugate-root", levels: [1], skills: ["AHL1.14.conjugate-root"], title: "Write down the other root of a real quadratic",
    build({ rng }) {
      const p = rng.nonzero(-6, 6), q = rng.nonzero(-6, 6);
      return { params: { p, q },
        stem: `The equation $z^{2} + bz + c = 0$, where $b, c \\in \\mathbb{R}$, has a root $z = ${cx(p, q)}$.`,
        parts: [
          P("Write down the real part of the other root.", 1, ans.int(p, { misconceptions: [{ value: -p, text: "The conjugate keeps the real part and changes the sign of the imaginary part." }] }), [`The coefficients are real, so the roots are a conjugate pair. The other root is $${cx(p, -q)}$, with real part $${p}$.`]),
          P("Write down the imaginary part of the other root.", 1, ans.int(-q), [`The other root is $${cx(p, -q)}$, with imaginary part $${-q}$.`])] };
    } });
  reg({ ...CR, unknown: "cubic-coefficients", levels: [2], skills: ["AHL1.14.conjugate-root"], title: "Conjugate root of a real cubic, then two coefficients",
    build({ rng }) {
      const p = rng.nonzero(-4, 4), q = rng.int(1, 4), r = rng.nonzero(-5, 5), N = p * p + q * q;
      return { params: { p, q, r },
        stem: `The equation $z^{3} + az^{2} + bz + c = 0$, where $a, b, c \\in \\mathbb{R}$, has roots $z_{1} = ${cx(p, q)}$, $z_{2}$ and $z_{3} = ${r}$, where $z_{2}$ is not real.`,
        parts: [
          P("Write down the imaginary part of $z_{2}$.", 1, ans.int(-q), [`The coefficients are real, so the non-real roots are a conjugate pair: $z_{2} = ${cx(p, -q)}$.`]),
          P("Find the value of $a$.", 2, ans.int(-(2 * p + r), 2 * p + r === 0 ? {} : { misconceptions: [{ value: 2 * p + r, text: "The sum of the roots is $-a$, not $a$." }] }), [
            `The sum of the roots is $-a$: $(${cx(p, q)}) + (${cx(p, -q)}) + ${paren(r)} = ${2 * p + r}$`, `$a = ${-(2 * p + r)}$`]),
          P("Find the value of $c$.", 1, ans.int(-r * N), [`The product of the roots is $-c$: $(${cx(p, q)})(${cx(p, -q)})${br(r)} = ${N}${br(r)} = ${N * r}$, so $c = ${-r * N}$.`])] };
    } });
  reg({ ...CR, unknown: "find-real-root", levels: [3], skills: ["AHL1.14.conjugate-root", "AHL2.12.sum-product-roots"], title: "One complex root given: find the real root and the coefficients",
    build({ rng }) {
      let p, q, r;
      do { p = rng.nonzero(-4, 4); q = rng.int(1, 4); r = rng.nonzero(-5, 5); } while (2 * p + r === 0);
      const N = p * p + q * q, a = -(2 * p + r), b = N + 2 * p * r, c = -r * N;
      return { params: { p, q, a },
        stem: `The equation $${expr([[1, "z^{3}"], [a, "z^{2}"], [1, "bz"], [1, "c"]])} = 0$, where $b, c \\in \\mathbb{R}$, has a root $z = ${cx(p, q)}$.`,
        parts: [
          P("Find the real root of the equation.", 3, ans.int(r), [
            `The coefficients are real, so $${cx(p, -q)}$ is also a root.`, `The sum of the three roots is $${-a}$, the negative of the coefficient of $z^{2}$.`,
            `$(${cx(p, q)}) + (${cx(p, -q)}) = ${2 * p}$, so the real root is $${-a} - ${paren(2 * p)} = ${r}$.`]),
          P("Find the value of $b$.", 2, ans.int(b), [
            `The two complex roots give the quadratic factor $${poly([1, -2 * p, N], "z")}$, so the cubic is $${factor(r, "z")}(${poly([1, -2 * p, N], "z")})$.`,
            `The coefficient of $z$ is $b = ${N} + ${br(-r)}${br(-2 * p)} = ${b}$.`]),
          P("Find the value of $c$.", 2, ans.int(c), [`The constant term is $c = ${br(-r)}${br(N)} = ${c}$.`])] };
    } });

  // ======================= 1.15 proof =======================
  const PI = { type: "t1-ahl-proof-induction", syllabus: ["1.15"], representation: "equation", format: "value" };
  const ZP = "n \\in \\mathbb{Z}^{+}";
  const CLOSE = `The statement is true for $n = 1$, and if it is true for $n = k$ then it is true for $n = k + 1$. By mathematical induction it is true for all $${ZP}$.`;
  const MODEL = "A complete proof shows the base case, states the assumption for $n = k$, deduces the result for $n = k + 1$ and ends with a conclusion. Compare your proof with the worked solution.";
  reg({ ...PI, unknown: "series", levels: [3], skills: ["AHL1.15.induction-series", "AHL1.15.induction-structure"], title: "Induction for the sum of a series",
    build({ rng }) {
      const fam = rng.int(0, 1), sum = (top, term) => `\\displaystyle\\sum_{r=1}^{${top}} ${term}`;
      let a = 0, b = 0, c = 0, term, rhs, rhs1, first, form, p, bW, cW;
      if (fam === 0) {
        do { a = rng.pick([3, 5, 7]); b = rng.nonzero(-3, 5); } while (a + 2 * b === 0 || a + b === 0);
        const e = a + 2 * b, qq = 2 * a + 2 * b;
        term = `(${lin(a, b, "r")})`; first = a + b; p = 3 * a + 2 * b;
        rhs = (v) => `\\dfrac{${v}(${lin(a, e, v)})}{2}`; rhs1 = `\\dfrac{${a} ${signed(e)}}{2}`; form = `\\dfrac{${a}k^{2} + pk + q}{2}`;
        bW = [`The next term is $${a}(k + 1) ${signed(b)} = ${lin(a, a + b, "k")}$.`, `$${rhs("k")} + ${lin(a, a + b, "k")} = \\dfrac{${poly([a, e, 0], "k")} + ${poly([2 * a, qq], "k")}}{2}$`, `$= \\dfrac{${poly([a, p, qq], "k")}}{2}$, so $p = ${p}$.`];
        cW = [`$= \\dfrac{${poly([a, p, qq], "k")}}{2} = \\dfrac{(k + 1)(${lin(a, qq, "k")})}{2} = \\dfrac{(k + 1)\\left(${a}(k + 1) ${signed(e)}\\right)}{2}$`];
      } else {
        c = rng.pick([2, 4, 6, 8]);
        const e = 1 + 3 * c, qq = 6 + 6 * c;
        term = `r(r + ${c})`; first = 1 + c; p = 7 + 3 * c;
        rhs = (v) => `\\dfrac{${v}(${v} + 1)(2${v} + ${e})}{6}`; rhs1 = `\\dfrac{2 \\times ${2 + e}}{6}`; form = "\\dfrac{(k + 1)\\left(2k^{2} + pk + q\\right)}{6}";
        bW = [`The next term is $(k + 1)(k + ${1 + c})$.`, `$${rhs("k")} + (k + 1)(k + ${1 + c}) = \\dfrac{(k + 1)\\left[k(2k + ${e}) + 6(k + ${1 + c})\\right]}{6}$`, `$= \\dfrac{(k + 1)\\left(2k^{2} + ${p}k + ${qq}\\right)}{6}$, so $p = ${p}$.`];
        cW = [`$= \\dfrac{(k + 1)\\left(2k^{2} + ${p}k + ${qq}\\right)}{6} = \\dfrac{(k + 1)(k + 2)(2k + ${e + 2})}{6} = \\dfrac{(k + 1)\\left((k + 1) + 1\\right)\\left(2(k + 1) + ${e}\\right)}{6}$`];
      }
      return { params: { fam, a, b, c },
        stem: `Consider the statement $${sum("n", term)} = ${rhs("n")}$, for all $${ZP}$.`,
        parts: [
          P("Find the value of the left-hand side when $n = 1$.", 1, ans.int(first), [`When $n = 1$ the sum has one term, with $r = 1$: its value is $${first}$.`]),
          P(`Assume that the statement is true for $n = k$. After the next term is added, the sum of the first $k + 1$ terms can be written as $${form}$, where $p$ and $q$ are integers. Find the value of $p$.`, 2, ans.int(p), bW),
          P("Use mathematical induction to prove the statement.", 4, ans.self(MODEL), [
            `Base case: when $n = 1$ the left-hand side is $${first}$ and the right-hand side is $${rhs1} = ${first}$, so the statement is true for $n = 1$.`,
            `Assume it is true for $n = k$: $${sum("k", term)} = ${rhs("k")}$.`,
            `Then $${sum("k+1", term)} = ${rhs("k")} + ${fam === 0 ? `(${lin(a, a + b, "k")})` : `(k + 1)(k + ${1 + c})`}$`, ...cW,
            `This is the statement with $n = k + 1$.`, CLOSE])] };
    } });
  reg({ ...PI, unknown: "divisibility", levels: [3], skills: ["AHL1.15.induction-divisibility", "AHL1.15.induction-structure"], title: "Induction for a divisibility result",
    build({ rng }) {
      const d = rng.int(3, 8), a = rng.pick([d + 1, 2 * d + 1].filter((v) => v <= 13)), c0 = d * rng.int(0, 2) - 1, mm = c0 - a * c0, f1 = a + c0;
      const f = (v) => `${a}^{${v}} ${signed(c0)}`;
      return { params: { d, a, c0 },
        stem: `Let $f(n) = ${f("n")}$. Consider the statement: $f(n)$ is divisible by $${d}$, for all $${ZP}$.`,
        parts: [
          P("Find the value of $f(1)$.", 1, ans.int(f1), [`$f(1) = ${a} ${signed(c0)} = ${f1}$`]),
          P(`It can be shown that $f(k + 1) = ${a}f(k) + m$ for all $k \\in \\mathbb{Z}^{+}$, where $m$ is a constant. Find the value of $m$.`, 2, ans.int(mm), [
            `$f(k + 1) = ${f("k+1")} = ${a} \\times ${a}^{k} ${signed(c0)}$`,
            `Since $${a}^{k} = f(k) ${signed(-c0)}$: $f(k + 1) = ${a}\\left(f(k) ${signed(-c0)}\\right) ${signed(c0)} = ${a}f(k) ${signed(mm)}$`, `$m = ${mm}$`]),
          P("Use mathematical induction to prove the statement.", 4, ans.self(MODEL), [
            `Base case: $f(1) = ${f1} = ${d} \\times ${f1 / d}$, which is divisible by $${d}$.`,
            `Assume $f(k)$ is divisible by $${d}$, so $f(k) = ${d}A$ for some integer $A$.`,
            `Then $f(k + 1) = ${a}f(k) ${signed(mm)} = ${a}(${d}A) ${signed(mm)} = ${d}\\left(${a}A ${signed(mm / d)}\\right)$.`,
            `$${a}A ${signed(mm / d)}$ is an integer, so $f(k + 1)$ is divisible by $${d}$.`, CLOSE])] };
    } });
  const PO = { type: "t1-ahl-proof-other", syllabus: ["1.15"] };
  const isPrime = (v) => { if (v < 2) return false; for (let i = 2; i * i <= v; i++) if (v % i === 0) return false; return true; };
  reg({ ...PO, unknown: "counterexample-prime", representation: "equation", format: "mcq", levels: [2], skills: ["AHL1.15.counterexample"], title: "Disprove a claim about primes with a counterexample",
    build({ rng }) {
      const pr = rng.pick([5, 11, 17, 41]), sg = rng.sign(), f = (n) => n * n + sg * n + pr, bad = sg > 0 ? pr - 1 : pr, n0 = rng.int(1, 3), name = rng.pick(NAMES);
      const ex = expr([[1, "n^{2}"], [sg, "n"], [pr, ""]]), opt = (n) => ({ text: `$n = ${n}$`, value: n });
      const wrongs = rng.shuffle([bad - 1, bad - 2, bad - 3, 4, 2, 3].filter((v, i, arr) => v >= 1 && v !== bad && arr.indexOf(v) === i && isPrime(f(v)))).slice(0, 3);
      return { params: { pr, sg, n0 },
        stem: `${name} claims that $${ex}$ is a prime number for every positive integer $n$.`,
        parts: [
          P(`Find the value of $${ex}$ when $n = ${n0}$.`, 1, ans.int(f(n0)), [`$${n0}^{2} ${sg > 0 ? "+" : "-"} ${n0} + ${pr} = ${f(n0)}$, which is prime.`]),
          P("Which value of $n$ gives a counterexample to the claim?", 2, ans.choice(rng, opt(bad), wrongs.map((w) => Object.assign(opt(w), { why: `When $n = ${w}$ the value is $${num(f(w))}$, which is prime, so it agrees with the claim.` }))), [
            `When $n = ${bad}$: $${bad}^{2} ${sg > 0 ? "+" : "-"} ${bad} + ${pr} = ${num(f(bad))}$`, `$${num(f(bad))} = ${pr} \\times ${pr}$, which is not prime, so $n = ${bad}$ is a counterexample.`]),
          P("For this value of $n$, write down the smallest factor of the value of the expression that is greater than $1$.", 1, ans.int(pr), [`$${num(f(bad))} = ${pr}^{2}$, so the smallest factor greater than $1$ is $${pr}$.`])] };
    } });
  reg({ ...PO, unknown: "counterexample-pick", representation: "words", format: "mcq", levels: [1], skills: ["AHL1.15.counterexample"], title: "Choose a counterexample to a general claim",
    build({ rng }) {
      const key = rng.int(0, 5), name = rng.pick(NAMES), HOLD = "For this choice the claim holds, so it does not disprove it.";
      let claim, right, wrongs, work;
      const one = (v, n) => ({ text: `$${v} = ${typeof n === "number" ? n : rat.tex(n)}$`, value: typeof n === "number" ? n : rat.num(n) });
      const pair = (x, y) => ({ text: `$a = ${x}$ and $b = ${y}$`, value: [x, y] });
      if (key === 0) {
        const q = rat.Q(...rng.pick([[1, 2], [1, 3], [3, 4], [1, 4], [2, 3]]));
        claim = "$x^{2} \\ge x$ for all real numbers $x$"; right = one("x", q); wrongs = rng.sample([-3, -2, -1, 0, 1, 2, 3, 5], 3).map((v) => one("x", v));
        work = [`When $x = ${rat.tex(q)}$, $x^{2} = ${rat.tex(rat.mul(q, q))}$, which is less than $${rat.tex(q)}$. So $x^{2} \\ge x$ is false for this value.`];
      } else if (key === 1) {
        const a = rng.int(1, 3), b = -(a + rng.int(1, 3));
        claim = "if $a > b$ then $a^{2} > b^{2}$, for all real numbers $a$ and $b$"; right = pair(a, b); wrongs = rng.sample([[4, 2], [3, 1], [2, -1], [5, -2], [6, 3], [3, 0]], 3).map(([x, y]) => pair(x, y));
        work = [`$${a} > ${b}$ is true, but $a^{2} = ${a * a}$ and $b^{2} = ${b * b}$, so $a^{2} > b^{2}$ is false.`];
      } else if (key === 2) {
        const k = rng.int(2, 9);
        claim = "$\\sqrt{x^{2}} = x$ for all real numbers $x$"; right = one("x", -k); wrongs = [0, k, k + 1].map((v) => one("x", v));
        work = [`When $x = ${-k}$, $\\sqrt{x^{2}} = \\sqrt{${k * k}} = ${k}$, which is not equal to $${-k}$.`];
      } else if (key === 3) {
        const k = rng.int(1, 6);
        claim = "$n^{3} \\ge n^{2}$ for all integers $n$"; right = one("n", -k); wrongs = rng.sample([0, 1, 2, 3, 5], 3).map((v) => one("n", v));
        work = [`When $n = ${-k}$, $n^{3} = ${-k * k * k}$ and $n^{2} = ${k * k}$, so $n^{3} \\ge n^{2}$ is false.`];
      } else if (key === 4) {
        const a = rng.nonzero(-4, 4), b = rng.nonzero(-4, 4), k = rng.int(1, 5);
        claim = "$(a + b)^{2} = a^{2} + b^{2}$ for all real numbers $a$ and $b$"; right = pair(a, b); wrongs = [pair(0, k), pair(k + 1, 0), pair(0, 0)];
        work = [`$(a + b)^{2} = ${br(a + b)}^{2} = ${(a + b) * (a + b)}$, but $a^{2} + b^{2} = ${a * a} + ${b * b} = ${a * a + b * b}$. The two sides are different.`];
      } else {
        claim = "$2^{n} - 1$ is a prime number for every prime number $n$"; right = one("n", 11); wrongs = rng.sample([2, 3, 5, 7, 13], 3).map((v) => one("n", v));
        work = [`$2^{11} - 1 = 2047 = 23 \\times 89$, which is not prime, although $11$ is prime.`];
      }
      return { params: { key }, stem: `${name} makes the following claim: ${claim}.`, parts: [
        P("Which of the following is a counterexample that shows the claim is false?", 2, ans.choice(rng, right, wrongs.map((w) => Object.assign(w, { why: HOLD }))), [
          "A counterexample is one case in which the claim fails.", ...work])] };
    } });
  reg({ ...PO, unknown: "contradiction-linear", representation: "words", format: "value", levels: [3], skills: ["AHL1.15.contradiction"], title: "Proof by contradiction: no integer solutions",
    build({ rng }) {
      let g, p1, q1, r;
      do { g = rng.int(2, 6); p1 = rng.int(1, 5); q1 = rng.int(1, 5); r = rng.int(15, 60); } while (p1 === q1 || gcd(p1, q1) !== 1 || r % g === 0);
      const p = g * p1, q = g * q1, eq = `${p}a + ${q}b = ${r}`;
      return { params: { p, q, r }, stem: `Consider the statement: there are no integers $a$ and $b$ such that $${eq}$.`, parts: [
        P(`Write down the highest common factor of $${p}$ and $${q}$.`, 1, ans.int(g), [`$${p} = ${g} \\times ${p1}$ and $${q} = ${g} \\times ${q1}$, and $${p1}$ and $${q1}$ have no common factor greater than $1$. The highest common factor is $${g}$.`]),
        P(`Find the remainder when $${r}$ is divided by this highest common factor.`, 1, ans.int(r % g), [`$${r} = ${g} \\times ${Math.floor(r / g)} + ${r % g}$, so the remainder is $${r % g}$.`]),
        P("Prove the statement by contradiction.", 3, ans.self(`Assume integers $a$ and $b$ exist. Then the left-hand side is a multiple of $${g}$ but $${r}$ is not, which is a contradiction.`), [
          `Assume, for a contradiction, that there are integers $a$ and $b$ with $${eq}$.`,
          `The left-hand side is $${g}(${expr([[p1, "a"], [q1, "b"]])})$, and $${expr([[p1, "a"], [q1, "b"]])}$ is an integer, so the left-hand side is a multiple of $${g}$.`,
          `But $${r}$ leaves remainder $${r % g}$ when divided by $${g}$, so it is not a multiple of $${g}$.`,
          `This is a contradiction, so there are no such integers $a$ and $b$.`])] };
    } });
  reg({ ...PO, unknown: "contradiction-irrational", representation: "words", format: "mcq", levels: [3], skills: ["AHL1.15.contradiction"], title: "Proof by contradiction: an irrational square root",
    build({ rng }) {
      const p = rng.pick([2, 3, 5, 7, 11, 13]);
      return { params: { p },
        stem: `A proof by contradiction that $\\sqrt{${p}}$ is irrational begins with the assumption that $\\sqrt{${p}} = \\dfrac{a}{b}$, where $a$ and $b$ are positive integers with no common factor greater than $1$.`,
        parts: [
          P("Squaring both sides gives $a^{2} = kb^{2}$. Write down the value of $k$.", 1, ans.int(p), [`$${p} = \\dfrac{a^{2}}{b^{2}}$, so $a^{2} = ${p}b^{2}$ and $k = ${p}$.`]),
          P(`It follows that $a$ is a multiple of $${p}$, so $a = ${p}c$ for some integer $c$. What does this show about $b$?`, 1, ans.choice(rng, { text: `$b$ is also a multiple of $${p}$.`, value: "multiple" }, [
            { text: `$b$ is not a multiple of $${p}$.`, value: "not-multiple", why: `Substituting $a = ${p}c$ gives $b^{2} = ${p}c^{2}$, which makes $b$ a multiple of $${p}$ as well.` },
            { text: "$b$ must be equal to $1$.", value: "one", why: "Nothing forces this value." },
            { text: "$b$ is not an integer.", value: "not-integer", why: "$b$ is an integer by assumption; the contradiction is about common factors." }]), [
            `$(${p}c)^{2} = ${p}b^{2}$ gives $${p * p}c^{2} = ${p}b^{2}$, so $b^{2} = ${p}c^{2}$.`, `So $b^{2}$ is a multiple of $${p}$, and since $${p}$ is prime, $b$ is also a multiple of $${p}$.`]),
          P("Write out the complete proof, stating clearly what is contradicted.", 4, ans.self(`Both $a$ and $b$ are multiples of $${p}$, which contradicts the assumption that they have no common factor greater than $1$.`), [
            `Assume $\\sqrt{${p}} = \\dfrac{a}{b}$, where $a$ and $b$ are positive integers with no common factor greater than $1$.`,
            `Then $a^{2} = ${p}b^{2}$, so $a^{2}$ is a multiple of $${p}$. Since $${p}$ is prime, $a$ is a multiple of $${p}$: $a = ${p}c$ for some integer $c$.`,
            `Then $${p * p}c^{2} = ${p}b^{2}$, so $b^{2} = ${p}c^{2}$ and $b$ is also a multiple of $${p}$.`,
            `So $a$ and $b$ have the common factor $${p}$. This contradicts the assumption that they have no common factor greater than $1$.`,
            `Hence $\\sqrt{${p}}$ cannot be written as a fraction of integers: it is irrational.`])] };
    } });

  // ======================= 1.16 systems of linear equations =======================
  const LS = { type: "t1-ahl-linear-systems", syllabus: ["1.16"], representation: "equation", format: "value" };
  const eqn = (cs, rhs) => `${expr([[cs[0], "x"], [cs[1], "y"], [cs[2], "z"]])} = ${rhs}`;
  const rowOp = (i, k) => (k === 1 ? `(${i}) - (1)` : k === -1 ? `(${i}) + (1)` : k > 0 ? `(${i}) - ${k} \\times (1)` : `(${i}) + ${-k} \\times (1)`);
  const elim = (s) => (s === 1 ? "Subtract the first of these from the second" : s === -1 ? "Add the first of these to the second" : s > 0 ? `Subtract $${s}$ times the first of these from the second` : `Add $${-s}$ times the first of these to the second`);
  const dot = (r, v) => r[0] * v[0] + r[1] * v[1] + r[2] * v[2];
  reg({ ...LS, unknown: "classify", format: "mcq", levels: [1], skills: ["AHL1.16.row-reduction", "AHL1.16.consistency-condition"], title: "Read the number of solutions from a reduced system",
    build({ rng }) {
      const kind = rng.int(0, 2), a = rng.nonzero(-3, 3), b = rng.nonzero(-4, 4), c = rng.nonzero(-3, 3), d1 = rng.int(-6, 9), d2 = rng.int(-6, 9), mm = rng.int(2, 5), z0 = rng.nonzero(-3, 3), k = rng.nonzero(-5, 7);
      const last = kind === 0 ? `${mm}z = ${mm * z0}` : kind === 1 ? `0 = ${k}` : "0 = 0";
      const O = [{ text: "Exactly one solution", value: "one" }, { text: "No solutions", value: "none" }, { text: "Infinitely many solutions", value: "many" }];
      const why = ["The last equation gives one value of $z$, and the other two equations then give one value each for $y$ and $x$.", "An equation that is never true cannot be satisfied.", "The equation $0 = 0$ is always true, so it removes no solutions."];
      return { params: { kind, a, b, c, d1, d2, m: kind === 0 ? mm : 0, n: kind === 0 ? mm * z0 : kind === 1 ? k : 0 },
        stem: `Row operations reduce a system of three linear equations in $x$, $y$ and $z$ to the equations $${eqn([1, a, b], d1)}$, $${eqn([0, 1, c], d2)}$ and $${last}$.`,
        parts: [P("How many solutions does the system have?", 2, ans.choice(rng, O[kind], O.filter((o, i) => i !== kind).map((o) => Object.assign({}, o, { why: why[kind] })).concat([{ text: "Exactly three solutions", value: "three", why: "A linear system has no solutions, exactly one, or infinitely many." }])), [
          kind === 0 ? `The last equation gives $z = ${z0}$. Substituting into $${eqn([0, 1, c], d2)}$ gives one value of $y$, and the first equation then gives one value of $x$.`
            : kind === 1 ? `The last equation, $0 = ${k}$, is never true, so no values of $x$, $y$ and $z$ satisfy all three equations.`
              : `The last equation, $0 = 0$, is always true and gives no information. Two equations in three unknowns remain, so $z$ can take any value.`,
          `The system has ${["exactly one solution", "no solutions", "infinitely many solutions"][kind]}.`])] };
    } });
  reg({ ...LS, unknown: "solve-partly-reduced", levels: [2], skills: ["AHL1.16.solve-unique", "AHL1.16.row-reduction"], title: "Solve a system in which two equations have two unknowns",
    build({ rng }) {
      let a, b, p, q, r, s, x, y, z, det;
      do { a = rng.nonzero(-3, 3); b = rng.nonzero(-3, 3); p = rng.int(1, 4); q = rng.nonzero(-3, 3); r = rng.int(1, 4); s = rng.nonzero(-3, 3); det = p * s - q * r; x = rng.nonzero(-5, 5); y = rng.nonzero(-5, 5); z = rng.nonzero(-5, 5); } while (det === 0 || Math.abs(det) > 12);
      const R = [[1, a, b], [0, p, q], [0, r, s]], d = R.map((row) => dot(row, [x, y, z]));
      return { params: { R, d }, stem: `Consider the system of equations $${eqn(R[0], d[0])}$, $${eqn(R[1], d[1])}$ and $${eqn(R[2], d[2])}$.`, parts: [
        P("Find the value of $y$.", 2, ans.int(y), [
          `Use the second and third equations. Multiply the second by $${s}$ and the third by $${q}$, then subtract to eliminate $z$.`,
          `$${coef(det, "y")} = ${s}${br(d[1])} - ${paren(q)}${br(d[2])} = ${s * d[1] - q * d[2]}$, so $y = ${y}$.`]),
        P("Find the value of $z$.", 1, ans.int(z), [`Substitute $y = ${y}$ into $${eqn(R[1], d[1])}$: $${coef(q, "z")} = ${d[1]} - ${paren(p * y)} = ${d[1] - p * y}$, so $z = ${z}$.`]),
        P("Find the value of $x$.", 1, ans.int(x), [`Substitute into the first equation: $x = ${d[0]} - ${paren(a * y)} - ${paren(b * z)} = ${x}$`])] };
    } });
  const sysSit = (rng) => {
    let a1, b1, m, t, n, s, u;
    do { a1 = rng.nonzero(-2, 3); b1 = rng.nonzero(-3, 3); m = rng.pick([2, 3, -1, -2, 1]); t = rng.nonzero(-3, 3); n = rng.pick([1, 2, 3, -1, -2]); s = rng.pick([2, 3, -1, -2, -3]); u = rng.pick([1, -1, 2, 3, -2]); } while (m === n);
    return { a1, b1, m, t, n, s, u };
  };
  reg({ ...LS, unknown: "solve-unique", levels: [3], skills: ["AHL1.16.solve-unique", "AHL1.16.row-reduction"], title: "Solve three equations in three unknowns by elimination",
    build({ rng }) {
      const { a1, b1, m, t, n, s, u } = sysSit(rng), x = rng.nonzero(-4, 4), y = rng.nonzero(-4, 4), z = rng.nonzero(-4, 4);
      const R = [[1, a1, b1], [m, m * a1 + 1, m * b1 + t], [n, n * a1 + s, n * b1 + s * t + u]], d = R.map((row) => dot(row, [x, y, z])), e2 = d[1] - m * d[0], e3 = d[2] - n * d[0];
      return { params: { R, d }, stem: `Consider the system of equations $${eqn(R[0], d[0])}$, $${eqn(R[1], d[1])}$ and $${eqn(R[2], d[2])}$. Call them equations $(1)$, $(2)$ and $(3)$ in this order.`, parts: [
        P("Find the value of $z$.", 3, ans.int(z), [
          `$${rowOp(2, m)}$ gives $${eqn([0, 1, t], e2)}$.`, `$${rowOp(3, n)}$ gives $${eqn([0, s, s * t + u], e3)}$.`,
          `${elim(s)}: $${coef(u, "z")} = ${e3} - ${paren(s)}${br(e2)} = ${e3 - s * e2}$, so $z = ${z}$.`]),
        P("Find the value of $y$.", 2, ans.int(y), [`From $${eqn([0, 1, t], e2)}$: $y = ${e2} - ${paren(t * z)} = ${y}$`]),
        P("Find the value of $x$.", 2, ans.int(x), [`From equation $(1)$: $x = ${d[0]} - ${paren(a1 * y)} - ${paren(b1 * z)} = ${x}$`])] };
    } });
  reg({ ...LS, unknown: "consistency-condition", levels: [3], skills: ["AHL1.16.consistency-condition", "AHL1.16.general-solution", "AHL1.16.row-reduction"], title: "A parameter for no unique solution, then the general solution",
    build({ rng }) {
      const { a1, b1, m, t, n, s } = sysSit(rng), d1 = rng.int(-4, 6), d2 = rng.int(-4, 8), k0 = n * b1 + s * t, e2 = d2 - m * d1, c0 = n * d1 + s * e2;
      const R1 = [1, a1, b1], R2 = [m, m * a1 + 1, m * b1 + t], third = `${expr([[n, "x"], [n * a1 + s, "y"], [1, "kz"]])} = c`;
      const kz = `\\left(k ${signed(-n * b1)}\\right)z`, cn = `c ${signed(-n * d1)}`;
      return { params: { R1, R2, r3: [n, n * a1 + s], d1, d2 },
        stem: `Consider the system of equations $${eqn(R1, d1)}$, $${eqn(R2, d2)}$ and $${third}$, where $k, c \\in \\mathbb{R}$. Call them equations $(1)$, $(2)$ and $(3)$ in this order.`,
        parts: [
          P("Find the value of $k$ for which the system does not have a unique solution.", 3, ans.int(k0), [
            `$${rowOp(2, m)}$ gives $${eqn([0, 1, t], e2)}$.`, `$${rowOp(3, n)}$ gives $${coef(s, "y")} + ${kz} = ${cn}$.`,
            `${elim(s)}: $${k0 === 0 ? "kz" : `\\left(k ${signed(-k0)}\\right)z`} = c ${signed(-c0)}$.`,
            `There is a unique solution unless the coefficient of $z$ is zero, so $k = ${k0}$.`]),
          P("For this value of $k$, find the value of $c$ for which the system has infinitely many solutions.", 2, ans.int(c0), [
            `With $k = ${k0}$ the last equation is $0 = c ${signed(-c0)}$.`, `The system is consistent only when $c = ${c0}$, and then it has infinitely many solutions.`]),
          P("In this case the general solution has $z = \\lambda$ and $y = \\alpha + \\beta\\lambda$. Find the value of $\\alpha$.", 1, ans.int(e2), [`From $${eqn([0, 1, t], e2)}$ with $z = \\lambda$: $y = ${expr([[e2, ""], [-t, "\\lambda"]])}$, so $\\alpha = ${e2}$.`]),
          P("Find the value of $\\beta$.", 1, ans.int(-t), [`$y = ${expr([[e2, ""], [-t, "\\lambda"]])}$, so $\\beta = ${-t}$.`])] };
    } });
  reg({ ...LS, unknown: "set-up-system", representation: "words", levels: [4], calculator: true, skills: ["AHL1.16.set-up-system", "AHL1.16.solve-unique"], title: "Set up and solve a system from three orders",
    build({ rng }) {
      const [place, items, one, v] = rng.pick([["A café", ["coffees", "teas", "juices"], ["coffee", "tea", "juice"], ["c", "t", "j"]], ["A stationery shop", ["pens", "notebooks", "folders"], ["pen", "notebook", "folder"], ["p", "n", "f"]], ["A bakery", ["rolls", "muffins", "pies"], ["roll", "muffin", "pie"], ["r", "m", "p"]]]);
      let M, det;
      do {
        M = [0, 1, 2].map(() => [rng.int(1, 6), rng.int(1, 6), rng.int(1, 6)]);
        det = M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
      } while (Math.abs(det) < 3);
      const cents = [rng.int(24, 70) * 5, rng.int(24, 70) * 5, rng.int(30, 90) * 5], tot = M.map((row) => dot(row, cents) / 100), order = [rng.int(2, 6), rng.int(2, 6), rng.int(2, 6)], cost = dot(order, cents) / 100;
      const price = cents.map((c) => c / 100), money = (x) => fmt.dp(x, 2), nOf = (k, i) => `$${k}$ ${k === 1 ? one[i] : items[i]}`;
      const buy = (row) => `${nOf(row[0], 0)}, ${nOf(row[1], 1)} and ${nOf(row[2], 2)}`;
      const eq = (row, total) => `${expr(row.map((c, i) => [c, v[i]]))} = ${money(total)}`;
      return { params: { M, tot, order },
        stem: `${place} sells ${items[0]}, ${items[1]} and ${items[2]}, each kind at its own fixed price. One customer pays $${money(tot[0])}$ euros for ${buy(M[0])}. A second customer pays $${money(tot[1])}$ euros for ${buy(M[1])}. A third customer pays $${money(tot[2])}$ euros for ${buy(M[2])}.`,
        parts: [
          P(`Find the price, in euros, of one ${one[0]}.`, 2, ans.dp(price[0], 2), [
            `Let $${v[0]}$, $${v[1]}$ and $${v[2]}$ be the prices in euros. The three orders give $${eq(M[0], tot[0])}$, $${eq(M[1], tot[1])}$ and $${eq(M[2], tot[2])}$.`,
            `Solving the system with technology gives $${v[0]} = ${money(price[0])}$.`]),
          P(`Find the price, in euros, of one ${one[1]}.`, 1, ans.dp(price[1], 2), [`The same solution gives $${v[1]} = ${money(price[1])}$.`]),
          P(`Find the price, in euros, of one ${one[2]}.`, 1, ans.dp(price[2], 2), [`The same solution gives $${v[2]} = ${money(price[2])}$.`]),
          P(`Find the total cost, in euros, of ${buy(order)}.`, 2, ans.dp(cost, 2), [`$${order[0]}${br(price[0])} + ${order[1]}${br(price[1])} + ${order[2]}${br(price[2])} = ${money(cost)}$`])] };
    } });

  // ======================= 2.12 polynomial functions =======================
  const pv = (cs, x) => cs.reduce((s, c) => s * x + c, 0);                 // highest power first
  const pmul = (A, B) => { const out = Array(A.length + B.length - 1).fill(0); A.forEach((a, i) => B.forEach((b, j) => { out[i + j] += a * b; })); return out; };
  const subst = (cs, x) => expr(cs.map((c, i) => { const n = cs.length - 1 - i; return [c, n === 0 ? "" : n === 1 ? br(x) : `${br(x)}^{${n}}`]; }));
  const lowFirst = (cs) => cs.slice().reverse();
  const PT = { type: "fn-ahl-polynomial-theorems", syllabus: ["2.12"], representation: "equation", format: "value" };
  reg({ ...PT, unknown: "remainder", levels: [1], skills: ["AHL2.12.remainder-theorem"], title: "Remainder on division by a linear expression",
    build({ rng }) {
      let cs, a;
      do { cs = [rng.pick([1, 2, -1]), rng.int(-4, 4), rng.int(-5, 5), rng.int(-6, 6)]; a = rng.pick([1, 2, -1, -2, 3]); } while ((cs[1] === 0 && cs[2] === 0) || pv(cs, a) === pv(cs, -a));
      const R = pv(cs, a);
      return { params: { cs, a }, stem: `Let $f(x) = ${poly(cs)}$.`, parts: [
        P(`Find the remainder when $f(x)$ is divided by $${lin(1, -a)}$.`, 2, ans.int(R, { misconceptions: [{ value: pv(cs, -a), text: `For the divisor $${lin(1, -a)}$, substitute $x = ${a}$.` }] }), [
          `By the remainder theorem, the remainder is $f(${a})$.`, `$f(${a}) = ${subst(cs, a)} = ${R}$`])] };
    } });
  reg({ ...PT, unknown: "factor-coefficient", levels: [2], skills: ["AHL2.12.factor-theorem", "AHL2.12.remainder-theorem"], title: "A coefficient from a factor, then a remainder",
    build({ rng }) {
      let a, r2, r3, d, cs;
      do { a = rng.nonzero(-3, 3); r2 = rng.int(-3, 3); r3 = rng.int(-3, 3); d = rng.pick([1, -1, 2, -2]); cs = pmul(pmul([1, -a], [1, -r2]), [1, -r3]); } while (cs[1] === 0 || d === a || d === r2 || d === r3);
      const [, B, C, D] = cs, R = pv(cs, d);
      return { params: { a, C, D, d },
        stem: `Let $f(x) = ${expr([[1, "x^{3}"], [1, "kx^{2}"], [C, "x"], [D, ""]])}$, where $k \\in \\mathbb{R}$. It is given that $${lin(1, -a)}$ is a factor of $f(x)$.`,
        parts: [
          P("Find the value of $k$.", 2, ans.int(B), [`By the factor theorem, $f(${a}) = 0$: $${expr([[a * a * a, ""], [a * a, "k"], [C * a, ""], [D, ""]])} = 0$`, `$${coef(a * a, "k")} = ${-(a * a * a + C * a + D)}$, so $k = ${B}$.`]),
          P(`Find the remainder when $f(x)$ is divided by $${lin(1, -d)}$.`, 2, ans.int(R), [`With $k = ${B}$, $f(x) = ${poly(cs)}$.`, `By the remainder theorem, the remainder is $f(${d}) = ${subst(cs, d)} = ${R}$.`])] };
    } });
  reg({ ...PT, unknown: "factorise-solve", levels: [3], skills: ["AHL2.12.factor-theorem", "AHL2.12.polynomial-division", "AHL2.12.factorise-solve"], title: "Find a coefficient, factorise a cubic and find all its roots",
    build({ rng }) {
      let a, r2, r3;
      do { a = rng.nonzero(-3, 3); r2 = rng.nonzero(-5, 4); r3 = r2 + rng.int(1, 5); } while (r3 === 0 || a === r2 || a === r3 || a === 1 || a === -1);
      const cs = pmul(pmul([1, -a], [1, -r2]), [1, -r3]), [, B, C, D] = cs, p = B + a, q = r2 * r3;
      return { params: { a, B, D },
        stem: `Let $f(x) = ${expr([[1, "x^{3}"], [B, "x^{2}"], [1, "kx"], [D, ""]])}$, where $k \\in \\mathbb{R}$. It is given that $${lin(1, -a)}$ is a factor of $f(x)$.`,
        parts: [
          P("Find the value of $k$.", 2, ans.int(C), [`By the factor theorem, $f(${a}) = 0$: $${expr([[a * a * a, ""], [B * a * a, ""], [a, "k"], [D, ""]])} = 0$`, `$${coef(a, "k")} = ${-(a * a * a + B * a * a + D)}$, so $k = ${C}$.`]),
          P(`It is given that $f(x) = ${factor(a)}(x^{2} + px + q)$. Find the value of $p$.`, 1, ans.int(p), [`Compare the coefficients of $x^{2}$: $p ${signed(-a)} = ${B}$, so $p = ${p}$.`]),
          P("Find the value of $q$.", 1, ans.int(q), [`Compare the constant terms: $${coef(-a, "q")} = ${D}$, so $q = ${q}$.`]),
          P("The equation $f(x) = 0$ has two other roots. Find the smaller of them.", 1, ans.int(r2), [`$${poly([1, p, q])} = ${factor(r2)}${factor(r3)}$, so the other roots are $x = ${r2}$ and $x = ${r3}$. The smaller is $${r2}$.`]),
          P("Find the larger of them.", 1, ans.int(r3), [`The larger of the two is $x = ${r3}$.`])] };
    } });
  reg({ ...PT, unknown: "graph-multiplicity", representation: "graph", format: "graph-pick", levels: [2], skills: ["AHL2.12.polynomial-graph"], title: "Pick the graph of a cubic with a repeated zero",
    build({ rng }) {
      let p, q;
      do { p = rng.int(-3, 3); q = rng.int(-3, 3); } while (p === q || Math.abs(p - q) > 4 || p === 0 || q === 0);
      const s = rng.sign();
      const cubic = (s2, zs) => lowFirst(zs.reduce((acc, z) => pmul(acc, [1, -z]), [s2]));
      const gr = (s2, zs, why) => ({ value: [s2, ...zs], why, graph: win([-5, 5], [-10, 10], { yStep: 2, functions: [{ fn: { type: "poly", coeffs: cubic(s2, zs) } }], alt: "The graph of a cubic function" }) });
      const right = gr(s, [p, p, q]);
      const wrongs = G.pickDistinct(right.graph, [gr(s, [q, q, p], "The graph touches the axis at the wrong zero: the squared factor gives the repeated zero."), gr(-s, [p, p, q], "The sign of the coefficient of $x^{3}$ is wrong: check the direction of the graph for large $x$."),
        gr(s, [-p, -p, -q], "The zeros have the wrong signs: the factor $x - a$ gives the zero $x = a$."), gr(-s, [q, q, p]), gr(-s, [-p, -p, -q])], 3);
      const y0 = -s * p * p * q;
      return { params: { s, p, q }, stem: `Let $f(x) = ${s < 0 ? "-" : ""}${q === 0 ? "x" : ""}${factor(p)}^{2}${q === 0 ? "" : factor(q)}$.`, parts: [
        P("Which graph shows $y = f(x)$?", 2, ans.graph(rng, right, wrongs), [
          `$f(x) = 0$ at $x = ${p}$ and at $x = ${q}$. The factor for $x = ${p}$ is squared, so the graph touches the $x$-axis there; it crosses the $x$-axis at $x = ${q}$.`,
          `The coefficient of $x^{3}$ is ${s > 0 ? "positive, so the graph rises" : "negative, so the graph falls"} to the right.`]),
        P("Find the $y$-intercept of the graph of $f$.", 1, ans.int(y0), [`$f(0) = ${s < 0 ? "-" : ""}${br(-p)}^{2}${br(-q)} = ${y0}$`])] };
    } });
  const solve = (f, lo, hi) => { let flo = f(lo); for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2, fm = f(mid); if ((flo < 0) === (fm < 0)) { lo = mid; flo = fm; } else hi = mid; } return (lo + hi) / 2; };
  reg({ ...PT, unknown: "remainders-and-root", levels: [4], calculator: true, skills: ["AHL2.12.remainder-theorem", "AHL2.12.sum-product-roots", "AHL2.12.factorise-solve"], title: "Two remainders give two coefficients, then the real root",
    build({ rng }) {
      let a, b, c, u, root;
      do {
        a = rng.nonzero(-5, 5); b = rng.nonzero(-5, 5); c = rng.nonzero(-9, 9); u = rng.pick([-1, 2, -2]);
        root = 18 * a * b * c - 4 * a * a * a * c + a * a * b * b - 4 * b * b * b - 27 * c * c < 0 ? solve((x) => pv([1, a, b, c], x), -30, 30) : 0.5;
      } while (Math.abs(root - Math.round(root)) < 0.06 || Math.abs(root * 2 - Math.round(root * 2)) < 0.02);
      const cs = [1, a, b, c], R1 = pv(cs, 1), R2 = pv(cs, u);
      return { params: { c, u, R1, R2 },
        stem: `Let $f(x) = x^{3} + ax^{2} + bx ${signed(c)}$, where $a, b \\in \\mathbb{R}$. When $f(x)$ is divided by $x - 1$ the remainder is $${R1}$. When $f(x)$ is divided by $${lin(1, -u)}$ the remainder is $${R2}$.`,
        parts: [
          P("Find the value of $a$.", 2, ans.int(a), [
            `By the remainder theorem, $f(1) = ${R1}$: $1 + a + b ${signed(c)} = ${R1}$, so $a + b = ${R1 - 1 - c}$.`,
            `Also $f(${u}) = ${R2}$: $${expr([[u * u * u, ""], [u * u, "a"], [u, "b"], [c, ""]])} = ${R2}$, so $${expr([[u * u, "a"], [u, "b"]])} = ${R2 - u * u * u - c}$.`,
            `Solving the two equations gives $a = ${a}$.`]),
          P("Find the value of $b$.", 2, ans.int(b), [`From $a + b = ${R1 - 1 - c}$: $b = ${R1 - 1 - c} - ${paren(a)} = ${b}$`]),
          P("The equation $f(x) = 0$ has exactly one real root. Find this root.", 2, ans.sf(root), [`Now $f(x) = ${poly(cs)}$.`, `The graph of $f$ on a calculator crosses the $x$-axis once, at $x \\approx ${sf(root)}$.`]),
          P("Find the sum of the two roots of $f(x) = 0$ that are not real.", 1, ans.sf(-a - root), [`The sum of all three roots is $${-a}$, the negative of the coefficient of $x^{2}$.`, `The two other roots have sum $${-a} - ${paren(fmt.roundSf(root, 5))} \\approx ${sf(-a - root)}$.`])] };
    } });
  const PR = { type: "fn-ahl-polynomial-roots", syllabus: ["2.12"], representation: "equation", format: "value" };
  reg({ ...PR, unknown: "coefficients-from-sum-product", levels: [2], skills: ["AHL2.12.sum-product-roots"], title: "Coefficients from the sum and the product of the roots",
    build({ rng }) {
      const n = rng.pick([3, 4]), a = rng.int(1, 4), k = rng.nonzero(-9, 9), m = rng.nonzero(-9, 9), c1 = rng.nonzero(-6, 6), c2 = rng.int(-5, 5), sg = n === 3 ? -1 : 1;
      const terms = n === 3 ? [[a, "x^{3}"], [1, "kx^{2}"], [c1, "x"], [1, "m"]] : [[a, "x^{4}"], [1, "kx^{3}"], [c2, "x^{2}"], [c1, "x"], [1, "m"]];
      const S = rat.Q(-k, a), Pr = rat.Q(sg * m, a), over = (v) => (a === 1 ? v : `\\dfrac{${v}}{${a}}`);
      return { params: { n, a, c1, c2, S: rat.num(S), Pr: rat.num(Pr) },
        stem: `The equation $${expr(terms)} = 0$, where $k, m \\in \\mathbb{R}$, has roots whose sum is $${rat.tex(S)}$ and whose product is $${rat.tex(Pr)}$.`,
        parts: [
          P("Find the value of $k$.", 2, ans.int(k), [`The sum of the roots is the negative of the coefficient of $x^{${n - 1}}$ divided by the coefficient of $x^{${n}}$: $-${over("k")} = ${rat.tex(S)}$`, `$k = ${k}$`]),
          P("Find the value of $m$.", 2, ans.int(m, { misconceptions: [{ value: -m, text: `For a polynomial of degree $${n}$ the product of the roots is ${n === 3 ? "the negative of " : ""}the constant term divided by the leading coefficient.` }] }), [
            `The degree is $${n}$, so the product of the roots is ${n === 3 ? "the negative of " : ""}the constant term divided by the coefficient of $x^{${n}}$: $${n === 3 ? "-" : ""}${over("m")} = ${rat.tex(Pr)}$`, `$m = ${m}$`])] };
    } });
  reg({ ...PR, unknown: "fourth-root", levels: [3], skills: ["AHL2.12.sum-product-roots", "AHL1.14.conjugate-root"], title: "Sum and product of the roots of a quartic, then the missing root",
    build({ rng }) {
      let p, q, r1, r2;
      do { p = rng.nonzero(-3, 3); q = rng.int(1, 3); r1 = rng.nonzero(-4, 4); r2 = rng.nonzero(-4, 4); } while (r1 === r2);
      const L = rng.pick([1, 1, 2]), N = p * p + q * q, cs = pmul(pmul([L, -2 * p * L, N * L], [1, -r1]), [1, -r2]), S = 2 * p + r1 + r2;
      return { params: { cs, p, q, r1 },
        stem: `Consider the equation $${poly(cs, "z")} = 0$, where $z \\in \\mathbb{C}$. Two of its roots are $z = ${cx(p, q)}$ and $z = ${r1}$.`,
        parts: [
          P("Find the sum of the four roots of the equation.", 1, ans.int(S), [`The sum of the roots is the negative of the coefficient of $z^{3}$ divided by the coefficient of $z^{4}$: $${frac(-cs[1], cs[0])}$.`]),
          P("Find the product of the four roots of the equation.", 1, ans.int(N * r1 * r2), [`For a polynomial of degree $4$ the product of the roots is the constant term divided by the coefficient of $z^{4}$: $${frac(cs[4], cs[0])}$.`]),
          P("Find the fourth root of the equation.", 3, ans.int(r2), [
            `The coefficients are real, so $${cx(p, -q)}$ is also a root.`, `Let the fourth root be $r$. The sum of the roots gives $(${cx(p, q)}) + (${cx(p, -q)}) + ${paren(r1)} + r = ${S}$.`,
            `$${2 * p + r1} + r = ${S}$, so $r = ${r2}$.`])] };
    } });

  // ======================= 2.13 rational functions =======================
  const RQ = { type: "fn-ahl-rational-quadratic", syllabus: ["2.13"], representation: "equation", format: "value" };
  const pm = (v) => (v < 0 ? "-" : "+");
  reg({ ...RQ, unknown: "vertical-asymptotes", levels: [1], skills: ["AHL2.13.vertical-asymptotes"], title: "Vertical asymptotes from a quadratic denominator",
    build({ rng }) {
      let p, q, r;
      do { p = rng.int(-5, 4); q = p + rng.int(1, 6); r = rng.int(-5, 5); } while (r === p || r === q || q > 6);
      return { params: { p, q, r }, stem: `Let $f(x) = \\dfrac{${lin(1, -r)}}{${poly([1, -(p + q), p * q])}}$. The graph of $f$ has vertical asymptotes $x = a$ and $x = b$, where $a < b$.`, parts: [
        P("Find the value of $a$.", 1, ans.int(p), [`The denominator is zero when $${factor(p)}${factor(q)} = 0$, so $x = ${p}$ or $x = ${q}$.`, `The numerator is not zero at these values, so both give vertical asymptotes. The smaller is $a = ${p}$.`]),
        P("Find the value of $b$.", 1, ans.int(q), [`The larger value is $b = ${q}$.`])] };
    } });
  reg({ ...RQ, unknown: "oblique-asymptote", levels: [2], skills: ["AHL2.13.oblique-asymptote", "AHL2.13.vertical-asymptotes", "AHL2.13.intercepts"], title: "Asymptotes and intercept of a quadratic over a linear function",
    build({ rng }) {
      const a = rng.pick([1, 1, 2]), h = rng.nonzero(-4, 4), mm = rng.nonzero(-5, 5), R = rng.nonzero(-6, 6), cs = [a, mm - a * h, R - mm * h], y0 = rat.Q(cs[2], -h);
      return { params: { cs, h }, stem: `Let $f(x) = \\dfrac{${poly(cs)}}{${lin(1, -h)}}$, for $x \\ne ${h}$.`, parts: [
        P("The graph of $f$ has a vertical asymptote $x = c$. Write down the value of $c$.", 1, ans.int(h), [`The denominator is zero when $x = ${h}$, and the numerator is not zero there, so $c = ${h}$.`]),
        P("The graph of $f$ also has an oblique asymptote $y = px + q$. Find the value of $p$.", 1, ans.int(a), [
          `Divide: $${poly(cs)} = ${factor(h)}(${lin(a, mm)}) ${signed(R)}$`, `So $f(x) = ${lin(a, mm)} ${pm(R)} \\dfrac{${Math.abs(R)}}{${lin(1, -h)}}$. The fraction tends to $0$ as $x \\to \\pm\\infty$, so the asymptote is $y = ${lin(a, mm)}$ and $p = ${a}$.`]),
        P("Find the value of $q$.", 1, ans.int(mm), [`The oblique asymptote is $y = ${lin(a, mm)}$, so $q = ${mm}$.`]),
        P("Find the $y$-intercept of the graph of $f$.", 1, ansQ(y0), [`Substitute $x = 0$: $f(0) = ${cs[2]} \\div ${paren(-h)} = ${rat.tex(y0)}$`])] };
    } });
  reg({ ...RQ, unknown: "linear-over-quadratic-graph", representation: "graph", format: "graph-pick", levels: [2], skills: ["AHL2.13.sketch-rational", "AHL2.13.horizontal-asymptote", "AHL2.13.vertical-asymptotes"], title: "Pick the graph of a linear over a quadratic function",
    build({ rng }) {
      let p, q, r, right, wrongs;
      const gr = (k, r2, p2, q2, why) => ({ value: [k, r2, p2, q2], why, graph: win([-6, 6], [-6, 6], { functions: [{ fn: { type: "rational", num: r2 === null ? [k] : [-k * r2, k], den: [p2 * q2, -(p2 + q2), 1] } }], asymptotes: [{ x: p2 }, { x: q2 }], alt: "The graph of a rational function with two vertical asymptotes" }) });
      const k = rng.pick([2, 3, -2, -3]);
      do {
        p = rng.int(-4, 2); q = p + rng.int(2, 4); r = rng.int(-5, 5); right = gr(k, r, p, q);
        wrongs = G.pickDistinct(right.graph, [gr(-k, r, p, q, "The curve is reflected in the $x$-axis: check the sign of $f(x)$ for large positive $x$."), gr(k, -r, -q, -p, "The asymptotes and the zero have the wrong signs."),
          gr(k, p + q - r, p, q, "The graph crosses the $x$-axis at the wrong place: the zero comes from the numerator."), gr(k, null, p, q, "This graph never crosses the $x$-axis, but the numerator is zero for one value of $x$."), gr(-k, -r, -q, -p)], 3);
      } while (r === p || r === q || q > 4 || wrongs.length < 3);
      return { params: { k, r, p, q }, stem: `Let $f(x) = \\dfrac{${lin(k, -k * r)}}{${factor(p)}${factor(q)}}$.`, parts: [
        P("The graph of $f$ has a horizontal asymptote $y = c$. Write down the value of $c$.", 1, ans.int(0), [`The degree of the denominator is greater than the degree of the numerator, so $f(x) \\to 0$ as $x \\to \\pm\\infty$ and $c = 0$.`]),
        P("Which graph shows $y = f(x)$?", 2, ans.graph(rng, right, wrongs), [
          `The vertical asymptotes are $x = ${p}$ and $x = ${q}$, and the graph crosses the $x$-axis at $x = ${r}$.`,
          `For large positive $x$, $f(x)$ is ${k > 0 ? "positive" : "negative"}, so on the right the curve approaches the $x$-axis from ${k > 0 ? "above" : "below"}.`])] };
    } });
  reg({ ...RQ, unknown: "quadratic-over-linear-graph", representation: "graph", format: "graph-pick", levels: [3], skills: ["AHL2.13.sketch-rational", "AHL2.13.oblique-asymptote", "AHL2.13.intercepts"], title: "Asymptotes and intercepts, then the graph of a quadratic over a linear function",
    build({ rng }) {
      let h, r1, r2, mm, R, right, wrongs;
      const gr = (h2, m2, R2, s, why) => ({ value: [h2, m2, R2, s], why, graph: win([-8, 8], [-12, 12], { xStep: 2, yStep: 2,
        functions: [{ fn: { type: "rational", num: [s * (R2 - m2 * h2), s * (m2 - h2), s], den: [-h2, 1] } }, { fn: { type: "poly", coeffs: [s * m2, s] }, dashed: true }], asymptotes: [{ x: h2 }], alt: "The graph of a rational function with a vertical and an oblique asymptote" }) });
      do {
        h = rng.nonzero(-3, 3); r1 = rng.nonzero(-5, 3); r2 = r1 + rng.int(1, 5); mm = h - r1 - r2; R = (h - r1) * (h - r2); right = gr(h, mm, R, 1);
        wrongs = G.pickDistinct(right.graph, [gr(-h, mm, R, 1, "The vertical asymptote is on the wrong side of the $y$-axis."), gr(h, mm, -R, 1, "The branches are on the wrong sides of the asymptotes: check the intercepts."),
          gr(h, mm, R, -1, "The graph is reflected in the $x$-axis: the oblique asymptote should have gradient $1$."), gr(h, -mm, R, 1, "The oblique asymptote has the wrong $y$-intercept."), gr(-h, -mm, R, 1), gr(-h, mm, -R, 1)], 3);
      } while (r2 === 0 || r1 === h || r2 === h || Math.abs(R) > 12 || Math.abs(mm) > 6 || wrongs.length < 3);
      const cs = [1, -(r1 + r2), r1 * r2], y0 = rat.Q(r1 * r2, -h), q2 = mm === 0 ? "x" : `(${lin(1, mm)})`;
      return { params: { cs, h }, stem: `Let $f(x) = \\dfrac{${poly(cs)}}{${lin(1, -h)}}$, for $x \\ne ${h}$.`, parts: [
        P("The graph of $f$ has a vertical asymptote $x = c$. Write down the value of $c$.", 1, ans.int(h), [`The denominator is zero when $x = ${h}$, and the numerator is not zero there, so $c = ${h}$.`]),
        P("The graph of $f$ has an oblique asymptote $y = x + q$. Find the value of $q$.", 2, ans.int(mm), [
          `Divide: $${poly(cs)} = ${factor(h)}${q2} ${signed(R)}$`, `So $f(x) = ${lin(1, mm)} ${pm(R)} \\dfrac{${Math.abs(R)}}{${lin(1, -h)}}$. The fraction tends to $0$ as $x \\to \\pm\\infty$, so the asymptote is $y = ${lin(1, mm)}$ and $q = ${mm}$.`]),
        P("Find the $y$-intercept of the graph of $f$.", 1, ansQ(y0), [`Substitute $x = 0$: $f(0) = ${r1 * r2} \\div ${paren(-h)} = ${rat.tex(y0)}$`]),
        P("Which graph shows $y = f(x)$, with its asymptotes drawn as dashed lines?", 2, ans.graph(rng, right, wrongs), [
          `The asymptotes are $x = ${h}$ and $y = ${lin(1, mm)}$.`, `The numerator is $${factor(r1)}${factor(r2)}$, so the graph crosses the $x$-axis at $x = ${r1}$ and $x = ${r2}$. It crosses the $y$-axis at $y = ${rat.tex(y0)}$.`])] };
    } });
  const INF = 99;
  const setT = (iv, strict, f) => iv.map(([lo, hi]) => { const le = strict ? "<" : "\\le", ge = strict ? ">" : "\\ge"; f = f || num; return lo <= -INF ? `$x ${le} ${f(hi)}$` : hi >= INF ? `$x ${ge} ${f(lo)}$` : `$${f(lo)} ${le} x ${le} ${f(hi)}$`; }).join(" or ");
  reg({ ...RQ, unknown: "range-rational", levels: [4], calculator: true, skills: ["AHL2.13.range-rational", "AHL2.13.horizontal-asymptote"], title: "Range of a linear over a quadratic function from its turning points",
    build({ rng }) {
      let a, b, c, D;
      do { a = rng.int(-4, 4); b = rng.pick([0, 2, -2, 4, -4]); c = (b * b) / 4 + rng.int(1, 5); D = a * a + a * b + c; } while (Number.isInteger(Math.sqrt(D)));
      const f = (x) => (x - a) / (x * x + b * x + c), xM = a + Math.sqrt(D), xm = a - Math.sqrt(D), yM = f(xM), ym = f(xm);
      const opt = (lo, hi, text, why) => ({ text, value: [lo, hi], why });
      return { params: { a, b, c }, stem: `Let $f(x) = \\dfrac{${lin(1, -a)}}{${poly([1, b, c])}}$, for $x \\in \\mathbb{R}$.`, parts: [
        P("The graph of $f$ has a horizontal asymptote $y = k$. Write down the value of $k$.", 1, ans.int(0), [`The degree of the denominator is greater than the degree of the numerator, so $f(x) \\to 0$ as $x \\to \\pm\\infty$ and $k = 0$.`]),
        P("Find the maximum value of $f(x)$.", 2, ans.sf(yM), [`Draw the graph of $f$ on a calculator. The denominator is never zero, so the graph is one continuous curve.`, `The maximum point is approximately $${point(sf(xM), sf(yM))}$, so the maximum value is $${sf(yM)}$.`]),
        P("Find the minimum value of $f(x)$.", 2, ans.sf(ym), [`The minimum point is approximately $${point(sf(xm), sf(ym))}$, so the minimum value is $${sf(ym)}$.`]),
        P("Which of these is the range of $f$?", 1, ans.choice(rng, opt(ym, yM, `$${sf(ym)} \\le f(x) \\le ${sf(yM)}$`), [
          opt(-INF, yM, `$f(x) \\le ${sf(yM)}$`, "The function also has a least value, at its minimum point."), opt(ym, INF, `$f(x) \\ge ${sf(ym)}$`, "The function also has a greatest value, at its maximum point."),
          opt(-INF, INF, "$f(x) \\in \\mathbb{R}$", "The graph stays between its minimum and its maximum values.")]), [
          `The curve is continuous and tends to $0$ at both ends, so $f(x)$ takes every value from the minimum to the maximum.`, `The range is $${sf(ym)} \\le f(x) \\le ${sf(yM)}$.`])] };
    } });

  // ======================= 2.14 odd and even functions, inverses =======================
  const OE = { type: "fn-ahl-odd-even", syllabus: ["2.14"], representation: "equation" };
  reg({ ...OE, unknown: "classify", format: "mcq", levels: [1], skills: ["AHL2.14.odd-even-test"], title: "Decide whether a function is odd, even or neither",
    build({ rng }) {
      const form = rng.int(0, 7), a = rng.pick([1, 2, 3, -1, -2]), b = rng.nonzero(-5, 5), c = rng.nonzero(-4, 4), k = rng.int(1, 3), kk = k === 1 ? "" : k;
      const SIN = { type: "trig", name: "sin" }, COSF = { type: "trig", name: "cos" }, pl = (coeffs) => ({ type: "poly", coeffs });
      const F = [
        () => ({ tex: poly([a, 0, b, 0]), fn: pl([0, b, 0, a]), kind: "odd", work: `$f(-x) = ${expr([[a, "(-x)^{3}"], [b, "(-x)"]])} = ${poly([-a, 0, -b, 0])}$` }),
        () => ({ tex: poly([a, 0, b, 0, c]), fn: pl([c, 0, b, 0, a]), kind: "even", work: `$f(-x) = ${expr([[a, "(-x)^{4}"], [b, "(-x)^{2}"], [c, ""]])} = ${poly([a, 0, b, 0, c])}$` }),
        () => ({ tex: poly([a, b, 0, 0]), fn: pl([0, 0, b, a]), kind: "neither", work: `$f(-x) = ${expr([[a, "(-x)^{3}"], [b, "(-x)^{2}"]])} = ${poly([-a, b, 0, 0])}$` }),
        () => ({ tex: poly([a, 0, 0, c]), fn: pl([c, 0, 0, a]), kind: "neither", work: `$f(-x) = ${expr([[a, "(-x)^{3}"], [c, ""]])} = ${poly([-a, 0, 0, c])}$` }),
        () => ({ tex: `${kk}x\\sin x`, fn: { type: "product", of: [pl([0, k]), SIN] }, kind: "even", work: `$f(-x) = ${kk}(-x)\\sin(-x) = ${kk}(-x)(-\\sin x) = ${kk}x\\sin x$` }),
        () => ({ tex: `${kk}x\\cos x`, fn: { type: "product", of: [pl([0, k]), COSF] }, kind: "odd", work: `$f(-x) = ${kk}(-x)\\cos(-x) = -${kk}x\\cos x$, because $\\cos(-x) = \\cos x$.` }),
        () => ({ tex: `${kk}x^{2} + \\cos x`, fn: { type: "sum", of: [pl([0, 0, k]), COSF] }, kind: "even", work: `$f(-x) = ${kk}(-x)^{2} + \\cos(-x) = ${kk}x^{2} + \\cos x$` }),
        () => ({ tex: `${kk}x + \\cos x`, fn: { type: "sum", of: [pl([0, k]), COSF] }, kind: "neither", work: `$f(-x) = -${kk}x + \\cos x$` })][form]();
      const O = { odd: { text: "Odd", value: "odd" }, even: { text: "Even", value: "even" }, neither: { text: "Neither odd nor even", value: "neither" } };
      const WHY = "An even function has $f(-x) = f(x)$ for all $x$; an odd function has $f(-x) = -f(x)$ for all $x$.";
      return { params: { fn: F.fn }, stem: `Let $f(x) = ${F.tex}$, for $x \\in \\mathbb{R}$.`, parts: [
        P("Is $f$ odd, even or neither?", 2, ans.choice(rng, O[F.kind], Object.keys(O).filter((key) => key !== F.kind).map((key) => Object.assign({ why: WHY }, O[key]))), [
          F.work, F.kind === "odd" ? "This is $-f(x)$, so $f$ is odd." : F.kind === "even" ? "This is $f(x)$, so $f$ is even." : "This is not $f(x)$ for all $x$ and not $-f(x)$ for all $x$, so $f$ is neither odd nor even."])] };
    } });
  reg({ ...OE, unknown: "symmetry-coefficients", format: "value", levels: [2], skills: ["AHL2.14.odd-even-test", "AHL2.14.use-symmetry"], title: "Unknown coefficients of an odd or an even polynomial",
    build({ rng }) {
      const even = rng.bool(), c = rng.nonzero(-6, 6), d = rng.nonzero(-6, 6), a1 = rng.pick([1, 2, 3, -1, -2]), a2 = rng.nonzero(-5, 5), e = rng.nonzero(-6, 6), x0 = rng.pick([2, -2, 3, -1, -3]);
      const kT = `\\left(k ${signed(-c)}\\right)`, mT = `\\left(m ${signed(d)}\\right)`;
      const terms = even ? [[a1, "x^{4}"], [1, `${kT}x^{3}`], [a2, "x^{2}"], [1, `${mT}x`], [e, ""]] : [[a1, "x^{3}"], [1, `${kT}x^{2}`], [a2, "x"], [1, mT]];
      const cs = even ? [a1, 0, a2, 0, e] : [a1, 0, a2, 0], val = pv(cs, x0);
      return { params: { even, a1, a2, e: even ? e : 0, c, d, x0 },
        stem: `The function $f(x) = ${expr(terms)}$, where $k, m \\in \\mathbb{R}$, is ${even ? "an even" : "an odd"} function.`,
        parts: [
          P("Find the value of $k$.", 1, ans.int(c), [`${even ? "An even polynomial function has only even powers of $x$" : "An odd polynomial function has only odd powers of $x$"}, so the coefficient of $x^{${even ? 3 : 2}}$ is zero: $k ${signed(-c)} = 0$ and $k = ${c}$.`]),
          P("Find the value of $m$.", 1, ans.int(-d), [`${even ? "The coefficient of $x$" : "The constant term"} is also zero: $m ${signed(d)} = 0$ and $m = ${-d}$.`]),
          P(`Find $f(${x0})$.`, 2, ans.int(val), [`With these values, $f(x) = ${poly(cs)}$.`, `$f(${x0}) = ${subst(cs, x0)} = ${val}$`])] };
    } });
  const IR = { type: "fn-ahl-inverse-restricted", syllabus: ["2.14"], representation: "equation" };
  reg({ ...IR, unknown: "quadratic-inverse", format: "mcq", levels: [3], skills: ["AHL2.14.restrict-domain", "AHL2.14.inverse-restricted"], title: "Largest domain for an inverse of a quadratic, and the inverse",
    build({ rng }) {
      const h = rng.nonzero(-4, 4), k0 = rng.nonzero(-6, 6), side = rng.sign(), t = rng.int(1, 4), b = -2 * h, c = h * h + k0, v = k0 + t * t, rel = side > 0 ? "\\ge" : "\\le";
      const inv = (hh, ss, kk, why) => ({ text: `$f^{-1}(x) = ${hh} ${ss > 0 ? "+" : "-"} \\sqrt{${lin(1, -kk)}}$`, value: [hh, ss, kk], why });
      return { params: { b, c, side, v },
        stem: `Let $f(x) = ${poly([1, b, c])}$, for $x ${rel} d$, where $d \\in \\mathbb{R}$.`,
        parts: [
          P(`Find the ${side > 0 ? "least" : "greatest"} value of $d$ for which $f$ has an inverse function.`, 2, ans.int(h), [
            `Complete the square: $f(x) = ${factor(h)}^{2} ${signed(k0)}$.`, `The graph is a parabola with its vertex at $x = ${h}$. $f$ is one-to-one only when its domain lies on one side of the vertex, so $d = ${h}$.`]),
          P(`For this value of $d$, find $f^{-1}(${v})$.`, 2, ans.int(h + side * t, { misconceptions: [{ value: h - side * t, text: "That value is not in the domain of $f$: it comes from the other branch." }] }), [
            `Solve $f(x) = ${v}$: $${factor(h)}^{2} = ${t * t}$, so $x = ${h} \\pm ${t}$.`, `The domain of $f$ is $x ${rel} ${h}$, so $x = ${h + side * t}$ and $f^{-1}(${v}) = ${h + side * t}$.`]),
          P("The domain of $f^{-1}$ is $x \\ge a$. Write down the value of $a$.", 1, ans.int(k0), [`The domain of $f^{-1}$ is the range of $f$, which is $f(x) \\ge ${k0}$. So $a = ${k0}$.`]),
          P("Which expression is $f^{-1}(x)$?", 2, ans.choice(rng, inv(h, side, k0), [inv(h, -side, k0, "This is the other branch: its values are not in the domain of $f$."), inv(-h, side, k0, "Check the sign of the number added outside the square root."), inv(h, side, -k0, "Check the sign of the number under the square root."), inv(-h, -side, k0)]), [
            `$y = ${factor(h)}^{2} ${signed(k0)}$ gives $x ${signed(-h)} = \\pm\\sqrt{y ${signed(-k0)}}$.`,
            `Since $x ${rel} ${h}$, take the ${side > 0 ? "positive" : "negative"} root: $f^{-1}(x) = ${h} ${side > 0 ? "+" : "-"} \\sqrt{${lin(1, -k0)}}$`])] };
    } });
  reg({ ...IR, unknown: "self-inverse", format: "value", levels: [2], skills: ["AHL2.14.self-inverse"], title: "A self-inverse rational function",
    build({ rng }) {
      let a, b, v;
      do { a = rng.nonzero(-5, 5); b = rng.nonzero(-6, 6); v = rng.int(-4, 6); } while (a * a + b === 0 || v === a || a * v + b === 0);
      return { params: { a, b, v },
        stem: `Let $f(x) = \\dfrac{${lin(a, b)}}{x - k}$, for $x \\ne k$, where $k \\in \\mathbb{R}$. The function $f$ is self-inverse, so $f^{-1}(x) = f(x)$ for all $x$ in its domain.`,
        parts: [
          P("Find the value of $k$.", 2, ans.int(a), [
            `Let $y = \\dfrac{${lin(a, b)}}{x - k}$. Then $y(x - k) = ${lin(a, b)}$, so $x(y ${signed(-a)}) = ky ${signed(b)}$.`,
            `So $f^{-1}(x) = \\dfrac{kx ${signed(b)}}{${lin(1, -a)}}$. This is the same function as $f$ when $k = ${a}$.`]),
          P(`Hence write down $f^{-1}(${v})$.`, 2, ans.frac(a * v + b, v - a), [`$f^{-1}(${v}) = f(${v}) = \\dfrac{${expr([[a, br(v)], [b, ""]])}}{${v} - ${paren(a)}}$`, `$= ${frac(a * v + b, v - a)}$`])] };
    } });

  // ======================= 2.15 inequalities =======================
  const IQ = { type: "fn-ahl-inequalities", syllabus: ["2.15"], representation: "equation", format: "mcq" };
  const RELS = { ge: "\\ge", le: "\\le", gt: ">", lt: "<" };
  const ivOpt = (iv, strict, why, f) => ({ text: setT(iv, strict, f), value: iv, why });
  reg({ ...IQ, unknown: "factorised-cubic", levels: [2], skills: ["AHL2.15.polynomial-inequality"], title: "Solve a cubic inequality from its factors",
    build({ rng }) {
      const a = rng.int(-5, 1), b = a + rng.int(1, 3), c = b + rng.int(1, 3), s = rng.sign(), rel = rng.pick(["ge", "le", "gt", "lt"]), strict = rel === "gt" || rel === "lt";
      const posS = [[a, b], [c, INF]], negS = [[-INF, a], [b, c]], wantPos = (rel === "ge" || rel === "gt") === (s > 0), right = wantPos ? posS : negS;
      const sg = (i) => ((i % 2 === 1) === (s > 0) ? "positive" : "negative");      // sign in the i-th interval from the left
      return { params: { a, b, c, s, rel }, stem: `Let $f(x) = ${s < 0 ? "-" : ""}${factor(a)}${factor(b)}${factor(c)}$.`, parts: [
        P(`Solve the inequality $f(x) ${RELS[rel]} 0$.`, 3, ans.choice(rng, ivOpt(right, strict), [
          ivOpt(wantPos ? negS : posS, strict, "These are the values for which the inequality is the other way round."), ivOpt([[a, c]], strict, "The sign of $f(x)$ changes at the middle zero as well."),
          ivOpt([[-INF, a], [c, INF]], strict, "The sign of $f(x)$ changes at the middle zero as well."), ivOpt(wantPos ? [[c, INF]] : [[-INF, a]], strict, "There is a second interval.")]), [
          `The zeros of $f$ are $x = ${a}$, $x = ${b}$ and $x = ${c}$.`,
          `The coefficient of $x^{3}$ is ${s > 0 ? "positive" : "negative"}, so $f(x)$ is ${sg(3)} for $x > ${c}$. Each zero is a single zero, so the sign changes at each one.`,
          `$f(x)$ is ${sg(0)} for $x < ${a}$, ${sg(1)} for $${a} < x < ${b}$, ${sg(2)} for $${b} < x < ${c}$ and ${sg(3)} for $x > ${c}$.`,
          `So $f(x) ${RELS[rel]} 0$ for ${setT(right, strict)}.`])] };
    } });
  reg({ ...IQ, unknown: "cubic-vs-line", levels: [3], skills: ["AHL2.15.polynomial-inequality", "AHL2.12.factorise-solve"], title: "Where a cubic lies above or below a line",
    build({ rng }) {
      const r1 = rng.int(-4, 0), r2 = r1 + rng.int(1, 3), r3 = r2 + rng.int(1, 3), mm = rng.nonzero(-3, 3), n = rng.int(-5, 5), rel = rng.pick(["ge", "le", "gt", "lt"]), strict = rel === "gt" || rel === "lt";
      const hc = pmul(pmul([1, -r1], [1, -r2]), [1, -r3]), fc = [hc[0], hc[1], hc[2] + mm, hc[3] + n], rg = rng.pick([r1, r2, r3]), [o1, o2] = [r1, r2, r3].filter((v) => v !== rg);
      const posS = [[r1, r2], [r3, INF]], negS = [[-INF, r1], [r2, r3]], wantPos = rel === "ge" || rel === "gt", right = wantPos ? posS : negS;
      return { params: { fc, mm, n, rg, rel },
        stem: `Let $f(x) = ${poly(fc)}$ and $g(x) = ${lin(mm, n)}$. The graphs of $f$ and $g$ intersect at three points. One of these points has $x$-coordinate $${rg}$.`,
        parts: [
          P("Find the $x$-coordinates of the other two points of intersection. Give the smaller one.", 3, ans.int(o1), [
            `$f(x) = g(x)$ gives $${poly(hc)} = 0$.`, `$x = ${rg}$ is a root, so $${factor(rg)}$ is a factor: $${poly(hc)} = ${factor(rg)}(${poly(pmul([1, -o1], [1, -o2]))})$`,
            `$${poly(pmul([1, -o1], [1, -o2]))} = ${factor(o1)}${factor(o2)}$, so the other $x$-coordinates are $${o1}$ and $${o2}$. The smaller is $${o1}$.`]),
          P("Give the larger one.", 1, ans.int(o2), [`The larger of the two is $${o2}$.`]),
          P(`Solve the inequality $f(x) ${RELS[rel]} g(x)$.`, 2, ans.choice(rng, ivOpt(right, strict), [
            ivOpt(wantPos ? negS : posS, strict, "These are the values for which the inequality is the other way round."), ivOpt([[r1, r3]], strict, "The sign of $f(x) - g(x)$ changes at each of the three intersections."),
            ivOpt([[-INF, r1], [r3, INF]], strict, "The sign of $f(x) - g(x)$ changes at each of the three intersections."), ivOpt(wantPos ? [[r3, INF]] : [[-INF, r1]], strict, "There is a second interval.")]), [
            `$f(x) - g(x) = ${factor(r1)}${factor(r2)}${factor(r3)}$, which is positive for $x > ${r3}$ and changes sign at each zero.`,
            `So $f(x) - g(x)$ is positive for $${r1} < x < ${r2}$ and for $x > ${r3}$, and negative for $x < ${r1}$ and for $${r2} < x < ${r3}$.`,
            `$f(x) ${RELS[rel]} g(x)$ for ${setT(right, strict)}.`])] };
    } });
  reg({ ...IQ, unknown: "rational-vs-line", levels: [4], calculator: true, skills: ["AHL2.15.rational-inequality", "AHL2.15.graphical-inequality"], title: "A rational function against a line, with technology",
    build({ rng }) {
      let a, b, c, disc;
      do { b = rng.int(-3, 3); a = -b + rng.int(1, 6); c = rng.int(-4, 4); disc = (1 + b - c) * (1 + b - c) + 4 * (a + b * c); } while (Number.isInteger(Math.sqrt(disc)) || a === 0);
      const p = (1 + b - c - Math.sqrt(disc)) / 2, q = (1 + b - c + Math.sqrt(disc)) / 2, le = rng.bool(), f3 = (x) => (x === b ? String(b) : sf(x));
      const A = { text: `$${sf(p)} \\le x < ${b}$ or $x \\ge ${sf(q)}$`, value: [[p, b], [q, INF]] }, B = { text: `$x \\le ${sf(p)}$ or $${b} < x \\le ${sf(q)}$`, value: [[-INF, p], [b, q]] };
      return { params: { a, b, c, le },
        stem: `Let $f(x) = \\dfrac{${lin(1, a)}}{${lin(1, -b)}}$, for $x \\ne ${b}$, and $g(x) = ${lin(1, c)}$.`,
        parts: [
          P("The graphs of $f$ and $g$ intersect at two points. Find the smaller of their $x$-coordinates.", 2, ans.sf(p), [`Draw both graphs on a calculator and find their intersections, or solve $${lin(1, a)} = (${lin(1, c)})${factor(b)}$.`, `The smaller $x$-coordinate is $x \\approx ${sf(p)}$.`]),
          P("Find the larger of their $x$-coordinates.", 1, ans.sf(q), [`The larger $x$-coordinate is $x \\approx ${sf(q)}$.`]),
          P(`Solve the inequality $f(x) ${le ? "\\le" : "\\ge"} g(x)$.`, 3, ans.choice(rng, le ? A : B, [Object.assign(le ? B : A, { why: "These are the values for which the inequality is the other way round." }),
            { text: setT([[p, q]], false, f3), value: [[p, q]], why: `The graph of $f$ has a vertical asymptote at $x = ${b}$, and $f(x) - g(x)$ changes sign there too.` },
            { text: setT([[-INF, p], [q, INF]], false, f3), value: [[-INF, p], [q, INF]], why: `The graph of $f$ has a vertical asymptote at $x = ${b}$, and $f(x) - g(x)$ changes sign there too.` }]), [
            `The graph of $f$ has a vertical asymptote at $x = ${b}$, so the values where $f(x) - g(x)$ can change sign are $${sf(p)}$, $${b}$ and $${sf(q)}$.`,
            `From the graphs, the curve is below the line for $${sf(p)} < x < ${b}$ and for $x > ${sf(q)}$, and above it for $x < ${sf(p)}$ and for $${b} < x < ${sf(q)}$.`,
            `So $f(x) ${le ? "\\le" : "\\ge"} g(x)$ for ${(le ? A : B).text}. The value $x = ${b}$ is not included, because $f$ is not defined there.`])] };
    } });

  // ======================= 2.16 graphs of |f(x)|, f(|x|), 1/f(x); modulus equations =======================
  const MG = { type: "fn-ahl-modulus-graphs", syllabus: ["2.16"], representation: "graph", format: "graph-pick" };
  const mgSit = (rng) => { let p, q; do { q = rng.int(1, 4); p = q - rng.int(2, 4); } while (p === 0 || p === -q); return { p, q }; };
  const mgF = (s) => ({ type: "poly", coeffs: [s.p * s.q, -(s.p + s.q), 1] });
  const mgWin = (fn, extra) => win([-6, 6], [-6, 8], Object.assign({ functions: [{ fn }], alt: "The graph of a function" }, extra));
  const mgAll = (s) => {
    const f = mgF(s), neg = (fn) => ({ type: "transform", of: fn, a: -1 }), flip = { type: "poly", coeffs: [s.p * s.q, s.p + s.q, 1] };
    return { f, abs: { type: "abs", of: f }, fabs: { type: "sum", of: [{ type: "poly", coeffs: [s.p * s.q, 0, 1] }, { type: "transform", of: { type: "abs", of: { type: "poly", coeffs: [0, 1] } }, a: -(s.p + s.q) }] },
      negabs: neg({ type: "abs", of: f }), flip, absflip: { type: "abs", of: flip }, negf: neg(f) };
  };
  const mgStem = (s) => `The diagram shows the graph of $y = f(x)$, where $f(x) = ${factor(s.p)}${factor(s.q)}$.`;
  const mgOpt = (fn, value, why) => ({ graph: mgWin(fn), value, why });
  reg({ ...MG, unknown: "modulus-of-f", levels: [2], situationKey: "mg", situation: mgSit, skills: ["AHL2.16.modulus-graph", "AHL2.16.modulus-equation"], title: "Pick the graph of y = |f(x)|",
    build({ rng, sit: s }) {
      const g = mgAll(s), depth = ((s.q - s.p) * (s.q - s.p)) / 4, t = rng.pick([1, 2, 3, 5, 6].filter((v) => v !== depth)), n = t < depth ? 4 : 2;
      const wrongs = G.pickDistinct(mgWin(g.abs), [mgOpt(g.fabs, "f(|x|)", "This is $y = f(|x|)$: the part of the graph to the right of the $y$-axis has been reflected in the $y$-axis."),
        mgOpt(g.negabs, "-|f|", "Every point of this graph is on or below the $x$-axis, but a modulus is never negative."), mgOpt(g.negf, "-f", "The whole graph has been reflected, not only the part below the $x$-axis."),
        mgOpt(g.absflip, "|f(-x)|", "This graph has also been reflected in the $y$-axis."), mgOpt(g.f, "f", "This is the graph of $f$ itself: the part below the $x$-axis has not been reflected.")], 3);
      return { graph: mgWin(g.f, { functions: [{ fn: g.f, label: "f" }] }), stem: mgStem(s), params: { t }, parts: [
        P("Which graph shows $y = |f(x)|$?", 2, ans.graph(rng, mgOpt(g.abs, "|f|"), wrongs), [
          `Where $f(x) \\ge 0$ the graph is unchanged. Where $f(x) < 0$, for $${s.p} < x < ${s.q}$, the graph is reflected in the $x$-axis.`, `The new graph touches the $x$-axis at $x = ${s.p}$ and $x = ${s.q}$ and is never below it.`]),
        P(`Write down the number of solutions of the equation $|f(x)| = ${t}$.`, 1, ans.int(n), [
          `The reflected part of the graph has its highest point at $y = ${num(depth)}$. The line $y = ${t}$ is ${t < depth ? "below" : "above"} this point, so it meets the graph $${n}$ times.`])] };
    } });
  reg({ ...MG, unknown: "f-of-modulus", levels: [2], situationKey: "mg", situation: mgSit, skills: ["AHL2.16.f-of-modulus"], title: "Pick the graph of y = f(|x|)",
    build({ rng, sit: s }) {
      const g = mgAll(s), n = s.p > 0 ? 4 : 2;
      const wrongs = G.pickDistinct(mgWin(g.fabs), [mgOpt(g.abs, "|f|", "This is $y = |f(x)|$: the part of the graph below the $x$-axis has been reflected in the $x$-axis."),
        mgOpt(g.flip, "f(-x)", "This is $y = f(-x)$: the whole graph has been reflected in the $y$-axis."), mgOpt(g.absflip, "|f(-x)|"), mgOpt(g.negf, "-f", "This is $y = -f(x)$."), mgOpt(g.f, "f", "This is the graph of $f$ itself.")], 3);
      return { graph: mgWin(g.f, { functions: [{ fn: g.f, label: "f" }] }), stem: mgStem(s), parts: [
        P("Which graph shows $y = f(|x|)$?", 2, ans.graph(rng, mgOpt(g.fabs, "f(|x|)"), wrongs), [
          `For $x \\ge 0$, $f(|x|) = f(x)$, so the graph to the right of the $y$-axis is unchanged.`, `For $x < 0$, $f(|x|) = f(-x)$, so the left side is the reflection of the right side in the $y$-axis. The graph is symmetric about the $y$-axis.`]),
        P("Write down the number of solutions of the equation $f(|x|) = 0$.", 1, ans.int(n), [
          s.p > 0 ? `For $x \\ge 0$ the zeros are $x = ${s.p}$ and $x = ${s.q}$. Their reflections $x = ${-s.p}$ and $x = ${-s.q}$ are also zeros, so there are $4$ solutions.`
            : `For $x \\ge 0$ the only zero is $x = ${s.q}$. Its reflection $x = ${-s.q}$ is also a zero, so there are $2$ solutions.`])] };
    } });
  reg({ ...MG, unknown: "reciprocal-graph", levels: [3], skills: ["AHL2.16.reciprocal-graph"], title: "Features and graph of y = 1/f(x) for a quadratic f",
    build({ rng }) {
      let A, gap, p, q, right, wrongs;
      const rw = (fn, as, value, why) => ({ value, why, graph: win([-6, 6], [-5, 5], { functions: [{ fn }], asymptotes: as.map((x) => ({ x })), alt: "The graph of the reciprocal of a function" }) });
      const rec = (A2, p2, q2) => ({ type: "rational", num: [A2], den: [p2 * q2, -(p2 + q2), 1] });
      do {
        [A, gap] = rng.pick([[1, 2], [2, 2], [4, 4], [2, 4]]); p = rng.int(-4, 2); q = p + gap; right = rw(rec(A, p, q), [p, q], "1/f");
        wrongs = G.pickDistinct(right.graph, [rw(rec(-A, p, q), [p, q], "-1/f", "This graph is reflected in the $x$-axis: where $f(x)$ is positive, its reciprocal is positive too."),
          rw({ type: "abs", of: rec(A, p, q) }, [p, q], "|1/f|", "Between the asymptotes $f(x)$ is negative, so its reciprocal is negative there."), rw(rec(A, -q, -p), [-q, -p], "mirror", "The asymptotes are at the zeros of $f$, not at their negatives."),
          rw(rec(A, p + 1, q + 1), [p + 1, q + 1], "shift", "The asymptotes are at the zeros of $f$."), rw(rec(-A, -q, -p), [-q, -p], "both")], 3);
      } while (p * q === 0 || p === -q || wrongs.length < 3);
      const aT = A === 1 ? "" : `\\dfrac{1}{${A}}`, mid = rat.Q(p + q, 2), fmin = rat.Q(-gap * gap, 4 * A), y0 = rat.Q(A, p * q), yMax = rat.Q(-4 * A, gap * gap);
      const fn = { type: "poly", coeffs: [(p * q) / A, -(p + q) / A, 1 / A] };
      return { params: { A, p, q }, graph: win([-6, 6], [-5, 5], { functions: [{ fn, label: "f" }], alt: "The graph of a quadratic function" }),
        stem: `The diagram shows the graph of $y = f(x)$, where $f(x) = ${aT}${factor(p)}${factor(q)}$. Consider the graph of $y = \\dfrac{1}{f(x)}$.`,
        parts: [
          P("This graph has vertical asymptotes $x = c$ and $x = d$, where $c < d$. Write down the value of $c$.", 1, ans.int(p), [`$\\dfrac{1}{f(x)}$ is not defined where $f(x) = 0$, so the asymptotes are at the zeros of $f$: $x = ${p}$ and $x = ${q}$. So $c = ${p}$.`]),
          P("Write down the value of $d$.", 1, ans.int(q), [`$d = ${q}$`]),
          P("Find the $y$-intercept of the graph of $y = \\dfrac{1}{f(x)}$.", 1, ansQ(y0), [`$f(0) = ${aT}${br(-p)}${br(-q)} = ${frac(p * q, A)}$, so the $y$-intercept is $1 \\div ${paren(rat.Q(p * q, A))} = ${rat.tex(y0)}$.`]),
          P("The graph of $y = \\dfrac{1}{f(x)}$ has a local maximum point. Find its $y$-coordinate.", 2, ansQ(yMax), [
            `$f$ has its minimum half-way between its zeros, at $x = ${rat.tex(mid)}$, where $f(x) = ${rat.tex(fmin)}$.`, `Where $f$ has a negative minimum, its reciprocal has a local maximum: $y = 1 \\div ${paren(fmin)} = ${rat.tex(yMax)}$`]),
          P("Which graph shows $y = \\dfrac{1}{f(x)}$?", 2, ans.graph(rng, right, wrongs), [
            `The vertical asymptotes are $x = ${p}$ and $x = ${q}$. As $x \\to \\pm\\infty$, $f(x)$ becomes large, so $\\dfrac{1}{f(x)} \\to 0$.`,
            `$\\dfrac{1}{f(x)}$ has the same sign as $f(x)$: positive outside the asymptotes and negative between them, with a local maximum at $y = ${rat.tex(yMax)}$.`])] };
    } });
  const ME = { type: "fn-ahl-modulus-equations", syllabus: ["2.16"], representation: "equation", format: "value" };
  reg({ ...ME, unknown: "shifted-modulus", levels: [1], skills: ["AHL2.16.modulus-equation"], title: "Solve |x - a| = k",
    build({ rng }) {
      const a = rng.nonzero(-8, 8), k = rng.int(1, 9);
      return { params: { a, k }, stem: `Consider the equation $|${lin(1, -a)}| = ${k}$.`, parts: [
        P("Write down the smaller solution of the equation.", 1, ans.int(a - k), [`$${lin(1, -a)} = ${k}$ or $${lin(1, -a)} = ${-k}$, so $x = ${a + k}$ or $x = ${a - k}$. The smaller is $${a - k}$.`]),
        P("Write down the larger solution of the equation.", 1, ans.int(a + k), [`The larger solution is $x = ${a + k}$. Both solutions are $${k}$ units from $${a}$ on the number line.`])] };
    } });
  reg({ ...ME, unknown: "linear-equals-constant", levels: [2], skills: ["AHL2.16.modulus-equation", "AHL2.16.modulus-inequality"], title: "Solve |ax + b| = k and count integer solutions of the inequality",
    build({ rng }) {
      const a = rng.int(1, 4), b = rng.nonzero(-7, 7), k = rng.int(1, 9), x1 = rat.Q(-b - k, a), x2 = rat.Q(-b + k, a), ints = [];
      for (let x = Math.ceil(rat.num(x1) - 1e-9); x <= rat.num(x2) + 1e-9; x++) if (x > rat.num(x1) + 1e-9 && x < rat.num(x2) - 1e-9) ints.push(x);
      const n = ints.length;
      return { params: { a, b, k }, stem: `Consider the equation $|${lin(a, b)}| = ${k}$.`, parts: [
        P("Find the smaller solution of the equation.", 2, ansQ(x1), [`$${lin(a, b)} = ${k}$ or $${lin(a, b)} = ${-k}$`, `$x = ${rat.tex(x2)}$ or $x = ${rat.tex(x1)}$. The smaller solution is $x = ${rat.tex(x1)}$.`]),
        P("Find the larger solution of the equation.", 1, ansQ(x2), [`The larger solution is $x = ${rat.tex(x2)}$.`]),
        P(`Find the number of integers $x$ that satisfy $|${lin(a, b)}| < ${k}$.`, 1, ans.int(n), [
          `$|${lin(a, b)}| < ${k}$ for $${rat.tex(x1)} < x < ${rat.tex(x2)}$.`,
          n === 0 ? "There are no integers strictly between these two values." : n <= 9 ? `The integers in this interval are $${ints.join(",\\, ")}$: there ${n === 1 ? "is" : "are"} $${n}$.` : `The integers in this interval run from $${ints[0]}$ to $${ints[n - 1]}$: there are $${n}$.`])] };
    } });
  reg({ ...ME, unknown: "modulus-vs-line", format: "mcq", levels: [3], skills: ["AHL2.16.modulus-equation", "AHL2.16.modulus-inequality"], title: "A modulus against a line: both solutions, then the inequality",
    build({ rng }) {
      let a, b, c, d;
      do { a = rng.int(2, 4); c = rng.nonzero(-a + 1, a - 1); b = rng.int(-6, 6); d = rng.int(-4, 8); } while (a * d - b * c <= 0 || d === b || b === -d);
      const x1 = rat.Q(d - b, a - c), x2 = rat.Q(-b - d, a + c), lt = rng.bool(), g = (x) => rat.add(rat.mul(c, x), d), tx = (v) => (v === -INF || v === INF ? "" : rat.tex(v === rat.num(x1) ? x1 : x2));
      const in1 = [[rat.num(x2), rat.num(x1)]], out1 = [[-INF, rat.num(x2)], [rat.num(x1), INF]], right = lt ? in1 : out1;
      return { params: { a, b, c, d, lt }, stem: `Let $f(x) = |${lin(a, b)}|$ and $g(x) = ${lin(c, d)}$.`, parts: [
        P("The equation $f(x) = g(x)$ has two solutions. Find the smaller solution.", 3, ansQ(x2), [
          `Where $${lin(a, b)} < 0$, $f(x) = -(${lin(a, b)})$. Solve $${lin(-a, -b)} = ${lin(c, d)}$: $${coef(-(a + c), "x")} = ${d + b}$, so $x = ${rat.tex(x2)}$.`,
          `Check: $g\\left(${rat.tex(x2)}\\right) = ${rat.tex(g(x2))}$, which is not negative, so this solution is valid.`]),
        P("Find the larger solution.", 2, ansQ(x1), [
          `Where $${lin(a, b)} \\ge 0$, solve $${lin(a, b)} = ${lin(c, d)}$: $${coef(a - c, "x")} = ${d - b}$, so $x = ${rat.tex(x1)}$.`, `Check: $g\\left(${rat.tex(x1)}\\right) = ${rat.tex(g(x1))}$, which is not negative, so this solution is valid.`]),
        P(`Solve the inequality $f(x) ${lt ? "<" : ">"} g(x)$.`, 2, ans.choice(rng, ivOpt(right, true, undefined, tx), [
          ivOpt(lt ? out1 : in1, true, "These are the values for which the inequality is the other way round.", tx), ivOpt([[rat.num(x1), INF]], true, "Check the values of $x$ to the left of the smaller solution as well.", tx),
          ivOpt([[-INF, rat.num(x2)]], true, "Check the values of $x$ to the right of the larger solution as well.", tx)]), [
          `The graph of $f$ is a V shape. The line $y = g(x)$ crosses it at $x = ${rat.tex(x2)}$ and $x = ${rat.tex(x1)}$, and between these values the line is above the V.`,
          `So $f(x) ${lt ? "<" : ">"} g(x)$ for ${setT(right, true, tx)}.`])] };
    } });
  reg({ ...ME, unknown: "modulus-vs-quadratic", levels: [4], calculator: true, skills: ["AHL2.16.modulus-equation"], title: "A modulus of a quadratic against a line, with technology",
    build({ rng }) {
      let a, c, xs;
      const ok = () => {
        xs = [];
        const dA = 1 + 4 * (a + c), dB = 1 + 4 * (a - c);
        if (dA > 0) for (const sg of [-1, 1]) { const x = (1 + sg * Math.sqrt(dA)) / 2; if (x * x - a > 0.03) xs.push(x); else if (x * x - a > -0.03) return false; }
        if (dB > 0) for (const sg of [-1, 1]) { const x = (-1 + sg * Math.sqrt(dB)) / 2; if (x * x - a < -0.03) xs.push(x); else if (x * x - a < 0.03) return false; }
        xs.sort((u, v) => u - v);
        if (Math.abs(dA) < 0.5 || Math.abs(dB) < 0.5 || xs.length < 2) return false;
        return xs.every((x, i) => i === 0 || x - xs[i - 1] > 0.1) && (!Number.isInteger(xs[0]) || !Number.isInteger(xs[xs.length - 1]));
      };
      do { a = rng.int(2, 9); c = rng.int(-2, 5); } while (!ok());
      const n = xs.length;
      return { params: { a, c }, stem: `Consider the equation $|x^{2} - ${a}| = ${lin(1, c)}$.`, parts: [
        P("Find the number of solutions of the equation.", 1, ans.int(n), [`Draw the graphs of $y = |x^{2} - ${a}|$ and $y = ${lin(1, c)}$ on a calculator. They intersect at $${n}$ points.`]),
        P("Find the least solution of the equation.", 2, ans.sf(xs[0]), [`The intersection furthest to the left is at $x \\approx ${sf(xs[0])}$.`]),
        P("Find the greatest solution of the equation.", 2, ans.sf(xs[n - 1]), [`The intersection furthest to the right is at $x \\approx ${sf(xs[n - 1])}$.`])] };
    } });
})(typeof globalThis !== "undefined" ? globalThis : this);
