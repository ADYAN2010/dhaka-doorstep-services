import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, FileCheck2, Headphones, Lock, RefreshCcw, ShieldCheck } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { PageHeader } from "@/components/page-header";
import { buildSeo, OG } from "@/lib/seo";

export const Route = createFileRoute("/trust-safety")({
  head: () =>
    buildSeo({
      title: "Trust & Safety — Verified Providers + Service Guarantee | Shebabd",
      description:
        "How we keep customers and providers safe on Shebabd: verification, background checks, secure payments and our service guarantee.",
      canonical: "/trust-safety",
      image: OG.home,
    }),
  component: TrustPage,
});

const PILLARS = [
  { icon: BadgeCheck, t: "Verified providers", d: "Every provider passes a multi-step verification — NID, address, references and category-specific skill check." },
  { icon: FileCheck2, t: "Document checks", d: "Trade licenses, business documents and category certifications are reviewed before approval." },
  { icon: ShieldCheck, t: "Background checks", d: "We screen against known fraud lists and conduct in-person interviews for higher-risk categories." },
  { icon: Lock, t: "Secure payments", d: "All payments flow through us — no provider sees your card or bank details." },
  { icon: RefreshCcw, t: "Service guarantee", d: "If the work isn't right, we re-do it or refund. Period." },
  { icon: Headphones, t: "Real human support", d: "Bangla-speaking team in Dhaka, reachable 7 days a week by phone, WhatsApp or email." },
];

function TrustPage() {
  return (
    <SiteShell>
      <PageHeader
        eyebrow="Trust & Safety"
        title={<>Your safety is <span className="text-gradient-primary">our foundation</span></>}
        description="We've built layers of verification, payment safety and customer support so every booking on Shebabd is one you can trust."
      />
      <section className="container-page py-14">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((p) => (
            <div key={p.t} className="rounded-2xl border border-border bg-card p-6">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><p.icon className="h-5 w-5" /></span>
              <h3 className="mt-4 text-base font-semibold text-card-foreground">{p.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.d}</p>
            </div>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
