import { Link } from "@tanstack/react-router";
import { BadgeCheck, MapPin, Star } from "lucide-react";
import { SavedHeartButton } from "@/components/saved-heart-button";
import { areas as ALL_AREAS } from "@/data/areas";
import { categories as ALL_CATEGORIES } from "@/data/categories";

export type RealProvider = {
  id: string;
  full_name: string;
  area: string | null;
  avatar_url: string | null;
  categories: string[];
  areas: string[];
  avg_rating: number | null;
  review_count: number;
};

export function RealProviderCard({ provider }: { provider: RealProvider }) {
  const initials = (provider.full_name || "?")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const categoryNames = provider.categories
    .map((slug) => ALL_CATEGORIES.find((c) => c.slug === slug)?.name ?? slug)
    .slice(0, 2)
    .join(", ");
  const areaNames = provider.areas
    .map((slug) => ALL_AREAS.find((a) => a.slug === slug)?.name ?? slug)
    .slice(0, 3)
    .join(", ");

  return (
    <div className="group relative flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated">
      <div className="absolute right-3 top-3">
        <SavedHeartButton providerId={provider.id} iconOnly size="sm" />
      </div>

      <Link
        to="/p/$id"
        params={{ id: provider.id }}
        className="flex items-start gap-3"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-primary text-base font-bold text-primary-foreground">
          {provider.avatar_url ? (
            <img src={provider.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="min-w-0 flex-1 pr-10">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-base font-semibold text-card-foreground">
              {provider.full_name}
            </h3>
            <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-label="Verified" />
          </div>
          <p className="text-xs text-muted-foreground">
            {categoryNames || "Verified professional"}
          </p>
        </div>
      </Link>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-warning text-warning" />
          <span className="font-semibold text-foreground">
            {provider.avg_rating !== null ? provider.avg_rating.toFixed(1) : "New"}
          </span>
          <span>({provider.review_count})</span>
        </span>
        {areaNames && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {areaNames}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="text-xs font-medium text-muted-foreground">Verified pro</span>
        <Link
          to="/p/$id"
          params={{ id: provider.id }}
          className="text-xs font-medium text-primary group-hover:underline"
        >
          View profile →
        </Link>
      </div>
    </div>
  );
}
