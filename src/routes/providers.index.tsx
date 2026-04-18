import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { PageHeader } from "@/components/page-header";
import { ProviderCard } from "@/components/provider-card";
import { providers } from "@/data/providers";

export const Route = createFileRoute("/providers/")({
  head: () => ({
    meta: [
      { title: "Verified Service Providers in Dhaka — Shebabd" },
      { name: "description", content: "Browse top-rated, verified service providers across Dhaka. Compare ratings, response times and coverage areas." },
      { property: "og:title", content: "Verified Service Providers in Dhaka — Shebabd" },
      { property: "og:description", content: "Top-rated, background-checked professionals across all categories." },
    ],
  }),
  component: ProvidersPage,
});

function ProvidersPage() {
  return (
    <SiteShell>
      <PageHeader
        eyebrow="Providers"
        title={<>Verified pros, <span className="text-gradient-primary">ranked by real customers</span></>}
        description="Every provider on Shebabd is ID-verified, background-checked and rated only by customers who have completed a booking."
      />
      <section className="container-page py-12">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {providers.map((p) => <ProviderCard key={p.slug} provider={p} />)}
        </div>
      </section>
    </SiteShell>
  );
}
