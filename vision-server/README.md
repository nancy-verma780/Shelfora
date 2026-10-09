# Shelfora Vision

The backend for Shelfora: it watches existing store cameras, works out how full each shelf
slot is, combines that with POS sales, and serves the dashboard.

```
CCTV (RTSP) ─▶ OpenCV frames ─▶ YOLO (product / empty) ─▶ shelf slots ─▶ stock per product
POS sales ───────────────────────────────────────────────▶ selling speed vs normal ─▶ FastAPI ─▶ dashboard
```

## 1. Try it now (no camera, no GPU)
```bash
pip install fastapi "uvicorn[standard]" pyyaml numpy opencv-python-headless
uvicorn shelfora.api:app --port 8000
```
Every camera in `config/store.yaml` is set to `simulated`: a demo shop that sells (60× real
speed) and renders camera frames. Those frames still go through the real slot-mapping, smoothing,
sales and event code. Then open the dashboard, go to Settings → Connect your store, and enter
`http://localhost:8000`.

## Included model
`models/shelfora-shelf.pt` is a YOLO11n detector (5.5 MB) trained for 12 rounds on the real
Grocery Dataset (Varol & Kuzu 2015): 354 store shelf photos, 13,184 labelled products.
On 53 held-out photos: **mAP50 99.4%, mAP50-95 74.3%, precision 99.6%, recall 99.8%**
(the untrained starting model: 41.7% / 22.1%). About 130 ms per photo on one CPU core.
Full numbers are in `models/shelfora-shelf.metrics.json`; rebuild it with
`scripts/prepare_grocery_dataset.py` then `scripts/train.py --stage finetune --data <that data.yaml>`.

Limits: those shelves are mostly tobacco displays in Turkish shops, and the held-out photos
come from the same shops, so expect lower scores in a new store. It finds products but does not
detect empty gaps or name items. Fine-tune with your own camera frames before relying on it.
The dataset is licensed for research only, so retrain on data you're allowed to use commercially.

## 2. Train the detector
**Start with `TRAINING.md`**: which datasets to use, in what order, with exact commands.

Use a GPU. The easiest route is `notebooks/train_colab.ipynb` on a free Colab T4.

| Data | What it teaches | How |
|---|---|---|
| SKU-110K (~11.7k shelf photos) | finding every product on a dense shelf | auto-downloaded by `train.py --stage base` |
| Roboflow Universe empty-shelf / retail sets | product vs empty gap | `get_data.py roboflow ...` |
| Kaggle detection sets (VOC/COCO/CSV) | more shelf variety | `get_data.py kaggle` then `auto` |
| Kaggle competition *Grocery Items: Multi-class Object Detection* | **which** item is on the shelf | `get_data.py kaggle-comp --competition grocery-items-multi-class-object-detection` |
| **Frames from your own cameras** | your lighting, angles and packs (matters most) | `get_data.py capture`, label in Roboflow |

```bash
python scripts/train.py --stage base --epochs 40
python scripts/get_data.py merge datasets/rf-* datasets/store-frames-yolo
python scripts/train.py --stage finetune --weights runs/shelfora/base/weights/best.pt --epochs 60
```
This writes `models/shelfora-shelf.pt`.

### Multi-class model (names each item)
```bash
# accept the competition rules on kaggle.com first, and put kaggle.json in ~/.kaggle
python scripts/get_data.py kaggle-comp --competition grocery-items-multi-class-object-detection
python scripts/get_data.py merge datasets/kc-grocery-items-multi-class-object-detection* --keep-classes --name grocery
python scripts/train.py --stage grocery --weights runs/shelfora/base/weights/best.pt --epochs 80
python scripts/map_classes.py --model models/shelfora-grocery.pt --write
```
Set `detector.weights: models/shelfora-grocery.pt` in `config/store.yaml`. Each mapped product
then counts only its own item as stock, and anything else found in its spot raises a
"misplaced" alert. Products with no matching class keep counting any item in their slot.
The importer auto-detects YOLO, COCO, Pascal VOC and CSV labels; if it can't recognise the
competition's files it lists what it found so the format can be added. Check each dataset's licence before commercial use;
SKU-110K is published for research.

## 3. Connect the shop
1. **Cameras.** In `config/store.yaml`, replace `source: simulated` with each camera's stream, e.g.
   `rtsp://user:pass@192.168.1.64:554/Streaming/Channels/102` (Hikvision) or
   `rtsp://user:pass@ip:554/cam/realmonitor?channel=1&subtype=1` (Dahua/CP Plus). Sub-streams are enough.
2. **Planogram.** `python scripts/calibrate.py --camera cam-01` and draw each product's slot.
   With the shelf full, set `facings_full` to the facings the model sees.
3. **Sales.** Point your POS (or a nightly export) at the API:
   - live: `POST /sales` with `[{"product_id": "bev-coke-500", "qty": 2}]`
   - batch: `POST /sales/csv` with columns `product_id,qty,timestamp`
   Until a week of sales exists, `normal_rate` in the config is used as the baseline.
4. Run `uvicorn shelfora.api:app --host 0.0.0.0 --port 8000` on a PC in the store's network
   (any machine with an NVIDIA GPU or a recent CPU at 1 frame / 3 s per camera).

## API
| | |
|---|---|
| `GET /health` | mode (demo/live), camera status |
| `GET /products` | per-product stock + sales velocity (dashboard's ProductRecord) |
| `GET /cameras`, `GET /cameras/{id}/frame.jpg` | camera list, latest annotated frame |
| `POST /products/{id}/refill` | staff confirms a refill |
| `POST /sales`, `POST /sales/csv` | POS sales |
| `GET /events`, `WS /ws` | live stock events and product updates |

## Tests
`pytest tests` covers slot counting, smoothing, VOC/COCO conversion, dataset merging and the API end to end.
