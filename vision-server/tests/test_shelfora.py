import json, os, subprocess, sys, time
from pathlib import Path

os.environ["SHELFORA_NO_AUTOAPP"] = "1"
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from shelfora.config import Product, load
from shelfora.shelf import Detection, Smoother, slot_reading


def prod(**kw):
    base = dict(id="p", name="P", category="Snacks", section="snacks", shelf="A1", camera="cam-02",
                capacity=40, facings_full=4, normal_rate=2.0, slot=(0.0, 0.0, 0.5, 0.5))
    return Product(**{**base, **kw})


def test_slot_counts_only_boxes_whose_centre_is_inside():
    p = prod()
    dets = [Detection(0.05, 0.1, 0.1, 0.3, 0.9), Detection(0.15, 0.1, 0.2, 0.3, 0.9),
            Detection(0.45, 0.1, 0.6, 0.3, 0.9),  # centre 0.525: outside
            Detection(0.3, 0.1, 0.35, 0.3, 0.8, "empty")]
    r = slot_reading(p, dets, {"empty"})
    assert r["facings"] == 2 and r["gaps"] == 1 and r["units"] == 20


def test_full_and_overfull_slot_caps_at_capacity():
    p = prod()
    dets = [Detection(0.02 + i * 0.05, 0.1, 0.05 + i * 0.05, 0.3, 0.9) for i in range(7)]
    assert slot_reading(p, dets, set())["units"] == 40


def test_empty_slot_is_zero():
    assert slot_reading(prod(), [], set())["units"] == 0


def test_smoother_ignores_single_blocked_frame():
    s = Smoother(3); s.reset("p", 30)
    assert s.push("p", 0) == 30  # a shopper blocks the view once
    assert s.push("p", 0) == 0   # still empty next frame: believe it


def test_voc_and_coco_conversion_and_merge(tmp_path, monkeypatch):
    import cv2, numpy as np
    monkeypatch.chdir(tmp_path)
    voc = tmp_path / "vocset"; voc.mkdir()
    cv2.imwrite(str(voc / "a.jpg"), np.zeros((100, 200, 3), np.uint8))
    (voc / "a.xml").write_text("<annotation><filename>a.jpg</filename><size><width>200</width><height>100</height></size>"
                               "<object><name>coke_bottle</name><bndbox><xmin>10</xmin><ymin>10</ymin><xmax>50</xmax><ymax>90</ymax></bndbox></object>"
                               "<object><name>empty_space</name><bndbox><xmin>100</xmin><ymin>10</ymin><xmax>150</xmax><ymax>90</ymax></bndbox></object></annotation>")
    coco = tmp_path / "cocoset"; coco.mkdir()
    cv2.imwrite(str(coco / "b.jpg"), np.zeros((100, 100, 3), np.uint8))
    (coco / "ann.json").write_text(json.dumps({"images": [{"id": 1, "file_name": "b.jpg", "width": 100, "height": 100}],
        "categories": [{"id": 3, "name": "Gap"}], "annotations": [{"image_id": 1, "category_id": 3, "bbox": [0, 0, 50, 50]}]}))
    script = str(ROOT / "scripts" / "get_data.py")
    subprocess.run([sys.executable, script, "convert", "--src", str(voc), "--format", "voc"], check=True)
    subprocess.run([sys.executable, script, "convert", "--src", str(coco), "--format", "coco"], check=True)
    lines = (tmp_path / "datasets/vocset-yolo/labels/a.txt").read_text().split("\n")
    assert lines[0].startswith("0 0.150000 0.500000") and lines[1].startswith("1 ")
    assert (tmp_path / "datasets/cocoset-yolo/labels/b.txt").read_text().startswith("1 0.250000 0.250000 0.5")
    subprocess.run([sys.executable, script, "merge", "datasets/vocset-yolo", "datasets/cocoset-yolo"], check=True)
    assert len(list((tmp_path / "datasets/shelfora").rglob("labels/*.txt"))) == 2
    import yaml
    assert yaml.safe_load((tmp_path / "datasets/shelfora/data.yaml").read_text())["names"] == ["product", "empty"]


def test_api_demo_end_to_end(tmp_path, monkeypatch):
    from fastapi.testclient import TestClient
    from shelfora.api import create_app
    monkeypatch.setenv("SHELFORA_DB", str(tmp_path / "s.db"))
    c = TestClient(create_app(str(ROOT / "config/store.yaml")))
    assert c.get("/health").json()["mode"] == "demo"
    ps = {p["id"]: p for p in c.get("/products").json()}
    assert len(ps) == 95 and ps["bev-coke-500"]["estimatedStock"] == 0
    assert ps["bev-coke-500"]["salesVelocity"] > 2.0  # measured before it ran out
    assert c.post("/products/bev-coke-500/refill", json={"by": "Ravi"}).status_code == 200
    assert {p["id"]: p for p in c.get("/products").json()}["bev-coke-500"]["estimatedStock"] == 48
    r = c.post("/sales", json=[{"product_id": "bev-coke-500", "qty": 3}, {"product_id": "nope"}]).json()
    assert r["accepted"] == 1 and r["rejected"] == 1
    time.sleep(3.5)
    assert c.get("/cameras/cam-01/frame.jpg").headers["content-type"] == "image/jpeg"
    assert any(e["kind"] == "refilled" for e in c.get("/events").json())


def test_multiclass_slot_counts_only_its_own_product_and_flags_misplaced():
    p = prod(model_class="coca_cola_500ml")
    dets = [Detection(0.05, 0.1, 0.1, 0.3, 0.9, "coca_cola_500ml"), Detection(0.15, 0.1, 0.2, 0.3, 0.9, "coca_cola_500ml"),
            Detection(0.25, 0.1, 0.3, 0.3, 0.9, "pepsi_500ml")]
    r = slot_reading(p, dets, {"empty"})
    assert r["facings"] == 2 and r["units"] == 20 and r["misplaced"] == ["pepsi_500ml"]


def test_kaggle_style_csv_keeps_grocery_classes_and_merges(tmp_path, monkeypatch):
    import cv2, numpy as np
    monkeypatch.chdir(tmp_path)
    src = tmp_path / "kc-grocery"; (src / "train").mkdir(parents=True)
    for n in ("s1.jpg", "s2.jpg"):
        cv2.imwrite(str(src / "train" / n), np.zeros((200, 400, 3), np.uint8))
    (src / "train_labels.csv").write_text(
        "filename,width,height,class,xmin,ymin,xmax,ymax\n"
        "s1.jpg,400,200,Milk,0,0,100,100\n"
        "s1.jpg,400,200,Bread,200,0,300,200\n"
        "s2.jpg,400,200,Milk,40,20,80,60\n")
    script = str(ROOT / "scripts" / "get_data.py")
    out = subprocess.run([sys.executable, script, "auto", "--src", str(src), "--keep-classes"], check=True, capture_output=True, text=True).stdout
    assert "Detected format: csv" in out
    lbl = (tmp_path / "datasets/kc-grocery-yolo/labels/s1.txt").read_text().split("\n")
    assert lbl[0] == "0 0.125000 0.250000 0.250000 0.500000" and lbl[1].startswith("1 0.625000")
    # a second source with an overlapping class list gets unified names
    y = tmp_path / "other"; (y / "images").mkdir(parents=True); (y / "labels").mkdir()
    cv2.imwrite(str(y / "images/o.jpg"), np.zeros((10, 10, 3), np.uint8))
    (y / "labels/o.txt").write_text("1 0.5 0.5 0.2 0.2\n")
    (y / "data.yaml").write_text("names: ['Eggs', 'Milk']\n")
    subprocess.run([sys.executable, script, "merge", "datasets/kc-grocery-yolo", str(y), "--keep-classes", "--name", "grocery"], check=True)
    import yaml
    names = yaml.safe_load((tmp_path / "datasets/grocery/data.yaml").read_text())["names"]
    assert names == ["Milk", "Bread", "Eggs"]
    o = next((tmp_path / "datasets/grocery").rglob("other__o.txt")).read_text()
    assert o.startswith("0 ")  # 'Milk' in the second source is remapped to the shared id


def test_class_mapping_needs_same_brand_and_size():
    import importlib.util, yaml
    names = tmp = None
    spec = importlib.util.spec_from_file_location("mc", ROOT / "scripts" / "map_classes.py")
    src = (ROOT / "scripts" / "map_classes.py").read_text()
    ns: dict = {}
    exec(src.split("cfg = yaml.safe_load")[0].split("a = ap.parse_args()")[0] + src[src.index("SIZE ="):src.index("cfg = yaml.safe_load")], ns)
    sim = ns["similarity"]
    assert sim("Coca-Cola 500ml", "coca cola 500ml") > 0.9
    assert sim("Fanta Orange 500ml", "coca cola 500ml") == 0.0
    assert sim("Coca-Cola 1.25L", "coca cola 500ml") < 0.45


def test_trained_model_finds_products_on_a_real_shelf_photo():
    import pytest
    pytest.importorskip("ultralytics")
    import numpy as np
    from shelfora.detector import Detector
    det = Detector(str(ROOT / "models/shelfora-shelf.pt"))
    blank = np.full((480, 640, 3), 90, np.uint8)
    assert len(det(blank)) == 0  # nothing on an empty wall
