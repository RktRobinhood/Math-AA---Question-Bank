// Apply curated syllabus tags and re-cropped images to the static site.
//
// Sources of truth:
//   data/syllabus.json  canonical syllabus statements + tagging rules
//   data/crops.json     images, parts, part marks and anchors (from scripts/recrop.py)
//   data/tags.json      per-part syllabus codes + skill, with review provenance
//
// Updates assets/js/data.js, questions/*/index.html, syllabus/topic-*/index.html
// and exams/*/index.html. Validates everything first and writes nothing if any
// check fails.
//
// Usage: node scripts/apply-tags.mjs [--check]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const readJson = (p) => JSON.parse(read(p));
const checkOnly = process.argv.includes("--check");

const dataText = read("assets/js/data.js");
const PREFIX = "window.AASL_DATA = ";
const data = JSON.parse(dataText.slice(dataText.indexOf("{"), dataText.lastIndexOf("}") + 1));
const syllabus = readJson("data/syllabus.json");
const crops = readJson("data/crops.json");
const tags = readJson("data/tags.json").questions;

const titleOf = Object.fromEntries(syllabus.statements.map((s) => [s.code, `${s.code} ${s.title}`]));
const codeOrder = (c) => c.split(".").map(Number).reduce((a, n) => a * 100 + n, 0);

// ---- validate ---------------------------------------------------------------
const errors = [];
for (const q of data.questions) {
  const c = crops[q.id];
  const t = tags[q.id];
  if (!c) { errors.push(`${q.id}: missing from crops.json`); continue; }
  if (!t) { errors.push(`${q.id}: missing from tags.json`); continue; }
  if (c.warnings?.length) errors.push(`${q.id}: crop warnings: ${c.warnings.join("; ")}`);
  const labels = c.parts.map((p) => p.label);
  const tlabels = t.parts.map((p) => p.label);
  if (labels.join("|") !== tlabels.join("|")) errors.push(`${q.id}: part labels ${tlabels} != crops ${labels}`);
  const sum = c.parts.reduce((a, p) => a + p.marks, 0);
  if (sum !== c.marks) errors.push(`${q.id}: part marks sum ${sum} != ${c.marks}`);
  for (const p of t.parts) {
    if (!p.syllabus?.length || p.syllabus.length > 3) errors.push(`${q.id} (${p.label}): needs 1-3 codes`);
    for (const code of p.syllabus || []) if (!titleOf[code]) errors.push(`${q.id} (${p.label}): unknown code ${code}`);
  }
  for (const img of [...c.paperImages, ...c.markschemeImages]) {
    if (!fs.existsSync(path.join(ROOT, img))) errors.push(`${q.id}: missing image ${img}`);
  }
  if (!c.paperImages.length || !c.markschemeImages.length) errors.push(`${q.id}: no paper or markscheme images`);
}
if (errors.length) {
  console.error(`${errors.length} problem(s):\n  ` + errors.join("\n  "));
  process.exit(1);
}
console.log(`OK: ${data.questions.length} questions validated`);
if (checkOnly) process.exit(0);

// ---- data.js ----------------------------------------------------------------
for (const q of data.questions) {
  const c = crops[q.id];
  const t = tags[q.id];
  q.marks = c.marks;
  q.parts = c.parts.map((p, i) => ({
    label: p.label,
    marks: p.marks,
    syllabus: t.parts[i].syllabus.map((code) => titleOf[code]),
    skill: t.parts[i].skill,
    anchor: p.anchor,
  }));
  // Global tags: union of part tags, ordered by the marks they carry (then syllabus order).
  const weight = new Map();
  for (const p of q.parts) for (const s of p.syllabus) weight.set(s, (weight.get(s) || 0) + p.marks / p.syllabus.length);
  q.syllabus = [...weight.keys()].sort((a, b) => weight.get(b) - weight.get(a) || codeOrder(a) - codeOrder(b));
  q.topicNumbers = [...new Set(q.syllabus.map((s) => s.split(".")[0]))].sort();
  q.paperImages = c.paperImages;
  q.markschemeImages = c.markschemeImages;
  const partName = (l) => (l ? `Part (${l.replace("(", ")(")}` + (l.includes("(") ? "" : ")") : "Question");
  const lines = q.parts.map((p) => `${partName(p.label)} [${p.marks}]: ${p.skill} → ${p.syllabus.map((s) => s.split(" ")[0]).join(", ")}`);
  q.bodyText = `${q.title} — Question breakdown ${lines.join(" ")}`;
  q.searchText = [q.title, q.year, q.session, q.paper, q.timezone, q.section, q.marks, ...q.syllabus, q.bodyText]
    .join(" ").toLowerCase();
}
data.generatedAt = new Date().toISOString();
fs.writeFileSync(path.join(ROOT, "assets/js/data.js"), PREFIX + JSON.stringify(data) + ";\n");

// ---- HTML helpers -----------------------------------------------------------
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function replaceOnce(html, re, fn, where) {
  let n = 0;
  const out = html.replace(re, (...m) => { n++; return fn(...m); });
  if (n !== 1) throw new Error(`${where}: expected 1 match for ${re}, got ${n}`);
  return out;
}
const linkText = (q) => `${q.title} - ${q.marks} marks`;
const questionLink = (q, base) => `<a href="${base}questions/${q.id}/">${esc(linkText(q))}</a>`;
const imageStack = (imgs, base) =>
  `<div class="image-stack">${imgs.map((src) => `<img class="exam-image" src="${base}${src}" alt="Cropped exam page" loading="lazy">`).join("")}</div>`;

function related(q) {
  const mine = new Set(q.syllabus);
  return data.questions
    .filter((o) => o.id !== q.id)
    .map((o) => {
      const shared = o.syllabus.filter((s) => mine.has(s)).length;
      const union = new Set([...o.syllabus, ...q.syllabus]).size;
      return { o, score: shared / union, shared };
    })
    .filter((r) => r.shared > 0)
    .sort((a, b) => b.score - a.score || b.shared - a.shared || b.o.year - a.o.year || a.o.id.localeCompare(b.o.id))
    .slice(0, 10)
    .map((r) => r.o);
}

// ---- question pages ---------------------------------------------------------
const byId = Object.fromEntries(data.questions.map((q) => [q.id, q]));
for (const q of data.questions) {
  const file = path.join(ROOT, "questions", q.id, "index.html");
  let html = fs.readFileSync(file, "utf8");
  const base = "../../";
  const pageQ = {
    id: q.id, title: q.title, marks: q.marks, section: q.section, paper: q.paper, year: q.year,
    session: q.session, timezone: q.timezone, topicNumbers: q.topicNumbers,
    paperImages: q.paperImages, markschemeImages: q.markschemeImages, parts: q.parts,
  };
  html = replaceOnce(html, /<script>window\.AASL_Q=.*?;<\/script>/s,
    () => `<script>window.AASL_Q=${JSON.stringify(pageQ).replace(/</g, "\\u003c")};</script>`, q.id);
  html = replaceOnce(html, /(<section class="panel static-hero">\s*<h1>.*?<\/h1>\s*<p>)\d+ marks/s, (m, a) => `${a}${q.marks} marks`, q.id);
  html = replaceOnce(html, /<span class="badge">\d+ marks<\/span>/, () => `<span class="badge">${q.marks} marks</span>`, q.id);
  html = replaceOnce(html, /(<div class="tag-line"[^>]*>)[\s\S]*?(<\/div>)/,
    (m, a, b) => `${a}\n              ${q.syllabus.map((s) => `<a class="tag" href="${base}syllabus/topic-${s.split(".")[0]}/">${esc(s)}</a>`).join("")}\n            ${b}`, q.id);
  html = replaceOnce(html, /(<h2 class="section-title">Question<\/h2>\s*)<div class="image-stack">.*?<\/div>/s,
    (m, a) => a + imageStack(q.paperImages, base), q.id);
  html = replaceOnce(html, /(<summary>Markscheme<\/summary>\s*)<div class="image-stack">.*?<\/div>/s,
    (m, a) => a + imageStack(q.markschemeImages, base), q.id);
  html = replaceOnce(html, /(Related questions<\/h2>\s*<div class="link-list">)[\s\S]*?(<\/div>)/,
    (m, a, b) => `${a}\n              ${related(q).map((o) => `<a href="${base}questions/${o.id}/">${esc(o.title)}</a>`).join("")}\n            ${b}`, q.id);
  fs.writeFileSync(file, html);
}

// ---- syllabus topic pages ---------------------------------------------------
for (const topic of Object.keys(data.topics)) {
  const file = path.join(ROOT, "syllabus", `topic-${topic}`, "index.html");
  let html = fs.readFileSync(file, "utf8");
  const qs = data.questions.filter((q) => q.topicNumbers.includes(topic));
  html = replaceOnce(html, /(\d+ syllabus hours - )\d+( mapped exam questions)/, (m, a, b) => `${a}${qs.length}${b}`, `topic-${topic}`);
  html = replaceOnce(html, /(Mapped questions<\/h2>\s*<div class="link-list">)[\s\S]*?(<\/div>)/,
    (m, a, b) => `${a}\n              ${qs.map((q) => questionLink(q, "../../")).join("")}\n            ${b}`, `topic-${topic}`);
  fs.writeFileSync(file, html);
}

// ---- exam year pages (link text carries marks) -------------------------------
for (const year of fs.readdirSync(path.join(ROOT, "exams"))) {
  const file = path.join(ROOT, "exams", year, "index.html");
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, "utf8");
  html = html.replace(/<a href="\.\.\/\.\.\/questions\/([^/]+)\/">[^<]*<\/a>/g,
    (m, id) => (byId[id] ? questionLink(byId[id], "../../") : m));
  fs.writeFileSync(file, html);
}

console.log("Applied tags and images to data.js, question pages, topic pages and exam pages.");
