import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight, Clock, Sparkles, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { categories, findService } from "@/data/categories";
import { Reveal } from "@/components/reveal";
import { Skeleton } from "@/components/ui/skeleton";

type FeaturedRow = {
  slug: string;
  name: string;
  short_description: string | null;
  starting_price: number | null;
  unit: string | null;
  duration: string | null;
  display_order: number;
  category: { slug: string; name: string } | null;
};

type FeaturedItem = {
  categorySlug: string;
  categoryName: string;
  serviceSlug: string;
  name: string;
  short: string;
  startingPrice: number;
  unit?: string;
  duration?: string;
};

/** Resolve missing copy/price from the static catalog so cards never look empty. */
function hydrateFromCatalog(row: FeaturedRow): FeaturedItem | null {
  if (!row.category) return null;
  const fromCatalog = findService(row.category.slug, row.slug);
  return {
    categorySlug: row.category.slug,
    categoryName: row.category.name,
    serviceSlug: row.slug,
    name: row.name,
    short:
      row.short_description ||
      fromCatalog?.service.short ||
      `${row.name} — book a verified pro near you`,
    startingPrice: row.starting_price ?? fromCatalog?.service.startingPrice ?? 0,
    unit: row.unit ?? fromCatalog?.service.unit,
    duration: row.duration ?? fromCatalog?.service.duration,
  };
}

/** Fallback set built from the static catalog if the live query fails. */
function fallbackFeatured(): FeaturedItem[] {
  const out: FeaturedItem[] = [];
  for (const c of categories) {
    const first = c.subcategories[0]?.services[0];
    if (!first) continue;
    out.push({
      categorySlug: c.slug,
      categoryName: c.name,
      serviceSlug: first.slug,
      name: first.name,
      short: first.short,
      startingPrice: first.startingPrice,
      unit: first.unit,
      duration: first.duration,
    });
    if (out.length >= 12) break;
  }
  return out;
}

export function FeaturedServices() {
  const { t } = useTranslation();
  const [items, setItems] = useState<FeaturedItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("services")
        .select(
          "slug, name, short_description, starting_price, unit, duration, display_order, category:categories(slug, name)",
        )
        .eq("is_featured", true)
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .limit(12);

      if (cancelled) return;

      if (error || !data || data.length === 0) {
        setItems(fallbackFeatured());
        return;
      }

      const hydrated = (data as unknown as FeaturedRow[])
        .map(hydrateFromCatalog)
        .filter((x): x is FeaturedItem => Boolean(x));

      setItems(hydrated.length > 0 ? hydrated : fallbackFeatured());
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="border-y border-border bg-surface">
      <div className="container-page py-16 md:py-24">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="mb-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              {t("home.featured.eyebrow", "Featured")}
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {t("home.featured.title", "Most-booked services this month")}
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              {t(
                "home.featured.subtitle",
                "Hand-picked, high-demand services across Dhaka. Verified pros, transparent pricing.",
              )}
            </p>
          </div>
          <Link
            to="/services"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            {t("home.featured.viewAll", "Explore all 500+ services")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items === null
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="mt-3 h-5 w-3/4" />
                  <Skeleton className="mt-2 h-4 w-full" />
                  <Skeleton className="mt-4 h-9 w-full" />
                </div>
              ))
            : items.map((item, i) => (
                <Reveal key={`${item.categorySlug}-${item.serviceSlug}`} delay={i * 50}>
                  <FeaturedServiceCard item={item} />
                </Reveal>
              ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedServiceCard({ item }: { item: FeaturedItem }) {
  const { t } = useTranslation();
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </span>
        <p className="truncate text-xs font-medium text-muted-foreground">{item.categoryName}</p>
      </div>
      <h3 className="mt-3 text-base font-semibold text-card-foreground">{item.name}</h3>
      <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground">{item.short}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
        {item.duration && (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {item.duration}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <div className="text-sm">
          {item.startingPrice > 0 ? (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Tag className="h-3.5 w-3.5 text-primary" />
              <span className="font-bold text-foreground">৳{item.startingPrice.toLocaleString()}</span>
              {item.unit && <span className="ml-1 text-xs text-muted-foreground">{item.unit}</span>}
            </span>
          ) : (
            <span className="text-xs font-semibold text-primary">
              {t("home.featured.getQuote", "Get a quote")}
            </span>
          )}
        </div>
        <Link
          to="/services/$category/$service"
          params={{ category: item.categorySlug, service: item.serviceSlug }}
          className="inline-flex items-center gap-1 rounded-lg bg-gradient-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-soft transition-transform group-hover:translate-x-0.5"
        >
          {t("actions.bookNow", "Book now")} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
