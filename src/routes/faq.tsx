import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { PageHeader } from "@/components/page-header";
import { ChevronDown } from "lucide-react";
import { buildSeo, jsonLdScript, OG } from "@/lib/seo";

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
          mainEntity: FAQS.map((f) => ({
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

const FAQS = [
  { q: "How do I book a service?", a: "Search or browse a category, click 'Book a Service', fill in your details and preferred time. We confirm by phone within an hour." },
  { q: "When do I pay?", a: "You only pay after the work is done and you're satisfied. Cash, mobile wallet (bKash/Nagad), and card are all supported." },
  { q: "Are providers verified?", a: "Yes. Every provider passes ID + background checks before joining. Their ratings come only from real, completed bookings." },
  { q: "What if I'm not happy with the work?", a: "Our service guarantee covers re-do or refund. Contact our support team within 48 hours of the job and we'll make it right." },
  { q: "Which areas are covered?", a: "We currently serve 11 major areas across Dhaka — Dhanmondi, Gulshan, Banani, Uttara, Mirpur, Mohammadpur, Bashundhara, Badda, Farmgate, Motijheel and Old Dhaka. Expanding nationwide soon." },
  { q: "Can I book for someone else (parent, friend)?", a: "Absolutely. Just provide their address and contact number in the booking notes — we'll coordinate with them directly." },
  { q: "How does pricing work?", a: "Each service has a transparent starting price shown on the service page. Final pricing is confirmed after on-site inspection. No hidden charges." },
  { q: "Do you offer same-day service?", a: "Most categories have same-day availability. Call us directly for urgent bookings." },
];

function FaqPage() {
  return (
    <SiteShell>
      <PageHeader
        eyebrow="Help"
        title={<>Frequently asked <span className="text-gradient-primary">questions</span></>}
        description="Everything you need to know about booking, pricing, providers, and our guarantee."
      />
      <section className="container-page py-12">
        <div className="mx-auto max-w-3xl space-y-3">
          {FAQS.map((f) => (
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
