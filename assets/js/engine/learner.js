/* Learner state and question selection for the practice engine. Pure JavaScript, no DOM.
   The storage backend and the clock are injectable, so the same code runs in the browser
   (localStorage) and under Node (a fake). Attaches to QBEngine.learner.

   The unit that carries a level is the subtopic: a syllabus code of the learner's course ("2.7").
   State is kept per course, so the same code in two courses never meets. Every attempt also logs
   the skills of the question it was made on, so a finer model can be built from the log later.
   See docs/practice-engine.md. */
(function (root) {
  "use strict";
  const E = root.QBEngine;
  if (!E || !E.make) throw new Error("load engine.js before learner.js");
  const L = (E.learner = {});
  const DAY = 86400000;

  // Every tunable number and every message, in one place.
  L.CONFIG = {
    storageKey: "qb_practice_v1",
    startLevel: 2,          // where a subtopic with no history starts
    minLevel: 1,            // generated levels run from here ...
    maxLevel: 4,            // ... to here; above is the exam rung
    upStreak: 2,            // correct in a row at a level: move up
    downWindow: 3,          // look at this many latest answers at a level ...
    downWrong: 2,           // ... and move down when this many are wrong
    refreshStreak: 2,       // correct in a row to clear one prerequisite
    reviewDays: [3, 7, 14], // exam-rung checks, days after the previous step
    reviewEvery: 4,         // while other work remains, at most one due review per this many questions
    activeUnits: 3,         // subtopics worked on side by side
    synopticEvery: 5,       // at the exam rung, one synoptic (level 5) question per this many
    attemptCap: 5000,       // attempts kept in the log
    seenCap: 40,            // recent question fingerprints remembered per generator
    retrySeeds: 6,          // new seeds tried to avoid showing a question already seen
    messages: {
      up: "Two in a row. Moving up to level {to}.",
      down: "Stepping down to level {to} to rebuild this.",
      stay: "Keep going at this level. Read the worked solution, then try another.",
      "exam-reached": "Two in a row at the top level. Next: real exam questions on {title}.",
      "refresh-start": "Let's refresh {names} first.",
      "refresh-done": "Refresher done. Back to {title}.",
      "review-passed": "Still secure. Next check in {days} days.",
      "review-complete": "Secure. No more checks planned for {title}.",
      "review-missed": "That one slipped. Back to level {to} to rebuild it.",
      "exam-down": "The exam questions are not landing yet. Back to level {to}.",
      "real-secure": "Two past-paper questions right in a row. This one rests now and comes back for a check in {days} days.",
    },
  };

  // ---- storage ---------------------------------------------------------------------
  L.VERSION = 1;
  // One step per format change: MIGRATIONS[n] turns a version-n save into version n + 1.
  L.MIGRATIONS = {
    // Version 0: the pre-release layout, one course only, `units` and `log` at the top and no version.
    0(old) {
      const course = old.course || "aa-sl";
      return {
        app: "qb-practice", version: 1, createdAt: old.createdAt || 0, updatedAt: old.updatedAt || 0,
        salt: old.salt || "m0", nextSeed: old.nextSeed || (old.log || []).length + 1,
        courses: { [course]: { units: old.units || {}, seen: {}, lastType: null, sinceReview: 0, sinceSynoptic: 0 } },
        attempts: (old.log || []).map((a) => Object.assign({ course }, a)),
      };
    },
  };
  L.newState = function (now) {
    return { app: "qb-practice", version: L.VERSION, createdAt: now || 0, updatedAt: now || 0, salt: "s" + (now || 0).toString(36), nextSeed: 1, courses: {}, attempts: [] };
  };
  // Brings any readable save up to the current version. Throws when it cannot.
  L.migrate = function (obj) {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) throw new Error("not a save");
    let s = obj;
    let v = s.version === undefined ? 0 : s.version;
    if (!Number.isInteger(v) || v < 0) throw new Error("bad version");
    if (v > L.VERSION) throw new Error(`save is version ${v}; this page understands up to ${L.VERSION}`);
    if (v === 0 && !s.units && !s.log) throw new Error("not a practice save");
    while (v < L.VERSION) {
      if (!L.MIGRATIONS[v]) throw new Error(`no migration from version ${v}`);
      s = L.MIGRATIONS[v](s);
      v = s.version;
    }
    if (s.app !== "qb-practice" || typeof s.courses !== "object" || !Array.isArray(s.attempts)) throw new Error("not a practice save");
    return s;
  };
  function memoryBackend() {
    const m = new Map();
    return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: (k) => { m.delete(k); }, keys: () => [...m.keys()] };
  }
  L.memoryBackend = memoryBackend;
  function defaultBackend() {
    try { if (root.localStorage) { root.localStorage.getItem("qb_probe"); return root.localStorage; } } catch (_) { /* private mode */ }
    return memoryBackend();
  }
  // A store over a backend with getItem/setItem/removeItem. load() never throws and never wipes:
  // a save it cannot read is copied to "<key>_unreadable_<time>" and a fresh state is returned.
  L.createStore = function (opts) {
    opts = opts || {};
    const backend = opts.backend || defaultBackend();
    const key = opts.key || L.CONFIG.storageKey;
    const now = opts.now || Date.now;
    return {
      key, backend,
      load() {
        let raw = null;
        try { raw = backend.getItem(key); } catch (_) { raw = null; }
        if (raw === null || raw === undefined) return { state: L.newState(now()), status: "new" };
        try {
          const parsed = JSON.parse(raw);
          const from = parsed && parsed.version === undefined ? 0 : parsed && parsed.version;
          const state = L.migrate(parsed);
          return { state, status: from === L.VERSION ? "loaded" : "migrated", from };
        } catch (err) {
          const aside = `${key}_unreadable_${now()}`;
          try { backend.setItem(aside, raw); } catch (_) { /* full or blocked */ }
          return { state: L.newState(now()), status: "unreadable", keptAs: aside, error: String(err.message || err) };
        }
      },
      save(state) {
        state.updatedAt = now();
        try { backend.setItem(key, JSON.stringify(state)); return true; } catch (_) { return false; }
      },
      // Copies the current save to another key (used before an import replaces it).
      keepAside(suffix) {
        let raw = null;
        try { raw = backend.getItem(key); } catch (_) { return null; }
        if (raw === null || raw === undefined) return null;
        const aside = `${key}_${suffix}_${now()}`;
        try { backend.setItem(aside, raw); } catch (_) { return null; }
        return aside;
      },
    };
  };
  // Progress as a JSON string for a file, and back. importProgress throws on anything that is not a save.
  L.exportProgress = function (state, now) {
    return JSON.stringify({ app: "qb-practice-export", exportedAt: now === undefined ? state.updatedAt : now, version: state.version, state });
  };
  L.importProgress = function (text) {
    let obj;
    try { obj = JSON.parse(text); } catch (_) { throw new Error("This file is not a practice progress file."); }
    const inner = obj && obj.app === "qb-practice-export" ? obj.state : obj;
    try { return L.migrate(inner); } catch (err) { throw new Error("This file is not a practice progress file (" + err.message + ")."); }
  };

  // ---- catalogue helpers ---------------------------------------------------------------------
  // The real past-paper questions per syllabus code for a course, from QB_TYPES.real:
  // {code: [{id, marks, share}]}, main questions first, each group short to long.
  L.realIndex = function (catalogue, course) {
    const out = {};
    const src = (catalogue && catalogue.real && catalogue.real[course]) || {};
    for (const code of Object.keys(src)) out[code] = src[code].map((r) => (Array.isArray(r) ? { id: r[0], marks: r[1], share: r[2] } : r));
    return out;
  };
  // Builds the same index straight from window.AASL_DATA.questions (no generated file needed).
  L.realIndexFromQuestions = function (questions, course, minShare) {
    const out = {};
    for (const q of questions) {
      if (!(q.courses || [q.course]).includes(course) || !q.parts) continue;
      const marks = {};
      for (const p of q.parts) for (const s of p.syllabus) { const c = String(s).split(" ")[0]; marks[c] = (marks[c] || 0) + p.marks / p.syllabus.length; }
      for (const c of Object.keys(marks)) (out[c] = out[c] || []).push({ id: q.id, marks: q.marks, share: Math.round((100 * marks[c]) / q.marks) });
    }
    const cut = 100 * (minShare === undefined ? 0.5 : minShare);
    for (const c of Object.keys(out)) out[c].sort((a, b) => (b.share >= cut) - (a.share >= cut) || a.marks - b.marks || (a.id < b.id ? -1 : 1));
    return out;
  };

  const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (_, k) => (vars[k] === undefined ? "" : vars[k]));
  const lower = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

  // ---- the learner ---------------------------------------------------------------------
  // opts: {course, catalogue (QB_TYPES), real ({code: [{id, marks}]}), store or backend, config, now}
  L.createLearner = function (opts) {
    opts = opts || {};
    const course = opts.course || "aa-sl";
    const cfg = Object.assign({}, L.CONFIG, opts.config || {});
    cfg.messages = Object.assign({}, L.CONFIG.messages, (opts.config && opts.config.messages) || {});
    const now = opts.now || Date.now;
    const store = opts.store || L.createStore({ backend: opts.backend, key: cfg.storageKey, now });
    const cat = opts.catalogue || { statements: {}, subtopics: {}, types: [] };
    // The engine maps generators onto each course's codes from the same catalogue.
    if (opts.catalogue && opts.catalogue.statements) E.useCatalogue(opts.catalogue);
    const real = opts.real || L.realIndex(cat, course);
    const statements = (cat.statements && cat.statements[course]) || [];
    const stByCode = new Map(statements.map((s) => [s.code, s]));
    const codeById = new Map(statements.map((s) => [s.id, s.code]));
    const typeById = new Map((cat.types || []).map((t) => [t.id, t]));

    // opts.state shares a save another learner has already loaded: one learner per course over
    // one state object, so switching course on a page never works on a stale copy.
    const loaded = opts.state ? { state: opts.state, status: "shared" } : store.load();
    const me = { course, config: cfg, store, loadStatus: loaded.status, loadInfo: loaded, state: loaded.state };
    const cs = () => (me.state.courses[course] = me.state.courses[course] || { units: {}, seen: {}, lastType: null, sinceReview: 0, sinceSynoptic: 0 });

    const titleOf = (code) => (stByCode.get(code) ? stByCode.get(code).title : "subtopic " + code);
    const gens = (code, level) => E.generators({ course, syllabus: code, primary: true, level });
    function levelsOf(code) {
      const out = [];
      for (let l = cfg.minLevel; l <= cfg.maxLevel; l++) if (gens(code, l).length) out.push(l);
      return out;
    }
    // What a subtopic falls back on: level-0 types that support its skills, then prerequisite subtopics.
    function prerequisites(code) {
      const st = stByCode.get(code);
      if (!st) return [];
      const items = [];
      for (const t of cat.types || []) {
        if (!(t.supports || []).some((sk) => sk.startsWith(st.id + "."))) continue;
        if (E.generators({ course, type: t.id, level: 0 }).length) items.push({ kind: "type", id: t.id, name: lower(t.name), streak: 0 });
      }
      const sub = cat.subtopics && cat.subtopics[st.id];
      for (const pid of (sub && sub.prereqs) || []) {
        const pc = codeById.get(pid);
        if (pc && levelsOf(pc).length) items.push({ kind: "unit", id: pc, name: lower(titleOf(pc)), streak: 0 });
      }
      return items;
    }
    me.prerequisites = prerequisites;
    me.levelsOf = levelsOf;

    function unit(code, create) {
      const u = cs().units;
      if (!u[code] && create) {
        const levels = levelsOf(code);
        let level = null;
        if (levels.length) level = levels.find((l) => l >= cfg.startLevel) || levels[levels.length - 1];
        u[code] = { level, rung: levels.length ? "generated" : "real", recent: [], lastSeen: 0, nextReview: null, reviewStage: 0, refresh: null, realSeen: [], attempts: 0, correct: 0, started: false };
      }
      return u[code];
    }
    const newSeed = () => `${me.state.salt}-${me.state.nextSeed++}`;

    // A generated question for one of these generators, avoiding the last type and anything seen lately.
    function generated(pool, level) {
      if (!pool.length) return null;
      const c = cs();
      let cands = pool.filter((g) => g.type !== c.lastType);
      if (!cands.length) cands = pool;
      let q = null, first = null;
      for (let t = 0; t < cfg.retrySeeds && !q; t++) {
        const seed = newSeed();
        const g = cands[E.hash("gen|" + seed) % cands.length];
        const cand = E.make({ course, generator: g.id, level, seed });
        first = first || cand;
        if (!(c.seen[g.id] || []).includes(E.signature(cand))) q = cand;
      }
      return q || first;
    }
    function realQuestion(code, u) {
      const list = real[code] || [];
      if (!list.length) return null;
      let pick = list.find((r) => !u.realSeen.includes(r.id));
      if (!pick) { u.realSeen = []; pick = list[0]; } // all seen: start the list again
      return pick;
    }
    function item(code, reason, extra) { return Object.assign({ course, unit: code, reason }, extra); }
    const fromQuestion = (code, reason, q, extra) => item(code, reason, Object.assign({ kind: "generated", level: q.level, request: q.request, question: q, type: q.type }, extra));
    const fromReal = (code, reason, r) => item(code, reason, { kind: "real", level: "exam", questionId: r.id, marks: r.marks, type: null });

    function build(code, reason) {
      const u = unit(code, true);
      if (u.rung === "real") {
        const r = realQuestion(code, u);
        return r ? fromReal(code, "real-only", r) : null;
      }
      if (u.refresh && u.refresh.items.length) {
        const it = u.refresh.items[0];
        let q;
        if (it.kind === "type") q = generated(E.generators({ course, type: it.id, level: 0 }), 0);
        else { const ls = levelsOf(it.id); q = generated(gens(it.id, ls[0]), ls[0]); }
        if (q) return fromQuestion(code, "refresh", q, { refreshFor: code, refreshItem: { kind: it.kind, id: it.id, name: it.name } });
        u.refresh = null; // its generators have gone: carry on with the subtopic itself
      }
      if (u.rung === "exam") {
        const r = realQuestion(code, u);
        if (r) return fromReal(code, reason === "review" ? "review" : "exam", r);
        const ls = levelsOf(code);
        const q = generated(gens(code, ls[ls.length - 1]), ls[ls.length - 1]);
        return q ? fromQuestion(code, reason === "review" ? "review" : "exam", q) : null;
      }
      const ls = levelsOf(code);
      if (!ls.includes(u.level)) u.level = ls.find((l) => l >= (u.level || cfg.startLevel)) || ls[ls.length - 1];
      const q = generated(gens(code, u.level), u.level);
      return q ? fromQuestion(code, u.started ? "progress" : "new", q) : null;
    }

    // Fixed-level practice: the student chose a level range instead of "adapt to me". Subtopics
    // take turns; each gets a question at one of the wanted levels it has generators for (the
    // nearest level when it has none of them), or a real question when it has no generator.
    const turns = {};
    let turn = 0;
    function fixed(usable, levels) {
      const order = usable.slice().sort((a, b) => (turns[a] || 0) - (turns[b] || 0));
      for (const code of order) {
        const u = unit(code, true), ls = levelsOf(code);
        let it = null;
        if (ls.length) {
          let want = ls.filter((l) => levels.includes(l));
          if (!want.length) {
            const gap = (l) => Math.min(...levels.map((w) => Math.abs(w - l)));
            want = [ls.reduce((best, l) => (gap(l) < gap(best) ? l : best), ls[0])];
          }
          const level = want[(u.attempts + turn) % want.length];
          const q = generated(gens(code, level), level);
          if (q) it = fromQuestion(code, "fixed", q);
        } else {
          const r = realQuestion(code, u);
          if (r) it = fromReal(code, "fixed", r);
        }
        if (it) { turns[code] = ++turn; return it; }
      }
      return { kind: "none", why: "nothing to practise in this scope yet" };
    }

    // The next thing to ask within a scope (a list of the course's syllabus codes). Returns an item:
    //   {kind: "generated", unit, level, reason, request, question, ...}
    //   {kind: "real", unit, level: "exam", reason, questionId, marks}
    //   {kind: "none", why}
    // reason is one of new, progress, refresh, review, exam, synoptic, real-only, fixed.
    // opts.levels ([1, 2]) asks for fixed-level practice: questions at those levels, mixed over the
    // scope, whatever the student's own level is. Those answers are logged and change no level.
    me.next = function (scope, opts) {
      const codes = [...new Set(scope || [])];
      const c = cs(), t = now();
      const usable = codes.filter((code) => levelsOf(code).length || (real[code] || []).length);
      if (!usable.length) return { kind: "none", why: codes.length ? "nothing to practise in this scope yet" : "empty scope" };
      if (opts && Array.isArray(opts.levels) && opts.levels.length) return fixed(usable, opts.levels);
      const st = (code) => c.units[code];
      const started = (code) => st(code) && st(code).started;
      const atExam = (code) => started(code) && st(code).rung === "exam";
      const due = usable.filter((code) => atExam(code) && st(code).nextReview !== null && st(code).nextReview <= t)
        .sort((a, b) => st(a).nextReview - st(b).nextReview);
      const inProgress = usable.filter((code) => started(code) && !atExam(code)).sort((a, b) => st(a).lastSeen - st(b).lastSeen);
      const unstarted = usable.filter((code) => !started(code));
      const work = inProgress.length + unstarted.length;
      if (due.length && (!work || c.sinceReview >= cfg.reviewEvery)) {
        const it = build(due[0], "review");
        if (it) return it;
      }
      if (work) {
        const cands = unstarted.slice(0, Math.max(0, cfg.activeUnits - inProgress.length)).concat(inProgress);
        let fallback = null;
        for (const code of cands) {
          const it = build(code);
          if (!it) continue;
          if (it.kind === "real" || it.type !== c.lastType) return it;
          fallback = fallback || it;
        }
        if (fallback) return fallback;
      }
      // Everything in scope is at the exam rung and nothing is due.
      const exam = usable.filter(atExam).sort((a, b) => st(a).lastSeen - st(b).lastSeen);
      if (c.sinceSynoptic >= cfg.synopticEvery) {
        const ready = new Set(Object.keys(c.units).filter((code) => c.units[code].rung === "exam"));
        const pool = E.generators({ course, level: 5 }).filter((g) => g.syllabus.every((code) => ready.has(code)) && g.syllabus.some((code) => exam.includes(code)));
        const q = generated(pool, 5);
        if (q) return fromQuestion(q.syllabus[0], "synoptic", q);
      }
      for (const code of exam) { const it = build(code, "exam"); if (it) return it; }
      return { kind: "none", why: "nothing to practise in this scope yet" };
    };

    function change(code, kind, vars) {
      const key = kind === "review-passed" && vars.days === null ? "review-complete" : kind;
      return Object.assign({ unit: code, kind, message: fill(cfg.messages[key] || "", Object.assign({ title: lower(titleOf(code)) }, vars)) }, vars);
    }
    function toExam(code, u, t) {
      const from = u.level;
      u.rung = "exam"; u.recent = []; u.reviewStage = 0; u.nextReview = t + cfg.reviewDays[0] * DAY;
      return change(code, "exam-reached", { from, to: "exam" });
    }
    function toTop(code, u, kind) {
      const ls = levelsOf(code);
      u.recent = []; u.reviewStage = 0;
      if (!ls.length) { u.nextReview = now() + cfg.reviewDays[0] * DAY; return change(code, kind, { from: "exam", to: "exam" }); }
      u.rung = "generated"; u.level = ls[ls.length - 1]; u.nextReview = null;
      return change(code, kind, { from: "exam", to: u.level });
    }

    // Records the answer to an item from next(). result: {correct, selfMarked, timeMs}.
    // Returns {change, saved}: change is null or {unit, kind, from, to, message}, where kind is
    // up, down, stay, exam-reached, refresh-start, refresh-done, review-passed, review-missed, exam-down.
    me.record = function (it, result) {
      const c = cs(), t = now(), ok = Boolean(result && result.correct);
      const code = it.unit, u = unit(code, true), q = it.question;
      me.state.attempts.push({
        t, course, unit: code, reason: it.reason, level: it.level, correct: ok, self: Boolean(result && result.selfMarked), ms: (result && result.timeMs) || null,
        type: it.type || null, generator: q ? q.generator : null, skills: q ? q.skills : [], request: it.request || null, seed: q ? q.seed : null, real: it.questionId || null,
      });
      if (me.state.attempts.length > cfg.attemptCap) me.state.attempts.splice(0, me.state.attempts.length - cfg.attemptCap);
      if (q) {
        const seen = (c.seen[q.generator] = c.seen[q.generator] || []);
        seen.push(E.signature(q));
        if (seen.length > cfg.seenCap) seen.splice(0, seen.length - cfg.seenCap);
        c.lastType = q.type;
      } else {
        c.lastType = null;
        if (!u.realSeen.includes(it.questionId)) u.realSeen.push(it.questionId);
      }
      if (it.reason === "fixed") {
        // Fixed-level practice is logged and counted; it moves no level and starts no subtopic.
        u.lastSeen = t; u.attempts++; if (ok) u.correct++;
        return { change: null, saved: store.save(me.state) };
      }
      u.started = true; u.lastSeen = t; u.attempts++; if (ok) u.correct++;
      c.sinceReview = it.reason === "review" ? 0 : c.sinceReview + 1;
      c.sinceSynoptic = it.reason === "synoptic" ? 0 : c.sinceSynoptic + (u.rung === "exam" ? 1 : 0);
      let ch = null;
      if (it.reason === "refresh" && u.refresh) {
        const cur = u.refresh.items.find((x) => x.kind === it.refreshItem.kind && x.id === it.refreshItem.id);
        if (cur) {
          cur.streak = ok ? cur.streak + 1 : 0;
          if (cur.streak >= cfg.refreshStreak) u.refresh.items.splice(u.refresh.items.indexOf(cur), 1);
        }
        if (!u.refresh.items.length) {
          u.refresh = null; u.recent = [];
          const ls = levelsOf(code);
          u.level = ls[0];
          ch = change(code, "refresh-done", { from: "refresh", to: u.level });
        }
      } else if (it.reason === "review") {
        if (ok) {
          u.reviewStage++;
          const days = u.reviewStage < cfg.reviewDays.length ? cfg.reviewDays[u.reviewStage] : null;
          u.nextReview = days === null ? null : t + days * DAY;
          ch = change(code, "review-passed", { from: "exam", to: "exam", days });
        } else ch = toTop(code, u, "review-missed");
      } else if (it.reason === "exam") {
        u.recent.push(ok ? 1 : 0);
        if (u.recent.slice(-cfg.downWindow).filter((r) => !r).length >= cfg.downWrong) ch = toTop(code, u, "exam-down");
      } else if (it.reason === "new" || it.reason === "progress") {
        u.recent.push(ok ? 1 : 0);
        const ls = levelsOf(code), last = u.recent.slice(-cfg.downWindow);
        if (u.recent.length >= cfg.upStreak && u.recent.slice(-cfg.upStreak).every(Boolean)) {
          const up = ls.find((l) => l > u.level);
          if (up === undefined) ch = toExam(code, u, t);
          else { ch = change(code, "up", { from: u.level, to: up }); u.level = up; u.recent = []; }
        } else if (last.filter((r) => !r).length >= cfg.downWrong) {
          const below = ls.filter((l) => l < u.level);
          if (below.length) { const to = below[below.length - 1]; ch = change(code, "down", { from: u.level, to }); u.level = to; u.recent = []; }
          else {
            const items = prerequisites(code);
            u.recent = [];
            if (items.length) {
              u.refresh = { items };
              ch = change(code, "refresh-start", { from: u.level, to: "refresh", names: items.map((x) => x.name).join(", then ") });
            } else ch = change(code, "stay", { from: u.level, to: u.level });
          }
        }
      }
      else if (it.reason === "real-only") {
        // A subtopic with no generator yet: two past-paper questions right in a row and it rests
        // until its first review, so it does not crowd out the rest of the scope.
        u.recent.push(ok ? 1 : 0);
        if (u.recent.length >= cfg.upStreak && u.recent.slice(-cfg.upStreak).every(Boolean)) {
          u.rung = "exam"; u.recent = []; u.reviewStage = 0; u.nextReview = t + cfg.reviewDays[0] * DAY;
          ch = change(code, "real-secure", { from: "real", to: "exam", days: cfg.reviewDays[0] });
        }
      }
      // synoptic answers are logged and counted, and change no level.
      if (u.recent.length > 12) u.recent.splice(0, u.recent.length - 12);
      const saved = store.save(me.state);
      return { change: ch, saved };
    };
    // The plain-words line for a change returned by record() ("" when nothing changed).
    me.explain = (ch) => (ch ? ch.message : "");

    // Where the student is in each subtopic of a scope:
    // [{code, title, status, level, attempts, correct, nextReview, reviewDue, levels, hasReal, next}]
    // status: not-started, level, refresh, exam, review-due, real-only, unavailable.
    me.summary = function (scope) {
      const c = cs(), t = now();
      return [...new Set(scope || [])].map((code) => {
        const u = c.units[code], levels = levelsOf(code), hasReal = (real[code] || []).length > 0;
        const row = { code, title: titleOf(code), status: "not-started", level: null, attempts: u ? u.attempts : 0, correct: u ? u.correct : 0,
          nextReview: u ? u.nextReview : null, reviewDue: false, levels, hasReal, next: "" };
        if (!levels.length && !hasReal) { row.status = "unavailable"; row.next = "Nothing to practise here yet."; return row; }
        if (!levels.length) {
          row.status = "real-only";
          row.reviewDue = Boolean(u && u.rung === "exam" && u.nextReview !== null && u.nextReview <= t);
          row.next = !u || !u.started ? "Start with the shortest past-paper questions."
            : u.rung !== "exam" ? "Keep working through the past-paper questions. Two right in a row and it rests."
            : row.reviewDue ? "A review question is due."
            : u.nextReview !== null ? `Secure for now. Next check in ${Math.max(1, Math.ceil((u.nextReview - t) / DAY))} day(s).` : "Secure.";
          return row;
        }
        if (!u || !u.started) { row.next = `Start at level ${levels.find((l) => l >= cfg.startLevel) || levels[levels.length - 1]}.`; return row; }
        row.level = u.rung === "exam" ? "exam" : u.level;
        if (u.refresh && u.refresh.items.length) { row.status = "refresh"; row.next = `Refresh ${u.refresh.items.map((x) => x.name).join(", then ")}, then return at level ${levels[0]}.`; }
        else if (u.rung === "exam") {
          row.reviewDue = u.nextReview !== null && u.nextReview <= t;
          row.status = row.reviewDue ? "review-due" : "exam";
          row.next = row.reviewDue ? "A review question is due." : u.nextReview !== null ? `Exam questions. Next check in ${Math.max(1, Math.ceil((u.nextReview - t) / DAY))} day(s).` : "Secure. Keep sharp with exam questions.";
        } else { row.status = "level"; row.next = `Two in a row at level ${u.level} moves you up.`; }
        return row;
      });
    };

    me.save = () => store.save(me.state);
    me.exportJSON = () => L.exportProgress(me.state, now());
    // Replaces progress with an exported file. The save being replaced is kept under another key.
    me.importJSON = function (text) {
      const state = L.importProgress(text);
      const keptAs = store.keepAside("before_import");
      me.state = state;
      store.save(me.state);
      return { keptAs };
    };
    // Starts again. The old save is kept under another key, never deleted.
    me.reset = function () {
      const keptAs = store.keepAside("before_reset");
      me.state = L.newState(now());
      store.save(me.state);
      return { keptAs };
    };
    // Starts this course again and leaves the other courses alone. The old save is kept aside.
    me.resetCourse = function () {
      const keptAs = store.keepAside("before_reset");
      delete me.state.courses[course];
      me.state.attempts = me.state.attempts.filter((a) => a.course !== course);
      store.save(me.state);
      return { keptAs };
    };
    return me;
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
