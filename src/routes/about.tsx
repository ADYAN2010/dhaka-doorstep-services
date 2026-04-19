import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight, Globe, Heart, Target } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { PageHeader } from "@/components/page-header";
import { buildSeo, OG } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: () =>
    buildSeo({
      title: "About Shebabd — Built in Bangladesh, for Bangladesh",
      description:
        "Shebabd connects skilled providers with everyday customers across Dhaka. Built in Bangladesh, for Bangladesh — starting in Dhaka, scaling to all 64 districts.",
      canonical: "/about",
      image: OG.home,
    }),
  component: AboutPage,
});

function AboutPage() {
  const { t } = useTranslation();
  const cards = [
    { icon: Target, t: t("aboutPage.missionTitle"), d: t("aboutPage.missionDesc") },
    { icon: Heart, t: t("aboutPage.valuesTitle"), d: t("aboutPage.valuesDesc") },
    { icon: Globe, t: t("aboutPage.roadmapTitle"), d: t("aboutPage.roadmapDesc") },
  ];
  return (
    <SiteShell>
      <PageHeader
        eyebrow={t("aboutPage.eyebrow")}
        title={
          <>
            {t("aboutPage.titleA")}
            <span className="text-gradient-primary">{t("aboutPage.titleB")}</span>
          </>
        }
        description={t("aboutPage.description")}
      />

      <section className="container-page py-14">
        <div className="grid gap-6 md:grid-cols-3">
          {cards.map((it) => (
            <div key={it.t} className="rounded-2xl border border-border bg-card p-6">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><it.icon className="h-5 w-5" /></span>
              <h3 className="mt-4 text-lg font-semibold text-card-foreground">{it.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{it.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{t("aboutPage.whyTitle")}</h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {t("aboutPage.whyP1")}
          </p>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {t("aboutPage.whyP2")}
          </p>
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link to="/book" className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft">{t("aboutPage.ctaBook")} <ArrowRight className="h-4 w-4" /></Link>
          <Link to="/become-provider" className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted">{t("aboutPage.ctaBecome")}</Link>
        </div>
      </section>
    </SiteShell>
  );
}
