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

  const source = 'calculator-skills/scratchpad/index.html?v=split-table-1';
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
    panel.append(back, status);
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
    const session = { panel, back, layout, opened: null, dispose() {
      win.removeEventListener('message', onMessage);
      observer.disconnect(); win.clearTimeout(timer);
      wide.removeEventListener('change', switchView);
      panel.remove();
    } };
    panel.id = 'practice-calc';
    panel.addEventListener('close', () => { if (!panel.open) finish(session); });
    panel.addEventListener('cancel', event => { event.preventDefault(); close(); });
    panel.addEventListener('keydown', event => {
      if (event.key === 'Escape' && wide.matches) { event.preventDefault(); close(); }
    });
    back.addEventListener('click', () => close());
    const switchView = () => {
      if (!session.opened || !panel.open) return;
      panel.close();
      show(session);
    };
    wide.addEventListener('change', switchView);
    return session;
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

  return Object.freeze({ eligible, open, close, bind });
});
