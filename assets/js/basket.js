/* basket.js — AASL Output Basket
   Manages question selection, bottom tray, and drag-to-reorder.
   Loaded on every page. Works alongside generate.js.
*/
(function () {
  'use strict';

  const STORAGE_KEY = 'aasl-basket-v1';
  const MAX_TRAY_H = 'min(68vh, 520px)';

  // ─── Storage ──────────────────────────────────────────────────────────────
  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch (_) { return []; }
  }
  function save(items) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }
    catch (_) {}
  }

  // ─── Public API ───────────────────────────────────────────────────────────
  const api = {
    getAll:     () => load(),
    has:        (id) => load().some(q => q.id === id),
    count:      () => load().length,
    totalMarks: () => load().reduce((s, q) => s + (q.marks || 0), 0),

    add(question) {
      const items = load();
      if (items.some(q => q.id === question.id)) return false;
      items.push(question);
      save(items);
      _sync();
      return true;
    },

    remove(id) {
      save(load().filter(q => q.id !== id));
      _sync();
    },

    reorder(newItems) {
      save(newItems);
      renderTray(true); // re-render list only, keep tray open
    },

    clear() {
      localStorage.removeItem(STORAGE_KEY);
      _sync();
    }
  };

  window.AASL_BASKET = api;

  // ─── Sync all page affordances ────────────────────────────────────────────
  function _sync() {
    renderTray();
    updatePageButton();
    if (typeof window._AASL_APP_SYNC === 'function') window._AASL_APP_SYNC();
  }

  // ─── "Add to output" button on question detail pages ─────────────────────
  function updatePageButton() {
    const btn = document.getElementById('aasl-add-btn');
    if (!btn || !window.AASL_Q) return;
    const inBasket = api.has(window.AASL_Q.id);
    btn.textContent = inBasket ? '✓ Added to output' : 'Add to output';
    btn.classList.toggle('aasl-add-btn--added', inBasket);
  }

  function wirePageButton() {
    const btn = document.getElementById('aasl-add-btn');
    if (!btn || !window.AASL_Q) return;
    updatePageButton();
    btn.addEventListener('click', () => {
      if (api.has(window.AASL_Q.id)) {
        api.remove(window.AASL_Q.id);
      } else {
        api.add(window.AASL_Q);
        showTrayBriefly();
      }
    });
  }

  // ─── Tray ─────────────────────────────────────────────────────────────────
  let trayEl = null;
  let trayOpen = false;
  let dragSrc = null;

  function ensureTray() {
    if (trayEl) return;
    trayEl = document.createElement('div');
    trayEl.id = 'aasl-tray';
    trayEl.setAttribute('aria-label', 'Output basket');
    document.body.appendChild(trayEl);
    trayEl.addEventListener('click', onTrayClick);
  }

  function renderTray(keepOpen) {
    ensureTray();
    const items = load();
    const count = items.length;
    const marks = items.reduce((s, q) => s + (q.marks || 0), 0);

    if (count === 0) {
      trayEl.classList.remove('aasl-tray--visible', 'aasl-tray--open');
      trayOpen = false;
      return;
    }

    trayEl.classList.add('aasl-tray--visible');
    if (keepOpen) trayEl.classList.add('aasl-tray--open');

    trayEl.innerHTML = `
      <div class="aasl-tray-bar" id="aasl-tray-bar">
        <div class="aasl-tray-bar-left">
          <span class="aasl-tray-chevron" id="aasl-tray-chevron">${trayOpen ? '▾' : '▴'}</span>
          <span class="aasl-tray-count"><strong>${count}</strong> question${count === 1 ? '' : 's'}</span>
          <span class="aasl-tray-sep">·</span>
          <span class="aasl-tray-marks"><strong>${marks}</strong> marks</span>
        </div>
        <div class="aasl-tray-bar-right">
          <button class="aasl-tray-clear" id="aasl-tray-clear" title="Clear all">Clear all</button>
          <button class="aasl-tray-generate" id="aasl-tray-generate">Generate →</button>
        </div>
      </div>
      <div class="aasl-tray-body" id="aasl-tray-body" style="display:${trayOpen ? 'block' : 'none'}">
        <ul class="aasl-tray-list" id="aasl-tray-list">
          ${items.map((q, i) => trayItemHtml(q, i)).join('')}
        </ul>
      </div>
    `;

    // Re-apply open state
    if (trayOpen) trayEl.classList.add('aasl-tray--open');
    else trayEl.classList.remove('aasl-tray--open');

    wireListDrag();
  }

  function trayItemHtml(q, i) {
    const base = document.body.dataset.base || '';
    const topicLabel = (q.topicNumbers || []).map(t => 'T' + t).join(' ');
    return `
      <li class="aasl-tray-item" data-id="${q.id}" data-index="${i}" draggable="true">
        <span class="aasl-drag-handle" title="Drag to reorder">⠿</span>
        <span class="aasl-item-title">${escHtml(q.title)}</span>
        ${topicLabel ? `<span class="aasl-item-badge">${escHtml(topicLabel)}</span>` : ''}
        <span class="aasl-item-badge">${q.marks || 0} marks</span>
        ${q.section ? `<span class="aasl-item-badge aasl-item-badge--section">§${escHtml(q.section)}</span>` : ''}
        <a class="aasl-item-view" href="${base}questions/${q.id}/" title="View question">View →</a>
        <span class="aasl-item-gap"></span>
        <button class="aasl-item-remove" data-remove="${q.id}" title="Remove from output">×</button>
      </li>
    `;
  }

  function onTrayClick(e) {
    // Toggle open/closed via bar click
    if (e.target.closest('#aasl-tray-bar') &&
        !e.target.closest('#aasl-tray-clear') &&
        !e.target.closest('#aasl-tray-generate')) {
      trayOpen = !trayOpen;
      renderTray();
      return;
    }

    // Remove item
    const removeBtn = e.target.closest('[data-remove]');
    if (removeBtn) {
      api.remove(removeBtn.dataset.remove);
      return;
    }

    // Clear all
    if (e.target.closest('#aasl-tray-clear')) {
      if (confirm('Remove all questions from the output basket?')) api.clear();
      return;
    }

    // Generate
    if (e.target.closest('#aasl-tray-generate')) {
      if (typeof window.AASL_GENERATE === 'function') window.AASL_GENERATE();
      return;
    }
  }

  // ─── Drag-to-reorder ──────────────────────────────────────────────────────
  function wireListDrag() {
    const list = document.getElementById('aasl-tray-list');
    if (!list) return;

    list.querySelectorAll('.aasl-tray-item').forEach(item => {
      item.addEventListener('dragstart', onDragStart);
      item.addEventListener('dragover',  onDragOver);
      item.addEventListener('drop',      onDrop);
      item.addEventListener('dragend',   onDragEnd);
      item.addEventListener('dragleave', onDragLeave);
    });
  }

  function onDragStart(e) {
    dragSrc = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.id);
    this.classList.add('aasl-dragging');
  }

  function onDragOver(e) {
    if (dragSrc === this) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    this.classList.add('aasl-drag-over');
  }

  function onDragLeave() {
    this.classList.remove('aasl-drag-over');
  }

  function onDrop(e) {
    e.preventDefault();
    if (!dragSrc || dragSrc === this) return;
    this.classList.remove('aasl-drag-over');

    const items = load();
    const srcId  = dragSrc.dataset.id;
    const dstId  = this.dataset.id;
    const srcIdx = items.findIndex(q => q.id === srcId);
    const dstIdx = items.findIndex(q => q.id === dstId);
    if (srcIdx < 0 || dstIdx < 0) return;

    const [moved] = items.splice(srcIdx, 1);
    items.splice(dstIdx, 0, moved);
    api.reorder(items);
  }

  function onDragEnd() {
    document.querySelectorAll('.aasl-tray-item').forEach(el => {
      el.classList.remove('aasl-dragging', 'aasl-drag-over');
    });
    dragSrc = null;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function showTrayBriefly() {
    trayOpen = true;
    renderTray();
    setTimeout(() => {
      trayOpen = false;
      renderTray();
    }, 2000);
  }

  function escHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ─── Init ─────────────────────────────────────────────────────────────────
  function init() {
    renderTray();
    wirePageButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
