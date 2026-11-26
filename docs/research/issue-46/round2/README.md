# Question Studio: feasibility round 2

A single-file offline demo for #46. Download `index.html` and open it in a browser. It is not deployed. It contains one entirely original quadratic and no packaged dependencies, archive exam material, or production code.

Try the four states:

1. Keep or remove parts. Filter the block library by skill, add Vertex, and edit the wording.
2. Set the constant to 9 or 10. The required two distinct real roots disappear, and the demo blocks fixing the question and withholds its key.
3. Turn off Solve while keeping Compare. A dependency fails independently of the equation's maths. Turn off Justify instead and see the remaining labels and key change.
4. In Teacher key, enter two earlier student values (1 and 4), then repeat a value. Comparing 1 and 4 gives a tentative follow-through distance of 3, separate from the fixed canonical distance of 2; repeats are outside this example's rule. This is not an awarded mark.

Chromium tested 12 mode/viewport/theme combinations, the dependency and math blockers, wording review, relabeling, snapshot, variant rolling and both prior-response cases. The mock-up uses plain JavaScript for this one narrowly scoped example. The suggested rich maths editor and optional proof tooling are not installed. The pin stores a demo-session snapshot only. This does not export student papers, provide security separation, grant licensing rights, or turn free-form prose into verifiable maths.

[Browser engines and licensing comparison](technical-note.md)
