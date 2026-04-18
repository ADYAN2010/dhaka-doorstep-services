import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, Clock, Tag } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { PageHeader } from "@/components/page-header";
import { ProviderCard } from "@/components/provider-card";
import { findCategory } from "@/data/categories";
import { providers } from "@/data/providers";
import { buildSeo, jsonLdScript, OG, SITE_URL, absUrl } from "@/lib/seo";

export const Route = createFileRoute("/services/$category/")({
  loader: ({ params }) => {
    const category = findCategory(params.category);
    if (!category) throw notFound();
    return { category };
  },
  head: ({ loaderData, params }) => {
    const cat = loaderData?.category;
    if (!cat) {
      return buildSeo({
        title: "Category — Shebabd",
        description: "Browse our service categories in Dhaka.",
        canonical: `/services/${params.category}`,
        noindex: true,
      });
    }
    const seo = buildSeo({
      title: `${cat.name} in Dhaka — Verified Pros from ৳${Math.min(
        ...cat.subcategories.flatMap((s) => s.services.map((sv) => sv.startingPrice)),
      ).toLocaleString()} | Shebabd`,
      description: `${cat.tagline}. Book verified ${cat.name.toLowerCase()} providers in Dhaka with transparent pricing and same-day availability.`,
      canonical: `/services/${cat.slug}`,
      image: OG.services,
    });
    return {
      ...seo,
      scripts: [
        jsonLdScript({
          "@context": "https://schema.org",
          "@type": "Service",
          serviceType: cat.name,
          provider: {
            "@type": "LocalBusiness",
            "@id": `${SITE_URL}/#organization`,
            name: "Shebabd",
            url: SITE_URL,
          },
          areaServed: { "@type": "City", name: "Dhaka" },
          description: cat.tagline,
          url: absUrl(`/services/${cat.slug}`),
          offers: cat.subcategories.flatMap((sub) =>
            sub.services.map((s) => ({
              "@type": "Offer",
              name: s.name,
              description: s.short,
              price: s.startingPrice,
              priceCurrency: "BDT",
              availability: "https://schema.org/InStock",
              url: absUrl(`/services/${cat.slug}/${s.slug}`),
            })),
          ),
        }),
      ],
    };
  },
  notFoundComponent: () => (
    <SiteShell>
      <div className="container-page py-24 text-center">
        <h1 className="text-3xl font-bold">Category not found</h1>
        <Link to="/services" className="mt-4 inline-block text-primary underline">Browse all services</Link>
      </div>
    </SiteShell>
  ),
  component: CategoryPage,
});

function CategoryPage() {
  const { category } = Route.useLoaderData();
  const Icon = category.icon;
  const matchingProviders = providers.filter((p) => p.categorySlug === category.slug);

  return (
    <SiteShell>
      <section className="border-b border-border bg-gradient-subtle">
        <div className="container-page py-14 md:py-20">
          <div className="flex items-start gap-5">
            <span className={`inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${category.accent}`}>
              <Icon className="h-7 w-7" />
            </span>
            <div>
              <Link to="/services" className="text-xs font-medium text-muted-foreground hover:text-foreground">← All services</Link>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground md:text-5xl">{category.name}</h1>
              <p className="mt-3 max-w-2xl text-base text-muted-foreground md:text-lg">{category.tagline}. Verified providers, transparent pricing, same-day availability across Dhaka.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link to="/book" className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft">Book this service <ArrowRight className="h-4 w-4" /></Link>
                <Link to="/contact" className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted">Talk to us</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {category.subcategories.map((sub: import("@/data/categories").Subcategory) => (
        <section key={sub.slug} className="container-page py-12">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{sub.name}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sub.services.map((s: import("@/data/categories").Service) => (
              <Link
                key={s.slug}
                to="/services/$category/$service"
                params={{ category: category.slug, service: s.slug }}
                className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated"
              >
                <h3 className="text-base font-semibold text-card-foreground">{s.name}</h3>
                <p className="text-sm text-muted-foreground">{s.short}</p>
                <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5"><Tag className="h-3.5 w-3.5 text-primary" /><span className="font-semibold text-foreground">৳{s.startingPrice.toLocaleString()}</span> {s.unit}</span>
                  {s.duration && <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {s.duration}</span>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {matchingProviders.length > 0 && (
        <section className="border-t border-border bg-surface">
          <div className="container-page py-14">
            <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Providers for {category.name}</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {matchingProviders.map((p) => <ProviderCard key={p.slug} provider={p} />)}
            </div>
          </div>
        </section>
      )}
    </SiteShell>
  );
}
