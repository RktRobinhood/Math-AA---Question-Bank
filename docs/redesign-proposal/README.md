# UI redesign proposal: reference material

Screenshots and static mockups for the UI redesign issues. Nothing here is loaded by the site.

- `img/before-*.jpg`: the site as it was at commit `ec49e39`, at 1440×900 and 390×800.
- `img/after-*.jpg`: the approved mockups.
- `mockups/*.html` + `mockups/m.css`: the static HTML the mockups were rendered from. Open them from a
  checkout (they load question images from `../../../assets/exam-images/`). `m.css` holds the proposed
  colour, type and spacing variables for light and dark mode, and is the best starting point for the
  real stylesheet.

Two mockups predate a decision made later and are kept for their other content:

- `questions-dark.html` and `mobile.html` show a two-state syllabus toggle (tick / minus). The approved
  design is the three-state AND / OR / NOT control in `questions.html`.

The mockups are pictures, not working code: no JavaScript, fixed sample data, fixed 1440×900 or phone
frames. Build the real thing in the site's own files.
