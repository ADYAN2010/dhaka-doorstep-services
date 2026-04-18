import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { ProviderCard } from "@/components/provider-card";
import { ServiceCatalog } from "@/components/service-catalog";
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

      <ServiceCatalog initialCategory={category.slug} lockCategory />

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
