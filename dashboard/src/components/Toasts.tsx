import { CheckCircle2, Info, X } from "lucide-react";
import { useState } from "react";
import { useStore } from "../state/StoreContext";

export function Toasts() {
  const { toasts, dismissToast: remove } = useStore();
  const [closing, setClosing] = useState<number[]>([]);
  const dismissToast = (id: number) => { setClosing((c) => [...c, id]); setTimeout(() => remove(id), 200); };
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[70] flex flex-col items-center gap-2 px-3 sm:bottom-6 sm:items-start sm:px-6 lg:left-64" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={(closing.includes(t.id) ? "toast-out" : "toast-in") + " pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-line bg-surface p-3.5 shadow-lift"}>
          {t.tone === "success" ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-ok" /> : <Info className="mt-0.5 h-5 w-5 shrink-0 text-fast" />}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">{t.title}</p>
            {t.body && <p className="mt-0.5 text-[13px] text-ink2">{t.body}</p>}
          </div>
          {t.undo && (
            <button onClick={() => { t.undo!(); dismissToast(t.id); }} className="rounded-lg px-2 py-1 text-sm font-semibold text-teal hover:bg-tealsoft">
              Undo
            </button>
          )}
          <button onClick={() => dismissToast(t.id)} className="rounded-lg p-1 text-ink3 hover:bg-sunken" aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
