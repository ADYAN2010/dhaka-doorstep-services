import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { listBookings } from "@/utils/admin.functions";
import type { BookingRow } from "@/server/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/admin/mysql/bookings")({
  component: MysqlBookings,
});

const FILTERS = ["all", "new", "confirmed", "assigned", "completed", "cancelled"] as const;
type Filter = (typeof FILTERS)[number];

function MysqlBookings() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listBookings({ data: { limit: 200, status: filter === "all" ? undefined : filter } })
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

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Bookings</h1>
          <p className="mt-1 text-sm text-muted-foreground">{rows.length.toLocaleString()} loaded</p>
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
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>When</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    No bookings.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.full_name}</TableCell>
                    <TableCell>{r.phone}</TableCell>
                    <TableCell className="capitalize">{r.category}{r.service ? ` · ${r.service}` : ""}</TableCell>
                    <TableCell className="capitalize">{r.area}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(r.preferred_date).toLocaleDateString()} · {r.preferred_time_slot}
                    </TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusClass(r.status)}`}>
                        {r.status}
                      </span>
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

function statusClass(s: BookingRow["status"]) {
  switch (s) {
    case "new":       return "bg-sky-500/15 text-sky-700 dark:text-sky-300";
    case "confirmed": return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
    case "assigned":  return "bg-violet-500/15 text-violet-700 dark:text-violet-300";
    case "completed": return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
    case "cancelled": return "bg-rose-500/15 text-rose-700 dark:text-rose-300";
  }
}
