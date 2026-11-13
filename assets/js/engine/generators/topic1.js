/* Topic 1 (Number and algebra) generators. Self-contained: needs only engine.js.
   Each generator's independent verifier is in scripts/engine-checks/topic1.mjs under the same id.
   `source` names the old practice template a generator was ported from. */
(function (root) {
  "use strict";
  const E = root.QBEngine;
  const { ans, fmt } = E;
  const { num, frac, poly, lin, signed, paren, br, expr, m, sf, coef, rat, pct, factor, unit } = fmt;
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
  // =====================================================================================
  // Second batch: levels 0 to 4 for every subtopic. Helpers first.
  // =====================================================================================
  const nCr = (n, r) => { let v = 1; for (let i = 0; i < r; i++) v = (v * (n - i)) / (i + 1); return Math.round(v); };
  const gcd2 = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const sci = (a, k) => `${num(a)} \\times 10^{${k}}`;
  const FORM = "$a \\times 10^{k}$, where $1 \\le a < 10$ and $k$ is an integer";
  // true when a value sits close to a three-significant-figure rounding edge
  const edge3 = (x) => { const s = Math.abs(x) / Math.pow(10, Math.floor(Math.log10(Math.abs(x))) - 2); return Math.abs(s - Math.floor(s) - 0.5) < 0.04; };
  const SF3 = "(to three significant figures)";
  const mono = (c, e, v) => (e === 0 ? num(c) : coef(c, pw(v || "x", e)));
  const negB = (v) => (v < 0 ? `(${num(v)})` : num(v));

  // ======================= 1.1 scientific notation =======================
  const SF = { type: "t1-standard-form", syllabus: ["1.1"], format: "value" };
  reg({ ...SF, unknown: "to-form-large", representation: "equation", levels: [1], skills: ["SL1.1.convert"], title: "Write a large number in standard form",
    build({ rng }) {
      const digits = rng.int(2, 3), k = rng.int(4, 8);
      let d;
      do { d = rng.int(digits === 2 ? 11 : 101, digits === 2 ? 99 : 999); } while (d % 10 === 0);
      const N = d * Math.pow(10, k - digits + 1), a = d / Math.pow(10, digits - 1);
      return { params: { N }, stem: `The number $${num(N)}$ is written in the form ${FORM}.`, parts: [
        P("Write down the value of $a$.", 1, ans.dec(a, { misconceptions: [{ value: d, text: "$a$ must be at least $1$ and less than $10$." }] }), [
          `Put the decimal point after the first digit: $a = ${num(a)}$.`]),
        P("Write down the value of $k$.", 1, ans.int(k, { misconceptions: [{ value: -k, text: "A large number has a positive power of $10$." }] }), [
          `$${num(N)} = ${num(a)} \\times ${num(Math.pow(10, k))}$`, `$${num(Math.pow(10, k))} = 10^{${k}}$, so $k = ${k}$.`])] };
    } });
  reg({ ...SF, unknown: "to-form-small", representation: "equation", levels: [1], skills: ["SL1.1.convert"], title: "Write a small number in standard form",
    build({ rng }) {
      const digits = rng.int(2, 3), k = -rng.int(2, 5);
      let d;
      do { d = rng.int(digits === 2 ? 11 : 101, digits === 2 ? 99 : 999); } while (d % 10 === 0);
      const text = "0." + "0".repeat(-k - 1) + String(d), unitText = "0." + "0".repeat(-k - 1) + "1", a = d / Math.pow(10, digits - 1);
      return { params: { N: Number(text) }, stem: `The number $${text}$ is written in the form ${FORM}.`, parts: [
        P("Write down the value of $a$.", 1, ans.dec(a), [`Put the decimal point after the first digit that is not zero: $a = ${num(a)}$.`]),
        P("Write down the value of $k$.", 1, ans.int(k, { misconceptions: [{ value: -k, text: "A number smaller than $1$ has a negative power of $10$." }] }), [
          `$${text} = ${num(a)} \\times ${unitText}$`, `$${unitText} = 10^{${k}}$, so $k = ${k}$.`])] };
    } });
  reg({ ...SF, unknown: "multiply-renormalise", representation: "equation", levels: [2], skills: ["SL1.1.multiply-divide", "SL1.1.convert"], title: "Multiply two numbers in standard form",
    build({ rng }) {
      let a10, b, mm, n, k;
      do { a10 = rng.pick([12, 15, 25, 32, 35, 45, 75, 40, 60, 80]); b = rng.int(2, 9); mm = rng.int(-7, 9); n = rng.int(-7, 9); k = mm + n + 1; }
      while (a10 * b < 100 || a10 * b >= 1000 || [mm, n, mm + n, k].some((e) => e === 0 || e === 1) || mm === n);
      const prod = (a10 * b) / 10, c = (a10 * b) / 100;
      return { params: { a: a10 / 10, m: mm, b, n }, stem: `Let $p = ${sci(a10 / 10, mm)}$ and $q = ${sci(b, n)}$. The product $pq$ is written in the form ${FORM}.`, parts: [
        P("Find the value of $a$.", 2, ans.dec(c, { misconceptions: [{ value: prod, text: "$a$ must be less than $10$, so one more factor of $10$ has to move into the power." }] }), [
          `$pq = (${num(a10 / 10)} \\times ${b}) \\times 10^{${mm} ${signed(n)}}$`, `$pq = ${num(prod)} \\times 10^{${mm + n}}$`, `$${num(prod)} = ${num(c)} \\times 10$, so $a = ${num(c)}$.`]),
        P("Find the value of $k$.", 2, ans.int(k, { misconceptions: [{ value: mm + n, text: "Writing the first factor as a number below $10$ adds one to the power." }] }), [
          `$pq = ${num(c)} \\times 10 \\times 10^{${mm + n}}$`, `$k = ${mm + n} + 1 = ${k}$`])] };
    } });
  reg({ ...SF, unknown: "divide-renormalise", representation: "equation", levels: [2], skills: ["SL1.1.multiply-divide", "SL1.1.convert"], title: "Divide two numbers in standard form",
    build({ rng }) {
      let mm, n, k;
      const [a10, b10] = rng.pick([[12, 40], [15, 60], [24, 80], [30, 40], [10, 80], [20, 50], [36, 48], [18, 72], [42, 84], [27, 90], [30, 80], [14, 56], [28, 35], [45, 90], [12, 96]]);
      do { mm = rng.int(-7, 9); n = rng.int(-7, 9); k = mm - n - 1; } while ([mm, n, mm - n, k].some((e) => e === 0 || e === 1) || mm === n);
      const ratio = a10 / b10, c = (a10 * 10) / b10;
      return { params: { a: a10 / 10, m: mm, b: b10 / 10, n }, stem: `Let $p = ${sci(a10 / 10, mm)}$ and $q = ${sci(b10 / 10, n)}$. The quotient $\\dfrac{p}{q}$ is written in the form ${FORM}.`, parts: [
        P("Find the value of $a$.", 2, ans.dec(c, { misconceptions: [{ value: ratio, text: "$a$ must be at least $1$, so a factor of $10$ has to come out of the power." }] }), [
          `$\\dfrac{p}{q} = \\dfrac{${num(a10 / 10)}}{${num(b10 / 10)}} \\times 10^{${mm} ${signed(-n)}}$`, `$\\dfrac{p}{q} = ${num(ratio)} \\times 10^{${mm - n}}$`, `$${num(ratio)} = ${num(c)} \\times 10^{-1}$, so $a = ${num(c)}$.`]),
        P("Find the value of $k$.", 2, ans.int(k, { misconceptions: [{ value: mm - n, text: "Writing the first factor as a number of at least $1$ takes one from the power." }] }), [
          `$\\dfrac{p}{q} = ${num(c)} \\times 10^{-1} \\times 10^{${mm - n}}$`, `$k = ${mm - n} - 1 = ${k}$`])] };
    } });
  reg({ ...SF, unknown: "total-from-unit", representation: "words", levels: [3], skills: ["SL1.1.context", "SL1.1.multiply-divide"], title: "Very small masses: a total and a count",
    build({ rng }) {
      const cx = rng.pick([
        { one: "The mass of one grain of pollen is", many: "A sample contains", things: "grains", total: "total mass of the sample", second: "A second sample of the same pollen has a mass of", count: "number of grains in the second sample" },
        { one: "The mass of one bacterium is", many: "A colony contains", things: "bacteria", total: "total mass of the colony", second: "A second colony of the same bacteria has a mass of", count: "number of bacteria in the second colony" },
        { one: "The mass of one particle of dust is", many: "A filter has collected", things: "particles", total: "total mass of the dust on the filter", second: "A second filter holds dust of the same kind with a mass of", count: "number of particles on the second filter" }]);
      const [a3, a1] = rng.pick([[12, 40], [15, 60], [24, 80], [30, 40], [10, 80], [20, 50], [36, 48], [18, 72], [42, 84], [27, 90], [30, 80], [14, 56]]);
      let b1, e1, e2, j;
      do { b1 = rng.int(3, 9); e1 = rng.int(6, 9); e2 = rng.int(3, 12); j = rng.int(2, e1 - 3); } while (a1 * b1 < 100 || a1 * b1 >= 1000 || Math.abs(e2 - e1) < 2);
      const e3 = e1 - 1 - j, prod = (a1 * b1) / 10, c = (a1 * b1) / 100, k = e2 - e1 + 1, ratio = a3 / a1, c2 = (a3 * 10) / a1;
      return { params: { m1: a1 / 10, e1, n1: b1, e2, m3: a3 / 10, e3 },
        stem: `${cx.one} $${unit(sci(a1 / 10, -e1), "g")}$. ${cx.many} $${sci(b1, e2)}$ ${cx.things}.`, parts: [
          P(`The ${cx.total} is $a \\times 10^{k}$ grams, where $1 \\le a < 10$ and $k$ is an integer. Find the value of $a$.`, 2, ans.dec(c), [
            `$(${sci(a1 / 10, -e1)}) \\times (${sci(b1, e2)}) = ${num(prod)} \\times 10^{${e2 - e1}}$`, `$${num(prod)} = ${num(c)} \\times 10$, so $a = ${num(c)}$.`]),
          P("Find the value of $k$.", 1, ans.int(k), [`$${num(prod)} \\times 10^{${e2 - e1}} = ${num(c)} \\times 10^{${k}}$, so $k = ${k}$.`]),
          P(`${cx.second} $${unit(sci(a3 / 10, -e3), "g")}$. The ${cx.count} is $b \\times 10^{n}$, where $1 \\le b < 10$ and $n$ is an integer. Find the value of $b$.`, 2, ans.dec(c2), [
            `$\\dfrac{${sci(a3 / 10, -e3)}}{${sci(a1 / 10, -e1)}} = ${num(ratio)} \\times 10^{${e1 - e3}}$`, `$${num(ratio)} = ${num(c2)} \\times 10^{-1}$, so $b = ${num(c2)}$.`]),
          P("Find the value of $n$.", 1, ans.int(j), [`$${num(ratio)} \\times 10^{${e1 - e3}} = ${num(c2)} \\times 10^{${j}}$, so $n = ${j}$.`])] };
    } });
  reg({ ...SF, unknown: "sphere-volume-pi", representation: "words", levels: [4], calculator: true, skills: ["SL1.1.context", "SL1.1.powers-roots", "SL1.1.multiply-divide"], title: "Volume and density of a sphere in standard form",
    build({ rng }) {
      const body = rng.pick([{ a: "A moon", n: "moon" }, { a: "A planet", n: "planet" }, { a: "A large asteroid", n: "asteroid" }]);
      let rm, re, V, vk, va, mk, mm, density;
      do {
        rm = rng.int(115, 985) / 100; re = rng.int(5, 7);
        V = (4 / 3) * Math.PI * Math.pow(rm * Math.pow(10, re), 3); vk = Math.floor(Math.log10(V)); va = V / Math.pow(10, vk);
        const m0 = V * rng.int(1500, 7900); mk = Math.floor(Math.log10(m0)); mm = Number((m0 / Math.pow(10, mk)).toPrecision(3));
        density = (mm * Math.pow(10, mk)) / V;
      } while (edge3(va) || edge3(density) || mm >= 10 || Math.round(rm * 100) % 10 === 0 || Math.round(mm * 100) % 10 === 0);
      return { params: { rm, re, mm, mk },
        stem: `${body.a} is modelled as a sphere with radius $${unit(sci(rm, re), "m")}$ and mass $${unit(sci(mm, mk), "kg")}$.`, parts: [
          P(`The volume of the ${body.n} is $a \\times 10^{k}\\text{ m}^{3}$, where $1 \\le a < 10$ and $k$ is an integer. Find the value of $a$, correct to three significant figures.`, 2, ans.sf(va), [
            `$V = \\dfrac{4}{3}\\pi r^{3} = \\dfrac{4}{3}\\pi\\left(${sci(rm, re)}\\right)^{3}$`, `$V = ${sf(va)} \\times 10^{${vk}}\\text{ m}^{3}$, so $a = ${sf(va)}$ ${SF3}.`]),
          P("Write down the value of $k$.", 1, ans.int(vk), [`From the volume found above, $k = ${vk}$.`]),
          P(`Find the average density of the ${body.n}, in $\\text{kg m}^{-3}$.`, 3, ans.sf(density), [
            `$\\text{density} = \\dfrac{\\text{mass}}{\\text{volume}} = \\dfrac{${sci(mm, mk)}}{${sf(va, 5)} \\times 10^{${vk}}}$`, "Keep the unrounded volume on the calculator.",
            `$\\text{density} = ${sf(density)}\\text{ kg m}^{-3}$ ${SF3}`])] };
    } });

  // ======================= 1.2 arithmetic sequences: recall and procedure =======================
  const arSit = (rng) => ({ u1: rng.int(-12, 30), d: rng.nonzero(-6, 9), n: rng.int(10, 30) });
  reg({ ...AS, unknown: "term-from-u1-d", representation: "notation", levels: [1], skills: ["SL1.2.nth-term"], title: "A term from the first term and the difference",
    situationKey: "arith-u1-d", situation: arSit,
    build({ sit: s }) {
      const un = s.u1 + (s.n - 1) * s.d;
      return { stem: `An arithmetic sequence has first term $u_{1} = ${s.u1}$ and common difference $d = ${s.d}$.`, parts: [
        P(`Find $u_{${s.n}}$.`, 2, ans.int(un, { misconceptions: [{ value: s.u1 + s.n * s.d, text: `The first term already counts as one term, so the difference is added $${s.n - 1}$ times.` }] }), [
          `$u_{n} = u_{1} + (n - 1)d$`, `$u_{${s.n}} = ${s.u1} + ${s.n - 1}${br(s.d)} = ${un}$`])] };
    } });
  reg({ ...AS, unknown: "sum-from-u1-d", representation: "terms", levels: [2], skills: ["SL1.2.nth-term", "SL1.2.sum"], title: "From the first three terms: difference, a term and a sum",
    situationKey: "arith-u1-d", situation: arSit,
    build({ sit: s }) {
      const t = [s.u1, s.u1 + s.d, s.u1 + 2 * s.d], un = s.u1 + (s.n - 1) * s.d, sn = (s.n * (s.u1 + un)) / 2;
      return { params: { t1: t[0], t2: t[1], n: s.n }, stem: `The first three terms of an arithmetic sequence are $${t[0]}$, $${t[1]}$ and $${t[2]}$.`, parts: [
        P("Write down the common difference.", 1, ans.int(s.d), [`$d = ${t[1]} - ${paren(t[0])} = ${s.d}$`]),
        P(`Find $u_{${s.n}}$.`, 1, ans.int(un), [`$u_{${s.n}} = ${s.u1} + ${s.n - 1}${br(s.d)} = ${un}$`]),
        P(`Find $S_{${s.n}}$.`, 2, ans.int(sn), [`$S_{${s.n}} = \\dfrac{${s.n}}{2}\\left(u_{1} + u_{${s.n}}\\right) = \\dfrac{${s.n}}{2}\\left(${s.u1} + ${paren(un)}\\right)$`, `$S_{${s.n}} = ${num(sn)}$`])] };
    } });
  reg({ ...AS, unknown: "n-from-sum", representation: "notation", levels: [3], skills: ["SL1.2.sum-unknown", "SL1.2.find-n", "SL1.2.nth-term"], title: "The number of terms from a given sum",
    build({ rng }) {
      let d, N, mm;
      do { d = rng.pick([2, 3, 4, 6]); N = rng.int(8, 20); mm = N + rng.int(1, 12); } while ((d * (mm - N + 1)) % 2 !== 0);
      const u1 = (d * (mm - N + 1)) / 2, S = (d * N * mm) / 2, last = u1 + (N - 1) * d;
      const work = [`$\\dfrac{n}{2}\\left(2${br(u1)} + (n - 1)${br(d)}\\right) = ${num(S)}$`, `$n\\left(${lin(d, 2 * u1 - d, "n")}\\right) = ${num(2 * S)}$`, `$${poly([d, 2 * u1 - d, -2 * S], "n")} = 0$`];
      if (d > 1) work.push(`Divide by $${d}$: $${poly([1, mm - N, -N * mm], "n")} = 0$`);
      work.push(`$${factor(N, "n")}${factor(-mm, "n")} = 0$`, `$n$ is a positive integer, so $n = ${N}$.`);
      return { params: { u1, d, S }, stem: `An arithmetic sequence has first term $u_{1} = ${u1}$ and common difference $d = ${d}$. The sum of the first $n$ terms is $${num(S)}$.`, parts: [
        P("Find the value of $n$.", 4, ans.int(N), work),
        P("Find the last term included in this sum.", 2, ans.int(last), [`The last term is $u_{${N}} = ${u1} + ${N - 1}${br(d)}$`, `$u_{${N}} = ${last}$`])] };
    } });

  // ======================= 1.3 geometric sequences: recall, procedure, Paper 2 =======================
  reg({ ...GS, unknown: "r-from-terms", representation: "terms", levels: [1], skills: ["SL1.3.find-r-u1", "SL1.3.nth-term"], title: "The ratio and the next term from three terms",
    build({ rng }) {
      const [p, d] = rng.pick([[2, 1], [3, 1], [4, 1], [5, 1], [-2, 1], [-3, 1], [1, 2], [1, 3], [3, 2], [-1, 2], [2, 3], [-3, 2]]), u1 = d * d * d * rng.int(d === 1 ? 2 : 1, 4);
      const r = rat.Q(p, d), t = [u1, (u1 * p) / d, (u1 * p * p) / (d * d), (u1 * p * p * p) / (d * d * d)];
      return { params: { t1: t[0], t2: t[1], t3: t[2] }, stem: `The first three terms of a geometric sequence are $${t[0]}$, $${t[1]}$ and $${t[2]}$.`, parts: [
        P("Write down the common ratio.", 1, ans.frac(p, d), [`$r = \\dfrac{u_{2}}{u_{1}} = \\dfrac{${t[1]}}{${t[0]}}$`, `$r = ${rat.tex(r)}$`]),
        P("Find the fourth term.", 1, ans.int(t[3]), [`$u_{4} = u_{3} \\times r = ${t[2]} \\times ${paren(r)}$`, `$u_{4} = ${t[3]}$`])] };
    } });
  const GKIND = {
    decay: { ys: (T) => [T, T / 2, T / 4, T / 8, T / 16], r: [1, 2], why: "In this graph each term is half of the one before.", say: "Each term is half of the one before, so the points fall towards the horizontal axis without reaching it." },
    growth: { ys: (T) => [T / 16, T / 8, T / 4, T / 2, T], r: [2, 1], why: "In this graph each term is double the one before.", say: "Each term is double the one before, so the points rise more and more steeply." },
    alternating: { ys: (T) => [T, -T / 2, T / 4, -T / 8, T / 16], r: [-1, 2], why: "In this graph the terms change sign and halve in size.", say: "The ratio is negative, so the terms change sign each time, and they halve in size." },
    swinging: { ys: (T) => [T / 16, -T / 8, T / 4, -T / 2, T], r: [-2, 1], why: "In this graph the terms change sign and double in size.", say: "The ratio is negative, so the terms change sign each time, and they double in size." },
    arithmetic: { ys: (T) => [T, (3 * T) / 4, T / 2, T / 4, 0], why: "In this graph the terms fall by the same amount each time, so the sequence is arithmetic, not geometric." } };
  reg({ ...GS, unknown: "term-from-u1-r", representation: "graph", format: "graph", levels: [1], skills: ["SL1.3.nth-term"], title: "Pick the graph of a geometric sequence",
    build({ rng }) {
      const T = rng.pick([16, 12, 8]), kind = rng.pick(["decay", "growth", "alternating", "swinging"]), K = GKIND[kind], ys = K.ys(T);
      const dots = (v) => ({ x: [0, 6], y: [-10, 18], xStep: 1, yStep: 2, points: v.map((y, i) => ({ x: i + 1, y })), xLabel: "n", yLabel: "u", alt: "Five marked points, one for each of the first five terms" });
      const wrongs = rng.shuffle(Object.keys(GKIND).filter((x) => x !== kind)).map((x) => ({ graph: dots(GKIND[x].ys(T)), value: GKIND[x].ys(T), why: GKIND[x].why }));
      return { params: { u1: ys[0], rn: K.r[0], rd: K.r[1] }, stem: `A geometric sequence has first term $u_{1} = ${frac(ys[0] * 16, 16)}$ and common ratio $r = ${frac(K.r[0], K.r[1])}$. The terms $u_{n}$ are plotted against $n$.`, parts: [
        P("Which graph shows the first five terms of the sequence?", 2, ans.graph(rng, { graph: dots(ys), value: ys }, wrongs), [
          `The first five terms are ${fmt.list(ys.map((y) => `$${frac(y * 16, 16)}$`))}.`, K.say])] };
    } });
  reg({ ...GS, unknown: "term-exact", representation: "notation", levels: [2], skills: ["SL1.3.nth-term", "SL1.3.sum"], title: "An exact term and a short sum with a fractional ratio",
    build({ rng }) {
      const n = rng.int(4, 5), [p, d] = rng.pick([[1, 2], [3, 2], [-1, 2], [1, 3], [2, 3], [-1, 3], [-2, 3]]), k = rng.int(1, 3), u1 = k * Math.pow(d, n - 1);
      const terms = Array.from({ length: n }, (_, i) => k * Math.pow(p, i) * Math.pow(d, n - 1 - i)), un = terms[n - 1], sn = terms.reduce((a, b) => a + b, 0);
      const pn = rat.Q(Math.pow(p, n - 1), Math.pow(d, n - 1));
      return { params: { u1, rn: p, rd: d, n }, stem: `A geometric sequence has first term $u_{1} = ${u1}$ and common ratio $r = ${frac(p, d)}$.`, parts: [
        P(`Find $u_{${n}}$.`, 2, ans.int(un), [`$u_{${n}} = u_{1}r^{${n - 1}} = ${u1} \\times \\left(${frac(p, d)}\\right)^{${n - 1}}$`, `$u_{${n}} = ${u1} \\times ${paren(pn)} = ${un}$`]),
        P(`Find $S_{${n}}$.`, 2, ans.int(sn), [`The first $${n}$ terms are ${fmt.list(terms.map((t) => `$${t}$`))}.`, `$S_{${n}} = ${expr(terms.map((t) => [t, ""]))} = ${sn}$`])] };
    } });
  reg({ ...GS, unknown: "sigma-evaluate", representation: "notation", levels: [3], skills: ["SL1.3.sigma", "SL1.3.sum"], title: "Sigma notation for a geometric series",
    build({ rng }) {
      const b = rng.pick([2, 3, 4]), a = rng.int(1, 5), n = b === 2 ? rng.int(5, 8) : b === 3 ? rng.int(4, 6) : rng.int(3, 5), u1 = a * b, sum = (u1 * (Math.pow(b, n) - 1)) / (b - 1);
      const term = a === 1 ? `${b}^{r}` : `${a}\\left(${b}^{r}\\right)`;
      return { params: { a, b, n }, stem: `Consider the series $\\displaystyle\\sum_{r=1}^{${n}} ${term}$.`, parts: [
        P("Write down the first term of the series.", 1, ans.int(u1), [`When $r = 1$ the term is $${a === 1 ? b : `${a} \\times ${b} = ${u1}`}$.`]),
        P("Write down the common ratio of the series.", 1, ans.int(b), [`Each term is $${b}$ times the one before, so the common ratio is $${b}$.`]),
        P("Find the sum of the series.", 3, ans.int(sum), [`There are $${n}$ terms, so the sum is $S_{${n}} = \\dfrac{u_{1}\\left(r^{n} - 1\\right)}{r - 1} = \\dfrac{${u1}\\left(${b}^{${n}} - 1\\right)}{${b} - 1}$`,
          b === 2 ? `$S_{${n}} = ${u1} \\times ${num(Math.pow(b, n) - 1)}$` : `$S_{${n}} = \\dfrac{${u1} \\times ${num(Math.pow(b, n) - 1)}}{${b - 1}}$`, `$S_{${n}} = ${num(sum)}$`])] };
    } });
  const ORD = { 4: "fourth", 5: "fifth", 6: "sixth", 7: "seventh" };
  reg({ type: "t1-geometric-in-context", syllabus: ["1.3"], representation: "words", format: "value", unknown: "rebound-height", levels: [2], calculator: true,
    skills: ["SL1.3.model", "SL1.3.nth-term"], title: "A bouncing ball: ratio and a rebound height",
    build({ rng }) {
      let H, pc, n, h;
      do { H = rng.pick([2, 2.5, 3, 4, 5, 1.8]); pc = rng.pick([60, 65, 70, 72, 75, 80, 85]); n = rng.int(4, 7); h = H * Math.pow(pc / 100, n); } while (edge3(h));
      return { params: { H, pc, n }, stem: `A ball is dropped from a height of $${unit(H, "m")}$. After each bounce it rises to $${pct(pc)}$ of the height it reached before that bounce.`, parts: [
        P("The heights reached after each bounce form a geometric sequence. Write down its common ratio.", 1, ans.dec(pc / 100), [`$${pct(pc)}$ as a multiplier is $${num(pc / 100)}$.`]),
        P(`Find the height, in metres, that the ball reaches after its ${ORD[n]} bounce.`, 2, ans.sf(h, 3, { misconceptions: [{ value: H * Math.pow(pc / 100, n - 1), text: "The starting height is before any bounce, so one more multiplication is needed." }] }), [
          `After the first bounce the height is $${num(H)} \\times ${num(pc / 100)}$, so after $n$ bounces it is $${num(H)} \\times ${num(pc / 100)}^{n}$.`, `$${num(H)} \\times ${num(pc / 100)}^{${n}} = ${sf(h)}\\text{ m}$ ${SF3}`])] };
    } });
  reg({ type: "t1-geometric-in-context", syllabus: ["1.3"], representation: "words", format: "value", unknown: "least-n-term", levels: [4], calculator: true,
    skills: ["SL1.3.model", "SL1.3.nth-term", "SL1.3.sum", "SL1.3.find-n"], title: "Monthly profit growing by a percentage: a term, a total and a first month",
    build({ rng }) {
      let F, p, n, mult, r, x, kk, un, sn;
      do {
        F = rng.pick([1200, 1500, 2400, 3600, 800, 4500]); p = rng.pick([3, 4, 5, 6, 7.5, 8, 12, 2.5]); n = rng.int(6, 12); mult = rng.pick([2, 2.5, 3, 4]);
        r = 1 + p / 100; x = Math.log(mult) / Math.log(r); kk = Math.floor(x) + 2; un = F * Math.pow(r, n - 1); sn = (F * (Math.pow(r, n) - 1)) / (r - 1);
      } while (Math.abs(x - Math.round(x)) < 0.03 || kk > 40 || kk <= n || edge3(un) || edge3(sn));
      const target = F * mult;
      return { params: { F, p, n, target }, stem: `In its first month a new company makes a profit of $${num(F)}$ euros. In each month after the first, the profit is $${pct(p)}$ greater than in the month before.`, parts: [
        P(`Find the profit, in euros, in month $${n}$.`, 2, ans.sf(un), [`The monthly profits form a geometric sequence with $u_{1} = ${num(F)}$ and $r = ${num(r)}$.`, `$u_{${n}} = ${num(F)} \\times ${num(r)}^{${n - 1}} = ${sf(un)}$ ${SF3}`]),
        P(`Find the total profit, in euros, in the first $${n}$ months.`, 2, ans.sf(sn), [`$S_{${n}} = \\dfrac{${num(F)}\\left(${num(r)}^{${n}} - 1\\right)}{${num(r)} - 1}$`, `$S_{${n}} = ${sf(sn)}$ ${SF3}`]),
        P(`Find the first month in which the profit is more than $${num(target)}$ euros.`, 2, ans.int(kk, { misconceptions: [{ value: kk - 1, text: "The power in the term formula is one less than the month number." }] }), [
          `Solve $${num(F)} \\times ${num(r)}^{n - 1} > ${num(target)}$ on a calculator.`, `$n - 1 > ${sf(x)}$, so $n > ${sf(x + 1)}$`, `The first such month is month $${kk}$.`])] };
    } });

  // ======================= 1.4 financial applications: recall and Paper 1 =======================
  reg({ type: "t1-depreciation", syllabus: ["1.4"], representation: "equation", format: "value", unknown: "read-rate", levels: [1],
    skills: ["SL1.4.depreciation"], title: "Read the starting value and the rate from a model",
    build({ rng }) {
      const V0 = rng.pick([8000, 12000, 15000, 24000, 36000, 9500, 18500]), pc = rng.pick([5, 8, 10, 12, 15, 18, 20, 25]), mult = (100 - pc) / 100;
      return { params: { V0, mult }, stem: `The value of a machine, $V$ euros, $t$ years after it is bought is given by $V = ${num(V0)} \\times ${num(mult)}^{t}$.`, parts: [
        P("Write down the value of the machine, in euros, when it is bought.", 1, ans.int(V0), [`When $t = 0$, $V = ${num(V0)} \\times ${num(mult)}^{0} = ${num(V0)}$.`]),
        P("Find the percentage by which the value falls each year.", 1, ans.int(pc, { misconceptions: [{ value: 100 - pc, text: "That is the percentage of the value that is kept each year, not the percentage lost." }] }), [
          `Each year the value is multiplied by $${num(mult)}$, so $${pct(100 - pc)}$ of it is kept.`, `The fall is $100\\% - ${pct(100 - pc)} = ${pct(pc)}$.`])] };
    } });
  reg({ type: "t1-compound-interest", syllabus: ["1.4"], representation: "words", format: "value", unknown: "interest-earned", levels: [3],
    skills: ["SL1.4.future-value"], title: "Compound interest by hand over two or three years",
    build({ rng }) {
      let P0, rate, years, vals;
      do {
        P0 = rng.pick([1000, 2000, 3000, 4000, 5000, 6000, 8000]); [rate, years] = rng.pick([[10, 2], [10, 3], [20, 2], [20, 3], [5, 2], [10, 3], [30, 2]]);
        vals = [P0];
        for (let i = 0; i < years; i++) vals.push(Math.round(vals[i] * (100 + rate)) / 100);
      } while (vals.some((v) => !Number.isInteger(v)));
      const mult = (100 + rate) / 100, A = vals[years], word = years === 2 ? "two" : "three";
      const steps = [`After two years: $${num(vals[1])} \\times ${num(mult)} = ${num(vals[2])}$`];
      if (years === 3) steps.push(`After three years: $${num(vals[2])} \\times ${num(mult)} = ${num(vals[3])}$`);
      return { params: { P0, rate, years }, stem: `An amount of $${num(P0)}$ euros is invested in an account that pays $${pct(rate)}$ interest per year, compounded annually.`, parts: [
        P("Find the value of the investment, in euros, after one year.", 2, ans.int(vals[1]), [`Adding $${pct(rate)}$ multiplies the value by $${num(mult)}$.`, `$${num(P0)} \\times ${num(mult)} = ${num(vals[1])}$`]),
        P(`Find the value of the investment, in euros, after ${word} years.`, 2, ans.int(A, { misconceptions: [{ value: P0 + (years * P0 * rate) / 100, text: "That adds the same interest every year. Compound interest is earned on the interest too." }] }), steps),
        P(`Find the total interest earned, in euros, over the ${word} years.`, 1, ans.int(A - P0), [`$${num(A)} - ${num(P0)} = ${num(A - P0)}$`])] };
    } });

  // ======================= 1.5 integer exponents and an introduction to logarithms =======================
  const XL = { type: "t1-ext-exponent-laws", syllabus: ["1.5"], representation: "equation" };
  reg({ ...XL, unknown: "evaluate-zero-negative", format: "value", levels: [0], skills: ["SL1.5.zero-negative"], title: "Evaluate negative integer powers",
    build({ rng }) {
      let b, n, s, t, n2;
      do { b = rng.int(2, 6); n = rng.int(1, 3); } while (Math.pow(b, n) > 216);
      do { s = rng.int(2, 5); t = rng.int(2, 5); n2 = rng.int(2, 3); } while (gcd2(s, t) !== 1);
      return { params: { b, n, s, t, n2 }, stem: `Consider the numbers $${b}^{${-n}}$ and $\\left(\\dfrac{${s}}{${t}}\\right)^{${-n2}}$.`, parts: [
        P("Find the value of the first number, giving your answer as a fraction.", 1, ans.frac(1, Math.pow(b, n), { misconceptions: [{ value: -Math.pow(b, n), text: "A negative power gives a reciprocal, not a negative number." }] }),
          n === 1 ? [`$${b}^{-1} = \\dfrac{1}{${b}}$`] : [`$${b}^{${-n}} = \\dfrac{1}{${b}^{${n}}}$`, `$${b}^{${-n}} = \\dfrac{1}{${Math.pow(b, n)}}$`]),
        P("Find the value of the second number.", 1, ans.frac(Math.pow(t, n2), Math.pow(s, n2)), [
          `A negative power turns the fraction upside down: $\\left(\\dfrac{${s}}{${t}}\\right)^{${-n2}} = \\left(\\dfrac{${t}}{${s}}\\right)^{${n2}}$`, `$\\left(\\dfrac{${t}}{${s}}\\right)^{${n2}} = ${frac(Math.pow(t, n2), Math.pow(s, n2))}$`])] };
    } });
  reg({ ...XL, unknown: "simplify-powers", format: "mcq", levels: [1], skills: ["SL1.5.integer-exponent-laws", "SL1.5.zero-negative"], title: "Simplify with the laws of exponents",
    build({ rng }) {
      let a, mm, n;
      do { a = rng.int(2, 5); mm = rng.int(2, 5); n = -rng.int(1, 7); } while ([2 * mm + n, mm + 2 + n].some((e) => e === 0 || e === 1));
      const o = (c, e, why) => ({ text: `$${mono(c, e)}$`, value: [c, e], why });
      return { params: { a, m: mm, n }, stem: `Consider the expression $\\left(${a}x^{${mm}}\\right)^{2} \\times x^{${n}}$.`, parts: [
        P("Which of the following is equal to this expression?", 2, ans.choice(rng, o(a * a, 2 * mm + n), rng.shuffle([
          o(a, 2 * mm + n, "The number inside the bracket is squared too."), o(a * a, mm + 2 + n, "A power of a power multiplies the two powers."),
          o(2 * a, 2 * mm + n, "Squaring a number is not the same as doubling it."), o(a * a, 2 * mm - n, "Multiplying adds the powers, and here the second power is negative.")])), [
          `$\\left(${a}x^{${mm}}\\right)^{2} = ${a}^{2}x^{${mm} \\times 2} = ${mono(a * a, 2 * mm)}$`, `$${mono(a * a, 2 * mm)} \\times x^{${n}} = ${a * a}x^{${2 * mm} ${signed(n)}} = ${mono(a * a, 2 * mm + n)}$`])] };
    } });
  const LF = { type: "t1-log-exp-form", syllabus: ["1.5"] };
  reg({ ...LF, unknown: "value-whole-power", representation: "equation", format: "value", levels: [1], skills: ["SL1.5.exp-log-form"], title: "Evaluate simple logarithms",
    build({ rng }) {
      let b, n, c;
      do { b = rng.pick([2, 3, 4, 5, 6, 10]); n = rng.int(2, 6); c = rng.pick([2, 3, 5, 7, 10]); } while (Math.pow(b, n) > (b === 10 ? 10000 : 1024) || c === b);
      const N = Math.pow(b, n), one = rng.bool();
      return { params: { b, N, c, arg: one ? 1 : c }, stem: `Consider the logarithms $\\log_{${b}} ${num(N)}$ and $\\log_{${c}} ${one ? 1 : c}$.`, parts: [
        P(`Find the value of $\\log_{${b}} ${num(N)}$.`, 1, ans.int(n), [`$${b}^{${n}} = ${num(N)}$, so $\\log_{${b}} ${num(N)} = ${n}$.`]),
        P(`Find the value of $\\log_{${c}} ${one ? 1 : c}$.`, 1, ans.int(one ? 0 : 1), [one ? `$${c}^{0} = 1$, so $\\log_{${c}} 1 = 0$.` : `The first power of $${c}$ is $${c}$ itself, so $\\log_{${c}} ${c} = 1$.`])] };
    } });
  reg({ ...LF, unknown: "to-log-form", representation: "equation", format: "mcq", levels: [1], skills: ["SL1.5.exp-log-form"], title: "Rewrite a power statement as a logarithm",
    build({ rng }) {
      let b, n;
      do { b = rng.pick([2, 3, 4, 5, 6, 7, 10]); n = rng.int(2, 5); } while (b === n || Math.pow(b, n) > 2500 || Math.pow(b, n) === Math.pow(n, b));
      const N = Math.pow(b, n), o = (base, arg, res, why) => ({ text: `$\\log_{${base}} ${arg} = ${res}$`, value: [base, arg, res], why });
      return { params: { b, n, N }, stem: `It is given that $${b}^{${n}} = ${N}$.`, parts: [
        P("Which statement says the same thing?", 2, ans.choice(rng, o(b, N, n), [
          o(n, N, b, "The base of the logarithm is the base of the power, not the index."), o(b, n, N, "The logarithm is the index, so the index stands alone on the right."),
          o(N, b, n, "The base of the logarithm is the number that is raised to a power.")]), [
          `$a^{x} = b$ says the same as $\\log_{a} b = x$.`, `Here the base is $${b}$ and the index is $${n}$, so $\\log_{${b}} ${N} = ${n}$.`])] };
    } });
  reg({ ...LF, unknown: "solve-log-linear", representation: "equation", format: "value", levels: [2], skills: ["SL1.5.exp-log-form", "SL1.5.zero-negative"], title: "A logarithm of a reciprocal, and a logarithmic equation",
    build({ rng }) {
      let b1, n1, c, mm, p, x0, q;
      do { b1 = rng.pick([2, 3, 4, 5, 10]); n1 = rng.int(2, 4); } while (Math.pow(b1, n1) > 1000);
      do { c = rng.pick([2, 3, 5, 10]); mm = rng.int(2, 4); p = rng.int(2, 5); x0 = rng.int(1, 9); q = Math.pow(c, mm) - p * x0; } while (Math.pow(c, mm) > 125 || q === 0);
      const N = Math.pow(b1, n1), K = Math.pow(c, mm);
      return { params: { b1, N, c, m: mm, p, q }, stem: `Consider the number $\\log_{${b1}}\\left(\\dfrac{1}{${N}}\\right)$ and the equation $\\log_{${c}}(${lin(p, q)}) = ${mm}$.`, parts: [
        P("Find the value of the number.", 2, ans.int(-n1, { misconceptions: [{ value: n1, text: "The logarithm of a number between $0$ and $1$ is negative." }] }), [
          `$\\dfrac{1}{${N}} = ${b1}^{${-n1}}$`, `$\\log_{${b1}}\\left(${b1}^{${-n1}}\\right) = ${-n1}$`]),
        P("Solve the equation.", 2, ans.int(x0), [`$${lin(p, q)} = ${c}^{${mm}}$`, `$${lin(p, q)} = ${K}$`, `$${p}x = ${K - q}$, so $x = ${x0}$`])] };
    } });
  reg({ ...LF, unknown: "solve-log-square", representation: "equation", format: "value", levels: [3], skills: ["SL1.5.exp-log-form"], title: "Logarithmic equations that become a quadratic or a power",
    build({ rng }) {
      let c, mm, x1, x2, p, q, t, n;
      do { [c, mm] = rng.pick([[2, 3], [3, 2], [2, 4], [5, 2], [3, 3], [2, 5], [10, 2], [2, 2], [4, 2], [6, 2]]); x1 = rng.int(-9, 4); x2 = x1 + rng.int(1, 9); p = -(x1 + x2); q = x1 * x2 + Math.pow(c, mm); }
      while (p === 0 || q === 0);
      do { t = rng.pick([2, 3, 4, 5, 6, 10]); n = rng.int(2, 4); } while (Math.pow(t, n) > 1300 || t === c);
      const K = Math.pow(c, mm), M = Math.pow(t, n), quad = poly([1, p, q]);
      return { params: { c, m: mm, p, q, M, n }, stem: `Consider the equation $\\log_{${c}}\\left(${quad}\\right) = ${mm}$.`, parts: [
        P("Find the smaller solution of the equation.", 3, ans.int(x1), [`$${quad} = ${c}^{${mm}}$`, `$${poly([1, p, q - K])} = 0$`, `$${factor(x1)}${factor(x2)} = 0$, so $x = ${x1}$ or $x = ${x2}$`,
          `Both values make $${quad}$ equal to $${K}$, which is positive, so both are solutions. The smaller is $${x1}$.`]),
        P("Find the larger solution of the equation.", 1, ans.int(x2), [`From the factorised form, the larger solution is $x = ${x2}$.`]),
        P(`Find the positive number $a$ for which $\\log_{a} ${num(M)} = ${n}$.`, 2, ans.int(t), [`$a^{${n}} = ${num(M)}$`, `$${t}^{${n}} = ${num(M)}$ and $a > 0$, so $a = ${t}$.`])] };
    } });
  reg({ ...LF, unknown: "model-time", representation: "words", format: "value", levels: [4], calculator: true, skills: ["SL1.5.log-context", "SL1.5.evaluate-tech", "SL1.5.exp-log-form"], title: "A logarithmic model: a value and a time",
    build({ rng }) {
      let A, B, t1, drop, t2, R1;
      do { A = rng.int(70, 95); B = rng.int(12, 30); t1 = rng.int(3, 8); drop = rng.int(15, 35); t2 = Math.pow(10, drop / B) - 1; R1 = A - B * Math.log10(t1 + 1); }
      while (drop % B === 0 || t2 > 80 || t2 < 1.5 || edge3(t2) || edge3(R1) || Math.abs(t2 - t1) < 0.5);
      const g = gcd2(drop, B), target = A - drop;
      return { params: { A, B, t1, target }, stem: `A student learns a list of words. The percentage of the words that the student remembers $t$ weeks later, $R$, is modelled by $R = ${A} - ${B}\\log_{10}(t + 1)$, for $t \\ge 0$.`, parts: [
        P("Write down the percentage remembered when $t = 0$.", 1, ans.int(A), [`$\\log_{10} 1 = 0$, so $R = ${A}$.`]),
        P(`Find the percentage remembered after $${t1}$ weeks.`, 2, ans.sf(R1), [`$R = ${A} - ${B}\\log_{10} ${t1 + 1}$`, `$R = ${sf(R1)}$ ${SF3}`]),
        P(`Find the value of $t$ at which the percentage remembered is $${target}$.`, 3, ans.sf(t2), [`$${A} - ${B}\\log_{10}(t + 1) = ${target}$`, `$\\log_{10}(t + 1) = \\dfrac{${drop}}{${B}}$`,
          `$t + 1 = 10^{\\frac{${drop / g}}{${B / g}}} = ${sf(t2 + 1, 4)}$`, `$t = ${sf(t2)}$ ${SF3}`])] };
    } });
  reg({ type: "t1-ext-logs-with-technology", syllabus: ["1.5"], representation: "equation", format: "value", unknown: "evaluate-and-solve", levels: [2], calculator: true,
    skills: ["SL1.5.evaluate-tech", "SL1.5.exp-log-form"], title: "Logarithms and simple exponential equations on a calculator",
    build({ rng }) {
      let N, M, A, R;
      do { N = rng.int(12, 95); M = rng.int(150, 950); A = rng.int(2, 5); R = rng.int(11, 60); }
      while (R % A === 0 || edge3(Math.log10(N)) || edge3(Math.log10(M)) || edge3(Math.log(R / A)) || M % 100 === 0);
      return { params: { N, M, A, R }, stem: "Use a calculator in this question, and give each answer correct to three significant figures.", parts: [
        P(`Find the value of $\\log_{10} ${N}$.`, 1, ans.sf(Math.log10(N)), [`$\\log_{10} ${N} = ${sf(Math.log10(N))}$ ${SF3}`]),
        P(`Solve $10^{x} = ${M}$.`, 1, ans.sf(Math.log10(M)), [`$x = \\log_{10} ${M} = ${sf(Math.log10(M))}$ ${SF3}`]),
        P(`Solve $${A}\\mathrm{e}^{x} = ${R}$.`, 2, ans.sf(Math.log(R / A)), [`$\\mathrm{e}^{x} = ${frac(R, A)}$`, `$x = \\ln\\left(${frac(R, A)}\\right) = ${sf(Math.log(R / A))}$ ${SF3}`])] };
    } });

  // ======================= 1.6 proof: checkable steps =======================
  const PROPS = {
    odd: { word: "odd", right: [[[0, 2, 1], "$2n$ is even, so $2n + 1$ is odd."], [[0, 2, -1], "$2n$ is even, so $2n - 1$ is odd."], [[0, 4, 3], "$4n + 3 = 2(2n + 1) + 1$, which is one more than an even number."], [[0, 2, 5], "$2n + 5 = 2(n + 2) + 1$, which is one more than an even number."], [[0, 6, 1], "$6n$ is even, so $6n + 1$ is odd."]],
      wrong: [[0, 1, 1], [0, 3, 0], [1, 0, 0], [0, 1, 2], [1, 0, 1], [0, 3, 1], [0, 5, 0]], ok: (v) => Math.abs(v % 2) === 1 },
    even: { word: "even", right: [[[1, 1, 0], "$n^{2} + n = n(n + 1)$, a product of two consecutive integers, and one of them is even."], [[0, 2, 4], "$2n + 4 = 2(n + 2)$, a multiple of $2$."], [[0, 4, 2], "$4n + 2 = 2(2n + 1)$, a multiple of $2$."], [[0, 6, 0], "$6n = 2(3n)$, a multiple of $2$."], [[1, -1, 0], "$n^{2} - n = n(n - 1)$, a product of two consecutive integers, and one of them is even."]],
      wrong: [[0, 1, 2], [0, 3, 1], [1, 0, 0], [0, 2, 1], [1, 0, 2], [0, 3, 0]], ok: (v) => v % 2 === 0 },
    three: { word: "a multiple of $3$", right: [[[0, 3, 6], "$3n + 6 = 3(n + 2)$, a multiple of $3$."], [[0, 6, 3], "$6n + 3 = 3(2n + 1)$, a multiple of $3$."], [[0, 3, -3], "$3n - 3 = 3(n - 1)$, a multiple of $3$."], [[0, 9, 0], "$9n = 3(3n)$, a multiple of $3$."]],
      wrong: [[0, 1, 3], [0, 3, 1], [0, 2, 3], [1, 0, 3], [0, 6, 2]], ok: (v) => v % 3 === 0 },
    four: { word: "a multiple of $4$", right: [[[4, 4, 0], "$4n^{2} + 4n = 4\\left(n^{2} + n\\right)$, a multiple of $4$."], [[0, 4, 8], "$4n + 8 = 4(n + 2)$, a multiple of $4$."], [[0, 8, 4], "$8n + 4 = 4(2n + 1)$, a multiple of $4$."], [[0, 4, -4], "$4n - 4 = 4(n - 1)$, a multiple of $4$."]],
      wrong: [[0, 2, 2], [0, 1, 4], [0, 4, 2], [1, 0, 0], [0, 2, 4], [0, 6, 0]], ok: (v) => v % 4 === 0 } };
  reg({ type: "t1-algebraic-proof", syllabus: ["1.6"], representation: "words", format: "mcq", unknown: "represent-integers", levels: [1],
    skills: ["SL1.6.integer-proof"], title: "Which expression always has the property?",
    build({ rng }) {
      const key = rng.pick(Object.keys(PROPS)), pr = PROPS[key], [rc, rwhy] = rng.pick(pr.right), val = (c, n) => c[0] * n * n + c[1] * n + c[2];
      const wrongs = rng.sample(pr.wrong, 3).map((c) => { let n = 0; while (pr.ok(val(c, n))) n++; return { text: `$${poly(c, "n")}$`, value: c, why: `When $n = ${n}$ this is $${val(c, n)}$, which is not ${pr.word}.` }; });
      return { params: { prop: key }, stem: "Let $n$ be an integer.", parts: [
        P(`Which of the following expressions is ${pr.word} for every value of $n$?`, 2, ans.choice(rng, { text: `$${poly(rc, "n")}$`, value: rc }, wrongs), [rwhy, "Each of the other expressions fails for at least one value of $n$."])] };
    } });
  reg({ type: "t1-ext-identity-constants", syllabus: ["1.6"], representation: "equation", format: "value", unknown: "expand-compare", levels: [2],
    skills: ["SL1.6.identity-constants", "SL1.6.identity-lhs-rhs"], title: "Find the constants in an identity",
    build({ rng }) {
      let a, b, c, p, q;
      do { a = rng.nonzero(-6, 6); b = rng.nonzero(-6, 6); c = rng.nonzero(-6, 6); p = 2 * a - b - c; q = a * a - b * c; } while (p === 0 || q === 0 || b === c);
      const sq = poly([1, 2 * a, a * a]), pr = poly([1, b + c, b * c]);
      return { params: { a, b, c }, stem: `It is given that $${factor(-a)}^{2} - ${factor(-b)}${factor(-c)} \\equiv px + q$ for all values of $x$, where $p$ and $q$ are constants.`, parts: [
        P("Find the value of $p$.", 2, ans.int(p), [`$${factor(-a)}^{2} = ${sq}$`, `$${factor(-b)}${factor(-c)} = ${pr}$`, `$${sq} - \\left(${pr}\\right) = ${poly([p, q])}$`, `Comparing the coefficients of $x$: $p = ${p}$`]),
        P("Find the value of $q$.", 2, ans.int(q), [`Comparing the constant terms: $q = ${a * a} - ${paren(b * c)}$`, `$q = ${q}$`])] };
    } });
  reg({ type: "t1-algebraic-proof", syllabus: ["1.6"], representation: "equation", format: "value", unknown: "finish-divisibility", levels: [3],
    skills: ["SL1.6.integer-proof", "SL1.6.identity-lhs-rhs"], title: "A difference of two squares that is always a multiple",
    build({ rng }) {
      const c = rng.int(1, 3), a = rng.int(2, 7), n0 = rng.pick([10, 20, 30, 50, 100]), k = 4 * a * c, X = c * n0 + a, Y = c * n0 - a;
      const plus = lin(c, a, "n"), minus = lin(c, -a, "n");
      return { params: { c, a, X, Y }, stem: `Let $n$ be an integer and let $N = (${plus})^{2} - (${minus})^{2}$.`, parts: [
        P("It can be shown that $N = kn$, where $k$ is a constant. Find the value of $k$.", 3, ans.int(k), [
          `$(${plus})^{2} = ${poly([c * c, 2 * a * c, a * a], "n")}$`, `$(${minus})^{2} = ${poly([c * c, -2 * a * c, a * a], "n")}$`, `Subtracting, $N = ${2 * a * c}n + ${2 * a * c}n = ${k}n$, so $k = ${k}$.`]),
        P("Write down the largest integer that divides $N$ for every integer $n$.", 1, ans.int(k), [`$N = ${k}n$ is always a multiple of $${k}$, and when $n = 1$ it is equal to $${k}$, so no larger integer divides every value of $N$.`]),
        P(`Hence find the value of $${X}^{2} - ${Y}^{2}$.`, 2, ans.int(k * n0), [`When $n = ${n0}$, $${plus} = ${X}$ and $${minus} = ${Y}$.`, `$${X}^{2} - ${Y}^{2} = ${k} \\times ${n0} = ${num(k * n0)}$`])] };
    } });

  // ======================= 1.7 rational exponents, log laws, exponential equations =======================
  const RX = { type: "t1-rational-exponents", syllabus: ["1.7"], representation: "equation", format: "value" };
  const rootCases = [];
  for (let d = 2; d <= 4; d++) for (let t = 2; t <= 10; t++) for (let p = 1; p <= 3; p++) if (gcd2(p, d) === 1 && Math.pow(t, d) <= 1000 && Math.pow(t, p) <= 1000) rootCases.push([t, d, p]);
  reg({ ...RX, unknown: "value-fraction", levels: [1], skills: ["SL1.7.rational-exponents"], title: "Evaluate a fractional power",
    build({ rng }) {
      const [t, d, p] = rng.pick(rootCases), base = Math.pow(t, d), work = [`$${base}^{\\frac{1}{${d}}} = ${t}$, because $${t}^{${d}} = ${base}$.`];
      if (p > 1) work.push(`$${base}^{\\frac{${p}}{${d}}} = ${t}^{${p}} = ${Math.pow(t, p)}$`);
      return { params: { base, p, d }, stem: `The number $${base}^{\\frac{${p}}{${d}}}$ is an integer.`, parts: [
        P("Find this integer.", 2, ans.int(Math.pow(t, p)), work)] };
    } });
  reg({ ...RX, unknown: "value-fraction-base", levels: [2], skills: ["SL1.7.rational-exponents"], title: "Negative fractional powers of a number and of a fraction",
    build({ rng }) {
      const [t, d, p] = rng.pick(rootCases.filter((c) => Math.pow(c[0], c[2]) <= 200)), base = Math.pow(t, d);
      let s, u, d2, p2;
      do { s = rng.int(2, 5); u = rng.int(2, 5); d2 = rng.int(2, 3); p2 = rng.int(1, 3); } while (gcd2(s, u) !== 1 || gcd2(p2, d2) !== 1);
      const A = Math.pow(s, d2), B = Math.pow(u, d2), wa = [`$${base}^{\\frac{1}{${d}}} = ${t}$`];
      if (p > 1) wa.push(`$${base}^{\\frac{${p}}{${d}}} = ${t}^{${p}} = ${Math.pow(t, p)}$`);
      wa.push(`$${base}^{-\\frac{${p}}{${d}}} = \\dfrac{1}{${Math.pow(t, p)}}$`);
      const wb = [`$\\left(\\dfrac{${A}}{${B}}\\right)^{-\\frac{${p2}}{${d2}}} = \\left(\\dfrac{${B}}{${A}}\\right)^{\\frac{${p2}}{${d2}}}$`, `$\\left(\\dfrac{${B}}{${A}}\\right)^{\\frac{1}{${d2}}} = \\dfrac{${u}}{${s}}$`];
      if (p2 > 1) wb.push(`$\\left(\\dfrac{${u}}{${s}}\\right)^{${p2}} = ${frac(Math.pow(u, p2), Math.pow(s, p2))}$`);
      return { params: { base, p, d, A, B, p2, d2 }, stem: `Consider the numbers $p = ${base}^{-\\frac{${p}}{${d}}}$ and $q = \\left(\\dfrac{${A}}{${B}}\\right)^{-\\frac{${p2}}{${d2}}}$.`, parts: [
        P("Find the value of $p$, giving your answer as a fraction.", 2, ans.frac(1, Math.pow(t, p)), wa),
        P("Find the value of $q$, giving your answer as a fraction.", 2, ans.frac(Math.pow(u, p2), Math.pow(s, p2)), wb)] };
    } });
  const LL = { type: "t1-log-laws", syllabus: ["1.7"], representation: "equation", format: "value" };
  reg({ ...LL, unknown: "value-hidden", levels: [2], skills: ["SL1.7.log-laws"], title: "Add and subtract logarithms to get a whole number",
    build({ rng }) {
      const [b, m1, m2, k] = rng.pick([[6, 4, 9, 2], [6, 12, 3, 2], [6, 8, 27, 3], [10, 4, 25, 2], [10, 20, 5, 2], [10, 8, 125, 3], [10, 40, 25, 3], [12, 3, 48, 2], [12, 9, 16, 2], [15, 9, 25, 2], [6, 2, 18, 2], [6, 54, 4, 3], [15, 3, 75, 2], [10, 2, 50, 2]]);
      let Q, j;
      do { Q = rng.pick([2, 3, 4, 5, 7]); j = rng.int(1, 3); } while (Math.pow(b, j) * Q > 1000 || Q === m1 || Q === m2 || (j === 1 && b * b * Q <= 1000));
      const top = Math.pow(b, j) * Q, L = (x) => `\\log_{${b}} ${x}`;
      return { params: { b, m1, m2, top, Q }, stem: `Consider the expressions $${L(m1)} + ${L(m2)}$ and $${L(top)} - ${L(Q)}$.`, parts: [
        P("Find the value of the first expression.", 2, ans.int(k), [`$${L(m1)} + ${L(m2)} = \\log_{${b}}(${m1} \\times ${m2}) = ${L(m1 * m2)}$`, `$${m1 * m2} = ${b}^{${k}}$, so the value is $${k}$.`]),
        P("Find the value of the second expression.", 2, ans.int(j), [`$${L(top)} - ${L(Q)} = \\log_{${b}}\\left(\\dfrac{${top}}{${Q}}\\right) = ${L(Math.pow(b, j))}$`,
          j === 1 ? `$${L(b)} = 1$` : `$${Math.pow(b, j)} = ${b}^{${j}}$, so the value is $${j}$.`])] };
    } });
  const cobCases = [];
  for (const t of [2, 3, 5]) for (let i = 2; i <= 4; i++) for (let j = 2; j <= 6; j++) if (gcd2(i, j) === 1 && Math.pow(t, i) <= 125 && Math.pow(t, j) <= (t === 2 ? 64 : 625)) cobCases.push([t, i, j]);
  reg({ ...LL, unknown: "cob-common-base", levels: [2], skills: ["SL1.7.change-of-base", "SL1.7.log-laws"], title: "Change of base to a common base",
    build({ rng }) {
      const [t, i, j] = rng.pick(cobCases), base = Math.pow(t, i), arg = Math.pow(t, j);
      return { params: { base, arg }, stem: `The number $\\log_{${base}} ${arg}$ can be written as a fraction.`, parts: [
        P("Find its exact value.", 3, ans.frac(j, i), [`$${base} = ${t}^{${i}}$ and $${arg} = ${t}^{${j}}$`, `$\\log_{${base}} ${arg} = \\dfrac{\\log_{${t}} ${arg}}{\\log_{${t}} ${base}}$`, `$\\log_{${base}} ${arg} = ${frac(j, i)}$`])] };
    } });
  reg({ ...LL, unknown: "given-log-laws", levels: [3], skills: ["SL1.7.log-laws", "SL1.7.change-of-base"], title: "Use given logarithms with the laws and a change of base",
    build({ rng }) {
      let p, q;
      do { p = rng.nonzero(-3, 5); q = rng.nonzero(-3, 5); } while (p === q || q % p === 0);
      const mm = rng.int(2, 3), n = rng.int(2, 3), A = mm * p + q, B = p - n * q;
      return { params: { p, q, m: mm, n }, stem: `It is given that $\\log_{a} x = ${p}$ and $\\log_{a} y = ${q}$, where $a > 1$.`, parts: [
        P(`Find the value of $\\log_{a}\\left(x^{${mm}}y\\right)$.`, 2, ans.int(A), [`$\\log_{a}\\left(x^{${mm}}y\\right) = ${mm}\\log_{a} x + \\log_{a} y$`, `$${mm}${br(p)} + ${paren(q)} = ${A}$`]),
        P(`Find the value of $\\log_{a}\\left(\\dfrac{x}{y^{${n}}}\\right)$.`, 2, ans.int(B), [`$\\log_{a}\\left(\\dfrac{x}{y^{${n}}}\\right) = \\log_{a} x - ${n}\\log_{a} y$`, `$${p} - ${n}${br(q)} = ${B}$`]),
        P("Find the value of $\\log_{x} y$.", 2, ans.frac(q, p), [`$\\log_{x} y = \\dfrac{\\log_{a} y}{\\log_{a} x}$`, `$\\log_{x} y = ${frac(q, p)}$`])] };
    } });
  reg({ type: "t1-ext-common-base", syllabus: ["1.7"], representation: "equation", format: "value", unknown: "solve-common-base", levels: [3],
    skills: ["SL1.7.common-base", "SL1.7.rational-exponents"], title: "Exponential equations with a common base",
    build({ rng }) {
      let t, i, j, t2, i2, j2, k, c, e, D, top;
      do { t = rng.pick([2, 3, 5]); i = rng.int(2, 3); j = rng.int(1, 5); } while (j % i === 0 || Math.pow(t, i) > 27 || Math.pow(t, j) > 243);
      do { t2 = rng.pick([2, 3, 5]); i2 = rng.int(1, 4); j2 = rng.int(1, 4); k = rng.int(1, 3); c = rng.nonzero(-3, 3); e = rng.nonzero(-3, 3); D = i2 - j2 * k; top = j2 * e - i2 * c; }
      while (i2 === j2 || gcd2(i2, j2) !== 1 || Math.pow(t2, Math.max(i2, j2)) > 81 || D === 0 || Math.abs(D) > 7 || top === 0);
      const A = Math.pow(t, i), R = Math.pow(t, j), A2 = Math.pow(t2, i2), B2 = Math.pow(t2, j2), x2 = rat.Q(top, D);
      const same = [i2 > 1 ? `$${A2} = ${t2}^{${i2}}$` : null, j2 > 1 ? `$${B2} = ${t2}^{${j2}}$` : null].filter(Boolean).join(" and ");
      const ex = (mult, body) => (mult === 1 ? body : `${mult}(${body})`);
      return { params: { A, R, A2, B2, k, c, e }, stem: `Consider the equations $${A}^{x} = ${R}$ and $${A2}^{${lin(1, c)}} = ${B2}^{${lin(k, e)}}$.`, parts: [
        P("Solve the first equation.", 2, ans.frac(j, i), [`$\\left(${t}^{${i}}\\right)^{x} = ${pw(t, j)}$`, `$${i}x = ${j}$, so $x = ${frac(j, i)}$`]),
        P("Solve the second equation.", 3, ans.frac(x2.n, x2.d), [`${same}, so $${t2}^{${ex(i2, lin(1, c))}} = ${t2}^{${ex(j2, lin(k, e))}}$`, `$${lin(i2, i2 * c)} = ${lin(j2 * k, j2 * e)}$`].concat(D === 1 ? [] : [`$${coef(D, "x")} = ${top}$`], [`$x = ${rat.tex(x2)}$`]))] };
    } });
  const SE = { type: "t1-solve-exponential", syllabus: ["1.7"], representation: "equation", format: "value" };
  reg({ ...SE, unknown: "isolate-e-exact", levels: [2], skills: ["SL1.7.solve-with-logs"], title: "Solve an exponential equation exactly",
    build({ rng }) {
      const A = rng.int(2, 5), M = rng.pick([2, 3, 5, 6, 7, 10]), k = rng.int(1, 4), B = rng.nonzero(-9, 9), C = A * M + B, kx = coef(k, "x");
      const tex = k === 1 ? `\\ln ${M}` : `\\dfrac{\\ln ${M}}{${k}}`, work = [`$${A}\\mathrm{e}^{${kx}} = ${C - B}$`, `$\\mathrm{e}^{${kx}} = ${M}$`, `$${kx} = \\ln ${M}$`];
      if (k > 1) work.push(`$x = ${tex}$`);
      return { params: { A, k, B, C }, stem: `Consider the equation $${A}\\mathrm{e}^{${kx}} ${signed(B)} = ${C}$.`, parts: [
        P("Solve the equation, giving your answer in exact form.", 3, ans.exact(Math.log(M) / k, tex), work)] };
    } });
  reg({ ...SE, unknown: "two-bases-3sf", levels: [4], calculator: true, skills: ["SL1.7.solve-with-logs", "SL1.7.log-laws"], title: "Exponential equations with different bases",
    build({ rng }) {
      let a, b, N, k, c, e, den, x1, x2;
      do {
        [a, b] = rng.sample([2, 3, 5, 7], 2); N = rng.int(10, 99); k = rng.int(1, 2); c = rng.nonzero(-3, 3); e = rng.int(-2, 3);
        den = k * Math.log(a) - Math.log(b); x1 = Math.log(N) / Math.log(a); x2 = (e * Math.log(b) - c * Math.log(a)) / den;
      } while (Math.abs(den) < 0.25 || Math.abs(x1 - Math.round(x1)) < 1e-9 || edge3(x1) || Math.abs(x2) < 0.1 || Math.abs(x2) > 30 || edge3(x2));
      const la = `\\ln ${a}`, lb = `\\ln ${b}`, rhsIdx = lin(1, e), rhs = expr(e > 0 || c > 0 ? [[e, lb], [-c, la]] : [[-c, la], [e, lb]]), lhs = expr([[k, la], [-1, lb]]);
      return { params: { a, b, N, k, c, e }, stem: `Consider the equations $${a}^{x} = ${N}$ and $${a}^{${lin(k, c)}} = ${b}^{${rhsIdx}}$.`, parts: [
        P("Solve the first equation.", 2, ans.sf(x1), [`$x${la} = \\ln ${N}$`, `$x = \\dfrac{\\ln ${N}}{${la}} = ${sf(x1)}$ ${SF3}`]),
        P("Solve the second equation.", 4, ans.sf(x2), [`Take logarithms of both sides: $(${lin(k, c)})${la} = ${e === 0 ? "x" : `(${rhsIdx})`}${lb}$`, `$x\\left(${lhs}\\right) = ${rhs}$`, `$x = \\dfrac{${rhs}}{${lhs}}$`, `$x = ${sf(x2)}$ ${SF3}`])] };
    } });

  // ======================= 1.8 sum to infinity: recall, procedure, more Paper 1 =======================
  reg({ type: "t1-sum-to-infinity", syllabus: ["1.8"], representation: "notation", format: "mcq", unknown: "exists-claim", levels: [1],
    skills: ["SL1.8.convergence"], title: "Which geometric sequence has a sum to infinity?",
    build({ rng }) {
      const good = rng.pick([[1, 2], [-1, 2], [2, 3], [-2, 3], [3, 4], [-3, 4], [1, 3], [-1, 4], [4, 5], [-3, 5]]);
      const bad = rng.sample([[3, 2], [-3, 2], [2, 1], [-2, 1], [5, 4], [-1, 1], [1, 1], [4, 3], [-5, 3], [-4, 3]], 3);
      const o = (r, why) => { const u1 = rng.int(2, 12); return { text: `$u_{1} = ${u1}$ and $r = ${frac(r[0], r[1])}$`, value: [u1, r[0] / r[1]], why }; };
      return { params: { n: 4 }, stem: "Four geometric sequences are described by their first term $u_{1}$ and common ratio $r$.", parts: [
        P("Which sequence has a finite sum to infinity?", 2, ans.choice(rng, o(good), bad.map((r) => o(r, Math.abs(r[0]) === r[1] ? "Here $|r| = 1$, so the terms never get smaller and the sums do not settle." : "Here $|r| > 1$, so the terms grow in size and the sums do not settle."))), [
          "A geometric sequence has a finite sum to infinity only when $-1 < r < 1$.", `Only $r = ${frac(good[0], good[1])}$ lies between $-1$ and $1$.`])] };
    } });
  const siSit = (rng) => { const [p, d] = rng.pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5]]); return { p, d, s: rng.bool(0.35) ? -1 : 1, k: rng.int(1, 3) }; };
  const siNums = (s) => { const u1 = s.k * s.d * s.d * (s.d - s.s * s.p), r = rat.Q(s.s * s.p, s.d); return { u1, r, u2: (u1 * s.s * s.p) / s.d, u3: (u1 * s.p * s.p) / (s.d * s.d), S: s.k * s.d * s.d * s.d, gap: rat.sub(1, r) }; };
  reg({ type: "t1-sum-to-infinity", syllabus: ["1.8"], representation: "terms", format: "value", unknown: "sinf-value", levels: [2],
    skills: ["SL1.8.sum-to-infinity", "SL1.8.convergence"], title: "Sum to infinity from the first three terms", situationKey: "sinf-seq", situation: siSit,
    build({ sit }) {
      const v = siNums(sit);
      return { params: { t1: v.u1, t2: v.u2 }, stem: `The first three terms of an infinite geometric sequence are $${v.u1}$, $${v.u2}$ and $${v.u3}$.`, parts: [
        P("Find the common ratio.", 1, ans.frac(v.r.n, v.r.d), [`$r = \\dfrac{u_{2}}{u_{1}} = \\dfrac{${v.u2}}{${v.u1}}$`, `$r = ${rat.tex(v.r)}$`]),
        P("Find the sum to infinity of the sequence.", 3, ans.int(v.S), [`$-1 < r < 1$, so the sum to infinity exists.`, `$S_{\\infty} = \\dfrac{u_{1}}{1 - r}$ and $1 - r = ${rat.tex(v.gap)}$`, `$S_{\\infty} = ${v.u1} \\div ${rat.tex(v.gap)} = ${v.S}$`])] };
    } });
  reg({ type: "t1-sum-to-infinity", syllabus: ["1.8"], representation: "notation", format: "value", unknown: "u1-from-sinf", levels: [2],
    skills: ["SL1.8.find-unknown", "SL1.8.sum-to-infinity"], title: "First term from the sum to infinity", situationKey: "sinf-seq", situation: siSit,
    build({ sit }) {
      const v = siNums(sit);
      return { params: { rn: v.r.n, rd: v.r.d, S: v.S }, stem: `An infinite geometric sequence has common ratio $r = ${rat.tex(v.r)}$ and sum to infinity $S_{\\infty} = ${v.S}$.`, parts: [
        P("Find the first term.", 2, ans.int(v.u1), [`$\\dfrac{u_{1}}{1 - r} = ${v.S}$ and $1 - r = ${rat.tex(v.gap)}$`, `$u_{1} = ${v.S} \\times ${rat.tex(v.gap)} = ${v.u1}$`]),
        P("Find the third term.", 2, ans.int(v.u3), [`$u_{3} = u_{1}r^{2} = ${v.u1} \\times \\left(${rat.tex(v.r)}\\right)^{2}$`, `$u_{3} = ${v.u1} \\times ${rat.tex(rat.mul(v.r, v.r))} = ${v.u3}$`])] };
    } });
  reg({ type: "t1-sum-to-infinity", syllabus: ["1.8"], representation: "words", format: "value", unknown: "recurring-decimal", levels: [3],
    skills: ["SL1.8.applications", "SL1.8.sum-to-infinity"], title: "A recurring decimal as a sum to infinity",
    build({ rng }) {
      let blk;
      do { blk = rng.int(12, 98); } while (blk % 11 === 0 || blk % 10 === 0);
      const s2 = String(blk).padStart(2, "0"), g = gcd2(blk, 99), p = blk / g, q = 99 / g;
      const work = [`$S_{\\infty} = \\dfrac{u_{1}}{1 - r} = \\dfrac{0.${s2}}{1 - 0.01}$`, `$\\dfrac{0.${s2}}{0.99} = \\dfrac{${blk}}{99}$`];
      work.push(g === 1 ? `This fraction is already in its lowest terms, so $p = ${p}$.` : `Dividing top and bottom by $${g}$ gives $${frac(p, q)}$, so $p = ${p}$.`);
      return { params: { blk }, stem: `The recurring decimal $0.${s2}${s2}${s2}\\ldots$ can be written as the infinite geometric series $0.${s2} + 0.00${s2} + 0.0000${s2} + \\ldots$`, parts: [
        P("Write down the common ratio of the series.", 1, ans.dec(0.01), [`$0.00${s2} \\div 0.${s2} = 0.01$`]),
        P("The decimal is equal to the fraction $\\dfrac{p}{q}$, where $p$ and $q$ are positive integers with no common factor. Find the value of $p$.", 2, ans.int(p), work),
        P("Find the value of $q$.", 2, ans.int(q), [`The fraction in its lowest terms is $${frac(p, q)}$, so $q = ${q}$.`])] };
    } });
  reg({ type: "t1-sum-to-infinity", syllabus: ["1.8"], representation: "equation", format: "value", unknown: "x-interval", levels: [3],
    skills: ["SL1.8.convergence", "SL1.8.sum-to-infinity"], title: "Values of x for which a series converges, and its sum",
    build({ rng }) {
      const A = rng.int(2, 6), k = rng.int(1, 4), c = rng.nonzero(-5, 5), r0 = rat.Q(...rng.pick([[1, 2], [-1, 2], [1, 3], [-1, 3], [1, 4], [2, 3], [-2, 3], [3, 4]]));
      const ratio = lin(k, c), lo = rat.Q(-1 - c, k), hi = rat.Q(1 - c, k), x0 = rat.div(rat.sub(r0, c), k), gap = rat.sub(1, r0), S = rat.div(A, gap);
      return { params: { A, k, c, x0: rat.num(x0) }, stem: `An infinite geometric series is given by $${A} + ${A}(${ratio}) + ${A}(${ratio})^{2} + \\ldots$`, parts: [
        P("The series has a finite sum for $p < x < q$. Find the value of $p$.", 2, ans.frac(lo.n, lo.d), [`The common ratio is $r = ${ratio}$, and the sum exists when $-1 < r < 1$.`, `$-1 < ${ratio} < 1$`].concat(k === 1 ? [] : [`$${-1 - c} < ${coef(k, "x")} < ${1 - c}$`], [`$${rat.tex(lo)} < x < ${rat.tex(hi)}$, so $p = ${rat.tex(lo)}$`])),
        P("Write down the value of $q$.", 1, ans.frac(hi.n, hi.d), [`From the inequality, $q = ${rat.tex(hi)}$.`]),
        P(`Find the sum of the series when $x = ${rat.tex(x0)}$.`, 3, ans.frac(S.n, S.d), [`$r = ${k === 1 ? rat.tex(x0) : `${k}${br(x0)}`} ${signed(c)} = ${rat.tex(r0)}$`, `$1 - r = ${rat.tex(gap)}$`, `$S_{\\infty} = \\dfrac{u_{1}}{1 - r} = ${A} \\div ${rat.tex(gap)} = ${rat.tex(S)}$`])] };
    } });

  // ======================= 1.9 binomial theorem: recall, procedure, more exam types =======================
  const BT = { type: "t1-binomial-term", syllabus: ["1.9"], representation: "equation", format: "value" };
  reg({ ...BT, unknown: "ncr-value", levels: [1], skills: ["SL1.9.ncr-pascal"], title: "Evaluate a binomial coefficient",
    build({ rng }) {
      let n, r;
      do { n = rng.int(5, 9); r = rng.int(2, 4); } while (r > n - 2);
      const topList = Array.from({ length: r }, (_, i) => n - i), botList = Array.from({ length: r }, (_, i) => r - i), top = topList.reduce((a, b) => a * b, 1), bot = botList.reduce((a, b) => a * b, 1);
      return { params: { n, r }, stem: `Consider the binomial coefficient $\\dbinom{${n}}{${r}}$.`, parts: [
        P("Find its value.", 2, ans.int(nCr(n, r)), [`$\\dbinom{${n}}{${r}} = \\dfrac{${topList.join(" \\times ")}}{${botList.join(" \\times ")}}$`, `$\\dbinom{${n}}{${r}} = \\dfrac{${top}}{${bot}} = ${nCr(n, r)}$`])] };
    } });
  reg({ ...BT, unknown: "coefficient-plain", levels: [2], skills: ["SL1.9.specific-term", "SL1.9.ncr-pascal"], title: "Number of terms and one coefficient",
    build({ rng }) {
      let n, a, mm, co;
      do { n = rng.int(4, 7); a = rng.int(2, 4); mm = rng.int(2, n - 2); co = nCr(n, n - mm) * Math.pow(a, n - mm); } while (co > 20000);
      const facts = [`$\\dbinom{${n}}{${n - mm}} = ${nCr(n, n - mm)}$`];
      if (n - mm > 1) facts.push(`$${a}^{${n - mm}} = ${Math.pow(a, n - mm)}$`);
      return { params: { n, a, m: mm }, stem: `Consider the expansion of $(x + ${a})^{${n}}$.`, parts: [
        P("Write down the number of terms in the expansion.", 1, ans.int(n + 1, { misconceptions: [{ value: n, text: "The powers of $x$ run from the highest down to zero, which is one more term than the index." }] }), [`The powers of $x$ run from $${n}$ down to $0$, so there are $${n} + 1 = ${n + 1}$ terms.`]),
        P(`Find the coefficient of $x^{${mm}}$.`, 3, ans.int(co, { misconceptions: [{ value: nCr(n, mm), text: "The power of the constant in the bracket is part of the coefficient too." }] }), [
          `The term in $x^{${mm}}$ is $\\dbinom{${n}}{${n - mm}}x^{${mm}} \\times ${pw(a, n - mm)}$.`, facts.join(" and ") + ".", `The coefficient is $${nCr(n, n - mm)} \\times ${Math.pow(a, n - mm)} = ${num(co)}$.`])] };
    } });
  reg({ ...BT, unknown: "first-three-terms", levels: [2], skills: ["SL1.9.full-expansion", "SL1.9.specific-term"], title: "The first three terms in ascending powers",
    build({ rng }) {
      const a = rng.sign() * rng.int(2, 4), n = rng.int(5, 9), p = n * a, q = nCr(n, 2) * a * a, ax = coef(a, "x");
      return { params: { a, n }, stem: `The expansion of $(${expr([[1, ""], [a, "x"]])})^{${n}}$ in ascending powers of $x$ begins $1 + px + qx^{2} + \\ldots$`, parts: [
        P("Find the value of $p$.", 2, ans.int(p), [`The term in $x$ is $${n} \\times (${ax}) = ${coef(p, "x")}$.`, `$p = ${p}$`]),
        P("Find the value of $q$.", 2, ans.int(q, { misconceptions: [{ value: nCr(n, 2) * a, text: "The whole of the second term in the bracket is squared, its number included." }] }), [
          `The term in $x^{2}$ is $\\dbinom{${n}}{2}(${ax})^{2} = ${nCr(n, 2)} \\times ${a * a}x^{2}$.`, `$q = ${q}$`])] };
    } });
  reg({ ...BT, unknown: "coefficient-negative", levels: [3], skills: ["SL1.9.specific-term", "SL1.9.ncr-pascal"], title: "A constant term and a coefficient with a negative term",
    build({ rng }) {
      let a, b, n, mm, co;
      do { a = rng.int(2, 3); b = rng.int(1, 4); n = rng.int(4, 6); mm = rng.int(2, n - 1); co = nCr(n, n - mm) * Math.pow(a, mm) * Math.pow(-b, n - mm); } while (Math.abs(co) > 20000 || gcd2(a, b) !== 1);
      const r = n - mm, cst = Math.pow(-b, n), facts = [`$\\dbinom{${n}}{${r}} = ${nCr(n, r)}$`, `$(${a}x)^{${mm}} = ${Math.pow(a, mm)}x^{${mm}}$`];
      if (r > 1) facts.push(`$(${-b})^{${r}} = ${Math.pow(-b, r)}$`);
      return { params: { a, b, n, m: mm }, stem: `Consider the expansion of $(${a}x - ${b})^{${n}}$.`, parts: [
        P("Find the constant term.", 2, ans.int(cst, { misconceptions: [{ value: -cst, text: n % 2 ? "An odd power of a negative number is negative." : "An even power of a negative number is positive." }] }), [
          `The constant term has no factor of $x$, so it is $(${-b})^{${n}}$.`, `$(${-b})^{${n}} = ${cst}$`]),
        P(`Find the coefficient of $x^{${mm}}$.`, 3, ans.int(co, { misconceptions: [{ value: -co, text: "Check the sign of the power of the negative term." }] }), [
          `The term in $x^{${mm}}$ is $\\dbinom{${n}}{${r}}(${a}x)^{${mm}}${pw(`(${-b})`, r)}$.`, fmt.list(facts) + ".", `The coefficient is $${nCr(n, r)} \\times ${Math.pow(a, mm)} \\times ${paren(Math.pow(-b, r))} = ${num(co)}$.`])] };
    } });
  reg({ type: "t1-ext-binomial-constant-term", syllabus: ["1.9"], representation: "equation", format: "value", unknown: "constant-term", levels: [3],
    skills: ["SL1.9.constant-term", "SL1.9.specific-term"], title: "The term independent of x",
    build({ rng }) {
      let p, s, n, k, r0, cst;
      do { [p, s, n] = rng.pick([[1, 1, 4], [1, 1, 6], [2, 1, 6], [1, 2, 6], [3, 1, 4], [1, 3, 4], [1, 1, 8], [2, 1, 9], [1, 2, 9], [3, 1, 8], [1, 3, 8]]); k = rng.sign() * rng.int(2, 3); r0 = (p * n) / (p + s); cst = nCr(n, r0) * Math.pow(k, r0); }
      while (Math.abs(cst) > 20000);
      const xp = pw("x", p), second = `${k < 0 ? "-" : ""}\\dfrac{${Math.abs(k)}}{${pw("x", s)}}`, first = p === 1 ? `x^{${n} - r}` : `\\left(${xp}\\right)^{${n} - r}`;
      const power = p === 1 ? `${n} - r - ${coef(s, "r")}` : `${p}(${n} - r) - ${coef(s, "r")}`, facts = [`$\\dbinom{${n}}{${r0}} = ${nCr(n, r0)}$`];
      if (r0 > 1) facts.push(`$${negB(k)}^{${r0}} = ${Math.pow(k, r0)}$`);
      return { params: { p, s, n, k }, stem: `Consider the expansion of $\\left(${xp} ${k < 0 ? "-" : "+"} \\dfrac{${Math.abs(k)}}{${pw("x", s)}}\\right)^{${n}}$. The general term of the expansion is $\\dbinom{${n}}{r}${first}\\left(${second}\\right)^{r}$.`, parts: [
        P("Find the value of $r$ for which the term does not depend on $x$.", 2, ans.int(r0), [`The power of $x$ in the general term is $${power}$.`, `$${p * n} - ${p + s}r = 0$, so $r = ${r0}$`]),
        P("Hence find the constant term in the expansion.", 3, ans.int(cst, { misconceptions: [{ value: nCr(n, r0), text: "The number on top of the fraction is raised to a power as well." }] }), [
          `The constant term is $\\dbinom{${n}}{${r0}} \\times ${pw(negB(k), r0)}$.`, fmt.list(facts) + ".", `The constant term is $${nCr(n, r0)} \\times ${paren(Math.pow(k, r0))} = ${num(cst)}$.`])] };
    } });
  reg({ type: "t1-ext-binomial-product", syllabus: ["1.9"], representation: "equation", format: "value", unknown: "product-coefficient", levels: [4], calculator: true,
    skills: ["SL1.9.product-expansion", "SL1.9.specific-term"], title: "A coefficient in a bracket times an expansion",
    build({ rng }) {
      const a = rng.int(2, 3), b = rng.pick(a === 2 ? [-1, 1, -3, 3] : [-2, -1, 1, 2]), n = rng.int(7, 10), mm = rng.int(3, 5);
      let kk;
      do { kk = rng.nonzero(-4, 5); } while (Math.abs(kk) === 1);
      const cf = (j) => nCr(n, j) * Math.pow(a, n - j) * Math.pow(b, j), cm = cf(mm), c1 = cf(mm - 1), total = cm + kk * c1;
      const inner = `(${expr([[a, ""], [b, "x"]])})^{${n}}`, outer = `(${expr([[1, ""], [kk, "x"]])})`, bx = b === 1 ? "x" : `(${coef(b, "x")})`;
      const tm = (cc, j) => (cc < 0 ? `(${num(cc)}x^{${j}})` : `${num(cc)}x^{${j}}`);
      const line = (j) => `The term is $\\dbinom{${n}}{${j}} \\times ${a}^{${n - j}} \\times ${bx}^{${j}}$, so the coefficient is $${nCr(n, j)} \\times ${num(Math.pow(a, n - j))} \\times ${paren(Math.pow(b, j))} = ${num(cf(j))}$.`;
      return { params: { a, b, n, m: mm, kk }, stem: `Consider the expansions of $${inner}$ and $${outer}${inner}$.`, parts: [
        P(`Find the coefficient of $x^{${mm}}$ in the expansion of $${inner}$.`, 2, ans.int(cm), [line(mm)]),
        P(`Find the coefficient of $x^{${mm - 1}}$ in the expansion of $${inner}$.`, 2, ans.int(c1), [line(mm - 1)]),
        P(`Hence find the coefficient of $x^{${mm}}$ in the expansion of $${outer}${inner}$.`, 2, ans.int(total, { misconceptions: [{ value: cm, text: `The $${coef(kk, "x")}$ in the first bracket multiplies the term in $x^{${mm - 1}}$ to give another term in $x^{${mm}}$.` }] }), [
          `Terms in $x^{${mm}}$ come from $1 \\times ${tm(cm, mm)}$ and from $${coef(kk, "x")} \\times ${tm(c1, mm - 1)}$.`, `$${num(cm)} + ${paren(kk)} \\times ${paren(c1)} = ${num(total)}$`])] };
    } });
})(typeof globalThis !== "undefined" ? globalThis : this);
