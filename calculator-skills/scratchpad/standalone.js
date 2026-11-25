(function () {
  'use strict';
  if (parent !== window) document.body.classList.add('neutral-embedded');
  window.NeutralCalculator.mount(document.getElementById('calculator-root'));
  if (parent === window) {
    document.body.classList.add('neutral-standalone');
    return;
  }
  addEventListener('message', e => {
    if (e.source !== parent || e.data?.type !== 'qb-scratchpad-theme') return;
    const value = e.data.theme;
    document.documentElement.dataset.theme = value === 'dark' || value === 'light' ? value : 'system';
  });
  parent.postMessage({ type: 'qb-scratchpad-ready' }, '*');
})();
