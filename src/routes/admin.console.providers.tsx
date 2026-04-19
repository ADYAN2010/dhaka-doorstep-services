/**
 * Admin → Providers directory
 * Calls GET /api/providers?all=1 (admin variant) so all statuses are returned.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Briefcase, Loader2, Search, MapPin, Star, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { providersAdminApi, type AdminProvider } from "@/lib/admin-api";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/admin/console/providers")({
  component: ProvidersPage,
});

const SORTS = [
  { value: "rating_desc", label: "Top rated" },
  { value: "reviews_desc", label: "Most reviewed" },
  { value: "jobs_desc", label: "Most jobs" },
  { value: "newest", label: "Newest" },
] as const;

function ProvidersPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<AdminProvider[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<(typeof SORTS)[number]["value"]>("rating_desc");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    providersAdminApi
      .list({ all: true, q: q || undefined, sort, pageSize: 100 })
      .then((res) => {
        if (cancelled) return;
        setRows(res.data ?? []);
        setTotal(res.total ?? 0);
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 401) {
          return navigate({ to: "/admin/backend/login" });
        }
        toast.error(e instanceof Error ? e.message : "Failed to load providers");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [navigate, q, sort, tick]);

  const counts = useMemo(
    () => ({
      total,
      verified: rows.filter((r) => r.is_verified).length,
      topRated: rows.filter((r) => r.is_top_rated).length,
    }),
    [rows, total],
  );

  return (
    <div>
      <AdminPageHeader
        eyebrow="Providers"
        title="Providers directory"
        description="All providers (any status) with their coverage and ratings, live from /api/providers?all=1."
        actions={
          <Button variant="outline" onClick={() => setTick((t) => t + 1)} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Total providers" value={counts.total} />
        <Stat label="Verified" value={counts.verified} />
        <Stat label="Top rated" value={counts.topRated} accent={counts.topRated > 0} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-2">
          {SORTS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSort(s.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                sort === s.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={Briefcase} title={q ? "No matches" : "No providers"} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Coverage</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead className="text-right">Rating</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium">{p.full_name}</div>
                      {p.business_name && (
                        <div className="text-xs text-muted-foreground">{p.business_name}</div>
                      )}
                      <div className="font-mono text-[10px] text-muted-foreground">
                        {p.id.slice(0, 8)}…
                      </div>
                    </TableCell>
                    <TableCell className="text-xs capitalize text-muted-foreground">
                      {p.provider_type}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm capitalize">{p.primary_category ?? "—"}</div>
                      {p.primary_area && (
                        <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {p.primary_area}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          p.is_verified
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {p.is_verified ? "Verified" : "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1 text-sm font-medium">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {Number(p.rating).toFixed(1)}
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({p.review_count})
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-4 shadow-soft ${
        accent ? "border-primary/30 bg-primary/5" : "border-border bg-card"
      }`}
    >
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value.toLocaleString()}</div>
    </div>
  );
}
