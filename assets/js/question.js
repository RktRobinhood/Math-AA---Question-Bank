/* question.js — the question page.
   scripts/build.mjs writes the markup; this file adds the behaviour:
   - Question / Markscheme / Side by side tabs (plus Parts and Similar on a phone), zoom, full screen;
   - "Back to N results" with Prev / Next (and the arrow keys) when the reader came from a
     filtered list, in that list's order. The list is handed over in sessionStorage by app.js;
   - the parts table: pressing a part opens its sub-skills and marks where that part sits on
     the question. Hovering a part marks it for the moment; pressing keeps it marked (#31);
   - Copy link, and "See all" similar questions.
*/
(function () {
  'use strict';

  const Q = window.AASL_Q;
  if (!Q) return;
  const $ = id => document.getElementById(id);
  const base = document.body.dataset.base || '../../';
  const view = $('q-view');
  const panes = { question: view.querySelector('[data-pane="question"]'), markscheme: view.querySelector('[data-pane="markscheme"]') };

  // Similar questions can be added to the paper from here.
  const known = new Map((window.AASL_SIMILAR || []).map(q => [q.id, q]));
  window.QB_LOOKUP = id => known.get(id) || null;

  // ── tabs ─────────────────────────────────────────────────────────────────
  const tabs = [...document.querySelectorAll('.tabs .tab')];
  function setTab(name) {
    document.body.dataset.qtab = name;
    tabs.forEach(t => { t.classList.toggle('on', t.dataset.tab === name); t.setAttribute('aria-selected', String(t.dataset.tab === name)); });
    const both = name === 'both';
    view.classList.toggle('sbs', both);
    panes.question.hidden = !(both || name !== 'markscheme');
    panes.markscheme.hidden = !(both || name === 'markscheme');
  }
  tabs.forEach(t => t.addEventListener('click', () => setTab(t.dataset.tab)));
  setTab('question');

  // ── zoom and full screen ─────────────────────────────────────────────────
  let zoom = 1;
  function setZoom(z) {
    zoom = Math.min(3, Math.max(0.5, z));
    view.style.setProperty('--zoom', zoom);
    $('q-zoom').textContent = `${Math.round(zoom * 100)}%`;
  }
  document.querySelectorAll('[data-zoom]').forEach(b => b.addEventListener('click', () => setZoom(zoom + Number(b.dataset.zoom) * 0.25)));
  $('q-zoom').addEventListener('dblclick', () => setZoom(1));
  const full = $('q-full');
  if (!view.requestFullscreen) full.hidden = true;
  full.addEventListener('click', () => { document.fullscreenElement ? document.exitFullscreen() : view.requestFullscreen(); });
  document.addEventListener('fullscreenchange', () => { full.textContent = document.fullscreenElement ? '⤡ Exit full screen' : '⤢ Full screen'; });

  // ── parts ────────────────────────────────────────────────────────────────
  const partButtons = [...document.querySelectorAll('.part')];
  function showPart(i) {
    partButtons.forEach(b => {
      const on = b.dataset.part === i && !b.classList.contains('on');
      b.classList.toggle('on', on);
      b.setAttribute('aria-expanded', String(on));
    });
    const open = partButtons.some(b => b.classList.contains('on'));
    document.querySelectorAll('.region').forEach(r => r.classList.toggle('on', open && r.dataset.part === i));
    if (!open) return;
    if (panes.question.hidden) setTab('question');
    const first = document.querySelector(`.region[data-part="${i}"]`);
    if (first && getComputedStyle(view).display !== 'none') first.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  partButtons.forEach(b => b.addEventListener('click', () => showPart(b.dataset.part)));
  // Hovering (or tabbing to) a part marks it on the question for as long as the pointer is
  // there; pressing it keeps it marked.
  const hover = (i, on) => document.querySelectorAll(`.region[data-part="${i}"]`).forEach(r => r.classList.toggle('hover', on));
  partButtons.forEach(b => {
    b.addEventListener('mouseenter', () => hover(b.dataset.part, true));
    b.addEventListener('mouseleave', () => hover(b.dataset.part, false));
    b.addEventListener('focus', () => hover(b.dataset.part, true));
    b.addEventListener('blur', () => hover(b.dataset.part, false));
  });

  // ── copy link, similar ───────────────────────────────────────────────────
  $('q-copy').addEventListener('click', async e => {
    const url = location.origin + location.pathname;
    try { await navigator.clipboard.writeText(url); e.target.textContent = 'Copied'; }
    catch (_) { prompt('Copy this link', url); }
    setTimeout(() => { e.target.textContent = 'Copy link'; }, 1600);
  });
  const all = $('q-sim-all');
  if (all) all.addEventListener('click', () => {
    const on = $('q-similar').classList.toggle('show-all');
    all.textContent = on ? 'Show fewer' : `See all ${document.querySelectorAll('#q-similar .sm').length}`;
  });

  // ── where the reader came from ───────────────────────────────────────────
  let ctx = null;
  try { ctx = JSON.parse(sessionStorage.getItem('qb-list') || 'null'); } catch (_) {}
  const at = ctx && Array.isArray(ctx.ids) ? ctx.ids.indexOf(Q.id) : -1;
  document.body.classList.add('has-qbar');
  if (at >= 0) {
    const href = id => `${base}questions/${id}/`;
    const prev = at > 0 ? href(ctx.ids[at - 1]) : null;
    const next = at < ctx.ids.length - 1 ? href(ctx.ids[at + 1]) : null;
    const crumb = $('q-crumb');
    const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const n = ctx.ids.length;
    crumb.innerHTML = `<a href="${esc(ctx.url)}">← Back to ${n} result${n === 1 ? '' : 's'}</a>${ctx.label ? `<span>${esc(ctx.label)}</span>` : ''}
      <div class="pn">${prev ? `<a href="${prev}" rel="prev">← Prev</a>` : '<span class="off">← Prev</span>'}<em>${at + 1} of ${n}</em>${next ? `<a href="${next}" rel="next">Next →</a>` : '<span class="off">Next →</span>'}</div>`;
    for (const [id, url] of [['q-prev', prev], ['q-next', next]]) {
      if (url) { $(id).href = url; $(id).classList.remove('off'); }
    }
    document.addEventListener('keydown', e => {
      if (e.altKey || e.ctrlKey || e.metaKey || /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '') || document.querySelector('.scrim:not([hidden])')) return;
      if (e.key === 'ArrowLeft' && prev) location.href = prev;
      if (e.key === 'ArrowRight' && next) location.href = next;
    });
  }
})();
