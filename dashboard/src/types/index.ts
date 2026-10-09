// Domain types. These mirror the shape a FastAPI backend would return,
// so the mock data layer can be swapped for real endpoints later.

export type Category =
  | "Beverages"
  | "Snacks"
  | "Dairy"
  | "Biscuits"
  | "Instant Food"
  | "Personal Care";

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";
export type PriorityLevel = "urgent" | "high" | "medium" | "low";
export type PackShape = "bottle" | "can" | "jug" | "pack" | "box" | "carton" | "tub" | "tube" | "bar" | "jar";

export type SectionId = "beverages" | "snacks" | "dairy" | "personal";

/** Raw record as the vision pipeline + POS would report it. */
export interface ProductRecord {
  id: string;
  name: string;
  category: Category;
  section: SectionId;
  shelf: string; // rack code, e.g. "B3"
  camera: string; // camera id, e.g. "cam-01"
  shelfCapacity: number; // units the facing can hold
  estimatedStock: number; // units counted on shelf by the camera
  normalSalesRate: number; // units / hour, 28-day baseline for this hour band
  salesVelocity: number; // current rate ÷ normal rate
  lastDetectedMin: number; // minutes since last camera read
  lastRefillMin: number; // minutes since last refill
  color: string; // pack colour, used to draw the simulated feed
  shape: PackShape;
}

/** Record enriched with Shelfora's decision logic. */
export interface Product extends ProductRecord {
  stockStatus: StockStatus;
  currentSalesRate: number;
  hoursLeft: number | null; // null when already empty
  priorityScore: number;
  priorityLevel: PriorityLevel;
  breakdown: { stockRisk: number; velocity: number; timeToEmpty: number };
  isFastMover: boolean;
  action: RecommendedAction;
  reason: string;
}

export type RecommendedAction = "Refill now" | "Refill soon" | "Monitor" | "Watch demand" | "No action needed";

export interface Camera {
  id: string;
  name: string;
  label: string; // "Camera 01"
  section: SectionId;
  racks: string[];
  resolution: string;
  fps: number;
  status: "connected" | "reconnecting" | "offline";
}

export interface Section {
  id: SectionId;
  name: string;
  camera: string;
}

export type AlertSeverity = "critical" | "high" | "medium";
export type AlertKind = "out" | "fast_low" | "low" | "below" | "fast";

export interface Alert {
  id: string;
  productId: string;
  kind: AlertKind;
  severity: AlertSeverity;
  title: string;
  where: string;
  minutesAgo: number;
  action: string;
}

export interface ResolvedAlert extends Alert {
  resolvedAt: number; // epoch ms
  resolution: string;
}

export interface RefillTask {
  productId: string;
  assignee: string;
  startedAt: number;
}

export interface ActivityEntry {
  id: string;
  productId: string;
  at: number;
  by: string;
  fromUnits: number;
  toUnits: number;
}

export interface Settings {
  lowStockThreshold: number; // fraction of capacity
  fastMoverThreshold: number; // × normal
  soundAlerts: boolean;
  pushCritical: boolean;
  dailySummary: boolean;
}

export interface DayPoint {
  date: string; // ISO yyyy-mm-dd
  label: string; // "Mon 5"
  availability: number; // % products on shelf (shelf health)
  fill: number; // % of shelf capacity filled
  outOfStock: number;
  refillMinutes: number;
}

export type PageId =
  | "overview"
  | "monitor"
  | "inventory"
  | "refill"
  | "fast"
  | "health"
  | "analytics"
  | "model"
  | "alerts"
  | "settings";
