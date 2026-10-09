import type { PackShape, Product } from "../types";
import { Pack } from "./CameraFeed";
import { cx } from "./ui";

const BOX: Record<PackShape, [number, number]> = {
  bottle: [12, 30], jug: [16, 30], can: [13, 20], pack: [22, 24], box: [20, 24], carton: [15, 28],
  tub: [20, 14], tube: [12, 28], bar: [22, 13], jar: [16, 20],
};

/** A small pack illustration in the product's own colour, standing on a shelf edge. */
export function ProductThumb({ p, size = 40, className }: { p: Pick<Product, "color" | "shape" | "name" | "stockStatus">; size?: number; className?: string }) {
  const [w, h] = BOX[p.shape];
  const x = (40 - w) / 2, y = 33 - h;
  const empty = p.stockStatus === "out_of_stock";
  return (
    <span className={cx("relative inline-grid shrink-0 place-items-center overflow-hidden rounded-xl", className)} style={{ width: size, height: size, background: `${p.color}22` }} aria-hidden>
      <svg viewBox="0 0 40 40" width={size} height={size}>
        <g opacity={empty ? 0.28 : 1}>
          <Pack shape={p.shape} x={x} y={y} w={w} h={h} color={p.color} />
        </g>
        <rect x="3" y="33" width="34" height="3" rx="1.5" fill="currentColor" opacity=".18" />
        {empty && <path d="M9 30 L31 10" stroke="rgb(var(--empty))" strokeWidth="2.4" strokeLinecap="round" />}
      </svg>
    </span>
  );
}
