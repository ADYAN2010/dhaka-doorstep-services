import { Link } from "@tanstack/react-router";
import { ArrowRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAppearance } from "./appearance-provider";

const DISMISS_KEY = "shebabd-promo-dismissed";

export function PromoStrip() {
  const { settings } = useAppearance();
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid SSR mismatch

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(DISMISS_KEY);
      setDismissed(stored === "1");
    } catch {
      setDismissed(false);
    }
  }, [settings.promoStripText]);

  if (!settings.promoStripEnabled || dismissed) return null;

  return (
    <div className="relative isolate overflow-hidden bg-gradient-primary text-primary-foreground">
      <div className="absolute inset-0 -z-10 opacity-30 [background:radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.4),transparent_60%)]" />
      <div className="container-page flex items-center justify-center gap-4 py-2 text-xs sm:text-sm">
        <p className="truncate font-medium">{settings.promoStripText}</p>
        {settings.promoStripCta && settings.promoStripHref && (
          <Link
            to={settings.promoStripHref}
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary-foreground/15 px-2.5 py-0.5 font-semibold backdrop-blur transition-colors hover:bg-primary-foreground/25"
          >
            {settings.promoStripCta}
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch {
              // ignore
            }
          }}
          aria-label="Dismiss promotion"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 opacity-70 transition-opacity hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
