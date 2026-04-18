import { Link, useLocation } from "@tanstack/react-router";
import { Phone, Calendar } from "lucide-react";

/**
 * Sticky bottom CTA shown only on mobile, on browse / discovery pages.
 * Hidden on pages where the CTA is redundant or contextually wrong
 * (booking form, auth pages, admin, account pages).
 */
const HIDDEN_PREFIXES = [
  "/book",
  "/login",
  "/signup",
  "/reset-password",
  "/admin",
  "/contact",
  "/dashboard",
  "/provider-dashboard",
  "/profile",
  "/coverage",
  "/availability",
  "/become-provider",
];

export function MobileStickyCTA() {
  const { pathname } = useLocation();
  const hidden = HIDDEN_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (hidden) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-3 md:hidden">
      <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-border bg-background/95 p-2 shadow-elevated backdrop-blur">
        <a
          href="tel:+8801700000000"
          aria-label="Call Shebabd support"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background py-3 text-sm font-medium text-foreground"
        >
          <Phone className="h-4 w-4 text-primary" /> Call
        </a>
        <Link
          to="/book"
          className="inline-flex flex-[2] items-center justify-center gap-2 rounded-xl bg-gradient-primary py-3 text-sm font-semibold text-primary-foreground shadow-soft"
        >
          <Calendar className="h-4 w-4" /> Book a Service
        </Link>
      </div>
    </div>
  );
}
