# Calculator Skills Watch template

**Reference:** Enter and round a calculation supplies the grouped teaching
style; Numerical Solve supplies the timed playback reference. For a new lesson,
reuse the template, not the files from one of those existing pages. Legacy
lessons can adopt it in reviewed batches without replacing their math or audio.

## Author a lesson

1. Write a `definition.json`. Define each short, titled chapter and enter one
   or more beats in order. `coach` is what the learner should look for and
   why. `spoken` is the exact voice line (use an empty string if unvoiced).
   `end` is the cumulative end of the audio slice, in seconds. For a
   captioned draft, use estimated speech boundaries; replace them with
   measured quiet boundaries before enabling voice. `hold` is extra
   visual teaching time. Each real key is `{id,label,at,ariaLabel?}`, where
   `at` is a fraction of the teaching hold. Repeated presses have distinct
   occurrence IDs. A screen change or pointer move is not necessarily a key.
2. Supply a calculator adapter as `window.CalculatorLessonAdapter`.
   `renderWatch(host, state)` receives the selected frame, current beat,
   measured playhead and the complete list of crossed key events. Reconstruct
   the display from `crossed` (including on backward seeks). Adapter code can
   update the LCD and highlight physical keys; it must never create its own
   transport or use a second playback clock. If Try is supported, add
   `enterTry(host)` and optional `exitTry(host)`. Try is full handset and
   independent; it doesn’t get a worked answer from Watch.
3. Run `node scripts/scaffold-calculator-watch.mjs <slug> <definition.json>
   <adapter.js>`. It refuses to overwrite an existing lesson. The generated
   page owns only the data and calculator adapter. The shared files own the
   grouped steps, Play/Pause, scrub, captions, pause preference, frame memory,
   fullscreen and try-mode switch. Do not fork the player for new lessons.
4. Ask Paperclip for voice after the steps and script pass. For this template,
   `recording` has a same-origin MP3 `file`, `audioSha256`, and
   `scriptSha256`. The script file whose digest is used contains each nonempty
   spoken line separated by a newline, with a trailing newline. If a script
   or audio digest fails, the player keeps the honest captioned version.
   Use the measured audio boundaries and keep speech at 1×. Existing
   recordings and adapters are not rewritten by this contract.
5. Test the actual rendered lesson at 320/390 px and short desktop: all labeled
   key groups visible at rest, chapter click and backward seek reproducible,
   screen and body stay in the chosen frame, fullscreen makes content
   readable, Play shows Pause, captions match speech, and Try has no worked
   answer. Then follow the catalogue and scope rules in the
   [player contract](PLAYER-CONTRACT.md).

Minimal draft (the adapter must supply the meaningful screen states):

```json
{
  "id": "CT01",
  "title": "Open Calculator",
  "intro": "Start a calculation on the handheld.",
  "chapters": [{"id":"menu","title":"Open the app"}],
  "beats": [{
    "chapter":"menu", "spoken":"Open Calculator.", "coach":"Choose Calculator from Home.",
    "end": 2.2, "hold": 3, "keys":[{"id":"open","label":"Enter","at":0.5}]
  }]
}
```
