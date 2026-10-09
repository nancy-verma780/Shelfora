import { useCountUp } from "../hooks/useCountUp";

/** Animated ring gauge for shelf health. */
export function HealthRing({ value, size = 132 }: { value: number; size?: number }) {
  const v = useCountUp(value, 1100);
  const r = 52, c = 2 * Math.PI * r;
  const tone = value >= 85 ? "rgb(var(--teal))" : value >= 75 ? "rgb(var(--low))" : "rgb(var(--empty))";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgb(var(--line))" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={tone} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} style={{ transition: "stroke .5s" }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="tnum font-display text-[30px] font-bold leading-none tracking-[-0.03em]">{Math.round(v)}%</p>
          <p className="mt-1 text-[11px] font-medium text-ink3">shelf health</p>
        </div>
      </div>
    </div>
  );
}
