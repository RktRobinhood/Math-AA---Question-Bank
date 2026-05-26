# IB Math AA SL — Question Bank

A searchable, filterable exam question bank for **IB Mathematics: Analysis and Approaches SL**, built as a static site hosted on GitHub Pages.

## 🔗 [Open the Question Bank](https://rktrobinhood.github.io/Math-AA---Question-Bank/)

---

## Manual

### Overview

The site has five main sections accessible from the top navigation bar: **Question Bank**, **Statistics**, **Syllabus**, **Practice**, and **Formula Sheet**. Questions, markschemes, and exam papers are sourced from official IB past papers (2021–2025) across all time zones.

---

### Question Bank

The main view. Displays all 306 mapped exam questions with filtering and search.

**Filters (left panel)**

- **Topic** — Filter by syllabus topic (1–5). Topic 1 = Numbers & Algebra, 2 = Functions, 3 = Geometry & Trigonometry, 4 = Statistics & Probability, 5 = Calculus.
- **Session** — May or November exam sessions.
- **Time Zone** — TZ0 (November), TZ1, TZ2, TZ3.
- **Paper** — P1 (no calculator) or P2 (GDC allowed).
- **Section** — Section A (short answer) or Section B (extended response).
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

A searchable reference of the full AA SL syllabus, organised by topic. Includes all formulas (rendered with KaTeX), bullet-point content statements, and inline subtopic labels.

**Search** supports the same boolean syntax as the Question Bank (AND, OR, NOT, quoted phrases).

Each topic links through to a dedicated topic page listing all mapped exam questions for that topic.

---

### Practice

An interactive practice mode that generates randomised questions. Separate from the main question bank — accessed via the **Practice** link in the nav bar.

---

### Formula Sheet

Opens the official IB AA SL formula booklet as a PDF in a new tab.

---

## Data

All question data is stored in `assets/js/data.js` and generated from the source exam PDFs using the build script (`scripts/build-site.mjs`). The site is fully static — no server, no database.

| Stat | Value |
|---|---|
| Questions | 306 |
| Exam years | 2021–2025 |
| Sessions | May & November |
| Time zones | TZ0, TZ1, TZ2, TZ3 |
| Papers | P1 (no calc), P2 (GDC) |
