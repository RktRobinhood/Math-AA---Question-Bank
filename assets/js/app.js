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

  // ── Bulk-select state ──────────────────────────────────────────────────────
  let selectMode = false;
  const selected = new Set(); // question IDs checked in bulk-select mode

  applyInitialParams();
  render();

  function render() {
    const focus = captureFocus();
    app.innerHTML = "";
    app.append(renderSiteHeader());

    if (state.tab === "questions") app.append(renderQuestionBank());
    if (state.tab === "statistics") app.append(renderStatistics());
    if (state.tab === "syllabus") { app.append(renderSyllabus()); renderMath(app); }
    restoreFocus(focus);
  }

  function renderMath(container) {
    if (!window.katex) return;
    container.querySelectorAll(".formula").forEach(el => {
      try { katex.render(el.textContent, el, { displayMode: true, throwOnError: false }); }
      catch (_) {}
    });
    container.querySelectorAll(".formula-inline").forEach(el => {
      try { katex.render(el.textContent, el, { displayMode: false, throwOnError: false }); }
      catch (_) {}
    });
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
        ], () => { state.tab = "questions"; render(); }, state.tab === "questions"),
        menuGroup("Statistics", [], () => { state.tab = "statistics"; render(); }, state.tab === "statistics"),
        menuGroup("Syllabus", [
          ["syllabus/", "All syllabus topics"],
          ...Object.entries(DATA.topics || {}).map(([topic, name]) => [`syllabus/topic-${topic}/`, `Topic ${topic}: ${name}`])
        ], () => { state.tab = "syllabus"; render(); }, state.tab === "syllabus"),
        el("a", { class: "site-menu-link", href: "practice.html", text: "Practice" }),
        el("a", { class: "site-menu-link", href: DATA.assets?.formulaSheet || "#", target: "_blank", text: "Formula Sheet" })
      )
    );
  }

  function menuGroup(label, links, onTabSwitch, isActive) {
    const btn = el("button", {
      class: `site-menu-link${isActive ? " active" : ""}`,
      type: "button",
      text: label,
      onclick: onTabSwitch || null
    });
    if (!links.length) return el("div", { class: "menu-group no-submenu" }, btn);
    return el("div", { class: "menu-group" },
      btn,
      el("div", { class: "submenu" },
        ...links.map(([href, text]) => el("a", { href, text }))
      )
    );
  }

  function renderQuestionBank() {
    const results = filterQuestions();
    return el("section", {},
      renderFilters(true),
      renderKpis(results),
      el("div", { class: "panel" },
        el("div", { class: "section-title", text: `Matches (${results.length})` }),
        renderQuestionList(results)
      )
    );
  }

  function renderFilters(showSubtopics) {
    const panel = el("section", { class: "panel filter-panel" },
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
      renderYearPills(),
      el("div", { class: "filter-row", style: "justify-content:flex-end; border-top:1px solid var(--border); padding-top:8px; margin-top:4px;" },
        el("button", { class: "secondary-btn", type: "button", text: "Reset all filters", onclick: resetFilters })
      )
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
    // Count distinct sittings (year+session) — May and Nov counted separately
    const sittings = new Set(
      questions.map(q => q.year && q.session ? `${q.year} ${q.session}` : null).filter(Boolean)
    );
    const avgMarksPerQ = questions.length ? (marks / questions.length).toFixed(1) : "—";
    const avgQperSitting = sittings.size ? (questions.length / sittings.size).toFixed(1) : "—";
    const yearRange = years.size ? `${Math.min(...years)}–${Math.max(...years)}` : "—";
    return el("div", { class: "kpi-grid" },
      kpi("Questions", questions.length, `avg ${avgMarksPerQ} marks each`),
      kpi("Total marks", marks, `avg ${avgQperSitting}q per sitting`),
      kpi("Sittings", sittings.size, `${yearRange} · May & Nov`),
      kpi("Subtopics", subtopics.size, "unique syllabus tags")
    );
  }

  function kpi(label, value, sub) {
    return el("div", { class: "kpi" },
      el("div", { class: "kpi-label", text: label }),
      el("div", { class: "kpi-value", text: String(value) }),
      el("div", { class: "kpi-sub", text: sub || "" })
    );
  }

  // Called by basket.js after any basket change so checkboxes stay in sync
  window._AASL_APP_SYNC = () => {
    document.querySelectorAll('.aasl-card-checkbox-wrap input').forEach(cb => {
      const id = cb.dataset.qid;
      if (!id) return;
      cb.checked = window.AASL_BASKET?.has(id) || selected.has(id);
    });
    const bulkBar = document.getElementById('aasl-bulk-bar');
    if (bulkBar) {
      const countEl = bulkBar.querySelector('.aasl-bulk-count');
      const addBtn  = bulkBar.querySelector('.aasl-bulk-add');
      if (countEl) countEl.textContent = `${selected.size} selected`;
      if (addBtn)  addBtn.disabled = selected.size === 0;
    }
  };

  function renderQuestionList(results) {
    if (!results.length) return el("div", { class: "empty-state", text: "No questions match the current filters." });

    const container = el("div", {});

    // Bulk-select toolbar
    const selectToggle = el("button", {
      class: `aasl-select-toggle${selectMode ? " aasl-select-toggle--active" : ""}`,
      type: "button",
      text: selectMode ? "✓ Selecting — done" : "Select multiple",
      onclick: () => {
        selectMode = !selectMode;
        if (!selectMode) selected.clear();
        render();
      }
    });

    const toolRow = el("div", { style: "display:flex;justify-content:flex-end;margin-bottom:8px;" }, selectToggle);
    container.append(toolRow);

    // Bulk add bar (visible in select mode)
    if (selectMode) {
      const bulkBar = el("div", { class: "aasl-bulk-bar", id: "aasl-bulk-bar" },
        el("span", { class: "aasl-bulk-count", text: `${selected.size} selected` }),
        el("button", {
          class: "aasl-bulk-add",
          type: "button",
          text: "Add to output",
          disabled: selected.size === 0,
          onclick: () => {
            let added = 0;
            selected.forEach(id => {
              const q = results.find(r => r.id === id) || allQuestions.find(r => r.id === id);
              if (q && window.AASL_BASKET?.add(q)) added++;
            });
            selected.clear();
            selectMode = false;
            render();
          }
        })
      );
      container.append(bulkBar);
    }

    const list = el("div", { class: "question-list" },
      ...results.map(q => {
        const inBasket = window.AASL_BASKET?.has(q.id);
        const isSelected = selected.has(q.id);
        const card = el("div", { style: "position:relative;" });

        const link = el("a", {
          class: `question-card${isSelected ? " aasl-card-selected" : ""}`,
          href: selectMode ? "#" : (q.url || `questions/${q.id}/`),
          onclick: selectMode ? (e) => {
            e.preventDefault();
            if (selected.has(q.id)) selected.delete(q.id); else selected.add(q.id);
            window._AASL_APP_SYNC();
            // Toggle card selected style
            link.classList.toggle("aasl-card-selected", selected.has(q.id));
            const cb = card.querySelector('input[type=checkbox]');
            if (cb) cb.checked = selected.has(q.id);
          } : null
        },
          el("div", { class: "question-title", text: q.title }),
          el("div", { class: "meta-line" },
            badge(`${q.marks || 0} marks`),
            badge(q.section ? `Section ${q.section}` : "No section", true),
            badge((q.topicNumbers || []).map(t => `T${t}`).join(" ") || "No topic", true),
            inBasket && !selectMode ? badge("✓ Added", false) : null
          ),
          el("div", { class: "tag-line" },
            ...(q.syllabus || []).slice(0, 3).map(s => el("span", { class: "tag", text: s }))
          )
        );
        card.append(link);

        // Checkbox overlay in select mode
        if (selectMode) {
          const wrap = el("div", { class: "aasl-card-checkbox-wrap" });
          const cb = el("input", {
            type: "checkbox",
            "data-qid": q.id,
            checked: isSelected,
            onclick: (e) => {
              e.stopPropagation();
              if (e.target.checked) selected.add(q.id); else selected.delete(q.id);
              link.classList.toggle("aasl-card-selected", e.target.checked);
              window._AASL_APP_SYNC();
            }
          });
          wrap.append(cb);
          card.append(wrap);
        }

        return card;
      })
    );
    container.append(list);
    return container;
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
      el("div", { class: "stats-grid stats-full" },
        renderForecast(analytics)
      ),
      el("div", { class: "stats-grid" },
        renderTopicMix(analytics),
        renderPaperSplit(analytics)
      ),
      el("div", { class: "stats-grid stats-full" },
        renderCoverage(analytics)
      )
    );
  }

  function renderWeightControls() {
    const modeInfo = {
      primacy: "Weights older exam years more heavily — reveals long-standing syllabus patterns",
      neutral: "All exam years contribute equally to the forecast",
      recency: "Weights recent exams more heavily — highlights topics trending upward"
    };
    const modes = [["primacy", "Primacy"], ["neutral", "Neutral"], ["recency", "Recency"]];
    return el("section", { class: "panel filter-panel" },
      el("div", { class: "filter-row", style: "align-items:flex-start; gap:16px; flex-wrap:wrap;" },
        el("div", { style: "display:flex; flex-direction:column; gap:4px;" },
          el("span", { class: "filter-label", text: "Forecast weighting" }),
          el("span", { class: "stat-hint", text: modeInfo[state.yearMode] })
        ),
        el("div", { style: "display:flex; gap:6px; padding-top:2px;" },
          ...modes.map(([mode, label]) => el("button", {
            class: `fbtn${state.yearMode === mode ? " on" : ""}`,
            type: "button",
            text: label,
            title: modeInfo[mode],
            onclick: () => { state.yearMode = mode; render(); }
          }))
        )
      )
    );
  }

  function renderForecast(analytics) {
    const rows = analytics.rows.slice(0, 25);
    const maxScore = Math.max(1, ...rows.map(r => r.score));
    const T = analytics.totalSittings || 1;

    return el("section", { class: "stat-card stat-card-wide" },
      el("div", { class: "stat-card-head" },
        el("div", {},
          el("h2", { class: "section-title", text: "Forecast — most likely topics" }),
          el("p", { class: "stat-desc", text: `Ranked by weighted frequency across ${T} exam sittings. Sitting % = how often this subtopic appeared per sitting (May & Nov counted separately).` })
        )
      ),
      rows.length ? el("div", { class: "forecast-list" },
        ...rows.map((row, i) => {
          const pct = (row.score / maxScore * 100).toFixed(1);
          const sittingPct = Math.round(row.sittingRatio * 100);
          return el("div", { class: "forecast-row",
            title: `${row.subtopic}: appeared in ${row.sittingCount}/${T} sittings (${sittingPct}%), ${row.rawCount} question(s) total` },
            el("div", { class: "forecast-rank", text: String(i + 1) }),
            el("div", { class: "forecast-label" },
              el("span", { class: `topic-badge topic-${row.topic}`, text: `T${row.topic}` }),
              el("span", { text: row.subtopic })
            ),
            el("div", { class: "forecast-bar-wrap" },
              el("div", { class: `forecast-bar topic-bar-${row.topic}`, style: `width:${pct}%` })
            ),
            el("div", { class: "forecast-meta" },
              el("span", { class: "forecast-count",
                title: `Appeared in ${row.sittingCount} of ${T} sittings`,
                text: `${sittingPct}% of sittings` }),
              el("span", { class: "forecast-marks",
                title: `${row.rawCount} questions, ${row.marks.toFixed(0)} weighted marks`,
                text: `${row.rawCount}q` })
            )
          );
        })
      ) : el("div", { class: "empty-state", text: "No data in scope." })
    );
  }

  function renderTopicMix(analytics) {
    const totalQ = [...analytics.topicCounts.values()].reduce((a, b) => a + b, 0) || 1;
    const entries = Object.entries(DATA.topics || {}).map(([topic, name]) => {
      const count = analytics.topicCounts.get(topic) || 0;
      return { topic, label: `T${topic}`, name, count, pct: (count / totalQ * 100) };
    });
    return el("section", { class: "stat-card" },
      el("div", { class: "stat-card-head" },
        el("h2", { class: "section-title", text: "Topic spread" }),
        el("p", { class: "stat-desc", text: "How questions are distributed across the 5 syllabus topics." })
      ),
      el("div", { class: "topic-chart" },
        ...entries.map(e => el("div", { class: "topic-bar-row", title: `${e.name}: ${e.count} questions (${e.pct.toFixed(0)}%)` },
          el("div", { class: "topic-bar-label" },
            el("span", { class: `topic-badge topic-${e.topic}`, text: e.label }),
            el("span", { class: "topic-name", text: e.name })
          ),
          el("div", { class: "topic-bar-track" },
            el("div", { class: `topic-bar-fill topic-bar-${e.topic}`, style: `width:${e.pct.toFixed(1)}%` })
          ),
          el("div", { class: "topic-bar-count" },
            el("span", { text: `${e.count}` }),
            el("span", { class: "topic-bar-pct", text: ` (${e.pct.toFixed(0)}%)` })
          )
        ))
      )
    );
  }

  function renderCoverage(analytics) {
    const sittings = analytics.sittings;
    function sittingLabel(s) {
      const [year, sess] = s.split(' ');
      return String(year).slice(2) + (sess === 'May' ? 'M' : 'N');
    }
    const max = Math.max(1, ...analytics.rows.flatMap(row =>
      sittings.map(s => row.sittings.get(s) || 0)
    ));
    return el("section", { class: "stat-card stat-card-wide" },
      el("div", { class: "stat-card-head" },
        el("h2", { class: "section-title", text: "Coverage heatmap" }),
        el("p", { class: "stat-desc", text: "Questions per subtopic per exam sitting (M = May, N = Nov). Darker = more questions. Shows each sitting separately." })
      ),
      el("div", { class: "heatmap", style: `--year-count:${sittings.length || 1};` },
        el("div", { class: "heat-row" },
          el("div", { class: "heat-label", text: "" }),
          ...sittings.map(s => el("div", { class: "heat-cell heat-head", title: s, text: sittingLabel(s) }))
        ),
        ...analytics.rows.slice(0, 28).map(row => el("div", { class: "heat-row" },
          el("div", { class: "heat-label", title: row.subtopic, text: row.subtopic }),
          ...sittings.map(s => {
            const value = row.sittings.get(s) || 0;
            const alpha = value ? 0.15 + (value / max) * 0.72 : 0;
            return el("div", {
              class: "heat-cell",
              title: value ? `${row.subtopic} — ${s}: ${value} question(s)` : `${row.subtopic} — ${s}: not tested`,
              style: value ? `background:rgba(99,102,241,${alpha.toFixed(2)});border-color:rgba(99,102,241,.3);color:${alpha > 0.5 ? "#fff" : "var(--text)"}` : "",
              text: value ? String(value) : ""
            });
          })
        ))
      )
    );
  }

  function renderPaperSplit(analytics) {
    const totalQ = [...analytics.paperCounts.values()].reduce((a, b) => a + b, 0) || 1;
    const paperEntries = [
      { label: "Paper 1", sub: "Calculator-free", value: analytics.paperCounts.get("P1") || 0, color: "var(--accent)" },
      { label: "Paper 2", sub: "GDC allowed", value: analytics.paperCounts.get("P2") || 0, color: "var(--green)" }
    ];
    const sectionEntries = [
      { label: "Section A", sub: "Short answer", value: analytics.sectionCounts.get("A") || 0, color: "var(--amber)" },
      { label: "Section B", sub: "Extended response", value: analytics.sectionCounts.get("B") || 0, color: "var(--red)" }
    ];
    return el("section", { class: "stat-card" },
      el("div", { class: "stat-card-head" },
        el("h2", { class: "section-title", text: "Paper & section breakdown" }),
        el("p", { class: "stat-desc", text: "Distribution of questions by paper type and answer format." })
      ),
      el("div", { class: "split-section" },
        el("div", { class: "split-label", text: "BY PAPER" }),
        ...paperEntries.map(e => splitBar(e, totalQ))
      ),
      el("div", { class: "split-section", style: "margin-top:18px" },
        el("div", { class: "split-label", text: "BY SECTION" }),
        ...sectionEntries.map(e => splitBar(e, totalQ))
      )
    );
  }

  function splitBar(entry, total) {
    const pct = (entry.value / total * 100).toFixed(0);
    return el("div", { class: "split-row", title: `${entry.label}: ${entry.value} questions (${pct}%)` },
      el("div", { class: "split-info" },
        el("span", { class: "split-name", text: entry.label }),
        el("span", { class: "split-sub", text: entry.sub })
      ),
      el("div", { class: "bar-track" },
        el("div", { class: "bar-fill", style: `width:${pct}%;background:${entry.color}` })
      ),
      el("div", { class: "split-count" },
        el("span", { text: String(entry.value) }),
        el("span", { class: "split-pct", text: ` ${pct}%` })
      )
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
    const sittingSet = new Set(
      questions.map(q => q.year && q.session ? `${q.year} ${q.session}` : null).filter(Boolean)
    );
    const sittings = [...sittingSet].sort();
    const totalSittings = sittings.length || 1;
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
      const sitting = q.year && q.session ? `${q.year} ${q.session}` : null;

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
            sittingsSet: new Set(),
            sittings: new Map()
          });
        }
        const row = bySubtopic.get(subtopic);
        row.weightedCount += w;
        row.rawCount += 1;
        row.marks += markShare * w;
        if (sitting) {
          row.sittingsSet.add(sitting);
          addCount(row.sittings, sitting, 1);
        }
      }
    }

    const rows = [...bySubtopic.values()];
    for (const row of rows) {
      row.sittingCount = row.sittingsSet.size;
      row.sittingRatio = row.sittingCount / totalSittings;
    }
    const maxCount = Math.max(1, ...rows.map(r => r.weightedCount));
    const maxMarks = Math.max(1, ...rows.map(r => r.marks));
    for (const row of rows) {
      row.score = 0.25 * (row.weightedCount / maxCount)
                + 0.5  * (row.marks / maxMarks)
                + 0.25 * row.sittingRatio;
    }
    rows.sort((a, b) => b.score - a.score || naturalCompare(a.subtopic, b.subtopic));

    return { rows, years, sittings, totalSittings, topicCounts, paperCounts, sectionCounts };
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

