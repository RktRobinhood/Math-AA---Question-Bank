(function () {
  'use strict';
  window.NeutralCalculator.mount(document.getElementById('calculator-root'));
  if (parent === window) return;
  addEventListener('message', e => {
    if (e.source !== parent || e.data?.type !== 'qb-scratchpad-theme') return;
    const value = e.data.theme;
    document.documentElement.dataset.theme = value === 'dark' || value === 'light' ? value : 'system';
  });
  parent.postMessage({ type: 'qb-scratchpad-ready' }, '*');
})();
