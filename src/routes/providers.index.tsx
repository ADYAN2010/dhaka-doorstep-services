import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, SlidersHorizontal, Users } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { PageHeader } from "@/components/page-header";
import { RealProviderCard, type RealProvider } from "@/components/real-provider-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categories as ALL_CATEGORIES } from "@/data/categories";
import { areas as ALL_AREAS } from "@/data/areas";
import { supabase } from "@/integrations/supabase/client";
import { buildSeo, OG } from "@/lib/seo";

export const Route = createFileRoute("/providers/")({
  component: ProvidersPage,
  head: () => ({
    ...buildSeo({
      title: "Verified service providers in Dhaka — Shebabd",
      description:
        "Browse trusted, background-checked professionals across Dhaka. Filter by service category and area, read real reviews, and book in minutes.",
      canonical: "/providers",
      image: OG.providers,
    }),
  }),
});

type Filter = {
  q: string;
  category: string; // slug or "all"
  area: string; // slug or "all"
};

function ProvidersPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<RealProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>({ q: "", category: "all", area: "all" });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Approved providers (profiles)
        const { data: profiles, error: pErr } = await supabase
          .from("profiles")
          .select("id, full_name, area, avatar_url, provider_status")
          .eq("provider_status", "approved")
          .order("full_name");
        if (pErr) throw pErr;

        const ids = (profiles ?? []).map((p) => p.id);
        if (ids.length === 0) {
          if (!cancelled) {
            setProviders([]);
            setLoading(false);
          }
          return;
        }

        // 2. Categories, areas, review stats — in parallel.
        const [catsRes, areasRes, statsRes] = await Promise.all([
          supabase.from("provider_categories").select("user_id, category").in("user_id", ids),
          supabase.from("provider_areas").select("user_id, area").in("user_id", ids),
          supabase
            .from("provider_review_stats")
            .select("provider_id, avg_rating, review_count")
            .in("provider_id", ids),
        ]);

        if (catsRes.error) throw catsRes.error;
        if (areasRes.error) throw areasRes.error;
        if (statsRes.error) throw statsRes.error;

        const catMap = new Map<string, string[]>();
        for (const row of catsRes.data ?? []) {
          const arr = catMap.get(row.user_id) ?? [];
          arr.push(row.category);
          catMap.set(row.user_id, arr);
        }
        const areaMap = new Map<string, string[]>();
        for (const row of areasRes.data ?? []) {
          const arr = areaMap.get(row.user_id) ?? [];
          arr.push(row.area);
          areaMap.set(row.user_id, arr);
        }
        const statsMap = new Map<string, { avg: number | null; count: number }>();
        for (const row of statsRes.data ?? []) {
          if (!row.provider_id) continue;
          statsMap.set(row.provider_id, {
            avg: row.avg_rating !== null ? Number(row.avg_rating) : null,
            count: Number(row.review_count ?? 0),
          });
        }

        const rows: RealProvider[] = (profiles ?? []).map((p) => ({
          id: p.id,
          full_name: p.full_name || "Verified provider",
          area: p.area,
          avatar_url: p.avatar_url,
          categories: catMap.get(p.id) ?? [],
          areas: areaMap.get(p.id) ?? [],
          avg_rating: statsMap.get(p.id)?.avg ?? null,
          review_count: statsMap.get(p.id)?.count ?? 0,
        }));

        if (!cancelled) {
          setProviders(rows);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load providers");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = filter.q.trim().toLowerCase();
    return providers.filter((p) => {
      if (filter.category !== "all" && !p.categories.includes(filter.category)) return false;
      if (filter.area !== "all" && !p.areas.includes(filter.area)) return false;
      if (!q) return true;
      return (
        p.full_name.toLowerCase().includes(q) ||
        p.categories.some((c) => c.toLowerCase().includes(q)) ||
        p.areas.some((a) => a.toLowerCase().includes(q))
      );
    });
  }, [providers, filter]);

  return (
    <SiteShell>
      <PageHeader
        eyebrow="Verified pros"
        title="Find a verified service provider"
        description="Browse background-checked professionals across Dhaka. Filter by service or area, then book in minutes."
      />

      <section className="container-page py-10">
        <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-[1fr_220px_220px_auto] md:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filter.q}
              onChange={(e) => setFilter((f) => ({ ...f, q: e.target.value }))}
              placeholder="Search by name, service, or area"
              className="pl-9"
            />
          </div>
          <Select
            value={filter.category}
            onValueChange={(v) => setFilter((f) => ({ ...f, category: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="All services" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All services</SelectItem>
              {ALL_CATEGORIES.map((c) => (
                <SelectItem key={c.slug} value={c.slug}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filter.area}
            onValueChange={(v) => setFilter((f) => ({ ...f, area: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="All areas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All areas</SelectItem>
              {ALL_AREAS.map((a) => (
                <SelectItem key={a.slug} value={a.slug}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setFilter({ q: "", category: "all", area: "all" })}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" /> Reset
          </Button>
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="flex items-center justify-center py-24 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading providers…
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
              <p className="text-sm font-semibold text-destructive">Couldn't load providers</p>
              <p className="mt-1 text-xs text-muted-foreground">{error}</p>
              <Button className="mt-4" variant="outline" onClick={() => router.invalidate()}>
                Retry
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
              <Users className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-semibold text-foreground">
                No providers match your filters
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try clearing filters or browsing by service category.
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setFilter({ q: "", category: "all", area: "all" })}
                >
                  Clear filters
                </Button>
                <Link to="/services">
                  <Button>Browse services</Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <p className="mb-4 text-xs text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
                {filtered.length === 1 ? "provider" : "providers"}
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((p) => (
                  <RealProviderCard key={p.id} provider={p} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
