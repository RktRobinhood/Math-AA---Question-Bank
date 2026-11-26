# Calculator Skills player contract

Numerical Solve (CT06) is the reference for voiced Watch playback. Match the
student-facing behavior, not a separate brand, navigation or theme.

- Use the bank's own header, course switcher and System/Light/Dark preference.
  System is the default; do not initialize or save a second lesson theme.
  A standalone calculator has the same header. A Practice iframe gets only
  the blank handset, with no question data, answers or outer navigation.
- Watch has one video-shaped scene. Clicking or tapping its noninteractive
  surface toggles Play/Pause, with brief feedback in the center of the whole
  scene. Keep one transport below: scrub, Play/Pause (Replay at end), time,
  captions, speed down to 0.5× and fullscreen. Use keyboard arrows for short
  seeks; don't add visible jump/restart controls or a Take over button.
- Watch starts in the larger LCD view unless the student saved Full calculator.
  Persist the chosen framing under browser key `qb-calculator-watch-frame`
  with values `screen` or `full`. Both views show the same playhead,
  calculation and audio; Try always shows the full interactive handset.
  Returning to Watch should preserve the playhead/preferred framing.
- Show real key presses automatically. In LCD view show the key label; in Full
  also light the physical key. Spoken CC is separate and must not cover the
  handset or keys. For audio that is unavailable use a labeled captioned
  walkthrough, not a promise of narration. Prefer the actual audio clock for
  cue lookup, including while scrubbing and at slower speed.
- Show every spoken calculator action on the device. If narration advises a
  distinct method, animate its actual menu/key path and readout. Keep examples
  and original narrations intact unless a verified correction needs a new
  Paperclip transcript. Do not show answers in the blank Practice calculator.

- Contextual help in Practice uses the same Watch route in an approved embedded
  presentation, not a new lesson or a link to another tab. Only reviewed
  generated forms may open it. Loads and dismissals are scoped to the
  lesson frame and its origin. Hide the in-frame navigation and Try, pass
  no question data, and keep Watch separate from the exercise. Closing,
  including during playback, restores focus to the calculator help button.
  See [ADR-0003](../adr/0003-reuse-watch-for-contextual-practice-help.md).

Check the published catalogue entry, direct Watch and linked Try on a small
phone, a short laptop, and a roomy desktop. Test change of framing while
playing, persistence after reload, captions with the densest keys, seek and
fullscreen, unsolicited focus/keyboard shortcuts, return from an unfinished
Try, and failure without audio. `node scripts/check-calculator-shell.mjs`
guards banner presence; it does not substitute for a browser review.
