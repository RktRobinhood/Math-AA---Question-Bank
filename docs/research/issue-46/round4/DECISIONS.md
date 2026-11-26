# Wayfinder notes and proposed ADR content

Status: **research; needs human**. This is not an accepted architecture decision or approval to change the student site.

| Learned from rounds | Record if selected |
|---|---|
| A visual mask and editable scanned clones are not the goal. Select/remove parts and edit/reroll should be one workflow. | Keep archive immutable and build original bounded authoring families, with provenance mapped separately. |
| Global document entry made parts feel read-only; phone clipped the perceived editor. | Put editable text, marks and model parameters on block cards. Use stable explicit references that render as current part letters. |
| Input/output ports helped communicate dependencies; geometry did not communicate print order reliably. | Persist identity, position, order, visibility and link kind separately. Same domain model for Stack and Node; keep the simplest layout that teaches the author the relationship. |
| “Paper 1” as an ordinal obscured a strong IB meaning. | Keep authoring block order, printed part order and assessment profile separate. Profiles are qualified by syllabus version, course and paper/section. |
| Coverage based on question counts or every tag would misstate emphasis. | Attribute each part's marks once, surface unallocated marks and show actual vs teacher-selected targets. Do not use blanket course inference from shared IDs. |

**Suggested first grilling question:** When a teacher changes the ask so substantially that the existing key no longer answers it, should the tool force a new reviewable family, or allow a teacher-owned one-off draft with explicit manual marking?

**Still open:** arbitrary formula editing with bounded rules and stable notation; exact role of alternative method and follow-through; reviewing paper fitness for AI and both HLs; versioning seeds and exports; whether mark weighting needs split-primary for deliberately mixed parts; licensed source handling; stack vs node accessibility testing. Record those as options, not promises or implementation tickets. No AI-only approval of authored items.
