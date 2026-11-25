CT06 Numerical Solve · TI-Nspire CX II non-CAS
Open index.html online or offline. Watch uses a narrated original example;
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

The Watch visuals respond to the narration clock. Captions are included. Deep
links do not change the Watch example. The Watch entry shows leaving the
exponent with Right before typing the equals sign. New George voice from
ElevenLabs; no speech/browser service is required during playback.

Files: index.html, styles.css, app.js, narration.mp3 are sufficient for use.
main.js controls the player/steps; solver.js and screen.js are editable sources.
Build with: esbuild main.js --bundle --minify --outfile=app.js --format=iife --target=es2022
Three.js r180 (MIT) is bundled; the Canvas renderer works without WebGL.
