/* Graphs for the practice engine: a plain-data graph description in, an SVG string out.
   Pure functions, no DOM; runs in the browser and under Node. Attaches to QBEngine.graph.

   A graph description:
     { x: [min, max], y: [min, max],          the window
       xStep, yStep,                          grid and tick spacing (chosen automatically if absent)
       functions: [{ fn, domain: [a, b], dashed, label }],
       asymptotes: [{ x: 2 }, { y: -1 }],     dashed lines
       points: [{ x, y, label, open }],       marked points (open: hollow circle)
       xLabel, yLabel, alt }                  axis names and a text description
   A function (fn) is plain data too:
     { type: "poly", coeffs: [c0, c1, c2] }             c0 + c1 x + c2 x^2
     { type: "rational", num: [...], den: [...] }       ratio of two polynomials (lowest power first)
     { type: "exp", a, b, h, k }                        a b^(x - h) + k      (b may be "e")
     { type: "log", a, base, h, k }                     a log_base(x - h) + k
     { type: "trig", name: "sin"|"cos"|"tan", a, b, c, d }   a sin(b(x - c)) + d
     { type: "sqrt", a, h, k }                          a sqrt(x - h) + k
     { type: "abs", of: fn }                            |f(x)|
     { type: "pwl", points: [[x, y], ...] }             straight pieces joined up
     { type: "transform", of: fn, a, q, h, k }          a f(q(x - h)) + k
     { type: "sum", of: [fn, ...] }                     f(x) + g(x) + ...
     { type: "product", of: [fn, ...] }                 f(x) g(x) ...
   Missing numbers default to the identity (a = 1, b = 1 or e, h = 0, k = 0, ...). */
(function (root) {
  "use strict";
  const E = (root.QBEngine = root.QBEngine || {});
  const G = (E.graph = {});
  const d = (v, def) => (v === undefined ? def : v);
  const polyAt = (cs, x) => { let s = 0; for (let i = cs.length - 1; i >= 0; i--) s = s * x + cs[i]; return s; };

  G.evaluate = function evaluate(fn, x) {
    switch (fn.type) {
      case "poly": return polyAt(fn.coeffs, x);
      case "rational": { const den = polyAt(fn.den, x); return Math.abs(den) < 1e-12 ? NaN : polyAt(fn.num, x) / den; }
      case "exp": { const b = fn.b === undefined || fn.b === "e" ? Math.E : fn.b; return d(fn.a, 1) * Math.pow(b, x - d(fn.h, 0)) + d(fn.k, 0); }
      case "log": {
        const b = fn.base === undefined || fn.base === "e" ? Math.E : fn.base, u = x - d(fn.h, 0);
        return u <= 0 ? NaN : d(fn.a, 1) * Math.log(u) / Math.log(b) + d(fn.k, 0);
      }
      case "trig": {
        const u = d(fn.b, 1) * (x - d(fn.c, 0));
        if (fn.name === "tan" && Math.abs(Math.cos(u)) < 1e-9) return NaN;
        return d(fn.a, 1) * Math[fn.name](u) + d(fn.d, 0);
      }
      case "sqrt": { const u = x - d(fn.h, 0); return u < 0 ? NaN : d(fn.a, 1) * Math.sqrt(u) + d(fn.k, 0); }
      case "abs": return Math.abs(evaluate(fn.of, x));
      case "pwl": {
        const p = fn.points;
        if (x < p[0][0] - 1e-9 || x > p[p.length - 1][0] + 1e-9) return NaN;
        for (let i = 1; i < p.length; i++) {
          if (x <= p[i][0] + 1e-9) {
            const w = p[i][0] - p[i - 1][0];
            return w === 0 ? p[i][1] : p[i - 1][1] + ((x - p[i - 1][0]) / w) * (p[i][1] - p[i - 1][1]);
          }
        }
        return NaN;
      }
      case "transform": return d(fn.a, 1) * evaluate(fn.of, d(fn.q, 1) * (x - d(fn.h, 0))) + d(fn.k, 0);
      case "sum": return fn.of.reduce((s, f) => s + evaluate(f, x), 0);
      case "product": return fn.of.reduce((s, f) => s * evaluate(f, x), 1);
      default: throw new Error("unknown function type " + fn.type);
    }
  };

  function niceStep(span) {
    const raw = span / 8, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
  }
  // Pieces of each curve inside the window, in graph coordinates: [[{x, y}, ...], ...] per function.
  G.pieces = function (graph, samples) {
    const [x0, x1] = graph.x, [y0, y1] = graph.y, n = samples || 400, h = y1 - y0;
    return (graph.functions || []).map((f) => {
      const a = Math.max(x0, f.domain ? f.domain[0] : x0), b = Math.min(x1, f.domain ? f.domain[1] : x1);
      const out = [];
      let cur = [], prev = null;
      const inside = (p) => p && isFinite(p.y) && p.y >= y0 && p.y <= y1;
      const edge = (p, q) => {
        // where the segment from inside point p to outside point q leaves the window
        const yb = q.y > y1 ? y1 : y0, t = (yb - p.y) / (q.y - p.y);
        return { x: p.x + t * (q.x - p.x), y: yb };
      };
      for (let i = 0; i <= n; i++) {
        const x = a + ((b - a) * i) / n, p = { x, y: G.evaluate(f.fn, x) };
        const okP = inside(p), okPrev = inside(prev);
        const jump = prev && isFinite(prev.y) && isFinite(p.y) && Math.abs(p.y - prev.y) > h;
        if (okP) {
          if (!okPrev && prev && isFinite(prev.y) && !jump) cur.push(edge(p, prev));
          else if (jump && cur.length) { out.push(cur); cur = []; }
          cur.push(p);
        } else {
          if (okPrev && isFinite(p.y) && !jump) cur.push(edge(prev, p));
          if (cur.length) { out.push(cur); cur = []; }
        }
        prev = p;
      }
      if (cur.length) out.push(cur);
      return out.filter((piece) => piece.length > 1);
    });
  };

  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const tick = (v) => { const s = String(Number(v.toPrecision(10))); return s.replace("-", "−"); };

  // Draws the graph. opts: {width, height, label} (label: a letter shown in the corner, for
  // pick-the-graph options). Colours come from currentColor and the classes qb-graph-*, with
  // inline fallbacks so the SVG also stands alone.
  G.toSVG = function (graph, opts) {
    opts = opts || {};
    const W = opts.width || 320, H = opts.height || 240, pad = 14;
    const [x0, x1] = graph.x, [y0, y1] = graph.y;
    if (!(x1 > x0) || !(y1 > y0)) throw new Error("graph window is empty");
    const sx = (x) => pad + ((x - x0) / (x1 - x0)) * (W - 2 * pad);
    const sy = (y) => H - pad - ((y - y0) / (y1 - y0)) * (H - 2 * pad);
    const r2 = (v) => Math.round(v * 100) / 100;
    const xs = graph.xStep || niceStep(x1 - x0), ys = graph.yStep || niceStep(y1 - y0);
    const ax = Math.min(Math.max(0, x0), x1), ay = Math.min(Math.max(0, y0), y1);
    const out = [];
    out.push(`<svg xmlns="http://www.w3.org/2000/svg" class="qb-graph" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(graph.alt || "Graph")}" font-family="inherit" font-size="10">`);
    const grid = [], labels = [];
    for (let k = Math.ceil(x0 / xs - 1e-9); k * xs <= x1 + 1e-9; k++) {
      const x = k * xs;
      grid.push(`M${r2(sx(x))} ${r2(sy(y0))}V${r2(sy(y1))}`);
      if (Math.abs(x) > 1e-9 && sx(x) > pad + 4 && sx(x) < W - pad - 4) labels.push(`<text x="${r2(sx(x))}" y="${r2(Math.min(sy(ay) + 11, H - 2))}" text-anchor="middle">${tick(x)}</text>`);
    }
    for (let k = Math.ceil(y0 / ys - 1e-9); k * ys <= y1 + 1e-9; k++) {
      const y = k * ys;
      grid.push(`M${r2(sx(x0))} ${r2(sy(y))}H${r2(sx(x1))}`);
      if (Math.abs(y) > 1e-9 && sy(y) > pad + 4 && sy(y) < H - pad - 4) labels.push(`<text x="${r2(Math.max(sx(ax) - 4, 12))}" y="${r2(sy(y) + 3)}" text-anchor="end">${tick(y)}</text>`);
    }
    out.push(`<path class="qb-graph-grid" d="${grid.join("")}" fill="none" stroke="currentColor" stroke-opacity="0.15" stroke-width="1"/>`);
    out.push(`<path class="qb-graph-axis" d="M${r2(sx(x0))} ${r2(sy(ay))}H${r2(sx(x1))}M${r2(sx(ax))} ${r2(sy(y0))}V${r2(sy(y1))}" fill="none" stroke="currentColor" stroke-width="1.2"/>`);
    out.push(`<g class="qb-graph-ticks" fill="currentColor" fill-opacity="0.75">${labels.join("")}`);
    out.push(`<text x="${r2(W - 3)}" y="${r2(Math.max(sy(ay) - 4, 9))}" text-anchor="end" font-style="italic">${esc(graph.xLabel || "x")}</text>`);
    out.push(`<text x="${r2(Math.min(sx(ax) + 5, W - 10))}" y="9" font-style="italic">${esc(graph.yLabel || "y")}</text></g>`);
    for (const a of graph.asymptotes || []) {
      if (a.x !== undefined && a.x >= x0 && a.x <= x1) out.push(`<path class="qb-graph-asymptote" d="M${r2(sx(a.x))} ${r2(sy(y0))}V${r2(sy(y1))}" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="5 4"/>`);
      if (a.y !== undefined && a.y >= y0 && a.y <= y1) out.push(`<path class="qb-graph-asymptote" d="M${r2(sx(x0))} ${r2(sy(a.y))}H${r2(sx(x1))}" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="5 4"/>`);
    }
    G.pieces(graph).forEach((pieces, i) => {
      const f = graph.functions[i];
      const path = pieces.map((piece) => piece.map((p, j) => `${j ? "L" : "M"}${r2(sx(p.x))} ${r2(sy(p.y))}`).join("")).join("");
      if (path) out.push(`<path class="qb-graph-curve qb-graph-curve-${i}" d="${path}" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"${f.dashed ? ' stroke-dasharray="6 4"' : ""}/>`);
      if (f.label && pieces.length) {
        const last = pieces[pieces.length - 1], p = last[Math.floor(last.length * 0.85)];
        out.push(`<text class="qb-graph-label" x="${r2(Math.min(sx(p.x) + 5, W - 12))}" y="${r2(Math.max(sy(p.y) - 5, 10))}" fill="currentColor" font-style="italic">${esc(f.label)}</text>`);
      }
    });
    for (const p of graph.points || []) {
      if (p.x < x0 || p.x > x1 || p.y < y0 || p.y > y1) continue;
      out.push(`<circle class="qb-graph-point" cx="${r2(sx(p.x))}" cy="${r2(sy(p.y))}" r="3.2" fill="${p.open ? "none" : "currentColor"}" stroke="currentColor" stroke-width="1.4"/>`);
      if (p.label) out.push(`<text class="qb-graph-label" x="${r2(Math.min(sx(p.x) + 6, W - 14))}" y="${r2(Math.max(sy(p.y) - 6, 10))}" fill="currentColor">${esc(p.label)}</text>`);
    }
    if (opts.label) out.push(`<text class="qb-graph-option" x="${W - 6}" y="${H - 6}" text-anchor="end" font-size="13" font-weight="bold" fill="currentColor">${esc(opts.label)}</text>`);
    out.push("</svg>");
    return out.join("");
  };

  // How different two graphs look, 0 (identical) to 1: the share of the window's width where
  // the curves are further apart than 4% of its height (or one is drawn and the other is not),
  // or 1 when marked points or asymptotes differ.
  G.difference = function (g1, g2) {
    const key = (g) => JSON.stringify([(g.points || []).map((p) => [p.x, p.y, Boolean(p.open)]).sort(), (g.asymptotes || []).map((a) => [a.x, a.y]).sort(), g.x, g.y]);
    if (key(g1) !== key(g2)) return 1;
    const n1 = (g1.functions || []).length, n2 = (g2.functions || []).length;
    if (n1 !== n2) return 1;
    const [x0, x1] = g1.x, [y0, y1] = g1.y, N = 200, tol = 0.04 * (y1 - y0);
    let worst = 0;
    for (let i = 0; i < n1; i++) {
      const f1 = g1.functions[i], f2 = g2.functions[i];
      let diff = 0;
      for (let k = 0; k <= N; k++) {
        const x = x0 + ((x1 - x0) * k) / N;
        const at = (f) => {
          if (f.domain && (x < f.domain[0] - 1e-9 || x > f.domain[1] + 1e-9)) return NaN;
          const y = G.evaluate(f.fn, x);
          return isFinite(y) && y >= y0 && y <= y1 ? y : NaN;
        };
        const a = at(f1), b = at(f2);
        if (isNaN(a) !== isNaN(b) || (!isNaN(a) && Math.abs(a - b) > tol)) diff++;
      }
      worst = Math.max(worst, diff / (N + 1));
    }
    return worst;
  };
  // True when a student could tell the two graphs apart at a glance.
  G.distinct = (g1, g2) => G.difference(g1, g2) >= 0.12;
  // From candidate wrong graphs, the first n that look different from the correct one and from each other.
  G.pickDistinct = function (correct, candidates, n) {
    const kept = [];
    for (const c of candidates) {
      const g = c.graph || c;
      if (kept.length < n && G.distinct(correct, g) && kept.every((k) => G.distinct(k.graph || k, g))) kept.push(c);
    }
    return kept;
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
