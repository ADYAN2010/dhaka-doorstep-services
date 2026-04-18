import { Link } from "@tanstack/react-router";
import { BadgeCheck, Star, MapPin, Clock } from "lucide-react";
import type { Provider } from "@/data/providers";
import { areas as ALL_AREAS } from "@/data/areas";

export function ProviderCard({ provider }: { provider: Provider }) {
  const areaNames = provider.areas
    .map((s) => ALL_AREAS.find((a) => a.slug === s)?.name)
    .filter(Boolean)
    .slice(0, 3)
    .join(", ");

  return (
    <Link
      to="/provider/$slug"
      params={{ slug: provider.slug }}
      className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-primary text-base font-bold text-primary-foreground">
          {provider.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-base font-semibold text-card-foreground">{provider.name}</h3>
            {provider.verified && (
              <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-label="Verified" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">{provider.categoryName}</p>
        </div>
        {provider.topRated && (
          <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
            Top rated
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-warning text-warning" />
          <span className="font-semibold text-foreground">{provider.rating.toFixed(1)}</span>
          <span>({provider.reviews})</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" /> {provider.responseTime}
        </span>
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" /> {areaNames}
        </span>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="text-sm font-semibold text-foreground">{provider.pricing}</span>
        <span className="text-xs font-medium text-primary group-hover:underline">View profile →</span>
      </div>
    </Link>
  );
}
