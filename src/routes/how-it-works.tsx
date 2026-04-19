import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight, BadgeCheck, ClipboardList, Headphones, Search, ShieldCheck, Sparkles, Users, Wallet } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { PageHeader } from "@/components/page-header";
import { buildSeo, OG } from "@/lib/seo";

export const Route = createFileRoute("/how-it-works")({
  head: () =>
    buildSeo({
      title: "How Shebabd Works — Provider, We, Consumer",
      description:
        "We are the trusted middle layer between skilled providers and customers in Dhaka. Here's exactly how booking, matching, and quality control work.",
      canonical: "/how-it-works",
      image: OG.home,
    }),
  component: HowItWorksPage,
});

function HowItWorksPage() {
  const { t } = useTranslation();
  const pillars = [
    { icon: Users, t: t("howItWorksPage.p1Title"), d: t("howItWorksPage.p1Desc") },
    { icon: ShieldCheck, t: t("howItWorksPage.p2Title"), d: t("howItWorksPage.p2Desc") },
    { icon: Sparkles, t: t("howItWorksPage.p3Title"), d: t("howItWorksPage.p3Desc") },
  ];
  const customerSteps = [
    { icon: Search, t: t("howItWorksPage.c1Title"), d: t("howItWorksPage.c1Desc") },
    { icon: ClipboardList, t: t("howItWorksPage.c2Title"), d: t("howItWorksPage.c2Desc") },
    { icon: Users, t: t("howItWorksPage.c3Title"), d: t("howItWorksPage.c3Desc") },
    { icon: BadgeCheck, t: t("howItWorksPage.c4Title"), d: t("howItWorksPage.c4Desc") },
  ];
  const providerSteps = [
    { icon: ClipboardList, t: t("howItWorksPage.p1pTitle"), d: t("howItWorksPage.p1pDesc") },
    { icon: ShieldCheck, t: t("howItWorksPage.p2pTitle"), d: t("howItWorksPage.p2pDesc") },
    { icon: Sparkles, t: t("howItWorksPage.p3pTitle"), d: t("howItWorksPage.p3pDesc") },
    { icon: Wallet, t: t("howItWorksPage.p4pTitle"), d: t("howItWorksPage.p4pDesc") },
  ];
  return (
    <SiteShell>
      <PageHeader
        eyebrow={t("howItWorksPage.eyebrow")}
        title={
          <>
            {t("howItWorksPage.titleA")}
            <span className="text-gradient-primary">{t("howItWorksPage.titleB")}</span>
          </>
        }
        description={t("howItWorksPage.description")}
      />

      <section className="container-page py-14">
        <div className="grid items-stretch gap-6 md:grid-cols-3">
          {pillars.map((s) => (
            <div key={s.t} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <s.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-card-foreground">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-surface">
        <div className="container-page py-14">
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{t("howItWorksPage.forCustomers")}</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-4">
            {customerSteps.map((s, i) => (
              <div key={s.t} className="relative">
                <span className="text-5xl font-bold text-primary/15">{String(i + 1).padStart(2, "0")}</span>
                <s.icon className="absolute right-2 top-2 h-5 w-5 text-primary" />
                <h3 className="mt-2 text-base font-semibold text-foreground">{s.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{t("howItWorksPage.forProviders")}</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-4">
          {providerSteps.map((s, i) => (
            <div key={s.t} className="relative">
              <span className="text-5xl font-bold text-primary/15">{String(i + 1).padStart(2, "0")}</span>
              <s.icon className="absolute right-2 top-2 h-5 w-5 text-primary" />
              <h3 className="mt-2 text-base font-semibold text-foreground">{s.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-3">
          <Link to="/book" className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft">{t("howItWorksPage.ctaBook")} <ArrowRight className="h-4 w-4" /></Link>
          <Link to="/become-provider" className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted">{t("howItWorksPage.ctaBecome")}</Link>
          <Link to="/contact" className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted"><Headphones className="h-4 w-4 text-primary" /> {t("howItWorksPage.ctaSupport")}</Link>
        </div>
      </section>
    </SiteShell>
  );
}
