"""Grocery Dataset (Varol & Kuzu 2015, github.com/gulvarol/grocerydataset) -> YOLO, one class "product", images resized to 800px.
Download GroceryDataset_part1.tar.gz from that repo's releases, extract ShelfImages/, and put annotation.txt beside it. Research use only."""
import cv2, random
from pathlib import Path
out = Path("grocery_yolo"); 
rows = [l.split() for l in open("annotation.txt") if l.strip()]
random.Random(0).shuffle(rows)
nval = int(len(rows) * 0.15); bad = 0; boxes = 0
for i, p in enumerate(rows):
    split = "val" if i < nval else "train"
    img = cv2.imread(f"ShelfImages/{p[0]}", cv2.IMREAD_COLOR | cv2.IMREAD_IGNORE_ORIENTATION)
    if img is None: bad += 1; continue
    h, w = img.shape[:2]
    s = 800 / max(h, w)
    small = cv2.resize(img, (round(w * s), round(h * s)), interpolation=cv2.INTER_AREA)
    lines = []
    for k in range(int(p[1])):
        x, y, bw, bh = (float(v) for v in p[2 + 5 * k: 6 + 5 * k])
        if x < 0 or y < 0 or x + bw > w + 2 or y + bh > h + 2: bad += 1; continue
        lines.append(f"0 {(x + bw / 2) / w:.6f} {(y + bh / 2) / h:.6f} {bw / w:.6f} {bh / h:.6f}")
    boxes += len(lines)
    for d in ("images", "labels"): (out / split / d).mkdir(parents=True, exist_ok=True)
    stem = Path(p[0]).stem
    cv2.imwrite(str(out / split / "images" / f"{stem}.jpg"), small, [cv2.IMWRITE_JPEG_QUALITY, 90])
    (out / split / "labels" / f"{stem}.txt").write_text("\n".join(lines) + "\n")
(out / "data.yaml").write_text(f"path: {out.resolve()}\ntrain: train/images\nval: val/images\nnames: ['product']\n")
print(len(rows), "images", boxes, "boxes", bad, "skipped")
