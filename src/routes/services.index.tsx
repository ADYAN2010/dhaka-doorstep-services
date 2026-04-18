import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { PageHeader } from "@/components/page-header";
import { CategoryCard } from "@/components/category-card";
import { categories, mainGroups } from "@/data/categories";
import { buildSeo, OG } from "@/lib/seo";

export const Route = createFileRoute("/services/")({
  head: () =>
    buildSeo({
      title: "All Services in Dhaka — 200+ Verified Categories | Shebabd",
      description:
        "Browse 200+ services across home, personal, business and technical categories. Verified pros, transparent pricing, same-day booking in Dhaka.",
      canonical: "/services",
      image: OG.services,
    }),
  component: AllServicesPage,
});

function AllServicesPage() {
  return (
    <SiteShell>
      <PageHeader
        eyebrow="All services"
        title={<>Every service you need, <span className="text-gradient-primary">in one place</span>.</>}
        description="From home repairs to digital marketing — explore all categories below or jump to your need."
      />

      <section className="container-page py-12">
        {mainGroups.map((group) => {
          const items = categories.filter((c) => group.slugs.includes(c.slug));
          if (!items.length) return null;
          return (
            <div key={group.name} className="mb-14">
              <div className="mb-5 flex items-end justify-between">
                <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{group.name}</h2>
                <Link to="/book" className="hidden items-center gap-1.5 text-sm font-semibold text-primary hover:underline md:inline-flex">
                  Request a quote <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {items.map((c) => <CategoryCard key={c.slug} category={c} />)}
              </div>
            </div>
          );
        })}
      </section>
    </SiteShell>
  );
}
