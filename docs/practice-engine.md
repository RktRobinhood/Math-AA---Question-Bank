# Practice engine

Reference for whoever builds the practice screen and for whoever writes generators. The design is in issue #35. The coverage table is in [practice-coverage.md](practice-coverage.md).

The engine is plain JavaScript with no DOM access, no `Math.random()` and no network. It runs from `<script>` tags and under Node. Everything hangs off one global, `QBEngine`.

## Files and load order

```html
<script src="assets/js/question-types.js"></script>           <!-- window.QB_TYPES (generated) -->
<script src="assets/js/engine/engine.js"></script>            <!-- QBEngine: make, mark, variants, worksheet, fmt, ans -->
<script src="assets/js/engine/graph.js"></script>             <!-- QBEngine.graph -->
<script src="assets/js/engine/learner.js"></script>           <!-- QBEngine.learner (needs engine.js) -->
<script src="assets/js/engine/generators/topic1.js"></script> <!-- generators register themselves -->
<!-- ... then every other file in generators/ (topic2.js ... topic5.js and any file added beside them) -->
```

`engine.js` first, `graph.js` before any generator file, then **every file in `generators/`**, in any order. The build, the checks and `practice.html` pick up every `.js` file of that folder by themselves; a new file needs no entry anywhere. `question-types.js` gives the engine each course's syllabus (see Courses) and the learner its prerequisites, titles and real-question lists. `assets/js/data.js` is not needed.

| File | Holds |
|---|---|
| `data/question-types/*.json` | Catalogue fragments: more question types (and subtopic prerequisites), merged into the catalogue at build time. New content goes here, one file per batch, so nobody edits the big file. See its README and "Writing generators for AA HL, AI SL and AI HL content". |
| `data/question-types.json` | The catalogue: question types, their syllabus codes, skills, levels, unknowns, representations, constraints, misconceptions, bank part IDs, and the subtopic prerequisites. Seeded from wasteland-academy; type IDs and skill IDs are identical to it. Maintained here. |
| `assets/js/question-types.js` | Generated. What a page needs from the catalogue, plus the real past-paper questions per course and subtopic. |
| `docs/practice-coverage.md` | Generated. One row per subtopic. |
| `scripts/lib/practice-build.mjs` | Validation and the two generated files. Called by `scripts/build.mjs`; `node scripts/build-practice.mjs` regenerates just these two files. |
| `scripts/check-engine.mjs` | Every automated check. The independent answer verifiers are in `scripts/engine-checks/`: every `.mjs` file there except `tools.mjs` is loaded (`topicN.mjs` and any file added beside them). |
| `scripts/sample-engine.mjs` | Prints sample questions: `node scripts/sample-engine.mjs fn-composite --seed 3`. |

## Courses

The bank serves four courses: `aa-sl`, `aa-hl`, `ai-sl`, `ai-hl`. Generators are written once, for a **home course**, and name its syllabus codes. The home course is `aa-sl` unless the generator says otherwise with `home: "aa-hl"`, `"ai-sl"` or `"ai-hl"` (content that AA SL does not have). Every syllabus statement also has a permanent id (`SL1.8`), the same in every course that contains it, while its code differs: `SL1.8` is 1.8 in AA and 1.11 in AI HL. `data/syllabus-ai.json` lists under `shared` the AI statements that are an AA statement; that list is the judgement the engine trusts.

- A generator is offered in a course when that course's syllabus contains **every** statement the generator names (home code to id, id to the course's code). So AA HL gets every AA SL generator, AI gets those built only on shared statements, an `aa-hl` generator on an AHL statement is offered in AA HL only, and an `ai-sl` generator on an AI SL statement is offered in AI SL and AI HL. A generator can opt out of a course with `notFor: ["ai-sl"]`.
- Everywhere a course is given, codes are that course's: `generators({course: "ai-hl", syllabus: "1.11", primary: true})`, `coverage("ai-hl")`, `make({course: "ai-hl", ...}).syllabus`, the worksheet's `scope`, and the learner's units. A question id starts with its course, and the same generator, level and seed give the same mathematics in every course.
- The mapping comes from `QB_TYPES.statements`. The engine reads `window.QB_TYPES` by itself when it is there; elsewhere call `QBEngine.useCatalogue(QB_TYPES)` (creating a learner with a `catalogue` does it too). With no catalogue a generator is offered only in the courses it lists, codes as written.
- A subtopic with no generator at levels 1 to 4 in a course (the AHL statements, the AI-only statements) is practised with that course's real questions, as below. `docs/practice-coverage.md` has one section per course. A statement with neither a generator nor a tagged question is `unavailable` (today only AI HL 1.10).
- Calculator policy is read from the course's papers (`QB_TYPES.courses[id].papers[].calculator`, from `data/courses.json`). `question.calculator: false` always means "set to be done by hand, exact answer". `QBEngine.calculatorLabel(question)` gives the line to show: `"No calculator"` where the course has a paper without one (AA), `"Exact answer expected"` where every paper allows one (AI). `QBEngine.levelName(level, course)` names levels 3 and 4 "Paper 1 exam level" and "Paper 2 exam level" in AA, and "Exam level, exact answers" and "Exam level, calculator" in AI.
- HL Paper 3 has no generators. Its questions are in the real lists like any other; being long, they come last in each group.

## Strings and maths

Every string in a question (`stem`, `prompt`, `working[]`, choice `options[]`, `answer.display`, table cells, misconception texts, learner messages) is plain text with inline maths between single dollar signs:

```
The line $L$ has equation $y = 4x + 3$. Find $f^{-1}(5)$.
```

- Inline maths is `$...$`, rendered by KaTeX in inline mode. There is no `$$...$$` and no `\[...\]`. A line of working that is all maths is still `$...$`; use `\displaystyle` or `\dfrac` inside it where full-size symbols are wanted.
- A literal dollar sign is `\$`, inside or outside maths. (Generators write money in euros to avoid it.)
- Outside the dollar signs there is no LaTeX and no HTML: escape the text as text.
- `QBEngine.segments(str)` splits a string into `[{math: false, text}, {math: true, text}, ...]`. A renderer needs nothing else: `katex.renderToString(seg.text, {throwOnError: false})` for the maths pieces, escaped text for the rest. KaTeX's auto-render with `delimiters: [{left: "$", right: "$", display: false}]` gives the same result.
- A table (`question.table`) is `{head: [cell, ...], rows: [[cell, ...], ...]}` with cells in the same convention. The first cell of each row is its label.
- Each `working[]` entry is one line of the worked solution, in order. Show them as separate lines.

### Notation standard

`check-engine.mjs` enforces these on every string (`QBEngine.lintText`), and KaTeX must render every maths piece in strict mode with errors thrown.

- Every number, variable, expression, equation and quantity with a unit is inside `$...$`. Prose contains no digits and none of `^ _ \ = < > * |`, no Unicode maths symbols, and no bare `sqrt`, `pi`, `sin`, `log`. Write "three significant figures" in words.
- Fractions are `\dfrac{a}{b}` (or `\frac` inside an exponent), never `a/b`. No fraction inside a fraction. Reduced, with the sign in front: `-\dfrac{1}{2}`.
- Multiplication is `\times` or juxtaposition with brackets, never `*` or the letter x. Relations are `\le \ge \ne`.
- Functions are operators: `\sin \cos \tan \ln \log_{a}`. Constants and letters: `\pi`, `\theta`, `\mathrm{e}^{x}`.
- Calculus: `\dfrac{\mathrm{d}y}{\mathrm{d}x}`, `\displaystyle\int_{a}^{b} f(x)\,\mathrm{d}x` (limits always in braces).
- Probability and statistics: `\mathrm{P}(A \mid B)`, `A \cap B`, `A \cup B`, `A'`, `\mathrm{E}(X)`, `\mathrm{Var}(X)`, `X \sim \mathrm{N}(\mu,\, \sigma^{2})`, `X \sim \mathrm{B}(n,\, p)`, `\dbinom{n}{r}`.
- Sequences: `u_{n}`, `S_{n}`, `S_{\infty}`, `\displaystyle\sum_{r=1}^{n}`. Subscripts and powers always in braces.
- Functions and sets: `f^{-1}(x)`, `(f \circ g)(x)`, `x \in \mathbb{R}`.
- Points and lines by name are upright: `\mathrm{A}`, `[\mathrm{AB}]`, `\mathrm{B\hat{A}C}`. Do not name a point P or E followed by a bracket; those read as probability and expectation.
- Units go in text inside the maths: `12\text{ cm}`, `\text{m s}^{-1}`, `40^\circ`, `5\%` (`fmt.unit`, `fmt.deg`, `fmt.pct`).
- Tall content gets `\left( \right)`. Thousands are `12\,000` from five digits up (`fmt.num` does it). Decimals have a leading zero.
- No `+ -`, `- -`, `1x`, `0x`, `x^{1}`, `-0`, float noise, `NaN`, `undefined`. In everything a student reads before the worked solution, no unsimplified fraction. A working line may show a fraction before reducing it.
- One step per working line.

## Engine API

### `QBEngine.make(request)` returns a question

```js
const q = QBEngine.make({ course: "aa-sl", type: "fn-composite", unknown: "expression", representation: "equation", level: 2, format: "mcq", seed: 17 });
```

`type` is required (or `generator`, a generator id, which skips the lookup). `course` defaults to the generator's home course when `generator` is given, and otherwise to `"aa-sl"` (or, for a type with no generator there, to the chosen generator's home); `seed` defaults to `0`. `syllabus` in the result is in the course's codes, and `make()` throws for a generator that is not offered in the course. `unknown`, `representation`, `format` and `level` narrow the choice; whatever is left open is settled from the seed, so the same request and seed always give the same question. It throws when no generator matches.

```js
{
  id: "aa-sl:fn-composite:expression:equation:L2:mcq:17",
  generator: "fn-composite/expression/equation",      // generator id
  course, type, unknown, representation, format, title,
  syllabus: ["2.5"], skills: ["SL2.5.composite-expression", ...],
  level: 2, calculator: false, marks: 4, seed: 17,
  request: { course, type, unknown, representation, level, format, seed },   // make(q.request) gives q again
  stem: "Let $f(x) = 2x - 4$ and ...",
  parts: [{ label: "a", prompt, marks, answer, working: ["...", "..."] }, ...],
  table: { head, rows },   // optional
  graph: { ... },          // optional: a plot or a figure, see Graphs
  params: { ... }          // the generator's raw numbers, for the verifiers; not for display
}
```

`calculator: false` means the question is set to be done by hand. Show `QBEngine.calculatorLabel(q)`, which says "No calculator" only in a course that has a no-calculator paper.

### Answers

| `answer.kind` | Fields | The student gives |
|---|---|---|
| `"number"` | `value`, then `tolerance` (absolute) or `sigfigs`; `display`; optional `exact: true`, `unit`, `misconceptions: [{value, text}]` | a typed number |
| `"choice"` | `options[]` (strings), `correct` (index), `values[]`, `misconceptions[]` (text or null per option) | one option |
| `"graph"` | `options[]` (graph descriptions), `correct` (index), `values[]`, `misconceptions[]` | one graph |
| `"self"` | `display` (the model answer) | their own verdict against the worked solution |

`display` is the answer as a string to show. An integer has `tolerance: 0`. An exact fraction, surd or multiple of pi has `exact: true` and `sigfigs: 3`: the exact value or a decimal correct to three significant figures is accepted. A calculator answer has `sigfigs: 3` and its `display` is rounded.

### `QBEngine.mark(question, partLabel, response)` returns `{correct, expected, ...}`

- number: `response` is a number or what the student typed. `"3/4"`, `"-2.5"`, `"1,5"` and a Unicode minus are understood. Text that is not a number gives `{correct: false, invalid: true}`.
- choice and graph: `response` is the option's index (a choice also accepts the option's text, a graph its letter).
- self: `response` is `true` or `false`; the result has `selfMarked: true`.

`expected` is a display string (the answer, the right option's text, or `"Graph B"`); choice and graph results also carry `expectedIndex`. `misconception` is present when the wrong response matches a known one. A question is correct when every part is.

### `QBEngine.variants(question)` returns other ways to ask it

```js
[{ generator, unknown, representation, format, title, level, sameSituation, request }, ...]
```

One entry for every other generator of the same question type. `request` is ready for `make()` and keeps the seed. `sameSituation: true` means the numbers stay the same and only what is asked changes. "Ask it another way" is `make(variants(q)[i].request)`; hide the button when the list is empty.

### `QBEngine.worksheet(options)` returns a fixed set of questions

```js
const sheet = QBEngine.worksheet({ course: "aa-sl", scope: ["2.6", "2.7"], count: 12, levels: { 2: 2, 3: 1 }, seed: 5, real: realIndex });
// { course, scope, seed, marks, items: [{kind: "generated", code, question} | {kind: "real", code, questionId, marks}] }
```

`scope` is in the course's codes and `levels` are relative weights. Subtopics are taken in turn, the same type is not used twice running, and no question repeats. A subtopic with no generator at the wanted levels gives real question IDs when `real` is passed. The same options give the same worksheet, so a seed in a link reproduces it. The answer key is each question's `parts[].answer.display` and `parts[].working`.

### Looking things up

| Call | Returns |
|---|---|
| `QBEngine.generators(filter)` | Descriptions of generators matching `{course, type, unknown, representation, format, level, syllabus, primary, skill}`: `{id, type, unknown, representation, format, title, courses, home, statements, levels, syllabus, skills, calculator: {level: bool}, source, situation}`. With `course`, only generators offered in it, and `syllabus` (filter and result) in its codes; `courses` lists every course the generator is offered in, `statements` its permanent ids |
| `QBEngine.coverage(course)` | `{code: {levels, generators, types}}`, by each generator's first syllabus code, in the course's codes |
| `QBEngine.useCatalogue(QB_TYPES)`, `QBEngine.courses()`, `QBEngine.courseInfo(course)` | Gives the engine the courses' syllabuses; the course ids; `{id, short, name, papers}` |
| `QBEngine.hasNoCalculatorPaper(course)`, `QBEngine.levelName(level, course)`, `QBEngine.calculatorLabel(question)` | Calculator wording from the course's papers (see Courses) |
| `QBEngine.LEVELS` | `{level: {name, marks: [min, max], calculator?}}` |
| `QBEngine.signature(question)` | A fingerprint of what the student sees |
| `QBEngine.segments(str)`, `QBEngine.strings(question)`, `QBEngine.lintText(str, strict)` | String helpers used by renderers and checks |
| `QBEngine.parseNumber(text)`, `QBEngine.toleranceOf(answer)` | What `mark()` uses |

## Graphs

A graph description is plain data, so it can sit in a question, in an option, and in a test:

```js
{ x: [-6, 6], y: [-10, 10], xStep: 1, yStep: 2,
  functions: [{ fn: { type: "poly", coeffs: [4, -5, 1] }, domain: [-1, 5], dashed: false, label: "f" }],
  asymptotes: [{ x: 2 }, { y: -1 }],
  points: [{ x: 1, y: 0, label: "A", open: false }],
  xLabel: "x", yLabel: "y", alt: "A parabola" }
```

Function types (`fn.type`): `poly` (`coeffs`, lowest power first), `rational` (`num`, `den`), `exp` (`a b^(x-h) + k`), `log` (`a log_base(x-h) + k`), `trig` (`name`, `a`, `b`, `c`, `d`), `sqrt`, `abs` (`of`), `pwl` (`points`), `transform` (`of`, `a`, `q`, `h`, `k` for `a f(q(x-h)) + k`), `sum` and `product` (`of: [...]`). The header of `graph.js` lists every field.

| Call | Returns |
|---|---|
| `QBEngine.graph.toSVG(graph, {width, height, label})` | An SVG string, for a plot or a figure. `label` puts a letter in the corner (pick-the-graph options). Strokes use `currentColor`; elements have classes `qb-graph`, `qb-graph-grid`, `qb-graph-axis`, `qb-graph-ticks`, `qb-graph-curve`, `qb-graph-asymptote`, `qb-graph-point`, `qb-graph-label`, `qb-graph-option` |
| `QBEngine.graph.figureInfo(figure, {width, height})` | For a figure: where its labels are and any problems (see Figures) |
| `QBEngine.graph.regionOutlines(graph)` | The outline of each shaded region, in graph coordinates |
| `QBEngine.graph.evaluate(fn, x)` | The function's value, `NaN` outside its domain |
| `QBEngine.graph.difference(g1, g2)`, `.distinct(g1, g2)` | How different two graphs look (0 to 1), and whether a student could tell them apart |
| `QBEngine.graph.pickDistinct(correct, candidates, n)` | The first `n` candidates that look different from the correct graph and from each other |

For a `graph` answer, draw `toSVG(option, {label: "A"})`, `"B"`, ... in the order of `options[]` and pass the chosen index to `mark()`.

### Shaded regions on a plot

`regions` shades the area between a curve and the x-axis, or between two curves, over an interval. `fn` and `to` are an index into `functions` or a function description; without `to` the region runs to the x-axis.

```js
{ x: [-3, 3], y: [-1, 10], functions: [{ fn: { type: "poly", coeffs: [1, 0, 1] }, label: "f" }, { fn: { type: "poly", coeffs: [9, 0, -1] }, label: "g" }],
  regions: [{ x: [-2, 2], fn: 0, to: 1 }] }      // between f and g;  { x: [0, 2], fn: 0 } is between f and the x-axis
```

The shading is `currentColor` at low opacity (class `qb-graph-shade`), so it shows on the page's white graph background and in print. Say in the stem that the region is shaded.

### Figures (geometry diagrams)

A figure is a graph description with `shapes` instead of a window. A question carries it in the same `graph` field and `toSVG` draws it, so a page that shows `question.graph` needs nothing new.

```js
graph: { alt: "Triangle ABC with a height drawn",
  shapes: [
    { type: "polygon", points: [[0, 0], [8, 0], [3, 5]], labels: ["A", "B", "C"], sides: ["8 cm", null, "5.8 cm"] },
    { type: "angle", at: [0, 0], from: [8, 0], to: [3, 5], label: "59°" },
    { type: "line", from: [3, 0], to: [3, 5], dashed: true, label: "h" },
    { type: "angle", at: [3, 0], from: [8, 0], to: [3, 5], right: true } ] }
```

Coordinates are ordinary (x to the right, y up) in any unit. The figure is scaled to fit, equally in both directions, so **give the question's real lengths and angles and the figure is to scale**. When it is not (a view of a solid, evened-out proportions), say "the diagram is not to scale" in the stem. Angles are in degrees, anticlockwise from the positive x direction. Labels are plain text, not LaTeX (`"8 cm"`, `"40°"`, `"2π/3"`, `"A"`); a single lower-case letter is set in italics.

| Shape | Fields |
|---|---|
| `point` | `at`, `label`, `dot` (`false`: a named vertex with no dot), `dir: [dx, dy]` to force the side the label goes |
| `line` | `from`, `to`, `dashed`, `label` (at the midpoint), `arrow` (`"end"` or `"mid"`), `side` (`1`: left of from to to, `-1`: right) to force the label's side |
| `polygon` | `points`, `labels` (one per vertex), `sides` (`sides[i]` labels the edge from `points[i]` to the next), `fill`, `dashed` |
| `angle` | `at`, `from`, `to`, `label`; the smaller angle between the two rays, or with `sweep: "cw"` / `"ccw"` the one turning that way from `from` to `to` (bearings: `from` north, `sweep: "cw"`); `right: true` draws the square; `radius` in pixels |
| `arc` | `centre`, `radius`, `from`, `to` (anticlockwise), `dashed`, `label` |
| `sector` | `centre`, `radius`, `from`, `to`, `fill`, `label` (on the arc) |
| `segment` | `centre`, `radius`, `from`, `to`, `fill`: the region between the chord and the arc |
| `circle` | `centre`, `radius`, `dashed`, `fill` |
| `north` | `at`, `length` (figure units): a north arrow with the letter N |
| `text` | `at`, `text`: free text centred at a point |

`fill: true` shades a shape; `stroke: false` leaves its outline out (a shaded region on top of other shapes). Labels are placed automatically: a vertex label goes where the lines meeting there leave most room, a length goes beside the midpoint of its line on the side away from the middle of the figure, an angle label goes between its rays just outside the arc. Each is then moved until it is clear of every line and every other label. `QBEngine.graph.figureInfo(graph, {width, height})` returns `{labels: [{text, x, y, w, h, clear}], scale, problems: []}`; the checks require `problems` to be empty at 420 by 320, 320 by 240 and 260 by 200, so a generator must not produce a figure too crowded to label (reject those cases in its `do ... while` loop, as the bearings generators do with `legFigClear`).

Give a figure an `alt` text. Keep the stem sufficient without the diagram: every length and angle the question needs is still in the words. Do not label the answer. Extra classes: `qb-graph-figure` (on the `svg`), `qb-graph-shape`, `qb-graph-angle`, `qb-graph-north`, `qb-graph-arrow`, `qb-graph-shade`.

## Learner and selection

The unit that carries a level is the **subtopic**: a syllabus code of the learner's course (`"2.7"`). A learner is for one course, and state is kept per course, so 2.5 in AA and 2.5 in AI never meet. Every attempt also logs the skills of the question it was made on, so a finer model can be built from the log later.

```js
const L = QBEngine.learner;
const learner = L.createLearner({ course: "aa-sl", catalogue: window.QB_TYPES });
```

Options: `course`, `catalogue` (`QB_TYPES`), `real` (the real-question lists; taken from the catalogue when left out), `store` (a `L.createStore()` to share), `state` (the state object of a learner already loaded from the same store: a page that switches course makes one learner per course over one state, so none works on a stale copy), `backend` (anything with `getItem`/`setItem`/`removeItem`; `localStorage` by default, memory when that is blocked), `now` (a clock function, for tests), `config` (overrides for `L.CONFIG`).

### A full session

```js
const scope = ["2.6", "2.7", "2.8"];            // from the syllabus tree or ?scope=2.6,2.7,2.8
const item = learner.next(scope);               // what to ask now

if (item.kind === "generated") {
  const q = item.question;                      // a made question; item.request reproduces it
  // show q.stem, q.table, q.graph, q.parts ... collect one response per part ...
  const results = q.parts.map((p) => QBEngine.mark(q, p.label, responses[p.label]));
  const correct = results.every((r) => r.correct);
  const selfMarked = q.parts.some((p) => p.answer.kind === "self");
  const { change, saved } = learner.record(item, { correct, selfMarked, timeMs });
  show(learner.explain(change));                // "Two in a row. Moving up to level 3." or ""
} else if (item.kind === "real") {
  // a past-paper question: show questions/<item.questionId>/ and its markscheme; the student marks it
  const { change } = learner.record(item, { correct: studentSaysCorrect, selfMarked: true, timeMs });
} else {
  // item.kind === "none": item.why says why (empty scope)
}

// Next:                 learner.next(scope)
// Another like this:    QBEngine.make({ ...item.request, seed: newSeed })       (does not need record())
// Ask it another way:   QBEngine.make(QBEngine.variants(item.question)[i].request)

const rows = learner.summary(scope);            // the progress view
const text = learner.exportJSON();              // save as a file
learner.importJSON(text);                       // restore; throws an Error with a readable message on a bad file
const sheet = QBEngine.worksheet({ course: "aa-sl", scope, count: 10, levels: { 2: 1, 3: 1 }, seed: 1, real: L.realIndex(window.QB_TYPES, "aa-sl") });
```

Only answers to items from `next()` should be passed to `record()`; "another like this" and "ask it another way" are extra practice and may be recorded or not as the screen decides (to record one, pass `{...item, question: q2, request: q2.request, type: q2.type}`).

### `learner.next(scope, options)`

Returns one of:

```js
{ kind: "generated", course, unit: "2.7", level: 2, reason, type, request, question, refreshFor?, refreshItem? }
{ kind: "real", course, unit: "2.7", level: "exam", reason, questionId: "aa-sl-2023-may-tz1-p1-q03", marks: 5 }
{ kind: "none", why }
```

`reason` is `new`, `progress`, `refresh` (a prerequisite question; `refreshFor` is the subtopic it serves and `refreshItem` names the prerequisite), `review`, `exam`, `synoptic`, `real-only` or `fixed`.

**Fixed-level practice.** `learner.next(scope, {levels: [1, 2]})` is for a student who wants a chosen difficulty instead of "adapt to me". The subtopics of the scope take turns; each gives a question at one of the wanted levels it has generators for (its nearest level when it has none of them), and a subtopic with no generator gives its next real question. The item has `reason: "fixed"`. `record()` logs the attempt, counts it in the subtopic's `attempts` and `correct`, remembers the question as seen, and returns `change: null`: **fixed-level answers never move a level, start a subtopic, queue a refresher or touch a review date.** The choice was made because a student revising at a fixed level is not asking to be re-placed, and a run of easy questions should not push them to the exam rung. The page offers levels 1–2, 2–3 and 3–4.

The rules, all with their numbers in `L.CONFIG`:

- A subtopic with no history starts at level 2 (or the nearest level it has generators for).
- Two correct in a row at a level: up one level. Above the top generated level is the **exam rung**: real past-paper questions for the subtopic, self-marked.
- Two wrong out of the last three at a level: down one level.
- At the lowest level, two wrong out of three queues the **prerequisites**: level-0 question types that support the subtopic's skills, then its prerequisite subtopics, both from the catalogue. Each needs two correct in a row. Then the student returns to the subtopic at its lowest level. Wrong answers on prerequisites do not descend further.
- A subtopic on the exam rung is checked again after 3, then 7, then 14 days. A miss on a review, or two wrong out of three exam questions, drops it to its top generated level.
- Within the scope: up to three subtopics are worked on side by side, the least recently seen first; a due review is mixed in at most once every four questions while other work remains; the same question type does not come twice in a row when there is a choice; a seed is never reused for a student, and a question the student has seen recently is skipped.
- A subtopic with no generator is served its real questions, main questions first, short to long (`reason: "real-only"`). Two right in a row and it rests until a check 3 days later (`change.kind` is `real-secure`), so it does not crowd out the rest of the scope.
- Level 5 (synoptic) generators are mixed in once every subtopic they combine is on the exam rung.

### `learner.record(item, {correct, selfMarked, timeMs})` returns `{change, saved}`

`change` is `null` or `{unit, kind, from, to, message, ...}` with `kind` one of `up`, `down`, `stay`, `exam-reached`, `refresh-start`, `refresh-done`, `review-passed`, `review-missed`, `exam-down`. `message` is the plain-words line (also `learner.explain(change)`); the texts are in `L.CONFIG.messages`. `saved` is `false` when the browser refused to store (private mode, full storage).

### `learner.summary(scope)` returns one row per subtopic

```js
{ code, title, status, level, attempts, correct, nextReview, reviewDue, levels, hasReal, next }
```

`status` is `not-started`, `level`, `refresh`, `exam`, `review-due`, `real-only` or `unavailable`. `level` is a number, `"exam"` or `null`. `nextReview` is a timestamp or `null`. `next` is a sentence saying what to do next.

### Storage

- One `localStorage` key, `qb_practice_v1`, holding `{app, version, createdAt, updatedAt, salt, nextSeed, courses: {course: {units, seen, lastType, ...}}, attempts: [...]}`.
- Per subtopic: `level`, `rung`, `recent` results, `lastSeen`, `nextReview`, `reviewStage`, `refresh` queue, `realSeen`, `attempts`, `correct`.
- The attempt log keeps `t`, `course`, `unit`, `skills`, `type`, `generator`, `level`, `request`, `seed`, `correct`, `self`, `ms`, `reason`, `real`; the most recent 5,000.
- `L.VERSION` is the format version. **Every format change adds a step to `L.MIGRATIONS`** (`MIGRATIONS[n]` turns version `n` into `n + 1`) and a case to the storage test in `check-engine.mjs`. A save is never wiped: one that cannot be read (broken JSON, a newer version, another app's data) is copied to `qb_practice_v1_unreadable_<time>` and a fresh state is used. `learner.loadStatus` is `new`, `loaded`, `migrated` or `unreadable`.
- `importJSON` and `reset()` copy the save they replace to `qb_practice_v1_before_import_<time>` / `_before_reset_<time>` and return `{keptAs}`. Both act on every course; `resetCourse()` clears only the learner's course (its units and its attempts) and keeps the old save aside the same way.
- Supporting four courses changed nothing in the format: `courses` was already keyed by course and AA SL codes are unchanged, so version 1 saves load as they are and no migration step was needed. The page's own scope key, `qb-practice-scope`, was a list of AA SL codes and is now `{course: [codes]}`; the old list is still read as AA SL's.
- Nothing is sent anywhere.

Lower-level pieces, if the screen needs them: `L.createStore({backend, key, now})` (`load()`, `save(state)`, `keepAside(suffix)`), `L.exportProgress(state)`, `L.importProgress(text)`, `L.migrate(obj)`, `L.newState(now)`, `L.realIndex(QB_TYPES, course)`, `L.realIndexFromQuestions(AASL_DATA.questions, course)`, `L.memoryBackend()`.

### `window.QB_TYPES`

```js
{ version, course, levels,          // course: the default home course; a type's syllabus codes are in its own home's numbering
  courses: { "aa-sl": { id, short, name, subject, level, papers: [{id, name, calculator}] }, ... },
  topics: { "1": "Numbers and Algebra", ... },
  statements: { "aa-sl": [{code, id, topic, title}], "aa-hl": [...], ... },
  subtopics: { "SL2.7": { prereqs: ["SL2.6"], skills: ["SL2.7.solve-equation", ...] } },
  types: [{ id, name, topic, kind, courses, home, syllabus, skills, supports, levels, parts, unknowns: [{id, asked, level}], representations }],
  real: { "aa-sl": { "2.7": [[questionId, marks, sharePercent], ...] } } }
```

`real` lists, per course and that course's code, the questions with a part tagged with that code (a question shared by an SL and an HL paper is in both courses' lists, under the id it is stored by): those where the code carries at least half the marks first, each group short to long. `kind` is `exam`, `skill`, `concept`, `prior-learning` or `link`.

## Adding a generator and its verifier

Each AA SL syllabus topic has one generator file, `assets/js/engine/generators/topicN.js`, and one verifier file, `scripts/engine-checks/topicN.mjs`. Work only in your topic's two files; nothing shared needs editing. (Content of the other courses has its own files: see the next section.) A generator may be listed under any type in `data/question-types.json`; its first syllabus code decides which subtopic it counts for. Write AA SL codes: the engine carries the generator to the other courses (see Courses), so every code you list narrows where it is offered. List a second code only when the question really needs that statement.

1. Pick the catalogue type (`data/question-types.json`, `types[].id`) and one of its `unknowns[].id` and `representations[].rep`. Read the type's `constraints`, `randomise` and `misconceptions`: they say what the numbers must satisfy and which wrong answers are worth offering.
2. Register the generator in the topic file:

```js
reg({
  type: "fn-solve-quadratic", unknown: "solve-factorisable", representation: "equation", format: "value",
  levels: [1],                       // one build() may serve several levels; ctx.level says which
  syllabus: ["2.7"],                 // first code = the subtopic it is practice for
  skills: ["SL2.7.solve-equation"],  // ids from data/syllabus.json
  calculator: false,                 // or (level) => boolean
  title: "Solve a quadratic by factorising",
  // optional: source (old template id), situationKey + situation(rng), fixedPool, niceOk
  build({ rng, level, sit }) {
    const r1 = rng.int(-7, 4), r2 = r1 + rng.int(1, 8);
    return {
      params: { coeffs: [1, -(r1 + r2), r1 * r2] },      // raw numbers for the verifier
      stem: `Consider the equation $${poly([1, -(r1 + r2), r1 * r2])} = 0$.`,
      parts: [
        P("Write down the smaller solution.", 1, ans.int(r1), [`$${factor(r1)}${factor(r2)} = 0$`, `$x = ${r1}$ or $x = ${r2}$; the smaller is $${r1}$.`]),
        P("Write down the larger solution.", 1, ans.int(r2), [`The larger solution is $x = ${r2}$.`]),
      ],
    };
  },
});
```

   - Use only `rng` for randomness (`int`, `pick`, `bool`, `sign`, `nonzero`, `shuffle`, `sample`). Loop with `do { ... } while (bad)` to reject cases that break a constraint.
   - Build every expression with `QBEngine.fmt`: `num`, `sf`, `dp`, `frac`, `poly`, `lin`, `expr`, `coef`, `signed`, `paren`, `br`, `factor`, `point`, `surd`, `piFrac`, `unit`, `deg`, `pct`, and `rat` for exact fractions. They never produce `+ -`, `1x`, `-0` or an unreduced fraction. **Use `br(x)` wherever a value is multiplied by what is written before it** (`2${br(k)}` gives `2(4)`; `2${k}` would give `24`). `paren(x)` brackets only negatives and is for after `+`, `-`, `\times` and `=`.
   - Build answers with `QBEngine.ans`: `int`, `frac`, `dec`, `exact(value, tex)`, `sf`, `dp`, `choice(rng, correct, wrongs)`, `graph(rng, correct, wrongs)`, `self(model)`. Give choice and graph options a `value` (machine-readable, for the verifier) and wrong ones a `why` (shown as the misconception).
   - Part marks must add up to a total in the level's range (`QBEngine.LEVELS`): levels 0 and 1, 1 to 2 marks; level 2, 3 to 4; levels 3 and 4, 5 to 7; level 5, 8 or more. Level 3 is no-calculator. Every part needs at least one line of working.
   - No-calculator answers are exact (`int`, `frac`, `dec`, `exact`). Calculator answers use `ans.sf` and should not all be round numbers; set `niceOk: true` when whole-number answers are the point (a least number of years).
   - Two generators of one type that should share their numbers give the same `situationKey` and `situation(rng)` function; `build` then reads `ctx.sit`. That is what makes `variants()` report `sameSituation`.
   - Questions are in our own words and numbers. Nothing copies IB text.
3. Add the verifier under the same id (`type/unknown/representation` unless you set `id`) in `scripts/engine-checks/topicN.mjs`:

```js
"fn-solve-quadratic/solve-factorisable/equation": (q, T) => {
  const r = T.roots((x) => T.poly(q.params.coeffs, x), -60, 60, 4801);   // a different route: root search
  T.require(r.length === 2, "two distinct real roots");                  // a catalogue constraint
  return { a: r[0], b: r[1] };                                           // expected answer per part label
},
```

   It must reach each answer by a different route from the generator's formula: root search, numerical differentiation or integration, brute-force search, counting, simulation (`scripts/engine-checks/tools.mjs`). Return a number, `T.approx(value, tol)`, `T.index(i)`, `T.option(value)` (the option whose `value` equals it) or `T.optionWhere(q, label, test)`. Self-marked parts need no entry. State the type's constraints with `T.require(condition, "what")`. A generator with no verifier fails the check.
4. Run `node scripts/sample-engine.mjs <id>` and read the output as a student would, for several seeds. The checks cannot tell whether a worked solution reads well.
5. Run `node scripts/build-practice.mjs` (updates `question-types.js` and the coverage table), then `node scripts/build.mjs --check` and `node scripts/check-engine.mjs`. All must pass before a generator ships. `--only <text>` and `--seeds <n>` shorten a run while working.

## Writing generators for AA HL, AI SL and AI HL content

Content that AA SL does not have (AA's AHL statements, the AI-only statements, AI's AHL statements) is written exactly as above, with three differences: the generator says which course's codes it uses, and it lives in three new files of its own, so several people can work at once without touching a shared file.

**`home`.** A generator's `syllabus` codes are read in the numbering of its home course. Give `home` once for the whole file through `registerAll`:

```js
const reg = (def) => E.registerAll({ home: "aa-hl", calculator: false }, [def])[0];
reg({ type: "t1-ahl-complex-cartesian", unknown: "product", representation: "equation", format: "value",
  levels: [2], syllabus: ["1.12"], skills: ["AHL1.12.arithmetic"], title: "Multiply two complex numbers", build(ctx) { ... } });
```

- Pick the smallest course that has the statement: `aa-hl` for AA's AHL statements (ids `AHL...`), `ai-sl` for AI SL statements that AA lacks (ids `AI-SL...`), `ai-hl` for AI's AHL statements (ids `AI-AHL...`). Leave `home` out for anything AA SL has. Do not set `courses`.
- The engine still places the generator by permanent statement id: `ai-sl` code 1.6 (`AI-SL1.6`) is offered in AI SL and AI HL under each course's own code; `aa-hl` code 1.12 (`AHL1.12`) only in AA HL. The same code in another course is another statement (AA 1.6 is not AI 1.6), which is why the home matters.
- A generator may mix an SL statement with an AHL one: write both codes as the home course numbers them (`home: "ai-hl"`, `syllabus: ["1.11"]` is `SL1.8`). It is offered where every statement exists.
- `make({generator})` with no course makes the question in the home course. Question ids, `question.syllabus`, `coverage()`, `variants()`, worksheets and the learner all use the codes of the course asked for.
- Codes and ids per course are in `data/syllabus-aa-hl.json` and `data/syllabus-ai.json` (`statements[].code`, `.id`, `.courses`, `.subtags`), or `QB_TYPES.statements[course]`.

**Where the files go.** Choose one name for the batch, such as `aa-hl-topic1`, and create:

| File | Holds |
|---|---|
| `assets/js/engine/generators/<name>.js` | The generators. Copy the header of a `topicN.js` (the wrapper function and the `fmt`/`ans` shorthands). Loaded automatically. |
| `scripts/engine-checks/<name>.mjs` | The verifiers, `export default { "<generator id>": (q, T) => ({ a: ... }) }`. Loaded automatically. |
| `data/question-types/<name>.json` | The catalogue fragment: `{ "home": "aa-hl", "types": [...], "subtopics": {...} }`. Merged automatically. |

A fragment's `types` have the format of the main file's; `id`, `name` and `skills` are required, and `topic`, `source: "extension"`, `kind` (`skill`, `concept`, `link`), `syllabus`, `unknowns: [{id, asked, level}]`, `representations: [{rep}]`, `constraints` and `misconceptions` are worth filling in. Its `home` says which course's numbering the types' `syllabus` codes use (a type may set its own `home`); it mirrors the generator field. Its optional `subtopics` gives `{ "<statement id>": { "prereqs": ["SL1.5"], "skills": [{ "id", "levels", "paper" }] } }` for statements the main file does not list; the prerequisites are statement ids and are what a struggling student is sent back to. An id used twice, in any two catalogue files, fails the build.

**Naming.** Wasteland Academy's catalogue has no types for this content, so new ids are yours to choose, in the existing style:

- Type ids: lower-case words with hyphens, the topic prefix the main file uses (`t1-`, `fn-`, `t3-`, `t4-`, `t5-`; look at the neighbours in `data/question-types.json`), then `ahl-` or `ai-` so the id cannot meet an AA SL one: `t1-ahl-complex-cartesian`, `t4-ai-chi-squared`. Unknown ids say what is asked (`modulus`, `product`); representations are `equation`, `words`, `graph`, `table`, `diagram`.
- Skill ids are **not** invented: they are the sub-tag ids of the statement in `data/syllabus-aa-hl.json` or `data/syllabus-ai.json` (`AHL1.12.arithmetic`, `AI-SL1.6.percentage-error`). The build rejects an id that is not there. If a skill is missing from the syllabus file, use the closest one and say so in your report; do not edit the syllabus files in a generator batch.
- Generator ids stay `type/unknown/representation`.

**Unchanged.** Levels and marks are as for AA SL: levels 0 and 1 carry 1 to 2 marks, level 2 carries 3 to 4, levels 3 and 4 carry 5 to 7, level 5 carries 8 or more; level 3 is set without a calculator and has exact answers, level 4 is calculator work with `ans.sf`. AI has no no-calculator paper, so an AI generator will mostly offer levels 1, 2 and 4, with level 3 only where an exact answer by hand is natural; the page words the calculator line per course by itself. A subtopic counts as having generated practice once it has a generator at one of levels 1 to 4, and reaches the release minimum with one at level 2 and one at level 3 or 4. The notation standard, the independent verifier, 300 clean seeds and the three commands of step 5 apply as they are.

## What `check-engine.mjs` checks

For every generator, every level and 300 seeds: the same seed gives the same question; every checkable answer agrees with the independent verifier; text is clean and follows the notation standard; no-calculator answers are exact and calculator answers are to three significant figures; the verifier's constraints hold; every string renders in KaTeX (strict, errors thrown); `mark()` accepts the stored answer, a value inside the tolerance and the right option, and rejects a value outside the tolerance, nonsense and every wrong option; options are distinct; marks add up and fit the level; every graph and figure gives SVG with finite coordinates inside the view box, a figure's shapes are sound and its labels are all drawn clear of the lines and of each other at the three sizes the page uses, shaded regions are visible, and graph options look different from each other. Then: a scripted student who is always right climbs to the exam rung through every level and is served real questions there; reviews fall due after 3, 7 and 14 days and a miss drops a level; a student who is always wrong goes down to the prerequisites once, stays there, and returns after getting them right; subtopics without generators serve real questions short to long; every subtopic of each of the four courses can be practised, by a generator or its real questions; a generator is offered exactly where the syllabus holds all its statements and its questions carry that course's codes; a shared AI statement gets generated questions under its AI code; AHL and AI-only statements fall back to their own real questions, Paper 3 last; switching course does not mix learner state; a generator with another home course is offered where its statements are, under each course's codes; catalogue fragments are merged and a duplicate id is refused; fixed-level practice serves the chosen levels and moves no level; calculator wording follows the course's papers; progress survives a reload, an export and an import; old and unreadable saves are migrated or kept aside; variants and worksheets behave; and the engine files use no `Math.random()`, no `Date` (except the learner's default clock) and no DOM.

KaTeX comes from the `katex` devDependency (`npm install`). Without it the render check is skipped with a loud warning locally and fails in CI.
