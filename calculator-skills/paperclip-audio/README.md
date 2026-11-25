# Calculator Coach narration handoff for Paperclip

Start at [manifest.json](manifest.json). **59 catalogue lessons; seven already
narrated; 52 await audio.** CT12's separately staged graph maximum is listed
under supplements, not as a sixtieth skill. Each entry includes the actual
player heading and original catalogue title, so same-topic lessons do not get
each other's tracks.

## Recording queue

1. **Preserve existing recordings** for CT01, CT06, CT08, CT10, CT11, CT12,
   and CT38. Reuse the exact path/bytes in `existingAudio` (there are
   byte-identical guide copies for four). The text and cue maps document the
   approved lesson, not an instruction to re-record. Do not rename, replace,
   upscale or duplicate these assets.
2. Start with **CT39 Normal CDF → CT40 Inverse Normal → CT37 Binomial PDF →
   CT41 unknown normal parameter**. Their tested players accept an optional
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
| Other new recordings | Existing runtime needs a verified local player hook first. A committed MP3 alone does not add narration. Use the same per-route convention after integrating it; do not add a player to bank exam pages. |

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

Inspect with **ffprobe**, run a whole-file decode
(`ffmpeg -v error -i narration.mp3 -f null -`), listen to the actual take,
and replay from its start to actual decoded end. Check exact key lights and
LCD transitions, seek backward/forward, pause, mobile/desktop, and the
previously independent Try state. Report which tracks truly play, not how
many scripts exist. This overlay does not modify any calculator, catalogue,
Practice, question, or exam page and does not add biographic/protected
exam text.
