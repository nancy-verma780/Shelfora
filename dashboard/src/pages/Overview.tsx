import { ArrowRight, Cctv, Footprints, CheckCircle2, ChevronRight, Gauge, ListChecks, PackageX, PackageMinus, ScanSearch, TrendingUp } from "lucide-react";
import { cameras } from "../data/cameras";
import { buildHistory } from "../data/analytics";
import { byPriority, zoneLabel } from "../lib/logic";
import { agoMs, greeting, plural } from "../lib/format";
import { useStore } from "../state/StoreContext";
import { KPICard } from "../components/KPICard";
import { useFlip } from "../hooks/useFlip";
import { RefillRow, useRefillWithExit } from "../components/RefillQueue";
import { CameraCard } from "../components/CameraCard";
import { healthTone } from "../components/ShelfHealthCard";
import { StoreMap } from "../components/StoreMap";
import { HealthRing } from "../components/HealthRing";
import { StorefrontArt } from "../components/StorefrontArt";
import { Button, Card, EmptyState, Skeleton, cx } from "../components/ui";

export function OverviewSkeleton() {
  return (
    <div>
      <Skeleton className="h-9 w-72" />
      <Skeleton className="mt-3 h-5 w-64" />
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-[132px]" />)}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-[480px] lg:col-span-2" />
        <Skeleton className="h-[480px]" />
      </div>
    </div>
  );
}

export function Overview() {
  const { products, kpis, go, byId, activity, liveEvents, connection, setRoundOpen } = useStore();
  const { leaving, refill } = useRefillWithExit();
  const yesterday = buildHistory(new Date()).at(-1)!.availability;
  const delta = kpis.shelfHealth - yesterday;
  const attention = products.filter((p) => p.stockStatus !== "in_stock" && p.priorityScore >= 60).sort(byPriority);
  const needing = products.filter((p) => p.stockStatus !== "in_stock").length;
  const top = attention.slice(0, 6);
  const first = attention.find((p) => p.priorityScore >= 80);
  const listRef = useFlip<HTMLUListElement>(top.map((p) => p.id).join());

  return (
    <div>
      <section className="relative overflow-hidden rounded-3xl border border-line bg-surface p-5 shadow-card sm:p-7">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-teal/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-fast/5 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
          <HealthRing value={kpis.shelfHealth} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink3">{greeting()}, Store Manager</p>
            <h1 className="mt-1 font-display text-[24px] font-bold leading-tight tracking-[-0.025em] sm:text-[30px]">
              {first ? <>{plural(kpis.urgent, "shelf needs", "shelves need")} you now. Start with <span className="text-tealink">{first.name}</span>.</> : "All caught up. Nothing needs you right now."}
            </h1>
            <p className="mt-2 text-[15px] text-ink2">
              {first ? `${zoneLabel(first.section)}, Rack ${first.shelf}. ${first.stockStatus === "out_of_stock" ? "It's empty" : "It's nearly empty"} and selling ${first.salesVelocity.toFixed(1)}× faster than usual.` : "Here's what needs your attention today."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {first && (
                <Button variant="primary" className="h-11 px-5 text-[15px]" onClick={() => setRoundOpen(true)}>
                  <Footprints className="h-4 w-4" /> Start refill round
                </Button>
              )}
              <Button className="h-11" onClick={() => go("monitor")}><Cctv className="h-4 w-4" /> Watch cameras</Button>
            </div>
          </div>
          <StorefrontArt
            rows={["B3", "A2", "C1", "P1"].map((r) => products.filter((p) => p.shelf === r).slice(0, 7))}
            className="hidden w-[300px] shrink-0 lg:block xl:w-[340px]"
          />
        </div>
      </section>

      {/* How Shelfora got here: camera → analysis → action */}
      <ol className="thin-scroll mt-5 flex items-center gap-2 overflow-x-auto pb-1 text-[13px]" aria-label="How today's list was built">
        {[
          { icon: Cctv, text: `${cameras.length} store cameras watching`, page: "monitor" as const },
          { icon: ScanSearch, text: `${kpis.total} products checked on shelf`, page: "inventory" as const },
          { icon: PackageMinus, text: `${needing} running low or empty`, page: "inventory" as const },
          { icon: ListChecks, text: kpis.urgent ? `${kpis.urgent} to refill right now` : "Nothing urgent", page: "refill" as const, strong: kpis.urgent > 0 },
        ].map((s, i, arr) => (
          <li key={s.text} className="flex shrink-0 items-center gap-2">
            <button onClick={() => go(s.page)} className={cx("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-medium transition-colors", s.strong ? "border-empty/30 bg-emptysoft text-empty hover:border-empty/60" : "border-line bg-surface text-ink2 hover:text-ink")}>
              <s.icon className="h-3.5 w-3.5" /> {s.text}
            </button>
            {i < arr.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-ink3" />}
          </li>
        ))}
      </ol>

      <div className="stagger mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <div className="col-span-2 sm:col-span-1">
          <KPICard label="Shelf health" value={kpis.shelfHealth} suffix="%" icon={Gauge} iconTone="teal"
            note={`${delta >= 0 ? "+" : ""}${delta.toFixed(1)}% from yesterday · ${healthTone(kpis.shelfHealth).label}`} noteTone={delta >= 0 ? "green" : "amber"}
            onClick={() => go("health")} />
        </div>
        <KPICard label="Out of stock" value={kpis.outOfStock} unit="products" icon={PackageX} iconTone="red"
          note={kpis.outOfStockUrgent ? `${kpis.outOfStockUrgent} high priority` : "None urgent"} noteTone={kpis.outOfStockUrgent ? "red" : "plain"}
          onClick={() => go("inventory", { focus: "status:out_of_stock" })} />
        <KPICard label="Low stock" value={kpis.lowStock} unit="products" icon={PackageMinus} iconTone="amber"
          note={`${kpis.lowStockToday} need refill today`} noteTone={kpis.lowStockToday ? "amber" : "plain"}
          onClick={() => go("inventory", { focus: "status:low_stock" })} />
        <KPICard label="Fast movers" value={kpis.fastMovers} unit="products" icon={TrendingUp} iconTone="blue"
          note="Selling faster than usual" noteTone="blue" onClick={() => go("fast")} />
        <KPICard label="Refill priority" value={kpis.urgent} unit="urgent items" icon={ListChecks} iconTone="red"
          note={kpis.urgent ? "Action required" : "Nothing urgent"} noteTone={kpis.urgent ? "red" : "green"} onClick={() => go("refill")} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          <div className="flex flex-col gap-3 border-b border-line px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
            <div>
              <h2 className="font-display text-xl font-bold tracking-[-0.02em]">What needs attention</h2>
              <p className="mt-0.5 text-sm text-ink2">
                {attention.length ? <>{plural(attention.length, "product needs", "products need")} your attention. Refill these first to avoid missed sales.</> : "Nothing is urgent right now."}
              </p>
            </div>
            {attention.length > 0 && (
              <div className="flex gap-3 text-xs text-ink3">
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-empty" />Urgent</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-low" />High</span>
              </div>
            )}
          </div>
          {top.length ? (
            <ul ref={listRef} className="divide-y divide-line">
              {top.map((p) => <RefillRow key={p.id} p={p} variant="attention" leaving={leaving === p.id} onRefill={refill} />)}
            </ul>
          ) : (
            <EmptyState icon={<CheckCircle2 className="h-6 w-6" />} title="All caught up" body="Nothing needs immediate attention right now." />
          )}
          {attention.length > top.length && (
            <button onClick={() => go("refill")} className="flex w-full items-center justify-center gap-1 border-t border-line py-3.5 text-sm font-semibold text-teal hover:bg-tealsoft/50">
              See all {attention.length} in the refill queue <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="p-5">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-display text-base font-bold">Your store right now</h3>
              <button onClick={() => go("health")} className="text-xs font-semibold text-teal hover:underline">Details</button>
            </div>
            <StoreMap />
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink3">
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-empty" />Empty</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-low" />Low</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-teal/30" />Stocked</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-empty" />Refill now</span>
            </div>
            <p className="mt-2 text-xs text-ink3">Tap an aisle to open its camera.</p>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-base font-bold">Cameras</h3>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ok"><span className="live-dot h-1.5 w-1.5 rounded-full bg-ok" />All 4 connected</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {cameras.map((c) => (
                <button key={c.id} onClick={() => go("monitor", { camera: c.id })} className="group text-left">
                  <div className="transition-transform duration-200 group-hover:scale-[1.02]">
                    <CameraCard camera={c} products={products.filter((p) => p.camera === c.id)} />
                  </div>
                  <p className="mt-1 text-xs font-medium text-ink2">{c.name}</p>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-base font-bold">{liveEvents.length ? "Live activity" : "Refilled today"}</h3>
              {connection.status === "live" && <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ok"><span className="live-dot h-1.5 w-1.5 rounded-full bg-ok" />Following cameras</span>}
            </div>
            <ul className="space-y-3">
              {[
                ...liveEvents.filter((e) => e.kind !== "refilled").slice(0, 3).map((e) => ({ id: `e${e.seq}`, at: e.at * 1000, title: e.text, sub: "Spotted by camera", tone: e.kind === "out_of_stock" ? "red" : "amber" })),
                ...activity.slice(0, 4).map((a) => ({ id: a.id, at: a.at, title: byId[a.productId]?.name ?? a.productId, sub: `Refilled by ${a.by} · ${a.fromUnits} → ${a.toUnits} units`, tone: "green" })),
              ].sort((x, y) => y.at - x.at).slice(0, 5).map((e) => (
                <li key={e.id} className="toast-in flex items-start gap-3 text-sm">
                  <span className={cx("mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full", e.tone === "green" ? "bg-oksoft text-ok" : e.tone === "red" ? "bg-emptysoft text-empty" : "bg-lowsoft text-low")}>
                    {e.tone === "green" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Cctv className="h-3.5 w-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-ink">{e.title}</span>
                    <span className="block text-xs text-ink3">{e.sub} · {agoMs(e.at).toLowerCase()}</span>
                  </span>
                </li>
              ))}
            </ul>
            <Button variant="ghost" size="sm" className="mt-3 -ml-2" onClick={() => go("analytics")}>See refill times</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
