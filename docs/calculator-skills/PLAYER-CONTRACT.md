# Calculator Skills player contract

Enter and round a calculation (CT01) is the reference for the visible teaching steps and key groups. Numerical Solve (CT06) is the reference for fixed-rate voice, teaching pauses, and the Practice popup. Match these inside the bank, not a separate brand or player layout.


Start new lessons from the [shared Watch template](WATCH-TEMPLATE.md). Supply a
lesson definition and a calculator adapter, not another player. Existing lessons
move to shared pieces in verified batches without changing their audio or maths.
- Use the bank's own header, course switcher and System/Light/Dark preference.
  System is the default; do not initialize or save a second lesson theme.
  A standalone calculator has the same header. A Practice iframe gets only
  the blank handset, with no question data, answers or outer navigation.
  Desktop and mobile navigation draw labels and Beta flags from the same
  link list in `assets/js/shell.js`. Keep app routes and new lessons on that
  shell; exam archive detail pages keep their limited navigation profile.
- Watch has one video-shaped scene. Clicking or tapping its noninteractive
  surface toggles Play/Pause, with brief feedback in the center of the whole
  scene. Keep one transport below: scrub, Play/Pause (Replay at end), time,
  captions, pacing and fullscreen. Keep the selector compact, without a visible
  “Pauses” label. The visible icon must be Pause
  while running and Play while paused. Fullscreen refits the display, text
  and keys; exiting preserves the playhead. Arrow keys seek; no extra jump,
  restart or Take over buttons.
- Watch starts in the larger LCD view unless the student saved Full calculator.
  Persist the chosen framing under browser key `qb-calculator-watch-frame`
  with values `screen` or `full`. Handset keys starts in Full calculator on
  every new visit, because key locations are the lesson. Switching its frame
  stays local to that visit and does not change other lessons. Both views show the same playhead,
  calculation and audio; Try always shows the full interactive handset.
  Returning to Watch should preserve the playhead/preferred framing.
- Show the ordered keys beneath each concise step label, not in a single
  unstructured row. Keep these groups readable before playback and when
  paused; active step and key follow the playhead on a rewind. In Full also light the actual
  physical key. Keep the chosen frame steady; no automatic zoom. Spoken CC
  is separate from keys and can be toggled even when a lesson has no recording.
  Captions overlay the lower scene and must not change
  the size of the handset, LCD or transport. The player follows site Light, Dark
  or System; live LCD colors stay authentic and captions keep strong contrast. Keep recorded speech at 1×; only the deliberate
  teaching holds vary. Use measured narration timing and reject mismatched
  recordings. If audio is unavailable, start with captions on. Keep recording
  state out of the visible player controls.
- Show every spoken calculator action on the device. If narration advises a
  distinct method, animate its actual menu/key path and readout. Add a short
  why at a useful decision or likely mistake, not a separate maths lesson. Keep examples
  and original narrations intact unless a verified correction needs a new
  Paperclip transcript. Do not show answers in the blank Practice calculator. In written guidance,
  keep an exact value exact (e.g. 6) and round an approximate final value
  to three significant figures by default; follow explicit question instructions.

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
