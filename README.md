# IB Math Question Bank: AA SL, AA HL, AI SL, AI HL

A searchable, filterable exam question bank for the four **IB Mathematics** courses, built as a static site hosted on GitHub Pages:

- Analysis and Approaches SL (AA SL)
- Analysis and Approaches HL (AA HL)
- Applications and Interpretation SL (AI SL)
- Applications and Interpretation HL (AI HL)

AA SL is complete for 2021 to 2025. The other three courses are being added a year at a time.

## 🔗 [Open the Question Bank](https://rktrobinhood.github.io/Math-AA---Question-Bank/)

---

## Manual

### Overview

The site has five main sections accessible from the top navigation bar: **Question Bank**, **Statistics**, **Syllabus**, **Practice**, and **Formula Sheet**. Questions, markschemes, and exam papers are sourced from official IB past papers (2021–2025) across all time zones.

### Choosing your course

The course bar under the navigation picks the course you're studying: **AA SL**, **AA HL**, **AI SL** or **AI HL**. The site remembers your choice. Everything then shows that course only: questions, filters, statistics, the syllabus, exam-year pages and topic pages. A link can pick the course for the reader with `?course=aa-hl` (or `aa-sl`, `ai-sl`, `ai-hl`).

Some questions appear on both the SL and the HL paper of the same exam, usually earlier in the HL paper. The bank stores each of these once. In the HL course it shows its HL paper and number, with a badge such as "Also AA SL P1 Q7", so you can see where it sat on each paper.

---

### Question Bank

The main view. Displays the mapped exam questions for your course, with filtering and search.

**Filters (left panel)**

- **Topic** — Filter by syllabus topic (1–5). Topic 1 = Numbers & Algebra, 2 = Functions, 3 = Geometry & Trigonometry, 4 = Statistics & Probability, 5 = Calculus.
- **Session** — May or November exam sessions.
- **Time Zone** — TZ0 (November), TZ1, TZ2, TZ3.
- **Paper** — P1 and P2, plus P3 for HL. AA P1 is calculator-free; every other paper allows a GDC.
- **Section** — Section A (short answer) or Section B (extended response). AA papers 1 and 2 only.
- **Years** — Toggle individual exam years on/off. Defaults to all years.
- **Reset all filters** — Clears every filter at once.

**Syllabus topic search (AND / OR / NOT boxes)**

Below the main filters are three subtopic selector boxes. Type in the search bar to filter the list of syllabus subtopics, then check items to narrow results:

- **AND** — Question must cover *all* checked subtopics.
- **OR** — Question must cover *at least one* checked subtopic.
- **NOT** — Question must cover *none* of the checked subtopics.

**Text search**

The search bar at the top of the Syllabus tab (and the subtopic filter bar) supports boolean syntax:

| Syntax | Meaning |
|---|---|
| `functions` | Contains "functions" |
| `functions AND trig` | Contains both |
| `functions OR calculus` | Contains either |
| `functions NOT trig` | Contains "functions" but not "trig" |
| `"composite functions"` | Exact phrase |
| `-trig` | Shorthand for NOT trig |
| `(A OR B) AND C` | Grouped logic |

**Question cards**

Each card shows the question title, mark count, topic badges, and the first few syllabus tags. Click a card to open the full question page.

**Select multiple**

Click **Select multiple** (top right of the question list) to enter bulk-select mode. Check individual cards, then click **Add to output** to add them all to the output basket at once.

---

### Individual Question Pages

Clicking a question card opens a dedicated page showing:

- **Question image** — Cropped directly from the official exam paper.
- **Markscheme** — Collapsed by default; click to expand. Shows the official markscheme image(s).
- **Metadata** — Marks, paper, time zone, session, syllabus tags.
- **Related questions** — Questions sharing the most syllabus tags, listed in the sidebar.
- **Add to output** button — Adds the question to the output basket.

---

### Output Basket & Generate

A persistent tray appears at the bottom of the screen once you add questions. It survives page navigation and browser refreshes (stored in localStorage).

**Tray controls**

- **Drag handles** — Reorder questions by dragging the ≡ handle on the left of each row.
- **× button** — Remove a question from the basket.
- **Clear all** — Empties the basket.
- **Generate** — Opens the export modal.

**Generate modal**

Produces a custom exam paper or markscheme from your selected questions.

- **Include questions / Include markscheme** — Toggle what to export.
- **Format** — PDF or Word document (DOCX).
- **Cover sheet** — Toggle a formatted cover page on/off.

**Cover sheet options**

- School name, teacher name, class code (each can be shown/hidden individually).
- School logo upload (PNG/JPG).
- Student name line and date line.
- Custom title (defaults to "Mathematics: Analysis and Approaches SL").
- Test date, time allowed, total marks, and a marks grid.
- Calculator and answer space instructions (text is editable).

The generated file assembles the question images in your chosen order, with page breaks between questions and correct A4 sizing.

---

### Statistics

Analyses the filtered question set to surface exam patterns. Uses the same filters as the Question Bank (topic, session, paper, etc.).

**Forecast weighting**

Three modes control how exam years are weighted:

- **Neutral** — All years count equally.
- **Recency** — Recent years weighted more heavily; highlights trending topics.
- **Primacy** — Older years weighted more heavily; reveals long-standing patterns.

**Forecast — most likely topics**

Ranked list of subtopics by a composite score combining weighted frequency, mark share, and sitting coverage. The "sitting %" column shows how often a subtopic has appeared across all exam sittings (May and November counted separately).

**Topic spread**

Bar chart showing how questions are distributed across the five syllabus topics.

**Paper & section breakdown**

Shows the split between P1/P2 and Section A/Section B for the current filtered set.

**Coverage heatmap**

Grid showing questions per subtopic per exam sitting (columns = sittings, rows = top subtopics). Darker cells = more questions in that sitting. M = May, N = November.

---

### Syllabus

A searchable reference of your course's syllabus, organised by topic. AA courses get the full reference pages with formulas (rendered with KaTeX); AA HL adds its additional higher level statements under each topic. AI courses list every statement, numbered as in the AI guide.

**Search** supports the same boolean syntax as the Question Bank (AND, OR, NOT, quoted phrases).

Each topic links through to a dedicated topic page listing all mapped exam questions for that topic.

---

### Practice

An interactive practice mode that generates randomised questions. Separate from the main question bank — accessed via the **Practice** link in the nav bar. Practice covers AA SL.

---

### Formula Sheet

Opens the official IB formula booklet for your course as a PDF in a new tab: the AA SL booklet, the full AA booklet for AA HL, or the AI booklet.

---

## Data

The site is fully static — no server, no database. `scripts/build.mjs` generates `assets/js/data.js` and every static page from the files in `data/`.

| File | Holds |
|---|---|
| `data/courses.json` | The four courses: their papers (calculator policy is kept separate from the paper number), and where each course's crops and tags live |
| `data/syllabus.json` | The 51 AA SL statements and the tagging rules |
| `data/syllabus-aa-hl.json` | The 32 statements AA HL adds |
| `data/syllabus-ai.json` | AI SL and AI HL statements, numbered as in the AI guide. `shared` lists AI statements whose content matches an AA statement |
| `data/syllabus-docs-aa.json` | The AA syllabus reference pages, with formulas |
| `data/crops.json`, `data/tags.json` | AA SL questions: images, parts, marks, part positions, and per-part tags |
| `data/crops-<course>.json`, `data/tags-<course>.json` | The same for `aa-hl`, `ai-sl` and `ai-hl` |
| `data/shared.json` | HL appearances of questions that are stored once under their SL id |

AA SL keeps the original file names, because Wasteland Academy's `tools/question-types.mjs` reads them.

| AA SL stat | Value |
|---|---|
| Questions | 342 |
| Tagged parts | 973 |
| Exam years | 2021–2025 |
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
- `data/crops.json` lists, for each question, its section, its images, its parts and their marks, and where each part label sits on the image (`anchor`).
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
