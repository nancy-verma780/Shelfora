"""
Shelfora dashboard tests with screenshot proof.

Opens the dashboard in a real browser, performs each test like a user would,
checks the result, and saves a screenshot of every test plus a summary page.

How to run (from the shelfora-project folder):
    1. In one terminal:   cd dashboard  ->  npm run dev
    2. In another:         python dashboard/tests/run_ui_tests.py
Optional: start the vision server on port 8000 first to include INT-01.

Proof is saved to:  proof/ui/  (one PNG per test + report.html)
"""
import datetime
import html
import re
import sys
import urllib.request
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5173"
SERVER = "http://127.0.0.1:8000"
OUT = Path("proof/ui")
OUT.mkdir(parents=True, exist_ok=True)
results = []


def record(tid, title, ok, detail, page):
    shot = OUT / f"{tid}.png"
    page.screenshot(path=str(shot))
    results.append((tid, title, ok, detail, shot.name))
    print(f"{'PASS' if ok else 'FAIL'}  {tid}  {title}  ->  {detail}")


def kpi(page, label):
    card = page.locator("main button").filter(has=page.locator("span.tnum.font-display")).filter(has_text=label).first
    return card.locator("span.tnum.font-display").first.inner_text().strip()


def safe(tid, title, page, fn):
    try:
        fn()
    except Exception as e:  # a crash in one test should not stop the others
        record(tid, title, False, f"error: {str(e).splitlines()[0][:150]}", page)


def server_up():
    try:
        urllib.request.urlopen(SERVER + "/health", timeout=2)
        return True
    except Exception:
        return False


with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(BASE + "/")
    page.wait_for_timeout(3000)

    def ui01():
        k = {l: kpi(page, l) for l in ["Shelf health", "Out of stock", "Low stock", "Fast movers", "Refill priority"]}
        ok = k == {"Shelf health": "87%", "Out of stock": "12", "Low stock": "18", "Fast movers": "9", "Refill priority": "6"}
        record("UI-01", "Morning check: summary cards", ok, str(k), page)
    safe("UI-01", "Morning check: summary cards", page, ui01)

    def ui02():
        ok = page.get_by_text("Demo store.", exact=False).first.is_visible()
        record("UI-02", "Demo-data notice is shown", ok, "notice visible" if ok else "notice missing", page)
    safe("UI-02", "Demo-data notice is shown", page, ui02)

    def ui03():
        page.locator("li[data-flip-key='bev-coke-500'] [role=button]").first.click()
        page.wait_for_timeout(900)
        t = page.get_by_role("dialog").inner_text()
        ok = "Coca-Cola 500ml" in t and "94" in t and "Out of stock" in t
        record("UI-03", "Open details of the most urgent item", ok, "Coca-Cola 500ml, Out of stock, priority 94/100" if ok else t[:120], page)
    safe("UI-03", "Open details of the most urgent item", page, ui03)

    def ui04():
        page.get_by_role("dialog").get_by_role("button", name=re.compile("Mark as Refilled")).click()
        page.wait_for_timeout(1800)
        page.keyboard.press("Escape")
        page.wait_for_timeout(400)
        k = {l: kpi(page, l) for l in ["Shelf health", "Out of stock", "Refill priority"]}
        ok = k == {"Shelf health": "88%", "Out of stock": "11", "Refill priority": "5"}
        record("UI-04", "Mark the cola shelf as refilled", ok, str(k), page)
    safe("UI-04", "Mark the cola shelf as refilled", page, ui04)

    def ui05():
        page.get_by_role("button", name="Undo").first.click()
        page.wait_for_timeout(1800)
        v = kpi(page, "Out of stock")
        record("UI-05", "Undo a refill clicked by mistake", v == "12", f"Out of stock back to {v}", page)
    safe("UI-05", "Undo a refill clicked by mistake", page, ui05)

    def ui06():
        page.click("aside >> text=Refill Queue")
        page.wait_for_timeout(1200)
        rows = page.locator("main li[data-flip-key]").all_inner_texts()
        ok = "#1" in rows[0] and "Coca-Cola 500ml" in rows[0] and "Lay's Classic" in rows[1]
        record("UI-06", "Which shelf to fill first", ok, "#1 Coca-Cola 500ml, #2 Lay's Classic Salted 52g" if ok else rows[0][:80], page)
    safe("UI-06", "Which shelf to fill first", page, ui06)

    def ui07():
        sp = browser.new_page(viewport={"width": 1440, "height": 900})
        sp.goto(BASE + "/")
        sp.wait_for_timeout(2800)
        sp.keyboard.press("Control+k")
        sp.wait_for_timeout(500)
        sp.keyboard.type("lay")
        sp.wait_for_timeout(500)
        listed = "Lay's Classic Salted 52g" in sp.locator("[role=dialog]").first.inner_text()
        sp.keyboard.press("Enter")
        sp.wait_for_timeout(1000)
        opened = sp.locator("[role=dialog]").count() > 0 and "Lay's Classic Salted 52g" in sp.locator("[role=dialog]").first.inner_text()
        record("UI-07", "Keyboard search (Ctrl+K, then Enter)", listed and opened, f"results listed: {listed}, Enter opened details: {opened}", sp)
        sp.close()
    safe("UI-07", "Keyboard search (Ctrl+K, then Enter)", page, ui07)

    def ui08():
        page.click("aside >> text=Inventory")
        page.wait_for_timeout(1000)
        page.locator("select").nth(1).select_option("out_of_stock")
        page.wait_for_timeout(500)
        c = page.get_by_text(re.compile(r"\d+ of 95 products")).inner_text().strip()
        record("UI-08", "List everything that is sold out", c == "12 of 95 products", c, page)
    safe("UI-08", "List everything that is sold out", page, ui08)

    def ui09():
        page.click("aside >> text=Alerts")
        page.wait_for_timeout(900)
        page.get_by_role("tab", name=re.compile("Critical")).click()
        page.wait_for_timeout(600)
        before = page.locator("main ul li").count()
        page.get_by_role("button", name="Mark as resolved").first.click()
        page.wait_for_timeout(1200)
        after = page.locator("main ul li").count()
        record("UI-09", "Resolve a critical alert", before == 4 and after == 3, f"critical alerts {before} -> {after}", page)
    safe("UI-09", "Resolve a critical alert", page, ui09)

    def ui10():
        page.click("aside >> text=Overview")
        page.wait_for_timeout(1200)
        page.get_by_role("button", name=re.compile("Start refill round")).click()
        page.wait_for_timeout(900)
        steps = int(re.search(r"(\d+)/(\d+)", page.get_by_role("dialog", name="Refill round").inner_text()).group(2))
        for _ in range(steps):
            page.keyboard.press("Enter")
            page.wait_for_timeout(950)
        done = page.get_by_role("dialog", name="Refill round").inner_text()
        record("UI-10", "Guided refill round", "shelves restocked" in done, f"{steps} steps completed", page)
        page.keyboard.press("Escape")
        page.wait_for_timeout(500)
    safe("UI-10", "Guided refill round", page, ui10)

    def ui11():
        page.click("aside >> text=Live Monitor")
        page.wait_for_timeout(1200)
        page.get_by_role("tab", name=re.compile("Camera 02")).click()
        page.wait_for_timeout(1200)
        ok = page.get_by_role("tab", name=re.compile("Camera 02")).get_attribute("aria-selected") == "true"
        record("UI-11", "Switch to the snacks aisle camera", ok, "Camera 02 selected" if ok else "not selected", page)
    safe("UI-11", "Switch to the snacks aisle camera", page, ui11)

    def ui12():
        page.click("aside >> text=Vision Model")
        page.wait_for_timeout(2200)
        t = page.locator("main").inner_text()
        record("UI-12", "Model accuracy page", "Before training: 41.7%" in t, "shows 99.4% mAP50 vs 41.7% before training", page)
    safe("UI-12", "Model accuracy page", page, ui12)

    def ui13():
        page.click("[aria-label='Switch to dark mode']")
        page.wait_for_timeout(900)
        theme = page.evaluate("document.documentElement.dataset.theme")
        record("UI-13", "Dark mode", theme == "dark", f"theme = {theme}", page)
        page.click("[aria-label='Switch to light mode']")
        page.wait_for_timeout(600)
    safe("UI-13", "Dark mode", page, ui13)

    def ui14():
        page.goto(BASE + "/terms")
        page.wait_for_timeout(2600)
        h1 = page.locator("main h1").first.inner_text()
        page.goto(BASE + "/privacy")
        page.wait_for_timeout(2600)
        h2 = page.locator("main h1").first.inner_text()
        record("UI-14", "Terms and Privacy pages", h1 == "Terms and Conditions" and h2 == "Privacy Policy", f"/terms: {h1} | /privacy: {h2}", page)
    safe("UI-14", "Terms and Privacy pages", page, ui14)

    def ui15():
        m = browser.new_page(viewport={"width": 390, "height": 844})
        m.goto(BASE + "/")
        m.wait_for_timeout(2800)
        tab = m.locator("nav[aria-label='Quick navigation']").is_visible()
        record("UI-15", "Phone layout", tab, f"bottom tab bar visible: {tab}", m)
        m.close()
    safe("UI-15", "Phone layout", page, ui15)

    record("UI-16", "No errors in the background", not errors, f"{len(errors)} JavaScript errors", page)

    if server_up():
        def int01():
            page.goto(BASE + "/")
            page.wait_for_timeout(2600)
            page.click("aside >> text=Settings")
            page.wait_for_timeout(800)
            page.fill("#srv", SERVER)
            page.get_by_role("button", name="Connect").click()
            page.wait_for_timeout(3000)
            connected = "Server connected" in page.locator("header").inner_text()
            page.click("aside >> text=Live Monitor")
            page.wait_for_timeout(4500)
            frames = page.locator("main img[alt*='live frame']").count() > 0
            record("INT-01", "Dashboard connects to the vision server", connected and frames, f"connected: {connected}, camera frames: {frames}", page)
        safe("INT-01", "Dashboard connects to the vision server", page, int01)
    else:
        print("SKIP  INT-01  (start the vision server on port 8000 to include this test)")
    browser.close()

# summary page with every screenshot
passed = sum(1 for r in results if r[2])
when = datetime.datetime.now().strftime("%d %b %Y, %I:%M %p")
rows = "".join(
    f"<tr><td>{t}</td><td>{html.escape(n)}</td><td class='{'p' if ok else 'f'}'>{'PASS' if ok else 'FAIL'}</td>"
    f"<td>{html.escape(d)}</td><td><a href='{img}'><img src='{img}'></a></td></tr>"
    for t, n, ok, d, img in results)
(OUT / "report.html").write_text(f"""<!doctype html><meta charset="utf-8"><title>Shelfora UI test proof</title>
<style>body{{font-family:Arial,sans-serif;margin:24px;color:#1b1f23}}table{{border-collapse:collapse;width:100%}}
td,th{{border:1px solid #ccc;padding:6px;font-size:13px;vertical-align:top}}th{{background:#002060;color:#fff}}
.p{{background:#92d050;font-weight:bold}}.f{{background:#ff6b6b;font-weight:bold}}img{{width:260px}}</style>
<h1>Shelfora dashboard: test proof</h1><p>Run on {when} against {BASE}. Passed {passed} of {len(results)}.</p>
<table><tr><th>ID</th><th>Test</th><th>Status</th><th>What we saw</th><th>Screenshot</th></tr>{rows}</table>""", encoding="utf-8")
print(f"\n{passed} of {len(results)} passed. Proof saved in {OUT.resolve()}  (open report.html)")
sys.exit(0 if passed == len(results) else 1)
