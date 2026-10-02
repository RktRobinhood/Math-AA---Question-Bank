"""Tile every crop of a set of questions into one PNG per question group, for eyeballing.

Usage: py scripts/contact_sheet.py <images-dir> <out.png> [id-prefix]
Each row is one question: paper images (blue border) then markscheme images (orange border).
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageOps

src, out = Path(sys.argv[1]), Path(sys.argv[2])
prefix = sys.argv[3] if len(sys.argv) > 3 else ""
H = 520
rows = []
for qdir in sorted(d for d in src.iterdir() if d.is_dir() and d.name.startswith(prefix)):
    tiles = []
    for f in sorted(qdir.glob("paper-*.webp")) + sorted(qdir.glob("markscheme-*.webp")):
        im = Image.open(f).convert("RGB")
        im = im.resize((max(1, im.width * H // max(im.height, H)), im.height * H // max(im.height, H)))
        tiles.append(ImageOps.expand(im, 4, fill=(40, 90, 220) if f.name.startswith("paper") else (240, 140, 20)))
    label = Image.new("RGB", (150, H + 8), "white")
    ImageDraw.Draw(label).text((6, 6), qdir.name.replace("aa-sl-", ""), fill="black")
    tiles.insert(0, label)
    row = Image.new("RGB", (sum(t.width + 6 for t in tiles), H + 8), (90, 90, 90))
    x = 0
    for t in tiles:
        row.paste(t, (x, 0))
        x += t.width + 6
    rows.append(row)
sheet = Image.new("RGB", (max(r.width for r in rows), sum(r.height + 10 for r in rows)), (90, 90, 90))
y = 0
for r in rows:
    sheet.paste(r, (0, y))
    y += r.height + 10
sheet.save(out)
print(out, sheet.size)
