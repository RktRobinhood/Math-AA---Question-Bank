/* generate.js — Set up and export
   The export screen (settings with a live preview), the cover sheet, and PDF/DOCX export.
   Requires basket.js and masks.json (window.AASL_MASKS).
*/
(function () {
  'use strict';

  const SETTINGS_KEY  = 'aasl-generate-settings-v1';
  const PDF_LIB_CDN   = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
  const DOCX_CDN      = 'https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js';

  // A4 in pdf-lib points
  const A4_W = 595.28, A4_H = 841.89;
  const MARGIN = 45;
  const CONTENT_W = A4_W - MARGIN * 2;
  // Image source dimensions (pixels)
  const IMG_PX_W = 993;

  // ─── Settings ─────────────────────────────────────────────────────────────
  const DEFAULT_SETTINGS = {
    includeQuestions:  true,
    includeMarkscheme: false,
    format:            'pdf',
    coverSheet:        true,
    // Cover fields
    schoolName:        '',        showSchoolName:    false,
    logoDataUrl:       '',        showLogo:          false,
    logoW:             0,         logoH:             0,
    teacherName:       '',        showTeacherName:   false,
    classCode:         '',        showClassCode:     false,
    showNameLine:      true,
    showDateLine:      true,
    title:             'Mathematics: Analysis and Approaches SL',
    testDate:          '',        // filled at modal open
    showTimeAllowed:   true,
    showTotalMarks:    true,
    showMarksGrid:     true,
    // Instructions
    instrCalculator:   true,  instrCalculatorText: '',  // auto-set at open
    instrAnswerSpace:  true,  instrAnswerSpaceText: 'Please write all your answers in the space provided. Answers and/or work on scrap paper will not be marked.',
    instrShowWork:     true,  instrShowWorkText:    'Show all appropriate work/steps taken.',
    instrSigFig:       true,  instrSigFigText:      'Unless stated otherwise give all answers as an exact value or rounded to 3 significant figures.',
    instrFormula:      true,  instrFormulaText:     'A clean copy of the mathematics: analysis and approaches formula booklet is required.',
    // Work space
    workSpace:         false,
    workSpacePages:    1,
    // Pagination
    showPageNumbers:   true,
    // Versions of the same paper with the questions in a different order (1 = just the paper)
    versions:          1,
  };

  // The title and formula-booklet line follow the course chosen in the course bar, unless the
  // teacher has typed their own.
  const COURSE_TITLES = ['Analysis and Approaches SL', 'Analysis and Approaches HL', 'Applications and Interpretation SL', 'Applications and Interpretation HL']
    .map(n => `Mathematics: ${n}`);
  const BOOKLET_TEXT = sub => `A clean copy of the mathematics: ${sub} formula booklet is required.`;
  const BOOKLET_TEXTS = [BOOKLET_TEXT('analysis and approaches'), BOOKLET_TEXT('applications and interpretation')];

  function applyCourseDefaults(s, stored) {
    const c = window.QB_COURSE?.info();
    if (!c) return s;
    if (!stored.title || COURSE_TITLES.includes(stored.title)) s.title = c.fullName;
    if (!stored.instrFormulaText || BOOKLET_TEXTS.includes(stored.instrFormulaText)) {
      s.instrFormulaText = BOOKLET_TEXT(c.subject === 'ai' ? 'applications and interpretation' : 'analysis and approaches');
    }
    return s;
  }

  function loadSettings() {
    let stored = {};
    try { stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); } catch (_) {}
    return applyCourseDefaults(Object.assign({}, DEFAULT_SETTINGS, stored), stored);
  }

  function saveSettings(s) {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch (_) {}
  }

  // ─── CDN Loader ───────────────────────────────────────────────────────────
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
      const s = document.createElement('script');
      s.src = src; s.onload = resolve; s.onerror = () => reject(new Error('Failed to load: ' + src));
      document.head.appendChild(s);
    });
  }

  // ─── Set up and export ────────────────────────────────────────────────────
  // A large dialog: settings on the left, a live preview of the paper on the right. Every setting
  // is saved as it changes, so the school details and choices are there next time.
  let modalEl = null;
  let _logoDataUrl = null; // base64 PNG data URL of uploaded logo (set at modal open)
  let _logoW = 0, _logoH = 0; // natural pixel dims of loaded logo
  let _page = 0;           // preview page index
  let _fit = null;         // ResizeObserver for the preview

  const basketItems = () => window.AASL_BASKET.getAll();
  const totalMarksOf = items => items.reduce((t, q) => t + (q.marks || 0), 0);
  const suggestedTime = marks => Math.ceil(marks / 80 * 90 / 5) * 5;

  function openModal() {
    if (!window.AASL_BASKET || window.AASL_BASKET.count() === 0) return;
    const s = loadSettings();
    if (!s.testDate) s.testDate = new Date().toISOString().slice(0, 10);
    s.instrCalculatorText = calcNote();   // follows the papers the questions come from

    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.id = 'aasl-modal';
      modalEl.className = 'scrim';
      document.body.appendChild(modalEl);
      modalEl.addEventListener('mousedown', e => { if (e.target === modalEl) closeModal(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && modalEl && !modalEl.hidden) closeModal(); });
    }
    _logoDataUrl = s.logoDataUrl || null;
    _logoW = s.logoW || 0;
    _logoH = s.logoH || 0;
    _page = 0;

    modalEl.innerHTML = buildModalHtml(s);
    modalEl.hidden = false;
    document.body.style.overflow = 'hidden';
    wireModal();
    updatePreview();
    modalEl.querySelector('.dt .x').focus();
  }

  function closeModal() {
    if (!modalEl) return;
    modalEl.hidden = true;
    document.body.style.overflow = '';
    if (_fit) { _fit.disconnect(); _fit = null; }
  }

  window.AASL_GENERATE = openModal;

  // ─── Calculator auto-detect ───────────────────────────────────────────────
  function calcNote() {
    const items = basketItems();
    const papers = new Set(items.map(q => q.paper));
    if (papers.size === 1) {
      if (papers.has('P1')) return 'You are not permitted access to any calculator for this paper.';
      if (papers.has('P2')) return 'A graphic display calculator is required for this paper.';
    }
    return 'Check individual questions for calculator guidance (mixed P1/P2 paper).';
  }

  // ─── Dialog HTML ──────────────────────────────────────────────────────────
  function buildModalHtml(s) {
    const items = basketItems();
    const marks = totalMarksOf(items);
    const timeMin = suggestedTime(marks);
    const hasB = items.some(q => q.section === 'B');
    const ck = (id, on) => `<input type="checkbox" id="${id}" ${on ? 'checked' : ''}>`;
    const field = (showId, on, label, input) => `<div class="f"><label>${showId ? ck(showId, on) : ''}${label}</label>${input}</div>`;
    const text = (id, value, on, ph) => `<input class="input" type="text" id="${id}" value="${escHtml(value)}" placeholder="${ph || ''}" ${on ? '' : 'disabled'}>`;
    const wsN = s.workSpace ? (s.workSpacePages || 1) : 0;

    return `
    <div class="dlg" role="dialog" aria-modal="true" aria-labelledby="aasl-dlg-title">
      <div class="dt"><h2 id="aasl-dlg-title">Set up and export</h2><span>${items.length} question${items.length === 1 ? '' : 's'} · ${marks} marks</span><button type="button" class="x" id="aasl-modal-close" aria-label="Close">×</button></div>
      <div class="form">
        <div><h4 class="cap">Include</h4><div class="g2">
          <label class="ckl">${ck('gen-questions', s.includeQuestions)}Question paper</label>
          <label class="ckl">${ck('gen-markscheme', s.includeMarkscheme)}Markscheme <small>separate file</small></label>
          <label class="ckl">${ck('cs-show-grid', s.showMarksGrid)}Marks grid <small>on the cover</small></label>
          <label class="ckl">${ck('gen-pagenums', s.showPageNumbers)}Page X of Y footer</label>
          <label class="ckl wide">Versions
            <select class="select" id="gen-versions">${[1, 2, 3, 4].map(n => `<option value="${n}" ${n === (s.versions || 1) ? 'selected' : ''}>${n === 1 ? '1 (just this paper)' : `${n}: ${'ABCD'.slice(0, n).split('').join(', ')}`}</option>`).join('')}</select>
            <small>same questions, different order</small></label>
          ${hasB ? `<label class="ckl wide">Blank working pages after each Section B question
            <select class="select" id="gen-workspace-n">${[0, 1, 2, 3, 4].map(n => `<option value="${n}" ${n === wsN ? 'selected' : ''}>${n}</option>`).join('')}</select></label>` : ''}
        </div></div>

        <div><h4 class="cap"><label class="switch"><input type="checkbox" id="gen-cover" ${s.coverSheet ? 'checked' : ''}><i></i>Cover sheet</label></h4>
          <div id="gen-cover-editor" ${s.coverSheet ? '' : 'hidden'}>
            <div class="g2">
              ${field('cs-show-school', s.showSchoolName, 'School name', text('cs-school', s.schoolName, s.showSchoolName, 'e.g. Westgate Academy'))}
              <div class="f"><label>${ck('cs-show-logo', s.showLogo)}Logo</label><div id="cs-logo-wrap" class="logo-box${s.showLogo ? '' : ' off'}"></div></div>
              ${field('cs-show-teacher', s.showTeacherName, 'Teacher name', text('cs-teacher', s.teacherName, s.showTeacherName, 'e.g. Mr Smith'))}
              ${field('cs-show-class', s.showClassCode, 'Class / code', text('cs-class', s.classCode, s.showClassCode, 'e.g. 12A Math AA SL'))}
              <div class="f wide"><label for="cs-title">Title</label>${text('cs-title', s.title, true)}</div>
            </div>
            <div class="g3" style="margin-top:9px">
              <div class="f"><label for="cs-date">Test date</label><input class="input" type="date" id="cs-date" value="${escHtml(s.testDate)}"></div>
              <div class="f"><label>${ck('cs-show-time', s.showTimeAllowed)}Time allowed (min)</label><input class="input" type="number" id="cs-time" value="${timeMin}" min="1" ${s.showTimeAllowed ? '' : 'disabled'}><small>suggested ${timeMin}</small></div>
              <div class="f"><label>${ck('cs-show-marks', s.showTotalMarks)}Total marks</label><input class="input" type="number" id="cs-total-marks" value="${marks}" readonly ${s.showTotalMarks ? '' : 'disabled'}><small>from the questions</small></div>
            </div>
            <div class="g2" style="margin-top:6px">
              <label class="ckl">${ck('cs-show-nameline', s.showNameLine)}Student name line</label>
              <label class="ckl">${ck('cs-show-dateline', s.showDateLine)}Date line</label>
            </div>
            <h4 class="cap" style="margin-top:14px">Instructions to candidates <small>tick to include, type to edit</small></h4>
            ${instrRow('cs-instr-calc',   s.instrCalculator,  s.instrCalculatorText)}
            ${instrRow('cs-instr-ans',    s.instrAnswerSpace, s.instrAnswerSpaceText)}
            ${instrRow('cs-instr-work',   s.instrShowWork,    s.instrShowWorkText)}
            ${instrRow('cs-instr-sigfig', s.instrSigFig,      s.instrSigFigText)}
            ${instrRow('cs-instr-form',   s.instrFormula,     s.instrFormulaText)}
          </div>
        </div>
      </div>
      <div class="prev">
        <div class="ph"><span><b>Live preview</b> · <span id="aasl-pv-where"></span></span><span>updates as you type</span></div>
        <div class="strip" id="aasl-pv-strip"></div>
        <div class="pv-stage" id="aasl-pv-stage"><div class="pv-fit" id="aasl-pv-fit"></div></div>
      </div>
      <div class="ft">
        <span class="m" id="aasl-gen-status" role="status">Your school details and choices are remembered on this device for next time.</span>
        <button type="button" class="btn ghost" id="aasl-dl-docx">Download Word</button>
        <button type="button" class="btn" id="aasl-dl-pdf">Download PDF</button>
      </div>
    </div>`;
  }

  function instrRow(id, checked, text) {
    return `<div class="ins">
      <input type="checkbox" id="${id}-check" ${checked ? 'checked' : ''} aria-label="Include this instruction">
      <input class="input" type="text" id="${id}-text" value="${escHtml(text)}" ${checked ? '' : 'disabled'}>
    </div>`;
  }

  // ─── Wire dialog events ───────────────────────────────────────────────────
  function wireModal() {
    const $ = id => document.getElementById(id);
    $('aasl-modal-close').onclick = closeModal;

    // A tick next to a field switches the field on and off.
    const pairs = [
      ['cs-show-school', 'cs-school'], ['cs-show-teacher', 'cs-teacher'], ['cs-show-class', 'cs-class'],
      ['cs-show-time', 'cs-time'], ['cs-show-marks', 'cs-total-marks'],
      ['cs-instr-calc-check', 'cs-instr-calc-text'], ['cs-instr-ans-check', 'cs-instr-ans-text'],
      ['cs-instr-work-check', 'cs-instr-work-text'], ['cs-instr-sigfig-check', 'cs-instr-sigfig-text'],
      ['cs-instr-form-check', 'cs-instr-form-text'],
    ];
    function applyToggles() {
      pairs.forEach(([cbId, inputId]) => { const cb = $(cbId), inp = $(inputId); if (cb && inp) inp.disabled = !cb.checked; });
      $('gen-cover-editor').hidden = !$('gen-cover').checked;
      $('cs-logo-wrap').classList.toggle('off', !$('cs-show-logo').checked);
    }

    renderLogoBox();
    // Any change: save it and redraw the preview.
    const onChange = () => { applyToggles(); updatePreview(); };
    modalEl.querySelector('.form').addEventListener('input', onChange);
    modalEl.querySelector('.form').addEventListener('change', onChange);

    $('aasl-dl-pdf').onclick = () => doGenerate('pdf');
    $('aasl-dl-docx').onclick = () => doGenerate('docx');

    if (window.ResizeObserver) {
      _fit = new ResizeObserver(fitPreview);
      _fit.observe($('aasl-pv-stage'));
    }
  }

  function renderLogoBox() {
    const wrap = document.getElementById('cs-logo-wrap');
    if (!wrap) return;
    wrap.innerHTML = _logoDataUrl
      ? `<img src="${_logoDataUrl}" alt="Logo"><span class="sp"></span><label class="link" style="cursor:pointer">Replace<input type="file" id="cs-logo-file" accept="image/*" hidden></label><button type="button" class="link" id="cs-logo-clear">Remove</button>`
      : `<label class="link" style="cursor:pointer">Upload a logo…<input type="file" id="cs-logo-file" accept="image/*" hidden></label><span class="muted">PNG or JPG</span>`;
    const fileInput = document.getElementById('cs-logo-file');
    const clearBtn = document.getElementById('cs-logo-clear');
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 400;
          const scale  = Math.min(1, maxDim / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
          canvas.width  = Math.round((img.naturalWidth  || 200) * scale);
          canvas.height = Math.round((img.naturalHeight || 100) * scale);
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          _logoDataUrl = canvas.toDataURL('image/png');
          _logoW = canvas.width;
          _logoH = canvas.height;
          renderLogoBox();
          updatePreview();
        };
        img.onerror = () => alert('Could not load that image. Please try a different file.');
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    };
    if (clearBtn) clearBtn.onclick = () => { _logoDataUrl = null; _logoW = 0; _logoH = 0; renderLogoBox(); updatePreview(); };
  }

  // ─── Collect settings from the dialog (and remember them) ────────────────
  function collectSettings() {
    const $ = id => document.getElementById(id);
    const chk = id => { const el = $(id); return el ? el.checked : false; };
    const val = id => { const el = $(id); return el ? el.value : ''; };
    const num = id => { const el = $(id); return el ? parseInt(el.value, 10) : 1; };
    const prior = loadSettings();
    const wsEl = $('gen-workspace-n');
    const wsN = wsEl ? parseInt(wsEl.value, 10) || 0 : null;

    const s = {
      includeQuestions:  chk('gen-questions'),
      includeMarkscheme: chk('gen-markscheme'),
      format:            prior.format || 'pdf',
      coverSheet:        chk('gen-cover'),
      showSchoolName:    chk('cs-show-school'),   schoolName:   val('cs-school'),
      showLogo:          chk('cs-show-logo'),      logoDataUrl:  _logoDataUrl || '',
      logoW:             _logoW || 0,             logoH:        _logoH || 0,
      showTeacherName:   chk('cs-show-teacher'),  teacherName:  val('cs-teacher'),
      showClassCode:     chk('cs-show-class'),    classCode:    val('cs-class'),
      showNameLine:      chk('cs-show-nameline'),
      showDateLine:      chk('cs-show-dateline'),
      title:             val('cs-title'),
      testDate:          val('cs-date'),
      showTimeAllowed:   chk('cs-show-time'),     timeAllowed:  num('cs-time'),
      showTotalMarks:    chk('cs-show-marks'),
      showMarksGrid:     chk('cs-show-grid'),
      instrCalculator:   chk('cs-instr-calc-check'),   instrCalculatorText: val('cs-instr-calc-text'),
      instrAnswerSpace:  chk('cs-instr-ans-check'),    instrAnswerSpaceText: val('cs-instr-ans-text'),
      instrShowWork:     chk('cs-instr-work-check'),   instrShowWorkText:   val('cs-instr-work-text'),
      instrSigFig:       chk('cs-instr-sigfig-check'), instrSigFigText:     val('cs-instr-sigfig-text'),
      instrFormula:      chk('cs-instr-form-check'),   instrFormulaText:    val('cs-instr-form-text'),
      // With no Section B question in the paper the control is not shown; keep the saved choice.
      workSpace:         wsN === null ? prior.workSpace : wsN > 0,
      workSpacePages:    wsN === null ? prior.workSpacePages : (wsN || 1),
      showPageNumbers:   chk('gen-pagenums'),
      versions:          Math.max(1, parseInt(val('gen-versions'), 10) || 1),
    };
    saveSettings(s);
    return s;
  }

  // ─── Live preview ─────────────────────────────────────────────────────────
  // An HTML drawing of the pages the PDF will contain, laid out on the same A4 grid in points.
  function previewPages(s, items) {
    const type = s.includeQuestions || !s.includeMarkscheme ? 'questions' : 'markscheme';
    const pages = [];
    if (s.coverSheet && type === 'questions') pages.push({ kind: 'cover', label: 'Cover' });
    let n = 0;
    items.forEach((q, qi) => {
      const images = (type === 'questions' ? q.paperImages : q.markschemeImages) || [];
      images.forEach((src, ii) => pages.push({ kind: 'img', src, first: ii === 0, qi, label: `Q${qi + 1}`, n: ++n }));
      if (type === 'questions' && s.workSpace && q.section === 'B') {
        for (let w = 0; w < s.workSpacePages; w++) pages.push({ kind: 'ws', label: 'Work', n: ++n });
      }
    });
    pages.type = type;
    pages.numbered = n;
    return pages;
  }

  function coverHtml(s, items, marks) {
    const branding = [
      s.showSchoolName && s.schoolName, s.showTeacherName && s.teacherName, s.showClassCode && s.classCode,
    ].filter(Boolean);
    const date = s.testDate ? new Date(s.testDate + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';
    const instrs = [
      [s.instrCalculator, s.instrCalculatorText], [s.instrAnswerSpace, s.instrAnswerSpaceText], [s.instrShowWork, s.instrShowWorkText],
      [s.instrSigFig, s.instrSigFigText], [s.instrFormula, s.instrFormulaText],
    ].filter(([on, t]) => on && t).map(([, t]) => t);
    const time = s.timeAllowed || suggestedTime(marks);
    return `
      ${s.showLogo && s.logoDataUrl ? `<img class="logo" src="${s.logoDataUrl}" alt="">` : ''}
      ${branding.map(b => `<div class="brandline">${escHtml(b)}</div>`).join('')}
      <h3>${escHtml(s.title || 'Mathematics: Analysis and Approaches SL')}</h3>
      ${date ? `<div>${escHtml(date)}</div>` : ''}
      <hr>
      ${s.showNameLine ? '<div class="nl"><b>Name:</b><i></i></div>' : ''}
      <div class="kv"><span>${s.showTimeAllowed ? `<b>Time Allowed:</b> ${time} minutes` : ''}</span><span>${s.showTotalMarks ? `<b>Total Marks:</b> ${marks}` : ''}</span></div>
      <hr>
      ${instrs.length ? `<b>Instructions to candidates:</b><ul>${instrs.map(t => `<li>${escHtml(t)}</li>`).join('')}</ul>` : ''}
      ${s.showMarksGrid && items.length ? `<div class="gridcap">To be filled out by teacher</div>
        <table><tr>${items.map((q, i) => `<td><b>${i + 1}</b></td>`).join('')}<td><b>Sum</b></td></tr>
        <tr>${items.map(q => `<td>/${q.marks || 0}</td>`).join('')}<td><b>/${marks}</b></td></tr></table>` : ''}`;
  }

  function updatePreview() {
    if (!modalEl || modalEl.hidden) return;
    const s = collectSettings();
    const items = basketItems();
    const marks = totalMarksOf(items);
    const pages = previewPages(s, items);
    _page = Math.max(0, Math.min(_page, pages.length - 1));
    const p = pages[_page];
    const foot = p && p.n && s.showPageNumbers ? `<div class="foot">Page ${p.n} of ${pages.numbered}</div>` : '';
    let inner = '<div class="ws">Nothing to export: tick Question paper or Markscheme.</div>';
    if (p && p.kind === 'cover') inner = coverHtml(s, items, marks);
    else if (p && p.kind === 'img') inner = `${p.first ? `<div class="qn">Question ${p.qi + 1}</div>` : ''}<img class="qimg" src="${getBase() + p.src}" alt="">${foot}`;
    else if (p && p.kind === 'ws') inner = `<div class="ws">Working space</div><div class="ws-lines"></div>${foot}`;

    document.getElementById('aasl-pv-fit').innerHTML = `<div class="pg">${inner}</div>`;
    document.getElementById('aasl-pv-where').textContent =
      `${pages.type === 'markscheme' ? 'markscheme · ' : ''}page ${pages.length ? _page + 1 : 0} of ${pages.length} · A4`;
    const strip = document.getElementById('aasl-pv-strip');
    strip.innerHTML = pages.map((pg, i) => `<button type="button" class="${i === _page ? 'on' : ''}" data-i="${i}" aria-label="Page ${i + 1}: ${pg.label}">${pg.label}</button>`).join('');
    strip.onclick = e => { const b = e.target.closest('[data-i]'); if (b) { _page = Number(b.dataset.i); updatePreview(); } };
    fitPreview();
  }

  function fitPreview() {
    const stage = document.getElementById('aasl-pv-stage');
    const fit = document.getElementById('aasl-pv-fit');
    const pg = fit && fit.firstElementChild;
    if (!stage || !pg) return;
    // Fill the pane: the whole page when the pane is tall enough for that to be readable,
    // otherwise the full width (the pane scrolls), so the text can always be read.
    const whole = Math.min(stage.clientWidth / 595, stage.clientHeight / 842);
    const scale = Math.max(0.1, Math.min(whole >= 0.9 ? whole : (stage.clientWidth - 14) / 595, 1.5));
    fit.style.width = `${595 * scale}px`;
    fit.style.height = `${842 * scale}px`;
    pg.style.transform = `scale(${scale})`;
  }

  // ─── Versions ─────────────────────────────────────────────────────────────
  // A reordering of the paper for version B, C or D. Section A questions stay before Section B
  // ones, as on an IB paper. The order depends only on the questions and the version, so
  // exporting again gives the same Version B.
  function versionOrder(items, v) {
    let seed = 2166136261;
    for (const ch of items.map(q => q.id).sort().join('|') + '#' + v) seed = Math.imul(seed ^ ch.charCodeAt(0), 16777619) >>> 0;
    const rand = () => {
      seed = (seed + 0x6D2B79F5) >>> 0;
      let t = seed;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const shuffle = list => {
      const out = list.slice();
      for (let tries = 0; tries < 8; tries++) {
        for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
        if (out.length < 2 || out.some((q, i) => q !== list[i])) break;   // not the original order
      }
      return out;
    };
    const hasBoth = items.some(q => q.section === 'A') && items.some(q => q.section === 'B');
    if (!hasBoth) return shuffle(items);
    return [...shuffle(items.filter(q => q.section !== 'B')), ...shuffle(items.filter(q => q.section === 'B'))];
  }
  window.AASL_VERSION_ORDER = versionOrder;

  // ─── Generate ─────────────────────────────────────────────────────────────
  async function doGenerate(format) {
    const s = collectSettings();
    s.format = format;
    saveSettings(s);
    const status = document.getElementById('aasl-gen-status');
    if (!s.includeQuestions && !s.includeMarkscheme) {
      status.textContent = 'Tick Question paper or Markscheme first.';
      return;
    }
    const buttons = [document.getElementById('aasl-dl-pdf'), document.getElementById('aasl-dl-docx')];
    buttons.forEach(b => { b.disabled = true; });
    status.textContent = 'Loading libraries…';

    try {
      const all = basketItems();
      const marks = totalMarksOf(all);
      const mime = { pdf: 'application/pdf', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }[format];
      if (format === 'pdf') {
        await loadScript(PDF_LIB_CDN);
        if (!window.PDFLib) throw new Error('pdf-lib failed to load');
      } else {
        await loadScript(DOCX_CDN);
        if (!window.docx) throw new Error('docx.js failed to load');
      }
      const build = async (items, sv, type) => (format === 'pdf'
        ? buildPdf(items, sv, type, marks)
        : (await buildDocx(items, sv, type, marks)).arrayBuffer());
      for (let v = 0; v < s.versions; v++) {
        // Version A is the paper as ordered. B onwards reorder it (same order every time for
        // the same questions) and say which version they are in the title and file name.
        const letter = 'ABCD'[v];
        const many = s.versions > 1;
        const items = v === 0 ? all : versionOrder(all, v);
        const sv = many ? Object.assign({}, s, { title: `${s.title} (Version ${letter})` }) : s;
        const tag = many ? `-version-${letter}` : '';
        const name = (isMs) => pdfFilename(s, marks, format, isMs).replace(/(\.[a-z]+)$/, `${tag}$1`);
        if (s.includeQuestions) {
          status.textContent = `Building the question paper${many ? `, version ${letter}` : ''}…`;
          downloadBlob(await build(items, sv, 'questions'), mime, name(false));
        }
        if (s.includeMarkscheme) {
          status.textContent = `Building the markscheme${many ? `, version ${letter}` : ''}…`;
          downloadBlob(await build(items, sv, 'markscheme'), mime, name(true));
        }
      }
      status.textContent = '✓ Downloaded.';
    } catch (err) {
      console.error('Export error:', err);
      status.textContent = '⚠ Error: ' + err.message;
    }
    buttons.forEach(b => { b.disabled = false; });
  }

  function pdfFilename(s, marks, ext, isMs) {
    const date  = (s.testDate || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
    const slug  = s.title ? s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) : null;
    const base  = slug || (isMs ? 'markscheme' : 'test');
    const label = isMs ? 'markscheme' : 'test';
    return `${base}-${label}-${date}-${marks}marks.${ext}`;
  }

  // ─── Image helpers ────────────────────────────────────────────────────────
  function getBase() {
    return document.body.dataset.base || './';
  }

  async function fetchImageAsPng(relSrc, maskRegions) {
    const url = getBase() + relSrc;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });

    const canvas = document.createElement('canvas');
    canvas.width  = img.naturalWidth  || IMG_PX_W;
    canvas.height = img.naturalHeight || 1324;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    // Apply white masks
    if (maskRegions && maskRegions.length) {
      ctx.fillStyle = '#ffffff';
      maskRegions.forEach(r => ctx.fillRect(r.x, r.y, r.width, r.height));
    }

    return new Promise(res => canvas.toBlob(blob => {
      const reader = new FileReader();
      reader.onloadend = () => res(reader.result); // data URL
      reader.readAsDataURL(blob);
    }, 'image/png'));
  }

  function getMaskRegions(questionId, type, imageIndex) {
    const masks = window.AASL_MASKS;
    if (!masks || !masks[questionId]) return [];
    const entry = masks[questionId][type]; // 'paper' or 'markscheme'
    if (!entry || !entry.length) return [];
    const page = entry.find(p => p && p.imageIndex === imageIndex);
    return page?.regions || [];
  }

  // ─── PDF Generation ───────────────────────────────────────────────────────
  async function buildPdf(items, s, type, totalMarks) {
    const { PDFDocument, StandardFonts, rgb, PageSizes } = window.PDFLib;
    const pdfDoc = await PDFDocument.create();
    const fontReg  = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const totalPages = countTotalPages(items, s, type);
    let pageNum = 0;

    // Cover sheet
    if (s.coverSheet && type === 'questions') {
      const page = pdfDoc.addPage([A4_W, A4_H]);
      await drawCoverSheet(page, s, totalMarks, fontReg, fontBold, rgb);
    }

    // Questions
    for (let qi = 0; qi < items.length; qi++) {
      const q = items[qi];
      const images = type === 'questions' ? q.paperImages : q.markschemeImages;
      if (!images || !images.length) continue;

      for (let ii = 0; ii < images.length; ii++) {
        pageNum++;
        const page = pdfDoc.addPage([A4_W, A4_H]);
        const maskRegions = getMaskRegions(q.id, type === 'questions' ? 'paper' : 'markscheme', ii);

        // Banner on first image of each question
        let yOffset = A4_H - MARGIN;
        if (ii === 0) {
          fontBold.encodeText(`Question ${qi + 1}`); // warm up
          page.drawText(`Question ${qi + 1}`, {
            x: MARGIN, y: yOffset - 14,
            size: 12, font: fontBold, color: rgb(0.1, 0.1, 0.1)
          });
          yOffset -= 28;
        }

        try {
          const dataUrl = await fetchImageAsPng(images[ii], maskRegions);
          const base64  = dataUrl.split(',')[1];
          const pngImg  = await pdfDoc.embedPng(base64);
          const imgW = pngImg.width, imgH = pngImg.height;
          const scale  = CONTENT_W / imgW;
          const drawH  = imgH * scale;
          const availH = yOffset - MARGIN - (s.showPageNumbers ? 18 : 0);
          const finalScale = drawH > availH ? availH / (imgH) : scale;
          const finalW = imgW * finalScale;
          const finalH = imgH * finalScale;

          page.drawImage(pngImg, {
            x: MARGIN,
            y: yOffset - finalH,
            width: finalW,
            height: finalH
          });
        } catch (e) {
          page.drawText(`[Image unavailable: ${images[ii]}]`, {
            x: MARGIN, y: yOffset - 20, size: 9, font: fontReg, color: rgb(0.6, 0.1, 0.1)
          });
        }

        // Page footer
        if (s.showPageNumbers) {
          page.drawText(`Page ${pageNum} of ${totalPages}`, {
            x: A4_W / 2 - 30, y: MARGIN - 20, size: 8, font: fontReg, color: rgb(0.5, 0.5, 0.5)
          });
        }
      }

      // Work space pages (Section B, questions mode only)
      if (type === 'questions' && s.workSpace && q.section === 'B') {
        for (let w = 0; w < s.workSpacePages; w++) {
          pageNum++;
          const page = pdfDoc.addPage([A4_W, A4_H]);
          drawWorkSpacePage(page, fontReg, fontBold, rgb, s.showPageNumbers, pageNum, totalPages);
        }
      }
    }

    return await pdfDoc.save();
  }

  function countTotalPages(items, s, type) {
    let count = 0;
    items.forEach(q => {
      const imgs = type === 'questions' ? q.paperImages : q.markschemeImages;
      count += (imgs || []).length;
      if (type === 'questions' && s.workSpace && q.section === 'B') count += s.workSpacePages;
    });
    return count;
  }

  function drawWorkSpacePage(page, fontReg, fontBold, rgb, showNums, pageNum, totalPages) {
    const lineSpacing = 28;
    const startY = A4_H - MARGIN - 20;
    page.drawText('Working space', {
      x: MARGIN, y: startY, size: 9, font: fontBold, color: rgb(0.7, 0.7, 0.7)
    });
    for (let y = startY - lineSpacing; y > MARGIN + (showNums ? 20 : 0); y -= lineSpacing) {
      page.drawLine({
        start: { x: MARGIN, y },
        end:   { x: A4_W - MARGIN, y },
        thickness: 0.4,
        color: rgb(0.82, 0.82, 0.82)
      });
    }
    if (showNums) {
      page.drawText(`Page ${pageNum} of ${totalPages}`, {
        x: A4_W / 2 - 30, y: MARGIN - 20, size: 8, font: fontReg, color: rgb(0.5, 0.5, 0.5)
      });
    }
  }

  // ─── Cover sheet rendering (pdf-lib) ──────────────────────────────────────
  async function drawCoverSheet(page, s, totalMarks, fontReg, fontBold, rgb) {
    const items = window.AASL_BASKET.getAll();
    let y = A4_H - MARGIN;
    const lh = (size, gap = 1.4) => size * gap;

    function txt(text, x, cy, size, font, color) {
      page.drawText(String(text), { x, y: cy, size, font, color: color || rgb(0.1, 0.1, 0.1) });
    }
    function line(y1, indent = 0) {
      page.drawLine({
        start: { x: MARGIN + indent, y: y1 },
        end:   { x: A4_W - MARGIN,  y: y1 },
        thickness: 0.7, color: rgb(0.7, 0.7, 0.7)
      });
    }
    function underline(lx, ly, width) {
      page.drawLine({
        start: { x: lx,       y: ly },
        end:   { x: lx+width, y: ly },
        thickness: 0.6, color: rgb(0.3, 0.3, 0.3)
      });
    }

    // Logo (always PNG — converted via canvas at upload time, no fetch needed)
    if (s.showLogo && s.logoDataUrl) {
      try {
        const b64 = s.logoDataUrl.split(',')[1];
        const imgBytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        const logoImg  = await page.doc.embedPng(imgBytes);
        const logoMaxW = 90, logoMaxH = 50;
        const srcW = s.logoW || logoImg.width || 90;
        const srcH = s.logoH || logoImg.height || 50;
        const scale = Math.min(logoMaxW / srcW, logoMaxH / srcH, 1);
        const lw = srcW * scale, lh = srcH * scale;
        page.drawImage(logoImg, { x: A4_W - MARGIN - lw, y: y - lh, width: lw, height: lh });
      } catch (_) {}
    }

    // School + teacher + class
    const branding = [
      s.showSchoolName  && s.schoolName  ? s.schoolName  : null,
      s.showTeacherName && s.teacherName ? s.teacherName : null,
      s.showClassCode   && s.classCode   ? s.classCode   : null,
    ].filter(Boolean);
    branding.forEach(line_ => {
      txt(line_, MARGIN, y - 12, 9, fontReg, rgb(0.4, 0.4, 0.4));
      y -= 14;
    });
    if (branding.length) y -= 4;

    // Title
    txt(s.title || 'Mathematics: Analysis and Approaches SL', MARGIN, y - 16, 15, fontBold);
    y -= lh(15, 1.8);

    // Date
    if (s.testDate) {
      const dateStr = new Date(s.testDate + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      txt(dateStr, MARGIN, y - 12, 10, fontReg);
      y -= lh(10, 1.8);
    }

    line(y - 4);
    y -= 20;

    // Name line
    if (s.showNameLine) {
      txt('Name:', MARGIN, y - 12, 10, fontBold);
      underline(MARGIN + 40, y - 13, 200);
      y -= lh(10, 2.2);
    }

    // Time + marks on same row
    const rowY = y - 12;
    if (s.showTimeAllowed) {
      const items_ = window.AASL_BASKET.getAll();
      const marks = items_.reduce((t, q) => t + (q.marks || 0), 0);
      const timeMin = s.timeAllowed || Math.ceil(marks / 80 * 90 / 5) * 5;
      txt('Time Allowed:', MARGIN, rowY, 10, fontBold);
      txt(`${timeMin} minutes`, MARGIN + 80, rowY, 10, fontReg);
    }
    if (s.showTotalMarks) {
      txt('Total Marks:', A4_W / 2, rowY, 10, fontBold);
      txt(String(totalMarks), A4_W / 2 + 72, rowY, 10, fontReg);
    }
    y -= lh(10, 2.8);

    line(y - 4);
    y -= 18;

    // Instructions
    const instrs = [
      [s.instrCalculator,   s.instrCalculatorText],
      [s.instrAnswerSpace,  s.instrAnswerSpaceText],
      [s.instrShowWork,     s.instrShowWorkText],
      [s.instrSigFig,       s.instrSigFigText],
      [s.instrFormula,      s.instrFormulaText],
    ].filter(([on]) => on).map(([, t]) => t).filter(Boolean);

    if (instrs.length) {
      txt('Instructions to candidates:', MARGIN, y - 12, 10, fontBold);
      y -= lh(10, 2);
      instrs.forEach(instr => {
        txt('•', MARGIN + 4, y - 10, 9, fontReg);
        // Wrap long instructions
        const words = instr.split(' ');
        let line_ = '';
        const maxW = CONTENT_W - 22;
        let lineY = y - 10;
        for (const word of words) {
          const test = line_ ? line_ + ' ' + word : word;
          const testW = fontReg.widthOfTextAtSize(test, 9);
          if (testW > maxW && line_) {
            txt(line_, MARGIN + 16, lineY, 9, fontReg);
            lineY -= 13;
            line_ = word;
          } else {
            line_ = test;
          }
        }
        if (line_) txt(line_, MARGIN + 16, lineY, 9, fontReg);
        y = lineY - 10;
      });
    }

    // Marks grid
    if (s.showMarksGrid && items.length > 0) {
      y -= 10;
      line(y, 0);
      y -= 16;

      const labelText = 'To be filled out by teacher';
      const lw = fontReg.widthOfTextAtSize(labelText, 8);
      const labelX = (A4_W - lw) / 2;
      txt(labelText, labelX, y, 8, fontReg, rgb(0.55, 0.55, 0.55));
      const lineY2 = y + 3;
      const lineGap = 8;
      page.drawLine({ start: { x: MARGIN, y: lineY2 }, end: { x: labelX - lineGap, y: lineY2 }, thickness: 0.5, color: rgb(0.75, 0.75, 0.75) });
      page.drawLine({ start: { x: labelX + lw + lineGap, y: lineY2 }, end: { x: MARGIN + CONTENT_W, y: lineY2 }, thickness: 0.5, color: rgb(0.75, 0.75, 0.75) });
      y -= 18;

      const cellW  = Math.min(46, (CONTENT_W) / (items.length + 1));
      const cellH  = 22;
      const startX = MARGIN;

      // Draw grid: 2 rows (number row + marks row)
      // Header row
      let cx = startX;
      items.forEach((q, i) => {
        page.drawRectangle({ x: cx, y: y - cellH, width: cellW, height: cellH, borderColor: rgb(0.6, 0.6, 0.6), borderWidth: 0.5 });
        const label = String(i + 1);
        const lw2 = fontBold.widthOfTextAtSize(label, 8);
        txt(label, cx + (cellW - lw2) / 2, y - cellH + 7, 8, fontBold);
        cx += cellW;
      });
      // Sum header cell
      page.drawRectangle({ x: cx, y: y - cellH, width: cellW, height: cellH, borderColor: rgb(0.6, 0.6, 0.6), borderWidth: 0.5 });
      const sumLbl = 'Sum';
      txt(sumLbl, cx + (cellW - fontBold.widthOfTextAtSize(sumLbl, 8)) / 2, y - cellH + 7, 8, fontBold);

      y -= cellH;
      cx = startX;

      // Marks row
      items.forEach(q => {
        page.drawRectangle({ x: cx, y: y - cellH, width: cellW, height: cellH, borderColor: rgb(0.6, 0.6, 0.6), borderWidth: 0.5 });
        const mLabel = `/${q.marks || 0}`;
        const mw = fontReg.widthOfTextAtSize(mLabel, 8);
        txt(mLabel, cx + (cellW - mw) / 2, y - cellH + 7, 8, fontReg, rgb(0.4, 0.4, 0.4));
        cx += cellW;
      });
      // Sum cell
      page.drawRectangle({ x: cx, y: y - cellH, width: cellW, height: cellH, borderColor: rgb(0.6, 0.6, 0.6), borderWidth: 0.5 });
      const totalLbl = `/${totalMarks}`;
      txt(totalLbl, cx + (cellW - fontBold.widthOfTextAtSize(totalLbl, 8)) / 2, y - cellH + 7, 8, fontBold);
    }
  }

  // ─── DOCX Generation ──────────────────────────────────────────────────────
  async function buildDocx(items, s, type, totalMarks) {
    const {
      Document, Packer, Paragraph, TextRun, ImageRun,
      HeadingLevel, AlignmentType, WidthType, TableRow, TableCell, Table,
      BorderStyle, ShadingType, PageSize
    } = window.docx;

    // A4 page dimensions in twips (1 inch = 1440 twips)
    // A4 = 8.268 × 11.693 inches
    const A4_W_TWIPS  = 11906;  // 8.268 in × 1440
    const A4_H_TWIPS  = 16838;  // 11.693 in × 1440
    const MARGIN_TWIPS = 1134;  // ~2 cm (0.787 in × 1440)
    // Image width in pixels (docx ImageRun uses px at 96 DPI)
    // Usable width = (8.268 - 2×0.787) in = 6.694 in = 643 px
    const IMG_PX      = 643;
    const IMG_PX_H    = Math.round(IMG_PX * 1324 / IMG_PX_W);

    const sections = [];

    // Cover sheet
    if (s.coverSheet && type === 'questions') {
      const children = buildDocxCover(s, totalMarks, items, { Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, AlignmentType, WidthType, BorderStyle });
      sections.push({ children });
    }

    // Content pages
    for (let qi = 0; qi < items.length; qi++) {
      const q = items[qi];
      const images = type === 'questions' ? q.paperImages : q.markschemeImages;
      if (!images || !images.length) continue;

      const children = [];

      // Banner
      children.push(new Paragraph({
        children: [new TextRun({ text: `Question ${qi + 1}`, bold: true, size: 24 })],
        spacing: { before: 120, after: 80 }
      }));

      for (let ii = 0; ii < images.length; ii++) {
        const maskRegions = getMaskRegions(q.id, type === 'questions' ? 'paper' : 'markscheme', ii);
        try {
          const dataUrl = await fetchImageAsPng(images[ii], maskRegions);
          const base64  = dataUrl.split(',')[1];
          const binaryStr = atob(base64);
          const bytes = new Uint8Array(binaryStr.length);
          for (let b = 0; b < binaryStr.length; b++) bytes[b] = binaryStr.charCodeAt(b);

          children.push(new Paragraph({
            children: [new ImageRun({
              data: bytes,
              transformation: { width: IMG_PX, height: IMG_PX_H }
            })]
          }));
        } catch (_) {
          children.push(new Paragraph({ children: [new TextRun({ text: '[Image unavailable]', color: 'FF0000' })] }));
        }
      }

      // Work space
      if (type === 'questions' && s.workSpace && q.section === 'B') {
        for (let w = 0; w < s.workSpacePages; w++) {
          children.push(new Paragraph({ children: [new TextRun({ text: 'Working space', color: 'AAAAAA', size: 18 })], pageBreakBefore: w === 0 }));
        }
      }

      sections.push({ children });
    }

    if (sections.length === 0) sections.push({ children: [new Paragraph({ children: [new TextRun('No content.')] })] });

    const doc = new Document({
      sections: sections.map((sec, i) => ({
        properties: {
          page: {
            size: { width: A4_W_TWIPS, height: A4_H_TWIPS, orientation: 'portrait' },
            margin: { top: MARGIN_TWIPS, right: MARGIN_TWIPS, bottom: MARGIN_TWIPS, left: MARGIN_TWIPS }
          }
        },
        children: sec.children
      }))
    });

    return await Packer.toBlob(doc);
  }

  function buildDocxCover(s, totalMarks, items, { Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, AlignmentType, WidthType, BorderStyle }) {
    const paras = [];

    // Logo (right-aligned, above branding)
    if (s.showLogo && s.logoDataUrl) {
      try {
        const [, b64] = s.logoDataUrl.split(',');
        const binaryStr = atob(b64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
        const srcW = s.logoW || 160, srcH = s.logoH || 80;
        const logoMaxPx = 120;
        const scale = Math.min(1, logoMaxPx / Math.max(srcW, srcH));
        const lw = Math.round(srcW * scale), lh = Math.round(srcH * scale);
        paras.push(new Paragraph({
          children: [new ImageRun({ data: bytes, transformation: { width: lw, height: lh } })],
          alignment: AlignmentType.RIGHT,
          spacing: { after: 80 }
        }));
      } catch (_) {}
    }

    if (s.showSchoolName && s.schoolName)
      paras.push(new Paragraph({ children: [new TextRun({ text: s.schoolName, size: 18, color: '666666' })] }));
    if (s.showTeacherName && s.teacherName)
      paras.push(new Paragraph({ children: [new TextRun({ text: s.teacherName, size: 18, color: '666666' })] }));
    if (s.showClassCode && s.classCode)
      paras.push(new Paragraph({ children: [new TextRun({ text: s.classCode, size: 18, color: '666666' })] }));

    paras.push(new Paragraph({ children: [new TextRun({ text: s.title || 'Mathematics: Analysis and Approaches SL', bold: true, size: 32 })], spacing: { before: 240, after: 120 } }));

    if (s.testDate) {
      const dateStr = new Date(s.testDate + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      paras.push(new Paragraph({ children: [new TextRun({ text: dateStr, size: 22 })], spacing: { after: 160 } }));
    }

    if (s.showNameLine)
      paras.push(new Paragraph({ children: [new TextRun({ text: 'Name: _______________________________________', size: 22 })], spacing: { after: 120 } }));

    const metaLine = [];
    if (s.showTimeAllowed) {
      const tm = s.timeAllowed || Math.ceil(totalMarks / 80 * 90 / 5) * 5;
      metaLine.push(new TextRun({ text: `Time Allowed: `, bold: true, size: 22 }));
      metaLine.push(new TextRun({ text: `${tm} minutes     `, size: 22 }));
    }
    if (s.showTotalMarks) {
      metaLine.push(new TextRun({ text: 'Total Marks: ', bold: true, size: 22 }));
      metaLine.push(new TextRun({ text: String(totalMarks), size: 22 }));
    }
    if (metaLine.length) paras.push(new Paragraph({ children: metaLine, spacing: { after: 160 } }));

    // Instructions
    const instrs = [
      [s.instrCalculator,  s.instrCalculatorText],
      [s.instrAnswerSpace, s.instrAnswerSpaceText],
      [s.instrShowWork,    s.instrShowWorkText],
      [s.instrSigFig,      s.instrSigFigText],
      [s.instrFormula,     s.instrFormulaText],
    ].filter(([on]) => on).map(([, t]) => t).filter(Boolean);

    if (instrs.length) {
      paras.push(new Paragraph({ children: [new TextRun({ text: 'Instructions to candidates:', bold: true, size: 22 })], spacing: { before: 160, after: 80 } }));
      instrs.forEach(instr => paras.push(new Paragraph({
        children: [new TextRun({ text: instr, size: 20 })],
        bullet: { level: 0 },
        spacing: { after: 60 }
      })));
    }

    // Marks grid
    if (s.showMarksGrid && items.length > 0) {
      paras.push(new Paragraph({ children: [new TextRun({ text: '─── To be filled out by teacher ───', size: 18, color: '888888' })], alignment: AlignmentType.CENTER, spacing: { before: 240, after: 120 } }));

      const noBorder = { style: BorderStyle.SINGLE, size: 4, color: '999999' };
      const allBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

      const headerCells = items.map((q, i) => new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: String(i + 1), bold: true, size: 18 })], alignment: AlignmentType.CENTER })],
        borders: allBorders
      }));
      headerCells.push(new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Sum', bold: true, size: 18 })], alignment: AlignmentType.CENTER })],
        borders: allBorders
      }));

      const marksCells = items.map(q => new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: `/${q.marks || 0}`, size: 18 })], alignment: AlignmentType.CENTER })],
        borders: allBorders
      }));
      marksCells.push(new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: `/${totalMarks}`, bold: true, size: 18 })], alignment: AlignmentType.CENTER })],
        borders: allBorders
      }));

      paras.push(new Table({
        rows: [new TableRow({ children: headerCells }), new TableRow({ children: marksCells })],
        width: { size: 100, type: WidthType.PERCENTAGE }
      }));
    }

    return paras;
  }

  // ─── Download helper ──────────────────────────────────────────────────────
  function downloadBlob(data, mimeType, filename) {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 2000);
  }

  function escHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

})();
