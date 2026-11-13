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
   Missing numbers default to the identity (a = 1, b = 1 or e, h = 0, k = 0, ...).
   A plot may shade regions:
     regions: [{ x: [a, b], fn, to }]         between fn and the x-axis, or between fn and to, for a <= x <= b
                                              (fn and to: an index into functions, or a function description)

   A figure (a geometry diagram) is a graph description with `shapes` instead of a window:
     { shapes: [shape, ...], alt }
   Coordinates are ordinary (x right, y up) in any unit; the figure is scaled to fit, the same in both
   directions, so it is drawn to scale. Angles are in degrees, anticlockwise from the positive x direction.
   Labels are plain text ("8 cm", "40°", "A"); they are placed clear of the lines automatically.
     { type: "point", at: [x, y], label, dot, dir }      dot: false for a named vertex with no dot;
                                                         dir: [dx, dy] forces the side the label goes
     { type: "line", from, to, dashed, label, arrow, side }   arrow: "end" or "mid"; side: 1 (left of
                                                         from -> to) or -1 forces the label's side
     { type: "polygon", points: [[x, y], ...], labels: ["A", ...], sides: ["5 cm", null, ...], fill, dashed }
                                                         sides[i] labels the edge from points[i] to the next
     { type: "angle", at, from, to, label, right, sweep, radius }   the angle at `at` between the rays to
                                                         `from` and `to`: the smaller one, or with sweep
                                                         "ccw"/"cw" the one turning that way from `from`
                                                         to `to`; right: true draws the square
     { type: "arc", centre, radius, from, to, dashed, label }      anticlockwise from angle `from` to `to`
     { type: "sector", centre, radius, from, to, fill, label }     two radii and the arc; label: on the arc
     { type: "segment", centre, radius, from, to, fill }           between the chord and the arc
     { type: "circle", centre, radius, dashed, fill }
     { type: "north", at, length }                       a north arrow from `at` (length in figure units)
     { type: "text", at, text }                          free text centred at a point
   fill: true shades the shape; stroke: false on any shape leaves its outline out (a shaded region only). */
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

  // The outline of each shaded region, in graph coordinates, clipped to the window.
  G.regionOutlines = function (graph, samples) {
    const [x0, x1] = graph.x, [y0, y1] = graph.y, n = samples || 160;
    const fnOf = (r) => (typeof r === "number" ? (graph.functions[r] || {}).fn : r);
    return (graph.regions || []).map((r) => {
      const f = fnOf(r.fn), g = r.to === undefined ? null : fnOf(r.to);
      if (!f || (r.to !== undefined && !g)) throw new Error("region refers to a function that is not there");
      const a = Math.max(x0, r.x[0]), b = Math.min(x1, r.x[1]), top = [], bottom = [];
      if (!(b > a)) return [];
      const clip = (y) => Math.min(y1, Math.max(y0, y));
      for (let i = 0; i <= n; i++) {
        const x = a + ((b - a) * i) / n, y = G.evaluate(f, x), z = g ? G.evaluate(g, x) : 0;
        if (!isFinite(y) || !isFinite(z)) continue;
        top.push({ x, y: clip(y) }); bottom.push({ x, y: clip(z) });
      }
      return top.concat(bottom.reverse());
    });
  };

  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const tick = (v) => { const s = String(Number(v.toPrecision(10))); return s.replace("-", "−"); };

  // Draws the graph. opts: {width, height, label} (label: a letter shown in the corner, for
  // pick-the-graph options). Colours come from currentColor and the classes qb-graph-*, with
  // inline fallbacks so the SVG also stands alone.
  G.toSVG = function (graph, opts) {
    opts = opts || {};
    if (graph.shapes) return figureSVG(graph, opts);
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
    // Every grid line is drawn, but a number is printed only as often as there is room for it,
    // so small graphs (pick-the-graph options) do not get overlapping labels.
    const widest = Math.max(String(tick(x0)).length, String(tick(x1)).length, String(tick(x1 - xs)).length);
    const everyX = Math.max(1, Math.ceil((widest * 6 + 8) / ((xs / (x1 - x0)) * (W - 2 * pad))));
    const everyY = Math.max(1, Math.ceil(13 / ((ys / (y1 - y0)) * (H - 2 * pad))));
    for (let k = Math.ceil(x0 / xs - 1e-9); k * xs <= x1 + 1e-9; k++) {
      const x = k * xs;
      grid.push(`M${r2(sx(x))} ${r2(sy(y0))}V${r2(sy(y1))}`);
      if (k % everyX === 0 && Math.abs(x) > 1e-9 && sx(x) > pad + 4 && sx(x) < W - pad - 4) labels.push(`<text x="${r2(sx(x))}" y="${r2(Math.min(sy(ay) + 11, H - 2))}" text-anchor="middle">${tick(x)}</text>`);
    }
    for (let k = Math.ceil(y0 / ys - 1e-9); k * ys <= y1 + 1e-9; k++) {
      const y = k * ys;
      grid.push(`M${r2(sx(x0))} ${r2(sy(y))}H${r2(sx(x1))}`);
      if (k % everyY === 0 && Math.abs(y) > 1e-9 && sy(y) > pad + 4 && sy(y) < H - pad - 4) labels.push(`<text x="${r2(Math.max(sx(ax) - 4, 12))}" y="${r2(sy(y) + 3)}" text-anchor="end">${tick(y)}</text>`);
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
    for (const pts of G.regionOutlines(graph)) {
      if (pts.length > 2) out.push(`<path class="qb-graph-shade" d="${pts.map((p, j) => `${j ? "L" : "M"}${r2(sx(p.x))} ${r2(sy(p.y))}`).join("")}Z" fill="currentColor" fill-opacity="0.16" stroke="none"/>`);
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

  // ------------------------------------------------------------------------------------------
  // Figures: geometry diagrams. Everything is laid out in pixels by figureLayout(), which both
  // toSVG() and figureInfo() (used by the checks) read.
  // ------------------------------------------------------------------------------------------
  const textWidth = (str, fs) => {
    let w = 0;
    for (const ch of String(str)) w += /[0-9]/.test(ch) ? 0.56 : /[A-Z]/.test(ch) ? 0.68 : /[ .,:']/.test(ch) ? 0.28 : ch === "°" ? 0.4 : 0.54;
    return w * fs;
  };
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]], add = (a, b) => [a[0] + b[0], a[1] + b[1]], mul = (a, k) => [a[0] * k, a[1] * k];
  const len = (a) => Math.hypot(a[0], a[1]), unitV = (a) => { const l = len(a); return l < 1e-12 ? [0, 0] : [a[0] / l, a[1] / l]; };
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
  const same = (a, b) => Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9;
  const mod360 = (a) => ((a % 360) + 360) % 360;
  const dirDeg = (v) => (Math.atan2(v[1], v[0]) * 180) / Math.PI;
  const polar = (c, r, a) => [c[0] + r * Math.cos((a * Math.PI) / 180), c[1] + r * Math.sin((a * Math.PI) / 180)];
  const arcPoints = (c, r, from, to) => {
    let span = mod360(to - from); if (span < 1e-9) span = 360;
    const n = Math.max(6, Math.ceil(span / 3)), pts = [];
    for (let i = 0; i <= n; i++) pts.push(polar(c, r, from + (span * i) / n));
    return pts;
  };
  // the angle an "angle" shape marks: its start direction and its size, in degrees (figure coordinates)
  function angleSpan(sh) {
    const a1 = dirDeg(sub(sh.from, sh.at)), a2 = dirDeg(sub(sh.to, sh.at)), ccw = mod360(a2 - a1);
    if (sh.sweep === "ccw") return [a1, ccw];
    if (sh.sweep === "cw") return [a2, 360 - ccw];
    return ccw <= 180 ? [a1, ccw] : [a2, 360 - ccw];
  }
  // Problems with the description itself (not with how it is drawn).
  function figureProblems(shapes) {
    const bad = [], fin = (p) => Array.isArray(p) && p.length === 2 && isFinite(p[0]) && isFinite(p[1]);
    shapes.forEach((sh, i) => {
      const say = (m) => bad.push(`shape ${i} (${sh.type}): ${m}`);
      const round = () => { if (!fin(sh.centre)) say("centre is not a point"); if (!(sh.radius > 0)) say("radius is not positive"); };
      const span = () => { if (!isFinite(sh.from) || !isFinite(sh.to)) say("angles are not numbers"); else if (mod360(sh.to - sh.from) < 1) say("the arc has no size"); };
      switch (sh.type) {
        case "point": if (!fin(sh.at)) say("at is not a point"); break;
        case "text": if (!fin(sh.at)) say("at is not a point"); if (!sh.text) say("no text"); break;
        case "line": if (!fin(sh.from) || !fin(sh.to)) say("ends are not points"); else if (len(sub(sh.to, sh.from)) < 1e-9) say("has no length"); break;
        case "polygon": {
          const p = sh.points || [];
          if (p.length < 3 || !p.every(fin)) { say("needs three or more points"); break; }
          let area = 0, per = 0;
          for (let k = 0; k < p.length; k++) { const q = p[(k + 1) % p.length]; area += p[k][0] * q[1] - q[0] * p[k][1]; per += len(sub(q, p[k])); }
          if (Math.abs(area) / 2 < 1e-4 * per * per) say("has no area");
          break;
        }
        case "angle": {
          if (!fin(sh.at) || !fin(sh.from) || !fin(sh.to)) { say("at, from and to must be points"); break; }
          if (len(sub(sh.from, sh.at)) < 1e-9 || len(sub(sh.to, sh.at)) < 1e-9) { say("a ray has no length"); break; }
          const sp = angleSpan(sh)[1]; if (sp < 1 || sp > 359) say("the angle has no size");
          break;
        }
        case "arc": case "sector": case "segment": round(); span(); break;
        case "circle": round(); break;
        case "north": if (!fin(sh.at)) say("at is not a point"); break;
        default: say("unknown shape type");
      }
    });
    return bad;
  }

  // One layout pass at a given scale, with the figure origin at pixel (0, 0).
  function figurePass(shapes, s, fs) {
    const T = (p) => [p[0] * s, -p[1] * s];
    const paths = [], dots = [], heads = [], reqs = [], segs = [], free = [];
    const path = (pts, o) => {
      paths.push(Object.assign({ pts }, o));
      if (o.stroke === false) return;
      for (let i = 1; i < pts.length; i++) segs.push([pts[i - 1], pts[i]]);
      if (o.closed) segs.push([pts[pts.length - 1], pts[0]]);
    };
    // key points (for the centroid) and edges (for where a vertex label has room), in pixels
    const keys = [], edges = [];
    const key = (p) => { if (!keys.some((k) => same(k, p))) keys.push(p); };
    for (const sh of shapes) {
      if (sh.type === "line") { key(T(sh.from)); key(T(sh.to)); edges.push([T(sh.from), T(sh.to)]); }
      else if (sh.type === "polygon") sh.points.forEach((p, i) => { key(T(p)); edges.push([T(p), T(sh.points[(i + 1) % sh.points.length])]); });
      else if (sh.type === "point") key(T(sh.at));
      else if (sh.type === "sector" || sh.type === "segment" || sh.type === "arc") {
        const A = T(polar(sh.centre, sh.radius, sh.from)), B = T(polar(sh.centre, sh.radius, sh.to));
        key(A); key(B); key(T(polar(sh.centre, sh.radius, sh.from + mod360(sh.to - sh.from) / 2)));
        if (sh.type === "sector") { key(T(sh.centre)); edges.push([T(sh.centre), A], [T(sh.centre), B]); }
        if (sh.type === "segment") edges.push([A, B]);
        // the arc leaves each end along its tangent: a short edge keeps vertex labels off it
        if (sh.stroke !== false) {
          const d = Math.min(12, mod360(sh.to - sh.from) / 2);
          edges.push([A, T(polar(sh.centre, sh.radius, sh.from + d))], [B, T(polar(sh.centre, sh.radius, sh.to - d))]);
        }
      } else if (sh.type === "circle") key(T(sh.centre));
      else if (sh.type === "north") edges.push([T(sh.at), add(T(sh.at), [0, -40])]);
      else if (sh.type === "angle" && !sh.right) {
        // an angle mark takes up the room between its rays
        const [start, span] = angleSpan(sh), V = T(sh.at), n = Math.ceil(span / 30);
        for (let i = 0; i <= n; i++) { const a = ((start + (span * i) / n) * Math.PI) / 180; edges.push([V, add(V, [40 * Math.cos(a), -40 * Math.sin(a)])]); }
      }
    }
    const C = keys.length ? mul(keys.reduce(add, [0, 0]), 1 / keys.length) : [0, 0];
    const away = (p, fallback) => { const v = sub(p, C); return len(v) < 2 ? fallback || [0, -1] : unitV(v); };
    // the direction with the most room at p: the middle of the widest gap between the lines meeting there
    const roomiest = (p) => {
      const dirs = [];
      for (const [a, b] of edges) {
        if (len(sub(a, p)) < 0.5) dirs.push(unitV(sub(b, p)));
        else if (len(sub(b, p)) < 0.5) dirs.push(unitV(sub(a, p)));
        else {
          const ab = sub(b, a), t = dot(sub(p, a), ab) / dot(ab, ab), foot = add(a, mul(ab, t));
          if (t > 0 && t < 1 && len(sub(p, foot)) < 0.5) dirs.push(unitV(sub(b, p)), unitV(sub(a, p)));
        }
      }
      if (!dirs.length) return away(p);
      const out = away(p, [0, 0]);
      const angs = dirs.map(dirDeg).sort((x, y) => x - y);
      let best = null;
      for (let i = 0; i < angs.length; i++) {
        const gap = i + 1 < angs.length ? angs[i + 1] - angs[i] : angs[0] + 360 - angs[i], mid = angs[i] + gap / 2;
        const u = [Math.cos((mid * Math.PI) / 180), Math.sin((mid * Math.PI) / 180)], score = gap + 20 * dot(u, out);
        if (!best || score > best.score + 1e-9) best = { score, u };
      }
      return best.u;
    };
    const ask = (text, kind, o) => { if (text !== undefined && text !== null && text !== "") reqs.push(Object.assign({ text: String(text), kind, w: textWidth(text, fs), h: fs }, o)); };
    const head = (tip, u) => { const n = [-u[1], u[0]], b = sub(tip, mul(u, 8)); heads.push([tip, add(b, mul(n, 3.4)), sub(b, mul(n, 3.4))]); };

    for (const sh of shapes) {
      const o = { dashed: Boolean(sh.dashed), fill: Boolean(sh.fill), stroke: sh.stroke !== false };
      switch (sh.type) {
        case "point":
          if (sh.dot !== false) dots.push(T(sh.at));
          ask(sh.label, "point", { at: T(sh.at), u: sh.dir ? unitV([sh.dir[0], -sh.dir[1]]) : roomiest(T(sh.at)), gap: sh.dot !== false ? 6 : 3 });
          break;
        case "text": free.push({ text: String(sh.text), at: T(sh.at), w: textWidth(sh.text, fs), h: fs }); break;
        case "line": {
          const a = T(sh.from), b = T(sh.to), u = unitV(sub(b, a));
          path([a, b], Object.assign(o, { fill: false, cls: "line" }));
          if (sh.arrow) head(sh.arrow === "mid" ? add(mul(add(a, b), 0.5), mul(u, 4)) : b, u);
          let n = [u[1], -u[0]]; // left of from -> to, as the figure is read (y up)
          if (sh.side === -1) n = mul(n, -1);
          else if (sh.side !== 1 && dot(n, sub(mul(add(a, b), 0.5), C)) < -0.5) n = mul(n, -1);
          ask(sh.label, "line", { a, b, n, fixed: sh.side === 1 || sh.side === -1 });
          break;
        }
        case "polygon": {
          const pts = sh.points.map(T), pc = mul(pts.reduce(add, [0, 0]), 1 / pts.length);
          path(pts, Object.assign(o, { closed: true, cls: "polygon" }));
          (sh.labels || []).forEach((t, i) => ask(t, "point", { at: pts[i], u: roomiest(pts[i]), gap: 3 }));
          (sh.sides || []).forEach((t, i) => {
            const a = pts[i], b = pts[(i + 1) % pts.length], u = unitV(sub(b, a));
            let n = [u[1], -u[0]];
            if (dot(n, sub(mul(add(a, b), 0.5), pc)) < 0) n = mul(n, -1); // away from the polygon's own centre
            ask(t, "line", { a, b, n });
          });
          break;
        }
        case "angle": {
          const V = T(sh.at), [start, span] = angleSpan(sh);
          const room = Math.min(len(sub(T(sh.from), V)), len(sub(T(sh.to), V)));
          const at = (r, a) => [V[0] + r * Math.cos((a * Math.PI) / 180), V[1] - r * Math.sin((a * Math.PI) / 180)];
          let r;
          if (sh.right) {
            r = Math.min(9, room * 0.3);
            path([at(r, start), add(at(r, start), sub(at(r, start + span), V)), at(r, start + span)], { cls: "angle" });
          } else {
            r = sh.radius || (span < 25 ? 34 : span < 45 ? 27 : span < 100 ? 20 : 15);
            r = Math.max(7, Math.min(r, room * 0.42));
            const n = Math.max(4, Math.ceil(span / 4)), pts = [];
            for (let i = 0; i <= n; i++) pts.push(at(r, start + (span * i) / n));
            path(pts, { cls: "angle" });
          }
          const mid = start + span / 2, u = [Math.cos((mid * Math.PI) / 180), -Math.sin((mid * Math.PI) / 180)];
          ask(sh.label, "angle", { at: V, u, r, room, half: span / 2, rays: [start, start + span].map((a) => [Math.cos((a * Math.PI) / 180), -Math.sin((a * Math.PI) / 180)]) });
          break;
        }
        case "arc": case "sector": case "segment": {
          const arc = arcPoints(sh.centre, sh.radius, sh.from, sh.to).map(T), c = T(sh.centre);
          if (sh.type === "arc") path(arc, Object.assign(o, { fill: false, cls: "arc" }));
          else path(sh.type === "sector" ? [c].concat(arc) : arc, Object.assign(o, { closed: true, cls: sh.type }));
          const m = T(polar(sh.centre, sh.radius, sh.from + mod360(sh.to - sh.from) / 2));
          ask(sh.label, "point", { at: m, u: unitV(sub(m, c)), gap: 3, straight: true });
          break;
        }
        case "circle": path(arcPoints(sh.centre, sh.radius, 0, 360).slice(0, -1).map(T), Object.assign(o, { closed: true, cls: "circle" })); break;
        case "north": {
          const a = T(sh.at), b = [a[0], a[1] - Math.max(30, (sh.length || 0) * s)];
          path([a, b], { cls: "north" });
          head(b, [0, -1]);
          ask("N", "point", { at: b, u: [0, -1], gap: 2 });
          break;
        }
      }
    }

    // ---- labels: each goes at the first position that is clear of every line and every other label
    const boxes = [];
    const ext = (u, q) => (Math.abs(u[0]) * q.w + Math.abs(u[1]) * q.h) / 2;
    const hitsSeg = (b, [p, q]) => {
      // segment against rectangle (Liang-Barsky)
      let t0 = 0, t1 = 1;
      const d = sub(q, p);
      for (const [pp, qq] of [[-d[0], p[0] - b.x0], [d[0], b.x1 - p[0]], [-d[1], p[1] - b.y0], [d[1], b.y1 - p[1]]]) {
        if (Math.abs(pp) < 1e-12) { if (qq < 0) return false; } else { const t = qq / pp; if (pp < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; } }
      }
      return true;
    };
    const boxAt = (c, q, pad) => ({ x0: c[0] - q.w / 2 - pad, x1: c[0] + q.w / 2 + pad, y0: c[1] - q.h / 2 - pad, y1: c[1] + q.h / 2 + pad });
    const clear = (c, q) => {
      const b = boxAt(c, q, 1.5);
      if (boxes.some((o) => b.x0 < o.x1 + 1 && b.x1 > o.x0 - 1 && b.y0 < o.y1 + 1 && b.y1 > o.y0 - 1)) return false;
      if (dots.some((p) => p[0] > b.x0 - 3 && p[0] < b.x1 + 3 && p[1] > b.y0 - 3 && p[1] < b.y1 + 3)) return false;
      return !segs.some((sg) => hitsSeg(b, sg)) && !heads.some((h) => hitsSeg(b, [h[1], h[2]]));
    };
    const rot = (u, a) => { const c = Math.cos((a * Math.PI) / 180), sn = Math.sin((a * Math.PI) / 180); return [u[0] * c - u[1] * sn, u[0] * sn + u[1] * c]; };
    const place = (q) => {
      const tries = [];
      if (q.kind === "angle") {
        // on the bisector, outside the arc and far enough out to sit between the two rays
        let R = q.r + 3 + ext(q.u, q);
        if (q.half < 88) for (const ray of q.rays) R = Math.max(R, (ext([-ray[1], ray[0]], q) + 3.5) / Math.sin((q.half * Math.PI) / 180));
        // (only while that keeps the label near its vertex)
        for (let k = 0; k <= 10; k++) if (R + 3 * k + q.w / 2 <= Math.max(0.85 * q.room, q.r + 3 + ext(q.u, q) + 15)) tries.push(add(q.at, mul(q.u, R + 3 * k)));
        // no room between the rays: beside the arc, just outside one of them
        for (const ray of q.rays) {
          let n = [-ray[1], ray[0]];
          if (dot(n, q.u) > 0) n = mul(n, -1);
          for (let k = 0; k <= 3; k++) tries.push(add(add(q.at, mul(ray, q.r + q.w / 2 + 2)), mul(n, 4 + ext(n, q) + 3 * k)));
        }
      } else if (q.kind === "point") {
        for (const a of q.straight ? [0] : [0, 25, -25, 50, -50, 75, -75, 105, -105, 140, -140, 180]) {
          const u = rot(q.u, a);
          for (let k = 0; k <= (a ? 4 : 6); k++) tries.push(add(q.at, mul(u, q.gap + ext(u, q) + 3 * k)));
        }
      } else {
        for (const side of q.fixed ? [1] : [1, -1]) for (const t of [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8]) {
          const n = mul(q.n, side), mid = add(q.a, mul(sub(q.b, q.a), t));
          for (let k = 0; k <= 4; k++) tries.push(add(mid, mul(n, 5 + ext(n, q) + 3 * k)));
        }
        // a crowded line: further out
        if (!q.fixed) for (const side of [1, -1]) for (let k = 5; k <= 9; k++) tries.push(add(mul(add(q.a, q.b), 0.5), mul(q.n, side * (5 + ext(q.n, q) + 3 * k))));
      }
      q.c = tries.find((t) => clear(t, q)) || tries[0];
      q.ok = clear(q.c, q);
      boxes.push(boxAt(q.c, q, 0));
    };
    for (const f of free) { f.c = f.at; f.ok = true; boxes.push(boxAt(f.at, f, 0)); }
    for (const kind of ["angle", "point", "line"]) reqs.filter((q) => q.kind === kind).forEach(place);
    const labels = free.concat(reqs);

    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    const grow = (p, m) => { x0 = Math.min(x0, p[0] - m); x1 = Math.max(x1, p[0] + m); y0 = Math.min(y0, p[1] - m); y1 = Math.max(y1, p[1] + m); };
    paths.forEach((p) => p.pts.forEach((q) => grow(q, 1))); dots.forEach((p) => grow(p, 3)); heads.forEach((h) => h.forEach((q) => grow(q, 0)));
    labels.forEach((q) => { grow([q.c[0] - q.w / 2, q.c[1] - q.h / 2], 1); grow([q.c[0] + q.w / 2, q.c[1] + q.h / 2], 1); });
    return { paths, dots, heads, labels, box: { x0, x1, y0, y1 } };
  }

  // The finished layout in pixels inside a W by H box.
  function figureLayout(graph, W, H) {
    const shapes = graph.shapes || [], problems = figureProblems(shapes);
    if (problems.length) throw new Error(problems[0]);
    if (!shapes.length) throw new Error("the figure has no shapes");
    const fs = W >= 300 ? 12 : 10.5, pad = 8;
    let s = 1, pass = figurePass(shapes, s, fs);
    const fit = () => Math.min((W - 2 * pad) / Math.max(pass.box.x1 - pass.box.x0, 1e-9), (H - 2 * pad) / Math.max(pass.box.y1 - pass.box.y0, 1e-9));
    for (let i = 0; i < 14; i++) {
      const f = fit();
      if (i >= 7 && f >= 1) break;
      s *= f * (i < 7 ? 0.995 : 0.97);
      pass = figurePass(shapes, s, fs);
    }
    const dx = (W - (pass.box.x1 + pass.box.x0)) / 2, dy = (H - (pass.box.y1 + pass.box.y0)) / 2, mv = (p) => [p[0] + dx, p[1] + dy];
    return {
      fs, scale: s,
      paths: pass.paths.map((p) => Object.assign({}, p, { pts: p.pts.map(mv) })), dots: pass.dots.map(mv), heads: pass.heads.map((h) => h.map(mv)),
      labels: pass.labels.map((q) => ({ text: q.text, kind: q.kind || "text", x: q.c[0] + dx, y: q.c[1] + dy, w: q.w, h: q.h, clear: q.ok })),
    };
  }

  // What the checks need to know about a figure: its labels (centre and size in pixels) and anything wrong.
  G.figureInfo = function (graph, opts) {
    opts = opts || {};
    const bad = figureProblems(graph.shapes || []);
    if (bad.length || !(graph.shapes || []).length) return { labels: [], problems: bad.length ? bad : ["the figure has no shapes"] };
    const L = figureLayout(graph, opts.width || 320, opts.height || 240);
    const problems = L.labels.filter((q) => !q.clear).map((q) => `label "${q.text}" overlaps a line or another label`);
    if (!(L.scale > 1e-9) || !isFinite(L.scale)) problems.push("the figure has no size");
    return { labels: L.labels, scale: L.scale, problems };
  };

  function figureSVG(graph, opts) {
    const W = opts.width || 320, H = opts.height || 240, L = figureLayout(graph, W, H), r2 = (v) => Math.round(v * 100) / 100;
    const d = (p) => p.pts.map((q, j) => `${j ? "L" : "M"}${r2(q[0])} ${r2(q[1])}`).join("") + (p.closed ? "Z" : "");
    const out = [`<svg xmlns="http://www.w3.org/2000/svg" class="qb-graph qb-graph-figure" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(graph.alt || "Diagram")}" font-family="inherit" font-size="${L.fs}">`];
    for (const p of L.paths) if (p.fill) out.push(`<path class="qb-graph-shade" d="${d(p)}" fill="currentColor" fill-opacity="0.16" stroke="none"/>`);
    for (const p of L.paths) {
      if (p.stroke === false) continue;
      const thin = p.cls === "angle" || p.cls === "north";
      out.push(`<path class="qb-graph-${thin ? p.cls : "shape"}" d="${d(p)}" fill="none" stroke="currentColor" stroke-width="${thin ? 1.1 : 1.6}" stroke-linejoin="round" stroke-linecap="round"${p.dashed ? ' stroke-dasharray="5 4"' : ""}/>`);
    }
    for (const h of L.heads) out.push(`<path class="qb-graph-arrow" d="M${r2(h[0][0])} ${r2(h[0][1])}L${r2(h[1][0])} ${r2(h[1][1])}L${r2(h[2][0])} ${r2(h[2][1])}Z" fill="currentColor" stroke="none"/>`);
    for (const p of L.dots) out.push(`<circle class="qb-graph-point" cx="${r2(p[0])}" cy="${r2(p[1])}" r="2.6" fill="currentColor" stroke="currentColor" stroke-width="1"/>`);
    for (const q of L.labels) out.push(`<text class="qb-graph-label" x="${r2(q.x)}" y="${r2(q.y + 0.35 * L.fs)}" text-anchor="middle" fill="currentColor"${/^[a-zα-ω]$/.test(q.text) ? ` font-style="italic" font-family="KaTeX_Math, 'Times New Roman', serif" font-size="${r2(L.fs * 1.15)}"` : ""}>${esc(q.text)}</text>`);
    if (opts.label) out.push(`<text class="qb-graph-option" x="${W - 6}" y="${H - 6}" text-anchor="end" font-size="13" font-weight="bold" fill="currentColor">${esc(opts.label)}</text>`);
    out.push("</svg>");
    return out.join("");
  }

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
