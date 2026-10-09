import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { buildHistory } from "../data/analytics";
import { useStore } from "../state/StoreContext";
import { ChartCard, ChartTooltip } from "../components/ChartCard";
import { Card, PageHeader, Segmented } from "../components/ui";

type Range = "7" | "14" | "30";

export function Analytics() {
  const { kpis, products, activity, openProduct } = useStore();
  const [range, setRange] = useState<Range>("7");
  const history = useMemo(() => buildHistory(new Date()), []);
  const series = useMemo(() => {
    const today = {
      date: "today", label: "Today",
      availability: Math.round(kpis.shelfHealth * 10) / 10,
      fill: Math.round(kpis.fillRate),
      outOfStock: kpis.outOfStock,
      refillMinutes: history.at(-1)!.refillMinutes,
    };
    return [...history, today].slice(-Number(range));
  }, [history, kpis, range]);

  const avgRefill = Math.round(series.reduce((a, d) => a + d.refillMinutes, 0) / series.length);
  const prevWindow = [...history].slice(-Number(range) * 2, -Number(range));
  const prevAvg = prevWindow.length ? Math.round(prevWindow.reduce((a, d) => a + d.refillMinutes, 0) / prevWindow.length) : avgRefill;
  const h3 = [history.at(-2)!.availability, history.at(-1)!.availability, kpis.shelfHealth];
  const refillsToday = activity.filter((a) => new Date(a.at).toDateString() === new Date().toDateString()).length;
  const fast = products.filter((p) => p.isFastMover).sort((a, b) => b.salesVelocity - a.salesVelocity);
  const tick = (l: string) => (range === "7" ? l : l.split(" ")[1] ?? l);

  return (
    <div>
      <PageHeader title="Analytics" subtitle="How your shelves have been doing, and whether refills are getting faster.">
        <Segmented label="Date range" value={range} onChange={setRange} options={[{ value: "7", label: "Last 7 days" }, { value: "14", label: "14 days" }, { value: "30", label: "30 days" }]} />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5" as="div">
          <p className="text-[13px] font-medium text-ink2">Average refill response</p>
          <p className="tnum mt-2 font-display text-[34px] font-bold leading-none tracking-[-0.03em]">{avgRefill} <span className="text-base font-semibold text-ink3">min</span></p>
          <p className="mt-2 text-[13px] font-medium text-ok">{prevAvg > avgRefill ? `${prevAvg - avgRefill} min faster than the previous ${range} days` : "Same as the previous period"}</p>
        </Card>
        <Card className="p-5" as="div">
          <p className="text-[13px] font-medium text-ink2">Shelf health, last 3 days</p>
          <p className="tnum mt-2 flex items-center gap-2 font-display text-[28px] font-bold leading-none tracking-[-0.03em]">
            <span className="text-ink3">{Math.round(h3[0])}%</span><ArrowRight className="h-4 w-4 text-ink3" />
            <span className="text-ink2">{Math.round(h3[1])}%</span><ArrowRight className="h-4 w-4 text-ink3" />
            <span className="text-teal">{Math.round(h3[2])}%</span>
          </p>
          <p className="mt-2 text-[13px] font-medium text-ink2">Today is live and updates with every refill.</p>
        </Card>
        <Card className="p-5" as="div">
          <p className="text-[13px] font-medium text-ink2">Refills completed today</p>
          <p className="tnum mt-2 font-display text-[34px] font-bold leading-none tracking-[-0.03em]">{refillsToday}</p>
          <p className="mt-2 text-[13px] font-medium text-ink2">{Math.round(kpis.fillRate)}% of shelf space currently stocked</p>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Stock availability" subtitle="Share of tracked products on the shelf each day.">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 6, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="avail" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="rgb(var(--teal))" stopOpacity={0.22} />
                    <stop offset="1" stopColor="rgb(var(--teal))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgb(var(--line))" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickFormatter={tick} interval="preserveStartEnd" minTickGap={16} />
                <YAxis tickLine={false} axisLine={false} domain={[75, 95]} tickFormatter={(v) => `${v}%`} />
                <Tooltip content={<ChartTooltip unit="%" />} />
                <Area type="monotone" dataKey="availability" name="Available" stroke="rgb(var(--teal))" strokeWidth={2.4} fill="url(#avail)" animationDuration={700} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Out-of-stock products" subtitle="Products with an empty shelf at the end of each day.">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ top: 6, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid stroke="rgb(var(--line))" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickFormatter={tick} interval="preserveStartEnd" minTickGap={16} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="outOfStock" name="Out of stock" radius={[6, 6, 0, 0]} animationDuration={700}>
                  {series.map((d) => <Cell key={d.date} fill={d.date === "today" ? "rgb(var(--empty))" : "rgb(var(--empty) / 0.35)"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard className="lg:col-span-2" title="Fast-moving products" subtitle="Today’s sales compared with each product’s normal rate. Tap a bar for details.">
          <div style={{ height: Math.max(180, fast.length * 38) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fast.map((p) => ({ id: p.id, name: p.name, v: p.salesVelocity, out: p.stockStatus === "out_of_stock" }))} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
                <CartesianGrid stroke="rgb(var(--line))" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v) => `${v}×`} domain={[0, 3]} />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={190} tick={{ fontSize: 12 }} />
                <Tooltip content={<ChartTooltip fmt={(v) => `${v.toFixed(1)}× normal`} />} cursor={{ fill: "rgb(var(--sunken))" }} />
                <Bar dataKey="v" name="Velocity" radius={[0, 6, 6, 0]} barSize={18} animationDuration={700} onClick={(d: { id?: string }) => d.id && openProduct(d.id)} className="cursor-pointer">
                  {fast.map((p) => <Cell key={p.id} fill={p.stockStatus === "out_of_stock" ? "rgb(var(--empty))" : "rgb(var(--fast))"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-xs text-ink3"><span className="mr-1 inline-block h-2 w-2 rounded-full bg-empty" />Red bars are fast movers that are already out of stock.</p>
        </ChartCard>
      </div>
    </div>
  );
}
