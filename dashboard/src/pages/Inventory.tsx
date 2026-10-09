import { Download, Search, SearchX, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useStore } from "../state/StoreContext";
import { ProductTable, sortProducts, type SortKey, type SortState } from "../components/ProductTable";
import { Button, Card, EmptyState, PageHeader, SelectFilter } from "../components/ui";
import type { Category } from "../types";

const CATEGORIES: Category[] = ["Beverages", "Snacks", "Biscuits", "Instant Food", "Dairy", "Personal Care"];

export function Inventory() {
  const { products, focusId } = useStore();
  const initialStatus = focusId?.startsWith("status:") ? focusId.slice(7) : "all";
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState(initialStatus);
  const [shelf, setShelf] = useState("all");
  const [priority, setPriority] = useState("all");
  const [sort, setSort] = useState<SortState>({ key: "priority", dir: "desc" });

  const shelves = useMemo(() => [...new Set(products.map((p) => p.shelf))].sort(), [products]);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return sortProducts(
      products.filter((p) =>
        (!needle || p.name.toLowerCase().includes(needle) || p.shelf.toLowerCase() === needle || p.category.toLowerCase().includes(needle)) &&
        (category === "all" || p.category === category) &&
        (status === "all" || p.stockStatus === status) &&
        (shelf === "all" || p.shelf === shelf) &&
        (priority === "all" || p.priorityLevel === priority),
      ),
      sort,
    );
  }, [products, q, category, status, shelf, priority, sort]);

  const active = [category, status, shelf, priority].filter((v) => v !== "all").length + (q ? 1 : 0);
  const clear = () => { setQ(""); setCategory("all"); setStatus("all"); setShelf("all"); setPriority("all"); };
  const onSort = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "name" || key === "category" || key === "shelf" || key === "status" ? "asc" : "desc" }));

  const exportCsv = () => {
    const head = ["Product", "Category", "Shelf", "Status", "Estimated stock", "Capacity", "Sales velocity", "Priority"];
    const rows = filtered.map((p) => [p.name, p.category, p.shelf, p.stockStatus, p.estimatedStock, p.shelfCapacity, p.salesVelocity, p.priorityScore]);
    const csv = [head, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    navigator.clipboard?.writeText(csv).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => undefined);
  };
  const [copied, setCopied] = useState(false);

  return (
    <div>
      <PageHeader title="Inventory" subtitle="A complete view of shelf-level product availability.">
        <Button size="sm" onClick={exportCsv}><Download className="h-4 w-4" />{copied ? "Copied as CSV" : "Copy as CSV"}</Button>
      </PageHeader>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:px-6 lg:flex-row lg:items-center">
          <label className="relative flex-1 lg:max-w-xs">
            <span className="sr-only">Search products</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink3" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search product, category or rack"
              className="h-9 w-full rounded-xl border border-line bg-surface pl-9 pr-8 text-sm outline-none placeholder:text-ink3 focus:border-teal"
            />
            {q && <button onClick={() => setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink3 hover:text-ink" aria-label="Clear search"><X className="h-3.5 w-3.5" /></button>}
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <SelectFilter label="Category" value={category} onChange={setCategory} options={[{ value: "all", label: "All categories" }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]} />
            <SelectFilter label="Status" value={status} onChange={setStatus} options={[{ value: "all", label: "Any status" }, { value: "out_of_stock", label: "Out of stock" }, { value: "low_stock", label: "Low stock" }, { value: "in_stock", label: "In stock" }]} />
            <SelectFilter label="Shelf" value={shelf} onChange={setShelf} options={[{ value: "all", label: "All shelves" }, ...shelves.map((s) => ({ value: s, label: `Rack ${s}` }))]} />
            <SelectFilter label="Priority" value={priority} onChange={setPriority} options={[{ value: "all", label: "Any priority" }, { value: "urgent", label: "Urgent" }, { value: "high", label: "High" }, { value: "medium", label: "Medium" }, { value: "low", label: "Low" }]} />
            {active > 0 && <Button size="sm" variant="ghost" onClick={clear}>Clear filters</Button>}
          </div>
          <p className="tnum text-[13px] text-ink3 lg:ml-auto">{filtered.length} of {products.length} products</p>
        </div>
        {filtered.length ? (
          <ProductTable products={filtered} sort={sort} onSort={onSort} highlight={new Set()} />
        ) : (
          <EmptyState icon={<SearchX className="h-6 w-6" />} title="No products match these filters" body="Try a different search or clear the filters to see every product on your shelves." action={<Button onClick={clear}>Clear filters</Button>} />
        )}
      </Card>
    </div>
  );
}
