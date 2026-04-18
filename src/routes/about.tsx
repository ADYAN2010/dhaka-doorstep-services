import { createFileRoute, Link } from "@tanstack/react-router";
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
  return (
    <SiteShell>
      <PageHeader
        eyebrow="About us"
        title={<>Built in Bangladesh, <span className="text-gradient-primary">for Bangladesh</span></>}
        description="We're building the country's most trusted service platform — starting in Dhaka, scaling to every district. Our model is simple: Provider → We → Consumer."
      />

      <section className="container-page py-14">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Target, t: "Our mission", d: "Make every kind of service in Bangladesh easy to find, trust, and book — in minutes, not days." },
            { icon: Heart, t: "Our values", d: "Honesty in pricing. Quality in every booking. Respect for both customers and providers." },
            { icon: Globe, t: "Our roadmap", d: "Dhaka first. Then Chattogram, Sylhet, Rajshahi, Khulna — and finally all 64 districts." },
          ].map((it) => (
            <div key={it.t} className="rounded-2xl border border-border bg-card p-6">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><it.icon className="h-5 w-5" /></span>
              <h3 className="mt-4 text-lg font-semibold text-card-foreground">{it.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{it.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Why we exist</h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Finding a reliable plumber, AC technician, or cleaner in Dhaka usually means asking neighbors, scrolling Facebook
            groups, and crossing your fingers. Skilled providers, on the other hand, struggle to find consistent work and
            customers who pay fairly. We&apos;re fixing both sides at once.
          </p>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Shebabd is the trusted middle layer. We verify every provider, train them on quality, market their services,
            handle bookings and payments, and back every job with our service guarantee. The result: confidence for customers,
            and steady livelihoods for providers.
          </p>
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link to="/book" className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft">Book a Service <ArrowRight className="h-4 w-4" /></Link>
          <Link to="/become-provider" className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted">Become a Provider</Link>
        </div>
      </section>
    </SiteShell>
  );
}
