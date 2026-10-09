import { Bell, Check, ChevronDown, Menu, Moon, Search, Store, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { stores } from "../data/stores";
import { useStore } from "../state/StoreContext";
import { ago, fmtDate } from "../lib/format";
import { LogoMark } from "./Logo";
import { cx } from "./ui";

function useClickAway(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) close(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open, close]);
  return ref;
}

function StoreSelector() {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const ref = useClickAway(open, () => setOpen(false));
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex h-10 items-center gap-2 rounded-xl border border-line bg-surface pl-3 pr-2.5 text-sm font-medium text-ink hover:bg-sunken"
      >
        <Store className="h-4 w-4 text-ink3" />
        <span className="hidden max-w-[160px] truncate sm:inline">DGI Retail Store</span>
        <ChevronDown className={cx("h-4 w-4 text-ink3 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div role="listbox" className="page-in absolute right-0 top-12 z-50 w-72 rounded-2xl border border-line bg-surface p-1.5 shadow-lift">
          {stores.map((s) => (
            <button
              key={s.id}
              role="option"
              aria-selected={s.connected}
              onClick={() => {
                if (s.connected) setOpen(false);
                else setNote(`${s.name} has no cameras connected yet. Finish camera setup in Settings to see its shelves.`);
              }}
              className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-sunken"
            >
              <span className={cx("mt-1.5 h-2 w-2 shrink-0 rounded-full", s.connected ? "bg-ok" : "bg-line")} />
              <span className="flex-1">
                <span className={cx("block text-sm font-medium", s.connected ? "text-ink" : "text-ink2")}>{s.name}</span>
                <span className="block text-xs text-ink3">{s.detail}</span>
              </span>
              {s.connected && <Check className="mt-0.5 h-4 w-4 text-teal" />}
            </button>
          ))}
          {note && <p className="mx-2 mb-1 mt-1 rounded-xl bg-lowsoft px-3 py-2 text-xs text-low">{note}</p>}
        </div>
      )}
    </div>
  );
}

function Notifications() {
  const { alerts, openProduct, go } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useClickAway(open, () => setOpen(false));
  const pressing = alerts.filter((a) => a.severity !== "medium");
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications, ${pressing.length} need attention`}
        className="relative grid h-10 w-10 place-items-center rounded-xl border border-line bg-surface text-ink2 hover:bg-sunken"
      >
        <Bell className="h-[18px] w-[18px]" />
        {pressing.length > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-empty ring-2 ring-surface" />}
      </button>
      {open && (
        <div className="page-in absolute right-0 top-12 z-50 w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-line bg-surface shadow-lift">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="font-display text-sm font-bold">{pressing.length ? `${pressing.length} things need you` : "You're all caught up"}</p>
            <button onClick={() => { setOpen(false); go("alerts"); }} className="text-xs font-semibold text-teal hover:underline">See all alerts</button>
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {pressing.slice(0, 6).map((a) => (
              <li key={a.id}>
                <button onClick={() => { setOpen(false); openProduct(a.productId); }} className="flex w-full gap-3 px-4 py-3 text-left hover:bg-sunken">
                  <span className={cx("mt-1.5 h-2 w-2 shrink-0 rounded-full", a.severity === "critical" ? "bg-empty" : "bg-low")} />
                  <span>
                    <span className="block text-sm font-medium text-ink">{a.title}</span>
                    <span className="block text-xs text-ink3">{a.where} · {ago(a.minutesAgo)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem("shelfora.theme");
      if (saved) return saved === "dark";
    } catch { /* storage unavailable */ }
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    try { localStorage.setItem("shelfora.theme", dark ? "dark" : "light"); } catch { /* ignore */ }
  }, [dark]);
  const flip = () => {
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (doc.startViewTransition) doc.startViewTransition(() => setDark((d) => !d));
    else setDark((d) => !d);
  };
  return (
    <button onClick={flip} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} className="press relative grid h-10 w-10 place-items-center overflow-hidden rounded-xl border border-line bg-surface text-ink2 hover:bg-sunken">
      <Sun className={cx("absolute h-[18px] w-[18px] transition-all duration-500", dark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100")} />
      <Moon className={cx("absolute h-[18px] w-[18px] transition-all duration-500", dark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0")} />
    </button>
  );
}

function ConnectionPill() {
  const { connection, go } = useStore();
  const live = connection.status === "live";
  return (
    <button onClick={() => go("settings")} className={cx("hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium md:inline-flex", live ? "bg-oksoft text-ok" : connection.status === "error" ? "bg-lowsoft text-low" : "bg-sunken text-ink2")}>
      <span className={cx("h-1.5 w-1.5 rounded-full", live ? "live-dot bg-ok" : connection.status === "error" ? "bg-low" : "bg-ink3")} />
      {live ? (connection.health?.mode === "demo" ? "Server connected (demo store)" : "Live from store cameras") : connection.status === "error" ? "Store server unreachable" : "Sample data"}
    </button>
  );
}

export function Header({ onMenu, onSearch }: { onMenu: () => void; onSearch: () => void }) {
  return (
    <header className="sticky z-30 border-b border-line/70 bg-paper/85 backdrop-blur" style={{ top: "env(safe-area-inset-top, 0px)" }}>
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button onClick={onMenu} className="grid h-10 w-10 place-items-center rounded-xl text-ink2 hover:bg-sunken lg:hidden" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 lg:hidden">
          <LogoMark size={28} />
          <span className="font-display text-[17px] font-extrabold tracking-[-0.03em]">Shelfora</span>
        </div>
        <p className="hidden text-sm text-ink2 lg:block">{fmtDate()}</p>
        <ConnectionPill />
        <div className="ml-auto flex items-center gap-2">
          <button onClick={onSearch} className="press flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm text-ink3 hover:bg-sunken" aria-label="Search products and pages">
            <Search className="h-4 w-4" />
            <span className="hidden xl:inline">Search products</span>
            <kbd className="hidden rounded-md bg-sunken px-1.5 text-[11px] xl:inline">⌘K</kbd>
          </button>
          <StoreSelector />
          <ThemeToggle />
          <Notifications />
          <div className="hidden h-10 items-center gap-2 rounded-xl pl-1 pr-2 sm:flex">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-teal/15 text-xs font-bold text-tealink">SM</div>
          </div>
        </div>
      </div>
    </header>
  );
}
