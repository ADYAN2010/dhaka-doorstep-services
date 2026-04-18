import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { PageHeader } from "@/components/page-header";
import { ProviderCard } from "@/components/provider-card";
import { RealProviderCard, type RealProvider } from "@/components/real-provider-card";
import { providers } from "@/data/providers";
import { categories } from "@/data/categories";
import { areas } from "@/data/areas";
import { supabase } from "@/integrations/supabase/client";
import { buildSeo, OG } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/providers/")({
  head: () =>
    buildSeo({
      title: "Verified Service Providers in Dhaka — Shebabd",
      description:
        "Browse top-rated, verified service providers across Dhaka. Compare ratings, response times and coverage areas. Background-checked professionals across all categories.",
      canonical: "/providers",
      image: OG.providers,
    }),
  component: ProvidersPage,
});

type Sort = "rating" | "reviews" | "experience" | "name";

function ProvidersPage() {
  const [realProviders, setRealProviders] = useState<RealProvider[] | null>(null);

  // Filters
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [area, setArea] = useState("all");
  const [minRating, setMinRating] = useState("all");
  const [verifiedOnly, setVerifiedOnly] = useState("all"); // all | verified | top
  const [sort, setSort] = useState<Sort>("rating");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, area, avatar_url")
        .eq("provider_status", "approved")
        .limit(60);

      const list = (profs ?? []) as Array<{
        id: string; full_name: string; area: string | null; avatar_url: string | null;
      }>;

      if (list.length === 0) { if (!cancelled) setRealProviders([]); return; }

      const ids = list.map((p) => p.id);
      const [{ data: cats }, { data: ars }, { data: stats }] = await Promise.all([
        supabase.from("provider_categories").select("user_id, category").in("user_id", ids),
        supabase.from("provider_areas").select("user_id, area").in("user_id", ids),
        supabase.from("provider_review_stats").select("provider_id, avg_rating, review_count").in("provider_id", ids),
      ]);

      const catMap = new Map<string, string[]>();
      (cats ?? []).forEach((c) => { const arr = catMap.get(c.user_id) ?? []; arr.push(c.category); catMap.set(c.user_id, arr); });
      const areaMap = new Map<string, string[]>();
      (ars ?? []).forEach((a) => { const arr = areaMap.get(a.user_id) ?? []; arr.push(a.area); areaMap.set(a.user_id, arr); });
      const statMap = new Map<string, { avg: number | null; count: number }>();
      (stats ?? []).forEach((s) => {
        statMap.set(s.provider_id as string, {
          avg: s.avg_rating !== null ? Number(s.avg_rating) : null,
          count: s.review_count ?? 0,
        });
      });

      const merged: RealProvider[] = list.map((p) => ({
        id: p.id, full_name: p.full_name || "Provider", area: p.area, avatar_url: p.avatar_url,
        categories: catMap.get(p.id) ?? [], areas: areaMap.get(p.id) ?? [],
        avg_rating: statMap.get(p.id)?.avg ?? null, review_count: statMap.get(p.id)?.count ?? 0,
      }));
      if (!cancelled) setRealProviders(merged);
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let res = providers.filter((p) => {
      if (cat !== "all" && p.categorySlug !== cat) return false;
      if (area !== "all" && !p.areas.includes(area)) return false;
      if (minRating !== "all" && p.rating < Number(minRating)) return false;
      if (verifiedOnly === "verified" && !p.verified) return false;
      if (verifiedOnly === "top" && !p.topRated) return false;
      if (needle) {
        const hay = `${p.name} ${p.businessName ?? ""} ${p.categoryName} ${(p.services ?? []).join(" ")}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
    res = [...res].sort((a, b) => {
      switch (sort) {
        case "reviews": return b.reviews - a.reviews;
        case "experience": return b.yearsExperience - a.yearsExperience;
        case "name": return (a.businessName ?? a.name).localeCompare(b.businessName ?? b.name);
        default: return b.rating - a.rating;
      }
    });
    return res;
  }, [q, cat, area, minRating, verifiedOnly, sort]);

  const reset = () => {
    setQ(""); setCat("all"); setArea("all"); setMinRating("all"); setVerifiedOnly("all"); setSort("rating");
  };

  const activeFilters =
    (q ? 1 : 0) + (cat !== "all" ? 1 : 0) + (area !== "all" ? 1 : 0) +
    (minRating !== "all" ? 1 : 0) + (verifiedOnly !== "all" ? 1 : 0);

  return (
    <SiteShell>
      <PageHeader
        eyebrow="Providers"
        title={<>Verified pros, <span className="text-gradient-primary">ranked by real customers</span></>}
        description="Every provider on Shebabd is ID-verified, background-checked and rated only by customers who have completed a booking."
      />

      <div className="container-page py-8 md:py-10">
        {/* Filter bar */}
        <div className="rounded-2xl border border-border bg-card p-3 shadow-soft md:p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex flex-1 items-center gap-2 rounded-xl bg-background px-3 py-2.5">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, business or service"
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                aria-label="Search providers"
              />
              {q && (
                <button onClick={() => setQ("")} className="text-muted-foreground hover:text-foreground" aria-label="Clear search">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
                <SelectTrigger className="w-full md:w-[200px]"><SelectValue placeholder="Sort by" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Highest rated</SelectItem>
                  <SelectItem value="reviews">Most reviewed</SelectItem>
                  <SelectItem value="experience">Most experienced</SelectItem>
                  <SelectItem value="name">Name (A–Z)</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => setFiltersOpen((v) => !v)} className="md:hidden">
                <SlidersHorizontal className="h-4 w-4" /> Filters
                {activeFilters > 0 && <span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{activeFilters}</span>}
              </Button>
            </div>
          </div>

          <div className={cn("mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4", !filtersOpen && "hidden md:grid")}>
            <Select value={cat} onValueChange={setCat}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={area} onValueChange={setArea}>
              <SelectTrigger><SelectValue placeholder="Area" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All areas in Dhaka</SelectItem>
                {areas.map((a) => <SelectItem key={a.slug} value={a.slug}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={minRating} onValueChange={setMinRating}>
              <SelectTrigger><SelectValue placeholder="Min rating" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any rating</SelectItem>
                <SelectItem value="4.8">4.8 ★ & up</SelectItem>
                <SelectItem value="4.5">4.5 ★ & up</SelectItem>
                <SelectItem value="4.0">4.0 ★ & up</SelectItem>
              </SelectContent>
            </Select>
            <Select value={verifiedOnly} onValueChange={setVerifiedOnly}>
              <SelectTrigger><SelectValue placeholder="Verification" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All providers</SelectItem>
                <SelectItem value="verified">Verified only</SelectItem>
                <SelectItem value="top">Top-rated badge</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {activeFilters > 0 && (
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>{filtered.length} {filtered.length === 1 ? "provider" : "providers"} match</span>
              <button onClick={reset} className="font-semibold text-primary hover:underline">Reset filters</button>
            </div>
          )}
        </div>

        {/* Real (DB) providers */}
        {realProviders === null ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-5">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <Skeleton className="mt-3 h-4 w-3/4" />
                <Skeleton className="mt-2 h-3 w-1/2" />
                <Skeleton className="mt-4 h-9 w-full" />
              </div>
            ))}
          </div>
        ) : realProviders.length > 0 ? (
          <div className="mt-8">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Verified pros on Shebabd</h2>
                <p className="text-sm text-muted-foreground">Tap the heart to save anyone for later.</p>
              </div>
              <span className="text-xs text-muted-foreground">{realProviders.length} approved</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {realProviders.map((p) => <RealProviderCard key={p.id} provider={p} />)}
            </div>
          </div>
        ) : null}

        {/* Featured / seed providers */}
        <div className="mt-10">
          {realProviders && realProviders.length > 0 && (
            <h2 className="mb-4 text-xl font-semibold text-foreground">Featured profiles</h2>
          )}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="mt-3 text-lg font-semibold text-foreground">No providers match your filters</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">Try removing a filter, choosing a different area, or searching with a broader keyword.</p>
              <Button onClick={reset} variant="outline" className="mt-4">Reset filters</Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => <ProviderCard key={p.slug} provider={p} />)}
            </div>
          )}
        </div>
      </div>
    </SiteShell>
  );
}
