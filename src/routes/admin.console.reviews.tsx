import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Star, Loader2, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/console/reviews")({
  component: ReviewsPage,
});

type Review = {
  id: string; rating: number; comment: string | null; created_at: string;
  provider_id: string; user_id: string; booking_id: string;
};
type Profile = { id: string; full_name: string };

function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [profiles, setProfiles] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "1" | "2" | "3" | "4" | "5">("all");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { toast.error(error.message); setLoading(false); return; }
    const list = (data ?? []) as Review[];
    setReviews(list);
    const ids = Array.from(new Set([...list.map((r) => r.provider_id), ...list.map((r) => r.user_id)]));
    if (ids.length) {
      const { data: p } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      const m = new Map<string, string>();
      (p ?? []).forEach((x: Profile) => m.set(x.id, x.full_name));
      setProfiles(m);
    }
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function remove(id: string) {
    if (!confirm("Remove this review?")) return;
    setBusy(id);
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    setBusy(null);
    if (error) return toast.error(error.message);
    setReviews((prev) => prev.filter((r) => r.id !== id));
    toast.success("Review removed");
  }

  const filtered = useMemo(() => {
    let list = reviews;
    if (filter !== "all") list = list.filter((r) => r.rating === Number(filter));
    if (q) {
      const t = q.toLowerCase();
      list = list.filter((r) =>
        (r.comment ?? "").toLowerCase().includes(t) ||
        (profiles.get(r.provider_id) ?? "").toLowerCase().includes(t) ||
        (profiles.get(r.user_id) ?? "").toLowerCase().includes(t),
      );
    }
    return list;
  }, [reviews, filter, q, profiles]);

  const stats = useMemo(() => {
    const total = reviews.length;
    const avg = total ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
    const breakdown = [5, 4, 3, 2, 1].map((n) => ({
      stars: n, count: reviews.filter((r) => r.rating === n).length,
    }));
    return { total, avg, breakdown };
  }, [reviews]);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Reviews"
        title="Ratings & reviews"
        description="Moderate reviews, spot trends, and remove abusive content."
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-[300px_1fr]">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="text-xs text-muted-foreground">Average rating</div>
          <div className="mt-1 flex items-end gap-1">
            <span className="text-4xl font-bold">{stats.avg.toFixed(1)}</span>
            <Star className="mb-1 h-5 w-5 fill-amber-400 text-amber-400" />
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{stats.total.toLocaleString()} total reviews</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Distribution</div>
          <div className="space-y-1.5">
            {stats.breakdown.map((b) => {
              const pct = stats.total ? (b.count / stats.total) * 100 : 0;
              return (
                <div key={b.stars} className="flex items-center gap-3 text-sm">
                  <span className="w-6 shrink-0 text-right text-xs text-muted-foreground">{b.stars}★</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">{b.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search reviews…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1">
          {(["all", "5", "4", "3", "2", "1"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {f === "all" ? "All" : `${f}★`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Star} title="No reviews" />
      ) : (
        <div className="grid gap-3">
          {filtered.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-4 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="font-medium">{profiles.get(r.user_id) ?? "Customer"}</span>
                    <span className="mx-2 text-muted-foreground">→</span>
                    <span className="font-medium">{profiles.get(r.provider_id) ?? "Provider"}</span>
                  </div>
                  {r.comment && <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>}
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove(r.id)} disabled={busy === r.id} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                  {busy === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
