import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight, BadgeCheck, Briefcase, CheckCircle2, ChevronRight, Clock,
  Languages, MapPin, MessageSquare, Phone, Star, Users,
} from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { findProvider, type Provider } from "@/data/providers";
import { areas as ALL_AREAS } from "@/data/areas";
import { buildSeo, OG } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/provider/$slug")({
  loader: ({ params }) => {
    const provider = findProvider(params.slug);
    if (!provider) throw notFound();
    return { provider };
  },
  head: ({ loaderData, params }) => {
    const p = loaderData?.provider;
    if (!p) {
      return buildSeo({
        title: "Provider — Shebabd",
        description: "Verified service provider on Shebabd.",
        canonical: `/provider/${params.slug}`,
        noindex: true,
      });
    }
    return buildSeo({
      title: `${p.businessName ?? p.name} — ${p.categoryName} in Dhaka | Shebabd`,
      description: p.bio.slice(0, 160),
      canonical: `/provider/${p.slug}`,
      image: OG.providers,
      type: "profile",
    });
  },
  notFoundComponent: () => (
    <SiteShell>
      <div className="container-page py-24 text-center">
        <h1 className="text-3xl font-bold">Provider not found</h1>
        <Link to="/providers" className="mt-4 inline-block text-primary underline">Browse providers</Link>
      </div>
    </SiteShell>
  ),
  errorComponent: ({ error }) => (
    <SiteShell>
      <div className="container-page py-24 text-center">
        <h1 className="text-3xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-muted-foreground">{error.message}</p>
        <Link to="/providers" className="mt-4 inline-block text-primary underline">Back to providers</Link>
      </div>
    </SiteShell>
  ),
  component: ProviderProfile,
});

const REVIEWS = [
  { n: "Tasnim A.", area: "Dhanmondi", r: 5, when: "1 week ago", q: "Showed up exactly on time, work was clean. Very polite team." },
  { n: "Imran H.", area: "Gulshan", r: 5, when: "2 weeks ago", q: "Gave a fair quote, completed the job in one visit. Highly recommend." },
  { n: "Nadia R.", area: "Uttara", r: 4, when: "3 weeks ago", q: "Great work overall. Will definitely book again next time." },
  { n: "Shafiq A.", area: "Mirpur", r: 5, when: "1 month ago", q: "Best service I've used through any platform. Worth every taka." },
];

function ProviderProfile() {
  const { provider } = Route.useLoaderData() as { provider: Provider };
  const areaNames = provider.areas.map((s: string) => ALL_AREAS.find((a) => a.slug === s)?.name).filter(Boolean) as string[];
  const breakdown = provider.ratingBreakdown ?? [];
  const totalReviews = breakdown.reduce((sum, b) => sum + b.count, 0) || provider.reviews;
  const [activeImg, setActiveImg] = useState<string | null>(null);
  const displayName = provider.businessName ?? provider.name;

  return (
    <SiteShell>
      {/* Hero */}
      <section className="border-b border-border bg-gradient-subtle">
        <div className="container-page py-10 md:py-14">
          <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/providers" className="hover:text-foreground">Providers</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/services/$category" params={{ category: provider.categorySlug }} className="hover:text-foreground">{provider.categoryName}</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-foreground">{displayName}</span>
          </nav>

          <div className="grid gap-6 md:grid-cols-[auto_1fr_auto] md:items-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-primary text-3xl font-bold text-primary-foreground shadow-glow">
              {provider.initials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">{displayName}</h1>
                {provider.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    <BadgeCheck className="h-3.5 w-3.5" /> Verified
                  </span>
                )}
                {provider.topRated && (
                  <span className="rounded-full bg-warning/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-warning">Top rated</span>
                )}
              </div>
              {provider.businessName && provider.businessName !== provider.name && (
                <p className="mt-1 text-sm text-muted-foreground">Run by {provider.name}</p>
              )}
              <p className="mt-1 text-sm text-muted-foreground">{provider.categoryName} · {provider.type === "agency" ? "Agency" : "Individual professional"}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-warning text-warning" /><span className="font-semibold text-foreground">{provider.rating.toFixed(1)}</span> · {provider.reviews} reviews</span>
                <span className="inline-flex items-center gap-1"><Briefcase className="h-4 w-4" /> {provider.jobsCompleted.toLocaleString()} jobs done</span>
                <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" /> {provider.responseTime}</span>
                <span className="inline-flex items-center gap-1"><Users className="h-4 w-4" /> {provider.yearsExperience} yrs experience</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 md:items-end">
              <Link to="/book" className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft">
                Request service <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#contact" className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted">
                <MessageSquare className="h-4 w-4" /> Message
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          <div>
            {/* About */}
            <h2 className="text-xl font-semibold text-foreground">About</h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">{provider.bio}</p>
            {provider.languages && provider.languages.length > 0 && (
              <p className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Languages className="h-4 w-4 text-primary" /> Speaks {provider.languages.join(", ")}
              </p>
            )}

            {/* Services offered */}
            {provider.services && provider.services.length > 0 && (
              <>
                <h2 className="mt-10 text-xl font-semibold text-foreground">Services offered</h2>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {provider.services.map((s) => (
                    <div key={s} className="flex items-start gap-2 rounded-xl border border-border bg-card p-3 text-sm text-card-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {s}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Coverage areas */}
            <h2 className="mt-10 text-xl font-semibold text-foreground">Coverage areas</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {areaNames.map((n) => {
                const slug = ALL_AREAS.find((a) => a.name === n)?.slug;
                return slug ? (
                  <Link key={n} to="/dhaka/$area" params={{ area: slug }} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/40 hover:bg-primary/5">
                    <MapPin className="h-3.5 w-3.5 text-primary" /> {n}
                  </Link>
                ) : (
                  <span key={n} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground">
                    <MapPin className="h-3.5 w-3.5 text-primary" /> {n}
                  </span>
                );
              })}
            </div>

            {/* Portfolio / gallery */}
            {provider.gallery && provider.gallery.length > 0 && (
              <>
                <h2 className="mt-10 text-xl font-semibold text-foreground">Portfolio</h2>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {provider.gallery.map((src, i) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setActiveImg(src)}
                      className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
                    >
                      <img src={src} alt={`${displayName} portfolio ${i + 1}`} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Ratings breakdown + Reviews */}
            <h2 className="mt-10 text-xl font-semibold text-foreground">Ratings & reviews</h2>
            <div className="mt-4 grid gap-6 rounded-2xl border border-border bg-card p-6 md:grid-cols-[200px_1fr]">
              <div className="flex flex-col items-center justify-center border-b border-border pb-6 md:border-b-0 md:border-r md:pb-0 md:pr-6">
                <p className="text-5xl font-bold text-foreground">{provider.rating.toFixed(1)}</p>
                <div className="mt-2 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn("h-4 w-4", i < Math.round(provider.rating) ? "fill-warning text-warning" : "text-muted-foreground/40")} />
                  ))}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{provider.reviews} reviews</p>
              </div>
              <div className="space-y-2">
                {breakdown.map((b) => {
                  const pct = totalReviews > 0 ? (b.count / totalReviews) * 100 : 0;
                  return (
                    <div key={b.stars} className="flex items-center gap-3 text-xs">
                      <span className="w-8 shrink-0 text-muted-foreground">{b.stars} ★</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-warning" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-10 shrink-0 text-right text-muted-foreground">{b.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {REVIEWS.map((t, i) => (
                <article key={i} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, k) => (
                      <Star key={k} className={cn("h-3.5 w-3.5", k < t.r ? "fill-warning text-warning" : "text-muted-foreground/40")} />
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-card-foreground">&ldquo;{t.q}&rdquo;</p>
                  <p className="mt-3 text-xs text-muted-foreground">— {t.n} · {t.area} · {t.when}</p>
                </article>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div id="contact" className="rounded-2xl border border-border bg-card p-6 shadow-elevated">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pricing</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{provider.pricing}</p>
              <p className="mt-1 text-xs text-muted-foreground">Final price confirmed on inspection.</p>

              <Link to="/book" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft">
                Request service <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/contact" className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted">
                <MessageSquare className="h-4 w-4" /> Send a message
              </Link>

              <div className="mt-5 space-y-2.5 border-t border-border pt-5 text-xs text-muted-foreground">
                <p className="flex items-center gap-2"><BadgeCheck className="h-3.5 w-3.5 text-primary" /> ID + background verified</p>
                <p className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-primary" /> Avg. response: {provider.responseTime}</p>
                <p className="flex items-center gap-2"><Star className="h-3.5 w-3.5 text-primary" /> {provider.rating.toFixed(1)} from {provider.reviews} reviews</p>
                <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-primary" /> Pre-arrival call confirmation</p>
              </div>
            </div>

            {/* Availability */}
            {provider.availability && provider.availability.length > 0 && (
              <div className="mt-4 rounded-2xl border border-border bg-card p-6">
                <p className="text-sm font-semibold text-foreground">Weekly availability</p>
                <ul className="mt-3 divide-y divide-border text-sm">
                  {provider.availability.map((a) => (
                    <li key={a.day} className="flex items-center justify-between py-2">
                      <span className="font-medium text-foreground">{a.day}</span>
                      <span className={cn("text-xs", a.hours === "Closed" ? "text-muted-foreground" : "text-foreground")}>{a.hours}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </section>

      {/* Lightbox */}
      {activeImg && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4 backdrop-blur"
          onClick={() => setActiveImg(null)}
        >
          <img src={activeImg} alt="Portfolio preview" className="max-h-[85vh] max-w-[90vw] rounded-2xl border border-border object-contain" />
          <button type="button" className="absolute right-4 top-4 rounded-full bg-card p-2 text-foreground shadow" aria-label="Close">
            <ChevronRight className="h-4 w-4 rotate-45" />
          </button>
        </div>
      )}
    </SiteShell>
  );
}
