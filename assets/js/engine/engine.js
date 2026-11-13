/* Practice engine core: seeded random numbers, clean maths formatting, answer kinds, the generator
   registry, make(), mark(), variants() and worksheet(). Pure JavaScript: no DOM, no Math.random(),
   no dates. Runs in the browser from a plain <script> tag and under Node. Everything hangs off one
   global, globalThis.QBEngine. See docs/practice-engine.md. */
(function (root) {
  "use strict";
  const E = (root.QBEngine = root.QBEngine || {});
  E.version = 1;

  // Marks each level may carry, and whether a calculator is allowed. Level 3 is Paper 1 style
  // (no calculator); level 4 is Paper 2 style. Levels 0 to 2 say per generator.
  E.LEVELS = {
    0: { name: "Prior learning", marks: [1, 2] },
    1: { name: "Recall", marks: [1, 2] },
    2: { name: "Procedure", marks: [3, 4] },
    3: { name: "Paper 1 exam level", marks: [5, 7], calculator: false },
    4: { name: "Paper 2 exam level", marks: [5, 7] },
    5: { name: "Synoptic", marks: [8, 20] },
  };

  // ---- seeded random ---------------------------------------------------------------------
  function hash(str) {
    // xmur3: string -> 32-bit seed generator
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return function () {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return (h ^= h >>> 16) >>> 0;
    };
  }
  function rng(seed) {
    const s = hash(String(seed));
    let a = s(), b = s(), c = s(), d = s();
    const next = function () {
      // sfc32
      a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
      let t = (a + b) | 0;
      a = b ^ (b >>> 9);
      b = (c + (c << 3)) | 0;
      c = (c << 21) | (c >>> 11);
      d = (d + 1) | 0;
      t = (t + d) | 0;
      c = (c + t) | 0;
      return (t >>> 0) / 4294967296;
    };
    for (let i = 0; i < 12; i++) next();
    const r = {
      next,
      int(lo, hi) { return lo + Math.floor(next() * (hi - lo + 1)); },
      pick(arr) { return arr[Math.floor(next() * arr.length)]; },
      bool(p) { return next() < (p === undefined ? 0.5 : p); },
      sign() { return next() < 0.5 ? -1 : 1; },
      nonzero(lo, hi) { let v = 0; while (v === 0) v = r.int(lo, hi); return v; },
      shuffle(arr) {
        const a2 = arr.slice();
        for (let i = a2.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [a2[i], a2[j]] = [a2[j], a2[i]]; }
        return a2;
      },
      sample(arr, k) { return r.shuffle(arr).slice(0, k); },
    };
    return r;
  }
  E.rng = rng;
  E.hash = function (str) { return hash(String(str))(); };

  // ---- numbers and LaTeX ---------------------------------------------------------------------
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const isInt = Number.isInteger;
  function assertFinite(x) { if (typeof x !== "number" || !isFinite(x)) throw new Error("not a finite number: " + x); return x; }

  // Rational numbers {n, d}, always reduced with d > 0.
  function Q(n, d) {
    if (d === undefined) d = 1;
    if (n && typeof n === "object") { if (d === 1) return n; return Q(n.n, n.d * d); }
    if (!isInt(n) || !isInt(d) || d === 0) throw new Error(`bad fraction ${n}/${d}`);
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d) || 1;
    return { n: n / g, d: d / g };
  }
  const toQ = (x) => (typeof x === "number" ? (isInt(x) ? Q(x, 1) : null) : Array.isArray(x) ? Q(x[0], x[1]) : Q(x.n, x.d));
  const rat = {
    Q,
    add: (a, b) => { a = toQ(a); b = toQ(b); return Q(a.n * b.d + b.n * a.d, a.d * b.d); },
    sub: (a, b) => { a = toQ(a); b = toQ(b); return Q(a.n * b.d - b.n * a.d, a.d * b.d); },
    mul: (a, b) => { a = toQ(a); b = toQ(b); return Q(a.n * b.n, a.d * b.d); },
    div: (a, b) => { a = toQ(a); b = toQ(b); return Q(a.n * b.d, a.d * b.n); },
    neg: (a) => { a = toQ(a); return Q(-a.n, a.d); },
    num: (a) => { a = toQ(a); return a.n / a.d; },
    tex: (a) => { a = toQ(a); return frac(a.n, a.d); },
  };

  // A plain number: integers as they are, decimals trimmed, never "-0" or float noise.
  function num(x) {
    if (x && typeof x === "object") return rat.tex(x);
    assertFinite(x);
    if (Math.abs(x) < 1e-12) return "0";
    let s = isInt(x) ? String(x) : String(Number(x.toPrecision(10)));
    if (/e/i.test(s)) s = x.toFixed(12).replace(/0+$/, "").replace(/\.$/, "");
    return group(s);
  }
  // Thin spaces between thousands once a number has five or more digits before the point: 12\,500.
  function group(s) {
    const mt = /^(-?)(\d+)(\.\d+)?$/.exec(s);
    if (!mt || mt[2].length < 5) return s;
    return mt[1] + mt[2].replace(/\B(?=(\d{3})+(?!\d))/g, "\\,") + (mt[3] || "");
  }
  function roundSf(x, n) {
    assertFinite(x);
    if (x === 0) return 0;
    return Number(x.toPrecision(n === undefined ? 3 : n));
  }
  // To n significant figures, keeping trailing zeros (2.50), never exponent notation.
  function sf(x, n) {
    n = n === undefined ? 3 : n;
    assertFinite(x);
    const r = roundSf(x, n);
    if (r === 0) return "0";
    const e = Math.floor(Math.log10(Math.abs(r)));
    const dec = n - 1 - e;
    return group(dec > 0 ? r.toFixed(Math.min(dec, 20)) : String(Math.round(r)));
  }
  function dp(x, places) {
    assertFinite(x);
    const s = x.toFixed(places);
    return group(/^-0(\.0+)?$/.test(s) ? s.slice(1) : s);
  }
  // A reduced fraction; the sign goes in front, an integer stays an integer.
  function frac(n, d) {
    const q = Q(n, d === undefined ? 1 : d);
    if (q.d === 1) return String(q.n);
    return `${q.n < 0 ? "-" : ""}\\dfrac{${Math.abs(q.n)}}{${q.d}}`;
  }
  const isNeg = (c) => (typeof c === "number" ? c < 0 : c.n < 0);
  const isZero = (c) => (typeof c === "number" ? Math.abs(c) < 1e-12 : c.n === 0);
  const absTex = (c) => (typeof c === "number" ? num(Math.abs(c)) : frac(Math.abs(c.n), c.d));
  const isUnit = (c) => (typeof c === "number" ? Math.abs(Math.abs(c) - 1) < 1e-12 : Math.abs(c.n) === 1 && c.d === 1);
  const norm = (c) => (Array.isArray(c) ? Q(c[0], c[1]) : c);
  // A sum of terms [[coefficient, body], ...]: zero terms vanish, a coefficient of 1 is not
  // written, signs are folded into the joins. Coefficients are numbers, [n, d] or {n, d}.
  function expr(terms) {
    let out = "";
    for (const [c0, body] of terms) {
      const c = norm(c0);
      if (isZero(c)) continue;
      const mag = body && isUnit(c) ? body : absTex(c) + (body || "");
      if (!out) out = (isNeg(c) ? "-" : "") + mag;
      else out += (isNeg(c) ? " - " : " + ") + mag;
    }
    return out || "0";
  }
  const power = (v, n) => (n === 0 ? "" : n === 1 ? v : `${v}^{${n}}`);
  // poly([a, b, c]) is ax^2 + bx + c (highest power first).
  function poly(coeffs, v) {
    v = v || "x";
    const n = coeffs.length - 1;
    return expr(coeffs.map((c, i) => [c, power(v, n - i)]));
  }
  const lin = (a, b, v) => expr([[a, v || "x"], [b, ""]]);
  // "+ 3" or "- 3", for joining onto something already written. Zero gives "".
  function signed(c) {
    c = norm(c);
    if (isZero(c)) return "";
    return (isNeg(c) ? "- " : "+ ") + absTex(c);
  }
  // A coefficient times a body: coef(1, "x") = "x", coef(-1, "x") = "-x", coef(0, "x") = "0".
  function coef(c, body) { return expr([[c, body]]); }
  // Brackets round a negative value, for substitution lines: 2(-3)^2.
  function paren(c) {
    c = norm(c);
    const s = typeof c === "number" ? num(c) : rat.tex(c);
    return isNeg(c) ? wrap(s) : s;
  }
  // Brackets that grow round tall content: (3) but \left(\dfrac{1}{2}\right).
  const wrap = (s) => (/frac|\^\{|sqrt/.test(s) ? `\\left(${s}\\right)` : `(${s})`);
  // Brackets always: br(3) = (3), br(-3) = (-3). Use it wherever a value is multiplied by what
  // comes before it, so 2 and 4 give 2(4), never 24.
  function br(c) {
    c = norm(c);
    return wrap(typeof c === "number" ? num(c) : rat.tex(c));
  }
  // (x - 3) or (x + 3): the factor with root r.
  const factor = (r, v) => (isZero(norm(r)) ? v || "x" : wrap(lin(1, typeof r === "number" ? -r : rat.neg(r), v)));
  const point = (x, y) => wrap(`${typeof x === "string" ? x : num(x)},\\, ${typeof y === "string" ? y : num(y)}`);
  // A quantity with its unit, inside maths: unit(12, "cm") = 12\text{ cm}; deg(40) = 40^\circ.
  const unit = (x, u) => `${typeof x === "string" ? x : num(x)}\\text{ ${u}}`;
  const deg = (x) => `${typeof x === "string" ? x : num(x)}^\\circ`;
  const pct = (x) => `${typeof x === "string" ? x : num(x)}\\%`;
  // sqrt(n) simplified: surd(12) = 2\sqrt{3}, surd(9) = 3.
  function sqrtParts(n) {
    if (!isInt(n) || n < 0) throw new Error("surd of " + n);
    let out = 1, inn = n;
    for (let k = 2; k * k <= inn; k++) while (inn % (k * k) === 0) { inn /= k * k; out *= k; }
    return { out, in: inn };
  }
  function surd(n, mult) {
    const p = sqrtParts(n);
    const k = p.out * (mult === undefined ? 1 : mult);
    if (p.in === 1 || k === 0) return num(p.in === 1 ? k : 0);
    return coef(k, `\\sqrt{${p.in}}`);
  }
  // A multiple of pi: piFrac(5, 6) = \dfrac{5\pi}{6}.
  function piFrac(n, d) {
    const q = Q(n, d === undefined ? 1 : d);
    if (q.n === 0) return "0";
    const top = (Math.abs(q.n) === 1 ? "" : Math.abs(q.n)) + "\\pi";
    return (q.n < 0 ? "-" : "") + (q.d === 1 ? top : `\\dfrac{${top}}{${q.d}}`);
  }
  // Thousands separated by thin spaces, for use inside maths: 12\,500.
  const thousands = (x, places) => (places ? dp(x, places) : num(Math.round(x)));
  const list = (items, and) => (items.length < 2 ? items.join("") : items.slice(0, -1).join(", ") + ` ${and || "and"} ` + items[items.length - 1]);
  const m = (s) => `$${s}$`;

  E.fmt = { gcd, Q, rat, num, sf, dp, roundSf, frac, expr, poly, lin, signed, coef, paren, br, factor, point, sqrtParts, surd, piFrac, thousands, list, m, power, wrap, unit, deg, pct, group };

  // ---- answers ---------------------------------------------------------------------
  const letters = "ABCDEFGH";
  function normOption(o) { return typeof o === "string" ? { text: o } : o; }
  function buildOptions(r, correct, wrongs, n) {
    correct = normOption(correct);
    const seen = new Set([correct.text]);
    const pool = [];
    for (const w0 of wrongs) {
      const w = normOption(w0);
      if (w == null || w.text == null || seen.has(w.text)) continue;
      seen.add(w.text);
      pool.push(w);
      if (pool.length === (n || 4) - 1) break;
    }
    if (pool.length < 2) throw new Error("a choice needs at least two distinct wrong options");
    const all = r.shuffle([Object.assign({ right: true }, correct)].concat(pool));
    return all;
  }
  E.ans = {
    // An exact integer.
    int(v, extra) {
      if (!isInt(v)) throw new Error("ans.int needs an integer, got " + v);
      return Object.assign({ kind: "number", value: v === 0 ? 0 : v, tolerance: 0, display: m(num(v)) }, extra);
    },
    // An exact fraction n/d. A decimal correct to 3 s.f. is accepted too.
    frac(n, d, extra) {
      const q = Q(n, d);
      if (q.d === 1) return E.ans.int(q.n, extra);
      return Object.assign({ kind: "number", value: q.n / q.d, sigfigs: 3, exact: true, display: m(frac(q.n, q.d)) }, extra);
    },
    // An exact terminating decimal such as 0.35 or 2.5.
    dec(v, extra) {
      assertFinite(v);
      if (isInt(v)) return E.ans.int(v, extra);
      const s = String(Number(v.toPrecision(10)));
      const places = (s.split(".")[1] || "").length;
      return Object.assign({ kind: "number", value: Number(s), tolerance: 0.5 * Math.pow(10, -places - 2), exact: true, display: m(num(v)) }, extra);
    },
    // An exact value with its own LaTeX (surds, logs, multiples of pi). Decimals to 3 s.f. accepted.
    exact(v, tex, extra) {
      return Object.assign({ kind: "number", value: assertFinite(v), sigfigs: 3, exact: true, display: m(tex) }, extra);
    },
    // A calculator answer, shown and marked to n significant figures (3 unless told otherwise).
    sf(v, n, extra) {
      n = n || 3;
      return Object.assign({ kind: "number", value: assertFinite(v), sigfigs: n, display: m(sf(v, n)) }, extra);
    },
    // A value rounded to a number of decimal places (money, "nearest whole number").
    dp(v, places, extra) {
      const r = Number(assertFinite(v).toFixed(places));
      return Object.assign({ kind: "number", value: r, tolerance: 0.5 * Math.pow(10, -places) * 1.0000001, display: m(dp(r, places)) }, extra);
    },
    // Multiple choice. correct and wrongs are strings or {text, value, why}; the first n - 1
    // distinct wrong options are kept and everything is shuffled with the question's own rng.
    choice(r, correct, wrongs, n, extra) {
      const all = buildOptions(r, correct, wrongs, n);
      return Object.assign({
        kind: "choice", options: all.map((o) => o.text), correct: all.findIndex((o) => o.right),
        values: all.map((o) => (o.value === undefined ? null : o.value)),
        misconceptions: all.map((o) => o.why || null),
      }, extra);
    },
    // Pick the graph. correct and wrongs are {graph, why?, value?}; options[] holds graph descriptions.
    graph(r, correct, wrongs, n, extra) {
      const tag = (o, i) => ({ text: "g" + i, graph: o.graph || o, why: o.why, value: o.value });
      const all = buildOptions(r, tag(correct, 0), wrongs.map((w, i) => tag(w, i + 1)), n);
      return Object.assign({
        kind: "graph", options: all.map((o) => o.graph), correct: all.findIndex((o) => o.right),
        values: all.map((o) => (o.value === undefined ? null : o.value)),
        misconceptions: all.map((o) => o.why || null),
      }, extra);
    },
    // Self-marked against a model answer.
    self(display, extra) { return Object.assign({ kind: "self", display: display }, extra); },
  };

  // What a student may type for a number: 3, -2.5, 3/4, "1,5", a leading unicode minus.
  function parseNumber(v) {
    if (typeof v === "number") return v;
    if (typeof v !== "string") return NaN;
    let s = v.trim().replace(/[−–]/g, "-").replace(/\s+/g, "");
    if (/^-?\d+,\d+$/.test(s)) s = s.replace(",", ".");
    if (/^[-+]?(\d+\.?\d*|\.\d+)$/.test(s)) return Number(s);
    const f = /^([-+]?(?:\d+\.?\d*|\.\d+))\/([-+]?(?:\d+\.?\d*|\.\d+))$/.exec(s);
    if (f && Number(f[2]) !== 0) return Number(f[1]) / Number(f[2]);
    return NaN;
  }
  // The widest error a number answer forgives.
  function toleranceOf(a) {
    if (a.sigfigs) {
      if (a.value === 0) return 1e-9;
      const e = Math.floor(Math.log10(Math.abs(Number(a.value.toPrecision(a.sigfigs)))));
      return 0.5 * Math.pow(10, e - a.sigfigs + 1) * 1.0000001;
    }
    return (a.tolerance || 0) + 1e-9 * Math.max(1, Math.abs(a.value));
  }
  E.parseNumber = parseNumber;
  E.toleranceOf = toleranceOf;

  E.mark = function (question, partLabel, response) {
    const part = question.parts.find((p) => p.label === partLabel);
    if (!part) throw new Error(`no part "${partLabel}" in ${question.id}`);
    const a = part.answer;
    if (a.kind === "number") {
      const r = parseNumber(response);
      const out = { correct: false, expected: a.display };
      if (!isFinite(r)) { out.invalid = true; return out; }
      out.correct = Math.abs(r - a.value) <= toleranceOf(a);
      if (!out.correct && a.misconceptions) {
        const hit = a.misconceptions.find((mc) => Math.abs(r - mc.value) <= toleranceOf(Object.assign({}, a, { value: mc.value })));
        if (hit) out.misconception = hit.text;
      }
      return out;
    }
    if (a.kind === "choice" || a.kind === "graph") {
      let i = typeof response === "number" ? response : a.kind === "choice" ? a.options.indexOf(response) : letters.indexOf(String(response).toUpperCase());
      const out = { correct: i === a.correct, expectedIndex: a.correct, expected: a.kind === "choice" ? a.options[a.correct] : "Graph " + letters[a.correct] };
      if (!(i >= 0 && i < a.options.length)) out.invalid = true;
      else if (!out.correct && a.misconceptions && a.misconceptions[i]) out.misconception = a.misconceptions[i];
      return out;
    }
    // Self-marked: the student says whether their work matches the worked solution.
    return { correct: response === true || response === "correct" || response === 1, expected: a.display, selfMarked: true };
  };

  // ---- registry ---------------------------------------------------------------------
  E.registry = E.registry || [];
  const byId = (E._byId = E._byId || new Map());
  const REQUIRED = ["type", "unknown", "representation", "format", "levels", "syllabus", "skills", "build"];
  // Registers one generator. See docs/practice-engine.md for the fields.
  E.register = function (def) {
    for (const k of REQUIRED) if (def[k] === undefined) throw new Error(`generator ${def.id || def.type}: missing ${k}`);
    const g = Object.assign({ courses: ["aa-sl"], calculator: false }, def);
    g.id = def.id || `${g.type}/${g.unknown}/${g.representation}`;
    if (byId.has(g.id)) throw new Error(`generator ${g.id} is registered twice`);
    if (!Array.isArray(g.levels) || !g.levels.length || g.levels.some((l) => !E.LEVELS[l])) throw new Error(`generator ${g.id}: bad levels`);
    if (!g.syllabus.length) throw new Error(`generator ${g.id}: needs a syllabus code`);
    g.levels = g.levels.slice().sort();
    byId.set(g.id, g);
    E.registry.push(g);
    return g;
  };
  // Registers several generators that share fields: registerAll({syllabus, skills, ...}, [defs]).
  E.registerAll = function (shared, defs) { return defs.map((d) => E.register(Object.assign({}, shared, d))); };
  E.generator = (id) => byId.get(id);
  const calcOf = (g, level) => (typeof g.calculator === "function" ? Boolean(g.calculator(level)) : Boolean(g.calculator));
  // The public description of a generator.
  function describe(g) {
    return { id: g.id, type: g.type, unknown: g.unknown, representation: g.representation, format: g.format, title: g.title || g.unknown,
      courses: g.courses.slice(), levels: g.levels.slice(), syllabus: g.syllabus.slice(), skills: g.skills.slice(),
      calculator: Object.fromEntries(g.levels.map((l) => [l, calcOf(g, l)])), source: g.source || null, situation: g.situationKey || null };
  }
  // Generators matching a filter {course, type, unknown, representation, format, level, syllabus, skill, primary}.
  // syllabus matches any of the generator's codes unless primary is true (then only its first).
  function find(f) {
    f = f || {};
    return E.registry.filter((g) =>
      (!f.course || g.courses.includes(f.course)) &&
      (!f.type || g.type === f.type) &&
      (!f.unknown || g.unknown === f.unknown) &&
      (!f.representation || g.representation === f.representation) &&
      (!f.format || g.format === f.format) &&
      (f.level === undefined || f.level === null || g.levels.includes(f.level)) &&
      (!f.syllabus || (f.primary ? g.syllabus[0] === f.syllabus : g.syllabus.includes(f.syllabus))) &&
      (!f.skill || g.skills.includes(f.skill)));
  }
  E.generators = (f) => find(f).map(describe);
  // Levels with at least one generator, per syllabus code (first code of each generator).
  E.coverage = function (course) {
    const out = {};
    for (const g of find({ course })) {
      const c = (out[g.syllabus[0]] = out[g.syllabus[0]] || { levels: [], generators: [], types: [] });
      for (const l of g.levels) if (!c.levels.includes(l)) c.levels.push(l);
      c.generators.push(g.id);
      if (!c.types.includes(g.type)) c.types.push(g.type);
      c.levels.sort();
    }
    return out;
  };

  // ---- make ---------------------------------------------------------------------
  const DEFAULT_COURSE = "aa-sl";
  E.make = function (req) {
    req = req || {};
    const course = req.course || DEFAULT_COURSE;
    const seed = req.seed === undefined || req.seed === null ? 0 : req.seed;
    let g;
    if (req.generator) {
      g = byId.get(req.generator);
      if (!g) throw new Error(`no generator ${req.generator}`);
    } else {
      if (!req.type) throw new Error("make() needs a type");
      const found = find({ course, type: req.type, unknown: req.unknown, representation: req.representation, format: req.format, level: req.level })
        .sort((x, y) => (x.id < y.id ? -1 : 1));
      if (!found.length) throw new Error(`no generator for ${JSON.stringify({ course, type: req.type, unknown: req.unknown, representation: req.representation, level: req.level, format: req.format })}`);
      g = found[E.hash(`pick|${req.type}|${seed}`) % found.length];
    }
    let level = req.level;
    if (level === undefined || level === null) level = g.levels[E.hash(`level|${g.id}|${seed}`) % g.levels.length];
    if (!g.levels.includes(level)) throw new Error(`generator ${g.id} has no level ${level}`);
    const ctx = { rng: rng(`${g.id}|L${level}|${seed}`), level, course, seed };
    // Generators that share a situationKey get the same numbers for the same seed, so "ask it
    // another way" keeps the situation and changes only what is asked.
    if (g.situation) ctx.sit = g.situation(rng(`${g.type}|${g.situationKey || g.id}|${seed}`), level, course);
    const built = g.build(ctx);
    if (!built || !Array.isArray(built.parts) || !built.parts.length) throw new Error(`generator ${g.id} returned no parts`);
    const request = { course, type: g.type, unknown: g.unknown, representation: g.representation, level, format: g.format, seed };
    const parts = built.parts.map((p, i) => ({
      label: p.label || "abcdefgh"[i], prompt: p.prompt, marks: p.marks, answer: p.answer, working: p.working || [],
    }));
    const q = {
      id: [course, g.type, g.unknown, g.representation, "L" + level, g.format, seed].join(":"),
      generator: g.id, course, type: g.type, unknown: g.unknown, representation: g.representation, format: g.format,
      title: g.title || g.unknown, syllabus: g.syllabus.slice(), skills: g.skills.slice(), level,
      calculator: built.calculator === undefined ? calcOf(g, level) : Boolean(built.calculator),
      marks: parts.reduce((s, p) => s + p.marks, 0), seed, request,
      stem: built.stem || "", parts,
    };
    if (built.table) q.table = built.table;
    if (built.graph) q.graph = built.graph;
    if (built.params || ctx.sit) q.params = Object.assign(ctx.sit ? { sit: ctx.sit } : {}, built.params);
    return q;
  };

  // Other ways to ask the same thing: every other generator of the same type, as ready requests
  // with the same seed. sameSituation is true when the numbers will be the same too.
  E.variants = function (question) {
    const me = byId.get(question.generator);
    return find({ course: question.course, type: question.type })
      .filter((g) => g.id !== question.generator)
      .map((g) => {
        const level = g.levels.reduce((best, l) => (Math.abs(l - question.level) < Math.abs(best - question.level) ? l : best), g.levels[0]);
        return {
          generator: g.id, unknown: g.unknown, representation: g.representation, format: g.format, title: g.title || g.unknown, level,
          sameSituation: Boolean(me && g.situationKey && g.situationKey === me.situationKey),
          request: { course: question.course, type: g.type, unknown: g.unknown, representation: g.representation, level, format: g.format, seed: question.seed },
        };
      });
  };

  // A short fingerprint of what the student sees, to spot the same question under two seeds.
  E.signature = (q) => String(E.hash(q.stem + "|" + q.parts.map((p) => p.prompt + "=" + (p.answer.display || p.answer.correct)).join("|")));

  // ---- worksheet ---------------------------------------------------------------------
  // A fixed set of questions for printing. opts: {course, scope: [codes], count, levels: {2: 1, 3: 1}
  // (relative weights), seed, real: {code: [{id, marks}]}}. Codes with no generator at any wanted
  // level give real question IDs instead (when real is passed). Same options, same worksheet.
  E.worksheet = function (opts) {
    const course = opts.course || DEFAULT_COURSE;
    const r = rng(`worksheet|${opts.seed === undefined ? 0 : opts.seed}`);
    const weights = opts.levels || { 2: 1, 3: 1 };
    const wanted = Object.keys(weights).map(Number).filter((l) => weights[l] > 0);
    const count = opts.count || 10;
    const items = [];
    const seen = new Set();
    const realUsed = {};
    let lastType = null;
    for (let i = 0, guard = 0; items.length < count && guard < count * 20; i++, guard++) {
      const code = opts.scope[i % opts.scope.length];
      const pool = find({ course, syllabus: code, primary: true }).filter((g) => g.levels.some((l) => wanted.includes(l)));
      if (!pool.length) {
        const list2 = (opts.real && opts.real[code]) || [];
        const k = (realUsed[code] = (realUsed[code] || 0) + 1) - 1;
        if (k < list2.length) items.push({ kind: "real", code, questionId: list2[k].id, marks: list2[k].marks });
        else if (opts.scope.every((c) => !find({ course, syllabus: c, primary: true }).length && (realUsed[c] || 0) >= ((opts.real && opts.real[c]) || []).length)) break;
        continue;
      }
      let cands = pool.filter((g) => g.type !== lastType);
      if (!cands.length) cands = pool;
      const g = r.pick(cands);
      const levels = g.levels.filter((l) => wanted.includes(l));
      const total = levels.reduce((s, l) => s + weights[l], 0);
      let roll = r.next() * total, level = levels[0];
      for (const l of levels) { roll -= weights[l]; if (roll < 0) { level = l; break; } }
      let q = null;
      for (let t = 0; t < 8 && !q; t++) {
        const cand = E.make({ course, generator: g.id, level, seed: `ws-${opts.seed === undefined ? 0 : opts.seed}-${i}-${t}` });
        if (!seen.has(E.signature(cand))) q = cand;
      }
      if (!q) continue;
      seen.add(E.signature(q));
      lastType = g.type;
      items.push({ kind: "generated", code, question: q });
    }
    return { course, scope: opts.scope.slice(), seed: opts.seed === undefined ? 0 : opts.seed, items,
      marks: items.reduce((s, it) => s + (it.kind === "generated" ? it.question.marks : it.marks || 0), 0) };
  };

  // ---- text checks ---------------------------------------------------------------------
  // Splits a string into plain text and maths. Inline maths is $...$; "\$" is a literal dollar.
  E.segments = function (str) {
    const out = [];
    let buf = "", inMath = false;
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      if (ch === "\\" && str[i + 1] === "$") { buf += inMath ? "\\$" : "$"; i++; continue; }
      if (ch === "$") { out.push({ math: inMath, text: buf }); buf = ""; inMath = !inMath; continue; }
      buf += ch;
    }
    out.push({ math: inMath, text: buf, unclosed: inMath });
    return out.filter((s) => s.text !== "" || s.unclosed);
  };
  // Problems in one string: number quality and the notation standard (docs/practice-engine.md).
  // strict also refuses unsimplified fractions (used for everything a student reads before the
  // worked solution; working lines may show a fraction before reducing it).
  const WRAPPED = /\\(text|mathrm|mathbb|mathbf|operatorname)\{[^{}]*\}/g;
  E.lintText = function (str, strict) {
    const bad = [];
    if (typeof str !== "string") return ["not a string: " + str];
    if (/NaN|undefined|Infinity|\[object|\bnull\b/.test(str)) bad.push("NaN/undefined/Infinity/null");
    if (/\d\.\d{9,}/.test(str)) bad.push("float noise");
    for (const seg of E.segments(str)) {
      if (seg.unclosed) { bad.push("unclosed $"); continue; }
      const t = seg.text;
      if (!seg.math) {
        // Prose: every number, variable and expression belongs inside $...$.
        if (/[\\^{}_=<>*|~]/.test(t)) bad.push("maths characters outside $...$: " + t.trim().slice(0, 30));
        if (/\d/.test(t)) bad.push("a number outside $...$: " + t.trim().slice(0, 30));
        if (/[°²³¹⁰-₟×÷−≤≥≠α-ω√∞±%]/.test(t)) bad.push("a maths symbol outside $...$: " + t.trim().slice(0, 30));
        if (/\b(sqrt|pi|theta|nCr|sin|cos|tan|ln|log)\b/.test(t)) bad.push("a maths name outside $...$: " + t.trim().slice(0, 30));
        if (/(^|[\s(])[a-zA-Z]\([a-zA-Z]\)/.test(t)) bad.push("function notation outside $...$: " + t.trim().slice(0, 30));
        continue;
      }
      if (!t.trim()) { bad.push("empty maths"); continue; }
      let depth = 0;
      for (const ch of t.replace(/\\[{}]/g, "")) { if (ch === "{") depth++; else if (ch === "}") depth--; if (depth < 0) break; }
      if (depth !== 0) bad.push("unbalanced braces");
      if ((t.match(/\\left\b/g) || []).length !== (t.match(/\\right\b/g) || []).length) bad.push("unbalanced \\left/\\right");
      const bare = t.replace(WRAPPED, "\u2022");           // maths with \text{...}, \mathrm{...} taken out
      const names = bare.replace(/\\(begin|end)\{[a-z*]+\}/g, " ").replace(/\\[a-zA-Z]+/g, " "); // ... and with every command taken out
      if (/\+\s*-|-\s*-|\+\s*\+|-\s*\+/.test(t.replace(/\\pm|\\mp/g, "±"))) bad.push("doubled sign");
      if (/(^|[^\d.])-0(?![\d.])/.test(t) || /-0\.0+(?!\d)/.test(t)) bad.push("-0");
      if (/(^|[^\d.,_^\\a-zA-Z])1(?=[a-zA-Z]|\\(pi|sqrt|sin|cos|tan|ln|log|theta|dfrac|frac|left\()(?![a-zA-Z]))/.test(bare)) bad.push("1x");
      if (/(^|[^\d.,_^\\a-zA-Z])0[a-zA-Z]/.test(bare)) bad.push("0x");
      if (/(?<!_\{[^{}]*\})(\^\{1\}|\^1(?![\d.]))/.test(t)) bad.push("power of 1"); // an upper limit of 1 is fine
      if (/\{\s*\}/.test(bare)) bad.push("empty group");
      // notation
      if (/\*/.test(t)) bad.push("* for multiplication (use \\times)");
      if (/<=|>=|!=|=<|=>/.test(t)) bad.push("<= style relation (use \\le, \\ge, \\ne)");
      if (/\d\s*\/\s*\d|[a-zA-Z)}]\s*\/\s*[a-zA-Z({\d]/.test(names)) bad.push("a/b (use \\dfrac)");
      if (/[a-zA-Z]{3,}/.test(names)) bad.push("words or unbackslashed names in maths: " + (/[a-zA-Z]{3,}/.exec(names) || [""])[0]);
      if (/(^|[^a-zA-Z])(ln|pi|cm|km|kg|mm|nm)(?![a-zA-Z])/.test(names)) bad.push("unbackslashed ln/pi or a bare unit (use \\ln, \\pi, \\text{ cm})");
      if (/(^|[^\d])\.\d/.test(t)) bad.push("decimal without a leading zero");
      if (/(^|[^\d.])\d{5,}/.test(t)) bad.push("long number without \\, between thousands");
      if (/[°²³×−≤≥±π]/.test(t)) bad.push("Unicode maths symbol (use a LaTeX command)");
      if (/\\int/.test(t) && !/\\mathrm\{d\}/.test(t)) bad.push("integral without \\mathrm{d}x");
      if (/\\int(?!_\{[^{}]*\}\^\{)(?=_)/.test(t) || /\\int\^/.test(t)) bad.push("integral limits must be \\int_{a}^{b}");
      if (/\\d?frac\{d[a-zA-Z]?\}\{d[a-zA-Z]\}/.test(t)) bad.push("derivative without \\mathrm{d}");
      if (/(^|[^a-zA-Z\\{])(P|E|Var)\(/.test(bare)) bad.push("P(...), E(...), Var(...) must be \\mathrm{P}, \\mathrm{E}, \\mathrm{Var}");
      if (/\\sim\s*[NB]\s*\(/.test(bare)) bad.push("distribution must be \\mathrm{N}(...) or \\mathrm{B}(...)");
      if (/\\mathrm\{P\}\([^)]*\|/.test(t)) bad.push("conditional bar must be \\mid");
      if (/(^|[^a-zA-Z\\])e\^/.test(bare)) bad.push("e^{x} must be \\mathrm{e}^{x}");
      if (/\\[dt]?frac\{[^{}]*\\[dt]?frac/.test(t) || /\\[dt]?frac\{[^{}]*\}\{[^{}]*\\[dt]?frac/.test(t)) bad.push("nested fraction");
      if (/(^|[^t])\(([^()]*)\\[dt]?frac[^()]*\)/.test(t.replace(/\\left\(/g, "t[").replace(/\\right\)/g, "]"))) bad.push("tall content needs \\left( \\right)");
      if (/_[a-zA-Z\d]{2,}|\^[a-zA-Z\d]{2,}/.test(names.replace(/[{}]/g, (c) => c))) bad.push("subscript or power needs braces");
      const re = /\\[dt]?frac\{(-?\d+)\}\{(-?\d+)\}/g;
      let f;
      while ((f = re.exec(t))) {
        const n = Number(f[1]), d = Number(f[2]);
        if (d === 0) bad.push("fraction over 0");
        else if (strict && (d === 1 || d < 0 || n === 0 || gcd(n, d) !== 1)) bad.push(`unsimplified fraction ${n}/${d}`);
      }
    }
    return bad;
  };
  // Every string of a question with where it sits: [{where, text, strict}].
  E.strings = function (q) {
    const out = [{ where: "stem", text: q.stem, strict: true }];
    if (q.table) {
      (q.table.head || []).forEach((c, i) => out.push({ where: `table.head[${i}]`, text: c, strict: true }));
      (q.table.rows || []).forEach((row, i) => row.forEach((c, j) => out.push({ where: `table.rows[${i}][${j}]`, text: c, strict: true })));
    }
    for (const p of q.parts) {
      out.push({ where: `(${p.label}) prompt`, text: p.prompt, strict: true });
      if (p.answer.display !== undefined) out.push({ where: `(${p.label}) answer`, text: p.answer.display, strict: true });
      if (p.answer.unit) out.push({ where: `(${p.label}) unit`, text: p.answer.unit, strict: true });
      if (p.answer.kind === "choice") p.answer.options.forEach((o, i) => out.push({ where: `(${p.label}) option ${i}`, text: o, strict: true }));
      for (const mc of p.answer.misconceptions || []) if (mc) out.push({ where: `(${p.label}) misconception`, text: typeof mc === "string" ? mc : mc.text, strict: false });
      p.working.forEach((w, i) => out.push({ where: `(${p.label}) working[${i}]`, text: w, strict: false }));
    }
    return out;
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
