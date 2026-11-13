# IB Math Question Bank: AA SL, AA HL, AI SL, AI HL

A searchable, filterable exam question bank for the four **IB Mathematics** courses, built as a static site hosted on GitHub Pages:

- Analysis and Approaches SL (AA SL)
- Analysis and Approaches HL (AA HL)
- Applications and Interpretation SL (AI SL)
- Applications and Interpretation HL (AI HL)

All four courses are complete from 2021 to May 2026, with every question tagged part by part.

## 🔗 [Open the Question Bank](https://rktrobinhood.github.io/Math-AA---Question-Bank/)

---

## Manual

### Overview

Every page has the same top bar: the course switch (**AA SL**, **AA HL**, **AI SL**, **AI HL**), the four sections (**Questions**, **Statistics**, **Syllabus**, **Practice**), the formula booklet for your course, a light/dark switch and **Your paper**. On a phone the sections move to a tab bar at the bottom.

The site remembers your course and theme. Everything shows the chosen course only. A link can pick the course for the reader with `?course=aa-hl` (or `aa-sl`, `ai-sl`, `ai-hl`).

Some questions appear on both the SL and the HL paper of the same exam, usually earlier in the HL paper. The bank stores each of these once. In the HL course it shows its HL paper and number, with a note such as "also SL Q7".

---

### Questions

The results come first; the filters are in the sidebar (on a phone, behind the **Filters** button).

- **Search** matches a question's code, its syllabus tags, and each part's skill and sub-skill text. Press `/` to jump to it. It understands `AND`, `OR`, `NOT`, `-term`, `"quoted phrases"` and brackets: `(sector OR arc) AND NOT perimeter`.
- **Paper, Section, Sitting, Marks** are small menus. Sitting holds session, time zone and years. Only the filters that apply to your course are shown (Section is for AA papers 1 and 2).
- **Syllabus tree.** Open a topic and set each subtopic to **AND**, **OR** or **NOT**. Pressing the active one clears it.
  - A question matches if it has every AND subtopic, at least one OR subtopic (when any OR is set), and no NOT subtopic.
  - "Any of topic 3" sets OR on every subtopic of that topic.
  - The number beside each subtopic is how many of the questions still in play carry it. A subtopic at 0 is greyed: choosing it cannot refine the list. It stays clickable.
  - The box above the tree always shows the current choice as Must have / Any of / Not.
- **Chips** above the results show every active filter. Press one to remove it, or **Clear all**.
- **Sort** by newest, oldest, marks or paper order; switch between a grid and a compact list. Results load 30 at a time as you scroll.
- **The address bar holds the filters**, so a view can be bookmarked or shared, and comes back when you return from a question. Example: `?and=3.4&or=3.2,3.5&not=3.8&paper=P2&course=aa-sl`.

Each card shows the top of the question, its code, marks as `[6]`, what its parts ask, its subtopics in topic colours, and a **+** button that adds it to your paper.

---

### Question pages

- One heading: exam, paper, time zone, question number, marks, section and calculator policy.
- Tabs for **Question**, **Markscheme** and **Side by side**, with zoom and full screen (for projecting).
- **Back to N results**, **Prev** and **Next** (or the arrow keys) walk through the list you came from, in its order.
- **Parts**: each part's skill, marks and subtopics. Press a part to see its sub-skills and to mark where it sits on the question. Nothing is highlighted until you press.
- **Similar questions**, with what they share and a + button.
- **Add to paper** and **Copy link**.

---

### Your paper, and Set up and export

**Your paper** (top bar) lists the questions you have added, with totals, estimated minutes (80 marks in 90 minutes) and the balance of topics. It is saved in the browser.

- Drag to reorder (arrows on a phone), **×** to remove, **Shuffle** for a random order.
- **⇄** offers similar real questions to swap in: same course, calculator policy, section and similar marks. See [docs/variants.md](docs/variants.md).

**Set up and export** opens the settings beside a live preview of the paper.

- **Include**: question paper, markscheme (separate file), marks grid, page numbers, blank working pages after Section B questions.
- **Hide the original question numbers** (on by default) blanks the exam's own number on each question and markscheme, because the paper numbers them 1, 2, 3.
- **Versions**: export Version A, B, C, D with the same questions in different orders, each with its markscheme.
- **Cover sheet**: school name, logo, teacher, class, title, date, time allowed, total marks, name and date lines. Each has a tick to show or hide it.
- **Instructions to candidates**: five lines, each editable.
- **Download PDF** or **Download Word**.

Your school details and choices are remembered on the device.

---

### Statistics

Recalculated in the browser from the questions in view, so it is up to date as soon as an exam is added.

- **Most examined** is a table of subtopics. Click a column to sort.
  - **Exams**: how many exams included it. An exam is one year, session and time zone, all papers together (AA SL has 22).
  - **Marks per exam**: the typical marks it carries on one exam. Marks are exact: each part's marks go to that part's subtopics.
  - **Questions**, **Paper split** (how many on each paper, so you know whether to practise with a calculator) and **Last seen**.
  - **See questions →** opens the Questions page filtered to that subtopic.
- **Rarely examined** is the same table from the other end.
- **Count recent years more** weights recent exams more heavily. `?mode=recency` in an old link turns it on.
- **Not seen recently** lists subtopics absent from the last two sessions.
- **Questions by topic** counts each question once per topic it covers.
- **Coverage by session** is a grid of questions per subtopic per session. Each cell links to those questions.
- **Change filters** narrows everything to a paper, section, session, time zone or years.

---

### Syllabus

One topic at a time in a single reading column, with the topic list beside it (a picker on a phone).

- AA courses get the reference pages with formulas; AA HL adds its additional higher level statements to each topic. AI courses list every statement, numbered as in the AI guide.
- **See N questions →** beside each subtopic opens the Questions page filtered to it.
- Search covers the whole syllabus and takes the same `AND` / `OR` / `NOT` syntax.

Maths is typeset with KaTeX, which is served from the site. Statement text in `data/syllabus*.json` writes maths as inline `$...$` LaTeX in IB notation (upright d, e, i and P).

---

### Practice

Practice makes its own questions, in the style of exam questions, and adapts to the student. It follows the course chosen in the top bar: AA SL, AA HL, AI SL or AI HL, each with its own scope and progress. The generated questions are written once, for AA SL, and offered in every course whose syllabus holds the same statements, under that course's own codes (AA 1.8 is AI HL 1.11). Subtopics with no generated questions in a course (the AHL and AI-only statements) use that course's real past-paper questions; the page says how many of the chosen subtopics that is.

- **What's the test on?** Tick a whole topic or just the subtopics you need, from as many topics as you like; the box above the list finds a subtopic by code or word. Questions are mixed across everything ticked. During practice each subtopic in the **Practising** bar has an × to drop it, and **+ Add or change** adds more without losing the question on screen. A teacher can press **Copy link to this scope** and share a link such as `practice.html?course=ai-hl&scope=3.2,3.4,3.5&title=Unit%20test`, which switches to that course and opens Practice on exactly those subtopics.
- **Level.** **Adapt to me** is the default. **Easier (levels 1–2)**, **Middle (levels 2–3)** and **Exam level (levels 3–4)** give questions at that difficulty whatever your own level is; those answers are logged and counted but do not move your level.
- **One question at a time.** Answer with a number (fractions such as `3/4` are fine), a choice, or by picking a graph. Longer written parts are marked by you against the worked solution. Paper 1 style questions say "No calculator" in AA; in AI, where every paper allows a calculator, they say "Exact answer expected".
- **After each answer** you see whether it was right, the worked solution, and three buttons: **Next question**, **Another like this** (same question, new numbers) and **Ask it another way** (a different unknown or representation).
- **How levels move.** A subtopic starts at level 2. Two right in a row moves up a level; two wrong out of three moves down. After level 4 come real past-paper questions, then reviews after 3, 7 and 14 days. At level 1, two wrong out of three brings a short refresher on what the subtopic depends on. Each change is explained in a line of plain words.
- **Subtopics without generated questions yet** use their real past-paper questions, shortest first. [docs/practice-coverage.md](docs/practice-coverage.md) lists which those are.
- **Progress** shows where every subtopic stands and what to do next. It is saved in the browser and sent nowhere. **Export progress** and **Import progress** move it between devices; the file holds every course. **Reset** clears only the course on screen.
- **Print a worksheet** makes a fixed set of questions on your scope with an answer key of worked solutions, to print or save as a PDF. **Copy link to this worksheet** gives a link that reproduces the same set.

How the engine works, and how to add a question generator: [docs/practice-engine.md](docs/practice-engine.md). `node scripts/check-engine.mjs` checks every generator over 300 seeds (answers recomputed by a second method, clean numbers, notation, KaTeX rendering, marking, graphs) and runs on every pull request.

---

### Formula booklet

The top bar opens the official IB formula booklet for your course as a PDF in a new tab.

---

## Data

The site is fully static: no server, no database, no build framework. `scripts/build.mjs` generates `assets/js/data.js` and every page from the files in `data/`. Styles are one file, `assets/css/styles.css`, with every colour, size and space as a variable in its first block.

| File | Holds |
|---|---|
| `data/courses.json` | The four courses: their papers (calculator policy is kept separate from the paper number), and where each course's crops and tags live |
| `data/syllabus.json` | The 51 AA SL statements and the tagging rules |
| `data/syllabus-aa-hl.json` | The 32 statements AA HL adds |
| `data/syllabus-ai.json` | AI SL and AI HL statements, numbered as in the AI guide. `shared` lists AI statements whose content matches an AA statement |
| `data/syllabus-docs-aa.json` | The AA syllabus reference pages, with formulas |
| `data/syllabus-docs-aa-hl.json` | The same reference pages for the 32 statements AA HL adds |
| `data/syllabus-docs-ai.json` | The AI syllabus reference pages, one section per AI statement; sections for statements shared with AA repeat the AA page |
| `data/crops.json`, `data/tags.json` | AA SL questions: images, parts, marks, part positions, and per-part tags |
| `data/crops-<course>.json`, `data/tags-<course>.json` | The same for `aa-hl`, `ai-sl` and `ai-hl` |
| `data/shared.json` | HL appearances of questions that are stored once under their SL id |
| `data/question-types.json` | The catalogue of question types for the practice engine: syllabus codes, skills, levels, prerequisites and the bank parts each type covers. Seeded from Wasteland Academy, with the same type and skill ids. See [docs/practice-engine.md](docs/practice-engine.md) |

AA SL keeps the original file names, because Wasteland Academy's `tools/question-types.mjs` reads them.

| AA SL stat | Value |
|---|---|
| Questions | 396 |
| Exam years | 2021–2026 |
| Sessions | May & November |
| Time zones | TZ0, TZ1, TZ2, TZ3 |
| Papers | P1 (no calc), P2 (GDC) |

### Question IDs

`<subject>-<level>-<year>-<session>-<tz>-p<paper>-q<nn>`, for example `aa-hl-2023-may-tz2-p3-q01`. IDs are permanent: other projects point at them.

### Syllabus statements

Every statement has a `code` (the number in that subject's guide, used in the tag files) and a permanent `id` shared with Wasteland Academy's curriculum map: `SL1.1` to `SL5.11` for AA SL, `AHL1.10` to `AHL5.19` for AA HL, and `AI-SL…` / `AI-AHL…` for AI-only content. AA and AI number some topics differently, so an AI question uses AI codes: an AI HL question on infinite geometric series is tagged `1.11`, which is the same statement as AA's `1.8`.

### Syllabus tags

Every question is tagged **per part**: (a), (b), (c)(i) and so on. Each part has its own syllabus statements, marks and a one-line skill description. A question's overall tags are the union of its part tags, ordered by how many marks each statement carries.

- `data/syllabus.json` holds the tagging rules: what each statement covers and when it applies. Boundaries like 5.3 vs 5.6 or 4.9 vs 4.12 are spelled out there.
- `data/tags.json` holds the per-part tags.
  - Each part was tagged by two independent reviewers working blind from the question and markscheme.
  - Where they disagreed, an adjudicator decided and recorded a `rationale`, along with both original tag sets. These parts are marked `"review": "adjudicated"`.
  - To correct a tag, edit this file and re-run the build.
- **Sub-tags** ([#5](https://github.com/RktRobinhood/Math-AA---Question-Bank/issues/5)): each statement lists its `subtags`, the skills inside it, with ids like `SL2.1.gradient`. A part's `sub` names the skills that earn its marks: at least one under each of its codes, and none from other statements.
  - AA SL's sub-tags are Wasteland Academy's skill map (`curriculum/aa-sl.json`), id for id. AI statements shared with AA take AA's list.
  - `node scripts/build.mjs --todo-sub <course> [prefix]` lists tagged questions whose parts still lack sub-tags, with the sub-tags each part may use.
- `data/crops.json` lists, for each question, its section, its images, its parts and their marks, and where each part label sits on the image (`anchor`).
  - `end` is where the last part stops and the answer space begins, so a part's highlight does not run over the writing area. `scripts/part_ends.py` finds it from the image.
- A question that has been cropped but not tagged yet is published with a "Tags pending" badge.

### Rebuilding

Question and markscheme images are cropped straight from the official PDFs. The script finds each question's boundaries from the PDF text, trims page furniture (page numbers, barcodes, "Turn over"), and checks every question's marks against the paper and the markscheme. All images are WebP.

PDFs are named like `AA_HL_2021_May_TZ1_P3_Paper.pdf` and `AA_HL_2021_May_TZ1_P3_Markscheme.pdf`.

```
py -m pip install pymupdf pillow

# Re-crop questions already in the bank
py scripts/recrop.py --pdfs "<vault>/Exams/PDFs" --out assets --manifest data/crops.json

# Add new papers: questions, marks, parts and sections are found in the PDF itself
py scripts/recrop.py --pdfs <dir> --out assets --manifest data/crops-aa-hl.json --discover aa-hl-2021

# Store questions common to the SL and HL papers once (run after both papers are cropped)
py scripts/match_shared.py --sl-pdfs <sl dir> --hl-pdfs <hl dir> --sl-manifest data/crops.json \
    --hl-manifest data/crops-aa-hl.json --prefix aa-hl-2021 --apply

# Record where each question's last part ends (after any re-crop)
py scripts/part_ends.py data/crops.json data/crops-aa-hl.json data/crops-ai-sl.json data/crops-ai-hl.json

py scripts/contact_sheet.py assets/exam-images sheet.png aa-sl-2024-may-tz1-p1-   # eyeball one paper's crops
node scripts/build.mjs              # validates, then writes data.js and the static pages
node scripts/build.mjs --check      # validate only
node scripts/build.mjs --strict     # also fail on questions without tags
node scripts/build.mjs --todo aa-hl # tagging worklist: untagged questions with their parts and images
```

`--discover` reproduces the 306 AA SL crops exactly: the same marks, sections, parts, part positions and image sizes.

`match_shared.py` compares each HL question's text with every question on the SL paper of the same exam. Only same-marks, same-text pairs are merged; near misses are printed for a person to check.

`build.mjs` refuses to write anything if any check fails:
- a tag isn't a statement in that course's syllabus;
- part marks don't sum to the question total;
- an AA paper 1 or 2 question has no section;
- an image is missing;
- a shared appearance points at a question that doesn't exist.
