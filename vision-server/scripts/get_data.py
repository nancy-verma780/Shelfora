"""Collect training data for Shelfora's shelf detector.

Every source ends up in YOLO format under datasets/<name>/ with two classes:
    0 product   (any packaged item facing the camera)
    1 empty     (a visible gap on the shelf)

Sources
  sku110k     SKU-110K, ~11.7k densely packed retail shelf photos. Downloaded automatically by
              Ultralytics the first time you train with data=SKU-110K.yaml (~13.6 GB). Check its
              licence before commercial use (it is published for research).
  roboflow    Any Roboflow Universe project, e.g. an empty-shelf or retail-shelf detection set.
              python scripts/get_data.py roboflow --api-key KEY --workspace WS --project PROJ --version 1
  kaggle      Any Kaggle dataset (needs ~/.kaggle/kaggle.json).
              python scripts/get_data.py kaggle --dataset owner/dataset-name
              Then convert with `convert` if it ships Pascal VOC XML or COCO JSON.
  kaggle-comp A Kaggle competition's data, e.g. Grocery Items: Multi-class Object Detection.
              Accept the competition rules on kaggle.com first, then:
              python scripts/get_data.py kaggle-comp --competition grocery-items-multi-class-object-detection
              The download is unpacked and its labels auto-detected (YOLO, COCO, VOC or CSV).
              Grocery classes are kept, so the model learns *which* item it sees.
  capture     Frames from YOUR store cameras, the most valuable data you can add.
              python scripts/get_data.py capture --source rtsp://user:pass@ip/stream --every 30 --count 300
              Label them in Roboflow (product / empty) and pull them back with `roboflow`.
  convert     VOC or COCO -> YOLO, with label mapping into product/empty.
  merge       Combine several YOLO datasets into datasets/shelfora (the training set).
"""
from __future__ import annotations
import argparse
import json
import random
import shutil
import subprocess
import time
import xml.etree.ElementTree as ET
from pathlib import Path

CLASSES = ["product", "empty"]
EMPTY_WORDS = ("empty", "gap", "void", "missing", "oos", "out_of_stock", "out-of-stock")
DS = Path("datasets")


def target_class(name: str) -> int:
    n = name.lower()
    return 1 if any(w in n for w in EMPTY_WORDS) else 0


# ── sources ──────────────────────────────────────────────────────────────────
def cmd_roboflow(a):
    from roboflow import Roboflow
    out = DS / f"rf-{a.project}"
    Roboflow(api_key=a.api_key).workspace(a.workspace).project(a.project).version(a.version).download("yolov8", location=str(out))
    remap_yolo(out)
    print(f"Saved {out}")


def cmd_kaggle(a):
    out = DS / ("kg-" + a.dataset.split("/")[-1])
    out.mkdir(parents=True, exist_ok=True)
    subprocess.run(["kaggle", "datasets", "download", "-d", a.dataset, "-p", str(out), "--unzip"], check=True)
    print(f"Downloaded to {out}. If it's VOC/COCO, run: python scripts/get_data.py convert --src {out} --format voc|coco")


def cmd_kaggle_comp(a):
    out = DS / ("kc-" + a.competition)
    out.mkdir(parents=True, exist_ok=True)
    r = subprocess.run(["kaggle", "competitions", "download", "-c", a.competition, "-p", str(out)], capture_output=True, text=True)
    if r.returncode != 0:
        msg = r.stderr or r.stdout
        if "403" in msg:
            raise SystemExit("Kaggle refused the download (403). Open the competition page, click 'Join' / 'I understand and accept' on its rules, then run this again.")
        raise SystemExit(msg)
    for z in out.glob("*.zip"):
        shutil.unpack_archive(str(z), str(out))
        z.unlink()
    print(f"Downloaded to {out}")
    a.src, a.keep_classes = str(out), True
    cmd_auto(a)


IMG_EXT = (".jpg", ".jpeg", ".png", ".bmp", ".webp")


def detect_format(root: Path) -> str:
    if any(root.rglob("data.yaml")) or (any(root.rglob("labels/*.txt")) and any(root.rglob("images/*"))):
        return "yolo"
    for js in root.rglob("*.json"):
        try:
            head = json.loads(js.read_text())
            if isinstance(head, dict) and "annotations" in head and "images" in head:
                return "coco"
        except Exception:
            continue
    if any(root.rglob("*.xml")):
        return "voc"
    for c in root.rglob("*.csv"):
        cols = {x.strip().lower() for x in c.open().readline().split(",")}
        if cols & {"xmin", "x_min", "x1", "bbox", "left"}:
            return "csv"
    return "unknown"


def cmd_auto(a):
    src = Path(a.src)
    fmt = detect_format(src)
    print(f"Detected format: {fmt}")
    if fmt == "unknown":
        files = sorted({p.suffix.lower() for p in src.rglob("*") if p.is_file()})
        raise SystemExit(f"Couldn't recognise the labels in {src} (file types: {files}). "
                         "If it only has images, label them in Roboflow and import with `roboflow`.")
    if fmt == "yolo":
        if not a.keep_classes:
            remap_yolo(src)
        print(f"Already YOLO format: use {src} with merge/train")
        return
    a.format = fmt
    cmd_convert(a)


class Labeler:
    """Maps source label names to class ids: product/empty, or the dataset's own classes."""

    def __init__(self, keep: bool):
        self.keep, self.names = keep, ([] if keep else list(CLASSES))

    def __call__(self, name: str) -> int:
        if not self.keep:
            return target_class(name)
        name = (name or "item").strip()
        if name not in self.names:
            self.names.append(name)
        return self.names.index(name)


def _read_csv_boxes(src: Path):
    """Yield (image_name, label, x1, y1, x2, y2, normalized?) from common Kaggle CSV layouts."""
    import csv as _csv
    for c in src.rglob("*.csv"):
        rows = list(_csv.DictReader(c.open()))
        if not rows:
            continue
        keys = {k.strip().lower(): k for k in rows[0].keys()}
        pick = lambda *opts: next((keys[o] for o in opts if o in keys), None)  # noqa: E731
        fcol = pick("filename", "file_name", "image", "image_id", "image_name", "img", "path")
        lcol = pick("class", "label", "class_name", "category", "name", "labels")
        x1c, y1c = pick("xmin", "x_min", "x1", "left"), pick("ymin", "y_min", "y1", "top")
        x2c, y2c = pick("xmax", "x_max", "x2", "right"), pick("ymax", "y_max", "y2", "bottom")
        wc, hc = pick("width", "w", "box_width"), pick("height", "h", "box_height")
        bcol = pick("bbox")
        if not fcol:
            continue
        for r in rows:
            try:
                if bcol and r.get(bcol):
                    x, y, w, h = (float(v) for v in r[bcol].strip("[]() ").replace(";", ",").split(",")[:4])
                    x1, y1, x2, y2 = x, y, x + w, y + h
                elif x1c and y1c and x2c and y2c:
                    x1, y1, x2, y2 = (float(r[k]) for k in (x1c, y1c, x2c, y2c))
                elif x1c and y1c and wc and hc:
                    x1, y1 = float(r[x1c]), float(r[y1c]); x2, y2 = x1 + float(r[wc]), y1 + float(r[hc])
                else:
                    continue
            except (ValueError, TypeError):
                continue
            yield r[fcol], (r.get(lcol) if lcol else "item"), x1, y1, x2, y2, max(x1, y1, x2, y2) <= 1.0


def cmd_capture(a):
    import cv2
    out = DS / "store-frames" / "images"
    out.mkdir(parents=True, exist_ok=True)
    cap = cv2.VideoCapture(int(a.source) if a.source.isdigit() else a.source)
    saved = 0
    while saved < a.count:
        ok, frame = cap.read()
        if not ok:
            print("Stream ended or dropped; retrying in 5s"); time.sleep(5)
            cap = cv2.VideoCapture(a.source); continue
        cv2.imwrite(str(out / f"{a.prefix}_{int(time.time())}_{saved:04d}.jpg"), frame)
        saved += 1
        print(f"saved {saved}/{a.count}", end="\r")
        t0 = time.time()
        while time.time() - t0 < a.every:
            cap.grab()
    print(f"\n{saved} frames in {out}. Upload them to Roboflow and label 'product' and 'empty'.")


# ── format conversion ────────────────────────────────────────────────────────
def remap_yolo(root: Path):
    """Rewrite class ids of a YOLO dataset (with data.yaml names) into product/empty."""
    import yaml
    yml = next(root.glob("data.yaml"), None)
    if not yml:
        return
    names = yaml.safe_load(yml.read_text())["names"]
    names = list(names.values()) if isinstance(names, dict) else names
    mapping = {i: target_class(n) for i, n in enumerate(names)}
    for txt in root.rglob("labels/*.txt"):
        lines = []
        for ln in txt.read_text().splitlines():
            parts = ln.split()
            if len(parts) == 5:  # boxes only; polygons are converted to their bounding box
                lines.append(" ".join([str(mapping[int(parts[0])]), *parts[1:]]))
            elif len(parts) > 5:
                xs, ys = [float(v) for v in parts[1::2]], [float(v) for v in parts[2::2]]
                x1, x2, y1, y2 = min(xs), max(xs), min(ys), max(ys)
                lines.append(f"{mapping[int(parts[0])]} {(x1+x2)/2:.6f} {(y1+y2)/2:.6f} {x2-x1:.6f} {y2-y1:.6f}")
        txt.write_text("\n".join(lines) + ("\n" if lines else ""))
    yml.write_text(f"path: {root.resolve()}\ntrain: train/images\nval: valid/images\nnames: {CLASSES}\n")


def cmd_convert(a):
    src, out = Path(a.src), DS / (Path(a.src).name + "-yolo")
    lab = Labeler(getattr(a, "keep_classes", False))
    (out / "images").mkdir(parents=True, exist_ok=True)
    (out / "labels").mkdir(parents=True, exist_ok=True)
    n = 0
    if a.format == "voc":
        for xml in src.rglob("*.xml"):
            r = ET.parse(xml).getroot()
            fn = r.findtext("filename") or xml.with_suffix(".jpg").name
            img = next(src.rglob(fn), None)
            if not img:
                continue
            w, h = float(r.findtext("size/width")), float(r.findtext("size/height"))
            rows = []
            for o in r.iter("object"):
                b = o.find("bndbox")
                x1, y1, x2, y2 = (float(b.findtext(k)) for k in ("xmin", "ymin", "xmax", "ymax"))
                rows.append(f"{lab(o.findtext('name') or '')} {(x1+x2)/2/w:.6f} {(y1+y2)/2/h:.6f} {(x2-x1)/w:.6f} {(y2-y1)/h:.6f}")
            shutil.copy(img, out / "images" / img.name)
            (out / "labels" / (img.stem + ".txt")).write_text("\n".join(rows) + "\n")
            n += 1
    elif a.format == "csv":
        import cv2
        per: dict[str, list] = {}
        for fn, label, x1, y1, x2, y2, norm in _read_csv_boxes(src):
            per.setdefault(fn, []).append((label, x1, y1, x2, y2, norm))
        for fn, boxes in per.items():
            img = next((p for p in src.rglob(Path(fn).name) if p.suffix.lower() in IMG_EXT), None)
            if img is None:
                img = next((p for p in src.rglob(Path(fn).stem + ".*") if p.suffix.lower() in IMG_EXT), None)
            if img is None:
                continue
            ih, iw = cv2.imread(str(img)).shape[:2]
            rows = []
            for label, x1, y1, x2, y2, norm in boxes:
                if not norm:
                    x1, x2, y1, y2 = x1 / iw, x2 / iw, y1 / ih, y2 / ih
                rows.append(f"{lab(label)} {(x1+x2)/2:.6f} {(y1+y2)/2:.6f} {x2-x1:.6f} {y2-y1:.6f}")
            shutil.copy(img, out / "images" / img.name)
            (out / "labels" / (img.stem + ".txt")).write_text("\n".join(rows) + "\n")
            n += 1
    else:
        for js in src.rglob("*.json"):
            coco = json.loads(js.read_text())
            if "annotations" not in coco:
                continue
            cats = {c["id"]: c["name"] for c in coco["categories"]}
            imgs = {i["id"]: i for i in coco["images"]}
            per: dict[int, list[str]] = {}
            for an in coco["annotations"]:
                im = imgs[an["image_id"]]
                x, y, w, h = an["bbox"]
                per.setdefault(an["image_id"], []).append(
                    f"{lab(cats[an['category_id']])} {(x+w/2)/im['width']:.6f} {(y+h/2)/im['height']:.6f} {w/im['width']:.6f} {h/im['height']:.6f}")
            for iid, rows in per.items():
                img = next(src.rglob(Path(imgs[iid]["file_name"]).name), None)
                if not img:
                    continue
                shutil.copy(img, out / "images" / img.name)
                (out / "labels" / (img.stem + ".txt")).write_text("\n".join(rows) + "\n")
                n += 1
    (out / "data.yaml").write_text(f"path: {out.resolve()}\ntrain: images\nval: images\nnames: {json.dumps(lab.names)}\n")
    print(f"Converted {n} images to {out} with {len(lab.names)} classes")


def cmd_merge(a):
    """Merge YOLO datasets (flat images/labels or train/valid splits) into one set with a fresh 85/15 split.

    Default: everything collapsed to product/empty -> datasets/shelfora.
    --keep-classes: class names are unified across sources -> datasets/<name> (multi-class).
    """
    import yaml
    out = DS / a.name
    names: list[str] = list(CLASSES) if not a.keep_classes else []
    remaps: dict[str, dict[int, int]] = {}
    for s in a.sources:
        yml = next(Path(s).rglob("data.yaml"), None)
        src_names = yaml.safe_load(yml.read_text())["names"] if yml else list(CLASSES)
        src_names = list(src_names.values()) if isinstance(src_names, dict) else list(src_names)
        m = {}
        for i, nm in enumerate(src_names):
            if a.keep_classes:
                if nm not in names:
                    names.append(nm)
                m[i] = names.index(nm)
            else:
                m[i] = target_class(nm) if nm not in CLASSES else CLASSES.index(nm)
        remaps[Path(s).name] = m
    if out.exists():
        shutil.rmtree(out)
    pairs = []
    for s in a.sources:
        for img in Path(s).rglob("images/*"):
            if img.suffix.lower() not in (".jpg", ".jpeg", ".png", ".bmp", ".webp"):
                continue
            lbl = img.parent.parent / "labels" / (img.stem + ".txt")
            if lbl.exists():
                pairs.append((Path(s).name, img, lbl))
    random.Random(0).shuffle(pairs)
    n_val = max(1, int(len(pairs) * 0.15))
    for i, (tag, img, lbl) in enumerate(pairs):
        split = "val" if i < n_val else "train"
        for kind in ("images", "labels"):
            (out / split / kind).mkdir(parents=True, exist_ok=True)
        shutil.copy(img, out / split / "images" / f"{tag}__{img.name}")
        m = remaps[tag]
        lines = []
        for ln in lbl.read_text().splitlines():
            parts = ln.split()
            if len(parts) >= 5:
                lines.append(" ".join([str(m.get(int(parts[0]), int(parts[0]))), *parts[1:5]]))
        (out / split / "labels" / f"{tag}__{lbl.name}").write_text("\n".join(lines) + ("\n" if lines else ""))
    (out / "data.yaml").write_text(f"path: {out.resolve()}\ntrain: train/images\nval: val/images\nnames: {json.dumps(names)}\n")
    print(f"Merged {len(pairs)} labelled images ({n_val} for validation), {len(names)} classes, into {out}")


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = p.add_subparsers(dest="cmd", required=True)
    r = sp.add_parser("roboflow"); r.add_argument("--api-key", required=True); r.add_argument("--workspace", required=True); r.add_argument("--project", required=True); r.add_argument("--version", type=int, default=1)
    k = sp.add_parser("kaggle"); k.add_argument("--dataset", required=True)
    c = sp.add_parser("capture"); c.add_argument("--source", required=True); c.add_argument("--every", type=float, default=30); c.add_argument("--count", type=int, default=300); c.add_argument("--prefix", default="cam")
    kc = sp.add_parser("kaggle-comp"); kc.add_argument("--competition", required=True)
    v = sp.add_parser("convert"); v.add_argument("--src", required=True); v.add_argument("--format", choices=["voc", "coco", "csv"], required=True); v.add_argument("--keep-classes", action="store_true")
    au = sp.add_parser("auto", help="detect the label format and convert"); au.add_argument("--src", required=True); au.add_argument("--keep-classes", action="store_true")
    m = sp.add_parser("merge"); m.add_argument("sources", nargs="+"); m.add_argument("--keep-classes", action="store_true"); m.add_argument("--name", default="shelfora")
    sp.add_parser("sku110k")
    a = p.parse_args()
    if a.cmd == "sku110k":
        print("SKU-110K downloads automatically on first use: python scripts/train.py --stage base")
        return
    {"roboflow": cmd_roboflow, "kaggle": cmd_kaggle, "kaggle-comp": cmd_kaggle_comp, "capture": cmd_capture,
     "convert": cmd_convert, "auto": cmd_auto, "merge": cmd_merge}[a.cmd](a)


if __name__ == "__main__":
    main()
