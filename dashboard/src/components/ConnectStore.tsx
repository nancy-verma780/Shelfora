import { Cctv, CheckCircle2, Loader2, Plug, Unplug } from "lucide-react";
import { useState } from "react";
import { useStore } from "../state/StoreContext";
import { Button, Card, cx } from "./ui";

/** Connect the dashboard to a Shelfora Vision server running in the shop. */
export function ConnectStore() {
  const { connection, connect, disconnect } = useStore();
  const [url, setUrl] = useState(connection.url ?? "http://localhost:8000");
  const live = connection.status === "live";
  const h = connection.health;
  return (
    <Card className="overflow-hidden">
      <div className={cx("flex items-start gap-3 border-b border-line p-5", live ? "bg-oksoft/60" : "bg-sunken/50")}>
        <span className={cx("grid h-10 w-10 shrink-0 place-items-center rounded-xl", live ? "bg-ok text-white dark:text-[rgb(var(--paper))]" : "bg-surface text-ink2")}>
          {live ? <Plug className="h-5 w-5" /> : <Unplug className="h-5 w-5" />}
        </span>
        <div>
          <h2 className="font-display text-base font-bold">{live ? `Connected to ${h?.store}` : "Connect your store"}</h2>
          <p className="text-[13px] text-ink2">
            {live
              ? h?.mode === "demo" ? "Running the server's simulated shop. Swap in your camera streams to go live." : "Reading your cameras and POS in real time."
              : "Point the dashboard at the Shelfora Vision server running on your store's network."}
          </p>
        </div>
      </div>
      <div className="p-5">
        {live ? (
          <>
            <ul className="space-y-2">
              {h?.cameras.map((c) => (
                <li key={c.id} className="flex items-center gap-2.5 text-sm">
                  <Cctv className="h-4 w-4 text-ink3" />
                  <span className="flex-1 text-ink">{c.label} · {c.name}</span>
                  <span className={cx("inline-flex items-center gap-1.5 text-xs font-medium", c.status === "connected" ? "text-ok" : "text-low")}>
                    <span className={cx("h-1.5 w-1.5 rounded-full", c.status === "connected" ? "bg-ok" : "bg-low")} />{c.status}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 truncate text-xs text-ink3">{connection.url}</p>
            <Button className="mt-4" onClick={disconnect}>Disconnect</Button>
          </>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); void connect(url); }}>
            <label className="text-xs font-medium text-ink2" htmlFor="srv">Server address</label>
            <div className="mt-1.5 flex gap-2">
              <input id="srv" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="http://192.168.1.20:8000"
                className="h-10 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 text-sm outline-none focus:border-teal" />
              <Button variant="primary" type="submit" disabled={connection.status === "connecting" || !url.trim()}>
                {connection.status === "connecting" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plug className="h-4 w-4" />} Connect
              </Button>
            </div>
            {connection.status === "error" && <p className="mt-3 rounded-xl bg-lowsoft px-3 py-2 text-[13px] text-low">{connection.error}</p>}
            <ol className="mt-4 space-y-1.5 text-[13px] text-ink2">
              {["Run the server: uvicorn shelfora.api:app --host 0.0.0.0", "Add camera streams and draw shelf slots once", "Send sales from your POS to /sales"].map((t) => (
                <li key={t} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink3" />{t}</li>
              ))}
            </ol>
          </form>
        )}
      </div>
    </Card>
  );
}
