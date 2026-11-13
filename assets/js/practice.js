/* practice.js — the Practice page (#35).
   Built on the practice engine (assets/js/engine/, see docs/practice-engine.md):
   - Scope: "What's the test on?" Tick subtopics, or open a shared link such as
     practice.html?scope=3.2,3.4,3.5&title=Unit%20test
   - Session: one question at a time, checked by typed number, multiple choice or pick-the-graph;
     longer written parts are self-marked against the worked solution. Subtopics without a
     generator yet are served their real past-paper questions.
   - Levels move by simple rules and progress is remembered in this browser (QBEngine.learner).
   - Progress: where each subtopic stands, with export and import.
   - Print a worksheet: a generated set with an answer key of worked solutions.
   Practice covers AA SL for now; the engine takes a course, so the others can follow.
*/
(function () {
  'use strict';

  const E = window.QBEngine;
  const TYPES = window.QB_TYPES;
  const app = document.getElementById('app');
  if (!E || !TYPES) { app.textContent = 'Practice could not load. Run node scripts/build.mjs.'; return; }

  const COURSE = 'aa-sl';
  const L = E.learner;
  const SCOPE_KEY = 'qb-practice-scope';
  const base = document.body.dataset.base || './';
  const statements = (TYPES.statements && TYPES.statements[COURSE]) || [];
  const byCode = new Map(statements.map(s => [s.code, s]));
  const topics = [...new Set(statements.map(s => String(s.topic)))];
  const TOPIC_NAMES = { 1: 'Number and algebra', 2: 'Functions', 3: 'Geometry and trigonometry', 4: 'Statistics and probability', 5: 'Calculus' };
  const natural = (a, b) => String(a).localeCompare(String(b), undefined, { numeric: true });
  const learner = L.createLearner({ course: COURSE, catalogue: TYPES });

  const MIXES = {
    easy: ['Building up (levels 1 and 2)', { 1: 1, 2: 2 }],
    mixed: ['Mixed (levels 2 and 3)', { 2: 1, 3: 1 }],
    exam: ['Exam level (levels 3 and 4)', { 3: 1, 4: 1 }],
    all: ['Everything (levels 1 to 4)', { 1: 1, 2: 2, 3: 2, 4: 1 }],
  };

  // ── state ────────────────────────────────────────────────────────────────
  const params = new URLSearchParams(location.search);
  const fromLink = (params.get('scope') || '').split(',').filter(c => byCode.has(c));
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem(SCOPE_KEY) || '[]').filter(c => byCode.has(c)); } catch (_) {}
  const state = {
    tab: params.get('ws') ? 'worksheet' : 'practice',
    scope: new Set(fromLink.length ? fromLink : saved),
    title: fromLink.length ? (params.get('title') || '') : '',
    picking: !fromLink.length,          // the scope chooser is open
    item: null, question: null, extra: false, responses: {}, results: null, selfLeft: 0, change: null, startedAt: 0,
    showMs: false, realImages: null,
    ws: parseWs(params.get('ws')), sheet: null,
  };
  function parseWs(text) {
    const [count, mix, seed] = String(text || '').split(',');
    return { count: [5, 10, 15, 20].includes(+count) ? +count : 10, mix: MIXES[mix] ? mix : 'mixed', seed: Math.max(1, parseInt(seed, 10) || 1) };
  }

  // ── small helpers ────────────────────────────────────────────────────────
  function h(tag, attrs, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k === 'html') n.innerHTML = v;
      else if (k === 'value') n.value = v;
      else if (k === 'checked' || k === 'disabled' || k === 'open' || k === 'hidden' || k === 'indeterminate' || k === 'selected') n[k] = Boolean(v);
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid !== null && kid !== undefined && kid !== false && kid !== '') n.append(kid);
    return n;
  }
  // Engine strings are plain text with inline maths in $...$.
  function mx(str, tag) {
    const node = document.createElement(tag || 'span');
    for (const seg of E.segments(String(str == null ? '' : str))) {
      if (!seg.math) { node.append(seg.text); continue; }
      const m = document.createElement('span');
      if (window.katex) {
        try { m.innerHTML = window.katex.renderToString(seg.text, { throwOnError: false }); } catch (_) { m.textContent = seg.text; }
      } else m.textContent = seg.text;
      node.append(m);
    }
    return node;
  }
  const chip = code => h('span', { class: `st c${String(code).split('.')[0]}`, text: code, title: byCode.get(code)?.title || '' });
  const scopeList = () => [...state.scope].sort(natural);
  const scopeLink = extra => {
    const p = new URLSearchParams();
    p.set('scope', scopeList().join(','));
    if (state.title) p.set('title', state.title);
    for (const [k, v] of Object.entries(extra || {})) p.set(k, v);
    return `${location.origin}${location.pathname}?${p.toString().replace(/%2C/g, ',')}`;
  };
  function saveScope() {
    try { localStorage.setItem(SCOPE_KEY, JSON.stringify(scopeList())); } catch (_) {}
    const p = new URLSearchParams();
    if (state.scope.size) p.set('scope', scopeList().join(','));
    if (state.title) p.set('title', state.title);
    const qs = p.toString().replace(/%2C/g, ',');
    history.replaceState(null, '', location.pathname + (qs ? `?${qs}` : ''));
  }
  async function copy(text, btn) {
    const was = btn.textContent;
    try { await navigator.clipboard.writeText(text); btn.textContent = 'Link copied'; }
    catch (_) { prompt('Copy this link', text); }
    setTimeout(() => { btn.textContent = was; }, 1600);
  }
  const svg = (graph, opts) => h('div', { class: 'graph', html: E.graph.toSVG(graph, opts || { width: 420, height: 320 }), role: 'img', 'aria-label': graph.alt || 'Graph' });
  function tableOf(t) {
    return h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl qtable' },
      h('thead', {}, h('tr', {}, ...t.head.map(c => h('th', {}, mx(c))))),
      h('tbody', {}, ...t.rows.map(r => h('tr', {}, ...r.map((c, i) => h(i ? 'td' : 'th', {}, mx(c))))))));
  }
  // Real questions need the image lists in data.js, which is large; fetch it only when one comes up.
  let dataLoading = null;
  function loadData() {
    if (window.AASL_DATA) return Promise.resolve();
    if (!dataLoading) dataLoading = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = base + 'assets/js/data.js'; s.onload = res; s.onerror = () => rej(new Error('Could not load the question bank.'));
      document.head.append(s);
    });
    return dataLoading;
  }
  const realQuestion = id => (window.AASL_DATA?.questions || []).find(q => q.id === id);
  window.QB_LOOKUP = realQuestion;

  // ── render ───────────────────────────────────────────────────────────────
  function render() {
    const tab = (id, text) => h('button', { type: 'button', class: state.tab === id ? 'on' : '', role: 'tab', 'aria-selected': String(state.tab === id), text, onclick: () => { state.tab = id; render(); } });
    const other = window.QB_COURSE && window.QB_COURSE.get() !== COURSE;
    app.replaceChildren(h('main', { class: 'prac' },
      h('div', { class: 'page-head no-print' }, h('h1', { text: 'Practice' }), h('span', { class: 'muted', text: 'AA SL · your progress is saved in this browser' })),
      other ? h('p', { class: 'verdict info no-print', text: `Practice covers AA SL for now. ${window.QB_COURSE.info().short} will follow; the questions below are AA SL.` }) : null,
      learner.loadStatus === 'unreadable' ? h('p', { class: 'verdict no no-print', text: 'Your saved progress could not be read. It has been kept aside, not deleted, and a fresh record was started.' }) : null,
      h('div', { class: 'prac-tabs no-print', role: 'tablist' }, tab('practice', 'Practise'), tab('progress', 'Progress'), tab('worksheet', 'Print a worksheet')),
      ...(state.tab === 'practice' ? practiceView() : state.tab === 'progress' ? progressView() : worksheetView())));
  }

  // ── scope: what's the test on? ───────────────────────────────────────────
  function statusText(row) {
    if (!row) return '';
    if (row.status === 'not-started') return 'not started';
    if (row.status === 'real-only') return row.attempts ? `past-paper questions · ${row.correct}/${row.attempts}` : 'past-paper questions';
    if (row.status === 'exam') return 'exam questions';
    if (row.status === 'review-due') return 'review due';
    if (row.status === 'refresh') return 'refreshing';
    if (row.status === 'level') return `level ${row.level}`;
    return '';
  }
  function scopeView() {
    const rows = new Map(learner.summary(statements.map(s => s.code)).map(r => [r.code, r]));
    const toggle = (codes, on) => { for (const c of codes) on ? state.scope.add(c) : state.scope.delete(c); state.title = ''; saveScope(); render(); };
    const tree = topics.map(t => {
      const subs = statements.filter(s => String(s.topic) === t);
      const n = subs.filter(s => state.scope.has(s.code)).length;
      return h('details', { class: 'scope-topic', open: n > 0 && n < subs.length },
        h('summary', {},
          h('input', { type: 'checkbox', checked: n === subs.length, indeterminate: n > 0 && n < subs.length, 'aria-label': `All of topic ${t}`,
            onclick: e => e.stopPropagation(), onchange: e => toggle(subs.map(s => s.code), e.target.checked) }),
          h('span', { class: `dot bg${t}` }), h('b', { text: t }), h('span', { text: TOPIC_NAMES[t] || `Topic ${t}` }),
          h('span', { class: 'n', text: n ? `${n} of ${subs.length}` : String(subs.length) })),
        ...subs.map(s => h('label', { class: 'scope-row' },
          h('input', { type: 'checkbox', checked: state.scope.has(s.code), onchange: e => toggle([s.code], e.target.checked) }),
          chip(s.code), h('span', { class: 't', text: s.title }), h('span', { class: 'lv', text: statusText(rows.get(s.code)) }))));
    });
    return h('section', { class: 'block' },
      h('div', { class: 'block-head' }, h('h2', { text: "What's the test on?" }),
        h('p', { text: 'Tick what you have studied. Practice stays inside it, starts in the middle and moves up or down with you.' })),
      ...tree,
      h('div', { class: 'scope-bar' },
        h('button', { class: 'btn', type: 'button', disabled: !state.scope.size, text: state.scope.size ? `Start practice on ${state.scope.size} subtopic${state.scope.size === 1 ? '' : 's'}` : 'Tick at least one subtopic',
          onclick: () => { state.picking = false; nextQuestion(); } }),
        state.scope.size ? h('button', { class: 'btn ghost', type: 'button', text: 'Copy link to this scope', title: 'A link that opens Practice on exactly these subtopics, to share with a class',
          onclick: e => copy(scopeLink(), e.target) }) : null,
        state.scope.size ? h('button', { class: 'link', type: 'button', text: 'Clear', onclick: () => toggle([...state.scope], false) }) : null));
  }
  function scopeSummary() {
    return h('div', { class: 'block scope-bar' },
      h('span', { class: 'cap', text: state.title || 'Practising' }),
      ...scopeList().slice(0, 12).map(chip),
      state.scope.size > 12 ? h('span', { class: 'muted', text: `+${state.scope.size - 12} more` }) : null,
      h('span', { class: 'sp' }),
      h('button', { class: 'link', type: 'button', text: 'Change', onclick: () => { state.picking = true; render(); } }),
      h('button', { class: 'link', type: 'button', text: 'Copy link', onclick: e => copy(scopeLink(), e.target) }));
  }

  // ── session ──────────────────────────────────────────────────────────────
  function setQuestion(item, question, extra) {
    Object.assign(state, { item, question, extra: Boolean(extra), responses: {}, results: null, selfLeft: 0, change: null, startedAt: Date.now(), showMs: false, realImages: null });
    render();
    window.scrollTo(0, 0);
    if (item && item.kind === 'real') {
      loadData().then(() => { state.realImages = realQuestion(item.questionId) || false; render(); }, () => { state.realImages = false; render(); });
    }
  }
  function nextQuestion() {
    const item = learner.next(scopeList());
    setQuestion(item, item.kind === 'generated' ? item.question : null, false);
  }
  let extraSeed = 0;
  function another() {
    const q = E.make(Object.assign({}, state.question.request, { seed: `again-${Date.now().toString(36)}-${++extraSeed}` }));
    setQuestion(state.item, q, true);
  }
  function anotherWay(request) { setQuestion(state.item, E.make(request), true); }

  function finish(correct, selfMarked) {
    if (state.extra) return;   // extra practice does not move the level
    const { change, saved: ok } = learner.record(state.item, { correct, selfMarked, timeMs: Date.now() - state.startedAt });
    state.change = { text: learner.explain(change), kind: change ? change.kind : '', saved: ok };
  }

  function check() {
    const q = state.question;
    const missing = q.parts.filter(p => p.answer.kind !== 'self' && (state.responses[p.label] === undefined || state.responses[p.label] === ''));
    if (missing.length) { state.hint = `Answer part${missing.length === 1 ? '' : 's'} ${missing.map(p => `(${p.label})`).join(', ')} first, or type your best attempt.`; render(); return; }
    state.hint = '';
    state.results = {};
    for (const p of q.parts) if (p.answer.kind !== 'self') state.results[p.label] = E.mark(q, p.label, state.responses[p.label]);
    state.selfLeft = q.parts.filter(p => p.answer.kind === 'self').length;
    if (!state.selfLeft) finish(Object.values(state.results).every(r => r.correct), false);
    render();
  }
  function selfVerdict(label, ok) {
    state.results[label] = { correct: ok, selfMarked: true };
    state.selfLeft = state.question.parts.filter(p => !state.results[p.label]).length;
    if (!state.selfLeft) finish(state.question.parts.every(p => state.results[p.label].correct), true);
    render();
  }

  function partView(q, p, i) {
    const res = state.results && state.results[p.label];
    const done = Boolean(state.results);
    const a = p.answer;
    let input = null;
    if (a.kind === 'number') {
      input = h('div', { class: 'ans-row' },
        h('input', { class: 'input', type: 'text', inputmode: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', value: state.responses[p.label] || '', disabled: done,
          placeholder: a.exact ? 'exact value or 3 s.f.' : a.sigfigs ? 'to 3 s.f.' : 'your answer', 'aria-label': `Answer to part ${p.label}`,
          oninput: e => { state.responses[p.label] = e.target.value; },
          onkeydown: e => { if (e.key === 'Enter' && !done) check(); } }),
        a.unit ? mx(a.unit) : null,
        h('span', { class: 'muted', text: 'Fractions such as 3/4 are fine.' }));
    } else if (a.kind === 'choice' || a.kind === 'graph') {
      input = h('div', { class: 'opts', role: 'radiogroup' }, ...a.options.map((o, k) => {
        const cls = ['opt', state.responses[p.label] === k ? 'sel' : '', done && res && k === res.expectedIndex ? 'right' : '', done && res && !res.correct && state.responses[p.label] === k ? 'wrong' : ''].join(' ');
        return h('button', { class: cls, type: 'button', role: 'radio', 'aria-checked': String(state.responses[p.label] === k), disabled: done,
          onclick: () => { state.responses[p.label] = k; render(); } },
          a.kind === 'graph' ? svg(o, { width: 260, height: 200, label: 'ABCDEF'[k] }) : [h('b', { class: 'mono', text: 'ABCDEF'[k] }), mx(typeof o === 'string' ? o : o.text)]);
      }));
    }
    const out = [];
    if (done && a.kind !== 'self' && res) {
      out.push(h('div', { class: `verdict ${res.correct ? 'ok' : 'no'}` },
        res.correct ? 'Correct. ' : res.invalid ? 'That is not a number. ' : 'Not quite. ', res.correct ? null : 'Answer: ', res.correct ? null : mx(res.expected),
        res.misconception ? h('div', { style: 'font-weight:500;margin-top:4px' }, mx(res.misconception.text || res.misconception)) : null));
    }
    if (done) {
      out.push(h('div', { class: 'working' }, h('span', { class: 'cap', text: 'Worked solution' }),
        h('ol', {}, ...p.working.map(w => h('li', {}, mx(w)))),
        a.kind === 'self' && a.display ? h('p', {}, h('b', { text: 'Answer: ' }), mx(a.display)) : null));
      if (a.kind === 'self') {
        out.push(res ? h('div', { class: `verdict ${res.correct ? 'ok' : 'no'}`, text: res.correct ? 'Marked as right.' : 'Marked as not yet.' })
          : h('div', { class: 'next-row' }, h('span', { class: 'muted', style: 'align-self:center', text: 'Compare your work with the solution:' }),
            h('button', { class: 'btn', type: 'button', text: 'I got it right', onclick: () => selfVerdict(p.label, true) }),
            h('button', { class: 'btn ghost', type: 'button', text: 'Not yet', onclick: () => selfVerdict(p.label, false) })));
      }
    }
    return h('div', { class: 'ppart' },
      h('div', { class: 'pl' }, q.parts.length > 1 ? h('span', { class: 'l', text: `(${p.label})` }) : null, mx(p.prompt), h('span', { class: 'mk', text: `[${p.marks}]` })),
      a.kind === 'self' && !done ? h('p', { class: 'muted', text: 'Write this one on paper. You will mark it yourself against the worked solution.' }) : null,
      input, ...out);
  }

  function afterBar() {
    const variants = state.question ? E.variants(state.question) : [];
    const way = variants.length === 0 ? null : variants.length === 1
      ? h('button', { class: 'btn ghost', type: 'button', text: 'Ask it another way', title: variants[0].title, onclick: () => anotherWay(variants[0].request) })
      : h('select', { class: 'select', style: 'width:auto;min-height:40px', 'aria-label': 'Ask it another way', onchange: e => { if (e.target.value !== '') anotherWay(variants[+e.target.value].request); } },
        h('option', { value: '', text: 'Ask it another way…' }),
        ...variants.map((v, i) => h('option', { value: String(i), text: `${v.title}${v.sameSituation ? ' (same numbers)' : ''}` })));
    return h('div', { class: 'next-row' },
      h('button', { class: 'btn', type: 'button', text: 'Next question →', onclick: nextQuestion }),
      state.question ? h('button', { class: 'btn ghost', type: 'button', text: 'Another like this', onclick: another }) : null,
      way);
  }

  function generatedView() {
    const q = state.question, item = state.item;
    const level = E.LEVELS[q.level];
    const settled = state.results && !state.selfLeft;
    return h('section', { class: 'block qcard' },
      h('div', { class: 'qmeta' }, ...q.syllabus.slice(0, 2).map(chip), h('span', { text: q.title }), h('span', { class: 'sp' }),
        h('span', { class: 'chip', text: `Level ${q.level}${level ? ` · ${level.name}` : ''}` }),
        h('span', { class: `chip${q.calculator ? '' : ' on'}`, text: q.calculator ? 'Calculator' : 'No calculator' }),
        h('span', { class: 'mono', text: `[${q.marks}]` })),
      state.extra ? h('div', { class: 'verdict info', text: 'Extra practice. It does not change your level.' })
        : item.reason === 'refresh' ? h('div', { class: 'verdict info', text: `A refresher for ${item.refreshFor} ${byCode.get(item.refreshFor)?.title || ''}.` })
        : item.reason === 'review' ? h('div', { class: 'verdict info', text: 'A review, to check this is still secure.' }) : null,
      q.stem ? Object.assign(mx(q.stem, 'div'), { className: 'stem' }) : null,
      q.table ? tableOf(q.table) : null,
      q.graph ? svg(q.graph) : null,
      ...q.parts.map((p, i) => partView(q, p, i)),
      state.hint ? h('div', { class: 'verdict info', text: state.hint }) : null,
      !state.results ? h('div', { class: 'next-row' },
        h('button', { class: 'btn', type: 'button', text: q.parts.every(p => p.answer.kind === 'self') ? 'Show the worked solution' : 'Check', onclick: check }),
        h('button', { class: 'link', type: 'button', text: 'Skip', onclick: nextQuestion })) : null,
      settled && state.change && state.change.text ? h('div', { class: 'verdict info' }, mx(state.change.text)) : null,
      settled && state.change && state.change.saved === false ? h('div', { class: 'verdict no', text: 'This browser would not save your progress (private window or full storage).' }) : null,
      settled ? afterBar() : null);
  }

  function realView() {
    const item = state.item;
    const q = state.realImages;
    const answered = Boolean(state.results);
    const verdict = ok => { state.results = { real: { correct: ok } }; finish(ok, true); render(); };
    return h('section', { class: 'block qcard' },
      h('div', { class: 'qmeta' }, chip(item.unit), h('span', { text: 'Past-paper question' }), h('span', { class: 'sp' }),
        q ? h('span', { class: `chip${q.calculator ? '' : ' on'}`, text: q.calculator ? 'Calculator' : 'No calculator' }) : null,
        h('span', { class: 'mono', text: `[${item.marks}]` })),
      h('div', { class: 'verdict info', text: item.reason === 'real-only' ? 'There is no generated practice for this subtopic yet, so here is a real exam question. Mark it yourself with the markscheme.'
        : item.reason === 'review' ? 'A review with a real exam question. Mark it yourself with the markscheme.' : 'You are at exam level here: a real exam question. Mark it yourself with the markscheme.' }),
      q === null ? h('p', { class: 'loading', text: 'Loading the question…' }) : null,
      q === false ? h('p', {}, 'The question could not be loaded here. ', h('a', { href: `${base}questions/${item.questionId}/`, target: '_blank', rel: 'noopener', text: 'Open it in a new tab' }), '.') : null,
      q ? h('div', { class: 'real-q' }, ...q.paperImages.map((src, i) => h('img', { src: base + src, alt: `Question, page ${i + 1}`, loading: i ? 'lazy' : null }))) : null,
      q && state.showMs ? h('div', {}, h('span', { class: 'cap', text: 'Markscheme' }),
        h('div', { class: 'real-q' }, ...q.markschemeImages.map((src, i) => h('img', { src: base + src, alt: `Markscheme, page ${i + 1}` })))) : null,
      q && !state.showMs ? h('div', { class: 'next-row' },
        h('button', { class: 'btn', type: 'button', text: 'Show the markscheme', onclick: () => { state.showMs = true; render(); } }),
        h('button', { class: 'link', type: 'button', text: 'Skip', onclick: nextQuestion })) : null,
      state.showMs && !answered ? h('div', { class: 'next-row' },
        h('span', { class: 'muted', style: 'align-self:center', text: 'Mark your work:' }),
        h('button', { class: 'btn', type: 'button', text: 'I got it right', title: 'Full marks, or close to it', onclick: () => verdict(true) }),
        h('button', { class: 'btn ghost', type: 'button', text: 'Not yet', onclick: () => verdict(false) })) : null,
      answered && state.change && state.change.text ? h('div', { class: 'verdict info' }, mx(state.change.text)) : null,
      answered ? h('div', { class: 'next-row' }, h('button', { class: 'btn', type: 'button', text: 'Next question →', onclick: nextQuestion }),
        h('a', { class: 'btn ghost', href: `${base}questions/${item.questionId}/`, target: '_blank', rel: 'noopener', text: 'Open the question page' })) : null);
  }

  function practiceView() {
    if (state.picking || !state.scope.size) return [scopeView()];
    if (!state.item) { const item = learner.next(scopeList()); Object.assign(state, { item, question: item.kind === 'generated' ? item.question : null, startedAt: Date.now() });
      if (item.kind === 'real') loadData().then(() => { state.realImages = realQuestion(item.questionId) || false; render(); }, () => { state.realImages = false; render(); }); }
    const item = state.item;
    const body = item.kind === 'none'
      ? h('section', { class: 'block qcard' }, h('p', { text: 'There is nothing to practise in this scope yet. Choose different subtopics.' }))
      : item.kind === 'real' ? realView() : generatedView();
    return [scopeSummary(), body];
  }

  // ── progress ─────────────────────────────────────────────────────────────
  function meter(row) {
    const top = 4;
    const at = row.level === 'exam' || row.status === 'exam' || row.status === 'review-due' ? top + 1 : Number(row.level) || 0;
    return h('span', { class: 'lvl', title: at > top ? 'Exam questions' : at ? `Level ${at} of ${top}` : 'Not started' },
      ...[1, 2, 3, 4].map(i => h('i', { class: at > top ? 'x' : i <= at ? 'f' : '' })), h('i', { class: at > top ? 'x' : '', style: 'width:8px' }));
  }
  function progressView() {
    const inScope = state.scope.size ? scopeList() : statements.map(s => s.code);
    const rows = learner.summary(statements.map(s => s.code));
    const shown = rows.filter(r => inScope.includes(r.code));
    const started = rows.filter(r => r.attempts).length;
    const exportFile = () => {
      const blob = new Blob([learner.exportJSON()], { type: 'application/json' });
      const a = h('a', { href: URL.createObjectURL(blob), download: `practice-progress-${new Date().toISOString().slice(0, 10)}.json` });
      document.body.append(a); a.click(); a.remove();
    };
    const importFile = e => {
      const file = e.target.files[0];
      if (!file) return;
      file.text().then(text => {
        try { learner.importJSON(text); state.note = 'Progress imported. The record it replaced was kept aside in this browser.'; state.item = null; }
        catch (err) { state.note = `That file could not be imported: ${err.message}`; }
        render();
      });
    };
    const group = t => {
      const list = shown.filter(r => String(byCode.get(r.code).topic) === t);
      if (!list.length) return null;
      return [h('div', { class: 'scope-topic' }, h('div', { class: 'scope-bar', style: 'border-top:0' }, h('span', { class: `dot bg${t}` }), h('b', { text: `${t} ${TOPIC_NAMES[t] || ''}` }))),
        ...list.map(r => h('div', { class: 'prog-row' }, chip(r.code),
          h('div', {}, h('div', { style: 'font-weight:600', text: r.title }), h('div', { class: 'note', text: r.next + (r.attempts ? ` ${r.correct} of ${r.attempts} right so far.` : '') })),
          h('div', { style: 'text-align:right' }, meter(r), h('div', { class: 'w', text: r.reviewDue ? 'review due' : r.nextReview ? `review ${new Date(r.nextReview).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : statusText(r) }))))];
    };
    return [h('section', { class: 'block' },
      h('div', { class: 'block-head' }, h('h2', { text: state.scope.size ? `Your scope: ${shown.length} subtopic${shown.length === 1 ? '' : 's'}` : 'All subtopics' }),
        h('p', { text: `${started} of ${rows.length} subtopics started. Levels 1 to 4 are generated questions; after level 4 come real exam questions, then reviews after 3, 7 and 14 days.` })),
      ...topics.map(group).flat().filter(Boolean),
      state.note ? h('div', { class: 'scope-bar' }, h('span', { class: 'verdict info', text: state.note })) : null,
      h('div', { class: 'scope-bar' },
        h('button', { class: 'btn ghost', type: 'button', text: 'Export progress', title: 'Save your progress as a file', onclick: exportFile }),
        h('label', { class: 'btn ghost', style: 'cursor:pointer' }, 'Import progress', h('input', { type: 'file', accept: 'application/json,.json', hidden: true, onchange: importFile })),
        h('span', { class: 'sp' }),
        h('button', { class: 'link', type: 'button', text: 'Reset progress', onclick: () => {
          if (!confirm('Start again from nothing? Your current progress is kept aside in this browser, and you can export it first.')) return;
          learner.reset(); state.item = null; state.note = 'Progress reset.'; render();
        } })),
      h('div', { class: 'scope-bar' }, h('span', { class: 'note', text: 'Nothing is sent anywhere. To move to another device, export here and import there.' })))];
  }

  // ── print a worksheet ────────────────────────────────────────────────────
  function makeSheet() {
    state.sheet = E.worksheet({ course: COURSE, scope: scopeList(), count: state.ws.count, levels: MIXES[state.ws.mix][1], seed: state.ws.seed, real: L.realIndex(TYPES, COURSE) });
    if (state.sheet.items.some(it => it.kind === 'real')) loadData().then(render, render);
  }
  function sheetDoc() {
    const sheet = state.sheet;
    const title = state.title || `Practice: ${scopeList().join(', ')}`;
    const question = (it, i) => {
      if (it.kind === 'real') {
        const q = realQuestion(it.questionId);
        return h('div', { class: 'ws-q' }, h('b', { text: `${i + 1}. ` }), `Past-paper question [${it.marks}]`,
          q ? h('div', {}, ...q.paperImages.map(src => h('img', { src: base + src, alt: '', style: 'width:100%' }))) : h('p', { text: 'Loading…' }));
      }
      const q = it.question;
      return h('div', { class: 'ws-q' },
        h('div', { class: 'pl' }, h('b', { text: `${i + 1}.` }), mx(q.stem || q.parts[0].prompt), h('span', { class: 'mk', text: q.calculator ? `[${q.marks}]` : `[${q.marks}] no calculator` })),
        q.table ? tableOf(q.table) : null, q.graph ? svg(q.graph, { width: 320, height: 240 }) : null,
        ...q.parts.filter((p, k) => q.stem || k > 0).map(p => h('div', {},
          h('div', { class: 'pl' }, q.parts.length > 1 ? h('span', { text: `(${p.label})` }) : null, mx(p.prompt), h('span', { class: 'mk', text: `[${p.marks}]` })),
          p.answer.kind === 'choice' ? h('div', { class: 'pl' }, ...p.answer.options.map((o, k) => h('span', { style: 'margin-right:18px' }, h('b', { text: `${'ABCDEF'[k]}  ` }), mx(typeof o === 'string' ? o : o.text)))) : null,
          p.answer.kind === 'graph' ? h('div', { class: 'opts' }, ...p.answer.options.map((o, k) => svg(o, { width: 220, height: 170, label: 'ABCDEF'[k] }))) : null)));
    };
    const key = (it, i) => {
      if (it.kind === 'real') {
        const q = realQuestion(it.questionId);
        return h('div', { class: 'ws-q' }, h('b', { text: `${i + 1}. ` }), q ? h('div', {}, ...q.markschemeImages.map(src => h('img', { src: base + src, alt: '', style: 'width:100%' }))) : 'Markscheme');
      }
      const q = it.question;
      return h('div', { class: 'ws-q' }, h('b', { text: `${i + 1}.` }),
        ...q.parts.map(p => {
          const a = p.answer;
          const ans = a.kind === 'choice' ? `${'ABCDEF'[a.correct]}: ${typeof a.options[a.correct] === 'string' ? a.options[a.correct] : a.options[a.correct].text}` : a.kind === 'graph' ? `Graph ${'ABCDEF'[a.correct]}` : a.display;
          return h('div', { style: 'margin:4px 0 8px' },
            h('div', {}, q.parts.length > 1 ? h('b', { text: `(${p.label}) ` }) : null, h('b', { text: 'Answer: ' }), mx(ans), `  [${p.marks}]`),
            h('ol', { style: 'margin:4px 0 0;padding-left:22px' }, ...p.working.map(w => h('li', {}, mx(w)))));
        }));
    };
    return h('div', { class: 'ws-doc' },
      h('h2', { text: title }),
      h('div', { text: `${sheet.items.length} questions · ${sheet.marks} marks · Name: ______________________` }),
      ...sheet.items.map(question),
      h('h3', { style: 'break-before:page', text: 'Answer key and worked solutions' }),
      ...sheet.items.map(key),
      h('p', { style: 'font-size:11px;margin-top:16px', text: `Worksheet ${state.ws.seed} · generated practice in the style of IB questions, not IB questions.` }));
  }
  function worksheetView() {
    if (!state.scope.size) return [h('section', { class: 'block qcard' }, h('p', { text: 'Choose what the worksheet is on first.' }),
      h('div', {}, h('button', { class: 'btn', type: 'button', text: 'Choose subtopics', onclick: () => { state.tab = 'practice'; state.picking = true; render(); } })))];
    if (!state.sheet) makeSheet();
    const set = (k, v) => { state.ws[k] = v; state.sheet = null; render(); };
    return [h('section', { class: 'block no-print' },
      h('div', { class: 'block-head' }, h('h2', { text: 'Print a worksheet' }), h('p', { text: 'A fixed set of generated questions on your scope, with an answer key of worked solutions on a new page.' })),
      h('div', { class: 'scope-bar' }, h('span', { class: 'cap', text: 'On' }), ...scopeList().slice(0, 14).map(chip),
        h('button', { class: 'link', type: 'button', text: 'Change', onclick: () => { state.tab = 'practice'; state.picking = true; render(); } })),
      h('div', { class: 'ws-opts' },
        h('div', { class: 'f' }, h('label', { for: 'ws-count', text: 'Questions' }),
          h('select', { class: 'select', id: 'ws-count', onchange: e => set('count', +e.target.value) }, ...[5, 10, 15, 20].map(n => h('option', { value: String(n), text: String(n), selected: n === state.ws.count })))),
        h('div', { class: 'f' }, h('label', { for: 'ws-mix', text: 'Level mix' }),
          h('select', { class: 'select', id: 'ws-mix', onchange: e => set('mix', e.target.value) }, ...Object.entries(MIXES).map(([k, [t]]) => h('option', { value: k, text: t, selected: k === state.ws.mix })))),
        h('button', { class: 'btn ghost', type: 'button', text: 'New set of questions', onclick: () => set('seed', state.ws.seed + 1) }),
        h('span', { class: 'sp' }),
        h('button', { class: 'btn ghost', type: 'button', text: 'Copy link to this worksheet', onclick: e => copy(scopeLink({ ws: `${state.ws.count},${state.ws.mix},${state.ws.seed}` }), e.target) }),
        h('button', { class: 'btn', type: 'button', text: 'Print or save as PDF', onclick: () => window.print() }))),
      sheetDoc()];
  }

  window.QB_PRACTICE = { state, learner };   // for tests and debugging
  if (window.QB_COURSE) window.QB_COURSE.onChange(render);
  render();
})();
