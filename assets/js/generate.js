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
    // The teacher's own instruction lines ({ on, text }) and a free block of text under them
    extraInstrs:       [],
    showCustomText:    false,     customText: '',
    // Work space
    workSpace:         false,
    workSpacePages:    1,
    workSpaceStyle:    'blank',   // 'blank' or 'lined'
    workSpaceFor:      'B',       // 'B': after each Section B question; 'all': after every question
    // Pagination
    showPageNumbers:   true,
    // Blank out each question's original exam number: the paper prints its own "Question N"
    hideNumbers:       true,
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
  let _zoom = null;        // preview zoom: null fits whole pages to the pane, else a scale
  let _fit = null;         // ResizeObserver for the preview

  const basketItems = () => window.AASL_BASKET.getAll();
  const totalMarksOf = items => items.reduce((t, q) => t + (q.marks || 0), 0);
  const suggestedTime = marks => Math.ceil(marks / 80 * 90 / 5) * 5;

  function openModal() {
    if (!window.AASL_BASKET || window.AASL_BASKET.count() === 0) return;
    const s = loadSettings();
    if (!s.testDate) s.testDate = new Date().toISOString().slice(0, 10);
    // The calculator line follows the papers the questions come from, unless the teacher rewrote it.
    if (!s.instrCalculatorText || CALC_NOTES.includes(s.instrCalculatorText)) s.instrCalculatorText = calcNote();

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
    _zoom = null;

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
  const CALC_NOTES = [
    'You are not permitted access to any calculator for this paper.',
    'A graphic display calculator is required for this paper.',
    'Check individual questions for calculator guidance (mixed P1/P2 paper).',
  ];
  function calcNote() {
    const items = basketItems();
    const papers = new Set(items.map(q => q.paper));
    if (papers.size === 1) {
      if (papers.has('P1')) return CALC_NOTES[0];
      if (papers.has('P2')) return CALC_NOTES[1];
    }
    return CALC_NOTES[2];
  }

  // The instruction lines the cover prints, in order: the ticked presets, then the teacher's own.
  function instructionsOf(s) {
    return [
      [s.instrCalculator, s.instrCalculatorText], [s.instrAnswerSpace, s.instrAnswerSpaceText], [s.instrShowWork, s.instrShowWorkText],
      [s.instrSigFig, s.instrSigFigText], [s.instrFormula, s.instrFormulaText],
      ...(s.extraInstrs || []).map(x => [x.on, x.text]),
    ].filter(([on, t]) => on && t && t.trim()).map(([, t]) => t.trim());
  }
  // The free text block as lines; an empty line is kept as a paragraph gap.
  const customLines = s => (s.showCustomText && s.customText && s.customText.trim() ? s.customText.trim().split(/\r?\n/) : []);

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
    const opt = (value, label, current) => `<option value="${value}" ${value === current ? 'selected' : ''}>${label}</option>`;

    return `
    <div class="dlg" role="dialog" aria-modal="true" aria-labelledby="aasl-dlg-title">
      <div class="dt"><h2 id="aasl-dlg-title">Set up and export</h2><span>${items.length} question${items.length === 1 ? '' : 's'} · ${marks} marks</span><button type="button" class="x" id="aasl-modal-close" aria-label="Close">×</button></div>
      <div class="form">
        <div><h4 class="cap">Include</h4><div class="g2">
          <label class="ckl">${ck('gen-questions', s.includeQuestions)}Question paper</label>
          <label class="ckl">${ck('gen-markscheme', s.includeMarkscheme)}Markscheme <small>separate file</small></label>
          <label class="ckl">${ck('cs-show-grid', s.showMarksGrid)}Marks grid <small>on the cover</small></label>
          <label class="ckl">${ck('gen-pagenums', s.showPageNumbers)}Page X of Y footer</label>
          <label class="ckl wide">${ck('gen-hidenumbers', s.hideNumbers !== false)}Hide the original question numbers <small>the paper numbers them 1, 2, 3…</small></label>
          <label class="ckl wide">Versions
            <select class="select" id="gen-versions">${[1, 2, 3, 4].map(n => `<option value="${n}" ${n === (s.versions || 1) ? 'selected' : ''}>${n === 1 ? '1 (just this paper)' : `${n}: ${'ABCD'.slice(0, n).split('').join(', ')}`}</option>`).join('')}</select>
            <small>same questions, different order</small></label>
          <div class="ckl wide">Working pages
            <select class="select" id="gen-workspace-n" aria-label="Number of working pages">${[0, 1, 2, 3, 4].map(n => `<option value="${n}" ${n === wsN ? 'selected' : ''}>${n}</option>`).join('')}</select>
            <select class="select" id="gen-workspace-style" aria-label="Working page style">${opt('blank', 'blank', s.workSpaceStyle)}${opt('lined', 'lined', s.workSpaceStyle)}</select>
            <select class="select" id="gen-workspace-for" aria-label="Where to add working pages">${opt('B', 'after each Section B question', s.workSpaceFor)}${opt('all', 'after every question', s.workSpaceFor)}</select>
            ${hasB ? '' : '<small id="gen-workspace-note">this paper has no Section B question</small>'}</div>
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
            <div id="cs-instr-extra">${(s.extraInstrs || []).map(x => extraRow(x.on, x.text)).join('')}</div>
            <div class="ins-acts"><button type="button" class="link" id="cs-instr-add">+ Add your own line</button><button type="button" class="link" id="cs-instr-reset">Reset the preset lines</button></div>
            <h4 class="cap" style="margin-top:14px"><label>${ck('cs-show-custom', s.showCustomText)} Your own text <small>printed under the instructions</small></label></h4>
            <textarea class="input" id="cs-custom" rows="3" placeholder="e.g. Section A: answer on the paper. Section B: answer in the booklet." ${s.showCustomText ? '' : 'disabled'}>${escHtml(s.customText)}</textarea>
          </div>
        </div>
      </div>
      <div class="prev">
        <div class="ph"><span><b>Live preview</b> · <span id="aasl-pv-where"></span></span>
          <span class="pv-zoom"><button type="button" id="aasl-pv-out" aria-label="Zoom out" title="Zoom out">−</button><span id="aasl-pv-pct"></span><button type="button" id="aasl-pv-in" aria-label="Zoom in" title="Zoom in">+</button><button type="button" id="aasl-pv-fitbtn" title="Fit whole pages in the window">Fit</button><button type="button" id="aasl-pv-width" title="Fit the page width">Width</button></span></div>
        <div class="pv-stage" id="aasl-pv-stage"><div class="pv-pages" id="aasl-pv-fit"></div></div>
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

  function extraRow(checked, text) {
    return `<div class="ins extra">
      <input type="checkbox" ${checked ? 'checked' : ''} aria-label="Include this instruction">
      <input class="input" type="text" value="${escHtml(text)}" placeholder="Your instruction" ${checked ? '' : 'disabled'}>
      <button type="button" class="x" aria-label="Remove this line" title="Remove this line">×</button>
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
      ['cs-instr-form-check', 'cs-instr-form-text'], ['cs-show-custom', 'cs-custom'],
    ];
    function applyToggles() {
      pairs.forEach(([cbId, inputId]) => { const cb = $(cbId), inp = $(inputId); if (cb && inp) inp.disabled = !cb.checked; });
      modalEl.querySelectorAll('.ins.extra').forEach(row => { row.querySelector('.input').disabled = !row.querySelector('input[type="checkbox"]').checked; });
      $('gen-cover-editor').hidden = !$('gen-cover').checked;
      $('cs-logo-wrap').classList.toggle('off', !$('cs-show-logo').checked);
    }

    renderLogoBox();
    // Any change: save it and redraw the preview.
    const onChange = () => { applyToggles(); updatePreview(); };
    modalEl.querySelector('.form').addEventListener('input', onChange);
    modalEl.querySelector('.form').addEventListener('change', onChange);

    // The teacher's own instruction lines, and putting the presets back as they came.
    $('cs-instr-add').onclick = () => {
      $('cs-instr-extra').insertAdjacentHTML('beforeend', extraRow(true, ''));
      $('cs-instr-extra').lastElementChild.querySelector('.input').focus();
      onChange();
    };
    $('cs-instr-extra').addEventListener('click', e => {
      if (e.target.closest('button.x')) { e.target.closest('.ins').remove(); onChange(); }
    });
    $('cs-instr-reset').onclick = () => {
      const d = applyCourseDefaults(Object.assign({}, DEFAULT_SETTINGS), {});
      [['calc', calcNote()], ['ans', d.instrAnswerSpaceText], ['work', d.instrShowWorkText], ['sigfig', d.instrSigFigText], ['form', d.instrFormulaText]]
        .forEach(([k, text]) => { $(`cs-instr-${k}-text`).value = text; $(`cs-instr-${k}-check`).checked = true; });
      onChange();
    };

    $('aasl-dl-pdf').onclick = () => doGenerate('pdf');
    $('aasl-dl-docx').onclick = () => doGenerate('docx');

    if (window.ResizeObserver) {
      _fit = new ResizeObserver(fitPreview);
      _fit.observe($('aasl-pv-stage'));
      $('aasl-pv-in').onclick = () => zoomPreview(1.2);
      $('aasl-pv-out').onclick = () => zoomPreview(1 / 1.2);
      $('aasl-pv-fitbtn').onclick = () => zoomPreview('fit');
      $('aasl-pv-width').onclick = () => zoomPreview('width');
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
    const wsN = parseInt(val('gen-workspace-n'), 10) || 0;

    const s = {
      includeQuestions:  chk('gen-questions'),
      includeMarkscheme: chk('gen-markscheme'),
      format:            loadSettings().format || 'pdf',
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
      extraInstrs:       [...modalEl.querySelectorAll('.ins.extra')].map(row => ({
        on: row.querySelector('input[type="checkbox"]').checked, text: row.querySelector('.input').value,
      })),
      showCustomText:    chk('cs-show-custom'),        customText:          val('cs-custom'),
      workSpace:         wsN > 0,
      workSpacePages:    wsN || 1,
      workSpaceStyle:    val('gen-workspace-style') === 'lined' ? 'lined' : 'blank',
      workSpaceFor:      val('gen-workspace-for') === 'all' ? 'all' : 'B',
      showPageNumbers:   chk('gen-pagenums'),
      hideNumbers:       chk('gen-hidenumbers'),
      versions:          Math.max(1, parseInt(val('gen-versions'), 10) || 1),
    };
    saveSettings(s);
    return s;
  }

  // ─── Page layout ──────────────────────────────────────────────────────────
  // One layout, in A4 points measured from the top of the page, drawn by both the preview and
  // the PDF. Every image keeps its own proportions. Each question starts a new page; its further
  // images follow on the same page while they fit.
  const BANNER_H = 28, IMG_GAP = 8;
  const FALLBACK_SIZE = { w: 1233, h: 1324, missing: true };
  const _sizes = new Map();   // image path -> Promise of { w, h }

  function imageSize(src) {
    if (!_sizes.has(src)) {
      _sizes.set(src, new Promise(res => {
        const img = new Image();
        img.onload = () => res(img.naturalWidth && img.naturalHeight ? { w: img.naturalWidth, h: img.naturalHeight } : FALLBACK_SIZE);
        img.onerror = () => { _sizes.delete(src); res(FALLBACK_SIZE); };
        img.src = getBase() + src;
      }));
    }
    return _sizes.get(src);
  }

  const imagesOf = (q, type) => (type === 'questions' ? q.paperImages : q.markschemeImages) || [];

  async function loadSizes(items, type) {
    const srcs = items.flatMap(q => imagesOf(q, type));
    const sizes = await Promise.all(srcs.map(imageSize));
    return new Map(srcs.map((src, i) => [src, sizes[i]]));
  }

  const wantsWork = (q, s, type) => type === 'questions' && s.workSpace && s.workSpacePages > 0
    && (s.workSpaceFor === 'all' || q.section === 'B');

  function layoutPaper(items, s, type, sizes) {
    const pages = [];
    if (s.coverSheet && type === 'questions') pages.push({ kind: 'cover' });
    const bottom = A4_H - MARGIN;
    let n = 0;
    items.forEach((q, qi) => {
      const images = imagesOf(q, type);
      if (!images.length) return;
      let page = null, y = 0;
      const newPage = () => { page = { kind: 'q', n: ++n, qi, parts: [] }; pages.push(page); y = MARGIN; };
      images.forEach((src, ii) => {
        const size = sizes.get(src) || FALLBACK_SIZE;
        let w = CONTENT_W, h = w * size.h / size.w;
        if (!page) {
          newPage();
          page.parts.push({ t: 'banner', text: `Question ${qi + 1}`, y });
          y += BANNER_H;
        } else if (y + IMG_GAP + h > bottom) newPage();
        else y += IMG_GAP;
        // Taller than the room on an empty page: shrink it, keeping its proportions.
        if (h > bottom - y) { w *= (bottom - y) / h; h = bottom - y; }
        page.parts.push({ t: 'img', src, qid: q.id, ii, missing: !!size.missing, x: MARGIN + (CONTENT_W - w) / 2, y, w, h });
        y += h;
      });
      if (wantsWork(q, s, type)) {
        for (let w = 0; w < s.workSpacePages; w++) pages.push({ kind: 'ws', n: ++n, qi });
      }
    });
    pages.type = type;
    pages.numbered = n;
    return pages;
  }

  // ─── Marks grid ───────────────────────────────────────────────────────────
  // At most 8 questions to a row, in rows of even length; the Sum box ends the last row.
  const GRID_MAX = 8, GRID_CELL_W = CONTENT_W / (GRID_MAX + 1), GRID_HEAD_H = 20, GRID_MARK_H = 34, GRID_ROW_GAP = 10;

  function gridRows(items) {
    const rowCount = Math.ceil(items.length / GRID_MAX);
    const per = Math.ceil(items.length / rowCount);
    const rows = [];
    for (let i = 0; i < items.length; i += per) {
      rows.push(items.slice(i, i + per).map((q, k) => ({ label: String(i + k + 1), marks: q.marks || 0 })));
    }
    return rows;
  }

  const workLabel = qi => `Working space · Question ${qi + 1}`;

  // ─── Live preview ─────────────────────────────────────────────────────────
  // An HTML drawing of the pages the PDF will contain, from the same layout.
  function coverHtml(s, items, marks) {
    const branding = [
      s.showSchoolName && s.schoolName, s.showTeacherName && s.teacherName, s.showClassCode && s.classCode,
    ].filter(Boolean);
    const date = s.testDate ? new Date(s.testDate + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';
    const instrs = instructionsOf(s);
    const custom = customLines(s);
    const time = s.timeAllowed || suggestedTime(marks);
    const rows = gridRows(items);
    const gridTable = (row, last) => `<table class="mgrid"><tr>${row.map(c => `<th>${c.label}</th>`).join('')}${last ? '<th>Sum</th>' : ''}</tr>
        <tr>${row.map(c => `<td>/${c.marks}</td>`).join('')}${last ? `<td><b>/${marks}</b></td>` : ''}</tr></table>`;
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
      ${custom.length ? `<div class="ctext">${custom.map(l => `<p>${escHtml(l) || '&nbsp;'}</p>`).join('')}</div>` : ''}
      ${s.showMarksGrid && items.length ? `<div class="gridcap">To be filled out by teacher</div>
        ${rows.map((row, i) => gridTable(row, i === rows.length - 1)).join('')}` : ''}`;
  }

  let _pvRun = 0;

  async function updatePreview() {
    if (!modalEl || modalEl.hidden) return;
    const s = collectSettings();
    const items = basketItems();
    const marks = totalMarksOf(items);
    const type = s.includeQuestions || !s.includeMarkscheme ? 'questions' : 'markscheme';
    const run = ++_pvRun;
    const sizes = await loadSizes(items, type);
    if (run !== _pvRun || !modalEl || modalEl.hidden) return;   // a newer change is already drawing
    const pages = layoutPaper(items, s, type, sizes);
    const px = v => `${Math.round(v * 100) / 100}px`;
    const partHtml = p => p.t === 'banner'
      ? `<div class="qn" style="top:${px(p.y + 3)}">${escHtml(p.text)}</div>`
      : `<img class="qimg"${p.ii === 0 && s.hideNumbers !== false ? ` data-mask="${escHtml(p.src)}"` : ''} style="left:${px(p.x)};top:${px(p.y)};width:${px(p.w)};height:${px(p.h)}" src="${getBase() + p.src}" alt="">`;
    const pageHtml = p => {
      const foot = p.n && s.showPageNumbers ? `<div class="foot">Page ${p.n} of ${pages.numbered}</div>` : '';
      let inner = '';
      if (p.kind === 'cover') inner = coverHtml(s, items, marks);
      else if (p.kind === 'q') inner = p.parts.map(partHtml).join('') + foot;
      else if (p.kind === 'ws') inner = `<div class="ws">${escHtml(workLabel(p.qi))}</div>${s.workSpaceStyle === 'lined' ? '<div class="ws-lines"></div>' : ''}${foot}`;
      return `<div class="pv-fit"><div class="pg">${inner}</div></div>`;
    };
    // The whole document, in order, in a pane that scrolls: as many pages across as fit.
    const fitEl = document.getElementById('aasl-pv-fit');
    fitEl.innerHTML = pages.length ? pages.map(pageHtml).join('')
      : '<div class="pv-fit"><div class="pg"><div class="ws">Nothing to export: tick Question paper or Markscheme.</div></div></div>';
    // Blank the original question number only on pages that scroll into view.
    if (_mask) _mask.disconnect();
    _mask = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      const img = e.target; _mask.unobserve(img);
      fetchImageAsPng(img.dataset.mask, [], true).then(url => { if (img.isConnected) img.src = url; }).catch(() => {});
    }), { root: document.getElementById('aasl-pv-stage'), rootMargin: '300px' });
    fitEl.querySelectorAll('img[data-mask]').forEach(img => _mask.observe(img));
    document.getElementById('aasl-pv-where').textContent =
      `${pages.type === 'markscheme' ? 'markscheme · ' : ''}${pages.length} page${pages.length === 1 ? '' : 's'} · A4`;
    fitPreview();
  }

  const PV_GAP = 16;
  let _mask = null;

  // Scale that shows whole pages: as large as the pane's height allows, unless that would be
  // too small to read, in which case the page fills the width and the pane scrolls.
  function fitScale(stage, mode, n) {
    const w = (stage.clientWidth - 14) / 595, h = (stage.clientHeight - 4) / 842;
    if (mode === 'width') return Math.min(w, 2);
    // Two pages across when there are two and both stay readable: no empty margins on a wide screen.
    const two = Math.min((stage.clientWidth - 14 - PV_GAP) / (2 * 595), h);
    if (n > 1 && two >= 0.7) return two;
    return Math.min(h >= 0.6 ? h : w, w, 2);
  }

  function fitPreview() {
    const stage = document.getElementById('aasl-pv-stage');
    const fit = document.getElementById('aasl-pv-fit');
    if (!stage || !fit) return;
    const scale = Math.max(0.2, typeof _zoom === 'number' ? _zoom : fitScale(stage, _zoom, fit.children.length));
    for (const box of fit.children) {
      box.style.width = `${595 * scale}px`;
      box.style.height = `${842 * scale}px`;
      box.firstElementChild.style.transform = `scale(${scale})`;
    }
    fit.style.gap = `${PV_GAP}px`;
    const pct = document.getElementById('aasl-pv-pct');
    if (pct) pct.textContent = `${Math.round(scale * 100)}%`;
    fit.dataset.scale = scale;
  }

  function zoomPreview(by) {
    const now = Number(document.getElementById('aasl-pv-fit').dataset.scale) || 1;
    _zoom = by === 'fit' ? null : by === 'width' ? 'width' : Math.max(0.2, Math.min(2.5, Math.round(now * by * 20) / 20));
    fitPreview();
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

  // Where a question's original exam number sits on its first image: the bold "5." in the left
  // margin of the first printed line (question and markscheme crops share this layout). Returns
  // the box to blank out in image pixels, or null when the margin is empty.
  function numberBox(ctx, width, height) {
    const w = Math.round(width * 0.068), h = Math.min(height, Math.round(width * 0.09));
    const px = ctx.getImageData(0, 0, w, h).data;
    const inked = y => { for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; if (px[i] + px[i + 1] + px[i + 2] < 380) return true; } return false; };
    let top = -1, bottom = -1, gap = 0;
    for (let y = 0; y < h; y++) {
      if (inked(y)) { if (top < 0) top = y; bottom = y; gap = 0; }
      else if (top >= 0 && ++gap > 4) break;      // the first line of print has ended
    }
    return top < 0 ? null : { x: 0, y: Math.max(0, top - 3), width: w, height: bottom - top + 7 };
  }

  async function fetchImageAsPng(relSrc, maskRegions, hideNumber) {
    const url = getBase() + relSrc;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });

    const canvas = document.createElement('canvas');
    canvas.width  = img.naturalWidth  || FALLBACK_SIZE.w;
    canvas.height = img.naturalHeight || FALLBACK_SIZE.h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    if (hideNumber) {
      const box = numberBox(ctx, canvas.width, canvas.height);
      if (box) { ctx.fillStyle = '#ffffff'; ctx.fillRect(box.x, box.y, box.width, box.height); }
    }
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
    const { PDFDocument, StandardFonts, rgb } = window.PDFLib;
    const pdfDoc = await PDFDocument.create();
    const fontReg  = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pages = layoutPaper(items, s, type, await loadSizes(items, type));
    const grey = rgb(0.5, 0.5, 0.5);

    for (const p of pages) {
      const page = pdfDoc.addPage([A4_W, A4_H]);
      if (p.kind === 'cover') { await drawCoverSheet(page, s, totalMarks, fontReg, fontBold, rgb, items); continue; }

      if (p.kind === 'ws') drawWorkSpacePage(page, fontBold, rgb, workLabel(p.qi), s.workSpaceStyle === 'lined');
      for (const part of p.kind === 'q' ? p.parts : []) {
        if (part.t === 'banner') {
          page.drawText(part.text, { x: MARGIN, y: A4_H - part.y - 14, size: 12, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
          continue;
        }
        try {
          if (part.missing) throw new Error('missing');
          const maskRegions = getMaskRegions(part.qid, type === 'questions' ? 'paper' : 'markscheme', part.ii);
          const dataUrl = await fetchImageAsPng(part.src, maskRegions, part.ii === 0 && s.hideNumbers !== false);
          const pngImg  = await pdfDoc.embedPng(dataUrl.split(',')[1]);
          page.drawImage(pngImg, { x: part.x, y: A4_H - part.y - part.h, width: part.w, height: part.h });
        } catch (e) {
          page.drawText(`[Image unavailable: ${part.src}]`, {
            x: MARGIN, y: A4_H - part.y - 20, size: 9, font: fontReg, color: rgb(0.6, 0.1, 0.1)
          });
        }
      }

      if (s.showPageNumbers) {
        const label = `Page ${p.n} of ${pages.numbered}`;
        page.drawText(label, { x: (A4_W - fontReg.widthOfTextAtSize(label, 8)) / 2, y: MARGIN - 20, size: 8, font: fontReg, color: grey });
      }
    }

    return await pdfDoc.save();
  }

  function drawWorkSpacePage(page, fontBold, rgb, label, lined) {
    const lineSpacing = 28;
    const startY = A4_H - MARGIN - 12;
    // "·" is outside the standard PDF font's reach on some viewers; use a plain dash.
    page.drawText(label.replace('·', '-'), { x: MARGIN, y: startY, size: 9, font: fontBold, color: rgb(0.7, 0.7, 0.7) });
    if (!lined) return;
    for (let y = startY - lineSpacing; y > MARGIN; y -= lineSpacing) {
      page.drawLine({ start: { x: MARGIN, y }, end: { x: A4_W - MARGIN, y }, thickness: 0.4, color: rgb(0.82, 0.82, 0.82) });
    }
  }

  // ─── Cover sheet rendering (pdf-lib) ──────────────────────────────────────
  async function drawCoverSheet(page, s, totalMarks, fontReg, fontBold, rgb, items) {
    let y = A4_H - MARGIN;
    const lh = (size, gap = 1.4) => size * gap;

    // The standard PDF fonts cannot print every character; one they lack becomes "?".
    const safe = (text, font) => { const ok = new Set(font.getCharacterSet()); return [...String(text)].map(ch => (ok.has(ch.codePointAt(0)) ? ch : '?')).join(''); };
    const wrap = (text, font, size, maxW) => {
      const lines = []; let cur = '';
      for (const word of safe(text, font).split(/\s+/).filter(Boolean)) {
        const test = cur ? cur + ' ' + word : word;
        if (cur && font.widthOfTextAtSize(test, size) > maxW) { lines.push(cur); cur = word; } else cur = test;
      }
      lines.push(cur);
      return lines;
    };
    function txt(text, x, cy, size, font, color) {
      text = safe(text, font);
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
    const instrs = instructionsOf(s);
    if (instrs.length) {
      txt('Instructions to candidates:', MARGIN, y - 12, 10, fontBold);
      y -= lh(10, 2);
      instrs.forEach(instr => {
        txt('•', MARGIN + 4, y - 10, 9, fontReg);
        let lineY = y - 10 + 13;
        wrap(instr, fontReg, 9, CONTENT_W - 22).forEach(l => { lineY -= 13; txt(l, MARGIN + 16, lineY, 9, fontReg); });
        y = lineY - 10;
      });
    }

    // The teacher's own text
    const custom = customLines(s);
    if (custom.length) {
      y -= 6;
      custom.forEach(para => wrap(para, fontReg, 10, CONTENT_W).forEach(l => { y -= 14; if (l) txt(l, MARGIN, y, 10, fontReg); }));
      y -= 8;
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

      // Rows of at most 8 boxes, each with room to write a mark in.
      const rows = gridRows(items);
      const room = y - MARGIN - (rows.length - 1) * GRID_ROW_GAP;
      const markH = Math.max(16, Math.min(GRID_MARK_H, room / rows.length - GRID_HEAD_H));
      const border = { borderColor: rgb(0.45, 0.45, 0.45), borderWidth: 0.7 };
      const cell = (cx, label, marksLabel, bold) => {
        page.drawRectangle({ x: cx, y: y - GRID_HEAD_H, width: GRID_CELL_W, height: GRID_HEAD_H, color: rgb(0.94, 0.94, 0.94), ...border });
        txt(label, cx + (GRID_CELL_W - fontBold.widthOfTextAtSize(label, 10)) / 2, y - GRID_HEAD_H + 6, 10, fontBold);
        page.drawRectangle({ x: cx, y: y - GRID_HEAD_H - markH, width: GRID_CELL_W, height: markH, ...border });
        const font = bold ? fontBold : fontReg;
        txt(marksLabel, cx + GRID_CELL_W - 6 - font.widthOfTextAtSize(marksLabel, 10), y - GRID_HEAD_H - markH + 6, 10, font, rgb(0.3, 0.3, 0.3));
      };
      rows.forEach((row, ri) => {
        row.forEach((c, i) => cell(MARGIN + i * GRID_CELL_W, c.label, `/${c.marks}`, false));
        if (ri === rows.length - 1) cell(MARGIN + row.length * GRID_CELL_W, 'Sum', `/${totalMarks}`, true);
        y -= GRID_HEAD_H + markH + GRID_ROW_GAP;
      });
    }
  }

  // ─── DOCX Generation ──────────────────────────────────────────────────────
  async function buildDocx(items, s, type, totalMarks) {
    const {
      Document, Packer, Paragraph, TextRun, ImageRun,
      AlignmentType, WidthType, TableRow, TableCell, Table,
      BorderStyle, HeightRule, VerticalAlign
    } = window.docx;

    // A4 page dimensions in twips (1 inch = 1440 twips)
    // A4 = 8.268 × 11.693 inches
    const A4_W_TWIPS  = 11906;  // 8.268 in × 1440
    const A4_H_TWIPS  = 16838;  // 11.693 in × 1440
    const MARGIN_TWIPS = 1134;  // ~2 cm (0.787 in × 1440)
    // Image width in pixels (docx ImageRun uses px at 96 DPI)
    // Usable width = (8.268 - 2×0.787) in = 6.694 in = 643 px
    const IMG_PX      = 643;
    // Tallest an image may be and still share a page with the "Question N" line (usable height 971 px)
    const IMG_MAX_H   = 900;
    const sizes = await loadSizes(items, type);

    const sections = [];

    // Cover sheet
    if (s.coverSheet && type === 'questions') {
      const children = buildDocxCover(s, totalMarks, items, { Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, AlignmentType, WidthType, BorderStyle, HeightRule, VerticalAlign });
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
          const size = sizes.get(images[ii]);
          if (!size || size.missing) throw new Error('missing');
          const dataUrl = await fetchImageAsPng(images[ii], maskRegions, ii === 0 && s.hideNumbers !== false);
          const base64  = dataUrl.split(',')[1];
          const binaryStr = atob(base64);
          const bytes = new Uint8Array(binaryStr.length);
          for (let b = 0; b < binaryStr.length; b++) bytes[b] = binaryStr.charCodeAt(b);

          // Full width at the image's own proportions; a very tall one shrinks to fit the page.
          const fit = Math.min(1, IMG_MAX_H / (IMG_PX * size.h / size.w));
          children.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new ImageRun({
              data: bytes,
              transformation: { width: Math.round(IMG_PX * fit), height: Math.round(IMG_PX * fit * size.h / size.w) }
            })]
          }));
        } catch (_) {
          children.push(new Paragraph({ children: [new TextRun({ text: '[Image unavailable]', color: 'FF0000' })] }));
        }
      }

      // Work space
      if (wantsWork(q, s, type)) {
        // Word joins neighbouring paragraphs with identical borders into one box, so the
        // rules alternate between two near-identical greys to keep a line under each.
        const rule = l => ({ bottom: { style: BorderStyle.SINGLE, size: 4, color: l % 2 ? 'CCCCCC' : 'CDCDCD', space: 1 } });
        for (let w = 0; w < s.workSpacePages; w++) {
          children.push(new Paragraph({ children: [new TextRun({ text: workLabel(qi), bold: true, color: 'AAAAAA', size: 18 })], pageBreakBefore: true }));
          if (s.workSpaceStyle === 'lined') {
            for (let l = 0; l < 22; l++) children.push(new Paragraph({ children: [new TextRun({ text: '', size: 20 })], border: rule(l), spacing: { before: 320 } }));
          }
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

  function buildDocxCover(s, totalMarks, items, { Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, AlignmentType, WidthType, BorderStyle, HeightRule, VerticalAlign }) {
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
    const instrs = instructionsOf(s);

    if (instrs.length) {
      paras.push(new Paragraph({ children: [new TextRun({ text: 'Instructions to candidates:', bold: true, size: 22 })], spacing: { before: 160, after: 80 } }));
      instrs.forEach(instr => paras.push(new Paragraph({
        children: [new TextRun({ text: instr, size: 20 })],
        bullet: { level: 0 },
        spacing: { after: 60 }
      })));
    }

    // The teacher's own text
    customLines(s).forEach((l, i) => paras.push(new Paragraph({ children: [new TextRun({ text: l, size: 22 })], spacing: { before: i ? 0 : 160, after: 40 } })));

    // Marks grid
    if (s.showMarksGrid && items.length > 0) {
      paras.push(new Paragraph({ children: [new TextRun({ text: '─── To be filled out by teacher ───', size: 18, color: '888888' })], alignment: AlignmentType.CENTER, spacing: { before: 240, after: 120 } }));

      const edge = { style: BorderStyle.SINGLE, size: 6, color: '777777' };
      const borders = { top: edge, bottom: edge, left: edge, right: edge };
      const CELL_W = 1070;   // twips: nine boxes across the page
      const cellOf = (text, o) => new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text, bold: o.bold, size: 22, color: o.color })], alignment: o.align })],
        borders, verticalAlign: o.valign, width: { size: CELL_W, type: WidthType.DXA },
        shading: o.fill ? { fill: o.fill } : undefined,
        margins: { top: 40, bottom: 40, left: 80, right: 100 },
      });
      const head = text => cellOf(text, { bold: true, align: AlignmentType.CENTER, valign: VerticalAlign.CENTER, fill: 'F0F0F0' });
      const mark = (text, bold) => cellOf(text, { bold, align: AlignmentType.RIGHT, valign: VerticalAlign.BOTTOM, color: '444444' });

      // Rows of at most 8 boxes, each with room to write a mark in.
      const rows = gridRows(items);
      rows.forEach((row, ri) => {
        const last = ri === rows.length - 1;
        const heads = row.map(c => head(c.label));
        const marks = row.map(c => mark(`/${c.marks}`, false));
        if (last) { heads.push(head('Sum')); marks.push(mark(`/${totalMarks}`, true)); }
        if (ri) paras.push(new Paragraph({ children: [], spacing: { after: 60 } }));
        paras.push(new Table({
          rows: [
            new TableRow({ children: heads, height: { value: 400, rule: HeightRule.ATLEAST } }),
            new TableRow({ children: marks, height: { value: 680, rule: HeightRule.ATLEAST } }),
          ],
          columnWidths: heads.map(() => CELL_W),
          width: { size: CELL_W * heads.length, type: WidthType.DXA },
        }));
      });
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
