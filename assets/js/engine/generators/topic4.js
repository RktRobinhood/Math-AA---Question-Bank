/* Topic 4 (Statistics and probability) generators. Self-contained: needs only engine.js.
   Each generator's independent verifier is in scripts/engine-checks/topic4.mjs under the same id.
   `source` names the old practice template a generator was ported from. */
(function (root) {
  "use strict";
  const E = root.QBEngine;
  const { ans, fmt } = E;
  const { num, frac, signed, br, paren, expr, m, sf, coef, rat, unit, pct } = fmt;
  const P = (prompt, marks, answer, working) => ({ prompt, marks, answer, working });
  const reg = (def) => E.register(Object.assign({ courses: ["aa-sl"], calculator: false }, def));

  // P(Z < z) for the standard normal, by the series z + z^3/3 + z^5/(3*5) + ... times the density.
  function phi(z) {
    if (z < -8) return 0;
    if (z > 8) return 1;
    let term = z, sum = z;
    for (let k = 1; k < 400; k++) { term *= (z * z) / (2 * k + 1); sum += term; if (Math.abs(term) < 1e-17) break; }
    return 0.5 + (sum * Math.exp((-z * z) / 2)) / Math.sqrt(2 * Math.PI);
  }
  // z with P(Z < z) = p, by Newton's method on phi.
  function invPhi(p) {
    let z = 0;
    for (let i = 0; i < 60; i++) z -= (phi(z) - p) / (Math.exp((-z * z) / 2) / Math.sqrt(2 * Math.PI));
    return z;
  }
  const nCr = (n, r) => { let v = 1; for (let i = 0; i < r; i++) v = (v * (n - i)) / (i + 1); return Math.round(v); };
  const median = (s) => (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2);
  const sorted = (rng, n, lo, hi) => Array.from({ length: n }, () => rng.int(lo, hi)).sort((a, b) => a - b);
  const listTex = (xs) => xs.map((x) => num(x)).join(",\\ ");

  // ======================= 4.1 sampling =======================
  reg({ type: "t4-sampling", syllabus: ["4.1"], representation: "words", format: "mcq", unknown: "better-method", levels: [2], fixedPool: true,
    skills: ["SL4.1.bias-reliability", "SL4.1.sampling-technique"], title: "Spot the bias and choose a better sampling method", source: "sampling-bias-method",
    build({ rng }) {
      const c = rng.pick([
        { pop: "all the students in a school", bad: "asking only the members of the mathematics club", missed: "students who are not in the club",
          good: "Take a stratified sample, with students chosen at random from every year group.", poor: ["Ask the first students to arrive at the library.", "Ask only the students in one class.", "Let students choose whether to answer an online form."] },
        { pop: "all the members of a gym", bad: "asking only the people who train early in the morning", missed: "members who train at other times",
          good: "Take a systematic sample from the full membership list, with a random starting point.", poor: ["Ask the people using one machine.", "Ask only the members who are friends of the staff.", "Put a form on the counter for anyone who wants to fill it in."] },
        { pop: "all the households in a town", bad: "posting an optional survey on the town website", missed: "households that do not visit the website or choose not to answer",
          good: "Choose households at random from the full register of addresses.", poor: ["Knock on the doors in one street.", "Ask the people at the town market on one morning.", "Ask the households nearest the town hall."] },
        { pop: "all the passengers who use a railway station", bad: "asking only passengers who are waiting on one platform on a Sunday", missed: "passengers who travel on other days or from other platforms",
          good: "Choose times and platforms at random across the whole week and ask passengers at each.", poor: ["Ask the passengers in the first-class lounge.", "Ask only people buying coffee at the kiosk.", "Ask the staff what passengers think."] }]);
      return { params: { pop: c.pop }, stem: `A researcher wants to find out the opinion of ${c.pop}. The researcher plans to collect data by ${c.bad}.`, parts: [
        P("Which statement best explains why this method is likely to be biased?", 2, ans.choice(rng, { text: `It leaves out ${c.missed}, whose opinions may be different.`, value: "bias" }, [
          { text: "The sample is too large to analyse.", value: "size", why: "A large sample is not a source of bias." },
          { text: "Every member of the population is equally likely to be chosen.", value: "random", why: "That would describe a random sample, which is not biased." },
          { text: "The researcher has not said what the opinion is about.", value: "topic", why: "Bias comes from who is asked, not from the topic." }]), [
          `A sample should represent ${c.pop}.`, `This method leaves out ${c.missed}, so some opinions are missed.`]),
        P("Which method would give a more reliable result?", 2, ans.choice(rng, { text: c.good, value: "good" }, c.poor.map((t) => ({ text: t, value: "poor", why: "This still reaches only part of the population, chosen by convenience." }))), [
          "A reliable method gives every part of the population a planned chance of being chosen.", c.good])] };
    } });

  // ======================= 4.2 and 4.3 data =======================
  reg({ type: "t4-outlier-rule", syllabus: ["4.2", "4.3"], representation: "equation", format: "value", unknown: "outliers-in-data", levels: [3],
    skills: ["SL4.2.outlier-test", "SL4.3.quartiles-discrete", "SL4.2.box-plot"], title: "Quartiles, the interquartile range and outliers", source: "boxplot-outlier-iqr",
    build({ rng }) {
      const base = rng.int(4, 22), body = sorted(rng, 8, base, base + 14);
      const q1b = (body[1] + body[2]) / 2, q3b = (body[6] + body[7]) / 2;
      // the largest value is either a clear outlier or clearly not one
      const far = rng.bool(0.6), top = far ? Math.ceil(q3b + 1.5 * (q3b - q1b) + rng.int(4, 9)) : body[7] + rng.int(0, 1);
      const data = body.concat([Math.max(top, body[7])]);
      const med = data[4], q1 = (data[1] + data[2]) / 2, q3 = (data[6] + data[7]) / 2, iqr = q3 - q1, fence = q3 + 1.5 * iqr, n = data.filter((x) => x > fence).length;
      return { params: { data }, stem: `Nine values, in order, are $${listTex(data)}$.`, parts: [
        P("Write down the median.", 1, ans.dec(med), [`The median is the fifth of the nine values: $${num(med)}$.`]),
        P("Find the lower quartile, $Q_{1}$.", 1, ans.dec(q1), [`$Q_{1}$ is the median of the four values below the median: $\\dfrac{${data[1]} + ${data[2]}}{2} = ${num(q1)}$`]),
        P("Find the upper quartile, $Q_{3}$.", 1, ans.dec(q3), [`$Q_{3}$ is the median of the four values above the median: $\\dfrac{${data[6]} + ${data[7]}}{2} = ${num(q3)}$`]),
        P("Find the interquartile range.", 1, ans.dec(iqr), [`$\\text{IQR} = Q_{3} - Q_{1} = ${num(q3)} - ${num(q1)} = ${num(iqr)}$`]),
        P("A value is an outlier if it is more than $1.5 \\times \\text{IQR}$ above $Q_{3}$. Find the largest value that a data point can take without being an outlier of this kind.", 2, ans.dec(fence), [
          `$Q_{3} + 1.5 \\times \\text{IQR} = ${num(q3)} + 1.5 \\times ${num(iqr)}$`, `The boundary is $${num(fence)}$.`]),
        P("Write down the number of values in the data set that are outliers of this kind.", 1, ans.int(n), [
          n ? `Only $${listTex(data.filter((x) => x > fence))}$ is greater than $${num(fence)}$, so there is $${n}$ outlier.` : `No value is greater than $${num(fence)}$, so there are $0$ outliers.`])] };
    } });
  reg({ type: "t4-summary-statistics", syllabus: ["4.3"], representation: "equation", format: "value", unknown: "iqr-of-data", levels: [3],
    skills: ["SL4.3.mean-median-mode", "SL4.3.quartiles-discrete"], title: "Mean, median and interquartile range of a data set", source: "descriptive-stats",
    build({ rng }) {
      const n = rng.pick([8, 10, 12]), base = rng.int(5, 30);
      let data, total;
      do { data = sorted(rng, n, base, base + 12); total = data.reduce((s, x) => s + x, 0); } while ((total * 4) % n !== 0);
      const h = n / 2, q1 = median(data.slice(0, h)), q3 = median(data.slice(n - h)), med = median(data), mean = total / n;
      return { params: { data }, stem: `A data set has $${n}$ values. In order, they are $${listTex(data)}$.`, parts: [
        P("Find the mean.", 2, ans.dec(mean), [`The sum of the values is $${total}$.`, `Mean $= \\dfrac{${total}}{${n}} = ${num(mean)}$`]),
        P("Find the median.", 1, ans.dec(med), [`The median is the mean of the two middle values: $\\dfrac{${data[h - 1]} + ${data[h]}}{2} = ${num(med)}$`]),
        P("Find the interquartile range.", 2, ans.dec(q3 - q1), [
          `$Q_{1}$ is the median of the lower $${h}$ values, $${num(q1)}$, and $Q_{3}$ is the median of the upper $${h}$ values, $${num(q3)}$.`, `$\\text{IQR} = ${num(q3)} - ${num(q1)} = ${num(q3 - q1)}$`])] };
    } });

  // ======================= 4.4 regression =======================
  reg({ type: "t4-regression-interpret", syllabus: ["4.4"], representation: "equation", format: "mcq", unknown: "read-estimate", levels: [4], calculator: true, niceOk: true,
    skills: ["SL4.4.predict", "SL4.4.pearson-r", "SL4.4.interpret-ab"], title: "Use a regression line and interpret the correlation coefficient", source: "regression-prediction",
    build({ rng }) {
      const pos = rng.bool(), mm = (pos ? 1 : -1) * rng.pick([1.8, 2.4, 1.5, 2.2, 0.85, 3.1]), c = rng.pick([4, 10, 25, 31.5, 48]), x = rng.pick([6, 8, 12, 15, 9]);
      const pred = Number((mm * x + c).toFixed(4)), diff = rng.pick([-3.5, -2, 2, 4, 1.5]), actual = Number((pred + diff).toFixed(4));
      const r = (pos ? 1 : -1) * rng.pick([0.82, 0.88, 0.93, 0.79, 0.96]);
      const word = (s, d) => `a ${s} ${d} linear correlation`;
      return { params: { mm, c, x, actual, r }, stem: `For a set of paired data, the regression line of $y$ on $x$ is $y = ${expr([[mm, "x"], [c, ""]])}$. Pearson's product-moment correlation coefficient is $r = ${num(r)}$.`, parts: [
        P(`Use the regression line to estimate the value of $y$ when $x = ${x}$.`, 2, ans.dec(pred), [`$y = ${num(mm)}${br(x)} + ${num(c)}$`, `$y = ${num(pred)}$`]),
        P(`The measured value of $y$ when $x = ${x}$ is $${num(actual)}$. Find the measured value minus the estimate.`, 2, ans.dec(diff), [`$${num(actual)} - ${paren(pred)} = ${num(diff)}$`]),
        P("Which phrase describes the correlation between $x$ and $y$?", 1, ans.choice(rng, { text: word("strong", pos ? "positive" : "negative"), value: [1, pos ? 1 : -1] }, [
          { text: word("strong", pos ? "negative" : "positive"), value: [1, pos ? -1 : 1], why: "The sign of $r$ gives the direction of the correlation." },
          { text: word("weak", pos ? "positive" : "negative"), value: [0, pos ? 1 : -1], why: "A value of $r$ close to $1$ or $-1$ is strong, not weak." },
          { text: "no linear correlation", value: [0, 0], why: "That would need $r$ close to $0$." }]), [
          `$r = ${num(r)}$ is close to $${pos ? 1 : -1}$, so there is ${word("strong", pos ? "positive" : "negative")}.`])] };
    } });

  // ======================= 4.5 and 4.6 probability =======================
  reg({ type: "t4-expected-occurrences", syllabus: ["4.5"], representation: "words", format: "value", unknown: "expected-count", levels: [2],
    skills: ["SL4.5.expected-occurrences", "SL4.5.complement"], title: "Expected numbers from a probability", source: "expected-number-probability",
    build({ rng }) {
      const n = rng.pick([80, 120, 150, 200, 240, 300, 360]), p = rng.pick([0.15, 0.2, 0.35, 0.45, 0.6, 0.05, 0.3]), e = Number((n * p).toFixed(4));
      const what = rng.pick([["student at a school", "walks to school", "students"], ["seed in a packet", "fails to grow", "seeds"], ["customer of a cafe", "orders tea", "customers"], ["bolt made by a machine", "is too long", "bolts"]]);
      return { params: { n, p }, stem: `The probability that a randomly chosen ${what[0]} ${what[1]} is $${num(p)}$. There are $${n}$ ${what[2]}.`, parts: [
        P(`Find the expected number of ${what[2]} for which this happens.`, 2, ans.dec(e), [`Expected number $= np = ${n} \\times ${num(p)}$`, `Expected number $= ${num(e)}$`]),
        P(`Find the expected number of ${what[2]} for which this does not happen.`, 2, ans.dec(n - e), [`The probability of the complement is $1 - ${num(p)} = ${num(1 - p)}$.`, `Expected number $= ${n} \\times ${num(1 - p)} = ${num(n - e)}$`])] };
    } });
  reg({ type: "t4-conditional-probability", syllabus: ["4.6", "4.11"], representation: "words", format: "value", unknown: "reverse-from-tree", levels: [4], calculator: true,
    skills: ["SL4.6.tree", "SL4.11.reverse-conditional", "SL4.11.conditional-formula"], title: "A test for a condition: total and reverse conditional probability", source: "conditional-tree-section-b",
    build({ rng }) {
      const pD = rng.pick([0.04, 0.06, 0.08, 0.03, 0.12]), sens = rng.pick([0.88, 0.9, 0.94, 0.97]), fp = rng.pick([0.05, 0.08, 0.1, 0.02]);
      const pPos = pD * sens + (1 - pD) * fp, post = (pD * sens) / pPos;
      return { params: { pD, sens, fp }, stem: `A test is used to detect a condition. Let $D$ be the event that a person has the condition and $T$ the event that the person tests positive. It is given that $\\mathrm{P}(D) = ${num(pD)}$, $\\mathrm{P}(T \\mid D) = ${num(sens)}$ and $\\mathrm{P}(T \\mid D') = ${num(fp)}$.`, parts: [
        P("Find the probability that a randomly chosen person tests positive.", 3, ans.sf(pPos), [
          `$\\mathrm{P}(T) = \\mathrm{P}(D)\\,\\mathrm{P}(T \\mid D) + \\mathrm{P}(D')\\,\\mathrm{P}(T \\mid D')$`, `$\\mathrm{P}(T) = ${num(pD)} \\times ${num(sens)} + ${num(1 - pD)} \\times ${num(fp)}$`, `$\\mathrm{P}(T) = ${sf(pPos)}$`]),
        P("Given that a person tests positive, find the probability that the person has the condition.", 3, ans.sf(post), [
          `$\\mathrm{P}(D \\mid T) = \\dfrac{\\mathrm{P}(D \\cap T)}{\\mathrm{P}(T)} = \\dfrac{${num(pD)} \\times ${num(sens)}}{${num(Number(pPos.toPrecision(5)))}}$`, `$\\mathrm{P}(D \\mid T) = ${sf(post)}$`])] };
    } });
  reg({ type: "t4-independence", syllabus: ["4.6", "4.11"], representation: "equation", format: "mcq", unknown: "test-from-probabilities", levels: [4], calculator: true,
    skills: ["SL4.6.union", "SL4.11.conditional-formula", "SL4.11.test-independence"], title: "Union, conditional probability and a test for independence", source: "venn-conditional-independence",
    build({ rng }) {
      const indep = rng.bool();
      let pA, pB, pAB;
      do {
        pA = rng.pick([0.42, 0.55, 0.36, 0.48, 0.64, 0.7]); pB = rng.pick([0.35, 0.45, 0.25, 0.52, 0.3, 0.15]);
        pAB = Number((indep ? pA * pB : pA * pB + rng.pick([0.04, -0.05, 0.06, -0.03])).toFixed(4));
      } while (pAB <= 0.01 || pAB >= Math.min(pA, pB) - 0.01 || pA + pB - pAB >= 0.99);
      const union = pA + pB - pAB, cond = pAB / pB;
      return { params: { pA, pB, pAB }, stem: `For events $A$ and $B$, $\\mathrm{P}(A) = ${num(pA)}$, $\\mathrm{P}(B) = ${num(pB)}$ and $\\mathrm{P}(A \\cap B) = ${num(pAB)}$.`, parts: [
        P("Find $\\mathrm{P}(A \\cup B)$.", 2, ans.sf(union), [`$\\mathrm{P}(A \\cup B) = \\mathrm{P}(A) + \\mathrm{P}(B) - \\mathrm{P}(A \\cap B) = ${num(pA)} + ${num(pB)} - ${num(pAB)}$`, `$\\mathrm{P}(A \\cup B) = ${sf(union)}$`]),
        P("Find $\\mathrm{P}(A \\mid B)$.", 2, ans.sf(cond), [`$\\mathrm{P}(A \\mid B) = \\dfrac{\\mathrm{P}(A \\cap B)}{\\mathrm{P}(B)} = \\dfrac{${num(pAB)}}{${num(pB)}}$`, `$\\mathrm{P}(A \\mid B) = ${sf(cond)}$`]),
        P("Are the events $A$ and $B$ independent?", 2, ans.choice(rng, indep ? { text: "Yes, because $\\mathrm{P}(A \\cap B) = \\mathrm{P}(A)\\,\\mathrm{P}(B)$.", value: [true, true] } : { text: "No, because $\\mathrm{P}(A \\cap B) \\ne \\mathrm{P}(A)\\,\\mathrm{P}(B)$.", value: [false, true] }, [
          indep ? { text: "No, because $\\mathrm{P}(A \\cap B) \\ne \\mathrm{P}(A)\\,\\mathrm{P}(B)$.", value: [false, true], why: "Work out the product $\\mathrm{P}(A)\\,\\mathrm{P}(B)$ and compare." } : { text: "Yes, because $\\mathrm{P}(A \\cap B) = \\mathrm{P}(A)\\,\\mathrm{P}(B)$.", value: [true, true], why: "Work out the product $\\mathrm{P}(A)\\,\\mathrm{P}(B)$ and compare." },
          { text: "No, because $\\mathrm{P}(A \\cap B) \\ne 0$.", value: [false, false], why: "That is the test for mutually exclusive events, not for independence." },
          { text: "Yes, because $\\mathrm{P}(A) + \\mathrm{P}(B) \\ne 1$.", value: [true, false], why: "The sum of the two probabilities says nothing about independence." }]), [
          `$\\mathrm{P}(A)\\,\\mathrm{P}(B) = ${num(pA)} \\times ${num(pB)} = ${num(Number((pA * pB).toFixed(4)))}$`,
          indep ? `This equals $\\mathrm{P}(A \\cap B) = ${num(pAB)}$, so $A$ and $B$ are independent.` : `This is not equal to $\\mathrm{P}(A \\cap B) = ${num(pAB)}$, so $A$ and $B$ are not independent.`])] };
    } });

  // ======================= 4.7 discrete random variables =======================
  reg({ type: "t4-expected-value", syllabus: ["4.7"], representation: "table", format: "value", unknown: "expected-value", levels: [3],
    skills: ["SL4.7.find-k", "SL4.7.expected-value"], title: "Find the constant in a distribution table, then the expected value", source: "discrete-rv",
    build({ rng }) {
      const xs = rng.pick([[1, 2, 3, 4], [0, 1, 2, 3], [0, 1, 2, 3, 4], [1, 2, 3], [2, 4, 6, 8], [-1, 0, 1, 2]]);
      const w = xs.map(() => rng.int(1, 4)), total = w.reduce((s, x) => s + x, 0), ex = rat.Q(xs.reduce((s, x, i) => s + x * w[i], 0), total);
      return { params: { xs, w },
        table: { head: ["$x$"].concat(xs.map((x) => m(num(x)))), rows: [["$\\mathrm{P}(X = x)$"].concat(w.map((v) => m(coef(v, "k"))))] },
        stem: "The discrete random variable $X$ has the probability distribution shown in the table, where $k$ is a constant.", parts: [
          P("Find the value of $k$.", 2, ans.frac(1, total), [`The probabilities add up to $1$: $${w.map((v) => coef(v, "k")).join(" + ")} = 1$`, `$${total}k = 1$, so $k = ${frac(1, total)}$`]),
          P("Find $\\mathrm{E}(X)$.", 3, ans.frac(ex.n, ex.d), [
            `$\\mathrm{E}(X) = \\sum x\\,\\mathrm{P}(X = x)$`, `$\\mathrm{E}(X) = ${xs.map((x, i) => `${br(x)}${br(rat.Q(w[i], total))}`).join(" + ")}$`, `$\\mathrm{E}(X) = ${rat.tex(ex)}$`])] };
    } });
  reg({ type: "t4-discrete-distribution", syllabus: ["4.7"], representation: "equation", format: "value", unknown: "missing-probability", levels: [3],
    skills: ["SL4.7.table-probabilities", "SL4.7.expected-value"], title: "A missing probability, then the expected value", source: "discrete-rv-unknown-k",
    build({ rng }) {
      const p0 = rng.pick([0.1, 0.15, 0.2, 0.05]), p1 = rng.pick([0.25, 0.3, 0.35, 0.2]), p3 = rng.pick([0.2, 0.25, 0.1, 0.15]), k = Number((1 - p0 - p1 - p3).toFixed(4));
      const ex = Number((p1 + 2 * k + 3 * p3).toFixed(4));
      return { params: { p0, p1, p3 },
        table: { head: ["$x$", "$0$", "$1$", "$2$", "$3$"], rows: [["$\\mathrm{P}(X = x)$", m(num(p0)), m(num(p1)), "$k$", m(num(p3))]] },
        stem: "The discrete random variable $X$ has the probability distribution shown in the table.", parts: [
          P("Find the value of $k$.", 2, ans.dec(k), [`The probabilities add up to $1$: $${num(p0)} + ${num(p1)} + k + ${num(p3)} = 1$`, `$k = ${num(k)}$`]),
          P("Find $\\mathrm{E}(X)$.", 3, ans.dec(ex), [`$\\mathrm{E}(X) = 0${br(p0)} + 1${br(p1)} + 2${br(k)} + 3${br(p3)}$`, `$\\mathrm{E}(X) = ${num(ex)}$`])] };
    } });

  // ======================= 4.8 binomial distribution =======================
  const BIN = { type: "t4-binomial", syllabus: ["4.8"], format: "value", calculator: true };
  reg({ ...BIN, representation: "words", unknown: "exact-probability", levels: [4], skills: ["SL4.8.exact-probability", "SL4.8.cumulative-probability", "SL4.8.mean-variance"], title: "Binomial probabilities and the mean", source: "binomial-dist",
    build({ rng }) {
      let n, p;
      do { n = rng.pick([6, 8, 10, 12, 15, 20]); p = rng.pick([0.08, 0.12, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4]); } while (Math.pow(1 - p, n) < 0.012);
      const k = Math.max(1, Math.floor(n * p) + rng.int(-1, 1));
      const pk = nCr(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k), p1 = 1 - Math.pow(1 - p, n);
      const story = rng.pick([`Each item made by a machine is faulty with probability $${num(p)}$, independently of the others. A batch of $${n}$ items is tested, and $X$ is the number of faulty items.`,
        `A student guesses the answer to each of $${n}$ multiple-choice questions. Each guess is correct with probability $${num(p)}$, and $X$ is the number of correct answers.`,
        `A biased coin lands heads with probability $${num(p)}$. The coin is tossed $${n}$ times, and $X$ is the number of heads.`]);
      return { params: { n, p, k }, stem: `${story} So $X \\sim \\mathrm{B}(${n},\\, ${num(p)})$.`, parts: [
        P(`Find $\\mathrm{P}(X = ${k})$.`, 2, ans.sf(pk), [`$\\mathrm{P}(X = ${k}) = \\dbinom{${n}}{${k}}${br(p)}^{${k}}${br(Number((1 - p).toFixed(4)))}^{${n - k}}$`.replace(/\^\{1\}/g, ""), `$\\mathrm{P}(X = ${k}) = ${sf(pk)}$`]),
        P("Find $\\mathrm{P}(X \\ge 1)$.", 3, ans.sf(p1), [`$\\mathrm{P}(X \\ge 1) = 1 - \\mathrm{P}(X = 0)$`, `$\\mathrm{P}(X = 0) = ${num(Number((1 - p).toFixed(4)))}^{${n}} = ${sf(Math.pow(1 - p, n))}$`, `$\\mathrm{P}(X \\ge 1) = ${sf(p1)}$`]),
        P("Find $\\mathrm{E}(X)$.", 1, ans.dec(Number((n * p).toFixed(4))), [`$\\mathrm{E}(X) = np = ${n} \\times ${num(p)} = ${num(Number((n * p).toFixed(4)))}$`])] };
    } });
  reg({ ...BIN, syllabus: ["4.8", "4.9"], representation: "words", format: "mcq", unknown: "binomial-then-normal", levels: [4],
    skills: ["SL4.8.exact-probability", "SL4.9.normal-probability", "SL4.8.identify"], title: "A binomial count and a normal measurement", source: "binomial-normal-context-b",
    build({ rng }) {
      const n = rng.pick([12, 15, 20, 10]), p = rng.pick([0.25, 0.3, 0.4, 0.35]), k = Math.ceil(n * p), mu = rng.pick([50, 60, 70, 82]), sigma = rng.pick([6, 8, 10, 4.5]);
      const x = mu + sigma * rng.pick([1, 1.5, 0.5, -0.5, 2]), pk = nCr(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k), above = 1 - phi((x - mu) / sigma);
      return { params: { n, p, k, mu, sigma, x }, stem: `Each parcel sent by a company is late with probability $${num(p)}$, independently of the others. In a sample of $${n}$ parcels, $X$ is the number that are late. The mass of a parcel, $Y$ grams, is normally distributed with mean $${num(mu)}$ and standard deviation $${num(sigma)}$.`, parts: [
        P("Which condition is needed for $X$ to follow a binomial distribution?", 1, ans.choice(rng, { text: "Each parcel is late independently, with the same probability.", value: "ok" }, [
          { text: "The number of parcels in the sample is large.", value: "large", why: "A binomial distribution does not need a large number of trials." },
          { text: "The masses of the parcels are normally distributed.", value: "normal", why: "The masses have nothing to do with whether parcels are late." },
          { text: "More than half of the parcels arrive on time.", value: "half", why: "The probability of success can take any value between $0$ and $1$." }]), [
          "A binomial model needs a fixed number of independent trials, each with the same probability of success."]),
        P(`Find $\\mathrm{P}(X = ${k})$.`, 3, ans.sf(pk), [`$X \\sim \\mathrm{B}(${n},\\, ${num(p)})$`, `$\\mathrm{P}(X = ${k}) = \\dbinom{${n}}{${k}}${br(p)}^{${k}}${br(Number((1 - p).toFixed(4)))}^{${n - k}}$`, `$\\mathrm{P}(X = ${k}) = ${sf(pk)}$`]),
        P(`Find $\\mathrm{P}(Y > ${num(x)})$.`, 3, ans.sf(above), [`$Y \\sim \\mathrm{N}(${num(mu)},\\, ${num(sigma)}^{2})$`, "Use the normal distribution function on a calculator.", `$\\mathrm{P}(Y > ${num(x)}) = ${sf(above)}$`])] };
    } });

  // ======================= 4.9 and 4.12 normal distribution =======================
  reg({ type: "t4-normal-probability", syllabus: ["4.9"], representation: "words", format: "value", unknown: "prob-between", levels: [2], calculator: true,
    skills: ["SL4.9.normal-probability"], title: "Normal probabilities with technology", source: "normal-dist/B",
    build({ rng }) {
      const mu = rng.pick([50, 100, 60, 30, 75, 40, 162]), sig = rng.pick([8, 10, 5, 4, 12, 6, 7.5]), a = mu - sig * rng.pick([0.5, 0.75, 1, 1.25, 1.6]), b = mu + sig * rng.pick([0.4, 0.8, 1.2, 1.5, 2]);
      const pb = phi((b - mu) / sig), pab = pb - phi((a - mu) / sig);
      return { params: { mu, sig, a, b }, stem: `The heights of the plants in a field are normally distributed with mean $${unit(mu, "cm")}$ and standard deviation $${unit(sig, "cm")}$. A plant is chosen at random, and its height is $${unit("X", "cm")}$.`, parts: [
        P(`Find $\\mathrm{P}(X < ${num(b)})$.`, 2, ans.sf(pb), [`$X \\sim \\mathrm{N}(${num(mu)},\\, ${num(sig)}^{2})$`, `Using the normal distribution function on a calculator, $\\mathrm{P}(X < ${num(b)}) = ${sf(pb)}$.`]),
        P(`Find $\\mathrm{P}(${num(a)} < X < ${num(b)})$.`, 2, ans.sf(pab), [`Enter the lower bound $${num(a)}$ and the upper bound $${num(b)}$.`, `$\\mathrm{P}(${num(a)} < X < ${num(b)}) = ${sf(pab)}$`])] };
    } });
  reg({ type: "t4-normal-unknown-parameter", syllabus: ["4.12", "4.9"], representation: "words", format: "value", unknown: "unknown-sd", levels: [4], calculator: true,
    skills: ["SL4.12.unknown-mean-or-sd", "SL4.12.standardise", "SL4.9.inverse-normal"], title: "Find a standard deviation from a tail probability", source: "normal-dist/A",
    build({ rng }) {
      const mu = rng.pick([50, 60, 75, 30, 100, 40, 80, 125]), delta = rng.pick([8, 10, 15, 12, 6, 9.5]), a = mu + delta, pg = rng.pick([0.1, 0.025, 0.05, 0.2, 0.15, 0.08]);
      const z = invPhi(1 - pg), sigma = delta / z;
      return { params: { mu, a, pg }, stem: `The masses of the apples from an orchard are normally distributed with mean $${unit(mu, "g")}$ and standard deviation $${unit("\\sigma", "g")}$. It is known that $${pct(Number((pg * 100).toFixed(2)))}$ of the apples have a mass greater than $${unit(a, "g")}$.`, parts: [
        P(`Find the value of $z$ for which $\\mathrm{P}(Z > z) = ${num(pg)}$, where $Z \\sim \\mathrm{N}(0,\\, 1)$.`, 2, ans.sf(z), [
          `$\\mathrm{P}(Z < z) = 1 - ${num(pg)} = ${num(1 - pg)}$`, `Using the inverse normal function on a calculator, $z = ${sf(z)}$.`]),
        P("Find the value of $\\sigma$.", 3, ans.sf(sigma), [`Standardise: $\\dfrac{${num(a)} - ${num(mu)}}{\\sigma} = ${sf(z, 5)}$`, `$\\sigma = \\dfrac{${num(delta)}}{${sf(z, 5)}}$`, `$\\sigma = ${sf(sigma)}$`])] };
    } });
})(typeof globalThis !== "undefined" ? globalThis : this);
