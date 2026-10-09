"""Train Shelfora's shelf detector with Ultralytics YOLO.

Stage 1 (base):     learn what a product on a crowded shelf looks like, from SKU-110K.
Stage 2 (finetune): teach it product vs empty gap, using Roboflow/Kaggle sets and frames
                    from your own cameras, merged by `get_data.py merge`.
Stage grocery:      a multi-class model that also names the item (e.g. the Kaggle "Grocery Items:
                    Multi-class Object Detection" data), merged with `merge --keep-classes --name grocery`.
                    Map its class names to your products with scripts/map_classes.py.

Run on a GPU (a free Colab T4 is enough; see notebooks/train_colab.ipynb):
    python scripts/train.py --stage base --epochs 40
    python scripts/train.py --stage finetune --weights runs/shelfora/base/weights/best.pt --epochs 60
The final best.pt is copied to models/shelfora-shelf.pt, which the service loads.
"""
import argparse
import shutil
from pathlib import Path


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--stage", choices=["base", "finetune", "grocery"], required=True)
    p.add_argument("--weights", default="yolo11s.pt", help="starting weights")
    p.add_argument("--data", default=None, help="override dataset yaml")
    p.add_argument("--epochs", type=int, default=50)
    p.add_argument("--imgsz", type=int, default=1024, help="shelves are dense; keep this high")
    p.add_argument("--batch", type=int, default=8)
    p.add_argument("--device", default=None, help="0 for first GPU, cpu for CPU")
    p.add_argument("--fraction", type=float, default=1.0, help="train on a fraction of SKU-110K to save time")
    a = p.parse_args()

    from ultralytics import YOLO
    data = a.data or {"base": "SKU-110K.yaml", "finetune": "datasets/shelfora/data.yaml", "grocery": "datasets/grocery/data.yaml"}[a.stage]
    model = YOLO(a.weights)
    model.train(
        data=data, epochs=a.epochs, imgsz=a.imgsz, batch=a.batch, device=a.device, fraction=a.fraction,
        project="runs/shelfora", name=a.stage, exist_ok=True,
        max_det=1000,            # SKU-110K images average ~150 items
        mosaic=1.0, degrees=2, perspective=0.0005, hsv_v=0.5,  # CCTV angles and store lighting vary
        close_mosaic=10, patience=15,
    )
    best = Path(f"runs/shelfora/{a.stage}/weights/best.pt")
    metrics = YOLO(best).val(data=data, imgsz=a.imgsz, max_det=1000)
    print(f"\nmAP50 {metrics.box.map50:.3f}   mAP50-95 {metrics.box.map:.3f}")
    Path("models").mkdir(exist_ok=True)
    target = "models/shelfora-grocery.pt" if a.stage == "grocery" else "models/shelfora-shelf.pt"
    shutil.copy(best, target)
    print(f"Copied to {target}")
    if a.stage == "grocery":
        print("Per-class AP50 (lowest first) — classes below ~0.5 need more examples:")
        names = YOLO(best).names
        for ci, ap in sorted(zip(metrics.box.ap_class_index, metrics.box.ap50), key=lambda t: t[1])[:15]:
            print(f"  {names[int(ci)]:<40} {ap:.2f}")


if __name__ == "__main__":
    main()
