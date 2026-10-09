import { Cctv, TrendingUp } from "lucide-react";
import { rackNames } from "../data/cameras";
import { SECTION_SIGN } from "../lib/categories";
import { useCountUp } from "../hooks/useCountUp";
import { zoneStats } from "../lib/logic";
import { ago } from "../lib/format";
import { useStore } from "../state/StoreContext";
import type { Camera, Product, Section } from "../types";
import { Button, Card, cx } from "./ui";

export function healthTone(h: number) {
  if (h >= 90) return { text: "text-ok", bar: "bg-ok", label: "Healthy" };
  if (h >= 85) return { text: "text-teal", bar: "bg-teal", label: "Healthy" };
  if (h >= 75) return { text: "text-low", bar: "bg-low", label: "Needs attention" };
  return { text: "text-empty", bar: "bg-empty", label: "At risk" };
}

export function ShelfHealthCard({ section, camera, products }: { section: Section; camera: Camera; products: Product[] }) {
  const { go } = useStore();
  const z = zoneStats(products);
  const h = useCountUp(z.health);
  const tone = healthTone(z.health);
  const lastScan = Math.min(...products.map((p) => p.lastDetectedMin));
  return (
    <Card className="flex flex-col overflow-hidden p-5 pt-0 sm:p-6 sm:pt-0">
      {/* hanging aisle sign */}
      <div className="-mx-5 mb-5 flex justify-center sm:-mx-6" aria-hidden>
        <div className="h-3 w-px bg-ink3/40" /><div className="mx-24 h-3 w-px bg-ink3/40" />
      </div>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white shadow-card" style={{ background: SECTION_SIGN[section.id].color }}>
            {(() => { const I = SECTION_SIGN[section.id].icon; return <I className="h-6 w-6" />; })()}
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: SECTION_SIGN[section.id].color }}>Aisle {SECTION_SIGN[section.id].aisle}</p>
            <h3 className="font-display text-lg font-bold leading-tight">{section.name}</h3>
            <p className="text-[13px] text-ink3">{camera.label} · Last scan {ago(lastScan).toLowerCase()}</p>
          </div>
        </div>
        <span className={cx("rounded-full px-2.5 py-0.5 text-xs font-semibold", z.health >= 85 ? "bg-oksoft text-ok" : z.health >= 75 ? "bg-lowsoft text-low" : "bg-emptysoft text-empty")}>{tone.label}</span>
      </div>

      <div className="mt-5 flex items-baseline gap-2">
        <span className="tnum font-display text-[40px] font-bold leading-none tracking-[-0.03em]">{Math.round(h)}%</span>
        <span className="text-sm text-ink2">healthy</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-sunken">
        <div className={cx("h-full rounded-full transition-all duration-700", tone.bar)} style={{ width: `${z.health}%` }} />
      </div>

      <dl className="mt-5 grid grid-cols-4 gap-2 text-center">
        {[
          { k: "Available", v: `${z.available}/${z.total}`, c: "text-ink" },
          { k: "Low", v: z.low, c: z.low ? "text-low" : "text-ink" },
          { k: "Out", v: z.out, c: z.out ? "text-empty" : "text-ink" },
          { k: "Fast", v: z.fast, c: z.fast ? "text-fast" : "text-ink" },
        ].map((s) => (
          <div key={s.k} className="rounded-xl bg-sunken/70 px-1 py-2.5">
            <dd className={cx("tnum font-display text-lg font-bold", s.c)}>{s.v}</dd>
            <dt className="text-[11px] text-ink3">{s.k}</dt>
          </div>
        ))}
      </dl>

      <div className="mt-5 space-y-2.5">
        {camera.racks.map((r) => {
          const rp = products.filter((p) => p.shelf === r);
          const out = rp.filter((p) => p.stockStatus === "out_of_stock").length;
          const low = rp.filter((p) => p.stockStatus === "low_stock").length;
          return (
            <div key={r} className="flex items-center gap-3 text-[13px]">
              <span className="w-28 shrink-0 truncate text-ink2 sm:w-36"><b className="font-semibold text-ink">{r}</b> {rackNames[r]}</span>
              <div className="flex h-2 flex-1 gap-[2px]">
                {rp.map((p) => (
                  <span key={p.id} title={p.name} className={cx("flex-1 rounded-[2px] transition-colors duration-500", p.stockStatus === "out_of_stock" ? "bg-empty" : p.stockStatus === "low_stock" ? "bg-low" : "bg-teal/40")} />
                ))}
              </div>
              <span className="w-14 shrink-0 text-right text-xs text-ink3">{out + low ? `${out + low} issue${out + low > 1 ? "s" : ""}` : "Clear"}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
        <span className="inline-flex items-center gap-1.5 text-[13px] text-ink2">
          {z.fast > 0 && <><TrendingUp className="h-3.5 w-3.5 text-fast" />{z.fast} selling faster than usual</>}
        </span>
        <Button size="sm" variant="ghost" onClick={() => go("monitor", { camera: camera.id })}>
          <Cctv className="h-4 w-4" /> View camera
        </Button>
      </div>
    </Card>
  );
}
