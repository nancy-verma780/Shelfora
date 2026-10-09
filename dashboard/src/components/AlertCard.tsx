import { AlertOctagon, AlertTriangle, CheckCircle2, CircleDot, PackageCheck } from "lucide-react";
import { ago, agoMs } from "../lib/format";
import { useStore } from "../state/StoreContext";
import type { Alert, ResolvedAlert } from "../types";
import { Button, cx } from "./ui";
import { ProductThumb } from "./ProductThumb";


const SEV = {
  critical: { icon: AlertOctagon, cls: "bg-emptysoft text-empty", label: "Critical" },
  high: { icon: AlertTriangle, cls: "bg-lowsoft text-low", label: "High" },
  medium: { icon: CircleDot, cls: "bg-fastsoft text-fast", label: "Medium" },
};

export function AlertCard({ alert, leaving, onRefill }: { alert: Alert; leaving?: boolean; onRefill: (id: string) => void }) {
  const { openProduct, resolveAlert, byId } = useStore();
  const s = SEV[alert.severity];
  const prod = byId[alert.productId];
  const Icon = s.icon;
  const canRefill = alert.kind !== "fast";
  return (
    <li data-flip-key={alert.id} className={cx(leaving && "leaving")}>
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card transition-shadow hover:shadow-lift sm:flex-row sm:items-center sm:gap-4 sm:p-5">
        <button onClick={() => openProduct(alert.productId)} className="flex min-w-0 flex-1 items-start gap-3.5 text-left">
          <span className="relative shrink-0">
            {prod ? <ProductThumb p={prod} size={48} /> : <span className={cx("grid h-12 w-12 place-items-center rounded-xl", s.cls)}><Icon className="h-5 w-5" /></span>}
            {prod && <span className={cx("absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full ring-2 ring-surface", s.cls)}><Icon className="h-3 w-3" /></span>}
          </span>
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className={cx("rounded-md px-1.5 py-px text-[11px] font-semibold", s.cls)}>{s.label}</span>
              <span className="text-xs text-ink3">{ago(alert.minutesAgo)}</span>
            </span>
            <span className="mt-1 block font-semibold text-ink">{alert.title}</span>
            <span className="block text-[13px] text-ink3">{alert.where}</span>
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-2 pl-[54px] sm:pl-0">
          <Button size="sm" variant="ghost" onClick={() => resolveAlert(alert)}>Mark as resolved</Button>
          {canRefill && alert.kind === "out" ? (
            <Button size="sm" variant="primary" onClick={() => onRefill(alert.productId)}><PackageCheck className="h-4 w-4" />{alert.action}</Button>
          ) : (
            <Button size="sm" onClick={() => openProduct(alert.productId)}>{alert.action}</Button>
          )}
        </div>
      </div>
    </li>
  );
}

export function ResolvedRow({ alert }: { alert: ResolvedAlert }) {
  const { openProduct } = useStore();
  return (
    <li>
      <button onClick={() => openProduct(alert.productId)} className="flex w-full items-start gap-3.5 rounded-2xl px-4 py-3.5 text-left hover:bg-sunken/70">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-oksoft text-ok"><CheckCircle2 className="h-5 w-5" /></span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-ink2 line-through decoration-ink3/40">{alert.title}</span>
          <span className="block text-[13px] text-ink3">{alert.resolution} · {agoMs(alert.resolvedAt)}</span>
        </span>
      </button>
    </li>
  );
}
