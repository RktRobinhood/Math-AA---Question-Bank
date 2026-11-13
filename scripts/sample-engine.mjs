#!/usr/bin/env node
// Prints sample questions so a generator author can read what students will see.
//   node scripts/sample-engine.mjs [text in generator id] [--seed 1] [--svg]
import { loadEngine } from "./lib/practice-build.mjs";

const E = loadEngine();
const args = process.argv.slice(2);
const seed = args.includes("--seed") ? args[args.indexOf("--seed") + 1] : 1;
const filter = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--seed") || "";
for (const g of E.registry.filter((x) => x.id.includes(filter))) {
  for (const level of g.levels) {
    const q = E.make({ generator: g.id, level, seed, course: g.courses[0] });
    console.log(`\n=== ${g.id}  L${level}  [${q.marks} marks]  ${q.calculator ? "calculator" : "no calculator"}  ${q.syllabus.join(", ")}${g.source ? "  (from " + g.source + ")" : ""}`);
    console.log(q.stem);
    if (q.table) console.log([q.table.head, ...q.table.rows].map((r) => "  | " + r.join(" | ")).join("\n"));
    if (q.graph) console.log(`  [graph: ${q.graph.alt || ""}]` + (args.includes("--svg") ? "\n" + E.graph.toSVG(q.graph) : ""));
    for (const p of q.parts) {
      const a = p.answer;
      const shown = a.kind === "choice" ? a.options.map((o, i) => (i === a.correct ? "*" : " ") + o).join("  /  ") : a.kind === "graph" ? `graph ${"ABCD"[a.correct]} of ${a.options.length}` : a.display + (a.kind === "self" ? "  (self-marked)" : "");
      console.log(`  (${p.label}) [${p.marks}] ${p.prompt}\n      = ${shown}`);
      for (const w of p.working) console.log(`        ${w}`);
    }
  }
}
