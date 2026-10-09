import { BellOff, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useStore } from "../state/StoreContext";
import { AlertCard, ResolvedRow } from "../components/AlertCard";
import { useRefillWithExit } from "../components/RefillQueue";
import { Card, EmptyState, PageHeader, Segmented } from "../components/ui";
import { useFlip } from "../hooks/useFlip";

type Tab = "all" | "critical" | "high" | "medium" | "resolved";

export function Alerts() {
  const { alerts, resolved } = useStore();
  const { leaving, refill } = useRefillWithExit();
  const [tab, setTab] = useState<Tab>("all");
  const count = (s: Tab) => (s === "all" ? alerts.length : s === "resolved" ? resolved.length : alerts.filter((a) => a.severity === s).length);
  const list = tab === "all" ? alerts : alerts.filter((a) => a.severity === tab);
  const leavingAlert = (productId: string) => leaving === productId;
  const listRef = useFlip<HTMLUListElement>(list.map((a) => a.id).join());

  return (
    <div>
      <PageHeader title="Alerts" subtitle={alerts.length ? "Things on your shelves that changed and might need you." : "Your shelves are looking good."} />
      <div className="mb-5">
        <Segmented<Tab>
          label="Alert severity"
          value={tab}
          onChange={setTab}
          options={(["all", "critical", "high", "medium", "resolved"] as Tab[]).map((t) => ({ value: t, label: t === "all" ? "All active" : t[0].toUpperCase() + t.slice(1), count: count(t) }))}
        />
      </div>

      {tab === "resolved" ? (
        resolved.length ? (
          <Card className="p-2"><ul>{resolved.map((r) => <ResolvedRow key={r.id} alert={r} />)}</ul></Card>
        ) : (
          <Card><EmptyState icon={<CheckCircle2 className="h-6 w-6" />} title="Nothing resolved yet" body="Alerts you resolve or refill will show up here." /></Card>
        )
      ) : list.length ? (
        <ul ref={listRef} className="space-y-3">
          {list.map((a) => <AlertCard key={a.id} alert={a} leaving={leavingAlert(a.productId)} onRefill={refill} />)}
        </ul>
      ) : (
        <Card><EmptyState icon={<BellOff className="h-6 w-6" />} title="No active alerts" body="Your shelves are looking good." /></Card>
      )}
    </div>
  );
}
