/**
 * /admin/console/overview — real dashboard backed by /api/admin/dashboard-stats.
 *
 * Shows totals (customers, providers, bookings, services, etc.) and the most
 * recent bookings. Auth is already enforced by the parent /admin/console route.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Loader2,
  AlertTriangle,
  Users,
  Briefcase,
  CalendarCheck,
  Tag,
  MapPin,
  ListChecks,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/console/overview")({
  component: AdminOverview,
});

type Totals = Partial<
  Record<
    | "customers"
    | "providers"
    | "bookings"
    | "bookings_new"
    | "bookings_completed"
    | "categories"
    | "services"
    | "cities"
    | "areas",
    number | null
  >
>;

type RecentBooking = {
  id: string;
  full_name: string;
  category: string;
  area: string;
  status: "new" | "confirmed" | "assigned" | "completed" | "cancelled" | string;
  preferred_date?: string | null;
  created_at: string;
};

type Stats = {
  configured: boolean;
  message?: string;
  totals?: Totals;
  recent_bookings?: RecentBooking[];
};

function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
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
      <AdminPageHeader
        title="Overview"
        description="Live counts and recent activity from the backend database."
      />

      {loading ? (
        <div className="grid place-items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
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
        <>
          <StatsGrid totals={stats?.totals ?? {}} />
          <RecentBookingsCard rows={stats?.recent_bookings ?? []} />
        </>
      )}
    </div>
  );
}

function StatsGrid({ totals }: { totals: Totals }) {
  const cards = [
    { label: "Customers", value: totals.customers, icon: Users, to: "/admin/console/customers" as const },
    { label: "Providers", value: totals.providers, icon: Briefcase, to: "/admin/console/providers" as const },
    {
      label: "Bookings",
      value: totals.bookings,
      icon: CalendarCheck,
      hint: `${totals.bookings_new ?? 0} new`,
      to: "/admin/console/bookings" as const,
    },
    {
      label: "Completed",
      value: totals.bookings_completed,
      icon: CheckCircle2,
      to: "/admin/console/bookings" as const,
    },
    { label: "Categories", value: totals.categories, icon: Tag, to: "/admin/console/services" as const },
    { label: "Services", value: totals.services, icon: ListChecks, to: "/admin/console/services" as const },
    { label: "Cities", value: totals.cities, icon: MapPin, to: "/admin/console/cities" as const },
    { label: "Areas", value: totals.areas, icon: MapPin, to: "/admin/console/locations" as const },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <StatCard key={c.label} {...c} />
      ))}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  to,
}: {
  label: string;
  value: number | null | undefined;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-border bg-card p-4 shadow-soft transition hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Icon className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums">
        {value === null || value === undefined ? "—" : value.toLocaleString()}
      </div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
    </Link>
  );
}

const STATUS_TONE: Record<string, string> = {
  new: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30",
  confirmed: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
  assigned: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
  completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  cancelled: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
};

function RecentBookingsCard({ rows }: { rows: RecentBooking[] }) {
  return (
    <div className="mt-6 rounded-2xl border border-border bg-card shadow-soft">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-bold">Recent bookings</h2>
          <p className="text-xs text-muted-foreground">Latest 5 requests received.</p>
        </div>
        <Link
          to="/admin/console/bookings"
          className="text-xs font-semibold text-primary hover:underline"
        >
          View all →
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="grid place-items-center py-12 text-sm text-muted-foreground">
          <Clock className="mb-2 h-5 w-5" />
          No bookings yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">Customer</th>
                <th className="px-4 py-2 text-left font-semibold">Category</th>
                <th className="px-4 py-2 text-left font-semibold">Area</th>
                <th className="px-4 py-2 text-left font-semibold">Status</th>
                <th className="px-4 py-2 text-left font-semibold">Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-2 font-medium">{r.full_name}</td>
                  <td className="px-4 py-2 text-muted-foreground">{r.category}</td>
                  <td className="px-4 py-2 text-muted-foreground">{r.area}</td>
                  <td className="px-4 py-2">
                    <Badge
                      variant="outline"
                      className={cn("border", STATUS_TONE[r.status] ?? "border-border")}
                    >
                      {r.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">
                    {formatDate(r.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
