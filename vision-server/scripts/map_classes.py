"""Link a multi-class model's class names to your store's products.

    python scripts/map_classes.py --model models/shelfora-grocery.pt
    python scripts/map_classes.py --names datasets/grocery/data.yaml   (before training)

Suggests the closest class for every product in config/store.yaml by name similarity,
shows the matches, and with --write saves them as `model_class` on each product.
Check the list: anything with a low score is probably not in the dataset and should be
left unmapped (it then counts any detection in its slot, like the single-class model).
"""
import argparse
import difflib
import re
import yaml

ap = argparse.ArgumentParser()
ap.add_argument("--config", default="config/store.yaml")
ap.add_argument("--model")
ap.add_argument("--names", help="data.yaml with class names")
ap.add_argument("--min-score", type=float, default=0.45)
ap.add_argument("--write", action="store_true")
a = ap.parse_args()

if a.model:
    from ultralytics import YOLO
    names = list(YOLO(a.model).names.values())
else:
    raw = yaml.safe_load(open(a.names))["names"]
    names = list(raw.values()) if isinstance(raw, dict) else raw

SIZE = re.compile(r"^\d+(\.\d+)?(g|kg|ml|l|pack|pc|pcs)?$")


def tokens(s: str) -> tuple[set[str], set[str]]:
    words = re.sub(r"[^a-z0-9.]+", " ", s.lower().replace("'", "")).split()
    sizes = {w for w in words if SIZE.match(w)}
    return {w for w in words if w not in sizes}, sizes


def similarity(product: str, cls: str) -> float:
    """Shared words matter, brand first; a different pack size lowers the score."""
    pw, ps = tokens(product)
    cw, cs = tokens(cls)
    if not pw or not cw or not (pw & cw):
        return 0.0
    brand = product.lower().replace("'", "").replace("-", " ").split()[0]
    if brand not in " ".join(cw) and brand.replace(" ", "") not in "".join(cw):
        return 0.0
    score = len(pw & cw) / len(pw | cw) * 0.7 + difflib.SequenceMatcher(None, " ".join(sorted(pw)), " ".join(sorted(cw))).ratio() * 0.3
    if ps and cs and not (ps & cs):
        score *= 0.4  # same brand, different pack: a different product on the shelf
    return score


cfg = yaml.safe_load(open(a.config))
mapped = 0
for p in cfg["products"]:
    best, score = None, 0.0
    for n in names:
        r = similarity(p["name"], n)
        if r > score:
            best, score = n, r
    ok = score >= a.min_score
    print(f"{'✓' if ok else ' '} {p['name']:<36} → {best if ok else '(no match)':<36} {score:.2f}")
    if ok:
        p["model_class"] = best
        mapped += 1
    else:
        p.pop("model_class", None)
print(f"\n{mapped}/{len(cfg['products'])} products mapped to model classes")
if a.write:
    yaml.safe_dump(cfg, open(a.config, "w"), sort_keys=False, width=140)
    print("Saved to", a.config)
