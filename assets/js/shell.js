/* shell.js — the top bar every page shares, the phone tab bar and the site appearance menu.
   Loaded on every page after courses.js and course.js. The page says which section it is with
   <body data-nav="questions|statistics|syllabus|practice|calculator-skills"> and where the site root is with
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
  const media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  const themeOptions = [
    ['system', 'System', 'M3 4h18v13H3zM12 17v3M8 20h8'],
    ['light', 'Light', 'M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4m0-14.2-1.4 1.4M6.3 17.7l-1.4 1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z'],
    ['dark', 'Dark', 'M20.9 14.3A9 9 0 0 1 9.7 3.1 9 9 0 1 0 20.9 14.3Z'],
  ];
  const themeIndex = new Map(themeOptions.map((option, index) => [option[0], index]));
  function readTheme() {
    try {
      const choice = localStorage.getItem(THEME_KEY);
      if (choice === 'light' || choice === 'dark') return choice;
    } catch (_) {}
    return 'system';
  }
  let themeMode = readTheme();
  let themeControl;
  function applyTheme() {
    root.dataset.theme = themeMode === 'system' ? (media?.matches ? 'dark' : 'light') : themeMode;
    root.dataset.themeMode = themeMode;
    if (!themeControl) return;
    const { button, items } = themeControl;
    const [, label, icon] = themeOptions[themeIndex.get(themeMode)];
    button.replaceChildren(svgIcon(icon));
    button.setAttribute('aria-label', `Theme: ${label}`);
    button.title = `Theme: ${label}`;
    items.forEach(item => item.setAttribute('aria-checked', String(item.dataset.themeValue === themeMode)));
  }

  function pickTheme(mode) {
    themeMode = mode;
    try {
      // The existing first-paint script on every page already follows System
      // when the key is absent, and understands the same saved light/dark values.
      if (mode === 'system') localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, mode);
    } catch (_) {} // The current page still responds if storage is blocked.
    applyTheme();
  }
  function systemChanged() { if (themeMode === 'system') applyTheme(); }
  if (media?.addEventListener) media.addEventListener('change', systemChanged);
  else if (media?.addListener) media.addListener(systemChanged);
  window.addEventListener('storage', event => {
    if (event.key !== THEME_KEY && event.key !== null) return;
    themeMode = readTheme();
    applyTheme();
  });

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
  // One section table for the desktop header and the phone tab bar. Archived
  // question and exam-year views retain the original four-link profile: these
  // routes are already identified by their Questions nav without an app tab.
  const fullNavigation = Boolean(document.body.dataset.initialTab) ||
    nav === 'practice' || nav === 'calculator-skills';
  const LINKS = [
    { id: 'questions', href: '', label: 'Questions', icon: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z' },
    { id: 'statistics', href: 'statistics/', label: 'Statistics', icon: 'M5 20V11M12 20V4M19 20v-6' },
    { id: 'syllabus', href: 'syllabus/', label: 'Syllabus', icon: 'M5 6h14M5 12h14M5 18h9' },
    { id: 'practice', href: 'practice.html', label: 'Practice', beta: true, icon: 'M4 20l4-1L19 8l-3-3L5 16zM14 7l3 3' },
    { id: 'calculator-skills', href: 'calculator-skills/skills.html', label: 'Calculator Skills',
      short: 'Calc skills', beta: true, appOnly: true,
      icon: 'M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM9 7h6M9 11h1m4 0h1m-6 4h1m4 0h1m-6 3h1m4 0h1' },
  ];
  const sections = LINKS.filter(link => fullNavigation || !link.appOnly);
  const barClass = name => name + (fullNavigation ? ' with-calc-skills' : '');

  function svgIcon(d) {
    const i = h('i', { 'aria-hidden': 'true' });
    i.innerHTML = `<svg viewBox="0 0 24 24"><path d="${d}"/></svg>`;
    return i;
  }

  function sectionLink(section, compact = false) {
    const { id, href, label, icon, short } = section;
    const beta = fullNavigation && section.beta;
    const classes = [id === nav && 'on', id === 'calculator-skills' && 'calc-skills-nav', beta && 'nav-preview'];
    return h('a', { href: base + href, class: classes.filter(Boolean).join(' '),
      'aria-current': id === nav ? 'page' : null,
      'aria-label': compact && short ? label : null,
      'aria-description': beta ? 'Beta' : null,
      title: beta ? label + ' (beta)' : null,
    }, compact && svgIcon(icon), compact && short ? short : label,
    beta && h('span', { class: 'nav-beta', 'aria-hidden': 'true', text: 'Beta' }));
  }

  function buildThemeControl() {
    const button = h('button', {
      class: 'icon-btn theme-control__button', id: 'theme-toggle', type: 'button',
      'aria-haspopup': 'menu', 'aria-expanded': 'false', 'aria-controls': 'theme-menu',
    });
    const items = themeOptions.map(([id, label, icon]) => h('button', {
      class: 'theme-control__option', type: 'button', tabindex: '-1', role: 'menuitemradio',
      'aria-checked': String(themeMode === id), 'data-theme-value': id,
      onclick: () => { pickTheme(id); close(true); },
    }, svgIcon(icon), h('span', { text: label }), h('span', { class: 'theme-control__check', 'aria-hidden': 'true', text: '✓' })));
    const menu = h('div', { class: 'theme-control__menu', id: 'theme-menu', role: 'menu', 'aria-label': 'Theme', hidden: true }, ...items);
    const control = h('div', { class: 'theme-control' }, button, menu);
    function close(restoreFocus = false) {
      if (menu.hidden) return;
      menu.hidden = true;
      button.setAttribute('aria-expanded', 'false');
      if (restoreFocus) button.focus();
    }
    function open(index = themeIndex.get(themeMode)) {
      menu.hidden = false;
      button.setAttribute('aria-expanded', 'true');
      items[index].focus();
    }
    button.addEventListener('click', () => { if (menu.hidden) open(); else close(); });
    control.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !menu.hidden) {
        event.preventDefault();
        event.stopPropagation();
        close(true);
        return;
      }
      const index = items.indexOf(event.target);
      if (event.target === button && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
        event.preventDefault();
        open(event.key === 'ArrowDown' ? 0 : items.length - 1);
        return;
      }
      if (index < 0) return; // Tab keeps its native order; focusout closes the menu.
      const next = { ArrowDown: (index + 1) % items.length, ArrowUp: (index + items.length - 1) % items.length,
        Home: 0, End: items.length - 1 }[event.key];
      if (next !== undefined) {
        event.preventDefault();
        items[next].focus();
      }
    });
    control.addEventListener('focusout', event => {
      if (!menu.hidden && !menu.contains(event.relatedTarget)) close();
    });
    document.addEventListener('pointerdown', event => { if (!control.contains(event.target)) close(); });
    themeControl = { button, items };
    return control;
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
      h('nav', { class: barClass('nav'), 'aria-label': 'Main' },
        ...sections.map(link => sectionLink(link)),
        h('a', { href: '#', target: '_blank', rel: 'noopener', 'data-formula-booklet': true, text: 'Formula booklet ↗' })),
      h('span', { class: 'sp' }),
      buildThemeControl(),
      h('button', { class: 'paperbtn', type: 'button', 'data-paper-toggle': true, 'aria-label': 'Your paper' }, 'Your paper ', h('b', { 'data-paper-count': true, text: '0' })));
    const tabs = h('nav', { class: barClass('tabbar'), 'aria-label': 'Sections' },
      ...sections.map(link => sectionLink(link, true)),
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
    lockCourse();
    const booklet = document.querySelector('.top [data-formula-booklet]');
    const href = COURSE.info() && COURSE.info().formulaBooklet;
    if (booklet) { booklet.hidden = !href; if (href) booklet.href = base + href; }
  }

  // On a question page the switch only offers the courses that question is in; with one course
  // there is nothing to switch, so the whole control is locked and says why.
  function lockCourse() {
    if (!COURSE.locked || !COURSE.locked()) return;
    const open = COURSE.list.filter(c => COURSE.allows(c.id));
    const why = `This question is from the ${open.map(c => c.short).join(' and ')} paper${open.length > 1 ? 's' : ''}. Choose a course on the Questions page.`;
    const fixed = open.length < 2;
    document.querySelectorAll('.course-seg [data-course-id]').forEach(b => {
      const off = !COURSE.allows(b.dataset.courseId);
      b.disabled = off || fixed;
      b.title = off || fixed ? why : b.title;
    });
    const seg = document.querySelector('.course-seg');
    if (seg) { seg.classList.add('locked'); seg.title = why; }
    const pick = document.querySelector('.course-pick');
    if (pick) {
      [...pick.options].forEach(o => { o.disabled = !COURSE.allows(o.value); });
      pick.disabled = fixed;
      pick.title = why;
    }
  }

  build();
  if (COURSE) COURSE.onChange(syncCourse);
})();
