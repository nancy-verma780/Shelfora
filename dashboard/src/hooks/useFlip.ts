import { useLayoutEffect, useRef } from "react";

/**
 * FLIP animation for lists: when items reorder (a refill drops a product down the queue,
 * a new alert arrives), each row glides from its old position to its new one.
 * Children must carry a data-flip-key attribute.
 */
export function useFlip<T extends HTMLElement>(dep: unknown) {
  const ref = useRef<T>(null);
  const prev = useRef(new Map<string, DOMRect>());
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const next = new Map<string, DOMRect>();
    el.querySelectorAll<HTMLElement>("[data-flip-key]").forEach((node) => {
      const key = node.dataset.flipKey!;
      const r = node.getBoundingClientRect();
      next.set(key, r);
      const old = prev.current.get(key);
      if (reduce) return;
      if (old) {
        const dy = old.top - r.top;
        if (Math.abs(dy) > 1) {
          node.animate([{ transform: `translateY(${dy}px)` }, { transform: "translateY(0)" }], { duration: 420, easing: "cubic-bezier(.2,.8,.2,1)" });
        }
      } else if (prev.current.size) {
        node.animate([{ opacity: 0, transform: "translateY(-6px)" }, { opacity: 1, transform: "none" }], { duration: 320, easing: "ease-out" });
      }
    });
    prev.current = next;
  }, [dep]);
  return ref;
}
