import { CATEGORY } from "../lib/categories";
import type { Category } from "../types";

export function CategoryChip({ category }: { category: Category }) {
  const c = CATEGORY[category];
  const Icon = c.icon;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: `${c.color}1a`, color: c.color }}>
      <Icon className="h-3.5 w-3.5" /> {category}
    </span>
  );
}
