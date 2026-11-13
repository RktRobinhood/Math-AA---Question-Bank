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
//   8 graphs             every graph gives SVG with finite coordinates inside the view box;
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
  if ((graph.functions || []).length && !/class="qb-graph-curve/.test(svg)) bad.push("no curve is visible in the window");
  E.graph.pieces(graph).forEach((pieces, i) => { if (!pieces.length) bad.push(`function ${i} is not visible in the window`); });
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

  test("every subtopic of the course can be practised", () => {
    const { lr } = newLearner();
    for (const s of QB.statements[course]) {
      const it = lr.next([s.code]);
      assert(it.kind === "generated" || it.kind === "real", `nothing to practise for ${s.code}`);
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
      return JSON.stringify({ n: QBEngine.registry.length, q: q, kind: item.kind, saved: rec.saved, keys: Object.keys(window).filter(function (k) { return k !== "window"; }) });
    })()`, sandbox));
    assert(out.n === E.registry.length, "not every generator registered in the browser-like global");
    const g0 = E.registry[0];
    assert(JSON.stringify(out.q) === JSON.stringify(E.make({ generator: g0.id, level: g0.levels[0], seed: 5 })), "the browser-like run made a different question");
    assert(out.kind === "generated" && out.saved === true, "the learner did not run without localStorage");
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
