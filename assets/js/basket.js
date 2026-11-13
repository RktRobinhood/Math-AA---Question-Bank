/* basket.js — "Your paper": the questions chosen for a test, and the panel that shows them.
   Loaded on every page. Works alongside generate.js (Set up and export).

   - The paper is saved in this browser (localStorage, same key and format as the old output
     basket, so papers saved before the redesign still load).
   - Any <button data-add="<question id>"> on any page adds or removes that question. The
     question's data comes from window.QB_LOOKUP(id) (set by the page) or window.AASL_Q.
   - The panel opens from the "Your paper" button in the top bar (shell.js).
*/
(function () {
  'use strict';

  const STORAGE_KEY = 'aasl-basket-v1';
  const OPEN_KEY = 'qb-paper-open';
  const base = document.body.dataset.base || './';

  // ── storage ──────────────────────────────────────────────────────────────
  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch (_) { return []; }
  }
  function save(items) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }
    catch (_) {}
  }
  // Keep only what the panel and the export need.
  function slim(q) {
    return {
      id: q.id, title: q.title, marks: q.marks, section: q.section, paper: q.paper, timezone: q.timezone,
      year: q.year, session: q.session, course: q.course, topicNumbers: q.topicNumbers,
      paperImages: q.paperImages, markschemeImages: q.markschemeImages,
      parts: (q.parts || []).map(p => ({ label: p.label, marks: p.marks, skill: p.skill, syllabus: p.syllabus })),
    };
  }
  function lookup(id) {
    if (window.AASL_Q && window.AASL_Q.id === id) return window.AASL_Q;
    return typeof window.QB_LOOKUP === 'function' ? window.QB_LOOKUP(id) : null;
  }

  // ── public API ───────────────────────────────────────────────────────────
  const api = {
    getAll: () => load(),
    has: (id) => load().some(q => q.id === id),
    count: () => load().length,
    totalMarks: () => load().reduce((s, q) => s + (q.marks || 0), 0),
    add(question) {
      const items = load();
      if (items.some(q => q.id === question.id)) return false;
      items.push(slim(question));
      save(items);
      sync();
      return true;
    },
    remove(id) { save(load().filter(q => q.id !== id)); sync(); },
    reorder(items) { save(items); sync(); },
    clear() { try { localStorage.removeItem(STORAGE_KEY); } catch (_) {} sync(); },
    refresh: syncButtons,
  };
  window.AASL_BASKET = api;

  // ── + buttons anywhere on the page ───────────────────────────────────────
  function syncButtons() {
    const ids = new Set(load().map(q => q.id));
    document.querySelectorAll('[data-add]').forEach(btn => {
      const on = ids.has(btn.dataset.add);
      btn.classList.toggle('in', on);
      btn.setAttribute('aria-pressed', String(on));
      if (btn.dataset.addLabel !== undefined) btn.textContent = on ? '✓ In your paper' : '+ Add to paper';
      else { btn.textContent = on ? '✓' : '+'; btn.title = on ? 'Remove from your paper' : 'Add to your paper'; btn.setAttribute('aria-label', btn.title); }
      const holder = btn.closest('.card');
      if (holder) holder.classList.toggle('in', on);
    });
    document.querySelectorAll('[data-paper-count]').forEach(n => { n.textContent = String(ids.size); });
  }
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-add]');
    if (!btn) return;
    e.preventDefault();
    const id = btn.dataset.add;
    if (api.has(id)) api.remove(id);
    else { const q = lookup(id); if (q) api.add(q); }
  });

  // ── the panel ────────────────────────────────────────────────────────────
  let panel = null;
  let open = false;
  let dragId = null;
  const wide = () => window.matchMedia('(min-width: 861px)').matches;
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const codeTitle = q => q.title;
  const minutes = marks => Math.round(marks * 90 / 80);   // IB pace: 80 marks in 90 minutes

  function topicMarks(items) {
    const by = new Map();
    for (const q of items) {
      const tagged = (q.parts || []).filter(p => p.syllabus && p.syllabus.length);
      if (tagged.length) {
        for (const p of tagged) for (const s of p.syllabus) {
          const t = String(s).split('.')[0];
          by.set(t, (by.get(t) || 0) + p.marks / p.syllabus.length);
        }
      } else {
        const ts = q.topicNumbers && q.topicNumbers.length ? q.topicNumbers : ['0'];
        for (const t of ts) by.set(t, (by.get(t) || 0) + (q.marks || 0) / ts.length);
      }
    }
    return [...by].sort((a, b) => a[0].localeCompare(b[0]));
  }

  function render() {
    if (!panel) {
      panel = document.createElement('aside');
      panel.className = 'draw';
      panel.id = 'paper';
      panel.setAttribute('aria-label', 'Your paper');
      document.body.appendChild(panel);
      panel.addEventListener('click', onClick);
      wireDrag();
    }
    panel.hidden = !open;
    document.body.classList.toggle('paper-open', open);
    if (!open) return;

    const items = load();
    const marks = items.reduce((s, q) => s + (q.marks || 0), 0);
    const topics = topicMarks(items);
    panel.innerHTML = `
      <div class="dh">
        <h3>Your paper <span>saved in this browser</span><button type="button" class="icon-btn close" data-act="close" aria-label="Close">×</button></h3>
        <div class="tot"><div><b>${items.length}</b><span>question${items.length === 1 ? '' : 's'}</span></div><div><b>${marks}</b><span>marks</span></div><div><b>~${minutes(marks)}</b><span>minutes</span></div></div>
        ${items.length ? `<div class="bal" role="img" aria-label="Marks by topic">${topics.map(([t, m]) => `<i class="bg${esc(t)}" style="flex:${m.toFixed(2)}" title="Topic ${esc(t)}: ${Math.round(m)} marks"></i>`).join('')}</div>
        <div class="ball">${topics.map(([t, m]) => `<span><i class="dot bg${esc(t)}"></i>T${esc(t)} · ${Math.round(m)}</span>`).join('')}</div>` : ''}
      </div>
      <ol class="dl">
        ${items.map((q, i) => `
        <li class="di" data-id="${esc(q.id)}" draggable="true">
          <span class="h" title="Drag to reorder" aria-hidden="true">⋮⋮</span>
          <span class="no">${i + 1}</span>
          <a class="tt" href="${base}questions/${esc(q.id)}/"><b>${esc(codeTitle(q))}</b><span>${esc((q.parts || []).map(p => p.skill).filter(Boolean).join('; ') || (q.section ? 'Section ' + q.section : ''))}</span></a>
          <span class="mk">[${q.marks || 0}]</span>
          <span class="mv"><button type="button" data-act="up" aria-label="Move up"${i === 0 ? ' disabled' : ''}>↑</button><button type="button" data-act="down" aria-label="Move down"${i === items.length - 1 ? ' disabled' : ''}>↓</button></span>
          <button type="button" class="rm" data-act="remove" aria-label="Remove ${esc(q.title)}">×</button>
        </li>`).join('')}
        ${items.length ? '' : '<li class="hint">Press + on any question to add it here. Then set up the cover sheet and export a PDF or Word file.</li>'}
      </ol>
      <div class="df">
        ${items.length ? '<div class="row"><span class="muted">Drag to reorder</span><button type="button" class="link" data-act="clear">Clear all</button></div>' : ''}
        <button type="button" class="btn" data-act="export"${items.length ? '' : ' disabled'}>Set up and export →</button>
      </div>`;
  }

  function move(id, delta) {
    const items = load();
    const i = items.findIndex(q => q.id === id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= items.length) return;
    [items[i], items[j]] = [items[j], items[i]];
    api.reorder(items);
  }

  function onClick(e) {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (!act) return;
    const id = e.target.closest('.di')?.dataset.id;
    if (act === 'close') paper.close();
    else if (act === 'remove') api.remove(id);
    else if (act === 'up') move(id, -1);
    else if (act === 'down') move(id, 1);
    else if (act === 'clear') { if (confirm('Remove every question from your paper?')) api.clear(); }
    else if (act === 'export' && typeof window.AASL_GENERATE === 'function') window.AASL_GENERATE();
  }

  function wireDrag() {
    panel.addEventListener('dragstart', e => {
      const li = e.target.closest('.di');
      if (!li) return;
      dragId = li.dataset.id;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', dragId);
      li.classList.add('dragging');
    });
    panel.addEventListener('dragover', e => {
      const li = e.target.closest('.di');
      if (!li || !dragId || li.dataset.id === dragId) return;
      e.preventDefault();
      panel.querySelectorAll('.di.over').forEach(n => n.classList.remove('over'));
      li.classList.add('over');
    });
    panel.addEventListener('drop', e => {
      const li = e.target.closest('.di');
      if (!li || !dragId) return;
      e.preventDefault();
      const items = load();
      const from = items.findIndex(q => q.id === dragId);
      const to = items.findIndex(q => q.id === li.dataset.id);
      if (from < 0 || to < 0) return;
      items.splice(to, 0, items.splice(from, 1)[0]);
      dragId = null;
      api.reorder(items);
    });
    panel.addEventListener('dragend', () => { dragId = null; panel.querySelectorAll('.di').forEach(n => n.classList.remove('dragging', 'over')); });
  }

  const paper = {
    isOpen: () => open,
    open() { setOpen(true); },
    close() { setOpen(false); },
    toggle() { setOpen(!open); },
  };
  window.QB_PAPER = paper;
  function setOpen(v) {
    open = v;
    try { localStorage.setItem(OPEN_KEY, v ? '1' : '0'); } catch (_) {}
    render();
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && open && !wide() && !document.querySelector('.scrim')) paper.close(); });

  function sync() {
    render();
    syncButtons();
  }

  function init() {
    // On a wide screen the panel stays as the reader left it; on a phone it starts closed.
    try { open = wide() && localStorage.getItem(OPEN_KEY) === '1' && load().length > 0; } catch (_) {}
    sync();
  }
  // Another tab changed the paper.
  window.addEventListener('storage', e => { if (e.key === STORAGE_KEY) sync(); });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
