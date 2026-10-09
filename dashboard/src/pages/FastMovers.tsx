import { TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { OPEN_HOURS, velocitySeries } from "../data/analytics";
import { whereOf } from "../lib/logic";
import { useStore } from "../state/StoreContext";
import { ChartCard, ChartTooltip } from "../components/ChartCard";
import { FacingMeter } from "../components/FacingMeter";
import { ProductThumb } from "../components/ProductThumb";
import { StatusBadge } from "../components/StatusBadge";
import { Card, EmptyState, PageHeader, cx } from "../components/ui";
import type { Product } from "../types";

const LINE_COLORS = ["rgb(var(--empty))", "rgb(var(--fast))", "rgb(var(--teal))", "rgb(var(--low))", "#8b5cf6"];

function demandLabel(p: Product) {
  if (p.stockStatus === "out_of_stock") return { text: "Refill urgently", cls: "bg-emptysoft text-empty" };
  if (p.stockStatus === "low_stock") return { text: "High demand", cls: "bg-lowsoft text-low" };
  return { text: "Monitor", cls: "bg-fastsoft text-fast" };
}

function dayLabels() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return i === 6 ? "Today" : d.toLocaleDateString("en-IN", { weekday: "short" });
  });
}

export function FastMovers() {
  const { products, openProduct, settings } = useStore();
  const fast = products.filter((p) => p.isFastMover).sort((a, b) => b.salesVelocity - a.salesVelocity);
  const [picked, setPicked] = useState<string[]>(() => fast.slice(0, 3).map((p) => p.id));
  const labels = dayLabels();

  const data = useMemo(() => labels.map((label, i) => {
    const row: Record<string, number | string> = { label };
    for (const id of picked) {
      const p = products.find((x) => x.id === id);
      if (!p) continue;
      const s = velocitySeries(p.normalSalesRate, p.salesVelocity);
      row[p.name] = Math.round((s[i] / (p.normalSalesRate * OPEN_HOURS)) * 10) / 10;
    }
    return row;
  }), [picked, products]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id: string) => setPicked((ps) => (ps.includes(id) ? ps.filter((x) => x !== id) : ps.length >= 5 ? ps : [...ps, id]));

  return (
    <div>
      <PageHeader title="Fast Movers" subtitle="Products selling faster than their normal rate." />
      {fast.length === 0 ? (
        <Card><EmptyState icon={<TrendingUp className="h-6 w-6" />} title="Demand looks normal" body={`Nothing is selling faster than ${settings.fastMoverThreshold}× its usual rate right now.`} /></Card>
      ) : (
        <>
          <p className="mb-4 text-[15px] text-ink2">These products are selling faster than usual. Keep their shelves full so you don’t miss the extra sales.</p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {fast.map((p) => {
              const d = demandLabel(p);
              const series = velocitySeries(p.normalSalesRate, p.salesVelocity);
              const max = Math.max(...series);
              return (
                <button key={p.id} onClick={() => openProduct(p.id)} className="group rounded-2xl border border-line bg-surface p-5 text-left shadow-card transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-lift">
                  <div className="flex items-start justify-between gap-3">
                    <ProductThumb p={p} size={46} className="transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-base font-bold">{p.name}</p>
                      <p className="text-[13px] text-ink3">{whereOf(p)}</p>
                    </div>
                    <span className={cx("shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold", d.cls)}>{d.text}</span>
                  </div>
                  <div className="mt-4 flex items-end justify-between gap-4">
                    <div>
                      <p className="tnum font-display text-[38px] font-bold leading-none tracking-[-0.03em] text-fast">{p.salesVelocity.toFixed(1)}×</p>
                      <p className="mt-1 text-[13px] text-ink2">normal sales · {p.currentSalesRate}/hr</p>
                    </div>
                    <div className="flex h-12 items-end gap-1" aria-label="Units sold per day, last 7 days">
                      {series.map((v, i) => (
                        <span key={i} className={cx("w-2.5 rounded-sm", i === 6 ? "bg-fast" : "bg-fast/25")} style={{ height: `${Math.max(8, (v / max) * 100)}%` }} />
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                    <StatusBadge status={p.stockStatus} />
                    <FacingMeter stock={p.estimatedStock} capacity={p.shelfCapacity} status={p.stockStatus} />
                  </div>
                </button>
              );
            })}
          </div>

          <ChartCard className="mt-6" title="Sales velocity — Last 7 days" subtitle="Daily sales compared with each product’s normal day (1.0× is normal).">
            <div className="mb-4 flex flex-wrap gap-2">
              {fast.map((p) => {
                const on = picked.includes(p.id);
                const color = LINE_COLORS[picked.indexOf(p.id) % LINE_COLORS.length];
                return (
                  <button key={p.id} onClick={() => toggle(p.id)} aria-pressed={on}
                    className={cx("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors", on ? "border-transparent bg-sunken text-ink" : "border-line text-ink3 hover:text-ink2")}>
                    <span className="h-2 w-2 rounded-full" style={{ background: on ? color : "rgb(var(--line))" }} />
                    {p.name.replace(/\s\d.*$/, "")}
                  </button>
                );
              })}
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke="rgb(var(--line))" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${v}×`} domain={[0.5, "auto"]} />
                  <ReferenceLine y={1} stroke="rgb(var(--ink3))" strokeDasharray="4 4" label={{ value: "Normal", position: "insideTopLeft", fill: "rgb(var(--ink3))", fontSize: 11 }} />
                  <Tooltip content={<ChartTooltip fmt={(v) => `${v.toFixed(1)}×`} />} />
                  {picked.map((id, i) => {
                    const p = products.find((x) => x.id === id)!;
                    return <Line key={id} type="monotone" dataKey={p.name} stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth={2.4} dot={{ r: 3 }} activeDot={{ r: 5 }} animationDuration={700} />;
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </>
      )}
    </div>
  );
}
