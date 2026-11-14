/* practice.js — the Practice page (#35).
   Built on the practice engine (assets/js/engine/, see docs/practice-engine.md):
   - Course: Practice follows the course chosen in the top bar (AA SL, AA HL, AI SL, AI HL). Scope,
     progress and worksheets are per course. Generators are written once and offered in every
     course whose syllabus holds their statements; a subtopic with no generator in a course is
     practised with that course's real past-paper questions.
   - Scope: "What's the test on?" Tick whole topics or single subtopics, or open a shared link such as
     practice.html?course=ai-hl&scope=3.2,3.4,3.5&title=Unit%20test
     Questions are mixed across everything ticked. During a session a subtopic can be removed with
     one click, and more can be added without losing the question on screen.
   - Question types: a subtopic row opens to the question types it can be practised with (2.7: solving
     by factorising, the discriminant, ...). Unticking some narrows that subtopic to the rest. The
     state is the scope (a list of codes) plus, for narrowed subtopics only, the chosen type ids:
     state.types, saved per course, carried in the link as types=2.7:id+id;3.4:id and handed to the
     engine as {code: [typeIds]} (learner.next and QBEngine.worksheet do the narrowing).
   - Level: "Adapt to me" moves the level with the student. A fixed range (levels 1-2, 2-3, 3-4)
     serves that difficulty whatever the student's level; those answers are logged and change no level.
   - Session: one question at a time, checked by typed number, multiple choice or pick-the-graph;
     longer written parts are self-marked against the worked solution.
   - Progress: where each subtopic stands, with export and import (the file holds every course).
   - Print a worksheet: a generated set with an answer key of worked solutions.
*/
(function () {
  'use strict';

  const E = window.QBEngine;
  const TYPES = window.QB_TYPES;
  const app = document.getElementById('app');
  if (!E || !TYPES) { app.textContent = 'Practice could not load. Run node scripts/build.mjs.'; return; }

  const L = E.learner;
  const SCOPE_KEY = 'qb-practice-scope';
  const TYPES_KEY = 'qb-practice-types';   // {course: {code: [typeIds]}}, narrowed subtopics only
  const HOME = TYPES.course || 'aa-sl';
  const base = document.body.dataset.base || './';
  const natural = (a, b) => String(a).localeCompare(String(b), undefined, { numeric: true });
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
  E.useCatalogue(TYPES);

  const MIXES = {
    easy: ['Building up (levels 1 and 2)', { 1: 1, 2: 2 }],
    mixed: ['Mixed (levels 2 and 3)', { 2: 1, 3: 1 }],
    exam: ['Exam level (levels 3 and 4)', { 3: 1, 4: 1 }],
    all: ['Everything (levels 1 to 4)', { 1: 1, 2: 2, 3: 2, 4: 1 }],
  };
  // The level a student asks for in a session. Fixed ranges do not move the student's own level.
  const MODES = {
    adapt: ['Adapt to me', null],
    easy: ['Easier (levels 1–2)', [1, 2]],
    mid: ['Middle (levels 2–3)', [2, 3]],
    exam: ['Exam level (levels 3–4)', [3, 4]],
  };

  // ── courses ──────────────────────────────────────────────────────────────
  // One learner per course over one saved state, so switching course never works on a stale copy.
  const store = L.createStore();
  const learners = new Map();
  let firstLoad = null;
  function learnerFor(course) {
    if (!learners.has(course)) {
      const any = learners.values().next().value;
      const lr = L.createLearner({ course, catalogue: TYPES, store, state: any ? any.state : undefined });
      if (!firstLoad) firstLoad = lr.loadStatus;
      learners.set(course, lr);
    }
    return learners.get(course);
  }
  const courseIds = Object.keys(TYPES.statements || {});
  const validCourse = id => (courseIds.includes(id) ? id : HOME);
  let C = null;   // everything about the course being practised
  function courseContext(id) {
    const statements = TYPES.statements[id] || [];
    const info = (TYPES.courses && TYPES.courses[id]) || { id, short: id.toUpperCase().replace('-', ' '), papers: [] };
    const learner = learnerFor(id);
    const typeLists = new Map();
    return {
      // the question types a subtopic has generators for: [{id, name, generators, levels}]
      typesOf: code => { if (!typeLists.has(code)) typeLists.set(code, learner.typesOf(code)); return typeLists.get(code); },
      id, info, short: info.short, statements, learner,
      byCode: new Map(statements.map(s => [s.code, s])),
      topics: [...new Set(statements.map(s => String(s.topic)))],
      real: L.realIndex(TYPES, id),
      strict: E.hasNoCalculatorPaper(id),
      // generated practice exists at one of the levels a student climbs
      generated: code => learner.levelsOf(code).length > 0,
    };
  }
  const topicName = t => (TYPES.topics && TYPES.topics[t]) || `Topic ${t}`;
  const pickable = code => C.generated(code) || (C.real[code] || []).length > 0;

  // ── state ────────────────────────────────────────────────────────────────
  const params = new URLSearchParams(location.search);
  // A scope link without a course is from when Practice was AA SL only.
  if (params.get('scope') && !params.get('course') && window.QB_COURSE && window.QB_COURSE.get() !== HOME) window.QB_COURSE.set(HOME);
  function savedScopes() {
    try {
      const v = JSON.parse(localStorage.getItem(SCOPE_KEY) || '{}');
      if (Array.isArray(v)) return { [HOME]: v };   // the first format: one list, AA SL
      return v && typeof v === 'object' ? v : {};
    } catch (_) { return {}; }
  }
  function savedTypes() {
    try {
      const v = JSON.parse(localStorage.getItem(TYPES_KEY) || '{}');
      return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
    } catch (_) { return {}; }
  }
  // The link form of a type choice: "2.7:fn-discriminant+fn-solve-quadratic;3.4:t3-sine-rule".
  // A "+" in a query string reads back as a space, so both separate the ids.
  function parseTypes(text) {
    const out = {};
    for (const piece of String(text || '').split(';')) {
      const i = piece.indexOf(':');
      if (i > 0) out[piece.slice(0, i).trim()] = piece.slice(i + 1).split(/[+ ]/).filter(Boolean);
    }
    return out;
  }
  // The chosen types as the engine takes them, {code: [typeIds]}: narrowed subtopics of the scope only.
  function typesOpt() {
    const out = {};
    for (const [code, ids] of state.types) if (state.scope.has(code)) out[code] = [...ids];
    return C.learner.narrowing(out);
  }
  function setTypes(obj) {
    state.types = new Map(Object.entries(C.learner.narrowing(obj || {})).filter(([code]) => state.scope.has(code)).map(([code, ids]) => [code, new Set(ids)]));
    state.openTypes = new Set(state.types.keys());
  }
  const state = {
    tab: params.get('ws') ? 'worksheet' : 'practice',
    scope: new Set(), types: new Map(), openTypes: new Set(), title: '', picking: true, mode: 'adapt', filter: '', closed: new Set(),
    item: null, itemMode: null, question: null, extra: false, responses: {}, results: null, selfLeft: 0, change: null, startedAt: 0,
    showMs: false, realImages: null, hint: '', note: '',
    ws: parseWs(params.get('ws')), sheet: null,
  };
  function parseWs(text) {
    const [count, mix, seed] = String(text || '').split(',');
    return { count: [5, 10, 15, 20].includes(+count) ? +count : 10, mix: MIXES[mix] ? mix : 'mixed', seed: Math.max(1, parseInt(seed, 10) || 1) };
  }
  function clearQuestion() {
    Object.assign(state, { item: null, itemMode: null, question: null, extra: false, responses: {}, results: null, selfLeft: 0, change: null, showMs: false, realImages: null, hint: '' });
  }
  // Switches the page to a course: its syllabus, its learner, and the scope last used for it.
  function useCourse(id, link) {
    C = courseContext(validCourse(id));
    const fromLink = link ? (link.get('scope') || '').split(',').filter(c => C.byCode.has(c)) : [];
    const saved = (savedScopes()[C.id] || []).filter(c => C.byCode.has(c));
    state.scope = new Set(fromLink.length ? fromLink : saved);
    setTypes(fromLink.length ? parseTypes(link.get('types')) : savedTypes()[C.id]);
    state.title = fromLink.length ? (link.get('title') || '') : '';
    state.picking = !fromLink.length;
    state.mode = link && MODES[link.get('level')] ? link.get('level') : 'adapt';
    state.filter = ''; state.closed = new Set(); state.sheet = null; state.note = '';
    clearQuestion();
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
  const chip = code => h('span', { class: `st c${String(code).split('.')[0]}`, text: code, title: C.byCode.get(code)?.title || '' });
  const scopeList = () => [...state.scope].sort(natural);
  // The page's address for this scope. The type choice is written unescaped: it only holds codes and ids.
  function query(extra) {
    const p = new URLSearchParams();
    p.set('course', C.id);
    if (state.scope.size) p.set('scope', scopeList().join(','));
    const types = Object.entries(typesOpt()).map(([code, ids]) => `${code}:${ids.join('+')}`).join(';');
    if (state.title) p.set('title', state.title);
    if (state.mode !== 'adapt') p.set('level', state.mode);
    for (const [k, v] of Object.entries(extra || {})) p.set(k, v);
    return p.toString().replace(/%2C/g, ',') + (types ? `&types=${types}` : '');
  }
  const scopeLink = extra => `${location.origin}${location.pathname}?${query(extra)}`;
  function saveScope() {
    try {
      localStorage.setItem(SCOPE_KEY, JSON.stringify(Object.assign(savedScopes(), { [C.id]: scopeList() })));
      localStorage.setItem(TYPES_KEY, JSON.stringify(Object.assign(savedTypes(), { [C.id]: typesOpt() })));
    } catch (_) {}
    history.replaceState(null, '', `${location.pathname}?${query()}`);
  }
  // A subtopic narrowed to some of its question types: "2 of 5 types", and their names.
  const narrowed = code => (state.scope.has(code) && state.types.has(code) ? state.types.get(code) : null);
  const typeCount = code => { const sel = narrowed(code); return sel ? `${sel.size} of ${C.typesOf(code).length} types` : ''; };
  const typeNames = code => { const sel = narrowed(code); return sel ? C.typesOf(code).filter(t => sel.has(t.id)).map(t => t.name) : []; };
  const pickText = code => (narrowed(code) ? `${code} · ${typeCount(code)}` : code);
  const pickTitle = code => `${code} ${C.byCode.get(code)?.title || ''}${narrowed(code) ? `: only ${typeNames(code).join('; ')}` : ''}`;
  function narrowNote() {
    const codes = scopeList().filter(narrowed);
    if (!codes.length) return null;
    return `Narrowed to some question types: ${codes.map(c => `${c} (${typeNames(c).join('; ')})`).join(', ')}. Exam questions and reviews cover the whole subtopic.`;
  }
  const levelsText = ls => (ls.length === 1 ? `level ${ls[0]}` : ls[ls.length - 1] - ls[0] === ls.length - 1 ? `levels ${ls[0]}–${ls[ls.length - 1]}` : `levels ${ls.join(', ')}`);
  const nextOpts = () => { const levels = MODES[state.mode][1]; return Object.assign({ types: typesOpt() }, levels ? { levels } : null); };
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
  // How a real question is titled in this course (an SL question can also sit in an HL paper).
  const realTitle = q => (q.appearances || []).find(a => a.course === C.id)?.title || q.title || '';

  // How many of these subtopics have generated questions; null when all of them do.
  function coverageNote(codes, chosen) {
    const n = codes.filter(C.generated).length;
    if (!codes.length || n === codes.length) return null;
    return chosen
      ? `${n} of the ${plural(codes.length, 'subtopic')} you chose ${n === 1 ? 'has' : 'have'} generated questions. The rest use real ${C.short} exam questions, which you mark yourself with the markscheme.`
      : `${C.short}: ${n} of ${codes.length} subtopics have generated questions so far. The rest use real ${C.short} exam questions, which you mark yourself with the markscheme.`;
  }
  const modeSelect = onchange => h('label', { class: 'mode-pick' }, h('span', { class: 'cap', text: 'Level' }),
    h('select', { class: 'select', 'aria-label': 'Level of the questions', onchange: e => onchange(e.target.value) },
      ...Object.entries(MODES).map(([k, [text]]) => h('option', { value: k, text, selected: k === state.mode }))));

  // ── render ───────────────────────────────────────────────────────────────
  function render() {
    const tab = (id, text) => h('button', { type: 'button', class: state.tab === id ? 'on' : '', role: 'tab', 'aria-selected': String(state.tab === id), text, onclick: () => { state.tab = id; render(); } });
    app.replaceChildren(h('main', { class: 'prac' },
      h('div', { class: 'page-head no-print' }, h('h1', { text: 'Practice' }), h('span', { class: 'muted', text: `${C.short} · your progress is saved in this browser` })),
      firstLoad === 'unreadable' ? h('p', { class: 'verdict no no-print', text: 'Your saved progress could not be read. It has been kept aside, not deleted, and a fresh record was started.' }) : null,
      h('div', { class: 'prac-tabs no-print', role: 'tablist' }, tab('practice', 'Practise'), tab('progress', 'Progress'), tab('worksheet', 'Print a worksheet')),
      ...(state.tab === 'practice' ? practiceView() : state.tab === 'progress' ? progressView() : worksheetView())));
  }

  // ── scope: what's the test on? ───────────────────────────────────────────
  function statusText(row) {
    if (!row) return '';
    if (row.status === 'unavailable') return 'no questions yet';
    if (row.status === 'not-started') return row.attempts ? `not started · ${row.correct}/${row.attempts}` : 'not started';
    if (row.status === 'real-only') return row.attempts ? `past-paper questions · ${row.correct}/${row.attempts}` : 'past-paper questions';
    if (row.status === 'exam') return 'exam questions';
    if (row.status === 'review-due') return 'review due';
    if (row.status === 'refresh') return 'refreshing';
    if (row.status === 'level') return `level ${row.level}`;
    return '';
  }
  // The chooser updates itself in place (ticks, counts, the bar), so a tick or a keystroke in the
  // filter never loses the focus or the scroll position.
  function scopeView() {
    const rows = new Map(C.learner.summary(C.statements.map(s => s.code)).map(r => [r.code, r]));
    const inSession = () => Boolean(state.item && state.item.kind !== 'none' && state.scope.has(state.item.unit));
    const groups = C.topics.map(t => {
      const subs = C.statements.filter(s => String(s.topic) === t);
      const can = subs.filter(s => pickable(s.code)).map(s => s.code);
      const g = { t, subs, can, rows: [] };
      g.all = h('input', { type: 'checkbox', onchange: e => toggle(can, e.target.checked) });
      g.count = h('span', { class: 'n' });
      g.node = h('details', { class: 'scope-topic', open: !state.closed.has(t),
        ontoggle: e => { if (state.filter) return; e.target.open ? state.closed.delete(t) : state.closed.add(t); } },
        h('summary', {},
          h('span', { class: `dot bg${t}` }), h('b', { text: t }), h('span', { class: 'tn', text: topicName(t) }), g.count,
          h('label', { class: 'whole', title: `Tick or clear every subtopic of topic ${t}`, onclick: e => e.stopPropagation() }, g.all, h('span', { text: 'Whole topic' }))),
        ...subs.map(s => {
          const types = C.typesOf(s.code);
          const input = h('input', { type: 'checkbox', disabled: !pickable(s.code), onchange: e => toggle([s.code], e.target.checked) });
          const r = { s, input, types, own: `${s.code} ${s.title}`.toLowerCase() };
          r.text = `${r.own} ${types.map(t => t.name).join(' ')}`.toLowerCase();
          // Below the subtopic: its question types, each with a tick.
          if (types.length) {
            r.tins = types.map(t => h('input', { type: 'checkbox', onchange: e => toggleType(s.code, t.id, e.target.checked) }));
            r.list = h('div', { class: 'scope-types', id: `types-${C.id}-${s.code}`, hidden: !state.openTypes.has(s.code) },
              ...types.map((t, i) => h('label', { class: 'type-row' }, r.tins[i], h('span', { class: 't', text: t.name }),
                h('span', { class: 'lv', text: `${plural(t.generators, 'way')} to ask · ${levelsText(t.levels)}` }))),
              h('p', { class: 'type-note', text: types.length > 1 ? 'Untick what you do not want yet. Exam questions and reviews cover the whole subtopic.' : 'This subtopic has one question type so far.' }));
            r.setOpen = open => { r.list.hidden = !open; r.exp.setAttribute('aria-expanded', String(open)); };
            r.exp = h('button', { class: 'scope-exp', type: 'button', 'aria-expanded': String(state.openTypes.has(s.code)), 'aria-controls': r.list.id,
              title: `Choose question types within ${s.code}`,
              onclick: () => { const open = r.list.hidden; open ? state.openTypes.add(s.code) : state.openTypes.delete(s.code); r.setOpen(open); } });
          }
          r.row = h('div', { class: `scope-row${pickable(s.code) ? '' : ' off'}` },
            h('label', { class: 'scope-main' }, input, chip(s.code), h('span', { class: 't', text: s.title })),
            r.exp, h('span', { class: 'lv', text: statusText(rows.get(s.code)) }));
          r.node = h('div', { class: 'scope-sub' }, r.row, r.list);
          g.rows.push(r);
          return r.node;
        }));
      return g;
    });
    const none = h('p', { class: 'scope-none', hidden: true, text: 'No subtopic matches. Try a code such as 2.7 or a word from its title.' });
    const bar = h('div', { class: 'scope-bar scope-go' });
    const note = h('p', { class: 'scope-note' });
    const picked = h('div', { class: 'scope-picked' });
    const more = h('span', { class: 'scope-more' });

    // The subtopic's own tick means everything in it: it clears any choice of types.
    function toggle(codes, on) {
      for (const c of codes) { on ? state.scope.add(c) : state.scope.delete(c); state.types.delete(c); }
      state.title = ''; state.sheet = null;
      saveScope(); sync();
    }
    // A type's tick: the subtopic is in the scope while one of its types is ticked, and it is
    // narrowed while some but not all of them are.
    function toggleType(code, id, on) {
      const all = C.typesOf(code).map(t => t.id);
      const cur = new Set(state.scope.has(code) ? state.types.get(code) || all : []);
      on ? cur.add(id) : cur.delete(id);
      state.types.delete(code);
      if (!cur.size) state.scope.delete(code);
      else { state.scope.add(code); if (cur.size < all.length) state.types.set(code, cur); }
      state.title = ''; state.sheet = null;
      saveScope(); sync();
    }
    function applyFilter() {
      const words = state.filter.toLowerCase().split(/\s+/).filter(Boolean);
      let shown = 0;
      for (const g of groups) {
        let n = 0;
        for (const r of g.rows) {
          const hit = words.every(w => r.text.includes(w));
          r.node.hidden = !hit;
          if (hit) n++;
          // found by the name of one of its question types: show them
          if (r.list) r.setOpen(state.openTypes.has(r.s.code) || (hit && words.length > 0 && !words.every(w => r.own.includes(w))));
        }
        g.node.hidden = n === 0;
        g.node.open = words.length ? true : !state.closed.has(g.t);
        shown += n;
      }
      none.hidden = shown > 0;
    }
    function sync() {
      for (const g of groups) {
        const n = g.can.filter(c => state.scope.has(c)).length;
        g.all.checked = n > 0 && n === g.can.length;
        g.all.indeterminate = n > 0 && n < g.can.length;
        g.all.disabled = !g.can.length;
        g.count.textContent = n ? `${n} of ${g.subs.length} picked` : plural(g.subs.length, 'subtopic');
        g.count.classList.toggle('on', n > 0);
        for (const r of g.rows) {
          const on = state.scope.has(r.s.code), sel = narrowed(r.s.code);
          // narrowed: a half tick, and one click on it takes the whole subtopic again
          r.input.checked = on && !sel;
          r.input.indeterminate = Boolean(sel);
          r.row.classList.toggle('on', on);
          if (!r.list) continue;
          r.exp.textContent = sel ? typeCount(r.s.code) : plural(r.types.length, 'type');
          r.exp.classList.toggle('on', Boolean(sel));
          r.list.classList.toggle('on', on);
          r.tins.forEach((tin, i) => { tin.checked = on && (!sel || sel.has(r.types[i].id)); });
        }
      }
      const n = state.scope.size;
      const text = coverageNote(n ? scopeList() : C.statements.map(s => s.code), n > 0);
      note.textContent = text || '';
      note.hidden = !text;
      picked.replaceChildren(...(!n ? [] : [h('span', { class: 'cap', text: `Picked (${n})` }),
        ...scopeList().map(c => h('span', { class: `st c${c.split('.')[0]} pick`, title: pickTitle(c) }, pickText(c),
          h('button', { type: 'button', 'aria-label': `Remove ${c} ${C.byCode.get(c).title}`, title: `Remove ${c} ${C.byCode.get(c).title}`, text: '×', onclick: () => toggle([c], false) }))),
        h('span', { class: 'sp' }), more]));
      picked.hidden = !n;
      bar.replaceChildren(...[
        modeSelect(v => { state.mode = v; saveScope(); }),
        h('button', { class: 'btn', type: 'button', disabled: !n,
          text: !n ? 'Tick at least one subtopic' : inSession() ? `Back to practice (${plural(n, 'subtopic')})` : n === 1 ? 'Start practice on 1 subtopic' : `Start mixed practice on ${n} subtopics`,
          onclick: () => { state.picking = false; resume(); } })]);
      more.replaceChildren(...[
        n ? h('button', { class: 'btn ghost small', type: 'button', text: 'Copy link to this scope', title: 'A link that opens Practice on exactly these subtopics, to share with a class',
          onclick: e => copy(scopeLink(), e.target) }) : null,
        n ? h('button', { class: 'link', type: 'button', text: 'Clear', onclick: () => toggle([...state.scope], false) }) : null].filter(Boolean));
    }
    const setAll = open => { state.closed = new Set(open ? [] : C.topics); for (const g of groups) g.node.open = open || Boolean(state.filter); };
    sync(); applyFilter();
    return h('section', { class: 'block scope' },
      h('div', { class: 'block-head' }, h('h2', { text: "What's the test on?" }),
        h('p', { text: 'Tick a whole topic or just the subtopics you need, from as many topics as you like. Questions are mixed across everything you tick. To go finer, open a subtopic\'s types and untick what has not been taught yet.' })),
      h('div', { class: 'scope-tools' },
        h('input', { class: 'input', type: 'search', placeholder: 'Find a subtopic, e.g. 2.7 or logarithms', 'aria-label': 'Find a subtopic', value: state.filter,
          oninput: e => { state.filter = e.target.value; applyFilter(); } }),
        h('button', { class: 'link', type: 'button', text: 'Open all', onclick: () => setAll(true) }),
        h('button', { class: 'link', type: 'button', text: 'Close all', onclick: () => setAll(false) })),
      note,
      ...groups.map(g => g.node), none,
      picked, bar);
  }
  function scopeSummary() {
    const list = scopeList();
    const remove = code => {
      state.scope.delete(code); state.types.delete(code); state.title = ''; state.sheet = null;
      saveScope();
      if (!state.scope.size) { state.picking = true; clearQuestion(); render(); return; }
      // The question on screen stays unless it belongs to the subtopic just removed and is unanswered.
      if (state.item && state.item.unit === code && !state.results) nextQuestion(); else render();
    };
    const text = coverageNote(list, true), fine = narrowNote();
    return h('div', { class: 'block scope-now' },
      h('div', { class: 'scope-bar' },
        h('span', { class: 'cap', text: state.title || 'Practising' }),
        h('span', { class: 'muted', text: list.length === 1 ? '1 subtopic' : `mixed across ${list.length} subtopics` }),
        h('span', { class: 'sp' }),
        modeSelect(v => { state.mode = v; saveScope(); if (state.results) render(); else nextQuestion(); }),
        h('button', { class: 'link', type: 'button', text: 'Copy link', onclick: e => copy(scopeLink(), e.target) })),
      h('div', { class: 'scope-bar chips' },
        ...list.map(c => h('span', { class: `st c${c.split('.')[0]} pick`, title: pickTitle(c) }, pickText(c),
          h('button', { type: 'button', 'aria-label': `Stop practising ${c} ${C.byCode.get(c).title}`, title: `Stop practising ${c} ${C.byCode.get(c).title}`, text: '×', onclick: () => remove(c) }))),
        h('button', { class: 'btn ghost small', type: 'button', text: '+ Add or change', title: 'Tick more subtopics or choose question types. The question on screen stays.', onclick: () => { state.picking = true; render(); } })),
      state.mode !== 'adapt' ? h('p', { class: 'scope-note', text: `Fixed level: ${MODES[state.mode][0].toLowerCase()}. These answers are logged but do not move your own level.` }) : null,
      fine ? h('p', { class: 'scope-note', text: fine }) : null,
      text ? h('p', { class: 'scope-note', text }) : null);
  }

  // ── session ──────────────────────────────────────────────────────────────
  function showReal(item) {
    loadData().then(() => { if (state.item === item) { state.realImages = realQuestion(item.questionId) || false; render(); } },
      () => { if (state.item === item) { state.realImages = false; render(); } });
  }
  function setQuestion(item, question, extra) {
    Object.assign(state, { item, itemMode: state.mode, question, extra: Boolean(extra), responses: {}, results: null, selfLeft: 0, change: null, startedAt: Date.now(), showMs: false, realImages: null, hint: '' });
    render();
    window.scrollTo(0, 0);
    if (item && item.kind === 'real') showReal(item);
  }
  function nextQuestion() {
    const item = C.learner.next(scopeList(), nextOpts());
    setQuestion(item, item.kind === 'generated' ? item.question : null, false);
  }
  // Back from the chooser: keep the question on screen when it still belongs to the scope.
  function resume() {
    const it = state.item;
    // ... and, for a subtopic narrowed meanwhile, when it is of a type still chosen.
    const sel = it && narrowed(it.unit);
    const offType = Boolean(sel && state.question && !['refresh', 'synoptic'].includes(it.reason) && !sel.has(state.question.type));
    const keep = it && it.kind !== 'none' && state.scope.has(it.unit) && (state.results || (state.itemMode === state.mode && !offType));
    if (keep) { render(); window.scrollTo(0, 0); } else nextQuestion();
  }
  let extraSeed = 0;
  function another() {
    const q = E.make(Object.assign({}, state.question.request, { seed: `again-${Date.now().toString(36)}-${++extraSeed}` }));
    setQuestion(state.item, q, true);
  }
  function anotherWay(request) { setQuestion(state.item, E.make(request), true); }

  function finish(correct, selfMarked) {
    if (state.extra) return;   // extra practice does not move the level
    const { change, saved: ok } = C.learner.record(state.item, { correct, selfMarked, timeMs: Date.now() - state.startedAt });
    state.change = { text: C.learner.explain(change), kind: change ? change.kind : '', saved: ok };
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

  function partView(q, p) {
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
      : h('select', { class: 'select way-pick', 'aria-label': 'Ask it another way', onchange: e => { if (e.target.value !== '') anotherWay(variants[+e.target.value].request); } },
        h('option', { value: '', text: 'Ask it another way…' }),
        ...variants.map((v, i) => h('option', { value: String(i), text: `${v.title}${v.sameSituation ? ' (same numbers)' : ''}` })));
    return h('div', { class: 'next-row' },
      h('button', { class: 'btn', type: 'button', text: 'Next question →', onclick: nextQuestion }),
      state.question ? h('button', { class: 'btn ghost', type: 'button', text: 'Another like this', onclick: another }) : null,
      way);
  }
  // "No calculator" is a rule only where the course has a paper without one; elsewhere a
  // by-hand question says what it expects instead.
  function calcChip(q) {
    const label = E.calculatorLabel(q);
    const title = q.calculator ? null : C.strict ? 'Paper 1 style: do this one without a calculator' : `Every ${C.short} paper allows a calculator. This question is set to be done by hand: give an exact answer.`;
    return h('span', { class: `chip${q.calculator ? '' : ' on'}`, text: label, title });
  }

  function generatedView() {
    const q = state.question, item = state.item;
    const name = E.levelName(q.level, C.id);
    const settled = state.results && !state.selfLeft;
    return h('section', { class: 'block qcard' },
      h('div', { class: 'qmeta' }, ...q.syllabus.slice(0, 2).map(chip), h('span', { text: q.title }), h('span', { class: 'sp' }),
        h('span', { class: 'chip', text: `Level ${q.level}${name ? ` · ${name}` : ''}` }),
        calcChip(q),
        h('span', { class: 'mono', text: `[${q.marks}]` })),
      state.extra ? h('div', { class: 'verdict info', text: 'Extra practice. It does not change your level.' })
        : item.reason === 'refresh' ? h('div', { class: 'verdict info', text: `A refresher for ${item.refreshFor} ${C.byCode.get(item.refreshFor)?.title || ''}.` })
        : item.reason === 'review' ? h('div', { class: 'verdict info', text: 'A review, to check this is still secure.' }) : null,
      q.stem ? Object.assign(mx(q.stem, 'div'), { className: 'stem' }) : null,
      q.table ? tableOf(q.table) : null,
      q.graph ? svg(q.graph) : null,
      ...q.parts.map(p => partView(q, p)),
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
    const paper = q ? (C.info.papers || []).find(p => p.id === q.paper) : null;
    const whole = narrowed(item.unit) ? ' Exam questions cover the whole subtopic, not only the question types you chose.' : '';
    const why = item.reason === 'review' ? 'A review with a real exam question. Mark it yourself with the markscheme.' + whole
      : item.reason === 'exam' ? 'You are at exam level here: a real exam question. Mark it yourself with the markscheme.' + whole
      : `There is no generated practice for ${item.unit} in ${C.short} yet, so here is a real exam question. Mark it yourself with the markscheme.`;
    return h('section', { class: 'block qcard' },
      h('div', { class: 'qmeta' }, chip(item.unit), h('span', { text: q ? `Past-paper question · ${realTitle(q)}` : 'Past-paper question' }), h('span', { class: 'sp' }),
        paper ? h('span', { class: 'chip', text: paper.name }) : null,
        q ? h('span', { class: `chip${q.calculator ? '' : ' on'}`, text: q.calculator ? 'Calculator' : 'No calculator' }) : null,
        h('span', { class: 'mono', text: `[${item.marks}]` })),
      h('div', { class: 'verdict info', text: why }),
      q === null ? h('p', { class: 'loading', text: 'Loading the question…' }) : null,
      q === false ? h('p', {}, 'The question could not be loaded here. ', h('a', { href: `${base}questions/${item.questionId}/`, target: '_blank', rel: 'noopener', text: 'Open it in a new tab' }), '.') : null,
      q ? h('div', { class: 'real-q' }, ...q.paperImages.map((src, i) => h('img', { src: base + src, alt: `Question, page ${i + 1}`, loading: i ? 'lazy' : null }))) : null,
      q && state.showMs ? h('div', {}, h('span', { class: 'cap', text: 'Markscheme' }),
        h('div', { class: 'real-q' }, ...q.markschemeImages.map((src, i) => h('img', { src: base + src, alt: `Markscheme, page ${i + 1}` })))) : null,
      q && !state.showMs ? h('div', { class: 'next-row' },
        h('button', { class: 'btn', type: 'button', text: 'Show the markscheme', onclick: () => { state.showMs = true; render(); } }),
        h('button', { class: 'link', type: 'button', text: 'Skip', onclick: nextQuestion })) : null,
      q === false ? h('div', { class: 'next-row' }, h('button', { class: 'btn', type: 'button', text: 'Next question →', onclick: nextQuestion })) : null,
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
    if (!state.item) {
      const item = C.learner.next(scopeList(), nextOpts());
      Object.assign(state, { item, itemMode: state.mode, question: item.kind === 'generated' ? item.question : null, startedAt: Date.now() });
      if (item.kind === 'real') showReal(item);
    }
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
  // After an import or a reset the saved state is a new object: every course's learner starts from it.
  function reloadLearners() { learners.clear(); C = courseContext(C.id); clearQuestion(); state.sheet = null; }
  function progressView() {
    const learner = C.learner;
    const all = C.statements.map(s => s.code);
    const inScope = state.scope.size ? scopeList() : all;
    const rows = learner.summary(all);
    const shown = rows.filter(r => inScope.includes(r.code));
    const started = rows.filter(r => r.attempts).length;
    const others = Object.keys(learner.state.courses || {}).filter(c => c !== C.id && courseIds.includes(c) && learner.state.attempts.some(a => a.course === c));
    const exportFile = () => {
      const blob = new Blob([learner.exportJSON()], { type: 'application/json' });
      const a = h('a', { href: URL.createObjectURL(blob), download: `practice-progress-${new Date().toISOString().slice(0, 10)}.json` });
      document.body.append(a); a.click(); a.remove();
    };
    const importFile = e => {
      const file = e.target.files[0];
      if (!file) return;
      file.text().then(text => {
        try { learner.importJSON(text); reloadLearners(); state.note = 'Progress imported for every course in the file. The record it replaced was kept aside in this browser.'; }
        catch (err) { state.note = `That file could not be imported: ${err.message}`; }
        render();
      });
    };
    const group = t => {
      const list = shown.filter(r => String(C.byCode.get(r.code).topic) === t);
      if (!list.length) return null;
      return [h('div', { class: 'scope-topic' }, h('div', { class: 'scope-bar', style: 'border-top:0' }, h('span', { class: `dot bg${t}` }), h('b', { text: `${t} ${topicName(t)}` }))),
        ...list.map(r => h('div', { class: 'prog-row' }, chip(r.code),
          h('div', {}, h('div', { style: 'font-weight:600', text: r.title }), h('div', { class: 'note', text: r.next + (r.attempts ? ` ${r.correct} of ${r.attempts} right so far.` : '') + (narrowed(r.code) ? ` Practising ${typeCount(r.code)}: ${typeNames(r.code).join('; ')}.` : '') })),
          h('div', { style: 'text-align:right' }, meter(r), h('div', { class: 'w', text: r.reviewDue ? 'review due' : r.nextReview ? `review ${new Date(r.nextReview).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : statusText(r) }))))];
    };
    const realOnly = all.length - all.filter(C.generated).length;
    return [h('section', { class: 'block' },
      h('div', { class: 'block-head' }, h('h2', { text: state.scope.size ? `${C.short} · your scope: ${plural(shown.length, 'subtopic')}` : `${C.short} · all subtopics` }),
        h('p', { text: `${started} of ${rows.length} subtopics started. Levels 1 to 4 are generated questions; after level 4 come real exam questions, then reviews after 3, 7 and 14 days.`
          + (realOnly ? ` ${plural(realOnly, 'subtopic')} of ${C.short} ${realOnly === 1 ? 'has' : 'have'} no generated questions yet and ${realOnly === 1 ? 'uses' : 'use'} real exam questions from the start.` : '') })),
      ...C.topics.map(group).flat().filter(Boolean),
      state.note ? h('div', { class: 'scope-bar' }, h('span', { class: 'verdict info', text: state.note })) : null,
      h('div', { class: 'scope-bar' },
        h('button', { class: 'btn ghost', type: 'button', text: 'Export progress', title: 'Save your progress in every course as one file', onclick: exportFile }),
        h('label', { class: 'btn ghost', style: 'cursor:pointer' }, 'Import progress', h('input', { type: 'file', accept: 'application/json,.json', hidden: true, onchange: importFile })),
        h('span', { class: 'sp' }),
        h('button', { class: 'link', type: 'button', text: `Reset ${C.short} progress`, onclick: () => {
          if (!confirm(`Start ${C.short} again from nothing? Other courses are left alone. Your current progress is kept aside in this browser, and you can export it first.`)) return;
          learner.resetCourse(); clearQuestion(); state.note = `${C.short} progress reset.`; render();
        } })),
      h('div', { class: 'scope-bar' }, h('span', { class: 'note', text: `Nothing is sent anywhere. Each course keeps its own progress${others.length ? ` (you also have progress in ${others.map(c => TYPES.courses?.[c]?.short || c).join(', ')})` : ''}; the export file holds all of them. To move to another device, export here and import there.` })))];
  }

  // ── print a worksheet ────────────────────────────────────────────────────
  function makeSheet() {
    state.sheet = E.worksheet({ course: C.id, scope: scopeList(), count: state.ws.count, levels: MIXES[state.ws.mix][1], seed: state.ws.seed, real: C.real, types: typesOpt() });
    if (state.sheet.items.some(it => it.kind === 'real')) loadData().then(render, render);
  }
  function sheetDoc() {
    const sheet = state.sheet;
    const title = state.title || `${C.short} practice: ${scopeList().join(', ')}`;
    const question = (it, i) => {
      if (it.kind === 'real') {
        const q = realQuestion(it.questionId);
        return h('div', { class: 'ws-q' }, h('b', { text: `${i + 1}. ` }), `Past-paper question [${it.marks}]`,
          q ? h('div', {}, ...q.paperImages.map(src => h('img', { src: base + src, alt: '', style: 'width:100%' }))) : h('p', { text: 'Loading…' }));
      }
      const q = it.question;
      return h('div', { class: 'ws-q' },
        h('div', { class: 'pl' }, h('b', { text: `${i + 1}.` }), mx(q.stem || q.parts[0].prompt), h('span', { class: 'mk', text: q.calculator ? `[${q.marks}]` : `[${q.marks}] ${E.calculatorLabel(q).toLowerCase()}` })),
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
    const reals = sheet.items.filter(it => it.kind === 'real').length;
    return h('div', { class: 'ws-doc' },
      h('h2', { text: title }),
      h('div', { text: `${plural(sheet.items.length, 'question')} · ${sheet.marks} marks · Name: ______________________` }),
      ...sheet.items.map(question),
      h('h3', { style: 'break-before:page', text: 'Answer key and worked solutions' }),
      ...sheet.items.map(key),
      h('p', { style: 'font-size:11px;margin-top:16px', text: `Worksheet ${state.ws.seed} · ${C.short} · generated practice in the style of IB questions, not IB questions${reals ? `, with ${plural(reals, 'real past-paper question')} where a subtopic has no generated practice` : ''}.` }));
  }
  function worksheetView() {
    if (!state.scope.size) return [h('section', { class: 'block qcard' }, h('p', { text: 'Choose what the worksheet is on first.' }),
      h('div', {}, h('button', { class: 'btn', type: 'button', text: 'Choose subtopics', onclick: () => { state.tab = 'practice'; state.picking = true; render(); } })))];
    if (!state.sheet) makeSheet();
    const set = (k, v) => { state.ws[k] = v; state.sheet = null; render(); };
    const text = coverageNote(scopeList(), true), fine = narrowNote();
    return [h('section', { class: 'block no-print' },
      h('div', { class: 'block-head' }, h('h2', { text: 'Print a worksheet' }), h('p', { text: 'A fixed set of questions mixed across your scope, with an answer key of worked solutions on a new page.' })),
      h('div', { class: 'scope-bar' }, h('span', { class: 'cap', text: 'On' }), ...scopeList().slice(0, 14).map(c => h('span', { class: `st c${c.split('.')[0]}`, text: pickText(c), title: pickTitle(c) })),
        state.scope.size > 14 ? h('span', { class: 'muted', text: `+${state.scope.size - 14} more` }) : null,
        h('button', { class: 'link', type: 'button', text: 'Change', onclick: () => { state.tab = 'practice'; state.picking = true; render(); } })),
      fine ? h('p', { class: 'scope-note', text: fine.replace(' Exam questions and reviews cover the whole subtopic.', '') }) : null,
      text ? h('p', { class: 'scope-note', text }) : null,
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

  // ── start ────────────────────────────────────────────────────────────────
  useCourse(window.QB_COURSE ? window.QB_COURSE.get() : params.get('course') || HOME, params);
  window.QB_PRACTICE = { state, get learner() { return C.learner; }, get course() { return C.id; } };   // for tests and debugging
  // The course switch in the top bar: the same page, the other course's scope and progress.
  if (window.QB_COURSE) window.QB_COURSE.onChange(id => { if (id === C.id) return; useCourse(id, null); saveScope(); render(); });
  render();
})();
