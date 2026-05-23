(function () {
  if (typeof PRACTICE_TEMPLATES === 'undefined') return;

  const $ = id => document.getElementById(id);
  const siteData = window.AASL_DATA || { questions: [], topics: {} };
  const TEMPLATES = PRACTICE_TEMPLATES;
  const questionLookup = Object.fromEntries((siteData.questions || []).map(q => [q.id, q]));
  const heatMap = typeof TEMPLATE_HEAT !== 'undefined' ? TEMPLATE_HEAT : {};
  const matchMap = typeof TEMPLATE_MATCHES !== 'undefined' ? TEMPLATE_MATCHES : {};
  const total = typeof TOTAL_SITTINGS !== 'undefined' ? TOTAL_SITTINGS : 9;
  let activeTemplateId = null;

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  function unique(values) {
    return [...new Set(values.filter(Boolean))];
  }

  function topicLabel(topic) {
    return `Topic ${topic}: ${(siteData.topics && siteData.topics[String(topic)]) || ''}`.trim();
  }

  function templatePrefixes(tmpl) {
    if (Array.isArray(tmpl.syllabusRefs) && tmpl.syllabusRefs.length) return tmpl.syllabusRefs;
    return String(tmpl.syllabus || '').split(',').map(s => s.trim()).filter(Boolean);
  }

  function buildSyllabusLabels() {
    const labels = new Map();
    const wanted = new Set(TEMPLATES.flatMap(templatePrefixes));
    (siteData.questions || []).forEach(q => {
      (q.syllabus || []).forEach(entry => {
        wanted.forEach(prefix => {
          if (String(entry).startsWith(prefix) && !labels.has(prefix)) labels.set(prefix, entry);
        });
      });
    });
    wanted.forEach(prefix => {
      if (!labels.has(prefix)) labels.set(prefix, prefix);
    });
    return labels;
  }

  function fillSelect(id, allLabel, values, labelFor) {
    const el = $(id);
    if (!el) return;
    const current = el.value || 'all';
    el.innerHTML = `<option value="all">${esc(allLabel)}</option>` + values.map(value => {
      const label = labelFor ? labelFor(value) : value;
      return `<option value="${esc(value)}">${esc(label)}</option>`;
    }).join('');
    if ([...el.options].some(opt => opt.value === current)) el.value = current;
  }

  function populateFilters() {
    const labels = buildSyllabusLabels();
    const prefixes = [...labels.keys()].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const difficulties = ['Core', 'Exam', 'Challenge'].filter(d => TEMPLATES.some(t => t.difficulty === d));
    const types = unique(TEMPLATES.map(t => t.questionType)).sort();

    ['filter-syllabus', 'practice-syllabus', 'worksheet-syllabus'].forEach(id => {
      fillSelect(id, 'All subtopics', prefixes, value => labels.get(value));
    });
    ['filter-difficulty', 'worksheet-difficulty'].forEach(id => {
      fillSelect(id, 'All difficulties', difficulties);
    });
    ['filter-type', 'worksheet-type'].forEach(id => {
      fillSelect(id, 'All question types', types);
    });
  }

  function choiceMatches(value, choice) {
    if (choice === 'all') return true;
    return value === choice;
  }

  function readFilters(prefix, topicFromButtons) {
    const topic = topicFromButtons
      ? (document.querySelector('.topic-btn.active')?.dataset.topic || 'all')
      : ($(prefix + '-topic')?.value || 'all');
    return {
      search: ($(prefix + '-search')?.value || '').trim().toLowerCase(),
      topic,
      syllabus: ($(prefix + '-syllabus')?.value || 'all'),
      section: ($(prefix + '-section')?.value || 'all'),
      paper: ($(prefix + '-paper')?.value || 'all'),
      difficulty: ($(prefix + '-difficulty')?.value || 'all'),
      type: ($(prefix + '-type')?.value || 'all')
    };
  }

  function templatePasses(tmpl, filters) {
    const blob = tmpl.searchBlob || [
      tmpl.id, tmpl.title, tmpl.desc, tmpl.syllabus, tmpl.topicName,
      tmpl.section, tmpl.paper, tmpl.difficulty, tmpl.questionType,
      ...(tmpl.skills || [])
    ].join(' ').toLowerCase();

    if (filters.search && !blob.includes(filters.search)) return false;
    if (filters.topic !== 'all' && String(tmpl.topic) !== filters.topic) return false;
    if (filters.syllabus !== 'all') {
      const prefixes = templatePrefixes(tmpl);
      const selected = Array.isArray(filters.syllabus) ? filters.syllabus : [filters.syllabus];
      if (!selected.some(s => prefixes.includes(s))) return false;
    }
    if (!choiceMatches(tmpl.section || 'Mixed', filters.section)) return false;
    if (!choiceMatches(tmpl.paper || 'Mixed', filters.paper)) return false;
    if (filters.difficulty !== 'all' && tmpl.difficulty !== filters.difficulty) return false;
    if (filters.type !== 'all' && tmpl.questionType !== filters.type) return false;
    return true;
  }

  function filteredTemplates(filters) {
    return TEMPLATES.filter(t => templatePasses(t, filters)).sort((a, b) => {
      if (a.topic !== b.topic) return a.topic - b.topic;
      const h = (heatMap[b.id] || 0) - (heatMap[a.id] || 0);
      return h || String(a.syllabus).localeCompare(String(b.syllabus), undefined, { numeric: true });
    });
  }

  function templateMeta(tmpl) {
    return [
      `Section ${tmpl.section || 'Mixed'}`,
      tmpl.paper || 'Mixed',
      tmpl.difficulty || 'Core',
      tmpl.questionType || 'Short response',
      tmpl.variantMix ? `${tmpl.variantMix.length} weighted variants` : ''
    ].filter(Boolean);
  }

  function templateWeight(tmpl) {
    return Math.max(1, Number(tmpl.examWeight) || Number(tmpl.matchCount) || heatMap[tmpl.id] || 1);
  }

  function renderGrid() {
    const grid = $('template-grid');
    if (!grid) return;
    const visible = filteredTemplates(readFilters('filter', true));
    grid.innerHTML = '';

    if ($('filter-count')) {
      $('filter-count').textContent = `Showing ${visible.length} of ${TEMPLATES.length} templates`;
    }

    if (!visible.length) {
      grid.innerHTML = '<div class="empty-state">No templates match the current filters.</div>';
      return;
    }

    visible.forEach(tmpl => {
      const heat = heatMap[tmpl.id] || 0;
      const matches = (matchMap[tmpl.id] || []).slice(0, 8);
      const heatPct = total ? Math.min(100, heat / total * 100) : 0;
      const heatClass = heatPct >= 80 ? 'hot' : heatPct >= 40 ? 'warm' : 'cold';
      const heatColor = heatPct >= 80 ? 'var(--green)' : heatPct >= 40 ? 'var(--accent)' : 'var(--muted)';
      const exampleLinks = matches.length ? matches.map(m => {
        const q = questionLookup[m.id];
        const label = q ? q.title : m.id;
        const url = q ? q.url : '#';
        return `<a class="example-link" href="${esc(url)}">
          <span>${esc(label)}</span>
          <span class="marks-chip">${esc(m.marks)}m</span>
        </a>`;
      }).join('') : '<div class="example-link"><span>No direct historical matches yet</span><span class="marks-chip">new</span></div>';

      const card = document.createElement('div');
      card.className = 'template-card';
      card.dataset.topic = tmpl.topic;
      card.innerHTML = `
        <div class="template-header">
          <span class="syllabus-badge">${esc(tmpl.syllabus)}</span>
          <span class="template-title">${esc(tmpl.title)}</span>
          <span class="marks-badge">~${esc(tmpl.marks)}m</span>
        </div>
        <p class="template-desc">${esc(tmpl.desc)}</p>
        <div class="template-meta">
          ${templateMeta(tmpl).map(item => `<span>${esc(item)}</span>`).join('')}
        </div>
        <div class="heat-row">
          <span class="heat-label">Frequency</span>
          <div class="heat-bar-track">
            <div class="heat-bar-fill ${heatClass}" style="width:${heatPct}%"></div>
          </div>
          <span class="heat-count" style="color:${heatColor}">${heat}/${total} sittings</span>
        </div>
        <div class="template-actions">
          <button class="btn-outline toggle-ex-btn" type="button">Real examples (${matches.length})</button>
          <button class="btn-primary practice-from-map" type="button" data-id="${esc(tmpl.id)}">Practice</button>
        </div>
        <div class="examples-list">${exampleLinks}</div>
      `;

      card.querySelector('.toggle-ex-btn').addEventListener('click', event => {
        const list = card.querySelector('.examples-list');
        list.classList.toggle('open');
        event.currentTarget.textContent = list.classList.contains('open') ? 'Hide examples' : `Real examples (${matches.length})`;
      });
      card.querySelector('.practice-from-map').addEventListener('click', () => {
        activateTab('practice');
        selectTemplate(tmpl.id);
      });
      grid.appendChild(card);
    });
  }

  function renderSelector() {
    const list = $('selector-list');
    if (!list) return;
    const visible = filteredTemplates(readFilters('practice', false));
    list.innerHTML = '';

    if (!visible.length) {
      list.innerHTML = '<div class="empty-state">No templates match.</div>';
      return;
    }

    const byTopic = {};
    visible.forEach(t => {
      if (!byTopic[t.topic]) byTopic[t.topic] = [];
      byTopic[t.topic].push(t);
    });

    Object.entries(byTopic).sort(([a], [b]) => +a - +b).forEach(([topic, templates]) => {
      const heading = document.createElement('div');
      heading.style.cssText = 'font-size:.72rem;color:var(--faint);text-transform:uppercase;letter-spacing:.04em;padding:10px 10px 4px;font-weight:700;';
      heading.textContent = topicLabel(topic);
      list.appendChild(heading);

      templates.forEach(t => {
        const item = document.createElement('div');
        item.className = 'selector-item';
        if (typeof activeTemplateId !== 'undefined' && activeTemplateId === t.id) item.classList.add('active');
        item.dataset.id = t.id;
        item.innerHTML = `<span class="selector-badge">${esc(t.syllabus)}</span><span>${esc(t.title)}</span>`;
        item.addEventListener('click', () => selectTemplate(t.id));
        list.appendChild(item);
      });
    });
  }

  function activateTab(name) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === name);
    });
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === 'tab-' + name);
    });
    renderMath();
  }

  function renderMath() {
    if (!window.renderMathInElement) return;
    renderMathInElement(document.body, {
      delimiters: [
        { left: '$', right: '$', display: false },
        { left: '\\[', right: '\\]', display: true }
      ],
      throwOnError: false
    });
  }

  function selectTemplate(id) {
    activeTemplateId = id;
    document.querySelectorAll('.selector-item').forEach(el => {
      el.classList.toggle('active', el.dataset.id === id);
    });
    generateQuestion(id);
  }

  function partHtml(parts) {
    const safeParts = Array.isArray(parts) ? parts : [];
    if (safeParts.length === 1 && !safeParts[0].label) {
      const p = safeParts[0];
      return `<div class="q-part">${p.instr}<span class="q-part-marks">[${p.marks} marks]</span></div>`;
    }
    return safeParts.map((p, i) => `
      <div class="q-part">
        <span class="q-part-label">(${String.fromCharCode(97 + i)})</span>${p.instr}
        <span class="q-part-marks">[${p.marks} marks]</span>
      </div>
    `).join('');
  }

  function generateQuestion(id) {
      const tmpl = TEMPLATES.find(t => t.id === id);
      if (!tmpl) return;
      let q;
      try {
        q = tmpl.generate();
      } catch (error) {
        console.error(error);
        return;
      }

      const area = $('practice-area');
      const working = Array.isArray(q.working) ? q.working : [];
      area.innerHTML = `
        <div class="q-meta">
          <span class="q-meta-tag syllabus">${esc(tmpl.syllabus)} - ${esc(tmpl.title)}</span>
          <span class="q-meta-tag marks">${esc(tmpl.marks)} marks</span>
          <span class="q-meta-tag marks">Section ${esc(tmpl.section || 'Mixed')}</span>
          <span class="q-meta-tag marks">${esc(tmpl.paper || 'Mixed')}</span>
          <span class="q-meta-tag fresh">Generated</span>
        </div>
        <div class="q-stem">${q.stem}</div>
        <div class="q-parts">${partHtml(q.parts)}</div>
        <div class="q-actions">
          <button class="btn-reveal answer" id="btn-ans" type="button">Show Answer</button>
          <button class="btn-reveal working" id="btn-work" type="button">Show Working</button>
          <button class="btn-new" id="btn-new" type="button">New Question</button>
        </div>
        <div class="reveal-box answer" id="box-ans">
          <div class="reveal-heading">Answer</div>
          <div>${q.answer}</div>
        </div>
        <div class="reveal-box working" id="box-work">
          <div class="reveal-heading">Worked Solution</div>
          ${working.map(s => `<div class="working-step">${s}</div>`).join('')}
        </div>
      `;

      $('btn-ans').addEventListener('click', event => {
        const box = $('box-ans');
        box.classList.toggle('open');
        event.currentTarget.textContent = box.classList.contains('open') ? 'Hide Answer' : 'Show Answer';
        renderMath();
      });
      $('btn-work').addEventListener('click', event => {
        const box = $('box-work');
        box.classList.toggle('open');
        event.currentTarget.textContent = box.classList.contains('open') ? 'Hide Working' : 'Show Working';
        renderMath();
      });
      $('btn-new').addEventListener('click', () => generateQuestion(id));
      renderMath();
  }

  function weightedPick(templates) {
    const totalWeight = templates.reduce((sum, t) => sum + templateWeight(t), 0);
    let target = Math.random() * totalWeight;
    for (const tmpl of templates) {
      target -= templateWeight(tmpl);
      if (target <= 0) return tmpl;
    }
    return templates[templates.length - 1];
  }

  function chooseRandomPractice() {
    const candidates = filteredTemplates(readFilters('practice', false));
    if (!candidates.length) return;
    selectTemplate(weightedPick(candidates).id);
  }

  function worksheetFilters() {
    const advanced = $('worksheet-advanced')?.checked;
    let syllabus = 'all';
    let topic = 'all';
    if (advanced) {
      const checked = [...document.querySelectorAll('#worksheet-multi-syllabus input[type="checkbox"]:checked')]
        .map(cb => cb.value);
      syllabus = checked.length ? checked : 'all';
    } else {
      topic = $('worksheet-topic')?.value || 'all';
      syllabus = $('worksheet-syllabus')?.value || 'all';
    }
    return {
      search: '',
      topic,
      syllabus,
      section: $('worksheet-section')?.value || 'all',
      paper: 'all',
      difficulty: $('worksheet-difficulty')?.value || 'all',
      type: $('worksheet-type')?.value || 'all'
    };
  }

  function buildMultiSyllabus() {
    const container = $('worksheet-multi-syllabus');
    if (!container) return;
    const labels = buildSyllabusLabels();
    const prefixes = [...labels.keys()].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const byTopic = {};
    prefixes.forEach(prefix => {
      const topic = prefix.split('.')[0];
      if (!byTopic[topic]) byTopic[topic] = [];
      byTopic[topic].push(prefix);
    });
    container.innerHTML = Object.entries(byTopic).sort(([a], [b]) => +a - +b).map(([topic, refs]) => `
      <div class="multi-syl-group">
        <div class="multi-syl-topic">${esc(topicLabel(topic))}</div>
        ${refs.map(ref => `
          <label class="multi-syl-item">
            <input type="checkbox" value="${esc(ref)}">
            <span class="multi-syl-ref">${esc(ref)}</span>
            <span class="multi-syl-name">${esc(labels.get(ref) || ref)}</span>
          </label>
        `).join('')}
      </div>
    `).join('');
  }

  function renderWorksheet() {
    const output = $('worksheet-output');
    if (!output) return;
    const filters = worksheetFilters();
    const candidates = filteredTemplates(filters);
    const requested = Math.max(1, Math.min(30, parseInt($('worksheet-count')?.value || '10', 10)));

    if (!candidates.length) {
      output.innerHTML = '<div class="empty-state">No templates match these worksheet filters.</div>';
      return;
    }

    const items = [];
    for (let i = 0; i < requested; i++) {
      const tmpl = weightedPick(candidates);
      try {
        items.push({ index: i + 1, tmpl, q: tmpl.generate() });
      } catch (error) {
        console.error(error);
      }
    }

    const includeAnswers = $('worksheet-answers')?.checked;
    const includeWorked = $('worksheet-worked')?.checked;
    const syllabusLabel = filters.syllabus === 'all'
      ? 'all subtopics'
      : Array.isArray(filters.syllabus)
        ? filters.syllabus.join(', ')
        : filters.syllabus;
    const summary = [
      filters.topic !== 'all' ? topicLabel(filters.topic) : 'All topics',
      syllabusLabel,
      filters.section !== 'all' ? `Section ${filters.section}` : 'any section',
      filters.difficulty !== 'all' ? filters.difficulty : 'any difficulty'
    ].join(' | ');

    output.innerHTML = `
      <div class="worksheet-doc">
        <h2>IB Math AA SL Practice Worksheet</h2>
        <p>${esc(summary)} | ${items.length} generated questions</p>
        <ol class="worksheet-list">
          ${items.map(item => `
            <li class="worksheet-question">
              <div class="q-meta">
                <span class="q-meta-tag syllabus">${esc(item.tmpl.syllabus)}</span>
                <span class="q-meta-tag marks">${esc(item.tmpl.marks)} marks</span>
                <span class="q-meta-tag marks">Section ${esc(item.tmpl.section || 'Mixed')}</span>
              </div>
              <div class="q-stem">${item.q.stem}</div>
              <div class="q-parts">${partHtml(item.q.parts)}</div>
            </li>
          `).join('')}
        </ol>
        ${includeAnswers ? `
          <div class="answer-key">
            <h3>Answer Key</h3>
            ${items.map(item => `
              <div class="answer-item">
                <strong>Question ${item.index}</strong>
                <div>${item.q.answer}</div>
                ${includeWorked ? `<div>${(item.q.working || []).map(step => `<div class="working-step">${step}</div>`).join('')}</div>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;

    renderMath();
  }

  function resetTemplateFilters() {
    if ($('filter-search')) $('filter-search').value = '';
    ['filter-syllabus', 'filter-section', 'filter-paper', 'filter-difficulty', 'filter-type'].forEach(id => {
      if ($(id)) $(id).value = 'all';
    });
    document.querySelectorAll('.topic-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.topic === 'all'));
    renderGrid();
  }

  function bindEvents() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => activateTab(btn.dataset.tab));
    });
    ['filter-search', 'filter-syllabus', 'filter-section', 'filter-paper', 'filter-difficulty', 'filter-type']
      .forEach(id => $(id)?.addEventListener(id === 'filter-search' ? 'input' : 'change', renderGrid));
    document.querySelectorAll('.topic-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.topic-btn').forEach(item => item.classList.remove('active'));
        btn.classList.add('active');
        renderGrid();
      });
    });
    $('reset-template-filters')?.addEventListener('click', resetTemplateFilters);

    ['practice-search', 'practice-topic', 'practice-syllabus', 'practice-section']
      .forEach(id => $(id)?.addEventListener(id === 'practice-search' ? 'input' : 'change', renderSelector));
    $('practice-random')?.addEventListener('click', chooseRandomPractice);

    $('worksheet-generate')?.addEventListener('click', renderWorksheet);

    $('worksheet-advanced')?.addEventListener('change', () => {
      const on = $('worksheet-advanced').checked;
      const basicFields = $('worksheet-basic-filters');
      const multiPanel = $('worksheet-multi-syllabus');
      const multiLabel = $('worksheet-multi-label');
      if (basicFields) basicFields.style.display = on ? 'none' : '';
      if (multiPanel) multiPanel.style.display = on ? 'block' : 'none';
      if (multiLabel) multiLabel.style.display = on ? 'block' : 'none';
    });
    $('worksheet-print')?.addEventListener('click', () => {
      activateTab('worksheet');
      if (!$('worksheet-output')?.querySelector('.worksheet-doc')) renderWorksheet();
      window.print();
    });
  }

  function menuGroup(label, links, href) {
    if (!links.length) {
      const a = document.createElement('a');
      a.className = 'site-menu-link';
      a.href = href || './';
      a.textContent = label;
      return a;
    }

    const wrap = document.createElement('div');
    wrap.className = 'menu-group';
    const btn = document.createElement('a');
    btn.className = 'site-menu-link';
    btn.href = href || './';
    btn.textContent = label;

    const sub = document.createElement('div');
    sub.className = 'submenu';
    links.forEach(([url, text]) => {
      const a = document.createElement('a');
      a.href = url;
      a.textContent = text;
      sub.appendChild(a);
    });

    wrap.appendChild(btn);
    wrap.appendChild(sub);
    return wrap;
  }

  function buildNav() {
    const nav = $('site-nav');
    if (!nav) return;
    const years = unique((siteData.questions || []).map(q => q.year)).sort((a, b) => b - a);
    nav.innerHTML = '';

    nav.appendChild(menuGroup('Question Bank', [
      ['question-bank/', 'Search all questions'],
      ...years.map(year => ['exams/' + year + '/', String(year)])
    ]));
    nav.appendChild(menuGroup('Statistics', [], './'));
    nav.appendChild(menuGroup('Syllabus', [
      ['syllabus/', 'All syllabus topics'],
      ...Object.entries(siteData.topics || {}).map(([topic, name]) => [
        'syllabus/topic-' + topic + '/',
        'Topic ' + topic + ': ' + name
      ])
    ]));

    const practice = document.createElement('a');
    practice.className = 'site-menu-link active';
    practice.href = 'practice.html';
    practice.textContent = 'Practice';
    nav.appendChild(practice);

    const formula = document.createElement('a');
    formula.className = 'site-menu-link';
    formula.href = (siteData.assets && siteData.assets.formulaSheet) || '#';
    formula.target = '_blank';
    formula.textContent = 'Formula Sheet';
    nav.appendChild(formula);
  }

  function init() {
    buildNav();
    populateFilters();
    buildMultiSyllabus();
    bindEvents();
    renderGrid();
    renderSelector();
  }

  init();
})();
