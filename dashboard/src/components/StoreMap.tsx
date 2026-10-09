import { cameras, sections } from "../data/cameras";
import { productsInSection, zoneStats } from "../lib/logic";
import { useStore } from "../state/StoreContext";
import type { Product, SectionId } from "../types";

/**
 * Floor plan of the shop. Each aisle shows its racks as rows of product cells,
 * coloured by what the cameras see, so a manager can tell where to walk first.
 */
const LAYOUT: Record<SectionId, { x: number; y: number; w: number; h: number; cam: [number, number, number] }> = {
  beverages: { x: 18, y: 26, w: 128, h: 92, cam: [18, 22, 45] },
  snacks: { x: 174, y: 26, w: 128, h: 92, cam: [302, 22, 135] },
  dairy: { x: 18, y: 148, w: 128, h: 64, cam: [18, 214, -45] },
  personal: { x: 174, y: 148, w: 128, h: 64, cam: [302, 214, -135] },
};
const CELL = { out_of_stock: "rgb(var(--empty))", low_stock: "rgb(var(--low))", in_stock: "rgb(var(--teal) / 0.32)" };

export function StoreMap({ highlightId, compact }: { highlightId?: string; compact?: boolean }) {
  const { products, go } = useStore();
  return (
    <svg viewBox="0 0 320 270" className="w-full" role="img" aria-label="Store floor plan with shelf status by aisle">
      <rect x="4" y="8" width="312" height="256" rx="14" fill="rgb(var(--sunken))" />
      {/* checkout and entrance */}
      <rect x="40" y="232" width="70" height="14" rx="4" fill="rgb(var(--line))" />
      <rect x="120" y="232" width="70" height="14" rx="4" fill="rgb(var(--line))" />
      <text x="114" y="243" textAnchor="middle" fontSize="8" fill="rgb(var(--ink3))">Billing</text>
      <path d="M232 264 v-10 h50 v10" fill="none" stroke="rgb(var(--ink3))" strokeWidth="1.2" strokeDasharray="3 3" />
      <text x="257" y="250" textAnchor="middle" fontSize="8" fill="rgb(var(--ink3))">Entrance</text>
      {sections.map((s) => {
        const L = LAYOUT[s.id];
        const ps = productsInSection(products, s.id);
        const z = zoneStats(ps);
        const cam = cameras.find((c) => c.id === s.camera)!;
        const racks = cam.racks;
        const rowH = (L.h - 20) / racks.length;
        const urgent = highlightId ? ps.filter((p) => p.id === highlightId) : ps.filter((p) => p.priorityScore >= 80);
        const dim = !!highlightId && !ps.some((p) => p.id === highlightId);
        return (
          <g key={s.id} className="cursor-pointer" style={{ opacity: dim ? 0.35 : 1, transition: "opacity .4s" }} onClick={() => !compact && go("monitor", { camera: cam.id })} role="button" aria-label={`${s.name}, ${Math.round(z.health)}% healthy`}>
            <rect x={L.x - 4} y={L.y - 4} width={L.w + 8} height={L.h + 8} rx="9" fill="rgb(var(--surface))" stroke="rgb(var(--line))" />
            <text x={L.x} y={L.y + 8} fontSize="9.5" fontWeight="700" fill="rgb(var(--ink))">{s.name}</text>
            <text x={L.x + L.w} y={L.y + 8} fontSize="9.5" fontWeight="700" textAnchor="end" fill={z.health >= 85 ? "rgb(var(--ok))" : "rgb(var(--low))"}>{Math.round(z.health)}%</text>
            {racks.map((r, ri) => {
              const items = ps.filter((p) => p.shelf === r);
              const cw = L.w / items.length;
              return items.map((p: Product, i) => (
                <rect key={p.id} x={L.x + i * cw + 0.6} y={L.y + 16 + ri * rowH} width={cw - 1.2} height={rowH - 3} rx="1.5" fill={CELL[p.stockStatus]} style={{ transition: "fill .6s" }}>
                  <title>{p.name}: {p.stockStatus.replace(/_/g, " ")}</title>
                </rect>
              ));
            })}
            {urgent.map((p) => {
              const ri = racks.indexOf(p.shelf);
              const items = ps.filter((x) => x.shelf === p.shelf);
              const i = items.findIndex((x) => x.id === p.id);
              const cw = L.w / items.length;
              const cx = L.x + i * cw + cw / 2, cy = L.y + 16 + ri * rowH + (rowH - 3) / 2;
              return (
                <g key={p.id + "-pulse"}>
                  <circle cx={cx} cy={cy} r="6" fill="rgb(var(--empty))" opacity="0.35" className="map-pulse" style={{ transformOrigin: `${cx}px ${cy}px` }} />
                  <circle cx={cx} cy={cy} r="2.4" fill="rgb(var(--empty))" stroke="rgb(var(--surface))" strokeWidth="1" />
                </g>
              );
            })}
            {/* camera and its field of view */}
            <g transform={`translate(${L.cam[0]} ${L.cam[1]}) rotate(${L.cam[2]})`}>
              <path d="M0 0 L26 -9 L26 9 Z" fill="rgb(var(--teal))" opacity="0.12" />
              <rect x="-4" y="-3" width="8" height="6" rx="1.5" fill="rgb(var(--teal))" />
            </g>
          </g>
        );
      })}
    </svg>
  );
}
