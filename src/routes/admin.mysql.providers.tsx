import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { listProviders } from "@/utils/admin.functions";
import type { ProviderRow } from "@/server/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/admin/mysql/providers")({
  component: MysqlProviders,
});

const FILTERS = ["all", "approved", "pending", "rejected", "suspended"] as const;
type Filter = (typeof FILTERS)[number];

function MysqlProviders() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<ProviderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listProviders({ data: { limit: 200, status: filter === "all" ? undefined : filter } })
      .then((data) => {
        if (cancelled) return;
        setRows(data ?? []);
        setLoading(false);
      })
      .catch((e: Error) => {
        if (cancelled) return;
        if (e.message.includes("Unauthorized")) return navigate({ to: "/admin/mysql/login" });
        setErr(e.message);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [navigate, filter]);

  const counts = useMemo(() => ({
    total: rows.length,
    approved: rows.filter((r) => r.status === "approved").length,
    pending: rows.filter((r) => r.status === "pending").length,
  }), [rows]);

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Providers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {counts.total.toLocaleString()} loaded · {counts.approved} approved · {counts.pending} pending
          </p>
        </div>
        <div className="flex rounded-full border border-border bg-card p-1 text-xs">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 capitalize ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : err ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
          <strong>Failed to load.</strong><p className="mt-1">{err}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    No providers in this view.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">{r.email ?? "—"}</TableCell>
                    <TableCell>{r.phone ?? "—"}</TableCell>
                    <TableCell className="capitalize">{r.primary_area ?? "—"}</TableCell>
                    <TableCell className="capitalize">{r.primary_category ?? "—"}</TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusClass(r.status)}`}>
                        {r.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {Number(r.rating).toFixed(1)} · {r.review_count}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
