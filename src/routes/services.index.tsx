import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { SiteShell } from "@/components/site-shell";
import { PageHeader } from "@/components/page-header";
import { CategoryCard } from "@/components/category-card";
import { ServiceCatalog } from "@/components/service-catalog";
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
  const { t } = useTranslation();
  return (
    <SiteShell>
      <PageHeader
        eyebrow={t("services.eyebrow")}
        title={
          <>
            {t("services.indexTitle")}
            <span className="text-gradient-primary">{t("services.indexTitleHighlight")}</span>
          </>
        }
        description={t("services.indexDescription")}
      />

      <ServiceCatalog />

      <section className="container-page pb-16 pt-4">
        <h2 className="mb-5 text-2xl font-bold tracking-tight text-foreground md:text-3xl">{t("servicesIndex.browseByGroup")}</h2>
        {mainGroups.map((group) => {
          const items = categories.filter((c) => group.slugs.includes(c.slug));
          if (!items.length) return null;
          return (
            <div key={group.name} className="mb-10">
              <h3 className="mb-4 text-lg font-semibold tracking-tight text-foreground">{group.name}</h3>
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
