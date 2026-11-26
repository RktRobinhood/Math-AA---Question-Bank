# Round 4 · From question blocks to test planning

This is an offline feasibility prototype, not an approved test builder. Open index.html in a browser.

1. **Author question:** Every block title and every printed text field is editable in place, including introduction, givens and each maths prompt. The formulas in the two sandbox templates are structured; edit their values rather than executable code. Use the scrollable native textarea on phone and resize it when supported. A linked prompt keeps a live source-part token, inserted with **Insert source reference**. Hidden blocks stay in the draft. The ordering captions are **Block 1, Block 2**; student questions use **(a), (b)**.
2. **Plan test:** The two saved drafts share AA SL 2021 tags. View by course and exam style, add/remove a question, and set your own mark targets. Initial balance: algebra 5/9 (55.6%), functions 4/9 (44.4%). Make the height part worth 4 marks instead of 2: it becomes 6/11 functions. Only one primary skill owns each part's marks; unallocated marks stay visible. The question and key stay together in a draft view. A blocked source or unreviewed course excludes the whole affected question from the counted blueprint rather than suggesting it is covered.
3. **Model check:** an edited question is still a draft. Wording changes can alter what the answer must show. The preview checks reference integrity and bounded math, not fairness, rubric quality or suitability for a real exam.

## Course profile versus a question's demands

The 2021 [AA guide, pp. 72–73](https://www.ibo.org/globalassets/new-structure/university-admission/pdfs/dp-mathematics-analysis-and-approaches-guide-en.pdf) and [AI guide, pp. 74–75](https://www.ibo.org/globalassets/new-structure/university-admission/pdfs/dp-mathematics-applications-and-interpretation-guide-en.pdf) separate **technology conditions** from **response format**:

| Course | Paper 1 | Paper 2 | Paper 3 |
|---|---|---|---|
| AA SL/HL | No technology; short and extended sections | Technology required for the paper; short and extended sections | HL only; technology, extended problem solving |
| AI SL/HL | Technology required; short response | Technology required; extended response | HL only; technology, extended problem solving |

Selection policy should store course, syllabus edition, paper/section profile, response length, command term and tech demand as separate fields. “Technology required for the paper” does not mean every part has to require a calculator. A shared topic ID does not qualify a template for another course. The prototype explains all four policy profiles but only authors and counts its AA SL samples. [2029 is a separate syllabus version](https://www.ibo.org/programmes/diploma-programme/curriculum/mathematics/).

Quadratics show why this matters: an **AA Paper 1** template might ask for an exact vertex reached by completing the square. An **AA Paper 2** sibling might use a quadratic measurement model with realistic decimals, numerical threshold crossings and an interval interpretation. The two can share mathematical functions, but the conditions, representations, commands and marking need separate review. In **AI**, a separately tagged short task might ask students to read a model and report one meaningful value, whereas a reviewed extended task links fitting, interpreting and judging the model. These are design examples, not an automatic claim that the same AA quadratic tag or example transfers to AI.

## Work ahead

| Layer | Can reuse or automate | Requires design or human review |
|---|---|---|
| Existing archive | Read existing course, paper, question/part IDs, syllabus tags and crop structure into a provenance-linked map. Search by skill and cluster comparable demands. | Resolve ambiguous tags, dependencies across pages, figure rights and what may be used in each setting. Do not silently turn old papers into editable/public training records. |
| Template modelling | AI can draft a new original stem, typed parameters, graph specs, possible checks, keys and boundary tests. A bounded deterministic engine can check thousands of generated variants and find duplicates. | A teacher reviews original wording, skill and level, the method, acceptable forms, difficulty parity, use of calculator and rubrics. Exact math does not settle pedagogy. |
| Test authoring | Group parts, preserve references, auto-renumber, recompute totals and show mark mix against teacher targets. Freeze generator revision, seed, paper and key together. | Test-level judgment: timing, overlap, accessible diagrams, progression and whether the topic mix is appropriate. “No mark allocated” is a review finding, not an AI repair. |
| Follow-through | Evaluate a named later calculation against a validated earlier result; keep canonical key separate. | Define when credit would trivialise the next skill, when a wrong branch is invalid, and when method or written evidence is needed. |

The earlier archive audit found **1,466 records**, **1,304 multipart**, with **238** using parts spanning image crops and **576** question/key page-count mismatches. Counts are observations on that snapshot, not OCR accuracy or a rights assessment. This is why I would not start by converting 1,466 items. Keep past exam items as the archival practice library. Separately extract **structures** from reviewed examples, then write original assessable families with original figures, wording and worked keys. Do not release a lightly changed IB item or copy exam art into a commercial toolbox. An exact rights review is separate.

**Pilot gate:** Author six representative original families: two AA exact/calculator contrasts, two AI short/extended contrasts, one cross-topic and one follow-through edge case. Measure authoring/review time across the six, rejected seed frequency, uniqueness by real structure and response-time parity. Run two comparable class tests from frozen variants and inspect rendered paper/key. Only then estimate expansion and staff time. Keep agent-generated drafts unapproved by default. The reusable capability is the typed question model and blueprint, not rewriting every scanned page. Bulk AI should queue drafts and evidence, not publish or self-approve.

Tested in Chromium at 390 light/dark, 768 and 1440 light/dark: visible inline text editing, source token insertion and missing-source rejection, live marks/percentages, draft selection, course-profile mismatch and HL-only Paper 3, draft persistence, no network calls or horizontal page overflow. Not a rich editor, general CAS, verified accessibility certification, print/publishing workflow or syllabus-wide coverage.
