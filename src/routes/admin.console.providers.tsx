import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Briefcase, Loader2, Search, MapPin, Star } from "lucide-react";
import { toast } from "sonner";
import { listProviders } from "@/utils/admin.functions";
import type { ProviderRow } from "@/server/types";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/admin/console/providers")({
  component: ProvidersPage,
});

const FILTERS = ["all", "approved", "pending", "rejected", "suspended"] as const;
type Filter = (typeof FILTERS)[number];

function ProvidersPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<ProviderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");

  function load() {
    setLoading(true);
    listProviders({ data: { limit: 200, status: filter === "all" ? undefined : filter } })
      .then((data) => {
        setRows(data ?? []);
        setLoading(false);
      })
      .catch((e: Error) => {
        if (e.message.includes("Unauthorized")) return navigate({ to: "/admin/backend/login" });
        toast.error(e.message);
        setLoading(false);
      });
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listProviders({ data: { limit: 200, status: filter === "all" ? undefined : filter } })
      .then((data) => { if (!cancelled) { setRows(data ?? []); setLoading(false); } })
      .catch((e: Error) => {
        if (cancelled) return;
        if (e.message.includes("Unauthorized")) return navigate({ to: "/admin/backend/login" });
        toast.error(e.message);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [navigate, filter]);

  const filtered = useMemo(() => {
    if (!q) return rows;
    const t = q.toLowerCase();
    return rows.filter((p) => [p.full_name, p.phone, p.email, p.primary_area, p.primary_category].some((v) => v?.toLowerCase().includes(t)));
  }, [rows, q]);

  const counts = useMemo(() => ({
    total: rows.length,
    approved: rows.filter((r) => r.status === "approved").length,
    pending: rows.filter((r) => r.status === "pending").length,
  }), [rows]);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Providers"
        title="Providers directory"
        description="Every provider on the platform with their status, coverage, and ratings."
        actions={<Button variant="outline" onClick={load} disabled={loading}>{loading && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}Refresh</Button>}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Total providers" value={counts.total} />
        <Stat label="Approved" value={counts.approved} />
        <Stat label="Pending review" value={counts.pending} accent={counts.pending > 0} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                filter === f
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Briefcase} title={q ? "No matches" : "No providers"} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Coverage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Rating</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium">{p.full_name}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">{p.id.slice(0, 8)}…</div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div>{p.email ?? "—"}</div>
                      <div>{p.phone ?? "—"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm capitalize">{p.primary_category ?? "—"}</div>
                      {p.primary_area && (
                        <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />{p.primary_area}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusClass(p.status)}`}>
                        {p.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1 text-sm font-medium">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {Number(p.rating).toFixed(1)}
                        <span className="ml-1 text-xs text-muted-foreground">({p.review_count})</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</TableCell>
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

function statusClass(s: ProviderRow["status"]) {
  switch (s) {
    case "approved":  return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
    case "pending":   return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
    case "rejected":  return "bg-rose-500/15 text-rose-700 dark:text-rose-300";
    case "suspended": return "bg-muted text-muted-foreground";
  }
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 shadow-soft ${accent ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value.toLocaleString()}</div>
    </div>
  );
}
