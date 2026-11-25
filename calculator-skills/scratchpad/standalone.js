(function () {
  'use strict';
  window.NeutralCalculator.mount(document.getElementById('calculator-root'));
  if (parent === window) {
    document.body.classList.add('neutral-standalone');
    const nav=document.createElement('nav'), back=document.createElement('a'), tip=document.createElement('p');
    nav.className='neutral-standalone-bar';
    nav.setAttribute('aria-label','Calculator navigation');
    back.href='../skills.html';back.textContent='← Calculator Skills';
    tip.textContent='Drag the graph to pan. Drag the touchpad to move the pointer.';
    nav.append(back,tip);document.body.prepend(nav);
    return;
  }
  addEventListener('message', e => {
    if (e.source !== parent || e.data?.type !== 'qb-scratchpad-theme') return;
    const value = e.data.theme;
    document.documentElement.dataset.theme = value === 'dark' || value === 'light' ? value : 'system';
  });
  parent.postMessage({ type: 'qb-scratchpad-ready' }, '*');
})();
