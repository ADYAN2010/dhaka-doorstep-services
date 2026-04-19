import { BadgeCheck, MapPin, Star, Users } from "lucide-react";
import { AnimatedCounter } from "./animated-counter";

type Variant = "default" | "muted" | "onDark";

const STATS = [
  {
    icon: Users,
    value: 12480,
    label: "Bookings completed",
    format: (n: number) => `${n.toLocaleString()}+`,
  },
  {
    icon: BadgeCheck,
    value: 1240,
    label: "Verified providers",
    format: (n: number) => `${n.toLocaleString()}+`,
  },
  {
    icon: MapPin,
    value: 11,
    label: "Areas in Dhaka",
    format: (n: number) => `${n}`,
  },
  {
    icon: Star,
    value: 49,
    label: "Avg. customer rating",
    // 49 → 4.9★
    format: (n: number) => `${(n / 10).toFixed(1)}★`,
  },
];

/**
 * A reusable "live stats" trust strip with animated counters.
 * Renders cleanly on light, muted, and dark backgrounds.
 */
export function TrustStrip({ variant = "default" }: { variant?: Variant }) {
  const wrapper =
    variant === "onDark"
      ? "border-white/15 bg-white/5 text-white backdrop-blur"
      : variant === "muted"
        ? "border-border bg-surface text-foreground"
        : "border-border bg-card text-foreground";

  const labelClass =
    variant === "onDark" ? "text-white/70" : "text-muted-foreground";

  const iconClass = variant === "onDark" ? "text-primary-glow" : "text-primary";

  return (
    <div
      className={`grid grid-cols-2 gap-px overflow-hidden rounded-2xl border ${wrapper} sm:grid-cols-4`}
    >
      {STATS.map((s) => (
        <div
          key={s.label}
          className={`flex flex-col items-center justify-center gap-1.5 px-4 py-5 sm:py-6 ${
            variant === "onDark" ? "bg-white/0" : "bg-card"
          }`}
        >
          <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
            variant === "onDark" ? "bg-white/10" : "bg-primary/10"
          } ${iconClass}`}>
            <s.icon className="h-4 w-4" />
          </span>
          <AnimatedCounter
            value={s.value}
            format={s.format}
            className="text-xl font-bold tracking-tight md:text-2xl"
          />
          <p className={`text-center text-[11px] font-medium uppercase tracking-wide ${labelClass}`}>
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
}
