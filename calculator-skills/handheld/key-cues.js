/* TI-Nspire CX II-T Watch tapes. Milliseconds from decoded MP3 playback.
 * Replay/captions/seek should sample the same immutable timeline. Neither
 * the timer nor a transition mutates the inputs. Key positions belong to the
 * shell. UI details are optional deterministic LCD checkpoints, not prompts.
 */
(function (root) {
  'use strict';
  const at = (timeMs, key, details, durationMs = 210) =>
    Object.freeze({timeMs, key, durationMs, ...(details || {})});
  const freeze = events => Object.freeze(events);
  const tap = (t, k, details) => at(t, k, details, 145);
  const raw = (t, k, rawAfter) => tap(t, k, {rawAfter});
  const cmd = (t, k, cmdAfter, more) => tap(t, k, {cmdAfter, ...more});

  // Old Watch screen beat anchors, from minimum.mp3: Menu 5.49 s,
  // Analyze Graph 7.35 s, Minimum 9.18 s, confirm 18.02 / 23.35 s.
  const CT12 = freeze([
    raw(500, 'x', 'x'),
    raw(1294, 'square', 'x^2'),
    raw(1667, 'minus', 'x^2-'),
    raw(2039, '6', 'x^2-6'),
    raw(2411, 'x', 'x^2-6x'),
    raw(2783, 'plus', 'x^2-6x+'),
    raw(3156, '1', 'x^2-6x+1'),
    raw(3528, '3', 'x^2-6x+13'),
    at(4780, 'enter', {state:'plotted'}),
    at(5490, 'menu', {state:'menu'}),
    at(7350, '6', {state:'submenu'}),
    at(9180, '2', {state:'lower'}),
    at(14100, 'left', {state:'lower', note:'Move the touchpad cursor to the left of the valley.'}, 3380),
    at(18020, 'enter', {state:'upper', note:'Confirm the lower bound.'}),
    at(19500, 'right', {state:'upper', note:'Move the touchpad cursor to the right of the valley.'}, 3050),
    at(23350, 'enter', {state:'result', note:'Confirm the upper bound and mark the minimum.'})
  ]);

  // nSolve(2^x = x + 4, x, 2, 3), then replay and replace both bounds.
  // Optional command text uses superscript x because the current LCD draws
  // the exponent in text. Arrow/Del events still describe physical actions.
  const P = 'nSolve(', E = P + '2ˣ=x+4', V = E + ', x';
  const POS = V + ', 2, 3)', NEG = V + ', −4, −3)';
  const CT06 = freeze([
    at(1600, 'menu', {state:'menu'}),
    at(3550, '3', {state:'submenu'}),
    at(5310, '1', {state:'entry', cmdAfter:P}),
    cmd(6450, '2', P + '2'),
    cmd(6710, 'power', P + '2', {exponentOpen:true}),
    cmd(6950, 'x', P + '2ˣ', {exponentOpen:true}),
    cmd(7150, 'right', P + '2ˣ', {exponentOpen:false}),
    cmd(7450, 'equals', P + '2ˣ='),
    cmd(7820, 'x', P + '2ˣ=x'),
    cmd(8230, 'plus', P + '2ˣ=x+'),
    cmd(8570, '4', E),
    cmd(8860, 'comma', E + ','),
    cmd(9750, 'x', V),
    cmd(10700, 'comma', V + ','),
    cmd(13500, '2', V + ', 2'),
    cmd(15140, 'comma', V + ', 2,'),
    cmd(15400, '3', V + ', 2, 3'),
    cmd(17910, 'rightParen', POS),
    at(20500, 'enter', {state:'result', cmdAfter:POS, note:'First solution on the positive interval.'}),
    tap(23650, 'up', {historyFocus:'result'}),
    tap(23900, 'up', {historyFocus:'input'}),
    at(24180, 'enter', {state:'entry', cmdAfter:POS, note:'Copy the previous command into the entry line.'}),
    cmd(24510, 'left', POS, {cursorFromEnd:1}),
    cmd(24770, 'del', V + ', 2, )', {cursorFromEnd:1}),
    cmd(24980, 'del', V + ', 2)', {cursorFromEnd:1}),
    cmd(25200, 'del', V + ', )', {cursorFromEnd:1}),
    cmd(25450, 'negative', V + ', −)', {cursorFromEnd:1}),
    cmd(25760, '4', V + ', −4)', {cursorFromEnd:1}),
    cmd(26070, 'comma', V + ', −4, )', {cursorFromEnd:1}),
    cmd(26380, 'negative', V + ', −4, −)', {cursorFromEnd:1}),
    cmd(26700, '3', NEG, {cursorFromEnd:1}),
    cmd(27080, 'right', NEG, {cursorFromEnd:0}),
    at(27920, 'enter', {state:'result', cmdAfter:NEG, note:'Solve again using the negative interval.'})
  ]);

  // Binomial wizard: selection highlight at 11.518 s is one tap down
  // from Binomial Pdf; Enter opens the chosen Cdf wizard at 14.647 s.
  const CT38 = freeze([
    at(6868, 'menu', {state:'probability-menu'}),
    at(8418, '5', {state:'probability-submenu'}),
    at(9968, '5', {state:'distributions-submenu'}),
    at(11518, 'down', {state:'cdf-selected'}),
    at(14647, 'enter', {state:'wizard', field:0}),
    tap(14900, '1', {field:0, fieldAfter:'1'}),
    tap(15200, '2', {field:0, fieldAfter:'12'}),
    at(16097, 'tab', {field:1}),
    tap(16370, '0', {field:1, fieldAfter:'0'}),
    tap(16600, 'decimal', {field:1, fieldAfter:'0.'}),
    tap(16910, '2', {field:1, fieldAfter:'0.2'}),
    tap(17220, '5', {field:1, fieldAfter:'0.25'}),
    at(17547, 'tab', {field:2}),
    tap(17930, '5', {field:2, fieldAfter:'5'}),
    at(18997, 'tab', {field:3}),
    tap(19270, '1', {field:3, fieldAfter:'1'}),
    tap(19620, '2', {field:3, fieldAfter:'12'}),
    at(20447, 'tab', {field:4, note:'Move to OK.'}),
    at(22680, 'enter', {state:'entry', cmdAfter:'binomCdf(12,0.25,5,12)'}),
    at(23361, 'enter', {state:'result', cmdAfter:'binomCdf(12,0.25,5,12)'})
  ]);

  const tapes = Object.freeze({CT12, CT06, CT38});
  root.HandheldKeyCues = tapes;
  root.HandheldKeyCueAt = (lesson, timeMs) => {
    if (!Number.isFinite(timeMs)) return null;
    const tape = tapes[lesson];
    if (!Array.isArray(tape)) return null;
    for (let i = tape.length - 1; i >= 0; i--) {
      const e = tape[i];
      if (e.timeMs <= timeMs) return (timeMs < e.timeMs + e.durationMs) ? e : null;
    }
    return null;
  };
})(typeof window === 'undefined' ? globalThis : window);
