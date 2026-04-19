import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight, Tag } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { PageHeader } from "@/components/page-header";
import { categories } from "@/data/categories";
import { buildSeo, OG } from "@/lib/seo";

export const Route = createFileRoute("/pricing")({
  head: () =>
    buildSeo({
      title: "Pricing & Service Charges — Transparent Rates | Shebabd",
      description:
        "Transparent starting prices for every service category in Dhaka. No hidden fees, pay only after the work is done.",
      canonical: "/pricing",
      image: OG.services,
    }),
  component: PricingPage,
});

function PricingPage() {
  const { t } = useTranslation();
  return (
    <SiteShell>
      <PageHeader
        eyebrow={t("pricingPage.eyebrow")}
        title={
          <>
            {t("pricingPage.titleA")}
            <span className="text-gradient-primary">{t("pricingPage.titleB")}</span>
          </>
        }
        description={t("pricingPage.description")}
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
                  <p className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Tag className="h-3.5 w-3.5 text-primary" /> {t("pricingPage.from")}</p>
                  <p className="text-lg font-bold text-foreground">৳{cheapest.startingPrice.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{cheapest.unit}</p>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="mt-12 text-center">
          <Link to="/book" className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-soft">
            {t("pricingPage.ctaQuote")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
