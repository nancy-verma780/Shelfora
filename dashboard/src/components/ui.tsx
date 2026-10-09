import { useLayoutEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export function Card({ className, children, as: As = "section" }: { className?: string; children: ReactNode; as?: "section" | "div" | "article" }) {
  return <As className={cx("rounded-2xl border border-line bg-surface shadow-card", className)}>{children}</As>;
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md" };
export function Button({ variant = "secondary", size = "md", className, children, ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      className={cx(
        "press inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl font-medium disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "h-8 px-3 text-[13px]" : "h-10 px-4 text-sm",
        variant === "primary" && "bg-teal text-white hover:bg-tealink dark:text-[rgb(var(--paper))]",
        variant === "secondary" && "border border-line bg-surface text-ink hover:bg-sunken",
        variant === "ghost" && "text-ink2 hover:bg-sunken hover:text-ink",
        variant === "danger" && "border border-line bg-surface text-empty hover:bg-emptysoft",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-[26px] font-bold leading-tight tracking-[-0.02em] text-ink sm:text-[30px]">{title}</h1>
        <p className="mt-1 text-[15px] text-ink2">{subtitle}</p>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-tealsoft text-teal">{icon}</div>
      <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-ink2">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("skeleton", className)} />;
}

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string; count?: number }[]; onChange: (v: T) => void; label: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [ind, setInd] = useState<{ x: number; w: number } | null>(null);
  useLayoutEffect(() => {
    const el = wrap.current?.querySelector<HTMLElement>(`[data-seg="${value}"]`);
    if (el) setInd({ x: el.offsetLeft, w: el.offsetWidth });
  }, [value, options.map((o) => o.count).join()]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div ref={wrap} role="tablist" aria-label={label} className="thin-scroll relative flex max-w-full gap-1 overflow-x-auto rounded-xl bg-sunken p-1">
      {ind && <span aria-hidden className="slide-ind absolute bottom-1 top-1 rounded-lg bg-surface shadow-card" style={{ transform: `translateX(${ind.x - 4}px)`, width: ind.w, left: 4 }} />}
      {options.map((o) => (
        <button
          key={o.value}
          data-seg={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            "relative z-10 flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-colors duration-200",
            value === o.value ? "text-ink" : "text-ink2 hover:text-ink",
          )}
        >
          {o.label}
          {o.count !== undefined && <span className={cx("tnum rounded-md px-1.5 text-[11px] transition-colors", value === o.value ? "bg-sunken text-ink2" : "text-ink3")}>{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function SelectFilter({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="relative inline-flex">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cx(
          "h-9 appearance-none rounded-xl border bg-surface pl-3 pr-8 text-[13px] font-medium outline-none transition-colors hover:bg-sunken",
          value === "all" ? "border-line text-ink2" : "border-teal/40 text-tealink",
        )}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <svg className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
    </label>
  );
}
