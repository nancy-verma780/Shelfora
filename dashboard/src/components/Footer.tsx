import { SITE } from "../data/site";
import { useStore } from "../state/StoreContext";

/** Site footer with legal links. Plain text links, no decoration. */
export function Footer() {
  const { go } = useStore();
  const link = "text-ink2 underline-offset-2 hover:text-ink hover:underline";
  return (
    <footer className="mt-16 border-t border-line pt-6 text-[13px] text-ink3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 {SITE.name}. A student prototype by {SITE.team}.</p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Legal">
          <a href="/terms" className={link} onClick={(e) => { e.preventDefault(); go("terms"); }}>Terms and Conditions</a>
          <a href="/privacy" className={link} onClick={(e) => { e.preventDefault(); go("privacy"); }}>Privacy Policy</a>
          <a href={SITE.github} className={link} target="_blank" rel="noreferrer">Source code</a>
        </nav>
      </div>
    </footer>
  );
}

/** States plainly that the dashboard shows sample figures, unless a real store server is connected. */
export function DemoNotice() {
  const { connection, page, go } = useStore();
  if (connection.status === "live" || page === "terms" || page === "privacy") return null;
  return (
    <div className="mb-6 flex flex-col gap-2 rounded-lg border border-line bg-surface px-4 py-3 text-[13px] text-ink2 sm:flex-row sm:items-center sm:justify-between">
      <p><b className="font-semibold text-ink">Demo store.</b> Products, stock levels, sales and trends on this site are sample data, not figures from a real store.</p>
      <button onClick={() => go("terms")} className="shrink-0 text-left font-medium text-teal hover:underline">Read more</button>
    </div>
  );
}
