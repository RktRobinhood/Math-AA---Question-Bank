# Calculator Coach narration: Claude / Paperclip handoff

Tracker: [audio rollout #48](https://github.com/RktRobinhood/Math-AA---Question-Bank/issues/48). From a fresh checkout of main, run:

    node scripts/check-calculator-narration.mjs --queue

**Record only entries in generationQueue.** Each entry names the exact lesson, student route, signed script and SHA-256, audio destination, and definition to update. Use --audit instead of --queue for all routes and their separate player status. Add --decode-audio to decode the existing files and compare duration to the recorded metadata.

| Queue status and action | What Claude should do |
|---|---|
| matched / preserve | The route's attachment and source have been verified. Do not regenerate, rename, or re-export. |
| missing / generate | The source script matches the shared Watch definition and there is neither a signed attachment nor a loose MP3. This is the only new-generation work. |
| missing / repair | An established recording is absent or a legacy attachment needs review. Recover the approved take or investigate before recording. |
| stale / repair | A binding, script, audio hash or decode is invalid, or a loose MP3 needs review. Investigate; do not overwrite. |

A nonempty attention list exits 1 but still emits valid JSON with affected routes and reasons. Stop if your intended ID is in attention. The queue uses the existing [legacy recording manifest](manifest.json) and [template Watch handoffs](template-watch/manifest.json), not a separately maintained list. Their baseline counts and draft designations are historical. **Migrating a player does not mean new audio is needed.**

## Record and attach a queued take

1. Verify the ID is still in generationQueue on your branch. Review its default Watch (no query or linked question); compare the exact SHA-256 of the listed UTF-8 script. Read only those lines, one spoken segment per line. Do not speak headings, coaching or teaching holds, Try questions/answers, exam content, or student data.
2. Use the approved George voice and authorized recording setup. This handoff authorizes neither a substitute voice nor spend. Listen to every cue at natural speed. Read C D F and P D F letter-by-letter and distinguish Enter to insert a wizard command from Enter to evaluate.
3. Measure each segment in the same final reviewed MP3, with ffprobe and listening. Set each beat's end to its **measured cumulative source time in seconds**; the last end must match the decoded duration. Preserve the text, physical key order, and separate authored hold durations. Do not scale the spoken audio, derive timings from the silent rehearsal, or put visual holds into the recording.
4. Add the reviewed MP3 and recording.file, recording.audioSha256 and recording.scriptSha256 to its linked definition together. Run the command below and verify this ID changes to matched, with no new attention. Play and seek in the real Watch, check exact spoken CC, 1× speech, mobile/desktop and independent Try. Do not claim a staged attachment is live before checking the deployed route.

       node scripts/check-calculator-narration.mjs --audit --decode-audio

## Legacy attachment reference (not a recording queue)

## Machine contract

`manifest.json` schema 1: `lessons[CTxx]` is keyed by immutable canonical ID.
`route` and `existingAudio.src` are calculator-site-root relative;
`transcript` and `cueMap` are relative to this manifest.
Each UTF-8 `CTxx.txt` contains one unlabelled spoken phrase per line, in
exact `spokenCues` array order from its `CTxx.cues.json`.

- `watch.captionCues` are source display cues and
  `watch.displayKeyStateChanges` are observable key-light state transitions
  via the frozen Watch slider. They are **not recording timestamps**.
  The optional authored key tape and named adapter events carry the actual
  key order where available; same-key adjacent presses can share a single
  observed light. Never interpolate key or speech times from a caption.
- `existingAudio.phraseEvidence` distinguishes editorial player captions,
  offline speech alignment and genuinely measured existing sidecars; do not
  treat the first two as precise microphone/word timings.
- Use the actual decoded duration and hash of a new reviewed `narration.mp3`.
  Measure every relevant cue/key/scene onset after listening. Keep caption
  fallback; no fake times, placeholder audio, artificial time stretching, or
  parallel media and wall clocks.

## Attach reviewed audio

| Lesson | Runtime destination under calculator site root |
|---|---|
| CT37 | `binomial-pdf/narration.mp3`, inline inert `ct37-narration-manifest` in `binomial-pdf/index.html` |
| CT39 | `normal/narration.mp3`; replace the empty `normal/measured-cues.js` with the validated `window.NormalMeasuredCues = <strict JSON>;` assignment |
| CT40 | `inverse-normal/narration.mp3`, inline inert `ct40-narration-manifest` in `inverse-normal/index.html`; also measure `markersMs.tailContext` |
| CT41 | `normal-parameter/narration.mp3`, inline inert `ct41-measured-recording` in `normal-parameter/index.html` |
| CT42 | `poisson/narration.mp3`, inline inert `ct42-narration-manifest` in `poisson/index.html`. Keep the existing transcript and measure all typed keys; see lesson hold rules below. |
| Entries marked `shared-measured-json` (49) | Add the reviewed `narration.mp3` next to the lesson, and replace its existing `narration.sync.json` with a measured package (below). Neither file alone activates narration. |

CT37 and CT39 to CT42 are recorded (FAL-1695). Their inline packages also carry
`audioSha256`, which the players ignore and
`node scripts/check-calculator-narration.mjs` verifies; the checker runs each
route's own `watch-media.js` (CT39: `voice-profile.js`) on the package exactly
as the page does.

Inert tags are `type="application/json"`. Escape `<` in inline data as
`\u003c`. Their shape is `{version:1,lesson,timing:"measured-playback",audio,durationMs,cues,keyTimesMs}`;
each cue has `id,startMs,text`; CT40 additionally requires `markersMs`.
CT39's wrapper shape is `{format:"ct39-measured-cues-v1",lesson:"CT39",media,cues}`;
`media` is `{file,durationMs,sha256}`; each cue is
`{id,startMs,endMs,text,keys,lcdEvents}` with `{key,timeMs}` and
`{state,timeMs}`. Use exact event validation in the native player:
first/second Enter, intro/tail transitions and final result hold. Keep the
browser audio metadata within the route's documented 120/125 ms padding
tolerance.

CT42 reuses the inert version-1 shape with the 14 `watch-01`…`watch-14` cues.
Use `key-01`…`key-66` in the one-based authored `CT42Tape.keys` order;
every key is timed explicitly, and each typed Enter precedes its spoken result.
The final cue must have at least 300 ms of remaining declared recording.
The fallback remains caption-only until a matching file decodes, and the
lesson never guesses speech timing from the rehearsal.

### Shared measured JSON (legacy recovery only)

For explicitly authorized legacy recovery, passing --draft with the exact lesson ID prints an unmeasured skeleton. It is not a generation or replacement signal. Use the queue above first; do not commit a skeleton or fabricated timing. In a reviewed package:

- Set `status: "measured"`, the actual `audioSha256` and decoded
  `durationMs`. Keep the template's lesson ID and transcript/cue-map hashes
  so the recording cannot accidentally attach to revised material.
- Fill `captions` with separately measured `startMs` and `endMs` for
  each immutable spoken-cue ID. The player loads the verified manuscript
  text. Captions need no copies inside the package and do not announce
  key names unless the voice actually says them.
- `anchors` maps each ordered `editorialMs` checkpoint to its separately
  reviewed `audioMs`. The draft lists required caption, display, authored
  key, and pointer milestones. Set the first pair to 0/0, and the last to
  the exact end of the editorial tape and the recording. Both axes must
  increase strictly. Some lessons include distinct scene or example cuts:
  include their landmarks even if not spoken. Observe and align the actual
  screen or key event to the reviewed take; do not scale the timeline,
  derive key timing from speech starts, or interpolate the checkpoint
  measurements. The player only interpolates during playback between
  the reviewed checkpoints, using the recording as the sole clock.
- From the repository root run
  `node scripts/check-calculator-narration.mjs --decode-audio` to verify exact
  assets, manuscript and timing contract. Then test in a real browser.
  The old captioned Watch remains when the file is missing, stale,
  invalid, or cannot decode. Try is separate; do not narrate or populate it.

Inspect with **ffprobe**, run a whole-file decode
(`ffmpeg -v error -i narration.mp3 -f null -`), listen to the actual take,
and replay from its start to actual decoded end. Check exact key lights and
LCD transitions, seek backward/forward, pause, mobile/desktop, and the
previously independent Try state. Report which tracks truly play, not how
many scripts exist. This overlay does not modify any calculator, catalogue,
Practice, question, or exam page and does not add biographic/protected
exam text.

### Expanded teaching takes (separate from the legacy queue)

[CT01 v2: Enter and round a calculation](expanded/CT01-v2.md) is the first expanded
script. Preserve the existing CT01 MP3 and signed cue map. The new take needs
its own measured alignment and student-facing check before replacing audio.

[CT06 v2: Solve an equation numerically](expanded/CT06-v2.md) adds the exponent
cursor, history recall, separate bounds, and rounding. The live Watch version
continues to use the signed original recording with additional teaching holds.
Use each script's production cues with the learner's chosen framing, not an
automatic camera cut. Record and measure new takes separately.
