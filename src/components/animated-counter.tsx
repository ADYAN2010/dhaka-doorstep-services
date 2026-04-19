import { useEffect, useRef, useState } from "react";

type Props = {
  value: number;
  /** Render-formatter (e.g., add suffix). Receives the live integer. */
  format?: (n: number) => string;
  /** ms */
  duration?: number;
  className?: string;
};

/**
 * Counts up from 0 to `value` once when scrolled into view.
 * Respects prefers-reduced-motion (jumps straight to final value).
 */
export function AnimatedCounter({ value, format, duration = 1400, className }: Props) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [n, setN] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setN(value);
      return;
    }
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !startedRef.current) {
            startedRef.current = true;
            const start = performance.now();
            const tick = (t: number) => {
              const p = Math.min(1, (t - start) / duration);
              // easeOutCubic
              const eased = 1 - Math.pow(1 - p, 3);
              setN(Math.round(value * eased));
              if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            obs.disconnect();
            break;
          }
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {format ? format(n) : n.toLocaleString()}
    </span>
  );
}
