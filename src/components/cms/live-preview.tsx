import { Smartphone, Monitor, Sun, Moon, Search, Star } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppearance } from "@/components/appearance-provider";

/**
 * Minimal site preview that re-uses the live CSS variables set by
 * the AppearanceProvider, so any change in the control panel is
 * reflected here without requiring a refresh.
 */
export function LivePreview() {
  const { settings, resolvedMode } = useAppearance();
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft">
      <div className="flex items-center justify-between border-b border-border p-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Live preview
        </div>
        <div className="flex items-center gap-1">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
              resolvedMode === "dark"
                ? "bg-slate-800 text-slate-200"
                : "bg-amber-500/15 text-amber-700",
            )}
          >
            {resolvedMode === "dark" ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />}
            {resolvedMode}
          </span>
          <div className="ml-2 flex overflow-hidden rounded-md border border-border">
            <button
              type="button"
              onClick={() => setDevice("desktop")}
              className={cn(
                "px-2 py-1 text-xs",
                device === "desktop" ? "bg-primary text-primary-foreground" : "bg-background",
              )}
              aria-label="Desktop preview"
            >
              <Monitor className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => setDevice("mobile")}
              className={cn(
                "px-2 py-1 text-xs",
                device === "mobile" ? "bg-primary text-primary-foreground" : "bg-background",
              )}
              aria-label="Mobile preview"
            >
              <Smartphone className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-3">
        <div
          className={cn(
            "mx-auto overflow-hidden rounded-xl border border-border bg-background transition-all",
            device === "desktop" ? "w-full" : "w-[280px]",
          )}
        >
          {/* Promo strip */}
          {settings.promoStripEnabled && (
            <div className="bg-primary/10 px-3 py-1.5 text-center text-[11px] font-medium text-primary">
              {settings.promoStripText}
            </div>
          )}

          {/* Top nav */}
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <div className="flex items-center gap-2">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.siteName}
                  className="h-5 w-auto object-contain"
                />
              ) : (
                <div className="grid h-5 w-5 place-items-center rounded bg-primary text-[10px] font-bold text-primary-foreground">
                  {settings.siteName.slice(0, 1)}
                </div>
              )}
              <span className="font-display text-xs font-bold">{settings.siteName}</span>
            </div>
            <div className="hidden items-center gap-2 text-[10px] text-muted-foreground sm:flex">
              <span>Services</span>
              <span>About</span>
              <span>Contact</span>
            </div>
          </div>

          {/* Hero */}
          <div
            className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-background to-background px-4 py-6"
            style={
              settings.heroImageUrl
                ? {
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.55)), url(${settings.heroImageUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
          >
            <h2
              className={cn(
                "font-display text-base font-bold leading-tight",
                settings.heroImageUrl ? "text-white" : "text-foreground",
              )}
            >
              {settings.tagline}
            </h2>
            <p
              className={cn(
                "mt-1 text-[11px]",
                settings.heroImageUrl ? "text-white/85" : "text-muted-foreground",
              )}
            >
              500+ verified professionals across Dhaka
            </p>
            <div className="mt-3 flex items-center gap-2 rounded-full border border-border bg-background/95 px-3 py-1.5 text-xs">
              <Search className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Search 200+ services…</span>
              <Button size="sm" className="ml-auto h-6 rounded-full px-3 text-[10px]">
                Search
              </Button>
            </div>
          </div>

          {/* Site banner */}
          {settings.bannerEnabled && (
            <div
              className={cn(
                "px-3 py-2 text-[11px]",
                settings.bannerVariant === "brand" && "bg-primary/10 text-primary",
                settings.bannerVariant === "info" && "bg-sky-500/10 text-sky-700 dark:text-sky-300",
                settings.bannerVariant === "success" &&
                  "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                settings.bannerVariant === "warning" &&
                  "bg-amber-500/10 text-amber-800 dark:text-amber-300",
              )}
            >
              <strong>{settings.bannerHeadline}:</strong> {settings.bannerSubtext}
            </div>
          )}

          {/* Sections */}
          <div className="space-y-3 p-3">
            {settings.sections.popularCategories && (
              <PreviewBlock title="Popular categories">
                <div className="grid grid-cols-3 gap-1.5">
                  {["Cleaning", "AC", "Plumb"].map((c) => (
                    <div
                      key={c}
                      className="rounded-md border border-border bg-card px-2 py-1.5 text-center text-[10px] font-medium"
                    >
                      {c}
                    </div>
                  ))}
                </div>
              </PreviewBlock>
            )}

            {settings.sections.featuredServices && (
              <PreviewBlock title="Featured services">
                <div className="grid grid-cols-2 gap-1.5">
                  {["Deep clean", "AC service", "Pest control", "Refrigerator"].map((c) => (
                    <div
                      key={c}
                      className="rounded-md border border-border bg-card px-2 py-1.5 text-[10px] font-medium"
                    >
                      {c}
                    </div>
                  ))}
                </div>
              </PreviewBlock>
            )}

            {settings.sections.featuredProviders && (
              <PreviewBlock title="Featured providers">
                <div className="flex gap-2 overflow-hidden">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-md border border-border bg-card p-2"
                    >
                      <div className="text-[10px] font-semibold">Provider {i}</div>
                      <div className="mt-0.5 flex items-center gap-1 text-[9px] text-muted-foreground">
                        <Star className="h-2 w-2 fill-amber-500 text-amber-500" />
                        4.9 · 120 jobs
                      </div>
                    </div>
                  ))}
                </div>
              </PreviewBlock>
            )}

            {settings.sections.testimonials && (
              <PreviewBlock title="What customers say">
                <p className="text-[10px] italic text-muted-foreground">
                  &ldquo;Booked AC service in 2 minutes. Tech arrived on time.&rdquo;
                </p>
              </PreviewBlock>
            )}

            {settings.sections.finalCta && (
              <div className="rounded-md bg-primary p-2 text-center text-[10px] font-semibold text-primary-foreground">
                Ready to book? Get started →
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border bg-surface px-3 py-2 text-[9px] text-muted-foreground">
            © {new Date().getFullYear()} {settings.siteName} ·{" "}
            {settings.contactEmail || "hello@example.com"}
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      {children}
    </div>
  );
}
