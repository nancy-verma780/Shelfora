import { BarChart3, Bell, Cctv, Gauge, LayoutGrid, ListChecks, Package, ScanEye, Settings, TrendingUp, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useStore } from "../state/StoreContext";
import type { PageId } from "../types";
import { Logo } from "./Logo";
import { cx } from "./ui";

export const NAV: { id: PageId; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "monitor", label: "Live Monitor", icon: Cctv },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "refill", label: "Refill Queue", icon: ListChecks },
  { id: "fast", label: "Fast Movers", icon: TrendingUp },
  { id: "health", label: "Shelf Health", icon: Gauge },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "model", label: "Vision Model", icon: ScanEye },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "settings", label: "Settings", icon: Settings },
];

export function useNavCounts(): Partial<Record<PageId, { n: number; tone: "red" | "plain" }>> {
  const { kpis, alerts, loaded } = useStore();
  if (!loaded) return {};
  const pressing = alerts.filter((a) => a.severity !== "medium").length;
  return {
    refill: { n: kpis.urgent, tone: kpis.urgent ? "red" : "plain" },
    alerts: { n: pressing, tone: alerts.some((a) => a.severity === "critical") ? "red" : "plain" },
  };
}

export function SidebarContent({ onNavigate, onClose }: { onNavigate?: () => void; onClose?: () => void }) {
  const { page, go } = useStore();
  const counts = useNavCounts();
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Logo />
        {onClose && (
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl text-ink2 hover:bg-sunken" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <nav className="relative mt-2 flex-1 space-y-0.5 overflow-y-auto px-3" aria-label="Main">
        <span aria-hidden className="slide-ind pointer-events-none absolute left-3 right-3 top-0 h-10 rounded-xl bg-tealsoft" style={{ transform: `translateY(${Math.max(0, NAV.findIndex((n) => n.id === page)) * 42}px)` }} />
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = page === id;
          const c = counts[id];
          return (
            <button
              key={id}
              onClick={() => { go(id); onNavigate?.(); }}
              aria-current={active ? "page" : undefined}
              className={cx(
                "group relative flex h-10 w-full items-center gap-3 rounded-xl px-3 text-[14px] font-medium transition-colors duration-200",
                active ? "text-tealink" : "text-ink2 hover:bg-sunken/70 hover:text-ink",
              )}
            >
              <Icon className={cx("h-[18px] w-[18px] transition-[color,transform] duration-300", active ? "scale-110 text-teal" : "text-ink3 group-hover:text-ink2")} strokeWidth={2} />
              <span className="flex-1 text-left">{label}</span>
              {c && c.n > 0 && (
                <span className={cx("tnum min-w-[22px] rounded-full px-1.5 py-px text-center text-[11px] font-semibold", c.tone === "red" ? "bg-empty text-white dark:text-[rgb(var(--paper))]" : "bg-sunken text-ink2")}>
                  {c.n}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="m-3 overflow-hidden rounded-2xl border border-line bg-sunken/60">
        <div aria-hidden className="h-2.5 w-full" style={{ background: "repeating-linear-gradient(90deg, rgb(var(--teal)) 0 12px, rgb(var(--surface)) 12px 24px)" }} />
        <div className="p-4 pt-3">
        <p className="text-xs text-ink3">Store</p>
        <p className="text-sm font-semibold text-ink">DGI Retail Store</p>
        <div className="my-3 h-px bg-line" />
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-teal/15 text-xs font-bold text-tealink">SM</div>
          <div>
            <p className="text-xs text-ink3">Manager</p>
            <p className="text-sm font-semibold text-ink">Store Manager</p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-surface lg:block" style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <SidebarContent />
    </aside>
  );
}

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="scrim-in absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-surface shadow-drawer menu-in" style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <SidebarContent onNavigate={onClose} onClose={onClose} />
      </div>
    </div>
  );
}

/** Bottom tab bar for phones: the four things a manager checks on the floor, plus the full menu. */
export function MobileTabBar({ onMore }: { onMore: () => void }) {
  const { page, go } = useStore();
  const counts = useNavCounts();
  const tabs: PageId[] = ["overview", "monitor", "refill", "alerts"];
  const short: Partial<Record<PageId, string>> = { overview: "Today", monitor: "Cameras", refill: "Refill", alerts: "Alerts" };
  const inTabs = tabs.includes(page);
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Quick navigation"
    >
      <div className="grid grid-cols-5">
        {tabs.map((id) => {
          const item = NAV.find((n) => n.id === id)!;
          const Icon = item.icon;
          const active = page === id;
          const c = counts[id];
          return (
            <button key={id} onClick={() => go(id)} className={cx("relative flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium", active ? "text-teal" : "text-ink3")}>
              <Icon className="h-5 w-5" />
              {short[id]}
              {c && c.n > 0 && <span className="tnum absolute right-[22%] top-1.5 rounded-full bg-empty px-1.5 text-[10px] font-semibold text-white dark:text-[rgb(var(--paper))]">{c.n}</span>}
            </button>
          );
        })}
        <button onClick={onMore} className={cx("flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium", !inTabs ? "text-teal" : "text-ink3")}>
          <LayoutGrid className="h-5 w-5" />
          More
        </button>
      </div>
    </nav>
  );
}
