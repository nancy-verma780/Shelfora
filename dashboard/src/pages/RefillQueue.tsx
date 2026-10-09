import { CheckCircle2, ChevronDown } from "lucide-react";
import { useState } from "react";
import { byPriority, PRIORITY_WEIGHTS } from "../lib/logic";
import { useStore } from "../state/StoreContext";
import { RefillRow, useRefillWithExit } from "../components/RefillQueue";
import { Card, EmptyState, PageHeader, cx } from "../components/ui";
import { useFlip } from "../hooks/useFlip";
import type { Product } from "../types";

function FlipList({ items, start, leaving, onRefill }: { items: Product[]; start: number; leaving: string | null; onRefill: (id: string) => void }) {
  const ref = useFlip<HTMLUListElement>(items.map((p) => p.id).join());
  return (
    <ul ref={ref} className="divide-y divide-line">
      {items.map((p, i) => <RefillRow key={p.id} p={p} rank={start + i + 1} variant="queue" leaving={leaving === p.id} onRefill={onRefill} />)}
    </ul>
  );
}

export function RefillQueuePage() {
  const { products, tasks } = useStore();
  const { leaving, refill } = useRefillWithExit();
  const [showLater, setShowLater] = useState(false);
  const queue = products.filter((p) => p.stockStatus !== "in_stock").sort(byPriority);
  const groups = [
    { id: "now", title: "Refill now", note: "Empty or about to be, and selling. Every minute here is a missed sale.", items: queue.filter((p) => p.priorityScore >= 80) },
    { id: "soon", title: "Refill soon", note: "Running out within the next couple of hours.", items: queue.filter((p) => p.priorityScore >= 60 && p.priorityScore < 80) },
    { id: "later", title: "Can wait", note: "Below the shelf threshold, but demand is steady.", items: queue.filter((p) => p.priorityScore < 60) },
  ];
  const inProgress = Object.keys(tasks).length;
  const starts: Record<string, number> = { now: 0, soon: groups[0].items.length, later: groups[0].items.length + groups[1].items.length };

  return (
    <div>
      <PageHeader title="Refill Queue" subtitle="Prioritized by stock level and sales velocity.">
        <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-ink2">
          Priority = {PRIORITY_WEIGHTS.stockRisk * 100}% stock level + {PRIORITY_WEIGHTS.velocity * 100}% selling speed + {PRIORITY_WEIGHTS.timeToEmpty * 100}% time to empty
        </span>
      </PageHeader>

      <div className="mb-5 grid grid-cols-3 gap-3">
        {[
          { k: "Refill now", v: groups[0].items.length, c: "text-empty" },
          { k: "Refill soon", v: groups[1].items.length, c: "text-low" },
          { k: "Being restocked", v: inProgress, c: "text-fast" },
        ].map((s) => (
          <Card key={s.k} className="p-4" as="div">
            <p className="tnum font-display text-2xl font-bold"><span className={s.c}>{s.v}</span></p>
            <p className="text-[13px] text-ink2">{s.k}</p>
          </Card>
        ))}
      </div>

      {queue.length === 0 ? (
        <Card><EmptyState icon={<CheckCircle2 className="h-6 w-6" />} title="All caught up" body="Nothing needs immediate attention right now." /></Card>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => {
            const collapsed = g.id === "later" && !showLater;
            return (
              <Card key={g.id} className="overflow-hidden">
                <button
                  disabled={g.id !== "later"}
                  onClick={() => setShowLater((s) => !s)}
                  className="flex w-full items-end justify-between gap-3 border-b border-line px-5 py-4 text-left sm:px-6"
                >
                  <div>
                    <h2 className="font-display text-lg font-bold">{g.title} <span className="tnum ml-1 text-base font-semibold text-ink3">{g.items.length}</span></h2>
                    <p className="text-[13px] text-ink2">{g.note}</p>
                  </div>
                  {g.id === "later" && <ChevronDown className={cx("h-5 w-5 text-ink3 transition-transform", !collapsed && "rotate-180")} />}
                </button>
                {g.items.length === 0 ? (
                  <p className="px-6 py-6 text-sm text-ink3">{g.id === "now" ? "Nothing urgent. Nice work." : "Nothing here right now."}</p>
                ) : collapsed ? null : (
                  <FlipList items={g.items} start={starts[g.id]} leaving={leaving} onRefill={refill} />
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
