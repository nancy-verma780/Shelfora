import { ArrowDown, ArrowUp, ChevronsUpDown, PackageCheck } from "lucide-react";
import { ago } from "../lib/format";
import { useStore } from "../state/StoreContext";
import type { Product } from "../types";
import { FacingMeter } from "./FacingMeter";
import { ProductThumb } from "./ProductThumb";
import { CategoryChip } from "./CategoryChip";

import { PriorityBadge, StatusBadge, VelocityPill } from "./StatusBadge";
import { Button, cx } from "./ui";

export type SortKey = "name" | "category" | "shelf" | "status" | "stock" | "velocity" | "priority" | "detected";
export interface SortState { key: SortKey; dir: "asc" | "desc" }

const STATUS_RANK = { out_of_stock: 0, low_stock: 1, in_stock: 2 };

export function sortProducts(ps: Product[], s: SortState): Product[] {
  const m = s.dir === "asc" ? 1 : -1;
  const val = (p: Product): number | string => {
    switch (s.key) {
      case "name": return p.name;
      case "category": return p.category;
      case "shelf": return p.shelf;
      case "status": return STATUS_RANK[p.stockStatus];
      case "stock": return p.estimatedStock / p.shelfCapacity;
      case "velocity": return p.salesVelocity;
      case "priority": return p.priorityScore;
      case "detected": return p.lastDetectedMin;
    }
  };
  return [...ps].sort((a, b) => {
    const x = val(a), y = val(b);
    const c = typeof x === "string" ? x.localeCompare(y as string) : (x as number) - (y as number);
    return c * m || a.name.localeCompare(b.name);
  });
}

const COLS: { key: SortKey | null; label: string; cls?: string }[] = [
  { key: "name", label: "Product" },
  { key: "category", label: "Category" },
  { key: "shelf", label: "Shelf" },
  { key: "status", label: "Status" },
  { key: "stock", label: "Estimated stock" },
  { key: "velocity", label: "Sales velocity" },
  { key: "priority", label: "Priority" },
  { key: "detected", label: "Last detected" },
  { key: null, label: "Action", cls: "text-right" },
];

export function ProductTable({ products, sort, onSort, highlight }: { products: Product[]; sort: SortState; onSort: (k: SortKey) => void; highlight: Set<string> }) {
  const { openProduct, refill, settings } = useStore();
  return (
    <>
      {/* Desktop / tablet table */}
      <div className="thin-scroll hidden overflow-x-auto md:block">
        <table className="w-full min-w-[1120px] text-left text-sm">
          <thead>
            <tr className="border-b border-line">
              {COLS.map((c) => (
                <th key={c.label} scope="col" className={cx("whitespace-nowrap px-4 py-3 text-xs font-medium text-ink3 first:pl-6 last:pr-6", c.cls)}>
                  {c.key ? (
                    <button onClick={() => onSort(c.key!)} className="inline-flex items-center gap-1 hover:text-ink" aria-sort={sort.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
                      {c.label}
                      {sort.key === c.key ? (sort.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ChevronsUpDown className="h-3 w-3 opacity-50" />}
                    </button>
                  ) : c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr
                key={p.id}
                onClick={() => openProduct(p.id)}
                className={cx("cursor-pointer border-b border-line/70 transition-colors last:border-0 hover:bg-sunken/60", highlight.has(p.id) && "settle")}
              >
                <td className="py-2.5 pl-6 pr-4">
                  <div className="flex items-center gap-3"><ProductThumb p={p} size={36} /><p className="whitespace-nowrap font-semibold text-ink">{p.name}</p></div>
                </td>
                <td className="whitespace-nowrap px-4 py-3"><CategoryChip category={p.category} /></td>
                <td className="tnum px-4 py-3 font-medium text-ink2">{p.shelf}</td>
                <td className="px-4 py-3"><StatusBadge status={p.stockStatus} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <FacingMeter stock={p.estimatedStock} capacity={p.shelfCapacity} status={p.stockStatus} />
                    <span className="tnum text-ink2"><b className="font-semibold text-ink">{p.estimatedStock}</b>/{p.shelfCapacity}</span>
                  </div>
                </td>
                <td className="px-4 py-3"><VelocityPill v={p.salesVelocity} threshold={settings.fastMoverThreshold} /></td>
                <td className="px-4 py-3"><PriorityBadge level={p.priorityLevel} score={p.priorityScore} /></td>
                <td className="whitespace-nowrap px-4 py-3 text-ink3">{p.lastDetectedMin === 0 ? "Just now" : ago(p.lastDetectedMin)}</td>
                <td className="py-3 pl-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                  {p.stockStatus !== "in_stock" ? (
                    <Button size="sm" variant={p.stockStatus === "out_of_stock" ? "primary" : "secondary"} onClick={() => refill(p.id)}>
                      <PackageCheck className="h-3.5 w-3.5" /> Refilled
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => openProduct(p.id)}>View</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phone cards */}
      <ul className="divide-y divide-line md:hidden">
        {products.map((p) => (
          <li key={p.id} className={cx(highlight.has(p.id) && "settle")}>
            <button onClick={() => openProduct(p.id)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
              <ProductThumb p={p} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{p.name}</p>
                <p className="text-xs text-ink3">{p.category} · Rack {p.shelf}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge status={p.stockStatus} />
                  <VelocityPill v={p.salesVelocity} threshold={settings.fastMoverThreshold} />
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <PriorityBadge level={p.priorityLevel} score={p.priorityScore} />
                <FacingMeter stock={p.estimatedStock} capacity={p.shelfCapacity} status={p.stockStatus} slots={6} />
              </div>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
