import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Users, Briefcase, CalendarCheck, Star, Inbox, Tag, MapPin, ClipboardList } from "lucide-react";
import { getDashboardStats } from "@/utils/admin.functions";
import type { DashboardStats } from "@/server/types";

export const Route = createFileRoute("/admin/mysql/")({
  component: MysqlOverview,
});

function MysqlOverview() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDashboardStats()
      .then((s) => {
        if (cancelled) return;
        setStats(s);
        setLoading(false);
      })
      .catch((e: Error) => {
        if (cancelled) return;
        if (e.message.includes("Unauthorized")) {
          navigate({ to: "/admin/mysql/login" });
          return;
        }
        setErr(e.message);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (err || !stats) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
        <strong>Failed to load dashboard.</strong>
        <p className="mt-1">{err ?? "Unknown error"}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          Check that the bridge URL, secret, and PHP `config.php` are configured
          and that the Hostinger DB is reachable.
        </p>
      </div>
    );
  }

  const cards = [
    { label: "Customers", value: stats.customers, icon: Users },
    { label: "Approved providers", value: stats.providers, icon: Briefcase },
    { label: "Pending providers", value: stats.pendingProviders, icon: ClipboardList },
    { label: "Total bookings", value: stats.bookings, icon: CalendarCheck },
    { label: "New bookings", value: stats.newBookings, icon: CalendarCheck },
    { label: "Completed bookings", value: stats.completedBookings, icon: CalendarCheck },
    { label: "Reviews", value: stats.reviews, icon: Star },
    { label: "Open tickets", value: stats.openTickets, icon: Inbox },
    { label: "Active categories", value: stats.categories, icon: Tag },
    { label: "Active cities", value: stats.cities, icon: MapPin },
  ];

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live counts pulled from your Hostinger MySQL database via the secure bridge.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="rounded-2xl border border-border bg-card p-4 shadow-soft"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="h-4 w-4" />
                <span className="text-xs">{c.label}</span>
              </div>
              <div className="mt-2 text-2xl font-bold">{c.value.toLocaleString()}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
