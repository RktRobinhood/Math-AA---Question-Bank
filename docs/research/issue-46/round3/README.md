# Round 3 · Block workspace feasibility

**One question model, two workspaces.** The left pane keeps the five familiar syllabus topics with skill search. The middle is a paper-order stack or a free-positioned graph. The right runs identical checks in both modes. This is a teacher research prototype for original AA SL material, not a student feature or a migration of scanned exams.

## Try both

1. Download index.html, open it in a browser and choose **A · Paper stack** with **Quadratics · Water jet**. Edit the model on its card. The time is 3 s and the maximum height is 19 m. The prefilled simulated attempt of 2 s then 17 m is consistent but does not change the key or assign marks. Hide the time part or move it after height: the preview blocks. Restore it or explicitly make height independent.
2. Choose **B · Node canvas** with **Arithmetic sequences · Theatre seating**. Move the cards by their headers; the arrows set printing order. Select the purple output on the final row and then the matching Input on total seats (or choose it from the menu). The key is 55 and 300. The simulated 50 then 280 is consistent. Try Undo by toggling the hidden source back on, or disconnect from the dropdown.
3. **Start blank** keeps your prior draft. Drop or click to add Model, Source result and Dependent result, then link them. Add an optional introduction or a written-response block. **Restore prior draft** switches back; **Reset example** loads original defaults. Drafts save in this browser if file storage is allowed.

## What is feasible?

| Option | Advantage | Cost / limitation |
| --- | --- | --- |
| Paper stack | Print order is obvious. Easy on phone, and quickest for ordinary multipart questions. | Crossing dependencies get harder to read as the question grows. |
| Node canvas | Visible branches, natural typed sockets, independent spatial grouping. | Requires layout, wiring and accessibility details; coordinates cannot determine exam order. |
| Same model, two views | No duplicated maths; use the one that fits the job. | Preserve two interaction surfaces. Pilot stack first, keep the canvas for demonstrably complex dependencies. |

### Under the surface

Separate **(1) derived canonical value, (2) printed cross-reference and (3) follow-through from a student answer**. A stable block ID is not a printed letter. Coordinates only change layout; order and visibility change paper and key. Hiding retains original content and edges. If the learner needs a hidden or later source, stop and ask for an explicit author decision. This slice demonstrates follow-through and its associated relettered print reference; its shared model block stands in for canonical data dependencies, not a universal port graph. Units, domains, cycle prevention, safe expression trees, versioned input types and import validation belong to the underlying model, not the visual library.

The follow-through test first recognizes the canonical answer, then separately checks a valid simulated earlier result against the later expression. Out-of-domain input is rejected. A production rubric must also reject answers that make the task materially easier or change branch, and review the work if marks depend on method. Do not run untrusted JS to evaluate maths. Do not ship a hidden key in a high-stakes student HTML file. Arbitrary formula editing, rich notation, question version snapshots, mark allocations, PDF export QA, generic dependency graphs and actual student grading are outside this demo.

### Build versus reuse

- [React Flow handles](https://reactflow.dev/learn/customization/handles), [validation/cycle example](https://reactflow.dev/examples/interaction/prevent-cycles), [accessibility](https://reactflow.dev/learn/advanced-use/accessibility) and [MIT licensing](https://next.xyflow.com/open-source): strongest canvas fit. Provides UI primitives, not worksheet rules. Prefer an isolated editor bundle over changing the site's stack.
- [Blockly connection checks](https://docs.blockly.com/guides/create-custom-blocks/inputs/connection-checks/) and [Scratch Blocks](https://github.com/scratchfoundation/scratch-blocks): sensible for snap-together structured blocks, especially an eventual constrained formula editor. Compatible strings are not domain, unit, or marking validation.
- [Numbas adaptive marking](https://docs.numbas.org.uk/en/latest/question/parts/reference.html#adaptive-marking) and [licensing](https://docs.numbas.org.uk/en/latest/licensing.html): tested precedent for substituting a prior student answer without changing authored variables, and a potential separate adapter. It does not supply this layout.
- [STACK multipart tutorial](https://docs.stack-assessment.org/en/AbInitio/Authoring_quick_start_7/) and [response trees](https://docs.stack-assessment.org/en/Authoring/Potential_response_trees/): reference for validating inputs before evaluating follow-through; not a drop-in dependency for a static question site.
- [WCAG 2.2 dragging movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements): keep click/tap actions for Add, Move and Connect beside drag. [IB syllabus](https://www.ibo.org/programmes/diploma-programme/curriculum/mathematics/) and [licensing](https://www.ibo.org/become-an-ib-school/ib-publishing/licensing/): keep course and syllabus version in the metadata, and separate original commercial material from exam archive rights.

**Practical next gate:** freeze the versioned schema for only these two templates, add typed rule/rubric fixtures for broken cases, review with a teacher on desktop and phone, and measure time to add a third template in a different topic. Renderer and basic authoring are modest; designing and reviewing bounded generators, marking rules and good repair messages per template is the recurring cost. No code need be assigned before the design review.

**Verification:** real Chromium at 390, 768 and 1440 px; dark and light. Tested dragging/reordering, click-to-add/connect, hide/restore, invalid maths, exact fractional key, reroll, card positions independent of order, paper renumbering, reload, blank→build→restore, no remote requests and no horizontal page overflow. The mockups are actual captures of the two working views.
