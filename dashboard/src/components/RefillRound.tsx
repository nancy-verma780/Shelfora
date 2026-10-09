import { ArrowRight, Check, MapPin, PackageCheck, SkipForward, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cameras } from "../data/cameras";
import { byPriority, formatHours, zoneLabel } from "../lib/logic";
import { useStore } from "../state/StoreContext";
import { CameraCard } from "./CameraCard";
import { FacingMeter } from "./FacingMeter";
import { StoreMap } from "./StoreMap";
import { ProductThumb } from "./ProductThumb";

import { PriorityBadge, StatusBadge } from "./StatusBadge";
import { Button, cx } from "./ui";

/**
 * Guided refill round: walks the manager (or a staff member with a phone) through the
 * urgent shelves one at a time — where it is, what the camera sees, then "Done".
 */
export function RefillRound({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { products, byId, refill, kpis } = useStore();
  const [ids, setIds] = useState<string[]>([]);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const [startHealth, setStartHealth] = useState(0);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!open) return;
    const list = products.filter((p) => p.stockStatus !== "in_stock" && p.priorityScore >= 60).sort(byPriority).slice(0, 8).map((p) => p.id);
    setIds(list); setStep(0); setDone([]); setStartHealth(kpis.shelfHealth);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const finished = step >= ids.length;
  const p = !finished ? byId[ids[step]] : null;
  const cam = p ? cameras.find((c) => c.id === p.camera)! : null;
  const camProducts = useMemo(() => (cam ? products.filter((x) => x.camera === cam.id) : []), [cam, products]);

  const next = () => setStep((s) => s + 1);
  const markDone = () => {
    if (!p) return;
    setFlash(true);
    refill(p.id, { quiet: true });
    setDone((d) => [...d, p.id]);
    setTimeout(() => { setFlash(false); next(); }, 650);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (!finished && e.key === "Enter") { e.preventDefault(); markDone(); }
      if (!finished && e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!open) return null;
  const units = done.reduce((a, id) => a + (byId[id]?.shelfCapacity ?? 0), 0);

  return (
    <div className="fixed inset-0 z-[75] flex flex-col bg-paper" role="dialog" aria-modal="true" aria-label="Refill round" style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="scrim-in flex items-center gap-4 border-b border-line bg-surface px-4 py-3 sm:px-8">
        <p className="font-display text-base font-bold">Refill round</p>
        <div className="flex flex-1 gap-1.5" aria-label={`Step ${Math.min(step + 1, ids.length)} of ${ids.length}`}>
          {ids.map((id, i) => (
            <span key={id} className="h-1.5 flex-1 overflow-hidden rounded-full bg-sunken">
              <span className={cx("block h-full rounded-full transition-all duration-500", done.includes(id) ? "w-full bg-ok" : i < step ? "w-full bg-ink3/50" : i === step ? "w-1/2 bg-teal" : "w-0")} />
            </span>
          ))}
        </div>
        <span className="tnum text-sm text-ink2">{Math.min(step + 1, ids.length)}/{ids.length}</span>
        <button onClick={onClose} className="press grid h-9 w-9 place-items-center rounded-xl text-ink2 hover:bg-sunken" aria-label="Close refill round"><X className="h-5 w-5" /></button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {ids.length === 0 ? (
          <Finish title="Nothing to refill" body="Every shelf is in good shape. Enjoy the quiet." onClose={onClose} />
        ) : finished ? (
          <Finish
            title={done.length ? `${done.length} shelves restocked` : "Round finished"}
            body={done.length ? `${units} units back on the shelf. Shelf health went from ${Math.round(startHealth)}% to ${Math.round(kpis.shelfHealth)}%.` : "You skipped everything this time. They're still in the refill queue."}
            onClose={onClose}
          />
        ) : p && cam ? (
          <div key={p.id} className="stagger mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:py-10">
            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-2">
                <PriorityBadge level={p.priorityLevel} score={p.priorityScore} />
                <StatusBadge status={p.stockStatus} />
              </div>
              <ProductThumb p={p} size={84} className="pop mt-4" />
              <h2 className="mt-3 font-display text-[30px] font-bold leading-tight tracking-[-0.025em] sm:text-[40px]">{p.name}</h2>
              <p className="mt-2 inline-flex items-center gap-1.5 text-[17px] font-medium text-tealink"><MapPin className="h-5 w-5" />{zoneLabel(p.section)}, Rack {p.shelf}</p>
              <div className="mt-6 rounded-2xl border border-line bg-surface p-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[13px] text-ink2">On the shelf now</p>
                    <p className="tnum font-display text-[32px] font-bold leading-none">{p.estimatedStock}<span className="ml-1 text-base font-medium text-ink3">/ {p.shelfCapacity}</span></p>
                  </div>
                  <FacingMeter stock={p.estimatedStock} capacity={p.shelfCapacity} status={p.stockStatus} slots={10} size="md" />
                </div>
                <p className="mt-3 text-sm text-ink2">
                  Bring about <b className="text-ink">{p.shelfCapacity - p.estimatedStock} units</b>.{" "}
                  {p.hoursLeft === null ? `It was selling ${p.salesVelocity.toFixed(1)}× faster than usual before it ran out.` : `At today's pace it empties in about ${formatHours(p.hoursLeft)}.`}
                </p>
              </div>
              <div className="mt-6 flex gap-3">
                <Button variant="primary" className={cx("h-12 flex-1 text-base transition-colors", flash && "!bg-ok")} onClick={markDone} disabled={flash}>
                  {flash ? <><Check className="pop h-5 w-5" strokeWidth={3} /> Done</> : <><PackageCheck className="h-5 w-5" /> Refilled it</>}
                </Button>
                <Button className="h-12" onClick={next}><SkipForward className="h-4 w-4" /> Skip</Button>
              </div>
              <p className="mt-3 hidden text-xs text-ink3 sm:block">Enter = refilled · → = skip · Esc = stop</p>
            </div>
            <div className="flex flex-col gap-4">
              <CameraCard camera={cam} products={camProducts} mode="thumb" focusId={p.id} />
              <div className="rounded-2xl border border-line bg-surface p-4">
                <p className="mb-2 text-[13px] font-medium text-ink2">Where to go</p>
                <div className="mx-auto max-w-[380px]"><StoreMap highlightId={p.id} compact /></div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Finish({ title, body, onClose }: { title: string; body: string; onClose: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-20 text-center">
      <div className="relative mb-6 grid h-20 w-20 place-items-center">
        <span className="map-pulse absolute inset-0 rounded-full bg-ok/30" />
        <span className="pop grid h-20 w-20 place-items-center rounded-full bg-ok text-white dark:text-[rgb(var(--paper))]"><Check className="h-10 w-10" strokeWidth={3} /></span>
      </div>
      <h2 className="font-display text-[28px] font-bold tracking-[-0.02em]">{title}</h2>
      <p className="mt-2 text-[15px] text-ink2">{body}</p>
      <Button variant="primary" className="mt-8 h-11 px-6" onClick={onClose}>Back to overview <ArrowRight className="h-4 w-4" /></Button>
    </div>
  );
}
