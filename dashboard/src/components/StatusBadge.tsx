import { TrendingUp } from "lucide-react";
import type { PriorityLevel, StockStatus } from "../types";
import { cx } from "./ui";

const STATUS: Record<StockStatus, { label: string; cls: string; dot: string }> = {
  in_stock: { label: "In stock", cls: "bg-oksoft text-ok", dot: "bg-ok" },
  low_stock: { label: "Low stock", cls: "bg-lowsoft text-low", dot: "bg-low" },
  out_of_stock: { label: "Out of stock", cls: "bg-emptysoft text-empty", dot: "bg-empty" },
};

export function StatusBadge({ status, className }: { status: StockStatus; className?: string }) {
  const s = STATUS[status];
  return (
    <span className={cx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors duration-300", s.cls, className)}>
      <span className={cx("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

const LEVEL: Record<PriorityLevel, { label: string; cls: string }> = {
  urgent: { label: "Urgent", cls: "bg-empty text-white dark:text-[rgb(var(--paper))]" },
  high: { label: "High", cls: "bg-emptysoft text-empty" },
  medium: { label: "Medium", cls: "bg-lowsoft text-low" },
  low: { label: "Low", cls: "bg-sunken text-ink2" },
};

export function PriorityBadge({ level, score }: { level: PriorityLevel; score?: number }) {
  const l = LEVEL[level];
  return (
    <span className={cx("inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-semibold", l.cls)}>
      {l.label}
      {score !== undefined && <span className="tnum opacity-80">· {score}</span>}
    </span>
  );
}

export function VelocityPill({ v, threshold = 1.5 }: { v: number; threshold?: number }) {
  const fast = v >= threshold;
  return (
    <span className={cx("tnum inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold", fast ? "text-fast" : v < 0.95 ? "text-ink3" : "text-ink2")}>
      {fast && <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.4} />}
      {v.toFixed(1)}×
    </span>
  );
}
