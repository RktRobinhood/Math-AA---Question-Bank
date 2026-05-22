(() => {
  const DATA = window.AASL_DATA;
  const app = document.getElementById("app");

  if (!DATA) {
    app.innerHTML = '<div class="loading">Run npm run build to generate site data.</div>';
    return;
  }

  const allQuestions = DATA.questions || [];
  const allYears = [...new Set(allQuestions.map(q => q.year).filter(Boolean))].sort((a, b) => a - b);
  const allSubtopics = [...new Set(allQuestions.flatMap(q => q.syllabus || []))]
    .sort((a, b) => naturalCompare(a, b));

  const state = {
    tab: document.body.dataset.initialTab || "questions",
    query: "",
    topic: "",
    session: "",
    timezone: "",
    paper: "",
    section: "",
    years: new Set(),
    and: new Set(),
    or: new Set(),
    not: new Set(),
    subtopicSearch: "",
    selectedId: "",
    yearMode: "neutral"
  };

  applyInitialParams();
  render();

  function render() {
    const focus = captureFocus();
    app.innerHTML = "";
    app.append(renderSiteHeader());
    app.append(renderPageTabs());

    if (state.tab === "questions") app.append(renderQuestionBank());
    if (state.tab === "statistics") app.append(renderStatistics());
    if (state.tab === "syllabus") app.append(renderSyllabus());
    restoreFocus(focus);
  }

  function renderSiteHeader() {
    return el("header", { class: "site-header" },
      el("a", { class: "site-brand", href: "./" },
        el("strong", { text: "IB Math AA SL" }),
        el("span", { text: `${allQuestions.length} mapped questions` })
      ),
      el("nav", { class: "site-menu", "aria-label": "Main navigation" },
        menuGroup("Question Bank", [
          ["question-bank/", "Search all questions"],
          ...allYears.slice().reverse().map(year => [`exams/${year}/`, String(year)])
        ]),
        menuGroup("Statistics", [
          ["statistics/", "Exam statistics"],
          ["statistics/?mode=recency", "Recency forecast"],
          ["statistics/?mode=primacy", "Long-term pattern"]
        ]),
        menuGroup("Syllabus", [
          ["syllabus/", "All syllabus topics"],
          ...Object.entries(DATA.topics || {}).map(([topic, name]) => [`syllabus/topic-${topic}/`, `Topic ${topic}: ${name}`])
        ]),
        el("a", { class: "site-menu-link", href: DATA.assets?.formulaSheet || "#", target: "_blank", text: "Formula Sheet" })
      ),
      el("button", { class: "secondary-btn", type: "button", text: "Reset filters", onclick: resetFilters })
    );
  }

  function menuGroup(label, links) {
    return el("div", { class: "menu-group" },
      el("button", { class: "site-menu-link", type: "button", text: label }),
      el("div", { class: "submenu" },
        ...links.map(([href, text]) => el("a", { href, text }))
      )
    );
  }

  function renderPageTabs() {
    return el("nav", { class: "nav-tabs" },
      pageTab("questions", "Question Bank", "question-bank/"),
      pageTab("statistics", "Statistics", "statistics/"),
      pageTab("syllabus", "Syllabus", "syllabus/")
    );
  }

  function pageTab(id, label, href) {
    return el("a", {
      class: `tab-btn${state.tab === id ? " on" : ""}`,
      href,
      text: label
    });
  }

  function renderQuestionBank() {
    const results = filterQuestions();
    if (!results.some(q => q.id === state.selectedId)) {
      state.selectedId = results[0]?.id || "";
    }
    const selected = results.find(q => q.id === state.selectedId) || results[0];

    return el("section", {},
      renderFilters(true),
      renderKpis(results),
      el("div", { class: "question-workspace" },
        el("div", { class: "panel" },
          el("div", { class: "section-title", text: `Matches (${results.length})` }),
          renderQuestionList(results)
        ),
        renderViewer(selected)
      )
    );
  }

  function renderFilters(showSubtopics) {
    const panel = el("section", { class: "panel filter-panel" },
      el("div", { class: "input-row" },
        el("input", {
          class: "search-input",
          type: "search",
          "data-focus-key": "main-search",
          value: state.query,
          placeholder: 'Search: calculus AND NOT trig, "normal distribution" OR binomial',
          title: "Supports AND, OR, NOT, parentheses, and quoted phrases.",
          oninput: event => {
            state.query = event.target.value;
            render();
          }
        }),
        el("button", { class: "secondary-btn", type: "button", text: "Clear Search", onclick: () => { state.query = ""; render(); } })
      ),
      filterRow("Topic", [
        ["", "All"],
        ["1", "1"],
        ["2", "2"],
        ["3", "3"],
        ["4", "4"],
        ["5", "5"]
      ], "topic"),
      filterRow("Session", [["", "All"], ["May", "May"], ["Nov", "Nov"]], "session"),
      filterRow("Time zone", [["", "All"], ["TZ0", "TZ0"], ["TZ1", "TZ1"], ["TZ2", "TZ2"], ["TZ3", "TZ3"]], "timezone"),
      filterRow("Paper", [["", "All"], ["P1", "P1"], ["P2", "P2"]], "paper"),
      filterRow("Section", [["", "All"], ["A", "A"], ["B", "B"]], "section"),
      renderYearPills()
    );

    if (showSubtopics) panel.append(renderSubtopicControls());
    return panel;
  }

  function filterRow(label, options, key) {
    return el("div", { class: "filter-row" },
      el("label", { text: label }),
      ...options.map(([value, text]) => el("button", {
        class: `fbtn${state[key] === value ? " on" : ""}`,
        type: "button",
        text,
        onclick: () => {
          state[key] = value;
          render();
        }
      }))
    );
  }

  function renderYearPills() {
    return el("div", { class: "filter-row" },
      el("span", { class: "filter-label", text: "Years" }),
      el("button", {
        class: `pill${state.years.size === 0 ? " on" : ""}`,
        type: "button",
        text: "All",
        onclick: () => {
          state.years.clear();
          render();
        }
      }),
      ...allYears.map(year => el("button", {
        class: `pill${state.years.has(year) ? " on" : ""}`,
        type: "button",
        text: String(year),
        onclick: () => {
          state.years.has(year) ? state.years.delete(year) : state.years.add(year);
          render();
        }
      }))
    );
  }

  function renderSubtopicControls() {
    const options = subtopicOptions();
    return el("div", {},
      el("div", { class: "input-row", style: "margin-top:10px;" },
        el("input", {
          class: "search-input",
          type: "search",
          "data-focus-key": "subtopic-search",
          value: state.subtopicSearch,
          placeholder: "Filter syllabus topics…",
          oninput: event => { state.subtopicSearch = event.target.value; render(); }
        })
      ),
      el("div", { class: "subtopic-grid triple" },
        renderSubtopicBox("AND", "Must have ALL of these", "and", options),
        renderSubtopicBox("OR", "Match ANY of these", "or", options),
        renderSubtopicBox("NOT", "Exclude ALL of these", "not", options)
      )
    );
  }

  function renderSubtopicBox(label, hint, key, options) {
    const set = state[key];
    const otherSets = [state.and, state.or, state.not].filter(s => s !== set);
    return el("div", { class: "subtopic-box" },
      el("h3", {},
        el("span", { class: `bool-badge bool-${key}`, text: label }),
        el("span", { class: "bool-hint", text: ` ${hint}` })
      ),
      el("div", { class: "check-list" },
        ...options.map(topic => el("label", { class: "check-row" },
          el("input", {
            type: "checkbox",
            checked: set.has(topic),
            disabled: otherSets.some(s => s.has(topic)),
            onchange: event => {
              event.target.checked ? set.add(topic) : set.delete(topic);
              render();
            }
          }),
          el("span", { text: topic })
        ))
      )
    );
  }

  function renderKpis(questions) {
    const marks = sum(questions.map(q => Number(q.marks || 0)));
    const years = new Set(questions.map(q => q.year));
    const subtopics = new Set(questions.flatMap(q => q.syllabus || []));
    const imageCount = sum(questions.map(q => (q.paperImages || []).length));
    return el("div", { class: "kpi-grid" },
      kpi("Questions", questions.length, "current scope"),
      kpi("Total marks", marks, questions.length ? `avg ${(marks / questions.length).toFixed(1)}` : "none"),
      kpi("Years", years.size ? `${Math.min(...years)}-${Math.max(...years)}` : "-", `${years.size} sitting${years.size === 1 ? "" : "s"}`),
      kpi("Subtopics", subtopics.size, "unique syllabus tags"),
      kpi("Images", imageCount, "cropped question pages")
    );
  }

  function kpi(label, value, sub) {
    return el("div", { class: "kpi" },
      el("div", { class: "kpi-label", text: label }),
      el("div", { class: "kpi-value", text: String(value) }),
      el("div", { class: "kpi-sub", text: sub || "" })
    );
  }

  function renderQuestionList(results) {
    if (!results.length) return el("div", { class: "empty-state", text: "No questions match the current filters." });
    return el("div", { class: "question-list" },
      ...results.map(q => el("a", {
        class: `question-card${state.selectedId === q.id ? " selected" : ""}`,
        href: q.url || `questions/${q.id}/`
      },
        el("div", { class: "question-title", text: q.title }),
        el("div", { class: "meta-line" },
          badge(`${q.marks || 0} marks`),
          badge(q.section ? `Section ${q.section}` : "No section", true),
          badge((q.topicNumbers || []).map(t => `T${t}`).join(" ") || "No topic", true)
        ),
        el("div", { class: "tag-line" },
          ...(q.syllabus || []).slice(0, 3).map(s => el("span", { class: "tag", text: s }))
        ),
        el("div", { class: "card-link-text", text: "Open question page" })
      ))
    );
  }

  function badge(text, neutral = false) {
    return el("span", { class: `badge${neutral ? " neutral" : ""}`, text });
  }

  function renderViewer(q) {
    if (!q) return el("section", { class: "panel viewer" }, el("div", { class: "empty-state", text: "Select a question." }));
    return el("section", { class: "panel viewer" },
      el("div", { class: "viewer-head" },
        el("div", {},
          el("div", { class: "viewer-title", text: q.title }),
          el("div", { class: "viewer-sub", text: `${q.marks || 0} marks - ${q.syllabus?.join(", ") || "Unmapped"}` })
        ),
        el("div", { class: "meta-line" },
          badge(q.paper),
          badge(q.timezone, true),
          badge(q.session, true),
          el("a", { class: "secondary-btn", href: q.url || `questions/${q.id}/`, text: "Open page" })
        )
      ),
      renderImageStack(q.paperImages, "Question image not generated for this note."),
      renderMarkscheme(q)
    );
  }

  function renderMarkscheme(q) {
    if (!q.markschemeImages?.length) {
      return el("div", { class: "details-panel" },
        el("summary", { text: "Markscheme" }),
        el("div", { class: "empty-state warning", text: "Markscheme image not generated for this note." })
      );
    }
    return el("details", { class: "details-panel" },
      el("summary", { text: "Markscheme" }),
      renderImageStack(q.markschemeImages, "")
    );
  }

  function renderImageStack(images, emptyText) {
    if (!images?.length) return el("div", { class: "empty-state warning", text: emptyText });
    return el("div", { class: "image-stack" },
      ...images.map(src => el("img", {
        class: "exam-image",
        src,
        alt: "Cropped exam page",
        loading: "lazy"
      }))
    );
  }

  function renderStatistics() {
    const questions = filterQuestions();
    const analytics = computeAnalytics(questions);

    return el("section", {},
      renderFilters(false),
      renderWeightControls(),
      renderKpis(questions),
      el("div", { class: "stats-grid" },
        renderForecast(analytics),
        renderTopicMix(analytics),
        renderCoverage(analytics),
        renderPaperSplit(analytics)
      )
    );
  }

  function renderWeightControls() {
    const modes = [
      ["primacy", "Primacy"],
      ["neutral", "Neutral"],
      ["recency", "Recency"]
    ];
    return el("section", { class: "panel filter-panel" },
      el("div", { class: "filter-row" },
        el("span", { class: "filter-label", text: "Year weight" }),
        ...modes.map(([mode, label]) => el("button", {
          class: `fbtn${state.yearMode === mode ? " on" : ""}`,
          type: "button",
          text: label,
          onclick: () => {
            state.yearMode = mode;
            render();
          }
        }))
      )
    );
  }

  function renderForecast(analytics) {
    const rows = analytics.rows.slice(0, 20);
    return el("section", { class: "stat-card" },
      el("h2", { class: "section-title", text: "Forecast" }),
      rows.length ? el("div", { class: "table-wrap" },
        el("table", { class: "data-table" },
          el("thead", {}, el("tr", {},
            el("th", { text: "Subtopic" }),
            el("th", { text: "Score" }),
            el("th", { text: "Q" }),
            el("th", { text: "Marks" })
          )),
          el("tbody", {}, ...rows.map(row => el("tr", {},
            el("td", {}, topicBadge(row.topic), document.createTextNode(` ${row.subtopic}`)),
            el("td", {}, scoreBar(row.score)),
            el("td", { class: "rn", text: row.rawCount.toFixed(0) }),
            el("td", { class: "rn", text: row.marks.toFixed(1) })
          )))
        )
      ) : el("div", { class: "empty-state", text: "No data in scope." })
    );
  }

  function renderTopicMix(analytics) {
    const entries = Object.entries(DATA.topics || {}).map(([topic, name]) => ({
      label: `T${topic} ${name}`,
      value: analytics.topicCounts.get(topic) || 0,
      color: topicColor(topic)
    }));
    return el("section", { class: "stat-card" },
      el("h2", { class: "section-title", text: "Topic mix" }),
      renderBars(entries)
    );
  }

  function renderCoverage(analytics) {
    const years = analytics.years;
    const max = Math.max(1, ...analytics.rows.flatMap(row => years.map(year => row.years.get(year) || 0)));
    return el("section", { class: "stat-card" },
      el("h2", { class: "section-title", text: "Coverage" }),
      el("div", { class: "heatmap", style: `--year-count:${years.length || 1};` },
        el("div", { class: "heat-row" },
          el("div", { class: "heat-label", text: "Subtopic" }),
          ...years.map(year => el("div", { class: "heat-cell", text: String(year) }))
        ),
        ...analytics.rows.slice(0, 24).map(row => el("div", { class: "heat-row" },
          el("div", { class: "heat-label", title: row.subtopic, text: row.subtopic }),
          ...years.map(year => {
            const value = row.years.get(year) || 0;
            const alpha = value ? 0.12 + (value / max) * 0.72 : 0;
            return el("div", {
              class: "heat-cell",
              style: value ? `background:rgba(99,102,241,${alpha.toFixed(2)});border-color:rgba(99,102,241,.28);` : "",
              text: value ? String(value) : ""
            });
          })
        ))
      )
    );
  }

  function renderPaperSplit(analytics) {
    const entries = [
      { label: "P1", value: analytics.paperCounts.get("P1") || 0, color: "var(--accent)" },
      { label: "P2", value: analytics.paperCounts.get("P2") || 0, color: "var(--green)" },
      { label: "Section A", value: analytics.sectionCounts.get("A") || 0, color: "var(--amber)" },
      { label: "Section B", value: analytics.sectionCounts.get("B") || 0, color: "var(--red)" }
    ];
    return el("section", { class: "stat-card" },
      el("h2", { class: "section-title", text: "Paper and section" }),
      renderBars(entries)
    );
  }

  function renderBars(entries) {
    const max = Math.max(1, ...entries.map(e => e.value));
    return el("div", {},
      ...entries.map(entry => el("div", { class: "bar-row" },
        el("div", { text: entry.label }),
        el("div", { class: "bar-track" },
          el("div", {
            class: "bar-fill",
            style: `width:${(entry.value / max * 100).toFixed(1)}%;background:${entry.color || "var(--accent)"};`
          })
        ),
        el("div", { class: "rn", text: String(entry.value) })
      ))
    );
  }

  function renderSyllabus() {
    const matcher = buildSearchMatcher(state.query);
    const items = (DATA.syllabus || []).filter(item => matcher(`${item.title} ${stripHtml(item.html)}`));
    return el("section", {},
      el("section", { class: "panel filter-panel" },
        el("div", { class: "input-row" },
          el("input", {
            class: "search-input",
            type: "search",
            "data-focus-key": "main-search",
            value: state.query,
            placeholder: 'Search syllabus: functions AND NOT trig',
            title: "Supports AND, OR, NOT, parentheses, and quoted phrases.",
            oninput: event => {
              state.query = event.target.value;
              render();
            }
          }),
          el("button", { class: "secondary-btn", type: "button", text: "Clear Search", onclick: () => { state.query = ""; render(); } })
        )
      ),
      el("div", { class: "syllabus-grid" },
        ...items.map(item => el("article", { class: "syllabus-card" },
          el("h2", { text: `Topic ${item.topic}: ${item.title}` }),
          el("div", { html: item.html })
        ))
      )
    );
  }

  function filterQuestions() {
    const matcher = buildSearchMatcher(state.query);
    return allQuestions.filter(q => {
      if (state.topic && !(q.topicNumbers || []).includes(state.topic)) return false;
      if (state.session && q.session !== state.session) return false;
      if (state.timezone && q.timezone !== state.timezone) return false;
      if (state.paper && q.paper !== state.paper) return false;
      if (state.section && q.section !== state.section) return false;
      if (state.years.size && !state.years.has(q.year)) return false;
      if (!matcher(q.searchText || "")) return false;
      const topics = new Set(q.syllabus || []);
      for (const item of state.and) if (!topics.has(item)) return false;
      if (state.or.size > 0) {
        let hasAny = false;
        for (const item of state.or) { if (topics.has(item)) { hasAny = true; break; } }
        if (!hasAny) return false;
      }
      for (const item of state.not) if (topics.has(item)) return false;
      return true;
    });
  }

  function subtopicOptions() {
    const needle = state.subtopicSearch.trim().toLowerCase();
    const selected = new Set([...state.and, ...state.or, ...state.not]);
    const scoped = allSubtopics.filter(topic => {
      if (selected.has(topic)) return true;
      return !needle || topic.toLowerCase().includes(needle);
    });
    return scoped.slice(0, 160);
  }

  function computeAnalytics(questions) {
    const years = [...new Set(questions.map(q => q.year).filter(Boolean))].sort((a, b) => a - b);
    const bySubtopic = new Map();
    const topicCounts = new Map();
    const paperCounts = new Map();
    const sectionCounts = new Map();

    for (const q of questions) {
      const w = yearWeight(q.year, years);
      const subs = q.syllabus?.length ? q.syllabus : ["Unmapped"];
      const markShare = Number(q.marks || 0) / subs.length;
      addCount(paperCounts, q.paper, 1);
      addCount(sectionCounts, q.section || "Other", 1);

      for (const subtopic of subs) {
        const topic = topicNumber(subtopic);
        addCount(topicCounts, topic || "Other", 1);
        if (!bySubtopic.has(subtopic)) {
          bySubtopic.set(subtopic, {
            subtopic,
            topic,
            weightedCount: 0,
            rawCount: 0,
            marks: 0,
            years: new Map()
          });
        }
        const row = bySubtopic.get(subtopic);
        row.weightedCount += w;
        row.rawCount += 1;
        row.marks += markShare * w;
        addCount(row.years, q.year, 1);
      }
    }

    const rows = [...bySubtopic.values()];
    const maxCount = Math.max(1, ...rows.map(r => r.weightedCount));
    const maxMarks = Math.max(1, ...rows.map(r => r.marks));
    for (const row of rows) {
      row.score = 0.4 * (row.weightedCount / maxCount) + 0.6 * (row.marks / maxMarks);
    }
    rows.sort((a, b) => b.score - a.score || naturalCompare(a.subtopic, b.subtopic));

    return { rows, years, topicCounts, paperCounts, sectionCounts };
  }

  function yearWeight(year, years) {
    if (state.yearMode === "neutral" || years.length < 2) return 1;
    const min = years[0];
    const max = years[years.length - 1];
    const t = (year - min) / Math.max(1, max - min);
    const bias = state.yearMode === "recency" ? t : 1 - t;
    return Math.exp(1.5 * bias);
  }

  function scoreBar(score) {
    return el("div", { class: "score-bar" },
      el("div", { class: "score-track" },
        el("div", { class: "score-fill", style: `width:${(score * 100).toFixed(1)}%;background:${scoreColor(score)};` })
      ),
      el("span", { text: score.toFixed(3) })
    );
  }

  function topicBadge(topic) {
    if (!topic) return el("span", { class: "badge neutral", text: "NA" });
    return el("span", { class: "badge", style: `background:${topicColor(topic)};`, text: `T${topic}` });
  }

  function resetFilters() {
    state.query = "";
    state.topic = "";
    state.session = "";
    state.timezone = "";
    state.paper = "";
    state.section = "";
    state.years.clear();
    state.and.clear();
    state.or.clear();
    state.not.clear();
    state.subtopicSearch = "";
    state.selectedId = "";
    state.yearMode = "neutral";
    render();
  }

  function applyInitialParams() {
    const params = new URLSearchParams(window.location.search);
    const year = Number(params.get("year"));
    if (Number.isFinite(year) && allYears.includes(year)) state.years.add(year);
    const topic = params.get("topic");
    if (topic && /^[1-5]$/.test(topic)) state.topic = topic;
    const mode = params.get("mode");
    if (["neutral", "recency", "primacy"].includes(mode)) state.yearMode = mode;
  }

  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs || {})) {
      if (key === "class") node.className = value;
      else if (key === "text") node.textContent = value;
      else if (key === "html") node.innerHTML = value;
      else if (key === "style") node.style.cssText = value;
      else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2), value);
      else if (value !== false && value !== null && value !== undefined) node.setAttribute(key, value === true ? "" : value);
    }
    for (const child of children.flat()) {
      if (child === null || child === undefined || child === false) continue;
      node.append(child);
    }
    return node;
  }

  function addCount(map, key, value) {
    map.set(key, (map.get(key) || 0) + value);
  }

  function topicNumber(value) {
    return String(value || "").match(/^([1-5])\./)?.[1] || "";
  }

  function topicColor(topic) {
    return {
      "1": "#6366f1",
      "2": "#059669",
      "3": "#d97706",
      "4": "#7c3aed",
      "5": "#dc2626"
    }[String(topic)] || "#64748b";
  }

  function scoreColor(score) {
    if (score >= 0.7) return "var(--green)";
    if (score >= 0.4) return "var(--accent)";
    if (score >= 0.2) return "var(--amber)";
    return "var(--faint)";
  }

  function sum(values) {
    return values.reduce((total, value) => total + Number(value || 0), 0);
  }

  function naturalCompare(a, b) {
    return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
  }

  function stripHtml(html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html || "";
    return tmp.textContent || "";
  }

  function buildSearchMatcher(query) {
    const raw = String(query || "").trim();
    if (!raw) return () => true;

    const tokens = tokenizeBooleanQuery(raw);
    const ast = parseBooleanQuery(tokens);
    if (!ast) {
      const fallback = normalizeSearch(raw);
      return text => normalizeSearch(text).includes(fallback);
    }

    return text => evaluateSearchAst(ast, normalizeSearch(text));
  }

  function tokenizeBooleanQuery(query) {
    const tokens = [];
    let i = 0;
    while (i < query.length) {
      const ch = query[i];
      if (/\s/.test(ch)) {
        i += 1;
        continue;
      }
      if (ch === "(" || ch === ")") {
        tokens.push({ type: ch });
        i += 1;
        continue;
      }
      if (ch === '"') {
        let j = i + 1;
        let value = "";
        while (j < query.length && query[j] !== '"') {
          value += query[j];
          j += 1;
        }
        tokens.push({ type: "TERM", value: normalizeSearch(value) });
        i = j < query.length ? j + 1 : j;
        continue;
      }
      let j = i;
      while (j < query.length && !/\s|\(|\)/.test(query[j])) j += 1;
      const raw = query.slice(i, j);
      const op = raw.toUpperCase();
      if (op === "AND" || op === "OR" || op === "NOT") {
        tokens.push({ type: op });
      } else if (raw.startsWith("-") && raw.length > 1) {
        tokens.push({ type: "NOT" }, { type: "TERM", value: normalizeSearch(raw.slice(1)) });
      } else {
        tokens.push({ type: "TERM", value: normalizeSearch(raw) });
      }
      i = j;
    }
    return tokens.filter(token => token.type !== "TERM" || token.value);
  }

  function parseBooleanQuery(tokens) {
    let pos = 0;
    const startsPrimary = token => token && (token.type === "TERM" || token.type === "NOT" || token.type === "(");
    const peek = () => tokens[pos];
    const take = type => {
      if (tokens[pos]?.type !== type) return false;
      pos += 1;
      return true;
    };

    const parseExpression = () => parseOr();

    const parseOr = () => {
      let left = parseAnd();
      if (!left) return null;
      while (take("OR")) {
        const right = parseAnd();
        if (!right) return null;
        left = { type: "OR", left, right };
      }
      return left;
    };

    const parseAnd = () => {
      let left = parseNot();
      if (!left) return null;
      while (true) {
        if (take("AND")) {
          const right = parseNot();
          if (!right) return null;
          left = { type: "AND", left, right };
          continue;
        }
        if (startsPrimary(peek())) {
          const right = parseNot();
          if (!right) return null;
          left = { type: "AND", left, right };
          continue;
        }
        return left;
      }
    };

    const parseNot = () => {
      if (take("NOT")) {
        const child = parseNot();
        return child ? { type: "NOT", child } : null;
      }
      return parsePrimary();
    };

    const parsePrimary = () => {
      const token = peek();
      if (!token) return null;
      if (take("TERM")) return { type: "TERM", value: token.value };
      if (take("(")) {
        const child = parseExpression();
        if (!child || !take(")")) return null;
        return child;
      }
      return null;
    };

    const ast = parseExpression();
    return ast && pos === tokens.length ? ast : null;
  }

  function evaluateSearchAst(node, text) {
    if (node.type === "TERM") return text.includes(node.value);
    if (node.type === "AND") return evaluateSearchAst(node.left, text) && evaluateSearchAst(node.right, text);
    if (node.type === "OR") return evaluateSearchAst(node.left, text) || evaluateSearchAst(node.right, text);
    if (node.type === "NOT") return !evaluateSearchAst(node.child, text);
    return true;
  }

  function normalizeSearch(value) {
    return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function captureFocus() {
    const active = document.activeElement;
    if (!active || !app.contains(active) || !active.dataset.focusKey) return null;
    return {
      key: active.dataset.focusKey,
      start: typeof active.selectionStart === "number" ? active.selectionStart : null,
      end: typeof active.selectionEnd === "number" ? active.selectionEnd : null
    };
  }

  function restoreFocus(focus) {
    if (!focus) return;
    const target = app.querySelector(`[data-focus-key="${focus.key}"]`);
    if (!target) return;
    target.focus();
    if (focus.start !== null && focus.end !== null && typeof target.setSelectionRange === "function") {
      target.setSelectionRange(focus.start, focus.end);
    }
  }
})();
