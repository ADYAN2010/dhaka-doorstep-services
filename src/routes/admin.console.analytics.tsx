import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3, TrendingUp, TrendingDown, Users, CalendarCheck, Wallet,
  Loader2, Download,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

export const Route = createFileRoute("/admin/console/analytics")({
  component: AnalyticsPage,
});

const RANGES = { "7d": 7, "30d": 30, "90d": 90 } as const;
type Range = keyof typeof RANGES;

function AnalyticsPage() {
  const [range, setRange] = useState<Range>("30d");
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<{ created_at: string; category: string; area: string; status: string }[]>([]);
  const [ledger, setLedger] = useState<{ created_at: string; gross_amount: number; commission_amount: number }[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const cutoff = new Date(Date.now() - RANGES[range] * 86400000).toISOString();
      const [b, l] = await Promise.all([
        supabase.from("bookings").select("created_at, category, area, status").gte("created_at", cutoff),
        supabase.from("commission_ledger").select("created_at, gross_amount, commission_amount").gte("created_at", cutoff),
      ]);
      if (cancelled) return;
      setBookings((b.data ?? []) as typeof bookings);
      setLedger((l.data ?? []) as typeof ledger);
      setLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, [range]);

  const trend = useMemo(() => {
    const days = RANGES[range];
    const buckets: { date: string; bookings: number; revenue: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      buckets.push({ date: key, bookings: 0, revenue: 0 });
    }
    const idx = new Map(buckets.map((b, i) => [b.date, i]));
    bookings.forEach((b) => { const i = idx.get(b.created_at.slice(0, 10)); if (i !== undefined) buckets[i].bookings += 1; });
    ledger.forEach((l) => { const i = idx.get(l.created_at.slice(0, 10)); if (i !== undefined) buckets[i].revenue += Number(l.gross_amount); });
    return buckets.map((b) => ({ ...b, label: new Date(b.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }) }));
  }, [bookings, ledger, range]);

  const totals = useMemo(() => {
    const totalBookings = bookings.length;
    const completed = bookings.filter((b) => b.status === "completed").length;
    const cancelled = bookings.filter((b) => b.status === "cancelled").length;
    const revenue = ledger.reduce((s, l) => s + Number(l.gross_amount), 0);
    const commission = ledger.reduce((s, l) => s + Number(l.commission_amount), 0);
    const conversion = totalBookings ? (completed / totalBookings) * 100 : 0;
    // Compare to previous half to fake trend
    const half = Math.floor(trend.length / 2);
    const recentBookings = trend.slice(half).reduce((s, t) => s + t.bookings, 0);
    const earlyBookings = trend.slice(0, half).reduce((s, t) => s + t.bookings, 0);
    const bookingDelta = earlyBookings ? ((recentBookings - earlyBookings) / earlyBookings) * 100 : 0;
    const recentRev = trend.slice(half).reduce((s, t) => s + t.revenue, 0);
    const earlyRev = trend.slice(0, half).reduce((s, t) => s + t.revenue, 0);
    const revDelta = earlyRev ? ((recentRev - earlyRev) / earlyRev) * 100 : 0;
    return { totalBookings, completed, cancelled, revenue, commission, conversion, bookingDelta, revDelta };
  }, [bookings, ledger, trend]);

  const byCategory = useMemo(() => {
    const m = new Map<string, number>();
    bookings.forEach((b) => m.set(b.category, (m.get(b.category) ?? 0) + 1));
    return Array.from(m.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [bookings]);

  const byArea = useMemo(() => {
    const m = new Map<string, number>();
    bookings.forEach((b) => m.set(b.area, (m.get(b.area) ?? 0) + 1));
    return Array.from(m.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [bookings]);

  const funnel = useMemo(() => {
    const total = Math.max(1, bookings.length);
    return [
      { stage: "Created", count: bookings.length, pct: 100 },
      { stage: "Confirmed", count: bookings.filter((b) => ["confirmed", "assigned", "completed"].includes(b.status)).length, pct: 0 },
      { stage: "Assigned", count: bookings.filter((b) => ["assigned", "completed"].includes(b.status)).length, pct: 0 },
      { stage: "Completed", count: bookings.filter((b) => b.status === "completed").length, pct: 0 },
    ].map((s) => ({ ...s, pct: (s.count / total) * 100 }));
  }, [bookings]);

  function exportCsv() {
    const rows = ["date,bookings,revenue", ...trend.map((t) => `${t.date},${t.bookings},${t.revenue}`)];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `analytics-${range}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported CSV");
  }

  const PIE_COLORS = ["oklch(0.62 0.13 195)", "oklch(0.72 0.14 190)", "oklch(0.55 0.18 280)", "oklch(0.68 0.15 145)", "oklch(0.75 0.14 75)", "oklch(0.6 0.15 25)"];

  return (
    <div>
      <AdminPageHeader
        eyebrow="Analytics"
        title="Performance & growth"
        description="Trends across bookings, revenue, conversion, and demand by category and area."
        actions={
          <>
            <Select value={range} onValueChange={(v) => setRange(v as Range)}>
              <SelectTrigger className="w-[120px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-3.5 w-3.5" /> Export</Button>
          </>
        }
      />

      {loading ? (
        <div className="grid place-items-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi icon={CalendarCheck} label="Bookings" value={totals.totalBookings.toLocaleString()} delta={totals.bookingDelta} />
            <Kpi icon={Wallet} label="Revenue (BDT)" value={`৳${Math.round(totals.revenue).toLocaleString()}`} delta={totals.revDelta} accent />
            <Kpi icon={Users} label="Conversion" value={`${totals.conversion.toFixed(1)}%`} sub={`${totals.completed} completed`} />
            <Kpi icon={BarChart3} label="Commission" value={`৳${Math.round(totals.commission).toLocaleString()}`} sub="Platform earnings" />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Trend chart */}
            <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Trend</div>
                  <div className="text-base font-semibold">Bookings & revenue</div>
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="bookingsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.62 0.13 195)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="oklch(0.62 0.13 195)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.72 0.14 190)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="oklch(0.72 0.14 190)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 230)" />
                    <XAxis dataKey="label" stroke="oklch(0.5 0.03 235)" fontSize={11} />
                    <YAxis stroke="oklch(0.5 0.03 235)" fontSize={11} />
                    <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                    <Area type="monotone" dataKey="bookings" stroke="oklch(0.62 0.13 195)" strokeWidth={2} fill="url(#bookingsGrad)" />
                    <Area type="monotone" dataKey="revenue" stroke="oklch(0.72 0.14 190)" strokeWidth={2} fill="url(#revGrad)" yAxisId={0} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top categories pie */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Top categories</div>
              <div className="text-base font-semibold">Booking share</div>
              {byCategory.length === 0 ? (
                <div className="grid h-64 place-items-center text-sm text-muted-foreground">No data in range</div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={byCategory} dataKey="value" nameKey="name" outerRadius={80} innerRadius={45} paddingAngle={2}>
                        {byCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="mt-2 space-y-1">
                {byCategory.slice(0, 4).map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 truncate">
                      <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      {c.name}
                    </span>
                    <span className="text-muted-foreground">{c.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {/* Area bar chart */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="mb-3">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Demand</div>
                <div className="text-base font-semibold">Top areas</div>
              </div>
              {byArea.length === 0 ? (
                <div className="grid h-56 place-items-center text-sm text-muted-foreground">No data in range</div>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byArea} layout="vertical" margin={{ left: 0, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 230)" horizontal={false} />
                      <XAxis type="number" stroke="oklch(0.5 0.03 235)" fontSize={11} />
                      <YAxis type="category" dataKey="name" stroke="oklch(0.5 0.03 235)" fontSize={11} width={90} />
                      <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                      <Bar dataKey="value" fill="oklch(0.62 0.13 195)" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Conversion funnel */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="mb-3">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Conversion funnel</div>
                <div className="text-base font-semibold">Booking lifecycle</div>
              </div>
              <div className="space-y-3">
                {funnel.map((f, i) => (
                  <div key={f.stage}>
                    <div className="flex justify-between text-xs">
                      <span className="font-medium">{f.stage}</span>
                      <span className="text-muted-foreground">{f.count.toLocaleString()} · {f.pct.toFixed(1)}%</span>
                    </div>
                    <div className="mt-1 h-3 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-primary-glow transition-all"
                        style={{ width: `${Math.max(2, f.pct)}%`, opacity: 1 - i * 0.15 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Kpi({ icon: Icon, label, value, delta, sub, accent }: { icon: typeof BarChart3; label: string; value: string; delta?: number; sub?: string; accent?: boolean }) {
  const up = (delta ?? 0) >= 0;
  return (
    <div className={`rounded-2xl border p-5 shadow-soft ${accent ? "border-primary/30 bg-gradient-to-br from-primary/5 to-transparent" : "border-border bg-card"}`}>
      <div className="flex items-center justify-between">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-muted text-foreground">
          <Icon className="h-4 w-4" />
        </span>
        {delta !== undefined && (
          <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${up ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-destructive/15 text-destructive"}`}>
            {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(delta).toFixed(0)}%
          </span>
        )}
      </div>
      <div className="mt-3 text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{sub ?? label}</div>
    </div>
  );
}
