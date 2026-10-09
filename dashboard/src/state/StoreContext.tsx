import { flushSync } from "react-dom";
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { api, backend, type Health, type LiveEvent } from "../lib/api";
import { DEFAULT_SETTINGS, computeKpis, deriveAlerts, enrich, type Kpis } from "../lib/logic";
import { seedActivity, seedResolvedAlerts } from "../data/alerts";
import { staff } from "../data/stores";
import type { ActivityEntry, Alert, PageId, Product, ProductRecord, RefillTask, ResolvedAlert, Settings } from "../types";

const MIN = 60_000;

interface State {
  loaded: boolean;
  loadedAt: number;
  records: ProductRecord[];
  refilledAt: Record<string, number>;
  settings: Settings;
  tasks: Record<string, RefillTask>;
  resolved: ResolvedAlert[];
  dismissed: string[]; // alert ids marked resolved by the manager
  activity: ActivityEntry[];
}

interface UndoPayload {
  record: ProductRecord;
  refilledAt?: number;
  task?: RefillTask;
  activityId: string;
  resolvedIds: string[];
}

type Action =
  | { type: "load"; records: ProductRecord[] }
  | { type: "sync"; records: ProductRecord[] }
  | { type: "refill"; id: string; by: string; activityId: string; alerts: Alert[]; at: number }
  | { type: "undo"; payload: UndoPayload }
  | { type: "assign"; id: string; assignee: string }
  | { type: "unassign"; id: string }
  | { type: "resolve"; alert: Alert }
  | { type: "settings"; patch: Partial<Settings> }
  | { type: "reset"; records: ProductRecord[] };

function init(now: number): State {
  return {
    loaded: false,
    loadedAt: now,
    records: [],
    refilledAt: {},
    settings: DEFAULT_SETTINGS,
    tasks: {},
    resolved: seedResolvedAlerts(now),
    dismissed: [],
    activity: seedActivity(now),
  };
}

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "load":
      return { ...s, loaded: true, records: a.records, loadedAt: Date.now() };
    case "sync": {
      // Server state wins, but keep refill times we confirmed locally a moment ago.
      return { ...s, loaded: true, records: a.records, loadedAt: Date.now() };
    }
    case "reset":
      return { ...init(Date.now()), loaded: true, records: a.records };
    case "refill": {
      const rec = s.records.find((r) => r.id === a.id);
      if (!rec) return s;
      const now = a.at;
      const { [a.id]: _done, ...tasks } = s.tasks;
      const newlyResolved: ResolvedAlert[] = a.alerts
        .filter((al) => al.productId === a.id && !s.dismissed.includes(al.id))
        .map((al) => ({ ...al, id: `${al.id}@${now}`, resolvedAt: now, resolution: `Refilled by ${a.by}` }));
      return {
        ...s,
        records: s.records.map((r) => (r.id === a.id ? { ...r, estimatedStock: r.shelfCapacity, lastDetectedMin: 0 } : r)),
        refilledAt: { ...s.refilledAt, [a.id]: now },
        tasks,
        resolved: [...newlyResolved, ...s.resolved],
        dismissed: s.dismissed.filter((id) => !id.startsWith(a.id + ":")),
        activity: [{ id: a.activityId, productId: a.id, at: now, by: a.by, fromUnits: rec.estimatedStock, toUnits: rec.shelfCapacity }, ...s.activity],
      };
    }
    case "undo": {
      const p = a.payload;
      const refilledAt = { ...s.refilledAt };
      if (p.refilledAt) refilledAt[p.record.id] = p.refilledAt;
      else delete refilledAt[p.record.id];
      return {
        ...s,
        records: s.records.map((r) => (r.id === p.record.id ? p.record : r)),
        refilledAt,
        tasks: p.task ? { ...s.tasks, [p.record.id]: p.task } : s.tasks,
        activity: s.activity.filter((e) => e.id !== p.activityId),
        resolved: s.resolved.filter((r) => !p.resolvedIds.includes(r.id)),
      };
    }
    case "assign":
      return { ...s, tasks: { ...s.tasks, [a.id]: { productId: a.id, assignee: a.assignee, startedAt: Date.now() } } };
    case "unassign": {
      const { [a.id]: _gone, ...tasks } = s.tasks;
      return { ...s, tasks };
    }
    case "resolve":
      return {
        ...s,
        dismissed: [...s.dismissed, a.alert.id],
        resolved: [{ ...a.alert, id: `${a.alert.id}@${Date.now()}`, resolvedAt: Date.now(), resolution: "Marked as resolved by Store Manager" }, ...s.resolved],
      };
    case "settings":
      return { ...s, settings: { ...s.settings, ...a.patch } };
  }
}

export interface Toast {
  id: number;
  title: string;
  body?: string;
  tone: "success" | "info";
  undo?: () => void;
}

interface Ctx {
  loaded: boolean;
  products: Product[];
  byId: Record<string, Product>;
  kpis: Kpis;
  alerts: Alert[]; // active
  resolved: ResolvedAlert[];
  activity: ActivityEntry[];
  tasks: Record<string, RefillTask>;
  settings: Settings;
  lastRefillAt: (p: Product) => number;
  refill: (id: string, opts?: { quiet?: boolean }) => void;
  assign: (id: string) => void;
  unassign: (id: string) => void;
  resolveAlert: (a: Alert) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  resetDemo: () => void;
  // UI
  page: PageId;
  go: (p: PageId, opts?: { camera?: string; focus?: string }) => void;
  drawerId: string | null;
  openProduct: (id: string | null) => void;
  cameraId: string;
  setCameraId: (id: string) => void;
  focusId: string | null;
  toasts: Toast[];
  dismissToast: (id: number) => void;
  connection: Connection;
  connect: (url: string) => Promise<boolean>;
  disconnect: () => void;
  liveEvents: LiveEvent[];
  roundOpen: boolean;
  setRoundOpen: (v: boolean) => void;
}

export interface Connection {
  status: "sample" | "connecting" | "live" | "error";
  url: string | null;
  health?: Health;
  error?: string;
}

const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, dispatch] = useReducer(reducer, Date.now(), init);
  const [page, setPage] = useState<PageId>("overview");
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [cameraId, setCameraId] = useState("cam-01");
  const [focusId, setFocusId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastSeq = useRef(0);
  const assignSeq = useRef(0);
  const [connection, setConnection] = useState<Connection>({ status: backend.url ? "connecting" : "sample", url: backend.url });
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [roundOpen, setRoundOpen] = useState(false);
  const eventSeq = useRef(0);

  // Initial load: from the connected store if there is one, otherwise sample data.
  useEffect(() => {
    if (!backend.url) {
      api.getProducts().then((records) => dispatch({ type: "load", records }));
      return;
    }
    const url = backend.url;
    api.health(url)
      .then((health) => { setConnection({ status: "live", url, health }); return api.getProducts(); })
      .then((records) => dispatch({ type: "load", records }))
      .catch(() => {
        backend.set(null);
        setConnection({ status: "error", url, error: "Couldn't reach your store server, so sample data is shown." });
        api.getProducts().then((records) => dispatch({ type: "load", records }));
      });
  }, []);

  // While connected, follow the cameras: refresh stock and pick up new events every few seconds.
  useEffect(() => {
    if (connection.status !== "live") return;
    let alive = true;
    const tick = async () => {
      try {
        const [records, evs] = await Promise.all([api.getProducts(), api.getEvents(eventSeq.current)]);
        if (!alive) return;
        dispatch({ type: "sync", records });
        if (evs.length) {
          eventSeq.current = evs[evs.length - 1].seq;
          setLiveEvents((old) => [...evs.reverse(), ...old].slice(0, 30));
          evs.filter((e) => e.kind === "out_of_stock").slice(0, 2).forEach((e) => pushToastRef.current?.({ tone: "info", title: "Camera spotted an empty shelf", body: e.text }));
        }
      } catch {
        if (alive) setConnection((c) => ({ ...c, status: "error", error: "Lost connection to the store server. Retrying…" }));
      }
    };
    const id = setInterval(tick, 3000);
    return () => { alive = false; clearInterval(id); };
  }, [connection.status]);

  const products = useMemo(() => s.records.map((r) => enrich(r, s.settings)), [s.records, s.settings]);
  const byId = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products]);
  const kpis = useMemo(() => (products.length ? computeKpis(products) : emptyKpis), [products]);
  const allAlerts = useMemo(() => deriveAlerts(products), [products]);
  const alerts = useMemo(() => allAlerts.filter((a) => !s.dismissed.includes(a.id)), [allAlerts, s.dismissed]);

  const pushToast = useCallback((t: Omit<Toast, "id">) => {
    const id = ++toastSeq.current;
    setToasts((ts) => [...ts.slice(-2), { ...t, id }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), t.undo ? 6500 : 3800);
  }, []);
  const pushToastRef = useRef<typeof pushToast | null>(null);
  pushToastRef.current = pushToast;
  const dismissToast = useCallback((id: number) => setToasts((ts) => ts.filter((x) => x.id !== id)), []);

  const refill = useCallback(
    (id: string, opts?: { quiet?: boolean }) => {
      const rec = s.records.find((r) => r.id === id);
      if (!rec) return;
      const task = s.tasks[id];
      const by = task?.assignee ?? "Store Manager";
      const activityId = `act-${Date.now()}`;
      const now = Date.now();
      const resolvedIds = allAlerts.filter((al) => al.productId === id && !s.dismissed.includes(al.id)).map((al) => `${al.id}@${now}`);
      const payload: UndoPayload = { record: rec, refilledAt: s.refilledAt[id], task, activityId, resolvedIds };
      dispatch({ type: "refill", id, by, activityId, alerts: allAlerts, at: now });
      void api.markRefilled(id, by);
      if (!opts?.quiet) pushToast({
        tone: "success",
        title: `${rec.name} marked as refilled`,
        body: `Shelf restocked to ${rec.shelfCapacity} units.`,
        undo: backend.url ? undefined : () => dispatch({ type: "undo", payload }),
      });
    },
    [s.records, s.tasks, s.refilledAt, s.dismissed, allAlerts, pushToast],
  );

  const assign = useCallback(
    (id: string) => {
      const assignee = staff[assignSeq.current++ % staff.length];
      dispatch({ type: "assign", id, assignee });
      const name = byId[id]?.name ?? "Product";
      pushToast({ tone: "info", title: `${name} added to refill`, body: `${assignee} has been asked to restock Rack ${byId[id]?.shelf}.` });
    },
    [byId, pushToast],
  );

  const ctx: Ctx = {
    loaded: s.loaded,
    products,
    byId,
    kpis,
    alerts,
    resolved: s.resolved,
    activity: s.activity,
    tasks: s.tasks,
    settings: s.settings,
    lastRefillAt: (p) => s.refilledAt[p.id] ?? s.loadedAt - p.lastRefillMin * MIN,
    refill,
    assign,
    unassign: (id) => dispatch({ type: "unassign", id }),
    resolveAlert: (a) => {
      dispatch({ type: "resolve", alert: a });
      pushToast({ tone: "success", title: "Alert resolved", body: a.title });
    },
    updateSettings: (patch) => dispatch({ type: "settings", patch }),
    resetDemo: () => {
      api.resetDemo().then(api.getProducts).then((records) => dispatch({ type: "reset", records })).catch(() => undefined);
      pushToast({ tone: "info", title: "Demo data restored", body: "Shelves are back to this morning's snapshot." });
    },
    page,
    go: (p, opts) => {
      const apply = () => {
        setPage(p);
        if (opts?.camera) setCameraId(opts.camera);
        setFocusId(opts?.focus ?? null);
        setDrawerId(null);
        window.scrollTo({ top: 0 });
      };
      const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (doc.startViewTransition && !reduce) doc.startViewTransition(() => flushSync(apply));
      else apply();
    },
    drawerId,
    openProduct: setDrawerId,
    cameraId,
    setCameraId: (id) => { setCameraId(id); setFocusId(null); },
    focusId,
    toasts,
    dismissToast,
    connection,
    liveEvents,
    roundOpen,
    setRoundOpen,
    connect: async (url) => {
      const clean = url.trim().replace(/\/+$/, "");
      setConnection({ status: "connecting", url: clean });
      try {
        const health = await api.health(clean);
        backend.set(clean);
        const records = await api.getProducts();
        eventSeq.current = 0;
        setLiveEvents([]);
        dispatch({ type: "reset", records });
        setConnection({ status: "live", url: clean, health });
        pushToast({ tone: "success", title: `Connected to ${health.store}`, body: `${health.cameras.length} cameras, ${health.products} products${health.mode === "demo" ? " (demo store)" : ""}.` });
        return true;
      } catch (e) {
        setConnection({ status: "error", url: clean, error: describeFailure(e) });
        return false;
      }
    },
    disconnect: () => {
      backend.set(null);
      setConnection({ status: "sample", url: null });
      setLiveEvents([]);
      api.getProducts().then((records) => dispatch({ type: "reset", records }));
      pushToast({ tone: "info", title: "Disconnected", body: "Showing sample data again." });
    },
  };

  return <StoreCtx.Provider value={ctx}>{children}</StoreCtx.Provider>;
}

function describeFailure(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/abort/i.test(msg)) return "The server didn't answer within 6 seconds. Check the address and that it's running.";
  if (/^\d{3}/.test(msg)) return `The server answered with an error (${msg}). Is this a Shelfora Vision server?`;
  return "Couldn't reach that address. Check it's running and allows this page (CORS). The hosted preview can't call other servers, so connect from your own copy of the dashboard.";
}

const emptyKpis: Kpis = { total: 0, shelfHealth: 0, outOfStock: 0, outOfStockUrgent: 0, lowStock: 0, lowStockToday: 0, fastMovers: 0, urgent: 0, fillRate: 0 };

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore must be used inside StoreProvider");
  return c;
}
