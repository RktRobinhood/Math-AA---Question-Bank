# PDF / DOCX Export Feature — Design Specification

**Status:** Awaiting implementation (blocked on `masks.json` annotation task)
**Decided:** 2026-05-24
**Author:** Matt Pilley

---

## Overview

Allow teachers to select past exam questions from the site, assemble them into a custom test or worksheet, and export the result as a formatted PDF or editable Word document. The output should look like a coherent exam paper, not a patchwork of clippings, and should obscure the original source exam from students.

---

## Entry Points

### 1. Individual question detail page (primary)
Each question page gets an **"Add to output"** button. Once added, the button changes to **"✓ Added"** and acts as a remove toggle — clicking it again removes the question from the basket.

### 2. Question bank bulk-select (secondary)
A **"Select" toggle button** in the question bank filter bar activates selection mode. In this mode, checkboxes appear on all visible question cards. An **"Add to output"** button shows at the top of the bank with a live count (e.g. "Add 5 to output"). Clicking "Select" again exits the mode without adding anything. Already-added questions show their checkbox pre-checked.

---

## Basket (The "Tray")

### Persistence
The basket is stored in **`localStorage`** keyed to this site. It survives page navigation, tab refreshes, and browser restarts. A "Clear all" action wipes it.

### Visibility
The tray is **hidden** until the first question is added. It appears with a subtle slide-up animation on the first add. This keeps the default browsing experience clean for users who are just reviewing questions.

### Collapsed state
A slim bar pinned to the bottom of every page showing:
- Drag icon / open affordance
- Question count (e.g. "6 questions")
- Total marks (e.g. "34 marks")
- "Generate →" button

### Expanded state
Slides up to reveal a reorderable list. Each item shows:

```
[≡]  2023 May P1 TZ2 Q4   [T2]  [6 marks]  [B]  [View →]  ···  [×]
```

- **≡** — drag handle for reordering (left edge)
- **Title** — year, session, paper, TZ, question number
- **Topic badge** — e.g. "T2"
- **Marks chip** — e.g. "6 marks"
- **Section badge** — "A" or "B" (relevant for work-space option)
- **View →** — navigates to the question detail page while keeping the tray open
- **×** — removes the question (positioned far right, visually separated from drag handle to prevent accidental taps)

### Ordering
Drag-to-reorder using the HTML Drag and Drop API (touch-compatible). Default order is the order questions were added.

### Duplicate handling
Silently prevented. If a question already in the basket is added again, nothing happens. The "Add to output" button on its detail page already reflects "✓ Added".

---

## Generate Flow

Clicking "Generate →" opens a **modal** (slides up from the tray). Three sections:

### 1. Output content
Two checkboxes:
- ☑ **Questions** (default: on)
- ☐ **Mark scheme** (default: off)

If both are checked, two separate files are downloaded together.

### 2. Cover sheet
A toggle (default: on). When enabled, an inline editor expands with all fields. Cover sheet settings persist in `localStorage` so they're remembered next session.

### 3. Format
Two large toggle buttons: **PDF** | **Word (.docx)**

A single **"Download"** button at the bottom triggers generation. A spinner shows while images are being fetched and embedded.

---

## Cover Sheet

All fields are individually **toggleable** (on/off) with editable default values. Settings persist in `localStorage`.

### Identity block (default: off)
| Field | Default value |
|---|---|
| School name | _(empty)_ |
| Logo | URL or file upload |
| Teacher name | _(empty)_ |
| Class / course code | _(empty)_ |

### Student block
| Field | Default |
|---|---|
| Name line ("Name: ___________") | on |
| Date line ("Date: ___________") | on |

### Test metadata
| Field | Default |
|---|---|
| Title | "Mathematics: Analysis and Approaches SL" |
| Test date | Today's date |
| Time allowed | Auto-calculated: `round(totalMarks / 80 * 90, 5)` minutes |
| Total marks | Auto-calculated, read-only |

### Instructions (each bullet individually toggleable + editable)
| Instruction | Default |
|---|---|
| Calculator allowed/not allowed | Auto-detected from paper mix; overridable |
| Please write all your answers in the space provided | on |
| Answers and/or work on scrap paper will not be marked | on |
| Show all appropriate work/steps taken | on |
| Unless stated otherwise give all answers as an exact value or rounded to 3 significant figures | on |
| Formula booklet required | on |
| The maximum mark for this test is **[X marks]** | on, auto-filled |

> **Calculator auto-detection:** If all questions are from P1 → "not permitted". If all from P2 → "allowed". If mixed → instruction is shown as "See individual questions" or omitted — teacher can override.

### Marks grid (toggle: on by default)
Auto-generated table showing question numbers (Q1, Q2, ...) with the mark allocation beneath each (e.g. `/6`), a Bonus column, and a Sum column. Labelled "To be filled out by teacher".

---

## Page Layout & Output

### Page size
**A4 portrait** (default). Letter size available as a future option.

### Question images
Each question's `paperImages` webp files are embedded in sequence, full content width. Multi-page questions (those with `paper-02.webp`, etc.) render all pages in order.

### Question header banner
Each question gets a printed banner above its image:
```
Question 1
```
No marks shown in the banner (marks are on the cover sheet grid). No source exam info.

### Question number masking
The original question number printed inside the webp image is masked using the Canvas API before embedding. A white rectangle is painted over the number region using coordinates from `masks.json` (see [Mask Annotation Task](#mask-annotation-task) below). If no mask data exists for a question, the image is embedded unmodified.

### Section B work space
Toggle in the generate modal (default: off). When enabled, a blank ruled page is appended after each Section B question. Default: 1 page per question; user can override the count with a numeric input.

### Renumbering
Questions are always renumbered sequentially from 1 in the output, regardless of their original numbering in the source exam. Mark scheme outputs mirror this renumbering.

### Page numbering
A footer is added to each page: **"Page X of Y"**, bottom-centre, small font. Toggleable in cover sheet options (default: on).

---

## Technical Implementation

### Libraries (client-side only, no server)
- **`pdf-lib`** — PDF assembly (embed images, draw cover sheet, add footer text)
- **`docx.js`** — DOCX assembly (embed images as inline blocks, generate cover sheet table)
- **Canvas API** — apply white-rectangle masks to webp images before embedding

### Image source
`docs/assets/exam-images/{questionId}/paper-01.webp` (and `paper-02.webp` etc.)
Served directly from GitHub Pages. Fetched at generation time via `fetch()`.

### Masks
Loaded from `docs/assets/js/masks.json` as `window.AASL_MASKS`. Structure:
```json
{
  "aa-sl-2021-may-tz1-p1-q01": {
    "paper": [{ "imageIndex": 0, "regions": [
      { "label": "question_number", "x": 44, "y": 58, "width": 32, "height": 20 },
      { "label": "maximum_mark",    "x": 88, "y": 58, "width": 148, "height": 20 }
    ]}],
    "markscheme": [{ "imageIndex": 0, "regions": [
      { "label": "question_number", "x": 44, "y": 72, "width": 32, "height": 22 }
    ]}]
  }
}
```

### Filename convention
| Output | Filename |
|---|---|
| Questions PDF | `test-{YYYY-MM-DD}-{marks}marks.pdf` |
| Mark scheme PDF | `markscheme-{YYYY-MM-DD}-{marks}marks.pdf` |
| Questions DOCX | `test-{YYYY-MM-DD}-{marks}marks.docx` |
| Mark scheme DOCX | `markscheme-{YYYY-MM-DD}-{marks}marks.docx` |

If the teacher entered a custom title, it is slugified and used as the filename prefix instead.

---

## Mask Annotation Task

Before the masking feature can be activated, pixel coordinates for every question's number region must be recorded. This has been handed off as a separate task to another agent.

**Task file:** `MASK_ANNOTATION_TASK.md` (repo root)
**Expected output:** `docs/assets/js/masks.json`
**Blocking:** Question number masking in PDF/DOCX export

The rest of the feature can be built and shipped without `masks.json`. When the file is available, drop it into `docs/assets/js/` and load it with a script tag — the masking pipeline will activate automatically for any questions that have entries.

---

## Implementation Order (suggested)

1. **Basket infrastructure** — localStorage read/write, "Add to output" button state, tray component (collapsed + expanded), drag-to-reorder
2. **Bulk-select mode** — "Select" toggle in question bank, checkbox overlay on cards
3. **Generate modal** — content toggles, format selector, cover sheet editor UI
4. **PDF generation** — cover sheet rendering, image embedding, banner, footer, work space pages
5. **DOCX generation** — same content, docx.js implementation
6. **Masking** — wire up `masks.json` when available, canvas pipeline

---

## Open Items

- [ ] `masks.json` annotation (external task — see `MASK_ANNOTATION_TASK.md`)
- [ ] Letter page size option (future enhancement)
- [ ] Canvas-based thumbnail preview in tray (future enhancement)
- [ ] Auto-sort basket by topic / marks (future enhancement)
