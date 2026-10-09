import { productRecords } from "../data/products";
import { LogoMark } from "./Logo";
import { StorefrontArt } from "./StorefrontArt";

const pick = (rack: string) => productRecords.filter((p) => p.shelf === rack).slice(0, 7).map((p) => ({ ...p, stockStatus: p.estimatedStock === 0 ? "out_of_stock" : "in_stock" }));

/** First load: the shop "opens" while the latest shelf readings arrive. */
export function Splash() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <StorefrontArt rows={[pick("B3"), pick("A2"), pick("C1"), pick("P1")]} animate className="float-in w-full max-w-[420px]" />
      <div className="mt-6 flex items-center gap-2">
        <LogoMark size={26} />
        <p className="font-display text-lg font-bold">Opening your store…</p>
      </div>
      <p className="mt-1 text-sm text-ink3">Reading the latest view from 4 shelf cameras</p>
    </div>
  );
}
