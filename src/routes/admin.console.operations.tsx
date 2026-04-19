import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Activity, Loader2, Clock, AlertTriangle, CheckCircle2, TrendingUp,
  CalendarCheck, Users, Briefcase, ArrowRight,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { BookingStatusBadge } from "@/components/admin-badges";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/console/operations")({
  component: OperationsPage,
});

type Booking = {
  id: string; full_name: string; phone: string; category: string; area: string;
  preferred_date: string; preferred_time_slot: string; created_at: string;
  status: "new" | "confirmed" | "assigned" | "completed" | "cancelled";
  provider_id: string | null;
};
type Application = { id: string; full_name: string; category: string; created_at: string; status: string };

function OperationsPage() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [openTickets, setOpenTickets] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [b, a, t] = await Promise.all([
        supabase.from("bookings").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("provider_applications").select("id, full_name, category, created_at, status").eq("status", "new").order("created_at", { ascending: false }).limit(20),
        supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("handled", false),
      ]);
      if (cancelled) return;
      setBookings((b.data ?? []) as Booking[]);
      setApps((a.data ?? []) as Application[]);
      setOpenTickets(t.count ?? 0);
      setLoading(false);
    }
    void load();
    const i = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(i); };
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const stats = useMemo(() => {
    const todays = bookings.filter((b) => b.preferred_date === today);
    const unassigned = bookings.filter((b) => b.status === "new" && !b.provider_id);
    const assigned = bookings.filter((b) => b.status === "assigned" || b.status === "confirmed");
    const completed = bookings.filter((b) => b.status === "completed");
    // SLA: bookings older than 30 min still in 'new'
    const now = Date.now();
    const slaBreached = unassigned.filter((b) => now - new Date(b.created_at).getTime() > 30 * 60 * 1000);
    return { today: todays.length, unassigned: unassigned.length, assigned: assigned.length, completed: completed.length, slaBreached: slaBreached.length };
  }, [bookings, today]);

  const queue = useMemo(() => {
    return bookings
      .filter((b) => b.status === "new" && !b.provider_id)
      .slice(0, 8)
      .map((b) => {
        const ageMin = Math.floor((Date.now() - new Date(b.created_at).getTime()) / 60_000);
        let bucket: "fresh" | "warm" | "hot" = "fresh";
        if (ageMin > 30) bucket = "hot";
        else if (ageMin > 10) bucket = "warm";
        return { ...b, ageMin, bucket };
      });
  }, [bookings]);

  const recent = useMemo(() => bookings.slice(0, 6), [bookings]);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Operations"
        title="Today at a glance"
        description="Live operations console — pipeline health, SLA breaches, and queue priority."
        actions={<span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live · refreshes every 60s</span>}
      />

      {loading ? (
        <div className="grid place-items-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : (
        <>
          {/* KPI strip */}
          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Kpi icon={CalendarCheck} label="Today's bookings" value={stats.today} accent />
            <Kpi icon={Clock} label="Awaiting assign" value={stats.unassigned} highlight={stats.unassigned > 0} />
            <Kpi icon={AlertTriangle} label="SLA breached" value={stats.slaBreached} danger={stats.slaBreached > 0} />
            <Kpi icon={Activity} label="In progress" value={stats.assigned} />
            <Kpi icon={CheckCircle2} label="Completed" value={stats.completed} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Priority queue */}
            <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Priority queue</div>
                  <div className="text-base font-semibold">Unassigned bookings</div>
                </div>
                <Button variant="ghost" size="sm" asChild><Link to="/admin/console/bookings">All bookings <ArrowRight className="h-3.5 w-3.5" /></Link></Button>
              </div>
              {queue.length === 0 ? (
                <EmptyState icon={CheckCircle2} title="Queue is clear" description="No unassigned bookings — nice work." />
              ) : (
                <ul className="divide-y divide-border">
                  {queue.map((b) => (
                    <li key={b.id} className="flex items-center gap-3 px-5 py-3">
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                        b.bucket === "hot" ? "bg-destructive/15 text-destructive" :
                        b.bucket === "warm" ? "bg-amber-500/15 text-amber-700 dark:text-amber-400" :
                        "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                      }`}>
                        <Clock className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">{b.full_name}</span>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{b.category}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{b.area} · {b.preferred_time_slot}</div>
                      </div>
                      <span className={`text-xs font-semibold ${b.bucket === "hot" ? "text-destructive" : b.bucket === "warm" ? "text-amber-600" : "text-muted-foreground"}`}>
                        {b.ageMin < 60 ? `${b.ageMin}m` : `${Math.floor(b.ageMin / 60)}h ${b.ageMin % 60}m`} ago
                      </span>
                      <Button asChild size="sm" variant="outline"><Link to="/admin/console/bookings">Assign</Link></Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* System health */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">System health</div>
                <ul className="mt-3 space-y-2.5">
                  <Health label="Booking API" ok latency="142ms" />
                  <Health label="Auth service" ok latency="68ms" />
                  <Health label="Payment gateway" ok latency="312ms" />
                  <Health label="SMS / OTP" ok latency="220ms" />
                  <Health label="Background workers" ok latency="—" />
                </ul>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Inbox</div>
                  <Button asChild size="sm" variant="ghost"><Link to="/admin/console/support">Open <ArrowRight className="h-3 w-3" /></Link></Button>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><TrendingUp className="h-5 w-5" /></span>
                  <div>
                    <div className="text-2xl font-bold leading-none">{openTickets}</div>
                    <div className="text-xs text-muted-foreground">open tickets</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {/* New applications */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Provider intake</div>
                  <div className="text-base font-semibold">New applications</div>
                </div>
                <Button variant="ghost" size="sm" asChild><Link to="/admin/console/providers">Review <ArrowRight className="h-3.5 w-3.5" /></Link></Button>
              </div>
              {apps.length === 0 ? (
                <EmptyState icon={Briefcase} title="No new applications" />
              ) : (
                <ul className="divide-y divide-border">
                  {apps.slice(0, 6).map((a) => (
                    <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-violet-500/15 text-violet-700 dark:text-violet-400 text-xs font-bold">
                        {(a.full_name || "?").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{a.full_name}</div>
                        <div className="text-xs text-muted-foreground">{a.category} · {new Date(a.created_at).toLocaleDateString()}</div>
                      </div>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">New</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Recent activity */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recent activity</div>
                  <div className="text-base font-semibold">Latest bookings</div>
                </div>
                <Button variant="ghost" size="sm" asChild><Link to="/admin/console/bookings">View all <ArrowRight className="h-3.5 w-3.5" /></Link></Button>
              </div>
              {recent.length === 0 ? (
                <EmptyState icon={Users} title="No bookings yet" />
              ) : (
                <ul className="divide-y divide-border">
                  {recent.map((b) => (
                    <li key={b.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{b.full_name}</div>
                        <div className="text-xs text-muted-foreground">{b.category} · {b.area}</div>
                      </div>
                      <BookingStatusBadge status={b.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Kpi({ icon: Icon, label, value, accent, highlight, danger }: { icon: typeof Activity; label: string; value: number; accent?: boolean; highlight?: boolean; danger?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 shadow-soft ${
      danger ? "border-destructive/30 bg-destructive/5" :
      accent ? "border-primary/30 bg-primary/5" :
      highlight ? "border-amber-500/30 bg-amber-500/5" :
      "border-border bg-card"
    }`}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className={`h-3.5 w-3.5 ${danger ? "text-destructive" : accent ? "text-primary" : highlight ? "text-amber-600" : ""}`} />
        {label}
      </div>
      <div className={`mt-1 text-2xl font-bold ${danger ? "text-destructive" : ""}`}>{value.toLocaleString()}</div>
    </div>
  );
}

function Health({ label, ok, latency }: { label: string; ok: boolean; latency: string }) {
  return (
    <li className="flex items-center justify-between text-sm">
      <span className="inline-flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${ok ? "bg-emerald-500" : "bg-destructive"}`} />
        {label}
      </span>
      <span className="text-xs text-muted-foreground">{latency}</span>
    </li>
  );
}
