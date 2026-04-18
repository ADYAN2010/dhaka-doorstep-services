import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, ClipboardList, Headphones, Search, ShieldCheck, Sparkles, Users, Wallet } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How Shebabd Works — Provider, We, Consumer" },
      { name: "description", content: "We are the trusted middle layer between skilled providers and customers in Dhaka. Here's exactly how booking, matching, and quality control work." },
      { property: "og:title", content: "How Shebabd Works — Provider, We, Consumer" },
      { property: "og:description", content: "Verified providers + our quality layer + happy customers." },
    ],
  }),
  component: HowItWorksPage,
});

function HowItWorksPage() {
  return (
    <SiteShell>
      <PageHeader
        eyebrow="How it works"
        title={<>The bridge between <span className="text-gradient-primary">providers and people</span></>}
        description="Skilled providers join our platform. We verify, organize and support. You book trusted services in minutes, with a guarantee."
      />

      <section className="container-page py-14">
        <div className="grid items-stretch gap-6 md:grid-cols-3">
          {[
            { icon: Users, t: "1. Providers join us", d: "We onboard skilled professionals — they submit ID, trade docs, and pass our quality checks." },
            { icon: ShieldCheck, t: "2. We verify & manage", d: "We organize, train, market, and handle support. We are your trusted middle layer." },
            { icon: Sparkles, t: "3. You book with confidence", d: "Customers discover, compare, book, and pay through us — backed by our service guarantee." },
          ].map((s) => (
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
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">For customers</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-4">
            {[
              { icon: Search, t: "Choose", d: "Search 200+ services or browse by category." },
              { icon: ClipboardList, t: "Book", d: "Pick a slot, give your area, add notes." },
              { icon: Users, t: "We match", d: "We assign the best verified pro." },
              { icon: BadgeCheck, t: "Guarantee", d: "Pay after work is done. Re-do if needed." },
            ].map((s, i) => (
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
        <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">For providers</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-4">
          {[
            { icon: ClipboardList, t: "Apply", d: "Submit your details and documents." },
            { icon: ShieldCheck, t: "Get verified", d: "We review and approve in 2–5 days." },
            { icon: Sparkles, t: "Receive jobs", d: "We send qualified leads in your area." },
            { icon: Wallet, t: "Get paid", d: "Weekly payouts. We handle billing." },
          ].map((s, i) => (
            <div key={s.t} className="relative">
              <span className="text-5xl font-bold text-primary/15">{String(i + 1).padStart(2, "0")}</span>
              <s.icon className="absolute right-2 top-2 h-5 w-5 text-primary" />
              <h3 className="mt-2 text-base font-semibold text-foreground">{s.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-3">
          <Link to="/book" className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft">Book a Service <ArrowRight className="h-4 w-4" /></Link>
          <Link to="/become-provider" className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted">Become a Provider</Link>
          <Link to="/contact" className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted"><Headphones className="h-4 w-4 text-primary" /> Talk to support</Link>
        </div>
      </section>
    </SiteShell>
  );
}
