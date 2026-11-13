#!/usr/bin/env node
// Regenerates only the practice engine's generated files, without rebuilding the whole site:
//   assets/js/question-types.js   window.QB_TYPES
//   docs/practice-coverage.md     the coverage table
// `node scripts/build.mjs` writes the same two files as part of a full build.
//   node scripts/build-practice.mjs [--check]   (--check: fail if the files on disk are out of date)
import fs from "node:fs";
import path from "node:path";
import { ROOT, checkPractice, writePractice, standaloneContext } from "./lib/practice-build.mjs";

const errors = [];
const practice = checkPractice({ ...standaloneContext(), errors });
if (errors.length) { console.error(`${errors.length} problem(s):\n  ` + errors.join("\n  ")); process.exit(1); }
const stale = [];
writePractice(practice, (p, text) => {
  const file = path.join(ROOT, p);
  if (process.argv.includes("--check")) { if (!fs.existsSync(file) || fs.readFileSync(file, "utf8") !== text) stale.push(p); return; }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
  console.log("wrote " + p);
});
if (stale.length) { console.error(`Out of date (run node scripts/build-practice.mjs): ${stale.join(", ")}`); process.exit(1); }
