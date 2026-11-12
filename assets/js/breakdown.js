/* breakdown.js — the per-part breakdown on question pages (#4).
   scripts/build.mjs writes the markup: a lettered marker at each part on the question image, a
   region per part, and a panel row per part. Hovering or focusing a marker or a row highlights
   that part's row, marker and region. "Hide breakdown" is remembered in localStorage.
*/
(function () {
  'use strict';

  const KEY = 'qb-breakdown';
  const root = document.querySelector('[data-breakdown]');
  const toggle = document.querySelector('[data-breakdown-toggle]');
  if (!root) return;

  function setHidden(off) {
    root.classList.toggle('bd-off', off);
    if (toggle) {
      toggle.textContent = off ? 'Show breakdown' : 'Hide breakdown';
      toggle.setAttribute('aria-pressed', String(!off));
    }
  }
  let off = false;
  try { off = localStorage.getItem(KEY) === 'off'; } catch (_) {}
  setHidden(off);
  if (toggle) {
    toggle.hidden = false;
    toggle.addEventListener('click', () => {
      off = !off;
      try { off ? localStorage.setItem(KEY, 'off') : localStorage.removeItem(KEY); } catch (_) {}
      setHidden(off);
      if (!off) spaceMarkers();
    });
  }

  // Markers sit at their parts' anchors; when parts are closer than a marker is tall, push the
  // lower marker down just enough to keep both readable.
  function spaceMarkers() {
    root.querySelectorAll('.bd-page').forEach((page) => {
      let bottom = -Infinity;
      page.querySelectorAll('.bd-marker').forEach((m) => {
        m.style.transform = '';
        const top = m.offsetTop;
        const shift = Math.max(0, bottom + 2 - top);
        if (shift) m.style.transform = `translateY(${shift}px)`;
        bottom = top + shift + m.offsetHeight;
      });
    });
  }
  root.querySelectorAll('.bd-page img').forEach((img) => { if (!img.complete) img.addEventListener('load', spaceMarkers); });
  addEventListener('resize', spaceMarkers);
  spaceMarkers();

  const each = (i, fn) => root.querySelectorAll(`[data-part="${i}"]`).forEach(fn);
  const highlight = (i, on) => each(i, (el) => el.classList.toggle('on', on));

  root.querySelectorAll('.bd-row, .bd-marker').forEach((el) => {
    const i = el.dataset.part;
    el.addEventListener('mouseenter', () => highlight(i, true));
    el.addEventListener('mouseleave', () => { if (document.activeElement !== el) highlight(i, false); });
    el.addEventListener('focus', () => highlight(i, true));
    el.addEventListener('blur', () => highlight(i, false));
  });
  // A click jumps to the other half of the pair when it is off screen (the panel stacks on narrow screens).
  const reveal = (el) => {
    const r = el.getBoundingClientRect();
    if (r.top < 0 || r.bottom > innerHeight) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  root.querySelectorAll('.bd-marker').forEach((m) => m.addEventListener('click', () => {
    const row = root.querySelector(`.bd-row[data-part="${m.dataset.part}"]`);
    if (row) reveal(row);
  }));
  root.querySelectorAll('.bd-row').forEach((row) => row.addEventListener('click', () => {
    const target = root.querySelector(`.bd-marker[data-part="${row.dataset.part}"], .bd-region[data-part="${row.dataset.part}"]`);
    if (target) reveal(target);
  }));
})();
