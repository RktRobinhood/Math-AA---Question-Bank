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

  /*NEXT*/
})(typeof globalThis !== "undefined" ? globalThis : this);
