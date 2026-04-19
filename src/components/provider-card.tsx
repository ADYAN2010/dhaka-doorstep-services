import { Link } from "@tanstack/react-router";
import { BadgeCheck, Star, MapPin, Clock, ArrowRight, ShieldCheck, Briefcase } from "lucide-react";
import type { Provider } from "@/data/providers";
import { areas as ALL_AREAS } from "@/data/areas";

export function ProviderCard({ provider }: { provider: Provider }) {
  const areaNames = provider.areas
    .map((s) => ALL_AREAS.find((a) => a.slug === s)?.name)
    .filter(Boolean) as string[];
  const visibleAreas = areaNames.slice(0, 3).join(", ");
  const extra = areaNames.length - 3;

  return (
    <article className="group flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-card-hover">
      <div className="flex items-start gap-3">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-primary text-base font-bold text-primary-foreground">
          {provider.initials}
          {provider.verified && (
            <span className="absolute -bottom-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-card text-primary ring-2 ring-card">
              <BadgeCheck className="h-4 w-4" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-base font-semibold text-card-foreground">
              {provider.businessName ?? provider.name}
            </h3>
          </div>
          {provider.businessName && provider.businessName !== provider.name && (
            <p className="truncate text-xs text-muted-foreground">{provider.name}</p>
          )}
          <p className="text-xs font-medium text-primary">{provider.categoryName}</p>
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
          <Briefcase className="h-3.5 w-3.5" />
          <span className="font-semibold text-foreground">{provider.jobsCompleted.toLocaleString()}</span> jobs
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" /> {provider.responseTime}
        </span>
      </div>

      <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        <span className="line-clamp-1">
          {visibleAreas || "Dhaka"}
          {extra > 0 && <span className="font-medium text-foreground"> +{extra} more</span>}
        </span>
      </div>

      {provider.verified && (
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
            <ShieldCheck className="h-3 w-3" /> ID checked
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 font-medium text-success">
            <BadgeCheck className="h-3 w-3" /> Background verified
          </span>
        </div>
      )}

      <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
        <span className="text-sm font-semibold text-foreground">{provider.pricing}</span>
        <Link
          to="/provider/$slug"
          params={{ slug: provider.slug }}
          className="inline-flex items-center gap-1 rounded-lg bg-gradient-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-soft transition-transform group-hover:translate-x-0.5"
        >
          View profile <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
