// Build the static site from the data files.
//
// Sources of truth:
//   data/courses.json          the four courses, their papers and where their data lives
//   data/syllabus.json         AA SL statements + the tagging rules
//   data/syllabus-aa-hl.json   AA HL's additional statements
//   data/syllabus-ai.json      AI SL / AI HL statements (AI guide numbering)
//   data/syllabus-docs-aa.json AA syllabus reference pages (HTML with formulas)
//   data/crops*.json           per course: images, parts, part marks, anchors (scripts/recrop.py)
//   data/tags*.json            per course: per-part syllabus codes + skill, with review provenance
//   data/shared.json           HL appearances of questions stored once under their SL id
//
// Writes assets/js/data.js, assets/js/courses.js, the app pages (index.html, question-bank/,
// statistics/, syllabus/, syllabus/topic-*/, practice.html), questions/*/index.html and exams/*/index.html. Validates everything first and writes nothing if any check
// fails. A question with crops but no tags yet is published with "tags pending" unless --strict.
//
// Usage: node scripts/build.mjs [--check] [--strict]
//        node scripts/build.mjs --todo <course> [prefix]       list questions still to tag, as JSON lines
//        node scripts/build.mjs --todo-sub <course> [prefix]   list tagged questions with parts still missing sub-tags
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkPractice, writePractice } from "./lib/practice-build.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const exists = (p) => fs.existsSync(path.join(ROOT, p));
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));
const readJsonIf = (p, fallback) => (p && exists(p) ? readJson(p) : fallback);
const checkOnly = process.argv.includes("--check");
const strict = process.argv.includes("--strict");
const argAfter = (flag) => (process.argv.includes(flag) ? process.argv.slice(process.argv.indexOf(flag) + 1) : null);
const todo = argAfter("--todo");
const todoSub = argAfter("--todo-sub");

const { courses, topics } = readJson("data/courses.json");
const courseById = Object.fromEntries(courses.map((c) => [c.id, c]));
const docs = readJson("data/syllabus-docs-aa.json");
const shared = readJsonIf("data/shared.json", { appearances: {} }).appearances;

// ---- syllabus statements, per subject, keyed by the code taggers use -----------
const codeOrder = (c) => c.split(".").map(Number).reduce((a, n) => a * 100 + n, 0);
const tables = { aa: new Map(), ai: new Map() };
const aaSl = readJson("data/syllabus.json");
const aaHl = readJson("data/syllabus-aa-hl.json");
const ai = readJson("data/syllabus-ai.json");
for (const s of [...aaSl.statements, ...aaHl.statements]) {
  tables.aa.set(s.code, { code: s.code, id: s.id, topic: String(s.topic || s.code.split(".")[0]), title: s.title, content: s.content, courses: s.courses, subtags: s.subtags || [] });
}
const aaById = new Map([...tables.aa.values()].map((s) => [s.id, s]));
for (const s of ai.shared) {
  const base = aaById.get(s.id);
  // A shared entry may add AI-only sub-tags after AA's list; AA's own list stays unchanged.
  tables.ai.set(s.code, { ...base, code: s.code, courses: s.courses, subtags: [...base.subtags, ...(s.subtags || [])] });
}
for (const s of ai.statements) {
  tables.ai.set(s.code, { code: s.code, id: s.id, topic: String(s.topic), title: s.title, content: s.content, courses: s.courses, subtags: s.subtags || [] });
}
const label = (s) => `${s.code} ${s.title}`;
const courseStatements = (c) =>
  [...tables[c.subject].values()].filter((s) => s.courses.includes(c.id)).sort((a, b) => codeOrder(a.code) - codeOrder(b.code));

// ---- ids --------------------------------------------------------------------
const ID = /^(aa|ai)-(sl|hl)-(\d{4})-(may|nov)-(tz\d)-(p[123])-q(\d{2})$/;
function parseId(id) {
  const m = id.match(ID);
  if (!m) return null;
  const [, subject, level, year, session, tz, paper, n] = m;
  return {
    course: `${subject}-${level}`, subject, level: level.toUpperCase(), year: Number(year),
    session: session === "may" ? "May" : "Nov", timezone: tz.toUpperCase(), paper: paper.toUpperCase(),
    question: Number(n),
  };
}
const titleOf = (m) => `${m.year} ${m.session} ${m.paper} ${m.timezone} Q${m.question}`;

// ---- load and validate --------------------------------------------------------
const errors = [];
const warnings = [];
// Sub-tags (#5): the skills under each statement, ids "<statement id>.<slug>". AA SL's list is
// Wasteland Academy's skill map; AI statements shared with AA take AA's list.
const subtagName = new Map();
for (const s of [...tables.aa.values(), ...ai.statements.map((x) => tables.ai.get(x.code)), ...ai.shared.filter((x) => x.subtags)]) {
  for (const st of s.subtags) {
    if (!st.id.startsWith(`${s.id}.`)) errors.push(`sub-tag ${st.id}: must start with ${s.id}.`);
    else if (subtagName.has(st.id)) errors.push(`sub-tag ${st.id}: listed twice`);
    subtagName.set(st.id, st.name);
  }
}
let missingSub = 0;
const questions = [];
for (const c of courses) {
  const crops = readJsonIf(c.crops, {});
  const tagFile = readJsonIf(c.tags, { questions: {} }).questions;
  for (const id of Object.keys(tagFile)) if (!crops[id]) errors.push(`${id}: tagged in ${c.tags} but missing from ${c.crops}`);
  for (const [id, crop] of Object.entries(crops)) {
    const m = parseId(id);
    if (!m) { errors.push(`${id}: id does not match ${ID}`); continue; }
    if (m.course !== c.id) { errors.push(`${id}: listed under ${c.id}`); continue; }
    const paper = c.papers.find((p) => p.id === m.paper);
    if (!paper) { errors.push(`${id}: ${c.id} has no ${m.paper}`); continue; }
    if (crop.warnings?.length) errors.push(`${id}: crop warnings: ${crop.warnings.join("; ")}`);
    const sum = crop.parts.reduce((a, p) => a + p.marks, 0);
    if (sum !== crop.marks) errors.push(`${id}: part marks sum ${sum} != ${crop.marks}`);
    if (paper.sections && !["A", "B"].includes(crop.section)) errors.push(`${id}: ${m.paper} needs section A or B`);
    for (const img of [...crop.paperImages, ...crop.markschemeImages]) {
      if (!exists(img)) errors.push(`${id}: missing image ${img}`);
    }
    if (!crop.paperImages.length || !crop.markschemeImages.length) errors.push(`${id}: no paper or markscheme images`);

    const t = tagFile[id];
    if (!t) (strict ? errors : warnings).push(`${id}: no tags yet`);
    else {
      const labels = crop.parts.map((p) => p.label).join("|");
      if (labels !== t.parts.map((p) => p.label).join("|")) errors.push(`${id}: tag part labels != crop part labels (${labels})`);
      for (const p of t.parts) {
        if (!p.syllabus?.length || p.syllabus.length > 3) errors.push(`${id} (${p.label}): needs 1-3 codes`);
        for (const code of p.syllabus || []) {
          const s = tables[c.subject].get(code);
          if (!s) errors.push(`${id} (${p.label}): unknown ${c.subject.toUpperCase()} code ${code}`);
          else if (!s.courses.includes(c.id)) errors.push(`${id} (${p.label}): ${code} is not in the ${c.short} syllabus`);
        }
        if (!p.sub) { missingSub++; continue; }
        // Every sub-tag sits under one of the part's codes, and every code has at least one.
        const codes = (p.syllabus || []).map((code) => tables[c.subject].get(code)).filter(Boolean);
        for (const sub of p.sub) {
          if (!codes.some((s) => s.subtags.some((st) => st.id === sub))) errors.push(`${id} (${p.label}): sub-tag ${sub} is not under ${p.syllabus.join(", ")}`);
        }
        for (const s of codes) {
          if (!p.sub.some((sub) => sub.startsWith(`${s.id}.`))) errors.push(`${id} (${p.label}): ${s.code} has no sub-tag`);
        }
      }
    }
    questions.push({ id, meta: m, course: c, paper, crop, tags: t });
  }
}
const byId = new Map(questions.map((q) => [q.id, q]));
const aliasesOf = new Map();
for (const [alias, a] of Object.entries(shared)) {
  const m = parseId(alias);
  const q = byId.get(a.canonical);
  if (!m) { errors.push(`shared ${alias}: bad id`); continue; }
  if (!q) { errors.push(`shared ${alias}: canonical ${a.canonical} not found`); continue; }
  if (byId.has(alias)) errors.push(`shared ${alias}: also has its own crops entry`);
  const c = courseById[m.course];
  const paper = c?.papers.find((p) => p.id === m.paper);
  if (!paper) { errors.push(`shared ${alias}: no such course/paper`); continue; }
  if (c.subject !== q.course.subject) errors.push(`shared ${alias}: subject differs from ${a.canonical}`);
  if (paper.sections && !["A", "B"].includes(a.section)) errors.push(`shared ${alias}: needs section A or B`);
  if (q.tags) for (const p of q.tags.parts) for (const code of p.syllabus) {
    if (!tables[c.subject].get(code)?.courses.includes(c.id)) errors.push(`shared ${alias}: ${code} is not in the ${c.short} syllabus`);
  }
  if (!aliasesOf.has(a.canonical)) aliasesOf.set(a.canonical, []);
  aliasesOf.get(a.canonical).push({ id: alias, meta: m, course: c, paper, section: paper.sections ? a.section : null });
}

const practice = checkPractice({ root: ROOT, questions, subtagName, courses, statementsOf: courseStatements, aliasesOf, errors });
if (errors.length) {
  console.error(`${errors.length} problem(s):\n  ` + errors.join("\n  "));
  process.exit(1);
}
if (todo) {
  // A tagging worklist: one JSON line per untagged question, with its parts, marks and images.
  const [courseId, prefix = ""] = todo;
  for (const q of questions) {
    if (q.course.id !== courseId || q.tags || !q.id.startsWith(prefix)) continue;
    console.log(JSON.stringify({ id: q.id, marks: q.crop.marks, parts: q.crop.parts.map((p) => ({ label: p.label, marks: p.marks })),
      paperImages: q.crop.paperImages, markschemeImages: q.crop.markschemeImages }));
  }
  process.exit(0);
}
if (todoSub) {
  const [courseId, prefix = ""] = todoSub;
  for (const q of questions) {
    if (q.course.id !== courseId || !q.tags || !q.id.startsWith(prefix) || q.tags.parts.every((p) => p.sub)) continue;
    const table = tables[q.course.subject];
    console.log(JSON.stringify({ id: q.id, parts: q.tags.parts.map((p, i) => ({ label: p.label, marks: q.crop.parts[i].marks, syllabus: p.syllabus, skill: p.skill,
      subtags: p.syllabus.flatMap((code) => table.get(code)?.subtags.map((st) => st.id) || []) })),
      paperImages: q.crop.paperImages, markschemeImages: q.crop.markschemeImages }));
  }
  process.exit(0);
}
const pending = warnings.length;
console.log(`OK: ${questions.length} questions, ${Object.keys(shared).length} shared appearances, ${pending} without tags yet, ${missingSub} tagged parts without sub-tags yet`);
if (checkOnly) process.exit(0);

// ---- question records ---------------------------------------------------------
const records = [];
for (const q of questions.sort((a, b) => a.id.localeCompare(b.id))) {
  const { meta: m, course: c, crop, tags: t } = q;
  const table = tables[c.subject];
  const parts = crop.parts.map((p, i) => ({
    label: p.label,
    marks: p.marks,
    syllabus: t ? t.parts[i].syllabus.map((code) => label(table.get(code))) : [],
    skill: t ? t.parts[i].skill : "",
    sub: t?.parts[i].sub ? t.parts[i].sub.map((id) => ({ id, name: subtagName.get(id) })) : [],
    anchor: p.anchor,
  }));
  // Question tags: union of part tags, ordered by the marks they carry; ties keep part order,
  // so each part's primary statement comes first.
  const weight = new Map();
  const idOf = new Map();
  if (t) t.parts.forEach((tp, i) => tp.syllabus.forEach((code) => {
    const s = table.get(code);
    weight.set(label(s), (weight.get(label(s)) || 0) + parts[i].marks / tp.syllabus.length);
    idOf.set(label(s), s.id);
  }));
  const syllabus = [...weight.keys()].sort((a, b) => weight.get(b) - weight.get(a));
  const own = { course: c.id, id: q.id, title: titleOf(m), paper: m.paper, timezone: m.timezone, section: q.paper.sections ? crop.section : null, question: m.question };
  const others = (aliasesOf.get(q.id) || []).map((a) => ({
    course: a.course.id, id: a.id, title: titleOf(a.meta), paper: a.meta.paper, timezone: a.meta.timezone, section: a.section, question: a.meta.question,
  }));
  const appearances = [own, ...others];
  const rec = {
    id: q.id,
    url: `questions/${q.id}/`,
    title: own.title,
    course: c.id,
    courses: appearances.map((a) => a.course),
    subject: c.subject,
    level: m.level,
    year: m.year,
    session: m.session,
    paper: m.paper,
    timezone: m.timezone,
    section: own.section,
    question: m.question,
    marks: crop.marks,
    calculator: q.paper.calculator,
    appearances,
    tagged: Boolean(t),
    syllabus,
    statementIds: syllabus.map((s) => idOf.get(s)),
    topicNumbers: [...new Set(syllabus.map((s) => s.split(".")[0]))].sort(),
    parts,
    paperImages: crop.paperImages,
    markschemeImages: crop.markschemeImages,
    // Where the last part stops and the answer space starts (scripts/part_ends.py).
    end: crop.end || null,
  };
  const partName = (l) => (l ? `Part (${l.replace("(", ")(")}` + (l.includes("(") ? "" : ")") : "Question");
  const lines = parts.map((p) => `${partName(p.label)} [${p.marks}]: ${p.skill} → ${p.syllabus.map((s) => s.split(" ")[0]).join(", ")}`);
  rec.bodyText = t ? `${rec.title} — Question breakdown ${lines.join(" ")}` : `${rec.title} — tags pending`;
  rec.searchText = [rec.title, ...others.map((a) => a.title), c.short, rec.year, rec.session, rec.paper, rec.timezone, rec.section, rec.marks, ...syllabus, rec.bodyText]
    .filter((x) => x !== null && x !== undefined).join(" ").toLowerCase();
  records.push(rec);
}
const recById = new Map(records.map((r) => [r.id, r]));
const inCourse = (cid) => records.filter((r) => r.courses.includes(cid));
const appearanceIn = (r, cid) => r.appearances.find((a) => a.course === cid);

// ---- data.js and courses.js ----------------------------------------------------
const courseInfo = courses.map((c) => ({
  id: c.id, subject: c.subject, level: c.level, short: c.short, name: c.name, fullName: c.fullName,
  papers: c.papers, formulaBooklet: c.formulaBooklet, questions: inCourse(c.id).length,
}));
const data = {
  generatedAt: new Date().toISOString(),
  site: "IB Math Question Bank",
  courses: courseInfo.map((c) => ({
    ...c,
    // ahl: the statement is additional higher level, i.e. not in the same subject's SL course.
    statements: courseStatements(courseById[c.id]).map((s) => ({ code: s.code, id: s.id, topic: s.topic, title: s.title, content: s.content,
      ahl: !s.courses.includes(`${c.subject}-sl`) })),
  })),
  topics,
  syllabusDocs: { aa: docs.topics },
  questions: records,
};
const write = (p, text) => {
  fs.mkdirSync(path.dirname(path.join(ROOT, p)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, p), text);
};
write("assets/js/data.js", "window.AASL_DATA = " + JSON.stringify(data) + ";\n");
write("assets/js/courses.js", "// Generated by scripts/build.mjs from data/courses.json.\nwindow.QB_COURSES = " + JSON.stringify(courseInfo) + ";\n");
writePractice(practice, write);

// ---- HTML helpers ---------------------------------------------------------------
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const years = [...new Set(records.flatMap((r) => [r.year]))].sort((a, b) => b - a);
const sittingOrder = (r, a) => `${r.year}-${r.session === "May" ? 0 : 1}-${a.paper}-${a.timezone}-${String(a.question).padStart(2, "0")}`;
// KaTeX is served from the site itself (assets/vendor/katex), so maths renders offline.
const katex = (base) => `
    <link rel="stylesheet" href="${base}assets/vendor/katex/katex.min.css">
    <script defer src="${base}assets/vendor/katex/katex.min.js"></script>`;
// Sets light or dark before the first paint; shell.js owns the toggle.
const THEME = `<script>try{document.documentElement.dataset.theme=localStorage.getItem("qb-theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")}catch(e){}</script>`;

// Every page has the same frame. shell.js draws the top bar (course switch, sections, theme,
// Your paper) and the phone tab bar; the links in <noscript> are for readers without scripts.
function page({ base, baseHref = "", title, nav = "questions", head = "", body, scripts = [], bodyAttrs = "", description = "" }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">${baseHref ? `\n    <base href="${baseHref}">` : ""}
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${esc(title)}</title>${description ? `\n    <meta name="description" content="${esc(description)}">` : ""}
    ${THEME}
    <link rel="stylesheet" href="${base}assets/css/styles.css">${head}
  </head>
  <body data-base="${base}" data-nav="${nav}"${bodyAttrs}>
    <noscript><p class="page"><a href="${base}">Questions</a> · <a href="${base}statistics/">Statistics</a> · <a href="${base}syllabus/">Syllabus</a> · <a href="${base}practice.html">Practice</a></p></noscript>
${body}
    <script src="${base}assets/js/courses.js"></script>
    <script src="${base}assets/js/course.js"></script>
    <script src="${base}assets/js/shell.js"></script>
${scripts.map((s) => `    ${s}`).join("\n")}
  </body>
</html>
`;
}

// ---- the three app pages (and their older addresses) --------------------------------
const SITE_TITLE = "IB Math Question Bank: AA SL, AA HL, AI SL, AI HL";
const SITE_DESC = "Searchable IB Mathematics exam question bank and statistics for AA SL, AA HL, AI SL and AI HL.";
function appPage(file, base, tab, { topic = null, title = SITE_TITLE } = {}) {
  write(file, page({
    // <base> lets the app use the same site-relative links from every address it is served at.
    base: "./", baseHref: base, title, nav: tab, description: SITE_DESC,
    head: katex("./"),
    bodyAttrs: ` data-initial-tab="${tab}"${topic === null ? "" : ` data-topic="${topic}"`}`,
    body: `    <div id="app"><div class="loading">Loading the question bank…</div></div>`,
    scripts: ["data.js", "basket.js", "generate.js", "app.js"].map((f) => `<script src="assets/js/${f}"></script>`),
  }));
}
appPage("index.html", "./", "questions");
appPage("question-bank/index.html", "../", "questions");
appPage("statistics/index.html", "../", "statistics");
appPage("syllabus/index.html", "../", "syllabus");
appPage("syllabus/topic-0/index.html", "../../", "syllabus", { topic: 0, title: "Prior knowledge | IB Math Question Bank" });
for (const [topic, name] of Object.entries(topics)) {
  appPage(`syllabus/topic-${topic}/index.html`, "../../", "syllabus", { topic, title: `Topic ${topic}: ${name} | IB Math Question Bank` });
}

// ---- practice (#35) -----------------------------------------------------------------
// The engine files load in the order docs/practice-engine.md gives; every generator file in the
// folder is included, so adding a topic file needs no change here.
const generatorFiles = fs.readdirSync(path.join(ROOT, "assets/js/engine/generators")).filter((f) => f.endsWith(".js")).sort();
write("practice.html", page({
  base: "./", title: "Practice | IB Math Question Bank", nav: "practice",
  description: "Adaptive IB Mathematics AA SL practice: generated questions with worked solutions, by subtopic.",
  head: `\n    <link rel="stylesheet" href="assets/vendor/katex/katex.min.css">`,
  body: `    <div id="app"><div class="loading">Loading practice…</div></div>`,
  scripts: [
    "vendor/katex/katex.min.js", "js/question-types.js", "js/engine/engine.js", "js/engine/graph.js", "js/engine/learner.js",
    ...generatorFiles.map((f) => `js/engine/generators/${f}`), "js/basket.js", "js/generate.js", "js/practice.js",
  ].map((f) => `<script src="assets/${f}"></script>`),
}));

// ---- question pages ---------------------------------------------------------------
const partLabel = (l) => `(${l.replace("(", ")(")}` + (l.includes("(") ? "" : ")");
const codeOf = (s) => s.split(" ")[0];
const topicNo = (s) => codeOf(s).split(".")[0];
const chip = (s) => `<span class="st c${topicNo(s)}" title="${esc(s)}">${esc(codeOf(s))}</span>`;
const appearanceText = (a) => `${courseById[a.course].short} · ${a.paper} · Q${a.question}`;
const longTitle = (r, a) => `${r.year} ${r.session} · ${courseById[a.course].papers.find((p) => p.id === a.paper).name} · ${a.timezone} · Question ${a.question}`;
const codeTitle = (r) => `${r.year} ${r.session} · ${r.paper} · ${r.timezone} · Q${r.question}`;
const slim = (r) => ({
  id: r.id, title: r.title, marks: r.marks, section: r.section, paper: r.paper, year: r.year, session: r.session,
  timezone: r.timezone, course: r.course, courses: r.courses, topicNumbers: r.topicNumbers,
  paperImages: r.paperImages, markschemeImages: r.markschemeImages,
  parts: r.parts.map((p) => ({ label: p.label, marks: p.marks, skill: p.skill, syllabus: p.syllabus })),
});

// Each part runs from its anchor to the next part's anchor, across page breaks. The last part
// stops at the question's "end" (where the answer space starts), not at the bottom of the image.
function partRegions(r) {
  return r.parts.map((p, i) => {
    const from = p.anchor;
    const to = r.parts[i + 1]?.anchor || r.end || { image: r.paperImages.length - 1, y: 1 };
    const out = [];
    for (let im = from.image; im <= to.image; im++) {
      const y0 = im === from.image ? from.y : 0;
      const y1 = im === to.image ? to.y : 1;
      if (y1 > y0) out.push({ image: im, y0, y1 });
    }
    return out;
  });
}
function questionSheet(r, base) {
  const regions = partRegions(r);
  const pct = (x) => `${+(x * 100).toFixed(2)}%`;
  return r.paperImages.map((src, im) => {
    // A region starts half a line above its anchor, so the shading covers the part's first line.
    const overlay = r.parts.flatMap((p, i) => regions[i].filter((g) => g.image === im).map((g) => {
      const up0 = g.y0 > 0 ? 10 : 0;
      const up1 = g.y1 < 1 && r.parts[i + 1] ? 10 : 0;
      return `<span class="region" data-part="${i}" style="top:calc(${pct(g.y0)} - ${up0}px);height:calc(${pct(g.y1 - g.y0)} + ${up0 - up1}px)"></span>`;
    })).join("");
    return `<div class="qpage"><img src="${base}${src}" alt="Question, page ${im + 1}"${im ? ' loading="lazy"' : ""}>${overlay}</div>`;
  }).join("");
}

function related(r) {
  const mine = new Set(r.statementIds);
  return records
    .filter((o) => o.id !== r.id && o.courses.some((c) => r.courses.includes(c)))
    .map((o) => {
      const shared = o.syllabus.filter((s, i) => mine.has(o.statementIds[i]));
      const union = new Set([...o.statementIds, ...r.statementIds]).size;
      return { o, score: shared.length / union, shared };
    })
    .filter((x) => x.shared.length > 0)
    .sort((a, b) => b.score - a.score || b.shared.length - a.shared.length || b.o.year - a.o.year || a.o.id.localeCompare(b.o.id))
    .slice(0, 10);
}

const generated = new Set();
for (const r of records) {
  const base = "../../";
  const c = courseById[r.course];
  const similar = related(r);
  const pageQ = { ...slim(r), parts: r.parts, end: r.end };
  const head = `\n    <script>window.AASL_Q=${JSON.stringify(pageQ).replace(/</g, "\\u003c")};window.AASL_SIMILAR=${JSON.stringify(similar.map((x) => slim(x.o))).replace(/</g, "\\u003c")};</script>`;
  const multi = r.parts.length > 1;
  // A shared question takes the heading of its appearance in the reader's course (course.js).
  const titles = Object.fromEntries(r.appearances.map((a) => [a.course, longTitle(r, a)]));
  const note = [r.section ? `Section ${r.section}` : null, r.calculator ? "Calculator allowed" : "No calculator", c.short].filter(Boolean).join(" · ");
  const split = new Map();
  for (const p of r.parts) for (const s of p.syllabus) split.set(s, (split.get(s) || 0) + p.marks / p.syllabus.length);
  const balance = [...split].sort((a, b) => b[1] - a[1])
    .map(([s, m]) => `<i class="bg${topicNo(s)}" style="flex:${+m.toFixed(1)}" title="${esc(s)}: ${+m.toFixed(1)} marks"></i>`).join("");
  const parts = r.parts.map((p, i) => `
          <button type="button" class="part" data-part="${i}" aria-expanded="false">
            <span class="l">${multi ? esc(partLabel(p.label)) : "All"}</span><span class="s">${esc(p.skill || "Whole question")}</span><span class="mk">[${p.marks}]</span>${p.syllabus.length ? `
            <span class="tg">${p.syllabus.map(chip).join("")}${esc(p.syllabus.map((s) => s.slice(codeOf(s).length + 1)).join("; "))}</span>` : ""}${p.sub.length ? `
            <ul class="subs">${p.sub.map((st) => `<li>${esc(st.name)}</li>`).join("")}</ul>` : ""}
          </button>`).join("");
  const sim = similar.map(({ o, shared }, i) => `
          <div class="sm${i >= 3 ? " extra" : ""}">
            <a href="${base}questions/${o.id}/"><span class="th"><img src="${base}${o.paperImages[0]}" alt="" loading="lazy"></span>
              <span><b>${esc(codeTitle(o))}</b><span>[${o.marks}] · shares ${esc(shared.map(codeOf).join(", "))}</span></span></a>
            <button type="button" class="add" data-add="${o.id}">+</button>
          </div>`).join("");
  const body = `    <div class="qwrap">
      <div class="qmain">
        <div class="crumb" id="q-crumb">
          <a href="${base}">Questions</a><span>/</span><a href="${base}exams/${r.year}/">${r.year}</a><span>/</span><span>${esc(c.short)} ${esc(r.title)}</span>
        </div>
        <div class="qh">
          <h1${r.appearances.length > 1 ? ` data-course-titles="${esc(JSON.stringify(titles))}"` : ""}>${esc(longTitle(r, r.appearances[0]))}</h1>
          <span class="mk">[${r.marks}]</span><span class="x">${esc(note)}</span>
        </div>
        <div class="tabs" role="tablist">
          <button type="button" class="tab on" data-tab="question" role="tab">Question</button>
          <button type="button" class="tab" data-tab="markscheme" role="tab">Markscheme</button>
          <button type="button" class="tab tab-wide" data-tab="both" role="tab">Side by side</button>
          <button type="button" class="tab tab-phone" data-tab="parts" role="tab">Parts</button>
          <button type="button" class="tab tab-phone" data-tab="similar" role="tab">Similar</button>
          <span class="z">Zoom <button type="button" data-zoom="-1" aria-label="Zoom out">−</button><output id="q-zoom">100%</output><button type="button" data-zoom="1" aria-label="Zoom in">+</button>
            <button type="button" id="q-full">⤢ Full screen</button></span>
        </div>
        <div class="qview" id="q-view">
          <div class="sheet" data-pane="question"><div class="sheet-in">${questionSheet(r, base)}</div></div>
          <div class="sheet" data-pane="markscheme" hidden><div class="sheet-in">${r.markschemeImages.map((src, i) => `<div class="qpage"><img src="${base}${src}" alt="Markscheme, page ${i + 1}" loading="lazy"></div>`).join("")}</div></div>
        </div>
      </div>
      <aside class="rail">
        <div class="row rail-actions"><button type="button" class="btn add-main" data-add="${r.id}" data-add-label>+ Add to paper</button><button type="button" class="btn ghost" id="q-copy">Copy link</button></div>${r.appearances.length > 1 ? `
        <div class="rail-parts"><h4 class="cap">Appears in</h4><div class="ap">${r.appearances.map((a) => `<span class="chip${a.course === r.course ? " on" : ""}" data-appearance="${a.course}">${esc(appearanceText(a))}</span>`).join("")}</div></div>` : ""}
        <div class="rail-parts"><h4 class="cap">Parts <span class="mono">${r.marks} marks</span></h4>${r.tagged ? `
          <div class="bal" style="margin:0 0 4px" role="img" aria-label="Marks by syllabus statement">${balance}</div>${parts}` : `
          <p class="pending">Syllabus tags pending</p>`}
        </div>
        <div class="rail-sim" id="q-similar"><h4 class="cap">Similar questions${similar.length > 3 ? ` <button type="button" id="q-sim-all">See all ${similar.length}</button>` : ""}</h4>${sim || `<p class="note">None yet.</p>`}
        </div>
      </aside>
    </div>
    <div class="qbar" id="q-bar"><a class="btn nav-btn off" id="q-prev" aria-label="Previous question">←</a><button type="button" class="btn" data-add="${r.id}" data-add-label>+ Add to paper</button><a class="btn nav-btn off" id="q-next" aria-label="Next question">→</a></div>`;
  write(`questions/${r.id}/index.html`, page({
    base, title: `${r.title} | IB Math ${c.short}`, head, body,
    scripts: ["basket.js", "generate.js", "question.js"].map((f) => `<script src="${base}assets/js/${f}"></script>`),
  }));
  generated.add(r.id);
  // An HL appearance of a shared question keeps its own address and forwards to the stored copy.
  for (const a of r.appearances.slice(1)) {
    const target = `../${r.id}/?course=${a.course}`;
    write(`questions/${a.id}/index.html`, `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>${esc(a.title)} | IB Math ${esc(courseById[a.course].short)}</title>
    <meta http-equiv="refresh" content="0; url=${target}">
    <link rel="canonical" href="${target}">
  </head>
  <body><p>${esc(courseById[a.course].short)} ${esc(a.title)} is the same question as <a href="${target}">${esc(c.short)} ${esc(r.title)}</a>.</p></body>
</html>
`);
    generated.add(a.id);
  }
}
for (const dir of fs.readdirSync(path.join(ROOT, "questions"))) {
  if (!generated.has(dir)) console.warn(`note: questions/${dir}/ is not in the data any more (left in place)`);
}

// ---- exam year pages --------------------------------------------------------------
for (const year of years) {
  const base = "../../";
  const blocks = courses.map((c) => {
    const rows = inCourse(c.id).filter((r) => r.year === year).map((r) => ({ r, a: appearanceIn(r, c.id) }))
      .sort((x, y) => sittingOrder(x.r, x.a).localeCompare(sittingOrder(y.r, y.a)));
    if (!rows.length) return "";
    const groups = new Map();
    for (const row of rows) {
      const key = `${row.r.session} · ${row.a.paper} · ${row.a.timezone}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    }
    return `
      <div data-course="${c.id}">
        <h2 class="course-title">${esc(c.fullName)}: ${rows.length} questions · <a href="${base}?years=${year}&amp;course=${c.id}">browse with filters →</a></h2>
        <div class="link-grid">${[...groups].map(([key, list]) => `
          <section class="block">
            <div class="block-head"><h2 class="mono">${esc(key)}</h2><p>${list.reduce((t, x) => t + x.r.marks, 0)} marks</p></div>
            <div class="block-body link-list">
              ${list.map(({ r, a }) => `<a href="${base}questions/${r.id}/">Q${a.question}${a.section ? ` · Sec ${a.section}` : ""} <span>[${r.marks}]</span></a>`).join("")}
            </div>
          </section>`).join("")}
        </div>
      </div>`;
  }).join("");
  const body = `    <main class="page">
      <nav class="crumbs"><a href="${base}">Questions</a><span>/</span><span>${year}</span></nav>
      <div class="page-head"><h1>${year} exam questions</h1><span class="muted">Other years: ${years.filter((y) => y !== year).map((y) => `<a href="../${y}/">${y}</a>`).join(" · ")}</span></div>${blocks}
      <p class="empty" data-course-empty hidden>No ${year} papers for this course in the bank yet.</p>
    </main>`;
  write(`exams/${year}/index.html`, page({
    base, title: `${year} Exam Questions | IB Math Question Bank`, body,
    scripts: ["basket.js", "generate.js"].map((f) => `<script src="${base}assets/js/${f}"></script>`),
  }));
}

console.log(`Wrote data.js, courses.js, ${generated.size} question pages, ${years.length} exam year pages, ${Object.keys(topics).length + 1} topic pages and the app pages.`);
