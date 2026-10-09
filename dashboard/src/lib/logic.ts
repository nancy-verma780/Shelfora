import type {
  Alert, Camera, PriorityLevel, Product, ProductRecord, RecommendedAction, SectionId, Settings, StockStatus,
} from "../types";

export const DEFAULT_SETTINGS: Settings = {
  lowStockThreshold: 0.25,
  fastMoverThreshold: 1.5,
  soundAlerts: false,
  pushCritical: true,
  dailySummary: true,
};

/** Weights for the refill priority score. Shown to the manager in Settings and the product drawer. */
export const PRIORITY_WEIGHTS = { stockRisk: 0.5, velocity: 0.3, timeToEmpty: 0.2 };

const clamp = (n: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, n));
const round1 = (n: number) => Math.round(n * 10) / 10;

export function stockStatusOf(stock: number, capacity: number, s: Settings): StockStatus {
  if (stock <= 0) return "out_of_stock";
  if (stock <= capacity * s.lowStockThreshold) return "low_stock";
  return "in_stock";
}

export function levelOf(score: number): PriorityLevel {
  if (score >= 80) return "urgent";
  if (score >= 60) return "high";
  if (score >= 40) return "medium";
  return "low";
}

/**
 * Refill priority (0–100) = 50% stock risk + 30% sales velocity + 20% time-to-empty.
 *  - Stock risk: 100 when empty, 60–100 inside the low-stock band, falling to 0 on a full shelf.
 *  - Velocity: 0 at ≤0.8× normal, 100 at ≥3.3× normal.
 *  - Time to empty: 100 when empty, falls by 12.5 points per hour of stock left (0 at 8h+).
 */
export function enrich(r: ProductRecord, s: Settings): Product {
  const stockStatus = stockStatusOf(r.estimatedStock, r.shelfCapacity, s);
  const lowLine = r.shelfCapacity * s.lowStockThreshold;
  const currentSalesRate = round1(r.normalSalesRate * r.salesVelocity);
  const hoursLeft = r.estimatedStock === 0 ? null : r.estimatedStock / currentSalesRate;

  const stockRisk =
    stockStatus === "out_of_stock" ? 100
    : stockStatus === "low_stock" ? 60 + 40 * (1 - r.estimatedStock / lowLine)
    : 60 * (1 - (r.estimatedStock - lowLine) / (r.shelfCapacity - lowLine));
  const velocity = clamp(((r.salesVelocity - 0.8) / 2.5) * 100);
  const timeToEmpty = hoursLeft === null ? 100 : clamp(100 - hoursLeft * 12.5);

  const priorityScore = Math.round(
    PRIORITY_WEIGHTS.stockRisk * stockRisk + PRIORITY_WEIGHTS.velocity * velocity + PRIORITY_WEIGHTS.timeToEmpty * timeToEmpty,
  );
  const isFastMover = r.salesVelocity >= s.fastMoverThreshold;

  let action: RecommendedAction;
  if (stockStatus === "out_of_stock") action = "Refill now";
  else if (stockStatus === "low_stock") action = priorityScore >= 60 ? "Refill soon" : "Monitor";
  else action = isFastMover ? "Watch demand" : "No action needed";

  return {
    ...r,
    stockStatus,
    currentSalesRate,
    hoursLeft,
    priorityScore,
    priorityLevel: levelOf(priorityScore),
    breakdown: {
      stockRisk: Math.round(PRIORITY_WEIGHTS.stockRisk * stockRisk),
      velocity: Math.round(PRIORITY_WEIGHTS.velocity * velocity),
      timeToEmpty: Math.round(PRIORITY_WEIGHTS.timeToEmpty * timeToEmpty),
    },
    isFastMover,
    action,
    reason: reasonFor(stockStatus, r.salesVelocity, isFastMover, hoursLeft),
  };
}

function reasonFor(status: StockStatus, v: number, fast: boolean, hoursLeft: number | null): string {
  const pace = `${v.toFixed(1)}× its normal rate`;
  if (status === "out_of_stock") {
    return fast
      ? `This product is unavailable and was selling at ${pace} before it ran out. Every hour empty is a missed sale.`
      : "This product is unavailable on the shelf. Customers looking for it will leave without it.";
  }
  if (status === "low_stock") {
    const left = hoursLeft !== null ? formatHours(hoursLeft) : "";
    if (fast) return `Only a few units left and it's selling at ${pace}. At this pace the shelf empties in about ${left}.`;
    if (hoursLeft !== null && hoursLeft < 2) return `Stock is below the shelf threshold and will run out in about ${left}.`;
    return "Stock is below the shelf threshold. Demand is steady, so this can wait for the next round.";
  }
  if (fast) return `Selling at ${pace}. The shelf is stocked for now, but it will drain faster than usual.`;
  return "Stock and demand both look normal.";
}

export function formatHours(h: number): string {
  if (h < 1) return `${Math.max(5, Math.round((h * 60) / 5) * 5)} min`;
  if (h < 10) return `${round1(h)} h`.replace(".0 h", " h");
  return `${Math.round(h)} h`;
}

export const byPriority = (a: Product, b: Product) => b.priorityScore - a.priorityScore || a.name.localeCompare(b.name);

// ── Aggregates ───────────────────────────────────────────────────────────────

export interface Kpis {
  total: number;
  shelfHealth: number; // % of products available on the shelf
  outOfStock: number;
  outOfStockUrgent: number;
  lowStock: number;
  lowStockToday: number;
  fastMovers: number;
  urgent: number;
  fillRate: number; // % of shelf capacity filled
}

export function computeKpis(products: Product[]): Kpis {
  const out = products.filter((p) => p.stockStatus === "out_of_stock");
  const low = products.filter((p) => p.stockStatus === "low_stock");
  const cap = products.reduce((a, p) => a + p.shelfCapacity, 0);
  const units = products.reduce((a, p) => a + p.estimatedStock, 0);
  return {
    total: products.length,
    shelfHealth: ((products.length - out.length) / products.length) * 100,
    outOfStock: out.length,
    outOfStockUrgent: out.filter((p) => p.priorityScore >= 80).length,
    lowStock: low.length,
    lowStockToday: low.filter((p) => p.priorityScore >= 60).length,
    fastMovers: products.filter((p) => p.isFastMover).length,
    urgent: products.filter((p) => p.priorityScore >= 80).length,
    fillRate: (units / cap) * 100,
  };
}

export interface ZoneStats {
  total: number;
  available: number;
  inStock: number;
  low: number;
  out: number;
  fast: number;
  health: number;
}

export function zoneStats(products: Product[]): ZoneStats {
  const out = products.filter((p) => p.stockStatus === "out_of_stock").length;
  const low = products.filter((p) => p.stockStatus === "low_stock").length;
  return {
    total: products.length,
    available: products.length - out,
    inStock: products.length - out - low,
    low,
    out,
    fast: products.filter((p) => p.isFastMover).length,
    health: products.length ? ((products.length - out) / products.length) * 100 : 100,
  };
}

export const productsInSection = (ps: Product[], id: SectionId) => ps.filter((p) => p.section === id);
export const productsOnCamera = (ps: Product[], cam: Camera) => ps.filter((p) => p.camera === cam.id);

// ── Alerts ───────────────────────────────────────────────────────────────────

const ZONE_LABEL: Record<SectionId, string> = {
  beverages: "Beverage Aisle", snacks: "Snacks", dairy: "Dairy", personal: "Personal Care",
};
const CAM_LABEL: Record<string, string> = { "cam-01": "Camera 01", "cam-02": "Camera 02", "cam-03": "Camera 03", "cam-04": "Camera 04" };

export const whereOf = (p: Product) => `${ZONE_LABEL[p.section]} · Rack ${p.shelf}`;
export const zoneLabel = (s: SectionId) => ZONE_LABEL[s];

/** Turns the current shelf state into the list of things worth telling a manager about. */
export function deriveAlerts(products: Product[]): Alert[] {
  const alerts: Alert[] = [];
  for (const p of products) {
    const where = `${ZONE_LABEL[p.section]} · ${CAM_LABEL[p.camera]}`;
    const base = { productId: p.id, where, minutesAgo: p.lastDetectedMin };
    const short = shortName(p.name);
    if (p.stockStatus === "out_of_stock") {
      alerts.push({ ...base, id: `${p.id}:out`, kind: "out", severity: p.priorityScore >= 80 ? "critical" : "high", title: `${p.name} is out of stock`, action: "Refill now" });
    } else if (p.stockStatus === "low_stock" && p.isFastMover) {
      alerts.push({ ...base, id: `${p.id}:fast_low`, kind: "fast_low", severity: "high", title: `${short} is selling ${p.salesVelocity.toFixed(1)}× faster than normal`, action: "Review refill" });
    } else if (p.stockStatus === "low_stock" && p.priorityScore >= 60) {
      alerts.push({ ...base, id: `${p.id}:low`, kind: "low", severity: "high", title: `${short} will run out in about ${formatHours(p.hoursLeft ?? 0)}`, action: "Refill soon" });
    } else if (p.stockStatus === "low_stock") {
      alerts.push({ ...base, id: `${p.id}:below`, kind: "below", severity: "medium", title: `${short} is below its shelf threshold`, action: "Monitor" });
    } else if (p.isFastMover) {
      alerts.push({ ...base, id: `${p.id}:fast`, kind: "fast", severity: "medium", title: `${short} is selling faster than usual`, action: "Watch demand" });
    }
  }
  const rank = { critical: 0, high: 1, medium: 2 };
  return alerts.sort((a, b) => rank[a.severity] - rank[b.severity] || a.minutesAgo - b.minutesAgo);
}

/** "Lay's Classic Salted 52g" → "Lay's Classic Salted" for sentence-style copy. */
export function shortName(name: string): string {
  return name.replace(/\s+\d+(\.\d+)?\s?(g|kg|ml|L)$/i, "").replace(/\s+\d+-Pack.*$/i, "");
}
