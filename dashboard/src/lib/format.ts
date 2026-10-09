export const fmtPct = (n: number, d = 0) => `${n.toFixed(d)}%`;

export function timeOfDay(ms: number, now = Date.now()): string {
  const d = new Date(ms);
  const t = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase();
  const today = new Date(now);
  const sameDay = d.toDateString() === today.toDateString();
  const y = new Date(now); y.setDate(y.getDate() - 1);
  if (sameDay) return `Today, ${t}`;
  if (d.toDateString() === y.toDateString()) return `Yesterday, ${t}`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + `, ${t}`;
}

export function ago(minutes: number): string {
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${Math.round(minutes)} min ago`;
  const h = Math.floor(minutes / 60);
  return h === 1 ? "1 hour ago" : `${h} hours ago`;
}

export const agoMs = (ms: number, now = Date.now()) => ago((now - ms) / 60000);

export function greeting(d = new Date()): string {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export const fmtDate = (d = new Date()) =>
  d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export const plural = (n: number, one: string, many = one + "s") => `${n} ${n === 1 ? one : many}`;
