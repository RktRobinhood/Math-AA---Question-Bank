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

  // =====================================================================================
  // 2.5 modelling with standard functions
  // =====================================================================================
  const degC = (x) => `${typeof x === "string" ? x : num(x)}^\\circ\\text{C}`;
  function coolSit(rng) {
    const warm = rng.bool(0.35), c = rng.int(17, 25), a = warm ? -rng.int(13, 21) : rng.int(42, 70), b = rng.int(103, 116) / 100, t0 = rng.int(4, 15);
    const level = Math.round(c + a * rng.pick([0.3, 0.4, 0.5, 0.6]));
    const thing = warm ? rng.pick(["a bottle of juice taken out of a fridge", "a carton of milk taken out of a fridge"]) : rng.pick(["a cup of coffee", "a bowl of soup", "a mug of tea"]);
    const when = warm ? "it is taken out" : "it is poured";
    return { warm, a, b, c, t0, level, thing, when, model: warm ? `${c} - ${-a} \\times ${num(b)}^{-t}` : `${a} \\times ${num(b)}^{-t} + ${c}` };
  }
  const coolStem = (s) => `The temperature, $T$ degrees Celsius, of ${s.thing} is modelled by $T(t) = ${s.model}$, where $t \\ge 0$ is the time in minutes after ${s.when}.`;
  const coolAt = (s, t) => s.a * Math.pow(s.b, -t) + s.c;
  const coolSub = (s, t) => (s.warm ? `${s.c} - ${-s.a} \\times ${num(s.b)}^{-${t}}` : `${s.a} \\times ${num(s.b)}^{-${t}} + ${s.c}`);
  const COOL = { type: "fn-ai-exponential-model", representation: "equation", format: "value", syllabus: ["2.5"], situationKey: "ai-cool", situation: coolSit };
  const coolParams = (s) => ({ a: s.a, b: s.b, c: s.c, t0: s.t0, level: s.level });
  reg({ ...COOL, unknown: "values-and-asymptote", levels: [2], skills: ["AI-SL2.5.exponential-model", "AI-SL2.5.horizontal-asymptote"], title: "Use an exponential model and its horizontal asymptote",
    build({ sit: s }) {
      return { params: coolParams(s), stem: coolStem(s), parts: [
        P("Find the initial temperature, in degrees Celsius.", 1, ans.int(s.a + s.c), [`At $t = 0$ the power is $${num(s.b)}^{0} = 1$, so $T(0) = ${s.warm ? `${s.c} - ${-s.a}` : `${s.a} + ${s.c}`} = ${s.a + s.c}$.`]),
        P(`Find the temperature after $${s.t0}$ minutes.`, 2, ans.sf(coolAt(s, s.t0)), [`$T(${s.t0}) = ${coolSub(s, s.t0)}$`, `$T(${s.t0}) = ${sf(coolAt(s, s.t0))}$`]),
        P("The temperature approaches the temperature of the room. Write down the temperature of the room, in degrees Celsius.", 1, ans.int(s.c), [
          `As $t$ increases, $${num(s.b)}^{-t}$ approaches $0$, so $T$ approaches $${s.c}$. The graph has the horizontal asymptote $T = ${s.c}$.`])] };
    } });
  reg({ ...COOL, unknown: "time-to-reach-level", levels: [4], skills: ["AI-SL2.5.exponential-model", "AI-SL2.5.horizontal-asymptote"], title: "Exponential model: value, time to reach a level, long-term behaviour",
    build({ rng, sit: s }) {
      const tl = Math.log(s.a / (s.level - s.c)) / Math.log(s.b), up = s.warm ? "rises" : "falls";
      return { params: coolParams(s), stem: coolStem(s), parts: [
        P("Find the initial temperature, in degrees Celsius.", 1, ans.int(s.a + s.c), [`$T(0) = ${s.warm ? `${s.c} - ${-s.a}` : `${s.a} + ${s.c}`} = ${s.a + s.c}$`]),
        P(`Find the temperature after $${s.t0}$ minutes.`, 1, ans.sf(coolAt(s, s.t0)), [`$T(${s.t0}) = ${coolSub(s, s.t0)} = ${sf(coolAt(s, s.t0))}$`]),
        P(`Find the time, in minutes, at which the temperature is $${degC(s.level)}$.`, 2, ans.sf(tl), [
          `Solve $${s.model} = ${s.level}$ with the GDC: draw $y = T(t)$ and $y = ${s.level}$ and find where they meet.`, `$t = ${sf(tl)}$`]),
        P("Write down the equation of the horizontal asymptote of the graph of $T$, by giving the value of $k$ in $T = k$.", 1, ans.int(s.c), [`As $t$ increases, $${num(s.b)}^{-t}$ approaches $0$, so the asymptote is $T = ${s.c}$.`]),
        P("What does the asymptote mean in this context?", 1, ans.choice(rng, { text: `The temperature ${up} towards $${degC(s.c)}$ but, in the model, never reaches it.`, value: "approaches" }, [
          { text: `The temperature reaches $${degC(s.c)}$ after exactly $${s.c}$ minutes.`, value: "reaches", why: "The asymptote is a value of the temperature, not a time." },
          { text: `The initial temperature is $${degC(s.c)}$.`, value: "initial", why: "The initial temperature is the value of the model when the time is zero." },
          { text: `The temperature changes by $${degC(s.c)}$ every minute.`, value: "rate", why: "An exponential model does not change by a fixed amount each minute." }]), [
          `It is the temperature of the surroundings: the temperature ${up} towards $${degC(s.c)}$ and gets closer and closer to it.`])] };
    } });

  const SINE = [{ what: "The depth of water in a harbour, $h$ metres,", t: "hours after midnight", unit: "m", bs: [30], a: [8, 24], d: [35, 60], k: 10, q: "depth of the water", T: "hours", per: "a high tide and the next high tide" },
    { what: "The height above the ground, $h$ metres, of a seat on a big wheel", t: "seconds after it passes the level of the axle on the way up", unit: "m", bs: [6, 8, 9, 10, 12], a: [60, 250], d: [70, 270], k: 10, q: "height of the seat", T: "seconds", per: "one complete turn" },
    { what: "The temperature in a greenhouse, $h$ degrees Celsius,", t: "hours after the heating is switched on", unit: "degrees", bs: [15], a: [30, 90], d: [160, 240], k: 10, q: "temperature", T: "hours", per: "one maximum and the next" }];
  function sineSit(rng) {
    let c, a, d, b;
    do { c = rng.pick(SINE); a = rng.int(c.a[0], c.a[1]) / c.k; d = rng.int(c.d[0], c.d[1]) / c.k; b = rng.pick(c.bs); } while (d - a < 0.4 || Number.isInteger(a));
    const period = 360 / b, t0 = rng.int(1, Math.floor(period) - 1), frac = rng.pick([0.35, 0.5, 0.65, 0.8]);
    const level = Math.round((d + frac * a) * 10) / 10;
    return { ci: SINE.indexOf(c), a, b, d, period, t0, level };
  }
  const sineModel = (s) => `${num(s.a)}\\sin(${s.b}t^\\circ) + ${num(s.d)}`;
  const sineAt = (s, t) => s.a * Math.sin(s.b * t * Math.PI / 180) + s.d;
  const SIN = { type: "fn-ai-sinusoidal-model", format: "value", syllabus: ["2.5"], situationKey: "ai-sine", situation: sineSit };
  reg({ ...SIN, unknown: "amplitude-period-values", representation: "equation", levels: [2], skills: ["AI-SL2.5.sinusoidal-model"], title: "Amplitude, period and values of a sinusoidal model",
    build({ sit: s }) {
      const c = SINE[s.ci];
      return { params: { a: s.a, b: s.b, d: s.d, t0: s.t0 }, stem: `${c.what} is modelled by $h(t) = ${sineModel(s)}$, where $t$ is the time in ${c.t}.`, parts: [
        P("Write down the amplitude of the model.", 1, ans.dec(s.a), [`For $a\\sin(bt) + d$ the amplitude is $a = ${num(s.a)}$.`]),
        P(`Find the period of the model, in ${c.T}.`, 1, ans.dec(s.period), [`The period is $\\dfrac{360}{b} = \\dfrac{360}{${s.b}} = ${num(s.period)}$.`]),
        P(`Find the maximum ${c.q}.`, 1, ans.dec(Number((s.a + s.d).toFixed(1))), [`The maximum is the principal axis plus the amplitude: $${num(s.d)} + ${num(s.a)} = ${num(Number((s.a + s.d).toFixed(1)))}$.`]),
        P(`Find the ${c.q} when $t = ${s.t0}$.`, 1, ans.sf(sineAt(s, s.t0)), [`With the GDC in degree mode, $h(${s.t0}) = ${num(s.a)}\\sin(${s.b * s.t0}^\\circ) + ${num(s.d)} = ${sf(sineAt(s, s.t0))}$.`])] };
    } });
  reg({ ...SIN, unknown: "build-from-max-min-period", representation: "words", levels: [4], skills: ["AI-SL2.5.sinusoidal-model"], title: "Build a sinusoidal model from its maximum, minimum and period",
    build({ sit: s }) {
      const c = SINE[s.ci], mx = Number((s.d + s.a).toFixed(1)), mn = Number((s.d - s.a).toFixed(1)), t1 = Math.asin((s.level - s.d) / s.a) * 180 / Math.PI / s.b;
      return { params: { mx, mn, period: s.period, t0: s.t0, level: s.level }, stem: `${c.what} is modelled by $h(t) = a\\sin(bt^\\circ) + d$, where $t$ is the time in ${c.t} and $a$ and $b$ are positive. The maximum ${c.q} is $${num(mx)}$, the minimum is $${num(mn)}$, and the time between ${c.per} is $${num(s.period)}$ ${c.T}.`, parts: [
        P("Find the value of $a$.", 1, ans.dec(s.a), [`The amplitude is half the difference between the maximum and the minimum: $a = \\dfrac{${num(mx)} - ${num(mn)}}{2} = ${num(s.a)}$`]),
        P("Find the value of $d$.", 1, ans.dec(s.d), [`The principal axis is halfway between them: $d = \\dfrac{${num(mx)} + ${num(mn)}}{2} = ${num(s.d)}$`]),
        P("Find the value of $b$.", 2, ans.int(s.b), [`The period is $${num(s.period)}$, and the period of $\\sin(bt^\\circ)$ is $\\dfrac{360}{b}$.`, `$b = \\dfrac{360}{${num(s.period)}} = ${s.b}$`]),
        P(`Find the ${c.q} when $t = ${s.t0}$.`, 1, ans.sf(sineAt(s, s.t0)), [`$h(${s.t0}) = ${num(s.a)}\\sin(${s.b * s.t0}^\\circ) + ${num(s.d)} = ${sf(sineAt(s, s.t0))}$`]),
        P(`Find the first value of $t$ for which the ${c.q} is $${num(s.level)}$.`, 2, ans.sf(t1), [`Solve $${sineModel(s)} = ${num(s.level)}$ with the GDC (degree mode), taking the first intersection of the graph with the line $y = ${num(s.level)}$.`, `$t = ${sf(t1)}$`])] };
    } });

  const VAR = [{ stem: "The time, $T$ hours, taken to fill a tank varies inversely with the rate, $r$ litres per minute, at which water is pumped in", y: "T", x: "r", n: -1, xs: [20, 25, 40, 50, 80], ys: [6, 8, 9, 12, 15], yu: "hours", xu: "litres per minute" },
    { stem: "The intensity, $I$ lux, of the light from a lamp varies inversely with the square of the distance, $d$ metres, from the lamp", y: "I", x: "d", n: -2, xs: [2, 3, 4, 5], ys: [45, 60, 72, 90, 120], yu: "lux", xu: "metres" },
    { stem: "The braking distance, $D$ metres, of a car varies directly with the square of its speed, $v$ kilometres per hour", y: "D", x: "v", n: 2, xs: [40, 50, 60, 80], ys: [9, 14, 17, 22, 26], yu: "metres", xu: "kilometres per hour" },
    { stem: "The mass, $M$ grams, of a steel ball varies directly with the cube of its radius, $r$ centimetres", y: "M", x: "r", n: 3, xs: [2, 3, 4, 5], ys: [260, 410, 890, 1050], yu: "grams", xu: "centimetres" },
    { stem: "The force, $F$ newtons, between two magnets varies inversely with the square of the distance, $d$ centimetres, between them", y: "F", x: "d", n: -2, xs: [2, 4, 5, 8], ys: [18, 27, 36, 54], yu: "newtons", xu: "centimetres" }];
  reg({ type: "fn-ai-variation-model", unknown: "constant-and-values", representation: "words", format: "value", levels: [2],
    syllabus: ["2.5"], skills: ["AI-SL2.5.variation"], title: "Direct and inverse variation: find the constant and use the model",
    build({ rng }) {
      const c = rng.pick(VAR);
      let x1, y1, x2, y3;
      do { x1 = rng.pick(c.xs); y1 = rng.pick(c.ys); x2 = Math.round(x1 * rng.pick([0.6, 0.7, 1.3, 1.5, 1.8]) * 10) / 10; y3 = Math.round(y1 * rng.pick([0.4, 0.6, 1.4, 2.5])); } while (x2 === x1);
      const k = y1 / Math.pow(x1, c.n), y2 = k * Math.pow(x2, c.n), x3 = Math.pow(y3 / k, 1 / c.n), an = Math.abs(c.n);
      const xp = (v) => (an === 1 ? v : `${v}^{${an}}`), form = c.n > 0 ? `${c.y} = k${xp(c.x)}` : `${c.y} = \\dfrac{k}{${xp(c.x)}}`;
      const sub = (v) => (c.n > 0 ? `${sf(k, 4)} \\times ${xp(num(v))}` : `\\dfrac{${sf(k, 4)}}{${xp(num(v))}}`);
      return { params: { n: c.n, x1, y1, x2, y3 }, stem: `${c.stem}, so $${form}$ for a constant $k$. When $${c.x} = ${num(x1)}$, $${c.y} = ${num(y1)}$.`, parts: [
        P("Find the value of $k$.", 2, ans.sf(k), [`Substitute the given pair: $${num(y1)} = ${c.n > 0 ? `k \\times ${xp(num(x1))}` : `\\dfrac{k}{${xp(num(x1))}}`}$`, `$k = ${c.n > 0 ? `\\dfrac{${num(y1)}}{${xp(num(x1))}}` : `${num(y1)} \\times ${xp(num(x1))}`} = ${sf(k)}$`]),
        P(`Find the value of $${c.y}$ when $${c.x} = ${num(x2)}$.`, 1, ans.sf(y2), [`$${c.y} = ${sub(x2)} = ${sf(y2)}$`]),
        P(`Find the value of $${c.x}$ when $${c.y} = ${num(y3)}$.`, 1, ans.sf(x3), [`Solve $${num(y3)} = ${c.n > 0 ? `${sf(k, 4)}${xp(c.x)}` : `\\dfrac{${sf(k, 4)}}{${xp(c.x)}}`}$ with the GDC, taking the positive solution: $${c.x} = ${sf(x3)}$`])] };
    } });

  reg({ type: "fn-ai-quadratic-model", unknown: "height-of-a-ball", representation: "equation", format: "value", levels: [2],
    syllabus: ["2.5"], skills: ["AI-SL2.5.quadratic-model"], title: "A quadratic model: maximum and landing time with technology",
    build({ rng }) {
      const u = rng.int(60, 240) / 10, h0 = rng.pick([1.5, 1.8, 2, 12, 18, 25, 32, 40]), who = rng.pick(NAMES);
      const from = h0 > 5 ? `from the top of a cliff` : "from the ground level of a field, at shoulder height";
      const tm = u / 9.8, hm = h0 + u * u / 19.6, tg = (u + Math.sqrt(u * u + 19.6 * h0)) / 9.8, model = `${expr([[-4.9, "t^{2}"], [u, "t"], [h0, ""]])}`;
      return { params: { u, h0 }, stem: `${who} throws a ball ${from}. Its height above the ground, $h$ metres, $t$ seconds after it is thrown is modelled by $h(t) = ${model}$.`, parts: [
        P("Write down the height from which the ball is thrown, in metres.", 1, ans.dec(h0), [`$h(0) = ${num(h0)}$`]),
        P("Find the maximum height of the ball, in metres.", 2, ans.sf(hm), [`Draw the graph on the GDC and find its maximum point: $${point(sf(tm), sf(hm))}$.`, `The maximum height is $${sf(hm)}$ metres.`]),
        P("Find the time, in seconds, at which the ball hits the ground.", 1, ans.sf(tg), [`Find the positive zero of $h$: $t = ${sf(tg)}$`])] };
    } });

  const TARIFF = [{ stem: "A taxi company charges a fixed fare for journeys of up to $D$ kilometres and an extra amount for each kilometre after that", x: "the length of the journey in kilometres", d: [2, 3, 4, 5], F: [450, 900], r: [120, 260], q: "a journey of", u: "km" },
    { stem: "A car park charges a fixed price for stays of up to $D$ hours and an extra amount for each hour after that", x: "the length of the stay in hours", d: [2, 3, 4], F: [200, 600], r: [90, 240], q: "a stay of", u: "hours" },
    { stem: "A courier charges a fixed price for parcels of up to $D$ kilograms and an extra amount for each kilogram above that", x: "the mass of the parcel in kilograms", d: [2, 5, 10], F: [500, 1200], r: [60, 180], q: "a parcel of", u: "kg" }];
  reg({ type: "fn-ai-piecewise-linear", unknown: "cost-from-tariff", representation: "equation", format: "value", levels: [1, 2],
    syllabus: ["2.5"], skills: ["AI-SL2.5.piecewise-linear"], title: "Use a piecewise linear model of a cost",
    build({ rng, level }) {
      const c = rng.pick(TARIFF), d = rng.pick(c.d), F = rng.int(c.F[0] / 10, c.F[1] / 10) / 10, r = rng.int(c.r[0] / 10, c.r[1] / 10) / 10;
      const x1 = rng.int(1, 2 * d - 1) / 2, x2 = d + rng.int(3, 24) / 2, x3 = d + rng.int(5, 40) / 2 + 0.5 * (rng.bool() ? 1 : 0);
      const C = (x) => r2(x <= d ? F : F + r * (x - d)), K = C(x3);
      const stem = `${c.stem.replace("$D$", () => `$${d}$`)}. The cost, $C$ euros, is modelled by $C(x) = \\begin{cases} ${dp(F, 2)}, & 0 < x \\le ${d} \\\\ ${dp(F, 2)} + ${dp(r, 2)}(x - ${d}), & x > ${d} \\end{cases}$ where $x$ is ${c.x}.`;
      const pLow = P(`Find the cost, in euros, of ${c.q} $${num(x1)}\\text{ ${c.u}}$.`, 1, ans.dp(F, 2), [`$${num(x1)} \\le ${d}$, so the first rule applies: $C = ${dp(F, 2)}$`]);
      const pHigh = P(`Find the cost, in euros, of ${c.q} $${num(x2)}\\text{ ${c.u}}$.`, 1, ans.dp(C(x2), 2), [`$${num(x2)} > ${d}$, so the second rule applies: $C = ${dp(F, 2)} + ${dp(r, 2)}(${num(x2)} - ${d}) = ${dp(C(x2), 2)}$`]);
      if (level === 1) return { params: { d, F, r, x1, x2 }, stem, parts: [pLow, pHigh] };
      return { params: { d, F, r, x1, x2, K }, stem, parts: [pLow, pHigh,
        P(`The cost is $${dp(K, 2)}$ euros. Find the value of $x$.`, 2, ans.dec(x3), [`The cost is more than $${dp(F, 2)}$, so the second rule applies: $${dp(F, 2)} + ${dp(r, 2)}(x - ${d}) = ${dp(K, 2)}$`, `$x - ${d} = \\dfrac{${dp(K - F, 2)}}{${dp(r, 2)}} = ${num(x3 - d)}$, so $x = ${num(x3)}$`])] };
    } });

  // =====================================================================================
  // 2.6 the modelling process
  // =====================================================================================
  const EXPFIT = [{ stem: "The population of a town", q: "population", grow: true, lo: 8000, hi: 60000, step: 100, t: "years after a census" },
    { stem: "The number of users of a new app", q: "number of users", grow: true, lo: 1200, hi: 9000, step: 50, t: "months after its launch" },
    { stem: "The value, in euros, of a car", q: "value of the car", grow: false, lo: 14000, hi: 42000, step: 500, t: "years after it is bought" },
    { stem: "The mass, in grams, of a radioactive sample", q: "mass of the sample", grow: false, lo: 200, hi: 950, step: 10, t: "days after it is prepared" }];
  reg({ type: "fn-ai-fit-model", unknown: "exponential-from-two-values", representation: "words", format: "value", levels: [2],
    syllabus: ["2.6"], skills: ["AI-SL2.6.find-parameters"], title: "Find the parameters of an exponential model from two values",
    build({ rng }) {
      const c = rng.pick(EXPFIT);
      let P0, t1, P1, a, t2;
      do { P0 = rng.int(c.lo / c.step, c.hi / c.step) * c.step; t1 = rng.int(3, 8); a = c.grow ? 1 + rng.int(3, 14) / 100 : 1 - rng.int(5, 22) / 100; P1 = Math.round(P0 * Math.pow(a, t1) / c.step) * c.step; t2 = t1 + rng.int(2, 6); } while (P1 === P0);
      const av = Math.pow(P1 / P0, 1 / t1), P2 = P0 * Math.pow(av, t2);
      return { params: { P0, t1, P1, t2 }, stem: `${c.stem}, $t$ ${c.t}, is modelled by $N(t) = k \\times a^{t}$. Initially the ${c.q} is $${num(P0)}$, and when $t = ${t1}$ it is $${num(P1)}$.`, parts: [
        P("Write down the value of $k$.", 1, ans.int(P0), [`$N(0) = k \\times a^{0} = k$, so $k = ${num(P0)}$.`]),
        P("Find the value of $a$.", 2, ans.sf(av), [`$${num(P0)} \\times a^{${t1}} = ${num(P1)}$`, `$a^{${t1}} = ${sf(P1 / P0, 5)}$, so $a = ${sf(av)}$ (solve with the GDC, or take the $${t1}$th root)`]),
        P(`Use the model to predict the ${c.q} when $t = ${t2}$.`, 1, ans.sf(P2), [`$N(${t2}) = ${num(P0)} \\times ${sf(av, 5)}^{${t2}} = ${sf(P2)}$`])] };
    } });

  const QFIT = [{ stem: "A ball is kicked from a platform. Its height above the ground, $h$ metres, at a horizontal distance of $x$ metres from the platform", end: "Find the horizontal distance, in metres, at which the ball lands.", range: "horizontal distances" },
    { stem: "Water leaves a fountain's nozzle and follows a curved path. Its height above the pool, $h$ metres, at a horizontal distance of $x$ metres from the nozzle", end: "Find the horizontal distance, in metres, at which the water lands in the pool.", range: "horizontal distances" }];
  reg({ type: "fn-ai-fit-model", unknown: "quadratic-through-three-points", representation: "table", format: "value", levels: [4],
    syllabus: ["2.6"], skills: ["AI-SL2.6.find-parameters", "AI-SL2.6.predict-reliability"], title: "Fit a quadratic model through three points and use it",
    build({ rng }) {
      const c = rng.pick(QFIT);
      let a, b, c0, x1, x2, x3, ys, land;
      do { a = -rng.int(2, 12) / 100; b = rng.int(6, 24) / 10; c0 = rng.int(4, 30) / 10; x1 = rng.pick([2, 4, 5, 10]); x2 = x1 + rng.pick([2, 4, 5, 10]); ys = [c0, a * x1 * x1 + b * x1 + c0, a * x2 * x2 + b * x2 + c0].map((v) => Number(v.toFixed(4)));
        land = (-b - Math.sqrt(b * b - 4 * a * c0)) / (2 * a); x3 = rng.int(1, x2 - 1); } while (ys.some((y) => y <= 0.2 || Math.abs(y * 100 - Math.round(y * 100)) > 1e-6) || x3 === x1 || land < x2 + 1 || ys[1] === ys[0]);
      const h3 = a * x3 * x3 + b * x3 + c0, eq = (p, q2, incl) => `$${expr([[p, "a"], [q2, "b"], [incl ? 1 : 0, "c"]])} = ${num(ys[1])}$`;
      return { params: { xs: [0, x1, x2], ys, x3 }, stem: `${c.stem} is modelled by $h = ax^{2} + bx + c$. The table shows three measurements.`,
        table: { head: ["$x$ (m)", "$0$", m(x1), m(x2)], rows: [["$h$ (m)"].concat(ys.map((y) => m(num(y))))] },
        parts: [
          P("Write down the value of $c$.", 1, ans.dec(c0), [`When $x = 0$, $h = c$, so $c = ${num(c0)}$.`]),
          P(`Which equation comes from the measurement at $x = ${x1}$?`, 1, ans.choice(rng, { text: eq(x1 * x1, x1, true), value: [x1 * x1, x1, 1] }, [
            { text: eq(x1, x1 * x1, true), value: [x1, x1 * x1, 1], why: "The coefficient of $a$ is the square of the distance; the coefficient of $b$ is the distance itself." },
            { text: eq(x1 * x1, x1, false), value: [x1 * x1, x1, 0], why: "The constant $c$ is part of the model at every point." },
            { text: eq(2 * x1, x1, true), value: [2 * x1, x1, 1], why: "Squaring the distance is not the same as doubling it." }]), [`Substitute $x = ${x1}$ and $h = ${num(ys[1])}$: $a${br(x1)}^{2} + b${br(x1)} + c = ${num(ys[1])}$`]),
          P("Find the value of $a$.", 2, ans.dec(a), [`The third measurement gives $${expr([[x2 * x2, "a"], [x2, "b"], [1, "c"]])} = ${num(ys[2])}$.`, `Solving the equations with technology (with $c = ${num(c0)}$): $a = ${num(a)}$ and $b = ${num(b)}$.`]),
          P("Find the value of $b$.", 1, ans.dec(b), [`From the solver, $b = ${num(b)}$.`]),
          P(`Use the model to find the height when $x = ${x3}$.`, 1, ans.sf(h3), [`$h = ${num(a)}${br(x3)}^{2} + ${num(b)}${br(x3)} + ${num(c0)} = ${sf(h3)}$`]),
          P(c.end, 1, ans.sf(land), [`Find the positive zero of $h = ${expr([[a, "x^{2}"], [b, "x"], [c0, ""]])}$ with the GDC: $x = ${sf(land)}$`])] };
    } });

  reg({ type: "fn-ai-choose-model", unknown: "family-from-table", representation: "table", format: "value", levels: [2], calculator: false,
    syllabus: ["2.6"], skills: ["AI-SL2.6.choose-model", "AI-SL2.6.find-parameters"], title: "Choose the model that fits a table of values and use it",
    build({ rng }) {
      const kind = rng.pick(["linear", "quadratic", "exponential"]);
      let f, ys, y6;
      do {
        if (kind === "linear") { const mm = rng.nonzero(-9, 12), c = rng.int(5, 80); f = (x) => mm * x + c; }
        else if (kind === "quadratic") { const a = rng.pick([1, 2, 3, -1, -2]), b = rng.int(-6, 9), c = rng.int(4, 60); f = (x) => a * x * x + b * x + c; }
        else { const r = rng.pick([2, 3, 1.5, 0.5]), k = (r === 1.5 || r === 0.5 ? 64 : 1) * rng.int(2, 9); f = (x) => k * Math.pow(r, x); }
        ys = [0, 1, 2, 3, 4].map(f); y6 = f(6);
      } while (ys.some((y) => y <= 0) || y6 <= 0 || new Set(ys).size < 5);
      const d1 = ys.slice(1).map((y, i) => y - ys[i]), d2 = d1.slice(1).map((y, i) => y - d1[i]), ratio = ys[1] / ys[0];
      const names = { linear: "A linear model, $y = mx + c$", quadratic: "A quadratic model, $y = ax^{2} + bx + c$", exponential: "An exponential model, $y = k \\times a^{x}$", inverse: "An inverse variation model, $y = \\dfrac{k}{x}$" };
      const why = { linear: "The differences between successive values of $y$ are not all equal.", quadratic: "The second differences of $y$ are not constant.", exponential: "The ratios of successive values of $y$ are not all equal.", inverse: "This model is not defined when $x$ is zero." };
      const reason = kind === "linear" ? [`The differences between successive values are all $${num(d1[0])}$, so the model is linear.`, `Two more steps: $${num(ys[4])} ${signed(d1[0])} ${signed(d1[0])} = ${num(y6)}$`]
        : kind === "quadratic" ? [`The first differences are $${d1.map(num).join(",\\ ")}$ and the second differences are all $${num(d2[0])}$, so the model is quadratic.`, `Continue the pattern: the next first differences are $${num(d1[3] + d2[0])}$ and $${num(d1[3] + 2 * d2[0])}$, so $y = ${num(ys[4])} ${signed(d1[3] + d2[0])} ${signed(d1[3] + 2 * d2[0])} = ${num(y6)}$.`]
          : [`Each value is $${num(ratio)}$ times the one before, so the model is exponential with $a = ${num(ratio)}$.`, `Two more steps: $${num(ys[4])} \\times ${num(ratio)}^{2} = ${num(y6)}$`];
      return { params: { ys }, stem: "The table shows the values of a quantity $y$ measured in an experiment for five values of $x$.",
        table: { head: ["$x$", "$0$", "$1$", "$2$", "$3$", "$4$"], rows: [["$y$"].concat(ys.map((y) => m(num(y))))] },
        parts: [
          P("Which model fits the data exactly?", 1, ans.choice(rng, { text: names[kind], value: kind }, ["linear", "quadratic", "exponential", "inverse"].filter((k) => k !== kind).map((k) => ({ text: names[k], value: k, why: why[k] }))), [reason[0]]),
          P("Use this model to predict the value of $y$ when $x = 6$.", 2, ans.dec(y6), [reason[1]])] };
    } });

  const LINFIT = [{ stem: "The height, $H$ centimetres, of a young tree", q: "height", t: "years after it is planted", lo: 40, hi: 90, rate: [18, 45], far: 60, bad: "A tree does not keep growing at the same rate for ever." },
    { stem: "The number of members, $H$, of a sports club", q: "number of members", t: "years after it opens", lo: 80, hi: 260, rate: [15, 60], far: 80, bad: "Nothing suggests the club keeps growing at the same rate for so long." },
    { stem: "The length, $H$ centimetres, of a baby", q: "length", t: "months after birth", lo: 48, hi: 54, rate: [1.5, 3.2], far: 240, bad: "Children do not keep growing at the same rate for twenty years.", dp1: true }];
  reg({ type: "fn-ai-test-model", unknown: "linear-model-test-and-predict", representation: "words", format: "value", levels: [4],
    syllabus: ["2.6"], skills: ["AI-SL2.6.find-parameters", "AI-SL2.6.test-model", "AI-SL2.6.predict-reliability", "AI-SL2.6.limitations"], title: "Build a linear model from two points, test it and judge a prediction",
    build({ rng }) {
      const c = rng.pick(LINFIT), small = Boolean(c.dp1);
      let t1, t2, t3, t4, h1, h2, mm, c0, actual, pred4;
      do { t1 = rng.int(1, 3); t2 = t1 + rng.int(3, 6); t3 = rng.int(t1 + 1, t2 - 1); t4 = t2 + rng.int(2, 4);
        const rate = c.rate[0] + (c.rate[1] - c.rate[0]) * rng.int(0, 20) / 20, base = c.lo + (c.hi - c.lo) * rng.int(0, 10) / 10;
        h1 = small ? Math.round((base + rate * t1) * 10) / 10 : Math.round(base + rate * t1); h2 = small ? Math.round((base + rate * t2) * 10) / 10 : Math.round(base + rate * t2);
        mm = (h2 - h1) / (t2 - t1); c0 = h1 - mm * t1; pred4 = mm * t4 + c0; actual = small ? Math.round(pred4 * rng.pick([0.88, 0.92, 1.07, 1.12]) * 10) / 10 : Math.round(pred4 * rng.pick([0.88, 0.92, 1.07, 1.12])); }
      while (h2 <= h1 || Math.abs(actual - pred4) / actual < 0.02 || Number.isInteger(mm * 2));
      const pe = Math.abs(pred4 - actual) / actual * 100, pred3 = mm * t3 + c0;
      return { params: { t1, h1, t2, h2, t3, t4, actual, far: c.far }, stem: `${c.stem}, $t$ ${c.t}, is modelled by $H = mt + c$. When $t = ${t1}$ the ${c.q} is $${num(h1)}$ and when $t = ${t2}$ it is $${num(h2)}$.`, parts: [
        P("Find the value of $m$.", 2, ans.sf(mm), [`$m = \\dfrac{${num(h2)} - ${num(h1)}}{${t2} - ${t1}} = ${sf(mm)}$`, `It is the increase in the ${c.q} for each unit of time.`]),
        P("Find the value of $c$.", 1, ans.sf(c0), [`$${num(h1)} = ${sf(mm, 5)}${br(t1)} + c$, so $c = ${sf(c0)}$`]),
        P(`Use the model to estimate the ${c.q} when $t = ${t3}$.`, 1, ans.sf(pred3), [`$H = ${sf(mm, 5)}${br(t3)} ${signed(roundSf(c0, 5))} = ${sf(pred3)}$`]),
        P(`When $t = ${t4}$ the ${c.q} is in fact $${num(actual)}$. Find the percentage error in the model's prediction for $t = ${t4}$.`, 2, ans.sf(pe), [
          `The model predicts $${sf(mm, 5)}${br(t4)} ${signed(roundSf(c0, 5))} = ${sf(pred4, 4)}$.`, `$\\left|\\dfrac{${sf(pred4, 4)} - ${num(actual)}}{${num(actual)}}\\right| \\times 100\\% = ${sf(pe)}\\%$`]),
        P(`The model is used to predict the ${c.q} when $t = ${c.far}$. Which statement is correct?`, 1, ans.choice(rng, { text: `The prediction is unreliable, because $t = ${c.far}$ is far outside the range of the data.`, value: "extrapolation" }, [
          { text: "The prediction is reliable, because the model passes exactly through two data points.", value: "reliable-fit", why: "Any two points lie on a line. That says nothing about values far outside the data." },
          { text: "The prediction is reliable, because a linear model can be used for any value of the variable.", value: "reliable-linear", why: "A model is only supported by data in the range where it was built." },
          { text: "The prediction is unreliable, because linear models are never accurate.", value: "never", why: "A linear model can describe data well inside its range." }]), [
          `The model was built from data between $t = ${t1}$ and $t = ${t2}$. Using it at $t = ${c.far}$ is extrapolation. ${c.bad}`])] };
    } });

  reg({ type: "fn-ai-choose-model", unknown: "is-the-prediction-reliable", representation: "words", format: "mcq", levels: [1], calculator: false,
    syllabus: ["2.6"], skills: ["AI-SL2.6.predict-reliability", "AI-SL2.6.domain"], title: "Interpolation or extrapolation?",
    build({ rng }) {
      const c = rng.pick([{ x: "the temperature, in degrees Celsius,", y: "the number of ice creams sold", lo: [12, 18], w: [10, 16] }, { x: "the age of a car, in years,", y: "its value", lo: [1, 3], w: [5, 9] },
        { x: "the mass of fertiliser used, in grams,", y: "the yield of a tomato plant", lo: [10, 30], w: [40, 80] }, { x: "the time spent revising, in hours,", y: "the score in a test", lo: [2, 6], w: [10, 20] }]);
      const lo = rng.int(c.lo[0], c.lo[1]), hi = lo + rng.int(c.w[0], c.w[1]), inside = rng.bool(), x = inside ? rng.int(lo + 1, hi - 1) : rng.bool() ? hi + rng.int(Math.ceil((hi - lo) / 2), hi - lo) : hi + rng.int(3, hi - lo);
      const opt = { "in-reliable": `Reliable: $${x}$ is inside the range of the data, so this is interpolation.`, "out-unreliable": `Unreliable: $${x}$ is outside the range of the data, so this is extrapolation.`,
        "in-unreliable": `Unreliable: $${x}$ is not one of the values in the data.`, "out-reliable": `Reliable: the model fits the data well, so it can be used for any value.` };
      const right = inside ? "in-reliable" : "out-unreliable";
      const whys = { "in-reliable": "Check whether the value lies between the smallest and largest values in the data.", "out-unreliable": "Check whether the value lies between the smallest and largest values in the data.",
        "in-unreliable": "A model is meant to be used between the data values as well as at them.", "out-reliable": "A good fit inside the range of the data says nothing about what happens outside it." };
      return { params: { lo, hi, x }, stem: `A model linking ${c.x} $x$, to ${c.y} was found from data with $${lo} \\le x \\le ${hi}$, and it fits the data well. The model is used to make a prediction for $x = ${x}$.`, parts: [
        P("Which statement about this prediction is correct?", 1, ans.choice(rng, { text: opt[right], value: right }, Object.keys(opt).filter((k) => k !== right).map((k) => ({ text: opt[k], value: k, why: whys[k] }))), [
          inside ? `$${lo} \\le ${x} \\le ${hi}$, so the prediction is an interpolation and can be trusted.` : `$${x} > ${hi}$, so the prediction is an extrapolation: the pattern may not continue outside the data.`])] };
    } });

  // =====================================================================================
  // 2.3 graphs of functions and 2.4 key features (statements shared with AA, AI-style practice)
  // =====================================================================================
  reg({ type: "fn-ai-graph-reading", unknown: "values-and-solutions", representation: "graph", format: "value", levels: [2], calculator: false,
    syllabus: ["2.3"], skills: ["SL2.3.read-graph"], title: "Read values and solutions from a graph",
    build({ rng }) {
      const s = rng.sign(), p = rng.int(-1, 3), q = s < 0 ? rng.int(3, 7) : rng.int(-7, -3), j = rng.pick([2, 3]), i = rng.pick([1, 2, 3].filter((v) => v !== j)), x0 = p + rng.sign() * i;
      const coeffs = [s * p * p + q, -2 * s * p, s], f = (x) => s * (x - p) * (x - p) + q, k = f(p + j);
      const y = s < 0 ? [q - 10, q + 2] : [q - 2, q + 10];
      return { params: { x0, k }, stem: `The graph of $y = f(x)$ is shown for $${p - 3} \\le x \\le ${p + 3}$.`,
        graph: { x: [p - 4, p + 4], y, xStep: 1, yStep: 1, functions: [{ fn: { type: "poly", coeffs }, domain: [p - 3, p + 3], label: "f" }], alt: "A parabola drawn on a grid" },
        parts: [
          P(`Use the graph to write down the value of $f(${x0})$.`, 1, ans.int(f(x0)), [`Go up or down from $x = ${x0}$ to the curve and read across: $f(${x0}) = ${f(x0)}$.`]),
          P(`The equation $f(x) = ${k}$ has two solutions. Write down the smaller solution.`, 1, ans.int(p - j), [`Draw the horizontal line $y = ${k}$. It meets the curve at $x = ${p - j}$ and $x = ${p + j}$.`, `The smaller solution is $x = ${p - j}$.`]),
          P("Write down the larger solution.", 1, ans.int(p + j), [`The larger solution is $x = ${p + j}$.`])] };
    } });

  reg({ type: "fn-ai-graph-reading", unknown: "family-of-a-graph", representation: "graph", format: "mcq", levels: [1], calculator: false,
    syllabus: ["2.3"], skills: ["SL2.3.match-graph"], title: "Recognise the type of function from its graph",
    build({ rng }) {
      const kind = rng.pick(["linear", "quadratic", "cubic", "exponential", "sinusoidal"]);
      const fn = kind === "linear" ? { type: "poly", coeffs: [rng.int(-2, 2), rng.pick([-2, -1, -0.5, 0.5, 1, 2])] }
        : kind === "quadratic" ? (() => { const a = rng.pick([-1, -0.5, 0.5, 1]), p = rng.int(-2, 2), q = rng.int(-3, 3) * (a > 0 ? -1 : 1) * (rng.bool() ? 1 : 0); return { type: "poly", coeffs: [a * p * p + q, -2 * a * p, a] }; })()
          : kind === "cubic" ? (() => { const a = rng.pick([-0.25, 0.25, 0.2, -0.2]), c = rng.pick([2, 3]), k = rng.int(-1, 1); return { type: "poly", coeffs: [k, -a * c * 3, 0, a] }; })()
            : kind === "exponential" ? { type: "exp", a: rng.pick([1, 2, -1]), b: rng.pick([2, 0.5, 1.5]), k: rng.int(-3, 1) }
              : { type: "trig", name: rng.pick(["sin", "cos"]), a: rng.pick([2, 3, 4]), b: rng.pick([1.5, 2, 2.5]), d: rng.int(-1, 1) };
      const names = { linear: "A linear function", quadratic: "A quadratic function", cubic: "A cubic function", exponential: "An exponential function", sinusoidal: "A sinusoidal function" };
      const why = { linear: "The graph of a linear function is a straight line.", quadratic: "The graph of a quadratic function is a parabola with exactly one turning point and a line of symmetry.",
        cubic: "The graph of a cubic function has at most two turning points and its two ends go in opposite directions.", exponential: "The graph of an exponential function has no turning point and levels off towards a horizontal asymptote on one side.",
        sinusoidal: "The graph of a sinusoidal function is a wave that repeats, with equally high maxima and equally low minima." };
      return { params: { kind }, stem: "The graph of a function is shown.",
        graph: { x: [-5, 5], y: [-6, 6], xStep: 1, yStep: 1, functions: [{ fn }], alt: "The graph of a function on a grid" },
        parts: [P("Which type of function has a graph of this shape?", 1, ans.choice(rng, { text: names[kind], value: kind }, Object.keys(names).filter((k) => k !== kind).map((k) => ({ text: names[k], value: k, why: why[k] })), 5), [why[kind]])] };
    } });

  reg({ type: "fn-ai-gdc-sketch", unknown: "sketch-and-describe-cubic", representation: "graph", format: "graph-pick", levels: [4],
    syllabus: ["2.3"], skills: ["SL2.3.sketch-from-equation", "SL2.3.read-graph"], title: "Transfer a graph from the GDC and read its features",
    build({ rng }) {
      let a, c, k, xm, top, bot, lvl, n;
      do { a = rng.pick([0.5, 0.25, 0.4, 0.2]); c = rng.int(2, 5); k = rng.nonzero(-3, 3); xm = Math.sqrt(c / (3 * a)); top = k + 2 * c * xm / 3; bot = k - 2 * c * xm / 3;
        lvl = rng.bool() ? rng.int(Math.ceil(bot + 0.6), Math.floor(top - 0.6)) : rng.pick([Math.ceil(top + 0.7), Math.floor(bot - 0.7)]); n = lvl > top || lvl < bot ? 1 : 3; }
      while (top > 7.2 || bot < -7.2 || xm > 3.2 || Math.abs(lvl) > 7.5 || lvl === k || Math.ceil(bot + 0.6) > Math.floor(top - 0.6) || Math.abs(xm - Math.round(xm * 10) / 10) < 1e-3);
      const win = (fn) => ({ x: [-5, 5], y: [-8, 8], xStep: 1, yStep: 2, functions: [{ fn }], alt: "A curve on a grid" });
      const cub = (aa, cc, kk) => ({ type: "poly", coeffs: [kk, -cc, 0, aa] });
      const right = win(cub(a, c, k));
      const cands = [{ graph: win(cub(-a, -c, k)), why: "Check a point: for a large positive $x$ the value of the function must be positive." }, { graph: win(cub(a, c, -k)), why: "The curve must cross the $y$-axis at the constant term." },
        { graph: win({ type: "poly", coeffs: [k, -c, a] }), why: "This is a parabola. A cubic has two ends going in opposite directions." }, { graph: win(cub(a, -c, k)), why: "This curve has no turning points. The function has a local maximum and a local minimum." },
        { graph: win(cub(-a, -c, -k)), why: "Check the $y$-intercept and the direction of the curve for large $x$." }, { graph: win(cub(a, c, k + (k > 0 ? -4 : 4))), why: "The curve must cross the $y$-axis at the constant term." }];
      const picked = E.graph.pickDistinct(right, cands.map((o) => o.graph), 3), wrongs = cands.filter((o) => picked.includes(o.graph));
      const model = `${expr([[a, "x^{3}"], [-c, "x"], [k, ""]])}`;
      return { params: { a, c, k, lvl }, stem: `Consider the function $f(x) = ${model}$ for $-5 \\le x \\le 5$.`, parts: [
        P("Which graph shows $y = f(x)$?", 2, ans.graph(rng, { graph: right, value: "f" }, wrongs.map((o, i2) => ({ graph: o.graph, value: "w" + i2, why: o.why }))), [
          `Draw the graph on the GDC with a window such as $-5 \\le x \\le 5$, $-8 \\le y \\le 8$.`, `The curve rises to a local maximum on the left of the $y$-axis, crosses the $y$-axis at $${k}$, falls to a local minimum and then rises.`]),
        P("Write down the $y$-intercept of the graph.", 1, ans.int(k), [`$f(0) = ${k}$`]),
        P("Find the $x$-coordinate of the local maximum point.", 1, ans.sf(-xm), [`The GDC gives the local maximum point $${point(sf(-xm), sf(top))}$, so $x = ${sf(-xm)}$.`]),
        P(`Write down the number of solutions of the equation $f(x) = ${lvl}$.`, 1, ans.int(n), [
          `The local maximum value is $${sf(top)}$ and the local minimum value is $${sf(bot)}$.`, n === 3 ? `$${lvl}$ lies between them, so the line $y = ${lvl}$ meets the curve $3$ times.` : `$${lvl}$ does not lie between them, so the line $y = ${lvl}$ meets the curve only once: $1$ solution.`])] };
    } });

  reg({ type: "fn-ai-gdc-key-features", unknown: "intercept-and-asymptote", representation: "equation", format: "value", levels: [1], calculator: false,
    syllabus: ["2.4"], skills: ["SL2.4.zeros-intercepts", "SL2.4.asymptotes"], title: "The y-intercept and horizontal asymptote of an exponential graph",
    build({ rng }) {
      const a = rng.pick([2, 3, 4, 5, 6, 8, -2, -3, -4]), b = rng.pick([2, 3, 1.5, 0.5, 0.8, 1.2]), c = rng.nonzero(-9, 12);
      const model = `${a} \\times ${num(b)}^{x} ${signed(c)}`;
      return { params: { a, b, c }, stem: `Consider the function $f(x) = ${model}$.`, parts: [
        P("Write down the $y$-intercept of the graph of $f$.", 1, ans.int(a + c), [`$f(0) = ${a} \\times 1 ${signed(c)} = ${a + c}$`]),
        P("The graph of $f$ has a horizontal asymptote $y = k$. Write down the value of $k$.", 1, ans.int(c), [
          `As $x$ ${b > 1 ? "decreases" : "increases"}, $${num(b)}^{x}$ approaches $0$, so $f(x)$ approaches $${c}$. The asymptote is $y = ${c}$.`])] };
    } });

  reg({ type: "fn-ai-gdc-key-features", unknown: "cubic-turning-point-and-zero", representation: "equation", format: "value", levels: [2],
    syllabus: ["2.4"], skills: ["SL2.4.max-min", "SL2.4.zeros-intercepts"], title: "Find a maximum point and a zero with the GDC",
    build({ rng }) {
      let cs, f, xmax, xmin, rs;
      do { cs = [rng.int(2, 9) / 10, -rng.int(5, 40) / 10, rng.int(-30, 60) / 10, rng.int(-40, 60) / 10]; f = (x) => ((cs[0] * x + cs[1]) * x + cs[2]) * x + cs[3];
        const disc = cs[1] * cs[1] - 3 * cs[0] * cs[2]; if (disc <= 0.5) { rs = []; continue; }
        xmax = (-cs[1] - Math.sqrt(disc)) / (3 * cs[0]); xmin = (-cs[1] + Math.sqrt(disc)) / (3 * cs[0]); rs = cubicRoots(cs); }
      while (rs.length !== 3 || rs[2] > 12 || Math.abs(f(xmax)) > 40 || Math.abs(xmax) < 0.15 || rs[2] - rs[1] < 0.3 || cs[2] === 0 || cs[3] === 0);
      return { params: { cs }, stem: `Consider the function $f(x) = ${poly(cs)}$.`, parts: [
        P("Write down the $y$-intercept of the graph of $f$.", 1, ans.dec(cs[3]), [`$f(0) = ${num(cs[3])}$`]),
        P("Find the $x$-coordinate of the local maximum point of the graph.", 1, ans.sf(xmax), [`Draw the graph on the GDC and use the maximum tool: the local maximum point is $${point(sf(xmax), sf(f(xmax)))}$.`, `$x = ${sf(xmax)}$`]),
        P("Find the $y$-coordinate of the local maximum point.", 1, ans.sf(f(xmax)), [`From the same point, $y = ${sf(f(xmax))}$.`]),
        P("Find the largest zero of $f$.", 1, ans.sf(rs[2]), [`The graph crosses the $x$-axis at $x = ${sf(rs[0])}$, $x = ${sf(rs[1])}$ and $x = ${sf(rs[2])}$.`, `The largest zero is $${sf(rs[2])}$.`])] };
    } });

  const newton2 = (g, x) => { for (let i = 0; i < 80; i++) { const h = 1e-6, d = (g(x + h) - g(x - h)) / (2 * h); if (Math.abs(d) < 1e-12) break; x -= g(x) / d; } return x; };
  reg({ type: "fn-ai-gdc-intersection", unknown: "exponential-meets-line", representation: "equation", format: "value", levels: [4],
    syllabus: ["2.4"], skills: ["SL2.4.intersection"], title: "Find where an exponential curve meets a line",
    build({ rng }) {
      let a, b, mm, c, x1, x2, g;
      do { a = rng.pick([1, 2, 3]); b = rng.int(13, 20) / 10; const u = rng.int(-30, 5) / 10, v = rng.int(15, 45) / 10;
        mm = Math.round((a * Math.pow(b, v) - a * Math.pow(b, u)) / (v - u) * 10) / 10; c = Math.round((a * Math.pow(b, u) - mm * u) * 10) / 10 + rng.pick([0.3, 0.5, 1, 0]);
        g = (x) => a * Math.pow(b, x) - mm * x - c; x1 = newton2(g, -6); x2 = newton2(g, 9); }
      while (!(Math.abs(g(x1)) < 1e-9 && Math.abs(g(x2)) < 1e-9 && x2 - x1 > 1.5) || x1 < -5 || x2 > 8 || mm <= 0 || c <= 0 || Number.isInteger(c) && Number.isInteger(mm) || [x1, x2].some((x) => Math.abs(x * 10 - Math.round(x * 10)) < 1e-3));
      const y2 = mm * x2 + c, tex = (lo, hi, t) => (t === "between" ? `$${sf(lo)} < x < ${sf(hi)}$` : t === "outside" ? `$x < ${sf(lo)}$ or $x > ${sf(hi)}$` : t === "above" ? `$x > ${sf(hi)}$` : `$x < ${sf(lo)}$`);
      return { params: { a, b, mm, c }, stem: `Consider the functions $f(x) = ${a === 1 ? "" : `${a} \\times `}${num(b)}^{x}$ and $g(x) = ${lin(mm, c)}$. The graphs of $f$ and $g$ intersect at two points.`, parts: [
        P("Find the $x$-coordinate of the point of intersection on the left.", 2, ans.sf(x1), [`Draw both graphs on the GDC and use the intersection tool.`, `The points are $${point(sf(x1), sf(mm * x1 + c))}$ and $${point(sf(x2), sf(y2))}$, so $x = ${sf(x1)}$.`]),
        P("Find the $x$-coordinate of the other point of intersection.", 2, ans.sf(x2), [`Move the cursor towards the second crossing and use the intersection tool again.`, `$x = ${sf(x2)}$`]),
        P("Find the $y$-coordinate of this second point.", 1, ans.sf(y2), [`$y = ${sf(y2)}$`]),
        P("For which values of $x$ is $f(x) < g(x)$?", 1, ans.choice(rng, { text: tex(x1, x2, "between"), value: "between" }, [
          { text: tex(x1, x2, "outside"), value: "outside", why: "Outside the two points of intersection the curve is above the line." },
          { text: tex(x1, x2, "above"), value: "above", why: "For large $x$ the exponential curve is above the line." }, { text: tex(x1, x2, "below"), value: "below", why: "On the far left the curve is above the line." }]), [
          `Between the two points of intersection the curve is below the line, so $f(x) < g(x)$ for $${sf(x1)} < x < ${sf(x2)}$.`])] };
    } });

  reg({ type: "fn-ai-gdc-intersection", unknown: "time-above-a-level", representation: "words", format: "value", levels: [4],
    syllabus: ["2.4"], skills: ["SL2.4.intersection", "SL2.4.interval-from-graph"], title: "For how long is a model above a given level?",
    build({ rng }) {
      let a, d, L, t1, t2, c;
      do { c = rng.pick([{ what: "The depth of water at the entrance to a harbour, $h$ metres,", t: "hours after midnight", need: "A ship can enter the harbour only when the depth is at least", u: "m", ask: "the ship can enter the harbour" },
        { what: "The height of a buoy above the sea bed, $h$ metres,", t: "hours after midnight", need: "A warning light on the buoy is visible from the shore when the height is at least", u: "m", ask: "the warning light is visible" }]);
        a = rng.int(12, 36) / 10; d = rng.int(45, 90) / 10; L = Math.round((d + a * rng.pick([0.2, 0.35, 0.5, 0.65, 0.8])) * 10) / 10; t1 = Math.asin((L - d) / a) * 6 / Math.PI; t2 = 6 - t1; }
      while (L <= d || Math.abs(t1 * 10 - Math.round(t1 * 10)) < 1e-3);
      return { params: { a, d, L }, stem: `${c.what} $t$ ${c.t} is modelled by $h(t) = ${num(a)}\\sin(30t^\\circ) + ${num(d)}$, for $0 \\le t \\le 12$. ${c.need} $${num(L)}\\text{ ${c.u}}$.`, parts: [
        P(`Find the first value of $t$ at which $h(t) = ${num(L)}$.`, 2, ans.sf(t1), [`Draw $y = h(t)$ and $y = ${num(L)}$ on the GDC (degree mode) for $0 \\le t \\le 12$ and find where they meet.`, `The first intersection is at $t = ${sf(t1)}$.`]),
        P(`Find the second value of $t$ at which $h(t) = ${num(L)}$.`, 2, ans.sf(t2), [`The second intersection is at $t = ${sf(t2)}$.`]),
        P(`Find the length of time, in hours, for which ${c.ask} during these $12$ hours.`, 1, ans.sf(t2 - t1), [`The graph is above the line between the two intersections: $${dp(t2, 3)} - ${dp(t1, 3)} = ${sf(t2 - t1)}$ hours.`])] };
    } });

  // =====================================================================================
  // 3.4 arc length and sector area (degrees)
  // =====================================================================================
  const pol = (r, t) => [r * Math.cos(t * Math.PI / 180), r * Math.sin(t * Math.PI / 180)];
  const figOk = (g) => [[420, 320], [320, 240], [260, 200]].every(([w, h]) => E.graph.figureInfo(g, { width: w, height: h }).problems.length === 0);
  // A sector OAB with its line of symmetry vertical. o.chord draws [AB], o.shade shades the segment, o.inner draws a second arc of that radius.
  function sectorFig(r, th, o) {
    o = o || {};
    const from = 90 - th / 2, to = 90 + th / 2, O = [0, 0], A = pol(r, from), B = pol(r, to);
    const shapes = [{ type: "sector", centre: O, radius: r, from, to }];
    if (o.shade) shapes.push({ type: "segment", centre: O, radius: r, from, to, fill: true, stroke: false });
    if (o.chord) shapes.push({ type: "line", from: A, to: B });
    shapes.push({ type: "line", from: O, to: A, label: o.radius });
    [O, A, B].forEach((p, i) => shapes.push({ type: "point", at: p, label: "OAB"[i], dot: false }));
    shapes.push({ type: "angle", at: O, from: A, to: B, label: `${th}°` });
    return { shapes, alt: o.alt || "A sector of a circle with centre O, with its radius and angle marked" };
  }
  function sectorSit(rng) {
    let r, th, g;
    do { r = rng.int(4, 18); th = 5 * rng.int(6, 30); g = sectorFig(r, th, { radius: `${r} cm` }); } while (!figOk(g));
    return { r, th };
  }
  const SEC = { type: "t3-ai-sector-degrees", representation: "diagram", format: "value", syllabus: ["3.4"] };
  const secStem = (s) => `The diagram shows a sector $\\mathrm{OAB}$ of a circle with centre $\\mathrm{O}$ and radius $${s.r}\\text{ cm}$. The angle $\\mathrm{A\\hat{O}B}$ is $${deg(s.th)}$.`;
  const arcOf = (s) => s.th / 360 * 2 * Math.PI * s.r, areaOf = (s) => s.th / 360 * Math.PI * s.r * s.r;
  reg({ ...SEC, unknown: "arc-length", levels: [1], skills: ["AI-SL3.4.arc-length"], title: "Arc length of a sector", situationKey: "ai-sector", situation: sectorSit,
    build({ sit: s }) {
      return { params: { r: s.r, th: s.th }, stem: secStem(s), graph: sectorFig(s.r, s.th, { radius: `${s.r} cm` }), parts: [
        P("Find the length of the arc $\\mathrm{AB}$, in centimetres.", 2, ans.sf(arcOf(s)), [`Arc length $= \\dfrac{\\theta}{360} \\times 2\\pi r = \\dfrac{${s.th}}{360} \\times 2\\pi${br(s.r)}$`, `Arc length $= ${sf(arcOf(s))}$`])] };
    } });
  reg({ ...SEC, unknown: "area-and-perimeter", levels: [2], skills: ["AI-SL3.4.sector-area", "AI-SL3.4.arc-length"], title: "Area and perimeter of a sector", situationKey: "ai-sector", situation: sectorSit,
    build({ sit: s }) {
      const arc = arcOf(s);
      return { params: { r: s.r, th: s.th }, stem: secStem(s), graph: sectorFig(s.r, s.th, { radius: `${s.r} cm` }), parts: [
        P("Find the area of the sector, in $\\text{cm}^{2}$.", 2, ans.sf(areaOf(s)), [`Area $= \\dfrac{\\theta}{360} \\times \\pi r^{2} = \\dfrac{${s.th}}{360} \\times \\pi${br(s.r)}^{2}$`, `Area $= ${sf(areaOf(s))}$`]),
        P("Find the perimeter of the sector, in centimetres.", 2, ans.sf(arc + 2 * s.r), [`Arc length $= \\dfrac{${s.th}}{360} \\times 2\\pi${br(s.r)} = ${sf(arc, 4)}$`, `The perimeter is the arc and two radii: $${sf(arc, 4)} + 2${br(s.r)} = ${sf(arc + 2 * s.r)}$`])] };
    } });
  reg({ ...SEC, unknown: "exact-arc-area-perimeter", levels: [3], calculator: false, skills: ["AI-SL3.4.arc-length", "AI-SL3.4.sector-area"], title: "Exact arc length, area and perimeter of a sector",
    build({ rng }) {
      let r, th, g;
      do { th = rng.pick([30, 40, 45, 60, 72, 90, 120, 135, 150]); r = rng.pick([2, 3, 4, 5, 6, 8, 9, 10, 12]); g = sectorFig(r, th, { radius: `${r} cm` }); } while ((r * th) % 90 !== 0 || (r * r * th) % 180 !== 0 || !figOk(g));
      const s = { r, th }, arcT = fmt.piFrac(r * th, 180), areaT = fmt.piFrac(r * r * th, 360), fr = frac(th, 360);
      return { params: { r, th }, stem: `${secStem(s)} Give each answer as an exact multiple of $\\pi$, or in terms of $\\pi$.`, graph: g, parts: [
        P("Find the length of the arc $\\mathrm{AB}$, in centimetres.", 2, ans.exact(arcOf(s), arcT), [`The sector is $\\dfrac{${th}}{360} = ${fr}$ of the circle.`, `Arc length $= ${fr} \\times 2\\pi${br(r)} = ${arcT}$`]),
        P("Find the area of the sector, in $\\text{cm}^{2}$.", 2, ans.exact(areaOf(s), areaT), [`Area $= ${fr} \\times \\pi${br(r)}^{2}$`, `Area $= ${areaT}$`]),
        P("Find the perimeter of the sector, in centimetres.", 1, ans.exact(arcOf(s) + 2 * r, `${2 * r} + ${arcT}`), [`Add the two radii to the arc: $${2 * r} + ${arcT}$`])] };
    } });
  reg({ ...SEC, unknown: "segment-area-and-perimeter", levels: [4], skills: ["AI-SL3.4.composite-region", "AI-SL3.4.sector-area", "AI-SL3.4.arc-length"], title: "A segment: sector minus triangle, and its perimeter",
    build({ rng }) {
      let r, th, g;
      do { r = rng.int(5, 18); th = rng.int(40, 150); g = sectorFig(r, th, { radius: `${r} cm`, chord: true, shade: true, alt: "A sector of a circle with centre O. The chord AB is drawn and the region between the chord and the arc is shaded." }); } while (!figOk(g) || th % 10 === 0);
      const s = { r, th }, sec = areaOf(s), tri = 0.5 * r * r * Math.sin(th * Math.PI / 180), chord = 2 * r * Math.sin(th * Math.PI / 360), arc = arcOf(s);
      return { params: { r, th }, stem: `${secStem(s)} The chord $[\\mathrm{AB}]$ is drawn, and the region between the chord and the arc is shaded.`, graph: g, parts: [
        P("Find the area of the sector $\\mathrm{OAB}$, in $\\text{cm}^{2}$.", 2, ans.sf(sec), [`Area $= \\dfrac{${th}}{360} \\times \\pi${br(r)}^{2}$`, `Area $= ${sf(sec)}$`]),
        P("Find the area of triangle $\\mathrm{OAB}$, in $\\text{cm}^{2}$.", 2, ans.sf(tri), [`Area $= \\dfrac{1}{2}ab\\sin C = \\dfrac{1}{2}${br(r)}${br(r)}\\sin ${deg(th)}$`, `Area $= ${sf(tri)}$`]),
        P("Find the area of the shaded region, in $\\text{cm}^{2}$.", 1, ans.sf(sec - tri), [`Shaded area $=$ sector $-$ triangle $= ${sf(sec, 5)} - ${sf(tri, 5)} = ${sf(sec - tri)}$`]),
        P("Find the perimeter of the shaded region, in centimetres.", 2, ans.sf(arc + chord), [
          `Arc: $\\dfrac{${th}}{360} \\times 2\\pi${br(r)} = ${sf(arc, 4)}$`, `Chord, by the cosine rule: $\\mathrm{AB} = \\sqrt{${r}^{2} + ${r}^{2} - 2${br(r)}${br(r)}\\cos ${deg(th)}} = ${sf(chord, 4)}$`, `Perimeter $= ${sf(arc, 4)} + ${sf(chord, 4)} = ${sf(arc + chord)}$`])] };
    } });
  reg({ ...SEC, unknown: "area-swept-by-a-wiper", representation: "words", levels: [4], skills: ["AI-SL3.4.composite-region", "AI-SL3.4.sector-area", "AI-SL3.4.arc-length"], title: "The region between two arcs",
    build({ rng }) {
      const c = rng.pick([{ stem: (R, b, th) => `A windscreen wiper has an arm $${R}\\text{ cm}$ long. A rubber blade covers the outer $${b}\\text{ cm}$ of the arm. The arm turns through an angle of $${deg(th)}$`, a: "Find the area of glass cleaned by the blade", u: "cm", tip: "the tip of the arm", R: [38, 62], b: [24, 40] },
        { stem: (R, b, th) => `A garden sprinkler turns through an angle of $${deg(th)}$. It waters the ground between $${R - b}\\text{ m}$ and $${R}\\text{ m}$ from the sprinkler`, a: "Find the area of ground that is watered", u: "m", tip: "the outer edge of the watered region", R: [9, 20], b: [4, 8], arcq: true }]);
      const R = rng.int(c.R[0], c.R[1]), b = rng.int(c.b[0], Math.min(c.b[1], R - 2)), th = rng.int(70, 165), r = R - b;
      const big = th / 360 * Math.PI * R * R, small = th / 360 * Math.PI * r * r, arc = th / 360 * 2 * Math.PI * R;
      return { params: { R, r, th }, stem: `${c.stem(R, b, th)}.`, parts: [
        P(`${c.a}, in $\\text{${c.u}}^{2}$.`, 3, ans.sf(big - small), [`The region lies between a sector of radius $${R}$ and a sector of radius $${R} - ${b} = ${r}$.`,
          `Large sector: $\\dfrac{${th}}{360} \\times \\pi${br(R)}^{2} = ${sf(big, 5)}$ and small sector: $\\dfrac{${th}}{360} \\times \\pi${br(r)}^{2} = ${sf(small, 5)}$`, `Area $= ${sf(big, 5)} - ${sf(small, 5)} = ${sf(big - small)}$`]),
        P(c.arcq ? `Find the length of the outer curved edge of the watered region, in metres.` : `Find the distance moved by ${c.tip} in one sweep, in centimetres.`, 2, ans.sf(arc), [`It is an arc of radius $${R}$: $\\dfrac{${th}}{360} \\times 2\\pi${br(R)}$`, `Length $= ${sf(arc)}$`])] };
    } });
  reg({ ...SEC, unknown: "angle-from-arc-length", representation: "words", levels: [2], skills: ["AI-SL3.4.angle-of-turn", "AI-SL3.4.arc-length", "AI-SL3.4.sector-area"], title: "Find the angle of a sector from its arc length",
    build({ rng }) {
      const c = rng.pick([{ stem: (r, l) => `A pendulum is $${r}\\text{ cm}$ long. In one swing its end moves along an arc of length $${l}\\text{ cm}$`, ang: "Find the angle through which the pendulum turns in one swing, in degrees.", area: "Find the area swept out by the pendulum in one swing, in $\\text{cm}^{2}$.", r: [40, 120] },
        { stem: (r, l) => `A gate $${r}\\text{ cm}$ wide is pushed open. Its free end moves along an arc of length $${l}\\text{ cm}$`, ang: "Find the angle through which the gate turns, in degrees.", area: "Find the area of ground the gate passes over, in $\\text{cm}^{2}$.", r: [80, 150] }]);
      const r = rng.int(c.r[0], c.r[1]), l = Math.round(r * rng.int(40, 190) / 100), th = l / (2 * Math.PI * r) * 360, area = th / 360 * Math.PI * r * r;
      return { params: { r, l }, stem: `${c.stem(r, l)}.`, parts: [
        P(c.ang, 2, ans.sf(th), [`$\\dfrac{\\theta}{360} \\times 2\\pi${br(r)} = ${l}$`, `$\\theta = \\dfrac{${l} \\times 360}{2\\pi${br(r)}} = ${sf(th)}$`]),
        P(c.area, 1, ans.sf(area), [`Area $= \\dfrac{${sf(th, 5)}}{360} \\times \\pi${br(r)}^{2} = ${sf(area)}$`])] };
    } });

  // =====================================================================================
  // 3.5 perpendicular bisectors
  // =====================================================================================
  const PB = { type: "t3-ai-perpendicular-bisector", format: "value", syllabus: ["3.5"], calculator: false };
  const pt = (name, p) => `$\\mathrm{${name}}${point(p[0], p[1])}$`;
  reg({ ...PB, unknown: "bisector-by-inspection", representation: "words", format: "mcq", levels: [1], skills: ["AI-SL3.5.by-inspection"], title: "A perpendicular bisector by inspection",
    build({ rng }) {
      let a, b1, b2;
      do { a = rng.int(-6, 9); b1 = rng.int(-8, 8); b2 = b1 + 2 * rng.int(1, 6); } while ((b1 + b2) / 2 === a || (b2 - b1) / 2 === (b1 + b2) / 2 || (b1 + b2) / 2 === 0 && a === 0);
      const vert = rng.bool(), mid = (b1 + b2) / 2, A = vert ? [a, b1] : [b1, a], B = vert ? [a, b2] : [b2, a], v = vert ? "y" : "x", w = vert ? "x" : "y";
      const o = (letter, val, value, why) => ({ text: `$${letter} = ${val}$`, value, why });
      return { params: { A, B }, stem: `Two wells are at the points ${pt("A", A)} and ${pt("B", B)}.`, parts: [
        P("Which is the equation of the perpendicular bisector of $[\\mathrm{AB}]$?", 1, ans.choice(rng, o(v, mid, [v, mid]), [
          o(w, mid, [w, mid], `The points have the same $${w}$-coordinate, so $[\\mathrm{AB}]$ is ${vert ? "vertical" : "horizontal"} and its bisector is ${vert ? "horizontal" : "vertical"}.`),
          o(w, a, [w, a], "This is the line through the two points, not their perpendicular bisector."),
          o(v, (b2 - b1) / 2, [v, (b2 - b1) / 2], "Use the midpoint: half the sum of the coordinates, not half their difference.")]), [
          `The points have the same $${w}$-coordinate, so $[\\mathrm{AB}]$ is ${vert ? "vertical" : "horizontal"} and its perpendicular bisector is ${vert ? "horizontal" : "vertical"}.`,
          `It passes through the midpoint $${vert ? point(a, mid) : point(mid, a)}$, so its equation is $${v} = ${mid}$.`])] };
    } });
  function pbSit(rng) {
    let A, B, dx, dy;
    do { A = [rng.int(-6, 6), rng.int(-6, 6)]; dx = 2 * rng.nonzero(-4, 4); dy = 2 * rng.nonzero(-4, 4); B = [A[0] + dx, A[1] + dy]; } while (Math.abs(dx) === Math.abs(dy) || Math.abs(B[0]) > 9 || Math.abs(B[1]) > 9);
    return { A, B };
  }
  reg({ ...PB, unknown: "gradient-and-intercept", representation: "words", levels: [2], skills: ["AI-SL3.5.bisector-gradient", "AI-SL3.5.bisector-equation"], title: "Gradient and equation of a perpendicular bisector", situationKey: "ai-pb", situation: pbSit,
    build({ sit: { A, B } }) {
      const dx = B[0] - A[0], dy = B[1] - A[1], M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], mAB = fmt.Q(dy, dx), mp = fmt.Q(-dx, dy), c = fmt.rat.sub(M[1], fmt.rat.mul(mp, M[0]));
      return { params: { A, B }, stem: `Consider the points ${pt("A", A)} and ${pt("B", B)}.`, parts: [
        P("Find the gradient of the line $(\\mathrm{AB})$.", 1, ans.frac(mAB.n, mAB.d), [`$m = \\dfrac{${B[1]} - ${paren(A[1])}}{${B[0]} - ${paren(A[0])}} = ${frac(dy, dx)}$`]),
        P("Find the gradient of the perpendicular bisector of $[\\mathrm{AB}]$.", 1, ans.frac(mp.n, mp.d), [`Perpendicular gradients multiply to $-1$, so the gradient is the negative reciprocal of $${frac(dy, dx)}$: $${frac(-dx, dy)}$.`]),
        P("The perpendicular bisector has equation $y = mx + c$. Find the value of $c$.", 2, ans.frac(c.n, c.d), [
          `The bisector passes through the midpoint of $[\\mathrm{AB}]$: $\\left(\\dfrac{${A[0]} + ${paren(B[0])}}{2},\\, \\dfrac{${A[1]} + ${paren(B[1])}}{2}\\right) = ${point(M[0], M[1])}$`,
          `$${M[1]} = ${frac(-dx, dy)} \\times ${paren(M[0])} + c$`, `$c = ${fmt.rat.tex(c)}$`])] };
    } });
  reg({ ...PB, unknown: "bisector-and-nearer-point", representation: "words", levels: [3], skills: ["AI-SL3.5.bisector-equation", "AI-SL3.5.bisector-gradient"], title: "A perpendicular bisector as the boundary between two sites",
    build({ rng }) {
      const c = rng.pick([{ a: "two fire stations", one: "station", who: "A house", verb: "is at" }, { a: "two mobile phone masts", one: "mast", who: "A hiker", verb: "is standing at" }, { a: "two water pumps in a village", one: "pump", who: "A farm", verb: "is at" }]);
      let A, B, C, dx, dy, dA, dB;
      do { A = [rng.int(0, 8), rng.int(0, 8)]; dx = rng.nonzero(-7, 7); dy = rng.nonzero(-7, 7); B = [A[0] + dx, A[1] + dy]; C = [rng.int(0, 12), rng.int(0, 12)];
        dA = (C[0] - A[0]) ** 2 + (C[1] - A[1]) ** 2; dB = (C[0] - B[0]) ** 2 + (C[1] - B[1]) ** 2; }
      while (Math.abs(dx) === Math.abs(dy) || B[0] < 0 || B[1] < 0 || B[0] > 12 || B[1] > 12 || Math.abs(dA - dB) > 12 || dA === 0 || dB === 0 || (dx % 2 === 0 && dy % 2 === 0));
      const M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], mp = fmt.Q(-dx, dy), cc = fmt.rat.sub(fmt.Q(A[1] + B[1], 2), fmt.rat.mul(mp, fmt.Q(A[0] + B[0], 2)));
      const yOn = fmt.rat.add(fmt.rat.mul(mp, C[0]), cc), res = dA < dB ? "A" : dA > dB ? "B" : "same";
      const texts = { A: `$\\mathrm{A}$ is closer.`, B: `$\\mathrm{B}$ is closer.`, same: `$\\mathrm{A}$ and $\\mathrm{B}$ are the same distance from $\\mathrm{C}$.`, none: "It cannot be decided without the equation of the line through both points." };
      return { params: { A, B, C }, stem: `A map shows ${c.a} at the points ${pt("A", A)} and ${pt("B", B)}. The perpendicular bisector of $[\\mathrm{AB}]$ is the boundary between the places that are closer to $\\mathrm{A}$ and those that are closer to $\\mathrm{B}$.`, parts: [
        P("Find the $x$-coordinate of the midpoint of $[\\mathrm{AB}]$.", 1, ans.dec(M[0]), [`$\\dfrac{${A[0]} + ${B[0]}}{2} = ${num(M[0])}$`]),
        P("Find the $y$-coordinate of the midpoint of $[\\mathrm{AB}]$.", 1, ans.dec(M[1]), [`$\\dfrac{${A[1]} + ${B[1]}}{2} = ${num(M[1])}$`]),
        P("Find the gradient of the perpendicular bisector of $[\\mathrm{AB}]$.", 1, ans.frac(mp.n, mp.d), [`The gradient of $(\\mathrm{AB})$ is $\\dfrac{${B[1]} - ${A[1]}}{${B[0]} - ${A[0]}} = ${frac(dy, dx)}$.`, `The perpendicular gradient is its negative reciprocal: $${frac(-dx, dy)}$.`]),
        P("The perpendicular bisector has equation $y = mx + c$. Find the value of $c$.", 2, ans.frac(cc.n, cc.d), [
          `It passes through the midpoint $${point(M[0], M[1])}$: $${num(M[1])} = ${frac(-dx, dy)} \\times ${num(M[0])} + c$`, `$c = ${fmt.rat.tex(cc)}$`]),
        P(`${c.who} ${c.verb} the point ${pt("C", C)}. Which ${c.one} is closer to $\\mathrm{C}$?`, 1, ans.choice(rng, { text: texts[res], value: res }, ["A", "B", "same", "none"].filter((k) => k !== res).map((k) => ({ text: texts[k], value: k,
          why: k === "none" ? "Compare the distances, or see which side of the bisector the point is on." : "Compare $\\mathrm{AC}^{2}$ with $\\mathrm{BC}^{2}$." }))), [
          `$\\mathrm{AC}^{2} = ${paren(C[0] - A[0])}^{2} + ${paren(C[1] - A[1])}^{2} = ${dA}$ and $\\mathrm{BC}^{2} = ${paren(C[0] - B[0])}^{2} + ${paren(C[1] - B[1])}^{2} = ${dB}$`,
          res === "same" ? `The distances are equal, so $\\mathrm{C}$ is on the bisector: at $x = ${C[0]}$ the bisector has $y = ${fmt.rat.tex(yOn)}$.` : `$${Math.min(dA, dB)} < ${Math.max(dA, dB)}$, so $\\mathrm{C}$ is closer to $\\mathrm{${res}}$.`])] };
    } });
  reg({ ...PB, unknown: "from-line-and-midpoint", representation: "equation", levels: [2], skills: ["AI-SL3.5.bisector-gradient", "AI-SL3.5.bisector-equation"], title: "A perpendicular bisector from the line and the midpoint",
    build({ rng }) {
      let p, q, a, b, k;
      do { p = rng.nonzero(-5, 5); q = rng.pick([1, 2, 3, 4, 5]); a = q * rng.int(-3, 3); b = rng.int(-7, 9); k = b - p * a / q; } while (fmt.gcd(p, q) !== 1 || a === 0);
      const mp = fmt.Q(-q, p), c = fmt.rat.sub(b, fmt.rat.mul(mp, a)), mt = frac(p, q);
      return { params: { p, q, a, b }, stem: `The points $\\mathrm{A}$ and $\\mathrm{B}$ lie on the line $y = ${expr([[fmt.Q(p, q), "x"], [k, ""]])}$. The midpoint of $[\\mathrm{AB}]$ is $\\mathrm{M}${point(a, b)}$.`, parts: [
        P("Write down the gradient of the perpendicular bisector of $[\\mathrm{AB}]$.", 1, ans.frac(mp.n, mp.d), [`The line has gradient $${mt}$. The perpendicular gradient is its negative reciprocal: $${frac(-q, p)}$.`]),
        P("The perpendicular bisector has equation $y = mx + c$. Find the value of $c$.", 2, ans.frac(c.n, c.d), [`The bisector passes through $\\mathrm{M}$: $${b} = ${frac(-q, p)} \\times ${paren(a)} + c$`, `$c = ${fmt.rat.tex(c)}$`])] };
    } });

  // =====================================================================================
  // 3.6 Voronoi diagrams
  // =====================================================================================
  const VW = 12, VH = 9, d2 = (p, q) => (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2;
  // The edges of the Voronoi diagram of the sites inside the window: for each pair, the part of their bisector that no other site is closer to.
  function voronoiEdges(sites) {
    const edges = [];
    for (let i = 0; i < sites.length; i++) for (let j = i + 1; j < sites.length; j++) {
      const A = sites[i], B = sites[j], mid = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], dir = [-(B[1] - A[1]), B[0] - A[0]];
      let lo = -1e9, hi = 1e9;
      const clip = (a, b) => { if (Math.abs(a) < 1e-12) { if (b < -1e-12) { lo = 1; hi = 0; } } else if (a > 0) hi = Math.min(hi, b / a); else lo = Math.max(lo, b / a); };   // a t <= b
      clip(dir[0], VW - mid[0]); clip(-dir[0], mid[0]); clip(dir[1], VH - mid[1]); clip(-dir[1], mid[1]);
      sites.forEach((K, k) => { if (k !== i && k !== j) { const n = [K[0] - A[0], K[1] - A[1]]; clip(2 * (dir[0] * n[0] + dir[1] * n[1]), d2(K, [0, 0]) - d2(A, [0, 0]) - 2 * (mid[0] * n[0] + mid[1] * n[1])); } });
      if (hi - lo > 1e-6) edges.push({ i, j, p: [mid[0] + lo * dir[0], mid[1] + lo * dir[1]], q: [mid[0] + hi * dir[0], mid[1] + hi * dir[1]] });
    }
    return edges;
  }
  // The points equidistant from three sites that no other site is closer to (the vertices of the diagram).
  function voronoiVertices(sites) {
    const out = [];
    for (let i = 0; i < sites.length; i++) for (let j = i + 1; j < sites.length; j++) for (let k = j + 1; k < sites.length; k++) {
      const [A, B, C] = [sites[i], sites[j], sites[k]], D = 2 * (A[0] * (B[1] - C[1]) + B[0] * (C[1] - A[1]) + C[0] * (A[1] - B[1]));
      if (D === 0) continue;
      const a2 = d2(A, [0, 0]), b2 = d2(B, [0, 0]), c2 = d2(C, [0, 0]);
      const V = [(a2 * (B[1] - C[1]) + b2 * (C[1] - A[1]) + c2 * (A[1] - B[1])) / D, (a2 * (C[0] - B[0]) + b2 * (A[0] - C[0]) + c2 * (B[0] - A[0])) / D], rr = d2(V, A);
      if (sites.every((S) => d2(V, S) >= rr - 1e-9)) out.push({ at: V, sites: [i, j, k], r: Math.sqrt(rr) });
    }
    return out;
  }
  const inWin = (p, pad) => p[0] > pad && p[0] < VW - pad && p[1] > pad && p[1] < VH - pad;
  function voronoiGraph(sites, extra) {
    const functions = voronoiEdges(sites).map((e) => { const pts = [e.p, e.q].sort((u, v) => u[0] - v[0]); return { fn: { type: "pwl", points: pts }, domain: [pts[0][0], pts[1][0]] }; });
    return { x: [0, VW], y: [0, VH], xStep: 1, yStep: 1, functions, points: sites.map((s, i) => ({ x: s[0], y: s[1], label: "ABCDE"[i] })).concat(extra || []),
      alt: `A Voronoi diagram with ${sites.length} sites on a coordinate grid` };
  }
  // Sites on grid points, no two with the same y-coordinate (so no edge is vertical), well apart, every cell reaching the window.
  function voronoiSites(rng, n) {
    let sites;
    do { sites = []; for (let i = 0; i < n; i++) sites.push([rng.int(1, VW - 1), rng.int(1, VH - 1)]); }
    while (sites.some((s, i) => sites.some((t, j) => j > i && (s[1] === t[1] || d2(s, t) < 10))) || voronoiEdges(sites).some((e) => Math.abs(e.p[0] - e.q[0]) < 0.25 || d2(e.p, e.q) < 1));
    return sites.sort((u, v) => u[0] - v[0] || u[1] - v[1]);
  }
  const VOR = [{ sites: "hospitals", one: "hospital", what: "An accident happens at the point", x: "X", q: "Which hospital is closest to the accident?" },
    { sites: "fire stations", one: "fire station", what: "A fire is reported at the point", x: "X", q: "Which fire station is closest to the fire?" },
    { sites: "supermarkets", one: "supermarket", what: "A family lives at the point", x: "X", q: "Which supermarket is closest to the family's home?" }];
  const siteList = (sites) => fmt.list(sites.map((s, i) => pt("ABCDE"[i], s)));
  function nearSit(rng) {
    let sites, X, ds, order;
    do { sites = voronoiSites(rng, 4); X = [rng.int(1, VW - 1), rng.int(1, VH - 1)]; ds = sites.map((s) => Math.sqrt(d2(s, X))); order = ds.map((d, i) => i).sort((u, v) => ds[u] - ds[v]); }
    while (ds[order[0]] < 1.2 || ds[order[1]] - ds[order[0]] < 0.5 || ds[order[1]] - ds[order[0]] > 2.2 || sites.some((s) => Math.abs(s[0] - X[0]) + Math.abs(s[1] - X[1]) < 2));
    return { sites, X, vals: rng.shuffle([rng.int(12, 19), rng.int(20, 27), rng.int(28, 36), rng.int(37, 48)]) };
  }
  const nearOptions = (rng, sites, X, why) => { const ds = sites.map((s) => d2(s, X)), best = ds.indexOf(Math.min(...ds)), o = (i) => ({ text: `$\\mathrm{${"ABCD"[i]}}$`, value: i, why: i === best ? undefined : why });
    return ans.choice(rng, o(best), [0, 1, 2, 3].filter((i) => i !== best).map(o)); };
  const V36 = { type: "t3-ai-voronoi", representation: "graph", syllabus: ["3.6"] };
  reg({ ...V36, unknown: "nearest-site", format: "mcq", levels: [1], calculator: false, skills: ["AI-SL3.6.nearest-site"], title: "Use a Voronoi diagram to find the nearest site", situationKey: "ai-vor-near", situation: nearSit,
    build({ rng, sit: { sites, X } }) {
      const c = rng.pick(VOR), ds = sites.map((s) => d2(s, X)), best = ds.indexOf(Math.min(...ds)), L = "ABCD"[best];
      return { params: { sites, X }, stem: `The Voronoi diagram shows four ${c.sites} at ${siteList(sites)}. ${c.what} $\\mathrm{X}${point(X[0], X[1])}$, which is marked on the diagram.`,
        graph: voronoiGraph(sites, [{ x: X[0], y: X[1], label: "X", open: true }]), parts: [
          P(c.q, 1, nearOptions(rng, sites, X, "Every point inside a cell is closer to that cell's site than to any other site. Find the cell that contains the point."), [
            `$\\mathrm{X}$ lies inside the cell that contains $\\mathrm{${L}}$, and every point of a cell is closest to the site of that cell.`, `So the closest ${c.one} is $\\mathrm{${L}}$.`])] };
    } });
  reg({ ...V36, unknown: "nearest-neighbour-interpolation", format: "value", levels: [2], skills: ["AI-SL3.6.nearest-site", "AI-SL3.6.interpolation"], title: "Nearest neighbour interpolation on a Voronoi diagram", situationKey: "ai-vor-near", situation: nearSit,
    build({ rng, sit: { sites, X, vals } }) {
      const ds = sites.map((s) => d2(s, X)), best = ds.indexOf(Math.min(...ds)), L = "ABCD"[best], dist = Math.sqrt(ds[best]);
      return { params: { sites, X, vals }, stem: `The Voronoi diagram shows four weather stations at ${siteList(sites)}, where one unit represents one kilometre. The table shows the rainfall recorded at each station on one day. A farm is at the point $\\mathrm{X}${point(X[0], X[1])}$, which is marked on the diagram.`,
        table: { head: ["Station", "$\\mathrm{A}$", "$\\mathrm{B}$", "$\\mathrm{C}$", "$\\mathrm{D}$"], rows: [["Rainfall (mm)"].concat(vals.map((v) => m(v)))] },
        graph: voronoiGraph(sites, [{ x: X[0], y: X[1], label: "X", open: true }]), parts: [
          P("Which weather station is closest to the farm?", 1, nearOptions(rng, sites, X, "Find the cell that contains the farm: every point of a cell is closest to that cell's site."), [`$\\mathrm{X}$ lies inside the cell of $\\mathrm{${L}}$, so the closest station is $\\mathrm{${L}}$.`]),
          P("Use nearest neighbour interpolation to estimate the rainfall at the farm, in millimetres.", 1, ans.int(vals[best]), [`Nearest neighbour interpolation gives every point in a cell the value at its site: $${vals[best]}\\text{ mm}$, the rainfall at $\\mathrm{${L}}$.`]),
          P("Find the distance from the farm to this station, in kilometres.", 1, ans.sf(dist), [`$\\sqrt{${paren(X[0] - sites[best][0])}^{2} + ${paren(X[1] - sites[best][1])}^{2}} = \\sqrt{${ds[best]}} = ${sf(dist)}$`])] };
    } });
  // every angle of the triangle is clearly less than a right angle, so the circumcentre is well inside it
  const acute = (t) => [0, 1, 2].every((i) => { const a = t[i], b = t[(i + 1) % 3], c = t[(i + 2) % 3], u = [b[0] - a[0], b[1] - a[1]], v = [c[0] - a[0], c[1] - a[1]];
    return (u[0] * v[0] + u[1] * v[1]) / Math.sqrt(d2(a, b) * d2(a, c)) > 0.2; });
  const edgeEq = (A, B) => { let a = 2 * (B[0] - A[0]), b = 2 * (B[1] - A[1]), c = d2(B, [0, 0]) - d2(A, [0, 0]); const g = fmt.gcd(fmt.gcd(a, b), c) * (a < 0 || (a === 0 && b < 0) ? -1 : 1); a /= g; b /= g; c /= g; return { a, b, c, tex: `${expr([[a, "x"], [b, "y"]])} = ${c}` }; };
  reg({ ...V36, unknown: "vertex-equidistant-from-three-sites", format: "value", levels: [4], skills: ["AI-SL3.6.vertex", "AI-SL3.6.toxic-waste-dump"], title: "The vertex of a Voronoi diagram: equidistant from three sites",
    build({ rng }) {
      let sites, vs, V;
      do { sites = voronoiSites(rng, 3); vs = voronoiVertices(sites); V = vs.length === 1 ? vs[0] : null; }
      while (!V || !inWin(V.at, 1) || V.r < 2.5 || !acute(sites) || voronoiEdges(sites).length !== 3 || V.at.some((v) => Math.abs(v * 10 - Math.round(v * 10)) < 1e-6));
      const e1 = edgeEq(sites[0], sites[1]), e2 = edgeEq(sites[1], sites[2]);
      const c = rng.pick([{ a: "three towns", thing: "A waste incinerator", must: "as far as possible from all three towns" }, { a: "three villages", thing: "A wind turbine", must: "as far as possible from all three villages" }, { a: "three schools", thing: "A recycling plant", must: "as far as possible from all three schools" }]);
      const texts = { vertex: "It is the same distance from all three sites, and any move away from it brings it closer to at least one of them.", edge: "It lies on an edge, so it is the same distance from exactly two sites.", centre: "It is the mean of the coordinates of the three sites.", cell: "It lies inside the largest cell." };
      return { params: { sites }, stem: `The Voronoi diagram shows ${c.a} at ${siteList(sites)}, where one unit represents one kilometre. The edge between the cells of $\\mathrm{A}$ and $\\mathrm{B}$ has equation $${e1.tex}$, and the edge between the cells of $\\mathrm{B}$ and $\\mathrm{C}$ has equation $${e2.tex}$. ${c.thing} is to be built inside the triangle $\\mathrm{ABC}$, ${c.must}. It will be placed at the vertex $\\mathrm{V}$ where the three edges meet.`,
        graph: voronoiGraph(sites), parts: [
          P("Find the $x$-coordinate of $\\mathrm{V}$.", 2, ans.sf(V.at[0]), [`$\\mathrm{V}$ lies on both edges, so solve $${e1.tex}$ and $${e2.tex}$ simultaneously with the GDC.`, `$x = ${sf(V.at[0])}$ and $y = ${sf(V.at[1])}$`]),
          P("Find the $y$-coordinate of $\\mathrm{V}$.", 1, ans.sf(V.at[1]), [`From the same solution, $y = ${sf(V.at[1])}$.`]),
          P("Find the distance from $\\mathrm{V}$ to each of the three sites, in kilometres.", 2, ans.sf(V.r), [
            `Use the distance from $\\mathrm{V}$ to $\\mathrm{A}${point(sites[0][0], sites[0][1])}$ with the unrounded coordinates of $\\mathrm{V}$.`, `$\\sqrt{(${sf(V.at[0], 5)} - ${sites[0][0]})^{2} + (${sf(V.at[1], 5)} - ${sites[0][1]})^{2}} = ${sf(V.r)}$`]),
          P("Why is $\\mathrm{V}$ the best position?", 1, ans.choice(rng, { text: texts.vertex, value: "vertex" }, [
            { text: texts.edge, value: "edge", why: "Three edges meet at a vertex, so it is equidistant from three sites, not two." }, { text: texts.centre, value: "centre", why: "The vertex is where the perpendicular bisectors meet. It is not the mean of the coordinates." },
            { text: texts.cell, value: "cell", why: "A vertex is on the boundary of three cells, not inside one." }]), [`A vertex of a Voronoi diagram is equidistant from the three nearest sites. Moving away from it in any direction brings the point closer to one of them.`])] };
    } });
  reg({ ...V36, unknown: "compare-two-vertices", format: "value", levels: [4], skills: ["AI-SL3.6.toxic-waste-dump", "AI-SL3.6.vertex", "AI-SL3.6.interpret-model"], title: "The toxic waste dump problem: compare the vertices",
    build({ rng }) {
      let sites, vs, tries = 0;
      const lattice = (v) => v.at.every((t) => Math.abs(t * 2 - Math.round(t * 2)) < 1e-9);
      do { sites = voronoiSites(rng, 4); vs = voronoiVertices(sites).filter((v) => inWin(v.at, 0.4)); tries++; }
      while (vs.length !== 2 || !vs.every(lattice) || Math.abs(vs[0].r - vs[1].r) < 0.15 || vs.some((v) => v.r < 1.8) || d2(vs[0].at, vs[1].at) < 2.2 || vs.some((v) => sites.some((s) => Math.abs(s[0] - v.at[0]) < 0.9 && Math.abs(s[1] - v.at[1]) < 0.9)));
      vs.sort((u, v) => u.at[0] - v.at[0] || u.at[1] - v.at[1]);
      const names = ["V", "W"], best = vs[0].r > vs[1].r ? 0 : 1, c = rng.pick([{ a: "four towns", thing: "A landfill site" }, { a: "four villages", thing: "A noisy factory" }, { a: "four holiday resorts", thing: "A waste treatment plant" }]);
      const three = (v) => v.sites.map((i) => `\\mathrm{${"ABCD"[i]}}`).join(",\\ "), dist = (v, k) => { const s = sites[v.sites[0]]; return `$\\sqrt{${br(v.at[0] - s[0])}^{2} + ${br(v.at[1] - s[1])}^{2}} = ${sf(v.r)}$`; };
      const optText = (i, far) => `At $\\mathrm{${names[i]}}$, because its nearest ${far ? "sites are farther away than those of" : "sites are closer than those of"} $\\mathrm{${names[1 - i]}}$.`;
      return { params: { sites, verts: vs.map((v) => v.at) }, stem: `The Voronoi diagram shows ${c.a} at ${siteList(sites)}, where one unit represents one kilometre. Two vertices of the diagram are $\\mathrm{V}${point(vs[0].at[0], vs[0].at[1])}$ and $\\mathrm{W}${point(vs[1].at[0], vs[1].at[1])}$. ${c.thing} is to be built at one of these two vertices, as far as possible from the nearest site.`,
        graph: voronoiGraph(sites, vs.map((v, i) => ({ x: v.at[0], y: v.at[1], label: names[i], open: true }))), parts: [
          P("Find the distance from $\\mathrm{V}$ to its nearest sites, in kilometres.", 2, ans.sf(vs[0].r), [`$\\mathrm{V}$ is the same distance from $${three(vs[0])}$. Use $\\mathrm{${"ABCD"[vs[0].sites[0]]}}$:`, dist(vs[0])]),
          P("Find the distance from $\\mathrm{W}$ to its nearest sites, in kilometres.", 2, ans.sf(vs[1].r), [`$\\mathrm{W}$ is the same distance from $${three(vs[1])}$. Use $\\mathrm{${"ABCD"[vs[1].sites[0]]}}$:`, dist(vs[1])]),
          P("Where should it be built?", 1, ans.choice(rng, { text: optText(best, true), value: [best, "far"] }, [{ text: optText(1 - best, false), value: [1 - best, "near"], why: "The aim is to be as far as possible from the nearest site, so choose the larger distance." },
            { text: optText(1 - best, true), value: [1 - best, "far"], why: "Compare the two distances again." }, { text: optText(best, false), value: [best, "near"], why: "Compare the two distances again." }]), [
            `$${sf(vs[best].r)} > ${sf(vs[1 - best].r)}$, so $\\mathrm{${names[best]}}$ is farther from its nearest sites. Build it at $\\mathrm{${names[best]}}$.`])] };
    } });
})(typeof globalThis !== "undefined" ? globalThis : this);
