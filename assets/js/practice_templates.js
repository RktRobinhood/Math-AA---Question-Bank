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



// ── 12: Financial mathematics ───────────────────────────────────────────────
{
  id: 'financial',
  syllabus: '1.4', topic: 1, marks: 6,
  title: 'Financial mathematics: compound interest',
  desc: 'Compound interest and depreciation problems — find future value, time to reach a target, or annual rate.',
  generate() {
    const typeA = () => {
      const P = pick([5000, 8000, 10000, 12000, 15000]);
      const r = pick([3, 4, 5, 6]);
      const n = pick([5, 8, 10, 12]);
      const A = P * Math.pow(1 + r / 100, n);
      return {
        stem: `$${P.toLocaleString()} is invested in an account that pays ${r}% compound interest per year.`,
        parts: [
          { instr: `Find the value of the investment after ${n} years. Give your answer correct to the nearest dollar.`, marks: 3 },
          { instr: `Find the total interest earned over ${n} years.`, marks: 2 },
        ],
        answer: `(a) $\\$${Math.round(A).toLocaleString()}$ \\quad (b) $\\$${Math.round(A - P).toLocaleString()}$`,
        working: [
          `(a) $A = P\\left(1 + \\dfrac{r}{100}\\right)^n = ${P}\\left(1 + \\dfrac{${r}}{100}\\right)^{${n}}$`,
          `$= ${P} \\times ${(1 + r/100).toFixed(2)}^{${n}} \\approx ${Math.round(A).toLocaleString()}$`,
          `(b) Interest $= \\$${Math.round(A).toLocaleString()} - \\$${P.toLocaleString()} = \\$${Math.round(A - P).toLocaleString()}$`
        ]
      };
    };
    const typeB = () => {
      const P = pick([20000, 25000, 30000, 40000]);
      const r = pick([10, 12, 15, 20]);
      const threshold = Math.round(P * pick([0.5, 0.4, 0.3]));
      const ratio = threshold / P;
      const base = 1 - r / 100;
      const n = Math.ceil(Math.log(ratio) / Math.log(base));
      const valAtN = Math.round(P * Math.pow(base, n));
      return {
        stem: `A car is purchased for $\\$${P.toLocaleString()}$. It depreciates at ${r}% per year.`,
        parts: [
          { instr: `Write an expression for the value of the car after $n$ years.`, marks: 1 },
          { instr: `Find the smallest integer $n$ such that the value falls below $\\$${threshold.toLocaleString()}$.`, marks: 3 },
        ],
        answer: `(a) $V_n = ${P} \\times ${base.toFixed(2)}^n$ \\quad (b) $n = ${n}$`,
        working: [
          `(a) $V_n = ${P}\\left(1 - \\dfrac{${r}}{100}\\right)^n = ${P} \\times ${base.toFixed(2)}^n$`,
          `(b) Solve $${P} \\times ${base.toFixed(2)}^n < ${threshold}$`,
          `$${base.toFixed(2)}^n < ${ratio.toFixed(4)}$`,
          `$n > \\dfrac{\\ln(${ratio.toFixed(4)})}{\\ln(${base.toFixed(2)})} = ${(Math.log(ratio)/Math.log(base)).toFixed(3)}$`,
          `Smallest integer: $n = ${n}$ (value $= \\$${valAtN.toLocaleString()} < \\$${threshold.toLocaleString()}$ ✓)`
        ]
      };
    };
    return Math.random() < 0.5 ? typeA() : typeB();
  }
},

// ── 13: Composite & inverse functions ────────────────────────────────────────
{
  id: 'composite-fn',
  syllabus: '2.5', topic: 2, marks: 7,
  title: 'Composite & inverse functions',
  desc: 'Find f ∘ g(x), g ∘ f(x), and the inverse function f⁻¹(x).',
  generate() {
    const typeA = () => {
      const a = pick([2, 3, 4, 5]);
      const b = pick([-3, -2, -1, 1, 2, 3]);
      const c = pick([1, 2, 3, 4, 5]);
      const ac_b = a * c + b;
      const fInvStr = b < 0
        ? `\\dfrac{x + ${-b}}{${a}}`
        : `\\dfrac{x - ${b}}{${a}}`;
      return {
        stem: `Let $f(x) = ${a}x ${sgn(b)}$ and $g(x) = x^2 + ${c}$, where $x \\in \\mathbb{R}$.`,
        parts: [
          { instr: `Find $f(g(x))$.`, marks: 2 },
          { instr: `Find $g(f(x))$.`, marks: 2 },
          { instr: `Find $f^{-1}(x)$.`, marks: 2 },
        ],
        answer: `(a) $${a}x^2 ${sgn(ac_b)}$ \\quad (b) $(${a}x ${sgn(b)})^2 + ${c}$ \\quad (c) $f^{-1}(x) = ${fInvStr}$`,
        working: [
          `(a) $f(g(x)) = f(x^2+${c}) = ${a}(x^2+${c}) ${sgn(b)} = ${a}x^2 ${sgn(ac_b)}$`,
          `(b) $g(f(x)) = g(${a}x ${sgn(b)}) = (${a}x ${sgn(b)})^2 + ${c}$`,
          `(c) Let $y = ${a}x ${sgn(b)}$. Swap $x$ and $y$: $x = ${a}y ${sgn(b)}$`,
          `$y = ${fInvStr}$, so $f^{-1}(x) = ${fInvStr}$`
        ]
      };
    };
    const typeB = () => {
      const a = pick([1, 3, 5, 7]);
      const k = pick([5, 7, 9, 11, 13]);
      const finvK = (k + a) / 2;
      return {
        stem: `Let $f(x) = 2x - ${a}$, where $x \\in \\mathbb{R}$.`,
        parts: [
          { instr: `Find $f(f(x))$, giving your answer in the form $ax + b$.`, marks: 3 },
          { instr: `Find $f^{-1}(${k})$.`, marks: 2 },
        ],
        answer: `(a) $4x - ${3*a}$ \\quad (b) $${fmt(finvK)}$`,
        working: [
          `(a) $f(f(x)) = f(2x-${a}) = 2(2x-${a})-${a} = 4x-${2*a}-${a} = 4x-${3*a}$`,
          `(b) $f^{-1}(x) = \\dfrac{x+${a}}{2}$`,
          `$f^{-1}(${k}) = \\dfrac{${k}+${a}}{2} = \\dfrac{${k+a}}{2} = ${fmt(finvK)}$`
        ]
      };
    };
    return Math.random() < 0.5 ? typeA() : typeB();
  }
},

// ── 14: Quadratic functions ───────────────────────────────────────────────────
{
  id: 'quadratic-fn',
  syllabus: '2.6', topic: 2, marks: 7,
  title: 'Quadratic functions: vertex & roots',
  desc: 'Work with quadratic functions — vertex form, discriminant, and roots.',
  generate() {
    const typeA = () => {
      const a = pick([1, 2, -1, -2]);
      const h = pick([-3, -2, -1, 1, 2, 3]);
      const k = pick([-4, -3, -2, -1, 1, 2, 3, 4]);
      const sign_ok = (a > 0 && k < 0) || (a < 0 && k > 0);
      const aStr = a === 1 ? '' : (a === -1 ? '-' : `${a}`);
      const hStr = h < 0 ? `(x + ${-h})` : `(x - ${h})`;
      let rootStr;
      if (sign_ok) {
        const inner = -k / a;
        const sqrtInner = Math.sqrt(inner);
        if (Number.isInteger(sqrtInner)) {
          rootStr = `$x = ${h} \\pm ${sqrtInner}$, i.e. $x = ${h + sqrtInner}$ or $x = ${h - sqrtInner}$`;
        } else {
          rootStr = `$x = ${h} \\pm \\sqrt{${inner}}$`;
        }
      } else {
        rootStr = 'No real roots (discriminant $< 0$)';
      }
      return {
        stem: `The function $f(x) = ${aStr}${hStr}^2 ${sgn(k)}$ is defined for $x \\in \\mathbb{R}$.`,
        parts: [
          { instr: `Write down the coordinates of the vertex.`, marks: 1 },
          { instr: `Write down the equation of the axis of symmetry.`, marks: 1 },
          { instr: `Find the x-intercepts, or explain why there are none.`, marks: 3 },
        ],
        answer: `(a) $(${h},\\ ${k})$ \\quad (b) $x = ${h}$ \\quad (c) ${rootStr}`,
        working: [
          `(a) Vertex form $a(x-h)^2+k$ gives vertex $(${h},\\ ${k})$`,
          `(b) Axis of symmetry: $x = ${h}$`,
          `(c) Set $f(x)=0$: ${aStr}${hStr}^2 = ${-k}$`,
          sign_ok
            ? `$(x-${h})^2 = ${-k/a}$ \\quad \\Rightarrow \\quad ${rootStr}`
            : `$(x-${h})^2 = ${-k/a}$ which is negative — no real roots.`
        ]
      };
    };
    const typeB = () => {
      const a = pick([1, 2, 3]);
      const b = pick([-6, -4, -2, 0, 2, 4, 6]);
      const c = pick([-4, -3, -2, -1, 1, 2, 3, 4, 5]);
      const disc = b * b - 4 * a * c;
      const nature = disc > 0 ? 'two distinct real roots' : (disc === 0 ? 'one repeated real root' : 'no real roots');
      const bStr = b === 0 ? '' : (b > 0 ? ` + ${b}x` : ` - ${-b}x`);
      const cStr = c >= 0 ? ` + ${c}` : ` - ${-c}`;
      return {
        stem: `Consider the equation $${a}x^2${bStr}${cStr} = 0$.`,
        parts: [
          { instr: `Find the discriminant.`, marks: 2 },
          { instr: `Hence state the nature of the roots.`, marks: 1 },
          { instr: disc > 0 ? `Solve the equation.` : `Find the x-coordinate of the vertex.`, marks: 3 }
        ],
        answer: `(a) $\\Delta = ${disc}$ \\quad (b) ${nature} \\quad (c) ${disc > 0 ? `$x = \\dfrac{${-b} \\pm \\sqrt{${disc}}}{${2*a}}$` : `$x = ${frac(-b, 2*a)}$`}`,
        working: [
          `(a) $\\Delta = b^2-4ac = (${b})^2-4(${a})(${c}) = ${b*b}-${4*a*c} = ${disc}$`,
          `(b) $\\Delta ${disc > 0 ? '>' : disc === 0 ? '=' : '<'} 0$ \\Rightarrow ${nature}`,
          disc > 0
            ? `(c) $x = \\dfrac{${-b} \\pm \\sqrt{${disc}}}{${2*a}}$`
            : `(c) $x = -\\dfrac{b}{2a} = \\dfrac{${-b}}{${2*a}} = ${frac(-b,2*a)}$`
        ]
      };
    };
    return Math.random() < 0.5 ? typeA() : typeB();
  }
},

// ── 15: Triangle trigonometry ─────────────────────────────────────────────────
{
  id: 'triangle-trig',
  syllabus: '3.2', topic: 3, marks: 7,
  title: 'Triangle trig: sine & cosine rule',
  desc: 'Use the sine rule, cosine rule, and area formula to solve triangle problems.',
  generate() {
    const typeA = () => {
      const a = pick([5, 6, 7, 8, 9]);
      const b = pick([4, 5, 6, 7, 8]);
      const C_deg = pick([40, 50, 60, 70, 80]);
      const C_rad = C_deg * Math.PI / 180;
      const c = Math.sqrt(a*a + b*b - 2*a*b*Math.cos(C_rad));
      const area = 0.5 * a * b * Math.sin(C_rad);
      return {
        stem: `In triangle $ABC$, $AB = ${b}$ cm, $AC = ${a}$ cm, and $\\widehat{BAC} = ${C_deg}°$.`,
        parts: [
          { instr: `Find $BC$.`, marks: 3 },
          { instr: `Find the area of triangle $ABC$.`, marks: 2 },
        ],
        answer: `(a) $BC = ${dp3(c)}$ cm \\quad (b) Area $= ${dp3(area)}$ cm²`,
        working: [
          `(a) Cosine rule: $BC^2 = AB^2 + AC^2 - 2 \\cdot AB \\cdot AC \\cdot \\cos(\\widehat{A})$`,
          `$= ${b}^2 + ${a}^2 - 2(${b})(${a})\\cos(${C_deg}°) = ${dp3(c*c)}$`,
          `$BC = ${dp3(c)}$ cm`,
          `(b) Area $= \\tfrac{1}{2}(${b})(${a})\\sin(${C_deg}°) = ${dp3(area)}$ cm²`
        ]
      };
    };
    const typeB = () => {
      const A_deg = pick([30, 40, 50]);
      const a = pick([6, 7, 8, 9]);
      const b = pick([3, 4, 5]);
      const sinB = b * Math.sin(A_deg * Math.PI / 180) / a;
      const B_deg = Math.asin(sinB) * 180 / Math.PI;
      const C_deg = 180 - A_deg - B_deg;
      const c = a * Math.sin(C_deg * Math.PI / 180) / Math.sin(A_deg * Math.PI / 180);
      return {
        stem: `In triangle $ABC$, $\\widehat{A} = ${A_deg}°$, $BC = ${a}$ cm, $AC = ${b}$ cm.`,
        parts: [
          { instr: `Find $\\widehat{B}$.`, marks: 3 },
          { instr: `Find $AB$.`, marks: 2 },
        ],
        answer: `(a) $\\widehat{B} = ${dp3(B_deg)}°$ \\quad (b) $AB = ${dp3(c)}$ cm`,
        working: [
          `(a) Sine rule: $\\dfrac{\\sin B}{${b}} = \\dfrac{\\sin ${A_deg}°}{${a}}$`,
          `$\\sin B = \\dfrac{${b}\\sin(${A_deg}°)}{${a}} = ${dp3(sinB)}$`,
          `$\\widehat{B} = ${dp3(B_deg)}°$`,
          `(b) $\\widehat{C} = 180°-${A_deg}°-${dp3(B_deg)}° = ${dp3(C_deg)}°$`,
          `$AB = \\dfrac{${a}\\sin(${dp3(C_deg)}°)}{\\sin(${A_deg}°)} = ${dp3(c)}$ cm`
        ]
      };
    };
    return Math.random() < 0.5 ? typeA() : typeB();
  }
},

// ── 16: Trig identities ──────────────────────────────────────────────────────
{
  id: 'trig-identity',
  syllabus: '3.6', topic: 3, marks: 6,
  title: 'Trig identities: Pythagorean & double angle',
  desc: 'Use sin²θ + cos²θ = 1 and double-angle identities to simplify and prove.',
  generate() {
    const typeA = () => {
      const pairs = [[3,5],[4,5],[5,13],[8,17],[12,13]];
      const [opp, hyp] = pick(pairs);
      const adj = Math.round(Math.sqrt(hyp*hyp - opp*opp));
      const sin2_n = 2*opp*adj, sin2_d = hyp*hyp;
      const g = gcd(sin2_n, sin2_d);
      return {
        stem: `Given that $\\sin\\theta = \\dfrac{${opp}}{${hyp}}$ and $0 < \\theta < \\dfrac{\\pi}{2}$:`,
        parts: [
          { instr: `Find $\\cos\\theta$.`, marks: 2 },
          { instr: `Find $\\sin 2\\theta$.`, marks: 2 },
        ],
        answer: `(a) $\\dfrac{${adj}}{${hyp}}$ \\quad (b) $${frac(sin2_n/g, sin2_d/g)}$`,
        working: [
          `(a) $\\cos^2\\theta = 1 - \\dfrac{${opp*opp}}{${hyp*hyp}} = \\dfrac{${hyp*hyp-opp*opp}}{${hyp*hyp}}$`,
          `$\\cos\\theta = \\dfrac{${adj}}{${hyp}}$ (positive, first quadrant)`,
          `(b) $\\sin 2\\theta = 2\\sin\\theta\\cos\\theta = 2 \\cdot \\dfrac{${opp}}{${hyp}} \\cdot \\dfrac{${adj}}{${hyp}} = ${frac(sin2_n/g, sin2_d/g)}$`
        ]
      };
    };
    const typeB = () => ({
      stem: `Show that $(\\sin\\theta + \\cos\\theta)^2 = 1 + \\sin 2\\theta$.`,
      parts: [{ instr: 'Prove the identity.', marks: 4 }],
      answer: `Expand LHS using $\\sin^2\\theta+\\cos^2\\theta=1$ and $2\\sin\\theta\\cos\\theta=\\sin 2\\theta$`,
      working: [
        `LHS $= \\sin^2\\theta + 2\\sin\\theta\\cos\\theta + \\cos^2\\theta$`,
        `$= (\\sin^2\\theta + \\cos^2\\theta) + 2\\sin\\theta\\cos\\theta$`,
        `$= 1 + \\sin 2\\theta$ = RHS $\\square$`
      ]
    });
    return Math.random() < 0.5 ? typeA() : typeB();
  }
},

// ── 17: Trig functions & transformations ─────────────────────────────────────
{
  id: 'trig-fn',
  syllabus: '3.7', topic: 3, marks: 6,
  title: 'Trig functions: amplitude, period & transformations',
  desc: 'Identify or apply transformations to f(x) = a sin(bx) + d.',
  generate() {
    const a = pick([2, 3, 4, 5]);
    const b = pick([2, 3, 4]);
    const d = pick([-2, -1, 0, 1, 2, 3]);
    const fn = pick(['\\sin', '\\cos']);
    const dStr = d === 0 ? '' : (d > 0 ? ` + ${d}` : ` - ${-d}`);
    return {
      stem: `The function $f(x) = ${a}${fn}(${b}x)${dStr}$ is defined for $x \\in \\mathbb{R}$.`,
      parts: [
        { instr: `Write down the amplitude of $f$.`, marks: 1 },
        { instr: `Write down the period of $f$.`, marks: 2 },
        { instr: `Write down the range of $f$.`, marks: 2 },
      ],
      answer: `(a) $${a}$ \\quad (b) $\\dfrac{2\\pi}{${b}}$ \\quad (c) $[${d-a},\\ ${d+a}]$`,
      working: [
        `(a) Amplitude $= |a| = ${a}$`,
        `(b) Period $= \\dfrac{2\\pi}{b} = \\dfrac{2\\pi}{${b}}$`,
        `(c) $${fn}(${b}x) \\in [-1,\\ 1]$, so $f(x) \\in [${d}-${a},\\ ${d}+${a}] = [${d-a},\\ ${d+a}]$`
      ]
    };
  }
},

// ── 18: Descriptive statistics ────────────────────────────────────────────────
{
  id: 'descriptive-stats',
  syllabus: '4.3', topic: 4, marks: 6,
  title: 'Descriptive statistics: mean, median & IQR',
  desc: 'Calculate mean, median, and interquartile range from a dataset.',
  generate() {
    const n = pick([8, 10, 12]);
    const base = pick([10, 12, 15, 20]);
    const spread = pick([2, 3, 4]);
    const data = Array.from({ length: n }, (_, i) =>
      base + Math.round((i - n/2 + 0.5) * spread / (n/2))
    ).sort((a, b) => a - b);
    const total = data.reduce((s, x) => s + x, 0);
    const mean = total / n;
    const median = n % 2 === 0 ? (data[n/2-1] + data[n/2]) / 2 : data[(n-1)/2];
    const q1 = n % 4 === 0 ? (data[n/4-1] + data[n/4]) / 2 : data[Math.floor(n/4)];
    const q3 = n % 4 === 0 ? (data[3*n/4-1] + data[3*n/4]) / 2 : data[Math.floor(3*n/4)];
    const iqr = q3 - q1;
    return {
      stem: `A dataset of $${n}$ values is: $${data.join(',\\ ')}$`,
      parts: [
        { instr: `Find the mean.`, marks: 2 },
        { instr: `Find the median.`, marks: 1 },
        { instr: `Find the interquartile range (IQR).`, marks: 2 },
      ],
      answer: `(a) $${fmt(mean)}$ \\quad (b) $${fmt(median)}$ \\quad (c) $${fmt(iqr)}$`,
      working: [
        `(a) Mean $= \\dfrac{${total}}{${n}} = ${fmt(mean)}$`,
        `(b) $n = ${n}$ ${n % 2 === 0 ? `(even): median $= \\dfrac{${data[n/2-1]}+${data[n/2]}}{2} = ${fmt(median)}$` : `(odd): median $= ${fmt(median)}$`}`,
        `(c) $Q_1 = ${fmt(q1)},\\; Q_3 = ${fmt(q3)},\\;$ IQR $= ${fmt(q3)}-${fmt(q1)} = ${fmt(iqr)}$`
      ]
    };
  }
},

// ── 19: Binomial distribution ─────────────────────────────────────────────────
{
  id: 'binomial-dist',
  syllabus: '4.8', topic: 4, marks: 7,
  title: 'Binomial distribution: P(X = k) and E(X)',
  desc: 'Calculate probabilities and the expected value for X ~ B(n, p).',
  generate() {
    const configs = [
      { n: 10, p: 0.3 }, { n: 8, p: 0.25 }, { n: 12, p: 0.4 },
      { n: 6, p: 0.5 }, { n: 10, p: 0.2 }, { n: 5, p: 0.6 }
    ];
    const { n, p } = pick(configs);
    const q = 1 - p;
    const pStr = p.toString();
    const qStr = q.toFixed(2);
    const k = Math.floor(n * p);
    function C(n, r) {
      let res = 1;
      for (let i = 0; i < r; i++) res = res * (n - i) / (i + 1);
      return Math.round(res);
    }
    const Ck = C(n, k);
    const pExact = Ck * Math.pow(p, k) * Math.pow(q, n - k);
    const p0 = Math.pow(q, n);
    const pAtLeast1 = 1 - p0;
    const EX = n * p;
    const contexts = [
      `A factory produces items. Each item is defective with probability $${pStr}$, independently. A batch of $${n}$ items is tested.`,
      `A student guesses each of $${n}$ multiple-choice questions. The probability of a correct guess is $${pStr}$.`,
      `A biased coin with $P(\\text{heads}) = ${pStr}$ is tossed $${n}$ times.`
    ];
    return {
      stem: `${pick(contexts)} Let $X$ be the number of successes. Then $X \\sim B(${n},\\ ${pStr})$.`,
      parts: [
        { instr: `Find $P(X = ${k})$.`, marks: 2 },
        { instr: `Find $P(X \\geq 1)$.`, marks: 3 },
        { instr: `Find $E(X)$.`, marks: 1 },
      ],
      answer: `(a) $${dp3(pExact)}$ \\quad (b) $${dp3(pAtLeast1)}$ \\quad (c) $E(X) = ${fmt(EX)}$`,
      working: [
        `(a) $P(X=${k}) = \\binom{${n}}{${k}}(${pStr})^{${k}}(${qStr})^{${n-k}} = ${Ck} \\times ${dp3(Math.pow(p,k))} \\times ${dp3(Math.pow(q,n-k))} = ${dp3(pExact)}$`,
        `(b) $P(X\\geq 1) = 1-P(X=0) = 1-(${qStr})^{${n}} = 1-${dp3(p0)} = ${dp3(pAtLeast1)}$`,
        `(c) $E(X) = np = ${n} \\times ${pStr} = ${fmt(EX)}$`
      ]
    };
  }
},

// ── 20: Kinematics ────────────────────────────────────────────────────────────
{
  id: 'kinematics',
  syllabus: '5.9', topic: 5, marks: 7,
  title: 'Kinematics: velocity, acceleration & displacement',
  desc: 'Differentiate and integrate velocity functions to find acceleration and position.',
  generate() {
    const a_c = pick([1, 2, 3]);
    const b_c = pick([-6, -4, 3, 4, 6]);
    const c_c = pick([0, 2, -2, 3]);
    const t  = pick([2, 3, 4]);
    const s0 = pick([0, 5, 10]);
    const bAbs = Math.abs(b_c);
    const bSign = b_c < 0 ? '-' : '+';
    const cStr = c_c === 0 ? '' : (c_c > 0 ? ` + ${c_c}` : ` - ${-c_c}`);
    const s0Str = s0 > 0 ? ` + ${s0}` : '';
    const aCoefStr = a_c === 1 ? '' : `${a_c}`;
    // v(t) = a_c t² + b_c t + c_c
    const v_t  = a_c*t*t + b_c*t + c_c;
    const acc_t = 2*a_c*t + b_c;
    // s(t) = (a_c/3)t³ + (b_c/2)t² + c_c t + s0
    const s_t  = (a_c/3)*Math.pow(t,3) + (b_c/2)*t*t + c_c*t + s0;
    return {
      stem: `A particle moves in a straight line. Its velocity at time $t$ seconds is $v(t) = ${aCoefStr}t^2 ${bSign} ${bAbs}t${cStr}$ m/s. At $t = 0$ the particle is at $s = ${s0}$ m.`,
      parts: [
        { instr: `Find the acceleration when $t = ${t}$.`, marks: 2 },
        { instr: `Find the position of the particle when $t = ${t}$.`, marks: 3 },
      ],
      answer: `(a) $a(${t}) = ${fmt(acc_t)}$ m/s² \\quad (b) $s(${t}) = ${dp3(s_t)}$ m`,
      working: [
        `(a) $a(t) = v'(t) = ${2*a_c}t ${bSign} ${bAbs}$`,
        `$a(${t}) = ${2*a_c}(${t}) ${bSign} ${bAbs} = ${fmt(acc_t)}$ m/s²`,
        `(b) $s(t) = \\int v(t)\\,dt = ${frac(a_c,3)}t^3 ${bSign} ${frac(Math.abs(b_c),2)}t^2${cStr}${s0Str} + C$`,
        `Using $s(0) = ${s0}$: $C = ${s0}$`,
        `$s(${t}) = ${frac(a_c,3)}(${t})^3 ${bSign} ${frac(Math.abs(b_c),2)}(${t})^2${c_c !== 0 ? ` + ${c_c}(${t})` : ''}${s0 > 0 ? ` + ${s0}` : ''} = ${dp3(s_t)}$ m`
      ]
    };
  }
},

]; // end PRACTICE_TEMPLATES
