import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { SiteShell } from "@/components/site-shell";
import { PageHeader } from "@/components/page-header";
import { ChevronDown } from "lucide-react";
import { buildSeo, jsonLdScript, OG } from "@/lib/seo";
import i18n from "@/i18n/config";

const FAQ_KEYS = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"] as const;
const ANS_KEYS = ["a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8"] as const;

/** Build the FAQ array using the active language so JSON-LD matches the rendered locale. */
function buildFaqs() {
  return FAQ_KEYS.map((qk, i) => ({
    q: i18n.t(`faqPage.${qk}`, { ns: "common" }) as string,
    a: i18n.t(`faqPage.${ANS_KEYS[i]}`, { ns: "common" }) as string,
  }));
}

export const Route = createFileRoute("/faq")({
  head: () => {
    const seo = buildSeo({
      title: "FAQ — Booking, Pricing & Provider Questions | Shebabd",
      description:
        "Answers to common questions about booking services, pricing, providers, and our service guarantee in Dhaka.",
      canonical: "/faq",
      image: OG.home,
    });
    return {
      ...seo,
      scripts: [
        jsonLdScript({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: buildFaqs().map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      ],
    };
  },
  component: FaqPage,
});

function FaqPage() {
  const { t } = useTranslation();
  const faqs = FAQ_KEYS.map((qk, i) => ({
    q: t(`faqPage.${qk}`),
    a: t(`faqPage.${ANS_KEYS[i]}`),
  }));
  return (
    <SiteShell>
      <PageHeader
        eyebrow={t("faq.eyebrow")}
        title={
          <>
            {t("faq.titlePart1")}
            <span className="text-gradient-primary">{t("faq.titleHighlight")}</span>
          </>
        }
        description={t("faq.description")}
      />
      <section className="container-page py-12">
        <div className="mx-auto max-w-3xl space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-border bg-card p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-card-foreground">
                {f.q}
                <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
