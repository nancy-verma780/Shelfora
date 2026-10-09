# Shelfora

**Live demo:** https://shelfora-peach.vercel.app


**See the shelf. Know what to refill.**

Shelfora turns a store's existing CCTV cameras into live shelf inventory. A YOLO model counts the
products in each shelf zone. When customers take items, the count drops, fast sellers get flagged as
high demand, and an empty high-demand shelf raises an urgent refill alert for the store manager.

```
CCTV camera â”€â–¶ YOLO detection â”€â–¶ products per shelf zone â”€â–¶ stock + sales speed â”€â–¶ refill priority â”€â–¶ dashboard
```

## What's inside

| Folder | What it is |
|---|---|
| `dashboard/` | The web app for store managers: React, TypeScript, Tailwind, Recharts |
| `vision-server/` | Python + FastAPI service: reads cameras, runs the model, counts stock, takes POS sales |
| `vision-server/models/` | The trained shelf-detection model (YOLO11n) |
| `vision-server/scripts/` | Dataset download, training, calibration, and demo-video scripts |
| `vision-server/notebooks/` | Google Colab notebooks for training and for making a demo video |

## Features

- **Overview:** what needs attention right now, shelf health, a store map, a guided refill round
- **Live Monitor:** camera views with detection boxes on every product
- **Refill Queue:** priority = 50% stock level + 30% selling speed + 20% time until empty
- **Fast movers, shelf health, analytics, alerts**, light and dark mode, âŒ˜K search
- **High-demand detection:** items taken quickly from one zone are flagged; empty + high demand = urgent refill

## Run it

**Dashboard** (needs Node.js 20+):
```bash
cd dashboard
npm install
npm run dev
```
Open http://localhost:5173. It runs on sample data out of the box.

**Vision server** (needs Python 3.12):
```bash
cd vision-server
pip install fastapi "uvicorn[standard]" pyyaml numpy opencv-python-headless
python -m uvicorn shelfora.api:app --port 8000
```
Then in the dashboard: Settings â†’ Connect your store â†’ `http://localhost:8000`.
With no camera configured it runs a simulated shop. For real cameras and training, see
`SETUP_GUIDE.md` and `vision-server/TRAINING.md`.

## The model

YOLO11n fine-tuned on public shelf datasets:
- **Grocery Dataset** (Varol & Kuzu): 354 real shelf photos, 13,184 labelled products
- **Retail Shelf Void Detection** (Kaggle): empty spaces on shelves

On held-out shelf photos the product detector reached **99.4% mAP50**. Those photos come from the
same stores as the training photos, so expect lower scores in a new store; frames from your own
cameras improve it most.

Both datasets are licensed for research / non-commercial use only, so they are not included in this
repository. Download them with `vision-server/scripts/get_data.py`.

## Make a demo video from your own shelf

```bash
python vision-server/scripts/make_demo_video.py --video shelf.mp4 --names "Chips,Biscuits,Juice"
```
It draws coloured zones, a dot on each product, live counts, high-demand tags and refill alerts.

## Status

A working prototype. The dashboard runs on sample data or a simulated shop; live store use needs
camera calibration and a model fine-tuned on that store's footage.
