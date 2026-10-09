import type { StockStatus } from "../types";
import { cx } from "./ui";

/**
 * A tiny shelf: front-facing pack slots sitting on a shelf edge.
 * Filled slots are what the camera can see; empty ones are gaps on the shelf.
 */
export function FacingMeter({ stock, capacity, status, slots = 8, size = "sm" }: { stock: number; capacity: number; status: StockStatus; slots?: number; size?: "sm" | "md" }) {
  const filled = stock <= 0 ? 0 : Math.max(1, Math.round((stock / capacity) * slots));
  const tone = status === "out_of_stock" ? "border-empty/50" : status === "low_stock" ? "bg-low" : "bg-teal";
  return (
    <span className="inline-flex flex-col" aria-label={`${stock} of ${capacity} units on shelf`} role="img">
      <span className={cx("flex items-end", size === "md" ? "gap-[3px]" : "gap-[2px]")}>
        {Array.from({ length: slots }, (_, i) => (
          <span
            key={i}
            className={cx(
              "rounded-[2px] transition-all duration-500",
              size === "md" ? "h-5 w-2.5" : "h-3.5 w-[7px]",
              i < filled ? tone : status === "out_of_stock" ? "border border-dashed " + tone : "bg-line",
            )}
            style={{ transitionDelay: `${i * 30}ms` }}
          />
        ))}
      </span>
      <span className="mt-[2px] h-[2px] rounded-full bg-ink3/40" />
    </span>
  );
}
