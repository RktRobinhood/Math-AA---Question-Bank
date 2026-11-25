/* Optional Calculator Skills navigation. Included in Home, Practice, and the Calculator Skills catalogue. */
(function () {
  'use strict';
  const icon = '<svg viewBox="0 0 24 24"><rect x="6" y="3" width="12" height="18" rx="2"/><path d="M9 7h6M9 11h1m4 0h1m-6 4h1m4 0h1m-6 3h1m4 0h1"/></svg>';
  for (const bar of [document.querySelector('.top .nav'), document.querySelector('.tabbar')]) {
    if (!bar || bar.querySelector('.calc-skills-nav')) continue;
    const practice = Array.from(bar.querySelectorAll('a')).find(a => a.getAttribute('href')?.endsWith('/practice.html'));
    if (!practice) continue;
    const link = document.createElement('a');
    link.href = (document.body.dataset.base || './') + 'calculator-skills/skills.html';
    link.className = 'calc-skills-nav';
    if (document.body.dataset.nav === 'calculator-skills') {
      link.classList.add('on');
      link.setAttribute('aria-current', 'page');
    }
    if (bar.classList.contains('tabbar')) {
      const mark = document.createElement('i');
      mark.setAttribute('aria-hidden', 'true');
      mark.innerHTML = icon;
      // Keep the long name as the accessible label; fit the existing bottom tabs on a phone.
      link.setAttribute('aria-label', 'Calculator Skills');
      link.append(mark, 'Calc skills');
    } else link.textContent = 'Calculator Skills';
    practice.after(link);
    bar.classList.add('with-calc-skills');
  }
})();
