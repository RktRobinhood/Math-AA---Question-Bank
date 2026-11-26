/* Calculator access rules are specific to the generated Practice card, not real past papers. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(null);
  else root.QBPracticeCalculator = factory(root);
})(typeof window === 'undefined' ? null : window, function (win) {
  'use strict';
  // AA numerical skills can start as early as Level 2. Respect the generator
  // calculator tag, but keep Paper 1 and the AA Level 3 band no-calculator.
  // AI always permits a calculator; exact-answer instructions still apply.
  function eligible({ item, question, course, tab = 'practice' } = {}) {
    if (tab !== 'practice' || item?.kind !== 'generated' || question?.course !== course) return false;
    if (!Number.isInteger(question.level) || question.level < 1 || question.level > 5) return false;
    if (question.paper && !['P1', 'P2', 'P3'].includes(question.paper)) return false;
    if (course === 'aa-sl' || course === 'aa-hl') {
      return question.calculator === true && question.level !== 3 &&
        (!question.paper || question.paper === 'P2');
    }
    if (course === 'ai-sl' || course === 'ai-hl') return true;
    return false;
  }

  const numericalSolve = Object.freeze({
    title: 'Numerical Solve',
    path: 'calculator-skills/solve/index.html?embed=practice',
  });

  // Match a reviewed generated form, not a broad syllabus code, title, or
  // arbitrary URL. The original Watch example is never the exercise itself.
  function helpFor(question) {
    if (!question || !question.calculator) return null;
    if (question.type === 'fn-scale-gdc-nonpolynomial-two-crossings') {
      const p = question.params;
      return p && [2, 3, 4].includes(p.b) && [3, 4, 5, 6].includes(p.a) &&
        !(p.b === 2 && p.a === 4) ? numericalSolve : null;
    }
    if (question.type === 'fn-gdc-solve-equation' && question.unknown === 'solve-mixed-equation' &&
        question.representation === 'equation') return numericalSolve;
    return null;
  }

  const source = 'calculator-skills/scratchpad/index.html?v=mathprint-1';
  const wide = win?.matchMedia('(min-width: 900px)');
  let current = null, owner = null;
  function create() {
    if (!win) return null;
    const d = win.document;
    const el = (tag, cls, str) => {
      const n = d.createElement(tag);
      if (cls) n.className = cls;
      if (str) n.textContent = str;
      return n;
    };
    const panel = el('dialog', 'practice-calc-panel');
    if (typeof panel.showModal !== 'function') return;
    const layout = d.getElementById('app');
    const back = el('button', 'practice-calc-back', '×'); back.type = 'button';
    back.setAttribute('aria-label', 'Close calculator');
    back.title = 'Close calculator';
    back.autofocus = true;
    const status = el('p', 'practice-calc-status', 'Loading calculator…');
    status.setAttribute('role', 'status');
    const helpButton = el('button', 'practice-calc-help');
    helpButton.type = 'button'; helpButton.hidden = !helpFor(owner);
    helpButton.setAttribute('aria-label', 'Calculator help');
    helpButton.setAttribute('aria-haspopup', 'dialog');
    helpButton.title = 'Calculator help';
    helpButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.2 9a2.8 2.8 0 0 1 5.6.4c0 2-2.8 2.2-2.8 4M12 16.5h.01"/></svg>';
    panel.append(back, helpButton, status);
    panel.setAttribute('aria-label', 'Calculator');
    const frame = el('iframe', 'practice-calc-frame');
    frame.title = 'Blank TI-Nspire calculator';
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.setAttribute('referrerpolicy', 'no-referrer');
    frame.src = new URL((d.body.dataset.base || './') + source, d.baseURI).href;
    panel.append(frame); layout.append(panel);
    const syncTheme = () => frame.contentWindow?.postMessage({ type: 'qb-scratchpad-theme', theme: d.documentElement.dataset.theme }, '*');
    const onMessage = event => {
      if (event.source !== frame.contentWindow || event.data?.type !== 'qb-scratchpad-ready') return;
      status.hidden = true;
      syncTheme();
    };
    win.addEventListener('message', onMessage);
    const observer = new win.MutationObserver(syncTheme);
    observer.observe(d.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const timer = win.setTimeout(() => {
      if (!status.hidden) status.textContent = 'The calculator did not start. You can go back to your question.';
    }, 4000);
    const session = { panel, back, helpButton, layout, opened: null, help: null, dispose() {
      closeHelp(session, false);
      win.removeEventListener('message', onMessage);
      observer.disconnect(); win.clearTimeout(timer);
      wide.removeEventListener('change', switchView);
      panel.remove();
    } };
    panel.id = 'practice-calc';
    panel.addEventListener('close', () => { if (!panel.open) finish(session); });
    panel.addEventListener('cancel', event => { event.preventDefault(); close(); });
    panel.addEventListener('keydown', event => {
      if (event.key === 'Escape' && wide.matches && !session.help) { event.preventDefault(); close(); }
    });
    back.addEventListener('click', () => close());
    helpButton.addEventListener('click', () => openHelp(session, helpFor(owner)));
    const switchView = () => fitCalculator(session);
    wide.addEventListener('change', switchView);
    return session;
  }

  // The top-layer walkthrough is a separate, short-lived frame. Keep the
  // Scratchpad iframe mounted and don't pass it or the lesson any exercise data.
  function openHelp(session, lesson) {
    if (!lesson || !session.panel.open || session.help) return;
    const d = win.document;
    const modal = d.createElement('dialog');
    modal.className = 'practice-lesson no-print';
    modal.setAttribute('aria-labelledby', 'practice-lesson-title');
    modal.innerHTML = '<header><strong id="practice-lesson-title"></strong>' +
      '<button type="button" autofocus aria-label="Close walkthrough and return to calculator" title="Back to calculator">×</button></header>' +
      '<div class="practice-lesson-content"><p role="status">Loading walkthrough…</p></div>';
    modal.querySelector('strong').textContent = lesson.title;
    const status = modal.querySelector('[role=status]');
    const frame = d.createElement('iframe');
    const url = new URL(lesson.path, d.baseURI); // Only a locally registered lesson; no student inputs.
    frame.title = lesson.title + ' walkthrough';
    frame.referrerPolicy = 'no-referrer';
    frame.allow = 'fullscreen';
    frame.style.visibility = 'hidden';
    const onMessage = event => {
      if (event.origin !== url.origin || event.source !== frame.contentWindow || session.help?.modal !== modal) return;
      if (event.data?.type === 'qb-practice-watch-ready') {
        win.clearTimeout(timer); status.hidden = true; frame.style.visibility = '';
      } else if (event.data?.type === 'qb-practice-watch-exit') closeHelp(session);
    };
    const timer = win.setTimeout(() => {
      status.textContent = 'Walkthrough unavailable. Close and try again.';
    }, 7500);
    session.help = { modal, onMessage, timer };
    session.panel.dataset.watching = '';
    win.addEventListener('message', onMessage);
    modal.querySelector('button').addEventListener('click', () => closeHelp(session));
    modal.addEventListener('cancel', event => { event.preventDefault(); closeHelp(session); });
    d.body.append(modal);
    modal.querySelector('.practice-lesson-content').append(frame);
    modal.showModal();
    frame.src = url.href;
  }

  function closeHelp(session, restore = true) {
    const active = session.help;
    if (!active) return;
    session.help = null;
    win.removeEventListener('message', active.onMessage);
    win.clearTimeout(active.timer);
    active.modal.close();
    active.modal.remove(); // Also ends audio when closing during playback.
    delete session.panel.dataset.watching;
    if (restore && session.panel.open) {
      fitCalculator(session);
      session.helpButton.focus({ preventScroll: true });
    }
  }

  function fitCalculator(session) {
    const { panel } = session;
    if (!session.opened || !panel.open || session.help || panel.matches(':modal') === !wide.matches) return;
    panel.close();
    show(session);
  }

  function open(from) {
    if (!win || !owner || !from?.isConnected || current?.panel.open) return;
    const session = current || create();
    if (!session) return;
    current = session;
    session.opened = { from, scroll: win.scrollY, mobile: !wide.matches };
    from.setAttribute('aria-expanded', 'true');
    from.setAttribute('aria-controls', 'practice-calc');
    session.layout.classList.add('with-practice-calc');
    show(session);
  }

  function show(session) {
    if (wide.matches) session.panel.show();
    else session.panel.showModal();
    session.back.focus({ preventScroll: true });
  }

  function finish(session, restore = true) {
    const opened = session?.opened;
    if (!opened) return;
    session.opened = null;
    session.layout.classList.remove('with-practice-calc');
    opened.from.removeAttribute('aria-controls');
    opened.from.setAttribute('aria-expanded', 'false');
    if (restore && opened.from.isConnected) {
      opened.from.focus({ preventScroll: true });
      if (opened.mobile && win.scrollY !== opened.scroll) win.scrollTo(0, opened.scroll);
    }
  }

  function close(restore = true) {
    if (!current) return;
    closeHelp(current, false);
    if (current.panel.open) current.panel.close();
    finish(current, restore);
  }

  // The parent uses identity only. No question, seed, draft or answers are sent to
  // the iframe. Reopening this question restores the student's scratchpad, while a
  // different question or leaving Practice destroys its in-memory calculations.
  function bind(nextOwner, trigger) {
    if (owner === nextOwner) {
      // Grading and answer help may redraw controls without changing the question.
      if (current?.opened && trigger) {
        current.opened.from = trigger;
        trigger.setAttribute('aria-expanded', 'true');
        trigger.setAttribute('aria-controls', 'practice-calc');
      }
      return;
    }
    owner = nextOwner;
    if (!current) return;
    close(false);
    current.dispose();
    current = null;
  }

  return Object.freeze({ eligible, helpFor, open, close, bind });
});
