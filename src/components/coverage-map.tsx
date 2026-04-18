import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { areas } from "@/data/areas";

// Hand-tuned approximate positions of Dhaka neighborhoods on a 100x100 viewBox.
// Not geographically perfect — stylized for a clean, premium look.
const POSITIONS: Record<string, { x: number; y: number }> = {
  uttara: { x: 56, y: 12 },
  mirpur: { x: 30, y: 30 },
  banani: { x: 60, y: 32 },
  gulshan: { x: 66, y: 40 },
  bashundhara: { x: 80, y: 42 },
  badda: { x: 74, y: 50 },
  mohammadpur: { x: 24, y: 50 },
  farmgate: { x: 46, y: 52 },
  dhanmondi: { x: 38, y: 60 },
  motijheel: { x: 54, y: 74 },
  "old-dhaka": { x: 42, y: 84 },
};

export function CoverageMap() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-hero p-6 md:p-10">
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />

      <div className="relative grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        {/* Map */}
        <div className="relative aspect-square w-full">
          <svg
            viewBox="0 0 100 100"
            className="h-full w-full"
            role="img"
            aria-label="Stylized map of Dhaka showing service coverage areas"
          >
            <defs>
              <radialGradient id="map-bg" cx="50%" cy="45%" r="60%">
                <stop offset="0%" stopColor="oklch(0.32 0.1 200)" stopOpacity="0.7" />
                <stop offset="100%" stopColor="oklch(0.16 0.05 235)" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="river" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="oklch(0.62 0.13 195)" stopOpacity="0.35" />
                <stop offset="100%" stopColor="oklch(0.55 0.14 210)" stopOpacity="0.15" />
              </linearGradient>
              <filter id="pin-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.2" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Background atmosphere */}
            <rect width="100" height="100" fill="url(#map-bg)" />

            {/* Subtle grid */}
            <g stroke="oklch(1 0 0 / 0.06)" strokeWidth="0.2">
              {Array.from({ length: 10 }).map((_, i) => (
                <line key={`h${i}`} x1="0" y1={i * 10} x2="100" y2={i * 10} />
              ))}
              {Array.from({ length: 10 }).map((_, i) => (
                <line key={`v${i}`} x1={i * 10} y1="0" x2={i * 10} y2="100" />
              ))}
            </g>

            {/* Buriganga / Turag river abstraction */}
            <path
              d="M 5 88 Q 25 78, 38 86 T 70 92 L 95 96 L 100 100 L 0 100 Z"
              fill="url(#river)"
            />
            <path
              d="M -2 18 Q 10 28, 22 24 T 48 30 T 78 22 T 102 28"
              fill="none"
              stroke="url(#river)"
              strokeWidth="2.4"
              strokeLinecap="round"
            />

            {/* Stylized land mass */}
            <path
              d="M 18 18 Q 35 8, 60 10 T 88 22 Q 95 38, 90 58 T 78 86 Q 60 92, 40 88 T 14 76 Q 6 58, 12 38 T 18 18 Z"
              fill="oklch(0.22 0.06 230)"
              stroke="oklch(0.62 0.13 195 / 0.4)"
              strokeWidth="0.4"
            />

            {/* Connecting service-network lines (between key hubs) */}
            <g stroke="oklch(0.72 0.14 190 / 0.5)" strokeWidth="0.3" strokeDasharray="0.8 1.2" fill="none">
              <line x1={POSITIONS.uttara.x} y1={POSITIONS.uttara.y} x2={POSITIONS.banani.x} y2={POSITIONS.banani.y} />
              <line x1={POSITIONS.banani.x} y1={POSITIONS.banani.y} x2={POSITIONS.gulshan.x} y2={POSITIONS.gulshan.y} />
              <line x1={POSITIONS.gulshan.x} y1={POSITIONS.gulshan.y} x2={POSITIONS.bashundhara.x} y2={POSITIONS.bashundhara.y} />
              <line x1={POSITIONS.gulshan.x} y1={POSITIONS.gulshan.y} x2={POSITIONS.badda.x} y2={POSITIONS.badda.y} />
              <line x1={POSITIONS.farmgate.x} y1={POSITIONS.farmgate.y} x2={POSITIONS.dhanmondi.x} y2={POSITIONS.dhanmondi.y} />
              <line x1={POSITIONS.farmgate.x} y1={POSITIONS.farmgate.y} x2={POSITIONS.banani.x} y2={POSITIONS.banani.y} />
              <line x1={POSITIONS.mirpur.x} y1={POSITIONS.mirpur.y} x2={POSITIONS.mohammadpur.x} y2={POSITIONS.mohammadpur.y} />
              <line x1={POSITIONS.mohammadpur.x} y1={POSITIONS.mohammadpur.y} x2={POSITIONS.dhanmondi.x} y2={POSITIONS.dhanmondi.y} />
              <line x1={POSITIONS.dhanmondi.x} y1={POSITIONS.dhanmondi.y} x2={POSITIONS.motijheel.x} y2={POSITIONS.motijheel.y} />
              <line x1={POSITIONS.motijheel.x} y1={POSITIONS.motijheel.y} x2={POSITIONS["old-dhaka"].x} y2={POSITIONS["old-dhaka"].y} />
            </g>

            {/* Pins */}
            {areas.map((a) => {
              const p = POSITIONS[a.slug];
              if (!p) return null;
              return (
                <g key={a.slug} filter="url(#pin-glow)">
                  <circle cx={p.x} cy={p.y} r="2.4" fill="oklch(0.72 0.14 190)" opacity="0.25">
                    <animate attributeName="r" values="2.4;3.6;2.4" dur="2.6s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.25;0;0.25" dur="2.6s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={p.x} cy={p.y} r="1.2" fill="oklch(0.78 0.14 185)" />
                  <circle cx={p.x} cy={p.y} r="0.5" fill="oklch(0.99 0 0)" />
                </g>
              );
            })}

            {/* Center label */}
            <text
              x="50"
              y="48"
              textAnchor="middle"
              fontSize="3"
              fontWeight="700"
              fill="oklch(1 0 0 / 0.85)"
              letterSpacing="0.3"
            >
              DHAKA
            </text>
            <text
              x="50"
              y="52.5"
              textAnchor="middle"
              fontSize="1.6"
              fill="oklch(1 0 0 / 0.55)"
              letterSpacing="0.4"
            >
              SERVICE NETWORK
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="text-white">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/80 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-glow" />
            Live coverage
          </span>
          <h3 className="mt-4 text-2xl font-bold md:text-3xl">11 neighborhoods. One trusted network.</h3>
          <p className="mt-3 max-w-md text-sm text-white/70">
            Tap any area to see verified providers and same-day availability. We're expanding to all
            64 districts of Bangladesh.
          </p>

          <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {areas.map((a) => (
              <li key={a.slug}>
                <Link
                  to="/dhaka/$area"
                  params={{ area: a.slug }}
                  className="group inline-flex items-center gap-1.5 text-white/85 transition-colors hover:text-white"
                >
                  <MapPin className="h-3.5 w-3.5 text-primary-glow transition-transform group-hover:scale-110" />
                  <span className="border-b border-transparent group-hover:border-white/40">{a.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
