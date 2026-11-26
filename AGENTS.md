# Working on the Question Bank

1. Before changing a workflow, read the [glossary](GLOSSARY.md) and the relevant [decision records](docs/adr/README.md). Verify the rule in the current code or data. If a change conflicts with a decision, say so rather than silently overriding it.
2. Use course-specific syllabus codes and distinguish real exam questions from generated exercises. Start with the [Practice engine](docs/practice-engine.md) or [Calculator Skills player contract](docs/calculator-skills/PLAYER-CONTRACT.md) instead of restating either.
3. Update a glossary term when its meaning is settled. Record a decision only when it is hard to undo, non-obvious, and involved a real trade-off. Keep unsettled ideas out of the glossary and accepted decisions.
4. Review the entry point a student actually uses, including one case that must not work (for example, no Scratchpad on a real exam question). Run `npm ci` and `npm run check` for code or data changes; also run `node scripts/build-practice.mjs --check` when changing Practice generators/catalogue. Report exactly what was verified and what was not.
