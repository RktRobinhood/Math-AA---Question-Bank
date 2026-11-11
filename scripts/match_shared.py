"""Find questions that sit on both the SL and the HL paper of the same exam, and store them once.

For every HL paper 1 or 2 in the HL manifest, the matching SL paper (same session, timezone and
paper) is read and each question's text is compared, ignoring the question number. When the SL
paper has no such timezone (a November HL TZ0 paper against SL TZ1 and TZ2), every SL timezone
of that session is tried. A pair with
the same marks and the same text (similarity >= 0.98) is a common question:
  - data/shared.json gets  "<hl id>": {"canonical": "<sl id>", "section": "<hl section>"}
  - the HL entry leaves the HL manifest and its images are deleted (the SL images are used).
A pair whose words are identical but come out of the PDF in a different order (stacked fractions
often do) also counts. Near misses (0.85-0.98) are printed for a person to check; they are never
merged: most are HL versions with different numbers or an extra part.

Usage:
  py scripts/match_shared.py --sl-pdfs <dir> --hl-pdfs <dir> --sl-manifest data/crops.json \\
      --hl-manifest data/crops-aa-hl.json --prefix aa-hl-2021 [--apply]
Without --apply it only reports.
"""
import argparse
import difflib
import json
import re
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from recrop import BOILERPLATE, ANSWER_LINE, Doc, find_paper_starts, pdf_name, segments  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
SAME, NEAR = 0.98, 0.85


def question_texts(pdf):
    """[(marks, normalised text)] for every question in a paper, without its number."""
    doc = Doc(pdf)
    starts = find_paper_starts(doc, 99)
    last = len(doc.doc) - 1
    out = []
    for k, st in enumerate(starts):
        end = {"page": starts[k + 1]["page"], "y": starts[k + 1]["y"] - 6} if k + 1 < len(starts) else {"page": last, "y": doc.band[last][1]}
        words = []
        for seg in segments(doc, st, end):
            for x0, y0, x1, y1, t in doc.lines[seg["page"]]:
                if seg["top"] - 1 <= y0 and y1 <= seg["bottom"] + 1 and not BOILERPLATE.match(t) and not ANSWER_LINE.match(t):
                    words.append(t)
        text = " ".join(words)
        text = re.sub(r"^\d{1,2}\s?\.\s*", "", text)
        text = re.sub(r"\[\s*Maximum\s*marks?:\s*\d+\s*\]", "", text)
        out.append((st["max"], re.sub(r"\s+", " ", text).strip().lower()))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sl-pdfs", required=True, type=Path)
    ap.add_argument("--hl-pdfs", required=True, type=Path)
    ap.add_argument("--sl-manifest", required=True, type=Path)
    ap.add_argument("--hl-manifest", required=True, type=Path)
    ap.add_argument("--shared", type=Path, default=ROOT / "data/shared.json")
    ap.add_argument("--prefix", required=True, help="HL ids to check, e.g. aa-hl-2021")
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args()

    sl_crops = json.loads(args.sl_manifest.read_text(encoding="utf-8"))
    hl_crops = json.loads(args.hl_manifest.read_text(encoding="utf-8"))
    shared = json.loads(args.shared.read_text(encoding="utf-8")) if args.shared.exists() else {
        "about": ("Questions that sit on both the SL and the HL paper of an exam are stored once, under their SL id. "
                  "Each entry is an HL appearance: its own id (paper, timezone and number) points at the stored SL "
                  "question, with the section it has on the HL paper. Written by scripts/match_shared.py."),
        "appearances": {},
    }
    groups = sorted({re.sub(r"-q\d+$", "", q) for q in hl_crops if q.startswith(args.prefix) and re.search(r"-p[12]-q", q)})
    merged = 0
    for hl_group in groups:
        same_tz = hl_group.replace("-hl-", "-sl-")
        sl_groups = [same_tz] if (args.sl_pdfs / pdf_name(same_tz, "Paper")).exists() else [
            g for tz in ("tz0", "tz1", "tz2", "tz3")
            if (args.sl_pdfs / pdf_name(g := re.sub(r"-tz\d-", f"-{tz}-", same_tz), "Paper")).exists()]
        if not sl_groups:
            print(f"{hl_group}: no SL paper for this session")
            continue
        hl_q = question_texts(args.hl_pdfs / pdf_name(hl_group, "Paper"))
        sl_q = [(g, j, sm, st) for g in sl_groups for j, (sm, st) in enumerate(question_texts(args.sl_pdfs / pdf_name(g, "Paper")), start=1)]
        sl_group = "/".join(sl_groups)
        pairs = []
        for i, (hm, ht) in enumerate(hl_q, start=1):
            best = max(((difflib.SequenceMatcher(None, ht, st).ratio(), g, j, sm) for g, j, sm, st in sl_q), default=None)
            if not best:
                continue
            ratio, g, j, sm = best
            hl_id, sl_id = f"{hl_group}-q{i:02d}", f"{g}-q{j:02d}"
            same_words = sorted(ht.split()) == sorted(next(st for g2, j2, sm2, st in sl_q if (g2, j2) == (g, j)).split())
            if sm == hm and (ratio >= SAME or same_words):
                pairs.append((hl_id, sl_id))
            elif ratio >= NEAR:
                print(f"   near miss, not merged: {hl_id} ~ {sl_id} ({ratio:.3f}, marks {hm}/{sm})")
        print(f"{hl_group}: {len(pairs)} common with {sl_group}: " + ", ".join(f"HL Q{int(h[-2:])}={s.split('-')[4].upper()} SL Q{int(s[-2:])}" for h, s in pairs))
        for hl_id, sl_id in pairs:
            if sl_id not in sl_crops:
                print(f"   {sl_id} is not in {args.sl_manifest}; crop the SL paper first")
                continue
            if not args.apply:
                continue
            entry = hl_crops.pop(hl_id, None)
            if entry is None:
                continue
            shared["appearances"][hl_id] = {"canonical": sl_id, "section": entry.get("section")}
            shutil.rmtree(ROOT / "assets/exam-images" / hl_id, ignore_errors=True)
            merged += 1
    if args.apply:
        shared["appearances"] = dict(sorted(shared["appearances"].items()))
        args.shared.write_text(json.dumps(shared, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
        args.hl_manifest.write_text(json.dumps(hl_crops, indent=1, ensure_ascii=False), encoding="utf-8")
        print(f"merged {merged} HL questions into their SL copies")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
