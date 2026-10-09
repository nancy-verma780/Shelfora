import { cameras, sections } from "../data/cameras";
import { productsInSection } from "../lib/logic";
import { useStore } from "../state/StoreContext";
import { ShelfHealthCard, healthTone } from "../components/ShelfHealthCard";
import { PageHeader } from "../components/ui";

export function ShelfHealth() {
  const { products, kpis } = useStore();
  const t = healthTone(kpis.shelfHealth);
  return (
    <div>
      <PageHeader title="Shelf Health" subtitle="See which store sections need attention." />
      <p className="mb-5 text-[15px] text-ink2">
        Store-wide, <b className={t.text}>{Math.round(kpis.shelfHealth)}%</b> of products are on the shelf right now ({kpis.total - kpis.outOfStock} of {kpis.total}).
        Health is the share of a section’s products that customers can actually find.
      </p>
      <div className="grid gap-5 md:grid-cols-2">
        {[...sections]
          .sort((a, b) => {
            const h = (id: typeof a.id) => { const ps = productsInSection(products, id); return ps.filter((p) => p.stockStatus !== "out_of_stock").length / ps.length; };
            return h(a.id) - h(b.id);
          })
          .map((s) => (
            <ShelfHealthCard key={s.id} section={s} camera={cameras.find((c) => c.id === s.camera)!} products={productsInSection(products, s.id)} />
          ))}
      </div>
    </div>
  );
}
