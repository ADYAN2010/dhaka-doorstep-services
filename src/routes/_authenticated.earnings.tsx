import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  TrendingUp,
  Wallet,
  Coins,
  Send,
  Receipt,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FinanceFiltersBar,
  SummaryCardsRow,
  ChartCard,
  CategoryEarningsChart,
  PayoutDetailsDrawer,
  type FinanceFilters,
  type PayoutLite,
  type CategorySlice,
} from "@/components/finance";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/earnings")({
  component: EarningsPage,
  head: () => ({
    meta: [
      { title: "Earnings · Shebabd" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type LedgerRow = {
  id: string;
  booking_id: string;
  category: string;
  gross_amount: number;
  commission_rate: number;
  commission_amount: number;
  provider_net: number;
  currency: string;
  paid_out: boolean;
  payout_id: string | null;
  created_at: string;
};

type PayoutRow = {
  id: string;
  total_net: number;
  currency: string;
  method: string;
  reference: string | null;
  status: "pending" | "paid" | "failed";
  paid_at: string | null;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
  notes: string | null;
};

function fmt(n: number, cur: string = "BDT") {
  return `${cur} ${Number(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function inRange(iso: string, f: FinanceFilters) {
  if (f.from && new Date(iso) < new Date(f.from)) return false;
  if (f.to && new Date(iso) > new Date(f.to)) return false;
  return true;
}

function EarningsPage() {
  const { user, roles } = useAuth();
  const isProvider = roles.includes("provider");
  const [loading, setLoading] = useState(true);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [filters, setFilters] = useState<FinanceFilters>({});
  const [drawerPayout, setDrawerPayout] = useState<PayoutLite | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: l, error: le }, { data: p, error: pe }] = await Promise.all([
        supabase
          .from("commission_ledger")
          .select(
            "id, booking_id, category, gross_amount, commission_rate, commission_amount, provider_net, currency, paid_out, payout_id, created_at",
          )
          .eq("provider_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("payouts")
          .select(
            "id, total_net, currency, method, reference, status, paid_at, period_start, period_end, created_at, notes",
          )
          .eq("provider_id", user.id)
          .order("created_at", { ascending: false }),
      ]);
      if (cancelled) return;
      if (le) toast.error(le.message);
      if (pe) toast.error(pe.message);
      setLedger((l ?? []) as LedgerRow[]);
      setPayouts((p ?? []) as PayoutRow[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const filteredLedger = useMemo(() => {
    return ledger.filter((r) => {
      if (!inRange(r.created_at, filters)) return false;
      if (filters.category && r.category !== filters.category) return false;
      if (filters.status === "paid" && !r.paid_out) return false;
      if (filters.status === "pending" && r.paid_out) return false;
      return true;
    });
  }, [ledger, filters]);

  const filteredPayouts = useMemo(
    () =>
      payouts.filter((p) => {
        if (!inRange(p.created_at, filters)) return false;
        if (filters.status && filters.status !== "paid" && filters.status !== "pending" && p.status !== filters.status) return false;
        return true;
      }),
    [payouts, filters],
  );

  const totals = useMemo(() => {
    let lifetimeGross = 0;
    let lifetimeNet = 0;
    let pending = 0;
    let paidOut = 0;
    filteredLedger.forEach((r) => {
      lifetimeGross += Number(r.gross_amount);
      lifetimeNet += Number(r.provider_net);
      if (r.paid_out) paidOut += Number(r.provider_net);
      else pending += Number(r.provider_net);
    });
    return { lifetimeGross, lifetimeNet, pending, paidOut };
  }, [filteredLedger]);

  const categorySeries: CategorySlice[] = useMemo(() => {
    const m = new Map<string, number>();
    filteredLedger.forEach((r) => {
      m.set(r.category, (m.get(r.category) ?? 0) + Number(r.provider_net));
    });
    return Array.from(m.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredLedger]);

  const monthly = useMemo(() => {
    const m = new Map<string, number>();
    filteredLedger.forEach((r) => {
      const d = new Date(r.created_at);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      m.set(k, (m.get(k) ?? 0) + Number(r.provider_net));
    });
    return Array.from(m.entries())
      .sort()
      .slice(-6)
      .map(([k, v]) => ({ month: k.slice(5), value: v }));
  }, [filteredLedger]);

  const categoryOptions = useMemo(() => {
    const set = new Set(ledger.map((r) => r.category));
    return Array.from(set).map((c) => ({ value: c, label: c }));
  }, [ledger]);

  if (!isProvider) {
    return (
      <SiteShell>
        <div className="container-page py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Earnings are only available for providers.
          </p>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="container-page space-y-5 py-6 md:py-10">
        <div>
          <h1 className="mb-1 text-2xl font-bold tracking-tight md:text-3xl">Earnings</h1>
          <p className="text-sm text-muted-foreground">
            Track jobs completed, commission deducted, and payouts received.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-border bg-card py-20">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <FinanceFiltersBar
              value={filters}
              onChange={setFilters}
              categories={categoryOptions}
              statuses={[
                { value: "pending", label: "Pending payout" },
                { value: "paid", label: "Paid out" },
                { value: "failed", label: "Failed" },
              ]}
            />

            <SummaryCardsRow
              cards={[
                {
                  label: "Pending payout",
                  value: fmt(totals.pending),
                  icon: Send,
                  accent: totals.pending > 0 ? "warning" : "neutral",
                  hint: `${filteredLedger.filter((r) => !r.paid_out).length} jobs`,
                },
                {
                  label: "Paid out",
                  value: fmt(totals.paidOut),
                  icon: Wallet,
                  accent: "success",
                  hint: `${filteredPayouts.length} payouts`,
                },
                {
                  label: "Net earnings",
                  value: fmt(totals.lifetimeNet),
                  icon: Coins,
                  accent: "primary",
                  hint: `${filteredLedger.length} jobs`,
                },
                {
                  label: "Gross volume",
                  value: fmt(totals.lifetimeGross),
                  icon: TrendingUp,
                  accent: "neutral",
                  hint:
                    totals.lifetimeGross > 0
                      ? `${(((totals.lifetimeGross - totals.lifetimeNet) / totals.lifetimeGross) * 100).toFixed(1)}% commission`
                      : "—",
                },
              ]}
            />

            <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
              <ChartCard
                title="Earnings by category"
                subtitle="Net amount you took home per category"
              >
                <CategoryEarningsChart data={categorySeries} />
              </ChartCard>
              <ChartCard
                title="Monthly trend"
                subtitle={`Net per month · last ${monthly.length || 0} months`}
              >
                <MonthlyBars data={monthly} />
              </ChartCard>
            </div>

            <Tabs defaultValue="transactions">
              <TabsList>
                <TabsTrigger value="transactions">
                  <Receipt className="mr-1.5 h-3.5 w-3.5" /> Transactions
                </TabsTrigger>
                <TabsTrigger value="payouts">
                  <Wallet className="mr-1.5 h-3.5 w-3.5" /> Payouts
                </TabsTrigger>
              </TabsList>

              <TabsContent value="transactions" className="mt-4">
                <div className="overflow-hidden rounded-2xl border border-border bg-card">
                  {filteredLedger.length === 0 ? (
                    <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                      No completed jobs in this filter range.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Gross</TableHead>
                            <TableHead className="text-right">Commission</TableHead>
                            <TableHead className="text-right">Your net</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredLedger.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell className="text-xs text-muted-foreground">
                                {new Date(r.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-sm">{r.category}</TableCell>
                              <TableCell className="text-right text-sm">
                                {fmt(Number(r.gross_amount), r.currency)}
                              </TableCell>
                              <TableCell className="text-right text-xs text-muted-foreground">
                                -{fmt(Number(r.commission_amount), r.currency)} ({Number(r.commission_rate)}%)
                              </TableCell>
                              <TableCell className="text-right text-sm font-semibold">
                                {fmt(Number(r.provider_net), r.currency)}
                              </TableCell>
                              <TableCell>
                                <span
                                  className={cn(
                                    "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                                    r.paid_out
                                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                      : "bg-amber-500/15 text-amber-700 dark:text-amber-400",
                                  )}
                                >
                                  {r.paid_out ? "Paid out" : "Pending"}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="payouts" className="mt-4">
                <div className="overflow-hidden rounded-2xl border border-border bg-card">
                  {filteredPayouts.length === 0 ? (
                    <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                      No payouts yet. Pending earnings will be paid out by the Shebabd team.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Period</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Reference</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredPayouts.map((p) => (
                            <TableRow key={p.id}>
                              <TableCell className="text-xs text-muted-foreground">
                                {new Date(p.paid_at ?? p.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {p.period_start && p.period_end
                                  ? `${new Date(p.period_start).toLocaleDateString()} – ${new Date(p.period_end).toLocaleDateString()}`
                                  : "—"}
                              </TableCell>
                              <TableCell className="text-sm capitalize">
                                {p.method.replace("_", " ")}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {p.reference ?? "—"}
                              </TableCell>
                              <TableCell className="text-right text-sm font-semibold">
                                {fmt(Number(p.total_net), p.currency)}
                              </TableCell>
                              <TableCell>
                                <span
                                  className={cn(
                                    "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                                    p.status === "paid" && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
                                    p.status === "pending" && "bg-amber-500/15 text-amber-700 dark:text-amber-400",
                                    p.status === "failed" && "bg-rose-500/15 text-rose-700 dark:text-rose-400",
                                  )}
                                >
                                  {p.status}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7"
                                  onClick={() =>
                                    setDrawerPayout({
                                      id: p.id,
                                      providerId: user!.id,
                                      total: Number(p.total_net),
                                      currency: p.currency,
                                      method: p.method,
                                      reference: p.reference,
                                      status: p.status,
                                      paidAt: p.paid_at,
                                      periodStart: p.period_start,
                                      periodEnd: p.period_end,
                                      createdAt: p.created_at,
                                      notes: p.notes,
                                    })
                                  }
                                >
                                  <Eye className="mr-1 h-3.5 w-3.5" />
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}

        <PayoutDetailsDrawer
          payout={drawerPayout}
          open={!!drawerPayout}
          onOpenChange={(o) => !o && setDrawerPayout(null)}
        />
      </div>
    </SiteShell>
  );
}

function MonthlyBars({ data }: { data: { month: string; value: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        No monthly data yet
      </div>
    );
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex h-full items-end gap-3 px-2 pb-2 pt-6">
      {data.map((d) => {
        const h = (d.value / max) * 100;
        return (
          <div key={d.month} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-primary/70 to-primary transition-all"
              style={{ height: `${h}%`, minHeight: 6 }}
              title={fmt(d.value)}
            />
            <span className="text-[10px] text-muted-foreground">{d.month}</span>
          </div>
        );
      })}
    </div>
  );
}
