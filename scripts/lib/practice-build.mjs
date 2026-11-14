// Practice engine build steps, called from scripts/build.mjs:
//   loadCatalogue()  reads data/question-types.json and merges the fragments in data/question-types/
//   checkPractice()  validates the catalogue against the bank and the engine's generators
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

export const FRAGMENT_DIR = "data/question-types";
// Merges catalogue fragments into the catalogue, in place. A fragment is
//   { "home": "aa-hl", "types": [ ... ], "subtopics": { "AHL1.12": { "prereqs": [...], "skills": [...] } } }
// with types and subtopics in the main file's per-entry format (subtopics as that object keyed by
// statement id, or as the main file's array with an id in each entry). "home" is the course whose
// syllabus codes the fragment's types name; a type may set its own. An id that is already in the
// catalogue (the main file or an earlier fragment) is a problem, never a silent override.
//   fragments   [{file, data}]
export function mergeFragments(catalogue, fragments, problems = []) {
  const where = new Map(catalogue.types.map((t) => [t.id, "data/question-types.json"]));
  const subWhere = new Map(catalogue.subtopics.map((s) => [s.id, "data/question-types.json"]));
  for (const { file, data } of fragments) {
    if (!data || typeof data !== "object" || Array.isArray(data)) { problems.push(`${file}: must be an object {types, subtopics}`); continue; }
    for (const k of Object.keys(data)) if (!["about", "home", "types", "subtopics"].includes(k)) problems.push(`${file}: unknown key "${k}" (a fragment holds about, home, types, subtopics)`);
    if (data.types !== undefined && !Array.isArray(data.types)) { problems.push(`${file}: types must be a list`); continue; }
    for (const t0 of data.types || []) {
      if (!t0 || !t0.id || !t0.name || !Array.isArray(t0.skills)) { problems.push(`${file}: a type needs id, name and skills (${JSON.stringify(t0 && t0.id)})`); continue; }
      if (where.has(t0.id)) { problems.push(`type ${t0.id} listed twice (${where.get(t0.id)} and ${file})`); continue; }
      where.set(t0.id, file);
      const t = { ...t0 };
      if (!t.home && data.home) t.home = data.home;
      if (!t.courses) t.courses = [t.home || catalogue.course];
      catalogue.types.push(t);
    }
    const subs = Array.isArray(data.subtopics) ? data.subtopics : Object.entries(data.subtopics || {}).map(([id, v]) => ({ ...v, id }));
    for (const st of subs) {
      if (!st || !st.id) { problems.push(`${file}: a subtopic needs an id`); continue; }
      if (subWhere.has(st.id)) { problems.push(`subtopic ${st.id} listed twice (${subWhere.get(st.id)} and ${file})`); continue; }
      subWhere.set(st.id, file);
      catalogue.subtopics.push({ ...st, prereqs: st.prereqs || [], skills: (st.skills || []).map((k) => (typeof k === "string" ? { id: k } : k)) });
    }
  }
  return catalogue;
}
// The whole catalogue: the main file plus every .json fragment in data/question-types/, in name
// order. catalogue.problems lists what is wrong with the fragments (duplicate ids, bad shape).
export function loadCatalogue(root = ROOT, extraFragments = []) {
  const catalogue = readJson(root, "data/question-types.json");
  const dir = path.join(root, FRAGMENT_DIR);
  const problems = [], fragments = [];
  for (const f of fs.existsSync(dir) ? fs.readdirSync(dir).filter((x) => x.endsWith(".json")).sort() : []) {
    try { fragments.push({ file: `${FRAGMENT_DIR}/${f}`, data: readJson(root, `${FRAGMENT_DIR}/${f}`) }); } catch (e) { problems.push(`${FRAGMENT_DIR}/${f}: ${e.message}`); }
  }
  mergeFragments(catalogue, [...fragments, ...extraFragments], problems);
  Object.defineProperty(catalogue, "problems", { value: problems, enumerable: false });
  return catalogue;
}
const partIdsOf = (q) => q.crop.parts.map((p) => (p.label ? `${q.id}.${p.label}` : q.id));
const byCode = (a, b) => a.split(".").map(Number).reduce((s, n) => s * 100 + n, 0) - b.split(".").map(Number).reduce((s, n) => s * 100 + n, 0);

// Validates the catalogue and the generators. Pushes problems onto `errors`; returns what
// writePractice() needs. Parts of later papers that no type covers are reported, not errors.
//   questions      [{id, course: {id}, crop: {marks, parts}, tags: {parts}}] from build.mjs
//   subtagName     Map of every skill id in the bank's syllabus files
//   courses        data/courses.json courses
//   statementsOf   (course) => [{code, id, topic, title}]
//   aliasesOf      Map canonical question id -> [{course: {id}}] (HL appearances of SL questions)
//   fragments      extra catalogue fragments [{file, data}], for tests
export function checkPractice({ root = ROOT, questions, subtagName, courses, statementsOf, aliasesOf = new Map(), errors, fragments = [] }) {
  const catalogue = loadCatalogue(root, fragments);
  const E = loadEngine(root);
  const course = catalogue.course;   // the default home course of types and generators
  const err = (m) => errors.push(`question-types: ${m}`);
  for (const p of catalogue.problems) err(p);
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
  for (const st of catalogue.subtopics) for (const p of st.prereqs) if (!statementIds.has(p)) err(`subtopic ${st.id}: unknown prerequisite ${p}`);
  // A type names the syllabus codes of its home course (the catalogue's course unless it says
  // otherwise), and its parts are parts of that course's questions.
  const codesOf = new Map(courses.map((c) => [c.id, new Set(statementsOf(c).map((s) => s.code))]));
  const partsOf = new Map(courses.map((c) => [c.id, new Map()])); // course -> part id -> question
  for (const q of questions) if (partsOf.has(q.course.id)) for (const id of partIdsOf(q)) partsOf.get(q.course.id).set(id, q);
  const allParts = partsOf.get(course);
  const assigned = new Set();
  const typeIds = new Set();
  for (const t of catalogue.types) {
    if (typeIds.has(t.id)) err(`type ${t.id} listed twice`);
    typeIds.add(t.id);
    for (const sk of [...t.skills, ...(t.supports || [])]) if (!skillOk(sk)) err(`type ${t.id}: unknown skill ${sk}`);
    const home = t.home || course;
    if (!codesOf.has(home)) { err(`type ${t.id}: unknown home course ${home}`); continue; }
    for (const c of t.courses || []) if (!codesOf.has(c)) err(`type ${t.id}: unknown course ${c}`);
    for (const c of t.syllabus || []) if (!codesOf.get(home).has(c)) err(`type ${t.id}: ${c} is not a syllabus code of ${home}`);
    for (const p of [...(t.parts || []), ...(t.alsoSeenIn || [])]) {
      if (!partsOf.get(home).has(p)) err(`type ${t.id}: unknown part ${p}`);
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
    // its codes are its home course's (courses[0]); any other course it lists must hold them as written too
    for (const c of g.courses) {
      if (!codesOf.has(c)) { err(`generator ${g.id}: unknown course ${c}`); continue; }
      for (const code of g.syllabus) if (!codesOf.get(c).has(code)) err(`generator ${g.id}: ${code} is not in the ${c} syllabus`);
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

  // -- every course: real codes are that course's statements, and each statement can be practised
  const topics = readJson(root, "data/courses.json").topics || {};
  const cat = { statements: Object.fromEntries(courses.map((c) => [c.id, statementsOf(c).map((s) => ({ code: s.code, id: s.id }))])) };
  E.useCatalogue(cat);
  const perCourse = {};
  const empty = [];
  for (const c of courses) {
    const known = new Set(cat.statements[c.id].map((s) => s.code));
    for (const code of Object.keys(real[c.id])) if (!known.has(code)) err(`real questions of ${c.id} are tagged ${code}, which is not in its syllabus`);
    const cov = E.coverage(c.id);
    for (const code of Object.keys(cov)) if (!known.has(code)) err(`generators map to ${c.id} ${code}, which is not in its syllabus`);
    // "Has generated practice" means a generator at one of the levels a student climbs (1 to 4).
    const practised = (code) => Boolean(cov[code] && cov[code].levels.some((l) => l >= 1 && l <= 4));
    for (const s of cat.statements[c.id]) if (!practised(s.code) && !(real[c.id][s.code] || []).length) empty.push(`${c.id} ${s.code}`);
    perCourse[c.id] = { generators: E.generators({ course: c.id }).length, withGenerators: cat.statements[c.id].filter((s) => practised(s.code)).length, statements: known.size };
  }
  for (const g of E.registry) if (!E.generators({ course: g.home }).some((d) => d.id === g.id)) err(`generator ${g.id} is not offered in its home course ${g.home}`);

  const out = { root, catalogue, E, course, courses, statementsOf, unassigned, notes, real, partCount: allParts.size, topics, perCourse, empty };
  // --todo and --todo-sub print JSON lines for other tools: keep their output clean.
  if (!process.argv.some((a) => a.startsWith("--todo"))) console.log(`Practice: ${catalogue.types.length} question types, ${E.registry.length} generators, ${unassigned.length} of ${allParts.size} ${course} parts not assigned to a type; subtopics with generators: ${courses.map((c) => `${c.id} ${perCourse[c.id].withGenerators}/${perCourse[c.id].statements}`).join(", ")}${empty.length ? `; nothing to practise yet: ${empty.join(", ")}` : ""}`);
  return out;
}

// What a practice page needs from the catalogue: window.QB_TYPES.
export function browserCatalogue({ catalogue, courses, statementsOf, real, topics }) {
  return {
    version: 2,
    course: catalogue.course,   // the default home course: generators and types name its syllabus codes unless they set home
    levels: catalogue.levels,
    courses: Object.fromEntries(courses.map((c) => [c.id, { id: c.id, short: c.short, name: c.name, subject: c.subject, level: c.level, papers: c.papers.map((p) => ({ id: p.id, name: p.name, calculator: p.calculator })) }])),
    topics: topics || {},
    statements: Object.fromEntries(courses.map((c) => [c.id, statementsOf(c).map((s) => ({ code: s.code, id: s.id, topic: Number(s.topic), title: s.title }))])),
    subtopics: Object.fromEntries(catalogue.subtopics.map((s) => [s.id, { prereqs: s.prereqs, skills: s.skills.map((k) => k.id) }])),
    types: catalogue.types.map((t) => ({
      id: t.id, name: t.name, topic: t.topic, kind: t.source === "exam" ? "exam" : t.kind, courses: t.courses, home: t.home || catalogue.course, syllabus: t.syllabus || [], skills: t.skills,
      supports: t.supports || [], levels: t.level || null, parts: (t.parts || []).length,
      unknowns: (t.unknowns || []).map((u) => ({ id: u.id, asked: u.asked, level: u.level })),
      representations: (t.representations || []).map((r) => r.rep),
    })),
    real,
  };
}

// docs/practice-coverage.md: one section per course, one row per subtopic.
export function coverageMarkdown({ catalogue, E, course, courses, statementsOf, unassigned, notes, real, partCount, empty }) {
  const examTypes = catalogue.types.filter((t) => t.source === "exam");
  const home = statementsOf(courses.find((c) => c.id === course));
  const homeCode = new Map(home.map((s) => [s.id, s.code]));
  // The statements a type names, as permanent ids (its codes are its home course's).
  const idByCode = new Map(courses.map((c) => [c.id, new Map(statementsOf(c).map((s) => [s.code, s.id]))]));
  const typeStatements = new Map(examTypes.map((t) => [t.id, new Set((t.syllabus || []).map((code) => (idByCode.get(t.home || course) || new Map()).get(code)))]));
  const sections = [], summary = [];
  for (const c of courses) {
    const statements = statementsOf(c);
    const gens = E.generators({ course: c.id });
    const withGen = new Set(gens.map((g) => g.type));
    const rows = [], variety = [];
    let minimum = 0, full = 0, realOnly = 0, nothing = 0;
    for (const s of statements) {
      const mine = gens.filter((g) => g.syllabus[0] === s.code);
      const levels = [...new Set(mine.flatMap((g) => g.levels))].sort();
      // The catalogue's types name home-course codes; a statement of another course meets them through its id.
      const types = examTypes.filter((t) => typeStatements.get(t.id).has(s.id));
      const covered = types.filter((t) => withGen.has(t.id));
      const isMin = levels.includes(2) && (levels.includes(3) || levels.includes(4));
      const isFull = types.length > 0 && covered.length === types.length && types.every((t) => gens.filter((g) => g.type === t.id).length >= 2);
      const nReal = (real[c.id][s.code] || []).length;
      const only = !levels.some((l) => l >= 1 && l <= 4);
      if (isMin) minimum++;
      if (isFull) full++;
      if (only) realOnly++;
      if (only && !nReal) nothing++;
      // Variety: what a student can be asked at the levels they climb (1 to 4), as the Practice page counts it.
      const ways = mine.filter((g) => g.levels.some((l) => l >= 1 && l <= 4));
      const nTypes = new Set(ways.map((g) => g.type)).size;
      if (ways.length) variety.push({ code: s.code, title: s.title, ways: ways.length, types: nTypes });
      const sharedAs = c.id !== course && homeCode.has(s.id) && homeCode.get(s.id) !== s.code ? ` (${course} ${homeCode.get(s.id)})` : "";
      rows.push(`| ${s.code} ${s.title}${sharedAs} | ${isMin ? "yes" : "no"} | ${isFull ? "yes" : "no"} | ${covered.length} of ${types.length} | ${levels.length ? levels.join(", ") : "-"} | ${nTypes || "-"} | ${ways.length || "-"} | ${mine.length} | ${nReal} | ${only ? (nReal ? "yes" : "nothing yet") : "no"} |`);
    }
    const levelCount = (l) => gens.filter((g) => g.levels.includes(l)).length;
    // The thinnest subtopics: fewest ways of asking, then fewest question types.
    variety.sort((a, b) => a.ways - b.ways || a.types - b.types || byCode(a.code, b.code));
    const count = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
    const middle = variety.length ? variety[Math.floor((variety.length - 1) / 2)].ways : 0;
    const thin = variety.length
      ? `**Thinnest subtopics** (fewest ways of asking among the ${variety.length} with generated questions; the middle one has ${middle}): ${variety.slice(0, 8).map((v) => `${v.code} ${v.title} (${count(v.ways, "way")}, ${count(v.types, "type")})`).join("; ")}.\n`
      : "";
    summary.push(`| ${c.short} | ${statements.length} | ${statements.length - realOnly} | ${realOnly - nothing} | ${nothing} | ${gens.length} |`);
    sections.push(`## ${c.short}

${gens.length} generators over ${withGen.size} question types are offered in ${c.short}. ${statements.length - realOnly} of ${statements.length} subtopics have generated questions; ${realOnly} use real questions only${nothing ? ` (${nothing} of them has no question in the bank yet)` : ""}.
Release minimum reached for **${minimum} of ${statements.length}** subtopics; full tier for ${full}.

${thin}${thin ? "\n" : ""}| Subtopic | Release minimum | Full | Exam types covered | Levels | Question types | Ways of asking | Generators | Real questions | Real only |
|---|---|---|---|---|---|---|---|---|---|
${rows.join("\n")}

Generators per level: ${[0, 1, 2, 3, 4, 5].map((l) => `level ${l}: ${levelCount(l)}`).join(", ")}.
`);
  }
  const bySitting = new Map();
  for (const p of unassigned) {
    const k = p.replace(/-p\d-q\d+(\..*)?$/, "");
    bySitting.set(k, (bySitting.get(k) || 0) + 1);
  }
  return `# Practice coverage

Generated by \`node scripts/build.mjs\` from \`data/question-types.json\`, the fragments in \`data/question-types/\` and the generators in \`assets/js/engine/generators/\`. Do not edit by hand.

Every generator is written for a home course, **${course}** unless it names another (\`home\`). It is offered in each course whose syllabus contains all of its statements (matched by permanent statement id, so an AI statement shared with AA gets the same generators under its AI code). Subtopics with no generator are practised with that course's real past-paper questions.

| Course | Subtopics | With generated questions | Real questions only | Nothing yet | Generators offered |
|---|---|---|---|---|---|
${summary.join("\n")}

- **Release minimum:** at least one generator at level 2 and one at level 3 or 4.
- **Full:** every exam question type the catalogue lists for the subtopic has at least two generators (two unknowns or representations).
- **Exam types covered:** catalogue types built from exam parts that name this subtopic, and how many of them have a generator.
- **Question types** and **Ways of asking:** the variety a student meets at levels 1 to 4. Question types are the distinct catalogue types with a generator for the subtopic, which is what the Practice page lets a student tick below a subtopic; ways of asking are those generators (each is one unknown and representation of a type). Practice works through all of them before repeating one. **Generators** also counts level 0 and level 5 ones.
- **Real only:** no generator at levels 1 to 4 has this subtopic as its first code, so practice serves its past-paper questions, self-marked, short to long.
${empty && empty.length ? `- **Nothing yet:** no generator and no tagged question in the bank (${empty.join(", ")}).\n` : ""}
${sections.join("\n")}
## Bank parts not assigned to a question type

The catalogue was seeded from ${course} papers up to May 2025. ${unassigned.length} of ${partCount} ${course} parts are not assigned to any type yet:

| Sitting | Parts |
|---|---|
${[...bySitting.entries()].map(([k, n]) => `| ${k} | ${n} |`).join("\n") || "| (none) | 0 |"}

## Generators whose unknown is not in the catalogue

${notes.length ? notes.map((n) => `- ${n}`).join("\n") : "None."}
`;
}

export function writePractice(ctx, write) {
  write("assets/js/question-types.js", "// Generated by scripts/build.mjs from data/question-types.json, data/question-types/ and the bank's tags.\nwindow.QB_TYPES = " + JSON.stringify(browserCatalogue(ctx)) + ";\n");
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
