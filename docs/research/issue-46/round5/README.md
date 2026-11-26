# Question Studio #46 · Round 5 feasibility handoff

**Open `Question-Studio-Prototype.html` in a browser.** Single file, no assets or internet required. This is an original **AA SL** feasibility model under a human design gate, not an approved question engine, production bank change, or release.

## What to try

1. **Arrange versus compile.** Drag a card by its handle, or focus the handle and use arrows. Its placement never changes the printed order. Click an output then an input to connect, or use the editor's source selector. Try the independently available **Evaluate the model** part: give it preference 1 and give **Differentiate** preference 2. It moves to (a) while peak time still follows differentiation. For exact preference ties, the prototype uses stable block order after prerequisite resolution. Open **Add an order-only instruction** to try **Find maximum height → Find peak time**; this contradicts the answer link and blocks compilation.
2. **Distinguish model and answer.** The dashed lines supply the given model without creating a numbered part. The solid lines create actual printed answer references. Hide **Differentiate** while **Find peak time** refers to it. Compilation stops. Explicitly choose standalone wording for peak time to write a question that stands on the given function instead. Nothing inserts the hidden derivative into the student prompt. The teacher key recomputes it. Surviving part letters update automatically.
3. **Try a test.** Add a compiled question to the test. Reopen, change marks or a prompt, and check that the pinned test is unchanged. Replace the pinned revision deliberately to update both the paper and the key. Export an editable version-1 JSON file, then import it in another browser. This moves the working draft and pinned questions. Print/saving PDF is a browser action; an editable file is not a PDF or a synchronised account.

## Decisions and constraints

| Decision | Reason |
|---|---|
| One semantic graph, independent display coordinates | Prevent an innocuous canvas rearrangement from changing a test. Prerequisites first; explicit preference for ready parts; stable tie fallback only. |
| Two dependency kinds and explicit standalone rewrite | A shared given merely supports computation. “Using your answer to (a)” claims an earlier printed assessment exists. Missing visible answers and order cycles are errors, not auto-rewrites. |
| One compiled part record per question | The same IDs, order, letters and marks build both outputs. The answer key is canonical, not an implementation of all follow-through marking rules. |
| Local draft and pinned placements | Work can be recovered without accounts. Draft edits don't silently mutate a prepared test. JSON import validates version, allowed IDs and types. |
| Bounded original templates first | This prototype supports one exact quadratic model family, mapped roles, modular editing and a checked small parameter set. It does not prove arbitrary combinations, grading, broad course scope, semantic validity of rewritten prose, or infinite unique items. In production require review of difficulty, answer equivalence, teacher rubric, accessibility and paper policy. |

## From archive to original template families

Canonically deduplicated structural triage found **1,466** question records, **1,304** with at least two tagged parts, and **387** with a cross-topic progression of first-listed syllabus tags. **134** contain Functions before Calculus; **38** contain Functions → Calculus → Functions. These are candidates for review, **not confirmed dependencies**. Split F→C / F→C→F: AA SL 31/5, AA HL 47/18, AI SL 23/6, AI HL 33/9. Corpus and counting notes remain separate from the prototype. No exam wording, images or questions are embedded.

1. Select a balanced set of canonical tagged IDs and cluster the role shapes (given/model → method → intermediate answer → interpretation, plus branches/siblings).
2. Review whether the apparent edge means a printed follow-through, shared data, an editorial order constraint, or no dependency. Keep provenance in the internal classification list; count appearances separately.
3. Author new wording, figures, numerical domains and marking evidence for each original family. Check a small cross-course sample against the **correct** course/Paper profile instead of treating one AA SL draft as valid everywhere.
4. Before shipping, agree a schema for port types and unit semantics, stable IDs, answer equivalence and assessment policies. Test hidden sources, cyclic precedence, invalid inputs, tie resolution, accessible drag alternatives, portability, and exact print/key parity. Show the teacher examples drawn from the family and require manual approval; leave source exams in the archive.

No branch, issue comment, labels, public deployment, or archive was mutated.
