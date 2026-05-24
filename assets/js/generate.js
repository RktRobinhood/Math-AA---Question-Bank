/* generate.js — AASL Output Generator
   Handles the generate modal, cover sheet editor, and PDF/DOCX export.
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
  };

  function loadSettings() {
    try {
      const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      return Object.assign({}, DEFAULT_SETTINGS, stored);
    } catch (_) { return Object.assign({}, DEFAULT_SETTINGS); }
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

  // ─── Modal ────────────────────────────────────────────────────────────────
  let modalEl = null;
  let _logoDataUrl = null; // base64 PNG data URL of uploaded logo (set at modal open)
  let _logoW = 0, _logoH = 0; // natural pixel dims of loaded logo

  function openModal() {
    if (!window.AASL_BASKET || window.AASL_BASKET.count() === 0) return;
    const s = loadSettings();
    // Auto-set today's date if empty
    if (!s.testDate) s.testDate = new Date().toISOString().slice(0, 10);
    // Auto-set calculator text based on basket
    s.instrCalculatorText = calcNote();

    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.id = 'aasl-modal';
      document.body.appendChild(modalEl);
      modalEl.addEventListener('click', e => {
        if (e.target === modalEl) closeModal();
      });
    }
    // Load logo state from settings into module vars
    _logoDataUrl = s.logoDataUrl || null;
    _logoW = s.logoW || 0;
    _logoH = s.logoH || 0;

    modalEl.innerHTML = buildModalHtml(s);
    modalEl.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    wireModal(s);
  }

  function closeModal() {
    if (!modalEl) return;
    modalEl.style.display = 'none';
    document.body.style.overflow = '';
  }

  window.AASL_GENERATE = openModal;

  // ─── Calculator auto-detect ───────────────────────────────────────────────
  function calcNote() {
    const items = window.AASL_BASKET.getAll();
    const papers = new Set(items.map(q => q.paper));
    if (papers.size === 1) {
      if (papers.has('P1')) return 'You are not permitted access to any calculator for this paper.';
      if (papers.has('P2')) return 'A graphic display calculator is required for this paper.';
    }
    return 'Check individual questions for calculator guidance (mixed P1/P2 paper).';
  }

  // ─── Modal HTML ───────────────────────────────────────────────────────────
  function buildModalHtml(s) {
    const items = window.AASL_BASKET.getAll();
    const marks = items.reduce((t, q) => t + (q.marks || 0), 0);
    const timeMin = Math.ceil(marks / 80 * 90 / 5) * 5;

    const hasB = items.some(q => q.section === 'B');

    return `
    <div class="aasl-modal-box">
      <div class="aasl-modal-header">
        <h2>Generate Output</h2>
        <button class="aasl-modal-close" id="aasl-modal-close">×</button>
      </div>
      <div class="aasl-modal-scroll">

        <!-- 1. Content -->
        <section class="aasl-modal-section">
          <div class="aasl-modal-section-title">Content</div>
          <label class="aasl-check-row">
            <input type="checkbox" id="gen-questions" ${s.includeQuestions ? 'checked' : ''}>
            <span>Questions <span class="aasl-modal-hint">(${items.length} questions · ${marks} marks)</span></span>
          </label>
          <label class="aasl-check-row">
            <input type="checkbox" id="gen-markscheme" ${s.includeMarkscheme ? 'checked' : ''}>
            <span>Mark scheme <span class="aasl-modal-hint">(separate file)</span></span>
          </label>
        </section>

        <!-- 2. Cover sheet -->
        <section class="aasl-modal-section">
          <label class="aasl-check-row aasl-check-row--bold">
            <input type="checkbox" id="gen-cover" ${s.coverSheet ? 'checked' : ''}>
            <span>Cover sheet</span>
          </label>
          <div id="gen-cover-editor" class="${s.coverSheet ? '' : 'aasl-hidden'}">

            <div class="aasl-cover-grid">
              <!-- School / branding -->
              <div class="aasl-cover-field">
                <label class="aasl-field-label">
                  <input type="checkbox" id="cs-show-school" ${s.showSchoolName ? 'checked' : ''}>
                  School name
                </label>
                <input type="text" id="cs-school" value="${escHtml(s.schoolName)}" placeholder="e.g. Westgate Academy" ${s.showSchoolName ? '' : 'disabled'}>
              </div>

              <div class="aasl-cover-field">
                <label class="aasl-field-label">
                  <input type="checkbox" id="cs-show-logo" ${s.showLogo ? 'checked' : ''}>
                  Logo
                </label>
                <div id="cs-logo-wrap" style="${s.showLogo ? '' : 'opacity:0.45;pointer-events:none'}">
                  ${s.logoDataUrl
                    ? `<div id="cs-logo-preview" class="aasl-logo-preview">
                         <img src="${s.logoDataUrl}" alt="Logo preview" style="max-height:40px;max-width:120px;object-fit:contain;border:1px solid #ddd;padding:2px;border-radius:3px;vertical-align:middle;">
                         <button type="button" id="cs-logo-clear" style="margin-left:8px;font-size:11px;color:#c00;background:none;border:none;cursor:pointer;vertical-align:middle;">Remove</button>
                       </div>`
                    : `<label id="cs-logo-preview" style="display:inline-block;cursor:pointer;font-size:12px;color:#555;background:#f5f5f5;border:1px dashed #aaa;padding:5px 10px;border-radius:4px;">
                         Upload logo…
                         <input type="file" id="cs-logo-file" accept="image/*" style="display:none">
                       </label>`
                  }
                </div>
              </div>

              <div class="aasl-cover-field">
                <label class="aasl-field-label">
                  <input type="checkbox" id="cs-show-teacher" ${s.showTeacherName ? 'checked' : ''}>
                  Teacher name
                </label>
                <input type="text" id="cs-teacher" value="${escHtml(s.teacherName)}" placeholder="e.g. Mr Smith" ${s.showTeacherName ? '' : 'disabled'}>
              </div>

              <div class="aasl-cover-field">
                <label class="aasl-field-label">
                  <input type="checkbox" id="cs-show-class" ${s.showClassCode ? 'checked' : ''}>
                  Class / code
                </label>
                <input type="text" id="cs-class" value="${escHtml(s.classCode)}" placeholder="e.g. 12A Math AA SL" ${s.showClassCode ? '' : 'disabled'}>
              </div>

              <!-- Core fields -->
              <div class="aasl-cover-field aasl-cover-field--wide">
                <label class="aasl-field-label">Title</label>
                <input type="text" id="cs-title" value="${escHtml(s.title)}">
              </div>

              <div class="aasl-cover-field">
                <label class="aasl-field-label">Test date</label>
                <input type="date" id="cs-date" value="${s.testDate}">
              </div>

              <div class="aasl-cover-field">
                <label class="aasl-field-label">
                  <input type="checkbox" id="cs-show-time" ${s.showTimeAllowed ? 'checked' : ''}>
                  Time allowed (min)
                </label>
                <input type="number" id="cs-time" value="${timeMin}" min="1" ${s.showTimeAllowed ? '' : 'disabled'}>
              </div>

              <div class="aasl-cover-field">
                <label class="aasl-field-label">
                  <input type="checkbox" id="cs-show-marks" ${s.showTotalMarks ? 'checked' : ''}>
                  Total marks
                </label>
                <input type="number" id="cs-total-marks" value="${marks}" min="1" readonly ${s.showTotalMarks ? '' : 'disabled'}>
              </div>

              <!-- Name / date lines -->
              <div class="aasl-cover-field">
                <label class="aasl-check-row">
                  <input type="checkbox" id="cs-show-nameline" ${s.showNameLine ? 'checked' : ''}>
                  <span>Name line</span>
                </label>
              </div>
              <div class="aasl-cover-field">
                <label class="aasl-check-row">
                  <input type="checkbox" id="cs-show-dateline" ${s.showDateLine ? 'checked' : ''}>
                  <span>Date line</span>
                </label>
              </div>
            </div>

            <!-- Instructions -->
            <div class="aasl-modal-section-title" style="margin-top:14px;">Instructions to candidates</div>
            ${instrRow('cs-instr-calc',   s.instrCalculator,  s.instrCalculatorText)}
            ${instrRow('cs-instr-ans',    s.instrAnswerSpace, s.instrAnswerSpaceText)}
            ${instrRow('cs-instr-work',   s.instrShowWork,    s.instrShowWorkText)}
            ${instrRow('cs-instr-sigfig', s.instrSigFig,      s.instrSigFigText)}
            ${instrRow('cs-instr-form',   s.instrFormula,     s.instrFormulaText)}

            <!-- Marks grid -->
            <label class="aasl-check-row" style="margin-top:10px;">
              <input type="checkbox" id="cs-show-grid" ${s.showMarksGrid ? 'checked' : ''}>
              <span>Marks grid <span class="aasl-modal-hint">(to be filled out by teacher)</span></span>
            </label>

          </div>
        </section>

        <!-- 3. Page options -->
        <section class="aasl-modal-section">
          <div class="aasl-modal-section-title">Page options</div>
          <label class="aasl-check-row">
            <input type="checkbox" id="gen-pagenums" ${s.showPageNumbers ? 'checked' : ''}>
            <span>Page X of Y footer</span>
          </label>
          ${hasB ? `
          <label class="aasl-check-row" style="margin-top:6px;">
            <input type="checkbox" id="gen-workspace" ${s.workSpace ? 'checked' : ''}>
            <span>Add work space pages after Section B questions</span>
          </label>
          <div id="gen-workspace-count" class="aasl-workspace-row ${s.workSpace ? '' : 'aasl-hidden'}">
            <label>Blank pages per question:
              <input type="number" id="gen-workspace-n" value="${s.workSpacePages}" min="1" max="4" style="width:60px;">
            </label>
          </div>` : ''}
        </section>

        <!-- 4. Format -->
        <section class="aasl-modal-section">
          <div class="aasl-modal-section-title">Format</div>
          <div class="aasl-format-row">
            <button class="aasl-format-btn ${s.format === 'pdf' ? 'aasl-format-btn--active' : ''}" data-fmt="pdf">PDF</button>
            <button class="aasl-format-btn ${s.format === 'docx' ? 'aasl-format-btn--active' : ''}" data-fmt="docx">Word (.docx)</button>
          </div>
        </section>

      </div><!-- .aasl-modal-scroll -->

      <div class="aasl-modal-footer">
        <span id="aasl-gen-status" class="aasl-gen-status"></span>
        <button class="aasl-modal-cancel" id="aasl-modal-cancel">Cancel</button>
        <button class="aasl-modal-download" id="aasl-modal-download">⬇ Download</button>
      </div>
    </div>`;
  }

  function instrRow(id, checked, text) {
    return `<div class="aasl-instr-row">
      <input type="checkbox" id="${id}-check" ${checked ? 'checked' : ''}>
      <input type="text" id="${id}-text" value="${escHtml(text)}" ${checked ? '' : 'disabled'} style="flex:1">
    </div>`;
  }

  // ─── Wire modal events ────────────────────────────────────────────────────
  function wireModal(s) {
    const $ = id => document.getElementById(id);

    $('aasl-modal-close').onclick = closeModal;
    $('aasl-modal-cancel').onclick = closeModal;

    // Cover sheet toggle
    $('gen-cover').onchange = function () {
      $('gen-cover-editor').classList.toggle('aasl-hidden', !this.checked);
    };

    // Work space toggle
    const wsEl = $('gen-workspace');
    const wsCount = $('gen-workspace-count');
    if (wsEl && wsCount) {
      wsEl.onchange = function () {
        wsCount.classList.toggle('aasl-hidden', !this.checked);
      };
    }

    // Logo checkbox — toggles opacity/pointer-events on the whole wrap div
    const logoChk  = $('cs-show-logo');
    const logoWrap = $('cs-logo-wrap');
    if (logoChk && logoWrap) {
      logoChk.onchange = () => {
        logoWrap.style.opacity       = logoChk.checked ? '' : '0.45';
        logoWrap.style.pointerEvents = logoChk.checked ? '' : 'none';
      };
    }

    // Logo file picker + clear button (re-wired after DOM swap)
    function wireLogoControls() {
      const fileInput = $('cs-logo-file');
      const clearBtn  = $('cs-logo-clear');
      if (fileInput) {
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
              // Swap placeholder for preview
              const prev = $('cs-logo-preview');
              if (prev) {
                prev.outerHTML = `<div id="cs-logo-preview" class="aasl-logo-preview">
                  <img src="${_logoDataUrl}" alt="Logo preview" style="max-height:40px;max-width:120px;object-fit:contain;border:1px solid #ddd;padding:2px;border-radius:3px;vertical-align:middle;">
                  <button type="button" id="cs-logo-clear" style="margin-left:8px;font-size:11px;color:#c00;background:none;border:none;cursor:pointer;vertical-align:middle;">Remove</button>
                </div>`;
                wireLogoControls();
              }
            };
            img.onerror = () => alert('Could not load that image. Please try a different file.');
            img.src = ev.target.result;
          };
          reader.readAsDataURL(file);
        };
      }
      if (clearBtn) {
        clearBtn.onclick = () => {
          _logoDataUrl = null;
          _logoW = 0;
          _logoH = 0;
          const prev = $('cs-logo-preview');
          if (prev) {
            prev.outerHTML = `<label id="cs-logo-preview" style="display:inline-block;cursor:pointer;font-size:12px;color:#555;background:#f5f5f5;border:1px dashed #aaa;padding:5px 10px;border-radius:4px;">
              Upload logo…
              <input type="file" id="cs-logo-file" accept="image/*" style="display:none">
            </label>`;
            wireLogoControls();
          }
        };
      }
    }
    wireLogoControls();

    // Enable/disable text inputs when their checkbox toggles
    [
      ['cs-show-school',   'cs-school'],
      ['cs-show-teacher',  'cs-teacher'],
      ['cs-show-class',    'cs-class'],
      ['cs-show-time',     'cs-time'],
      ['cs-show-marks',    'cs-total-marks'],
      ['cs-instr-calc-check',   'cs-instr-calc-text'],
      ['cs-instr-ans-check',    'cs-instr-ans-text'],
      ['cs-instr-work-check',   'cs-instr-work-text'],
      ['cs-instr-sigfig-check', 'cs-instr-sigfig-text'],
      ['cs-instr-form-check',   'cs-instr-form-text'],
    ].forEach(([cbId, inputId]) => {
      const cb = $(cbId), inp = $(inputId);
      if (cb && inp) cb.onchange = () => { inp.disabled = !cb.checked; };
    });

    // Format buttons
    modalEl.querySelectorAll('.aasl-format-btn').forEach(btn => {
      btn.onclick = () => {
        modalEl.querySelectorAll('.aasl-format-btn').forEach(b => b.classList.remove('aasl-format-btn--active'));
        btn.classList.add('aasl-format-btn--active');
      };
    });

    // Download
    $('aasl-modal-download').onclick = () => doGenerate();
  }

  // ─── Collect settings from modal ─────────────────────────────────────────
  function collectSettings() {
    const $ = id => document.getElementById(id);
    const chk = id => { const el = $(id); return el ? el.checked : false; };
    const val = id => { const el = $(id); return el ? el.value : ''; };
    const num = id => { const el = $(id); return el ? parseInt(el.value, 10) : 1; };
    const activeFmt = modalEl.querySelector('.aasl-format-btn--active');

    const s = {
      includeQuestions:  chk('gen-questions'),
      includeMarkscheme: chk('gen-markscheme'),
      format:            activeFmt ? activeFmt.dataset.fmt : 'pdf',
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
      workSpace:         chk('gen-workspace'),    workSpacePages: num('gen-workspace-n') || 1,
      showPageNumbers:   chk('gen-pagenums'),
    };
    saveSettings(s);
    return s;
  }

  // ─── Generate ─────────────────────────────────────────────────────────────
  async function doGenerate() {
    const s = collectSettings();
    if (!s.includeQuestions && !s.includeMarkscheme) {
      alert('Please select at least one content type (Questions or Mark scheme).');
      return;
    }

    const dlBtn = document.getElementById('aasl-modal-download');
    const status = document.getElementById('aasl-gen-status');
    dlBtn.disabled = true;
    status.textContent = 'Loading libraries…';

    try {
      if (s.format === 'pdf') {
        await loadScript(PDF_LIB_CDN);
        if (!window.PDFLib) throw new Error('pdf-lib failed to load');
        const items = window.AASL_BASKET.getAll();
        const marks = items.reduce((t, q) => t + (q.marks || 0), 0);

        if (s.includeQuestions) {
          status.textContent = 'Building questions PDF…';
          const pdfBytes = await buildPdf(items, s, 'questions', marks);
          downloadBlob(pdfBytes, 'application/pdf', pdfFilename(s, marks, 'pdf', false));
        }
        if (s.includeMarkscheme) {
          status.textContent = 'Building mark scheme PDF…';
          const pdfBytes = await buildPdf(items, s, 'markscheme', marks);
          downloadBlob(pdfBytes, 'application/pdf', pdfFilename(s, marks, 'pdf', true));
        }
      } else {
        await loadScript(DOCX_CDN);
        if (!window.docx) throw new Error('docx.js failed to load');
        const items = window.AASL_BASKET.getAll();
        const marks = items.reduce((t, q) => t + (q.marks || 0), 0);

        if (s.includeQuestions) {
          status.textContent = 'Building questions DOCX…';
          const blob = await buildDocx(items, s, 'questions', marks);
          downloadBlob(await blob.arrayBuffer(), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', pdfFilename(s, marks, 'docx', false));
        }
        if (s.includeMarkscheme) {
          status.textContent = 'Building mark scheme DOCX…';
          const blob = await buildDocx(items, s, 'markscheme', marks);
          downloadBlob(await blob.arrayBuffer(), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', pdfFilename(s, marks, 'docx', true));
        }
      }
      status.textContent = '✓ Done!';
      setTimeout(() => { status.textContent = ''; dlBtn.disabled = false; }, 2500);
    } catch (err) {
      console.error('Generate error:', err);
      status.textContent = '⚠ Error: ' + err.message;
      dlBtn.disabled = false;
    }
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

  function getMaskRegions(questionId, type) {
    const masks = window.AASL_MASKS;
    if (!masks || !masks[questionId]) return [];
    const entry = masks[questionId][type]; // 'paper' or 'markscheme'
    if (!entry || !entry[0]) return [];
    return entry[0].regions || [];
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
        const maskRegions = ii === 0 ? getMaskRegions(q.id, type === 'questions' ? 'paper' : 'markscheme') : [];

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
        const maskRegions = ii === 0 ? getMaskRegions(q.id, type === 'questions' ? 'paper' : 'markscheme') : [];
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
