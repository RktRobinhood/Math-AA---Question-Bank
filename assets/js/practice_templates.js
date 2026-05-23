// ─── Utility ────────────────────────────────────────────────────────────────
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rnd(lo, hi) { return Math.floor(Math.random() * (hi - lo + 1)) + lo; }
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; }
function frac(n, d) {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(Math.abs(n), d);
  n /= g; d /= g;
  if (d === 1) return `${n}`;
  return `\\dfrac{${n}}{${d}}`;
}
function sgn(x) { return x < 0 ? '' + x : (x === 0 ? '0' : '+' + x); }
function fmt(x) { return Number.isInteger(x) ? x.toString() : x.toFixed(3).replace(/\.?0+$/, ''); }
function dp3(x) { return parseFloat(x.toFixed(3)); }

// Normal distribution CDF (Abramowitz & Stegun)
function normalCDF(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
  const p = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z >= 0 ? 1 - p : p;
}
function normalPDF(z) { return Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI); }

// ─── TEMPLATES ───────────────────────────────────────────────────────────────
const PRACTICE_TEMPLATES = [

// ── 1: Arithmetic u_k = S_k = N ─────────────────────────────────────────────
{
  id: 'arith-uk-sk',
  syllabus: '1.2', topic: 1, marks: 5,
  title: 'Arithmetic: uₖ = Sₖ = N',
  desc: 'Given that the kᵗʰ term equals the sum of the first k terms, find the first term and common difference.',
  generate() {
    const k = pick([5, 6, 7, 8, 9, 10]);
    const m = pick([-3, -2, -1, 1, 2, 3]);
    const N = k * m;
    const u1 = m * (2 - k);
    const d = 2 * m;
    return {
      stem: `Consider an arithmetic sequence where $u_{${k}} = S_{${k}} = ${N}$.`,
      parts: [{ instr: `Find the value of the first term, $u_1$, and the value of the common difference, $d$.`, marks: 5 }],
      answer: `$u_1 = ${u1},\\quad d = ${d}$`,
      working: [
        `Two equations from the given conditions:`,
        `$u_{${k}} = u_1 + ${k-1}d = ${N} \\quad (1)$`,
        `$S_{${k}} = \\dfrac{${k}}{2}(u_1 + u_{${k}}) = ${N}$`,
        `$\\Rightarrow u_1 + u_{${k}} = ${2*N/k} \\quad (2)$`,
        `From (2): $u_1 + ${N} = ${2*N/k}$, so $u_1 = ${u1}$`,
        `Substitute into (1): $${u1} + ${k-1}d = ${N}$, so $d = ${d}$`
      ]
    };
  }
},

// ── 2: Arithmetic given u1 and d<0 ──────────────────────────────────────────
{
  id: 'arith-first-d',
  syllabus: '1.2', topic: 1, marks: 5,
  title: 'Arithmetic: given u₁ and d < 0',
  desc: 'Given the first term and a negative common difference, find the term that equals zero and the maximum partial sum.',
  generate() {
    const t = pick([1, 2, 3, 4, 5]);      // |d|
    const r = pick([5, 6, 7, 8, 9, 10]); // u1 = r*t
    const u1 = r * t;
    const d = -t;
    const k = r + 1;                       // u_k = 0
    const maxS = r * (r + 1) * t / 2;    // S_r = S_{k-1}
    return {
      stem: `An arithmetic sequence has first term $u_1 = ${u1}$ and common difference $d = ${d}$.`,
      parts: [
        { instr: `Given that the $k$th term of the sequence is zero, find the value of $k$.`, marks: 2 },
        { instr: `Find the maximum value of $S_n$.`, marks: 3 }
      ],
      answer: `(a) $k = ${k}$ \\quad (b) $S_n^{\\text{max}} = ${maxS}$`,
      working: [
        `(a) $u_k = u_1 + (k-1)d = 0$`,
        `$${u1} + (k-1)(${d}) = 0$`,
        `$(k-1) = ${r}$, so $k = ${k}$`,
        `(b) $S_n$ is maximised at $n = ${r}$ (last positive term, since $u_{${k}} = 0$)`,
        `$S_{${r}} = \\dfrac{${r}}{2}(u_1 + u_{${r}}) = \\dfrac{${r}}{2}(${u1} + ${t}) = \\dfrac{${r}}{2} \\times ${u1+t} = ${maxS}$`
      ]
    };
  }
},

// ── 3: Geometric S∞ and least n ─────────────────────────────────────────────
{
  id: 'geom-sum-inf',
  syllabus: '1.3', topic: 1, marks: 7,
  title: 'Geometric: S∞ and least n',
  desc: 'Given the first term and common ratio, find the infinite sum and the least n such that the remainder is below a threshold.',
  generate() {
    const combos = [
      { u1: 4, rN: 1, rD: 2 }, { u1: 6, rN: 1, rD: 3 }, { u1: 3, rN: 2, rD: 3 },
      { u1: 8, rN: 1, rD: 2 }, { u1: 9, rN: 1, rD: 3 }, { u1: 2, rN: 1, rD: 2 },
      { u1: 10, rN: 3, rD: 5 }, { u1: 6, rN: 2, rD: 3 },
    ];
    const { u1, rN, rD } = pick(combos);
    const r = rN / rD;
    const Sinf = u1 / (1 - r);             // exact fraction
    const SinfN = u1 * rD;
    const SinfD = rD - rN;
    const epsilons = [0.1, 0.01, 0.001];
    const eps = pick(epsilons);
    // Least n: Sinf * r^n < eps => n > log(eps/Sinf)/log(r)
    const nExact = Math.log(eps / Sinf) / Math.log(r);
    const n = Math.ceil(nExact);
    const SinfFrac = frac(SinfN, SinfD);
    const rFrac = frac(rN, rD);
    return {
      stem: `A geometric sequence has first term $u_1 = ${u1}$ and common ratio $r = ${rFrac}$.`,
      parts: [
        { instr: `Find the sum to infinity, $S_\\infty$.`, marks: 2 },
        { instr: `Find the least value of $n$ such that $S_\\infty - S_n < ${eps}$.`, marks: 5 }
      ],
      answer: `(a) $S_\\infty = ${SinfFrac}$ \\quad (b) $n = ${n}$`,
      working: [
        `(a) $S_\\infty = \\dfrac{u_1}{1 - r} = \\dfrac{${u1}}{1 - ${rFrac}} = \\dfrac{${u1}}{${frac(rD-rN,rD)}} = ${SinfFrac}$`,
        `(b) $S_\\infty - S_n = S_\\infty \\cdot r^n = ${SinfFrac} \\cdot \\left(${rFrac}\\right)^n$`,
        `Require: $${SinfFrac} \\cdot \\left(${rFrac}\\right)^n < ${eps}$`,
        `$\\left(${rFrac}\\right)^n < ${dp3(eps / Sinf)}$`,
        `$n\\ln\\!\\left(${rFrac}\\right) < \\ln(${dp3(eps / Sinf)})$`,
        `$n > ${dp3(nExact)}$, so least $n = ${n}$`
      ]
    };
  }
},

// ── 4: Binomial coefficient ──────────────────────────────────────────────────
{
  id: 'binomial-coeff',
  syllabus: '1.9', topic: 1, marks: 5,
  title: 'Binomial: find k from coefficient',
  desc: 'Given the coefficient of a specific term in a binomial expansion, find the unknown constant k.',
  generate() {
    function C(n, r) {
      let v = 1; for (let i = 0; i < r; i++) v = v * (n - i) / (i + 1); return Math.round(v);
    }
    const cases = [
      { n: 5, m: 3 }, { n: 6, m: 4 }, { n: 7, m: 5 },
      { n: 8, m: 6 }, { n: 9, m: 7 }, { n: 6, m: 3 },
    ];
    const { n, m } = pick(cases);
    const e = n - m;   // power of k in the term
    const k = pick([2, 3, 4]);
    const binom = C(n, e);
    const coeff = binom * Math.pow(k, e);
    return {
      stem: `In the expansion of $(x + k)^{${n}}$, where $k \\in \\mathbb{Z}^+$, the coefficient of the term in $x^{${m}}$ is $${coeff}$.`,
      parts: [{ instr: `Find the value of $k$.`, marks: 5 }],
      answer: `$k = ${k}$`,
      working: [
        `The term in $x^{${m}}$ is $\\dbinom{${n}}{${e}} x^{${m}} k^{${e}}$`,
        `$= ${binom} \\cdot k^{${e}}$`,
        `Set equal to $${coeff}$: $${binom} k^{${e}} = ${coeff}$`,
        `$k^{${e}} = ${Math.pow(k, e)}$`,
        `$k = ${k}$`
      ]
    };
  }
},

// ── 5: Log equation ──────────────────────────────────────────────────────────
{
  id: 'log-equation',
  syllabus: '1.7', topic: 1, marks: 5,
  title: 'Logarithm: solve log equation',
  desc: 'Use logarithm laws to combine and solve an equation involving two logarithms.',
  generate() {
    // Valid triples (b, d, x0) where x0*(x0+d) = b^c and c is integer
    const cases = [
      { b: 2, d: 2, x0: 2, c: 3 }, { b: 2, d: 6, x0: 2, c: 4 },
      { b: 2, d: 4, x0: 4, c: 5 }, { b: 3, d: 6, x0: 3, c: 3 },
      { b: 5, d: 20, x0: 5, c: 3 }, { b: 2, d: 12, x0: 4, c: 6 },
      { b: 3, d: 24, x0: 3, c: 4 }, { b: 2, d: 30, x0: 6, c: 6 },
    ];
    const { b, d, x0, c } = pick(cases);
    const rhs = Math.pow(b, c);
    return {
      stem: `Solve $\\log_{${b}}(x) + \\log_{${b}}(x + ${d}) = ${c}$.`,
      parts: [{ instr: `Find the value of $x$.`, marks: 5 }],
      answer: `$x = ${x0}$`,
      working: [
        `Apply the product law: $\\log_{${b}}\\!\\bigl(x(x+${d})\\bigr) = ${c}$`,
        `$x(x + ${d}) = ${b}^{${c}} = ${rhs}$`,
        `$x^2 + ${d}x - ${rhs} = 0$`,
        `$(x - ${x0})(x + ${x0 + d}) = 0$`,
        `$x = ${x0}$ or $x = ${-(x0 + d)}$`,
        `Since $\\log$ requires $x > 0$, the solution is $x = ${x0}$`
      ]
    };
  }
},

// ── 6: Circle sector ─────────────────────────────────────────────────────────
{
  id: 'circle-sector',
  syllabus: '3.4', topic: 3, marks: 6,
  title: 'Circle sector: arc length and area',
  desc: 'Apply the sector arc length and area formulas for a given radius and central angle in radians.',
  generate() {
    const cases = [
      { r: 5, th: 1.2 }, { r: 4, th: 0.8 }, { r: 6, th: 0.6 },
      { r: 10, th: 0.4 }, { r: 8, th: 1.5 }, { r: 4, th: 1.5 },
      { r: 6, th: 1.2 }, { r: 3, th: 2.0 }, { r: 5, th: 0.8 },
      { r: 7, th: 0.6 }, { r: 9, th: 0.4 }, { r: 12, th: 0.5 },
    ];
    const { r, th } = pick(cases);
    const arc = parseFloat((r * th).toFixed(4));
    const area = parseFloat((0.5 * r * r * th).toFixed(4));
    return {
      stem: `A sector $OAB$ of a circle has radius $r = ${r}$ cm and central angle $\\theta = ${th}$ radians.`,
      parts: [
        { instr: `Find the arc length $AB$.`, marks: 2 },
        { instr: `Find the area of the sector $OAB$.`, marks: 4 }
      ],
      answer: `(a) Arc $= ${arc}$ cm \\quad (b) Area $= ${area}$ cm²`,
      working: [
        `(a) Arc length $= r\\theta = ${r} \\times ${th} = ${arc}$ cm`,
        `(b) Area $= \\tfrac{1}{2}r^2\\theta = \\tfrac{1}{2} \\times ${r}^2 \\times ${th} = \\tfrac{1}{2} \\times ${r*r} \\times ${th} = ${area}$ cm²`
      ]
    };
  }
},

// ── 7: Trig equations ────────────────────────────────────────────────────────
{
  id: 'trig-solve',
  syllabus: '3.7', topic: 3, marks: 6,
  title: 'Trig equations: solve over interval',
  desc: 'Solve a trigonometric equation over a specified interval, giving all solutions.',
  generate() {
    // sin(bx + c) = k style, solutions come from exact values
    const cases = [
      { eq: '2\\sin x - \\sqrt{3} = 0', interval: '0 \\le x \\le 2\\pi',
        ans: 'x = \\dfrac{\\pi}{3},\\; x = \\dfrac{2\\pi}{3}',
        work: ['$\\sin x = \\dfrac{\\sqrt{3}}{2}$', 'Reference angle: $\\dfrac{\\pi}{3}$', '$x = \\dfrac{\\pi}{3}$ or $x = \\pi - \\dfrac{\\pi}{3} = \\dfrac{2\\pi}{3}$'] },
      { eq: '2\\cos x = 1', interval: '0 \\le x \\le 2\\pi',
        ans: 'x = \\dfrac{\\pi}{3},\\; x = \\dfrac{5\\pi}{3}',
        work: ['$\\cos x = \\dfrac{1}{2}$', 'Reference angle: $\\dfrac{\\pi}{3}$', '$x = \\dfrac{\\pi}{3}$ (1st quadrant) or $x = 2\\pi - \\dfrac{\\pi}{3} = \\dfrac{5\\pi}{3}$ (4th quadrant)'] },
      { eq: '\\tan x = -1', interval: '0 \\le x \\le 2\\pi',
        ans: 'x = \\dfrac{3\\pi}{4},\\; x = \\dfrac{7\\pi}{4}',
        work: ['Reference angle: $\\dfrac{\\pi}{4}$', '$\\tan$ is negative in 2nd and 4th quadrants', '$x = \\pi - \\dfrac{\\pi}{4} = \\dfrac{3\\pi}{4}$ or $x = 2\\pi - \\dfrac{\\pi}{4} = \\dfrac{7\\pi}{4}$'] },
      { eq: '\\sqrt{2}\\sin x + 1 = 0', interval: '0 \\le x \\le 2\\pi',
        ans: 'x = \\dfrac{5\\pi}{4},\\; x = \\dfrac{7\\pi}{4}',
        work: ['$\\sin x = -\\dfrac{1}{\\sqrt{2}} = -\\dfrac{\\sqrt{2}}{2}$', 'Reference angle: $\\dfrac{\\pi}{4}$', '$\\sin$ is negative in 3rd and 4th quadrants', '$x = \\pi + \\dfrac{\\pi}{4} = \\dfrac{5\\pi}{4}$ or $x = 2\\pi - \\dfrac{\\pi}{4} = \\dfrac{7\\pi}{4}$'] },
      { eq: '2\\sin^2 x - 1 = 0', interval: '0 \\le x \\le 2\\pi',
        ans: 'x = \\dfrac{\\pi}{4},\\; \\dfrac{3\\pi}{4},\\; \\dfrac{5\\pi}{4},\\; \\dfrac{7\\pi}{4}',
        work: ['$\\sin^2 x = \\dfrac{1}{2}$, so $\\sin x = \\pm\\dfrac{\\sqrt{2}}{2}$', 'Reference angle: $\\dfrac{\\pi}{4}$', 'All four quadrants give a solution'] },
      { eq: '2\\cos^2 x + \\cos x - 1 = 0', interval: '0 \\le x \\le 2\\pi',
        ans: 'x = \\dfrac{\\pi}{3},\\; x = \\pi,\\; x = \\dfrac{5\\pi}{3}',
        work: ['Factor: $(2\\cos x - 1)(\\cos x + 1) = 0$', '$\\cos x = \\dfrac{1}{2}$ gives $x = \\dfrac{\\pi}{3},\\dfrac{5\\pi}{3}$', '$\\cos x = -1$ gives $x = \\pi$'] },
    ];
    const c = pick(cases);
    return {
      stem: `Solve $${c.eq}$ for $${c.interval}$.`,
      parts: [{ instr: 'Find all values of $x$.', marks: 6 }],
      answer: `$${c.ans}$`,
      working: c.work
    };
  }
},

// ── 8: Normal distribution ───────────────────────────────────────────────────
{
  id: 'normal-dist',
  syllabus: '4.9', topic: 4, marks: 6,
  title: 'Normal distribution: find σ or probability',
  desc: 'Use properties of the normal distribution to find a missing parameter or calculate a probability.',
  generate() {
    // Type A: given mu, a, P(X>a) → find sigma
    const typeA = () => {
      const cases = [
        { mu: 50, a: 58, pgt: 0.10 }, { mu: 60, a: 70, pgt: 0.025 },
        { mu: 75, a: 90, pgt: 0.05 }, { mu: 30, a: 40, pgt: 0.10 },
        { mu: 50, a: 62, pgt: 0.05 }, { mu: 100, a: 115, pgt: 0.05 },
        { mu: 40, a: 50, pgt: 0.025 }, { mu: 80, a: 92, pgt: 0.10 },
      ];
      const { mu, a, pgt } = pick(cases);
      // invNorm using binary search on normalCDF
      let lo = 0, hi = 4;
      for (let i = 0; i < 50; i++) {
        const mid = (lo + hi) / 2;
        normalCDF(mid) > (1 - pgt) ? hi = mid : lo = mid;
      }
      const z = (lo + hi) / 2;
      const sigma = dp3((a - mu) / z);
      const pct = Math.round(pgt * 100);
      const zRound = dp3(z);
      return {
        stem: `The mass of apples from an orchard can be modelled by a normal distribution with mean $\\mu = ${mu}$ g and standard deviation $\\sigma$ g.
               It is known that $${pct}\\%$ of apples have a mass greater than $${a}$ g.`,
        parts: [{ instr: 'Find the value of $\\sigma$.', marks: 6 }],
        answer: `$\\sigma = ${sigma}$ g`,
        working: [
          `$X \\sim N(${mu},\\, \\sigma^2)$`,
          `$\\text{P}(X > ${a}) = ${pgt}$`,
          `$\\text{P}\\!\\left(Z > \\dfrac{${a} - ${mu}}{\\sigma}\\right) = ${pgt}$`,
          `From tables / GDC: $z = ${zRound}$`,
          `$\\dfrac{${a} - ${mu}}{\\sigma} = ${zRound}$`,
          `$\\sigma = \\dfrac{${a - mu}}{${zRound}} = ${sigma}$`
        ]
      };
    };
    // Type B: find probability P(a < X < b)
    const typeB = () => {
      const cases = [
        { mu: 50, sig: 8, a: 44, b: 62 }, { mu: 100, sig: 10, a: 90, b: 115 },
        { mu: 60, sig: 5, a: 55, b: 70 }, { mu: 30, sig: 4, a: 26, b: 36 },
        { mu: 75, sig: 12, a: 63, b: 90 }, { mu: 40, sig: 6, a: 34, b: 50 },
      ];
      const { mu, sig, a, b } = pick(cases);
      const za = (a - mu) / sig, zb = (b - mu) / sig;
      const prob = dp3(normalCDF(zb) - normalCDF(za));
      return {
        stem: `The heights of students in a school are normally distributed with mean $${mu}$ cm and standard deviation $${sig}$ cm.`,
        parts: [{ instr: `Find the probability that a randomly selected student has height between $${a}$ cm and $${b}$ cm.`, marks: 6 }],
        answer: `$\\text{P}(${a} < X < ${b}) = ${prob}$`,
        working: [
          `$X \\sim N(${mu},\\, ${sig}^2)$`,
          `$\\text{P}(${a} < X < ${b}) = \\text{P}\\!\\left(${dp3(za)} < Z < ${dp3(zb)}\\right)$`,
          `$= \\Phi(${dp3(zb)}) - \\Phi(${dp3(za)})$`,
          `$= ${dp3(normalCDF(zb))} - ${dp3(normalCDF(za))}$`,
          `$= ${prob}$`
        ]
      };
    };
    return Math.random() < 0.5 ? typeA() : typeB();
  }
},

// ── 9: Discrete RV ───────────────────────────────────────────────────────────
{
  id: 'discrete-rv',
  syllabus: '4.7', topic: 4, marks: 6,
  title: 'Discrete RV: find E(X) and Var(X)',
  desc: 'Given a probability distribution table (with an unknown k to find first), calculate the expected value and variance.',
  generate() {
    // x values = {a, a+1, a+2, a+3}, probs = {k, 2k, 3k, 4k} so k=0.1
    // But Var always = 1, so vary the probability ratios to get different variances
    const cases = [
      // { xs, ps_rel } — relative weights (will normalise to sum=1)
      { xs: [1,2,3,4], wr: [1,2,3,4] },   // k=0.1, E=3, Var=1
      { xs: [0,1,2,3], wr: [1,2,3,4] },   // k=0.1, E=2, Var=1
      { xs: [1,2,3,4], wr: [4,3,2,1] },   // k=0.1, E=2, Var=1
      { xs: [0,1,2,3], wr: [1,3,3,1] },   // k=1/8, symmetric
      { xs: [1,2,3,4], wr: [1,1,1,1] },   // k=0.25, uniform
      { xs: [0,1,2,3,4], wr: [1,2,3,2,1] }, // k=1/9
      { xs: [1,2,3],   wr: [1,2,3] },     // k=1/6
    ];
    const { xs, wr } = pick(cases);
    const wsum = wr.reduce((a, b) => a + b, 0);
    const ps = wr.map(w => w / wsum);   // exact probabilities
    // Express as fractions for display
    const kN = 1, kD = wsum;
    const EX = dp3(xs.reduce((s, x, i) => s + x * ps[i], 0));
    const EX2 = dp3(xs.reduce((s, x, i) => s + x * x * ps[i], 0));
    const VarX = dp3(EX2 - EX * EX);
    // Build table strings
    const xRow = xs.map(x => x).join(' & ');
    const pRow = wr.map(w => w === 1 ? frac(1, wsum) : frac(w, wsum)).join(' & ');
    const kStr = frac(1, wsum);
    const hasK = wsum !== 4 || !wr.every((w, i) => w === i + 1); // show "k" label if interesting
    return {
      stem: `The discrete random variable $X$ has the following probability distribution.
\\[\\begin{array}{|c|${'c|'.repeat(xs.length)}}\\hline
x & ${xRow} \\\\\\hline
P(X=x) & ${pRow} \\\\\\hline\\end{array}\\]`,
      parts: [
        { instr: `Find $\\text{E}(X)$.`, marks: 3 },
        { instr: `Find $\\text{Var}(X)$.`, marks: 3 }
      ],
      answer: `(a) $\\text{E}(X) = ${EX}$ \\quad (b) $\\text{Var}(X) = ${VarX}$`,
      working: [
        `(a) $\\text{E}(X) = \\sum x \\cdot P(X=x)$`,
        `$= ${xs.map((x, i) => `${x}\\times${frac(wr[i],wsum)}`).join(' + ')}$`,
        `$= ${EX}$`,
        `(b) $\\text{E}(X^2) = ${xs.map((x, i) => `${x*x}\\times${frac(wr[i],wsum)}`).join(' + ')} = ${EX2}$`,
        `$\\text{Var}(X) = \\text{E}(X^2) - [\\text{E}(X)]^2 = ${EX2} - ${EX}^2 = ${VarX}$`
      ]
    };
  }
},

// ── 10: Differentiation + stationary points ──────────────────────────────────
{
  id: 'differentiate-sp',
  syllabus: '5.6', topic: 5, marks: 6,
  title: "Differentiation: f′(x) and stationary points",
  desc: 'Differentiate a polynomial function and find the coordinates of its stationary points.',
  generate() {
    // Cubic: f(x) = x³ - 3k²x → SP at (k, -2k³) and (-k, 2k³)
    const typeC = () => {
      const k = pick([1, 2, 3]);
      const a = 1, b = -3 * k * k;
      const sp1x = k, sp1y = k * k * k - 3 * k * k * k;   // -2k³
      const sp2x = -k, sp2y = -k * k * k + 3 * k * k * k;  // 2k³
      const bAbs = Math.abs(b);
      return {
        stem: `Let $f(x) = x^3 ${b < 0 ? '-' : '+'} ${bAbs}x$ for $x \\in \\mathbb{R}$.`,
        parts: [
          { instr: `Find $f'(x)$.`, marks: 2 },
          { instr: `Find the coordinates of the stationary points of the graph of $f$.`, marks: 4 }
        ],
        answer: `(a) $f'(x) = 3x^2 ${b}$ \\quad (b) $(${sp1x},\\, ${sp1y})$ and $(${sp2x},\\, ${sp2y})$`,
        working: [
          `(a) $f'(x) = 3x^2 ${b < 0 ? '-' : '+'} ${bAbs}$`,
          `(b) Set $f'(x) = 0$: $3x^2 = ${bAbs}$, so $x^2 = ${k * k}$`,
          `$x = ${sp1x}$ or $x = ${sp2x}$`,
          `$f(${sp1x}) = ${sp1y}$, $\\quad f(${sp2x}) = ${sp2y}$`,
          `Stationary points: $(${sp1x},\\, ${sp1y})$ and $(${sp2x},\\, ${sp2y})$`
        ]
      };
    };
    // Quadratic: f(x) = ax² + bx + c → one SP
    const typeQ = () => {
      const a = pick([1, 2, -1, -2, 3, -3]);
      const spx = pick([-3, -2, -1, 1, 2, 3]);
      const b = -2 * a * spx;
      const c = pick([0, 1, 2, 3, 4, 5, -1, -2]);
      const spy = a * spx * spx + b * spx + c;
      const aSign = a > 0 ? '' : '-';
      const aAbs = Math.abs(a);
      const bDisplay = b < 0 ? `${b}` : `+${b}`;
      const cDisplay = c < 0 ? `${c}` : (c === 0 ? '' : `+${c}`);
      return {
        stem: `Let $f(x) = ${aAbs !== 1 ? aAbs : ''}${a < 0 ? '-' : ''}x^2 ${bDisplay}x${cDisplay}$ for $x \\in \\mathbb{R}$.`,
        parts: [
          { instr: `Find $f'(x)$.`, marks: 2 },
          { instr: `Find the coordinates of the stationary point.`, marks: 4 }
        ],
        answer: `(a) $f'(x) = ${2*a}x ${b < 0 ? '' : '+'}${b}$ \\quad (b) $(${spx},\\, ${spy})$`,
        working: [
          `(a) $f'(x) = ${2*a}x ${b < 0 ? '' : '+'}${b}$`,
          `(b) $f'(x) = 0 \\Rightarrow ${2*a}x = ${-b}$, so $x = ${spx}$`,
          `$f(${spx}) = ${spy}$`,
          `Stationary point: $(${spx},\\, ${spy})$`
        ]
      };
    };
    return Math.random() < 0.6 ? typeC() : typeQ();
  }
},

// ── 11: Integration ──────────────────────────────────────────────────────────
{
  id: 'integrate-area',
  syllabus: '5.11', topic: 5, marks: 5,
  title: 'Integration: area between curve and x-axis',
  desc: 'Find the exact area enclosed between a polynomial curve and the x-axis.',
  generate() {
    // f(x) = x(x-p) = x²-px, roots at 0 and p. Area = p³/6
    const typeA = () => {
      const p = pick([2, 3, 4, 6]);
      const areaN = p * p * p, areaD = 6;
      const g = gcd(areaN, areaD);
      return {
        stem: `The curve $C$ has equation $y = x(x - ${p})$.`,
        parts: [
          { instr: `Find the x-coordinates where $C$ crosses the x-axis.`, marks: 1 },
          { instr: `Find the exact area of the region enclosed between $C$ and the x-axis.`, marks: 4 }
        ],
        answer: `(a) $x = 0$ and $x = ${p}$ \\quad (b) Area $= ${frac(areaN/g, areaD/g)}$`,
        working: [
          `(a) $x(x-${p}) = 0 \\Rightarrow x = 0$ or $x = ${p}$`,
          `(b) $\\text{Area} = \\left|\\int_0^{${p}} (x^2 - ${p}x)\\, dx\\right|$`,
          `$= \\left|\\left[\\dfrac{x^3}{3} - ${frac(p,2)}x^2\\right]_0^{${p}}\\right|$`,
          `$= \\left|\\dfrac{${p*p*p}}{3} - ${frac(p,2)} \\cdot ${p*p}\\right|$`,
          `$= \\left|${frac(p*p*p, 3)} - ${frac(p*p*p, 2)}\\right| = ${frac(areaN/g, areaD/g)}`
        ]
      };
    };
    // f(x) = ax^n, definite integral from 0 to b → exact value
    const typeB = () => {
      const n = pick([2, 3, 4]);
      const a = pick([1, 2, 3]);
      const b = pick([2, 3, 4]);
      const valN = a * Math.pow(b, n + 1);
      const valD = n + 1;
      const g = gcd(valN, valD);
      return {
        stem: `Find the exact value of $\\displaystyle\\int_0^{${b}} ${a === 1 ? '' : a}x^{${n}}\\, dx$.`,
        parts: [{ instr: 'Evaluate the integral.', marks: 5 }],
        answer: `$${frac(valN / g, valD / g)}$`,
        working: [
          `$\\int_0^{${b}} ${a === 1 ? '' : a}x^{${n}}\\, dx = \\left[${frac(a, n+1)}x^{${n+1}}\\right]_0^{${b}}$`,
          `$= ${frac(a, n+1)} \\cdot ${b}^{${n+1}} - 0$`,
          `$= ${frac(a, n+1)} \\times ${Math.pow(b, n+1)} = ${frac(valN/g, valD/g)}$`
        ]
      };
    };
    return Math.random() < 0.5 ? typeA() : typeB();
  }
},

]; // end PRACTICE_TEMPLATES
