(function () {
  'use strict';
  if (parent !== window) document.body.classList.add('neutral-embedded');
  window.NeutralCalculator.mount(document.getElementById('calculator-root'));
  if (parent === window) {
    document.body.classList.add('neutral-standalone');
    return;
  }
  addEventListener('message', e => {
    if (e.source !== parent) return;
    if (e.data?.type === 'qb-scratchpad-theme') {
      const value = e.data.theme;
      document.documentElement.dataset.theme = value === 'dark' || value === 'light' ? value : 'system';
    } else if (e.data?.type === 'qb-scratchpad-presentation') {
      const factor = e.data.factor;
      if (factor !== null && !(Number.isFinite(factor) && factor >= 1 && factor <= 3)) return;
      document.body.classList.toggle('neutral-applet', factor !== null);
      if (factor === null) document.body.style.removeProperty('--applet-scale');
      else document.body.style.setProperty('--applet-scale', String(factor));
    }
  });
  addEventListener('keydown', e => {
    if (e.key !== 'Escape' || !e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return;
    e.preventDefault(); e.stopPropagation();
    parent.postMessage({ type: 'qb-scratchpad-return' }, '*');
  }, true);
  parent.postMessage({ type: 'qb-scratchpad-ready' }, '*');
})();
