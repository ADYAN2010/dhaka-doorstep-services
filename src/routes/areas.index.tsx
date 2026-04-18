import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MapPin } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { PageHeader } from "@/components/page-header";
import { CoverageMap } from "@/components/coverage-map";
import { Reveal } from "@/components/reveal";
import { areas } from "@/data/areas";
import { buildSeo, OG } from "@/lib/seo";

export const Route = createFileRoute("/areas/")({
  head: () =>
    buildSeo({
      title: "Service Areas in Dhaka — Now Serving 11 Neighborhoods | Shebabd",
      description:
        "We cover every major Dhaka neighborhood — Dhanmondi, Gulshan, Banani, Uttara, Mirpur and more. Find providers and services available in your area.",
      canonical: "/areas",
      image: OG.areas,
    }),
  component: AreasPage,
});

function AreasPage() {
  return (
    <SiteShell>
      <PageHeader
        eyebrow="Coverage"
        title={<>Now serving <span className="text-gradient-primary">11 areas across Dhaka</span></>}
        description="We're live across central, north, east and old Dhaka. Coming next: Chattogram, Sylhet, Rajshahi, Khulna and all 64 districts."
      />

      <section className="container-page pt-4">
        <Reveal>
          <CoverageMap />
        </Reveal>
      </section>

      <section className="container-page py-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">All neighborhoods</h2>
          <Link to="/services" className="text-sm font-semibold text-primary hover:underline">Browse all services →</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((a, i) => (
            <Reveal key={a.slug} delay={i * 40}>
              <Link
                to="/dhaka/$area"
                params={{ area: a.slug }}
                className="group block rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-primary" /> {a.zone} · {a.postal}
                </div>
                <h3 className="mt-2 text-xl font-semibold text-card-foreground">{a.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{a.blurb}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:underline">
                  See providers in {a.name} <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
