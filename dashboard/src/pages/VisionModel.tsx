import { ExternalLink, ScanEye, Store } from "lucide-react";
import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import model from "../data/model.json";
import { useCountUp } from "../hooks/useCountUp";
import { useStore } from "../state/StoreContext";
import { ChartCard, ChartTooltip } from "../components/ChartCard";
import { Button, Card, PageHeader, Segmented, cx } from "../components/ui";

function Metric({ label, value, base, hint }: { label: string; value: number; base?: number; hint: string }) {
  const v = useCountUp(value * 100, 1100);
  return (
    <Card className="p-5" as="div">
      <p className="text-[13px] font-medium text-ink2">{label}</p>
      <p className="tnum mt-2 font-display text-[34px] font-bold leading-none tracking-[-0.03em]">{v.toFixed(1)}<span className="text-lg text-ink3">%</span></p>
      {base !== undefined && (
        <div className="mt-3">
          <div className="relative h-1.5 overflow-hidden rounded-full bg-sunken">
            <span className="absolute inset-y-0 left-0 rounded-full bg-ink3/40" style={{ width: `${base * 100}%` }} />
            <span className="absolute inset-y-0 left-0 rounded-full bg-teal transition-[width] duration-[1100ms] ease-out" style={{ width: `${v}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-ink3">Before training: {(base * 100).toFixed(1)}%</p>
        </div>
      )}
      <p className="mt-2 text-xs text-ink2">{hint}</p>
    </Card>
  );
}

export function VisionModel() {
  const { go } = useStore();
  const [view, setView] = useState<"pred" | "truth">("pred");
  const [i, setI] = useState(0);
  const s = model.samples[i];
  const m = model.metrics, b = model.baseline;

  return (
    <div>
      <PageHeader title="Vision Model" subtitle="The detector that finds each product on a shelf, so Shelfora can count what’s left.">
        <a href={model.dataset.url} target="_blank" rel="noreferrer" className="press inline-flex h-9 items-center gap-1.5 rounded-xl border border-line bg-surface px-3 text-[13px] font-medium text-ink2 hover:bg-sunken">
          Dataset <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </PageHeader>

      <Card className="mb-6 flex flex-col gap-3 p-5 sm:flex-row sm:items-center" as="div">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-tealsoft text-teal"><ScanEye className="h-5 w-5" /></span>
        <p className="flex-1 text-sm text-ink2">
          Trained on <b className="text-ink">{model.dataset.images} real shelf photos with {model.dataset.boxes.toLocaleString("en-IN")} labelled products</b> from the {model.dataset.name}.
          Those shelves are mostly tobacco displays in Turkish shops, so this model has learned to find product facings on a shelf, not your exact items.
          Before it runs in your store, fine-tune it with labelled frames from your own cameras.
          The held-out photos come from the same shops as the training photos, so expect lower scores on new stores. <span className="text-ink3">{model.dataset.licence}.</span>
        </p>
      </Card>

      <div className="stagger grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Detection accuracy (mAP50)" value={m.map50} base={b.map50} hint="How well boxes match real products." />
        <Metric label="Precision" value={m.precision} base={b.precision} hint="Of the boxes it draws, how many are real products." />
        <Metric label="Recall" value={m.recall} base={b.recall} hint="Of the real products, how many it finds." />
        <Metric label="Strict accuracy (mAP50-95)" value={m.map} base={b.map} hint="Rewards tight boxes; the toughest score." />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div>
              <h2 className="font-display text-base font-bold">On shelves it has never seen</h2>
              <p className="text-[13px] text-ink2">Held-out photos the model didn’t train on.{s.found > s.labelled && " Extra boxes are mostly packs cut off at the photo’s edge, which the labellers skipped."}</p>
            </div>
            <Segmented label="Overlay" value={view} onChange={setView} options={[{ value: "pred", label: "Model" }, { value: "truth", label: "Human labels" }]} />
          </div>
          <div className="relative bg-[#1a201e]">
            <img key={s.name + view} src={view === "pred" ? s.pred : s.truth} alt={`Shelf photo with ${view === "pred" ? "model detections" : "human labels"}`} className="page-in mx-auto max-h-[520px] w-auto" />
            <span className="absolute left-3 top-3 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white">
              {view === "pred" ? `Model found ${s.found}` : `People labelled ${s.labelled}`}
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto p-3 thin-scroll">
            {model.samples.map((x, idx) => (
              <button key={x.name} onClick={() => setI(idx)} className={cx("press shrink-0 overflow-hidden rounded-lg border-2 transition-colors", idx === i ? "border-teal" : "border-transparent opacity-70 hover:opacity-100")}>
                <img src={x.pred} alt="" className="h-16 w-auto" />
              </button>
            ))}
          </div>
        </Card>

        <div className="flex flex-col gap-6">
          <ChartCard title="How it learned" subtitle={`${model.epochs} training rounds on ${model.device}. Accuracy on held-out shelves after each.`}>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={model.curve} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke="rgb(var(--line))" vertical={false} />
                  <XAxis dataKey="epoch" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} />
                  <Tooltip content={<ChartTooltip fmt={(v) => `${(v * 100).toFixed(1)}%`} />} />
                  <Line type="monotone" dataKey="map50" name="mAP50" stroke="rgb(var(--teal))" strokeWidth={2.4} dot={false} animationDuration={1200} />
                  <Line type="monotone" dataKey="map" name="mAP50-95" stroke="rgb(var(--fast))" strokeWidth={2} dot={false} animationDuration={1400} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <Card className="p-5">
            <h2 className="font-display text-base font-bold">Model card</h2>
            <dl className="mt-3 space-y-2.5 text-sm">
              {[
                ["Model", model.model],
                ["Training photos", `${model.dataset.train} train / ${model.dataset.val} held out`],
                ["Image size", `${model.imgsz}px`],
                ["Speed", `${model.inferenceMs} ms per photo on one CPU core`],
                ["Trained", model.trainedAt],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4"><dt className="text-ink3">{k}</dt><dd className="text-right font-medium text-ink">{v}</dd></div>
              ))}
            </dl>
            <Button className="mt-4 w-full" onClick={() => go("settings")}><Store className="h-4 w-4" />Connect your store to use it</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
