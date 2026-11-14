# Catalogue fragments

Every `.json` file in this folder is merged into the catalogue (`data/question-types.json`) at build time, in file-name order. One file per batch of content, named like its generator file: `aa-hl-topic1.json`.

```json
{ "home": "aa-hl",
  "types": [ { "id": "t1-ahl-complex-cartesian", "topic": 1, "source": "extension", "kind": "skill", "name": "Arithmetic with complex numbers", "syllabus": ["1.12"], "skills": ["AHL1.12.arithmetic"], "unknowns": [ { "id": "product", "asked": "the product", "level": 2 } ], "representations": [ { "rep": "equation" } ] } ],
  "subtopics": { "AHL1.12": { "prereqs": ["SL2.7"], "skills": [ { "id": "AHL1.12.arithmetic", "levels": [1, 3], "paper": "either" } ] } } }
```

- `types` entries have exactly the format of the main file's `types`. A type needs `id`, `name` and `skills`.
- `home` is the course whose numbering the types' `syllabus` codes use (`aa-sl` when left out). A type may set its own `home`. `courses` defaults to `[home]`.
- `subtopics` (optional) gives prerequisites and skills per permanent statement id, for statements the main file does not list.
- A type id or subtopic id that is already in the main file or another fragment is a build error. Only `about`, `home`, `types` and `subtopics` are allowed as keys.
- Skill ids are the sub-tag ids of `data/syllabus*.json`. After editing run `node scripts/build-practice.mjs`. See `docs/practice-engine.md`.
