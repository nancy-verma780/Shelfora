"""Builds config/store.yaml (store, cameras, planogram) from the dashboard's demo catalog.

For a real store, replace the camera `source` with its RTSP URL and redraw each
product's `slot` with scripts/calibrate.py on a frame from that camera.
"""
import json, math, sys, yaml
from pathlib import Path

catalog = json.load(open(sys.argv[1] if len(sys.argv) > 1 else "catalog.json"))
TOP, BOTTOM, SIDE = 70 / 720, 50 / 720, 24 / 1280

cams, products = [], []
for c in catalog["cameras"]:
    cams.append({"id": c["id"], "label": c["label"], "name": c["name"], "section": c["section"],
                 "racks": c["racks"], "source": "simulated", "resolution": c["resolution"], "fps": c["fps"]})
    rows = c["racks"]
    row_h = (1 - TOP - BOTTOM) / len(rows)
    for ri, rack in enumerate(rows):
        items = [p for p in catalog["products"] if p["camera"] == c["id"] and p["shelf"] == rack]
        slot_w = (1 - 2 * SIDE) / len(items)
        for i, p in enumerate(items):
            x1 = SIDE + i * slot_w
            products.append({
                "id": p["id"], "name": p["name"], "category": p["category"], "section": p["section"],
                "shelf": rack, "camera": c["id"],
                "capacity": p["shelfCapacity"],
                "facings_full": max(3, min(10, math.floor(p["shelfCapacity"] / 4))),
                "normal_rate": p["normalSalesRate"],
                "color": p["color"], "shape": p["shape"],
                # normalized [x1, y1, x2, y2] region of the frame where this product sits
                "slot": [round(x1, 4), round(TOP + ri * row_h, 4), round(x1 + slot_w, 4), round(TOP + (ri + 1) * row_h, 4)],
                # demo-only starting state, ignored for real cameras
                "demo": {"units": p["estimatedStock"], "velocity": p["salesVelocity"], "last_refill_min": p["lastRefillMin"]},
            })

cfg = {
    "store": {"id": "dgi-main", "name": "DGI Retail Store", "timezone": "Asia/Kolkata", "open_hours": 14},
    "detector": {"weights": "models/shelfora-shelf.pt", "conf": 0.35, "iou": 0.5, "product_classes": None, "empty_classes": ["empty", "gap", "void"]},
    "pipeline": {"interval_sec": 3, "smoothing_frames": 3, "low_stock_threshold": 0.25},
    "sales": {"velocity_window_min": 60, "baseline_days": 28},
    "demo": {"speed": 60, "comment": "1 real second = 60 store seconds when sources are 'simulated'"},
    "cameras": cams,
    "products": products,
}
Path("config").mkdir(exist_ok=True)
yaml.safe_dump(cfg, open("config/store.yaml", "w"), sort_keys=False, width=140)
print(f"wrote config/store.yaml: {len(cams)} cameras, {len(products)} products")
