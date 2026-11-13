/* shell.js — the top bar every page shares, the phone tab bar and the light/dark theme.
   Loaded on every page after courses.js and course.js. The page says which section it is with
   <body data-nav="questions|statistics|syllabus|practice"> and where the site root is with
   data-base. The theme is set before first paint by a one-line script in each page's <head>;
   this file owns the toggle and remembers the choice.
*/
(function () {
  'use strict';

  const THEME_KEY = 'qb-theme';
  const base = document.body.dataset.base || './';
  const nav = document.body.dataset.nav || '';
  const COURSE = window.QB_COURSE;
  const root = document.documentElement;

  // ── theme ────────────────────────────────────────────────────────────────
  const media = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
  function saved() { try { return localStorage.getItem(THEME_KEY); } catch (_) { return null; } }
  function applyTheme() {
    const t = saved() || (media && media.matches ? 'dark' : 'light');
    root.dataset.theme = t;
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.textContent = t === 'dark' ? '☀' : '☾';
      btn.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      btn.title = btn.getAttribute('aria-label');
    }
  }
  if (media) media.addEventListener('change', applyTheme);

  // ── markup ───────────────────────────────────────────────────────────────
  function h(tag, attrs, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    }
    n.append(...kids.filter(Boolean));
    return n;
  }
  const LINKS = [
    ['questions', '', 'Questions', 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z'],
    ['statistics', 'statistics/', 'Statistics', 'M5 20V11M12 20V4M19 20v-6'],
    ['syllabus', 'syllabus/', 'Syllabus', 'M5 6h14M5 12h14M5 18h9'],
    ['practice', 'practice.html', 'Practice', 'M4 20l4-1L19 8l-3-3L5 16zM14 7l3 3'],
  ];

  function svgIcon(d) {
    const i = h('i', { 'aria-hidden': 'true' });
    i.innerHTML = `<svg viewBox="0 0 24 24"><path d="${d}"/></svg>`;
    return i;
  }

  function build() {
    const courses = COURSE ? COURSE.list : [];
    const seg = h('div', { class: 'seg course-seg', role: 'group', 'aria-label': 'Course' },
      ...courses.map(c => h('button', { type: 'button', 'data-course-id': c.id, text: c.short, title: c.name, onclick: () => COURSE.set(c.id) })));
    const pick = h('select', { class: 'select course-pick', 'aria-label': 'Course', onchange: e => COURSE.set(e.target.value) },
      ...courses.map(c => h('option', { value: c.id, text: c.short })));
    const top = h('header', { class: 'top' },
      h('a', { class: 'brand', href: base }, h('i', { text: '∑', 'aria-hidden': 'true' }), h('span', { text: 'IB Math Question Bank' })),
      seg, pick,
      h('nav', { class: 'nav', 'aria-label': 'Main' },
        ...LINKS.map(([id, href, text]) => h('a', { href: base + href, class: id === nav ? 'on' : '', 'aria-current': id === nav ? 'page' : null, text })),
        h('a', { href: '#', target: '_blank', rel: 'noopener', 'data-formula-booklet': true, text: 'Formula booklet ↗' })),
      h('span', { class: 'sp' }),
      h('button', { class: 'icon-btn', id: 'theme-toggle', type: 'button', onclick: () => {
        const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
        try { localStorage.setItem(THEME_KEY, next); } catch (_) {}
        applyTheme();
      } }),
      h('button', { class: 'paperbtn', type: 'button', 'data-paper-toggle': true, 'aria-label': 'Your paper' }, 'Your paper ', h('b', { 'data-paper-count': true, text: '0' })));
    const tabs = h('nav', { class: 'tabbar', 'aria-label': 'Sections' },
      ...LINKS.map(([id, href, text, icon]) => h('a', { href: base + href, class: id === nav ? 'on' : '', 'aria-current': id === nav ? 'page' : null },
        svgIcon(icon), text)),
      h('button', { type: 'button', 'data-paper-toggle': true }, h('i', {}, h('b', { 'data-paper-count': true, text: '0' })), 'Paper'));
    document.body.prepend(top);
    document.body.append(tabs);
    document.addEventListener('click', e => {
      if (e.target.closest('[data-paper-toggle]') && window.QB_PAPER) window.QB_PAPER.toggle();
    });
    syncCourse();
    applyTheme();
  }

  function syncCourse() {
    if (!COURSE) return;
    const id = COURSE.get();
    document.querySelectorAll('[data-course-id]').forEach(b => {
      b.classList.toggle('on', b.dataset.courseId === id);
      b.setAttribute('aria-pressed', String(b.dataset.courseId === id));
    });
    const pick = document.querySelector('.course-pick');
    if (pick) pick.value = id;
    const booklet = document.querySelector('.top [data-formula-booklet]');
    const href = COURSE.info() && COURSE.info().formulaBooklet;
    if (booklet) { booklet.hidden = !href; if (href) booklet.href = base + href; }
  }

  build();
  if (COURSE) COURSE.onChange(syncCourse);
})();
