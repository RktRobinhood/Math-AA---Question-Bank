/* Only the standalone Calculator Skills entry gets the bank shell. The
 * question's sandboxed iframe must remain just a blank handheld. */
(function () {
  'use strict';
  if (window.parent !== window) return;
  const root = document.documentElement;
  const doc = document;
  const base = new URL('../../', window.location.href);
  try {
    root.dataset.theme = localStorage.getItem('qb-theme') ||
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  } catch (_) {
    root.dataset.theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  ['assets/css/styles.css?v=theme-3', 'assets/css/calculator-integration.css?v=beta-fit-2'].forEach(path => {
    const css = doc.createElement('link');
    css.rel = 'stylesheet';
    css.href = new URL(path, base);
    doc.head.append(css);
  });
  doc.addEventListener('DOMContentLoaded', () => {
    doc.body.dataset.base = '../../';
    doc.body.dataset.nav = 'calculator-skills';
    // Non-async dynamic scripts execute in insertion order, like the site's
    // static defer list; only these two entry modes differ.
    for (const path of ['courses.js', 'course.js', 'shell.js?v=theme-3',
      'calculator-nav.js?v=beta-1', 'basket.js', 'generate.js']) {
      const script = doc.createElement('script');
      script.async = false;
      script.src = new URL('assets/js/' + path, base);
      doc.body.append(script);
    }
  }, { once: true });
})();
