/**
 * /admin/backend — overview page (gated by /admin/backend layout).
 *
 * Shows current admin and live dashboard stats from GET /api/admin/dashboard-stats.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Users, Briefcase, CalendarCheck, Tag, MapPin, AlertTriangle } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { useBackendAuth } from "@/components/backend-auth-provider";

export const Route = createFileRoute("/admin/backend/")({
  component: BackendOverview,
});

type Stats = {
  configured: boolean;
  message?: string;
  totals?: Partial<Record<
    "customers" | "providers" | "bookings" | "bookings_new" | "bookings_completed" | "categories" | "services" | "cities" | "areas",
    number | null
  >>;
  recent_bookings?: Array<{
    id: string;
    full_name: string;
    category: string;
    area: string;
    status: string;
    created_at: string;
  }>;
};

function BackendOverview() {
  const { user } = useBackendAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api<Stats>("/api/admin/dashboard-stats")
      .then((s) => !cancelled && setStats(s))
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof ApiError) setErr(`${e.status} · ${e.message}`);
        else setErr(e instanceof Error ? e.message : "Failed to load stats");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {user?.full_name || user?.email}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You're authenticated against the Express backend with role{" "}
          <span className="font-medium text-foreground">{user?.role}</span>.
        </p>
      </header>

      {loading ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : err ? (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <div className="font-semibold">Couldn't load dashboard stats</div>
            <div className="mt-1 font-mono text-xs">{err}</div>
          </div>
        </div>
      ) : stats && !stats.configured ? (
        <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          {stats.message || "Database not configured."}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card icon={Users} label="Customers" value={stats?.totals?.customers} />
          <Card icon={Briefcase} label="Providers" value={stats?.totals?.providers} />
          <Card icon={CalendarCheck} label="Bookings" value={stats?.totals?.bookings} hint={`${stats?.totals?.bookings_new ?? 0} new`} />
          <Card icon={Tag} label="Categories" value={stats?.totals?.categories} />
          <Card icon={Tag} label="Services" value={stats?.totals?.services} />
          <Card icon={MapPin} label="Cities" value={stats?.totals?.cities} />
          <Card icon={MapPin} label="Areas" value={stats?.totals?.areas} />
          <Card icon={CalendarCheck} label="Completed" value={stats?.totals?.bookings_completed} />
        </div>
      )}
    </div>
  );
}

function Card({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | null | undefined;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums">
        {value === null || value === undefined ? "—" : value.toLocaleString()}
      </div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
