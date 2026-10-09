import type { ActivityEntry, ResolvedAlert } from "../types";

const MIN = 60_000;

/** Alerts resolved earlier today, before this session began. */
export function seedResolvedAlerts(now: number): ResolvedAlert[] {
  return [
    { id: "seed-1", productId: "bev-sprite-500", kind: "out", severity: "critical", title: "Sprite 500ml was out of stock", where: "Beverage Aisle · Camera 01", minutesAgo: 118, action: "Refilled", resolvedAt: now - 95 * MIN, resolution: "Refilled by Ravi in 23 min" },
    { id: "seed-2", productId: "ins-maggi-70", kind: "fast_low", severity: "high", title: "Maggi 70g was running low", where: "Snacks · Camera 02", minutesAgo: 175, action: "Refilled", resolvedAt: now - 160 * MIN, resolution: "Refilled by Priya in 15 min" },
    { id: "seed-3", productId: "snk-kitkat-37", kind: "low", severity: "medium", title: "KitKat 4 Finger was below its shelf threshold", where: "Snacks · Camera 02", minutesAgo: 230, action: "Refilled", resolvedAt: now - 210 * MIN, resolution: "Refilled by Arjun in 20 min" },
  ];
}

/** Refills completed earlier today. */
export function seedActivity(now: number): ActivityEntry[] {
  return [
    { id: "act-1", productId: "bev-sprite-500", at: now - 95 * MIN, by: "Ravi", fromUnits: 0, toUnits: 40 },
    { id: "act-2", productId: "ins-maggi-70", at: now - 160 * MIN, by: "Priya", fromUnits: 9, toUnits: 120 },
    { id: "act-3", productId: "snk-kitkat-37", at: now - 210 * MIN, by: "Arjun", fromUnits: 8, toUnits: 48 },
  ];
}
