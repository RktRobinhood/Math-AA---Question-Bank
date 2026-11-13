"""Record where each question's last part ends, so the per-part highlight stops before the
answer space (#31).

For every question in a crops manifest, look below the last part's anchor for the top edge of the
answer box (a dark rule spanning nearly the whole image width). The last part ends there. If there
is no answer box (Section B and papers without one), it ends just below the last printed row.
Writes "end": {"image": i, "y": fraction} on each question. Re-run after recrop.py.

Usage: py scripts/part_ends.py data/crops.json [more manifests...]
"""
import json
import sys

import numpy as np
from PIL import Image

DARK = 140          # grey level below which a pixel counts as ink
RULE_SPAN = 0.88    # share of the width a row must cover to be the answer box's top edge
PAD = 0.006         # breathing room below the last printed row, as a share of image height


def rows(path):
    im = np.asarray(Image.open(path).convert("L"))
    ink = im < DARK
    return ink.mean(axis=1), im.shape[0]


def find_end(images, anchor):
    last = anchor
    for i in range(anchor["image"], len(images)):
        share, h = rows(images[i])
        start = int(anchor["y"] * h) + 4 if i == anchor["image"] else 0
        rule = np.nonzero(share[start:] >= RULE_SPAN)[0]
        if rule.size:
            return {"image": i, "y": round((start + int(rule[0])) / h, 4)}
        printed = np.nonzero(share[start:] > 0)[0]
        if printed.size:
            last = {"image": i, "y": round(min(1.0, (start + int(printed[-1])) / h + PAD), 4)}
    return last


def main(paths):
    for path in paths:
        with open(path, encoding="utf-8") as f:
            crops = json.load(f)
        boxed = 0
        for q in crops.values():
            parts = q.get("parts") or []
            if not parts or "anchor" not in parts[-1]:
                continue
            end = find_end(q["paperImages"], parts[-1]["anchor"])
            a = parts[-1]["anchor"]
            if (end["image"], end["y"]) <= (a["image"], a["y"]):
                end = {"image": len(q["paperImages"]) - 1, "y": 1}
            q["end"] = end
            boxed += end["y"] < 0.97 or end["image"] < len(q["paperImages"]) - 1
        with open(path, "w", encoding="utf-8") as f:
            json.dump(crops, f, indent=1, ensure_ascii=False)
        print(f"{path}: {len(crops)} questions, {boxed} end before the bottom of the last image")


if __name__ == "__main__":
    main(sys.argv[1:])
