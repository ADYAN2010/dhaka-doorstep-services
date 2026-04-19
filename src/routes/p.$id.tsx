/**
 * Public provider detail page — backed by `providersApi.getById` /
 * `providersApi.getBySlug`. Accepts either a UUID or a slug in the URL.
 *
 * Renders profile header, categories, areas, weekly availability, rating
 * breakdown and recent reviews. Save / unsave is wired through
 * `SavedHeartButton` (which uses `savedProvidersApi`).
 */
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  BadgeCheck,
  MapPin,
  Calendar,
  ArrowLeft,
  Briefcase,
  Languages,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { SavedHeartButton } from "@/components/saved-heart-button";
import { StarRating } from "@/components/star-rating";
import {
  providersApi,
  type ApiProviderDetail,
} from "@/lib/providers-api";
import { ApiError } from "@/lib/api-client";
import { categories as ALL_CATEGORIES } from "@/data/categories";
import { areas as ALL_AREAS } from "@/data/areas";

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

async function loadProvider(idOrSlug: string): Promise<ApiProviderDetail> {
  const fetcher = UUID_RE.test(idOrSlug)
    ? providersApi.getById(idOrSlug)
    : providersApi.getBySlug(idOrSlug);
  try {
    return await fetcher;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) throw notFound();
    throw err;
  }
}

export const Route = createFileRoute("/p/$id")({
  loader: ({ params }): Promise<ApiProviderDetail> => loadProvider(params.id),
  component: ProviderDetailPage,
  errorComponent: ({ error }) => (
    <SiteShell>
      <div className="container-page py-16 text-center">
        <h1 className="text-2xl font-semibold">Couldn't load this provider</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <Link
          to="/providers"
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" /> Back to providers
        </Link>
      </div>
    </SiteShell>
  ),
  notFoundComponent: () => (
    <SiteShell>
      <div className="container-page py-16 text-center">
        <h1 className="text-2xl font-semibold">Provider not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This profile may be unavailable, paused, or never existed.
        </p>
        <Link
          to="/providers"
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" /> Browse all providers
        </Link>
      </div>
    </SiteShell>
  ),
  head: ({ loaderData }) => {
    const p = loaderData;
    if (!p) return { meta: [{ title: "Provider · Shebabd" }] };
    const title = `${p.business_name || p.full_name} · Shebabd`;
    const desc =
      p.bio?.slice(0, 155) ||
      `Verified ${p.primary_category || "service"} provider in ${p.primary_area || "Dhaka"} on Shebabd.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        ...(p.avatar_url
          ? [
              { property: "og:image", content: p.avatar_url },
              { name: "twitter:image", content: p.avatar_url },
            ]
          : []),
      ],
    };
  },
});

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function categoryName(slug: string) {
  return ALL_CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
}
function areaName(slug: string) {
  return ALL_AREAS.find((a) => a.slug === slug)?.name ?? slug;
}

function ProviderDetailPage() {
  const p = Route.useLoaderData();

  const initials = (p.full_name || "?")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const totalReviews = p.review_stats.count;
  const breakdown = p.review_stats.breakdown;

  return (
    <SiteShell>
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-muted/40 to-background">
        <div className="container-page py-8 md:py-12">
          <Link
            to="/providers"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All providers
          </Link>

          <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-start">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-primary text-3xl font-bold text-primary-foreground md:h-28 md:w-28">
              {p.avatar_url ? (
                <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                  {p.business_name || p.full_name}
                </h1>
                {p.is_verified && (
                  <BadgeCheck className="h-5 w-5 text-primary" aria-label="Verified" />
                )}
                {p.is_top_rated && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning-foreground">
                    Top rated
                  </span>
                )}
              </div>
              {p.business_name && p.full_name && p.business_name !== p.full_name && (
                <p className="mt-0.5 text-sm text-muted-foreground">{p.full_name}</p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <StarRating value={p.rating} readOnly size="sm" />
                  <span className="font-semibold text-foreground">
                    {p.rating ? p.rating.toFixed(1) : "New"}
                  </span>
                  <span>({totalReviews} review{totalReviews === 1 ? "" : "s"})</span>
                </span>
                {p.primary_area && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" /> {areaName(p.primary_area)}
                  </span>
                )}
                {p.response_time && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4" /> {p.response_time}
                  </span>
                )}
                {p.jobs_completed > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4" /> {p.jobs_completed.toLocaleString()} jobs done
                  </span>
                )}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link
                  to="/book"
                  search={{ providerId: p.id } as never}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.01]"
                >
                  <Calendar className="h-4 w-4" /> Book this provider
                </Link>
                <SavedHeartButton providerId={p.id} size="md" />
                {p.pricing_label && (
                  <span className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground">
                    {p.pricing_label}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_320px]">
        {/* Left column */}
        <div className="space-y-8">
          {p.bio && (
            <Card title="About">
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {p.bio}
              </p>
            </Card>
          )}

          {p.categories.length > 0 && (
            <Card title="Services offered">
              <div className="flex flex-wrap gap-2">
                {p.categories.map((slug) => (
                  <span
                    key={slug}
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium"
                  >
                    {categoryName(slug)}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {p.areas.length > 0 && (
            <Card title="Coverage areas">
              <div className="flex flex-wrap gap-2">
                {p.areas.map((slug) => (
                  <span
                    key={slug}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium"
                  >
                    <MapPin className="h-3 w-3" /> {areaName(slug)}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {p.gallery.length > 0 && (
            <Card title="Recent work">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {p.gallery.map((url, i) => (
                  <div
                    key={url + i}
                    className="aspect-square overflow-hidden rounded-xl border border-border bg-muted"
                  >
                    <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card title={`Reviews (${totalReviews})`}>
            {totalReviews === 0 ? (
              <p className="text-sm text-muted-foreground">No reviews yet — be the first.</p>
            ) : (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-[180px_1fr]">
                  <div className="text-center">
                    <div className="text-4xl font-bold">{p.review_stats.avg_rating.toFixed(1)}</div>
                    <StarRating value={p.review_stats.avg_rating} readOnly size="md" />
                    <div className="mt-1 text-xs text-muted-foreground">
                      {totalReviews} review{totalReviews === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {([5, 4, 3, 2, 1] as const).map((star) => {
                      const n = breakdown[String(star) as "1" | "2" | "3" | "4" | "5"] ?? 0;
                      const pct = totalReviews > 0 ? (n / totalReviews) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-2 text-xs">
                          <span className="w-6 text-muted-foreground">{star}★</span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-warning"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-8 text-right text-muted-foreground">{n}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <ul className="space-y-5 border-t border-border pt-5">
                  {p.recent_reviews.map((r) => (
                    <li key={r.id} className="flex gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                        {r.customer_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold">{r.customer_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(r.created_at).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <StarRating value={r.rating} readOnly size="sm" />
                        {r.comment && (
                          <p className="mt-1.5 text-sm text-muted-foreground">{r.comment}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </div>

        {/* Right column */}
        <aside className="space-y-6">
          <Card title="Weekly availability">
            {p.availability.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Availability not published — request a slot when you book.
              </p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {WEEKDAYS.map((label, day) => {
                  const slots = p.availability.filter((a) => a.weekday === day && a.is_active);
                  return (
                    <li key={day} className="flex items-center justify-between py-2">
                      <span className="font-medium">{label}</span>
                      <span className="text-muted-foreground">
                        {slots.length === 0
                          ? "Closed"
                          : slots.map((s) => `${s.start_time}–${s.end_time}`).join(", ")}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card title="Provider details">
            <dl className="space-y-3 text-sm">
              {p.years_experience > 0 && (
                <Detail icon={Briefcase} label="Experience">
                  {p.years_experience} year{p.years_experience === 1 ? "" : "s"}
                </Detail>
              )}
              {p.languages.length > 0 && (
                <Detail icon={Languages} label="Languages">
                  {p.languages.join(", ")}
                </Detail>
              )}
              <Detail icon={ShieldCheck} label="Status">
                {p.is_verified ? "Verified by Shebabd" : "Pending verification"}
              </Detail>
            </dl>
          </Card>
        </aside>
      </section>
    </SiteShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
      <h2 className="mb-4 text-base font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function Detail({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Briefcase;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="text-sm font-medium">{children}</dd>
      </div>
    </div>
  );
}
