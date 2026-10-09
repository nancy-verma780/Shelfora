import type { DayPoint } from "../types";

/**
 * 30 days of daily store snapshots (end-of-day). Today's point is appended live
 * from the current shelf state, so the trend always ends at what the dashboard shows.
 */
const availability = [
  84.6, 85.1, 86.0, 85.4, 84.2, 83.9, 85.7, 86.4, 87.1, 86.3,
  85.0, 84.1, 83.5, 84.8, 85.9, 86.6, 85.2, 84.4, 83.0, 82.6,
  84.0, 85.3, 86.1, 85.0, 83.8, 82.9, 82.1, 82.4, 83.2,
];
const fill = [
  52, 53, 55, 54, 51, 50, 53, 55, 56, 54,
  53, 51, 50, 52, 54, 55, 53, 52, 49, 48,
  51, 53, 54, 53, 51, 49, 46, 47, 45,
];
const outOfStock = [
  15, 14, 13, 14, 15, 16, 14, 13, 12, 13,
  14, 15, 16, 14, 13, 13, 14, 15, 16, 17,
  15, 14, 13, 14, 15, 16, 17, 17, 16,
];
const refillMinutes = [
  31, 29, 30, 28, 27, 29, 26, 25, 27, 24,
  25, 23, 24, 22, 23, 21, 22, 21, 20, 22,
  21, 19, 20, 19, 18, 19, 18, 17, 18,
];

export function buildHistory(today: Date): DayPoint[] {
  return availability.map((a, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (availability.length - i));
    return {
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
      availability: a,
      fill: fill[i],
      outOfStock: outOfStock[i],
      refillMinutes: refillMinutes[i],
    };
  });
}

export const OPEN_HOURS = 14;

/**
 * Units sold per day over the last 7 days, ramping from the product's normal day
 * to today's velocity. Today's bar equals normalRate × velocity × open hours.
 */
export function velocitySeries(normalRate: number, velocity: number): number[] {
  const normalDay = normalRate * OPEN_HOURS;
  const ramp = [0.02, 0.06, 0.15, 0.32, 0.55, 0.8, 1];
  const wobble = [1.0, 0.97, 1.03, 0.99, 1.02, 0.98, 1];
  return ramp.map((r, i) => Math.round(normalDay * (1 + (velocity - 1) * r) * wobble[i]));
}
