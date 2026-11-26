CT06 Numerical Solve · TI-Nspire CX II non-CAS
Open index.html on the live site or through a local static HTTP server. Watch uses a narrated original example;
Try is independent and lets you edit equations and bounds.

Routes relative to site root:
  solve/?mode=try&example=demo       Original x²=5, bounds [2,3]
  solve/?mode=try&example=negative   Original x²=5, bounds [-3,-2]
  solve/?mode=try&case=roots-demo    Alias of the first route
Only known case IDs preload practice data; input in the URL is not executed.

The screen is an educational recreation, not an emulator. The practice solver
scans the finite chosen interval and bisects the first sign change. It accepts
real expressions in x, positive-base exponentials, whole powers of variable
bases, sin/cos (radians), exp, and division by nonzero constants. It can miss
touching roots and multiple closely spaced crossings. An answer is one root,
not a proof there are no others. It is not TI's solver algorithm.

Watch keeps the original voice at 1× and gives each group of key actions
its own adjustable teaching pause. Captions follow the recorded lines as heard,
not the keys. The key trail works without audio and follows rewinds. Full and
Screen-only are manual and remembered. Deep links do not change the example.

main.js is the live module; watch-plan.js maps audio cuts to action groups;
solver.js and screen.js are shared within this lesson. The historical app.js
bundle and video are not the live Watch player. Three.js r180 (MIT) is served
locally; the Canvas renderer works without WebGL.
