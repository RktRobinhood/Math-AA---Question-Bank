/* Topic 1 (Number and algebra) generators. Self-contained: needs only engine.js.
   Each generator's independent verifier is in scripts/engine-checks/topic1.mjs under the same id.
   `source` names the old practice template a generator was ported from. */
(function (root) {
  "use strict";
  const E = root.QBEngine;
  const { ans, fmt } = E;
  const { num, frac, poly, lin, signed, paren, br, expr, m, sf, coef, rat, pct, factor } = fmt;
  const P = (prompt, marks, answer, working) => ({ prompt, marks, answer, working });
  const reg = (def) => E.register(Object.assign({ courses: ["aa-sl"], calculator: false }, def));
  const pw = (b, n) => (n === 1 ? `${b}` : `${b}^{${n}}`);

  // ======================= 1.2 arithmetic sequences =======================
  const AS = { type: "t1-arithmetic-sequence", syllabus: ["1.2"], representation: "equation", format: "value" };
  reg({ ...AS, unknown: "d-from-sum", levels: [3], skills: ["SL1.2.find-u1-d", "SL1.2.sum", "SL1.2.nth-term"], title: "A term equal to a sum: first term and difference", source: "arith-uk-sk",
    build({ rng }) {
      const k = rng.int(5, 10), mm = rng.nonzero(-4, 4), N = k * mm, u1 = mm * (2 - k), d = 2 * mm;
      return { params: { k, N }, stem: `In an arithmetic sequence, $u_{${k}} = ${N}$ and $S_{${k}} = ${N}$.`, parts: [
        P("Find the first term, $u_{1}$.", 3, ans.int(u1), [
          `$S_{${k}} = \\dfrac{${k}}{2}\\left(u_{1} + u_{${k}}\\right) = ${N}$`, `$u_{1} + ${paren(N)} = ${frac(2 * N, k)}$`, `$u_{1} = ${u1}$`]),
        P("Find the common difference, $d$.", 2, ans.int(d), [`$u_{${k}} = u_{1} + ${k - 1}d$, so $${N} = ${u1} + ${k - 1}d$`, `$${k - 1}d = ${N - u1}$, so $d = ${d}$`])] };
    } });
  reg({ ...AS, unknown: "n-from-term", levels: [3], skills: ["SL1.2.find-n", "SL1.2.sum"], title: "The zero term and the greatest sum", source: "arith-first-d",
    build({ rng }) {
      const t = rng.int(1, 6), r = rng.int(5, 12), u1 = r * t, d = -t, k = r + 1, maxS = (r * (r + 1) * t) / 2;
      return { params: { u1, d }, stem: `An arithmetic sequence has first term $u_{1} = ${u1}$ and common difference $d = ${d}$.`, parts: [
        P("The $k$th term of the sequence is zero. Find the value of $k$.", 2, ans.int(k), [`$u_{k} = ${u1} + (k - 1)${br(d)} = 0$`, `$k - 1 = ${r}$, so $k = ${k}$`]),
        P("Find the greatest value of $S_{n}$.", 3, ans.int(maxS), [
          `The terms are positive up to $u_{${r}}$ and $u_{${k}} = 0$, so $S_{n}$ is greatest when $n = ${r}$ (or $n = ${k}$).`,
          `$S_{${r}} = \\dfrac{${r}}{2}\\left(2${br(u1)} + ${r - 1}${br(d)}\\right)$`, `$S_{${r}} = ${maxS}$`])] };
    } });
  reg({ ...AS, unknown: "d-from-two-terms", levels: [3], skills: ["SL1.2.find-u1-d", "SL1.2.sum"], title: "Two terms given: difference, first term and a sum", source: "arith-first-d/two known terms",
    build({ rng }) {
      const d = rng.nonzero(-5, 6), u1 = rng.int(-8, 25), p = rng.int(3, 5), q = p + rng.int(3, 5), n = rng.pick([10, 12, 15, 20]);
      const up = u1 + (p - 1) * d, uq = u1 + (q - 1) * d, sn = (n * (2 * u1 + (n - 1) * d)) / 2;
      return { params: { p, q, up, uq, n }, stem: `An arithmetic sequence has $u_{${p}} = ${up}$ and $u_{${q}} = ${uq}$.`, parts: [
        P("Find the common difference.", 2, ans.int(d), [`$u_{${q}} - u_{${p}} = ${q - p}d$, so $${uq} - ${paren(up)} = ${q - p}d$`, `$d = ${d}$`]),
        P("Find the first term.", 2, ans.int(u1), [`$u_{${p}} = u_{1} + ${p - 1}d$, so $${up} = u_{1} + ${p - 1}${br(d)}$`, `$u_{1} = ${u1}$`]),
        P(`Find $S_{${n}}$.`, 3, ans.int(sn), [`$S_{${n}} = \\dfrac{${n}}{2}\\left(2${br(u1)} + ${n - 1}${br(d)}\\right)$`, `$S_{${n}} = ${num(sn)}$`])] };
    } });
  reg({ type: "t1-ext-sigma-arithmetic", syllabus: ["1.2"], representation: "equation", format: "value", unknown: "sum-from-general-term", levels: [3],
    skills: ["SL1.2.sigma", "SL1.2.sum"], title: "Sigma notation for an arithmetic series", source: "arith-first-d/sigma and finite series",
    build({ rng }) {
      const a = rng.int(2, 6), b = rng.nonzero(-6, 7), n = rng.pick([8, 10, 12, 15, 20]), first = a + b, last = a * n + b, sum = (n * (first + last)) / 2;
      return { params: { a, b, n }, stem: `A sequence is defined by $u_{n} = ${lin(a, b, "n")}$, for $n \\ge 1$.`, parts: [
        P("Show that the sequence is arithmetic.", 2, ans.self(`$u_{n+1} - u_{n} = ${a}$ for every $n$, a constant, so the sequence is arithmetic.`), [
          `$u_{n+1} - u_{n} = \\left(${a}(n + 1) ${signed(b)}\\right) - \\left(${lin(a, b, "n")}\\right)$`, `$u_{n+1} - u_{n} = ${a}$, which does not depend on $n$, so the sequence is arithmetic with $d = ${a}$.`]),
        P(`Find the value of $\\displaystyle\\sum_{r=1}^{${n}} u_{r}$.`, 4, ans.int(sum), [`$u_{1} = ${first}$ and $u_{${n}} = ${last}$`, `$\\displaystyle\\sum_{r=1}^{${n}} u_{r} = S_{${n}} = \\dfrac{${n}}{2}\\left(${first} + ${paren(last)}\\right)$`, `$S_{${n}} = ${num(sum)}$`])] };
    } });
  reg({ type: "t1-arithmetic-in-context", syllabus: ["1.2"], representation: "words", format: "value", unknown: "first-total-past", levels: [4], calculator: true, niceOk: true,
    skills: ["SL1.2.model", "SL1.2.find-n", "SL1.2.sum"], title: "Rows of seats: a term, a total and the rows needed", source: "arith-context-section-b",
    build({ rng }) {
      const u1 = rng.pick([18, 20, 24, 30, 16, 22]), d = rng.int(2, 5), n = rng.pick([12, 14, 16, 18]), target = rng.pick([700, 800, 900, 1000, 1200, 650]);
      const un = u1 + (n - 1) * d, total = (n * (u1 + un)) / 2, S = (k) => (k * (2 * u1 + (k - 1) * d)) / 2;
      let least = 1;
      while (S(least) < target) least++;
      return { params: { u1, d, n, target }, stem: `In a theatre, the first row has $${u1}$ seats. Each row after the first has $${d}$ more seats than the row in front of it.`, parts: [
        P(`Find the number of seats in row $${n}$.`, 2, ans.int(un), [`The numbers of seats form an arithmetic sequence with $u_{1} = ${u1}$ and $d = ${d}$.`, `$u_{${n}} = ${u1} + ${n - 1} \\times ${d} = ${un}$`]),
        P(`Find the total number of seats in the first $${n}$ rows.`, 2, ans.int(total), [`$S_{${n}} = \\dfrac{${n}}{2}\\left(${u1} + ${un}\\right) = ${num(total)}$`]),
        P(`Find the least number of rows needed for the theatre to have at least $${num(target)}$ seats.`, 3, ans.int(least), [
          `Solve $S_{n} = \\dfrac{n}{2}\\left(${2 * u1} + ${d}(n - 1)\\right) \\ge ${num(target)}$ with a table or graph on a calculator.`,
          `$S_{${least - 1}} = ${num(S(least - 1))}$ and $S_{${least}} = ${num(S(least))}$`, `The least number of rows is $${least}$.`])] };
    } });

  // ======================= 1.3 geometric sequences =======================
  const GS = { type: "t1-geometric-sequence", syllabus: ["1.3"], representation: "equation", format: "value" };
  reg({ ...GS, unknown: "sum-from-u1-r", levels: [3], skills: ["SL1.3.nth-term", "SL1.3.sum"], title: "A term, a sum and the first sum past a target", source: "geom-sum-inf/finite growth threshold",
    build({ rng }) {
      const u1 = rng.pick([2, 3, 4, 5, 6, 8]), r = rng.pick([2, 3]), n = rng.int(4, r === 2 ? 7 : 5);
      const S = (k) => (u1 * (Math.pow(r, k) - 1)) / (r - 1), un = u1 * Math.pow(r, n - 1), sn = S(n);
      const kk = n + rng.int(1, 2), target = S(kk) - rng.int(1, u1 * Math.pow(r, kk - 1) - 1);
      return { params: { u1, r, n, target }, stem: `A geometric sequence has first term $${u1}$ and common ratio $${r}$.`, parts: [
        P(`Find $u_{${n}}$.`, 2, ans.int(un), [`$u_{${n}} = ${u1} \\times ${pw(r, n - 1)} = ${num(un)}$`]),
        P(`Find $S_{${n}}$.`, 2, ans.int(sn), [`$S_{${n}} = \\dfrac{${u1}\\left(${pw(r, n)} - 1\\right)}{${r} - 1} = ${num(sn)}$`]),
        P(`Find the least value of $k$ for which $S_{k} > ${num(target)}$.`, 3, ans.int(kk), [
          `The sums grow quickly, so continue from $S_{${n}} = ${num(sn)}$, adding one term at a time.`, `$S_{${kk - 1}} = ${num(S(kk - 1))}$ and $S_{${kk}} = ${num(S(kk))}$`, `The least value is $k = ${kk}$.`])] };
    } });
  reg({ ...GS, syllabus: ["1.3", "1.8"], unknown: "u1-from-two-terms", levels: [3], skills: ["SL1.3.find-r-u1", "SL1.8.sum-to-infinity"], title: "Ratio and first term from two terms, then the sum to infinity", source: "geom-sum-inf/ratio from two terms",
    build({ rng }) {
      const [rn, rd] = rng.pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4]]), u1 = rd * rd * rd * rng.int(1, 3), r = rat.Q(rn, rd);
      const u2 = rat.mul(u1, r), u4 = rat.mul(u2, rat.mul(r, r)), sInf = rat.div(u1, rat.sub(1, r));
      return { params: { u2: rat.num(u2), u4: rat.num(u4) }, stem: `A geometric sequence has a positive common ratio. It is given that $u_{2} = ${rat.tex(u2)}$ and $u_{4} = ${rat.tex(u4)}$.`, parts: [
        P("Find the common ratio.", 3, ans.frac(r.n, r.d), [`$\\dfrac{u_{4}}{u_{2}} = r^{2}$, so $r^{2} = ${rat.tex(rat.mul(r, r))}$`, `The ratio is positive, so $r = ${rat.tex(r)}$.`]),
        P("Find the first term.", 2, ans.int(u1), [`$u_{1} = \\dfrac{u_{2}}{r} = ${rat.tex(u2)} \\div ${rat.tex(r)} = ${u1}$`]),
        P("Find the sum to infinity.", 2, ans.frac(sInf.n, sInf.d), [`$S_{\\infty} = \\dfrac{u_{1}}{1 - r} = ${u1} \\div ${rat.tex(rat.sub(1, r))}$`, `$S_{\\infty} = ${rat.tex(sInf)}$`])] };
    } });

  // ======================= 1.8 sum to infinity =======================
  const SI = { type: "t1-sum-to-infinity", syllabus: ["1.8", "1.3"], representation: "equation", format: "value" };
  reg({ ...SI, unknown: "sinf-value", levels: [4], calculator: true, niceOk: true, skills: ["SL1.8.sum-to-infinity", "SL1.3.find-n"], title: "Sum to infinity, and how soon the partial sums get close", source: "geom-sum-inf",
    build({ rng }) {
      const [rn, rd] = rng.pick([[1, 2], [1, 3], [2, 3], [3, 5], [3, 4], [2, 5]]), u1 = rng.pick([2, 3, 4, 6, 8, 9, 10, 12]), r = rn / rd;
      const sInf = rat.div(u1, rat.Q(rd - rn, rd)), eps = rng.pick([0.1, 0.01, 0.001]);
      const raw = Math.log(eps / rat.num(sInf)) / Math.log(r);
      let n = Math.max(1, Math.ceil(raw));
      while (rat.num(sInf) * Math.pow(r, n) >= eps) n++;
      return { params: { u1, rn, rd, eps }, stem: `A geometric sequence has first term $u_{1} = ${u1}$ and common ratio $r = ${frac(rn, rd)}$.`, parts: [
        P("Find the sum to infinity, $S_{\\infty}$.", 2, ans.frac(sInf.n, sInf.d), [`$S_{\\infty} = \\dfrac{u_{1}}{1 - r} = ${u1} \\div ${frac(rd - rn, rd)} = ${rat.tex(sInf)}$`]),
        P(`Find the least value of $n$ for which $S_{\\infty} - S_{n} < ${num(eps)}$.`, 4, ans.int(n), [
          `$S_{\\infty} - S_{n} = S_{\\infty} \\times r^{n} = ${rat.tex(sInf)} \\times \\left(${frac(rn, rd)}\\right)^{n}$`,
          `Solve $${rat.tex(sInf)} \\times \\left(${frac(rn, rd)}\\right)^{n} = ${num(eps)}$ on a calculator: $n = ${sf(raw)}$`, `$n$ is a whole number, so the least value is $n = ${n}$.`])] };
    } });
  reg({ ...SI, unknown: "r-from-u2-both", levels: [3], skills: ["SL1.8.sum-to-infinity", "SL1.3.find-r-u1"], title: "Ratio from two terms, then the sum to infinity", source: "geo-infinite-from-terms",
    build({ rng }) {
      const [rn, rd] = rng.pick([[1, 2], [1, 3], [3, 4], [2, 3], [1, 4], [2, 5]]), u1 = rd * rd * rng.int(1, 4), r = rat.Q(rn, rd);
      const u3 = rat.mul(u1, rat.mul(r, r)), sInf = rat.div(u1, rat.sub(1, r));
      return { params: { u1, u3: rat.num(u3) }, stem: `A geometric sequence has a positive common ratio $r$. The first term is $u_{1} = ${u1}$ and the third term is $u_{3} = ${rat.tex(u3)}$.`, parts: [
        P("Find the value of $r$.", 2, ans.frac(r.n, r.d), [`$u_{3} = u_{1}r^{2}$, so $r^{2} = \\dfrac{${rat.tex(u3)}}{${u1}} = ${rat.tex(rat.mul(r, r))}$`, `$r > 0$, so $r = ${rat.tex(r)}$.`]),
        P("Find the sum to infinity.", 3, ans.frac(sInf.n, sInf.d), [`$|r| < 1$, so the sum to infinity exists.`, `$S_{\\infty} = \\dfrac{u_{1}}{1 - r} = ${u1} \\div ${rat.tex(rat.sub(1, r))} = ${rat.tex(sInf)}$`])] };
    } });

  // ======================= 1.4 financial applications =======================
  reg({ type: "t1-depreciation", syllabus: ["1.4", "1.3"], representation: "words", format: "value", unknown: "years-below", levels: [4], calculator: true,
    skills: ["SL1.4.depreciation", "SL1.4.find-time", "SL1.3.model"], title: "Value after repeated percentage loss, and when it falls below a level", source: "geom-sum-inf/geometric context model",
    build({ rng }) {
      const start = rng.pick([1200, 2500, 4800, 9000, 1650, 3400]), p = rng.pick([8, 12, 15, 20, 18, 11]), years = rng.int(3, 5), ratio = 1 - p / 100;
      const value = start * Math.pow(ratio, years), threshold = Math.round((start * rng.pick([0.35, 0.45, 0.55])) / 100) * 100;
      let n = 0;
      while (start * Math.pow(ratio, n) >= threshold) n++;
      return { params: { start, p, years, threshold }, stem: `A laptop is bought for $${num(start)}$ euros. Its value decreases by $${pct(p)}$ each year.`, parts: [
        P("Write down the common ratio of the yearly values.", 1, ans.dec(ratio), [`A decrease of $${pct(p)}$ multiplies the value by $1 - ${num(p / 100)} = ${num(ratio)}$.`]),
        P(`Find the value of the laptop, in euros, after $${years}$ years.`, 2, ans.sf(value), [`$V = ${num(start)} \\times ${num(ratio)}^{${years}}$`, `$V = ${sf(value)}$ (to three significant figures)`]),
        P(`Find the number of complete years after which the value is first less than $${num(threshold)}$ euros.`, 3, ans.int(n), [
          `Solve $${num(start)} \\times ${num(ratio)}^{n} < ${num(threshold)}$ on a calculator.`, `$n > ${sf(Math.log(threshold / start) / Math.log(ratio))}$`, `The value is first below $${num(threshold)}$ euros after $${n}$ years.`])] };
    } });
  reg({ type: "t1-depreciation", syllabus: ["1.4"], representation: "words", format: "value", unknown: "least-periods", levels: [2], calculator: true, niceOk: true,
    skills: ["SL1.4.depreciation", "SL1.4.find-time"], title: "Depreciation: multiplier and years to fall below a value", source: "financial/B",
    build({ rng }) {
      const P0 = rng.pick([20000, 25000, 30000, 40000, 18000]), r = rng.pick([10, 12, 15, 20, 18]), threshold = Math.round(P0 * rng.pick([0.5, 0.4, 0.3])), base = 1 - r / 100;
      let n = 0;
      while (P0 * Math.pow(base, n) >= threshold) n++;
      return { params: { P0, r, threshold }, stem: `A car is bought for $${num(P0)}$ euros. Its value depreciates by $${pct(r)}$ per year, so after $n$ years its value is $${num(P0)} \\times k^{n}$ euros.`, parts: [
        P("Write down the value of $k$.", 1, ans.dec(base), [`$k = 1 - \\dfrac{${r}}{100} = ${num(base)}$`]),
        P(`Find the smallest whole number $n$ for which the value of the car is less than $${num(threshold)}$ euros.`, 3, ans.int(n), [
          `Solve $${num(P0)} \\times ${num(base)}^{n} < ${num(threshold)}$ on a calculator.`, `$n > ${sf(Math.log(threshold / P0) / Math.log(base))}$`, `The smallest whole number is $n = ${n}$.`])] };
    } });
  const CI = { type: "t1-compound-interest", syllabus: ["1.4"], representation: "words", format: "value", calculator: true };
  reg({ ...CI, unknown: "future-value", levels: [4], skills: ["SL1.4.future-value"], title: "Compound interest: value and interest earned", source: "financial/A",
    build({ rng }) {
      let P0, r, n, raw;
      do { P0 = rng.pick([5000, 8000, 10000, 12000, 15000, 6500]); r = rng.pick([3, 4, 5, 6, 2.5, 3.5, 4.2]); n = rng.pick([5, 8, 10, 12, 7]); raw = P0 * Math.pow(1 + r / 100, n); }
      while (Math.abs(raw - Math.floor(raw) - 0.5) < 0.02);
      const A = Math.round(raw);
      return { params: { P0, r, n }, stem: `An amount of $${num(P0)}$ euros is invested in an account that pays $${pct(r)}$ interest per year, compounded annually.`, parts: [
        P(`Find the value of the investment after $${n}$ years. Give your answer to the nearest euro.`, 3, ans.dp(A, 0), [
          `$A = ${num(P0)}\\left(1 + \\dfrac{${num(r)}}{100}\\right)^{${n}} = ${num(P0)} \\times ${num(1 + r / 100)}^{${n}}$`, `$A = ${num(A)}$ euros (to the nearest euro)`]),
        P(`Find the total interest earned in the $${n}$ years, to the nearest euro.`, 2, ans.dp(A - P0, 0), [`Interest $= ${num(A)} - ${num(P0)} = ${num(A - P0)}$ euros`])] };
    } });
  reg({ ...CI, unknown: "time-needed", levels: [4], skills: ["SL1.4.future-value", "SL1.4.find-time"], title: "Compound interest: value, then years to pass a target", source: "compound-interest-years",
    build({ rng }) {
      const pv = rng.pick([2400, 3200, 5000, 7500, 4100]), rate = rng.pick([2.5, 3.2, 4, 4.8, 5.5]), years = rng.int(4, 6), mult = 1 + rate / 100;
      const value = pv * Math.pow(mult, years), target = Math.ceil((value * rng.pick([1.12, 1.18, 1.25])) / 100) * 100;
      let least = 0;
      while (pv * Math.pow(mult, least) <= target) least++;
      return { params: { pv, rate, years, target }, stem: `A student invests $${num(pv)}$ euros in an account that pays $${pct(rate)}$ interest per year, compounded annually.`, parts: [
        P(`Find the value of the investment, in euros, after $${years}$ years.`, 2, ans.sf(value), [`$V = ${num(pv)} \\times ${num(mult)}^{${years}}$`, `$V = ${sf(value)}$ (to three significant figures)`]),
        P(`Find the least number of complete years needed for the value of the investment to exceed $${num(target)}$ euros.`, 4, ans.int(least), [
          `Solve $${num(pv)} \\times ${num(mult)}^{t} > ${num(target)}$ on a calculator.`, `$t > ${sf(Math.log(target / pv) / Math.log(mult))}$`,
          `The least number of complete years is $${least}$.`])] };
    } });

  // ======================= 1.6 proof =======================
  reg({ type: "t1-algebraic-proof", syllabus: ["1.6"], representation: "words", format: "self", unknown: "consecutive-sum", levels: [2], fixedPool: true,
    skills: ["SL1.6.integer-proof"], title: "Prove a result about integers", source: "proof-even-odd",
    build({ rng }) {
      const c = rng.pick([
        { stem: "Let $n$ be an integer. Consider two consecutive odd integers.", ask: "Prove that the sum of two consecutive odd integers is divisible by $4$.",
          model: "The sum is $(2n + 1) + (2n + 3) = 4(n + 1)$, a multiple of $4$.",
          work: ["Two consecutive odd integers can be written as $2n + 1$ and $2n + 3$.", "$(2n + 1) + (2n + 3) = 4n + 4$", "$4n + 4 = 4(n + 1)$, and $n + 1$ is an integer, so the sum is divisible by $4$."] },
        { stem: "Let $n$ be an integer. Consider two consecutive even integers.", ask: "Prove that the product of two consecutive even integers is divisible by $8$.",
          model: "The product is $2n(2n + 2) = 4n(n + 1)$, and $n(n + 1)$ is even, so the product is a multiple of $8$.",
          work: ["Two consecutive even integers can be written as $2n$ and $2n + 2$.", "$2n(2n + 2) = 4n(n + 1)$", "One of the consecutive integers $n$ and $n + 1$ is even, so $n(n + 1)$ is even.", "So $4n(n + 1)$ is a multiple of $8$."] },
        { stem: "Let $n$ be an integer. Consider the integers $n$ and $n + 1$.", ask: "Prove that the difference between the squares of two consecutive integers is odd.",
          model: "$(n + 1)^{2} - n^{2} = 2n + 1$, which is odd.",
          work: ["$(n + 1)^{2} - n^{2} = n^{2} + 2n + 1 - n^{2}$", "$(n + 1)^{2} - n^{2} = 2n + 1$", "$2n$ is even, so $2n + 1$ is odd for every integer $n$."] },
        { stem: "Let $n$ be an integer. Consider three consecutive integers.", ask: "Prove that the sum of three consecutive integers is divisible by $3$.",
          model: "$n + (n + 1) + (n + 2) = 3(n + 1)$, a multiple of $3$.",
          work: ["Three consecutive integers can be written as $n$, $n + 1$ and $n + 2$.", "$n + (n + 1) + (n + 2) = 3n + 3$", "$3n + 3 = 3(n + 1)$, and $n + 1$ is an integer, so the sum is divisible by $3$."] },
        { stem: "Let $n$ be an integer. Consider an odd integer.", ask: "Prove that the square of an odd integer is one more than a multiple of $4$.",
          model: "$(2n + 1)^{2} = 4(n^{2} + n) + 1$.",
          work: ["An odd integer can be written as $2n + 1$.", "$(2n + 1)^{2} = 4n^{2} + 4n + 1$", "$4n^{2} + 4n + 1 = 4\\left(n^{2} + n\\right) + 1$, which is one more than a multiple of $4$."] }]);
      return { params: { stem: c.stem }, stem: c.stem, parts: [P(c.ask, 4, ans.self(c.model), c.work)] };
    } });

  // ======================= 1.7 logarithms =======================
  reg({ type: "t1-log-laws", syllabus: ["1.7", "2.7"], representation: "equation", format: "value", unknown: "solve-log-equation", levels: [3],
    skills: ["SL1.7.log-laws", "SL2.7.hidden-quadratic"], title: "Solve an equation with two logarithms", source: "log-equation",
    build({ rng }) {
      const [b, c, x0] = rng.pick([[2, 3, 2], [2, 4, 2], [2, 5, 4], [3, 3, 3], [5, 3, 5], [2, 6, 4], [3, 4, 3], [2, 6, 2], [2, 5, 2], [2, 4, 1], [3, 2, 1], [3, 3, 1], [2, 7, 8], [5, 2, 1], [2, 3, 1]]);
      const rhs = Math.pow(b, c), d = rhs / x0 - x0;
      return { params: { b, c, d }, stem: `Consider the equation $\\log_{${b}} x + \\log_{${b}}(x + ${d}) = ${c}$, for $x > 0$.`, parts: [
        P("The equation can be written as $x(x + " + d + ") = N$. Find the value of $N$.", 2, ans.int(rhs), [
          `$\\log_{${b}} x + \\log_{${b}}(x + ${d}) = \\log_{${b}}\\left(x(x + ${d})\\right)$`, `$x(x + ${d}) = ${b}^{${c}} = ${rhs}$`]),
        P("Hence solve the equation.", 3, ans.int(x0), [`$${poly([1, d, -rhs])} = 0$`, `$${factor(x0)}${factor(-(x0 + d))} = 0$, so $x = ${x0}$ or $x = ${-(x0 + d)}$`, `Since $x > 0$, the solution is $x = ${x0}$.`])] };
    } });

  // ======================= 1.9 binomial theorem =======================
  reg({ type: "t1-binomial-find-unknown", syllabus: ["1.9"], representation: "equation", format: "value", unknown: "k-positive-condition", levels: [3],
    skills: ["SL1.9.find-unknown", "SL1.9.specific-term"], title: "Find a constant from a binomial coefficient", source: "binomial-coeff",
    build({ rng }) {
      const C = (n, r) => { let v = 1; for (let i = 0; i < r; i++) v = (v * (n - i)) / (i + 1); return Math.round(v); };
      const n = rng.int(5, 9), e = rng.int(2, 3), mm = n - e, k = rng.int(2, 4), binom = C(n, e), coeff = binom * Math.pow(k, e);
      return { params: { n, mm, coeff }, stem: `In the expansion of $(x + k)^{${n}}$, where $k > 0$, the coefficient of $x^{${mm}}$ is $${num(coeff)}$.`, parts: [
        P(`The term in $x^{${mm}}$ is $\\dbinom{${n}}{r}x^{${mm}}k^{r}$. Write down the value of $r$.`, 1, ans.int(e), [`The powers of $x$ and $k$ add up to $${n}$, so $r = ${n} - ${mm} = ${e}$.`]),
        P("Find the value of $k$.", 4, ans.int(k), [`$\\dbinom{${n}}{${e}} = ${binom}$`, `$${binom}k^{${e}} = ${num(coeff)}$, so $k^{${e}} = ${Math.pow(k, e)}$`, `$k > 0$, so $k = ${k}$.`])] };
    } });
})(typeof globalThis !== "undefined" ? globalThis : this);
