#!/usr/bin/env node
// Automated checks for the practice engine. Exits non-zero on any failure.
//
//   node scripts/check-engine.mjs [--seeds 300] [--only <text in generator id>] [--verbose]
//
// For every generator, every level it offers, and --seeds seeds (300 unless told otherwise):
//   1 deterministic      the same request and seed give an identical question
//   2 verified           each answer is recomputed by the generator's independent verifier in
//                        scripts/engine-checks/topicN.mjs (a generator with no verifier fails)
//   3 number quality     no NaN, undefined, Infinity, -0, "+ -", "1x", unsimplified fractions;
//                        no-calculator answers exact, calculator answers to 3 s.f. and not all "nice"
//   4 constraints        the verifier's require() conditions hold
//   5 renders            every string passes KaTeX with errors thrown
//   6 marking            mark() accepts the stored answer, rejects wrong ones; options distinct
//   7 marks              part marks sum to the question's marks and fit the level's range
//   8 graphs             every graph and figure gives SVG with finite coordinates inside the view box;
//                        figures are sound, with every label drawn clear of the lines; shaded regions show;
//                        wrong graph options differ visibly from the correct one
// Then: selection rules (scripted students), storage and migration, variants and worksheets.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import vm from "node:vm";
import { ROOT, ENGINE_DIR, ENGINE_FILES, generatorFiles, loadEngine, checkPractice, browserCatalogue, standaloneContext } from "./lib/practice-build.mjs";
import { makeTools, VerifyError } from "./engine-checks/tools.mjs";

const args = process.argv.slice(2);
const argOf = (flag, def) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : def);
const SEEDS = Number(argOf("--seeds", 300));
const ONLY = argOf("--only", null);
const VERBOSE = args.includes("--verbose");

const E = loadEngine();
const T = makeTools(E);

// ---- KaTeX ---------------------------------------------------------------------
let katex = null;
try { katex = createRequire(import.meta.url)("katex"); } catch (_) {
  // not installed: fall back to the copy the site ships, if it is there
  const vendored = path.join(ROOT, "assets/vendor/katex/katex.min.js");
  try { if (fs.existsSync(vendored)) katex = createRequire(import.meta.url)(vendored); } catch (_e) { /* unusable */ }
}
if (!katex) {
  const line = "!".repeat(78);
  console.warn(`${line}\n!! KaTeX is not installed, so check 5 (every string renders) is SKIPPED.\n!! Run "npm install" (devDependency katex) to enable it. CI installs it and fails without it.\n${line}`);
  if (process.env.CI) { console.error("KaTeX is required in CI."); process.exit(1); }
}
const texCache = new Map();
function texError(src) {
  if (!katex) return null;
  if (texCache.has(src)) return texCache.get(src);
  let err = null;
  try { katex.renderToString(src, { throwOnError: true, strict: "error" }); } catch (e) { err = String(e.message || e).slice(0, 120); }
  if (texCache.size > 200000) texCache.clear();
  texCache.set(src, err);
  return err;
}

// ---- verifiers ---------------------------------------------------------------------
const verifiers = {};
const checkDir = path.join(ROOT, "scripts", "engine-checks");
for (const f of fs.readdirSync(checkDir).filter((x) => /^topic\d+\.mjs$/.test(x)).sort()) {
  const mod = await import(pathToFileURL(path.join(checkDir, f)).href);
  for (const [id, fn] of Object.entries(mod.default || {})) {
    if (verifiers[id]) throw new Error(`verifier for ${id} defined twice (${f})`);
    verifiers[id] = fn;
  }
}

// ---- per-question checks ---------------------------------------------------------------------
const W = 320, H = 240;
// the largest extent of a figure, in its own units
function figureSpan(graph) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  const see = (p) => { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); };
  for (const sh of graph.shapes) {
    for (const k of ["at", "from", "to"]) if (Array.isArray(sh[k])) see(sh[k]);
    (sh.points || []).forEach(see);
    if (sh.centre) { see([sh.centre[0] - sh.radius, sh.centre[1] - sh.radius]); see([sh.centre[0] + sh.radius, sh.centre[1] + sh.radius]); }
  }
  return Math.max(x1 - x0, y1 - y0);
}
function svgProblems(graph) {
  const bad = [];
  let svg;
  try { svg = E.graph.toSVG(graph, { width: W, height: H }); } catch (e) { return ["toSVG threw: " + e.message]; }
  if (/NaN|Infinity|undefined/.test(svg)) bad.push("NaN/Infinity in SVG");
  const check = (x, y) => { if (!(x >= -0.01 && x <= W + 0.01 && y >= -0.01 && y <= H + 0.01)) bad.push(`point (${x}, ${y}) outside the view box`); };
  for (const mt of svg.matchAll(/ d="([^"]*)"/g)) {
    let x = 0, y = 0;
    for (const c of mt[1].matchAll(/([MLHV])\s*(-?[\d.]+)(?:[ ,](-?[\d.]+))?/g)) {
      if (c[1] === "H") x = Number(c[2]); else if (c[1] === "V") y = Number(c[2]); else { x = Number(c[2]); y = Number(c[3]); }
      check(x, y);
    }
  }
  for (const mt of svg.matchAll(/<(?:circle|text)[^>]*?\b(?:cx|x)="(-?[\d.]+)"[^>]*?\b(?:cy|y)="(-?[\d.]+)"/g)) check(Number(mt[1]), Number(mt[2]));
  if (graph.shapes) {
    // a figure: a sound description, something drawn, every label drawn and clear of the lines and
    // of the other labels, at each size the page uses
    if (graph.x || graph.functions) bad.push("a figure cannot also be a plot");
    if (!graph.alt) bad.push("figure has no alt text");
    if (!/class="qb-graph-shape"/.test(svg)) bad.push("the figure draws no shape");
    const wanted = graph.shapes.reduce((n, sh) => n + (sh.label ? 1 : 0) + (sh.type === "north" || sh.type === "text" ? 1 : 0) + (sh.labels || []).filter(Boolean).length + (sh.sides || []).filter(Boolean).length, 0);
    if (!wanted) bad.push("the figure has no labels");
    for (const [w, h] of [[W, H], [420, 320], [260, 200]]) {
      const info = E.graph.figureInfo(graph, { width: w, height: h });
      for (const b of info.problems) bad.push(`${b} (at ${w} by ${h})`);
      if (info.labels.length !== wanted) bad.push(`${wanted} labels described, ${info.labels.length} drawn`);
      for (const l of info.labels) if (!(l.x - l.w / 2 >= 0 && l.x + l.w / 2 <= w && l.y - l.h / 2 >= 0 && l.y + l.h / 2 <= h)) bad.push(`label "${l.text}" is cut off (at ${w} by ${h})`);
      if (info.scale * figureSpan(graph) < 0.3 * Math.min(w, h)) bad.push(`the figure is drawn very small (at ${w} by ${h})`);
    }
    if ((svg.match(/class="qb-graph-shade"/g) || []).length !== graph.shapes.filter((sh) => sh.fill).length) bad.push("a shaded shape is not drawn");
    return bad;
  }
  if ((graph.functions || []).length && !/class="qb-graph-curve/.test(svg)) bad.push("no curve is visible in the window");
  E.graph.pieces(graph).forEach((pieces, i) => { if (!pieces.length) bad.push(`function ${i} is not visible in the window`); });
  // shaded regions: each is drawn and covers a visible part of the window
  if (graph.regions) {
    if ((svg.match(/class="qb-graph-shade"/g) || []).length !== graph.regions.length) bad.push("a shaded region is not drawn");
    E.graph.regionOutlines(graph).forEach((pts, i) => {
      let area = 0;
      for (let k = 0; k < pts.length; k++) { const q = pts[(k + 1) % pts.length]; area += Math.abs(pts[k].x * q.y - q.x * pts[k].y) / 2; }
      const r = graph.regions[i];
      if (!(r.x[1] > r.x[0]) || r.x[0] < graph.x[0] - 1e-9 || r.x[1] > graph.x[1] + 1e-9) bad.push(`region ${i} is not inside the window`);
      if (!(area > 0.002 * (graph.x[1] - graph.x[0]) * (graph.y[1] - graph.y[0]))) bad.push(`region ${i} is too small to see`);
    });
  }
  return bad;
}

function checkQuestion(g, level, seed, stats) {
  const fails = [];
  const fail = (n, msg) => fails.push(`[${n}] ${msg}`);
  const req = { course: g.courses[0], generator: g.id, level, seed };
  let q;
  try { q = E.make(req); } catch (e) { return [`[1] make() threw: ${e.message}`]; }
  // 1 deterministic
  if (JSON.stringify(q) !== JSON.stringify(E.make(req))) fail(1, "two calls with the same seed differ");
  try { if (JSON.stringify(E.make(q.request)) !== JSON.stringify(q) && E.generators({ course: q.course, type: q.type, unknown: q.unknown, representation: q.representation, format: q.format, level }).length === 1) fail(1, "question.request does not reproduce the question"); }
  catch (e) { fail(1, "question.request cannot be made: " + e.message); }
  if (q.level !== level || q.type !== g.type) fail(1, "level or type not carried through");

  // 7 marks
  const range = E.LEVELS[level].marks;
  if (q.parts.some((p) => !Number.isInteger(p.marks) || p.marks < 1)) fail(7, "a part has no marks");
  if (q.parts.reduce((s, p) => s + p.marks, 0) !== q.marks) fail(7, "part marks do not sum to the question's marks");
  if (q.marks < range[0] || q.marks > range[1]) fail(7, `${q.marks} marks is outside level ${level}'s range ${range[0]}-${range[1]}`);
  if (E.LEVELS[level].calculator === false && q.calculator) fail(7, "level 3 is Paper 1 style: no calculator");
  if (new Set(q.parts.map((p) => p.label)).size !== q.parts.length) fail(7, "part labels repeat");

  // 3 number quality, 5 renders
  for (const s of E.strings(q)) {
    if (typeof s.text !== "string" || !s.text.trim()) { fail(3, `${s.where}: empty`); continue; }
    for (const b of E.lintText(s.text, s.strict)) fail(3, `${s.where}: ${b} in "${s.text.slice(0, 80)}"`);
    for (const seg of E.segments(s.text)) if (seg.math) { const e = texError(seg.text); if (e) fail(5, `${s.where}: KaTeX: ${e} in "${seg.text.slice(0, 60)}"`); }
  }
  let needsThree = false;
  for (const p of q.parts) {
    if (!p.prompt) fail(3, `(${p.label}) has no prompt`);
    if (!p.working.length) fail(3, `(${p.label}) has no worked solution`);
    const a = p.answer;
    if (!a || !["number", "choice", "graph", "self"].includes(a.kind)) { fail(6, `(${p.label}) has no valid answer`); continue; }
    if (a.kind === "number") {
      if (!isFinite(a.value) || Object.is(a.value, -0)) fail(3, `(${p.label}) value is ${Object.is(a.value, -0) ? "-0" : a.value}`);
      const exact = a.tolerance === 0 || a.exact === true;
      if (!q.calculator && !exact) fail(3, `(${p.label}) a no-calculator answer must be exact`);
      if (q.calculator && !exact && a.sigfigs !== undefined && a.sigfigs !== 3) fail(3, `(${p.label}) calculator answers are given to 3 s.f.`);
      if (a.sigfigs === undefined && a.tolerance === undefined) fail(3, `(${p.label}) number answer needs tolerance or sigfigs`);
      if (Math.abs(a.value - Number(a.value.toPrecision(2))) > 1e-9 * Math.max(1, Math.abs(a.value))) needsThree = true;
    }
  }
  if (q.calculator && level === 4) { stats.p2++; if (!needsThree) stats.p2nice++; }

  // 6 marking round trip
  for (const p of q.parts) {
    const a = p.answer, mk = (r) => E.mark(q, p.label, r);
    if (a.kind === "number") {
      const tol = E.toleranceOf(a);
      if (!mk(a.value).correct) fail(6, `(${p.label}) the stored value is not accepted`);
      if (!mk(String(a.value)).correct) fail(6, `(${p.label}) the stored value typed as text is not accepted`);
      if (a.sigfigs && !mk(String(E.fmt.roundSf(a.value, a.sigfigs))).correct) fail(6, `(${p.label}) the value to ${a.sigfigs} s.f. is not accepted`);
      if (!mk(a.value + 0.9 * tol).correct || !mk(a.value - 0.9 * tol).correct) fail(6, `(${p.label}) a value inside the tolerance is rejected`);
      const out = Math.max(2.5 * tol, 1e-6 * Math.max(1, Math.abs(a.value)));
      if (mk(a.value + out).correct || mk(a.value - out).correct) fail(6, `(${p.label}) a value outside the tolerance is accepted`);
      if (mk("abc").correct || mk("").correct) fail(6, `(${p.label}) nonsense is accepted`);
      for (const mc of a.misconceptions || []) if (mk(mc.value).correct) fail(6, `(${p.label}) a misconception value is marked correct`);
    } else if (a.kind === "choice" || a.kind === "graph") {
      const n = a.options.length;
      if (n < 3) fail(6, `(${p.label}) fewer than three options`);
      if (!(a.correct >= 0 && a.correct < n)) fail(6, `(${p.label}) correct index out of range`);
      if (new Set(a.options.map((o) => JSON.stringify(o))).size !== n) fail(6, `(${p.label}) options are not distinct`);
      for (let i = 0; i < n; i++) if (mk(i).correct !== (i === a.correct)) fail(6, `(${p.label}) option ${i} is marked wrongly`);
      if (a.kind === "choice" && !mk(a.options[a.correct]).correct) fail(6, `(${p.label}) the correct option text is not accepted`);
      if (mk(n).correct || mk(-1).correct) fail(6, `(${p.label}) an option that does not exist is accepted`);
    } else {
      if (!a.display) fail(6, `(${p.label}) a self-marked part needs a model answer`);
      if (!mk(true).correct || mk(false).correct) fail(6, `(${p.label}) self-marking does not follow the student's verdict`);
    }
  }

  // 8 graphs
  const graphs = [];
  if (q.graph) graphs.push(["question graph", q.graph]);
  for (const p of q.parts) if (p.answer.kind === "graph") p.answer.options.forEach((o, i) => graphs.push([`(${p.label}) option ${i}`, o]));
  for (const [where, gr] of graphs) for (const b of svgProblems(gr)) fail(8, `${where}: ${b}`);
  for (const p of q.parts) {
    if (p.answer.kind !== "graph") continue;
    const o = p.answer.options;
    for (let i = 0; i < o.length; i++) for (let j = i + 1; j < o.length; j++) {
      if (!E.graph.distinct(o[i], o[j])) fail(8, `(${p.label}) options ${i} and ${j} look the same (difference ${E.graph.difference(o[i], o[j]).toFixed(3)})`);
    }
  }
  stats.graphs += graphs.length;

  // 2 verified independently, 4 constraints
  const v = verifiers[g.id];
  if (v) {
    let expected = null;
    try { expected = v(q, T); } catch (e) { fail(e instanceof VerifyError ? 4 : 2, `verifier: ${e.message}`); }
    if (expected) {
      for (const p of q.parts) {
        const a = p.answer, x = expected[p.label];
        if (a.kind === "self") { if (x !== undefined && a.value !== undefined && !T.close(x, a.value)) fail(2, `(${p.label}) self answer value ${a.value}, verifier ${x}`); continue; }
        if (x === undefined) { fail(2, `(${p.label}) is not verified`); continue; }
        if (a.kind === "number") {
          const val = typeof x === "number" ? x : x.value, tol = typeof x === "number" ? 1e-6 * Math.max(1, Math.abs(val)) : x.tol;
          if (!(Math.abs(val - a.value) <= tol)) fail(2, `(${p.label}) answer ${a.value}, verifier ${val}`);
        } else {
          let idx = x.index;
          if (x.optionValue !== undefined) {
            const hits = a.values.map((ov, i) => (JSON.stringify(ov) === JSON.stringify(x.optionValue) || (typeof ov === "number" && typeof x.optionValue === "number" && T.close(ov, x.optionValue)) ? i : -1)).filter((i) => i >= 0);
            idx = hits.length === 1 ? hits[0] : -1;
          }
          if (idx !== a.correct) fail(2, `(${p.label}) correct option ${a.correct}, verifier ${idx}`);
        }
        stats.verified++;
      }
    }
  }
  if (VERBOSE && seed === 1) console.log(JSON.stringify(q, null, 1));
  return fails;
}

// ---- run the generators ---------------------------------------------------------------------
const gens = E.registry.filter((g) => !ONLY || g.id.includes(ONLY));
let failedGens = 0, questions = 0;
const totals = { verified: 0, graphs: 0, p2: 0, p2nice: 0 };
const started = Date.now();
console.log(`Checking ${gens.length} generators x levels x ${SEEDS} seeds`);
for (const g of gens) {
  const problems = [];
  if (!verifiers[g.id]) problems.push("[2] no independent verifier in scripts/engine-checks/ (every generator needs one)");
  const before = T.asserts;
  for (const level of g.levels) {
    const stats = { verified: 0, graphs: 0, p2: 0, p2nice: 0 };
    const sigs = new Set();
    for (let seed = 1; seed <= SEEDS; seed++) {
      const fails = checkQuestion(g, level, seed, stats);
      questions++;
      for (const f of fails) if (problems.length < 6 && !problems.some((p) => p.slice(0, 40) === `L${level} seed ${seed}: ${f}`.replace(/seed \d+/, "seed").slice(0, 40))) problems.push(`L${level} seed ${seed}: ${f}`);
      if (!fails.length) sigs.add(E.signature(E.make({ generator: g.id, level, seed, course: g.courses[0] })));
    }
    if (stats.p2 >= 100 && !g.niceOk && stats.p2nice / stats.p2 > 0.2) problems.push(`[3] L${level}: ${stats.p2nice} of ${stats.p2} Paper 2 style questions have only "nice" answers`);
    if (SEEDS >= 100 && sigs.size < 4 && !g.fixedPool) problems.push(`[3] L${level}: only ${sigs.size} different questions in ${SEEDS} seeds`);
    for (const k of Object.keys(totals)) totals[k] += stats[k];
  }
  if (problems.length) { failedGens++; console.log(`FAIL ${g.id} (levels ${g.levels.join(",")})\n       ${problems.join("\n       ")}`); }
  else if (VERBOSE) console.log(`ok   ${g.id} (levels ${g.levels.join(",")}; ${T.asserts - before} constraint checks)`);
}
const missing = Object.keys(verifiers).filter((id) => !E.generator(id));
if (missing.length && !ONLY) { failedGens++; console.log(`FAIL verifiers with no generator: ${missing.join(", ")}`); }
console.log(`Generators: ${gens.length - failedGens > 0 ? gens.length - failedGens : 0} passed, ${failedGens} failed; ${questions} questions made, ${totals.verified} answers verified independently, ${T.asserts} constraint checks, ${totals.graphs} graphs drawn, KaTeX ${katex ? `checked ${texCache.size} distinct strings` : "SKIPPED"} (${((Date.now() - started) / 1000).toFixed(1)} s)`);

// ---- selection, storage, variants, worksheet ---------------------------------------------------------------------
const tests = [];
const test = (name, fn) => { try { fn(); tests.push([name, null]); } catch (e) { tests.push([name, e.message || String(e)]); } };
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

if (!ONLY) {
  const ctx = standaloneContext();
  const errors = [];
  const quiet = console.log; console.log = () => {};
  const practice = checkPractice({ ...ctx, errors });
  console.log = quiet;
  const QB = browserCatalogue(practice);
  E.useCatalogue(QB);
  const L = E.learner;
  const course = QB.course;
  const DAY = 86400000;
  const newLearner = (extra = {}) => {
    const clock = { t: 1800000000000 };
    const backend = L.memoryBackend();
    const lr = L.createLearner({ course, catalogue: QB, backend, now: () => clock.t, ...extra });
    return { lr, clock, backend };
  };
  const cov = E.coverage(course);
  const withGens = Object.keys(cov).filter((c) => cov[c].levels.some((l) => l >= 1 && l <= 4));
  const answer = (it, correct) => {
    // Answers through mark() where the question can be checked, so marking is exercised too.
    if (it.kind === "generated") {
      for (const p of it.question.parts) {
        const a = p.answer;
        const r = a.kind === "number" ? (correct ? a.value : a.value + 10 * E.toleranceOf(a) + 1) : a.kind === "self" ? correct : correct ? a.correct : (a.correct + 1) % a.options.length;
        assert(E.mark(it.question, p.label, r).correct === correct, `mark() disagreed with the scripted answer on ${it.question.id}`);
      }
    }
    return { correct, selfMarked: it.kind === "real", timeMs: 1000 };
  };

  test("catalogue and generators validate", () => assert(!errors.length, errors.slice(0, 3).join("; ")));

  test("always-correct student climbs to the exam rung", () => {
    assert(withGens.length > 0, "no subtopic has generators");
    const scope = withGens.filter((c) => c.startsWith("2.")).slice(0, 4);
    const { lr, clock } = newLearner();
    const seenSeeds = new Set(), levelsSeen = {};
    let lastType = null, repeats = 0, steps = 0;
    for (; steps < 400; steps++) {
      if (lr.summary(scope).every((r) => r.status === "exam")) break;
      const it = lr.next(scope);
      assert(it.kind !== "none", "next() returned nothing: " + it.why);
      assert(scope.includes(it.unit), "question outside the scope");
      if (it.kind === "generated") {
        assert(!seenSeeds.has(String(it.question.seed)), "a seed was repeated");
        seenSeeds.add(String(it.question.seed));
        if (it.type === lastType) repeats++;
        (levelsSeen[it.unit] = levelsSeen[it.unit] || new Set()).add(it.level);
      }
      lastType = it.kind === "generated" ? it.type : null;
      const { change } = lr.record(it, answer(it, true));
      if (change) assert(typeof lr.explain(change) === "string" && lr.explain(change).length > 5 && !/[{}]/.test(lr.explain(change)), "a level change has no plain-words message");
      clock.t += 60000;
    }
    const sum = lr.summary(scope);
    assert(sum.every((r) => r.status === "exam"), `after ${steps} correct answers not every subtopic is at the exam rung: ${sum.map((r) => r.code + ":" + r.status + ":" + r.level).join(" ")}`);
    for (const c of scope) assert([...levelsSeen[c]].length === cov[c].levels.filter((l) => l >= 2 && l <= 4).length, `subtopic ${c} skipped a level on the way up`);
    assert(repeats <= steps / 5, `the same question type came twice in a row ${repeats} times in ${steps}`);
    // At the exam rung the student gets real past-paper questions, self-marked.
    const it = lr.next(scope);
    assert(it.kind === "real" && it.reason === "exam" && /^aa-sl-\d{4}/.test(it.questionId), "exam rung does not serve a real question: " + JSON.stringify(it).slice(0, 200));
  });

  test("reviews come due after 3, 7 and 14 days; a miss drops one level", () => {
    const code = withGens.find((c) => c.startsWith("2."));
    const { lr, clock } = newLearner();
    for (let i = 0; i < 50 && lr.summary([code])[0].status !== "exam"; i++) lr.record(lr.next([code]), { correct: true });
    assert(lr.summary([code])[0].status === "exam", "did not reach the exam rung");
    assert(lr.next([code]).reason === "exam", "a review was served before it was due");
    for (const [i, days] of [3, 7, 14].entries()) {
      clock.t += days * DAY - 1000;
      assert(lr.summary([code])[0].status === "exam", `review ${i + 1} due early`);
      clock.t += 2000;
      assert(lr.summary([code])[0].status === "review-due", `review ${i + 1} not due after ${days} days`);
      const it = lr.next([code]);
      assert(it.reason === "review", `review ${i + 1} not served`);
      const { change } = lr.record(it, { correct: true });
      assert(change.kind === "review-passed", "review pass not reported");
    }
    assert(lr.state.courses[course].units[code].nextReview === null, "reviews continue after the last one");
    // a second learner misses the first review
    const b = newLearner();
    for (let i = 0; i < 50 && b.lr.summary([code])[0].status !== "exam"; i++) b.lr.record(b.lr.next([code]), { correct: true });
    b.clock.t += 3 * DAY + 1000;
    const it = b.lr.next([code]);
    const { change } = b.lr.record(it, { correct: false });
    const top = Math.max(...cov[code].levels.filter((l) => l <= 4));
    assert(change.kind === "review-missed" && b.lr.summary([code])[0].level === top, "a missed review did not drop to the top generated level");
  });

  test("always-wrong student descends to prerequisites and stops there", () => {
    // a subtopic whose prerequisites have generators
    const { lr: probe } = newLearner();
    const code = withGens.find((c) => c.startsWith("2.") && probe.prerequisites(c).length > 0);
    assert(code, "no Topic 2 subtopic has prerequisites with generators");
    const { lr, clock } = newLearner();
    const kinds = [];
    let steps = 0;
    for (; steps < 60; steps++) {
      const it = lr.next([code]);
      assert(it.kind === "generated", "expected generated questions on the way down");
      const { change } = lr.record(it, answer(it, false));
      if (change) kinds.push(change.kind);
      clock.t += 60000;
    }
    const lowest = cov[code].levels.filter((l) => l >= 1 && l <= 4)[0];
    assert(kinds.includes("refresh-start"), "never routed to prerequisites: " + kinds.join(","));
    assert(kinds.filter((k) => k === "refresh-start").length === 1, "prerequisites were queued more than once");
    assert(!kinds.includes("up") && !kinds.includes("exam-reached"), "moved up on wrong answers");
    const row = lr.summary([code])[0];
    assert(row.status === "refresh", "did not stay in the refresher: " + row.status);
    const u = lr.state.courses[course].units[code];
    assert(u.level === lowest, `refresher started above the lowest level (${u.level} vs ${lowest})`);
    // it stops there: the queue does not grow, and every further question is a prerequisite one
    const queued = JSON.stringify(u.refresh.items.map((x) => x.id));
    for (let i = 0; i < 20; i++) {
      const it = lr.next([code]);
      assert(it.reason === "refresh" && it.refreshFor === code, "left the refresher while still getting it wrong");
      assert(it.level === 0 || it.unit === code, "refresher question is not a prerequisite question");
      lr.record(it, answer(it, false));
    }
    assert(JSON.stringify(u.refresh.items.map((x) => x.id)) === queued, "the prerequisite queue changed while failing");
    const msg = lr.config.messages["refresh-start"];
    assert(/refresh/i.test(msg), "no refresh message");
    // and it comes back: two in a row on each prerequisite returns to the subtopic at its lowest level
    let back = null;
    for (let i = 0; i < 40 && !back; i++) { const it = lr.next([code]); const { change } = lr.record(it, answer(it, true)); if (change && change.kind === "refresh-done") back = change; }
    assert(back && lr.summary([code])[0].status === "level" && lr.summary([code])[0].level === lowest, "did not return to the subtopic after the refresher");
  });

  test("subtopics with no generator are served real questions, short to long", () => {
    const statements = QB.statements[course].map((s) => s.code);
    const noGen = statements.filter((c) => !withGens.includes(c));
    for (const c of statements) assert((QB.real[course][c] || []).length > 0, `subtopic ${c} has no real questions`);
    if (!noGen.length) return;
    const code = noGen[0];
    const { lr } = newLearner();
    const list = QB.real[course][code];
    const main = list.filter((r) => r[2] >= 50);
    for (let i = 1; i < main.length; i++) assert(main[i - 1][1] <= main[i][1], "main real questions are not ordered short to long");
    const served = [];
    for (let i = 0; i < Math.min(5, list.length); i++) {
      const it = lr.next([code]);
      assert(it.kind === "real" && it.reason === "real-only", "expected a real question for " + code);
      served.push(it.questionId);
      lr.record(it, { correct: i % 2 === 0, selfMarked: true });
    }
    assert(JSON.stringify(served) === JSON.stringify(list.slice(0, served.length).map((r) => r[0])), "real questions are not served in list order");
    assert(lr.summary([code])[0].status === "real-only", "summary does not say real-only");
    assert(lr.next([]).kind === "none" && lr.next(["99.9"]).kind === "none", "an empty or unknown scope should give nothing");
  });

  test("a real-questions-only subtopic rests after two right, so it does not crowd out the scope", () => {
    const noGen = QB.statements[course].map((s) => s.code).filter((c) => !withGens.includes(c));
    if (!noGen.length || !withGens.length) return;
    const { lr } = newLearner();
    const scope = [noGen[0], withGens[0]];
    let realServed = 0;
    // While the other subtopic still has levels to climb, the resting one is left alone.
    for (let i = 0; i < 30 && lr.summary([withGens[0]])[0].level !== "exam"; i++) {
      const it = lr.next(scope);
      if (it.unit === noGen[0]) realServed++;
      lr.record(it, { correct: true, selfMarked: it.kind === "real" });
    }
    assert(realServed <= 3, `the real-only subtopic was served ${realServed} times while other work remained`);
    assert(/Next check|Secure/.test(lr.summary([noGen[0]])[0].next), "summary does not say the real-only subtopic is resting");
  });

  test("every subtopic of the course can be practised", () => {
    const { lr } = newLearner();
    for (const s of QB.statements[course]) {
      const it = lr.next([s.code]);
      assert(it.kind === "generated" || it.kind === "real", `nothing to practise for ${s.code}`);
    }
  });

  // ---- all four courses ----
  const COURSES = Object.keys(QB.statements);
  const learnerFor = (c, extra = {}) => {
    const clock = { t: 1800000000000 };
    const backend = extra.backend || L.memoryBackend();
    return { lr: L.createLearner({ course: c, catalogue: QB, now: () => clock.t, ...extra, backend }), clock, backend };
  };
  const idOf = (c, code) => QB.statements[c].find((s) => s.code === code).id;

  test("each of the four courses: every subtopic can be practised, by a generator or its real questions", () => {
    assert(COURSES.join() === "aa-sl,aa-hl,ai-sl,ai-hl", "expected the four courses, got " + COURSES.join());
    // The one known gap: a statement with no generator and no tagged question in the bank.
    assert(practice.empty.join() === "ai-hl 1.10", "subtopics with nothing to practise changed: " + practice.empty.join(", "));
    for (const c of COURSES) {
      const { lr } = learnerFor(c);
      const all = E.coverage(c), cov = Object.fromEntries(Object.keys(all).filter((k) => all[k].levels.some((l) => l >= 1 && l <= 4)).map((k) => [k, all[k]]));
      let gen = 0, realOnly = 0;
      for (const s of QB.statements[c]) {
        const it = lr.next([s.code]);
        if (practice.empty.includes(`${c} ${s.code}`)) { assert(it.kind === "none" && lr.summary([s.code])[0].status === "unavailable", `${c} ${s.code} should be unavailable`); continue; }
        assert(it.kind === "generated" || it.kind === "real", `${c}: nothing to practise for ${s.code}`);
        assert(it.unit === s.code && it.course === c, `${c} ${s.code}: item for the wrong subtopic`);
        if (it.kind === "generated") {
          gen++;
          assert(cov[s.code], `${c} ${s.code}: generated without coverage`);
          assert(it.question.course === c && it.question.syllabus[0] === s.code && it.question.id.startsWith(c + ":"), `${c} ${s.code}: question ${it.question.id} is not under this course's code`);
        } else {
          realOnly++;
          assert(!cov[s.code] && it.reason === "real-only", `${c} ${s.code}: a real question although generators exist`);
          assert(QB.real[c][s.code].some((r) => r[0] === it.questionId), `${c} ${s.code}: real question from another list`);
        }
      }
      assert(gen === practice.perCourse[c].withGenerators && gen > 0, `${c}: ${gen} subtopics generated, build says ${practice.perCourse[c].withGenerators}`);
      assert(c === "aa-sl" ? realOnly === 0 : realOnly > 0, `${c}: unexpected number of real-only subtopics (${realOnly})`);
    }
  });

  test("a generator is offered exactly where the syllabus holds all its statements", () => {
    for (const c of COURSES) {
      const ids = new Set(QB.statements[c].map((s) => s.id));
      const offered = new Set(E.generators({ course: c }).map((d) => d.id));
      for (const g of E.registry) {
        const d = E.generators({ type: g.type }).find((x) => x.id === g.id);
        assert(d.statements && d.statements.length === g.syllabus.length, `${g.id}: statement ids not resolved`);
        const fits = d.statements.every((id) => ids.has(id));
        assert(fits === offered.has(g.id), `${g.id} ${fits ? "should" : "should not"} be offered in ${c}`);
        assert(d.courses.includes(c) === fits && d.courses[0] === "aa-sl", `${g.id}: courses list is wrong for ${c}`);
        if (!fits) { let threw = false; try { E.make({ course: c, generator: g.id, seed: 1 }); } catch (_) { threw = true; } assert(threw, `make() built ${g.id} for ${c}`); }
      }
    }
    assert(E.generators({ course: "aa-hl" }).length === E.registry.length, "AA HL should be offered every AA SL generator");
    assert(E.generators({ course: "ai-sl" }).length < E.registry.length && E.generators({ course: "ai-sl" }).length > 50, "AI SL should be offered some generators, not all");
  });

  test("a shared AI statement gets generated questions under its AI code", () => {
    // AI HL 1.11 is the statement AA numbers 1.8 (SL1.8).
    assert(idOf("ai-hl", "1.11") === "SL1.8" && idOf("aa-sl", "1.8") === "SL1.8", "the shared statement moved");
    const ai = E.generators({ course: "ai-hl", syllabus: "1.11", primary: true });
    const aa = E.generators({ course: "aa-sl", syllabus: "1.8", primary: true });
    assert(ai.length > 0 && ai.every((d) => aa.some((x) => x.id === d.id)), "AI HL 1.11 does not get the SL1.8 generators");
    assert(ai.every((d) => d.syllabus[0] === "1.11"), "generators are not described under the AI code");
    assert(E.generators({ course: "ai-hl", syllabus: "1.8", primary: true }).length === 0, "AI HL 1.8 (an AI-only statement) was given AA 1.8 generators");
    assert(E.generators({ course: "aa-hl", syllabus: "1.11", primary: true }).length === 0, "AA HL 1.11 (partial fractions) was given generators");
    assert(E.coverage("ai-hl")["1.11"] && !E.coverage("ai-hl")["1.8"] && !E.coverage("ai-sl")["1.11"], "coverage() is not in the course's codes");
    const { lr } = learnerFor("ai-hl");
    const seen = new Set();
    for (let i = 0; i < 12; i++) {
      const it = lr.next(["1.11"]);
      if (it.reason === "exam") break;
      assert(it.kind === "generated" && it.unit === "1.11" && it.question.syllabus[0] === "1.11", "expected a generated question under 1.11");
      assert(it.request.course === "ai-hl" && JSON.stringify(E.make(it.request)) === JSON.stringify(it.question), "the request does not reproduce the question");
      // the same generator, level and seed give the same mathematics in the home course
      const home = E.make({ ...it.request, course: "aa-sl" });
      assert(home.stem === it.question.stem && home.syllabus[0] === "1.8" && home.id !== it.question.id, "the AA SL twin differs or shares an id");
      seen.add(it.level);
      lr.record(it, answer(it, true));
    }
    assert(seen.size > 1, "the level did not move in AI HL");
    assert(lr.state.courses["ai-hl"].units["1.11"] && !lr.state.courses["ai-hl"].units["1.8"], "state is not keyed by the AI code");
    // the exam rung serves AI HL questions tagged 1.11
    for (let i = 0; i < 30 && lr.summary(["1.11"])[0].status !== "exam"; i++) { const it = lr.next(["1.11"]); lr.record(it, answer(it, true)); }
    const ex = lr.next(["1.11"]);
    assert(ex.kind === "real" && QB.real["ai-hl"]["1.11"].some((r) => r[0] === ex.questionId), "the exam rung of AI HL 1.11 does not serve its own real questions");
    // variants stay inside the course
    for (const d of E.generators({ course: "ai-sl" }).slice(0, 40)) {
      const q = E.make({ course: "ai-sl", generator: d.id, seed: 3 });
      for (const v of E.variants(q)) assert(v.request.course === "ai-sl" && E.make(v.request).course === "ai-sl", "a variant left the course");
    }
  });

  test("a question made for a course carries that course's codes", () => {
    for (const c of COURSES) {
      const codeOf = new Map(QB.statements[c].map((s) => [s.id, s.code]));
      for (const d of E.generators({ course: c })) {
        const q = E.make({ course: c, generator: d.id, seed: 9 });
        const want = d.statements.map((id) => codeOf.get(id));
        assert(JSON.stringify(q.syllabus) === JSON.stringify(want) && JSON.stringify(d.syllabus) === JSON.stringify(want), `${d.id} in ${c}: codes ${q.syllabus} should be ${want}`);
        assert(q.course === c && q.request.course === c && q.id.split(":")[0] === c, `${d.id}: course missing from the question made for ${c}`);
      }
    }
    const moved = E.generators({ course: "ai-hl" }).filter((d) => JSON.stringify(d.syllabus) !== JSON.stringify(E.generator(d.id).syllabus));
    assert(moved.length > 0, "no generator changes code between AA SL and AI HL, so the mapping is untested");
  });

  test("an AHL or AI-only statement falls back to that course's real questions; Paper 3 comes last", () => {
    const cases = [["aa-hl", (s) => s.id.startsWith("AHL")], ["ai-hl", (s) => s.id.startsWith("AI-AHL")], ["ai-sl", (s) => s.id.startsWith("AI-SL")], ["ai-hl", (s) => s.id.startsWith("AI-SL")]];
    for (const [c, pick] of cases) {
      const list = QB.statements[c].filter(pick).filter((s) => (QB.real[c][s.code] || []).length);
      assert(list.length > 0, `${c}: no such statements`);
      for (const s of list) {
        assert(E.generators({ course: c, syllabus: s.code, primary: true }).length === 0, `${c} ${s.code} (${s.id}) has generators`);
        const { lr } = learnerFor(c);
        const real = QB.real[c][s.code];
        const it = lr.next([s.code]);
        assert(it.kind === "real" && it.reason === "real-only" && it.questionId === real[0][0], `${c} ${s.code}: expected its first real question`);
        assert(lr.summary([s.code])[0].status === "real-only", `${c} ${s.code}: summary is not real-only`);
        const main = real.filter((r) => r[2] >= 50);
        for (let i = 1; i < main.length; i++) assert(main[i - 1][1] <= main[i][1], `${c} ${s.code}: main real questions are not short to long`);
        for (const r of real) assert(new RegExp(`^${c.slice(0, 2)}-[sh]l-\\d{4}`).test(r[0]), `${c} ${s.code}: ${r[0]} is from another subject`);
      }
      const w = E.worksheet({ course: c, scope: [list[0].code], count: 2, seed: 1, real: L.realIndex(QB, c) });
      assert(w.items.length > 0 && w.items.every((x) => x.kind === "real"), `${c}: worksheet on ${list[0].code} should use real questions`);
    }
    // A Paper 3 question is long: wherever a list has a shorter main question, it is served first.
    for (const c of ["aa-hl", "ai-hl"]) {
      let p3 = 0;
      for (const [code, list] of Object.entries(QB.real[c])) {
        const main = list.filter((r) => r[2] >= 50);
        const first = list[0];
        if (/-p3-/.test(first[0])) assert(main.every((r) => r[1] >= first[1]), `${c} ${code}: a Paper 3 question is served before a shorter one`);
        p3 += list.filter((r) => /-p3-/.test(r[0])).length;
      }
      assert(p3 > 0, `${c}: no Paper 3 question in the real lists`);
    }
    // A question shared by an SL and an HL paper is in both courses' lists, under the stored (SL) id.
    for (const [sl, hl] of [["aa-sl", "aa-hl"], ["ai-sl", "ai-hl"]]) {
      const slIds = new Set(Object.values(QB.real[sl]).flat().map((r) => r[0]));
      const sharedInHl = Object.values(QB.real[hl]).flat().filter((r) => r[0].startsWith(sl + "-"));
      assert(sharedInHl.length > 0 && sharedInHl.every((r) => slIds.has(r[0])), `${hl}: shared SL questions are missing or unknown`);
      assert(!Object.values(QB.real[sl]).flat().some((r) => r[0].startsWith(hl + "-")), `${sl}: lists an HL-only question`);
    }
  });

  test("switching course does not mix learner state", () => {
    const backend = L.memoryBackend();
    const clock = { t: 1800000000000 };
    const open = (c) => L.createLearner({ course: c, catalogue: QB, backend, now: () => clock.t });
    // "1.5" is a subtopic of every course; "2.5" is a different statement in AA and AI.
    const scope = ["1.5", "2.5"];
    assert(idOf("aa-sl", "2.5") !== idOf("ai-sl", "2.5"), "2.5 should be a different statement in AA and AI");
    let aa = open("aa-sl");
    for (let i = 0; i < 9; i++) { const it = aa.next(scope); aa.record(it, answer(it, true)); clock.t += 1000; }
    const aaBefore = JSON.stringify(aa.summary(scope)), aaUnits = JSON.stringify(aa.state.courses["aa-sl"]);
    let ai = open("ai-sl");
    assert(ai.loadStatus === "loaded" && ai.summary(scope).every((r) => r.attempts === 0 && (r.status === "not-started" || r.status === "real-only")), "AI SL starts with AA SL's progress");
    for (let i = 0; i < 7; i++) { const it = ai.next(scope); assert(it.course === "ai-sl", "item for the wrong course"); ai.record(it, { correct: false, selfMarked: it.kind === "real" }); clock.t += 1000; }
    assert(JSON.stringify(ai.state.courses["aa-sl"]) === aaUnits, "practising AI SL changed AA SL's state");
    aa = open("aa-sl");
    assert(JSON.stringify(aa.summary(scope)) === aaBefore, "AA SL progress changed after practising AI SL");
    assert(aa.state.attempts.filter((a) => a.course === "aa-sl").length === 9 && aa.state.attempts.filter((a) => a.course === "ai-sl").length === 7, "the attempt log lost a course");
    const hl = open("aa-hl");
    assert(hl.summary(scope).every((r) => r.attempts === 0), "AA HL starts with AA SL's progress");
    // an export holds every course; an import brings them all back
    const file = aa.exportJSON();
    const fresh = learnerFor("ai-sl");
    fresh.lr.importJSON(file);
    assert(Object.keys(fresh.lr.state.courses).sort().join() === "aa-sl,ai-sl" && fresh.lr.summary(scope).reduce((n, r) => n + r.attempts, 0) === 7, "export and import did not keep both courses");
    // resetting one course leaves the other alone and keeps the old save aside
    ai = open("ai-sl");
    const { keptAs } = ai.resetCourse();
    assert(keptAs && backend.getItem(keptAs) && ai.summary(scope).every((r) => r.attempts === 0), "resetCourse did not clear the course or keep the old save");
    aa = open("aa-sl");
    assert(JSON.stringify(aa.summary(scope)) === aaBefore && !aa.state.attempts.some((a) => a.course === "ai-sl"), "resetting AI SL touched AA SL");
  });

  test("fixed-level practice: the chosen levels, mixed over the scope, and no level moves", () => {
    for (const c of COURSES) {
      const cov = E.coverage(c);
      const gen = Object.keys(cov).filter((k) => [1, 2].every((l) => cov[k].levels.includes(l)) && cov[k].levels.includes(3)).slice(0, 3);
      const realOnly = QB.statements[c].map((s) => s.code).filter((k) => !cov[k] && (QB.real[c][k] || []).length).slice(0, 1);
      const scope = [...gen, ...realOnly];
      assert(gen.length === 3, `${c}: not enough subtopics with levels 1 to 3`);
      const { lr, clock } = learnerFor(c);
      // some adaptive history first
      for (let i = 0; i < 4; i++) { const it = lr.next([gen[0]]); lr.record(it, answer(it, true)); clock.t += 1000; }
      const before = JSON.stringify(lr.summary(scope).map((r) => [r.code, r.status, r.level, r.nextReview]));
      for (const [levels, right] of [[[1, 2], true], [[3, 4], false]]) {
        const units = {}, seenLevels = new Set();
        for (let i = 0; i < 6 * scope.length; i++) {
          const it = lr.next(scope, { levels });
          assert(it.reason === "fixed" && scope.includes(it.unit), "fixed practice left the scope");
          units[it.unit] = (units[it.unit] || 0) + 1;
          if (it.kind === "generated") { assert(levels.includes(it.level) && it.question.level === it.level, `${c}: level ${it.level} outside ${levels}`); seenLevels.add(it.level); }
          else assert(realOnly.includes(it.unit), "a real question for a subtopic that has generators");
          const { change } = lr.record(it, right ? answer(it, true) : { correct: false, selfMarked: it.kind === "real" });
          assert(change === null, "fixed practice reported a level change");
          clock.t += 1000;
        }
        assert(scope.every((k) => units[k] === 6), `${c}: fixed practice is not mixed evenly: ${JSON.stringify(units)}`);
        assert(seenLevels.size >= 1 && [...seenLevels].every((l) => levels.includes(l)), "wrong levels served");
      }
      assert(JSON.stringify(lr.summary(scope).map((r) => [r.code, r.status, r.level, r.nextReview])) === before, `${c}: fixed practice moved a level`);
      assert(lr.state.attempts.filter((a) => a.reason === "fixed").length === 12 * scope.length, "fixed practice was not logged");
      assert(lr.summary(scope).every((r) => r.attempts >= 12), "fixed practice was not counted");
      // a subtopic with none of the wanted levels gives its nearest level
      const low = Object.keys(cov).find((k) => !cov[k].levels.includes(4) && cov[k].levels.some((l) => l >= 1 && l < 4));
      if (low) { const it = lr.next([low], { levels: [4] }); assert(it.kind === "generated" && it.level === Math.max(...cov[low].levels.filter((l) => l <= 4)), "no nearest level for a subtopic without level 4"); }
    }
  });

  test("calculator wording follows the course's papers", () => {
    assert(QB.courses["aa-sl"].papers.some((p) => p.calculator === false) && QB.courses["ai-sl"].papers.every((p) => p.calculator === true), "course papers missing from the catalogue");
    for (const c of COURSES) {
      const strict = E.hasNoCalculatorPaper(c);
      assert(strict === c.startsWith("aa"), `${c}: wrong calculator policy`);
      let exact = 0;
      for (const d of E.generators({ course: c, level: 3 }).slice(0, 60)) {
        const q = E.make({ course: c, generator: d.id, level: 3, seed: 2 });
        const label = E.calculatorLabel(q);
        if (!q.calculator) exact++;
        assert(q.calculator ? label === "Calculator" : label === (strict ? "No calculator" : "Exact answer expected"), `${c}: calculator label "${label}"`);
      }
      assert(exact > 0, `${c}: no level 3 question without a calculator`);
      assert(strict ? /Paper/.test(E.levelName(3, c)) : !/Paper|No calculator/.test(E.levelName(3, c) + E.levelName(4, c)), `${c}: level names`);
    }
  });

  test("worksheet in another course: its codes, generated where shared, real where not", () => {
    const c = "ai-hl", cov = E.coverage(c);
    const noGen = QB.statements[c].map((s) => s.code).find((k) => !cov[k] && (QB.real[c][k] || []).length >= 2);
    const scope = ["1.11", "4.3", noGen];
    const w = E.worksheet({ course: c, scope, count: 9, levels: { 2: 1, 3: 1 }, seed: 4, real: L.realIndex(QB, c) });
    assert(JSON.stringify(w) === JSON.stringify(E.worksheet({ course: c, scope, count: 9, levels: { 2: 1, 3: 1 }, seed: 4, real: L.realIndex(QB, c) })), "not reproducible");
    assert(w.course === c && w.items.length >= 6, `worksheet has ${w.items.length} items`);
    for (const it of w.items) {
      assert(scope.includes(it.code), "item outside the scope");
      if (it.code === noGen) assert(it.kind === "real" && QB.real[c][noGen].some((r) => r[0] === it.questionId), "the AI-only subtopic should give its real questions");
      else assert(it.kind === "generated" && it.question.course === c && it.question.syllabus[0] === it.code, "generated item is not under the AI code");
    }
  });

  test("progress survives a reload, an export and an import", () => {
    const { lr, backend, clock } = newLearner();
    const scope = withGens.slice(0, 3);
    for (let i = 0; i < 25; i++) { const it = lr.next(scope); lr.record(it, { correct: i % 3 !== 0, timeMs: 500 }); clock.t += 1000; }
    const before = JSON.stringify(lr.summary(scope));
    const again = L.createLearner({ course, catalogue: QB, backend, now: () => clock.t });
    assert(again.loadStatus === "loaded" && JSON.stringify(again.summary(scope)) === before, "reload lost progress");
    assert(again.state.attempts.length === 25 && again.state.attempts[0].skills && again.state.attempts[0].request, "attempt log incomplete");
    const file = lr.exportJSON();
    const clean = newLearner();
    clean.clock.t = clock.t;
    clean.lr.record(clean.lr.next(scope), { correct: true });
    const { keptAs } = clean.lr.importJSON(file);
    assert(JSON.stringify(clean.lr.summary(scope)) === before, "import on a clean profile did not restore progress");
    assert(keptAs && clean.backend.getItem(keptAs), "the save replaced by an import was not kept aside");
    let threw = false;
    try { clean.lr.importJSON("{\"hello\":1}"); } catch (_) { threw = true; }
    assert(threw && JSON.stringify(clean.lr.summary(scope)) === before, "a bad import file was accepted or damaged the state");
  });

  test("storage: migration, unreadable saves kept aside, log capped", () => {
    const key = L.CONFIG.storageKey;
    // version 0 (pre-release layout) migrates
    const b0 = L.memoryBackend();
    const v0 = { units: { "2.7": { level: 3, rung: "generated", recent: [1], lastSeen: 5, nextReview: null, reviewStage: 0, refresh: null, realSeen: [], attempts: 4, correct: 3, started: true } }, log: [{ t: 1, unit: "2.7", correct: true }], nextSeed: 9, salt: "old" };
    b0.setItem(key, JSON.stringify(v0));
    const s0 = L.createStore({ backend: b0, now: () => 42 }).load();
    assert(s0.status === "migrated" && s0.state.version === L.VERSION, "version 0 save did not migrate");
    assert(s0.state.courses["aa-sl"].units["2.7"].level === 3 && s0.state.attempts[0].course === "aa-sl" && s0.state.nextSeed === 9, "migration lost data");
    const lr0 = L.createLearner({ course, catalogue: QB, backend: b0, now: () => 42 });
    assert(lr0.loadStatus === "migrated" && lr0.summary(["2.7"])[0].level === 3, "learner did not pick up the migrated save");
    // every version below the current one has a migration
    for (let v = 0; v < L.VERSION; v++) assert(typeof L.MIGRATIONS[v] === "function", `no migration from version ${v}`);
    // unreadable and too-new saves are kept, not wiped
    for (const raw of ["{not json", JSON.stringify({ version: L.VERSION + 5, courses: {} }), JSON.stringify([1, 2]), JSON.stringify({ version: 1, app: "other" })]) {
      const b = L.memoryBackend();
      b.setItem(key, raw);
      const r = L.createStore({ backend: b, now: () => 77 }).load();
      assert(r.status === "unreadable" && r.state.version === L.VERSION && r.state.attempts.length === 0, "unreadable save not replaced by a fresh state");
      assert(b.getItem(r.keptAs) === raw, "unreadable save was not kept aside");
      assert(b.getItem(key) === raw, "unreadable save was overwritten on load");
    }
    // fresh, and a backend that throws
    assert(L.createStore({ backend: L.memoryBackend() }).load().status === "new", "empty storage should give a new state");
    const broken = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); }, removeItem() {} };
    const lb = L.createLearner({ course, catalogue: QB, backend: broken, now: () => 1 });
    const it = lb.next(withGens.slice(0, 1));
    assert(lb.record(it, { correct: true }).saved === false, "a blocked backend should report saved: false, not throw");
    // attempt log cap
    const { lr } = newLearner({ config: { attemptCap: 30 } });
    for (let i = 0; i < 45; i++) lr.record(lr.next(withGens.slice(0, 2)), { correct: i % 2 === 0 });
    assert(lr.state.attempts.length === 30, "attempt log is not capped");
    // reset keeps the old save
    const r = lr.reset();
    assert(r.keptAs && lr.state.attempts.length === 0, "reset did not keep the old save aside");
  });

  test("variants: ask it another way", () => {
    const types = [...new Set(E.registry.map((g) => g.type))];
    let multi = 0, same = 0;
    for (const type of types) {
      const list = E.generators({ type });
      const q = E.make({ generator: list[0].id, seed: 11, course: list[0].courses[0] });
      const vs = E.variants(q);
      assert(vs.length === E.generators({ type, course: q.course }).length - 1, `variants() of ${type} is incomplete`);
      if (vs.length) multi++;
      for (const v of vs) {
        const q2 = E.make(v.request);
        assert(q2.type === q.type && (q2.unknown !== q.unknown || q2.representation !== q.representation || q2.format !== q.format), `variant of ${q.id} is the same question`);
        if (v.sameSituation) { same++; assert(JSON.stringify(q2.params.sit) === JSON.stringify(q.params.sit), `variant ${v.generator} does not keep the situation of ${q.generator}`); }
      }
    }
    assert(multi >= 4, `only ${multi} question types have a second way of asking`);
    assert(same >= 2, `only ${same} variants keep the same situation`);
  });

  test("worksheet: N questions for a scope and level mix, reproducible", () => {
    const scope = withGens.filter((c) => c.startsWith("2.")).slice(0, 5);
    const real = L.realIndex(QB, course);
    const a = E.worksheet({ course, scope, count: 12, levels: { 2: 2, 3: 1 }, seed: 7, real });
    const b = E.worksheet({ course, scope, count: 12, levels: { 2: 2, 3: 1 }, seed: 7, real });
    assert(JSON.stringify(a) === JSON.stringify(b), "the same options gave two different worksheets");
    assert(a.items.length === 12, `asked for 12 questions, got ${a.items.length}`);
    assert(a.items.every((it) => it.kind === "generated" && [2, 3].includes(it.question.level) && scope.includes(it.code)), "worksheet strayed from the scope or levels");
    assert(new Set(a.items.map((it) => E.signature(it.question))).size === 12, "worksheet repeats a question");
    assert(a.items.every((it) => it.question.parts.every((p) => p.working.length)), "worksheet question without an answer key");
    const other = E.worksheet({ course, scope, count: 12, levels: { 2: 2, 3: 1 }, seed: 8, real });
    assert(JSON.stringify(other) !== JSON.stringify(a), "a different seed gave the same worksheet");
    const noGen = QB.statements[course].map((s) => s.code).filter((c) => !withGens.includes(c));
    if (noGen.length) {
      const w = E.worksheet({ course, scope: [noGen[0]], count: 3, seed: 1, real });
      assert(w.items.length > 0 && w.items.every((it) => it.kind === "real"), "a subtopic without generators should give real questions on a worksheet");
    }
  });

  test("the files run as plain browser scripts and give the same questions", () => {
    // a bare global with no require, module or process, as a <script> tag would see
    const sandbox = vm.createContext({});
    vm.runInContext("var window = this;", sandbox);
    vm.runInContext("window.QB_TYPES = " + JSON.stringify(QB) + ";", sandbox);
    for (const f of [...ENGINE_FILES, ...generatorFiles().map((g) => "generators/" + g)]) vm.runInContext(fs.readFileSync(path.join(ROOT, ENGINE_DIR, f), "utf8"), sandbox, { filename: f });
    const out = JSON.parse(vm.runInContext(`(function () {
      var first = QBEngine.registry[0], q = QBEngine.make({ generator: first.id, level: first.levels[0], seed: 5 });
      var learner = QBEngine.learner.createLearner({ course: QB_TYPES.course, catalogue: QB_TYPES, now: function () { return 1; } });
      var item = learner.next(["2.7"]);
      var rec = learner.record(item, { correct: true });
      // with only window.QB_TYPES to go on, the engine still maps generators onto another course
      var ai = QBEngine.make({ course: "ai-hl", generator: QBEngine.generators({ course: "ai-hl", syllabus: "1.11", primary: true })[0].id, seed: 5 });
      return JSON.stringify({ n: QBEngine.registry.length, q: q, kind: item.kind, saved: rec.saved, ai: ai.syllabus[0], keys: Object.keys(window).filter(function (k) { return k !== "window"; }) });
    })()`, sandbox));
    assert(out.n === E.registry.length, "not every generator registered in the browser-like global");
    const g0 = E.registry[0];
    assert(JSON.stringify(out.q) === JSON.stringify(E.make({ generator: g0.id, level: g0.levels[0], seed: 5 })), "the browser-like run made a different question");
    assert(out.kind === "generated" && out.saved === true, "the learner did not run without localStorage");
    assert(out.ai === "1.11", "the browser-like run did not map a generator onto AI HL");
    assert(out.keys.sort().join() === "QBEngine,QB_TYPES", "the scripts leak globals: " + out.keys.join(", "));
  });

  test("no Math.random() or Date in the engine and generators", () => {
    const dir = path.join(ROOT, "assets/js/engine");
    const files = [...fs.readdirSync(dir).filter((f) => f.endsWith(".js")).map((f) => path.join(dir, f)), ...fs.readdirSync(path.join(dir, "generators")).map((f) => path.join(dir, "generators", f))];
    for (const f of files) {
      const src = fs.readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
      assert(!/Math\.random/.test(src), `${path.basename(f)} uses Math.random()`);
      if (!f.endsWith("learner.js")) assert(!/\bDate\b/.test(src), `${path.basename(f)} uses Date`);
      assert(!/\b(document|window)\./.test(src), `${path.basename(f)} touches the DOM`);
    }
  });

  let failedTests = 0;
  for (const [name, err] of tests) { if (err) failedTests++; console.log(`${err ? "FAIL" : "ok  "} ${name}${err ? "\n       " + err : ""}`); }
  console.log(`Engine tests: ${tests.length - failedTests} passed, ${failedTests} failed`);
  if (failedTests) failedGens++;
}

if (failedGens) { console.error("check-engine: FAILED"); process.exit(1); }
console.log("check-engine: all checks passed");
