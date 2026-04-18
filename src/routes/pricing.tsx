import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Tag } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { PageHeader } from "@/components/page-header";
import { categories } from "@/data/categories";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing & Service Charges — Shebabd" },
      { name: "description", content: "Transparent starting prices for every service category in Dhaka. No hidden fees, pay only after the work is done." },
      { property: "og:title", content: "Transparent Pricing — Shebabd" },
      { property: "og:description", content: "Starting prices for every category in Dhaka. No hidden fees." },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  return (
    <SiteShell>
      <PageHeader
        eyebrow="Pricing"
        title={<>Transparent prices, <span className="text-gradient-primary">always</span></>}
        description="Every category has a starting price. Final pricing is confirmed after inspection — no hidden charges, no payment until the work is done."
      />
      <section className="container-page py-12">
        <div className="grid gap-4 md:grid-cols-2">
          {categories.map((c) => {
            const cheapest = c.subcategories
              .flatMap((s) => s.services)
              .reduce((min, s) => (s.startingPrice < min.startingPrice ? s : min));
            return (
              <Link
                key={c.slug}
                to="/services/$category"
                params={{ category: c.slug }}
                className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated"
              >
                <div>
                  <h3 className="text-base font-semibold text-card-foreground">{c.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{c.tagline}</p>
                </div>
                <div className="text-right">
                  <p className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Tag className="h-3.5 w-3.5 text-primary" /> from</p>
                  <p className="text-lg font-bold text-foreground">৳{cheapest.startingPrice.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{cheapest.unit}</p>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="mt-12 text-center">
          <Link to="/book" className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-soft">
            Get an exact quote <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
