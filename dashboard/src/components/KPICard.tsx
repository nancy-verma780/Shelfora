import type { LucideIcon } from "lucide-react";
import { useCountUp } from "../hooks/useCountUp";
import { cx } from "./ui";

interface Props {
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  unit?: string;
  note: string;
  noteTone?: "red" | "amber" | "blue" | "green" | "plain";
  icon: LucideIcon;
  iconTone?: "red" | "amber" | "blue" | "teal";
  onClick?: () => void;
}

const tones = {
  red: "text-empty", amber: "text-low", blue: "text-fast", green: "text-ok", plain: "text-ink2", teal: "text-teal",
};
const iconBg = { red: "bg-emptysoft text-empty", amber: "bg-lowsoft text-low", blue: "bg-fastsoft text-fast", teal: "bg-tealsoft text-teal" };

export function KPICard({ label, value, decimals = 0, suffix, unit, note, noteTone = "plain", icon: Icon, iconTone = "teal", onClick }: Props) {
  const v = useCountUp(value);
  return (
    <button
      onClick={onClick}
      className="group flex flex-col rounded-2xl border border-line bg-surface p-4 text-left shadow-card transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-lift sm:p-5"
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-ink2">{label}</span>
        <span className={cx("grid h-8 w-8 place-items-center rounded-lg", iconBg[iconTone])}>
          <Icon className="h-4 w-4" strokeWidth={2.2} />
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="tnum font-display text-[32px] font-bold leading-none tracking-[-0.03em] text-ink sm:text-[36px]">
          {v.toFixed(decimals)}{suffix}
        </span>
        {unit && <span className="text-sm text-ink3">{unit}</span>}
      </div>
      <p className={cx("mt-2 text-[13px] font-medium", tones[noteTone])}>{note}</p>
    </button>
  );
}
