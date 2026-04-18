import { Link } from "@tanstack/react-router";
import { Phone, Calendar } from "lucide-react";

/**
 * Sticky bottom CTA shown only on mobile, on most public pages.
 * Provides one-tap access to booking + call.
 */
export function MobileStickyCTA() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-3 md:hidden">
      <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-border bg-background/95 p-2 shadow-elevated backdrop-blur">
        <a
          href="tel:+8801700000000"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background py-2.5 text-sm font-medium text-foreground"
        >
          <Phone className="h-4 w-4 text-primary" /> Call
        </a>
        <Link
          to="/book"
          className="inline-flex flex-[2] items-center justify-center gap-2 rounded-xl bg-gradient-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-soft"
        >
          <Calendar className="h-4 w-4" /> Book a Service
        </Link>
      </div>
    </div>
  );
}
