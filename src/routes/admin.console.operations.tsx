import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ClipboardList, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SectionCard, StatTile } from "@/components/admin/primitives";
import { ErrorState } from "@/components/admin/empty-state";

export const Route = createFileRoute("/admin/console/operations")({
  component: OperationsPage,
});

type Counts = {
  newCount: number;
  assigned: number;
  completedToday: number;
  cancelledToday: number;
  unassigned: number;
  todayTotal: number;
};

function OperationsPage() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const today = new Date().toISOString().slice(0, 10);
      const queries = await Promise.all([
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "assigned"),
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "completed").gte("updated_at", today),
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "cancelled").gte("updated_at", today),
        supabase.from("bookings").select("id", { count: "exact", head: true }).is("provider_id", null),
        supabase.from("bookings").select("id", { count: "exact", head: true }).gte("created_at", today),
      ]);
      const err = queries.find((q) => q.error)?.error;
      if (err) {
        setError(err.message);
      } else {
        setCounts({
          newCount: queries[0].count ?? 0,
          assigned: queries[1].count ?? 0,
          completedToday: queries[2].count ?? 0,
          cancelledToday: queries[3].count ?? 0,
          unassigned: queries[4].count ?? 0,
          todayTotal: queries[5].count ?? 0,
        });
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Marketplace"
        title="Operations"
        description="Live snapshot of booking activity across the platform."
        breadcrumbs={[{ label: "Admin", to: "/admin/console" }, { label: "Operations" }]}
      />

      {loading ? (
        <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : error ? (
        <ErrorState description={error} />
      ) : counts ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatTile icon={ClipboardList} label="New leads" value={counts.newCount} hint="Awaiting acceptance" tone="info" />
            <StatTile icon={Activity} label="Assigned" value={counts.assigned} hint="In progress" tone="primary" />
            <StatTile icon={Clock} label="Unassigned" value={counts.unassigned} hint="Need a provider" tone="warning" />
            <StatTile icon={CheckCircle2} label="Completed today" value={counts.completedToday} tone="success" />
            <StatTile icon={XCircle} label="Cancelled today" value={counts.cancelledToday} tone="danger" />
            <StatTile icon={Activity} label="Created today" value={counts.todayTotal} />
          </div>

          <SectionCard title="Quick actions">
            <div className="grid gap-3 sm:grid-cols-3">
              <Link to="/admin/console/bookings" className="rounded-xl border border-border bg-card p-4 text-sm font-medium shadow-soft transition-colors hover:border-primary/40">
                Review bookings →
              </Link>
              <Link to="/admin/console/applications" className="rounded-xl border border-border bg-card p-4 text-sm font-medium shadow-soft transition-colors hover:border-primary/40">
                Approve providers →
              </Link>
              <Link to="/admin/console/finance" className="rounded-xl border border-border bg-card p-4 text-sm font-medium shadow-soft transition-colors hover:border-primary/40">
                Finance & payouts →
              </Link>
            </div>
          </SectionCard>
        </>
      ) : null}
    </div>
  );
}
