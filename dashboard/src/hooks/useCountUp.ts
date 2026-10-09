import { useEffect, useRef, useState } from "react";

/** Eases a number towards its new value so KPI changes are noticeable but calm. */
export function useCountUp(target: number, duration = 700): number {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    if (a === target) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setValue(target); from.current = target; return; }
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / duration);
      const e = 1 - Math.pow(1 - k, 3);
      setValue(a + (target - a) * e);
      if (k < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); from.current = target; };
  }, [target, duration]);
  return value;
}
