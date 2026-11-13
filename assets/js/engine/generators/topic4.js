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

  // =====================================================================================
  // Second batch: every subtopic 4.1 to 4.12 at level 2 and at level 3 or 4, plus recall questions.
  // =====================================================================================
  const sum = (a) => a.reduce((s, x) => s + x, 0);
  const fix = (x) => Number(x.toFixed(6));
  // half a unit in the third significant figure of v
  const ulp3 = (v) => E.toleranceOf({ value: v, sigfigs: 3 });
  // A calculator answer shown to 3 s.f. that also accepts values reached from rounded intermediate results.
  const loose = (v, tol) => ({ kind: "number", value: v, tolerance: Math.max(tol, ulp3(v)), display: m(sf(v)) });
  const pcAns = (v) => ans.dec(v, { display: m(pct(v)) });
  const bpmf = (n, p, k) => nCr(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
  const bcdf = (n, p, k) => { let s = 0; for (let i = 0; i <= k; i++) s += bpmf(n, p, i); return s; };
  const ORD = ["", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth"];
  // n/d shown once when it is already in lowest terms, otherwise followed by its reduced form
  const eqFrac = (n, d) => (fmt.gcd(n, d) === 1 ? `\\dfrac{${n}}{${d}}` : `\\dfrac{${n}}{${d}} = ${frac(n, d)}`);
  const par = (s) => (s[0] === "-" ? `(${s})` : s);
  const cells = (xs) => xs.map((x) => m(num(x)));
  const CALC = "Using the normal distribution function on a calculator, ";
  const INV = "Using the inverse normal function on a calculator, ";

  // ======================= 4.1 sampling =======================
  reg({ type: "t4-sampling", syllabus: ["4.1"], representation: "table", format: "value", unknown: "quota-number", levels: [3],
    skills: ["SL4.1.stratified-numbers", "SL4.1.sampling-technique"], title: "Numbers in a stratified sample",
    build({ rng }) {
      const c = rng.pick([
        { pop: "A school", unitN: "students", head: "Year group", names: ["Year $9$", "Year $10$", "Year $11$", "Year $12$"], row: "Number of students", member: (g) => `students from ${g}` },
        { pop: "A sports club", unitN: "members", head: "Type of member", names: ["Junior", "Adult", "Senior", "Student"], row: "Number of members", member: (g) => `${g.toLowerCase()} members` },
        { pop: "A company", unitN: "employees", head: "Department", names: ["Sales", "Design", "Production", "Support"], row: "Number of employees", member: (g) => `employees from ${g}` }]);
      const g = rng.pick([3, 4]), k = rng.pick([5, 8, 10, 12, 20]);
      let s;
      do { s = Array.from({ length: g }, () => rng.int(4, 15)); } while (new Set(s).size < g);
      const sizes = s.map((v) => v * k), n = sum(s), N = n * k;
      const [i1, i2] = rng.sample(s.map((_, i) => i), 2), t = rng.pick([2, 3]), want = s[i2] * t;
      return { params: { sizes, n, i1, i2, want },
        table: { head: [c.head].concat(c.names.slice(0, g)), rows: [[c.row].concat(cells(sizes))] },
        stem: `${c.pop} has $${num(N)}$ ${c.unitN}, grouped as shown in the table. A stratified sample of $${n}$ ${c.unitN} is to be chosen, so that each group is represented in proportion to its size.`, parts: [
          P(`Find the number of ${c.member(c.names[i1])} in the sample.`, 2, ans.int(s[i1]), [
            `The group is $\\dfrac{${sizes[i1]}}{${N}}$ of the population.`, `$\\dfrac{${sizes[i1]}}{${N}} \\times ${n} = ${s[i1]}$`]),
          P("Which statement gives an advantage of a stratified sample over a simple random sample of the same size?", 1, ans.choice(rng, { text: "Every group is certain to be represented in proportion to its size.", value: "proportion" }, [
            { text: "No list of the population is needed.", value: "list", why: "A stratified sample needs a list of every group to choose from." },
            { text: "The people in the sample can be chosen by convenience.", value: "convenience", why: "Within each group the members are still chosen at random." },
            { text: "It always gives the same results as asking the whole population.", value: "same", why: "Any sample can differ from the population it is taken from." }]), [
            "A simple random sample can, by chance, contain too many or too few members of one group.", "A stratified sample fixes the number taken from each group in proportion to its size."]),
          P(`A second stratified sample is planned. It will contain $${want}$ ${c.member(c.names[i2])}. Find the total size of this second sample.`, 2, ans.int(n * t), [
            `The fraction of this group that is sampled is $\\dfrac{${want}}{${sizes[i2]}} = ${frac(t, k)}$.`, `Every group is sampled in the same proportion, so the sample size is $${frac(t, k)} \\times ${N} = ${n * t}$.`])] };
    } });
  reg({ type: "t4-sampling", syllabus: ["4.1"], representation: "words", format: "mcq", unknown: "name-technique", levels: [1], fixedPool: true,
    skills: ["SL4.1.sampling-technique"], title: "Name the sampling technique",
    build({ rng }) {
      const NAMES = { simple: "Simple random sampling", systematic: "Systematic sampling", stratified: "Stratified sampling", quota: "Quota sampling", convenience: "Convenience sampling" };
      const WHY = { simple: "In a simple random sample every member is equally likely to be chosen, with no pattern and no groups.", systematic: "A systematic sample takes members at a regular interval from a list.",
        stratified: "A stratified sample takes a random sample from every group, in proportion to the size of the group.", quota: "A quota sample fills a set number from each group, without random selection.", convenience: "A convenience sample takes whoever is easiest to reach." };
      const c = rng.pick([
        ["simple", "Each member of a club is given a number, and a random number generator is used to choose the members who will be asked."],
        ["simple", "The name of every student in a school is written on a card, the cards are mixed in a box, and the sample is drawn from the box without looking."],
        ["systematic", "An inspector checks every twentieth item that comes off a production line, starting from an item chosen at random."],
        ["systematic", "A librarian takes an alphabetical list of all members, picks a random starting name, and then chooses every fifteenth name on the list."],
        ["stratified", "A school chooses students at random from each year group, with the number taken from each year group in proportion to its size."],
        ["stratified", "A company divides its staff by department and randomly selects from each department a number of people in proportion to the size of the department."],
        ["quota", "An interviewer in a shopping centre is told to question a set number of men and a set number of women, and stops asking each group once that number is reached."],
        ["quota", "A researcher stands outside a station and asks passers-by until she has answers from a fixed number of people in each age group."],
        ["convenience", "A student who wants to know the opinions of the whole school asks the people sitting at her table at lunch."],
        ["convenience", "A shop owner who wants the views of all customers asks the first few people who come in on Monday morning."]]);
      const others = rng.shuffle(Object.keys(NAMES).filter((k) => k !== c[0]));
      return { params: { technique: c[0] }, stem: c[1], parts: [
        P("Which sampling technique is being used?", 1, ans.choice(rng, { text: NAMES[c[0]], value: c[0] }, others.map((k) => ({ text: NAMES[k], value: k, why: WHY[k] }))), [WHY[c[0]], `This is ${NAMES[c[0]].toLowerCase()}.`])] };
    } });
  reg({ type: "t4-sampling", syllabus: ["4.1"], representation: "words", format: "value", unknown: "systematic-member", levels: [2],
    skills: ["SL4.1.sampling-technique"], title: "Members chosen in a systematic sample",
    build({ rng }) {
      const k = rng.pick([5, 8, 10, 12, 15, 20, 25]), n = rng.pick([20, 24, 30, 36, 40, 50]), N = n * k, s = rng.int(2, k), j = rng.int(4, 12);
      const who = rng.pick([["A club", "members"], ["A college", "students"], ["A company", "employees"]]);
      return { params: { N, n, s, j }, stem: `${who[0]} has a list of its $${num(N)}$ ${who[1]}, numbered from $1$ to $${num(N)}$. A systematic sample of $${n}$ ${who[1]} is taken: a starting number is chosen at random, and after that the numbers chosen are equally spaced through the list.`, parts: [
        P("Find the interval between one chosen number and the next.", 1, ans.int(k), [`Interval $= \\dfrac{${N}}{${n}} = ${k}$`]),
        P(`The first number chosen is $${s}$. Find the ${ORD[j]} number chosen.`, 2, ans.int(s + (j - 1) * k), [
          `The ${ORD[j]} number is $${j - 1}$ intervals after the first.`, `$${s} + ${j - 1} \\times ${k} = ${s + (j - 1) * k}$`]),
        P("Find the last number chosen.", 1, ans.int(s + (n - 1) * k), [`The last of the $${n}$ numbers is $${n - 1}$ intervals after the first: $${s} + ${n - 1} \\times ${k} = ${num(s + (n - 1) * k)}$`])] };
    } });

  // ======================= 4.2 cumulative frequency and box plots =======================
  const CF_SHAPES = [[0, 1, 3, 6, 9, 11, 12], [0, 1, 2, 3, 6, 9, 11, 12], [0, 1, 3, 5, 6, 9, 11, 12], [0, 1, 2, 3, 6, 9, 10, 11, 12], [0, 1, 3, 6, 9, 10, 11, 12], [0, 2, 3, 6, 9, 11, 12], [0, 1, 3, 4, 6, 9, 11, 12]];
  const CF_CTX = [
    { stem: (n) => `The cumulative frequency graph shows the times, in minutes, that $${n}$ students took to finish a puzzle.`, noun: "students", meas: "time", measP: "times", units: "minutes", x0s: [0, 10, 20], ws: [5, 10],
      top: (k) => `The $${k}$ students who took the longest are offered extra help. Find the least time, in minutes, taken by a student in this group.` },
    { stem: (n) => `The cumulative frequency graph shows the masses, in grams, of $${n}$ apples picked from one tree.`, noun: "apples", meas: "mass", measP: "masses", units: "grams", x0s: [60, 80, 100], ws: [10, 20],
      top: (k) => `The $${k}$ heaviest apples are sold as large apples. Find the least mass, in grams, of a large apple.` },
    { stem: (n) => `The cumulative frequency graph shows the heights, in centimetres, of $${n}$ plants in a greenhouse.`, noun: "plants", meas: "height", measP: "heights", units: "centimetres", x0s: [10, 20, 30], ws: [5, 10],
      top: (k) => `The $${k}$ tallest plants are moved outside. Find the least height, in centimetres, of a plant that is moved.` }];
  function cfSit(rng) {
    const ci = rng.int(0, CF_CTX.length - 1), c = CF_CTX[ci], n = rng.pick([24, 36, 48, 60, 72, 84, 96]), shape = rng.pick(CF_SHAPES), x0 = rng.pick(c.x0s), w = rng.pick(c.ws);
    const xs = shape.map((_, i) => x0 + i * w), cf = shape.map((v) => (v * n) / 12);
    return { ci, n, xs, cf, shape, ia: rng.int(1, 2), ib: rng.int(shape.length - 3, shape.length - 2), it: rng.int(shape.indexOf(6) + 1, shape.length - 2), ic: rng.int(1, shape.length - 2) };
  }
  const cfGraph = (s) => ({ x: [s.xs[0], s.xs[s.xs.length - 1]], y: [0, s.n], xStep: s.xs[1] - s.xs[0], yStep: s.n / 12, xLabel: CF_CTX[s.ci].meas, yLabel: "cumulative frequency",
    functions: [{ fn: { type: "pwl", points: s.xs.map((x, i) => [x, s.cf[i]]) } }], alt: "A cumulative frequency curve that rises from zero to the total frequency" });
  const cfAt = (s, steps) => s.xs[s.shape.indexOf(steps)];
  const CF = { type: "t4-cumulative-frequency", syllabus: ["4.2"], representation: "graph", format: "value", situationKey: "cumfreq", situation: cfSit };
  reg({ ...CF, unknown: "median-from-graph", levels: [1], skills: ["SL4.2.cumfreq-quartiles", "SL4.2.cumfreq-count"], title: "Read a median and a count from a cumulative frequency graph",
    build({ sit: s }) {
      const c = CF_CTX[s.ci], med = cfAt(s, 6);
      return { stem: c.stem(s.n), graph: cfGraph(s), parts: [
        P(`Use the graph to find the median ${c.meas}.`, 1, ans.int(med), [`Half of $${s.n}$ is $${s.n / 2}$. Reading across from $${s.n / 2}$ on the vertical axis to the curve, then down, gives $${med}$.`]),
        P(`Find the number of ${c.noun} with a ${c.meas} of less than $${s.xs[s.ic]}$ ${c.units}.`, 1, ans.int(s.cf[s.ic]), [`Reading up from $${s.xs[s.ic]}$ to the curve, then across, gives a cumulative frequency of $${s.cf[s.ic]}$.`])] };
    } });
  reg({ ...CF, unknown: "iqr-from-graph", levels: [2], skills: ["SL4.2.cumfreq-quartiles", "SL4.2.cumfreq-count"], title: "Median and interquartile range from a cumulative frequency graph",
    build({ sit: s }) {
      const c = CF_CTX[s.ci], med = cfAt(s, 6), q1 = cfAt(s, 3), q3 = cfAt(s, 9), j = s.ib;
      return { stem: c.stem(s.n), graph: cfGraph(s), parts: [
        P(`Use the graph to find the median ${c.meas}.`, 1, ans.int(med), [`Half of $${s.n}$ is $${s.n / 2}$. Reading across from $${s.n / 2}$ on the vertical axis to the curve, then down, gives $${med}$.`]),
        P("Find the interquartile range.", 2, ans.int(q3 - q1), [
          `The lower quartile is at a cumulative frequency of $${s.n / 4}$, so $Q_{1} = ${q1}$.`, `The upper quartile is at a cumulative frequency of $${(3 * s.n) / 4}$, so $Q_{3} = ${q3}$.`, `$\\text{IQR} = ${q3} - ${q1} = ${q3 - q1}$`]),
        P(`Find the number of ${c.noun} with a ${c.meas} of more than $${s.xs[j]}$ ${c.units}.`, 1, ans.int(s.n - s.cf[j]), [
          `The cumulative frequency at $${s.xs[j]}$ is $${s.cf[j]}$, so $${s.cf[j]}$ ${c.noun} are at or below it.`, `$${s.n} - ${s.cf[j]} = ${s.n - s.cf[j]}$`])] };
    } });
  reg({ ...CF, unknown: "cutoff-top", levels: [3], skills: ["SL4.2.cumfreq-count", "SL4.2.cumfreq-quartiles"], title: "Counts and a cut-off value from a cumulative frequency graph",
    build({ sit: s }) {
      const c = CF_CTX[s.ci], q1 = cfAt(s, 3), a = s.ia, b = s.ib, t = s.it, k = s.n - s.cf[t];
      return { stem: c.stem(s.n), graph: cfGraph(s), parts: [
        P(`Use the graph to find the lower quartile of the ${c.measP}.`, 1, ans.int(q1), [`One quarter of $${s.n}$ is $${s.n / 4}$. Reading across from $${s.n / 4}$ to the curve, then down, gives $${q1}$.`]),
        P(`Find the number of ${c.noun} with a ${c.meas} between $${s.xs[a]}$ and $${s.xs[b]}$ ${c.units}.`, 2, ans.int(s.cf[b] - s.cf[a]), [
          `The cumulative frequencies at $${s.xs[a]}$ and $${s.xs[b]}$ are $${s.cf[a]}$ and $${s.cf[b]}$.`, `$${s.cf[b]} - ${s.cf[a]} = ${s.cf[b] - s.cf[a]}$`]),
        P(c.top(k), 2, ans.int(s.xs[t]), [
          `$${s.n} - ${k} = ${s.cf[t]}$ ${c.noun} are below this group.`, `Reading across from a cumulative frequency of $${s.cf[t]}$ to the curve, then down, gives $${s.xs[t]}$.`])] };
    } });

  // A box plot drawn from straight pieces: whiskers, box, median line and end caps.
  function boxGraph(five, lo, hi, step, xLabel) {
    const [a, b, c, d, e] = five, t = (hi - lo) / 1500;
    const h = (x1, x2, y) => ({ fn: { type: "pwl", points: [[x1, y], [x2, y]] }, domain: [x1, x2] });
    const v = (x, y1, y2) => ({ fn: { type: "pwl", points: [[x - t, y1], [x + t, y2]] }, domain: [x - t, x + t] });
    return { x: [lo, hi], y: [0, 3], xStep: step, yStep: 10, xLabel, yLabel: " ",
      functions: [h(a, b, 1.5), h(d, e, 1.5), h(b, d, 2.1), h(b, d, 0.9), v(b, 0.9, 2.1), v(c, 0.9, 2.1), v(d, 0.9, 2.1), v(a, 1.2, 1.8), v(e, 1.2, 1.8)],
      alt: "A box plot drawn above a number line" };
  }
  const BOX_CTX = [
    { stem: "The box plot summarises the scores of a group of students in a test.", xLabel: "score" },
    { stem: "The box plot summarises the number of customers who visited a cafe on each day of one month.", xLabel: "customers" },
    { stem: "The box plot summarises the masses, in kilograms, of the dogs at a kennel.", xLabel: "mass" },
    { stem: "The box plot summarises the times, in seconds, taken by a group of children to run a race.", xLabel: "time" }];
  function boxSit(rng) {
    const ci = rng.int(0, BOX_CTX.length - 1), step = rng.pick([1, 2, 5]), lo = step * rng.int(0, step === 5 ? 0 : step === 2 ? 10 : 30);
    const five = [lo + step * rng.int(1, 2)];
    for (let i = 0; i < 4; i++) five.push(five[i] + step * rng.int(2, 4));
    return { ci, step, lo, hi: five[4] + step * rng.int(1, 2), five };
  }
  const BOX = { type: "t4-box-plot", syllabus: ["4.2", "4.3"], representation: "graph", format: "value", situationKey: "box", situation: boxSit };
  reg({ ...BOX, unknown: "read-median", levels: [1], skills: ["SL4.2.box-plot"], title: "Read the median and a quartile from a box plot",
    build({ sit: s }) {
      const c = BOX_CTX[s.ci];
      return { stem: c.stem, graph: boxGraph(s.five, s.lo, s.hi, s.step, c.xLabel), parts: [
        P("Write down the median.", 1, ans.int(s.five[2]), [`The median is the line inside the box, at $${s.five[2]}$.`]),
        P("Write down the upper quartile.", 1, ans.int(s.five[3]), [`The upper quartile is the right-hand end of the box, at $${s.five[3]}$.`])] };
    } });
  reg({ ...BOX, unknown: "read-median-iqr", levels: [2], skills: ["SL4.2.box-plot", "SL4.3.quartiles-discrete"], title: "Median, interquartile range and range from a box plot",
    build({ sit: s }) {
      const c = BOX_CTX[s.ci], f = s.five;
      return { stem: c.stem, graph: boxGraph(f, s.lo, s.hi, s.step, c.xLabel), parts: [
        P("Write down the median.", 1, ans.int(f[2]), [`The median is the line inside the box, at $${f[2]}$.`]),
        P("Find the interquartile range.", 2, ans.int(f[3] - f[1]), [`The box runs from $Q_{1} = ${f[1]}$ to $Q_{3} = ${f[3]}$.`, `$\\text{IQR} = ${f[3]} - ${f[1]} = ${f[3] - f[1]}$`]),
        P("Find the range.", 1, ans.int(f[4] - f[0]), [`The whiskers end at the smallest value, $${f[0]}$, and the largest value, $${f[4]}$: $${f[4]} - ${f[0]} = ${f[4] - f[0]}$`])] };
    } });
  reg({ type: "t4-box-plot", syllabus: ["4.2", "4.3"], representation: "terms", format: "graph", unknown: "pick-box-from-data", levels: [2],
    skills: ["SL4.2.box-plot", "SL4.3.quartiles-discrete"], title: "Quartiles of a data set and its box plot",
    build({ rng }) {
      let d, wrongs, lo, hi;
      const opt = (five, why) => ({ graph: boxGraph(five, lo, hi, 2, "x"), value: five, why });
      do {
        d = [rng.int(3, 12)];
        for (let i = 1; i < 11; i++) d.push(d[i - 1] + rng.int(1, 4));
        lo = 2 * Math.floor((d[0] - 1) / 2); hi = 2 * Math.ceil((d[10] + 1) / 2);
        wrongs = E.graph.pickDistinct(boxGraph([d[0], d[2], d[5], d[8], d[10]], lo, hi, 2, "x"), [
          opt([d[0], d[1], d[5], d[9], d[10]], "The quartiles are the third and ninth values, not the second and tenth."),
          opt([d[0], d[3], d[5], d[7], d[10]], "The quartiles are the third and ninth values, not the fourth and eighth."),
          opt([d[0], d[4], d[5], d[6], d[10]], "The box must run from the lower quartile to the upper quartile, which hold the middle half of the data."),
          opt([d[1], d[2], d[5], d[8], d[9]], "The whiskers must reach the smallest and largest values.")], 3);
      } while (wrongs.length < 3);
      return { params: { data: d }, stem: `Eleven values, in order, are $${listTex(d)}$.`, parts: [
        P("Find the lower quartile, $Q_{1}$.", 1, ans.int(d[2]), [`The median is the sixth value, $${d[5]}$. $Q_{1}$ is the median of the five values below it, which is the third value: $${d[2]}$.`]),
        P("Find the upper quartile, $Q_{3}$.", 1, ans.int(d[8]), [`$Q_{3}$ is the median of the five values above the median, which is the ninth value: $${d[8]}$.`]),
        P("Which box plot represents the data?", 2, ans.graph(rng, opt([d[0], d[2], d[5], d[8], d[10]]), wrongs), [
          `The smallest value is $${d[0]}$ and the largest is $${d[10]}$, so the whiskers end there.`, `The box runs from $Q_{1} = ${d[2]}$ to $Q_{3} = ${d[8]}$, with the median line at $${d[5]}$.`])] };
    } });
  reg({ type: "t4-outlier-rule", syllabus: ["4.2", "4.3"], representation: "words", format: "mcq", unknown: "find-fences", levels: [2],
    skills: ["SL4.2.outlier-test", "SL4.3.quartiles-discrete"], title: "Outlier boundaries from the quartiles",
    build({ rng }) {
      const q1 = rng.int(12, 60), iqr = 2 * rng.int(2, 9), q3 = q1 + iqr, up = q3 + 1.5 * iqr, low = q1 - 1.5 * iqr, out = rng.bool(), v = up + (out ? 1 : -1) * rng.int(1, 3);
      const A = { text: `Yes, because $${v}$ is greater than $${up}$.`, value: [true, "fence"], why: `Compare again: $${v}$ is less than $${up}$.` };
      const B = { text: `No, because $${v}$ is less than $${up}$.`, value: [false, "fence"], why: `Compare again: $${v}$ is greater than $${up}$.` };
      return { params: { q1, q3, v }, stem: `A data set has lower quartile $Q_{1} = ${q1}$ and upper quartile $Q_{3} = ${q3}$. A value is an outlier if it is more than $1.5 \\times \\text{IQR}$ below $Q_{1}$ or more than $1.5 \\times \\text{IQR}$ above $Q_{3}$.`, parts: [
        P("Find the interquartile range.", 1, ans.int(iqr), [`$\\text{IQR} = Q_{3} - Q_{1} = ${q3} - ${q1} = ${iqr}$`]),
        P("Find the largest value that a data point can take without being an outlier.", 1, ans.int(up), [`$Q_{3} + 1.5 \\times \\text{IQR} = ${q3} + 1.5 \\times ${iqr} = ${up}$`]),
        P("Find the smallest value that a data point can take without being an outlier.", 1, ans.int(low), [`$Q_{1} - 1.5 \\times \\text{IQR} = ${q1} - 1.5 \\times ${iqr} = ${low}$`]),
        P(`The largest value in the data set is $${v}$. Is it an outlier?`, 1, ans.choice(rng, out ? A : B, [out ? B : A,
          { text: `Yes, because $${v}$ is greater than $Q_{3}$.`, value: [true, "q3"], why: "A value must be more than $1.5 \\times \\text{IQR}$ above $Q_{3}$, not just above $Q_{3}$." },
          { text: "No, because the largest value of a data set is never an outlier.", value: [false, "never"], why: "The largest value is an outlier whenever it lies beyond the upper boundary." }]), [
          `The upper boundary is $${up}$.`, out ? `$${v}$ is greater than $${up}$, so it is an outlier.` : `$${v}$ is less than $${up}$, so it is not an outlier.`])] };
    } });

  // ======================= 4.3 measures of centre and spread =======================
  reg({ type: "t4-grouped-data", syllabus: ["4.3"], representation: "table", format: "value", unknown: "estimate-mean", levels: [2],
    skills: ["SL4.3.grouped-mean", "SL4.3.mean-median-mode"], title: "Modal class and an estimate of the mean from a grouped table",
    build({ rng }) {
      const c = rng.pick([
        { stem: (n) => `The table shows the times, $t$ minutes, that $${n}$ people spent in a museum shop.`, head: "Time, $t$ minutes", v: "t", x0: [0], w: [10, 20] },
        { stem: (n) => `The table shows the masses, $w$ grams, of $${n}$ letters handled by a post office.`, head: "Mass, $w$ grams", v: "w", x0: [0, 20], w: [10, 20] },
        { stem: (n) => `The table shows the heights, $h$ centimetres, of $${n}$ seedlings.`, head: "Height, $h$ centimetres", v: "h", x0: [0, 10], w: [4, 10] }]);
      const x0 = rng.pick(c.x0), w = rng.pick(c.w), mids = [0, 1, 2, 3, 4].map((i) => x0 + w / 2 + i * w);
      let f, n, total, top;
      do {
        f = mids.map(() => rng.int(2, 14)); n = sum(f); total = sum(f.map((v, i) => v * mids[i])); top = Math.max(...f);
      } while (![20, 25, 40, 50].includes(n) || (total * 10) % n !== 0 || f.filter((v) => v === top).length > 1);
      const cls = (i) => `$${x0 + i * w} \\le ${c.v} < ${x0 + (i + 1) * w}$`, mode = f.indexOf(top), mean = total / n, j = rng.int(0, 4);
      return { params: { x0, w, f }, table: { head: [c.head].concat(mids.map((_, i) => cls(i))), rows: [["Frequency"].concat(cells(f))] }, stem: c.stem(n), parts: [
        P("Which is the modal class?", 1, ans.choice(rng, { text: cls(mode), value: mode }, rng.shuffle([0, 1, 2, 3, 4].filter((i) => i !== mode)).map((i) => ({ text: cls(i), value: i, why: "The modal class is the class with the highest frequency." }))), [
          `The highest frequency is $${top}$, which belongs to the class ${cls(mode)}.`]),
        P(`Write down the mid-interval value of the class ${cls(j)}.`, 1, ans.dec(mids[j]), [`$\\dfrac{${x0 + j * w} + ${x0 + (j + 1) * w}}{2} = ${num(mids[j])}$`]),
        P("Find an estimate for the mean.", 2, ans.dec(mean), [
          "Multiply each mid-interval value by its frequency and add the results.", `$${mids.map((x, i) => `${num(x)}${br(f[i])}`).join(" + ")} = ${num(total)}$`, `Mean $\\approx \\dfrac{${num(total)}}{${n}} = ${num(mean)}$`])] };
    } });
  reg({ type: "t4-grouped-data", syllabus: ["4.3"], representation: "table", format: "value", unknown: "sd-from-table", levels: [4], calculator: true,
    skills: ["SL4.3.sd-variance", "SL4.3.mean-median-mode"], title: "Mean, standard deviation and variance from a frequency table",
    build({ rng }) {
      const c = rng.pick([
        { stem: (n) => `A football team records the number of goals it scores in each of its $${n}$ matches in a season.`, head: "Goals scored", row: "Number of matches", x0: 0 },
        { stem: (n) => `Each of the $${n}$ students in a year group is asked how many books they read last month.`, head: "Books read", row: "Number of students", x0: 0 },
        { stem: (n) => `A shop records the number of items bought by each of $${n}$ customers.`, head: "Items bought", row: "Number of customers", x0: 1 }]);
      const xs = [0, 1, 2, 3, 4, 5].map((i) => i + c.x0), f = xs.map((_, i) => rng.int(1, 16 - 2 * i)), n = sum(f);
      const mean = sum(f.map((v, i) => v * xs[i])) / n, v2 = sum(f.map((v, i) => v * xs[i] * xs[i])) / n - mean * mean, sd = Math.sqrt(v2);
      const all = [];
      xs.forEach((x, i) => { for (let j = 0; j < f[i]; j++) all.push(x); });
      const med = median(all);
      return { params: { xs, f }, table: { head: [c.head].concat(cells(xs)), rows: [[c.row].concat(cells(f))] }, stem: `${c.stem(n)} The results are shown in the table.`, parts: [
        P("Find the mean.", 2, ans.sf(mean), ["Enter the values and their frequencies in two lists on a calculator and find the one-variable statistics.", `Mean $= ${sf(mean)}$`]),
        P("Find the standard deviation.", 2, ans.sf(sd), [`The calculator gives the standard deviation $\\sigma = ${sf(sd)}$.`]),
        P("Find the variance.", 1, loose(v2, 2 * sd * ulp3(sd) * 1.1), [`The variance is the square of the standard deviation: $\\sigma^{2} = ${sf(v2)}$`]),
        P("Find the median.", 1, ans.dec(med), [
          n % 2 ? `There are $${n}$ values, so the median is the value in position $${(n + 1) / 2}$.` : `There are $${n}$ values, so the median is the mean of the values in positions $${n / 2}$ and $${n / 2 + 1}$.`,
          `Adding the frequencies from the left to reach that position gives a median of $${num(med)}$.`])] };
    } });
  reg({ type: "t4-summary-statistics", syllabus: ["4.3"], representation: "terms", format: "value", unknown: "mode-of-data", levels: [1],
    skills: ["SL4.3.mean-median-mode"], title: "Mode and range of a small data set",
    build({ rng }) {
      let d, counts, top;
      do {
        d = sorted(rng, rng.int(7, 9), 2, 15); counts = {}; d.forEach((x) => { counts[x] = (counts[x] || 0) + 1; }); top = Math.max(...Object.values(counts));
      } while (top < 2 || Object.values(counts).filter((v) => v === top).length > 1);
      const mode = Number(Object.keys(counts).find((k) => counts[k] === top)), shown = rng.shuffle(d), hi = d[d.length - 1];
      return { params: { data: shown }, stem: `The values in a data set are $${listTex(shown)}$.`, parts: [
        P("Write down the mode.", 1, ans.int(mode), [`In order, the values are $${listTex(d)}$.`, `The value that occurs most often is $${mode}$.`]),
        P("Find the range.", 1, ans.int(hi - d[0]), [`The range is the largest value minus the smallest value: $${hi} - ${d[0]} = ${hi - d[0]}$`])] };
    } });
  reg({ type: "t4-summary-statistics", syllabus: ["4.3"], representation: "words", format: "value", unknown: "combined-mean", levels: [3],
    skills: ["SL4.3.mean-totals", "SL4.3.mean-median-mode"], title: "Totals, a new value and a combined mean",
    build({ rng }) {
      const c = rng.pick([
        { of: "test scores of a group of", noun: "students", join: "Another student joins the group", ask: "Find the score of this student." },
        { of: "masses, in kilograms, of a batch of", noun: "parcels", join: "One more parcel is added to the batch", ask: "Find the mass, in kilograms, of this parcel." },
        { of: "ages, in years, of a group of", noun: "club members", join: "A new member joins the group", ask: "Find the age, in years, of the new member." }]);
      let n1, m1, dlt, n2, m3, comb, v;
      do {
        n1 = rng.pick([5, 8, 9, 11, 14]); m1 = rng.int(12, 40); dlt = rng.pick([-1, -0.5, 0.5, 1, 2]); n2 = rng.pick([4, 6, 10, 12, 15, 16]); m3 = m1 + rng.pick([-6, -5, -4, -3, 3, 4, 5, 6, 8]);
        comb = (n1 * m1 + n2 * m3) / (n1 + n2); v = m1 + (n1 + 1) * dlt;
      } while (Math.abs(comb * 10 - Math.round(comb * 10)) > 1e-9 || v < 2 || !Number.isInteger(v));
      const m2 = m1 + dlt;
      comb = fix(comb);
      return { params: { n1, m1, m2, n2, m3 }, stem: `The mean of the ${c.of} $${n1}$ ${c.noun} is $${m1}$.`, parts: [
        P(`Find the total of the $${n1}$ values.`, 1, ans.int(n1 * m1), [`The total is the mean multiplied by the number of values: $${m1} \\times ${n1} = ${n1 * m1}$`]),
        P(`${c.join}, and the mean of the $${n1 + 1}$ values is $${num(m2)}$. ${c.ask}`, 2, ans.int(v), [
          `The new total is $${num(m2)} \\times ${n1 + 1} = ${num(m2 * (n1 + 1))}$.`, `$${num(m2 * (n1 + 1))} - ${n1 * m1} = ${num(v)}$`]),
        P(`A different group of $${n2}$ ${c.noun} has a mean of $${m3}$. Find the mean when the original $${n1}$ ${c.noun} and this group are put together.`, 3, ans.dec(comb), [
          `The second group has a total of $${m3} \\times ${n2} = ${m3 * n2}$.`, `The combined total is $${n1 * m1} + ${m3 * n2} = ${n1 * m1 + m3 * n2}$, from $${n1 + n2}$ values.`, `Mean $= \\dfrac{${n1 * m1 + m3 * n2}}{${n1 + n2}} = ${num(comb)}$`])] };
    } });
  const CONST_CTX = [["temperatures recorded at a weather station", "The readings are converted to a different scale."], ["scores of a class in a test", "The scores are rescaled."], ["lengths of the parts made by a machine", "The lengths are converted to a different unit and adjusted."]];
  reg({ type: "t4-constant-changes", syllabus: ["4.3"], representation: "words", format: "value", unknown: "add-mean-sd", levels: [1],
    skills: ["SL4.3.constant-changes"], title: "Effect of adding a constant on the mean and the standard deviation",
    build({ rng }) {
      const mean = rng.int(15, 60), sd = rng.pick([2, 2.5, 3, 4, 4.5, 6]), k = rng.int(3, 12), up = rng.bool();
      return { params: { mean, sd, a: 1, b: up ? k : -k }, stem: `A data set has mean $${mean}$ and standard deviation $${num(sd)}$. Every value in the data set is ${up ? "increased" : "decreased"} by $${k}$.`, parts: [
        P("Write down the new mean.", 1, ans.int(up ? mean + k : mean - k), [`Every value moves by $${k}$, so the mean moves by $${k}$: $${mean} ${up ? "+" : "-"} ${k} = ${up ? mean + k : mean - k}$`]),
        P("Write down the new standard deviation.", 1, ans.dec(sd), [`Adding or subtracting a constant does not change how spread out the values are, so the standard deviation is still $${num(sd)}$.`])] };
    } });
  reg({ type: "t4-constant-changes", syllabus: ["4.3"], representation: "words", format: "value", unknown: "linear-centre-spread", levels: [2],
    skills: ["SL4.3.constant-changes", "SL4.3.sd-variance"], title: "Mean, standard deviation and variance after a linear change",
    build({ rng }) {
      let mean, sd, a, b;
      do { mean = rng.int(10, 50); sd = rng.pick([1.5, 2, 2.5, 3, 4, 5]); a = rng.pick([2, 3, 4, 1.5, 0.5, 10]); b = rng.nonzero(-12, 20); } while (Math.abs((a * sd) ** 2 * 100 - Math.round((a * sd) ** 2 * 100)) > 1e-9 || a * mean + b <= 0);
      const c = rng.pick(CONST_CTX), nm = fix(a * mean + b), ns = fix(a * sd), nv = fix(ns * ns);
      return { params: { mean, sd, a, b }, stem: `The ${c[0]} have mean $${mean}$ and standard deviation $${num(sd)}$. ${c[1]} Each value is multiplied by $${num(a)}$ and then $${Math.abs(b)}$ is ${b > 0 ? "added" : "subtracted"}.`, parts: [
        P("Find the new mean.", 2, ans.dec(nm), [`The mean changes in the same way as each value: $${num(a)} \\times ${mean} ${signed(b)}$`, `New mean $= ${num(nm)}$`]),
        P("Find the new standard deviation.", 1, ans.dec(ns), [`Only the multiplication changes the spread: $${num(a)} \\times ${num(sd)} = ${num(ns)}$`]),
        P("Find the new variance.", 1, ans.dec(nv), [`The variance is the square of the standard deviation: $${num(ns)}^{2} = ${num(nv)}$`])] };
    } });
  reg({ type: "t4-constant-changes", syllabus: ["4.3"], representation: "words", format: "value", unknown: "find-a-and-b", levels: [3],
    skills: ["SL4.3.constant-changes", "SL4.3.sd-variance"], title: "Linear changes of data: new statistics and the constants of a change",
    build({ rng }) {
      const mean = rng.int(8, 30), sd = rng.int(2, 6), a = rng.pick([2, 3, 5]), b = rng.nonzero(-9, 15);
      let c, d;
      do { c = rng.pick([1.5, 2, 2.5, 4, 0.5]); d = rng.nonzero(-20, 30); } while (c === a || c * mean + d <= 0);
      const M = fix(c * mean + d), S = fix(c * sd);
      return { params: { mean, sd, a, b, M, S }, stem: `The values $x$ in a data set have mean $${mean}$ and variance $${sd * sd}$.`, parts: [
        P(`Each value is changed to $y = ${expr([[a, "x"], [b, ""]])}$. Find the mean of the values of $y$.`, 1, ans.int(a * mean + b), [`$${a}${br(mean)} ${signed(b)} = ${a * mean + b}$`]),
        P("Find the variance of the values of $y$.", 2, ans.int(a * a * sd * sd), [`Multiplying every value by $${a}$ multiplies the variance by $${a}^{2}$, and adding a constant does not change it.`, `$${a}^{2} \\times ${sd * sd} = ${a * a * sd * sd}$`]),
        P(`Instead, each value is changed to $z = cx + d$, where $c > 0$. The values of $z$ have mean $${num(M)}$ and standard deviation $${num(S)}$. Find the value of $c$.`, 2, ans.dec(c), [
          `The standard deviation of $x$ is $\\sqrt{${sd * sd}} = ${sd}$.`, `The standard deviation is multiplied by $c$: $${sd}c = ${num(S)}$, so $c = ${num(c)}$.`]),
        P("Find the value of $d$.", 2, ans.int(d), [`The mean changes in the same way as each value: $${num(c)}${br(mean)} + d = ${num(M)}$`, `$d = ${num(M)} - ${num(fix(c * mean))} = ${d}$`])] };
    } });

  // ======================= 4.4 and 4.10 regression =======================
  // Least-squares statistics of paired data, from the sums of squares and products.
  function regStats(xs, ys) {
    const n = xs.length, mx = sum(xs) / n, my = sum(ys) / n;
    const sxx = sum(xs.map((x) => (x - mx) ** 2)), syy = sum(ys.map((y) => (y - my) ** 2)), sxy = sum(xs.map((x, i) => (x - mx) * (ys[i] - my)));
    return { mx, my, a: sxy / sxx, b: my - (sxy / sxx) * mx, c: sxy / syy, d: mx - (sxy / syy) * my, r: sxy / Math.sqrt(sxx * syy) };
  }
  const REG_CTX = [
    { stem: "A teacher records the number of hours of revision, $x$, and the test score, $y$, of eight students.", xn: "Hours of revision, $x$", yn: "Test score, $y$", x0: [1, 3], gap: [1, 2], a0: 4.2, b0: 30, noise: 7, dp: 0 },
    { stem: "A cafe records the midday temperature, $x$ degrees Celsius, and the number of hot drinks it sells, $y$, on eight days.", xn: "Temperature, $x$", yn: "Hot drinks sold, $y$", x0: [4, 9], gap: [2, 4], a0: -4.5, b0: 220, noise: 16, dp: 0 },
    { stem: "A dealer records the age, $x$ years, and the value, $y$ thousand euros, of eight cars of the same model.", xn: "Age, $x$", yn: "Value, $y$", x0: [1, 2], gap: [1, 2], a0: -1.3, b0: 27, noise: 2.5, dp: 1 },
    { stem: "A farmer records the mass of fertiliser used, $x$ kilograms, and the yield of wheat, $y$ tonnes, on eight fields.", xn: "Fertiliser, $x$", yn: "Yield, $y$", x0: [10, 20], gap: [5, 10], a0: 0.12, b0: 3, noise: 0.9, dp: 1 }];
  function regSit(rng) {
    const ci = rng.int(0, REG_CTX.length - 1), c = REG_CTX[ci], p10 = Math.pow(10, c.dp);
    let xs, ys, st;
    do {
      xs = [rng.int(c.x0[0], c.x0[1])];
      for (let i = 1; i < 8; i++) xs.push(xs[i - 1] + rng.int(c.gap[0], c.gap[1]));
      ys = xs.map((x) => Math.round((c.b0 + c.a0 * x + (2 * rng.next() - 1) * c.noise) * p10) / p10);
      st = regStats(xs, ys);
    } while (Math.abs(st.r) < 0.8 || Math.abs(st.r) > 0.99 || new Set(ys).size < 7);
    const inside = [];
    for (let x = xs[1] + 1; x < xs[6]; x++) if (!xs.includes(x)) inside.push(x);
    const xq = inside.length ? rng.pick(inside) : xs[3] + 0.5, ymin = Math.min(...ys), ymax = Math.max(...ys);
    const yq = Math.round((ymin + (ymax - ymin) * rng.pick([0.3, 0.45, 0.6, 0.7])) * p10) / p10;
    return { ci, xs, ys, xq, yq, xfar: xs[7] + (xs[7] - xs[0]), yfar: Math.round((ymax + 1.5 * (ymax - ymin)) * p10) / p10 };
  }
  const regTable = (s) => ({ head: [REG_CTX[s.ci].xn].concat(cells(s.xs)), rows: [[REG_CTX[s.ci].yn].concat(cells(s.ys))] });
  const GDC_YX = "Enter the data in two lists on a calculator and find the linear regression of $y$ on $x$.";
  const GDC_XY = "Enter the data in two lists on a calculator and find the linear regression with the lists swapped, so that $x$ is given in terms of $y$.";
  const strength = (rng, r) => {
    const sign = r > 0 ? "positive" : "negative", other = r > 0 ? "negative" : "positive";
    return ans.choice(rng, { text: `a strong ${sign} linear correlation`, value: [1, Math.sign(r)] }, [
      { text: `a strong ${other} linear correlation`, value: [1, -Math.sign(r)], why: "The sign of $r$ gives the direction of the correlation." },
      { text: `a weak ${sign} linear correlation`, value: [0, Math.sign(r)], why: "A value of $r$ close to $1$ or $-1$ is strong, not weak." },
      { text: "no linear correlation", value: [0, 0], why: "That would need $r$ close to $0$." }]);
  };
  const REG = { type: "t4-regression-gdc", syllabus: ["4.4"], representation: "table", format: "value", calculator: true, situationKey: "reg8", situation: regSit };
  reg({ ...REG, format: "mcq", unknown: "regression-line", levels: [2], skills: ["SL4.4.regression-y-on-x", "SL4.4.pearson-r", "SL4.4.describe-correlation"], title: "Regression line and correlation coefficient from a table",
    build({ rng, sit: s }) {
      const st = regStats(s.xs, s.ys);
      return { table: regTable(s), stem: `${REG_CTX[s.ci].stem} The results are shown in the table. The regression line of $y$ on $x$ is $y = ax + b$.`, parts: [
        P("Find the value of $a$.", 1, ans.sf(st.a), [GDC_YX, `$a = ${sf(st.a)}$`]),
        P("Find the value of $b$.", 1, ans.sf(st.b), [`From the same calculation, $b = ${sf(st.b)}$.`]),
        P("Find the value of Pearson's product-moment correlation coefficient, $r$.", 1, ans.sf(st.r), [`From the same calculation, $r = ${sf(st.r)}$.`]),
        P("Which phrase describes the correlation between $x$ and $y$?", 1, strength(rng, st.r), [`$r = ${sf(st.r)}$ is close to $${st.r > 0 ? 1 : -1}$, so there is a strong ${st.r > 0 ? "positive" : "negative"} linear correlation.`])] };
    } });
  reg({ ...REG, format: "mcq", unknown: "predict-from-data", levels: [4], skills: ["SL4.4.regression-y-on-x", "SL4.4.pearson-r", "SL4.4.predict"], title: "Regression line from a table, an estimate and its reliability",
    build({ rng, sit: s }) {
      const st = regStats(s.xs, s.ys), est = st.a * s.xq + st.b;
      return { table: regTable(s), stem: `${REG_CTX[s.ci].stem} The results are shown in the table. The regression line of $y$ on $x$ is $y = ax + b$.`, parts: [
        P("Find the value of Pearson's product-moment correlation coefficient, $r$.", 1, ans.sf(st.r), [GDC_YX, `$r = ${sf(st.r)}$`]),
        P("Find the value of $a$.", 1, ans.sf(st.a), [`From the same calculation, $a = ${sf(st.a)}$.`]),
        P("Find the value of $b$.", 1, ans.sf(st.b), [`From the same calculation, $b = ${sf(st.b)}$.`]),
        P(`Use the regression line to estimate the value of $y$ when $x = ${num(s.xq)}$.`, 2, loose(est, (Math.abs(s.xq) * ulp3(st.a) + ulp3(st.b)) * 1.05), [
          `$y = ${sf(st.a)}${br(s.xq)} ${signed(Number(sf(st.b).replace(/\\,/g, "")))}$`, `$y \\approx ${sf(est)}$`]),
        P(`Is it sensible to use the regression line to estimate $y$ when $x = ${num(s.xfar)}$?`, 1, ans.choice(rng, { text: `No, because $x = ${num(s.xfar)}$ is far outside the range of the data.`, value: "extrapolation" }, [
          { text: "Yes, because the correlation is strong.", value: "strong", why: "A strong correlation describes the data only over the range that was measured." },
          { text: "Yes, because the regression line of $y$ on $x$ is the right line for estimating $y$.", value: "line", why: "It is the right line, but only for values of $x$ inside the range of the data." },
          { text: "No, because a regression line of $y$ on $x$ can only be used to estimate $x$.", value: "wrong-line", why: "The line of $y$ on $x$ is the one used to estimate $y$ from $x$." }]), [
          `The data cover values of $x$ from $${num(s.xs[0])}$ to $${num(s.xs[7])}$.`, "Estimating outside this range is extrapolation, and the linear pattern may not continue."])] };
    } });
  function reg5Sit(rng) {
    let xs, ys, st, h;
    do {
      h = rng.pick([1, 2, 5]); const x0 = h * rng.int(1, 6), a0 = rng.sign() * rng.pick([0.6, 1, 1.5, 2.5, 3]) / (h === 5 ? 2.5 : 1), b0 = rng.int(20, 40);
      xs = [0, 1, 2, 3, 4].map((i) => x0 + i * h);
      ys = xs.map((x) => Math.round(b0 + a0 * (x - xs[2])) + rng.int(-2, 2));
      st = regStats(xs, ys);
    } while (!(Math.abs(st.r) >= 0.8) || Math.abs(st.r) > 0.995 || sum(ys) % 5 !== 0 || Math.min(...ys) < 2 || Math.abs(st.a * 10 - Math.round(st.a * 10)) > 1e-9);
    return { xs, ys, h, xq: xs[2] + rng.pick([-1, 1]) * h * rng.pick([0.5, 1.5]) };
  }
  const REG5 = { type: "t4-regression-gdc", syllabus: ["4.4"], representation: "table", format: "value", situationKey: "reg5", situation: reg5Sit };
  const reg5Table = (s) => ({ head: ["$x$"].concat(cells(s.xs)), rows: [["$y$"].concat(cells(s.ys))] });
  reg({ ...REG5, unknown: "mean-point", levels: [1], skills: ["SL4.4.mean-point"], title: "The mean point of a small set of paired data",
    build({ sit: s }) {
      const mx = sum(s.xs) / 5, my = sum(s.ys) / 5;
      return { table: reg5Table(s), stem: "The table shows five pairs of values of the variables $x$ and $y$.", parts: [
        P("Find $\\bar{x}$, the mean of the values of $x$.", 1, ans.int(mx), [`$\\bar{x} = \\dfrac{${s.xs.join(" + ")}}{5} = \\dfrac{${sum(s.xs)}}{5} = ${mx}$`]),
        P("Find $\\bar{y}$, the mean of the values of $y$.", 1, ans.int(my), [`$\\bar{y} = \\dfrac{${s.ys.join(" + ")}}{5} = \\dfrac{${sum(s.ys)}}{5} = ${my}$`])] };
    } });
  reg({ ...REG5, unknown: "c-from-mean-point", levels: [3], skills: ["SL4.4.mean-point", "SL4.4.regression-y-on-x", "SL4.4.predict"], title: "Use the mean point to complete a regression line, then estimate",
    build({ sit: s }) {
      const st = regStats(s.xs, s.ys), mx = fix(st.mx), my = fix(st.my), a = fix(st.a), c = fix(my - a * mx), est = fix(a * s.xq + c);
      return { table: reg5Table(s), stem: `The table shows five pairs of values of the variables $x$ and $y$. The regression line of $y$ on $x$ has equation $y = ${coef(a, "x")} + c$, where $c$ is a constant.`, parts: [
        P("Find $\\bar{x}$, the mean of the values of $x$.", 1, ans.int(mx), [`$\\bar{x} = \\dfrac{${sum(s.xs)}}{5} = ${mx}$`]),
        P("Find $\\bar{y}$, the mean of the values of $y$.", 1, ans.int(my), [`$\\bar{y} = \\dfrac{${sum(s.ys)}}{5} = ${my}$`]),
        P("Find the value of $c$.", 3, ans.dec(c), [
          `The regression line passes through the mean point $${fmt.point(mx, my)}$.`, `$${my} = ${num(a)}${br(mx)} + c$`, `$c = ${my} - ${paren(fix(a * mx))} = ${num(c)}$`]),
        P(`Use the regression line to estimate the value of $y$ when $x = ${num(s.xq)}$.`, 2, ans.dec(est), [`$y = ${num(a)}${br(s.xq)} ${signed(c)}$`, `$y = ${num(est)}$`])] };
    } });
  reg({ type: "t4-regression-interpret", syllabus: ["4.4"], representation: "words", format: "mcq", unknown: "interpret-gradient", levels: [2], calculator: true,
    skills: ["SL4.4.interpret-ab", "SL4.4.predict"], title: "Interpret the gradient of a regression line and use the line",
    build({ rng }) {
      const c = rng.pick([
        { intro: "A cafe owner records the number of hours of sunshine in a day, $x$, and the number of ice creams sold that day, $y$.", as: [6.5, 8.2, 12.4, 9.6], bs: [18, 25, 32.5], xs: [4, 6, 7, 9], ks: [2, 3, 5],
          per: "For each extra hour of sunshine", y: "the number of ice creams sold", u: "", zero: "On a day with no sunshine", Y: "The number of ice creams sold", x: "the number of hours of sunshine" },
        { intro: "A dealer records the age of a car, $x$ years, and its value, $y$ thousand euros.", as: [-1.6, -2.3, -1.25, -0.9], bs: [21.5, 26, 18.4], xs: [3, 4, 6, 8], ks: [2, 3, 4],
          per: "For each extra year of age", y: "the value of a car", u: " thousand euros", zero: "When a car is new", Y: "The value of a car in thousands of euros", x: "its age in years" },
        { intro: "A vet records the age of a puppy, $x$ weeks, and its mass, $y$ kilograms.", as: [0.45, 0.6, 0.85, 1.2], bs: [1.1, 2.4, 3.5], xs: [5, 8, 10, 12], ks: [2, 4, 5],
          per: "For each extra week of age", y: "the mass of a puppy", u: " kilograms", zero: "When a puppy is born", Y: "The mass of a puppy in kilograms", x: "its age in weeks" }]);
      const a = rng.pick(c.as), b = rng.pick(c.bs), x = rng.pick(c.xs), k = rng.pick(c.ks), up = a > 0, mag = Math.abs(a), dir = up ? "increases" : "decreases", rev = up ? "decreases" : "increases";
      const change = fix(mag * k), est = fix(a * x + b);
      return { params: { a, b, x, k }, stem: `${c.intro} For the data collected, the regression line of $y$ on $x$ is $y = ${expr([[a, "x"], [b, ""]])}$.`, parts: [
        P("Which statement interprets the gradient of the regression line?", 1, ans.choice(rng, { text: `${c.per}, ${c.y} ${dir} by about $${num(mag)}$${c.u}.`, value: "gradient" }, [
          { text: `${c.zero}, ${c.y} is about $${num(mag)}$${c.u}.`, value: "intercept", why: "That describes the intercept, and it uses the wrong number." },
          { text: `${c.Y} is always $${num(mag)}$ times ${c.x}.`, value: "proportional", why: "The line has an intercept, so $y$ is not a multiple of $x$." },
          { text: `${c.per}, ${c.y} ${rev} by about $${num(b)}$${c.u}.`, value: "wrong-number", why: "The gradient is the coefficient of $x$, and its sign gives the direction." }]), [
          `The gradient is $${num(a)}$: the change in $y$ for each increase of $1$ in $x$.`, `${c.per}, ${c.y} ${dir} by about $${num(mag)}$${c.u}.`]),
        P(`According to the line, by how much does $y$ ${up ? "increase" : "decrease"} when $x$ increases by $${k}$?`, 1, ans.dec(change), [`$${num(mag)} \\times ${k} = ${num(change)}$`]),
        P(`Use the line to estimate the value of $y$ when $x = ${x}$.`, 2, ans.dec(est), [`$y = ${num(a)}${br(x)} + ${num(b)}$`, `$y = ${num(est)}$`])] };
    } });

  const XY = { type: "t4-regression-x-on-y", syllabus: ["4.10"], representation: "table", calculator: true, situationKey: "reg8", situation: regSit };
  reg({ ...XY, format: "value", unknown: "x-on-y-line", levels: [2], skills: ["SL4.10.x-on-y-line", "SL4.10.predict-x"], title: "Regression line of x on y from a table, then an estimate of x",
    build({ sit: s }) {
      const st = regStats(s.xs, s.ys), est = st.c * s.yq + st.d;
      return { table: regTable(s), stem: `${REG_CTX[s.ci].stem} The results are shown in the table. The regression line of $x$ on $y$ is $x = cy + d$.`, parts: [
        P("Find the value of $c$.", 1, ans.sf(st.c), [GDC_XY, `$c = ${sf(st.c)}$`]),
        P("Find the value of $d$.", 1, ans.sf(st.d), [`From the same calculation, $d = ${sf(st.d)}$.`]),
        P(`Use this regression line to estimate the value of $x$ when $y = ${num(s.yq)}$.`, 2, loose(est, (Math.abs(s.yq) * ulp3(st.c) + ulp3(st.d)) * 1.05), [
          `$x = ${sf(st.c)}${br(s.yq)} ${signed(Number(sf(st.d).replace(/\\,/g, "")))}$`, `$x \\approx ${sf(est)}$`])] };
    } });
  reg({ ...XY, format: "mcq", unknown: "predict-x-from-data", levels: [4], skills: ["SL4.10.x-on-y-line", "SL4.10.predict-x", "SL4.10.choose-line"], title: "Choose and find the right regression line to estimate x, and judge the estimate",
    build({ rng, sit: s }) {
      const st = regStats(s.xs, s.ys), est = st.c * s.yq + st.d;
      return { table: regTable(s), stem: `${REG_CTX[s.ci].stem} The results are shown in the table. An estimate is needed for the value of $x$ when $y = ${num(s.yq)}$.`, parts: [
        P("Which regression line should be used to make this estimate?", 1, ans.choice(rng, { text: "The regression line of $x$ on $y$, because $x$ is being estimated from $y$.", value: "x-on-y" }, [
          { text: "The regression line of $y$ on $x$, because it is the line a calculator gives first.", value: "y-on-x", why: "The line of $y$ on $x$ is for estimating $y$ from a given $x$." },
          { text: "Either line, because the two lines are the same.", value: "either", why: "The two regression lines are different unless the correlation is perfect." },
          { text: "Neither line, because $x$ cannot be estimated from $y$.", value: "neither", why: "The regression line of $x$ on $y$ is made for exactly this." }]), [
          "The regression line of $x$ on $y$ is used to estimate $x$ from a given value of $y$."]),
        P("The regression line of $x$ on $y$ is $x = cy + d$. Find the value of $c$.", 1, ans.sf(st.c), [GDC_XY, `$c = ${sf(st.c)}$`]),
        P("Find the value of $d$.", 1, ans.sf(st.d), [`From the same calculation, $d = ${sf(st.d)}$.`]),
        P(`Find the estimate of $x$ when $y = ${num(s.yq)}$.`, 2, loose(est, (Math.abs(s.yq) * ulp3(st.c) + ulp3(st.d)) * 1.05), [
          `$x = ${sf(st.c)}${br(s.yq)} ${signed(Number(sf(st.d).replace(/\\,/g, "")))}$`, `$x \\approx ${sf(est)}$`]),
        P(`Would the same line give a reliable estimate of $x$ when $y = ${num(s.yfar)}$?`, 1, ans.choice(rng, { text: `No, because $y = ${num(s.yfar)}$ is far outside the range of the data.`, value: "extrapolation" }, [
          { text: "Yes, because the correlation is strong.", value: "strong", why: "A strong correlation describes the data only over the range that was measured." },
          { text: "Yes, because any value of $y$ can be put into the equation.", value: "any", why: "The equation gives a number, but the linear pattern may not continue outside the data." },
          { text: "No, because a regression line can never be used to estimate $x$.", value: "never", why: "The line of $x$ on $y$ is the right one for estimating $x$." }]), [
          `The data cover values of $y$ from $${num(Math.min(...s.ys))}$ to $${num(Math.max(...s.ys))}$.`, "Estimating outside this range is extrapolation, so the estimate is not reliable."])] };
    } });
  function linesSit(rng) {
    const [a, c] = rng.pick([[2, 0.25], [2, 0.4], [0.5, 1.5], [4, 0.2], [1.5, 0.5], [0.8, 1], [3, 0.25], [-2, -0.25], [-0.5, -1.5], [-4, -0.2], [-1.5, -0.4]]);
    const xb = rng.int(4, 20), yb = rng.int(20, 60), y0 = yb + rng.pick([-6, -4, -2, 2, 4, 6, 8]);
    return { a, c, xb, yb, b: fix(yb - a * xb), d: fix(xb - c * yb), y0, x0: fix(c * y0 + xb - c * yb) };
  }
  const whichLine = (rng, s) => ans.choice(rng, { text: `$x = ${expr([[s.c, "y"], [s.d, ""]])}$, the regression line of $x$ on $y$`, value: "x-on-y" }, [
    { text: `$y = ${expr([[s.a, "x"], [s.b, ""]])}$, the regression line of $y$ on $x$`, value: "y-on-x", why: "The line of $y$ on $x$ is for estimating $y$ from a given $x$." },
    { text: "Either equation, because both lines pass through the mean point", value: "either", why: "The lines share the mean point but give different estimates everywhere else." },
    { text: "Neither equation, because $x$ cannot be estimated from $y$", value: "neither", why: "The regression line of $x$ on $y$ is made for estimating $x$ from $y$." }]);
  const linesStem = (s) => `For a set of paired data, the regression line of $y$ on $x$ is $y = ${expr([[s.a, "x"], [s.b, ""]])}$ and the regression line of $x$ on $y$ is $x = ${expr([[s.c, "y"], [s.d, ""]])}$.`;
  const LINES = { type: "t4-regression-x-on-y", syllabus: ["4.10"], representation: "equation", format: "mcq", situationKey: "two-lines", situation: linesSit };
  reg({ ...LINES, unknown: "predict-x-from-lines", levels: [2], skills: ["SL4.10.choose-line", "SL4.10.predict-x"], title: "Choose the right regression line and estimate x",
    build({ rng, sit: s }) {
      return { stem: linesStem(s), parts: [
        P(`Which equation should be used to estimate the value of $x$ when $y = ${s.y0}$?`, 1, whichLine(rng, s), ["To estimate $x$ from a given value of $y$, use the regression line of $x$ on $y$."]),
        P(`Find this estimate of $x$.`, 2, ans.dec(s.x0), [`$x = ${num(s.c)}${br(s.y0)} ${signed(s.d)}$`, `$x = ${num(s.x0)}$`])] };
    } });
  reg({ ...LINES, unknown: "mean-point-from-lines", levels: [3], skills: ["SL4.10.mean-point-intersection", "SL4.10.choose-line", "SL4.10.predict-x"], title: "Mean point from the two regression lines, then an estimate of x",
    build({ rng, sit: s }) {
      const lineY = expr([[s.a, "x"], [s.b, ""]]), ac = fix(s.a * s.c), k = fix(s.c * s.b + s.d);
      return { stem: linesStem(s), parts: [
        P("Find $\\bar{x}$, the mean of the values of $x$.", 3, ans.int(s.xb), [
          "Both regression lines pass through the mean point $(\\bar{x},\\, \\bar{y})$, so solve the two equations together.",
          `Substitute the first equation into the second: $x = ${coef(s.c, `(${lineY})`)} ${signed(s.d)}$`, `$x = ${expr([[ac, "x"], [k, ""]])}$`, `$${coef(fix(1 - ac), "x")} = ${num(k)}$, so $\\bar{x} = ${s.xb}$`]),
        P("Find $\\bar{y}$, the mean of the values of $y$.", 1, ans.int(s.yb), [`$\\bar{y} = ${num(s.a)}${br(s.xb)} ${signed(s.b)} = ${s.yb}$`]),
        P(`Which equation should be used to estimate the value of $x$ when $y = ${s.y0}$?`, 1, whichLine(rng, s), ["To estimate $x$ from a given value of $y$, use the regression line of $x$ on $y$."]),
        P("Find this estimate of $x$.", 2, ans.dec(s.x0), [`$x = ${num(s.c)}${br(s.y0)} ${signed(s.d)}$`, `$x = ${num(s.x0)}$`])] };
    } });

  // ======================= 4.5 probability =======================
  const TWO_WAY = [
    { people: "students at a music school", rows: ["Plays the piano", "Does not play the piano"], cols: ["Junior", "Senior"], a: "plays the piano", b: "is a junior", one: "student",
      est: (M) => `The school has $${num(M)}$ students in total. Use the survey to estimate how many of them play the piano.` },
    { people: "members of a cycling club", rows: ["Owns a road bike", "Does not own a road bike"], cols: ["Under thirty", "Thirty or over"], a: "owns a road bike", b: "is under thirty", one: "member",
      est: (M) => `Clubs in the region have $${num(M)}$ members in total. Use the survey to estimate how many of them own a road bike.` },
    { people: "visitors to a museum", rows: ["Bought a guide book", "Did not buy a guide book"], cols: ["Adult", "Child"], a: "bought a guide book", b: "is an adult", one: "visitor",
      est: (M) => `In one month the museum has $${num(M)}$ visitors. Use the survey to estimate how many of them bought a guide book.` }];
  const twoWayTable = (c, v, hide) => {
    const show = (i) => (i === hide ? "$k$" : m(num(v[i])));
    return { head: ["Group", c.cols[0], c.cols[1], "Total"], rows: [[c.rows[0], show(0), show(1), m(num(v[0] + v[1]))], [c.rows[1], show(2), show(3), m(num(v[2] + v[3]))], ["Total", m(num(v[0] + v[2])), m(num(v[1] + v[3])), m(num(sum(v)))]] };
  };
  reg({ type: "t4-probability-basic", syllabus: ["4.5", "4.6"], representation: "table", format: "value", unknown: "two-way-whole", levels: [3],
    skills: ["SL4.5.relative-frequency", "SL4.5.equally-likely", "SL4.5.expected-occurrences", "SL4.6.union"], title: "Probabilities and an expected number from a two-way table",
    build({ rng }) {
      const c = rng.pick(TWO_WAY), N = rng.pick([40, 50, 60, 80, 100, 120]);
      let v;
      do { v = [rng.int(4, N / 2), rng.int(4, N / 2), rng.int(4, N / 2)]; v.push(N - sum(v)); } while (v[3] < 4 || new Set(v).size < 4);
      const hide = rng.int(0, 3), rowTot = hide < 2 ? v[0] + v[1] : v[2] + v[3], mate = v[hide ^ 1], t = rng.pick([5, 10, 20, 25]), A = v[0] + v[1], either = v[0] + v[1] + v[2];
      return { params: { v, hide, M: N * t }, table: twoWayTable(c, v, hide), stem: `A survey recorded two facts about each of $${N}$ ${c.people}. The results are shown in the table, where $k$ is a number to be found.`, parts: [
        P("Find the value of $k$.", 1, ans.int(v[hide]), [`The row that contains $k$ has a total of $${rowTot}$: $k = ${rowTot} - ${mate} = ${v[hide]}$`]),
        P(`One ${c.one} from the survey is chosen at random. Find the probability that this ${c.one} ${c.a}.`, 1, ans.frac(A, N), [`$${eqFrac(A, N)}$`]),
        P(`Find the probability that this ${c.one} ${c.a} and ${c.b}.`, 1, ans.frac(v[0], N), [`$${eqFrac(v[0], N)}$`]),
        P(`Find the probability that this ${c.one} ${c.a} or ${c.b}, or both.`, 2, ans.frac(either, N), [
          `Count each ${c.one} once: $${v[0]} + ${v[1]} + ${v[2]} = ${either}$`, `$${eqFrac(either, N)}$`]),
        P(c.est(N * t), 2, ans.int(A * t), [`Expected number $= ${frac(A, N)} \\times ${num(N * t)}$`, `Expected number $= ${num(A * t)}$`])] };
    } });
  reg({ type: "t4-probability-basic", syllabus: ["4.5"], representation: "words", format: "value", unknown: "bag-counter", levels: [1],
    skills: ["SL4.5.equally-likely", "SL4.5.complement"], title: "Probability of an outcome and of its complement",
    build({ rng }) {
      const col = rng.sample(["red", "blue", "green", "yellow", "white"], 3), n = [rng.int(2, 9), rng.int(2, 9), rng.int(2, 9)], T = sum(n);
      const thing = rng.pick(["counters", "beads", "marbles"]);
      return { params: { n }, stem: `A bag contains $${n[0]}$ ${col[0]} ${thing}, $${n[1]}$ ${col[1]} ${thing} and $${n[2]}$ ${col[2]} ${thing}. One of them is taken from the bag at random.`, parts: [
        P(`Find the probability that it is ${col[0]}.`, 1, ans.frac(n[0], T), [`There are $${T}$ ${thing} in total, and $${n[0]}$ of them are ${col[0]}: $${eqFrac(n[0], T)}$`]),
        P(`Find the probability that it is not ${col[0]}.`, 1, ans.frac(T - n[0], T), [`$1 - ${frac(n[0], T)} = ${frac(T - n[0], T)}$`])] };
    } });
  reg({ type: "t4-probability-basic", syllabus: ["4.5"], representation: "table", format: "value", unknown: "rf-from-table", levels: [4], calculator: true,
    skills: ["SL4.5.relative-frequency", "SL4.5.complement", "SL4.5.expected-occurrences"], title: "Probabilities estimated from relative frequencies",
    build({ rng }) {
      const col = rng.sample(["Red", "Blue", "Green", "Yellow", "White"], 4);
      let f, N;
      do { f = col.map(() => rng.int(14, 62)); N = sum(f); } while (N % 10 === 0 || new Set(f).size < 4);
      const M = rng.pick([250, 400, 600, 750, 900]), p0 = f[0] / N, p01 = (f[0] + f[1]) / N, e = (M * (N - f[2])) / N, lc = col.map((s) => s.toLowerCase());
      return { params: { f, M }, table: { head: ["Colour"].concat(col), rows: [["Frequency"].concat(cells(f))] }, stem: `A spinner has four sectors of different sizes, each a different colour. It is spun $${N}$ times, and the table shows how often it lands on each colour.`, parts: [
        P(`Estimate the probability that the spinner lands on ${lc[0]}.`, 2, ans.sf(p0), [`Use the relative frequency: $\\dfrac{${f[0]}}{${N}}$`, `$\\approx ${sf(p0)}$`]),
        P(`Estimate the probability that the spinner lands on ${lc[0]} or ${lc[1]}.`, 2, ans.sf(p01), [`$\\dfrac{${f[0]} + ${f[1]}}{${N}} = \\dfrac{${f[0] + f[1]}}{${N}}$`, `$\\approx ${sf(p01)}$`]),
        P(`The spinner is spun a further $${M}$ times. Estimate the number of times it does not land on ${lc[2]}.`, 2, ans.sf(e), [
          `The estimated probability of not landing on ${lc[2]} is $\\dfrac{${N} - ${f[2]}}{${N}} = \\dfrac{${N - f[2]}}{${N}}$.`, `$\\dfrac{${N - f[2]}}{${N}} \\times ${M} \\approx ${sf(e)}$`])] };
    } });
  reg({ type: "t4-expected-occurrences", syllabus: ["4.5"], representation: "words", format: "value", unknown: "trials-for-count", levels: [2],
    skills: ["SL4.5.expected-occurrences", "SL4.5.complement"], title: "Number of trials needed for an expected number",
    build({ rng }) {
      const c = rng.pick([["a seed of a certain plant germinates", "seeds", "planted", "germinate", "do not germinate"], ["a customer who enters a shop buys something", "customers", "counted", "buy something", "buy nothing"],
        ["a light bulb of a certain type lasts for more than a year", "bulbs", "installed", "last for more than a year", "do not last for more than a year"]]);
      let p, n;
      do { p = rng.pick([0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.6]); n = rng.pick([40, 60, 80, 100, 120, 160, 200, 240]); } while (!Number.isInteger(fix(n * p)));
      const e = fix(n * p);
      return { params: { p, e }, stem: `The probability that ${c[0]} is $${num(p)}$.`, parts: [
        P(`Find the number of ${c[1]} that must be ${c[2]} for the expected number that ${c[3]} to be $${e}$.`, 2, ans.int(n), [`Expected number $= np$, so $${num(p)}n = ${e}$.`, `$n = \\dfrac{${e}}{${num(p)}} = ${n}$`]),
        P(`For this number of ${c[1]}, find the expected number that ${c[4]}.`, 1, ans.int(n - e), [`$${n} - ${e} = ${n - e}$`])] };
    } });

  // ======================= 4.6 combined events =======================
  function vennSit(rng) {
    let a, b, both, none;
    do { both = 5 * rng.int(1, 5); a = both + 5 * rng.int(2, 7); b = both + 5 * rng.int(2, 7); none = 100 - a - b + both; } while (none < 5 || a === b || a + b >= 100);
    return { pA: a / 100, pB: b / 100, pAB: both / 100, pU: fix((a + b - both) / 100) };
  }
  const VENN = { type: "t4-venn-addition-rule", syllabus: ["4.6"], representation: "equation", format: "value", situationKey: "venn", situation: vennSit };
  reg({ ...VENN, unknown: "union-from-rule", levels: [2], skills: ["SL4.6.union", "SL4.6.venn"], title: "The addition rule: union, neither and exactly one",
    build({ sit: s }) {
      return { stem: `For events $A$ and $B$, $\\mathrm{P}(A) = ${num(s.pA)}$, $\\mathrm{P}(B) = ${num(s.pB)}$ and $\\mathrm{P}(A \\cap B) = ${num(s.pAB)}$.`, parts: [
        P("Find $\\mathrm{P}(A \\cup B)$.", 2, ans.dec(s.pU), [`$\\mathrm{P}(A \\cup B) = \\mathrm{P}(A) + \\mathrm{P}(B) - \\mathrm{P}(A \\cap B)$`, `$\\mathrm{P}(A \\cup B) = ${num(s.pA)} + ${num(s.pB)} - ${num(s.pAB)} = ${num(s.pU)}$`]),
        P("Find the probability that neither $A$ nor $B$ occurs.", 1, ans.dec(fix(1 - s.pU)), [`$1 - \\mathrm{P}(A \\cup B) = 1 - ${num(s.pU)} = ${num(fix(1 - s.pU))}$`]),
        P("Find the probability that exactly one of $A$ and $B$ occurs.", 1, ans.dec(fix(s.pU - s.pAB)), [`$\\mathrm{P}(A \\cup B) - \\mathrm{P}(A \\cap B) = ${num(s.pU)} - ${num(s.pAB)} = ${num(fix(s.pU - s.pAB))}$`])] };
    } });
  reg({ ...VENN, unknown: "intersection-from-rule", levels: [2], skills: ["SL4.6.union", "SL4.6.venn"], title: "The addition rule: intersection and one event only",
    build({ sit: s }) {
      return { stem: `For events $A$ and $B$, $\\mathrm{P}(A) = ${num(s.pA)}$, $\\mathrm{P}(B) = ${num(s.pB)}$ and $\\mathrm{P}(A \\cup B) = ${num(s.pU)}$.`, parts: [
        P("Find $\\mathrm{P}(A \\cap B)$.", 2, ans.dec(s.pAB), [`$\\mathrm{P}(A \\cap B) = \\mathrm{P}(A) + \\mathrm{P}(B) - \\mathrm{P}(A \\cup B)$`, `$\\mathrm{P}(A \\cap B) = ${num(s.pA)} + ${num(s.pB)} - ${num(s.pU)} = ${num(s.pAB)}$`]),
        P("Find $\\mathrm{P}(A \\cap B')$.", 1, ans.dec(fix(s.pA - s.pAB)), [`$\\mathrm{P}(A \\cap B') = \\mathrm{P}(A) - \\mathrm{P}(A \\cap B) = ${num(s.pA)} - ${num(s.pAB)} = ${num(fix(s.pA - s.pAB))}$`]),
        P("Find $\\mathrm{P}(A' \\cap B)$.", 1, ans.dec(fix(s.pB - s.pAB)), [`$\\mathrm{P}(A' \\cap B) = \\mathrm{P}(B) - \\mathrm{P}(A \\cap B) = ${num(s.pB)} - ${num(s.pAB)} = ${num(fix(s.pB - s.pAB))}$`])] };
    } });
  reg({ type: "t4-venn-addition-rule", syllabus: ["4.6"], representation: "words", format: "value", unknown: "x-from-total", levels: [3],
    skills: ["SL4.6.venn", "SL4.6.union", "SL4.6.conditional-diagram"], title: "A survey of two activities: the overlap and probabilities from the Venn diagram",
    build({ rng }) {
      const c = rng.pick([["students in a year group", "study art", "study biology", "studies art", "studies biology", "student"], ["members of a sports club", "play tennis", "play hockey", "plays tennis", "plays hockey", "member"],
        ["employees of a company", "speak French", "speak Spanish", "speaks French", "speaks Spanish", "employee"]]);
      let oa, ob, both, none;
      do { oa = rng.int(5, 16); ob = rng.int(5, 16); both = rng.int(3, 12); none = rng.int(2, 10); } while (oa === ob);
      const N = oa + ob + both + none, a = oa + both, b = ob + both;
      return { params: { N, a, b, none }, stem: `There are $${N}$ ${c[0]}. Of these, $${a}$ ${c[1]}, $${b}$ ${c[2]} and $${none}$ do neither.`, parts: [
        P(`Find the number who ${c[1]} and also ${c[2]}.`, 2, ans.int(both), [
          `$${N} - ${none} = ${N - none}$ do at least one of the two.`, `$${a} + ${b} - ${N - none} = ${both}$ do both.`]),
        P(`Find the number who ${c[1]} but do not ${c[2]}.`, 1, ans.int(oa), [`$${a} - ${both} = ${oa}$`]),
        P(`One ${c[5]} is chosen at random. Find the probability that this ${c[5]} does exactly one of the two.`, 2, ans.frac(oa + ob, N), [
          `$${oa} + ${ob} = ${oa + ob}$ do exactly one.`, `$${eqFrac(oa + ob, N)}$`]),
        P(`A ${c[5]} who ${c[4]} is chosen at random. Find the probability that this ${c[5]} also ${c[3]}.`, 2, ans.frac(both, b), [
          `Only the $${b}$ who ${c[2]} can be chosen, and $${both}$ of them also ${c[1]}.`, `$${eqFrac(both, b)}$`])] };
    } });
  reg({ type: "t4-tree-diagram", syllabus: ["4.6"], representation: "words", format: "value", unknown: "same-or-different", levels: [3],
    skills: ["SL4.6.tree", "SL4.5.complement"], title: "Two draws without replacement",
    build({ rng }) {
      const col = rng.sample(["red", "blue", "green", "black", "white"], 2), thing = rng.pick(["counters", "sweets", "socks", "balls"]);
      let r, b;
      do { r = rng.int(3, 7); b = rng.int(2, 6); } while (r === b);
      const T = r + b, den = T * (T - 1), rr = r * (r - 1), bb = b * (b - 1);
      return { params: { r, b }, stem: `A bag contains $${r}$ ${col[0]} ${thing} and $${b}$ ${col[1]} ${thing}. Two are taken from the bag at random, one after the other, without replacement.`, parts: [
        P(`Find the probability that both are ${col[0]}.`, 2, ans.frac(rr, den), [`$\\dfrac{${r}}{${T}} \\times \\dfrac{${r - 1}}{${T - 1}} = \\dfrac{${rr}}{${den}}$`, `$= ${frac(rr, den)}$`]),
        P("Find the probability that the two are the same colour.", 2, ans.frac(rr + bb, den), [
          `Both ${col[1]}: $\\dfrac{${b}}{${T}} \\times \\dfrac{${b - 1}}{${T - 1}} = \\dfrac{${bb}}{${den}}$`, `$\\dfrac{${rr}}{${den}} + \\dfrac{${bb}}{${den}} = ${frac(rr + bb, den)}$`]),
        P(`Find the probability that at least one of the two is ${col[0]}.`, 2, ans.frac(den - bb, den), [
          `At least one ${col[0]} is the complement of both ${col[1]}.`, `$1 - \\dfrac{${bb}}{${den}} = ${frac(den - bb, den)}$`])] };
    } });
  reg({ type: "t4-tree-diagram", syllabus: ["4.6"], representation: "words", format: "value", unknown: "path-probability", levels: [2],
    skills: ["SL4.6.tree"], title: "Probabilities along and across the branches of a tree diagram",
    build({ rng }) {
      const c = rng.pick([
        { s: (p, a, b) => `On any school day, the probability that it rains is $${p}$. When it rains, the probability that Ana is late for school is $${a}$. When it does not rain, the probability that she is late is $${b}$.`, q1: "Find the probability that, on a given school day, it rains and Ana is late.", q2: "Find the probability that Ana is late on a given school day.", e: ["R", "L"] },
        { s: (p, a, b) => `A factory has two machines. Machine A makes a proportion $${p}$ of the items and machine B makes the rest. The probability that an item from machine A is faulty is $${a}$, and the probability that an item from machine B is faulty is $${b}$.`, q1: "An item is chosen at random. Find the probability that it was made by machine A and is faulty.", q2: "Find the probability that a randomly chosen item is faulty.", e: ["A", "F"] },
        { s: (p, a, b) => `A football team plays a proportion $${p}$ of its matches at home. The probability that it wins a home match is $${a}$, and the probability that it wins an away match is $${b}$.`, q1: "A match is chosen at random. Find the probability that it is a home match that the team wins.", q2: "Find the probability that the team wins a randomly chosen match.", e: ["H", "W"] }]);
      const p = rng.pick([0.2, 0.3, 0.4, 0.6, 0.7]), a = rng.pick([0.3, 0.4, 0.5, 0.6]), b = rng.pick([0.05, 0.1, 0.15, 0.2]), pa = fix(p * a), qb = fix((1 - p) * b), [X, Y] = c.e;
      return { params: { p, a, b }, stem: c.s(num(p), num(a), num(b)), parts: [
        P(c.q1, 2, ans.dec(pa), [`Multiply along the branches: $\\mathrm{P}(${X} \\cap ${Y}) = ${num(p)} \\times ${num(a)}$`, `$\\mathrm{P}(${X} \\cap ${Y}) = ${num(pa)}$`]),
        P(c.q2, 2, ans.dec(fix(pa + qb)), [`The other branch that ends in $${Y}$: $\\mathrm{P}(${X}' \\cap ${Y}) = ${num(fix(1 - p))} \\times ${num(b)} = ${num(qb)}$`, `Add the two branches: $\\mathrm{P}(${Y}) = ${num(pa)} + ${num(qb)} = ${num(fix(pa + qb))}$`])] };
    } });
  function gridSit(rng) {
    const A = rng.pick([[1, 2, 3, 4], [1, 2, 3], [2, 4, 6], [1, 3, 5], [1, 2, 3, 4, 5]]), B = rng.pick([[1, 2, 3, 4], [1, 2, 3, 4, 5, 6], [2, 3, 4, 5], [1, 3, 5, 7], [0, 1, 2, 3]]);
    const counts = {};
    for (const a of A) for (const b of B) counts[a + b] = (counts[a + b] || 0) + 1;
    const totals = Object.keys(counts).map(Number).sort((x, y) => x - y), n = A.length * B.length;
    const s = rng.pick(totals.filter((t) => counts[t] >= 2));
    const atLeast = (t) => sum(totals.filter((x) => x >= t).map((x) => counts[x]));
    const t = rng.pick(totals.filter((x) => atLeast(x) >= 2 && atLeast(x) <= n - 2 && x !== s));
    return { A, B, s, t };
  }
  const gridTable = (g) => ({ head: ["$+$"].concat(cells(g.B)), rows: g.A.map((a) => [m(num(a))].concat(cells(g.B.map((b) => a + b)))) });
  const gridStem = (g) => `Two fair spinners are spun. The first is equally likely to show each of the numbers $${listTex(g.A)}$ and the second is equally likely to show each of $${listTex(g.B)}$. The two numbers are added to give a total. The table shows the possible totals.`;
  const GRID = { type: "t4-sample-space", syllabus: ["4.6"], representation: "table", format: "value", situationKey: "grid", situation: gridSit };
  reg({ ...GRID, unknown: "total-outcomes", levels: [1], skills: ["SL4.6.sample-space-grid"], title: "Count outcomes in a sample space table",
    build({ sit: g }) {
      const n = g.A.length * g.B.length, k = g.A.reduce((c, a) => c + g.B.filter((b) => a + b === g.s).length, 0);
      return { table: gridTable(g), stem: gridStem(g), parts: [
        P("Write down the number of equally likely outcomes.", 1, ans.int(n), [`There are $${g.A.length}$ rows and $${g.B.length}$ columns: $${g.A.length} \\times ${g.B.length} = ${n}$`]),
        P(`Write down the number of outcomes in which the total is $${g.s}$.`, 1, ans.int(k), [`The total $${g.s}$ appears $${k}$ times in the table.`])] };
    } });
  reg({ ...GRID, unknown: "p-score", levels: [2], skills: ["SL4.6.sample-space-grid", "SL4.5.equally-likely"], title: "Probabilities from a sample space table",
    build({ sit: g }) {
      const n = g.A.length * g.B.length, k = g.A.reduce((c, a) => c + g.B.filter((b) => a + b === g.s).length, 0), k2 = g.A.reduce((c, a) => c + g.B.filter((b) => a + b >= g.t).length, 0);
      return { table: gridTable(g), stem: gridStem(g), parts: [
        P(`Find the probability that the total is $${g.s}$.`, 2, ans.frac(k, n), [`There are $${n}$ equally likely outcomes, and the total $${g.s}$ appears $${k}$ times.`, `$${eqFrac(k, n)}$`]),
        P(`Find the probability that the total is at least $${g.t}$.`, 2, ans.frac(k2, n), [`$${k2}$ of the $${n}$ outcomes have a total of $${g.t}$ or more.`, `$${eqFrac(k2, n)}$`])] };
    } });

  // ======================= 4.7 discrete random variables =======================
  reg({ type: "t4-discrete-distribution", syllabus: ["4.7"], representation: "table", format: "value", unknown: "event-probability", levels: [2],
    skills: ["SL4.7.find-k", "SL4.7.table-probabilities"], title: "A missing probability, then probabilities of events",
    build({ rng }) {
      const xs = rng.pick([[1, 2, 3, 4, 5], [0, 1, 2, 3, 4], [2, 4, 6, 8, 10]]);
      let p;
      do { p = xs.map(() => 5 * rng.int(1, 8)); } while (sum(p) !== 100 || new Set(p).size < 3);
      const h = rng.int(0, 4), pr = p.map((v) => v / 100), c = rng.int(2, 3), lo = rng.int(0, 1), hi = lo + rng.int(1, 2) + (lo === 0 ? 1 : 0);
      const ge = fix(sum(pr.slice(c))), mid = fix(sum(pr.slice(lo, hi + 1)));
      return { params: { xs, p: pr, h, c, lo, hi }, table: { head: ["$x$"].concat(cells(xs)), rows: [["$\\mathrm{P}(X = x)$"].concat(pr.map((v, i) => (i === h ? "$k$" : m(num(v)))))] },
        stem: "The discrete random variable $X$ has the probability distribution shown in the table.", parts: [
          P("Find the value of $k$.", 2, ans.dec(pr[h]), [`The probabilities add up to $1$: $${pr.map((v, i) => (i === h ? "k" : num(v))).join(" + ")} = 1$`, `$k = 1 - ${num(fix(1 - pr[h]))} = ${num(pr[h])}$`]),
          P(`Find $\\mathrm{P}(X \\ge ${xs[c]})$.`, 1, ans.dec(ge), [`$${pr.slice(c).map((v) => num(v)).join(" + ")} = ${num(ge)}$`]),
          P(`Find $\\mathrm{P}(${xs[lo]} \\le X \\le ${xs[hi]})$.`, 1, ans.dec(mid), [`$${pr.slice(lo, hi + 1).map((v) => num(v)).join(" + ")} = ${num(mid)}$`])] };
    } });
  reg({ type: "t4-discrete-distribution", syllabus: ["4.7"], representation: "equation", format: "value", unknown: "k-from-sum", levels: [1],
    skills: ["SL4.7.find-k"], title: "Find the constant in a probability function",
    build({ rng }) {
      const f = rng.pick([{ tex: "kx", w: (x) => x, lo: 1, n: [3, 4, 5, 6] }, { tex: "k(x + 1)", w: (x) => x + 1, lo: 0, n: [3, 4, 5] }, { tex: "kx^{2}", w: (x) => x * x, lo: 1, n: [3, 4] }, { tex: "k(2x + 1)", w: (x) => 2 * x + 1, lo: 0, n: [3, 4] }]);
      const n = rng.pick(f.n), xs = Array.from({ length: n }, (_, i) => f.lo + i), w = xs.map(f.w), total = sum(w);
      return { params: { xs, w }, stem: `The discrete random variable $X$ has probability distribution $\\mathrm{P}(X = x) = ${f.tex}$ for $x = ${listTex(xs)}$, where $k$ is a constant.`, parts: [
        P("Find the value of $k$.", 2, ans.frac(1, total), [`The probabilities add up to $1$: $${w.map((v) => coef(v, "k")).join(" + ")} = 1$`, `$${total}k = 1$, so $k = ${frac(1, total)}$`])] };
    } });
  reg({ type: "t4-expected-value", syllabus: ["4.7"], representation: "words", format: "value", unknown: "fair-stake", levels: [2],
    skills: ["SL4.7.expected-value", "SL4.7.fair-game"], title: "Expected prize, expected loss and a fair game",
    build({ rng }) {
      let prizes, p, ev, cost;
      do {
        prizes = [0, rng.pick([1, 2]), rng.pick([4, 5, 6]), rng.pick([10, 12, 20])]; const p3 = rng.pick([0.05, 0.1]), p2 = rng.pick([0.1, 0.15, 0.2]), p1 = rng.pick([0.2, 0.25, 0.3, 0.4]);
        p = [fix(1 - p1 - p2 - p3), p1, p2, p3]; ev = fix(sum(prizes.map((x, i) => x * p[i]))); cost = Math.ceil(ev) + rng.pick([0, 0.5, 1]);
      } while (p[0] > 0.6 || cost <= ev);
      return { params: { prizes, p, cost }, table: { head: ["Prize in euros"].concat(cells(prizes)), rows: [["Probability"].concat(cells(p))] },
        stem: `In a game at a fair, a player spins a wheel and wins a prize. The table shows the prizes and their probabilities. It costs $${num(cost)}$ euros to play.`, parts: [
          P("Find the expected value of the prize, in euros.", 2, ans.dec(ev), [`$\\mathrm{E}(X) = ${prizes.map((x, i) => `${x}${br(p[i])}`).join(" + ")}$`, `$\\mathrm{E}(X) = ${num(ev)}$`]),
          P("Find the amount, in euros, that a player expects to lose per game.", 1, ans.dec(fix(cost - ev)), [`Cost minus expected prize: $${num(cost)} - ${num(ev)} = ${num(fix(cost - ev))}$`]),
          P("Write down the cost per game, in euros, that would make the game fair.", 1, ans.dec(ev), [`A game is fair when the cost equals the expected prize, so the cost should be $${num(ev)}$ euros.`])] };
    } });
  reg({ type: "t4-expected-value", syllabus: ["4.7"], representation: "equation", format: "value", unknown: "probabilities-from-mean", levels: [3],
    skills: ["SL4.7.unknowns-from-mean", "SL4.7.expected-value", "SL4.7.table-probabilities"], title: "Two unknown probabilities from the expected value",
    build({ rng }) {
      const xs = rng.pick([[1, 2, 3, 4], [0, 1, 2, 3], [2, 3, 4, 5]]);
      let g0, g3, p, q;
      do { g0 = 5 * rng.int(1, 6); g3 = 5 * rng.int(1, 6); p = 5 * rng.int(1, 10); q = 100 - g0 - g3 - p; } while (q < 5 || q > 60 || p === q);
      [g0, g3, p, q] = [g0, g3, p, q].map((v) => v / 100);
      const S = fix(p + q), ev = fix(xs[0] * g0 + xs[1] * p + xs[2] * q + xs[3] * g3), R = fix(ev - xs[0] * g0 - xs[3] * g3);
      return { params: { xs, g0, g3, ev }, table: { head: ["$x$"].concat(cells(xs)), rows: [["$\\mathrm{P}(X = x)$", m(num(g0)), "$p$", "$q$", m(num(g3))]] },
        stem: `The discrete random variable $X$ has the probability distribution shown in the table. It is given that $\\mathrm{E}(X) = ${num(ev)}$.`, parts: [
          P("Find the value of $p + q$.", 1, ans.dec(S), [`The probabilities add up to $1$: $p + q = 1 - ${num(g0)} - ${num(g3)} = ${num(S)}$`]),
          P("Find the value of $p$.", 3, ans.dec(p), [
            `$\\mathrm{E}(X) = ${xs[0]}${br(g0)} + ${coef(xs[1], "p")} + ${xs[2]}q + ${xs[3]}${br(g3)} = ${num(ev)}$, so $${coef(xs[1], "p")} + ${xs[2]}q = ${num(R)}$`,
            `Substitute $q = ${num(S)} - p$: $${coef(xs[1], "p")} + ${xs[2]}(${num(S)} - p) = ${num(R)}$`, `$${num(fix(xs[2] * S))} - p = ${num(R)}$, so $p = ${num(p)}$`]),
          P("Find the value of $q$.", 1, ans.dec(q), [`$q = ${num(S)} - ${num(p)} = ${num(q)}$`])] };
    } });

  // ======================= 4.8 binomial distribution =======================
  const binStory = (rng, n, p) => rng.pick([
    `Each item made by a machine is faulty with probability $${num(p)}$, independently of the others. A batch of $${n}$ items is checked, and $X$ is the number of faulty items.`,
    `Each time an archer shoots, the probability of hitting the centre of the target is $${num(p)}$, independently of the other shots. The archer shoots $${n}$ times, and $X$ is the number of hits on the centre.`,
    `Each seed of a certain type germinates with probability $${num(p)}$, independently of the others. A gardener plants $${n}$ seeds, and $X$ is the number that germinate.`]);
  const BCDF = "Using the binomial cumulative distribution function on a calculator, ";
  reg({ ...BIN, representation: "words", unknown: "at-most-probability", levels: [2], skills: ["SL4.8.cumulative-probability", "SL4.8.identify"], title: "Cumulative binomial probabilities",
    build({ rng }) {
      let n, p, k, k2, lo, hi;
      do {
        n = rng.pick([8, 10, 12, 15, 20]); p = rng.pick([0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45]); k = Math.max(1, Math.round(n * p) + rng.int(-1, 1)); k2 = k + rng.int(1, 3);
        lo = bcdf(n, p, k); hi = 1 - bcdf(n, p, k2 - 1);
      } while (lo > 0.97 || hi < 0.01 || k2 > n);
      return { params: { n, p, k, k2 }, stem: `${binStory(rng, n, p)} So $X \\sim \\mathrm{B}(${n},\\, ${num(p)})$.`, parts: [
        P(`Find $\\mathrm{P}(X \\le ${k})$.`, 2, ans.sf(lo), [`${BCDF}with $n = ${n}$ and $p = ${num(p)}$:`, `$\\mathrm{P}(X \\le ${k}) = ${sf(lo)}$`]),
        P(`Find $\\mathrm{P}(X \\ge ${k2})$.`, 2, ans.sf(hi), [`$\\mathrm{P}(X \\ge ${k2}) = 1 - \\mathrm{P}(X \\le ${k2 - 1})$`, `$\\mathrm{P}(X \\ge ${k2}) = 1 - ${sf(bcdf(n, p, k2 - 1), 4)} = ${sf(hi)}$`])] };
    } });
  reg({ ...BIN, calculator: false, representation: "equation", unknown: "mean-from-parameters", levels: [1], skills: ["SL4.8.mean-variance"], title: "Mean and variance of a binomial distribution",
    build({ rng }) {
      const [n, p] = rng.pick([[10, 0.2], [20, 0.5], [20, 0.1], [25, 0.2], [40, 0.5], [50, 0.2], [10, 0.5], [30, 0.1], [50, 0.4], [100, 0.1], [20, 0.4], [40, 0.25], [16, 0.25], [80, 0.5], [50, 0.1]]);
      const mean = fix(n * p), v = fix(n * p * (1 - p));
      return { params: { n, p }, stem: `The random variable $X$ follows the binomial distribution $X \\sim \\mathrm{B}(${n},\\, ${num(p)})$.`, parts: [
        P("Find $\\mathrm{E}(X)$.", 1, ans.dec(mean), [`$\\mathrm{E}(X) = np = ${n} \\times ${num(p)} = ${num(mean)}$`]),
        P("Find $\\mathrm{Var}(X)$.", 1, ans.dec(v), [`$\\mathrm{Var}(X) = np(1 - p) = ${num(mean)} \\times ${num(fix(1 - p))} = ${num(v)}$`])] };
    } });
  reg({ ...BIN, calculator: false, representation: "equation", unknown: "n-and-p-from-mean-variance", levels: [3], skills: ["SL4.8.find-n-or-p", "SL4.8.mean-variance"], title: "Find n and p from the mean and the variance",
    build({ rng }) {
      let n, p, mean, v;
      do {
        n = rng.pick([8, 10, 12, 15, 16, 20, 24, 25, 30, 40, 50]); p = rng.pick([0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.75, 0.8]); mean = fix(n * p); v = fix(mean * (1 - p));
      } while (mean === 1 || Math.abs(mean * 10 - Math.round(mean * 10)) > 1e-9 || Math.abs(v * 100 - Math.round(v * 100)) > 1e-9);
      const q = fix(1 - p), sd2 = fix(4 * v);
      return { params: { mean, v }, stem: `The random variable $X$ follows a binomial distribution, $X \\sim \\mathrm{B}(n,\\, p)$, with $\\mathrm{E}(X) = ${num(mean)}$ and $\\mathrm{Var}(X) = ${num(v)}$.`, parts: [
        P("Find the value of $p$.", 3, ans.dec(p), [
          `$np = ${num(mean)}$ and $np(1 - p) = ${num(v)}$`, `Dividing the second equation by the first: $1 - p = \\dfrac{${num(v)}}{${num(mean)}} = ${num(q)}$`, `$p = 1 - ${num(q)} = ${num(p)}$`]),
        P("Find the value of $n$.", 2, ans.int(n), [`$n = \\dfrac{${num(mean)}}{${num(p)}}$`, `$n = ${n}$`]),
        P("The random variable $Y$ is defined by $Y = 2X$. Find the variance of $Y$.", 1, ans.dec(sd2), [`Multiplying by $2$ multiplies the variance by $2^{2}$: $4 \\times ${num(v)} = ${num(sd2)}$`])] };
    } });
  reg({ ...BIN, representation: "words", unknown: "least-trials", levels: [4], niceOk: true, skills: ["SL4.8.find-n-or-p", "SL4.8.cumulative-probability", "SL4.8.binomial-in-context"], title: "At least one success, and the least number of trials",
    build({ rng }) {
      const c = rng.pick([
        { stem: (p) => `Each time Kai plays a game, the probability that he wins a prize is $${p}$, independently of every other game.`, qa: (k) => `Kai plays $${k}$ games. Find the probability that he wins at least one prize.`,
          qb: (t) => `Find the least number of games Kai must play so that the probability that he wins at least one prize is greater than $${t}$.`, qc: "For this number of games, find the expected number of prizes that Kai wins." },
        { stem: (p) => `Each time Mira phones a call centre, the probability that her call is answered within one minute is $${p}$, independently of every other call.`, qa: (k) => `Mira makes $${k}$ calls. Find the probability that at least one of them is answered within one minute.`,
          qb: (t) => `Find the least number of calls Mira must make so that the probability that at least one is answered within one minute is greater than $${t}$.`, qc: "For this number of calls, find the expected number that are answered within one minute." },
        { stem: (p) => `Each ticket in a lottery wins a prize with probability $${p}$, independently of every other ticket.`, qa: (k) => `Leo buys $${k}$ tickets. Find the probability that at least one of them wins a prize.`,
          qb: (t) => `Find the least number of tickets Leo must buy so that the probability that at least one wins a prize is greater than $${t}$.`, qc: "For this number of tickets, find the expected number that win a prize." }]);
      let p, t, n0, quot, least;
      do {
        p = rng.pick([0.08, 0.12, 0.15, 0.2, 0.25, 0.3]); t = rng.pick([0.9, 0.95, 0.99]); n0 = rng.int(4, 9); quot = Math.log(1 - t) / Math.log(1 - p); least = Math.ceil(quot);
      } while (Math.abs(quot - Math.round(quot)) < 0.06 || least <= n0);
      const p1 = 1 - Math.pow(1 - p, n0), q = fix(1 - p);
      return { params: { p, t, n0 }, stem: c.stem(num(p)), parts: [
        P(c.qa(n0), 2, ans.sf(p1), [
          `$\\mathrm{P}(X \\ge 1) = 1 - \\mathrm{P}(X = 0) = 1 - ${num(q)}^{${n0}}$`, `$\\mathrm{P}(X \\ge 1) = ${sf(p1)}$`]),
        P(c.qb(num(t)), 3, ans.int(least), [
          `$1 - ${num(q)}^{n} > ${num(t)}$, so $${num(q)}^{n} < ${num(fix(1 - t))}$`, `$n > \\dfrac{\\ln ${num(fix(1 - t))}}{\\ln ${num(q)}} = ${sf(quot)}$`, `The least value is $n = ${least}$.`]),
        P(c.qc, 1, ans.dec(fix(least * p)), [`$\\mathrm{E}(X) = np = ${least} \\times ${num(p)} = ${num(fix(least * p))}$`])] };
    } });
  reg({ ...BIN, representation: "words", unknown: "between-probability", levels: [4], skills: ["SL4.8.cumulative-probability", "SL4.8.mean-variance", "SL4.8.binomial-in-context"], title: "Binomial probabilities over a range, and the variance",
    build({ rng }) {
      let n, p, a, b, c, pin, pup;
      do {
        n = rng.pick([12, 15, 20, 25, 30]); p = rng.pick([0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45]); a = Math.max(1, Math.floor(n * p) - rng.int(0, 2)); b = a + rng.int(2, 4); c = Math.ceil(n * p) + rng.int(1, 3);
        pin = bcdf(n, p, b) - bcdf(n, p, a - 1); pup = 1 - bcdf(n, p, c - 1);
      } while (pin > 0.97 || pup < 0.01 || c > n);
      return { params: { n, p, a, b, c }, stem: `${binStory(rng, n, p)}`, parts: [
        P(`Find $\\mathrm{P}(${a} \\le X \\le ${b})$.`, 3, ans.sf(pin), [
          `$X \\sim \\mathrm{B}(${n},\\, ${num(p)})$`, `$\\mathrm{P}(${a} \\le X \\le ${b}) = \\mathrm{P}(X \\le ${b}) - \\mathrm{P}(X \\le ${a - 1})$`, `${BCDF}$\\mathrm{P}(${a} \\le X \\le ${b}) = ${sf(pin)}$.`]),
        P(`Find $\\mathrm{P}(X \\ge ${c})$.`, 2, ans.sf(pup), [`$\\mathrm{P}(X \\ge ${c}) = 1 - \\mathrm{P}(X \\le ${c - 1})$`, `$\\mathrm{P}(X \\ge ${c}) = ${sf(pup)}$`]),
        P("Find $\\mathrm{Var}(X)$.", 1, ans.dec(fix(n * p * (1 - p))), [`$\\mathrm{Var}(X) = np(1 - p) = ${n} \\times ${num(p)} \\times ${num(fix(1 - p))} = ${num(fix(n * p * (1 - p)))}$`])] };
    } });

  // ======================= 4.9 normal distribution =======================
  const NORMAL = [
    { what: "masses of the eggs laid on a farm", rv: "the mass of a randomly chosen egg", u: "g", mus: [56, 58, 60, 62], sigs: [4, 5, 6], many: "eggs", meas: "a mass", top: "heaviest" },
    { what: "times taken by the runners to finish a race", rv: "the time taken by a randomly chosen runner", u: "min", mus: [42, 48, 55, 63], sigs: [5, 6, 8], many: "runners", meas: "a time", top: "slowest" },
    { what: "heights of the sunflowers in a field", rv: "the height of a randomly chosen sunflower", u: "cm", mus: [150, 165, 180], sigs: [10, 12, 15], many: "sunflowers", meas: "a height", top: "tallest" },
    { what: "lifetimes of a type of battery", rv: "the lifetime of a randomly chosen battery", u: "h", mus: [300, 340, 420], sigs: [20, 25, 30], many: "batteries", meas: "a lifetime", top: "longest-lasting" }];
  const normStem = (c, mu, sig) => `The ${c.what} are normally distributed with mean $${unit(mu, c.u)}$ and standard deviation $${unit(sig, c.u)}$. Let $${unit("X", c.u)}$ be ${c.rv}.`;
  const normPick = (rng) => { const c = rng.pick(NORMAL); return { c, mu: rng.pick(c.mus), sig: rng.pick(c.sigs) }; };
  const DIST = (mu, sig) => `$X \\sim \\mathrm{N}(${num(mu)},\\, ${num(sig)}^{2})$`;
  reg({ type: "t4-normal-properties", syllabus: ["4.9"], representation: "words", format: "value", unknown: "empirical-count", levels: [2],
    skills: ["SL4.9.properties", "SL4.9.central-interval", "SL4.9.symmetry-probability"], title: "Percentages within one and two standard deviations of the mean",
    build({ rng }) {
      const { c, mu, sig } = normPick(rng), N = rng.pick([50, 100, 200, 250, 500]);
      return { params: { mu, sig, N }, stem: `${normStem(c, mu, sig)} For a normal distribution, about $68\\%$ of the values lie within one standard deviation of the mean and about $95\\%$ lie within two standard deviations of the mean.`, parts: [
        P(`Write down the percentage of ${c.many} with ${c.meas} between $${unit(mu - sig, c.u)}$ and $${unit(mu + sig, c.u)}$.`, 1, pcAns(68), [`$${mu - sig}$ and $${mu + sig}$ are one standard deviation either side of the mean, so the answer is about $68\\%$.`]),
        P(`Find the percentage of ${c.many} with ${c.meas} of more than $${unit(mu + 2 * sig, c.u)}$.`, 2, pcAns(2.5), [
          `$${mu + 2 * sig}$ is two standard deviations above the mean, and $100\\% - 95\\% = 5\\%$ of values lie outside two standard deviations.`, `By symmetry, half of these are above: $2.5\\%$`]),
        P(`In a sample of $${N}$ ${c.many}, estimate the number with ${c.meas} of less than $${unit(mu - sig, c.u)}$.`, 1, ans.int(0.16 * N), [`$100\\% - 68\\% = 32\\%$ lie outside one standard deviation, so $16\\%$ lie below $${mu - sig}$: $0.16 \\times ${N} = ${0.16 * N}$`])] };
    } });
  reg({ type: "t4-normal-properties", syllabus: ["4.9"], representation: "equation", format: "value", unknown: "mirror-tail", levels: [3],
    skills: ["SL4.9.symmetry-probability", "SL4.9.properties"], title: "Probabilities from the symmetry of the normal curve",
    build({ rng }) {
      const mu = rng.int(20, 80), dl = rng.int(3, 12), a = mu + dl, b = mu - dl, t = rng.pick([0.62, 0.66, 0.7, 0.73, 0.78, 0.8, 0.84, 0.86, 0.9, 0.93]), tail = fix(1 - t);
      return { params: { mu, a, t }, stem: `The random variable $X$ is normally distributed with mean $${mu}$. It is given that $\\mathrm{P}(X < ${a}) = ${num(t)}$.`, parts: [
        P(`Find $\\mathrm{P}(X > ${a})$.`, 1, ans.dec(tail), [`$\\mathrm{P}(X > ${a}) = 1 - ${num(t)} = ${num(tail)}$`]),
        P(`Find $\\mathrm{P}(X < ${b})$.`, 2, ans.dec(tail), [`$${b}$ is as far below the mean as $${a}$ is above it, because $${mu} - ${dl} = ${b}$ and $${mu} + ${dl} = ${a}$.`, `By symmetry, $\\mathrm{P}(X < ${b}) = \\mathrm{P}(X > ${a}) = ${num(tail)}$.`]),
        P(`Find $\\mathrm{P}(${b} < X < ${a})$.`, 2, ans.dec(fix(1 - 2 * tail)), [`Remove both tails: $1 - 2 \\times ${num(tail)}$`, `$\\mathrm{P}(${b} < X < ${a}) = ${num(fix(1 - 2 * tail))}$`]),
        P(`Find $\\mathrm{P}(${mu} < X < ${a})$.`, 1, ans.dec(fix(t - 0.5)), [`Half of the distribution lies below the mean: $${num(t)} - 0.5 = ${num(fix(t - 0.5))}$`])] };
    } });
  // A normal curve as many short straight pieces.
  const bell = (mu, sig, lo, hi, top) => ({ x: [lo, hi], y: [0, top], xStep: (hi - lo) / 17, yStep: top * 10, yLabel: " ",
    functions: [{ fn: { type: "pwl", points: Array.from({ length: 171 }, (_, i) => { const x = lo + ((hi - lo) * i) / 170; return [x, Math.exp(-((x - mu) ** 2) / (2 * sig * sig)) / (sig * Math.sqrt(2 * Math.PI))]; }) } }],
    alt: "A bell-shaped curve above a number line" });
  reg({ type: "t4-normal-properties", syllabus: ["4.9"], representation: "diagram", format: "graph", unknown: "match-curve", levels: [2],
    skills: ["SL4.9.properties", "SL4.9.symmetry-probability"], title: "Match a normal curve to its mean and standard deviation",
    build({ rng }) {
      const u = rng.pick([1, 2]), mu = u * rng.int(10, 20), d = rng.sign() * 3 * u, wide = rng.bool(), sig = wide ? 2 * u : u, other = wide ? u : 2 * u;
      const lo = Math.min(mu, mu + d) - 7 * u, hi = lo + 17 * u, top = 0.46 / u, g = (m2, s2) => ({ graph: bell(m2, s2, lo, hi, top), value: [m2, s2] });
      return { params: { mu, sig }, stem: `The random variable $X$ is normally distributed with mean $${mu}$ and standard deviation $${sig}$.`, parts: [
        P("Which graph could show the distribution of $X$?", 2, ans.graph(rng, g(mu, sig), [
          Object.assign(g(mu + d, sig), { why: "The peak of the curve must be at the mean." }),
          Object.assign(g(mu, other), { why: "Almost all of the curve lies within three standard deviations of the mean, which fixes its width." }),
          Object.assign(g(mu + d, other), { why: "Check both the position of the peak and the width of the curve." })]), [
          `The curve is symmetric about the mean, so its peak is at $x = ${mu}$.`, `Almost all of the distribution lies within three standard deviations of the mean, so the curve is close to zero outside $${mu - 3 * sig}$ to $${mu + 3 * sig}$.`]),
        P(`Write down $\\mathrm{P}(X > ${mu})$.`, 1, ans.dec(0.5), ["The curve is symmetric about the mean, so half of the distribution lies above it: $0.5$"])] };
    } });
  reg({ type: "t4-normal-probability", syllabus: ["4.9"], representation: "words", format: "value", unknown: "prob-below", levels: [1], calculator: true,
    skills: ["SL4.9.normal-probability"], title: "A normal probability and its complement on a calculator",
    build({ rng }) {
      const { c, mu, sig } = normPick(rng), a = fix(mu + sig * rng.pick([-1.7, -1.2, -0.6, 0.4, 0.9, 1.3, 1.9])), pb = phi((a - mu) / sig);
      return { params: { mu, sig, a }, stem: normStem(c, mu, sig), parts: [
        P(`Find $\\mathrm{P}(X < ${num(a)})$.`, 1, ans.sf(pb), [DIST(mu, sig), `${CALC}$\\mathrm{P}(X < ${num(a)}) = ${sf(pb)}$.`]),
        P(`Find $\\mathrm{P}(X > ${num(a)})$.`, 1, loose(1 - pb, ulp3(pb)), [`$\\mathrm{P}(X > ${num(a)}) = 1 - \\mathrm{P}(X < ${num(a)}) = ${sf(1 - pb)}$`])] };
    } });
  reg({ type: "t4-normal-probability", syllabus: ["4.9"], representation: "words", format: "value", unknown: "expected-number", levels: [4], calculator: true,
    skills: ["SL4.9.normal-probability", "SL4.5.expected-occurrences"], title: "Normal probabilities and an expected number",
    build({ rng }) {
      const { c, mu, sig } = normPick(rng), a = fix(mu + sig * rng.pick([0.7, 1.1, 1.3, 1.8])), lo = fix(mu - sig * rng.pick([0.4, 0.9, 1.4])), hi = fix(mu + sig * rng.pick([0.3, 0.6, 1.5])), N = rng.pick([150, 240, 350, 600, 850]);
      const pa = 1 - phi((a - mu) / sig), pm = phi((hi - mu) / sig) - phi((lo - mu) / sig);
      return { params: { mu, sig, a, lo, hi, N }, stem: normStem(c, mu, sig), parts: [
        P(`Find $\\mathrm{P}(X > ${num(a)})$.`, 2, ans.sf(pa), [DIST(mu, sig), `${CALC}$\\mathrm{P}(X > ${num(a)}) = ${sf(pa)}$.`]),
        P(`Find $\\mathrm{P}(${num(lo)} < X < ${num(hi)})$.`, 2, ans.sf(pm), [`Enter the lower bound $${num(lo)}$ and the upper bound $${num(hi)}$.`, `$\\mathrm{P}(${num(lo)} < X < ${num(hi)}) = ${sf(pm)}$`]),
        P(`A sample of $${N}$ ${c.many} is taken. Find the expected number with ${c.meas} between $${unit(lo, c.u)}$ and $${unit(hi, c.u)}$.`, 2, loose(N * pm, N * ulp3(pm) * 1.05), [
          `Expected number $= ${N} \\times ${sf(pm, 4)}$`, `Expected number $\\approx ${sf(N * pm)}$`])] };
    } });
  reg({ type: "t4-inverse-normal", syllabus: ["4.9"], representation: "words", format: "value", unknown: "value-below", levels: [2], calculator: true,
    skills: ["SL4.9.inverse-normal"], title: "Find values from given probabilities with the inverse normal",
    build({ rng }) {
      const { c, mu, sig } = normPick(rng), p = rng.pick([0.1, 0.15, 0.2, 0.3, 0.35, 0.65, 0.7, 0.8, 0.85]), topPc = rng.pick([2, 4, 5, 8, 12]);
      const a = mu + sig * invPhi(p), k = mu + sig * invPhi(1 - topPc / 100);
      return { params: { mu, sig, p, topPc }, stem: normStem(c, mu, sig), parts: [
        P(`Find the value of $a$ for which $\\mathrm{P}(X < a) = ${num(p)}$.`, 2, ans.sf(a), [DIST(mu, sig), `${INV}with an area of $${num(p)}$ to the left, $a = ${sf(a)}$.`]),
        P(`The ${c.top} $${pct(topPc)}$ of the ${c.many} have ${c.meas} greater than $${unit("k", c.u)}$. Find the value of $k$.`, 2, ans.sf(k), [
          `$\\mathrm{P}(X > k) = ${num(topPc / 100)}$, so $\\mathrm{P}(X < k) = ${num(fix(1 - topPc / 100))}$`, `${INV}$k = ${sf(k)}$.`])] };
    } });
  reg({ type: "t4-inverse-normal", syllabus: ["4.9"], representation: "words", format: "value", unknown: "central-bounds", levels: [4], calculator: true,
    skills: ["SL4.9.inverse-normal", "SL4.9.central-interval"], title: "Quartiles and a central interval of a normal distribution",
    build({ rng }) {
      const { c, mu, sig } = normPick(rng), mid = rng.pick([80, 90, 95, 98]), q1 = mu + sig * invPhi(0.25), iqr = 2 * (mu - q1), tailP = fix((100 - mid) / 200), d = sig * invPhi(1 - tailP);
      return { params: { mu, sig, mid }, stem: normStem(c, mu, sig), parts: [
        P("Find the lower quartile of $X$.", 2, ans.sf(q1), [`The lower quartile $Q_{1}$ satisfies $\\mathrm{P}(X < Q_{1}) = 0.25$.`, `${INV}$Q_{1} = ${sf(q1)}$.`]),
        P("Find the interquartile range of $X$.", 2, loose(iqr, 2.1 * ulp3(q1)), [`By symmetry, $Q_{3} = ${mu} + (${mu} - ${sf(q1, 5)}) = ${sf(2 * mu - q1, 5)}$.`, `$\\text{IQR} = Q_{3} - Q_{1} \\approx ${sf(iqr)}$`]),
        P(`The middle $${pct(mid)}$ of the distribution lies between $${mu} - d$ and $${mu} + d$. Find the value of $d$.`, 3, ans.sf(d), [
          `Each tail has area $\\dfrac{1 - ${num(mid / 100)}}{2} = ${num(tailP)}$, so $\\mathrm{P}(X < ${mu} + d) = ${num(fix(1 - tailP))}$.`, `${INV}$${mu} + d = ${sf(mu + d, 5)}$.`, `$d = ${sf(d)}$`])] };
    } });

  // ======================= 4.11 conditional probability and independence =======================
  const CP = { type: "t4-conditional-probability", syllabus: ["4.11", "4.6"], format: "value" };
  reg({ ...CP, representation: "table", unknown: "conditional-from-table", levels: [2], skills: ["SL4.11.conditional-formula", "SL4.6.conditional-diagram"], title: "Conditional probabilities from a two-way table",
    build({ rng }) {
      const c = rng.pick(TWO_WAY), N = rng.pick([40, 50, 60, 80, 100, 120]);
      let v;
      do { v = [rng.int(4, N / 2), rng.int(4, N / 2), rng.int(4, N / 2)]; v.push(N - sum(v)); } while (v[3] < 4 || new Set(v).size < 4);
      const colB = v[0] + v[2], rowA = v[0] + v[1];
      return { params: { v }, table: twoWayTable(c, v, -1), stem: `A survey recorded two facts about each of $${N}$ ${c.people}. The results are shown in the table. One ${c.one} from the survey is chosen at random.`, parts: [
        P(`Given that this ${c.one} ${c.b}, find the probability that the ${c.one} ${c.a}.`, 2, ans.frac(v[0], colB), [
          `Only the $${colB}$ in the first column can be chosen, and $${v[0]}$ of them are in the first row.`, `$${eqFrac(v[0], colB)}$`]),
        P(`Given instead that this ${c.one} ${c.a}, find the probability that the ${c.one} ${c.b}.`, 2, ans.frac(v[0], rowA), [
          `Only the $${rowA}$ in the first row can be chosen, and $${v[0]}$ of them are in the first column.`, `$${eqFrac(v[0], rowA)}$`])] };
    } });
  reg({ ...CP, representation: "equation", unknown: "conditional-from-probabilities", levels: [2], skills: ["SL4.11.conditional-formula"], title: "Conditional probabilities from the formula",
    build({ rng }) {
      let pB, c1, c2, pAB, pA;
      do {
        pB = rng.pick([0.2, 0.25, 0.4, 0.5, 0.6, 0.8]); c1 = rng.pick([0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.75]); c2 = rng.pick([0.2, 0.25, 0.4, 0.5, 0.6, 0.8]); pAB = fix(pB * c1); pA = fix(pAB / c2);
      } while (c1 === c2 || pA >= 0.95 || pA < 0.1 || pA + pB - pAB > 0.98 || Math.abs(pA * 1000 - Math.round(pA * 1000)) > 1e-9 || pA === pB);
      return { params: { pA, pB, pAB }, stem: `For events $A$ and $B$, $\\mathrm{P}(A) = ${num(pA)}$, $\\mathrm{P}(B) = ${num(pB)}$ and $\\mathrm{P}(A \\cap B) = ${num(pAB)}$.`, parts: [
        P("Find $\\mathrm{P}(A \\mid B)$.", 2, ans.dec(c1), [`$\\mathrm{P}(A \\mid B) = \\dfrac{\\mathrm{P}(A \\cap B)}{\\mathrm{P}(B)} = \\dfrac{${num(pAB)}}{${num(pB)}}$`, `$\\mathrm{P}(A \\mid B) = ${num(c1)}$`]),
        P("Find $\\mathrm{P}(B \\mid A)$.", 2, ans.dec(c2), [`$\\mathrm{P}(B \\mid A) = \\dfrac{\\mathrm{P}(A \\cap B)}{\\mathrm{P}(A)} = \\dfrac{${num(pAB)}}{${num(pA)}}$`, `$\\mathrm{P}(B \\mid A) = ${num(c2)}$`])] };
    } });
  reg({ ...CP, representation: "equation", unknown: "intersection-from-conditional", levels: [1], skills: ["SL4.11.multiplication-rule"], title: "The multiplication rule for a conditional probability",
    build({ rng }) {
      const pB = rng.pick([0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]), c1 = rng.pick([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.9]), pAB = fix(pB * c1);
      return { params: { pB, c1 }, stem: `For events $A$ and $B$, $\\mathrm{P}(B) = ${num(pB)}$ and $\\mathrm{P}(A \\mid B) = ${num(c1)}$.`, parts: [
        P("Find $\\mathrm{P}(A \\cap B)$.", 2, ans.dec(pAB), [`$\\mathrm{P}(A \\cap B) = \\mathrm{P}(A \\mid B)\\,\\mathrm{P}(B) = ${num(c1)} \\times ${num(pB)}$`, `$\\mathrm{P}(A \\cap B) = ${num(pAB)}$`])] };
    } });
  reg({ ...CP, syllabus: ["4.11", "4.8"], representation: "words", unknown: "conditional-binomial", levels: [4], calculator: true, skills: ["SL4.11.conditional-distributions", "SL4.11.conditional-formula", "SL4.8.exact-probability"], title: "A conditional probability within a binomial distribution",
    build({ rng }) {
      const n = rng.pick([5, 6, 8, 10, 12]), p = rng.pick([0.1, 0.15, 0.2, 0.25, 0.3]), k = rng.int(2, 3);
      const p1 = 1 - Math.pow(1 - p, n), pk = bpmf(n, p, k), cond = pk / p1;
      return { params: { n, p, k }, stem: binStory(rng, n, p), parts: [
        P("Find $\\mathrm{P}(X \\ge 1)$.", 2, ans.sf(p1), [`$X \\sim \\mathrm{B}(${n},\\, ${num(p)})$`, `$\\mathrm{P}(X \\ge 1) = 1 - \\mathrm{P}(X = 0) = 1 - ${num(fix(1 - p))}^{${n}} = ${sf(p1)}$`]),
        P(`Find $\\mathrm{P}(X = ${k})$.`, 1, ans.sf(pk), [`Using the binomial probability function on a calculator, $\\mathrm{P}(X = ${k}) = ${sf(pk)}$.`]),
        P(`Given that $X \\ge 1$, find the probability that $X = ${k}$.`, 3, loose(cond, (ulp3(pk) / p1 + (pk * ulp3(p1)) / (p1 * p1)) * 1.05), [
          `$\\mathrm{P}(X = ${k} \\mid X \\ge 1) = \\dfrac{\\mathrm{P}(X = ${k} \\cap X \\ge 1)}{\\mathrm{P}(X \\ge 1)}$`, `If $X = ${k}$ then $X \\ge 1$ as well, so the numerator is $\\mathrm{P}(X = ${k})$.`, `$\\dfrac{${sf(pk, 4)}}{${sf(p1, 4)}} = ${sf(cond)}$`])] };
    } });
  const IND = { type: "t4-independence", syllabus: ["4.11", "4.6"] };
  reg({ ...IND, representation: "equation", format: "value", unknown: "both-from-probabilities", levels: [1], skills: ["SL4.6.independent", "SL4.11.test-independence"], title: "Probabilities for two independent events",
    build({ rng }) {
      let pA, pB;
      do { pA = rng.pick([0.2, 0.3, 0.4, 0.5, 0.6, 0.7]); pB = rng.pick([0.1, 0.2, 0.25, 0.4, 0.5, 0.8]); } while (pA === pB);
      return { params: { pA, pB }, stem: `The events $A$ and $B$ are independent, with $\\mathrm{P}(A) = ${num(pA)}$ and $\\mathrm{P}(B) = ${num(pB)}$.`, parts: [
        P("Find $\\mathrm{P}(A \\cap B)$.", 1, ans.dec(fix(pA * pB)), [`For independent events, $\\mathrm{P}(A \\cap B) = \\mathrm{P}(A)\\,\\mathrm{P}(B) = ${num(pA)} \\times ${num(pB)} = ${num(fix(pA * pB))}$`]),
        P("Write down $\\mathrm{P}(A \\mid B)$.", 1, ans.dec(pA), [`For independent events, knowing that $B$ has occurred does not change the probability of $A$: $\\mathrm{P}(A \\mid B) = \\mathrm{P}(A) = ${num(pA)}$`])] };
    } });
  reg({ ...IND, representation: "equation", format: "value", unknown: "unknown-from-union", levels: [3], skills: ["SL4.11.independence-unknown", "SL4.6.independent", "SL4.6.union"], title: "Independent events: an unknown probability from the union",
    build({ rng }) {
      let a, x, u;
      do { a = rng.pick([0.2, 0.25, 0.3, 0.4, 0.5, 0.6]); x = rng.pick([0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.75]); u = fix(a + x - a * x); } while (a === x);
      const both = fix(a * x), none = fix(1 - u);
      return { params: { a, u }, stem: `The events $A$ and $B$ are independent. It is given that $\\mathrm{P}(A) = ${num(a)}$ and $\\mathrm{P}(A \\cup B) = ${num(u)}$.`, parts: [
        P("Find $\\mathrm{P}(B)$.", 3, ans.dec(x), [
          `Let $\\mathrm{P}(B) = x$. Since the events are independent, $\\mathrm{P}(A \\cap B) = ${num(a)}x$.`, `$\\mathrm{P}(A \\cup B) = \\mathrm{P}(A) + \\mathrm{P}(B) - \\mathrm{P}(A \\cap B)$ gives $${num(u)} = ${num(a)} + x - ${num(a)}x$`,
          `$${num(fix(1 - a))}x = ${num(fix(u - a))}$, so $x = ${num(x)}$`]),
        P("Find $\\mathrm{P}(A \\cap B)$.", 1, ans.dec(both), [`$\\mathrm{P}(A \\cap B) = ${num(a)} \\times ${num(x)} = ${num(both)}$`]),
        P("Write down $\\mathrm{P}(B \\mid A)$.", 1, ans.dec(x), [`The events are independent, so $\\mathrm{P}(B \\mid A) = \\mathrm{P}(B) = ${num(x)}$.`]),
        P("Find $\\mathrm{P}(A' \\cap B')$.", 1, ans.dec(none), [`$\\mathrm{P}(A' \\cap B') = 1 - \\mathrm{P}(A \\cup B) = 1 - ${num(u)} = ${num(none)}$`])] };
    } });
  reg({ ...IND, representation: "table", format: "mcq", unknown: "test-from-table", levels: [3], skills: ["SL4.11.test-independence", "SL4.11.conditional-formula"], title: "Test two events for independence from a two-way table",
    build({ rng }) {
      const c = rng.pick(TWO_WAY), indep = rng.bool();
      let N, ra, cb, v;
      do {
        N = rng.pick([40, 50, 60, 80, 100, 120, 200]); ra = rng.int(2, 8) * (N / 10); cb = rng.int(2, 8) * (N / 10);
        const cell = (ra * cb) / N + (indep ? 0 : rng.pick([-3, -2, 2, 3]));
        v = [cell, ra - cell, cb - cell, N - ra - cb + cell];
      } while (v.some((x) => !Number.isInteger(x) || x < 3) || ra === cb);
      const prod = rat.mul(rat.Q(ra, N), rat.Q(cb, N)), eq = "\\mathrm{P}(A \\cap B) = \\mathrm{P}(A)\\,\\mathrm{P}(B)", ne = "\\mathrm{P}(A \\cap B) \\ne \\mathrm{P}(A)\\,\\mathrm{P}(B)";
      const Y = { text: `Yes, because $${eq}$.`, value: [true, "product"], why: "Work out the product $\\mathrm{P}(A)\\,\\mathrm{P}(B)$ and compare it with $\\mathrm{P}(A \\cap B)$." };
      const Nn = { text: `No, because $${ne}$.`, value: [false, "product"], why: "Work out the product $\\mathrm{P}(A)\\,\\mathrm{P}(B)$ and compare it with $\\mathrm{P}(A \\cap B)$." };
      return { params: { v }, table: twoWayTable(c, v, -1), stem: `A survey recorded two facts about each of $${N}$ ${c.people}. The results are shown in the table. One ${c.one} is chosen at random. Let $A$ be the event that the ${c.one} ${c.a}, and $B$ the event that the ${c.one} ${c.b}.`, parts: [
        P("Find $\\mathrm{P}(A)$.", 1, ans.frac(ra, N), [`$${eqFrac(ra, N)}$`]),
        P("Find $\\mathrm{P}(B)$.", 1, ans.frac(cb, N), [`$${eqFrac(cb, N)}$`]),
        P("Find $\\mathrm{P}(A \\cap B)$.", 1, ans.frac(v[0], N), [`$${eqFrac(v[0], N)}$`]),
        P("Are the events $A$ and $B$ independent?", 2, ans.choice(rng, indep ? Y : Nn, [indep ? Nn : Y,
          { text: "No, because $\\mathrm{P}(A \\cap B) \\ne 0$.", value: [false, "exclusive"], why: "That is the test for mutually exclusive events, not for independence." },
          { text: "Yes, because $\\mathrm{P}(A \\cap B) \\ne 0$.", value: [true, "exclusive"], why: "Events that can happen together are not always independent." }]), [
          `$\\mathrm{P}(A)\\,\\mathrm{P}(B) = ${frac(ra, N)} \\times ${frac(cb, N)} = ${rat.tex(prod)}$`,
          indep ? `This equals $\\mathrm{P}(A \\cap B) = ${frac(v[0], N)}$, so $A$ and $B$ are independent.` : `This is not equal to $\\mathrm{P}(A \\cap B) = ${frac(v[0], N)}$, so $A$ and $B$ are not independent.`])] };
    } });

  // ======================= 4.12 standardising =======================
  const NUP = { type: "t4-normal-unknown-parameter", format: "value" };
  reg({ ...NUP, syllabus: ["4.12"], representation: "equation", unknown: "standardise-event", levels: [2], skills: ["SL4.12.z-score", "SL4.12.standardise"], title: "Standardise a value, and find a value from its z-score",
    build({ rng }) {
      const mu = rng.int(30, 90), sig = rng.pick([4, 6, 8, 10, 12]), [z1, z2] = rng.sample([-2.5, -2, -1.5, -1.25, -0.75, -0.5, 0.5, 0.75, 1.25, 1.5, 2, 2.5], 2), x1 = mu + z1 * sig, x2 = mu + z2 * sig;
      return { params: { mu, sig, x1, z2 }, stem: `The random variable $X$ is normally distributed with mean $${mu}$ and standard deviation $${sig}$.`, parts: [
        P(`Find the standardised value ($z$-score) of $x = ${num(x1)}$.`, 2, ans.dec(z1), [`$z = \\dfrac{x - \\mu}{\\sigma} = \\dfrac{${num(x1)} - ${mu}}{${sig}}$`, `$z = ${num(z1)}$`]),
        P(`A value of $X$ has a $z$-score of $${num(z2)}$. Find this value.`, 2, ans.dec(x2), [`$x = \\mu + z\\sigma = ${mu} + ${paren(z2)} \\times ${sig}$`, `$x = ${num(x2)}$`])] };
    } });
  reg({ ...NUP, syllabus: ["4.12", "4.9"], representation: "equation", unknown: "z-from-area", levels: [1], calculator: true, skills: ["SL4.12.standardise", "SL4.9.inverse-normal"], title: "Find z-values from areas under the standard normal curve",
    build({ rng }) {
      const p = rng.pick([0.05, 0.1, 0.2, 0.3, 0.7, 0.75, 0.8, 0.9, 0.95, 0.975]), q = rng.pick([0.01, 0.02, 0.04, 0.08, 0.12, 0.15, 0.25]);
      return { params: { p, q }, stem: "The random variable $Z$ follows the standard normal distribution, $Z \\sim \\mathrm{N}(0,\\, 1)$.", parts: [
        P(`Find the value of $a$ for which $\\mathrm{P}(Z < a) = ${num(p)}$.`, 1, ans.sf(invPhi(p)), [`${INV}with an area of $${num(p)}$ to the left, $a = ${sf(invPhi(p))}$.`]),
        P(`Find the value of $b$ for which $\\mathrm{P}(Z > b) = ${num(q)}$.`, 1, ans.sf(invPhi(1 - q)), [`$\\mathrm{P}(Z < b) = 1 - ${num(q)} = ${num(fix(1 - q))}$, so $b = ${sf(invPhi(1 - q))}$.`])] };
    } });
  reg({ ...NUP, syllabus: ["4.12", "4.9"], representation: "words", unknown: "unknown-mean", levels: [4], calculator: true, skills: ["SL4.12.unknown-mean-or-sd", "SL4.12.standardise", "SL4.9.inverse-normal"], title: "Find a mean from a probability",
    build({ rng }) {
      const c = rng.pick([["A machine fills bags with flour. The masses of the bags", "g", [8, 10, 12, 15], [490, 500, 510, 990, 1000], "bags have a mass"], ["The volumes of juice in the cartons filled by a machine", "ml", [4, 5, 6, 8], [245, 250, 330, 495], "cartons have a volume"],
        ["The lengths of the rods cut by a machine", "mm", [1.5, 2, 2.5, 3], [118, 120, 150, 198], "rods have a length"]]);
      const sig = rng.pick(c[2]), a = rng.pick(c[3]), below = rng.bool(), pc = rng.pick(below ? [2, 4, 5, 8, 12, 15] : [3, 6, 10, 14, 20]), p = pc / 100;
      const z = below ? invPhi(p) : invPhi(1 - p), mu = a - z * sig;
      return { params: { sig, a, p, below }, stem: `${c[0]} are normally distributed with mean $${unit("\\mu", c[1])}$ and standard deviation $${unit(sig, c[1])}$. It is known that $${pct(pc)}$ of the ${c[4]} ${below ? "less" : "greater"} than $${unit(a, c[1])}$.`, parts: [
        P(`Find the value of $z$ for which $\\mathrm{P}(Z ${below ? "<" : ">"} z) = ${num(p)}$, where $Z \\sim \\mathrm{N}(0,\\, 1)$.`, 2, ans.sf(z), [
          below ? `The area to the left of $z$ is $${num(p)}$.` : `$\\mathrm{P}(Z < z) = 1 - ${num(p)} = ${num(fix(1 - p))}$`, `${INV}$z = ${sf(z)}$.`]),
        P("Find the value of $\\mu$.", 3, loose(mu, sig * 0.0006), [`Standardise: $\\dfrac{${num(a)} - \\mu}{${num(sig)}} = ${sf(z, 5)}$`, `$\\mu = ${num(a)} - ${par(sf(z, 5))} \\times ${num(sig)}$`, `$\\mu = ${sf(mu)}$`])] };
    } });
  reg({ ...NUP, syllabus: ["4.12", "4.9"], representation: "words", unknown: "mean-and-sd", levels: [4], calculator: true, skills: ["SL4.12.unknown-mean-and-sd", "SL4.12.standardise", "SL4.9.inverse-normal"], title: "Find both the mean and the standard deviation",
    build({ rng }) {
      const c = rng.pick([["times taken by students to complete a task", "min", "students take", [20, 25, 30, 40], [8, 10, 12, 15]], ["masses of the melons grown on a farm", "kg", "melons have a mass of", [1.2, 1.5, 1.8], [0.6, 0.8, 1, 1.2]],
        ["daily distances walked by a postal worker", "km", "days have a distance of", [9, 10, 12], [3, 4, 5, 6]]]);
      const a = rng.pick(c[3]), b = fix(a + rng.pick(c[4])), pc1 = rng.pick([4, 6, 10, 12, 15, 22]), pc2 = rng.pick([3, 5, 8, 14, 18, 25]);
      const z1 = invPhi(pc1 / 100), z2 = invPhi(1 - pc2 / 100), sig = (b - a) / (z2 - z1), mu = a - z1 * sig;
      return { params: { a, b, p1: pc1 / 100, p2: pc2 / 100 }, stem: `The ${c[0]} are normally distributed with mean $${unit("\\mu", c[1])}$ and standard deviation $${unit("\\sigma", c[1])}$. It is known that $${pct(pc1)}$ of the ${c[2]} less than $${unit(a, c[1])}$ and $${pct(pc2)}$ of the ${c[2]} more than $${unit(b, c[1])}$.`, parts: [
        P(`Find the value of $z_{1}$ for which $\\mathrm{P}(Z < z_{1}) = ${num(pc1 / 100)}$, where $Z \\sim \\mathrm{N}(0,\\, 1)$.`, 1, ans.sf(z1), [`${INV}$z_{1} = ${sf(z1)}$.`]),
        P(`Find the value of $z_{2}$ for which $\\mathrm{P}(Z > z_{2}) = ${num(pc2 / 100)}$.`, 1, ans.sf(z2), [`$\\mathrm{P}(Z < z_{2}) = ${num(fix(1 - pc2 / 100))}$, so $z_{2} = ${sf(z2)}$.`]),
        P("Find the value of $\\sigma$.", 3, loose(sig, sig * 0.002), [
          `Standardising both values: $${num(a)} - \\mu = ${sf(z1, 5)}\\sigma$ and $${num(b)} - \\mu = ${sf(z2, 5)}\\sigma$`, `Subtracting: $${num(fix(b - a))} = ${sf(z2 - z1, 5)}\\sigma$`, `$\\sigma = ${sf(sig)}$`]),
        P("Find the value of $\\mu$.", 2, loose(mu, Math.abs(mu) * 0.002), [`$\\mu = ${num(a)} - ${par(sf(z1, 5))} \\times ${sf(sig, 5)}$`, `$\\mu = ${sf(mu)}$`])] };
    } });

  // ======================= 4.10 recall =======================
  reg({ type: "t4-regression-x-on-y", syllabus: ["4.10"], representation: "words", format: "mcq", unknown: "choose-line", levels: [1], fixedPool: true,
    skills: ["SL4.10.choose-line"], title: "Choose which regression line to use",
    build({ rng }) {
      const c = rng.pick([
        ["the number of hours a student revises", "the test score of the student"], ["the age of a car in years", "the value of the car"], ["the midday temperature", "the number of cold drinks a shop sells"],
        ["the height of a tree", "the width of its trunk"], ["the time an athlete trains each week", "the race time of the athlete"]]);
      const wantX = rng.bool(), known = wantX ? "y" : "x", want = wantX ? "x" : "y", right = wantX ? "x on y" : "y on x";
      const line = (k) => (k === "y on x" ? "The regression line of $y$ on $x$" : "The regression line of $x$ on $y$");
      return { params: { wantX }, stem: `For a set of paired data, $x$ is ${c[0]} and $y$ is ${c[1]}. A value of $${known}$ is known, and an estimate of the matching value of $${want}$ is needed. The known value lies inside the range of the data.`, parts: [
        P("Which regression line should be used?", 1, ans.choice(rng, { text: `${line(right)}.`, value: right }, [
          { text: `${line(wantX ? "y on x" : "x on y")}.`, value: wantX ? "y on x" : "x on y", why: "The line of $y$ on $x$ estimates $y$ from $x$, and the line of $x$ on $y$ estimates $x$ from $y$." },
          { text: "Either line, because they always give the same estimate.", value: "either", why: "The two lines give different estimates unless the correlation is perfect." },
          { text: "Neither line, because a regression line cannot be used for estimates.", value: "neither", why: "Estimating inside the range of the data is what a regression line is for." }]), [
          "The variable being estimated must be the subject of the regression line.", `Here $${want}$ is estimated from $${known}$, so use the regression line of $${want}$ on $${known}$.`])] };
    } });
})(typeof globalThis !== "undefined" ? globalThis : this);
