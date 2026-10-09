import { Cookie, CupSoda, Milk, Popcorn, Soup, SprayCan, type LucideIcon } from "lucide-react";
import type { Category } from "../types";

/** Each category gets its own colour and icon, like aisle signage. */
export const CATEGORY: Record<Category, { icon: LucideIcon; color: string; aisle: number }> = {
  Beverages: { icon: CupSoda, color: "#2f7fd6", aisle: 1 },
  Snacks: { icon: Popcorn, color: "#e8861a", aisle: 2 },
  Biscuits: { icon: Cookie, color: "#b8742a", aisle: 2 },
  "Instant Food": { icon: Soup, color: "#d4532c", aisle: 2 },
  Dairy: { icon: Milk, color: "#2aa3b8", aisle: 3 },
  "Personal Care": { icon: SprayCan, color: "#c2477f", aisle: 4 },
};

export const SECTION_SIGN = {
  beverages: { aisle: 1, color: "#2f7fd6", icon: CupSoda },
  snacks: { aisle: 2, color: "#e8861a", icon: Popcorn },
  dairy: { aisle: 3, color: "#2aa3b8", icon: Milk },
  personal: { aisle: 4, color: "#c2477f", icon: SprayCan },
} as const;
