"""Draw each product's shelf slot on a real camera frame and save it into config/store.yaml.

    python scripts/calibrate.py --camera cam-01

Opens a frame from the camera; for each product on that camera, drag a box over where it
sits and press ENTER (C to skip). Also counts the facings the model sees in each slot so
you can set facings_full while the shelf is fully stocked.
"""
import argparse
import cv2
import yaml

ap = argparse.ArgumentParser()
ap.add_argument("--config", default="config/store.yaml")
ap.add_argument("--camera", required=True)
ap.add_argument("--image", help="use a saved frame instead of the live camera")
a = ap.parse_args()

cfg = yaml.safe_load(open(a.config))
cam = next(c for c in cfg["cameras"] if c["id"] == a.camera)
if a.image:
    frame = cv2.imread(a.image)
else:
    src = cam["source"]
    cap = cv2.VideoCapture(int(src) if str(src).isdigit() else src)
    ok, frame = cap.read()
    if not ok:
        raise SystemExit(f"Could not read from {src}")
h, w = frame.shape[:2]
for p in [p for p in cfg["products"] if p["camera"] == a.camera]:
    view = frame.copy()
    cv2.putText(view, f"Select: {p['name']} (Rack {p['shelf']})", (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)
    x, y, bw, bh = cv2.selectROI("Shelfora calibration", view, showCrosshair=False)
    if bw and bh:
        p["slot"] = [round(x / w, 4), round(y / h, 4), round((x + bw) / w, 4), round((y + bh) / h, 4)]
        cv2.rectangle(frame, (x, y), (x + bw, y + bh), (0, 200, 120), 2)
cv2.destroyAllWindows()
yaml.safe_dump(cfg, open(a.config, "w"), sort_keys=False, width=140)
print("Saved slots to", a.config)
