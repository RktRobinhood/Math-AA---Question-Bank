/* AI SL generators for the statements Applications and Interpretation has and AA does not
   (AI 1.6-1.8, 2.5, 2.6, 3.4-3.6, 4.10, 4.11, 5.6-5.8), and AI-flavoured practice for the shared
   statements AI 2.3 and 2.4. Home course ai-sl: the syllabus codes below are AI codes.
   Each generator's independent verifier is in scripts/engine-checks/ai-sl-own.mjs under the same id. */
(function (root) {
  "use strict";
  const E = root.QBEngine;
  const { ans, fmt } = E;
  const { num, sf, dp, frac, poly, lin, signed, br, paren, expr, m, coef, point, unit, deg, pct, roundSf } = fmt;
  const P = (prompt, marks, answer, working) => ({ prompt, marks, answer, working });
  const reg = (def) => E.registerAll({ home: "ai-sl", calculator: true }, [def])[0];
  const r2 = (x) => Math.round(x * 100) / 100;
  const eur = (x) => `$${dp(x, 2)}$ euros`;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const notHalfCent = (x) => Math.abs(x * 100 - Math.floor(x * 100) - 0.5) > 0.02;
  const sum = (a) => a.reduce((s, x) => s + x, 0);
  const NAMES = ["Amara", "Bao", "Chidi", "Daniela", "Emil", "Farah", "Goran", "Hana", "Ines", "Jonas", "Keiko", "Luca", "Mira", "Nadia", "Omar", "Priya"];

  // =====================================================================================
  // 1.6 approximation, bounds, percentage error
  // =====================================================================================
  reg({ type: "t1-ai-approx-bounds", unknown: "bounds-of-measurement", representation: "words", format: "value", levels: [1], calculator: false,
    syllabus: ["1.6"], skills: ["AI-SL1.6.write-bounds"], title: "Lower and upper bounds of a rounded measurement",
    build({ rng }) {
      const c = rng.pick([
        { what: "The length of a bridge", u: "m", acc: 10, how: "correct to the nearest $10\\text{ m}$", lo: 12, hi: 95 },
        { what: "The mass of a parcel", u: "kg", acc: 1, how: "correct to the nearest kilogram", lo: 3, hi: 48 },
        { what: "The height of a door", u: "m", acc: 0.1, how: "correct to one decimal place", lo: 18, hi: 29 },
        { what: "The time for a sprint", u: "s", acc: 0.01, how: "correct to two decimal places", lo: 1012, hi: 1395 },
        { what: "The attendance at a match", u: "people", acc: 100, how: "correct to the nearest hundred", lo: 23, hi: 96 },
        { what: "The width of a phone", u: "cm", acc: 0.1, how: "correct to the nearest millimetre", lo: 62, hi: 84 }]);
      const n = rng.int(c.lo, c.hi), v = Number((n * c.acc).toPrecision(10)), lo = Number(((2 * n - 1) * c.acc / 2).toPrecision(10)), hi = Number(((2 * n + 1) * c.acc / 2).toPrecision(10));
      const half = num(c.acc / 2), shown = c.acc === 0.01 ? dp(v, 2) : c.acc === 0.1 ? dp(v, 1) : num(v);
      return { params: { v, acc: c.acc }, stem: `${c.what} is given as $${shown}\\text{ ${c.u}}$, ${c.how}.`, parts: [
        P("Write down the lower bound of this measurement.", 1, ans.dec(lo), [`The value is rounded to the nearest $${num(c.acc)}$, so the true value can be up to $${half}$ below it.`, `Lower bound: $${shown} - ${half} = ${num(lo)}$`]),
        P("Write down the upper bound of this measurement.", 1, ans.dec(hi), [`Upper bound: $${shown} + ${half} = ${num(hi)}$`])] };
    } });

  reg({ type: "t1-ai-percentage-error", unknown: "error-of-estimate", representation: "words", format: "value", levels: [2],
    syllabus: ["1.6"], skills: ["AI-SL1.6.percentage-error", "AI-SL1.6.round-to-accuracy"], title: "Percentage error of an estimated area",
    build({ rng }) {
      let a, b, ea, eb, exact, est;
      do { a = rng.int(52, 189) / 10; b = rng.int(31, 99) / 10; ea = Math.round(a); eb = Math.round(b); exact = Number((a * b).toPrecision(10)); est = ea * eb; }
      while (a <= b || Math.abs(a * 10 % 10 - 5) < 0.01 || Math.abs(b * 10 % 10 - 5) < 0.01 || a === ea || b === eb || Math.abs(est - exact) / exact < 0.004);
      const who = rng.pick(NAMES), place = rng.pick(["garden", "car park", "classroom floor", "vegetable plot"]);
      const pe = Math.abs(est - exact) / exact * 100;
      return { params: { a, b }, stem: `A rectangular ${place} is $${dp(a, 1)}\\text{ m}$ long and $${dp(b, 1)}\\text{ m}$ wide. ${who} estimates its area by first rounding each length to the nearest metre.`, parts: [
        P(`Calculate the exact area of the ${place}, in $\\text{m}^{2}$.`, 1, ans.dec(exact), [`$${dp(a, 1)} \\times ${dp(b, 1)} = ${num(exact)}$`]),
        P(`Find ${who}'s estimate of the area, in $\\text{m}^{2}$.`, 1, ans.int(est), [`$${ea} \\times ${eb} = ${est}$`]),
        P(`Find the percentage error in ${who}'s estimate.`, 2, ans.sf(pe), [
          `Percentage error $= \\left|\\dfrac{v_{A} - v_{E}}{v_{E}}\\right| \\times 100\\%$, where $v_{E}$ is the exact value and $v_{A}$ the approximate value.`,
          `$\\left|\\dfrac{${est} - ${num(exact)}}{${num(exact)}}\\right| \\times 100\\% = ${sf(pe)}\\%$`])] };
    } });

  reg({ type: "t1-ai-approx-bounds", unknown: "bounds-of-volume", representation: "words", format: "value", levels: [4],
    syllabus: ["1.6"], skills: ["AI-SL1.6.bounds-of-calculation", "AI-SL1.6.write-bounds", "AI-SL1.6.max-percentage-error"], title: "Bounds of a calculated volume and the percentage error",
    build({ rng }) {
      const r = rng.int(12, 48) / 10, h = rng.int(25, 96) / 10;
      const thing = rng.pick(["water tank", "grain silo", "storage drum", "fuel tank"]);
      const rl = Number((r - 0.05).toFixed(2)), ru = Number((r + 0.05).toFixed(2)), hl = Number((h - 0.05).toFixed(2)), hu = Number((h + 0.05).toFixed(2));
      const V = (a, b) => Math.PI * a * a * b, vmin = V(rl, hl), vmax = V(ru, hu), vnom = V(r, h), pe = (vnom - vmin) / vmin * 100;
      return { params: { r, h }, stem: `A cylindrical ${thing} has radius $${dp(r, 1)}\\text{ m}$ and height $${dp(h, 1)}\\text{ m}$, each measured correct to one decimal place.`, parts: [
        P("Write down the upper bound of the radius, in metres.", 1, ans.dec(ru), [`The measurements are correct to the nearest $0.1\\text{ m}$, so each bound is $0.05\\text{ m}$ from the given value.`, `$${dp(r, 1)} + 0.05 = ${num(ru)}$`]),
        P(`Find the least possible volume of the ${thing}, in $\\text{m}^{3}$.`, 2, ans.sf(vmin), [`Use the lower bounds of both measurements: $r = ${num(rl)}$ and $h = ${num(hl)}$.`, `$V = \\pi ${br(rl)}^{2}${br(hl)} = ${sf(vmin)}$`]),
        P(`Find the greatest possible volume of the ${thing}, in $\\text{m}^{3}$.`, 2, ans.sf(vmax), [`Use the upper bounds of both measurements: $r = ${num(ru)}$ and $h = ${num(hu)}$.`, `$V = \\pi ${br(ru)}^{2}${br(hu)} = ${sf(vmax)}$`]),
        P(`The volume is calculated from the given measurements, but the true volume is in fact the least possible volume. Find the percentage error in the calculated volume.`, 2, ans.sf(pe), [
          `Calculated volume: $\\pi ${br(r)}^{2}${br(h)} = ${sf(vnom, 4)}$`,
          `Percentage error $= \\left|\\dfrac{${sf(vnom, 4)} - ${sf(vmin, 4)}}{${sf(vmin, 4)}}\\right| \\times 100\\% = ${sf(pe)}\\%$ (using unrounded values)`])] };
    } });

  reg({ type: "t1-ai-percentage-error", unknown: "whole-items", representation: "words", format: "value", levels: [2], niceOk: true,
    syllabus: ["1.6"], skills: ["AI-SL1.6.whole-items-in-context", "AI-SL1.6.round-to-accuracy"], title: "Round up to a whole number of items and cost them",
    build({ rng }) {
      let a, b, cover, extra, price, need, n;
      const c = rng.pick([
        { job: "paint a wall", item: "tin", items: "tins", per: "One tin of paint covers", why: "for a second coat on the edges" },
        { job: "tile a floor", item: "box", items: "boxes", per: "One box of tiles covers", why: "for breakages" },
        { job: "turf a lawn", item: "roll", items: "rolls", per: "One roll of turf covers", why: "for cutting to shape" }]);
      do { a = rng.int(42, 125) / 10; b = rng.int(24, 68) / 10; cover = rng.pick([1.5, 2.4, 3.5, 4.2, 5.5, 6.5]); extra = rng.pick([5, 8, 10, 12, 15]); price = rng.int(1250, 4999) / 100;
        need = a * b * (1 + extra / 100) / cover; n = Math.ceil(need); } while (need - Math.floor(need) < 0.06 || n - need < 0.06 || n < 4 || n > 40);
      const who = rng.pick(NAMES), area = Number((a * b).toPrecision(10)), tot = Number((area * (1 + extra / 100)).toPrecision(10)), cost = r2(n * price);
      return { params: { a, b, cover, extra, price }, stem: `${who} wants to ${c.job} that is a rectangle $${dp(a, 1)}\\text{ m}$ by $${dp(b, 1)}\\text{ m}$. ${c.per} $${num(cover)}\\text{ m}^{2}$ and costs ${eur(price)}. ${who} allows an extra $${pct(extra)}$ of the area ${c.why}.`, parts: [
        P(`Find the number of ${c.items} ${who} must buy.`, 3, ans.int(n), [
          `Area: $${dp(a, 1)} \\times ${dp(b, 1)} = ${num(area)}\\text{ m}^{2}$`, `With the extra $${pct(extra)}$: $${num(area)} \\times ${num(1 + extra / 100)} = ${sf(tot, 4)}\\text{ m}^{2}$`,
          `$${sf(tot, 4)} \\div ${num(cover)} = ${sf(need, 4)}$, and only whole ${c.items} can be bought, so round up: $${n}$ ${c.items}.`]),
        P(`Find the total cost, in euros, giving the answer correct to two decimal places.`, 1, ans.dp(cost, 2), [`$${n} \\times ${dp(price, 2)} = ${dp(cost, 2)}$`])] };
    } });

  // =====================================================================================
  // 1.7 amortization and annuities
  // =====================================================================================
  const tvm = {
    pmt: (pv, i, n) => pv * i / (1 - Math.pow(1 + i, -n)),
    bal: (pv, i, pay, k) => pv * Math.pow(1 + i, k) - pay * (Math.pow(1 + i, k) - 1) / i,
    fv: (dep, i, n) => dep * (Math.pow(1 + i, n) - 1) / i,
    nper: (pv, i, pay) => -Math.log(1 - pv * i / pay) / Math.log(1 + i),
  };
  const LOANS = [{ what: "a car", lo: 8, hi: 30, k: 1000, yrs: [3, 4, 5, 6] }, { what: "a boat", lo: 15, hi: 60, k: 1000, yrs: [5, 6, 8, 10] }, { what: "a flat", lo: 90, hi: 320, k: 1000, yrs: [15, 20, 25, 30] },
    { what: "new machinery for a workshop", lo: 20, hi: 80, k: 1000, yrs: [4, 5, 7, 8] }, { what: "a solar panel system", lo: 6, hi: 18, k: 1000, yrs: [3, 5, 6, 8] }];
  // the finance solver's variable names are set upright
  const tv = (s) => s.replace(/\b(PMT|PV|FV|P\/Y|C\/Y|N)\b/g, "\\text{$1}").replace(/I\\%/g, "\\text{I\\%}");
  const solver = (rows) => tv(`Finance solver: ${rows}.`);
  function loanSit(rng) {
    let c, pv, rate, y, y2, n, i;
    do { c = rng.pick(LOANS); pv = rng.int(c.lo, c.hi) * c.k; rate = rng.int(19, 79) / 10; y = rng.pick(c.yrs); n = 12 * y; i = rate / 1200; y2 = y > 10 ? y - 5 : y - (y > 4 ? 2 : 1); }
    while (!notHalfCent(tvm.pmt(pv, i, n)) || !notHalfCent(tvm.pmt(pv, i, 12 * y2)));
    return { what: c.what, pv, rate, y, y2, n, who: rng.pick(NAMES) };
  }
  const loanStem = (s) => `${s.who} borrows $${num(s.pv)}$ euros to buy ${s.what}. The loan has a nominal annual interest rate of $${pct(s.rate)}$, compounded monthly, and is repaid in equal payments at the end of each month for $${s.y}$ years.`;
  reg({ type: "t1-ai-amortization", unknown: "payment-and-interest", representation: "words", format: "value", levels: [2], situationKey: "ai-loan", situation: loanSit,
    syllabus: ["1.7"], skills: ["AI-SL1.7.find-payment", "AI-SL1.7.total-interest"], title: "Monthly repayment of a loan and the total interest",
    build({ sit: s }) {
      const i = s.rate / 1200, pay = r2(tvm.pmt(s.pv, i, s.n)), total = r2(pay * s.n), interest = r2(total - s.pv);
      return { params: { pv: s.pv, rate: s.rate, n: s.n }, stem: loanStem(s), parts: [
        P("Find the monthly payment, in euros, correct to two decimal places.", 2, ans.dp(pay, 2), [
          solver(`$N = ${s.n}$, $I\\% = ${num(s.rate)}$, $PV = ${num(s.pv)}$, $FV = 0$, $P/Y = 12$, $C/Y = 12$`), `Solving for the payment gives $${dp(pay, 2)}$ euros.`]),
        P("Using this payment, find the total amount repaid, in euros.", 1, ans.dp(total, 2), [`$${s.n} \\times ${dp(pay, 2)} = ${dp(total, 2)}$`]),
        P("Find the total interest paid, in euros.", 1, ans.dp(interest, 2), [`Interest is the amount repaid less the amount borrowed: $${dp(total, 2)} - ${num(s.pv)} = ${dp(interest, 2)}$`])] };
    } });

  reg({ type: "t1-ai-amortization", unknown: "compare-two-terms", representation: "words", format: "value", levels: [4], situationKey: "ai-loan", situation: loanSit,
    syllabus: ["1.7"], skills: ["AI-SL1.7.find-payment", "AI-SL1.7.total-interest", "AI-SL1.7.compare-interpret"], title: "Compare two repayment periods for a loan",
    build({ sit: s }) {
      const i = s.rate / 1200, y2 = s.y2, n2 = 12 * y2;
      const pay = r2(tvm.pmt(s.pv, i, s.n)), total = r2(pay * s.n), pay2 = r2(tvm.pmt(s.pv, i, n2)), total2 = r2(pay2 * n2), save = r2(total - total2);
      return { params: { pv: s.pv, rate: s.rate, n: s.n, n2 }, stem: `${loanStem(s)} The bank also offers the same loan, at the same rate, repaid over $${y2}$ years instead.`, parts: [
        P(`Find the monthly payment, in euros, for the $${s.y}$-year loan.`, 2, ans.dp(pay, 2), [
          solver(`$N = ${s.n}$, $I\\% = ${num(s.rate)}$, $PV = ${num(s.pv)}$, $FV = 0$, $P/Y = 12$, $C/Y = 12$`), `The payment is $${dp(pay, 2)}$ euros.`]),
        P(`Find the monthly payment, in euros, for the $${y2}$-year loan.`, 2, ans.dp(pay2, 2), [tv(`Change only the number of payments: $N = ${n2}$.`), `The payment is $${dp(pay2, 2)}$ euros.`]),
        P(`Using these payments, find how much less ${s.who} repays in total by choosing the $${y2}$-year loan, in euros.`, 3, ans.dp(save, 2), [
          `Total over $${s.y}$ years: $${s.n} \\times ${dp(pay, 2)} = ${dp(total, 2)}$`, `Total over $${y2}$ years: $${n2} \\times ${dp(pay2, 2)} = ${dp(total2, 2)}$`,
          `Saving: $${dp(total, 2)} - ${dp(total2, 2)} = ${dp(save, 2)}$ euros, all of it interest.`])] };
    } });

  reg({ type: "t1-ai-amortization", unknown: "balance-and-payments-left", representation: "words", format: "value", levels: [4],
    syllabus: ["1.7"], skills: ["AI-SL1.7.outstanding-balance", "AI-SL1.7.total-interest", "AI-SL1.7.number-of-payments"], title: "Outstanding balance, interest so far and the number of payments",
    build({ rng }) {
      let c, pv, rate, i, pay, k, nn, b;
      do { c = rng.pick(LOANS); pv = rng.int(c.lo, c.hi) * c.k; rate = rng.int(24, 84) / 10; i = rate / 1200;
        pay = Math.ceil(tvm.pmt(pv, i, 12 * rng.pick(c.yrs)) / 50) * 50 + rng.pick([0, 25, 50]); nn = tvm.nper(pv, i, pay); k = 12 * rng.int(1, Math.max(1, Math.floor(nn / 12) - 1)); b = tvm.bal(pv, i, pay, k); }
      while (!(nn > 30) || nn - Math.floor(nn) < 0.03 || Math.ceil(nn) - nn < 0.03 || k >= nn - 6 || !notHalfCent(b));
      const who = rng.pick(NAMES), bal = r2(b), paid = pay * k, interest = r2(paid - (pv - bal)), N = Math.ceil(nn);
      return { params: { pv, rate, pay, k }, stem: `${who} takes out a loan of $${num(pv)}$ euros for ${c.what}. The nominal annual interest rate is $${pct(rate)}$, compounded monthly. ${who} repays $${num(pay)}$ euros at the end of every month.`, parts: [
        P(`Find the amount ${who} still owes immediately after the $${k}$th payment, in euros, correct to two decimal places.`, 3, ans.dp(bal, 2), [
          solver(`$N = ${k}$, $I\\% = ${num(rate)}$, $PV = ${num(pv)}$, $PMT = -${num(pay)}$, $P/Y = 12$, $C/Y = 12$`), tv(`Solving for $FV$ gives $${dp(bal, 2)}$ euros still owed.`)]),
        P(`Find the total interest ${who} has paid in these $${k}$ payments, in euros.`, 2, ans.dp(interest, 2), [
          `Paid so far: $${k} \\times ${num(pay)} = ${num(paid)}$`, `The debt has gone down by $${num(pv)} - ${dp(bal, 2)} = ${dp(pv - bal, 2)}$.`, `The rest was interest: $${num(paid)} - ${dp(pv - bal, 2)} = ${dp(interest, 2)}$`]),
        P(`Find the total number of monthly payments needed to repay the loan completely, counting a smaller final payment as one payment.`, 2, ans.int(N), [
          tv(`Set $FV = 0$ and solve for $N$: $N = ${sf(nn, 4)}$`), `So $${N - 1}$ full payments are not enough: $${N}$ payments are needed.`])] };
    } });

  reg({ type: "t1-ai-amortization", unknown: "total-repaid", representation: "words", format: "value", levels: [1], calculator: false,
    syllabus: ["1.7"], skills: ["AI-SL1.7.total-interest"], title: "Total repaid and interest from the payments",
    build({ rng }) {
      const pv = rng.int(20, 90) * 100, y = rng.pick([2, 3, 4]), n = 12 * y, pay = Math.round(pv * (1 + rng.int(4, 9) / 100 * y / 2) / n) + rng.pick([0.5, 0.25, 0, 0.75]), total = pay * n;
      const who = rng.pick(NAMES);
      return { params: { pv, n, pay }, stem: `${who} borrows $${num(pv)}$ euros and repays the loan with $${n}$ monthly payments of ${eur(pay)}.`, parts: [
        P("Find the total amount repaid, in euros.", 1, ans.dec(total), [`$${n} \\times ${dp(pay, 2)} = ${num(total)}$`]),
        P("Find the total interest paid, in euros.", 1, ans.dec(total - pv), [`$${num(total)} - ${num(pv)} = ${num(total - pv)}$`])] };
    } });

  reg({ type: "t1-ai-annuity", unknown: "savings-future-value", representation: "words", format: "value", levels: [2],
    syllabus: ["1.7"], skills: ["AI-SL1.7.future-value-deposits", "AI-SL1.7.total-interest"], title: "Value of regular savings and the interest earned",
    build({ rng }) {
      let dep, rate, y, n, fv;
      do { dep = rng.int(4, 40) * 25; rate = rng.int(15, 62) / 10; y = rng.int(3, 15); n = 12 * y; fv = tvm.fv(dep, rate / 1200, n); } while (!notHalfCent(fv));
      const who = rng.pick(NAMES), goal = rng.pick(["a deposit on a house", "university fees", "a round-the-world trip", "a new kitchen"]), v = r2(fv), earned = r2(v - dep * n);
      return { params: { dep, rate, n }, stem: `${who} is saving for ${goal}. At the end of every month ${who} pays $${num(dep)}$ euros into an account that pays a nominal annual interest rate of $${pct(rate)}$, compounded monthly. The account is empty at the start.`, parts: [
        P(`Write down the number of payments ${who} makes in $${y}$ years.`, 1, ans.int(n), [`$12 \\times ${y} = ${n}$`]),
        P(`Find the amount in the account at the end of $${y}$ years, in euros, correct to two decimal places.`, 2, ans.dp(v, 2), [
          solver(`$N = ${n}$, $I\\% = ${num(rate)}$, $PV = 0$, $PMT = -${num(dep)}$, $P/Y = 12$, $C/Y = 12$`), tv(`Solving for $FV$ gives $${dp(v, 2)}$ euros.`)]),
        P("Find the total interest earned, in euros.", 1, ans.dp(earned, 2), [`Total paid in: $${n} \\times ${num(dep)} = ${num(dep * n)}$`, `Interest: $${dp(v, 2)} - ${num(dep * n)} = ${dp(earned, 2)}$`])] };
    } });

  reg({ type: "t1-ai-annuity", unknown: "withdrawals", representation: "words", format: "value", levels: [4],
    syllabus: ["1.7"], skills: ["AI-SL1.7.outstanding-balance", "AI-SL1.7.number-of-payments", "AI-SL1.7.find-payment"], title: "An annuity that pays a monthly income",
    build({ rng }) {
      let pv, rate, i, w, nn, k, b, y2, w2;
      do { pv = rng.int(8, 60) * 10000; rate = rng.int(21, 58) / 10; i = rate / 1200; w = Math.round(tvm.pmt(pv, i, 12 * rng.int(12, 24)) / 50) * 50; nn = tvm.nper(pv, i, w);
        k = rng.int(3, 8); b = tvm.bal(pv, i, w, 12 * k); y2 = Math.floor(nn / 12) + rng.int(3, 6); w2 = tvm.pmt(pv, i, 12 * y2); }
      while (!(nn > 120) || nn - Math.floor(nn) < 0.03 || Math.ceil(nn) - nn < 0.03 || !notHalfCent(b) || !notHalfCent(w2));
      const who = rng.pick(NAMES), full = Math.floor(nn);
      return { params: { pv, rate, w, k, y2 }, stem: `${who} retires and invests $${num(pv)}$ euros in an annuity that pays a nominal annual interest rate of $${pct(rate)}$, compounded monthly. At the end of every month ${who} withdraws $${num(w)}$ euros.`, parts: [
        P(`Find the amount left in the annuity after $${k}$ years, in euros, correct to two decimal places.`, 2, ans.dp(r2(b), 2), [
          solver(`$N = ${12 * k}$, $I\\% = ${num(rate)}$, $PV = -${num(pv)}$, $PMT = ${num(w)}$, $P/Y = 12$, $C/Y = 12$`), tv(`Solving for $FV$ gives $${dp(r2(b), 2)}$ euros.`)]),
        P(`Find the number of full withdrawals of $${num(w)}$ euros that ${who} can make.`, 2, ans.int(full), [tv(`Set $FV = 0$ and solve for $N$: $N = ${sf(nn, 4)}$`), `After $${full}$ withdrawals there is not enough left for another full one, so the answer is $${full}$.`]),
        P(`${who} would like the money to last exactly $${y2}$ years instead. Find the monthly withdrawal that achieves this, in euros, correct to two decimal places.`, 2, ans.dp(r2(w2), 2), [
          solver(`$N = ${12 * y2}$, $I\\% = ${num(rate)}$, $PV = -${num(pv)}$, $FV = 0$`), `Solving for the payment gives $${dp(r2(w2), 2)}$ euros.`])] };
    } });

  // =====================================================================================
  // 1.8 linear systems and polynomial equations with technology
  // =====================================================================================
  const det3 = (a) => a[0][0] * (a[1][1] * a[2][2] - a[1][2] * a[2][1]) - a[0][1] * (a[1][0] * a[2][2] - a[1][2] * a[2][0]) + a[0][2] * (a[1][0] * a[2][1] - a[1][1] * a[2][0]);
  reg({ type: "t1-ai-linear-systems", unknown: "solve-two-by-two", representation: "equation", format: "value", levels: [1],
    syllabus: ["1.8"], skills: ["AI-SL1.8.solve-system"], title: "Solve a pair of simultaneous equations with technology",
    build({ rng }) {
      let a, b, c, d2, x, y;
      do { a = rng.int(2, 9); b = rng.nonzero(-9, 9); c = rng.int(2, 9); d2 = rng.nonzero(-9, 9); x = rng.int(-24, 24) / 4; y = rng.int(-24, 24) / 4; }
      while (Math.abs(a * d2 - b * c) < 2 || Number.isInteger(x) || Number.isInteger(y) || Math.abs(b) === 1 || Math.abs(d2) === 1);
      const e = a * x + b * y, f = c * x + d2 * y;
      return { params: { A: [[a, b], [c, d2]], rhs: [e, f] }, stem: `Consider the simultaneous equations $${expr([[a, "x"], [b, "y"]])} = ${num(e)}$ and $${expr([[c, "x"], [d2, "y"]])} = ${num(f)}$.`, parts: [
        P("Use technology to find the value of $x$.", 1, ans.dec(x), [`Enter both equations in the simultaneous equation solver of the GDC.`, `$x = ${num(x)}$`]),
        P("Find the value of $y$.", 1, ans.dec(y), [`The solver gives $y = ${num(y)}$.`])] };
    } });

  const SHOPS = [{ place: "A bakery", items: ["loaf", "croissant", "muffin"], pl: ["loaves", "croissants", "muffins"], lo: 12, hi: 45, step: 0.1 },
    { place: "A stationery shop", items: ["notebook", "pen", "folder"], pl: ["notebooks", "pens", "folders"], lo: 8, hi: 60, step: 0.1 },
    { place: "A garden centre", items: ["rose bush", "bag of compost", "plant pot"], pl: ["rose bushes", "bags of compost", "plant pots"], lo: 25, hi: 160, step: 0.1 },
    { place: "A café", items: ["coffee", "sandwich", "juice"], pl: ["coffees", "sandwiches", "juices"], lo: 15, hi: 70, step: 0.1 }];
  reg({ type: "t1-ai-linear-systems", unknown: "three-prices", representation: "table", format: "value", levels: [2],
    syllabus: ["1.8"], skills: ["AI-SL1.8.set-up-system", "AI-SL1.8.solve-system"], title: "Three prices from three orders",
    build({ rng }) {
      const c = rng.pick(SHOPS);
      let A, pr, order;
      do { A = [0, 1, 2].map(() => [rng.int(1, 6), rng.int(1, 6), rng.int(0, 5)]); pr = [0, 1, 2].map(() => rng.int(c.lo, c.hi) / 10); order = [rng.int(2, 8), rng.int(2, 8), rng.int(2, 8)]; }
      while (Math.abs(det3(A)) < 4 || new Set(pr).size < 3 || A.some((r, i2) => A.some((s, j) => j > i2 && r.join() === s.join())));
      const tot = A.map((r) => r2(r[0] * pr[0] + r[1] * pr[1] + r[2] * pr[2])), cost = r2(order[0] * pr[0] + order[1] * pr[1] + order[2] * pr[2]);
      const v = ["x", "y", "z"], eqs = A.map((r, i2) => `$${expr(r.map((q, j) => [q, v[j]]))} = ${dp(tot[i2], 2)}$`);
      return { params: { A, tot, order }, stem: `${c.place} sells three products. The table shows three orders and the total cost of each, in euros. One ${c.items[0]} costs $x$ euros, one ${c.items[1]} costs $y$ euros and one ${c.items[2]} costs $z$ euros.`,
        table: { head: ["Order"].concat(c.pl.map(cap)).concat(["Total cost (euros)"]), rows: A.map((r, i2) => [["First", "Second", "Third"][i2]].concat(r.map((q) => m(q))).concat([m(dp(tot[i2], 2))])) },
        parts: [
          P("Find the value of $x$.", 2, ans.dp(pr[0], 2), [`Each order gives one equation: ${eqs.join(", ")}.`, `Solving the three equations with technology gives $x = ${dp(pr[0], 2)}$.`]),
          P("Find the value of $y$.", 1, ans.dp(pr[1], 2), [`$y = ${dp(pr[1], 2)}$`]),
          P(`Find the total cost, in euros, of an order of $${order[0]}$ ${c.pl[0]}, $${order[1]}$ ${c.pl[1]} and $${order[2]}$ ${c.pl[2]}.`, 1, ans.dp(cost, 2), [
            `The solver also gives $z = ${dp(pr[2], 2)}$.`, `$${order[0]}${br(pr[0])} + ${order[1]}${br(pr[1])} + ${order[2]}${br(pr[2])} = ${dp(cost, 2)}$`])] };
    } });

  reg({ type: "t1-ai-linear-systems", unknown: "tickets-three-unknowns", representation: "words", format: "value", levels: [4], niceOk: true,
    syllabus: ["1.8"], skills: ["AI-SL1.8.set-up-system", "AI-SL1.8.solve-system"], title: "Set up and solve three equations from a context",
    build({ rng }) {
      const c = rng.pick([{ place: "A theatre", ev: "one evening" }, { place: "A football club", ev: "for one match" }, { place: "A science museum", ev: "one Saturday" }, { place: "A music festival", ev: "on its opening day" }]);
      let a, ch, s, k, pa, pc, ps;
      do { s = rng.int(15, 90); k = rng.int(2, 4); ch = k * s; a = rng.int(80, 400); pa = rng.int(12, 40); pc = Math.round(pa * rng.pick([0.4, 0.5, 0.6])); ps = pc + rng.int(2, 6); } while (ps >= pa || pc === ps);
      const T = a + ch + s, R = a * pa + ch * pc + s * ps, share = a * pa / R * 100;
      const eq = (l, r) => `$${l} = ${r}$`;
      return { params: { T, R, k, pa, pc, ps }, stem: `${c.place} sells adult tickets at $${pa}$ euros, child tickets at $${pc}$ euros and senior tickets at $${ps}$ euros. ${cap(c.ev)} it sells $${num(T)}$ tickets for a total of $${num(R)}$ euros, and it sells ${k === 2 ? "twice" : `$${k}$ times`} as many child tickets as senior tickets. Let $a$, $c$ and $s$ be the numbers of adult, child and senior tickets sold.`, parts: [
        P("Which equation represents the information about child and senior tickets?", 1, ans.choice(rng, { text: eq("c", `${k}s`), value: [0, 1, -k] }, [
          { text: eq("s", `${k}c`), value: [0, -k, 1], why: "There are more child tickets, so the number of senior tickets is multiplied." },
          { text: eq("c + s", String(k)), value: [0, 1, 1, k], why: "This says that the two numbers add up to the multiplier." },
          { text: eq(`${pc}c`, `${k} \\times ${ps}s`), value: [0, pc, -k * ps], why: "The statement compares numbers of tickets, not money." }]), [
          `There are ${k === 2 ? "twice" : `$${k}$ times`} as many child tickets as senior tickets, so $c = ${k}s$.`]),
        P("Find the number of adult tickets sold.", 3, ans.int(a), [
          `Number of tickets: $a + c + s = ${num(T)}$`, `Money taken: $${expr([[pa, "a"], [pc, "c"], [ps, "s"]])} = ${num(R)}$`, `Third equation: $c - ${k}s = 0$`,
          `Solving the three equations with technology: $a = ${a}$, $c = ${ch}$, $s = ${s}$.`]),
        P("Find the number of child tickets sold.", 1, ans.int(ch), [`From the solver, $c = ${ch}$.`]),
        P("Find the percentage of the money taken that came from adult tickets.", 2, ans.sf(share), [`Adult tickets brought in $${a} \\times ${pa} = ${num(a * pa)}$ euros.`, `$\\dfrac{${num(a * pa)}}{${num(R)}} \\times 100\\% = ${sf(share)}\\%$`])] };
    } });

  const cubicRoots = (cs) => {   // real roots of a cubic (highest power first) by Newton from a scan of starting points
    const f = (x) => ((cs[0] * x + cs[1]) * x + cs[2]) * x + cs[3], fd = (x) => (3 * cs[0] * x + 2 * cs[1]) * x + cs[2], out = [];
    for (let s = -40; s <= 40; s += 0.25) { let x = s; for (let i = 0; i < 60; i++) { const d2 = fd(x); if (Math.abs(d2) < 1e-12) break; x -= f(x) / d2; }
      if (Math.abs(f(x)) < 1e-9 && Math.abs(x) < 60 && !out.some((r) => Math.abs(r - x) < 1e-6)) out.push(x); }
    return out.sort((p, q) => p - q);
  };
  // no turning point of the cubic sits close to the x-axis, so the number of real roots is clear on a GDC
  const cubicClear = (cs) => { const f = (x) => ((cs[0] * x + cs[1]) * x + cs[2]) * x + cs[3], d = cs[1] * cs[1] - 3 * cs[0] * cs[2]; if (d <= 0) return true;
    return [-1, 1].every((s) => Math.abs(f((-cs[1] + s * Math.sqrt(d)) / (3 * cs[0]))) > 0.8); };
  reg({ type: "t1-ai-polynomial-equations", unknown: "real-roots", representation: "equation", format: "value", levels: [2],
    syllabus: ["1.8"], skills: ["AI-SL1.8.polynomial-equation"], title: "Solve a cubic equation with technology",
    build({ rng }) {
      let cs, rs;
      const want = rng.bool(0.3) ? 1 : 3;
      do { cs = [rng.pick([1, 2, 3]), rng.int(-9, 9), rng.int(-14, 6), rng.nonzero(-12, 12)]; rs = cubicRoots(cs); }
      while (rs.length !== want || (want === 3 && (rs[1] - rs[0] < 0.4 || rs[2] - rs[1] < 0.4)) || rs.some((r) => Math.abs(r - Math.round(r * 10) / 10) < 1e-3) || rs[want - 1] > 15 || rs[0] < -15 || !cubicClear(cs));
      const count = P("Use technology to find the number of real solutions of the equation.", 1, ans.int(want), [`The graph of $y = ${poly(cs)}$ crosses the $x$-axis ${want === 1 ? "only once, so there is $1$ real solution" : "$3$ times, so there are $3$ real solutions"}.`]);
      return { params: { cs }, stem: `Consider the equation $${poly(cs)} = 0$.`, parts: want === 1 ? [count,
        P("Find the solution.", 2, ans.sf(rs[0]), [`Use the polynomial solver, or find the zero of the graph: $x = ${sf(rs[0])}$.`, `The solver's other two solutions are not real numbers.`])] : [count,
        P("Find the smallest solution.", 1, ans.sf(rs[0]), [`The polynomial solver gives $x = ${sf(rs[0])}$, $x = ${sf(rs[1])}$ and $x = ${sf(rs[2])}$.`, `The smallest is $x = ${sf(rs[0])}$.`]),
        P("Find the largest solution.", 1, ans.sf(rs[2]), [`The largest is $x = ${sf(rs[2])}$.`])] };
    } });

  reg({ type: "t1-ai-polynomial-equations", unknown: "box-volume-roots", representation: "words", format: "value", levels: [4],
    syllabus: ["1.8"], skills: ["AI-SL1.8.polynomial-equation", "AI-SL1.8.select-roots"], title: "A cubic equation in context: keep the roots that make sense",
    build({ rng }) {
      let a, b, K, rs, vmax;
      do { a = rng.int(10, 30); b = a + rng.int(2, 14); const xs = (a + b - Math.sqrt(a * a - a * b + b * b)) / 6; vmax = xs * (a - 2 * xs) * (b - 2 * xs);
        K = Math.round(vmax * rng.int(45, 85) / 100 / 10) * 10; rs = cubicRoots([4, -2 * (a + b), a * b, -K]); }
      while (rs.length !== 3 || rs[1] - rs[0] < 0.5 || rs.some((r) => Math.abs(r - Math.round(r * 10) / 10) < 2e-3) || K < 50);
      const x0 = rng.int(1, Math.floor(a / 2) - 1), v0 = x0 * (a - 2 * x0) * (b - 2 * x0), cs = [4, -2 * (a + b), a * b, 0];
      return { params: { a, b, K, x0 }, stem: `An open box is made from a rectangular sheet of card $${b}\\text{ cm}$ long and $${a}\\text{ cm}$ wide. A square of side $x\\text{ cm}$ is cut from each corner and the sides are folded up, so the volume of the box, in $\\text{cm}^{3}$, is $V = x(${b} - 2x)(${a} - 2x)$.`, parts: [
        P(`Find the volume of the box when $x = ${x0}$.`, 1, ans.int(v0), [`$V = ${x0}${br(b - 2 * x0)}${br(a - 2 * x0)} = ${num(v0)}$`]),
        P(`The box must have a volume of $${num(K)}\\text{ cm}^{3}$. The equation $x(${b} - 2x)(${a} - 2x) = ${num(K)}$ has three solutions. Find the smallest solution.`, 2, ans.sf(rs[0]), [
          `Expanding, $${poly(cs)} = ${num(K)}$. Solve it with the polynomial solver, or find where the graph of $V$ meets the line $y = ${num(K)}$.`, `The solutions are $x = ${sf(rs[0])}$, $x = ${sf(rs[1])}$ and $x = ${sf(rs[2])}$. The smallest is $${sf(rs[0])}$.`]),
        P("Find the other value of $x$ for which a box can be made with this volume.", 2, ans.sf(rs[1]), [`The squares must fit along the width, so $0 < x < ${num(a / 2)}$.`, `Only $x = ${sf(rs[0])}$ and $x = ${sf(rs[1])}$ are in this interval, so the other value is $${sf(rs[1])}$.`]),
        P("Why must the third solution be rejected?", 1, ans.choice(rng, { text: `Two squares of that size are wider than the card.`, value: "too-wide" }, [
          { text: "It is not a whole number.", value: "not-integer", why: "A length does not have to be a whole number." },
          { text: "It gives a different volume.", value: "other-volume", why: "Every solution of the equation gives the required value of the expression." },
          { text: "It is negative.", value: "negative", why: "All three solutions are positive." }]), [
          `$x = ${sf(rs[2])}$ gives $2x = ${sf(2 * rs[2])}$, which is more than the width of $${a}\\text{ cm}$, so the squares cannot be cut.`])] };
    } });
})(typeof globalThis !== "undefined" ? globalThis : this);
