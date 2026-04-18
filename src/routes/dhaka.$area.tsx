import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowRight, BadgeCheck, Clock, MapPin, ShieldCheck, Star, Users, Phone,
} from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { CategoryCard } from "@/components/category-card";
import { ProviderCard } from "@/components/provider-card";
import { findArea, areas } from "@/data/areas";
import { findCity } from "@/data/cities";
import { categories } from "@/data/categories";
import { providers } from "@/data/providers";
import { buildSeo, jsonLdScript, OG, SITE_URL, absUrl } from "@/lib/seo";

export const Route = createFileRoute("/dhaka/$area")({
  loader: ({ params }) => {
    const area = findArea(params.area);
    if (!area) throw notFound();
    const city = findCity("dhaka")!;
    return { area, city };
  },
  head: ({ loaderData, params }) => {
    const a = loaderData?.area;
    if (!a) {
      return buildSeo({
        title: "Area — Shebabd",
        description: "Service area in Dhaka.",
        canonical: `/dhaka/${params.area}`,
        noindex: true,
      });
    }
    const seo = buildSeo({
      title: `Services in ${a.name}, Dhaka (${a.postal}) — Shebabd`,
      description: `Book verified service providers in ${a.name}, Dhaka (${a.postal}). ${a.blurb}`,
      canonical: `/dhaka/${a.slug}`,
      image: OG.areas,
    });
    return {
      ...seo,
      scripts: [
        jsonLdScript({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "@id": `${SITE_URL}/dhaka/${a.slug}#localbusiness`,
          name: `Shebabd — ${a.name}`,
          url: absUrl(`/dhaka/${a.slug}`),
          description: a.blurb,
          areaServed: {
            "@type": "Place",
            name: `${a.name}, Dhaka`,
            address: {
              "@type": "PostalAddress",
              addressLocality: a.name,
              addressRegion: "Dhaka",
              postalCode: a.postal,
              addressCountry: "BD",
            },
          },
          parentOrganization: { "@id": `${SITE_URL}/#organization` },
          priceRange: "৳",
        }),
      ],
    };
  },
  notFoundComponent: () => (
    <SiteShell>
      <div className="container-page py-24 text-center">
        <h1 className="text-3xl font-bold">Area not found</h1>
        <Link to="/areas" className="mt-4 inline-block text-primary underline">All areas</Link>
      </div>
    </SiteShell>
  ),
  errorComponent: ({ error }) => (
    <SiteShell>
      <div className="container-page py-24 text-center">
        <h1 className="text-3xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-muted-foreground">{error.message}</p>
        <Link to="/areas" className="mt-4 inline-block text-primary underline">All areas</Link>
      </div>
    </SiteShell>
  ),
  component: AreaPage,
});

function AreaPage() {
  const { area, city } = Route.useLoaderData();
  const localProviders = providers.filter((p) => p.areas.includes(area.slug));
  const featuredLocal = localProviders.slice(0, 6);

  // Categories actually represented by local providers (fallback to popular)
  const localCategorySlugs = Array.from(new Set(localProviders.map((p) => p.categorySlug)));
  const localCategories = categories.filter((c) => localCategorySlugs.includes(c.slug));
  const popularCategories = (localCategories.length >= 4 ? localCategories : categories).slice(0, 8);

  // Distinct services available in this area, derived from local providers
  const localServices = Array.from(
    new Set(localProviders.flatMap((p) => p.services ?? []))
  ).slice(0, 12);

  // Nearby areas (same zone, exclude self)
  const nearbyAreas = areas.filter((a) => a.zone === area.zone && a.slug !== area.slug).slice(0, 6);

  const totalReviews = localProviders.reduce((s, p) => s + p.reviews, 0);
  const avgRating = localProviders.length
    ? (localProviders.reduce((s, p) => s + p.rating * p.reviews, 0) / Math.max(totalReviews, 1)).toFixed(1)
    : "4.8";
  const verifiedCount = localProviders.filter((p) => p.verified).length;

  return (
    <SiteShell>
      {/* Local hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-hero text-white">
        <div className="container-page py-14 md:py-20">
          <Link to="/areas" className="text-xs font-medium text-white/70 hover:text-white">
            ← All areas in {city.name}
          </Link>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium backdrop-blur">
            <MapPin className="h-3.5 w-3.5 text-primary" /> {area.zone} · {city.name} · {area.postal}
          </div>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
            Trusted home & lifestyle services in {area.name}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-white/75 md:text-lg">{area.blurb}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/book"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow"
            >
              Book a service in {area.name} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/providers"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Browse providers
            </Link>
          </div>

          {/* Local stat strip */}
          <div className="mt-8 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Verified pros", value: verifiedCount || "20+" },
              { label: "Avg. rating", value: `${avgRating} ★` },
              { label: "Jobs done", value: localProviders.reduce((s, p) => s + p.jobsCompleted, 0).toLocaleString() || "1,000+" },
              { label: "Response", value: "< 1 hr" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-white/15 bg-white/5 p-3 text-center backdrop-blur">
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-[11px] uppercase tracking-wide text-white/60">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular categories */}
      <section className="container-page py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Popular categories in {area.name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Most-booked services by households and offices around {area.zone}.
            </p>
          </div>
          <Link to="/services" className="hidden text-sm font-semibold text-primary hover:underline sm:inline">
            All services →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {popularCategories.map((c) => <CategoryCard key={c.slug} category={c} />)}
        </div>
      </section>

      {/* Services available in this area */}
      {localServices.length > 0 && (
        <section className="border-t border-border bg-surface">
          <div className="container-page py-14">
            <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Services available in {area.name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tap any service to compare local pros and prices.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {localServices.map((s) => (
                <Link
                  key={s}
                  to="/services"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  {s}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured providers */}
      {featuredLocal.length > 0 && (
        <section className="container-page py-14">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                Featured providers in {area.name}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Hand-picked, top-rated and verified for {area.zone}.
              </p>
            </div>
            <Link to="/providers" className="hidden text-sm font-semibold text-primary hover:underline sm:inline">
              See all →
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featuredLocal.map((p) => <ProviderCard key={p.slug} provider={p} />)}
          </div>
        </section>
      )}

      {/* Local trust message */}
      <section className="border-t border-border bg-gradient-subtle">
        <div className="container-page py-14">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <ShieldCheck className="h-3.5 w-3.5" /> Local promise
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              We know {area.name} — and we&rsquo;re responsible for every visit
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Every professional working in {area.name} is ID-verified, background-checked and trained on our service standards.
              If anything isn&rsquo;t right, our local support team in {city.name} steps in within hours.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: BadgeCheck, t: "ID + background verified", d: `Every pro serving ${area.name} is fully vetted before they take a job.` },
              { icon: Clock, t: "Fast local response", d: `Most pros in ${area.zone} confirm within an hour — same-day available.` },
              { icon: Star, t: "Real reviews", d: `${totalReviews.toLocaleString() || "1,000+"} verified reviews from ${area.name} households.` },
              { icon: Users, t: "Service guarantee", d: "Not happy? We&rsquo;ll fix it — or refund. No back-and-forth." },
            ].map((b) => (
              <div key={b.t} className="rounded-2xl border border-border bg-card p-5">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <b.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 text-sm font-semibold text-card-foreground">{b.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: b.d }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nearby areas */}
      {nearbyAreas.length > 0 && (
        <section className="container-page py-14">
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Nearby areas in {area.zone}
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {nearbyAreas.map((a) => (
              <Link
                key={a.slug}
                to="/dhaka/$area"
                params={{ area: a.slug }}
                className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <div>
                  <p className="text-sm font-semibold text-card-foreground">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{a.zone} · {a.postal}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Area-specific CTA */}
      <section className="border-t border-border">
        <div className="container-page py-14">
          <div className="overflow-hidden rounded-3xl bg-gradient-hero p-8 text-white shadow-elevated md:p-12">
            <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
              <div>
                <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                  Need a pro in {area.name} today?
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-white/80 md:text-base">
                  Tell us what you need — we&rsquo;ll match you with verified providers in {area.zone} within minutes.
                  Most jobs are confirmed the same day.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/book"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-foreground shadow-soft hover:bg-white/90"
                >
                  Book in {area.name} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
                >
                  <Phone className="h-4 w-4" /> Talk to support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
