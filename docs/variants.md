# Question variants for tests: findings and what was built

Issue [#34](https://github.com/RktRobinhood/Math-AA---Question-Bank/issues/34) asked how a teacher can
"mix up" a paper built from the bank, so a test is not a copy of something students have practised.
This page records the numbers behind the answer and what now exists. Figures are from the bank at
1,466 questions (AA SL 396, AA HL 541, AI SL 386, AI HL 484), November 2026.

## What was built

Both options that need no generator are in the "Your paper" panel and the "Set up and export" screen.

| Option | Where | What it does |
|---|---|---|
| Shuffle | Your paper → **Shuffle** | Puts the questions in a random order. Section A stays before Section B. |
| Versions | Set up and export → **Versions** (1 to 4) | Exports Version A, B, C, D of the same paper. B onwards reorder the questions (Section A before Section B). The version letter is in the cover title and the file name, and each version gets its own markscheme in the matching order. The order depends only on the questions and the version, so exporting again gives the same Version B. With 1 version the export is exactly as before. |
| Swap for a similar question | Your paper → **⇄** on a question (on the Questions, Statistics and Syllabus pages) | Lists up to five real questions that could replace it, best first, with the subtopics they share. **Use** replaces it in place. |

Generated variants (new numbers) are part of the practice engine, [#35](https://github.com/RktRobinhood/Math-AA---Question-Bank/issues/35): a variant is a seeded engine question, printed with its worked solution.

## How "similar" is scored

A candidate must be in the same course and have the same calculator policy, the same section and marks
within 2 (or 25%, if larger) of the original. Candidates are then ranked by

`score = ½ × shared syllabus statements + ½ × shared sub-skills`

where each half is a marks-weighted overlap (shared marks ÷ combined marks, over the per-part tags).
0.5 or more is shown as a "close match", 0.2 to 0.5 as "related", and anything lower is not offered.

## 1. Sibling quality

Share of questions with **at least two** candidates, by how strict the match is:

| Course | Same sub-skills (≥ 0.5) | Sub-skills (≥ 0.34) | Same statements (≥ 0.5) |
|---|---|---|---|
| AA SL | 16% (62 of 396) | 28% | 51% (202) |
| AA HL | 10% | 19% | 35% |
| AI SL | 35% | 56% | 80% |
| AI HL | 10% | 23% | 49% |

- Matching whole questions on sub-skills alone is too strict: 265 of 396 AA SL questions have no such sibling. Sub-skills are fine-grained (286 for AA SL) and a question usually mixes several.
- Matching on statements gives about half of AA SL and four fifths of AI SL two or more candidates. That is why the score blends the two: statements find the candidates, sub-skills rank them.
- **Section B is the thin area.** With the fair sub-skill threshold, 95 of 264 AA SL Section A questions have two candidates, against 16 of 132 Section B questions. Long questions chain several subtopics, and few chains repeat.
- Thinnest by lead subtopic (AA SL, questions with fewer than two close siblings): 3.2 trigonometry (19 of 22), 3.7 circular functions (18 of 18), 5.9 kinematics (17 of 20), 5.10 integration (15 of 16), 3.1 3D geometry (14 of 14), 4.3 statistics (13 of 13).
- **Wasteland Academy's type IDs** (its catalogue maps 306 AA SL questions to 106 exam question types): 47% of those questions have two or more siblings sharing at least half their types. That is close to statement matching (51%) and better than sub-skills alone, but it covers only papers to May 2025 and only AA SL. The bank's own tags cover every course, so the swap uses them.

For a Section B question the realistic route to a fresh equivalent is a generated variant, not a swap.

## 2. Template coverage (before the engine)

The 20 hand-matched practice templates covered 160 of 396 AA SL questions (40%) and 1,451 of 3,520
marks (41%), all from papers to May 2025. 14 of 51 subtopics had no template. #35 replaces the
templates with the engine and tracks coverage per subtopic in `docs/practice-coverage.md`.

## 3. Markschemes

The old templates' `working[]` is a worked solution: enough for a student to check an answer, not
enough to mark a test from, because it has no method and accuracy marks. The engine keeps marks per
part and a worked solution per part. For a generated question on a test, the teacher marks each part
against its worked solution out of the part's marks. Per-line M and A marks are not planned.

## 4. Mixed papers

A paper can mix IB crops with typeset generated questions, but they look different. Simplest
choice, taken here: real questions and generated questions are exported through separate routes
(the paper builder for real questions, "Print a worksheet" in Practice for generated ones), so a
generated question is never mistaken for an IB one.

## 5 and 6. Wasteland Academy

Settled in #35: the engine lives in this repository. Wasteland Academy's catalogue of question types
is copied here once (`data/question-types.json`) and maintained here. Its code is not a dependency.

## 7. Fairness between variants

- Shuffle and Versions use the same questions, so they are equal by construction.
- A swap changes the question. The marks, section and calculator policy are held; difficulty is not measured, so the teacher should read the replacement (its title opens it in a new tab).
- Generated variants: the engine's checks hold a generator to its level's mark range and its type's constraints for every seed (`scripts/check-engine.mjs`). That bounds the spread; it does not prove two draws are equally hard.

## Recommendation

1. Use **Versions** to give neighbouring students different orders, and **Swap** to give different classes or sittings different but equivalent Section A questions.
2. For Section B and for the thin subtopics above, rely on generated variants as the engine's coverage grows.
3. Do not depend on Wasteland Academy at run time.
