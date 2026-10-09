import type { ReactNode } from "react";
import { Card, cx } from "./ui";

export function ChartCard({ title, subtitle, aside, children, className }: { title: string; subtitle?: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Card className={cx("p-5 sm:p-6", className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-bold tracking-[-0.01em]">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[13px] text-ink2">{subtitle}</p>}
        </div>
        {aside}
      </div>
      {children}
    </Card>
  );
}

export function ChartTooltip({ active, payload, label, unit = "", fmt }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string; unit?: string; fmt?: (v: number) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-lift">
      <p className="mb-1 font-semibold text-ink">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 text-ink2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="tnum font-semibold text-ink">{fmt ? fmt(p.value) : p.value}{unit}</span>
        </p>
      ))}
    </div>
  );
}
