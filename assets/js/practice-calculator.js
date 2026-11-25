/* Calculator access rules are specific to the generated Practice card, not real past papers. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(null);
  else root.QBPracticeCalculator = factory(root);
})(typeof window === 'undefined' ? null : window, function (win) {
  'use strict';
  // AA uses the engine's own technology flag for Paper 2-style work. AI has no
  // no-calculator paper, but exact-answer scaffolds outside the exam bands stay focused.
  function eligible({ item, question, course, tab = 'practice' } = {}) {
    if (tab !== 'practice' || item?.kind !== 'generated' || question?.course !== course) return false;
    if (!Number.isInteger(question.level) || question.level < 1 || question.level > 5) return false;
    if (question.paper && !['P1', 'P2', 'P3'].includes(question.paper)) return false;
    if (course === 'aa-sl' || course === 'aa-hl') {
      return question.calculator === true && question.level !== 3 &&
        (question.paper === 'P2' || (!question.paper && question.level === 4));
    }
    if (course === 'ai-sl' || course === 'ai-hl') return question.calculator === true || question.level >= 3;
    return false;
  }

  const source = 'calculator-skills/scratchpad/index.html';
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
    const head = el('div', 'practice-calc-head');
    const title = el('h2', '', 'Calculator'); title.id = 'practice-calc-title';
    const back = el('button', 'practice-calc-back', 'Back to question'); back.type = 'button'; back.autofocus = true;
    const status = el('p', 'practice-calc-status', 'Loading calculator…');
    status.setAttribute('role', 'status');
    head.append(title, back); panel.append(head, status);
    panel.setAttribute('aria-labelledby', title.id);
    const frame = el('iframe', 'practice-calc-frame');
    frame.title = 'Blank TI-Nspire calculator';
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.setAttribute('referrerpolicy', 'no-referrer');
    frame.src = new URL((d.body.dataset.base || './') + source, d.baseURI).href;
    panel.append(frame); d.body.append(panel);
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
    const session = { panel, back, opened: null, dispose() {
      win.removeEventListener('message', onMessage);
      observer.disconnect(); win.clearTimeout(timer);
      panel.remove();
    } };
    panel.id = 'practice-calc';
    panel.addEventListener('close', () => { if (!panel.open) finish(session); });
    panel.addEventListener('cancel', event => { event.preventDefault(); close(); });
    back.addEventListener('click', () => close());
    return session;
  }

  function open(from) {
    if (!win || !owner || !from?.isConnected || current?.panel.open) return;
    const session = current || create();
    if (!session) return;
    current = session;
    session.opened = { from, scroll: win.scrollY };
    from.setAttribute('aria-expanded', 'true');
    from.setAttribute('aria-controls', 'practice-calc');
    win.document.body.classList.add('practice-calc-open');
    // Native Escape while in the parent closes the sheet. The calculator still owns
    // Escape in its iframe, for example to back out of an LCD menu.
    session.panel.showModal();
    session.back.focus({ preventScroll: true });
  }

  function finish(session, restore = true) {
    const opened = session?.opened;
    if (!opened) return;
    session.opened = null;
    win.document.body.classList.remove('practice-calc-open');
    opened.from.removeAttribute('aria-controls');
    opened.from.setAttribute('aria-expanded', 'false');
    if (restore && opened.from.isConnected) {
      opened.from.focus({ preventScroll: true });
      if (win.scrollY !== opened.scroll) win.scrollTo(0, opened.scroll);
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
  function bind(nextOwner) {
    if (owner === nextOwner) return;
    owner = nextOwner;
    if (!current) return;
    close(false);
    current.dispose();
    current = null;
  }

  return Object.freeze({ eligible, open, close, bind });
});
