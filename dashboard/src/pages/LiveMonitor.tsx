import { Check, Info, ScanSearch } from "lucide-react";
import { useEffect, useState } from "react";
import { cameras } from "../data/cameras";
import { byPriority, zoneStats } from "../lib/logic";
import { useNow } from "../hooks/useNow";
import { useStore } from "../state/StoreContext";
import { backend } from "../lib/api";
import { CameraCard } from "../components/CameraCard";
import { StatusBadge } from "../components/StatusBadge";
import { ProductThumb } from "../components/ProductThumb";
import { Card, PageHeader, cx } from "../components/ui";

export function LiveMonitor() {
  const { products, cameraId, setCameraId, focusId, openProduct, connection } = useStore();
  const live = connection.status === "live";
  const cam = cameras.find((c) => c.id === cameraId) ?? cameras[0];
  const camProducts = products.filter((p) => p.camera === cam.id);
  const z = zoneStats(camProducts);
  const issues = camProducts.filter((p) => p.stockStatus !== "in_stock").sort(byPriority);
  const [loading, setLoading] = useState(false);
  const [scanAt, setScanAt] = useState(Date.now());
  const now = useNow(1000);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => { setLoading(false); setScanAt(Date.now()); }, 450);
    return () => clearTimeout(t);
  }, [cam.id]);
  useEffect(() => {
    const t = setInterval(() => setScanAt(Date.now()), 12000);
    return () => clearInterval(t);
  }, []);
  const [bust, setBust] = useState(0);
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => setBust(Date.now()), 3000);
    return () => clearInterval(t);
  }, [live]);
  const secs = Math.max(0, Math.round((now.getTime() - scanAt) / 1000));

  return (
    <div>
      <PageHeader title="Live Monitor" subtitle="Monitor existing store cameras and shelf conditions.">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-ink2">
          <Info className="h-3.5 w-3.5 text-fast" /> {live ? (connection.health?.mode === "demo" ? "Server connected: simulated camera, real detection pipeline" : "Live from your store cameras") : "Sample data: footage and detections are simulated"}
        </span>
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <CameraCard camera={cam} products={camProducts} mode="full" focusId={focusId} onSelect={openProduct} loading={loading} scanKey={String(scanAt)} imageSrc={live ? backend.frameUrl(cam.id, bust) : null} />
          <div className="mt-3 flex items-center justify-between text-xs text-ink3">
            <span>Tap a box to see the product. Hover to reveal labels on healthy items.</span>
            <span className="hidden gap-3 sm:flex">
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border-2 border-[#45d39b]" />Stocked</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border-2 border-[#ffb547]" />Low</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border-2 border-dashed border-[#ff6b5b]" />Empty</span>
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4" role="tablist" aria-label="Cameras">
            {cameras.map((c) => {
              const cz = zoneStats(products.filter((p) => p.camera === c.id));
              const active = c.id === cam.id;
              return (
                <button key={c.id} role="tab" aria-selected={active} onClick={() => setCameraId(c.id)}
                  className={cx("rounded-2xl border p-2 text-left transition-colors", active ? "border-teal bg-tealsoft/60" : "border-line bg-surface hover:bg-sunken")}>
                  <CameraCard camera={c} products={products.filter((p) => p.camera === c.id)} />
                  <div className="mt-2 flex items-center justify-between px-1">
                    <div>
                      <p className="text-sm font-semibold text-ink">{c.label}</p>
                      <p className="text-xs text-ink3">{c.name}</p>
                    </div>
                    <span className={cx("tnum shrink-0 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-semibold", cz.out ? "bg-emptysoft text-empty" : cz.low ? "bg-lowsoft text-low" : "bg-oksoft text-ok")}>
                      {cz.out + cz.low ? `${cz.out + cz.low} issues` : "Clear"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold">Camera analysis</h2>
              <span className="text-xs text-ink3">{cam.label}</span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-2.5">
              {[
                { k: "Products detected", v: z.total, c: "text-ink" },
                { k: "Available", v: z.inStock, c: "text-ok" },
                { k: "Low stock", v: z.low, c: "text-low" },
                { k: "Out of stock", v: z.out, c: "text-empty" },
              ].map((s) => (
                <div key={s.k} className="rounded-xl bg-sunken/70 p-3">
                  <dd className={cx("tnum font-display text-2xl font-bold", s.c)}>{loading ? "–" : s.v}</dd>
                  <dt className="text-xs text-ink2">{s.k}</dt>
                </div>
              ))}
            </dl>
            <ol className="mt-5 space-y-2.5 text-[13px]">
              {["Frame captured from existing camera", `${z.total} products detected on ${cam.racks.length} racks`, `Shelf gaps measured, ${z.out + z.low} need attention`].map((t, i) => (
                <li key={t} className="flex items-center gap-2.5 text-ink2">
                  <span className={cx("grid h-5 w-5 place-items-center rounded-full", loading ? "bg-sunken text-ink3" : "bg-tealsoft text-teal")}>
                    {loading ? <span className="text-[10px] font-bold">{i + 1}</span> : <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                  {t}
                </li>
              ))}
            </ol>
            <p className="mt-4 flex items-center gap-1.5 text-xs text-ink3"><ScanSearch className="h-3.5 w-3.5" />{loading ? "Analysing shelf…" : `Last analysed ${secs < 2 ? "just now" : `${secs}s ago`}`}</p>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-line px-5 py-4">
              <h2 className="font-display text-base font-bold">On this camera</h2>
              <p className="text-[13px] text-ink2">{issues.length ? `${issues.length} products need a look, most urgent first.` : "Every product on this shelf looks good."}</p>
            </div>
            <ul className="max-h-[360px] divide-y divide-line overflow-y-auto">
              {issues.map((p) => (
                <li key={p.id}>
                  <button onClick={() => openProduct(p.id)} className={cx("flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-sunken/60", focusId === p.id && "bg-tealsoft/50")}>
                    <ProductThumb p={p} size={36} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{p.name}</span>
                      <span className="block text-xs text-ink3">Rack {p.shelf} · {p.estimatedStock}/{p.shelfCapacity} units</span>
                    </span>
                    <StatusBadge status={p.stockStatus} />
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
