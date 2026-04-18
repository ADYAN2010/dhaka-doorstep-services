import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MapPin } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { PageHeader } from "@/components/page-header";
import { areas } from "@/data/areas";

export const Route = createFileRoute("/areas/")({
  head: () => ({
    meta: [
      { title: "Service Areas in Dhaka — Shebabd" },
      { name: "description", content: "We cover every major Dhaka neighborhood. Find providers and services available in your area." },
      { property: "og:title", content: "Service Areas in Dhaka — Shebabd" },
      { property: "og:description", content: "11 major Dhaka neighborhoods covered today. Expanding nationwide." },
    ],
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
      <section className="container-page py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((a) => (
            <Link
              key={a.slug}
              to="/dhaka/$area"
              params={{ area: a.slug }}
              className="group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated"
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
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
