# Calculator Coach narration handoff for Paperclip

Start at [manifest.json](manifest.json). **All 59 catalogue lessons and two
companions are live. Seven have existing recordings; the other 54 play with
captions and have recording destinations.** Five use their existing custom
adapters and 49 use the shared measured JSON bridge. Availability of a
recording destination is not a claim that the lesson is narrated. The
companions are Graph Maximum (CT12-max) and Frequency Histograms (SUP-HIST-01).

## New Watch template lessons

The [template Watch queue](template-watch/manifest.json) lists foundation and
extension lessons authored directly in the common player. Each entry links
the exact script, SHA-256, live data file and audio destination. Record only
the linked lines, in order. Measure each speech boundary from the recording
and update the beat `end` values in `definition.json`. Leave the extra teaching
`hold` for seeing the keys. Add the measured MP3 and the matching
`recording.file`, `recording.audioSha256` and `recording.scriptSha256` together.
Do not use the legacy cue map or invent timing for these lessons. Verify the
audio at normal voice speed and test captions and seeks in the common player.
Watch remains captioned until the signed recording is in place.

## Recording queue

1. **Preserve existing recordings** for CT01, CT06, CT08, CT10, CT11, CT12,
   and CT38. Reuse the exact path/bytes in `existingAudio` (there are
   byte-identical guide copies for four). The text and cue maps document the
   approved lesson, not an instruction to re-record. Do not rename, replace,
   upscale or duplicate these assets.
2. Start with **CT39 Normal CDF → CT40 Inverse Normal → CT37 Binomial PDF →
   CT41 unknown normal parameter → CT42 Poisson**. Their tested players accept an optional
   measured manifest. `nativeMediaAdapter` gives exact cue IDs, physical
   key IDs, ordering and destination. The text is the original reviewed
   recording sheet, not legacy rehearsal copy.
3. The other lessons have speech-normalized original Watch captions.
   Treat them as **recording drafts**. Review each while watching the
   default route (no query or linked question). A single line is one cue,
   and no headings or staging notes are spoken. Never synthesize Try text,
   personal data, linked inputs/answers or exam content.

Keep the accepted George quality if Paperclip's own approved access supports
it; no substitute or charge is authorized by this file. Allow space to see
every field/key land. Read named keys deliberately, with C D F and P D F as
individual letters. Pause briefly between the Enter that inserts a wizard
command and the Enter that evaluates it. Match labels and numbers by ear.

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

### Shared measured JSON (49 lessons)

Run `node scripts/check-calculator-narration.mjs --draft CT28` (substitute the
exact lesson ID) for its data-entry template. The lesson's existing
`narration.sync.json` stays `awaiting-recording` until a recording has been
reviewed. Do not commit a template or fabricated timing. In the reviewed
package:

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
