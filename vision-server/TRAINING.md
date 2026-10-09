# Training Shelfora's model: which datasets, in what order

Shelfora needs a model that answers two questions about each shelf slot:
**is there a product?** and **is there an empty gap?** Naming the exact item (Amul vs Mother Dairy)
is a bonus; the planogram slot already tells Shelfora what *should* be there.

Train on a free Google Colab GPU (Runtime → Change runtime type → T4 GPU) with
`notebooks/train_colab.ipynb`. Every command below runs from the `vision-server` folder.

## The datasets, in order of use

| # | Dataset | Where | Size | Teaches | Licence |
|---|---|---|---|---|---|
| 1 | **SKU-110K** | auto-downloaded by Ultralytics (no Kaggle needed) | 11,743 shelf photos, ~1.7M products | finding every product on a crowded shelf | published for research; check before commercial use |
| 2 | **Empty Spaces Detection in Shelf Data** | Roboflow: `dsjourney/empty-spaces-detection-in-shelf-data`, version 2 | see page | empty gaps on shelves | CC BY 4.0 |
| 3 | **Empty Spaces Detection in Shelf Data (5ddld)** | Roboflow: `area-mcjd4/empty-spaces-detection-in-shelf-data-5ddld`, version 1 | see page | more empty-gap examples | CC BY 4.0 |
| 4 | **Retail Store Indian** | Roboflow: `nmims-b6ta9/retail-store-indian` (check the latest version on its page) | see page | Indian packaging and shelves | check on its page |
| 5 | Kaggle competition **Grocery Items: Multi-class Object Detection** | `kaggle-comp --competition grocery-items-multi-class-object-detection` | see page | names of grocery items (optional) | check competition rules |
| 6 | **Frames from your own cameras** | `get_data.py capture` + label in Roboflow | 200–500 frames | your lighting, angle and products | yours |

Dataset 6 matters most. A model that has never seen your store's camera angle will miss things;
200 labelled frames from your own cameras usually help more than another public dataset.

`models/shelfora-shelf.pt` (already included) was trained on the Grocery Dataset (Varol & Kuzu):
99.4% mAP50 on held-out photos, but those shelves are tobacco displays in Turkish shops and the
dataset is research-only. Use it for demos and as a starting point, not as your final model.

## Step by step

### 0. Set up (Colab or your own GPU machine)
```bash
pip install -r requirements.txt
```
Get a Roboflow API key: roboflow.com → Settings → API Keys (free account).

### 1. Base model: products on dense shelves (SKU-110K)
```bash
python scripts/train.py --stage base --weights yolo11s.pt --epochs 30 --fraction 0.3 --device 0
```
Downloads 13.6 GB on first run. `--fraction 0.3` uses 30% of it to fit a free Colab session
(about 2–3 hours on a T4); use `1.0` if you have the time. Expect mAP50 around 0.85–0.9 on
SKU-110K; it's a hard benchmark, so don't expect the 99% from the easier Grocery Dataset.

### 2. Product + empty gap (Roboflow empty-space sets + Indian retail)
```bash
python scripts/get_data.py roboflow --api-key YOUR_KEY --workspace dsjourney --project empty-spaces-detection-in-shelf-data --version 2
python scripts/get_data.py roboflow --api-key YOUR_KEY --workspace area-mcjd4 --project empty-spaces-detection-in-shelf-data-5ddld --version 1
python scripts/get_data.py roboflow --api-key YOUR_KEY --workspace nmims-b6ta9 --project retail-store-indian --version 1
python scripts/get_data.py merge datasets/rf-*
python scripts/train.py --stage finetune --weights runs/shelfora/base/weights/best.pt --epochs 60 --device 0
```
Labels containing *empty*, *gap*, *void* or *missing* become class `empty`; every other label
becomes `product`. If a download fails, open the dataset's page, check the current version
number, and pass it with `--version`.

### 3. Your store (do this before showing it in a real shop)
```bash
python scripts/get_data.py capture --source "rtsp://user:pass@CAMERA-IP:554/..." --every 30 --count 300
```
Upload `datasets/store-frames/images` to a new Roboflow project, draw boxes for `product` and
`empty` (Roboflow's auto-label helps), export as YOLOv8, then:
```bash
python scripts/get_data.py roboflow --api-key YOUR_KEY --workspace YOUR_WS --project YOUR_PROJECT --version 1
python scripts/get_data.py merge datasets/rf-*
python scripts/train.py --stage finetune --weights models/shelfora-shelf.pt --epochs 40 --device 0
```

### 4. Use it
Download `models/shelfora-shelf.pt` from Colab into `vision-server/models/`, set your camera
sources in `config/store.yaml`, draw slots with `scripts/calibrate.py`, and start the server.

## What good looks like
- **mAP50 ≥ 0.85** on your own held-out store frames for `product`.
- **Empty-gap recall ≥ 0.8**: missing a gap means a missed refill; a false gap is cheaper.
- Check the per-class numbers `train.py` prints, and look at the prediction images in
  `runs/shelfora/<stage>/` before trusting the score.
