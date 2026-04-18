import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Users, Briefcase, CalendarCheck, Wallet, Star, Inbox, Tag, MapPin,
  TrendingUp, Loader2, ArrowUpRight, Activity,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/page-header";

export const Route = createFileRoute("/admin/console/overview")({
  component: OverviewPage,
});

type Stats = {
  customers: number;
  providers: number;
  pendingApps: number;
  totalBookings: number;
  newBookings: number;
  completedBookings: number;
  totalGross: number;
  totalCommission: number;
  pendingPayouts: number;
  reviews: number;
  avgRating: number;
  unreadSupport: number;
  categories: number;
  areas: number;
};

function OverviewPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentBookings, setRecentBookings] = useState<Array<{ id: string; full_name: string; category: string; area: string; status: string; created_at: string }>>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [customers, providers, apps, bookingsAll, ledger, reviews, support, cats, recent] = await Promise.all([
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "customer"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("provider_status", "approved"),
        supabase.from("provider_applications").select("id", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("bookings").select("id, status"),
        supabase.from("commission_ledger").select("gross_amount, commission_amount, provider_net, paid_out"),
        supabase.from("reviews").select("rating"),
        supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("handled", false),
        supabase.from("categories").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("bookings").select("id, full_name, category, area, status, created_at").order("created_at", { ascending: false }).limit(8),
      ]);
      if (cancelled) return;
      const bArr = bookingsAll.data ?? [];
      const lArr = ledger.data ?? [];
      const rArr = reviews.data ?? [];
      setStats({
        customers: customers.count ?? 0,
        providers: providers.count ?? 0,
        pendingApps: apps.count ?? 0,
        totalBookings: bArr.length,
        newBookings: bArr.filter((b) => b.status === "new").length,
        completedBookings: bArr.filter((b) => b.status === "completed").length,
        totalGross: lArr.reduce((s, r) => s + Number(r.gross_amount), 0),
        totalCommission: lArr.reduce((s, r) => s + Number(r.commission_amount), 0),
        pendingPayouts: lArr.filter((r) => !r.paid_out).reduce((s, r) => s + Number(r.provider_net), 0),
        reviews: rArr.length,
        avgRating: rArr.length ? rArr.reduce((s, r) => s + r.rating, 0) / rArr.length : 0,
        unreadSupport: support.count ?? 0,
        categories: cats.count ?? 0,
        areas: 0,
      });
      setRecentBookings((recent.data ?? []) as typeof recentBookings);
      setLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const kpis = useMemo(() => {
    if (!stats) return [];
    return [
      { label: "Customers", value: stats.customers.toLocaleString(), icon: Users, accent: "from-sky-500/15 to-sky-500/5", to: "/admin/console/customers" },
      { label: "Approved providers", value: stats.providers.toLocaleString(), icon: Briefcase, accent: "from-violet-500/15 to-violet-500/5", to: "/admin/console/providers" },
      { label: "Total bookings", value: stats.totalBookings.toLocaleString(), icon: CalendarCheck, accent: "from-emerald-500/15 to-emerald-500/5", to: "/admin/console/bookings", sub: `${stats.completedBookings} completed` },
      { label: "Gross volume", value: `BDT ${Math.round(stats.totalGross).toLocaleString()}`, icon: TrendingUp, accent: "from-amber-500/15 to-amber-500/5", to: "/admin/console/finance" },
    ];
  }, [stats]);

  if (loading || !stats) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Overview"
        title="Welcome back"
        description="Real-time pulse of bookings, providers, and revenue across the marketplace."
      />

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Link
              key={k.label}
              to={k.to}
              className={`group relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${k.accent} p-5 shadow-soft transition-all hover:shadow-elevated`}
            >
              <div className="flex items-start justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-background/80 backdrop-blur">
                  <Icon className="h-5 w-5 text-foreground" />
                </span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold">{k.value}</div>
                <div className="text-xs text-muted-foreground">{k.label}</div>
                {k.sub && <div className="mt-1 text-[11px] text-muted-foreground/80">{k.sub}</div>}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Action-required strip */}
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ActionTile to="/admin/console/providers" icon={Briefcase} label="New applications" value={stats.pendingApps} muted={stats.pendingApps === 0} />
        <ActionTile to="/admin/console/bookings" icon={CalendarCheck} label="Unassigned leads" value={stats.newBookings} muted={stats.newBookings === 0} />
        <ActionTile to="/admin/console/support" icon={Inbox} label="Open support" value={stats.unreadSupport} muted={stats.unreadSupport === 0} />
        <ActionTile to="/admin/console/finance" icon={Wallet} label="Pending payouts (BDT)" value={Math.round(stats.pendingPayouts)} muted={stats.pendingPayouts === 0} format="currency" />
      </div>

      {/* Two column: recent bookings + side panels */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent bookings</h2>
            <Link to="/admin/console/bookings" className="text-xs font-medium text-primary hover:underline">
              View all →
            </Link>
          </div>
          {recentBookings.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No bookings yet.</div>
          ) : (
            <ul className="divide-y divide-border">
              {recentBookings.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{b.full_name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {b.category} · {b.area} · {new Date(b.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusColor(b.status)}`}>
                    {b.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          <SidePanel
            icon={Star}
            title="Reviews"
            value={`${stats.avgRating.toFixed(1)} ★`}
            sub={`${stats.reviews.toLocaleString()} total reviews`}
            to="/admin/console/reviews"
          />
          <SidePanel
            icon={Wallet}
            title="Platform commission"
            value={`BDT ${Math.round(stats.totalCommission).toLocaleString()}`}
            sub="Lifetime earned"
            to="/admin/console/finance"
          />
          <SidePanel
            icon={Tag}
            title="Active categories"
            value={stats.categories.toString()}
            sub="Across the catalog"
            to="/admin/console/services"
          />
          <SidePanel
            icon={Activity}
            title="Operations"
            value="Healthy"
            sub="No incidents reported"
            to="/admin/console/operations"
          />
        </div>
      </div>
    </div>
  );
}

function statusColor(s: string) {
  switch (s) {
    case "new": return "bg-sky-500/15 text-sky-700 dark:text-sky-300";
    case "confirmed": return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
    case "assigned": return "bg-violet-500/15 text-violet-700 dark:text-violet-300";
    case "completed": return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
    case "cancelled": return "bg-rose-500/15 text-rose-700 dark:text-rose-300";
    default: return "bg-muted text-muted-foreground";
  }
}

function ActionTile({ to, icon: Icon, label, value, muted, format }: { to: string; icon: typeof Inbox; label: string; value: number; muted: boolean; format?: "currency" }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-xl border p-4 shadow-soft transition-all hover:shadow-elevated ${
        muted ? "border-border bg-card" : "border-primary/30 bg-primary/5"
      }`}
    >
      <span className={`grid h-9 w-9 place-items-center rounded-lg ${muted ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-lg font-bold">
          {format === "currency" ? `BDT ${value.toLocaleString()}` : value}
        </div>
      </div>
    </Link>
  );
}

function SidePanel({ icon: Icon, title, value, sub, to }: { icon: typeof Star; title: string; value: string; sub: string; to: string }) {
  return (
    <Link to={to} className="block rounded-2xl border border-border bg-card p-4 shadow-soft transition-shadow hover:shadow-elevated">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-xs text-muted-foreground">{title}</div>
          <div className="font-bold">{value}</div>
          <div className="truncate text-[11px] text-muted-foreground">{sub}</div>
        </div>
      </div>
    </Link>
  );
}
