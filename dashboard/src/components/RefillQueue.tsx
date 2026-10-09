import { Check, ChevronRight, PackageCheck, Plus, TrendingUp, UserRound } from "lucide-react";
import { useState } from "react";
import { formatHours, whereOf } from "../lib/logic";
import { agoMs } from "../lib/format";
import { useStore } from "../state/StoreContext";
import type { Product } from "../types";
import { FacingMeter } from "./FacingMeter";
import { ProductThumb } from "./ProductThumb";

import { PriorityBadge, StatusBadge } from "./StatusBadge";
import { Button, cx } from "./ui";

const STRIPE = { urgent: "bg-empty", high: "bg-low", medium: "bg-ink3/40", low: "bg-line" };

/** Hook that delays the refill so the row can animate out first. */
export function useRefillWithExit() {
  const { refill } = useStore();
  const [leaving, setLeaving] = useState<string | null>(null);
  return {
    leaving,
    refill: (id: string) => {
      setLeaving(id);
      setTimeout(() => { refill(id); setLeaving(null); }, 760);
    },
  };
}

function shortReason(p: Product) {
  if (p.stockStatus === "out_of_stock") return p.isFastMover ? "Unavailable and selling well above normal" : "Unavailable on the shelf";
  if (p.isFastMover) return `Selling fast, empty in about ${formatHours(p.hoursLeft ?? 0)}`;
  if (p.priorityScore >= 60) return `Runs out in about ${formatHours(p.hoursLeft ?? 0)}`;
  return "Stock below shelf threshold";
}

export function RefillRow({ p, rank, variant, leaving, onRefill }: { p: Product; rank?: number; variant: "attention" | "queue"; leaving?: boolean; onRefill: (id: string) => void }) {
  const { openProduct, assign, tasks } = useStore();
  const task = tasks[p.id];
  const showRefill = p.stockStatus === "out_of_stock" || !!task || variant === "attention" && p.priorityScore >= 80;
  return (
    <li data-flip-key={p.id} className={cx("group relative", leaving && "leaving")}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => openProduct(p.id)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), openProduct(p.id))}
        className="relative flex cursor-pointer flex-col gap-3 py-4 pl-5 pr-4 transition-colors hover:bg-sunken/60 sm:pl-6 md:flex-row md:items-center md:gap-5"
      >
        <span className={cx("absolute bottom-3 left-0 top-3 w-1 rounded-r-full", STRIPE[p.priorityLevel])} />
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {rank !== undefined && <span className="tnum mt-0.5 w-7 shrink-0 font-display text-sm font-bold text-ink3">#{rank}</span>}
          <ProductThumb p={p} size={variant === "attention" ? 52 : 46} className="mt-0.5 transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <PriorityBadge level={p.priorityLevel} score={variant === "queue" ? p.priorityScore : undefined} />
              {p.isFastMover && (
                <span className="inline-flex items-center gap-1 rounded-md bg-fastsoft px-2 py-0.5 text-xs font-semibold text-fast">
                  <TrendingUp className="h-3 w-3" /> {p.salesVelocity.toFixed(1)}× normal
                </span>
              )}
            </div>
            <p className={cx("mt-1.5 line-clamp-2 font-display font-bold tracking-[-0.01em] text-ink", variant === "attention" ? "text-[17px]" : "text-base")}>{p.name}</p>
            <p className="text-[13px] text-ink3">{whereOf(p)}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 md:w-[250px] md:shrink-0">
          <div className="flex flex-col gap-1.5">
            <StatusBadge status={p.stockStatus} />
            <FacingMeter stock={p.estimatedStock} capacity={p.shelfCapacity} status={p.stockStatus} />
          </div>
          <p className="text-[13px] leading-snug text-ink2">
            <span className="tnum block font-semibold text-ink">{p.estimatedStock === 0 ? "0 units" : `${p.estimatedStock} of ${p.shelfCapacity} units`}</span>
            {shortReason(p)}
          </p>
        </div>

        <div className="flex items-center gap-2 md:shrink-0 md:justify-end" onClick={(e) => e.stopPropagation()}>
          {task && (
            <span className="inline-flex items-center gap-1 text-xs text-ink2" title={`Asked ${agoMs(task.startedAt)}`}>
              <UserRound className="h-3.5 w-3.5 text-fast" /> {task.assignee}
            </span>
          )}
          {leaving ? (
            <span className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-ok px-3 text-[13px] font-medium text-white dark:text-[rgb(var(--paper))]">
              <Check className="pop h-4 w-4" strokeWidth={3} /> Refilled
            </span>
          ) : showRefill ? (
            <Button variant={p.stockStatus === "out_of_stock" || task ? "primary" : "secondary"} size="sm" onClick={() => onRefill(p.id)}>
              <PackageCheck className="h-4 w-4" /> Mark as Refilled
            </Button>
          ) : (
            <Button size="sm" onClick={() => assign(p.id)}>
              <Plus className="h-4 w-4" /> Add to Refill
            </Button>
          )}
          <ChevronRight className="hidden h-4 w-4 text-ink3 xl:block" />
        </div>
      </div>
    </li>
  );
}
