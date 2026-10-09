import { Cctv, CheckCircle2, Clock, PackageCheck, UserRound, X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { cameras } from "../data/cameras";
import { formatHours, whereOf } from "../lib/logic";
import { ago, agoMs, timeOfDay } from "../lib/format";
import { useStore } from "../state/StoreContext";
import { FacingMeter } from "./FacingMeter";
import { ProductThumb } from "./ProductThumb";
import { CategoryChip } from "./CategoryChip";

import { PriorityBadge, StatusBadge } from "./StatusBadge";
import { Button, cx } from "./ui";

export function ProductDrawer() {
  const { drawerId, byId, openProduct, refill, assign, unassign, tasks, go, lastRefillAt, settings } = useStore();
  const p = drawerId ? byId[drawerId] : null;
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!p) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && openProduct(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [p?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!p) return null;
  const cam = cameras.find((c) => c.id === p.camera)!;
  const task = tasks[p.id];
  const needsWork = p.stockStatus !== "in_stock";
  const refilledRecently = Date.now() - lastRefillAt(p) < 30 * 60_000;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      <div className="scrim-in absolute inset-0 bg-black/25" onClick={() => openProduct(null)} />
      <div
        className={cx(
          "absolute flex flex-col bg-surface shadow-drawer",
          "inset-x-0 bottom-0 max-h-[92vh] rounded-t-3xl panel-in",
          "sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[460px] sm:rounded-none sm:rounded-l-3xl",
        )}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-line sm:hidden" />
        <div className="flex items-start justify-between gap-4 px-6 pb-4 pt-5">
          <ProductThumb p={p} size={64} className="pop" />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-[13px] text-ink3"><CategoryChip category={p.category} /> Rack {p.shelf}</p>
            <h2 id="drawer-title" className="mt-0.5 font-display text-[24px] font-bold leading-tight tracking-[-0.02em]">{p.name}</h2>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <StatusBadge status={p.stockStatus} />
              <PriorityBadge level={p.priorityLevel} score={p.priorityScore} />
            </div>
          </div>
          <button ref={closeRef} onClick={() => openProduct(null)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-ink2 hover:bg-sunken" aria-label="Close product details">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div key={p.id} className="stagger flex-1 space-y-5 overflow-y-auto px-6 pb-6">
          {/* Shelf picture */}
          <div className="rounded-2xl bg-sunken/70 p-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[13px] text-ink2">Estimated on shelf</p>
                <p className="tnum mt-1 font-display text-[28px] font-bold leading-none">
                  {p.estimatedStock}
                  <span className="ml-1 text-sm font-medium text-ink3">of {p.shelfCapacity} units</span>
                </p>
              </div>
              <FacingMeter stock={p.estimatedStock} capacity={p.shelfCapacity} status={p.stockStatus} slots={10} size="md" />
            </div>
            <p className="mt-3 text-[13px] text-ink2">
              {p.hoursLeft === null ? "The shelf is empty." : p.stockStatus === "in_stock" ? `About ${formatHours(p.hoursLeft)} of stock at the current pace.` : `Runs out in about ${formatHours(p.hoursLeft)} at the current pace.`}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
            <Stat label="Sales velocity" value={<span className={p.isFastMover ? "text-fast" : ""}>{p.salesVelocity.toFixed(1)}× normal</span>} hint={`${p.currentSalesRate}/hr vs ${p.normalSalesRate}/hr usual${p.stockStatus === "out_of_stock" ? ", before it ran out" : ""}`} />
            <Stat label="Last detected" value={p.lastDetectedMin === 0 ? "Just now" : ago(p.lastDetectedMin)} hint={`${cam.label}, ${cam.name}`} />
            <Stat label="Last refill" value={timeOfDay(lastRefillAt(p))} hint={agoMs(lastRefillAt(p))} />
            <Stat label="Shelf" value={`Rack ${p.shelf}`} hint={whereOf(p).split(" · ")[0]} />
          </dl>

          {/* Priority breakdown */}
          <div>
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-semibold">Refill priority</p>
              <p className="tnum font-display text-lg font-bold">{p.priorityScore}<span className="text-sm font-medium text-ink3">/100</span></p>
            </div>
            <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-sunken">
              <span className="bg-empty transition-all duration-500" style={{ width: `${p.breakdown.stockRisk}%` }} />
              <span className="bg-fast transition-all duration-500" style={{ width: `${p.breakdown.velocity}%` }} />
              <span className="bg-low transition-all duration-500" style={{ width: `${p.breakdown.timeToEmpty}%` }} />
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink2">
              <Legend cls="bg-empty" label="Stock level" v={p.breakdown.stockRisk} max={50} />
              <Legend cls="bg-fast" label="Selling speed" v={p.breakdown.velocity} max={30} />
              <Legend cls="bg-low" label="Time to empty" v={p.breakdown.timeToEmpty} max={20} />
            </div>
          </div>

          <div className="rounded-2xl border border-line p-4">
            <p className="text-sm font-semibold">{needsWork || p.isFastMover ? (needsWork ? "Why this needs attention" : "What we’re seeing") : "What we’re seeing"}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink2">{p.reason}</p>
            <div className="my-3 h-px bg-line" />
            <p className="text-sm font-semibold">Recommended action</p>
            <p className={cx("mt-1 text-sm font-semibold", p.action === "Refill now" ? "text-empty" : p.action === "Refill soon" ? "text-low" : p.action === "No action needed" ? "text-ok" : "text-ink")}>
              {p.action === "Refill now" ? "Refill immediately" : p.action}
            </p>
          </div>

          {task && (
            <div className="flex items-center gap-3 rounded-2xl bg-fastsoft p-3.5 text-sm">
              <UserRound className="h-5 w-5 text-fast" />
              <p className="flex-1 text-ink"><b>{task.assignee}</b> is restocking this shelf <span className="text-ink2">· asked {agoMs(task.startedAt)}</span></p>
              <button onClick={() => unassign(p.id)} className="text-xs font-semibold text-ink2 hover:text-ink">Cancel</button>
            </div>
          )}
          {!needsWork && refilledRecently && (
            <div className="settle flex items-center gap-3 rounded-2xl border border-ok/30 p-3.5 text-sm">
              <CheckCircle2 className="h-5 w-5 text-ok" />
              <p className="text-ink">Refilled {agoMs(lastRefillAt(p)).toLowerCase()}. {p.isFastMover ? `Still selling ${p.salesVelocity.toFixed(1)}× faster than usual, so keep an eye on it.` : "Nothing else to do here."}</p>
            </div>
          )}
          {p.isFastMover && p.stockStatus === "in_stock" && !refilledRecently && (
            <p className="flex items-center gap-2 text-[13px] text-ink2"><Clock className="h-4 w-4 text-fast" />Selling faster than the {settings.fastMoverThreshold}× fast-mover mark.</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-line px-6 py-4">
          {needsWork ? (
            <Button variant="primary" className="col-span-2" onClick={() => refill(p.id)}>
              <PackageCheck className="h-4 w-4" /> Mark as Refilled
            </Button>
          ) : (
            <Button variant="secondary" className="col-span-2" disabled>
              <CheckCircle2 className="h-4 w-4 text-ok" /> Shelf is stocked
            </Button>
          )}
          {needsWork && !task && (
            <Button onClick={() => assign(p.id)}>Add to Refill</Button>
          )}
          <Button className={needsWork && !task ? "" : "col-span-2"} onClick={() => go("monitor", { camera: p.camera, focus: p.id })}>
            <Cctv className="h-4 w-4" /> View Camera
          </Button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div>
      <dt className="text-[13px] text-ink3">{label}</dt>
      <dd className="mt-0.5 text-[15px] font-semibold text-ink">{value}</dd>
      {hint && <dd className="text-xs text-ink3">{hint}</dd>}
    </div>
  );
}

function Legend({ cls, label, v, max }: { cls: string; label: string; v: number; max: number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cx("h-2 w-2 rounded-full", cls)} />
      {label} <span className="tnum text-ink3">{v}/{max}</span>
    </span>
  );
}
