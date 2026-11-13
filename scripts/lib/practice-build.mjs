// Practice engine build steps, called from scripts/build.mjs:
//   checkPractice()  validates data/question-types.json against the bank and the engine's generators
//   writePractice()  writes assets/js/question-types.js (window.QB_TYPES) and docs/practice-coverage.md
// loadEngine() loads the browser engine files into Node; scripts/check-engine.mjs uses it too.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, "..", "..");
export const ENGINE_DIR = "assets/js/engine";
// Load order for the browser too: engine, graph, learner, then every generator file.
export const ENGINE_FILES = ["engine.js", "graph.js", "learner.js"];

export function generatorFiles(root = ROOT) {
  const dir = path.join(root, ENGINE_DIR, "generators");
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".js")).sort((a, b) => a.localeCompare(b, "en", { numeric: true })) : [];
}

let loaded = null;
export function loadEngine(root = ROOT) {
  if (loaded) return loaded;
  const require = createRequire(import.meta.url);
  for (const f of ENGINE_FILES) require(path.join(root, ENGINE_DIR, f));
  for (const f of generatorFiles(root)) require(path.join(root, ENGINE_DIR, "generators", f));
  loaded = globalThis.QBEngine;
  return loaded;
}

const readJson = (root, p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const partIdsOf = (q) => q.crop.parts.map((p) => (p.label ? `${q.id}.${p.label}` : q.id));
const byCode = (a, b) => a.split(".").map(Number).reduce((s, n) => s * 100 + n, 0) - b.split(".").map(Number).reduce((s, n) => s * 100 + n, 0);

// Validates the catalogue and the generators. Pushes problems onto `errors`; returns what
// writePractice() needs. Parts of later papers that no type covers are reported, not errors.
//   questions      [{id, course: {id}, crop: {marks, parts}, tags: {parts}}] from build.mjs
//   subtagName     Map of every skill id in the bank's syllabus files
//   courses        data/courses.json courses
//   statementsOf   (course) => [{code, id, topic, title}]
//   aliasesOf      Map canonical question id -> [{course: {id}}] (HL appearances of SL questions)
export function checkPractice({ root = ROOT, questions, subtagName, courses, statementsOf, aliasesOf = new Map(), errors }) {
  const catalogue = readJson(root, "data/question-types.json");
  const E = loadEngine(root);
  const course = catalogue.course;
  const err = (m) => errors.push(`question-types: ${m}`);
  // A skill id that the catalogue spells differently from the bank's syllabus files is listed in
  // skillAliases (catalogue id -> bank id), so the catalogue's ids can stay identical to its source.
  const aliases = catalogue.skillAliases || {};
  for (const [from, to] of Object.entries(aliases)) if (!subtagName.has(to)) err(`skillAliases: ${from} points at unknown skill ${to}`);
  const skillOk = (id) => subtagName.has(id) || Object.hasOwn(aliases, id);

  // -- catalogue against the bank
  const statementIds = new Set(courses.flatMap((c) => statementsOf(c).map((s) => s.id)));
  const subIds = new Set();
  for (const st of catalogue.subtopics) {
    if (subIds.has(st.id)) err(`subtopic ${st.id} listed twice`);
    subIds.add(st.id);
    if (!statementIds.has(st.id)) err(`subtopic ${st.id} is not a syllabus statement`);
    for (const sk of st.skills) if (!skillOk(sk.id)) err(`subtopic ${st.id}: unknown skill ${sk.id}`);
  }
  for (const st of catalogue.subtopics) for (const p of st.prereqs) if (!subIds.has(p)) err(`subtopic ${st.id}: unknown prerequisite ${p}`);
  const codes = new Set(statementsOf(courses.find((c) => c.id === course)).map((s) => s.code));
  const allParts = new Map(); // part id -> question
  for (const q of questions) if (q.course.id === course) for (const id of partIdsOf(q)) allParts.set(id, q);
  const assigned = new Set();
  const typeIds = new Set();
  for (const t of catalogue.types) {
    if (typeIds.has(t.id)) err(`type ${t.id} listed twice`);
    typeIds.add(t.id);
    for (const sk of [...t.skills, ...(t.supports || [])]) if (!skillOk(sk)) err(`type ${t.id}: unknown skill ${sk}`);
    for (const c of t.syllabus || []) if (!codes.has(c)) err(`type ${t.id}: unknown syllabus code ${c}`);
    for (const p of [...(t.parts || []), ...(t.alsoSeenIn || [])]) {
      if (!allParts.has(p)) err(`type ${t.id}: unknown part ${p}`);
      assigned.add(p);
    }
    for (const u of t.unknowns || []) for (const sk of u.skills || []) if (!skillOk(sk)) err(`type ${t.id}, unknown ${u.id}: unknown skill ${sk}`);
  }
  const unassigned = [...allParts.keys()].filter((p) => !assigned.has(p)).sort();

  // -- generators against the catalogue
  const typeById = new Map(catalogue.types.map((t) => [t.id, t]));
  const notes = [];
  for (const g of E.registry) {
    const t = typeById.get(g.type);
    if (!t) { err(`generator ${g.id}: type ${g.type} is not in the catalogue`); continue; }
    for (const sk of g.skills) if (!skillOk(sk)) err(`generator ${g.id}: unknown skill ${sk}`);
    for (const c of g.courses) {
      const cc = courses.find((x) => x.id === c);
      if (!cc) { err(`generator ${g.id}: unknown course ${c}`); continue; }
      const known = new Set(statementsOf(cc).map((s) => s.code));
      for (const code of g.syllabus) if (!known.has(code)) err(`generator ${g.id}: ${code} is not in the ${c} syllabus`);
    }
    if (t.unknowns && t.unknowns.length && !t.unknowns.some((u) => u.id === g.unknown)) notes.push(`${g.id}: unknown "${g.unknown}" is not one of the catalogue's unknowns for ${g.type}`);
  }

  // -- real questions per course and code: main questions (at least half the marks) first, short to long
  const real = {};
  for (const c of courses) {
    const rows = {};
    for (const q of questions) {
      const inCourse = q.course.id === c.id || (aliasesOf.get(q.id) || []).some((a) => a.course.id === c.id);
      if (!inCourse || !q.tags) continue;
      const marks = {};
      q.tags.parts.forEach((p, i) => p.syllabus.forEach((code) => { marks[code] = (marks[code] || 0) + q.crop.parts[i].marks / p.syllabus.length; }));
      for (const [code, mk] of Object.entries(marks)) (rows[code] = rows[code] || []).push([q.id, q.crop.marks, Math.round((100 * mk) / q.crop.marks)]);
    }
    for (const list of Object.values(rows)) list.sort((a, b) => (b[2] >= 50) - (a[2] >= 50) || a[1] - b[1] || a[0].localeCompare(b[0]));
    real[c.id] = Object.fromEntries(Object.keys(rows).sort(byCode).map((k) => [k, rows[k]]));
  }

  const out = { root, catalogue, E, course, courses, statementsOf, unassigned, notes, real, partCount: allParts.size };
  console.log(`Practice: ${catalogue.types.length} question types, ${E.registry.length} generators, ${unassigned.length} of ${allParts.size} ${course} parts not assigned to a type`);
  return out;
}

// What a practice page needs from the catalogue: window.QB_TYPES.
export function browserCatalogue({ catalogue, courses, statementsOf, real }) {
  return {
    version: 1,
    course: catalogue.course,
    levels: catalogue.levels,
    statements: Object.fromEntries(courses.map((c) => [c.id, statementsOf(c).map((s) => ({ code: s.code, id: s.id, topic: Number(s.topic), title: s.title }))])),
    subtopics: Object.fromEntries(catalogue.subtopics.map((s) => [s.id, { prereqs: s.prereqs, skills: s.skills.map((k) => k.id) }])),
    types: catalogue.types.map((t) => ({
      id: t.id, name: t.name, topic: t.topic, kind: t.source === "exam" ? "exam" : t.kind, courses: t.courses, syllabus: t.syllabus || [], skills: t.skills,
      supports: t.supports || [], levels: t.level || null, parts: (t.parts || []).length,
      unknowns: (t.unknowns || []).map((u) => ({ id: u.id, asked: u.asked, level: u.level })),
      representations: (t.representations || []).map((r) => r.rep),
    })),
    real,
  };
}

// docs/practice-coverage.md: one row per subtopic of the catalogue's course.
export function coverageMarkdown({ catalogue, E, course, courses, statementsOf, unassigned, notes, real, partCount }) {
  const statements = statementsOf(courses.find((c) => c.id === course));
  const gens = E.registry.filter((g) => g.courses.includes(course));
  const examTypes = catalogue.types.filter((t) => t.source === "exam");
  const withGen = new Set(gens.map((g) => g.type));
  const rows = [];
  let minimum = 0, full = 0, realOnly = 0;
  for (const s of statements) {
    const mine = gens.filter((g) => g.syllabus[0] === s.code);
    const levels = [...new Set(mine.flatMap((g) => g.levels))].sort();
    const types = examTypes.filter((t) => t.syllabus.includes(s.code));
    const covered = types.filter((t) => withGen.has(t.id));
    const isMin = levels.includes(2) && (levels.includes(3) || levels.includes(4));
    const isFull = types.length > 0 && covered.length === types.length && types.every((t) => gens.filter((g) => g.type === t.id).length >= 2);
    const nReal = (real[course][s.code] || []).length;
    const only = mine.length === 0;
    if (isMin) minimum++;
    if (isFull) full++;
    if (only) realOnly++;
    rows.push(`| ${s.code} ${s.title} | ${isMin ? "yes" : "no"} | ${isFull ? "yes" : "no"} | ${covered.length} of ${types.length} | ${levels.length ? levels.join(", ") : "-"} | ${mine.length} | ${nReal} | ${only ? "yes" : "no"} |`);
  }
  const bySitting = new Map();
  for (const p of unassigned) {
    const k = p.replace(/-p\d-q\d+(\..*)?$/, "");
    bySitting.set(k, (bySitting.get(k) || 0) + 1);
  }
  const levelCount = (l) => gens.filter((g) => g.levels.includes(l)).length;
  return `# Practice coverage

Generated by \`node scripts/build.mjs\` from \`data/question-types.json\` and the generators in \`assets/js/engine/generators/\`. Do not edit by hand.

Course: **${course}**. ${gens.length} generators over ${withGen.size} question types.
Release minimum reached for **${minimum} of ${statements.length}** subtopics; full tier for ${full}; ${realOnly} still on real questions only.

- **Release minimum:** at least one generator at level 2 and one at level 3 or 4.
- **Full:** every exam question type the catalogue lists for the subtopic has at least two generators (two unknowns or representations).
- **Exam types covered:** catalogue types built from exam parts that name this subtopic, and how many of them have a generator.
- **Real only:** no generator has this subtopic as its first code, so practice serves its past-paper questions, self-marked, short to long.

| Subtopic | Release minimum | Full | Exam types covered | Levels | Generators | Real questions | Real only |
|---|---|---|---|---|---|---|---|
${rows.join("\n")}

Generators per level: ${[0, 1, 2, 3, 4, 5].map((l) => `level ${l}: ${levelCount(l)}`).join(", ")}.

## Bank parts not assigned to a question type

The catalogue was seeded from papers up to May 2025. ${unassigned.length} of ${partCount} ${course} parts are not assigned to any type yet:

| Sitting | Parts |
|---|---|
${[...bySitting.entries()].map(([k, n]) => `| ${k} | ${n} |`).join("\n") || "| (none) | 0 |"}

## Generators whose unknown is not in the catalogue

${notes.length ? notes.map((n) => `- ${n}`).join("\n") : "None."}
`;
}

export function writePractice(ctx, write) {
  write("assets/js/question-types.js", "// Generated by scripts/build.mjs from data/question-types.json and the bank's tags.\nwindow.QB_TYPES = " + JSON.stringify(browserCatalogue(ctx)) + ";\n");
  write("docs/practice-coverage.md", coverageMarkdown(ctx));
}

// For scripts that run outside build.mjs (check-engine.mjs): the same inputs, read from data/.
export function standaloneContext(root = ROOT) {
  const { courses } = readJson(root, "data/courses.json");
  const aaSl = readJson(root, "data/syllabus.json"), aaHl = readJson(root, "data/syllabus-aa-hl.json"), ai = readJson(root, "data/syllabus-ai.json");
  const aa = new Map(), aiT = new Map();
  const row = (s) => ({ code: s.code, id: s.id, topic: String(s.topic || s.code.split(".")[0]), title: s.title, courses: s.courses, subtags: s.subtags || [] });
  for (const s of [...aaSl.statements, ...aaHl.statements]) aa.set(s.code, row(s));
  const aaById = new Map([...aa.values()].map((s) => [s.id, s]));
  for (const s of ai.shared) { const a = aaById.get(s.id); aiT.set(s.code, { ...a, code: s.code, courses: s.courses, subtags: [...a.subtags, ...(s.subtags || [])] }); }
  for (const s of ai.statements) aiT.set(s.code, row(s));
  const tables = { aa, ai: aiT };
  const statementsOf = (c) => [...tables[c.subject].values()].filter((s) => (s.courses || []).includes(c.id)).sort((x, y) => byCode(x.code, y.code));
  const subtagName = new Map();
  for (const t of Object.values(tables)) for (const s of t.values()) for (const st of s.subtags || []) subtagName.set(st.id, st.name);
  const questions = [];
  for (const c of courses) {
    const crops = fs.existsSync(path.join(root, c.crops)) ? readJson(root, c.crops) : {};
    const tags = fs.existsSync(path.join(root, c.tags)) ? readJson(root, c.tags).questions : {};
    for (const [id, crop] of Object.entries(crops)) questions.push({ id, course: c, crop, tags: tags[id] });
  }
  const aliasesOf = new Map();
  const shared = fs.existsSync(path.join(root, "data/shared.json")) ? readJson(root, "data/shared.json").appearances : {};
  for (const [alias, a] of Object.entries(shared)) {
    const m = /^(a[ai]-[sh]l)-/.exec(alias);
    const c = m && courses.find((x) => x.id === m[1]);
    if (!c) continue;
    if (!aliasesOf.has(a.canonical)) aliasesOf.set(a.canonical, []);
    aliasesOf.get(a.canonical).push({ id: alias, course: c });
  }
  return { root, questions, subtagName, courses, statementsOf, aliasesOf };
}
