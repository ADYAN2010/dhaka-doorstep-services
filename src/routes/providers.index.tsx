import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteShell } from "@/components/site-shell";
import { PageHeader } from "@/components/page-header";
import { ProviderCard } from "@/components/provider-card";
import { RealProviderCard, type RealProvider } from "@/components/real-provider-card";
import { providers } from "@/data/providers";
import { supabase } from "@/integrations/supabase/client";

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
  const [realProviders, setRealProviders] = useState<RealProvider[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Approved providers from the DB
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, area, avatar_url")
        .eq("provider_status", "approved")
        .limit(60);

      const list = (profs ?? []) as Array<{
        id: string;
        full_name: string;
        area: string | null;
        avatar_url: string | null;
      }>;

      if (list.length === 0) {
        if (!cancelled) setRealProviders([]);
        return;
      }

      const ids = list.map((p) => p.id);
      const [{ data: cats }, { data: ars }, { data: stats }] = await Promise.all([
        supabase.from("provider_categories").select("user_id, category").in("user_id", ids),
        supabase.from("provider_areas").select("user_id, area").in("user_id", ids),
        supabase
          .from("provider_review_stats")
          .select("provider_id, avg_rating, review_count")
          .in("provider_id", ids),
      ]);

      const catMap = new Map<string, string[]>();
      (cats ?? []).forEach((c) => {
        const arr = catMap.get(c.user_id) ?? [];
        arr.push(c.category);
        catMap.set(c.user_id, arr);
      });
      const areaMap = new Map<string, string[]>();
      (ars ?? []).forEach((a) => {
        const arr = areaMap.get(a.user_id) ?? [];
        arr.push(a.area);
        areaMap.set(a.user_id, arr);
      });
      const statMap = new Map<string, { avg: number | null; count: number }>();
      (stats ?? []).forEach((s) => {
        statMap.set(s.provider_id as string, {
          avg: s.avg_rating !== null ? Number(s.avg_rating) : null,
          count: s.review_count ?? 0,
        });
      });

      const merged: RealProvider[] = list.map((p) => ({
        id: p.id,
        full_name: p.full_name || "Provider",
        area: p.area,
        avatar_url: p.avatar_url,
        categories: catMap.get(p.id) ?? [],
        areas: areaMap.get(p.id) ?? [],
        avg_rating: statMap.get(p.id)?.avg ?? null,
        review_count: statMap.get(p.id)?.count ?? 0,
      }));

      if (!cancelled) setRealProviders(merged);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SiteShell>
      <PageHeader
        eyebrow="Providers"
        title={<>Verified pros, <span className="text-gradient-primary">ranked by real customers</span></>}
        description="Every provider on Shebabd is ID-verified, background-checked and rated only by customers who have completed a booking."
      />

      <section className="container-page py-12">
        {realProviders === null ? null : realProviders.length > 0 ? (
          <div className="mb-12">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Verified pros on Shebabd
                </h2>
                <p className="text-sm text-muted-foreground">
                  Tap the heart to save anyone for later.
                </p>
              </div>
              <span className="text-xs text-muted-foreground">
                {realProviders.length} approved
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {realProviders.map((p) => (
                <RealProviderCard key={p.id} provider={p} />
              ))}
            </div>
          </div>
        ) : null}

        <div>
          {realProviders && realProviders.length > 0 && (
            <h2 className="mb-4 text-xl font-semibold text-foreground">Featured profiles</h2>
          )}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {providers.map((p) => <ProviderCard key={p.slug} provider={p} />)}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
