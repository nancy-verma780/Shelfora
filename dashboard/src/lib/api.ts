/**
 * Data access layer.
 *
 * With no store connected, every call resolves from the local sample dataset.
 * Once a Shelfora Vision server is connected (Settings → Connect your store, or VITE_API_URL),
 * the same calls go to its FastAPI endpoints. The UI only depends on these signatures.
 */
import { productRecords } from "../data/products";
import { cameras } from "../data/cameras";
import type { Camera, ProductRecord } from "../types";

const latency = (ms = 450) => new Promise((r) => setTimeout(r, ms));
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const KEY = "shelfora.apiUrl";

export interface Health { ok: boolean; mode: "demo" | "live"; store: string; products: number; cameras: (Camera & { status: string })[] }
export interface LiveEvent { seq: number; kind: string; productId: string | null; text: string; at: number }

let base: string | null = (() => {
  try { return localStorage.getItem(KEY) || (import.meta.env.VITE_API_URL as string | undefined) || null; } catch { return null; }
})();

export const backend = {
  get url() { return base; },
  set(url: string | null) {
    base = url ? url.replace(/\/+$/, "") : null;
    try { if (base) localStorage.setItem(KEY, base); else localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
  },
  frameUrl(cameraId: string, bust: number) { return base ? `${base}/cameras/${cameraId}/frame.jpg?t=${bust}` : null; },
};

async function http<T>(path: string, init?: RequestInit, url = base): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 6000);
  try {
    const r = await fetch(`${url}${path}`, { ...init, signal: ctrl.signal, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    return (await r.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

export const api = {
  /** GET /health — used when connecting a store. */
  health(url: string) { return http<Health>("/health", undefined, url.replace(/\/+$/, "")); },

  /** GET /products — latest per-product shelf observation from the vision pipeline. */
  async getProducts(): Promise<ProductRecord[]> {
    if (base) return http<ProductRecord[]>("/products");
    await latency();
    return clone(productRecords);
  },

  /** GET /cameras — connected store cameras and their stream health. */
  async getCameras(): Promise<Camera[]> {
    if (base) return http<Camera[]>("/cameras");
    await latency(150);
    return clone(cameras);
  },

  /** POST /products/:id/refill — staff confirms a shelf was refilled. */
  async markRefilled(productId: string, by: string): Promise<{ ok: true; productId: string; by: string }> {
    if (base) return http(`/products/${productId}/refill`, { method: "POST", body: JSON.stringify({ by }) });
    await latency(120);
    return { ok: true, productId, by };
  },

  /** GET /events?since= — stock changes the cameras noticed. */
  async getEvents(since: number): Promise<LiveEvent[]> {
    if (!base) return [];
    return http<LiveEvent[]>(`/events?since=${since}`);
  },

  /** POST /demo/reset — restores the server's demo store. */
  async resetDemo(): Promise<void> {
    if (base) await http("/demo/reset", { method: "POST" });
  },
};
