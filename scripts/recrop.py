"""Re-crop question and markscheme images from the full IB exam PDFs.

Question boundaries come from the PDF text layer, not from pixels:
  paper       "N."  + "[Maximum mark: M]"  ->  up to the next question's heading
  markscheme  "N."  at the left margin      ->  "Total [M marks]"
Page furniture (page number, paper code, barcode, "Turn over", crop marks,
"(This question continues...)" etc.) is trimmed. Part labels (a), (b)(i)...
and their [n] marks are read from the paper so each question gets a parts
list with an anchor (image index + vertical position) for every part.

Every question is checked: paper max mark == markscheme total == data.js
marks, and the part marks must sum to the total. Anything that fails is
reported in the manifest's "warnings" and on stdout.

Usage:
  py scripts/recrop.py --pdfs "<vault>/Exams/PDFs" --out <dir> [--only aa-sl-2021-may-tz1-p1]

Writes <out>/exam-images/<id>/{paper,markscheme}-NN.webp and <out>/crops.json.
Requires: pip install pymupdf pillow
"""
import argparse
import io
import json
import re
import sys
from pathlib import Path

import pymupdf
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ZOOM = 2.3            # px per pt; ~1230px wide crops, matching the old images
X0, X1 = 30, 566      # fixed horizontal crop (pt) on an A4 page: inside crop marks and margin hatching
A4_W, A4_H = 595.32, 842.04
PAD_PX = 14
INK = 200             # grey level below which a pixel counts as ink
WEBP_QUALITY = 82

BOILERPLATE = re.compile(
    r"^(\(This question continues.*\)|\(Question \d+ continued\)|Turn over|"
    r"Do not write solutions on this page\.?|Please do not write on this page\.?|"
    r"Answers written on this page.*|will not be marked\.?|\d+EP\d+|References:?|©.*|"
    r"Answer all questions.*|Please start each question on a new page\.?|.*answer booklet provided.*|"
    r"Question \d+.{0,6} continued\.?|continued\s*(…|\.\.\.)?|"
    r"Section [AB]|– ?\d+ ?–|-\s?\d+\s?-)$"
)
# Dotted answer lines are text glyphs in the PDFs; they are space for working, not content.
ANSWER_LINE = re.compile(r"^[.…�·\s]+$")
ROMAN = r"i|ii|iii|iv|v|vi"
QNUM = re.compile(r"^(\d{1,2})\s?\.(\s|$)")


def load_questions():
    text = (ROOT / "assets/js/data.js").read_text(encoding="utf-8")
    data = json.loads(text[text.index("{"): text.rindex("}") + 1])
    return data["questions"]


def pdf_name(group, kind):
    # aa-sl-2021-may-tz1-p1 -> AA_SL_2021_May_TZ1_P1_Paper.pdf
    _, _, year, session, tz, paper = group.split("-")
    return f"AA_SL_{year}_{session.capitalize()}_{tz.upper()}_{paper.upper()}_{kind}.pdf"


class Doc:
    """A PDF with per-page text lines and the usable content band of each page."""

    def __init__(self, path):
        self.doc = pymupdf.open(path)
        self.lines = []   # per page: list of (x0, y0, x1, y1, text)
        self.band = []    # per page: (top, bottom) in pt, header/footer excluded
        for page in self.doc:
            ls = []
            for b in page.get_text("dict")["blocks"]:
                for l in b.get("lines", []):
                    t = "".join(s["text"] for s in l["spans"]).strip()
                    if t:
                        ls.append((*l["bbox"], t))
            ls.sort(key=lambda r: (round(r[1]), r[0]))
            self.lines.append(ls)
            self.band.append(self._band(page, ls))

    @staticmethod
    def offset(page):
        """Shift of the A4 layout on pages printed to a larger sheet (e.g. 2021 Nov P2)."""
        return (page.rect.width - A4_W) / 2, (page.rect.height - A4_H) / 2

    @staticmethod
    def _band(page, ls):
        h = page.rect.height
        ox, oy = Doc.offset(page)
        top = 62.0 + oy
        for x0, y0, x1, y1, t in ls:   # running header: page number / paper code
            if y1 < 72 + oy and (re.match(r"^[–-]\s?\d+\s?[–-]$", t) or re.search(r"\d{4}\s?[–-]\s?\d{4}|/M$|MATH", t)):
                top = max(top, y1 + 2)
        bottom = h - 40
        for x0, y0, x1, y1, t in ls:   # footer text: Turn over, 12EP03
            if y0 > A4_H - 70 + oy and (t == "Turn over" or re.match(r"^\d+EP\d+$", t)):
                bottom = min(bottom, y0 - 2)
        for d in page.get_drawings():  # barcode bars and crop marks along the bottom
            r = d["rect"]
            if A4_H - 70 + oy < r.y0 < h and X0 + ox < (r.x0 + r.x1) / 2 < X1 + ox:
                bottom = min(bottom, r.y0 - 2)
        return top, bottom


def find_paper_starts(doc, n):
    """[(page, line)] for questions 1..n, each with its [Maximum mark: M]."""
    starts, want = [], 1
    for p, ls in enumerate(doc.lines):
        for i, (x0, y0, x1, y1, t) in enumerate(ls):
            m = QNUM.match(t)
            if not (m and 36 <= x0 <= 90 and int(m.group(1)) == want):
                continue
            same_row = " ".join(r[4] for r in ls if abs(r[1] - y0) < 5)
            mm = re.search(r"Maximum\s*marks?:\s*(\d+)", same_row)
            if not mm:
                continue
            starts.append({"page": p, "y": y0, "x": x0, "max": int(mm.group(1))})
            want += 1
            if want > n:
                return starts
    return starts


def find_ms_ranges(doc, n):
    """[(start, end)] for questions 1..n. Starts are found backwards from the last
    question, so numbered lists in the general instructions are skipped. Each
    question ends at its last right-aligned "[x marks]" / "Total [x marks]" line."""
    starts, marks = {}, []
    for p, ls in enumerate(doc.lines):
        for x0, y0, x1, y1, t in ls:
            m = QNUM.match(t)
            if m and 36 <= x0 <= 90:
                starts.setdefault(int(m.group(1)), []).append((p, y0))
            m = re.search(r"(Total\s*)?\[\s*(Total:?\s*)?(\d+)\s*marks?\s*\]\s*$", t)
            if m and x1 > 440:
                marks.append(((p, y1), int(m.group(3)), bool(m.group(1) or m.group(2))))
    chosen, limit = {}, (len(doc.lines), 0.0)
    for k in range(n, 0, -1):
        cands = [c for c in starts.get(k, []) if c < limit]
        if not cands:
            return None, f"markscheme: no start found for Q{k}"
        chosen[k] = limit = cands[-1]
    ranges = []
    for k in range(1, n + 1):
        nxt = chosen.get(k + 1, (len(doc.lines), 0.0))
        inside = [m for m in marks if chosen[k] < m[0] < nxt]
        if not inside:
            return None, f"markscheme: no closing marks line for Q{k}"
        totals = [m for m in inside if m[2]]
        (p, y), total, _ = totals[-1] if totals else inside[-1]
        start = {"page": chosen[k][0], "y": chosen[k][1]}
        ranges.append((start, {"page": p, "y": y, "total": total}))
    # Tall maths on a question's first line can rise above its number, so start each
    # question just below the previous one's closing line when they share a page.
    for k in range(1, n):
        prev_end, start = ranges[k - 1][1], ranges[k][0]
        if prev_end["page"] == start["page"]:
            start["y"] = min(start["y"], max(prev_end["y"] + 4, start["y"] - 14) + 5)
        else:
            start["y"] -= 9
    ranges[0][0]["y"] -= 9
    return ranges, None


def segments(doc, start, end):
    """Split [start, end) into per-page (page, top, bottom) bands, dropping furniture-only bands."""
    out = []
    for p in range(start["page"], end["page"] + 1):
        top, bottom = doc.band[p]
        if p == start["page"]:
            top = max(top, start["y"] - 5)
        if p == end["page"]:
            bottom = min(bottom, end["y"])
        body = [r for r in doc.lines[p] if r[1] >= top - 1 and r[3] <= bottom + 1]
        refs = next((r for r in body if re.match(r"^(References:?|©)", r[4])), None)
        if refs:   # acknowledgements block at the end of the paper, and the rule above it
            bottom = refs[1] - 2
            body = [r for r in body if r[3] <= bottom + 1]
            last_text = max((r[3] for r in body), default=top)
            rules = [d["rect"].y0 for d in doc.doc[p].get_drawings()
                     if d["rect"].height < 2 and d["rect"].width > 300 and last_text < d["rect"].y0 < bottom]
            if rules:
                bottom = min(rules) - 2
        # Shave furniture lines off the top and bottom of the band
        while body and BOILERPLATE.match(body[0][4]):
            top = body[0][3] + 1
            body.pop(0)
        while body and BOILERPLATE.match(body[-1][4]):
            bottom = body[-1][1] - 1
            body.pop()
        if bottom - top < 8 or not any(not ANSWER_LINE.match(r[4]) for r in body):
            continue
        out.append({"page": p, "top": top, "bottom": bottom})
    return out


def render(doc, seg):
    """Render a band, trim blank rows; returns (PIL image, top_pt, bottom_pt) after trimming."""
    ox, _ = Doc.offset(doc.doc[seg["page"]])
    clip = pymupdf.Rect(X0 + ox, seg["top"], X1 + ox, seg["bottom"])
    pix = doc.doc[seg["page"]].get_pixmap(matrix=pymupdf.Matrix(ZOOM, ZOOM), clip=clip, alpha=False)
    img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
    mask = img.convert("L").point(lambda v: 255 if v < INK else 0)
    box = mask.getbbox()
    if not box:
        return None, None, None
    y0 = max(0, box[1] - PAD_PX)
    y1 = min(img.height, box[3] + PAD_PX)
    img = img.crop((0, y0, img.width, y1))
    return img, seg["top"] + y0 / ZOOM, seg["top"] + y1 / ZOOM


def part_labels(doc, segs, qx):
    """Leaf parts with marks, in reading order: [{label, marks, page, y}].
    qx is the x of the question number; labels sit at fixed offsets from it."""
    rows = []
    for s in segs:
        row_y = None
        for x0, y0, x1, y1, t in sorted(doc.lines[s["page"]], key=lambda r: r[1]):
            if s["top"] - 1 <= y0 and y1 <= s["bottom"] + 1:
                if row_y is None or y0 - row_y > 3:   # cluster lines into visual rows
                    row_y = y0
                rows.append((s["page"], row_y, x0, x1, y0, t))
    rows.sort()
    rows = [(p, y, x0, x1, t) for p, _, x0, x1, y, t in rows]
    labels, marks, letter = [], [], None
    for p, y, x0, x1, t in rows:
        m = re.match(r"^\(([a-h])\)(\s|$)", t)
        if m and qx + 18 <= x0 <= qx + 40:
            letter = m.group(1)
            labels.append({"label": letter, "marks": None, "page": p, "y": y, "sub": False})
            continue
        m = re.match(rf"^\(({ROMAN})\)(\s|$)", t)
        if m and qx + 46 <= x0 <= qx + 70 and letter:
            labels.append({"label": f"{letter}({m.group(1)})", "marks": None, "page": p, "y": y, "sub": True})
            continue
        m = re.search(r"\[(\d+)\]\s*$", t)
        if m and x1 > 500:
            marks.append((p, y, int(m.group(1))))
    # A letter followed by its own (i), (ii) is only a header; the sub-parts are the leaves.
    parts = [l for i, l in enumerate(labels)
             if l["sub"] or not (i + 1 < len(labels) and labels[i + 1]["sub"]
                                 and labels[i + 1]["label"].startswith(l["label"] + "("))]
    for p, y, n in marks:   # each [n] belongs to the last part label at or above it
        above = [q for q in parts if (q["page"], q["y"] - 4) <= (p, y)]
        if above and above[-1]["marks"] is None:
            above[-1]["marks"] = n
    # Sub-parts that share one [n] (e.g. (a)(i), (a)(ii) [2]) collapse into their letter.
    out = []
    for q in parts:
        letter = q["label"].split("(")[0]
        siblings = [s for s in parts if s["sub"] and s["label"].split("(")[0] == letter]
        if q["sub"] and any(s["marks"] is None for s in siblings):
            if siblings[0] is q:
                total = sum(s["marks"] or 0 for s in siblings)
                out.append({**q, "label": letter, "marks": total or None, "sub": False})
            continue
        out.append(q)
    return out


def process_group(group, qs, pdf_dir, out_dir):
    paper = Doc(pdf_dir / pdf_name(group, "Paper"))
    ms = Doc(pdf_dir / pdf_name(group, "Markscheme"))
    n = len(qs)
    results = {}
    starts = find_paper_starts(paper, n)
    ms_ranges, ms_err = find_ms_ranges(ms, n)
    last_page = len(paper.doc) - 1

    for k, q in enumerate(qs, start=1):
        warn = []
        rec = {"id": q["id"], "marks": q["marks"], "warnings": warn, "notes": []}
        results[q["id"]] = rec
        if len(starts) < k:
            warn.append(f"paper: question {k} heading not found")
            continue
        st = starts[k - 1]
        if k < len(starts):
            end = {"page": starts[k]["page"], "y": starts[k]["y"] - 6}
        else:
            end = {"page": last_page, "y": paper.band[last_page][1]}
        segs = segments(paper, st, end)
        if k == n:   # last question: stop at the first band with no question content
            segs = [s for s in segs if any(not BOILERPLATE.match(r[4]) and not r[4].startswith("©")
                                           for r in paper.lines[s["page"]] if s["top"] <= r[1] <= s["bottom"])]
        if st["max"] != q["marks"]:
            rec["notes"].append(f"marks corrected from {q['marks']} to {st['max']} (paper heading)")
            rec["marks"] = st["max"]

        qdir = out_dir / "exam-images" / q["id"]
        qdir.mkdir(parents=True, exist_ok=True)
        for f in qdir.glob("*.webp"):
            f.unlink()

        img_spans = []
        for i, s in enumerate(segs):
            img, t0, t1 = render(paper, s)
            if img is None:
                continue
            name = f"paper-{len(img_spans) + 1:02d}.webp"
            img.save(qdir / name, "WEBP", quality=WEBP_QUALITY, method=6)
            img_spans.append({"file": name, "page": s["page"], "top": t0, "bottom": t1})
        rec["paperImages"] = [f"assets/exam-images/{q['id']}/{s['file']}" for s in img_spans]

        def anchor(page, y):
            for i, s in enumerate(img_spans):
                if s["page"] == page and s["top"] - 2 <= y <= s["bottom"]:
                    return {"image": i, "y": round((y - s["top"]) / (s["bottom"] - s["top"]), 4)}
            return None

        parts = part_labels(paper, segs, st["x"])
        if not parts:
            parts = [{"label": "", "marks": st["max"], "page": st["page"], "y": st["y"]}]
        for pt in parts:
            pt["anchor"] = anchor(pt.pop("page"), pt.pop("y"))
            pt.pop("sub", None)
        missing = [p["label"] for p in parts if p["marks"] is None]
        if missing:
            warn.append(f"no [n] marks found for parts {missing}")
        elif sum(p["marks"] for p in parts) != st["max"]:
            warn.append(f"part marks sum {sum(p['marks'] for p in parts)} != max mark {st['max']}")
        rec["parts"] = parts

        if ms_err:
            warn.append(ms_err)
            rec["markschemeImages"] = []
            continue
        mstart, mtot = ms_ranges[k - 1]
        if mtot["total"] != rec["marks"]:
            warn.append(f"markscheme total {mtot['total']} != paper max mark {rec['marks']}")
        ms_spans = []
        for s in segments(ms, mstart, {"page": mtot["page"], "y": mtot["y"] + 3}):
            img, t0, t1 = render(ms, s)
            if img is None:
                continue
            name = f"markscheme-{len(ms_spans) + 1:02d}.webp"
            img.save(qdir / name, "WEBP", quality=WEBP_QUALITY, method=6)
            ms_spans.append(name)
        rec["markschemeImages"] = [f"assets/exam-images/{q['id']}/{f}" for f in ms_spans]
    return results


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pdfs", required=True, type=Path)
    ap.add_argument("--out", required=True, type=Path)
    ap.add_argument("--only", help="limit to ids starting with this prefix")
    ap.add_argument("--manifest", type=Path, help="manifest path (default <out>/crops.json)")
    args = ap.parse_args()

    groups = {}
    for q in load_questions():
        if args.only and not q["id"].startswith(args.only):
            continue
        groups.setdefault(re.sub(r"-q\d+$", "", q["id"]), []).append(q)

    manifest_path = args.manifest or args.out / "crops.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.exists() else {}
    for group, qs in sorted(groups.items()):
        qs.sort(key=lambda q: q["question"])
        res = process_group(group, qs, args.pdfs, args.out)
        manifest.update(res)
        bad = {k: v["warnings"] for k, v in res.items() if v["warnings"]}
        print(f"{group}: {len(res)} questions, {len(bad)} with warnings")
        for k, w in bad.items():
            print(f"   {k}: {'; '.join(w)}")
    args.out.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(manifest, indent=1, ensure_ascii=False), encoding="utf-8")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
