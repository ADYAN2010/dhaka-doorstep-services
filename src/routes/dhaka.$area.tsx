import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, MapPin } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { CategoryCard } from "@/components/category-card";
import { ProviderCard } from "@/components/provider-card";
import { findArea } from "@/data/areas";
import { categories } from "@/data/categories";
import { providers } from "@/data/providers";
import { buildSeo, jsonLdScript, OG, SITE_URL, absUrl } from "@/lib/seo";

export const Route = createFileRoute("/dhaka/$area")({
  loader: ({ params }) => {
    const area = findArea(params.area);
    if (!area) throw notFound();
    return { area };
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
  component: AreaPage,
});

function AreaPage() {
  const { area } = Route.useLoaderData();
  const localProviders = providers.filter((p) => p.areas.includes(area.slug));
  const popular = categories.slice(0, 8);

  return (
    <SiteShell>
      <section className="border-b border-border bg-gradient-hero text-white">
        <div className="container-page py-14 md:py-20">
          <Link to="/areas" className="text-xs font-medium text-white/70 hover:text-white">← All areas</Link>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium backdrop-blur">
            <MapPin className="h-3.5 w-3.5 text-primary" /> {area.zone} · {area.postal}
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">Services in {area.name}, Dhaka</h1>
          <p className="mt-4 max-w-2xl text-base text-white/75 md:text-lg">{area.blurb}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/book" className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow">Book a Service <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/services" className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10">Browse all services</Link>
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Popular in {area.name}</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {popular.map((c) => <CategoryCard key={c.slug} category={c} />)}
        </div>
      </section>

      {localProviders.length > 0 && (
        <section className="border-t border-border bg-surface">
          <div className="container-page py-14">
            <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Providers serving {area.name}</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {localProviders.map((p) => <ProviderCard key={p.slug} provider={p} />)}
            </div>
          </div>
        </section>
      )}
    </SiteShell>
  );
}
