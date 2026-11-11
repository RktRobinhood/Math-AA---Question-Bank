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
// Writes assets/js/data.js, assets/js/courses.js, questions/*/index.html, exams/*/index.html
// and syllabus/topic-*/index.html. Validates everything first and writes nothing if any check
// fails. A question with crops but no tags yet is published with "tags pending" unless --strict.
//
// Usage: node scripts/build.mjs [--check] [--strict]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const exists = (p) => fs.existsSync(path.join(ROOT, p));
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));
const readJsonIf = (p, fallback) => (p && exists(p) ? readJson(p) : fallback);
const checkOnly = process.argv.includes("--check");
const strict = process.argv.includes("--strict");

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
  tables.aa.set(s.code, { code: s.code, id: s.id, topic: String(s.topic || s.code.split(".")[0]), title: s.title, content: s.content, courses: s.courses });
}
const aaById = new Map([...tables.aa.values()].map((s) => [s.id, s]));
for (const s of ai.shared) {
  const base = aaById.get(s.id);
  tables.ai.set(s.code, { ...base, code: s.code, courses: s.courses });
}
for (const s of ai.statements) {
  tables.ai.set(s.code, { code: s.code, id: s.id, topic: String(s.topic), title: s.title, content: s.content, courses: s.courses });
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

if (errors.length) {
  console.error(`${errors.length} problem(s):\n  ` + errors.join("\n  "));
  process.exit(1);
}
const pending = warnings.length;
console.log(`OK: ${questions.length} questions, ${Object.keys(shared).length} shared appearances, ${pending} without tags yet`);
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
    statements: courseStatements(courseById[c.id]).map((s) => ({ code: s.code, id: s.id, topic: s.topic, title: s.title, content: s.content })),
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

// ---- HTML helpers ---------------------------------------------------------------
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const years = [...new Set(records.flatMap((r) => [r.year]))].sort((a, b) => b - a);
const sittingOrder = (r, a) => `${r.year}-${r.session === "May" ? 0 : 1}-${a.paper}-${a.timezone}-${String(a.question).padStart(2, "0")}`;

function header(base) {
  const sub = (links) => `<div class="submenu">${links.map(([h, t]) => `<a href="${base}${h}">${esc(t)}</a>`).join("")}</div>`;
  return `
    <header class="site-header">
      <a class="site-brand" href="${base}"><strong>IB Math Question Bank</strong><span>AA SL · AA HL · AI SL · AI HL</span></a>
      <nav class="site-menu" aria-label="Main navigation">
        <div class="menu-group"><button class="site-menu-link" type="button">Question Bank</button>${sub([["question-bank/", "Search all questions"], ...years.map((y) => [`exams/${y}/`, String(y)])])}</div>
        <div class="menu-group"><button class="site-menu-link" type="button">Statistics</button>${sub([["statistics/", "Exam statistics"], ["statistics/?mode=recency", "Recency forecast"], ["statistics/?mode=primacy", "Long-term pattern"]])}</div>
        <div class="menu-group"><button class="site-menu-link" type="button">Syllabus</button>${sub([["syllabus/", "All syllabus topics"], ...Object.entries(topics).map(([n, name]) => [`syllabus/topic-${n}/`, `Topic ${n}: ${name}`])])}</div>
        <a class="site-menu-link" href="${base}practice.html">Practice</a>
        <a class="site-menu-link" data-formula-booklet href="${base}assets/formula-sheet-aasl.pdf" target="_blank">Formula Sheet</a>
      </nav>
    </header>
    <div id="course-bar"></div>`;
}

function page({ base, title, head = "", body, scripts = [] }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${esc(title)}</title>
    <link rel="stylesheet" href="${base}assets/css/styles.css">${head}
  </head>
  <body data-base="${base}">
      <main class="page-shell">
${header(base)}
${body}
      </main>
      <script src="${base}assets/js/courses.js"></script>
      <script src="${base}assets/js/course.js"></script>
${scripts.map((s) => `      ${s}`).join("\n")}
  </body>
</html>
`;
}

const imageStack = (imgs, base) =>
  `<div class="image-stack">${imgs.map((src) => `<img class="exam-image" src="${base}${src}" alt="Cropped exam page" loading="lazy">`).join("")}</div>`;
const appearanceText = (a) => `${courseById[a.course].short} ${a.paper} Q${a.question}`;

function related(r) {
  const mine = new Set(r.statementIds);
  return records
    .filter((o) => o.id !== r.id && o.courses.some((c) => r.courses.includes(c)))
    .map((o) => {
      const shared = o.statementIds.filter((s) => mine.has(s)).length;
      const union = new Set([...o.statementIds, ...r.statementIds]).size;
      return { o, score: shared / union, shared };
    })
    .filter((x) => x.shared > 0)
    .sort((a, b) => b.score - a.score || b.shared - a.shared || b.o.year - a.o.year || a.o.id.localeCompare(b.o.id))
    .slice(0, 10)
    .map((x) => x.o);
}

// ---- question pages --------------------------------------------------------------
const generated = new Set();
for (const r of records) {
  const base = "../../";
  const c = courseById[r.course];
  const pageQ = {
    id: r.id, title: r.title, marks: r.marks, section: r.section, paper: r.paper, year: r.year, session: r.session,
    timezone: r.timezone, course: r.course, courses: r.courses, topicNumbers: r.topicNumbers,
    paperImages: r.paperImages, markschemeImages: r.markschemeImages, parts: r.parts,
  };
  const head = `\n    <script>window.AASL_Q=${JSON.stringify(pageQ).replace(/</g, "\\u003c")};</script>`;
  const sectionText = r.section ? ` - Section ${r.section}` : "";
  const also = r.appearances.length > 1
    ? `\n            <div class="appears-in">Appears in ${r.appearances.map((a) => `<span class="badge${a.course === r.course ? "" : " also"}">${esc(appearanceText(a))}</span>`).join("")}</div>`
    : "";
  const tags = r.tagged
    ? r.syllabus.map((s) => `<a class="tag" href="${base}syllabus/topic-${s.split(".")[0]}/">${esc(s)}</a>`).join("")
    : `<span class="badge pending">Syllabus tags pending</span>`;
  const body = `        <nav class="breadcrumbs"><a href="${base}">Home</a><span>/</span><a href="${base}exams/${r.year}/">${r.year}</a><span>/</span><span>${esc(r.title)}</span></nav>
        <section class="panel static-hero">
          <h1>${esc(c.short)} ${esc(r.title)}</h1>
          <p>${r.marks} marks - ${r.session} ${r.paper} ${r.timezone}${sectionText} - ${esc(c.fullName)}</p>
        </section>
        <div class="page-grid">
          <article class="panel">
            <div class="meta-line">
              <span class="badge">${r.marks} marks</span>
              <span class="badge neutral">${r.paper}</span>
              <span class="badge neutral">${r.timezone}</span>${r.section ? `\n              <span class="badge neutral">Section ${r.section}</span>` : ""}
              <span class="badge neutral">${r.calculator ? "Calculator" : "No calculator"}</span>
            </div>${also}
            <div class="tag-line" style="margin:10px 0 14px;">
              ${tags}
            </div>
            <h2 class="section-title">Question</h2>
            ${imageStack(r.paperImages, base)}
            <details class="details-panel">
              <summary>Markscheme</summary>
              ${imageStack(r.markschemeImages, base)}
            </details>
          </article>
          <aside class="panel side-panel">
            <button id="aasl-add-btn" class="aasl-add-btn">Add to output</button>
            <h2 class="section-title" style="margin-top:16px;">Related questions</h2>
            <div class="link-list">
              ${related(r).map((o) => `<a href="${base}questions/${o.id}/">${esc(courseById[o.course].short)} ${esc(o.title)}</a>`).join("")}
            </div>
          </aside>
        </div>`;
  write(`questions/${r.id}/index.html`, page({
    base, title: `${r.title} | IB Math ${c.short}`, head, body,
    scripts: [
      `<script src="${base}assets/js/basket.js"></script>`,
      `<script src="${base}assets/js/generate.js"></script>`,
      `<script>fetch('${base}assets/js/masks.json').then(r=>r.json()).then(d=>{window.AASL_MASKS=d;}).catch(()=>{});</script>`,
    ],
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
const linkFor = (r, a, base) => `<a href="${base}questions/${r.id}/">${esc(a.title)} - ${r.marks} marks${a.id !== r.id ? ` (${esc(appearanceText(r.appearances[0]))})` : ""}</a>`;
for (const year of years) {
  const base = "../../";
  const blocks = courses.map((c) => {
    const rows = inCourse(c.id).filter((r) => r.year === year).map((r) => ({ r, a: appearanceIn(r, c.id) }))
      .sort((x, y) => sittingOrder(x.r, x.a).localeCompare(sittingOrder(y.r, y.a)));
    if (!rows.length) return "";
    const groups = new Map();
    for (const row of rows) {
      const key = `${row.r.session} ${row.a.paper} ${row.a.timezone}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    }
    return `
        <div data-course="${c.id}">
          <h2 class="course-section-title">${esc(c.fullName)}: ${rows.length} questions</h2>
          <div class="syllabus-grid">${[...groups].map(([key, list]) => `
            <section class="syllabus-card">
              <h2>${esc(key)}</h2>
              <div class="link-list">
                ${list.map(({ r, a }) => linkFor(r, a, base)).join("")}
              </div>
            </section>`).join("")}
          </div>
        </div>`;
  }).join("");
  const body = `        <nav class="breadcrumbs"><a href="${base}">Home</a><span>/</span><a href="${base}question-bank/">Question Bank</a><span>/</span><span>${year}</span></nav>
        <section class="panel static-hero">
          <h1>${year} Exam Questions</h1>
          <p>Questions from the ${year} papers for <span data-course-name>your course</span>.</p>
        </section>${blocks}
        <p class="empty-state" data-course-empty hidden>No ${year} papers for this course in the bank yet.</p>`;
  write(`exams/${year}/index.html`, page({
    base, title: `${year} Exam Questions | IB Math Question Bank`, body,
    scripts: [`<script src="${base}assets/js/basket.js"></script>`, `<script src="${base}assets/js/generate.js"></script>`],
  }));
}

// ---- syllabus topic pages -----------------------------------------------------------
for (const [topic, name] of Object.entries(topics)) {
  const base = "../../";
  const doc = docs.topics.find((d) => String(d.topic) === topic);
  const statementList = (c, list) => `<ul class="statement-list">${list.map((s) => `<li><strong>${esc(s.code)} ${esc(s.title)}</strong><br>${esc(s.content)}</li>`).join("")}</ul>`;
  const aaHlOnly = courseStatements(courseById["aa-hl"]).filter((s) => s.topic === topic && s.id.startsWith("AHL"));
  const aiSl = courseStatements(courseById["ai-sl"]).filter((s) => s.topic === topic);
  const aiHlOnly = courseStatements(courseById["ai-hl"]).filter((s) => s.topic === topic && !s.courses.includes("ai-sl"));
  const content = `
          <article class="syllabus-card" data-course="aa-sl aa-hl">${doc ? doc.html : ""}</article>
          <article class="syllabus-card" data-course="aa-hl"><h2>Additional higher level</h2>${statementList(null, aaHlOnly)}</article>
          <article class="syllabus-card" data-course="ai-sl ai-hl"><h2>Topic ${topic}: ${esc(name)}</h2>${statementList(null, aiSl)}</article>
          <article class="syllabus-card" data-course="ai-hl"><h2>Additional higher level</h2>${statementList(null, aiHlOnly)}</article>`;
  const mapped = courses.map((c) => {
    const rows = inCourse(c.id).filter((r) => r.topicNumbers.includes(topic)).map((r) => ({ r, a: appearanceIn(r, c.id) }))
      .sort((x, y) => sittingOrder(x.r, x.a).localeCompare(sittingOrder(y.r, y.a)));
    return `
            <div data-course="${c.id}">
              <h2 class="section-title">Mapped questions (${rows.length})</h2>
              <div class="link-list">
                ${rows.map(({ r, a }) => linkFor(r, a, base)).join("")}
              </div>
            </div>`;
  }).join("");
  const body = `        <nav class="breadcrumbs"><a href="${base}">Home</a><span>/</span><a href="${base}syllabus/">Syllabus</a><span>/</span><span>Topic ${topic}</span></nav>
        <section class="panel static-hero">
          <h1>Topic ${topic}: ${esc(name)}</h1>
          <p><span data-course-name>Your course</span> syllabus and the exam questions that test it.</p>
        </section>
        <div class="page-grid">
          <div>${content}
          </div>
          <aside class="panel side-panel">${mapped}
          </aside>
        </div>`;
  write(`syllabus/topic-${topic}/index.html`, page({
    base, title: `Topic ${topic}: ${name} | IB Math Question Bank`, body,
    head: `\n    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" crossorigin="anonymous">\n    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js" crossorigin="anonymous"></script>`,
    scripts: [
      `<script src="${base}assets/js/basket.js"></script>`,
      `<script src="${base}assets/js/generate.js"></script>`,
      `<script>window.addEventListener("load",()=>{if(!window.katex)return;document.querySelectorAll(".formula,.formula-inline").forEach(el=>{try{katex.render(el.textContent,el,{displayMode:el.classList.contains("formula"),throwOnError:false});}catch(_){}});});</script>`,
    ],
  }));
}

console.log(`Wrote data.js, courses.js, ${generated.size} question pages, ${years.length} exam year pages and ${Object.keys(topics).length} topic pages.`);
