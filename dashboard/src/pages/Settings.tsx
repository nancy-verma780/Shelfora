import { ArrowDown, Cctv, CheckCircle2, CircleDashed, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { cameras } from "../data/cameras";
import { PRIORITY_WEIGHTS } from "../lib/logic";
import { useStore } from "../state/StoreContext";
import { Button, Card, PageHeader, cx } from "../components/ui";
import { ConnectStore } from "../components/ConnectStore";

function Row({ title, body, children }: { title: string; body: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
      <div className="max-w-md">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="text-[13px] text-ink2">{body}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      className={cx("relative h-6 w-11 rounded-full transition-colors", on ? "bg-teal" : "bg-line")}>
      <span className={cx("absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", on ? "translate-x-[22px]" : "translate-x-0.5")} />
    </button>
  );
}

function pipeline(mode: "sample" | "demo" | "live") {
  const server = mode !== "sample";
  return [
    { name: "Existing CCTV cameras (RTSP)", now: mode === "live" ? "Streaming from your store" : mode === "demo" ? "Simulated camera on your server" : "Sample footage", live: mode === "live" },
    { name: "Frame sampling with OpenCV", now: server ? "Running on your server" : "Not connected", live: server },
    { name: "Product detection with YOLO", now: mode === "live" ? "Your trained model" : mode === "demo" ? "Simulated detections" : "Not connected", live: mode === "live" },
    { name: "Shelf slots, smoothing and stock estimate", now: server ? "Running on your server" : "Not connected", live: server },
    { name: "POS sales and selling speed", now: server ? "Sales log on your server" : "Sample rates", live: server },
    { name: "Refill priority", now: "Running in the dashboard", live: true },
    { name: "Shelfora dashboard", now: "You are here", live: true },
  ];
}

export function Settings() {
  const { settings, updateSettings, resetDemo, kpis, connection } = useStore();
  const mode = connection.status !== "live" ? "sample" : connection.health?.mode === "live" ? "live" : "demo";
  const PIPELINE = pipeline(mode);
  return (
    <div>
      <PageHeader title="Settings" subtitle="Tune when Shelfora calls something low or fast, and who gets told." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <Card className="px-5 sm:px-6">
            <h2 className="pt-5 font-display text-base font-bold">Shelf rules</h2>
            <div className="divide-y divide-line">
              <Row title="Low-stock line" body={`A product counts as low when its shelf drops to ${Math.round(settings.lowStockThreshold * 100)}% of capacity or less. Right now that's ${kpis.lowStock} products.`}>
                <div className="flex items-center gap-3">
                  <input type="range" min={15} max={40} step={5} value={Math.round(settings.lowStockThreshold * 100)} onChange={(e) => updateSettings({ lowStockThreshold: Number(e.target.value) / 100 })} className="w-40 accent-[rgb(var(--teal))]" aria-label="Low-stock line" />
                  <span className="tnum w-10 text-sm font-semibold">{Math.round(settings.lowStockThreshold * 100)}%</span>
                </div>
              </Row>
              <Row title="Fast-mover mark" body={`A product is a fast mover when it sells at ${settings.fastMoverThreshold.toFixed(1)}× its normal rate or more. Right now that's ${kpis.fastMovers} products.`}>
                <div className="flex items-center gap-3">
                  <input type="range" min={1.2} max={2.2} step={0.1} value={settings.fastMoverThreshold} onChange={(e) => updateSettings({ fastMoverThreshold: Number(e.target.value) })} className="w-40 accent-[rgb(var(--teal))]" aria-label="Fast-mover mark" />
                  <span className="tnum w-10 text-sm font-semibold">{settings.fastMoverThreshold.toFixed(1)}×</span>
                </div>
              </Row>
            </div>
          </Card>

          <Card className="px-5 sm:px-6">
            <h2 className="pt-5 font-display text-base font-bold">Notifications</h2>
            <div className="divide-y divide-line">
              <Row title="Push critical alerts to my phone" body="When a fast-selling product runs out."><Toggle label="Push critical alerts" on={settings.pushCritical} onChange={(v) => updateSettings({ pushCritical: v })} /></Row>
              <Row title="Play a sound for new alerts" body="Useful on the back-office screen."><Toggle label="Sound alerts" on={settings.soundAlerts} onChange={(v) => updateSettings({ soundAlerts: v })} /></Row>
              <Row title="Morning summary" body="A short list of what to refill first, sent at store opening."><Toggle label="Morning summary" on={settings.dailySummary} onChange={(v) => updateSettings({ dailySummary: v })} /></Row>
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="font-display text-base font-bold">How refill priority is worked out</h2>
            <p className="mt-1 text-[13px] text-ink2">Every product gets a score out of 100. Empty, fast-selling products rise to the top; low but slow ones wait.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                { k: "Stock level", w: PRIORITY_WEIGHTS.stockRisk, c: "bg-empty", d: "Full marks when the shelf is empty." },
                { k: "Selling speed", w: PRIORITY_WEIGHTS.velocity, c: "bg-fast", d: "Compared with this product’s normal rate." },
                { k: "Time to empty", w: PRIORITY_WEIGHTS.timeToEmpty, c: "bg-low", d: "Hours of stock left at today’s pace." },
              ].map((x) => (
                <div key={x.k} className="rounded-xl bg-sunken/70 p-3.5">
                  <div className="flex items-center gap-2"><span className={cx("h-2.5 w-2.5 rounded-full", x.c)} /><span className="text-sm font-semibold">{x.k}</span></div>
                  <p className="tnum mt-1 font-display text-xl font-bold">{x.w * 100} pts</p>
                  <p className="text-xs text-ink2">{x.d}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <ConnectStore />
          <Card className="p-5">
            <h2 className="font-display text-base font-bold">Cameras</h2>
            <ul className="mt-3 divide-y divide-line">
              {cameras.map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-sunken text-ink2"><Cctv className="h-4 w-4" /></span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">{c.label} · {c.name}</span>
                    <span className="block text-xs text-ink3">{c.resolution} · {c.fps} fps · Racks {c.racks.join(", ")}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ok"><span className="h-1.5 w-1.5 rounded-full bg-ok" />Connected</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <h2 className="font-display text-base font-bold">Where the data comes from</h2>
            <p className="mt-1 text-[13px] text-ink2">{mode === "sample" ? "Showing sample data. Connect a Shelfora Vision server to run the real pipeline." : "Each step and where it's running right now."}</p>
            <ol className="mt-4">
              {PIPELINE.map((s, i) => (
                <li key={s.name}>
                  <div className="flex items-start gap-3">
                    {s.live ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" /> : <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-ink3" />}
                    <div>
                      <p className="text-sm font-medium text-ink">{s.name}</p>
                      <p className="text-xs text-ink3">{s.now}</p>
                    </div>
                  </div>
                  {i < PIPELINE.length - 1 && <ArrowDown className="my-1 ml-0.5 h-3 w-3 text-line" />}
                </li>
              ))}
            </ol>
          </Card>

          <Card className="p-5">
            <h2 className="font-display text-base font-bold">Demo data</h2>
            <p className="mt-1 text-[13px] text-ink2">Put every shelf back to this morning’s snapshot before the next walkthrough.</p>
            <Button className="mt-4" onClick={resetDemo}><RotateCcw className="h-4 w-4" />Reset demo data</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
