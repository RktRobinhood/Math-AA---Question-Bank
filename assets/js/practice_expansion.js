(function () {
  if (typeof PRACTICE_TEMPLATES === 'undefined') return;

  const DATA = window.AASL_DATA || { questions: [] };
  const qById = Object.fromEntries((DATA.questions || []).map(q => [q.id, q]));
  const totalSittings = typeof TOTAL_SITTINGS !== 'undefined' ? TOTAL_SITTINGS : 9;

  const F = typeof fmt === 'function' ? fmt : function (x) {
    return Number.isInteger(x) ? String(x) : Number(x).toFixed(3).replace(/\.?0+$/, '');
  };
  const D3 = typeof dp3 === 'function' ? dp3 : function (x) { return parseFloat(Number(x).toFixed(3)); };
  const Fr = typeof frac === 'function' ? frac : function (n, d) {
    const g = (a, b) => b ? g(b, a % b) : Math.abs(a);
    if (d < 0) { n = -n; d = -d; }
    const k = g(n, d);
    n /= k; d /= k;
    return d === 1 ? String(n) : `\\dfrac{${n}}{${d}}`;
  };
  const Pick = typeof pick === 'function' ? pick : function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
  const Rnd = typeof rnd === 'function' ? rnd : function (lo, hi) { return Math.floor(Math.random() * (hi - lo + 1)) + lo; };

  function nCr(n, r) {
    let out = 1;
    for (let i = 0; i < r; i++) out = out * (n - i) / (i + 1);
    return Math.round(out);
  }

  function signed(n) {
    return n < 0 ? `- ${Math.abs(n)}` : `+ ${n}`;
  }

  function axTerm(a, variable) {
    if (a === 0) return '';
    const abs = Math.abs(a);
    const body = abs === 1 ? variable : `${abs}${variable}`;
    return a < 0 ? `-${body}` : body;
  }

  function poly2(a, b, c) {
    const terms = [];
    if (a) terms.push(a === 1 ? 'x^2' : a === -1 ? '-x^2' : `${a}x^2`);
    if (b) terms.push(`${b > 0 && terms.length ? '+ ' : b < 0 ? '- ' : ''}${Math.abs(b) === 1 ? 'x' : Math.abs(b) + 'x'}`);
    if (c) terms.push(`${c > 0 && terms.length ? '+ ' : c < 0 ? '- ' : ''}${Math.abs(c)}`);
    return terms.join(' ') || '0';
  }

  function line(mNum, mDen, cNum, cDen) {
    const m = Fr(mNum, mDen);
    const c = Fr(cNum, cDen);
    return `y = ${m}x ${cNum < 0 ? '- ' + Fr(Math.abs(cNum), cDen) : '+ ' + c}`;
  }

  function topicName(topic) {
    return (DATA.topics && DATA.topics[String(topic)]) || {
      1: 'Numbers and Algebra',
      2: 'Functions',
      3: 'Geometry and Trigonometry',
      4: 'Statistics and Probability',
      5: 'Calculus'
    }[topic] || `Topic ${topic}`;
  }

  function prefixesOf(tmpl) {
    if (Array.isArray(tmpl.syllabusRefs) && tmpl.syllabusRefs.length) return tmpl.syllabusRefs;
    return String(tmpl.syllabus || '').split(',').map(s => s.trim()).filter(Boolean);
  }

  function questionsForPrefixes(prefixes) {
    return (DATA.questions || []).filter(q =>
      (q.syllabus || []).some(entry => prefixes.some(prefix => String(entry).startsWith(prefix)))
    );
  }

  function toMatch(q) {
    return {
      id: q.id,
      year: q.year,
      session: q.session,
      paper: q.paper,
      tz: q.timezone || q.tz || '',
      marks: q.marks,
      q: q.question
    };
  }

  function heatFromMatches(matches) {
    const sittings = new Set(matches.map(m => `${m.year}-${m.session}`));
    return Math.min(totalSittings, sittings.size);
  }

  function mostCommon(values, fallback) {
    const counts = {};
    values.filter(Boolean).forEach(v => { counts[v] = (counts[v] || 0) + 1; });
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (!entries.length) return fallback;
    return entries.length > 1 && entries[0][1] === entries[1][1] ? 'Mixed' : entries[0][0];
  }

  const existingMeta = {
    'arith-uk-sk': { section: 'A', paper: 'P1', difficulty: 'Exam', questionType: 'Algebraic routine', skills: ['arithmetic sequence', 'simultaneous equations'] },
    'arith-first-d': { section: 'Mixed', paper: 'Mixed', difficulty: 'Exam', questionType: 'Extended algebra', skills: ['arithmetic sequence', 'maximum sum'] },
    'geom-sum-inf': { section: 'Mixed', paper: 'Mixed', difficulty: 'Exam', questionType: 'Extended algebra', skills: ['geometric sequence', 'sum to infinity', 'logarithms'] },
    'binomial-coeff': { section: 'A', paper: 'Mixed', difficulty: 'Core', questionType: 'Short response', skills: ['binomial coefficient'] },
    'log-equation': { section: 'A', paper: 'P1', difficulty: 'Core', questionType: 'Equation solving', skills: ['log laws', 'domain restrictions'] },
    'financial': { section: 'A', paper: 'P2', difficulty: 'Core', questionType: 'Technology routine', skills: ['compound interest', 'exponential models'] },
    'composite-fn': { section: 'Mixed', paper: 'Mixed', difficulty: 'Exam', questionType: 'Function manipulation', skills: ['composition', 'inverse function'] },
    'quadratic-fn': { section: 'Mixed', paper: 'Mixed', difficulty: 'Exam', questionType: 'Function analysis', skills: ['vertex', 'roots', 'axis of symmetry'] },
    'triangle-trig': { section: 'Mixed', paper: 'Mixed', difficulty: 'Exam', questionType: 'Geometry routine', skills: ['sine rule', 'cosine rule'] },
    'circle-sector': { section: 'A', paper: 'P1', difficulty: 'Core', questionType: 'Short response', skills: ['radians', 'arc length', 'sector area'] },
    'trig-identity': { section: 'A', paper: 'P1', difficulty: 'Exam', questionType: 'Algebraic proof', skills: ['identities', 'double angle'] },
    'trig-solve': { section: 'A', paper: 'P1', difficulty: 'Core', questionType: 'Equation solving', skills: ['unit circle', 'trig equations'] },
    'trig-fn': { section: 'Mixed', paper: 'Mixed', difficulty: 'Exam', questionType: 'Graph analysis', skills: ['amplitude', 'period', 'transformations'] },
    'descriptive-stats': { section: 'A', paper: 'P2', difficulty: 'Core', questionType: 'Technology routine', skills: ['mean', 'median', 'IQR'] },
    'normal-dist': { section: 'Mixed', paper: 'P2', difficulty: 'Exam', questionType: 'Distribution calculation', skills: ['normal CDF', 'standardization'] },
    'discrete-rv': { section: 'Mixed', paper: 'P2', difficulty: 'Exam', questionType: 'Distribution calculation', skills: ['expected value', 'variance'] },
    'binomial-dist': { section: 'Mixed', paper: 'P2', difficulty: 'Exam', questionType: 'Distribution calculation', skills: ['binomial probability', 'expected value'] },
    'differentiate-sp': { section: 'Mixed', paper: 'P1', difficulty: 'Exam', questionType: 'Calculus routine', skills: ['chain rule', 'stationary points'] },
    'integrate-area': { section: 'Mixed', paper: 'P1', difficulty: 'Exam', questionType: 'Calculus routine', skills: ['definite integral', 'area'] },
    'kinematics': { section: 'Mixed', paper: 'Mixed', difficulty: 'Exam', questionType: 'Modeling', skills: ['differentiation', 'integration', 'motion'] }
  };

  function historicalStyleWeight(prefixes, patterns, fallback) {
    const regexes = patterns.map(pattern => pattern instanceof RegExp ? pattern : new RegExp(pattern, 'i'));
    const matches = questionsForPrefixes(prefixes).filter(q => {
      const text = `${q.searchText || ''} ${q.bodyText || ''}`.toLowerCase();
      return regexes.some(regex => regex.test(text));
    }).length;
    return Math.max(1, matches || fallback || 1);
  }

  function weightedChoice(items) {
    const total = items.reduce((sum, item) => sum + Math.max(1, item.weight || 1), 0);
    let roll = Math.random() * total;
    for (const item of items) {
      roll -= Math.max(1, item.weight || 1);
      if (roll <= 0) return item;
    }
    return items[items.length - 1];
  }

  const enhancedGeneratorFactories = {
    'arith-first-d': original => [
      {
        name: 'term and maximum sum',
        weight: historicalStyleWeight(['1.2'], [/maximum sum|arithmetic sequence|common difference/], 8),
        generate: original
      },
      {
        name: 'two known terms',
        weight: historicalStyleWeight(['1.2'], [/u_\d|term|first term|common difference/], 6),
        generate() {
          const d = Pick([-4, -3, -2, 2, 3, 5]);
          const u1 = Pick([7, 10, 12, 18, 25]);
          const p = Pick([3, 4, 5]);
          const q = p + Pick([3, 4, 5]);
          const up = u1 + (p - 1) * d;
          const uq = u1 + (q - 1) * d;
          const n = Pick([10, 12, 15]);
          const sn = n * (2 * u1 + (n - 1) * d) / 2;
          return {
            stem: `An arithmetic sequence has $u_{${p}}=${up}$ and $u_{${q}}=${uq}$.`,
            parts: [
              { instr: 'Find the common difference.', marks: 2 },
              { instr: 'Find the first term.', marks: 2 },
              { instr: `Find $S_{${n}}$.`, marks: 3 }
            ],
            answer: `(a) $d=${d}$ (b) $u_1=${u1}$ (c) $S_{${n}}=${sn}$`,
            working: [
              `$u_{${q}}-u_{${p}}=(${q}-${p})d$, so $${uq}-${up}=${q - p}d$.`,
              `Thus $d=${d}$.`,
              `$u_{${p}}=u_1+(${p}-1)d$, so $${up}=u_1+${p - 1}(${d})$ and $u_1=${u1}$.`,
              `$S_{${n}}=\\dfrac{${n}}{2}(2(${u1})+${n - 1}(${d}))=${sn}$.`
            ]
          };
        }
      },
      {
        name: 'sigma and finite series',
        weight: historicalStyleWeight(['1.2'], [/sigma|sum|series|S_n/], 5),
        generate() {
          const a = Pick([2, 3, 4]);
          const b = Pick([1, 5, -2]);
          const n = Pick([8, 10, 12, 15]);
          const first = a + b;
          const last = a * n + b;
          const sum = n * (first + last) / 2;
          return {
            stem: `The sequence is defined by $u_n=${a}n ${signed(b)}$ for $n\\ge1$.`,
            parts: [
              { instr: 'Show that the sequence is arithmetic.', marks: 2 },
              { instr: `Evaluate $\\displaystyle \\sum_{r=1}^{${n}} u_r$.`, marks: 4 }
            ],
            answer: `The common difference is ${a} and the sum is ${sum}.`,
            working: [
              `$u_{n+1}-u_n=(${a}(n+1) ${signed(b)})-(${a}n ${signed(b)})=${a}$, so the sequence is arithmetic.`,
              `$u_1=${first}$ and $u_{${n}}=${last}$.`,
              `$\\sum_{r=1}^{${n}}u_r=S_{${n}}=\\dfrac{${n}}{2}(${first}+${last})=${sum}$.`
            ]
          };
        }
      }
    ],
    'geom-sum-inf': original => [
      {
        name: 'sum to infinity and remainder',
        weight: historicalStyleWeight(['1.3', '1.8'], [/infinite|infinity|remainder|least/], 9),
        generate: original
      },
      {
        name: 'finite growth threshold',
        weight: historicalStyleWeight(['1.3'], [/least|exceed|greater|sum/], 6),
        generate() {
          const u1 = Pick([2, 3, 5, 8]);
          const r = Pick([2, 3]);
          const n = Pick([5, 6, 7]);
          const un = u1 * Math.pow(r, n - 1);
          const sn = u1 * (Math.pow(r, n) - 1) / (r - 1);
          const target = Math.round(sn * Pick([1.2, 1.5, 2]));
          let k = 1;
          while (u1 * (Math.pow(r, k) - 1) / (r - 1) <= target) k++;
          return {
            stem: `A geometric sequence has first term ${u1} and common ratio ${r}.`,
            parts: [
              { instr: `Find $u_{${n}}$.`, marks: 2 },
              { instr: `Find $S_{${n}}$.`, marks: 2 },
              { instr: `Find the least value of $k$ for which $S_k>${target}$.`, marks: 4 }
            ],
            answer: `(a) $u_{${n}}=${un}$ (b) $S_{${n}}=${sn}$ (c) $k=${k}$`,
            working: [
              `$u_{${n}}=${u1}(${r})^{${n - 1}}=${un}$.`,
              `$S_{${n}}=\\dfrac{${u1}(${r}^{${n}}-1)}{${r}-1}=${sn}$.`,
              `Solve $\\dfrac{${u1}(${r}^k-1)}{${r}-1}>${target}$.`,
              `Checking the integer boundary gives $S_{${k - 1}}\\le ${target}$ and $S_{${k}}>${target}$, so $k=${k}$.`
            ]
          };
        }
      },
      {
        name: 'ratio from two terms',
        weight: historicalStyleWeight(['1.3'], [/common ratio|two terms|term/], 5),
        generate() {
          const rN = Pick([1, 2, 3]);
          const rD = Pick([2, 3, 4]);
          const u1 = Pick([12, 18, 24, 36]);
          const p = 2;
          const q = Pick([4, 5]);
          const up = u1 * Math.pow(rN / rD, p - 1);
          const uq = u1 * Math.pow(rN / rD, q - 1);
          const sInf = u1 / (1 - rN / rD);
          return {
            stem: `A convergent geometric sequence has positive common ratio. It is given that $u_${p}=${F(up)}$ and $u_${q}=${F(uq)}$.`,
            parts: [
              { instr: 'Find the common ratio.', marks: 3 },
              { instr: 'Find the first term.', marks: 2 },
              { instr: 'Find the sum to infinity.', marks: 3 }
            ],
            answer: `(a) $r=${Fr(rN, rD)}$ (b) $u_1=${u1}$ (c) $S_\\infty=${F(sInf)}$`,
            working: [
              `$\\dfrac{u_${q}}{u_${p}}=r^{${q - p}}$, so $r=${Fr(rN, rD)}$ because the ratio is positive.`,
              `$u_1=\\dfrac{u_${p}}{r^{${p - 1}}}=${u1}$.`,
              `$S_\\infty=\\dfrac{u_1}{1-r}=\\dfrac{${u1}}{1-${Fr(rN, rD)}}=${F(sInf)}$.`
            ]
          };
        }
      },
      {
        name: 'geometric context model',
        weight: historicalStyleWeight(['1.3', '1.4'], [/depreciation|interest|model|context|value/], 5),
        generate() {
          const start = Pick([1200, 2500, 4800, 9000]);
          const pct = Pick([8, 12, 15, 20]);
          const years = Pick([3, 4, 5]);
          const ratio = 1 - pct / 100;
          const value = start * Math.pow(ratio, years);
          const threshold = Math.round(start * Pick([0.35, 0.45, 0.55]) / 100) * 100;
          let n = 0;
          while (start * Math.pow(ratio, n) >= threshold) n++;
          return {
            stem: `A laptop is worth $${start}. Its value decreases by ${pct}% each year.`,
            parts: [
              { instr: `Find its value after ${years} years.`, marks: 2 },
              { instr: `Find the first year in which its value is less than $${threshold}.`, marks: 4 },
              { instr: 'State the common ratio in this model.', marks: 1 }
            ],
            answer: `(a) $${value.toFixed(2)} (b) year ${n} (c) ${F(ratio)}`,
            working: [
              `The values form a geometric sequence with ratio $1-${pct}/100=${F(ratio)}$.`,
              `After ${years} years, value $=${start}(${F(ratio)})^{${years}}=${value.toFixed(2)}$.`,
              `Solve $${start}(${F(ratio)})^n<${threshold}$.`,
              `The first integer satisfying this is $n=${n}$.`
            ]
          };
        }
      }
    ],
    'quadratic-fn': original => [
      {
        name: 'vertex roots and graph features',
        weight: historicalStyleWeight(['2.6'], [/vertex|axis|root|quadratic/], 10),
        generate: original
      },
      {
        name: 'discriminant parameter',
        weight: historicalStyleWeight(['2.6', '2.7'], [/discriminant|nature of roots|one root|two roots/], 7),
        generate() {
          const k = Pick([1, 2, 3, 4]);
          const b = Pick([4, 6, 8, 10]);
          const c = b * b / 4 - k;
          return {
            stem: `The quadratic equation $x^2-${b}x+c=0$ has two distinct real roots.`,
            parts: [
              { instr: 'Find the greatest possible value of $c$ if $c$ is an integer.', marks: 4 },
              { instr: 'For this value of $c$, find the two roots.', marks: 3 }
            ],
            answer: `(a) $c=${b * b / 4 - 1}$ (b) roots $${b / 2 - 1}$ and $${b / 2 + 1}$`,
            working: [
              `For two distinct real roots, $\\Delta>0$.`,
              `$\\Delta=(-${b})^2-4c=${b * b}-4c>0$.`,
              `Thus $c<${b * b / 4}$. The greatest integer value is $c=${b * b / 4 - 1}$.`,
              `The equation becomes $x^2-${b}x+${b * b / 4 - 1}=0=(x-${b / 2 - 1})(x-${b / 2 + 1})$.`
            ]
          };
        }
      },
      {
        name: 'context maximum',
        weight: historicalStyleWeight(['2.6'], [/maximum|model|height|profit|area/], 6),
        generate() {
          const h = Pick([3, 4, 5]);
          const k = Pick([24, 30, 40]);
          const a = Pick([1, 2]);
          const root1 = h - Math.sqrt(k / a);
          const root2 = h + Math.sqrt(k / a);
          return {
            stem: `The height of a model rocket is $H(t)=-${a}(t-${h})^2+${k}$ metres.`,
            parts: [
              { instr: 'State the maximum height and the time when it occurs.', marks: 2 },
              { instr: 'Find the initial height.', marks: 2 },
              { instr: 'Find the times when the rocket is at ground level.', marks: 4 }
            ],
            answer: `(a) ${k} m at $t=${h}$ (b) ${F(-a * h * h + k)} m (c) $t=${F(root1)}$ and $t=${F(root2)}$`,
            working: [
              `The vertex form shows the maximum is ${k} when $t=${h}$.`,
              `$H(0)=-${a}(0-${h})^2+${k}=${F(-a * h * h + k)}$.`,
              `Set $H(t)=0$: $-${a}(t-${h})^2+${k}=0$.`,
              `$(t-${h})^2=${F(k / a)}$, so $t=${F(root1)}$ or $t=${F(root2)}$.`
            ]
          };
        }
      }
    ],
    'triangle-trig': original => [
      {
        name: 'sine and cosine rule',
        weight: historicalStyleWeight(['3.2'], [/sine rule|cosine rule|triangle/], 10),
        generate: original
      },
      {
        name: 'included angle area',
        weight: historicalStyleWeight(['3.2'], [/area|included angle/], 5),
        generate() {
          const a = Pick([5, 7, 9, 12]);
          const b = Pick([6, 8, 10, 13]);
          const C = Pick([35, 50, 65, 110]);
          const c = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(C * Math.PI / 180));
          const area = 0.5 * a * b * Math.sin(C * Math.PI / 180);
          return {
            stem: `In triangle $ABC$, $AB=${a}$ cm, $AC=${b}$ cm and $\\angle BAC=${C}^\\circ$.`,
            parts: [
              { instr: 'Find $BC$.', marks: 3 },
              { instr: 'Find the area of triangle $ABC$.', marks: 3 }
            ],
            answer: `(a) ${D3(c)} cm (b) ${D3(area)} cm^2`,
            working: [
              `By the cosine rule, $BC^2=${a}^2+${b}^2-2(${a})(${b})\\cos ${C}^\\circ$.`,
              `$BC=${D3(c)}$ cm.`,
              `Area $=\\dfrac12(${a})(${b})\\sin ${C}^\\circ=${D3(area)}$ cm^2.`
            ]
          };
        }
      },
      {
        name: 'bearing style context',
        weight: historicalStyleWeight(['3.2'], [/bearing|distance|angle of elevation|context/], 4),
        generate() {
          const AB = Pick([8, 10, 12]);
          const AC = Pick([11, 14, 16]);
          const A = Pick([42, 58, 73]);
          const BC = Math.sqrt(AB * AB + AC * AC - 2 * AB * AC * Math.cos(A * Math.PI / 180));
          return {
            stem: `Two paths from point $A$ to points $B$ and $C$ are ${AB} km and ${AC} km long. The angle between the paths is ${A}^\\circ.`,
            parts: [
              { instr: 'Draw or describe the triangle model.', marks: 1 },
              { instr: 'Find the distance $BC$.', marks: 4 },
              { instr: 'State why the cosine rule is appropriate.', marks: 1 }
            ],
            answer: `$BC=${D3(BC)}$ km`,
            working: [
              `The known information is two sides and their included angle.`,
              `Use the cosine rule: $BC^2=${AB}^2+${AC}^2-2(${AB})(${AC})\\cos ${A}^\\circ$.`,
              `$BC=${D3(BC)}$ km.`
            ]
          };
        }
      }
    ],
    'differentiate-sp': original => [
      {
        name: 'stationary points',
        weight: historicalStyleWeight(['5.6', '5.7'], [/stationary|derivative|turning point/], 9),
        generate: original
      },
      {
        name: 'product rule',
        weight: historicalStyleWeight(['5.6'], [/product rule|differentiate|f'\\(x\\)/], 5),
        generate() {
          const a = Pick([2, 3, 4]);
          const b = Pick([1, -2, 5]);
          const x = Pick([1, 2, 3]);
          const val = (2 * x) * (a * x + b) + (x * x + 1) * a;
          return {
            stem: `Let $f(x)=(x^2+1)(${a}x ${signed(b)})$.`,
            parts: [
              { instr: "Find $f'(x)$ using the product rule.", marks: 4 },
              { instr: `Find $f'(${x})$.`, marks: 2 }
            ],
            answer: `$f'(x)=2x(${a}x ${signed(b)})+${a}(x^2+1)$ and $f'(${x})=${val}$`,
            working: [
              `Let $u=x^2+1$ and $v=${a}x ${signed(b)}$.`,
              `$u'=2x$ and $v'=${a}$.`,
              `$f'(x)=u'v+uv'=2x(${a}x ${signed(b)})+${a}(x^2+1)$.`,
              `$f'(${x})=${val}$.`
            ]
          };
        }
      },
      {
        name: 'chain rule tangent',
        weight: historicalStyleWeight(['5.6', '5.4'], [/chain rule|tangent|normal/], 6),
        generate() {
          const a = Pick([2, 3]);
          const b = Pick([1, 4, -2]);
          const n = Pick([2, 3]);
          const x = Pick([1, 2]);
          const y = Math.pow(a * x + b, n);
          const m = n * a * Math.pow(a * x + b, n - 1);
          const c = y - m * x;
          return {
            stem: `The curve $C$ has equation $y=(${a}x ${signed(b)})^{${n}}$.`,
            parts: [
              { instr: 'Find $\\dfrac{dy}{dx}$.', marks: 3 },
              { instr: `Find the equation of the tangent to $C$ at $x=${x}$.`, marks: 4 }
            ],
            answer: `$\\dfrac{dy}{dx}=${n * a}(${a}x ${signed(b)})^{${n - 1}}$ and tangent $y=${m}x ${signed(c)}$`,
            working: [
              `Use the chain rule: $\\dfrac{dy}{dx}=${n}(${a}x ${signed(b)})^{${n - 1}}(${a})$.`,
              `At $x=${x}$, $y=${y}$ and gradient $m=${m}$.`,
              `Tangent: $y-${y}=${m}(x-${x})$, so $y=${m}x ${signed(c)}$.`
            ]
          };
        }
      }
    ],
    'integrate-area': original => [
      {
        name: 'area under curve',
        weight: historicalStyleWeight(['5.11', '5.5'], [/area|integral|x-axis/], 9),
        generate: original
      },
      {
        name: 'definite integral with parameter',
        weight: historicalStyleWeight(['5.10', '5.11'], [/definite integral|find k|parameter/], 4),
        generate() {
          const k = Pick([2, 3, 4]);
          const target = k / 3 + k;
          return {
            stem: `It is given that $\\displaystyle \\int_0^1 (kx^2+k)\\,dx=${F(target)}$.`,
            parts: [
              { instr: 'Find the value of $k$.', marks: 4 },
              { instr: 'Hence find $\\displaystyle \\int_0^2 (kx^2+k)\\,dx$.', marks: 3 }
            ],
            answer: `(a) $k=${k}$ (b) ${F(8 * k / 3 + 2 * k)}`,
            working: [
              `$\\int_0^1(kx^2+k)\\,dx=\\left[${Fr(k, 3)}x^3+kx\\right]_0^1=${Fr(4 * k, 3)}=${F(target)}$.`,
              `Therefore $k=${k}$.`,
              `$\\int_0^2(${k}x^2+${k})\\,dx=\\left[${Fr(k, 3)}x^3+${k}x\\right]_0^2=${F(8 * k / 3 + 2 * k)}$.`
            ]
          };
        }
      },
      {
        name: 'area between curves',
        weight: historicalStyleWeight(['5.11'], [/between curves|enclosed|intersection/], 6),
        generate() {
          const m = Pick([2, 3, 4, 5]);
          const area = Math.pow(m, 3) / 6;
          return {
            stem: `The line $y=${m}x$ and the curve $y=x^2$ enclose a finite region.`,
            parts: [
              { instr: 'Find the $x$-coordinates of the intersection points.', marks: 2 },
              { instr: 'Find the area of the enclosed region.', marks: 5 }
            ],
            answer: `(a) $x=0, ${m}$ (b) ${F(area)} square units`,
            working: [
              `Set $x^2=${m}x$, so $x(x-${m})=0$.`,
              `The intersections have $x=0$ and $x=${m}$.`,
              `Area $=\\int_0^{${m}}(${m}x-x^2)\\,dx=${F(area)}$.`
            ]
          };
        }
      }
    ]
  };

  const newTemplates = [
    {
      id: 'proof-even-odd',
      syllabus: '1.6', topic: 1, section: 'A', paper: 'P1', difficulty: 'Core', marks: 4,
      questionType: 'Proof', skills: ['algebraic proof', 'integer representation'],
      title: 'Proof: parity and divisibility',
      desc: 'Represent integers algebraically and prove an even, odd, or divisibility result.',
      generate() {
        const cases = [
          {
            stem: 'Let $n$ be an integer. Prove that the sum of two consecutive odd integers is divisible by 4.',
            answer: 'The sum can be written as $4n+4=4(n+1)$, so it is divisible by 4.',
            working: [
              'Two consecutive odd integers can be written as $2n+1$ and $2n+3$.',
              'Their sum is $(2n+1)+(2n+3)=4n+4$.',
              '$4n+4=4(n+1)$. Since $n+1$ is an integer, the sum is divisible by 4.'
            ]
          },
          {
            stem: 'Let $n$ be an integer. Prove that the product of two consecutive even integers is divisible by 8.',
            answer: 'The product can be written as $4n(n+1)$. Since one of $n$ and $n+1$ is even, this is divisible by 8.',
            working: [
              'Two consecutive even integers can be written as $2n$ and $2n+2$.',
              'Their product is $(2n)(2n+2)=4n(n+1)$.',
              'One of two consecutive integers, $n$ and $n+1$, must be even.',
              'Therefore $n(n+1)$ is even, so $4n(n+1)$ is a multiple of 8.'
            ]
          },
          {
            stem: 'Let $n$ be an integer. Prove that the difference between the squares of two consecutive integers is odd.',
            answer: 'The difference is $2n+1$, which has the form of an odd integer.',
            working: [
              'Two consecutive integers can be written as $n$ and $n+1$.',
              'The difference between their squares is $(n+1)^2-n^2$.',
              'Expanding gives $n^2+2n+1-n^2=2n+1$.',
              'Since $2n+1$ is odd for every integer $n$, the result is proved.'
            ]
          }
        ];
        const c = Pick(cases);
        return {
          stem: c.stem,
          parts: [{ instr: 'Write a clear algebraic proof.', marks: 4 }],
          answer: c.answer,
          working: c.working
        };
      }
    },
    {
      id: 'geo-infinite-from-terms',
      syllabus: '1.8', topic: 1, section: 'A', paper: 'P1', difficulty: 'Core', marks: 5,
      questionType: 'Short response', skills: ['geometric sequence', 'sum to infinity'],
      title: 'Infinite geometric series from terms',
      desc: 'Use two terms to find the ratio and then calculate the infinite sum.',
      generate() {
        const cases = [
          { u1: 12, rN: 1, rD: 2, a: 1, b: 3 },
          { u1: 18, rN: 1, rD: 3, a: 1, b: 3 },
          { u1: 16, rN: 3, rD: 4, a: 1, b: 3 },
          { u1: 24, rN: 2, rD: 3, a: 1, b: 4 }
        ];
        const c = Pick(cases);
        const r = c.rN / c.rD;
        const ua = c.u1 * Math.pow(r, c.a - 1);
        const ub = c.u1 * Math.pow(r, c.b - 1);
        const sInf = c.u1 / (1 - r);
        return {
          stem: `A geometric sequence has positive common ratio $r$. The terms are $u_{${c.a}}=${F(ua)}$ and $u_{${c.b}}=${F(ub)}$.`,
          parts: [
            { instr: 'Find the common ratio.', marks: 2 },
            { instr: 'Find the sum to infinity.', marks: 3 }
          ],
          answer: `(a) $r=${Fr(c.rN, c.rD)}$ (b) $S_\\infty=${F(sInf)}$`,
          working: [
            `$u_{${c.b}}=u_{${c.a}}r^{${c.b - c.a}}$, so $${F(ub)}=${F(ua)}r^{${c.b - c.a}}$.`,
            `$r^{${c.b - c.a}}=${F(ub / ua)}$, giving $r=${Fr(c.rN, c.rD)}$ because $r>0$.`,
            `$S_\\infty=\\dfrac{u_1}{1-r}=\\dfrac{${c.u1}}{1-${Fr(c.rN, c.rD)}}=${F(sInf)}$.`
          ]
        };
      }
    },
    {
      id: 'arith-context-section-b',
      syllabus: '1.2', topic: 1, section: 'B', paper: 'Mixed', difficulty: 'Challenge', marks: 10,
      questionType: 'Section B modeling', skills: ['arithmetic sequence', 'series', 'inequalities'],
      title: 'Section B: arithmetic seating model',
      desc: 'Model rows of seats with an arithmetic sequence and use a sum inequality.',
      generate() {
        const u1 = Pick([18, 20, 24, 30]);
        const d = Pick([2, 3, 4]);
        const n = Pick([14, 16, 18]);
        const target = Pick([700, 800, 900, 1000]);
        const un = u1 + (n - 1) * d;
        const total = n * (u1 + un) / 2;
        let least = 1;
        while (least * (2 * u1 + (least - 1) * d) / 2 < target) least++;
        return {
          stem: `In a theatre, row 1 has ${u1} seats. Each following row has ${d} more seats than the row before it.`,
          parts: [
            { instr: `Find the number of seats in row ${n}.`, marks: 2 },
            { instr: `Find the total number of seats in the first ${n} rows.`, marks: 3 },
            { instr: `Find the least number of complete rows needed to have at least ${target} seats.`, marks: 5 }
          ],
          answer: `(a) ${un} seats (b) ${total} seats (c) ${least} rows`,
          working: [
            `The row numbers form an arithmetic sequence with $u_1=${u1}$ and $d=${d}$.`,
            `(a) $u_{${n}}=${u1}+(${n}-1)${d}=${un}$.`,
            `(b) $S_{${n}}=\\dfrac{${n}}{2}(${u1}+${un})=${total}$.`,
            `(c) Solve $S_n=\\dfrac{n}{2}(2(${u1})+(n-1)${d})\\ge ${target}$.`,
            `Testing the integer boundary gives $S_{${least - 1}}=${(least - 1) * (2 * u1 + (least - 2) * d) / 2}<${target}$ and $S_{${least}}=${least * (2 * u1 + (least - 1) * d) / 2}\\ge ${target}$.`
          ]
        };
      }
    },
    {
      id: 'compound-interest-years',
      syllabus: '1.4', topic: 1, section: 'B', paper: 'P2', difficulty: 'Exam', marks: 7,
      questionType: 'Financial modeling', skills: ['compound interest', 'logarithms', 'technology'],
      title: 'Compound interest: least number of years',
      desc: 'Use an exponential financial model and solve for a time threshold.',
      generate() {
        const pv = Pick([2400, 3200, 5000, 7500]);
        const rate = Pick([2.5, 3.2, 4, 4.8, 5.5]);
        const years = Pick([4, 5, 6]);
        const multiplier = 1 + rate / 100;
        const value = pv * Math.pow(multiplier, years);
        const target = Math.ceil((value * Pick([1.12, 1.18, 1.25])) / 100) * 100;
        const least = Math.ceil(Math.log(target / pv) / Math.log(multiplier));
        return {
          stem: `A student invests $${pv} dollars in an account paying ${rate}% annual compound interest.`,
          parts: [
            { instr: `Find the value of the investment after ${years} years.`, marks: 2 },
            { instr: `Find the least number of whole years needed for the investment to exceed $${target}.`, marks: 5 }
          ],
          answer: `(a) $${value.toFixed(2)} (b) ${least} years`,
          working: [
            `Use $V=${pv}(1+${rate}/100)^t=${pv}(${multiplier})^t$.`,
            `(a) $V=${pv}(${multiplier})^{${years}}=${value.toFixed(2)}$.`,
            `(b) Solve $${pv}(${multiplier})^t>${target}$.`,
            `$t>\\dfrac{\\ln(${target}/${pv})}{\\ln(${multiplier})}=${D3(Math.log(target / pv) / Math.log(multiplier))}$.`,
            `The least whole number of years is ${least}.`
          ]
        };
      }
    },
    {
      id: 'line-parallel-perpendicular',
      syllabus: '2.1', topic: 2, section: 'A', paper: 'P1', difficulty: 'Core', marks: 6,
      questionType: 'Short response', skills: ['gradient', 'parallel lines', 'perpendicular lines'],
      title: 'Lines: parallel and perpendicular',
      desc: 'Find equations of lines through a point with parallel and perpendicular gradients.',
      generate() {
        const cases = [
          { m: 2, x: 3, y: -1 },
          { m: -3, x: 2, y: 5 },
          { m: 4, x: -1, y: 7 },
          { m: -2, x: -3, y: 4 }
        ];
        const c = Pick(cases);
        const cParallel = c.y - c.m * c.x;
        const nNum = -1;
        const nDen = c.m;
        const cNormalNum = c.y * c.m + c.x;
        const cNormalDen = c.m;
        return {
          stem: `The line $L$ has equation $y=${c.m}x ${signed(Pick([1, 2, 4]))}$. Point $A$ has coordinates $(${c.x}, ${c.y})$.`,
          parts: [
            { instr: 'Find the equation of the line through $A$ parallel to $L$.', marks: 3 },
            { instr: 'Find the equation of the line through $A$ perpendicular to $L$.', marks: 3 }
          ],
          answer: `(a) $y=${c.m}x ${signed(cParallel)}$ (b) $${line(nNum, nDen, cNormalNum, cNormalDen)}$`,
          working: [
            `A line parallel to $L$ has gradient ${c.m}.`,
            `Using $y=mx+c$ and $A(${c.x},${c.y})$: $${c.y}=${c.m}(${c.x})+c$, so $c=${cParallel}$.`,
            `The perpendicular gradient is $-${Fr(1, c.m)}$.`,
            `Using $A(${c.x},${c.y})$ gives $y=${Fr(nNum, nDen)}x ${cNormalNum < 0 ? '- ' + Fr(Math.abs(cNormalNum), cNormalDen) : '+ ' + Fr(cNormalNum, cNormalDen)}$.`
          ]
        };
      }
    },
    {
      id: 'domain-range-inverse-linear',
      syllabus: '2.2', topic: 2, section: 'A', paper: 'P1', difficulty: 'Core', marks: 6,
      questionType: 'Function notation', skills: ['domain', 'range', 'inverse function'],
      title: 'Functions: domain, range and inverse',
      desc: 'Determine a restricted range and find the inverse of a linear function.',
      generate() {
        const a = Pick([2, 3, -2, -4]);
        const b = Pick([-5, -1, 3, 6]);
        const lo = Pick([-3, -2, 0, 1]);
        const hi = lo + Pick([4, 5, 6]);
        const y1 = a * lo + b;
        const y2 = a * hi + b;
        const rLo = Math.min(y1, y2);
        const rHi = Math.max(y1, y2);
        return {
          stem: `The function $f$ is defined by $f(x)=${a}x ${signed(b)}$, for ${lo} $\\le x \\le$ ${hi}.`,
          parts: [
            { instr: 'Find the range of $f$.', marks: 2 },
            { instr: 'Find an expression for $f^{-1}(x)$.', marks: 2 },
            { instr: 'State the domain of $f^{-1}$.', marks: 2 }
          ],
          answer: `(a) ${rLo} $\\le f(x) \\le$ ${rHi} (b) $f^{-1}(x)=${Fr(1, a)}(x ${signed(-b)})$ (c) ${rLo} $\\le x \\le$ ${rHi}`,
          working: [
            `Calculate endpoint values: $f(${lo})=${y1}$ and $f(${hi})=${y2}$.`,
            `The range is from ${rLo} to ${rHi}.`,
            `Let $y=${a}x ${signed(b)}$. Rearranging gives $x=\\dfrac{y ${signed(-b)}}{${a}}$.`,
            `Therefore $f^{-1}(x)=\\dfrac{x ${signed(-b)}}{${a}}$.`,
            `The domain of the inverse is the range of the original function.`
          ]
        };
      }
    },
    {
      id: 'function-composition-context-b',
      syllabus: '2.5', syllabusRefs: ['2.2', '2.5'], topic: 2, section: 'B', paper: 'Mixed', difficulty: 'Exam', marks: 8,
      questionType: 'Function manipulation', skills: ['composition', 'solving equations', 'domain'],
      title: 'Section B: composite function equation',
      desc: 'Compose a linear function with a quadratic and solve the resulting equation.',
      generate() {
        const a = Pick([2, 3, 4]);
        const b = Pick([-5, -3, 1, 2]);
        const c = Pick([1, 2, 4]);
        const root = Pick([2, 3, 4]);
        const target = a * (root * root + c) + b;
        return {
          stem: `Let $f(x)=${a}x ${signed(b)}$ and $g(x)=x^2+${c}$ for $x\\ge0$.`,
          parts: [
            { instr: 'Find an expression for $(f\\circ g)(x)$.', marks: 2 },
            { instr: `Solve $(f\\circ g)(x)=${target}$.`, marks: 3 },
            { instr: 'Explain why only one solution is accepted.', marks: 3 }
          ],
          answer: `(a) $(f\\circ g)(x)=${a}x^2 ${signed(a * c + b)}$ (b) $x=${root}$ (c) The domain is $x\\ge0$.`,
          working: [
            `$(f\\circ g)(x)=f(x^2+${c})=${a}(x^2+${c}) ${signed(b)}=${a}x^2 ${signed(a * c + b)}$.`,
            `Solve $${a}x^2 ${signed(a * c + b)}=${target}$.`,
            `$${a}x^2=${target - (a * c + b)}$, so $x^2=${root * root}$.`,
            `$x=\\pm ${root}$, but the domain of $g$ is $x\\ge0$, so $x=${root}$.`
          ]
        };
      }
    },
    {
      id: 'quadratic-inequality-discriminant',
      syllabus: '2.7', topic: 2, section: 'B', paper: 'P1', difficulty: 'Exam', marks: 7,
      questionType: 'Algebraic inequality', skills: ['factorising', 'discriminant', 'quadratic inequality'],
      title: 'Quadratic inequalities and discriminant',
      desc: 'Use roots and the discriminant to solve a quadratic inequality.',
      generate() {
        const r1 = Pick([-5, -4, -3, -2, 1]);
        const r2 = r1 + Pick([4, 5, 6, 7]);
        const b = -(r1 + r2);
        const c = r1 * r2;
        const disc = b * b - 4 * c;
        return {
          stem: `Consider $f(x)=${poly2(1, b, c)}$.`,
          parts: [
            { instr: 'Find the discriminant of $f(x)$.', marks: 2 },
            { instr: 'Hence solve $f(x)<0$.', marks: 5 }
          ],
          answer: `(a) $\\Delta=${disc}$ (b) ${r1} $<x<$ ${r2}`,
          working: [
            `$\\Delta=b^2-4ac=(${b})^2-4(1)(${c})=${disc}$.`,
            `$f(x)=(x ${signed(-r1)})(x ${signed(-r2)})$.`,
            `The roots are $x=${r1}$ and $x=${r2}$.`,
            `Since the coefficient of $x^2$ is positive, the graph is below the x-axis between the roots.`,
            `Therefore ${r1} $<x<$ ${r2}.`
          ]
        };
      }
    },
    {
      id: 'rational-asymptotes',
      syllabus: '2.8', topic: 2, section: 'A', paper: 'P1', difficulty: 'Core', marks: 6,
      questionType: 'Graph features', skills: ['rational functions', 'asymptotes', 'equations'],
      title: 'Rational functions: asymptotes',
      desc: 'Identify vertical and horizontal asymptotes and solve a simple rational equation.',
      generate() {
        const a = Pick([2, 3, 4, 6]);
        const h = Pick([-3, -2, 1, 4]);
        const k = Pick([-2, 1, 3]);
        const y = k + Pick([1, 2, -1]);
        const x = h + a / (y - k);
        return {
          stem: `The function $f$ is defined by $f(x)=\\dfrac{${a}}{x ${signed(-h)}} ${signed(k)}$.`,
          parts: [
            { instr: 'State the equations of the vertical and horizontal asymptotes.', marks: 2 },
            { instr: `Solve $f(x)=${y}$.`, marks: 4 }
          ],
          answer: `(a) $x=${h}$ and $y=${k}$ (b) $x=${F(x)}$`,
          working: [
            `The denominator is zero when $x=${h}$, so the vertical asymptote is $x=${h}$.`,
            `As $x$ becomes very large, $\\dfrac{${a}}{x ${signed(-h)}}$ approaches 0, so the horizontal asymptote is $y=${k}$.`,
            `Solve $\\dfrac{${a}}{x ${signed(-h)}} ${signed(k)}=${y}$.`,
            `$\\dfrac{${a}}{x ${signed(-h)}}=${y - k}$, so $x ${signed(-h)}=${F(a / (y - k))}$.`,
            `Therefore $x=${F(x)}$.`
          ]
        };
      }
    },
    {
      id: 'quadratic-model-section-b',
      syllabus: '2.6', topic: 2, section: 'B', paper: 'Mixed', difficulty: 'Challenge', marks: 9,
      questionType: 'Section B modeling', skills: ['quadratic model', 'vertex', 'roots'],
      title: 'Section B: quadratic projectile model',
      desc: 'Interpret a quadratic model using intercepts and the maximum point.',
      generate() {
        const T = Pick([5, 6, 8, 10]);
        const p = Pick([1, 2, 3]);
        const b = T - p;
        const c = T * p;
        const tMax = b / 2;
        const hMax = -tMax * tMax + b * tMax + c;
        return {
          stem: `The height of a ball above the ground is modelled by $h(t)=-t^2+${b}t+${c}$, where $t$ is time in seconds.`,
          parts: [
            { instr: 'Find the initial height of the ball.', marks: 1 },
            { instr: 'Find the maximum height and the time when it occurs.', marks: 4 },
            { instr: 'Find the time when the ball hits the ground.', marks: 4 }
          ],
          answer: `(a) ${c} m (b) ${F(hMax)} m at $t=${F(tMax)}$ (c) $t=${T}$ seconds`,
          working: [
            `(a) $h(0)=${c}$.`,
            `(b) The axis of symmetry is $t=-\\dfrac{b}{2a}=-\\dfrac{${b}}{2(-1)}=${F(tMax)}$.`,
            `$h(${F(tMax)})=${F(hMax)}$, so the maximum height is ${F(hMax)} m.`,
            `(c) Solve $-t^2+${b}t+${c}=0$.`,
            `This factorises as $-(t-${T})(t+${p})=0$.`,
            `The physical solution is $t=${T}$ seconds.`
          ]
        };
      }
    },
    {
      id: 'three-d-distance-midpoint',
      syllabus: '3.1', topic: 3, section: 'A', paper: 'P1', difficulty: 'Core', marks: 5,
      questionType: 'Coordinate geometry', skills: ['3D distance', 'midpoint'],
      title: '3D coordinates: midpoint and distance',
      desc: 'Find a midpoint and distance between two points in three-dimensional space.',
      generate() {
        const A = [Rnd(-3, 3), Rnd(-2, 4), Rnd(0, 5)];
        const d = Pick([[2, 4, 4], [3, 4, 12], [6, 8, 0], [1, 2, 2], [4, 4, 7]]);
        const B = A.map((v, i) => v + d[i]);
        const mid = A.map((v, i) => Fr(v + B[i], 2));
        const dist2 = d.reduce((s, v) => s + v * v, 0);
        const dist = Math.sqrt(dist2);
        return {
          stem: `Points $A(${A.join(', ')})$ and $B(${B.join(', ')})$ are in three-dimensional space.`,
          parts: [
            { instr: 'Find the coordinates of the midpoint of $AB$.', marks: 2 },
            { instr: 'Find the length $AB$.', marks: 3 }
          ],
          answer: `(a) $(${mid.join(', ')})$ (b) $\\sqrt{${dist2}}=${F(dist)}$`,
          working: [
            `Midpoint $=\\left(\\dfrac{x_1+x_2}{2},\\dfrac{y_1+y_2}{2},\\dfrac{z_1+z_2}{2}\\right)=(${mid.join(', ')})$.`,
            `$AB=\\sqrt{(${d[0]})^2+(${d[1]})^2+(${d[2]})^2}=\\sqrt{${dist2}}=${F(dist)}$.`
          ]
        };
      }
    },
    {
      id: 'triangle-ambiguous-sine',
      syllabus: '3.5', syllabusRefs: ['3.2', '3.5'], topic: 3, section: 'B', paper: 'P1', difficulty: 'Exam', marks: 7,
      questionType: 'Triangle trigonometry', skills: ['sine rule', 'ambiguous case'],
      title: 'Sine rule: ambiguous case',
      desc: 'Use the sine rule to find possible values for an angle.',
      generate() {
        const A = Pick([30, 35, 40]);
        const a = Pick([5, 6, 7]);
        const b = a + Pick([2, 3]);
        const sinB = b * Math.sin(A * Math.PI / 180) / a;
        const B1 = Math.asin(sinB) * 180 / Math.PI;
        const B2 = 180 - B1;
        return {
          stem: `In triangle $ABC$, $A=${A}^\\circ$, $a=${a}$ cm and $b=${b}$ cm.`,
          parts: [
            { instr: 'Use the sine rule to find the possible values of angle $B$.', marks: 5 },
            { instr: 'Explain why there may be two possible triangles.', marks: 2 }
          ],
          answer: `(a) $B=${D3(B1)}^\\circ$ or $B=${D3(B2)}^\\circ$ (b) Sine is positive in quadrants I and II.`,
          working: [
            `By the sine rule, $\\dfrac{\\sin B}{${b}}=\\dfrac{\\sin ${A}^\\circ}{${a}}$.`,
            `$\\sin B=\\dfrac{${b}\\sin ${A}^\\circ}{${a}}=${D3(sinB)}$.`,
            `The first solution is $B=${D3(B1)}^\\circ$.`,
            `The second possible solution is $180^\\circ-${D3(B1)}^\\circ=${D3(B2)}^\\circ$.`,
            `Both are possible if $A+B<180^\\circ$.`
          ]
        };
      }
    },
    {
      id: 'exact-trig-unit-circle',
      syllabus: '3.5', topic: 3, section: 'A', paper: 'P1', difficulty: 'Core', marks: 5,
      questionType: 'Exact values', skills: ['unit circle', 'exact trig ratios'],
      title: 'Exact trig values on the unit circle',
      desc: 'Find exact sine, cosine and tangent values for common angles.',
      generate() {
        const cases = [
          { t: '\\dfrac{5\\pi}{6}', sin: '\\dfrac{1}{2}', cos: '-\\dfrac{\\sqrt{3}}{2}', tan: '-\\dfrac{\\sqrt{3}}{3}' },
          { t: '\\dfrac{7\\pi}{4}', sin: '-\\dfrac{\\sqrt{2}}{2}', cos: '\\dfrac{\\sqrt{2}}{2}', tan: '-1' },
          { t: '\\dfrac{4\\pi}{3}', sin: '-\\dfrac{\\sqrt{3}}{2}', cos: '-\\dfrac{1}{2}', tan: '\\sqrt{3}' },
          { t: '\\dfrac{2\\pi}{3}', sin: '\\dfrac{\\sqrt{3}}{2}', cos: '-\\dfrac{1}{2}', tan: '-\\sqrt{3}' }
        ];
        const c = Pick(cases);
        return {
          stem: `Let $\\theta=${c.t}$.`,
          parts: [
            { instr: 'Find $\\sin\\theta$.', marks: 1 },
            { instr: 'Find $\\cos\\theta$.', marks: 1 },
            { instr: 'Find $\\tan\\theta$.', marks: 2 },
            { instr: 'State the quadrant containing $\\theta$.', marks: 1 }
          ],
          answer: `$\\sin\\theta=${c.sin}$, $\\cos\\theta=${c.cos}$, $\\tan\\theta=${c.tan}$`,
          working: [
            `Use the unit circle and the reference angle for $${c.t}$.`,
            `$\\sin\\theta=${c.sin}$ and $\\cos\\theta=${c.cos}$.`,
            `$\\tan\\theta=\\dfrac{\\sin\\theta}{\\cos\\theta}=${c.tan}$.`
          ]
        };
      }
    },
    {
      id: 'trig-graph-section-b',
      syllabus: '3.7', topic: 3, section: 'B', paper: 'Mixed', difficulty: 'Challenge', marks: 9,
      questionType: 'Graph analysis', skills: ['amplitude', 'period', 'transformations', 'modeling'],
      title: 'Section B: trigonometric model',
      desc: 'Interpret and use a transformed sine model in context.',
      generate() {
        const A = Pick([2, 3, 4]);
        const b = Pick([2, 3]);
        const d = Pick([5, 6, 8]);
        const max = d + A;
        const min = d - A;
        const period = 2 * Math.PI / b;
        return {
          stem: `A periodic quantity is modelled by $h(t)=${A}\\sin(${b}t)+${d}$, where $t$ is measured in radians.`,
          parts: [
            { instr: 'State the amplitude and midline.', marks: 2 },
            { instr: 'Find the period.', marks: 2 },
            { instr: 'Find the maximum and minimum values of $h(t)$.', marks: 2 },
            { instr: 'Find the first positive value of $t$ for which $h(t)$ is maximum.', marks: 3 }
          ],
          answer: `(a) amplitude ${A}, midline $h=${d}$ (b) $\\dfrac{2\\pi}{${b}}$ (c) max ${max}, min ${min} (d) $t=${Fr(1, 2 * b)}\\pi$`,
          working: [
            `For $h(t)=a\\sin(bt)+d$, amplitude is $|a|=${A}$ and midline is $h=${d}$.`,
            `Period $=\\dfrac{2\\pi}{b}=\\dfrac{2\\pi}{${b}}=${F(period)}$.`,
            `Maximum $=${d}+${A}=${max}$ and minimum $=${d}-${A}=${min}$.`,
            `Sine is maximum when ${b}$t=\\dfrac{\\pi}{2}$.`,
            `Therefore $t=\\dfrac{\\pi}{${2 * b}}=${Fr(1, 2 * b)}\\pi$.`
          ]
        };
      }
    },
    {
      id: 'sampling-bias-method',
      syllabus: '4.1', topic: 4, section: 'B', paper: 'P2', difficulty: 'Core', marks: 5,
      questionType: 'Conceptual explanation', skills: ['sampling method', 'bias', 'reliability'],
      title: 'Sampling: method and bias',
      desc: 'Choose a sampling method and identify a likely source of bias.',
      generate() {
        const contexts = [
          {
            pop: 'all students in a school',
            bad: 'asking only students in the mathematics club',
            good: 'stratified sampling by year group'
          },
          {
            pop: 'all customers of a gym',
            bad: 'surveying only people who attend at 6 am',
            good: 'systematic sampling from the membership list'
          },
          {
            pop: 'all households in a town',
            bad: 'posting an optional online survey',
            good: 'random sampling from a household register'
          }
        ];
        const c = Pick(contexts);
        return {
          stem: `A researcher wants to estimate an opinion for ${c.pop}. They propose ${c.bad}.`,
          parts: [
            { instr: 'Identify a possible source of bias.', marks: 2 },
            { instr: 'Suggest a more reliable sampling method.', marks: 2 },
            { instr: 'Explain why your method is more reliable.', marks: 1 }
          ],
          answer: `The proposed method is biased because it under-represents part of the population. A better method is ${c.good}.`,
          working: [
            `The sample should represent ${c.pop}.`,
            `${c.bad} is likely to miss people with different habits or opinions.`,
            `${c.good} gives more of the population a planned chance of selection, improving reliability.`
          ]
        };
      }
    },
    {
      id: 'boxplot-outlier-iqr',
      syllabus: '4.2', syllabusRefs: ['4.2', '4.3'], topic: 4, section: 'A', paper: 'P2', difficulty: 'Core', marks: 7,
      questionType: 'Data display', skills: ['quartiles', 'IQR', 'outliers', 'box plots'],
      title: 'Box plot: quartiles and outlier fence',
      desc: 'Find quartiles, calculate the IQR and identify any outliers.',
      generate() {
        const data = Pick([
          [8, 10, 11, 12, 13, 14, 16, 18, 30],
          [21, 22, 24, 24, 25, 27, 29, 30, 44],
          [5, 7, 7, 8, 9, 11, 12, 13, 25]
        ]);
        const median = data[4];
        const q1 = (data[1] + data[2]) / 2;
        const q3 = (data[6] + data[7]) / 2;
        const iqr = q3 - q1;
        const upper = q3 + 1.5 * iqr;
        const outliers = data.filter(x => x > upper);
        return {
          stem: `The ordered data are $${data.join(',\\ ')}$.`,
          parts: [
            { instr: 'Find the median, $Q_1$ and $Q_3$.', marks: 3 },
            { instr: 'Find the interquartile range.', marks: 1 },
            { instr: 'Use the 1.5 IQR rule to identify any upper outliers.', marks: 3 }
          ],
          answer: `(a) median ${median}, $Q_1=${F(q1)}$, $Q_3=${F(q3)}$ (b) IQR ${F(iqr)} (c) ${outliers.length ? outliers.join(', ') : 'none'}`,
          working: [
            `There are 9 values, so the median is the 5th value: ${median}.`,
            `$Q_1=\\dfrac{${data[1]}+${data[2]}}{2}=${F(q1)}$ and $Q_3=\\dfrac{${data[6]}+${data[7]}}{2}=${F(q3)}$.`,
            `IQR $=${F(q3)}-${F(q1)}=${F(iqr)}$.`,
            `Upper fence $=Q_3+1.5\\text{IQR}=${F(q3)}+1.5(${F(iqr)})=${F(upper)}$.`,
            `${outliers.length ? `${outliers.join(', ')} is above the upper fence.` : 'No value is above the upper fence.'}`
          ]
        };
      }
    },
    {
      id: 'regression-prediction',
      syllabus: '4.4', topic: 4, section: 'A', paper: 'P2', difficulty: 'Core', marks: 6,
      questionType: 'Regression interpretation', skills: ['scatter diagrams', 'Pearson correlation', 'regression line'],
      title: 'Correlation and regression prediction',
      desc: 'Use a regression line for prediction and interpret correlation in context.',
      generate() {
        const m = Pick([1.8, 2.4, -1.5, -2.2]);
        const c = Pick([4, 10, 25]);
        const x = Pick([6, 8, 12]);
        const actual = m * x + c + Pick([-3, -2, 2, 4]);
        const pred = m * x + c;
        const residual = actual - pred;
        const r = m > 0 ? Pick([0.82, 0.88, 0.93]) : Pick([-0.81, -0.87, -0.92]);
        return {
          stem: `For a set of paired data, the regression line of $y$ on $x$ is $y=${m}x+${c}$. The correlation coefficient is $r=${r}$.`,
          parts: [
            { instr: `Use the regression line to predict $y$ when $x=${x}$.`, marks: 2 },
            { instr: `The actual value is ${F(actual)}. Find the residual.`, marks: 2 },
            { instr: 'Interpret the value of $r$.', marks: 2 }
          ],
          answer: `(a) ${F(pred)} (b) ${F(residual)} (c) ${r > 0 ? 'strong positive' : 'strong negative'} linear correlation`,
          working: [
            `(a) $y=${m}(${x})+${c}=${F(pred)}$.`,
            `(b) residual $=$ actual $-$ predicted $=${F(actual)}-${F(pred)}=${F(residual)}$.`,
            `(c) Since $r=${r}$ is close to ${r > 0 ? '1' : '-1'}, there is a strong ${r > 0 ? 'positive' : 'negative'} linear correlation.`
          ]
        };
      }
    },
    {
      id: 'expected-number-probability',
      syllabus: '4.5', topic: 4, section: 'A', paper: 'P2', difficulty: 'Core', marks: 5,
      questionType: 'Probability calculation', skills: ['expected number', 'complement', 'relative frequency'],
      title: 'Probability: expected numbers',
      desc: 'Use a probability to estimate expected counts and complementary outcomes.',
      generate() {
        const n = Pick([80, 120, 150, 200]);
        const p = Pick([0.15, 0.2, 0.35, 0.42]);
        const expected = n * p;
        return {
          stem: `A school estimates that the probability a randomly selected student walks to school is ${p}. There are ${n} students.`,
          parts: [
            { instr: 'Find the expected number of students who walk to school.', marks: 2 },
            { instr: 'Find the expected number who do not walk to school.', marks: 2 },
            { instr: 'State one assumption made in using this estimate.', marks: 1 }
          ],
          answer: `(a) ${F(expected)} students (b) ${F(n - expected)} students (c) The probability applies to this group of students.`,
          working: [
            `Expected number $=np=${n}(${p})=${F(expected)}$.`,
            `Complement probability $=1-${p}=${F(1 - p)}$.`,
            `Expected number not walking $=${n}(${F(1 - p)})=${F(n - expected)}$.`
          ]
        };
      }
    },
    {
      id: 'conditional-tree-section-b',
      syllabus: '4.6', topic: 4, section: 'B', paper: 'P2', difficulty: 'Exam', marks: 8,
      questionType: 'Probability tree', skills: ['conditional probability', 'tree diagrams', 'Bayes'],
      title: 'Section B: conditional probability tree',
      desc: 'Use a tree diagram to find a total probability and a reverse conditional probability.',
      generate() {
        const pD = Pick([0.04, 0.06, 0.08]);
        const sens = Pick([0.88, 0.9, 0.94]);
        const falsePos = Pick([0.05, 0.08, 0.1]);
        const pPos = pD * sens + (1 - pD) * falsePos;
        const posterior = pD * sens / pPos;
        return {
          stem: `A screening test is used for a condition. $P(D)=${pD}$, $P(+|D)=${sens}$ and $P(+|D')=${falsePos}$.`,
          parts: [
            { instr: 'Find the probability that a randomly selected person tests positive.', marks: 4 },
            { instr: 'Given that a person tests positive, find the probability they have the condition.', marks: 4 }
          ],
          answer: `(a) ${D3(pPos)} (b) ${D3(posterior)}`,
          working: [
            `$P(+)=P(D)P(+|D)+P(D')P(+|D')$.`,
            `$P(+)=${pD}(${sens})+${F(1 - pD)}(${falsePos})=${D3(pPos)}$.`,
            `$P(D|+)=\\dfrac{P(D)P(+|D)}{P(+)}=\\dfrac{${pD}(${sens})}{${D3(pPos)}}=${D3(posterior)}$.`
          ]
        };
      }
    },
    {
      id: 'venn-conditional-independence',
      syllabus: '4.6', topic: 4, section: 'A', paper: 'P2', difficulty: 'Exam', marks: 6,
      questionType: 'Venn probability', skills: ['conditional probability', 'independence', 'mutually exclusive'],
      title: 'Probability: Venn and independence',
      desc: 'Use intersection probabilities to test independence.',
      generate() {
        const pA = Pick([0.4, 0.5, 0.6]);
        const pB = Pick([0.3, 0.45, 0.5]);
        const independent = Pick([true, false]);
        const pAB = independent ? D3(pA * pB) : D3(pA * pB + Pick([0.04, -0.05]));
        const pAgivenB = pAB / pB;
        const union = pA + pB - pAB;
        return {
          stem: `For events $A$ and $B$, $P(A)=${pA}$, $P(B)=${pB}$ and $P(A\\cap B)=${pAB}$.`,
          parts: [
            { instr: 'Find $P(A\\cup B)$.', marks: 2 },
            { instr: 'Find $P(A|B)$.', marks: 2 },
            { instr: 'Determine whether $A$ and $B$ are independent.', marks: 2 }
          ],
          answer: `(a) ${D3(union)} (b) ${D3(pAgivenB)} (c) ${Math.abs(pAB - pA * pB) < 0.002 ? 'independent' : 'not independent'}`,
          working: [
            `$P(A\\cup B)=P(A)+P(B)-P(A\\cap B)=${pA}+${pB}-${pAB}=${D3(union)}$.`,
            `$P(A|B)=\\dfrac{P(A\\cap B)}{P(B)}=\\dfrac{${pAB}}{${pB}}=${D3(pAgivenB)}$.`,
            `$P(A)P(B)=${pA}(${pB})=${D3(pA * pB)}$.`,
            `${Math.abs(pAB - pA * pB) < 0.002 ? 'This equals $P(A\\cap B)$, so the events are independent.' : 'This does not equal $P(A\\cap B)$, so the events are not independent.'}`
          ]
        };
      }
    },
    {
      id: 'discrete-rv-unknown-k',
      syllabus: '4.7', topic: 4, section: 'B', paper: 'P2', difficulty: 'Exam', marks: 7,
      questionType: 'Distribution table', skills: ['discrete random variable', 'expected value'],
      title: 'Discrete random variable: unknown probability',
      desc: 'Find an unknown probability in a distribution and calculate the expected value.',
      generate() {
        const xs = [0, 1, 2, 3];
        const p1 = Pick([0.1, 0.15, 0.2]);
        const p2 = Pick([0.25, 0.3, 0.35]);
        const p3 = Pick([0.2, 0.25]);
        const k = D3(1 - p1 - p2 - p3);
        const probs = [p1, p2, k, p3];
        const ex = probs.reduce((s, p, i) => s + p * xs[i], 0);
        return {
          stem: `The random variable $X$ has distribution $P(X=0)=${p1}$, $P(X=1)=${p2}$, $P(X=2)=k$, $P(X=3)=${p3}$.`,
          parts: [
            { instr: 'Find $k$.', marks: 2 },
            { instr: 'Find $E(X)$.', marks: 3 },
            { instr: 'Interpret $E(X)$ in one sentence.', marks: 2 }
          ],
          answer: `(a) $k=${k}$ (b) $E(X)=${D3(ex)}$`,
          working: [
            `The probabilities must add to 1.`,
            `$${p1}+${p2}+k+${p3}=1$, so $k=${k}$.`,
            `$E(X)=0(${p1})+1(${p2})+2(${k})+3(${p3})=${D3(ex)}$.`,
            `The expected value is the long-run mean value of $X$.`
          ]
        };
      }
    },
    {
      id: 'binomial-normal-context-b',
      syllabus: '4.8', syllabusRefs: ['4.8', '4.9'], topic: 4, section: 'B', paper: 'P2', difficulty: 'Challenge', marks: 9,
      questionType: 'Distribution modeling', skills: ['binomial distribution', 'normal distribution', 'technology'],
      title: 'Section B: binomial and normal context',
      desc: 'Model one part with a binomial distribution and another with a normal distribution.',
      generate() {
        const n = Pick([12, 15, 20]);
        const p = Pick([0.25, 0.3, 0.4]);
        const k = Math.ceil(n * p);
        const binom = nCr(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
        const mu = Pick([50, 60, 70]);
        const sigma = Pick([6, 8, 10]);
        const x = mu + sigma;
        const z = (x - mu) / sigma;
        const probAbove = 1 - (typeof normalCDF === 'function' ? normalCDF(z) : 0.8413);
        return {
          stem: `A process has independent success probability ${p}. In a sample of ${n}, let $X$ be the number of successes. A related measurement $Y$ is normally distributed with mean ${mu} and standard deviation ${sigma}.`,
          parts: [
            { instr: `Find $P(X=${k})$.`, marks: 3 },
            { instr: `Find $P(Y>${x})$.`, marks: 3 },
            { instr: 'State one modelling assumption for $X$.', marks: 3 }
          ],
          answer: `(a) ${D3(binom)} (b) ${D3(probAbove)} (c) trials are independent with constant success probability`,
          working: [
            `$X\\sim B(${n},${p})$.`,
            `$P(X=${k})=\\binom{${n}}{${k}}(${p})^{${k}}(${F(1 - p)})^{${n - k}}=${D3(binom)}$.`,
            `For $Y$, $z=\\dfrac{${x}-${mu}}{${sigma}}=${D3(z)}$.`,
            `$P(Y>${x})=P(Z>${D3(z)})=${D3(probAbove)}$.`,
            `The binomial model requires independent trials and the same success probability each time.`
          ]
        };
      }
    },
    {
      id: 'increasing-decreasing-intervals',
      syllabus: '5.2', topic: 5, section: 'A', paper: 'P1', difficulty: 'Core', marks: 5,
      questionType: 'Derivative sign', skills: ['increasing functions', 'decreasing functions', 'stationary points'],
      title: 'Increasing and decreasing intervals',
      desc: 'Use the sign of the derivative to determine intervals of increase and decrease.',
      generate() {
        const a = Pick([-3, -2, -1]);
        const b = Pick([1, 2, 4]);
        return {
          stem: `A function $f$ has derivative $f'(x)=(x ${signed(-a)})(x ${signed(-b)})$.`,
          parts: [
            { instr: 'Find the stationary points in terms of their $x$-coordinates.', marks: 1 },
            { instr: 'State the intervals on which $f$ is increasing.', marks: 2 },
            { instr: 'State the intervals on which $f$ is decreasing.', marks: 2 }
          ],
          answer: `(a) $x=${a}, ${b}$ (b) $x<${a}$ and $x>${b}$ (c) ${a} $<x<$ ${b}`,
          working: [
            `Stationary points occur when $f'(x)=0$, so $x=${a}$ or $x=${b}$.`,
            `For a positive quadratic derivative, $f'(x)>0$ outside the roots and $f'(x)<0$ between the roots.`,
            `Therefore $f$ is increasing for $x<${a}$ and $x>${b}$.`,
            `It is decreasing for ${a} $<x<$ ${b}.`
          ]
        };
      }
    },
    {
      id: 'differentiate-polynomial-integer',
      syllabus: '5.3', topic: 5, section: 'A', paper: 'P1', difficulty: 'Core', marks: 5,
      questionType: 'Calculus routine', skills: ['power rule', 'polynomial derivative'],
      title: 'Differentiate polynomial powers',
      desc: 'Apply the power rule to a polynomial with integer powers.',
      generate() {
        const a = Pick([2, 3, -2]);
        const b = Pick([4, -5, 6]);
        const c = Pick([-3, 2, 5]);
        const x = Pick([1, 2, -1]);
        const derivative = `${4 * a}x^3 ${signed(3 * b)}x^2 ${signed(c)}`;
        const value = 4 * a * Math.pow(x, 3) + 3 * b * x * x + c;
        return {
          stem: `Let $f(x)=${a}x^4 ${signed(b)}x^3 ${signed(c)}x$.`,
          parts: [
            { instr: "Find $f'(x)$.", marks: 3 },
            { instr: `Find $f'(${x})$.`, marks: 2 }
          ],
          answer: `(a) $f'(x)=${derivative}$ (b) $f'(${x})=${value}$`,
          working: [
            `Use $\\dfrac{d}{dx}(x^n)=nx^{n-1}$.`,
            `$f'(x)=${4 * a}x^3 ${signed(3 * b)}x^2 ${signed(c)}$.`,
            `$f'(${x})=${4 * a}(${x})^3 ${signed(3 * b)}(${x})^2 ${signed(c)}=${value}$.`
          ]
        };
      }
    },
    {
      id: 'tangent-normal-line',
      syllabus: '5.4', topic: 5, section: 'B', paper: 'P1', difficulty: 'Exam', marks: 8,
      questionType: 'Tangent and normal', skills: ['derivative at a point', 'tangent', 'normal'],
      title: 'Tangent and normal to a curve',
      desc: 'Find tangent and normal equations at a point on a curve.',
      generate() {
        const a = Pick([1, 2]);
        const b = Pick([-4, -2, 3]);
        const c = Pick([1, 5]);
        const x0 = Pick([1, 2, 3]);
        const y0 = a * x0 * x0 + b * x0 + c;
        const m = 2 * a * x0 + b;
        const tangentC = y0 - m * x0;
        return {
          stem: `The curve $C$ has equation $y=${poly2(a, b, c)}$. Point $P$ on the curve has $x=${x0}$.`,
          parts: [
            { instr: 'Find the coordinates of $P$.', marks: 2 },
            { instr: 'Find the equation of the tangent at $P$.', marks: 3 },
            { instr: 'Find the equation of the normal at $P$.', marks: 3 }
          ],
          answer: `(a) $P(${x0},${y0})$ (b) $y=${m}x ${signed(tangentC)}$ (c) normal gradient $=-${Fr(1, m)}$`,
          working: [
            `$y=${a}(${x0})^2 ${signed(b)}(${x0}) ${signed(c)}=${y0}$, so $P(${x0},${y0})$.`,
            `$\\dfrac{dy}{dx}=${2 * a}x ${signed(b)}$.`,
            `At $x=${x0}$, tangent gradient $m=${m}$.`,
            `Tangent: $y-${y0}=${m}(x-${x0})$, so $y=${m}x ${signed(tangentC)}$.`,
            `Normal gradient is the negative reciprocal, $-${Fr(1, m)}$.`
          ]
        };
      }
    },
    {
      id: 'area-under-curve-basic',
      syllabus: '5.5', topic: 5, section: 'A', paper: 'P1', difficulty: 'Core', marks: 6,
      questionType: 'Definite integral', skills: ['integration', 'area under curve'],
      title: 'Area under a curve',
      desc: 'Evaluate a definite integral to find area between a curve and the x-axis.',
      generate() {
        const a = Pick([1, 2, 3]);
        const b = Pick([1, 2]);
        const upper = Pick([2, 3, 4]);
        const area = a * Math.pow(upper, 3) / 3 + b * upper;
        return {
          stem: `The curve $C$ has equation $y=${a}x^2+${b}$ for $0\\le x\\le ${upper}$.`,
          parts: [
            { instr: 'Write down an integral for the area between $C$ and the x-axis.', marks: 2 },
            { instr: 'Find this area.', marks: 4 }
          ],
          answer: `$\\displaystyle \\int_0^{${upper}}(${a}x^2+${b})\\,dx=${F(area)}$ square units`,
          working: [
            `The function is positive on the interval, so area is $\\int_0^{${upper}}(${a}x^2+${b})\\,dx$.`,
            `$\\int(${a}x^2+${b})\\,dx=${Fr(a, 3)}x^3+${b}x$.`,
            `Area $=\\left[${Fr(a, 3)}x^3+${b}x\\right]_0^{${upper}}=${F(area)}$.`
          ]
        };
      }
    },
    {
      id: 'second-derivative-classify',
      syllabus: '5.7', topic: 5, section: 'B', paper: 'P1', difficulty: 'Exam', marks: 8,
      questionType: 'Stationary point classification', skills: ['first derivative', 'second derivative', 'local extrema'],
      title: 'Second derivative: classify stationary points',
      desc: 'Find stationary points of a cubic and classify them using the second derivative.',
      generate() {
        const p = Pick([1, 2, 3]);
        const c = Pick([0, 4, -5]);
        const f0 = c;
        const x2 = 2 * p;
        const f2 = Math.pow(x2, 3) - 3 * p * x2 * x2 + c;
        return {
          stem: `Let $f(x)=x^3-${3 * p}x^2 ${signed(c)}$.`,
          parts: [
            { instr: 'Find the coordinates of the stationary points.', marks: 4 },
            { instr: 'Use the second derivative to classify each stationary point.', marks: 4 }
          ],
          answer: `Stationary points: $(0,${f0})$ local maximum and $(${x2},${f2})$ local minimum.`,
          working: [
            `$f'(x)=3x^2-${6 * p}x=3x(x-${2 * p})$.`,
            `So $f'(x)=0$ when $x=0$ or $x=${x2}$.`,
            `$f(0)=${f0}$ and $f(${x2})=${f2}$.`,
            `$f''(x)=6x-${6 * p}$.`,
            `$f''(0)=${-6 * p}<0$, so $(0,${f0})$ is a local maximum.`,
            `$f''(${x2})=${6 * p}>0$, so $(${x2},${f2})$ is a local minimum.`
          ]
        };
      }
    },
    {
      id: 'optimization-rectangle-section-b',
      syllabus: '5.7', topic: 5, section: 'B', paper: 'P1', difficulty: 'Challenge', marks: 9,
      questionType: 'Optimization', skills: ['modeling', 'derivative', 'maximum area'],
      title: 'Section B: optimization with a rectangle',
      desc: 'Build an area model and use calculus to maximize it.',
      generate() {
        const P = Pick([40, 48, 60, 72]);
        const half = P / 2;
        const x = half / 2;
        const maxArea = x * x;
        return {
          stem: `A rectangle has perimeter ${P} cm. One side has length $x$ cm.`,
          parts: [
            { instr: 'Show that the area can be written as $A(x)=x(' + half + '-x)$.', marks: 3 },
            { instr: 'Find the value of $x$ that gives the maximum area.', marks: 3 },
            { instr: 'Find the maximum area.', marks: 3 }
          ],
          answer: `(a) $A=x(${half}-x)$ (b) $x=${x}$ cm (c) ${maxArea} cm^2`,
          working: [
            `If the other side is $y$, then $2x+2y=${P}$, so $x+y=${half}$ and $y=${half}-x$.`,
            `Area $A=xy=x(${half}-x)=${half}x-x^2$.`,
            `$A'(x)=${half}-2x$.`,
            `Set $A'(x)=0$: ${half}$-2x=0$, so $x=${x}$.`,
            `$A''(x)=-2<0$, so this gives a maximum.`,
            `Maximum area $=${x}^2=${maxArea}$ cm^2.`
          ]
        };
      }
    },
    {
      id: 'reverse-chain-integral',
      syllabus: '5.10', topic: 5, section: 'B', paper: 'P1', difficulty: 'Exam', marks: 6,
      questionType: 'Integration technique', skills: ['reverse chain rule', 'indefinite integration'],
      title: 'Reverse chain rule integration',
      desc: 'Integrate a power of a linear expression using reverse chain rule.',
      generate() {
        const a = Pick([2, 3, 4]);
        const b = Pick([1, -5, 6]);
        const n = Pick([2, 3, 4]);
        const k = a * Pick([2, 3, 5]);
        const coeff = Fr(k, a * (n + 1));
        return {
          stem: `Find $\\displaystyle \\int ${k}(${a}x ${signed(b)})^{${n}}\\,dx$.`,
          parts: [{ instr: 'Give your answer in the form $A(ax+b)^m+C$.', marks: 6 }],
          answer: `$${coeff}(${a}x ${signed(b)})^{${n + 1}}+C$`,
          working: [
            `Let $u=${a}x ${signed(b)}$, so $\\dfrac{du}{dx}=${a}$.`,
            `Since the derivative of the bracket is ${a}, divide by ${a} after increasing the power.`,
            `$\\int ${k}(${a}x ${signed(b)})^{${n}}\\,dx=${coeff}(${a}x ${signed(b)})^{${n + 1}}+C$.`
          ]
        };
      }
    },
    {
      id: 'area-between-curves-section-b',
      syllabus: '5.11', topic: 5, section: 'B', paper: 'P1', difficulty: 'Exam', marks: 8,
      questionType: 'Area between curves', skills: ['intersection points', 'definite integral', 'area'],
      title: 'Section B: area between curves',
      desc: 'Find intersections and integrate the difference between two curves.',
      generate() {
        const m = Pick([3, 4, 5, 6]);
        const area = Math.pow(m, 3) / 6;
        return {
          stem: `The curves $y=x^2$ and $y=${m}x$ intersect at two points.`,
          parts: [
            { instr: 'Find the $x$-coordinates of the points of intersection.', marks: 2 },
            { instr: 'Find the area enclosed between the two curves.', marks: 6 }
          ],
          answer: `(a) $x=0$ and $x=${m}$ (b) $${F(area)}$ square units`,
          working: [
            `Set $x^2=${m}x$. Then $x(x-${m})=0$, so $x=0$ or $x=${m}$.`,
            `On $0\\le x\\le ${m}$, the line $y=${m}x$ is above $y=x^2$.`,
            `Area $=\\int_0^{${m}}(${m}x-x^2)\\,dx$.`,
            `$=\\left[${Fr(m, 2)}x^2-\\dfrac{x^3}{3}\\right]_0^{${m}}=${F(area)}$.`
          ]
        };
      }
    }
  ];

  function addExpandedTemplates() {
    const seen = new Set(PRACTICE_TEMPLATES.map(t => t.id));
    newTemplates.forEach(tmpl => {
      if (!seen.has(tmpl.id)) {
        PRACTICE_TEMPLATES.push(tmpl);
        seen.add(tmpl.id);
      }
    });
  }

  function applyEnhancedGenerators() {
    Object.entries(enhancedGeneratorFactories).forEach(([id, factory]) => {
      const tmpl = PRACTICE_TEMPLATES.find(item => item.id === id);
      if (!tmpl || tmpl._hasWeightedVariants) return;
      const variants = factory(tmpl.generate.bind(tmpl)).filter(Boolean);
      tmpl.variantMix = variants.map(variant => ({
        name: variant.name,
        weight: Math.max(1, variant.weight || 1)
      }));
      tmpl.generate = function () {
        return weightedChoice(variants).generate();
      };
      tmpl._hasWeightedVariants = true;
    });
  }

  function normalizeTemplates() {
    PRACTICE_TEMPLATES.forEach(tmpl => {
      Object.assign(tmpl, existingMeta[tmpl.id] || {}, tmpl);
      tmpl.topicName = tmpl.topicName || topicName(tmpl.topic);
      tmpl.section = tmpl.section || 'Mixed';
      tmpl.paper = tmpl.paper || 'Mixed';
      tmpl.difficulty = tmpl.difficulty || 'Core';
      tmpl.questionType = tmpl.questionType || 'Short response';
      tmpl.skills = Array.isArray(tmpl.skills) ? tmpl.skills : [];

      const prefixes = prefixesOf(tmpl);
      const prefixQuestions = questionsForPrefixes(prefixes);
      if (typeof TEMPLATE_MATCHES !== 'undefined' && !TEMPLATE_MATCHES[tmpl.id]) {
        TEMPLATE_MATCHES[tmpl.id] = prefixQuestions.map(toMatch);
      }
      const matches = typeof TEMPLATE_MATCHES !== 'undefined' ? (TEMPLATE_MATCHES[tmpl.id] || []) : [];
      if (typeof TEMPLATE_HEAT !== 'undefined' && !TEMPLATE_HEAT[tmpl.id]) {
        TEMPLATE_HEAT[tmpl.id] = heatFromMatches(matches.length ? matches : prefixQuestions.map(toMatch));
      }

      const fullMatches = matches.map(m => qById[m.id]).filter(Boolean);
      if (!tmpl.section || tmpl.section === 'Auto') tmpl.section = mostCommon(fullMatches.map(q => q.section), 'Mixed');
      if (!tmpl.paper || tmpl.paper === 'Auto') tmpl.paper = mostCommon(fullMatches.map(q => q.paper), 'Mixed');

      tmpl.frequency = typeof TEMPLATE_HEAT !== 'undefined' ? (TEMPLATE_HEAT[tmpl.id] || 0) : 0;
      tmpl.frequencyPct = totalSittings ? Math.round((tmpl.frequency / totalSittings) * 100) : 0;
      tmpl.matchCount = matches.length;
      tmpl.syllabusRefs = prefixes;
      tmpl.searchBlob = [
        tmpl.id,
        tmpl.title,
        tmpl.desc,
        tmpl.syllabus,
        tmpl.topicName,
        tmpl.section,
        tmpl.paper,
        tmpl.difficulty,
        tmpl.questionType,
        ...(tmpl.skills || [])
      ].join(' ').toLowerCase();
    });

    const groups = {};
    PRACTICE_TEMPLATES.forEach(tmpl => {
      const primary = prefixesOf(tmpl)[0] || String(tmpl.topic);
      if (!groups[primary]) groups[primary] = [];
      groups[primary].push(tmpl);
    });

    Object.entries(groups).forEach(([primary, group]) => {
      const historicalCount = Math.max(1, questionsForPrefixes([primary]).length);
      const rawWeights = group.map(tmpl => Math.max(1, tmpl.matchCount || tmpl.frequency || 1));
      const rawTotal = rawWeights.reduce((sum, weight) => sum + weight, 0);
      group.forEach((tmpl, index) => {
        tmpl.examWeight = Math.max(1, historicalCount * rawWeights[index] / rawTotal);
      });
    });
  }

  addExpandedTemplates();
  applyEnhancedGenerators();
  normalizeTemplates();
})();
