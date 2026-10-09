import { CornerDownLeft, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "../state/StoreContext";
import { NAV } from "./Sidebar";
import { StatusBadge } from "./StatusBadge";
import { ProductThumb } from "./ProductThumb";

import { cx } from "./ui";

/** ⌘K / Ctrl+K: jump to any product or page without leaving the keyboard. */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { products, go, openProduct } = useStore();
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => { if (open) { setQ(""); setI(0); setTimeout(() => input.current?.focus(), 10); } }, [open]);

  const results = useMemo(() => {
    const n = q.trim().toLowerCase();
    const pages = NAV.filter((x) => !n || x.label.toLowerCase().includes(n)).map((x) => ({ kind: "page" as const, id: x.id, label: x.label, icon: x.icon }));
    const prods = products
      .filter((p) => n && (p.name.toLowerCase().includes(n) || p.shelf.toLowerCase() === n || p.category.toLowerCase().includes(n)))
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 8)
      .map((p) => ({ kind: "product" as const, id: p.id, label: p.name, p }));
    return n ? [...prods, ...pages] : [...pages, ...products.filter((p) => p.priorityScore >= 80).map((p) => ({ kind: "product" as const, id: p.id, label: p.name, p }))];
  }, [q, products]);

  useEffect(() => { setI(0); }, [q]);
  useEffect(() => { listRef.current?.querySelector(`[data-i="${i}"]`)?.scrollIntoView({ block: "nearest" }); }, [i]);

  if (!open) return null;
  const choose = (r: (typeof results)[number]) => {
    onClose();
    if (r.kind === "page") go(r.id);
    else openProduct(r.id);
  };
  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center px-3 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Search">
      <div className="scrim-in absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="palette-in relative w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-lift">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="h-4 w-4 text-ink3" />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setI((x) => Math.min(results.length - 1, x + 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setI((x) => Math.max(0, x - 1)); }
              if (e.key === "Enter" && results[i]) choose(results[i]);
              if (e.key === "Escape") onClose();
            }}
            placeholder="Find a product, rack or page…"
            className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink3 focus-visible:outline-none"
          />
          <kbd className="rounded-md border border-line px-1.5 py-0.5 text-[11px] text-ink3">Esc</kbd>
        </div>
        <ul ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
          {!q && <li className="px-3 pb-1 pt-2 text-xs text-ink3">Pages, then what needs a refill now</li>}
          {results.length === 0 && <li className="px-3 py-8 text-center text-sm text-ink3">Nothing matches “{q}”.</li>}
          {results.map((r, idx) => (
            <li key={r.kind + r.id}>
              <button
                data-i={idx}
                onMouseMove={() => setI(idx)}
                onClick={() => choose(r)}
                className={cx("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-100", idx === i ? "bg-tealsoft" : "")}
              >
                {r.kind === "page" ? (
                  <><r.icon className="h-4 w-4 text-ink3" /><span className="flex-1 text-sm font-medium">{r.label}</span><span className="text-xs text-ink3">Page</span></>
                ) : (
                  <>
                    <ProductThumb p={r.p} size={34} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{r.label}</span>
                      <span className="block text-xs text-ink3">{r.p.category} · Rack {r.p.shelf} · priority {r.p.priorityScore}</span>
                    </span>
                    <StatusBadge status={r.p.stockStatus} />
                  </>
                )}
                {idx === i && <CornerDownLeft className="h-3.5 w-3.5 text-ink3" />}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
