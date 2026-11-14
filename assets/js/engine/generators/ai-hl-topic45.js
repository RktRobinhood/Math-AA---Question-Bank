/* AI HL (additional higher level) generators for Topic 4 (statistics and probability, 4.12 to 4.19)
   and Topic 5 (calculus, 5.9 to 5.18). Self-contained: needs only engine.js.
   Codes are AI HL's. Each generator's independent verifier is in scripts/engine-checks/ai-hl-topic45.mjs
   under the same id. */
(function (root) {
  "use strict";
  const E = root.QBEngine;
  const { ans, fmt } = E;
  const { num, frac, signed, br, paren, expr, m, sf, coef, unit, pct, poly, lin, piFrac, surd } = fmt;
  const P = (prompt, marks, answer, working) => ({ prompt, marks, answer, working });
  const reg = (def) => E.registerAll({ home: "ai-hl", calculator: (level) => level !== 3 }, [def])[0];
  const H0 = "\\mathrm{H}_{0}", H1 = "\\mathrm{H}_{1}";
  const r1 = (x) => Math.round(x * 10) / 10, r2 = (x) => Math.round(x * 100) / 100, r3 = (x) => Math.round(x * 1000) / 1000;
  const mat = (rows) => `\\begin{pmatrix} ${rows.map((r) => r.join(" & ")).join(" \\\\ ")} \\end{pmatrix}`;
  const sum = (xs) => xs.reduce((s, x) => s + x, 0);
  const mean = (xs) => sum(xs) / xs.length;
  const varS = (xs) => { const mu = mean(xs); return sum(xs.map((x) => (x - mu) * (x - mu))) / (xs.length - 1); };
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  // ---- distributions (the verifiers use numerical integration and direct summation instead) ----
  function phi(z) {
    if (z < -8) return 0;
    if (z > 8) return 1;
    let term = z, s = z;
    for (let k = 1; k < 400; k++) { term *= (z * z) / (2 * k + 1); s += term; if (Math.abs(term) < 1e-17) break; }
    return 0.5 + (s * Math.exp((-z * z) / 2)) / Math.sqrt(2 * Math.PI);
  }
  function invPhi(p) {
    let z = 0;
    for (let i = 0; i < 80; i++) z -= (phi(z) - p) / (Math.exp((-z * z) / 2) / Math.sqrt(2 * Math.PI));
    return z;
  }
  function lgamma(x) {
    const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    let y = x, t = x + 5.5, s = 1.000000000190015;
    t -= (x + 0.5) * Math.log(t);
    for (let j = 0; j < 6; j++) s += c[j] / ++y;
    return -t + Math.log((2.5066282746310005 * s) / x);
  }
  function betacf(a, b, x) {
    const tiny = 1e-30, qab = a + b, qap = a + 1, qam = a - 1;
    let c = 1, d = 1 - (qab * x) / qap;
    if (Math.abs(d) < tiny) d = tiny;
    d = 1 / d;
    let h = d;
    for (let k = 1; k <= 400; k++) {
      const k2 = 2 * k;
      let aa = (k * (b - k) * x) / ((qam + k2) * (a + k2));
      d = 1 + aa * d; if (Math.abs(d) < tiny) d = tiny;
      c = 1 + aa / c; if (Math.abs(c) < tiny) c = tiny;
      d = 1 / d; h *= d * c;
      aa = (-(a + k) * (qab + k) * x) / ((a + k2) * (qap + k2));
      d = 1 + aa * d; if (Math.abs(d) < tiny) d = tiny;
      c = 1 + aa / c; if (Math.abs(c) < tiny) c = tiny;
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < 1e-15) break;
    }
    return h;
  }
  function ibeta(a, b, x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? (bt * betacf(a, b, x)) / a : 1 - (bt * betacf(b, a, 1 - x)) / b;
  }
  // P(T < t) for Student's t with v degrees of freedom
  function tCdf(t, v) { const p = 0.5 * ibeta(v / 2, 0.5, v / (v + t * t)); return t >= 0 ? 1 - p : p; }
  function tInv(p, v) { let lo = -80, hi = 80; for (let i = 0; i < 90; i++) { const mid = (lo + hi) / 2; if (tCdf(mid, v) < p) lo = mid; else hi = mid; } return (lo + hi) / 2; }
  // P(chi-squared with k degrees of freedom > x), by the series for the incomplete gamma function
  function chiSf(x, k) {
    const a = k / 2, h = x / 2;
    let ap = a, del = 1 / a, s = del;
    for (let i = 0; i < 2000; i++) { ap += 1; del *= h / ap; s += del; if (Math.abs(del) < Math.abs(s) * 1e-16) break; }
    return 1 - s * Math.exp(-h + a * Math.log(h) - lgamma(a));
  }
  const poisPmf = (l, k) => Math.exp(-l + k * Math.log(l) - lgamma(k + 1));
  const poisCdf = (l, k) => { let s = 0; for (let i = 0; i <= k; i++) s += poisPmf(l, i); return s; };
  const binPmf = (n, p, k) => Math.exp(lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1) + k * Math.log(p) + (n - k) * Math.log(1 - p));
  const binCdf = (n, p, k) => { let s = 0; for (let i = 0; i <= k; i++) s += binPmf(n, p, i); return s; };
  // roughly normal noise from the question's own random numbers
  const gauss = (rng) => (rng.next() + rng.next() + rng.next() + rng.next() - 2) * Math.sqrt(3);
  const sample = (rng, n, mu, sd, places) => Array.from({ length: n }, () => Number((mu + sd * gauss(rng)).toFixed(places)));
  const listTex = (xs) => xs.map((x) => num(x)).join(",\\ ");

  // The conclusion of a test as multiple choice. alt: what H1 claims, in words.
  function conclusion(rng, reject, alt) {
    const R = `Reject $${H0}$: there is sufficient evidence that ${alt}.`;
    const K = `Do not reject $${H0}$: there is insufficient evidence that ${alt}.`;
    return ans.choice(rng, { text: reject ? R : K, value: reject ? "reject" : "keep" }, [
      { text: reject ? K : R, value: reject ? "keep" : "reject", why: "Reject the hypothesis being tested only when the p-value is smaller than the significance level." },
      { text: `Accept $${H0}$: the test proves that it is true.`, value: "prove", why: "A hypothesis test never proves that the hypothesis being tested is true." },
      { text: reject ? `Do not reject $${H0}$: there is sufficient evidence that ${alt}.` : `Reject $${H0}$: there is insufficient evidence that ${alt}.`, value: "mixed", why: "The decision and the statement about the evidence must agree." }]);
  }
  const compare = (p, alpha) => `$p = ${sf(p)} ${p < alpha ? "<" : ">"} ${num(alpha)}$`;

  // ======================= 4.12 data collection, reliability and validity =======================
  const RV = [
    { id: 0, kind: "test-retest", text: "A teacher gives the same vocabulary test to the same class twice, two weeks apart, and finds the correlation between the two sets of scores." },
    { id: 1, kind: "parallel", text: "A driving school writes two different versions of its theory test on the same material. The same learners sit both versions and the two sets of scores are compared." },
    { id: 2, kind: "content", text: "A panel of experienced nurses checks that the questions of a first-aid examination cover every part of the first-aid course." },
    { id: 3, kind: "criterion", text: "A company compares the scores on its new aptitude test with the job performance ratings that the same employees receive a year later." },
    { id: 4, kind: "test-retest", text: "A psychologist asks a group of people to fill in a wellbeing questionnaire in March and the same questionnaire again in April, then finds the correlation between the two sets of results." },
    { id: 5, kind: "criterion", text: "A sports scientist compares the results of a new quick fitness test with the results of an established laboratory measurement of fitness for the same athletes." },
    { id: 6, kind: "content", text: "An examiner checks each question of a mathematics test against the syllabus, to make sure that no topic is missing and none is tested too heavily." },
    { id: 7, kind: "parallel", text: "Students sit one form of a reading test on Monday and a second form, written to the same specification with different passages, on Tuesday. The two sets of scores are compared." }];
  const RVN = { "test-retest": "Test-retest reliability", parallel: "Parallel-forms reliability", content: "Content validity", criterion: "Criterion-related validity" };
  const RVW = { "test-retest": "The same test is given twice to the same people; consistent results show test-retest reliability.", parallel: "Two equivalent versions of the test are compared; consistent results show parallel-forms reliability.",
    content: "Checking that the test covers everything it is meant to measure is a check of content validity.", criterion: "Comparing the results with an independent measure of the same quality is a check of criterion-related validity." };
  reg({ type: "t4-ai-reliability-validity", unknown: "identify", representation: "words", format: "mcq", levels: [1], fixedPool: true, syllabus: ["4.12"],
    skills: ["AI-AHL4.12.reliability", "AI-AHL4.12.validity"], title: "Name the kind of reliability or validity being checked",
    build({ rng }) {
      const c = rng.pick(RV), rel = c.kind === "test-retest" || c.kind === "parallel";
      return { params: { id: c.id }, stem: c.text, parts: [
        P("Is this a check of reliability or of validity?", 1, ans.choice(rng, { text: rel ? "Reliability" : "Validity", value: rel ? "reliability" : "validity" }, [
          { text: rel ? "Validity" : "Reliability", value: rel ? "validity" : "reliability", why: "Reliability is about consistent results; validity is about measuring what is intended." },
          { text: "Neither: it is a check for sampling bias", value: "bias", why: "Nothing here is about how the sample was chosen." }]), [
          rel ? "The check asks whether the results are consistent when the measurement is repeated, which is reliability." : "The check asks whether the test measures what it is meant to measure, which is validity."]),
        P("Which of the following is being checked?", 1, ans.choice(rng, { text: RVN[c.kind], value: c.kind }, Object.keys(RVN).filter((k) => k !== c.kind).map((k) => ({ text: RVN[k], value: k, why: RVW[k] }))), [RVW[c.kind]])] };
    } });

  const FLAWS = { leading: "It is a leading question that pushes the reader towards one answer.", double: "It asks about two different things in one question.", vague: "Its answer categories are vague, so different people will read them differently.",
    overlap: "Its answer categories overlap, so some people fit more than one of them.", negative: "It uses a double negative, so it is not clear what agreeing means." };
  const SURVEY = [
    { id: 0, flaw: "leading", q: "Do you agree that the excellent new canteen menu is a big improvement?", good: "How would you rate the new canteen menu: very poor, poor, acceptable, good or very good?",
      poor: ["Surely you agree that the new canteen menu is better?", "Do you like the new canteen menu and its prices?", "Is the new canteen menu not unpopular?"] },
    { id: 1, flaw: "double", q: "How satisfied are you with the price and the quality of the school lunches?", good: "Ask one question about the price of the lunches and a separate question about their quality.",
      poor: ["Ask whether the reader agrees that the lunches are too expensive and too small.", "Ask only whether the lunches are good.", "Ask the same question twice to check the answers."] },
    { id: 2, flaw: "vague", q: "How often do you exercise: rarely, sometimes or often?", good: "On how many days last week did you exercise for at least half an hour?",
      poor: ["Do you exercise a lot?", "Do you agree that everybody should exercise often?", "How often do you exercise and eat healthy food?"] },
    { id: 3, flaw: "overlap", q: "How many hours did you sleep last night: fewer than six, six to eight, or eight or more?", good: "How many hours did you sleep last night: fewer than six, at least six but fewer than eight, or eight or more?",
      poor: ["Did you sleep for a long time last night?", "How many hours did you sleep: six or fewer, six to eight, or eight or more?", "Do you agree that you slept well last night?"] },
    { id: 4, flaw: "negative", q: "Do you not think that homework should not be set at weekends?", good: "Should homework be set at weekends: yes, no or no opinion?",
      poor: ["Do you not disagree that weekend homework is not useful?", "Do you agree that weekend homework is unfair and should be stopped?", "Is weekend homework set often, sometimes or rarely?"] }];
  reg({ type: "t4-ai-survey-design", unknown: "flawed-question", representation: "words", format: "mcq", levels: [2], fixedPool: true, syllabus: ["4.12"],
    skills: ["AI-AHL4.12.design-collection"], title: "Criticise and improve a questionnaire question",
    build({ rng }) {
      const c = rng.pick(SURVEY);
      return { params: { id: c.id }, stem: `A student is designing a questionnaire. One of the questions is: "${c.q}"`, parts: [
        P("Which statement best describes the main fault in this question?", 2, ans.choice(rng, { text: FLAWS[c.flaw], value: c.flaw },
          rng.shuffle(Object.keys(FLAWS).filter((k) => k !== c.flaw)).map((k) => ({ text: FLAWS[k], value: k, why: "Read the wording and the answer choices again: this is not the main fault here." }))), [
          "A good question is structured, unbiased and precise.", FLAWS[c.flaw]]),
        P("Which of the following would be the best replacement?", 2, ans.choice(rng, { text: c.good, value: "good" }, c.poor.map((t, i) => ({ text: t, value: "poor" + i, why: "This version is still biased, imprecise or unclear." }))), [
          "The replacement should ask one clear thing, in neutral words, with answer choices that do not overlap.", c.good])] };
    } });

  // A Poisson goodness of fit table in which some categories must be combined.
  const CHI_CTX = [
    { thing: "goals scored in a match", per: "matches", who: "A football analyst" }, { thing: "calls received in a minute", per: "minutes", who: "A call centre manager" },
    { thing: "flaws in a sheet of glass", per: "sheets", who: "A quality inspector" }, { thing: "customers arriving in a minute", per: "minutes", who: "A shop owner" },
    { thing: "accidents in a week", per: "weeks", who: "A safety officer" }];
  function chiCombine(obs, exp) {
    const o = obs.slice(), e = exp.slice();
    while (e.length > 2 && e[e.length - 1] <= 5) { const a = e.pop(), b = o.pop(); e[e.length - 1] += a; o[o.length - 1] += b; }
    while (e.length > 2 && e[0] <= 5) { const a = e.shift(), b = o.shift(); e[0] += a; o[0] += b; }
    return { o, e: e.map(r2) };
  }
  function sitChi(rng) {
    for (;;) {
      const ctx = rng.pick(CHI_CTX), n = rng.pick([80, 100, 120, 150, 200]), lam = rng.int(12, 34) / 10, K = rng.pick([5, 6]), est = rng.bool();
      const exp = [];
      for (let k = 0; k < K; k++) exp.push(r2(n * poisPmf(lam, k)));
      exp.push(r2(n - sum(exp)));
      if (exp.some((e) => Math.abs(e - 5) < 0.3 || e < 0.2)) continue;
      const obs = exp.map((e) => Math.max(0, Math.round(e + (rng.next() * 2.6 - 1.3) * Math.sqrt(e))));
      const big = exp.indexOf(Math.max(...exp));
      obs[big] += n - sum(obs);
      if (obs[big] < 1) continue;
      const c = chiCombine(obs, exp);
      if (c.e.length === exp.length || c.e.length < 3 + (est ? 1 : 0) || c.e.some((e) => Math.abs(e - 5) < 0.3)) continue;
      const df = c.e.length - 1 - (est ? 1 : 0);
      const stat = sum(c.e.map((e, i) => ((c.o[i] - e) * (c.o[i] - e)) / e)), p = chiSf(stat, df);
      if (p < 0.002 || p > 0.95 || (p > 0.04 && p < 0.0625)) continue;
      return { ctx, n, lam, K, est, exp, obs, co: c.o, ce: c.e, df, stat, p };
    }
  }
  const chiTable = (s) => ({ head: ["Number of " + s.ctx.thing.split(" ")[0]].concat(s.exp.map((e, k) => (k === s.K ? `$${k}$ or more` : `$${k}$`))),
    rows: [["Observed frequency"].concat(s.obs.map((o) => m(num(o)))), ["Expected frequency"].concat(s.exp.map((e) => m(num(e))))] });
  const chiStem = (s) => `${s.ctx.who} records the number of ${s.ctx.thing} for $${s.n}$ ${s.ctx.per}. ` +
    (s.est ? `The mean of the data is $${num(s.lam)}$, and this estimate is used to fit a Poisson distribution to the data. ` : `It is claimed in advance that this number follows a Poisson distribution with mean $${num(s.lam)}$. `) +
    "The table shows the observed frequencies and the expected frequencies under the Poisson model. A $\\chi^{2}$ goodness of fit test is to be carried out, and categories are combined where necessary so that every expected frequency is greater than $5$.";
  const chiWork = (s) => [
    `Combine neighbouring categories until every expected frequency is greater than $5$: the expected frequencies become $${listTex(s.ce)}$.`,
    `That leaves $${s.ce.length}$ categories.`,
    s.est ? `One parameter, the mean, was estimated from the data, so the degrees of freedom are $${s.ce.length} - 1 - 1 = ${s.df}$.` : `No parameter was estimated from the data, so the degrees of freedom are $${s.ce.length} - 1 = ${s.df}$.`];
  const CHI_SK = ["AI-AHL4.12.combine-categories", "AI-AHL4.12.reduce-df"];
  reg({ type: "t4-ai-chi-grouping", unknown: "degrees-of-freedom", representation: "table", format: "value", levels: [2], syllabus: ["4.12"], skills: CHI_SK, niceOk: true,
    title: "Combine categories and count the degrees of freedom", situationKey: "chi-group", situation: sitChi,
    build({ sit: s }) {
      const w = chiWork(s);
      return { params: {}, stem: chiStem(s), table: chiTable(s), parts: [
        P("Find the number of categories after combining.", 2, ans.int(s.ce.length), w.slice(0, 2)),
        P("Find the number of degrees of freedom for the test.", 2, ans.int(s.df, { misconceptions: [{ value: s.ce.length - 1 - (s.est ? 0 : 1), text: "Subtract one more only for each parameter estimated from the data." }, { value: s.exp.length - 1 - (s.est ? 1 : 0), text: "Count the categories after combining, not before." }] }), [w[2]])] };
    } });
  reg({ type: "t4-ai-chi-grouping", unknown: "test-statistic", representation: "table", format: "value", levels: [4], syllabus: ["4.12"], skills: CHI_SK,
    title: "Goodness of fit after combining categories", situationKey: "chi-group", situation: sitChi,
    build({ rng, sit: s }) {
      const w = chiWork(s);
      return { params: {}, stem: chiStem(s) + " The test uses the $5\\%$ significance level.", table: chiTable(s), parts: [
        P("Find the number of degrees of freedom for the test.", 2, ans.int(s.df), w),
        P("Find the value of the $\\chi^{2}$ test statistic.", 3, ans.sf(s.stat), [
          `After combining, the observed frequencies are $${listTex(s.co)}$ and the expected frequencies are $${listTex(s.ce)}$.`,
          "Add up $\\dfrac{(O - E)^{2}}{E}$ over the categories.", `$\\chi^{2} = ${sf(s.stat)}$`]),
        P("Find the $p$-value for the test.", 1, ans.sf(s.p), [`With $${s.df}$ degrees of freedom, $\\mathrm{P}(\\chi^{2} > ${sf(s.stat)}) = ${sf(s.p)}$.`]),
        P("State the conclusion of the test.", 1, conclusion(rng, s.p < 0.05, "the Poisson model does not fit the data"), [compare(s.p, 0.05), s.p < 0.05 ? `Reject $${H0}$: the data do not fit the Poisson model.` : `Do not reject $${H0}$: the data are consistent with the Poisson model.`])] };
    } });

  // ======================= 4.13 non-linear regression =======================
  const REG_CTX = [
    { x: "weeks after planting", y: "height, $y\\text{ cm}$, of a seedling", u: "cm" }, { x: "hours after sunrise", y: "temperature, $y^\\circ\\text{C}$, in a greenhouse", u: "" },
    { x: "years after it was made", y: "value, $y$ thousand euros, of an investment", u: "" }, { x: "minutes after a tap is opened", y: "depth, $y\\text{ cm}$, of water in a tank", u: "cm" }];
  // integer tenths throughout, so sums of squares are exact
  function sitSS(rng) {
    for (;;) {
      const ctx = rng.pick(REG_CTX), xs = [1, 2, 3, 4, 5, 6], a = rng.pick([2, 3, 4, 5]), b = rng.int(-12, 15), c = rng.int(15, 60);
      const ys = xs.map((x) => a * x * x + b * x + c + rng.int(-4, 4));
      if (ys.some((y) => y <= 5)) continue;
      const mx = 3.5, my = mean(ys), sl = sum(xs.map((x, i) => (x - mx) * (ys[i] - my))) / 17.5;
      const lm = Math.round(sl), lk = Math.round(my - lm * mx);
      const resQ = xs.map((x, i) => ys[i] - (a * x * x + b * x + c)), resL = xs.map((x, i) => ys[i] - (lm * x + lk));
      const ssQ = sum(resQ.map((r) => r * r)), ssL = sum(resL.map((r) => r * r));
      if (ssQ < 12 || ssL < 2.5 * ssQ || ssL > 4000 || lk === 0) continue;
      return { ctx, xs, ys, q: [a, b, c], l: [lm, lk], resQ, resL, ssQ, ssL, quadFirst: rng.bool(), k: rng.int(1, 4), xp: 7 };
    }
  }
  const t10 = (v) => num(v / 10);
  const ssTable = (s) => ({ head: ["$x$"].concat(s.xs.map((x) => m(num(x)))), rows: [["$y$"].concat(s.ys.map((y) => m(t10(y))))] });
  const quadTex = (q) => `y = ${expr([[q[0] / 10, "x^{2}"], [q[1] / 10, "x"], [q[2] / 10, ""]])}`;
  const linTex = (l) => `y = ${expr([[l[0] / 10, "x"], [l[1] / 10, ""]])}`;
  const SSR = "SS_{\\text{res}}";
  reg({ type: "t4-ai-regression-residuals", unknown: "ss-res", representation: "table", format: "value", levels: [2], syllabus: ["4.13"], skills: ["AI-AHL4.13.ssres"],
    title: "The sum of square residuals for a given model", situationKey: "ss-res", situation: sitSS,
    build({ sit: s }) {
      const x = s.xs[s.k], pred = s.q[0] * x * x + s.q[1] * x + s.q[2];
      return { params: {}, table: ssTable(s), stem: `The table shows the ${s.ctx.y} $x$ ${s.ctx.x}. The data are modelled by $${quadTex(s.q)}$.`, parts: [
        P(`Find the value of $y$ that the model predicts when $x = ${x}$.`, 1, ans.dec(pred / 10), [`$y = ${num(s.q[0] / 10)}${br(x)}^{2} ${signed(s.q[1] / 10)}${br(x)} ${signed(s.q[2] / 10)} = ${t10(pred)}$`]),
        P(`Find the sum of square residuals, $${SSR}$, for this model.`, 3, ans.dec(s.ssQ / 100), [
          "A residual is the observed value minus the value the model predicts.", `The residuals are $${listTex(s.resQ.map((r) => r / 10))}$.`,
          `$${SSR} = ${s.resQ.map((r) => `${br(r / 10)}^{2}`).join(" + ")} = ${num(s.ssQ / 100)}$`])] };
    } });
  reg({ type: "t4-ai-regression-residuals", unknown: "compare-models", representation: "table", format: "value", levels: [4], syllabus: ["4.13"], skills: ["AI-AHL4.13.ssres", "AI-AHL4.13.compare-models", "AI-AHL4.13.minimise-ssres"],
    title: "Compare two models by their sums of square residuals", situationKey: "ss-res", situation: sitSS,
    build({ rng, sit: s }) {
      const A = s.quadFirst ? "quad" : "lin", tex = (k) => (k === "quad" ? quadTex(s.q) : linTex(s.l)), ss = (k) => (k === "quad" ? s.ssQ : s.ssL) / 100, res = (k) => (k === "quad" ? s.resQ : s.resL);
      const B = A === "quad" ? "lin" : "quad", best = A === "quad" ? "A" : "B", pred = s.q[0] * s.xp * s.xp + s.q[1] * s.xp + s.q[2];
      const part = (k, name) => P(`Find the sum of square residuals, $${SSR}$, for model ${name}.`, 2, ans.dec(ss(k)), [`The residuals for model ${name} are $${listTex(res(k).map((r) => r / 10))}$.`, `$${SSR} = ${num(ss(k))}$`]);
      return { params: {}, table: ssTable(s), stem: `The table shows the ${s.ctx.y} $x$ ${s.ctx.x}. Two models are suggested. Model A is $${tex(A)}$ and model B is $${tex(B)}$.`, parts: [
        part(A, "A"), part(B, "B"),
        P("Which model fits the data better, judged by the sum of square residuals?", 1, ans.choice(rng, { text: `Model ${best}`, value: best }, [
          { text: `Model ${best === "A" ? "B" : "A"}`, value: best === "A" ? "B" : "A", why: "The better fit has the smaller sum of square residuals." }, { text: "The two models fit equally well", value: "same", why: "The two sums are different." }]), [
          `$${num(ss("quad"))} < ${num(ss("lin"))}$, so model ${best} has the smaller sum of square residuals and fits better.`]),
        P(`Use the better model to predict the value of $y$ when $x = ${s.xp}$.`, 2, ans.dec(pred / 10), [`Model ${best}: $y = ${num(s.q[0] / 10)}${br(s.xp)}^{2} ${signed(s.q[1] / 10)}${br(s.xp)} ${signed(s.q[2] / 10)}$`, `$y = ${t10(pred)}$`])] };
    } });

  const FIT_CTX = [
    { x: "t", y: "h", stem: "A ball is thrown into the air. The table shows its height, $h$ metres, at time $t$ seconds.", xs: [0, 0.5, 1, 1.5, 2, 2.5, 3], a: [-52, -46], b: [130, 165], c: [10, 22], noise: 0.5, dp: 1 },
    { x: "x", y: "P", stem: "A bakery tries different prices for a loaf. The table shows the weekly profit, $P$ hundred euros, when the price is $x$ euros.", xs: [2, 3, 4, 5, 6, 7, 8], a: [-14, -8], b: [100, 130], c: [-150, -90], noise: 0.6, dp: 1 },
    { x: "x", y: "Y", stem: "A farmer tests different amounts of fertiliser. The table shows the yield, $Y$ tonnes, when $x$ hundred kilograms of fertiliser are used.", xs: [0, 1, 2, 3, 4, 5, 6], a: [-9, -5], b: [50, 70], c: [40, 80], noise: 0.5, dp: 1 }];
  function quadFit(xs, ys) {
    const S = (p, q) => sum(xs.map((x, i) => Math.pow(x, p) * (q ? ys[i] : 1)));
    const A = [[S(4), S(3), S(2)], [S(3), S(2), S(1)], [S(2), S(1), xs.length]], v = [S(2, 1), S(1, 1), S(0, 1)];
    const det = (M) => M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
    const D = det(A);
    return [0, 1, 2].map((k) => det(A.map((row, i) => row.map((e, j) => (j === k ? v[i] : e)))) / D);
  }
  reg({ type: "t4-ai-regression-fit", unknown: "quadratic-fit", representation: "table", format: "value", levels: [4], syllabus: ["4.13"], skills: ["AI-AHL4.13.fit-curve", "AI-AHL4.13.r-squared"],
    title: "Fit a quadratic regression model with technology",
    build({ rng }) {
      let c, ys, co, R2, xp, pred;
      do {
        c = rng.pick(FIT_CTX);
        const a = rng.int(c.a[0], c.a[1]) / 10, b = rng.int(c.b[0], c.b[1]) / 10, k = rng.int(c.c[0], c.c[1]) / 10;
        ys = c.xs.map((x) => Number((a * x * x + b * x + k + c.noise * gauss(rng)).toFixed(c.dp)));
        co = quadFit(c.xs, ys);
        const fit = c.xs.map((x) => co[0] * x * x + co[1] * x + co[2]), my = mean(ys);
        R2 = 1 - sum(ys.map((y, i) => (y - fit[i]) * (y - fit[i]))) / sum(ys.map((y) => (y - my) * (y - my)));
        xp = c.xs[rng.int(1, 4)] + (c.xs[1] - c.xs[0]) / 2;
        pred = co[0] * xp * xp + co[1] * xp + co[2];
      } while (ys.some((y) => y <= 0.5) || R2 > 0.9949 || R2 < 0.9 || new Set(ys).size < ys.length);
      const model = `${c.y} = a${c.x}^{2} + b${c.x} + c`;
      return { params: { xs: c.xs, ys, xp }, stem: `${c.stem} The data are modelled by the least squares quadratic regression curve $${model}$.`,
        table: { head: [m(c.x)].concat(c.xs.map((x) => m(num(x)))), rows: [[m(c.y)].concat(ys.map((y) => m(num(y))))] }, parts: [
          P("Find the value of $a$.", 2, ans.sf(co[0]), ["Enter the data in the GDC and choose quadratic regression.", `$a = ${sf(co[0])}$`]),
          P("Find the value of $b$.", 1, ans.sf(co[1]), [`From the same regression, $b = ${sf(co[1])}$ (and $c = ${sf(co[2])}$).`]),
          P("Write down the coefficient of determination, $R^{2}$, for this model.", 1, ans.sf(R2), [`The GDC gives $R^{2} = ${sf(R2)}$, so the model explains about $${pct(sf(100 * R2))}$ of the variation in $${c.y}$.`]),
          P(`Use the model to estimate $${c.y}$ when $${c.x} = ${num(xp)}$.`, 2, ans.sf(pred), [`Substitute $${c.x} = ${num(xp)}$ into the model, keeping the unrounded coefficients.`, `$${c.y} = ${sf(pred)}$`])] };
    } });
  reg({ type: "t4-ai-regression-fit", unknown: "r-squared-meaning", representation: "words", format: "value", levels: [1], syllabus: ["4.13"], skills: ["AI-AHL4.13.r-squared"],
    title: "What the coefficient of determination says",
    build({ rng }) {
      const R = rng.int(71, 98), r = rng.sign() * rng.int(5, 9) / 10, kind = rng.pick(["quadratic", "cubic", "exponential", "power", "sine"]);
      return { params: { R, r }, stem: `A ${kind} regression model fitted to a set of data has coefficient of determination $R^{2} = ${num(R / 100)}$. A linear model fitted to a second set of data has correlation coefficient $r = ${num(r)}$.`, parts: [
        P(`Write down the percentage of the variation in $y$ that the ${kind} model explains.`, 1, ans.int(R), [`$R^{2}$ is the proportion of the variation in $y$ explained by the model: $${num(R / 100)} = ${pct(R)}$.`]),
        P("Write down the value of $R^{2}$ for the linear model.", 1, ans.dec(r2(r * r)), ["For a linear model, $R^{2} = r^{2}$.", `$R^{2} = ${br(r)}^{2} = ${num(r2(r * r))}$`])] };
    } });

  // ======================= 4.14 linear combinations and unbiased estimates =======================
  reg({ type: "t4-ai-linear-combination", unknown: "transformation", representation: "equation", format: "value", levels: [1], syllabus: ["4.14"], skills: ["AI-AHL4.14.linear-transformation"],
    title: "Expectation and variance of a linear transformation",
    build({ rng }) {
      const mu = rng.int(3, 20), v = rng.int(2, 9), a = rng.nonzero(-4, 5), b = rng.nonzero(-9, 9);
      if (a === 1) return this.build({ rng });
      return { params: { mu, v, a, b }, stem: `The random variable $X$ has $\\mathrm{E}(X) = ${mu}$ and $\\mathrm{Var}(X) = ${v}$. Let $Y = ${lin(a, b, "X")}$.`, parts: [
        P("Find $\\mathrm{E}(Y)$.", 1, ans.int(a * mu + b), [`$\\mathrm{E}(aX + b) = a\\mathrm{E}(X) + b = ${a}${br(mu)} ${signed(b)} = ${a * mu + b}$`]),
        P("Find $\\mathrm{Var}(Y)$.", 1, ans.int(a * a * v, { misconceptions: [{ value: a * v, text: "The variance is multiplied by the square of the coefficient." }, { value: a * a * v + b, text: "Adding a constant does not change the variance." }] }), [
          `$\\mathrm{Var}(aX + b) = a^{2}\\mathrm{Var}(X) = ${br(a)}^{2}${br(v)} = ${a * a * v}$`])] };
    } });
  const COMBO_CTX = [
    { a: "apple", b: "pear", unit: "g", m1: [150, 190], s1: [8, 15], m2: [120, 145], s2: [6, 12], pack: "A fruit box holds", q: "mass" },
    { a: "large egg", b: "small egg", unit: "g", m1: [66, 72], s1: [3, 5], m2: [48, 55], s2: [2, 4], pack: "A mixed tray holds", q: "mass" },
    { a: "adult", b: "child", unit: "kg", m1: [72, 84], s1: [9, 13], m2: [32, 44], s2: [5, 8], pack: "A cable car carries", q: "mass" },
    { a: "novel", b: "magazine", unit: "g", m1: [320, 420], s1: [25, 40], m2: [140, 200], s2: [10, 20], pack: "A parcel contains", q: "mass" }];
  const pl = (w, n) => (n === 1 ? w : w === "child" ? "children" : w + "s");
  const words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
  function sitCombo(rng) {
    const c = rng.pick(COMBO_CTX), n = rng.int(2, 5), k = rng.int(2, 4);
    return { c, n, k, m1: rng.int(c.m1[0], c.m1[1]), s1: rng.int(c.s1[0], c.s1[1]), m2: rng.int(c.m2[0], c.m2[1]), s2: rng.int(c.s2[0], c.s2[1]), u: rng.next(), u2: rng.next() };
  }
  const comboStem = (s, normal) => `The ${s.c.q} of ${/^[aeiou]/.test(s.c.a) ? "an" : "a"} ${s.c.a} ${normal ? "is normally distributed with" : "has"} mean $${unit(s.m1, s.c.unit)}$ and standard deviation $${unit(s.s1, s.c.unit)}$. ` +
    `The ${s.c.q} of a ${s.c.b} ${normal ? "is normally distributed with" : "has"} mean $${unit(s.m2, s.c.unit)}$ and standard deviation $${unit(s.s2, s.c.unit)}$. All ${s.c.q}es are independent. ${s.c.pack} ${words[s.n]} ${pl(s.c.a, s.n)} and ${words[s.k]} ${pl(s.c.b, s.k)}, chosen at random.`;
  reg({ type: "t4-ai-linear-combination", unknown: "total", representation: "words", format: "value", levels: [2], syllabus: ["4.14"], skills: ["AI-AHL4.14.linear-combination"],
    title: "Mean and standard deviation of a total", situationKey: "combo", situation: sitCombo,
    build({ sit: s }) {
      const mu = s.n * s.m1 + s.k * s.m2, v = s.n * s.s1 * s.s1 + s.k * s.s2 * s.s2;
      return { params: {}, stem: comboStem(s, false), parts: [
        P(`Find the expected total ${s.c.q}, in ${s.c.unit}.`, 1, ans.int(mu), [`$${s.n}${br(s.m1)} + ${s.k}${br(s.m2)} = ${num(mu)}$`]),
        P(`Find the standard deviation of the total ${s.c.q}, in ${s.c.unit}.`, 3, ans.sf(Math.sqrt(v), 3, { misconceptions: [
          { value: Math.sqrt(s.n * s.n * s.s1 * s.s1 + s.k * s.k * s.s2 * s.s2), text: `The total of ${words[s.n]} independent ${pl(s.c.a, 2)} is a sum of separate variables, not one variable multiplied by $${s.n}$, so each variance is added once per item.` },
          { value: s.n * s.s1 + s.k * s.s2, text: "Add variances, not standard deviations." }] }), [
          "For independent variables the variances add.", `$\\mathrm{Var}(\\text{total}) = ${s.n}${br(s.s1)}^{2} + ${s.k}${br(s.s2)}^{2} = ${num(v)}$`, `Standard deviation $= \\sqrt{${num(v)}} = ${sf(Math.sqrt(v))}$`])] };
    } });
  reg({ type: "t4-ai-linear-combination", unknown: "find-constants", representation: "equation", format: "value", levels: [3], syllabus: ["4.14"], skills: ["AI-AHL4.14.linear-transformation", "AI-AHL4.14.linear-combination"],
    title: "Find the constants of a transformation, then combine variables",
    build({ rng }) {
      const mu = rng.int(4, 12), v = rng.pick([1, 2, 3, 4, 5]), a = rng.int(2, 5), b = rng.nonzero(-10, 10), mw = rng.int(2, 9), vw = rng.int(1, 6), c1 = rng.int(2, 3), c2 = rng.int(2, 4);
      return { params: { mu, v, a, b, mw, vw, c1, c2 }, stem: `The random variable $X$ has $\\mathrm{E}(X) = ${mu}$ and $\\mathrm{Var}(X) = ${v}$. The random variable $Y = aX + b$, where $a > 0$, has $\\mathrm{E}(Y) = ${a * mu + b}$ and $\\mathrm{Var}(Y) = ${a * a * v}$. ` +
        `A third random variable $W$ is independent of $X$, with $\\mathrm{E}(W) = ${mw}$ and $\\mathrm{Var}(W) = ${vw}$.`, parts: [
        P("Find the value of $a$.", 2, ans.int(a), [`$\\mathrm{Var}(Y) = a^{2}\\mathrm{Var}(X)$, so $${v === 1 ? "" : v}a^{2} = ${a * a * v}$.`, `$a^{2} = ${a * a}$ and $a > 0$, so $a = ${a}$.`]),
        P("Find the value of $b$.", 2, ans.int(b), [`$\\mathrm{E}(Y) = a\\mathrm{E}(X) + b$, so $${a}${br(mu)} + b = ${a * mu + b}$.`, `$b = ${b}$`]),
        P(`Find $\\mathrm{Var}(${c1}X - ${c2}W)$.`, 2, ans.int(c1 * c1 * v + c2 * c2 * vw, { misconceptions: [{ value: c1 * c1 * v - c2 * c2 * vw, text: "Variances add even when the variables are subtracted." }] }), [
          "For independent variables, $\\mathrm{Var}(aX - bW) = a^{2}\\mathrm{Var}(X) + b^{2}\\mathrm{Var}(W)$.", `$${c1}^{2}${br(v)} + ${c2}^{2}${br(vw)} = ${c1 * c1 * v + c2 * c2 * vw}$`])] };
    } });
  const UNB = "s_{n-1}^{2}";
  reg({ type: "t4-ai-unbiased-estimates", unknown: "from-summary", representation: "words", format: "value", levels: [2], syllabus: ["4.14"], skills: ["AI-AHL4.14.unbiased-mean", "AI-AHL4.14.unbiased-variance"],
    title: "Unbiased estimates from summary statistics",
    build({ rng }) {
      const c = rng.pick([["the lengths, in centimetres, of", "leaves from a tree", 9, 2], ["the times, in minutes, taken by", "runners in a race", 48, 7], ["the masses, in grams, of", "bread rolls from a bakery", 62, 5], ["the numbers of pages in", "books from a library", 280, 60]]);
      let n, data, sx, sxx, vn;
      do { n = rng.int(8, 20); data = sample(rng, n, c[2], c[3], 0); sx = sum(data); sxx = sum(data.map((x) => x * x)); vn = sxx / n - (sx / n) * (sx / n); } while (vn < 1 || data.some((x) => x <= 0));
      const vu = (n / (n - 1)) * vn;
      return { params: { data }, stem: `A random sample of $${n}$ ${c[1]} is taken, and $x$ denotes ${c[0]} these ${c[1].split(" ")[0]}. The results are summarised by $\\displaystyle\\sum x = ${num(sx)}$ and $\\displaystyle\\sum x^{2} = ${num(sxx)}$.`, parts: [
        P("Find an unbiased estimate of the population mean.", 1, ans.sf(sx / n), [`$\\bar{x} = \\dfrac{${num(sx)}}{${n}} = ${sf(sx / n)}$`]),
        P("Find an unbiased estimate of the population variance.", 3, ans.sf(vu, 3, { misconceptions: [{ value: vn, text: `This is the variance of the sample, $s_{n}^{2}$. Multiply it by $\\dfrac{n}{n-1}$.` }, { value: Math.sqrt(vu), text: "This is the standard deviation; the variance is its square." }] }), [
          `The variance of the sample is $s_{n}^{2} = \\dfrac{${num(sxx)}}{${n}} - ${sf(sx / n, 5)}^{2} = ${sf(vn, 5)}$.`, `$${UNB} = \\dfrac{n}{n-1} \\times s_{n}^{2} = \\dfrac{${n}}{${n - 1}} \\times ${sf(vn, 5)}$`, `$${UNB} = ${sf(vu)}$`])] };
    } });
  reg({ type: "t4-ai-unbiased-estimates", unknown: "from-data", representation: "table", format: "value", levels: [4], syllabus: ["4.14"], skills: ["AI-AHL4.14.unbiased-mean", "AI-AHL4.14.unbiased-variance", "AI-AHL4.14.linear-transformation"],
    title: "Unbiased estimates from data, then for a transformed variable",
    build({ rng }) {
      const c = rng.pick([
        { what: "the noon temperature, $x^\\circ\\text{C}$, at a weather station on eight days", mu: 18, sd: 4, a: 1.8, b: 32, y: "The temperature in degrees Fahrenheit is $y = 1.8x + 32$." },
        { what: "the length, $x$ inches, of eight fish caught in a lake", mu: 14, sd: 3, a: 2.54, b: 0, y: "The length in centimetres is $y = 2.54x$." },
        { what: "the distance, $x\\text{ km}$, of eight taxi journeys", mu: 9, sd: 3, a: 1.6, b: 3.5, y: "The fare in euros for a journey is $y = 1.6x + 3.5$." },
        { what: "the mass, $x\\text{ kg}$, of eight parcels", mu: 6, sd: 2, a: 2.4, b: 4, y: "The cost in euros of posting a parcel is $y = 2.4x + 4$." }]);
      let data;
      do { data = sample(rng, 8, c.mu + rng.int(-2, 2), c.sd, 1); } while (data.some((x) => x <= 0.5) || new Set(data).size < 7);
      const mu = mean(data), v = varS(data);
      return { params: { data, a: c.a, b: c.b }, stem: `The table shows ${c.what}, chosen at random. ${c.y}`,
        table: { head: ["$x$"].concat(data.map((x) => m(num(x)))), rows: [] }, parts: [
          P("Find an unbiased estimate of the population mean of $x$.", 1, ans.sf(mu), [`From the GDC, $\\bar{x} = ${sf(mu)}$.`]),
          P("Find an unbiased estimate of the population variance of $x$.", 2, ans.sf(v, 3, { misconceptions: [{ value: Math.sqrt(v), text: "This is $s_{n-1}$; the variance is its square." }, { value: (v * 7) / 8, text: "This is the variance of the sample; use $s_{n-1}$ from the GDC." }] }), [
            `The GDC gives $s_{n-1} = ${sf(Math.sqrt(v), 4)}$.`, `$${UNB} = ${sf(Math.sqrt(v), 4)}^{2} = ${sf(v)}$`]),
          P("Find an unbiased estimate of the population mean of $y$.", 1, ans.sf(c.a * mu + c.b), [`$\\bar{y} = ${num(c.a)}\\bar{x} ${signed(c.b)} = ${sf(c.a * mu + c.b)}$`]),
          P("Find an unbiased estimate of the population variance of $y$.", 2, ans.sf(c.a * c.a * v, 3, { misconceptions: [{ value: c.a * v, text: "The variance is multiplied by the square of the coefficient." }] }), [
            `$\\mathrm{Var}(aX + b) = a^{2}\\mathrm{Var}(X)$, so the estimate is $${num(c.a)}^{2} \\times ${sf(v, 4)}$.`, `This is $${sf(c.a * c.a * v)}$.`])] };
    } });

  // ======================= 4.15 combining normal variables, the central limit theorem =======================
  reg({ type: "t4-ai-normal-combination", unknown: "total-probability", representation: "words", format: "value", levels: [4], syllabus: ["4.15"], skills: ["AI-AHL4.15.normal-combination"],
    title: "Probabilities for sums and differences of normal variables", situationKey: "combo", situation: sitCombo,
    build({ sit: s }) {
      const mu = s.n * s.m1 + s.k * s.m2, v = s.n * s.s1 * s.s1 + s.k * s.s2 * s.s2, sd = Math.sqrt(v);
      const lim = Math.round(mu + (0.6 + 1.2 * s.u) * sd), pT = 1 - phi((lim - mu) / sd);
      const vd = s.s1 * s.s1 + s.s2 * s.s2, md = s.m1 - s.m2, d = Math.round(md + (s.u2 * 2 - 1) * 1.3 * Math.sqrt(vd)), pD = 1 - phi((d - md) / Math.sqrt(vd));
      return { params: { lim, d }, stem: comboStem(s, true), parts: [
        P(`Find the mean of the total ${s.c.q}, in ${s.c.unit}.`, 1, ans.int(mu), [`$${s.n}${br(s.m1)} + ${s.k}${br(s.m2)} = ${num(mu)}$`]),
        P(`Find the variance of the total ${s.c.q}.`, 2, ans.int(v, { misconceptions: [{ value: s.n * s.n * s.s1 * s.s1 + s.k * s.k * s.s2 * s.s2, text: "The total is a sum of separate independent variables, so each variance is added once per item." }] }), [
          `$${s.n}${br(s.s1)}^{2} + ${s.k}${br(s.s2)}^{2} = ${num(v)}$`]),
        P(`Find the probability that the total ${s.c.q} is more than $${unit(lim, s.c.unit)}$.`, 2, ans.sf(pT), [
          `A sum of independent normal variables is normal: $T \\sim \\mathrm{N}(${num(mu)},\\, ${num(v)})$.`, `$\\mathrm{P}(T > ${num(lim)}) = ${sf(pT)}$`]),
        P(`Find the probability that one randomly chosen ${s.c.a} has a ${s.c.q} more than $${unit(d, s.c.unit)}$ greater than that of one randomly chosen ${s.c.b}.`, 2, ans.sf(pD), [
          `Let $D$ be the difference. $\\mathrm{E}(D) = ${s.m1} - ${s.m2} = ${md}$ and $\\mathrm{Var}(D) = ${s.s1}^{2} + ${s.s2}^{2} = ${vd}$.`, `$D \\sim \\mathrm{N}(${md},\\, ${vd})$, so $\\mathrm{P}(D > ${d}) = ${sf(pD)}$.`])] };
    } });
  const MEAN_CTX = [
    { x: "the mass of a bag of rice filled by a machine", unit: "g", mu: [495, 510], sd: [6, 14], item: "bags" }, { x: "the time a nurse spends with a patient", unit: "minutes", mu: [11, 19], sd: [3, 6], item: "patients" },
    { x: "the length of a bolt made by a machine", unit: "mm", mu: [58, 76], sd: [2, 5], item: "bolts" }, { x: "the volume of juice in a carton", unit: "ml", mu: [245, 255], sd: [4, 9], item: "cartons" }];
  function sitMean(rng) {
    const c = rng.pick(MEAN_CTX), mu = rng.int(c.mu[0], c.mu[1]), sd = rng.int(c.sd[0], c.sd[1]), n = rng.pick([5, 8, 10, 12, 16, 20, 25]);
    const se = sd / Math.sqrt(n), below = rng.bool(), cut = r1(mu + (below ? -1 : 1) * (0.5 + rng.next() * 1.4) * se);
    return { c, mu, sd, n, below, cut };
  }
  reg({ type: "t4-ai-sample-mean", unknown: "standard-error", representation: "words", format: "value", levels: [1], syllabus: ["4.15"], skills: ["AI-AHL4.15.sample-mean"],
    title: "The distribution of a sample mean", situationKey: "sample-mean", situation: sitMean,
    build({ sit: s }) {
      return { params: {}, stem: `${cap(s.c.x)} is normally distributed with mean $${unit(s.mu, s.c.unit)}$ and standard deviation $${unit(s.sd, s.c.unit)}$. A random sample of $${s.n}$ ${s.c.item} is taken and the sample mean $\\bar{X}$ is found.`, parts: [
        P("Write down $\\mathrm{E}(\\bar{X})$.", 1, ans.int(s.mu), [`The sample mean has the same mean as the population: $${s.mu}$.`]),
        P("Find $\\mathrm{Var}(\\bar{X})$.", 1, ans.sf((s.sd * s.sd) / s.n), [`$\\mathrm{Var}(\\bar{X}) = \\dfrac{\\sigma^{2}}{n} = \\dfrac{${s.sd}^{2}}{${s.n}} = ${sf((s.sd * s.sd) / s.n)}$`])] };
    } });
  reg({ type: "t4-ai-sample-mean", unknown: "probability", representation: "words", format: "value", levels: [2], syllabus: ["4.15"], skills: ["AI-AHL4.15.sample-mean"],
    title: "A probability for the mean of a sample from a normal population", situationKey: "sample-mean", situation: sitMean,
    build({ sit: s }) {
      const se = s.sd / Math.sqrt(s.n), p = s.below ? phi((s.cut - s.mu) / se) : 1 - phi((s.cut - s.mu) / se);
      return { params: {}, stem: `${cap(s.c.x)} is normally distributed with mean $${unit(s.mu, s.c.unit)}$ and standard deviation $${unit(s.sd, s.c.unit)}$. A random sample of $${s.n}$ ${s.c.item} is taken.`, parts: [
        P("Find the standard deviation of the sample mean.", 1, ans.sf(se), [`$\\dfrac{\\sigma}{\\sqrt{n}} = \\dfrac{${s.sd}}{\\sqrt{${s.n}}} = ${sf(se)}$`]),
        P(`Find the probability that the sample mean is ${s.below ? "less" : "greater"} than $${unit(s.cut, s.c.unit)}$.`, 2, ans.sf(p, 3, { misconceptions: [{ value: s.below ? phi((s.cut - s.mu) / s.sd) : 1 - phi((s.cut - s.mu) / s.sd), text: "This uses the standard deviation of one item. The sample mean has standard deviation $\\dfrac{\\sigma}{\\sqrt{n}}$." }] }), [
          `$\\bar{X} \\sim \\mathrm{N}\\left(${s.mu},\\, \\dfrac{${s.sd}^{2}}{${s.n}}\\right)$`, `$\\mathrm{P}(\\bar{X} ${s.below ? "<" : ">"} ${num(s.cut)}) = ${sf(p)}$`])] };
    } });
  reg({ type: "t4-ai-sample-mean", unknown: "central-limit-theorem", representation: "words", format: "value", levels: [4], syllabus: ["4.15"], skills: ["AI-AHL4.15.central-limit-theorem", "AI-AHL4.15.sample-mean"],
    title: "The central limit theorem for a mean and a total",
    build({ rng }) {
      const c = rng.pick([{ x: "The waiting time for a bus at a busy stop", unit: "minutes", mu: [50, 90], sd: [30, 60], item: "waiting times", sc: 10 }, { x: "The amount a customer spends in a café", unit: "euros", mu: [70, 120], sd: [40, 70], item: "customers", sc: 10 },
        { x: "The number of words in an email sent by a company", unit: "words", mu: [80, 140], sd: [50, 90], item: "emails", sc: 1 }, { x: "The time a visitor spends in a museum", unit: "minutes", mu: [60, 95], sd: [25, 45], item: "visitors", sc: 1 }]);
      const mu = rng.int(c.mu[0], c.mu[1]) / c.sc, sd = rng.int(c.sd[0], c.sd[1]) / c.sc, n = rng.pick([36, 40, 45, 50, 60, 64, 80, 100]), se = sd / Math.sqrt(n);
      const lo = Number((mu - (0.6 + rng.next()) * se).toPrecision(3)), hi = Number((mu + (0.6 + rng.next()) * se).toPrecision(3));
      const pB = phi((hi - mu) / se) - phi((lo - mu) / se), tot = Number((n * mu + (0.4 + rng.next() * 1.2) * sd * Math.sqrt(n)).toPrecision(3)), pT = 1 - phi((tot - n * mu) / (sd * Math.sqrt(n)));
      return { params: { mu, sd, n, lo, hi, tot }, stem: `${c.x} has mean $${unit(mu, c.unit)}$ and standard deviation $${unit(sd, c.unit)}$. Its distribution is not normal. A random sample of $${n}$ ${c.item} is taken.`, parts: [
        P("Why can the sample mean be modelled by a normal distribution?", 1, ans.choice(rng, { text: "The sample is large, so the central limit theorem applies.", value: "clt" }, [
          { text: "The population is normally distributed.", value: "pop", why: "The question says the population is not normal." }, { text: "The sample mean always equals the population mean.", value: "equal", why: "The sample mean varies from sample to sample." },
          { text: "The standard deviation is smaller than the mean.", value: "sd", why: "This has nothing to do with the shape of the distribution of the sample mean." }]), [
          `The sample size is $${n} > 30$, so by the central limit theorem the sample mean is approximately normal.`]),
        P(`Find the probability that the sample mean is between $${num(lo)}$ and $${num(hi)}$ ${c.unit}.`, 3, ans.sf(pB), [
          `$\\bar{X} \\sim \\mathrm{N}\\left(${num(mu)},\\, \\dfrac{${num(sd)}^{2}}{${n}}\\right)$ approximately, with standard deviation $${sf(se, 4)}$.`, `$\\mathrm{P}(${num(lo)} < \\bar{X} < ${num(hi)}) = ${sf(pB)}$`]),
        P(`Find the probability that the total for the $${n}$ ${c.item} is more than $${num(tot)}$ ${c.unit}.`, 2, ans.sf(pT), [
          `The total $T$ is approximately normal with mean $${n}${br(mu)} = ${num(n * mu)}$ and variance $${n}${br(sd)}^{2} = ${num(Number((n * sd * sd).toPrecision(10)))}$.`, `$\\mathrm{P}(T > ${num(tot)}) = ${sf(pT)}$`])] };
    } });

    // ======================= 4.16 confidence intervals for a mean =======================
  const CI_CTX = [
    { x: "the length of a leaf of a certain plant", unit: "cm", mu: [62, 98], sd: [8, 16], item: "leaves" },
    { x: "the time taken to assemble a toy", unit: "minutes", mu: [120, 260], sd: [15, 40], item: "assembly times" },
    { x: "the mass of an adult hamster", unit: "g", mu: [280, 420], sd: [30, 60], item: "hamsters" },
    { x: "the daily screen time of a student", unit: "hours", mu: [35, 62], sd: [8, 15], item: "students" }];
  function sitCI(rng) {
    const c = rng.pick(CI_CTX), mu = rng.int(c.mu[0], c.mu[1]) / 10, sd = rng.int(c.sd[0], c.sd[1]) / 10, n = rng.int(8, 30), level = rng.pick([90, 95, 99]);
    return { c, sd, n, level, xbar: r2(mu + (rng.next() - 0.5) * sd * 0.8), s: r2(sd * (0.8 + 0.4 * rng.next())) };
  }
  const ciStem = (s, known) => `${cap(s.c.x)} is normally distributed. ` + (known ? `The population standard deviation is known to be $${unit(s.sd, s.c.unit)}$. A random sample of $${s.n}$ ${s.c.item} has mean $${unit(s.xbar, s.c.unit)}$.`
    : `The population standard deviation is not known. A random sample of $${s.n}$ ${s.c.item} has mean $${unit(s.xbar, s.c.unit)}$ and gives the unbiased estimate $s_{n-1} = ${unit(s.s, s.c.unit)}$ of the population standard deviation.`);
  const ciParts = (s, lo, hi, how) => [
    P(`Find the lower bound of the $${pct(s.level)}$ confidence interval for the population mean.`, 2, ans.sf(lo), how.concat([`Lower bound $= ${sf(lo)}$`])),
    P("Find the upper bound of this confidence interval.", 1, ans.sf(hi), [`Upper bound $= ${sf(hi)}$, so the interval is $${sf(lo)} < \\mu < ${sf(hi)}$.`])];
  reg({ type: "t4-ai-confidence-interval", unknown: "z-interval", representation: "words", format: "value", levels: [2], syllabus: ["4.16"], skills: ["AI-AHL4.16.find-interval"],
    title: "A confidence interval when the standard deviation is known", situationKey: "ci", situation: sitCI,
    build({ sit: s }) {
      const z = invPhi(0.5 + s.level / 200), h = (z * s.sd) / Math.sqrt(s.n);
      return { params: {}, stem: ciStem(s, true), parts: ciParts(s, s.xbar - h, s.xbar + h, [
        "The population standard deviation is known, so use the normal distribution (a $z$-interval on the GDC).", `$\\bar{x} \\pm z\\dfrac{\\sigma}{\\sqrt{n}}$ with $z = ${sf(z, 4)}$ gives $${num(s.xbar)} \\pm ${sf(h, 4)}$.`]) };
    } });
  reg({ type: "t4-ai-confidence-interval", unknown: "t-interval-summary", representation: "words", format: "value", levels: [2], syllabus: ["4.16"], skills: ["AI-AHL4.16.find-interval", "AI-AHL4.16.interval-conditions"],
    title: "A confidence interval when the standard deviation is unknown", situationKey: "ci", situation: sitCI,
    build({ sit: s }) {
      const t = tInv(0.5 + s.level / 200, s.n - 1), h = (t * s.s) / Math.sqrt(s.n);
      return { params: {}, stem: ciStem(s, false), parts: ciParts(s, s.xbar - h, s.xbar + h, [
        `The population standard deviation is not known, so use the $t$-distribution with $${s.n} - 1 = ${s.n - 1}$ degrees of freedom (a $t$-interval on the GDC).`, `$\\bar{x} \\pm t\\dfrac{s_{n-1}}{\\sqrt{n}}$ with $t = ${sf(t, 4)}$ gives $${num(s.xbar)} \\pm ${sf(h, 4)}$.`]) };
    } });
  reg({ type: "t4-ai-confidence-interval", unknown: "choose-distribution", representation: "words", format: "mcq", levels: [1], syllabus: ["4.16"], skills: ["AI-AHL4.16.interval-conditions"],
    title: "Choose the distribution for a confidence interval",
    build({ rng }) {
      const c = rng.pick(CI_CTX), known = rng.bool(), n = rng.pick([6, 9, 12, 15, 20, 36, 50]), sd = rng.int(c.sd[0], c.sd[1]) / 10;
      const N = "The normal distribution", Tn = `The $t$-distribution with $${n - 1}$ degrees of freedom`;
      return { params: { known, n }, stem: `${cap(c.x)} is normally distributed. A confidence interval for the population mean is to be found from a random sample of $${n}$ ${c.item}. ` +
        (known ? `The population standard deviation is known to be $${unit(sd, c.unit)}$.` : `The population standard deviation is not known, and the sample gives $s_{n-1} = ${unit(sd, c.unit)}$.`), parts: [
        P("Which distribution should be used to find the interval?", 1, ans.choice(rng, { text: known ? N : Tn, value: known ? "z" : "t" }, [
          { text: known ? Tn : N, value: known ? "t" : "z", why: "Use the normal distribution when the population standard deviation is known and the $t$-distribution when it is estimated from the sample, whatever the sample size." },
          { text: `The $t$-distribution with $${n}$ degrees of freedom`, value: "t-n", why: "The degrees of freedom are one fewer than the sample size, and the $t$-distribution is only for an unknown standard deviation." },
          { text: `The binomial distribution with $${n}$ trials`, value: "bin", why: "The variable is continuous; nothing is being counted." }]), [
          known ? "The population standard deviation is known, so the normal distribution is used, whatever the sample size." : `The population standard deviation is estimated from the sample, so the $t$-distribution with $n - 1 = ${n - 1}$ degrees of freedom is used, whatever the sample size.`])] };
    } });
  reg({ type: "t4-ai-confidence-interval", unknown: "t-interval", representation: "table", format: "value", levels: [4], syllabus: ["4.16"], skills: ["AI-AHL4.16.find-interval", "AI-AHL4.16.interpret-interval"],
    title: "A confidence interval from data, and a claim about the mean",
    build({ rng }) {
      const c = rng.pick(CI_CTX), level = rng.pick([90, 95, 99]), n = rng.int(8, 10);
      let data, lo, hi, claim, inside;
      do {
        data = sample(rng, n, rng.int(c.mu[0], c.mu[1]) / 10, rng.int(c.sd[0], c.sd[1]) / 10, 1);
        const h = (tInv(0.5 + level / 200, n - 1) * Math.sqrt(varS(data))) / Math.sqrt(n);
        lo = mean(data) - h; hi = mean(data) + h; inside = rng.bool();
        claim = r1(mean(data) + rng.sign() * h * (inside ? 0.2 + 0.6 * rng.next() : 1.25 + 0.8 * rng.next()));
        inside = claim > lo && claim < hi;
        if (Math.min(Math.abs(claim - lo), Math.abs(claim - hi)) < 0.12 * h) data = [0];
      } while (data.some((x) => x <= 0.5) || new Set(data).size < n - 1 || claim <= 0);
      const yes = `The claim is plausible, because $${num(claim)}$ lies inside the interval.`, no = `The claim is not supported, because $${num(claim)}$ lies outside the interval.`;
      return { params: { data, level, claim }, stem: `${cap(c.x)} is normally distributed. The table shows the values, in ${c.unit}, for a random sample of $${n}$ ${c.item}. It has been claimed that the population mean is $${unit(claim, c.unit)}$.`,
        table: { head: ["Value"].concat(data.map((x) => m(num(x)))), rows: [] }, parts: [
          P("Find the mean of the sample.", 1, ans.sf(mean(data)), [`From the GDC, $\\bar{x} = ${sf(mean(data))}$.`]),
          P(`Find the lower bound of the $${pct(level)}$ confidence interval for the population mean.`, 2, ans.sf(lo), [
            `The population standard deviation is not known, so use a $t$-interval with $${n - 1}$ degrees of freedom on the GDC ($s_{n-1} = ${sf(Math.sqrt(varS(data)), 4)}$).`, `Lower bound $= ${sf(lo)}$`]),
          P("Find the upper bound of this confidence interval.", 1, ans.sf(hi), [`Upper bound $= ${sf(hi)}$`]),
          P("What does the interval say about the claim?", 2, ans.choice(rng, { text: inside ? yes : no, value: inside ? "inside" : "outside" }, [
            { text: inside ? no : yes, value: inside ? "outside" : "inside", why: "Compare the claimed mean with the two bounds." },
            { text: "The claim is not supported, because the sample mean is not equal to the claimed mean.", value: "equal", why: "A sample mean is almost never exactly equal to the population mean." },
            { text: "Nothing, because the interval only describes the sample.", value: "none", why: "The interval is a range of plausible values for the population mean." }]), [
            `The interval is $${sf(lo)} < \\mu < ${sf(hi)}$.`, inside ? yes : no])] };
    } });
  reg({ type: "t4-ai-confidence-interval", unknown: "sample-size", representation: "words", format: "value", levels: [4], syllabus: ["4.16"], skills: ["AI-AHL4.16.find-interval", "AI-AHL4.16.interpret-interval"],
    title: "A confidence interval and the sample size for a given width", situationKey: "ci", situation: sitCI,
    build({ rng, sit: s }) {
      const z = invPhi(0.5 + s.level / 200), h = (z * s.sd) / Math.sqrt(s.n);
      let w, need;
      do { w = Number((2 * h * (0.35 + 0.4 * rng.next())).toPrecision(2)); need = Math.pow((2 * z * s.sd) / w, 2); } while (Math.abs(need - Math.round(need)) < 0.04 || need < s.n + 3);
      const nMin = Math.floor(need) + 1;
      return { params: { w }, stem: ciStem(s, true), parts: ciParts(s, s.xbar - h, s.xbar + h, [
        "The population standard deviation is known, so use a $z$-interval on the GDC.", `$\\bar{x} \\pm z\\dfrac{\\sigma}{\\sqrt{n}}$ with $z = ${sf(z, 4)}$ gives $${num(s.xbar)} \\pm ${sf(h, 4)}$.`]).concat([
        P(`Find the least sample size for which the width of a $${pct(s.level)}$ confidence interval would be less than $${unit(w, s.c.unit)}$.`, 3, ans.int(nMin), [
          `The width is $2z\\dfrac{\\sigma}{\\sqrt{n}}$, so $2 \\times ${sf(z, 4)} \\times \\dfrac{${num(s.sd)}}{\\sqrt{n}} < ${num(w)}$.`, `$\\sqrt{n} > ${sf(Math.sqrt(need), 4)}$, so $n > ${sf(need, 4)}$.`, `The least sample size is $${nMin}$.`])]) };
    } });

  // ======================= 4.17 the Poisson distribution =======================
  const POIS_CTX = [{ ev: "calls", intro: "A helpline receives calls", per: "hour" }, { ev: "cars", intro: "Cars pass a checkpoint on a quiet road", per: "minute" }, { ev: "emails", intro: "An office receives emails", per: "hour" },
    { ev: "orders", intro: "An online shop receives orders", per: "hour" }, { ev: "breakdowns", intro: "A fleet of delivery vans has breakdowns", per: "week" }];
  function sitPois(rng) {
    const c = rng.pick(POIS_CTX), lam = rng.int(12, 65) / 10, t = rng.int(2, 5);
    return { c, lam, t, k: Math.max(1, Math.round(lam) + rng.int(-1, 1)), k2: Math.round(lam) + rng.int(1, 3), m: Math.round(lam * t) + rng.int(-2, 3), lam2: rng.int(8, 40) / 10, dj: rng.int(-2, 1), n: rng.int(5, 10), r: rng.int(1, 3) };
  }
  const poisStem = (s) => `${s.c.intro} at an average rate of $${num(s.lam)}$ per ${s.c.per}. The number of ${s.c.ev} in a given period is modelled by a Poisson distribution.`;
  const Po = (l) => `\\mathrm{Po}(${num(l)})`;
  reg({ type: "t4-ai-poisson", unknown: "mean-variance", representation: "words", format: "value", levels: [1], syllabus: ["4.17"], skills: ["AI-AHL4.17.rescale-mean"], niceOk: true,
    title: "Mean and variance of a Poisson distribution", situationKey: "poisson", situation: sitPois,
    build({ sit: s }) {
      return { params: {}, stem: poisStem(s), parts: [
        P(`Write down the variance of the number of ${s.c.ev} in one ${s.c.per}.`, 1, ans.dec(s.lam), [`For a Poisson distribution the variance equals the mean: $${num(s.lam)}$.`]),
        P(`Find the mean number of ${s.c.ev} in $${s.t}$ ${s.c.per}s.`, 1, ans.dec(r1(s.lam * s.t)), [`$${s.t} \\times ${num(s.lam)} = ${num(r1(s.lam * s.t))}$`])] };
    } });
  reg({ type: "t4-ai-poisson", unknown: "probability", representation: "words", format: "value", levels: [2], syllabus: ["4.17"], skills: ["AI-AHL4.17.poisson-probability"],
    title: "Poisson probabilities", situationKey: "poisson", situation: sitPois,
    build({ sit: s }) {
      const pa = poisPmf(s.lam, s.k), pb = 1 - poisCdf(s.lam, s.k2 - 1);
      return { params: {}, stem: poisStem(s), parts: [
        P(`Find the probability that there are exactly $${s.k}$ ${s.c.ev} in one ${s.c.per}.`, 2, ans.sf(pa), [`Let $X$ be the number of ${s.c.ev} in one ${s.c.per}: $X \\sim ${Po(s.lam)}$.`, `$\\mathrm{P}(X = ${s.k}) = ${sf(pa)}$`]),
        P(`Find the probability that there are at least $${s.k2}$ ${s.c.ev} in one ${s.c.per}.`, 2, ans.sf(pb, 3, { misconceptions: [{ value: 1 - poisCdf(s.lam, s.k2), text: `At least $${s.k2}$ includes $${s.k2}$ itself: subtract $\\mathrm{P}(X \\le ${s.k2 - 1})$.` }] }), [
          `$\\mathrm{P}(X \\ge ${s.k2}) = 1 - \\mathrm{P}(X \\le ${s.k2 - 1})$`, `$= ${sf(pb)}$`])] };
    } });
  reg({ type: "t4-ai-poisson", unknown: "rescale-and-sum", representation: "words", format: "value", levels: [4], syllabus: ["4.17"], skills: ["AI-AHL4.17.poisson-probability", "AI-AHL4.17.rescale-mean", "AI-AHL4.17.sum-of-poissons"],
    title: "Poisson probabilities over longer periods and for sums", situationKey: "poisson", situation: sitPois,
    build({ sit: s }) {
      const lt = r1(s.lam * s.t), ls = r1(s.lam + s.lam2), j = Math.max(1, Math.round(ls) + s.dj), M = Math.ceil(s.lam);
      const pa = poisPmf(s.lam, s.k), pb = 1 - poisCdf(lt, s.m), pc = poisCdf(ls, j), busy = 1 - poisCdf(s.lam, M), pd = binPmf(s.n, busy, s.r);
      return { params: { j, M }, stem: poisStem(s), parts: [
        P(`Find the probability that there are exactly $${s.k}$ ${s.c.ev} in one ${s.c.per}.`, 1, ans.sf(pa), [`$X \\sim ${Po(s.lam)}$, so $\\mathrm{P}(X = ${s.k}) = ${sf(pa)}$.`]),
        P(`Find the probability that there are more than $${s.m}$ ${s.c.ev} in a period of $${s.t}$ ${s.c.per}s.`, 2, ans.sf(pb), [
          `Over $${s.t}$ ${s.c.per}s the mean is $${s.t} \\times ${num(s.lam)} = ${num(lt)}$, so $Y \\sim ${Po(lt)}$.`, `$\\mathrm{P}(Y > ${s.m}) = 1 - \\mathrm{P}(Y \\le ${s.m}) = ${sf(pb)}$`]),
        P(`Independently, a second stream of ${s.c.ev} arrives at an average rate of $${num(s.lam2)}$ per ${s.c.per}, also following a Poisson distribution. Find the probability that the total number of ${s.c.ev} in the two streams in one ${s.c.per} is at most $${j}$.`, 2, ans.sf(pc), [
          `The sum of independent Poisson variables is Poisson: the total is $${Po(ls)}$.`, `$\\mathrm{P}(\\text{total} \\le ${j}) = ${sf(pc)}$`]),
        P(`A ${s.c.per} is called busy if it has more than $${M}$ ${s.c.ev} from the first stream. Find the probability that exactly $${s.r}$ of $${s.n}$ randomly chosen ${s.c.per}s are busy.`, 2, ans.sf(pd), [
          `$\\mathrm{P}(\\text{busy}) = \\mathrm{P}(X > ${M}) = ${sf(busy, 4)}$`, `The number of busy ${s.c.per}s is $\\mathrm{B}(${s.n},\\, ${sf(busy, 4)})$, so the probability is $${sf(pd)}$.`])] };
    } });
  reg({ type: "t4-ai-poisson", unknown: "find-parameter", representation: "words", format: "value", levels: [4], syllabus: ["4.17"], skills: ["AI-AHL4.17.find-parameter", "AI-AHL4.17.poisson-probability", "AI-AHL4.17.rescale-mean"],
    title: "Find the Poisson mean from a probability",
    build({ rng }) {
      const c = rng.pick(POIS_CTX), p0 = rng.int(30, 450) / 1000, lam = -Math.log(p0), k = Math.max(1, Math.round(lam) + rng.int(0, 1));
      const pb = 1 - poisCdf(lam, k), pc = 1 - Math.sqrt(p0);
      return { params: { p0, k }, stem: `${c.intro} at a constant average rate. The number of ${c.ev} in one ${c.per}, $X$, follows a Poisson distribution with mean $\\lambda$. The probability that there are no ${c.ev} in a given ${c.per} is $${num(p0)}$.`, parts: [
        P("Find the value of $\\lambda$.", 2, ans.sf(lam), [`$\\mathrm{P}(X = 0) = \\mathrm{e}^{-\\lambda} = ${num(p0)}$`, `$\\lambda = -\\ln ${num(p0)} = ${sf(lam)}$`]),
        P(`Find $\\mathrm{P}(X > ${k})$.`, 2, ans.sf(pb), [`$\\mathrm{P}(X > ${k}) = 1 - \\mathrm{P}(X \\le ${k})$ with $\\lambda = ${sf(lam, 4)}$`, `$= ${sf(pb)}$`]),
        P(`Find the probability that there is at least one of these ${c.ev} in half ${/^[aeiou]/.test(c.per) || c.per === "hour" ? "an" : "a"} ${c.per}.`, 2, ans.sf(pc), [
          `For half the time the mean is $\\dfrac{\\lambda}{2} = ${sf(lam / 2, 4)}$.`, `$1 - \\mathrm{e}^{-${sf(lam / 2, 4)}} = ${sf(pc)}$`])] };
    } });
  const MODELS = [
    { id: 0, kind: "poisson", text: "The number of typing errors on a page of a long report, where errors occur independently at a constant average rate." },
    { id: 1, kind: "binomial", text: "The number of faulty bulbs in a box of twenty, where each bulb is faulty independently with the same probability." },
    { id: 2, kind: "normal", text: "The height of a randomly chosen adult woman in a large city." },
    { id: 3, kind: "poisson", text: "The number of meteors seen in an hour on a clear night, where meteors appear independently at a constant average rate." },
    { id: 4, kind: "binomial", text: "The number of heads when a biased coin is flipped fifteen times." },
    { id: 5, kind: "normal", text: "The mass of a randomly chosen apple from a large orchard." },
    { id: 6, kind: "poisson", text: "The number of customers who arrive at a small post office in a ten-minute period, arriving independently at a constant average rate." },
    { id: 7, kind: "binomial", text: "The number of people, out of thirty chosen at random, who are left-handed." }];
  const MODEL_NAME = { poisson: "A Poisson distribution", binomial: "A binomial distribution", normal: "A normal distribution" };
  const MODEL_WHY = { poisson: "Events are counted in a fixed interval, occurring independently at a constant average rate, with no fixed number of trials.", binomial: "There is a fixed number of independent trials, each with the same probability of success.", normal: "The variable is continuous, and values are spread symmetrically about the mean." };
  reg({ type: "t4-ai-poisson-model", unknown: "choose-model", representation: "words", format: "mcq", levels: [1], fixedPool: true, syllabus: ["4.17"], skills: ["AI-AHL4.17.justify-model"],
    title: "Choose between a Poisson, a binomial and a normal model",
    build({ rng }) {
      const c = rng.pick(MODELS), others = Object.keys(MODEL_NAME).filter((k) => k !== c.kind);
      return { params: { id: c.id }, stem: `A random variable is described as follows. ${c.text}`, parts: [
        P("Which distribution is the most suitable model?", 1, ans.choice(rng, { text: MODEL_NAME[c.kind], value: c.kind }, others.map((k) => ({ text: MODEL_NAME[k], value: k, why: `That model needs this: ${MODEL_WHY[k].charAt(0).toLowerCase() + MODEL_WHY[k].slice(1)}` }))), [MODEL_WHY[c.kind]]),
        P("Which statement justifies this choice?", 1, ans.choice(rng, { text: MODEL_WHY[c.kind], value: c.kind }, others.map((k) => ({ text: MODEL_WHY[k], value: k, why: "This does not describe the situation." }))), [MODEL_WHY[c.kind]])] };
    } });

  // ======================= 4.18 tests, critical regions and errors =======================
  const tail = (less) => (less ? "<" : ">");
  reg({ type: "t4-ai-test-mean", unknown: "z-test", representation: "words", format: "value", levels: [2], syllabus: ["4.18"], skills: ["AI-AHL4.18.mean-test"],
    title: "A test for a mean when the standard deviation is known",
    build({ rng }) {
      const c = rng.pick(CI_CTX), mu0 = rng.int(c.mu[0], c.mu[1]) / 10, sd = rng.int(c.sd[0], c.sd[1]) / 10, n = rng.int(10, 40), less = rng.bool(), alpha = rng.pick([0.05, 0.05, 0.01, 0.1]), se = sd / Math.sqrt(n);
      let xbar, p;
      do { xbar = r2(mu0 + (less ? -1 : 1) * (0.7 + 2.3 * rng.next()) * se); const z = (xbar - mu0) / se; p = less ? phi(z) : 1 - phi(z); } while (p < 0.0005 || (p > 0.75 * alpha && p < 1.3 * alpha));
      const alt = `the mean is ${less ? "less" : "greater"} than $${unit(mu0, c.unit)}$`;
      return { params: { mu0, sd, n, less, alpha, xbar }, stem: `${cap(c.x)} is normally distributed with standard deviation $${unit(sd, c.unit)}$. It is claimed that the mean is $${unit(mu0, c.unit)}$, but a researcher believes that ${alt}. ` +
        `A random sample of $${n}$ ${c.item} has mean $${unit(xbar, c.unit)}$. The hypotheses $${H0}: \\mu = ${num(mu0)}$ and $${H1}: \\mu ${tail(less)} ${num(mu0)}$ are tested at the $${pct(alpha * 100)}$ significance level.`, parts: [
        P("Find the $p$-value for the test.", 2, ans.sf(p), ["The population standard deviation is known, so use a $z$-test on the GDC.", `Under $${H0}$, $\\bar{X} \\sim \\mathrm{N}\\left(${num(mu0)},\\, \\dfrac{${num(sd)}^{2}}{${n}}\\right)$, and $p = \\mathrm{P}(\\bar{X} ${tail(less)} ${num(xbar)}) = ${sf(p)}$.`]),
        P("State the conclusion of the test.", 2, conclusion(rng, p < alpha, alt), [compare(p, alpha), p < alpha ? `Reject $${H0}$.` : `Do not reject $${H0}$.`])] };
    } });
  reg({ type: "t4-ai-test-mean", unknown: "t-test", representation: "table", format: "value", levels: [4], syllabus: ["4.18"], skills: ["AI-AHL4.18.mean-test"],
    title: "A t-test for a mean from data",
    build({ rng }) {
      const c = rng.pick(CI_CTX), mu0 = rng.int(c.mu[0], c.mu[1]) / 10, sd = rng.int(c.sd[0], c.sd[1]) / 10, n = rng.int(8, 10), less = rng.bool(), alpha = rng.pick([0.05, 0.05, 0.01, 0.1]);
      let data, p;
      do {
        data = sample(rng, n, mu0 + (less ? -1 : 1) * (0.2 + 1.1 * rng.next()) * sd, sd, 1);
        const t = (mean(data) - mu0) / Math.sqrt(varS(data) / n);
        p = less ? tCdf(t, n - 1) : 1 - tCdf(t, n - 1);
      } while (p < 0.0005 || p > 0.4 || (p > 0.75 * alpha && p < 1.3 * alpha) || data.some((x) => x <= 0.5) || new Set(data).size < n - 1);
      const alt = `the mean is ${less ? "less" : "greater"} than $${unit(mu0, c.unit)}$`, h1 = (rel) => `$${H1}: ${rel} ${num(mu0)}$`;
      return { params: { data, mu0, less, alpha }, stem: `${cap(c.x)} is normally distributed. It is claimed that the mean is $${unit(mu0, c.unit)}$, but a researcher believes that ${alt}. The table shows the values, in ${c.unit}, for a random sample of $${n}$ ${c.item}. ` +
        `A test of $${H0}: \\mu = ${num(mu0)}$ is carried out at the $${pct(alpha * 100)}$ significance level.`, table: { head: ["Value"].concat(data.map((x) => m(num(x)))), rows: [] }, parts: [
        P("Find the mean of the sample.", 1, ans.sf(mean(data)), [`From the GDC, $\\bar{x} = ${sf(mean(data))}$.`]),
        P("Which is the correct alternative hypothesis?", 1, ans.choice(rng, { text: h1(`\\mu ${tail(less)}`), value: less ? "less" : "greater" }, [
          { text: h1(`\\mu ${tail(!less)}`), value: less ? "greater" : "less", why: "The alternative hypothesis states what the researcher believes." }, { text: h1("\\mu \\ne"), value: "two", why: "The researcher's belief has a direction, so the test is one-tailed." },
          { text: h1(`\\bar{x} ${tail(less)}`), value: "sample", why: "Hypotheses are statements about the population mean, not the sample mean." }]), [`The researcher believes that ${alt}, so $${H1}: \\mu ${tail(less)} ${num(mu0)}$.`]),
        P("Find the $p$-value for the test.", 3, ans.sf(p), [`The population standard deviation is not known, so use a one-tailed $t$-test with $${n - 1}$ degrees of freedom on the GDC.`, `$s_{n-1} = ${sf(Math.sqrt(varS(data)), 4)}$ and $t = ${sf((mean(data) - mu0) / Math.sqrt(varS(data) / n), 4)}$`, `$p = ${sf(p)}$`]),
        P("State the conclusion of the test.", 1, conclusion(rng, p < alpha, alt), [compare(p, alpha), p < alpha ? `Reject $${H0}$.` : `Do not reject $${H0}$.`])] };
    } });
  const PAIR_CTX = [
    { who: "runners", label: "Runner", x: "time, in seconds, to run a lap", event: "a training programme", up: false, base: [62, 80], sd: 6, eff: 2.2, noise: 2.2 },
    { who: "typists", label: "Typist", x: "typing speed, in words per minute,", event: "a typing course", up: true, base: [38, 60], sd: 8, eff: 3, noise: 3 },
    { who: "patients", label: "Patient", x: "resting pulse, in beats per minute,", event: "a month of daily exercise", up: false, base: [66, 84], sd: 7, eff: 2.5, noise: 3 },
    { who: "students", label: "Student", x: "score in a vocabulary test", event: "using a revision app", up: true, base: [40, 65], sd: 9, eff: 3, noise: 3.5 }];
  reg({ type: "t4-ai-test-mean", unknown: "paired-test", representation: "table", format: "value", levels: [4], syllabus: ["4.18"], skills: ["AI-AHL4.18.paired-test"],
    title: "A paired-sample t-test",
    build({ rng }) {
      const c = rng.pick(PAIR_CTX), n = 8, alpha = rng.pick([0.05, 0.05, 0.01, 0.1]);
      let before, after, d, p, t;
      do {
        const base = rng.int(c.base[0], c.base[1]);
        before = sample(rng, n, base, c.sd, 0);
        after = before.map((b) => Math.round(b + (c.up ? 1 : -1) * c.eff * (0.2 + rng.next()) + c.noise * gauss(rng)));
        d = after.map((a, i) => a - before[i]);
        t = mean(d) / Math.sqrt(varS(d) / n);
        p = c.up ? 1 - tCdf(t, n - 1) : tCdf(t, n - 1);
      } while (!(varS(d) > 0.5) || p < 0.0005 || p > 0.4 || (p > 0.75 * alpha && p < 1.3 * alpha));
      const alt = `the mean ${c.x.replace(/,? in [a-z ]+,?| to run a lap/, "").trim()} is ${c.up ? "higher" : "lower"} after ${c.event}`;
      return { params: { before, after, up: c.up, alpha }, stem: `The ${c.x} of eight ${c.who} is measured before and after ${c.event}. The results are shown in the table. Let $d$ be the value after minus the value before, and let $\\mu_{d}$ be the population mean of $d$. ` +
        `A test of $${H0}: \\mu_{d} = 0$ against $${H1}: \\mu_{d} ${tail(!c.up)} 0$ is carried out at the $${pct(alpha * 100)}$ significance level.`,
        table: { head: [c.label].concat("ABCDEFGH".split("")), rows: [["Before"].concat(before.map((x) => m(num(x)))), ["After"].concat(after.map((x) => m(num(x))))] }, parts: [
          P("Find the mean of the eight differences $d$.", 1, ans.sf(mean(d)), [`The differences are $${listTex(d)}$.`, `$\\bar{d} = ${sf(mean(d))}$`]),
          P("Find the $p$-value for the test.", 3, ans.sf(p), ["The two samples are matched pairs, so carry out a one-sample $t$-test on the differences.", `With $7$ degrees of freedom, $s_{n-1} = ${sf(Math.sqrt(varS(d)), 4)}$ and $t = ${sf(t, 4)}$.`, `$p = ${sf(p)}$`]),
          P("State the conclusion of the test.", 1, conclusion(rng, p < alpha, alt), [compare(p, alpha), p < alpha ? `Reject $${H0}$.` : `Do not reject $${H0}$.`]),
          P("Which assumption is needed for this test to be valid?", 1, ans.choice(rng, { text: "The differences are normally distributed.", value: "normal-d" }, [
            { text: "The values before and the values after are independent of each other.", value: "indep", why: "The pairs are matched, so the two values for one person are not independent." },
            { text: "The sample contains more than thirty people.", value: "large", why: "A $t$-test is designed for small samples from a normal population." },
            { text: "The values before and the values after have the same mean.", value: "same", why: "That is the hypothesis being tested, not an assumption." }]), ["A $t$-test on the differences needs the differences to come from a normal distribution."])] };
    } });
  const PROP_CTX = [{ claim: "of the seeds of a certain plant germinate", item: "seeds", did: "germinate" }, { claim: "of its customers pay by card", item: "customers", did: "pay by card", org: "A shop claims that" },
    { claim: "of the voters in a town support a new road", item: "voters", did: "support the road" }, { claim: "of the patients given a treatment recover within a week", item: "patients", did: "recover within a week" }];
  reg({ type: "t4-ai-test-proportion", unknown: "p-value", representation: "words", format: "value", levels: [2], syllabus: ["4.18"], skills: ["AI-AHL4.18.proportion-test"],
    title: "A one-tailed binomial test for a proportion",
    build({ rng }) {
      const c = rng.pick(PROP_CTX), alpha = rng.pick([0.05, 0.05, 0.01, 0.1]);
      let n, p0, up, x, p;
      do {
        n = rng.int(20, 60); p0 = rng.pick([0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6]); up = rng.bool();
        x = Math.round(n * p0 + (up ? 1 : -1) * (0.8 + 1.8 * rng.next()) * Math.sqrt(n * p0 * (1 - p0)));
        p = x < 0 || x > n ? 0 : up ? 1 - binCdf(n, p0, x - 1) : binCdf(n, p0, x);
      } while (p < 0.0005 || p > 0.35 || (p > 0.75 * alpha && p < 1.3 * alpha) || p - binPmf(n, p0, x) < 0.05 * p);
      const alt = `the proportion is ${up ? "greater" : "less"} than $${num(p0)}$`;
      return { params: { n, p0, up, x, alpha }, stem: `${c.org || "It is claimed that"} $${pct(Math.round(p0 * 100))}$ ${c.claim}. A researcher believes that ${alt}. In a random sample of $${n}$ ${c.item}, $${x}$ ${c.did}. ` +
        `The hypotheses $${H0}: p = ${num(p0)}$ and $${H1}: p ${tail(!up)} ${num(p0)}$ are tested at the $${pct(alpha * 100)}$ significance level.`, parts: [
        P("Find the $p$-value for the test.", 2, ans.sf(p, 3, { misconceptions: [{ value: binPmf(n, p0, x), text: "The p-value is the probability of this result or a more extreme one, not of this result alone." }] }), [
          `Under $${H0}$ the number in the sample is $X \\sim \\mathrm{B}(${n},\\, ${num(p0)})$.`, up ? `$p = \\mathrm{P}(X \\ge ${x}) = 1 - \\mathrm{P}(X \\le ${x - 1}) = ${sf(p)}$` : `$p = \\mathrm{P}(X \\le ${x}) = ${sf(p)}$`]),
        P("State the conclusion of the test.", 2, conclusion(rng, p < alpha, alt), [compare(p, alpha), p < alpha ? `Reject $${H0}$.` : `Do not reject $${H0}$.`])] };
    } });
  const COR_CTX = [{ x: "daily hours of sunshine", y: "number of ice creams sold, in tens", rows: ["Sunshine, $x$", "Sales, $y$"], pos: true, unit: "days" }, { x: "age of a used car, in years", y: "its price, in thousands of euros", rows: ["Age, $x$", "Price, $y$"], pos: false, unit: "cars" },
    { x: "number of hours of revision", y: "score in a test", rows: ["Revision, $x$", "Score, $y$"], pos: true, unit: "students" }, { x: "height above sea level, in hundreds of metres", y: "noon temperature, in degrees Celsius", rows: ["Height, $x$", "Temperature, $y$"], pos: false, unit: "weather stations" }];
  reg({ type: "t4-ai-test-correlation", unknown: "rho-test", representation: "table", format: "value", levels: [4], syllabus: ["4.18"], skills: ["AI-AHL4.18.correlation-test"],
    title: "Test whether two variables are correlated",
    build({ rng }) {
      const c = rng.pick(COR_CTX), n = 8, alpha = rng.pick([0.05, 0.05, 0.01, 0.1]);
      let xs, ys, r, p;
      do {
        xs = rng.sample([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], n).sort((a, b) => a - b);
        const b = (c.pos ? 1 : -1) * (0.6 + rng.next() * 1.2), a = c.pos ? rng.int(5, 15) : rng.int(28, 40), noise = 2 + 4 * rng.next();
        ys = xs.map((x) => Math.round(a + b * x + noise * gauss(rng)));
        const mx = mean(xs), my = mean(ys), sxy = sum(xs.map((x, i) => (x - mx) * (ys[i] - my))), sxx = sum(xs.map((x) => (x - mx) * (x - mx))), syy = sum(ys.map((y) => (y - my) * (y - my)));
        r = syy > 0 ? sxy / Math.sqrt(sxx * syy) : 0;
        const t = r * Math.sqrt((n - 2) / (1 - r * r));
        p = c.pos ? 1 - tCdf(t, n - 2) : tCdf(t, n - 2);
      } while (!(Math.abs(r) < 0.97) || ys.some((y) => y <= 0) || p < 0.0005 || p > 0.4 || (p > 0.75 * alpha && p < 1.3 * alpha));
      const alt = `there is a ${c.pos ? "positive" : "negative"} correlation between the two variables`;
      return { params: { xs, ys, pos: c.pos, alpha }, stem: `The table shows the ${c.x}, $x$, and the ${c.y}, $y$, for eight randomly chosen ${c.unit}. Both variables are assumed to be normally distributed, and $\\rho$ is the population product moment correlation coefficient. ` +
        `The hypotheses $${H0}: \\rho = 0$ and $${H1}: \\rho ${tail(!c.pos)} 0$ are tested at the $${pct(alpha * 100)}$ significance level.`,
        table: { head: [c.rows[0]].concat(xs.map((x) => m(num(x)))), rows: [[c.rows[1]].concat(ys.map((y) => m(num(y))))] }, parts: [
          P("Find the value of the sample correlation coefficient, $r$.", 2, ans.sf(r), ["Enter the data in the GDC and run the linear regression $t$-test.", `$r = ${sf(r)}$`]),
          P("Find the $p$-value for the test.", 2, ans.sf(p), [`The one-tailed test of $\\rho = 0$ on the GDC gives $p = ${sf(p)}$.`]),
          P("State the conclusion of the test.", 1, conclusion(rng, p < alpha, alt), [compare(p, alpha), p < alpha ? `Reject $${H0}$.` : `Do not reject $${H0}$.`])] };
    } });
  const CR_SK = ["AI-AHL4.18.critical-region", "AI-AHL4.18.error-probability"];
  reg({ type: "t4-ai-critical-region", unknown: "binomial", representation: "words", format: "value", levels: [4], syllabus: ["4.18"], skills: CR_SK.concat(["AI-AHL4.18.proportion-test"]),
    title: "Critical region and error probabilities for a binomial test",
    build({ rng }) {
      const c = rng.pick(PROP_CTX), alpha = rng.pick([0.05, 0.05, 0.01, 0.1]);
      let n, p0, up, crit, size, p1, t2;
      do {
        n = rng.int(20, 50); p0 = rng.pick([0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5]); up = rng.bool(); crit = -1;
        if (up) { for (let k = 0; k <= n; k++) if (1 - binCdf(n, p0, k - 1) < alpha) { crit = k; break; } size = 1 - binCdf(n, p0, crit - 1); p1 = r2(p0 + rng.pick([0.1, 0.15, 0.2, 0.25])); t2 = binCdf(n, p1, crit - 1); }
        else { for (let k = n; k >= 0; k--) if (binCdf(n, p0, k) < alpha) { crit = k; break; } size = crit < 0 ? 0 : binCdf(n, p0, crit); p1 = r2(p0 - rng.pick([0.05, 0.1, 0.15, 0.2])); t2 = crit < 0 || p1 < 0.04 ? 0 : 1 - binCdf(n, p1, crit); }
      } while (crit < 0 || p1 > 0.95 || t2 < 0.02 || t2 > 0.95 || size < 0.0005 || alpha - size < 0.03 * alpha);
      const near = up ? 1 - binCdf(n, p0, crit - 2) : binCdf(n, p0, crit + 1);
      return { params: { n, p0, up, alpha, p1 }, stem: `${c.org || "It is claimed that"} $${pct(Math.round(p0 * 100))}$ ${c.claim}. To test this claim against the alternative that the proportion is ${up ? "greater" : "less"}, a random sample of $${n}$ ${c.item} is taken, and $X$ is the number of them that ${c.did}. ` +
        `The hypotheses are $${H0}: p = ${num(p0)}$ and $${H1}: p ${tail(!up)} ${num(p0)}$, and the significance level is $${pct(alpha * 100)}$.`, parts: [
        P(`The critical region is $X ${up ? "\\ge" : "\\le"} c$, and it is as large as possible. Find the value of $c$.`, 3, ans.int(crit, { misconceptions: [{ value: up ? crit - 1 : crit + 1, text: "The probability of the critical region must be below the significance level." }] }), [
          `Under $${H0}$, $X \\sim \\mathrm{B}(${n},\\, ${num(p0)})$.`, up ? `$\\mathrm{P}(X \\ge ${crit - 1}) = ${sf(near)}$, which is not below $${num(alpha)}$, and $\\mathrm{P}(X \\ge ${crit}) = ${sf(size)}$, which is.` : `$\\mathrm{P}(X \\le ${crit + 1}) = ${sf(near)}$, which is not below $${num(alpha)}$, and $\\mathrm{P}(X \\le ${crit}) = ${sf(size)}$, which is.`, `$c = ${crit}$`]),
        P("Find the probability of a Type I error.", 2, ans.sf(size, 3, { misconceptions: [{ value: alpha, text: "For a discrete test the probability of a Type I error is the actual probability of the critical region, which is below the significance level." }] }), [
          `A Type I error is rejecting $${H0}$ when it is true: $\\mathrm{P}(X ${up ? "\\ge" : "\\le"} ${crit} \\mid p = ${num(p0)}) = ${sf(size)}$.`]),
        P(`The true proportion is in fact $${num(p1)}$. Find the probability of a Type II error.`, 2, ans.sf(t2), [
          `A Type II error is not rejecting $${H0}$ when it is false: $X$ is outside the critical region while $X \\sim \\mathrm{B}(${n},\\, ${num(p1)})$.`, up ? `$\\mathrm{P}(X \\le ${crit - 1}) = ${sf(t2)}$` : `$\\mathrm{P}(X \\ge ${crit + 1}) = ${sf(t2)}$`])] };
    } });
  reg({ type: "t4-ai-critical-region", unknown: "poisson", representation: "words", format: "value", levels: [4], syllabus: ["4.18"], skills: CR_SK.concat(["AI-AHL4.18.poisson-test"]),
    title: "Critical region and error probabilities for a Poisson test",
    build({ rng }) {
      const c = rng.pick(POIS_CTX), alpha = rng.pick([0.05, 0.05, 0.01, 0.1]);
      let r0, d, l0, up, crit, size, r1v, l1, t2;
      do {
        r0 = rng.int(5, 30) / 10; d = rng.int(2, 8); l0 = r1(r0 * d); up = rng.bool(); crit = -1;
        if (up) { for (let k = 0; k < 80; k++) if (1 - poisCdf(l0, k - 1) < alpha) { crit = k; break; } size = 1 - poisCdf(l0, crit - 1); r1v = r1(r0 * (1.3 + 0.7 * rng.next())); l1 = r1(r1v * d); t2 = poisCdf(l1, crit - 1); }
        else { for (let k = 80; k >= 0; k--) if (poisCdf(l0, k) < alpha) { crit = k; break; } size = crit < 0 ? 0 : poisCdf(l0, crit); r1v = r1(r0 * (0.3 + 0.4 * rng.next())); l1 = r1(r1v * d); t2 = crit < 0 || l1 <= 0 ? 0 : 1 - poisCdf(l1, crit); }
      } while (l0 < 3 || l0 > 18 || crit < 0 || r1v === r0 || t2 < 0.02 || t2 > 0.95 || size < 0.0005 || alpha - size < 0.03 * alpha);
      const near = up ? 1 - poisCdf(l0, crit - 2) : poisCdf(l0, crit + 1);
      return { params: { r0, d, up, alpha, r1: r1v }, stem: `${c.intro} at an average rate of $${num(r0)}$ per ${c.per}, following a Poisson distribution. A manager believes that the rate has ${up ? "increased" : "decreased"}. To test this, the number of ${c.ev}, $X$, in a period of $${d}$ ${c.per}s is recorded. ` +
        `With $\\lambda$ the mean number in $${d}$ ${c.per}s, the hypotheses are $${H0}: \\lambda = ${num(l0)}$ and $${H1}: \\lambda ${tail(!up)} ${num(l0)}$, and the significance level is $${pct(alpha * 100)}$.`, parts: [
        P(`The critical region is $X ${up ? "\\ge" : "\\le"} c$, and it is as large as possible. Find the value of $c$.`, 3, ans.int(crit, { misconceptions: [{ value: up ? crit - 1 : crit + 1, text: "The probability of the critical region must be below the significance level." }] }), [
          `Under $${H0}$, $X \\sim ${Po(l0)}$.`, up ? `$\\mathrm{P}(X \\ge ${crit - 1}) = ${sf(near)}$, which is not below $${num(alpha)}$, and $\\mathrm{P}(X \\ge ${crit}) = ${sf(size)}$, which is.` : `$\\mathrm{P}(X \\le ${crit + 1}) = ${sf(near)}$, which is not below $${num(alpha)}$, and $\\mathrm{P}(X \\le ${crit}) = ${sf(size)}$, which is.`, `$c = ${crit}$`]),
        P("Find the probability of a Type I error.", 2, ans.sf(size, 3, { misconceptions: [{ value: alpha, text: "For a discrete test the probability of a Type I error is the actual probability of the critical region, which is below the significance level." }] }), [
          `$\\mathrm{P}(X ${up ? "\\ge" : "\\le"} ${crit} \\mid \\lambda = ${num(l0)}) = ${sf(size)}$`]),
        P(`The rate is in fact $${num(r1v)}$ per ${c.per}. Find the probability of a Type II error.`, 2, ans.sf(t2), [
          `The mean in $${d}$ ${c.per}s is now $${d} \\times ${num(r1v)} = ${num(l1)}$, so $X \\sim ${Po(l1)}$.`, `A Type II error is $X$ falling outside the critical region: ${up ? `$\\mathrm{P}(X \\le ${crit - 1}) = ${sf(t2)}$` : `$\\mathrm{P}(X \\ge ${crit + 1}) = ${sf(t2)}$`}.`])] };
    } });
  reg({ type: "t4-ai-critical-region", unknown: "normal", representation: "words", format: "value", levels: [4], syllabus: ["4.18"], skills: CR_SK.concat(["AI-AHL4.18.mean-test"]),
    title: "Critical region and error probabilities for a test of a mean",
    build({ rng }) {
      const c = rng.pick(CI_CTX), mu0 = rng.int(c.mu[0], c.mu[1]) / 10, sd = rng.int(c.sd[0], c.sd[1]) / 10, n = rng.pick([9, 12, 16, 20, 25, 30, 36]), up = rng.bool(), alpha = rng.pick([0.05, 0.05, 0.01, 0.1]), se = sd / Math.sqrt(n);
      const z = invPhi(1 - alpha), crit = mu0 + (up ? 1 : -1) * z * se, mu1 = r1(mu0 + (up ? 1 : -1) * Math.max(0.1, (0.5 + 1.3 * rng.next()) * z * se));
      const t2 = up ? phi((crit - mu1) / se) : 1 - phi((crit - mu1) / se);
      return { params: { mu0, sd, n, up, alpha, mu1 }, stem: `${cap(c.x)} is normally distributed with standard deviation $${unit(sd, c.unit)}$. A test of $${H0}: \\mu = ${num(mu0)}$ against $${H1}: \\mu ${tail(!up)} ${num(mu0)}$ is carried out at the $${pct(alpha * 100)}$ significance level, using the mean $\\bar{X}$ of a random sample of $${n}$ ${c.item}.`, parts: [
        P(`The critical region is $\\bar{X} ${tail(!up)} c$. Find the value of $c$.`, 3, ans.sf(crit), [
          `Under $${H0}$, $\\bar{X} \\sim \\mathrm{N}\\left(${num(mu0)},\\, \\dfrac{${num(sd)}^{2}}{${n}}\\right)$.`, `$c$ satisfies $\\mathrm{P}(\\bar{X} ${tail(!up)} c) = ${num(alpha)}$; use the inverse normal function.`, `$c = ${sf(crit, 5)}$, which is $${sf(crit)}$ to three significant figures.`]),
        P("Write down the probability of a Type I error.", 1, ans.dec(alpha), [`For a continuous test statistic this is the significance level, $${num(alpha)}$.`]),
        P(`The true mean is in fact $${unit(mu1, c.unit)}$. Find the probability of a Type II error.`, 3, ans.sf(t2), [
          `Now $\\bar{X} \\sim \\mathrm{N}\\left(${num(mu1)},\\, \\dfrac{${num(sd)}^{2}}{${n}}\\right)$.`, `A Type II error is $\\bar{X}$ falling outside the critical region: $\\mathrm{P}(\\bar{X} ${tail(up)} ${sf(crit, 5)})$.`, `$= ${sf(t2)}$`])] };
    } });
  const TE = [
    { id: 0, h0: "a new medicine is no better than the existing one", h1: "the new medicine is better" }, { id: 1, h0: "a coin is fair", h1: "the coin is biased towards heads" },
    { id: 2, h0: "the mean mass of the bags filled by a machine is as stated on the label", h1: "the mean mass is less than stated" }, { id: 3, h0: "the pollution in a river is within the legal limit", h1: "the pollution is above the legal limit" },
    { id: 4, h0: "a new fertiliser does not change the mean yield of a crop", h1: "the fertiliser increases the mean yield" }];
  reg({ type: "t4-ai-type-errors", unknown: "identify", representation: "words", format: "mcq", levels: [1], fixedPool: true, syllabus: ["4.18"], skills: ["AI-AHL4.18.errors-in-context"],
    title: "Type I and Type II errors in context",
    build({ rng }) {
      const c = rng.pick(TE);
      const o = { I: `Concluding that ${c.h1} when in fact ${c.h0}.`, II: `Not rejecting the claim that ${c.h0} when in fact ${c.h1}.`, ok1: `Concluding that ${c.h1} when in fact ${c.h1}.`, ok0: `Not rejecting the claim that ${c.h0} when in fact ${c.h0}.` };
      const why = { I: "This is a Type I error: a true hypothesis is rejected.", II: "This is a Type II error: a false hypothesis is not rejected.", ok1: "This is a correct decision.", ok0: "This is a correct decision." };
      const ch = (k) => ans.choice(rng, { text: o[k], value: k }, Object.keys(o).filter((x) => x !== k).map((x) => ({ text: o[x], value: x, why: why[x] })));
      return { params: { id: c.id }, stem: `A hypothesis test is carried out with $${H0}$: ${c.h0}, and $${H1}$: ${c.h1}.`, parts: [
        P("Which of the following describes a Type I error?", 1, ch("I"), [`A Type I error is rejecting $${H0}$ when $${H0}$ is true.`, o.I]),
        P("Which of the following describes a Type II error?", 1, ch("II"), [`A Type II error is not rejecting $${H0}$ when $${H0}$ is false.`, o.II])] };
    } });

  // ======================= 4.19 Markov chains =======================
  const MK2 = [
    { A: "Alpha", B: "Beta", unit: "month", intro: "The customers of two phone companies, Alpha and Beta, may switch company each month.", who: "a customer", verb: "is with", pl: "are with" },
    { A: "the bus", B: "the train", unit: "week", intro: "The commuters of a city travel by bus or by train, and may change each week.", who: "a commuter", verb: "uses", pl: "use" },
    { A: "the gym", B: "the pool", unit: "day", intro: "Each day, every member of a sports club chooses either the gym or the pool.", who: "a member", verb: "chooses", pl: "choose" }];
  function sitMk2(rng) { let p, q; do { p = rng.int(1, 6); q = rng.int(1, 6); } while (p === q); return { c: rng.pick(MK2), p, q }; }
  const mkStem = (s) => `${s.c.intro} Of those who ${s.c.pl} ${s.c.A} in one ${s.c.unit}, $${pct(s.p * 10)}$ change to ${s.c.B} in the next ${s.c.unit}. Of those who ${s.c.pl} ${s.c.B}, $${pct(s.q * 10)}$ change to ${s.c.A}. The rest do not change.`;
  reg({ type: "t4-ai-markov", unknown: "matrix-entry", representation: "words", format: "value", levels: [1], syllabus: ["4.19"], skills: ["AI-AHL4.19.transition-matrix"], niceOk: true,
    title: "Entries of a transition matrix", situationKey: "markov-two", situation: sitMk2,
    build({ sit: s }) {
      const p = s.p / 10, q = s.q / 10;
      return { params: {}, stem: mkStem(s) + ` The transition matrix is $\\boldsymbol{T}$, where $T_{ij}$ is the probability of moving to state $i$ from state $j$. State $1$ is ${s.c.A} and state $2$ is ${s.c.B}.`, parts: [
        P("Write down $T_{11}$.", 1, ans.dec(r1(1 - p)), [`$T_{11}$ is the probability of staying with ${s.c.A}: $1 - ${num(p)} = ${num(r1(1 - p))}$.`]),
        P("Write down $T_{12}$.", 1, ans.dec(q, { misconceptions: [{ value: p, text: "$T_{12}$ is the probability of moving to state $1$ from state $2$: the column is where you start." }] }), [`$T_{12}$ is the probability of moving to ${s.c.A} from ${s.c.B}: $${num(q)}$.`, `$\\boldsymbol{T} = ${mat([[num(r1(1 - p)), num(q)], [num(p), num(r1(1 - q))]])}$`])] };
    } });
  reg({ type: "t4-ai-markov", unknown: "n-step", representation: "words", format: "value", levels: [2], syllabus: ["4.19"], skills: ["AI-AHL4.19.n-step", "AI-AHL4.19.transition-matrix"],
    title: "Probabilities after two and three steps", situationKey: "markov-two", situation: sitMk2,
    build({ sit: s }) {
      const p = s.p / 10, q = s.q / 10, step = (v) => [(1 - p) * v[0] + q * v[1], p * v[0] + (1 - q) * v[1]], v2 = step(step([1, 0])), v3 = step(v2);
      const T = mat([[num(r1(1 - p)), num(q)], [num(p), num(r1(1 - q))]]);
      return { params: {}, stem: mkStem(s) + ` At present ${s.c.who} ${s.c.verb} ${s.c.A}.`, parts: [
        P(`Find the probability that this person ${s.c.verb} ${s.c.A} two ${s.c.unit}s from now.`, 2, ans.sf(v2[0]), [`With the columns as the present state, $\\boldsymbol{T} = ${T}$.`, `The first entry of $\\boldsymbol{T}^{2}\\begin{pmatrix} 1 \\\\ 0 \\end{pmatrix}$ is $${num(r1(1 - p))}^{2} + ${num(q)}${br(p)} = ${sf(v2[0])}$.`]),
        P(`Find the probability that this person ${s.c.verb} ${s.c.A} three ${s.c.unit}s from now.`, 2, ans.sf(v3[0]), [`The first entry of $\\boldsymbol{T}^{3}\\begin{pmatrix} 1 \\\\ 0 \\end{pmatrix}$ is $${sf(v3[0])}$.`])] };
    } });
  reg({ type: "t4-ai-markov", unknown: "steady-state-exact", representation: "words", format: "value", levels: [3], syllabus: ["4.19"], skills: ["AI-AHL4.19.steady-state", "AI-AHL4.19.n-step"],
    title: "A two-step probability and the steady state, exactly", situationKey: "markov-two", situation: sitMk2,
    build({ sit: s }) {
      const p = s.p / 10, q = s.q / 10, two = ((10 - s.p) * (10 - s.p) + s.p * s.q) / 100;
      return { params: {}, stem: mkStem(s) + ` At present ${s.c.who} ${s.c.verb} ${s.c.A}.`, parts: [
        P(`Find the probability that this person ${s.c.verb} ${s.c.A} two ${s.c.unit}s from now.`, 2, ans.dec(two), [`Either stay twice, or change and change back: $${num(r1(1 - p))}^{2} + ${num(p)}${br(q)}$.`, `$= ${num(two)}$`]),
        P(`Find the proportion of people who ${s.c.pl} ${s.c.A} in the long term.`, 3, ans.frac(s.q, s.p + s.q), [
          `In the steady state the proportion $a$ with ${s.c.A} does not change: $a = ${num(r1(1 - p))}a + ${num(q)}(1 - a)$.`, `$${coef(r1(p + q), "a")} = ${num(q)}$`, `$a = ${frac(s.q, s.p + s.q)}$`])] };
    } });
  const MK3 = [{ intro: "A city has three bike stations, A, B and C. Each day every bike is ridden once and left at one of the stations.", thing: "bikes", unit: "day", at: "at station" },
    { intro: "Three supermarkets, A, B and C, share the shoppers of a town. Each week every shopper uses one of them.", thing: "shoppers", unit: "week", at: "using supermarket" },
    { intro: "Three mobile networks, A, B and C, share the customers of a region. Each year every customer chooses one network.", thing: "customers", unit: "year", at: "with network" }];
  reg({ type: "t4-ai-markov", unknown: "three-state", representation: "equation", format: "value", levels: [4], syllabus: ["4.19"], skills: ["AI-AHL4.19.n-step", "AI-AHL4.19.steady-state", "AI-AHL4.19.interpret-model"],
    title: "A three-state Markov chain: after n steps and in the long term",
    build({ rng }) {
      const c = rng.pick(MK3), cols = [0, 1, 2].map((j) => { const stay = rng.int(10, 16), a = rng.int(1, 19 - stay), col = [0, 0, 0]; col[j] = stay; col[(j + 1) % 3] = a; col[(j + 2) % 3] = 20 - stay - a; return col; });
      const T = [0, 1, 2].map((i) => cols.map((col) => col[i] / 20)), init = [0, 1, 2].map(() => 100 * rng.int(1, 5)), n = rng.int(3, 6), total = sum(init);
      const step = (v) => T.map((row) => row[0] * v[0] + row[1] * v[1] + row[2] * v[2]);
      let v = init.slice(), one, vn;
      for (let k = 1; k <= 600; k++) { v = step(v); if (k === 1) one = v.slice(); if (k === n) vn = v.slice(); }
      return { params: { T, init, n }, stem: `${c.intro} The movement from one ${c.unit} to the next is described by the transition matrix $\\boldsymbol{T} = ${mat(T.map((row) => row.map((x) => num(x))))}$, where the columns give the present state and the rows the next state, each in the order A, B, C. ` +
        `At the start there are $${init[0]}$ ${c.thing} ${c.at} A, $${init[1]}$ ${c.at} B and $${init[2]}$ ${c.at} C.`, parts: [
        P(`Find the number of ${c.thing} ${c.at} A after one ${c.unit}.`, 2, ans.int(Math.round(one[0])), [`Multiply the first row of $\\boldsymbol{T}$ by the starting numbers: $${num(T[0][0])}${br(init[0])} + ${num(T[0][1])}${br(init[1])} + ${num(T[0][2])}${br(init[2])} = ${num(Math.round(one[0]))}$.`]),
        P(`Find the expected number of ${c.thing} ${c.at} B after $${n}$ ${c.unit}s.`, 2, ans.sf(vn[1]), [`$\\boldsymbol{s}_{${n}} = \\boldsymbol{T}^{${n}}\\boldsymbol{s}_{0}$, found on the GDC.`, `The second entry is $${sf(vn[1])}$.`]),
        P(`Find the expected number of ${c.thing} ${c.at} C in the long term.`, 3, ans.sf(v[2]), [
          "Raise $\\boldsymbol{T}$ to a high power: every column tends to the steady-state probabilities.", `The steady-state probabilities are $${sf(v[0] / total)}$, $${sf(v[1] / total)}$ and $${sf(v[2] / total)}$.`, `$${sf(v[2] / total, 5)} \\times ${num(total)} = ${sf(v[2])}$`])] };
    } });

  /*NEXT*/
})(typeof globalThis !== "undefined" ? globalThis : this);
