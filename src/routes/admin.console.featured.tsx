import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowUp,
  Loader2,
  Search,
  Sparkles,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SectionCard } from "@/components/admin/primitives";
import { EmptyState, ErrorState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/console/featured")({
  component: FeaturedServicesAdminPage,
  head: () => ({
    meta: [
      { title: "Featured services · Admin · Shebabd" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type ServiceRow = {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  starting_price: number | null;
  unit: string | null;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  category: { id: string; slug: string; name: string } | null;
};

const FEATURED_LIMIT = 12;

function FeaturedServicesAdminPage() {
  const [allServices, setAllServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("services")
      .select(
        "id, slug, name, short_description, starting_price, unit, is_active, is_featured, display_order, category:categories(id, slug, name)",
      )
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("display_order", { ascending: true })
      .order("name", { ascending: true })
      .limit(1000);

    if (error) setError(error.message);
    else setAllServices((data ?? []) as unknown as ServiceRow[]);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const featured = useMemo(
    () =>
      [...allServices.filter((s) => s.is_featured)].sort(
        (a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name),
      ),
    [allServices],
  );

  const filteredCandidates = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const pool = allServices.filter((s) => !s.is_featured);
    if (!needle) return pool.slice(0, 50);
    return pool
      .filter(
        (s) =>
          s.name.toLowerCase().includes(needle) ||
          s.category?.name.toLowerCase().includes(needle) ||
          s.slug.toLowerCase().includes(needle),
      )
      .slice(0, 50);
  }, [allServices, search]);

  async function toggleFeatured(row: ServiceRow, value: boolean) {
    if (value && featured.length >= FEATURED_LIMIT) {
      toast.error(`You can feature at most ${FEATURED_LIMIT} services on the homepage.`);
      return;
    }
    setSavingId(row.id);

    // Assign next display_order when adding to featured.
    const patch: { is_featured: boolean; display_order?: number } = { is_featured: value };
    if (value) {
      const maxOrder = featured.reduce((m, s) => Math.max(m, s.display_order), 0);
      patch.display_order = maxOrder + 1;
    }

    const { error } = await supabase.from("services").update(patch).eq("id", row.id);
    setSavingId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    setAllServices((rs) =>
      rs.map((r) =>
        r.id === row.id
          ? { ...r, is_featured: value, display_order: patch.display_order ?? r.display_order }
          : r,
      ),
    );
    toast.success(value ? "Added to featured" : "Removed from featured");
  }

  async function move(row: ServiceRow, dir: -1 | 1) {
    const idx = featured.findIndex((s) => s.id === row.id);
    const swap = featured[idx + dir];
    if (!swap) return;

    setReordering(true);
    // Swap display_order values
    const a = { id: row.id, order: swap.display_order };
    const b = { id: swap.id, order: row.display_order };

    // Optimistic
    setAllServices((rs) =>
      rs.map((r) => {
        if (r.id === a.id) return { ...r, display_order: a.order };
        if (r.id === b.id) return { ...r, display_order: b.order };
        return r;
      }),
    );

    const [r1, r2] = await Promise.all([
      supabase.from("services").update({ display_order: a.order }).eq("id", a.id),
      supabase.from("services").update({ display_order: b.order }).eq("id", b.id),
    ]);

    setReordering(false);
    if (r1.error || r2.error) {
      toast.error(r1.error?.message || r2.error?.message || "Reorder failed");
      void load();
      return;
    }
    toast.success("Order updated");
  }

  async function normalizeOrder() {
    setReordering(true);
    const updates = featured.map((s, i) =>
      supabase
        .from("services")
        .update({ display_order: i + 1 })
        .eq("id", s.id),
    );
    const results = await Promise.all(updates);
    setReordering(false);
    const failed = results.find((r) => r.error);
    if (failed?.error) {
      toast.error(failed.error.message);
      return;
    }
    setAllServices((rs) =>
      rs.map((r) => {
        const idx = featured.findIndex((f) => f.id === r.id);
        return idx >= 0 ? { ...r, display_order: idx + 1 } : r;
      }),
    );
    toast.success("Order normalized");
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Homepage"
        title="Featured services"
        description={`Choose up to ${FEATURED_LIMIT} services to spotlight on the homepage. Reorder to control the appearance order.`}
        breadcrumbs={[
          { label: "Admin", to: "/admin/console" },
          { label: "Featured services" },
        ]}
      />

      {/* CURRENTLY FEATURED */}
      <SectionCard
        title="Homepage lineup"
        icon={Star}
        description={`${featured.length} of ${FEATURED_LIMIT} slots used`}
        actions={
          <Button
            size="sm"
            variant="outline"
            onClick={normalizeOrder}
            disabled={reordering || featured.length === 0}
          >
            Normalize order
          </Button>
        }
        padded={false}
      >
        {loading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="p-5">
            <ErrorState description={error} />
          </div>
        ) : featured.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={Sparkles}
              title="No featured services yet"
              description="Pick services from the list below to spotlight them on the homepage."
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {featured.map((s, i) => (
              <li key={s.id} className="flex items-center gap-3 px-4 py-3">
                <span className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{s.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {s.category?.name ?? "—"}
                    {s.starting_price ? ` · ৳${s.starting_price}` : " · Get a quote"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => move(s, -1)}
                    disabled={i === 0 || reordering}
                    aria-label="Move up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => move(s, 1)}
                    disabled={i === featured.length - 1 || reordering}
                    aria-label="Move down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Switch
                    checked
                    onCheckedChange={() => toggleFeatured(s, false)}
                    disabled={savingId === s.id}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {/* CATALOG PICKER */}
      <SectionCard
        title="Add from catalog"
        description="Search the full 500-service catalog and toggle to add to homepage."
        padded={false}
      >
        <div className="border-b border-border p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by service, category or slug…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid place-items-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={Search}
              title="No matches"
              description="Try a different search term."
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filteredCandidates.map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">{s.name}</p>
                    {s.category && (
                      <Badge variant="secondary" className="shrink-0 text-[10px]">
                        {s.category.name}
                      </Badge>
                    )}
                  </div>
                  {s.short_description && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {s.short_description}
                    </p>
                  )}
                </div>
                <Switch
                  checked={false}
                  onCheckedChange={() => toggleFeatured(s, true)}
                  disabled={savingId === s.id || featured.length >= FEATURED_LIMIT}
                />
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
