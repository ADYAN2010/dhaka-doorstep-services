/**
 * Two reusable monochrome wordmark walls:
 *  - PressWall: "As featured in" rows of media outlet wordmarks
 *  - PaymentsWall: "We accept" payment-method wordmarks
 *
 * Wordmarks are intentionally text-based (no third-party image deps)
 * styled with brand-neutral typography for an editorial, premium feel.
 */

const PRESS = [
  { name: "The Daily Star", className: "font-serif italic" },
  { name: "Prothom Alo", className: "font-display tracking-tight" },
  { name: "Dhaka Tribune", className: "font-display tracking-wider uppercase" },
  { name: "TBS", className: "font-display font-black tracking-tight" },
  { name: "Future Startup", className: "font-display lowercase tracking-tight" },
  { name: "Bonik Barta", className: "font-serif" },
];

const PAYMENTS = [
  { name: "bKash", className: "font-display font-extrabold tracking-tight" },
  { name: "Nagad", className: "font-display font-extrabold tracking-tight" },
  { name: "Rocket", className: "font-display font-bold tracking-wider uppercase" },
  { name: "Visa", className: "font-display font-black italic tracking-tight" },
  { name: "Mastercard", className: "font-display font-bold tracking-tight" },
  { name: "Cash", className: "font-display font-semibold uppercase tracking-widest" },
];

export function PressWall() {
  return (
    <div className="rounded-2xl border border-border bg-card/60 px-4 py-6 sm:px-8">
      <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        As featured in
      </p>
      <div className="mt-5 grid grid-cols-2 items-center gap-x-8 gap-y-5 text-center sm:grid-cols-3 lg:grid-cols-6">
        {PRESS.map((p) => (
          <span
            key={p.name}
            className={`select-none text-base text-muted-foreground/70 transition-colors hover:text-foreground sm:text-lg ${p.className}`}
          >
            {p.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export function PaymentsWall() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        We accept
      </span>
      {PAYMENTS.map((p) => (
        <span
          key={p.name}
          className={`inline-flex items-center rounded-md border border-border bg-card px-2.5 py-1 text-xs text-foreground/80 ${p.className}`}
        >
          {p.name}
        </span>
      ))}
    </div>
  );
}
