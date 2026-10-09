import { useState } from "react";
import { StoreProvider, useStore } from "./state/StoreContext";
import { Header } from "./components/Header";
import { MobileMenu, MobileTabBar, Sidebar } from "./components/Sidebar";
import { ProductDrawer } from "./components/ProductDrawer";
import { Toasts } from "./components/Toasts";
import { CommandPalette } from "./components/CommandPalette";
import { RefillRound } from "./components/RefillRound";
import { useEffect } from "react";
import { Overview } from "./pages/Overview";
import { Splash } from "./components/Splash";
import { LiveMonitor } from "./pages/LiveMonitor";
import { Inventory } from "./pages/Inventory";
import { RefillQueuePage } from "./pages/RefillQueue";
import { FastMovers } from "./pages/FastMovers";
import { ShelfHealth } from "./pages/ShelfHealth";
import { Analytics } from "./pages/Analytics";
import { Alerts } from "./pages/Alerts";
import { Settings } from "./pages/Settings";
import { VisionModel } from "./pages/VisionModel";
import type { PageId } from "./types";

const PAGES: Record<PageId, () => JSX.Element> = {
  overview: Overview,
  monitor: LiveMonitor,
  inventory: Inventory,
  refill: RefillQueuePage,
  fast: FastMovers,
  health: ShelfHealth,
  analytics: Analytics,
  alerts: Alerts,
  model: VisionModel,
  settings: Settings,
};

function Shell() {
  const { page, loaded, focusId, roundOpen, setRoundOpen } = useStore();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearch((s) => !s); }
      if (e.key === "/" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) { e.preventDefault(); setSearch(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const Page = PAGES[page];
  return (
    <div className="min-h-screen">
      <Sidebar />
      <MobileMenu open={menu} onClose={() => setMenu(false)} />
      <div className="lg:pl-64">
        <Header onMenu={() => setMenu(true)} onSearch={() => setSearch(true)} />
        <main className="mx-auto max-w-[1400px] px-4 pb-24 pt-6 sm:px-6 sm:pb-12 lg:px-8 lg:pt-8">
          {loaded ? (
            <div key={page + (focusId ?? "")} className={"vt-page " + ("startViewTransition" in document ? "" : "page-in")}><Page /></div>
          ) : (
            <Splash />
          )}
        </main>
      </div>
      <MobileTabBar onMore={() => setMenu(true)} />
      <ProductDrawer />
      <Toasts />
      <CommandPalette open={search} onClose={() => setSearch(false)} />
      <RefillRound open={roundOpen} onClose={() => setRoundOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
